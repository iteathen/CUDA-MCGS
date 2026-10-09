import { createHash } from 'node:crypto';
import { isSharedArrayBuffer, isUint8Array } from 'node:util/types';
import { admitContinuation,canonicalBindingIdentity } from './continuation-plan.mjs';
import {admitSourcePartition,compileSourcePartition} from './source-partition.mjs';
import {executionPackageIdentity,preparationRecord,runtimeDescriptionSnapshot} from './admission-record.mjs';

const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
const typedArrayBuffer = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'buffer').get;
const typedArrayByteLength = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'byteLength').get;

const PACKAGE_SCHEMA = 'cuda-mcgs.execution-package/0.2.0';
const ADAPTER_SCHEMA = 'cuda-mcgs.cuda-js-adapter-requirements/0.2.0';
const CUDA_JS_REPOSITORY = 'iteathen/CUDA-JS';
const DEVICE_JS_INSPECTION_CAPABILITY = 'pure-cuda-free-public-program-semantic-inspection-shared-with-compile';
const UINT32_MAX = 0xffff_ffff;
const DEVICE_VIEW_WIDTH = Object.freeze({ u32: 4, u64: 8, i32: 4, f32: 4, f64: 8, f16: 2, bf16: 2 });
const DENSE_DEVICE_TYPE = /(?:^|<)(?:f64|f16|bf16)(?:>|$)/;
const CONTRACT_CAPABILITIES = new Map([
  ['cuda-js.device-js/0.1.0', 'deviceJsFrontend'],
  ['cuda-js.operation-lifecycle/0.1.0', 'gpuOperationLifecycle'],
  ['cuda-js.publication-mailbox/0.1.0', 'publicationMailboxes'],
  ['cuda-js.device-publication-release-acquire/0.1.0', 'deviceJsFrontend'],
  ['cuda-js.async-transfer/0.1.0','asyncTransfers'],
  ['cuda-js.scoped-atomic-observation/0.1.0','deviceJsFrontend'],
]);

function freeze(value) {
  if (value === null || typeof value !== 'object') return value;
  return Object.freeze(Array.isArray(value)
    ? value.map(freeze)
    : Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freeze(child)])));
}

function lowerFacts(error) {
  if (!error || typeof error !== 'object') return null;
  const facts = {};
  for (const key of ['code', 'category', 'operation', 'healthBefore', 'healthAfter']) if (error[key] !== undefined) facts[key] = error[key];
  if (error.details && typeof error.details === 'object') facts.details = freeze(error.details);
  return Object.freeze(facts);
}

export class CudaJsRuntimeAdapterError extends Error {
  constructor(code, phase, message, { classification = 'validation', lower = null, cleanup = null, cause = null } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'CudaJsRuntimeAdapterError';
    this.code = code;
    this.phase = phase;
    this.classification = classification;
    this.lower = lowerFacts(lower);
    this.cleanup = cleanup ? freeze(cleanup) : null;
  }
}

function fail(code, phase, message, options) {
  throw new CudaJsRuntimeAdapterError(code, phase, message, options);
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `${label} must be an object`);
  return value;
}

function exactObject(value, fields, label) {
  object(value, label);
  const allowed = new Set(fields);
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `${label} contains unknown key ${key}`);
  for (const key of fields) if (!Object.hasOwn(value, key)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `${label} is missing ${key}`);
  return value;
}

function decimal(value, label, positive = false) {
  if (typeof value !== 'string' || !/^(?:0|[1-9][0-9]*)$/.test(value)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `${label} must be a canonical unsigned decimal string`);
  const bigint = BigInt(value);
  if (bigint > BigInt(Number.MAX_SAFE_INTEGER) || (positive && bigint === 0n)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `${label} is outside the supported safe integer domain`);
  return Number(bigint);
}

function uint32(value, label) {
  if (!Number.isSafeInteger(value) || value < 0 || value > UINT32_MAX) fail('CUDA_JS_ADAPTER_INPUT', 'control', `${label} must be an unsigned 32-bit integer`);
  return value;
}

function dimensions(values, label) {
  if (!Array.isArray(values) || values.length !== 3) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `${label} must contain three dimensions`);
  const [x, y, z] = values.map((value, index) => decimal(value, `${label}[${index}]`, true));
  return { x, y, z };
}

function publicPackage(compatibility) {
  const name = compatibility?.package?.name;
  const version = compatibility?.package?.version;
  return typeof name === 'string' && typeof version === 'string' ? `${name}@${version}` : null;
}

function deviceType(type) {
  const sideband = /^sideband<(host-to-device|device-to-host),u32>$/.exec(type);
  return sideband ? `mailbox<${sideband[1]},u32>` : type;
}

function deviceFunctions(functions) {
  if (!Array.isArray(functions) || functions.length === 0) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'searchProgram.functions must be non-empty');
  return functions.map((fn) => {
    object(fn, 'searchProgram function');
    const kind = fn.executionRole === 'runtime-entry' ? 'kernel' : fn.executionRole === 'device-callable' ? 'device' : null;
    if (!kind || !Array.isArray(fn.parameters)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `function ${fn.name ?? '<missing>'} has an unsupported execution shape`);
    return { name: fn.name, kind, parameters: fn.parameters.map(({ name, type }) => ({ name, type: deviceType(type) })), returns: fn.returns };
  });
}

function admitPeer(executionPackage, cudaJs, peer) {
  object(peer, 'peer');
  const lower = object(cudaJs?.CUDA_JS_COMPATIBILITY, 'CUDA_JS_COMPATIBILITY');
  const requested = object(executionPackage.compatibility, 'execution package compatibility');
  const requestedPeer = object(requested.cudaJs, 'execution package cudaJs identity');
  if (requestedPeer.repository !== CUDA_JS_REPOSITORY || peer.repository !== CUDA_JS_REPOSITORY
      || requestedPeer.revision !== peer.revision || requestedPeer.package !== peer.package
      || publicPackage(lower) !== peer.package || String(lower?.publicApi?.schemaVersion) !== String(requested.apiSchema)) {
    fail('CUDA_JS_ADAPTER_PEER', 'admission', 'execution package, injected peer and public CUDA-JS identity must match exactly', { classification: 'unsupported-capability' });
  }
  if (requested.capabilityNegotiation !== 'pre-allocation-fail-closed' || requested.fallback !== 'none') fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'unsupported compatibility policy');
  if (typeof cudaJs.openCudaRuntime !== 'function' || typeof cudaJs.inspectDeviceProgram !== 'function' || typeof cudaJs.compileDeviceProgram !== 'function'
      || lower?.capabilities?.deviceJsInspection !== DEVICE_JS_INSPECTION_CAPABILITY) {
    fail('CUDA_JS_ADAPTER_CAPABILITY', 'admission', 'injected public CUDA-JS port lacks the required Device-JS inspection/compile surface', { classification: 'unsupported-capability' });
  }
  return lower;
}

function admitContracts(requirements, lower) {
  if (!Array.isArray(requirements.publicContracts) || requirements.publicContracts.length === 0) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'public CUDA-JS requirements are absent');
  const capabilities = object(lower.capabilities, 'CUDA-JS capabilities');
  for (const contract of requirements.publicContracts) {
    const capability = CONTRACT_CAPABILITIES.get(contract?.id);
    if (!capability || !capabilities[capability]) fail('CUDA_JS_ADAPTER_CAPABILITY', 'admission', `required public CUDA-JS contract is unavailable: ${contract?.id ?? '<missing>'}`, { classification: 'unsupported-capability' });
  }
}

function admitRequirementSelections(executionPackage,lower,peer) {
  const selected=executionPackage.cudaJsAdapter?.publicRequirementSelections;if(selected===undefined)return;
  if(!Array.isArray(selected)||selected.length<1||selected.length>64)fail('CUDA_JS_ADAPTER_REQUIREMENT_SELECTION','admission','consumer requirement selections must be a bounded array');
  let nodes=0;
  const canonical=(value,depth=0)=>{
    if(++nodes>10000||depth>24)fail('CUDA_JS_ADAPTER_REQUIREMENT_SELECTION','admission','consumer selection metadata exceeds closed JSON bounds');
    if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))return value;
    if(Array.isArray(value))return value.map(v=>canonical(v,depth+1));
    if(value&&typeof value==='object'&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null))return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k],depth+1)]));
    fail('CUDA_JS_ADAPTER_REQUIREMENT_SELECTION','admission','consumer selection metadata must be plain canonical JSON');
  };
  const json=value=>{nodes=0;const text=JSON.stringify(canonical(value));if(Buffer.byteLength(text,'utf8')>65536)fail('CUDA_JS_ADAPTER_REQUIREMENT_SELECTION','admission','consumer selection metadata exceeds byte bound');return text;};
  const contracts=executionPackage.cudaJsAdapter.publicContracts;
  if(!Array.isArray(contracts)||contracts.length!==selected.length||new Set(contracts.map(c=>c.id)).size!==contracts.length)fail('CUDA_JS_ADAPTER_REQUIREMENT_SELECTION','admission','consumer selections must cover exact required contract set');
  const seen=new Set(),metadata=json(lower),peerJson=json({repository:peer.repository,revision:peer.revision,package:peer.package});
  for(const selection of selected) {
    exactObject(selection,['reference','document'],'consumer selection');const reference=selection.reference,document=selection.document;
    exactObject(reference,['id','version','sha256'],'consumer selection reference');exactObject(document,['schema','owner','requirement','lower'],'consumer selection document');
    exactObject(document.requirement,['id','version','capability','value'],'consumer selected requirement');exactObject(document.lower,['peer','compatibility'],'consumer lower selection');
    const contract=contracts.find(c=>c.id===reference.id),capability=CONTRACT_CAPABILITIES.get(reference.id),text=json(document);
    if(seen.has(reference.id)||!contract||reference.version!=='0.1.0'||contract.version!==reference.version||contract.sha256!==reference.sha256||!/^[0-9a-f]{64}$/u.test(reference.sha256)||createHash('sha256').update(text,'utf8').digest('hex')!==reference.sha256||document.schema!=='cuda-mcgs.public-cuda-js-requirement-selection/0.1.0'||document.owner!=='CUDA-MCGS-consumer'||document.requirement.id!==reference.id||document.requirement.version!==reference.version||document.requirement.capability!==capability||document.requirement.value!==lower.capabilities?.[capability]||json(document.lower.compatibility)!==metadata||json(document.lower.peer)!==peerJson)fail('CUDA_JS_ADAPTER_REQUIREMENT_SELECTION','admission','consumer requirement bytes, public peer or capability selection differ',{classification:'unsupported-capability'});
    seen.add(reference.id);
  }
}

function compileOptions(requirements) {
  // Imported bodies are opaque: their signatures cannot exclude dense arithmetic
  // or scoped atomics. Select the public combined profile without parsing them.
  if ((requirements.searchProgram?.deviceImports?.length ?? 0) > 0) return Object.freeze({ headerProfile: 'cuda-device' });
  const contracts = new Set(requirements.publicContracts.map(({ id }) => id));
  const needsCccl = contracts.has('cuda-js.device-publication-release-acquire/0.1.0')
    || requirements.sidebandRequirements?.some(({ publication }) => publication === 'release-acquire');
  const needsDense = requirements.searchProgram?.functions?.some((fn) => fn.returns && DENSE_DEVICE_TYPE.test(fn.returns)
    || fn.parameters?.some(({ type }) => DENSE_DEVICE_TYPE.test(type)));
  if (needsCccl && needsDense) return Object.freeze({ headerProfile: 'cuda-device' });
  if (needsDense) return Object.freeze({ headerProfile: 'cuda-numeric' });
  return needsCccl ? Object.freeze({ headerProfile: 'cuda-cccl' }) : Object.freeze({});
}

function normalizeResourceView(source, resource, parameterName) {
  if (!Object.hasOwn(source, 'view')) return null;
  exactObject(source.view, ['dtype', 'byteOffset', 'elementCount'], `${parameterName} resource view`);
  const width = DEVICE_VIEW_WIDTH[source.view.dtype];
  if (!width) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `${parameterName} resource view dtype is unsupported`);
  const byteOffset = decimal(source.view.byteOffset, `${parameterName} resource view byteOffset`);
  const elementCount = decimal(source.view.elementCount, `${parameterName} resource view elementCount`, true);
  if (elementCount > Math.floor(Number.MAX_SAFE_INTEGER / width)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `${parameterName} resource view byteLength exceeds the safe integer domain`);
  const byteLength = elementCount * width;
  if (byteOffset % width !== 0 || byteOffset + byteLength > resource.byteLengthNumber) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `${parameterName} resource view range/alignment is invalid`);
  return { dtype: source.view.dtype, byteOffset: source.view.byteOffset, elementCount: source.view.elementCount, byteOffsetNumber: byteOffset, elementCountNumber: elementCount, byteLengthNumber: byteLength };
}

function admitPackage(executionPackage, lower, {allowController=false}={}) {
  if (executionPackage.schema !== PACKAGE_SCHEMA || executionPackage.status !== 'accepted') fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'unsupported execution package schema/status');
  const requirements = object(executionPackage.cudaJsAdapter, 'cudaJsAdapter requirements');
  if (requirements.schema !== ADAPTER_SCHEMA) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'unsupported adapter requirements schema');
  admitContracts(requirements, lower);
  if (requirements.searchLifecycle?.ignition !== 'device-owned' || requirements.searchLifecycle?.cancellation !== 'bounded-external-intent' || requirements.searchLifecycle?.completion !== 'device-owned-closure') fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'unsupported search lifecycle');
  if(requirements.continuation)return admitContinuation(executionPackage,lower,admitPackage,fail);
  if (!Array.isArray(requirements.operationRequirements) || requirements.operationRequirements.length !== 1) fail('CUDA_JS_ADAPTER_CAPABILITY', 'admission', 'v0 admits exactly one runtime operation', { classification: 'unsupported-capability' });
  const operation = requirements.operationRequirements[0];
  if (decimal(operation?.launchPolicy?.maxPending, 'operation maxPending', true) !== 1) fail('CUDA_JS_ADAPTER_CAPABILITY', 'admission', 'v0 admits maxPending=1 only', { classification: 'unsupported-capability' });

  const minimumAlignment = lower.capabilities?.deviceMemoryAllocationMinimumAlignmentBytes;
  if (!Number.isSafeInteger(minimumAlignment) || minimumAlignment <= 0) fail('CUDA_JS_ADAPTER_CAPABILITY', 'admission', 'public allocation-alignment capability is unavailable', { classification: 'unsupported-capability' });
  if (!Array.isArray(requirements.resourceRequirements)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'resourceRequirements must be an array');
  const resources = new Map();
  for (const resource of requirements.resourceRequirements) {
    const byteLength = decimal(resource.byteLength, `${resource.id} byteLength`, true);
    const alignment = decimal(resource.alignment, `${resource.id} alignment`, true);
    if (minimumAlignment % alignment !== 0) fail('CUDA_JS_ADAPTER_CAPABILITY', 'admission', `${resource.id} alignment cannot be guaranteed`, { classification: 'unsupported-capability' });
    if (!Array.isArray(resource.memorySpaces) || resource.memorySpaces.length === 0 || !Array.isArray(resource.accessRequirements) || resource.accessRequirements.length === 0) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `${resource.id} resource envelope is incomplete`);
    if (resources.has(resource.id)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `resource id repeats: ${resource.id}`);
    resources.set(resource.id, { ...resource, byteLengthNumber: byteLength });
  }

  if (!Array.isArray(requirements.deliveryRequirements) || requirements.deliveryRequirements.length !== 1) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'exactly one terminal delivery requirement is required');
  if (!lower.capabilities?.deviceMemory || !lower.capabilities?.asyncTransfers) fail('CUDA_JS_ADAPTER_CAPABILITY', 'admission', 'public asynchronous D2H transfer capability is unavailable', { classification: 'unsupported-capability' });
  const deliveries = new Map();
  for (const delivery of requirements.deliveryRequirements) {
    object(delivery, 'delivery requirement');
    if (deliveries.has(delivery.id) || delivery.role !== 'terminal-output' || delivery.readiness !== 'terminal-completed' || delivery.mode !== 'asynchronous-bounded-read' || delivery.lifetime !== 'terminal-result') fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `unsupported delivery requirement ${delivery.id ?? '<missing>'}`);
    const resource = resources.get(delivery.resource);
    const byteOffset = decimal(delivery.byteOffset, `${delivery.id} byteOffset`);
    const byteLength = decimal(delivery.byteLength, `${delivery.id} byteLength`, true);
    const maxTransfers = decimal(delivery.maxTransfers, `${delivery.id} maxTransfers`, true);
    if (!resource || !resource.accessRequirements.includes('read') || byteOffset + byteLength > resource.byteLengthNumber || !delivery.terminalSchema || !delivery.borrow || !delivery.asyncRead || !delivery.cleanup) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `${delivery.id} delivery range/contract is invalid`);
    deliveries.set(delivery.id, { ...delivery, byteOffsetNumber: byteOffset, byteLengthNumber: byteLength, maxTransfersNumber: maxTransfers });
  }

  if (!Array.isArray(requirements.sidebandRequirements)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'sidebandRequirements must be an array');
  const sidebands = new Map();
  for (const sideband of requirements.sidebandRequirements) {
    if (sideband.valueType !== 'u32' || sideband.publication !== 'release-acquire' || decimal(sideband.capacity, `${sideband.id} capacity`, true) !== 1 || !['host-to-device', 'device-to-host'].includes(sideband.direction)) fail('CUDA_JS_ADAPTER_CAPABILITY', 'admission', `${sideband.id} sideband shape is unsupported`, { classification: 'unsupported-capability' });
    if (sidebands.has(sideband.id)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `sideband id repeats: ${sideband.id}`);
    sidebands.set(sideband.id, sideband);
  }

  if (!Array.isArray(operation.bindings)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'operation bindings must be an array');
  const bindings = new Map();
  const allocatedResourceIds = new Set([...deliveries.values()].map(({ resource }) => resource));
  for (const binding of operation.bindings) {
    if (bindings.has(binding.parameter)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `binding repeats: ${binding.parameter}`);
    const source = binding.source;
    let normalizedBinding = binding;
    if (source?.kind === 'resource') {
      exactObject(source, ['kind', 'resource', 'access', ...['view', 'deviceEffects', 'initialContentSha256', 'initialization'].filter((key) => Object.hasOwn(source, key))], 'resource binding');
      const resource = resources.get(source.resource);
      if (!resource || !['read', 'write', 'read-write'].includes(source.access)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `invalid resource binding ${binding.parameter}`);
      const view = normalizeResourceView(source, resource, binding.parameter);
      normalizedBinding = { parameter: binding.parameter, source: { kind: 'resource', resource: source.resource, access: source.access, ...(view ? { view } : {}) } };
      if (Object.hasOwn(source, 'deviceEffects')) {
        const allowed = new Set(['atomic-add-relaxed-device', 'atomic-cas-relaxed-device', 'atomic-load-acquire-device', 'atomic-store-release-device']);
        const effects = source.deviceEffects;
        if (!view || !['u32', 'u64'].includes(view.dtype) || !resource.accessRequirements.includes('atomic')
            || !Array.isArray(effects) || effects.length === 0 || new Set(effects).size !== effects.length || effects.some((effect) => !allowed.has(effect))
            || source.access === 'write' || (effects.some((effect) => effect !== 'atomic-load-acquire-device') && source.access !== 'read-write')) {
          fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'invalid explicit device effects');
        }
        if (effects.some((effect) => effect.includes('acquire') || effect.includes('release'))
            && !requirements.publicContracts.some(({ id }) => id === 'cuda-js.device-publication-release-acquire/0.1.0')) {
          fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'device publication effects require their public contract');
        }
        normalizedBinding.source.deviceEffects = [...effects];
      }
      if (Object.hasOwn(source, 'initialContentSha256')) {
        if (!view || source.access !== 'read' || source.deviceEffects || !/^[0-9a-f]{64}$/.test(source.initialContentSha256)) {
          fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'immutable initial content requires a read-only explicit view and SHA-256');
        }
        normalizedBinding.source.initialContentSha256 = source.initialContentSha256;
      }
      if (Object.hasOwn(source, 'initialization')) {
        if (source.initialization !== 'zero' || !view || source.initialContentSha256) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'invalid zero initialization declaration');
        normalizedBinding.source.initialization = 'zero';
      }
      allocatedResourceIds.add(source.resource);
    } else if (source?.kind === 'sideband') {
      if (!sidebands.has(source.sideband)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `invalid sideband binding ${binding.parameter}`);
    } else if (source?.kind !== 'scalar' || !source.schema) {
      fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `unsupported binding ${binding.parameter}`);
    }
    bindings.set(binding.parameter, normalizedBinding);
  }

  for (const { source } of bindings.values()) if (source.initialContentSha256) {
    for (const { source: other } of bindings.values()) {
      if (other.kind !== 'resource' || other.resource !== source.resource) continue;
      const start = other.view?.byteOffsetNumber ?? 0;
      const length = other.view?.byteLengthNumber ?? resources.get(other.resource).byteLengthNumber;
      if (start < source.view.byteOffsetNumber + source.view.byteLengthNumber && source.view.byteOffsetNumber < start + length) {
        if (other.access !== 'read' || other.deviceEffects) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'immutable initial content overlaps mutable access');
        if (other.initialContentSha256 && (other.initialContentSha256 !== source.initialContentSha256 || start !== source.view.byteOffsetNumber || length !== source.view.byteLengthNumber)) {
          fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'overlapping immutable initial content disagrees');
        }
      }
    }
  }
  const searchProgram = object(requirements.searchProgram, 'searchProgram');
  const entry = searchProgram.functions?.find((fn) => fn.name === operation.function && fn.executionRole === 'runtime-entry');
  if(entry?.executionProfile!==undefined&&entry.executionProfile!=='device-continuation-v1')fail('CUDA_JS_ADAPTER_PACKAGE','admission','unknown execution profile');
  if(entry?.executionProfile==='device-continuation-v1'&&!allowController)fail('CUDA_JS_ADAPTER_CAPABILITY','admission','controller requires a declared continuation',{classification:'unsupported-capability'});
  if (!entry || !Array.isArray(entry.parameters) || entry.parameters.length !== bindings.size || entry.parameters.some(({ name }) => !bindings.has(name))) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'runtime entry and operation bindings differ');
  const reachable=operation.reachableFunctions;
  if(reachable!==undefined&&(!Array.isArray(reachable)||new Set(reachable).size!==reachable.length||!reachable.includes(operation.function)||reachable.some(name=>!searchProgram.functions.some(fn=>fn.name===name))))fail('CUDA_JS_ADAPTER_PACKAGE','admission','operation reachable function closure is invalid');
  for (const fn of searchProgram.functions.filter(fn=>reachable===undefined||reachable.includes(fn.name))) {
    if (Object.hasOwn(fn, 'launchConstraint')) {
      exactObject(fn.launchConstraint, ['grid', 'block'], 'launch constraint');
      for (const key of ['grid', 'block']) {
        const expected = dimensions(fn.launchConstraint[key], `constraint ${key}`);
        const actual = dimensions(operation.launchPolicy[key], key);
        if (['x', 'y', 'z'].some((dimension) => expected[dimension] !== actual[dimension])) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'operation violates callable launch constraint');
      }
    }
  }
  for (const parameter of entry.parameters) {
    const binding = bindings.get(parameter.name);
    if (binding.source.kind === 'resource' && binding.source.view && parameter.type !== `ptr<${binding.source.view.dtype}>`) {
      fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `${parameter.name} resource view dtype differs from the runtime entry parameter`);
    }
  }
  const allocatedResources = new Map([...resources].filter(([id]) => allocatedResourceIds.has(id)));
  return {
    operation, resources, allocatedResources, sidebands, deliveries, bindings, searchProgram, entry,
    functions: deviceFunctions(searchProgram.functions),
    compile: compileOptions(requirements),
    launch: { grid: dimensions(operation.launchPolicy.grid, 'grid'), block: dimensions(operation.launchPolicy.block, 'block'), sharedMemoryBytes: decimal(operation.launchPolicy.dynamicSharedBytes, 'dynamicSharedBytes') },
  };
}

function cleanupFailure(label, error) {
  return Object.freeze({ label, lower: lowerFacts(error) });
}

async function closeOne(label, value, owned, failures) {
  if (!value || typeof value.close !== 'function') return true;
  const prior = owned.failedClosures.get(label);
  if (prior) {
    failures.push(prior);
    return false;
  }
  try {
    await value.close();
    return true;
  } catch (error) {
    const failure = cleanupFailure(label, error);
    owned.failedClosures.set(label, failure);
    failures.push(failure);
    return false;
  }
}

function cleanupReport(failures, runtime, retained) {
  const unhealthy = runtime && (runtime.graceful === false || runtime.restartRequired === true);
  return Object.freeze({
    status: failures.length === 0 && !unhealthy && retained.size === 0 ? 'complete' : 'quarantined',
    failures: Object.freeze(failures),
    runtime: runtime ? freeze(runtime) : null,
    ...(retained.size > 0 ? { retained: Object.freeze([...retained]) } : {}),
  });
}

async function cleanup(owned) {
  const failures = [];
  const retained = new Set();
  let runtime = null;
  let externalChildrenTerminal=true;
  for(const [id,child]of [...(owned.externalChildren??[])].reverse()) {
    try{await child.close();owned.externalChildren.delete(id);}catch(error){externalChildrenTerminal=false;failures.push(cleanupFailure(`external:${id}`,error));retained.add(`external:${id}`);}
  }
  if(!externalChildrenTerminal) {
    if(owned.operation)retained.add('operation');if(owned.module)retained.add('module');if(owned.runtime)retained.add('runtime');
    for(const id of owned.memories.keys())retained.add(`memory:${id}`);for(const id of owned.views.keys())retained.add(`view:${id}`);for(const id of owned.mailboxes.keys())retained.add(`mailbox:${id}`);
    return cleanupReport(failures,runtime,retained);
  }

  let deliveryChildrenTerminal = true;
  for (const [id, operation] of [...owned.deliveryOperations].reverse()) {
    const label = `delivery-operation:${id}`;
    const closed = await closeOne(label, operation, owned, failures);
    if (closed) owned.deliveryOperations.delete(id);
    else {
      deliveryChildrenTerminal = false;
      retained.add(label);
    }
  }

  const operationTerminal = await closeOne('operation', owned.operation, owned, failures);
  if (operationTerminal) owned.operation = null;
  else if (owned.operation) retained.add('operation');

  if (!operationTerminal) {
    for(const name of owned.functions?.keys()??[])retained.add(`function:${name}`);
    if (owned.function) retained.add('function');
    if (owned.module) retained.add('module');
    for (const id of owned.mailboxes.keys()) retained.add(`mailbox:${id}`);
    for (const id of owned.views.keys()) retained.add(`view:${id}`);
    for (const id of owned.memories.keys()) retained.add(`memory:${id}`);
    if (owned.runtime) retained.add('runtime');
    return cleanupReport(failures, runtime, retained);
  }

  let functionTerminal = await closeOne('function', owned.function, owned, failures);
  if (functionTerminal) owned.function = null;
  else if (owned.function) retained.add('function');
  for(const [name,fn]of [...(owned.functions??[])].reverse()){if(await closeOne(`function:${name}`,fn,owned,failures))owned.functions.delete(name);else{functionTerminal=false;retained.add(`function:${name}`);}}

  let moduleTerminal = functionTerminal;
  if (functionTerminal) {
    moduleTerminal = await closeOne('module', owned.module, owned, failures);
    if (moduleTerminal) owned.module = null;
    else if (owned.module) retained.add('module');
  } else if (owned.module) {
    retained.add('module');
  }

  let mailboxChildrenTerminal = true;
  for (const [id, mailbox] of [...owned.mailboxes].reverse()) {
    const label = `mailbox:${id}`;
    const closed = await closeOne(label, mailbox, owned, failures);
    if (closed) owned.mailboxes.delete(id);
    else {
      mailboxChildrenTerminal = false;
      retained.add(label);
    }
  }

  let viewChildrenTerminal = true;
  const closedViews=new Map();
  for (const [id, view] of [...owned.views].reverse()) {
    const label = `view:${id}`;
    let closed=closedViews.get(view);if(closed===undefined){closed=await closeOne(label,view,owned,failures);closedViews.set(view,closed);}
    if (closed) owned.views.delete(id);
    else {
      viewChildrenTerminal = false;
      retained.add(label);
    }
  }

  if (!deliveryChildrenTerminal || !viewChildrenTerminal) {
    for (const id of owned.memories.keys()) retained.add(`memory:${id}`);
  }

  let memoryChildrenTerminal = deliveryChildrenTerminal && viewChildrenTerminal;
  if (memoryChildrenTerminal) {
    for (const [id, memory] of [...owned.memories].reverse()) {
      const label = `memory:${id}`;
      const closed = await closeOne(label, memory, owned, failures);
      if (closed) owned.memories.delete(id);
      else {
        memoryChildrenTerminal = false;
        retained.add(label);
      }
    }
  }

  const allChildrenTerminal = deliveryChildrenTerminal
    && functionTerminal
    && moduleTerminal
    && mailboxChildrenTerminal
    && viewChildrenTerminal
    && memoryChildrenTerminal;

  if (allChildrenTerminal && owned.runtime?.close) {
    const prior = owned.failedClosures.get('runtime');
    if (prior) {
      failures.push(prior);
      retained.add('runtime');
    } else {
      try {
        runtime = await owned.runtime.close();
        owned.runtime = null;
      } catch (error) {
        const failure = cleanupFailure('runtime', error);
        owned.failedClosures.set('runtime', failure);
        failures.push(failure);
        retained.add('runtime');
      }
    }
  } else if (owned.runtime) {
    retained.add('runtime');
  }

  return cleanupReport(failures, runtime, retained);
}

function wrapped(code, phase, message, error, classification, report = null) {
  const effective = error?.category === 'unsupported' ? 'unsupported-capability' : error?.category === 'validation' ? 'validation' : classification;
  return new CudaJsRuntimeAdapterError(code, phase, message, { classification: effective, lower: error, cleanup: report, cause: error });
}

function preflightDeviceProgram(cudaJs, plan, imports) {
  let inspected;
  try {
    inspected = cudaJs.inspectDeviceProgram({ source: plan.compilationSource??plan.searchProgram.source, functions: plan.compilationFunctions??plan.functions, compile: plan.compile,...(imports?{imports}:{}) });
  } catch (error) {
    throw wrapped('CUDA_JS_ADAPTER_DEVICE_JS_PREFLIGHT', 'admission', plan.compilationSource?'CUDA-JS rejected the declared main program before resident preparation':'CUDA-JS rejected the Search Program before runtime creation', error, 'validation');
  }
  if (inspected?.schemaVersion !== 1 || !inspected.deviceProgram || inspected.inspection?.compile === undefined || !Array.isArray(inspected.inspection?.publicHelperUsage)) {
    fail('CUDA_JS_ADAPTER_DEVICE_JS_PREFLIGHT', 'admission', 'CUDA-JS inspection returned an incomplete public result', { classification: 'unsupported-capability' });
  }
  for (const [key, value] of Object.entries(plan.compile)) {
    if (inspected.inspection.compile?.[key] !== value) {
      fail('CUDA_JS_ADAPTER_DEVICE_JS_PREFLIGHT', 'admission', `CUDA-JS inspection changed selected compile option ${key}`, { classification: 'validation' });
    }
  }
  if(plan.continuation)for(const operation of plan.operations.values()) {
    const kernel=inspected.deviceProgram.kernels?.find(k=>k.name===operation.operation.function);
    if(!kernel||(kernel.executionProfile??'ordinary')!==(operation.entry.executionProfile??'ordinary'))fail('CUDA_JS_ADAPTER_DEVICE_JS_PREFLIGHT','admission','returned controller profile differs from declared operation',{classification:'unsupported-capability'});
  }
  return inspected;
}

function bindingKey(plan,operation,name){return plan.continuation?`${operation.id}/${name}`:name;}
function launchArguments(plan,operationPlan,owned,scalars) {
  const args=[],accesses=[];
  for(const [index,parameter]of operationPlan.entry.parameters.entries()) {
    const {source}=operationPlan.bindings.get(parameter.name);
    if(source.kind==='resource') {
      const view=source.view;args.push(view?owned.views.get(bindingKey(plan,operationPlan.operation,parameter.name)):owned.memories.get(source.resource));
      let mode=source.access;
      if(plan.continuation&&source.deviceEffects)mode=source.deviceEffects.every(effect=>effect==='atomic-load-acquire-device')?'atomic-observe-relaxed-device':'atomic-update-relaxed-device';
      accesses.push({argumentIndex:index,byteOffset:0,byteLength:view?.byteLengthNumber??plan.resources.get(source.resource).byteLengthNumber,mode,...(mode.startsWith('atomic-')?{dtype:view.dtype}:{})});
    } else if(source.kind==='sideband')args.push({kind:'publication-mailbox',mailbox:owned.mailboxes.get(source.sideband),lane:source.sideband});
    else args.push(scalars.get(parameter.name));
  }
  return {arguments:args,accesses,...operationPlan.launch};
}
function operationScalars(operationPlan,values) {
  const names=new Set([...operationPlan.bindings.values()].filter(b=>b.source.kind==='scalar').map(b=>b.parameter));
  const supplied=inputRecord(values,names,'scalar inputs');const result=new Map();
  for(const parameter of operationPlan.entry.parameters)if(operationPlan.bindings.get(parameter.name).source.kind==='scalar'){
    if(!Object.hasOwn(supplied,parameter.name))fail('CUDA_JS_ADAPTER_INPUT','ignition',`missing scalar value for ${parameter.name}`);
    result.set(parameter.name,scalar(parameter.type,supplied[parameter.name],parameter.name));
  }
  return result;
}

function inputRecord(value, allowed, label) {
  if (value === undefined) return {};
  object(value, label);
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail('CUDA_JS_ADAPTER_INPUT', 'ignition', `${label} contains unknown key ${key}`);
  return value;
}

function scalar(type, value, label) {
  if (type === 'u64') {
    if (typeof value !== 'bigint' || value < 0n || value > 0xffff_ffff_ffff_ffffn) fail('CUDA_JS_ADAPTER_INPUT', 'ignition', `${label} must be a u64 bigint`);
    return value;
  }
  if (type === 'u32') return uint32(value, label);
  if (type === 'i32') {
    if (!Number.isSafeInteger(value) || value < -0x8000_0000 || value > 0x7fff_ffff) fail('CUDA_JS_ADAPTER_INPUT', 'ignition', `${label} must be an i32 integer`);
    return value;
  }
  if (['f32', 'f64', 'f16', 'bf16'].includes(type)) {
    if (typeof value !== 'number') fail('CUDA_JS_ADAPTER_INPUT', 'ignition', `${label} must be numeric`);
    return value;
  }
  if (type === 'bool') {
    if (typeof value !== 'boolean') fail('CUDA_JS_ADAPTER_INPUT', 'ignition', `${label} must be boolean`);
    return value ? 1 : 0;
  }
  fail('CUDA_JS_ADAPTER_INPUT', 'ignition', `${label} has unsupported scalar type ${type}`);
}

// Read typed-array internal state and copy its elements, not a caller-provided
// iterator, species, buffer getter or byteLength property. Host snapshotting owns
// initialization admission here; it creates no additional public admission API.
function snapshotInitialization(bytes, byteLength, id) {
  if (!isUint8Array(bytes) || typedArrayByteLength.call(bytes) !== byteLength) {
    fail('CUDA_JS_ADAPTER_INPUT', 'ignition', `${id} initial bytes must exactly match byteLength`);
  }
  if (isSharedArrayBuffer(typedArrayBuffer.call(bytes))) {
    fail('CUDA_JS_ADAPTER_INPUT', 'ignition', 'shared initialization bytes require an explicit coherent-snapshot contract');
  }
  const snapshot = new Uint8Array(bytes);
  if (snapshot.byteLength !== byteLength) fail('CUDA_JS_ADAPTER_INPUT', 'ignition', `${id} snapshot extent differs from the admitted resource`);
  return snapshot;
}

class ExternalExecution {
  #owned;#id;#declaration;#lower;#lowerClosed=false;#closed=false;#busy=false;#deliveryAttempted=false;
  constructor(owned,id,declaration,lower){this.kind='cuda-js-external-operation';this.state='running';this.#owned=owned;this.#id=id;this.#declaration=declaration;this.#lower=lower;}
  get activeDelivery(){return this.#busy;}
  async #closeLower() {
    if(this.#lowerClosed)return;
    const failures=[];
    if(!await closeOne(`external-operation:${this.#id}`,this.#lower,this.#owned,failures))throw new CudaJsRuntimeAdapterError('CUDA_JS_ADAPTER_EXTERNAL_CLEANUP','cleanup','external operation cleanup was not proved',{classification:'cleanup',cleanup:cleanupReport(failures,null,new Set([`external:${this.#id}`,'runtime']))});
    this.#lowerClosed=true;
  }
  async wait() {
    if(this.#closed)fail('CUDA_JS_ADAPTER_STATE','completion','external operation is closed');
    let status;
    try{status=await this.#lower.wait();}catch(error){throw wrapped('CUDA_JS_ADAPTER_EXTERNAL','completion','external operation wait failed',error,'operation');}
    if(status?.status!=='completed')throw wrapped('CUDA_JS_ADAPTER_EXTERNAL','completion','external operation did not complete',status?.failure??{code:'EXTERNAL_NOT_COMPLETED',category:'operation',details:status??{}},'operation');
    this.state='completed';return Object.freeze({state:this.state,operation:freeze(status)});
  }
  async deliver() {
    if(this.#closed||this.state!=='completed'||this.#busy||this.#deliveryAttempted)fail('CUDA_JS_ADAPTER_STATE','delivery','external delivery requires completed non-busy child with unused delivery');
    const delivery=this.#declaration.delivery;if(!delivery)fail('CUDA_JS_ADAPTER_INPUT','delivery','external operation has no declared delivery');
    this.#busy=true;this.#deliveryAttempted=true;let transfer=null;const id=`external-delivery:${this.#id}`;
    try {
      await this.#closeLower();
      transfer=await this.#owned.memories.get(delivery.resource).readAsync({deviceOffset:delivery.byteOffsetNumber,byteLength:delivery.byteLengthNumber});
      this.#owned.deliveryOperations.set(id,transfer);
      const status=await transfer.wait();const bytes=status?.result?.bytes;
      if(status?.status!=='completed'||!(bytes instanceof Uint8Array)||bytes.byteLength!==delivery.byteLengthNumber)fail('CUDA_JS_ADAPTER_DELIVERY','delivery','external copied result differs from declared range',{classification:'operation'});
      return Object.freeze({operation:this.#declaration.operation,role:this.#declaration.role,resource:delivery.resource,view:freeze(delivery.view),bytes:new Uint8Array(bytes)});
    } catch(error){if(error instanceof CudaJsRuntimeAdapterError)throw error;throw wrapped('CUDA_JS_ADAPTER_EXTERNAL','delivery','external delivery failed',error,'operation');}
    finally {
      try{if(transfer){const failures=[];if(await closeOne(`delivery-operation:${id}`,transfer,this.#owned,failures))this.#owned.deliveryOperations.delete(id);else throw new CudaJsRuntimeAdapterError('CUDA_JS_ADAPTER_DELIVERY_CLEANUP','cleanup','external delivery cleanup was not proved',{classification:'cleanup',cleanup:cleanupReport(failures,null,new Set([`delivery-operation:${id}`,`memory:${delivery.resource}`,'runtime']))});}}
      finally{this.#busy=false;}
    }
  }
  async close(){if(this.#closed)return Object.freeze({state:'closed',repeated:true});if(this.#busy)fail('CUDA_JS_ADAPTER_STATE','cleanup','external delivery is in flight');await this.#closeLower();this.#closed=true;this.state='closed';this.#owned.externalChildren.delete(this.#id);return Object.freeze({state:'closed'});}
}

class PreparedExecution {
  #plan;
  #owned;
  #closed = false;
  #activeDeliveries = 0;
  #closeReport = null;
  #externalSubmitting = false;
  #coldInitializing = false;
  #activeDescriptions = 0;
  #initializationState = 'not-started';
  #initializationOperationCount = 0;
  constructor(plan, owned) { this.kind = 'cuda-js-execution'; this.state = 'prepared'; this.#plan = plan; this.#owned = owned; }

  async ignite(inputs = {}) {
    if (this.#closed || this.state !== 'prepared') fail('CUDA_JS_ADAPTER_STATE', 'ignition', `cannot ignite from state ${this.state}`);
    object(inputs, 'runtime inputs');
    const resourceInputs = inputRecord(inputs.resources, this.#plan.allocatedResources, 'resource inputs');
    if (inputs.scalars !== undefined) {
      object(inputs.scalars, 'scalar input operations');
      for (const operationId of Object.keys(inputs.scalars)) if (this.#plan.continuation?!this.#plan.nodes.has(operationId)&&!this.#plan.initializationOperations.has(operationId):operationId !== this.#plan.operation.id) fail('CUDA_JS_ADAPTER_INPUT', 'ignition', `unknown scalar operation ${operationId}`);
    }
    const scalarByOperation=new Map();
    for(const operationId of this.#plan.continuation?[...this.#plan.initializationOperations.keys(),...this.#plan.nodes.keys()]:[this.#plan.operation.id]){
      const operationPlan=this.#plan.operations?.get(operationId)??this.#plan;
      scalarByOperation.set(operationId,operationScalars(operationPlan,inputs.scalars?.[operationId]));
    }
    if(this.#plan.continuation) {
      const sharedScalars=new Map();
      for(const id of this.#plan.nodes.keys()){const op=this.#plan.operations.get(id);for(const parameter of op.entry.parameters)if(op.bindings.get(parameter.name).source.kind==='scalar'){
        const key=canonicalBindingIdentity(op,parameter),value=scalarByOperation.get(id).get(parameter.name);
        if(sharedScalars.has(key)&&!Object.is(sharedScalars.get(key),value))fail('CUDA_JS_ADAPTER_INPUT','ignition','shared canonical scalar declaration has different per-node values');
        sharedScalars.set(key,value);
      }}
    }

    const initialSnapshots = new Map();

    for (const [id, resource] of this.#plan.allocatedResources) {
      const modes = [...this.#plan.bindings.values()].filter(({ source }) => source.kind === 'resource' && source.resource === id).map(({ source }) => source.access);
      const bytes = resourceInputs[id];
      if (bytes === undefined && modes.some((mode) => mode !== 'write')) fail('CUDA_JS_ADAPTER_INPUT', 'ignition', `${id} requires explicit initial bytes`);
      if (bytes !== undefined) initialSnapshots.set(id, snapshotInitialization(bytes, resource.byteLengthNumber, id));
    }
    // All snapshots and digests are checked before the first asynchronous write.
    for (const { source } of this.#plan.bindings.values()) if (source.initialContentSha256) {
      const bytes = initialSnapshots.get(source.resource);
      const start = source.view.byteOffsetNumber;
      const digest = createHash('sha256').update(bytes.subarray(start, start + source.view.byteLengthNumber)).digest('hex');
      if (digest !== source.initialContentSha256) fail('CUDA_JS_ADAPTER_INPUT', 'ignition', 'immutable initial content digest mismatch');
    }
    for (const { source } of this.#plan.bindings.values()) if (source.initialization === 'zero') {
      const bytes = initialSnapshots.get(source.resource);
      if (!bytes || bytes.subarray(source.view.byteOffsetNumber, source.view.byteOffsetNumber + source.view.byteLengthNumber).some((value) => value !== 0)) {
        fail('CUDA_JS_ADAPTER_INPUT', 'ignition', 'declared zero initialization is absent or nonzero');
      }
    }
    this.state = 'initializing';
    this.#initializationState='pending';
    this.#coldInitializing=Boolean(this.#plan.initializationOperations?.size);
    for (const [id] of this.#plan.allocatedResources) {
      if (this.#closed) fail('CUDA_JS_ADAPTER_STATE', 'initialization', 'execution closed during initialization');
      const bytes = initialSnapshots.get(id);
      if (bytes === undefined) continue;
      try { await this.#owned.memories.get(id).write(bytes); }
      catch (error) {
        const report = await cleanup(this.#owned); this.#closeReport = report; this.#closed = true; this.state = 'closed';
        this.#coldInitializing=false;
        throw wrapped('CUDA_JS_ADAPTER_ALLOCATION', 'initialization', `failed to initialize ${id}`, error, 'allocation', report);
      }
    }


    const initializationResults=[];
    try {
      if (this.#closed) fail('CUDA_JS_ADAPTER_STATE', 'ignition', 'execution closed before submission');
      for(const item of this.#plan.initializationOperations?.values()??[]) {
        const operationPlan=this.#plan.operations.get(item.operation),id=`initialization:${item.operation}`;
        let child;
        try {
          const lower=await this.#owned.operationFunctions.get(item.operation).submit(launchArguments(this.#plan,operationPlan,this.#owned,scalarByOperation.get(item.operation)));
          child=new ExternalExecution(this.#owned,id,{operation:item.operation,role:'cold-initialization'},lower);this.#owned.externalChildren.set(id,child);
          await child.wait();await child.close();
          const d=item.readiness,transferId=`initialization-readiness:${item.operation}`;
          const transfer=await this.#owned.memories.get(d.resource).readAsync({deviceOffset:d.byteOffsetNumber,byteLength:d.byteLengthNumber});this.#owned.deliveryOperations.set(transferId,transfer);
          try {
            const status=await transfer.wait(),bytes=status?.result?.bytes;
            if(status?.status!=='completed'||!(bytes instanceof Uint8Array)||bytes.byteLength!==d.byteLengthNumber||new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(d.wordOffsetNumber*4,true)!==d.valueNumber)fail('CUDA_JS_ADAPTER_INITIALIZATION','initialization','GPU-owned cold admission did not publish declared readiness',{classification:'validation'});
            initializationResults.push(Object.freeze({operation:item.operation,resource:d.resource,view:Object.freeze({dtype:d.view.dtype,byteOffset:d.view.byteOffset,elementCount:d.view.elementCount}),bytes:new Uint8Array(bytes)}));
          } finally {
            const failures=[];if(await closeOne(`delivery-operation:${transferId}`,transfer,this.#owned,failures))this.#owned.deliveryOperations.delete(transferId);else fail('CUDA_JS_ADAPTER_INITIALIZATION','cleanup','cold readiness transfer cleanup was not proved',{classification:'cleanup'});
          }
        } catch(error){if(error instanceof CudaJsRuntimeAdapterError&&error.code==='CUDA_JS_ADAPTER_INITIALIZATION')throw error;throw wrapped('CUDA_JS_ADAPTER_INITIALIZATION','initialization','GPU-owned cold initialization failed',error,'operation');}
      }
      if(this.#plan.continuation) {
        const bindings={},sharedKeys=new Map();let sequence=0;
        const nodes=[...this.#plan.nodes.values()].map(node=>{
          const operationPlan=this.#plan.operations.get(node.operation);
          const launch=launchArguments(this.#plan,operationPlan,this.#owned,scalarByOperation.get(node.operation));
          return {id:node.operation,after:node.after,function:this.#owned.operationFunctions.get(node.operation),...launch,
            arguments:launch.arguments.map((value,index)=>{const identity=canonicalBindingIdentity(operationPlan,operationPlan.entry.parameters[index]);let key=sharedKeys.get(identity);if(key===undefined){key=`binding-${sequence++}`;sharedKeys.set(identity,key);bindings[key]=value;}return{binding:key};})};
        });
        this.#owned.operation=await this.#owned.runtime.submitDeviceContinuation({nodes,bindings,continuationNode:this.#plan.continuation.controllerOperation});
      } else this.#owned.operation = await this.#owned.function.submit(launchArguments(this.#plan,this.#plan,this.#owned,scalarByOperation.get(this.#plan.operation.id)));
      this.state = 'running';
      this.#coldInitializing=false;
      this.#initializationState='completed';this.#initializationOperationCount=initializationResults.length;
      return Object.freeze({...await this.status(),initializationResults:Object.freeze(initializationResults)});
    } catch (error) {
      const report = await cleanup(this.#owned); this.#closeReport = report; this.#closed = true; this.state = 'closed';
      this.#coldInitializing=false;
      this.#initializationState='failed';
      if(error instanceof CudaJsRuntimeAdapterError&&error.code==='CUDA_JS_ADAPTER_INITIALIZATION'){error.cleanup=freeze(report);throw error;}
      throw wrapped('CUDA_JS_ADAPTER_OPERATION', 'ignition', 'CUDA-JS operation submission failed', error, 'operation', report);
    }
  }

  publish(sidebandId, value) {
    if (this.#closed) fail('CUDA_JS_ADAPTER_STATE', 'control', 'execution is closed');
    const sideband = this.#plan.sidebands.get(sidebandId);
    if (!sideband || sideband.direction !== 'host-to-device') fail('CUDA_JS_ADAPTER_INPUT', 'control', `${sidebandId} is not host-to-device`);
    return this.#owned.mailboxes.get(sidebandId).store(sidebandId, uint32(value, `${sidebandId} value`));
  }

  observe(sidebandId) {
    if (this.#closed) fail('CUDA_JS_ADAPTER_STATE', 'control', 'execution is closed');
    const sideband = this.#plan.sidebands.get(sidebandId);
    if (!sideband || sideband.direction !== 'device-to-host') fail('CUDA_JS_ADAPTER_INPUT', 'control', `${sidebandId} is not device-to-host`);
    return this.#owned.mailboxes.get(sidebandId).load(sidebandId);
  }

  async submitExternal(operationId,inputs={}) {
    if(this.#closed||this.state!=='running'||!this.#plan.continuation)fail('CUDA_JS_ADAPTER_STATE','control','external submission requires running continuation');
    const declaration=this.#plan.externalOperations.get(operationId);
    if(!declaration)fail('CUDA_JS_ADAPTER_INPUT','control','operation is not a declared external role');
    if(this.#externalSubmitting||this.#owned.externalChildren.size||this.#owned.deliveryOperations.size)fail('CUDA_JS_ADAPTER_STATE','control','external operation capacity is occupied or transfer cleanup is unproved');
    object(inputs,'external inputs');for(const key of Object.keys(inputs))if(!['parameters','scalars'].includes(key))fail('CUDA_JS_ADAPTER_INPUT','control','unknown external input field');
    const operationPlan=this.#plan.operations.get(operationId);const scalars=operationScalars(operationPlan,inputs.scalars);
    const parameters=inputRecord(inputs.parameters,new Set([...operationPlan.bindings].filter(([,b])=>b.source.kind==='resource').map(([name])=>name)),'external staging parameters');
    const stages=[];
    for(const [name,bytes]of Object.entries(parameters)) {
      const source=operationPlan.bindings.get(name).source;const view=source.view;
      if(!view||source.initialContentSha256||source.deviceEffects)fail('CUDA_JS_ADAPTER_INPUT','control','external staging requires mutable explicit ordinary view');
      const start=view.byteOffsetNumber,length=view.byteLengthNumber;
      for(const id of this.#plan.nodes.keys())for(const binding of this.#plan.operations.get(id).bindings.values())if(binding.source.kind==='resource'&&binding.source.resource===source.resource){const other=binding.source.view;const offset=other?.byteOffsetNumber??0,extent=other?.byteLengthNumber??this.#plan.resources.get(source.resource).byteLengthNumber;if(start<offset+extent&&offset<start+length)fail('CUDA_JS_ADAPTER_INPUT','control','external staging overlaps internal resource range');}
      for(const binding of this.#plan.bindings.values())if(binding.source.initialContentSha256&&binding.source.resource===source.resource){const other=binding.source.view;if(start<other.byteOffsetNumber+other.byteLengthNumber&&other.byteOffsetNumber<start+length)fail('CUDA_JS_ADAPTER_INPUT','control','external staging overlaps immutable content');}
      if(stages.some(stage=>stage.resource===source.resource&&start<stage.offset+stage.bytes.byteLength&&stage.offset<start+length))fail('CUDA_JS_ADAPTER_INPUT','control','external staging aliases overlap');
      stages.push({resource:source.resource,offset:start,bytes:snapshotInitialization(bytes,length,name)});
    }
    this.#externalSubmitting=true;
    try {
      for(const stage of stages) {
        const memory=this.#owned.memories.get(stage.resource);if(typeof memory.writeAsync!=='function')fail('CUDA_JS_ADAPTER_CAPABILITY','control','public asynchronous external staging is unavailable',{classification:'unsupported-capability'});
        const transfer=await memory.writeAsync(stage.bytes,{deviceOffset:stage.offset});const id=`external-stage:${this.#owned.nextDeliverySequence++}`;this.#owned.deliveryOperations.set(id,transfer);
        try{const status=await transfer.wait();if(status?.status!=='completed')fail('CUDA_JS_ADAPTER_EXTERNAL','control','external staging did not complete',{classification:'operation'});}
        finally{const failures=[];if(await closeOne(`delivery-operation:${id}`,transfer,this.#owned,failures))this.#owned.deliveryOperations.delete(id);else throw new CudaJsRuntimeAdapterError('CUDA_JS_ADAPTER_EXTERNAL_CLEANUP','cleanup','external staging cleanup was not proved',{classification:'cleanup',cleanup:cleanupReport(failures,null,new Set([`memory:${stage.resource}`,'runtime']))});}
      }
      const lower=await this.#owned.operationFunctions.get(operationId).submit(launchArguments(this.#plan,operationPlan,this.#owned,scalars));
      const id=`${operationId}:${this.#owned.externalSequence++}`;const child=new ExternalExecution(this.#owned,id,declaration,lower);this.#owned.externalChildren.set(id,child);return child;
    } catch(error){if(error instanceof CudaJsRuntimeAdapterError)throw error;throw wrapped('CUDA_JS_ADAPTER_EXTERNAL','control','external operation submission failed',error,'operation');}
    finally{this.#externalSubmitting=false;}
  }

  async deliver(deliveryId) {
    if (this.#closed || this.state !== 'completed') fail('CUDA_JS_ADAPTER_STATE', 'delivery', `cannot deliver from state ${this.state}`);
    const delivery = this.#plan.deliveries.get(deliveryId);
    if (!delivery) fail('CUDA_JS_ADAPTER_INPUT', 'delivery', `unknown delivery ${deliveryId}`);
    if (this.#activeDeliveries >= delivery.maxTransfersNumber) fail('CUDA_JS_ADAPTER_INPUT', 'delivery', `${deliveryId} concurrent transfer bound is exhausted`);
    const memory = this.#owned.memories.get(delivery.resource);
    if (!memory || typeof memory.readAsync !== 'function') fail('CUDA_JS_ADAPTER_CAPABILITY', 'delivery', `${deliveryId} public asynchronous memory read is unavailable`, { classification: 'unsupported-capability' });
    this.#activeDeliveries += 1;
    let transfer = null; let transferId = null; let payload = null; let primary = null; let closeError = null;
    try {
      transfer = await memory.readAsync({ deviceOffset: delivery.byteOffsetNumber, byteLength: delivery.byteLengthNumber });
      transferId = `${deliveryId}:${this.#owned.nextDeliverySequence++}`;
      this.#owned.deliveryOperations.set(transferId, transfer);
      const status = await transfer.wait();
      if (status?.status !== 'completed') {
        const lower = status?.failure ?? { code: `CUDA_JS_DELIVERY_${String(status?.status ?? 'UNKNOWN').toUpperCase()}`, category: 'operation', details: status ?? {} };
        throw wrapped('CUDA_JS_ADAPTER_DELIVERY', 'delivery', `CUDA-JS terminal delivery ended ${status?.status ?? 'without status'}`, lower, 'operation');
      }
      const bytes = status?.result?.bytes;
      if (!(bytes instanceof Uint8Array) || bytes.byteLength !== delivery.byteLengthNumber) fail('CUDA_JS_ADAPTER_DELIVERY', 'delivery', 'CUDA-JS D2H result does not match the declared delivery range', { classification: 'operation' });
      payload = Object.freeze({ id: deliveryId, packageDelivery: delivery.packageDelivery, role: delivery.role, terminalSchema: delivery.terminalSchema, byteOffset: delivery.byteOffset, byteLength: delivery.byteLength, bytes: new Uint8Array(bytes) });
    } catch (error) { primary = error; }
    finally {
      if (transfer) {
        try {
          await transfer.close();
          this.#owned.deliveryOperations.delete(transferId);
        } catch (error) {
          closeError = error;
          const label = `delivery-operation:${transferId}`;
          if (!this.#owned.failedClosures.has(label)) this.#owned.failedClosures.set(label, cleanupFailure(label, error));
        }
      }
      this.#activeDeliveries -= 1;
    }
    if (closeError) {
      const cleanupReport = Object.freeze({
        status: 'quarantined',
        failures: Object.freeze([this.#owned.failedClosures.get(`delivery-operation:${transferId}`)]),
        runtime: null,
        retained: Object.freeze([`delivery-operation:${transferId}`, `memory:${delivery.resource}`, 'runtime']),
        ...(primary ? { primary: primary instanceof CudaJsRuntimeAdapterError ? freeze({ code: primary.code, phase: primary.phase, classification: primary.classification, lower: primary.lower }) : lowerFacts(primary) } : {}),
      });
      throw new CudaJsRuntimeAdapterError('CUDA_JS_ADAPTER_DELIVERY_CLEANUP', 'cleanup', 'CUDA-JS terminal delivery cleanup was not proved', { classification: 'cleanup', lower: closeError, cleanup: cleanupReport, cause: primary ?? closeError });
    }
    if (primary) {
      if (primary instanceof CudaJsRuntimeAdapterError) throw primary;
      throw wrapped('CUDA_JS_ADAPTER_DELIVERY', 'delivery', 'CUDA-JS terminal delivery failed', primary, 'operation');
    }
    return payload;
  }

  async describe() {
    if(this.#closed||this.#activeDescriptions)fail('CUDA_JS_ADAPTER_STATE','diagnostics','description requires an open execution and one pending read');
    if(typeof this.#owned.runtime.describe!=='function')fail('CUDA_JS_ADAPTER_CAPABILITY','diagnostics','public runtime description is unavailable',{classification:'unsupported-capability'});
    this.#activeDescriptions++;
    try{return freeze({schema:'cuda-mcgs.cuda-js-execution-description/0.1.0',state:this.state,admission:this.#owned.admission,initialization:{state:this.#initializationState,operationCount:this.#initializationOperationCount},runtime:runtimeDescriptionSnapshot(await this.#owned.runtime.describe(),fail)});}
    catch(error){if(error instanceof CudaJsRuntimeAdapterError)throw error;throw wrapped('CUDA_JS_ADAPTER_DESCRIPTION','diagnostics','public runtime description failed',error,'operation');}
    finally{this.#activeDescriptions--;}
  }

  async status() {
    if (this.#closed) return Object.freeze({ state: 'closed', operation: null, activeDeliveries: 0 });
    return Object.freeze({ state: this.state, operation: this.#owned.operation ? freeze(await this.#owned.operation.status()) : null, activeDeliveries: this.#activeDeliveries });
  }

  async wait() {
    if (this.#closed || !this.#owned.operation) fail('CUDA_JS_ADAPTER_STATE', 'completion', 'execution has no live operation');
    let result;
    try { result = await this.#owned.operation.wait(); }
    catch (error) { throw wrapped('CUDA_JS_ADAPTER_OPERATION', 'completion', 'CUDA-JS operation wait failed', error, 'operation'); }
    if (result?.status !== 'completed') {
      const lower = result?.failure ?? { code: `CUDA_JS_OPERATION_${String(result?.status ?? 'UNKNOWN').toUpperCase()}`, category: 'operation', details: result ?? {} };
      throw wrapped('CUDA_JS_ADAPTER_OPERATION', 'completion', `CUDA-JS operation ended ${result?.status ?? 'without status'}`, lower, 'operation');
    }
    this.state = 'completed';
    return Object.freeze({ state: this.state, operation: freeze(result) });
  }

  async close() {
    if (this.#closed) return Object.freeze({ ...(this.#closeReport ?? { status: 'complete', failures: Object.freeze([]), runtime: null }), repeated: true });
    if (this.#activeDescriptions||this.#activeDeliveries !== 0||this.#externalSubmitting||this.#coldInitializing||[...this.#owned.externalChildren.values()].some(child=>child.activeDelivery)) fail('CUDA_JS_ADAPTER_STATE', 'cleanup', 'cannot close while description/cold initialization/delivery/external submission is in flight');
    const report = await cleanup(this.#owned);
    this.#closeReport = report;
    this.#closed = true;
    this.state = 'closed';
    return report;
  }
}

export async function prepareCudaJsExecution(executionPackage, { cudaJs, peer, runtimeOptions = {} } = {}) {
  object(executionPackage, 'execution package');
  object(cudaJs, 'cudaJs');
  object(runtimeOptions, 'runtimeOptions');
  const lower = admitPeer(executionPackage, cudaJs, peer);
  admitRequirementSelections(executionPackage,lower,peer);
  const plan = admitPackage(executionPackage, lower);
  plan.partition=executionPackage.cudaJsAdapter.deviceSourcePartition;
  const partition=admitSourcePartition(plan,cudaJs,lower,fail);
  const packageIdentity=executionPackageIdentity(executionPackage,fail);
  // Public library composition selects RDC internally; an explicit request
  // conflicts with that lower-owned selection, including continuation kernels.
  if(partition||(plan.searchProgram.deviceImports?.length??0)>0)plan.compile=Object.freeze({headerProfile:'cuda-device'});
  if (runtimeOptions.compiler === false) fail('CUDA_JS_ADAPTER_INPUT', 'admission', 'compiler=false is incompatible with preparation');
  if (runtimeOptions.driver?.maxPending !== undefined && runtimeOptions.driver.maxPending !== 1) fail('CUDA_JS_ADAPTER_INPUT', 'admission', 'runtimeOptions.driver.maxPending must remain 1');
  if (runtimeOptions.driver?.execution?.maxPendingGpuOperations !== undefined && runtimeOptions.driver.execution.maxPendingGpuOperations !== 2) fail('CUDA_JS_ADAPTER_INPUT', 'admission', 'runtimeOptions.driver.execution.maxPendingGpuOperations must remain 2 for terminal delivery');
  if(!partition)preflightDeviceProgram(cudaJs, plan);
  const owned = { runtime: null, module: null, function: null, functions:new Map(), operationFunctions:new Map(),externalChildren:new Map(),externalSequence:0,operation: null, deliveryOperations: new Map(), nextDeliverySequence: 0, memories: new Map(), views: new Map(), mailboxes: new Map(), failedClosures: new Map() };
  try {
    owned.runtime = await cudaJs.openCudaRuntime({
      ...runtimeOptions,
      driver: { ...(runtimeOptions.driver ?? {}), execution: { ...(runtimeOptions.driver?.execution ?? {}), maxPendingGpuOperations: 2 } },
      compiler: runtimeOptions.compiler ?? true,
    });
    if(plan.continuation&&typeof owned.runtime.submitDeviceContinuation!=='function')fail('CUDA_JS_ADAPTER_CAPABILITY','admission','public continuation submission port is unavailable',{classification:'unsupported-capability'});
    let localImports;
    if(partition){localImports=await compileSourcePartition(partition,cudaJs,owned.runtime,fail);plan.compilationSource=partition.main.source;plan.compilationFunctions=partition.mainFunctions;preflightDeviceProgram(cudaJs,plan,localImports);}
    const compiled = await cudaJs.compileDeviceProgram(owned.runtime, { source: plan.compilationSource??plan.searchProgram.source, functions: plan.compilationFunctions??plan.functions, compile: plan.compile,...(localImports?{imports:localImports}:{}) });
    const artifact = compiled?.linker?.artifact ?? compiled?.compiler?.artifact;
    if (!artifact || !['ptx', 'cubin'].includes(artifact.format) || !(artifact.bytes instanceof Uint8Array)) fail('CUDA_JS_ADAPTER_COMPILE', 'compilation', 'CUDA-JS compilation returned no loadable public artifact', { classification: 'compilation' });
    owned.module = await owned.runtime.loadModule({ format: artifact.format, bytes: artifact.bytes });
    for(const operationPlan of plan.operations?.values()??[plan]) {
      const kernel = compiled?.deviceProgram?.kernels?.find(({ name }) => name === operationPlan.operation.function);
      if (!kernel || !Array.isArray(kernel.parameters)) fail('CUDA_JS_ADAPTER_COMPILE', 'compilation', 'CUDA-JS device program exposed no runtime-entry kernel', { classification: 'compilation' });
      if(plan.continuation&&(kernel.executionProfile??'ordinary')!==(operationPlan.entry.executionProfile??'ordinary'))fail('CUDA_JS_ADAPTER_COMPILE','compilation','compiled execution profile differs from selected operation',{classification:'compilation'});
      const fn=owned.functions.get(kernel.functionName)??await owned.module.getFunction({ name: kernel.functionName, parameters: kernel.parameters,...(kernel.executionProfile?{executionProfile:kernel.executionProfile}:{}) });
      if(plan.continuation){owned.functions.set(kernel.functionName,fn);owned.operationFunctions.set(operationPlan.operation.id,fn);}else owned.function=fn;
    }
    for (const [id, resource] of plan.allocatedResources) owned.memories.set(id, await owned.runtime.allocateDevice({ byteLength: resource.byteLengthNumber }));
    const sharedViews=new Map();
    for (const [parameter, binding] of plan.bindings) {
      if (binding.source.kind !== 'resource' || !binding.source.view) continue;
      const memory = owned.memories.get(binding.source.resource);
      if (!memory || typeof memory.view !== 'function') fail('CUDA_JS_ADAPTER_CAPABILITY', 'allocation', `${parameter} requires the public device-memory view capability`, { classification: 'unsupported-capability' });
      const view = binding.source.view;
      const identity=plan.continuation?JSON.stringify({source:binding.source}):parameter;
      let handle=sharedViews.get(identity);if(!handle){handle=await memory.view({ dtype: view.dtype, byteOffset: view.byteOffsetNumber, elementCount: view.elementCountNumber, access: binding.source.access });sharedViews.set(identity,handle);}
      owned.views.set(parameter,handle);
    }
    for (const delivery of plan.deliveries.values()) if (typeof owned.memories.get(delivery.resource)?.readAsync !== 'function') fail('CUDA_JS_ADAPTER_CAPABILITY', 'allocation', `${delivery.id} public asynchronous memory read is unavailable`, { classification: 'unsupported-capability' });
    for (const [id, sideband] of plan.sidebands) owned.mailboxes.set(id, await owned.runtime.createPublicationMailbox({ lanes: [{ name: id, direction: sideband.direction }] }));
    owned.admission=freeze(preparationRecord(packageIdentity,peer,plan,compiled,localImports));
    return new PreparedExecution(plan, owned);
  } catch (error) {
    if (error instanceof CudaJsRuntimeAdapterError && !owned.runtime) throw error;
    const allocation = Boolean(owned.function||owned.functions.size);
    const report = await cleanup(owned);
    if (error instanceof CudaJsRuntimeAdapterError) { error.cleanup = freeze(report); throw error; }
    throw wrapped(allocation ? 'CUDA_JS_ADAPTER_ALLOCATION' : 'CUDA_JS_ADAPTER_COMPILE', allocation ? 'allocation' : 'compilation', `CUDA-JS ${allocation ? 'allocation' : 'preparation'} failed`, error, allocation ? 'allocation' : 'compilation', report);
  }
}

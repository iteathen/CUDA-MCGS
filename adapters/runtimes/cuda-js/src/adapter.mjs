const PACKAGE_SCHEMA = 'cuda-mcgs.execution-package/0.2.0';
const ADAPTER_SCHEMA = 'cuda-mcgs.cuda-js-adapter-requirements/0.2.0';
const CUDA_JS_REPOSITORY = 'iteathen/CUDA-JS';
const UINT32_MAX = 0xffff_ffff;
const CONTRACT_CAPABILITIES = new Map([
  ['cuda-js.device-js/0.1.0', 'deviceJsFrontend'],
  ['cuda-js.operation-lifecycle/0.1.0', 'gpuOperationLifecycle'],
  ['cuda-js.publication-mailbox/0.1.0', 'publicationMailboxes'],
  ['cuda-js.device-publication-release-acquire/0.1.0', 'deviceJsFrontend'],
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
  if (typeof cudaJs.openCudaRuntime !== 'function' || typeof cudaJs.compileDeviceProgram !== 'function') fail('CUDA_JS_ADAPTER_CAPABILITY', 'admission', 'injected public CUDA-JS port is incomplete', { classification: 'unsupported-capability' });
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

function admitPackage(executionPackage, lower) {
  if (executionPackage.schema !== PACKAGE_SCHEMA || executionPackage.status !== 'accepted') fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'unsupported execution package schema/status');
  const requirements = object(executionPackage.cudaJsAdapter, 'cudaJsAdapter requirements');
  if (requirements.schema !== ADAPTER_SCHEMA) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'unsupported adapter requirements schema');
  admitContracts(requirements, lower);
  if (requirements.searchLifecycle?.ignition !== 'device-owned' || requirements.searchLifecycle?.cancellation !== 'bounded-external-intent' || requirements.searchLifecycle?.completion !== 'device-owned-closure') fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'unsupported search lifecycle');
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

  if (!Array.isArray(requirements.sidebandRequirements)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'sidebandRequirements must be an array');
  const sidebands = new Map();
  for (const sideband of requirements.sidebandRequirements) {
    if (sideband.valueType !== 'u32' || sideband.publication !== 'release-acquire' || decimal(sideband.capacity, `${sideband.id} capacity`, true) !== 1 || !['host-to-device', 'device-to-host'].includes(sideband.direction)) fail('CUDA_JS_ADAPTER_CAPABILITY', 'admission', `${sideband.id} sideband shape is unsupported`, { classification: 'unsupported-capability' });
    if (sidebands.has(sideband.id)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `sideband id repeats: ${sideband.id}`);
    sidebands.set(sideband.id, sideband);
  }

  if (!Array.isArray(operation.bindings)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'operation bindings must be an array');
  const bindings = new Map();
  for (const binding of operation.bindings) {
    if (bindings.has(binding.parameter)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `binding repeats: ${binding.parameter}`);
    const source = binding.source;
    if (source?.kind === 'resource') {
      if (!resources.has(source.resource) || !['read', 'write', 'read-write'].includes(source.access)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `invalid resource binding ${binding.parameter}`);
    } else if (source?.kind === 'sideband') {
      if (!sidebands.has(source.sideband)) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `invalid sideband binding ${binding.parameter}`);
    } else if (source?.kind !== 'scalar' || !source.schema) {
      fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', `unsupported binding ${binding.parameter}`);
    }
    bindings.set(binding.parameter, binding);
  }

  const searchProgram = object(requirements.searchProgram, 'searchProgram');
  const entry = searchProgram.functions?.find((fn) => fn.name === operation.function && fn.executionRole === 'runtime-entry');
  if (!entry || !Array.isArray(entry.parameters) || entry.parameters.length !== bindings.size || entry.parameters.some(({ name }) => !bindings.has(name))) fail('CUDA_JS_ADAPTER_PACKAGE', 'admission', 'runtime entry and operation bindings differ');
  return {
    operation, resources, sidebands, bindings, searchProgram, entry,
    functions: deviceFunctions(searchProgram.functions),
    launch: { grid: dimensions(operation.launchPolicy.grid, 'grid'), block: dimensions(operation.launchPolicy.block, 'block'), sharedMemoryBytes: decimal(operation.launchPolicy.dynamicSharedBytes, 'dynamicSharedBytes') },
  };
}

async function closeOne(label, value, failures) {
  if (!value || typeof value.close !== 'function') return;
  try { await value.close(); } catch (error) { failures.push(Object.freeze({ label, lower: lowerFacts(error) })); }
}

async function cleanup(owned) {
  const failures = [];
  await closeOne('operation', owned.operation, failures);
  await closeOne('function', owned.function, failures);
  await closeOne('module', owned.module, failures);
  for (const [id, mailbox] of [...owned.mailboxes].reverse()) await closeOne(`mailbox:${id}`, mailbox, failures);
  for (const [id, memory] of [...owned.memories].reverse()) await closeOne(`memory:${id}`, memory, failures);
  let runtime = null;
  if (owned.runtime?.close) {
    try { runtime = await owned.runtime.close(); } catch (error) { failures.push(Object.freeze({ label: 'runtime', lower: lowerFacts(error) })); }
  }
  const unhealthy = runtime && (runtime.graceful === false || runtime.restartRequired === true);
  return Object.freeze({ status: failures.length === 0 && !unhealthy ? 'complete' : 'quarantined', failures: Object.freeze(failures), runtime: runtime ? freeze(runtime) : null });
}

function wrapped(code, phase, message, error, classification, report = null) {
  const effective = error?.category === 'unsupported' ? 'unsupported-capability' : error?.category === 'validation' ? 'validation' : classification;
  return new CudaJsRuntimeAdapterError(code, phase, message, { classification: effective, lower: error, cleanup: report, cause: error });
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

class PreparedExecution {
  #plan;
  #owned;
  #closed = false;
  constructor(plan, owned) { this.kind = 'cuda-js-execution'; this.state = 'prepared'; this.#plan = plan; this.#owned = owned; }

  async ignite(inputs = {}) {
    if (this.#closed || this.state !== 'prepared') fail('CUDA_JS_ADAPTER_STATE', 'ignition', `cannot ignite from state ${this.state}`);
    object(inputs, 'runtime inputs');
    const resourceInputs = inputRecord(inputs.resources, this.#plan.resources, 'resource inputs');
    if (inputs.scalars !== undefined) {
      object(inputs.scalars, 'scalar input operations');
      for (const operationId of Object.keys(inputs.scalars)) if (operationId !== this.#plan.operation.id) fail('CUDA_JS_ADAPTER_INPUT', 'ignition', `unknown scalar operation ${operationId}`);
    }
    const scalarNames = new Set(this.#plan.operation.bindings.filter(({ source }) => source.kind === 'scalar').map(({ parameter }) => parameter));
    const scalarInputs = inputRecord(inputs.scalars?.[this.#plan.operation.id], scalarNames, 'scalar inputs');

    for (const [id, resource] of this.#plan.resources) {
      const modes = this.#plan.operation.bindings.filter(({ source }) => source.kind === 'resource' && source.resource === id).map(({ source }) => source.access);
      const bytes = resourceInputs[id];
      if (bytes === undefined && modes.some((mode) => mode !== 'write')) fail('CUDA_JS_ADAPTER_INPUT', 'ignition', `${id} requires explicit initial bytes`);
      if (bytes !== undefined && (!(bytes instanceof Uint8Array) || bytes.byteLength !== resource.byteLengthNumber)) fail('CUDA_JS_ADAPTER_INPUT', 'ignition', `${id} initial bytes must exactly match byteLength`);
    }
    for (const parameter of this.#plan.entry.parameters) {
      const binding = this.#plan.bindings.get(parameter.name);
      if (binding.source.kind !== 'scalar') continue;
      if (!Object.hasOwn(scalarInputs, parameter.name)) fail('CUDA_JS_ADAPTER_INPUT', 'ignition', `missing scalar value for ${parameter.name}`);
      scalar(parameter.type, scalarInputs[parameter.name], parameter.name);
    }

    for (const [id, resource] of this.#plan.resources) {
      const bytes = resourceInputs[id];
      if (bytes === undefined) continue;
      try { await this.#owned.memories.get(id).write(bytes); }
      catch (error) {
        const report = await cleanup(this.#owned); this.#closed = true; this.state = 'closed';
        throw wrapped('CUDA_JS_ADAPTER_ALLOCATION', 'initialization', `failed to initialize ${id}`, error, 'allocation', report);
      }
    }

    const args = [];
    const accesses = [];
    for (let index = 0; index < this.#plan.entry.parameters.length; index += 1) {
      const parameter = this.#plan.entry.parameters[index];
      const binding = this.#plan.bindings.get(parameter.name);
      if (binding.source.kind === 'resource') {
        const resource = this.#plan.resources.get(binding.source.resource);
        args.push(this.#owned.memories.get(binding.source.resource));
        accesses.push({ argumentIndex: index, byteOffset: 0, byteLength: resource.byteLengthNumber, mode: binding.source.access });
      } else if (binding.source.kind === 'sideband') {
        args.push({ kind: 'publication-mailbox', mailbox: this.#owned.mailboxes.get(binding.source.sideband), lane: binding.source.sideband });
      } else {
        args.push(scalar(parameter.type, scalarInputs[parameter.name], parameter.name));
      }
    }

    try {
      this.#owned.operation = await this.#owned.function.submit({ grid: this.#plan.launch.grid, block: this.#plan.launch.block, sharedMemoryBytes: this.#plan.launch.sharedMemoryBytes, arguments: args, accesses });
      this.state = 'running';
      return this.status();
    } catch (error) {
      const report = await cleanup(this.#owned); this.#closed = true; this.state = 'closed';
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

  async status() {
    if (this.#closed) return Object.freeze({ state: 'closed', operation: null });
    return Object.freeze({ state: this.state, operation: this.#owned.operation ? freeze(await this.#owned.operation.status()) : null });
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
    if (this.#closed) return Object.freeze({ status: 'complete', failures: Object.freeze([]), runtime: null, repeated: true });
    const report = await cleanup(this.#owned); this.#closed = true; this.state = 'closed'; return report;
  }
}

export async function prepareCudaJsExecution(executionPackage, { cudaJs, peer, runtimeOptions = {} } = {}) {
  object(executionPackage, 'execution package');
  object(cudaJs, 'cudaJs');
  object(runtimeOptions, 'runtimeOptions');
  const lower = admitPeer(executionPackage, cudaJs, peer);
  const plan = admitPackage(executionPackage, lower);
  if (runtimeOptions.compiler === false) fail('CUDA_JS_ADAPTER_INPUT', 'admission', 'compiler=false is incompatible with preparation');
  if (runtimeOptions.driver?.maxPending !== undefined && runtimeOptions.driver.maxPending !== 1) fail('CUDA_JS_ADAPTER_INPUT', 'admission', 'runtimeOptions.driver.maxPending must remain 1');
  const owned = { runtime: null, module: null, function: null, operation: null, memories: new Map(), mailboxes: new Map() };
  try {
    owned.runtime = await cudaJs.openCudaRuntime({ ...runtimeOptions, driver: { ...(runtimeOptions.driver ?? {}), maxPending: 1 }, compiler: runtimeOptions.compiler ?? true });
    const compiled = await cudaJs.compileDeviceProgram(owned.runtime, { source: plan.searchProgram.source, functions: plan.functions });
    const artifact = compiled?.linker?.artifact ?? compiled?.compiler?.artifact;
    if (!artifact || !['ptx', 'cubin'].includes(artifact.format) || !(artifact.bytes instanceof Uint8Array)) fail('CUDA_JS_ADAPTER_COMPILE', 'compilation', 'CUDA-JS compilation returned no loadable public artifact', { classification: 'compilation' });
    owned.module = await owned.runtime.loadModule({ format: artifact.format, bytes: artifact.bytes });
    const kernel = compiled?.deviceProgram?.kernels?.find(({ functionName }) => functionName === plan.operation.function);
    if (!kernel || !Array.isArray(kernel.parameters)) fail('CUDA_JS_ADAPTER_COMPILE', 'compilation', 'CUDA-JS device program exposed no runtime-entry kernel', { classification: 'compilation' });
    owned.function = await owned.module.getFunction({ name: kernel.name, parameters: kernel.parameters });
    for (const [id, resource] of plan.resources) owned.memories.set(id, await owned.runtime.allocateDevice({ byteLength: resource.byteLengthNumber }));
    for (const [id, sideband] of plan.sidebands) owned.mailboxes.set(id, await owned.runtime.createPublicationMailbox({ lanes: [{ name: id, direction: sideband.direction }] }));
    return new PreparedExecution(plan, owned);
  } catch (error) {
    if (error instanceof CudaJsRuntimeAdapterError && !owned.runtime) throw error;
    const report = await cleanup(owned);
    if (error instanceof CudaJsRuntimeAdapterError) { error.cleanup = freeze(report); throw error; }
    const allocation = Boolean(owned.function);
    throw wrapped(allocation ? 'CUDA_JS_ADAPTER_ALLOCATION' : 'CUDA_JS_ADAPTER_COMPILE', allocation ? 'allocation' : 'compilation', `CUDA-JS ${allocation ? 'allocation' : 'preparation'} failed`, error, allocation ? 'allocation' : 'compilation', report);
  }
}
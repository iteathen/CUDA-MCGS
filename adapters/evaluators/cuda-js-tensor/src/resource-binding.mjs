import { TensorEvaluatorConnectorError } from './connector.mjs';
import { tensorEvaluatorRuntimeConstants } from './runtime-contribution.mjs';

const RESOURCE_BINDING_CONTRACT = 'cuda-mcgs.tensor-evaluator-resource-binding/0.1.0';
const RUNTIME_CONTRACT = 'cuda-mcgs.tensor-evaluator-device-runtime/0.1.0';
const PROGRAM_BINDING_CONTRACT = 'cuda-mcgs.tensor-evaluator-program-binding/0.1.0';
const CONNECTOR_CONTRACT = 'cuda-mcgs.tensor-evaluator-connector/0.1.0';
const EVALUATOR_SCHEMA = 'cuda-mcgs.evaluator-profile/0.2.0';
const RESOURCE_SCHEMA = 'cuda-mcgs.resource-profile/0.2.0';
const NAMESPACED_ID = /^[a-z][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+$/;
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const DECIMAL = /^(?:0|[1-9][0-9]*)$/;
const HEX64 = /^[0-9a-f]{64}$/;
const DTYPE_WIDTH = tensorEvaluatorRuntimeConstants.dtypeWidth;

function freeze(value) {
  if (value === null || typeof value !== 'object') return value;
  return Object.freeze(Array.isArray(value)
    ? value.map(freeze)
    : Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freeze(child)])));
}

function fail(code, message, details = {}) {
  throw new TensorEvaluatorConnectorError(code, message, details);
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_INPUT', `${label} must be an object`);
  return value;
}

function exactKeys(value, expected, code, label) {
  object(value, label);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) fail(code, `${label} fields must be exactly ${wanted.join(', ')}`);
}

function decimal(value, label) {
  if (typeof value !== 'string' || !DECIMAL.test(value)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_RANGE', `${label} must be a canonical decimal uint string`);
  return BigInt(value);
}

function positiveSafeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_RANGE', `${label} must be a positive safe integer`);
  return value;
}

function width(dtype, label) {
  const value = DTYPE_WIDTH[dtype];
  if (!Number.isSafeInteger(value) || value <= 0) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_DTYPE', `${label} uses unsupported dtype ${dtype}`);
  return value;
}

function namespacedId(value, label) {
  if (typeof value !== 'string' || !NAMESPACED_ID.test(value)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ID', `${label} must be a namespaced id`);
  return value;
}

function identifier(value, label) {
  if (typeof value !== 'string' || !IDENTIFIER.test(value)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_PARAMETER', `${label} must be a Device-JS identifier`);
  return value;
}

function contentIdentity(value, label) {
  object(value, label);
  if (value.algorithm !== 'sha256' || typeof value.sha256 !== 'string' || !HEX64.test(value.sha256)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_IDENTITY', `${label} must be a sha256 content identity`);
  return { algorithm: 'sha256', sha256: value.sha256 };
}

function canonicalToken(value) {
  const token = value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(token)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ID', `cannot derive resource token from ${value}`);
  return token;
}

function generatedResourceId(profileId, logicalId) {
  return `${profileId}.resource-tensor-${canonicalToken(logicalId)}`;
}

function accessSet(value, label) {
  if (value === 'read') return ['read'];
  if (value === 'write') return ['write'];
  if (value === 'read-write') return ['read', 'write'];
  fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS', `${label} access is invalid`);
}

function connector(value) {
  object(value, 'Tensor evaluator connector');
  if (value.kind !== 'cuda-mcgs-tensor-evaluator-connector' || value.contract !== CONNECTOR_CONTRACT
      || !Number.isSafeInteger(value.requestCapacity) || value.requestCapacity <= 0
      || !Number.isSafeInteger(value.tensor?.itemCapacity) || value.tensor.itemCapacity <= 0
      || !Array.isArray(value.parameters)) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CONNECTOR', 'connector is not the admitted Tensor evaluator connector shape');
  }
  return value;
}

function runtime(value, admittedConnector) {
  object(value, 'Tensor evaluator runtime contribution');
  if (value.kind !== 'cuda-mcgs-tensor-evaluator-runtime-contribution' || value.contract !== RUNTIME_CONTRACT
      || value.execution?.deviceOwned !== true || value.execution?.hostProgress !== 'none'
      || value.execution?.requestCapacity !== admittedConnector.requestCapacity
      || value.execution?.itemCapacity !== admittedConnector.tensor.itemCapacity
      || !Array.isArray(value.resources) || !Array.isArray(value.tensorBindings)) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_RUNTIME', 'runtime contribution does not match the admitted connector capacities');
  }
  return value;
}

function programBinding(value) {
  object(value, 'Tensor evaluator program binding');
  if (value.kind !== 'cuda-mcgs-tensor-evaluator-program-binding' || value.contract !== PROGRAM_BINDING_CONTRACT
      || typeof value.ownerProfile !== 'string' || !Array.isArray(value.resourceRequirements) || !Array.isArray(value.tensorBindings)) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_PROGRAM', 'program binding is not the admitted Tensor evaluator program-binding shape');
  }
  return value;
}

function tensorParameterMap(admittedConnector) {
  return new Map(admittedConnector.parameters.filter(({ role }) => role !== 'item-index').map((entry) => [entry.parameterName, entry]));
}

function runtimeDescriptor(entry) {
  object(entry, 'runtime resource requirement');
  if (typeof entry.id !== 'string' || !entry.id.startsWith('runtime.')) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', 'runtime resource id is invalid');
  identifier(entry.parameterName, `${entry.id} parameterName`);
  const elementCount = BigInt(positiveSafeInteger(entry.elementCount, `${entry.id} elementCount`));
  const byteLength = BigInt(positiveSafeInteger(entry.byteLength, `${entry.id} byteLength`));
  const dtypeWidth = BigInt(width(entry.dtype, entry.id));
  if (elementCount * dtypeWidth !== byteLength) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', `${entry.id} element layout differs from byteLength`);
  let resourceClass;
  let pressureStatus;
  let requiredAccess = accessSet(entry.access, entry.id);
  if (entry.id === 'runtime.control32') {
    resourceClass = 'batch';
    pressureStatus = 'evaluator-internal-failure';
    requiredAccess = ['read', 'write', 'atomic'];
  } else if (entry.id === 'runtime.control64') {
    resourceClass = 'batch';
    pressureStatus = 'evaluator-internal-failure';
  } else if (entry.id.startsWith('runtime.request-input.')) {
    resourceClass = 'input';
    pressureStatus = 'invalid-evaluator-input';
  } else if (entry.id.startsWith('runtime.result-output.')) {
    resourceClass = 'result';
    pressureStatus = 'evaluator-output-invalid';
  } else {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', `unknown runtime logical resource ${entry.id}`);
  }
  return {
    logicalId: entry.id,
    parameterName: entry.parameterName,
    dtype: entry.dtype,
    elementCount,
    byteLength,
    alignment: dtypeWidth,
    resourceClass,
    pressureStatus,
    requiredAccess,
    initialization: entry.initialization,
    source: 'runtime-resource',
  };
}

function tensorDescriptor(entry, connectorParameter) {
  object(entry, 'Tensor binding');
  if (!connectorParameter || connectorParameter.role !== entry.role || connectorParameter.dtype !== entry.dtype
      || connectorParameter.type !== entry.type || connectorParameter.access !== entry.access
      || connectorParameter.itemVarying !== entry.itemVarying || connectorParameter.byteLength !== entry.byteLength) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CONNECTOR', `${entry.parameterName ?? '<unknown>'} Tensor binding differs from the admitted connector`);
  }
  identifier(entry.parameterName, 'Tensor binding parameterName');
  const byteLength = BigInt(positiveSafeInteger(entry.byteLength, `${entry.parameterName} byteLength`));
  const dtypeWidth = BigInt(width(entry.dtype, entry.parameterName));
  if (byteLength % dtypeWidth !== 0n) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', `${entry.parameterName} byteLength is not dtype aligned`);
  if (entry.role === 'input' && entry.itemVarying === false) {
    return {
      logicalId: `tensor.${entry.parameterName}`,
      parameterName: entry.parameterName,
      dtype: entry.dtype,
      elementCount: byteLength / dtypeWidth,
      byteLength,
      alignment: dtypeWidth,
      requiredAccess: accessSet(entry.access, entry.parameterName),
      initialization: entry.initialization,
      source: 'shared-tensor-input',
      external: true,
    };
  }
  let resourceClass;
  let pressureStatus;
  let alignment = dtypeWidth;
  if (entry.role === 'input' && entry.itemVarying === true) {
    resourceClass = 'input';
    pressureStatus = 'invalid-evaluator-input';
  } else if (entry.role === 'output') {
    resourceClass = 'result';
    pressureStatus = 'evaluator-output-invalid';
  } else if (entry.role === 'workspace') {
    resourceClass = 'workspace';
    pressureStatus = 'evaluator-workspace-capacity';
    alignment = BigInt(positiveSafeInteger(connectorParameter.alignmentBytes, `${entry.parameterName} alignmentBytes`));
    if (alignment < dtypeWidth || alignment % dtypeWidth !== 0n) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ALIGNMENT', `${entry.parameterName} workspace alignment is incompatible with dtype width`);
  } else {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', `${entry.parameterName} Tensor role is unsupported`);
  }
  return {
    logicalId: `tensor.${entry.parameterName}`,
    parameterName: entry.parameterName,
    dtype: entry.dtype,
    elementCount: byteLength / dtypeWidth,
    byteLength,
    alignment,
    resourceClass,
    pressureStatus,
    requiredAccess: accessSet(entry.access, entry.parameterName),
    initialization: entry.initialization,
    source: 'tensor-buffer',
    external: false,
  };
}

function descriptors(runtimeContribution, admittedConnector) {
  const connectorParameters = tensorParameterMap(admittedConnector);
  const materialized = runtimeContribution.resources.map(runtimeDescriptor);
  const external = [];
  for (const entry of runtimeContribution.tensorBindings) {
    const descriptor = tensorDescriptor(entry, connectorParameters.get(entry.parameterName));
    if (descriptor.external) external.push(descriptor);
    else materialized.push(descriptor);
  }
  const names = new Set();
  const logicalIds = new Set();
  for (const descriptor of [...materialized, ...external]) {
    if (names.has(descriptor.parameterName)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_PARAMETER', `${descriptor.parameterName} is duplicated across runtime/Tensor resources`);
    if (logicalIds.has(descriptor.logicalId)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', `${descriptor.logicalId} is duplicated`);
    names.add(descriptor.parameterName);
    logicalIds.add(descriptor.logicalId);
  }
  return { materialized, external };
}

function profileForBinding(value) {
  object(value, 'evaluator profile input');
  if (value.schema !== EVALUATOR_SCHEMA || value.status !== 'accepted' || value.contract?.id !== 'SPEC-0009'
      || value.execution?.deviceOwned !== true || value.execution?.hostProgress !== 'none'
      || !Array.isArray(value.resources) || !Array.isArray(value.statuses) || !Array.isArray(value.workspaces)) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_EVALUATOR', 'evaluator profile is not an accepted device-owned SPEC-0009 input');
  }
  namespacedId(value.id, 'evaluator profile id');
  return value;
}

function resourceRecord(profileId, descriptor) {
  return {
    id: generatedResourceId(profileId, descriptor.logicalId),
    class: descriptor.resourceClass,
    unit: 'bytes',
    minimum: descriptor.byteLength.toString(),
    maximum: descriptor.byteLength.toString(),
    alignment: descriptor.alignment.toString(),
    scope: 'per-engine',
    pressureStatus: descriptor.pressureStatus,
  };
}

function sameResource(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function bindTensorEvaluatorProfileResources(profileInput, runtimeContributionInput, connectorInput) {
  const admittedConnector = connector(connectorInput);
  const runtimeContribution = runtime(runtimeContributionInput, admittedConnector);
  const profile = profileForBinding(profileInput);
  const { materialized } = descriptors(runtimeContribution, admittedConnector);
  const statusCodes = new Set(profile.statuses.map(({ code }) => code));
  if (materialized.some(({ resourceClass }) => resourceClass === 'workspace') && profile.workspaces.length === 0) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_WORKSPACE', 'Tensor workspace requires selected evaluator workspace semantics; the adapter cannot manufacture workspace meaning');
  }
  const generated = materialized.map((descriptor) => resourceRecord(profile.id, descriptor));
  const generatedIds = new Set();
  for (const entry of generated) {
    if (generatedIds.has(entry.id)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ID', `generated evaluator resource id ${entry.id} collides`);
    generatedIds.add(entry.id);
    if (!statusCodes.has(entry.pressureStatus)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_STATUS', `${entry.id} pressure status ${entry.pressureStatus} is undeclared by evaluator profile`);
  }
  const bound = structuredClone(profile);
  const existing = new Map(bound.resources.map((entry) => [entry.id, entry]));
  for (const entry of generated) {
    const prior = existing.get(entry.id);
    if (prior && !sameResource(prior, entry)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_RESOURCE', `${entry.id} conflicts with an existing evaluator resource`);
    if (!prior) bound.resources.push(entry);
  }
  return freeze(bound);
}

function evaluatorProfileResult(value, ownerProfile) {
  object(value, 'evaluator profile result');
  const normalized = object(value.normalized, 'normalized evaluator profile');
  const identity = contentIdentity(value.identity, 'evaluator profile identity');
  if (normalized.schema !== EVALUATOR_SCHEMA || normalized.status !== 'accepted' || normalized.contract?.id !== 'SPEC-0009'
      || normalized.id !== ownerProfile || normalized.execution?.deviceOwned !== true || normalized.execution?.hostProgress !== 'none'
      || !Array.isArray(normalized.resources)) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_EVALUATOR', 'normalized evaluator profile does not match the program-binding owner');
  }
  return { normalized, identity };
}

function resourceProfileResult(value, evaluatorResult) {
  object(value, 'Resource profile result');
  const normalized = object(value.normalized, 'normalized Resource profile');
  const identity = contentIdentity(value.identity, 'Resource profile identity');
  if (normalized.schema !== RESOURCE_SCHEMA || normalized.status !== 'accepted' || normalized.contract?.id !== 'SPEC-0011'
      || !Array.isArray(normalized.contributors) || !Array.isArray(normalized.classes) || !Array.isArray(normalized.partitions)
      || !Array.isArray(normalized.pools) || !Array.isArray(normalized.providerRequirements)) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_RESOURCE', 'normalized Resource profile is invalid');
  }
  const contributors = normalized.contributors.filter(({ contract, profile }) => contract?.id === 'SPEC-0009' && profile?.id === evaluatorResult.normalized.id);
  if (contributors.length !== 1) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_RESOURCE', 'Resource plan does not contain exactly one selected evaluator contributor');
  const contributor = contributors[0];
  if (contributor.profile?.schema?.id !== evaluatorResult.normalized.schema || contributor.profile?.identity?.algorithm !== 'sha256'
      || contributor.profile.identity.sha256 !== evaluatorResult.identity.sha256) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_IDENTITY', 'Resource evaluator contributor differs from the exact evaluator profile identity');
  }
  return { normalized, identity, contributor };
}

function programDescriptors(binding, admittedConnector) {
  const syntheticRuntime = {
    kind: 'cuda-mcgs-tensor-evaluator-runtime-contribution',
    contract: RUNTIME_CONTRACT,
    execution: { deviceOwned: true, hostProgress: 'none', requestCapacity: admittedConnector.requestCapacity, itemCapacity: admittedConnector.tensor.itemCapacity },
    resources: binding.resourceRequirements,
    tensorBindings: binding.tensorBindings,
  };
  return descriptors(syntheticRuntime, admittedConnector);
}

function exactResourceChain(resource, contributorId, evaluatorResource) {
  const classes = resource.classes.filter((entry) => entry.contributor === contributorId && entry.sourceResource === evaluatorResource.id);
  if (classes.length !== 1) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN', `${evaluatorResource.id} does not map to exactly one Resource class`);
  const resourceClass = classes[0];
  const partitions = resource.partitions.filter(({ class: classId }) => classId === resourceClass.id);
  if (partitions.length !== 1) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN', `${resourceClass.id} does not map to exactly one Resource partition`);
  const partition = partitions[0];
  if (partition.alias?.kind !== 'none') fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ALIAS', `${partition.id} must remain non-aliased in the first Tensor evaluator realization`);
  const pool = resource.pools.find(({ id }) => id === partition.pool);
  if (!pool) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN', `${partition.id} has no Resource pool`);
  const providers = resource.providerRequirements.filter(({ pool: poolId }) => poolId === pool.id);
  if (providers.length !== 1) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN', `${pool.id} does not map to exactly one provider requirement`);
  return { resourceClass, partition, pool, provider: providers[0] };
}

function requireAccess(envelope, required, label) {
  if (!Array.isArray(envelope)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS', `${label} access is absent`);
  for (const access of required) if (!envelope.includes(access)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS', `${label} omits required ${access} access`);
}

function bindDescriptor(descriptor, evaluator, resource, contributor) {
  const evaluatorResourceId = generatedResourceId(evaluator.id, descriptor.logicalId);
  const evaluatorResource = evaluator.resources.find(({ id }) => id === evaluatorResourceId);
  if (!evaluatorResource) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_RESOURCE', `${descriptor.parameterName} evaluator representation resource ${evaluatorResourceId} is absent`);
  const expected = resourceRecord(evaluator.id, descriptor);
  if (!sameResource(evaluatorResource, expected)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_RESOURCE', `${evaluatorResourceId} differs from the exact runtime layout`);
  const chain = exactResourceChain(resource, contributor.id, evaluatorResource);
  const byteLength = descriptor.byteLength;
  const alignment = descriptor.alignment;
  if (chain.resourceClass.unit !== 'bytes' || chain.pool.unit !== 'bytes' || chain.provider.unit !== 'bytes'
      || decimal(chain.resourceClass.minimumUnits, `${chain.resourceClass.id} minimumUnits`) !== byteLength
      || decimal(chain.resourceClass.formula?.maximumUnits, `${chain.resourceClass.id} maximumUnits`) !== byteLength
      || decimal(chain.partition.capacity, `${chain.partition.id} capacity`) !== byteLength
      || decimal(chain.pool.capacity, `${chain.pool.id} capacity`) < byteLength
      || decimal(chain.provider.capacity, `${chain.provider.id} capacity`) !== decimal(chain.pool.capacity, `${chain.pool.id} capacity`)) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN', `${evaluatorResourceId} Resource chain does not preserve the exact representation byte extent`);
  }
  const classAlignment = decimal(chain.resourceClass.alignment, `${chain.resourceClass.id} alignment`);
  const partitionAlignment = decimal(chain.partition.alignment, `${chain.partition.id} alignment`);
  const poolAlignment = decimal(chain.pool.alignment, `${chain.pool.id} alignment`);
  const providerAlignment = decimal(chain.provider.alignment, `${chain.provider.id} alignment`);
  const physicalOffset = decimal(chain.partition.offset, `${chain.partition.id} offset`);
  if (classAlignment < alignment || partitionAlignment < alignment || poolAlignment < alignment || providerAlignment < alignment
      || physicalOffset % alignment !== 0n) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ALIGNMENT', `${descriptor.parameterName} Resource placement violates runtime alignment`);
  }
  for (const memory of [chain.resourceClass.memorySpaces, chain.pool.memorySpaces, chain.provider.memorySpaces]) {
    if (!Array.isArray(memory) || !memory.includes('device-search')) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_MEMORY', `${descriptor.parameterName} is not device-search resident`);
  }
  requireAccess(chain.resourceClass.access, descriptor.requiredAccess, `${chain.resourceClass.id}`);
  requireAccess(chain.pool.access, descriptor.requiredAccess, `${chain.pool.id}`);
  requireAccess(chain.provider.access, descriptor.requiredAccess, `${chain.provider.id}`);
  return {
    parameterName: descriptor.parameterName,
    logicalId: descriptor.logicalId,
    source: descriptor.source,
    evaluatorResource: evaluatorResource.id,
    evaluatorResourceClass: evaluatorResource.class,
    resourceClass: chain.resourceClass.id,
    partition: chain.partition.id,
    pool: chain.pool.id,
    providerRequirement: chain.provider.id,
    requiredAccess: [...descriptor.requiredAccess],
    access: descriptor.requiredAccess.includes('write') ? (descriptor.requiredAccess.includes('read') ? 'read-write' : 'write') : 'read',
    view: { dtype: descriptor.dtype, byteOffset: physicalOffset.toString(), elementCount: descriptor.elementCount.toString() },
    byteLength: byteLength.toString(),
    alignment: alignment.toString(),
    initialization: descriptor.initialization,
  };
}

export function createTensorEvaluatorResourceBinding(programBindingInput, connectorInput, evaluatorProfileResultInput, resourceProfileResultInput) {
  const binding = programBinding(programBindingInput);
  const admittedConnector = connector(connectorInput);
  const evaluatorResult = evaluatorProfileResult(evaluatorProfileResultInput, binding.ownerProfile);
  const { normalized: resource, identity: resourceIdentity, contributor } = resourceProfileResult(resourceProfileResultInput, evaluatorResult);
  const { materialized, external } = programDescriptors(binding, admittedConnector);
  const allocations = materialized.map((descriptor) => bindDescriptor(descriptor, evaluatorResult.normalized, resource, contributor));
  const providers = [...new Set(allocations.map(({ providerRequirement }) => providerRequirement))].sort();
  return freeze({
    kind: 'cuda-mcgs-tensor-evaluator-resource-binding',
    contract: RESOURCE_BINDING_CONTRACT,
    ownerProfile: evaluatorResult.normalized.id,
    evaluatorProfileIdentity: { ...evaluatorResult.identity },
    resourcePlan: { id: resource.id, identity: { ...resourceIdentity } },
    evaluatorContributor: contributor.id,
    allocations,
    externalTensorParameters: external.map((descriptor) => ({
      parameterName: descriptor.parameterName,
      logicalId: descriptor.logicalId,
      dtype: descriptor.dtype,
      byteLength: descriptor.byteLength.toString(),
      alignment: descriptor.alignment.toString(),
      access: descriptor.requiredAccess.length === 1 ? descriptor.requiredAccess[0] : 'read-write',
      initialization: descriptor.initialization,
      owner: 'selected-evaluator-or-product-input',
    })),
    usesProviderRequirements: providers,
    ownership: {
      evaluatorRepresentationResources: allocations.map(({ evaluatorResource }) => evaluatorResource).sort(),
      providerRequirements: 'resource-owned-references-only',
      placement: 'resource-plan-partitions',
    },
    claimLimits: [
      'runtime-byte-extents-derived-from-admitted-tensor-runtime',
      'no-caller-supplied-resource-offsets',
      'resource-plan-policy-and-placement-not-created-or-mutated',
      'shared-immutable-tensor-input-binding-remains-explicit',
      'progress-runtime-entry-and-service-order-not-included',
      'no-native-or-provider-qualification',
    ],
  });
}

export const tensorEvaluatorResourceBindingConstants = Object.freeze({
  contract: RESOURCE_BINDING_CONTRACT,
  runtimeContract: RUNTIME_CONTRACT,
  programBindingContract: PROGRAM_BINDING_CONTRACT,
  connectorContract: CONNECTOR_CONTRACT,
  evaluatorSchema: EVALUATOR_SCHEMA,
  resourceSchema: RESOURCE_SCHEMA,
  dtypeWidth: DTYPE_WIDTH,
});

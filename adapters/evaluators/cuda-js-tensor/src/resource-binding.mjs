import { TensorEvaluatorConnectorError } from './connector.mjs';
import { tensorEvaluatorRuntimeConstants } from './runtime-contribution.mjs';

const RESOURCE_BINDING_CONTRACT = 'cuda-mcgs.tensor-evaluator-resource-binding/0.2.0';
const RUNTIME_CONTRACT = 'cuda-mcgs.tensor-evaluator-device-runtime/0.2.0';
const PROGRAM_BINDING_CONTRACT = 'cuda-mcgs.tensor-evaluator-program-binding/0.2.0';
const EVALUATOR_SCHEMA = 'cuda-mcgs.evaluator-profile/0.2.0';
const RESOURCE_SCHEMA = 'cuda-mcgs.resource-profile/0.2.0';
const NAMESPACED_ID = /^[a-z][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+$/;
const KEBAB = /^[a-z0-9][a-z0-9-]*$/;
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const DECIMAL = /^(?:0|[1-9][0-9]*)$/;
const HEX64 = /^[0-9a-f]{64}$/;
const DTYPE_WIDTH = tensorEvaluatorRuntimeConstants.dtypeWidth;
const RESOURCE_CLASSES = new Set(['batch', 'input', 'result', 'workspace']);
const REPRESENTATION_ROLES = new Set([
  'runtime-control',
  'request-staging',
  'result-staging',
  'tensor-input-staging',
  'tensor-output-staging',
  'tensor-workspace',
  'external-tensor-input',
]);

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

function kebab(value, label) {
  if (typeof value !== 'string' || !KEBAB.test(value)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ID', `${label} must be a stable kebab token`);
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

function accessList(value, label) {
  if (!Array.isArray(value) || value.length === 0) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS', `${label} must be a non-empty access array`);
  const allowed = new Set(['read', 'write', 'atomic']);
  const result = value.map((entry) => {
    if (!allowed.has(entry)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS', `${label} contains unsupported access ${entry}`);
    return entry;
  });
  if (new Set(result).size !== result.length) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS', `${label} contains duplicate access`);
  return result;
}

function runtime(value) {
  object(value, 'Tensor evaluator runtime contribution');
  if (value.kind !== 'cuda-mcgs-tensor-evaluator-runtime-contribution' || value.contract !== RUNTIME_CONTRACT
      || value.execution?.deviceOwned !== true || value.execution?.hostProgress !== 'none'
      || !Number.isSafeInteger(value.execution?.requestCapacity) || value.execution.requestCapacity <= 0
      || !Number.isSafeInteger(value.execution?.itemCapacity) || value.execution.itemCapacity <= 0
      || !Array.isArray(value.resources) || !Array.isArray(value.tensorBindings)) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_RUNTIME', 'runtime contribution is not the admitted explicit-layout Tensor evaluator runtime shape');
  }
  return value;
}

function programBinding(value) {
  object(value, 'Tensor evaluator program binding');
  if (value.kind !== 'cuda-mcgs-tensor-evaluator-program-binding' || value.contract !== PROGRAM_BINDING_CONTRACT
      || typeof value.ownerProfile !== 'string' || !Array.isArray(value.resourceRequirements) || !Array.isArray(value.tensorBindings)) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_PROGRAM', 'program binding is not the admitted explicit-layout Tensor evaluator program-binding shape');
  }
  return value;
}

function resourceClass(value, label) {
  if (typeof value !== 'string' || !RESOURCE_CLASSES.has(value)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_SEMANTIC', `${label} resourceClass is invalid`);
  return value;
}

function representationRole(value, label) {
  if (typeof value !== 'string' || !REPRESENTATION_ROLES.has(value)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_SEMANTIC', `${label} representationRole is invalid`);
  return value;
}

function runtimeDescriptor(entry) {
  exactKeys(entry, [
    'id', 'resourceKey', 'representationRole', 'parameterName', 'dtype', 'access', 'resourceClass', 'pressureStatus',
    'resourceAccess', 'elementCount', 'byteLength', 'alignmentBytes', 'initialization',
    ...(Object.hasOwn(entry, 'perRequestElements') ? ['perRequestElements', 'members'] : []),
  ], 'TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', 'runtime resource requirement');
  if (typeof entry.id !== 'string' || !entry.id.startsWith('runtime.')) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', 'runtime resource id is invalid');
  const resourceKey = kebab(entry.resourceKey, `${entry.id} resourceKey`);
  const role = representationRole(entry.representationRole, entry.id);
  identifier(entry.parameterName, `${entry.id} parameterName`);
  const elementCount = BigInt(positiveSafeInteger(entry.elementCount, `${entry.id} elementCount`));
  const byteLength = BigInt(positiveSafeInteger(entry.byteLength, `${entry.id} byteLength`));
  const dtypeWidth = BigInt(width(entry.dtype, entry.id));
  const alignment = BigInt(positiveSafeInteger(entry.alignmentBytes, `${entry.id} alignmentBytes`));
  if (elementCount * dtypeWidth !== byteLength) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', `${entry.id} element layout differs from byteLength`);
  if (alignment < dtypeWidth || alignment % dtypeWidth !== 0n) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ALIGNMENT', `${entry.id} alignment is incompatible with dtype width`);
  const requiredAccess = accessList(entry.resourceAccess, `${entry.id} resourceAccess`);
  if (entry.access !== 'read-write' || !requiredAccess.includes('read') || !requiredAccess.includes('write')) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS', `${entry.id} runtime representation access is incomplete`);
  }
  const klass = resourceClass(entry.resourceClass, entry.id);
  if (typeof entry.pressureStatus !== 'string' || entry.pressureStatus.length === 0) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_STATUS', `${entry.id} pressureStatus is invalid`);
  if (entry.initialization !== 'zero-before-ignition') fail('TENSOR_EVALUATOR_RESOURCE_BINDING_INITIALIZATION', `${entry.id} initialization is invalid`);
  return {
    logicalId: entry.id,
    resourceKey,
    representationRole: role,
    parameterName: entry.parameterName,
    dtype: entry.dtype,
    elementCount,
    byteLength,
    alignment,
    resourceClass: klass,
    pressureStatus: entry.pressureStatus,
    requiredAccess,
    initialization: entry.initialization,
    source: 'runtime-resource',
    external: false,
  };
}

function tensorDescriptor(entry) {
  exactKeys(entry, [
    'parameterIndex', 'resourceKey', 'representationRole', 'parameterName', 'role', 'type', 'dtype', 'access', 'itemVarying',
    'byteLength', 'storageDisposition', 'resourceClass', 'pressureStatus', 'resourceAccess', 'alignmentBytes', 'initialization',
  ], 'TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', 'Tensor binding');
  if (!Number.isSafeInteger(entry.parameterIndex) || entry.parameterIndex <= 0) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_PARAMETER', 'Tensor binding parameterIndex is invalid');
  identifier(entry.parameterName, 'Tensor binding parameterName');
  const resourceKey = kebab(entry.resourceKey, `${entry.parameterName} resourceKey`);
  const role = representationRole(entry.representationRole, entry.parameterName);
  const byteLength = BigInt(positiveSafeInteger(entry.byteLength, `${entry.parameterName} byteLength`));
  const dtypeWidth = BigInt(width(entry.dtype, entry.parameterName));
  const alignment = BigInt(positiveSafeInteger(entry.alignmentBytes, `${entry.parameterName} alignmentBytes`));
  if (entry.type !== `ptr<${entry.dtype}>` || byteLength % dtypeWidth !== 0n) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', `${entry.parameterName} Tensor type/byte layout is invalid`);
  if (alignment < dtypeWidth || alignment % dtypeWidth !== 0n) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ALIGNMENT', `${entry.parameterName} alignment is incompatible with dtype width`);
  const requiredAccess = accessList(entry.resourceAccess, `${entry.parameterName} resourceAccess`);
  if (entry.storageDisposition === 'external-owner-required') {
    if (role !== 'external-tensor-input' || entry.resourceClass !== null || entry.pressureStatus !== null || entry.initialization !== 'external-before-ignition'
        || entry.access !== 'read' || requiredAccess.length !== 1 || requiredAccess[0] !== 'read') {
      fail('TENSOR_EVALUATOR_RESOURCE_BINDING_SEMANTIC', `${entry.parameterName} external Tensor binding metadata is inconsistent`);
    }
    return {
      logicalId: `tensor.${entry.parameterName}`,
      resourceKey,
      representationRole: role,
      parameterName: entry.parameterName,
      dtype: entry.dtype,
      elementCount: byteLength / dtypeWidth,
      byteLength,
      alignment,
      requiredAccess,
      initialization: entry.initialization,
      source: 'shared-tensor-input',
      external: true,
    };
  }
  if (entry.storageDisposition !== 'evaluator-resource') fail('TENSOR_EVALUATOR_RESOURCE_BINDING_SEMANTIC', `${entry.parameterName} storageDisposition is invalid`);
  const klass = resourceClass(entry.resourceClass, entry.parameterName);
  if (typeof entry.pressureStatus !== 'string' || entry.pressureStatus.length === 0) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_STATUS', `${entry.parameterName} pressureStatus is invalid`);
  if (entry.initialization !== 'zero-before-ignition' || entry.access !== 'read-write' || !requiredAccess.includes('read') || !requiredAccess.includes('write')) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_SEMANTIC', `${entry.parameterName} evaluator Tensor representation metadata is inconsistent`);
  }
  return {
    logicalId: `tensor.${entry.parameterName}`,
    resourceKey,
    representationRole: role,
    parameterName: entry.parameterName,
    dtype: entry.dtype,
    elementCount: byteLength / dtypeWidth,
    byteLength,
    alignment,
    resourceClass: klass,
    pressureStatus: entry.pressureStatus,
    requiredAccess,
    initialization: entry.initialization,
    source: 'tensor-buffer',
    external: false,
  };
}

function descriptors(resourceRequirements, tensorBindings) {
  if (!Array.isArray(resourceRequirements) || !Array.isArray(tensorBindings)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', 'resource/tensor descriptor sets must be arrays');
  const materialized = resourceRequirements.map(runtimeDescriptor);
  const external = [];
  for (const entry of tensorBindings) {
    const descriptor = tensorDescriptor(entry);
    if (descriptor.external) external.push(descriptor);
    else materialized.push(descriptor);
  }
  const names = new Set();
  const logicalIds = new Set();
  const resourceKeys = new Set();
  for (const descriptor of [...materialized, ...external]) {
    if (names.has(descriptor.parameterName)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_PARAMETER', `${descriptor.parameterName} is duplicated across runtime/Tensor resources`);
    if (logicalIds.has(descriptor.logicalId)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', `${descriptor.logicalId} is duplicated`);
    if (resourceKeys.has(descriptor.resourceKey)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ID', `${descriptor.resourceKey} resourceKey is duplicated`);
    names.add(descriptor.parameterName);
    logicalIds.add(descriptor.logicalId);
    resourceKeys.add(descriptor.resourceKey);
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

function generatedResourceId(profileId, descriptor) {
  return `${profileId}.resource-${descriptor.resourceKey}`;
}

function resourceRecord(profileId, descriptor) {
  return {
    id: generatedResourceId(profileId, descriptor),
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
  const keys = ['id', 'class', 'unit', 'minimum', 'maximum', 'alignment', 'scope', 'pressureStatus'];
  return keys.every((key) => left?.[key] === right?.[key]) && Object.keys(left ?? {}).length === keys.length && Object.keys(right ?? {}).length === keys.length;
}

export function bindTensorEvaluatorProfileResources(profileInput, runtimeContributionInput) {
  const runtimeContribution = runtime(runtimeContributionInput);
  const profile = profileForBinding(profileInput);
  const { materialized } = descriptors(runtimeContribution.resources, runtimeContribution.tensorBindings);
  const statusCodes = new Set(profile.statuses.map(({ code }) => code));
  if (materialized.some(({ resourceClass: klass }) => klass === 'workspace') && profile.workspaces.length === 0) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_WORKSPACE', 'Tensor workspace requires selected evaluator workspace semantics; the adapter cannot manufacture workspace meaning');
  }
  const generated = materialized.map((descriptor) => resourceRecord(profile.id, descriptor));
  for (const entry of generated) if (!statusCodes.has(entry.pressureStatus)) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_STATUS', `${entry.id} pressure status ${entry.pressureStatus} is undeclared by evaluator profile`);
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

function exactResourceChain(resource, contributorId, evaluatorResource) {
  const classes = resource.classes.filter((entry) => entry.contributor === contributorId && entry.sourceResource === evaluatorResource.id);
  if (classes.length !== 1) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN', `${evaluatorResource.id} does not map to exactly one Resource class`);
  const resourceClassEntry = classes[0];
  const partitions = resource.partitions.filter(({ class: classId }) => classId === resourceClassEntry.id);
  if (partitions.length !== 1) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN', `${resourceClassEntry.id} does not map to exactly one Resource partition`);
  const partition = partitions[0];
  if (partition.alias?.kind !== 'none') fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ALIAS', `${partition.id} must remain non-aliased in the first Tensor evaluator realization`);
  const pool = resource.pools.find(({ id }) => id === partition.pool);
  if (!pool) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN', `${partition.id} has no Resource pool`);
  const providers = resource.providerRequirements.filter(({ pool: poolId }) => poolId === pool.id);
  if (providers.length !== 1) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN', `${pool.id} does not map to exactly one provider requirement`);
  return { resourceClass: resourceClassEntry, partition, pool, provider: providers[0] };
}

function requireAccess(envelope, required, label) {
  if (!Array.isArray(envelope)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS', `${label} access is absent`);
  for (const access of required) if (!envelope.includes(access)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS', `${label} omits required ${access} access`);
}

function bindDescriptor(descriptor, evaluator, resource, contributor) {
  const evaluatorResourceId = generatedResourceId(evaluator.id, descriptor);
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
    resourceKey: descriptor.resourceKey,
    representationRole: descriptor.representationRole,
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

export function createTensorEvaluatorResourceBinding(programBindingInput, evaluatorProfileResultInput, resourceProfileResultInput) {
  const binding = programBinding(programBindingInput);
  const evaluatorResult = evaluatorProfileResult(evaluatorProfileResultInput, binding.ownerProfile);
  const { normalized: resource, identity: resourceIdentity, contributor } = resourceProfileResult(resourceProfileResultInput, evaluatorResult);
  const { materialized, external } = descriptors(binding.resourceRequirements, binding.tensorBindings);
  const resourceBindings = materialized.map((descriptor) => bindDescriptor(descriptor, evaluatorResult.normalized, resource, contributor));
  const providers = [...new Set(resourceBindings.map(({ providerRequirement }) => providerRequirement))].sort();
  return freeze({
    kind: 'cuda-mcgs-tensor-evaluator-resource-binding',
    contract: RESOURCE_BINDING_CONTRACT,
    ownerProfile: evaluatorResult.normalized.id,
    evaluatorProfileIdentity: { ...evaluatorResult.identity },
    resourcePlan: { id: resource.id, identity: { ...resourceIdentity } },
    evaluatorContributor: contributor.id,
    resourceBindings,
    externalTensorParameters: external.map((descriptor) => ({
      parameterName: descriptor.parameterName,
      logicalId: descriptor.logicalId,
      resourceKey: descriptor.resourceKey,
      representationRole: descriptor.representationRole,
      dtype: descriptor.dtype,
      byteLength: descriptor.byteLength.toString(),
      alignment: descriptor.alignment.toString(),
      access: descriptor.requiredAccess.length === 1 ? descriptor.requiredAccess[0] : 'read-write',
      initialization: descriptor.initialization,
      bindingStatus: 'owner-binding-required',
    })),
    usesProviderRequirements: providers,
    ownership: {
      evaluatorRepresentationResources: resourceBindings.map(({ evaluatorResource }) => evaluatorResource).sort(),
      providerRequirements: 'resource-owned-references-only',
      placement: 'resource-plan-partitions',
    },
    claimLimits: [
      'runtime-byte-extents-and-classification-come-from-explicit-runtime-metadata',
      'no-name-or-prefix-semantic-inference',
      'no-synthetic-runtime-reconstruction',
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
  evaluatorSchema: EVALUATOR_SCHEMA,
  resourceSchema: RESOURCE_SCHEMA,
  dtypeWidth: DTYPE_WIDTH,
});

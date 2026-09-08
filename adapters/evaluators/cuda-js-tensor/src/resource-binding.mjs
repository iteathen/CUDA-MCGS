import { TensorEvaluatorConnectorError } from './connector.mjs';

const RESOURCE_BINDING_CONTRACT = 'cuda-mcgs.tensor-evaluator-resource-binding/0.1.0';
const PROGRAM_BINDING_CONTRACT = 'cuda-mcgs.tensor-evaluator-program-binding/0.1.0';
const EVALUATOR_SCHEMA = 'cuda-mcgs.evaluator-profile/0.2.0';
const RESOURCE_SCHEMA = 'cuda-mcgs.resource-profile/0.2.0';
const DTYPE_WIDTH = Object.freeze({ u32: 4, i32: 4, u64: 8, f32: 4, f64: 8, f16: 2, bf16: 2 });
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const DECIMAL = /^(?:0|[1-9][0-9]*)$/;

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
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(code, `${label} fields must be exactly ${wanted.join(', ')}`);
  }
}

function decimal(value, label) {
  if (typeof value !== 'string' || !DECIMAL.test(value)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_RANGE', `${label} must be a canonical decimal uint string`);
  return BigInt(value);
}

function width(dtype, label) {
  const value = DTYPE_WIDTH[dtype];
  if (!value) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_DTYPE', `${label} uses unsupported dtype ${dtype}`);
  return BigInt(value);
}

function identifier(value, label) {
  if (typeof value !== 'string' || !IDENTIFIER.test(value)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_PARAMETER', `${label} must be a Device-JS identifier`);
  return value;
}

function accessSet(value, label) {
  const result = value === 'read' ? ['read'] : (value === 'write' ? ['write'] : (value === 'read-write' ? ['read', 'write'] : null));
  if (!result) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS', `${label} access is invalid`);
  return result;
}

function programBinding(value) {
  object(value, 'Tensor evaluator program binding');
  if (value.kind !== 'cuda-mcgs-tensor-evaluator-program-binding' || value.contract !== PROGRAM_BINDING_CONTRACT
      || typeof value.ownerProfile !== 'string' || !Array.isArray(value.functions) || value.functions.length === 0
      || !Array.isArray(value.resourceRequirements) || !Array.isArray(value.tensorBindings)) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_PROGRAM', 'program binding is not the admitted Tensor evaluator program-binding shape');
  }
  return value;
}

function evaluatorProfile(value, ownerProfile) {
  object(value, 'normalized evaluator profile');
  if (value.schema !== EVALUATOR_SCHEMA || value.status !== 'accepted' || value.contract?.id !== 'SPEC-0009'
      || value.id !== ownerProfile || value.execution?.deviceOwned !== true || value.execution?.hostProgress !== 'none'
      || !Array.isArray(value.resources)) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_EVALUATOR', 'normalized evaluator profile does not match the program-binding owner');
  }
  return value;
}

function resourceProfile(value, evaluator) {
  object(value, 'normalized Resource profile');
  if (value.schema !== RESOURCE_SCHEMA || value.status !== 'accepted' || value.contract?.id !== 'SPEC-0011'
      || !Array.isArray(value.contributors) || !Array.isArray(value.classes) || !Array.isArray(value.partitions)
      || !Array.isArray(value.pools) || !Array.isArray(value.providerRequirements)) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_RESOURCE', 'normalized Resource profile is invalid');
  }
  const contributors = value.contributors.filter(({ contract, profile }) => contract?.id === 'SPEC-0009' && profile?.id === evaluator.id);
  if (contributors.length !== 1) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_RESOURCE', 'Resource plan does not contain exactly one selected evaluator contributor');
  return { profile: value, contributor: contributors[0] };
}

function runtimeDescriptor(entry) {
  object(entry, 'runtime resource requirement');
  identifier(entry.parameterName, `${entry.id ?? '<unknown>'} parameterName`);
  if (typeof entry.id !== 'string' || !entry.id.startsWith('runtime.') || !Number.isSafeInteger(entry.byteLength) || entry.byteLength <= 0
      || !Number.isSafeInteger(entry.elementCount) || entry.elementCount <= 0) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', `${entry.id ?? '<unknown>'} runtime resource requirement is invalid`);
  }
  const dtypeWidth = width(entry.dtype, entry.id);
  if (BigInt(entry.elementCount) * dtypeWidth !== BigInt(entry.byteLength)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', `${entry.id} element layout differs from byteLength`);
  let allowedClasses;
  let requiredAccess = accessSet(entry.access, entry.id);
  if (entry.id === 'runtime.control32') {
    allowedClasses = ['workspace'];
    requiredAccess = ['read', 'write', 'atomic'];
  } else if (entry.id === 'runtime.control64') {
    allowedClasses = ['workspace'];
  } else if (entry.id.startsWith('runtime.request-input.')) {
    allowedClasses = ['input'];
  } else if (entry.id.startsWith('runtime.result-output.')) {
    allowedClasses = ['result'];
  } else {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', `unknown runtime logical resource ${entry.id}`);
  }
  return {
    parameterName: entry.parameterName,
    logicalId: entry.id,
    logicalKind: 'runtime-resource',
    dtype: entry.dtype,
    elementCount: BigInt(entry.elementCount),
    byteLength: BigInt(entry.byteLength),
    requiredAccess,
    allowedClasses,
    initialization: entry.initialization,
  };
}

function tensorDescriptor(entry) {
  object(entry, 'Tensor binding');
  identifier(entry.parameterName, `${entry.parameterName ?? '<unknown>'} parameterName`);
  if (!Number.isSafeInteger(entry.byteLength) || entry.byteLength <= 0) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', `${entry.parameterName} Tensor binding byteLength is invalid`);
  const dtypeWidth = width(entry.dtype, entry.parameterName);
  if (BigInt(entry.byteLength) % dtypeWidth !== 0n) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', `${entry.parameterName} Tensor binding byteLength is not dtype aligned`);
  let allowedClasses;
  if (entry.role === 'input' && entry.itemVarying === true) allowedClasses = ['input'];
  else if (entry.role === 'input' && entry.itemVarying === false) allowedClasses = ['artifact', 'input'];
  else if (entry.role === 'output') allowedClasses = ['result'];
  else if (entry.role === 'workspace') allowedClasses = ['workspace'];
  else fail('TENSOR_EVALUATOR_RESOURCE_BINDING_LOGICAL', `${entry.parameterName} Tensor role is unsupported`);
  return {
    parameterName: entry.parameterName,
    logicalId: `tensor.${entry.parameterName}`,
    logicalKind: 'tensor-binding',
    dtype: entry.dtype,
    elementCount: BigInt(entry.byteLength) / dtypeWidth,
    byteLength: BigInt(entry.byteLength),
    requiredAccess: accessSet(entry.access, entry.parameterName),
    allowedClasses,
    initialization: entry.initialization,
  };
}

function logicalDescriptors(binding) {
  const descriptors = [...binding.resourceRequirements.map(runtimeDescriptor), ...binding.tensorBindings.map(tensorDescriptor)];
  const byParameter = new Map();
  for (const descriptor of descriptors) {
    if (byParameter.has(descriptor.parameterName)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_PARAMETER', `logical parameter ${descriptor.parameterName} is duplicated`);
    byParameter.set(descriptor.parameterName, descriptor);
  }
  const pointerTypes = new Map();
  for (const fn of binding.functions) {
    for (const parameter of fn.parameters ?? []) {
      if (typeof parameter.type !== 'string' || !parameter.type.startsWith('ptr<')) continue;
      const match = /^ptr<([A-Za-z0-9_-]+)>$/.exec(parameter.type);
      if (!match) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_PARAMETER', `${fn.name}.${parameter.name} pointer type is invalid`);
      const prior = pointerTypes.get(parameter.name);
      if (prior && prior !== match[1]) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_PARAMETER', `${parameter.name} has inconsistent pointer dtypes`);
      pointerTypes.set(parameter.name, match[1]);
    }
  }
  if (pointerTypes.size !== byParameter.size || [...pointerTypes.keys()].some((name) => !byParameter.has(name))) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_COVERAGE', 'logical resources do not exactly cover evaluator program pointer parameters');
  }
  for (const [name, dtype] of pointerTypes) if (byParameter.get(name).dtype !== dtype) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_DTYPE', `${name} logical dtype differs from program pointer type`);
  }
  return byParameter;
}

function exactResourceChain(resource, contributorId, evaluatorResource) {
  const classes = resource.classes.filter((entry) => entry.contributor === contributorId && entry.sourceResource === evaluatorResource.id);
  if (classes.length !== 1) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN', `${evaluatorResource.id} does not map to exactly one Resource class`);
  const resourceClass = classes[0];
  const partitions = resource.partitions.filter(({ class: classId }) => classId === resourceClass.id);
  if (partitions.length !== 1) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN', `${resourceClass.id} does not map to exactly one partition`);
  const partition = partitions[0];
  const pool = resource.pools.find(({ id }) => id === partition.pool);
  if (!pool) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN', `${partition.id} has no Resource pool`);
  const providers = resource.providerRequirements.filter(({ pool: poolId }) => poolId === pool.id);
  if (providers.length !== 1) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN', `${pool.id} does not map to exactly one provider requirement`);
  return { resourceClass, partition, pool, provider: providers[0] };
}

function assertPhysicalEnvelope(descriptor, evaluatorResource, chain, localOffset) {
  if (evaluatorResource.unit !== 'bytes' || !descriptor.allowedClasses.includes(evaluatorResource.class)) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_SEMANTIC', `${descriptor.parameterName} cannot bind to evaluator resource ${evaluatorResource.id}`);
  }
  const maximum = decimal(evaluatorResource.maximum, `${evaluatorResource.id} maximum`);
  const partitionCapacity = decimal(chain.partition.capacity, `${chain.partition.id} capacity`);
  const partitionOffset = decimal(chain.partition.offset, `${chain.partition.id} offset`);
  const poolCapacity = decimal(chain.pool.capacity, `${chain.pool.id} capacity`);
  const providerCapacity = decimal(chain.provider.capacity, `${chain.provider.id} capacity`);
  if (chain.resourceClass.unit !== 'bytes' || chain.pool.unit !== 'bytes' || chain.provider.unit !== 'bytes'
      || decimal(chain.resourceClass.formula?.maximumUnits, `${chain.resourceClass.id} maximumUnits`) !== maximum
      || partitionCapacity < maximum || providerCapacity !== poolCapacity) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN', `${evaluatorResource.id} Resource chain does not preserve its byte capacity`);
  }
  if (!chain.resourceClass.memorySpaces.includes('device-search') || !chain.pool.memorySpaces.includes('device-search') || !chain.provider.memorySpaces.includes('device-search')) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_MEMORY', `${descriptor.parameterName} is not backed by device-search storage`);
  }
  for (const required of descriptor.requiredAccess) {
    if (!chain.resourceClass.access.includes(required) || !chain.pool.access.includes(required) || !chain.provider.access.includes(required)) {
      fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS', `${descriptor.parameterName} requires ${required} access absent from its Resource chain`);
    }
  }
  if (localOffset + descriptor.byteLength > partitionCapacity) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_RANGE', `${descriptor.parameterName} exceeds its evaluator Resource partition`);
  const physicalOffset = partitionOffset + localOffset;
  const dtypeWidth = width(descriptor.dtype, descriptor.parameterName);
  if (physicalOffset % dtypeWidth !== 0n || physicalOffset + descriptor.byteLength > poolCapacity) {
    fail('TENSOR_EVALUATOR_RESOURCE_BINDING_ALIGNMENT', `${descriptor.parameterName} provider-relative view is misaligned or out of range`);
  }
  return physicalOffset;
}

function overlap(left, right) {
  return left.pool === right.pool && left.byteOffset < right.byteOffset + right.byteLength && right.byteOffset < left.byteOffset + left.byteLength;
}

export function createTensorEvaluatorResourceBinding(programBindingInput, normalizedEvaluatorProfile, normalizedResourceProfile, options = {}) {
  const binding = programBinding(programBindingInput);
  const evaluator = evaluatorProfile(normalizedEvaluatorProfile, binding.ownerProfile);
  const { profile: resource, contributor } = resourceProfile(normalizedResourceProfile, evaluator);
  exactKeys(options, ['allocations'], 'TENSOR_EVALUATOR_RESOURCE_BINDING_OPTIONS', 'resource-binding options');
  if (!Array.isArray(options.allocations)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_OPTIONS', 'allocations must be an array');
  const logicalByParameter = logicalDescriptors(binding);
  if (options.allocations.length !== logicalByParameter.size) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_COVERAGE', 'allocations must exactly cover every logical pointer parameter');
  const allocationByParameter = new Map();
  for (let index = 0; index < options.allocations.length; index += 1) {
    const allocation = options.allocations[index];
    exactKeys(allocation, ['parameterName', 'evaluatorResource', 'byteOffset'], 'TENSOR_EVALUATOR_RESOURCE_BINDING_ALLOCATION_FIELDS', `allocation ${index}`);
    identifier(allocation.parameterName, `allocation ${index} parameterName`);
    if (allocationByParameter.has(allocation.parameterName)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_COVERAGE', `${allocation.parameterName} allocation is duplicated`);
    allocationByParameter.set(allocation.parameterName, allocation);
  }
  if ([...logicalByParameter.keys()].some((name) => !allocationByParameter.has(name))) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_COVERAGE', 'allocations omit a logical pointer parameter');

  const evaluatorById = new Map(evaluator.resources.map((entry) => [entry.id, entry]));
  const views = [];
  for (const [parameterName, descriptor] of [...logicalByParameter].sort(([left], [right]) => left.localeCompare(right))) {
    const allocation = allocationByParameter.get(parameterName);
    const evaluatorResource = evaluatorById.get(allocation.evaluatorResource);
    if (!evaluatorResource) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_SEMANTIC', `${parameterName} names unknown evaluator resource ${allocation.evaluatorResource}`);
    const localOffset = decimal(allocation.byteOffset, `${parameterName} byteOffset`);
    const chain = exactResourceChain(resource, contributor.id, evaluatorResource);
    const physicalOffset = assertPhysicalEnvelope(descriptor, evaluatorResource, chain, localOffset);
    views.push({
      parameterName,
      logicalId: descriptor.logicalId,
      logicalKind: descriptor.logicalKind,
      evaluatorResource: evaluatorResource.id,
      evaluatorResourceClass: evaluatorResource.class,
      resourceClass: chain.resourceClass.id,
      partition: chain.partition.id,
      pool: chain.pool.id,
      providerRequirement: chain.provider.id,
      access: descriptor.requiredAccess.includes('write') ? (descriptor.requiredAccess.includes('read') ? 'read-write' : 'write') : 'read',
      requiredAccess: [...descriptor.requiredAccess],
      view: {
        dtype: descriptor.dtype,
        byteOffset: physicalOffset.toString(),
        elementCount: descriptor.elementCount.toString(),
      },
      byteLength: descriptor.byteLength.toString(),
      localByteOffset: localOffset.toString(),
      initialization: descriptor.initialization,
    });
  }
  for (let leftIndex = 0; leftIndex < views.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < views.length; rightIndex += 1) {
      const left = { pool: views[leftIndex].pool, byteOffset: BigInt(views[leftIndex].view.byteOffset), byteLength: BigInt(views[leftIndex].byteLength) };
      const right = { pool: views[rightIndex].pool, byteOffset: BigInt(views[rightIndex].view.byteOffset), byteLength: BigInt(views[rightIndex].byteLength) };
      if (overlap(left, right)) fail('TENSOR_EVALUATOR_RESOURCE_BINDING_OVERLAP', `${views[leftIndex].parameterName} and ${views[rightIndex].parameterName} overlap in ${left.pool}`);
    }
  }
  const providers = [...new Set(views.map(({ providerRequirement }) => providerRequirement))].sort();
  const result = {
    kind: 'cuda-mcgs-tensor-evaluator-resource-binding',
    contract: RESOURCE_BINDING_CONTRACT,
    ownerProfile: evaluator.id,
    resourcePlan: resource.id,
    evaluatorContributor: contributor.id,
    allocations: views,
    usesProviderRequirements: providers,
    ownership: {
      logicalParameters: views.map(({ parameterName }) => parameterName).sort(),
      evaluatorResources: [...new Set(views.map(({ evaluatorResource }) => evaluatorResource))].sort(),
      providerRequirements: 'resource-owned-references-only',
    },
    claimLimits: [
      'explicit-caller-owned-byte-placement',
      'resource-plan-policy-not-created-or-mutated',
      'provider-requirements-referenced-not-owned',
      'progress-runtime-entry-and-service-order-not-included',
      'no-native-or-provider-qualification',
    ],
  };
  return freeze(result);
}

export const tensorEvaluatorResourceBindingConstants = Object.freeze({
  contract: RESOURCE_BINDING_CONTRACT,
  programBindingContract: PROGRAM_BINDING_CONTRACT,
  evaluatorSchema: EVALUATOR_SCHEMA,
  resourceSchema: RESOURCE_SCHEMA,
  dtypeWidth: DTYPE_WIDTH,
});

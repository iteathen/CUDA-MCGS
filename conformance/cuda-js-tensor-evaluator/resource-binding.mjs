import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  TensorEvaluatorConnectorError,
  bindTensorEvaluatorProfileProgram,
  createTensorEvaluatorConnector,
  createTensorEvaluatorProgramBinding,
  createTensorEvaluatorResourceBinding,
  createTensorEvaluatorRuntimeContribution,
  tensorEvaluatorResourceBindingConstants,
} from '../../adapters/evaluators/cuda-js-tensor/index.mjs';

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function schemaReference(id) {
  const version = id.split('/').at(-1);
  return { id, version, sha256: sha256(`schema:${id}`) };
}

function fakeTensorDeviceProgram() {
  const parameters = [
    { parameterIndex: 0, parameterName: 'itemIndex', role: 'item-index', type: 'u32', dtype: 'u32', access: 'read', itemVarying: false },
    { parameterIndex: 1, parameterName: 'features', role: 'input', type: 'ptr<f32>', dtype: 'f32', access: 'read', itemVarying: true, byteLength: 16 },
    { parameterIndex: 2, parameterName: 'weights', role: 'input', type: 'ptr<f32>', dtype: 'f32', access: 'read', itemVarying: false, byteLength: 16 },
    { parameterIndex: 3, parameterName: 'scores', role: 'output', type: 'ptr<f32>', dtype: 'f32', access: 'write', itemVarying: true, byteLength: 16 },
    { parameterIndex: 4, parameterName: 'scratch', role: 'workspace', type: 'ptr<f32>', dtype: 'f32', access: 'read-write', itemVarying: true, byteLength: 16 },
  ];
  const fn = { name: 'tensorRunItem', parameters: parameters.map(({ parameterName: name, type }) => ({ name, type })), returns: 'u32' };
  const library = {
    schemaVersion: 1,
    contract: 'SPEC-0013-v1+SPEC-0022-atomic-observation-v1+SPEC-0022-device-publication-v1+SPEC-0014-publication-mailbox-v1+SPEC-0030-dense-numeric-v1+SPEC-0028-device-library-v1',
    sha256: '1'.repeat(64),
    format: 'lto-ir',
    architecture: 'compute_90',
    exports: [{ name: 'tensorRunItem', symbol: 'tensorRunItem', parameters: fn.parameters, returns: 'u32' }],
    artifact: { format: 'lto-ir', bytes: new Uint8Array([1]), byteLength: 1, sha256: '2'.repeat(64), architecture: 'compute_90', producer: { profile: 'fixture', nvrtcVersion: 'fixture' } },
  };
  return {
    kind: 'tensor-device-program', contract: 'SPEC-0009-item-parallel-device-tensor-program-v1', itemCapacity: 2, outputFormat: 'lto-ir', parameters,
    inputs: [
      { ...parameters[1], name: 'features', valueId: 'value.features', elementCount: 4 },
      { ...parameters[2], name: 'weights', valueId: 'value.weights', elementCount: 4 },
    ],
    outputs: [{ ...parameters[3], name: 'scores', valueId: 'value.scores', perItemElements: 2, elementCount: 4 }],
    workspace: [{ ...parameters[4], perItemElements: 2, elementCount: 4, alignmentBytes: 8 }],
    totalWorkspaceBytes: 16,
    function: fn, compatibilityIdentity: 'tensor-resource-binding-fixture-v1', library,
    importAs(alias) { return Object.freeze({ library, name: 'tensorRunItem', as: alias }); },
  };
}

const workClasses = Object.freeze({
  encode: 'evaluator.tensor.work-encode', admit: 'evaluator.tensor.work-admit', batch: 'evaluator.tensor.work-batch',
  execute: 'evaluator.tensor.work-execute', scatter: 'evaluator.tensor.work-scatter', publish: 'evaluator.tensor.work-publish',
});

function evaluatorProfileInput() {
  return {
    schema: 'cuda-mcgs.evaluator-profile/0.2.0', representation: 'cuda-mcgs.search-ir/0.2.0', status: 'accepted',
    contract: { kind: 'catalog', id: 'SPEC-0009', specificationIdentity: 'CUDA-MCGS-SPEC-0009@0.2.0', sha256: '3'.repeat(64) },
    id: 'evaluator.tensor', version: '0.1.0',
    request: { maxActive: '3' }, batching: { minimumReadyItems: '1', maximumItems: '2' },
    execution: { deviceOwned: true, hostProgress: 'none', workClasses: Object.values(workClasses) },
    statuses: [
      'evaluator-request-capacity', 'evaluator-input-stale', 'evaluator-cancelled', 'evaluator-internal-failure',
      'evaluator-generation-exhausted', 'evaluator-batch-pending',
    ].map((code) => ({ code })),
    resources: [
      { id: 'evaluator.tensor.resource-input', class: 'input', unit: 'bytes', minimum: '1', maximum: '1024', alignment: '8', scope: 'per-engine', pressureStatus: 'invalid-evaluator-input' },
      { id: 'evaluator.tensor.resource-result', class: 'result', unit: 'bytes', minimum: '1', maximum: '1024', alignment: '8', scope: 'per-engine', pressureStatus: 'evaluator-output-invalid' },
      { id: 'evaluator.tensor.resource-workspace', class: 'workspace', unit: 'bytes', minimum: '1', maximum: '1024', alignment: '8', scope: 'per-engine', pressureStatus: 'evaluator-workspace-capacity' },
      { id: 'evaluator.tensor.resource-artifact', class: 'artifact', unit: 'bytes', minimum: '1', maximum: '1024', alignment: '8', scope: 'per-engine', pressureStatus: 'evaluator-artifact-invalid' },
    ],
    programContribution: {
      kind: 'device-program', language: 'restricted-device-js', sourceIdentity: { algorithm: 'sha256', sha256: '0'.repeat(64) }, inputs: [],
      provenance: { origin: 'first-party', revision: '4'.repeat(40), license: 'Apache-2.0', review: schemaReference('cuda-mcgs.tensor-resource-binding-review/0.1.0') },
    },
  };
}

function resourceProfile(evaluator) {
  const owner = 'owner.evaluator.tensor';
  const classFor = (resource) => ({
    id: `resource.class-${resource.class}`, contributor: owner, sourceResource: resource.id, unit: 'bytes',
    formula: { maximumUnits: resource.maximum }, memorySpaces: ['device-search'], access: ['read', 'write', 'atomic'],
  });
  const classes = evaluator.resources.map(classFor);
  const pools = classes.map((entry) => ({
    id: `resource.pool-${entry.id.split('-').at(-1)}`, unit: 'bytes', capacity: '1024', alignment: '8',
    memorySpaces: ['device-search'], access: ['read', 'write', 'atomic'], lifetime: 'engine', providerRequirement: `resource.provider-${entry.id.split('-').at(-1)}`,
  }));
  const partitions = classes.map((entry, index) => ({
    id: `resource.partition-${entry.id.split('-').at(-1)}`, class: entry.id, pool: pools[index].id, offset: '0', capacity: '1024', alignment: '8', cleanupOrder: String(index + 1), alias: { kind: 'none' },
  }));
  const providers = pools.map((entry) => ({
    id: entry.providerRequirement, pool: entry.id, unit: 'bytes', capacity: entry.capacity, alignment: entry.alignment,
    memorySpaces: [...entry.memorySpaces], access: [...entry.access], lifecycle: schemaReference(`cuda-mcgs.${entry.id}-lifecycle/0.1.0`), opaqueResult: { algorithm: 'sha256', sha256: sha256(entry.id) },
  }));
  const nonTensorClass = { id: 'resource.class-non-tensor', contributor: 'owner.evaluator.analytic', sourceResource: 'evaluator.analytic.resource-workspace', unit: 'bytes', formula: { maximumUnits: '2048' }, memorySpaces: ['device-search'], access: ['read', 'write'] };
  const nonTensorPool = { id: 'resource.pool-non-tensor', unit: 'bytes', capacity: '2048', alignment: '8', memorySpaces: ['device-search'], access: ['read', 'write'], lifetime: 'engine', providerRequirement: 'resource.provider-non-tensor' };
  return {
    schema: 'cuda-mcgs.resource-profile/0.2.0', representation: 'cuda-mcgs.search-ir/0.2.0', status: 'accepted', contract: { id: 'SPEC-0011' }, id: 'resource.tensor-fixture',
    contributors: [
      { id: owner, contract: { id: 'SPEC-0009' }, profile: { id: evaluator.id } },
      { id: 'owner.evaluator.analytic', contract: { id: 'SPEC-0009' }, profile: { id: 'evaluator.analytic' } },
    ],
    classes: [...classes, nonTensorClass],
    partitions: [...partitions, { id: 'resource.partition-non-tensor', class: nonTensorClass.id, pool: nonTensorPool.id, offset: '0', capacity: '2048', alignment: '8', cleanupOrder: '99', alias: { kind: 'none' } }],
    pools: [...pools, nonTensorPool],
    providerRequirements: [...providers, { id: nonTensorPool.providerRequirement, pool: nonTensorPool.id, unit: 'bytes', capacity: '2048', alignment: '8', memorySpaces: ['device-search'], access: ['read', 'write'], lifecycle: schemaReference('cuda-mcgs.non-tensor-lifecycle/0.1.0'), opaqueResult: { algorithm: 'sha256', sha256: '5'.repeat(64) } }],
  };
}

function align(value, alignment) {
  const remainder = value % alignment;
  return remainder === 0 ? value : value + alignment - remainder;
}

const connector = createTensorEvaluatorConnector(fakeTensorDeviceProgram(), { requestCapacity: 3 });
const runtime = createTensorEvaluatorRuntimeContribution(connector);
const requirements = runtime.requiredCudaJsContracts.map(schemaReference);
const boundEvaluator = bindTensorEvaluatorProfileProgram(evaluatorProfileInput(), runtime, { publicRequirements: requirements });
const program = createTensorEvaluatorProgramBinding(runtime, boundEvaluator, { id: 'evaluator.tensor.program-binding', workClasses });
const resources = resourceProfile(boundEvaluator);
const runtimeByParameter = new Map(program.resourceRequirements.map((entry) => [entry.parameterName, entry]));
const tensorByParameter = new Map(program.tensorBindings.map((entry) => [entry.parameterName, entry]));
let inputOffset = 0;
let resultOffset = 0;
let workspaceOffset = 0;
const allocations = [];
function place(parameterName, evaluatorResource, byteLength, alignment) {
  let offset;
  if (evaluatorResource.endsWith('resource-input')) { inputOffset = align(inputOffset, alignment); offset = inputOffset; inputOffset += byteLength; }
  else if (evaluatorResource.endsWith('resource-result')) { resultOffset = align(resultOffset, alignment); offset = resultOffset; resultOffset += byteLength; }
  else if (evaluatorResource.endsWith('resource-workspace')) { workspaceOffset = align(workspaceOffset, alignment); offset = workspaceOffset; workspaceOffset += byteLength; }
  else offset = 0;
  allocations.push({ parameterName, evaluatorResource, byteOffset: String(offset) });
}
for (const entry of program.resourceRequirements) {
  const target = entry.id.startsWith('runtime.request-input.') ? 'evaluator.tensor.resource-input'
    : (entry.id.startsWith('runtime.result-output.') ? 'evaluator.tensor.resource-result' : 'evaluator.tensor.resource-workspace');
  place(entry.parameterName, target, entry.byteLength, entry.dtype === 'u64' ? 8 : 4);
}
for (const entry of program.tensorBindings) {
  const target = entry.role === 'workspace' ? 'evaluator.tensor.resource-workspace'
    : (entry.role === 'output' ? 'evaluator.tensor.resource-result'
      : (entry.role === 'input' && entry.itemVarying === false ? 'evaluator.tensor.resource-artifact' : 'evaluator.tensor.resource-input'));
  place(entry.parameterName, target, entry.byteLength, 4);
}

const binding = createTensorEvaluatorResourceBinding(program, boundEvaluator, resources, { allocations });
assert.equal(binding.contract, tensorEvaluatorResourceBindingConstants.contract);
assert.equal(binding.ownerProfile, boundEvaluator.id);
assert.equal(binding.resourcePlan, resources.id);
assert.equal(binding.allocations.length, runtimeByParameter.size + tensorByParameter.size);
assert(binding.allocations.every(({ resourceClass }) => resources.classes.find(({ id }) => id === resourceClass)?.contributor === 'owner.evaluator.tensor'));
assert(binding.allocations.every(({ providerRequirement }) => resources.providerRequirements.some(({ id }) => id === providerRequirement)));
assert(binding.allocations.every(({ view, byteLength }) => BigInt(view.elementCount) * BigInt(tensorEvaluatorResourceBindingConstants.dtypeWidth[view.dtype]) === BigInt(byteLength)));
assert(binding.allocations.some(({ parameterName, evaluatorResourceClass, requiredAccess }) => parameterName === 'mcgsEvalControl32' && evaluatorResourceClass === 'workspace' && requiredAccess.includes('atomic')));
assert(binding.allocations.some(({ parameterName, evaluatorResourceClass }) => parameterName === 'weights' && evaluatorResourceClass === 'artifact'));
assert(!binding.usesProviderRequirements.includes('resource.provider-non-tensor'));
assert.equal(binding.ownership.providerRequirements, 'resource-owned-references-only');
assert(binding.claimLimits.includes('progress-runtime-entry-and-service-order-not-included'));
assert.equal('progress' in binding, false);
assert(Object.isFrozen(binding));
assert(Object.isFrozen(binding.allocations[0]));

const missing = allocations.slice(1);
assert.throws(
  () => createTensorEvaluatorResourceBinding(program, boundEvaluator, resources, { allocations: missing }),
  (error) => error instanceof TensorEvaluatorConnectorError && error.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_COVERAGE',
);
const wrongSemantic = structuredClone(allocations);
wrongSemantic.find(({ parameterName }) => parameterName === 'mcgsEvalControl32').evaluatorResource = 'evaluator.tensor.resource-input';
assert.throws(
  () => createTensorEvaluatorResourceBinding(program, boundEvaluator, resources, { allocations: wrongSemantic }),
  (error) => error?.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_SEMANTIC',
);
const overlap = structuredClone(allocations);
const featureAllocation = overlap.find(({ parameterName }) => parameterName === 'features');
featureAllocation.byteOffset = '0';
assert.throws(
  () => createTensorEvaluatorResourceBinding(program, boundEvaluator, resources, { allocations: overlap }),
  (error) => error?.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_OVERLAP',
);
const outOfRange = structuredClone(allocations);
outOfRange.find(({ parameterName }) => parameterName === 'weights').byteOffset = '1020';
assert.throws(
  () => createTensorEvaluatorResourceBinding(program, boundEvaluator, resources, { allocations: outOfRange }),
  (error) => ['TENSOR_EVALUATOR_RESOURCE_BINDING_RANGE', 'TENSOR_EVALUATOR_RESOURCE_BINDING_ALIGNMENT'].includes(error?.code),
);
const providerDrift = structuredClone(resources);
providerDrift.providerRequirements.find(({ id }) => id === 'resource.provider-workspace').access = ['read', 'write'];
assert.throws(
  () => createTensorEvaluatorResourceBinding(program, boundEvaluator, providerDrift, { allocations }),
  (error) => error?.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS',
);
const crossOwner = structuredClone(resources);
const workspaceClass = crossOwner.classes.find(({ sourceResource }) => sourceResource === 'evaluator.tensor.resource-workspace');
workspaceClass.contributor = 'owner.evaluator.analytic';
assert.throws(
  () => createTensorEvaluatorResourceBinding(program, boundEvaluator, crossOwner, { allocations }),
  (error) => error?.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_CHAIN',
);

console.log(JSON.stringify({
  schema: 'cuda-mcgs.tensor-evaluator-resource-binding-portable-evidence/0.1.0',
  status: 'pass',
  allocations: binding.allocations.length,
  providerRequirements: binding.usesProviderRequirements.length,
  cases: [
    'complete-pointer-coverage',
    'explicit-caller-byte-placement',
    'semantic-class-to-resource-chain-validation',
    'provider-relative-dtype-views',
    'workspace-control-atomic-access',
    'shared-input-explicit-artifact-placement',
    'non-tensor-provider-exclusion',
    'missing-wrong-class-overlap-range-provider-cross-owner-fail-closed',
    'deep-freeze',
  ],
  claimLimits: [
    'normalized-shape-resource-chain-oracle',
    'does-not-create-resource-policy',
    'does-not-create-progress-runtime-entry-or-service-order',
    'does-not-allocate-provider-memory',
    'no-native-or-provider-qualification',
  ],
}));

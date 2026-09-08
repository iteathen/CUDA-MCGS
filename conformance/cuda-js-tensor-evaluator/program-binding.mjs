import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  TensorEvaluatorConnectorError,
  bindTensorEvaluatorProfileProgram,
  createTensorEvaluatorConnector,
  createTensorEvaluatorProgramBinding,
  createTensorEvaluatorRuntimeContribution,
  tensorEvaluatorProgramBindingConstants,
} from '../../adapters/evaluators/cuda-js-tensor/index.mjs';

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function schemaReference(id) {
  const version = id.split('/').at(-1);
  return { id, version, sha256: sha256(`schema:${id}`) };
}

function fakeTensorDeviceProgram(overrides = {}) {
  const parameters = [
    { parameterIndex: 0, parameterName: 'itemIndex', role: 'item-index', type: 'u32', dtype: 'u32', access: 'read', itemVarying: false },
    { parameterIndex: 1, parameterName: 'features', role: 'input', type: 'ptr<f32>', dtype: 'f32', access: 'read', itemVarying: true, byteLength: 32 },
    { parameterIndex: 2, parameterName: 'weights', role: 'input', type: 'ptr<f32>', dtype: 'f32', access: 'read', itemVarying: false, byteLength: 64 },
    { parameterIndex: 3, parameterName: 'scores', role: 'output', type: 'ptr<f32>', dtype: 'f32', access: 'write', itemVarying: true, byteLength: 16 },
    { parameterIndex: 4, parameterName: 'workspace', role: 'workspace', type: 'ptr<f32>', dtype: 'f32', access: 'read-write', itemVarying: true, byteLength: 32 },
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
    kind: 'tensor-device-program',
    contract: 'SPEC-0009-item-parallel-device-tensor-program-v1',
    itemCapacity: 2,
    outputFormat: 'lto-ir',
    parameters,
    inputs: [
      { ...parameters[1], name: 'features', valueId: 'value.features', elementCount: 8 },
      { ...parameters[2], name: 'weights', valueId: 'value.weights', elementCount: 16 },
    ],
    outputs: [{ ...parameters[3], name: 'scores', valueId: 'value.scores', perItemElements: 2, elementCount: 4 }],
    workspace: [{ ...parameters[4], perItemElements: 4, elementCount: 8, alignmentBytes: 16 }],
    totalWorkspaceBytes: 32,
    function: fn,
    compatibilityIdentity: 'tensor-fixture-identity-v1',
    library,
    importAs(alias) { return Object.freeze({ library, name: 'tensorRunItem', as: alias }); },
    ...overrides,
  };
}

const workClasses = Object.freeze({
  encode: 'evaluator.tensor.work-encode',
  admit: 'evaluator.tensor.work-admit',
  batch: 'evaluator.tensor.work-batch',
  execute: 'evaluator.tensor.work-execute',
  scatter: 'evaluator.tensor.work-scatter',
  publish: 'evaluator.tensor.work-publish',
});

function profileInput(overrides = {}) {
  const base = {
    schema: 'cuda-mcgs.evaluator-profile/0.2.0',
    representation: 'cuda-mcgs.search-ir/0.2.0',
    status: 'accepted',
    contract: { kind: 'catalog', id: 'SPEC-0009', specificationIdentity: 'CUDA-MCGS-SPEC-0009@0.2.0', sha256: '3'.repeat(64) },
    id: 'evaluator.tensor',
    version: '0.1.0',
    request: { maxActive: '3' },
    batching: { minimumReadyItems: '1', maximumItems: '2' },
    execution: { deviceOwned: true, hostProgress: 'none', workClasses: Object.values(workClasses) },
    statuses: [
      'evaluator-request-capacity',
      'evaluator-input-stale',
      'evaluator-cancelled',
      'evaluator-internal-failure',
      'evaluator-generation-exhausted',
      'evaluator-batch-pending',
    ].map((code) => ({ code })),
    programContribution: {
      kind: 'device-program',
      language: 'restricted-device-js',
      sourceIdentity: { algorithm: 'sha256', sha256: '0'.repeat(64) },
      inputs: [],
      provenance: {
        origin: 'first-party',
        revision: '4'.repeat(40),
        license: 'Apache-2.0',
        review: schemaReference('cuda-mcgs.tensor-evaluator-program-review/0.1.0'),
      },
    },
  };
  return Object.assign(structuredClone(base), overrides);
}

const connector = createTensorEvaluatorConnector(fakeTensorDeviceProgram(), { requestCapacity: 3 });
const runtime = createTensorEvaluatorRuntimeContribution(connector);
const lowerRequirements = runtime.requiredCudaJsContracts.map(schemaReference);
const expectedSource = runtime.device.source.replace(/\r\n?/g, '\n').replace(/\n+$/g, '') + '\n';
const expectedSourceSha = sha256(expectedSource);

// Binding the runtime to an evaluator owner makes the exact generated source and
// lower public contracts identity-bearing before the generic Search Compiler sees it.
const boundInput = bindTensorEvaluatorProfileProgram(profileInput(), runtime, { publicRequirements: lowerRequirements });
assert.equal(boundInput.programContribution.sourceIdentity.sha256, expectedSourceSha);
assert.deepEqual(boundInput.programContribution.requirements.map(({ id }) => id), [...runtime.requiredCudaJsContracts].sort());
assert(Object.isFrozen(boundInput));
assert(Object.isFrozen(boundInput.programContribution));
assert.throws(() => { boundInput.id = 'evaluator.changed'; }, TypeError);

const binding = createTensorEvaluatorProgramBinding(runtime, boundInput, {
  id: 'evaluator.tensor.program-binding',
  workClasses,
});
assert.equal(binding.contract, tensorEvaluatorProgramBindingConstants.bindingContract);
assert.equal(binding.ownerProfile, boundInput.id);
assert.equal(binding.sourceUnit.source, expectedSource);
assert.equal(binding.sourceUnit.sourceIdentity.sha256, expectedSourceSha);
assert.equal(binding.sourceUnit.contributionIdentity.sha256, boundInput.programContribution.sourceIdentity.sha256);
assert.deepEqual(binding.requiredCudaJsContracts.map(({ id }) => id), runtime.requiredCudaJsContracts);
assert.deepEqual(binding.workClasses, workClasses);
assert.equal(binding.deviceImports.length, 1);
assert.deepEqual(binding.deviceImports[0], {
  schema: 'cuda-mcgs.device-js-import-declaration/0.1.0',
  id: 'evaluator.tensor.program-binding.tensor-import',
  ownerProfile: boundInput.id,
  importName: connector.deviceImportIdentity.name,
  alias: connector.deviceImportIdentity.as,
  library: { ...connector.deviceImportIdentity.library },
});
assert.equal(binding.functions.length, runtime.device.functions.length);
assert(binding.functions.every(({ ownerProfile, executionRole, helpers }) => ownerProfile === boundInput.id && executionRole === 'device-callable' && helpers.length === 0));
const connectorFunction = binding.functions.find(({ name }) => name === connector.deviceFunction.name);
assert.deepEqual(connectorFunction.calls, [], 'external Tensor import alias must not become a local call-graph edge');
const executeFunction = binding.functions.find(({ name }) => name === 'mcgsTensorEvaluatorExecuteItem');
assert.deepEqual(executeFunction.calls.sort(), ['mcgsTensorEvaluateItem', 'mcgsTensorEvaluatorBatchItemMatches'].sort());
const publishFunction = binding.functions.find(({ name }) => name === 'mcgsTensorEvaluatorPublishItem');
assert.deepEqual(publishFunction.calls.sort(), ['mcgsTensorEvaluatorBatchItemMatches', 'mcgsTensorEvaluatorFinishBatchItem'].sort());
assert.deepEqual(binding.ownership.deviceImports, ['evaluator.tensor.program-binding.tensor-import']);
assert(binding.claimLimits.includes('resource-plan-binding-not-included'));
assert(binding.claimLimits.includes('progress-runtime-entry-binding-not-included'));
assert(Object.isFrozen(binding));
assert(Object.isFrozen(binding.sourceUnit));
assert(Object.isFrozen(binding.functions[0]));

// Adapter-local structural ownership is sufficient to delete the Tensor binding
// without changing an unrelated non-Tensor owner fragment. Generic Composer
// deletion remains independently owned by Program Package conformance.
const nonTensor = Object.freeze({
  sourceUnit: { id: 'source.non-tensor', ownerProfile: 'evaluator.analytic', semanticOwner: 'evaluator.analytic' },
  function: { name: 'analyticEvaluate', ownerProfile: 'evaluator.analytic' },
  requirement: { contract: schemaReference('cuda-js.device-js/0.1.0'), consumers: ['evaluator.analytic'] },
});
const before = {
  sourceUnits: [nonTensor.sourceUnit, binding.sourceUnit],
  functions: [nonTensor.function, ...binding.functions],
  deviceImports: [...binding.deviceImports],
  publicRequirements: [nonTensor.requirement, ...binding.requiredCudaJsContracts.map((contract) => ({ contract, consumers: [binding.ownerProfile] }))],
};
const ownedSourceUnits = new Set(binding.ownership.sourceUnits);
const ownedFunctions = new Set(binding.ownership.functions);
const ownedImports = new Set(binding.ownership.deviceImports);
const ownedRequirements = new Set(binding.ownership.publicRequirements);
const after = {
  sourceUnits: before.sourceUnits.filter(({ id }) => !ownedSourceUnits.has(id)),
  functions: before.functions.filter(({ name }) => !ownedFunctions.has(name)),
  deviceImports: before.deviceImports.filter(({ id }) => !ownedImports.has(id)),
  publicRequirements: before.publicRequirements.filter(({ contract }) => !ownedRequirements.has(contract.id) || contract.id === nonTensor.requirement.contract.id),
};
assert.deepEqual(after.sourceUnits, [nonTensor.sourceUnit]);
assert.deepEqual(after.functions, [nonTensor.function]);
assert.deepEqual(after.deviceImports, []);
assert(after.publicRequirements.some(({ consumers }) => consumers.includes('evaluator.analytic')));

// Failure boundaries: lower contract identity is explicit, capacities are finite,
// work-class ownership is explicit, and stale profile source identity is rejected.
assert.throws(
  () => bindTensorEvaluatorProfileProgram(profileInput(), runtime, { publicRequirements: lowerRequirements.slice(0, 1) }),
  (error) => error instanceof TensorEvaluatorConnectorError && error.code === 'TENSOR_EVALUATOR_PROGRAM_BINDING_REQUIREMENT',
);
const conflictProfile = profileInput();
conflictProfile.programContribution.requirements = [{ ...lowerRequirements[0], sha256: 'f'.repeat(64) }];
assert.throws(
  () => bindTensorEvaluatorProfileProgram(conflictProfile, runtime, { publicRequirements: lowerRequirements }),
  (error) => error?.code === 'TENSOR_EVALUATOR_PROGRAM_BINDING_REQUIREMENT',
);
const insufficientRequest = profileInput({ request: { maxActive: '4' } });
assert.throws(
  () => bindTensorEvaluatorProfileProgram(insufficientRequest, runtime, { publicRequirements: lowerRequirements }),
  (error) => error?.code === 'TENSOR_EVALUATOR_PROGRAM_BINDING_CAPACITY',
);
const insufficientBatch = profileInput({ batching: { minimumReadyItems: '1', maximumItems: '3' } });
assert.throws(
  () => bindTensorEvaluatorProfileProgram(insufficientBatch, runtime, { publicRequirements: lowerRequirements }),
  (error) => error?.code === 'TENSOR_EVALUATOR_PROGRAM_BINDING_CAPACITY',
);
const inferredWork = { ...workClasses, execute: 'evaluator.tensor.work-execute-other' };
assert.throws(
  () => createTensorEvaluatorProgramBinding(runtime, boundInput, { id: 'evaluator.tensor.bad-binding', workClasses: inferredWork }),
  (error) => error?.code === 'TENSOR_EVALUATOR_PROGRAM_BINDING_WORK',
);
const staleProfile = structuredClone(boundInput);
staleProfile.programContribution.sourceIdentity.sha256 = 'a'.repeat(64);
assert.throws(
  () => createTensorEvaluatorProgramBinding(runtime, staleProfile, { id: 'evaluator.tensor.bad-source', workClasses }),
  (error) => error?.code === 'TENSOR_EVALUATOR_PROGRAM_BINDING_SOURCE',
);

console.log(JSON.stringify({
  schema: 'cuda-mcgs.tensor-evaluator-program-binding-portable-evidence/0.1.0',
  status: 'pass',
  sourceSha256: expectedSourceSha,
  functions: binding.functions.length,
  deviceImports: binding.deviceImports.length,
  cases: [
    'exact-runtime-source-profile-binding',
    'explicit-lower-requirement-binding',
    'program-package-source-function-import-fragments',
    'external-import-not-local-call-edge',
    'explicit-work-class-mapping',
    'structural-tensor-deletion-preserves-non-tensor-fragment',
    'capacity-and-source-drift-fail-closed',
    'deep-freeze',
  ],
  claimLimits: [
    'adapter-local-program-binding-only',
    'does-not-compose-resource-plan',
    'does-not-select-progress-service-order',
    'does-not-call-cuda-js-inspection-or-compilation',
    'no-native-or-provider-qualification',
  ],
}));

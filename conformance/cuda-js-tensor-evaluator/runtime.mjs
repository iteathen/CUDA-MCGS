import assert from 'node:assert/strict';

import {
  createTensorEvaluatorConnector,
  createTensorEvaluatorRuntimeContribution,
} from '../../adapters/evaluators/cuda-js-tensor/index.mjs';

const callable = {
  name: 'tensorRunItem',
  returns: 'u32',
  parameters: [
    { name: 'itemIndex', type: 'u32' },
    { name: 'features', type: 'ptr<f32>' },
    { name: 'weights', type: 'ptr<f32>' },
    { name: 'scores', type: 'ptr<f32>' },
    { name: 'scratch', type: 'ptr<f32>' },
  ],
};

function makeTensorDeviceProgram() {
  const artifactBytes = new Uint8Array([1, 2, 3, 4]);
  const parameters = [
    { parameterIndex: 0, parameterName: 'itemIndex', role: 'item-index', type: 'u32', dtype: 'u32', access: 'read', itemVarying: false, byteLength: 0 },
    { parameterIndex: 1, parameterName: 'features', role: 'input', type: 'ptr<f32>', dtype: 'f32', access: 'read', itemVarying: true, byteLength: 32 },
    { parameterIndex: 2, parameterName: 'weights', role: 'input', type: 'ptr<f32>', dtype: 'f32', access: 'read', itemVarying: false, byteLength: 12 },
    { parameterIndex: 3, parameterName: 'scores', role: 'output', type: 'ptr<f32>', dtype: 'f32', access: 'write', itemVarying: true, byteLength: 48 },
    { parameterIndex: 4, parameterName: 'scratch', role: 'workspace', type: 'ptr<f32>', dtype: 'f32', access: 'read-write', itemVarying: true, byteLength: 32 },
  ];
  return {
    kind: 'tensor-device-program',
    contract: 'SPEC-0009-item-parallel-device-tensor-program-v1',
    itemCapacity: 4,
    function: callable,
    parameters,
    inputs: [
      { ...parameters[1], name: 'features', valueId: 'input.features', elementCount: 8 },
      { ...parameters[2], name: 'weights', valueId: 'input.weights', elementCount: 3 },
    ],
    outputs: [
      { ...parameters[3], name: 'scores', valueId: 'output.scores', perItemElements: 3, elementCount: 12 },
    ],
    workspace: [
      { ...parameters[4], perItemElements: 2, elementCount: 8, alignmentBytes: 256 },
    ],
    totalWorkspaceBytes: 32,
    compatibilityIdentity: 'tensor-test-compatibility',
    outputFormat: 'lto-ir',
    importAs(alias) {
      return {
        name: 'tensorRunItem',
        as: alias,
        library: {
          schemaVersion: 1,
          contract: 'cuda-js-tensor.device-library/test',
          sha256: 'a'.repeat(64),
          format: 'lto-ir',
          architecture: 'compute_89',
          exports: [callable],
          artifact: {
            format: 'lto-ir',
            architecture: 'compute_89',
            sha256: 'b'.repeat(64),
            bytes: artifactBytes,
            byteLength: artifactBytes.byteLength,
          },
        },
      };
    },
  };
}

const connector = createTensorEvaluatorConnector(makeTensorDeviceProgram(), { requestCapacity: 7 });
const contribution = createTensorEvaluatorRuntimeContribution(connector);
const state = contribution.state;
const result = state.resultCodes;
const slotState = state.slotStates;
const batchState = state.batchStates;

assert.equal(contribution.kind, 'cuda-mcgs-tensor-evaluator-runtime-contribution');
assert.equal(contribution.contract, 'cuda-mcgs.tensor-evaluator-device-runtime/0.2.0');
assert(contribution.resources.every(({ resourceKey, representationRole, resourceClass, pressureStatus, resourceAccess, alignmentBytes }) => typeof resourceKey === 'string' && typeof representationRole === 'string' && typeof resourceClass === 'string' && typeof pressureStatus === 'string' && Array.isArray(resourceAccess) && Number.isSafeInteger(alignmentBytes)));
assert(contribution.tensorBindings.every(({ parameterIndex, resourceKey, representationRole, storageDisposition, resourceAccess, alignmentBytes }) => Number.isSafeInteger(parameterIndex) && typeof resourceKey === 'string' && typeof representationRole === 'string' && typeof storageDisposition === 'string' && Array.isArray(resourceAccess) && Number.isSafeInteger(alignmentBytes)));
assert(contribution.device.functions.every(({ calls }) => Array.isArray(calls)), 'runtime must publish explicit local call graph metadata');
assert.equal(contribution.execution.deviceOwned, true);
assert.equal(contribution.execution.hostProgress, 'none');
assert.equal(contribution.execution.maxConcurrentBatches, 1);
assert.equal(contribution.execution.partialBatch, 'immediate-when-any-queued-request-is-serviced');
assert.deepEqual(contribution.requiredCudaJsContracts, [
  'cuda-js.device-js/0.1.0',
  'cuda-js.device-publication-release-acquire/0.1.0',
]);
assert.deepEqual(contribution.staleSafety.token, ['itemIndex', 'slot', 'slotGeneration', 'requestGeneration', 'batchGeneration']);
assert.equal(contribution.staleSafety.mismatch, 'read-only-stale-no-current-lane-mutation');
assert.equal(contribution.device.workClasses.encode.owner, 'evaluator-profile-and-search-program');
assert.deepEqual(contribution.device.workClasses.encode.functions, []);
assert.equal(contribution.encodedInputHandoff.completion, 'before-admit-release');
assert.deepEqual(contribution.device.workClasses.execute.functions, [
  'mcgsTensorEvaluatorPrepareItem',
  'mcgsTensorEvaluatorExecuteItem',
]);
assert.equal(contribution.device.lifecycleFunctions.cancel, 'mcgsTensorEvaluatorCancel');
assert.equal(contribution.claimLimits.includes('no-native-or-provider-qualification'), true);
assert.equal(contribution.claimLimits.includes('post-batch-work-requires-captured-incarnation-token'), true);
assert.equal(contribution.requestInputPartitions.length, 1);
assert.equal(contribution.requestInputPartitions[0].perRequestElements, 2);
assert.equal(contribution.requestInputPartitions[0].elementCount, 14);
assert.equal(contribution.resultOutputPartitions.length, 1);
assert.equal(contribution.resultOutputPartitions[0].perRequestElements, 3);
assert.equal(contribution.resultOutputPartitions[0].elementCount, 21);
assert.equal(/\?/.test(contribution.device.source), false, 'generated Device-JS must not contain conditional expressions/optional syntax');
assert.equal(contribution.device.source.includes('=>'), false);
assert.equal(contribution.device.source.includes('gpu.atomic.loadAcquireDevice'), true);
assert.equal(contribution.device.source.includes('gpu.atomic.storeReleaseDevice'), true);
assert.equal(contribution.device.source.includes('gpu.atomic.cas'), true);
assert.equal(contribution.device.source.includes('gpu.atomic.add'), true);

// Sequential Device-JS oracle. This intentionally models only deterministic state
// transitions and item data flow. It does not qualify CUDA memory ordering,
// physical scheduling, native compilation, a provider, or hardware behavior.
const atomicIndex = (value) => typeof value === 'bigint' ? Number(value) : value;
let beforeCas = null;
const gpu = {
  u32(value) { return Number(value) >>> 0; },
  i32(value) { return Number(value) | 0; },
  u64(value) { return BigInt(value); },
  f32(value) { return Number(value); },
  atomic: {
    loadAcquireDevice(pointer, index) { return pointer[atomicIndex(index)]; },
    storeReleaseDevice(pointer, index, value) { pointer[atomicIndex(index)] = value; },
    cas(pointer, index, compare, value) {
      const i = atomicIndex(index);
      if (beforeCas) beforeCas(pointer, i, compare, value);
      const prior = pointer[i];
      if (prior === compare) pointer[i] = value;
      return prior;
    },
    add(pointer, index, value) {
      const i = atomicIndex(index);
      const prior = pointer[i];
      pointer[i] = prior + value;
      return prior;
    },
  },
};

let tensorCalls = 0;
let failNextTensorCall = false;
function mcgsTensorRunItem(itemIndex, features, weights, scores, scratch) {
  tensorCalls += 1;
  if (failNextTensorCall) {
    failNextTensorCall = false;
    return 1;
  }
  const item = Number(itemIndex);
  const featureBase = item * 2;
  const scoreBase = item * 3;
  scores[scoreBase] = features[featureBase] + weights[0];
  scores[scoreBase + 1] = features[featureBase + 1] + weights[1];
  scores[scoreBase + 2] = features[featureBase] + features[featureBase + 1] + weights[2];
  scratch[item * 2] = features[featureBase];
  return 0;
}

const functionNames = contribution.device.functions.map(({ name }) => name);
const loadGenerated = new Function('gpu', 'mcgsTensorRunItem', `${contribution.device.source}\nreturn { ${functionNames.join(', ')} };`);
const fn = loadGenerated(gpu, mcgsTensorRunItem);
const c32 = Array(state.control32.elementCount).fill(0);
const c64 = Array(state.control64.elementCount).fill(0n);
const requestInput = Array(contribution.requestInputPartitions[0].elementCount).fill(0);
const resultOutput = Array(contribution.resultOutputPartitions[0].elementCount).fill(0);
const features = Array(8).fill(0);
const weights = [100, 200, 300];
const scores = Array(12).fill(0);
const scratch = Array(8).fill(0);
const o32 = state.control32;
const o64 = state.control64;
const readSlotGeneration = (slot) => c64[o64.slotGeneration + slot];
const readBatchGeneration = () => c64[o64.batchGeneration];
const readBatchSlot = (item) => c32[o32.batchSlots + item];
const token = (item) => {
  const slot = readBatchSlot(item);
  return [item, slot, c64[o64.batchSlotGeneration + item], c64[o64.batchRequestGeneration + item], readBatchGeneration()];
};
const prepare = (tokenValue) => fn.mcgsTensorEvaluatorPrepareItem(...tokenValue, c32, c64, requestInput, features);
const execute = (tokenValue) => fn.mcgsTensorEvaluatorExecuteItem(...tokenValue, c32, c64, features, weights, scores, scratch);
const scatter = (tokenValue) => fn.mcgsTensorEvaluatorScatterItem(...tokenValue, c32, c64, scores, resultOutput);
const publish = (tokenValue) => fn.mcgsTensorEvaluatorPublishItem(...tokenValue, c32, c64);
const retry = (tokenValue) => fn.mcgsTensorEvaluatorRetryItem(...tokenValue, c32, c64);

// No-work service must not consume batch-generation identity.
assert.equal(fn.mcgsTensorEvaluatorFormBatch(c32, c64), result.noWork);
assert.equal(readBatchGeneration(), 0n);

// Losing every observed queued slot before claim is still no-work and must not
// consume batch-generation identity. This injects one adversarial cancellation
// exactly at the slot claim CAS without pretending to model physical scheduling.
assert.equal(fn.mcgsTensorEvaluatorAdmit(6, 7n, c32, c64), result.ok);
const lostClaimSlotGeneration = readSlotGeneration(6);
beforeCas = (pointer, index, compare, value) => {
  if (pointer === c32 && index === o32.slotState + 6 && compare === slotState.queued && value === slotState.inflight) {
    pointer[index] = slotState.cancelled;
    beforeCas = null;
  }
};
assert.equal(fn.mcgsTensorEvaluatorFormBatch(c32, c64), result.noWork);
assert.equal(beforeCas, null);
assert.equal(readBatchGeneration(), 0n);
assert.equal(c32[o32.batchState], batchState.free);
assert.equal(fn.mcgsTensorEvaluatorRecycle(6, lostClaimSlotGeneration, 7n, c32, c64), result.ok);

// Two ready requests form a partial batch and preserve request/item identity.
requestInput.splice(0, 4, 1, 2, 10, 20);
assert.equal(fn.mcgsTensorEvaluatorAdmit(0, 10n, c32, c64), result.ok);
assert.equal(fn.mcgsTensorEvaluatorAdmit(1, 20n, c32, c64), result.ok);
assert.equal(fn.mcgsTensorEvaluatorAdmit(0, 99n, c32, c64), result.pressure);
assert.equal(fn.mcgsTensorEvaluatorFormBatch(c32, c64), 2);
const first0 = token(0);
const first1 = token(1);
assert.deepEqual(first0, [0, 0, 1n, 10n, 1n]);
assert.deepEqual(first1, [1, 1, 1n, 20n, 1n]);
assert.equal(prepare(first0), result.ok);
assert.equal(prepare(first1), result.ok);
assert.deepEqual(features.slice(0, 4), [1, 2, 10, 20]);
assert.equal(execute(first0), result.ok);
assert.equal(execute(first1), result.ok);
assert.equal(scatter(first0), result.ok);
assert.equal(scatter(first1), result.ok);
assert.equal(publish(first0), result.ok);
assert.equal(c32[o32.batchState], batchState.ready);
assert.equal(publish(first1), result.ok);
assert.equal(c32[o32.batchState], batchState.free);
assert.equal(c32[o32.slotState], slotState.ready);
assert.equal(c32[o32.slotState + 1], slotState.ready);
assert.deepEqual(resultOutput.slice(0, 6), [101, 202, 303, 110, 220, 330]);

// Reuse slot 0. Old delayed execute/scatter/publish must be read-only stale.
assert.equal(fn.mcgsTensorEvaluatorRecycle(0, 1n, 10n, c32, c64), result.ok);
requestInput[0] = 7;
requestInput[1] = 8;
assert.equal(fn.mcgsTensorEvaluatorAdmit(0, 30n, c32, c64), result.ok);
assert.equal(readSlotGeneration(0), 2n);
assert.equal(fn.mcgsTensorEvaluatorFormBatch(c32, c64), 1);
const second0 = token(0);
assert.deepEqual(second0, [0, 0, 2n, 30n, 2n]);
const resultBeforeStale = resultOutput.slice(0, 3);
const itemStateBeforeStale = c32[o32.itemStatus];
const slotStateBeforeStale = c32[o32.slotState];
const callsBeforeStale = tensorCalls;
assert.equal(execute(first0), result.stale);
assert.equal(scatter(first0), result.stale);
assert.equal(publish(first0), result.stale);
assert.equal(tensorCalls, callsBeforeStale, 'stale delayed execute must not invoke Tensor');
assert.deepEqual(resultOutput.slice(0, 3), resultBeforeStale, 'stale delayed scatter must not overwrite a reused result slot');
assert.equal(c32[o32.itemStatus], itemStateBeforeStale, 'stale delayed work must not mutate the current batch lane');
assert.equal(c32[o32.slotState], slotStateBeforeStale, 'stale delayed publication must not mutate the current request slot');
assert.equal(prepare(second0), result.ok);
assert.equal(execute(second0), result.ok);
assert.equal(scatter(second0), result.ok);
assert.equal(publish(second0), result.ok);
assert.deepEqual(resultOutput.slice(0, 3), [107, 208, 315]);

// Inflight cancellation observed at the declared pre-publication ordering point suppresses readiness.
assert.equal(fn.mcgsTensorEvaluatorRecycle(1, 1n, 20n, c32, c64), result.ok);
requestInput[2] = 3;
requestInput[3] = 4;
assert.equal(fn.mcgsTensorEvaluatorAdmit(1, 40n, c32, c64), result.ok);
assert.equal(fn.mcgsTensorEvaluatorFormBatch(c32, c64), 1);
const cancelToken = token(0);
assert.equal(prepare(cancelToken), result.ok);
assert.equal(fn.mcgsTensorEvaluatorCancel(1, cancelToken[2], cancelToken[3], c32, c64), result.cancelled);
assert.equal(execute(cancelToken), result.cancelled);
assert.equal(publish(cancelToken), result.cancelled);
assert.equal(c32[o32.slotState + 1], slotState.cancelled);
assert.equal(c32[o32.batchState], batchState.free);

// Queued cancellation terminalizes without creating a batch item.
assert.equal(fn.mcgsTensorEvaluatorAdmit(2, 50n, c32, c64), result.ok);
const slot2Generation = readSlotGeneration(2);
assert.equal(fn.mcgsTensorEvaluatorCancel(2, slot2Generation, 50n, c32, c64), result.cancelled);
assert.equal(c32[o32.slotState + 2], slotState.cancelled);

// Tensor failure is retryable as the same request in a new batch incarnation.
assert.equal(fn.mcgsTensorEvaluatorRecycle(0, 2n, 30n, c32, c64), result.ok);
requestInput[0] = 11;
requestInput[1] = 12;
assert.equal(fn.mcgsTensorEvaluatorAdmit(0, 60n, c32, c64), result.ok);
assert.equal(fn.mcgsTensorEvaluatorFormBatch(c32, c64), 1);
const failedToken = token(0);
assert.equal(prepare(failedToken), result.ok);
failNextTensorCall = true;
assert.equal(execute(failedToken), result.failed);
assert.equal(retry(failedToken), result.retried);
assert.equal(c32[o32.slotState], slotState.queued);
assert.equal(c32[o32.batchState], batchState.free);
assert.equal(fn.mcgsTensorEvaluatorFormBatch(c32, c64), 1);
const retryToken = token(0);
assert.equal(retryToken[2], failedToken[2]);
assert.equal(retryToken[3], failedToken[3]);
assert.notEqual(retryToken[4], failedToken[4]);
assert.equal(prepare(retryToken), result.ok);
assert.equal(execute(retryToken), result.ok);
assert.equal(scatter(retryToken), result.ok);
assert.equal(publish(retryToken), result.ok);
assert.deepEqual(resultOutput.slice(0, 3), [111, 212, 323]);

console.log(JSON.stringify({
  schema: 'cuda-mcgs.tensor-evaluator-device-runtime-portable-evidence/0.1.0',
  status: 'pass',
  execution: 'emitted-device-js-sequential-oracle',
  cases: [
    'no-work-generation-stability',
    'lost-claim-no-work-generation-stability',
    'partial-batch-request-item-identity',
    'request-pressure',
    'stale-reused-lane-read-only-rejection',
    'inflight-cancel-before-publication',
    'queued-cancel-terminalization',
    'tensor-failure-retry-new-batch-incarnation',
  ],
  tensorCalls,
  finalBatchGeneration: readBatchGeneration().toString(),
  claimLimits: [
    'cuda-free-sequential-state-transition-oracle',
    'does-not-model-cuda-memory-ordering-or-physical-scheduling',
    'does-not-call-cuda-js-inspection-or-compilation',
    'no-native-or-provider-qualification',
  ],
}));

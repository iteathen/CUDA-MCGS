import assert from 'node:assert/strict';

import {
  TensorEvaluatorConnectorError,
  createTensorEvaluatorConnector,
} from '../../adapters/evaluators/cuda-js-tensor/index.mjs';
import { createTensorEvaluatorReference } from './reference.mjs';

const cases = [];
function runCase(id, body) {
  try {
    body();
    cases.push({ id, status: 'pass' });
    console.log(`case=${id} result=pass`);
  } catch (error) {
    cases.push({ id, status: 'fail', error: { code: error?.code ?? null, message: error?.message ?? String(error) } });
    console.error(`case=${id} result=fail error=${JSON.stringify(error?.message ?? String(error))}`);
  }
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
    inputs: parameters.filter(({ role }) => role === 'input'),
    outputs: parameters.filter(({ role }) => role === 'output'),
    workspace: parameters.filter(({ role }) => role === 'workspace'),
    totalWorkspaceBytes: 32,
    function: fn,
    compatibilityIdentity: 'tensor-fixture-identity-v1',
    library,
    importAs(alias) { return Object.freeze({ library, name: 'tensorRunItem', as: alias }); },
    ...overrides,
  };
}

function publishAndScatter(reference, batch) {
  reference.publish(batch, batch.items.map((item) => ({ ...item, outputs: { value: item.requestId } })));
  return reference.scatter(batch);
}

runCase('TENSOR-EVAL-C01-public-callable-admission', () => {
  const connector = createTensorEvaluatorConnector(fakeTensorDeviceProgram(), { requestCapacity: 3 });
  assert.equal(connector.tensor.itemCapacity, 2);
  assert.equal(connector.requestCapacity, 3);
  assert.equal(connector.tensor.totalWorkspaceBytes, 32);
  assert.equal(connector.deviceImportIdentity.name, 'tensorRunItem');
  assert.equal(connector.deviceImportIdentity.as, 'mcgsTensorRunItem');
  const imported = connector.createDeviceImport();
  assert.equal(imported.name, 'tensorRunItem');
  assert.equal(imported.as, 'mcgsTensorRunItem');
  assert(imported.library.artifact.bytes instanceof Uint8Array, 'opaque Tensor library bytes must retain their public Uint8Array type');
  assert.match(connector.source, /return mcgsTensorRunItem\(/);
  assert.deepEqual(connector.claimLimits, ['public-tensor-callable-only', 'no-product-semantics', 'no-native-or-provider-qualification']);
});

runCase('TENSOR-EVAL-C02-full-batch-request-item-scatter', () => {
  const reference = createTensorEvaluatorReference(createTensorEvaluatorConnector(fakeTensorDeviceProgram()));
  const a = reference.admit({ requestId: 'request-a', requestGeneration: 1, inputIdentity: 'input-a' });
  const b = reference.admit({ requestId: 'request-b', requestGeneration: 4, inputIdentity: 'input-b' });
  const batch = reference.formBatch();
  assert.equal(batch.occupancy, 2);
  reference.publish(batch, batch.items.map((item) => ({ ...item, outputs: { value: item.itemIndex + 10 } })));
  assert.deepEqual(reference.scatter(batch), [
    { requestId: 'request-a', requestGeneration: 1, outputs: { value: 10 } },
    { requestId: 'request-b', requestGeneration: 4, outputs: { value: 11 } },
  ]);
  assert.equal(reference.snapshot().free, 2);
  assert.equal(reference.close().status, 'complete');
  assert.equal(a.slot, 0); assert.equal(b.slot, 1);
});

runCase('TENSOR-EVAL-C03-partial-batch-preserves-occupancy', () => {
  const reference = createTensorEvaluatorReference(createTensorEvaluatorConnector(fakeTensorDeviceProgram()));
  reference.admit({ requestId: 'request-only', requestGeneration: 2, inputIdentity: 'input-only' });
  const batch = reference.formBatch();
  assert.equal(batch.occupancy, 1);
  assert.equal(batch.items[0].itemIndex, 0);
  const payload = new Uint8Array([7, 9]);
  reference.publish(batch, [{ ...batch.items[0], outputs: payload }]);
  const scattered = reference.scatter(batch);
  assert.equal(scattered.length, 1);
  assert.equal(scattered[0].requestId, 'request-only');
  assert(scattered[0].outputs instanceof Uint8Array, 'conformance reference must preserve opaque typed payload representation');
  assert.deepEqual([...scattered[0].outputs], [7, 9]);
});

runCase('TENSOR-EVAL-C04-queue-capacity-exceeds-batch-capacity', () => {
  const connector = createTensorEvaluatorConnector(fakeTensorDeviceProgram(), { requestCapacity: 3 });
  const reference = createTensorEvaluatorReference(connector);
  for (const requestId of ['a', 'b', 'c']) reference.admit({ requestId, requestGeneration: 0, inputIdentity: `input-${requestId}` });
  const first = reference.formBatch();
  assert.equal(first.occupancy, 2);
  assert.deepEqual(publishAndScatter(reference, first).map(({ requestId }) => requestId), ['a', 'b']);
  assert.equal(reference.snapshot().queued, 1);
  const second = reference.formBatch();
  assert.equal(second.occupancy, 1);
  assert.deepEqual(publishAndScatter(reference, second).map(({ requestId }) => requestId), ['c']);
  assert.equal(reference.close().status, 'complete');
});

runCase('TENSOR-EVAL-F01-capacity-pressure-fails-closed', () => {
  const reference = createTensorEvaluatorReference(createTensorEvaluatorConnector(fakeTensorDeviceProgram()));
  reference.admit({ requestId: 'a', requestGeneration: 0, inputIdentity: 'ia' });
  reference.admit({ requestId: 'b', requestGeneration: 0, inputIdentity: 'ib' });
  assert.throws(() => reference.admit({ requestId: 'c', requestGeneration: 0, inputIdentity: 'ic' }), (error) => error instanceof TensorEvaluatorConnectorError && error.code === 'TENSOR_EVALUATOR_PRESSURE');
});

runCase('TENSOR-EVAL-F02-stale-result-rejected-before-publication', () => {
  const reference = createTensorEvaluatorReference(createTensorEvaluatorConnector(fakeTensorDeviceProgram()));
  reference.admit({ requestId: 'a', requestGeneration: 1, inputIdentity: 'ia' });
  const batch = reference.formBatch();
  const stale = { ...batch.items[0], slotGeneration: batch.items[0].slotGeneration + 1, outputs: { value: 1 } };
  assert.throws(() => reference.publish(batch, [stale]), (error) => error?.code === 'TENSOR_EVALUATOR_STALE');
  assert.equal(reference.snapshot().inflight, 1);
  reference.retryBatch(batch);
  assert.equal(reference.snapshot().queued, 1);
});

runCase('TENSOR-EVAL-C05-cancel-retry-and-cleanup-are-explicit', () => {
  const reference = createTensorEvaluatorReference(createTensorEvaluatorConnector(fakeTensorDeviceProgram()));
  const cancelled = reference.admit({ requestId: 'cancel', requestGeneration: 1, inputIdentity: 'ix' });
  assert.equal(reference.cancel(cancelled).status, 'cancelled');
  const retried = reference.admit({ requestId: 'retry', requestGeneration: 2, inputIdentity: 'iy' });
  const batch = reference.formBatch();
  assert.equal(reference.close().status, 'retained');
  reference.retryBatch(batch);
  assert.equal(reference.cancel(retried).status, 'cancelled');
  assert.equal(reference.close().status, 'complete');
});

runCase('TENSOR-EVAL-F03-invalid-public-shapes-reject', () => {
  assert.throws(() => createTensorEvaluatorConnector(fakeTensorDeviceProgram({ contract: 'wrong' })), (error) => error?.code === 'TENSOR_EVALUATOR_CONTRACT');
  assert.throws(() => createTensorEvaluatorConnector(fakeTensorDeviceProgram({ totalWorkspaceBytes: 31 })), (error) => error?.code === 'TENSOR_EVALUATOR_WORKSPACE');
  assert.throws(() => createTensorEvaluatorConnector(fakeTensorDeviceProgram(), { requestCapacity: 0 }), (error) => error?.code === 'TENSOR_EVALUATOR_BOUNDS');
});

runCase('TENSOR-EVAL-F04-device-import-drift-rejected', () => {
  const program = fakeTensorDeviceProgram();
  const stableImport = program.importAs.bind(program);
  let callCount = 0;
  program.importAs = (alias) => {
    const imported = stableImport(alias);
    callCount += 1;
    if (callCount === 1) return imported;
    return { ...imported, library: { ...imported.library, sha256: '3'.repeat(64) } };
  };
  const connector = createTensorEvaluatorConnector(program);
  assert.throws(() => connector.createDeviceImport(), (error) => error?.code === 'TENSOR_EVALUATOR_IMPORT_DRIFT');
});

const failed = cases.filter(({ status }) => status !== 'pass');
const summary = {
  schema: 'cuda-mcgs.tensor-evaluator-portable-evidence/0.1.0',
  status: failed.length === 0 ? 'pass' : 'failed',
  cases,
  surface: { tensor: 'public-capability-shape', execution: 'portable-reference-only', ignition: 'not-performed' },
  claimLimits: ['product-neutral', 'cuda-free', 'no-native-or-provider-qualification', 'no-performance-claim'],
};
console.log(JSON.stringify(summary));
if (failed.length > 0) {
  const error = new Error(`Tensor evaluator connector conformance failed: ${failed.map(({ id }) => id).join(', ')}`);
  error.code = 'CUDA_MCGS_TENSOR_EVALUATOR_CONFORMANCE';
  throw error;
}

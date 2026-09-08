import { TensorEvaluatorConnectorError } from '../../adapters/evaluators/cuda-js-tensor/index.mjs';

export const REFERENCE_CONTRACT = 'cuda-mcgs.tensor-evaluator-reference/0.1.0';

function fail(code, message, details = {}) {
  throw new TensorEvaluatorConnectorError(code, message, details);
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('TENSOR_EVALUATOR_INPUT', `${label} must be an object`);
  return value;
}

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) fail('TENSOR_EVALUATOR_BOUNDS', `${label} must be a positive safe integer`);
  return value;
}

function nonnegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) fail('TENSOR_EVALUATOR_BOUNDS', `${label} must be a nonnegative safe integer`);
  return value;
}

function text(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail('TENSOR_EVALUATOR_INPUT', `${label} must be non-empty text`);
  return value;
}

function freezeRecord(value) {
  if (value === null || typeof value !== 'object') return value;
  if (ArrayBuffer.isView(value)) return value;
  return Object.freeze(Array.isArray(value)
    ? value.map(freezeRecord)
    : Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freezeRecord(child)])));
}

function tokenKey(token) {
  return `${token.slot}:${token.slotGeneration}:${token.requestId}:${token.requestGeneration}`;
}

export function createTensorEvaluatorReference(connector) {
  object(connector, 'connector');
  if (connector.contract !== 'cuda-mcgs.tensor-evaluator-connector/0.2.0') fail('TENSOR_EVALUATOR_CONNECTOR', 'connector contract is invalid');
  const slots = Array.from({ length: connector.requestCapacity }, (_, slot) => ({ slot, generation: 0, state: 'free', request: null, result: null, batch: null }));
  let batchGeneration = 0;
  let closed = false;

  const assertOpen = () => { if (closed) fail('TENSOR_EVALUATOR_CLOSED', 'reference connector is closed'); };
  const slotFor = (token, states = null) => {
    object(token, 'request token');
    const slot = slots[token.slot];
    if (!slot || !slot.request || slot.generation !== token.slotGeneration
        || slot.request.requestId !== token.requestId || slot.request.requestGeneration !== token.requestGeneration) {
      fail('TENSOR_EVALUATOR_STALE', 'request token is stale');
    }
    if (states && !states.includes(slot.state)) fail('TENSOR_EVALUATOR_STATE', `request is ${slot.state}`);
    return slot;
  };

  const reference = {
    kind: 'cuda-mcgs-tensor-evaluator-reference',
    contract: REFERENCE_CONTRACT,
    admit(request) {
      assertOpen(); object(request, 'request');
      const requestId = text(request.requestId, 'requestId');
      const requestGeneration = nonnegativeInteger(request.requestGeneration, 'requestGeneration');
      const inputIdentity = text(request.inputIdentity, 'inputIdentity');
      if (slots.some((slot) => slot.request?.requestId === requestId && slot.request.requestGeneration === requestGeneration)) {
        fail('TENSOR_EVALUATOR_DUPLICATE', 'request incarnation is already admitted');
      }
      const slot = slots.find((entry) => entry.state === 'free');
      if (!slot) fail('TENSOR_EVALUATOR_PRESSURE', 'request capacity is exhausted');
      slot.generation += 1;
      slot.state = 'queued';
      slot.request = { requestId, requestGeneration, inputIdentity };
      slot.result = null;
      slot.batch = null;
      return freezeRecord({ slot: slot.slot, slotGeneration: slot.generation, requestId, requestGeneration });
    },
    formBatch(maxItems = connector.tensor.itemCapacity) {
      assertOpen();
      positiveInteger(maxItems, 'maxItems');
      const selected = slots.filter(({ state }) => state === 'queued').slice(0, Math.min(maxItems, connector.tensor.itemCapacity));
      if (selected.length === 0) return null;
      batchGeneration += 1;
      const items = selected.map((slot, itemIndex) => {
        slot.state = 'inflight'; slot.batch = batchGeneration;
        return freezeRecord({
          itemIndex,
          slot: slot.slot,
          slotGeneration: slot.generation,
          requestId: slot.request.requestId,
          requestGeneration: slot.request.requestGeneration,
          inputIdentity: slot.request.inputIdentity,
        });
      });
      return freezeRecord({ batchGeneration, itemCapacity: connector.tensor.itemCapacity, occupancy: items.length, items });
    },
    publish(batch, results) {
      assertOpen(); object(batch, 'batch');
      if (!Array.isArray(results) || results.length !== batch.items?.length) fail('TENSOR_EVALUATOR_RESULT', 'result count must equal batch occupancy');
      const prepared = results.map((result, index) => {
        object(result, `result ${index}`);
        const expected = batch.items[index];
        if (!expected || result.itemIndex !== expected.itemIndex || result.slot !== expected.slot
            || result.slotGeneration !== expected.slotGeneration || result.requestId !== expected.requestId
            || result.requestGeneration !== expected.requestGeneration) fail('TENSOR_EVALUATOR_STALE', `result ${index} does not match the batch item incarnation`);
        const slot = slots[expected.slot];
        if (!slot || slot.state !== 'inflight' || slot.batch !== batch.batchGeneration || slot.generation !== expected.slotGeneration) {
          fail('TENSOR_EVALUATOR_STALE', `result ${index} targets a stale slot/batch`);
        }
        return { slot, result: { outputs: result.outputs ?? null } };
      });
      for (const entry of prepared) { entry.slot.result = entry.result; entry.slot.state = 'ready'; }
      return freezeRecord({ status: 'ready', batchGeneration: batch.batchGeneration, count: prepared.length });
    },
    scatter(batch) {
      assertOpen(); object(batch, 'batch');
      const output = batch.items.map((item) => {
        const slot = slots[item.slot];
        if (!slot || slot.generation !== item.slotGeneration || slot.state !== 'ready' || slot.batch !== batch.batchGeneration) {
          fail('TENSOR_EVALUATOR_STATE', 'batch is not completely ready for scatter');
        }
        return freezeRecord({ requestId: item.requestId, requestGeneration: item.requestGeneration, outputs: slot.result.outputs });
      });
      for (const item of batch.items) {
        const slot = slots[item.slot];
        slot.state = 'free'; slot.request = null; slot.result = null; slot.batch = null;
      }
      return freezeRecord(output);
    },
    cancel(token) {
      assertOpen();
      const slot = slotFor(token, ['queued']);
      slot.state = 'free'; slot.request = null; slot.result = null; slot.batch = null;
      return freezeRecord({ status: 'cancelled', token: tokenKey(token) });
    },
    retryBatch(batch) {
      assertOpen(); object(batch, 'batch');
      for (const item of batch.items ?? []) {
        const slot = slots[item.slot];
        if (!slot || slot.generation !== item.slotGeneration || slot.batch !== batch.batchGeneration || !['inflight', 'ready'].includes(slot.state)) {
          fail('TENSOR_EVALUATOR_STALE', 'cannot retry a stale batch');
        }
      }
      for (const item of batch.items) {
        const slot = slots[item.slot]; slot.state = 'queued'; slot.result = null; slot.batch = null;
      }
      return freezeRecord({ status: 'retryable', count: batch.items.length });
    },
    snapshot() {
      return freezeRecord({
        closed,
        capacity: slots.length,
        free: slots.filter(({ state }) => state === 'free').length,
        queued: slots.filter(({ state }) => state === 'queued').length,
        inflight: slots.filter(({ state }) => state === 'inflight').length,
        ready: slots.filter(({ state }) => state === 'ready').length,
        slots: slots.map(({ slot, generation, state, request, batch }) => ({ slot, generation, state, request: request ? { ...request } : null, batch })),
      });
    },
    close() {
      if (closed) return freezeRecord({ status: 'complete', repeated: true });
      const active = slots.filter(({ state }) => state !== 'free');
      if (active.length > 0) return freezeRecord({ status: 'retained', active: active.map(({ slot, generation, state }) => ({ slot, generation, state })) });
      closed = true;
      return freezeRecord({ status: 'complete', repeated: false });
    },
  };
  return Object.freeze(reference);
}

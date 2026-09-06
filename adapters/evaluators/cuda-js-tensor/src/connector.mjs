const CONNECTOR_CONTRACT = 'cuda-mcgs.tensor-evaluator-connector/0.1.0';
const REFERENCE_CONTRACT = 'cuda-mcgs.tensor-evaluator-reference/0.1.0';
const TENSOR_CONTRACTS = new Set([
  'SPEC-0009-item-parallel-device-tensor-program-v1',
  'SPEC-0009-item-parallel-device-tensor-program-v1+SPEC-0009-gather-concat-v1',
]);
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const HEX64 = /^[0-9a-f]{64}$/;

function freeze(value) {
  if (value === null || typeof value !== 'object') return value;
  return Object.freeze(Array.isArray(value)
    ? value.map(freeze)
    : Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freeze(child)])));
}

export class TensorEvaluatorConnectorError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'TensorEvaluatorConnectorError';
    this.code = code;
    this.details = freeze(details);
  }
}

function fail(code, message, details) {
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

function normalizeFunction(value) {
  object(value, 'tensor function');
  if (value.name !== 'tensorRunItem' || value.returns !== 'u32' || !Array.isArray(value.parameters)) {
    fail('TENSOR_EVALUATOR_CALLABLE', 'Tensor callable must be the public tensorRunItem u32 function');
  }
  const parameters = value.parameters.map((parameter, index) => {
    object(parameter, `tensor function parameter ${index}`);
    if (!IDENTIFIER.test(parameter.name) || typeof parameter.type !== 'string' || parameter.type.length === 0) {
      fail('TENSOR_EVALUATOR_CALLABLE', `tensor function parameter ${index} is invalid`);
    }
    return { name: parameter.name, type: parameter.type };
  });
  if (new Set(parameters.map(({ name }) => name)).size !== parameters.length) fail('TENSOR_EVALUATOR_CALLABLE', 'tensor function parameter names must be unique');
  return { name: value.name, parameters, returns: value.returns };
}

function normalizeProgramParameters(value, itemCapacity) {
  if (!Array.isArray(value) || value.length === 0) fail('TENSOR_EVALUATOR_CALLABLE', 'Tensor program parameters must be non-empty');
  const parameters = value.map((parameter, index) => {
    object(parameter, `Tensor program parameter ${index}`);
    if (parameter.parameterIndex !== index || !IDENTIFIER.test(parameter.parameterName) || typeof parameter.type !== 'string'
        || !['item-index', 'input', 'output', 'workspace'].includes(parameter.role)
        || !['read', 'write', 'read-write'].includes(parameter.access) || typeof parameter.itemVarying !== 'boolean') {
      fail('TENSOR_EVALUATOR_CALLABLE', `Tensor program parameter ${index} is malformed`);
    }
    let byteLength = 0;
    let perItemBytes = 0;
    if (parameter.role !== 'item-index') {
      byteLength = nonnegativeInteger(parameter.byteLength, `${parameter.parameterName} byteLength`);
      if (parameter.itemVarying) {
        if (byteLength % itemCapacity !== 0) fail('TENSOR_EVALUATOR_ITEM_AXIS', `${parameter.parameterName} bytes do not divide by item capacity`);
        perItemBytes = byteLength / itemCapacity;
      }
    }
    return {
      parameterIndex: index,
      parameterName: parameter.parameterName,
      role: parameter.role,
      type: parameter.type,
      dtype: parameter.dtype,
      access: parameter.access,
      itemVarying: parameter.itemVarying,
      byteLength,
      perItemBytes,
    };
  });
  if (parameters[0].role !== 'item-index' || parameters.filter(({ role }) => role === 'item-index').length !== 1) {
    fail('TENSOR_EVALUATOR_ITEM_AXIS', 'Tensor callable must expose exactly one leading item-index parameter');
  }
  if (parameters.filter(({ role }) => role === 'output').length === 0) fail('TENSOR_EVALUATOR_OUTPUT', 'Tensor callable must expose at least one output');
  return parameters;
}

function normalizeImport(tensorDeviceProgram, alias) {
  if (typeof tensorDeviceProgram.importAs !== 'function') fail('TENSOR_EVALUATOR_IMPORT', 'TensorDeviceProgram.importAs is unavailable');
  const imported = object(tensorDeviceProgram.importAs(alias), 'Tensor Device-JS import');
  const library = object(imported.library, 'Tensor Device-JS library');
  if (imported.as !== alias || imported.name !== 'tensorRunItem' || library.schemaVersion !== 1 || !HEX64.test(library.sha256)
      || !['ptx', 'lto-ir'].includes(library.format) || !Array.isArray(library.exports)
      || !library.exports.some((entry) => entry?.name === 'tensorRunItem')) {
    fail('TENSOR_EVALUATOR_IMPORT', 'Tensor public Device-JS import/library identity is invalid');
  }
  return imported;
}

export function createTensorEvaluatorConnector(tensorDeviceProgram, options = {}) {
  object(tensorDeviceProgram, 'TensorDeviceProgram');
  object(options, 'connector options');
  for (const key of Object.keys(options)) if (!['alias', 'requestCapacity'].includes(key)) fail('TENSOR_EVALUATOR_OPTIONS', `unknown connector option ${key}`);
  if (tensorDeviceProgram.kind !== 'tensor-device-program' || !TENSOR_CONTRACTS.has(tensorDeviceProgram.contract)) {
    fail('TENSOR_EVALUATOR_CONTRACT', 'unsupported TensorDeviceProgram contract');
  }
  const itemCapacity = positiveInteger(tensorDeviceProgram.itemCapacity, 'Tensor itemCapacity');
  const requestCapacity = positiveInteger(options.requestCapacity ?? itemCapacity, 'requestCapacity');
  if (requestCapacity > itemCapacity) fail('TENSOR_EVALUATOR_CAPACITY', 'requestCapacity cannot exceed Tensor itemCapacity');
  const alias = options.alias ?? 'mcgsTensorRunItem';
  if (!IDENTIFIER.test(alias) || alias === 'gpu') fail('TENSOR_EVALUATOR_ALIAS', 'Tensor import alias must be a non-gpu Device-JS identifier');
  const callable = normalizeFunction(tensorDeviceProgram.function);
  const parameters = normalizeProgramParameters(tensorDeviceProgram.parameters, itemCapacity);
  if (callable.parameters.length !== parameters.length
      || callable.parameters.some((parameter, index) => parameter.name !== parameters[index].parameterName || parameter.type !== parameters[index].type)) {
    fail('TENSOR_EVALUATOR_CALLABLE', 'Tensor function and parameter descriptors differ');
  }
  const totalWorkspaceBytes = nonnegativeInteger(tensorDeviceProgram.totalWorkspaceBytes, 'totalWorkspaceBytes');
  const workspaceBytes = parameters.filter(({ role }) => role === 'workspace').reduce((total, entry) => total + entry.byteLength, 0);
  if (workspaceBytes !== totalWorkspaceBytes) fail('TENSOR_EVALUATOR_WORKSPACE', 'Tensor workspace descriptors differ from totalWorkspaceBytes');
  const compatibilityIdentity = text(tensorDeviceProgram.compatibilityIdentity, 'Tensor compatibilityIdentity');
  const deviceImport = normalizeImport(tensorDeviceProgram, alias);
  const sourceParameters = callable.parameters.map(({ name }) => name).join(', ');
  const source = `function mcgsTensorEvaluateItem(${sourceParameters}) { return ${alias}(${sourceParameters}); }\n`;
  const connector = {
    kind: 'cuda-mcgs-tensor-evaluator-connector',
    contract: CONNECTOR_CONTRACT,
    tensor: {
      contract: tensorDeviceProgram.contract,
      compatibilityIdentity,
      itemCapacity,
      totalWorkspaceBytes,
      outputFormat: tensorDeviceProgram.outputFormat,
    },
    requestCapacity,
    parameters,
    deviceImport,
    deviceFunction: {
      name: 'mcgsTensorEvaluateItem',
      kind: 'device',
      parameters: callable.parameters,
      returns: 'u32',
    },
    source,
    claimLimits: ['public-tensor-callable-only', 'no-product-semantics', 'no-native-or-provider-qualification'],
  };
  return freeze(connector);
}

function tokenKey(token) {
  return `${token.slot}:${token.slotGeneration}:${token.requestId}:${token.requestGeneration}`;
}

export function createTensorEvaluatorReference(connector) {
  object(connector, 'connector');
  if (connector.contract !== CONNECTOR_CONTRACT) fail('TENSOR_EVALUATOR_CONNECTOR', 'connector contract is invalid');
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
      return freeze({ slot: slot.slot, slotGeneration: slot.generation, requestId, requestGeneration });
    },
    formBatch(maxItems = connector.tensor.itemCapacity) {
      assertOpen();
      positiveInteger(maxItems, 'maxItems');
      const selected = slots.filter(({ state }) => state === 'queued').slice(0, Math.min(maxItems, connector.tensor.itemCapacity));
      if (selected.length === 0) return null;
      batchGeneration += 1;
      const items = selected.map((slot, itemIndex) => {
        slot.state = 'inflight'; slot.batch = batchGeneration;
        return freeze({
          itemIndex,
          slot: slot.slot,
          slotGeneration: slot.generation,
          requestId: slot.request.requestId,
          requestGeneration: slot.request.requestGeneration,
          inputIdentity: slot.request.inputIdentity,
        });
      });
      return freeze({ batchGeneration, itemCapacity: connector.tensor.itemCapacity, occupancy: items.length, items });
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
        return { slot, result: freeze({ outputs: result.outputs ?? null, token: freeze({ slot: expected.slot, slotGeneration: expected.slotGeneration, requestId: expected.requestId, requestGeneration: expected.requestGeneration }) }) };
      });
      for (const entry of prepared) { entry.slot.result = entry.result; entry.slot.state = 'ready'; }
      return freeze({ status: 'ready', batchGeneration: batch.batchGeneration, count: prepared.length });
    },
    scatter(batch) {
      assertOpen(); object(batch, 'batch');
      const output = batch.items.map((item) => {
        const slot = slots[item.slot];
        if (!slot || slot.generation !== item.slotGeneration || slot.state !== 'ready' || slot.batch !== batch.batchGeneration) {
          fail('TENSOR_EVALUATOR_STATE', 'batch is not completely ready for scatter');
        }
        return freeze({ requestId: item.requestId, requestGeneration: item.requestGeneration, outputs: slot.result.outputs });
      });
      for (const item of batch.items) {
        const slot = slots[item.slot];
        slot.state = 'free'; slot.request = null; slot.result = null; slot.batch = null;
      }
      return freeze(output);
    },
    cancel(token) {
      assertOpen();
      const slot = slotFor(token, ['queued']);
      slot.state = 'free'; slot.request = null; slot.result = null; slot.batch = null;
      return freeze({ status: 'cancelled', token: tokenKey(token) });
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
      return freeze({ status: 'retryable', count: batch.items.length });
    },
    snapshot() {
      return freeze({
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
      if (closed) return freeze({ status: 'complete', repeated: true });
      const active = slots.filter(({ state }) => state !== 'free');
      if (active.length > 0) return freeze({ status: 'retained', active: active.map(({ slot, generation, state }) => ({ slot, generation, state })) });
      closed = true;
      return freeze({ status: 'complete', repeated: false });
    },
  };
  return Object.freeze(reference);
}

export const tensorEvaluatorConnectorConstants = Object.freeze({ connectorContract: CONNECTOR_CONTRACT, referenceContract: REFERENCE_CONTRACT, tensorContracts: Object.freeze([...TENSOR_CONTRACTS]) });

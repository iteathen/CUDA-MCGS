import { TensorEvaluatorConnectorError } from './connector.mjs';

const RUNTIME_CONTRACT = 'cuda-mcgs.tensor-evaluator-device-runtime/0.1.0';
const REQUIRED_CUDA_JS_CONTRACTS = Object.freeze([
  'cuda-js.device-js/0.1.0',
  'cuda-js.device-publication-release-acquire/0.1.0',
]);
const UINT32_MAX = 0xffff_ffff;
const DTYPE_WIDTH = Object.freeze({
  u32: 4,
  i32: 4,
  u64: 8,
  f32: 4,
  f64: 8,
  f16: 2,
  bf16: 2,
});
const GENERATED_NAMES = Object.freeze({
  control32: 'mcgsEvalControl32',
  control64: 'mcgsEvalControl64',
  admit: 'mcgsTensorEvaluatorAdmit',
  cancel: 'mcgsTensorEvaluatorCancel',
  formBatch: 'mcgsTensorEvaluatorFormBatch',
  prepareItem: 'mcgsTensorEvaluatorPrepareItem',
  executeItem: 'mcgsTensorEvaluatorExecuteItem',
  scatterItem: 'mcgsTensorEvaluatorScatterItem',
  publishItem: 'mcgsTensorEvaluatorPublishItem',
  retryItem: 'mcgsTensorEvaluatorRetryItem',
  recycle: 'mcgsTensorEvaluatorRecycle',
  requestMatches: 'mcgsTensorEvaluatorRequestMatches',
  batchItemMatches: 'mcgsTensorEvaluatorBatchItemMatches',
  finishBatchItem: 'mcgsTensorEvaluatorFinishBatchItem',
});

const SLOT = Object.freeze({ free: 0, claimed: 1, queued: 2, inflight: 3, publishing: 4, ready: 5, failed: 6, cancelled: 7, stale: 8, retired: 9 });
const BATCH = Object.freeze({ free: 0, forming: 1, ready: 2, retired: 3 });
const ITEM = Object.freeze({ pending: 0, prepared: 1, computed: 2, scattered: 3, failed: 4, cancelled: 5, stale: 6, retrying: 7, published: 8 });
const RESULT = Object.freeze({ ok: 0, invalid: 1, pressure: 2, noWork: 3, busy: 4, stale: 5, cancelled: 6, failed: 7, notReady: 8, generationExhausted: 9, retried: 10 });
const DISPOSITION = Object.freeze({
  pressure: 'evaluator-request-capacity',
  stale: 'evaluator-input-stale',
  cancelled: 'evaluator-cancelled',
  failed: 'evaluator-internal-failure',
  generationExhausted: 'evaluator-generation-exhausted',
  pending: 'evaluator-batch-pending',
});

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
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('TENSOR_EVALUATOR_RUNTIME_INPUT', `${label} must be an object`);
  return value;
}

function exactOptions(value) {
  object(value, 'runtime options');
  for (const key of Object.keys(value)) if (!['id'].includes(key)) fail('TENSOR_EVALUATOR_RUNTIME_OPTIONS', `unknown runtime option ${key}`);
}

function checkedAdd(left, right, label) {
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right) || left < 0 || right < 0 || left > Number.MAX_SAFE_INTEGER - right) {
    fail('TENSOR_EVALUATOR_RUNTIME_BOUNDS', `${label} exceeds the safe integer resource domain`);
  }
  return left + right;
}

function checkedMultiply(left, right, label) {
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right) || left < 0 || right < 0 || (left !== 0 && right > Math.floor(Number.MAX_SAFE_INTEGER / left))) {
    fail('TENSOR_EVALUATOR_RUNTIME_BOUNDS', `${label} exceeds the safe integer resource domain`);
  }
  return left * right;
}

function checkedBytes(elements, width, label) {
  return checkedMultiply(elements, width, `${label} byteLength`);
}

function identifier(value, label) {
  if (typeof value !== 'string' || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)) fail('TENSOR_EVALUATOR_RUNTIME_INPUT', `${label} must be a Device-JS identifier`);
  return value;
}

function namespacedId(value, label) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+$/.test(value)) fail('TENSOR_EVALUATOR_RUNTIME_INPUT', `${label} must be a namespaced id`);
  return value;
}

function u32(value) {
  return `gpu.u32(${value})`;
}

function u64(value) {
  return `gpu.u64(${BigInt(value)}n)`;
}

function param(name, type) {
  return { name, type };
}

function deviceFunction(name, parameters, returns = 'u32') {
  return { name, kind: 'device', parameters, returns };
}

function partitionParameters(prefix, partitions) {
  return partitions.map(({ parameterName, dtype }) => param(parameterName, `ptr<${dtype}>`));
}

function normalizeTensorLayout(connector) {
  const itemCapacity = connector.tensor.itemCapacity;
  const requestInputs = new Map();
  const resultOutputs = new Map();
  const tensorParameters = [];

  for (const descriptor of connector.parameters) {
    if (descriptor.role === 'item-index') continue;
    const width = DTYPE_WIDTH[descriptor.dtype];
    if (!width) fail('TENSOR_EVALUATOR_RUNTIME_DTYPE', `Tensor parameter ${descriptor.parameterName} uses unsupported runtime-copy dtype ${descriptor.dtype}`);
    if (descriptor.byteLength !== checkedBytes(descriptor.elementCount, width, `${descriptor.parameterName} Tensor parameter`)) {
      fail('TENSOR_EVALUATOR_RUNTIME_LAYOUT', `Tensor parameter ${descriptor.parameterName} byteLength differs from its public element layout`);
    }
    tensorParameters.push({ ...descriptor });
    if (descriptor.role === 'input' && descriptor.itemVarying) {
      if (descriptor.elementCount % itemCapacity !== 0) fail('TENSOR_EVALUATOR_RUNTIME_LAYOUT', `${descriptor.parameterName} item-varying input does not divide exactly by itemCapacity`);
      const perItemElements = descriptor.elementCount / itemCapacity;
      if (perItemElements <= 0) fail('TENSOR_EVALUATOR_RUNTIME_LAYOUT', `${descriptor.parameterName} item-varying input is empty`);
      const list = requestInputs.get(descriptor.dtype) ?? [];
      list.push({ ...descriptor, perItemElements });
      requestInputs.set(descriptor.dtype, list);
    }
    if (descriptor.role === 'output') {
      if (descriptor.perItemElements * itemCapacity !== descriptor.elementCount) {
        fail('TENSOR_EVALUATOR_RUNTIME_LAYOUT', `${descriptor.parameterName} output item layout differs from itemCapacity`);
      }
      const list = resultOutputs.get(descriptor.dtype) ?? [];
      list.push({ ...descriptor });
      resultOutputs.set(descriptor.dtype, list);
    }
  }

  function buildPartitions(entriesByDtype, kind, capacity) {
    const partitions = [];
    for (const [dtype, entries] of [...entriesByDtype].sort(([left], [right]) => left.localeCompare(right))) {
      let perRequestElements = 0;
      const members = entries.map((entry) => {
        const perItemElements = entry.perItemElements;
        const offset = perRequestElements;
        perRequestElements = checkedAdd(perRequestElements, perItemElements, `${kind}.${dtype} per-request elements`);
        return { parameterName: entry.parameterName, perItemElements, offset };
      });
      const elementCount = checkedMultiply(capacity, perRequestElements, `${kind}.${dtype} elementCount`);
      const byteLength = checkedBytes(elementCount, DTYPE_WIDTH[dtype], `${kind}.${dtype}`);
      partitions.push({
        id: `runtime.${kind}.${dtype}`,
        parameterName: `mcgsEval${kind === 'request-input' ? 'RequestInput' : 'ResultOutput'}_${dtype}`,
        dtype,
        access: 'read-write',
        perRequestElements,
        elementCount,
        byteLength,
        members,
      });
    }
    return partitions;
  }

  return {
    tensorParameters,
    requestInputPartitions: buildPartitions(requestInputs, 'request-input', connector.requestCapacity),
    resultOutputPartitions: buildPartitions(resultOutputs, 'result-output', connector.requestCapacity),
  };
}

function stateLayouts(requestCapacity, itemCapacity) {
  const c32 = {};
  let cursor32 = 0;
  c32.slotState = cursor32; cursor32 = checkedAdd(cursor32, requestCapacity, 'control32 slotState');
  c32.cancelRequested = cursor32; cursor32 = checkedAdd(cursor32, requestCapacity, 'control32 cancelRequested');
  c32.slotBatchItem = cursor32; cursor32 = checkedAdd(cursor32, requestCapacity, 'control32 slotBatchItem');
  c32.batchSlots = cursor32; cursor32 = checkedAdd(cursor32, itemCapacity, 'control32 batchSlots');
  c32.itemStatus = cursor32; cursor32 = checkedAdd(cursor32, itemCapacity, 'control32 itemStatus');
  c32.batchState = cursor32; cursor32 = checkedAdd(cursor32, 1, 'control32 batchState');
  c32.batchOccupancy = cursor32; cursor32 = checkedAdd(cursor32, 1, 'control32 batchOccupancy');
  c32.batchCompleted = cursor32; cursor32 = checkedAdd(cursor32, 1, 'control32 batchCompleted');

  const c64 = {};
  let cursor64 = 0;
  c64.slotGeneration = cursor64; cursor64 = checkedAdd(cursor64, requestCapacity, 'control64 slotGeneration');
  c64.requestGeneration = cursor64; cursor64 = checkedAdd(cursor64, requestCapacity, 'control64 requestGeneration');
  c64.slotBatchGeneration = cursor64; cursor64 = checkedAdd(cursor64, requestCapacity, 'control64 slotBatchGeneration');
  c64.batchSlotGeneration = cursor64; cursor64 = checkedAdd(cursor64, itemCapacity, 'control64 batchSlotGeneration');
  c64.batchRequestGeneration = cursor64; cursor64 = checkedAdd(cursor64, itemCapacity, 'control64 batchRequestGeneration');
  c64.batchGeneration = cursor64; cursor64 = checkedAdd(cursor64, 1, 'control64 batchGeneration');

  return {
    control32: { ...c32, elementCount: cursor32, byteLength: checkedBytes(cursor32, 4, 'control32') },
    control64: { ...c64, elementCount: cursor64, byteLength: checkedBytes(cursor64, 8, 'control64') },
  };
}

function assertGeneratedNameSafety(connector, layout) {
  const used = new Set(connector.deviceFunction.parameters.map(({ name }) => name));
  for (const name of [GENERATED_NAMES.control32, GENERATED_NAMES.control64, ...layout.requestInputPartitions.map(({ parameterName }) => parameterName), ...layout.resultOutputPartitions.map(({ parameterName }) => parameterName)]) {
    identifier(name, 'generated runtime parameter');
    if (used.has(name)) fail('TENSOR_EVALUATOR_RUNTIME_COLLISION', `Tensor parameter ${name} collides with a generated evaluator runtime parameter`);
  }
}

function generateSource(connector, state, layout) {
  const R = connector.requestCapacity;
  const I = connector.tensor.itemCapacity;
  const c32 = state.control32;
  const c64 = state.control64;
  const control32 = GENERATED_NAMES.control32;
  const control64 = GENERATED_NAMES.control64;
  const source = [];
  source.push(connector.source.trimEnd());

  source.push(`function ${GENERATED_NAMES.requestMatches}(slot, expectedSlotGeneration, expectedRequestGeneration, ${control64}) {
  if (slot >= ${u32(R)}) { return false; }
  let slotIndex = gpu.u64(slot);
  return ${control64}[slotIndex + ${u64(c64.slotGeneration)}] === expectedSlotGeneration && ${control64}[slotIndex + ${u64(c64.requestGeneration)}] === expectedRequestGeneration;
}`);

  source.push(`function ${GENERATED_NAMES.batchItemMatches}(itemIndex, expectedSlot, expectedSlotGeneration, expectedRequestGeneration, expectedBatchGeneration, ${control32}, ${control64}) {
  if (itemIndex >= ${u32(I)} || expectedSlot >= ${u32(R)}) { return false; }
  let batchStateValue = gpu.atomic.loadAcquireDevice(${control32}, ${u64(c32.batchState)});
  if (batchStateValue !== ${u32(BATCH.ready)}) { return false; }
  let batchGenerationValue = ${control64}[${u64(c64.batchGeneration)}];
  if (batchGenerationValue !== expectedBatchGeneration) { return false; }
  let occupancy = ${control32}[${u64(c32.batchOccupancy)}];
  if (itemIndex >= occupancy) { return false; }
  let item = gpu.u64(itemIndex);
  let slot = ${control32}[item + ${u64(c32.batchSlots)}];
  if (slot !== expectedSlot) { return false; }
  let slotIndex = gpu.u64(slot);
  let slotStateValue = gpu.atomic.loadAcquireDevice(${control32}, slotIndex + ${u64(c32.slotState)});
  if (slotStateValue !== ${u32(SLOT.inflight)}) { return false; }
  return ${control64}[slotIndex + ${u64(c64.slotGeneration)}] === expectedSlotGeneration
    && ${control64}[slotIndex + ${u64(c64.requestGeneration)}] === expectedRequestGeneration
    && ${control64}[slotIndex + ${u64(c64.slotBatchGeneration)}] === expectedBatchGeneration
    && ${control64}[item + ${u64(c64.batchSlotGeneration)}] === expectedSlotGeneration
    && ${control64}[item + ${u64(c64.batchRequestGeneration)}] === expectedRequestGeneration
    && ${control32}[slotIndex + ${u64(c32.slotBatchItem)}] === itemIndex;
}`);

  source.push(`function ${GENERATED_NAMES.finishBatchItem}(itemIndex, expectedItemStatus, expectedBatchGeneration, ${control32}, ${control64}) {
  if (itemIndex >= ${u32(I)}) { return ${u32(RESULT.invalid)}; }
  let batchStateValue = gpu.atomic.loadAcquireDevice(${control32}, ${u64(c32.batchState)});
  if (batchStateValue !== ${u32(BATCH.ready)} || ${control64}[${u64(c64.batchGeneration)}] !== expectedBatchGeneration) { return ${u32(RESULT.stale)}; }
  let item = gpu.u64(itemIndex);
  let prior = gpu.atomic.cas(${control32}, item + ${u64(c32.itemStatus)}, expectedItemStatus, ${u32(ITEM.published)});
  if (prior !== expectedItemStatus) { return ${u32(RESULT.notReady)}; }
  let previousCompleted = gpu.atomic.add(${control32}, ${u64(c32.batchCompleted)}, ${u32(1)});
  let occupancy = ${control32}[${u64(c32.batchOccupancy)}];
  if (previousCompleted + ${u32(1)} === occupancy) {
    gpu.atomic.storeReleaseDevice(${control32}, ${u64(c32.batchState)}, ${u32(BATCH.free)});
  }
  return ${u32(RESULT.ok)};
}`);

  source.push(`function ${GENERATED_NAMES.admit}(slot, requestGenerationValue, ${control32}, ${control64}) {
  if (slot >= ${u32(R)}) { return ${u32(RESULT.invalid)}; }
  let slotIndex = gpu.u64(slot);
  let prior = gpu.atomic.cas(${control32}, slotIndex + ${u64(c32.slotState)}, ${u32(SLOT.free)}, ${u32(SLOT.claimed)});
  if (prior !== ${u32(SLOT.free)}) { return ${u32(RESULT.pressure)}; }
  let generation = ${control64}[slotIndex + ${u64(c64.slotGeneration)}];
  if (generation === gpu.u64(18446744073709551615n)) {
    gpu.atomic.storeReleaseDevice(${control32}, slotIndex + ${u64(c32.slotState)}, ${u32(SLOT.retired)});
    return ${u32(RESULT.generationExhausted)};
  }
  generation += gpu.u64(1n);
  ${control64}[slotIndex + ${u64(c64.slotGeneration)}] = generation;
  ${control64}[slotIndex + ${u64(c64.requestGeneration)}] = requestGenerationValue;
  ${control64}[slotIndex + ${u64(c64.slotBatchGeneration)}] = gpu.u64(0n);
  ${control32}[slotIndex + ${u64(c32.slotBatchItem)}] = gpu.u32(0);
  gpu.atomic.storeReleaseDevice(${control32}, slotIndex + ${u64(c32.cancelRequested)}, gpu.u32(0));
  gpu.atomic.storeReleaseDevice(${control32}, slotIndex + ${u64(c32.slotState)}, ${u32(SLOT.queued)});
  return ${u32(RESULT.ok)};
}`);

  source.push(`function ${GENERATED_NAMES.cancel}(slot, expectedSlotGeneration, expectedRequestGeneration, ${control32}, ${control64}) {
  if (slot >= ${u32(R)}) { return ${u32(RESULT.invalid)}; }
  let slotIndex = gpu.u64(slot);
  let stateValue = gpu.atomic.loadAcquireDevice(${control32}, slotIndex + ${u64(c32.slotState)});
  if (!${GENERATED_NAMES.requestMatches}(slot, expectedSlotGeneration, expectedRequestGeneration, ${control64})) { return ${u32(RESULT.stale)}; }
  if (stateValue !== ${u32(SLOT.queued)} && stateValue !== ${u32(SLOT.inflight)}) { return ${u32(RESULT.notReady)}; }
  gpu.atomic.storeReleaseDevice(${control32}, slotIndex + ${u64(c32.cancelRequested)}, gpu.u32(1));
  if (stateValue === ${u32(SLOT.queued)}) {
    let prior = gpu.atomic.cas(${control32}, slotIndex + ${u64(c32.slotState)}, ${u32(SLOT.queued)}, ${u32(SLOT.publishing)});
    if (prior === ${u32(SLOT.queued)}) {
      gpu.atomic.storeReleaseDevice(${control32}, slotIndex + ${u64(c32.slotState)}, ${u32(SLOT.cancelled)});
      return ${u32(RESULT.cancelled)};
    }
  }
  let after = gpu.atomic.loadAcquireDevice(${control32}, slotIndex + ${u64(c32.slotState)});
  if (after === ${u32(SLOT.inflight)}) { return ${u32(RESULT.cancelled)}; }
  return ${u32(RESULT.notReady)};
}`);

  source.push(`function ${GENERATED_NAMES.formBatch}(${control32}, ${control64}) {
  let priorBatch = gpu.atomic.cas(${control32}, ${u64(c32.batchState)}, ${u32(BATCH.free)}, ${u32(BATCH.forming)});
  if (priorBatch !== ${u32(BATCH.free)}) { return ${u32(RESULT.busy)}; }
  let hasQueued = false;
  for (let probe = gpu.u32(0); probe < ${u32(R)}; probe += gpu.u32(1)) {
    let observed = gpu.atomic.loadAcquireDevice(${control32}, gpu.u64(probe) + ${u64(c32.slotState)});
    if (observed === ${u32(SLOT.queued)}) { hasQueued = true; break; }
  }
  if (!hasQueued) {
    gpu.atomic.storeReleaseDevice(${control32}, ${u64(c32.batchState)}, ${u32(BATCH.free)});
    return ${u32(RESULT.noWork)};
  }
  let generation = ${control64}[${u64(c64.batchGeneration)}];
  if (generation === gpu.u64(18446744073709551615n)) {
    gpu.atomic.storeReleaseDevice(${control32}, ${u64(c32.batchState)}, ${u32(BATCH.retired)});
    return ${u32(RESULT.generationExhausted)};
  }
  generation += gpu.u64(1n);
  ${control32}[${u64(c32.batchOccupancy)}] = gpu.u32(0);
  ${control32}[${u64(c32.batchCompleted)}] = gpu.u32(0);
  let occupancy = gpu.u32(0);
  for (let slot = gpu.u32(0); slot < ${u32(R)}; slot += gpu.u32(1)) {
    if (occupancy >= ${u32(I)}) { break; }
    let slotIndex = gpu.u64(slot);
    let observed = gpu.atomic.loadAcquireDevice(${control32}, slotIndex + ${u64(c32.slotState)});
    if (observed !== ${u32(SLOT.queued)}) { continue; }
    let claimed = gpu.atomic.cas(${control32}, slotIndex + ${u64(c32.slotState)}, ${u32(SLOT.queued)}, ${u32(SLOT.inflight)});
    if (claimed !== ${u32(SLOT.queued)}) { continue; }
    let item = gpu.u64(occupancy);
    ${control32}[item + ${u64(c32.batchSlots)}] = slot;
    ${control32}[slotIndex + ${u64(c32.slotBatchItem)}] = occupancy;
    ${control32}[item + ${u64(c32.itemStatus)}] = ${u32(ITEM.pending)};
    ${control64}[slotIndex + ${u64(c64.slotBatchGeneration)}] = generation;
    ${control64}[item + ${u64(c64.batchSlotGeneration)}] = ${control64}[slotIndex + ${u64(c64.slotGeneration)}];
    ${control64}[item + ${u64(c64.batchRequestGeneration)}] = ${control64}[slotIndex + ${u64(c64.requestGeneration)}];
    occupancy += gpu.u32(1);
  }
  if (occupancy === gpu.u32(0)) {
    gpu.atomic.storeReleaseDevice(${control32}, ${u64(c32.batchState)}, ${u32(BATCH.free)});
    return ${u32(RESULT.noWork)};
  }
  ${control64}[${u64(c64.batchGeneration)}] = generation;
  ${control32}[${u64(c32.batchOccupancy)}] = occupancy;
  gpu.atomic.storeReleaseDevice(${control32}, ${u64(c32.batchState)}, ${u32(BATCH.ready)});
  return occupancy;
}`);

  const prepareParams = [param('itemIndex', 'u32'), param('expectedSlot', 'u32'), param('expectedSlotGeneration', 'u64'), param('expectedRequestGeneration', 'u64'), param('expectedBatchGeneration', 'u64'), param(control32, 'ptr<u32>'), param(control64, 'ptr<u64>'), ...partitionParameters('request', layout.requestInputPartitions)];
  for (const descriptor of layout.tensorParameters.filter(({ role, itemVarying }) => role === 'input' && itemVarying)) prepareParams.push(param(descriptor.parameterName, descriptor.type));
  const prepareCopies = [];
  let prepareCopyIndex = 0;
  for (const partition of layout.requestInputPartitions) {
    for (const member of partition.members) {
      const tensorParameter = member.parameterName;
      const loop = `copy${prepareCopyIndex}`;
      prepareCopyIndex += 1;
      prepareCopies.push(`  for (let ${loop} = gpu.u64(0n); ${loop} < ${u64(member.perItemElements)}; ${loop} += gpu.u64(1n)) {
    ${tensorParameter}[gpu.u64(itemIndex) * ${u64(member.perItemElements)} + ${loop}] = ${partition.parameterName}[gpu.u64(expectedSlot) * ${u64(partition.perRequestElements)} + ${u64(member.offset)} + ${loop}];
  }`);
    }
  }
  source.push(`function ${GENERATED_NAMES.prepareItem}(${prepareParams.map(({ name }) => name).join(', ')}) {
  if (itemIndex >= ${u32(I)}) { return ${u32(RESULT.invalid)}; }
  if (!${GENERATED_NAMES.batchItemMatches}(itemIndex, expectedSlot, expectedSlotGeneration, expectedRequestGeneration, expectedBatchGeneration, ${control32}, ${control64})) { return ${u32(RESULT.stale)}; }
  let item = gpu.u64(itemIndex);
  let slot = expectedSlot;
  let cancelled = gpu.atomic.loadAcquireDevice(${control32}, gpu.u64(slot) + ${u64(c32.cancelRequested)});
  if (cancelled !== gpu.u32(0)) {
    gpu.atomic.storeReleaseDevice(${control32}, item + ${u64(c32.itemStatus)}, ${u32(ITEM.cancelled)});
    return ${u32(RESULT.cancelled)};
  }
${prepareCopies.join('\n')}
  gpu.atomic.storeReleaseDevice(${control32}, item + ${u64(c32.itemStatus)}, ${u32(ITEM.prepared)});
  return ${u32(RESULT.ok)};
}`);

  const executeTensorParams = connector.deviceFunction.parameters.filter(({ name }) => name !== 'itemIndex');
  const executeParams = [
    param('itemIndex', 'u32'), param('expectedSlot', 'u32'), param('expectedSlotGeneration', 'u64'),
    param('expectedRequestGeneration', 'u64'), param('expectedBatchGeneration', 'u64'),
    param(control32, 'ptr<u32>'), param(control64, 'ptr<u64>'), ...executeTensorParams,
  ];
  const tensorCallArguments = ['itemIndex', ...executeTensorParams.map(({ name }) => name)].join(', ');
  source.push(`function ${GENERATED_NAMES.executeItem}(${executeParams.map(({ name }) => name).join(', ')}) {
  if (!${GENERATED_NAMES.batchItemMatches}(itemIndex, expectedSlot, expectedSlotGeneration, expectedRequestGeneration, expectedBatchGeneration, ${control32}, ${control64})) { return ${u32(RESULT.stale)}; }
  let item = gpu.u64(itemIndex);
  let itemState = gpu.atomic.loadAcquireDevice(${control32}, item + ${u64(c32.itemStatus)});
  if (itemState !== ${u32(ITEM.prepared)}) { return ${u32(RESULT.notReady)}; }
  let cancelled = gpu.atomic.loadAcquireDevice(${control32}, gpu.u64(expectedSlot) + ${u64(c32.cancelRequested)});
  if (cancelled !== gpu.u32(0)) {
    gpu.atomic.storeReleaseDevice(${control32}, item + ${u64(c32.itemStatus)}, ${u32(ITEM.cancelled)});
    return ${u32(RESULT.cancelled)};
  }
  let tensorStatus = ${connector.deviceFunction.name}(${tensorCallArguments});
  if (!${GENERATED_NAMES.batchItemMatches}(itemIndex, expectedSlot, expectedSlotGeneration, expectedRequestGeneration, expectedBatchGeneration, ${control32}, ${control64})) { return ${u32(RESULT.stale)}; }
  cancelled = gpu.atomic.loadAcquireDevice(${control32}, gpu.u64(expectedSlot) + ${u64(c32.cancelRequested)});
  if (cancelled !== gpu.u32(0)) {
    gpu.atomic.storeReleaseDevice(${control32}, item + ${u64(c32.itemStatus)}, ${u32(ITEM.cancelled)});
    return ${u32(RESULT.cancelled)};
  }
  if (tensorStatus === gpu.u32(0)) {
    gpu.atomic.storeReleaseDevice(${control32}, item + ${u64(c32.itemStatus)}, ${u32(ITEM.computed)});
    return ${u32(RESULT.ok)};
  }
  gpu.atomic.storeReleaseDevice(${control32}, item + ${u64(c32.itemStatus)}, ${u32(ITEM.failed)});
  return ${u32(RESULT.failed)};
}`);

  const scatterParams = [param('itemIndex', 'u32'), param('expectedSlot', 'u32'), param('expectedSlotGeneration', 'u64'), param('expectedRequestGeneration', 'u64'), param('expectedBatchGeneration', 'u64'), param(control32, 'ptr<u32>'), param(control64, 'ptr<u64>')];
  for (const descriptor of layout.tensorParameters.filter(({ role }) => role === 'output')) scatterParams.push(param(descriptor.parameterName, descriptor.type));
  scatterParams.push(...partitionParameters('result', layout.resultOutputPartitions));
  const scatterCopies = [];
  let scatterCopyIndex = 0;
  for (const partition of layout.resultOutputPartitions) {
    for (const member of partition.members) {
      const tensorParameter = member.parameterName;
      const loop = `copy${scatterCopyIndex}`;
      scatterCopyIndex += 1;
      scatterCopies.push(`  for (let ${loop} = gpu.u64(0n); ${loop} < ${u64(member.perItemElements)}; ${loop} += gpu.u64(1n)) {
    ${partition.parameterName}[gpu.u64(expectedSlot) * ${u64(partition.perRequestElements)} + ${u64(member.offset)} + ${loop}] = ${tensorParameter}[gpu.u64(itemIndex) * ${u64(member.perItemElements)} + ${loop}];
  }`);
    }
  }
  source.push(`function ${GENERATED_NAMES.scatterItem}(${scatterParams.map(({ name }) => name).join(', ')}) {
  if (itemIndex >= ${u32(I)}) { return ${u32(RESULT.invalid)}; }
  if (!${GENERATED_NAMES.batchItemMatches}(itemIndex, expectedSlot, expectedSlotGeneration, expectedRequestGeneration, expectedBatchGeneration, ${control32}, ${control64})) { return ${u32(RESULT.stale)}; }
  let item = gpu.u64(itemIndex);
  let itemState = gpu.atomic.loadAcquireDevice(${control32}, item + ${u64(c32.itemStatus)});
  if (itemState !== ${u32(ITEM.computed)}) {
    if (itemState === ${u32(ITEM.failed)}) { return ${u32(RESULT.failed)}; }
    return ${u32(RESULT.notReady)};
  }
  let cancelled = gpu.atomic.loadAcquireDevice(${control32}, gpu.u64(expectedSlot) + ${u64(c32.cancelRequested)});
  if (cancelled !== gpu.u32(0)) {
    gpu.atomic.storeReleaseDevice(${control32}, item + ${u64(c32.itemStatus)}, ${u32(ITEM.cancelled)});
    return ${u32(RESULT.cancelled)};
  }
${scatterCopies.join('\n')}
  if (!${GENERATED_NAMES.batchItemMatches}(itemIndex, expectedSlot, expectedSlotGeneration, expectedRequestGeneration, expectedBatchGeneration, ${control32}, ${control64})) { return ${u32(RESULT.stale)}; }
  gpu.atomic.storeReleaseDevice(${control32}, item + ${u64(c32.itemStatus)}, ${u32(ITEM.scattered)});
  return ${u32(RESULT.ok)};
}`);

  source.push(`function ${GENERATED_NAMES.publishItem}(itemIndex, expectedSlot, expectedSlotGeneration, expectedRequestGeneration, expectedBatchGeneration, ${control32}, ${control64}) {
  if (!${GENERATED_NAMES.batchItemMatches}(itemIndex, expectedSlot, expectedSlotGeneration, expectedRequestGeneration, expectedBatchGeneration, ${control32}, ${control64})) { return ${u32(RESULT.stale)}; }
  let item = gpu.u64(itemIndex);
  let itemState = gpu.atomic.loadAcquireDevice(${control32}, item + ${u64(c32.itemStatus)});
  if (itemState !== ${u32(ITEM.scattered)} && itemState !== ${u32(ITEM.failed)} && itemState !== ${u32(ITEM.cancelled)} && itemState !== ${u32(ITEM.stale)}) { return ${u32(RESULT.notReady)}; }
  let slotIndex = gpu.u64(expectedSlot);
  let cancelled = gpu.atomic.loadAcquireDevice(${control32}, slotIndex + ${u64(c32.cancelRequested)});
  if (cancelled !== gpu.u32(0) && itemState === ${u32(ITEM.scattered)}) {
    gpu.atomic.storeReleaseDevice(${control32}, item + ${u64(c32.itemStatus)}, ${u32(ITEM.cancelled)});
    itemState = ${u32(ITEM.cancelled)};
  }
  let targetState = ${u32(SLOT.stale)};
  let resultCode = ${u32(RESULT.stale)};
  if (itemState === ${u32(ITEM.scattered)}) { targetState = ${u32(SLOT.ready)}; resultCode = ${u32(RESULT.ok)}; }
  else if (itemState === ${u32(ITEM.failed)}) { targetState = ${u32(SLOT.failed)}; resultCode = ${u32(RESULT.failed)}; }
  else if (itemState === ${u32(ITEM.cancelled)}) { targetState = ${u32(SLOT.cancelled)}; resultCode = ${u32(RESULT.cancelled)}; }
  let publicationClaim = gpu.atomic.cas(${control32}, slotIndex + ${u64(c32.slotState)}, ${u32(SLOT.inflight)}, ${u32(SLOT.publishing)});
  if (publicationClaim !== ${u32(SLOT.inflight)}) { return ${u32(RESULT.stale)}; }
  let finishResult = ${GENERATED_NAMES.finishBatchItem}(itemIndex, itemState, expectedBatchGeneration, ${control32}, ${control64});
  if (finishResult !== ${u32(RESULT.ok)}) {
    gpu.atomic.storeReleaseDevice(${control32}, slotIndex + ${u64(c32.slotState)}, ${u32(SLOT.stale)});
    return ${u32(RESULT.failed)};
  }
  gpu.atomic.storeReleaseDevice(${control32}, slotIndex + ${u64(c32.slotState)}, targetState);
  return resultCode;
}`);

  source.push(`function ${GENERATED_NAMES.retryItem}(itemIndex, expectedSlot, expectedSlotGeneration, expectedRequestGeneration, expectedBatchGeneration, ${control32}, ${control64}) {
  if (!${GENERATED_NAMES.batchItemMatches}(itemIndex, expectedSlot, expectedSlotGeneration, expectedRequestGeneration, expectedBatchGeneration, ${control32}, ${control64})) { return ${u32(RESULT.stale)}; }
  let item = gpu.u64(itemIndex);
  let cancelled = gpu.atomic.loadAcquireDevice(${control32}, gpu.u64(expectedSlot) + ${u64(c32.cancelRequested)});
  if (cancelled !== gpu.u32(0)) {
    gpu.atomic.storeReleaseDevice(${control32}, item + ${u64(c32.itemStatus)}, ${u32(ITEM.cancelled)});
    return ${u32(RESULT.cancelled)};
  }
  let priorItem = gpu.atomic.cas(${control32}, item + ${u64(c32.itemStatus)}, ${u32(ITEM.failed)}, ${u32(ITEM.retrying)});
  if (priorItem !== ${u32(ITEM.failed)}) { return ${u32(RESULT.notReady)}; }
  let priorSlot = gpu.atomic.cas(${control32}, gpu.u64(expectedSlot) + ${u64(c32.slotState)}, ${u32(SLOT.inflight)}, ${u32(SLOT.claimed)});
  if (priorSlot !== ${u32(SLOT.inflight)}) {
    gpu.atomic.storeReleaseDevice(${control32}, item + ${u64(c32.itemStatus)}, ${u32(ITEM.failed)});
    return ${u32(RESULT.stale)};
  }
  gpu.atomic.storeReleaseDevice(${control32}, gpu.u64(expectedSlot) + ${u64(c32.slotState)}, ${u32(SLOT.queued)});
  let finishResult = ${GENERATED_NAMES.finishBatchItem}(itemIndex, ${u32(ITEM.retrying)}, expectedBatchGeneration, ${control32}, ${control64});
  if (finishResult !== ${u32(RESULT.ok)}) { return ${u32(RESULT.failed)}; }
  return ${u32(RESULT.retried)};
}`);

  source.push(`function ${GENERATED_NAMES.recycle}(slot, expectedSlotGeneration, expectedRequestGeneration, ${control32}, ${control64}) {
  if (slot >= ${u32(R)}) { return ${u32(RESULT.invalid)}; }
  let slotIndex = gpu.u64(slot);
  let stateValue = gpu.atomic.loadAcquireDevice(${control32}, slotIndex + ${u64(c32.slotState)});
  if (stateValue !== ${u32(SLOT.ready)} && stateValue !== ${u32(SLOT.failed)} && stateValue !== ${u32(SLOT.cancelled)} && stateValue !== ${u32(SLOT.stale)}) { return ${u32(RESULT.notReady)}; }
  if (!${GENERATED_NAMES.requestMatches}(slot, expectedSlotGeneration, expectedRequestGeneration, ${control64})) { return ${u32(RESULT.stale)}; }
  let prior = gpu.atomic.cas(${control32}, slotIndex + ${u64(c32.slotState)}, stateValue, ${u32(SLOT.claimed)});
  if (prior !== stateValue) { return ${u32(RESULT.stale)}; }
  gpu.atomic.storeReleaseDevice(${control32}, slotIndex + ${u64(c32.cancelRequested)}, gpu.u32(0));
  gpu.atomic.storeReleaseDevice(${control32}, slotIndex + ${u64(c32.slotState)}, ${u32(SLOT.free)});
  return ${u32(RESULT.ok)};
}`);

  return `${source.join('\n\n')}\n`;
}

function functionMetadata(connector, layout) {
  const c32 = param(GENERATED_NAMES.control32, 'ptr<u32>');
  const c64 = param(GENERATED_NAMES.control64, 'ptr<u64>');
  const token = [
    param('itemIndex', 'u32'), param('expectedSlot', 'u32'), param('expectedSlotGeneration', 'u64'),
    param('expectedRequestGeneration', 'u64'), param('expectedBatchGeneration', 'u64'),
  ];
  const prepare = [...token, c32, c64, ...partitionParameters('request', layout.requestInputPartitions)];
  for (const descriptor of layout.tensorParameters.filter(({ role, itemVarying }) => role === 'input' && itemVarying)) prepare.push(param(descriptor.parameterName, descriptor.type));
  const execute = [...token, c32, c64, ...connector.deviceFunction.parameters.filter(({ name }) => name !== 'itemIndex').map(({ name, type }) => param(name, type))];
  const scatter = [...token, c32, c64];
  for (const descriptor of layout.tensorParameters.filter(({ role }) => role === 'output')) scatter.push(param(descriptor.parameterName, descriptor.type));
  scatter.push(...partitionParameters('result', layout.resultOutputPartitions));
  return [
    connector.deviceFunction,
    deviceFunction(GENERATED_NAMES.requestMatches, [param('slot', 'u32'), param('expectedSlotGeneration', 'u64'), param('expectedRequestGeneration', 'u64'), c64], 'bool'),
    deviceFunction(GENERATED_NAMES.batchItemMatches, [...token, c32, c64], 'bool'),
    deviceFunction(GENERATED_NAMES.finishBatchItem, [param('itemIndex', 'u32'), param('expectedItemStatus', 'u32'), param('expectedBatchGeneration', 'u64'), c32, c64]),
    deviceFunction(GENERATED_NAMES.admit, [param('slot', 'u32'), param('requestGenerationValue', 'u64'), c32, c64]),
    deviceFunction(GENERATED_NAMES.cancel, [param('slot', 'u32'), param('expectedSlotGeneration', 'u64'), param('expectedRequestGeneration', 'u64'), c32, c64]),
    deviceFunction(GENERATED_NAMES.formBatch, [c32, c64]),
    deviceFunction(GENERATED_NAMES.prepareItem, prepare),
    deviceFunction(GENERATED_NAMES.executeItem, execute),
    deviceFunction(GENERATED_NAMES.scatterItem, scatter),
    deviceFunction(GENERATED_NAMES.publishItem, [...token, c32, c64]),
    deviceFunction(GENERATED_NAMES.retryItem, [...token, c32, c64]),
    deviceFunction(GENERATED_NAMES.recycle, [param('slot', 'u32'), param('expectedSlotGeneration', 'u64'), param('expectedRequestGeneration', 'u64'), c32, c64]),
  ];
}

function resourcePlan(state, layout) {
  const resources = [
    { id: 'runtime.control32', parameterName: GENERATED_NAMES.control32, dtype: 'u32', access: 'read-write', elementCount: state.control32.elementCount, byteLength: state.control32.byteLength, initialization: 'zero-before-ignition' },
    { id: 'runtime.control64', parameterName: GENERATED_NAMES.control64, dtype: 'u64', access: 'read-write', elementCount: state.control64.elementCount, byteLength: state.control64.byteLength, initialization: 'zero-before-ignition' },
    ...layout.requestInputPartitions.map((entry) => ({ ...entry, initialization: 'zero-before-ignition' })),
    ...layout.resultOutputPartitions.map((entry) => ({ ...entry, initialization: 'zero-before-ignition' })),
  ];
  return resources;
}

export function createTensorEvaluatorRuntimeContribution(connector, options = {}) {
  object(connector, 'Tensor evaluator connector');
  exactOptions(options);
  if (connector.kind !== 'cuda-mcgs-tensor-evaluator-connector' || connector.contract !== 'cuda-mcgs.tensor-evaluator-connector/0.1.0') {
    fail('TENSOR_EVALUATOR_RUNTIME_CONNECTOR', 'runtime contribution requires the admitted public Tensor evaluator connector');
  }
  const id = options.id ?? 'evaluator.tensor-device-runtime';
  namespacedId(id, 'runtime contribution id');
  const requestCapacity = connector.requestCapacity;
  const itemCapacity = connector.tensor.itemCapacity;
  if (!Number.isSafeInteger(requestCapacity) || requestCapacity <= 0 || requestCapacity > UINT32_MAX || !Number.isSafeInteger(itemCapacity) || itemCapacity <= 0 || itemCapacity > UINT32_MAX) {
    fail('TENSOR_EVALUATOR_RUNTIME_BOUNDS', 'connector capacities are outside the public u32 item/request domain');
  }
  const layout = normalizeTensorLayout(connector);
  assertGeneratedNameSafety(connector, layout);
  const state = stateLayouts(requestCapacity, itemCapacity);
  const source = generateSource(connector, state, layout);
  const functions = functionMetadata(connector, layout);
  const resources = resourcePlan(state, layout);
  const tensorBindings = layout.tensorParameters.map((entry) => ({
    parameterName: entry.parameterName,
    role: entry.role,
    type: entry.type,
    dtype: entry.dtype,
    access: entry.role === 'input' && !entry.itemVarying ? 'read' : 'read-write',
    itemVarying: entry.itemVarying,
    byteLength: entry.byteLength,
    initialization: entry.role === 'input' && !entry.itemVarying ? 'external-before-ignition' : 'zero-before-ignition',
  }));
  const workClasses = {
    encode: {
      owner: 'evaluator-profile-and-search-program',
      functions: [],
      handoff: 'populate-request-input-partitions-before-admit-release',
    },
    admit: { owner: id, functions: [GENERATED_NAMES.admit] },
    batch: { owner: id, functions: [GENERATED_NAMES.formBatch] },
    execute: { owner: id, functions: [GENERATED_NAMES.prepareItem, GENERATED_NAMES.executeItem] },
    scatter: { owner: id, functions: [GENERATED_NAMES.scatterItem] },
    publish: { owner: id, functions: [GENERATED_NAMES.publishItem] },
  };
  const lifecycleFunctions = {
    cancel: GENERATED_NAMES.cancel,
    retry: GENERATED_NAMES.retryItem,
    recycle: GENERATED_NAMES.recycle,
  };
  const contribution = {
    kind: 'cuda-mcgs-tensor-evaluator-runtime-contribution',
    contract: RUNTIME_CONTRACT,
    id,
    execution: {
      deviceOwned: true,
      hostProgress: 'none',
      maxConcurrentBatches: 1,
      partialBatch: 'immediate-when-any-queued-request-is-serviced',
      itemCapacity,
      requestCapacity,
    },
    staleSafety: {
      token: ['itemIndex', 'slot', 'slotGeneration', 'requestGeneration', 'batchGeneration'],
      capture: 'after-batch-ready-acquire-before-item-work-enqueue',
      mismatch: 'read-only-stale-no-current-lane-mutation',
      publication: 'single-cas-to-publishing-then-release-terminal-with-incarnation-revalidation',
      semanticRequestIdentityOwner: 'evaluator-profile-and-search-program',
    },
    state: {
      slotStates: { ...SLOT },
      batchStates: { ...BATCH },
      itemStates: { ...ITEM },
      resultCodes: { ...RESULT },
      dispositions: { ...DISPOSITION },
      control32: { ...state.control32 },
      control64: { ...state.control64 },
    },
    resources,
    tensorBindings,
    requestInputPartitions: layout.requestInputPartitions,
    resultOutputPartitions: layout.resultOutputPartitions,
    requiredCudaJsContracts: [...REQUIRED_CUDA_JS_CONTRACTS],
    device: {
      source,
      functions,
      importIdentity: connector.deviceImportIdentity,
      createDeviceImport: connector.createDeviceImport,
      workClasses,
      lifecycleFunctions,
    },
    encodedInputHandoff: {
      owner: 'evaluator-profile-and-search-program',
      targetResources: layout.requestInputPartitions.map(({ id: resourceId }) => resourceId),
      completion: 'before-admit-release',
      visibility: 'ordinary-writes-before-slot-queued-release-acquire',
    },
    initialization: {
      phase: 'pre-ignition',
      required: resources.filter(({ initialization }) => initialization === 'zero-before-ignition').map(({ id: resourceId }) => resourceId),
      externalTensorParameters: tensorBindings.filter(({ initialization }) => initialization === 'external-before-ignition').map(({ parameterName }) => parameterName),
    },
    claimLimits: [
      'product-neutral-device-js-contribution',
      'progress-owner-selects-service-order',
      'evaluator-profile-search-program-owns-encoded-request-inputs',
      'post-batch-work-requires-captured-incarnation-token',
      'one-concurrent-tensor-batch-first-realization',
      'portable-source-and-state-layout-only',
      'no-native-or-provider-qualification',
    ],
  };
  return freeze(contribution);
}

export const tensorEvaluatorRuntimeConstants = Object.freeze({
  contract: RUNTIME_CONTRACT,
  requiredCudaJsContracts: REQUIRED_CUDA_JS_CONTRACTS,
  generatedNames: GENERATED_NAMES,
  slotStates: SLOT,
  batchStates: BATCH,
  itemStates: ITEM,
  resultCodes: RESULT,
  dispositions: DISPOSITION,
  dtypeWidth: DTYPE_WIDTH,
});

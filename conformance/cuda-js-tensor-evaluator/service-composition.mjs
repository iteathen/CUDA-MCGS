import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { compositionFixture } from './operation-composition.mjs';
import { recordingPeer, initialInputs, prepare } from './runtime-composition.mjs';
import { normalizeProgramPackageProfile, composeSearchProgram, buildExecutionPackage } from '../../components/search-compiler/index.mjs';

const { owners, service } = compositionFixture;
const runtime = owners.runtime;
const R = runtime.execution.requestCapacity;
const state = runtime.state;
const r32 = runtime.resources.find(({ resourceKey }) => resourceKey === 'tensor-runtime-request-control32').parameterName;
const r64 = runtime.resources.find(({ resourceKey }) => resourceKey === 'tensor-runtime-request-control64').parameterName;
const encoded = runtime.requestInputPartitions[0];
const result = runtime.resultOutputPartitions[0];
const fn = new Map(runtime.device.functions.map((record) => [record.name, record]));
const admit = runtime.device.workClasses.admit.functions[0];
const call = (name, replacements = {}) => `${name}(${fn.get(name).parameters.map(({ name }) => replacements[name] ?? name).join(', ')})`;
const u64 = (value) => `gpu.u64(${value})`;
const u32 = (value) => `gpu.u32(${value})`;
const identity = (value) => ({ algorithm: 'sha256', sha256: createHash('sha256').update(value).digest('hex') });

export function servicePackage({ reuse = false } = {}) {
  const input = structuredClone(compositionFixture.input);
  const entry = input.functions.find(({ executionRole }) => executionRole === 'runtime-entry');
  const source = input.sourceUnits.find(({ id }) => id === entry.sourceUnit);
  const progressCall = `${service.function.name}(${service.function.parameters.map(({ name }) => name).join(', ')})`;
  const recycle = runtime.device.lifecycleFunctions.recycle;
  const scatter = runtime.device.workClasses.scatter.functions[0];
  const oldToken = { itemIndex: u32(0), expectedSlot: u32(0), expectedSlotGeneration: u64(1), expectedRequestGeneration: u64(1), expectedBatchGeneration: u64(1) };
  source.source = `function engine_step(${entry.parameters.map(({ name }) => name).join(', ')}) {
  let lane = gpu.thread.x();
  if (lane === ${u32(0)}) {
    for (let slot = ${u32(0)}; slot < ${u32(R)}; slot = slot + ${u32(1)}) {
      ${encoded.parameterName}[gpu.u64(slot) * ${u64(encoded.perRequestElements)}] = gpu.f32(slot + ${u32(1)});
      ${encoded.parameterName}[gpu.u64(slot) * ${u64(encoded.perRequestElements)} + ${u64(1)}] = gpu.f32(slot + ${u32(10)});
      ${call(admit, { requestGenerationValue: u64(1) })};
    }
    output[${u64(10)}] = ${call(admit, { slot: u32(0), requestGenerationValue: u64(99) })};
  }
  gpu.barrier.block();
  let quiet = ${progressCall};
  gpu.barrier.block();
  if (lane === ${u32(0)}) {
    output[${u64(0)}] = ${u32(0)};
    if (quiet) { output[${u64(0)}] = ${u32(1)}; }
    for (let slot = ${u32(0)}; slot < ${u32(R)}; slot = slot + ${u32(1)}) {
      output[${u64(1)} + gpu.u64(slot)] = gpu.atomic.loadAcquireDevice(${r32}, gpu.u64(slot) + ${u64(state.requestControl32.slotState)});
      output[${u64(1 + R)} + gpu.u64(slot) * ${u64(2)}] = gpu.u32(${result.parameterName}[gpu.u64(slot) * ${u64(result.perRequestElements)}]);
      output[${u64(2 + R)} + gpu.u64(slot) * ${u64(2)}] = gpu.u32(${result.parameterName}[gpu.u64(slot) * ${u64(result.perRequestElements)} + ${u64(1)}]);
    }
  }
${reuse ? `  if (lane === ${u32(0)}) {
    ${call(recycle, { slot: u32(0), expectedSlotGeneration: u64(1), expectedRequestGeneration: u64(1) })};
    ${encoded.parameterName}[${u64(0)}] = gpu.f32(41);
    ${call(admit, { slot: u32(0), requestGenerationValue: u64(2) })};
  }
  gpu.barrier.block();
  let quietAgain = ${progressCall};
  gpu.barrier.block();
  if (lane === ${u32(0)}) {
    output[${u64(11)}] = ${call(scatter, oldToken)};
    output[${u64(12)}] = gpu.u32(${result.parameterName}[${u64(0)}]);
  }
` : ''}}
`;
  source.sourceIdentity = identity(source.source);
  source.contributionIdentity = source.sourceIdentity;
  entry.calls = [admit, service.function.name, ...(reuse ? [recycle, scatter] : [])];
  entry.helpers = ['gpu.thread.x', 'gpu.barrier.block', 'gpu.atomic.loadAcquireDevice'];
  const operation = input.operations[0];
  operation.grid = service.launch.grid; operation.block = service.launch.block;
  const outputBinding = operation.bindings.find(({ parameter }) => parameter === 'output');
  outputBinding.source.view = { dtype: 'u32', byteOffset: input.deliveries[0].byteOffset, elementCount: (BigInt(input.deliveries[0].byteLength) / 4n).toString() };
  const context = { ...compositionFixture.context, composerContributionIdentity: source.sourceIdentity };
  const normalized = normalizeProgramPackageProfile(input, owners.inspected, context);
  return buildExecutionPackage(normalized, composeSearchProgram(normalized)).normalized;
}

// Execute the exact composed source with only its block barriers adapted to
// generator yields. This oracle checks block-uniform control flow and data flow;
// it is not a CUDA compiler or a physical memory-order/scheduling model.
function executeBlock(pkg, launch, { reverse = false, cancelAt = Infinity, failInput = null } = {}) {
  const constructors = { u32: Uint32Array, u64: BigUint64Array, f32: Float32Array, i32: Int32Array };
  const arguments_ = launch.arguments.map((value) => value.kind === 'device-view'
    ? new constructors[value.dtype](value.storage.buffer, value.byteOffset, value.elementCount) : value);
  let lane = 0, opportunities = 0, calls = 0;
  const gpu = {
    u32: (value) => Number(value) >>> 0, u64: (value) => BigInt(value), f32: Math.fround,
    thread: { x: () => lane, globalX: () => lane },
    mailbox: { loadAcquireSystem: () => opportunities++ >= cancelAt ? 1 : 0 },
    atomic: {
      loadAcquireDevice: (pointer, index) => pointer[Number(index)],
      storeReleaseDevice: (pointer, index, value) => { pointer[Number(index)] = value; },
      cas(pointer, index, expected, value) { const old = pointer[Number(index)]; if (old === expected) pointer[Number(index)] = value; return old; },
      add(pointer, index, value) { const old = pointer[Number(index)]; pointer[Number(index)] = old + value; return old; },
    },
  };
  const alias = runtime.device.importIdentity.as;
  const tensor = (item, features, weights, scores) => {
    calls += 1;
    if (features[item * 2] === failInput) return 1;
    scores[item * 2] = Math.fround(features[item * 2] * weights[0]);
    scores[item * 2 + 1] = Math.fround(features[item * 2 + 1] * weights[1]);
    return 0;
  };
  const adapted = pkg.cudaJsAdapter.searchProgram.source
    .replace(`function ${service.function.name}(`, `function* ${service.function.name}(`)
    .replace('function engine_step(', 'function* engine_step(')
    .replaceAll(`= ${service.function.name}(`, `= yield* ${service.function.name}(`)
    .replaceAll('gpu.barrier.block();', 'yield "block";');
  const entry = new Function('gpu', alias, `${adapted}\nreturn engine_step;`)(gpu, tensor);
  const lanes = Array.from({ length: Number(service.launch.block[0]) }, (_, index) => ({ index, iterator: entry(...arguments_) }));
  if (reverse) lanes.reverse();
  let barriers = 0;
  for (;;) {
    const states = lanes.map(({ index, iterator }) => { lane = index; return iterator.next(); });
    if (states.every(({ done }) => done)) break;
    assert(states.every(({ done, value }) => !done && value === 'block'), 'all lanes must reach the same block barrier');
    assert(++barriers < 100, 'finite cohort must terminate without host progress');
  }
  return { calls, words: Array.from(arguments_[0].slice(0, 13)), barriers };
}

const weights = new Float32Array(owners.artifactPayload.buffer);
for (const scenario of [
  { id: 'full-and-partial', expectedStates: [5, 5, 5], expectedCalls: 3 },
  { id: 'reverse-lanes', reverse: true, expectedStates: [5, 5, 5], expectedCalls: 3 },
  { id: 'cancel-before-service', cancelAt: 0, expectedStates: [7, 7, 7], expectedCalls: 0 },
  { id: 'cancel-after-first-batch', cancelAt: 1, expectedStates: [5, 5, 7], expectedCalls: 2 },
  { id: 'tensor-failure', failInput: 2, expectedStates: [5, 6, 5], expectedCalls: 3 },
  { id: 'reuse-stale-scatter', reuse: true, expectedStates: [5, 5, 5], expectedCalls: 4 },
]) {
  const pkg = servicePackage(scenario);
  let observed;
  const fake = recordingPeer({ submit: (launch) => { observed = executeBlock(pkg, launch, scenario); } });
  const execution = await prepare(pkg, fake);
  await execution.ignite(initialInputs(pkg)); await execution.wait();
  assert.equal(observed.words[0], 1, `${scenario.id}: owner quiescence`);
  assert.deepEqual(observed.words.slice(1, 4), scenario.expectedStates, scenario.id);
  assert.equal(observed.calls, scenario.expectedCalls, scenario.id);
  assert.equal(observed.words[10], runtime.state.resultCodes.pressure, 'duplicate admission must fail without replacing the live request');
  for (let slot = 0; slot < R; slot += 1) {
    const ready = scenario.expectedStates[slot] === 5;
    assert.equal(observed.words[4 + slot * 2], ready ? Number(Math.fround((slot + 1) * weights[0])) >>> 0 : 0);
    assert.equal(observed.words[5 + slot * 2], ready ? Number(Math.fround((slot + 10) * weights[1])) >>> 0 : 0);
  }
  if (scenario.reuse) {
    assert.equal(observed.words[11], runtime.state.resultCodes.stale);
    assert.equal(observed.words[12], Number(Math.fround(41 * weights[0])) >>> 0);
  }
  assert.equal(fake.calls.filter(([name]) => name === 'function.submit').length, 1);
  assert.equal((await execution.close()).status, 'complete');
  console.log(`tensor_composed_service=${scenario.id} result=pass submissions=1 tensorCalls=${observed.calls}`);
}

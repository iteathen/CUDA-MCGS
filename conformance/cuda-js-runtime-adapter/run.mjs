import assert from 'node:assert/strict';

import { CudaJsRuntimeAdapterError, prepareCudaJsExecution } from '../../adapters/runtimes/cuda-js/index.mjs';
import { PEER, call, calls, clone, executionPackage, publicCudaJsFake } from './src/fixture.mjs';

const cases = [];
function test(name, run) { cases.push({ name, run }); }
async function rejects(run, code, classification = null) {
  let caught = null;
  try { await run(); } catch (error) { caught = error; }
  assert.ok(caught instanceof CudaJsRuntimeAdapterError, `expected adapter error, got ${caught}`);
  assert.equal(caught.code, code);
  if (classification) assert.equal(caught.classification, classification);
  return caught;
}

test('happy path translates only declared public facts and cleans in dependency order', async () => {
  const fake = publicCudaJsFake();
  const prepared = await prepareCudaJsExecution(executionPackage(), { cudaJs: fake.cudaJs, peer: PEER });
  assert.equal(prepared.kind, 'cuda-js-execution');
  assert.equal(prepared.state, 'prepared');
  assert.deepEqual(call(fake, 'openCudaRuntime')[1], { driver: { maxPending: 1 }, compiler: true });
  assert.deepEqual(call(fake, 'runtime.allocateDevice')[1], { byteLength: 16 });
  assert.deepEqual(call(fake, 'runtime.createPublicationMailbox')[1], { lanes: [{ name: 'sideband.framework-cancellation', direction: 'host-to-device' }] });
  const compile = call(fake, 'compileDeviceProgram')[1];
  assert.equal(compile.functions[0].kind, 'kernel');
  assert.deepEqual(compile.functions[0].parameters, [{ name: 'output', type: 'ptr<u32>' }, { name: 'frameworkCancellation', type: 'mailbox<host-to-device,u32>' }]);
  assert.equal(call(fake, 'module.getFunction')[1].name, 'kernel_engine_step');

  await prepared.ignite();
  const submit = call(fake, 'function.submit')[1];
  assert.equal(submit.arguments[0].kind, 'device-memory');
  assert.equal(submit.arguments[1].kind, 'publication-mailbox');
  assert.equal(submit.arguments[1].lane, 'sideband.framework-cancellation');
  assert.deepEqual(submit.grid, { x: 1, y: 1, z: 1 });
  assert.deepEqual(submit.block, { x: 64, y: 1, z: 1 });
  assert.deepEqual(submit.accesses, [{ argumentIndex: 0, byteOffset: 0, byteLength: 16, mode: 'write' }]);
  assert.equal(calls(fake, 'memory.write').length, 0);

  prepared.publish('sideband.framework-cancellation', 7);
  assert.equal(fake.mailboxValues.get('sideband.framework-cancellation'), 7);
  await rejects(() => prepared.observe('sideband.framework-cancellation'), 'CUDA_JS_ADAPTER_INPUT');
  await rejects(() => prepared.deliver('delivery.terminal-output'), 'CUDA_JS_ADAPTER_STATE');
  assert.equal(calls(fake, 'memory.readAsync').length, 0);
  const complete = await prepared.wait();
  assert.equal(complete.state, 'completed');
  const delivery = await prepared.deliver('delivery.terminal-output');
  assert.equal(delivery.role, 'terminal-output');
  assert.equal(delivery.bytes.byteLength, 16);
  assert.deepEqual(call(fake, 'memory.readAsync').slice(2), [{ deviceOffset: 0, byteLength: 16 }]);
  const repeatedDelivery = await prepared.deliver('delivery.terminal-output');
  assert.equal(repeatedDelivery.bytes.byteLength, 16);
  assert.equal(calls(fake, 'memory.readAsync').length, 2);
  const cleanup = await prepared.close();
  assert.equal(cleanup.status, 'complete');
  const order = fake.calls.map(([name]) => name);
  assert.ok(order.indexOf('operation.close') < order.indexOf('function.close'));
  assert.ok(order.indexOf('function.close') < order.indexOf('module.close'));
  assert.ok(order.indexOf('module.close') < order.indexOf('mailbox.close'));
  assert.ok(order.indexOf('mailbox.close') < order.indexOf('memory.close'));
  assert.ok(order.indexOf('memory.close') < order.indexOf('runtime.close'));
});

test('exact peer revision/package drift fails before lower mutation', async () => {
  const fake = publicCudaJsFake();
  const stale = executionPackage();
  stale.compatibility.cudaJs.revision = 'bc2700f2e5c654567c2e17bf8d67b882351b8681';
  stale.compatibility.cudaJs.package = 'cuda-js@0.1.0-alpha.17';
  await rejects(() => prepareCudaJsExecution(stale, { cudaJs: fake.cudaJs, peer: PEER }), 'CUDA_JS_ADAPTER_PEER', 'unsupported-capability');
  assert.equal(fake.calls.length, 0);
});

test('unknown CUDA-JS contract fails closed before lower mutation', async () => {
  const fake = publicCudaJsFake();
  const packageValue = executionPackage();
  packageValue.cudaJsAdapter.publicContracts.push({ id: 'cuda-js.future-private-contract/9.9.9' });
  await rejects(() => prepareCudaJsExecution(packageValue, { cudaJs: fake.cudaJs, peer: PEER }), 'CUDA_JS_ADAPTER_CAPABILITY', 'unsupported-capability');
  assert.equal(fake.calls.length, 0);
});

test('alignment uses divisibility guarantee and never becomes allocation input', async () => {
  const incompatibleFake = publicCudaJsFake();
  const incompatible = executionPackage();
  incompatible.cudaJsAdapter.resourceRequirements[0].alignment = '24';
  await rejects(() => prepareCudaJsExecution(incompatible, { cudaJs: incompatibleFake.cudaJs, peer: PEER }), 'CUDA_JS_ADAPTER_CAPABILITY');
  assert.equal(incompatibleFake.calls.length, 0);

  const compatibleFake = publicCudaJsFake();
  const compatible = executionPackage();
  compatible.cudaJsAdapter.resourceRequirements[0].alignment = '8';
  const prepared = await prepareCudaJsExecution(compatible, { cudaJs: compatibleFake.cudaJs, peer: PEER });
  assert.deepEqual(call(compatibleFake, 'runtime.allocateDevice')[1], { byteLength: 16 });
  await prepared.close();
});

test('unsafe numeric bounds and runtime policy overrides fail before mutation', async () => {
  const unsafeFake = publicCudaJsFake();
  const unsafe = executionPackage();
  unsafe.cudaJsAdapter.resourceRequirements[0].byteLength = '9007199254740992';
  await rejects(() => prepareCudaJsExecution(unsafe, { cudaJs: unsafeFake.cudaJs, peer: PEER }), 'CUDA_JS_ADAPTER_PACKAGE');
  assert.equal(unsafeFake.calls.length, 0);

  const pendingFake = publicCudaJsFake();
  const pending = executionPackage();
  pending.cudaJsAdapter.operationRequirements[0].launchPolicy.maxPending = '2';
  await rejects(() => prepareCudaJsExecution(pending, { cudaJs: pendingFake.cudaJs, peer: PEER }), 'CUDA_JS_ADAPTER_CAPABILITY');
  assert.equal(pendingFake.calls.length, 0);

  const overrideFake = publicCudaJsFake();
  await rejects(() => prepareCudaJsExecution(executionPackage(), { cudaJs: overrideFake.cudaJs, peer: PEER, runtimeOptions: { driver: { maxPending: 2 } } }), 'CUDA_JS_ADAPTER_INPUT');
  assert.equal(overrideFake.calls.length, 0);
});

test('multiple operations are not inferred into a scheduler', async () => {
  const fake = publicCudaJsFake();
  const value = executionPackage();
  value.cudaJsAdapter.operationRequirements.push(clone(value.cudaJsAdapter.operationRequirements[0]));
  value.cudaJsAdapter.operationRequirements[1].id = 'operation.second';
  await rejects(() => prepareCudaJsExecution(value, { cudaJs: fake.cudaJs, peer: PEER }), 'CUDA_JS_ADAPTER_CAPABILITY', 'unsupported-capability');
  assert.equal(fake.calls.length, 0);
});

test('read and read-write bindings require exact explicit initial bytes', async () => {
  for (const mode of ['read', 'read-write']) {
    const fake = publicCudaJsFake();
    const value = executionPackage();
    value.cudaJsAdapter.resourceRequirements[0].accessRequirements = mode === 'read-write' ? ['read', 'write'] : [mode];
    value.cudaJsAdapter.operationRequirements[0].bindings.find(({ parameter }) => parameter === 'output').source.access = mode;
    const prepared = await prepareCudaJsExecution(value, { cudaJs: fake.cudaJs, peer: PEER });
    await rejects(() => prepared.ignite(), 'CUDA_JS_ADAPTER_INPUT');
    assert.equal(calls(fake, 'function.submit').length, 0);
    await prepared.ignite({ resources: { 'resource.output': new Uint8Array(16).fill(3) } });
    assert.equal(call(fake, 'memory.write')[2], 16);
    assert.equal(call(fake, 'function.submit')[1].accesses[0].mode, mode);
    await prepared.close();
  }
});

test('future scalar binding requires explicit typed value and preserves argument order', async () => {
  const fake = publicCudaJsFake();
  const value = executionPackage();
  value.cudaJsAdapter.searchProgram.source = 'function engine_step(output, limit, frameworkCancellation) { output[gpu.thread.globalX()] = limit; }\n';
  const entry = value.cudaJsAdapter.searchProgram.functions[0];
  entry.parameters.splice(1, 0, { name: 'limit', type: 'u32' });
  value.cudaJsAdapter.operationRequirements[0].bindings.unshift({ parameter: 'limit', source: { kind: 'scalar', schema: { id: 'cuda-mcgs.synthetic-u32/0.1.0', version: '0.1.0', sha256: 'b'.repeat(64) } } });
  const prepared = await prepareCudaJsExecution(value, { cudaJs: fake.cudaJs, peer: PEER });
  await rejects(() => prepared.ignite(), 'CUDA_JS_ADAPTER_INPUT');
  await prepared.ignite({ scalars: { 'operation.engine-step': { limit: 9 } } });
  const args = call(fake, 'function.submit')[1].arguments;
  assert.equal(args[0].kind, 'device-memory');
  assert.equal(args[1], 9);
  assert.equal(args[2].kind, 'publication-mailbox');
  await prepared.close();
});

test('device-to-host sideband is observed but cannot be published by the host', async () => {
  const fake = publicCudaJsFake();
  const value = executionPackage();
  const sideband = value.cudaJsAdapter.sidebandRequirements[0];
  sideband.id = 'sideband.observation'; sideband.role = 'observation'; sideband.direction = 'device-to-host';
  const parameter = value.cudaJsAdapter.searchProgram.functions[0].parameters[1];
  parameter.name = 'observation'; parameter.type = 'sideband<device-to-host,u32>'; parameter.sidebandRole = 'observation';
  const binding = value.cudaJsAdapter.operationRequirements[0].bindings.find(({ source }) => source.kind === 'sideband');
  binding.parameter = 'observation'; binding.source.sideband = 'sideband.observation';
  const prepared = await prepareCudaJsExecution(value, { cudaJs: fake.cudaJs, peer: PEER });
  assert.equal(prepared.observe('sideband.observation'), 0);
  await rejects(() => prepared.publish('sideband.observation', 1), 'CUDA_JS_ADAPTER_INPUT');
  await prepared.close();
});


test('terminal delivery failure preserves lower facts and remains retry-safe for cleanup', async () => {
  const fake = publicCudaJsFake({ readError: true });
  const prepared = await prepareCudaJsExecution(executionPackage(), { cudaJs: fake.cudaJs, peer: PEER });
  await prepared.ignite(); await prepared.wait();
  const error = await rejects(() => prepared.deliver('delivery.terminal-output'), 'CUDA_JS_ADAPTER_DELIVERY', 'operation');
  assert.equal(error.lower.code, 'CUDA_JS_READ_FAILED');
  assert.equal(calls(fake, 'memory.readAsync').length, 1);
  assert.equal((await prepared.close()).status, 'complete');
});

test('unproved terminal transfer cleanup retains backing memory and runtime', async () => {
  const fake = publicCudaJsFake({ readCloseError: true });
  const prepared = await prepareCudaJsExecution(executionPackage(), { cudaJs: fake.cudaJs, peer: PEER });
  await prepared.ignite(); await prepared.wait();
  const error = await rejects(() => prepared.deliver('delivery.terminal-output'), 'CUDA_JS_ADAPTER_DELIVERY_CLEANUP', 'cleanup');
  assert.equal(error.lower.code, 'CUDA_JS_READ_CLOSE_FAILED');
  assert.ok(error.cleanup.retained.includes('memory:resource.output'));
  const report = await prepared.close();
  assert.equal(report.status, 'quarantined');
  assert.equal(calls(fake, 'memory.close').length, 0);
  assert.equal(calls(fake, 'runtime.close').length, 0);
});

test('invalid terminal delivery rejects before lower mutation', async () => {
  const fake = publicCudaJsFake();
  const value = executionPackage();
  value.cudaJsAdapter.deliveryRequirements[0].byteLength = '17';
  await rejects(() => prepareCudaJsExecution(value, { cudaJs: fake.cudaJs, peer: PEER }), 'CUDA_JS_ADAPTER_PACKAGE');
  assert.equal(fake.calls.length, 0);
});

test('compilation failure retains lower facts and rolls back runtime', async () => {
  const fake = publicCudaJsFake({ compileError: true });
  const error = await rejects(() => prepareCudaJsExecution(executionPackage(), { cudaJs: fake.cudaJs, peer: PEER }), 'CUDA_JS_ADAPTER_COMPILE', 'compilation');
  assert.equal(error.lower.code, 'CUDA_JS_COMPILE_FAILED');
  assert.equal(error.cleanup.status, 'complete');
  assert.equal(fake.calls.at(-1)[0], 'runtime.close');
});

test('allocation failure closes already-created compiler/module/function state', async () => {
  const fake = publicCudaJsFake({ allocationError: true });
  const error = await rejects(() => prepareCudaJsExecution(executionPackage(), { cudaJs: fake.cudaJs, peer: PEER }), 'CUDA_JS_ADAPTER_ALLOCATION', 'allocation');
  assert.equal(error.lower.code, 'CUDA_JS_ALLOCATE_FAILED');
  assert.equal(error.cleanup.status, 'complete');
  const names = fake.calls.map(([name]) => name);
  assert.ok(names.includes('function.close') && names.includes('module.close') && names.includes('runtime.close'));
});

test('submit failure preserves operation error and performs full rollback', async () => {
  const fake = publicCudaJsFake({ submitError: true });
  const prepared = await prepareCudaJsExecution(executionPackage(), { cudaJs: fake.cudaJs, peer: PEER });
  const error = await rejects(() => prepared.ignite(), 'CUDA_JS_ADAPTER_OPERATION', 'operation');
  assert.equal(error.lower.code, 'CUDA_JS_SUBMIT_FAILED');
  assert.equal(error.cleanup.status, 'complete');
  assert.equal(fake.calls.at(-1)[0], 'runtime.close');
});

test('terminal failed operation remains a lower operation failure until caller cleanup', async () => {
  const fake = publicCudaJsFake({ waitResult: { schemaVersion: 1, status: 'failed', failure: { code: 'CUDA_JS_KERNEL_FAILED', category: 'operation', operation: 'launch' } } });
  const prepared = await prepareCudaJsExecution(executionPackage(), { cudaJs: fake.cudaJs, peer: PEER });
  await prepared.ignite();
  const error = await rejects(() => prepared.wait(), 'CUDA_JS_ADAPTER_OPERATION', 'operation');
  assert.equal(error.lower.code, 'CUDA_JS_KERNEL_FAILED');
  const report = await prepared.close();
  assert.equal(report.status, 'complete');
});

test('cleanup truth is quarantined when lower runtime requires restart', async () => {
  const fake = publicCudaJsFake({ runtimeCloseResult: { schemaVersion: 1, graceful: false, restartRequired: true, state: 'failed', compiler: {}, driver: {} } });
  const prepared = await prepareCudaJsExecution(executionPackage(), { cudaJs: fake.cudaJs, peer: PEER });
  const report = await prepared.close();
  assert.equal(report.status, 'quarantined');
  assert.equal(report.runtime.restartRequired, true);
});

test('cleanup exceptions are retained rather than relabeled successful', async () => {
  const fake = publicCudaJsFake({ operationCloseError: true });
  const prepared = await prepareCudaJsExecution(executionPackage(), { cudaJs: fake.cudaJs, peer: PEER });
  await prepared.ignite();
  const report = await prepared.close();
  assert.equal(report.status, 'quarantined');
  assert.equal(report.failures[0].label, 'operation');
  assert.equal(report.failures[0].lower.code, 'CUDA_JS_OPERATION_CLOSE_FAILED');
  assert.ok(fake.calls.some(([name]) => name === 'runtime.close'));
});

test('repeated prepare/ignite/wait/close cycles acquire fresh lower state', async () => {
  for (let index = 0; index < 2; index += 1) {
    const fake = publicCudaJsFake();
    const prepared = await prepareCudaJsExecution(executionPackage(), { cudaJs: fake.cudaJs, peer: PEER });
    await prepared.ignite(); await prepared.wait();
    assert.equal((await prepared.close()).status, 'complete');
    assert.equal(calls(fake, 'runtime.allocateDevice').length, 1);
    assert.equal(calls(fake, 'runtime.close').length, 1);
  }
});

let passed = 0;
for (const entry of cases) {
  try { await entry.run(); passed += 1; }
  catch (error) { console.error(`FAIL ${entry.name}`); throw error; }
}
console.log(`CUDA-JS runtime adapter portable conformance: ${passed}/${cases.length} cases passed.`);

#!/usr/bin/env node
import assert from 'node:assert/strict';

import { prepareCudaJsExecution } from '../../adapters/runtimes/cuda-js/index.mjs';
import { PEER, call, calls, executionPackage, publicCudaJsFake } from './src/fixture.mjs';

function viewedPackage() {
  const subject = executionPackage();
  const entry = subject.cudaJsAdapter.searchProgram.functions.find(({ name }) => name === 'engine_step');
  entry.parameters.find(({ name }) => name === 'output').type = 'ptr<f16>';
  subject.cudaJsAdapter.searchProgram.source = 'function engine_step(output, frameworkCancellation) { gpu.mailbox.loadAcquireSystem(frameworkCancellation); output[gpu.thread.globalX()] = gpu.f16(0); }\n';
  subject.cudaJsAdapter.operationRequirements[0].bindings.find(({ parameter }) => parameter === 'output').source.view = {
    dtype: 'f16', byteOffset: '2', elementCount: '4',
  };
  return subject;
}

function addPublicViews(fake, { closeError = false } = {}) {
  const originalOpen = fake.cudaJs.openCudaRuntime.bind(fake.cudaJs);
  fake.cudaJs.openCudaRuntime = async (options) => {
    const runtime = await originalOpen(options);
    const originalAllocate = runtime.allocateDevice.bind(runtime);
    runtime.allocateDevice = async (allocation) => {
      const memory = await originalAllocate(allocation);
      memory.view = async (view) => {
        fake.calls.push(['memory.view', view]);
        return {
          kind: 'device-view', dtype: view.dtype, byteOffset: view.byteOffset ?? 0,
          elementCount: view.elementCount, byteLength: view.elementCount * 2, access: view.access, state: 'open',
          async close() {
            fake.calls.push(['view.close']);
            if (closeError) throw Object.assign(new Error('view close failed'), { code: 'CUDA_JS_VIEW_CLOSE_FAILED', category: 'cleanup', operation: 'view.close' });
            return { state: 'closed' };
          },
        };
      };
      return memory;
    };
    return runtime;
  };
  return fake;
}

const fake = addPublicViews(publicCudaJsFake());
const execution = await prepareCudaJsExecution(viewedPackage(), { cudaJs: fake.cudaJs, peer: PEER });
const compile = call(fake, 'compileDeviceProgram');
assert.equal(compile[2].compile.headerProfile, 'cuda-device', 'dense + publication source must select the public combined header profile');
assert.deepEqual(call(fake, 'memory.view')[1], { dtype: 'f16', byteOffset: 2, elementCount: 4, access: 'write' });
await execution.ignite();
const submit = call(fake, 'function.submit')[1];
assert.equal(submit.arguments[0].kind, 'device-view');
assert.deepEqual(submit.accesses.find(({ argumentIndex }) => argumentIndex === 0), { argumentIndex: 0, byteOffset: 0, byteLength: 8, mode: 'write' });
await execution.wait();
const report = await execution.close();
assert.equal(report.status, 'complete');
const successfulNames = fake.calls.map(([name]) => name);
assert(successfulNames.indexOf('view.close') < successfulNames.indexOf('memory.close'));
assert(successfulNames.indexOf('memory.close') < successfulNames.indexOf('runtime.close'));

const missingCapability = publicCudaJsFake();
await assert.rejects(
  () => prepareCudaJsExecution(viewedPackage(), { cudaJs: missingCapability.cudaJs, peer: PEER }),
  (error) => error?.code === 'CUDA_JS_ADAPTER_CAPABILITY' && error?.phase === 'allocation' && error?.classification === 'unsupported-capability',
);

const failing = addPublicViews(publicCudaJsFake(), { closeError: true });
const failingExecution = await prepareCudaJsExecution(viewedPackage(), { cudaJs: failing.cudaJs, peer: PEER });
await failingExecution.ignite();
await failingExecution.wait();
const failingReport = await failingExecution.close();
assert.equal(failingReport.status, 'quarantined');
assert(failingReport.failures.some(({ label }) => label === 'view:output'));
assert(failingReport.retained.includes('view:output'));
assert(failingReport.retained.includes('memory:resource.output'));
assert(failingReport.retained.includes('runtime'));
assert.equal(calls(failing, 'memory.close').length, 0, 'parent memory must remain retained when a child view cannot close');
assert.equal(calls(failing, 'runtime.close').length, 0, 'runtime must remain retained when a child view cannot close');

const malformed = viewedPackage();
malformed.cudaJsAdapter.operationRequirements[0].bindings.find(({ parameter }) => parameter === 'output').source.view.byteOffset = '1';
await assert.rejects(
  () => prepareCudaJsExecution(malformed, { cudaJs: addPublicViews(publicCudaJsFake()).cudaJs, peer: PEER }),
  (error) => error?.code === 'CUDA_JS_ADAPTER_PACKAGE' && error?.phase === 'admission',
);

console.log('cuda_js_resource_views=pass public-view=exact dense-header=cuda-device access=view-relative cleanup=child-before-parent quarantine=retained');

#!/usr/bin/env node
import assert from 'node:assert/strict';

import { CudaJsRuntimeAdapterError, prepareCudaJsExecution } from '../../adapters/runtimes/cuda-js/index.mjs';
import { PEER, calls, executionPackage, publicCudaJsFake } from './src/fixture.mjs';

function closeError(code, operation) {
  return Object.assign(new Error(code), {
    code,
    category: 'cleanup',
    operation,
    healthBefore: 'healthy',
    healthAfter: 'restart-required',
    details: { source: 'cleanup-dependency-falsifier' },
  });
}

function failingClosePort(stage) {
  const fake = publicCudaJsFake(stage === 'operation' ? { operationCloseError: closeError('CUDA_JS_OPERATION_CLOSE_FAILED', 'operation.close') } : {});
  const open = fake.cudaJs.openCudaRuntime.bind(fake.cudaJs);
  fake.cudaJs.openCudaRuntime = async (options) => {
    const runtime = await open(options);
    if (stage === 'runtime') {
      runtime.close = async () => {
        fake.calls.push(['runtime.close']);
        throw closeError('CUDA_JS_RUNTIME_CLOSE_FAILED', 'runtime.close');
      };
    }

    const allocateDevice = runtime.allocateDevice.bind(runtime);
    runtime.allocateDevice = async (options2) => {
      const memory = await allocateDevice(options2);
      if (stage === 'memory') {
        memory.close = async () => {
          fake.calls.push(['memory.close', 'forced']);
          throw closeError('CUDA_JS_MEMORY_CLOSE_FAILED', 'memory.close');
        };
      }
      return memory;
    };

    const createPublicationMailbox = runtime.createPublicationMailbox.bind(runtime);
    runtime.createPublicationMailbox = async (options2) => {
      const mailbox = await createPublicationMailbox(options2);
      if (stage === 'mailbox') {
        mailbox.close = async () => {
          fake.calls.push(['mailbox.close', 'forced']);
          throw closeError('CUDA_JS_MAILBOX_CLOSE_FAILED', 'mailbox.close');
        };
      }
      return mailbox;
    };

    const loadModule = runtime.loadModule.bind(runtime);
    runtime.loadModule = async (options2) => {
      const module = await loadModule(options2);
      if (stage === 'module') {
        module.close = async () => {
          fake.calls.push(['module.close']);
          throw closeError('CUDA_JS_MODULE_CLOSE_FAILED', 'module.close');
        };
      }
      const getFunction = module.getFunction.bind(module);
      module.getFunction = async (options3) => {
        const fn = await getFunction(options3);
        if (stage === 'function') {
          fn.close = async () => {
            fake.calls.push(['function.close']);
            throw closeError('CUDA_JS_FUNCTION_CLOSE_FAILED', 'function.close');
          };
        }
        return fn;
      };
      return module;
    };
    return runtime;
  };
  return fake;
}

async function preparedForClose(fake) {
  const prepared = await prepareCudaJsExecution(executionPackage(), { cudaJs: fake.cudaJs, peer: PEER });
  await prepared.ignite();
  return prepared;
}

{
  const fake = failingClosePort('operation');
  const prepared = await preparedForClose(fake);
  const report = await prepared.close();
  assert.equal(report.status, 'quarantined');
  for (const label of ['operation', 'function', 'module', 'mailbox:sideband.framework-cancellation', 'memory:resource.output', 'runtime']) {
    assert(report.retained.includes(label), `operation close failure must retain ${label}`);
  }
  assert.equal(calls(fake, 'operation.close').length, 1);
  assert.equal(calls(fake, 'function.close').length, 0);
  assert.equal(calls(fake, 'module.close').length, 0);
  assert.equal(calls(fake, 'mailbox.close').length, 0);
  assert.equal(calls(fake, 'memory.close').length, 0);
  assert.equal(calls(fake, 'runtime.close').length, 0);
  const repeated = await prepared.close();
  assert.equal(repeated.status, 'quarantined');
  assert.equal(repeated.repeated, true);
  assert.deepEqual(repeated.retained, report.retained);
  assert.equal(calls(fake, 'operation.close').length, 1, 'failed operation disposal must not be retried implicitly');
}

for (const [stage, retainedLabels, forbiddenCall, allowedCalls] of [
  ['function', ['function', 'module', 'runtime'], 'module.close', ['mailbox.close', 'memory.close']],
  ['module', ['module', 'runtime'], 'runtime.close', ['function.close', 'mailbox.close', 'memory.close']],
  ['mailbox', ['mailbox:sideband.framework-cancellation', 'runtime'], 'runtime.close', ['function.close', 'module.close', 'memory.close']],
  ['memory', ['memory:resource.output', 'runtime'], 'runtime.close', ['function.close', 'module.close', 'mailbox.close']],
  ['runtime', ['runtime'], null, ['function.close', 'module.close', 'mailbox.close', 'memory.close']],
]) {
  const fake = failingClosePort(stage);
  const prepared = await preparedForClose(fake);
  const report = await prepared.close();
  assert.equal(report.status, 'quarantined', stage);
  for (const label of retainedLabels) assert(report.retained.includes(label), `${stage} close failure must retain ${label}`);
  if (forbiddenCall) assert.equal(calls(fake, forbiddenCall).length, 0, `${stage} failure must not close ${forbiddenCall} underneath it`);
  for (const name of allowedCalls) assert(calls(fake, name).length > 0, `${stage} failure may still close independent ${name}`);
  const repeated = await prepared.close();
  assert.equal(repeated.status, 'quarantined');
  assert.equal(repeated.repeated, true);
}

{
  const fake = publicCudaJsFake({ readCloseError: closeError('CUDA_JS_READ_CLOSE_FAILED', 'memory.readAsync.close') });
  const prepared = await prepareCudaJsExecution(executionPackage(), { cudaJs: fake.cudaJs, peer: PEER });
  await prepared.ignite();
  await prepared.wait();
  let caught = null;
  try {
    await prepared.deliver('delivery.terminal-output');
  } catch (error) {
    caught = error;
  }
  assert(caught instanceof CudaJsRuntimeAdapterError);
  assert.equal(caught.code, 'CUDA_JS_ADAPTER_DELIVERY_CLEANUP');
  assert.equal(calls(fake, 'transfer.close').length, 1);
  const report = await prepared.close();
  assert.equal(report.status, 'quarantined');
  assert(report.retained.includes('delivery-operation:delivery.terminal-output:0'));
  assert(report.retained.includes('memory:resource.output'));
  assert(report.retained.includes('runtime'));
  assert.equal(calls(fake, 'transfer.close').length, 1, 'failed transfer disposal must not be retried by execution cleanup');
  assert.equal(calls(fake, 'memory.close').length, 0);
  assert.equal(calls(fake, 'runtime.close').length, 0);
}

console.log('cuda_js_cleanup_dependency=pass child_before_parent=proved failed_disposal_retry=absent repeated_quarantine=stable');

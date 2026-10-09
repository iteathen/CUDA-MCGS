import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareCudaJsExecution} from '../../adapters/runtimes/cuda-js/index.mjs';
import {continuationFake,initializedContinuationPackage,continuationPeer} from './src/continuation-fixture.mjs';
import {calls} from './src/fixture.mjs';
test('bounded cold GPU admission completes and closes before one continuation ignition',async()=>{
  const fake=continuationFake({readBytes:new Uint8Array(16)}),prepared=await prepareCudaJsExecution(initializedContinuationPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer});
  await prepared.ignite({resources:{'resource.output':new Uint8Array(4)}});
  assert.equal(calls(fake,'function.submit').length,1);assert.equal(calls(fake,'runtime.submitDeviceContinuation').length,1);
  const names=fake.calls.map(c=>c[0]);assert(names.indexOf('external.close')<names.indexOf('runtime.submitDeviceContinuation'));assert(names.indexOf('transfer.close')<names.indexOf('runtime.submitDeviceContinuation'));
  prepared.publish('sideband-0',1);await prepared.wait();assert.equal((await prepared.close()).status,'complete');
});
test('failed cold readiness never launches active continuation and cleans owned resources',async()=>{
  const fake=continuationFake({readBytes:Uint8Array.from([1,...new Uint8Array(15)])}),prepared=await prepareCudaJsExecution(initializedContinuationPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer});
  await assert.rejects(()=>prepared.ignite({resources:{'resource.output':new Uint8Array(4)}}),error=>error.code==='CUDA_JS_ADAPTER_INITIALIZATION');
  assert.equal(calls(fake,'runtime.submitDeviceContinuation').length,0);assert.equal((await prepared.close()).status,'complete');
});
test('out-of-view cold success field and controller-as-initializer fail before runtime open',async()=>{
  for(const change of [p=>p.cudaJsAdapter.continuation.initializationOperations[0].readiness.success.wordOffset='4',p=>p.cudaJsAdapter.operationRequirements[3].function='continuation_step']){
    const p=initializedContinuationPackage();change(p);const fake=continuationFake();await assert.rejects(()=>prepareCudaJsExecution(p,{cudaJs:fake.cudaJs,peer:continuationPeer}));assert.equal(calls(fake,'openCudaRuntime').length,0);
  }
});

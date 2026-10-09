import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareCudaJsExecution} from '../../adapters/runtimes/cuda-js/index.mjs';
import {continuationFake,stagedColdPackage,continuationPeer} from './src/continuation-fixture.mjs';
import {calls} from './src/fixture.mjs';

test('cold storage preinitialization performs no bootstrap or ignition; only declared small input stages later',async()=>{
 const fake=continuationFake({readBytes:new Uint8Array(16)}),p=await prepareCudaJsExecution(stagedColdPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer});
 const input=new Uint8Array(4);
 await p.preinitialize({resources:{'resource.output':new Uint8Array(4),'resource.root-input':input}});
 input[0]=99;
 assert.equal(p.state,'prepared');assert.equal(calls(fake,'function.submit').length,0);assert.equal(calls(fake,'runtime.submitDeviceContinuation').length,0);
 const writes=calls(fake,'memory.write').length;
 await p.ignite({initializationParameters:{'operation-bootstrap':{input:Uint8Array.of(5,0,0,0)}}});
 assert.equal(calls(fake,'memory.write').length,writes,'large cold images must not be rewritten at ignition');
 assert.equal(calls(fake,'memory.writeAsync').length,1);assert.equal(calls(fake,'function.submit').length,1);assert.equal(calls(fake,'runtime.submitDeviceContinuation').length,1);
 p.publish('sideband-0',1);await p.wait();assert.equal((await p.close()).status,'complete');
});
test('preinitialized storage cannot be substituted; cold staged aliases, zero views and immutable content fail before new writes',async()=>{
 const fake=continuationFake(),p=await prepareCudaJsExecution(stagedColdPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer});
 await p.preinitialize({resources:{'resource.output':new Uint8Array(4),'resource.root-input':new Uint8Array(4)}});
 const writes=calls(fake,'memory.write').length;
 for(const inputs of [
  {resources:{'resource.output':new Uint8Array(4)}},
  {initializationParameters:{'operation-observer':{out:new Uint8Array(4)}}},
  {initializationParameters:{'operation-bootstrap':{state:new Uint8Array(4)}}},
  {initializationParameters:{'operation-bootstrap':{input:new Uint8Array(3)}}},
 ])await assert.rejects(()=>p.ignite(inputs),error=>['CUDA_JS_ADAPTER_INPUT','CUDA_JS_ADAPTER_STATE'].includes(error.code));
 assert.equal(calls(fake,'memory.write').length,writes);assert.equal(calls(fake,'memory.writeAsync').length,0);assert.equal(calls(fake,'function.submit').length,0);
 assert.equal((await p.close()).status,'complete');
});
test('cold zero validation yields to the event loop and remains strict before any device write',async()=>{
 const pkg=stagedColdPackage(),a=pkg.cudaJsAdapter,n=2*1024*1024;
 a.resourceRequirements.find(r=>r.id==='resource.root-input').byteLength=String(n);
 const input=a.operationRequirements.find(o=>o.function==='continuation_boot').bindings.find(b=>b.parameter==='input');input.source.view.elementCount=String(n/4);input.source.initialization='zero';
 const fake=continuationFake(),p=await prepareCudaJsExecution(pkg,{cudaJs:fake.cudaJs,peer:continuationPeer});
 let progressed=false;setImmediate(()=>{progressed=true;});
 const invalid=new Uint8Array(n);invalid[n-1]=1;
 await assert.rejects(()=>p.preinitialize({resources:{'resource.output':new Uint8Array(4),'resource.root-input':invalid}}),error=>error.code==='CUDA_JS_ADAPTER_INPUT');
 assert.equal(progressed,true);assert.equal(calls(fake,'memory.write').length,0);assert.equal(p.state,'prepared');
 assert.equal((await p.close()).status,'complete');
});
test('pending preinitialization owns its storage lease and snapshots caller bytes before yielding',async()=>{
 const n=256*1024,pkg=stagedColdPackage({zeroBytes:n}),fake=continuationFake(),p=await prepareCudaJsExecution(pkg,{cudaJs:fake.cudaJs,peer:continuationPeer});
 const zero=new Uint8Array(n),pending=p.preinitialize({resources:{'resource.output':new Uint8Array(4),'resource.root-input':new Uint8Array(4),'resource.cold-zero':zero}});
 zero[n-1]=1;
 await assert.rejects(()=>p.close(),error=>error.code==='CUDA_JS_ADAPTER_STATE');
 await assert.rejects(()=>p.ignite(),error=>error.code==='CUDA_JS_ADAPTER_STATE');
 await pending;
 assert.equal(calls(fake,'function.submit').length,0);assert.equal(calls(fake,'runtime.submitDeviceContinuation').length,0);
 await assert.rejects(()=>p.ignite({initializationParameters:{'operation-bootstrap':{workspace:new Uint8Array(n)}}}),error=>error.code==='CUDA_JS_ADAPTER_INPUT');
 assert.equal(calls(fake,'memory.writeAsync').length,0);
 assert.equal((await p.close()).status,'complete');
});
test('preinitialization write failure closes all owned public resources before any kernel',async()=>{
 const fake=continuationFake({writeError:true}),p=await prepareCudaJsExecution(stagedColdPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer});
 await assert.rejects(()=>p.preinitialize({resources:{'resource.output':new Uint8Array(4),'resource.root-input':new Uint8Array(4)}}),error=>error.code==='CUDA_JS_ADAPTER_ALLOCATION'&&error.cleanup.status==='complete');
 assert.equal(p.state,'closed');assert.equal(calls(fake,'function.submit').length,0);assert.equal(calls(fake,'runtime.submitDeviceContinuation').length,0);
 assert.equal((await p.close()).status,'complete');
});

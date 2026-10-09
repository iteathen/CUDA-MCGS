import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareCudaJsExecution } from '../../adapters/runtimes/cuda-js/index.mjs';
import { continuationFake, continuationPackage, continuationPeer } from './src/continuation-fixture.mjs';
import { calls } from './src/fixture.mjs';
test('declared DAG uses one continuation operation, linked cubin and profile-scoped constraints',async()=>{
  const fake=continuationFake();const execution=await prepareCudaJsExecution(continuationPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer});
  assert.equal(calls(fake,'runtime.loadModule')[0][1].format,'cubin');
  const controller=calls(fake,'module.getFunction').find(call=>call[1].name==='kernel_continuation_step');assert.equal(controller[1].executionProfile,'device-continuation-v1');
  await execution.ignite({resources:{'resource.output':new Uint8Array(4)}});
  assert.equal(calls(fake,'runtime.submitDeviceContinuation').length,1);assert.equal(calls(fake,'function.submit').length,0);
  const request=calls(fake,'runtime.submitDeviceContinuation')[0][1];assert.equal(request.nodes.length,2);assert.equal(request.continuationNode,'operation-controller');
  assert.equal(request.nodes[0].accesses[0].mode,'atomic-update-relaxed-device');assert.equal(request.nodes[1].accesses[0].mode,'atomic-observe-relaxed-device');
  assert(Object.values(request.bindings).some(binding=>binding.kind==='publication-mailbox'));
  execution.publish('sideband-0',1);await execution.wait();assert.equal((await execution.close()).status,'complete');
});
test('only declared external observer submits and delivers its own exact range while main pending',async()=>{
  const fake=continuationFake();const execution=await prepareCudaJsExecution(continuationPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer});
  await execution.ignite({resources:{'resource.output':new Uint8Array(4)}});
  await assert.rejects(()=>execution.submitExternal('operation-body'),error=>error.code==='CUDA_JS_ADAPTER_INPUT');
  const child=await execution.submitExternal('operation-observer');await child.wait();const output=await child.deliver();assert.equal(output.bytes.byteLength,4);
  await assert.rejects(()=>child.deliver(),error=>error.code==='CUDA_JS_ADAPTER_STATE');
  assert.equal((await execution.status()).operation.status,'pending');await child.close();
  execution.publish('sideband-0',1);await execution.wait();assert.equal((await execution.close()).status,'complete');
});
test('profile mismatch and unsafe shared external ranges fail before opening runtime',async()=>{
  for(const mode of ['profile','ordinary-shared']) {
    const value=continuationPackage();const source=value.cudaJsAdapter.operationRequirements[2].bindings[0].source;
    if(mode==='ordinary-shared')delete source.deviceEffects;
    const fake=continuationFake({missingControllerProfile:mode==='profile'});
    await assert.rejects(()=>prepareCudaJsExecution(value,{cudaJs:fake.cudaJs,peer:continuationPeer}));assert.equal(calls(fake,'openCudaRuntime').length,0);
  }
});
test('unproved observer transfer cleanup blocks further submission and retains backing ownership',async()=>{
  const fake=continuationFake({readCloseError:true});const execution=await prepareCudaJsExecution(continuationPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer});
  await execution.ignite({resources:{'resource.output':new Uint8Array(4)}});const child=await execution.submitExternal('operation-observer');await child.wait();
  await assert.rejects(()=>child.deliver(),error=>error.code==='CUDA_JS_ADAPTER_DELIVERY_CLEANUP');await child.close();
  await assert.rejects(()=>execution.submitExternal('operation-observer'),error=>error.code==='CUDA_JS_ADAPTER_STATE');
  execution.publish('sideband-0',1);await execution.wait();const report=await execution.close();assert.equal(report.status,'quarantined');assert(report.retained.includes('memory:resource.sample'));assert.equal(calls(fake,'runtime.close').length,0);
});
test('invalid controller or graph cycle is rejected before lower mutation',async()=>{
  for(const mutate of [p=>p.cudaJsAdapter.continuation.nodes[0].after.push('operation-controller'),p=>p.cudaJsAdapter.operationRequirements[1].launchPolicy.block[0]='32']) {
    const value=continuationPackage();mutate(value);const fake=continuationFake();await assert.rejects(()=>prepareCudaJsExecution(value,{cudaJs:fake.cudaJs,peer:continuationPeer}));assert.equal(calls(fake,'openCudaRuntime').length,0);
  }
});
test('external staging is fixed-range and cannot write a shared primary range',async()=>{
  const fake=continuationFake();const execution=await prepareCudaJsExecution(continuationPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer});await execution.ignite({resources:{'resource.output':new Uint8Array(4)}});
  for(const parameters of [{state:new Uint8Array(4)},{out:new Uint8Array(5)},{absent:new Uint8Array(4)}])await assert.rejects(()=>execution.submitExternal('operation-observer',{parameters}),error=>error.code==='CUDA_JS_ADAPTER_INPUT');
  assert.equal(calls(fake,'memory.writeAsync').length,0);
  const child=await execution.submitExternal('operation-observer',{parameters:{out:new Uint8Array([1,2,3,4])}});assert.deepEqual(calls(fake,'memory.writeAsync')[0][2],{deviceOffset:0});assert.equal(calls(fake,'stage.close').length,1);await child.wait();await child.close();execution.publish('sideband-0',1);await execution.wait();assert.equal((await execution.close()).status,'complete');
});
test('parent and child close remain blocked through transfer cleanup',async()=>{
  let entered,release;const started=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve);
  const fake=continuationFake({beforeReadClose:async()=>{entered();await gate;}});const execution=await prepareCudaJsExecution(continuationPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer});await execution.ignite({resources:{'resource.output':new Uint8Array(4)}});
  const child=await execution.submitExternal('operation-observer');await child.wait();const pending=child.deliver();await started;
  await assert.rejects(()=>child.close(),error=>error.code==='CUDA_JS_ADAPTER_STATE');await assert.rejects(()=>execution.close(),error=>error.code==='CUDA_JS_ADAPTER_STATE');release();await pending;await child.close();execution.publish('sideband-0',1);await execution.wait();assert.equal((await execution.close()).status,'complete');
});
test('unproved external GPU cleanup retains full continuation dependency chain without retry',async()=>{
  const fake=continuationFake({externalCloseError:true});const execution=await prepareCudaJsExecution(continuationPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer});await execution.ignite({resources:{'resource.output':new Uint8Array(4)}});
  const child=await execution.submitExternal('operation-observer');await child.wait();await assert.rejects(()=>child.close(),error=>error.code==='CUDA_JS_ADAPTER_EXTERNAL_CLEANUP');
  execution.publish('sideband-0',1);await execution.wait();const report=await execution.close();assert.equal(report.status,'quarantined');assert(report.retained.includes('module'));assert(report.retained.includes('memory:resource.output'));assert.equal(calls(fake,'external.close').length,1);for(const name of ['operation.close','function.close','module.close','memory.close','runtime.close'])assert.equal(calls(fake,name).length,0);assert.equal((await execution.close()).status,'quarantined');
});
test('unproved staged transfer blocks kernel submission and retains memory/runtime',async()=>{
  const fake=continuationFake({stageCloseError:true});const execution=await prepareCudaJsExecution(continuationPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer});await execution.ignite({resources:{'resource.output':new Uint8Array(4)}});
  await assert.rejects(()=>execution.submitExternal('operation-observer',{parameters:{out:new Uint8Array(4)}}),error=>error.code==='CUDA_JS_ADAPTER_EXTERNAL_CLEANUP');assert.equal(calls(fake,'function.submit').length,0);await assert.rejects(()=>execution.submitExternal('operation-observer'),error=>error.code==='CUDA_JS_ADAPTER_STATE');
  execution.publish('sideband-0',1);await execution.wait();assert.equal((await execution.close()).status,'quarantined');assert.equal(calls(fake,'stage.close').length,1);assert.equal(calls(fake,'runtime.close').length,0);
});
test('shared exact canonical atlas bindings consume unique slots across many DAG arguments',async()=>{
  const p=continuationPackage(),a=p.cudaJsAdapter,body=a.operationRequirements[0],fn=a.searchProgram.functions[0];
  for(const name of ['aliasOne','aliasTwo']){fn.parameters.push({name,type:'ptr<u32>'});body.bindings.push({...structuredClone(body.bindings[0]),parameter:name});}
  const copies=Array.from({length:30},(_,i)=>({...structuredClone(body),id:`operation-body-${i}`}));a.operationRequirements=[...copies,...a.operationRequirements.slice(1)];
  a.continuation.nodes=copies.map((op,i)=>({operation:op.id,after:i?[copies[i-1].id]:[]}));a.continuation.nodes.push({operation:'operation-controller',after:[copies.at(-1).id]});
  const fake=continuationFake(),prepared=await prepareCudaJsExecution(p,{cudaJs:fake.cudaJs,peer:continuationPeer});await prepared.ignite({resources:{'resource.output':new Uint8Array(4)}});
  const request=calls(fake,'runtime.submitDeviceContinuation')[0][1];assert.equal(request.nodes.reduce((n,node)=>n+node.arguments.length,0),92);assert.equal(Object.keys(request.bindings).length,3);assert.equal(calls(fake,'memory.view').length,3);
  prepared.publish('sideband-0',1);await prepared.wait();assert.equal((await prepared.close()).status,'complete');
});

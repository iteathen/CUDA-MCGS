import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {prepareCudaJsExecution} from '../../adapters/runtimes/cuda-js/index.mjs';
import {continuationFake,continuationPackage,initializedContinuationPackage,continuationPeer} from './src/continuation-fixture.mjs';
import {calls} from './src/fixture.mjs';
function describing(flags={}){
 const fake=continuationFake(flags),open=fake.cudaJs.openCudaRuntime;
 fake.cudaJs.openCudaRuntime=async options=>{const runtime=await open(options);runtime.describe=async()=>{fake.calls.push(['runtime.describe']);return{schemaVersion:1,device:{name:'portable-device',ordinal:0},execution:{maxPendingGpuOperations:2}};};return runtime;};return fake;
}
test('read-only description records actual preparation artifacts without implying ignition',async()=>{
 const fake=describing(),prepared=await prepareCudaJsExecution(continuationPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer}),record=await prepared.describe();
 assert.equal(record.schema,'cuda-mcgs.cuda-js-execution-description/0.1.0');assert.equal(record.state,'prepared');assert.equal(record.admission.realization,'prepared');assert.equal(record.initialization.state,'not-started');assert.deepEqual(record.admission.peer,continuationPeer);assert.equal(record.runtime.device.name,'portable-device');
 assert.equal(record.admission.compilation.loadArtifact.sha256,createHash('sha256').update(Uint8Array.from([1,2,3])).digest('hex'));assert.equal(record.admission.compilation.loadArtifact.byteLength,3);assert.match(record.admission.executionPackage.sha256,/^[0-9a-f]{64}$/);
 assert.equal(calls(fake,'function.submit').length,0);assert.equal(calls(fake,'runtime.submitDeviceContinuation').length,0);assert(!JSON.stringify(record).includes('"bytes"'));assert(!JSON.stringify(record).includes('function continuation_body'));
 assert.equal((await prepared.close()).status,'complete');await assert.rejects(()=>prepared.describe());assert.equal(calls(fake,'runtime.describe').length,1);
});
test('description does not release parent ownership while its public read is pending',async()=>{
 const fake=describing(),open=fake.cudaJs.openCudaRuntime;let release,started;const entered=new Promise(resolve=>started=resolve),held=new Promise(resolve=>release=resolve);
 fake.cudaJs.openCudaRuntime=async options=>{const runtime=await open(options);runtime.describe=async()=>{started();await held;return{schemaVersion:1};};return runtime;};
 const prepared=await prepareCudaJsExecution(continuationPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer}),pending=prepared.describe();await entered;await assert.rejects(()=>prepared.close());await assert.rejects(()=>prepared.describe());assert.equal(calls(fake,'runtime.close').length,0);release();await pending;assert.equal((await prepared.close()).status,'complete');
});
test('binary or over-budget public runtime diagnostics cannot leak into an admission record',async()=>{
 for(const result of [{raw:new Uint8Array(4)},{huge:'x'.repeat(262145)}]){const fake=describing(),open=fake.cudaJs.openCudaRuntime;fake.cudaJs.openCudaRuntime=async options=>{const runtime=await open(options);runtime.describe=async()=>result;return runtime;};const prepared=await prepareCudaJsExecution(continuationPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer});await assert.rejects(()=>prepared.describe(),error=>error.code==='CUDA_JS_ADAPTER_DESCRIPTION');assert.equal((await prepared.close()).status,'complete');}
});
test('ignite delivers only copied declared cold readiness and description distinguishes initialization',async()=>{
 const bytes=new Uint8Array(16),view=new DataView(bytes.buffer);view.setUint32(4,42,true);view.setUint32(8,7,true);view.setUint32(12,9,true);
 const fake=describing({readBytes:bytes}),prepared=await prepareCudaJsExecution(initializedContinuationPackage(),{cudaJs:fake.cudaJs,peer:continuationPeer});
 const result=await prepared.ignite({resources:{'resource.output':new Uint8Array(4)}});assert.equal(result.initializationResults.length,1);const ready=result.initializationResults[0];assert.equal(ready.operation,'operation-bootstrap');assert.equal(ready.resource,'resource.bootstrap');assert.deepEqual(ready.view,{dtype:'u32',byteOffset:'0',elementCount:'4'});assert.deepEqual(ready.bytes,bytes);assert.notStrictEqual(ready.bytes,bytes);
 const record=await prepared.describe();assert.equal(record.initialization.state,'completed');assert.equal(record.initialization.operationCount,1);assert.equal(record.state,'running');assert(!JSON.stringify(record).includes('"bytes"'));
 prepared.publish('sideband-0',1);await prepared.wait();assert.equal((await prepared.close()).status,'complete');
});

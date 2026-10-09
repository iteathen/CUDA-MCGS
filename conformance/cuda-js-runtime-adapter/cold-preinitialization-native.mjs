import assert from 'node:assert/strict';
import {prepareCudaJsExecution} from '../../adapters/runtimes/cuda-js/index.mjs';
import {stagedColdPackage,continuationPeer} from './src/continuation-fixture.mjs';
export async function qualifyColdPreinitialization(peer){
 let runtime,execution;
 const cudaJs=new Proxy(peer,{get(target,key){if(key==='openCudaRuntime')return async options=>{runtime=await target.openCudaRuntime(options);return runtime;};return target[key];}});
 const zeroBytes=66_389_048,zero=new Uint8Array(zeroBytes);zero[zero.length-1]=1;
 const resources={'resource.output':new Uint8Array(4),'resource.root-input':new Uint8Array(4),'resource.cold-zero':zero};
 try{
  execution=await prepareCudaJsExecution(stagedColdPackage({zeroBytes}),{cudaJs,peer:continuationPeer,runtimeOptions:{driver:{memory:{maxDeviceBytes:128*1024*1024,maxAllocationBytes:64*1024*1024,maxTransferBytes:64*1024*1024},execution:{maxPendingGpuOperations:2}}}});
  await assert.rejects(()=>execution.preinitialize({resources}),error=>error.code==='CUDA_JS_ADAPTER_INPUT');
  assert.equal((await execution.describe()).initialization.state,'not-started');zero[zero.length-1]=0;
  let ticks=0;const heartbeat=setInterval(()=>ticks++,1);
  let preinitialized;try{preinitialized=await execution.preinitialize({resources});}finally{clearInterval(heartbeat);}
  assert(ticks>0,'large validation must yield');assert.equal(preinitialized.ignition,'not-performed');
  const cold=await execution.describe();assert.equal(cold.state,'prepared');assert.equal(cold.initialization.state,'not-started');
  await assert.rejects(()=>execution.ignite({resources}),error=>error.code==='CUDA_JS_ADAPTER_INPUT');
  const started=performance.now();
  await execution.ignite({initializationParameters:{'operation-bootstrap':{input:Uint8Array.of(5,0,0,0)}}});
  const ignitionMilliseconds=performance.now()-started;
  const child=await execution.submitExternal('operation-observer',{});let observed;
  try{await child.wait();const copy=await child.deliver();observed=new DataView(copy.bytes.buffer,copy.bytes.byteOffset,4).getUint32(0,true);}finally{await child.close();}
  assert(observed>=5&&observed<1000000);execution.publish('sideband-0',1);await execution.wait();
  const description=await runtime.describe();assert.equal(description.execution.deviceContinuation.hostLaunches,1);
  const cleanup=await execution.close();assert.equal(cleanup.status,'complete');assert.equal(cleanup.runtime.driver.resourceCounts.live,0);assert.equal(cleanup.runtime.driver.resourceCounts.orphaned,0);
  return {scope:'generic-public-cold-storage-initialization-not-engine-clock-proof',node:process.version,zeroBytes,invalidZeroRejected:true,preinitializedStorageSubstitutionRejected:true,heartbeatTicks:ticks,preinitialized,ignitionMilliseconds,onlySmallDeclaredInputStaged:true,observed,graph:description.execution.deviceContinuation,cleanup};
 }finally{if(execution){if((await execution.status()).state==='running'){execution.publish('sideband-0',1);await execution.wait();}await execution.close();}else if(runtime)await runtime.close();}
}

import assert from 'node:assert/strict';
import {prepareCudaJsExecution} from '../../adapters/runtimes/cuda-js/index.mjs';
import {continuationPackage,continuationPeer} from './src/continuation-fixture.mjs';

// Explicit generic counter scaffold, not a Compiler-produced resident search
// package. This proves public adapter realization and finite cleanup only.
export async function qualifyDeviceContinuation(peer) {
let runtime,execution;
const cudaJs=new Proxy(peer,{get(target,key){if(key==='openCudaRuntime')return async options=>{runtime=await target.openCudaRuntime(options);return runtime;};return target[key];}});
try {
  execution=await prepareCudaJsExecution(continuationPackage(),{cudaJs,peer:continuationPeer});
  await execution.ignite({resources:{'resource.output':new Uint8Array(4)}});
  const child=await execution.submitExternal('operation-observer',{parameters:{out:new Uint8Array(4)}});
  await child.wait();const copied=await child.deliver();const observed=new DataView(copied.bytes.buffer,copied.bytes.byteOffset,4).getUint32(0,true);
  assert(observed>0&&observed<1000000);assert.equal((await execution.status()).operation.status,'pending');
  await child.close();execution.publish('sideband-0',1);await execution.wait();
  const finalBytes=(await execution.deliver('delivery.terminal-output')).bytes;
  const final=new DataView(finalBytes.buffer,finalBytes.byteOffset,4).getUint32(0,true);assert(final>=observed&&final<1000000);
  const description=await runtime.describe();assert.equal(description.execution.deviceContinuation.hostLaunches,1);
  console.log(JSON.stringify({scope:'generic-counter-mechanical-adapter-only',node:process.version,peer:continuationPeer,bodyBlock:32,controllerBlock:1,finiteRoundBound:1000000,observed,final,externalOwnedStagingWhilePrimaryPending:true,observerCopiedWhilePrimaryPending:true,graph:description.execution.deviceContinuation}));
} finally {
  if(execution){
    const status=await execution.status();if(status.state==='running'){execution.publish('sideband-0',1);await execution.wait();}
    const report=await execution.close();assert.equal(report.status,'complete');assert.equal(report.runtime.graceful,true);assert.equal(report.runtime.driver.resourceCounts.live,0);assert.equal(report.runtime.driver.resourceCounts.orphaned,0);
    console.log(JSON.stringify({scope:'generic-counter-mechanical-adapter-only',cleanup:report}));
  }
}
}

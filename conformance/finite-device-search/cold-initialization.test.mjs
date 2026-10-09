import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDeviceContinuation,projectDeviceContinuation} from '../../components/search-compiler/src/device-continuation.mjs';
const profile={functions:[{name:'controller',executionProfile:'device-continuation-v1'},{name:'bootstrap'}],resources:[{id:'r.bootstrap',materialization:'resident-storage',capacity:'64'}],operations:[{id:'op.controller',entryPoint:'controller',grid:['1','1','1'],block:['1','1','1'],bindings:[]},{id:'op.bootstrap',entryPoint:'bootstrap',grid:['1','1','1'],block:['1','1','1'],bindings:[{source:{kind:'resource',resource:'r.bootstrap',access:'write',view:{dtype:'u32',byteOffset:'16',elementCount:'4'}}}]}]};
const input={contract:'cuda-mcgs.device-continuation/0.1.0',nodes:[{operation:'op.controller',after:[]}],controllerOperation:'op.controller',initializationOperations:[{operation:'op.bootstrap',readiness:{resource:'r.bootstrap',view:{dtype:'u32',byteOffset:'16',elementCount:'4'},success:{wordOffset:'0',value:'0'}}}]};
test('cold root initialization is an exact bounded ordinary operation preceding semantic continuation',()=>{
  const n=normalizeDeviceContinuation(input,profile);assert.deepEqual(n,input);
  const p=projectDeviceContinuation(n,profile.operations,profile.resources);assert.equal(p.initializationOperations[0].operation,'operation-1');assert.equal(p.initializationOperations[0].readiness.resource,'resource-0');
});
test('cold initialization rejects aliases, controller reuse, missing written readiness and out-of-range success fields',()=>{
  for(const mutate of [x=>x.initializationOperations[0].operation='op.controller',x=>x.initializationOperations.push(x.initializationOperations[0]),x=>x.initializationOperations[0].readiness.view.byteOffset='0',x=>x.initializationOperations[0].readiness.success.wordOffset='4',x=>x.initializationOperations[0].readiness.success.value='4294967296']){const x=structuredClone(input);mutate(x);assert.throws(()=>normalizeDeviceContinuation(x,profile));}
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {createTensorEvaluatorConnector,createTensorEvaluatorRuntimeContribution,bindTensorEvaluatorProfileResources} from '../../adapters/evaluators/cuda-js-tensor/index.mjs';

export function toyTensorProgram(){
  const fn={name:'tensorRunItem',returns:'u32',parameters:[{name:'itemIndex',type:'u32'},{name:'features',type:'ptr<f32>'},{name:'scores',type:'ptr<f32>'},{name:'workspace',type:'ptr<f32>'}]};
  const p=fn.parameters.map((x,i)=>({parameterIndex:i,parameterName:x.name,type:x.type,role:i===0?'item-index':i===1?'input':i===2?'output':'workspace',dtype:i===0?'u32':'f32',access:i<2?'read':i===2?'write':'read-write',itemVarying:i!==0,byteLength:i===0?0:128}));
  return {kind:'tensor-device-program',contract:'SPEC-0009-item-parallel-device-tensor-program-v1+SPEC-0009-block32-v1',participation:{kind:'block32',scope:'block',requiredThreads:32,block:{x:32,y:1,z:1},uniformItemIndex:true,uniformCall:true,invocationCountPerParticipant:1},requireParticipation(request){assert.deepEqual(request,{block:{x:32,y:1,z:1},uniformItemIndex:true,uniformCall:true});return this.participation;},itemCapacity:1,function:fn,parameters:p,inputs:[{...p[1],name:'features',spec:{dtype:'f32',dtypeWidth:4,alignment:4},valueId:'toy.features',perItemElements:32,elementCount:32}],outputs:[{...p[2],name:'scores',spec:{dtype:'f32',dtypeWidth:4,alignment:4},valueId:'toy.scores',perItemElements:32,elementCount:32}],workspace:[{...p[3],perItemElements:32,elementCount:32,alignmentBytes:4}],totalWorkspaceBytes:128,compatibilityIdentity:'independent-toy-math-not-model',outputFormat:'ptx',importAs(alias){return {name:fn.name,as:alias,library:{schemaVersion:1,contract:'toy-device-library/0.1.0',sha256:'a'.repeat(64),format:'ptx',architecture:'compute_75',exports:[fn],artifact:{format:'ptx',architecture:'compute_75',sha256:'b'.repeat(64),bytes:new Uint8Array([1]),byteLength:1}}};}};
}
export function collectiveContribution(itemCapacity=1){
  const program=toyTensorProgram();
  if(itemCapacity!==1){program.itemCapacity=itemCapacity;for(const parameter of program.parameters.slice(1))parameter.byteLength*=itemCapacity;for(const role of ['inputs','outputs','workspace'])for(const parameter of program[role]){parameter.byteLength*=itemCapacity;parameter.elementCount*=itemCapacity;}program.totalWorkspaceBytes*=itemCapacity;}
  return createTensorEvaluatorRuntimeContribution(createTensorEvaluatorConnector(program,{requestCapacity:1}),{participation:{kind:'collective-block',blockSize:32}});
}

function hostOracle(c,{failLane=-1,cancelLane=-1}={}){
  const resources=Object.fromEntries([...c.resources,...c.tensorBindings].map(r=>[r.parameterName,Array(r.elementCount).fill(r.dtype==='u64'?0n:0)]));
  const index=x=>Number(x);let waiting=[],arrived=0;const calls=[];
  const barrier=()=>new Promise(resolve=>{waiting.push(resolve);arrived++;if(arrived===32){const release=waiting;waiting=[];arrived=0;for(const r of release)r();}});
  const functions=[];
  for(let lane=0;lane<32;lane++){
    const gpu={u32:x=>Number(x)>>>0,u64:x=>BigInt(x),f32:x=>Math.fround(x),thread:{x:()=>lane},barrier:{block:barrier},atomic:{loadAcquireDevice:(p,i)=>p[index(i)],storeReleaseDevice:(p,i,v)=>p[index(i)]=v,cas:(p,i,a,b)=>{const old=p[index(i)];if(old===a)p[index(i)]=b;return old;},add:(p,i,v)=>{const old=p[index(i)];p[index(i)]=old+v;return old;}}};
    const imported=(item,features,scores,workspace)=>{calls.push(lane);scores[lane]=features[lane]*2;workspace[lane]=lane;if(lane===cancelLane)resources.mcgsEvalRequestControl32[c.state.requestControl32.cancelRequested]=1;return lane===failLane?1:0;};
    const source=c.device.source.replace('function mcgsTensorEvaluatorServiceCollective(', 'async function mcgsTensorEvaluatorServiceCollective(').replaceAll('gpu.barrier.block();','await gpu.barrier.block();');
    functions.push(new Function('gpu','mcgsTensorRunItem',source+'\nreturn {'+c.device.functions.map(x=>x.name).join(',')+'};')(gpu,imported));
  }
  const controls=['mcgsEvalRequestControl32','mcgsEvalRequestControl64','mcgsEvalBatchControl32','mcgsEvalBatchControl64'].map(x=>resources[x]);
  return {resources,controls,functions,calls,async service(token){const descriptor=c.device.functions.find(x=>x.name===c.device.serviceProtocol.serviceItem);const values=descriptor.parameters.map((p,i)=>i<5?token[i]:resources[p.name]);return Promise.all(functions.map(f=>f[descriptor.name](...values)));}};
}

test('collective protocol owns prepare/execute/scatter/publish with exact uniform launch metadata',()=>{
  const c=collectiveContribution();assert.equal(c.device.serviceProtocol.contract,'cuda-mcgs.evaluator-collective-item-service/0.1.0');
  const fn=c.device.functions.find(x=>x.name===c.device.serviceProtocol.serviceItem);
  assert.deepEqual(fn.participation,{kind:'collective-block',blockSize:32});assert.deepEqual(fn.launchConstraint,{grid:['1','1','1'],block:['32','1','1']});
  assert(c.resources.some(x=>x.representationRole==='collective-control'&&x.elementCount===3));
  assert.throws(()=>createTensorEvaluatorRuntimeContribution(createTensorEvaluatorConnector(toyTensorProgram(),{requestCapacity:1}),{participation:{kind:'collective-block',blockSize:31}}));
});
test('collective control is a materialized Evaluator batch resource in the public resource binder',()=>{
  const c=collectiveContribution(2);
  const input={id:'evaluator.collective',schema:'cuda-mcgs.evaluator-profile/0.2.0',status:'accepted',contract:{id:'SPEC-0009'},execution:{deviceOwned:true,hostProgress:'none'},resources:[],statuses:[...new Set([...c.resources,...c.tensorBindings].map(r=>r.pressureStatus))].map(code=>({code})),workspaces:[{id:'evaluator.collective.workspace'}]};
  const bound=bindTensorEvaluatorProfileResources(input,c);
  assert(bound.resources.some(r=>r.id.includes('collective')&&r.class==='batch'&&r.maximum==='12'));
});
test('all32 lanes execute once; successful publication and exact recycled-incarnation stale rejection',async()=>{
  const c=collectiveContribution(),o=hostOracle(c),f=o.functions[0],r=c.state.resultCodes;
  o.resources.mcgsEvalRequestInput_f32.forEach((_,i,a)=>a[i]=i+1);
  assert.equal(f.mcgsTensorEvaluatorAdmit(0,11n,...o.controls.slice(0,2)),r.ok);assert.equal(f.mcgsTensorEvaluatorFormBatch(...o.controls),1);
  const token=[0,0,1n,11n,1n];assert.deepEqual(await o.service(token),Array(32).fill(r.ok));assert.deepEqual(o.calls,[...Array(32).keys()]);
  assert.deepEqual(o.resources.mcgsEvalResultOutput_f32,[...Array(32)].map((_,i)=>(i+1)*2));
  assert.equal(f.mcgsTensorEvaluatorRecycle(0,1n,11n,...o.controls.slice(0,2)),r.ok);assert.equal(f.mcgsTensorEvaluatorAdmit(0,12n,...o.controls.slice(0,2)),r.ok);
  const before=structuredClone(o.resources);assert.deepEqual(await o.service(token),Array(32).fill(r.stale));assert.deepEqual(o.resources.mcgsEvalRequestControl32,before.mcgsEvalRequestControl32);assert.deepEqual(o.resources.mcgsEvalRequestControl64,before.mcgsEvalRequestControl64);assert.equal(o.calls.length,32);
});
test('one-lane math failure and inflight cancellation publish no ready result and recycle exactly',async()=>{
  for(const injection of [{failLane:17},{cancelLane:9}]){
    const c=collectiveContribution(),o=hostOracle(c,injection),f=o.functions[0],r=c.state.resultCodes;
    f.mcgsTensorEvaluatorAdmit(0,1n,...o.controls.slice(0,2));f.mcgsTensorEvaluatorFormBatch(...o.controls);
    const expected=injection.failLane===17?r.failed:r.cancelled;
    assert.deepEqual(await o.service([0,0,1n,1n,1n]),Array(32).fill(expected));assert.equal(o.calls.length,32);assert(o.resources.mcgsEvalResultOutput_f32.every(x=>x===0));assert.notEqual(o.resources.mcgsEvalRequestControl32[0],c.state.slotStates.ready);
    assert.equal(f.mcgsTensorEvaluatorRecycle(0,1n,1n,...o.controls.slice(0,2)),r.ok);assert.equal(f.mcgsTensorEvaluatorRecycle(0,1n,1n,...o.controls.slice(0,2)),r.notReady);
  }
});
test('one active request uses a partial larger Tensor capacity without touching inactive items',async()=>{
  const c=collectiveContribution(2),o=hostOracle(c),f=o.functions[0];
  assert.equal(c.execution.maxActiveItems,1);assert.equal(c.execution.itemCapacity,2);
  for(const name of ['features','scores','workspace'])o.resources[name].fill(12345,32);
  o.resources.mcgsEvalRequestInput_f32.fill(1);f.mcgsTensorEvaluatorAdmit(0,11n,...o.controls.slice(0,2));assert.equal(f.mcgsTensorEvaluatorFormBatch(...o.controls),1);
  assert.deepEqual(await o.service([0,0,1n,11n,1n]),Array(32).fill(0));
  for(const name of ['features','scores','workspace'])assert(o.resources[name].slice(32).every(x=>x===12345));
});
test('selected input encoder is Evaluator-owned source/work with explicit typed external references',()=>{
  const encoder={source:'function encodeOwned(state,stateBase,actions,actionsBase,count,encoded,encodedBase){encoded[encodedBase]=gpu.cast.f32(state[stateBase]);return gpu.u32(0);}',entryPoint:'encodeOwned',functions:[{name:'encodeOwned',kind:'device',parameters:[{name:'state',type:'ptr<u32>'},{name:'stateBase',type:'u32'},{name:'actions',type:'ptr<u32>'},{name:'actionsBase',type:'u32'},{name:'count',type:'u32'},{name:'encoded',type:'ptr<f32>'},{name:'encodedBase',type:'u32'}],returns:'u32',calls:[]}],externalFunctions:[]};
  const c=createTensorEvaluatorRuntimeContribution(createTensorEvaluatorConnector(toyTensorProgram(),{requestCapacity:1}),{participation:{kind:'collective-block',blockSize:32},inputEncoder:encoder});
  assert(c.device.source.includes(encoder.source));assert.deepEqual(c.device.workClasses.encode.functions,['encodeOwned']);assert.deepEqual(c.device.externalFunctions,[]);
  const bad=structuredClone(encoder);bad.functions[0].calls=['missing'];assert.throws(()=>createTensorEvaluatorRuntimeContribution(createTensorEvaluatorConnector(toyTensorProgram(),{requestCapacity:1}),{participation:{kind:'collective-block',blockSize:32},inputEncoder:bad}));
});

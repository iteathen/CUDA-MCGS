import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createTensorEvaluatorConnector,createTensorEvaluatorRuntimeContribution} from '../../adapters/evaluators/cuda-js-tensor/index.mjs';

const consumer=process.env.MCGS_PUBLIC_CONSUMER_PACKAGE??'E:/uci-arena-task-builds/vector-gpu-engine-runtime-20261008/components/engine-runtime/package.json';
const itemCapacity=Number(process.env.MCGS_TENSOR_ITEM_CAPACITY??2);
const cuda=await import(import.meta.resolve('cuda-js',pathToFileURL(consumer))),tensor=await import(import.meta.resolve('cuda-js-tensor',pathToFileURL(consumer)));
const runtime=await cuda.openCudaRuntime({compiler:true,driver:{memory:{maxDeviceBytes:1_048_576,maxAllocationBytes:1_048_576,maxTransferBytes:1_048_576},execution:{maxArguments:32,maxModuleBytes:16_777_216,maxCompletionMilliseconds:30_000}}});
const owned=[];let session,receipt,terminal;
try{
  session=await tensor.TensorSession.open(runtime);
  const plan=tensor.TensorPlan.create(tensor.TensorProgram.define(g=>{const x=g.input('features',{dtype:'f32',capacityShape:[itemCapacity,32],access:'read'});return {scores:g.binary('add',g.binary('add',x,x),x)};}));
  const callable=await tensor.compileTensorDeviceProgram(session,plan,{itemCapacity,itemInputs:['features'],participation:'block32'});
  const contribution=createTensorEvaluatorRuntimeContribution(createTensorEvaluatorConnector(callable,{requestCapacity:1}),{participation:{kind:'collective-block',blockSize:32}});
  const specs=[...contribution.resources,...contribution.tensorBindings].filter(r=>r.elementCount>0);
  const descriptors=specs.map(s=>({name:s.parameterName,type:`ptr<${s.dtype}>`}));descriptors.push({name:'trace',type:'ptr<u32>'});
  const names=descriptors.map(p=>p.name),r32=contribution.state.requestControl32,r64=contribution.state.requestControl64,b32=contribution.state.batchControl32,b64=contribution.state.batchControl64;
  const token=['gpu.u32(0)','gpu.u32(0)',`mcgsEvalRequestControl64[gpu.u64(${r64.slotGeneration}n)]`,'gpu.u64(11n)',`mcgsEvalBatchControl64[gpu.u64(${b64.batchGeneration}n)]`];
  const service=contribution.device.functions.find(f=>f.name===contribution.device.serviceProtocol.serviceItem);
  const argumentsText=service.parameters.map((p,i)=>i<5?token[i]:p.name).join(',');
  const encoded=contribution.requestInputPartitions[0].parameterName,result=contribution.resultOutputPartitions[0].parameterName;
  const source=contribution.device.source+`
function qualifyCollective(${names.join(',')}){
  if(gpu.thread.x()===gpu.u32(0)){
    for(let i=gpu.u32(0);i<gpu.u32(32);i++){${encoded}[i]=gpu.cast.f32(i)+gpu.f32(1);}
    trace[gpu.u32(0)]=mcgsTensorEvaluatorAdmit(gpu.u32(0),gpu.u64(11n),mcgsEvalRequestControl32,mcgsEvalRequestControl64);
    trace[gpu.u32(1)]=mcgsTensorEvaluatorFormBatch(mcgsEvalRequestControl32,mcgsEvalRequestControl64,mcgsEvalBatchControl32,mcgsEvalBatchControl64);
  }
  gpu.barrier.block();
  let resultCode=${service.name}(${argumentsText});
  trace[gpu.u32(4)+gpu.thread.x()]=resultCode;
  gpu.barrier.block();
  if(gpu.thread.x()===gpu.u32(0)){
    trace[gpu.u32(2)]=mcgsEvalRequestControl32[gpu.u64(${r32.slotState}n)];trace[gpu.u32(3)]=mcgsEvalBatchControl32[gpu.u64(${b32.batchState}n)];
    for(let i=gpu.u32(0);i<gpu.u32(32);i++){trace[gpu.u32(36)+i]=gpu.cast.u32(${result}[i]);}
    trace[gpu.u32(68)]=mcgsTensorEvaluatorRecycle(gpu.u32(0),gpu.u64(1n),gpu.u64(11n),mcgsEvalRequestControl32,mcgsEvalRequestControl64);
    trace[gpu.u32(69)]=mcgsTensorEvaluatorAdmit(gpu.u32(0),gpu.u64(12n),mcgsEvalRequestControl32,mcgsEvalRequestControl64);
  }
  gpu.barrier.block();
  let staleCode=${service.name}(${service.parameters.map((p,i)=>i<5?['gpu.u32(0)','gpu.u32(0)','gpu.u64(1n)','gpu.u64(11n)','gpu.u64(1n)'][i]:p.name).join(',')});
  trace[gpu.u32(70)+gpu.thread.x()]=staleCode;
  gpu.barrier.block();
  if(gpu.thread.x()===gpu.u32(0)){
    trace[gpu.u32(102)]=mcgsTensorEvaluatorCancel(gpu.u32(0),gpu.u64(2n),gpu.u64(12n),mcgsEvalRequestControl32,mcgsEvalRequestControl64);
    trace[gpu.u32(103)]=mcgsTensorEvaluatorRecycle(gpu.u32(0),gpu.u64(2n),gpu.u64(12n),mcgsEvalRequestControl32,mcgsEvalRequestControl64);
    trace[gpu.u32(104)]=mcgsEvalRequestControl32[gpu.u64(${r32.slotState}n)];
  }
}
`;
  const request={source,functions:[...contribution.device.functions.map(({participation,launchConstraint,calls,...f})=>f),{name:'qualifyCollective',kind:'kernel',parameters:descriptors,returns:'void'}],imports:[contribution.device.createDeviceImport()],compile:{headerProfile:'cuda-device'}};
  cuda.inspectDeviceProgram(request);
  const compiled=await cuda.compileDeviceProgram(runtime,request),artifact=compiled.linker?.artifact??compiled.compiler.artifact;
  const memories=[];
  for(const spec of specs){const memory=await runtime.allocateDevice({byteLength:spec.byteLength});owned.push(memory);memories.push(memory);const initial=new Uint8Array(spec.byteLength);if(spec.itemVarying&&spec.dtype==='f32'&&itemCapacity>1)new Float32Array(initial.buffer).fill(12345,spec.elementCount/itemCapacity);await memory.write(initial);}
  const traceMemory=await runtime.allocateDevice({byteLength:105*4});owned.push(traceMemory);memories.push(traceMemory);await traceMemory.write(new Uint8Array(105*4));
  const module=await runtime.loadModule({format:artifact.format,bytes:artifact.bytes});owned.push(module);
  const kernel=compiled.deviceProgram.kernels.find(k=>k.name==='qualifyCollective'),fn=await module.getFunction({name:kernel.functionName,parameters:kernel.parameters});owned.push(fn);
  const op=await fn.submit({grid:{x:1,y:1,z:1},block:{x:32,y:1,z:1},arguments:memories,accesses:memories.map((m,i)=>({argumentIndex:i,byteOffset:0,byteLength:i===specs.length?420:specs[i].byteLength,mode:'read-write'}))});owned.push(op);assert.equal((await op.wait()).status,'completed');
  const traceRead=await traceMemory.read({byteLength:420}),trace=Array.from(new Uint32Array(traceRead.bytes.buffer,traceRead.bytes.byteOffset,105));
  assert.deepEqual(trace.slice(0,4),[0,1,5,0]);assert.deepEqual(trace.slice(4,36),Array(32).fill(0));assert.deepEqual(trace.slice(36,68),Array.from({length:32},(_,i)=>(i+1)*3));assert.deepEqual(trace.slice(68,70),[0,0]);assert.deepEqual(trace.slice(70,102),Array(32).fill(5));assert.deepEqual(trace.slice(102),[6,0,0]);
  const inactiveItems=[];
  if(itemCapacity>1)for(const [i,spec]of specs.entries())if(spec.itemVarying&&spec.dtype==='f32'){const read=await memories[i].read({byteLength:spec.byteLength});const values=new Float32Array(read.bytes.buffer,read.bytes.byteOffset,spec.elementCount);assert(values.slice(spec.elementCount/itemCapacity).every(x=>x===12345));inactiveItems.push({name:spec.parameterName,inactiveElements:spec.elementCount-spec.elementCount/itemCapacity,sentinel:12345});}
  receipt={schema:'cuda-mcgs.collective-evaluator-physical-evidence/0.1.0',status:'pass',node:process.version,itemCapacity,activeItems:1,inactiveItems,sourceSha256:createHash('sha256').update(source).digest('hex'),environment:await runtime.describe(),artifact:{format:artifact.format,sha256:artifact.sha256},tensorIdentity:callable.compatibilityIdentity,participation:callable.participation,requestLayout:contribution.state,resultPartitions:contribution.resultOutputPartitions,trace,claims:['public-Tensor10-block32-math-through-selected-Evaluator-lifecycle','32participants-exact-one-item','partial-larger-Tensor-capacity-with-inactive-items-unchanged','ready-result-and-exact-incarnation-stale-rejection','queued-cancel-and-recycle'],limitations:['tiny-independent-math-not-product-model','not-yet-resident-Graph-Session-composition']};
}finally{
  const errors=[];for(const item of owned.reverse())try{await item.close();}catch(error){errors.push(error);break;}
  if(session)try{await session.close();}catch(error){errors.push(error);}
  terminal=await runtime.close();if(errors.length||!terminal.graceful)throw new AggregateError(errors,'collective cleanup not proved');
}
receipt.terminal=terminal;
const output=new URL(`../../.cache/collective-evaluator-capacity${itemCapacity}-node26.11.1-20261008.json`,import.meta.url);await writeFile(output,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({status:receipt.status,node:receipt.node,itemCapacity,inactiveItems:receipt.inactiveItems,artifact:receipt.artifact,terminal,receipt:output.pathname}));

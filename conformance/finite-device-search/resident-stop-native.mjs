import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {generateResidentEntries} from '../../components/search-compiler/src/resident-entries.mjs';
import {generateResidentOutput} from '../../components/search-compiler/src/resident-session-output.mjs';
import {emitResidentStop} from '../../components/search-compiler/src/resident-stop.mjs';

// Isolated generated-controller/terminal-journal fault injection. The supplied
// callbacks have no game, evaluation or Graph-progression qualification meaning.
export async function qualifyResidentStop(cuda){
 const runtime=await cuda.openCudaRuntime({compiler:true,driver:{execution:{maxArguments:32,maxPendingGpuOperations:2}}}),cases=[];
 let cleanup;
 try{
  for(const scenario of [{cancelled:1,prior:0,consume:0,dispose:11,cause:2,drain:11},{cancelled:0,prior:8,consume:9,dispose:11,cause:8,drain:9},{cancelled:1,prior:0,consume:0,dispose:0,cause:2,drain:0}]){
   const owned=[];
   try{
    const L={maxActions:2,actionWords:1,stateWords:4,nodeMeta:128,edgeMeta:256,scratchU32Words:32,nodeU32Words:4,nodeF32Words:4,edgeU32Words:4,edgeF32Words:4,edgePolicyU32:16,edgePolicyF32:16};
    const extra=[{name:'mcgsEvalRequestControl32',type:'ptr<u32>'},{name:'mcgsEvalBatchControl32',type:'ptr<u32>'}];
    const evaluator={device:{functions:[{name:'mcgsTensorEvaluatorCancel',parameters:[]}]},state:{requestControl32:{slotState:0},batchControl32:{batchState:0}}};
    const entries=generateResidentEntries('r',L,extra,evaluator,'1'),controller=entries.functions.progress.find(f=>f.name==='r_controller'),body=entries.functions.progress.find(f=>f.name==='r_body');
    const H={encodeSnapshotRow:()=> 'stubEncode()',encodeUnavailableRow:()=> 'stubEncode()',chooseEncoded:()=> 'stubChoose()'},output=generateResidentOutput('r_output','r_graph',L,H,[]);
    const terminal=output.functions.find(f=>f.name==='r_output_terminalFacts'),terminalSource=output.sourceFragments.find(f=>f.name===terminal.name).source;
    const progressParameters=controller.parameters.filter(p=>['m','s','a','p','f','su','sf','vu','vf','sessionCounters',...extra.map(p=>p.name)].includes(p.name));
    const disposeParameters=[...progressParameters.slice(0,10),{name:'disposition',type:'u32'},...extra];
    const helpers=[],sources=[];
    const add=(name,parameters,text,returns='u32')=>{helpers.push({name,kind:'device',parameters,returns});sources.push(`function ${name}(${parameters.map(p=>p.name).join(',')}){${text}}`);};
    add('r_progress_consume',progressParameters,(scenario.consume?emitResidentStop(scenario.consume):'')+'return gpu.u32(0);');
    add('r_progress_advance',progressParameters,'return gpu.u32(0);');
    add('r_progress_dispose',disposeParameters,'m[gpu.u32(44)]=gpu.u32(0);'+(scenario.dispose?emitResidentStop(scenario.dispose,true):'')+'return gpu.u32(0);');
    add('r_progress_body',[{name:'m',type:'ptr<u32>'},{name:'q64',type:'ptr<u64>'},...extra],'return gpu.u32(0);');
    add('mcgsTensorEvaluatorCancel',[],'return gpu.u32(0);');
    add('r_output_publish',controller.parameters.filter(p=>['m','a','p','f','authority','snapshot','encoded',...extra.map(p=>p.name)].includes(p.name)),'return gpu.u32(0);');
    add('r_output_terminal',controller.parameters.filter(p=>['authority','snapshot','out'].includes(p.name)),'return gpu.u32(0);');
    const functions=[...helpers,terminal,...[body,controller].map(({name,kind,parameters,returns})=>({name,kind,parameters,returns}))];
    const request={source:sources.join('\n')+'\n'+terminalSource+'\n'+entries.source.progress,functions,compile:{headerProfile:'cuda-device',relocatableDeviceCode:true}};
    cuda.inspectDeviceProgram(request);const compiled=await cuda.compileDeviceProgram(runtime,request),artifact=compiled.linker.artifact;
    const module=await runtime.loadModule({format:artifact.format,bytes:artifact.bytes});owned.push(module);
    const byName=new Map(),host=new Map();
    for(const p of controller.parameters){const array=p.type==='ptr<u64>'?new BigUint64Array(512):p.type==='ptr<f32>'?new Float32Array(512):new Uint32Array(512);host.set(p.name,array);}
    host.get('m')[17]=scenario.prior;host.get('m')[44]=1;host.get('authority')[16]=scenario.cancelled;host.get('out').fill(0xa5a5a5a5);
    for(const [name,array]of host){const memory=await runtime.allocateDevice({byteLength:array.byteLength});owned.push(memory);await memory.write(new Uint8Array(array.buffer));byName.set(name,memory);}
    const nodes=[];const bindings=Object.fromEntries(byName);
    for(const entry of [body,controller]){const k=compiled.deviceProgram.kernels.find(k=>k.name===entry.name),fn=await module.getFunction({name:k.functionName,parameters:k.parameters,...(k.executionProfile?{executionProfile:k.executionProfile}:{})});owned.push(fn);nodes.push({id:entry.name,after:entry===body?[]:[body.name],function:fn,grid:{x:1,y:1,z:1},block:{x:entry===body?32:1,y:1,z:1},arguments:entry.parameters.map(p=>({binding:p.name})),accesses:entry.parameters.map((p,i)=>({argumentIndex:i,byteOffset:0,byteLength:host.get(p.name).byteLength,mode:'read-write'}))});}
    const operation=await runtime.submitDeviceContinuation({nodes,bindings,continuationNode:controller.name});owned.push(operation);assert.equal((await operation.wait()).status,'completed');await operation.close();owned.pop();
    const read=await byName.get('out').read({byteLength:host.get('out').byteLength}),words=new Uint32Array(read.bytes.buffer,read.bytes.byteOffset);
    assert.equal(words[23],scenario.cause);assert.equal(words[output.layout.drainDispositionWord],scenario.drain);assert(words.slice(output.layout.observerWords).every(v=>v===0xa5a5a5a5));
    cases.push({scenario,sourceSha256:createHash('sha256').update(request.source).digest('hex'),controllerSourceSha256:createHash('sha256').update(entries.source.progress).digest('hex'),terminalFactsSourceSha256:createHash('sha256').update(terminalSource).digest('hex'),artifactSha256:createHash('sha256').update(artifact.bytes).digest('hex'),observedFirstCause:words[23],observedDrainDisposition:words[output.layout.drainDispositionWord],outputWords:output.layout.observerWords,guardUnchanged:true});
   }finally{for(const resource of owned.reverse())await resource.close();}
  }
 }finally{cleanup=await runtime.close();}
 assert.equal(cleanup.driver.resourceCounts.live,0);assert.equal(cleanup.driver.resourceCounts.orphaned,0);
 return {scope:'isolated-generated-stop-journal-fault-injection-not-engine-or-Graph-progression',node:process.version,compatibility:cuda.CUDA_JS_COMPATIBILITY,cases,cleanup};
}

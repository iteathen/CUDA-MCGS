import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {generateResidentSession} from '../../components/search-compiler/src/resident-session-output.mjs';
// Isolated Session counter-boundary probe. Domain/Graph callbacks are explicit
// fault-detection markers, not a game or resident search implementation.
export async function qualifyResidentEpoch(cuda){
 const runtime=await cuda.openCudaRuntime({compiler:true,driver:{execution:{maxArguments:32}}}),owned=[],cases=[];let cleanup;
 try{
  const U='ptr<u32>',F='ptr<f32>',p=(name,type='u32')=>({name,type}),pair=(name,type=U)=>[p(name,type),p(name+'Base')];
  const L={stateWords:4,actionWords:1,maxAdmissionActions:1,maxActions:2,nodeMeta:128,edgeMeta:256,scratchU32Words:32,outcome:0};
  const H=Object.fromEntries(['validateRoot','terminal','actionValid','transition','classifyTransitionResult','actionEqual'].map(name=>[name,(...args)=>`probe_${name}(${args.join(',')})`]));
  const session=generateResidentSession('r_session','r_graph','r_output',L,H,[]),apply=session.functions.find(f=>f.name==='r_session_apply');
  const helpers=[],sources=[];const add=(name,parameters,body,returns='u32')=>{helpers.push({name,kind:'device',parameters,returns});sources.push(`function ${name}(${parameters.map(p=>p.name).join(',')}){${body}}`);};
  add('probe_validateRoot',pair('state'),'return true;','bool');add('probe_terminal',[...pair('state'),...pair('outcome')],'return gpu.u32(0);');
  add('probe_actionValid',[...pair('state'),...pair('action')],'return true;','bool');add('probe_transition',[...pair('state'),...pair('action'),...pair('target')],'return gpu.u32(0);');
  add('probe_classifyTransitionResult',[p('status')],'return status;');add('probe_actionEqual',[...pair('a'),...pair('b')],'return true;','bool');
  add('r_graph_valid',[p('m',U),p('slot'),p('generation')],'return true;','bool');
  add('r_graph_admit',[...apply.parameters.slice(0,7),p('candidate',U),p('candidateBase')],'m[gpu.u32(5)]=m[gpu.u32(5)]+gpu.u32(1);return gpu.u32(1);');
  add('r_output_reserve',[p('m',U),p('authority',U),p('snapshot',U)],'m[gpu.u32(60)]=m[gpu.u32(60)]+gpu.u32(1);return gpu.u32(0);');
  add('r_output_abort',[p('m',U),p('snapshot',U)],'m[gpu.u32(60)]=gpu.u32(0);return gpu.u32(0);');
  add('r_output_publish',apply.parameters.filter(p=>['m','a','p','f','authority','snapshot','encoded'].includes(p.name)),'return gpu.u32(0);');
  const kernel={name:'probeEpoch',kind:'kernel',parameters:[...apply.parameters,p('out',U)],returns:'void'};
  const source=sources.join('\n')+'\n'+session.source+`function probeEpoch(${kernel.parameters.map(p=>p.name).join(',')}){out[gpu.u32(0)]=r_session_apply(${apply.parameters.map(p=>p.name).join(',')});out[gpu.u32(1)]=m[gpu.u32(5)];out[gpu.u32(2)]=m[gpu.u32(60)];out[gpu.u32(3)]=authority[gpu.u32(3)];out[gpu.u32(4)]=authority[gpu.u32(4)];}`;
  const request={source,functions:[...helpers,...session.functions,kernel],compile:{headerProfile:'cuda-device'}};cuda.inspectDeviceProgram(request);
  const compiled=await cuda.compileDeviceProgram(runtime,request),artifact=compiled.linker?.artifact??compiled.compiler.artifact;
  const module=await runtime.loadModule({format:artifact.format,bytes:artifact.bytes});owned.push(module);
  const k=compiled.deviceProgram.kernels[0],fn=await module.getFunction({name:k.functionName,parameters:k.parameters});owned.push(fn);
  for(const exhaustedField of [3,4]){
    const arrays=kernel.parameters.map(p=>p.type===F?new Float32Array(512):new Uint32Array(512));
    const byName=Object.fromEntries(kernel.parameters.map((p,i)=>[p.name,arrays[i]]));const c=byName.command,a=byName.authority;
    a[0]=1;a[3]=1;a[exhaustedField]=4294967294;c[0]=2;c[2]=1;c[3]=1;c[8]=1;c[12]=1;c[20]=4;c[22]=1;
    const memories=[];for(const array of arrays){const m=await runtime.allocateDevice({byteLength:array.byteLength});owned.push(m);memories.push(m);await m.write(new Uint8Array(array.buffer));}
    const op=await fn.submit({grid:{x:1,y:1,z:1},block:{x:1,y:1,z:1},arguments:memories,accesses:arrays.map((array,i)=>({argumentIndex:i,byteOffset:0,byteLength:array.byteLength,mode:'read-write'}))});owned.push(op);assert.equal((await op.wait()).status,'completed');await op.close();owned.pop();
    const r=await memories.at(-1).read({byteLength:20}),w=Array.from(new Uint32Array(r.bytes.buffer,r.bytes.byteOffset,5));assert.deepEqual(w,[9,0,0,a[3],a[4]]);cases.push({exhaustedField,sourceSha256:createHash('sha256').update(source).digest('hex'),sessionSourceSha256:createHash('sha256').update(session.source).digest('hex'),artifactSha256:createHash('sha256').update(artifact.bytes).digest('hex'),typedResult:w[0],targetAdmissions:w[1],outputReservations:w[2],authorityEpoch:w[3],publicationGeneration:w[4]});
    for(let i=memories.length;i>0;i--){await owned.pop().close();}
  }
 }finally{for(const r of owned.reverse())await r.close();cleanup=await runtime.close();}
 assert.equal(cleanup.driver.resourceCounts.live,0);assert.equal(cleanup.driver.resourceCounts.orphaned,0);
 return {scope:'isolated-generated-Session-counter-boundary-not-engine-or-Graph-progression',node:process.version,compatibility:cuda.CUDA_JS_COMPATIBILITY,cases,cleanup};
}

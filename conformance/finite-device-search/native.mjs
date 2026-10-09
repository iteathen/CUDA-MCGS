import * as cuda from 'cuda-js';
import { composeFiniteFixture } from './composition.mjs';
export const evidenceResults=[];

export async function runFiniteFixture({kind=0,nodes=16,edges=32,depth=8,iterations=4,cancel=0,rootGeneration=1,focusEpoch=1,fault='',slow='',cancelDelayMilliseconds=null,initialWorkId=0,cooperative=false,mismatch=false,fail=false}={}) {
  const composition=composeFiniteFixture({nodes,edges,depth,fault,slow,iterations,cooperative,mismatch,fail});
  const {context,core}=composition;
  const L=core.layout;
  const request={source:composition.program.normalized.source,functions:composition.program.normalized.functions.map(fn=>({name:fn.name,kind:fn.executionRole==='runtime-entry'?'kernel':'device',returns:fn.returns,parameters:fn.parameters.map(({sidebandRole,...p})=>({...p,type:p.type.replace(/^sideband</,'mailbox<')}))})),compile:{headerProfile:'cuda-cccl'}};
  cuda.inspectDeviceProgram(request);
  const values=[new Uint32Array(L.metaWords),new Uint32Array(nodes*L.stateWords),new Uint32Array(edges*L.actionWords),new Uint32Array(L.policyU32Words),new Float32Array(L.policyF32Words),new Uint32Array(L.scratchU32Words),new Float32Array(L.scratchF32Words),new Uint32Array(32+L.actionWords)];
  if(cooperative)values.push(new Uint32Array(L.viewU32Words),new Float32Array(L.viewF32Words));
  values[0][10]=1;values[0][11]=1;values[0][2]=initialWorkId;values[1][1]=kind;
  const sizes=values.map(value=>value.byteLength);
  const runtime=await cuda.openCudaRuntime({compiler:true,driver:{memory:{maxDeviceBytes:sizes.reduce((a,b)=>a+b,0),maxAllocationBytes:Math.max(...sizes),maxTransferBytes:Math.max(...sizes)},execution:{maxArguments:16,maxModuleBytes:8_388_608,maxCompletionMilliseconds:30_000}}});
  const resources=[];let returned,terminal,environment,artifact,cancelTimer;
  try {
    environment=await runtime.describe();
    const compiled=await cuda.compileDeviceProgram(runtime,request);
    artifact={sha256:compiled.compiler.artifact.sha256,format:compiled.compiler.artifact.format,architecture:compiled.compiler.artifact.architecture};
    const memories=[];
    for(const [i,byteLength]of sizes.entries()){const memory=await runtime.allocateDevice({byteLength});memories.push(memory);resources.push(memory);await memory.write(new Uint8Array(values[i].buffer));}
    const module=await runtime.loadModule({format:compiled.compiler.artifact.format,bytes:compiled.compiler.artifact.bytes});resources.push(module);
    const kernel=compiled.deviceProgram.kernels.find(k=>k.name==='engine_step');
    const fn=await module.getFunction({name:kernel.functionName,parameters:kernel.parameters});resources.push(fn);
    const mailbox=await runtime.createPublicationMailbox({lanes:[{name:'cancel',direction:'host-to-device'}]});resources.push(mailbox);mailbox.store('cancel',cancel);
    const operation=await fn.submit({grid:{x:1,y:1,z:1},block:{x:Number(core.launch.block[0]),y:1,z:1},arguments:[...memories,{kind:'publication-mailbox',mailbox,lane:'cancel'},1,rootGeneration,focusEpoch],accesses:sizes.map((byteLength,argumentIndex)=>({argumentIndex,byteOffset:0,byteLength,mode:argumentIndex===7?'write':'read-write'}))});resources.push(operation);
    if(cancelDelayMilliseconds!==null)cancelTimer=setTimeout(()=>mailbox.store('cancel',1),cancelDelayMilliseconds);
    if((await operation.wait()).status!=='completed')throw new Error('finite search did not complete');
    const reads=[];
    for(const [i,memory]of memories.entries()){const read=await memory.read({byteLength:sizes[i]});reads.push(new values[i].constructor(read.bytes.buffer,read.bytes.byteOffset,values[i].length).slice());}
    const meta=reads[0],p=reads[3],f=reads[4];
    returned={meta:Array.from(meta),states:Array.from(reads[1]),actions:Array.from(reads[2]),policyU32:Array.from(p),policyF32:Array.from(f),output:Array.from(reads[7]),nodeVisits:Array.from({length:meta[0]},(_,i)=>p[i*L.nodeU32Words]),nodeValues:Array.from({length:meta[0]},(_,i)=>f[i*L.nodeF32Words]),edgeVisits:Array.from({length:meta[1]},(_,i)=>p[L.edgePolicyU32+i*L.edgeU32Words]),edgeValues:Array.from({length:meta[1]},(_,i)=>f[L.edgePolicyF32+i*L.edgeF32Words])};
  } finally {
    if(cancelTimer)clearTimeout(cancelTimer);
    const errors=[];for(const resource of resources.reverse()){try{await resource.close();}catch(error){errors.push(error);break;}}
    terminal=await runtime.close();if(errors.length||!terminal.graceful)throw new AggregateError(errors,'finite search cleanup unproved');
  }
  const result={...returned,case:{kind,nodes,edges,depth,iterations,cancel,rootGeneration,focusEpoch,fault,slow,cancelDelayMilliseconds,initialWorkId,cooperative,mismatch,fail},coreIdentity:core.identity,sourceIdentity:core.sourceIdentity,programIdentity:composition.program.identity,programPackageIdentity:composition.programPackage.identity,resourcePlacements:composition.placements,owners:core.normalized.owners,callbackMetadata:core.normalized.callbackMetadata,buffers:core.buffers,layout:L,environment,artifact,terminal};
  evidenceResults.push(result);return result;
}

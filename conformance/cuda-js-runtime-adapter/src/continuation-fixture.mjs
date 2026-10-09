import { executionPackage, publicCudaJsFake } from './fixture.mjs';
export const continuationPeer=Object.freeze({repository:'iteathen/CUDA-JS',revision:'dc2924657bb900cdce3fba4c9def62934419db03',package:'cuda-js@0.1.0-alpha.22'});
export function continuationPackage() {
  const value=executionPackage();value.compatibility.cudaJs={...continuationPeer};
  const a=value.cudaJsAdapter;
  a.sidebandRequirements[0].id='sideband-0';
  a.resourceRequirements[0]={...a.resourceRequirements[0],byteLength:'4',alignment:'4',accessRequirements:['read','write','atomic']};
  a.resourceRequirements.push({id:'resource.sample',ownerProfile:'resource.synthetic',providerRequirement:'provider.device',byteLength:'4',alignment:'4',memorySpaces:['device-search'],accessRequirements:['read','write']});
  a.deliveryRequirements[0].byteLength='4';
  const resource=(parameter,id,access,effects)=>({parameter,source:{kind:'resource',resource:id,access,view:{dtype:'u32',byteOffset:'0',elementCount:'1'},...(effects?{deviceEffects:effects}:{})}});
  const op=(id,fn,bindings,block)=>({id,function:fn,bindings,reachableFunctions:[fn],launchPolicy:{grid:['1','1','1'],block:[block,'1','1'],dynamicSharedBytes:'0',maxPending:'1'}});
  a.operationRequirements=[
    op('operation-body','continuation_body',[resource('state','resource.output','read-write',['atomic-add-relaxed-device'])],'32'),
    op('operation-controller','continuation_step',[resource('state','resource.output','read',['atomic-load-acquire-device']),{parameter:'stop',source:{kind:'sideband',sideband:'sideband-0'}}],'1'),
    op('operation-observer','continuation_observe',[resource('state','resource.output','read',['atomic-load-acquire-device']),resource('out','resource.sample','write')],'1'),
  ];
  a.continuation={contract:'cuda-mcgs.device-continuation/0.1.0',nodes:[{operation:'operation-body',after:[]},{operation:'operation-controller',after:['operation-body']}],controllerOperation:'operation-controller',externalOperations:[{operation:'operation-observer',role:'read-only-observation',delivery:{resource:'resource.sample',view:{dtype:'u32',byteOffset:'0',elementCount:'1'}}}]};
  a.searchProgram={source:'function continuation_body(state) { if (gpu.thread.globalX() === gpu.u32(0)) { gpu.atomic.add(state, gpu.u32(0), gpu.u32(1)); } } function continuation_step(state, stop) { if (gpu.atomic.loadAcquireDevice(state, gpu.u32(0)) < gpu.u32(1000000) && gpu.mailbox.loadAcquireSystem(stop) === gpu.u32(0)) { gpu.execution.tailSelf(); } } function continuation_observe(state, out) { out[gpu.u32(0)] = gpu.atomic.loadAcquireDevice(state, gpu.u32(0)); }',functions:[
    {name:'continuation_body',executionRole:'runtime-entry',parameters:[{name:'state',type:'ptr<u32>'}],returns:'void',calls:[],launchConstraint:{grid:['1','1','1'],block:['32','1','1']}},
    {name:'continuation_step',executionRole:'runtime-entry',executionProfile:'device-continuation-v1',parameters:[{name:'state',type:'ptr<u32>'},{name:'stop',type:'sideband<host-to-device,u32>'}],returns:'void',calls:[]},
    {name:'continuation_observe',executionRole:'runtime-entry',parameters:[{name:'state',type:'ptr<u32>'},{name:'out',type:'ptr<u32>'}],returns:'void',calls:[]},
  ]};
  return value;
}
export function initializedContinuationPackage() {
  const value=continuationPackage(),a=value.cudaJsAdapter;
  a.resourceRequirements.push({id:'resource.bootstrap',ownerProfile:'resource.synthetic',providerRequirement:'provider.device',byteLength:'16',alignment:'4',memorySpaces:['device-search'],accessRequirements:['read','write']});
  a.searchProgram.source+=' function continuation_boot(state, ready) { state[gpu.u32(0)]=gpu.u32(5); ready[gpu.u32(0)]=gpu.u32(0); ready[gpu.u32(1)]=gpu.u32(0); ready[gpu.u32(2)]=gpu.u32(0); ready[gpu.u32(3)]=gpu.u32(0); }';
  a.searchProgram.functions.push({name:'continuation_boot',executionRole:'runtime-entry',parameters:[{name:'state',type:'ptr<u32>'},{name:'ready',type:'ptr<u32>'}],returns:'void',calls:[]});
  a.operationRequirements.push({id:'operation-bootstrap',function:'continuation_boot',reachableFunctions:['continuation_boot'],bindings:[{parameter:'state',source:{kind:'resource',resource:'resource.output',access:'write',view:{dtype:'u32',byteOffset:'0',elementCount:'1'}}},{parameter:'ready',source:{kind:'resource',resource:'resource.bootstrap',access:'write',view:{dtype:'u32',byteOffset:'0',elementCount:'4'}}}],launchPolicy:{grid:['1','1','1'],block:['1','1','1'],dynamicSharedBytes:'0',maxPending:'1'}});
  a.continuation.initializationOperations=[{operation:'operation-bootstrap',readiness:{resource:'resource.bootstrap',view:{dtype:'u32',byteOffset:'0',elementCount:'4'},success:{wordOffset:'0',value:'0'}}}];
  return value;
}
export function continuationFake(flags={}) {
  const fake=publicCudaJsFake(flags);const api=fake.cudaJs;
  api.CUDA_JS_COMPATIBILITY.package.version='0.1.0-alpha.22';
  Object.assign(api.CUDA_JS_COMPATIBILITY.capabilities,{deviceContinuationCandidate:'kernel-only-finite-dag-final-1x1-controller-device-self-tail-opaque-mailboxes-one-operation-unqualified-v1',preparedOperationDagLimits:{nodes:32,edges:64,bindings:64,predecessorsPerNode:8}});
  const kernels=request=>request.functions.filter(f=>f.kind==='kernel').map(f=>({name:f.name,functionName:`kernel_${f.name}`,parameters:f.parameters.map(p=>({kind:p.type.startsWith('ptr<')?'device-memory':p.type.startsWith('mailbox<host-to-device')?'publication-mailbox-host-to-device-u32':p.type})),...(f.name==='continuation_step'&&!flags.missingControllerProfile?{executionProfile:'device-continuation-v1'}:{})}));
  const inspect=api.inspectDeviceProgram;
  api.inspectDeviceProgram=request=>{const result=inspect(request);result.deviceProgram.kernels=kernels(request);return result;};
  const compile=api.compileDeviceProgram;
  api.compileDeviceProgram=async(runtime,request)=>{const result=await compile(runtime,request);result.deviceProgram.kernels=kernels(request);result.linker={artifact:{...result.compiler.artifact,format:'cubin'}};return result;};
  const open=api.openCudaRuntime;
  api.openCudaRuntime=async options=>{
    const runtime=await open(options);
    const allocate=runtime.allocateDevice;
    runtime.allocateDevice=async options2=>{
      const memory=await allocate(options2);
      memory.writeAsync=async(bytes,options3)=>{fake.calls.push(['memory.writeAsync',new Uint8Array(bytes),options3]);return{async wait(){return{status:'completed'};},async close(){fake.calls.push(['stage.close']);if(flags.stageCloseError)throw new Error('stage cleanup failed');return{state:'closed'};}};};
      const read=memory.readAsync;memory.readAsync=async options3=>{const transfer=await read(options3);const close=transfer.close;transfer.close=async()=>{if(flags.beforeReadClose)await flags.beforeReadClose();return close();};return transfer;};
      memory.view=async view=>{fake.calls.push(['memory.view',view]);return{kind:'device-view',dtype:view.dtype,byteOffset:view.byteOffset,elementCount:view.elementCount,byteLength:view.elementCount*4,access:view.access,state:'open',async close(){fake.calls.push(['view.close']);return{state:'closed'};}};};return memory;
    };
    runtime.submitDeviceContinuation=async request=>{fake.calls.push(['runtime.submitDeviceContinuation',request]);return fake.operation;};
    const load=runtime.loadModule;
    runtime.loadModule=async request=>{const module=await load(request);const get=module.getFunction;module.getFunction=async request2=>{const fn=await get(request2);const submit=fn.submit;fn.submit=async options2=>{await submit(options2);const child={state:'pending',async status(){return{status:child.state};},async wait(){fake.calls.push(['external.wait']);child.state='completed';return{schemaVersion:1,status:'completed'};},async close(){fake.calls.push(['external.close']);if(flags.externalCloseError)throw Object.assign(new Error('external close failure'),{code:'EXTERNAL_CLOSE_FAILED',category:'cleanup'});child.state='closed';return{state:'closed'};}};return child;};return fn;};return module;};
    return runtime;
  };
  return fake;
}

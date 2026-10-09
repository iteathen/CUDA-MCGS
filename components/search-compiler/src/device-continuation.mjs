import {exactKeys,fail} from './validation.mjs';

export const deviceContinuationContract=Object.freeze({contract:'cuda-mcgs.device-continuation/0.1.0',executionProfile:'device-continuation-v1',maxNodes:32,maxEdges:64,maxPredecessors:8,externalRoles:Object.freeze(['external-control','read-only-observation'])});

// Canonical Composer child port. Physical graph objects remain exclusively lower-owned.
export function normalizeDeviceContinuation(input,profile){
  const controllers=profile.functions.filter(fn=>fn.executionProfile==='device-continuation-v1');
  if(input===undefined){if(controllers.length)fail('COMPOSE_CONTINUATION_REQUIRED','a continuation entry requires its selected finite DAG');return undefined;}
  exactKeys(input,['contract','nodes','controllerOperation',...['externalOperations','initializationOperations'].filter(key=>Object.hasOwn(input,key))],'COMPOSE_CONTINUATION_FIELDS','continuation');
  if(input.contract!==deviceContinuationContract.contract||controllers.length!==1)fail('COMPOSE_CONTINUATION_PROFILE','exactly one closed continuation controller is required');
  if(!Array.isArray(input.nodes)||input.nodes.length<1||input.nodes.length>32)fail('COMPOSE_CONTINUATION_BOUNDS','continuation requires 1 through32 nodes');
  const operations=new Map(profile.operations.map(op=>[op.id,op]));
  const nodes=input.nodes.map(node=>{
    exactKeys(node,['operation','after'],'COMPOSE_CONTINUATION_NODE','continuation node');
    if(!operations.has(node.operation)||!Array.isArray(node.after)||node.after.length>8||new Set(node.after).size!==node.after.length)fail('COMPOSE_CONTINUATION_NODE','invalid operation or bounded predecessor list');
    return {operation:node.operation,after:[...node.after].sort()};
  }).sort((a,b)=>a.operation<b.operation?-1:1);
  if(new Set(nodes.map(n=>n.operation)).size!==nodes.length||nodes.reduce((sum,n)=>sum+n.after.length,0)>64)fail('COMPOSE_CONTINUATION_BOUNDS','duplicate node or edge capacity exceeded');
  const byId=new Map(nodes.map(node=>[node.operation,node]));
  const controller=operations.get(input.controllerOperation);
  if(!byId.has(input.controllerOperation)||controller?.entryPoint!==controllers[0].name||controller.grid.some(x=>x!=='1')||controller.block.some(x=>x!=='1'))fail('COMPOSE_CONTINUATION_CONTROLLER','controller must be a declared 1x1x1 DAG operation');
  const visiting=new Set(),done=new Set();
  function ancestors(id){if(visiting.has(id))fail('COMPOSE_CONTINUATION_CYCLE','continuation predecessor cycle');if(done.has(id))return;const node=byId.get(id);if(!node)fail('COMPOSE_CONTINUATION_NODE','undeclared predecessor');visiting.add(id);for(const predecessor of node.after)ancestors(predecessor);visiting.delete(id);done.add(id);}
  ancestors(input.controllerOperation);
  if(done.size!==nodes.length)fail('COMPOSE_CONTINUATION_CONTROLLER','final controller must depend transitively on every body');
  const external=input.externalOperations??[];
  if(!Array.isArray(external)||external.length>16)fail('COMPOSE_CONTINUATION_EXTERNAL','bounded external operations are required');
  const externalOperations=external.map(item=>{
    exactKeys(item,['operation','role',...(Object.hasOwn(item,'delivery')?['delivery']:[])],'COMPOSE_CONTINUATION_EXTERNAL','external operation');
    if(!operations.has(item.operation)||byId.has(item.operation)||!deviceContinuationContract.externalRoles.includes(item.role))fail('COMPOSE_CONTINUATION_EXTERNAL','external operation role is not selected or is internal');
    let delivery;
    if(item.delivery!==undefined){
      exactKeys(item.delivery,['resource','view'],'COMPOSE_CONTINUATION_DELIVERY','external delivery');
      exactKeys(item.delivery.view,['dtype','byteOffset','elementCount'],'COMPOSE_CONTINUATION_DELIVERY','external delivery view');
      const widths={u32:4,u64:8,i32:4,f32:4,f64:8,f16:2,bf16:2},view=item.delivery.view,width=widths[view.dtype];
      if(!width||typeof view.byteOffset!=='string'||!/^(0|[1-9][0-9]*)$/.test(view.byteOffset)||typeof view.elementCount!=='string'||!/^[1-9][0-9]*$/.test(view.elementCount))fail('COMPOSE_CONTINUATION_DELIVERY','external delivery requires a finite exact typed view');
      const begin=BigInt(view.byteOffset),length=BigInt(view.elementCount)*BigInt(width),resource=profile.resources.find(r=>r.id===item.delivery.resource);
      if(!resource||resource.materialization!=='resident-storage'||begin%BigInt(width)!==0n||begin+length>BigInt(resource.capacity)||length>BigInt(Number.MAX_SAFE_INTEGER))fail('COMPOSE_CONTINUATION_DELIVERY','external delivery exceeds resident source');
      const binding=operations.get(item.operation).bindings.find(b=>b.source.kind==='resource'&&b.source.resource===resource.id&&['write','read-write'].includes(b.source.access)&&b.source.view&&b.source.view.dtype===view.dtype&&BigInt(b.source.view.byteOffset)<=begin&&BigInt(b.source.view.byteOffset)+BigInt(b.source.view.elementCount)*BigInt(width)>=begin+length);
      if(!binding)fail('COMPOSE_CONTINUATION_DELIVERY','delivery must be contained in the declared external operation output view');
      delivery={resource:resource.id,view:{...view}};
    }
    return {operation:item.operation,role:item.role,...(delivery?{delivery}:{})};
  }).sort((a,b)=>a.operation<b.operation?-1:1);
  const initialization=input.initializationOperations??[];
  if(!Array.isArray(initialization)||initialization.length>8)fail('COMPOSE_INITIALIZATION_BOUNDS','at most eight bounded cold initialization operations are admitted');
  const initializationOperations=initialization.map(item=>{
    exactKeys(item,['operation','readiness'],'COMPOSE_INITIALIZATION_FIELDS','cold initialization');
    const op=operations.get(item.operation);
    if(!op||byId.has(item.operation)||externalOperations.some(x=>x.operation===item.operation)||profile.functions.find(f=>f.name===op.entryPoint)?.executionProfile)fail('COMPOSE_INITIALIZATION_OPERATION','cold initialization requires a distinct ordinary operation');
    exactKeys(item.readiness,['resource','view','success'],'COMPOSE_INITIALIZATION_READINESS','cold readiness');
    exactKeys(item.readiness.view,['dtype','byteOffset','elementCount'],'COMPOSE_INITIALIZATION_READINESS','cold readiness view');
    exactKeys(item.readiness.success,['wordOffset','value'],'COMPOSE_INITIALIZATION_READINESS','cold readiness success');
    const {view,success}=item.readiness,decimal=x=>typeof x==='string'&&/^(0|[1-9][0-9]*)$/u.test(x);
    if(view.dtype!=='u32'||!decimal(view.byteOffset)||!decimal(view.elementCount)||view.elementCount==='0'||!decimal(success.wordOffset)||!decimal(success.value)||BigInt(success.wordOffset)>=BigInt(view.elementCount)||BigInt(success.value)>0xffff_ffffn)fail('COMPOSE_INITIALIZATION_READINESS','readiness requires a finite u32 success field');
    const r=profile.resources.find(r=>r.id===item.readiness.resource),begin=BigInt(view.byteOffset),end=begin+BigInt(view.elementCount)*4n;
    if(!r||r.materialization!=='resident-storage'||begin%4n||end>BigInt(r.capacity)||end>BigInt(Number.MAX_SAFE_INTEGER)||!op.bindings.some(b=>b.source.kind==='resource'&&b.source.resource===r.id&&['write','read-write'].includes(b.source.access)&&b.source.view?.dtype==='u32'&&BigInt(b.source.view.byteOffset)<=begin&&BigInt(b.source.view.byteOffset)+BigInt(b.source.view.elementCount)*4n>=end))fail('COMPOSE_INITIALIZATION_READINESS','readiness must be a contained declared cold output view');
    return {operation:item.operation,readiness:{resource:r.id,view:{...view},success:{...success}}};
  });
  if(new Set(initializationOperations.map(x=>x.operation)).size!==initializationOperations.length||new Set(externalOperations.map(x=>x.operation)).size!==externalOperations.length||nodes.length+externalOperations.length+initializationOperations.length!==operations.size)fail('COMPOSE_CONTINUATION_EXTERNAL','every operation belongs exactly once to cold initialization, ignition or a bounded external role');
  return {contract:input.contract,nodes,controllerOperation:input.controllerOperation,...(initializationOperations.length?{initializationOperations}:{}),...(externalOperations.length?{externalOperations}:{})};
}

export function projectDeviceContinuation(continuation,operations,resources){
  if(!continuation)return undefined;
  const ids=new Map(operations.map((op,index)=>[op.id,`operation-${index}`]));
  const resourceIds=new Map(resources.filter(r=>r.materialization==='resident-storage').map((r,index)=>[r.id,`resource-${index}`]));
  return {...continuation,nodes:continuation.nodes.map(n=>({operation:ids.get(n.operation),after:n.after.map(x=>ids.get(x))})),controllerOperation:ids.get(continuation.controllerOperation),...(continuation.initializationOperations?{initializationOperations:continuation.initializationOperations.map(x=>({operation:ids.get(x.operation),readiness:{...x.readiness,resource:resourceIds.get(x.readiness.resource)}}))}:{}),...(continuation.externalOperations?{externalOperations:continuation.externalOperations.map(x=>({...x,operation:ids.get(x.operation),...(x.delivery?{delivery:{resource:resourceIds.get(x.delivery.resource),view:{...x.delivery.view}}}:{})}))}:{})};
}

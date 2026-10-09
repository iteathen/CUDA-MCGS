// Mechanical realization of the canonical Composer child contract. No source
// parsing, semantic scheduling or native graph objects exist at this boundary.
const CAPABILITY='kernel-only-finite-dag-final-1x1-controller-device-self-tail-opaque-mailboxes-one-operation-unqualified-v1';
const canonical=value=>value&&typeof value==='object'?Array.isArray(value)?value.map(canonical):Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
export function canonicalBindingIdentity(plan,parameter) {
  const source=plan.bindings.get(parameter.name).source;
  return JSON.stringify(canonical({type:parameter.type,...(source.kind==='scalar'?{parameter:parameter.name}:{}),source}));
}
export function admitContinuation(executionPackage,lower,admitSingle,fail) {
  const requirements=executionPackage.cudaJsAdapter;const continuation=requirements.continuation;
  const error=message=>fail('CUDA_JS_ADAPTER_CONTINUATION','admission',message,{classification:'unsupported-capability'});
  if(lower.capabilities?.deviceContinuationCandidate!==CAPABILITY)error('public device continuation profile is unavailable');
  const limits=lower.capabilities.preparedOperationDagLimits;
  if(!limits||limits.nodes!==32||limits.edges!==64||limits.bindings!==64||limits.predecessorsPerNode!==8)error('public continuation bounds differ from admitted profile');
  const allowed=new Set(['contract','nodes','controllerOperation','externalOperations','initializationOperations']);
  if(!continuation||typeof continuation!=='object'||Array.isArray(continuation)||Object.keys(continuation).some(k=>!allowed.has(k))
    ||continuation.contract!=='cuda-mcgs.device-continuation/0.1.0'||!Array.isArray(continuation.nodes)||!continuation.nodes.length||continuation.nodes.length>limits.nodes)error('closed finite continuation declaration is invalid');
  const ops=requirements.operationRequirements;
  if(!Array.isArray(ops)||!ops.length||new Set(ops.map(op=>op.id)).size!==ops.length)error('continuation operations must be unique');
  const operations=new Map();
  for(const operation of ops) {
    if(!Array.isArray(operation.reachableFunctions)||!operation.reachableFunctions.includes(operation.function))error('continuation operation requires its declared reachable function closure');
    const single={...executionPackage,cudaJsAdapter:{...requirements,operationRequirements:[operation]}};delete single.cudaJsAdapter.continuation;
    operations.set(operation.id,admitSingle(single,lower,{allowController:true}));
  }
  const nodes=new Map();let edges=0;
  for(const node of continuation.nodes) {
    if(!node||Object.keys(node).sort().join(',')!=='after,operation'||!operations.has(node.operation)||nodes.has(node.operation)
      ||!Array.isArray(node.after)||node.after.length>limits.predecessorsPerNode||new Set(node.after).size!==node.after.length)error('continuation node/predecessor declaration is invalid');
    nodes.set(node.operation,node);edges+=node.after.length;
  }
  if(edges>limits.edges)error('continuation edge capacity exceeded');
  const controller=operations.get(continuation.controllerOperation);
  if(!nodes.has(continuation.controllerOperation)||controller?.entry.executionProfile!=='device-continuation-v1'
    ||['grid','block'].some(key=>['x','y','z'].some(axis=>controller.launch[key][axis]!==1)))error('sole final controller must be a declared 1x1x1 operation');
  if([...operations].some(([id,plan])=>plan.entry.executionProfile==='device-continuation-v1'&&id!==continuation.controllerOperation))error('continuation has an additional controller operation');
  const visiting=new Set(),done=new Set();
  function visit(id){if(visiting.has(id))error('continuation contains a cycle');if(done.has(id))return;const node=nodes.get(id);if(!node)error('undeclared continuation predecessor');visiting.add(id);for(const parent of node.after)visit(parent);visiting.delete(id);done.add(id);}
  visit(continuation.controllerOperation);if(done.size!==nodes.size)error('controller does not depend on every body');
  const externalOperations=new Map();
  const external=continuation.externalOperations??[];
  if(!Array.isArray(external)||external.length>16)error('external operation bound exceeded');
  for(const item of external) {
    if(!item||Object.keys(item).some(k=>!['operation','role','delivery'].includes(k))||!operations.has(item.operation)||nodes.has(item.operation)||externalOperations.has(item.operation)
      ||!['external-control','read-only-observation'].includes(item.role))error('external operation declaration is invalid');
    const plan=operations.get(item.operation);let delivery;
    for(const {source}of plan.bindings.values())if(source.kind==='resource') {
      const start=source.view?.byteOffsetNumber??0,length=source.view?.byteLengthNumber??plan.resources.get(source.resource).byteLengthNumber;
      for(const id of nodes.keys())for(const {source:other}of operations.get(id).bindings.values())if(other.kind==='resource'&&other.resource===source.resource) {
        const offset=other.view?.byteOffsetNumber??0,extent=other.view?.byteLengthNumber??plan.resources.get(other.resource).byteLengthNumber;
        if(start>=offset+extent||offset>=start+length)continue;
        if(source.access==='read'&&other.access==='read'&&!source.deviceEffects&&!other.deviceEffects)continue;
        // Concurrent shared leases must carry explicit compatible atomic facts.
        if(!source.deviceEffects||!other.deviceEffects||source.view.dtype!==other.view.dtype)error('external shared range lacks compatible atomic access declarations');
      }
    }
    if(item.delivery) {
      const d=item.delivery;const widths={u32:4,u64:8,i32:4,f32:4,f64:8,f16:2,bf16:2};const width=widths[d.view?.dtype];
      const decimal=value=>typeof value==='string'&&/^(0|[1-9][0-9]*)$/u.test(value)&&BigInt(value)<=BigInt(Number.MAX_SAFE_INTEGER)?Number(value):NaN;
      const offset=decimal(d.view?.byteOffset),count=decimal(d.view?.elementCount),length=count*width;const resource=plan.resources.get(d.resource);
      if(Object.keys(d).sort().join(',')!=='resource,view'||!d.view||Object.keys(d.view).sort().join(',')!=='byteOffset,dtype,elementCount'
        ||!resource||!width||!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||count<1||offset%width||offset+length>resource.byteLengthNumber)error('external delivery range is invalid');
      const writes=[...plan.bindings.values()].filter(b=>b.source.kind==='resource'&&b.source.resource===d.resource&&b.source.access!=='read');
      if(!writes.some(b=>{const start=b.source.view?.byteOffsetNumber??0;const bytes=b.source.view?.byteLengthNumber??resource.byteLengthNumber;return (!b.source.view||b.source.view.dtype===d.view.dtype)&&start<=offset&&offset+length<=start+bytes;}))error('external delivery is outside declared written output');
      for(const id of nodes.keys())for(const b of operations.get(id).bindings.values())if(b.source.kind==='resource'&&b.source.resource===d.resource){const start=b.source.view?.byteOffsetNumber??0;const bytes=b.source.view?.byteLengthNumber??resource.byteLengthNumber;if(start<offset+length&&offset<start+bytes)error('external copied output overlaps internal range');}
      delivery={...d,byteOffsetNumber:offset,byteLengthNumber:length};
    }
    externalOperations.set(item.operation,{...item,...(delivery?{delivery}:{})});
  }
  const initializationOperations=new Map();
  const initial=continuation.initializationOperations??[];
  if(!Array.isArray(initial)||initial.length>8)error('cold initialization bound exceeded');
  for(const item of initial) {
    if(!item||Object.keys(item).sort().join(',')!=='operation,readiness'||!operations.has(item.operation)||nodes.has(item.operation)||externalOperations.has(item.operation)||initializationOperations.has(item.operation))error('cold initialization operation declaration is invalid');
    const plan=operations.get(item.operation),d=item.readiness;
    if(plan.entry.executionProfile||!d||Object.keys(d).sort().join(',')!=='resource,success,view'||!d.view||Object.keys(d.view).sort().join(',')!=='byteOffset,dtype,elementCount'||d.view.dtype!=='u32'||!d.success||Object.keys(d.success).sort().join(',')!=='value,wordOffset')error('cold initialization requires ordinary entry and exact typed readiness');
    const decimal=value=>typeof value==='string'&&/^(0|[1-9][0-9]*)$/u.test(value)&&BigInt(value)<=BigInt(Number.MAX_SAFE_INTEGER)?Number(value):NaN;
    const start=decimal(d.view.byteOffset),count=decimal(d.view.elementCount),length=count*4,word=decimal(d.success.wordOffset),value=decimal(d.success.value),resource=plan.resources.get(d.resource);
    if(!resource||!Number.isSafeInteger(start)||start%4||!Number.isSafeInteger(length)||count<1||count>64||start+length>resource.byteLengthNumber||!Number.isSafeInteger(word)||word>=count||!Number.isSafeInteger(value)||value>0xffff_ffff)error('cold readiness extent or success field is invalid');
    if(![...plan.bindings.values()].some(({source})=>source.kind==='resource'&&source.resource===d.resource&&source.access!=='read'&&(!source.view||source.view.dtype==='u32')&&(source.view?.byteOffsetNumber??0)<=start&&start+length<=(source.view?.byteOffsetNumber??0)+(source.view?.byteLengthNumber??resource.byteLengthNumber)))error('cold readiness is outside declared written output');
    initializationOperations.set(item.operation,{...item,readiness:{...d,byteOffsetNumber:start,byteLengthNumber:length,wordOffsetNumber:word,valueNumber:value}});
  }
  if(nodes.size+externalOperations.size+initializationOperations.size!==operations.size)error('operation is outside declared cold/internal/external topology');
  const first=operations.values().next().value;const bindings=new Map(),allocatedResources=new Map();
  for(const [id,plan]of operations){for(const [name,binding]of plan.bindings)bindings.set(`${id}/${name}`,binding);for(const [name,resource]of plan.allocatedResources)allocatedResources.set(name,resource);}
  const graphBindingKeys=new Set();for(const id of nodes.keys()){const plan=operations.get(id);for(const parameter of plan.entry.parameters)graphBindingKeys.add(canonicalBindingIdentity(plan,parameter));}
  if(graphBindingKeys.size>limits.bindings)error('continuation unique named binding capacity exceeded');
  for(const {source}of bindings.values())if(source.initialContentSha256)for(const {source:other}of bindings.values()){
    if(other.kind!=='resource'||other.resource!==source.resource)continue;const start=other.view?.byteOffsetNumber??0,length=other.view?.byteLengthNumber??first.resources.get(other.resource).byteLengthNumber;
    if(start<source.view.byteOffsetNumber+source.view.byteLengthNumber&&source.view.byteOffsetNumber<start+length
      &&(other.access!=='read'||other.deviceEffects||(other.initialContentSha256&&(other.initialContentSha256!==source.initialContentSha256||start!==source.view.byteOffsetNumber||length!==source.view.byteLengthNumber))))error('immutable initial content overlaps incompatible operation');
  }
  return {...first,continuation,operations,nodes,externalOperations,initializationOperations,bindings,allocatedResources,compile:Object.freeze({headerProfile:'cuda-device',relocatableDeviceCode:true})};
}

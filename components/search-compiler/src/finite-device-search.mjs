import { createHash } from 'node:crypto';
import { canonicalIdentity, exactKeys, fail } from './validation.mjs';
import { normalizeAcceptedContractAuthority } from './accepted-authority.mjs';

const scalar = (name,type) => ({name,type});
const ABI = {
  validateRoot: [['ptr<u32>','u32'],'bool'], key: [['ptr<u32>','u32'],'u32'], equalState: [['ptr<u32>','u32','ptr<u32>','u32'],'bool'],
  actions: [['ptr<u32>','u32','ptr<u32>','u32','u32'],'u32'], actionValid: [['ptr<u32>','u32','ptr<u32>','u32'],'bool'], actionEqual: [['ptr<u32>','u32','ptr<u32>','u32'],'bool'],
  transition: [['ptr<u32>','u32','ptr<u32>','u32','ptr<u32>','u32'],'u32'], terminal: [['ptr<u32>','u32','ptr<u32>','u32'],'u32'], relation: [['ptr<u32>','u32','ptr<u32>','u32'],'u32'],
  initialize: [['ptr<u32>','u32','ptr<f32>','u32'],'void'], select: [['ptr<u32>','u32','ptr<f32>','u32','u32','u32'],'u32'],
  reserve: [['ptr<u32>','u32','u32'],'u32'], release: [['ptr<u32>','u32','u32','u32'],'void'],
  terminalValue: [['ptr<u32>','u32','ptr<f32>','u32'],'u32'], frontier: [['ptr<u32>','u32','ptr<f32>','u32','u32','u32','u32'],'u32'], valueValid: [['ptr<f32>','u32'],'bool'],
  prepare: [['ptr<u32>','u32','u32'],'u32'], apply: [['ptr<u32>','u32','u32','ptr<f32>','u32','u32','ptr<f32>','u32','ptr<u32>','u32','u32'],'u32'], complete: [['ptr<u32>','u32','u32'],'void'],
  decision: [['ptr<u32>','u32','ptr<f32>','u32','u32'],'u32'],
};
const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const PORTS={validateRoot:'validate-root',key:'identity-key',equalState:'equal-state',actions:'produce-actions',actionValid:'validate-action',actionEqual:'equal-action',transition:'apply-transition',terminal:'terminal-outcome',relation:'classify-path-relation',initialize:'initialize-policy-records',select:'select-next',reserve:'reserve-in-flight',release:'release-in-flight',terminalValue:'map-terminal-outcome',frontier:'classify-path-response',valueValid:'map-terminal-outcome',prepare:'prepare-backup',apply:'apply-backup-step',complete:'complete-backup',decision:'select-next'};
const launchConstraint={grid:['1','1','1'],block:['1','1','1']};
const reservedNames=new Set(['m','s','a','p','f','su','sf','out','cancellation','expectedArena','expectedRootGeneration','expectedFocusEpoch','node','generation','arena','candidate','cb','nb','sb','ab','tb','e','eb','pb','n','j','k','w','key','count','newCount','target','fresh','cause','oldNodes','oldEdges','root','stop','iteration','work','depth','incoming','ready','step','role','status','relation','ancestor','reason','frontier','selected','ep','ef','disposition','c']);
function words(bytes,label){const value=BigInt(bytes);if(value%4n!==0n)fail('FINITE_CORE_WORD_EXTENT',`${label} must be an exact u32/f32 extent`);return integer(value/4n,label);}
function integer(value,label,minimum=1,maximum=0xffff_fffe) {
  const number=Number(value); if(!Number.isSafeInteger(number)||number<minimum||number>maximum) fail('FINITE_CORE_BOUNDS',`${label} must have finite u32 bounds`); return number;
}
function digest(source) { return {algorithm:'sha256',sha256:createHash('sha256').update(source.replace(/\r\n?/g,'\n').replace(/\n+$/g,'')+'\n').digest('hex')}; }
function freeze(x){if(x&&typeof x==='object'){for(const child of Object.values(x))freeze(child);Object.freeze(x);}return x;}

export function createFiniteDeviceSearchCore(context,options) {
  const optional=['maxActions','externalParameters','frontierParticipation'];
  exactKeys(options,['name','maxIterations',...optional.filter(key=>Object.hasOwn(options,key))], 'FINITE_CORE_OPTIONS','finite core options');
  if(!identifier.test(options.name))fail('FINITE_CORE_NAME','finite core name must be an identifier');
  const authority=normalizeAcceptedContractAuthority(context.authority);
  const owners=['domain','graph','policy','resource','progress','output'];
  const profiles=new Map();
  for(const owner of owners){const result=context[owner];if(!result?.normalized||result.normalized.schema!==`cuda-mcgs.${owner}-profile/0.2.0`||canonicalIdentity(result.normalized).sha256!==result.identity?.sha256)fail('FINITE_CORE_OWNER',`${owner} requires an exact normalized selected owner`);profiles.set(result.normalized.id,result);}
  const g=context.graph.normalized,p=context.policy.normalized,d=context.domain.normalized,r=context.resource.normalized,progress=context.progress.normalized;
  if(g.mode!=='materialized'||g.reclamation.kind!=='none'||g.transposition.kind!=='verified-sharing'||p.evaluatorMode!=='absent')fail('FINITE_CORE_PROFILE','first finite profile requires verified sharing, no reclamation and deleted evaluator');
  if(g.domainProfile.identity.sha256!==context.domain.identity.sha256||p.graphProfile.identity.sha256!==context.graph.identity.sha256||p.domainProfile.identity.sha256!==context.domain.identity.sha256)fail('FINITE_CORE_OWNER','domain/graph/policy selection differs');
  for(const owner of ['domain','graph','policy'])if(!r.contributors.some(c=>c.profile.id===context[owner].normalized.id&&c.profile.identity.sha256===context[owner].identity.sha256))fail('FINITE_CORE_RESOURCE_OWNER','Resource plan differs from selected semantic owner identity');
  if(progress.resourcePlan.identity.sha256!==context.resource.identity.sha256||context.output.normalized.resourcePlan.identity.sha256!==context.resource.identity.sha256||context.output.normalized.progressPlan.identity.sha256!==context.progress.identity.sha256)fail('FINITE_CORE_RESOURCE_OWNER','Progress/Output Resource identity differs');
  const maxIterations=integer(options.maxIterations,'iterations');
  const work=progress.workClasses.find(w=>progress.contributors.find(c=>c.id===w.owner)?.profile.id===g.id);
  if(!work||BigInt(maxIterations)>BigInt(work.bounds.maxAdmitted))fail('FINITE_CORE_PROGRESS','iterations exceed selected Progress admission');
  const maxActions=integer(options.maxActions??Math.min(Number(work.bounds.maxProducedPerStep),Number(p.selection.maxCandidates)),'actions');
  if(BigInt(maxActions)>BigInt(p.selection.maxCandidates)||BigInt(maxActions)>BigInt(work.bounds.maxProducedPerStep))fail('FINITE_CORE_PROGRESS','expansion fanout exceeds selected owners');
  const participation=options.frontierParticipation??{kind:'controller-only',blockSize:1};
  exactKeys(participation,['kind','blockSize'],'FINITE_CORE_PARTICIPATION','frontier participation');
  if(participation.kind!=='controller-only'||participation.blockSize!==1)fail('FINITE_CORE_PARTICIPATION','collective frontier requires a separately qualified uniform-stage profile; no controller-only fallback');
  const byRole=new Map(g.objectKinds.map(x=>[x.id,x.role]));
  const layoutFor=role=>g.layouts.find(x=>byRole.get(x.objectKind)===role);
  const valueWords=role=>words(d.valueSchemas.find(x=>x.semanticRole===role)?.maxEncodedBytes??0,`${role} words`);
  const nodeCapacity=integer(layoutFor('state-node')?.capacity,'node capacity'),edgeCapacity=integer(layoutFor('parent-edge')?.capacity,'edge capacity'),pathDepth=integer(g.path.maxDepth,'path depth');
  if(BigInt(nodeCapacity)>BigInt(g.transposition.maxCollisionProbes))fail('FINITE_CORE_PROBES','linear verified lookup requires selected probes covering node capacity');
  const record=(scope,representation)=>{const list=p.records.filter(x=>x.scope===scope&&x.numeric.kind==='finite-numeric'&&x.numeric.representation===representation&&x.numeric.storageBits==='32'&&x.numeric.accumulationBits==='32');if(list.length!==1)fail('FINITE_CORE_POLICY_RECORD',`one selected ${scope} ${representation} record with explicit 32-bit accumulation is required`);return words(list[0].storage.sizeBytes,`${scope} policy record`);};
  const l={nodeCapacity,edgeCapacity,pathDepth,maxIterations,maxActions,stateWords:valueWords('state'),actionWords:valueWords('action'),outcomeWords:valueWords('terminal-outcome'),nodeU32Words:record('node','integer'),edgeU32Words:record('edge','integer'),nodeF32Words:record('node','floating'),edgeF32Words:record('edge','floating'),valueWords:integer(p.value.coordinates?.length,'value width')};
  integer(maxIterations*pathDepth*maxActions,'finite diagnostic/callback event bound');
  if(p.value.numeric?.representation!=='floating'||p.value.numeric?.storageBits!=='32')fail('FINITE_CORE_VALUE','first selected value family requires explicit f32 coordinates');
  l.nodeMeta=32;l.edgeMeta=l.nodeMeta+nodeCapacity*8;l.pathMeta=l.edgeMeta+edgeCapacity*8;l.metaWords=l.pathMeta+pathDepth*5;
  l.edgePolicyU32=nodeCapacity*l.nodeU32Words;l.policyU32Words=l.edgePolicyU32+edgeCapacity*l.edgeU32Words;
  l.edgePolicyF32=nodeCapacity*l.nodeF32Words;l.policyF32Words=l.edgePolicyF32+edgeCapacity*l.edgeF32Words;
  l.stagedStates=maxActions*l.actionWords;l.targets=l.stagedStates+maxActions*l.stateWords;l.newFlags=l.targets+maxActions;l.outcome=l.newFlags+maxActions;l.scratchU32Words=Math.max(l.outcome+l.outcomeWords,maxActions*l.edgeU32Words+maxActions);
  l.valueBase=maxActions*l.edgeF32Words;l.scratchF32Words=l.valueBase+l.valueWords;
  for(const [key,value]of Object.entries(l))integer(value,key);
  integer(nodeCapacity*l.stateWords,'resident state indexing');integer(edgeCapacity*l.actionWords,'resident action indexing');
  const required={graphBytes:(l.metaWords+nodeCapacity*l.stateWords+edgeCapacity*l.actionWords+l.scratchU32Words)*4,policyBytes:(l.policyU32Words+l.policyF32Words+l.scratchF32Words)*4,outputBytes:(32+l.actionWords)*4};
  const byteCapacity=profile=>r.classes.filter(x=>x.unit==='bytes'&&r.contributors.find(c=>c.id===x.contributor)?.profile.id===profile).reduce((n,x)=>n+BigInt(x.formula.maximumUnits),0n);
  if(BigInt(required.graphBytes)>byteCapacity(g.id)||BigInt(required.policyBytes)>byteCapacity(p.id)||BigInt(required.outputBytes)>BigInt(context.output.normalized.terminalEnvelope.maxBytes))fail('FINITE_CORE_RESOURCE','generated finite ranges exceed selected Resource/Output facts');
  const bundles=new Map();
  for(const bundle of context.sourceBundles??[]){const owner=profiles.get(bundle.ownerProfile);if(!owner||bundles.has(bundle.ownerProfile)||typeof bundle.source!=='string'||!Array.isArray(bundle.functions)||new Set(bundle.functions.map(f=>f.name)).size!==bundle.functions.length||digest(bundle.source).sha256!==owner.normalized.programContribution?.sourceIdentity?.sha256)fail('FINITE_CORE_SOURCE_OWNER','source bundle must match a selected owner source identity');bundles.set(bundle.ownerProfile,bundle);}
  const callbackNames=[...bundles.values()].flatMap(b=>b.functions.map(f=>f.name));
  if(callbackNames.some(symbol=>!identifier.test(symbol)||symbol===options.name||symbol.startsWith(options.name+'_'))||new Set(callbackNames).size!==callbackNames.length)fail('FINITE_CORE_SOURCE_OWNER','selected source symbols must be unique and cannot shadow generated callables');
  const external=options.externalParameters??[];
  for(const parameter of external){exactKeys(parameter,['name','type','ownerProfile','resourceClass'],'FINITE_CORE_EXTERNAL','external parameter');if(!identifier.test(parameter.name)||!/^ptr<(u32|i32|f32)>$/.test(parameter.type)||!profiles.has(parameter.ownerProfile)||!r.classes.some(c=>c.id===parameter.resourceClass&&r.contributors.find(o=>o.id===c.contributor)?.profile.id===parameter.ownerProfile))fail('FINITE_CORE_EXTERNAL','external capability must be typed and owned by a selected resource contributor');}
  if(new Set(external.map(x=>x.name)).size!==external.length||external.some(x=>reservedNames.has(x.name)||x.name===options.name||x.name.startsWith(options.name+'_')))fail('FINITE_CORE_EXTERNAL','duplicate or reserved external parameter');
  const h={};const calls=[];const callbackMetadata=[];
  for(const [slot,[types,returns]]of Object.entries(ABI)){
    const binding=context.hooks?.[slot],owner=profiles.get(binding?.ownerProfile),bundle=bundles.get(binding?.ownerProfile);
    const descriptor=bundle?.functions.find(f=>f.name===binding?.function);
    const expectedOwner=Object.keys(ABI).indexOf(slot)<9?context.domain.normalized.id:context.policy.normalized.id;
    if(!owner||binding.ownerProfile!==expectedOwner||!bundle||binding.port!==PORTS[slot]||!owner.normalized.ports.some(port=>port.id===binding.port)||!descriptor||descriptor.kind!=='device'||descriptor.returns!==returns||descriptor.parameters.length<types.length||types.some((type,i)=>descriptor.parameters[i]?.type!==type))fail('FINITE_CORE_HOOK',`${slot} requires a typed selected-owner public port reference`);
    if(slot==='frontier'&&(JSON.stringify(descriptor.participation)!==JSON.stringify(participation)||JSON.stringify(descriptor.launchConstraint)!==JSON.stringify(launchConstraint)))fail('FINITE_CORE_PARTICIPATION','frontier callback must declare the exact selected participation and launch constraint');
    const extras=descriptor.parameters.slice(types.length);if(extras.some(x=>!external.some(e=>e.name===x.name&&e.type===x.type)))fail('FINITE_CORE_HOOK',`${slot} has unbound typed extra parameters`);
    if(!identifier.test(descriptor.name))fail('FINITE_CORE_HOOK','callback symbol invalid');
    h[slot]=(...args)=>`${descriptor.name}(${[...args,...extras.map(e=>e.name)].join(', ')})`;calls.push(descriptor.name);callbackMetadata.push({slot,ownerProfile:binding.ownerProfile,port:binding.port,function:descriptor.name,parameters:descriptor.parameters,returns:descriptor.returns,...(slot==='frontier'?{participation,launchConstraint}:{})});
  }
  const generated=generate(options.name,l,h,external);
  const buffers=[['m','u32',l.metaWords,g.id],['s','u32',nodeCapacity*l.stateWords,g.id],['a','u32',edgeCapacity*l.actionWords,g.id],['p','u32',l.policyU32Words,p.id],['f','f32',l.policyF32Words,p.id],['su','u32',l.scratchU32Words,g.id],['sf','f32',l.scratchF32Words,p.id],['out','u32',32+l.actionWords,context.output.normalized.id]].map(([name,elementType,elements,ownerProfile])=>({name,elementType,elements,byteLength:elements*4,ownerProfile,exclusive:true,access:name==='out'?'write':'read-write'}));
  const callbackBufferRanges={state:l.stateWords,action:l.actionWords,outcome:l.outcomeWords,nodePolicyU32:l.nodeU32Words,edgePolicyU32:l.edgeU32Words,nodePolicyF32:l.nodeF32Words,edgePolicyF32:l.edgeF32Words,value:l.valueWords,candidateU32:maxActions*l.edgeU32Words,candidateF32:maxActions*l.edgeF32Words,transitionDestination:l.stateWords,actionProduction:maxActions*l.actionWords};
  const normalized={contract:'cuda-mcgs.finite-device-search-core/0.1.0',authority:authority.identities.contractSet.sha256,owners:owners.map(owner=>({id:context[owner].normalized.id,identity:context[owner].identity.sha256})),hookBindings:context.hooks,callbackMetadata,callbackBufferRanges,buffers,layout:l,frontierParticipation:participation,externalParameters:external,sourceIdentity:digest(generated.source)};
  const programContributions=contributions(generated,context,options.name);
  return freeze({...generated,programContributions,buffers,callbackBufferRanges,layout:l,required,normalized,identity:canonicalIdentity(normalized),sourceIdentity:normalized.sourceIdentity,launch:launchConstraint,requiredCudaHelpers:['gpu.thread.globalX','gpu.mailbox.loadAcquireSystem','gpu.atomic.loadAcquireDevice','gpu.atomic.storeReleaseDevice'],compileRequirements:{headerProfile:'cuda-cccl'},selectedCallbacks:[...new Set(calls)],ownerProfiles:{graph:g.id,progress:progress.id,policy:p.id},preconditions:['exact-admitted-buffer-extents','one-controller-selected-participation','immutable-focus-per-operation','one-invocation-per-finite-operation-profile','no-reclamation','no-host-active-progress']});
}

function contributions(generated,context,name){
  const split=generated.source.indexOf(`function ${name}(`);
  const fragments=[generated.source.slice(0,split),generated.source.slice(split)];
  const sets=[generated.functions.slice(0,-1),generated.functions.slice(-1)];
  return sets.map((set,i)=>{
    const owner=context[i===0?'graph':'progress'].normalized.id,unit=owner+'.finite-source';
    const functions=set.map(fn=>{
      const start=fragments[i].indexOf(`function ${fn.name}(`),end=fragments[i].indexOf('\nfunction ',start+1),body=fragments[i].slice(start,end<0?undefined:end);
      const names=[...generated.functions.map(x=>x.name),...Object.values(context.hooks).map(x=>x.function)];
      const calls=[...new Set(names.filter(symbol=>symbol!==fn.name&&body.includes(symbol+'(')))];
      const helpers=[...new Set([...body.matchAll(/gpu\.(?:thread|mailbox|atomic)\.[A-Za-z]+/g)].map(m=>m[0]))];
      return {name:fn.name,executionRole:'device-callable',parameters:fn.parameters.map(p=>({...p,...(p.type.startsWith('sideband<')?{sidebandRole:'framework-cancellation'}:{})})),returns:fn.returns,sourceUnit:unit,ownerProfile:owner,semanticRole:owner+'.finite-callable',calls,helpers,...(i===1?{launchConstraint}:{})};
    });
    return {ownerProfile:owner,sourceUnit:unit,source:fragments[i],sourceIdentity:digest(fragments[i]),functions};
  });
}

function generate(name,L,H,external){
  const U=x=>`gpu.u32(${x})`,N=slot=>`${name}_${slot}`,ext=external.map(x=>x.name),tail=ext.length?', '+ext.join(', '):'';
  const node=n=>`${U(L.nodeMeta)} + ${n} * ${U(8)}`,edge=e=>`${U(L.edgeMeta)} + ${e} * ${U(8)}`;
  const source=`
function ${N('valid')}(m,node,generation,arena) {if(arena!==m[${U(10)}]||node>=m[${U(0)}]){return false;}let b=${node('node')};return gpu.atomic.loadAcquireDevice(m,b)===${U(1)}&&m[b+${U(1)}]===generation;}
function ${N('lookup')}(m,s,candidate,cb${tail}) {let key=${H.key('candidate','cb')};for(let n=${U(0)};n<m[${U(0)}];n++){let b=${node('n')};if(gpu.atomic.loadAcquireDevice(m,b)===${U(1)}&&m[b+${U(2)}]===key&&${H.equalState('s',`n*${U(L.stateWords)}`,'candidate','cb')}){return n;}}return ${U(4294967295)};}
function ${N('gather')}(m,p,f,su,sf,node) {let b=${node('node')};let e=m[b+${U(3)}];let count=${U(0)};for(let j=${U(0)};j<${U(L.maxActions)};j++){if(e===${U(4294967295)}){break;}if(e>=m[${U(1)}]){return ${U(4294967295)};}let eb=${edge('e')};if(gpu.atomic.loadAcquireDevice(m,eb)!==${U(1)}||m[eb+${U(1)}]!==node||!${N('valid')}(m,m[eb+${U(3)}],m[eb+${U(4)}],m[${U(10)}])){return ${U(4294967295)};}for(let w=${U(0)};w<${U(L.edgeU32Words)};w++){su[count*${U(L.edgeU32Words)}+w]=p[${U(L.edgePolicyU32)}+e*${U(L.edgeU32Words)}+w];}for(let w=${U(0)};w<${U(L.edgeF32Words)};w++){sf[count*${U(L.edgeF32Words)}+w]=f[${U(L.edgePolicyF32)}+e*${U(L.edgeF32Words)}+w];}su[${U(L.maxActions*L.edgeU32Words)}+count]=e;count++;e=m[eb+${U(5)}];}if(e!==${U(4294967295)}){return ${U(4294967295)};}return count;}
function ${N('expand')}(m,s,a,p,f,su,sf,node${tail}) {
  let nb=${node('node')};let sb=node*${U(L.stateWords)};
  let count=${H.actions('s','sb','su',U(0),U(L.maxActions))};if(count>${U(L.maxActions)}){return ${U(7)};}
  if(count===${U(0)}){m[nb+${U(5)}]=${U(1)};m[nb+${U(4)}]=${U(0)};m[nb+${U(3)}]=${U(4294967295)};return ${U(0)};}
  let newCount=${U(0)};
  for(let j=${U(0)};j<count;j++){
    let ab=j*${U(L.actionWords)};if(!${H.actionValid('s','sb','su','ab')}){return ${U(7)};}
    for(let k=${U(0)};k<j;k++){if(${H.actionEqual('su','ab','su',`k*${U(L.actionWords)}`)}){return ${U(7)};}}
    let cb=${U(L.stagedStates)}+j*${U(L.stateWords)};let cause=${H.transition('s','sb','su','ab','su','cb')};m[${U(14)}]=m[${U(14)}]+${U(1)};if(cause!==${U(0)}){m[${U(30)}]=cause;return ${U(7)};}
    if(!${H.validateRoot('su','cb')}){return ${U(7)};}
    let target=${N('lookup')}(m,s,su,cb${tail});let fresh=${U(0)};
    if(target===${U(4294967295)}){for(let k=${U(0)};k<j;k++){if(${H.equalState('su','cb','su',`${U(L.stagedStates)}+k*${U(L.stateWords)}`)}){target=su[${U(L.targets)}+k];break;}}}
    if(target===${U(4294967295)}){target=m[${U(0)}]+newCount;newCount++;fresh=${U(1)};}else{m[${U(21)}]=m[${U(21)}]+${U(1)};}
    su[${U(L.targets)}+j]=target;su[${U(L.newFlags)}+j]=fresh;
  }
  if(newCount>${U(L.nodeCapacity)}-m[${U(0)}]){return ${U(3)};}if(count>${U(L.edgeCapacity)}-m[${U(1)}]){return ${U(4)};}
  let oldNodes=m[${U(0)}];let oldEdges=m[${U(1)}];
  for(let j=${U(0)};j<count;j++){
    let target=su[${U(L.targets)}+j];let tb=${node('target')};
    if(su[${U(L.newFlags)}+j]!==${U(0)}){m[tb]=${U(2)};m[tb+${U(1)}]=${U(1)};m[tb+${U(2)}]=${H.key('su',`${U(L.stagedStates)}+j*${U(L.stateWords)}`)};m[tb+${U(3)}]=${U(4294967295)};m[tb+${U(4)}]=${U(0)};m[tb+${U(5)}]=${U(0)};m[tb+${U(6)}]=${U(0)};for(let w=${U(0)};w<${U(L.stateWords)};w++){s[target*${U(L.stateWords)}+w]=su[${U(L.stagedStates)}+j*${U(L.stateWords)}+w];}${H.initialize('p',`target*${U(L.nodeU32Words)}`,'f',`target*${U(L.nodeF32Words)}`)};gpu.atomic.storeReleaseDevice(m,tb,${U(1)});}
    let e=oldEdges+j;let eb=${edge('e')};m[eb]=${U(2)};m[eb+${U(1)}]=node;m[eb+${U(2)}]=m[nb+${U(1)}];m[eb+${U(3)}]=target;m[eb+${U(4)}]=${U(1)};m[eb+${U(5)}]=${U(4294967295)};if(j+${U(1)}<count){m[eb+${U(5)}]=e+${U(1)};}m[eb+${U(7)}]=${U(1)};
    for(let w=${U(0)};w<${U(L.actionWords)};w++){a[e*${U(L.actionWords)}+w]=su[j*${U(L.actionWords)}+w];}${H.initialize('p',`${U(L.edgePolicyU32)}+e*${U(L.edgeU32Words)}`,'f',`${U(L.edgePolicyF32)}+e*${U(L.edgeF32Words)}`)};gpu.atomic.storeReleaseDevice(m,eb,${U(1)});
  }
  m[${U(0)}]=oldNodes+newCount;m[${U(1)}]=oldEdges+count;m[nb+${U(3)}]=oldEdges;m[nb+${U(4)}]=count;gpu.atomic.storeReleaseDevice(m,nb+${U(5)},${U(1)});m[${U(15)}]=m[${U(15)}]+${U(1)};return ${U(0)};
}
function ${name}(m,s,a,p,f,su,sf,out,cancellation,expectedArena,expectedRootGeneration,expectedFocusEpoch${tail}) {
  if(gpu.thread.globalX()!==${U(0)}){return;}
  for(let j=${U(0)};j<${U(32+L.actionWords)};j++){out[j]=${U(0)};}
  if(m[${U(10)}]!==expectedArena||m[${U(11)}]!==expectedFocusEpoch||expectedArena===${U(0)}||m[${U(0)}]>${U(L.nodeCapacity)}||m[${U(1)}]>${U(L.edgeCapacity)}||m[${U(9)}]!==${U(0)}||m[${U(7)}]!==${U(0)}){out[${U(0)}]=${U(6)};return;}
  for(let c=${U(3)};c<${U(27)};c++){if(c===${U(3)}||c===${U(4)}||(c>=${U(14)}&&c<=${U(21)})||c===${U(26)}){if(m[c]>${U(4294967294-L.maxIterations*L.pathDepth*L.maxActions)}){out[${U(0)}]=${U(10)};return;}}}
  if(m[${U(0)}]===${U(0)}){if(expectedRootGeneration!==${U(1)}||m[${U(8)}]!==${U(0)}){out[${U(0)}]=${U(6)};return;}if(!${H.validateRoot('s',U(0))}){out[${U(0)}]=${U(7)};return;}let nb=${U(L.nodeMeta)};m[nb]=${U(2)};m[nb+${U(1)}]=${U(1)};m[nb+${U(2)}]=${H.key('s',U(0))};m[nb+${U(3)}]=${U(4294967295)};m[nb+${U(4)}]=${U(0)};m[nb+${U(5)}]=${U(0)};m[nb+${U(6)}]=${U(0)};${H.initialize('p',U(0),'f',U(0))};gpu.atomic.storeReleaseDevice(m,nb,${U(1)});m[${U(0)}]=${U(1)};}
  let root=m[${U(8)}];if(!${N('valid')}(m,root,expectedRootGeneration,expectedArena)){out[${U(0)}]=${U(6)};return;}
  m[${U(7)}]=${U(1)};let stop=${U(0)};
  for(let iteration=${U(0)};iteration<${U(L.maxIterations)};iteration++){
    if(gpu.mailbox.loadAcquireSystem(cancellation)!==${U(0)}){stop=${U(2)};break;}
    if(m[${U(2)}]>=${U(4294967294)}){stop=${U(10)};break;}m[${U(2)}]=m[${U(2)}]+${U(1)};let work=m[${U(2)}];m[${U(9)}]=work;m[${U(16)}]=m[${U(16)}]+${U(1)};let depth=${U(0)};let node=root;let incoming=${U(4294967295)};let ready=false;
    for(let step=${U(0)};step<${U(L.pathDepth)};step++){
      if(!${N('valid')}(m,node,${U(1)},expectedArena)){stop=${U(6)};break;}
      let pb=${U(L.pathMeta)}+depth*${U(5)};m[pb]=node;m[pb+${U(1)}]=${U(1)};m[pb+${U(2)}]=incoming;m[pb+${U(3)}]=${U(1)};m[pb+${U(4)}]=work;let nb=${node('node')};m[nb+${U(6)}]=m[nb+${U(6)}]+${U(1)};depth++;m[${U(23)}]=depth;
      if(gpu.mailbox.loadAcquireSystem(cancellation)!==${U(0)}){stop=${U(2)};break;}
      let sb=node*${U(L.stateWords)};let role=${H.terminal('s','sb','su',U(L.outcome))};if(role>${U(1)}){m[${U(30)}]=role;stop=${U(7)};break;}
      if(role===${U(1)}){let status=${H.terminalValue('su',U(L.outcome),'sf',U(L.valueBase))};if(status!==${U(0)}){stop=${U(8)};break;}ready=true;break;}
      let relation=${U(0)};for(let j=${U(0)};j+${U(1)}<depth;j++){let ancestor=m[${U(L.pathMeta)}+j*${U(5)}];relation=${H.relation('s','sb','s',`ancestor*${U(L.stateWords)}`)};if(relation!==${U(0)}){break;}}
      let reason=${U(0)};if(relation!==${U(0)}){reason=${U(1)};}else if(depth===${U(L.pathDepth)}){reason=${U(2)};}
      let frontier=${H.frontier('s','sb','sf',U(L.valueBase),'depth','reason','relation')};if(frontier===${U(0)}){ready=true;break;}if(frontier>${U(1)}){stop=${U(8)};break;}if(reason!==${U(0)}){stop=${U(5)};break;}
      if(m[nb+${U(5)}]===${U(0)}){let status=${N('expand')}(m,s,a,p,f,su,sf,node${tail});if(status!==${U(0)}){stop=status;break;}}
      let count=${N('gather')}(m,p,f,su,sf,node);if(count===${U(4294967295)}){stop=${U(6)};break;}if(count===${U(0)}){stop=${U(9)};break;}
      let selected=${H.select('su',U(0),'sf',U(0),'count','work')};if(selected>=count){stop=${U(8)};break;}let e=su[${U(L.maxActions*L.edgeU32Words)}+selected];let eb=${edge('e')};let status=${H.reserve('p',`${U(L.edgePolicyU32)}+e*${U(L.edgeU32Words)}`,'work')};if(status!==${U(0)}){stop=${U(8)};break;}m[${U(18)}]=m[${U(18)}]+${U(1)};m[${U(20)}]=m[${U(20)}]+${U(1)};incoming=e;node=m[eb+${U(3)}];
    }
    if(!ready&&stop===${U(0)}){stop=${U(5)};}
    if(ready){if(!${H.valueValid('sf',U(L.valueBase))}||${H.prepare('p',`root*${U(L.nodeU32Words)}`,'work')}!==${U(0)}){stop=${U(8)};ready=false;}}
    if(ready&&gpu.mailbox.loadAcquireSystem(cancellation)!==${U(0)}){stop=${U(2)};ready=false;}
    if(ready){m[${U(13)}]=${U(1)};for(let j=depth;j>${U(0)};j--){let pb=${U(L.pathMeta)}+(j-${U(1)})*${U(5)};let n=m[pb];let e=m[pb+${U(2)}];if(m[pb+${U(4)}]!==work||!${N('valid')}(m,n,m[pb+${U(1)}],expectedArena)){stop=${U(11)};break;}let ep=${U(4294967295)};let ef=${U(4294967295)};if(e!==${U(4294967295)}){let eb=${edge('e')};if(e>=m[${U(1)}]||m[eb+${U(7)}]!==m[pb+${U(3)}]){stop=${U(11)};break;}ep=${U(L.edgePolicyU32)}+e*${U(L.edgeU32Words)};ef=${U(L.edgePolicyF32)}+e*${U(L.edgeF32Words)};}if(${H.apply('p',`n*${U(L.nodeU32Words)}`,'ep','f',`n*${U(L.nodeF32Words)}`,'ef','sf',U(L.valueBase),'s',`n*${U(L.stateWords)}`,'work')}!==${U(0)}){stop=${U(11)};break;}}
      if(stop!==${U(11)}){${H.complete('p',`root*${U(L.nodeU32Words)}`,'work')};m[${U(3)}]=m[${U(3)}]+${U(1)};m[${U(12)}]=work;m[${U(13)}]=${U(2)};}else{m[${U(13)}]=${U(3)};m[${U(26)}]=m[${U(26)}]+${U(1)};}
    }else{m[${U(4)}]=m[${U(4)}]+${U(1)};}
    for(let j=${U(0)};j<depth;j++){let pb=${U(L.pathMeta)}+j*${U(5)};let n=m[pb];let e=m[pb+${U(2)}];let nb=${node('n')};if(e!==${U(4294967295)}){let disposition=${U(0)};if(ready){disposition=${U(1)};}if(stop===${U(11)}){disposition=${U(2)};}${H.release('p',`${U(L.edgePolicyU32)}+e*${U(L.edgeU32Words)}`,'work','disposition')};m[${U(19)}]=m[${U(19)}]+${U(1)};}if(m[nb+${U(6)}]===${U(0)}){stop=${U(11)};}else{m[nb+${U(6)}]=m[nb+${U(6)}]-${U(1)};}m[pb+${U(4)}]=${U(0)};}
    m[${U(23)}]=${U(0)};m[${U(9)}]=${U(0)};m[${U(17)}]=m[${U(17)}]+${U(1)};if(stop!==${U(0)}){break;}
  }
  if(stop===${U(0)}){stop=${U(1)};}m[${U(6)}]=stop;m[${U(7)}]=${U(3)};
  for(let j=${U(0)};j<${U(32)};j++){out[j]=m[j];}out[${U(0)}]=stop;out[${U(24)}]=${U(0)};
  if(m[${U(10)}]===expectedArena&&m[${U(11)}]===expectedFocusEpoch&&${N('valid')}(m,root,expectedRootGeneration,expectedArena)&&stop!==${U(11)}){let count=${N('gather')}(m,p,f,su,sf,root);if(count!==${U(4294967295)}){let selected=${H.decision('su',U(0),'sf',U(0),'count')};if(selected<count){let e=su[${U(L.maxActions*L.edgeU32Words)}+selected];out[${U(24)}]=${U(1)};out[${U(25)}]=e;for(let w=${U(0)};w<${U(L.actionWords)};w++){out[${U(32)}+w]=a[e*${U(L.actionWords)}+w];}}}}
}
`;
  const ptr=name=>scalar(name,'ptr<u32>'),fl=name=>scalar(name,'ptr<f32>'),u=name=>scalar(name,'u32');
  const dev=(name,parameters,returns)=>({name,kind:'device',parameters,returns});
  const extra=external.map(({name,type})=>({name,type}));
  return {source,functions:[dev(N('valid'),[ptr('m'),u('node'),u('generation'),u('arena')],'bool'),dev(N('lookup'),[ptr('m'),ptr('s'),ptr('candidate'),u('cb'),...extra],'u32'),dev(N('gather'),[ptr('m'),ptr('p'),fl('f'),ptr('su'),fl('sf'),u('node')],'u32'),dev(N('expand'),[ptr('m'),ptr('s'),ptr('a'),ptr('p'),fl('f'),ptr('su'),fl('sf'),u('node'),...extra],'u32'),dev(name,[ptr('m'),ptr('s'),ptr('a'),ptr('p'),fl('f'),ptr('su'),fl('sf'),ptr('out'),scalar('cancellation','sideband<host-to-device,u32>'),u('expectedArena'),u('expectedRootGeneration'),u('expectedFocusEpoch'),...extra],'void')]};
}

import {canonicalIdentity,fail,exactKeys} from './validation.mjs';
import {residentDeviceSearchContract} from './resident-device-search-contract.mjs';
import {normalizeAcceptedContractAuthority} from './accepted-authority.mjs';
import {createDeviceSourcePartition} from './device-source-partition.mjs';
import {validateResidentPolicyRecordLayout} from './resident-policy-layout.mjs';
const width={u32:4,i32:4,f32:4,u64:8};
const ref=id=>({algorithm:'sha256',sha256:canonicalIdentity(id).sha256});
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const roles=['domain','graph','policy','evaluator','resource','progress','output','session'];

export function createResidentDeviceSearchCore(context,options){
  exactKeys(options,['resourceClasses',...['externalResourceClasses','artifactBindings'].filter(k=>Object.hasOwn(options,k))],'RESIDENT_CORE_OPTIONS','resident constructor options');
  const authority=normalizeAcceptedContractAuthority(context.authority),d=context.sourceDescriptor;
  if(d?.contract!==residentDeviceSearchContract.contract||d.status!=='cold-source-projection')fail('RESIDENT_CORE_SOURCE','actual cold producer descriptor is required');
  const selected=new Map();
  for(const role of roles){const result=context[role];if(result?.normalized?.schema!==`cuda-mcgs.${role}-profile/0.2.0`||canonicalIdentity(result.normalized).sha256!==result.identity?.sha256)fail('RESIDENT_CORE_OWNER',`exact normalized ${role} is required`);selected.set(result.normalized.id,result);}
  for(const role of ['graph','resource','progress','output','session'])if(context[role].normalized.programContribution?.sourceIdentity?.sha256!==d.contributions[role].sourceIdentity.sha256)fail('RESIDENT_CORE_SOURCE',`${role} source differs from the exact selected producer`);
  const R=context.resource.normalized,E=context.evaluator.normalized,P=context.policy.normalized;
  if(P.evaluatorMode!=='evaluation-only'||E.mode!=='evaluation-only'||context.graph.normalized.reclamation.kind!=='enabled'||context.session.normalized.root.establishment!=='pre-ignition-validate-admit-materialize')fail('RESIDENT_CORE_PROFILE','selected resident owner semantics differ');
  if(context.evaluatorRuntime?.device?.source!==d.sourceBundles.find(b=>b.ownerProfile===E.id)?.source)fail('RESIDENT_CORE_EVALUATOR','Evaluator source differs from cold producer');
  validateResidentPolicyRecordLayout(P,d.layout);
  if(P.value.numeric.representation!=='floating'||P.value.numeric.storageBits!=='32'||P.value.coordinates.length!==2)fail('RESIDENT_CORE_VALUE','first resident value ABI requires exactly two selected f32 coordinates');
  for(const [role,key]of [['state','stateWords'],['action','actionWords'],['terminal-outcome','outcomeWords']]){const value=context.domain.normalized.valueSchemas.find(v=>v.semanticRole===role);if(!value||BigInt(value.maxEncodedBytes)!==BigInt(d.layout[key])*4n)fail('RESIDENT_CORE_DOMAIN_RECORD','opaque Domain record width differs from selected value schema');}
  if(BigInt(d.layout.maxWork)*BigInt(d.layout.pathDepth)*2n>0xffff_fffen)fail('RESIDENT_CORE_COUNTER','selected work/depth exceeds finite lease/diagnostic counter bounds');
  const resources=R.providerRequirements.map(provider=>({id:R.id+'.buffer-'+provider.id.replace(/[^a-z0-9]+/gu,'-'),ownerProfile:R.id,providerRequirement:provider.id,materialization:provider.unit==='bytes'&&provider.memorySpaces.some(s=>['device-search','device-publication'].includes(s))?'resident-storage':'semantic-only',unit:provider.unit,capacity:provider.capacity,alignment:provider.alignment,memorySpaces:[...provider.memorySpaces],access:[...provider.access]}));
  const mappings={...options.resourceClasses,...options.externalResourceClasses},positions=new Map(),placements=[],byBuffer=new Map(),artifacts=options.artifactBindings??{};
  const runtime=context.evaluatorRuntime,externalDescriptors=new Map([...runtime.resources,...runtime.tensorBindings].map(r=>[r.parameterName,r]));
  const buffers=[...d.buffers,...d.externalParameters.map(x=>{const r=externalDescriptors.get(x.name),elements=x.elementCount??r?.elementCount;if(!Number.isSafeInteger(elements)||elements<=0||elements>0xffff_fffe)fail('RESIDENT_CORE_EXTENT',`${x.name} requires its selected owner finite element count`);const dtype=/^ptr<(.+)>$/u.exec(x.type)?.[1];return{name:x.name,dtype,elementCount:elements,byteLength:elements*width[dtype],ownerProfile:x.ownerProfile,owner:'external',runtime:r};})];
  for(const b of buffers){
    const klass=R.classes.find(c=>c.id===mappings[b.name]),contributor=R.contributors.find(c=>c.id===klass?.contributor),partition=R.partitions.find(p=>p.class===klass?.id),pool=R.pools.find(p=>p.id===partition?.pool),resource=resources.find(r=>r.providerRequirement===pool?.providerRequirement);
    const owner=b.ownerProfile??context[b.owner].normalized.id,expected=context[b.owner]?.normalized.resourceContribution??context[b.owner]?.normalized.progressContribution;
    if(!klass||klass.unit!=='bytes'||!partition||partition.alias.kind!=='none'||!resource||resource.materialization!=='resident-storage'||!(contributor.profile.id===owner&&contributor.profile.identity.sha256===selected.get(owner)?.identity.sha256||expected&&contributor.profile.id===expected.id&&contributor.profile.identity.sha256===expected.identity.sha256))fail('RESIDENT_CORE_RESOURCE_OWNER',`${b.name} must bind a selected byte class owned by its actual contributor`);
    const alignment=BigInt(Math.max(width[b.dtype],Number(klass.alignment))),at=positions.get(klass.id)??0n,offset=((at+alignment-1n)/alignment)*alignment,end=offset+BigInt(b.byteLength);
    if(end>BigInt(partition.capacity)||end>BigInt(klass.formula.maximumUnits))fail('RESIDENT_CORE_RESOURCE',`${b.name} exceeds finite selected class capacity`);
    positions.set(klass.id,end);
    const source={kind:'resource',resource:resource.id,access:'read-write',view:{dtype:b.dtype,byteOffset:String(BigInt(partition.offset)+offset),elementCount:String(b.elementCount)}};
    if(artifacts[b.name]){
      const a=artifacts[b.name],owned=E.artifacts.find(a0=>a0.id===a.artifactId),ownedResource=E.resources.find(r=>r.id===a.evaluatorResource);
      if(a.ownerProfile!==E.id||owned?.identity.sha256!==a.artifactIdentity?.sha256||owned.provenance.contentSha256!==a.contentSha256||owned.mutability!=='immutable'||owned.scope!=='engine'||owned.residentBeforeIgnition!==true||ownedResource?.class!=='artifact'||klass.sourceResource!==ownedResource.id||offset!==0n||BigInt(b.byteLength)!==BigInt(partition.capacity))fail('RESIDENT_CORE_ARTIFACT',`${b.name} requires the exact whole selected immutable artifact partition`);
      source.access='read';source.artifact=structuredClone(a);
    }else if(b.name==='initialRootInput'){source.access='read';}
    else source.initialization='zero';
    const effects=b.runtime?.deviceEffects;
    if(effects)source.deviceEffects=[...effects];
    if(['authority','snapshot','command'].includes(b.name))source.deviceEffects=['atomic-load-acquire-device','atomic-store-release-device','atomic-cas-relaxed-device'];
    const placed={...b,resourceClass:klass.id,source,byteOffset:Number(BigInt(partition.offset)+offset)};placements.push(placed);byBuffer.set(b.name,placed);
  }
  const sourceSelectionArtifacts=[];
  const rawContributions=[...d.sourceBundles.map(b=>({...b,sourceIdentity:selected.get(b.ownerProfile)?.normalized.programContribution?.sourceIdentity})),...Object.entries(d.contributions).map(([role,c])=>({...c,ownerProfile:context[role].normalized.id}))];
  const names=rawContributions.flatMap(c=>c.functions.map(f=>f.name));
  const programContributions=rawContributions.map(c=>{
    const owner=selected.get(c.ownerProfile),unit=c.ownerProfile+'.resident-source',source=c.source.replace(/\r\n?/gu,'\n').replace(/\n+$/gu,'')+'\n';
    if(owner?.normalized.programContribution.sourceIdentity.sha256!==c.sourceIdentity?.sha256)fail('RESIDENT_CORE_SOURCE','selected contribution source identity differs');
    const declaration=owner.normalized.programContribution.provenance;
    const document={schema:'cuda-mcgs.resident-source-owner-selection/0.1.0',owner:'canonicalSearchCompiler',contractSet:contentIdentity(authority.identities.contractSet),profile:{id:owner.normalized.id,identity:contentIdentity(owner.identity)},sourceIdentity:c.sourceIdentity,functions:c.functions.map(fn=>({name:fn.name,parameters:fn.parameters,returns:fn.returns}))};
    const selectionReference={id:'cuda-mcgs.resident-source-owner-selection/0.1.0',version:'0.1.0',sha256:canonicalIdentity(document).sha256};
    sourceSelectionArtifacts.push({reference:selectionReference,document});
    const provenance={origin:declaration.origin,revision:declaration.revision,license:declaration.license,trust:declaration.origin==='first-party'?'first-party-reviewed':'explicit-third-party',review:declaration.review??selectionReference};
    const starts=c.functions.map(fn=>({fn,at:source.indexOf(`function ${fn.name}(`)})).sort((a,b)=>a.at-b.at);
    if(starts.some(x=>x.at<0))fail('RESIDENT_CORE_FUNCTION_SOURCE','typed callable definition absent from owned source');
    const functions=starts.map(({fn,at},i)=>{
      const text=source.slice(at,i+1<starts.length?starts[i+1].at:undefined),body=text.slice(text.indexOf('{')+1);
      const calls=fn.calls??names.filter(n=>n!==fn.name&&new RegExp('\\b'+n+'\\s*\\(','u').test(body));
      const helpers=[...new Set([...body.matchAll(/gpu\.(?:thread|atomic|barrier|execution)\.[A-Za-z]+/gu)].map(m=>m[0]))];
      return{name:fn.name,executionRole:fn.kind==='kernel'?'runtime-entry':'device-callable',parameters:fn.parameters.map(({name,type})=>({name,type})),returns:fn.returns,sourceUnit:unit,ownerProfile:c.ownerProfile,semanticRole:c.ownerProfile+'.resident-callable',calls:[...new Set(calls)],helpers,...(fn.launchConstraint?{launchConstraint:fn.launchConstraint}:{}),...(fn.executionProfile?{executionProfile:fn.executionProfile}:{})};
    });
    return{ownerProfile:c.ownerProfile,sourceUnit:unit,source,sourceIdentity:c.sourceIdentity,functions,sourceUnitDeclaration:{id:unit,ownerProfile:c.ownerProfile,semanticOwner:c.ownerProfile,kind:'source-owner',source,sourceIdentity:c.sourceIdentity,contributionIdentity:owner.normalized.programContribution.sourceIdentity,functions:functions.map(f=>f.name),provenance}};
  });
  const functions=programContributions.flatMap(c=>c.functions),scalarSchema={id:'cuda-mcgs.resident-fence-u32/0.1.0',version:'0.1.0',sha256:ref({type:'u32',meaning:'selected-resident-root-fence-or-cold-arena'}).sha256};
  const operationIds=Object.fromEntries(Object.keys(d.entryPoints).map(role=>[role,context[role==='body'||role==='controller'?'progress':role==='observer'?'output':'session'].normalized.id+'.operation-'+role]));
  const operations=Object.entries(d.entryPoints).map(([role,entryPoint])=>{
    const fn=functions.find(f=>f.name===entryPoint),bindings=fn.parameters.map(p=>{
      if(!p.type.startsWith('ptr<'))return{parameter:p.name,source:{kind:'scalar',schema:scalarSchema}};
      const b=byBuffer.get(p.name);if(!b)fail('RESIDENT_CORE_BINDING',`kernel ${entryPoint} lacks selected buffer ${p.name}`);
      const source=structuredClone(b.source);
      if(role==='observer'&&p.name==='authority'){source.access='read';source.deviceEffects=['atomic-load-acquire-device'];}
      if((role==='observer'&&p.name==='restriction')||(role==='command'&&p.name==='commandStage')){source.access='read';}
      return{parameter:p.name,source};
    });return{id:operationIds[role],entryPoint,bindings,grid:['1','1','1'],block:[role==='body'?'32':'1','1','1'],dynamicSharedBytes:'0',maxPending:'1'};
  });
  const readiness=byBuffer.get('bootstrapResult').source,reply=byBuffer.get('commandReply').source,observation=byBuffer.get('observerOut').source,terminal=byBuffer.get('out').source;
  const continuation={contract:'cuda-mcgs.device-continuation/0.1.0',initializationOperations:[{operation:operationIds.bootstrap,readiness:{resource:readiness.resource,view:readiness.view,success:{wordOffset:'0',value:'0'}}}],nodes:[{operation:operationIds.control,after:[]},{operation:operationIds.body,after:[operationIds.control]},{operation:operationIds.controller,after:[operationIds.body]}],controllerOperation:operationIds.controller,externalOperations:[{operation:operationIds.command,role:'external-control',delivery:{resource:reply.resource,view:reply.view}},{operation:operationIds.observer,role:'read-only-observation',delivery:{resource:observation.resource,view:observation.view}}]};
  const O=context.output.normalized;
  const delivery={id:O.id+'.resident-terminal-delivery',semanticOwner:O.id,role:'terminal-output',terminalSchema:O.terminal.schema,resource:terminal.resource,byteOffset:terminal.view.byteOffset,byteLength:String(byBuffer.get('out').byteLength),readiness:'terminal-completed',mode:'asynchronous-bounded-read',maxTransfers:O.publication.maxTransfers,borrow:O.terminal.borrow,asyncRead:O.terminal.asyncRead,cleanup:O.terminal.cleanup,lifetime:'terminal-result'};
  const importIdentity=runtime.device.importIdentity;
  const deviceImports=[{schema:'cuda-mcgs.device-js-import-declaration/0.1.0',id:E.id+'.resident-tensor-import',ownerProfile:E.id,importName:importIdentity.name,alias:importIdentity.as,library:{...importIdentity.library}}];
  let deviceSourcePartition;
  if(functions.length>64){
    const byName=new Map(functions.map(f=>[f.name,f])),leaf=new Set(functions.filter(f=>[context.domain.normalized.id,P.id].includes(f.ownerProfile)).map(f=>f.name));
    leaf.add(d.hooks.encodeEvaluation.function);
    const pending=[...leaf];for(let i=0;i<pending.length;i++)for(const dependency of byName.get(pending[i])?.calls??[])if(!leaf.has(dependency)){leaf.add(dependency);pending.push(dependency);}
    deviceSourcePartition=createDeviceSourcePartition(programContributions.map(c=>c.sourceUnitDeclaration),functions,[...leaf]);
  }
  const normalized={contract:residentDeviceSearchContract.contract,authority:authority.identities.contractSet,profiles:Object.fromEntries(roles.map(role=>[role,context[role].identity])),sourceDescriptor:d.identity,placements:placements.map(b=>({name:b.name,resourceClass:b.resourceClass,source:b.source})),continuation,captureBoundary:d.protocol.captureBoundary};
  return freeze({contract:residentDeviceSearchContract.contract,normalized,identity:canonicalIdentity(normalized),layout:d.layout,buffers:placements,programResources:resources,programContributions,sourceSelectionArtifacts,sourceUnits:programContributions.map(c=>c.sourceUnitDeclaration),functions,programUnits:programContributions.map(c=>({id:c.ownerProfile+'.resident-program-unit',kind:'owner',surface:null,contributors:[c.ownerProfile],functions:c.functions.map(f=>f.name),effectOrder:[]})),operations,operationIds,continuation,delivery,deviceImports,...(deviceSourcePartition?{deviceSourcePartition}:{}),publicRequirements:d.publicRequirements,protocol:d.protocol,compileRequirements:{headerProfile:'cuda-device',relocation:'public-import-composition-owned'},preconditions:['exact-selected-owner-profiles','cold-GPU-root-readiness-before-continuation','device-owned-active-progress','immutable-ready-only-output','lazy-bounded-reclamation','exact-incarnation-evaluator-lifecycle']});
}
function contentIdentity(value){return{algorithm:value.algorithm,sha256:value.sha256};}

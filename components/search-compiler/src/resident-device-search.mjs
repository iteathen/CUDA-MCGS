import {createHash} from 'node:crypto';
import {canonicalIdentity,exactKeys,fail} from './validation.mjs';
import {residentDeviceSearchContract} from './resident-device-search-contract.mjs';
import {createResidentGraphLayout,generateResidentGraph} from './resident-graph.mjs';
import {generateResidentProgress} from './resident-progress.mjs';
import {generateResidentSession,generateResidentOutput} from './resident-session-output.mjs';
import {generateResidentEntries} from './resident-entries.mjs';

const ID=/^[A-Za-z_$][A-Za-z0-9_$]*$/u;
const domainSlots=new Set(['validateRoot','key','equalState','actions','actionValid','actionEqual','transition','classifyTransitionResult','terminal','relation']);
const sourceIdentity=source=>({algorithm:'sha256',sha256:createHash('sha256').update(source.replace(/\r\n?/gu,'\n').replace(/\n+$/gu,'')+'\n').digest('hex')});
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const integer=(value,label,min=1)=>{if(!Number.isSafeInteger(value)||value<min||value>0xffff_fffe)fail('RESIDENT_SOURCE_BOUNDS',`${label} exceeds selected finite u32 extent`);return value;};
const dtype=type=>/^ptr<(u32|i32|u64|f32)>$/u.exec(type)?.[1];

// Cold producer port: concrete source/layout facts precede Graph/Resource profile
// composition. This projection confers no executable or normalized owner authority.
export function deriveResidentDeviceSearchSource(context,options){
  exactKeys(options,['name','layout','maxWork','maxRounds',...(Object.hasOwn(options,'maxAdmissionActions')?['maxAdmissionActions']:[]),...(Object.hasOwn(options,'externalParameters')?['externalParameters']:[])],'RESIDENT_SOURCE_OPTIONS','resident source options');
  const name=options.name;
  if(!ID.test(name)||name==='gpu')fail('RESIDENT_SOURCE_NAME','selected producer name must be a Device-JS identifier');
  if(context.domain?.normalized?.schema!=='cuda-mcgs.domain-profile/0.2.0'||canonicalIdentity(context.domain.normalized).sha256!==context.domain.identity?.sha256)fail('RESIDENT_SOURCE_DOMAIN','exact normalized Domain is required');
  if(!context.policy?.id||context.policy.evaluatorMode!=='evaluation-only')fail('RESIDENT_SOURCE_POLICY','selected source-backed evaluation-only Policy descriptor is required');
  const runtime=context.evaluatorRuntime;
  if(runtime?.device?.serviceProtocol?.contract!=='cuda-mcgs.evaluator-collective-item-service/0.1.0'||runtime.execution?.requestCapacity!==1||runtime.execution?.maxActiveItems!==1||!context.evaluatorOwnerProfile)fail('RESIDENT_SOURCE_EVALUATOR','actual selected one-request collective Evaluator runtime is required');
  const maxWork=integer(options.maxWork,'admitted work count'),maxAdmissionActions=integer(options.maxAdmissionActions??4096,'admission action count');
  if(typeof options.maxRounds!=='string'||!/^[1-9][0-9]*$/u.test(options.maxRounds)||BigInt(options.maxRounds)>0xffff_ffff_ffff_fffen)fail('RESIDENT_SOURCE_ROUNDS','continuation frame bound must be an explicit finite u64 decimal');
  const L=createResidentGraphLayout({...options.layout,maxWork,maxAdmissionActions});
  const bundles=[...(context.sourceBundles??[]),{ownerProfile:context.evaluatorOwnerProfile,source:runtime.device.source,functions:runtime.device.functions}];
  const byOwner=new Map(),byName=new Map();
  for(const bundle of bundles){
    if(!bundle?.ownerProfile||typeof bundle.source!=='string'||!Array.isArray(bundle.functions)||byOwner.has(bundle.ownerProfile))fail('RESIDENT_SOURCE_BUNDLE','unique actual owner source bundle is required');
    const expected=bundle.ownerProfile===context.domain.normalized.id?context.domain.normalized.programContribution?.sourceIdentity:bundle.ownerProfile===context.policy.id?context.policy.programContribution?.sourceIdentity:null;
    if(expected&&expected.sha256!==sourceIdentity(bundle.source).sha256)fail('RESIDENT_SOURCE_IDENTITY','owner source bytes differ from selected source identity');
    byOwner.set(bundle.ownerProfile,bundle);
    for(const fn of bundle.functions){if(!ID.test(fn.name)||fn.name==='gpu'||fn.name.startsWith(name+'_')||byName.has(fn.name)||!Array.isArray(fn.parameters))fail('RESIDENT_SOURCE_SYMBOL','source symbols must be typed, unique and disjoint from generated symbols');byName.set(fn.name,{...fn,ownerProfile:bundle.ownerProfile});}
  }
  const external=new Map();
  for(const parameter of options.externalParameters??[]){if(!ID.test(parameter.name)||!dtype(parameter.type)||!byOwner.has(parameter.ownerProfile)||external.has(parameter.name))fail('RESIDENT_SOURCE_EXTERNAL','typed external owner capabilities must be unique');external.set(parameter.name,{...parameter});}
  // Evaluator runtime resources are already exact owner-produced descriptors.
  for(const parameter of [...runtime.resources,...runtime.tensorBindings]){
    const old=external.get(parameter.parameterName),entry={name:parameter.parameterName,type:`ptr<${parameter.dtype}>`,ownerProfile:context.evaluatorOwnerProfile};
    if(old&&(old.type!==entry.type||old.ownerProfile!==entry.ownerProfile))fail('RESIDENT_SOURCE_EXTERNAL','Evaluator runtime capability conflicts with another owner');
    external.set(entry.name,{...old,...entry,elementCount:parameter.elementCount,access:parameter.resourceAccess??[parameter.access]});
  }
  const H={},bindings={};
  for(const [slot,abi]of Object.entries(residentDeviceSearchContract.hooks)){
    const binding=context.hooks?.[slot],owner=domainSlots.has(slot)?context.domain.normalized.id:slot==='encodeEvaluation'?context.evaluatorOwnerProfile:context.policy.id;
    const fn=byName.get(binding?.function);
    if(binding?.ownerProfile!==owner||binding.port!==abi.port||fn?.ownerProfile!==owner||fn.kind!=='device'||fn.returns!==abi.returns||fn.parameters.length<abi.parameters.length||abi.parameters.some((p,i)=>p.type!==fn.parameters[i].type))fail('RESIDENT_SOURCE_HOOK',`${slot} requires its exact selected-owner typed ABI reference`);
    const extras=fn.parameters.slice(abi.parameters.length);
    for(const p of extras)if(!external.has(p.name)||external.get(p.name).type!==p.type)fail('RESIDENT_SOURCE_HOOK',`${slot} extra parameter ${p.name} is not a declared owner capability`);
    H[slot]=(...args)=>`${fn.name}(${[...args,...extras.map(p=>p.name)].join(', ')})`;
    bindings[slot]={...binding};
  }
  const X=[...external.values()];
  const graph=generateResidentGraph(name+'_graph',L,H,X),progress=generateResidentProgress(name+'_progress',name+'_graph',L,H,X,runtime),output=generateResidentOutput(name+'_output',name+'_graph',L,H,X),session=generateResidentSession(name+'_session',name+'_graph',name+'_output',{...L,commandStateBase:L.stagedState},H,X);
  const entries=generateResidentEntries(name,L,X,runtime,options.maxRounds);
  for(const [role,c]of Object.entries({progress,output,session})){c.source+='\n'+entries.source[role];c.functions.push(...entries.functions[role]);}
  const resourceNames=new Set(graph.functions.filter(f=>f.name.startsWith(name+'_graph_span')).map(f=>f.name));
  const select=(generated,predicate)=>({source:generated.functions.map((fn,i)=>predicate(fn)?generated.sourceFragments?.[i]?.source??generated.sourceFragments?.[i]:null).filter(Boolean).join('\n'),functions:generated.functions.filter(predicate)});
  const resource=select(graph,fn=>resourceNames.has(fn.name)),g=select(graph,fn=>!resourceNames.has(fn.name));
  const contributions=Object.fromEntries(Object.entries({graph:g,resource,progress,output,session}).map(([role,c])=>[role,{...c,sourceIdentity:sourceIdentity(c.source)}]));
  const rowWords=L.actionWords+5,observerRowBase=Math.max(32,12+rowWords),packetWords=32+L.stateWords+L.maxAdmissionActions*L.actionWords;
  const domainWork=context.domain.normalized.ports.reduce((n,p)=>BigInt(p.bounds.maxWorkUnits)>n?BigInt(p.bounds.maxWorkUnits):n,1n);
  const sessionAdmissionWorkUnits=String(domainWork*(3n+BigInt(L.maxAdmissionActions)*4n+BigInt(L.ttProbes)*2n+BigInt(L.maxActions)*BigInt(L.maxActions)+BigInt(L.maxActions)*2n)+BigInt(packetWords+L.metaWords+L.stateWords*2));
  const portBounds={sessionAdmissionWorkUnits,outputCaptureWorkUnits:String(64+L.maxActions*(L.actionWords+5)*4)};
  const buffer=(name,dtype,elementCount,owner)=>({name,dtype,elementCount:integer(elementCount,`${name} extent`),byteLength:elementCount*(dtype==='u64'?8:4),owner});
  const buffers=[buffer('m','u32',L.metaWords,'graph'),buffer('s','u32',L.nodeCapacity*L.stateWords,'graph'),buffer('a','u32',L.edgeCapacity*L.actionWords,'graph'),buffer('su','u32',L.scratchU32Words+16,'graph'),buffer('p','u32',L.policyU32Words,'policy'),buffer('f','f32',L.policyF32Words,'policy'),buffer('sf','f32',2,'policy'),buffer('vu','u32',L.viewU32Words,'policy'),buffer('vf','f32',L.viewF32Words,'policy'),buffer('authority','u32',32,'session'),buffer('command','u32',packetWords,'session'),buffer('commandStage','u32',packetWords,'session'),buffer('commandReply','u32',32,'session'),buffer('sessionCounters','u64',4,'session'),buffer('admissionState0','u32',L.stateWords,'session'),buffer('admissionState1','u32',L.stateWords,'session'),buffer('initialRootInput','u32',packetWords,'session'),buffer('bootstrapResult','u32',4,'session'),buffer('snapshot','u32',2*(12+L.maxActions*rowWords),'output'),buffer('encoded','u32',5,'output'),buffer('observerOut','u32',observerRowBase+L.maxActions*rowWords,'output'),buffer('out','u32',observerRowBase+L.maxActions*rowWords,'output'),buffer('restriction','u32',L.maxActions*L.actionWords+1,'policy')];
  return freeze({contract:residentDeviceSearchContract.contract,status:'cold-source-projection',name,layout:L,maxRounds:options.maxRounds,contributions,buffers,portBounds,externalParameters:X,sourceBundles:bundles,hooks:bindings,entryPoints:entries.entryPoints,publicRequirements:context.publicRequirements??[],protocol:{command:session.layout.command,packetWords,observerRowBase,observer:{status:0,authority:{arena:2,root:3,generation:4,epoch:5},actionCount:6,terminal:7,rowsBase:observerRowBase,rowWords,maxActions:L.maxActions,headerWords:12,fields:{status:0,publicationGeneration:1,arena:2,rootSlot:3,rootGeneration:4,focusEpoch:5,rowCount:6,terminalRole:7,completedGraphWork:8,evaluatorReadyObserved:9,rowWords:10,evaluatorAdmissions:11},statuses:{ready:0,invalid:1,unavailable:3},selectedActionBase:12,selectedRowWords:rowWords,fullRowsBase:observerRowBase,actionWords:L.actionWords,selectedActionPresent:'ready-and-nonzero-row-count',terminalWithoutAction:'ready-and-zero-row-count-and-terminal-role1'},bootstrap:{wordCount:4,status:0,rootSlot:1,rootGeneration:2,focusEpoch:3,acceptedStatus:0,rootAuthoritySource:'GPU-pre-semantic-root-readiness'},terminal:{headerWords:32,fields:{activePathOccurrences:12,activeWorkLease:13,backupPhase:14,pathProtections:15,evaluatorProtections:16,edgeLeaseClaims:17,edgeLeaseReleases:18,workLeaseClaims:19,workLeaseReleases:20,evaluatorRequestState:21,evaluatorBatchState:22,stopCause:23,acceptedCommandIdBase:24,acceptedCommandGenerationBase:28},identityWords:4,quiescence:{zeroFields:[12,13,14,15,16,21,22],equalPairs:[[17,18],[19,20]]},retainedRoot:'ready-immutable-terminal-payload-until-public-resource-release'},rootEstablishment:'pre-ignition-validate-admit-materialize',admissionReplay:'bounded-domain-transition-stream',captureBoundary:'controller-quiescent-after-complete-backup-and-evaluator-consume',telemetry:{completedGraphWorkAtRoot:{word:8,scope:'root-slot-and-generation-cumulative',meaning:'successful-complete-backup-transactions-through-node-once-per-work'},evaluatorReadyObserved:{word:9,scope:'resident-arena-cumulative',meaning:'exact-slot-request-incarnation-ready-results-observed-before-consumption'},evaluatorAdmissions:{word:11,scope:'resident-arena-cumulative',meaning:'successfully-admitted-selected-Evaluator-requests'},counterMaximum:String(maxWork),unsupported:['provider-utilization','provider-time','active-queue-gauges'],rootFence:['arena','rootSlot','rootGeneration','focusEpoch']}},identity:canonicalIdentity({name,layout:L,maxRounds:options.maxRounds,portBounds,sourceIdentities:Object.fromEntries(Object.entries(contributions).map(([role,c])=>[role,c.sourceIdentity])),hooks:bindings})});
}

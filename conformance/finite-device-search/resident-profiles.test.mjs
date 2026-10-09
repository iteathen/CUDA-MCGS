import assert from 'node:assert/strict';
import test from 'node:test';
import {fixtureContext,identity} from './fixture.mjs';
import {createHash} from 'node:crypto';
import {continuationFake,continuationPeer} from '../cuda-js-runtime-adapter/src/continuation-fixture.mjs';
import {createResidentGraphLayout} from '../../components/search-compiler/src/resident-graph.mjs';
import {createResidentGraphProfile,createResidentResourceProfile,createResidentProgressProfile,createResidentOutputProfile,createResidentPublicRequirements,createResidentSessionProfile,createResidentRuntimeProfiles} from '../../components/search-compiler/src/resident-profiles.mjs';

function selected(){
  const context=fixtureContext();
  const layout=createResidentGraphLayout({nodeCapacity:8,edgeCapacity:128,ttCapacity:16,ttProbes:16,pathDepth:4,maxActions:16,stateWords:64,actionWords:16,outcomeWords:32,nodeU32Words:4,nodeF32Words:4,edgeU32Words:4,edgeF32Words:4});
  return {authority:context.authority,domain:context.domain,layout,sourceIdentity:identity('function testOwnedGraph(){}'),provenance:{origin:'first-party',revision:'1'.repeat(40),license:'Apache-2.0'}};
}
test('lower requirement references hash genuine consumer selection bytes and exact public metadata',()=>{
  const compatibility=continuationFake().cudaJs.CUDA_JS_COMPATIBILITY;
  const result=createResidentPublicRequirements({cudaJsCompatibility:compatibility,peer:continuationPeer});
  assert.equal(result.publicRequirements.length,6);
  for(const artifact of result.artifacts){assert.equal(artifact.document.owner,'CUDA-MCGS-consumer');assert.deepEqual(artifact.document.lower.compatibility,compatibility);assert.equal(createHash('sha256').update(artifact.canonicalJson,'utf8').digest('hex'),artifact.reference.sha256);assert.equal(artifact.byteLength,Buffer.byteLength(artifact.canonicalJson));}
  for(const mutate of [x=>x.package.version='0.1.0-alpha.21',x=>x.publicApi.schemaVersion=2,x=>delete x.capabilities.asyncTransfers]){const lower=structuredClone(compatibility);mutate(lower);assert.throws(()=>createResidentPublicRequirements({cudaJsCompatibility:lower,peer:continuationPeer}));}
});
test('producer-owned graph profile derives finite layouts and typed lifecycle from selected public facts',()=>{
  const input=selected(),graph=createResidentGraphProfile(input);
  assert.equal(graph.normalized.domainProfile.identity.sha256,input.domain.identity.sha256);
  assert.equal(graph.normalized.reclamation.maxWorkUnits,'1');assert.equal(graph.normalized.path.maxDepth,'4');
  assert.equal(graph.normalized.transposition.capacity,'16');assert.equal(graph.normalized.referenceEncoding.rawAddressPublic,false);
  const node=graph.normalized.layouts.find(l=>l.objectKind.endsWith('.state-node'));
  assert.equal(node.capacity,'8');assert.equal(node.recordBytes,'320');
  assert.equal(graph.normalized.programContribution.sourceIdentity.sha256,input.sourceIdentity.sha256);
  assert.match(graph.schemaSha,/^[0-9a-f]{64}$/);assert(!JSON.stringify(graph).includes('synthetic-graph-template'));
  assert.deepEqual(createResidentGraphProfile(input),graph);
});
test('Resource composes each real owner resource and producer demands without coordinate inputs',()=>{
  const context=fixtureContext(),selection=selected(),graph=createResidentGraphProfile(selection);
  const result=createResidentResourceProfile({authority:selection.authority,domain:context.domain,graph,policy:context.policy,evaluator:null,sourceDescriptor:{layout:selection.layout,contributions:{resource:{sourceIdentity:identity('function resourceAllocator(){}')}}},provenance:selection.provenance});
  assert(result.normalized.classes.some(c=>c.id.endsWith('class-terminal-envelope')));assert(result.normalized.classes.some(c=>c.id.endsWith('class-live-observation')));
  for(const owner of [context.domain,graph,context.policy])for(const r of owner.normalized.resources.filter(r=>r.maximum!=='0'))assert.equal(result.normalized.classes.filter(c=>c.sourceResource===r.id).length,1);
  assert(result.normalized.reserves.some(r=>r.purpose==='reroot-admission'));assert(result.normalized.classes.some(c=>c.id===result.resourceClasses.command));
  const progress=createResidentProgressProfile({authority:selection.authority,domain:context.domain,graph,policy:context.policy,evaluator:null,resource:result,sourceDescriptor:{layout:selection.layout,contributions:{progress:{sourceIdentity:identity('function actualProgressSteps(){}')}}},provenance:selection.provenance});
  assert.equal(progress.normalized.noProgress.externalWait.kind,'session-only');assert.equal(progress.normalized.stop.observationDependency,'none');assert(progress.normalized.workClasses.some(w=>w.kind==='must-drain'));assert(progress.normalized.workClasses.some(w=>w.kind==='resource-recovery'));assert.equal(progress.normalized.closure.observationAckRequired,false);
  const output=createResidentOutputProfile({authority:selection.authority,resource:result,progress,sourceDescriptor:{layout:selection.layout,portBounds:{outputCaptureWorkUnits:'900001'},contributions:{output:{sourceIdentity:identity('function immutableOutput(){}')}}},provenance:selection.provenance});
  assert.equal(output.normalized.observations.kind,'selected');assert.equal(output.normalized.publication.maxBorrows,'1');assert.equal(output.normalized.observations.profiles[0].readOnly,true);assert.equal(output.normalized.observations.profiles[0].hostProgress,'none');assert(output.normalized.fields.some(f=>f.semanticRole==='policy-summary'));
  assert(output.normalized.ports.every(p=>p.bounds.maxWorkUnits==='900001'&&p.bounds.maxReads==='900001'));
  for(const label of ['evaluation-disposition','root-evaluator-admissions','root-evaluator-ready-observed','drain-disposition'])assert(output.normalized.fields.some(f=>f.id.endsWith('.'+label)),label+' must be an owner-declared copied field');
  const publicSelection=createResidentPublicRequirements({cudaJsCompatibility:continuationFake().cudaJs.CUDA_JS_COMPATIBILITY,peer:continuationPeer});
  const session=createResidentSessionProfile({authority:selection.authority,resource:result,progress,output,sourceDescriptor:{layout:selection.layout,portBounds:{sessionAdmissionWorkUnits:'9876543210'},contributions:{session:{sourceIdentity:identity('function actualSessionControl(){}')}},publicRequirements:publicSelection.publicRequirements},provenance:selection.provenance});
  assert.equal(session.normalized.commands.hostProgress,'none');assert.equal(session.normalized.reroot.profile.transaction.rejectedEffect,'none');assert.equal(session.normalized.commands.capacity,'1');assert.equal(session.normalized.observations.profiles[0].maxBorrows,'1');assert.equal(session.normalized.attention.kind,'absent');
  assert(session.normalized.ports.every(p=>p.maxWorkUnits==='9876543210'));
});
test('cold graph factory rejects insufficient Domain storage and authority drift',()=>{
  for(const mutate of [x=>x.layout={...x.layout,stateWords:1},x=>x.authority={...x.authority,identities:{contractSet:{algorithm:'sha256',sha256:'0'.repeat(64)}}}]) {
    const input=selected();mutate(input);assert.throws(()=>createResidentGraphProfile(input));
  }
});
test('producer Session classes include ordered alignment gaps for odd packet and state widths',()=>{
  const context=fixtureContext(),selection=selected(),graph=createResidentGraphProfile(selection);
  // Data-only Resource sizing fixture; the real odd-width Domain cohort is
  // separately admitted through the full production constructor.
  selection.layout=createResidentGraphLayout({...selection.layout,stateWords:65,actionWords:17,maxAdmissionActions:2});
  const packetBytes=4*(32+65+2*17);
  const result=createResidentResourceProfile({authority:selection.authority,domain:context.domain,graph,policy:context.policy,evaluator:null,sourceDescriptor:{layout:selection.layout,contributions:{resource:{sourceIdentity:identity('function resourceAllocator(){}')}}},provenance:selection.provenance});
  const capacity=name=>Number(result.normalized.classes.find(c=>c.id===result.resourceClasses[name]).formula.maximumUnits);
  const aligned=lengths=>lengths.reduce((at,length)=>Math.ceil(at/8)*8+length,0);
  assert.equal(capacity('commandStage'),aligned([packetBytes,packetBytes]));
  assert.equal(capacity('authority'),aligned([128,packetBytes,128,32,65*4,65*4,16]));
  assert(capacity('commandStage')>2*packetBytes);
  assert(capacity('authority')>128+packetBytes+128+32+8*65+16);
});
test('full resident chain cannot substitute an absent Evaluator or a Policy bound to another Graph',()=>{
  const selection=selected(),context=fixtureContext(),graph=createResidentGraphProfile(selection);
  const input={authority:selection.authority,domain:context.domain,graph,policy:context.policy,evaluator:null,sourceDescriptor:{layout:selection.layout},provenance:selection.provenance};
  assert.throws(()=>createResidentRuntimeProfiles(input),{code:'RESIDENT_PROFILE_EVALUATOR'});
  input.evaluator={normalized:{schema:'cuda-mcgs.evaluator-profile/0.2.0',status:'accepted'}};
  assert.throws(()=>createResidentRuntimeProfiles(input),{code:'RESIDENT_PROFILE_CLOSURE'});
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {fixtureContext,identity} from './fixture.mjs';
import {toyTensorProgram} from '../cuda-js-tensor-evaluator/collective.mjs';
import {createTensorEvaluatorConnector,createTensorEvaluatorRuntimeContribution} from '../../adapters/evaluators/cuda-js-tensor/index.mjs';
import {residentDeviceSearchContract,deriveResidentDeviceSearchSource,createResidentGraphProfile} from '../../components/search-compiler/index.mjs';
import {normalizeDomainProfile} from '../../components/search-compiler/index.mjs';
import {buildDomainProfiles} from '../search-compiler/src/domain-fixtures.mjs';

export function sourceFixture(){
  const context=fixtureContext(),policyId='policy.resident-source-test',evaluatorId='evaluator.resident-source-test',hooks={...context.hooks};
  context.sourceBundles[0].source+='\nfunction fixtureTransitionResult(status){return status;}\n';
  context.sourceBundles[0].functions=[...context.sourceBundles[0].functions,{name:'fixtureTransitionResult',kind:'device',parameters:[{name:'status',type:'u32'}],returns:'u32',calls:[]}];
  const domainInput=buildDomainProfiles(context.authority)[0];domainInput.programContribution.sourceIdentity=identity(context.sourceBundles[0].source);
  context.domain=normalizeDomainProfile(domainInput,context.authority);
  hooks.classifyTransitionResult={ownerProfile:context.domain.normalized.id,function:'fixtureTransitionResult',port:'apply-transition'};
  const encoder=residentDeviceSearchContract.hooks.encodeEvaluation;
  const encodeFn={name:'sourceTestEncode',kind:'device',parameters:encoder.parameters,returns:'u32',calls:[]};
  const encodeSource=`function sourceTestEncode(${encoder.parameters.map(p=>p.name).join(',')}){return gpu.u32(0);}`;
  const runtime=createTensorEvaluatorRuntimeContribution(createTensorEvaluatorConnector(toyTensorProgram(),{requestCapacity:1}),{participation:{kind:'collective-block',blockSize:32},inputEncoder:{source:encodeSource,functions:[encodeFn],entryPoint:encodeFn.name,externalFunctions:[]}});
  const functions=[],sources=[];
  for(const [slot,abi]of Object.entries(residentDeviceSearchContract.hooks)){
    if(Object.hasOwn(hooks,slot)&&hooks[slot].ownerProfile===context.domain.normalized.id)continue;
    if(slot==='encodeEvaluation'){hooks[slot]={ownerProfile:evaluatorId,function:encodeFn.name,port:abi.port};continue;}
    const fn={name:'fixtureOwner_'+slot,kind:'device',parameters:abi.parameters,returns:abi.returns,calls:[]};
    functions.push(fn);sources.push(`function ${fn.name}(${fn.parameters.map(p=>p.name).join(',')}){${fn.returns==='void'?'':fn.returns==='bool'?'return true;':'return gpu.u32(0);'}}`);hooks[slot]={ownerProfile:policyId,function:fn.name,port:abi.port};
  }
  const source=sources.join('\n');
  return {context:{domain:context.domain,policy:{id:policyId,version:'0.1.0',evaluatorMode:'evaluation-only',programContribution:{sourceIdentity:identity(source)}},evaluatorOwnerProfile:evaluatorId,evaluatorRuntime:runtime,sourceBundles:[context.sourceBundles[0],{ownerProfile:policyId,source,functions}],hooks},options:{name:'sourceTest',layout:{nodeCapacity:8,edgeCapacity:128,ttCapacity:16,ttProbes:16,pathDepth:4,maxActions:16,stateWords:64,actionWords:16,outcomeWords:32,nodeU32Words:4,nodeF32Words:4,edgeU32Words:4,edgeF32Words:4},maxWork:100,maxRounds:'1000000',maxAdmissionActions:8},authority:context.authority};
}
test('cold source descriptor closes real owner source identities before Graph admission without fabricated refs',()=>{
  const {context,options,authority}=sourceFixture(),d=deriveResidentDeviceSearchSource(context,options);
  assert.equal(d.status,'cold-source-projection');
  for(const [role,c]of Object.entries(d.contributions)){assert(c.source.length>0,role);assert.deepEqual(c.sourceIdentity,identity(c.source));assert(c.functions.length>0,role);}
  assert(d.contributions.resource.functions.every(f=>f.name.startsWith('sourceTest_graph_span')));
  assert(!d.contributions.graph.functions.some(f=>f.name.startsWith('sourceTest_graph_span')));
  const g=createResidentGraphProfile({authority,domain:context.domain,layout:d.layout,sourceIdentity:d.contributions.graph.sourceIdentity,provenance:{origin:'first-party',revision:'1'.repeat(40),license:'Apache-2.0'}});
  assert.equal(g.normalized.programContribution.sourceIdentity.sha256,d.contributions.graph.sourceIdentity.sha256);
  assert.equal(d.buffers.find(b=>b.name==='command').elementCount,32+64+8*16);
  assert.equal(d.protocol.observerRowBase,33);
});
test('cold source projection rejects changed bytes, wrong owner hook, absent capability and unbounded frame count',()=>{
  for(const mutate of [q=>q.context.sourceBundles[0].source+='\n//changed',q=>q.context.hooks.transition.ownerProfile=q.context.policy.id,q=>q.context.hooks.apply.function='missing',q=>q.options.maxRounds='18446744073709551615']){const q=sourceFixture();mutate(q);assert.throws(()=>deriveResidentDeviceSearchSource(q.context,q.options));}
});

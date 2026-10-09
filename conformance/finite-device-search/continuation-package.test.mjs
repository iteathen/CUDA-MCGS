import assert from 'node:assert/strict';
import test from 'node:test';
import * as compiler from '../../components/search-compiler/index.mjs';
import {composeFiniteFixture} from './composition.mjs';

function fixture(){
  const f=composeFiniteFixture();
  const input=structuredClone(f.profileInput);
  // An unrelated owner's callable may have a distinct collective launch contract.
  const unused=input.functions.find(x=>x.name.startsWith('fn_output'));
  assert(unused);
  unused.launchConstraint={grid:['1','1','1'],block:['32','1','1']};
  return {...f,input};
}
test('launch constraints apply only to the operation reachable call closure',()=>{
  const f=fixture();
  const normalized=compiler.normalizeProgramPackageProfile(f.input,f.context.authority,f.profileContext);
  const program=compiler.composeSearchProgram(normalized);
  const pkg=compiler.buildExecutionPackage(normalized,program);
  const operation=pkg.normalized.cudaJsAdapter.operationRequirements[0];
  assert(operation.reachableFunctions.includes('finiteSearch'));
  assert(!operation.reachableFunctions.some(x=>x.startsWith('fn_output')));
  const bad=structuredClone(f.input);bad.functions.find(x=>x.name==='finiteSearch').launchConstraint={grid:['1','1','1'],block:['32','1','1']};
  assert.throws(()=>compiler.normalizeProgramPackageProfile(bad,f.context.authority,f.profileContext),{code:'COMPOSE_LAUNCH_CONSTRAINT'});
});
test('continuation controller profile and DAG are closed selected package facts',()=>{
  const f=fixture();
  const controller=f.input.functions.find(x=>x.name==='engine_step');
  controller.executionProfile='device-continuation-v1';
  f.input.continuation={contract:'cuda-mcgs.device-continuation/0.1.0',nodes:[{operation:f.input.operations[0].id,after:[]}],controllerOperation:f.input.operations[0].id};
  const profile=compiler.normalizeProgramPackageProfile(f.input,f.context.authority,f.profileContext);
  const program=compiler.composeSearchProgram(profile),pkg=compiler.buildExecutionPackage(profile,program);
  assert.equal(program.normalized.functions.find(x=>x.name==='engine_step').executionProfile,'device-continuation-v1');
  assert.deepEqual(pkg.normalized.cudaJsAdapter.continuation,{contract:'cuda-mcgs.device-continuation/0.1.0',nodes:[{operation:'operation-0',after:[]}],controllerOperation:'operation-0'});
  for(const mutate of [x=>x.functions.find(x=>x.name==='engine_step').executionProfile='invented',x=>x.continuation.nodes[0].after.push(x.operations[0].id),x=>x.continuation.controllerOperation='absent.operation',x=>x.continuation.nodes.push({...x.continuation.nodes[0]})]){
    const bad=structuredClone(f.input);mutate(bad);assert.throws(()=>compiler.normalizeProgramPackageProfile(bad,f.context.authority,f.profileContext));
  }
  const omitted=structuredClone(f.input);delete omitted.continuation;assert.throws(()=>compiler.normalizeProgramPackageProfile(omitted,f.context.authority,f.profileContext),{code:'COMPOSE_CONTINUATION_REQUIRED'});
  const template=structuredClone(f.input),generator=template.generator;delete template.generator;
  const resolved=compiler.createResolvedComposerInput(template,generator);
  const publication=compiler.composeResolvedEngine(resolved.normalized,f.context.authority,f.profileContext);
  assert.equal(publication.executionPackage.normalized.cudaJsAdapter.continuation.controllerOperation,'operation-0');
});

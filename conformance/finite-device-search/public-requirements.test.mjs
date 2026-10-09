import assert from 'node:assert/strict';
import test from 'node:test';
import {createResidentPublicRequirements} from '../../components/search-compiler/index.mjs';
import {normalizePublicRequirementSelections} from '../../components/search-compiler/src/public-requirement-selection.mjs';
import {continuationFake,continuationPeer} from '../cuda-js-runtime-adapter/src/continuation-fixture.mjs';
import * as compiler from '../../components/search-compiler/index.mjs';
import {composeFiniteFixture} from './composition.mjs';
test('canonical selected capability artifacts retain actual bytes and exact public requirement closure',()=>{
  const s=createResidentPublicRequirements({cudaJsCompatibility:continuationFake().cudaJs.CUDA_JS_COMPATIBILITY,peer:continuationPeer}),input=s.artifacts.map(({reference,document})=>({reference,document}));
  assert.equal(normalizePublicRequirementSelections(input,s.publicRequirements).length,6);
  for(const change of [x=>x[0].document.owner='cuda-js',x=>x[0].document.lower.peer.revision='0'.repeat(40),x=>x[0].reference.sha256='0'.repeat(64),x=>x.push(x[0])]){const bad=structuredClone(input);change(bad);assert.throws(()=>normalizePublicRequirementSelections(bad,s.publicRequirements));}
});
test('canonical Composer projects selected public requirement bytes through actual execution package',()=>{
  const f=composeFiniteFixture(),s=createResidentPublicRequirements({cudaJsCompatibility:continuationFake().cudaJs.CUDA_JS_COMPATIBILITY,peer:continuationPeer}),input=structuredClone(f.profileInput);
  const selected=s.artifacts.filter(a=>input.publicRequirements.some(r=>r.contract.id===a.reference.id));
  input.publicRequirementSelections=selected.map(({reference,document})=>({reference,document}));
  for(const requirement of input.publicRequirements){const r=selected.find(a=>a.reference.id===requirement.contract.id).reference;requirement.contract=r;f.profileContext.requirementById.set(r.id,r);}
  const template={...input};delete template.generator;
  const resolved=compiler.createResolvedComposerInput(template,input.generator);
  const publication=compiler.composeResolvedEngine(resolved.normalized,f.context.authority,f.profileContext);
  assert.deepEqual(publication.executionPackage.normalized.cudaJsAdapter.publicRequirementSelections,input.publicRequirementSelections.slice().sort((a,b)=>a.reference.id.localeCompare(b.reference.id)));
  const bad=structuredClone(input);bad.publicRequirementSelections[0].document.requirement.value='changed';assert.throws(()=>compiler.normalizeProgramPackageProfile(bad,f.context.authority,f.profileContext),{code:'COMPOSE_REQUIREMENT_SELECTION'});
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareCudaJsExecution} from '../../adapters/runtimes/cuda-js/index.mjs';
import {createResidentPublicRequirements} from '../../components/search-compiler/src/resident-profiles.mjs';
import {continuationFake,continuationPackage,continuationPeer} from './src/continuation-fixture.mjs';
import {calls} from './src/fixture.mjs';
function selected(){const fake=continuationFake(),pkg=continuationPackage(),selection=createResidentPublicRequirements({cudaJsCompatibility:fake.cudaJs.CUDA_JS_COMPATIBILITY,peer:continuationPeer});pkg.cudaJsAdapter.publicContracts=selection.publicRequirements;pkg.cudaJsAdapter.publicRequirementSelections=selection.artifacts.map(({reference,document})=>({reference,document}));return{fake,pkg};}
test('real consumer selection artifacts admit existing async/atomic public ports',async()=>{
  const {fake,pkg}=selected(),execution=await prepareCudaJsExecution(pkg,{cudaJs:fake.cudaJs,peer:continuationPeer});assert.equal((await execution.close()).status,'complete');
});
test('peer, capability, version and altered consumer selections fail before lower runtime opens',async()=>{
  for(const mutate of [x=>x.pkg.cudaJsAdapter.publicRequirementSelections[0].reference={...x.pkg.cudaJsAdapter.publicRequirementSelections[0].reference,sha256:'0'.repeat(64)},x=>x.fake.cudaJs.CUDA_JS_COMPATIBILITY.capabilities.asyncTransfers='different',x=>x.fake.cudaJs.CUDA_JS_COMPATIBILITY.package.version='0.1.0-alpha.21',x=>x.pkg.cudaJsAdapter.publicRequirementSelections=x.pkg.cudaJsAdapter.publicRequirementSelections.slice(1)]){
    const value=selected();value.pkg=structuredClone(value.pkg);mutate(value);await assert.rejects(()=>prepareCudaJsExecution(value.pkg,{cudaJs:value.fake.cudaJs,peer:continuationPeer}));assert.equal(calls(value.fake,'openCudaRuntime').length,0);
  }
});

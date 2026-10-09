import test from 'node:test';
import assert from 'node:assert/strict';
import {createDeviceSourcePartition,normalizeDeviceSourcePartition} from '../../components/search-compiler/src/device-source-partition.mjs';
import * as compiler from '../../components/search-compiler/index.mjs';
import {composeFiniteFixture} from './composition.mjs';
const sourceUnits=[{id:'owner.a',source:'function leaf(){return gpu.u32(1);}\nfunction body(out){out[gpu.u32(0)]=leaf();}\n'}],functions=[{name:'leaf',sourceUnit:'owner.a',executionRole:'device-callable',calls:[]},{name:'body',sourceUnit:'owner.a',executionRole:'runtime-entry',calls:['leaf']}];
test('physical library partition derives exact semantic bytes and closed typed dependency references',()=>{
  const p=createDeviceSourcePartition(sourceUnits,functions,['leaf']);assert.deepEqual(normalizeDeviceSourcePartition(p,{sourceUnits,functions}),p);assert.deepEqual(p.imports,[{library:'library.resident-semantic-leaf',function:'leaf',as:'leaf'}]);assert(!p.main.source.includes('function leaf'));
  for(const mutate of [x=>x.main.source+='\n//changed',x=>x.libraries[0].functions.push('body'),x=>x.imports[0].as='shadow',x=>x.libraries[0].sourceIdentity.sha256='0'.repeat(64)]){const q=structuredClone(p);mutate(q);assert.throws(()=>normalizeDeviceSourcePartition(q,{sourceUnits,functions}));}
});
test('canonical Composer preserves full semantic source and projects exact physical partition/call declarations',()=>{
  const f=composeFiniteFixture(),input=structuredClone(f.profileInput),leaf=input.functions.filter(fn=>fn.ownerProfile===f.context.domain.normalized.id).map(fn=>fn.name);
  input.deviceSourcePartition=createDeviceSourcePartition(input.sourceUnits,input.functions,leaf);
  const template={...input};delete template.generator;
  const resolved=compiler.createResolvedComposerInput(template,input.generator),publication=compiler.composeResolvedEngine(resolved.normalized,f.context.authority,f.profileContext);
  assert.equal(publication.searchProgram.normalized.functions.length,input.functions.length);
  assert.deepEqual(publication.executionPackage.normalized.cudaJsAdapter.deviceSourcePartition,input.deviceSourcePartition);
  assert(publication.executionPackage.normalized.cudaJsAdapter.searchProgram.functions.every(fn=>Array.isArray(fn.calls)));
  const bad=structuredClone(input);bad.deviceSourcePartition.main.source+='\n//changed';assert.throws(()=>compiler.normalizeProgramPackageProfile(bad,f.context.authority,f.profileContext),{code:'COMPOSE_SOURCE_PARTITION'});
});
test('library cannot depend on a main function, export a kernel or exceed public finite compilation caps',()=>{
  const recursive=structuredClone(functions);recursive[0].calls=['body'];assert.throws(()=>createDeviceSourcePartition(sourceUnits,recursive,['leaf']));assert.throws(()=>createDeviceSourcePartition(sourceUnits,functions,['body']));assert.throws(()=>createDeviceSourcePartition(sourceUnits,functions,Array(65).fill('leaf')));
});

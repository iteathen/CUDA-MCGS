import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {prepareCudaJsExecution} from '../../adapters/runtimes/cuda-js/index.mjs';
import {continuationFake,continuationPackage,continuationPeer} from './src/continuation-fixture.mjs';
import {calls} from './src/fixture.mjs';
const identity=source=>({algorithm:'sha256',sha256:createHash('sha256').update(source,'utf8').digest('hex')});
function selected(flags={}){
 const fake=continuationFake(),pkg=continuationPackage(),a=pkg.cudaJsAdapter;
 const leaf='function local_increment(x) { return x + gpu.u32(1); } function local_step(x) { return local_increment(x); }\n';
 const main=a.searchProgram.source.replace('gpu.atomic.add(state, gpu.u32(0), gpu.u32(1))','gpu.atomic.add(state, gpu.u32(0), local_step(gpu.u32(0)))')+'\n';
 a.searchProgram.source=main+leaf;a.searchProgram.functions[0].calls=['local_step'];a.operationRequirements[0].reachableFunctions.push('local_step','local_increment');
 a.searchProgram.functions.push(...['local_increment','local_step'].map(name=>({name,executionRole:'device-callable',parameters:[{name:'x',type:'u32'}],returns:'u32',calls:name==='local_step'?['local_increment']:[]})));
 a.deviceSourcePartition={contract:'cuda-mcgs.device-source-partition/0.1.0',libraries:[{id:'library.local',source:leaf,sourceIdentity:identity(leaf),functions:['local_increment','local_step'],exports:['local_step']}],main:{source:main,sourceIdentity:identity(main),functions:['continuation_body','continuation_step','continuation_observe']},imports:[{library:'library.local',function:'local_step',as:'local_step'}]};
 fake.cudaJs.CUDA_JS_COMPATIBILITY.capabilities.deviceJsLibraries='typed-leaf-libraries-explicit-aliased-imports-selected-runtime-target-rdc-or-lto-final-cubin';
 fake.cudaJs.compileDeviceLibrary=async(runtime,request)=>{fake.calls.push(['compileDeviceLibrary',request]);if(flags.libraryError)throw Object.assign(new Error('leaf failed'),{code:'LEAF_FAILED',category:'compiler'});const bytes=Uint8Array.from([1,2,3]);const exports=request.exports.map(name=>({...request.functions.find(f=>f.name===name),symbol:`symbol_${name}`,...(flags.badAbi?{returns:'f32'}:{})}));return{schemaVersion:1,library:{schemaVersion:1,contract:'portable-public-library-fixture',sha256:'a'.repeat(64),format:'ptx',architecture:'compute_75',exports,artifact:{format:'ptx',bytes,byteLength:3,sha256:createHash('sha256').update(bytes).digest('hex'),architecture:'compute_75'}},compiler:{}};};
 return{fake,pkg};
}
test('declared closed leaf compiles through public library port before main inspection and linking',async()=>{
 const {fake,pkg}=selected(),execution=await prepareCudaJsExecution(pkg,{cudaJs:fake.cudaJs,peer:continuationPeer});
 const library=calls(fake,'compileDeviceLibrary')[0][1],main=calls(fake,'compileDeviceProgram')[0][1];assert.equal(library.functions.length,2);assert(library.functions.every(f=>f.kind==='device'));assert.deepEqual(library.exports,['local_step']);assert.equal(library.compile.headerProfile,'cuda-device');assert.equal(Object.hasOwn(library.compile,'relocatableDeviceCode'),false);
 assert.equal(main.functions.length,3);assert.equal(main.source,pkg.cudaJsAdapter.deviceSourcePartition.main.source);assert.equal(main.imports[0].name,'local_step');assert.equal(main.imports[0].as,'local_step');assert.equal(Object.hasOwn(main.compile,'relocatableDeviceCode'),false,'public library composition owns RDC selection');
 const events=fake.calls.map(c=>c[0]);assert(events.indexOf('compileDeviceLibrary')<events.indexOf('inspectDeviceProgram'));assert(events.indexOf('inspectDeviceProgram')<events.indexOf('runtime.loadModule'));
 assert.equal((await execution.close()).status,'complete');
});
test('partition bytes, function coverage and exact export edges fail before runtime opening',async()=>{
 for(const mutate of [a=>a.deviceSourcePartition.main.sourceIdentity.sha256='0'.repeat(64),a=>a.deviceSourcePartition.libraries[0].functions.pop(),a=>a.deviceSourcePartition.imports[0].as='other',a=>a.deviceSourcePartition.libraries[0].exports=['local_increment']]){const {fake,pkg}=selected();mutate(pkg.cudaJsAdapter);await assert.rejects(()=>prepareCudaJsExecution(pkg,{cudaJs:fake.cudaJs,peer:continuationPeer}));assert.equal(calls(fake,'openCudaRuntime').length,0);}
});
test('failed leaf compilation or returned export ABI rolls back before module and resident allocation',async()=>{
 for(const flags of [{libraryError:true},{badAbi:true}]){const {fake,pkg}=selected(flags);await assert.rejects(()=>prepareCudaJsExecution(pkg,{cudaJs:fake.cudaJs,peer:continuationPeer}));assert.equal(calls(fake,'runtime.loadModule').length,0);assert.equal(calls(fake,'runtime.allocateDevice').length,0);assert.equal(calls(fake,'runtime.close').length,1);}
});
test('local compiled imports compose with the exact externally admitted public import value',async()=>{
 const {fake,pkg}=selected(),bytes=Uint8Array.from([7,8,9]),sha256=createHash('sha256').update(bytes).digest('hex');
 const supplied={name:'externalExport',as:'externalAlias',library:{schemaVersion:1,contract:'portable-external-library',sha256:'e'.repeat(64),format:'ptx',architecture:'compute_75',exports:[{name:'externalExport',parameters:[],returns:'void'}],artifact:{format:'ptx',architecture:'compute_75',bytes,byteLength:3,sha256}}};
 pkg.semantic={selectedProfiles:[{id:'external.owner'}]};pkg.cudaJsAdapter.searchProgram.deviceImports=[{schema:'cuda-mcgs.device-js-import-declaration/0.1.0',id:'external.import',ownerProfile:'external.owner',importName:supplied.name,alias:supplied.as,library:{contract:supplied.library.contract,sha256:supplied.library.sha256,format:'ptx',architecture:'compute_75',artifactSha256:sha256}}];
 const prepared=await prepareCudaJsExecution(pkg,{cudaJs:fake.cudaJs,peer:continuationPeer,deviceImports:[supplied]});
 for(const event of ['inspectDeviceProgram','compileDeviceProgram']){const imports=calls(fake,event)[0][1].imports;assert.equal(imports.length,2);assert.equal(imports[0].as,'local_step');assert.strictEqual(imports[1],supplied);}
 assert.equal((await prepared.close()).status,'complete');
});

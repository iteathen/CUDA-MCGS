import {createHash} from 'node:crypto';

// Consume canonical producer declarations only. The adapter neither discovers
// call edges from source nor splits/reconstructs semantic function bodies.
export function admitSourcePartition(plan,cudaJs,lower,fail){
 const value=plan.partition;if(value===undefined)return null;
 const error=message=>fail('CUDA_JS_ADAPTER_SOURCE_PARTITION','admission',message);
 const exact=(v,keys,label)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join(',')!==keys.slice().sort().join(','))error(`${label} fields differ from the closed declaration`);};
 const names=(values,label)=>{if(!Array.isArray(values)||!values.length||values.length>64||new Set(values).size!==values.length||values.some(n=>typeof n!=='string'||!byName.has(n)))error(`${label} requires bounded unique canonical functions`);return new Set(values);};
 const source=(v,label)=>{exact(v.sourceIdentity,['algorithm','sha256'],`${label} source identity`);if(typeof v.source!=='string'||Buffer.byteLength(v.source,'utf8')>4194304||v.sourceIdentity.algorithm!=='sha256'||createHash('sha256').update(v.source,'utf8').digest('hex')!==v.sourceIdentity.sha256)error(`${label} source bytes differ from declared SHA256`);};
 if(typeof cudaJs.compileDeviceLibrary!=='function'||lower.capabilities?.deviceJsLibraries!=='typed-leaf-libraries-explicit-aliased-imports-selected-runtime-target-rdc-or-lto-final-cubin')error('public typed device-library compilation is unavailable');
 exact(value,['contract','libraries','main','imports'],'source partition');
 if(value.contract!=='cuda-mcgs.device-source-partition/0.1.0'||!Array.isArray(value.libraries)||value.libraries.length!==1)error('first physical profile requires one closed leaf library');
 const library=value.libraries[0];exact(library,['id','source','sourceIdentity','functions','exports'],'leaf');exact(value.main,['source','sourceIdentity','functions'],'main');
 const byName=new Map(plan.searchProgram.functions.map(fn=>[fn.name,fn]));if(byName.size!==plan.functions.length)error('canonical function names repeat');
 if(typeof library.id!=='string'||library.id.length>256||!/^[a-z0-9][a-z0-9.-]*$/u.test(library.id))error('local library identity is invalid');
 source(library,'leaf');source(value.main,'main');const leaf=names(library.functions,'leaf'),main=names(value.main.functions,'main'),exported=names(library.exports,'exports');
 if([...leaf].some(n=>main.has(n))||leaf.size+main.size!==byName.size||[...exported].some(n=>!leaf.has(n)))error('function coverage or export ownership differs');
 for(const name of leaf){const fn=byName.get(name);if(fn.executionRole!=='device-callable'||fn.executionProfile||!Array.isArray(fn.calls)||fn.calls.some(n=>!leaf.has(n)))error('leaf is not a closed device-callable dependency set');}
 if(!Array.isArray(value.imports)||value.imports.length<1||value.imports.length+(plan.searchProgram.deviceImports?.length??0)>64)error('local plus external import count exceeds public bounds');
 const required=new Set([...main].flatMap(n=>byName.get(n).calls??[]).filter(n=>leaf.has(n))),seen=new Set(),external=new Set((plan.searchProgram.deviceImports??[]).map(d=>d.alias));
 for(const imported of value.imports){exact(imported,['library','function','as'],'local import');if(imported.library!==library.id||imported.as!==imported.function||!exported.has(imported.function)||!required.has(imported.function)||seen.has(imported.function)||external.has(imported.as)||main.has(imported.as))error('import differs from exact declared main-to-leaf edge');seen.add(imported.function);}
 if(seen.size!==required.size||seen.size!==exported.size)error('imports and exported main dependencies differ');
 const typed=new Map(plan.functions.map(fn=>[fn.name,fn]));
 return{library,main:value.main,imports:value.imports,libraryFunctions:library.functions.map(n=>typed.get(n)),mainFunctions:value.main.functions.map(n=>typed.get(n))};
}

export async function compileSourcePartition(selected,cudaJs,runtime,fail){
 const compiled=await cudaJs.compileDeviceLibrary(runtime,{source:selected.library.source,functions:selected.libraryFunctions,exports:selected.library.exports,compile:{headerProfile:'cuda-device'},output:'ptx'});
 const library=compiled?.library;
 if(compiled?.schemaVersion!==1||library?.schemaVersion!==1||!Array.isArray(library.exports)||!library.artifact||!(library.artifact.bytes instanceof Uint8Array)||!['ptx','lto-ir'].includes(library.format))fail('CUDA_JS_ADAPTER_SOURCE_PARTITION','compilation','public library compiler returned no typed artifact');
 for(const name of selected.library.exports){const expected=selected.libraryFunctions.find(fn=>fn.name===name),actual=library.exports.find(fn=>fn.name===name);if(!actual||actual.returns!==expected.returns||!Array.isArray(actual.parameters)||actual.parameters.length!==expected.parameters.length||actual.parameters.some((p,i)=>p.name!==expected.parameters[i].name||p.type!==expected.parameters[i].type))fail('CUDA_JS_ADAPTER_SOURCE_PARTITION','compilation','compiled export ABI differs from canonical typed declaration');}
 if(library.exports.length!==selected.library.exports.length)fail('CUDA_JS_ADAPTER_SOURCE_PARTITION','compilation','compiled library exposed undeclared exports');
 return selected.imports.map(item=>({library,name:item.function,as:item.as}));
}

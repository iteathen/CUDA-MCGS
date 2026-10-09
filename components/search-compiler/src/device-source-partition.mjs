import {createHash} from 'node:crypto';
import {canonicalIdentity,exactKeys,fail} from './validation.mjs';
const digest=source=>({algorithm:'sha256',sha256:createHash('sha256').update(source,'utf8').digest('hex')});
const lf=source=>source.replace(/\r\n?/gu,'\n').replace(/\n+$/gu,'')+'\n';

// Deterministic physical compilation partition; selected semantic source units,
// owner references and the complete Search Program remain authoritative.
function fragments(sourceUnits,functions){
  const result=new Map();
  for(const unit of sourceUnits){
    const set=functions.filter(f=>f.sourceUnit===unit.id).map(fn=>({fn,at:unit.source.indexOf(`function ${fn.name}(`)})).sort((a,b)=>a.at-b.at);
    if(set.some(x=>x.at<0))fail('COMPOSE_SOURCE_PARTITION','typed definition is absent from selected semantic source');
    set.forEach(({fn,at},i)=>result.set(fn.name,unit.source.slice(at,i+1<set.length?set[i+1].at:undefined)));
  }
  return result;
}
export function createDeviceSourcePartition(sourceUnits,functions,leafNames){
  const byName=new Map(functions.map(f=>[f.name,f])),leaf=new Set(leafNames);
  if(leaf.size!==leafNames.length||leaf.size<1||leaf.size>64)fail('COMPOSE_SOURCE_PARTITION','bounded unique device library functions are required');
  for(const name of leaf){const fn=byName.get(name);if(!fn||fn.executionRole!=='device-callable'||fn.calls.some(call=>!leaf.has(call)))fail('COMPOSE_SOURCE_PARTITION','local library must be a closed selected device-callable dependency set');}
  const main=functions.filter(f=>!leaf.has(f.name));
  if(main.length<1||main.length>64)fail('COMPOSE_SOURCE_PARTITION','main physical compilation requires1 through64functions');
  const pieces=fragments(sourceUnits,functions),order=list=>list.slice().sort(),source=list=>lf(order(list).map(name=>pieces.get(name)).join('\n'));
  const imports=order([...new Set(main.flatMap(f=>f.calls.filter(call=>leaf.has(call))))]);
  if(!imports.length||imports.length>64)fail('COMPOSE_SOURCE_PARTITION','bounded explicit main-to-library imports are required');
  const librarySource=source([...leaf]),mainSource=source(main.map(f=>f.name)),id='library.resident-semantic-leaf';
  return{contract:'cuda-mcgs.device-source-partition/0.1.0',libraries:[{id,source:librarySource,sourceIdentity:digest(librarySource),functions:order([...leaf]),exports:imports}],main:{source:mainSource,sourceIdentity:digest(mainSource),functions:order(main.map(f=>f.name))},imports:imports.map(name=>({library:id,function:name,as:name}))};
}
export function normalizeDeviceSourcePartition(input,profile){
  if(input===undefined)return undefined;
  exactKeys(input,['contract','libraries','main','imports'],'COMPOSE_SOURCE_PARTITION','source partition');
  if(input.contract!=='cuda-mcgs.device-source-partition/0.1.0'||!Array.isArray(input.libraries)||input.libraries.length!==1)fail('COMPOSE_SOURCE_PARTITION','first selected physical profile admits one closed local library');
  exactKeys(input.libraries[0],['id','source','sourceIdentity','functions','exports'],'COMPOSE_SOURCE_PARTITION','local library');
  exactKeys(input.main,['source','sourceIdentity','functions'],'COMPOSE_SOURCE_PARTITION','main source');
  if(!Array.isArray(input.imports))fail('COMPOSE_SOURCE_PARTITION','typed import references are required');
  for(const item of input.imports)exactKeys(item,['library','function','as'],'COMPOSE_SOURCE_PARTITION','local import');
  const expected=createDeviceSourcePartition(profile.sourceUnits,profile.functions,input.libraries[0].functions);
  if(canonicalIdentity(input).sha256!==canonicalIdentity(expected).sha256)fail('COMPOSE_SOURCE_PARTITION','physical source bytes, ABI membership or imports differ from exact selected semantic declarations');
  return expected;
}

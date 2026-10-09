import {createHash} from 'node:crypto';

function jsonSnapshot(value,{maxBytes,maxNodes=65536},fail){
 let nodes=0;
 const copy=(v,depth)=>{
  if(++nodes>maxNodes||depth>24)fail('CUDA_JS_ADAPTER_DESCRIPTION','diagnostics','public metadata exceeds structural bounds');
  if(v===null||typeof v==='string'||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v))return v;
  if(Array.isArray(v))return v.map(item=>copy(item,depth+1));
  if(v&&typeof v==='object'&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null))return Object.fromEntries(Object.keys(v).sort().map(k=>[k,copy(v[k],depth+1)]));
  fail('CUDA_JS_ADAPTER_DESCRIPTION','diagnostics','public metadata must contain bounded plain JSON without object capabilities or binary bytes');
 };
 const result=copy(value,0),text=JSON.stringify(result);if(Buffer.byteLength(text,'utf8')>maxBytes)fail('CUDA_JS_ADAPTER_DESCRIPTION','diagnostics','public metadata exceeds byte bounds');return{result,text};
}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const artifact=value=>value?{format:value.format??null,architecture:value.architecture??null,byteLength:value.bytes instanceof Uint8Array?value.bytes.byteLength:value.byteLength??null,sha256:value.bytes instanceof Uint8Array?sha(value.bytes):null,reportedSha256:value.sha256??null}:null;
const sourceIdentity=source=>({algorithm:'sha256',sha256:sha(Buffer.from(source,'utf8'))});

export function executionPackageIdentity(executionPackage,fail){const packageJson=jsonSnapshot(executionPackage,{maxBytes:16777216},fail);return{schema:executionPackage.schema,sha256:sha(Buffer.from(packageJson.text,'utf8'))};}
export function preparationRecord(packageIdentity,peer,plan,compiled,localImports){
 return{
  realization:'prepared',peer:{repository:peer.repository,revision:peer.revision,package:peer.package},
  executionPackage:packageIdentity,
  semanticProgram:{sourceIdentity:sourceIdentity(plan.searchProgram.source),functionCount:plan.functions.length},
  partition:plan.partition?{contract:plan.partition.contract,main:{sourceIdentity:plan.partition.main.sourceIdentity,functionCount:plan.partition.main.functions.length},libraries:plan.partition.libraries.map(l=>({id:l.id,sourceIdentity:l.sourceIdentity,functionCount:l.functions.length,exports:[...l.exports]}))}:null,
  compilation:{sourceIdentity:sourceIdentity(plan.compilationSource??plan.searchProgram.source),functionCount:(plan.compilationFunctions??plan.functions).length,requestOptions:{...plan.compile},deviceProgram:{contract:compiled.deviceProgram?.contract??null,sha256:compiled.deviceProgram?.sha256??null},compilerArtifact:artifact(compiled.compiler?.artifact),linkedArtifact:artifact(compiled.linker?.artifact),loadArtifact:artifact(compiled.linker?.artifact??compiled.compiler?.artifact),localLibraries:(localImports??[]).filter((x,i,list)=>list.findIndex(y=>y.library===x.library)===i).map(({library})=>({contract:library.contract,sha256:library.sha256,format:library.format,architecture:library.architecture,exports:library.exports.map(e=>({name:e.name,parameters:e.parameters,returns:e.returns})),artifact:artifact(library.artifact)})),externalLibraries:(plan.searchProgram.deviceImports??[]).map(d=>({id:d.id,ownerProfile:d.ownerProfile,importName:d.importName,alias:d.alias,library:{...d.library}}))},
  allocatedResources:{count:plan.allocatedResources.size,totalBytes:[...plan.allocatedResources.values()].reduce((sum,r)=>sum+BigInt(r.byteLengthNumber),0n).toString()},
 };
}
export function runtimeDescriptionSnapshot(value,fail){return jsonSnapshot(value,{maxBytes:262144,maxNodes:8192},fail).result;}

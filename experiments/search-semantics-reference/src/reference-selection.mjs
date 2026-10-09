import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalIdentity} from './canonical.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const historicalRoot=path.join(root,'experiments/search-semantics-reference/fixtures');
const packageVersion=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8')).version;
export const referenceSelection=Object.freeze({version:packageVersion,historicalVersion:'0.0.0-dev.0',selectedVersion:packageVersion});
export function assertReferenceVersion(version,sourceVersion){
  assert(['0.0.0-dev.0','0.0.0-dev.1','0.0.0-dev.2','0.0.0-dev.3'].includes(version),'unregistered reference-chain version');
  assert.equal(version,sourceVersion,'reference chain must match the selected source package version');
}
export function selectReferencePath(absolutePath,version=packageVersion){
  assertReferenceVersion(version,packageVersion);
  const resolved=path.resolve(absolutePath);
  const relative=path.relative(historicalRoot,resolved);
  if(relative==='' || (!relative.includes(path.sep)&&relative.endsWith('.json'))){
    return version==='0.0.0-dev.0'?resolved:path.join(historicalRoot,version,relative);
  }
  return resolved;
}
export function semanticFixtureProjection(value){
  const result=structuredClone(value);
  const removeIdentity=record=>{
    if(record&&record.algorithm==='sha256'&&typeof record.sha256==='string'){
      delete record.algorithm;delete record.byteLength;delete record.sha256;
    }
  };
  for(const key of Object.keys(result)){
    if(key==='composerEvidence'||key==='profileProjection'||key==='rootControlProjection'||key.endsWith('Evidence'))removeIdentity(result[key]);
  }
  if(result.schema==='cuda-mcgs.reference-integration-evidence-locks/0.1.0')for(const identity of Object.values(result.identities))removeIdentity(identity);
  if(result.schedules)for(const schedule of Object.values(result.schedules))delete schedule.evidenceKey;
  return result;
}
export function selectReferenceRelativePath(relative){
  return path.relative(root,selectReferencePath(path.join(root,relative))).split(path.sep).join('/');
}
export function selectReferenceManifestPath(){
  assertReferenceVersion(packageVersion,packageVersion);
  const files={'0.0.0-dev.1':'reference-chain-selection.json','0.0.0-dev.2':'reference-chain-selection-0.0.0-dev.2.json','0.0.0-dev.3':'reference-chain-selection-0.0.0-dev.3.json'};
  assert(files[packageVersion],'historical source selection has no current-source replay manifest');
  return path.join(root,'experiments/search-semantics-reference',files[packageVersion]);
}
export function assertHistoricalReferenceBytes(manifest){
  for(const [name,expected]of Object.entries(manifest.historicalFixtures)){
    assert.equal(path.basename(name),name,'historical fixture pin must be a direct child');
    const bytes=readFileSync(path.join(historicalRoot,name),'utf8').replace(/\r\n?/g,'\n');
    const actual=createHash('sha256').update(bytes).digest('hex');
    assert.equal(actual,expected,`historical reference fixture byte drift: ${name}`);
  }
}
export function assertSelectedReferenceBytes(manifest){
  assertReferenceVersion(manifest.version,packageVersion);
  for(const [name,expected]of Object.entries(manifest.selectedFixtures)){
    assert.equal(path.basename(name),name,'selected fixture pin must be a direct child');
    const bytes=readFileSync(path.join(historicalRoot,manifest.version,name),'utf8').replace(/\r\n?/g,'\n');
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expected,`selected reference fixture byte drift: ${name}`);
  }
}
export function assertHistoricalProjectionPayload(projection,historicalReference,historicalComposer){
  const {projectionIdentity,...subject}=structuredClone(projection);
  assert(subject.producer&&subject.producer.representationCompositionEvidenceKey,'profile projection must declare its producer ancestry');
  subject.producer.representationCompositionEvidenceKey=structuredClone(historicalComposer);
  assert.deepEqual(canonicalIdentity(subject),{
    algorithm:historicalReference.algorithm,byteLength:historicalReference.byteLength,sha256:historicalReference.sha256,
  },'new reference ancestry must preserve every historical normalized owner field');
}

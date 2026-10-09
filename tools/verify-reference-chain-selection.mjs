import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertHistoricalReferenceBytes,assertSelectedReferenceBytes,semanticFixtureProjection,assertHistoricalProjectionPayload} from '../experiments/search-semantics-reference/src/reference-selection.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const here=path.join(root,'experiments/search-semantics-reference');
const json=async file=>JSON.parse(await readFile(file,'utf8'));
const manifest=await json(path.join(here,'reference-chain-selection.json'));
assertHistoricalReferenceBytes(manifest);
assertSelectedReferenceBytes(manifest);
assert.deepEqual(Object.keys(manifest.historicalFixtures).sort(),Object.keys(manifest.selectedFixtures).sort());
const helper=(await readFile(path.join(here,'src/reference-selection.mjs'),'utf8')).replace(/\r\n?/g,'\n');
assert.equal(createHash('sha256').update(helper).digest('hex'),manifest.selectionSourceSha256,'reference selector source drift');
const composer=await json(path.join(root,'conformance/search-compiler/build/evidence.json'));
assert.equal(composer.status,'pass');
assert.equal(composer.representationCompositionEvidenceKey.sha256,manifest.selectedComposer,'selected Composer ancestry mismatch');
for(const name of Object.keys(manifest.historicalFixtures)){
  const historical=await json(path.join(here,'fixtures',name));
  const selected=await json(path.join(here,'fixtures',manifest.version,name));
  assert.deepEqual(semanticFixtureProjection(selected),semanticFixtureProjection(historical),`${name}: changed semantic oracle`);
  if(selected.composerEvidence)assert.equal(selected.composerEvidence.sha256,manifest.selectedComposer,`${name}: wrong source ancestry`);
  if(historical.profileProjection?.sha256){
    const kind=historical.profileProjection.schema.match(/^cuda-mcgs\.search-ir-composer-([a-z]+)-profile-projection\/0\.2\.0$/)?.[1];
    assert(['domain','graph','policy','evaluator','resource','progress','output','session','stage'].includes(kind),'unregistered owner projection');
    const projection=await json(path.join(root,'conformance/search-compiler/build',kind+'-profiles.json'));
    assertHistoricalProjectionPayload(projection,historical.profileProjection,historical.composerEvidence);
  }
}
console.log(`reference_chain_selection=pass version=${manifest.version} immutable_historical=${Object.keys(manifest.historicalFixtures).length} selected=${Object.keys(manifest.selectedFixtures).length}`);

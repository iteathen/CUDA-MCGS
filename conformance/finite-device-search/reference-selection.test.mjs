import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {selectReferencePath,assertReferenceVersion,semanticFixtureProjection,assertHistoricalReferenceBytes,assertSelectedReferenceBytes,assertHistoricalProjectionPayload,referenceSelection,selectReferenceManifestPath} from '../../experiments/search-semantics-reference/src/reference-selection.mjs';
test('reference fixture ancestry is explicitly selected by matching package version',()=>{
  const original=path.resolve('experiments/search-semantics-reference/fixtures/domain-cases.json');
  assert.doesNotThrow(()=>assertReferenceVersion('0.0.0-dev.0','0.0.0-dev.0'));
  assert.doesNotThrow(()=>assertReferenceVersion('0.0.0-dev.3','0.0.0-dev.3'));
  assert.throws(()=>assertReferenceVersion('0.0.0-dev.2','0.0.0-dev.3'));
  assert.throws(()=>selectReferencePath(original,'0.0.0-dev.0'));
  assert.equal(selectReferencePath(original),path.join(path.dirname(original),referenceSelection.version,'domain-cases.json'));
  assert.throws(()=>assertReferenceVersion('0.0.0-dev.0','0.0.0-dev.1'));
  assert.throws(()=>assertReferenceVersion('0.0.0-dev.99','0.0.0-dev.99'));
  const unrelated=path.resolve('schemas/search-ir/0.2.0/requirement-coverage.json');
  assert.equal(selectReferencePath(unrelated),unrelated);
});
test('new projection ancestry cannot hide changed historical normalized owner meaning',async()=>{
  const historical=JSON.parse(await readFile('experiments/search-semantics-reference/fixtures/domain-cases.json','utf8'));
  const current=JSON.parse(await readFile('conformance/search-compiler/build/domain-profiles.json','utf8'));
  assert.doesNotThrow(()=>assertHistoricalProjectionPayload(current,historical.profileProjection,historical.composerEvidence));
  const changed=structuredClone(current);changed.profiles[0].normalized.id+='-changed';
  assert.throws(()=>assertHistoricalProjectionPayload(changed,historical.profileProjection,historical.composerEvidence));
});
test('historical fixture pins reject byte drift and every selected oracle remains unchanged',async()=>{
  const root=path.resolve('experiments/search-semantics-reference');
  const manifest=JSON.parse(await readFile(selectReferenceManifestPath(),'utf8'));
  assertHistoricalReferenceBytes(manifest);
  assertSelectedReferenceBytes(manifest);
  const wrong=structuredClone(manifest);wrong.historicalFixtures['domain-cases.json']='0'.repeat(64);
  assert.throws(()=>assertHistoricalReferenceBytes(wrong),/historical reference fixture byte drift/);
  const wrongSelected=structuredClone(manifest);wrongSelected.selectedFixtures['domain-cases.json']='0'.repeat(64);
  assert.throws(()=>assertSelectedReferenceBytes(wrongSelected),/selected reference fixture byte drift/);
  for(const name of Object.keys(manifest.historicalFixtures)){
    const historical=JSON.parse(await readFile(path.join(root,'fixtures',name),'utf8'));
    const selected=JSON.parse(await readFile(path.join(root,'fixtures',manifest.version,name),'utf8'));
    assert.deepEqual(semanticFixtureProjection(selected),semanticFixtureProjection(historical),name);
    if(selected.composerEvidence){
      assert.equal(selected.composerEvidence.sha256,manifest.selectedComposer,name);
      assert.notEqual(selected.composerEvidence.sha256,manifest.historicalComposer,name);
    }
  }
});
test('versioned reference evolution changes ancestry, never semantic oracles',()=>{
  const historical={schema:'fixture',composerEvidence:{algorithm:'sha256',sha256:'old',byteLength:2},expectedCases:['case'],schedules:{one:{evidenceKey:'old',events:[{answer:3}]}}};
  const selected=structuredClone(historical); selected.composerEvidence.sha256='new';selected.schedules.one.evidenceKey='new';
  assert.deepEqual(semanticFixtureProjection(selected),semanticFixtureProjection(historical));
  selected.schedules.one.events[0].answer=4;
  assert.notDeepEqual(semanticFixtureProjection(selected),semanticFixtureProjection(historical));
});

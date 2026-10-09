import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertHistoricalReferenceBytes,semanticFixtureProjection,selectReferenceManifestPath} from '../experiments/search-semantics-reference/src/reference-selection.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const here=path.join(root,'experiments/search-semantics-reference');
const manifestPath=selectReferenceManifestPath();
const json=async file=>JSON.parse(await readFile(file,'utf8'));
const manifest=await json(manifestPath);
assert(['0.0.0-dev.1','0.0.0-dev.2'].includes(manifest.version),'only registered new explicit chains may be maintained');
assert.equal((await json(path.join(root,'package.json'))).version,manifest.version);
assertHistoricalReferenceBytes(manifest);
const check=spawnSync(process.execPath,[path.join(root,'tools/reference-evidence-locks.mjs'),'--check'],{cwd:root,stdio:'inherit'});
if(check.error)throw check.error;assert.equal(check.status,0,'every actual owner lock must be clean before pinning');
const digest=text=>createHash('sha256').update(text.replace(/\r\n?/g,'\n')).digest('hex');
const selectedFixtures={};
for(const name of Object.keys(manifest.historicalFixtures)){
  const selectedText=await readFile(path.join(here,'fixtures',manifest.version,name),'utf8');
  const historical=await json(path.join(here,'fixtures',name));
  assert.deepEqual(semanticFixtureProjection(JSON.parse(selectedText)),semanticFixtureProjection(historical),`${name}: changed semantic oracle`);
  selectedFixtures[name]=digest(selectedText);
}
manifest.selectedFixtures=selectedFixtures;
manifest.selectionSourceSha256=digest(await readFile(path.join(here,'src/reference-selection.mjs'),'utf8'));
await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(`reference_chain_pinned=${manifest.version} fixtures=${Object.keys(selectedFixtures).length}`);

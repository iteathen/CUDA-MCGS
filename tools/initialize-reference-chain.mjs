import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readdir,readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {selectReferenceManifestPath} from '../experiments/search-semantics-reference/src/reference-selection.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const historical=path.join(root,'experiments/search-semantics-reference/fixtures');
const version=JSON.parse(await readFile(path.join(root,'package.json'),'utf8')).version;
assert(['0.0.0-dev.1','0.0.0-dev.2'].includes(version),'only registered new chains may be initialized');
const selected=path.join(historical,version);
await assert.rejects(()=>access(selected),{code:'ENOENT'},'initialization cannot overwrite an existing selected chain');
await mkdir(selected);
const historicalFixtures={};
for(const name of (await readdir(historical)).filter(name=>name.endsWith('.json')).sort()){
  const text=(await readFile(path.join(historical,name),'utf8')).replace(/\r\n?/g,'\n');
  historicalFixtures[name]=createHash('sha256').update(text).digest('hex');
  await writeFile(path.join(selected,name),text);
}
const manifest={schema:'cuda-mcgs.versioned-reference-chain-selection/0.1.0',version,
 historicalVersion:'0.0.0-dev.0',historicalImplementation:'retained-provenance-only; current source does not replay the historical implementation',
 sourceCheckpoint:version==='0.0.0-dev.1'?'cd2f164b4f28e2f09b5bfa84729c0602da17fc4a':'9d20798b8b1a5c82903e6035c8511ce119934fc8',
 historicalComposer:'0dfcd72db82122f56adedadde35c82af68c5ebb7e6f7acf4298f6705d923e58f',
 selectedComposer:'2f162aee57197c3fe84e4d3b469dd199d3dce9d83ccaf35a51fcbf69b251019a',historicalFixtures};
if(version==='0.0.0-dev.2'){
  const previous=(await readFile(path.join(root,'experiments/search-semantics-reference/reference-chain-selection.json'),'utf8')).replace(/\r\n?/g,'\n');
  manifest.previousSelection={version:'0.0.0-dev.1',manifestSha256:createHash('sha256').update(previous).digest('hex'),claim:'retained-provenance; current source does not replay previous implementation'};
}
await writeFile(selectReferenceManifestPath(),JSON.stringify(manifest,null,2)+'\n');
console.log(`reference_chain_initialized=${version} historical_fixtures=${Object.keys(historicalFixtures).length}`);

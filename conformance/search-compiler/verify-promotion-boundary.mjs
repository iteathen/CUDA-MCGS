#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const componentRoot = path.join(root, 'components', 'search-compiler');
const conformanceRoot = path.join(root, 'conformance', 'search-compiler');
const oldRoot = path.join(root, 'experiments', 'search-ir-composer-reference');
const expected = new Map([["validation.mjs","7d0e932db4982d1550547732ec42c0d44c9ecea5"],["foundation.mjs","995622c3d94b5168cf8b0fde3e5e50cf93eb94da"],["domain.mjs","23562a046ec51cca09f44a0fb24a6b682a3ed880"],["graph.mjs","6ca0807aca175af2394dde49528b79be77e3f8a5"],["policy.mjs","7120df01f2b01d30b4db1717b0ddbf54e8ab6ce4"],["evaluator.mjs","4ffd659de6d84fd3344d4877b0ad8b809999c916"],["resource.mjs","a55fd3798dd80539440b7b8818a3a3211cea15f6"],["progress.mjs","751bcfbf67358692a2085032aa4e336746c202de"],["output.mjs","4ed19886a4dae35a99d9c93a29224d90c4ecd6ea"],["session.mjs","406b2c5293f85e02bc8b09b729b1b6d862557868"],["stage.mjs","34bb8a9f815e46cfa28e70821c592297aa449d24"],["channel.mjs","59981343ca9194eaca730cb4b80468ab21196244"],["program-package.mjs","75c67f47d3fa5c7e6586806216b307314c9d2d22"],["composer.mjs","26d9557eafeba94120f1cb3ea15ee525ade6bea7"]]);

async function exists(target) { try { await stat(target); return true; } catch { return false; } }
async function walk(dir) { const out=[]; for (const e of await readdir(dir,{withFileTypes:true})) { const f=path.join(dir,e.name); if(e.isDirectory()) out.push(...await walk(f)); else if(e.isFile()) out.push(f); } return out; }
function blob(bytes) { return createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex'); }
function imports(text) { const out=[]; for (const p of [/\b(?:import|export)\s+(?:[^'";]*?\s+from\s+)?["']([^"']+)["']/g,/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g]) { for (const m of text.matchAll(p)) out.push(m[1]); } return out; }

assert.equal(await exists(oldRoot), false, 'old Composer experiment path must be absent');
assert.equal(await exists(componentRoot), true, 'production Search Compiler component is absent');
assert.equal(await exists(conformanceRoot), true, 'Search Compiler conformance capsule is absent');
for (const [name, sha] of expected) { const bytes=await readFile(path.join(componentRoot,'src',name)); assert.equal(blob(bytes),sha,`promoted source blob drift: ${name}`); }

for (const file of await walk(path.join(componentRoot, 'src'))) {
  if (!file.endsWith('.mjs')) continue;
  const source=await readFile(file,'utf8');
  for (const spec of imports(source)) {
    if (!spec.startsWith('.')) continue;
    const resolved=path.resolve(path.dirname(file),spec);
    assert.equal(resolved.startsWith(path.join(componentRoot,'src') + path.sep), true, `production source crosses component boundary: ${file} -> ${spec}`);
  }
}
for (const file of await walk(conformanceRoot)) {
  if (!file.endsWith('.mjs')) continue;
  const source=await readFile(file,'utf8');
  for (const spec of imports(source)) {
    if (!spec.startsWith('.')) continue;
    const resolved=path.resolve(path.dirname(file),spec);
    if (resolved.startsWith(componentRoot + path.sep)) assert.equal(resolved, path.join(componentRoot,'testing.mjs'), `conformance must use declared testing port: ${file} -> ${spec}`);
  }
}
for (const area of ['components','adapters','examples']) {
  for (const file of await walk(path.join(root,area))) {
    if (!file.endsWith('.mjs') && !file.endsWith('.js')) continue;
    const source=await readFile(file,'utf8');
    for (const spec of imports(source)) {
      if (!spec.startsWith('.')) continue;
      const resolved=path.resolve(path.dirname(file),spec);
      assert.equal(resolved.startsWith(path.join(root,'experiments')+path.sep), false, `production imports experiment: ${file} -> ${spec}`);
      assert.equal(resolved.startsWith(path.join(root,'conformance')+path.sep), false, `production imports conformance: ${file} -> ${spec}`);
    }
  }
}
console.log(`search_compiler_promotion=pass canonical_blobs=${expected.size} old_experiment=absent conformance_private_imports=0`);

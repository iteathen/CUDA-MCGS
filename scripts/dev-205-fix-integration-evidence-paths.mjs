#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const file = 'experiments/search-semantics-reference/fixtures/integration-cases.json';
const fixture = JSON.parse(await readFile(file, 'utf8'));
let changed = 0;
for (const descriptor of fixture.evidenceInputs) {
  if (descriptor.path.startsWith('experiments/search-ir-composer-reference/')) {
    descriptor.path = descriptor.path.replace('experiments/search-ir-composer-reference/', 'conformance/search-compiler/');
    changed += 1;
  }
}
assert.equal(changed, 2, `expected exactly Composer + Channel evidence path moves, changed=${changed}`);
assert.equal(fixture.evidenceInputs.find(({ id }) => id === 'composer')?.path, 'conformance/search-compiler/build/evidence.json');
assert.equal(fixture.evidenceInputs.find(({ id }) => id === 'channel')?.path, 'conformance/search-compiler/build/channel-evidence.json');
await writeFile(file, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
console.log('integration_evidence_paths=pass moved=2');

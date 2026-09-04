#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const evidenceRoots = [
  'experiments/search-semantics-reference',
  'conformance/search-compiler',
];
const productionNames = [
  'validation.mjs', 'foundation.mjs', 'domain.mjs', 'graph.mjs', 'policy.mjs', 'evaluator.mjs', 'resource.mjs',
  'progress.mjs', 'output.mjs', 'session.mjs', 'stage.mjs', 'channel.mjs', 'program-package.mjs', 'composer.mjs',
];
const productionSet = new Set(productionNames);
const testingImport = "import { readSearchCompilerSource } from '../../components/search-compiler/testing.mjs';";

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

const directHashPattern = /sourceTextSha256\(await readFile\(path\.join\(repositoryRoot, relative\)(?:,\s*['"]utf8['"])?\)\)/g;
const routedHash = "sourceTextSha256(relative.startsWith('components/search-compiler/src/') ? Buffer.from(await readSearchCompilerSource(path.basename(relative)), 'utf8') : await readFile(path.join(repositoryRoot, relative)))";

let changedFiles = 0;
let routedReaders = 0;
let canonicalPathLabels = 0;
for (const evidenceRoot of evidenceRoots) {
  for (const file of await walk(evidenceRoot)) {
    if (!file.endsWith('.mjs')) continue;
    let source = await readFile(file, 'utf8');
    const before = source;

    // Support/evidence files live in conformance. Canonical implementation source lives in the production component.
    source = source.replaceAll('experiments/search-ir-composer-reference', 'conformance/search-compiler');
    for (const name of productionNames) {
      const oldPath = `conformance/search-compiler/src/${name}`;
      const newPath = `components/search-compiler/src/${name}`;
      if (source.includes(oldPath)) {
        source = source.replaceAll(oldPath, newPath);
        canonicalPathLabels += 1;
      }
    }

    directHashPattern.lastIndex = 0;
    if (source.includes('components/search-compiler/src/') && directHashPattern.test(source)) {
      directHashPattern.lastIndex = 0;
      source = source.replace(directHashPattern, routedHash);
      if (!source.includes(testingImport)) source = `${testingImport}\n${source}`;
      routedReaders += 1;
    }

    if (source !== before) {
      await writeFile(file, source, 'utf8');
      changedFiles += 1;
    }
  }
}

assert(changedFiles > 0, 'no downstream provenance file required #205 rewiring');
assert(canonicalPathLabels > 0, 'no canonical Search Compiler source path was re-owned');
assert(routedReaders > 0, 'no canonical source-manifest reader was routed through testing.mjs');

// Fail if any active evidence source manifest still labels one of the 14 canonical modules as conformance source.
for (const evidenceRoot of evidenceRoots) {
  for (const file of await walk(evidenceRoot)) {
    if (!file.endsWith('.mjs')) continue;
    const source = await readFile(file, 'utf8');
    for (const name of productionSet) {
      assert.equal(source.includes(`conformance/search-compiler/src/${name}`), false, `${file} still labels canonical ${name} as conformance source`);
    }
  }
}

console.log(`downstream_source_provenance=pass changed_files=${changedFiles} canonical_path_labels=${canonicalPathLabels} routed_readers=${routedReaders}`);

#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const OLD_COMPOSER = '3b701ac4d8fcb6f831d274656af0a65932cea1b479a18e2a80d8909e880fd731';
const composerBuild = 'experiments/search-ir-composer-reference/build';
const semanticsBuild = 'experiments/search-semantics-reference/build';

async function readJson(path) { return JSON.parse(await readFile(path, 'utf8')); }
async function writeJson(path, value) { await writeFile(path, `${JSON.stringify(value, null, 2)}\n`); }
function run(path) {
  console.log(`rebind_run=${path}`);
  const result = spawnSync(process.execPath, [path], { encoding: 'utf8', stdio: 'inherit' });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${path} failed`);
}
function identity(value) {
  assert.equal(value?.algorithm, 'sha256');
  assert.equal(typeof value?.byteLength, 'number');
  assert.match(value?.sha256 ?? '', /^[0-9a-f]{64}$/);
  return { algorithm: value.algorithm, byteLength: value.byteLength, sha256: value.sha256 };
}
function bindComposer(fixture, composerIdentity) {
  assert.equal(fixture.composerEvidence?.sha256, OLD_COMPOSER, 'fixture must still bind the prior Composer packet before rebind');
  fixture.composerEvidence = identity(composerIdentity);
}
function bindProjection(fixture, projectionIdentity) {
  assert.equal(typeof fixture.profileProjection?.schema, 'string');
  fixture.profileProjection = { schema: fixture.profileProjection.schema, ...identity(projectionIdentity) };
}
async function updateFixture(path, mutate) {
  const fixture = await readJson(path);
  mutate(fixture);
  await writeJson(path, fixture);
}
async function evidence(path) { return identity((await readJson(path)).evidenceIdentity); }

run('scripts/run-search-ir-reference.mjs');
run('scripts/run-search-ir-composer-reference.mjs');
for (const owner of ['domain', 'graph', 'policy', 'evaluator', 'resource', 'progress', 'output', 'session', 'stage']) {
  run(`scripts/export-search-ir-composer-${owner}-profiles.mjs`);
}

const composer = identity((await readJson(`${composerBuild}/evidence.json`)).representationCompositionEvidenceKey);
assert.notEqual(composer.sha256, OLD_COMPOSER);
const projection = {};
for (const owner of ['domain', 'graph', 'policy', 'evaluator', 'resource', 'progress', 'output', 'session', 'stage']) {
  projection[owner] = identity((await readJson(`${composerBuild}/${owner}-profiles.json`)).projectionIdentity);
}
console.log(`rebind_composer=${composer.sha256} bytes=${composer.byteLength}`);

await updateFixture('experiments/search-semantics-reference/fixtures/neutral-schedules.json', (fixture) => {
  bindComposer(fixture, composer);
  for (const schedule of Object.values(fixture.schedules)) {
    assert.equal(schedule.evidenceKey, OLD_COMPOSER);
    schedule.evidenceKey = composer.sha256;
  }
});
await updateFixture('experiments/search-semantics-reference/fixtures/domain-cases.json', (fixture) => {
  bindComposer(fixture, composer);
  bindProjection(fixture, projection.domain);
});
run('scripts/run-search-semantics-reference.mjs');
const domain = await evidence(`${semanticsBuild}/evidence.json`);

await updateFixture('experiments/search-semantics-reference/fixtures/graph-node-cases.json', (fixture) => {
  bindComposer(fixture, composer);
  bindProjection(fixture, projection.graph);
});
run('scripts/run-graph-node-reference.mjs');
const node = await evidence(`${semanticsBuild}/graph-node-evidence.json`);

for (const path of ['graph-edge-cases.json', 'graph-ref-cases.json']) {
  await updateFixture(`experiments/search-semantics-reference/fixtures/${path}`, (fixture) => {
    bindComposer(fixture, composer);
    bindProjection(fixture, projection.graph);
    fixture.nodeEvidence = node;
  });
}
run('scripts/run-graph-edge-reference.mjs');
const edge = await evidence(`${semanticsBuild}/graph-edge-evidence.json`);
run('scripts/run-graph-ref-reference.mjs');
const ref = await evidence(`${semanticsBuild}/graph-ref-evidence.json`);

await updateFixture('experiments/search-semantics-reference/fixtures/graph-path-cases.json', (fixture) => {
  bindComposer(fixture, composer);
  bindProjection(fixture, projection.graph);
  fixture.nodeEvidence = node;
  fixture.refEvidence = ref;
});
run('scripts/run-graph-path-reference.mjs');
const pathEvidence = await evidence(`${semanticsBuild}/graph-path-evidence.json`);

await updateFixture('experiments/search-semantics-reference/fixtures/graph-root-cases.json', (fixture) => {
  bindComposer(fixture, composer);
  bindProjection(fixture, projection.graph);
  fixture.nodeEvidence = node;
  fixture.refEvidence = ref;
  fixture.pathEvidence = pathEvidence;
});
run('scripts/run-graph-root-reference.mjs');
const root = await evidence(`${semanticsBuild}/graph-root-evidence.json`);

await updateFixture('experiments/search-semantics-reference/fixtures/graph-reclaim-cases.json', (fixture) => {
  bindComposer(fixture, composer);
  bindProjection(fixture, projection.graph);
  fixture.nodeEvidence = node;
  fixture.edgeEvidence = edge;
  fixture.refEvidence = ref;
  fixture.pathEvidence = pathEvidence;
  fixture.rootEvidence = root;
});
run('scripts/run-graph-reclaim-reference.mjs');
const reclaim = await evidence(`${semanticsBuild}/graph-reclaim-evidence.json`);

await updateFixture('experiments/search-semantics-reference/fixtures/graph-advance-occurrence-cases.json', (fixture) => {
  bindComposer(fixture, composer);
  bindProjection(fixture, projection.graph);
  fixture.nodeEvidence = node;
  fixture.edgeEvidence = edge;
  fixture.refEvidence = ref;
  fixture.pathEvidence = pathEvidence;
  fixture.rootEvidence = root;
  fixture.reclaimEvidence = reclaim;
});
run('scripts/run-graph-advance-occurrence-reference.mjs');
const advance = await evidence(`${semanticsBuild}/graph-advance-occurrence-evidence.json`);

await updateFixture('experiments/search-semantics-reference/fixtures/graph-cleanup-cases.json', (fixture) => {
  bindComposer(fixture, composer);
  bindProjection(fixture, projection.graph);
  fixture.nodeEvidence = node;
  fixture.edgeEvidence = edge;
  fixture.refEvidence = ref;
  fixture.pathEvidence = pathEvidence;
  fixture.rootEvidence = root;
  fixture.reclaimEvidence = reclaim;
  fixture.advanceOccurrenceEvidence = advance;
});
run('scripts/run-graph-cleanup-reference.mjs');

for (const [owner, script] of [
  ['policy', 'scripts/run-policy-reference.mjs'],
  ['evaluator', 'scripts/run-evaluator-reference.mjs'],
  ['resource', 'scripts/run-resource-reference.mjs'],
]) {
  await updateFixture(`experiments/search-semantics-reference/fixtures/${owner}-cases.json`, (fixture) => {
    bindComposer(fixture, composer);
    bindProjection(fixture, projection[owner]);
  });
  run(script);
}
for (const [owner, script] of [
  ['progress', 'scripts/run-progress-reference.mjs'],
  ['output', 'scripts/run-output-reference.mjs'],
]) {
  await updateFixture(`experiments/search-semantics-reference/fixtures/${owner}-cases.json`, (fixture) => bindComposer(fixture, composer));
  run(script);
}
await updateFixture('experiments/search-semantics-reference/fixtures/framework-lifecycle-cases.json', (fixture) => bindComposer(fixture, composer));
run('scripts/run-framework-lifecycle-reference.mjs');

// These independent owners are expected not to change, but regenerate their exact evidence for the final packet.
for (const script of [
  'scripts/run-terminal-slice-reference.mjs',
  'scripts/run-session-reference.mjs',
  'scripts/run-stage-reference.mjs',
  'scripts/run-channel-reference-evidence.mjs',
]) run(script);

await updateFixture('experiments/search-semantics-reference/fixtures/integration-cases.json', (fixture) => bindComposer(fixture, composer));
run('experiments/search-semantics-reference/run-integration.mjs');

const integrationFixture = await readJson('experiments/search-semantics-reference/fixtures/integration-cases.json');
const frozen = {};
for (const descriptor of integrationFixture.evidenceInputs) {
  const ownerEvidence = await readJson(descriptor.path);
  frozen[descriptor.id] = identity(
    descriptor.id === 'composer' ? ownerEvidence.representationCompositionEvidenceKey
      : descriptor.id === 'search-ir' ? ownerEvidence.searchIrIdentity
        : ownerEvidence.evidenceIdentity,
  );
}
assert.deepEqual(Object.keys(frozen).sort(), integrationFixture.evidenceInputs.map(({ id }) => id).sort());

const gatePath = 'experiments/search-semantics-reference/run-integration-gate.mjs';
let gate = await readFile(gatePath, 'utf8');
const marker = /const frozenEvidenceIdentities = \{[\s\S]*?\n\};\n\nconst requiredComposerWitnesses/;
assert.equal((gate.match(marker) ?? []).length, 1, 'final gate frozen evidence table seam must be unique');
gate = gate.replace(marker, `const frozenEvidenceIdentities = ${JSON.stringify(frozen, null, 2)};\n\nconst requiredComposerWitnesses`);
await writeFile(gatePath, gate);
run('experiments/search-semantics-reference/run-integration-gate.mjs');

console.log(`rebind_complete composer=${composer.sha256} domain=${domain.sha256} node=${node.sha256} edge=${edge.sha256} ref=${ref.sha256} path=${pathEvidence.sha256} root=${root.sha256} reclaim=${reclaim.sha256} advance=${advance.sha256}`);

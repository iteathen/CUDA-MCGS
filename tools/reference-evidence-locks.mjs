#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(repositoryRoot, 'experiments', 'search-semantics-reference', 'fixtures');
const integrationFixturePath = path.join(fixtureRoot, 'integration-cases.json');
const integrationLocksPath = path.join(fixtureRoot, 'integration-evidence-locks.json');

const EVIDENCE_FIELD_TO_ID = new Map([
  ['domainEvidence', 'domain'],
  ['nodeEvidence', 'graph-node'],
  ['edgeEvidence', 'graph-edge'],
  ['refEvidence', 'graph-ref'],
  ['pathEvidence', 'graph-path'],
  ['rootEvidence', 'graph-root'],
  ['reclaimEvidence', 'graph-reclaim'],
  ['advanceOccurrenceEvidence', 'graph-advance'],
  ['cleanupEvidence', 'graph-cleanup'],
  ['policyEvidence', 'policy'],
  ['evaluatorEvidence', 'evaluator'],
  ['resourceEvidence', 'resource'],
  ['progressEvidence', 'progress'],
  ['outputEvidence', 'output'],
  ['frameworkEvidence', 'framework'],
  ['terminalEvidence', 'terminal'],
  ['sessionEvidence', 'session'],
  ['stageEvidence', 'stage'],
  ['channelEvidence', 'channel'],
]);

const PROFILE_PROJECTIONS = new Map([
  ['cuda-mcgs.search-ir-composer-domain-profile-projection/0.2.0', ['domain', 'domain-profiles.json']],
  ['cuda-mcgs.search-ir-composer-graph-profile-projection/0.2.0', ['graph', 'graph-profiles.json']],
  ['cuda-mcgs.search-ir-composer-policy-profile-projection/0.2.0', ['policy', 'policy-profiles.json']],
  ['cuda-mcgs.search-ir-composer-evaluator-profile-projection/0.2.0', ['evaluator', 'evaluator-profiles.json']],
  ['cuda-mcgs.search-ir-composer-resource-profile-projection/0.2.0', ['resource', 'resource-profiles.json']],
  ['cuda-mcgs.search-ir-composer-progress-profile-projection/0.2.0', ['progress', 'progress-profiles.json']],
  ['cuda-mcgs.search-ir-composer-output-profile-projection/0.2.0', ['output', 'output-profiles.json']],
  ['cuda-mcgs.search-ir-composer-session-profile-projection/0.2.0', ['session', 'session-profiles.json']],
  ['cuda-mcgs.search-ir-composer-stage-profile-projection/0.2.0', ['stage', 'stage-profiles.json']],
]);

function usage() {
  return 'usage: node tools/reference-evidence-locks.mjs [--check [source] | --write source]';
}

function parseArgs(args) {
  if (args.length === 0) return { mode: 'check', source: null };
  if (args[0] === '--check' && args.length <= 2) return { mode: 'check', source: args[1] ?? null };
  if (args[0] === '--write' && args.length === 2) return { mode: 'write', source: args[1] };
  throw new Error(usage());
}

async function readJson(absolutePath) {
  return JSON.parse(await readFile(absolutePath, 'utf8'));
}

function assertIdentity(value, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an identity object`);
  assert.equal(value.algorithm, 'sha256', `${label} algorithm must be sha256`);
  assert(Number.isSafeInteger(value.byteLength) && value.byteLength >= 0, `${label} byteLength must be a non-negative safe integer`);
  assert.match(value.sha256, /^[0-9a-f]{64}$/, `${label} sha256 must be lowercase hex`);
  return { algorithm: value.algorithm, byteLength: value.byteLength, sha256: value.sha256 };
}

function isIdentityShape(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value)
    && Object.hasOwn(value, 'algorithm') && Object.hasOwn(value, 'byteLength') && Object.hasOwn(value, 'sha256'));
}

function identityEqual(left, right) {
  return left.algorithm === right.algorithm && left.byteLength === right.byteLength && left.sha256 === right.sha256;
}

function withIdentity(existing, identity) {
  return { ...existing, algorithm: identity.algorithm, byteLength: identity.byteLength, sha256: identity.sha256 };
}

function identityOf(id, evidence) {
  if (id === 'composer') return evidence.representationCompositionEvidenceKey;
  if (id === 'search-ir') return evidence.searchIrIdentity;
  return evidence.evidenceIdentity;
}

const { mode, source: selectedSource } = parseArgs(process.argv.slice(2));
const integrationFixture = await readJson(integrationFixturePath);
assert(Array.isArray(integrationFixture.evidenceInputs), 'integration-cases evidenceInputs must be an array');
const descriptors = new Map(integrationFixture.evidenceInputs.map((entry) => [entry.id, entry]));
assert.equal(descriptors.size, integrationFixture.evidenceInputs.length, 'integration-cases evidence ids must be unique');

const identityCache = new Map();
async function evidenceIdentity(id) {
  if (identityCache.has(id)) return identityCache.get(id);
  const descriptor = descriptors.get(id);
  assert(descriptor, `no integration evidence descriptor owns ${id}`);
  const absolutePath = path.join(repositoryRoot, descriptor.path);
  const evidence = await readJson(absolutePath);
  if (Object.hasOwn(evidence, 'status')) assert.equal(evidence.status, 'pass', `${id} producer evidence must pass before its lock can be maintained`);
  const identity = assertIdentity(identityOf(id, evidence), `${id} producer identity`);
  identityCache.set(id, identity);
  return identity;
}

const projectionCache = new Map();
async function projectionIdentity(schema) {
  const definition = PROFILE_PROJECTIONS.get(schema);
  assert(definition, `unrecognized profile projection schema ${schema}`);
  const [kind, filename] = definition;
  const sourceKey = `projection:${kind}`;
  if (projectionCache.has(sourceKey)) return projectionCache.get(sourceKey);
  const projection = await readJson(path.join(repositoryRoot, 'conformance', 'search-compiler', 'build', filename));
  const identity = assertIdentity(projection.projectionIdentity, `${sourceKey} producer identity`);
  projectionCache.set(sourceKey, identity);
  return identity;
}

let rootControlIdentityCache = null;
async function rootControlIdentity() {
  if (rootControlIdentityCache) return rootControlIdentityCache;
  const control = await readJson(path.join(repositoryRoot, 'conformance', 'search-compiler', 'build', 'root-control.json'));
  rootControlIdentityCache = assertIdentity(control.identity, 'root-control producer identity');
  return rootControlIdentityCache;
}

function sourceForFixtureField(key, value) {
  if (key === 'composerEvidence' && isIdentityShape(value)) {
    return { sourceKey: 'composer', load: () => evidenceIdentity('composer') };
  }
  if (key === 'profileProjection' && isIdentityShape(value)) {
    const definition = PROFILE_PROJECTIONS.get(value.schema);
    assert(definition, `identity-bearing profileProjection has unrecognized schema ${value.schema}`);
    return { sourceKey: `projection:${definition[0]}`, load: () => projectionIdentity(value.schema) };
  }
  if (key === 'rootControlProjection' && isIdentityShape(value)) {
    return { sourceKey: 'root-control', load: rootControlIdentity };
  }
  if (key.endsWith('Evidence') && isIdentityShape(value)) {
    const id = EVIDENCE_FIELD_TO_ID.get(key);
    assert(id, `identity-bearing fixture field ${key} has no explicit producer mapping`);
    return { sourceKey: id, load: () => evidenceIdentity(id) };
  }
  return null;
}

const changes = [];
const seenSources = new Set();
const fixtureNames = (await readdir(fixtureRoot)).filter((name) => name.endsWith('.json') && name !== path.basename(integrationLocksPath)).sort();

for (const name of fixtureNames) {
  const absolutePath = path.join(fixtureRoot, name);
  const fixture = await readJson(absolutePath);
  let changed = false;
  for (const [key, value] of Object.entries(fixture)) {
    const source = sourceForFixtureField(key, value);
    if (!source) continue;
    seenSources.add(source.sourceKey);
    if (selectedSource !== null && selectedSource !== source.sourceKey) continue;
    const expected = await source.load();
    const actual = assertIdentity(value, `${name}:${key}`);
    if (identityEqual(actual, expected)) continue;
    changes.push(`${name}:${key} <- ${source.sourceKey}`);
    if (mode === 'write') {
      fixture[key] = withIdentity(value, expected);
      changed = true;
    }
  }
  if (changed) await writeFile(absolutePath, `${JSON.stringify(fixture, null, 2)}\n`);
}

const locks = await readJson(integrationLocksPath);
assert.equal(locks.schema, 'cuda-mcgs.reference-integration-evidence-locks/0.1.0');
assert(locks.identities && typeof locks.identities === 'object' && !Array.isArray(locks.identities), 'integration evidence locks must contain identities');
const lockIds = Object.keys(locks.identities).sort();
const descriptorIds = [...descriptors.keys()].sort();
assert.deepEqual(lockIds, descriptorIds, 'integration lock ids must exactly match the final integration evidence manifest');
let locksChanged = false;
for (const id of descriptorIds) {
  seenSources.add(id);
  if (selectedSource !== null && selectedSource !== id) continue;
  const expected = await evidenceIdentity(id);
  const actual = assertIdentity(locks.identities[id], `integration lock ${id}`);
  if (identityEqual(actual, expected)) continue;
  changes.push(`integration-evidence-locks.json:${id} <- ${id}`);
  if (mode === 'write') {
    locks.identities[id] = expected;
    locksChanged = true;
  }
}
if (locksChanged) await writeFile(integrationLocksPath, `${JSON.stringify(locks, null, 2)}\n`);

if (selectedSource !== null && !seenSources.has(selectedSource)) {
  throw new Error(`unknown evidence-lock source ${selectedSource}; ${usage()}`);
}

if (mode === 'check' && changes.length !== 0) {
  console.error(`reference_evidence_locks=drift count=${changes.length}`);
  for (const change of changes) console.error(`drift=${change}`);
  process.exit(1);
}

console.log(`reference_evidence_locks=${mode === 'write' ? 'written' : 'clean'} source=${selectedSource ?? 'all'} changes=${changes.length}`);
if (mode === 'write' && changes.length !== 0) {
  console.log('next=rerun affected producer capsules before refreshing any downstream evidence source');
}

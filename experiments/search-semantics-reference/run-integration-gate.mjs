import assert from 'node:assert/strict';
import { readFile, rename, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { canonicalClone, canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { fail } from './src/errors.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixturePath = path.join(experimentRoot, 'fixtures', 'integration-cases.json');
const coveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');
const verifierPath = path.join(experimentRoot, 'run-integration.mjs');
const integrationEvidencePath = path.join(experimentRoot, 'build', 'integration-evidence.json');
const gateEvidencePath = path.join(experimentRoot, 'build', 'integration-gate-evidence.json');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS reference integration gate requires Node 26 or newer; found ${process.version}`);

const requiredEvidenceIds = [
  'search-ir',
  'composer',
  'domain',
  'graph-node',
  'graph-edge',
  'graph-ref',
  'graph-path',
  'graph-root',
  'graph-reclaim',
  'graph-advance',
  'graph-cleanup',
  'policy',
  'evaluator',
  'resource',
  'progress',
  'output',
  'framework',
  'terminal',
  'session',
  'stage',
  'channel',
];

const frozenEvidenceIdentities = {
  'search-ir': { algorithm: 'sha256', byteLength: 7749, sha256: 'bd6679178c6754fe9b06d6fa54d038166b7ef39e32fb5f51513cc303cfd63a96' },
  composer: { algorithm: 'sha256', byteLength: 729040, sha256: '1bf7703fc7758c18f0f74e7573eb126410f8ad09b1e60145cbeaccdef20e10e2' },
  domain: { algorithm: 'sha256', byteLength: 30372, sha256: '09f4c7351255cd04d2a8ff22cac0a2365d0755dcbc4bb8175afa43861c9b832e' },
  'graph-node': { algorithm: 'sha256', byteLength: 10047, sha256: '6d4cf5a8e3ff3e67a15872535ffd21bb35ab85340344fc1fe165a8d349af5609' },
  'graph-edge': { algorithm: 'sha256', byteLength: 11661, sha256: 'e68def2acdae419b5154fee823d5cd7b827594f1d4e4c5660bf2276451dcda2c' },
  'graph-ref': { algorithm: 'sha256', byteLength: 9139, sha256: 'ebe8bfa97932485b327981c66118081791d1693935024f7096a0eec56821ba1c' },
  'graph-path': { algorithm: 'sha256', byteLength: 9530, sha256: 'b775f75c24927f3336cb9da6de25b0032c14ff6336c031d8b8f82fafa7e47a05' },
  'graph-root': { algorithm: 'sha256', byteLength: 10008, sha256: '010fd4e7e3e96e380af820cfc950208d5c60decc83aeed3b7c5353679056bf4f' },
  'graph-reclaim': { algorithm: 'sha256', byteLength: 12127, sha256: 'aefb4b89b4b7187f260b015035ef334878e3234083ae104a92eb8025d801bb78' },
  'graph-advance': { algorithm: 'sha256', byteLength: 4195, sha256: 'eab52018dd15f47553c7d5443488667da1caf5988c8e47d8b0033c343a0a4c66' },
  'graph-cleanup': { algorithm: 'sha256', byteLength: 5466, sha256: 'fbea8e5bc81288ec627591804c2bc5135d477657c8fad0c74682a2fffd71b918' },
  policy: { algorithm: 'sha256', byteLength: 13104, sha256: '589e23eb5964409356a875b1cd05dcec7192ba42a87d7edc04b9226cc4732b88' },
  evaluator: { algorithm: 'sha256', byteLength: 18051, sha256: 'be27c05b2d1d900225e7673be99c5d16a85b4e7f4c7044d89d880fc9037b1f8e' },
  resource: { algorithm: 'sha256', byteLength: 12512, sha256: 'fb765229b3259d426fbc44334fe0f13358728bc83e2a47a8d0fbe1beb8d26ad8' },
  progress: { algorithm: 'sha256', byteLength: 12006, sha256: '5e3a4800ec5a6fa8d4493fd6d52043afa03626a7b9e559c131fb450aba826619' },
  output: { algorithm: 'sha256', byteLength: 16538, sha256: 'cb4870393eaaf5fe74bc0b9cb11baa4f7fef870039c6f8398454aa16afc808e8' },
  framework: { algorithm: 'sha256', byteLength: 6517, sha256: 'a28759c30c67db40937643bc41e436d55fe6d31b2bbf71cb2f1edb103290d799' },
  terminal: { algorithm: 'sha256', byteLength: 9388, sha256: '695cf499ba9b56a8ba89b4757b7287e8eb62c2195dffb5dd58f8039e08480425' },
  session: { algorithm: 'sha256', byteLength: 18579, sha256: '64ce202af294ebe2003935cd35925fe640ff1ff1e1bb58d319fdfd5e78e80196' },
  stage: { algorithm: 'sha256', byteLength: 9395, sha256: 'a81a630d160ed19186037d8ae44d1d7205c0cfb26f70ffad3e4bcf7545f06a4b' },
  channel: { algorithm: 'sha256', byteLength: 17158, sha256: 'bf6263537e7d6676fe3064df84d6bfed6356bf297c1a041b5c9a9a4cb239efe7' },
};

const requiredComposerWitnesses = {
  productNeutral: [
    'materially-different-composer-engines-cannot-collide',
    'namespaced-product-second-instance-and-deletion',
    'universal-normalized-product-assumption-absence',
  ],
  deletion: [
    'compose-cross-profile-deletion-matrix',
    'canonical-composer-evaluator-deletion',
    'canonical-composer-live-output-deletion',
    'canonical-composer-search-session-deletion',
    'canonical-composer-stage-substrate-deletion',
    'canonical-composer-async-channel-deletion',
    'canonical-composer-capability-product-deletion',
    'canonical-composer-namespaced-product-deletion',
  ],
};

async function readJson(absolutePath) {
  return JSON.parse(await readFile(absolutePath, 'utf8'));
}

function identityOf(id, evidence) {
  if (id === 'composer') return evidence.representationCompositionEvidenceKey;
  if (id === 'search-ir') return evidence.searchIrIdentity;
  return evidence.evidenceIdentity;
}

function assertFrozenIdentity(id, identity) {
  assert.deepEqual(identity, frozenEvidenceIdentities[id], `${id} evidence identity must remain frozen for REF-INTEGRATE-01`);
}

function assertExactEvidenceManifest(fixture) {
  const actual = fixture.evidenceInputs.map(({ id }) => id).sort();
  const expected = [...requiredEvidenceIds].sort();
  assert.deepEqual(actual, expected, 'final integration evidence input manifest must contain every exact owner/input once');
  assert.equal(new Set(actual).size, actual.length, 'final integration evidence input ids must be unique');
}

function assertRequiredComposerWitnesses(fixture) {
  for (const [family, caseIds] of Object.entries(requiredComposerWitnesses)) {
    const actual = new Set((fixture.witnesses?.[family] ?? []).filter(({ evidence }) => evidence === 'composer').map(({ case: caseId }) => caseId));
    for (const caseId of caseIds) assert(actual.has(caseId), `final ${family} witness set must bind Composer owner case ${caseId}`);
  }
}

async function assertFrozenOwnerEvidence(fixture) {
  assertExactEvidenceManifest(fixture);
  assertRequiredComposerWitnesses(fixture);
  for (const descriptor of fixture.evidenceInputs) {
    const evidence = await readJson(path.join(repositoryRoot, descriptor.path));
    assertFrozenIdentity(descriptor.id, identityOf(descriptor.id, evidence));
  }
}

function runVerifier() {
  const result = spawnSync(process.execPath, [verifierPath], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: process.env,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`,
    error: result.error ?? null,
  };
}

function requireVerifierPass(label) {
  const result = runVerifier();
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${label} must pass final integration verifier\n${result.output}`);
  return result;
}

function requireVerifierFailure(label, expectedText) {
  const result = runVerifier();
  if (result.error) throw result.error;
  assert.notEqual(result.status, 0, `${label} mutation must be rejected by final integration verifier`);
  assert(result.output.includes(expectedText), `${label} mutation failed for an unexpected reason; expected ${JSON.stringify(expectedText)}\n${result.output}`);
  return { label, expectedText, status: 'detected' };
}

async function withFileMutation(absolutePath, mutate, body) {
  const original = await readFile(absolutePath);
  try {
    const mutated = await mutate(original);
    await writeFile(absolutePath, mutated);
    return await body();
  } finally {
    await writeFile(absolutePath, original);
  }
}

async function missingOwnerMutation(fixture) {
  const terminalDescriptor = fixture.evidenceInputs.find(({ id }) => id === 'terminal');
  assert(terminalDescriptor, 'terminal evidence descriptor is required for missing-owner mutation');
  const evidencePath = path.join(repositoryRoot, terminalDescriptor.path);
  const backupPath = `${evidencePath}.integration-mutation-backup`;
  await rename(evidencePath, backupPath);
  try {
    return requireVerifierFailure('missing-owner-evidence', 'is required');
  } finally {
    await rename(backupPath, evidencePath);
  }
}

async function missingWitnessMutation() {
  return withFileMutation(fixturePath, async (original) => {
    const mutated = JSON.parse(original.toString('utf8'));
    mutated.witnesses.productNeutral[0].case = 'integration-mutation-missing-owner-case';
    return Buffer.from(`${JSON.stringify(mutated, null, 2)}\n`);
  }, async () => requireVerifierFailure('missing-witness', 'does not contain required case integration-mutation-missing-owner-case'));
}

async function nativePromotionMutation() {
  return withFileMutation(coveragePath, async (original) => {
    const mutated = JSON.parse(original.toString('utf8'));
    const route = mutated.classifications.find(({ primaryDisposition }) => primaryDisposition === 'native-compatible-pair-qualification');
    assert(route, 'native qualification route required for mutation');
    route.evidenceStatus = 'reference-promoted-by-mutation';
    return Buffer.from(`${JSON.stringify(mutated, null, 2)}\n`);
  }, async () => requireVerifierFailure('native-route-promotion', 'native route must remain deferred'));
}

async function channelRouteLossMutation(fixture) {
  const descriptor = fixture.evidenceInputs.find(({ id }) => id === 'channel');
  assert(descriptor, 'Channel evidence descriptor is required for route-loss mutation');
  const channelPath = path.join(repositoryRoot, descriptor.path);
  return withFileMutation(channelPath, async (original) => {
    const mutated = JSON.parse(original.toString('utf8'));
    mutated.directRequirements = mutated.directRequirements.slice(1);
    return Buffer.from(`${JSON.stringify(mutated, null, 2)}\n`);
  }, async () => requireVerifierFailure('channel-route-loss', 'Channel reference route count drifted'));
}

function substitutedIdentityMutation() {
  const mutated = canonicalClone(frozenEvidenceIdentities.stage);
  mutated.sha256 = '0'.repeat(64);
  assert.throws(() => assertFrozenIdentity('stage', mutated), /stage evidence identity must remain frozen/);
  return { label: 'substituted-owner-identity', status: 'detected' };
}

function replicaDivergenceMutation(baselineEvidence) {
  const replicaCase = baselineEvidence.cases.find(({ id }) => id === 'integration-multi-device-independent-replicas');
  assert.equal(replicaCase?.status, 'pass', 'baseline multi-device-neutrality case must pass');
  const expected = replicaCase.detail.semanticIdentity;
  const replicas = [
    { terminal: true, semanticIdentity: expected },
    { terminal: true, semanticIdentity: { ...expected, sha256: 'f'.repeat(64) } },
  ];
  assert.throws(() => {
    assert(replicas.every(({ terminal }) => terminal === true), 'all replicas must be terminal');
    assert(replicas.every(({ semanticIdentity }) => semanticIdentity.sha256 === expected.sha256), 'opaque device slot must not alter one-device semantic meaning');
  }, /opaque device slot must not alter one-device semantic meaning/);
  return { label: 'replica-semantic-divergence', status: 'detected' };
}

function finalIdentitySensitivityMutation(baselineEvidence) {
  const sensitivity = baselineEvidence.cases.find(({ id }) => id === 'integration-evidence-identity-content-sensitive');
  assert.equal(sensitivity?.status, 'pass', 'baseline integration identity sensitivity case must pass');
  assert.notDeepEqual(sensitivity.detail.baseline, sensitivity.detail.mutated, 'final evidence identity mutation must change canonical identity');
  return { label: 'final-evidence-identity-mutation', status: 'detected' };
}

const fixture = await readJson(fixturePath);
await assertFrozenOwnerEvidence(fixture);
requireVerifierPass('baseline-before-mutation-matrix');
const baselineBefore = await readJson(integrationEvidencePath);
assert.equal(baselineBefore.status, 'pass');

const mutations = [];
mutations.push(await missingOwnerMutation(fixture));
mutations.push(substitutedIdentityMutation());
mutations.push(await missingWitnessMutation());
mutations.push(await nativePromotionMutation());
mutations.push(await channelRouteLossMutation(fixture));
mutations.push(replicaDivergenceMutation(baselineBefore));
mutations.push(finalIdentitySensitivityMutation(baselineBefore));

await assertFrozenOwnerEvidence(await readJson(fixturePath));
requireVerifierPass('baseline-after-mutation-matrix');
const baselineAfter = await readJson(integrationEvidencePath);
assert.equal(baselineAfter.status, 'pass');
assert.deepEqual(baselineAfter.evidenceIdentity, baselineBefore.evidenceIdentity, 'mutation matrix cleanup must restore the exact baseline integration identity');

const sourcePaths = [
  'docs/development/2026-09-02-ref-integrate-01-assessment-and-plan.md',
  'experiments/search-semantics-reference/fixtures/integration-cases.json',
  'experiments/search-semantics-reference/run-integration.mjs',
  'experiments/search-semantics-reference/run-integration-gate.mjs',
  'scripts/run-engine-reference-integration.mjs',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));

const gateSubject = {
  schema: 'cuda-mcgs.engine-reference-integration-gate-evidence-key/0.1.0',
  frozenInputEvidence: frozenEvidenceIdentities,
  baselineIntegrationEvidence: baselineAfter.evidenceIdentity,
  baselineSummary: baselineAfter.summary,
  mutationMatrix: mutations,
  sources,
};
const evidenceIdentity = canonicalIdentity(gateSubject, 'engine reference integration gate evidence');
const gateEvidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-engine-reference-integration-gate-v0.1.0',
  scope: 'final-cuda-free-reference-packet-and-mutation-matrix',
  status: 'pass',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  frozenInputEvidence: frozenEvidenceIdentities,
  baselineIntegrationEvidence: baselineAfter.evidenceIdentity,
  evidenceIdentity,
  summary: {
    expected: mutations.length,
    discovered: mutations.length,
    executed: mutations.length,
    passed: mutations.length,
    failed: 0,
    requiredSkipped: 0,
    conditionalSkipped: 0,
    optionalSkipped: 0,
    notDiscovered: 0,
    directRequirements: baselineAfter.summary.directRequirements,
    channelRequirements: baselineAfter.summary.channelRequirements,
    referenceRequirements: baselineAfter.summary.referenceRequirements,
    nativeDeferredRequirements: baselineAfter.summary.nativeDeferredRequirements,
  },
  mutationMatrix: mutations,
  sources,
  claimLimits: [
    ...baselineAfter.claimLimits,
    'The mutation matrix qualifies only the final cross-owner evidence boundary; it does not replace owner-local semantic mutation or native qualification.',
  ],
};
await writeFile(gateEvidencePath, `${JSON.stringify(gateEvidence, null, 2)}\n`);
console.log(`capsule=${gateEvidence.capsule} status=pass mutations=${mutations.length}/${mutations.length} reference_requirements=${gateEvidence.summary.referenceRequirements} native_deferred=${gateEvidence.summary.nativeDeferredRequirements}`);
console.log(`baseline_integration_evidence_sha256=${baselineAfter.evidenceIdentity.sha256} integration_gate_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);

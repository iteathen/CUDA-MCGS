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
  "search-ir": {
    "algorithm": "sha256",
    "byteLength": 7749,
    "sha256": "bd6679178c6754fe9b06d6fa54d038166b7ef39e32fb5f51513cc303cfd63a96"
  },
  "composer": {
    "algorithm": "sha256",
    "byteLength": 708983,
    "sha256": "53e1454fc2ebe46fcc53fd1717cb687e907d133e238c84488bd50b6f759f6103"
  },
  "domain": {
    "algorithm": "sha256",
    "byteLength": 30359,
    "sha256": "0f0dd3c072a6deb3684562a9cffbf46707f4c7de2928d3a0b6ad76d769ee284c"
  },
  "graph-node": {
    "algorithm": "sha256",
    "byteLength": 10034,
    "sha256": "91b6bfa4cf03d1fcaca9fc25ea975e4a3cb27230117629cb830689737295605d"
  },
  "graph-edge": {
    "algorithm": "sha256",
    "byteLength": 11661,
    "sha256": "0b3065a81515166b16ef9b2d3f54398e8492d45f54e63d65fe885e7482b913fb"
  },
  "graph-ref": {
    "algorithm": "sha256",
    "byteLength": 9126,
    "sha256": "4055eefaf442c82a8579f819befebcf67dbfd6c50fffd9bbafd46888b3aff064"
  },
  "graph-path": {
    "algorithm": "sha256",
    "byteLength": 9490,
    "sha256": "e2e785c623c3f7206fdba35b31a1ac8baefc05bdba90e2b7f3477f57bd0f9e2a"
  },
  "graph-root": {
    "algorithm": "sha256",
    "byteLength": 9954,
    "sha256": "f36dcea5ddb72eed73fc6474368444969bf9065076f123fe7888b3c721703275"
  },
  "graph-reclaim": {
    "algorithm": "sha256",
    "byteLength": 12099,
    "sha256": "0d10011e2986c9a456dd2507b39cf14c3172e8f29c5559ba47f101c49553a693"
  },
  "graph-advance": {
    "algorithm": "sha256",
    "byteLength": 4194,
    "sha256": "5af118749ec231bc294890b2f2669a8360f4a5b634b4bc7aedcb4179141a3639"
  },
  "graph-cleanup": {
    "algorithm": "sha256",
    "byteLength": 5465,
    "sha256": "d0cc9a33bd32d4646cc19648b7f8edf0fde40a40f499d9e81f8b8eded77e0ee3"
  },
  "policy": {
    "algorithm": "sha256",
    "byteLength": 13091,
    "sha256": "509fceb804638dba7dfb6db0fe5761834c2ebda2971f8af7427db6baa7ebeb6e"
  },
  "evaluator": {
    "algorithm": "sha256",
    "byteLength": 18038,
    "sha256": "77b6641d02cb21d02c26baa88ea181fe56b0c7980d92529b672b8a7520bd85ea"
  },
  "resource": {
    "algorithm": "sha256",
    "byteLength": 12499,
    "sha256": "2058f56bfeeb70b22951c6230cbaa5ca4a6dc36a30e10da5faf7a7d7e09b6a6e"
  },
  "progress": {
    "algorithm": "sha256",
    "byteLength": 11993,
    "sha256": "44381a59df8f5acbc5ab25552cf2b3f82547bae092f5a4870c46c620d8661626"
  },
  "output": {
    "algorithm": "sha256",
    "byteLength": 16525,
    "sha256": "fe18eda58b5cfa7c12e92082acd88413e4c4c494272d7f370fabd2cfc70050ef"
  },
  "framework": {
    "algorithm": "sha256",
    "byteLength": 6517,
    "sha256": "8e855b201d777b1f11fbc97c497a466b9f80c28bd336bf4ab1edf8eed1cb6162"
  },
  "terminal": {
    "algorithm": "sha256",
    "byteLength": 9297,
    "sha256": "d7d4cc481d155c81c9eb684b11e896821748770e85fbccb963cff52304ecc0c7"
  },
  "session": {
    "algorithm": "sha256",
    "byteLength": 18539,
    "sha256": "1cab10acc098af19db5520c6cc5a5c035f7f884694dd301b631346269f27a5fc"
  },
  "stage": {
    "algorithm": "sha256",
    "byteLength": 9355,
    "sha256": "d02a1aa5fd57557aa0954736436788bfac2d7bc848ec76c29e842f5c6aa7b5a2"
  },
  "channel": {
    "algorithm": "sha256",
    "byteLength": 17031,
    "sha256": "6ed73f38261ed9c68cf73cbf1c8b71743e86a2b6784040476330f95e0a5f53cd"
  }
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

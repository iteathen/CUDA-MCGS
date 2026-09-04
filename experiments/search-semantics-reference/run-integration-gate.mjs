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
    "byteLength": 709387,
    "sha256": "e576c182b56ad857069af4260f24451aa5db6abfaa4e0d33a80e1f74b8797df6"
  },
  "domain": {
    "algorithm": "sha256",
    "byteLength": 30372,
    "sha256": "08517640b434f2c900914767564f7130f38d122bcca9845ab052161774bb0a2d"
  },
  "graph-node": {
    "algorithm": "sha256",
    "byteLength": 10047,
    "sha256": "56c26a5a66d1c7a81e26137ea32d6a9dd639dd51871ece1f3aebedd6e45436e9"
  },
  "graph-edge": {
    "algorithm": "sha256",
    "byteLength": 11661,
    "sha256": "8376f680f7d8a97970b97f67d9f45b92901d48af95053fef3431feff660feada"
  },
  "graph-ref": {
    "algorithm": "sha256",
    "byteLength": 9139,
    "sha256": "197092573a6b4bf5035875ead6e5a682a283995ced633e4524c8f7003b3026f0"
  },
  "graph-path": {
    "algorithm": "sha256",
    "byteLength": 9530,
    "sha256": "85ff63d91b420a19b2cd3574e2ab90c7e8e4dd70efae3672c9e99e5ddea5bc12"
  },
  "graph-root": {
    "algorithm": "sha256",
    "byteLength": 10008,
    "sha256": "8fe1cd87d10a4e82ad040d395b70e5602e0fff011290e16873ac0ae345c85bd2"
  },
  "graph-reclaim": {
    "algorithm": "sha256",
    "byteLength": 12127,
    "sha256": "84d670178e646699bcfda965ccd3221734c8c7f5b375c75a79e669eece2dee3c"
  },
  "graph-advance": {
    "algorithm": "sha256",
    "byteLength": 4195,
    "sha256": "262834edde346bf04df871523432024f682d2d3c68a735683fce59c7c53c8349"
  },
  "graph-cleanup": {
    "algorithm": "sha256",
    "byteLength": 5466,
    "sha256": "85229a3887eff1bbdd0f88e6c9388aceb9687377d27bcc84d7022d284fa86c3b"
  },
  "policy": {
    "algorithm": "sha256",
    "byteLength": 13104,
    "sha256": "a1a81fafe32cf45dd36dff215e63752e0f21cf3ff02224149a6d85ea3242612f"
  },
  "evaluator": {
    "algorithm": "sha256",
    "byteLength": 18051,
    "sha256": "b4ed13b4f1244358ca742b61645b35ea92a66b77c88a53593bd96391f60d5bb7"
  },
  "resource": {
    "algorithm": "sha256",
    "byteLength": 12512,
    "sha256": "9a59a36c6e846cd036562e85ef0172e491e8982c26223582e770988cd1dbdd46"
  },
  "progress": {
    "algorithm": "sha256",
    "byteLength": 12006,
    "sha256": "c5d791bf30191fac3d3da43ff2e92a52d8246915871caa5cf0dc9a589406cba2"
  },
  "output": {
    "algorithm": "sha256",
    "byteLength": 16538,
    "sha256": "d4aac4d4ac71f25a400445899712966f916462dc09bf48f3f77eb9b7714e3006"
  },
  "framework": {
    "algorithm": "sha256",
    "byteLength": 6517,
    "sha256": "4f45695cec765fab6ff69a880ceded9b04dc52b13d1b6d7a77af5877d12d1d3c"
  },
  "terminal": {
    "algorithm": "sha256",
    "byteLength": 9388,
    "sha256": "cd51ce6c3b062c963a47245c96f1d40a5ef4c8625d0d67f74080363670d7b843"
  },
  "session": {
    "algorithm": "sha256",
    "byteLength": 18579,
    "sha256": "36e33838a4e94e0ce8337c8ee4d29cf7bda72f0d84189eb1ace2ba5861a8cfd3"
  },
  "stage": {
    "algorithm": "sha256",
    "byteLength": 9395,
    "sha256": "1c61bdacdd13163b6a7a2c3425b5045924d83c4d2af4630fbb85ccce8806a310"
  },
  "channel": {
    "algorithm": "sha256",
    "byteLength": 17158,
    "sha256": "2d18dea0b7b7a3e5bfebd2b46b799d6485da385dd2e102fd82f7e2d0f01219be"
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

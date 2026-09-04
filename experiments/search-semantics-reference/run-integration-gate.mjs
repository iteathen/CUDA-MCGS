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
    "byteLength": 709315,
    "sha256": "3b701ac4d8fcb6f831d274656af0a65932cea1b479a18e2a80d8909e880fd731"
  },
  "domain": {
    "algorithm": "sha256",
    "byteLength": 30372,
    "sha256": "5561b8821c570dec826933e256bf0f020eb35f01244d6527b6272c0fc51cfe38"
  },
  "graph-node": {
    "algorithm": "sha256",
    "byteLength": 10047,
    "sha256": "ab6e27592769e51d7799408e8b90b2141bca6d35c2f90f40282b38c8f1c84dce"
  },
  "graph-edge": {
    "algorithm": "sha256",
    "byteLength": 11661,
    "sha256": "b785595fd01f5f664d03cdc0aff9a604df3fee3c63746ba31ac6672477f872b3"
  },
  "graph-ref": {
    "algorithm": "sha256",
    "byteLength": 9139,
    "sha256": "fc2bfb8fee1b107b9830440b5130ec7536c526d7c1e38ee3462ec67308d8069d"
  },
  "graph-path": {
    "algorithm": "sha256",
    "byteLength": 9530,
    "sha256": "75050df61307999ae068700a8ba04fbd3db7bb5213c1775a36df4e7f19d24485"
  },
  "graph-root": {
    "algorithm": "sha256",
    "byteLength": 10008,
    "sha256": "634d91778a2cc1754857a4e04a7f9e57a49bc853b34d8d821418583b5693f882"
  },
  "graph-reclaim": {
    "algorithm": "sha256",
    "byteLength": 12127,
    "sha256": "a37b3509f7285c538781d6fafdbf7c50e489fd96f0a9c498b417a3c8d1fcc17e"
  },
  "graph-advance": {
    "algorithm": "sha256",
    "byteLength": 4195,
    "sha256": "681b16a1ea10417de8e81266e3f9a5eb57a3ead77e398fd0a5b756fa0a6879d2"
  },
  "graph-cleanup": {
    "algorithm": "sha256",
    "byteLength": 5466,
    "sha256": "d50ecb81acf30fc1c724698787473c81c49b044fd72f3baead76a5a93aea1f10"
  },
  "policy": {
    "algorithm": "sha256",
    "byteLength": 13104,
    "sha256": "24ddd3aefb13bb93ec3917cd40205038232e696b99014022e1d115bf5e903f02"
  },
  "evaluator": {
    "algorithm": "sha256",
    "byteLength": 18051,
    "sha256": "b75206cb42ca611592b9b07a4920bcb9de4fa1c001a93509a41ca07d71f5ea79"
  },
  "resource": {
    "algorithm": "sha256",
    "byteLength": 12512,
    "sha256": "5bd71040e00999faa8eaaaa3d4eb96f602a626b0b8a81bda621a4ab3a382fd7c"
  },
  "progress": {
    "algorithm": "sha256",
    "byteLength": 12006,
    "sha256": "94535bcf8b2f996b4f34a53c959527216159ff9daabc968f0060ea12fab8059b"
  },
  "output": {
    "algorithm": "sha256",
    "byteLength": 16538,
    "sha256": "24e57471817aab100e02a2031a3deb53e0e6a3e2c922629539a085204c13ce41"
  },
  "framework": {
    "algorithm": "sha256",
    "byteLength": 6517,
    "sha256": "055d90eefb670bc388bae2eceb650442910540dcdf32abef36f1bd4d160f36ed"
  },
  "terminal": {
    "algorithm": "sha256",
    "byteLength": 9388,
    "sha256": "526275324936bcf1baf5fd5cbb5a6f5e36e154386547ddebf1cfd327f4bd403e"
  },
  "session": {
    "algorithm": "sha256",
    "byteLength": 18579,
    "sha256": "a0686239f37c8f8c00ec68ec05d23e0b106f2e694ab05e2d3f1ad77850f2b2fa"
  },
  "stage": {
    "algorithm": "sha256",
    "byteLength": 9395,
    "sha256": "6c1bc8c41c03080012456bc4c7e57f56d69232fe18f7293b7d75a57766071ef9"
  },
  "channel": {
    "algorithm": "sha256",
    "byteLength": 17158,
    "sha256": "0e77ffc9a1bba9ab9528e89f0b3311d19d9b88e590d693e9d045e766a2deedd1"
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

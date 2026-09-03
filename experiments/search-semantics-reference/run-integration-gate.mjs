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
  "search-ir": {"algorithm":"sha256","byteLength":7749,"sha256":"bd6679178c6754fe9b06d6fa54d038166b7ef39e32fb5f51513cc303cfd63a96"},
  "composer": {"algorithm":"sha256","byteLength":709315,"sha256":"d8b6890ae4fc18e39618cd172e59fd0dedad465e48ae80e5442142235be7c4b4"},
  "domain": {"algorithm":"sha256","byteLength":30372,"sha256":"40537f05154eba5b6610dd72041ccf1a85707ee7022ad6507351f1c5cfe21061"},
  "graph-node": {"algorithm":"sha256","byteLength":10047,"sha256":"a72e1f0a71caff8ae2b05447474ccc3575687a254d374312b0fcb0e8ab28f2bb"},
  "graph-edge": {"algorithm":"sha256","byteLength":11661,"sha256":"5d11400d7d74f7655832a50bf4d12529db4987091937cfbfdd6d02f6066e5b24"},
  "graph-ref": {"algorithm":"sha256","byteLength":9139,"sha256":"28081b601a0c9b4f62802a2eeb162a7ace9823ecafc611eba9c206cdfc96374b"},
  "graph-path": {"algorithm":"sha256","byteLength":9530,"sha256":"1cacbae76b7e95324acc1bb54e2ad3fde58c54c380751658cdc3b9a4f29f3fba"},
  "graph-root": {"algorithm":"sha256","byteLength":10008,"sha256":"2bf43fb4bd1024d0d16c12668e8bf04eaa3340b8b0825900c15905d4896c8bda"},
  "graph-reclaim": {"algorithm":"sha256","byteLength":12127,"sha256":"079cb0057a7806183e0e9420bd96e1e0583d3c2579ae2a8d739a5737f1869751"},
  "graph-advance": {"algorithm":"sha256","byteLength":4195,"sha256":"af06ec183144c74d4bc4f15c2044620c80f1a6a5782af5fca64f6d6bbfddc6d8"},
  "graph-cleanup": {"algorithm":"sha256","byteLength":5466,"sha256":"ef4bb78b60d76f5c2cde20a801a125a2de34e4b07d65949c1cd0bc0876242a50"},
  "policy": {"algorithm":"sha256","byteLength":13104,"sha256":"11ff7d833969da3fbfa657b7fd7f3af0a79b14e769c3eee38365ed7fcefcf6e9"},
  "evaluator": {"algorithm":"sha256","byteLength":18051,"sha256":"e3d5e5c2a42e9d6603abe65a10a63d5f5720de8eb2c423b577f3e1a0bf17c14a"},
  "resource": {"algorithm":"sha256","byteLength":12512,"sha256":"d1add29a7ffc7588be0725cc333eb07db7a754c44b411acb7fe5eacd6a282eec"},
  "progress": {"algorithm":"sha256","byteLength":12006,"sha256":"7cb129fa9103fb9abc48a71f07480e950c8acfdb4472f5cf2e8a6976a21db18e"},
  "output": {"algorithm":"sha256","byteLength":16538,"sha256":"952471a6556fdb431ab8a3082547c1295cc2d587688653cc8266c14da647a16d"},
  "framework": {"algorithm":"sha256","byteLength":6517,"sha256":"1e0894a74d4bb160b6593ee7b407ad3fec4c2c2a9bd1920a0d82c70c3bdbc715"},
  "terminal": {"algorithm":"sha256","byteLength":9388,"sha256":"ee4d3a86a19979ee6ff7a945ab00c643cbc693f924e6ba7eadbab7be39d0fbfd"},
  "session": {"algorithm":"sha256","byteLength":18579,"sha256":"dc187fb0cfa8ca5897f3e86d0bd55d58eaa39202d256422961b8cbeb9e197d44"},
  "stage": {"algorithm":"sha256","byteLength":9395,"sha256":"65f2a737b2b72fe393c23e17963e362e867c8ccd1e70a85dfac910eb16d9d944"},
  "channel": {"algorithm":"sha256","byteLength":17158,"sha256":"a8e6be6524e57add2094330ebb2c905e5370753450be0ce271b2380837c4fb84"},
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

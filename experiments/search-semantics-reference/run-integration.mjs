import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalClone, canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, fail } from './src/errors.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixturePath = path.join(experimentRoot, 'fixtures', 'integration-cases.json');
const coveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS reference integration requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, code) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') fail(code, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath, 'INTEGRATION_FIXTURE_MISSING');
const coverage = await readJson(coveragePath, 'INTEGRATION_COVERAGE_MISSING');
assert.equal(fixture.schema, 'cuda-mcgs.reference-integration-fixtures/0.1.0');
assert.equal(coverage.schema, 'cuda-mcgs.search-ir.requirement-coverage/0.2.0');
assert.equal(fixture.expectedDirectRequirements, 352);
assert.equal(fixture.expectedChannelRequirements, 41);
assert.equal(fixture.expectedReferenceRequirements, 393);
assert.equal(fixture.expectedNativeDeferredRequirements, 52);

const evidenceById = new Map();
for (const descriptor of fixture.evidenceInputs) {
  assert(typeof descriptor.id === 'string' && descriptor.id.length > 0, 'integration evidence descriptor id is required');
  if (evidenceById.has(descriptor.id)) fail('INTEGRATION_EVIDENCE_DESCRIPTOR_DUPLICATE', `duplicate evidence descriptor ${descriptor.id}`);
  const absolutePath = path.join(repositoryRoot, descriptor.path);
  const evidence = await readJson(absolutePath, 'INTEGRATION_EVIDENCE_MISSING');
  assert.equal(evidence.capsule, descriptor.capsule, `${descriptor.id} capsule drifted`);
  assert.equal(evidence.status, 'pass', `${descriptor.id} evidence must pass`);
  evidenceById.set(descriptor.id, { descriptor, evidence });
}

function evidenceIdentity(id) {
  const { evidence } = evidenceById.get(id) ?? {};
  if (!evidence) fail('INTEGRATION_EVIDENCE_UNKNOWN', `unknown evidence input ${id}`);
  if (id === 'composer') return evidence.representationCompositionEvidenceKey;
  if (id === 'search-ir') return evidence.searchIrIdentity;
  if (evidence.evidenceIdentity) return evidence.evidenceIdentity;
  fail('INTEGRATION_EVIDENCE_IDENTITY', `${id} does not publish a canonical identity`);
}

function assertCompleteSummary(id, evidence) {
  const summary = evidence.summary;
  if (!summary || typeof summary !== 'object') fail('INTEGRATION_EVIDENCE_SUMMARY', `${id} must publish a summary`);
  for (const field of ['failed', 'requiredSkipped', 'conditionalSkipped', 'optionalSkipped', 'notDiscovered']) {
    if (summary[field] !== undefined) assert.equal(summary[field], 0, `${id} summary ${field} must be zero`);
  }
  if (summary.expected !== undefined) {
    assert.equal(summary.discovered, summary.expected, `${id} discovery must be exact`);
    assert.equal(summary.executed, summary.discovered, `${id} must execute every discovered case`);
    assert.equal(summary.passed, summary.executed, `${id} must pass every executed case`);
    if (summary.notExecutedBySelection !== undefined) assert.equal(summary.notExecutedBySelection, 0, `${id} full evidence cannot retain unexecuted cases`);
  }
  if (summary.directRequirements !== undefined && summary.directRequirementsMapped !== undefined) {
    assert.equal(summary.directRequirementsMapped, summary.directRequirements, `${id} direct requirements must all be mapped`);
  }
  if (summary.ownerCases !== undefined && summary.ownerCasesPassed !== undefined) {
    assert.equal(summary.ownerCasesPassed, summary.ownerCases, `${id} owner cases must all pass`);
  }
}

function caseById(evidenceId, caseId) {
  const evidence = evidenceById.get(evidenceId)?.evidence;
  if (!evidence) fail('INTEGRATION_WITNESS_EVIDENCE', `witness references unknown evidence ${evidenceId}`);
  const candidate = evidence.cases?.find(({ id }) => id === caseId);
  if (!candidate) fail('INTEGRATION_WITNESS_CASE', `${evidenceId} does not contain required case ${caseId}`);
  assert.equal(candidate.status, 'pass', `${evidenceId}:${caseId} must pass`);
  return candidate;
}

function coverageRequirements(evidence) {
  const ids = [];
  for (const [key, value] of Object.entries(evidence)) {
    if (!key.endsWith('RequirementCoverage') || value === null || typeof value !== 'object') continue;
    const records = value.planned?.requirements ?? value.requirements ?? [];
    for (const record of records) {
      if (typeof record.id !== 'string') fail('INTEGRATION_REQUIREMENT_RECORD', `${key} contains a requirement without an id`);
      ids.push(record.id);
    }
  }
  if (Array.isArray(evidence.directRequirements)) ids.push(...evidence.directRequirements);
  return ids;
}

function classificationFor(requirementId) {
  const candidates = coverage.classifications.filter(({ requirementPrefix }) => requirementId.startsWith(requirementPrefix));
  candidates.sort((left, right) => right.requirementPrefix.length - left.requirementPrefix.length);
  if (candidates.length === 0) fail('INTEGRATION_REQUIREMENT_ROUTE', `no coverage classification for ${requirementId}`);
  return candidates[0];
}

const definitions = [];
function defineCase(id, body) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate integration case ${id}`);
  definitions.push({ id, body });
}

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'INTEGRATION_EXPECTED_CASES', 'integration expectedCases');

let directReferenceIds = [];
let channelReferenceIds = [];
let integrationInputIdentities = null;

defineCase('integration-evidence-inputs-complete', () => {
  assert.equal(evidenceById.size, fixture.evidenceInputs.length);
  for (const [id, { evidence }] of evidenceById) assertCompleteSummary(id, evidence);
  return { inputs: [...evidenceById.keys()] };
});

defineCase('integration-composer-identity-consistent', () => {
  const composerIdentity = evidenceIdentity('composer');
  assert.deepEqual(composerIdentity, fixture.composerEvidence);
  for (const [id, { evidence }] of evidenceById) {
    if (id === 'composer' || id === 'search-ir') continue;
    if (evidence.composerEvidence !== undefined) assert.deepEqual(evidence.composerEvidence, composerIdentity, `${id} Composer evidence identity drifted`);
  }
  return { composerEvidence: composerIdentity };
});

defineCase('integration-reference-route-closure', () => {
  const ownerRequirementIds = new Set();
  for (const [id, { evidence }] of evidenceById) {
    if (id === 'composer' || id === 'search-ir' || id === 'terminal' || id === 'graph-advance') continue;
    for (const requirementId of coverageRequirements(evidence)) {
      const route = classificationFor(requirementId);
      const isDirect = route.primaryDisposition === 'engine-reference-oracle' && route.evidenceOwner === 'ENGINE-REFERENCE-01' && route.contract !== 'SPEC-0004';
      if (isDirect) ownerRequirementIds.add(requirementId);
    }
  }
  directReferenceIds = [...ownerRequirementIds].sort();
  channelReferenceIds = coverageRequirements(evidenceById.get('channel').evidence)
    .filter((id) => classificationFor(id).contract === 'SPEC-0004' && classificationFor(id).primaryDisposition === 'engine-reference-oracle')
    .sort();
  assert.equal(new Set(channelReferenceIds).size, channelReferenceIds.length, 'Channel reference requirements must be unique');
  assert.equal(directReferenceIds.length, fixture.expectedDirectRequirements, 'direct ENGINE-REFERENCE route count drifted');
  assert.equal(channelReferenceIds.length, fixture.expectedChannelRequirements, 'Channel reference route count drifted');
  assert.equal(new Set([...directReferenceIds, ...channelReferenceIds]).size, fixture.expectedReferenceRequirements, 'total reference requirement closure drifted');

  const expectedDirectByClassification = coverage.classifications.filter((entry) => entry.primaryDisposition === 'engine-reference-oracle' && entry.evidenceOwner === 'ENGINE-REFERENCE-01' && entry.contract !== 'SPEC-0004');
  for (const route of expectedDirectByClassification) {
    const actual = directReferenceIds.filter((id) => id.startsWith(route.requirementPrefix)).length;
    assert.equal(actual, route.requirementCount, `${route.contract}:${route.requirementPrefix} direct route closure drifted`);
  }
  const expectedChannelByClassification = coverage.classifications.filter((entry) => entry.primaryDisposition === 'engine-reference-oracle' && entry.contract === 'SPEC-0004');
  for (const route of expectedChannelByClassification) {
    const actual = channelReferenceIds.filter((id) => id.startsWith(route.requirementPrefix)).length;
    assert.equal(actual, route.requirementCount, `${route.contract}:${route.requirementPrefix} Channel route closure drifted`);
  }
  return { direct: directReferenceIds.length, channel: channelReferenceIds.length, total: directReferenceIds.length + channelReferenceIds.length };
});

defineCase('integration-channel-owner-evidence-reused', () => {
  const channel = evidenceById.get('channel').evidence;
  assert.equal(channel.scope, 'owner-local-channel-evidence-reuse');
  assert.equal(channel.summary.directRequirements, fixture.expectedChannelRequirements);
  assert.equal(channel.summary.directRequirementsMapped, fixture.expectedChannelRequirements);
  assert(channel.claimLimits.some((line) => line.includes('does not define or import a second Channel state machine')));
  const composer = evidenceById.get('composer').evidence;
  for (const field of fixture.channelRequiredComposerFields) assert.notEqual(composer[field], undefined, `Composer evidence is missing Channel integration field ${field}`);
  return { channelEvidence: channel.evidenceIdentity, ownerCases: channel.summary.ownerCases };
});

defineCase('integration-product-neutral-families-witnessed', () => {
  for (const witness of fixture.witnesses.productNeutral) caseById(witness.evidence, witness.case);
  return { witnesses: fixture.witnesses.productNeutral.length };
});

defineCase('integration-optional-deletion-witnessed', () => {
  for (const witness of fixture.witnesses.deletion) caseById(witness.evidence, witness.case);
  const composer = evidenceById.get('composer').evidence;
  for (const field of fixture.channelRequiredComposerFields) assert(composer[field], `Channel deletion field ${field} must be present`);
  return { witnesses: fixture.witnesses.deletion.length, channelDeletionBound: true };
});

defineCase('integration-schedule-concurrency-witnessed', () => {
  for (const witness of fixture.witnesses.schedules) caseById(witness.evidence, witness.case);
  return { witnesses: fixture.witnesses.schedules.length };
});

function aggregateTerminalReplicas(replicas) {
  if (!replicas.every(({ terminal }) => terminal === true)) fail('INTEGRATION_REPLICA_NOT_TERMINAL', 'all semantic replicas must be terminal before downstream aggregation');
  return { count: replicas.length, semanticIdentities: replicas.map(({ semanticIdentity }) => semanticIdentity) };
}

defineCase('integration-multi-device-independent-replicas', () => {
  const terminal = evidenceById.get('terminal').evidence;
  const terminalCase = caseById('terminal', fixture.multiDevice.terminalCase);
  assert.equal(terminalCase.detail.meaning?.progressClosure ?? terminalCase.detail.progressClosure, 'terminal');
  const semanticPacket = {
    composerEvidence: evidenceIdentity('composer'),
    terminalEvidence: terminal.evidenceIdentity,
    terminalMeaning: terminalCase.detail.meaning ?? terminalCase.detail,
  };
  const semanticIdentity = canonicalIdentity(semanticPacket, 'one-device semantic replica');
  const replicas = fixture.multiDevice.deviceSlots.map((deviceSlot) => ({ deviceSlot, semanticIdentity, terminal: true }));
  assert.equal(new Set(replicas.map(({ deviceSlot }) => deviceSlot)).size, replicas.length);
  assert(replicas.every((replica) => replica.semanticIdentity.sha256 === semanticIdentity.sha256), 'opaque device slot must not alter one-device semantic meaning');
  const aggregation = aggregateTerminalReplicas(replicas);
  const active = canonicalClone(replicas);
  active[0].terminal = false;
  assert.throws(() => aggregateTerminalReplicas(active), { code: 'INTEGRATION_REPLICA_NOT_TERMINAL' });
  return { replicaCount: replicas.length, semanticIdentity, aggregation };
});

defineCase('integration-native-deferred-remains-deferred', () => {
  const nativeRoutes = coverage.classifications.filter(({ primaryDisposition }) => primaryDisposition === 'native-compatible-pair-qualification');
  const nativeCount = nativeRoutes.reduce((sum, route) => sum + route.requirementCount, 0);
  assert.equal(nativeCount, fixture.expectedNativeDeferredRequirements, 'native-deferred requirement accounting drifted');
  for (const route of nativeRoutes) assert.equal(route.evidenceStatus, 'deferred-native', `${route.contract}:${route.requirementPrefix} native route must remain deferred`);
  const referenceSet = new Set([...directReferenceIds, ...channelReferenceIds]);
  for (const id of referenceSet) assert.notEqual(classificationFor(id).primaryDisposition, 'native-compatible-pair-qualification');
  return { nativeDeferred: nativeCount };
});

defineCase('integration-product-vocabulary-not-owned', () => {
  integrationInputIdentities = Object.fromEntries([...evidenceById].map(([id]) => [id, evidenceIdentity(id)]));
  const subject = JSON.stringify({ inputs: integrationInputIdentities, requirements: [...directReferenceIds, ...channelReferenceIds] }).toLowerCase();
  for (const token of fixture.forbiddenProductTokens) assert.equal(subject.includes(token), false, `final universal packet must not contain product token ${token}`);
  return { forbiddenTokensChecked: fixture.forbiddenProductTokens.length };
});

defineCase('integration-evidence-identity-content-sensitive', () => {
  if (integrationInputIdentities === null) integrationInputIdentities = Object.fromEntries([...evidenceById].map(([id]) => [id, evidenceIdentity(id)]));
  const baseline = canonicalIdentity({ inputs: integrationInputIdentities, directReferenceIds, channelReferenceIds }, 'integration identity sensitivity baseline');
  const mutatedInputs = canonicalClone(integrationInputIdentities);
  mutatedInputs.stage.sha256 = '0'.repeat(64);
  const mutated = canonicalIdentity({ inputs: mutatedInputs, directReferenceIds, channelReferenceIds }, 'integration identity sensitivity mutation');
  assert.notDeepEqual(mutated, baseline);
  return { baseline, mutated };
});

assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered integration cases must exactly match checked-in expected case bank');

const cases = [];
for (const definition of definitions) {
  try {
    const detail = await definition.body();
    cases.push({ id: definition.id, status: 'pass', detail: detail ?? null });
    console.log(`case=${definition.id} result=pass`);
  } catch (error) {
    cases.push({ id: definition.id, status: 'fail', detail: null, error: { name: error.name, code: error.code ?? null, message: error.message } });
    console.error(`case=${definition.id} result=fail error=${JSON.stringify(error.message)}`);
  }
}

const failed = cases.filter(({ status }) => status === 'fail');
const summary = {
  expected: expectedCaseIds.length,
  discovered: definitions.length,
  executed: cases.length,
  passed: cases.length - failed.length,
  failed: failed.length,
  directRequirements: directReferenceIds.length,
  channelRequirements: channelReferenceIds.length,
  referenceRequirements: new Set([...directReferenceIds, ...channelReferenceIds]).size,
  nativeDeferredRequirements: fixture.expectedNativeDeferredRequirements,
  requiredSkipped: 0,
  conditionalSkipped: 0,
  optionalSkipped: 0,
  notDiscovered: expectedCaseIds.length - definitions.length,
};

const sourcePaths = [
  'docs/development/2026-08-25-engine-reference-01-assessment-and-plan.md',
  'docs/development/2026-09-02-ref-integrate-01-assessment-and-plan.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
  'experiments/search-semantics-reference/fixtures/integration-cases.json',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/run-integration.mjs',
  'scripts/run-engine-reference-integration.mjs',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));

if (integrationInputIdentities === null) integrationInputIdentities = Object.fromEntries([...evidenceById].map(([id]) => [id, evidenceIdentity(id)]));
const evidenceSubject = {
  schema: 'cuda-mcgs.engine-reference-integration-evidence-key/0.1.0',
  composerEvidence: evidenceIdentity('composer'),
  acceptedSearchIrIdentity: evidenceIdentity('search-ir'),
  inputEvidence: integrationInputIdentities,
  directReferenceRequirements: directReferenceIds,
  channelReferenceRequirements: channelReferenceIds,
  nativeDeferredRequirementCount: fixture.expectedNativeDeferredRequirements,
  sources,
  summary,
  cases,
};
const finalEvidenceIdentity = canonicalIdentity(evidenceSubject, 'engine reference integration evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-engine-reference-integration-v0.1.0',
  scope: 'full-cuda-free-reference-integration',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: evidenceIdentity('composer'),
  acceptedSearchIrIdentity: evidenceIdentity('search-ir'),
  inputEvidence: integrationInputIdentities,
  evidenceIdentity: finalEvidenceIdentity,
  directReferenceRequirements: directReferenceIds,
  channelReferenceRequirements: channelReferenceIds,
  sources,
  summary,
  cases,
  claimLimits: [
    'This packet reconciles CUDA-free product-neutral reference evidence only; every semantic owner remains authoritative for its own state and lifecycle.',
    'The integration verifier consumes owner evidence and does not implement a second Domain, Graph, Policy, Evaluator, Resource, Progress, Output, Session, Stage, Channel or Framework interpreter.',
    'Finite opaque device-slot replicas demonstrate only device-count-neutral semantic packaging; no multi-GPU support, cross-device coordination, aggregation rule or performance claim is made.',
    'All native-compatible-pair requirements remain deferred to CUDA-JS/native exact-pair and physical-device qualification.',
    'This candidate packet is not protected #122 semantic acceptance, production readiness, release readiness or a public SDK compatibility promise.',
  ],
};
const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
await writeFile(path.join(evidenceDirectory, 'integration-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`capsule=${evidence.capsule} status=${evidence.status} expected=${summary.expected} discovered=${summary.discovered} passed=${summary.passed} failed=${summary.failed} direct_requirements=${summary.directRequirements} channel_requirements=${summary.channelRequirements} reference_requirements=${summary.referenceRequirements} native_deferred=${summary.nativeDeferredRequirements}`);
console.log(`composer_evidence_sha256=${evidence.composerEvidence.sha256} integration_evidence_sha256=${finalEvidenceIdentity.sha256} canonical_bytes=${finalEvidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);
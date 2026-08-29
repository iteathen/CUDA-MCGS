import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import { registerPolicyCases } from './src/policy-cases.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixturePath = path.join(experimentRoot, 'fixtures', 'policy-cases.json');
const composerEvidencePath = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference', 'build', 'evidence.json');
const policyProjectionPath = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference', 'build', 'policy-profiles.json');
const requirementCoveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');
const policySpecPath = path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0008-search-policy-and-backup.md');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Policy reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath);
const composerEvidence = await readJson(composerEvidencePath, 'POLICY_REFERENCE_COMPOSER_EVIDENCE_MISSING');
const policyProjection = await readJson(policyProjectionPath, 'POLICY_REFERENCE_PROJECTION_MISSING');
const requirementCoverage = await readJson(requirementCoveragePath);
const policySpec = await readFile(policySpecPath, 'utf8');

exactKeys(fixture, ['composerEvidence', 'expectedCases', 'profileProjection', 'schema'], 'POLICY_REFERENCE_FIXTURE_FIELDS', 'Policy fixture');
assert.equal(fixture.schema, 'cuda-mcgs.reference-policy-fixtures/0.1.0');
exactKeys(fixture.composerEvidence, ['algorithm', 'byteLength', 'sha256'], 'POLICY_REFERENCE_FIXTURE_EVIDENCE', 'Policy Composer evidence');
exactKeys(fixture.profileProjection, ['algorithm', 'byteLength', 'schema', 'sha256'], 'POLICY_REFERENCE_FIXTURE_PROJECTION', 'Policy profile projection');
assert.deepEqual(composerEvidence.representationCompositionEvidenceKey, fixture.composerEvidence);
assert.equal(policyProjection.schema, fixture.profileProjection.schema);
assert.deepEqual(policyProjection.projectionIdentity, {
  algorithm: fixture.profileProjection.algorithm,
  byteLength: fixture.profileProjection.byteLength,
  sha256: fixture.profileProjection.sha256,
});
assert.equal(policyProjection.profiles.length, 4);

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'POLICY_REFERENCE_EXPECTED_CASES', 'Policy expectedCases');
if (expectedCaseIds.length === 0 || expectedCaseIds.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(id))) fail('POLICY_REFERENCE_EXPECTED_CASES', 'expectedCases contains an invalid case id');

const ownedPrefixes = new Map([
  ['POLICY-RECORD-', 8],
  ['POLICY-RESERVE-', 6],
  ['POLICY-CYCLE-', 4],
  ['POLICY-BACKUP-', 11],
  ['POLICY-STOP-', 7],
  ['POLICY-REUSE-', 5],
  ['POLICY-CLEANUP-', 2],
]);
for (const [requirementPrefix, requirementCount] of ownedPrefixes) {
  const classification = requirementCoverage.classifications.find((entry) =>
    entry.contract === 'SPEC-0008'
    && entry.requirementPrefix === requirementPrefix
    && entry.primaryDisposition === 'engine-reference-oracle'
    && entry.plannedEvidenceOwner === 'ENGINE-REFERENCE-01');
  assert(classification, `${requirementPrefix} requirement classification is missing`);
  assert.equal(classification.requirementCount, requirementCount);
}
const ownedPattern = /^(POLICY-(?:RECORD|RESERVE|CYCLE|BACKUP|STOP|REUSE|CLEANUP)-\d{3})\./gm;
const policyRequirementIds = assertUniqueStrings(
  [...policySpec.matchAll(ownedPattern)].map((match) => match[1]),
  'POLICY_REFERENCE_REQUIREMENT_SOURCE',
  'direct Policy reference requirements',
);
assert.equal(policyRequirementIds.length, [...ownedPrefixes.values()].reduce((sum, count) => sum + count, 0));
for (const [prefix, count] of ownedPrefixes) assert.equal(policyRequirementIds.filter((id) => id.startsWith(prefix)).length, count);

const definitions = [];
function defineCase(id, body, requirements = []) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  const uniqueRequirements = assertUniqueStrings(requirements, 'POLICY_REFERENCE_CASE_REQUIREMENTS', `${id} requirements`);
  definitions.push({ id, body, requirements: uniqueRequirements });
}

function plannedPolicyCoverage() {
  const direct = new Set(policyRequirementIds);
  const casesByRequirement = Object.fromEntries(policyRequirementIds.map((id) => [id, []]));
  for (const definition of definitions) {
    for (const requirement of definition.requirements) {
      if (!direct.has(requirement)) fail('POLICY_REFERENCE_REQUIREMENT_SCOPE', `${definition.id} maps non-owned requirement ${requirement}`);
      casesByRequirement[requirement].push(definition.id);
    }
  }
  const uncovered = policyRequirementIds.filter((id) => casesByRequirement[id].length === 0);
  if (uncovered.length !== 0) fail('POLICY_REFERENCE_REQUIREMENT_COVERAGE', `direct Policy requirements lack cases: ${uncovered.join(', ')}`);
  return {
    requirementCount: policyRequirementIds.length,
    requirements: policyRequirementIds.map((id) => ({ id, cases: casesByRequirement[id] })),
  };
}

registerPolicyCases({ defineCase, fixture, projection: policyProjection, composerEvidence, plannedCoverage: plannedPolicyCoverage });
assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered Policy cases must exactly match checked-in expected case bank');

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('POLICY_REFERENCE_CLI', 'usage: run-policy.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('POLICY_REFERENCE_CLI', `unknown case ${selectedCase}`);
}

const cases = [];
for (const definition of definitions) {
  if (selectedCase !== null && definition.id !== selectedCase) continue;
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
const plannedCoverage = plannedPolicyCoverage();
const executedCaseIds = new Set(cases.map(({ id }) => id));
const executedRequirements = plannedCoverage.requirements
  .map(({ id, cases: mappedCases }) => ({ id, cases: mappedCases.filter((caseId) => executedCaseIds.has(caseId)) }))
  .filter(({ cases: mappedCases }) => mappedCases.length !== 0);
const summary = {
  expected: expectedCaseIds.length,
  discovered: definitions.length,
  executed: cases.length,
  passed: cases.length - failed.length,
  failed: failed.length,
  requiredSkipped: 0,
  conditionalSkipped: 0,
  optionalSkipped: 0,
  notDiscovered: expectedCaseIds.length - definitions.length,
  notExecutedBySelection: expectedCaseIds.length - cases.length,
};
if (selectedCase === null) assert.equal(cases.length, expectedCaseIds.length);

const sourcePaths = [
  'experiments/search-ir-composer-reference/export-policy-profiles.mjs',
  'experiments/search-semantics-reference/fixtures/policy-cases.json',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/policy.mjs',
  'experiments/search-semantics-reference/src/policy-cases.mjs',
  'experiments/search-semantics-reference/run-policy.mjs',
  'scripts/export-search-ir-composer-policy-profiles.mjs',
  'scripts/run-policy-reference.mjs',
  'docs/specs/SPEC-0008-search-policy-and-backup.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));
const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-policy-evidence-key/0.2.0',
  composerEvidence: fixture.composerEvidence,
  policyProfileProjection: policyProjection.projectionIdentity,
  policyRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  selection: selectedCase,
  sources,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'Policy reference evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-policy-reference-v0.2.0',
  scope: selectedCase === null ? 'full-policy-reference' : 'focused-case',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: fixture.composerEvidence,
  policyProfileProjection: policyProjection.projectionIdentity,
  policyRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  evidenceIdentity,
  sources,
  summary,
  cases,
  claimLimits: [
    'Policy-owned record/accounting, reservation, path-relation response, backup, stop, reuse and cleanup semantics for the 43 direct ENGINE-REFERENCE requirements in SPEC-0008 only.',
    'Domain roles/relations, Graph ready/reference/storage facts and evaluator profile identities are consumed through normalized public profile facts; their implementations and private state are not imported.',
    'Resource admission/watermarks/pressure composition, Progress scheduling/fairness, Output payload/ranking/publication, Session current-root/control authority and Graph storage/reclamation mechanisms remain with their own owners.',
    'No UCT/PUCT/formula selection, production policy lowering, native atomics/memory-order qualification, CUDA-JS execution, performance, search quality, public SDK or protected-main claim.',
  ],
};

const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'policy-evidence.json' : `policy-evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} not_discovered=${summary.notDiscovered} not_executed_by_selection=${summary.notExecutedBySelection}`);
console.log(`composer_evidence_sha256=${fixture.composerEvidence.sha256} policy_projection_sha256=${policyProjection.projectionIdentity.sha256} policy_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

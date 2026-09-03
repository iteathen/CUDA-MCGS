import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import { DIRECT_PROGRESS_REQUIREMENTS, registerProgressCases } from './src/progress-cases.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixturePath = path.join(experimentRoot, 'fixtures', 'progress-cases.json');
const composerEvidencePath = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference', 'build', 'evidence.json');
const progressProjectionPath = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference', 'build', 'progress-profiles.json');
const requirementCoveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');
const progressSpecPath = path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0012-device-owned-search-progress.md');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Progress reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath);
const composerEvidence = await readJson(composerEvidencePath, 'PROGRESS_REFERENCE_COMPOSER_EVIDENCE_MISSING');
const progressProjection = await readJson(progressProjectionPath, 'PROGRESS_REFERENCE_PROJECTION_MISSING');
const requirementCoverage = await readJson(requirementCoveragePath);
const progressSpec = await readFile(progressSpecPath, 'utf8');

exactKeys(fixture, ['composerEvidence', 'expectedCases', 'profileProjection', 'schema'], 'PROGRESS_REFERENCE_FIXTURE_FIELDS', 'Progress fixture');
assert.equal(fixture.schema, 'cuda-mcgs.reference-progress-fixtures/0.1.0');
exactKeys(fixture.composerEvidence, ['algorithm', 'byteLength', 'sha256'], 'PROGRESS_REFERENCE_FIXTURE_EVIDENCE', 'Progress Composer evidence');
exactKeys(fixture.profileProjection, ['profileIds', 'schema'], 'PROGRESS_REFERENCE_FIXTURE_PROJECTION', 'Progress profile projection');
assert.deepEqual(composerEvidence.representationCompositionEvidenceKey, fixture.composerEvidence);
assert.equal(progressProjection.schema, fixture.profileProjection.schema);
assert.deepEqual(progressProjection.producer.representationCompositionEvidenceKey, fixture.composerEvidence);
assert.deepEqual(progressProjection.profiles.map(({ id }) => id), fixture.profileProjection.profileIds);
for (const entry of progressProjection.profiles) {
  assert.equal(entry.normalized.id, entry.id);
  assert.equal(entry.identity.algorithm, 'sha256');
  assert.match(entry.identity.sha256, /^[0-9a-f]{64}$/);
}

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'PROGRESS_REFERENCE_EXPECTED_CASES', 'Progress expectedCases');
if (expectedCaseIds.length === 0 || expectedCaseIds.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(id))) fail('PROGRESS_REFERENCE_EXPECTED_CASES', 'expectedCases contains an invalid case id');

const ownedPrefixes = new Map([
  ['PROGRESS-WORK-', 7],
  ['PROGRESS-FAIR-', 6],
  ['PROGRESS-NOPROGRESS-', 7],
  ['PROGRESS-STOP-', 7],
  ['PROGRESS-LIFE-', 4],
]);
for (const [requirementPrefix, requirementCount] of ownedPrefixes) {
  const classification = requirementCoverage.classifications.find((entry) =>
    entry.contract === 'SPEC-0012'
    && entry.requirementPrefix === requirementPrefix
    && entry.primaryDisposition === 'engine-reference-oracle'
    && entry.evidenceOwner === 'ENGINE-REFERENCE-01');
  assert(classification, `${requirementPrefix} requirement classification is missing`);
  assert.equal(classification.requirementCount, requirementCount);
}
const ownedPattern = /^(PROGRESS-(?:WORK|FAIR|NOPROGRESS|STOP|LIFE)-\d{3})\./gm;
const progressRequirementIds = assertUniqueStrings(
  [...progressSpec.matchAll(ownedPattern)].map((match) => match[1]),
  'PROGRESS_REFERENCE_REQUIREMENT_SOURCE',
  'direct Progress reference requirements',
);
assert.equal(progressRequirementIds.length, 31);
for (const [prefix, count] of ownedPrefixes) assert.equal(progressRequirementIds.filter((id) => id.startsWith(prefix)).length, count);
assert.deepEqual(progressRequirementIds, DIRECT_PROGRESS_REQUIREMENTS, 'case-bank direct requirement registry must match authoritative SPEC-0012 order');

const definitions = [];
function defineCase(id, body, requirements = []) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  const uniqueRequirements = assertUniqueStrings(requirements, 'PROGRESS_REFERENCE_CASE_REQUIREMENTS', `${id} requirements`);
  definitions.push({ id, body, requirements: uniqueRequirements });
}

function plannedProgressCoverage() {
  const direct = new Set(progressRequirementIds);
  const casesByRequirement = Object.fromEntries(progressRequirementIds.map((id) => [id, []]));
  for (const definition of definitions) {
    for (const requirement of definition.requirements) {
      if (!direct.has(requirement)) fail('PROGRESS_REFERENCE_REQUIREMENT_SCOPE', `${definition.id} maps non-owned requirement ${requirement}`);
      casesByRequirement[requirement].push(definition.id);
    }
  }
  const uncovered = progressRequirementIds.filter((id) => casesByRequirement[id].length === 0);
  if (uncovered.length !== 0) fail('PROGRESS_REFERENCE_REQUIREMENT_COVERAGE', `direct Progress requirements lack cases: ${uncovered.join(', ')}`);
  return {
    requirementCount: progressRequirementIds.length,
    requirements: progressRequirementIds.map((id) => ({ id, cases: casesByRequirement[id] })),
  };
}

registerProgressCases({ defineCase, fixture, projection: progressProjection, composerEvidence, plannedCoverage: plannedProgressCoverage });
assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered Progress cases must exactly match checked-in expected case bank');

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('PROGRESS_REFERENCE_CLI', 'usage: run-progress.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('PROGRESS_REFERENCE_CLI', `unknown case ${selectedCase}`);
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
const plannedCoverage = plannedProgressCoverage();
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
  'experiments/search-ir-composer-reference/export-progress-profiles.mjs',
  'experiments/search-semantics-reference/fixtures/progress-cases.json',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/progress.mjs',
  'experiments/search-semantics-reference/src/progress-case-support.mjs',
  'experiments/search-semantics-reference/src/progress-schedule.mjs',
  'experiments/search-semantics-reference/src/progress-work-readiness-cases.mjs',
  'experiments/search-semantics-reference/src/progress-fairness-cases.mjs',
  'experiments/search-semantics-reference/src/progress-no-progress-cases.mjs',
  'experiments/search-semantics-reference/src/progress-stop-lifecycle-cases.mjs',
  'experiments/search-semantics-reference/src/progress-sensitivity-cases.mjs',
  'experiments/search-semantics-reference/src/progress-cases.mjs',
  'experiments/search-semantics-reference/run-progress.mjs',
  'scripts/export-search-ir-composer-progress-profiles.mjs',
  'scripts/run-progress-reference.mjs',
  'docs/specs/SPEC-0012-device-owned-search-progress.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json'
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));
const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-progress-evidence-key/0.2.0',
  composerEvidence: fixture.composerEvidence,
  progressProfileProjection: progressProjection.projectionIdentity,
  progressRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  selection: selectedCase,
  sources,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'Progress reference evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-progress-reference-v0.2.0',
  scope: selectedCase === null ? 'full-progress-reference' : 'focused-case',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: fixture.composerEvidence,
  progressProfileProjection: progressProjection.projectionIdentity,
  progressRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  evidenceIdentity,
  sources,
  summary,
  cases,
  claimLimits: [
    'Progress-owned CUDA-free work/readiness/accounting, fairness/service opportunity, typed no-progress, stop/drain/closure and lifecycle semantics for the 31 direct ENGINE-REFERENCE requirements in SPEC-0012 only.',
    'Payload meaning, policy choice, Graph reclamation, Evaluator batching meaning, Resource capacity/allocation, Output payload semantics, Session command meaning and CUDA/native mechanisms remain separately owned.',
    'The serial and interleaved schedule drivers prove only stable semantic invariants under two bounded mechanism-neutral trajectories; they select no production scheduler or worker topology.',
    'Physical CUDA scheduling, memory ordering/atomics, CUDA-JS realization, performance, product behavior and protected-main/atomic #122 acceptance remain downstream.'
  ],
};

const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'progress-evidence.json' : `progress-evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} not_discovered=${summary.notDiscovered} not_executed_by_selection=${summary.notExecutedBySelection}`);
console.log(`composer_evidence_sha256=${fixture.composerEvidence.sha256} progress_projection_sha256=${progressProjection.projectionIdentity.sha256} progress_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

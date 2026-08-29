import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import { DIRECT_EVALUATOR_REQUIREMENTS, registerEvaluatorCases } from './src/evaluator-cases.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixturePath = path.join(experimentRoot, 'fixtures', 'evaluator-cases.json');
const composerEvidencePath = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference', 'build', 'evidence.json');
const evaluatorProjectionPath = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference', 'build', 'evaluator-profiles.json');
const requirementCoveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');
const evaluatorSpecPath = path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0009-evaluator-contract.md');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Evaluator reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath);
const composerEvidence = await readJson(composerEvidencePath, 'EVALUATOR_REFERENCE_COMPOSER_EVIDENCE_MISSING');
const evaluatorProjection = await readJson(evaluatorProjectionPath, 'EVALUATOR_REFERENCE_PROJECTION_MISSING');
const requirementCoverage = await readJson(requirementCoveragePath);
const evaluatorSpec = await readFile(evaluatorSpecPath, 'utf8');

exactKeys(fixture, ['composerEvidence', 'expectedCases', 'profileProjection', 'schema'], 'EVALUATOR_REFERENCE_FIXTURE_FIELDS', 'Evaluator fixture');
assert.equal(fixture.schema, 'cuda-mcgs.reference-evaluator-fixtures/0.1.0');
exactKeys(fixture.composerEvidence, ['algorithm', 'byteLength', 'sha256'], 'EVALUATOR_REFERENCE_FIXTURE_EVIDENCE', 'Evaluator Composer evidence');
exactKeys(fixture.profileProjection, ['algorithm', 'byteLength', 'schema', 'sha256'], 'EVALUATOR_REFERENCE_FIXTURE_PROJECTION', 'Evaluator profile projection');
assert.deepEqual(composerEvidence.representationCompositionEvidenceKey, fixture.composerEvidence);
assert.equal(evaluatorProjection.schema, fixture.profileProjection.schema);
assert.deepEqual(evaluatorProjection.projectionIdentity, {
  algorithm: fixture.profileProjection.algorithm,
  byteLength: fixture.profileProjection.byteLength,
  sha256: fixture.profileProjection.sha256,
});
assert.equal(evaluatorProjection.profiles.length, 5);

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'EVALUATOR_REFERENCE_EXPECTED_CASES', 'Evaluator expectedCases');
if (expectedCaseIds.length === 0 || expectedCaseIds.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(id))) fail('EVALUATOR_REFERENCE_EXPECTED_CASES', 'expectedCases contains an invalid case id');

const ownedPrefixes = new Map([
  ['EVAL-REQUEST-', 10],
  ['EVAL-BATCH-', 10],
  ['EVAL-CACHE-', 8],
  ['EVAL-REUSE-', 6],
  ['EVAL-CLEANUP-', 3],
]);
for (const [requirementPrefix, requirementCount] of ownedPrefixes) {
  const classification = requirementCoverage.classifications.find((entry) =>
    entry.contract === 'SPEC-0009'
    && entry.requirementPrefix === requirementPrefix
    && entry.primaryDisposition === 'engine-reference-oracle'
    && entry.plannedEvidenceOwner === 'ENGINE-REFERENCE-01');
  assert(classification, `${requirementPrefix} requirement classification is missing`);
  assert.equal(classification.requirementCount, requirementCount);
}
const ownedPattern = /^(EVAL-(?:REQUEST|BATCH|CACHE|REUSE|CLEANUP)-\d{3})\./gm;
const evaluatorRequirementIds = assertUniqueStrings(
  [...evaluatorSpec.matchAll(ownedPattern)].map((match) => match[1]),
  'EVALUATOR_REFERENCE_REQUIREMENT_SOURCE',
  'direct Evaluator reference requirements',
);
assert.equal(evaluatorRequirementIds.length, [...ownedPrefixes.values()].reduce((sum, count) => sum + count, 0));
for (const [prefix, count] of ownedPrefixes) assert.equal(evaluatorRequirementIds.filter((id) => id.startsWith(prefix)).length, count);
assert.deepEqual(evaluatorRequirementIds, DIRECT_EVALUATOR_REQUIREMENTS, 'case-bank direct requirement registry must match authoritative SPEC-0009 order');

const definitions = [];
function defineCase(id, body, requirements = []) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  const uniqueRequirements = assertUniqueStrings(requirements, 'EVALUATOR_REFERENCE_CASE_REQUIREMENTS', `${id} requirements`);
  definitions.push({ id, body, requirements: uniqueRequirements });
}

function plannedEvaluatorCoverage() {
  const direct = new Set(evaluatorRequirementIds);
  const casesByRequirement = Object.fromEntries(evaluatorRequirementIds.map((id) => [id, []]));
  for (const definition of definitions) {
    for (const requirement of definition.requirements) {
      if (!direct.has(requirement)) fail('EVALUATOR_REFERENCE_REQUIREMENT_SCOPE', `${definition.id} maps non-owned requirement ${requirement}`);
      casesByRequirement[requirement].push(definition.id);
    }
  }
  const uncovered = evaluatorRequirementIds.filter((id) => casesByRequirement[id].length === 0);
  if (uncovered.length !== 0) fail('EVALUATOR_REFERENCE_REQUIREMENT_COVERAGE', `direct Evaluator requirements lack cases: ${uncovered.join(', ')}`);
  return {
    requirementCount: evaluatorRequirementIds.length,
    requirements: evaluatorRequirementIds.map((id) => ({ id, cases: casesByRequirement[id] })),
  };
}

registerEvaluatorCases({ defineCase, fixture, projection: evaluatorProjection, composerEvidence, plannedCoverage: plannedEvaluatorCoverage });
assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered Evaluator cases must exactly match checked-in expected case bank');

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('EVALUATOR_REFERENCE_CLI', 'usage: run-evaluator.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('EVALUATOR_REFERENCE_CLI', `unknown case ${selectedCase}`);
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
const plannedCoverage = plannedEvaluatorCoverage();
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
  'experiments/search-ir-composer-reference/export-evaluator-profiles.mjs',
  'experiments/search-semantics-reference/fixtures/evaluator-cases.json',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/evaluator.mjs',
  'experiments/search-semantics-reference/src/evaluator-case-support.mjs',
  'experiments/search-semantics-reference/src/evaluator-request-cases.mjs',
  'experiments/search-semantics-reference/src/evaluator-batch-cases.mjs',
  'experiments/search-semantics-reference/src/evaluator-cache-cases.mjs',
  'experiments/search-semantics-reference/src/evaluator-reuse-cleanup-cases.mjs',
  'experiments/search-semantics-reference/src/evaluator-sensitivity-cases.mjs',
  'experiments/search-semantics-reference/src/evaluator-cases.mjs',
  'experiments/search-semantics-reference/run-evaluator.mjs',
  'scripts/export-search-ir-composer-evaluator-profiles.mjs',
  'scripts/run-evaluator-reference.mjs',
  'docs/specs/SPEC-0009-evaluator-contract.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));
const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-evaluator-evidence-key/0.2.0',
  composerEvidence: fixture.composerEvidence,
  evaluatorProfileProjection: evaluatorProjection.projectionIdentity,
  evaluatorRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  selection: selectedCase,
  sources,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'Evaluator reference evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-evaluator-reference-v0.2.0',
  scope: selectedCase === null ? 'full-evaluator-reference' : 'focused-case',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: fixture.composerEvidence,
  evaluatorProfileProjection: evaluatorProjection.projectionIdentity,
  evaluatorRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  evidenceIdentity,
  sources,
  summary,
  cases,
  claimLimits: [
    'Evaluator-owned request/incarnation, batch/workspace, cache, reroot-reuse and cleanup semantics for the 37 direct ENGINE-REFERENCE requirements in SPEC-0009 only.',
    'Domain/Graph identity and ready input facts, Resource admission/pressure decisions, Progress service opportunities, Session advance facts and Policy consumption are injected immutable facts; their implementations/private state are not imported.',
    'External Output publication/ranking, native release-acquire/atomic realization, CUDA-JS execution, CUDA-JS-Tensor math, performance, search quality, production lowering and protected-main acceptance remain downstream.',
    'The stale-incarnation, incomplete-readiness and cache-full-key mutation cases prove reference sensitivity but do not qualify any CUDA memory-order or native mechanism.',
  ],
};

const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'evaluator-evidence.json' : `evaluator-evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} not_discovered=${summary.notDiscovered} not_executed_by_selection=${summary.notExecutedBySelection}`);
console.log(`composer_evidence_sha256=${fixture.composerEvidence.sha256} evaluator_projection_sha256=${evaluatorProjection.projectionIdentity.sha256} evaluator_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

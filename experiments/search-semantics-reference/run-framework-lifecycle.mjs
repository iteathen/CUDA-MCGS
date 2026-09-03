import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import {
  DIRECT_FRAMEWORK_REQUIREMENTS,
  registerFrameworkLifecycleCases,
} from './src/framework-lifecycle-cases.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixturePath = path.join(experimentRoot, 'fixtures', 'framework-lifecycle-cases.json');
const composerEvidencePath = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference', 'build', 'evidence.json');
const requirementCoveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');
const frameworkSpecPath = path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0000-framework-requirements.md');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Framework lifecycle reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath);
const composerEvidence = await readJson(composerEvidencePath, 'FRAMEWORK_REFERENCE_COMPOSER_EVIDENCE_MISSING');
const requirementCoverage = await readJson(requirementCoveragePath);
const frameworkSpec = await readFile(frameworkSpecPath, 'utf8');

exactKeys(
  fixture,
  ['composerEvidence', 'expectedCases', 'persistenceProfile', 'profile', 'schema', 'validPersistenceSnapshot'],
  'FRAMEWORK_REFERENCE_FIXTURE_FIELDS',
  'Framework lifecycle fixture',
);
assert.equal(fixture.schema, 'cuda-mcgs.reference-framework-lifecycle-fixtures/0.1.0');
exactKeys(fixture.composerEvidence, ['algorithm', 'byteLength', 'sha256'], 'FRAMEWORK_REFERENCE_FIXTURE_EVIDENCE', 'Framework Composer evidence');
assert.equal(composerEvidence.capsule, 'cuda-mcgs-search-ir-composer-reference-v0.2.0');
assert.equal(composerEvidence.status, 'pass');
assert(Number.isSafeInteger(composerEvidence.summary.expected) && composerEvidence.summary.expected > 0, 'Composer evidence must declare a positive exact case count');
assert.equal(composerEvidence.summary.discovered, composerEvidence.summary.expected, 'Composer evidence discovery must be exact');
assert.equal(composerEvidence.summary.executed, composerEvidence.summary.discovered, 'Composer evidence must execute every discovered case');
assert.equal(composerEvidence.summary.passed, composerEvidence.summary.executed, 'Composer evidence must pass every executed case');
assert.equal(composerEvidence.summary.failed, 0);
assert.equal(composerEvidence.summary.requiredSkipped, 0);
assert.equal(composerEvidence.summary.conditionalSkipped, 0);
assert.equal(composerEvidence.summary.optionalSkipped, 0);
assert.equal(composerEvidence.summary.notDiscovered, 0);
assert.deepEqual(composerEvidence.representationCompositionEvidenceKey, fixture.composerEvidence);

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'FRAMEWORK_REFERENCE_EXPECTED_CASES', 'Framework expectedCases');
if (expectedCaseIds.length === 0 || expectedCaseIds.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(id))) {
  fail('FRAMEWORK_REFERENCE_EXPECTED_CASES', 'expectedCases contains an invalid case id');
}

const ownedPrefixes = new Map([
  ['FRAMEWORK-LIFE-', 9],
  ['FRAMEWORK-PERSIST-', 2],
  ['FRAMEWORK-CLEANUP-', 4],
]);
for (const [requirementPrefix, requirementCount] of ownedPrefixes) {
  const classification = requirementCoverage.classifications.find((entry) =>
    entry.contract === 'SPEC-0000'
    && entry.requirementPrefix === requirementPrefix
    && entry.primaryDisposition === 'engine-reference-oracle'
    && entry.evidenceOwner === 'ENGINE-REFERENCE-01');
  assert(classification, `${requirementPrefix} requirement classification is missing`);
  assert.equal(classification.requirementCount, requirementCount);
}

const ownedPattern = /^(FRAMEWORK-(?:LIFE|PERSIST|CLEANUP)-\d{3})\./gm;
const frameworkRequirementIds = assertUniqueStrings(
  [...frameworkSpec.matchAll(ownedPattern)].map((match) => match[1]),
  'FRAMEWORK_REFERENCE_REQUIREMENT_SOURCE',
  'direct Framework lifecycle reference requirements',
);
assert.equal(frameworkRequirementIds.length, 15);
for (const [prefix, count] of ownedPrefixes) assert.equal(frameworkRequirementIds.filter((id) => id.startsWith(prefix)).length, count);
assert.deepEqual(
  frameworkRequirementIds,
  DIRECT_FRAMEWORK_REQUIREMENTS,
  'case-bank direct requirement registry must match authoritative SPEC-0000 order',
);

const definitions = [];
function defineCase(id, body, requirements = []) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  const uniqueRequirements = assertUniqueStrings(requirements, 'FRAMEWORK_REFERENCE_CASE_REQUIREMENTS', `${id} requirements`);
  definitions.push({ id, body, requirements: uniqueRequirements });
}

function plannedFrameworkCoverage() {
  const direct = new Set(frameworkRequirementIds);
  const casesByRequirement = Object.fromEntries(frameworkRequirementIds.map((id) => [id, []]));
  for (const definition of definitions) {
    for (const requirement of definition.requirements) {
      if (!direct.has(requirement)) fail('FRAMEWORK_REFERENCE_REQUIREMENT_SCOPE', `${definition.id} maps non-owned requirement ${requirement}`);
      casesByRequirement[requirement].push(definition.id);
    }
  }
  const uncovered = frameworkRequirementIds.filter((id) => casesByRequirement[id].length === 0);
  if (uncovered.length !== 0) {
    fail('FRAMEWORK_REFERENCE_REQUIREMENT_COVERAGE', `direct Framework requirements lack cases: ${uncovered.join(', ')}`);
  }
  return {
    requirementCount: frameworkRequirementIds.length,
    requirements: frameworkRequirementIds.map((id) => ({ id, cases: casesByRequirement[id] })),
  };
}

registerFrameworkLifecycleCases({ defineCase, fixture, plannedCoverage: plannedFrameworkCoverage });
assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered Framework cases must exactly match checked-in expected case bank');

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('FRAMEWORK_REFERENCE_CLI', 'usage: run-framework-lifecycle.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('FRAMEWORK_REFERENCE_CLI', `unknown case ${selectedCase}`);
}

const cases = [];
for (const definition of definitions) {
  if (selectedCase !== null && definition.id !== selectedCase) continue;
  try {
    const detail = await definition.body();
    cases.push({ id: definition.id, status: 'pass', detail: detail ?? null });
    console.log(`case=${definition.id} result=pass`);
  } catch (error) {
    cases.push({
      id: definition.id,
      status: 'fail',
      detail: null,
      error: { name: error.name, code: error.code ?? null, message: error.message },
    });
    console.error(`case=${definition.id} result=fail error=${JSON.stringify(error.message)}`);
  }
}

const failed = cases.filter(({ status }) => status === 'fail');
const plannedCoverage = plannedFrameworkCoverage();
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
  'experiments/search-semantics-reference/fixtures/framework-lifecycle-cases.json',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/framework-lifecycle.mjs',
  'experiments/search-semantics-reference/src/framework-lifecycle-cases.mjs',
  'experiments/search-semantics-reference/run-framework-lifecycle.mjs',
  'scripts/run-framework-lifecycle-reference.mjs',
  'docs/specs/SPEC-0000-framework-requirements.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));

const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-framework-lifecycle-evidence-key/0.2.0',
  composerEvidence: fixture.composerEvidence,
  frameworkRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  selection: selectedCase,
  sources,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'Framework lifecycle reference evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-framework-lifecycle-reference-v0.2.0',
  scope: selectedCase === null ? 'full-framework-lifecycle-reference' : 'focused-case',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: fixture.composerEvidence,
  frameworkRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  evidenceIdentity,
  sources,
  summary,
  cases,
  claimLimits: [
    'Framework-owned CUDA-free admission, initialization/rollback, ignition boundary, first-cause stop coordination, completion/cancellation, terminal borrow, teardown, cleanup and optional persistence semantics for the 15 direct ENGINE-REFERENCE requirements in SPEC-0000 only.',
    'Domain, Graph, Policy, Evaluator, Resource, Progress and Output facts remain separately owned and are represented here only as public lifecycle/disposition inputs; this oracle does not simulate or reinterpret their private state.',
    'The reference does not select a physical scheduler, CUDA stream/event/atomic/mailbox mechanism, allocator, persistence storage backend, product contract or native transport.',
    'The complete session-absent terminal vertical slice, optional Session/Stage/Channel references, native CUDA-JS realization, performance and protected #122 acceptance remain downstream.',
  ],
};

const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'framework-lifecycle-evidence.json' : `framework-lifecycle-evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} not_discovered=${summary.notDiscovered} not_executed_by_selection=${summary.notExecutedBySelection}`);
console.log(`composer_evidence_sha256=${fixture.composerEvidence.sha256} framework_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

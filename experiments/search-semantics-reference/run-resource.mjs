import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import { DIRECT_RESOURCE_REQUIREMENTS, registerResourceCases } from './src/resource-cases.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixturePath = path.join(experimentRoot, 'fixtures', 'resource-cases.json');
const composerEvidencePath = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference', 'build', 'evidence.json');
const resourceProjectionPath = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference', 'build', 'resource-profiles.json');
const requirementCoveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');
const resourceSpecPath = path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0011-finite-search-resources.md');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Resource reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath);
const composerEvidence = await readJson(composerEvidencePath, 'RESOURCE_REFERENCE_COMPOSER_EVIDENCE_MISSING');
const resourceProjection = await readJson(resourceProjectionPath, 'RESOURCE_REFERENCE_PROJECTION_MISSING');
const requirementCoverage = await readJson(requirementCoveragePath);
const resourceSpec = await readFile(resourceSpecPath, 'utf8');

exactKeys(fixture, ['composerEvidence', 'expectedCases', 'profileProjection', 'schema'], 'RESOURCE_REFERENCE_FIXTURE_FIELDS', 'Resource fixture');
assert.equal(fixture.schema, 'cuda-mcgs.reference-resource-fixtures/0.1.0');
exactKeys(fixture.composerEvidence, ['algorithm', 'byteLength', 'sha256'], 'RESOURCE_REFERENCE_FIXTURE_EVIDENCE', 'Resource Composer evidence');
exactKeys(fixture.profileProjection, ['algorithm', 'byteLength', 'schema', 'sha256'], 'RESOURCE_REFERENCE_FIXTURE_PROJECTION', 'Resource profile projection');
assert.deepEqual(composerEvidence.representationCompositionEvidenceKey, fixture.composerEvidence);
assert.equal(resourceProjection.schema, fixture.profileProjection.schema);
assert.deepEqual(resourceProjection.projectionIdentity, {
  algorithm: fixture.profileProjection.algorithm,
  byteLength: fixture.profileProjection.byteLength,
  sha256: fixture.profileProjection.sha256,
});
assert.equal(resourceProjection.profiles.length, 3);
assert.deepEqual(resourceProjection.profiles.map(({ id }) => id), [
  'resource.synthetic-evaluator-absent',
  'resource.synthetic-evaluator-workspace',
  'resource.synthetic-live-session',
]);

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'RESOURCE_REFERENCE_EXPECTED_CASES', 'Resource expectedCases');
if (expectedCaseIds.length === 0 || expectedCaseIds.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(id))) fail('RESOURCE_REFERENCE_EXPECTED_CASES', 'expectedCases contains an invalid case id');

const ownedPrefixes = new Map([
  ['RESOURCE-ADMIT-', 11],
  ['RESOURCE-PRESSURE-', 7],
  ['RESOURCE-EXHAUST-', 8],
  ['RESOURCE-LIFE-', 6],
  ['RESOURCE-CLEANUP-', 2],
]);
for (const [requirementPrefix, requirementCount] of ownedPrefixes) {
  const classification = requirementCoverage.classifications.find((entry) =>
    entry.contract === 'SPEC-0011'
    && entry.requirementPrefix === requirementPrefix
    && entry.primaryDisposition === 'engine-reference-oracle'
    && entry.evidenceOwner === 'ENGINE-REFERENCE-01');
  assert(classification, `${requirementPrefix} requirement classification is missing`);
  assert.equal(classification.requirementCount, requirementCount);
}
const ownedPattern = /^(RESOURCE-(?:ADMIT|PRESSURE|EXHAUST|LIFE|CLEANUP)-\d{3})\./gm;
const resourceRequirementIds = assertUniqueStrings(
  [...resourceSpec.matchAll(ownedPattern)].map((match) => match[1]),
  'RESOURCE_REFERENCE_REQUIREMENT_SOURCE',
  'direct Resource reference requirements',
);
assert.equal(resourceRequirementIds.length, [...ownedPrefixes.values()].reduce((sum, count) => sum + count, 0));
for (const [prefix, count] of ownedPrefixes) assert.equal(resourceRequirementIds.filter((id) => id.startsWith(prefix)).length, count);
assert.deepEqual(resourceRequirementIds, DIRECT_RESOURCE_REQUIREMENTS, 'case-bank direct requirement registry must match authoritative SPEC-0011 order');

const definitions = [];
function defineCase(id, body, requirements = []) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  const uniqueRequirements = assertUniqueStrings(requirements, 'RESOURCE_REFERENCE_CASE_REQUIREMENTS', `${id} requirements`);
  definitions.push({ id, body, requirements: uniqueRequirements });
}

function plannedResourceCoverage() {
  const direct = new Set(resourceRequirementIds);
  const casesByRequirement = Object.fromEntries(resourceRequirementIds.map((id) => [id, []]));
  for (const definition of definitions) {
    for (const requirement of definition.requirements) {
      if (!direct.has(requirement)) fail('RESOURCE_REFERENCE_REQUIREMENT_SCOPE', `${definition.id} maps non-owned requirement ${requirement}`);
      casesByRequirement[requirement].push(definition.id);
    }
  }
  const uncovered = resourceRequirementIds.filter((id) => casesByRequirement[id].length === 0);
  if (uncovered.length !== 0) fail('RESOURCE_REFERENCE_REQUIREMENT_COVERAGE', `direct Resource requirements lack cases: ${uncovered.join(', ')}`);
  return {
    requirementCount: resourceRequirementIds.length,
    requirements: resourceRequirementIds.map((id) => ({ id, cases: casesByRequirement[id] })),
  };
}

registerResourceCases({ defineCase, fixture, projection: resourceProjection, composerEvidence, plannedCoverage: plannedResourceCoverage });
assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered Resource cases must exactly match checked-in expected case bank');

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('RESOURCE_REFERENCE_CLI', 'usage: run-resource.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('RESOURCE_REFERENCE_CLI', `unknown case ${selectedCase}`);
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
const plannedCoverage = plannedResourceCoverage();
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
  'experiments/search-ir-composer-reference/export-resource-profiles.mjs',
  'experiments/search-semantics-reference/fixtures/resource-cases.json',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/resource.mjs',
  'experiments/search-semantics-reference/src/resource-case-support.mjs',
  'experiments/search-semantics-reference/src/resource-admission-cases.mjs',
  'experiments/search-semantics-reference/src/resource-pressure-exhaustion-cases.mjs',
  'experiments/search-semantics-reference/src/resource-lifecycle-cases.mjs',
  'experiments/search-semantics-reference/src/resource-sensitivity-cases.mjs',
  'experiments/search-semantics-reference/src/resource-cases.mjs',
  'experiments/search-semantics-reference/run-resource.mjs',
  'scripts/export-search-ir-composer-resource-profiles.mjs',
  'scripts/run-resource-reference.mjs',
  'docs/specs/SPEC-0011-finite-search-resources.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));
const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-resource-evidence-key/0.2.0',
  composerEvidence: fixture.composerEvidence,
  resourceProfileProjection: resourceProjection.projectionIdentity,
  resourceRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  selection: selectedCase,
  sources,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'Resource reference evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-resource-reference-v0.2.0',
  scope: selectedCase === null ? 'full-resource-reference' : 'focused-case',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: fixture.composerEvidence,
  resourceProfileProjection: resourceProjection.projectionIdentity,
  resourceRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  evidenceIdentity,
  sources,
  summary,
  cases,
  claimLimits: [
    'Resource-owned admission/lease/accounting, pressure, exhaustion, lifecycle and cleanup semantics for the 34 direct ENGINE-REFERENCE requirements in SPEC-0011 only.',
    'Contributor victim/eviction/drop/widen/stop policy, graph quiescence proof, Session root authority and Progress scheduling are injected facts and remain separately owned.',
    'Physical allocation/provider feasibility, CUDA atomics/memory ordering, CUDA-JS realization, performance, product behavior and protected-main acceptance remain downstream.',
    'The reference uses in-memory JavaScript maps and exact BigInt arithmetic only as a CUDA-free semantic oracle; it does not select production layout or allocator mechanisms.',
  ],
};

const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'resource-evidence.json' : `resource-evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} not_discovered=${summary.notDiscovered} not_executed_by_selection=${summary.notExecutedBySelection}`);
console.log(`composer_evidence_sha256=${fixture.composerEvidence.sha256} resource_projection_sha256=${resourceProjection.projectionIdentity.sha256} resource_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

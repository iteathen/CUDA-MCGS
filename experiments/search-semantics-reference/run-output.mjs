import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import { DIRECT_OUTPUT_REQUIREMENTS, registerOutputCases } from './src/output-cases.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixturePath = path.join(experimentRoot, 'fixtures', 'output-cases.json');
const composerEvidencePath = path.join(repositoryRoot, 'conformance', 'search-compiler', 'build', 'evidence.json');
const outputProjectionPath = path.join(repositoryRoot, 'conformance', 'search-compiler', 'build', 'output-profiles.json');
const requirementCoveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');
const outputSpecPath = path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0013-result-and-observation-publication.md');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Output reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath);
const composerEvidence = await readJson(composerEvidencePath, 'OUTPUT_REFERENCE_COMPOSER_EVIDENCE_MISSING');
const outputProjection = await readJson(outputProjectionPath, 'OUTPUT_REFERENCE_PROJECTION_MISSING');
const requirementCoverage = await readJson(requirementCoveragePath);
const outputSpec = await readFile(outputSpecPath, 'utf8');

exactKeys(fixture, ['composerEvidence', 'expectedCases', 'profileProjection', 'schema'], 'OUTPUT_REFERENCE_FIXTURE_FIELDS', 'Output fixture');
assert.equal(fixture.schema, 'cuda-mcgs.reference-output-fixtures/0.1.0');
exactKeys(fixture.composerEvidence, ['algorithm', 'byteLength', 'sha256'], 'OUTPUT_REFERENCE_FIXTURE_EVIDENCE', 'Output Composer evidence');
exactKeys(fixture.profileProjection, ['profileIds', 'schema'], 'OUTPUT_REFERENCE_FIXTURE_PROJECTION', 'Output profile projection');
assert.deepEqual(composerEvidence.representationCompositionEvidenceKey, fixture.composerEvidence);
assert.equal(outputProjection.schema, fixture.profileProjection.schema);
assert.deepEqual(outputProjection.producer.representationCompositionEvidenceKey, fixture.composerEvidence);
assert.deepEqual(outputProjection.profiles.map(({ id }) => id), fixture.profileProjection.profileIds);
for (const entry of outputProjection.profiles) {
  assert.equal(entry.normalized.id, entry.id);
  assert.equal(entry.identity.algorithm, 'sha256');
  assert.match(entry.identity.sha256, /^[0-9a-f]{64}$/);
}

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'OUTPUT_REFERENCE_EXPECTED_CASES', 'Output expectedCases');
if (expectedCaseIds.length === 0 || expectedCaseIds.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(id))) fail('OUTPUT_REFERENCE_EXPECTED_CASES', 'expectedCases contains an invalid case id');

const ownedPrefixes = new Map([
  ['OUTPUT-TERMINAL-', 10],
  ['OUTPUT-OBS-', 11],
  ['OUTPUT-SNAPSHOT-', 8],
  ['OUTPUT-PUB-', 11],
  ['OUTPUT-LIFE-', 8],
  ['OUTPUT-CLEANUP-', 3],
]);
for (const [requirementPrefix, requirementCount] of ownedPrefixes) {
  const classification = requirementCoverage.classifications.find((entry) =>
    entry.contract === 'SPEC-0013'
    && entry.requirementPrefix === requirementPrefix
    && entry.primaryDisposition === 'engine-reference-oracle'
    && entry.evidenceOwner === 'ENGINE-REFERENCE-01');
  assert(classification, `${requirementPrefix} requirement classification is missing`);
  assert.equal(classification.requirementCount, requirementCount);
}
const ownedPattern = /^(OUTPUT-(?:TERMINAL|OBS|SNAPSHOT|PUB|LIFE|CLEANUP)-\d{3})\./gm;
const outputRequirementIds = assertUniqueStrings(
  [...outputSpec.matchAll(ownedPattern)].map((match) => match[1]),
  'OUTPUT_REFERENCE_REQUIREMENT_SOURCE',
  'direct Output reference requirements',
);
assert.equal(outputRequirementIds.length, 51);
for (const [prefix, count] of ownedPrefixes) assert.equal(outputRequirementIds.filter((id) => id.startsWith(prefix)).length, count);
assert.deepEqual(outputRequirementIds, DIRECT_OUTPUT_REQUIREMENTS, 'case-bank direct requirement registry must match authoritative SPEC-0013 order');

const definitions = [];
function defineCase(id, body, requirements = []) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  const uniqueRequirements = assertUniqueStrings(requirements, 'OUTPUT_REFERENCE_CASE_REQUIREMENTS', `${id} requirements`);
  definitions.push({ id, body, requirements: uniqueRequirements });
}

function plannedOutputCoverage() {
  const direct = new Set(outputRequirementIds);
  const casesByRequirement = Object.fromEntries(outputRequirementIds.map((id) => [id, []]));
  for (const definition of definitions) {
    for (const requirement of definition.requirements) {
      if (!direct.has(requirement)) fail('OUTPUT_REFERENCE_REQUIREMENT_SCOPE', `${definition.id} maps non-owned requirement ${requirement}`);
      casesByRequirement[requirement].push(definition.id);
    }
  }
  const uncovered = outputRequirementIds.filter((id) => casesByRequirement[id].length === 0);
  if (uncovered.length !== 0) fail('OUTPUT_REFERENCE_REQUIREMENT_COVERAGE', `direct Output requirements lack cases: ${uncovered.join(', ')}`);
  return {
    requirementCount: outputRequirementIds.length,
    requirements: outputRequirementIds.map((id) => ({ id, cases: casesByRequirement[id] })),
  };
}

registerOutputCases({ defineCase, fixture, projection: outputProjection, composerEvidence, plannedCoverage: plannedOutputCoverage });
assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered Output cases must exactly match checked-in expected case bank');

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('OUTPUT_REFERENCE_CLI', 'usage: run-output.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('OUTPUT_REFERENCE_CLI', `unknown case ${selectedCase}`);
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
const plannedCoverage = plannedOutputCoverage();
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
  'conformance/search-compiler/export-output-profiles.mjs',
  'experiments/search-semantics-reference/fixtures/output-cases.json',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/output.mjs',
  'experiments/search-semantics-reference/src/output-case-support.mjs',
  'experiments/search-semantics-reference/src/output-terminal-cases.mjs',
  'experiments/search-semantics-reference/src/output-observation-cases.mjs',
  'experiments/search-semantics-reference/src/output-snapshot-publication-cases.mjs',
  'experiments/search-semantics-reference/src/output-lifecycle-cleanup-cases.mjs',
  'experiments/search-semantics-reference/src/output-cases.mjs',
  'experiments/search-semantics-reference/run-output.mjs',
  'scripts/export-search-ir-composer-output-profiles.mjs',
  'scripts/run-output-reference.mjs',
  'docs/specs/SPEC-0013-result-and-observation-publication.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));
const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-output-evidence-key/0.2.0',
  composerEvidence: fixture.composerEvidence,
  outputProfileProjection: outputProjection.projectionIdentity,
  outputRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  selection: selectedCase,
  sources,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'Output reference evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-output-reference-v0.2.0',
  scope: selectedCase === null ? 'full-output-reference' : 'focused-case',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: fixture.composerEvidence,
  outputProfileProjection: outputProjection.projectionIdentity,
  outputRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  evidenceIdentity,
  sources,
  summary,
  cases,
  claimLimits: [
    'Output-owned CUDA-free terminal envelope/capture, live observation, snapshot consistency, publication/borrow, lifecycle and cleanup semantics for the 51 direct ENGINE-REFERENCE requirements in SPEC-0013 only.',
    'Domain/Policy/Evaluator payload meaning, ranking semantics, Graph storage, Resource capacity policy, Progress scheduling/closure authority and Session command/root authority remain separately owned and are consumed only as public facts.',
    'The reference models bounded mechanism-neutral publication, observation pressure and consumer borrow/transfer lifecycles; it does not select CUDA atomics, mailboxes, streams, events, kernels or transport topology.',
    'Native CUDA-JS realization, memory-visibility qualification, physical transfer teardown, performance, product payload schemas and protected-main/atomic #122 acceptance remain downstream.',
  ],
};

const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'output-evidence.json' : `output-evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} not_discovered=${summary.notDiscovered} not_executed_by_selection=${summary.notExecutedBySelection}`);
console.log(`composer_evidence_sha256=${fixture.composerEvidence.sha256} output_projection_sha256=${outputProjection.projectionIdentity.sha256} output_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

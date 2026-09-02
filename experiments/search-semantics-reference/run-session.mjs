import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import { registerSessionBoundaryCases } from './src/session-boundary-cases.mjs';
import { registerSessionCases } from './src/session-cases.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const composerRoot = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference');
const fixturePath = path.join(experimentRoot, 'fixtures', 'session-cases.json');
const sessionProjectionPath = path.join(composerRoot, 'build', 'session-profiles.json');
const composerEvidencePath = path.join(composerRoot, 'build', 'evidence.json');
const terminalEvidencePath = path.join(experimentRoot, 'build', 'terminal-slice-evidence.json');
const specPath = path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0006-search-session-control-and-observation.md');
const coveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Session reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath);
const sessionProjection = await readJson(sessionProjectionPath, 'SESSION_REFERENCE_PROFILE_PROJECTION_MISSING');
const composerEvidence = await readJson(composerEvidencePath, 'SESSION_REFERENCE_COMPOSER_EVIDENCE_MISSING');
const terminalEvidence = await readJson(terminalEvidencePath, 'SESSION_REFERENCE_TERMINAL_EVIDENCE_MISSING');
const coverage = await readJson(coveragePath);
const specText = await readFile(specPath, 'utf8');

exactKeys(fixture, ['directRequirementCount', 'expectedCases', 'profileProjection', 'schema'], 'SESSION_REFERENCE_FIXTURE_FIELDS', 'Session fixture');
assert.equal(fixture.schema, 'cuda-mcgs.reference-session-fixtures/0.1.0');
assert.equal(sessionProjection.schema, fixture.profileProjection.schema);
assert.deepEqual(sessionProjection.profiles.map(({ id }) => id), fixture.profileProjection.profileIds);
assert.deepEqual(sessionProjection.producer.representationCompositionEvidenceKey, composerEvidence.representationCompositionEvidenceKey);
assert.equal(terminalEvidence.status, 'pass');

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'SESSION_REFERENCE_EXPECTED_CASES', 'Session expectedCases');
if (expectedCaseIds.length === 0) fail('SESSION_REFERENCE_EXPECTED_CASES', 'Session case bank must not be empty');

const sessionClassifications = coverage.classifications.filter(({ contract }) => contract === 'SPEC-0006');
function classificationFor(requirementId) {
  const candidates = sessionClassifications.filter(({ requirementPrefix }) => requirementId.startsWith(requirementPrefix));
  candidates.sort((left, right) => right.requirementPrefix.length - left.requirementPrefix.length);
  if (candidates.length === 0) fail('SESSION_REFERENCE_REQUIREMENT_ROUTE', `no coverage classification for ${requirementId}`);
  return candidates[0];
}

const requirementIds = [...new Set(specText.match(/\bSESSION(?:-[A-Z]+)*-\d{3}\b/g) ?? [])].sort();
const directRequirements = requirementIds.filter((id) => {
  const route = classificationFor(id);
  return route.primaryDisposition === 'engine-reference-oracle' && route.plannedEvidenceOwner === 'ENGINE-REFERENCE-01';
});
assert.equal(directRequirements.length, fixture.directRequirementCount, `Session direct engine-reference requirement count must remain ${fixture.directRequirementCount}`);

const definitions = [];
function defineCase(id, body, coveragePrefixes = []) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  definitions.push({ id, body, coveragePrefixes });
}
registerSessionCases({ defineCase, sessionProjection, terminalEvidence });
registerSessionBoundaryCases({ defineCase, sessionProjection });
assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered Session cases must exactly match checked-in expected case bank');

const mappedRequirements = new Set();
for (const definition of definitions) {
  for (const requirementId of directRequirements) {
    const route = classificationFor(requirementId);
    if (definition.coveragePrefixes.includes(route.requirementPrefix)) mappedRequirements.add(requirementId);
  }
}
const unmappedRequirements = directRequirements.filter((id) => !mappedRequirements.has(id));
if (unmappedRequirements.length > 0) fail('SESSION_REFERENCE_REQUIREMENT_COVERAGE', `unmapped direct Session requirements: ${unmappedRequirements.join(', ')}`);

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('SESSION_REFERENCE_CLI', 'usage: run-session.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('SESSION_REFERENCE_CLI', `unknown case ${selectedCase}`);
}

const cases = [];
const executedRequirements = new Set();
for (const definition of definitions) {
  if (selectedCase !== null && definition.id !== selectedCase) continue;
  try {
    const detail = await definition.body();
    const mapped = directRequirements.filter((requirementId) => definition.coveragePrefixes.includes(classificationFor(requirementId).requirementPrefix));
    for (const requirementId of mapped) executedRequirements.add(requirementId);
    cases.push({ id: definition.id, status: 'pass', requirements: mapped, detail: detail ?? null });
    console.log(`case=${definition.id} result=pass requirements=${mapped.length}`);
  } catch (error) {
    cases.push({
      id: definition.id,
      status: 'fail',
      requirements: [],
      detail: null,
      error: { name: error.name, code: error.code ?? null, message: error.message },
    });
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
  directRequirements: directRequirements.length,
  directRequirementsExecuted: executedRequirements.size,
  requiredSkipped: 0,
  conditionalSkipped: 0,
  optionalSkipped: 0,
  notDiscovered: expectedCaseIds.length - definitions.length,
  notExecutedBySelection: expectedCaseIds.length - cases.length,
};
if (selectedCase === null) {
  assert.equal(cases.length, expectedCaseIds.length);
  assert.equal(executedRequirements.size, directRequirements.length, 'full Session run must execute evidence mapped to every direct engine-reference requirement');
}

const sourcePaths = [
  'docs/specs/SPEC-0006-search-session-control-and-observation.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
  'experiments/search-ir-composer-reference/src/session.mjs',
  'experiments/search-ir-composer-reference/src/session-fixtures.mjs',
  'experiments/search-ir-composer-reference/export-session-profiles.mjs',
  'experiments/search-semantics-reference/fixtures/session-cases.json',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/session.mjs',
  'experiments/search-semantics-reference/src/session-case-support.mjs',
  'experiments/search-semantics-reference/src/session-cases.mjs',
  'experiments/search-semantics-reference/src/session-boundary-cases.mjs',
  'experiments/search-semantics-reference/run-session.mjs',
  'scripts/export-search-ir-composer-session-profiles.mjs',
  'scripts/run-session-reference.mjs',
  'scripts/verify-session-advance-boundary.mjs',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));

const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-session-evidence-key/0.1.0',
  composerEvidence: composerEvidence.representationCompositionEvidenceKey,
  sessionProjection: sessionProjection.projectionIdentity,
  terminalAbsenceEvidence: terminalEvidence.evidenceIdentity,
  selection: selectedCase,
  sources,
  directRequirements,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'Session reference evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-session-reference-v0.1.0',
  scope: selectedCase === null ? 'full-session-reference' : 'focused-case',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: composerEvidence.representationCompositionEvidenceKey,
  sessionProjection: sessionProjection.projectionIdentity,
  terminalAbsenceEvidence: terminalEvidence.evidenceIdentity,
  evidenceIdentity,
  directRequirements,
  sources,
  summary,
  cases,
  claimLimits: [
    'This capsule is a CUDA-free behavioral reference for the optional Search Session semantic owner only.',
    'Domain root validity, Graph occurrence/reclamation, owner reuse meaning, Resource accounting, Progress scheduling, Output publication meaning and Framework lifecycle remain separate authorities.',
    'Declared schedules are bounded conformance histories, not a production scheduler or native concurrency proof.',
    'Native CUDA-JS realization, physical concurrency/memory visibility, performance, product semantics and protected-main/#122 acceptance remain downstream.',
  ],
};

const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'session-evidence.json' : `session-evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} direct_requirements=${summary.directRequirements} direct_executed=${summary.directRequirementsExecuted}`);
console.log(`composer_evidence_sha256=${composerEvidence.representationCompositionEvidenceKey.sha256} session_projection_sha256=${sessionProjection.projectionIdentity.sha256} session_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

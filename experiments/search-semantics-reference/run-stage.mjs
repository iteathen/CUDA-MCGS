import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, fail } from './src/errors.mjs';
import { registerStageCases } from './src/stage-cases.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const composerRoot = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference');
const fixturePath = path.join(experimentRoot, 'fixtures', 'stage-cases.json');
const stageProjectionPath = path.join(composerRoot, 'build', 'stage-profiles.json');
const composerEvidencePath = path.join(composerRoot, 'build', 'evidence.json');
const specPath = path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0003-search-stage-and-extension-surface.md');
const coveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Stage reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try { return JSON.parse(await readFile(absolutePath, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath);
const stageProjection = await readJson(stageProjectionPath, 'STAGE_REFERENCE_PROFILE_PROJECTION_MISSING');
const composerEvidence = await readJson(composerEvidencePath, 'STAGE_REFERENCE_COMPOSER_EVIDENCE_MISSING');
const coverage = await readJson(coveragePath);
const specText = await readFile(specPath, 'utf8');

assert.equal(fixture.schema, 'cuda-mcgs.reference-stage-fixtures/0.1.0');
assert.equal(stageProjection.schema, fixture.profileProjection.schema);
assert.deepEqual(stageProjection.profiles.map(({ id }) => id), fixture.profileProjection.profileIds);
assert.deepEqual(stageProjection.producer.representationCompositionEvidenceKey, composerEvidence.representationCompositionEvidenceKey);

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'STAGE_REFERENCE_EXPECTED_CASES', 'Stage expectedCases');
if (expectedCaseIds.length === 0) fail('STAGE_REFERENCE_EXPECTED_CASES', 'Stage case bank must not be empty');

const stageClassifications = coverage.classifications.filter(({ contract }) => contract === 'SPEC-0003');
function classificationFor(requirementId) {
  const candidates = stageClassifications.filter(({ requirementPrefix }) => requirementId.startsWith(requirementPrefix));
  candidates.sort((left, right) => right.requirementPrefix.length - left.requirementPrefix.length);
  if (candidates.length === 0) fail('STAGE_REFERENCE_REQUIREMENT_ROUTE', `no coverage classification for ${requirementId}`);
  return candidates[0];
}
const requirementIds = [...new Set(specText.match(/\bEXT(?:-[A-Z]+)*-[0-9]{3}\b/g) ?? [])].sort();
const directRequirements = requirementIds.filter((id) => {
  const route = classificationFor(id);
  return route.primaryDisposition === 'engine-reference-oracle' && route.plannedEvidenceOwner === 'ENGINE-REFERENCE-01';
});
assert.equal(directRequirements.length, fixture.directRequirementCount, `Stage direct engine-reference requirement count must remain ${fixture.directRequirementCount}`);

const definitions = [];
function defineCase(id, body, coveragePrefixes = []) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  definitions.push({ id, body, coveragePrefixes });
}
registerStageCases({ defineCase, stageProjection, composerEvidence });
assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered Stage cases must exactly match checked-in expected case bank');

const mappedRequirements = new Set();
for (const definition of definitions) {
  for (const requirementId of directRequirements) {
    const route = classificationFor(requirementId);
    if (definition.coveragePrefixes.includes(route.requirementPrefix)) mappedRequirements.add(requirementId);
  }
}
const unmappedRequirements = directRequirements.filter((id) => !mappedRequirements.has(id));
if (unmappedRequirements.length > 0) fail('STAGE_REFERENCE_REQUIREMENT_COVERAGE', `unmapped direct Stage requirements: ${unmappedRequirements.join(', ')}`);

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('STAGE_REFERENCE_CLI', 'usage: run-stage.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('STAGE_REFERENCE_CLI', `unknown case ${selectedCase}`);
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
    cases.push({ id: definition.id, status: 'fail', requirements: [], detail: null, error: { name: error.name, code: error.code ?? null, message: error.message } });
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
  assert.equal(executedRequirements.size, directRequirements.length, 'full Stage run must execute evidence mapped to every direct engine-reference requirement');
}

const sourcePaths = [
  'docs/specs/SPEC-0003-search-stage-and-extension-surface.md',
  'docs/specs/SPEC-0005-stage-ptx-and-search-image-composition.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
  'experiments/search-ir-composer-reference/src/stage.mjs',
  'experiments/search-ir-composer-reference/src/stage-fixtures.mjs',
  'experiments/search-ir-composer-reference/export-stage-profiles.mjs',
  'experiments/search-semantics-reference/fixtures/stage-cases.json',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/schedule.mjs',
  'experiments/search-semantics-reference/src/mutation.mjs',
  'experiments/search-semantics-reference/src/stage.mjs',
  'experiments/search-semantics-reference/src/stage-case-support.mjs',
  'experiments/search-semantics-reference/src/stage-cases.mjs',
  'experiments/search-semantics-reference/run-stage.mjs',
  'scripts/export-search-ir-composer-stage-profiles.mjs',
  'scripts/run-stage-reference.mjs',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));

const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-stage-evidence-key/0.1.0',
  composerEvidence: composerEvidence.representationCompositionEvidenceKey,
  stageProjection: stageProjection.projectionIdentity,
  selection: selectedCase,
  sources,
  directRequirements,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'Stage reference evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-stage-reference-v0.1.0',
  scope: selectedCase === null ? 'full-stage-reference' : 'focused-case',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: composerEvidence.representationCompositionEvidenceKey,
  stageProjection: stageProjection.projectionIdentity,
  evidenceIdentity,
  directRequirements,
  sources,
  summary,
  cases,
  claimLimits: [
    'This capsule is CUDA-free behavioral evidence for the optional Search Stage semantic owner only.',
    'Domain, Graph, Policy, Evaluator, Resource, Progress, Output, Session and Framework facts remain separately owned and are consumed only as public facts/normalized profile references.',
    'Declared schedules are bounded conformance histories, not a production scheduler or native concurrency proof.',
    'Device-JS validation/lowering, PTX/cubin/LTO/native artifacts, linking/loading, CUDA publication races, occupancy, performance and exact compatible-pair qualification remain CUDA-JS/native responsibilities.',
  ],
};
const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'stage-evidence.json' : `stage-evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} direct_requirements=${summary.directRequirements} direct_executed=${summary.directRequirementsExecuted}`);
console.log(`composer_evidence_sha256=${composerEvidence.representationCompositionEvidenceKey.sha256} stage_projection_sha256=${stageProjection.projectionIdentity.sha256} stage_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

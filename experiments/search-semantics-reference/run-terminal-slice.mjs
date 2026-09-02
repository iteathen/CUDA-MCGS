import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import { registerTerminalSliceCases } from './src/terminal-slice-cases.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const composerRoot = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference');
const fixturePath = path.join(experimentRoot, 'fixtures', 'terminal-slice-cases.json');
const composerEvidencePath = path.join(composerRoot, 'build', 'evidence.json');
const progressProjectionPath = path.join(composerRoot, 'build', 'progress-profiles.json');
const outputProjectionPath = path.join(composerRoot, 'build', 'output-profiles.json');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS terminal-slice reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath);
const composerEvidence = await readJson(composerEvidencePath, 'TERMINAL_SLICE_COMPOSER_EVIDENCE_MISSING');
const progressProjection = await readJson(progressProjectionPath, 'TERMINAL_SLICE_PROGRESS_PROJECTION_MISSING');
const outputProjection = await readJson(outputProjectionPath, 'TERMINAL_SLICE_OUTPUT_PROJECTION_MISSING');

exactKeys(fixture, ['expectedCases', 'profileProjection', 'schema'], 'TERMINAL_SLICE_FIXTURE_FIELDS', 'terminal-slice fixture');
assert.equal(fixture.schema, 'cuda-mcgs.reference-terminal-slice-fixtures/0.1.0');
exactKeys(fixture.profileProjection, ['output', 'progress'], 'TERMINAL_SLICE_FIXTURE_PROJECTIONS', 'terminal-slice profile projections');
for (const [owner, projection, expectedSchema] of [
  ['progress', progressProjection, 'cuda-mcgs.search-ir-composer-progress-profile-projection/0.2.0'],
  ['output', outputProjection, 'cuda-mcgs.search-ir-composer-output-profile-projection/0.2.0'],
]) {
  const expected = fixture.profileProjection[owner];
  exactKeys(expected, ['profileIds', 'schema'], 'TERMINAL_SLICE_FIXTURE_PROJECTION', `${owner} profile projection`);
  assert.equal(expected.schema, expectedSchema);
  assert.equal(projection.schema, expected.schema);
  assert.deepEqual(projection.producer.representationCompositionEvidenceKey, composerEvidence.representationCompositionEvidenceKey);
  assert.deepEqual(projection.profiles.map(({ id }) => id), expected.profileIds);
}

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'TERMINAL_SLICE_EXPECTED_CASES', 'terminal-slice expectedCases');
if (expectedCaseIds.length === 0) fail('TERMINAL_SLICE_EXPECTED_CASES', 'terminal-slice case bank must not be empty');

const definitions = [];
function defineCase(id, body) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  definitions.push({ id, body });
}

registerTerminalSliceCases({ defineCase, progressProjection, outputProjection });
assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered terminal-slice cases must exactly match checked-in expected case bank');

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('TERMINAL_SLICE_CLI', 'usage: run-terminal-slice.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('TERMINAL_SLICE_CLI', `unknown case ${selectedCase}`);
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
  'experiments/search-ir-composer-reference/export-output-profiles.mjs',
  'experiments/search-semantics-reference/fixtures/terminal-slice-cases.json',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/progress.mjs',
  'experiments/search-semantics-reference/src/progress-case-support.mjs',
  'experiments/search-semantics-reference/src/output.mjs',
  'experiments/search-semantics-reference/src/output-case-support.mjs',
  'experiments/search-semantics-reference/src/terminal-slice.mjs',
  'experiments/search-semantics-reference/src/terminal-slice-cases.mjs',
  'experiments/search-semantics-reference/run-terminal-slice.mjs',
  'scripts/run-terminal-slice-reference.mjs',
  'docs/specs/SPEC-0012-device-owned-search-progress.md',
  'docs/specs/SPEC-0013-result-and-observation-publication.md'
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));

const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-terminal-slice-evidence-key/0.1.0',
  composerEvidence: composerEvidence.representationCompositionEvidenceKey,
  progressProfileProjection: progressProjection.projectionIdentity,
  outputProfileProjection: outputProjection.projectionIdentity,
  selection: selectedCase,
  sources,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'terminal-slice reference evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-terminal-slice-reference-v0.1.0',
  scope: selectedCase === null ? 'full-terminal-slice-reference' : 'focused-case',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: composerEvidence.representationCompositionEvidenceKey,
  progressProfileProjection: progressProjection.projectionIdentity,
  outputProfileProjection: outputProjection.projectionIdentity,
  evidenceIdentity,
  sources,
  summary,
  cases,
  claimLimits: [
    'This capsule is a CUDA-free cross-owner integration reference only; Progress and Output retain their own semantic authority.',
    'The terminal-slice bridge may route immutable public owner facts but must not invent terminal readiness, work state, resource state, output state or a replacement scheduler.',
    'Session, Stage, Channel, native CUDA-JS realization, physical device behavior, product semantics and protected-main/#122 acceptance remain downstream.'
  ]
};

const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'terminal-slice-evidence.json' : `terminal-slice-evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed}`);
console.log(`composer_evidence_sha256=${composerEvidence.representationCompositionEvidenceKey.sha256} terminal_slice_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

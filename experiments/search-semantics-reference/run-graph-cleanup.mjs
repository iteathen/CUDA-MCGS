import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import { registerGraphCleanupCases } from './src/graph-cleanup-cases.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixturePath = path.join(experimentRoot, 'fixtures', 'graph-cleanup-cases.json');
const composerRoot = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference');
const composerEvidencePath = path.join(composerRoot, 'build', 'evidence.json');
const graphProjectionPath = path.join(composerRoot, 'build', 'graph-profiles.json');
const nodeEvidencePath = path.join(experimentRoot, 'build', 'graph-node-evidence.json');
const edgeEvidencePath = path.join(experimentRoot, 'build', 'graph-edge-evidence.json');
const refEvidencePath = path.join(experimentRoot, 'build', 'graph-ref-evidence.json');
const pathEvidencePath = path.join(experimentRoot, 'build', 'graph-path-evidence.json');
const rootEvidencePath = path.join(experimentRoot, 'build', 'graph-root-evidence.json');
const reclaimEvidencePath = path.join(experimentRoot, 'build', 'graph-reclaim-evidence.json');
const advanceOccurrenceEvidencePath = path.join(experimentRoot, 'build', 'graph-advance-occurrence-evidence.json');
const requirementCoveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');
const graphSpecPath = path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0010-graph-storage-and-reclamation.md');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Graph cleanup reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath, 'GRAPH_CLEANUP_FIXTURE_MISSING');
const composerEvidence = await readJson(composerEvidencePath, 'GRAPH_CLEANUP_COMPOSER_MISSING');
const projection = await readJson(graphProjectionPath, 'GRAPH_CLEANUP_PROJECTION_MISSING');
const nodeEvidence = await readJson(nodeEvidencePath, 'GRAPH_CLEANUP_NODE_MISSING');
const edgeEvidence = await readJson(edgeEvidencePath, 'GRAPH_CLEANUP_EDGE_MISSING');
const refEvidence = await readJson(refEvidencePath, 'GRAPH_CLEANUP_REF_MISSING');
const pathEvidence = await readJson(pathEvidencePath, 'GRAPH_CLEANUP_PATH_MISSING');
const rootEvidence = await readJson(rootEvidencePath, 'GRAPH_CLEANUP_ROOT_MISSING');
const reclaimEvidence = await readJson(reclaimEvidencePath, 'GRAPH_CLEANUP_RECLAIM_MISSING');
const advanceOccurrenceEvidence = await readJson(advanceOccurrenceEvidencePath, 'GRAPH_CLEANUP_ADVANCE_OCCURRENCE_MISSING');
const requirementCoverage = await readJson(requirementCoveragePath);
const graphSpec = await readFile(graphSpecPath, 'utf8');

exactKeys(fixture, [
  'advanceOccurrenceEvidence', 'composerEvidence', 'edgeEvidence', 'expectedCases', 'nodeEvidence', 'pathEvidence',
  'profileProjection', 'reclaimEvidence', 'refEvidence', 'rootEvidence', 'schema',
], 'GRAPH_CLEANUP_FIXTURE_FIELDS', 'Graph cleanup fixture');
assert.equal(fixture.schema, 'cuda-mcgs.reference-graph-cleanup-fixtures/0.1.0');
assert.deepEqual(composerEvidence.representationCompositionEvidenceKey, fixture.composerEvidence);
assert.deepEqual(projection.projectionIdentity, {
  algorithm: fixture.profileProjection.algorithm,
  byteLength: fixture.profileProjection.byteLength,
  sha256: fixture.profileProjection.sha256,
});
assert.deepEqual(nodeEvidence.evidenceIdentity, fixture.nodeEvidence);
assert.deepEqual(edgeEvidence.evidenceIdentity, fixture.edgeEvidence);
assert.deepEqual(refEvidence.evidenceIdentity, fixture.refEvidence);
assert.deepEqual(pathEvidence.evidenceIdentity, fixture.pathEvidence);
assert.deepEqual(rootEvidence.evidenceIdentity, fixture.rootEvidence);
assert.deepEqual(reclaimEvidence.evidenceIdentity, fixture.reclaimEvidence);
assert.deepEqual(advanceOccurrenceEvidence.evidenceIdentity, fixture.advanceOccurrenceEvidence);

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'GRAPH_CLEANUP_EXPECTED_CASES', 'Graph cleanup expectedCases');
assert.equal(expectedCaseIds.length, 6);
const classification = requirementCoverage.classifications.find((entry) =>
  entry.contract === 'SPEC-0010'
  && entry.requirementPrefix === 'GRAPH-CLEANUP-'
  && entry.plannedEvidenceOwner === 'ENGINE-REFERENCE-01');
assert(classification, 'GRAPH-CLEANUP- requirement classification is missing');
assert.equal(classification.requirementCount, 4);
const cleanupRequirementIds = assertUniqueStrings(
  [...graphSpec.matchAll(/^(GRAPH-CLEANUP-\d{3})\./gm)].map((match) => match[1]),
  'GRAPH_CLEANUP_REQUIREMENT_SOURCE',
  'direct Graph cleanup requirements',
);
assert.equal(cleanupRequirementIds.length, 4);

const definitions = [];
function defineCase(id, body, requirements = []) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  definitions.push({ id, body, requirements: assertUniqueStrings(requirements, 'GRAPH_CLEANUP_CASE_REQUIREMENTS', `${id} requirements`) });
}

function plannedCoverage() {
  const direct = new Set(cleanupRequirementIds);
  const casesByRequirement = Object.fromEntries(cleanupRequirementIds.map((id) => [id, []]));
  for (const definition of definitions) {
    for (const requirement of definition.requirements) {
      if (!direct.has(requirement)) fail('GRAPH_CLEANUP_REQUIREMENT_SCOPE', `${definition.id} maps non-owned requirement ${requirement}`);
      casesByRequirement[requirement].push(definition.id);
    }
  }
  const uncovered = cleanupRequirementIds.filter((id) => casesByRequirement[id].length === 0);
  if (uncovered.length !== 0) fail('GRAPH_CLEANUP_REQUIREMENT_COVERAGE', `Graph cleanup requirements lack cases: ${uncovered.join(', ')}`);
  return {
    requirementCount: cleanupRequirementIds.length,
    requirements: cleanupRequirementIds.map((id) => ({ id, cases: casesByRequirement[id] })),
  };
}

registerGraphCleanupCases({
  defineCase,
  fixture,
  projection,
  nodeEvidence,
  edgeEvidence,
  refEvidence,
  pathEvidence,
  rootEvidence,
  reclaimEvidence,
  advanceOccurrenceEvidence,
  plannedCoverage,
});
assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered Graph cleanup cases must exactly match checked-in expected bank');

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('GRAPH_CLEANUP_CLI', 'usage: run-graph-cleanup.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('GRAPH_CLEANUP_CLI', `unknown case ${selectedCase}`);
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
const coverage = plannedCoverage();
const summary = {
  expected: expectedCaseIds.length,
  discovered: definitions.length,
  executed: cases.length,
  passed: cases.length - failed.length,
  failed: failed.length,
  notDiscovered: expectedCaseIds.length - definitions.length,
  notExecutedBySelection: expectedCaseIds.length - cases.length,
};

const sourcePaths = [
  'experiments/search-semantics-reference/fixtures/graph-cleanup-cases.json',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/graph-node.mjs',
  'experiments/search-semantics-reference/src/graph-cleanup.mjs',
  'experiments/search-semantics-reference/src/graph-cleanup-cases.mjs',
  'experiments/search-semantics-reference/run-graph-cleanup.mjs',
  'docs/specs/SPEC-0010-graph-storage-and-reclamation.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));

const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-graph-cleanup-evidence-key/0.2.0',
  composerEvidence: fixture.composerEvidence,
  graphProfileProjection: projection.projectionIdentity,
  graphNodeEvidence: nodeEvidence.evidenceIdentity,
  graphEdgeEvidence: edgeEvidence.evidenceIdentity,
  graphRefEvidence: refEvidence.evidenceIdentity,
  graphPathEvidence: pathEvidence.evidenceIdentity,
  graphRootEvidence: rootEvidence.evidenceIdentity,
  graphReclaimEvidence: reclaimEvidence.evidenceIdentity,
  graphAdvanceOccurrenceEvidence: advanceOccurrenceEvidence.evidenceIdentity,
  graphCleanupRequirementCoverage: coverage,
  selection: selectedCase,
  sources,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'Graph cleanup evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-graph-cleanup-reference-v0.2.0',
  scope: selectedCase === null ? 'full-graph-cleanup-reference' : 'focused-case',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: fixture.composerEvidence,
  graphProfileProjection: projection.projectionIdentity,
  graphNodeEvidence: nodeEvidence.evidenceIdentity,
  graphEdgeEvidence: edgeEvidence.evidenceIdentity,
  graphRefEvidence: refEvidence.evidenceIdentity,
  graphPathEvidence: pathEvidence.evidenceIdentity,
  graphRootEvidence: rootEvidence.evidenceIdentity,
  graphReclaimEvidence: reclaimEvidence.evidenceIdentity,
  graphAdvanceOccurrenceEvidence: advanceOccurrenceEvidence.evidenceIdentity,
  graphCleanupRequirementCoverage: coverage,
  evidenceIdentity,
  sources,
  summary,
  cases,
  claimLimits: [
    'GRAPH-CLEANUP-001..004 semantic/reference cleanup evidence only; native CUDA resource destruction and concrete teardown integration remain downstream qualification concerns.',
    'Arena release reconciliation proves only the Graph-owned semantic precondition ready-for-resource-destruction; it neither destroys resources nor prescribes Resource/CUDA-JS realization.',
    'GRAPH-CLEANUP-002 directly models publication/equality quarantine; generation alias and uncertain owner cleanup are supported by qualified REF/RECLAIM prevention/quarantine evidence, not by a native corruption detector.',
    'Retained artifact provenance proves exact active profile/package identity compatibility for this reference packet only; no persistence format, storage mechanism, or general compatibility authority is selected.',
  ],
};

const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'graph-cleanup-evidence.json' : `graph-cleanup-evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed}`);
console.log(`graph_cleanup_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

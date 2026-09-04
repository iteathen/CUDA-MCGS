import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import { registerGraphAdvanceOccurrenceCases } from './src/graph-advance-occurrence-cases.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixturePath = path.join(experimentRoot, 'fixtures', 'graph-advance-occurrence-cases.json');
const composerRoot = path.join(repositoryRoot, 'conformance', 'search-compiler');
const composerEvidencePath = path.join(composerRoot, 'build', 'evidence.json');
const graphProjectionPath = path.join(composerRoot, 'build', 'graph-profiles.json');
const rootControlPath = path.join(composerRoot, 'build', 'root-control.json');
const nodeEvidencePath = path.join(experimentRoot, 'build', 'graph-node-evidence.json');
const edgeEvidencePath = path.join(experimentRoot, 'build', 'graph-edge-evidence.json');
const refEvidencePath = path.join(experimentRoot, 'build', 'graph-ref-evidence.json');
const pathEvidencePath = path.join(experimentRoot, 'build', 'graph-path-evidence.json');
const rootEvidencePath = path.join(experimentRoot, 'build', 'graph-root-evidence.json');
const reclaimEvidencePath = path.join(experimentRoot, 'build', 'graph-reclaim-evidence.json');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Graph advance occurrence closure requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath, 'GRAPH_ADVANCE_OCCURRENCE_FIXTURE_MISSING');
const composerEvidence = await readJson(composerEvidencePath, 'GRAPH_ADVANCE_OCCURRENCE_COMPOSER_MISSING');
const graphProjection = await readJson(graphProjectionPath, 'GRAPH_ADVANCE_OCCURRENCE_PROJECTION_MISSING');
const rootControl = await readJson(rootControlPath, 'GRAPH_ADVANCE_OCCURRENCE_ROOT_CONTROL_MISSING');
const nodeEvidence = await readJson(nodeEvidencePath, 'GRAPH_ADVANCE_OCCURRENCE_NODE_MISSING');
const edgeEvidence = await readJson(edgeEvidencePath, 'GRAPH_ADVANCE_OCCURRENCE_EDGE_MISSING');
const refEvidence = await readJson(refEvidencePath, 'GRAPH_ADVANCE_OCCURRENCE_REF_MISSING');
const pathEvidence = await readJson(pathEvidencePath, 'GRAPH_ADVANCE_OCCURRENCE_PATH_MISSING');
const rootEvidence = await readJson(rootEvidencePath, 'GRAPH_ADVANCE_OCCURRENCE_ROOT_MISSING');
const reclaimEvidence = await readJson(reclaimEvidencePath, 'GRAPH_ADVANCE_OCCURRENCE_RECLAIM_MISSING');

exactKeys(fixture, [
  'composerEvidence', 'edgeEvidence', 'expectedCases', 'nodeEvidence', 'pathEvidence',
  'profileProjection', 'reclaimEvidence', 'refEvidence', 'rootControlProjection', 'rootEvidence', 'schema',
], 'GRAPH_ADVANCE_OCCURRENCE_FIXTURE_FIELDS', 'Graph advance occurrence fixture');
assert.equal(fixture.schema, 'cuda-mcgs.reference-graph-advance-occurrence-fixtures/0.1.0');
const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'GRAPH_ADVANCE_OCCURRENCE_EXPECTED_CASES', 'Graph advance occurrence expectedCases');
assert.equal(expectedCaseIds.length, 5);

assert.deepEqual(composerEvidence.representationCompositionEvidenceKey, fixture.composerEvidence);
assert.deepEqual(graphProjection.projectionIdentity, {
  algorithm: fixture.profileProjection.algorithm,
  byteLength: fixture.profileProjection.byteLength,
  sha256: fixture.profileProjection.sha256,
});
assert.deepEqual(nodeEvidence.evidenceIdentity, fixture.nodeEvidence);
assert.deepEqual(edgeEvidence.evidenceIdentity, fixture.edgeEvidence);
assert.deepEqual(refEvidence.evidenceIdentity, fixture.refEvidence);
assert.deepEqual(pathEvidence.evidenceIdentity, fixture.pathEvidence);
assert.deepEqual(rootControl.identity, fixture.rootControlProjection);
assert.deepEqual(rootEvidence.evidenceIdentity, fixture.rootEvidence);
assert.deepEqual(reclaimEvidence.evidenceIdentity, fixture.reclaimEvidence);
for (const evidence of [nodeEvidence, edgeEvidence, refEvidence, pathEvidence, rootEvidence, reclaimEvidence]) assert.equal(evidence.status, 'pass');

const definitions = [];
function defineCase(id, body) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  definitions.push({ id, body });
}

registerGraphAdvanceOccurrenceCases({
  defineCase,
  fixture,
  projection: graphProjection,
  nodeEvidence,
  edgeEvidence,
  refEvidence,
  pathEvidence,
  rootControl,
  rootEvidence,
  reclaimEvidence,
});
assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered Graph advance occurrence cases must exactly match checked-in expected bank');

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('GRAPH_ADVANCE_OCCURRENCE_CLI', 'usage: run-graph-advance-occurrence.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('GRAPH_ADVANCE_OCCURRENCE_CLI', `unknown case ${selectedCase}`);
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
const summary = {
  expected: expectedCaseIds.length,
  discovered: definitions.length,
  executed: cases.length,
  passed: cases.length - failed.length,
  failed: failed.length,
  notDiscovered: expectedCaseIds.length - definitions.length,
  notExecutedBySelection: expectedCaseIds.length - cases.length,
};
if (selectedCase === null) assert.equal(cases.length, expectedCaseIds.length);

const sourcePaths = [
  'experiments/search-semantics-reference/fixtures/graph-advance-occurrence-cases.json',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/graph-ref.mjs',
  'experiments/search-semantics-reference/src/graph-path.mjs',
  'experiments/search-semantics-reference/src/graph-root.mjs',
  'experiments/search-semantics-reference/src/graph-reclaim.mjs',
  'experiments/search-semantics-reference/src/graph-advance-occurrence-cases.mjs',
  'experiments/search-semantics-reference/run-graph-advance-occurrence.mjs',
  'docs/decisions/ADR-0022-distinguish-root-advance-reroot-and-attention.md',
  'docs/specs/SPEC-0010-graph-storage-and-reclamation.md',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));

const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-graph-advance-occurrence-evidence-key/0.2.0',
  composerEvidence: fixture.composerEvidence,
  graphProfileProjection: graphProjection.projectionIdentity,
  graphNodeEvidence: nodeEvidence.evidenceIdentity,
  graphEdgeEvidence: edgeEvidence.evidenceIdentity,
  graphRefEvidence: refEvidence.evidenceIdentity,
  graphPathEvidence: pathEvidence.evidenceIdentity,
  rootControlProjection: rootControl.identity,
  graphRootEvidence: rootEvidence.evidenceIdentity,
  graphReclaimEvidence: reclaimEvidence.evidenceIdentity,
  selection: selectedCase,
  sources,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'Graph advance occurrence closure evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-graph-advance-occurrence-closure-v0.2.0',
  scope: selectedCase === null ? 'full-graph-advance-occurrence-closure' : 'focused-case',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: fixture.composerEvidence,
  graphProfileProjection: graphProjection.projectionIdentity,
  graphNodeEvidence: nodeEvidence.evidenceIdentity,
  graphEdgeEvidence: edgeEvidence.evidenceIdentity,
  graphRefEvidence: refEvidence.evidenceIdentity,
  graphPathEvidence: pathEvidence.evidenceIdentity,
  rootControlProjection: rootControl.identity,
  graphRootEvidence: rootEvidence.evidenceIdentity,
  graphReclaimEvidence: reclaimEvidence.evidenceIdentity,
  evidenceIdentity,
  sources,
  summary,
  cases,
  claimLimits: [
    'Integration evidence for accepted ADR-0022 advance occurrence provenance composed with Graph PATH, ROOT, REF and RECLAIM semantics; it introduces no new public schema or production authority.',
    'Advance itself remains minimum-work authority change: no traversal, semantic copy/transform/reset/resize/reclassification/reclamation/eager cleanup or host progress.',
    'Sibling occurrence supersession is applied only at a later bounded checkpoint; selected descendant occurrence work and shared transposed-node identity survive until their own protections release.',
    'The private REF retirement-order intent is semantic ordering evidence only; no atomic primitive, table/queue layout, scheduler topology, CUDA implementation or native compatible-pair qualification is selected or claimed.',
  ],
};

const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'graph-advance-occurrence-evidence.json' : `graph-advance-occurrence-evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} not_discovered=${summary.notDiscovered} not_executed_by_selection=${summary.notExecutedBySelection}`);
console.log(`graph_ref_evidence_sha256=${refEvidence.evidenceIdentity.sha256} graph_path_evidence_sha256=${pathEvidence.evidenceIdentity.sha256} graph_root_evidence_sha256=${rootEvidence.evidenceIdentity.sha256} graph_reclaim_evidence_sha256=${reclaimEvidence.evidenceIdentity.sha256} graph_advance_occurrence_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

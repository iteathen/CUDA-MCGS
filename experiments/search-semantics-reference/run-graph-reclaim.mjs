import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import { registerGraphReclaimCases } from './src/graph-reclaim-cases.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixturePath = path.join(experimentRoot, 'fixtures', 'graph-reclaim-cases.json');
const composerRoot = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference');
const composerEvidencePath = path.join(composerRoot, 'build', 'evidence.json');
const graphProjectionPath = path.join(composerRoot, 'build', 'graph-profiles.json');
const rootControlPath = path.join(composerRoot, 'build', 'root-control.json');
const nodeEvidencePath = path.join(experimentRoot, 'build', 'graph-node-evidence.json');
const edgeEvidencePath = path.join(experimentRoot, 'build', 'graph-edge-evidence.json');
const refEvidencePath = path.join(experimentRoot, 'build', 'graph-ref-evidence.json');
const pathEvidencePath = path.join(experimentRoot, 'build', 'graph-path-evidence.json');
const rootEvidencePath = path.join(experimentRoot, 'build', 'graph-root-evidence.json');
const requirementCoveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');
const graphSpecPath = path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0010-graph-storage-and-reclamation.md');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Graph RECLAIM reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath);
const composerEvidence = await readJson(composerEvidencePath, 'GRAPH_RECLAIM_COMPOSER_EVIDENCE_MISSING');
const graphProjection = await readJson(graphProjectionPath, 'GRAPH_RECLAIM_PROJECTION_MISSING');
const rootControl = await readJson(rootControlPath, 'GRAPH_RECLAIM_ROOT_CONTROL_MISSING');
const nodeEvidence = await readJson(nodeEvidencePath, 'GRAPH_RECLAIM_NODE_EVIDENCE_MISSING');
const edgeEvidence = await readJson(edgeEvidencePath, 'GRAPH_RECLAIM_EDGE_EVIDENCE_MISSING');
const refEvidence = await readJson(refEvidencePath, 'GRAPH_RECLAIM_REF_EVIDENCE_MISSING');
const pathEvidence = await readJson(pathEvidencePath, 'GRAPH_RECLAIM_PATH_EVIDENCE_MISSING');
const rootEvidence = await readJson(rootEvidencePath, 'GRAPH_RECLAIM_ROOT_EVIDENCE_MISSING');
const requirementCoverage = await readJson(requirementCoveragePath);
const graphSpec = await readFile(graphSpecPath, 'utf8');

exactKeys(fixture, [
  'composerEvidence', 'edgeEvidence', 'expectedCases', 'nodeEvidence', 'pathEvidence',
  'profileProjection', 'refEvidence', 'rootControlProjection', 'rootEvidence', 'schema',
], 'GRAPH_RECLAIM_FIXTURE_FIELDS', 'Graph RECLAIM fixture');
assert.equal(fixture.schema, 'cuda-mcgs.reference-graph-reclaim-fixtures/0.1.0');
for (const [label, identity] of Object.entries({
  composerEvidence: fixture.composerEvidence,
  profileProjection: fixture.profileProjection,
  nodeEvidence: fixture.nodeEvidence,
  edgeEvidence: fixture.edgeEvidence,
  refEvidence: fixture.refEvidence,
  pathEvidence: fixture.pathEvidence,
  rootControlProjection: fixture.rootControlProjection,
  rootEvidence: fixture.rootEvidence,
})) {
  if (label === 'profileProjection') exactKeys(identity, ['algorithm', 'byteLength', 'schema', 'sha256'], 'GRAPH_RECLAIM_FIXTURE_IDENTITY', label);
  else exactKeys(identity, ['algorithm', 'byteLength', 'sha256'], 'GRAPH_RECLAIM_FIXTURE_IDENTITY', label);
}
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
for (const evidence of [nodeEvidence, edgeEvidence, refEvidence, pathEvidence, rootEvidence]) assert.equal(evidence.status, 'pass');

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'GRAPH_RECLAIM_EXPECTED_CASES', 'Graph RECLAIM expectedCases');
if (expectedCaseIds.length === 0 || expectedCaseIds.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(id))) fail('GRAPH_RECLAIM_EXPECTED_CASES', 'expectedCases contains an invalid case id');

const classification = requirementCoverage.classifications.find((entry) =>
  entry.contract === 'SPEC-0010'
  && entry.requirementPrefix === 'GRAPH-RECLAIM-'
  && entry.primaryDisposition === 'engine-reference-oracle'
  && entry.plannedEvidenceOwner === 'ENGINE-REFERENCE-01'
  && entry.supportingDispositions.includes('semantic-normalizer')
  && entry.supportingDispositions.includes('native-compatible-pair-qualification'));
assert(classification, 'GRAPH-RECLAIM- requirement classification is missing');
assert.equal(classification.requirementCount, 9);
const graphReclaimRequirementIds = assertUniqueStrings(
  [...graphSpec.matchAll(/^(GRAPH-RECLAIM-\d{3})\./gm)].map((match) => match[1]),
  'GRAPH_RECLAIM_REQUIREMENT_SOURCE',
  'direct Graph RECLAIM requirements',
);
assert.equal(graphReclaimRequirementIds.length, classification.requirementCount);

const definitions = [];
function defineCase(id, body, requirements = []) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  const uniqueRequirements = assertUniqueStrings(requirements, 'GRAPH_RECLAIM_CASE_REQUIREMENTS', `${id} requirements`);
  definitions.push({ id, body, requirements: uniqueRequirements });
}

function plannedGraphReclaimCoverage() {
  const direct = new Set(graphReclaimRequirementIds);
  const casesByRequirement = Object.fromEntries(graphReclaimRequirementIds.map((id) => [id, []]));
  for (const definition of definitions) {
    for (const requirement of definition.requirements) {
      if (!direct.has(requirement)) fail('GRAPH_RECLAIM_REQUIREMENT_SCOPE', `${definition.id} maps non-owned requirement ${requirement}`);
      casesByRequirement[requirement].push(definition.id);
    }
  }
  const uncovered = graphReclaimRequirementIds.filter((id) => casesByRequirement[id].length === 0);
  if (uncovered.length !== 0) fail('GRAPH_RECLAIM_REQUIREMENT_COVERAGE', `direct Graph RECLAIM requirements lack cases: ${uncovered.join(', ')}`);
  return {
    requirementCount: graphReclaimRequirementIds.length,
    requirements: graphReclaimRequirementIds.map((id) => ({ id, cases: casesByRequirement[id] })),
  };
}

registerGraphReclaimCases({
  defineCase,
  fixture,
  projection: graphProjection,
  nodeEvidence,
  edgeEvidence,
  refEvidence,
  pathEvidence,
  rootControl,
  rootEvidence,
  plannedCoverage: plannedGraphReclaimCoverage,
});

assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered Graph RECLAIM cases must exactly match checked-in expected case bank');

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('GRAPH_RECLAIM_CLI', 'usage: run-graph-reclaim.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('GRAPH_RECLAIM_CLI', `unknown case ${selectedCase}`);
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
const plannedCoverage = plannedGraphReclaimCoverage();
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
  'experiments/search-semantics-reference/fixtures/graph-reclaim-cases.json',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/graph-ref.mjs',
  'experiments/search-semantics-reference/src/graph-root.mjs',
  'experiments/search-semantics-reference/src/graph-reclaim.mjs',
  'experiments/search-semantics-reference/src/graph-reclaim-cases.mjs',
  'experiments/search-semantics-reference/run-graph-reclaim.mjs',
  'experiments/search-ir-composer-reference/src/graph.mjs',
  'experiments/search-ir-composer-reference/src/graph-fixtures.mjs',
  'scripts/run-graph-node-reference.mjs',
  'scripts/run-graph-edge-reference.mjs',
  'scripts/run-graph-ref-reference.mjs',
  'scripts/run-graph-path-reference.mjs',
  'scripts/run-graph-root-reference.mjs',
  'scripts/run-graph-reclaim-reference.mjs',
  'docs/specs/SPEC-0010-graph-storage-and-reclamation.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));
const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-graph-reclaim-evidence-key/0.2.0',
  composerEvidence: fixture.composerEvidence,
  graphProfileProjection: graphProjection.projectionIdentity,
  graphNodeEvidence: nodeEvidence.evidenceIdentity,
  graphEdgeEvidence: edgeEvidence.evidenceIdentity,
  graphRefEvidence: refEvidence.evidenceIdentity,
  graphPathEvidence: pathEvidence.evidenceIdentity,
  rootControlProjection: rootControl.identity,
  graphRootEvidence: rootEvidence.evidenceIdentity,
  graphReclaimRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  selection: selectedCase,
  sources,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'Graph RECLAIM reference evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-graph-reclaim-reference-v0.2.0',
  scope: selectedCase === null ? 'full-graph-reclaim-reference' : 'focused-case',
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
  graphReclaimRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  evidenceIdentity,
  sources,
  summary,
  cases,
  claimLimits: [
    'GRAPH-RECLAIM-001 through GRAPH-RECLAIM-009 semantic/reference behavior only: optional reclamation, retirement admission, protection/quiescence, transposition non-returnability, owner cleanup ordering, generation-safe reuse, bounded resumable progress and cancellation/failure state integrity.',
    'The reference oracle models declared lifecycle facts and finite work/scratch bounds; it does not select a retirement queue, traversal algorithm, table layout, scheduler topology, atomic primitive, warp/block topology or native CUDA mechanism.',
    'Current-root/epoch/advance/reroot/attention authority remains Session/semantic-owner responsibility; Resource and Progress owners retain global admission/fairness/scheduling authority.',
    'No CUDA-JS execution, native compatible-pair qualification, ABA/publication primitive qualification, performance, occupancy, multi-GPU, stable SDK, support or release claim.',
  ],
};

const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'graph-reclaim-evidence.json' : `graph-reclaim-evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} not_discovered=${summary.notDiscovered} not_executed_by_selection=${summary.notExecutedBySelection}`);
console.log(`composer_evidence_sha256=${fixture.composerEvidence.sha256} graph_projection_sha256=${graphProjection.projectionIdentity.sha256} graph_node_evidence_sha256=${nodeEvidence.evidenceIdentity.sha256} graph_edge_evidence_sha256=${edgeEvidence.evidenceIdentity.sha256} graph_ref_evidence_sha256=${refEvidence.evidenceIdentity.sha256} graph_path_evidence_sha256=${pathEvidence.evidenceIdentity.sha256} root_control_sha256=${rootControl.identity.sha256} graph_root_evidence_sha256=${rootEvidence.evidenceIdentity.sha256} graph_reclaim_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

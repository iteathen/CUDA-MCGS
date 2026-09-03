import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import { registerGraphRootCases } from './src/graph-root-cases.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixturePath = path.join(experimentRoot, 'fixtures', 'graph-root-cases.json');
const composerRoot = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference');
const composerEvidencePath = path.join(composerRoot, 'build', 'evidence.json');
const graphProjectionPath = path.join(composerRoot, 'build', 'graph-profiles.json');
const rootControlPath = path.join(composerRoot, 'build', 'root-control.json');
const nodeEvidencePath = path.join(experimentRoot, 'build', 'graph-node-evidence.json');
const refEvidencePath = path.join(experimentRoot, 'build', 'graph-ref-evidence.json');
const pathEvidencePath = path.join(experimentRoot, 'build', 'graph-path-evidence.json');
const requirementCoveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');
const graphSpecPath = path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0010-graph-storage-and-reclamation.md');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Graph ROOT reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath);
const composerEvidence = await readJson(composerEvidencePath, 'GRAPH_ROOT_COMPOSER_EVIDENCE_MISSING');
const graphProjection = await readJson(graphProjectionPath, 'GRAPH_ROOT_PROJECTION_MISSING');
const rootControl = await readJson(rootControlPath, 'GRAPH_ROOT_CONTROL_MISSING');
const nodeEvidence = await readJson(nodeEvidencePath, 'GRAPH_ROOT_NODE_EVIDENCE_MISSING');
const refEvidence = await readJson(refEvidencePath, 'GRAPH_ROOT_REF_EVIDENCE_MISSING');
const pathEvidence = await readJson(pathEvidencePath, 'GRAPH_ROOT_PATH_EVIDENCE_MISSING');
const requirementCoverage = await readJson(requirementCoveragePath);
const graphSpec = await readFile(graphSpecPath, 'utf8');

exactKeys(fixture, ['composerEvidence', 'expectedCases', 'nodeEvidence', 'pathEvidence', 'profileProjection', 'refEvidence', 'rootControlProjection', 'schema'], 'GRAPH_ROOT_FIXTURE_FIELDS', 'Graph ROOT fixture');
assert.equal(fixture.schema, 'cuda-mcgs.reference-graph-root-fixtures/0.1.0');
for (const [label, identity] of Object.entries({
  composerEvidence: fixture.composerEvidence,
  profileProjection: fixture.profileProjection,
  nodeEvidence: fixture.nodeEvidence,
  refEvidence: fixture.refEvidence,
  pathEvidence: fixture.pathEvidence,
  rootControlProjection: fixture.rootControlProjection,
})) {
  if (label === 'profileProjection') exactKeys(identity, ['algorithm', 'byteLength', 'schema', 'sha256'], 'GRAPH_ROOT_FIXTURE_IDENTITY', label);
  else exactKeys(identity, ['algorithm', 'byteLength', 'sha256'], 'GRAPH_ROOT_FIXTURE_IDENTITY', label);
}
assert.deepEqual(composerEvidence.representationCompositionEvidenceKey, fixture.composerEvidence);
assert.deepEqual(graphProjection.projectionIdentity, {
  algorithm: fixture.profileProjection.algorithm,
  byteLength: fixture.profileProjection.byteLength,
  sha256: fixture.profileProjection.sha256,
});
assert.deepEqual(nodeEvidence.evidenceIdentity, fixture.nodeEvidence);
assert.deepEqual(refEvidence.evidenceIdentity, fixture.refEvidence);
assert.deepEqual(pathEvidence.evidenceIdentity, fixture.pathEvidence);
assert.deepEqual(rootControl.identity, fixture.rootControlProjection);
assert.equal(nodeEvidence.status, 'pass');
assert.equal(refEvidence.status, 'pass');
assert.equal(pathEvidence.status, 'pass');

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'GRAPH_ROOT_EXPECTED_CASES', 'Graph ROOT expectedCases');
if (expectedCaseIds.length === 0 || expectedCaseIds.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(id))) fail('GRAPH_ROOT_EXPECTED_CASES', 'expectedCases contains an invalid case id');

const classification = requirementCoverage.classifications.find((entry) =>
  entry.contract === 'SPEC-0010'
  && entry.requirementPrefix === 'GRAPH-ROOT-'
  && entry.primaryDisposition === 'engine-reference-oracle'
  && entry.evidenceOwner === 'ENGINE-REFERENCE-01'
  && entry.supportingDispositions.includes('semantic-normalizer')
  && entry.supportingDispositions.includes('cross-specification-proof'));
assert(classification, 'GRAPH-ROOT- requirement classification is missing');
assert.equal(classification.requirementCount, 6);
const graphRootRequirementIds = assertUniqueStrings(
  [...graphSpec.matchAll(/^(GRAPH-ROOT-\d{3})\./gm)].map((match) => match[1]),
  'GRAPH_ROOT_REQUIREMENT_SOURCE',
  'direct Graph ROOT requirements',
);
assert.equal(graphRootRequirementIds.length, classification.requirementCount);

const definitions = [];
function defineCase(id, body, requirements = []) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  const uniqueRequirements = assertUniqueStrings(requirements, 'GRAPH_ROOT_CASE_REQUIREMENTS', `${id} requirements`);
  definitions.push({ id, body, requirements: uniqueRequirements });
}

function plannedGraphRootCoverage() {
  const direct = new Set(graphRootRequirementIds);
  const casesByRequirement = Object.fromEntries(graphRootRequirementIds.map((id) => [id, []]));
  for (const definition of definitions) {
    for (const requirement of definition.requirements) {
      if (!direct.has(requirement)) fail('GRAPH_ROOT_REQUIREMENT_SCOPE', `${definition.id} maps non-owned requirement ${requirement}`);
      casesByRequirement[requirement].push(definition.id);
    }
  }
  const uncovered = graphRootRequirementIds.filter((id) => casesByRequirement[id].length === 0);
  if (uncovered.length !== 0) fail('GRAPH_ROOT_REQUIREMENT_COVERAGE', `direct Graph ROOT requirements lack cases: ${uncovered.join(', ')}`);
  return {
    requirementCount: graphRootRequirementIds.length,
    requirements: graphRootRequirementIds.map((id) => ({ id, cases: casesByRequirement[id] })),
  };
}

registerGraphRootCases({
  defineCase,
  fixture,
  projection: graphProjection,
  nodeEvidence,
  refEvidence,
  pathEvidence,
  rootControl,
  plannedCoverage: plannedGraphRootCoverage,
});

assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered Graph ROOT cases must exactly match checked-in expected case bank');

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('GRAPH_ROOT_CLI', 'usage: run-graph-root.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('GRAPH_ROOT_CLI', `unknown case ${selectedCase}`);
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
const plannedCoverage = plannedGraphRootCoverage();
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
  'experiments/search-semantics-reference/fixtures/graph-root-cases.json',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/graph-ref.mjs',
  'experiments/search-semantics-reference/src/graph-path.mjs',
  'experiments/search-semantics-reference/src/graph-root.mjs',
  'experiments/search-semantics-reference/src/graph-root-cases.mjs',
  'experiments/search-semantics-reference/run-graph-root.mjs',
  'experiments/search-ir-composer-reference/src/session.mjs',
  'experiments/search-ir-composer-reference/src/graph.mjs',
  'experiments/search-ir-composer-reference/src/graph-fixtures.mjs',
  'experiments/search-ir-composer-reference/run.mjs',
  'scripts/run-graph-node-reference.mjs',
  'scripts/run-graph-ref-reference.mjs',
  'scripts/run-graph-path-reference.mjs',
  'scripts/run-graph-root-reference.mjs',
  'docs/specs/SPEC-0010-graph-storage-and-reclamation.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));
const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-graph-root-evidence-key/0.2.0',
  composerEvidence: fixture.composerEvidence,
  graphProfileProjection: graphProjection.projectionIdentity,
  graphNodeEvidence: nodeEvidence.evidenceIdentity,
  graphRefEvidence: refEvidence.evidenceIdentity,
  graphPathEvidence: pathEvidence.evidenceIdentity,
  rootControlProjection: rootControl.identity,
  graphRootRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  selection: selectedCase,
  sources,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'Graph ROOT reference evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-graph-root-reference-v0.2.0',
  scope: selectedCase === null ? 'full-graph-root-reference' : 'focused-case',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: fixture.composerEvidence,
  graphProfileProjection: graphProjection.projectionIdentity,
  graphNodeEvidence: nodeEvidence.evidenceIdentity,
  graphRefEvidence: refEvidence.evidenceIdentity,
  graphPathEvidence: pathEvidence.evidenceIdentity,
  rootControlProjection: rootControl,
  graphRootRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  evidenceIdentity,
  sources,
  summary,
  cases,
  claimLimits: [
    'Graph-owned protected root-anchor storage, REF-mediated protection/generation, replacement admission behavior, opaque reroot-owner disposition and GRAPH-ROOT-001 through GRAPH-ROOT-006 only.',
    'Current-root selection, root epoch, root/advance/reroot/attention operation authority and retained-state classification remain Session/owner semantics consumed through the exact generated Composer root-control projection.',
    'Advance evidence proves no Graph ROOT reclamation/eager cleanup/reclassification and preserves still-valid old-work/shared-transposed-node protection; it does not perform or qualify reclamation.',
    'No GRAPH-RECLAIM behavior, production storage mechanism, CUDA-JS execution, native CUDA, performance, public SDK, contract acceptance or multi-GPU support claim.',
  ],
};

const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'graph-root-evidence.json' : `graph-root-evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} not_discovered=${summary.notDiscovered} not_executed_by_selection=${summary.notExecutedBySelection}`);
console.log(`composer_evidence_sha256=${fixture.composerEvidence.sha256} graph_projection_sha256=${graphProjection.projectionIdentity.sha256} graph_node_evidence_sha256=${nodeEvidence.evidenceIdentity.sha256} graph_ref_evidence_sha256=${refEvidence.evidenceIdentity.sha256} graph_path_evidence_sha256=${pathEvidence.evidenceIdentity.sha256} root_control_sha256=${rootControl.identity.sha256} graph_root_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

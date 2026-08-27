import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import { registerGraphRefCases } from './src/graph-ref-cases.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixturePath = path.join(experimentRoot, 'fixtures', 'graph-ref-cases.json');
const composerEvidencePath = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference', 'build', 'evidence.json');
const graphProjectionPath = path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference', 'build', 'graph-profiles.json');
const nodeEvidencePath = path.join(experimentRoot, 'build', 'graph-node-evidence.json');
const requirementCoveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');
const graphSpecPath = path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0010-graph-storage-and-reclamation.md');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Graph REF reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required`);
    throw error;
  }
}

const fixture = await readJson(fixturePath);
const composerEvidence = await readJson(composerEvidencePath, 'GRAPH_REF_COMPOSER_EVIDENCE_MISSING');
const graphProjection = await readJson(graphProjectionPath, 'GRAPH_REF_PROJECTION_MISSING');
const nodeEvidence = await readJson(nodeEvidencePath, 'GRAPH_REF_NODE_EVIDENCE_MISSING');
const requirementCoverage = await readJson(requirementCoveragePath);
const graphSpec = await readFile(graphSpecPath, 'utf8');

exactKeys(fixture, ['composerEvidence', 'expectedCases', 'nodeEvidence', 'profileProjection', 'schema'], 'GRAPH_REF_FIXTURE_FIELDS', 'Graph REF fixture');
assert.equal(fixture.schema, 'cuda-mcgs.reference-graph-ref-fixtures/0.1.0');
exactKeys(fixture.composerEvidence, ['algorithm', 'byteLength', 'sha256'], 'GRAPH_REF_FIXTURE_EVIDENCE', 'Graph REF Composer evidence');
exactKeys(fixture.profileProjection, ['algorithm', 'byteLength', 'schema', 'sha256'], 'GRAPH_REF_FIXTURE_PROJECTION', 'Graph REF profile projection');
exactKeys(fixture.nodeEvidence, ['algorithm', 'byteLength', 'sha256'], 'GRAPH_REF_FIXTURE_NODE', 'Graph REF NODE evidence');
assert.deepEqual(composerEvidence.representationCompositionEvidenceKey, fixture.composerEvidence);
assert.deepEqual(graphProjection.projectionIdentity, {
  algorithm: fixture.profileProjection.algorithm,
  byteLength: fixture.profileProjection.byteLength,
  sha256: fixture.profileProjection.sha256,
});
assert.deepEqual(nodeEvidence.evidenceIdentity, fixture.nodeEvidence);
assert.equal(nodeEvidence.status, 'pass');
assert.equal(nodeEvidence.summary.passed, 13);

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'GRAPH_REF_EXPECTED_CASES', 'Graph REF expectedCases');
if (expectedCaseIds.length === 0 || expectedCaseIds.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(id))) fail('GRAPH_REF_EXPECTED_CASES', 'expectedCases contains an invalid case id');

const classification = requirementCoverage.classifications.find((entry) =>
  entry.contract === 'SPEC-0010'
  && entry.requirementPrefix === 'GRAPH-REF-'
  && entry.primaryDisposition === 'semantic-normalizer'
  && entry.plannedEvidenceOwner === 'IR-GRAPH-01'
  && entry.supportingDispositions.includes('engine-reference-oracle'));
assert(classification, 'GRAPH-REF- requirement classification is missing');
assert.equal(classification.requirementCount, 8);
const graphRefRequirementIds = assertUniqueStrings(
  [...graphSpec.matchAll(/^(GRAPH-REF-\d{3})\./gm)].map((match) => match[1]),
  'GRAPH_REF_REQUIREMENT_SOURCE',
  'direct Graph REF requirements',
);
assert.equal(graphRefRequirementIds.length, classification.requirementCount);

const definitions = [];
function defineCase(id, body, requirements = []) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  const uniqueRequirements = assertUniqueStrings(requirements, 'GRAPH_REF_CASE_REQUIREMENTS', `${id} requirements`);
  definitions.push({ id, body, requirements: uniqueRequirements });
}

function plannedGraphRefCoverage() {
  const direct = new Set(graphRefRequirementIds);
  const casesByRequirement = Object.fromEntries(graphRefRequirementIds.map((id) => [id, []]));
  for (const definition of definitions) {
    for (const requirement of definition.requirements) {
      if (!direct.has(requirement)) fail('GRAPH_REF_REQUIREMENT_SCOPE', `${definition.id} maps non-owned requirement ${requirement}`);
      casesByRequirement[requirement].push(definition.id);
    }
  }
  const uncovered = graphRefRequirementIds.filter((id) => casesByRequirement[id].length === 0);
  if (uncovered.length !== 0) fail('GRAPH_REF_REQUIREMENT_COVERAGE', `direct Graph REF requirements lack cases: ${uncovered.join(', ')}`);
  return {
    requirementCount: graphRefRequirementIds.length,
    requirements: graphRefRequirementIds.map((id) => ({ id, cases: casesByRequirement[id] })),
  };
}

registerGraphRefCases({
  defineCase,
  fixture,
  projection: graphProjection,
  nodeEvidence,
  composerEvidence,
  plannedCoverage: plannedGraphRefCoverage,
});

assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered Graph REF cases must exactly match checked-in expected case bank');

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('GRAPH_REF_CLI', 'usage: run-graph-ref.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('GRAPH_REF_CLI', `unknown case ${selectedCase}`);
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
const plannedCoverage = plannedGraphRefCoverage();
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
  'experiments/search-semantics-reference/fixtures/graph-ref-cases.json',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/graph-node.mjs',
  'experiments/search-semantics-reference/src/graph-ref.mjs',
  'experiments/search-semantics-reference/src/graph-ref-cases.mjs',
  'experiments/search-semantics-reference/run-graph-ref.mjs',
  'experiments/search-ir-composer-reference/export-graph-profiles.mjs',
  'scripts/export-search-ir-composer-graph-profiles.mjs',
  'scripts/run-graph-node-reference.mjs',
  'scripts/run-graph-ref-reference.mjs',
  'docs/specs/SPEC-0010-graph-storage-and-reclamation.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));
const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-graph-ref-evidence-key/0.2.0',
  composerEvidence: fixture.composerEvidence,
  graphProfileProjection: graphProjection.projectionIdentity,
  graphNodeEvidence: nodeEvidence.evidenceIdentity,
  graphRefRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  selection: selectedCase,
  sources,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'Graph REF reference evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-graph-ref-reference-v0.2.0',
  scope: selectedCase === null ? 'full-graph-ref-reference' : 'focused-case',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: fixture.composerEvidence,
  graphProfileProjection: graphProjection.projectionIdentity,
  graphNodeEvidence: nodeEvidence.evidenceIdentity,
  graphRefRequirementCoverage: {
    planned: plannedCoverage,
    executedRequirementCount: executedRequirements.length,
    executed: executedRequirements,
  },
  evidenceIdentity,
  sources,
  summary,
  cases,
  claimLimits: [
    'Graph-owned typed reference validation, generation/incarnation non-aliasing, opaque owner-reference lifecycle handoff, and protection-versus-retirement ordering for GRAPH-REF-001 through GRAPH-REF-008 only.',
    'The slot-state resolver supplies public reference metadata only; this capsule does not inspect node payload, Domain bytes, owner-private record layout or foreign owner state.',
    'Retirement barrier evidence proves only the protection ordering point; no reachability, root authority, path traversal, quiescence decision, reclamation eligibility or slot reuse algorithm is claimed.',
    'No production storage mechanism, CUDA-JS execution, native CUDA, performance, public SDK, contract acceptance or multi-GPU support claim.',
  ],
};

const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'graph-ref-evidence.json' : `graph-ref-evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} not_discovered=${summary.notDiscovered} not_executed_by_selection=${summary.notExecutedBySelection}`);
console.log(`composer_evidence_sha256=${fixture.composerEvidence.sha256} graph_projection_sha256=${graphProjection.projectionIdentity.sha256} graph_node_evidence_sha256=${nodeEvidence.evidenceIdentity.sha256} graph_ref_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

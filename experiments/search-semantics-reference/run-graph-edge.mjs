import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import { registerGraphEdgeCases } from './src/graph-edge-cases.mjs';
import { registerGraphEdgeLifecycleCases } from './src/graph-edge-lifecycle-cases.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const here = path.join(root, 'experiments', 'search-semantics-reference');
const readJson = async (file, code) => {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT' && code) fail(code, `${file} is required`); throw error; }
};

assert(Number(process.versions.node.split('.')[0]) >= 26);
const fixture = await readJson(path.join(here, 'fixtures', 'graph-edge-cases.json'));
const composer = await readJson(path.join(root, 'experiments', 'search-ir-composer-reference', 'build', 'evidence.json'), 'GRAPH_EDGE_COMPOSER_EVIDENCE_MISSING');
const projection = await readJson(path.join(root, 'experiments', 'search-ir-composer-reference', 'build', 'graph-profiles.json'), 'GRAPH_EDGE_PROJECTION_MISSING');
const nodeEvidence = await readJson(path.join(here, 'build', 'graph-node-evidence.json'), 'GRAPH_EDGE_NODE_EVIDENCE_MISSING');
const coverage = await readJson(path.join(root, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json'));
const spec = await readFile(path.join(root, 'docs', 'specs', 'SPEC-0010-graph-storage-and-reclamation.md'), 'utf8');

exactKeys(fixture, ['composerEvidence', 'expectedCases', 'nodeEvidence', 'profileProjection', 'schema'], 'GRAPH_EDGE_FIXTURE_FIELDS', 'Graph EDGE fixture');
assert.equal(fixture.schema, 'cuda-mcgs.reference-graph-edge-fixtures/0.1.0');
assert.deepEqual(composer.representationCompositionEvidenceKey, fixture.composerEvidence);
assert.deepEqual(projection.projectionIdentity, { algorithm: fixture.profileProjection.algorithm, byteLength: fixture.profileProjection.byteLength, sha256: fixture.profileProjection.sha256 });
assert.equal(nodeEvidence.status, 'pass');
assert.deepEqual(nodeEvidence.evidenceIdentity, fixture.nodeEvidence);
assert.deepEqual(nodeEvidence.summary, { expected: 13, discovered: 13, executed: 13, passed: 13, failed: 0, requiredSkipped: 0, conditionalSkipped: 0, optionalSkipped: 0, notDiscovered: 0, notExecutedBySelection: 0 });
assert.equal(nodeEvidence.graphNodeRequirementCoverage.executedRequirementCount, 11);

const expectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'GRAPH_EDGE_EXPECTED_CASES', 'Graph EDGE expectedCases');
const classification = coverage.classifications.find((entry) => entry.contract === 'SPEC-0010' && entry.requirementPrefix === 'GRAPH-EDGE-' && entry.primaryDisposition === 'engine-reference-oracle' && entry.plannedEvidenceOwner === 'ENGINE-REFERENCE-01');
assert(classification);
assert.equal(classification.requirementCount, 10);
const requirementIds = assertUniqueStrings([...spec.matchAll(/^(GRAPH-EDGE-\d{3})\./gm)].map((match) => match[1]), 'GRAPH_EDGE_REQUIREMENT_SOURCE', 'Graph EDGE requirements');
assert.equal(requirementIds.length, 10);

const definitions = [];
function defineCase(id, body, requirements = []) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  definitions.push({ id, body, requirements: assertUniqueStrings(requirements, 'GRAPH_EDGE_CASE_REQUIREMENTS', `${id} requirements`) });
}
function plannedCoverage() {
  const direct = new Set(requirementIds);
  const byRequirement = Object.fromEntries(requirementIds.map((id) => [id, []]));
  for (const definition of definitions) for (const id of definition.requirements) {
    if (!direct.has(id)) fail('GRAPH_EDGE_REQUIREMENT_SCOPE', `${definition.id} maps non-owned requirement ${id}`);
    byRequirement[id].push(definition.id);
  }
  const missing = requirementIds.filter((id) => byRequirement[id].length === 0);
  if (missing.length) fail('GRAPH_EDGE_REQUIREMENT_COVERAGE', `missing cases: ${missing.join(', ')}`);
  return { requirementCount: requirementIds.length, requirements: requirementIds.map((id) => ({ id, cases: byRequirement[id] })) };
}

registerGraphEdgeCases({ defineCase, fixture, projection, composerEvidence: composer, plannedCoverage });
registerGraphEdgeLifecycleCases({ defineCase, projection });
assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds);

const args = process.argv.slice(2);
const selected = args.length === 0 ? null : (args.length === 2 && args[0] === '--case' ? args[1] : fail('GRAPH_EDGE_CLI', 'usage: run-graph-edge.mjs [--case case-id]'));
if (selected !== null && !definitions.some(({ id }) => id === selected)) fail('GRAPH_EDGE_CLI', `unknown case ${selected}`);
const cases = [];
for (const definition of definitions) {
  if (selected !== null && definition.id !== selected) continue;
  try {
    const detail = await definition.body();
    cases.push({ id: definition.id, status: 'pass', detail: detail ?? null });
    console.log(`case=${definition.id} result=pass`);
  } catch (error) {
    cases.push({ id: definition.id, status: 'fail', error: { code: error.code ?? null, message: error.message } });
    console.error(`case=${definition.id} result=fail error=${JSON.stringify(error.message)}`);
  }
}
const failed = cases.filter(({ status }) => status === 'fail');
const plan = plannedCoverage();
const executedIds = new Set(cases.map(({ id }) => id));
const executed = plan.requirements.map(({ id, cases: mapped }) => ({ id, cases: mapped.filter((caseId) => executedIds.has(caseId)) })).filter(({ cases: mapped }) => mapped.length);
const summary = { expected: expectedCaseIds.length, discovered: definitions.length, executed: cases.length, passed: cases.length - failed.length, failed: failed.length, requiredSkipped: 0, conditionalSkipped: 0, optionalSkipped: 0, notDiscovered: expectedCaseIds.length - definitions.length, notExecutedBySelection: expectedCaseIds.length - cases.length };

const sourcePaths = [
  'experiments/search-semantics-reference/fixtures/graph-edge-cases.json',
  'experiments/search-semantics-reference/src/graph-node.mjs',
  'experiments/search-semantics-reference/src/graph-edge-core.mjs',
  'experiments/search-semantics-reference/src/graph-edge.mjs',
  'experiments/search-semantics-reference/src/graph-edge-cases.mjs',
  'experiments/search-semantics-reference/src/graph-edge-lifecycle-cases.mjs',
  'experiments/search-semantics-reference/run-graph-edge.mjs',
  'scripts/run-graph-edge-reference.mjs',
  'docs/specs/SPEC-0010-graph-storage-and-reclamation.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json'
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(root, relative)));
const subject = { schema: 'cuda-mcgs.search-semantics-graph-edge-evidence-key/0.2.0', composerEvidence: fixture.composerEvidence, graphProfileProjection: projection.projectionIdentity, graphNodeEvidence: nodeEvidence.evidenceIdentity, graphEdgeRequirementCoverage: { planned: plan, executedRequirementCount: executed.length, executed }, selection: selected, sources, summary, cases };
const evidenceIdentity = canonicalIdentity(subject, 'Graph EDGE reference evidence');
const evidence = { schemaVersion: 1, capsule: 'cuda-mcgs-graph-edge-reference-v0.2.0', scope: selected === null ? 'full-graph-edge-reference' : 'focused-case', status: failed.length === 0 ? 'pass' : 'fail', composerEvidence: fixture.composerEvidence, graphProfileProjection: projection.projectionIdentity, graphNodeEvidence: nodeEvidence.evidenceIdentity, graphEdgeRequirementCoverage: subject.graphEdgeRequirementCoverage, evidenceIdentity, sources, summary, cases, claimLimits: ['GRAPH-EDGE-001 through GRAPH-EDGE-010 only.', 'NODE is consumed through typed-reference/child-resolution callbacks; action equality and multiplicity are injected.', 'No path, root, reclamation, production, native CUDA, performance or product claim.'] };
await mkdir(path.join(here, 'build'), { recursive: true });
await writeFile(path.join(here, selected === null ? 'build/graph-edge-evidence.json' : `build/graph-edge-evidence.${selected}.json`), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`capsule=${evidence.capsule} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed}`);
console.log(`graph_edge_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length) process.exit(1);

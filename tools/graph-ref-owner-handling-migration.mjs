import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { inspectCatalog, sourceTextSha256 } from '../experiments/search-ir-composer-reference/src/catalog.mjs';
import { normalizeDomainProfile } from '../experiments/search-ir-composer-reference/src/domain.mjs';
import { buildDomainProfiles } from '../experiments/search-ir-composer-reference/src/domain-fixtures.mjs';
import { normalizeGraphProfile } from '../experiments/search-ir-composer-reference/src/graph.mjs';
import { buildGraphProfiles } from '../experiments/search-ir-composer-reference/src/graph-fixtures.mjs';
import { normalizeEvaluatorProfile } from '../experiments/search-ir-composer-reference/src/evaluator.mjs';
import { buildEvaluatorProfiles } from '../experiments/search-ir-composer-reference/src/evaluator-fixtures.mjs';
import { normalizePolicyProfile } from '../experiments/search-ir-composer-reference/src/policy.mjs';
import { buildPolicyProfiles } from '../experiments/search-ir-composer-reference/src/policy-fixtures.mjs';
import { normalizeResourceProfile } from '../experiments/search-ir-composer-reference/src/resource.mjs';
import { buildResourceProfiles } from '../experiments/search-ir-composer-reference/src/resource-fixtures.mjs';
import { normalizeProgressProfile } from '../experiments/search-ir-composer-reference/src/progress.mjs';
import { buildProgressProfiles } from '../experiments/search-ir-composer-reference/src/progress-fixtures.mjs';
import { normalizeOutputProfile } from '../experiments/search-ir-composer-reference/src/output.mjs';
import { buildOutputProfiles } from '../experiments/search-ir-composer-reference/src/output-fixtures.mjs';

const root = process.cwd();
const composerRoot = path.join(root, 'experiments', 'search-ir-composer-reference');
const semanticsRoot = path.join(root, 'experiments', 'search-semantics-reference');
const schemaRoot = path.join(root, 'schemas', 'search-ir', '0.2.0');

function replaceOnce(file, before, after) {
  const input = fs.readFileSync(file, 'utf8');
  const first = input.indexOf(before);
  if (first < 0 || input.indexOf(before, first + 1) >= 0) throw new Error(`${file}: expected exactly one replacement target`);
  fs.writeFileSync(file, input.slice(0, first) + after + input.slice(first + before.length));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: 'inherit' });
}

const schemaPath = path.join(schemaRoot, 'graph-profile.schema.json');
replaceOnce(
  schemaPath,
  '"required": ["id", "semanticRole", "objectKind", "ownerContract", "ownerProfile", "layout", "lifecycle", "offsetBytes", "sizeBytes", "alignmentBytes", "permissions", "persistence"]',
  '"required": ["id", "semanticRole", "objectKind", "ownerContract", "ownerProfile", "layout", "lifecycle", "referenceHandling", "offsetBytes", "sizeBytes", "alignmentBytes", "permissions", "persistence"]',
);
replaceOnce(
  schemaPath,
  '        "lifecycle": { "$ref": "primitives.schema.json#/$defs/schemaReference" },\n        "offsetBytes":',
  '        "lifecycle": { "$ref": "primitives.schema.json#/$defs/schemaReference" },\n        "referenceHandling": {\n          "oneOf": [\n            { "type": "object", "additionalProperties": false, "required": ["kind"], "properties": { "kind": { "const": "none" } } },\n            {\n              "type": "object",\n              "additionalProperties": false,\n              "required": ["kind", "actions"],\n              "properties": {\n                "kind": { "const": "owner-lifecycle" },\n                "actions": { "type": "array", "minItems": 1, "uniqueItems": true, "items": { "enum": ["validate", "fixup", "release"] } }\n              }\n            }\n          ]\n        },\n        "offsetBytes":',
);

const graphPath = path.join(composerRoot, 'src', 'graph.mjs');
replaceOnce(
  graphPath,
  'function normalizeOwnerRegion(input, index, objectById, catalogById) {\n  exactKeys(input, [\'id\', \'semanticRole\', \'objectKind\', \'ownerContract\', \'ownerProfile\', \'layout\', \'lifecycle\', \'offsetBytes\', \'sizeBytes\', \'alignmentBytes\', \'permissions\', \'persistence\'], \'GRAPH_OWNER_REGION_FIELDS\', `ownerRegion ${index}`);',
  `function normalizeReferenceHandling(input, label) {\n  if (input?.kind === 'none') {\n    exactKeys(input, ['kind'], 'GRAPH_OWNER_REFERENCE_FIELDS', label);\n    return { kind: 'none' };\n  }\n  exactKeys(input, ['kind', 'actions'], 'GRAPH_OWNER_REFERENCE_FIELDS', label);\n  if (input.kind !== 'owner-lifecycle') fail('GRAPH_OWNER_REFERENCE_KIND', \`${'${label}'} kind is invalid\`);\n  return {\n    kind: input.kind,\n    actions: stringSet(input.actions, { code: 'GRAPH_OWNER_REFERENCE_ACTION', label: \`${'${label}'} actions\`, allowed: ['fixup', 'release', 'validate'], minimum: 1 }),\n  };\n}\n\nfunction normalizeOwnerRegion(input, index, objectById, catalogById) {\n  exactKeys(input, ['id', 'semanticRole', 'objectKind', 'ownerContract', 'ownerProfile', 'layout', 'lifecycle', 'referenceHandling', 'offsetBytes', 'sizeBytes', 'alignmentBytes', 'permissions', 'persistence'], 'GRAPH_OWNER_REGION_FIELDS', \`ownerRegion ${'${index}'}\`);`,
);
replaceOnce(
  graphPath,
  '    lifecycle: normalizeSchemaReference(input.lifecycle, `${input.id} lifecycle`),\n    offsetBytes,',
  '    lifecycle: normalizeSchemaReference(input.lifecycle, `${input.id} lifecycle`),\n    referenceHandling: normalizeReferenceHandling(input.referenceHandling, `${input.id} referenceHandling`),\n    offsetBytes,',
);

const graphFixturesPath = path.join(composerRoot, 'src', 'graph-fixtures.mjs');
replaceOnce(
  graphFixturesPath,
  '    lifecycle: schemaReference(`cuda-mcgs.synthetic-${profile}-${semanticRole}-lifecycle`),\n    offsetBytes,',
  `    lifecycle: schemaReference(\`cuda-mcgs.synthetic-${'${profile}'}-${'${semanticRole}'}-lifecycle\`),\n    referenceHandling: profile === 'synthetic-reclaiming' && semanticRole === 'domain-state'\n      ? { kind: 'owner-lifecycle', actions: ['fixup', 'release', 'validate'] }\n      : { kind: 'none' },\n    offsetBytes,`,
);

const runPath = path.join(composerRoot, 'run.mjs');
replaceOnce(
  runPath,
  "  assert.equal(graphProfileSchema.$defs.ownerRegion.additionalProperties, false);",
  "  assert.equal(graphProfileSchema.$defs.ownerRegion.additionalProperties, false);\n  assert(graphProfileSchema.$defs.ownerRegion.required.includes('referenceHandling'));",
);
replaceOnce(
  runPath,
  "await runCase('graph-identity-content-sensitive', () => {\n  const mutated = clone(graphProfileInputs[0]);\n  mutated.diagnostics.maxRecords = '257';\n  assert.notDeepEqual(normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain).identity, graphProfiles[0].identity);\n});",
  "await runCase('graph-identity-content-sensitive', () => {\n  const mutated = clone(graphProfileInputs[0]);\n  mutated.diagnostics.maxRecords = '257';\n  assert.notDeepEqual(normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain).identity, graphProfiles[0].identity);\n  const handling = clone(graphProfileInputs[1]);\n  handling.ownerRegions.find(({ semanticRole }) => semanticRole === 'domain-state').referenceHandling.actions = ['release', 'validate'];\n  assert.notDeepEqual(normalizeGraphProfile(handling, inspected, graphFixtures[1].domain).identity, graphProfiles[1].identity);\n});",
);

const graphRefPath = path.join(semanticsRoot, 'src', 'graph-ref.mjs');
replaceOnce(
  graphRefPath,
  "    const region = profile.ownerRegions.find(({ id }) => id === input.regionId);\n    if (!region) fail('GRAPH_REF_OWNER_LIFECYCLE', `unknown owner region ${input.regionId}`);\n    const publicRegion = freeze({",
  "    const region = profile.ownerRegions.find(({ id }) => id === input.regionId);\n    if (!region) fail('GRAPH_REF_OWNER_LIFECYCLE', `unknown owner region ${input.regionId}`);\n    if (region.referenceHandling?.kind !== 'owner-lifecycle' || !region.referenceHandling.actions.includes(input.action)) {\n      fail('GRAPH_REF_OWNER_LIFECYCLE', `${region.id} does not declare ${input.action} reference handling`);\n    }\n    const publicRegion = freeze({",
);
replaceOnce(
  graphRefPath,
  '      lifecycle: region.lifecycle,\n      permissions: region.permissions,',
  '      lifecycle: region.lifecycle,\n      referenceHandling: region.referenceHandling,\n      permissions: region.permissions,',
);

const graphRefCasesPath = path.join(semanticsRoot, 'src', 'graph-ref-cases.mjs');
replaceOnce(
  graphRefCasesPath,
  "  defineCase('graph-ref-owner-reference-lifecycle-is-opaque-and-delegated', () => {\n    const profile = profileById(projection);\n    const region = profile.ownerRegions.find(({ semanticRole }) => semanticRole === 'domain-state');\n    assert(region);",
  "  defineCase('graph-ref-owner-reference-lifecycle-is-opaque-and-delegated', () => {\n    const profile = profileById(projection, 'graph.synthetic-reclaiming');\n    const region = profile.ownerRegions.find(({ semanticRole }) => semanticRole === 'domain-state');\n    const noReferenceRegion = profile.ownerRegions.find(({ semanticRole }) => semanticRole === 'domain-action');\n    assert(region);\n    assert(noReferenceRegion);\n    assert.deepEqual(region.referenceHandling, { kind: 'owner-lifecycle', actions: ['fixup', 'release', 'validate'] });\n    assert.deepEqual(noReferenceRegion.referenceHandling, { kind: 'none' });",
);
replaceOnce(
  graphRefCasesPath,
  "    assert.deepEqual(result, { kind: 'delegated', status: 'ready' });\n    assert.deepEqual(record, { privateEncoding: { bytes: [9, 8, 7] }, referenceField: 'opaque' });\n    assert.equal(seen.length, 1);",
  "    assert.deepEqual(result, { kind: 'delegated', status: 'ready' });\n    assert.throws(() => oracle.applyOwnerReferenceLifecycle({ action: 'validate', regionId: noReferenceRegion.id, record }), { code: 'GRAPH_REF_OWNER_LIFECYCLE' });\n    assert.deepEqual(record, { privateEncoding: { bytes: [9, 8, 7] }, referenceField: 'opaque' });\n    assert.equal(seen.length, 1);",
);

const contractSetInput = readJson(path.join(schemaRoot, 'contract-set.json'));
const coverageInput = readJson(path.join(schemaRoot, 'requirement-coverage.json'));
const inspected = await inspectCatalog(root, contractSetInput, coverageInput);
const domainSchemaSha = sourceTextSha256(fs.readFileSync(path.join(schemaRoot, 'domain-profile.schema.json')));
const graphSchemaSha = sourceTextSha256(fs.readFileSync(path.join(schemaRoot, 'graph-profile.schema.json')));
const evaluatorSchemaSha = sourceTextSha256(fs.readFileSync(path.join(schemaRoot, 'evaluator-profile.schema.json')));
const policySchemaSha = sourceTextSha256(fs.readFileSync(path.join(schemaRoot, 'policy-profile.schema.json')));
const resourceSchemaSha = sourceTextSha256(fs.readFileSync(path.join(schemaRoot, 'resource-profile.schema.json')));
const progressSchemaSha = sourceTextSha256(fs.readFileSync(path.join(schemaRoot, 'progress-profile.schema.json')));

const domainProfiles = buildDomainProfiles(inspected).map((input) => normalizeDomainProfile(input, inspected));
const graphFixtures = buildGraphProfiles(inspected, domainProfiles, domainSchemaSha);
const graphProfiles = graphFixtures.map(({ input, domain }) => normalizeGraphProfile(input, inspected, domain));
const evaluatorFixtures = buildEvaluatorProfiles(inspected, domainProfiles, graphProfiles, domainSchemaSha, graphSchemaSha);
const evaluatorProfiles = evaluatorFixtures.map(({ input, domain, graph }) => normalizeEvaluatorProfile(input, inspected, domain, graph));
const policyFixtures = buildPolicyProfiles(inspected, domainProfiles, graphProfiles, domainSchemaSha, graphSchemaSha, evaluatorProfiles, evaluatorSchemaSha);
const policyProfiles = policyFixtures.map(({ input, domain, graph }) => normalizePolicyProfile(input, inspected, domain, graph));
const knownResourceProfiles = [
  ...domainProfiles.map((result) => ({ ...result, schemaSha: domainSchemaSha })),
  ...graphProfiles.map((result) => ({ ...result, schemaSha: graphSchemaSha })),
  ...policyProfiles.map((result) => ({ ...result, schemaSha: policySchemaSha })),
  ...evaluatorProfiles.map((result) => ({ ...result, schemaSha: evaluatorSchemaSha })),
];
const resourceInputs = buildResourceProfiles(inspected, domainProfiles, graphProfiles, policyProfiles, evaluatorProfiles, {
  domain: domainSchemaSha, graph: graphSchemaSha, policy: policySchemaSha, evaluator: evaluatorSchemaSha,
});
const resourceProfiles = resourceInputs.map((input) => normalizeResourceProfile(input, inspected, knownResourceProfiles));
const resourceResults = resourceProfiles.map((result) => ({ ...result, schemaSha: resourceSchemaSha }));
const progressInputs = buildProgressProfiles(inspected, resourceResults);
const progressProfiles = progressInputs.map((input, index) => normalizeProgressProfile(input, inspected, resourceResults[index], knownResourceProfiles));
const progressResults = progressProfiles.map((result) => ({ ...result, schemaSha: progressSchemaSha }));
const outputInputs = buildOutputProfiles(inspected, resourceResults, progressResults);
const outputProfiles = outputInputs.map((input, index) => normalizeOutputProfile(input, inspected, resourceResults[index], progressResults[index]));

const selectionPath = path.join(composerRoot, 'fixtures', 'minimal.framework-selection.json');
const selection = readJson(selectionPath);
const selectedByRole = new Map(selection.profiles.map((entry) => [entry.role, entry]));
selectedByRole.get('graph').schema.sha256 = graphSchemaSha;
selectedByRole.get('graph').identity.sha256 = graphProfiles[0].identity.sha256;
selectedByRole.get('policy').identity.sha256 = policyProfiles[0].identity.sha256;
selectedByRole.get('resource').identity.sha256 = resourceProfiles[0].identity.sha256;
selectedByRole.get('progress').identity.sha256 = progressProfiles[0].identity.sha256;
selectedByRole.get('output').identity.sha256 = outputProfiles[0].identity.sha256;
writeJson(selectionPath, selection);
console.log(`graph_schema_sha256=${graphSchemaSha}`);
console.log(`graph_profile_sha256=${graphProfiles[0].identity.sha256}`);
console.log(`policy_profile_sha256=${policyProfiles[0].identity.sha256}`);
console.log(`resource_profile_sha256=${resourceProfiles[0].identity.sha256}`);
console.log(`progress_profile_sha256=${progressProfiles[0].identity.sha256}`);
console.log(`output_profile_sha256=${outputProfiles[0].identity.sha256}`);

run('node', ['scripts/run-search-ir-composer-reference.mjs']);
run('node', ['scripts/export-search-ir-composer-domain-profiles.mjs']);
run('node', ['scripts/export-search-ir-composer-graph-profiles.mjs']);

const composerEvidence = readJson(path.join(composerRoot, 'build', 'evidence.json'));
const composerKey = composerEvidence.representationCompositionEvidenceKey;
const domainProjection = readJson(path.join(composerRoot, 'build', 'domain-profiles.json'));
const graphProjection = readJson(path.join(composerRoot, 'build', 'graph-profiles.json'));

const neutralPath = path.join(semanticsRoot, 'fixtures', 'neutral-schedules.json');
const neutral = readJson(neutralPath);
neutral.composerEvidence = composerKey;
for (const schedule of Object.values(neutral.schedules)) schedule.evidenceKey = composerKey.sha256;
writeJson(neutralPath, neutral);

const domainCasesPath = path.join(semanticsRoot, 'fixtures', 'domain-cases.json');
const domainCases = readJson(domainCasesPath);
domainCases.composerEvidence = composerKey;
domainCases.profileProjection = { schema: domainProjection.schema, ...domainProjection.projectionIdentity };
writeJson(domainCasesPath, domainCases);
run('node', ['scripts/run-search-semantics-reference.mjs']);

const nodeCasesPath = path.join(semanticsRoot, 'fixtures', 'graph-node-cases.json');
const nodeCases = readJson(nodeCasesPath);
nodeCases.composerEvidence = composerKey;
nodeCases.profileProjection = { schema: graphProjection.schema, ...graphProjection.projectionIdentity };
writeJson(nodeCasesPath, nodeCases);
run('node', ['scripts/run-graph-node-reference.mjs']);
const nodeEvidence = readJson(path.join(semanticsRoot, 'build', 'graph-node-evidence.json'));

for (const name of ['graph-edge-cases.json', 'graph-ref-cases.json']) {
  const fixturePath = path.join(semanticsRoot, 'fixtures', name);
  const fixture = readJson(fixturePath);
  fixture.composerEvidence = composerKey;
  fixture.profileProjection = { schema: graphProjection.schema, ...graphProjection.projectionIdentity };
  fixture.nodeEvidence = nodeEvidence.evidenceIdentity;
  writeJson(fixturePath, fixture);
}

run('node', ['scripts/run-graph-edge-reference.mjs']);
run('node', ['scripts/run-graph-ref-reference.mjs']);
run('bash', ['./scripts/verify-docs.sh']);

const domainEvidence = readJson(path.join(semanticsRoot, 'build', 'evidence.json'));
const edgeEvidence = readJson(path.join(semanticsRoot, 'build', 'graph-edge-evidence.json'));
const refEvidence = readJson(path.join(semanticsRoot, 'build', 'graph-ref-evidence.json'));
console.log(`composer=${composerKey.sha256} bytes=${composerKey.byteLength}`);
console.log(`domain_projection=${domainProjection.projectionIdentity.sha256} bytes=${domainProjection.projectionIdentity.byteLength}`);
console.log(`domain_evidence=${domainEvidence.evidenceIdentity.sha256} bytes=${domainEvidence.evidenceIdentity.byteLength}`);
console.log(`graph_projection=${graphProjection.projectionIdentity.sha256} bytes=${graphProjection.projectionIdentity.byteLength}`);
console.log(`node_evidence=${nodeEvidence.evidenceIdentity.sha256} bytes=${nodeEvidence.evidenceIdentity.byteLength}`);
console.log(`edge_evidence=${edgeEvidence.evidenceIdentity.sha256} bytes=${edgeEvidence.evidenceIdentity.byteLength}`);
console.log(`ref_evidence=${refEvidence.evidenceIdentity.sha256} bytes=${refEvidence.evidenceIdentity.byteLength}`);

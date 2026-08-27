import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

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
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function run(command, args) { execFileSync(command, args, { cwd: root, stdio: 'inherit' }); }

const graphFixturesPath = path.join(composerRoot, 'src', 'graph-fixtures.mjs');
replaceOnce(
  graphFixturesPath,
  "  } else if (role === 'active-path') {\n    states = ['free', 'active', 'completing', 'released', 'abandoned', 'failed'];\n    transitions = [transition('free', 'active', 'release-publication'), transition('active', 'completing', 'private'), transition('completing', 'released', 'terminal-publication'), transition('active', 'abandoned', 'terminal-publication'), transition('active', 'failed', 'terminal-publication')];\n    readyStates = ['active']; terminalStates = ['abandoned', 'failed', 'released'];\n  } else if (role === 'path-occurrence') {\n    states = ['free', 'reserved', 'ready', 'failed'];\n    transitions = [transition('free', 'reserved', 'private'), transition('reserved', 'ready', 'release-publication'), transition('reserved', 'failed', 'terminal-publication')];\n    readyStates = ['ready']; terminalStates = ['failed'];",
  "  } else if (role === 'active-path') {\n    states = ['free', 'active', 'completing', 'released', 'abandoned', 'failed'];\n    transitions = [\n      transition('free', 'active', 'release-publication'),\n      transition('active', 'completing', 'private'),\n      transition('completing', 'released', 'terminal-publication'),\n      transition('active', 'abandoned', 'terminal-publication'),\n      transition('active', 'failed', 'terminal-publication'),\n      transition('released', 'free', 'private'),\n      transition('abandoned', 'free', 'private'),\n      transition('failed', 'free', 'private'),\n    ];\n    readyStates = ['active']; terminalStates = ['abandoned', 'failed', 'released'];\n  } else if (role === 'path-occurrence') {\n    states = ['free', 'reserved', 'ready', 'failed'];\n    transitions = [\n      transition('free', 'reserved', 'private'),\n      transition('reserved', 'ready', 'release-publication'),\n      transition('reserved', 'failed', 'terminal-publication'),\n      transition('ready', 'free', 'private'),\n      transition('failed', 'free', 'private'),\n    ];\n    readyStates = ['ready']; terminalStates = ['failed'];",
);

const graphPath = path.join(composerRoot, 'src', 'graph.mjs');
replaceOnce(
  graphPath,
  "  const historyProjection = normalizeSchemaReference(input.historyProjection, 'path historyProjection');\n  if (schemaKey(historyProjection) !== schemaKey(domainProfile.classifyPathRelationPort)) fail('GRAPH_PATH_DOMAIN_PORT', 'path history projection differs from domain relation port');\n  return {",
  "  const historyProjection = normalizeSchemaReference(input.historyProjection, 'path historyProjection');\n  if (schemaKey(historyProjection) !== schemaKey(domainProfile.classifyPathRelationPort)) fail('GRAPH_PATH_DOMAIN_PORT', 'path history projection differs from domain relation port');\n  const pathLifecycle = objectById.get(input.pathObject).lifecycle;\n  const occurrenceLifecycle = objectById.get(input.occurrenceObject).lifecycle;\n  const hasPrivateReset = (lifecycle, from) => lifecycle.transitions.some((transition) =>\n    transition.from === from && transition.to === lifecycle.initialState && transition.visibility === 'private');\n  for (const terminal of pathLifecycle.terminalStates) {\n    if (!hasPrivateReset(pathLifecycle, terminal)) fail('GRAPH_PATH_LIFECYCLE', `active-path terminal state ${terminal} cannot return to free for stale-safe reuse`);\n  }\n  for (const reusable of [...occurrenceLifecycle.readyStates, ...occurrenceLifecycle.terminalStates]) {\n    if (!hasPrivateReset(occurrenceLifecycle, reusable)) fail('GRAPH_PATH_LIFECYCLE', `path-occurrence state ${reusable} cannot return to free after path release`);\n  }\n  return {",
);

const runPath = path.join(composerRoot, 'run.mjs');
replaceOnce(
  runPath,
  "  const underfundedDepth = clone(graphProfileInputs[0]);\n  underfundedDepth.resources.find(({ id }) => id.endsWith('resource-path-depth')).maximum = '4095';\n  assert.throws(() => normalizeGraphProfile(underfundedDepth, inspected, graphFixtures[0].domain), { code: 'GRAPH_RESOURCE_CAPACITY' });\n});",
  "  const underfundedDepth = clone(graphProfileInputs[0]);\n  underfundedDepth.resources.find(({ id }) => id.endsWith('resource-path-depth')).maximum = '4095';\n  assert.throws(() => normalizeGraphProfile(underfundedDepth, inspected, graphFixtures[0].domain), { code: 'GRAPH_RESOURCE_CAPACITY' });\n  const nonReusablePath = clone(graphProfileInputs[0]);\n  const activePath = nonReusablePath.objectKinds.find(({ role }) => role === 'active-path');\n  activePath.lifecycle.transitions = activePath.lifecycle.transitions.filter(({ from, to }) => !(from.endsWith('state-released') && to.endsWith('state-free')));\n  assert.throws(() => normalizeGraphProfile(nonReusablePath, inspected, graphFixtures[0].domain), { code: 'GRAPH_PATH_LIFECYCLE' });\n  const nonReusableOccurrence = clone(graphProfileInputs[0]);\n  const occurrence = nonReusableOccurrence.objectKinds.find(({ role }) => role === 'path-occurrence');\n  occurrence.lifecycle.transitions = occurrence.lifecycle.transitions.filter(({ from, to }) => !(from.endsWith('state-ready') && to.endsWith('state-free')));\n  assert.throws(() => normalizeGraphProfile(nonReusableOccurrence, inspected, graphFixtures[0].domain), { code: 'GRAPH_PATH_LIFECYCLE' });\n});",
);

const { inspectCatalog, sourceTextSha256 } = await import('../experiments/search-ir-composer-reference/src/catalog.mjs');
const { normalizeDomainProfile } = await import('../experiments/search-ir-composer-reference/src/domain.mjs');
const { buildDomainProfiles } = await import('../experiments/search-ir-composer-reference/src/domain-fixtures.mjs');
const { normalizeGraphProfile } = await import('../experiments/search-ir-composer-reference/src/graph.mjs');
const { buildGraphProfiles } = await import('../experiments/search-ir-composer-reference/src/graph-fixtures.mjs');
const { normalizeEvaluatorProfile } = await import('../experiments/search-ir-composer-reference/src/evaluator.mjs');
const { buildEvaluatorProfiles } = await import('../experiments/search-ir-composer-reference/src/evaluator-fixtures.mjs');
const { normalizePolicyProfile } = await import('../experiments/search-ir-composer-reference/src/policy.mjs');
const { buildPolicyProfiles } = await import('../experiments/search-ir-composer-reference/src/policy-fixtures.mjs');
const { normalizeResourceProfile } = await import('../experiments/search-ir-composer-reference/src/resource.mjs');
const { buildResourceProfiles } = await import('../experiments/search-ir-composer-reference/src/resource-fixtures.mjs');
const { normalizeProgressProfile } = await import('../experiments/search-ir-composer-reference/src/progress.mjs');
const { buildProgressProfiles } = await import('../experiments/search-ir-composer-reference/src/progress-fixtures.mjs');
const { normalizeOutputProfile } = await import('../experiments/search-ir-composer-reference/src/output.mjs');
const { buildOutputProfiles } = await import('../experiments/search-ir-composer-reference/src/output-fixtures.mjs');

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
selectedByRole.get('graph').identity.sha256 = graphProfiles[0].identity.sha256;
selectedByRole.get('policy').identity.sha256 = policyProfiles[0].identity.sha256;
selectedByRole.get('resource').identity.sha256 = resourceProfiles[0].identity.sha256;
selectedByRole.get('progress').identity.sha256 = progressProfiles[0].identity.sha256;
selectedByRole.get('output').identity.sha256 = outputProfiles[0].identity.sha256;
writeJson(selectionPath, selection);
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
const domainEvidence = readJson(path.join(semanticsRoot, 'build', 'evidence.json'));

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
const edgeEvidence = readJson(path.join(semanticsRoot, 'build', 'graph-edge-evidence.json'));
const refEvidence = readJson(path.join(semanticsRoot, 'build', 'graph-ref-evidence.json'));

const pathCasesPath = path.join(semanticsRoot, 'fixtures', 'graph-path-cases.json');
const pathCases = readJson(pathCasesPath);
pathCases.composerEvidence = composerKey;
pathCases.profileProjection = { schema: graphProjection.schema, ...graphProjection.projectionIdentity };
pathCases.nodeEvidence = nodeEvidence.evidenceIdentity;
pathCases.refEvidence = refEvidence.evidenceIdentity;
writeJson(pathCasesPath, pathCases);
run('node', ['scripts/run-graph-path-reference.mjs']);
run('bash', ['./scripts/verify-docs.sh']);
const pathEvidence = readJson(path.join(semanticsRoot, 'build', 'graph-path-evidence.json'));

console.log(`composer=${composerKey.sha256} bytes=${composerKey.byteLength}`);
console.log(`domain_projection=${domainProjection.projectionIdentity.sha256} bytes=${domainProjection.projectionIdentity.byteLength}`);
console.log(`domain_evidence=${domainEvidence.evidenceIdentity.sha256} bytes=${domainEvidence.evidenceIdentity.byteLength}`);
console.log(`graph_projection=${graphProjection.projectionIdentity.sha256} bytes=${graphProjection.projectionIdentity.byteLength}`);
console.log(`node_evidence=${nodeEvidence.evidenceIdentity.sha256} bytes=${nodeEvidence.evidenceIdentity.byteLength}`);
console.log(`edge_evidence=${edgeEvidence.evidenceIdentity.sha256} bytes=${edgeEvidence.evidenceIdentity.byteLength}`);
console.log(`ref_evidence=${refEvidence.evidenceIdentity.sha256} bytes=${refEvidence.evidenceIdentity.byteLength}`);
console.log(`path_evidence=${pathEvidence.evidenceIdentity.sha256} bytes=${pathEvidence.evidenceIdentity.byteLength}`);

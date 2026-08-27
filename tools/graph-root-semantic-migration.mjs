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
  "  } else if (role === 'root-anchor' || role === 'protection-record') {\n    states = ['free', 'ready', 'released', 'failed'];\n    transitions = [transition('free', 'ready', 'release-publication'), transition('ready', 'released', 'terminal-publication'), transition('free', 'failed', 'terminal-publication')];\n    readyStates = ['ready']; terminalStates = ['failed', 'released'];\n",
  "  } else if (role === 'root-anchor' || role === 'protection-record') {\n    states = ['free', 'ready', 'released', 'failed'];\n    transitions = [\n      transition('free', 'ready', 'release-publication'),\n      transition('ready', 'released', 'terminal-publication'),\n      transition('free', 'failed', 'terminal-publication'),\n      transition('released', 'free', 'private'),\n      transition('failed', 'free', 'private'),\n    ];\n    readyStates = ['ready']; terminalStates = ['failed', 'released'];\n",
);
replaceOnce(
  graphFixturesPath,
  "    { id: `graph.${profile}.resource-path-depth`, unit: 'records', minimum: '1', maximum: '4096', alignment: '8', scope: 'per-invocation', pressureOutcome: 'path-depth' },\n    { id: `graph.${profile}.resource-protection-slots`, unit: 'slots', minimum: '1', maximum: '8192', alignment: '8', scope: 'per-engine', pressureOutcome: 'protection-capacity' },",
  "    { id: `graph.${profile}.resource-path-depth`, unit: 'records', minimum: '1', maximum: '4096', alignment: '8', scope: 'per-invocation', pressureOutcome: 'path-depth' },\n    { id: `graph.${profile}.resource-root-anchor-slots`, unit: 'slots', minimum: '2', maximum: '8', alignment: '8', scope: 'per-engine', pressureOutcome: 'protection-capacity' },\n    { id: `graph.${profile}.resource-protection-slots`, unit: 'slots', minimum: '1', maximum: '8192', alignment: '8', scope: 'per-engine', pressureOutcome: 'protection-capacity' },",
);

const graphPath = path.join(composerRoot, 'src', 'graph.mjs');
replaceOnce(
  graphPath,
  "  const admissionReserve = positiveDecimal(input.admissionReserve, 'GRAPH_ROOT_RESERVE', 'rootProtection admissionReserve');\n  if (compareDecimalUint(admissionReserve, layoutByObject.get(input.anchorObject).capacity) > 0) fail('GRAPH_ROOT_RESERVE', 'root admission reserve exceeds anchor capacity');\n  return {",
  "  const admissionReserve = positiveDecimal(input.admissionReserve, 'GRAPH_ROOT_RESERVE', 'rootProtection admissionReserve');\n  if (compareDecimalUint(admissionReserve, layoutByObject.get(input.anchorObject).capacity) > 0) fail('GRAPH_ROOT_RESERVE', 'root admission reserve exceeds anchor capacity');\n  const hasPrivateReset = (object, from) => object.lifecycle.transitions.some((transition) =>\n    transition.from === from && transition.to === object.lifecycle.initialState && transition.visibility === 'private');\n  const anchorObject = objectById.get(input.anchorObject);\n  const protectionObject = objectById.get(input.protectionObject);\n  for (const terminal of anchorObject.lifecycle.terminalStates) {\n    if (!hasPrivateReset(anchorObject, terminal)) fail('GRAPH_ROOT_LIFECYCLE', `root-anchor terminal state ${terminal} cannot return to free`);\n  }\n  for (const reusable of [...protectionObject.lifecycle.readyStates, ...protectionObject.lifecycle.terminalStates]) {\n    if (!hasPrivateReset(protectionObject, reusable)) fail('GRAPH_ROOT_LIFECYCLE', `protection-record state ${reusable} cannot return to free`);\n  }\n  return {",
);
replaceOnce(
  graphPath,
  "    const protectionDemand = layoutByObject.get(roleObject.get('protection-record')).capacity;\n    if (compareDecimalUint(protectionSlotCapacity, protectionDemand) < 0) {\n      fail('GRAPH_RESOURCE_CAPACITY', 'protection-capacity slot resources cannot cover protection-record layout capacity');\n    }",
  "    const protectionDemand = addDecimalUint(\n      layoutByObject.get(roleObject.get('protection-record')).capacity,\n      layoutByObject.get(roleObject.get('root-anchor')).capacity,\n    );\n    if (compareDecimalUint(protectionSlotCapacity, protectionDemand) < 0) {\n      fail('GRAPH_RESOURCE_CAPACITY', 'protection-capacity slot resources cannot cover protection-record plus root-anchor layout capacity');\n    }",
);

const runPath = path.join(composerRoot, 'run.mjs');
replaceOnce(
  runPath,
  "await runCase('reject-graph-root-reserve', () => {\n  const mutated = clone(graphProfileInputs[0]);\n  mutated.rootProtection.admissionReserve = '9';\n  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_ROOT_RESERVE' });\n});",
  "await runCase('reject-graph-root-reserve', () => {\n  const mutated = clone(graphProfileInputs[0]);\n  mutated.rootProtection.admissionReserve = '9';\n  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_ROOT_RESERVE' });\n  const underfunded = clone(graphProfileInputs[0]);\n  underfunded.resources = underfunded.resources.filter(({ id }) => !id.endsWith('resource-root-anchor-slots'));\n  assert.throws(() => normalizeGraphProfile(underfunded, inspected, graphFixtures[0].domain), { code: 'GRAPH_RESOURCE_CAPACITY' });\n  const nonReusableAnchor = clone(graphProfileInputs[0]);\n  const anchor = nonReusableAnchor.objectKinds.find(({ role }) => role === 'root-anchor');\n  anchor.lifecycle.transitions = anchor.lifecycle.transitions.filter(({ from, to }) => !(from.endsWith('state-released') && to.endsWith('state-free')));\n  assert.throws(() => normalizeGraphProfile(nonReusableAnchor, inspected, graphFixtures[0].domain), { code: 'GRAPH_ROOT_LIFECYCLE' });\n  const nonReusableProtection = clone(graphProfileInputs[0]);\n  const protection = nonReusableProtection.objectKinds.find(({ role }) => role === 'protection-record');\n  protection.lifecycle.transitions = protection.lifecycle.transitions.filter(({ from, to }) => !(from.endsWith('state-ready') && to.endsWith('state-free')));\n  assert.throws(() => normalizeGraphProfile(nonReusableProtection, inspected, graphFixtures[0].domain), { code: 'GRAPH_ROOT_LIFECYCLE' });\n});",
);
replaceOnce(
  runPath,
  "const evidenceDirectory = path.join(experimentRoot, 'build');\nawait mkdir(evidenceDirectory, { recursive: true });\nawait writeFile(path.join(evidenceDirectory, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\\n`);",
  "const evidenceDirectory = path.join(experimentRoot, 'build');\nawait mkdir(evidenceDirectory, { recursive: true });\nconst rootControlProfile = sessionProfiles?.[0];\nif (!rootControlProfile) throw new Error('root-control projection requires the normalized live Session profile');\nconst rootControlSubject = {\n  schema: 'cuda-mcgs.search-ir-composer-root-control-projection/0.2.0',\n  sessionProfile: { id: rootControlProfile.normalized.id, schema: rootControlProfile.normalized.schema, identity: rootControlProfile.identity },\n  root: rootControlProfile.normalized.root,\n  advance: rootControlProfile.normalized.advance,\n  reroot: rootControlProfile.normalized.reroot,\n  attention: rootControlProfile.normalized.attention,\n  reclamation: rootControlProfile.normalized.reclamation,\n};\nconst rootControlProjection = { ...rootControlSubject, identity: canonicalIdentity(rootControlSubject) };\nawait writeFile(path.join(evidenceDirectory, 'root-control.json'), `${JSON.stringify(rootControlProjection, null, 2)}\\n`);\nawait writeFile(path.join(evidenceDirectory, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\\n`);",
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
const rootControl = readJson(path.join(composerRoot, 'build', 'root-control.json'));

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

const edgeCasesPath = path.join(semanticsRoot, 'fixtures', 'graph-edge-cases.json');
const edgeCases = readJson(edgeCasesPath);
edgeCases.composerEvidence = composerKey;
edgeCases.profileProjection = { schema: graphProjection.schema, ...graphProjection.projectionIdentity };
edgeCases.nodeEvidence = nodeEvidence.evidenceIdentity;
writeJson(edgeCasesPath, edgeCases);
run('node', ['scripts/run-graph-edge-reference.mjs']);
const edgeEvidence = readJson(path.join(semanticsRoot, 'build', 'graph-edge-evidence.json'));

const refCasesPath = path.join(semanticsRoot, 'fixtures', 'graph-ref-cases.json');
const refCases = readJson(refCasesPath);
refCases.composerEvidence = composerKey;
refCases.profileProjection = { schema: graphProjection.schema, ...graphProjection.projectionIdentity };
refCases.nodeEvidence = nodeEvidence.evidenceIdentity;
writeJson(refCasesPath, refCases);
run('node', ['scripts/run-graph-ref-reference.mjs']);
const refEvidence = readJson(path.join(semanticsRoot, 'build', 'graph-ref-evidence.json'));

const pathCasesPath = path.join(semanticsRoot, 'fixtures', 'graph-path-cases.json');
const pathCases = readJson(pathCasesPath);
pathCases.composerEvidence = composerKey;
pathCases.profileProjection = { schema: graphProjection.schema, ...graphProjection.projectionIdentity };
pathCases.nodeEvidence = nodeEvidence.evidenceIdentity;
pathCases.refEvidence = refEvidence.evidenceIdentity;
writeJson(pathCasesPath, pathCases);
run('node', ['scripts/run-graph-path-reference.mjs']);
const pathEvidence = readJson(path.join(semanticsRoot, 'build', 'graph-path-evidence.json'));

const rootCasesPath = path.join(semanticsRoot, 'fixtures', 'graph-root-cases.json');
const rootCases = readJson(rootCasesPath);
rootCases.composerEvidence = composerKey;
rootCases.profileProjection = { schema: graphProjection.schema, ...graphProjection.projectionIdentity };
rootCases.nodeEvidence = nodeEvidence.evidenceIdentity;
rootCases.refEvidence = refEvidence.evidenceIdentity;
rootCases.pathEvidence = pathEvidence.evidenceIdentity;
rootCases.rootControlProjection = rootControl.identity;
writeJson(rootCasesPath, rootCases);
run('node', ['scripts/run-graph-root-reference.mjs']);
run('bash', ['./scripts/verify-docs.sh']);
const rootEvidence = readJson(path.join(semanticsRoot, 'build', 'graph-root-evidence.json'));

console.log(`composer=${composerKey.sha256} bytes=${composerKey.byteLength}`);
console.log(`domain_projection=${domainProjection.projectionIdentity.sha256} bytes=${domainProjection.projectionIdentity.byteLength}`);
console.log(`domain_evidence=${domainEvidence.evidenceIdentity.sha256} bytes=${domainEvidence.evidenceIdentity.byteLength}`);
console.log(`graph_projection=${graphProjection.projectionIdentity.sha256} bytes=${graphProjection.projectionIdentity.byteLength}`);
console.log(`node_evidence=${nodeEvidence.evidenceIdentity.sha256} bytes=${nodeEvidence.evidenceIdentity.byteLength}`);
console.log(`edge_evidence=${edgeEvidence.evidenceIdentity.sha256} bytes=${edgeEvidence.evidenceIdentity.byteLength}`);
console.log(`ref_evidence=${refEvidence.evidenceIdentity.sha256} bytes=${refEvidence.evidenceIdentity.byteLength}`);
console.log(`path_evidence=${pathEvidence.evidenceIdentity.sha256} bytes=${pathEvidence.evidenceIdentity.byteLength}`);
console.log(`root_control=${rootControl.identity.sha256} bytes=${rootControl.identity.byteLength}`);
console.log(`root_evidence=${rootEvidence.evidenceIdentity.sha256} bytes=${rootEvidence.evidenceIdentity.byteLength}`);

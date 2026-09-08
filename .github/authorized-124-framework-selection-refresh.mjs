import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  normalizeDomainProfile,
  normalizeGraphProfile,
  normalizeEvaluatorProfile,
  normalizePolicyProfile,
  normalizeResourceProfile,
  normalizeProgressProfile,
  normalizeOutputProfile,
  normalizeProgramPackageProfile,
} from '../components/search-compiler/testing.mjs';
import { inspectCatalog, sourceTextSha256 } from '../conformance/search-compiler/src/catalog.mjs';
import { buildDomainProfiles } from '../conformance/search-compiler/src/domain-fixtures.mjs';
import { buildGraphProfiles } from '../conformance/search-compiler/src/graph-fixtures.mjs';
import { buildEvaluatorProfiles } from '../conformance/search-compiler/src/evaluator-fixtures.mjs';
import { buildPolicyProfiles } from '../conformance/search-compiler/src/policy-fixtures.mjs';
import { buildResourceProfiles } from '../conformance/search-compiler/src/resource-fixtures.mjs';
import { buildProgressProfiles } from '../conformance/search-compiler/src/progress-fixtures.mjs';
import { buildOutputProfiles } from '../conformance/search-compiler/src/output-fixtures.mjs';
import { buildProgramPackageProfile } from '../conformance/search-compiler/src/program-package-fixtures.mjs';

const mode = process.argv[2];
if (!['--assert-current', '--write'].includes(mode)) throw new Error('usage: framework refresh --assert-current|--write');

const root = process.cwd();
const schemaRoot = path.join(root, 'schemas', 'search-ir', '0.2.0');
const fixturePath = path.join(root, 'conformance', 'search-compiler', 'fixtures', 'minimal.framework-selection.json');
const readJson = async (target) => JSON.parse(await readFile(target, 'utf8'));
const schemaSha = async (name) => sourceTextSha256(await readFile(path.join(schemaRoot, name)));
const withSchema = (result, sha) => ({ ...result, schemaSha: sha });

const contractSet = await readJson(path.join(schemaRoot, 'contract-set.json'));
const coverage = await readJson(path.join(schemaRoot, 'requirement-coverage.json'));
const inspected = await inspectCatalog(root, contractSet, coverage);

const shas = {
  domain: await schemaSha('domain-profile.schema.json'),
  graph: await schemaSha('graph-profile.schema.json'),
  evaluator: await schemaSha('evaluator-profile.schema.json'),
  policy: await schemaSha('policy-profile.schema.json'),
  resource: await schemaSha('resource-profile.schema.json'),
  progress: await schemaSha('progress-profile.schema.json'),
  output: await schemaSha('output-profile.schema.json'),
  programPackage: await schemaSha('program-package-profile.schema.json'),
};

const domainProfiles = buildDomainProfiles(inspected).map((input) => normalizeDomainProfile(input, inspected));
const graphFixtures = buildGraphProfiles(inspected, domainProfiles, shas.domain);
const graphProfiles = graphFixtures.map(({ input, domain }) => normalizeGraphProfile(input, inspected, domain));
const evaluatorFixtures = buildEvaluatorProfiles(inspected, domainProfiles, graphProfiles, shas.domain, shas.graph);
const evaluatorProfiles = evaluatorFixtures.map(({ input, domain, graph }) => normalizeEvaluatorProfile(input, inspected, domain, graph));
const policyFixtures = buildPolicyProfiles(inspected, domainProfiles, graphProfiles, shas.domain, shas.graph, evaluatorProfiles, shas.evaluator);
const policyProfiles = policyFixtures.map(({ input, domain, graph }) => normalizePolicyProfile(input, inspected, domain, graph));
const resourceInputs = buildResourceProfiles(inspected, domainProfiles, graphProfiles, policyProfiles, evaluatorProfiles, {
  domain: shas.domain,
  graph: shas.graph,
  policy: shas.policy,
  evaluator: shas.evaluator,
});
const knownProfiles = [
  ...domainProfiles.map((result) => withSchema(result, shas.domain)),
  ...graphProfiles.map((result) => withSchema(result, shas.graph)),
  ...policyProfiles.map((result) => withSchema(result, shas.policy)),
  ...evaluatorProfiles.map((result) => withSchema(result, shas.evaluator)),
];
const resourceProfiles = resourceInputs.map((input) => normalizeResourceProfile(input, inspected, knownProfiles));
const resourceResults = resourceProfiles.map((result) => withSchema(result, shas.resource));
const progressInputs = buildProgressProfiles(inspected, resourceResults);
const progressProfiles = progressInputs.map((input, index) => normalizeProgressProfile(input, inspected, resourceResults[index], knownProfiles));
const progressResults = progressProfiles.map((result) => withSchema(result, shas.progress));
const outputInputs = buildOutputProfiles(inspected, resourceResults, progressResults);
const outputProfiles = outputInputs.map((input, index) => normalizeOutputProfile(input, inspected, resourceResults[index], progressResults[index]));
const outputResults = outputProfiles.map((result) => withSchema(result, shas.output));

const coreContext = {
  profileResults: [
    withSchema(domainProfiles[0], shas.domain),
    withSchema(graphProfiles[0], shas.graph),
    withSchema(policyProfiles[0], shas.policy),
    resourceResults[0],
    progressResults[0],
    outputResults[0],
  ],
  resourceResult: resourceResults[0],
  progressResult: progressResults[0],
  outputResult: outputResults[0],
  sessionResult: null,
  stageResult: null,
  channelResult: null,
};
const programFixture = buildProgramPackageProfile(inspected, coreContext, 'core-only');
const programPackage = normalizeProgramPackageProfile(programFixture.input, inspected, programFixture.context);

const expected = new Map([
  ['domain', { result: domainProfiles[0], schemaSha: shas.domain }],
  ['graph', { result: graphProfiles[0], schemaSha: shas.graph }],
  ['policy', { result: policyProfiles[0], schemaSha: shas.policy }],
  ['resource', { result: resourceProfiles[0], schemaSha: shas.resource }],
  ['progress', { result: progressProfiles[0], schemaSha: shas.progress }],
  ['output', { result: outputProfiles[0], schemaSha: shas.output }],
  ['program-package', { result: programPackage, schemaSha: shas.programPackage }],
]);

const fixture = await readJson(fixturePath);
for (const [role, record] of expected) {
  const selected = fixture.profiles.find((entry) => entry.role === role);
  assert(selected, `framework selection lacks ${role}`);
  if (mode === '--assert-current') {
    assert.equal(selected.schema.id, record.result.normalized.schema, `${role} schema id drift`);
    assert.equal(selected.schema.sha256, record.schemaSha, `${role} schema sha drift`);
    assert.equal(selected.identity.sha256, record.result.identity.sha256, `${role} identity drift`);
  } else {
    selected.schema.id = record.result.normalized.schema;
    selected.schema.version = '0.2.0';
    selected.schema.sha256 = record.schemaSha;
    selected.identity.algorithm = record.result.identity.algorithm;
    selected.identity.sha256 = record.result.identity.sha256;
  }
}

if (mode === '--write') {
  await writeFile(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(JSON.stringify({
    frameworkSelectionRefresh: 'written',
    resource: expected.get('resource').result.identity.sha256,
    progress: expected.get('progress').result.identity.sha256,
    output: expected.get('output').result.identity.sha256,
    programPackage: expected.get('program-package').result.identity.sha256,
    resourceSchema: shas.resource,
    programPackageSchema: shas.programPackage,
  }));
} else {
  console.log('framework_selection_current=pass roles=domain,graph,policy,resource,progress,output,program-package');
}

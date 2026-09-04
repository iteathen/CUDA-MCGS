import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { inspectCatalog } from './src/catalog.mjs';
import { normalizeDomainProfile } from '../../components/search-compiler/testing.mjs';
import { buildDomainProfiles } from './src/domain-fixtures.mjs';
import { normalizeGraphProfile } from '../../components/search-compiler/testing.mjs';
import { buildGraphProfiles } from './src/graph-fixtures.mjs';
import { normalizeEvaluatorProfile } from '../../components/search-compiler/testing.mjs';
import { buildEvaluatorProfiles } from './src/evaluator-fixtures.mjs';
import { normalizePolicyProfile } from '../../components/search-compiler/testing.mjs';
import { buildPolicyProfiles } from './src/policy-fixtures.mjs';
import { normalizeResourceProfile } from '../../components/search-compiler/testing.mjs';
import { buildResourceProfiles } from './src/resource-fixtures.mjs';
import {
  assertProgressStopDispositionTerminalState,
  assertProgressTerminalStateReachability,
  normalizeProgressProfile,
  requiredProgressTerminalStates,
} from '../../components/search-compiler/testing.mjs';
import { buildProgressProfiles } from './src/progress-fixtures.mjs';
import { sourceTextSha256 } from '../../components/search-compiler/testing.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const schemaRoot = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0');

async function readJson(absolutePath) {
  return JSON.parse(await readFile(absolutePath, 'utf8'));
}

const fixtureSource = await readFile(path.join(experimentRoot, 'src', 'progress-fixtures.mjs'), 'utf8');
const schema = await readJson(path.join(schemaRoot, 'progress-profile.schema.json'));
const specBytes = await readFile(path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0012-device-owned-search-progress.md'));
const spec = specBytes.toString('utf8');
const specSha256 = sourceTextSha256(specBytes);
console.log(`progress_spec_source_sha256=${specSha256}`);

const terminalStateEnums = [];
function collectEnums(value) {
  if (Array.isArray(value)) {
    for (const item of value) collectEnums(item);
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value.enum)) terminalStateEnums.push(...value.enum);
  for (const child of Object.values(value)) collectEnums(child);
}
collectEnums(schema);

assert(terminalStateEnums.includes('abandoned'), 'Progress Search-IR schema must admit the abandoned terminal state');
assert(terminalStateEnums.includes('quarantined'), 'Progress Search-IR schema must admit the quarantined terminal state');
assert.match(spec, /completed.*failed.*cancelled.*abandoned.*stale-disposed.*quarantined/s, 'SPEC-0012 must declare every terminal work disposition including typed fatal quarantine');
assert.match(spec, /owner-declared abandon\/cancel\/stale disposition/i, 'SPEC-0012 must retain distinct owner-declared stop dispositions');
assert(fixtureSource.includes("return 'abandon';"), 'Progress fixture must still select abandon for ordinary work');
assert.match(fixtureSource, /disposition === 'abandon' \? \['abandoned'\] : \[\]/, 'ordinary abandon fixture construction must declare abandoned as a compatible terminal state');

assert.equal(assertProgressStopDispositionTerminalState('abandon', ['abandoned'], 'abandon-case'), 'abandoned');
assert.equal(assertProgressStopDispositionTerminalState('cancel', ['cancelled'], 'cancel-case'), 'cancelled');
assert.equal(assertProgressStopDispositionTerminalState('stale-dispose', ['stale-disposed'], 'stale-case'), 'stale-disposed');
assert.equal(assertProgressStopDispositionTerminalState('service', [], 'service-case'), null);
assert.equal(assertProgressStopDispositionTerminalState('drain', [], 'drain-case'), null);

for (const [disposition, terminal] of [
  ['abandon', 'abandoned'],
  ['cancel', 'cancelled'],
  ['stale-dispose', 'stale-disposed'],
]) {
  let caught = null;
  try {
    assertProgressStopDispositionTerminalState(disposition, [], `${disposition}-mismatch`);
  } catch (error) {
    caught = error;
  }
  assert(caught, `${disposition} without ${terminal} must fail closed`);
  assert.equal(caught.code, 'PROGRESS_WORK_TERMINAL');
  assert.match(caught.message, new RegExp(`${disposition}.*${terminal}`));
}

const ordinaryReachable = requiredProgressTerminalStates('ordinary', 'abandon');
assert.deepEqual(ordinaryReachable, ['abandoned', 'cancelled', 'completed', 'failed', 'stale-disposed']);
assert(!ordinaryReachable.includes('quarantined'), 'ordinary work must not require an unreachable fatal quarantine disposition');
assert.deepEqual(requiredProgressTerminalStates('must-drain', 'drain'), ['cancelled', 'completed', 'failed', 'quarantined', 'stale-disposed']);
assert.deepEqual(requiredProgressTerminalStates('terminal-output', 'drain'), ['cancelled', 'completed', 'failed', 'quarantined', 'stale-disposed']);

function expectReachabilityFailure(kind, disposition, states, missing) {
  let caught = null;
  try {
    assertProgressTerminalStateReachability(kind, disposition, states, `${kind}-${missing}-mismatch`);
  } catch (error) {
    caught = error;
  }
  assert(caught, `${kind}/${disposition} without ${missing} must fail closed`);
  assert.equal(caught.code, 'PROGRESS_WORK_TERMINAL');
  assert.match(caught.message, new RegExp(missing));
}

const ordinaryValid = ['completed', 'failed', 'cancelled', 'stale-disposed', 'abandoned'];
assert.deepEqual(assertProgressTerminalStateReachability('ordinary', 'abandon', ordinaryValid, 'ordinary-valid'), ordinaryReachable);
for (const missing of ordinaryReachable) {
  expectReachabilityFailure('ordinary', 'abandon', ordinaryValid.filter((state) => state !== missing), missing);
}

const mustDrainValid = ['completed', 'failed', 'cancelled', 'stale-disposed', 'quarantined'];
assert.deepEqual(assertProgressTerminalStateReachability('must-drain', 'drain', mustDrainValid, 'must-drain-valid'), requiredProgressTerminalStates('must-drain', 'drain'));
expectReachabilityFailure('must-drain', 'drain', mustDrainValid.filter((state) => state !== 'quarantined'), 'quarantined');
expectReachabilityFailure('terminal-output', 'drain', mustDrainValid.filter((state) => state !== 'quarantined'), 'quarantined');

const contractSetInput = await readJson(path.join(schemaRoot, 'contract-set.json'));
const coverageInput = await readJson(path.join(schemaRoot, 'requirement-coverage.json'));
const inspected = await inspectCatalog(repositoryRoot, contractSetInput, coverageInput);
const domainSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'domain-profile.schema.json')));
const graphSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'graph-profile.schema.json')));
const evaluatorSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'evaluator-profile.schema.json')));
const policySchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'policy-profile.schema.json')));
const resourceSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'resource-profile.schema.json')));

const domainProfiles = buildDomainProfiles(inspected).map((profile) => normalizeDomainProfile(profile, inspected));
const graphFixtures = buildGraphProfiles(inspected, domainProfiles, domainSchemaSha);
const graphProfiles = graphFixtures.map(({ input, domain }) => normalizeGraphProfile(input, inspected, domain));
const evaluatorFixtures = buildEvaluatorProfiles(inspected, domainProfiles, graphProfiles, domainSchemaSha, graphSchemaSha);
const evaluatorProfiles = evaluatorFixtures.map(({ input, domain, graph }) => normalizeEvaluatorProfile(input, inspected, domain, graph));
const policyFixtures = buildPolicyProfiles(inspected, domainProfiles, graphProfiles, domainSchemaSha, graphSchemaSha, evaluatorProfiles, evaluatorSchemaSha);
const policyProfiles = policyFixtures.map(({ input, domain, graph }) => normalizePolicyProfile(input, inspected, domain, graph));
const resourceInputs = buildResourceProfiles(inspected, domainProfiles, graphProfiles, policyProfiles, evaluatorProfiles, {
  domain: domainSchemaSha,
  graph: graphSchemaSha,
  policy: policySchemaSha,
  evaluator: evaluatorSchemaSha,
});
const knownOwnerProfiles = [
  ...domainProfiles.map((result) => ({ ...result, schemaSha: domainSchemaSha })),
  ...graphProfiles.map((result) => ({ ...result, schemaSha: graphSchemaSha })),
  ...policyProfiles.map((result) => ({ ...result, schemaSha: policySchemaSha })),
  ...evaluatorProfiles.map((result) => ({ ...result, schemaSha: evaluatorSchemaSha })),
];
const resourceProfiles = resourceInputs.map((input) => normalizeResourceProfile(input, inspected, knownOwnerProfiles));
const progressResourceResults = resourceProfiles.map((result) => ({ ...result, schemaSha: resourceSchemaSha }));
const progressInputs = buildProgressProfiles(inspected, progressResourceResults);

function expectNormalizationReachabilityFailure(selectClass, missing) {
  const mutated = structuredClone(progressInputs[0]);
  const selected = selectClass(mutated.workClasses);
  assert(selected, `normalization falsifier requires a class for ${missing}`);
  selected.terminalStates = selected.terminalStates.filter((state) => state !== missing);
  assert.throws(
    () => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownOwnerProfiles),
    (error) => error?.code === 'PROGRESS_WORK_TERMINAL' && new RegExp(missing).test(error.message),
    `normalized Progress profile must reject omission of reachable ${missing}`,
  );
}

expectNormalizationReachabilityFailure((classes) => classes[0], 'completed');
expectNormalizationReachabilityFailure((classes) => classes[0], 'stale-disposed');
expectNormalizationReachabilityFailure((classes) => classes.find(({ kind }) => kind === 'must-drain'), 'quarantined');
expectNormalizationReachabilityFailure((classes) => classes.find(({ stopDisposition }) => stopDisposition === 'abandon'), 'abandoned');

console.log(`progress_terminal_state_authority=pass ordinary=${ordinaryReachable.join(',')} result_visible=${requiredProgressTerminalStates('must-drain', 'drain').join(',')} normalization_falsifiers=completed,stale-disposed,quarantined,abandoned`);

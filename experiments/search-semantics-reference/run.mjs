import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalClone, canonicalIdentity, sourceTextSha256 } from './src/canonical.mjs';
import { registerDomainCases } from './src/domain-cases.mjs';
import { assertUniqueStrings, exactKeys, fail } from './src/errors.mjs';
import { assertMutationDetected } from './src/mutation.mjs';
import { normalizeDeclaredSchedule, runDeclaredSchedule } from './src/schedule.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixturePath = path.join(experimentRoot, 'fixtures', 'neutral-schedules.json');
const domainFixturePath = path.join(experimentRoot, 'fixtures', 'domain-cases.json');
const composerEvidencePath = path.join(repositoryRoot, 'conformance', 'search-compiler', 'build', 'evidence.json');
const domainProjectionPath = path.join(repositoryRoot, 'conformance', 'search-compiler', 'build', 'domain-profiles.json');
const domainSpecPath = path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0007-domain-state-action-and-transition.md');
const requirementCoveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS search-semantics reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingCode) {
  try {
    return JSON.parse(await readFile(absolutePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && missingCode) fail(missingCode, `${absolutePath} is required; run the Search IR Composer reference first`);
    throw error;
  }
}

const fixture = await readJson(fixturePath);
const domainFixture = await readJson(domainFixturePath);
exactKeys(fixture, ['composerEvidence', 'expectedCases', 'schedules', 'schema'], 'HARNESS_FIXTURE_FIELDS', 'neutral schedule fixture');
exactKeys(domainFixture, ['composerEvidence', 'expectedCases', 'profileProjection', 'roots', 'schema'], 'DOMAIN_FIXTURE_FIELDS', 'Domain fixture');
assert.equal(fixture.schema, 'cuda-mcgs.reference-harness-fixtures/0.1.0');
assert.equal(domainFixture.schema, 'cuda-mcgs.reference-domain-fixtures/0.1.0');
exactKeys(fixture.schedules, ['dependent', 'independentAlphaFirst', 'independentBetaFirst'], 'HARNESS_FIXTURE_SCHEDULES', 'neutral fixture schedules');
exactKeys(fixture.composerEvidence, ['algorithm', 'byteLength', 'sha256'], 'HARNESS_FIXTURE_EVIDENCE', 'fixture Composer evidence');
exactKeys(domainFixture.composerEvidence, ['algorithm', 'byteLength', 'sha256'], 'DOMAIN_FIXTURE_EVIDENCE', 'Domain fixture Composer evidence');
exactKeys(domainFixture.profileProjection, ['algorithm', 'byteLength', 'schema', 'sha256'], 'DOMAIN_FIXTURE_PROJECTION', 'Domain fixture profile projection');
assert.deepEqual(domainFixture.composerEvidence, fixture.composerEvidence);
const expectedEvidenceKey = fixture.composerEvidence.sha256;
const neutralExpectedCaseIds = assertUniqueStrings(fixture.expectedCases, 'HARNESS_EXPECTED_CASES', 'neutral expectedCases');
const domainExpectedCaseIds = assertUniqueStrings(domainFixture.expectedCases, 'DOMAIN_EXPECTED_CASES', 'Domain expectedCases');
const expectedCaseIds = assertUniqueStrings([...neutralExpectedCaseIds, ...domainExpectedCaseIds], 'HARNESS_EXPECTED_CASES', 'combined expectedCases');
if (expectedCaseIds.length === 0 || expectedCaseIds.some((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(id))) fail('HARNESS_EXPECTED_CASES', 'expectedCases contains an invalid case id');
const composerEvidence = await readJson(composerEvidencePath, 'HARNESS_COMPOSER_EVIDENCE_MISSING');
const domainProjection = await readJson(domainProjectionPath, 'DOMAIN_PROJECTION_MISSING');
const requirementCoverage = await readJson(requirementCoveragePath);
const domainSpec = await readFile(domainSpecPath, 'utf8');

const directDomainPrefixes = Object.freeze([
  'DOMAIN-STATE-',
  'DOMAIN-HISTORY-',
  'DOMAIN-ROLE-',
  'DOMAIN-ACTION-',
  'DOMAIN-TRANSITION-',
  'DOMAIN-ROOT-',
  'DOMAIN-CLEANUP-',
]);
const domainRequirementClassifications = requirementCoverage.classifications.filter((entry) =>
  entry.contract === 'SPEC-0007'
  && directDomainPrefixes.includes(entry.requirementPrefix)
  && entry.primaryDisposition === 'engine-reference-oracle'
  && entry.evidenceOwner === 'ENGINE-REFERENCE-01');
assert.deepEqual(domainRequirementClassifications.map(({ requirementPrefix }) => requirementPrefix).sort(), [...directDomainPrefixes].sort());
const domainRequirementIds = assertUniqueStrings(
  [...domainSpec.matchAll(/^(DOMAIN-(?:STATE|HISTORY|ROLE|ACTION|TRANSITION|ROOT|CLEANUP)-\d{3})\./gm)].map((match) => match[1]),
  'DOMAIN_REQUIREMENT_SOURCE',
  'direct Domain requirements',
);
for (const classification of domainRequirementClassifications) {
  assert.equal(domainRequirementIds.filter((id) => id.startsWith(classification.requirementPrefix)).length, classification.requirementCount);
}
assert.equal(domainRequirementIds.length, 47);

function clone(value) {
  return canonicalClone(value);
}

function reverseObjectKeys(value) {
  if (Array.isArray(value)) return value.map(reverseObjectKeys);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).reverse().map((key) => [key, reverseObjectKeys(value[key])]));
}

function alphaTransition({ state, input, context }) {
  assert(Object.isFrozen(state) && Object.isFrozen(input) && Object.isFrozen(context) && Object.isFrozen(context.facts));
  assert.equal(input.operation, 'publish');
  exactKeys(input, ['fact', 'operation', 'value'], 'HARNESS_FIXTURE_INPUT', `${context.eventId} alpha input`);
  return { state: { lastPublished: input.value }, publications: [{ id: input.fact, value: input.value }] };
}

function betaTransition({ state, input, context }) {
  assert(Object.isFrozen(state) && Object.isFrozen(input) && Object.isFrozen(context) && Object.isFrozen(context.facts));
  if (input.operation === 'capture') {
    exactKeys(input, ['fact', 'operation', 'source'], 'HARNESS_FIXTURE_INPUT', `${context.eventId} beta capture input`);
    assert(Object.hasOwn(context.facts, input.source));
    return { state: { seen: context.facts[input.source] }, publications: [{ id: input.fact, value: context.facts[input.source] }] };
  }
  assert.equal(input.operation, 'publish');
  exactKeys(input, ['fact', 'operation', 'value'], 'HARNESS_FIXTURE_INPUT', `${context.eventId} beta publish input`);
  return { state: { seen: input.value }, publications: [{ id: input.fact, value: input.value }] };
}

const transitions = Object.freeze({ 'owner.alpha': alphaTransition, 'owner.beta': betaTransition });

function run(schedule, handlers = transitions) {
  return runDeclaredSchedule(schedule, handlers, expectedEvidenceKey);
}

const definitions = [];
function defineCase(id, body, requirements = []) {
  if (definitions.some((entry) => entry.id === id)) throw new Error(`duplicate case ${id}`);
  const uniqueRequirements = assertUniqueStrings(requirements, 'DOMAIN_CASE_REQUIREMENTS', `${id} requirements`);
  definitions.push({ id, body, requirements: uniqueRequirements });
}

defineCase('composer-evidence-input-exact', () => {
  assert.equal(composerEvidence.capsule, 'cuda-mcgs-search-ir-composer-reference-v0.2.0');
  assert.equal(composerEvidence.status, 'pass');
  assert(Number.isSafeInteger(composerEvidence.summary.expected) && composerEvidence.summary.expected > 0, 'Composer evidence must declare a positive exact case count');
  assert.equal(composerEvidence.summary.discovered, composerEvidence.summary.expected, 'Composer evidence discovery must be exact');
  assert.equal(composerEvidence.summary.executed, composerEvidence.summary.discovered, 'Composer evidence must execute every discovered case');
  assert.equal(composerEvidence.summary.passed, composerEvidence.summary.executed, 'Composer evidence must pass every executed case');
  assert.equal(composerEvidence.summary.failed, 0);
  assert.equal(composerEvidence.summary.requiredSkipped, 0);
  assert.equal(composerEvidence.summary.conditionalSkipped, 0);
  assert.equal(composerEvidence.summary.optionalSkipped, 0);
  assert.equal(composerEvidence.summary.notDiscovered, 0);
  assert.deepEqual(composerEvidence.representationCompositionEvidenceKey, fixture.composerEvidence);
  return { composerEvidence: fixture.composerEvidence };
});

defineCase('declared-schedule-owner-set-canonical', () => {
  const baseline = normalizeDeclaredSchedule(fixture.schedules.dependent, expectedEvidenceKey);
  const reversed = clone(fixture.schedules.dependent);
  reversed.owners.reverse();
  const reordered = normalizeDeclaredSchedule(reversed, expectedEvidenceKey);
  assert.deepEqual(reordered.identity, baseline.identity);
  assert.deepEqual(reordered.normalized, baseline.normalized);
  return { scheduleIdentity: baseline.identity };
});

defineCase('declared-schedule-object-order-canonical', () => {
  const baseline = normalizeDeclaredSchedule(fixture.schedules.dependent, expectedEvidenceKey);
  const reordered = normalizeDeclaredSchedule(reverseObjectKeys(fixture.schedules.dependent), expectedEvidenceKey);
  assert.deepEqual(reordered.identity, baseline.identity);
  assert.deepEqual(reordered.normalized, baseline.normalized);
  return { scheduleIdentity: baseline.identity };
});

defineCase('declared-schedule-deterministic', () => {
  const first = run(fixture.schedules.dependent);
  const second = run(fixture.schedules.dependent);
  assert.deepEqual(second, first);
  return { resultIdentity: first.resultIdentity };
});

defineCase('declared-schedule-public-fact-dependency', () => {
  const result = run(fixture.schedules.dependent);
  assert.deepEqual(result.terminalStates, { 'owner.alpha': { lastPublished: 'ready' }, 'owner.beta': { seen: 'ready' } });
  assert.deepEqual(result.facts.map(({ id, owner, producerEvent }) => ({ id, owner, producerEvent })), [
    { id: 'owner.alpha.signal', owner: 'owner.alpha', producerEvent: 'event.alpha-publish' },
    { id: 'owner.beta.capture', owner: 'owner.beta', producerEvent: 'event.beta-capture' },
  ]);
  return { resultIdentity: result.resultIdentity };
});

defineCase('declared-schedule-order-explicit', () => {
  const alphaFirst = run(fixture.schedules.independentAlphaFirst);
  const betaFirst = run(fixture.schedules.independentBetaFirst);
  assert.deepEqual(betaFirst.terminalStates, alphaFirst.terminalStates);
  assert.deepEqual(betaFirst.facts, alphaFirst.facts);
  assert.notDeepEqual(betaFirst.scheduleIdentity, alphaFirst.scheduleIdentity);
  assert.notDeepEqual(betaFirst.resultIdentity, alphaFirst.resultIdentity);
  return { alphaFirst: alphaFirst.resultIdentity, betaFirst: betaFirst.resultIdentity };
});

defineCase('declared-schedule-owner-inputs-immutable', () => {
  const mutatingTransitions = {
    ...transitions,
    'owner.alpha': ({ state }) => {
      state.lastPublished = 'forbidden';
      return { state, publications: [] };
    },
  };
  assert.throws(() => run(fixture.schedules.dependent, mutatingTransitions), TypeError);
});

defineCase('reject-declared-schedule-evidence-key-mismatch', () => {
  const candidate = clone(fixture.schedules.dependent);
  candidate.evidenceKey = '0'.repeat(64);
  assert.throws(() => normalizeDeclaredSchedule(candidate, expectedEvidenceKey), { code: 'HARNESS_EVIDENCE_KEY' });
});

defineCase('reject-declared-schedule-unknown-field', () => {
  const candidate = clone(fixture.schedules.dependent);
  candidate.runtimeHint = 'forbidden';
  assert.throws(() => normalizeDeclaredSchedule(candidate, expectedEvidenceKey), { code: 'HARNESS_SCHEDULE_FIELDS' });
});

defineCase('reject-declared-schedule-unknown-owner', () => {
  const candidate = clone(fixture.schedules.dependent);
  candidate.events[0].owner = 'owner.ghost';
  assert.throws(() => normalizeDeclaredSchedule(candidate, expectedEvidenceKey), { code: 'HARNESS_EVENT_OWNER' });
});

defineCase('reject-declared-schedule-overlapping-owner-namespace', () => {
  const candidate = clone(fixture.schedules.dependent);
  candidate.owners[1].id = 'owner.alpha.child';
  candidate.events[1].owner = 'owner.alpha.child';
  assert.throws(() => normalizeDeclaredSchedule(candidate, expectedEvidenceKey), { code: 'HARNESS_OWNER_NAMESPACE' });
});

defineCase('reject-declared-schedule-forward-dependency', () => {
  const candidate = clone(fixture.schedules.dependent);
  candidate.events.reverse();
  assert.throws(() => normalizeDeclaredSchedule(candidate, expectedEvidenceKey), { code: 'HARNESS_EVENT_DEPENDENCY_ORDER' });
});

defineCase('reject-declared-schedule-missing-fact', () => {
  const candidate = clone(fixture.schedules.dependent);
  candidate.events[1].reads = ['owner.alpha.missing'];
  candidate.events[1].input.source = 'owner.alpha.missing';
  assert.throws(() => run(candidate), { code: 'HARNESS_FACT_NOT_READY' });
});

defineCase('reject-declared-schedule-fact-without-dependency', () => {
  const candidate = clone(fixture.schedules.dependent);
  candidate.events[1].after = [];
  assert.throws(() => run(candidate), { code: 'HARNESS_FACT_DEPENDENCY' });
});

defineCase('reject-declared-schedule-foreign-publication', () => {
  const foreignTransitions = {
    ...transitions,
    'owner.alpha': () => ({ state: { lastPublished: 'bad' }, publications: [{ id: 'owner.beta.foreign', value: 'bad' }] }),
  };
  assert.throws(() => run(fixture.schedules.dependent, foreignTransitions), { code: 'HARNESS_FACT_OWNER' });
});

defineCase('reject-declared-schedule-duplicate-publication', () => {
  const candidate = clone(fixture.schedules.dependent);
  candidate.events.push({
    id: 'event.alpha-republish',
    owner: 'owner.alpha',
    after: ['event.alpha-publish'],
    reads: [],
    input: { operation: 'publish', fact: 'owner.alpha.signal', value: 'again' },
  });
  assert.throws(() => run(candidate), { code: 'HARNESS_FACT_DUPLICATE' });
});

defineCase('reject-declared-schedule-transition-owner-gap', () => {
  assert.throws(() => run(fixture.schedules.dependent, { 'owner.alpha': alphaTransition }), { code: 'HARNESS_TRANSITIONS' });
});

defineCase('mutation-harness-detects-key-drift', () => {
  return assertMutationDetected({
    id: 'mutation.evidence-key-drift',
    baseline: fixture.schedules.dependent,
    mutate: (candidate) => ({ ...candidate, evidenceKey: '0'.repeat(64) }),
    evaluate: (candidate) => normalizeDeclaredSchedule(candidate, expectedEvidenceKey),
    expectedCode: 'HARNESS_EVIDENCE_KEY',
  });
});

defineCase('mutation-harness-preserves-owner-failure-code', () => {
  return assertMutationDetected({
    id: 'mutation.owner-failure-code',
    baseline: { disposition: 'accepted' },
    mutate: (candidate) => ({ ...candidate, disposition: 'rejected' }),
    evaluate: (candidate) => {
      if (candidate.disposition === 'rejected') {
        const error = new Error('owner rejected the mutation');
        error.code = 'OWNER_REJECTED';
        throw error;
      }
    },
    expectedCode: 'OWNER_REJECTED',
  });
});

defineCase('mutation-harness-rejects-ineffective-mutation', () => {
  assert.throws(() => assertMutationDetected({
    id: 'mutation.ineffective',
    baseline: fixture.schedules.dependent,
    mutate: (candidate) => candidate,
    evaluate: (candidate) => normalizeDeclaredSchedule(candidate, expectedEvidenceKey),
    expectedCode: 'HARNESS_EVIDENCE_KEY',
  }), { code: 'HARNESS_MUTATION_INEFFECTIVE' });
});

defineCase('mutation-harness-rejects-undetected-mutation', () => {
  assert.throws(() => assertMutationDetected({
    id: 'mutation.undetected',
    baseline: fixture.schedules.dependent,
    mutate: (candidate) => {
      candidate.events[0].input.value = 'changed-but-valid';
      return candidate;
    },
    evaluate: (candidate) => normalizeDeclaredSchedule(candidate, expectedEvidenceKey),
    expectedCode: 'HARNESS_EVIDENCE_KEY',
  }), { code: 'HARNESS_MUTATION_UNDETECTED' });
});

defineCase('harness-evidence-identity-content-sensitive', () => {
  const baseline = canonicalIdentity({ cases: [{ id: 'case.alpha', status: 'pass' }] });
  const mutated = canonicalIdentity({ cases: [{ id: 'case.alpha', status: 'fail' }] });
  assert.notDeepEqual(mutated, baseline);
  return { baseline, mutated };
});

function plannedDomainCoverage() {
  const direct = new Set(domainRequirementIds);
  const casesByRequirement = Object.fromEntries(domainRequirementIds.map((id) => [id, []]));
  for (const definition of definitions) {
    for (const requirement of definition.requirements) {
      if (!direct.has(requirement)) fail('DOMAIN_REQUIREMENT_SCOPE', `${definition.id} maps non-owned requirement ${requirement}`);
      casesByRequirement[requirement].push(definition.id);
    }
  }
  const uncovered = domainRequirementIds.filter((id) => casesByRequirement[id].length === 0);
  if (uncovered.length !== 0) fail('DOMAIN_REQUIREMENT_COVERAGE', `direct Domain requirements lack cases: ${uncovered.join(', ')}`);
  return {
    requirementCount: domainRequirementIds.length,
    requirements: domainRequirementIds.map((id) => ({ id, cases: casesByRequirement[id] })),
  };
}

registerDomainCases({
  defineCase,
  fixture: domainFixture,
  projection: domainProjection,
  composerEvidence,
  plannedCoverage: plannedDomainCoverage,
});

const args = process.argv.slice(2);
let selectedCase = null;
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== '--case') fail('HARNESS_CLI', 'usage: run.mjs [--case case-id]');
  selectedCase = args[1];
  if (!definitions.some(({ id }) => id === selectedCase)) fail('HARNESS_CLI', `unknown case ${selectedCase}`);
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
const plannedDomainRequirementCoverage = plannedDomainCoverage();
const executedCaseIds = new Set(cases.map(({ id }) => id));
const executedDomainRequirements = plannedDomainRequirementCoverage.requirements
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
assert.deepEqual(definitions.map(({ id }) => id), expectedCaseIds, 'discovered cases must exactly match the checked-in expected case bank');
if (selectedCase === null) assert.equal(cases.length, expectedCaseIds.length);

const sourcePaths = [
  'experiments/search-semantics-reference/fixtures/neutral-schedules.json',
  'experiments/search-semantics-reference/fixtures/domain-cases.json',
  'experiments/search-semantics-reference/src/errors.mjs',
  'experiments/search-semantics-reference/src/canonical.mjs',
  'experiments/search-semantics-reference/src/schedule.mjs',
  'experiments/search-semantics-reference/src/mutation.mjs',
  'experiments/search-semantics-reference/src/domain.mjs',
  'experiments/search-semantics-reference/src/domain-instances.mjs',
  'experiments/search-semantics-reference/src/domain-cases.mjs',
  'conformance/search-compiler/export-domain-profiles.mjs',
  'scripts/export-search-ir-composer-domain-profiles.mjs',
  'docs/specs/SPEC-0007-domain-state-action-and-transition.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
  'experiments/search-semantics-reference/run.mjs',
  'scripts/run-search-semantics-reference.mjs',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));
const evidenceSubject = {
  schema: 'cuda-mcgs.search-semantics-reference-evidence-key/0.2.0',
  composerEvidence: fixture.composerEvidence,
  domainProfileProjection: domainProjection.projectionIdentity,
  domainRequirementCoverage: {
    planned: plannedDomainRequirementCoverage,
    executedRequirementCount: executedDomainRequirements.length,
    executed: executedDomainRequirements,
  },
  selection: selectedCase,
  sources,
  summary,
  cases,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject, 'search-semantics reference evidence');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-search-semantics-reference-v0.2.0',
  scope: selectedCase === null ? 'full-reference' : 'focused-case',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: fixture.composerEvidence,
  domainProfileProjection: domainProjection.projectionIdentity,
  domainRequirementCoverage: {
    planned: plannedDomainRequirementCoverage,
    executedRequirementCount: executedDomainRequirements.length,
    executed: executedDomainRequirements,
  },
  evidenceIdentity,
  sources,
  summary,
  cases,
  claimLimits: [
    'Semantic-neutral declared-schedule harness behavior plus bounded Domain-owned state, action, history, role, transition, root and cleanup reference-oracle behavior only.',
    'The Domain oracle consumes a deterministic public normalized-profile projection; it does not import Composer internals or modify the frozen Composer evidence key.',
    'No Graph, Policy, Evaluator, Resource, Progress, Output, Session, Stage or Channel search semantics are implemented by this capsule.',
    'No production runtime, physical scheduler, CUDA-JS execution, native CUDA, performance, search-quality, public SDK, contract acceptance or multi-GPU support claim.',
  ],
};
const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
const evidenceName = selectedCase === null ? 'evidence.json' : `evidence.${selectedCase}.json`;
await writeFile(path.join(evidenceDirectory, evidenceName), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} scope=${evidence.scope} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=0 not_executed_by_selection=${summary.notExecutedBySelection}`);
console.log(`composer_evidence_sha256=${fixture.composerEvidence.sha256} harness_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);
if (failed.length > 0) process.exit(1);

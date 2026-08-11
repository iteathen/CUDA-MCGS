import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeSearchIr, searchIrIdentity } from './src/normalize.mjs';
import { PublicationModel, ReferenceSearch, runSchedule, SYNTHETIC_WORK, validateSnapshot } from './src/reference.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const fixtureRoot = path.join(experimentRoot, 'fixtures');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Search IR reference requires Node 26 or newer; found ${process.version}`);

async function readJson(relative) {
  return JSON.parse(await readFile(path.join(experimentRoot, relative), 'utf8'));
}

function clone(value) {
  return structuredClone(value);
}

function reverseObjectKeys(value) {
  if (Array.isArray(value)) return value.map(reverseObjectKeys);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).reverse().map((key) => [key, reverseObjectKeys(value[key])]));
}

function reverseSemanticSets(input) {
  const candidate = clone(input);
  candidate.roles.reverse();
  candidate.publicationChannels.reverse();
  for (const channel of candidate.publicationChannels) {
    channel.consumers.reverse();
    channel.states.reverse();
    channel.terminalStates.reverse();
    channel.failureStates.reverse();
    channel.transitions.reverse();
  }
  candidate.resources.reverse();
  candidate.stop.causes.reverse();
  return candidate;
}

function applyMutation(baseline, mutation) {
  const candidate = clone(baseline);
  switch (mutation) {
    case 'undeclared-consumer-role':
      candidate.publicationChannels.find(({ id }) => id === 'identity-slot').consumers = ['ghost-reader'];
      break;
    case 'insufficient-visibility-scope':
      candidate.publicationChannels.find(({ id }) => id === 'state-node').visibilityScope = 'thread-block';
      break;
    case 'ambiguous-resource-counters':
      candidate.resources.find(({ id }) => id === 'state-nodes').counters = ['allocated'];
      break;
    case 'backend-admission-mechanism':
      candidate.resources.find(({ id }) => id === 'state-nodes').admission = 'atomic-bounded';
      break;
    case 'missing-exhaustion-cause':
      candidate.stop.causes = candidate.stop.causes.filter((cause) => cause !== 'resource-exhausted/state-nodes');
      break;
    case 'stale-incarnation-policy':
      candidate.graph.stateNodes.staleReferencePolicy = 'slot-only';
      break;
    case 'unbounded-channel-wait':
      candidate.publicationChannels.find(({ id }) => id === 'expansion').progress.boundedWait = false;
      break;
    case 'unknown-root-field':
      candidate.targetPlatform = process.platform;
      break;
    default:
      throw new Error(`Unknown mutation ${mutation}`);
  }
  return candidate;
}

function semanticSummary(snapshot) {
  const identityById = new Map(snapshot.nodes.map((node) => [node.id, node.identity]));
  return {
    completionClass: snapshot.completionClass,
    firstStopCause: snapshot.firstStopCause,
    completedWork: snapshot.completedWork,
    nodes: snapshot.nodes.map(({ identity }) => identity).sort(),
    edges: snapshot.edges.map((edge) => ({
      parent: identityById.get(edge.parent),
      action: edge.action,
      child: identityById.get(edge.child),
      visits: edge.visits,
      valueSum: edge.valueSum,
    })).sort((left, right) => `${left.parent}\0${left.action}`.localeCompare(`${right.parent}\0${right.action}`)),
    appliedBackups: snapshot.appliedBackups,
    abandonedBackups: snapshot.abandonedBackups,
  };
}

const baselineInput = await readJson('fixtures/baseline.search-ir.json');
const boundary = await readJson('fixtures/boundary-capacities.json');
const mutations = await readJson('fixtures/invalid-mutations.json');
const expectedIdentity = await readJson('fixtures/expected-identity.json');
const schema = JSON.parse(await readFile(path.join(repositoryRoot, 'schemas', 'search-ir', '0.1.0', 'search-ir.schema.json'), 'utf8'));
assert.equal(schema.title, 'CUDA-MCGS Search IR 0.1.0');
assert.equal(schema.properties.schema.const, baselineInput.schema);

const cases = [];
async function runCase(id, body) {
  try {
    await body();
    cases.push({ id, status: 'pass' });
    console.log(`case=${id} result=pass`);
  } catch (error) {
    cases.push({ id, status: 'fail', error: { name: error.name, code: error.code ?? null, message: error.message } });
    console.error(`case=${id} result=fail error=${JSON.stringify(error.message)}`);
  }
}

let normalized;
let identity;
await runCase('normalize-baseline', () => {
  normalized = normalizeSearchIr(baselineInput);
  identity = searchIrIdentity(normalized);
  assert.deepEqual(identity, expectedIdentity);
});

await runCase('normalize-canonical-order-independent', () => {
  const reordered = reverseObjectKeys(reverseSemanticSets(baselineInput));
  assert.deepEqual(searchIrIdentity(normalizeSearchIr(reordered)), expectedIdentity);
});

await runCase(boundary.id, () => {
  const candidate = clone(baselineInput);
  for (const resource of candidate.resources) resource.capacity = boundary.capacities[resource.id];
  const normalizedBoundary = normalizeSearchIr(candidate);
  assert(normalizedBoundary.resources.every(({ capacity }) => capacity === 1));
});

for (const mutation of mutations) {
  await runCase(`reject-${mutation.id}`, () => {
    assert.throws(() => normalizeSearchIr(applyMutation(baselineInput, mutation.mutation)), { code: mutation.expectedCode });
  });
}

await runCase('ordinary-serial', () => {
  const output = runSchedule(normalized, [SYNTHETIC_WORK[0]], 'fifo');
  assert.equal(output.completionClass, 'complete');
  assert.equal(output.completedWork, 1);
  assert.equal(output.appliedBackups, 1);
  assert.equal(output.abandonedBackups, 0);
});

await runCase('parallel-publication', () => {
  const channel = normalized.publicationChannels.find(({ id }) => id === 'identity-slot');
  const publication = new PublicationModel(channel);
  publication.transition('claimed');
  assert.throws(() => publication.acquire(), /PUB_NOT_READY/);
  publication.transition('ready', { identity: 'shared', node: { slot: 3, incarnation: 1 } });
  assert.deepEqual(publication.acquire(), { identity: 'shared', node: { slot: 3, incarnation: 1 } });
  assert.throws(() => publication.transition('ready', { identity: 'conflict' }), /PUB_CONFLICT/);
});

let transposition;
await runCase('transposition-node-edge-ownership', () => {
  transposition = runSchedule(normalized, SYNTHETIC_WORK, 'fifo');
  const shared = transposition.nodes.filter(({ identity: stateIdentity }) => stateIdentity === 'shared');
  assert.equal(shared.length, 1);
  const incoming = transposition.edges.filter(({ child }) => child === shared[0].id);
  assert.deepEqual(incoming.map(({ action }) => action).sort(), ['x', 'y']);
  assert(incoming.every(({ visits }) => visits === 1));
});

await runCase('path-cycle-after-identity', () => {
  const search = new ReferenceSearch(normalized);
  const before = search.identityResolutions;
  const observation = search.execute({ id: 'cycle', actions: ['a', 'x', 'loop'], value: 0 });
  const output = search.finish(1);
  assert.equal(observation.status, 'cycle-cutoff-applied');
  assert.equal(observation.identityResolvedBeforeCycle, true);
  assert(output.identityResolutions > before);
  assert.equal(output.cycleCutoffs, 1);
  assert(output.edges.some(({ action }) => action === 'loop'));
});

await runCase('forced-resource-exhaustion', () => {
  const candidate = clone(baselineInput);
  candidate.resources.find(({ id }) => id === 'state-nodes').capacity = 3;
  candidate.resources.find(({ id }) => id === 'state-bytes').capacity = 3;
  candidate.resources.find(({ id }) => id === 'transposition-slots').capacity = 3;
  const constrained = normalizeSearchIr(candidate);
  const output = runSchedule(constrained, [SYNTHETIC_WORK[0]], 'fifo');
  assert.equal(output.completionClass, 'valid-partial');
  assert.equal(output.firstStopCause, 'resource-exhausted/state-nodes');
  assert.equal(output.completedWork, 0);
  assert.equal(output.resources['state-nodes'].published, 3);
  assert.equal(output.resources['state-nodes']['failed-reservations'], 1);
  assert(output.resources['state-nodes']['high-water'] <= 3);
});

await runCase('scheduler-semantic-parity', () => {
  const work = [...SYNTHETIC_WORK, ...SYNTHETIC_WORK];
  assert.deepEqual(semanticSummary(runSchedule(normalized, work, 'fifo')), semanticSummary(runSchedule(normalized, work, 'lifo')));
});

await runCase('oracle-sensitivity', () => {
  const mutated = clone(transposition);
  mutated.nodes.push({ ...mutated.nodes[0], id: 999 });
  assert.throws(() => validateSnapshot(mutated), /GRAPH_NODE_IDENTITY/);
});

const failed = cases.filter(({ status }) => status === 'fail');
const summary = {
  expected: 18,
  discovered: cases.length,
  executed: cases.length,
  passed: cases.length - failed.length,
  failed: failed.length,
  requiredSkipped: 0,
  conditionalSkipped: 0,
  optionalSkipped: 0,
  notDiscovered: 18 - cases.length,
};
assert.equal(cases.length, summary.expected, `Expected ${summary.expected} cases, discovered ${cases.length}`);

const sourcePaths = [
  'docs/specs/SPEC-0001-device-search-publication-and-resources.md',
  'docs/specs/SPEC-0002-search-ir-and-reference-semantics.md',
  'schemas/search-ir/0.1.0/search-ir.schema.json',
  'experiments/search-ir-reference/fixtures/baseline.search-ir.json',
  'experiments/search-ir-reference/fixtures/boundary-capacities.json',
  'experiments/search-ir-reference/fixtures/invalid-mutations.json',
  'experiments/search-ir-reference/fixtures/expected-identity.json',
  'experiments/search-ir-reference/src/normalize.mjs',
  'experiments/search-ir-reference/src/reference.mjs',
  'experiments/search-ir-reference/run.mjs',
];
const sources = {};
for (const relative of sourcePaths) {
  sources[relative] = createHash('sha256').update(await readFile(path.join(repositoryRoot, relative))).digest('hex');
}
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-search-ir-reference-v0.1.0',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  searchIrIdentity: identity,
  sources,
  summary,
  cases,
  claimLimits: [
    'Deterministic backend-neutral reference semantics only.',
    'No CUDA lowering, GPU execution, production scheduler, performance, search-quality, CUDA-JS adapter, or released compatible-pair claim.',
    'Native Linux CUDA remains untested; Ubuntu CI checks only this CUDA-free reference capsule.',
  ],
};
const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
await writeFile(path.join(evidenceDirectory, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=${summary.notDiscovered}`);
console.log(`search_ir_sha256=${identity?.sha256 ?? 'unavailable'} canonical_bytes=${identity?.byteLength ?? 0}`);
if (failed.length > 0) process.exit(1);

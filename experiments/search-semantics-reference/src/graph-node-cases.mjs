import assert from 'node:assert/strict';

import { canonicalClone, canonicalIdentity } from './canonical.mjs';
import { createGraphNodeOracle } from './graph-node.mjs';
import { exactKeys } from './errors.mjs';
import { assertMutationDetected } from './mutation.mjs';

function clone(value) {
  return canonicalClone(value);
}

function graphProfile(projection, id) {
  const entry = projection.profiles.find((profile) => profile.id === id);
  assert(entry, `missing projected Graph profile ${id}`);
  return entry.normalized;
}

function createPortHarness() {
  const calls = [];
  const identityKey = (view) => {
    calls.push(`key:${view.label}`);
    return { bucket: view.bucket };
  };
  const equalState = (left, right) => {
    calls.push(`equal:${left.label}:${right.label}`);
    return left.semantic === right.semantic && left.history === right.history;
  };
  return { calls, identityKey, equalState };
}

function view(label, semantic, bucket = 'shared', history = 'h0') {
  return { label, semantic, bucket, history };
}

function payload(candidate) {
  return { state: { semantic: candidate.semantic }, history: candidate.history };
}

function initializeRegions(log = []) {
  return ({ claimId }) => {
    log.push(`initialize:${claimId}`);
    return [{ id: 'region.structural', status: 'ready' }];
  };
}

function makeOracle(projection, options = {}) {
  const ports = options.ports ?? createPortHarness();
  const profile = graphProfile(projection, options.profileId ?? 'graph.synthetic-transposing');
  const oracle = createGraphNodeOracle({
    profile,
    identityKey: ports.identityKey,
    equalState: ports.equalState,
    initializeOwnedRegions: options.initializeOwnedRegions ?? initializeRegions(),
    admission: options.admission,
    mutations: options.mutations,
  });
  return { oracle, ports };
}

function initializeAndPublish(oracle, claim, candidate) {
  const nodePayload = payload(candidate);
  oracle.beginInitialization({ claimId: claim.claimId, payload: nodePayload });
  oracle.publishNode({ claimId: claim.claimId, payload: nodePayload });
  return nodePayload;
}

function assertOneInitializer(outcomes) {
  assert.equal(outcomes.filter(({ kind }) => kind === 'initializer').length, 1);
  assert.equal(outcomes.filter(({ kind }) => kind === 'pending').length, outcomes.length - 1);
}

export function registerGraphNodeCases({ defineCase, fixture, projection, composerEvidence, plannedCoverage }) {
  defineCase('graph-node-profile-projection-exact', () => {
    exactKeys(projection, ['producer', 'profiles', 'projectionIdentity', 'schema'], 'GRAPH_NODE_PROJECTION_FIELDS', 'Graph profile projection');
    assert.equal(projection.schema, fixture.profileProjection.schema);
    assert.deepEqual(projection.producer, {
      capsule: composerEvidence.capsule,
      representationCompositionEvidenceKey: fixture.composerEvidence,
    });
    assert.deepEqual(projection.projectionIdentity, {
      algorithm: fixture.profileProjection.algorithm,
      byteLength: fixture.profileProjection.byteLength,
      sha256: fixture.profileProjection.sha256,
    });
    assert.deepEqual(canonicalIdentity({ schema: projection.schema, producer: projection.producer, profiles: projection.profiles }), projection.projectionIdentity);
    for (const entry of projection.profiles) {
      assert.equal(entry.id, entry.normalized.id);
      assert.deepEqual(canonicalIdentity(entry.normalized), entry.identity);
      const published = composerEvidence.graphProfileIdentities.find(({ id }) => id === entry.id);
      assert.deepEqual({ id: entry.id, ...entry.identity }, published);
    }
    return { projectionIdentity: projection.projectionIdentity };
  });

  defineCase('graph-node-collision-verification-before-sharing', () => {
    const { oracle, ports } = makeOracle(projection);
    const alpha = view('alpha', 'state-a');
    const beta = view('beta', 'state-b');
    const first = oracle.lookupOrClaimNode({ claimant: 'claimer-a', scope: 'scope.shared', view: alpha });
    assert.equal(first.kind, 'initializer');
    const second = oracle.lookupOrClaimNode({ claimant: 'claimer-b', scope: 'scope.shared', view: beta });
    assert.equal(second.kind, 'initializer');
    assert.notDeepEqual(second.reference, first.reference);
    assert.deepEqual(ports.calls, ['key:alpha', 'key:beta', 'equal:beta:alpha']);
    return { first: first.reference, second: second.reference, calls: ports.calls };
  }, ['GRAPH-NODE-002', 'GRAPH-NODE-003']);

  defineCase('graph-node-competing-claimers-schedule-invariant', () => {
    const candidate = view('same', 'shared-state');
    const runOrder = (order) => {
      const { oracle } = makeOracle(projection);
      const outcomes = order.map((claimant) => oracle.lookupOrClaimNode({ claimant, scope: 'scope.shared', view: candidate }));
      assertOneInitializer(outcomes);
      const winner = outcomes.find(({ kind }) => kind === 'initializer');
      initializeAndPublish(oracle, winner, candidate);
      const terminal = outcomes.map((outcome) => oracle.observeClaim(outcome.claimId));
      assert(terminal.every(({ kind }) => kind === 'ready'));
      assert.equal(new Set(terminal.map(({ reference }) => JSON.stringify(reference))).size, 1);
      return { winner: order[outcomes.indexOf(winner)], terminal };
    };
    const alphaFirst = runOrder(['claimer-a', 'claimer-b', 'claimer-c']);
    const gammaFirst = runOrder(['claimer-c', 'claimer-b', 'claimer-a']);
    assert.notEqual(alphaFirst.winner, gammaFirst.winner);
    assert.deepEqual(alphaFirst.terminal.map(({ kind }) => kind), gammaFirst.terminal.map(({ kind }) => kind));
    return { alphaFirst: alphaFirst.winner, gammaFirst: gammaFirst.winner };
  }, ['GRAPH-NODE-003']);

  defineCase('graph-node-ready-publication-orders-payload-owner-and-entry', () => {
    const ownerLog = [];
    const { oracle } = makeOracle(projection, { initializeOwnedRegions: initializeRegions(ownerLog) });
    const candidate = view('alpha', 'state-a');
    const claim = oracle.lookupOrClaimNode({ claimant: 'claimer-a', scope: 'scope.shared', view: candidate });
    const independentlyPublishedRecord = { status: 'pending' };
    oracle.beginInitialization({ claimId: claim.claimId, payload: payload(candidate) });
    assert.equal(oracle.observeClaim(claim.claimId).kind, 'pending');
    oracle.publishNode({ claimId: claim.claimId, payload: payload(candidate) });
    const snapshot = oracle.snapshot();
    const types = snapshot.events.filter(({ claim: id }) => id === claim.claimId).map(({ type }) => type);
    const reserved = types.indexOf('node-reserved');
    const initializing = types.indexOf('node-initializing');
    const ownerReady = types.indexOf('owned-region-initialized');
    const visible = types.indexOf('payload-visible');
    const nodeReady = types.indexOf('node-ready');
    const entryReady = types.indexOf('entry-ready');
    assert(reserved < initializing && initializing < ownerReady && ownerReady < visible && visible < nodeReady && nodeReady < entryReady);
    assert.deepEqual(ownerLog, [`initialize:${claim.claimId}`]);
    assert.equal(independentlyPublishedRecord.status, 'pending');
    return { order: types, independentRecordStatus: independentlyPublishedRecord.status };
  }, ['GRAPH-NODE-001', 'GRAPH-NODE-005', 'GRAPH-NODE-010', 'GRAPH-NODE-011']);

  defineCase('graph-node-failure-wakes-waiters-and-dispositions-admission', () => {
    const { oracle } = makeOracle(projection, { admission: { nodeSlots: '2', stateBytes: '704', transpositionSlots: '2', maxCollisionProbes: '4' } });
    const candidate = view('same', 'state-a');
    const initializer = oracle.lookupOrClaimNode({ claimant: 'claimer-a', scope: 'scope.shared', view: candidate });
    const waiter = oracle.lookupOrClaimNode({ claimant: 'claimer-b', scope: 'scope.shared', view: candidate });
    assert.equal(waiter.kind, 'pending');
    oracle.failNode({ claimId: initializer.claimId, code: 'owner-lifecycle-failure' });
    assert.deepEqual(oracle.observeClaim(waiter.claimId), { kind: 'failed', code: 'owner-lifecycle-failure' });
    const snapshot = oracle.snapshot();
    assert.deepEqual(snapshot.ledger, { nodeSlots: '1', stateBytes: '352', transpositionSlots: '1' });
    assert.equal(snapshot.claims[0].entryState, 'failed');
    assert.equal(snapshot.claims[0].reservationDisposition, 'retained-failed');
    const retry = oracle.lookupOrClaimNode({ claimant: 'claimer-c', scope: 'scope.shared', view: candidate });
    assert.equal(retry.kind, 'initializer');
    return { failed: snapshot.claims[0].failure, retry: retry.reference };
  }, ['GRAPH-NODE-006', 'GRAPH-NODE-011']);

  defineCase('graph-node-compound-admission-fails-without-partial-residue', () => {
    const { oracle } = makeOracle(projection, { admission: { nodeSlots: '1', stateBytes: '352', transpositionSlots: '1', maxCollisionProbes: '4' } });
    const first = oracle.lookupOrClaimNode({ claimant: 'claimer-a', scope: 'scope.a', view: view('alpha', 'state-a', 'a') });
    assert.equal(first.kind, 'initializer');
    const before = oracle.snapshot();
    const second = oracle.lookupOrClaimNode({ claimant: 'claimer-b', scope: 'scope.b', view: view('beta', 'state-b', 'b') });
    assert.deepEqual(second, { kind: 'pressure', code: 'node-capacity' });
    const after = oracle.snapshot();
    assert.deepEqual(after.ledger, before.ledger);
    assert.equal(after.claims.length, before.claims.length);
    return { pressure: second.code, ledger: after.ledger };
  }, ['GRAPH-NODE-004']);

  defineCase('graph-node-transposition-capacity-and-probe-exhaustion-fail-closed', () => {
    const capacity = makeOracle(projection, { admission: { nodeSlots: '3', stateBytes: '1056', transpositionSlots: '1', maxCollisionProbes: '4' } }).oracle;
    const first = capacity.lookupOrClaimNode({ claimant: 'claimer-a', scope: 'scope.a', view: view('alpha', 'state-a', 'a') });
    assert.equal(first.kind, 'initializer');
    const capacityBefore = capacity.snapshot();
    const full = capacity.lookupOrClaimNode({ claimant: 'claimer-b', scope: 'scope.b', view: view('beta', 'state-b', 'b') });
    assert.deepEqual(full, { kind: 'pressure', code: 'transposition-capacity' });
    assert.deepEqual(capacity.snapshot().ledger, capacityBefore.ledger);

    const probe = makeOracle(projection, { admission: { nodeSlots: '3', stateBytes: '1056', transpositionSlots: '3', maxCollisionProbes: '1' } }).oracle;
    const collisionA = probe.lookupOrClaimNode({ claimant: 'claimer-a', scope: 'scope.shared', view: view('alpha', 'state-a') });
    assert.equal(collisionA.kind, 'initializer');
    const collisionB = probe.lookupOrClaimNode({ claimant: 'claimer-b', scope: 'scope.shared', view: view('beta', 'state-b') });
    assert.deepEqual(collisionB, { kind: 'pressure', code: 'transposition-probe-exhausted' });
    assert.equal(probe.snapshot().claims.length, 1);
    return { capacity: full.code, probe: collisionB.code };
  }, ['GRAPH-NODE-007']);

  defineCase('graph-node-isolated-profile-separates-declared-scopes', () => {
    const ports = createPortHarness();
    const { oracle } = makeOracle(projection, { profileId: 'graph.synthetic-isolated', ports, admission: { nodeSlots: '2', stateBytes: '704' } });
    const same = view('same', 'state-a');
    const left = oracle.lookupOrClaimNode({ claimant: 'claimer-a', scope: 'scope.a', view: same });
    assert.equal(left.kind, 'initializer');
    assert.throws(() => oracle.lookupOrClaimNode({ claimant: 'claimer-b', scope: 'scope.a', view: same }), { code: 'GRAPH_NODE_SCOPE_REUSE' });
    const right = oracle.lookupOrClaimNode({ claimant: 'claimer-b', scope: 'scope.b', view: same });
    assert.equal(right.kind, 'initializer');
    assert.notDeepEqual(left.reference, right.reference);
    assert.equal(ports.calls.filter((entry) => entry.startsWith('equal:')).length, 0);
    return { left: left.reference, right: right.reference };
  }, ['GRAPH-NODE-008']);

  defineCase('graph-node-domain-payload-immutable-owner-record-independent', () => {
    const { oracle } = makeOracle(projection);
    const candidate = view('alpha', 'state-a');
    const claim = oracle.lookupOrClaimNode({ claimant: 'claimer-a', scope: 'scope.shared', view: candidate });
    const nodePayload = initializeAndPublish(oracle, claim, candidate);
    const stored = oracle.readyPayload(claim.claimId);
    assert(Object.isFrozen(stored) && Object.isFrozen(stored.state));
    assert.throws(() => { stored.state.semantic = 'mutated'; }, TypeError);
    const beforeIdentity = canonicalIdentity(oracle.readyPayload(claim.claimId));
    const independentlyOwnedRecord = { score: 1 };
    independentlyOwnedRecord.score = 2;
    const afterIdentity = canonicalIdentity(oracle.readyPayload(claim.claimId));
    assert.equal(independentlyOwnedRecord.score, 2);
    assert.deepEqual(afterIdentity, beforeIdentity);
    assert.deepEqual(oracle.readyPayload(claim.claimId), nodePayload);
    return { payloadIdentity: beforeIdentity, independentRecord: independentlyOwnedRecord };
  }, ['GRAPH-NODE-009', 'GRAPH-NODE-010']);

  defineCase('graph-node-conflicting-ready-publication-is-fatal', () => {
    const { oracle } = makeOracle(projection);
    const candidate = view('alpha', 'state-a');
    const claim = oracle.lookupOrClaimNode({ claimant: 'claimer-a', scope: 'scope.shared', view: candidate });
    initializeAndPublish(oracle, claim, candidate);
    const conflicting = clone(payload(candidate));
    conflicting.state.semantic = 'other';
    assert.throws(() => oracle.publishNode({ claimId: claim.claimId, payload: conflicting }), { code: 'GRAPH_NODE_PUBLICATION_CONFLICT' });
    assert.equal(oracle.observeClaim(claim.claimId).kind, 'ready');
    return { retained: canonicalIdentity(oracle.readyPayload(claim.claimId)) };
  }, ['GRAPH-NODE-006']);

  defineCase('graph-node-oracle-sensitivity-collision-verification', () => {
    const baseline = { alpha: view('alpha', 'state-a'), beta: view('beta', 'state-b') };
    return assertMutationDetected({
      id: 'mutation.graph-node-collision-verification',
      baseline,
      mutate: (candidate) => ({ ...candidate, mutation: true }),
      evaluate: (candidate) => {
        const { oracle } = makeOracle(projection, { mutations: { skipCollisionVerification: candidate.mutation === true } });
        const first = oracle.lookupOrClaimNode({ claimant: 'claimer-a', scope: 'scope.shared', view: baseline.alpha });
        const second = oracle.lookupOrClaimNode({ claimant: 'claimer-b', scope: 'scope.shared', view: baseline.beta });
        if (first.claimId === second.claimId) {
          const error = new Error('unequal colliding state views merged');
          error.code = 'GRAPH_NODE_COLLISION_MERGE';
          throw error;
        }
      },
      expectedCode: 'GRAPH_NODE_COLLISION_MERGE',
    });
  }, ['GRAPH-NODE-002', 'GRAPH-NODE-003']);

  defineCase('graph-node-oracle-sensitivity-entry-ready-order', () => {
    return assertMutationDetected({
      id: 'mutation.graph-node-entry-ready-order',
      baseline: { publication: 'node-before-entry' },
      mutate: (candidate) => ({ ...candidate, publication: 'entry-before-node' }),
      evaluate: (candidate) => {
        const { oracle } = makeOracle(projection, { mutations: { entryReadyBeforeNode: candidate.publication === 'entry-before-node' } });
        const nodeView = view('alpha', 'state-a');
        const claim = oracle.lookupOrClaimNode({ claimant: 'claimer-a', scope: 'scope.shared', view: nodeView });
        initializeAndPublish(oracle, claim, nodeView);
        const types = oracle.snapshot().events.filter(({ claim: id }) => id === claim.claimId).map(({ type }) => type);
        if (types.indexOf('entry-ready') < types.indexOf('node-ready')) {
          const error = new Error('entry became ready before node');
          error.code = 'GRAPH_NODE_ENTRY_ORDER';
          throw error;
        }
      },
      expectedCode: 'GRAPH_NODE_ENTRY_ORDER',
    });
  }, ['GRAPH-NODE-005', 'GRAPH-NODE-011']);

  defineCase('graph-node-requirement-coverage-exact', () => plannedCoverage(), []);
}

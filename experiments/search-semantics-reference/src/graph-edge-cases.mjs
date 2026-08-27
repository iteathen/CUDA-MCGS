import assert from 'node:assert/strict';

import { canonicalClone, canonicalIdentity } from './canonical.mjs';
import { createGraphEdgeOracle } from './graph-edge.mjs';
import { createGraphNodeOracle } from './graph-node.mjs';
import { exactKeys } from './errors.mjs';
import { assertMutationDetected } from './mutation.mjs';

function clone(value) {
  return canonicalClone(value);
}

function graphProfile(projection, id = 'graph.synthetic-transposing') {
  const entry = projection.profiles.find((profile) => profile.id === id);
  assert(entry, `missing projected Graph profile ${id}`);
  return entry.normalized;
}

function refKey(reference) {
  return canonicalIdentity(reference).sha256;
}

function createNodeHarness(projection) {
  const nodes = createGraphNodeOracle({
    profile: graphProfile(projection),
    identityKey: (view) => ({ bucket: view.bucket }),
    equalState: (left, right) => left.semantic === right.semantic && left.history === right.history,
    initializeOwnedRegions: () => [],
  });
  const byLabel = new Map();
  const byReference = new Map();

  function claim(label, semantic, { bucket = label, history = 'h0', scope = 'scope.graph' } = {}) {
    const view = { label, semantic, bucket, history };
    const outcome = nodes.lookupOrClaimNode({ claimant: `node-${label}`, scope, view });
    assert.equal(outcome.kind, 'initializer');
    byLabel.set(label, { claimId: outcome.claimId, reference: outcome.reference, view });
    byReference.set(refKey(outcome.reference), outcome.claimId);
    return byLabel.get(label);
  }

  function publish(label) {
    const entry = byLabel.get(label);
    assert(entry);
    const payload = { state: { semantic: entry.view.semantic }, history: entry.view.history };
    nodes.beginInitialization({ claimId: entry.claimId, payload });
    nodes.publishNode({ claimId: entry.claimId, payload });
    return entry.reference;
  }

  function ready(label, semantic, options = {}) {
    claim(label, semantic, options);
    return publish(label);
  }

  function validateNodeReference(reference) {
    const claimId = byReference.get(refKey(reference));
    if (!claimId) return { kind: 'failure', code: 'invalid-reference' };
    return nodes.observeClaim(claimId);
  }

  function resolution(label) {
    const entry = byLabel.get(label);
    if (!entry) return { kind: 'failure', code: 'invalid-reference' };
    return nodes.observeClaim(entry.claimId);
  }

  return { nodes, claim, publish, ready, validateNodeReference, resolution, byLabel };
}

function createActionPorts() {
  const calls = [];
  return {
    calls,
    actionIdentity: ({ action }) => {
      calls.push(`identity:${action.id}`);
      return { id: action.id };
    },
    equalAction: (left, right) => {
      calls.push(`equal:${left.id}:${right.id}`);
      return left.id === right.id;
    },
    multiplicityRule: ({ action }) => {
      calls.push(`multiplicity:${action.id}`);
      return action.multiplicity ?? 'unique';
    },
  };
}

function createEdgeHarness(projection, { mutations = {}, admission = {}, childTargets = new Map() } = {}) {
  const nodeHarness = createNodeHarness(projection);
  const actionPorts = createActionPorts();
  const oracle = createGraphEdgeOracle({
    profile: graphProfile(projection),
    validateNodeReference: nodeHarness.validateNodeReference,
    resolveChild: ({ input }) => {
      const label = childTargets.get(input.target) ?? input.target;
      return nodeHarness.resolution(label);
    },
    actionIdentity: actionPorts.actionIdentity,
    equalAction: actionPorts.equalAction,
    multiplicityRule: actionPorts.multiplicityRule,
    admission,
    mutations,
  });
  return { oracle, nodes: nodeHarness, actions: actionPorts };
}

function open(oracle, parent, { claimer = 'expander-a', generation = '0' } = {}) {
  const claim = oracle.claimExpansion({ claimer, generation, parent });
  assert.equal(claim.kind, 'initializer');
  oracle.openExpansion({ claimer, expansionId: claim.expansionId });
  return { claimer, expansionId: claim.expansionId };
}

function reserveAndPublish(oracle, expansion, action, { actionBytes = '16', occurrence = null } = {}) {
  const reserved = oracle.reserveEdge({ claimer: expansion.claimer, expansionId: expansion.expansionId, action, actionBytes, occurrence });
  assert.equal(reserved.kind, 'reserved');
  oracle.publishEdgeAction({ claimer: expansion.claimer, edgeId: reserved.edgeId });
  return reserved;
}

export function registerGraphEdgeCases({ defineCase, fixture, projection, composerEvidence, plannedCoverage }) {
  defineCase('graph-edge-profile-projection-exact', () => {
    exactKeys(projection, ['producer', 'profiles', 'projectionIdentity', 'schema'], 'GRAPH_EDGE_PROJECTION_FIELDS', 'Graph profile projection');
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
    return { projectionIdentity: projection.projectionIdentity };
  });

  defineCase('graph-edge-parent-local-incoming-edges-share-child-only', () => {
    const { oracle, nodes } = createEdgeHarness(projection);
    const parentA = nodes.ready('parent-a', 'parent-a');
    const parentB = nodes.ready('parent-b', 'parent-b');
    const child = nodes.ready('shared-child', 'shared-child');
    const expansionA = open(oracle, parentA, { claimer: 'expander-a' });
    const expansionB = open(oracle, parentB, { claimer: 'expander-b' });
    const edgeA = reserveAndPublish(oracle, expansionA, { id: 'to-shared' });
    const edgeB = reserveAndPublish(oracle, expansionB, { id: 'to-shared' });
    const resolvedA = oracle.resolveEdgeChild({ claimer: expansionA.claimer, edgeId: edgeA.edgeId, input: { target: 'shared-child' } });
    const resolvedB = oracle.resolveEdgeChild({ claimer: expansionB.claimer, edgeId: edgeB.edgeId, input: { target: 'shared-child' } });
    assert.deepEqual(resolvedA.child, child);
    assert.deepEqual(resolvedB.child, child);
    assert.notDeepEqual(oracle.observeEdge(edgeA.edgeId).identity, oracle.observeEdge(edgeB.edgeId).identity);
    assert.notDeepEqual(oracle.observeEdge(edgeA.edgeId).parent, oracle.observeEdge(edgeB.edgeId).parent);
    return { edgeA: oracle.observeEdge(edgeA.edgeId).identity, edgeB: oracle.observeEdge(edgeB.edgeId).identity, child };
  }, ['GRAPH-EDGE-001', 'GRAPH-EDGE-002']);

  defineCase('graph-edge-action-ready-precedes-child-resolution', () => {
    const { oracle, nodes } = createEdgeHarness(projection);
    const parent = nodes.ready('parent', 'parent');
    nodes.ready('child', 'child');
    const expansion = open(oracle, parent);
    const reserved = oracle.reserveEdge({ claimer: expansion.claimer, expansionId: expansion.expansionId, action: { id: 'go' }, actionBytes: '16', occurrence: null });
    assert.equal(reserved.kind, 'reserved');
    assert.throws(() => oracle.resolveEdgeChild({ claimer: expansion.claimer, edgeId: reserved.edgeId, input: { target: 'child' } }), { code: 'GRAPH_EDGE_ACTION_NOT_READY' });
    oracle.publishEdgeAction({ claimer: expansion.claimer, edgeId: reserved.edgeId });
    const resolved = oracle.resolveEdgeChild({ claimer: expansion.claimer, edgeId: reserved.edgeId, input: { target: 'child' } });
    assert.equal(resolved.kind, 'ready');
    const types = oracle.snapshot().events.filter(({ ownerId }) => ownerId === reserved.edgeId).map(({ type }) => type);
    assert(types.indexOf('edge-action-ready') < types.indexOf('edge-ready'));
    return { order: types };
  }, ['GRAPH-EDGE-003', 'GRAPH-EDGE-004']);

  defineCase('graph-edge-pending-child-link-becomes-ready-without-republishing-action', () => {
    const { oracle, nodes } = createEdgeHarness(projection);
    const parent = nodes.ready('parent', 'parent');
    nodes.claim('child', 'child');
    const expansion = open(oracle, parent);
    const edge = reserveAndPublish(oracle, expansion, { id: 'go' });
    const pending = oracle.resolveEdgeChild({ claimer: expansion.claimer, edgeId: edge.edgeId, input: { target: 'child' } });
    assert.equal(pending.kind, 'pending');
    assert.equal(oracle.observeEdge(edge.edgeId).state, 'child-pending');
    assert.equal(oracle.observeEdge(edge.edgeId).child, null);
    nodes.publish('child');
    const ready = oracle.resolveEdgeChild({ claimer: expansion.claimer, edgeId: edge.edgeId, input: { target: 'child' } });
    assert.equal(ready.kind, 'ready');
    assert.equal(oracle.observeEdge(edge.edgeId).state, 'ready');
    assert(oracle.observeEdge(edge.edgeId).child !== null);
    return { pending: pending.reference, ready: ready.child };
  }, ['GRAPH-EDGE-003', 'GRAPH-EDGE-004']);

  defineCase('graph-edge-batch-publication-is-complete-and-producer-opaque', () => {
    const { oracle, nodes } = createEdgeHarness(projection);
    const parent = nodes.ready('parent', 'parent');
    const expansion = open(oracle, parent);
    const first = reserveAndPublish(oracle, expansion, { id: 'a' });
    const second = oracle.reserveEdge({ claimer: expansion.claimer, expansionId: expansion.expansionId, action: { id: 'b' }, actionBytes: '16', occurrence: null });
    const before = oracle.snapshot();
    assert.throws(() => oracle.publishExpansionBatch({ claimer: expansion.claimer, expansionId: expansion.expansionId, batchId: 'batch.0', edgeIds: [first.edgeId, second.edgeId], producer: { cursorToken: 'opaque-1', stateToken: 'more' } }), { code: 'GRAPH_EDGE_BATCH_INCOMPLETE' });
    const afterReject = oracle.snapshot();
    assert.deepEqual(afterReject.expansions[0].batches, before.expansions[0].batches);
    assert.equal(afterReject.edges.every(({ batchPublished }) => batchPublished === false), true);
    oracle.publishEdgeAction({ claimer: expansion.claimer, edgeId: second.edgeId });
    const producer = { cursorToken: 'opaque-1', stateToken: 'more' };
    const batch = oracle.publishExpansionBatch({ claimer: expansion.claimer, expansionId: expansion.expansionId, batchId: 'batch.0', edgeIds: [first.edgeId, second.edgeId], producer });
    assert.deepEqual(batch.producer, producer);
    return { batch };
  }, ['GRAPH-EDGE-005']);

  defineCase('graph-edge-explicit-multiplicity-controls-duplicates', () => {
    const { oracle, nodes } = createEdgeHarness(projection);
    const parent = nodes.ready('parent', 'parent');
    const expansion = open(oracle, parent);
    reserveAndPublish(oracle, expansion, { id: 'unique' });
    assert.throws(() => oracle.reserveEdge({ claimer: expansion.claimer, expansionId: expansion.expansionId, action: { id: 'unique' }, actionBytes: '16', occurrence: null }), { code: 'GRAPH_EDGE_DUPLICATE_ACTION' });
    const sampleA = reserveAndPublish(oracle, expansion, { id: 'sample', multiplicity: 'repeatable' }, { occurrence: 'sample.0' });
    const sampleB = reserveAndPublish(oracle, expansion, { id: 'sample', multiplicity: 'repeatable' }, { occurrence: 'sample.1' });
    assert.notDeepEqual(sampleA.identity, sampleB.identity);
    assert.throws(() => oracle.reserveEdge({ claimer: expansion.claimer, expansionId: expansion.expansionId, action: { id: 'sample', multiplicity: 'repeatable' }, actionBytes: '16', occurrence: 'sample.1' }), { code: 'GRAPH_EDGE_DUPLICATE_OCCURRENCE' });
    return { sampleA: sampleA.identity, sampleB: sampleB.identity };
  }, ['GRAPH-EDGE-006']);

  defineCase('graph-edge-failure-and-expansion-cancellation-are-terminal-and-conservative', () => {
    const { oracle, nodes } = createEdgeHarness(projection, { admission: { edgeSlots: '2', actionBytes: '64' } });
    const parent = nodes.ready('parent', 'parent');
    const expansionClaim = oracle.claimExpansion({ claimer: 'expander-a', generation: '0', parent });
    const waiter = oracle.claimExpansion({ claimer: 'expander-b', generation: '0', parent });
    assert.equal(waiter.kind, 'pending');
    oracle.openExpansion({ claimer: 'expander-a', expansionId: expansionClaim.expansionId });
    const edge = reserveAndPublish(oracle, { claimer: 'expander-a', expansionId: expansionClaim.expansionId }, { id: 'unpublished-batch-edge' });
    const before = oracle.snapshot();
    assert.deepEqual(before.ledger, { edgeSlots: '1', actionBytes: '16' });
    const cancelled = oracle.failExpansion({ claimer: 'expander-a', expansionId: expansionClaim.expansionId, code: 'cancelled', cancelled: true });
    assert.equal(cancelled.state, 'cancelled');
    assert.equal(oracle.observeEdge(edge.edgeId).state, 'failed');
    assert.equal(oracle.observeEdge(edge.edgeId).child, null);
    assert.equal(oracle.observeEdge(edge.edgeId).reservationDisposition, 'rolled-back');
    assert.deepEqual(oracle.snapshot().ledger, { edgeSlots: '0', actionBytes: '0' });
    assert.equal(oracle.observeExpansion(waiter.expansionId).state, 'cancelled');
    return { expansion: cancelled.state, disposition: oracle.observeEdge(edge.edgeId).reservationDisposition };
  }, ['GRAPH-EDGE-007', 'GRAPH-EDGE-009']);

  defineCase('graph-edge-later-batches-remain-admissible-until-declared-capacity', () => {
    const { oracle, nodes } = createEdgeHarness(projection, { admission: { edgeSlots: '3', actionBytes: '48' } });
    const parent = nodes.ready('parent', 'parent');
    const expansion = open(oracle, parent);
    for (let index = 0; index < 3; index += 1) {
      const edge = reserveAndPublish(oracle, expansion, { id: `action-${index}` });
      oracle.publishExpansionBatch({ claimer: expansion.claimer, expansionId: expansion.expansionId, batchId: `batch.${index}`, edgeIds: [edge.edgeId], producer: { cursorToken: `cursor-${index}`, stateToken: index === 2 ? 'last' : 'more' } });
    }
    const pressure = oracle.reserveEdge({ claimer: expansion.claimer, expansionId: expansion.expansionId, action: { id: 'action-3' }, actionBytes: '16', occurrence: null });
    assert.deepEqual(pressure, { kind: 'pressure', code: 'edge-capacity' });
    assert.equal(oracle.observeExpansion(expansion.expansionId).batches.length, 3);
    oracle.completeExpansion({ claimer: expansion.claimer, expansionId: expansion.expansionId });
    return { batches: 3, pressure: pressure.code };
  }, ['GRAPH-EDGE-008', 'GRAPH-EDGE-009']);

  defineCase('graph-edge-expansion-generation-has-one-advancing-claimer', () => {
    const { oracle, nodes } = createEdgeHarness(projection);
    const parent = nodes.ready('parent', 'parent');
    const winner = oracle.claimExpansion({ claimer: 'expander-a', generation: '7', parent });
    const waiter = oracle.claimExpansion({ claimer: 'expander-b', generation: '7', parent });
    assert.equal(winner.kind, 'initializer');
    assert.deepEqual(waiter, { kind: 'pending', expansionId: winner.expansionId, state: 'claimed' });
    assert.throws(() => oracle.openExpansion({ claimer: 'expander-b', expansionId: winner.expansionId }), { code: 'GRAPH_EDGE_EXPANSION_OWNER' });
    oracle.openExpansion({ claimer: 'expander-a', expansionId: winner.expansionId });
    oracle.completeExpansion({ claimer: 'expander-a', expansionId: winner.expansionId });
    const terminal = oracle.claimExpansion({ claimer: 'expander-c', generation: '7', parent });
    assert.deepEqual(terminal, { kind: 'terminal', expansionId: winner.expansionId, state: 'complete', failure: null });
    return { winner: 'expander-a', terminal: terminal.state };
  }, ['GRAPH-EDGE-009']);

  defineCase('graph-edge-structural-ready-does-not-publish-foreign-records', () => {
    const { oracle, nodes } = createEdgeHarness(projection);
    const parent = nodes.ready('parent', 'parent');
    nodes.ready('child', 'child');
    const policyRecord = { status: 'pending', value: null };
    const evaluatorRecord = { status: 'pending', value: null };
    const expansion = open(oracle, parent);
    const edge = reserveAndPublish(oracle, expansion, { id: 'go' });
    oracle.resolveEdgeChild({ claimer: expansion.claimer, edgeId: edge.edgeId, input: { target: 'child' } });
    assert.equal(oracle.observeEdge(edge.edgeId).state, 'ready');
    assert.deepEqual(policyRecord, { status: 'pending', value: null });
    assert.deepEqual(evaluatorRecord, { status: 'pending', value: null });
    return { edgeState: 'ready', policyRecord, evaluatorRecord };
  }, ['GRAPH-EDGE-010']);

  defineCase('graph-edge-oracle-sensitivity-parent-identity', () => {
    return assertMutationDetected({
      id: 'mutation.graph-edge-parent-identity',
      baseline: { omitParent: false },
      mutate: () => ({ omitParent: true }),
      evaluate: (candidate) => {
        const { oracle, nodes } = createEdgeHarness(projection, { mutations: { omitParentFromEdgeIdentity: candidate.omitParent } });
        const parentA = nodes.ready('parent-a', 'parent-a');
        const parentB = nodes.ready('parent-b', 'parent-b');
        const expansionA = open(oracle, parentA, { claimer: 'expander-a' });
        const expansionB = open(oracle, parentB, { claimer: 'expander-b' });
        const edgeA = reserveAndPublish(oracle, expansionA, { id: 'same' });
        const edgeB = reserveAndPublish(oracle, expansionB, { id: 'same' });
        if (edgeA.identity.sha256 === edgeB.identity.sha256) {
          const error = new Error('parent-local edge identity collapsed');
          error.code = 'GRAPH_EDGE_PARENT_IDENTITY';
          throw error;
        }
      },
      expectedCode: 'GRAPH_EDGE_PARENT_IDENTITY',
    });
  }, ['GRAPH-EDGE-001', 'GRAPH-EDGE-002']);

  defineCase('graph-edge-oracle-sensitivity-action-before-child', () => {
    return assertMutationDetected({
      id: 'mutation.graph-edge-action-before-child',
      baseline: { allowEarlyChild: false },
      mutate: () => ({ allowEarlyChild: true }),
      evaluate: (candidate) => {
        const { oracle, nodes } = createEdgeHarness(projection, { mutations: { allowChildBeforeAction: candidate.allowEarlyChild } });
        const parent = nodes.ready('parent', 'parent');
        nodes.ready('child', 'child');
        const expansion = open(oracle, parent);
        const edge = oracle.reserveEdge({ claimer: expansion.claimer, expansionId: expansion.expansionId, action: { id: 'go' }, actionBytes: '16', occurrence: null });
        let resolved = false;
        try {
          const outcome = oracle.resolveEdgeChild({ claimer: expansion.claimer, edgeId: edge.edgeId, input: { target: 'child' } });
          resolved = outcome.kind === 'ready';
        } catch (error) {
          if (error.code === 'GRAPH_EDGE_ACTION_NOT_READY') return;
          throw error;
        }
        if (resolved) {
          const error = new Error('child resolved before action publication');
          error.code = 'GRAPH_EDGE_EARLY_CHILD';
          throw error;
        }
      },
      expectedCode: 'GRAPH_EDGE_EARLY_CHILD',
    });
  }, ['GRAPH-EDGE-004']);

  defineCase('graph-edge-oracle-sensitivity-partial-batch', () => {
    return assertMutationDetected({
      id: 'mutation.graph-edge-partial-batch',
      baseline: { allowPartialBatch: false },
      mutate: () => ({ allowPartialBatch: true }),
      evaluate: (candidate) => {
        const { oracle, nodes } = createEdgeHarness(projection, { mutations: { allowPartialBatch: candidate.allowPartialBatch } });
        const parent = nodes.ready('parent', 'parent');
        const expansion = open(oracle, parent);
        const first = reserveAndPublish(oracle, expansion, { id: 'a' });
        const second = oracle.reserveEdge({ claimer: expansion.claimer, expansionId: expansion.expansionId, action: { id: 'b' }, actionBytes: '16', occurrence: null });
        let published = false;
        try {
          const batch = oracle.publishExpansionBatch({ claimer: expansion.claimer, expansionId: expansion.expansionId, batchId: 'batch.partial', edgeIds: [first.edgeId, second.edgeId], producer: { cursorToken: 'opaque', stateToken: 'more' } });
          published = batch.edgeIds.length !== 0;
        } catch (error) {
          if (error.code === 'GRAPH_EDGE_BATCH_INCOMPLETE') return;
          throw error;
        }
        if (published) {
          const error = new Error('partial action batch became visible');
          error.code = 'GRAPH_EDGE_PARTIAL_BATCH';
          throw error;
        }
      },
      expectedCode: 'GRAPH_EDGE_PARTIAL_BATCH',
    });
  }, ['GRAPH-EDGE-005']);

  defineCase('graph-edge-requirement-coverage-exact', () => plannedCoverage(), []);
}

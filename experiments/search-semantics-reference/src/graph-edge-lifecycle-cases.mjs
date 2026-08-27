import assert from 'node:assert/strict';

import { canonicalIdentity } from './canonical.mjs';
import { createGraphEdgeOracle } from './graph-edge.mjs';
import { createGraphNodeOracle } from './graph-node.mjs';

function refKey(reference) {
  return canonicalIdentity(reference).sha256;
}

export function registerGraphEdgeLifecycleCases({ defineCase, projection }) {
  defineCase('graph-edge-published-pending-cancel-terminal', () => {
    const profile = projection.profiles.find(({ id }) => id === 'graph.synthetic-transposing')?.normalized;
    assert(profile);
    const nodes = createGraphNodeOracle({
      profile,
      identityKey: (view) => ({ bucket: view.bucket }),
      equalState: (left, right) => left.semantic === right.semantic,
      initializeOwnedRegions: () => [],
    });
    const byLabel = new Map();
    const byReference = new Map();
    const claimNode = (label, semantic, publish) => {
      const view = { label, semantic, bucket: label };
      const claim = nodes.lookupOrClaimNode({ claimant: `node-${label}`, scope: 'scope.edge-cancel', view });
      assert.equal(claim.kind, 'initializer');
      byLabel.set(label, claim.claimId);
      byReference.set(refKey(claim.reference), claim.claimId);
      if (publish) {
        const payload = { state: { semantic }, history: null };
        nodes.beginInitialization({ claimId: claim.claimId, payload });
        nodes.publishNode({ claimId: claim.claimId, payload });
      }
      return claim.reference;
    };
    const parent = claimNode('parent', 'parent', true);
    claimNode('child', 'child', false);
    const validateNodeReference = (reference) => {
      const claimId = byReference.get(refKey(reference));
      return claimId ? nodes.observeClaim(claimId) : { kind: 'failure', code: 'invalid-reference' };
    };
    const resolveChild = ({ input }) => {
      const claimId = byLabel.get(input.target);
      return claimId ? nodes.observeClaim(claimId) : { kind: 'failure', code: 'invalid-reference' };
    };
    const edges = createGraphEdgeOracle({
      profile,
      validateNodeReference,
      resolveChild,
      actionIdentity: ({ action }) => ({ id: action.id }),
      equalAction: (left, right) => left.id === right.id,
      multiplicityRule: () => 'unique',
      admission: { edgeSlots: '2', actionBytes: '32' },
    });
    const expansion = edges.claimExpansion({ claimer: 'expander-a', generation: '0', parent });
    assert.equal(expansion.kind, 'initializer');
    edges.openExpansion({ claimer: 'expander-a', expansionId: expansion.expansionId });
    const edge = edges.reserveEdge({ claimer: 'expander-a', expansionId: expansion.expansionId, action: { id: 'go' }, actionBytes: '16', occurrence: null });
    edges.publishEdgeAction({ claimer: 'expander-a', edgeId: edge.edgeId });
    edges.publishExpansionBatch({ claimer: 'expander-a', expansionId: expansion.expansionId, batchId: 'batch.0', edgeIds: [edge.edgeId], producer: { cursorToken: 'opaque', stateToken: 'more' } });
    const pending = edges.resolveEdgeChild({ claimer: 'expander-a', edgeId: edge.edgeId, input: { target: 'child' } });
    assert.equal(pending.kind, 'pending');
    assert.equal(edges.observeEdge(edge.edgeId).state, 'child-pending');
    assert.equal(edges.observeEdge(edge.edgeId).batchPublished, true);

    const cancelled = edges.failExpansion({ claimer: 'expander-a', expansionId: expansion.expansionId, code: 'cancelled', cancelled: true });
    assert.equal(cancelled.state, 'cancelled');
    const terminalEdge = edges.observeEdge(edge.edgeId);
    assert.equal(terminalEdge.state, 'failed');
    assert.equal(terminalEdge.child, null);
    assert.equal(terminalEdge.pendingChild, null);
    assert.equal(terminalEdge.reservationDisposition, 'published-failed');
    assert.deepEqual(edges.snapshot().ledger, { edgeSlots: '1', actionBytes: '16' });
    return { expansion: cancelled.state, edge: terminalEdge.state, disposition: terminalEdge.reservationDisposition };
  }, ['GRAPH-EDGE-007', 'GRAPH-EDGE-009']);
}

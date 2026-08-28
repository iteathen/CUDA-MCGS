import assert from 'node:assert/strict';

import { createGraphNodeOracle } from './graph-node.mjs';
import { reconcileGraphArenaRelease, validateRetainedGraphArtifacts } from './graph-cleanup.mjs';

function profileById(projection, id = 'graph.synthetic-transposing') {
  const entry = projection.profiles.find((candidate) => candidate.id === id);
  assert(entry, `missing Graph profile ${id}`);
  return entry.normalized;
}

function passed(evidence, id) {
  const entry = evidence.cases.find((candidate) => candidate.id === id);
  assert(entry, `${evidence.capsule} missing case ${id}`);
  assert.equal(entry.status, 'pass', `${id} must be passing evidence`);
  return entry;
}

function view(label, semantic, bucket = 'shared', history = 'h0') {
  return { label, semantic, bucket, history };
}

function payload(candidate) {
  return { state: { semantic: candidate.semantic }, history: candidate.history };
}

function makeNodeOracle(projection, { equalState } = {}) {
  const profile = profileById(projection);
  return createGraphNodeOracle({
    profile,
    identityKey: (candidate) => ({ bucket: candidate.bucket }),
    equalState: equalState ?? ((left, right) => left.semantic === right.semantic && left.history === right.history),
    initializeOwnedRegions: () => [{ id: 'region.structural', status: 'ready' }],
  });
}

function initializeAndPublish(oracle, claim, candidate) {
  const nodePayload = payload(candidate);
  oracle.beginInitialization({ claimId: claim.claimId, payload: nodePayload });
  oracle.publishNode({ claimId: claim.claimId, payload: nodePayload });
  return nodePayload;
}

export function registerGraphCleanupCases({
  defineCase,
  fixture,
  projection,
  nodeEvidence,
  edgeEvidence,
  refEvidence,
  pathEvidence,
  rootEvidence,
  reclaimEvidence,
  advanceOccurrenceEvidence,
  plannedCoverage,
}) {
  defineCase('graph-cleanup-upstream-evidence-exact', () => {
    assert.deepEqual(projection.projectionIdentity, {
      algorithm: fixture.profileProjection.algorithm,
      byteLength: fixture.profileProjection.byteLength,
      sha256: fixture.profileProjection.sha256,
    });
    assert.deepEqual(nodeEvidence.evidenceIdentity, fixture.nodeEvidence);
    assert.deepEqual(edgeEvidence.evidenceIdentity, fixture.edgeEvidence);
    assert.deepEqual(refEvidence.evidenceIdentity, fixture.refEvidence);
    assert.deepEqual(pathEvidence.evidenceIdentity, fixture.pathEvidence);
    assert.deepEqual(rootEvidence.evidenceIdentity, fixture.rootEvidence);
    assert.deepEqual(reclaimEvidence.evidenceIdentity, fixture.reclaimEvidence);
    assert.deepEqual(advanceOccurrenceEvidence.evidenceIdentity, fixture.advanceOccurrenceEvidence);
    for (const evidence of [nodeEvidence, edgeEvidence, refEvidence, pathEvidence, rootEvidence, reclaimEvidence, advanceOccurrenceEvidence]) {
      assert.equal(evidence.status, 'pass');
    }
    return { upstreamOwners: 7 };
  });

  defineCase('graph-cleanup-terminal-dispositions-have-no-abandoned-owner-local-obligation', () => {
    const required = [
      [nodeEvidence, 'graph-node-failure-wakes-waiters-and-dispositions-admission'],
      [edgeEvidence, 'graph-edge-failure-and-expansion-cancellation-are-terminal-and-conservative'],
      [edgeEvidence, 'graph-edge-published-pending-cancel-terminal'],
      [refEvidence, 'graph-ref-protection-before-retirement-blocks-until-one-exact-release'],
      [pathEvidence, 'graph-path-close-abandon-releases-protections-once-before-reuse'],
      [reclaimEvidence, 'graph-reclaim-cancellation-leaves-valid-quarantine-and-resumes'],
      [reclaimEvidence, 'graph-reclaim-owner-failure-quarantines-without-half-reuse'],
    ];
    for (const [evidence, id] of required) passed(evidence, id);
    return { terminalOwnerCases: required.map(([, id]) => id) };
  }, ['GRAPH-CLEANUP-001']);

  defineCase('graph-cleanup-semantic-inconsistency-quarantines-and-invalidates-dependent-node-evidence', () => {
    const oracle = makeNodeOracle(projection);
    const candidate = view('alpha', 'state-a');
    const claim = oracle.lookupOrClaimNode({ claimant: 'claimer-a', scope: 'scope.shared', view: candidate });
    initializeAndPublish(oracle, claim, candidate);
    const conflicting = payload(candidate);
    conflicting.state.semantic = 'other';
    assert.throws(() => oracle.publishNode({ claimId: claim.claimId, payload: conflicting }), { code: 'GRAPH_NODE_PUBLICATION_CONFLICT' });
    assert.deepEqual(oracle.observeClaim(claim.claimId), { kind: 'quarantined', code: 'publication-conflict', evidenceValid: false });
    assert.throws(() => oracle.readyPayload(claim.claimId), { code: 'GRAPH_NODE_ARENA_QUARANTINED' });
    assert.throws(() => oracle.lookupOrClaimNode({ claimant: 'late', scope: 'scope.shared', view: candidate }), { code: 'GRAPH_NODE_ARENA_QUARANTINED' });
    const conflictSnapshot = oracle.snapshot();
    assert.equal(conflictSnapshot.arena.status, 'quarantined');
    assert.equal(conflictSnapshot.arena.evidenceValid, false);

    let comparison = 0;
    const equalityOracle = makeNodeOracle(projection, {
      equalState: (left, right) => {
        if (new Set([left.label, right.label]).size === 2) return ++comparison === 1 ? false : true;
        return left.semantic === right.semantic && left.history === right.history;
      },
    });
    const alpha = view('alpha', 'state-a');
    const beta = view('beta', 'state-b');
    const alphaClaim = equalityOracle.lookupOrClaimNode({ claimant: 'a', scope: 'scope.shared', view: alpha });
    initializeAndPublish(equalityOracle, alphaClaim, alpha);
    assert.equal(equalityOracle.lookupOrClaimNode({ claimant: 'b1', scope: 'scope.shared', view: beta }).kind, 'initializer');
    assert.throws(() => equalityOracle.lookupOrClaimNode({ claimant: 'b2', scope: 'scope.shared', view: beta }), { code: 'GRAPH_NODE_EQUALITY_INCONSISTENCY' });
    assert.equal(equalityOracle.snapshot().arena.status, 'quarantined');
    assert.equal(equalityOracle.snapshot().arena.evidenceValid, false);

    passed(refEvidence, 'graph-ref-stale-generation-cannot-read-protect-or-publish-replacement');
    passed(refEvidence, 'graph-ref-generation-exhaustion-never-wraps-and-has-no-32-bit-limit');
    passed(reclaimEvidence, 'graph-reclaim-owner-failure-quarantines-without-half-reuse');
    return {
      publicationConflictQuarantined: true,
      equalityInconsistencyQuarantined: true,
      generationAliasPrevented: true,
      uncertainOwnerCleanupQuarantined: true,
    };
  }, ['GRAPH-CLEANUP-002']);

  defineCase('graph-cleanup-arena-release-reconciles-all-graph-owned-transients-before-native-destruction', () => {
    const cleanLedger = {
      byteLedgerOutstanding: '0', diagnosticRecords: '0', edgeRecords: '0', expansionRecords: '0', nodeClaims: '0',
      ownerRegionLeases: '0', pathOccurrences: '0', protections: '0', retirementRecords: '0', transpositionEntries: '0',
    };
    assert.deepEqual(reconcileGraphArenaRelease({ ledger: cleanLedger, nativeResourcesDestroyed: false }), {
      kind: 'ready-for-native-destruction', graphCleanupComplete: true, nativeResourcesDestroyed: false,
    });
    for (const field of Object.keys(cleanLedger)) {
      const dirty = { ...cleanLedger, [field]: '1' };
      const blocked = reconcileGraphArenaRelease({ ledger: dirty, nativeResourcesDestroyed: false });
      assert.equal(blocked.kind, 'blocked');
      assert.deepEqual(blocked.outstanding, [{ field, count: '1' }]);
    }
    assert.throws(() => reconcileGraphArenaRelease({ ledger: cleanLedger, nativeResourcesDestroyed: true }), { code: 'GRAPH_CLEANUP_ORDER' });
    passed(pathEvidence, 'graph-path-close-abandon-releases-protections-once-before-reuse');
    passed(reclaimEvidence, 'graph-reclaim-retirement-record-reuses-without-capacity-leak');
    passed(advanceOccurrenceEvidence, 'graph-advance-occurrence-retained-borrow-gates-quiescence-and-reuse-is-generation-safe');
    return { reconciledFields: Object.keys(cleanLedger), nativeDestructionOwnedDownstream: true };
  }, ['GRAPH-CLEANUP-003']);

  defineCase('graph-cleanup-retained-artifact-provenance-is-explicit-or-absent', () => {
    assert.deepEqual(validateRetainedGraphArtifacts([]), { kind: 'retained-artifacts-valid', count: '0', artifacts: [] });
    const artifact = {
      owner: 'ENGINE-REFERENCE-01',
      profileIdentity: fixture.profileProjection.sha256,
      packageIdentity: fixture.composerEvidence.sha256,
      recoveryPurpose: 'reproduce-graph-cleanup-reference-evidence',
      cleanupTrigger: 'delete-after-evidence-retention-policy-or-superseding-qualified-packet',
    };
    const validated = validateRetainedGraphArtifacts([artifact]);
    assert.equal(validated.kind, 'retained-artifacts-valid');
    assert.equal(validated.count, '1');
    assert.equal(validated.artifacts[0].kind, 'retained-artifact-valid');
    for (const field of Object.keys(artifact)) {
      assert.throws(() => validateRetainedGraphArtifacts([{ ...artifact, [field]: '' }]), { code: 'GRAPH_CLEANUP_ARTIFACT' });
    }
    return { zeroRetentionValid: true, explicitRetentionValid: true, requiredFields: Object.keys(artifact).sort() };
  }, ['GRAPH-CLEANUP-004']);

  defineCase('graph-cleanup-requirement-coverage-exact', () => {
    const coverage = plannedCoverage();
    assert.equal(coverage.requirementCount, 4);
    assert.deepEqual(coverage.requirements.map(({ id }) => id), [
      'GRAPH-CLEANUP-001', 'GRAPH-CLEANUP-002', 'GRAPH-CLEANUP-003', 'GRAPH-CLEANUP-004',
    ]);
    assert(coverage.requirements.every(({ cases }) => cases.length > 0));
    return coverage;
  });
}

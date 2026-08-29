import assert from 'node:assert/strict';

import { createEvaluatorOracle } from './evaluator.mjs';
import { executeComplete, form, getProfile, ref, requestInput, workspaceAdmission } from './evaluator-case-support.mjs';

export function registerEvaluatorReuseCleanupCases({ defineCase, projection }) {
  const vector = getProfile(projection, 'evaluator.synthetic-vector-combined');
  const proof = getProfile(projection, 'evaluator.synthetic-proof-evaluation-only');
  const analytic = getProfile(projection, 'evaluator.synthetic-analytic-evaluation-only');
  const sensitive = getProfile(projection, 'evaluator.synthetic-batch-sensitive-resumable');

  defineCase('evaluator-reroot-reuse-transaction', () => {
    const oracle = createEvaluatorOracle({ profile: analytic });
    const input = requestInput(analytic, 'reroot');
    oracle.admitRequest(input);
    assert.deepEqual(oracle.classifyReuse({ classId: 'evaluator.result', keyValid: true }), { kind: 'classification', classId: 'evaluator.result', disposition: 'retain-if-key-valid', action: 'retain' });
    assert.deepEqual(oracle.classifyReuse({ classId: 'evaluator.result', keyValid: false }), { kind: 'classification', classId: 'evaluator.result', disposition: 'retain-if-key-valid', action: 'invalidate' });
    const blocked = oracle.applyRerootAction({ action: 'invalidate', admission: { approved: false, token: null }, classId: 'evaluator.request', keyValid: false, operationId: 'reroot-blocked' });
    assert.deepEqual(blocked, { kind: 'pressure', code: 'reroot-action-capacity' });
    assert.equal(oracle.observeRequest(ref(input)).state, 'queued', 'failed new-root admission must preserve current evaluator state');
    const beforeApply = oracle.snapshot().reuseClassifications;
    const applied = oracle.applyRerootAction({ action: 'invalidate', admission: { approved: true, token: 'reroot-token' }, classId: 'evaluator.request', keyValid: false, operationId: 'reroot-applied' });
    assert.equal(applied.kind, 'terminal');
    assert.equal(oracle.observeRequest(ref(input)).state, 'stale');
    assert.throws(() => oracle.applyRerootAction({ action: 'invalidate', admission: { approved: true, token: 'reroot-token' }, classId: 'evaluator.request', keyValid: false, operationId: 'reroot-applied' }), { code: 'EVALUATOR_REFERENCE_REUSE_ACTION' });
    assert.equal(BigInt(oracle.snapshot().reuseClassifications), BigInt(beforeApply) + 1n, 'a rejected duplicate reroot operation must not reclassify reuse');
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { explicitReuseOwner: true, admissionAtomic: true, duplicateOperationNoSideEffect: true };
  }, ['EVAL-REUSE-001', 'EVAL-REUSE-004', 'EVAL-REUSE-005']);
  defineCase('evaluator-advance-history-provenance', () => {
    const historyOracle = createEvaluatorOracle({ profile: vector });
    const historyRequest = requestInput(vector, 'advance-history', { rootEpoch: '0', rootIndependent: false });
    historyOracle.admitRequest(historyRequest);
    const before = historyOracle.snapshot().reuseClassifications;
    const applied = historyOracle.applyAdvanceFacts({ newRootEpoch: '1', retainedValidity: [{ classId: 'evaluator.cache', keyValid: false }, { classId: 'evaluator.result', keyValid: false }] });
    assert.equal(applied.reuseClassifications, before, 'advance must not invoke reroot reuse classification');
    assert.equal(historyOracle.observeRequest(ref(historyRequest)).state, 'stale');
    assert(applied.retained.every(({ usable }) => usable === false));
    assert.equal(historyOracle.cleanup().runtimeResidue, 0);

    const rootIndependentOracle = createEvaluatorOracle({ profile: analytic });
    const rootIndependent = requestInput(analytic, 'advance-independent', { rootEpoch: '0', rootIndependent: true });
    rootIndependentOracle.admitRequest(rootIndependent);
    rootIndependentOracle.applyAdvanceFacts({ newRootEpoch: '340282366920938463463374607431768211456', retainedValidity: [{ classId: 'evaluator.result', keyValid: true }] });
    assert.equal(rootIndependentOracle.observeRequest(ref(rootIndependent)).state, 'queued', 'root-independent exact-key work may survive advance');
    rootIndependentOracle.cancelRequest({ ...ref(rootIndependent), reason: 'case-end' });
    assert.equal(rootIndependentOracle.cleanup().runtimeResidue, 0);
    return { historyKeyRequired: true, advanceReclassificationCount: before, arbitraryWidthEpoch: true };
  }, ['EVAL-REUSE-002', 'EVAL-REUSE-003', 'EVAL-REUSE-004', 'EVAL-REUSE-006']);
  defineCase('evaluator-cleanup-complete-disposition', () => {
    const oracle = createEvaluatorOracle({ profile: proof });
    const input = requestInput(proof, 'cleanup');
    oracle.admitRequest(input);
    form(oracle, proof, 'cleanup-batch', [input]);
    executeComplete(oracle, proof, 'cleanup-batch', [input]);
    oracle.scatterBatch({ batchId: 'cleanup-batch' });
    const cleanup = oracle.cleanup();
    assert.equal(cleanup.kind, 'complete');
    assert.equal(cleanup.runtimeResidue, 0);
    assert.deepEqual(cleanup.dispositions.map(({ classId }) => classId), proof.cleanup.classes);
    assert(cleanup.dispositions.every(({ disposition }) => disposition === 'released'));
    const removed = oracle.removeCapability({ capabilityId: proof.capabilities[0].id, retainEvidence: true });
    assert.equal(removed.kind, 'capability-removed');
    assert.equal(removed.runtimeResidue, 0);
    assert.equal(removed.capabilityId, proof.capabilities[0].id);
    assert.equal(oracle.snapshot().selection, 'removed');
    return { dispositions: cleanup.dispositions.length, soleCapabilityDeletionZeroResidue: true };
  }, ['EVAL-CLEANUP-001', 'EVAL-CLEANUP-003']);
  defineCase('evaluator-cleanup-quarantine', () => {
    const oracle = createEvaluatorOracle({ profile: vector });
    const input = requestInput(vector, 'quarantine');
    oracle.admitRequest(input);
    const capabilityId = vector.capabilities[0].id;
    oracle.publishCapability({ ...ref(input), capabilityId, payload: { token: 'first' }, validity: { complete: true }, source: 'fresh-execution' });
    assert.throws(() => oracle.publishCapability({ ...ref(input), capabilityId, payload: { token: 'conflict' }, validity: { complete: true }, source: 'fresh-execution' }), { code: 'EVALUATOR_REFERENCE_PUBLICATION_CONFLICT' });
    const snapshot = oracle.snapshot();
    assert.equal(snapshot.evidenceValid, false);
    assert.equal(snapshot.quarantine.code, 'conflicting-publication');
    assert.equal(oracle.observeRequest(ref(input)).state, 'failed');
    const cleanup = oracle.cleanup();
    assert.equal(cleanup.kind, 'quarantined');
    assert.equal(cleanup.runtimeResidue, 0);
    assert.equal(cleanup.evidenceValid, false);
    return { quarantined: snapshot.quarantine.code };
  }, ['EVAL-CLEANUP-002']);
  defineCase('evaluator-uncertain-mutable-state-quarantine', () => {
    const oracle = createEvaluatorOracle({ profile: sensitive });
    const input = requestInput(sensitive, 'mutable-quarantine');
    oracle.admitRequest(input);
    form(oracle, sensitive, 'mutable-quarantine-batch', [input]);
    const pending = oracle.executeBatch({ batchId: 'mutable-quarantine-batch', continuation: { kind: 'pending', progressToken: 'p', workspaceAdmission: workspaceAdmission(sensitive, 'per-continuation', 'mutable-quarantine') }, results: [] });
    assert.equal(pending.kind, 'pending');
    assert.throws(() => oracle.commitMutableState({ batchId: 'mutable-quarantine-batch', certain: false, expectedGeneration: '0', nextGeneration: '1', updateIdentity: 'uncertain' }), { code: 'EVALUATOR_REFERENCE_MUTABLE_STATE_QUARANTINE' });
    assert.equal(oracle.assertAccounting().activeWorkspaces, 0);
    assert.equal(oracle.observeRequest(ref(input)).state, 'failed');
    const cleanup = oracle.cleanup();
    assert.equal(cleanup.kind, 'quarantined');
    assert.equal(cleanup.runtimeResidue, 0);
    return { uncertainStateCannotBecomeEvidence: true };
  }, ['EVAL-BATCH-010', 'EVAL-CLEANUP-002']);
}

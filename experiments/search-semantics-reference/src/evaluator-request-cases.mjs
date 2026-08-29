import assert from 'node:assert/strict';

import { createEvaluatorOracle } from './evaluator.mjs';
import { getProfile, ref, requestInput } from './evaluator-case-support.mjs';

export function registerEvaluatorRequestCases({ defineCase, projection }) {
  const vector = getProfile(projection, 'evaluator.synthetic-vector-combined');
  const proposalOnly = getProfile(projection, 'evaluator.synthetic-proposal-only-stateless');
  const analytic = getProfile(projection, 'evaluator.synthetic-analytic-evaluation-only');

  defineCase('evaluator-absent-zero-residue', () => {
    const oracle = createEvaluatorOracle();
    assert.deepEqual(oracle.snapshot(), {
      selection: 'absent', requests: 0, batches: 0, workspaces: 0, cacheEntries: 0, quarantine: null, evidenceValid: true,
    });
    assert.throws(() => oracle.admitRequest({}), { code: 'EVALUATOR_REFERENCE_ABSENT' });
    assert.deepEqual(oracle.cleanup(), { kind: 'complete', selection: 'absent', runtimeResidue: 0, evidenceValid: true });
    assert.deepEqual(oracle.removeEvaluator(), { kind: 'removed', selection: 'absent', runtimeResidue: 0 });
    assert.equal(proposalOnly.cache.kind, 'none');
    return { zeroResidue: true };
  }, ['EVAL-CACHE-001', 'EVAL-CLEANUP-001', 'EVAL-CLEANUP-003']);
  defineCase('evaluator-request-admission-atomicity', () => {
    const oracle = createEvaluatorOracle({ profile: analytic, admission: { maxActive: '1' } });
    const denied = requestInput(analytic, 'denied', { admission: { approved: false, token: null } });
    assert.deepEqual(oracle.admitRequest(denied), { kind: 'pressure', code: 'evaluator-request-capacity' });
    assert.equal(oracle.assertAccounting().admitted, 0, 'failed admission must consume no live request capacity');

    const accepted = requestInput(analytic, 'accepted', { rootEpoch: '3', workEpoch: '9' });
    assert.equal(oracle.admitRequest(accepted).kind, 'queued');
    assert.deepEqual(oracle.observeRequest(ref(accepted)), {
      slotId: accepted.slotId,
      requestId: accepted.requestId,
      incarnation: '1',
      state: 'queued',
      resultDisposition: 'claimed',
      inputLease: 'held',
      capabilities: analytic.capabilities.map(({ id }) => ({ id, state: 'pending', source: null, payload: null, validity: null })),
      waiters: 0,
    });
    const blocked = requestInput(analytic, 'blocked');
    assert.deepEqual(oracle.admitRequest(blocked), { kind: 'pressure', code: 'evaluator-request-capacity' });
    assert.equal(oracle.assertAccounting().admitted, 1);
    oracle.cancelRequest({ ...ref(accepted), reason: 'done' });
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { admitted: 1, deniedWithoutResidue: true };
  }, ['EVAL-REQUEST-001', 'EVAL-REQUEST-002', 'EVAL-REQUEST-003', 'EVAL-REQUEST-004']);
  defineCase('evaluator-request-coalescing-cancel', () => {
    const oracle = createEvaluatorOracle({ profile: analytic });
    const input = requestInput(analytic, 'coalesce', { rootEpoch: '5' });
    oracle.admitRequest(input);
    const waiter = (waiterId) => ({ coalescingKey: input.coalescingKey, incarnation: input.incarnation, purpose: input.purpose, requestId: input.requestId, rootEpoch: input.rootEpoch, slotId: input.slotId, waiterId });
    assert.equal(oracle.attachWaiter(waiter('waiter-a')).kind, 'attached');
    assert.equal(oracle.attachWaiter(waiter('waiter-b')).kind, 'attached');
    assert.throws(() => oracle.attachWaiter({ ...waiter('bad'), purpose: 'other-purpose' }), { code: 'EVALUATOR_REFERENCE_COALESCE' });
    assert.deepEqual(oracle.cancelWaiter({ ...ref(input), waiterId: 'waiter-a' }), { kind: 'cancelled', remainingWaiters: 1 });
    assert.equal(oracle.observeRequest(ref(input)).state, 'queued', 'one waiter cancellation must not cancel shared request');
    assert.equal(oracle.cancelRequest({ ...ref(input), reason: 'request-cancelled' }).kind, 'cancelled');
    const terminal = oracle.observeRequest(ref(input));
    assert.equal(terminal.waiters, 0, 'terminal request must dispose all coalesced waiters exactly once');
    assert.equal(terminal.inputLease, 'released');
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { independentWaiterCancellation: true };
  }, ['EVAL-REQUEST-005', 'EVAL-REQUEST-008', 'EVAL-REQUEST-009']);
  defineCase('evaluator-request-readiness-completeness', () => {
    const oracle = createEvaluatorOracle({ profile: vector });
    const input = requestInput(vector, 'readiness');
    oracle.admitRequest(input);
    const [first, second] = vector.capabilities.map(({ id }) => id);
    oracle.publishCapability({ ...ref(input), capabilityId: first, payload: { token: 'proposal-ready' }, validity: { complete: true }, source: 'fresh-execution' });
    assert.equal(oracle.observeRequest(ref(input)).state, 'queued', 'one required capability cannot make a combined request ready');
    oracle.publishCapability({ ...ref(input), capabilityId: second, payload: { token: 'value-ready' }, validity: { complete: true }, source: 'fresh-execution' });
    const ready = oracle.observeRequest(ref(input));
    assert.equal(ready.state, 'ready');
    assert.equal(ready.inputLease, 'released');
    assert(ready.capabilities.every(({ state }) => state === 'ready'));
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { requiredCapabilities: ready.capabilities.length };
  }, ['EVAL-REQUEST-004', 'EVAL-REQUEST-006', 'EVAL-REQUEST-007', 'EVAL-REQUEST-010']);
}

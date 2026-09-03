import assert from 'node:assert/strict';

import { createEvaluatorOracle } from './evaluator.mjs';
import { cacheKey, executeComplete, form, getProfile, ref, requestInput, resultsFor, workspaceAdmission } from './evaluator-case-support.mjs';

export function registerEvaluatorLifecycleCases({ defineCase, projection }) {
  const vector = getProfile(projection, 'evaluator.synthetic-vector-combined');
  const analytic = getProfile(projection, 'evaluator.synthetic-analytic-evaluation-only');
  const sensitive = getProfile(projection, 'evaluator.synthetic-batch-sensitive-resumable');

  defineCase('evaluator-cache-absent-runtime-deletion', () => {
    const oracle = createEvaluatorOracle({ profile: analytic });
    assert.equal(oracle.claimCacheEntry, undefined);
    assert.equal(oracle.lookupCache, undefined);
    assert.equal(oracle.completeFromCache, undefined);
    assert.equal(oracle.assertAccounting().cacheEntries, 0);
    assert.equal(oracle.assertAccounting().cacheWaiters, 0);
    const input = requestInput(analytic, 'cache-absent');
    assert.equal(input.cacheKey, null);
    oracle.admitRequest(input);
    oracle.cancelRequest({ ...ref(input), reason: 'case-end' });
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { cachePortsAbsent: true, cacheRuntimeResidue: 0 };
  }, ['EVAL-CACHE-001', 'EVAL-CLEANUP-003']);

  defineCase('evaluator-request-identity-framing', () => {
    const oracle = createEvaluatorOracle({ profile: analytic });
    const left = requestInput(analytic, 'identity-left', {
      slotId: 'slot', requestId: 'a\0b', resultSlotId: 'result-left',
    });
    const right = requestInput(analytic, 'identity-right', {
      slotId: 'slot\0a', requestId: 'b', resultSlotId: 'result-right',
    });
    assert.equal(oracle.admitRequest(left).kind, 'queued');
    assert.equal(oracle.admitRequest(right).kind, 'queued', 'distinct opaque identity tuples must not alias through delimiter framing');
    assert.equal(oracle.assertAccounting().admitted, 2);
    oracle.cancelRequest({ ...ref(left), reason: 'case-end' });
    oracle.cancelRequest({ ...ref(right), reason: 'case-end' });
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { opaqueTupleIdentityCollisionSafe: true };
  }, ['EVAL-REQUEST-001', 'EVAL-REQUEST-009']);

  defineCase('evaluator-request-cache-key-binding', () => {
    const oracle = createEvaluatorOracle({ profile: vector });
    const input = requestInput(vector, 'cache-binding');
    oracle.admitRequest(input);
    const observed = oracle.observeRequest(ref(input));
    assert.deepEqual(observed.bindings.inputKey, input.inputKey);
    assert.deepEqual(observed.bindings.cacheKey, input.cacheKey);
    oracle.cancelRequest({ ...ref(input), reason: 'case-end' });
    assert.equal(oracle.cleanup().runtimeResidue, 0);

    const mismatch = createEvaluatorOracle({ profile: vector });
    const malformed = requestInput(vector, 'cache-binding-mismatch');
    malformed.cacheKey = { ...malformed.cacheKey, history: { digest: 'different-history' } };
    assert.throws(() => mismatch.admitRequest(malformed), { code: 'EVALUATOR_REFERENCE_REQUEST_CACHE_KEY' });
    assert.equal(mismatch.assertAccounting().admitted, 0, 'cache/input identity mismatch must fail before request publication');
    assert.equal(mismatch.cleanup().runtimeResidue, 0);
    return { separateInputAndCacheBinding: true, sharedFactsValidated: true };
  }, ['EVAL-REQUEST-001', 'EVAL-REQUEST-003', 'EVAL-CACHE-002']);

  defineCase('evaluator-batch-borrow-survives-alternate-ready', () => {
    const oracle = createEvaluatorOracle({ profile: vector });
    const input = requestInput(vector, 'alternate-ready');
    oracle.admitRequest(input);
    form(oracle, vector, 'alternate-ready-batch', [input]);
    for (const capability of vector.capabilities) {
      oracle.publishCapability({
        ...ref(input), capabilityId: capability.id,
        payload: { token: `alternate:${capability.id}` }, validity: { complete: true }, source: 'declared-equivalent-source',
      });
    }
    const readyWhileBatchOwnsBorrow = oracle.observeRequest(ref(input));
    assert.equal(readyWhileBatchOwnsBorrow.state, 'ready');
    assert.equal(readyWhileBatchOwnsBorrow.inputLease, 'held', 'logical readiness cannot release an input borrow still owned by physical batch work');
    executeComplete(oracle, vector, 'alternate-ready-batch', [input]);
    const scatter = oracle.scatterBatch({ batchId: 'alternate-ready-batch' });
    assert.equal(scatter.dispositions[0].kind, 'terminal-rejected', 'late physical output cannot republish an already ready request');
    const afterBatch = oracle.observeRequest(ref(input));
    assert.equal(afterBatch.state, 'ready');
    assert.equal(afterBatch.inputLease, 'released', 'batch termination must release the retained input borrow exactly once');
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { alternateReadyRetainsBorrowUntilBatchTerminal: true };
  }, ['EVAL-REQUEST-006', 'EVAL-REQUEST-008', 'EVAL-REQUEST-009', 'EVAL-BATCH-008', 'EVAL-BATCH-009']);

  defineCase('evaluator-quarantine-drains-active-batch', () => {
    const oracle = createEvaluatorOracle({ profile: vector });
    const input = requestInput(vector, 'quarantine-active');
    oracle.admitRequest(input);
    form(oracle, vector, 'quarantine-active-batch', [input]);
    const capabilityId = vector.capabilities[0].id;
    oracle.publishCapability({ ...ref(input), capabilityId, payload: { token: 'first' }, validity: { complete: true }, source: 'fresh-execution' });
    assert.throws(
      () => oracle.publishCapability({ ...ref(input), capabilityId, payload: { token: 'conflict' }, validity: { complete: true }, source: 'fresh-execution' }),
      { code: 'EVALUATOR_REFERENCE_PUBLICATION_CONFLICT' },
    );
    assert.equal(oracle.observeRequest(ref(input)).inputLease, 'held', 'quarantine cannot release a batch-owned borrow before batch disposition');
    const cleanup = oracle.cleanup();
    assert.equal(cleanup.kind, 'quarantined');
    assert.equal(cleanup.runtimeResidue, 0);
    assert.equal(cleanup.quarantine.code, 'conflicting-publication');
    return { quarantinedActiveBatchDrained: true };
  }, ['EVAL-REQUEST-008', 'EVAL-REQUEST-009', 'EVAL-BATCH-009', 'EVAL-CLEANUP-001', 'EVAL-CLEANUP-002']);

  defineCase('evaluator-cache-recycled-bucket-isolation', () => {
    const oracle = createEvaluatorOracle({ profile: vector });
    const key = cacheKey(vector, 'bucket-reuse');
    const payloadInput = requestInput(vector, 'bucket-payload', { inputKey: key, cacheKey: key, purpose: key.purpose });
    const results = resultsFor(vector, [payloadInput])[0].capabilities;
    oracle.claimCacheEntry({ entryId: 'recycled-entry', generation: '1', hash: 'old-bucket', keyFacts: key });
    oracle.publishCacheEntry({ entryId: 'recycled-entry', generation: '1', results });
    oracle.retireCacheEntry({ entryId: 'recycled-entry', reason: 'recycle' });
    oracle.claimCacheEntry({ entryId: 'recycled-entry', generation: '2', hash: 'new-bucket', keyFacts: key });
    oracle.publishCacheEntry({ entryId: 'recycled-entry', generation: '2', results });
    assert.equal(oracle.lookupCache({ hash: 'old-bucket', keyFacts: key }).kind, 'miss', 'retired entry identity must be removed from its former hash bucket');
    assert.equal(oracle.lookupCache({ hash: 'new-bucket', keyFacts: key }).entryId, 'recycled-entry');
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { recycledEntryHasOneBucketIdentity: true };
  }, ['EVAL-CACHE-003', 'EVAL-CACHE-004', 'EVAL-CACHE-008']);

  defineCase('evaluator-terminal-outcome-authority', () => {
    const readyOracle = createEvaluatorOracle({ profile: analytic });
    const readyInput = requestInput(analytic, 'terminal-ready');
    readyOracle.admitRequest(readyInput);
    const capabilityId = analytic.capabilities[0].id;
    readyOracle.publishCapability({ ...ref(readyInput), capabilityId, payload: { token: 'ready' }, validity: { complete: true }, source: 'fresh-execution' });
    assert.deepEqual(
      readyOracle.failRequest({ ...ref(readyInput), code: 'too-late' }),
      { kind: 'already-ready', requestId: readyInput.requestId, incarnation: readyInput.incarnation },
    );
    assert.equal(readyOracle.observeRequest(ref(readyInput)).state, 'ready');
    assert.equal(readyOracle.cleanup().runtimeResidue, 0);

    const failedOracle = createEvaluatorOracle({ profile: analytic });
    const failedInput = requestInput(analytic, 'terminal-failed');
    failedOracle.admitRequest(failedInput);
    failedOracle.failRequest({ ...ref(failedInput), code: 'first-failure' });
    assert.deepEqual(
      failedOracle.cancelRequest({ ...ref(failedInput), reason: 'too-late' }),
      { kind: 'already-failed', requestId: failedInput.requestId, incarnation: failedInput.incarnation },
    );
    assert.equal(failedOracle.observeRequest(ref(failedInput)).state, 'failed');
    assert.equal(failedOracle.cleanup().runtimeResidue, 0);
    return { terminalOutcomeCannotBeRewrittenByReturnValue: true };
  }, ['EVAL-REQUEST-002', 'EVAL-REQUEST-008', 'EVAL-REQUEST-009']);

  defineCase('evaluator-mutable-state-stale-and-retry', () => {
    const oracle = createEvaluatorOracle({ profile: sensitive });
    const input = requestInput(sensitive, 'mutable-retry');
    oracle.admitRequest(input);
    form(oracle, sensitive, 'mutable-retry-batch', [input]);
    const pending = oracle.executeBatch({
      batchId: 'mutable-retry-batch',
      continuation: { kind: 'pending', progressToken: 'progress-1', workspaceAdmission: workspaceAdmission(sensitive, 'per-continuation', 'mutable-retry') },
      results: [],
    });
    oracle.resumeBatch({
      batchId: 'mutable-retry-batch', continuationId: pending.continuationId, resumeId: 'finish-evaluation',
      continuation: { kind: 'complete' }, results: resultsFor(sensitive, [input]),
    });
    const update = { batchId: 'mutable-retry-batch', certain: true, expectedGeneration: '0', nextGeneration: '1', updateIdentity: 'stable-update' };
    const first = oracle.commitMutableState(update);
    assert.deepEqual(oracle.commitMutableState(update), first, 'exact mutable-state retry must be idempotent even after generation advances');
    assert.throws(
      () => oracle.commitMutableState({ ...update, expectedGeneration: '1', nextGeneration: '2' }),
      { code: 'EVALUATOR_REFERENCE_MUTABLE_STATE_RETRY' },
      'one mutable update identity cannot name two state transitions',
    );
    oracle.scatterBatch({ batchId: 'mutable-retry-batch' });
    assert.equal(oracle.cleanup().runtimeResidue, 0);

    const staleOracle = createEvaluatorOracle({ profile: sensitive });
    const staleInput = requestInput(sensitive, 'mutable-stale');
    staleOracle.admitRequest(staleInput);
    form(staleOracle, sensitive, 'mutable-stale-batch', [staleInput]);
    staleOracle.executeBatch({
      batchId: 'mutable-stale-batch',
      continuation: { kind: 'pending', progressToken: 'progress-1', workspaceAdmission: workspaceAdmission(sensitive, 'per-continuation', 'mutable-stale') },
      results: [],
    });
    staleOracle.cancelRequest({ ...ref(staleInput), reason: 'cancel-before-state-commit' });
    assert.throws(
      () => staleOracle.commitMutableState({ batchId: 'mutable-stale-batch', certain: true, expectedGeneration: '0', nextGeneration: '1', updateIdentity: 'stale-update' }),
      { code: 'EVALUATOR_REFERENCE_MUTABLE_STATE_STALE' },
    );
    assert.equal(staleOracle.snapshot().mutableStateGeneration, '0', 'cancelled physical work cannot mutate evaluator state');
    assert.equal(staleOracle.assertAccounting().activeWorkspaces, 0);
    assert.equal(staleOracle.observeRequest(ref(staleInput)).inputLease, 'released');
    assert.equal(staleOracle.cleanup().runtimeResidue, 0);
    return { mutableRetryIdempotent: true, staleMutableWriteRejected: true };
  }, ['EVAL-REQUEST-008', 'EVAL-REQUEST-009', 'EVAL-BATCH-006', 'EVAL-BATCH-009', 'EVAL-BATCH-010', 'EVAL-CLEANUP-001']);
}

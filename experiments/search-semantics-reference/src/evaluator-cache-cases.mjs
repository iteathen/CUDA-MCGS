import assert from 'node:assert/strict';

import { createEvaluatorOracle } from './evaluator.mjs';
import { cacheKey, getProfile, ref, requestInput, resultsFor } from './evaluator-case-support.mjs';

export function registerEvaluatorCacheCases({ defineCase, projection }) {
  const vector = getProfile(projection, 'evaluator.synthetic-vector-combined');

  defineCase('evaluator-cache-full-key-collision', () => {
    const oracle = createEvaluatorOracle({ profile: vector });
    const keyA = cacheKey(vector, 'cache-a');
    const keyB = cacheKey(vector, 'cache-b');
    const fixedHash = 'forced-collision';
    oracle.claimCacheEntry({ entryId: 'entry-a', generation: '1', hash: fixedHash, keyFacts: keyA });
    const maxWaiters = Number(vector.cache.maxWaiters);
    for (let index = 0; index < maxWaiters; index += 1) {
      assert.equal(oracle.attachCacheWaiter({ entryId: 'entry-a', generation: '1', keyFacts: keyA, waiterId: `cache-waiter-${index}` }).kind, 'attached');
    }
    assert.deepEqual(
      oracle.attachCacheWaiter({ entryId: 'entry-a', generation: '1', keyFacts: keyA, waiterId: 'cache-waiter-overflow' }),
      { kind: 'pressure', code: vector.cache.pressureStatus },
    );
    assert.equal(oracle.cancelCacheWaiter({ entryId: 'entry-a', generation: '1', waiterId: 'cache-waiter-0' }).remainingWaiters, maxWaiters - 1);
    const readyA = oracle.publishCacheEntry({ entryId: 'entry-a', generation: '1', results: resultsFor(vector, [requestInput(vector, 'cache-payload-a', { inputKey: keyA })])[0].capabilities });
    assert.equal(readyA.waitersReleased, maxWaiters - 1);
    assert.equal(oracle.assertAccounting().cacheWaiters, 0);

    oracle.claimCacheEntry({ entryId: 'entry-b', generation: '1', hash: fixedHash, keyFacts: keyB });
    oracle.publishCacheEntry({ entryId: 'entry-b', generation: '1', results: resultsFor(vector, [requestInput(vector, 'cache-payload-b', { inputKey: keyB })])[0].capabilities });
    assert.equal(oracle.lookupCache({ hash: fixedHash, keyFacts: keyA }).entryId, 'entry-a');
    assert.equal(oracle.lookupCache({ hash: fixedHash, keyFacts: keyB }).entryId, 'entry-b');
    const keyC = cacheKey(vector, 'cache-c');
    assert.equal(oracle.lookupCache({ hash: fixedHash, keyFacts: keyC }).kind, 'miss');

    const request = requestInput(vector, 'cache-request', { inputKey: keyA, purpose: keyA.purpose });
    oracle.admitRequest(request);
    assert.deepEqual(oracle.completeFromCache({ entryId: 'entry-a', ...ref(request) }), { kind: 'ready', source: 'cache', entryId: 'entry-a' });
    assert(oracle.observeRequest(ref(request)).capabilities.every(({ source }) => source === 'cache'));

    const subsetCapabilities = [vector.request.capabilities[0]];
    const subsetIds = subsetCapabilities.map(({ capability }) => capability);
    const subsetKey = cacheKey(vector, 'cache-subset', { 'capability-set': subsetIds });
    const subsetRequest = requestInput(vector, 'cache-subset', { capabilities: subsetCapabilities, inputKey: subsetKey, purpose: subsetKey.purpose });
    oracle.claimCacheEntry({ entryId: 'subset-entry', generation: '1', hash: 'subset', keyFacts: subsetKey });
    assert.throws(
      () => oracle.publishCacheEntry({ entryId: 'subset-entry', generation: '1', results: resultsFor(vector, [subsetRequest])[0].capabilities }),
      { code: 'EVALUATOR_REFERENCE_CACHE_PARTIAL' },
      'cache publication cannot include profile capabilities omitted by the keyed request',
    );
    assert.equal(oracle.publishCacheEntry({
      entryId: 'subset-entry', generation: '1', results: resultsFor(vector, [subsetRequest], { capabilityIds: subsetIds })[0].capabilities,
    }).kind, 'ready');
    oracle.admitRequest(subsetRequest);
    assert.deepEqual(oracle.completeFromCache({ entryId: 'subset-entry', ...ref(subsetRequest) }), { kind: 'ready', source: 'cache', entryId: 'subset-entry' });
    const subsetReady = oracle.observeRequest(ref(subsetRequest));
    assert.equal(subsetReady.capabilities.length, 1);
    assert.equal(subsetReady.capabilities[0].source, 'cache');
    assert.equal(oracle.cleanup().runtimeResidue, 0);

    const mismatch = createEvaluatorOracle({ profile: vector });
    mismatch.claimCacheEntry({ entryId: 'mismatch-entry', generation: '1', hash: fixedHash, keyFacts: keyA });
    mismatch.publishCacheEntry({ entryId: 'mismatch-entry', generation: '1', results: resultsFor(vector, [requestInput(vector, 'mismatch-payload', { inputKey: keyA })])[0].capabilities });
    const mismatchedRequest = requestInput(vector, 'mismatch-request', { inputKey: keyB, purpose: keyB.purpose });
    mismatch.admitRequest(mismatchedRequest);
    assert.throws(() => mismatch.completeFromCache({ entryId: 'mismatch-entry', ...ref(mismatchedRequest) }), { code: 'EVALUATOR_REFERENCE_CACHE_KEY_QUARANTINE' });
    assert.equal(mismatch.snapshot().quarantine.code, 'cache-key-inconsistency');
    assert.equal(mismatch.observeRequest(ref(mismatchedRequest)).state, 'failed');
    assert.equal(mismatch.cleanup().kind, 'quarantined');
    return { collisionVerifiedByExactFullKey: true, cacheFreshSchemaEquivalent: true, subsetCapabilitySetExact: true, waiterBound: maxWaiters, inconsistentCompletionQuarantined: true };
  }, ['EVAL-CACHE-001', 'EVAL-CACHE-002', 'EVAL-CACHE-003', 'EVAL-CACHE-004', 'EVAL-CACHE-005', 'EVAL-CACHE-006', 'EVAL-REQUEST-006', 'EVAL-CLEANUP-002']);

  defineCase('evaluator-cache-failure-pressure-protection', () => {
    const oracle = createEvaluatorOracle({ profile: vector, admission: { maxCacheEntries: '1' } });
    const keyA = cacheKey(vector, 'pressure-a');
    const keyB = cacheKey(vector, 'pressure-b');
    oracle.claimCacheEntry({ entryId: 'pressure-a', generation: '1', hash: 'a', keyFacts: keyA });
    oracle.attachCacheWaiter({ entryId: 'pressure-a', generation: '1', keyFacts: keyA, waiterId: 'failed-waiter' });
    assert.deepEqual(oracle.failCacheEntry({ entryId: 'pressure-a', generation: '1', code: 'evaluation-failed' }), { kind: 'failed', entryId: 'pressure-a', waitersReleased: 1 });
    assert.equal(oracle.lookupCache({ hash: 'a', keyFacts: keyA }).kind, 'miss', 'failed cache entries must never be ready hits');
    assert.deepEqual(oracle.claimCacheEntry({ entryId: 'pressure-b', generation: '1', hash: 'b', keyFacts: keyB }), { kind: 'pressure', code: 'evaluator-cache-capacity' });
    oracle.retireCacheEntry({ entryId: 'pressure-a', reason: 'make-capacity' });
    oracle.claimCacheEntry({ entryId: 'pressure-b', generation: '1', hash: 'b', keyFacts: keyB });
    oracle.publishCacheEntry({ entryId: 'pressure-b', generation: '1', results: resultsFor(vector, [requestInput(vector, 'pressure-payload', { inputKey: keyB })])[0].capabilities });
    oracle.protectCacheEntry({ entryId: 'pressure-b', protected: true });
    oracle.invalidateCacheFact({ fact: 'history', nextValue: { digest: 'new-history' } });
    assert.equal(oracle.lookupCache({ hash: 'b', keyFacts: keyB }).kind, 'miss', 'protected invalid entry must become non-hittable before reclamation');
    assert.deepEqual(oracle.retireCacheEntry({ entryId: 'pressure-b', reason: 'evict' }), { kind: 'pending', code: 'cache-entry-protected' });
    oracle.protectCacheEntry({ entryId: 'pressure-b', protected: false });
    assert.equal(oracle.retireCacheEntry({ entryId: 'pressure-b', reason: 'evict' }).kind, 'retired');
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { typedPressure: true, protectedInvalidationSafe: true, failedWaiterReleased: true };
  }, ['EVAL-CACHE-004', 'EVAL-CACHE-006', 'EVAL-CACHE-007']);

  defineCase('evaluator-cache-generation-invalidation', () => {
    const oracle = createEvaluatorOracle({ profile: vector });
    const key = cacheKey(vector, 'generation');
    const huge = '18446744073709551616';
    oracle.claimCacheEntry({ entryId: 'generation-entry', generation: huge, hash: 'g', keyFacts: key });
    oracle.publishCacheEntry({ entryId: 'generation-entry', generation: huge, results: resultsFor(vector, [requestInput(vector, 'generation-payload', { inputKey: key })])[0].capabilities });
    oracle.retireCacheEntry({ entryId: 'generation-entry', reason: 'recycle' });
    assert.throws(() => oracle.claimCacheEntry({ entryId: 'generation-entry', generation: huge, hash: 'g', keyFacts: key }), { code: 'EVALUATOR_REFERENCE_CACHE_GENERATION' });
    const next = (BigInt(huge) + 1n).toString();
    oracle.claimCacheEntry({ entryId: 'generation-entry', generation: next, hash: 'g', keyFacts: key });
    oracle.publishCacheEntry({ entryId: 'generation-entry', generation: next, results: resultsFor(vector, [requestInput(vector, 'generation-payload-2', { inputKey: key })])[0].capabilities });
    assert.equal(oracle.invalidateCacheFact({ fact: 'artifact-generation', nextValue: 'new-artifact' }).retired, 1);
    assert.equal(oracle.lookupCache({ hash: 'g', keyFacts: key }).kind, 'miss');
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { generationBeyondUint64Exact: next };
  }, ['EVAL-CACHE-008', 'EVAL-REUSE-006']);
}

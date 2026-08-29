import assert from 'node:assert/strict';

import { createEvaluatorOracle } from './evaluator.mjs';
import { cacheKey, executeComplete, form, getProfile, ref, requestInput, resultsFor } from './evaluator-case-support.mjs';

export function registerEvaluatorSensitivityCases({ defineCase, projection }) {
  const vector = getProfile(projection, 'evaluator.synthetic-vector-combined');

  defineCase('evaluator-oracle-sensitivity-incarnation', () => {
    function exercise(mutations) {
      const oracle = createEvaluatorOracle({ profile: vector, mutations });
      const oldRequest = requestInput(vector, 'mut-old', { slotId: 'mut-slot', requestId: 'mut-old', incarnation: '1' });
      oracle.admitRequest(oldRequest);
      form(oracle, vector, 'mut-batch', [oldRequest]);
      executeComplete(oracle, vector, 'mut-batch', [oldRequest]);
      oracle.cancelRequest({ ...ref(oldRequest), reason: 'superseded' });
      const replacement = requestInput(vector, 'mut-new', { slotId: 'mut-slot', requestId: 'mut-new', incarnation: '2' });
      oracle.admitRequest(replacement);
      const disposition = oracle.scatterBatch({ batchId: 'mut-batch' }).dispositions[0];
      const state = oracle.observeRequest(ref(replacement)).state;
      if (state !== 'ready') oracle.cancelRequest({ ...ref(replacement), reason: 'case-end' });
      oracle.cleanup();
      return { disposition, state };
    }
    const normal = exercise({});
    const mutant = exercise({ skipScatterIncarnationCheck: true });
    assert.equal(normal.disposition.kind, 'stale-rejected');
    assert.equal(normal.state, 'queued');
    assert.equal(mutant.disposition.kind, 'scattered');
    assert.equal(mutant.state, 'ready');
    return { mutationDetected: true };
  });
  defineCase('evaluator-oracle-sensitivity-readiness', () => {
    function stateAfterOneCapability(mutations) {
      const oracle = createEvaluatorOracle({ profile: vector, mutations });
      const input = requestInput(vector, `ready-mut-${mutations.allowIncompleteReady === true ? 'bad' : 'good'}`);
      oracle.admitRequest(input);
      oracle.publishCapability({ ...ref(input), capabilityId: vector.capabilities[0].id, payload: { token: 'one' }, validity: { complete: true }, source: 'fresh-execution' });
      const state = oracle.observeRequest(ref(input)).state;
      if (state !== 'ready') oracle.cancelRequest({ ...ref(input), reason: 'case-end' });
      oracle.cleanup();
      return state;
    }
    assert.equal(stateAfterOneCapability({}), 'queued');
    assert.equal(stateAfterOneCapability({ allowIncompleteReady: true }), 'ready');
    return { mutationDetected: true };
  });
  defineCase('evaluator-oracle-sensitivity-cache-key', () => {
    function lookup(mutations) {
      const oracle = createEvaluatorOracle({ profile: vector, mutations });
      const keyA = cacheKey(vector, 'sensitivity-a');
      const keyB = cacheKey(vector, 'sensitivity-b');
      oracle.claimCacheEntry({ entryId: 'sensitivity', generation: '1', hash: 'collision', keyFacts: keyA });
      oracle.publishCacheEntry({ entryId: 'sensitivity', generation: '1', results: resultsFor(vector, [requestInput(vector, 'sensitivity-payload', { inputKey: keyA })])[0].capabilities });
      const result = oracle.lookupCache({ hash: 'collision', keyFacts: keyB });
      oracle.cleanup();
      return result.kind;
    }
    assert.equal(lookup({}), 'miss');
    assert.equal(lookup({ skipCacheFullKeyCheck: true }), 'hit');
    return { mutationDetected: true };
  });
}

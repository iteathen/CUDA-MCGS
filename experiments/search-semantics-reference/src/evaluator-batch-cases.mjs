import assert from 'node:assert/strict';

import { createEvaluatorOracle } from './evaluator.mjs';
import { executeComplete, form, getProfile, ref, requestInput, resultsFor, workspaceAdmission } from './evaluator-case-support.mjs';

export function registerEvaluatorBatchCases({ defineCase, projection }) {
  const vector = getProfile(projection, 'evaluator.synthetic-vector-combined');
  const sensitive = getProfile(projection, 'evaluator.synthetic-batch-sensitive-resumable');

  defineCase('evaluator-batch-one-progress', () => {
    const oracle = createEvaluatorOracle({ profile: vector });
    const input = requestInput(vector, 'batch-one');
    oracle.admitRequest(input);
    assert(BigInt(vector.batching.maximumItems) > 1n, 'fixture must have a nontrivial maximum batch size');
    assert.throws(
      () => form(oracle, vector, 'batch-padding-overflow', [input], { paddingCount: vector.batching.maximumItems, serviceOpportunity: true }),
      { code: 'EVALUATOR_REFERENCE_BATCH' },
      'inactive padding plus semantic items must remain within declared batch capacity',
    );
    assert.equal(oracle.assertAccounting().activeWorkspaces, 0, 'rejected padding must not acquire workspace');
    const formed = form(oracle, vector, 'batch-one', [input], { serviceOpportunity: true });
    assert.equal(formed.kind, 'formed', 'a ready one-item partial batch must advance from an explicit device-visible service opportunity without host flush');
    assert.equal(formed.items, 1);
    assert.equal(formed.serviceOpportunity, true);
    assert.equal(oracle.assertAccounting().stateCounts.batched, 1);
    executeComplete(oracle, vector, 'batch-one', [input]);
    assert.equal(oracle.observeRequest(ref(input)).state, 'publishing', 'executed output is not ready until stale-safe scatter/publication completes');
    const scattered = oracle.scatterBatch({ batchId: 'batch-one' });
    assert.equal(scattered.dispositions[0].kind, 'scattered');
    assert.equal(oracle.observeRequest(ref(input)).state, 'ready');
    const accounting = oracle.assertAccounting();
    assert.equal(accounting.activeWorkspaces, 0);
    assert.equal(accounting.liveBatches, 0);
    assert(BigInt(accounting.workspaceHighWaterBytes) > 0n, 'workspace high-water accounting must observe the admitted batch workspace');
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { maximumItems: vector.batching.maximumItems, progressedItems: 1, serviceOpportunity: true, paddingCapacityBound: true };
  }, ['EVAL-BATCH-001', 'EVAL-BATCH-002', 'EVAL-BATCH-003', 'EVAL-BATCH-005', 'EVAL-BATCH-009', 'EVAL-REQUEST-009']);

  defineCase('evaluator-batch-independent-equivalence', () => {
    const left = createEvaluatorOracle({ profile: vector });
    const right = createEvaluatorOracle({ profile: vector });
    const a = requestInput(vector, 'eq-a');
    const b = requestInput(vector, 'eq-b');
    for (const oracle of [left, right]) { oracle.admitRequest(a); oracle.admitRequest(b); }
    const leftBatch = form(left, vector, 'independent-left', [a, b], { paddingCount: '0' });
    const rightBatch = form(right, vector, 'independent-right', [b, a], { paddingCount: '3' });
    assert.deepEqual(leftBatch.semanticIdentity, rightBatch.semanticIdentity, 'batch-independent semantic identity must ignore compatible grouping order/padding');
    const payload = (input, capabilityId) => ({ value: `${input.requestId}:${capabilityId}` });
    executeComplete(left, vector, 'independent-left', [a, b], { payload });
    executeComplete(right, vector, 'independent-right', [b, a], { payload });
    left.scatterBatch({ batchId: 'independent-left' });
    right.scatterBatch({ batchId: 'independent-right' });
    for (const input of [a, b]) assert.deepEqual(left.observeRequest(ref(input)).capabilities, right.observeRequest(ref(input)).capabilities);
    assert.equal(left.cleanup().runtimeResidue, 0);
    assert.equal(right.cleanup().runtimeResidue, 0);
    return { groupingOrderInvariant: true, inactivePaddingInvariant: true };
  }, ['EVAL-BATCH-004', 'EVAL-BATCH-005']);

  defineCase('evaluator-batch-sensitive-identity', () => {
    const first = createEvaluatorOracle({ profile: sensitive });
    const second = createEvaluatorOracle({ profile: sensitive });
    const input = requestInput(sensitive, 'sensitive');
    first.admitRequest(input); second.admitRequest(input);
    const a = form(first, sensitive, 'sensitive-a', [input], { batchContext: { order: ['lane-0'], randomCounter: '5' }, paddingCount: '0' });
    const b = form(second, sensitive, 'sensitive-b', [input], { batchContext: { order: ['lane-0'], randomCounter: '5' }, paddingCount: '1' });
    assert.notDeepEqual(a.semanticIdentity, b.semanticIdentity, 'batch-sensitive padding must enter semantic identity');
    assert.equal(first.assertAccounting().admitted, 1);
    assert.equal(second.assertAccounting().admitted, 1, 'inactive padding must not create semantic items');
    first.failBatch({ batchId: 'sensitive-a', affectedItemRefs: [ref(input)], code: 'case-end' });
    second.failBatch({ batchId: 'sensitive-b', affectedItemRefs: [ref(input)], code: 'case-end' });
    assert.equal(first.cleanup().runtimeResidue, 0); assert.equal(second.cleanup().runtimeResidue, 0);
    return { batchContextBound: true, paddingBound: true };
  }, ['EVAL-BATCH-004', 'EVAL-BATCH-005', 'EVAL-BATCH-010']);

  defineCase('evaluator-resumable-workspace-isolation', () => {
    const oracle = createEvaluatorOracle({ profile: sensitive });
    const a = requestInput(sensitive, 'resume-a');
    const b = requestInput(sensitive, 'resume-b');
    oracle.admitRequest(a); oracle.admitRequest(b);
    const sharedLease = workspaceAdmission(sensitive, 'per-batch', 'shared', { leaseId: 'shared-batch-workspace' });
    assert.equal(form(oracle, sensitive, 'resume-a', [a], { workspaceAdmission: sharedLease }).kind, 'formed');
    const pressure = form(oracle, sensitive, 'resume-b', [b], { workspaceAdmission: { ...sharedLease, token: 'other-token' } });
    assert.deepEqual(pressure, { kind: 'pressure', code: 'evaluator-workspace-capacity' });

    const initialResults = resultsFor(sensitive, [a], { suffix: 'continuation-initial' });
    const pending = oracle.executeBatch({
      batchId: 'resume-a',
      continuation: { kind: 'pending', progressToken: 'progress-1', workspaceAdmission: workspaceAdmission(sensitive, 'per-continuation', 'resume-a') },
      results: initialResults,
    });
    assert.equal(pending.kind, 'pending');
    assert.equal(oracle.observeRequest(ref(a)).state, 'executing');
    assert.equal(oracle.assertAccounting().activeWorkspaces, 2);

    assert.throws(() => oracle.resumeBatch({
      batchId: 'resume-a', continuationId: pending.continuationId, resumeId: 'invalid-resume-operation',
      continuation: { kind: 'invalid' }, results: [],
    }), { code: 'EVALUATOR_REFERENCE_CONTINUATION' });
    assert.equal(oracle.observeRequest(ref(a)).state, 'executing', 'invalid resume must leave the active continuation unchanged');

    assert.throws(() => oracle.resumeBatch({
      batchId: 'resume-a', continuationId: pending.continuationId, resumeId: 'no-progress-resume',
      continuation: { kind: 'pending', progressToken: 'progress-1' }, results: [],
    }), { code: 'EVALUATOR_REFERENCE_CONTINUATION_PROGRESS' });
    assert.equal(oracle.observeRequest(ref(a)).state, 'executing', 'no-progress resume must leave the active continuation unchanged');

    assert.throws(() => oracle.resumeBatch({
      batchId: 'resume-a', continuationId: pending.continuationId, resumeId: 'conflicting-continuation-result',
      continuation: { kind: 'complete' }, results: resultsFor(sensitive, [a], { suffix: 'continuation-conflict' }),
    }), { code: 'EVALUATOR_REFERENCE_CONTINUATION_RESULT_CONFLICT' });
    assert.equal(oracle.observeRequest(ref(a)).state, 'executing', 'conflicting continuation output must not replace retained complete capability state');

    const resume = {
      batchId: 'resume-a', continuationId: pending.continuationId, resumeId: 'resume-operation-1',
      continuation: { kind: 'complete' }, results: [],
    };
    const completed = oracle.resumeBatch(resume);
    assert.equal(completed.kind, 'executed');
    assert.equal(completed.resumeCount, '1', 'rejected resumes must not consume continuation budget');
    assert.equal(oracle.observeRequest(ref(a)).state, 'publishing');
    assert.deepEqual(oracle.resumeBatch(resume), completed, 'an exact continuation retry must be idempotent and consume no second resume');
    assert.throws(() => oracle.resumeBatch({ ...resume, results: resultsFor(sensitive, [a], { suffix: 'conflicting-retry' }) }), { code: 'EVALUATOR_REFERENCE_CONTINUATION_RETRY' });
    assert.equal(oracle.commitMutableState({ batchId: 'resume-a', certain: true, expectedGeneration: '0', nextGeneration: '1', updateIdentity: 'update-1' }).kind, 'committed');
    oracle.scatterBatch({ batchId: 'resume-a' });
    const ready = oracle.observeRequest(ref(a));
    assert.equal(ready.state, 'ready');
    assert.deepEqual(ready.capabilities[0].payload, initialResults[0].capabilities[0].payload, 'continuation completion must preserve the exact earlier complete capability result');
    const accounting = oracle.assertAccounting();
    assert.equal(accounting.activeWorkspaces, 0, 'batch and continuation workspaces must release exactly once');
    assert.equal(accounting.activeWorkspaceBytes, '0');
    assert(BigInt(accounting.workspaceHighWaterBytes) > 0n);
    oracle.cancelRequest({ ...ref(b), reason: 'pressure-case-end' });
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return {
      isolatedExclusiveWorkspace: true,
      continuationBound: sensitive.batching.continuation.maxResumes,
      retryIdempotent: true,
      rejectedResumeNoMutation: true,
      progressTokenAdvanced: true,
      continuationResultsStable: true,
    };
  }, ['EVAL-BATCH-006', 'EVAL-BATCH-009', 'EVAL-BATCH-010', 'EVAL-REQUEST-009']);

  defineCase('evaluator-batch-failure-domains', () => {
    const independent = createEvaluatorOracle({ profile: vector });
    const a = requestInput(vector, 'failure-a');
    const b = requestInput(vector, 'failure-b');
    independent.admitRequest(a); independent.admitRequest(b);
    form(independent, vector, 'failure-independent', [a, b]);
    assert.deepEqual(independent.failBatch({ batchId: 'failure-independent', affectedItemRefs: [ref(a)], code: 'item-invalid' }), { kind: 'item-failure', affected: 1 });
    assert.equal(independent.observeRequest(ref(a)).state, 'failed');
    assert.equal(independent.observeRequest(ref(b)).state, 'batched');
    independent.executeBatch({ batchId: 'failure-independent', continuation: { kind: 'complete' }, results: resultsFor(vector, [b]) });
    independent.scatterBatch({ batchId: 'failure-independent' });
    assert.equal(independent.observeRequest(ref(b)).state, 'ready');
    assert.equal(independent.cleanup().runtimeResidue, 0);

    const subset = createEvaluatorOracle({ profile: vector });
    const subsetCapabilities = [vector.request.capabilities[0]];
    const subsetInput = requestInput(vector, 'failure-subset', { capabilities: subsetCapabilities });
    subset.admitRequest(subsetInput);
    form(subset, vector, 'failure-subset', [subsetInput]);
    assert.throws(() => subset.executeBatch({
      batchId: 'failure-subset', continuation: { kind: 'complete' }, results: resultsFor(vector, [subsetInput]),
    }), { code: 'EVALUATOR_REFERENCE_CAPABILITY_RESULT' }, 'fresh execution cannot publish an unrequested profile capability');
    assert.equal(subset.observeRequest(ref(subsetInput)).state, 'batched', 'rejected result set must not mutate request state');
    assert.throws(() => subset.failBatch({
      batchId: 'failure-subset', affectedItemRefs: [{ ...ref(subsetInput), requestId: 'not-a-batch-member' }], code: 'unknown-item',
    }), { code: 'EVALUATOR_REFERENCE_BATCH_FAIL' });
    assert.deepEqual(subset.failBatch({ batchId: 'failure-subset', affectedItemRefs: [ref(subsetInput)], code: 'subset-terminal' }), { kind: 'item-failure', affected: 1 });
    assert.equal(subset.assertAccounting().activeWorkspaces, 0, 'last terminal item must release item-independent batch workspace');
    assert.equal(subset.assertAccounting().liveBatches, 0, 'last terminal item must terminate the item-independent batch');
    assert.equal(subset.cleanup().runtimeResidue, 0);

    const whole = createEvaluatorOracle({ profile: sensitive });
    const c = requestInput(sensitive, 'failure-c');
    const d = requestInput(sensitive, 'failure-d');
    whole.admitRequest(c); whole.admitRequest(d);
    form(whole, sensitive, 'failure-whole', [c, d]);
    assert.throws(() => whole.failBatch({ batchId: 'failure-whole', affectedItemRefs: [ref(c)], code: 'one-item' }), { code: 'EVALUATOR_REFERENCE_BATCH_FAIL' });
    assert.deepEqual(whole.failBatch({ batchId: 'failure-whole', affectedItemRefs: [ref(c), ref(d)], code: 'whole-invalid' }), { kind: 'batch-failure', affected: 2 });
    assert.equal(whole.assertAccounting().activeWorkspaces, 0);
    assert.equal(whole.cleanup().runtimeResidue, 0);
    return { independentFailure: true, wholeBatchFailure: true, unrequestedCapabilityRejected: true, terminalItemReleasesWorkspace: true };
  }, ['EVAL-BATCH-007', 'EVAL-BATCH-009', 'EVAL-REQUEST-009']);

  defineCase('evaluator-scatter-incarnation', () => {
    const oracle = createEvaluatorOracle({ profile: vector });
    const oldRequest = requestInput(vector, 'old', {
      slotId: 'reuse-slot', requestId: 'request-old', incarnation: '1', resultSlotId: 'result-slot-old',
    });
    oracle.admitRequest(oldRequest);
    form(oracle, vector, 'stale-batch', [oldRequest]);

    const wrongSlotResults = resultsFor(vector, [oldRequest]).map((item) => ({
      ...item,
      ref: { ...item.ref, resultSlotId: 'wrong-result-slot' },
    }));
    assert.throws(() => oracle.executeBatch({
      batchId: 'stale-batch', continuation: { kind: 'complete' }, results: wrongSlotResults,
    }), { code: 'EVALUATOR_REFERENCE_BATCH_RESULT' }, 'physical output must bind the exact admitted result slot before execution completion');
    assert.equal(oracle.observeRequest(ref(oldRequest)).state, 'batched', 'wrong result-slot output must not advance or mutate the request');

    executeComplete(oracle, vector, 'stale-batch', [oldRequest]);
    assert.equal(oracle.observeRequest(ref(oldRequest)).state, 'publishing');
    oracle.cancelRequest({ ...ref(oldRequest), reason: 'superseded-before-scatter' });
    const replacement = requestInput(vector, 'replacement', {
      slotId: 'reuse-slot', requestId: 'request-new', incarnation: '2', resultSlotId: 'result-slot-replacement',
    });
    oracle.admitRequest(replacement);
    const scattered = oracle.scatterBatch({ batchId: 'stale-batch' });
    assert.equal(scattered.dispositions[0].kind, 'stale-rejected');
    assert.equal(oracle.observeRequest(ref(replacement)).state, 'queued', 'stale physical result must not mutate replacement request/result slot');
    assert.equal(oracle.observeRequest(ref(oldRequest)).inputLease, 'released', 'old batch-held input lease must terminate after stale scatter rejection');
    oracle.cancelRequest({ ...ref(replacement), reason: 'case-end' });
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { staleRejectedBeforeMutation: true, resultSlotBound: true };
  }, ['EVAL-REQUEST-008', 'EVAL-REQUEST-009', 'EVAL-BATCH-008']);
}

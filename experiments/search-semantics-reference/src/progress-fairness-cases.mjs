import assert from 'node:assert/strict';

import {
  activeProgressOracle,
  admitAndReady,
  getProgressProfile,
  ordinaryWorkClass,
  workClassByKind,
  workClassForContract,
  workInput,
  workRef,
} from './progress-case-support.mjs';
import { runInterleavedProgressSchedule, runSerialProgressSchedule } from './progress-schedule.mjs';

export function registerProgressFairnessCases({ defineCase, projection }) {
  defineCase('progress-producer-unblocking-fairness', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    const workClass = workClassByKind(profile, 'producer-unblocking');
    const oracle = activeProgressOracle(profile);
    const input = admitAndReady(oracle, profile, workClass, 'producer-unblocking');
    const fairness = profile.fairnessClasses.find(({ id }) => id === workClass.fairness);
    assert(fairness?.closurePriority, 'producer-unblocking work must use closure-priority fairness');
    for (let index = 0; index < Number(BigInt(fairness.maxServiceOpportunities)); index += 1) oracle.recordServiceOpportunity();
    assert.equal(oracle.observeProgress().starvation, null);
    assert.equal(oracle.claimReady({ ...workRef(input), claimId: 'producer-claim' }).kind, 'claimed');
    return { fairnessClass: fairness.id, maximumServiceOpportunities: fairness.maxServiceOpportunities };
  }, ['PROGRESS-FAIR-001', 'PROGRESS-FAIR-002']);

  defineCase('progress-partial-batch-device-flush', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-workspace');
    const workClass = workClassForContract(profile, 'SPEC-0009');
    assert.equal(workClass.batch.kind, 'device-flush');
    assert.equal(workClass.batch.hostTimeout, 'none');
    const oracle = activeProgressOracle(profile);
    const input = admitAndReady(oracle, profile, workClass, 'partial-batch');
    const initial = oracle.claimReady({ ...workRef(input), claimId: 'batch-claim', batchReadyItems: workClass.batch.minimumItems });
    assert.equal(initial.kind, 'pending');
    assert.equal(initial.code, 'producer-unavailable');
    for (let index = 0; index < Number(BigInt(workClass.batch.flushAfterOpportunities)); index += 1) oracle.recordServiceOpportunity();
    assert.equal(oracle.claimReady({ ...workRef(input), claimId: 'batch-claim', batchReadyItems: workClass.batch.minimumItems }).kind, 'claimed');
    return { deviceFlush: true, hostTimeout: workClass.batch.hostTimeout, flushAfterOpportunities: workClass.batch.flushAfterOpportunities };
  }, ['PROGRESS-FAIR-003']);

  defineCase('progress-must-drain-priority', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    const mustDrain = workClassByKind(profile, 'must-drain');
    const ordinary = ordinaryWorkClass(profile);
    const oracle = activeProgressOracle(profile);
    const input = admitAndReady(oracle, profile, mustDrain, 'must-drain');
    assert.equal(oracle.claimReady({ ...workRef(input), claimId: 'must-drain-claim' }).kind, 'claimed');
    assert.equal(oracle.beginResultVisibleTransition(workRef(input)).kind, 'must-drain');
    assert.equal(oracle.requestStop({ cause: 'progress-cancelled' }).kind, 'stop-requested');
    assert.equal(oracle.observeProgress().work.find(({ workId }) => workId === input.workId).state, 'claimed');
    assert.throws(() => oracle.cancelWork({ ...workRef(input), reason: 'should-not-cancel' }), /irreversible result-visible work cannot be cancelled/);
    assert.throws(() => oracle.admitWork(workInput(ordinary, 'ordinary-after-stop')), /ordinary work admission is closed after stop/);
    assert.equal(oracle.completeWork({ ...workRef(input), operationId: 'must-drain-complete', resultVisible: true }).kind, 'completed');
    return { preservedThroughStop: true, ordinaryAdmissionClosed: true };
  }, ['PROGRESS-FAIR-002', 'PROGRESS-STOP-002', 'PROGRESS-STOP-003']);

  defineCase('progress-starvation-contract', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    const workClass = ordinaryWorkClass(profile);
    const oracle = activeProgressOracle(profile);
    admitAndReady(oracle, profile, workClass, 'starved');
    const fairness = profile.fairnessClasses.find(({ id }) => id === workClass.fairness);
    for (let index = 0; index <= Number(BigInt(fairness.maxServiceOpportunities)); index += 1) oracle.recordServiceOpportunity();
    const classified = oracle.classifyNoProgress();
    assert.equal(classified.outcome, 'starvation');
    assert.deepEqual(classified.stopCause, { cause: 'progress-starvation' });
    return { fairnessClass: fairness.id, gap: oracle.observeProgress().starvation.gap };
  }, ['PROGRESS-FAIR-001', 'PROGRESS-NOPROGRESS-006', 'PROGRESS-NOPROGRESS-007']);

  defineCase('progress-resource-recovery-reserve', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    const workClass = workClassByKind(profile, 'resource-recovery');
    assert(workClass.reserve, 'resource-recovery work must carry injected closure reserve authority');
    const oracle = activeProgressOracle(profile);
    const input = workInput(workClass, 'resource-recovery');
    assert.equal(oracle.admitWork(input).kind, 'admitted');
    const before = oracle.observeProgress();
    const classified = oracle.classifyNoProgress({ resourceRecoverable: true });
    assert.equal(classified.outcome, 'recoverable-resource-wait');
    assert.deepEqual(oracle.observeProgress().work, before.work, 'Progress classification must not invent Resource mutations');
    return { reserve: workClass.reserve, resourceAuthorityInjected: true };
  }, ['PROGRESS-FAIR-002', 'PROGRESS-NOPROGRESS-001', 'PROGRESS-NOPROGRESS-002']);

  defineCase('progress-scheduler-semantic-parity', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    const serial = runSerialProgressSchedule(profile);
    const interleaved = runInterleavedProgressSchedule(profile);
    assert.deepEqual(interleaved, serial);
    assert.equal(serial.accounting.live, 0);
    assert.equal(serial.accounting.terminal, 2);
    return { scheduleModels: ['serial', 'interleaved'], stableInvariantsEqual: true };
  }, ['PROGRESS-FAIR-005', 'PROGRESS-FAIR-006']);
}

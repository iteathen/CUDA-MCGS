import assert from 'node:assert/strict';

import {
  activeProgressOracle,
  getProgressProfile,
  ordinaryWorkClass,
  workInput,
} from './progress-case-support.mjs';

export function registerProgressNoProgressCases({ defineCase, projection }) {
  defineCase('progress-mandatory-wait-cycle', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    const workClass = ordinaryWorkClass(profile);
    const oracle = activeProgressOracle(profile);
    const left = workInput(workClass, 'cycle-left');
    const right = workInput(workClass, 'cycle-right');
    assert.equal(oracle.admitWork(left).kind, 'admitted');
    assert.equal(oracle.admitWork(right).kind, 'admitted');
    const result = oracle.classifyNoProgress({ waitEdges: [
      { from: left.workId, to: right.workId },
      { from: right.workId, to: left.workId },
    ] });
    assert.equal(result.outcome, 'deadlock');
    assert.deepEqual(result.stopCause, { cause: 'progress-deadlock' });
    return { waitCycleDetected: true, fatalStopRequested: true };
  }, ['PROGRESS-NOPROGRESS-001', 'PROGRESS-NOPROGRESS-004', 'PROGRESS-NOPROGRESS-007']);

  defineCase('progress-deadlock-vs-quiescence', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    const empty = activeProgressOracle(profile);
    assert.equal(empty.classifyNoProgress().outcome, 'terminal-quiescent');
    const pending = activeProgressOracle(profile);
    const workClass = ordinaryWorkClass(profile);
    assert.equal(pending.admitWork(workInput(workClass, 'pending')).kind, 'admitted');
    assert.equal(pending.classifyNoProgress().outcome, 'producer-pending');
    return { empty: 'terminal-quiescent', pending: 'producer-pending' };
  }, ['PROGRESS-NOPROGRESS-001', 'PROGRESS-NOPROGRESS-002', 'PROGRESS-NOPROGRESS-004']);

  defineCase('progress-livelock-potential', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    const oracle = activeProgressOracle(profile);
    const result = oracle.classifyNoProgress({ repeatedTransitions: profile.noProgress.maxRepeatedTransitions, potentialChanged: false });
    assert.equal(result.outcome, 'livelock');
    assert.deepEqual(result.stopCause, { cause: 'progress-livelock' });
    return { repeatedTransitions: profile.noProgress.maxRepeatedTransitions, finitePotentialRequired: true };
  }, ['PROGRESS-NOPROGRESS-005', 'PROGRESS-NOPROGRESS-007']);
}

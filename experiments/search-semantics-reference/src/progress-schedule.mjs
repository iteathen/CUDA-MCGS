import assert from 'node:assert/strict';

import { activeProgressOracle, admitAndReady, stableProgressSnapshot, workRef } from './progress-case-support.mjs';

function scheduleClasses(profile) {
  const ordinaryFairness = profile.fairnessClasses.find(({ closurePriority }) => closurePriority === false);
  assert(ordinaryFairness, 'missing ordinary Progress fairness class');
  const entries = profile.workClasses.filter((workClass) =>
    ordinaryFairness.classes.includes(workClass.id)
    && workClass.batch.kind === 'none');
  assert(entries.length >= 2, 'Progress schedule parity requires at least two ordinary non-batched work classes');
  return entries.slice(0, 2);
}

function prepared(profile) {
  const oracle = activeProgressOracle(profile);
  const [leftClass, rightClass] = scheduleClasses(profile);
  const left = admitAndReady(oracle, profile, leftClass, 'schedule-left');
  const right = admitAndReady(oracle, profile, rightClass, 'schedule-right');
  return { oracle, left, right };
}

function claim(oracle, input, id) {
  assert.equal(oracle.claimReady({ ...workRef(input), claimId: id }).kind, 'claimed');
}

function complete(oracle, input, id) {
  assert.equal(oracle.completeWork({ ...workRef(input), operationId: id, resultVisible: false }).kind, 'completed');
}

export function runSerialProgressSchedule(profile) {
  const { oracle, left, right } = prepared(profile);
  claim(oracle, left, 'serial-left');
  complete(oracle, left, 'serial-left-complete');
  claim(oracle, right, 'serial-right');
  complete(oracle, right, 'serial-right-complete');
  return stableProgressSnapshot(oracle.observeProgress());
}

export function runInterleavedProgressSchedule(profile) {
  const { oracle, left, right } = prepared(profile);
  claim(oracle, left, 'interleaved-left');
  claim(oracle, right, 'interleaved-right');
  complete(oracle, right, 'interleaved-right-complete');
  complete(oracle, left, 'interleaved-left-complete');
  return stableProgressSnapshot(oracle.observeProgress());
}

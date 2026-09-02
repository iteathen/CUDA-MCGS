import assert from 'node:assert/strict';

import { expectCode, profileById, selectedInvocation } from './stage-case-support.mjs';

export function registerStageCases({ defineCase, stageProjection }) {
  defineCase('stage-pending-releases-worker-lease-and-reservation', () => {
    const profile = profileById(stageProjection, 'extension.synthetic-capability-pair');
    const { oracle, input } = selectedInvocation(profile, {
      outcomeCode: 'extension-pending',
      outcomeOverrides: { workerReleased: false },
    });
    const before = oracle.initialState();
    expectCode(() => oracle.apply(before, input), 'STAGE_REFERENCE_PENDING_RELEASE');
    assert.deepEqual(before, oracle.initialState(), 'rejected pending outcome must not mutate Stage state');
    return { pendingRejectedWhenWorkerRetained: true };
  }, ['EXT-OUTCOME-', 'EXT-CONFORMANCE-']);
}

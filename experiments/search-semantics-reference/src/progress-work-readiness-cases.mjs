import assert from 'node:assert/strict';

import {
  activeProgressOracle,
  admitAndReady,
  dependencyFacts,
  expectCode,
  getProgressProfile,
  ordinaryWorkClass,
  workClassByKind,
  workClassForContract,
  workInput,
  workRef,
} from './progress-case-support.mjs';

export function registerProgressWorkReadinessCases({ defineCase, projection }) {
  defineCase('progress-profile-strict-normalization', () => {
    assert.deepEqual(projection.profiles.map(({ id }) => id), [
      'progress.synthetic-evaluator-absent',
      'progress.synthetic-evaluator-workspace',
      'progress.synthetic-live-session',
    ]);
    for (const { normalized: profile } of projection.profiles) {
      assert.equal(profile.compatibility.schedulerIdentityExcluded, true);
      assert.equal(profile.noProgress.source, 'device-visible-ready-facts');
      assert.equal(profile.noProgress.hostObservation, 'non-progressing');
      assert.deepEqual(profile.stop.states, ['running', 'stop-requested', 'draining', 'terminal']);
      assert.equal(profile.stop.counterWrap, 'prohibited');
      assert.deepEqual(profile.lifecycle.states, ['profile-normalized', 'resources-admitted', 'initialized', 'running', 'draining', 'terminal', 'released']);
      const outcomes = new Set(profile.noProgress.outcomes);
      for (const outcome of ['terminal-quiescent', 'legitimate-external-wait', 'recoverable-resource-wait', 'producer-pending', 'deadlock', 'livelock', 'starvation', 'orphaned-work', 'stale-only', 'counter-exhausted']) assert(outcomes.has(outcome), `missing no-progress outcome ${outcome}`);
      const statuses = new Set(profile.statuses.map(({ code }) => code));
      for (const code of ['invalid-progress-profile', 'work-capacity', 'work-stale', 'producer-unavailable', 'progress-deadlock', 'progress-livelock', 'progress-starvation', 'orphaned-work', 'progress-counter-exhausted', 'progress-cancelled', 'progress-internal-failure']) assert(statuses.has(code), `missing Progress status ${code}`);
      for (const workClass of profile.workClasses) {
        for (const key of ['maxAdmitted', 'maxProducedPerStep', 'maxStepsPerAttempt', 'maxRetries', 'maxContinuationDepth', 'maxWaitTransitions', 'counterMaximum']) assert(BigInt(workClass.bounds[key]) > 0n, `${workClass.id} ${key} must be finite and positive`);
      }
      for (const fairness of profile.fairnessClasses) assert(BigInt(fairness.maxServiceOpportunities) > 0n);
      const evaluator = profile.workClasses.find(({ batch }) => batch.kind === 'device-flush');
      if (evaluator) assert.equal(evaluator.batch.hostTimeout, 'none');
      assert.equal(profile.diagnostics.wallClock, false);
    }
    return { profiles: projection.profiles.length, schedulerNeutral: true };
  }, ['PROGRESS-FAIR-004', 'PROGRESS-NOPROGRESS-002', 'PROGRESS-LIFE-003', 'PROGRESS-LIFE-004']);

  defineCase('progress-ready-after-publication', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-workspace');
    const workClass = ordinaryWorkClass(profile);
    const oracle = activeProgressOracle(profile);
    const input = workInput(workClass, 'readiness');
    assert.equal(oracle.admitWork(input).kind, 'admitted');
    expectCode(() => oracle.publishReady({
      ...workRef(input), payloadReady: false, resourceReady: true, dependencyFacts: dependencyFacts(profile, workClass),
    }), 'PROGRESS_REFERENCE_READINESS');
    assert.equal(oracle.observeProgress().work[0].state, 'pending');
    assert.equal(oracle.publishReady({
      ...workRef(input), payloadReady: true, resourceReady: true, dependencyFacts: dependencyFacts(profile, workClass),
    }).kind, 'ready');
    expectCode(() => oracle.claimReady({ ...workRef({ ...input, incarnation: '2' }), claimId: 'wrong-incarnation' }), 'PROGRESS_REFERENCE_WORK');

    const evaluatorClass = workClassForContract(profile, 'SPEC-0009');
    const evaluator = admitAndReady(oracle, profile, evaluatorClass, 'cooperative');
    for (let index = 0; index < Number(BigInt(evaluatorClass.batch.flushAfterOpportunities)); index += 1) oracle.recordServiceOpportunity();
    const first = oracle.claimReady({ ...workRef(evaluator), claimId: 'cooperative-claim', batchReadyItems: '1' });
    assert.equal(first.cooperative, true);
    assert.deepEqual(oracle.claimReady({ ...workRef(evaluator), claimId: 'cooperative-claim', batchReadyItems: '1' }), first, 'cooperative claim retry must be idempotent');
    expectCode(() => oracle.claimReady({ ...workRef(evaluator), claimId: 'different-cooperative-claim', batchReadyItems: '1' }), 'PROGRESS_REFERENCE_CLAIM');
    return { payloadGuard: true, staleClaimGuard: true, cooperativeClaimIdempotent: true };
  }, ['PROGRESS-WORK-003', 'PROGRESS-WORK-004']);

  defineCase('progress-pending-yields-worker', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    const workClass = workClassByKind(profile, 'must-drain');
    const oracle = activeProgressOracle(profile);
    const input = admitAndReady(oracle, profile, workClass, 'continuation');
    assert.equal(oracle.claimReady({ ...workRef(input), claimId: 'continuation-0' }).kind, 'claimed');
    const dependencyId = workClass.readiness.dependencies[0];
    assert(dependencyId, 'must-drain continuation case requires a declared dependency');
    const maximum = Number(BigInt(workClass.bounds.maxContinuationDepth));
    for (let index = 0; index < maximum; index += 1) {
      const yielded = oracle.yieldPending({ ...workRef(input), dependencyId, continuationId: `continuation-${index + 1}` });
      assert.equal(yielded.workerReleased, true);
      assert.equal(oracle.publishReady({
        ...workRef(input), payloadReady: true, resourceReady: true, dependencyFacts: dependencyFacts(profile, workClass),
      }).kind, 'ready');
      assert.equal(oracle.claimReady({ ...workRef(input), claimId: `continuation-claim-${index + 1}` }).kind, 'claimed');
    }
    expectCode(() => oracle.yieldPending({ ...workRef(input), dependencyId, continuationId: 'continuation-overflow' }), 'PROGRESS_REFERENCE_CONTINUATION');
    return { workerReleased: true, boundedContinuationDepth: workClass.bounds.maxContinuationDepth };
  }, ['PROGRESS-WORK-005']);

  defineCase('progress-accounting-conservation', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    const workClass = ordinaryWorkClass(profile);
    const oracle = activeProgressOracle(profile);
    const denied = workInput(workClass, 'denied', { resourceAdmission: { approved: false } });
    assert.deepEqual(oracle.admitWork(denied), { kind: 'pending', code: 'work-capacity' });
    assert.equal(oracle.assertAccounting().admitted, 0);
    const invalidOwner = workInput(workClass, 'invalid-owner', { owner: 'not-the-owner' });
    expectCode(() => oracle.admitWork(invalidOwner), 'PROGRESS_REFERENCE_OWNER');
    assert.equal(oracle.assertAccounting().admitted, 0);

    const completed = admitAndReady(oracle, profile, workClass, 'completed');
    assert.equal(oracle.claimReady({ ...workRef(completed), claimId: 'complete-claim' }).kind, 'claimed');
    const firstCompletion = oracle.completeWork({ ...workRef(completed), operationId: 'complete-op', resultVisible: false });
    assert.equal(firstCompletion.kind, 'completed');
    assert.deepEqual(oracle.completeWork({ ...workRef(completed), operationId: 'complete-op', resultVisible: false }), firstCompletion);

    const failed = workInput(workClass, 'failed');
    assert.equal(oracle.admitWork(failed).kind, 'admitted');
    const ownerFailure = { code: 'owner-domain-failure', detail: 'opaque-owner-detail' };
    assert.deepEqual(oracle.failWork({ ...workRef(failed), code: ownerFailure.code, ownerFailure }).ownerFailure, ownerFailure);
    const accounting = oracle.assertAccounting();
    assert.equal(accounting.admitted, 2);
    assert.equal(accounting.live, 0);
    assert.equal(accounting.terminal, 2);

    const exhausted = activeProgressOracle(profile, { counterStarts: { [workClass.id]: workClass.bounds.counterMaximum } });
    assert.deepEqual(exhausted.admitWork(workInput(workClass, 'counter-exhausted')), { kind: 'stop', code: 'progress-counter-exhausted' });
    assert.equal(exhausted.assertAccounting().admitted, 0);
    assert.deepEqual(exhausted.observeProgress().firstStopCause, { cause: 'progress-counter-exhausted' });
    return { accounting, retryIdempotent: true, ownerFailurePreserved: true, counterWrapPrevented: true };
  }, ['PROGRESS-WORK-001', 'PROGRESS-WORK-002', 'PROGRESS-WORK-006', 'PROGRESS-WORK-007', 'PROGRESS-STOP-007']);
}

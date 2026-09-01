import assert from 'node:assert/strict';

import {
  activeProgressOracle,
  admitAndReady,
  expectCode,
  getProgressProfile,
  optionalContributorForContract,
  ordinaryWorkClass,
  workClassByKind,
  workClassForContract,
  workInput,
  workRef,
} from './progress-case-support.mjs';

export function registerProgressStopLifecycleCases({ defineCase, projection }) {
  defineCase('progress-first-stop-cause', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    const oracle = activeProgressOracle(profile);
    assert.deepEqual(oracle.requestStop({ cause: 'progress-internal-failure' }).firstCause, { cause: 'progress-internal-failure' });
    assert.deepEqual(oracle.requestStop({ cause: 'progress-deadlock' }).firstCause, { cause: 'progress-internal-failure' });
    assert.deepEqual(oracle.beginDraining().firstCause, { cause: 'progress-internal-failure' });
    return { immutableFirstCause: true, lifecycle: oracle.observeProgress().lifecycle };
  }, ['PROGRESS-STOP-001']);

  defineCase('progress-stale-epoch-isolation', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    const workClass = ordinaryWorkClass(profile);
    const oracle = activeProgressOracle(profile);
    const oldWork = admitAndReady(oracle, profile, workClass, 'old-epoch');
    assert.deepEqual(oracle.advanceEpoch({ rootEpoch: '2', workEpoch: '2' }), { kind: 'advanced', epochs: { root: '2', work: '2' }, staleDisposed: 1 });
    expectCode(() => oracle.claimReady({ ...workRef(oldWork), claimId: 'stale-claim' }), 'PROGRESS_REFERENCE_CLAIM');
    const replacement = workInput(workClass, 'replacement', { workId: oldWork.workId, incarnation: '2', rootEpoch: '2', workEpoch: '2' });
    assert.equal(oracle.admitWork(replacement).kind, 'admitted');
    const oldState = oracle.observeProgress().work.find(({ incarnation }) => incarnation === '1');
    assert.equal(oldState.state, 'stale-disposed');
    return { oldEpochState: oldState.state, replacementIncarnation: replacement.incarnation };
  }, ['PROGRESS-WORK-004', 'PROGRESS-WORK-006', 'PROGRESS-STOP-004']);

  defineCase('progress-observation-no-progression', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-live-session');
    const sessionClass = workClassForContract(profile, 'SPEC-0006');
    assert.equal(sessionClass.kind, 'external-control');
    const oracle = activeProgressOracle(profile);
    assert.equal(oracle.admitWork(workInput(sessionClass, 'external-wait')).kind, 'admitted');
    const before = oracle.observeProgress();
    assert.equal(oracle.classifyNoProgress({ externalWait: true }).outcome, 'legitimate-external-wait');
    const after = oracle.observeProgress();
    assert.deepEqual(after, before, 'observation and legitimate external-wait classification must not advance Progress state');
    return { externalWait: true, hostObservationProgressing: false };
  }, ['PROGRESS-FAIR-004', 'PROGRESS-NOPROGRESS-003', 'PROGRESS-STOP-006']);

  defineCase('progress-closure-complete', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    const workClass = workClassByKind(profile, 'must-drain');
    const oracle = activeProgressOracle(profile);
    const input = admitAndReady(oracle, profile, workClass, 'closure-live');
    oracle.requestStop({ cause: 'progress-cancelled' });
    expectCode(() => oracle.publishClosure({ channelsTerminal: true, ownerTransitionsReady: true, resourcesConserved: true, terminalOutputPublishable: true }), 'PROGRESS_REFERENCE_CLOSURE');
    assert.equal(oracle.beginDraining().kind, 'draining');
    expectCode(() => oracle.publishClosure({ channelsTerminal: true, ownerTransitionsReady: true, resourcesConserved: true, terminalOutputPublishable: true }), 'PROGRESS_REFERENCE_CLOSURE_WORK');
    assert.equal(oracle.failWork({ ...workRef(input), code: 'owner-drain-failure', ownerFailure: { code: 'owner-drain-failure' } }).kind, 'failed');
    expectCode(() => oracle.publishClosure({ channelsTerminal: false, ownerTransitionsReady: true, resourcesConserved: true, terminalOutputPublishable: true }), 'PROGRESS_REFERENCE_CLOSURE_DEPENDENCY');
    const closure = oracle.publishClosure({ channelsTerminal: true, ownerTransitionsReady: true, resourcesConserved: true, terminalOutputPublishable: true });
    assert.equal(closure.kind, 'terminal');
    assert.equal(closure.observationAckRequired, false);
    const released = oracle.cleanup();
    assert.equal(released.kind, 'released');
    assert.equal(released.runtimeResidue, 0);
    return { closure: closure.kind, released: true, drainingRequired: true };
  }, ['PROGRESS-STOP-001', 'PROGRESS-STOP-005', 'PROGRESS-STOP-006', 'PROGRESS-LIFE-001', 'PROGRESS-LIFE-002']);

  defineCase('progress-owner-deletion-zero-residue', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    assert.equal(optionalContributorForContract(profile, 'SPEC-0009'), null, 'evaluator-absent profile must contain no evaluator Progress owner');
    assert.equal(optionalContributorForContract(profile, 'SPEC-0006'), null, 'non-live profile must contain no Session Progress owner');
    assert.equal(profile.workClasses.some(({ owner }) => !profile.contributors.some(({ id }) => id === owner)), false);
    const oracle = activeProgressOracle(profile);
    oracle.requestStop({ cause: 'progress-cancelled' });
    oracle.beginDraining();
    oracle.publishClosure({ channelsTerminal: true, ownerTransitionsReady: true, resourcesConserved: true, terminalOutputPublishable: true });
    const cleanup = oracle.cleanup();
    assert.equal(cleanup.runtimeResidue, 0);
    assert.equal(cleanup.dispositions.length, profile.cleanup.kinds.length);
    return { evaluatorResidue: 0, sessionResidue: 0, runtimeResidue: cleanup.runtimeResidue };
  }, ['PROGRESS-LIFE-002']);
}
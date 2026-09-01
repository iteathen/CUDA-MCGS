import assert from 'node:assert/strict';

import {
  activeProgressOracle,
  admitAndReady,
  dependencyFacts,
  expectCode,
  getProgressProfile,
  ordinaryWorkClass,
  workClassByKind,
  workInput,
  workRef,
} from './progress-case-support.mjs';

export function registerProgressSensitivityCases({ defineCase, projection }) {
  defineCase('progress-oracle-sensitivity', () => {
    const profile = getProgressProfile(projection, 'progress.synthetic-evaluator-absent');
    const ordinary = ordinaryWorkClass(profile);

    const readinessBaseline = activeProgressOracle(profile);
    const baselineInput = workInput(ordinary, 'sensitivity-readiness-baseline');
    readinessBaseline.admitWork(baselineInput);
    expectCode(() => readinessBaseline.publishReady({ ...workRef(baselineInput), payloadReady: false, resourceReady: false, dependencyFacts: dependencyFacts(profile, ordinary) }), 'PROGRESS_REFERENCE_READINESS');
    const readinessMutant = activeProgressOracle(profile, { mutations: { allowIncompleteReady: true } });
    const mutantInput = workInput(ordinary, 'sensitivity-readiness-mutant');
    readinessMutant.admitWork(mutantInput);
    assert.equal(readinessMutant.publishReady({ ...workRef(mutantInput), payloadReady: false, resourceReady: false, dependencyFacts: dependencyFacts(profile, ordinary) }).kind, 'ready');

    const fairnessBaseline = activeProgressOracle(profile);
    admitAndReady(fairnessBaseline, profile, ordinary, 'sensitivity-fairness-baseline');
    const fairness = profile.fairnessClasses.find(({ id }) => id === ordinary.fairness);
    for (let index = 0; index <= Number(BigInt(fairness.maxServiceOpportunities)); index += 1) fairnessBaseline.recordServiceOpportunity();
    assert.equal(fairnessBaseline.classifyNoProgress().outcome, 'starvation');
    const fairnessMutant = activeProgressOracle(profile, { mutations: { skipFairness: true } });
    admitAndReady(fairnessMutant, profile, ordinary, 'sensitivity-fairness-mutant');
    for (let index = 0; index <= Number(BigInt(fairness.maxServiceOpportunities)); index += 1) fairnessMutant.recordServiceOpportunity();
    expectCode(() => fairnessMutant.classifyNoProgress(), 'PROGRESS_REFERENCE_PROGRESS_AVAILABLE');

    const closureClass = workClassByKind(profile, 'must-drain');
    const closureBaseline = activeProgressOracle(profile);
    admitAndReady(closureBaseline, profile, closureClass, 'sensitivity-closure-baseline');
    closureBaseline.requestStop({ cause: 'progress-cancelled' });
    expectCode(() => closureBaseline.publishClosure({ channelsTerminal: true, ownerTransitionsReady: true, resourcesConserved: true, terminalOutputPublishable: true }), 'PROGRESS_REFERENCE_CLOSURE_WORK');
    const closureMutant = activeProgressOracle(profile, { mutations: { skipClosureCheck: true } });
    admitAndReady(closureMutant, profile, closureClass, 'sensitivity-closure-mutant');
    closureMutant.requestStop({ cause: 'progress-cancelled' });
    assert.equal(closureMutant.publishClosure({ channelsTerminal: false, ownerTransitionsReady: false, resourcesConserved: false, terminalOutputPublishable: false }).kind, 'terminal');

    return { killedMutants: ['allowIncompleteReady', 'skipFairness', 'skipClosureCheck'] };
  }, ['PROGRESS-WORK-003', 'PROGRESS-FAIR-001', 'PROGRESS-STOP-005']);
}

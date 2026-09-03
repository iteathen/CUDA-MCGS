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
    expectCode(() => closureBaseline.publishClosure({ channelsTerminal: true, ownerTransitionsReady: true, resourcesConserved: true, terminalOutputPublishable: true }), 'PROGRESS_REFERENCE_CLOSURE');
    closureBaseline.beginDraining();
    expectCode(() => closureBaseline.publishClosure({ channelsTerminal: true, ownerTransitionsReady: true, resourcesConserved: true, terminalOutputPublishable: true }), 'PROGRESS_REFERENCE_CLOSURE_WORK');
    const closureMutant = activeProgressOracle(profile, { mutations: { skipClosureCheck: true } });
    admitAndReady(closureMutant, profile, closureClass, 'sensitivity-closure-mutant');
    closureMutant.requestStop({ cause: 'progress-cancelled' });
    closureMutant.beginDraining();
    assert.equal(closureMutant.publishClosure({ channelsTerminal: false, ownerTransitionsReady: false, resourcesConserved: false, terminalOutputPublishable: false }).kind, 'terminal');

    const undeclaredProfile = structuredClone(profile);
    const undeclaredClass = undeclaredProfile.workClasses.find(({ id }) => id === ordinary.id);
    undeclaredClass.terminalStates = undeclaredClass.terminalStates.filter((state) => state !== 'completed');
    const undeclaredOracle = activeProgressOracle(undeclaredProfile);
    const undeclaredInput = admitAndReady(undeclaredOracle, undeclaredProfile, undeclaredClass, 'sensitivity-terminal-declaration');
    assert.equal(undeclaredOracle.claimReady({ ...workRef(undeclaredInput), claimId: 'terminal-declaration-claim' }).kind, 'claimed');
    expectCode(() => undeclaredOracle.completeWork({ ...workRef(undeclaredInput), operationId: 'terminal-declaration-complete', resultVisible: false }), 'PROGRESS_REFERENCE_TERMINAL_DECLARATION');

    const resultVisibleOracle = activeProgressOracle(profile);
    const ordinaryResultVisible = admitAndReady(resultVisibleOracle, profile, ordinary, 'sensitivity-result-visible-kind');
    assert.equal(resultVisibleOracle.claimReady({ ...workRef(ordinaryResultVisible), claimId: 'result-visible-kind-claim' }).kind, 'claimed');
    expectCode(() => resultVisibleOracle.beginResultVisibleTransition(workRef(ordinaryResultVisible)), 'PROGRESS_REFERENCE_RESULT_VISIBLE');

    return {
      killedMutants: ['allowIncompleteReady', 'skipFairness', 'skipClosureCheck', 'undeclaredTerminalState'],
      resultVisibleKindGuard: true,
    };
  }, ['PROGRESS-WORK-003', 'PROGRESS-WORK-005', 'PROGRESS-FAIR-001', 'PROGRESS-STOP-003', 'PROGRESS-STOP-005']);
}

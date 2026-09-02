import assert from 'node:assert/strict';

import {
  activeProgressOracle,
  admitAndReady,
  expectCode,
  getProgressProfile,
  workClassByKind,
} from './progress-case-support.mjs';
import {
  getOutputProfile,
  initializedOutputOracle,
} from './output-case-support.mjs';
import {
  admitFramework,
  igniteFramework,
  initializeFramework,
  normalizeFrameworkLifecycleProfile,
  recordStopCause,
  requestFrameworkCancellation,
} from './framework-lifecycle.mjs';
import { closeProgressThenClassifyOutput } from './terminal-slice.mjs';
import {
  runCompleteTerminalSlice,
  terminalSliceMeaning,
  terminalSliceScheduleOrders,
} from './terminal-slice-runtime.mjs';

function rollbackFacts() {
  return {
    taskCreatedStateDisposedOrQuarantined: true,
    protectedPreExistingStatePreserved: true,
    protectedUserStatePreserved: true,
    protectedSharedStatePreserved: true,
  };
}

function cancellationFacts() {
  return {
    reservationAccountingConserved: true,
    resourceAccountingConserved: true,
    ownerRulesApplied: true,
    partialBackupPublished: false,
    prematureTeardown: false,
    workDispositions: ['abandon', 'must-drain', 'release'],
  };
}

export function registerTerminalSliceCases({
  defineCase,
  composerEvidence,
  domainFixture,
  frameworkFixture,
  projections,
}) {
  defineCase('terminal-slice-must-drain-gates-output', () => {
    const progressProfile = getProgressProfile(projections.progress, 'progress.synthetic-evaluator-absent');
    const outputProfile = getOutputProfile(projections.output, 'output.synthetic-evaluator-absent');
    const progress = activeProgressOracle(progressProfile);
    const output = initializedOutputOracle(outputProfile, {
      searchIdentity: 'search.terminal-slice',
      sessionIdentity: 'session-absent',
    });

    const mustDrainClass = workClassByKind(progressProfile, 'must-drain');
    admitAndReady(progress, progressProfile, mustDrainClass, 'terminal-order');
    progress.requestStop({ cause: 'progress-cancelled' });
    assert.equal(progress.beginDraining().kind, 'draining');

    const outputBefore = output.snapshot();
    const error = expectCode(() => closeProgressThenClassifyOutput({
      progress,
      output,
      progressClosureFacts: {
        channelsTerminal: true,
        ownerTransitionsReady: true,
        resourcesConserved: true,
        terminalOutputPublishable: true,
      },
      outputEnvelope: {
        completionClass: 'failed',
        firstStopCause: 'progress-cancelled',
        completedWork: { count: '0', unit: 'work-items' },
        policyBudgetStatus: 'cancelled',
        resourceStatus: { kind: 'conserved' },
        diagnosticIdentity: 'diagnostic.terminal-slice.must-drain',
        laterDispositions: [],
      },
    }), 'PROGRESS_REFERENCE_CLOSURE_WORK');

    assert.deepEqual(output.snapshot(), outputBefore);
    return { progressRejection: error.code, outputUnchanged: true, hostProgressRequired: false };
  });

  defineCase('terminal-slice-evaluator-absent-full-lifecycle', () => {
    const result = runCompleteTerminalSlice({
      composerEvidence,
      domainFixture,
      frameworkFixture,
      projections,
      family: 'absent',
      scheduleId: 'terminal-absent-owner-major',
      order: terminalSliceScheduleOrders().ownerMajor,
    });
    const meaning = terminalSliceMeaning(result);
    assert.equal(meaning.evaluatorSelection, 'absent');
    assert.equal(meaning.evaluatorResidue, 0);
    assert.equal(meaning.resourceConservation, 'conserved');
    assert.equal(meaning.progressClosure, 'terminal');
    assert.equal(meaning.hostProgressRequired, false);
    return meaning;
  });

  defineCase('terminal-slice-evaluator-selected-schedule-invariant', () => {
    const orders = terminalSliceScheduleOrders();
    const ownerMajor = runCompleteTerminalSlice({
      composerEvidence,
      domainFixture,
      frameworkFixture,
      projections,
      family: 'selected',
      scheduleId: 'terminal-selected-owner-major',
      order: orders.ownerMajor,
    });
    const resourceInterleaved = runCompleteTerminalSlice({
      composerEvidence,
      domainFixture,
      frameworkFixture,
      projections,
      family: 'selected',
      scheduleId: 'terminal-selected-resource-interleaved',
      order: orders.resourceInterleaved,
    });
    const first = terminalSliceMeaning(ownerMajor);
    const second = terminalSliceMeaning(resourceInterleaved);
    assert.deepEqual(second, first, 'materially different legal schedules must preserve terminal semantics');
    return { meaning: first, schedulesCompared: 2 };
  });

  defineCase('terminal-slice-cancellation-drains-and-cleans', () => {
    const profile = normalizeFrameworkLifecycleProfile(frameworkFixture.profile);
    const running = igniteFramework(initializeFramework(admitFramework(profile)));
    const stopped = recordStopCause(running, 'semantic-failure');
    const cancelled = requestFrameworkCancellation(stopped, cancellationFacts());
    assert.equal(cancelled.status, 'framework-cancelling');
    assert.equal(cancelled.stopCause, 'semantic-failure');
    assert.deepEqual(cancelled.cancellationFacts.workDispositions, ['abandon', 'must-drain', 'release']);

    const completed = runCompleteTerminalSlice({
      composerEvidence,
      domainFixture,
      frameworkFixture,
      projections,
      family: 'absent',
      scheduleId: 'terminal-cancellation-cleanup-proof',
      order: terminalSliceScheduleOrders().resourceInterleaved,
    });
    assert.equal(completed.resourceConservation.kind, 'conserved');
    assert.equal(completed.progressClosure.kind, 'terminal');
    assert.equal(completed.evaluatorResidue, 0);
    return {
      cancellationStatus: cancelled.status,
      stopCause: cancelled.stopCause,
      workDispositions: cancelled.cancellationFacts.workDispositions,
      cleanupMeaning: terminalSliceMeaning(completed),
    };
  });

  defineCase('terminal-slice-initialization-failure-reverse-unwind', () => {
    const profile = normalizeFrameworkLifecycleProfile(frameworkFixture.profile);
    const failed = initializeFramework(admitFramework(profile), 'resource', rollbackFacts());
    assert.equal(failed.phase, 'framework-initialization-failed');
    assert.equal(failed.ignitable, false);
    assert.deepEqual(failed.createdOwners, []);
    assert.deepEqual(failed.releasedOwners, ['evaluator', 'policy', 'graph', 'domain']);
    assert.equal(failed.evidencePreserved, true);
    return { phase: failed.phase, releasedOwners: failed.releasedOwners, evidencePreserved: failed.evidencePreserved };
  });

  defineCase('terminal-slice-absence-zero-residue', () => {
    const result = runCompleteTerminalSlice({
      composerEvidence,
      domainFixture,
      frameworkFixture,
      projections,
      family: 'absent',
      scheduleId: 'terminal-absence-zero-residue',
      order: terminalSliceScheduleOrders().ownerMajor,
    });
    assert.equal(result.evaluatorSelection, 'absent');
    assert.equal(result.evaluatorResidue, 0);
    assert.equal(result.firstProductSpecificResidue, 0);
    assert.equal(result.hostProgressRequired, false);
    assert.equal(result.outputCleanup.runtimeResidue, 0);
    return {
      evaluatorSelection: result.evaluatorSelection,
      evaluatorResidue: result.evaluatorResidue,
      outputResidue: result.outputCleanup.runtimeResidue,
      firstProductSpecificResidue: result.firstProductSpecificResidue,
      hostProgressRequired: result.hostProgressRequired,
    };
  });
}

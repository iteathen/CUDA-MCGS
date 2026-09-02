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
import { closeProgressThenClassifyOutput } from './terminal-slice.mjs';

export function registerTerminalSliceCases({ defineCase, progressProjection, outputProjection }) {
  defineCase('terminal-slice-must-drain-gates-output', () => {
    const progressProfile = getProgressProfile(progressProjection, 'progress.synthetic-evaluator-absent');
    const outputProfile = getOutputProfile(outputProjection, 'output.synthetic-evaluator-absent');
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

    assert.deepEqual(
      output.snapshot(),
      outputBefore,
      'Progress rejection must leave Output completely unclassified and unchanged',
    );

    return {
      progressRejection: error.code,
      outputUnchanged: true,
      hostProgressRequired: false,
    };
  });
}

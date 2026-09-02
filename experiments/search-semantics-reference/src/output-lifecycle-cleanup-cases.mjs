import assert from 'node:assert/strict';

import {
  admitLive,
  classifyTerminal,
  expectCode,
  fact,
  factsForFields,
  getOutputProfile,
  initializedOutputOracle,
  liveFields,
  publishTerminal,
  terminalFields,
} from './output-case-support.mjs';

export function registerOutputLifecycleCleanupCases({ defineCase, projection }) {
  defineCase('output-generation-exhaustion', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-live-session');
    const oracle = initializedOutputOracle(profile, { limits: { maxObservationSlots: '2', maxSequence: '1' } });
    const first = admitLive(oracle, profile, 'generation-1');
    oracle.captureObservation({ requestId: 'generation-1', facts: factsForFields(liveFields(profile)) });
    oracle.publishOutput({ slotId: first.slotId });
    admitLive(oracle, profile, 'generation-2');
    expectCode(() => oracle.captureObservation({ requestId: 'generation-2', facts: factsForFields(liveFields(profile)) }), 'OUTPUT_REFERENCE_GENERATION_EXHAUSTED');
    assert.equal(oracle.snapshot().sequence, '1');
    return { wrapped: false, terminalFailureBeforeAlias: true };
  }, ['OUTPUT-LIFE-008']);

  defineCase('output-product-capability-deletion', () => {
    const liveProfile = getOutputProfile(projection, 'output.synthetic-live-session');
    const terminalProfile = getOutputProfile(projection, 'output.synthetic-evaluator-absent');
    const liveOnlyKinds = new Set(['observation-request', 'observation-slot', 'observation-payload', 'sequence', 'continuation']);
    assert([...liveOnlyKinds].every((kind) => liveProfile.cleanup.kinds.includes(kind)));
    assert([...liveOnlyKinds].every((kind) => !terminalProfile.cleanup.kinds.includes(kind)));
    assert.equal(terminalProfile.observations.kind, 'absent');
    assert(!terminalProfile.fields.some(({ semanticRole }) => ['ranking', 'evaluation-summary'].includes(semanticRole)));

    const oracle = initializedOutputOracle(terminalProfile);
    publishTerminal(oracle, terminalProfile);
    const report = oracle.cleanupReport();
    for (const kind of terminalProfile.cleanup.kinds) assert(report.some(({ id, disposition }) => id === kind && ['pending', 'retain', 'release', 'quarantine'].includes(disposition)));
    assert(!report.some(({ id }) => [...liveOnlyKinds].some((kind) => id === kind || id.startsWith(`${kind}:`))));
    return { deletedLiveResidue: true, cleanupKinds: terminalProfile.cleanup.kinds };
  }, ['OUTPUT-CLEANUP-001', 'OUTPUT-CLEANUP-003']);

  defineCase('output-oracle-sensitivity-publication', () => {
    const structured = getOutputProfile(projection, 'output.synthetic-evaluator-workspace');

    const incompleteBaseline = initializedOutputOracle(structured);
    classifyTerminal(incompleteBaseline);
    incompleteBaseline.captureTerminalPayload({ facts: factsForFields(terminalFields(structured)), completeWrites: false });
    expectCode(() => incompleteBaseline.publishOutput({ slotId: 'terminal-0' }), 'OUTPUT_REFERENCE_PUBLICATION_INCOMPLETE');

    const incompleteMutant = initializedOutputOracle(structured, { mutations: { skipPublicationReadiness: true } });
    classifyTerminal(incompleteMutant);
    incompleteMutant.captureTerminalPayload({ facts: factsForFields(terminalFields(structured)), completeWrites: false });
    assert.equal(incompleteMutant.publishOutput({ slotId: 'terminal-0' }).kind, 'ready');

    const readinessProfile = structuredClone(structured);
    const requiredField = terminalFields(readinessProfile)[0];
    requiredField.presence = 'required';
    const pendingFacts = factsForFields(terminalFields(readinessProfile), { byField: { [requiredField.id]: { state: 'pending' } } });
    const readinessBaseline = initializedOutputOracle(readinessProfile);
    classifyTerminal(readinessBaseline);
    expectCode(() => readinessBaseline.captureTerminalPayload({ facts: pendingFacts }), 'OUTPUT_REFERENCE_SOURCE_UNAVAILABLE');
    const readinessMutant = initializedOutputOracle(readinessProfile, { mutations: { skipReadiness: true } });
    classifyTerminal(readinessMutant);
    readinessMutant.captureTerminalPayload({ facts: pendingFacts });
    assert.equal(readinessMutant.publishOutput({ slotId: 'terminal-0' }).kind, 'ready');

    const live = getOutputProfile(projection, 'output.synthetic-live-session');
    const staleBaseline = initializedOutputOracle(live);
    const staleAdmission = admitLive(staleBaseline, live, 'sensitivity-stale');
    staleBaseline.captureObservation({ requestId: 'sensitivity-stale', facts: factsForFields(liveFields(live)) });
    staleBaseline.advanceRoot({ rootEpoch: '2', workEpoch: '2' });
    expectCode(() => staleBaseline.publishOutput({ slotId: staleAdmission.slotId }), 'OUTPUT_REFERENCE_STALE_ROOT');
    const staleMutant = initializedOutputOracle(live, { mutations: { skipIncarnation: true } });
    const staleMutantAdmission = admitLive(staleMutant, live, 'sensitivity-stale-mutant');
    staleMutant.captureObservation({ requestId: 'sensitivity-stale-mutant', facts: factsForFields(liveFields(live)) });
    staleMutant.advanceRoot({ rootEpoch: '2', workEpoch: '2' });
    assert.equal(staleMutant.publishOutput({ slotId: staleMutantAdmission.slotId }).kind, 'ready');

    const versionField = liveFields(live)[0];
    const consistencyBaseline = initializedOutputOracle(live);
    admitLive(consistencyBaseline, live, 'sensitivity-consistency');
    assert.equal(consistencyBaseline.captureObservation({
      requestId: 'sensitivity-consistency',
      facts: [fact(versionField, { value: 'v1' }, { version: '1' })],
      versionsBefore: { [versionField.id]: '1' },
      versionsAfter: { [versionField.id]: '2' },
    }).kind, 'retry');
    const consistencyMutant = initializedOutputOracle(live, { mutations: { skipConsistency: true } });
    const consistencyAdmission = admitLive(consistencyMutant, live, 'sensitivity-consistency-mutant');
    assert.equal(consistencyMutant.captureObservation({
      requestId: 'sensitivity-consistency-mutant',
      facts: [fact(versionField, { value: 'v1' }, { version: '1' })],
      versionsBefore: { [versionField.id]: '1' },
      versionsAfter: { [versionField.id]: '2' },
    }).kind, 'captured');
    assert.equal(consistencyMutant.publishOutput({ slotId: consistencyAdmission.slotId }).kind, 'ready');

    const conflict = initializedOutputOracle(structured);
    publishTerminal(conflict, structured);
    const quarantine = conflict.failOutput({ slotId: 'terminal-0', reason: 'conflicting-terminal-outcome' });
    assert.equal(quarantine.kind, 'quarantined');
    assert(conflict.cleanupReport().some(({ id, disposition }) => id === 'terminal-payload' && disposition === 'quarantine'));

    return {
      killedMutants: ['skipPublicationReadiness', 'skipReadiness', 'skipIncarnation', 'skipConsistency'],
      conflictingTerminalQuarantined: true,
    };
  }, ['OUTPUT-PUB-002', 'OUTPUT-PUB-003', 'OUTPUT-SNAPSHOT-003', 'OUTPUT-SNAPSHOT-005', 'OUTPUT-CLEANUP-002']);
}

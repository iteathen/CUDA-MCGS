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
  versionMaps,
} from './output-case-support.mjs';

export function registerOutputLifecycleCleanupCases({ defineCase, projection }) {
  defineCase('output-generation-exhaustion', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-live-session');
    const oracle = initializedOutputOracle(profile, { limits: { maxObservationSlots: '2', maxSequence: '1' } });
    const first = admitLive(oracle, profile, 'generation-1');
    const firstFacts = factsForFields(liveFields(profile));
    oracle.captureObservation({ requestId: 'generation-1', facts: firstFacts, ...versionMaps(firstFacts) });
    oracle.publishOutput({ slotId: first.slotId });
    admitLive(oracle, profile, 'generation-2');
    const secondFacts = factsForFields(liveFields(profile));
    expectCode(() => oracle.captureObservation({ requestId: 'generation-2', facts: secondFacts, ...versionMaps(secondFacts) }), 'OUTPUT_REFERENCE_GENERATION_EXHAUSTED');
    assert.equal(oracle.snapshot().sequence, '1');
    const cleanup = oracle.cleanupReport();
    assert(cleanup.some(({ id, disposition }) => id === 'observation-slot:generation-2' && disposition === 'retire'));
    assert(cleanup.some(({ id, disposition }) => id === 'observation-payload:generation-2' && disposition === 'retire'));
    return { wrapped: false, terminalFailureBeforeAlias: true, exhaustedSlotRetired: true };
  }, ['OUTPUT-LIFE-008', 'OUTPUT-CLEANUP-001']);

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
    const settledDispositions = new Set(['retain', 'release', 'retire', 'invalidate', 'quarantine']);
    for (const kind of terminalProfile.cleanup.kinds) {
      const entry = report.find(({ id }) => id === kind);
      assert(entry, `missing cleanup entry ${kind}`);
      assert(settledDispositions.has(entry.disposition), `${kind} cleanup must be explicit, not pending`);
    }
    assert(!report.some(({ id }) => [...liveOnlyKinds].some((kind) => id === kind || id.startsWith(`${kind}:`))));
    return { deletedLiveResidue: true, cleanupKinds: terminalProfile.cleanup.kinds, allCleanupExplicit: true };
  }, ['OUTPUT-CLEANUP-001', 'OUTPUT-CLEANUP-003']);

  defineCase('output-oracle-sensitivity-publication', () => {
    const structured = getOutputProfile(projection, 'output.synthetic-evaluator-workspace');

    const incompleteBaseline = initializedOutputOracle(structured);
    classifyTerminal(incompleteBaseline);
    incompleteBaseline.captureTerminalPayload({ facts: factsForFields(terminalFields(structured)), completeWrites: false });
    expectCode(() => incompleteBaseline.publishOutput({ slotId: 'terminal-0' }), 'OUTPUT_REFERENCE_PUBLICATION_INCOMPLETE');
    const incompleteCleanup = incompleteBaseline.cleanupReport();
    assert(incompleteCleanup.some(({ id, disposition }) => id === 'terminal-slot' && disposition === 'quarantine'));
    assert(incompleteCleanup.some(({ id, disposition }) => id === 'terminal-payload' && disposition === 'quarantine'));

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
    const staleFacts = factsForFields(liveFields(live));
    const staleVersions = versionMaps(staleFacts);
    const staleBaseline = initializedOutputOracle(live);
    const staleAdmission = admitLive(staleBaseline, live, 'sensitivity-stale');
    staleBaseline.captureObservation({ requestId: 'sensitivity-stale', facts: staleFacts, ...staleVersions });
    staleBaseline.advanceRoot({ rootEpoch: '2', workEpoch: '2' });
    expectCode(() => staleBaseline.publishOutput({ slotId: staleAdmission.slotId }), 'OUTPUT_REFERENCE_STALE_ROOT');
    const staleCleanup = staleBaseline.cleanupReport();
    assert(staleCleanup.some(({ id, disposition }) => id === 'observation-slot:sensitivity-stale' && disposition === 'quarantine'));
    assert(staleCleanup.some(({ id, disposition }) => id === 'observation-payload:sensitivity-stale' && disposition === 'quarantine'));

    const staleMutantFacts = factsForFields(liveFields(live));
    const staleMutantVersions = versionMaps(staleMutantFacts);
    const staleMutant = initializedOutputOracle(live, { mutations: { skipIncarnation: true } });
    const staleMutantAdmission = admitLive(staleMutant, live, 'sensitivity-stale-mutant');
    staleMutant.captureObservation({ requestId: 'sensitivity-stale-mutant', facts: staleMutantFacts, ...staleMutantVersions });
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
    const conflictCleanup = conflict.cleanupReport();
    assert(conflictCleanup.some(({ id, disposition }) => id === 'terminal-slot' && disposition === 'quarantine'));
    assert(conflictCleanup.some(({ id, disposition }) => id === 'terminal-payload' && disposition === 'quarantine'));

    return {
      killedMutants: ['skipPublicationReadiness', 'skipReadiness', 'skipIncarnation', 'skipConsistency'],
      partialPublicationQuarantined: true,
      stalePublicationQuarantined: true,
      conflictingTerminalQuarantined: true,
    };
  }, ['OUTPUT-PUB-002', 'OUTPUT-PUB-003', 'OUTPUT-SNAPSHOT-003', 'OUTPUT-SNAPSHOT-005', 'OUTPUT-CLEANUP-002']);
}

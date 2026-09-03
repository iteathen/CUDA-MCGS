import assert from 'node:assert/strict';

import {
  acquirePublished,
  admitLive,
  captureAndPublishLive,
  expectCode,
  fact,
  factsForFields,
  getOutputProfile,
  initializedOutputOracle,
  liveFields,
  liveSchema,
  publishTerminal,
  releasePublished,
  slotIdentity,
  stableSourceSemantics,
  terminalFields,
  versionMaps,
} from './output-case-support.mjs';

export function registerOutputSnapshotPublicationCases({ defineCase, projection }) {
  defineCase('output-independently-versioned-honesty', () => {
    const profile = structuredClone(getOutputProfile(projection, 'output.synthetic-live-session'));
    const schema = liveSchema(profile);
    schema.consistency = 'independently-versioned';
    profile.observations.profiles[0].consistency = 'independently-versioned';
    profile.snapshot.independentVersions = structuredClone(profile.snapshot.versionRelation);
    const original = liveFields(profile)[0];
    const second = structuredClone(original);
    second.id = `${original.id}-second`;
    second.order = '1';
    profile.fields.push(second);
    schema.fieldOrder.push(second.id);

    const oracle = initializedOutputOracle(profile);
    const admission = admitLive(oracle, profile, 'independent');
    const fields = liveFields(profile);
    const captured = oracle.captureObservation({
      requestId: 'independent',
      facts: [
        fact(fields[0], { source: 'old-cut' }, { version: '10' }),
        fact(fields[1], { source: 'new-cut' }, { version: '22' }),
      ],
    });
    assert.equal(captured.kind, 'captured');
    assert.deepEqual(captured.versions.map(({ version }) => version), ['10', '22']);
    const ready = oracle.publishOutput({ slotId: admission.slotId });
    assert.equal(ready.kind, 'ready');
    assert.equal(ready.metadata.consistency, 'independently-versioned');
    assert.deepEqual(ready.metadata.sourceVersions.map(({ version }) => version), ['10', '22']);
    return { consistency: ready.metadata.consistency, versions: ready.metadata.sourceVersions };
  }, ['OUTPUT-SNAPSHOT-004', 'OUTPUT-OBS-007']);

  defineCase('output-versioned-cut-retry', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-live-session');
    const field = liveFields(profile)[0];
    const oracle = initializedOutputOracle(profile);
    const admission = admitLive(oracle, profile, 'versioned-retry');

    const missingProof = oracle.captureObservation({
      requestId: 'versioned-retry',
      facts: [fact(field, { state: 'candidate-without-proof' }, { version: '1' })],
    });
    assert.equal(missingProof.kind, 'retry');
    assert.equal(missingProof.code, 'output-capture-inconsistent');

    const changed = oracle.captureObservation({
      requestId: 'versioned-retry',
      facts: [fact(field, { state: 'candidate-1' }, { version: '1' })],
      versionsBefore: { [field.id]: '1' },
      versionsAfter: { [field.id]: '2' },
    });
    assert.equal(changed.kind, 'retry');
    assert.equal(changed.code, 'output-capture-inconsistent');

    const mismatchedStableProof = oracle.captureObservation({
      requestId: 'versioned-retry',
      facts: [fact(field, { state: 'candidate-stale' }, { version: '1' })],
      versionsBefore: { [field.id]: '2' },
      versionsAfter: { [field.id]: '2' },
    });
    assert.equal(mismatchedStableProof.kind, 'retry');

    const captured = oracle.captureObservation({
      requestId: 'versioned-retry',
      facts: [fact(field, { state: 'candidate-2' }, { version: '2' })],
      versionsBefore: { [field.id]: '2' },
      versionsAfter: { [field.id]: '2' },
    });
    assert.equal(captured.kind, 'captured');
    const ready = oracle.publishOutput({ slotId: admission.slotId });
    assert.equal(ready.kind, 'ready');
    assert.equal(ready.metadata.sourceVersions[0].version, '2');
    return { retried: true, finalVersion: captured.versions[0].version };
  }, ['OUTPUT-SNAPSHOT-003']);

  defineCase('output-stale-root-publication', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-live-session');
    const field = liveFields(profile)[0];

    const generationOracle = initializedOutputOracle(profile);
    admitLive(generationOracle, profile, 'stale-generation');
    const generationFact = fact(field, { state: 'wrong-generation' }, { version: '1', generation: '2' });
    const generationVersions = versionMaps([generationFact]);
    expectCode(() => generationOracle.captureObservation({
      requestId: 'stale-generation',
      facts: [generationFact],
      ...generationVersions,
      expectedGenerations: { [field.id]: '1' },
    }), 'OUTPUT_REFERENCE_SOURCE_GENERATION');
    const generationCleanup = generationOracle.cleanupReport();
    assert(generationCleanup.some(({ id, disposition }) => id === 'observation-slot:stale-generation' && disposition === 'quarantine'));
    assert(generationCleanup.some(({ id, disposition }) => id === 'observation-payload:stale-generation' && disposition === 'quarantine'));

    const oracle = initializedOutputOracle(profile);
    const admission = admitLive(oracle, profile, 'stale-root');
    const facts = factsForFields(liveFields(profile));
    const versions = versionMaps(facts);
    oracle.captureObservation({ requestId: 'stale-root', facts, ...versions });
    oracle.advanceRoot({ rootEpoch: '2', workEpoch: '2' });
    assert.equal(oracle.outputCurrent({ slotId: admission.slotId }), false);
    expectCode(() => oracle.publishOutput({ slotId: admission.slotId }), 'OUTPUT_REFERENCE_STALE_ROOT');
    const staleCleanup = oracle.cleanupReport();
    assert(staleCleanup.some(({ id, disposition }) => id === 'observation-slot:stale-root' && disposition === 'quarantine'));
    assert(staleCleanup.some(({ id, disposition }) => id === 'observation-payload:stale-root' && disposition === 'quarantine'));
    return {
      oldPublicationRelabeled: false,
      sourceGenerationValidated: true,
      staleEvidenceQuarantined: true,
      currentRoot: oracle.snapshot().context.rootEpoch,
    };
  }, ['OUTPUT-OBS-006', 'OUTPUT-OBS-007', 'OUTPUT-OBS-011', 'OUTPUT-SNAPSHOT-005', 'OUTPUT-LIFE-004', 'OUTPUT-CLEANUP-002']);

  defineCase('output-protected-source-lifetime', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-live-session');
    const field = liveFields(profile)[0];
    const unsafe = initializedOutputOracle(profile);
    admitLive(unsafe, profile, 'unprotected-source');
    expectCode(() => unsafe.captureObservation({
      requestId: 'unprotected-source',
      facts: [fact(field, { source: 'reclaimed' }, { protected: false })],
    }), 'OUTPUT_REFERENCE_SOURCE_PROTECTION');
    const unsafeCleanup = unsafe.cleanupReport();
    assert(unsafeCleanup.some(({ id, disposition }) => id === 'observation-slot:unprotected-source' && disposition === 'quarantine'));
    assert(unsafeCleanup.some(({ id, disposition }) => id === 'observation-payload:unprotected-source' && disposition === 'quarantine'));

    const terminal = initializedOutputOracle(profile);
    const publication = publishTerminal(terminal, profile);
    acquirePublished(terminal, publication, 'protected-terminal');
    const pending = terminal.teardown();
    assert.equal(pending.kind, 'pending-borrow-or-transfer');
    releasePublished(terminal, publication, 'protected-terminal');
    assert.equal(terminal.teardown().kind, 'terminal-retained');
    return { sourceProtectionRequired: true, staleSourceQuarantined: true, teardownWaitedForBorrow: true };
  }, ['OUTPUT-SNAPSHOT-006', 'OUTPUT-TERMINAL-009', 'OUTPUT-LIFE-005', 'OUTPUT-CLEANUP-002']);

  defineCase('output-bounded-sequence-cycle', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-evaluator-workspace');
    const oracle = initializedOutputOracle(profile);
    const cycle = oracle.captureBoundedSequence({
      maxDepth: '8',
      items: [
        { id: 'node-a', generation: '1' },
        { id: 'node-b', generation: '1' },
        { id: 'node-a', generation: '1' },
      ],
    });
    assert.equal(cycle.kind, 'cycle');
    assert.equal(cycle.cycleId, 'node-a');
    const truncated = oracle.captureBoundedSequence({
      maxDepth: '2',
      items: [
        { id: 'node-a', generation: '1' },
        { id: 'node-b', generation: '2' },
        { id: 'node-c', generation: '3' },
      ],
    });
    assert.equal(truncated.kind, 'truncated');
    assert.equal(truncated.captured.length, 2);
    const stale = oracle.captureBoundedSequence({ maxDepth: '4', items: [{ id: 'node-z', generation: '9', state: 'stale' }] });
    assert.equal(stale.kind, 'stale');
    const generationStale = oracle.captureBoundedSequence({
      maxDepth: '4',
      items: [{ id: 'node-g', generation: '2' }],
      expectedGenerations: { 'node-g': '1' },
    });
    assert.equal(generationStale.kind, 'stale');
    assert.equal(generationStale.staleId, 'node-g');
    return { cycle, truncated, stale, generationStale };
  }, ['OUTPUT-SNAPSHOT-007', 'OUTPUT-SNAPSHOT-008']);

  defineCase('output-ready-immutability', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-evaluator-workspace');
    const oracle = initializedOutputOracle(profile);
    const ready = publishTerminal(oracle, profile);
    assert.equal(ready.kind, 'ready');
    assert.equal(oracle.publishOutput({ slotId: 'terminal-0' }).kind, 'already-ready');
    expectCode(() => oracle.captureTerminalPayload({ facts: factsForFields(terminalFields(profile)) }), 'OUTPUT_REFERENCE_TERMINAL_STATE');
    const snapshot = oracle.snapshot();
    const slot = snapshot.slots.find(({ id }) => id === 'terminal-0');
    assert(Object.isFrozen(slot.payload));
    return { exactlyOnce: true, payloadFrozen: true };
  }, ['OUTPUT-TERMINAL-008', 'OUTPUT-PUB-001', 'OUTPUT-PUB-002', 'OUTPUT-PUB-004']);

  defineCase('output-borrow-reuse-race', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-evaluator-absent');

    const staleOracle = initializedOutputOracle(profile);
    const stalePublication = publishTerminal(staleOracle, profile);
    const staleBefore = staleOracle.snapshot();
    expectCode(() => staleOracle.acquireOutput({
      ...slotIdentity(stalePublication, { incarnation: '0' }),
      borrowId: 'stale-borrow',
    }), 'OUTPUT_REFERENCE_BORROW_IDENTITY');
    const staleAfter = staleOracle.snapshot();
    assert.equal(staleAfter.counters.borrowed, staleBefore.counters.borrowed, 'failed stale borrow acquisition must not increment borrow count');
    assert.deepEqual(stableSourceSemantics(staleAfter), stableSourceSemantics(staleBefore));
    const staleCleanup = staleOracle.cleanupReport();
    assert(staleCleanup.some(({ id, disposition }) => id === 'terminal-slot' && disposition === 'quarantine'));
    assert(staleCleanup.some(({ id, disposition }) => id === 'terminal-payload' && disposition === 'quarantine'));

    const oracle = initializedOutputOracle(profile);
    const publication = publishTerminal(oracle, profile);
    acquirePublished(oracle, publication, 'borrow-1');
    acquirePublished(oracle, publication, 'borrow-2');
    releasePublished(oracle, publication, 'borrow-1');
    expectCode(() => releasePublished(oracle, publication, 'borrow-1'), 'OUTPUT_REFERENCE_BORROW_RELEASE');
    assert.equal(oracle.classifyOutputReuse(slotIdentity(publication)).kind, 'protected');

    oracle.beginHostTransfer({ ...slotIdentity(publication), transferId: 'transfer-1' });
    const expired = oracle.expireBorrow({ ...slotIdentity(publication), borrowId: 'borrow-2' });
    assert.equal(expired.stillProtected, true);
    assert.equal(oracle.classifyOutputReuse(slotIdentity(publication)).kind, 'protected');
    oracle.completeHostTransfer({ ...slotIdentity(publication), transferId: 'transfer-1' });
    assert.equal(oracle.classifyOutputReuse(slotIdentity(publication)).kind, 'protected');
    expectCode(() => releasePublished(oracle, publication, 'borrow-2'), 'OUTPUT_REFERENCE_BORROW_QUIESCENCE');
    releasePublished(oracle, publication, 'borrow-2', { operationQuiescent: true });
    const reused = oracle.classifyOutputReuse(slotIdentity(publication));
    assert.equal(reused.kind, 'reusable');
    assert.notEqual(reused.incarnation, publication.incarnation, 'reuse must advance slot incarnation before new publication authority');
    return {
      doubleReleaseRejected: true,
      staleBorrowRejectedAndQuarantined: true,
      transferProtectedReuse: true,
      newIncarnation: reused.incarnation,
    };
  }, ['OUTPUT-PUB-005', 'OUTPUT-PUB-008', 'OUTPUT-PUB-011', 'OUTPUT-TERMINAL-009', 'OUTPUT-LIFE-006', 'OUTPUT-LIFE-007', 'OUTPUT-CLEANUP-002']);

  defineCase('output-drop-coalesce-accounting', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-live-session');
    assert.equal(profile.observations.profiles[0].pressure.kind, 'latest-coalesce');
    const oracle = initializedOutputOracle(profile, { limits: { maxObservationSlots: '1' } });
    const first = captureAndPublishLive(oracle, profile, 'coalesce-1');
    assert.equal(first.kind, 'ready');
    const secondAdmission = admitLive(oracle, profile, 'coalesce-2');
    assert.equal(secondAdmission.kind, 'admitted');
    const snapshotAfterAdmission = oracle.snapshot();
    assert.equal(snapshotAfterAdmission.counters.coalesced, '1');
    assert.equal(snapshotAfterAdmission.counters.ready, '0');
    assert.equal(snapshotAfterAdmission.counters.highWater, '1');
    assert.equal(snapshotAfterAdmission.sourceMutationCount, '0');

    const secondFacts = liveFields(profile).map((field) => fact(field, { generation: 2 }, { version: '2' }));
    const secondVersions = versionMaps(secondFacts);
    oracle.captureObservation({ requestId: 'coalesce-2', facts: secondFacts, ...secondVersions });
    const second = oracle.publishOutput({ slotId: secondAdmission.slotId });
    assert.equal(second.kind, 'ready');
    assert.equal(second.metadata.lossAccounting.coalesced, '1');
    assert(second.metadata.lossAccounting.lostSequences.includes(first.sequence));
    assert.equal(oracle.snapshot().counters.ready, '1');
    const cancelled = oracle.cancelObservation({ requestId: 'coalesce-2' });
    assert.equal(cancelled.kind, 'delivery-cancelled');
    assert.equal(cancelled.payloadImmutable, true);
    return {
      coalesced: oracle.snapshot().counters.coalesced,
      dropped: oracle.snapshot().counters.dropped,
      lostSequences: second.metadata.lossAccounting.lostSequences,
    };
  }, ['OUTPUT-OBS-008', 'OUTPUT-OBS-009', 'OUTPUT-LIFE-003']);

  defineCase('output-host-read-no-progression', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-evaluator-absent');
    const oracle = initializedOutputOracle(profile);
    const publication = publishTerminal(oracle, profile, { firstStopCause: 'search-complete' });
    const before = stableSourceSemantics(oracle.snapshot());
    acquirePublished(oracle, publication, 'host-read');
    oracle.beginHostTransfer({ ...slotIdentity(publication), transferId: 'host-transfer' });
    oracle.completeHostTransfer({ ...slotIdentity(publication), transferId: 'host-transfer' });
    releasePublished(oracle, publication, 'host-read');
    const after = stableSourceSemantics(oracle.snapshot());
    assert.deepEqual(after, before);
    return { sourceMutationCount: after.sourceMutationCount, hostProgressCount: after.hostProgressCount };
  }, ['OUTPUT-PUB-006', 'OUTPUT-PUB-007', 'OUTPUT-OBS-003', 'OUTPUT-LIFE-005']);
}

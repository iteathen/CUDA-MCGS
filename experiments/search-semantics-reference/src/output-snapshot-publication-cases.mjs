import assert from 'node:assert/strict';

import {
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
  stableSourceSemantics,
  terminalFields,
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
    return { consistency: captured.consistency, versions: captured.versions };
  }, ['OUTPUT-SNAPSHOT-004']);

  defineCase('output-versioned-cut-retry', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-live-session');
    const field = liveFields(profile)[0];
    const oracle = initializedOutputOracle(profile);
    const admission = admitLive(oracle, profile, 'versioned-retry');
    const retry = oracle.captureObservation({
      requestId: 'versioned-retry',
      facts: [fact(field, { state: 'candidate-1' }, { version: '1' })],
      versionsBefore: { [field.id]: '1' },
      versionsAfter: { [field.id]: '2' },
    });
    assert.equal(retry.kind, 'retry');
    assert.equal(retry.code, 'output-capture-inconsistent');
    const captured = oracle.captureObservation({
      requestId: 'versioned-retry',
      facts: [fact(field, { state: 'candidate-2' }, { version: '2' })],
      versionsBefore: { [field.id]: '2' },
      versionsAfter: { [field.id]: '2' },
    });
    assert.equal(captured.kind, 'captured');
    assert.equal(oracle.publishOutput({ slotId: admission.slotId }).kind, 'ready');
    return { retried: true, finalVersion: captured.versions[0].version };
  }, ['OUTPUT-SNAPSHOT-003']);

  defineCase('output-stale-root-publication', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-live-session');
    const oracle = initializedOutputOracle(profile);
    const admission = admitLive(oracle, profile, 'stale-root');
    oracle.captureObservation({ requestId: 'stale-root', facts: factsForFields(liveFields(profile)) });
    oracle.advanceRoot({ rootEpoch: '2', workEpoch: '2' });
    assert.equal(oracle.outputCurrent({ slotId: admission.slotId }), false);
    expectCode(() => oracle.publishOutput({ slotId: admission.slotId }), 'OUTPUT_REFERENCE_STALE_ROOT');
    return { oldPublicationRelabeled: false, currentRoot: oracle.snapshot().context.rootEpoch };
  }, ['OUTPUT-OBS-006', 'OUTPUT-OBS-007', 'OUTPUT-OBS-011', 'OUTPUT-SNAPSHOT-005', 'OUTPUT-LIFE-004']);

  defineCase('output-protected-source-lifetime', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-live-session');
    const field = liveFields(profile)[0];
    const unsafe = initializedOutputOracle(profile);
    admitLive(unsafe, profile, 'unprotected-source');
    expectCode(() => unsafe.captureObservation({
      requestId: 'unprotected-source',
      facts: [fact(field, { source: 'reclaimed' }, { protected: false })],
    }), 'OUTPUT_REFERENCE_SOURCE_PROTECTION');

    const terminal = initializedOutputOracle(profile);
    publishTerminal(terminal, profile);
    terminal.acquireOutput({ slotId: 'terminal-0', borrowId: 'protected-terminal' });
    const pending = terminal.teardown();
    assert.equal(pending.kind, 'pending-borrow-or-transfer');
    terminal.releaseOutput({ slotId: 'terminal-0', borrowId: 'protected-terminal' });
    assert.equal(terminal.teardown().kind, 'terminal-retained');
    return { sourceProtectionRequired: true, teardownWaitedForBorrow: true };
  }, ['OUTPUT-SNAPSHOT-006', 'OUTPUT-TERMINAL-009', 'OUTPUT-LIFE-005']);

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
    return { cycle, truncated, stale };
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
    const oracle = initializedOutputOracle(profile);
    publishTerminal(oracle, profile);
    oracle.acquireOutput({ slotId: 'terminal-0', borrowId: 'borrow-1' });
    oracle.acquireOutput({ slotId: 'terminal-0', borrowId: 'borrow-2' });
    oracle.releaseOutput({ slotId: 'terminal-0', borrowId: 'borrow-1' });
    expectCode(() => oracle.releaseOutput({ slotId: 'terminal-0', borrowId: 'borrow-1' }), 'OUTPUT_REFERENCE_BORROW_RELEASE');
    assert.equal(oracle.classifyOutputReuse({ slotId: 'terminal-0' }).kind, 'protected');
    oracle.beginHostTransfer({ slotId: 'terminal-0', transferId: 'transfer-1' });
    const expired = oracle.expireBorrow({ slotId: 'terminal-0', borrowId: 'borrow-2' });
    assert.equal(expired.stillProtected, true);
    oracle.releaseOutput({ slotId: 'terminal-0', borrowId: 'borrow-2' });
    assert.equal(oracle.classifyOutputReuse({ slotId: 'terminal-0' }).kind, 'protected');
    oracle.completeHostTransfer({ slotId: 'terminal-0', transferId: 'transfer-1' });
    assert.equal(oracle.classifyOutputReuse({ slotId: 'terminal-0' }).kind, 'reusable');
    return { doubleReleaseRejected: true, transferProtectedReuse: true };
  }, ['OUTPUT-PUB-005', 'OUTPUT-PUB-008', 'OUTPUT-PUB-011', 'OUTPUT-TERMINAL-009', 'OUTPUT-LIFE-006', 'OUTPUT-LIFE-007']);

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
    assert.equal(snapshotAfterAdmission.sourceMutationCount, '0');
    oracle.captureObservation({ requestId: 'coalesce-2', facts: liveFields(profile).map((field) => fact(field, { generation: 2 }, { version: '2' })) });
    const second = oracle.publishOutput({ slotId: secondAdmission.slotId });
    assert.equal(second.kind, 'ready');
    const cancelled = oracle.cancelObservation({ requestId: 'coalesce-2' });
    assert.equal(cancelled.kind, 'delivery-cancelled');
    assert.equal(cancelled.payloadImmutable, true);
    return { coalesced: oracle.snapshot().counters.coalesced, dropped: oracle.snapshot().counters.dropped };
  }, ['OUTPUT-OBS-008', 'OUTPUT-OBS-009', 'OUTPUT-LIFE-003']);

  defineCase('output-host-read-no-progression', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-evaluator-absent');
    const oracle = initializedOutputOracle(profile);
    publishTerminal(oracle, profile, { firstStopCause: 'search-complete' });
    const before = stableSourceSemantics(oracle.snapshot());
    oracle.acquireOutput({ slotId: 'terminal-0', borrowId: 'host-read' });
    oracle.beginHostTransfer({ slotId: 'terminal-0', transferId: 'host-transfer' });
    oracle.completeHostTransfer({ slotId: 'terminal-0', transferId: 'host-transfer' });
    oracle.releaseOutput({ slotId: 'terminal-0', borrowId: 'host-read' });
    const after = stableSourceSemantics(oracle.snapshot());
    assert.deepEqual(after, before);
    return { sourceMutationCount: after.sourceMutationCount, hostProgressCount: after.hostProgressCount };
  }, ['OUTPUT-PUB-006', 'OUTPUT-PUB-007', 'OUTPUT-OBS-003', 'OUTPUT-LIFE-005']);
}

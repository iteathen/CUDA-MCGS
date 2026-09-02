import assert from 'node:assert/strict';

import {
  admitLive,
  captureAndPublishLive,
  expectCode,
  fact,
  getOutputProfile,
  initializedOutputOracle,
  liveFields,
  stableSourceSemantics,
} from './output-case-support.mjs';

export function registerOutputObservationCases({ defineCase, projection }) {
  defineCase('output-live-absent-zero-residue', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-evaluator-absent');
    assert.equal(profile.observations.kind, 'absent');
    assert.equal(profile.schemas.filter(({ kind }) => kind === 'live').length, 0);
    assert(!profile.cleanup.kinds.some((kind) => kind.startsWith('observation-') || ['sequence', 'continuation'].includes(kind)));
    const oracle = initializedOutputOracle(profile);
    expectCode(() => oracle.admitObservationRequest({ requestId: 'not-selected', authorized: true }), 'OUTPUT_REFERENCE_LIVE_ABSENT');
    return { liveSchemas: 0, liveCleanupResidue: false };
  }, ['OUTPUT-OBS-001', 'OUTPUT-LIFE-001']);

  defineCase('output-observation-read-only', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-live-session');
    const oracle = initializedOutputOracle(profile);
    const before = stableSourceSemantics(oracle.snapshot());
    const published = captureAndPublishLive(oracle, profile, 'read-only');
    assert.equal(published.kind, 'ready');
    const after = stableSourceSemantics(oracle.snapshot());
    assert.deepEqual(after, before, 'observation lifecycle may not mutate search-semantic state');
    assert.equal(published.envelope, null, 'live observation is not authoritative terminal completion');
    return { sourceMutationCount: after.sourceMutationCount, hostProgressCount: after.hostProgressCount };
  }, ['OUTPUT-OBS-002', 'OUTPUT-OBS-003', 'OUTPUT-OBS-004', 'OUTPUT-OBS-010']);

  defineCase('output-observation-cadence-invariance', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-live-session');
    const once = initializedOutputOracle(profile);
    captureAndPublishLive(once, profile, 'cadence-once');

    const frequent = initializedOutputOracle(profile);
    captureAndPublishLive(frequent, profile, 'cadence-frequent-1');
    captureAndPublishLive(frequent, profile, 'cadence-frequent-2');
    captureAndPublishLive(frequent, profile, 'cadence-frequent-3');

    assert.deepEqual(stableSourceSemantics(frequent.snapshot()), stableSourceSemantics(once.snapshot()));
    assert.notEqual(frequent.snapshot().sequence, once.snapshot().sequence, 'only Output-owned observation accounting should differ');
    return { onceSequence: once.snapshot().sequence, frequentSequence: frequent.snapshot().sequence };
  }, ['OUTPUT-OBS-002', 'OUTPUT-OBS-005']);

  defineCase('output-unavailable-source-no-materialize', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-live-session');
    const fields = liveFields(profile);
    assert.equal(fields.length, 1);
    const oracle = initializedOutputOracle(profile);
    const admission = admitLive(oracle, profile, 'unavailable');
    const captured = oracle.captureObservation({
      requestId: 'unavailable',
      facts: [fact(fields[0], { wouldRequireMaterialization: true }, { state: 'pending' })],
    });
    assert.equal(captured.kind, 'captured');
    assert.deepEqual(captured.omitted, [{ fieldId: fields[0].id, state: 'pending' }]);
    const ready = oracle.publishOutput({ slotId: admission.slotId });
    assert.deepEqual(ready.payload, []);
    assert.equal(oracle.snapshot().sourceMutationCount, '0');
    return { materialized: false, omitted: captured.omitted };
  }, ['OUTPUT-OBS-004']);

}

import assert from 'node:assert/strict';

import {
  admitLive,
  classifyTerminal,
  expectCode,
  factsForFields,
  getOutputProfile,
  initializedOutputOracle,
  liveFields,
  publishTerminal,
  terminalFields,
} from './output-case-support.mjs';

export function registerOutputTerminalCases({ defineCase, projection }) {
  defineCase('output-profile-strict-normalization', () => {
    const profile = structuredClone(getOutputProfile(projection, 'output.synthetic-live-session'));
    const liveSchema = profile.schemas.find(({ kind }) => kind === 'live');
    liveSchema.consistency = 'atomic-cut';
    profile.snapshot.atomicCommit = null;
    expectCode(() => initializedOutputOracle(profile), 'OUTPUT_REFERENCE_PROFILE_CONSISTENCY');
    return { rejectedFalseAtomicCut: true };
  }, ['OUTPUT-SNAPSHOT-002', 'OUTPUT-PUB-009', 'OUTPUT-PUB-010']);

  defineCase('output-envelope-only-terminal', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-evaluator-absent');
    assert.equal(terminalFields(profile).length, 0);
    const oracle = initializedOutputOracle(profile);
    const published = publishTerminal(oracle, profile, { completedWork: '11' });
    assert.equal(published.kind, 'ready');
    assert.deepEqual(published.payload, []);
    assert.equal(published.envelope.completionClass, 'complete');
    assert.equal(published.envelope.completedWork, '11');
    return published;
  }, ['OUTPUT-TERMINAL-001', 'OUTPUT-TERMINAL-002', 'OUTPUT-TERMINAL-010', 'OUTPUT-SNAPSHOT-001']);

  defineCase('output-complete-vs-valid-partial', () => {
    const profile = structuredClone(getOutputProfile(projection, 'output.synthetic-evaluator-workspace'));
    const fields = terminalFields(profile);
    assert(fields.length >= 2);
    fields[0].presence = 'required';
    const facts = factsForFields(fields, { byField: { [fields[0].id]: { state: 'pending' } } });

    const completeOracle = initializedOutputOracle(profile);
    classifyTerminal(completeOracle, { completionClass: 'complete' });
    expectCode(() => completeOracle.captureTerminalPayload({ facts }), 'OUTPUT_REFERENCE_SOURCE_UNAVAILABLE');

    const partialOracle = initializedOutputOracle(profile);
    classifyTerminal(partialOracle, { completionClass: 'valid-partial', firstStopCause: 'budget-exhausted' });
    const captured = partialOracle.captureTerminalPayload({ facts });
    assert(captured.sourceDispositions.some(({ fieldId, state }) => fieldId === fields[0].id && state === 'pending'));
    const published = partialOracle.publishOutput({ slotId: 'terminal-0' });
    assert.equal(published.envelope.completionClass, 'valid-partial');
    assert(!published.payload.some(({ fieldId }) => fieldId === fields[0].id));
    return { completeRejectedUnready: true, partialPayloadFields: published.payload.length };
  }, ['OUTPUT-TERMINAL-004', 'OUTPUT-TERMINAL-005', 'OUTPUT-TERMINAL-006', 'OUTPUT-LIFE-002']);

  defineCase('output-first-stop-cause', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-evaluator-absent');
    const oracle = initializedOutputOracle(profile);
    const first = classifyTerminal(oracle, {
      completionClass: 'valid-partial',
      firstStopCause: 'budget-exhausted',
      laterDispositions: [{ owner: 'resource', code: 'late-drain-pressure' }],
    });
    assert.equal(first.firstStopCause, 'budget-exhausted');
    expectCode(() => classifyTerminal(oracle, { completionClass: 'valid-partial', firstStopCause: 'late-drain-failure' }), 'OUTPUT_REFERENCE_FIRST_CAUSE');
    oracle.captureTerminalPayload({ facts: [] });
    const published = oracle.publishOutput({ slotId: 'terminal-0' });
    assert.equal(published.envelope.firstStopCause, 'budget-exhausted');
    assert.deepEqual(published.envelope.laterDispositions, [{ owner: 'resource', code: 'late-drain-pressure' }]);
    return { immutableFirstCause: published.envelope.firstStopCause };
  }, ['OUTPUT-TERMINAL-003', 'OUTPUT-TERMINAL-007']);

  defineCase('output-no-valid-result-envelope', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-evaluator-workspace');
    const oracle = initializedOutputOracle(profile);
    classifyTerminal(oracle, { completionClass: 'no-valid-result', firstStopCause: 'owner-failure', resourceStatus: { kind: 'conserved-after-failure' } });
    oracle.captureTerminalPayload({ facts: factsForFields(terminalFields(profile)) });
    const published = oracle.publishOutput({ slotId: 'terminal-0' });
    assert.equal(published.envelope.completionClass, 'no-valid-result');
    assert.equal(published.envelope.firstStopCause, 'owner-failure');
    assert.deepEqual(published.payload, []);
    return published;
  }, ['OUTPUT-TERMINAL-004', 'OUTPUT-TERMINAL-005']);

  defineCase('output-terminal-reserve-isolation', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-live-session');
    const observationClass = profile.observations.profiles[0].resources[0];
    assert.notEqual(observationClass, profile.terminalEnvelope.terminalReserve);
    const oracle = initializedOutputOracle(profile, { limits: { maxObservationSlots: '1' } });
    const first = admitLive(oracle, profile, 'reserve-pressure-1');
    oracle.captureObservation({ requestId: 'reserve-pressure-1', facts: factsForFields(liveFields(profile)) });
    oracle.publishOutput({ slotId: first.slotId });
    const second = admitLive(oracle, profile, 'reserve-pressure-2');
    assert.equal(second.kind, 'admitted');
    const terminal = publishTerminal(oracle, profile);
    assert.equal(terminal.kind, 'ready');
    assert.equal(terminal.slotId, 'terminal-0');
    return { terminalReadyUnderObservationPressure: true, coalesced: oracle.snapshot().counters.coalesced };
  }, ['OUTPUT-TERMINAL-001']);

  defineCase('output-no-ranked-action', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-evaluator-absent');
    assert(!profile.fields.some(({ semanticRole }) => semanticRole === 'ranking'));
    const oracle = initializedOutputOracle(profile);
    const published = publishTerminal(oracle, profile);
    assert.equal(published.kind, 'ready');
    assert.deepEqual(published.payload, []);
    return { rankingRequired: false };
  }, ['OUTPUT-TERMINAL-010']);

  defineCase('output-ranked-product-binding', () => {
    const profile = structuredClone(getOutputProfile(projection, 'output.synthetic-evaluator-workspace'));
    const policyField = terminalFields(profile).find(({ semanticRole }) => semanticRole === 'policy-summary');
    assert(policyField);
    policyField.semanticRole = 'ranking';
    policyField.dataType = 'sequence';
    const owner = profile.contributors.find(({ id }) => id === policyField.owner);
    assert.equal(owner.contract.id, 'SPEC-0008');
    const ranking = [
      { id: 'candidate-b', equivalence: 'tie-1', perspective: 'owner-declared' },
      { id: 'candidate-a', equivalence: 'tie-2', perspective: 'owner-declared' },
    ];
    const values = Object.fromEntries(terminalFields(profile).map((field) => [field.id, field.id === policyField.id ? ranking : { field: field.id }]));
    const oracle = initializedOutputOracle(profile);
    const published = publishTerminal(oracle, profile, { facts: factsForFields(terminalFields(profile), { values }) });
    const captured = published.payload.find(({ fieldId }) => fieldId === policyField.id).value;
    assert.deepEqual(captured, ranking, 'Output must preserve owner-provided ranking order/ties/perspective');
    return { ownerContract: owner.contract.id, captured };
  });

  defineCase('output-evaluator-absent', () => {
    const profile = getOutputProfile(projection, 'output.synthetic-evaluator-absent');
    assert(!profile.contributors.some(({ contract }) => contract.id === 'SPEC-0009'));
    assert(!profile.fields.some(({ semanticRole }) => semanticRole === 'evaluation-summary'));
    const published = publishTerminal(initializedOutputOracle(profile), profile);
    assert.equal(published.kind, 'ready');
    return { evaluatorResidue: false, payloadFields: published.payload.length };
  }, ['OUTPUT-TERMINAL-010']);
}

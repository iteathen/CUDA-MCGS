import assert from 'node:assert/strict';

import {
  activeResourceOracle,
  classBySuffix,
  leaseInput,
  leaseRef,
  reserveByPurpose,
  reservedLeaseInput,
} from './resource-case-support.mjs';

export function registerResourcePressureExhaustionCases({ defineCase, projection }) {
  const base = projection.profiles.find(({ id }) => id === 'resource.synthetic-evaluator-absent').normalized;

  defineCase('resource-pressure-owner-separation', () => {
    const oracle = activeResourceOracle(base);
    const working = classBySuffix(base, 'class-output-working');
    const watermark = base.watermarks.find(({ class: classId }) => classId === working.id);
    const input = leaseInput(working, 'pressure-high', { quantity: watermark.highAt });
    oracle.reserveResource(input);
    const before = oracle.snapshot();
    const pressure = oracle.observePressure(working.id);
    const after = oracle.snapshot();
    assert.equal(pressure.state, 'high');
    assert.equal(pressure.owner, working.contributor);
    assert(pressure.responses.length > 0);
    assert(pressure.responses.every(({ owner }) => owner === working.contributor), 'Resource pressure must route response to the semantic owner, not choose it itself');
    assert.deepEqual(after, before, 'pressure observation must not mutate Resource state');
    oracle.releaseResource(leaseRef(input));
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { typedPressureFact: true, ownerSeparated: true, observationNonMutating: true };
  }, ['RESOURCE-PRESSURE-001', 'RESOURCE-PRESSURE-002', 'RESOURCE-PRESSURE-003', 'RESOURCE-PRESSURE-004', 'RESOURCE-PRESSURE-007']);

  defineCase('resource-pressure-recovery-reserve', () => {
    const oracle = activeResourceOracle(base);
    const working = classBySuffix(base, 'class-output-working');
    const watermark = base.watermarks.find(({ class: classId }) => classId === working.id);
    const input = leaseInput(working, 'pressure-critical', { quantity: watermark.criticalAt });
    oracle.reserveResource(input);
    const pressure = oracle.observePressure(working.id);
    assert.equal(pressure.state, 'critical');
    const progressReserve = reserveByPurpose(base, 'progress-cleanup');
    assert(pressure.responses.some(({ reserve }) => reserve === progressReserve.id), 'pressure response must retain its preplanned cleanup reserve');
    const progressInput = reservedLeaseInput(base, progressReserve, 'pressure-recovery', { quantity: progressReserve.minimum });
    assert.equal(oracle.reserveResource(progressInput).kind, 'claimed', 'saturation response reserve must remain independently admissible');
    const recoverable = oracle.recordExhaustion({ cause: 'capacity', classId: working.id, terminal: false, recoverable: true, requested: '1', available: oracle.observeResourceState(working.id).available });
    assert.equal(recoverable.kind, 'pressure');
    assert.equal(recoverable.firstTerminalCause, null);
    oracle.releaseResource(leaseRef(progressInput));
    oracle.releaseResource(leaseRef(input));
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { cleanupReserveUsable: true, recoverabilityTyped: true };
  }, ['RESOURCE-PRESSURE-005', 'RESOURCE-PRESSURE-006']);

  defineCase('resource-exhaustion-diagnostics', () => {
    const oracle = activeResourceOracle(base);
    const working = classBySuffix(base, 'class-output-working');
    const partition = base.partitions.find(({ class: classId }) => classId === working.id);
    assert(partition, 'working Resource class must have its normalized partition');
    const event = oracle.recordExhaustion({
      cause: 'fragmentation-fit', classId: working.id, terminal: false, recoverable: true, requested: '4096', available: '8192', readyFacts: [{ id: 'ready-fact', state: 'ready' }],
    });
    assert.equal(event.code, 'resource-fragmentation');
    assert.equal(event.cause, 'fragmentation-fit');
    assert.equal(event.classId, working.id);
    assert.equal(event.owner, working.contributor);
    assert.equal(event.partitionId, partition.id);
    assert.equal(event.poolId, partition.pool);
    assert.equal(event.requested, '4096');
    assert.equal(event.available, '8192');
    assert.equal(event.readyFacts.length, 1);
    assert.equal(Object.hasOwn(event, 'value'), false, 'Resource exhaustion must not fabricate a semantic value');
    assert.throws(
      () => oracle.recordExhaustion({ cause: 'capacity', classId: 'resource.unknown.class', terminal: false, recoverable: true }),
      { code: 'RESOURCE_REFERENCE_CLASS' },
      'Resource exhaustion cannot publish a class that is not in the immutable normalized plan',
    );
    assert.throws(
      () => oracle.recordExhaustion({ cause: 'capacity', classId: working.id, terminal: false, recoverable: true, requested: '-1' }),
      { code: 'RESOURCE_REFERENCE_DECIMAL' },
      'Resource exhaustion quantities must retain canonical unsigned Resource units',
    );
    const policyBudget = oracle.recordExhaustion({ cause: 'policy-budget', terminal: false, recoverable: true });
    assert.equal(policyBudget.cause, 'policy-budget');
    assert.equal(policyBudget.code, null, 'Resource must not invent a Resource-owned status for Policy-owned budget satisfaction');
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { exactCauseRetained: true, planCoordinatesBound: true, semanticValueAbsent: true, policyBudgetCauseWithoutInventedStatus: true };
  }, ['RESOURCE-EXHAUST-001', 'RESOURCE-EXHAUST-005']);

  defineCase('resource-first-exhaustion-cause', () => {
    const oracle = activeResourceOracle(base);
    const working = classBySuffix(base, 'class-output-working');
    const first = oracle.recordExhaustion({ cause: 'counter-width', classId: working.id, terminal: true, recoverable: false });
    assert.equal(first.firstTerminalCause.cause, 'counter-width');
    const later = oracle.recordExhaustion({ cause: 'provider-failure', classId: working.id, terminal: true, recoverable: false });
    assert.equal(later.firstTerminalCause.cause, 'counter-width', 'later terminal resource facts must not rewrite first cause');
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { immutableFirstTerminalCause: true };
  }, ['RESOURCE-EXHAUST-002']);

  defineCase('resource-counter-vs-capacity-exhaustion', () => {
    const working = classBySuffix(base, 'class-output-working');
    const counterMax = working.range.counterMaximum;
    const counterOracle = activeResourceOracle(base, { counterStarts: { [working.id]: counterMax } });
    const counterFailure = counterOracle.reserveResource(leaseInput(working, 'counter-exhausted'));
    assert.equal(counterFailure.code, 'resource-counter-exhausted');
    assert.equal(counterFailure.cause, 'counter-width');
    assert.equal(counterFailure.available, working.formula.maximumUnits, 'counter exhaustion must be distinguishable while capacity remains');
    assert.equal(counterOracle.cleanup().runtimeResidue, 0);

    const capacityOracle = activeResourceOracle(base);
    const capacityFailure = capacityOracle.reserveResource(leaseInput(working, 'capacity-exhausted', { quantity: (BigInt(working.formula.maximumUnits) + 1n).toString() }));
    assert.equal(capacityFailure.code, 'resource-capacity');
    assert.equal(capacityFailure.cause, 'capacity');
    assert.notEqual(capacityFailure.code, counterFailure.code);
    assert.equal(capacityOracle.cleanup().runtimeResidue, 0);
    return { counterDoesNotWrap: true, capacityCauseDistinct: true };
  }, ['RESOURCE-EXHAUST-005', 'RESOURCE-EXHAUST-006']);

  defineCase('resource-valid-partial-ready-only', () => {
    const oracle = activeResourceOracle(base);
    const accepted = oracle.recordExhaustion({ cause: 'capacity', terminal: false, recoverable: true, readyFacts: [{ id: 'published-result-fact', state: 'ready' }] });
    assert.equal(accepted.readyFacts[0].state, 'ready');
    assert.throws(
      () => oracle.recordExhaustion({ cause: 'capacity', terminal: false, recoverable: true, readyFacts: [{ id: 'claimed-result-fact', state: 'claimed' }] }),
      { code: 'RESOURCE_REFERENCE_READY_FACT' },
    );
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { onlyReadyFactsExposed: true, noResourceOwnedValue: true };
  }, ['RESOURCE-EXHAUST-004']);

  defineCase('resource-terminal-exhaustion-drain', () => {
    const oracle = activeResourceOracle(base);
    const working = classBySuffix(base, 'class-output-working');
    const existing = leaseInput(working, 'existing-before-stop', { quantity: '11' });
    oracle.reserveResource(existing);
    oracle.recordExhaustion({ cause: 'provider-failure', classId: working.id, terminal: true, recoverable: false });
    assert.throws(
      () => oracle.reserveResource(leaseInput(working, 'new-after-stop')),
      { code: 'RESOURCE_REFERENCE_ADMISSION_CLOSED' },
      'terminal resource exhaustion must close new admission without a host decision',
    );
    const terminalReserve = reserveByPurpose(base, 'terminal-result');
    const terminalLease = reservedLeaseInput(base, terminalReserve, 'terminal-after-stop', { quantity: terminalReserve.minimum });
    assert.equal(oracle.reserveResource(terminalLease).kind, 'claimed', 'draining must preserve the predeclared terminal publication reserve');
    oracle.releaseResource(leaseRef(terminalLease));
    oracle.releaseResource(leaseRef(existing));
    oracle.markTerminal();
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { admissionClosedOnTerminalExhaustion: true, existingWorkDispositional: true };
  }, ['RESOURCE-EXHAUST-003']);

  defineCase('resource-no-host-growth', () => {
    const oracle = activeResourceOracle(base);
    assert.equal(base.exhaustion.hostGrowth, 'none');
    assert.throws(() => oracle.requestHostGrowth(), { code: 'RESOURCE_REFERENCE_HOST_GROWTH' });
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { hostGrowthAbsent: true, spillAbsent: true };
  }, ['RESOURCE-EXHAUST-008']);

  defineCase('resource-schedule-invariant-conservation', () => {
    const working = classBySuffix(base, 'class-output-working');
    const a = leaseInput(working, 'schedule-a', { quantity: '23' });
    const b = leaseInput(working, 'schedule-b', { quantity: '29' });

    const left = activeResourceOracle(base);
    left.reserveResource(a); left.reserveResource(b);
    left.publishResourceUse(leaseRef(a)); left.retireResource(leaseRef(a));
    left.publishResourceUse(leaseRef(b)); left.releaseResource(leaseRef(b));
    left.reclaimResourceAccounting({ ...leaseRef(a), ownerQuiescent: true });
    const leftFinal = left.observeResourceState(working.id);

    const right = activeResourceOracle(base);
    right.reserveResource(b); right.publishResourceUse(leaseRef(b));
    right.reserveResource(a); right.publishResourceUse(leaseRef(a));
    right.retireResource(leaseRef(a)); right.reclaimResourceAccounting({ ...leaseRef(a), ownerQuiescent: true });
    right.releaseResource(leaseRef(b));
    const rightFinal = right.observeResourceState(working.id);

    for (const key of ['claimed', 'published', 'retiredUnreclaimed', 'quarantined', 'available']) assert.equal(leftFinal[key], rightFinal[key]);
    assert.equal(left.assertConservation().kind, 'conserved');
    assert.equal(right.assertConservation().kind, 'conserved');
    assert.equal(left.cleanup().runtimeResidue, 0);
    assert.equal(right.cleanup().runtimeResidue, 0);
    return { finalConservationScheduleInvariant: true, diagnosticOrderingMayDiffer: true };
  }, ['RESOURCE-EXHAUST-007', 'RESOURCE-ADMIT-009', 'RESOURCE-ADMIT-010']);
}

import assert from 'node:assert/strict';

import {
  accountingWithoutDiagnostics,
  activeResourceOracle,
  classBySuffix,
  classReserve,
  leaseInput,
  leaseRef,
  liveCount,
  reserveByPurpose,
  reservedLeaseInput,
} from './resource-case-support.mjs';

export function registerResourceAdmissionCases({ defineCase, projection }) {
  const base = projection.profiles.find(({ id }) => id === 'resource.synthetic-evaluator-absent').normalized;

  defineCase('resource-single-admission-atomicity', () => {
    const oracle = activeResourceOracle(base);
    const working = classBySuffix(base, 'class-output-working');
    const workingPartition = base.partitions.find(({ class: classId }) => classId === working.id);
    assert(workingPartition, 'working Resource class must have its normalized partition');
    const before = oracle.observeResourceState(working.id);
    const tooLarge = (BigInt(before.capacity) + 1n).toString();
    const failed = oracle.reserveResource(leaseInput(working, 'too-large', { quantity: tooLarge }));
    assert.equal(failed.kind, 'pressure');
    assert.equal(failed.code, 'resource-capacity');
    assert.equal(failed.classId, working.id);
    assert.equal(failed.owner, working.contributor);
    assert.equal(failed.partitionId, workingPartition.id);
    assert.equal(failed.poolId, workingPartition.pool);
    assert.equal(failed.requested, tooLarge);
    assert.equal(failed.available, before.available);
    const after = oracle.observeResourceState(working.id);
    assert.equal(after.available, before.available, 'failed admission must consume no capacity');
    assert.equal(BigInt(after.failedAdmissions), BigInt(before.failedAdmissions) + 1n);
    assert.throws(
      () => oracle.reserveResource(leaseInput(working, 'wrong-owner', { owner: 'owner.not-the-class-owner' })),
      { code: 'RESOURCE_REFERENCE_OWNER' },
    );
    assert.equal(oracle.reserveResource(leaseInput(working, 'ok', { quantity: '7' })).kind, 'claimed');
    assert.equal(oracle.assertConservation().kind, 'conserved');
    oracle.releaseResource(leaseRef(leaseInput(working, 'ok', { quantity: '7' })));
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { failedAdmissionAtomic: true, exactExhaustionCoordinates: true, wrongOwnerRejected: true, conservationPreserved: true };
  }, ['RESOURCE-ADMIT-001', 'RESOURCE-ADMIT-002', 'RESOURCE-ADMIT-009', 'RESOURCE-ADMIT-010', 'RESOURCE-EXHAUST-001']);

  defineCase('resource-compound-admission-rollback', () => {
    const oracle = activeResourceOracle(base);
    const group = base.admissionGroups.find(({ atomicity }) => atomicity === 'all-or-none-transaction');
    assert(group, 'fixture must expose one all-or-none admission group');
    const reservations = group.globalOrder.map((classId, index) => {
      const resourceClass = base.classes.find(({ id }) => id === classId);
      const reserve = classReserve(base, resourceClass);
      assert(reserve, `compound class ${classId} must be protected by its declared reserve`);
      return reservedLeaseInput(base, reserve, `compound-${index}`, { quantity: reserve.minimum });
    });
    const failing = reservations.map((entry, index) => index === reservations.length - 1
      ? { ...entry, quantity: (BigInt(base.reserves.find(({ id }) => id === entry.reserveId).maximum) + 1n).toString() }
      : entry);
    const before = oracle.snapshot();
    const rolledBack = oracle.reserveCompound({ groupId: group.id, transactionId: 'transaction-fail', reservations: failing });
    assert.equal(rolledBack.kind, 'rolled-back');
    assert.equal(rolledBack.committed, 0);
    const after = oracle.snapshot();
    assert.equal(liveCount(after), liveCount(before), 'failed compound admission must publish no partial lease');
    assert.deepEqual(accountingWithoutDiagnostics(after), accountingWithoutDiagnostics(before), 'failed compound admission must leave live capacity unchanged');

    const committed = oracle.reserveCompound({ groupId: group.id, transactionId: 'transaction-ok', reservations });
    assert.equal(committed.kind, 'committed');
    assert.equal(committed.leases.length, group.classes.length);
    for (const input of reservations) oracle.releaseResource(leaseRef(input));
    assert.equal(oracle.assertConservation().kind, 'conserved');
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { allOrNone: true, declaredGlobalOrder: group.globalOrder };
  }, ['RESOURCE-ADMIT-003', 'RESOURCE-ADMIT-011', 'RESOURCE-ADMIT-009']);

  defineCase('resource-claim-publish-release', () => {
    const oracle = activeResourceOracle(base);
    const working = classBySuffix(base, 'class-output-working');
    const input = leaseInput(working, 'publication', { quantity: '13' });
    oracle.reserveResource(input);
    assert.equal(oracle.observeResourceState(working.id).claimed, '13');
    oracle.publishResourceUse(leaseRef(input));
    assert.equal(oracle.observeResourceState(working.id).published, '13');
    oracle.releaseResource(leaseRef(input));
    const terminal = oracle.observeResourceState(working.id);
    assert.equal(terminal.claimed, '0');
    assert.equal(terminal.published, '0');
    assert.equal(terminal.available, terminal.capacity);
    assert.throws(() => oracle.releaseResource(leaseRef(input)), { code: 'RESOURCE_REFERENCE_RELEASE' }, 'a lease disposes exactly once');
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { claimPublicationSeparated: true, exactlyOneDisposition: true };
  }, ['RESOURCE-ADMIT-005', 'RESOURCE-ADMIT-006', 'RESOURCE-ADMIT-009']);

  defineCase('resource-retired-not-free', () => {
    const oracle = activeResourceOracle(base);
    const working = classBySuffix(base, 'class-output-working');
    const input = leaseInput(working, 'retired', { quantity: '17' });
    oracle.reserveResource(input);
    oracle.publishResourceUse(leaseRef(input));
    oracle.retireResource(leaseRef(input, 'semantic-owner-retired'));
    const retired = oracle.observeResourceState(working.id);
    assert.equal(retired.retiredUnreclaimed, '17');
    assert.equal(BigInt(retired.available), BigInt(retired.capacity) - 17n, 'retired capacity remains unavailable');
    assert.deepEqual(oracle.reclaimResourceAccounting({ ...leaseRef(input), ownerQuiescent: false }), { kind: 'pending', code: 'resource-owner-not-quiescent' });
    assert.equal(oracle.observeResourceState(working.id).retiredUnreclaimed, '17');
    assert.equal(oracle.reclaimResourceAccounting({ ...leaseRef(input), ownerQuiescent: true }).kind, 'reclaimed');
    assert.equal(oracle.observeResourceState(working.id).available, retired.capacity);
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { retiredStillConsumesCapacity: true, ownerQuiescenceRequired: true };
  }, ['RESOURCE-ADMIT-007', 'RESOURCE-ADMIT-009']);

  defineCase('resource-quarantine-visible', () => {
    const oracle = activeResourceOracle(base);
    const working = classBySuffix(base, 'class-output-working');
    const input = leaseInput(working, 'quarantine', { quantity: '19' });
    oracle.reserveResource(input);
    oracle.publishResourceUse(leaseRef(input));
    oracle.quarantineResource({ ...leaseRef(input), reason: 'ledger-inconsistency' });
    const state = oracle.observeResourceState(working.id);
    assert.equal(state.quarantined, '19');
    assert.equal(BigInt(state.available), BigInt(state.capacity) - 19n, 'quarantine must remain visible and unavailable');
    assert.throws(() => oracle.cleanup(), { code: 'RESOURCE_REFERENCE_CLEANUP_QUARANTINE' });
    assert.equal(oracle.cleanup({ quarantineReleaseAuthorized: true }).runtimeResidue, 0);
    return { quarantinedCapacityVisible: true, explicitRecoveryAuthorityRequired: true };
  }, ['RESOURCE-ADMIT-008', 'RESOURCE-ADMIT-009']);

  defineCase('resource-lease-epoch-and-generation-identity', () => {
    const oracle = activeResourceOracle(base);
    const working = classBySuffix(base, 'class-output-working');
    const otherClass = classBySuffix(base, 'class-terminal-envelope');
    const epochs = {
      engine: '18446744073709551616',
      session: '340282366920938463463374607431768211457',
      root: '680564733841876926926749214863536422913',
      work: '1361129467683753853853498429727072845825',
    };
    const first = leaseInput(working, 'epoch', { leaseId: 'lease-reused', generation: '1', epochs });
    oracle.reserveResource(first);
    const observed = oracle.snapshot().leases.find(({ leaseId }) => leaseId === first.leaseId);
    assert.deepEqual(observed.epochs, epochs, 'lease identity must preserve arbitrary-width owner epochs exactly');
    assert.throws(
      () => oracle.releaseResource({ ...leaseRef(first), owner: 'owner.forged' }),
      { code: 'RESOURCE_REFERENCE_LEASE_IDENTITY' },
      'matching lease id/generation cannot forge owner authority',
    );
    assert.throws(
      () => oracle.releaseResource({ ...leaseRef(first), classId: otherClass.id }),
      { code: 'RESOURCE_REFERENCE_LEASE_IDENTITY' },
      'matching lease id/generation cannot relabel the owned Resource class',
    );
    assert.throws(
      () => oracle.releaseResource({ ...leaseRef(first), epochs: { ...epochs, root: (BigInt(epochs.root) + 1n).toString() } }),
      { code: 'RESOURCE_REFERENCE_LEASE_IDENTITY' },
      'matching lease id/generation cannot cross a root/work incarnation boundary',
    );
    assert.equal(oracle.snapshot().leases.find(({ leaseId }) => leaseId === first.leaseId).state, 'claimed', 'forged references must not mutate the authoritative lease');
    oracle.releaseResource(leaseRef(first));
    assert.throws(() => oracle.reserveResource(first), { code: 'RESOURCE_REFERENCE_GENERATION' });
    const second = { ...first, generation: '2' };
    assert.equal(oracle.reserveResource(second).kind, 'claimed');
    oracle.releaseResource(leaseRef(second));
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { staleGenerationRejected: true, epochsPreserved: true, forgedReferenceRejected: true };
  }, ['RESOURCE-ADMIT-004', 'RESOURCE-ADMIT-010', 'RESOURCE-LIFE-002']);

  defineCase('resource-protected-reserves', () => {
    const oracle = activeResourceOracle(base);
    for (const purpose of ['terminal-result', 'progress-cleanup']) {
      const reserve = reserveByPurpose(base, purpose);
      const resourceClass = base.classes.find(({ id }) => id === reserve.class);
      const ordinary = oracle.reserveResource(leaseInput(resourceClass, `ordinary-${purpose}`, { quantity: '1' }));
      assert.equal(ordinary.kind, 'pressure', `${purpose} reserve must be unavailable to ordinary work`);
      const reserved = reservedLeaseInput(base, reserve, `reserved-${purpose}`, { quantity: reserve.minimum });
      assert.equal(oracle.reserveResource(reserved).kind, 'claimed');
      oracle.releaseResource(leaseRef(reserved));
    }
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { terminalReserveProtected: true, progressReserveProtected: true };
  }, ['RESOURCE-PRESSURE-005']);
}

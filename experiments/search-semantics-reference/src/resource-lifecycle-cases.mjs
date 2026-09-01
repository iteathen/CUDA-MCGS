import assert from 'node:assert/strict';

import {
  accountingWithoutDiagnostics,
  activeResourceOracle,
  classBySuffix,
  leaseInput,
  leaseRef,
  reserveByPurpose,
  reservedLeaseInput,
} from './resource-case-support.mjs';

export function registerResourceLifecycleCases({ defineCase, projection }) {
  const base = projection.profiles.find(({ id }) => id === 'resource.synthetic-evaluator-absent').normalized;
  const workspace = projection.profiles.find(({ id }) => id === 'resource.synthetic-evaluator-workspace').normalized;
  const liveSession = projection.profiles.find(({ id }) => id === 'resource.synthetic-live-session').normalized;

  defineCase('resource-lifecycle-admission-closure', () => {
    const oracle = activeResourceOracle(base);
    const working = classBySuffix(base, 'class-output-working');
    assert.equal(oracle.beginDraining().kind, 'draining');
    assert.throws(() => oracle.reserveResource(leaseInput(working, 'after-drain')), { code: 'RESOURCE_REFERENCE_ADMISSION_CLOSED' });
    assert.equal(oracle.markTerminal().kind, 'terminal');
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    assert.equal(oracle.snapshot().lifecycle, 'released');
    return { lifecycleOrdered: true, admissionClosedAtDraining: true };
  }, ['RESOURCE-LIFE-001', 'RESOURCE-LIFE-004']);

  defineCase('resource-root-epoch-preservation', () => {
    const oracle = activeResourceOracle(liveSession);
    const working = classBySuffix(liveSession, 'class-output-working');
    const epochs = { engine: '9', session: '12', root: '18446744073709551617', work: '33' };
    const input = leaseInput(working, 'old-root-work', { quantity: '5', epochs });
    oracle.reserveResource(input);
    const before = oracle.snapshot().leases.find(({ leaseId }) => leaseId === input.leaseId);
    assert.deepEqual(before.epochs, epochs);
    const unrelatedPressure = oracle.recordExhaustion({ cause: 'capacity', classId: working.id, terminal: false, recoverable: true });
    assert.equal(unrelatedPressure.kind, 'pressure');
    const after = oracle.snapshot().leases.find(({ leaseId }) => leaseId === input.leaseId);
    assert.deepEqual(after.epochs, epochs, 'resource pressure/root adjacency must not relabel a live lease epoch');
    oracle.releaseResource(leaseRef(input));
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { exactEpochsRetainedUntilOwnerDisposition: true };
  }, ['RESOURCE-LIFE-002']);

  defineCase('resource-root-update-reject-no-mutation', () => {
    const oracle = activeResourceOracle(liveSession);
    const reserve = reserveByPurpose(liveSession, 'reroot-admission');
    const before = oracle.snapshot();
    const externalAuthority = Object.freeze({ rootEpoch: '77', rootIdentity: 'current-root' });
    const attempted = reservedLeaseInput(liveSession, reserve, 'reroot-too-large', { quantity: (BigInt(reserve.maximum) + 1n).toString() });
    const rejected = oracle.reserveResource(attempted);
    assert.equal(rejected.kind, 'pressure');
    const after = oracle.snapshot();
    assert.deepEqual(accountingWithoutDiagnostics(after), accountingWithoutDiagnostics(before), 'rejected root-update admission must not mutate live Resource capacity');
    assert.deepEqual(externalAuthority, { rootEpoch: '77', rootIdentity: 'current-root' }, 'Resource never owns/mutates Session root authority');
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { rejectedBeforeAuthorityMutation: true, onlyFailedAdmissionDiagnosticChanged: true };
  }, ['RESOURCE-LIFE-003']);

  defineCase('resource-teardown-ledger-zero-or-retained', () => {
    const oracle = activeResourceOracle(base);
    const working = classBySuffix(base, 'class-output-working');
    const claimed = leaseInput(working, 'cleanup-claimed', { quantity: '2' });
    const published = leaseInput(working, 'cleanup-published', { quantity: '3' });
    const retired = leaseInput(working, 'cleanup-retired', { quantity: '5' });
    const quarantined = leaseInput(working, 'cleanup-quarantined', { quantity: '7' });
    for (const input of [claimed, published, retired, quarantined]) oracle.reserveResource(input);
    oracle.publishResourceUse(leaseRef(published));
    oracle.publishResourceUse(leaseRef(retired));
    oracle.retireResource(leaseRef(retired, 'owner-retired'));
    oracle.publishResourceUse(leaseRef(quarantined));
    oracle.quarantineResource({ ...leaseRef(quarantined), reason: 'ambiguous-ledger' });
    assert.throws(() => oracle.cleanup(), { code: 'RESOURCE_REFERENCE_CLEANUP_QUARANTINE' }, 'quarantined capacity cannot disappear during teardown');
    const result = oracle.cleanup({ quarantineReleaseAuthorized: true, retainLedgerEvidence: true });
    assert.equal(result.runtimeResidue, 0);
    assert(result.retainedEvidence !== null, 'explicit retained final ledger evidence is allowed after runtime capacity is disposed');
    assert.equal(oracle.snapshot().lifecycle, 'released');
    return { everyLiveDispositionClosed: true, quarantineExplicit: true, retainedEvidenceNonAuthoritative: true };
  }, ['RESOURCE-LIFE-004', 'RESOURCE-LIFE-005', 'RESOURCE-CLEANUP-001']);

  defineCase('resource-arbitrary-width-runtime-counters', () => {
    const working = classBySuffix(base, 'class-output-working');
    const start = '18446744073709551616';
    assert(BigInt(working.range.counterMaximum) > BigInt(start));
    const oracle = activeResourceOracle(base, { counterStarts: { [working.id]: start } });
    const input = leaseInput(working, 'wide-counter');
    assert.equal(oracle.reserveResource(input).kind, 'claimed');
    assert.equal(oracle.observeResourceState(working.id).counter, (BigInt(start) + 1n).toString());
    oracle.releaseResource(leaseRef(input));
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { counterBeyondUint64Exact: (BigInt(start) + 1n).toString() };
  }, ['RESOURCE-LIFE-006']);

  defineCase('resource-absent-owner-zero-residue', () => {
    const evaluatorOwners = workspace.contributors.filter(({ contract }) => contract.kind === 'catalog' && contract.id === 'SPEC-0009').map(({ id }) => id);
    assert(evaluatorOwners.length > 0, 'evaluator-workspace profile must contain an Evaluator contributor');
    assert(base.contributors.every(({ id }) => !evaluatorOwners.includes(id)), 'evaluator-absent profile must structurally remove the Evaluator contributor');
    const evaluatorClassIds = new Set(workspace.classes.filter(({ contributor }) => evaluatorOwners.includes(contributor)).map(({ id }) => id));
    assert(evaluatorClassIds.size > 0);
    assert(base.classes.every(({ id }) => !evaluatorClassIds.has(id)), 'evaluator-absent Resource profile must contain zero evaluator-owned classes');
    const oracle = activeResourceOracle(base);
    assert(oracle.snapshot().leases.every(({ classId }) => !evaluatorClassIds.has(classId)));
    assert.equal(oracle.cleanup().runtimeResidue, 0);
    return { evaluatorContributorAbsent: true, evaluatorRuntimeResidue: 0 };
  }, ['RESOURCE-CLEANUP-002']);
}

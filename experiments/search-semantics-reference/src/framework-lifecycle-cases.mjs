import assert from 'node:assert/strict';

import { canonicalClone } from './canonical.mjs';
import {
  FRAMEWORK_STATUSES,
  admitFramework,
  assertFrameworkCleanupReadback,
  borrowTerminalResult,
  igniteFramework,
  initializeFramework,
  normalizeFrameworkLifecycleProfile,
  publishFrameworkCompletion,
  recordStopCause,
  releaseTerminalResult,
  requestFrameworkCancellation,
  restoreFrameworkPersistence,
  teardownFramework,
  validateRetainedState,
} from './framework-lifecycle.mjs';

export const DIRECT_FRAMEWORK_REQUIREMENTS = Object.freeze([
  'FRAMEWORK-LIFE-001',
  'FRAMEWORK-LIFE-002',
  'FRAMEWORK-LIFE-003',
  'FRAMEWORK-LIFE-004',
  'FRAMEWORK-LIFE-005',
  'FRAMEWORK-LIFE-006',
  'FRAMEWORK-LIFE-007',
  'FRAMEWORK-LIFE-008',
  'FRAMEWORK-LIFE-009',
  'FRAMEWORK-PERSIST-001',
  'FRAMEWORK-PERSIST-002',
  'FRAMEWORK-CLEANUP-001',
  'FRAMEWORK-CLEANUP-002',
  'FRAMEWORK-CLEANUP-003',
  'FRAMEWORK-CLEANUP-004',
]);

const EXPECTED_CLEANUP_KINDS = Object.freeze([
  'normalized-profile',
  'generated-package',
  'cache-artifact',
  'allocation',
  'operation',
  'work-item',
  'reservation',
  'transaction',
  'borrow',
  'diagnostic',
  'persisted-artifact',
  'coordination-record',
]);

function clone(value) {
  return canonicalClone(value, 'framework lifecycle case value');
}

function runningState(profile) {
  return igniteFramework(initializeFramework(admitFramework(profile)));
}

function stoppedState(profile, cause = 'policy-stop') {
  return recordStopCause(runningState(profile), cause);
}

function completionFacts(profile) {
  return {
    progressClosed: true,
    ownerDispositions: profile.resultVisibleOwners.map((owner) => ({
      owner,
      disposition: owner === 'evaluator' ? 'terminally-absent' : 'ready',
    })),
  };
}

function cancellationFacts() {
  return {
    accountingConserved: true,
    ownerRulesApplied: true,
    partialBackupPublished: false,
    prematureTeardown: false,
    workDispositions: ['abandon', 'must-drain', 'release'],
  };
}

function teardownFacts(profile) {
  return {
    opaqueCudaReleased: true,
    ownerResourcesReleased: true,
    protectionsReleased: true,
    workFinalized: true,
    cleanupDispositions: profile.cleanup.records.map(({ id, plannedDisposition }) => ({ id, disposition: plannedDisposition })),
  };
}

function terminalState(profile) {
  return publishFrameworkCompletion(stoppedState(profile), completionFacts(profile));
}

export function registerFrameworkLifecycleCases({ defineCase, fixture, plannedCoverage }) {
  defineCase('framework-profile-strict-normalization', () => {
    const normalized = normalizeFrameworkLifecycleProfile(fixture.profile);
    assert.equal(normalized.engineIdentity, fixture.profile.engineIdentity);
    assert.equal(normalized.profileIdentity, fixture.profile.profileIdentity);
    assert.equal(normalized.packageIdentity, fixture.profile.packageIdentity);
    assert.deepEqual(normalized.resultVisibleOwners, fixture.profile.resultVisibleOwners);
    const unknown = clone(fixture.profile);
    unknown.scheduler = 'forbidden';
    assert.throws(() => normalizeFrameworkLifecycleProfile(unknown), { code: 'FRAMEWORK_PROFILE_FIELDS' });
    const foreignResultOwner = clone(fixture.profile);
    foreignResultOwner.resultVisibleOwners.push('foreign-owner');
    assert.throws(() => normalizeFrameworkLifecycleProfile(foreignResultOwner), { code: 'FRAMEWORK_RESULT_OWNER_ORDER' });
    const absentPersistenceResidue = clone(fixture.profile);
    absentPersistenceResidue.cleanup.records.push({ id: 'forbidden.persisted', kind: 'persisted-artifact', owner: 'framework', plannedDisposition: 'archive' });
    assert.throws(() => normalizeFrameworkLifecycleProfile(absentPersistenceResidue), { code: 'FRAMEWORK_PERSIST_ABSENCE_RESIDUE' });
    return { ownerCount: normalized.ownerOrder.length, cleanupRecords: normalized.cleanup.records.length };
  });

  defineCase('framework-admission-complete', () => {
    const admitted = admitFramework(fixture.profile);
    assert.equal(admitted.phase, 'plans-admitted');
    assert.equal(admitted.ignitable, false);
    assert.deepEqual(admitted.cleanupManifest, fixture.profile.cleanup.records);
    const incomplete = clone(fixture.profile);
    incomplete.plans.terminalOutputReserveReady = false;
    assert.throws(() => admitFramework(incomplete), { code: 'FRAMEWORK_PLAN_ADMISSION' });
    return { phase: admitted.phase, cleanupRecords: admitted.cleanupManifest.length };
  }, ['FRAMEWORK-LIFE-001']);

  defineCase('framework-initialization-reverse-rollback', () => {
    const admitted = admitFramework(fixture.profile);
    const failed = initializeFramework(admitted, 'resource');
    assert.equal(failed.phase, 'framework-initialization-failed');
    assert.equal(failed.ignitable, false);
    assert.deepEqual(failed.createdOwners, []);
    assert.deepEqual(failed.releasedOwners, ['evaluator', 'policy', 'graph', 'domain']);
    assert.equal(failed.evidencePreserved, true);
    return { releasedOwners: failed.releasedOwners };
  }, ['FRAMEWORK-LIFE-002', 'FRAMEWORK-CLEANUP-002']);

  defineCase('framework-ignition-device-closure', () => {
    const running = runningState(fixture.profile);
    assert.equal(running.phase, 'running');
    const hostDriven = clone(fixture.profile);
    hostDriven.deviceClosure.hostProgress = 'required';
    const initialized = initializeFramework(admitFramework(hostDriven));
    assert.throws(() => igniteFramework(initialized), { code: 'FRAMEWORK_DEVICE_CLOSURE' });
    return { phase: running.phase };
  }, ['FRAMEWORK-LIFE-003']);

  defineCase('framework-first-stop-cause', () => {
    const first = recordStopCause(runningState(fixture.profile), 'policy-stop');
    const later = recordStopCause(first, 'resource-exhaustion');
    assert.equal(later.stopCause, 'policy-stop');
    assert.throws(() => recordStopCause(runningState(fixture.profile), 'implementation-convenience'), { code: 'FRAMEWORK_STOP_CAUSE_KIND' });
    return { stopCause: later.stopCause };
  }, ['FRAMEWORK-LIFE-004']);

  defineCase('framework-completion-gated', () => {
    const stopped = stoppedState(fixture.profile);
    const complete = completionFacts(fixture.profile);
    assert.throws(() => publishFrameworkCompletion(stopped, { ...complete, progressClosed: false }), { code: 'FRAMEWORK_COMPLETION_PENDING' });
    const invalidDisposition = clone(complete);
    invalidDisposition.ownerDispositions[0].disposition = 'pending';
    assert.throws(() => publishFrameworkCompletion(stopped, invalidDisposition), { code: 'FRAMEWORK_COMPLETION_PENDING' });
    const omission = clone(complete);
    omission.ownerDispositions.pop();
    assert.throws(() => publishFrameworkCompletion(stopped, omission), { code: 'FRAMEWORK_COMPLETION_OWNER_COVERAGE' });
    const extra = clone(complete);
    extra.ownerDispositions.push({ owner: 'graph', disposition: 'ready' });
    assert.throws(() => publishFrameworkCompletion(stopped, extra), { code: 'FRAMEWORK_COMPLETION_OWNER_COVERAGE' });
    const duplicate = clone(complete);
    duplicate.ownerDispositions[1].owner = duplicate.ownerDispositions[0].owner;
    assert.throws(() => publishFrameworkCompletion(stopped, duplicate), { code: 'FRAMEWORK_COMPLETION_OWNER_COVERAGE' });
    const terminal = publishFrameworkCompletion(stopped, complete);
    assert.equal(terminal.phase, 'terminal');
    assert.equal(terminal.status, 'framework-terminal');
    return { phase: terminal.phase, resultVisibleOwners: complete.ownerDispositions.length };
  }, ['FRAMEWORK-LIFE-005']);

  defineCase('framework-cancellation-idempotent', () => {
    const facts = cancellationFacts();
    const stopped = recordStopCause(runningState(fixture.profile), 'semantic-failure');
    const once = requestFrameworkCancellation(stopped, facts);
    const twice = requestFrameworkCancellation(once, facts);
    assert.equal(once.cancellationRequested, true);
    assert.equal(twice.cancellationRequested, true);
    assert.equal(twice.stopCause, 'semantic-failure');
    assert.equal(twice.status, 'framework-cancelling');
    assert.deepEqual(twice.cancellationFacts, facts);
    const lostAccounting = { ...facts, accountingConserved: false };
    assert.throws(() => requestFrameworkCancellation(stopped, lostAccounting), { code: 'FRAMEWORK_CANCELLATION_ACCOUNTING' });
    const partialBackup = { ...facts, partialBackupPublished: true };
    assert.throws(() => requestFrameworkCancellation(stopped, partialBackup), { code: 'FRAMEWORK_CANCELLATION_PARTIAL_BACKUP' });
    const premature = { ...facts, prematureTeardown: true };
    assert.throws(() => requestFrameworkCancellation(stopped, premature), { code: 'FRAMEWORK_CANCELLATION_PREMATURE_TEARDOWN' });
    const noRules = { ...facts, ownerRulesApplied: false };
    assert.throws(() => requestFrameworkCancellation(stopped, noRules), { code: 'FRAMEWORK_CANCELLATION_OWNER_RULES' });
    return { stopCause: twice.stopCause, workDispositions: facts.workDispositions };
  }, ['FRAMEWORK-LIFE-004', 'FRAMEWORK-LIFE-006']);

  defineCase('framework-terminal-borrow-defers-teardown', () => {
    const borrowed = borrowTerminalResult(terminalState(fixture.profile));
    const pending = teardownFramework(borrowed);
    assert.equal(pending.phase, 'terminal');
    assert.equal(pending.teardownPending, true);
    assert(pending.createdOwners.length > 0);
    assert.equal(pending.cleanupReadback.length, 0);
    const released = teardownFramework(releaseTerminalResult(pending), teardownFacts(fixture.profile));
    assert.equal(released.phase, 'released');
    assert.equal(released.terminalBorrowCount, 0);
    return { phase: released.phase };
  }, ['FRAMEWORK-LIFE-007']);

  defineCase('framework-teardown-complete', () => {
    const released = teardownFramework(terminalState(fixture.profile), teardownFacts(fixture.profile));
    assert.equal(released.inputsClosed, true);
    assert.equal(released.opaqueOperations, 0);
    assert.deepEqual(released.createdOwners, []);
    assert.deepEqual(released.releasedOwners, [...fixture.profile.ownerOrder].reverse());
    assert.equal(released.teardownFacts.workFinalized, true);
    assert.equal(released.teardownFacts.protectionsReleased, true);
    assert.equal(released.teardownFacts.ownerResourcesReleased, true);
    assert.equal(released.teardownFacts.opaqueCudaReleased, true);
    assertFrameworkCleanupReadback(released);
    return { releasedOwners: released.releasedOwners, cleanupReadback: released.cleanupReadback.length };
  }, ['FRAMEWORK-LIFE-008']);

  defineCase('framework-status-catalog', () => {
    assert.deepEqual(FRAMEWORK_STATUSES, [
      'invalid-framework-profile',
      'framework-owner-conflict',
      'framework-dependency-cycle',
      'framework-profile-incompatible',
      'framework-plan-admission',
      'framework-package-incompatible',
      'framework-initialization-failed',
      'framework-device-closure',
      'framework-cancelling',
      'framework-terminal',
      'framework-internal-failure',
    ]);
    return { statuses: FRAMEWORK_STATUSES.length };
  }, ['FRAMEWORK-LIFE-009']);

  defineCase('framework-cleanup-disposition-complete', () => {
    const normal = normalizeFrameworkLifecycleProfile(fixture.profile);
    const persistent = normalizeFrameworkLifecycleProfile(fixture.persistenceProfile);
    const kinds = [...new Set([...normal.cleanup.records, ...persistent.cleanup.records].map(({ kind }) => kind))].sort();
    assert.deepEqual(kinds, [...EXPECTED_CLEANUP_KINDS].sort());
    assert.equal(normal.cleanup.records.some(({ kind }) => kind === 'persisted-artifact'), false);
    const persisted = persistent.cleanup.records.find(({ kind }) => kind === 'persisted-artifact');
    assert(persisted);
    assert.equal(persisted.owner, persistent.persistence.owner);
    const released = teardownFramework(terminalState(fixture.profile), teardownFacts(fixture.profile));
    assert.deepEqual(released.cleanupReadback, teardownFacts(fixture.profile).cleanupDispositions);
    assert.deepEqual(
      released.dispositions.filter(({ disposition }) => disposition === 'release').map(({ owner }) => owner),
      [...fixture.profile.ownerOrder].reverse(),
    );
    return { normalRecords: normal.cleanup.records.length, persistentRecords: persistent.cleanup.records.length, kinds: kinds.length };
  }, ['FRAMEWORK-CLEANUP-001']);

  defineCase('framework-partial-failure-preserves-evidence', () => {
    const failed = initializeFramework(admitFramework(fixture.profile), 'progress');
    assert.equal(failed.phase, 'framework-initialization-failed');
    assert.equal(failed.evidencePreserved, true);
    assert.deepEqual(failed.createdOwners, []);
    assert.deepEqual(failed.releasedOwners, ['resource', 'evaluator', 'policy', 'graph', 'domain']);
    return { rollbackCount: failed.releasedOwners.length };
  }, ['FRAMEWORK-LIFE-002', 'FRAMEWORK-CLEANUP-002']);

  defineCase('framework-cleanup-readback-required', () => {
    const terminal = terminalState(fixture.profile);
    assert.throws(() => assertFrameworkCleanupReadback(terminal), { code: 'FRAMEWORK_CLEANUP_READBACK' });
    assert.throws(() => teardownFramework(terminal), { code: 'FRAMEWORK_TEARDOWN_FACTS' });
    const incomplete = teardownFacts(fixture.profile);
    incomplete.cleanupDispositions.pop();
    assert.throws(() => teardownFramework(terminal, incomplete), { code: 'FRAMEWORK_CLEANUP_FACTS' });
    const unreleasedProtection = teardownFacts(fixture.profile);
    unreleasedProtection.protectionsReleased = false;
    assert.throws(() => teardownFramework(terminal, unreleasedProtection), { code: 'FRAMEWORK_TEARDOWN_INCOMPLETE' });
    const released = teardownFramework(terminal, teardownFacts(fixture.profile));
    assert.equal(assertFrameworkCleanupReadback(released), true);
    return { phase: released.phase, cleanupReadback: released.cleanupReadback.length };
  }, ['FRAMEWORK-CLEANUP-003']);

  defineCase('framework-retained-state-provenance', () => {
    const record = {
      authority: 'framework-retained-evidence-v1',
      owner: 'framework.reference',
      purpose: 'decisive-falsifier',
      sensitivity: 'non-secret',
      compatibilityKey: fixture.composerEvidence.sha256,
      location: 'artifact://framework-lifecycle/reference',
      reviewTrigger: 'semantic-owner-or-compatibility-change',
    };
    assert.deepEqual(validateRetainedState(record), record);
    const missingTrigger = clone(record);
    missingTrigger.reviewTrigger = '';
    assert.throws(() => validateRetainedState(missingTrigger), { code: 'FRAMEWORK_RETAINED_VALUE' });
    return { owner: record.owner };
  }, ['FRAMEWORK-CLEANUP-004']);

  defineCase('framework-persistence-absent-zero-residue', () => {
    const normalized = normalizeFrameworkLifecycleProfile(fixture.profile);
    assert.deepEqual(normalized.persistence, { kind: 'absent' });
    assert.equal(normalized.cleanup.records.some(({ kind }) => kind === 'persisted-artifact'), false);
    assert.throws(() => restoreFrameworkPersistence(fixture.profile, fixture.validPersistenceSnapshot), { code: 'FRAMEWORK_PERSIST_ABSENT' });
    return { persistence: normalized.persistence.kind };
  }, ['FRAMEWORK-PERSIST-001']);

  defineCase('framework-persistence-selected-bounded', () => {
    const normalized = normalizeFrameworkLifecycleProfile(fixture.persistenceProfile);
    assert.equal(normalized.persistence.kind, 'selected');
    assert.equal(normalized.persistence.authorization, 'owner-and-compatibility-gated');
    assert.equal(normalized.persistence.recovery, 'revalidate-or-quarantine');
    assert.deepEqual(normalized.persistence.forbiddenDurableFields, ['raw-pointer', 'cuda-handle', 'in-flight-work', 'in-flight-transaction', 'active-borrow']);
    assert.equal(normalized.persistence.owner, 'framework.persistence.synthetic');
    assert(normalized.cleanup.records.some(({ kind, owner }) => kind === 'persisted-artifact' && owner === normalized.persistence.owner));
    const noPersistedCleanup = clone(fixture.persistenceProfile);
    noPersistedCleanup.cleanup.records = noPersistedCleanup.cleanup.records.filter(({ kind }) => kind !== 'persisted-artifact');
    assert.throws(() => normalizeFrameworkLifecycleProfile(noPersistedCleanup), { code: 'FRAMEWORK_PERSIST_CLEANUP_GAP' });
    return { persistence: normalized.persistence.kind };
  }, ['FRAMEWORK-PERSIST-001']);

  defineCase('framework-persistence-restore-revalidates', () => {
    const restored = restoreFrameworkPersistence(fixture.persistenceProfile, fixture.validPersistenceSnapshot);
    assert.deepEqual(restored, {
      status: 'validated',
      ignitable: false,
      authoritative: false,
      readyForInitialization: true,
    });
    return restored;
  }, ['FRAMEWORK-PERSIST-002']);

  defineCase('framework-persistence-invalid-restore-quarantines', () => {
    const staleGeneration = clone(fixture.validPersistenceSnapshot);
    staleGeneration.generationValid = false;
    assert.deepEqual(restoreFrameworkPersistence(fixture.persistenceProfile, staleGeneration), { status: 'quarantined', ignitable: false, authoritative: false });
    const staleProfile = clone(fixture.validPersistenceSnapshot);
    staleProfile.profileIdentity = 'profile.stale';
    assert.deepEqual(restoreFrameworkPersistence(fixture.persistenceProfile, staleProfile), { status: 'quarantined', ignitable: false, authoritative: false });
    const stalePackage = clone(fixture.validPersistenceSnapshot);
    stalePackage.packageIdentity = 'package.stale';
    assert.deepEqual(restoreFrameworkPersistence(fixture.persistenceProfile, stalePackage), { status: 'quarantined', ignitable: false, authoritative: false });
    const forbidden = clone(fixture.validPersistenceSnapshot);
    forbidden.durableAuthorityKinds = ['raw-pointer'];
    assert.deepEqual(restoreFrameworkPersistence(fixture.persistenceProfile, forbidden), { status: 'quarantined', ignitable: false, authoritative: false });
    return { invalidRestores: 4 };
  }, ['FRAMEWORK-PERSIST-002']);

  plannedCoverage();
}

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

function clone(value) {
  return canonicalClone(value, 'framework lifecycle case value');
}

function runningState(profile) {
  return igniteFramework(initializeFramework(admitFramework(profile)));
}

function stoppedState(profile, cause = 'policy-stop') {
  return recordStopCause(runningState(profile), cause);
}

function terminalState(profile) {
  return publishFrameworkCompletion(stoppedState(profile), {
    progressClosed: true,
    ownerDispositions: ['ready', 'terminally-absent', 'ready'],
  });
}

export function registerFrameworkLifecycleCases({ defineCase, fixture, plannedCoverage }) {
  defineCase('framework-profile-strict-normalization', () => {
    const normalized = normalizeFrameworkLifecycleProfile(fixture.profile);
    assert.equal(normalized.engineIdentity, fixture.profile.engineIdentity);
    const unknown = clone(fixture.profile);
    unknown.scheduler = 'forbidden';
    assert.throws(() => normalizeFrameworkLifecycleProfile(unknown), { code: 'FRAMEWORK_PROFILE_FIELDS' });
    return { ownerCount: normalized.ownerOrder.length };
  });

  defineCase('framework-admission-complete', () => {
    const admitted = admitFramework(fixture.profile);
    assert.equal(admitted.phase, 'plans-admitted');
    assert.equal(admitted.ignitable, false);
    const incomplete = clone(fixture.profile);
    incomplete.plans.terminalOutputReserveReady = false;
    assert.throws(() => admitFramework(incomplete), { code: 'FRAMEWORK_PLAN_ADMISSION' });
    return { phase: admitted.phase };
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
    return { stopCause: later.stopCause };
  }, ['FRAMEWORK-LIFE-004']);

  defineCase('framework-completion-gated', () => {
    const stopped = stoppedState(fixture.profile);
    assert.throws(() => publishFrameworkCompletion(stopped, {
      progressClosed: false,
      ownerDispositions: ['ready'],
    }), { code: 'FRAMEWORK_COMPLETION_PENDING' });
    assert.throws(() => publishFrameworkCompletion(stopped, {
      progressClosed: true,
      ownerDispositions: ['ready', 'pending'],
    }), { code: 'FRAMEWORK_COMPLETION_PENDING' });
    const terminal = publishFrameworkCompletion(stopped, {
      progressClosed: true,
      ownerDispositions: ['ready', 'terminally-absent', 'quarantined'],
    });
    assert.equal(terminal.phase, 'terminal');
    assert.equal(terminal.status, 'framework-terminal');
    return { phase: terminal.phase };
  }, ['FRAMEWORK-LIFE-005']);

  defineCase('framework-cancellation-idempotent', () => {
    const stopped = recordStopCause(runningState(fixture.profile), 'semantic-failure');
    const once = requestFrameworkCancellation(stopped);
    const twice = requestFrameworkCancellation(once);
    assert.equal(once.cancellationRequested, true);
    assert.equal(twice.cancellationRequested, true);
    assert.equal(twice.stopCause, 'semantic-failure');
    assert.equal(twice.status, 'framework-cancelling');
    return { stopCause: twice.stopCause };
  }, ['FRAMEWORK-LIFE-004', 'FRAMEWORK-LIFE-006']);

  defineCase('framework-terminal-borrow-defers-teardown', () => {
    const borrowed = borrowTerminalResult(terminalState(fixture.profile));
    const pending = teardownFramework(borrowed);
    assert.equal(pending.phase, 'terminal');
    assert.equal(pending.teardownPending, true);
    assert(pending.createdOwners.length > 0);
    const released = teardownFramework(releaseTerminalResult(pending));
    assert.equal(released.phase, 'released');
    assert.equal(released.terminalBorrowCount, 0);
    return { phase: released.phase };
  }, ['FRAMEWORK-LIFE-007']);

  defineCase('framework-teardown-complete', () => {
    const released = teardownFramework(terminalState(fixture.profile));
    assert.equal(released.inputsClosed, true);
    assert.equal(released.opaqueOperations, 0);
    assert.deepEqual(released.createdOwners, []);
    assert.deepEqual(released.releasedOwners, [...fixture.profile.ownerOrder].reverse());
    assertFrameworkCleanupReadback(released);
    return { releasedOwners: released.releasedOwners };
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
    const released = teardownFramework(terminalState(fixture.profile));
    assert.deepEqual(
      released.dispositions.filter(({ disposition }) => disposition === 'release').map(({ owner }) => owner),
      [...fixture.profile.ownerOrder].reverse(),
    );
    assert.equal(released.dispositions.some(({ owner }) => !fixture.profile.ownerOrder.includes(owner)), false);
    return { dispositions: released.dispositions.length };
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
    const released = teardownFramework(terminal);
    assert.equal(assertFrameworkCleanupReadback(released), true);
    return { phase: released.phase };
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
    assert.throws(() => restoreFrameworkPersistence(fixture.profile, fixture.validPersistenceSnapshot), { code: 'FRAMEWORK_PERSIST_ABSENT' });
    return { persistence: normalized.persistence.kind };
  }, ['FRAMEWORK-PERSIST-001']);

  defineCase('framework-persistence-selected-bounded', () => {
    const normalized = normalizeFrameworkLifecycleProfile(fixture.persistenceProfile);
    assert.equal(normalized.persistence.kind, 'selected');
    assert.deepEqual(normalized.persistence.forbiddenDurableFields, ['raw-pointer', 'cuda-handle', 'in-flight-work', 'active-borrow']);
    assert.equal(normalized.persistence.owner, 'framework.persistence.synthetic');
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
    const stale = clone(fixture.validPersistenceSnapshot);
    stale.generationValid = false;
    const restored = restoreFrameworkPersistence(fixture.persistenceProfile, stale);
    assert.deepEqual(restored, { status: 'quarantined', ignitable: false, authoritative: false });
    const forbidden = clone(fixture.validPersistenceSnapshot);
    forbidden.durableAuthorityKinds = ['raw-pointer'];
    assert.deepEqual(restoreFrameworkPersistence(fixture.persistenceProfile, forbidden), { status: 'quarantined', ignitable: false, authoritative: false });
    return { invalidRestores: 2 };
  }, ['FRAMEWORK-PERSIST-002']);

  plannedCoverage();
}

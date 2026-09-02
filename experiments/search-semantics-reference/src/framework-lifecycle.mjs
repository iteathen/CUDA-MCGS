import { canonicalClone } from './canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './errors.mjs';

export const FRAMEWORK_STATUSES = Object.freeze([
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

const TERMINAL_OWNER_DISPOSITIONS = new Set(['ready', 'terminally-absent', 'failed', 'quarantined']);
const STOP_CAUSES = new Set([
  'policy-stop',
  'resource-exhaustion',
  'external-cancellation',
  'session-control',
  'semantic-failure',
  'cuda-js-failure',
]);
const WORK_DISPOSITIONS = new Set(['abandon', 'must-drain', 'release']);
const CLEANUP_KINDS = new Set([
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
const CLEANUP_DISPOSITIONS = new Set(['release', 'retain', 'archive', 'quarantine', 'transfer']);
const REQUIRED_PLAN_FIELDS = Object.freeze([
  'ownersReady',
  'compoundResourcesReady',
  'progressGraphReady',
  'terminalOutputReserveReady',
  'packageCompatible',
  'cleanupReady',
]);
const TEARDOWN_BOOLEAN_FIELDS = Object.freeze([
  'opaqueCudaReleased',
  'ownerResourcesReleased',
  'protectionsReleased',
  'workFinalized',
]);

function clone(value) {
  return canonicalClone(value, 'framework lifecycle value');
}

function assertBoolean(value, code, label) {
  if (typeof value !== 'boolean') fail(code, `${label} must be boolean`);
  return value;
}

function assertNonemptyString(value, code, label) {
  if (typeof value !== 'string' || value.length === 0) fail(code, `${label} must be a nonempty string`);
  return value;
}

function normalizeCleanupRecord(input, index) {
  exactKeys(input, ['id', 'kind', 'owner', 'plannedDisposition'], 'FRAMEWORK_CLEANUP_RECORD_FIELDS', `cleanup record ${index}`);
  const id = assertNonemptyString(input.id, 'FRAMEWORK_CLEANUP_RECORD_ID', `cleanup record ${index} id`);
  const kind = assertNonemptyString(input.kind, 'FRAMEWORK_CLEANUP_RECORD_KIND', `cleanup record ${id} kind`);
  const owner = assertNonemptyString(input.owner, 'FRAMEWORK_CLEANUP_RECORD_OWNER', `cleanup record ${id} owner`);
  const plannedDisposition = assertNonemptyString(input.plannedDisposition, 'FRAMEWORK_CLEANUP_RECORD_DISPOSITION', `cleanup record ${id} planned disposition`);
  if (!CLEANUP_KINDS.has(kind)) fail('FRAMEWORK_CLEANUP_RECORD_KIND', `cleanup record ${id} kind ${kind} is not framework-known`);
  if (!CLEANUP_DISPOSITIONS.has(plannedDisposition)) fail('FRAMEWORK_CLEANUP_RECORD_DISPOSITION', `cleanup record ${id} disposition ${plannedDisposition} is unsupported`);
  return { id, kind, owner, plannedDisposition };
}

function normalizeCleanup(input, persistence) {
  exactKeys(input, ['diagnosticEvidence', 'records', 'releaseOrder'], 'FRAMEWORK_CLEANUP_PROFILE_FIELDS', 'cleanup profile');
  if (input.releaseOrder !== 'reverse-dependency') fail('FRAMEWORK_CLEANUP_ORDER', 'cleanup release order must be reverse-dependency');
  if (input.diagnosticEvidence !== 'preserve-decisive') fail('FRAMEWORK_CLEANUP_EVIDENCE', 'cleanup must preserve decisive evidence');
  if (!Array.isArray(input.records) || input.records.length === 0) fail('FRAMEWORK_CLEANUP_RECORDS', 'cleanup records must be a nonempty finite manifest');
  const records = input.records.map(normalizeCleanupRecord);
  if (new Set(records.map(({ id }) => id)).size !== records.length) fail('FRAMEWORK_CLEANUP_RECORD_DUPLICATE', 'cleanup record ids must be unique');
  const persisted = records.filter(({ kind }) => kind === 'persisted-artifact');
  if (persistence.kind === 'absent' && persisted.length !== 0) fail('FRAMEWORK_PERSIST_ABSENCE_RESIDUE', 'absent persistence cannot leave persisted-artifact cleanup records');
  if (persistence.kind === 'selected') {
    if (persisted.length === 0) fail('FRAMEWORK_PERSIST_CLEANUP_GAP', 'selected persistence requires a persisted-artifact cleanup record');
    if (persisted.some(({ owner }) => owner !== persistence.owner)) fail('FRAMEWORK_PERSIST_CLEANUP_OWNER', 'persisted-artifact cleanup records must remain persistence-owner owned');
  }
  return { diagnosticEvidence: input.diagnosticEvidence, releaseOrder: input.releaseOrder, records };
}

function normalizePersistence(input) {
  if (input?.kind === 'absent') {
    exactKeys(input, ['kind'], 'FRAMEWORK_PERSIST_FIELDS', 'absent persistence');
    return { kind: 'absent' };
  }
  exactKeys(
    input,
    ['authorization', 'cleanup', 'compatibilityIdentity', 'encoding', 'forbiddenDurableFields', 'kind', 'migration', 'owner', 'recovery', 'retention'],
    'FRAMEWORK_PERSIST_FIELDS',
    'selected persistence',
  );
  if (input.kind !== 'selected') fail('FRAMEWORK_PERSIST_KIND', 'persistence kind must be absent or selected');
  const forbiddenDurableFields = assertUniqueStrings(input.forbiddenDurableFields, 'FRAMEWORK_PERSIST_FORBIDDEN', 'forbidden durable fields');
  const requiredForbidden = ['raw-pointer', 'cuda-handle', 'in-flight-work', 'in-flight-transaction', 'active-borrow'];
  if (requiredForbidden.some((entry) => !forbiddenDurableFields.includes(entry))) {
    fail('FRAMEWORK_PERSIST_FORBIDDEN', 'selected persistence must forbid raw pointers, CUDA handles, in-flight work/transactions and active borrows');
  }
  return {
    kind: 'selected',
    owner: assertNonemptyString(input.owner, 'FRAMEWORK_PERSIST_OWNER', 'persistence owner'),
    encoding: assertNonemptyString(input.encoding, 'FRAMEWORK_PERSIST_ENCODING', 'persistence encoding'),
    compatibilityIdentity: assertNonemptyString(input.compatibilityIdentity, 'FRAMEWORK_PERSIST_COMPATIBILITY', 'persistence compatibility identity'),
    migration: assertNonemptyString(input.migration, 'FRAMEWORK_PERSIST_MIGRATION', 'persistence migration'),
    authorization: assertNonemptyString(input.authorization, 'FRAMEWORK_PERSIST_AUTHORIZATION', 'persistence authorization'),
    recovery: assertNonemptyString(input.recovery, 'FRAMEWORK_PERSIST_RECOVERY', 'persistence recovery'),
    retention: assertNonemptyString(input.retention, 'FRAMEWORK_PERSIST_RETENTION', 'persistence retention'),
    cleanup: assertNonemptyString(input.cleanup, 'FRAMEWORK_PERSIST_CLEANUP', 'persistence cleanup'),
    forbiddenDurableFields: [...forbiddenDurableFields],
  };
}

export function normalizeFrameworkLifecycleProfile(input) {
  exactKeys(
    input,
    ['cleanup', 'deviceClosure', 'engineIdentity', 'ownerOrder', 'packageIdentity', 'persistence', 'plans', 'profileIdentity', 'resultVisibleOwners', 'schema'],
    'FRAMEWORK_PROFILE_FIELDS',
    'framework lifecycle profile',
  );
  if (input.schema !== 'cuda-mcgs.framework-lifecycle-profile/0.1.0') fail('FRAMEWORK_PROFILE_SCHEMA', 'framework lifecycle profile schema is unsupported');
  const ownerOrder = assertUniqueStrings(input.ownerOrder, 'FRAMEWORK_OWNER_ORDER', 'ownerOrder');
  if (ownerOrder.length === 0 || ownerOrder.some((owner) => owner.length === 0)) fail('FRAMEWORK_OWNER_ORDER', 'ownerOrder must contain selected semantic owners');
  const resultVisibleOwners = assertUniqueStrings(input.resultVisibleOwners, 'FRAMEWORK_RESULT_OWNER_ORDER', 'resultVisibleOwners');
  if (resultVisibleOwners.length === 0 || resultVisibleOwners.some((owner) => !ownerOrder.includes(owner))) {
    fail('FRAMEWORK_RESULT_OWNER_ORDER', 'resultVisibleOwners must be a nonempty subset of selected owners');
  }
  exactKeys(input.plans, REQUIRED_PLAN_FIELDS, 'FRAMEWORK_PLAN_FIELDS', 'framework plans');
  const plans = Object.fromEntries(REQUIRED_PLAN_FIELDS.map((field) => [field, assertBoolean(input.plans[field], 'FRAMEWORK_PLAN_VALUE', `plans.${field}`)]));
  exactKeys(input.deviceClosure, ['hostProgress', 'resident'], 'FRAMEWORK_DEVICE_FIELDS', 'device closure');
  assertBoolean(input.deviceClosure.resident, 'FRAMEWORK_DEVICE_RESIDENT', 'deviceClosure.resident');
  if (!['none', 'required'].includes(input.deviceClosure.hostProgress)) fail('FRAMEWORK_DEVICE_HOST_PROGRESS', 'deviceClosure.hostProgress must be none or required');
  const persistence = normalizePersistence(input.persistence);
  const cleanup = normalizeCleanup(input.cleanup, persistence);
  return clone({
    schema: input.schema,
    engineIdentity: assertNonemptyString(input.engineIdentity, 'FRAMEWORK_ENGINE_IDENTITY', 'engine identity'),
    profileIdentity: assertNonemptyString(input.profileIdentity, 'FRAMEWORK_PROFILE_IDENTITY', 'profile identity'),
    packageIdentity: assertNonemptyString(input.packageIdentity, 'FRAMEWORK_PACKAGE_IDENTITY', 'package identity'),
    ownerOrder,
    resultVisibleOwners,
    plans,
    deviceClosure: input.deviceClosure,
    persistence,
    cleanup,
  });
}

export function admitFramework(input) {
  const profile = normalizeFrameworkLifecycleProfile(input);
  const incomplete = REQUIRED_PLAN_FIELDS.filter((field) => profile.plans[field] !== true);
  if (incomplete.length !== 0) fail('FRAMEWORK_PLAN_ADMISSION', `framework plans are not fully admitted: ${incomplete.join(', ')}`);
  return {
    profile,
    phase: 'plans-admitted',
    status: 'framework-plan-admission',
    ignitable: false,
    createdOwners: [],
    releasedOwners: [],
    dispositions: [],
    cleanupManifest: clone(profile.cleanup.records),
    cleanupReadback: [],
    evidencePreserved: true,
    stopCause: null,
    cancellationRequested: false,
    cancellationFacts: null,
    terminalBorrowCount: 0,
    teardownPending: false,
    teardownFacts: null,
    inputsClosed: false,
    opaqueOperations: 0,
  };
}

export function initializeFramework(state, failureOwner = null) {
  if (state.phase !== 'plans-admitted') fail('FRAMEWORK_INITIALIZE_PHASE', 'framework must be plans-admitted before initialization');
  const next = clone(state);
  next.createdOwners = [];
  next.releasedOwners = [];
  for (const owner of next.profile.ownerOrder) {
    if (owner === failureOwner) {
      next.releasedOwners = [...next.createdOwners].reverse();
      next.dispositions.push(...next.releasedOwners.map((releasedOwner) => ({ owner: releasedOwner, disposition: 'rollback-release' })));
      next.createdOwners = [];
      next.phase = 'framework-initialization-failed';
      next.status = 'framework-initialization-failed';
      next.ignitable = false;
      next.evidencePreserved = true;
      return next;
    }
    next.createdOwners.push(owner);
  }
  next.phase = 'initialized';
  next.status = 'framework-plan-admission';
  next.ignitable = true;
  next.opaqueOperations = 1;
  return next;
}

export function igniteFramework(state) {
  if (state.phase !== 'initialized' || state.ignitable !== true) fail('FRAMEWORK_IGNITION_PHASE', 'framework must be initialized and ignitable');
  if (state.profile.deviceClosure.resident !== true || state.profile.deviceClosure.hostProgress !== 'none') {
    fail('FRAMEWORK_DEVICE_CLOSURE', 'active search would require host-owned progression or nonresident semantic state');
  }
  const next = clone(state);
  next.phase = 'running';
  next.status = 'framework-plan-admission';
  next.ignitable = false;
  return next;
}

export function recordStopCause(state, cause) {
  assertNonemptyString(cause, 'FRAMEWORK_STOP_CAUSE', 'stop cause');
  if (!STOP_CAUSES.has(cause)) fail('FRAMEWORK_STOP_CAUSE_KIND', `stop cause ${cause} is not an admitted Framework cause`);
  if (!['running', 'stop-requested'].includes(state.phase)) fail('FRAMEWORK_STOP_PHASE', 'stop cause requires running or stop-requested phase');
  const next = clone(state);
  if (next.stopCause === null) next.stopCause = cause;
  next.phase = 'stop-requested';
  return next;
}

export function requestFrameworkCancellation(state, facts) {
  exactKeys(
    facts,
    ['accountingConserved', 'ownerRulesApplied', 'partialBackupPublished', 'prematureTeardown', 'workDispositions'],
    'FRAMEWORK_CANCELLATION_FIELDS',
    'cancellation facts',
  );
  if (facts.accountingConserved !== true) fail('FRAMEWORK_CANCELLATION_ACCOUNTING', 'cancellation must conserve reservation/resource accounting');
  if (facts.ownerRulesApplied !== true) fail('FRAMEWORK_CANCELLATION_OWNER_RULES', 'cancellation must apply owner-declared abandon/must-drain/release rules');
  if (facts.partialBackupPublished !== false) fail('FRAMEWORK_CANCELLATION_PARTIAL_BACKUP', 'cancellation cannot publish partial backup');
  if (facts.prematureTeardown !== false) fail('FRAMEWORK_CANCELLATION_PREMATURE_TEARDOWN', 'cancellation cannot trigger premature teardown');
  const workDispositions = assertUniqueStrings(facts.workDispositions, 'FRAMEWORK_CANCELLATION_WORK', 'cancellation work dispositions');
  if (workDispositions.length === 0 || workDispositions.some((entry) => !WORK_DISPOSITIONS.has(entry))) {
    fail('FRAMEWORK_CANCELLATION_WORK', 'cancellation work dispositions must be owner-declared abandon/must-drain/release outcomes');
  }
  let next = recordStopCause(state, 'external-cancellation');
  next.cancellationRequested = true;
  next.cancellationFacts = clone({ ...facts, workDispositions });
  next.status = 'framework-cancelling';
  return next;
}

export function publishFrameworkCompletion(state, facts) {
  exactKeys(facts, ['ownerDispositions', 'progressClosed'], 'FRAMEWORK_COMPLETION_FIELDS', 'completion facts');
  if (state.phase !== 'stop-requested') fail('FRAMEWORK_COMPLETION_PHASE', 'completion requires stop-requested phase');
  if (facts.progressClosed !== true) fail('FRAMEWORK_COMPLETION_PENDING', 'progress is not closed');
  if (!Array.isArray(facts.ownerDispositions)) fail('FRAMEWORK_COMPLETION_PENDING', 'ownerDispositions must be an array');
  const normalized = facts.ownerDispositions.map((entry, index) => {
    exactKeys(entry, ['disposition', 'owner'], 'FRAMEWORK_COMPLETION_OWNER_FIELDS', `owner disposition ${index}`);
    const owner = assertNonemptyString(entry.owner, 'FRAMEWORK_COMPLETION_OWNER', `owner disposition ${index} owner`);
    const disposition = assertNonemptyString(entry.disposition, 'FRAMEWORK_COMPLETION_OWNER', `owner disposition ${owner}`);
    if (!TERMINAL_OWNER_DISPOSITIONS.has(disposition)) fail('FRAMEWORK_COMPLETION_PENDING', `owner ${owner} is not terminally result-visible`);
    return { owner, disposition };
  });
  if (new Set(normalized.map(({ owner }) => owner)).size !== normalized.length) fail('FRAMEWORK_COMPLETION_OWNER_COVERAGE', 'result-visible owner dispositions must not duplicate owners');
  if (normalized.length !== state.profile.resultVisibleOwners.length
    || state.profile.resultVisibleOwners.some((owner) => !normalized.some((entry) => entry.owner === owner))
    || normalized.some(({ owner }) => !state.profile.resultVisibleOwners.includes(owner))) {
    fail('FRAMEWORK_COMPLETION_OWNER_COVERAGE', 'completion must cover exactly every declared result-visible owner');
  }
  const next = clone(state);
  next.phase = 'terminal';
  next.status = 'framework-terminal';
  return next;
}

export function borrowTerminalResult(state) {
  if (state.phase !== 'terminal') fail('FRAMEWORK_BORROW_PHASE', 'terminal result borrow requires terminal phase');
  const next = clone(state);
  next.terminalBorrowCount += 1;
  return next;
}

export function releaseTerminalResult(state) {
  if (state.terminalBorrowCount <= 0) fail('FRAMEWORK_BORROW_UNDERFLOW', 'terminal result borrow is not live');
  const next = clone(state);
  next.terminalBorrowCount -= 1;
  return next;
}

function normalizeTeardownFacts(facts, manifest) {
  exactKeys(
    facts,
    ['cleanupDispositions', ...TEARDOWN_BOOLEAN_FIELDS],
    'FRAMEWORK_TEARDOWN_FIELDS',
    'teardown facts',
  );
  for (const field of TEARDOWN_BOOLEAN_FIELDS) {
    if (facts[field] !== true) fail('FRAMEWORK_TEARDOWN_INCOMPLETE', `${field} must be true before teardown completion`);
  }
  if (!Array.isArray(facts.cleanupDispositions)) fail('FRAMEWORK_CLEANUP_FACTS', 'cleanupDispositions must be an array');
  const cleanupDispositions = facts.cleanupDispositions.map((entry, index) => {
    exactKeys(entry, ['disposition', 'id'], 'FRAMEWORK_CLEANUP_FACT_FIELDS', `cleanup disposition ${index}`);
    const id = assertNonemptyString(entry.id, 'FRAMEWORK_CLEANUP_FACT_ID', `cleanup disposition ${index} id`);
    const disposition = assertNonemptyString(entry.disposition, 'FRAMEWORK_CLEANUP_FACT_DISPOSITION', `cleanup disposition ${id}`);
    if (!CLEANUP_DISPOSITIONS.has(disposition)) fail('FRAMEWORK_CLEANUP_FACT_DISPOSITION', `cleanup disposition ${id} is unsupported`);
    return { id, disposition };
  });
  if (new Set(cleanupDispositions.map(({ id }) => id)).size !== cleanupDispositions.length) fail('FRAMEWORK_CLEANUP_FACT_DUPLICATE', 'cleanup dispositions must not duplicate ids');
  if (cleanupDispositions.length !== manifest.length) fail('FRAMEWORK_CLEANUP_FACTS', 'cleanup readback must cover every task-created cleanup record exactly once');
  for (const record of manifest) {
    const actual = cleanupDispositions.find(({ id }) => id === record.id);
    if (!actual || actual.disposition !== record.plannedDisposition) fail('FRAMEWORK_CLEANUP_FACTS', `cleanup readback for ${record.id} does not match its owner-declared disposition`);
  }
  if (cleanupDispositions.some(({ id }) => !manifest.some((record) => record.id === id))) fail('FRAMEWORK_CLEANUP_FACTS', 'cleanup readback contains an undeclared task-created record');
  return clone({ ...facts, cleanupDispositions });
}

export function teardownFramework(state, facts = null) {
  if (state.phase !== 'terminal') fail('FRAMEWORK_TEARDOWN_PHASE', 'teardown requires terminal phase');
  const next = clone(state);
  if (next.terminalBorrowCount > 0) {
    next.teardownPending = true;
    return next;
  }
  if (facts === null) fail('FRAMEWORK_TEARDOWN_FACTS', 'teardown completion requires public cleanup/readback facts');
  const normalizedFacts = normalizeTeardownFacts(facts, next.cleanupManifest);
  next.inputsClosed = true;
  next.releasedOwners = [...next.createdOwners].reverse();
  next.dispositions.push(...next.releasedOwners.map((owner) => ({ owner, disposition: 'release' })));
  next.createdOwners = [];
  next.opaqueOperations = 0;
  next.cleanupReadback = clone(normalizedFacts.cleanupDispositions);
  next.teardownFacts = normalizedFacts;
  next.teardownPending = false;
  next.phase = 'released';
  return next;
}

export function assertFrameworkCleanupReadback(state) {
  const teardownComplete = state.teardownFacts !== null
    && TEARDOWN_BOOLEAN_FIELDS.every((field) => state.teardownFacts[field] === true)
    && state.cleanupReadback.length === state.cleanupManifest.length;
  if (state.phase !== 'released'
    || state.createdOwners.length !== 0
    || state.terminalBorrowCount !== 0
    || state.opaqueOperations !== 0
    || state.inputsClosed !== true
    || !teardownComplete) {
    fail('FRAMEWORK_CLEANUP_READBACK', 'framework cleanup readback still contains live or undispositioned task-created state');
  }
  for (const record of state.cleanupManifest) {
    const actual = state.cleanupReadback.find(({ id }) => id === record.id);
    if (!actual || actual.disposition !== record.plannedDisposition) fail('FRAMEWORK_CLEANUP_READBACK', `cleanup record ${record.id} is not read back at its owner-declared final disposition`);
  }
  return true;
}

export function validateRetainedState(record) {
  exactKeys(record, ['authority', 'compatibilityKey', 'location', 'owner', 'purpose', 'reviewTrigger', 'sensitivity'], 'FRAMEWORK_RETAINED_FIELDS', 'retained state record');
  for (const field of ['authority', 'compatibilityKey', 'location', 'owner', 'purpose', 'reviewTrigger', 'sensitivity']) {
    assertNonemptyString(record[field], 'FRAMEWORK_RETAINED_VALUE', `retained state ${field}`);
  }
  return clone(record);
}

export function restoreFrameworkPersistence(profileInput, snapshot) {
  const profile = normalizeFrameworkLifecycleProfile(profileInput);
  if (profile.persistence.kind !== 'selected') fail('FRAMEWORK_PERSIST_ABSENT', 'persistence is not selected');
  exactKeys(
    snapshot,
    ['compatibilityIdentity', 'durableAuthorityKinds', 'engineIdentity', 'generationValid', 'packageIdentity', 'profileIdentity', 'resourcePlanValid', 'staleReferenceProtection'],
    'FRAMEWORK_RESTORE_FIELDS',
    'persistence snapshot',
  );
  const durableAuthorityKinds = assertUniqueStrings(snapshot.durableAuthorityKinds, 'FRAMEWORK_RESTORE_AUTHORITY', 'durable authority kinds');
  const forbidden = new Set(profile.persistence.forbiddenDurableFields);
  const invalid = snapshot.engineIdentity !== profile.engineIdentity
    || snapshot.profileIdentity !== profile.profileIdentity
    || snapshot.packageIdentity !== profile.packageIdentity
    || snapshot.compatibilityIdentity !== profile.persistence.compatibilityIdentity
    || snapshot.resourcePlanValid !== true
    || snapshot.generationValid !== true
    || snapshot.staleReferenceProtection !== true
    || durableAuthorityKinds.some((entry) => forbidden.has(entry));
  if (invalid) return { status: 'quarantined', ignitable: false, authoritative: false };
  return { status: 'validated', ignitable: false, authoritative: false, readyForInitialization: true };
}

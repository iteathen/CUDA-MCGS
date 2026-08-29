import { canonicalClone, canonicalIdentity, frozenCanonicalClone } from './canonical.mjs';
import { exactKeys, fail } from './errors.mjs';

function freeze(value, label) {
  return frozenCanonicalClone(value, label);
}

function decimal(value, code, label) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) fail(code, `${label} must be a canonical decimal string`);
  return BigInt(value);
}

function toDecimal(value) {
  return BigInt(value).toString();
}

function requireString(value, code, label) {
  if (typeof value !== 'string' || value.length === 0) fail(code, `${label} is required`);
  return value;
}

export function createPolicyOracle({
  profile,
  transformContribution = ({ contribution }) => contribution,
  applyRecordUpdate = ({ previous, contribution }) => ({ previous, contribution }),
  admission = {},
  mutations = {},
} = {}) {
  if (profile === null || typeof profile !== 'object') fail('POLICY_REFERENCE_PROFILE', 'normalized Policy profile is required');
  if (!Array.isArray(profile.records) || !Array.isArray(profile.reuse) || profile.stop === null || typeof profile.stop !== 'object') {
    fail('POLICY_REFERENCE_PROFILE', 'normalized Policy profile is incomplete');
  }
  if (typeof transformContribution !== 'function' || typeof applyRecordUpdate !== 'function') {
    fail('POLICY_REFERENCE_PORT', 'transformContribution and applyRecordUpdate must be functions');
  }

  const recordsById = new Map(profile.records.map((record) => [record.id, record]));
  if (recordsById.size !== profile.records.length) fail('POLICY_REFERENCE_PROFILE', 'Policy records contain duplicate ids');
  const reuseByRecord = new Map(profile.reuse.map((entry) => [entry.record, entry]));
  for (const record of profile.records) {
    if (!reuseByRecord.has(record.id)) fail('POLICY_REFERENCE_PROFILE', `${record.id} lacks a reuse disposition`);
  }

  const reservationSelected = profile.reservation?.kind === 'bounded';
  const backupSelected = profile.backup?.kind === 'transactional';
  const profileMaxReservations = reservationSelected ? decimal(profile.reservation.maxActive, 'POLICY_REFERENCE_PROFILE', 'reservation maxActive') : 0n;
  const profileMaxBackupSteps = backupSelected ? decimal(profile.backup.maxSteps, 'POLICY_REFERENCE_PROFILE', 'backup maxSteps') : 0n;
  const maxReservations = reservationSelected && admission.maxReservations !== undefined
    ? decimal(admission.maxReservations, 'POLICY_REFERENCE_ADMISSION', 'maxReservations')
    : profileMaxReservations;
  const maxBackupSteps = backupSelected && admission.maxBackupSteps !== undefined
    ? decimal(admission.maxBackupSteps, 'POLICY_REFERENCE_ADMISSION', 'maxBackupSteps')
    : profileMaxBackupSteps;
  if (maxReservations > profileMaxReservations || maxBackupSteps > profileMaxBackupSteps) fail('POLICY_REFERENCE_ADMISSION', 'test admission exceeds normalized Policy bounds');
  const maxOvershoot = decimal(profile.stop.maxOvershoot, 'POLICY_REFERENCE_PROFILE', 'stop maxOvershoot');

  const works = new Map();
  const reservations = new Map();
  const transactions = new Map();
  const recordValues = new Map();
  const recordGenerations = new Map();
  const events = [];
  const stop = { phase: 'running', firstCause: null, causes: [], overshoot: 0n };
  const accounting = {
    admitted: 0n,
    activeOrPending: 0n,
    backupInProgress: 0n,
    completed: 0n,
    failedOrAbandoned: 0n,
    acquiredReservations: 0n,
    releasedOrConvertedReservations: 0n,
  };
  let sequence = 0n;
  let currentRootEpoch = 0n;
  let quarantine = null;
  let reuseClassifications = 0n;

  const emit = (type, detail = null) => {
    events.push(freeze({ sequence: toDecimal(sequence++), type, detail }, 'Policy reference event'));
  };

  const quarantineEvidence = (code, detail = null) => {
    if (quarantine === null) {
      quarantine = freeze({ code, detail, evidenceValid: false }, 'Policy evidence quarantine');
      emit('policy-quarantined', quarantine);
    }
    return quarantine;
  };

  const requireAvailable = () => {
    if (quarantine !== null) fail('POLICY_REFERENCE_QUARANTINED', `Policy evidence is quarantined: ${quarantine.code}`);
  };

  const findWork = (workId) => {
    const work = works.get(workId);
    if (!work) fail('POLICY_REFERENCE_WORK', `unknown work ${workId}`);
    return work;
  };

  const findReservation = (reservationId) => {
    const reservation = reservations.get(reservationId);
    if (!reservation) fail('POLICY_REFERENCE_RESERVATION', `unknown reservation ${reservationId}`);
    return reservation;
  };

  const findTransaction = (transactionId) => {
    const transaction = transactions.get(transactionId);
    if (!transaction) fail('POLICY_REFERENCE_BACKUP', `unknown backup transaction ${transactionId}`);
    return transaction;
  };

  function accountingSnapshot() {
    return {
      admitted: toDecimal(accounting.admitted),
      activeOrPending: toDecimal(accounting.activeOrPending),
      backupInProgress: toDecimal(accounting.backupInProgress),
      completed: toDecimal(accounting.completed),
      failedOrAbandoned: toDecimal(accounting.failedOrAbandoned),
      acquiredReservations: toDecimal(accounting.acquiredReservations),
      releasedOrConvertedReservations: toDecimal(accounting.releasedOrConvertedReservations),
      outstandingReservations: toDecimal(accounting.acquiredReservations - accounting.releasedOrConvertedReservations),
    };
  }

  function assertAccounting() {
    const classified = accounting.activeOrPending + accounting.backupInProgress + accounting.completed + accounting.failedOrAbandoned;
    if (accounting.admitted !== classified) {
      quarantineEvidence('accounting-mismatch', { admitted: toDecimal(accounting.admitted), classified: toDecimal(classified) });
      fail('POLICY_REFERENCE_ACCOUNTING', 'admitted work is not conserved');
    }
    const outstanding = [...reservations.values()].filter(({ state }) => state === 'acquired').length;
    const ledgerOutstanding = accounting.acquiredReservations - accounting.releasedOrConvertedReservations;
    if (ledgerOutstanding !== BigInt(outstanding)) {
      quarantineEvidence('reservation-accounting-mismatch', { ledger: toDecimal(ledgerOutstanding), actual: String(outstanding) });
      fail('POLICY_REFERENCE_ACCOUNTING', 'reservation accounting is not conserved');
    }
    return accountingSnapshot();
  }

  function initializeRecord(input) {
    requireAvailable();
    exactKeys(input, ['recordId', 'storageKey', 'generation', 'value'], 'POLICY_REFERENCE_RECORD_FIELDS', 'initializeRecord input');
    const record = recordsById.get(input.recordId);
    if (!record) fail('POLICY_REFERENCE_RECORD', `unknown record ${input.recordId}`);
    const storageKey = requireString(input.storageKey, 'POLICY_REFERENCE_RECORD', 'storageKey');
    const key = `${input.recordId}\0${storageKey}`;
    if (recordValues.has(key)) fail('POLICY_REFERENCE_RECORD', `record ${key} is already initialized`);
    const generation = decimal(input.generation, 'POLICY_REFERENCE_RECORD', 'record generation');
    recordValues.set(key, freeze(input.value, 'Policy record value'));
    recordGenerations.set(key, generation);
    emit('record-initialized', { recordId: input.recordId, storageKey, generation: input.generation, scope: record.scope });
    return { key, scope: record.scope, resultVisible: record.resultVisible };
  }

  function readRecord(input) {
    exactKeys(input, ['recordId', 'storageKey'], 'POLICY_REFERENCE_RECORD_FIELDS', 'readRecord input');
    const key = `${input.recordId}\0${input.storageKey}`;
    if (!recordValues.has(key)) fail('POLICY_REFERENCE_RECORD', `record ${key} is not initialized`);
    return canonicalClone(recordValues.get(key));
  }

  function admitWork(input) {
    requireAvailable();
    exactKeys(input, ['workId', 'rootEpoch'], 'POLICY_REFERENCE_ADMIT_FIELDS', 'admitWork input');
    if (stop.phase !== 'running') return { kind: 'stop-requested', cause: stop.firstCause };
    const workId = requireString(input.workId, 'POLICY_REFERENCE_WORK', 'workId');
    if (works.has(workId)) fail('POLICY_REFERENCE_WORK', `duplicate work ${workId}`);
    const epoch = decimal(input.rootEpoch, 'POLICY_REFERENCE_WORK', 'rootEpoch');
    works.set(workId, { id: workId, rootEpoch: epoch, state: 'active', reservationId: null, transactionId: null });
    accounting.admitted += 1n;
    accounting.activeOrPending += 1n;
    emit('work-admitted', { workId, rootEpoch: input.rootEpoch });
    assertAccounting();
    return { kind: 'admitted', workId };
  }

  function reserveInFlight(input) {
    requireAvailable();
    if (!reservationSelected) fail('POLICY_REFERENCE_RESERVATION', 'profile selects no reservation');
    exactKeys(input, ['reservationId', 'workId', 'scope', 'magnitude', 'generation'], 'POLICY_REFERENCE_RESERVATION_FIELDS', 'reserveInFlight input');
    const work = findWork(input.workId);
    if (work.state !== 'active') fail('POLICY_REFERENCE_RESERVATION', `${work.id} is not active`);
    if (work.reservationId !== null) fail('POLICY_REFERENCE_RESERVATION', `${work.id} already has a reservation`);
    const id = requireString(input.reservationId, 'POLICY_REFERENCE_RESERVATION', 'reservationId');
    if (reservations.has(id)) fail('POLICY_REFERENCE_RESERVATION', `duplicate reservation ${id}`);
    const activeReservations = [...reservations.values()].filter(({ state }) => state === 'acquired').length;
    if (BigInt(activeReservations) >= maxReservations) return { kind: 'pressure', code: 'reservation-capacity' };
    reservations.set(id, {
      id,
      workId: work.id,
      scope: freeze(input.scope, 'Policy reservation scope'),
      magnitude: freeze(input.magnitude, 'Policy reservation magnitude'),
      generation: decimal(input.generation, 'POLICY_REFERENCE_RESERVATION', 'reservation generation'),
      state: 'acquired',
      disposition: null,
    });
    work.reservationId = id;
    accounting.acquiredReservations += 1n;
    if (mutations.countReservationAsCompleted === true) {
      accounting.activeOrPending -= 1n;
      accounting.completed += 1n;
    }
    emit('reservation-acquired', { reservationId: id, workId: work.id, generation: input.generation });
    assertAccounting();
    return { kind: 'acquired', reservationId: id };
  }

  function dispositionReservation(reservation, disposition) {
    if (reservation.state !== 'acquired') fail('POLICY_REFERENCE_RESERVATION_IMBALANCE', `${reservation.id} is already dispositioned`);
    reservation.state = disposition;
    reservation.disposition = disposition;
    accounting.releasedOrConvertedReservations += 1n;
    emit(`reservation-${disposition}`, { reservationId: reservation.id, workId: reservation.workId });
  }

  function releaseInFlight(input) {
    requireAvailable();
    exactKeys(input, ['reservationId', 'reason'], 'POLICY_REFERENCE_RESERVATION_RELEASE_FIELDS', 'releaseInFlight input');
    const reservation = findReservation(input.reservationId);
    dispositionReservation(reservation, 'released');
    emit('reservation-release-reason', { reservationId: reservation.id, reason: input.reason });
    assertAccounting();
    return { kind: 'released', reservationId: reservation.id };
  }

  function abandonWork(input) {
    requireAvailable();
    exactKeys(input, ['workId', 'reason'], 'POLICY_REFERENCE_ABANDON_FIELDS', 'abandonWork input');
    const work = findWork(input.workId);
    if (work.state === 'backup') {
      const transaction = findTransaction(work.transactionId);
      if (transaction.mustDrain) return { kind: 'must-drain', transactionId: transaction.id };
      failBackup({ transactionId: transaction.id, code: input.reason });
      return { kind: 'failed-backup', transactionId: transaction.id };
    }
    if (work.state !== 'active') fail('POLICY_REFERENCE_WORK', `${work.id} cannot be abandoned from ${work.state}`);
    if (work.reservationId !== null) {
      const reservation = findReservation(work.reservationId);
      if (reservation.state === 'acquired') dispositionReservation(reservation, 'released');
    }
    work.state = 'failed';
    accounting.activeOrPending -= 1n;
    accounting.failedOrAbandoned += 1n;
    emit('work-abandoned', { workId: work.id, reason: input.reason });
    assertAccounting();
    return { kind: 'abandoned', workId: work.id };
  }

  function classifyPathResponse(input) {
    requireAvailable();
    exactKeys(input, ['identityReady', 'domainRelationReady', 'partitionId', 'pressure'], 'POLICY_REFERENCE_CYCLE_FIELDS', 'classifyPathResponse input');
    if (profile.cycle?.kind !== 'bounded') fail('POLICY_REFERENCE_CYCLE', 'profile selects no cycle response');
    if (input.identityReady !== true) fail('POLICY_REFERENCE_CYCLE_ORDER', 'successor identity must be ready before path relation handling');
    if (input.pressure !== null) return { kind: 'pressure', code: input.pressure };
    if (input.domainRelationReady !== true) return { kind: 'pending', code: 'required-input-unavailable' };
    const partition = profile.cycle.partitions.find(({ id }) => id === input.partitionId);
    if (!partition) fail('POLICY_REFERENCE_CYCLE', `unsupported relation partition ${input.partitionId}`);
    emit('cycle-classified', { partitionId: partition.id, response: partition.response });
    return { kind: 'semantic-response', response: partition.response, contribution: canonicalClone(partition.contribution) };
  }

  function prepareBackup(input) {
    requireAvailable();
    if (!backupSelected) fail('POLICY_REFERENCE_BACKUP', 'profile selects no backup');
    exactKeys(input, ['transactionId', 'workId', 'rootEpoch', 'sourceIdentity', 'contribution', 'occurrences', 'rootIndependent'], 'POLICY_REFERENCE_BACKUP_FIELDS', 'prepareBackup input');
    const work = findWork(input.workId);
    if (work.state !== 'active') fail('POLICY_REFERENCE_BACKUP', `${work.id} is not active`);
    const capturedEpoch = decimal(input.rootEpoch, 'POLICY_REFERENCE_BACKUP', 'rootEpoch');
    if (!input.rootIndependent && (work.rootEpoch !== capturedEpoch || currentRootEpoch !== capturedEpoch)) {
      fail('POLICY_REFERENCE_BACKUP_STALE', 'backup root epoch does not match admitted work/current root');
    }
    const id = requireString(input.transactionId, 'POLICY_REFERENCE_BACKUP', 'transactionId');
    if (transactions.has(id)) fail('POLICY_REFERENCE_DUPLICATE_BACKUP', `duplicate backup ${id}`);
    if (!Array.isArray(input.occurrences) || input.occurrences.length === 0 || BigInt(input.occurrences.length) > maxBackupSteps) {
      fail('POLICY_REFERENCE_BACKUP', 'backup occurrences must be nonempty and within maxSteps');
    }
    const occurrenceIds = new Set();
    const occurrences = input.occurrences.map((occurrence, index) => {
      exactKeys(occurrence, ['occurrenceId', 'nodeReference', 'recordId', 'storageKey', 'targetGeneration'], 'POLICY_REFERENCE_BACKUP_OCCURRENCE_FIELDS', `occurrence ${index}`);
      const occurrenceId = requireString(occurrence.occurrenceId, 'POLICY_REFERENCE_BACKUP', `occurrence ${index} id`);
      if (occurrenceIds.has(occurrenceId)) fail('POLICY_REFERENCE_DUPLICATE_BACKUP', `duplicate occurrence ${occurrenceId}`);
      occurrenceIds.add(occurrenceId);
      const record = recordsById.get(occurrence.recordId);
      if (!record) fail('POLICY_REFERENCE_BACKUP', `unknown target record ${occurrence.recordId}`);
      const storageKey = requireString(occurrence.storageKey, 'POLICY_REFERENCE_BACKUP', 'storageKey');
      const recordKey = `${occurrence.recordId}\0${storageKey}`;
      if (!recordValues.has(recordKey)) fail('POLICY_REFERENCE_BACKUP', `target ${recordKey} is not initialized`);
      const targetGeneration = decimal(occurrence.targetGeneration, 'POLICY_REFERENCE_BACKUP', 'target generation');
      if (recordGenerations.get(recordKey) !== targetGeneration) fail('POLICY_REFERENCE_BACKUP_STALE', `target ${recordKey} generation is stale`);
      return freeze({
        occurrenceId,
        nodeReference: occurrence.nodeReference,
        recordId: occurrence.recordId,
        storageKey,
        targetGeneration: occurrence.targetGeneration,
        recordKey,
        resultVisible: record.resultVisible,
      }, 'Policy backup occurrence');
    });
    transactions.set(id, {
      id,
      workId: work.id,
      rootEpoch: capturedEpoch,
      sourceIdentity: freeze(input.sourceIdentity, 'Policy backup source identity'),
      contribution: freeze(input.contribution, 'Policy backup contribution'),
      occurrences,
      applied: new Set(),
      shadowValues: new Map(),
      mustDrain: false,
      state: 'prepared',
      rootIndependent: input.rootIndependent === true,
      failure: null,
    });
    work.state = 'backup';
    work.transactionId = id;
    accounting.activeOrPending -= 1n;
    accounting.backupInProgress += 1n;
    emit('backup-prepared', { transactionId: id, workId: work.id, occurrenceCount: String(occurrences.length), rootEpoch: input.rootEpoch });
    assertAccounting();
    return { kind: 'prepared', transactionId: id };
  }

  function applyBackupStep(input) {
    requireAvailable();
    exactKeys(input, ['transactionId', 'occurrenceId', 'rootEpoch'], 'POLICY_REFERENCE_BACKUP_STEP_FIELDS', 'applyBackupStep input');
    const transaction = findTransaction(input.transactionId);
    if (!['prepared', 'applying'].includes(transaction.state)) fail('POLICY_REFERENCE_BACKUP', `${transaction.id} is not applicable`);
    const epoch = decimal(input.rootEpoch, 'POLICY_REFERENCE_BACKUP', 'rootEpoch');
    if (!transaction.rootIndependent && (transaction.rootEpoch !== epoch || currentRootEpoch !== epoch)) {
      if (transaction.applied.size === 0) {
        emit('backup-stale-before-mutation', { transactionId: transaction.id, captured: toDecimal(transaction.rootEpoch), current: toDecimal(currentRootEpoch) });
        return { kind: 'stale', code: 'backup-target-stale' };
      }
      quarantineEvidence('stale-epoch-after-visible-prefix', { transactionId: transaction.id });
      fail('POLICY_REFERENCE_PARTIAL_BACKUP', 'root epoch changed after backup mutation began');
    }
    const occurrence = transaction.occurrences.find(({ occurrenceId }) => occurrenceId === input.occurrenceId);
    if (!occurrence) fail('POLICY_REFERENCE_BACKUP', `unknown occurrence ${input.occurrenceId}`);
    if (transaction.applied.has(occurrence.occurrenceId) && mutations.allowDuplicateBackup !== true) {
      emit('backup-step-idempotent', { transactionId: transaction.id, occurrenceId: occurrence.occurrenceId });
      return { kind: 'already-applied', occurrenceId: occurrence.occurrenceId };
    }
    const expectedGeneration = decimal(occurrence.targetGeneration, 'POLICY_REFERENCE_BACKUP', 'target generation');
    if (recordGenerations.get(occurrence.recordKey) !== expectedGeneration) {
      if (transaction.applied.size === 0) return { kind: 'stale', code: 'backup-target-stale' };
      quarantineEvidence('target-generation-changed-after-visible-prefix', { transactionId: transaction.id, occurrenceId: occurrence.occurrenceId });
      fail('POLICY_REFERENCE_PARTIAL_BACKUP', 'target generation changed after backup mutation began');
    }
    const transformed = freeze(transformContribution({
      contribution: canonicalClone(transaction.contribution),
      occurrence: canonicalClone(occurrence),
      sequence: transaction.applied.size,
      algebra: profile.backup.algebra,
    }), 'Policy transformed contribution');
    const atomicCommit = profile.backup.prefixVisibility === 'atomic-commit';
    const previous = atomicCommit && transaction.shadowValues.has(occurrence.recordKey)
      ? transaction.shadowValues.get(occurrence.recordKey)
      : recordValues.get(occurrence.recordKey);
    const updated = freeze(applyRecordUpdate({
      previous: canonicalClone(previous),
      contribution: canonicalClone(transformed),
      occurrence: canonicalClone(occurrence),
      sequence: transaction.applied.size,
      algebra: profile.backup.algebra,
    }), 'Policy updated record');
    if (atomicCommit) transaction.shadowValues.set(occurrence.recordKey, updated);
    else recordValues.set(occurrence.recordKey, updated);
    transaction.applied.add(occurrence.occurrenceId);
    transaction.state = 'applying';
    if (!atomicCommit && occurrence.resultVisible) transaction.mustDrain = true;
    emit('backup-step-applied', {
      transactionId: transaction.id,
      occurrenceId: occurrence.occurrenceId,
      nodeReference: occurrence.nodeReference,
      recordId: occurrence.recordId,
      storageKey: occurrence.storageKey,
      mustDrain: transaction.mustDrain,
    });
    return { kind: 'applied', occurrenceId: occurrence.occurrenceId, mustDrain: transaction.mustDrain };
  }

  function completeBackup(input) {
    requireAvailable();
    exactKeys(input, ['transactionId'], 'POLICY_REFERENCE_BACKUP_COMPLETE_FIELDS', 'completeBackup input');
    const transaction = findTransaction(input.transactionId);
    if (!['prepared', 'applying'].includes(transaction.state)) fail('POLICY_REFERENCE_BACKUP', `${transaction.id} cannot complete from ${transaction.state}`);
    if (transaction.applied.size !== transaction.occurrences.length) fail('POLICY_REFERENCE_BACKUP_INCOMPLETE', `${transaction.id} has unapplied occurrences`);
    if (!transaction.rootIndependent && transaction.rootEpoch !== currentRootEpoch) {
      if (transaction.mustDrain) {
        quarantineEvidence('stale-epoch-after-visible-prefix', { transactionId: transaction.id });
        fail('POLICY_REFERENCE_PARTIAL_BACKUP', 'root epoch changed after backup mutation began');
      }
      emit('backup-stale-before-commit', { transactionId: transaction.id, captured: toDecimal(transaction.rootEpoch), current: toDecimal(currentRootEpoch) });
      return { kind: 'stale', code: 'backup-target-stale' };
    }
    const work = findWork(transaction.workId);
    if (profile.backup.prefixVisibility === 'atomic-commit') {
      for (const [recordKey, value] of transaction.shadowValues) recordValues.set(recordKey, value);
      emit('backup-atomic-commit', { transactionId: transaction.id, targets: transaction.shadowValues.size });
    }
    if (work.reservationId !== null) {
      const reservation = findReservation(work.reservationId);
      if (reservation.state !== 'acquired') fail('POLICY_REFERENCE_RESERVATION_IMBALANCE', 'reservation was dispositioned before backup completion');
      if (mutations.skipReservationDispositionOnComplete !== true) dispositionReservation(reservation, 'converted');
    }
    transaction.state = 'complete';
    work.state = 'complete';
    accounting.backupInProgress -= 1n;
    accounting.completed += 1n;
    emit('backup-complete', { transactionId: transaction.id, workId: work.id });
    assertAccounting();
    return { kind: 'complete', transactionId: transaction.id };
  }

  function failBackup(input) {
    requireAvailable();
    exactKeys(input, ['transactionId', 'code'], 'POLICY_REFERENCE_BACKUP_FAIL_FIELDS', 'failBackup input');
    const transaction = findTransaction(input.transactionId);
    if (!['prepared', 'applying'].includes(transaction.state)) fail('POLICY_REFERENCE_BACKUP', `${transaction.id} cannot fail from ${transaction.state}`);
    if (transaction.mustDrain) {
      quarantineEvidence('partial-backup-fatal', { transactionId: transaction.id, code: input.code });
      fail('POLICY_REFERENCE_PARTIAL_BACKUP', 'visible backup prefix cannot be abandoned');
    }
    const work = findWork(transaction.workId);
    if (work.reservationId !== null) {
      const reservation = findReservation(work.reservationId);
      if (reservation.state === 'acquired') dispositionReservation(reservation, 'released');
    }
    transaction.state = 'failed';
    transaction.failure = input.code;
    work.state = 'failed';
    accounting.backupInProgress -= 1n;
    accounting.failedOrAbandoned += 1n;
    emit('backup-failed', { transactionId: transaction.id, code: input.code });
    assertAccounting();
    return { kind: 'failed', transactionId: transaction.id, code: input.code };
  }

  function requestStop(input) {
    requireAvailable();
    exactKeys(input, ['cause', 'ready'], 'POLICY_REFERENCE_STOP_FIELDS', 'requestStop input');
    const cause = requireString(input.cause, 'POLICY_REFERENCE_STOP', 'cause');
    if (!profile.stop.causePriority.includes(cause)) fail('POLICY_REFERENCE_STOP', `undeclared stop cause ${cause}`);
    if (input.ready !== true) return { kind: 'pending', code: 'required-input-unavailable' };
    stop.causes.push(cause);
    if (stop.firstCause === null) {
      stop.firstCause = cause;
      stop.phase = 'stop-requested';
      emit('stop-requested', { cause });
    } else {
      emit('stop-cause-observed', { cause, authoritative: stop.firstCause });
    }
    return { kind: 'stop-requested', cause: stop.firstCause };
  }

  function beginDrain() {
    requireAvailable();
    if (stop.phase !== 'stop-requested') fail('POLICY_REFERENCE_STOP', `cannot drain from ${stop.phase}`);
    stop.phase = 'draining';
    emit('stop-draining', { cause: stop.firstCause });
    return { kind: 'draining', cause: stop.firstCause };
  }

  function observeOvershoot(input) {
    requireAvailable();
    exactKeys(input, ['completedAfterStop'], 'POLICY_REFERENCE_STOP_OVERSHOOT_FIELDS', 'observeOvershoot input');
    if (!['stop-requested', 'draining'].includes(stop.phase)) fail('POLICY_REFERENCE_STOP', 'overshoot observation requires a requested stop');
    const overshoot = decimal(input.completedAfterStop, 'POLICY_REFERENCE_STOP', 'completedAfterStop');
    if (overshoot > maxOvershoot) {
      quarantineEvidence('stop-overshoot-exceeded', { observed: input.completedAfterStop, maximum: profile.stop.maxOvershoot });
      fail('POLICY_REFERENCE_STOP_OVERSHOOT', 'stop overshoot exceeded normalized bound');
    }
    stop.overshoot = overshoot;
    emit('stop-overshoot', { completedAfterStop: input.completedAfterStop });
    return { kind: 'bounded', completedAfterStop: input.completedAfterStop };
  }

  function terminalizeStop(input) {
    requireAvailable();
    exactKeys(input, ['classification'], 'POLICY_REFERENCE_STOP_TERMINAL_FIELDS', 'terminalizeStop input');
    if (stop.phase !== 'draining') fail('POLICY_REFERENCE_STOP', `cannot terminalize from ${stop.phase}`);
    const mustDrain = [...transactions.values()].some(({ state, mustDrain }) => mustDrain && state !== 'complete');
    if (mustDrain) return { kind: 'must-drain' };
    stop.phase = 'terminal';
    emit('stop-terminal', { cause: stop.firstCause, classification: input.classification });
    return { kind: 'terminal', cause: stop.firstCause, classification: input.classification };
  }

  function advanceRoot(input) {
    requireAvailable();
    exactKeys(input, ['fromEpoch', 'toEpoch', 'selectedOccurrence'], 'POLICY_REFERENCE_ADVANCE_FIELDS', 'advanceRoot input');
    const from = decimal(input.fromEpoch, 'POLICY_REFERENCE_REUSE', 'fromEpoch');
    const to = decimal(input.toEpoch, 'POLICY_REFERENCE_REUSE', 'toEpoch');
    if (from !== currentRootEpoch || to <= from) fail('POLICY_REFERENCE_REUSE', 'advance epochs are invalid');
    requireString(input.selectedOccurrence, 'POLICY_REFERENCE_REUSE', 'selectedOccurrence');
    currentRootEpoch = to;
    emit('root-advanced', { fromEpoch: input.fromEpoch, toEpoch: input.toEpoch, selectedOccurrence: input.selectedOccurrence });
    return { kind: 'advanced', reuseClassifications: toDecimal(reuseClassifications) };
  }

  function reroot(input) {
    requireAvailable();
    exactKeys(input, ['fromEpoch', 'toEpoch', 'dispositions'], 'POLICY_REFERENCE_REROOT_FIELDS', 'reroot input');
    const from = decimal(input.fromEpoch, 'POLICY_REFERENCE_REUSE', 'fromEpoch');
    const to = decimal(input.toEpoch, 'POLICY_REFERENCE_REUSE', 'toEpoch');
    if (from !== currentRootEpoch || to <= from) fail('POLICY_REFERENCE_REUSE', 'reroot epochs are invalid');
    if (!Array.isArray(input.dispositions)) fail('POLICY_REFERENCE_REUSE', 'reroot dispositions must be an array');
    const byRecord = new Map();
    for (const entry of input.dispositions) {
      exactKeys(entry, ['recordId', 'action', 'keyValid'], 'POLICY_REFERENCE_REUSE_FIELDS', 'reroot disposition');
      if (byRecord.has(entry.recordId)) fail('POLICY_REFERENCE_REUSE', `duplicate reuse disposition for ${entry.recordId}`);
      const declared = reuseByRecord.get(entry.recordId);
      if (!declared) fail('POLICY_REFERENCE_REUSE', `unknown reuse record ${entry.recordId}`);
      if (!['retain', 'retain-if-key-valid', 'transform', 'reset', 'invalidate'].includes(entry.action)) fail('POLICY_REFERENCE_REUSE', `invalid reuse action ${entry.action}`);
      if (declared.disposition === 'retain' && entry.action !== 'retain') fail('POLICY_REFERENCE_REUSE', `${entry.recordId} contradicts declared retain`);
      if (declared.disposition === 'retain-if-key-valid') {
        const expected = entry.keyValid === true ? 'retain' : 'invalidate';
        if (entry.action !== expected) fail('POLICY_REFERENCE_REUSE', `${entry.recordId} key-valid reuse action must be ${expected}`);
      }
      if (declared.disposition === 'reset' && entry.action !== 'reset') fail('POLICY_REFERENCE_REUSE', `${entry.recordId} contradicts declared reset`);
      byRecord.set(entry.recordId, entry);
      reuseClassifications += 1n;
      emit('reuse-classified', { recordId: entry.recordId, action: entry.action });
    }
    if (byRecord.size !== reuseByRecord.size) fail('POLICY_REFERENCE_REUSE', 'reroot must classify every persistent policy record');
    currentRootEpoch = to;
    for (const [recordId, entry] of byRecord) {
      if (entry.action === 'retain') continue;
      for (const key of [...recordValues.keys()].filter((candidate) => candidate.startsWith(`${recordId}\0`))) {
        if (entry.action === 'invalidate') {
          recordValues.delete(key);
          recordGenerations.delete(key);
        } else if (entry.action === 'reset') {
          recordValues.set(key, freeze(null, 'Policy reset record'));
          recordGenerations.set(key, recordGenerations.get(key) + 1n);
        } else if (entry.action === 'transform') {
          recordValues.set(key, freeze({ transformedFrom: canonicalClone(recordValues.get(key)) }, 'Policy transformed reuse record'));
          recordGenerations.set(key, recordGenerations.get(key) + 1n);
        }
      }
    }
    emit('root-rerooted', { fromEpoch: input.fromEpoch, toEpoch: input.toEpoch, classifications: String(byRecord.size) });
    return { kind: 'rerooted', reuseClassifications: toDecimal(reuseClassifications) };
  }

  function setRootEpoch(input) {
    requireAvailable();
    exactKeys(input, ['rootEpoch'], 'POLICY_REFERENCE_ROOT_FIELDS', 'setRootEpoch input');
    currentRootEpoch = decimal(input.rootEpoch, 'POLICY_REFERENCE_ROOT', 'rootEpoch');
    emit('root-epoch-set', { rootEpoch: input.rootEpoch });
  }

  function advancePolicyGeneration(input) {
    requireAvailable();
    exactKeys(input, ['current', 'maximum'], 'POLICY_REFERENCE_GENERATION_FIELDS', 'advancePolicyGeneration input');
    const current = decimal(input.current, 'POLICY_REFERENCE_GENERATION', 'current');
    const maximum = decimal(input.maximum, 'POLICY_REFERENCE_GENERATION', 'maximum');
    if (current >= maximum) return { kind: 'exhausted', code: 'policy-generation-exhausted' };
    return { kind: 'advanced', generation: toDecimal(current + 1n) };
  }

  function cleanup() {
    if (quarantine !== null) return { kind: 'quarantined', quarantine: canonicalClone(quarantine) };
    assertAccounting();
    const heldReservations = [...reservations.values()].filter(({ state }) => state === 'acquired');
    const unfinishedBackups = [...transactions.values()].filter(({ state }) => !['complete', 'failed'].includes(state));
    const liveWorks = [...works.values()].filter(({ state }) => ['active', 'backup'].includes(state));
    if (heldReservations.length !== 0 || unfinishedBackups.length !== 0 || liveWorks.length !== 0) {
      quarantineEvidence('cleanup-obligation-remains', {
        heldReservations: heldReservations.map(({ id }) => id),
        unfinishedBackups: unfinishedBackups.map(({ id }) => id),
        liveWorks: liveWorks.map(({ id }) => id),
      });
      return { kind: 'quarantined', quarantine: canonicalClone(quarantine) };
    }
    emit('cleanup-complete', {
      reservations: reservations.size,
      transactions: transactions.size,
      records: recordValues.size,
      stopPhase: stop.phase,
    });
    return {
      kind: 'complete',
      accounting: accountingSnapshot(),
      dispositions: {
        reservations: [...reservations.values()].map(({ id, state }) => ({ id, state })),
        transactions: [...transactions.values()].map(({ id, state }) => ({ id, state })),
        records: [...recordValues.keys()].map((key) => ({ key, disposition: 'retain' })),
        stop: stop.phase,
      },
    };
  }

  function snapshot() {
    return freeze({
      profile: profile.id,
      currentRootEpoch: toDecimal(currentRootEpoch),
      accounting: accountingSnapshot(),
      works: [...works.values()].map(({ id, rootEpoch, state, reservationId, transactionId }) => ({
        id, rootEpoch: toDecimal(rootEpoch), state, reservationId, transactionId,
      })),
      reservations: [...reservations.values()].map(({ id, workId, state, disposition, generation }) => ({
        id, workId, state, disposition, generation: toDecimal(generation),
      })),
      transactions: [...transactions.values()].map(({ id, workId, rootEpoch, state, mustDrain, applied, shadowValues, occurrences }) => ({
        id, workId, rootEpoch: toDecimal(rootEpoch), state, mustDrain,
        applied: [...applied].sort(),
        stagedRecordKeys: [...shadowValues.keys()].sort(),
        occurrences: occurrences.map(({ occurrenceId, nodeReference, recordId, storageKey, targetGeneration }) => ({
          occurrenceId, nodeReference, recordId, storageKey, targetGeneration,
        })),
      })),
      records: [...recordValues.entries()].map(([key, value]) => ({ key, value: canonicalClone(value), generation: toDecimal(recordGenerations.get(key)) })),
      stop: { phase: stop.phase, firstCause: stop.firstCause, causes: [...stop.causes], overshoot: toDecimal(stop.overshoot) },
      reuseClassifications: toDecimal(reuseClassifications),
      quarantine,
      events,
    }, 'Policy reference snapshot');
  }

  return {
    initializeRecord,
    readRecord,
    admitWork,
    reserveInFlight,
    releaseInFlight,
    abandonWork,
    classifyPathResponse,
    prepareBackup,
    applyBackupStep,
    completeBackup,
    failBackup,
    requestStop,
    beginDrain,
    observeOvershoot,
    terminalizeStop,
    advanceRoot,
    reroot,
    setRootEpoch,
    advancePolicyGeneration,
    cleanup,
    assertAccounting,
    snapshot,
  };
}

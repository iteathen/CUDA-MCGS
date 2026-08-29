import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one match, found ${count}`);
  return source.replace(before, after);
}

const policyPath = 'experiments/search-semantics-reference/src/policy.mjs';
let policy = fs.readFileSync(policyPath, 'utf8');

policy = replaceOnce(policy,
`  function readRecord(input) {
    exactKeys(input, ['recordId', 'storageKey'], 'POLICY_REFERENCE_RECORD_FIELDS', 'readRecord input');`,
`  function readRecord(input) {
    requireAvailable();
    exactKeys(input, ['recordId', 'storageKey'], 'POLICY_REFERENCE_RECORD_FIELDS', 'readRecord input');`,
'readRecord quarantine gate');

policy = replaceOnce(policy,
`    const transaction = findTransaction(input.transactionId);
    if (!['prepared', 'applying'].includes(transaction.state)) fail('POLICY_REFERENCE_BACKUP', \`${'${transaction.id}'} is not applicable\`);
    const epoch = decimal(input.rootEpoch, 'POLICY_REFERENCE_BACKUP', 'rootEpoch');`,
`    const transaction = findTransaction(input.transactionId);
    if (!['prepared', 'applying'].includes(transaction.state)) fail('POLICY_REFERENCE_BACKUP', \`${'${transaction.id}'} is not applicable\`);
    const atomicCommit = profile.backup.prefixVisibility === 'atomic-commit';
    const epoch = decimal(input.rootEpoch, 'POLICY_REFERENCE_BACKUP', 'rootEpoch');`,
'backup atomic mode placement');

policy = replaceOnce(policy,
`      if (transaction.applied.size === 0) {
        emit('backup-stale-before-mutation', { transactionId: transaction.id, captured: toDecimal(transaction.rootEpoch), current: toDecimal(currentRootEpoch) });
        return { kind: 'stale', code: 'backup-target-stale' };
      }`,
`      if (atomicCommit || transaction.applied.size === 0) {
        emit('backup-stale-before-target-mutation', { transactionId: transaction.id, captured: toDecimal(transaction.rootEpoch), current: toDecimal(currentRootEpoch) });
        return { kind: 'stale', code: 'backup-target-stale' };
      }`,
'root stale atomic staging');

policy = replaceOnce(policy,
`      if (transaction.applied.size === 0) return { kind: 'stale', code: 'backup-target-stale' };`,
`      if (atomicCommit || transaction.applied.size === 0) return { kind: 'stale', code: 'backup-target-stale' };`,
'target generation stale atomic staging');

policy = replaceOnce(policy,
`    }), 'Policy transformed contribution');
    const atomicCommit = profile.backup.prefixVisibility === 'atomic-commit';
    const previous = atomicCommit && transaction.shadowValues.has(occurrence.recordKey)`,
`    }), 'Policy transformed contribution');
    const previous = atomicCommit && transaction.shadowValues.has(occurrence.recordKey)`,
'remove duplicate atomic mode declaration');

policy = replaceOnce(policy,
`    const work = findWork(transaction.workId);
    if (profile.backup.prefixVisibility === 'atomic-commit') {
      for (const [recordKey, value] of transaction.shadowValues) recordValues.set(recordKey, value);
      emit('backup-atomic-commit', { transactionId: transaction.id, targets: transaction.shadowValues.size });
    }
    if (work.reservationId !== null) {
      const reservation = findReservation(work.reservationId);
      if (reservation.state !== 'acquired') fail('POLICY_REFERENCE_RESERVATION_IMBALANCE', 'reservation was dispositioned before backup completion');
      if (mutations.skipReservationDispositionOnComplete !== true) dispositionReservation(reservation, 'converted');
    }`,
`    const work = findWork(transaction.workId);
    const atomicCommit = profile.backup.prefixVisibility === 'atomic-commit';
    let reservation = null;
    if (work.reservationId !== null) {
      reservation = findReservation(work.reservationId);
      if (reservation.state !== 'acquired') {
        if (!atomicCommit && transaction.applied.size > 0) {
          quarantineEvidence('reservation-disposition-after-prefix-mutation', { transactionId: transaction.id, reservationId: reservation.id, state: reservation.state });
          fail('POLICY_REFERENCE_PARTIAL_BACKUP', 'reservation disposition changed after backup target mutation began');
        }
        fail('POLICY_REFERENCE_RESERVATION_IMBALANCE', 'reservation was dispositioned before backup completion');
      }
    }
    if (atomicCommit) {
      for (const occurrence of transaction.occurrences) {
        const expectedGeneration = decimal(occurrence.targetGeneration, 'POLICY_REFERENCE_BACKUP', 'target generation');
        if (recordGenerations.get(occurrence.recordKey) !== expectedGeneration) {
          emit('backup-stale-before-commit', { transactionId: transaction.id, occurrenceId: occurrence.occurrenceId });
          return { kind: 'stale', code: 'backup-target-stale' };
        }
      }
      for (const [recordKey, value] of transaction.shadowValues) recordValues.set(recordKey, value);
      emit('backup-atomic-commit', { transactionId: transaction.id, targets: transaction.shadowValues.size });
    }
    if (reservation !== null && mutations.skipReservationDispositionOnComplete !== true) dispositionReservation(reservation, 'converted');`,
'backup commit preconditions');

policy = replaceOnce(policy,
`    const mustDrain = [...transactions.values()].some(({ state, mustDrain }) => mustDrain && state !== 'complete');
    if (mustDrain) return { kind: 'must-drain' };
    stop.phase = 'terminal';`,
`    const mustDrain = [...transactions.values()].some(({ state, mustDrain }) => mustDrain && state !== 'complete');
    if (mustDrain) return { kind: 'must-drain' };
    const liveWorks = [...works.values()].filter(({ state }) => ['active', 'backup'].includes(state));
    const unfinishedBackups = [...transactions.values()].filter(({ state }) => !['complete', 'failed'].includes(state));
    const heldReservations = [...reservations.values()].filter(({ state }) => state === 'acquired');
    if (liveWorks.length !== 0 || unfinishedBackups.length !== 0 || heldReservations.length !== 0) {
      return { kind: 'pending', code: 'drain-obligation' };
    }
    stop.phase = 'terminal';`,
'stop terminal drain obligation');

fs.writeFileSync(policyPath, policy);

const casesPath = 'experiments/search-semantics-reference/src/policy-cases.mjs';
let cases = fs.readFileSync(casesPath, 'utf8');

cases = replaceOnce(cases,
`    assert.throws(() => oracle.releaseInFlight({ reservationId: 'reservation-a', reason: 'again' }), { code: 'POLICY_REFERENCE_RESERVATION_IMBALANCE' });
    return accounting;`,
`    assert.throws(() => oracle.releaseInFlight({ reservationId: 'reservation-a', reason: 'again' }), { code: 'POLICY_REFERENCE_RESERVATION_IMBALANCE' });

    const staged = numericOracle(scalar);
    const record = initVisible(staged, scalar);
    staged.admitWork({ workId: 'work-staged', rootEpoch: '0' });
    staged.reserveInFlight({ reservationId: 'reservation-staged', workId: 'work-staged', scope: { kind: 'work', id: 'work-staged' }, magnitude: { units: '1' }, generation: '0' });
    staged.prepareBackup({ transactionId: 'backup-staged', workId: 'work-staged', rootEpoch: '0', sourceIdentity: { kind: 'ready-source', id: 'value-staged' }, contribution: { delta: '3' }, occurrences: backupOccurrences(record, 1), rootIndependent: false });
    staged.applyBackupStep({ transactionId: 'backup-staged', occurrenceId: 'occurrence-0', rootEpoch: '0' });
    assert.deepEqual(staged.readRecord({ recordId: record.id, storageKey: 'target' }), { total: '0' });
    staged.releaseInFlight({ reservationId: 'reservation-staged', reason: 'cancelled-before-commit' });
    assert.throws(() => staged.completeBackup({ transactionId: 'backup-staged' }), { code: 'POLICY_REFERENCE_RESERVATION_IMBALANCE' });
    assert.deepEqual(staged.readRecord({ recordId: record.id, storageKey: 'target' }), { total: '0' }, 'atomic backup must not publish before reservation conversion preconditions pass');
    assert.deepEqual(staged.failBackup({ transactionId: 'backup-staged', code: 'cancelled-before-commit' }), { kind: 'failed', transactionId: 'backup-staged', code: 'cancelled-before-commit' });
    assert.equal(staged.cleanup().kind, 'complete');
    return accounting;`,
'reservation commit-precondition falsifier');

cases = replaceOnce(cases,
`    assert.deepEqual(oracle.readRecord({ recordId: record.id, storageKey: 'target' }), { total: '0' });
    return { currentEpoch: oracle.snapshot().currentRootEpoch };`,
`    assert.deepEqual(oracle.readRecord({ recordId: record.id, storageKey: 'target' }), { total: '0' });

    const staged = numericOracle(scalar);
    const stagedRecord = initVisible(staged, scalar);
    staged.setRootEpoch({ rootEpoch: '1' });
    staged.admitWork({ workId: 'work-staged', rootEpoch: '1' });
    staged.prepareBackup({ transactionId: 'backup-staged', workId: 'work-staged', rootEpoch: '1', sourceIdentity: { kind: 'ready-source', id: 'value-staged' }, contribution: { delta: '2' }, occurrences: backupOccurrences(stagedRecord, 2), rootIndependent: false });
    assert.equal(staged.applyBackupStep({ transactionId: 'backup-staged', occurrenceId: 'occurrence-0', rootEpoch: '1' }).kind, 'applied');
    assert.deepEqual(staged.readRecord({ recordId: stagedRecord.id, storageKey: 'target' }), { total: '0' });
    staged.advanceRoot({ fromEpoch: '1', toEpoch: '2', selectedOccurrence: 'child-staged' });
    assert.deepEqual(staged.applyBackupStep({ transactionId: 'backup-staged', occurrenceId: 'occurrence-1', rootEpoch: '2' }), { kind: 'stale', code: 'backup-target-stale' });
    assert.deepEqual(staged.readRecord({ recordId: stagedRecord.id, storageKey: 'target' }), { total: '0' }, 'atomic staged updates remain discardable before commit');
    assert.equal(staged.failBackup({ transactionId: 'backup-staged', code: 'stale-root' }).kind, 'failed');
    assert.equal(staged.cleanup().kind, 'complete');

    const resetDeclaration = scalar.reuse.find(({ disposition }) => disposition === 'reset');
    assert(resetDeclaration, 'scalar Policy profile needs one reset target for atomic commit generation validation');
    const resetRecord = scalar.records.find(({ id }) => id === resetDeclaration.record);
    assert(resetRecord);
    const commitFence = numericOracle(scalar);
    commitFence.initializeRecord({ recordId: resetRecord.id, storageKey: 'reset-target', generation: '0', value: { total: '0' } });
    commitFence.setRootEpoch({ rootEpoch: '1' });
    commitFence.admitWork({ workId: 'work-commit-fence', rootEpoch: '1' });
    commitFence.prepareBackup({ transactionId: 'backup-commit-fence', workId: 'work-commit-fence', rootEpoch: '1', sourceIdentity: { kind: 'ready-source', id: 'value-commit-fence' }, contribution: { delta: '5' }, occurrences: backupOccurrences(resetRecord, 1, { storageKey: 'reset-target' }), rootIndependent: true });
    assert.equal(commitFence.applyBackupStep({ transactionId: 'backup-commit-fence', occurrenceId: 'occurrence-0', rootEpoch: '1' }).kind, 'applied');
    commitFence.reroot({ fromEpoch: '1', toEpoch: '2', dispositions: rerootDispositions(scalar, true) });
    assert.equal(commitFence.readRecord({ recordId: resetRecord.id, storageKey: 'reset-target' }), null);
    assert.deepEqual(commitFence.completeBackup({ transactionId: 'backup-commit-fence' }), { kind: 'stale', code: 'backup-target-stale' });
    assert.equal(commitFence.readRecord({ recordId: resetRecord.id, storageKey: 'reset-target' }), null, 'atomic commit must revalidate target generation at commit');
    assert.equal(commitFence.failBackup({ transactionId: 'backup-commit-fence', code: 'stale-generation' }).kind, 'failed');
    assert.equal(commitFence.cleanup().kind, 'complete');
    return { currentEpoch: oracle.snapshot().currentRootEpoch };`,
'atomic stale and commit-generation falsifiers');

cases = replaceOnce(cases,
`  defineCase('policy-first-stop-cause-drain', () => {
    const oracle = numericOracle(scalar);
    assert.deepEqual(oracle.requestStop({ cause: 'policy-budget-satisfied', ready: false }), { kind: 'pending', code: 'required-input-unavailable' });`,
`  defineCase('policy-first-stop-cause-drain', () => {
    const oracle = numericOracle(scalar);
    oracle.admitWork({ workId: 'accepted-before-stop', rootEpoch: '0' });
    assert.deepEqual(oracle.requestStop({ cause: 'policy-budget-satisfied', ready: false }), { kind: 'pending', code: 'required-input-unavailable' });`,
'stop accepted work setup');

cases = replaceOnce(cases,
`    oracle.beginDrain();
    const terminal = oracle.terminalizeStop({ classification: 'valid-partial' });
    assert.deepEqual(terminal, { kind: 'terminal', cause: 'policy-budget-satisfied', classification: 'valid-partial' });`,
`    oracle.beginDrain();
    assert.deepEqual(oracle.terminalizeStop({ classification: 'valid-partial' }), { kind: 'pending', code: 'drain-obligation' });
    oracle.abandonWork({ workId: 'accepted-before-stop', reason: 'stop-drain' });
    const terminal = oracle.terminalizeStop({ classification: 'valid-partial' });
    assert.deepEqual(terminal, { kind: 'terminal', cause: 'policy-budget-satisfied', classification: 'valid-partial' });`,
'stop terminal drain falsifier');

cases = replaceOnce(cases,
`    assert.equal(cleanup.quarantine.code, 'cleanup-obligation-remains');
    assert.equal(cleanup.quarantine.evidenceValid, false);
    return cleanup;`,
`    assert.equal(cleanup.quarantine.code, 'cleanup-obligation-remains');
    assert.equal(cleanup.quarantine.evidenceValid, false);
    assert.throws(() => oracle.readRecord({ recordId: record.id, storageKey: 'target' }), { code: 'POLICY_REFERENCE_QUARANTINED' });
    return cleanup;`,
'quarantined record read falsifier');

fs.writeFileSync(casesPath, cases);

import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one match, found ${count}`);
  return source.replace(before, after);
}

const policyPath = 'experiments/search-semantics-reference/src/policy.mjs';
let policy = fs.readFileSync(policyPath, 'utf8');

policy = replaceOnce(policy,
`    const work = findWork(input.workId);
    if (work.state !== 'active') fail('POLICY_REFERENCE_RESERVATION', \`${'${work.id}'} is not active\`);`,
`    const scopeKind = input.scope?.kind;
    if (!profile.reservation.scopes.includes(scopeKind)) fail('POLICY_REFERENCE_RESERVATION', \`reservation scope ${'${scopeKind ?? "<missing>"}'} is not selected by the profile\`);
    const work = findWork(input.workId);
    if (work.state !== 'active') fail('POLICY_REFERENCE_RESERVATION', \`${'${work.id}'} is not active\`);`,
'reservation scope authority');

policy = replaceOnce(policy,
`    const capturedEpoch = decimal(input.rootEpoch, 'POLICY_REFERENCE_BACKUP', 'rootEpoch');
    if (!input.rootIndependent && (work.rootEpoch !== capturedEpoch || currentRootEpoch !== capturedEpoch)) {`,
`    if (typeof input.rootIndependent !== 'boolean') fail('POLICY_REFERENCE_BACKUP_STALE', 'rootIndependent must be boolean');
    if (input.rootIndependent && profile.backup.staleEpoch !== 'root-independent-only') {
      fail('POLICY_REFERENCE_BACKUP_STALE', 'root-independent backup is not selected by the normalized Policy profile');
    }
    const capturedEpoch = decimal(input.rootEpoch, 'POLICY_REFERENCE_BACKUP', 'rootEpoch');
    if (!input.rootIndependent && (work.rootEpoch !== capturedEpoch || currentRootEpoch !== capturedEpoch)) {`,
'root-independent authority');

policy = replaceOnce(policy,
`      const record = recordsById.get(occurrence.recordId);
      if (!record) fail('POLICY_REFERENCE_BACKUP', \`unknown target record ${'${occurrence.recordId}'}\`);`,
`      const record = recordsById.get(occurrence.recordId);
      if (!record) fail('POLICY_REFERENCE_BACKUP', \`unknown target record ${'${occurrence.recordId}'}\`);
      if (!profile.backup.targets.includes(occurrence.recordId)) fail('POLICY_REFERENCE_BACKUP', \`target record ${'${occurrence.recordId}'} is not selected by the normalized backup target set\`);`,
'backup target authority');

policy = replaceOnce(policy,
`    if (transaction.applied.has(occurrence.occurrenceId) && mutations.allowDuplicateBackup !== true) {
      emit('backup-step-idempotent', { transactionId: transaction.id, occurrenceId: occurrence.occurrenceId });
      return { kind: 'already-applied', occurrenceId: occurrence.occurrenceId };
    }
    const expectedGeneration = decimal(occurrence.targetGeneration, 'POLICY_REFERENCE_BACKUP', 'target generation');`,
`    if (transaction.applied.has(occurrence.occurrenceId) && mutations.allowDuplicateBackup !== true) {
      emit('backup-step-idempotent', { transactionId: transaction.id, occurrenceId: occurrence.occurrenceId });
      return { kind: 'already-applied', occurrenceId: occurrence.occurrenceId };
    }
    if (profile.backup.concurrencyOrder === 'deterministic-sequence') {
      const expectedOccurrence = transaction.occurrences[transaction.applied.size]?.occurrenceId;
      if (occurrence.occurrenceId !== expectedOccurrence) {
        fail('POLICY_REFERENCE_BACKUP_ORDER', \`expected occurrence ${'${expectedOccurrence}'} before ${'${occurrence.occurrenceId}'}\`);
      }
    }
    const expectedGeneration = decimal(occurrence.targetGeneration, 'POLICY_REFERENCE_BACKUP', 'target generation');`,
'deterministic backup order');

policy = replaceOnce(policy,
`    if (transaction.applied.size !== transaction.occurrences.length) fail('POLICY_REFERENCE_BACKUP_INCOMPLETE', \`${'${transaction.id}'} has unapplied occurrences\`);
    if (!transaction.rootIndependent && transaction.rootEpoch !== currentRootEpoch) {
      if (transaction.mustDrain) {
        quarantineEvidence('stale-epoch-after-visible-prefix', { transactionId: transaction.id });
        fail('POLICY_REFERENCE_PARTIAL_BACKUP', 'root epoch changed after backup mutation began');
      }
      emit('backup-stale-before-commit', { transactionId: transaction.id, captured: toDecimal(transaction.rootEpoch), current: toDecimal(currentRootEpoch) });
      return { kind: 'stale', code: 'backup-target-stale' };
    }
    const work = findWork(transaction.workId);
    const atomicCommit = profile.backup.prefixVisibility === 'atomic-commit';`,
`    if (transaction.applied.size !== transaction.occurrences.length) fail('POLICY_REFERENCE_BACKUP_INCOMPLETE', \`${'${transaction.id}'} has unapplied occurrences\`);
    const atomicCommit = profile.backup.prefixVisibility === 'atomic-commit';
    const prefixMutationBegan = !atomicCommit && transaction.applied.size > 0;
    if (!transaction.rootIndependent && transaction.rootEpoch !== currentRootEpoch) {
      if (prefixMutationBegan) {
        quarantineEvidence('stale-epoch-after-prefix-mutation', { transactionId: transaction.id });
        fail('POLICY_REFERENCE_PARTIAL_BACKUP', 'root epoch changed after backup target mutation began');
      }
      emit('backup-stale-before-commit', { transactionId: transaction.id, captured: toDecimal(transaction.rootEpoch), current: toDecimal(currentRootEpoch) });
      return { kind: 'stale', code: 'backup-target-stale' };
    }
    const work = findWork(transaction.workId);`,
'complete stale prefix handling');

policy = replaceOnce(policy,
`    if (atomicCommit) {
      for (const occurrence of transaction.occurrences) {
        const expectedGeneration = decimal(occurrence.targetGeneration, 'POLICY_REFERENCE_BACKUP', 'target generation');
        if (recordGenerations.get(occurrence.recordKey) !== expectedGeneration) {
          emit('backup-stale-before-commit', { transactionId: transaction.id, occurrenceId: occurrence.occurrenceId });
          return { kind: 'stale', code: 'backup-target-stale' };
        }
      }
      for (const [recordKey, value] of transaction.shadowValues) recordValues.set(recordKey, value);`,
`    for (const occurrence of transaction.occurrences) {
      const expectedGeneration = decimal(occurrence.targetGeneration, 'POLICY_REFERENCE_BACKUP', 'target generation');
      if (recordGenerations.get(occurrence.recordKey) !== expectedGeneration) {
        if (prefixMutationBegan) {
          quarantineEvidence('target-generation-changed-after-prefix-mutation', { transactionId: transaction.id, occurrenceId: occurrence.occurrenceId });
          fail('POLICY_REFERENCE_PARTIAL_BACKUP', 'target generation changed after backup target mutation began');
        }
        emit('backup-stale-before-commit', { transactionId: transaction.id, occurrenceId: occurrence.occurrenceId });
        return { kind: 'stale', code: 'backup-target-stale' };
      }
    }
    if (atomicCommit) {
      for (const [recordKey, value] of transaction.shadowValues) recordValues.set(recordKey, value);`,
'complete generation revalidation');

fs.writeFileSync(policyPath, policy);

const casesPath = 'experiments/search-semantics-reference/src/policy-cases.mjs';
let cases = fs.readFileSync(casesPath, 'utf8');

cases = replaceOnce(cases,
`    oracle.admitWork({ workId: 'work-a', rootEpoch: '0' });
    oracle.reserveInFlight({ reservationId: 'reservation-a', workId: 'work-a', scope: { kind: 'edge', id: 'edge-a' }, magnitude: { units: '1' }, generation: '0' });`,
`    oracle.admitWork({ workId: 'work-a', rootEpoch: '0' });
    assert.throws(
      () => oracle.reserveInFlight({ reservationId: 'reservation-invalid-scope', workId: 'work-a', scope: { kind: 'root', id: 'root-a' }, magnitude: { units: '1' }, generation: '0' }),
      { code: 'POLICY_REFERENCE_RESERVATION' },
    );
    oracle.reserveInFlight({ reservationId: 'reservation-a', workId: 'work-a', scope: { kind: 'edge', id: 'edge-a' }, magnitude: { units: '1' }, generation: '0' });`,
'reservation scope falsifier');

cases = replaceOnce(cases,
`    oracle.initializeRecord({ recordId: record.id, storageKey: 'target', generation: '0', value: { trace: [] } });
    oracle.admitWork({ workId: 'work-proof', rootEpoch: '0' });
    oracle.prepareBackup({ transactionId: 'backup-proof', workId: 'work-proof', rootEpoch: '0', sourceIdentity: { kind: 'proof', id: 'proof-a' }, contribution: { token: 'proof' }, occurrences: backupOccurrences(record), rootIndependent: false });
    oracle.applyBackupStep({ transactionId: 'backup-proof', occurrenceId: 'occurrence-0', rootEpoch: '0' });`,
`    oracle.initializeRecord({ recordId: record.id, storageKey: 'target', generation: '0', value: { trace: [] } });
    const privateRecord = proof.records.find(({ resultVisible }) => !resultVisible);
    assert(privateRecord, 'ordered Policy profile needs a non-backup record for target-set sensitivity');
    oracle.initializeRecord({ recordId: privateRecord.id, storageKey: 'private-target', generation: '0', value: { trace: [] } });
    oracle.admitWork({ workId: 'work-invalid-target', rootEpoch: '0' });
    assert.throws(
      () => oracle.prepareBackup({ transactionId: 'backup-invalid-target', workId: 'work-invalid-target', rootEpoch: '0', sourceIdentity: { kind: 'proof', id: 'proof-invalid' }, contribution: { token: 'proof' }, occurrences: backupOccurrences(privateRecord, 1, { storageKey: 'private-target' }), rootIndependent: false }),
      { code: 'POLICY_REFERENCE_BACKUP' },
    );
    oracle.abandonWork({ workId: 'work-invalid-target', reason: 'invalid-target-falsifier' });
    oracle.admitWork({ workId: 'work-proof', rootEpoch: '0' });
    oracle.prepareBackup({ transactionId: 'backup-proof', workId: 'work-proof', rootEpoch: '0', sourceIdentity: { kind: 'proof', id: 'proof-a' }, contribution: { token: 'proof' }, occurrences: backupOccurrences(record), rootIndependent: false });
    assert.throws(
      () => oracle.applyBackupStep({ transactionId: 'backup-proof', occurrenceId: 'occurrence-1', rootEpoch: '0' }),
      { code: 'POLICY_REFERENCE_BACKUP_ORDER' },
    );
    oracle.applyBackupStep({ transactionId: 'backup-proof', occurrenceId: 'occurrence-0', rootEpoch: '0' });`,
'backup target and sequence falsifiers');

cases = replaceOnce(cases,
`    const commitFence = numericOracle(scalar);
    commitFence.initializeRecord({ recordId: resetRecord.id, storageKey: 'reset-target', generation: '0', value: { total: '0' } });`,
`    const unauthorized = numericOracle(scalar);
    const unauthorizedRecord = initVisible(unauthorized, scalar);
    unauthorized.admitWork({ workId: 'work-unauthorized-root-independent', rootEpoch: '0' });
    assert.throws(
      () => unauthorized.prepareBackup({ transactionId: 'backup-unauthorized-root-independent', workId: 'work-unauthorized-root-independent', rootEpoch: '0', sourceIdentity: { kind: 'ready-source', id: 'value-unauthorized' }, contribution: { delta: '1' }, occurrences: backupOccurrences(unauthorizedRecord, 1), rootIndependent: true }),
      { code: 'POLICY_REFERENCE_BACKUP_STALE' },
    );
    unauthorized.abandonWork({ workId: 'work-unauthorized-root-independent', reason: 'profile-authority-falsifier' });
    assert.equal(unauthorized.cleanup().kind, 'complete');

    const globalRecord = scalar.records.find(({ scope }) => scope === 'global');
    assert(globalRecord, 'scalar Policy profile needs a global record for root-independent specialization sensitivity');
    const rootIndependentProfile = canonicalClone(scalar);
    rootIndependentProfile.backup.staleEpoch = 'root-independent-only';
    rootIndependentProfile.backup.targets = [globalRecord.id];
    const rootIndependent = numericOracle(rootIndependentProfile);
    rootIndependent.initializeRecord({ recordId: globalRecord.id, storageKey: 'global-target', generation: '0', value: { total: '0' } });
    rootIndependent.setRootEpoch({ rootEpoch: '1' });
    rootIndependent.admitWork({ workId: 'work-root-independent', rootEpoch: '1' });
    rootIndependent.prepareBackup({ transactionId: 'backup-root-independent', workId: 'work-root-independent', rootEpoch: '1', sourceIdentity: { kind: 'ready-source', id: 'value-root-independent' }, contribution: { delta: '4' }, occurrences: backupOccurrences(globalRecord, 1, { storageKey: 'global-target' }), rootIndependent: true });
    assert.equal(rootIndependent.applyBackupStep({ transactionId: 'backup-root-independent', occurrenceId: 'occurrence-0', rootEpoch: '1' }).kind, 'applied');
    rootIndependent.advanceRoot({ fromEpoch: '1', toEpoch: '2', selectedOccurrence: 'child-root-independent' });
    assert.equal(rootIndependent.completeBackup({ transactionId: 'backup-root-independent' }).kind, 'complete');
    assert.deepEqual(rootIndependent.readRecord({ recordId: globalRecord.id, storageKey: 'global-target' }), { total: '4' });
    assert.equal(rootIndependent.cleanup().kind, 'complete');

    const commitFence = numericOracle(scalar);
    commitFence.initializeRecord({ recordId: resetRecord.id, storageKey: 'reset-target', generation: '0', value: { total: '0' } });`,
'root-independent profile authority falsifiers');

fs.writeFileSync(casesPath, cases);

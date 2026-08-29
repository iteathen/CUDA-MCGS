import assert from 'node:assert/strict';

import { canonicalClone } from './canonical.mjs';
import { createPolicyOracle } from './policy.mjs';

function getProfile(projection, id) {
  const entry = projection.profiles.find((profile) => profile.id === id);
  assert(entry, `missing Policy profile ${id}`);
  return entry.normalized;
}

function visibleRecord(profile) {
  const record = profile.records.find(({ resultVisible }) => resultVisible);
  assert(record, `${profile.id} lacks a result-visible record`);
  return record;
}

function initVisible(oracle, profile, storageKey = 'target', value = { total: '0' }, generation = '0') {
  const record = visibleRecord(profile);
  oracle.initializeRecord({ recordId: record.id, storageKey, generation, value });
  return record;
}

function numericOracle(profile, options = {}) {
  return createPolicyOracle({
    profile,
    admission: options.admission ?? {},
    mutations: options.mutations ?? {},
    transformContribution: options.transformContribution ?? (({ contribution }) => contribution),
    applyRecordUpdate: options.applyRecordUpdate ?? (({ previous, contribution }) => ({
      total: (BigInt(previous.total) + BigInt(contribution.delta)).toString(),
    })),
  });
}

function backupOccurrences(record, count = 2, { storageKey = 'target', sameNode = true } = {}) {
  return Array.from({ length: count }, (_, index) => ({
    occurrenceId: `occurrence-${index}`,
    nodeReference: { arena: '0', slot: sameNode ? '7' : String(7 + index), generation: '3' },
    recordId: record.id,
    storageKey,
    targetGeneration: '0',
  }));
}

function rerootDispositions(profile, keyValid = true) {
  return profile.reuse.map(({ record, disposition }) => ({
    recordId: record,
    action: disposition === 'retain' ? 'retain' : disposition === 'retain-if-key-valid' ? (keyValid ? 'retain' : 'invalidate') : disposition,
    keyValid,
  }));
}

export function registerPolicyCases({ defineCase, projection }) {
  const scalar = getProfile(projection, 'policy.synthetic-scalar-absent');
  const vector = getProfile(projection, 'policy.synthetic-vector-combined');
  const proposalOnly = getProfile(projection, 'policy.synthetic-proposal-only-stateless');
  const proof = getProfile(projection, 'policy.synthetic-proof-evaluation-only');

  defineCase('policy-profile-matrix', () => {
    assert.deepEqual(projection.profiles.map(({ normalized }) => normalized.evaluatorMode), ['absent', 'combined', 'proposal-only', 'evaluation-only']);
    assert.equal(vector.value.family, 'vector');
    assert.equal(vector.value.coordinates.length, 3);
    assert.equal(proof.value.family, 'proof-lattice');
    assert.equal(proposalOnly.value.kind, 'none');
    assert.equal(proposalOnly.graphProfile.mode, 'stateless');
    assert.equal(proposalOnly.reservation.kind, 'none');
    assert.equal(proposalOnly.backup.kind, 'none');
    assert(!scalar.selection.inputs.includes('evaluator-facts'));
    assert(!scalar.resources.some(({ id }) => id.includes('evaluator')));
    return { profiles: projection.profiles.map(({ id }) => id) };
  });

  defineCase('policy-transposition-edge-local-records', () => {
    const oracle = numericOracle(scalar);
    const record = visibleRecord(scalar);
    assert.equal(record.scope, 'edge');
    const scopes = new Set(scalar.records.map(({ scope }) => scope));
    assert(scopes.has('edge') && scopes.has('work') && scopes.has('global'));
    oracle.initializeRecord({ recordId: record.id, storageKey: 'incoming-a', generation: '0', value: { total: '3' } });
    oracle.initializeRecord({ recordId: record.id, storageKey: 'incoming-b', generation: '0', value: { total: '9' } });
    assert.deepEqual(oracle.readRecord({ recordId: record.id, storageKey: 'incoming-a' }), { total: '3' });
    assert.deepEqual(oracle.readRecord({ recordId: record.id, storageKey: 'incoming-b' }), { total: '9' });
    assert(scalar.records.every(({ id }) => scalar.ports.some(({ records }) => records.includes(id))));
    assert(scalar.records.every(({ numeric }) => numeric.kind === 'none' || (BigInt(numeric.accumulationBits) >= BigInt(numeric.storageBits) && numeric.overflow !== 'wrap')));
    return { record: record.id, isolatedStorageKeys: 2 };
  }, ['POLICY-RECORD-001', 'POLICY-RECORD-002', 'POLICY-RECORD-003', 'POLICY-RECORD-005', 'POLICY-RECORD-006', 'POLICY-RECORD-007', 'POLICY-RECORD-008']);

  defineCase('policy-reservation-not-completed', () => {
    const oracle = numericOracle(scalar);
    oracle.admitWork({ workId: 'work-a', rootEpoch: '0' });
    oracle.reserveInFlight({ reservationId: 'reservation-a', workId: 'work-a', scope: { kind: 'edge', id: 'edge-a' }, magnitude: { units: '1' }, generation: '0' });
    const accounting = oracle.assertAccounting();
    assert.equal(accounting.completed, '0');
    assert.equal(accounting.activeOrPending, '1');
    assert.equal(accounting.outstandingReservations, '1');
    return accounting;
  }, ['POLICY-RECORD-004', 'POLICY-RESERVE-001', 'POLICY-RESERVE-002', 'POLICY-RESERVE-003']);

  defineCase('policy-reservation-failure-conservation', () => {
    const oracle = numericOracle(scalar);
    oracle.admitWork({ workId: 'work-a', rootEpoch: '0' });
    oracle.reserveInFlight({ reservationId: 'reservation-a', workId: 'work-a', scope: { kind: 'work', id: 'work-a' }, magnitude: { units: '1' }, generation: '0' });
    oracle.abandonWork({ workId: 'work-a', reason: 'cancelled' });
    const accounting = oracle.assertAccounting();
    assert.deepEqual(accounting, {
      admitted: '1', activeOrPending: '0', backupInProgress: '0', completed: '0', failedOrAbandoned: '1',
      acquiredReservations: '1', releasedOrConvertedReservations: '1', outstandingReservations: '0',
    });
    assert.throws(() => oracle.releaseInFlight({ reservationId: 'reservation-a', reason: 'again' }), { code: 'POLICY_REFERENCE_RESERVATION_IMBALANCE' });
    return accounting;
  }, ['POLICY-RESERVE-004']);

  defineCase('policy-reservation-pressure', () => {
    const oracle = numericOracle(scalar, { admission: { maxReservations: '1' } });
    oracle.admitWork({ workId: 'work-a', rootEpoch: '0' });
    oracle.admitWork({ workId: 'work-b', rootEpoch: '0' });
    assert.equal(oracle.reserveInFlight({ reservationId: 'reservation-a', workId: 'work-a', scope: { kind: 'work', id: 'work-a' }, magnitude: { units: '1' }, generation: '0' }).kind, 'acquired');
    assert.deepEqual(oracle.reserveInFlight({ reservationId: 'reservation-b', workId: 'work-b', scope: { kind: 'work', id: 'work-b' }, magnitude: { units: '1' }, generation: '0' }), { kind: 'pressure', code: 'reservation-capacity' });
    assert.equal(oracle.assertAccounting().outstandingReservations, '1');
    return { pressure: 'reservation-capacity' };
  }, ['POLICY-RESERVE-005']);

  defineCase('policy-path-relation-after-identity', () => {
    const oracle = numericOracle(scalar);
    const partition = scalar.cycle.partitions[1];
    assert.throws(() => oracle.classifyPathResponse({ identityReady: false, domainRelationReady: true, partitionId: partition.id, pressure: null }), { code: 'POLICY_REFERENCE_CYCLE_ORDER' });
    assert.deepEqual(oracle.classifyPathResponse({ identityReady: true, domainRelationReady: false, partitionId: partition.id, pressure: null }), { kind: 'pending', code: 'required-input-unavailable' });
    assert.deepEqual(oracle.classifyPathResponse({ identityReady: true, domainRelationReady: true, partitionId: partition.id, pressure: 'path-depth-capacity' }), { kind: 'pressure', code: 'path-depth-capacity' });
    const semantic = oracle.classifyPathResponse({ identityReady: true, domainRelationReady: true, partitionId: partition.id, pressure: null });
    assert.equal(semantic.kind, 'semantic-response');
    assert.equal(semantic.response, partition.response);
    assert.deepEqual(semantic.contribution, partition.contribution);
    return { partition: partition.id, response: semantic.response };
  }, ['POLICY-CYCLE-001', 'POLICY-CYCLE-002', 'POLICY-CYCLE-003', 'POLICY-CYCLE-004']);

  defineCase('policy-vector-non-zero-sum-perspective', () => {
    assert.equal(vector.value.family, 'vector');
    assert.equal(vector.value.coordinates.length, 3);
    assert(vector.value.coordinates.every(({ perspective }) => perspective === 'objective-indexed'));
    assert.equal(vector.value.numeric.representation, 'fixed');
    assert.notEqual(vector.value.comparison.kind, 'total-order');
    return { coordinates: vector.value.coordinates.map(({ id }) => id) };
  });

  defineCase('policy-evaluator-mode-matrix', () => {
    assert.equal(scalar.evaluatorMode, 'absent');
    assert.equal(vector.evaluatorMode, 'combined');
    assert.equal(proposalOnly.evaluatorMode, 'proposal-only');
    assert.equal(proof.evaluatorMode, 'evaluation-only');
    assert(!scalar.programContribution.inputs.some(({ id }) => id.startsWith('evaluator.')));
    assert(proposalOnly.admission.sources.some(({ kind }) => kind === 'evaluator-proposal'));
    assert(!proposalOnly.value.adapters);
    assert(proof.value.adapters.some(({ kind }) => kind === 'evaluator'));
    return { modes: [scalar, vector, proposalOnly, proof].map(({ evaluatorMode }) => evaluatorMode) };
  });

  defineCase('policy-chance-custom-role', () => {
    const chance = vector.roleHandlers.find(({ category, terminal }) => category === 'chance' && !terminal);
    assert(chance, 'stochastic Policy profile must preserve a reachable chance role');
    assert.equal(chance.selectionMode, 'sample');
    assert.equal(chance.readiness, 'required');
    assert.equal(vector.selection.determinism, 'explicit-stochastic');
    assert.equal(vector.selection.randomness.kind, 'explicit-input');
    assert(BigInt(vector.selection.randomness.maxInputs) > 0n);
    assert.equal('actor' in chance, false);
    return { role: chance.role, selectionMode: chance.selectionMode, randomness: vector.selection.randomness.kind };
  });

  defineCase('policy-lazy-sampled-widening-and-proposal-ownership', () => {
    assert.equal(vector.admission.mode, 'sampled');
    assert(BigInt(vector.admission.bounds.maxWorkUnits) > 0n);
    assert(BigInt(vector.admission.bounds.maxRandomInputs) > 0n);
    const vectorProposal = vector.admission.sources.find(({ kind }) => kind === 'evaluator-proposal');
    assert(vectorProposal, 'combined Policy profile must retain evaluator proposal ownership');
    assert(vectorProposal.producerProfile.id.startsWith('evaluator.'));
    assert(BigInt(vectorProposal.maxCandidates) > 0n && BigInt(vectorProposal.maxBytes) > 0n);

    assert.equal(proposalOnly.admission.mode, 'lazy');
    assert.equal(proposalOnly.admission.sources.length, 1);
    const lazyProposal = proposalOnly.admission.sources[0];
    assert.equal(lazyProposal.kind, 'evaluator-proposal');
    assert(lazyProposal.producerProfile.id.startsWith('evaluator.'));
    assert(!proposalOnly.admission.sources.some(({ kind }) => kind === 'intrinsic-domain'));
    assert(BigInt(lazyProposal.maxCandidates) > 0n && BigInt(lazyProposal.maxBytes) > 0n);
    return { sampled: vectorProposal.id, lazy: lazyProposal.id };
  });

  defineCase('policy-no-ranked-output', () => {
    for (const profile of [scalar, vector, proposalOnly, proof]) {
      assert.equal('output' in profile, false);
      assert.equal('ranking' in profile, false);
      assert(!profile.ports.some(({ id }) => /rank|publish-output|external-result/.test(id)));
    }
    const oracle = numericOracle(scalar);
    oracle.requestStop({ cause: 'policy-budget-satisfied', ready: true });
    oracle.beginDrain();
    const terminal = oracle.terminalizeStop({ classification: 'complete' });
    assert.deepEqual(terminal, { kind: 'terminal', cause: 'policy-budget-satisfied', classification: 'complete' });
    assert.equal('payload' in terminal, false);
    assert.equal('ranking' in terminal, false);
    return { policyOwnsExternalRanking: false };
  });

  defineCase('policy-ordered-noncommutative-backup', () => {
    assert.equal(proof.backup.concurrencyOrder, 'deterministic-sequence');
    assert.notDeepEqual(proof.backup.sequence, { kind: 'none' });
    const record = visibleRecord(proof);
    const oracle = createPolicyOracle({
      profile: proof,
      transformContribution: ({ contribution, occurrence, sequence }) => ({ token: `${contribution.token}:${occurrence.occurrenceId}:${sequence}` }),
      applyRecordUpdate: ({ previous, contribution }) => ({ trace: [...previous.trace, contribution.token] }),
    });
    oracle.initializeRecord({ recordId: record.id, storageKey: 'target', generation: '0', value: { trace: [] } });
    oracle.admitWork({ workId: 'work-proof', rootEpoch: '0' });
    oracle.prepareBackup({ transactionId: 'backup-proof', workId: 'work-proof', rootEpoch: '0', sourceIdentity: { kind: 'proof', id: 'proof-a' }, contribution: { token: 'proof' }, occurrences: backupOccurrences(record), rootIndependent: false });
    oracle.applyBackupStep({ transactionId: 'backup-proof', occurrenceId: 'occurrence-0', rootEpoch: '0' });
    oracle.applyBackupStep({ transactionId: 'backup-proof', occurrenceId: 'occurrence-1', rootEpoch: '0' });
    oracle.completeBackup({ transactionId: 'backup-proof' });
    assert.deepEqual(oracle.readRecord({ recordId: record.id, storageKey: 'target' }), { trace: ['proof:occurrence-0:0', 'proof:occurrence-1:1'] });
    return { algebra: proof.backup.algebra, order: proof.backup.concurrencyOrder };
  }, ['POLICY-BACKUP-002', 'POLICY-BACKUP-003']);

  defineCase('policy-repeated-node-occurrence-backup', () => {
    const oracle = numericOracle(scalar);
    const record = initVisible(oracle, scalar);
    oracle.admitWork({ workId: 'work-a', rootEpoch: '0' });
    oracle.reserveInFlight({ reservationId: 'reservation-a', workId: 'work-a', scope: { kind: 'path', id: 'path-a' }, magnitude: { units: '1' }, generation: '0' });
    oracle.prepareBackup({ transactionId: 'backup-a', workId: 'work-a', rootEpoch: '0', sourceIdentity: { kind: 'ready-source', id: 'value-a' }, contribution: { delta: '2' }, occurrences: backupOccurrences(record), rootIndependent: false });
    assert.equal(oracle.applyBackupStep({ transactionId: 'backup-a', occurrenceId: 'occurrence-0', rootEpoch: '0' }).kind, 'applied');
    assert.equal(oracle.applyBackupStep({ transactionId: 'backup-a', occurrenceId: 'occurrence-0', rootEpoch: '0' }).kind, 'already-applied');
    assert.equal(oracle.applyBackupStep({ transactionId: 'backup-a', occurrenceId: 'occurrence-1', rootEpoch: '0' }).kind, 'applied');
    assert.deepEqual(oracle.readRecord({ recordId: record.id, storageKey: 'target' }), { total: '0' });
    oracle.completeBackup({ transactionId: 'backup-a' });
    assert.deepEqual(oracle.readRecord({ recordId: record.id, storageKey: 'target' }), { total: '4' });
    const accounting = oracle.assertAccounting();
    assert.equal(accounting.completed, '1');
    assert.equal(accounting.outstandingReservations, '0');
    return { accounting, value: oracle.readRecord({ recordId: record.id, storageKey: 'target' }) };
  }, ['POLICY-BACKUP-001', 'POLICY-BACKUP-002', 'POLICY-BACKUP-003', 'POLICY-BACKUP-004', 'POLICY-BACKUP-005']);

  defineCase('policy-backup-prefix-must-drain', () => {
    assert.equal(proof.backup.prefixVisibility, 'allowed');
    const record = visibleRecord(proof);
    const oracle = createPolicyOracle({
      profile: proof,
      transformContribution: ({ contribution }) => contribution,
      applyRecordUpdate: ({ previous, contribution }) => ({ total: (BigInt(previous.total) + BigInt(contribution.delta)).toString() }),
    });
    oracle.initializeRecord({ recordId: record.id, storageKey: 'target', generation: '0', value: { total: '0' } });
    oracle.admitWork({ workId: 'work-a', rootEpoch: '0' });
    oracle.prepareBackup({ transactionId: 'backup-a', workId: 'work-a', rootEpoch: '0', sourceIdentity: { kind: 'ready-source', id: 'proof-a' }, contribution: { delta: '1' }, occurrences: backupOccurrences(record), rootIndependent: false });
    const first = oracle.applyBackupStep({ transactionId: 'backup-a', occurrenceId: 'occurrence-0', rootEpoch: '0' });
    assert.equal(first.mustDrain, true);
    assert.deepEqual(oracle.readRecord({ recordId: record.id, storageKey: 'target' }), { total: '1' });
    assert.deepEqual(oracle.abandonWork({ workId: 'work-a', reason: 'cancelled' }), { kind: 'must-drain', transactionId: 'backup-a' });
    assert.throws(() => oracle.failBackup({ transactionId: 'backup-a', code: 'cancelled' }), { code: 'POLICY_REFERENCE_PARTIAL_BACKUP' });
    const cleanup = oracle.cleanup();
    assert.equal(cleanup.kind, 'quarantined');
    assert.equal(cleanup.quarantine.code, 'partial-backup-fatal');
    return cleanup;
  }, ['POLICY-RESERVE-006', 'POLICY-BACKUP-006', 'POLICY-BACKUP-007', 'POLICY-BACKUP-010']);

  defineCase('policy-stale-epoch-publication', () => {
    const oracle = numericOracle(scalar);
    const record = initVisible(oracle, scalar);
    oracle.setRootEpoch({ rootEpoch: '1' });
    oracle.admitWork({ workId: 'work-a', rootEpoch: '1' });
    oracle.prepareBackup({ transactionId: 'backup-a', workId: 'work-a', rootEpoch: '1', sourceIdentity: { kind: 'ready-source', id: 'value-a' }, contribution: { delta: '5' }, occurrences: backupOccurrences(record, 1), rootIndependent: false });
    oracle.advanceRoot({ fromEpoch: '1', toEpoch: '2', selectedOccurrence: 'child-a' });
    assert.deepEqual(oracle.applyBackupStep({ transactionId: 'backup-a', occurrenceId: 'occurrence-0', rootEpoch: '2' }), { kind: 'stale', code: 'backup-target-stale' });
    assert.deepEqual(oracle.readRecord({ recordId: record.id, storageKey: 'target' }), { total: '0' });
    return { currentEpoch: oracle.snapshot().currentRootEpoch };
  }, ['POLICY-BACKUP-008', 'POLICY-BACKUP-011', 'POLICY-REUSE-003']);

  defineCase('policy-statistics-overflow', () => {
    const record = visibleRecord(scalar);
    const oracle = createPolicyOracle({
      profile: scalar,
      transformContribution: ({ contribution }) => contribution,
      applyRecordUpdate: ({ previous, contribution }) => {
        const next = BigInt(previous.total) + BigInt(contribution.delta);
        if (next > 10n) {
          const error = new Error('statistics overflow');
          error.code = 'POLICY_REFERENCE_STATISTICS_OVERFLOW';
          throw error;
        }
        return { total: next.toString() };
      },
    });
    oracle.initializeRecord({ recordId: record.id, storageKey: 'target', generation: '0', value: { total: '10' } });
    oracle.admitWork({ workId: 'work-a', rootEpoch: '0' });
    oracle.prepareBackup({ transactionId: 'backup-a', workId: 'work-a', rootEpoch: '0', sourceIdentity: { kind: 'ready-source', id: 'value-a' }, contribution: { delta: '1' }, occurrences: backupOccurrences(record, 1), rootIndependent: false });
    assert.throws(() => oracle.applyBackupStep({ transactionId: 'backup-a', occurrenceId: 'occurrence-0', rootEpoch: '0' }), { code: 'POLICY_REFERENCE_STATISTICS_OVERFLOW' });
    assert.deepEqual(oracle.readRecord({ recordId: record.id, storageKey: 'target' }), { total: '10' });
    assert.deepEqual(oracle.snapshot().transactions[0].applied, []);
    return { preserved: true };
  }, ['POLICY-BACKUP-009']);

  defineCase('policy-first-stop-cause-drain', () => {
    const oracle = numericOracle(scalar);
    assert.deepEqual(oracle.requestStop({ cause: 'policy-budget-satisfied', ready: false }), { kind: 'pending', code: 'required-input-unavailable' });
    assert.deepEqual(oracle.requestStop({ cause: 'policy-budget-satisfied', ready: true }), { kind: 'stop-requested', cause: 'policy-budget-satisfied' });
    assert.deepEqual(oracle.requestStop({ cause: 'cancelled', ready: true }), { kind: 'stop-requested', cause: 'policy-budget-satisfied' });
    assert.deepEqual(oracle.admitWork({ workId: 'late-work', rootEpoch: '0' }), { kind: 'stop-requested', cause: 'policy-budget-satisfied' });
    oracle.beginDrain();
    const terminal = oracle.terminalizeStop({ classification: 'valid-partial' });
    assert.deepEqual(terminal, { kind: 'terminal', cause: 'policy-budget-satisfied', classification: 'valid-partial' });
    assert.equal(scalar.stop.externalControl, 'none');
    assert.equal('ranking' in terminal, false);
    return terminal;
  }, ['POLICY-STOP-001', 'POLICY-STOP-002', 'POLICY-STOP-003', 'POLICY-STOP-005', 'POLICY-STOP-006', 'POLICY-STOP-007']);

  defineCase('policy-schedule-bounded-overshoot', () => {
    const oracle = numericOracle(scalar);
    oracle.requestStop({ cause: 'policy-budget-satisfied', ready: true });
    assert.deepEqual(oracle.observeOvershoot({ completedAfterStop: scalar.stop.maxOvershoot }), { kind: 'bounded', completedAfterStop: scalar.stop.maxOvershoot });
    const excessive = numericOracle(scalar);
    excessive.requestStop({ cause: 'policy-budget-satisfied', ready: true });
    assert.throws(() => excessive.observeOvershoot({ completedAfterStop: (BigInt(scalar.stop.maxOvershoot) + 1n).toString() }), { code: 'POLICY_REFERENCE_STOP_OVERSHOOT' });
    assert.equal(excessive.cleanup().kind, 'quarantined');
    return { maximum: scalar.stop.maxOvershoot };
  }, ['POLICY-STOP-004']);

  defineCase('policy-advance-no-reclassification', () => {
    const oracle = numericOracle(scalar);
    oracle.setRootEpoch({ rootEpoch: '4' });
    const before = oracle.snapshot().reuseClassifications;
    const advanced = oracle.advanceRoot({ fromEpoch: '4', toEpoch: '5', selectedOccurrence: 'occurrence-selected' });
    assert.equal(before, '0');
    assert.equal(advanced.reuseClassifications, '0');
    assert.equal(oracle.snapshot().reuseClassifications, '0');
    return advanced;
  }, ['POLICY-REUSE-001', 'POLICY-REUSE-002', 'POLICY-REUSE-003']);

  defineCase('policy-reroot-explicit-reuse', () => {
    const oracle = numericOracle(scalar);
    for (const record of scalar.records) oracle.initializeRecord({ recordId: record.id, storageKey: `key-${record.id}`, generation: '0', value: { marker: record.scope } });
    oracle.setRootEpoch({ rootEpoch: '9' });
    const result = oracle.reroot({ fromEpoch: '9', toEpoch: '10', dispositions: rerootDispositions(scalar, true) });
    assert.equal(result.reuseClassifications, String(scalar.reuse.length));
    for (const declaration of scalar.reuse) {
      const entry = rerootDispositions(scalar, true).find(({ recordId }) => recordId === declaration.record);
      assert(entry);
      if (declaration.disposition === 'retain') assert.equal(entry.action, 'retain');
      if (declaration.disposition === 'retain-if-key-valid') assert.equal(entry.action, 'retain');
      if (declaration.disposition === 'reset') assert.equal(entry.action, 'reset');
    }
    return result;
  }, ['POLICY-REUSE-001', 'POLICY-REUSE-002', 'POLICY-REUSE-004']);

  defineCase('policy-generation-exhaustion', () => {
    const oracle = numericOracle(scalar);
    assert.deepEqual(oracle.advancePolicyGeneration({ current: '6', maximum: '7' }), { kind: 'advanced', generation: '7' });
    assert.deepEqual(oracle.advancePolicyGeneration({ current: '7', maximum: '7' }), { kind: 'exhausted', code: 'policy-generation-exhausted' });
    return { wrap: false };
  }, ['POLICY-REUSE-005']);

  defineCase('policy-cleanup-complete-disposition', () => {
    const oracle = numericOracle(scalar);
    const record = initVisible(oracle, scalar);
    oracle.admitWork({ workId: 'work-a', rootEpoch: '0' });
    oracle.reserveInFlight({ reservationId: 'reservation-a', workId: 'work-a', scope: { kind: 'work', id: 'work-a' }, magnitude: { units: '1' }, generation: '0' });
    oracle.prepareBackup({ transactionId: 'backup-a', workId: 'work-a', rootEpoch: '0', sourceIdentity: { kind: 'ready-source', id: 'value-a' }, contribution: { delta: '1' }, occurrences: backupOccurrences(record, 1), rootIndependent: false });
    oracle.applyBackupStep({ transactionId: 'backup-a', occurrenceId: 'occurrence-0', rootEpoch: '0' });
    oracle.completeBackup({ transactionId: 'backup-a' });
    const cleanup = oracle.cleanup();
    assert.equal(cleanup.kind, 'complete');
    assert.deepEqual(cleanup.dispositions.reservations, [{ id: 'reservation-a', state: 'converted' }]);
    assert.deepEqual(cleanup.dispositions.transactions, [{ id: 'backup-a', state: 'complete' }]);
    assert.equal(cleanup.accounting.completed, '1');
    return cleanup;
  }, ['POLICY-CLEANUP-001']);

  defineCase('policy-cleanup-quarantine', () => {
    const oracle = numericOracle(scalar, { mutations: { skipReservationDispositionOnComplete: true } });
    const record = initVisible(oracle, scalar);
    oracle.admitWork({ workId: 'work-a', rootEpoch: '0' });
    oracle.reserveInFlight({ reservationId: 'reservation-a', workId: 'work-a', scope: { kind: 'work', id: 'work-a' }, magnitude: { units: '1' }, generation: '0' });
    oracle.prepareBackup({ transactionId: 'backup-a', workId: 'work-a', rootEpoch: '0', sourceIdentity: { kind: 'ready-source', id: 'value-a' }, contribution: { delta: '1' }, occurrences: backupOccurrences(record, 1), rootIndependent: false });
    oracle.applyBackupStep({ transactionId: 'backup-a', occurrenceId: 'occurrence-0', rootEpoch: '0' });
    oracle.completeBackup({ transactionId: 'backup-a' });
    const cleanup = oracle.cleanup();
    assert.equal(cleanup.kind, 'quarantined');
    assert.equal(cleanup.quarantine.code, 'cleanup-obligation-remains');
    assert.equal(cleanup.quarantine.evidenceValid, false);
    return cleanup;
  }, ['POLICY-CLEANUP-002', 'POLICY-BACKUP-010']);

  defineCase('policy-oracle-sensitivity-backup', () => {
    const normal = numericOracle(scalar);
    normal.admitWork({ workId: 'normal', rootEpoch: '0' });
    normal.reserveInFlight({ reservationId: 'reservation-normal', workId: 'normal', scope: { kind: 'work', id: 'normal' }, magnitude: { units: '1' }, generation: '0' });
    assert.equal(normal.snapshot().accounting.completed, '0');

    const reservationMutant = numericOracle(scalar, { mutations: { countReservationAsCompleted: true } });
    reservationMutant.admitWork({ workId: 'mutant', rootEpoch: '0' });
    reservationMutant.reserveInFlight({ reservationId: 'reservation-mutant', workId: 'mutant', scope: { kind: 'work', id: 'mutant' }, magnitude: { units: '1' }, generation: '0' });
    assert.equal(reservationMutant.snapshot().accounting.completed, '1');

    const record = visibleRecord(scalar);
    const duplicateMutant = numericOracle(scalar, { mutations: { allowDuplicateBackup: true } });
    duplicateMutant.initializeRecord({ recordId: record.id, storageKey: 'target', generation: '0', value: { total: '0' } });
    duplicateMutant.admitWork({ workId: 'dup', rootEpoch: '0' });
    duplicateMutant.prepareBackup({ transactionId: 'backup-dup', workId: 'dup', rootEpoch: '0', sourceIdentity: { kind: 'ready-source', id: 'value-a' }, contribution: { delta: '1' }, occurrences: backupOccurrences(record, 1), rootIndependent: false });
    duplicateMutant.applyBackupStep({ transactionId: 'backup-dup', occurrenceId: 'occurrence-0', rootEpoch: '0' });
    duplicateMutant.applyBackupStep({ transactionId: 'backup-dup', occurrenceId: 'occurrence-0', rootEpoch: '0' });
    assert.deepEqual(duplicateMutant.readRecord({ recordId: record.id, storageKey: 'target' }), { total: '0' });
    duplicateMutant.completeBackup({ transactionId: 'backup-dup' });
    assert.deepEqual(duplicateMutant.readRecord({ recordId: record.id, storageKey: 'target' }), { total: '2' });
    return { reservationMutantDetected: true, duplicateBackupMutantDetected: true };
  });
}

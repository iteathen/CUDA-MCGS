import assert from 'node:assert/strict';

import { createGraphReclaimOracle } from './graph-reclaim.mjs';

function profileById(projection, id) {
  const entry = projection.profiles.find((candidate) => candidate.id === id);
  assert(entry, `missing Graph profile ${id}`);
  return entry.normalized;
}

function reclamationProfile(projection) {
  return profileById(projection, 'graph.synthetic-reclaiming');
}

function noReclamationProfile(projection) {
  return profileById(projection, 'graph.synthetic-transposing');
}

function domainStateRegion(profile) {
  const region = profile.ownerRegions.find(({ semanticRole }) => semanticRole === 'domain-state');
  assert(region, 'reclaiming profile must expose a domain-state owner region');
  return region;
}

function blockers(profile, overrides = {}) {
  return Object.fromEntries(profile.reclamation.protectionSources.map((source) => [source, overrides[source] ?? '0']));
}

function object(profile, slot, {
  generation = '0',
  transpositionKey = `tt.${slot}`,
  blockerOverrides = {},
  ownerRegionId = null,
  ownerRecord = {},
} = {}) {
  return {
    reference: { kind: 'state-node', arena: '0', slot: String(slot), generation },
    transpositionKey,
    blockers: profile.reclamation.kind === 'enabled' ? blockers(profile, blockerOverrides) : {},
    ownerRegionId,
    ownerRecord,
  };
}

function fullProof(oracle, profile, reference) {
  return oracle.proveQuiescent({
    reference,
    workUnits: String(profile.reclamation.protectionSources.length),
    scratchBytes: '1',
  });
}

function snapshotObject(oracle, slot) {
  return oracle.snapshot().objects.find(({ reference }) => reference.slot === String(slot));
}

export function registerGraphReclaimCases({
  defineCase,
  fixture,
  projection,
  nodeEvidence,
  edgeEvidence,
  refEvidence,
  pathEvidence,
  rootControl,
  rootEvidence,
  plannedCoverage,
}) {
  defineCase('graph-reclaim-profile-and-upstream-evidence-exact', () => {
    assert.deepEqual(projection.projectionIdentity, {
      algorithm: fixture.profileProjection.algorithm,
      byteLength: fixture.profileProjection.byteLength,
      sha256: fixture.profileProjection.sha256,
    });
    assert.deepEqual(nodeEvidence.evidenceIdentity, fixture.nodeEvidence);
    assert.deepEqual(edgeEvidence.evidenceIdentity, fixture.edgeEvidence);
    assert.deepEqual(refEvidence.evidenceIdentity, fixture.refEvidence);
    assert.deepEqual(pathEvidence.evidenceIdentity, fixture.pathEvidence);
    assert.deepEqual(rootControl.identity, fixture.rootControlProjection);
    assert.deepEqual(rootEvidence.evidenceIdentity, fixture.rootEvidence);
    for (const evidence of [nodeEvidence, edgeEvidence, refEvidence, pathEvidence, rootEvidence]) assert.equal(evidence.status, 'pass');
    return {
      projection: fixture.profileProjection.sha256,
      node: fixture.nodeEvidence.sha256,
      edge: fixture.edgeEvidence.sha256,
      ref: fixture.refEvidence.sha256,
      path: fixture.pathEvidence.sha256,
      root: fixture.rootEvidence.sha256,
    };
  });

  defineCase('graph-reclaim-none-zero-semantic-residue', () => {
    const profile = noReclamationProfile(projection);
    const seed = object(profile, 1);
    const oracle = createGraphReclaimOracle({ profile, initialObjects: [seed] });
    const before = oracle.snapshot();
    const result = oracle.retire({ reference: seed.reference });
    const after = oracle.snapshot();
    assert.deepEqual(result, { kind: 'retained', disposition: 'retain-until-arena-teardown' });
    assert.equal(Object.hasOwn(after, 'retirementRecords'), false);
    assert.equal(Object.hasOwn(after, 'limits'), false);
    assert.equal(Object.hasOwn(after, 'protectionSources'), false);
    assert.deepEqual(after.objects, before.objects);
    assert.deepEqual(oracle.nativeQualification(), {
      kind: 'not-qualified',
      requiredEvidence: 'native-compatible-pair-qualification',
      semanticEvidenceOnly: true,
    });
    return { disposition: result.disposition, reclaimResidue: false };
  }, ['GRAPH-RECLAIM-001']);

  defineCase('graph-reclaim-enabled-profile-declares-complete-finite-contract', () => {
    const profile = reclamationProfile(projection);
    assert.equal(profile.reclamation.kind, 'enabled');
    assert.deepEqual(profile.reclamation.protectionSources, ['root-anchor', 'active-path', 'in-flight', 'publication-waiter', 'owner-lease', 'retained-borrow']);
    assert.equal(profile.reclamation.transpositionRemoval, 'non-returnable-tombstone');
    assert.equal(profile.reclamation.generationAdvance, 'before-slot-reuse');
    assert.equal(profile.reclamation.maxWorkUnits, '4096');
    assert.equal(profile.reclamation.maxScratchBytes, '65536');
    for (const id of ['retire', 'prove-quiescent', 'reclaim']) assert(profile.ports.some((port) => port.id === id));
    for (const suffix of ['resource-retirement-records', 'resource-retirement-bytes', 'resource-reclaim-scratch', 'resource-reclaim-work']) {
      assert(profile.resources.some(({ id }) => id.endsWith(suffix)), `missing ${suffix}`);
    }
    for (const code of ['retirement-capacity', 'reclamation-scratch-capacity', 'reclamation-not-quiescent']) {
      assert(profile.failures.some((failure) => failure.code === code), `missing ${code}`);
    }
    return {
      protectionSources: profile.reclamation.protectionSources,
      maxWorkUnits: profile.reclamation.maxWorkUnits,
      maxScratchBytes: profile.reclamation.maxScratchBytes,
    };
  }, ['GRAPH-RECLAIM-002']);

  defineCase('graph-reclaim-retirement-preserves-old-protection-and-blocks-new-access', () => {
    const profile = reclamationProfile(projection);
    const seed = object(profile, 2, { blockerOverrides: { 'root-anchor': '1' } });
    const oracle = createGraphReclaimOracle({ profile, initialObjects: [seed] });
    assert.equal(oracle.lookupTransposition({ key: seed.transpositionKey }).kind, 'found');
    assert.equal(oracle.retire({ reference: seed.reference }).kind, 'retiring');
    const retiringLookup = oracle.lookupTransposition({ key: seed.transpositionKey });
    assert.equal(retiringLookup.kind, 'retiring');
    assert.equal(retiringLookup.state, 'retiring');
    assert.deepEqual(oracle.admitAccess({ reference: seed.reference, source: 'active-path' }), {
      kind: 'blocked', code: 'retiring', state: 'retiring',
    });
    const blocked = fullProof(oracle, profile, seed.reference);
    assert.equal(blocked.kind, 'blocked');
    assert.equal(blocked.source, 'root-anchor');
    assert.equal(blocked.count, '1');
    assert.equal(oracle.releaseAccess({ reference: seed.reference, source: 'root-anchor' }).kind, 'released');
    assert.equal(fullProof(oracle, profile, seed.reference).kind, 'quiescent');
    return { oldProtectionSurvived: true, newAccessBlocked: true, readerState: retiringLookup.state };
  }, ['GRAPH-RECLAIM-002', 'GRAPH-RECLAIM-003']);

  defineCase('graph-reclaim-retirement-capacity-fails-atomically', () => {
    const profile = reclamationProfile(projection);
    const first = object(profile, 3);
    const second = object(profile, 4);
    const oracle = createGraphReclaimOracle({ profile, initialObjects: [first, second], admission: { retirementRecords: '1' } });
    assert.equal(oracle.retire({ reference: first.reference }).kind, 'retiring');
    assert.deepEqual(oracle.retire({ reference: second.reference }), { kind: 'pressure', code: 'retirement-capacity' });
    const secondState = snapshotObject(oracle, 4);
    assert.equal(secondState.state, 'ready');
    assert.equal(secondState.reference.generation, '0');
    assert.equal(oracle.lookupTransposition({ key: second.transpositionKey }).kind, 'found');
    assert.equal(oracle.snapshot().retirementRecords.length, 1);
    return { pressure: 'retirement-capacity', partialMutation: false };
  }, ['GRAPH-RECLAIM-002', 'GRAPH-RECLAIM-008']);

  defineCase('graph-reclaim-quiescence-rejects-each-declared-protection-source', () => {
    const profile = reclamationProfile(projection);
    const observed = [];
    profile.reclamation.protectionSources.forEach((source, index) => {
      const seed = object(profile, 10 + index, { blockerOverrides: { [source]: '1' } });
      const oracle = createGraphReclaimOracle({ profile, initialObjects: [seed] });
      assert.equal(oracle.retire({ reference: seed.reference }).kind, 'retiring');
      const blocked = fullProof(oracle, profile, seed.reference);
      assert.equal(blocked.kind, 'blocked');
      assert.equal(blocked.code, 'reclamation-not-quiescent');
      assert.equal(blocked.source, source);
      assert.equal(blocked.count, '1');
      observed.push(source);
    });
    assert.deepEqual(observed, profile.reclamation.protectionSources);
    return { rejectedProtectionSources: observed };
  }, ['GRAPH-RECLAIM-004']);

  defineCase('graph-reclaim-incremental-proof-is-finite-device-owned-and-resumable', () => {
    const profile = reclamationProfile(projection);
    const seed = object(profile, 20);
    const oracle = createGraphReclaimOracle({ profile, initialObjects: [seed], admission: { workUnits: '1', scratchBytes: '1' } });
    assert.equal(oracle.retire({ reference: seed.reference }).kind, 'retiring');
    const outcomes = [];
    for (let index = 0; index < profile.reclamation.protectionSources.length; index += 1) {
      const outcome = oracle.proveQuiescent({ reference: seed.reference, workUnits: '1', scratchBytes: '1' });
      outcomes.push(outcome);
      if (index < profile.reclamation.protectionSources.length - 1) {
        assert.equal(outcome.kind, 'pending');
        assert.equal(outcome.progressOwner, 'device');
        assert.equal(outcome.releasesWorker, true);
        assert.equal(outcome.hostObservationRequired, false);
      } else {
        assert.equal(outcome.kind, 'quiescent');
      }
    }
    assert.equal(oracle.proveQuiescent({ reference: seed.reference, workUnits: '2', scratchBytes: '1' }).kind, 'pressure');
    assert.equal(oracle.proveQuiescent({ reference: seed.reference, workUnits: '1', scratchBytes: '2' }).kind, 'pressure');
    return { steps: outcomes.length, finiteResumable: true, progressOwner: 'device' };
  }, ['GRAPH-RECLAIM-007']);

  defineCase('graph-reclaim-quiescence-proof-restarts-after-protection-epoch-change', () => {
    const profile = reclamationProfile(projection);
    const lateSource = profile.reclamation.protectionSources.at(-1);
    const seed = object(profile, 21, { blockerOverrides: { [lateSource]: '1' } });
    const oracle = createGraphReclaimOracle({ profile, initialObjects: [seed], admission: { workUnits: '1', scratchBytes: '1' } });
    assert.equal(oracle.retire({ reference: seed.reference }).kind, 'retiring');
    const first = oracle.proveQuiescent({ reference: seed.reference, workUnits: '1', scratchBytes: '1' });
    assert.equal(first.kind, 'pending');
    assert.equal(first.cursor, '1');
    assert.equal(oracle.releaseAccess({ reference: seed.reference, source: lateSource }).kind, 'released');
    const restarted = oracle.proveQuiescent({ reference: seed.reference, workUnits: '1', scratchBytes: '1' });
    assert.equal(restarted.kind, 'pending');
    assert.equal(restarted.cursor, '1', 'proof must restart rather than continuing from stale protection epoch');
    const restartEvents = oracle.snapshot().events.filter(({ type }) => type === 'quiescence-proof-restarted');
    assert.equal(restartEvents.length, 1);
    let outcome = restarted;
    while (outcome.kind === 'pending') outcome = oracle.proveQuiescent({ reference: seed.reference, workUnits: '1', scratchBytes: '1' });
    assert.equal(outcome.kind, 'quiescent');
    return { restartedAtCursor: restarted.cursor, staleProofRejected: true };
  }, ['GRAPH-RECLAIM-004', 'GRAPH-RECLAIM-007']);

  defineCase('graph-reclaim-transposition-tombstone-precedes-reuse', () => {
    const profile = reclamationProfile(projection);
    const seed = object(profile, 22, { ownerRegionId: null });
    const oracle = createGraphReclaimOracle({ profile, initialObjects: [seed] });
    assert.equal(oracle.lookupTransposition({ key: seed.transpositionKey }).kind, 'found');
    assert.equal(oracle.retire({ reference: seed.reference }).kind, 'retiring');
    assert.equal(oracle.lookupTransposition({ key: seed.transpositionKey }).kind, 'retiring');
    const proof = fullProof(oracle, profile, seed.reference);
    assert.equal(proof.kind, 'quiescent');
    assert.equal(proof.transposition, 'tombstone');
    assert.deepEqual(oracle.lookupTransposition({ key: seed.transpositionKey }), { kind: 'miss', tombstone: true });
    assert.equal(oracle.reclaim({ reference: seed.reference }).kind, 'reclaimed');
    const reused = oracle.reuseSlot({
      kind: 'state-node', arena: '0', slot: '22', transpositionKey: 'tt.22.reused', blockers: blockers(profile), ownerRegionId: null, ownerRecord: {},
    });
    assert.equal(reused.kind, 'reused');
    assert.equal(reused.reference.generation, '1');
    assert.equal(oracle.lookupTransposition({ key: seed.transpositionKey }).kind, 'miss');
    const replacement = oracle.lookupTransposition({ key: 'tt.22.reused' });
    assert.equal(replacement.kind, 'found');
    assert.equal(replacement.reference.generation, '1');
    return { tombstoneBeforeReuse: true, replacementGeneration: replacement.reference.generation };
  }, ['GRAPH-RECLAIM-005']);

  defineCase('graph-reclaim-owner-cleanup-precedes-storage-release', () => {
    const profile = reclamationProfile(projection);
    const region = domainStateRegion(profile);
    const secret = { bytes: [8, 5, 3], meaning: 'owner-only' };
    let calls = 0;
    const seed = object(profile, 23, { ownerRegionId: region.id, ownerRecord: secret });
    const oracle = createGraphReclaimOracle({
      profile,
      initialObjects: [seed],
      ownerCleanup: ({ regionId, record }) => {
        calls += 1;
        assert.equal(regionId, region.id);
        assert.deepEqual(record, secret);
        return { status: calls === 1 ? 'pending' : 'ready' };
      },
    });
    oracle.retire({ reference: seed.reference });
    assert.equal(fullProof(oracle, profile, seed.reference).kind, 'quiescent');
    assert.deepEqual(oracle.reclaim({ reference: seed.reference }), { kind: 'pending-owner-cleanup', state: 'reclaimable' });
    let snapshot = oracle.snapshot();
    assert.equal(snapshotObject(oracle, 23).state, 'reclaimable');
    assert.equal(snapshot.retirementRecords[0].state, 'ready');
    assert.equal(snapshot.objects[0].reference.generation, '0');
    assert.equal(JSON.stringify(snapshot).includes('owner-only'), false);
    assert.equal(oracle.reclaim({ reference: seed.reference }).kind, 'reclaimed');
    snapshot = oracle.snapshot();
    assert.equal(snapshotObject(oracle, 23).state, 'free');
    assert.equal(snapshot.retirementRecords[0].state, 'free');
    assert.equal(calls, 2);
    return { cleanupCalls: calls, releasedAfterCleanup: true, opaqueOwnerRecord: true };
  }, ['GRAPH-RECLAIM-006']);

  defineCase('graph-reclaim-generation-advances-before-slot-reuse', () => {
    const profile = reclamationProfile(projection);
    const seed = object(profile, 24);
    const oracle = createGraphReclaimOracle({ profile, initialObjects: [seed] });
    oracle.retire({ reference: seed.reference });
    fullProof(oracle, profile, seed.reference);
    const reclaimed = oracle.reclaim({ reference: seed.reference });
    assert.equal(reclaimed.kind, 'reclaimed');
    assert.equal(reclaimed.nextGeneration, '1');
    const reused = oracle.reuseSlot({
      kind: 'state-node', arena: '0', slot: '24', transpositionKey: 'tt.24.next', blockers: blockers(profile), ownerRegionId: null, ownerRecord: {},
    });
    assert.equal(reused.reference.generation, '1');
    assert.deepEqual(oracle.retire({ reference: seed.reference }), { kind: 'invalid', code: 'stale-reference' });
    assert.equal(oracle.lookupTransposition({ key: 'tt.24.next' }).reference.generation, '1');
    return { oldGeneration: '0', reuseGeneration: '1', staleOldReference: true };
  }, ['GRAPH-RECLAIM-005', 'GRAPH-RECLAIM-006']);

  defineCase('graph-reclaim-retirement-record-reuses-without-capacity-leak', () => {
    const profile = reclamationProfile(projection);
    const first = object(profile, 25);
    const second = object(profile, 26);
    const oracle = createGraphReclaimOracle({ profile, initialObjects: [first, second], admission: { retirementRecords: '1' } });
    const firstRetirement = oracle.retire({ reference: first.reference });
    fullProof(oracle, profile, first.reference);
    oracle.reclaim({ reference: first.reference });
    const secondRetirement = oracle.retire({ reference: second.reference });
    assert.equal(secondRetirement.kind, 'retiring');
    assert.equal(secondRetirement.retirementRecord.id, firstRetirement.retirementRecord.id);
    assert.equal(secondRetirement.retirementRecord.generation, '1');
    assert.equal(oracle.snapshot().retirementRecords.length, 1);
    return { recordId: secondRetirement.retirementRecord.id, reusedGeneration: secondRetirement.retirementRecord.generation, capacityLeak: false };
  }, ['GRAPH-RECLAIM-002', 'GRAPH-RECLAIM-008']);

  defineCase('graph-reclaim-cancellation-leaves-valid-quarantine-and-resumes', () => {
    const profile = reclamationProfile(projection);
    const seed = object(profile, 27);
    const oracle = createGraphReclaimOracle({ profile, initialObjects: [seed] });
    oracle.retire({ reference: seed.reference });
    const cancelled = oracle.cancelRetirement({ reference: seed.reference });
    assert.equal(cancelled.kind, 'quarantined');
    assert.equal(cancelled.reference.generation, '0');
    assert.equal(oracle.lookupTransposition({ key: seed.transpositionKey }).kind, 'retiring');
    let snapshot = oracle.snapshot();
    assert.equal(snapshotObject(oracle, 27).state, 'quarantined');
    assert.equal(snapshot.retirementRecords[0].state, 'ready');
    assert.equal(oracle.proveQuiescent({ reference: seed.reference, workUnits: '1', scratchBytes: '1' }).kind, 'quarantined');
    assert.equal(oracle.resumeRetirement({ reference: seed.reference }).kind, 'retiring');
    assert.equal(fullProof(oracle, profile, seed.reference).kind, 'quiescent');
    assert.equal(oracle.reclaim({ reference: seed.reference }).kind, 'reclaimed');
    snapshot = oracle.snapshot();
    assert.equal(snapshotObject(oracle, 27).state, 'free');
    assert.equal(snapshotObject(oracle, 27).reference.generation, '1');
    return { quarantineStable: true, recovered: true };
  }, ['GRAPH-RECLAIM-008']);

  defineCase('graph-reclaim-owner-failure-quarantines-without-half-reuse', () => {
    const profile = reclamationProfile(projection);
    const region = domainStateRegion(profile);
    let calls = 0;
    const seed = object(profile, 28, { ownerRegionId: region.id, ownerRecord: { opaque: 42 } });
    const oracle = createGraphReclaimOracle({
      profile,
      initialObjects: [seed],
      ownerCleanup: () => ({ status: ++calls === 1 ? 'failed' : 'ready' }),
    });
    oracle.retire({ reference: seed.reference });
    fullProof(oracle, profile, seed.reference);
    const failed = oracle.reclaim({ reference: seed.reference });
    assert.equal(failed.kind, 'quarantined');
    assert.equal(failed.code, 'owner-lifecycle-failure');
    let snapshot = oracle.snapshot();
    assert.equal(snapshotObject(oracle, 28).state, 'quarantined');
    assert.equal(snapshotObject(oracle, 28).reference.generation, '0');
    assert.equal(snapshot.retirementRecords[0].state, 'ready');
    assert.deepEqual(oracle.lookupTransposition({ key: seed.transpositionKey }), { kind: 'miss', tombstone: true });
    oracle.resumeRetirement({ reference: seed.reference });
    fullProof(oracle, profile, seed.reference);
    assert.equal(oracle.reclaim({ reference: seed.reference }).kind, 'reclaimed');
    snapshot = oracle.snapshot();
    assert.equal(snapshotObject(oracle, 28).reference.generation, '1');
    return { quarantinedBeforeReuse: true, recoveredAfterOwnerReady: true };
  }, ['GRAPH-RECLAIM-006', 'GRAPH-RECLAIM-008']);

  defineCase('graph-reclaim-shared-transposed-node-remains-blocked-by-retained-borrow', () => {
    const profile = reclamationProfile(projection);
    const seed = object(profile, 29, { blockerOverrides: { 'retained-borrow': '1' } });
    const oracle = createGraphReclaimOracle({ profile, initialObjects: [seed] });
    oracle.retire({ reference: seed.reference });
    const blocked = fullProof(oracle, profile, seed.reference);
    assert.equal(blocked.kind, 'blocked');
    assert.equal(blocked.source, 'retained-borrow');
    assert.equal(oracle.lookupTransposition({ key: seed.transpositionKey }).kind, 'retiring');
    assert.equal(oracle.releaseAccess({ reference: seed.reference, source: 'retained-borrow' }).kind, 'released');
    assert.equal(fullProof(oracle, profile, seed.reference).kind, 'quiescent');
    assert.deepEqual(oracle.lookupTransposition({ key: seed.transpositionKey }), { kind: 'miss', tombstone: true });
    return { sharedBorrowProtected: true, reclaimedOnlyAfterRelease: true };
  }, ['GRAPH-RECLAIM-003', 'GRAPH-RECLAIM-004']);

  defineCase('graph-reclaim-semantic-reference-does-not-qualify-native-mechanism', () => {
    const profile = reclamationProfile(projection);
    const oracle = createGraphReclaimOracle({ profile });
    const qualification = oracle.nativeQualification();
    assert.deepEqual(qualification, {
      kind: 'not-qualified',
      requiredEvidence: 'native-compatible-pair-qualification',
      semanticEvidenceOnly: true,
    });
    assert.equal(JSON.stringify(oracle.snapshot()).includes('cuda'), false);
    return qualification;
  }, ['GRAPH-RECLAIM-009']);

  defineCase('graph-reclaim-requirement-coverage-exact', () => {
    const coverage = plannedCoverage();
    assert.equal(coverage.requirementCount, 9);
    assert.deepEqual(coverage.requirements.map(({ id }) => id), [
      'GRAPH-RECLAIM-001', 'GRAPH-RECLAIM-002', 'GRAPH-RECLAIM-003',
      'GRAPH-RECLAIM-004', 'GRAPH-RECLAIM-005', 'GRAPH-RECLAIM-006',
      'GRAPH-RECLAIM-007', 'GRAPH-RECLAIM-008', 'GRAPH-RECLAIM-009',
    ]);
    assert(coverage.requirements.every(({ cases }) => cases.length > 0));
    return coverage;
  });
}

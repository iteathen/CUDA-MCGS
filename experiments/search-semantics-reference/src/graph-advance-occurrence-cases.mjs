import assert from 'node:assert/strict';

import { canonicalClone } from './canonical.mjs';
import { createGraphPathOracle } from './graph-path.mjs';
import { createGraphReferenceOracle } from './graph-ref.mjs';
import { createGraphRootOracle } from './graph-root.mjs';
import { createGraphReclaimOracle } from './graph-reclaim.mjs';

function profileById(projection, id = 'graph.synthetic-reclaiming') {
  const entry = projection.profiles.find((candidate) => candidate.id === id);
  assert(entry, `missing Graph profile ${id}`);
  return entry.normalized;
}

function readyState(profile, role) {
  const object = profile.objectKinds.find((candidate) => candidate.role === role);
  assert(object, `missing ${role}`);
  return object.lifecycle.readyStates.at(-1);
}

function keyOf({ kind, arena, slot }) {
  return `${kind}\0${arena}\0${slot}`;
}

function sameReference(left, right) {
  return left?.kind === right.kind
    && left?.arena === right.arena
    && left?.slot === right.slot
    && left?.generation === right.generation;
}

function ownerRecordsForPath(profile) {
  return profile.ownerRegions
    .filter(({ objectKind }) => objectKind === profile.path.occurrenceObject)
    .map(({ id }) => ({ regionId: id, record: {} }));
}

function blockerRecord(profile, overrides = {}) {
  return Object.fromEntries(profile.reclamation.protectionSources.map((source) => [source, overrides[source] ?? '0']));
}

function heldProtections(ref, reference) {
  return ref.snapshot().protections.filter(({ state, reference: held }) => state === 'held' && sameReference(held, reference));
}

function assertAdvanceControl(rootControl) {
  const profile = rootControl.advance.profile;
  assert.equal(rootControl.advance.kind, 'selected');
  assert.equal(profile.realizedTransitionRequired, true);
  assert.equal(profile.successorReadyRequired, true);
  assert.equal(profile.existingResourcesOnly, true);
  assert.equal(profile.graphTraversal, 'none');
  assert.equal(profile.semanticStateCopy, 'none');
  assert.equal(profile.stateTransform, 'none');
  assert.equal(profile.reset, 'none');
  assert.equal(profile.resize, 'none');
  assert.equal(profile.reclassification, 'none');
  assert.equal(profile.reclamation, 'none');
  assert.equal(profile.eagerCleanup, 'none');
  assert.equal(profile.selectedDescendantWork, 'preserve-compatible');
  assert.equal(profile.siblingOccurrenceWork, 'superseded-by-advance-lazy');
  assert.equal(profile.sharedTransposedNode, 'occurrence-supersession-does-not-invalidate-node');
  assert.equal(profile.hostProgress, 'none');
  return profile;
}

function createHarness(profile) {
  const staticSlots = new Map();
  let path = null;
  let root = null;
  const resolveSlotState = (request) => {
    const pathState = path?.resolveSlotState(request);
    if (pathState !== null && pathState !== undefined) return pathState;
    const rootState = root?.resolveSlotState(request);
    if (rootState !== null && rootState !== undefined) return rootState;
    const entry = staticSlots.get(keyOf(request));
    return entry === undefined ? null : canonicalClone(entry);
  };

  const ref = createGraphReferenceOracle({ profile, resolveSlotState });
  path = createGraphPathOracle({
    profile,
    validateReference: ref.validateReference,
    nextGeneration: ref.nextGeneration,
    acquireProtection: ref.acquireProtection,
    releaseProtection: ref.releaseProtection,
    resolveChild: (candidate) => candidate,
    classifyPathRelation: (left, right) => JSON.stringify(left) === JSON.stringify(right)
      ? 'domain.relation-equal'
      : 'domain.relation-distinct',
    ownerOccurrenceLifecycle: () => ({ status: 'ready' }),
  });
  root = createGraphRootOracle({
    profile,
    validateReference: ref.validateReference,
    nextGeneration: ref.nextGeneration,
    acquireProtection: ref.acquireProtection,
    releaseProtection: ref.releaseProtection,
    ownerRerootLifecycle: () => ({ status: 'ready' }),
  });

  function addReady(kind, slot, generation = '0') {
    const reference = { kind, arena: '0', slot: String(slot), generation };
    staticSlots.set(keyOf(reference), { ...reference, lifecycleState: readyState(profile, kind) });
    return reference;
  }

  function setGeneration(reference, generation) {
    const key = keyOf(reference);
    const current = staticSlots.get(key);
    assert(current, `missing static slot ${key}`);
    staticSlots.set(key, { ...current, generation });
  }

  return { ref, path, root, addReady, setGeneration, staticSlots };
}

function appendSharedOccurrence(scenario, pathReference, label) {
  return scenario.harness.path.appendPathOccurrence({
    pathReference,
    edgeReference: null,
    candidate: { nodeReference: scenario.sharedNode, relationView: { occurrence: label } },
    ownerRecords: ownerRecordsForPath(scenario.profile),
  });
}

function createScenario(projection) {
  const profile = profileById(projection);
  const harness = createHarness(profile);
  const oldRootNode = harness.addReady('state-node', '40');
  const sharedNode = harness.addReady('state-node', '41');

  const oldRoot = harness.root.protectRootAnchor({ nodeReference: oldRootNode, owner: 'session.root-old' });
  assert.equal(oldRoot.kind, 'protected-anchor');

  const selectedPath = harness.path.openPath();
  const siblingPath = harness.path.openPath();
  assert.equal(selectedPath.kind, 'opened');
  assert.equal(siblingPath.kind, 'opened');
  const selectedOccurrence = appendSharedOccurrence({ profile, harness, sharedNode }, selectedPath.reference, 'selected');
  const siblingOccurrence = appendSharedOccurrence({ profile, harness, sharedNode }, siblingPath.reference, 'sibling');
  assert.equal(selectedOccurrence.kind, 'appended');
  assert.equal(siblingOccurrence.kind, 'appended');
  assert.deepEqual(selectedOccurrence.nodeReference, siblingOccurrence.nodeReference);

  const siblingWork = harness.ref.acquireProtection({ expectedKind: 'state-node', owner: 'old-epoch.sibling-work', reference: sharedNode });
  const retainedBorrow = harness.ref.acquireProtection({ expectedKind: 'state-node', owner: 'retained-observation-borrow', reference: sharedNode });
  assert.equal(siblingWork.kind, 'protected');
  assert.equal(retainedBorrow.kind, 'protected');
  assert.equal(heldProtections(harness.ref, sharedNode).length, 4);

  const reclaim = createGraphReclaimOracle({
    profile,
    initialObjects: [{
      reference: sharedNode,
      transpositionKey: 'tt.shared.advance',
      blockers: blockerRecord(profile, { 'active-path': '2', 'in-flight': '1', 'retained-borrow': '1' }),
      ownerRegionId: null,
      ownerRecord: {},
    }],
  });

  return {
    profile,
    harness,
    reclaim,
    oldRootNode,
    sharedNode,
    oldRoot,
    selectedPath,
    siblingPath,
    selectedOccurrence,
    siblingOccurrence,
    siblingWork,
    retainedBorrow,
    currentRoot: oldRoot.anchorReference,
    rootEpoch: '0',
    newRoot: null,
  };
}

function commitAdvance(scenario, rootControl) {
  const control = assertAdvanceControl(rootControl);
  const beforeSelected = scenario.harness.path.readPathView({ pathReference: scenario.selectedPath.reference });
  const beforeSibling = scenario.harness.path.readPathView({ pathReference: scenario.siblingPath.reference });
  const beforeReclaimEvents = scenario.reclaim.snapshot().events.length;

  const prepared = scenario.harness.root.protectRootAnchor({ nodeReference: scenario.sharedNode, owner: 'session.advance-successor' });
  assert.equal(prepared.kind, 'protected-anchor');
  assert.equal(scenario.reclaim.admitAccess({ reference: scenario.sharedNode, source: 'root-anchor' }).kind, 'admitted');

  scenario.currentRoot = prepared.anchorReference;
  scenario.rootEpoch = '1';
  scenario.newRoot = prepared;
  assert.equal(scenario.harness.root.releaseRootAnchor({ anchorReference: scenario.oldRoot.anchorReference }).kind, 'released-anchor');

  assert.equal(scenario.harness.path.readPathView({ pathReference: scenario.selectedPath.reference }).occurrences.length, beforeSelected.occurrences.length);
  assert.equal(scenario.harness.path.readPathView({ pathReference: scenario.siblingPath.reference }).occurrences.length, beforeSibling.occurrences.length);
  assert.equal(heldProtections(scenario.harness.ref, scenario.sharedNode).length, 5);
  assert.equal(scenario.harness.ref.snapshot().retirementBarriers.length, 0);
  assert.equal(scenario.reclaim.snapshot().events.slice(beforeReclaimEvents).some(({ type }) => type === 'retirement-started'), false);
  assert.equal(control.reclamation, 'none');
  assert.equal(control.reclassification, 'none');
  return control;
}

function applySiblingCheckpoint(scenario, rootControl) {
  const control = assertAdvanceControl(rootControl);
  assert.equal(control.selectedDescendantWork, 'preserve-compatible');
  assert.equal(control.siblingOccurrenceWork, 'superseded-by-advance-lazy');
  assert.equal(control.sharedTransposedNode, 'occurrence-supersession-does-not-invalidate-node');

  assert.equal(scenario.harness.ref.releaseProtection({ token: scenario.siblingWork.token }).kind, 'released');
  assert.equal(scenario.reclaim.releaseAccess({ reference: scenario.sharedNode, source: 'in-flight' }).kind, 'released');
  assert.equal(scenario.harness.path.closePath({ pathReference: scenario.siblingPath.reference, disposition: 'released' }).kind, 'closed');
  assert.equal(scenario.reclaim.releaseAccess({ reference: scenario.sharedNode, source: 'active-path' }).kind, 'released');

  const selected = scenario.harness.path.readPathView({ pathReference: scenario.selectedPath.reference });
  assert.equal(selected.kind, 'path-view');
  assert.equal(selected.occurrences.length, 1);
  assert.deepEqual(selected.occurrences[0].nodeReference, scenario.sharedNode);
  assert.equal(scenario.harness.ref.validateReference({ expectedKind: 'state-node', reference: scenario.sharedNode }).kind, 'valid');
  assert.equal(heldProtections(scenario.harness.ref, scenario.sharedNode).length, 3);
  assert.equal(scenario.harness.ref.snapshot().retirementBarriers.length, 0);
  return { selected, control };
}

function beginRetirementUnderPressure(scenario) {
  const retired = scenario.reclaim.retire({ reference: scenario.sharedNode });
  assert.equal(retired.kind, 'retiring');
  const blockedBarrier = scenario.harness.ref.beginRetirementBarrier({ expectedKind: 'state-node', reference: scenario.sharedNode });
  assert.deepEqual(blockedBarrier, { kind: 'blocked', protections: 3 });
  assert.equal(scenario.harness.ref.observeRetirementBarrier(scenario.sharedNode), false);
  assert.deepEqual(
    scenario.harness.ref.acquireProtection({ expectedKind: 'state-node', owner: 'late-after-retirement', reference: scenario.sharedNode }),
    { kind: 'invalid', code: 'invalid-reference' },
  );
  assert.deepEqual(scenario.reclaim.admitAccess({ reference: scenario.sharedNode, source: 'publication-waiter' }), {
    kind: 'blocked', code: 'retiring', state: 'retiring',
  });
  const proof = scenario.reclaim.proveQuiescent({
    reference: scenario.sharedNode,
    workUnits: String(scenario.profile.reclamation.protectionSources.length),
    scratchBytes: '1',
  });
  assert.equal(proof.kind, 'blocked');
  assert.equal(proof.source, 'active-path');
  return { retired, blockedBarrier, proof };
}

function drainAndReuse(scenario) {
  assert.equal(scenario.harness.path.closePath({ pathReference: scenario.selectedPath.reference, disposition: 'released' }).kind, 'closed');
  assert.equal(scenario.reclaim.releaseAccess({ reference: scenario.sharedNode, source: 'active-path' }).kind, 'released');
  assert.equal(scenario.harness.root.releaseRootAnchor({ anchorReference: scenario.newRoot.anchorReference }).kind, 'released-anchor');
  assert.equal(scenario.reclaim.releaseAccess({ reference: scenario.sharedNode, source: 'root-anchor' }).kind, 'released');

  assert.deepEqual(
    scenario.harness.ref.beginRetirementBarrier({ expectedKind: 'state-node', reference: scenario.sharedNode }),
    { kind: 'blocked', protections: 1 },
  );
  const borrowBlocked = scenario.reclaim.proveQuiescent({
    reference: scenario.sharedNode,
    workUnits: String(scenario.profile.reclamation.protectionSources.length),
    scratchBytes: '1',
  });
  assert.equal(borrowBlocked.kind, 'blocked');
  assert.equal(borrowBlocked.source, 'retained-borrow');

  assert.equal(scenario.harness.ref.releaseProtection({ token: scenario.retainedBorrow.token }).kind, 'released');
  assert.equal(scenario.reclaim.releaseAccess({ reference: scenario.sharedNode, source: 'retained-borrow' }).kind, 'released');
  assert.equal(scenario.harness.ref.beginRetirementBarrier({ expectedKind: 'state-node', reference: scenario.sharedNode }).kind, 'retirement-barrier');
  assert.equal(scenario.harness.ref.observeRetirementBarrier(scenario.sharedNode), true);

  const quiescent = scenario.reclaim.proveQuiescent({
    reference: scenario.sharedNode,
    workUnits: String(scenario.profile.reclamation.protectionSources.length),
    scratchBytes: '1',
  });
  assert.equal(quiescent.kind, 'quiescent');
  assert.equal(quiescent.transposition, 'tombstone');
  assert.deepEqual(scenario.reclaim.lookupTransposition({ key: 'tt.shared.advance' }), { kind: 'miss', tombstone: true });

  const reclaimed = scenario.reclaim.reclaim({ reference: scenario.sharedNode });
  assert.equal(reclaimed.kind, 'reclaimed');
  assert.equal(reclaimed.nextGeneration, '1');
  const reused = scenario.reclaim.reuseSlot({
    kind: 'state-node',
    arena: '0',
    slot: scenario.sharedNode.slot,
    transpositionKey: 'tt.shared.advance.reused',
    blockers: blockerRecord(scenario.profile),
    ownerRegionId: null,
    ownerRecord: {},
  });
  assert.equal(reused.kind, 'reused');
  assert.equal(reused.reference.generation, '1');

  scenario.harness.setGeneration(scenario.sharedNode, '1');
  assert.deepEqual(
    scenario.harness.ref.validateReference({ expectedKind: 'state-node', reference: scenario.sharedNode }),
    { kind: 'invalid', code: 'stale-reference' },
  );
  assert.equal(scenario.harness.ref.validateReference({ expectedKind: 'state-node', reference: reused.reference }).kind, 'valid');
  return { borrowBlocked, quiescent, reclaimed, reused };
}

export function registerGraphAdvanceOccurrenceCases({
  defineCase,
  fixture,
  projection,
  nodeEvidence,
  edgeEvidence,
  refEvidence,
  pathEvidence,
  rootControl,
  rootEvidence,
  reclaimEvidence,
}) {
  defineCase('graph-advance-occurrence-upstream-evidence-and-control-exact', () => {
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
    assert.deepEqual(reclaimEvidence.evidenceIdentity, fixture.reclaimEvidence);
    for (const evidence of [nodeEvidence, edgeEvidence, refEvidence, pathEvidence, rootEvidence, reclaimEvidence]) assert.equal(evidence.status, 'pass');
    const control = assertAdvanceControl(rootControl);
    return {
      selectedDescendantWork: control.selectedDescendantWork,
      siblingOccurrenceWork: control.siblingOccurrenceWork,
      sharedTransposedNode: control.sharedTransposedNode,
    };
  });

  defineCase('graph-advance-occurrence-authority-commit-has-zero-eager-cleanup', () => {
    const scenario = createScenario(projection);
    const control = commitAdvance(scenario, rootControl);
    assert.equal(scenario.rootEpoch, '1');
    assert.equal(scenario.harness.root.readRootAnchor({ anchorReference: scenario.currentRoot }).kind, 'root-anchor');
    return {
      rootEpoch: scenario.rootEpoch,
      sharedProtectionsAfterCommit: heldProtections(scenario.harness.ref, scenario.sharedNode).length,
      siblingClassification: control.siblingOccurrenceWork,
      retirementBarriers: scenario.harness.ref.snapshot().retirementBarriers.length,
    };
  });

  defineCase('graph-advance-occurrence-lazy-checkpoint-releases-only-sibling-occurrence', () => {
    const scenario = createScenario(projection);
    commitAdvance(scenario, rootControl);
    const { selected, control } = applySiblingCheckpoint(scenario, rootControl);
    return {
      selectedOccurrenceStillLive: selected.occurrences.length === 1,
      siblingClassification: control.siblingOccurrenceWork,
      sharedNodeStillValid: true,
      remainingSharedProtections: heldProtections(scenario.harness.ref, scenario.sharedNode).length,
    };
  });

  defineCase('graph-advance-occurrence-retirement-order-blocks-new-protection-while-old-work-drains', () => {
    const scenario = createScenario(projection);
    commitAdvance(scenario, rootControl);
    applySiblingCheckpoint(scenario, rootControl);
    const { blockedBarrier, proof } = beginRetirementUnderPressure(scenario);
    return {
      existingProtections: blockedBarrier.protections,
      quiescenceBlocker: proof.source,
      lateProtectionRejected: true,
      publicBarrierPassed: scenario.harness.ref.observeRetirementBarrier(scenario.sharedNode),
    };
  });

  defineCase('graph-advance-occurrence-retained-borrow-gates-quiescence-and-reuse-is-generation-safe', () => {
    const scenario = createScenario(projection);
    commitAdvance(scenario, rootControl);
    applySiblingCheckpoint(scenario, rootControl);
    beginRetirementUnderPressure(scenario);
    const result = drainAndReuse(scenario);
    return {
      finalBlocker: result.borrowBlocked.source,
      tombstoneBeforeReuse: result.quiescent.transposition,
      replacementGeneration: result.reused.reference.generation,
      staleOldReference: true,
    };
  });
}

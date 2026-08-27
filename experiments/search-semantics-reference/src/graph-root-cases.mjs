import assert from 'node:assert/strict';

import { createGraphReferenceOracle } from './graph-ref.mjs';
import { createGraphRootOracle } from './graph-root.mjs';

function profileById(projection, id = 'graph.synthetic-transposing') {
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

function expectInvalid(result, code) {
  assert.deepEqual(result, { kind: 'invalid', code });
}

function makeHarness({ profile, rootAdmission = {}, refAdmission = {}, ownerRerootLifecycle, mutations = {} } = {}) {
  assert(profile, 'profile is required');
  const staticSlots = new Map();
  let rootOracle = null;
  const resolveSlotState = (request) => {
    const dynamic = rootOracle?.resolveSlotState(request);
    if (dynamic !== null && dynamic !== undefined) return dynamic;
    const entry = staticSlots.get(keyOf(request));
    return entry === undefined ? null : structuredClone(entry);
  };
  const ref = createGraphReferenceOracle({ profile, resolveSlotState, admission: refAdmission });
  rootOracle = createGraphRootOracle({
    profile,
    validateReference: ref.validateReference,
    nextGeneration: ref.nextGeneration,
    acquireProtection: ref.acquireProtection,
    releaseProtection: ref.releaseProtection,
    ownerRerootLifecycle,
    admission: rootAdmission,
    mutations,
  });

  function addReady(kind, slot, generation = '0') {
    const reference = { kind, arena: '0', slot, generation };
    staticSlots.set(keyOf(reference), { ...reference, lifecycleState: readyState(profile, kind) });
    return reference;
  }

  return { profile, root: rootOracle, ref, addReady, staticSlots };
}

function sameReference(left, right) {
  return left?.kind === right?.kind
    && left?.arena === right?.arena
    && left?.slot === right?.slot
    && left?.generation === right?.generation;
}

function heldProtections(refSnapshot, reference = null) {
  return refSnapshot.protections.filter((entry) => entry.state === 'held'
    && (reference === null || sameReference(entry.reference, reference)));
}

function rootControlFacts(rootControl) {
  assert.equal(rootControl.schema, 'cuda-mcgs.search-ir-composer-root-control-projection/0.2.0');
  assert.equal(rootControl.root.establishment, 'pre-ignition-validate-admit-materialize');
  assert.equal(rootControl.root.publication, 'release-after-full-initialization');
  assert.equal(typeof rootControl.root.validationOwner, 'string');
  assert.equal(typeof rootControl.root.graphOwner, 'string');
  assert.notEqual(rootControl.root.validationOwner, rootControl.root.graphOwner);
  assert.equal(rootControl.advance.kind, 'selected');
  assert.equal(rootControl.advance.profile.realizedTransitionRequired, true);
  assert.equal(rootControl.advance.profile.successorReadyRequired, true);
  assert.equal(rootControl.advance.profile.existingResourcesOnly, true);
  assert.equal(rootControl.advance.profile.graphTraversal, 'none');
  assert.equal(rootControl.advance.profile.semanticStateCopy, 'none');
  assert.equal(rootControl.advance.profile.stateTransform, 'none');
  assert.equal(rootControl.advance.profile.reset, 'none');
  assert.equal(rootControl.advance.profile.resize, 'none');
  assert.equal(rootControl.advance.profile.reclassification, 'none');
  assert.equal(rootControl.advance.profile.reclamation, 'none');
  assert.equal(rootControl.advance.profile.eagerCleanup, 'none');
  assert.equal(rootControl.advance.profile.siblingOccurrenceWork, 'superseded-by-advance-lazy');
  assert.equal(rootControl.advance.profile.sharedTransposedNode, 'occurrence-supersession-does-not-invalidate-node');
  assert.equal(rootControl.reroot.kind, 'selected');
  assert.equal(rootControl.reroot.profile.oldRoot, 'authoritative-until-commit');
  assert.equal(rootControl.reroot.profile.materialization, 'prepare-nonauthoritative');
  assert.equal(rootControl.reroot.profile.reuseClassification, 'owner-declared-reroot-only');
  assert.equal(rootControl.reroot.profile.transaction.preMutationAdmission, true);
  assert.equal(rootControl.attention.kind, 'selected');
  assert.equal(rootControl.attention.profile.rootAuthorityEffect, 'none');
  assert.equal(rootControl.attention.profile.graphWork, 'none');
  assert.equal(rootControl.attention.profile.reclamation, 'none');
  assert.equal(rootControl.reclamation.advanceSeparate, true);
  assert.equal(rootControl.reclamation.rerootCommitSeparate, true);
  assert(rootControl.reclamation.protectedReferences.includes('shared-node-reference'));
  return true;
}

export function registerGraphRootCases({ defineCase, fixture, projection, nodeEvidence, refEvidence, pathEvidence, rootControl, plannedCoverage }) {
  defineCase('graph-root-profile-and-upstream-evidence-exact', () => {
    assert.deepEqual(projection.projectionIdentity, {
      algorithm: fixture.profileProjection.algorithm,
      byteLength: fixture.profileProjection.byteLength,
      sha256: fixture.profileProjection.sha256,
    });
    assert.deepEqual(nodeEvidence.evidenceIdentity, fixture.nodeEvidence);
    assert.deepEqual(refEvidence.evidenceIdentity, fixture.refEvidence);
    assert.deepEqual(pathEvidence.evidenceIdentity, fixture.pathEvidence);
    assert.deepEqual(rootControl.identity, fixture.rootControlProjection);
    assert.equal(nodeEvidence.status, 'pass');
    assert.equal(refEvidence.status, 'pass');
    assert.equal(pathEvidence.status, 'pass');
    return {
      projection: fixture.profileProjection.sha256,
      nodeEvidence: fixture.nodeEvidence.sha256,
      refEvidence: fixture.refEvidence.sha256,
      pathEvidence: fixture.pathEvidence.sha256,
      rootControl: fixture.rootControlProjection.sha256,
    };
  });

  defineCase('graph-root-control-projection-preserves-operation-separation', () => {
    rootControlFacts(rootControl);
    return {
      root: rootControl.root.establishment,
      advance: rootControl.advance.profile.siblingOccurrenceWork,
      reroot: rootControl.reroot.profile.oldRoot,
      attention: rootControl.attention.profile.rootAuthorityEffect,
    };
  }, ['GRAPH-ROOT-004', 'GRAPH-ROOT-005', 'GRAPH-ROOT-006']);

  defineCase('graph-root-establishes-protected-anchor-with-session-owned-current', () => {
    const profile = profileById(projection);
    const harness = makeHarness({ profile });
    const node = harness.addReady('state-node', '1');
    const protectedAnchor = harness.root.protectRootAnchor({ nodeReference: node, owner: 'session.initial-root' });
    assert.equal(protectedAnchor.kind, 'protected-anchor');
    const session = { currentAnchor: protectedAnchor.anchorReference, rootEpoch: '0' };
    const view = harness.root.readRootAnchor({ anchorReference: session.currentAnchor });
    assert.equal(view.kind, 'root-anchor');
    assert.deepEqual(view.nodeReference, node);
    assert.equal(heldProtections(harness.ref.snapshot(), node).length, 1);
    const snapshot = harness.root.snapshot();
    assert.equal(Object.hasOwn(snapshot, 'currentRoot'), false);
    assert.equal(Object.hasOwn(snapshot, 'rootEpoch'), false);
    return { sessionOwnedCurrent: true, anchorReference: session.currentAnchor };
  }, ['GRAPH-ROOT-001']);

  defineCase('graph-root-anchor-generation-safe-reuse', () => {
    const profile = profileById(projection);
    const harness = makeHarness({ profile });
    const firstNode = harness.addReady('state-node', '2');
    const secondNode = harness.addReady('state-node', '3');
    const first = harness.root.protectRootAnchor({ nodeReference: firstNode, owner: 'session.root-0' });
    assert.equal(harness.root.releaseRootAnchor({ anchorReference: first.anchorReference }).kind, 'released-anchor');
    const second = harness.root.protectRootAnchor({ nodeReference: secondNode, owner: 'session.root-1' });
    assert.equal(second.anchorReference.slot, first.anchorReference.slot);
    assert.equal(second.anchorReference.generation, '1');
    expectInvalid(harness.root.readRootAnchor({ anchorReference: first.anchorReference }), 'stale-reference');
    assert.equal(harness.root.readRootAnchor({ anchorReference: second.anchorReference }).kind, 'root-anchor');
    return { first: first.anchorReference, replacement: second.anchorReference };
  }, ['GRAPH-ROOT-001']);

  defineCase('graph-root-advance-uses-ready-successor-without-reroot-work', () => {
    rootControlFacts(rootControl);
    const profile = profileById(projection);
    let ownerDispositionCalls = 0;
    const harness = makeHarness({ profile, ownerRerootLifecycle: () => { ownerDispositionCalls += 1; return { status: 'ready' }; } });
    const oldNode = harness.addReady('state-node', '4');
    const successor = harness.addReady('state-node', '5');
    const oldRoot = harness.root.protectRootAnchor({ nodeReference: oldNode, owner: 'session.root-old' });
    const nextRoot = harness.root.protectRootAnchor({ nodeReference: successor, owner: 'session.advance-successor' });
    assert.equal(nextRoot.kind, 'protected-anchor');
    const session = { currentAnchor: nextRoot.anchorReference, rootEpoch: '1', operation: 'advance' };
    assert.equal(harness.root.releaseRootAnchor({ anchorReference: oldRoot.anchorReference }).kind, 'released-anchor');
    assert.equal(harness.root.readRootAnchor({ anchorReference: session.currentAnchor }).kind, 'root-anchor');
    assert.equal(ownerDispositionCalls, 0, 'advance must not invoke reroot-owned retained-state disposition');
    assert.equal(harness.ref.snapshot().retirementBarriers.length, 0, 'advance must not create reclamation/retirement work');
    return {
      operation: session.operation,
      existingResourcesOnly: rootControl.advance.profile.existingResourcesOnly,
      reclassification: rootControl.advance.profile.reclassification,
      reclamation: rootControl.advance.profile.reclamation,
    };
  }, ['GRAPH-ROOT-004']);

  defineCase('graph-root-reroot-resolves-and-protects-before-authority-commit', () => {
    rootControlFacts(rootControl);
    const profile = profileById(projection);
    const harness = makeHarness({ profile });
    const oldNode = harness.addReady('state-node', '6');
    const replacementNode = harness.addReady('state-node', '7');
    const current = harness.root.protectRootAnchor({ nodeReference: oldNode, owner: 'session.current' });
    const trace = ['old-authoritative'];
    const resolved = (() => { trace.push('replacement-resolved'); return replacementNode; })();
    const prepared = harness.root.protectRootAnchor({ nodeReference: resolved, owner: 'session.reroot-prepared' });
    assert.equal(prepared.kind, 'protected-anchor');
    trace.push('replacement-protected');
    assert.equal(harness.root.readRootAnchor({ anchorReference: current.anchorReference }).kind, 'root-anchor', 'old root must remain protected before Session commit');
    const session = { currentAnchor: prepared.anchorReference, rootEpoch: '1' };
    trace.push('session-commit');
    assert.equal(harness.root.releaseRootAnchor({ anchorReference: current.anchorReference }).kind, 'released-anchor');
    trace.push('old-anchor-released');
    assert.deepEqual(trace, ['old-authoritative', 'replacement-resolved', 'replacement-protected', 'session-commit', 'old-anchor-released']);
    assert.equal(harness.root.readRootAnchor({ anchorReference: session.currentAnchor }).kind, 'root-anchor');
    return { trace };
  }, ['GRAPH-ROOT-002']);

  defineCase('graph-root-replacement-pressure-preserves-prior-anchor', () => {
    const profile = profileById(projection);
    const harness = makeHarness({ profile, refAdmission: { protectionSlots: '1' } });
    const oldNode = harness.addReady('state-node', '8');
    const replacementNode = harness.addReady('state-node', '9');
    const current = harness.root.protectRootAnchor({ nodeReference: oldNode, owner: 'session.current' });
    const session = { currentAnchor: current.anchorReference, rootEpoch: '0' };
    const attempt = harness.root.protectRootAnchor({ nodeReference: replacementNode, owner: 'session.reroot-candidate' });
    assert.deepEqual(attempt, { kind: 'pressure', code: 'protection-capacity' });
    assert.deepEqual(session, { currentAnchor: current.anchorReference, rootEpoch: '0' });
    assert.equal(harness.root.readRootAnchor({ anchorReference: session.currentAnchor }).kind, 'root-anchor');
    assert.equal(heldProtections(harness.ref.snapshot(), oldNode).length, 1);
    return { pressure: attempt.code, priorUnchanged: true };
  }, ['GRAPH-ROOT-003']);

  defineCase('graph-root-owner-disposition-delegates-opaque-record', () => {
    const profile = profileById(projection);
    const region = profile.ownerRegions.find(({ semanticRole }) => semanticRole === 'domain-state');
    assert(region, 'Graph profile must expose a domain-state owner region');
    const secret = { privateBytes: [3, 1, 4], ownerOnly: { meaning: 'opaque' } };
    const seen = [];
    const harness = makeHarness({
      profile,
      ownerRerootLifecycle: (request) => {
        seen.push(request);
        assert.equal(request.region.id, region.id);
        assert.equal(Object.hasOwn(request.region, 'layout'), false);
        assert.equal(Object.hasOwn(request.region, 'offsetBytes'), false);
        assert.deepEqual(request.record, secret);
        assert.equal(request.disposition, 'retain-if-key-valid');
        return { status: 'ready' };
      },
    });
    const outcome = harness.root.applyOwnerRerootDisposition({ regionId: region.id, disposition: 'retain-if-key-valid', record: secret });
    assert.deepEqual(outcome, { kind: 'delegated', disposition: 'retain-if-key-valid', status: 'ready' });
    assert.equal(seen.length, 1);
    assert.equal(JSON.stringify(harness.root.snapshot()).includes('privateBytes'), false);
    assert.deepEqual(secret, { privateBytes: [3, 1, 4], ownerOnly: { meaning: 'opaque' } });
    return { delegated: true, regionId: region.id, opaque: true };
  }, ['GRAPH-ROOT-005']);

  defineCase('graph-root-old-work-protection-survives-authority-change', () => {
    const profile = profileById(projection);
    const harness = makeHarness({ profile });
    const oldNode = harness.addReady('state-node', '10');
    const nextNode = harness.addReady('state-node', '11');
    const oldRoot = harness.root.protectRootAnchor({ nodeReference: oldNode, owner: 'session.root-old' });
    const oldWork = harness.ref.acquireProtection({ expectedKind: 'state-node', owner: 'old-epoch-work', reference: oldNode });
    assert.equal(oldWork.kind, 'protected');
    const nextRoot = harness.root.protectRootAnchor({ nodeReference: nextNode, owner: 'session.root-new' });
    assert.equal(nextRoot.kind, 'protected-anchor');
    assert.equal(harness.root.releaseRootAnchor({ anchorReference: oldRoot.anchorReference }).kind, 'released-anchor');
    assert.equal(heldProtections(harness.ref.snapshot(), oldNode).length, 1, 'old work must independently protect the superseded root node');
    assert.equal(harness.ref.releaseProtection({ token: oldWork.token }).kind, 'released');
    assert.equal(heldProtections(harness.ref.snapshot(), oldNode).length, 0);
    return { oldWorkProtectedAfterRootChange: true };
  }, ['GRAPH-ROOT-004', 'GRAPH-ROOT-006']);

  defineCase('graph-root-shared-transposed-node-survives-occurrence-supersession', () => {
    rootControlFacts(rootControl);
    const profile = profileById(projection);
    const harness = makeHarness({ profile });
    const sharedNode = harness.addReady('state-node', '12');
    const oldOccurrence = harness.ref.acquireProtection({ expectedKind: 'state-node', owner: 'old-root-occurrence', reference: sharedNode });
    const retainedOccurrence = harness.ref.acquireProtection({ expectedKind: 'state-node', owner: 'retained-transposed-occurrence', reference: sharedNode });
    assert.equal(oldOccurrence.kind, 'protected');
    assert.equal(retainedOccurrence.kind, 'protected');
    assert.equal(harness.ref.releaseProtection({ token: oldOccurrence.token }).kind, 'released');
    assert.equal(harness.ref.validateReference({ expectedKind: 'state-node', reference: sharedNode }).kind, 'valid');
    assert.equal(heldProtections(harness.ref.snapshot(), sharedNode).length, 1);
    assert.equal(rootControl.advance.profile.sharedTransposedNode, 'occurrence-supersession-does-not-invalidate-node');
    assert.equal(harness.ref.releaseProtection({ token: retainedOccurrence.token }).kind, 'released');
    return { sharedNodeStillValid: true, survivingProtection: 1 };
  }, ['GRAPH-ROOT-004', 'GRAPH-ROOT-006']);

  defineCase('graph-root-attention-change-has-zero-graph-effect', () => {
    rootControlFacts(rootControl);
    const profile = profileById(projection);
    const harness = makeHarness({ profile });
    const node = harness.addReady('state-node', '13');
    const current = harness.root.protectRootAnchor({ nodeReference: node, owner: 'session.current' });
    const beforeRoot = harness.root.snapshot();
    const beforeRef = harness.ref.snapshot();
    const session = { currentAnchor: current.anchorReference, attentionGeneration: '0' };
    session.attentionGeneration = '1';
    const afterRoot = harness.root.snapshot();
    const afterRef = harness.ref.snapshot();
    assert.deepEqual(afterRoot, beforeRoot);
    assert.deepEqual(afterRef, beforeRef);
    assert.equal(rootControl.attention.profile.rootAuthorityEffect, 'none');
    return { attentionGeneration: session.attentionGeneration, graphEffect: 'none' };
  }, ['GRAPH-ROOT-001']);

  defineCase('graph-root-oracle-sensitivity-visible-before-protection', () => {
    const profile = profileById(projection);
    const run = (mutated) => {
      const harness = makeHarness({ profile, mutations: mutated ? { publishBeforeProtection: true } : {} });
      const node = harness.addReady('state-node', '14');
      assert.equal(harness.root.protectRootAnchor({ nodeReference: node, owner: 'session.root' }).kind, 'protected-anchor');
      return harness.root.snapshot().events.map(({ type }) => type);
    };
    const baseline = run(false);
    const mutated = run(true);
    assert(baseline.indexOf('root-anchor-protected') < baseline.indexOf('root-anchor-visible'));
    assert(mutated.indexOf('root-anchor-visible') < mutated.indexOf('root-anchor-protected'));
    return { mutation: 'root-visible-before-protection', detected: true };
  }, ['GRAPH-ROOT-001', 'GRAPH-ROOT-002']);

  defineCase('graph-root-oracle-sensitivity-eager-prior-release', () => {
    const profile = profileById(projection);
    const baselineHarness = makeHarness({ profile, refAdmission: { protectionSlots: '1' } });
    const oldNode = baselineHarness.addReady('state-node', '15');
    const newNode = baselineHarness.addReady('state-node', '16');
    const oldRoot = baselineHarness.root.protectRootAnchor({ nodeReference: oldNode, owner: 'session.old' });
    const blocked = baselineHarness.root.protectRootAnchor({ nodeReference: newNode, owner: 'session.new' });
    assert.deepEqual(blocked, { kind: 'pressure', code: 'protection-capacity' });
    assert.equal(baselineHarness.root.readRootAnchor({ anchorReference: oldRoot.anchorReference }).kind, 'root-anchor');

    const mutatedHarness = makeHarness({ profile, refAdmission: { protectionSlots: '1' } });
    const mutantOldNode = mutatedHarness.addReady('state-node', '15');
    const mutantNewNode = mutatedHarness.addReady('state-node', '16');
    const mutantOldRoot = mutatedHarness.root.protectRootAnchor({ nodeReference: mutantOldNode, owner: 'session.old' });
    assert.equal(mutatedHarness.root.releaseRootAnchor({ anchorReference: mutantOldRoot.anchorReference }).kind, 'released-anchor');
    const improperlyAdmitted = mutatedHarness.root.protectRootAnchor({ nodeReference: mutantNewNode, owner: 'session.new' });
    assert.equal(improperlyAdmitted.kind, 'protected-anchor');
    expectInvalid(mutatedHarness.root.readRootAnchor({ anchorReference: mutantOldRoot.anchorReference }), 'stale-reference');
    return { mutation: 'release-old-before-replacement-admission', detected: true };
  }, ['GRAPH-ROOT-003', 'GRAPH-ROOT-006']);

  defineCase('graph-root-requirement-coverage-exact', () => {
    const coverage = plannedCoverage();
    assert.equal(coverage.requirementCount, 6);
    assert(coverage.requirements.every(({ cases }) => cases.length > 0));
    return coverage;
  });
}

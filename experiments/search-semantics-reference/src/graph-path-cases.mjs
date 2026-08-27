import assert from 'node:assert/strict';

import { canonicalClone } from './canonical.mjs';
import { createGraphPathOracle } from './graph-path.mjs';
import { createGraphReferenceOracle } from './graph-ref.mjs';

function profileById(projection, id = 'graph.synthetic-transposing') {
  const entry = projection.profiles.find((candidate) => candidate.id === id);
  assert(entry, `missing Graph profile ${id}`);
  return entry.normalized;
}

function lifecycleState(profile, role, tail) {
  const object = profile.objectKinds.find((candidate) => candidate.role === role);
  assert(object, `missing ${role}`);
  const state = object.lifecycle.states.find((candidate) => candidate.endsWith(`state-${tail}`));
  assert(state, `missing ${role} state ${tail}`);
  return state;
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

function makeHarness({
  profile,
  pathAdmission = {},
  refAdmission = {},
  mutations = {},
  resolveChild = (candidate) => candidate,
  classifyPathRelation = (left, right) => JSON.stringify(left) === JSON.stringify(right) ? 'domain.relation-equal' : 'domain.relation-distinct',
  ownerOccurrenceLifecycle = () => ({ status: 'ready' }),
} = {}) {
  const selectedProfile = profile ?? null;
  assert(selectedProfile, 'profile is required');
  const staticSlots = new Map();
  let pathOracle = null;
  const resolveSlotState = (request) => {
    const dynamic = pathOracle?.resolveSlotState(request);
    if (dynamic !== null && dynamic !== undefined) return dynamic;
    const entry = staticSlots.get(keyOf(request));
    return entry === undefined ? null : canonicalClone(entry);
  };
  const refOracle = createGraphReferenceOracle({ profile: selectedProfile, resolveSlotState, admission: refAdmission });
  pathOracle = createGraphPathOracle({
    profile: selectedProfile,
    validateReference: refOracle.validateReference,
    nextGeneration: refOracle.nextGeneration,
    acquireProtection: refOracle.acquireProtection,
    releaseProtection: refOracle.releaseProtection,
    resolveChild,
    classifyPathRelation,
    ownerOccurrenceLifecycle,
    admission: pathAdmission,
    mutations,
  });

  function addReady(kind, slot, generation = '0') {
    const reference = { kind, arena: '0', slot, generation };
    staticSlots.set(keyOf(reference), { ...reference, lifecycleState: readyState(selectedProfile, kind) });
    return reference;
  }

  return { profile: selectedProfile, path: pathOracle, ref: refOracle, addReady, staticSlots };
}

function append(path, pathReference, nodeReference, relationView, edgeReference = null, ownerRecords = []) {
  return path.appendPathOccurrence({
    pathReference,
    edgeReference,
    candidate: { nodeReference, relationView },
    ownerRecords,
  });
}

function eventIndex(snapshot, type) {
  return snapshot.events.findIndex((event) => event.type === type);
}

export function registerGraphPathCases({ defineCase, fixture, projection, nodeEvidence, refEvidence, plannedCoverage }) {
  defineCase('graph-path-profile-and-upstream-evidence-exact', () => {
    assert.deepEqual(projection.projectionIdentity, {
      algorithm: fixture.profileProjection.algorithm,
      byteLength: fixture.profileProjection.byteLength,
      sha256: fixture.profileProjection.sha256,
    });
    assert.deepEqual(nodeEvidence.evidenceIdentity, fixture.nodeEvidence);
    assert.deepEqual(refEvidence.evidenceIdentity, fixture.refEvidence);
    assert.equal(refEvidence.status, 'pass');
    assert.equal(refEvidence.summary.passed, 14);
    return {
      projection: fixture.profileProjection.sha256,
      nodeEvidence: fixture.nodeEvidence.sha256,
      refEvidence: fixture.refEvidence.sha256,
    };
  });

  defineCase('graph-path-open-reference-lifecycle-and-generation-safe-reuse', () => {
    const profile = profileById(projection);
    const harness = makeHarness({ profile });
    const first = harness.path.openPath();
    assert.equal(first.kind, 'opened');
    assert.equal(harness.ref.validateReference({ expectedKind: 'active-path', reference: first.reference }).kind, 'valid');
    const closed = harness.path.closePath({ pathReference: first.reference, disposition: 'released' });
    assert.deepEqual(closed, { kind: 'closed', disposition: 'released', reusable: true });
    const second = harness.path.openPath();
    assert.equal(second.reference.slot, first.reference.slot);
    assert.equal(second.reference.generation, '1');
    expectInvalid(harness.ref.validateReference({ expectedKind: 'active-path', reference: first.reference }), 'stale-reference');
    assert.equal(harness.ref.validateReference({ expectedKind: 'active-path', reference: second.reference }).kind, 'valid');
    const snapshot = harness.path.snapshot();
    assert(snapshot.events.some(({ type }) => type === 'path-terminal'));
    assert(snapshot.events.some(({ type }) => type === 'active-path-reusable'));
    return { first: first.reference, replacement: second.reference };
  }, ['GRAPH-PATH-001', 'GRAPH-PATH-007']);

  defineCase('graph-path-append-validates-node-and-edge-before-visible-write', () => {
    const profile = profileById(projection);
    let resolveCalls = 0;
    const harness = makeHarness({
      profile,
      resolveChild: (candidate) => {
        resolveCalls += 1;
        return candidate;
      },
    });
    const opened = harness.path.openPath();
    const validNode = harness.addReady('state-node', '1');
    const invalidEdge = { kind: 'parent-edge', arena: '0', slot: '2', generation: '0' };
    const edgeFailure = append(harness.path, opened.reference, validNode, { state: 'A' }, invalidEdge);
    expectInvalid(edgeFailure, 'invalid-reference');
    assert.equal(resolveCalls, 0, 'invalid incoming edge must reject before child resolution');
    assert.equal(harness.path.readPathView({ pathReference: opened.reference }).occurrences.length, 0);

    const validEdge = harness.addReady('parent-edge', '2');
    const invalidNode = { kind: 'state-node', arena: '0', slot: '3', generation: '0' };
    const nodeFailure = append(harness.path, opened.reference, invalidNode, { state: 'B' }, validEdge);
    expectInvalid(nodeFailure, 'invalid-reference');
    assert.equal(resolveCalls, 1);
    assert.equal(harness.path.readPathView({ pathReference: opened.reference }).occurrences.length, 0);
    assert.equal(harness.ref.snapshot().protections.length, 0);
    return { invalidEdge: 'pre-resolution-reject', invalidNode: 'pre-publication-reject', visibleOccurrences: 0 };
  }, ['GRAPH-PATH-002']);

  defineCase('graph-path-append-protects-before-publication-and-rolls-back', () => {
    const profile = profileById(projection);
    const harness = makeHarness({ profile, refAdmission: { protectionSlots: '1' } });
    const opened = harness.path.openPath();
    const node = harness.addReady('state-node', '4');
    const edge = harness.addReady('parent-edge', '5');
    const result = append(harness.path, opened.reference, node, { state: 'protected' }, edge);
    assert.deepEqual(result, { kind: 'pressure', code: 'protection-capacity' });
    assert.equal(harness.path.readPathView({ pathReference: opened.reference }).occurrences.length, 0);
    const refSnapshot = harness.ref.snapshot();
    assert.equal(refSnapshot.protections.length, 1);
    assert.equal(refSnapshot.protections[0].state, 'released');
    assert.equal(refSnapshot.events.filter(({ type }) => type === 'protection-released').length, 1);
    assert.equal(harness.path.snapshot().events.some(({ type }) => type === 'occurrence-visible'), false);
    return { rollback: 'exact', visibleOccurrences: 0, heldProtections: 0 };
  }, ['GRAPH-PATH-002']);

  defineCase('graph-path-repeated-node-occurrence-is-structurally-valid', () => {
    const profile = profileById(projection);
    const harness = makeHarness({ profile });
    const opened = harness.path.openPath();
    const node = harness.addReady('state-node', '6');
    const edge = harness.addReady('parent-edge', '7');
    const first = append(harness.path, opened.reference, node, { state: 'repeat' });
    const second = append(harness.path, opened.reference, node, { state: 'repeat' }, edge);
    assert.equal(first.kind, 'appended');
    assert.equal(second.kind, 'appended');
    assert.equal(second.relations.length, 1);
    const view = harness.path.readPathView({ pathReference: opened.reference });
    assert.equal(view.occurrences.length, 2);
    assert.deepEqual(view.occurrences[0].nodeReference, view.occurrences[1].nodeReference);
    return { occurrences: 2, sameNode: true, relationObserved: second.relations[0] };
  }, ['GRAPH-PATH-003']);

  defineCase('graph-path-child-resolution-precedes-relation-classification', () => {
    const profile = profileById(projection);
    const trace = [];
    let resolved = false;
    const harness = makeHarness({
      profile,
      resolveChild: (candidate) => {
        trace.push(`resolve:${candidate.relationView.state}`);
        if (candidate.relationView.state === 'B') resolved = true;
        return candidate;
      },
      classifyPathRelation: (left, right) => {
        trace.push(`classify:${left.state}->${right.state}`);
        if (right.state === 'B') assert.equal(resolved, true, 'relation classification observed unresolved child');
        return `domain.relation-${left.state.toLowerCase()}-${right.state.toLowerCase()}`;
      },
    });
    const opened = harness.path.openPath();
    const a = harness.addReady('state-node', '8');
    const b = harness.addReady('state-node', '9');
    const edge = harness.addReady('parent-edge', '10');
    assert.equal(append(harness.path, opened.reference, a, { state: 'A' }).kind, 'appended');
    assert.equal(append(harness.path, opened.reference, b, { state: 'B' }, edge).kind, 'appended');
    assert(trace.indexOf('resolve:B') < trace.indexOf('classify:A->B'));
    return { trace };
  }, ['GRAPH-PATH-004']);

  defineCase('graph-path-owner-local-records-remain-opaque', () => {
    const profile = profileById(projection, 'graph.synthetic-reclaiming');
    const region = profile.ownerRegions.find(({ objectKind, semanticRole }) => objectKind === profile.path.occurrenceObject && semanticRole === 'domain-history');
    assert(region, 'history-carrying profile must expose one path-occurrence domain-history region');
    const seen = [];
    const secretRecord = { opaqueHistoryBytes: [9, 1, 7], privateShape: { doNotInterpret: true } };
    const harness = makeHarness({
      profile,
      ownerOccurrenceLifecycle: (request) => {
        seen.push(request);
        assert.equal(request.region.id, region.id);
        assert.equal(Object.hasOwn(request.region, 'layout'), false);
        assert.equal(Object.hasOwn(request.region, 'offsetBytes'), false);
        assert.deepEqual(request.record, secretRecord);
        return { status: request.action === 'release' ? 'released' : 'ready' };
      },
    });
    const opened = harness.path.openPath();
    const node = harness.addReady('state-node', '11');
    const result = append(harness.path, opened.reference, node, { base: 'same', history: 'h1' }, null, [{ regionId: region.id, record: secretRecord }]);
    assert.equal(result.kind, 'appended');
    const snapshotBeforeClose = harness.path.snapshot();
    assert.equal(JSON.stringify(snapshotBeforeClose).includes('opaqueHistoryBytes'), false);
    assert.equal(JSON.stringify(snapshotBeforeClose).includes('privateShape'), false);
    assert.equal(harness.path.closePath({ pathReference: opened.reference, disposition: 'released' }).kind, 'closed');
    assert.deepEqual(seen.map(({ action }) => action), ['initialize', 'release']);
    assert.deepEqual(secretRecord, { opaqueHistoryBytes: [9, 1, 7], privateShape: { doNotInterpret: true } });
    return { regionId: region.id, lifecycle: seen.map(({ action }) => action), opaque: true };
  }, ['GRAPH-PATH-002', 'GRAPH-PATH-005']);

  defineCase('graph-path-active-capacity-fails-without-partial-publication', () => {
    const profile = profileById(projection);
    const harness = makeHarness({ profile, pathAdmission: { pathSlots: '1' } });
    const first = harness.path.openPath();
    assert.equal(first.kind, 'opened');
    assert.deepEqual(harness.path.openPath(), { kind: 'pressure', code: 'path-capacity' });
    const snapshot = harness.path.snapshot();
    assert.equal(snapshot.pathSlots.length, 1);
    assert.equal(snapshot.pathSlots[0].lifecycleState, lifecycleState(profile, 'active-path', 'active'));
    assert.equal(snapshot.events.filter(({ type }) => type === 'path-opened').length, 1);
    return { admitted: 1, pressure: 'path-capacity', partialPaths: 0 };
  }, ['GRAPH-PATH-001', 'GRAPH-PATH-006']);

  defineCase('graph-path-depth-fails-without-partial-occurrence', () => {
    const profile = profileById(projection);
    let resolveCalls = 0;
    const harness = makeHarness({
      profile,
      pathAdmission: { pathDepth: '1' },
      resolveChild: (candidate) => {
        resolveCalls += 1;
        return candidate;
      },
    });
    const opened = harness.path.openPath();
    const a = harness.addReady('state-node', '12');
    const b = harness.addReady('state-node', '13');
    const edge = harness.addReady('parent-edge', '14');
    assert.equal(append(harness.path, opened.reference, a, { state: 'A' }).kind, 'appended');
    assert.deepEqual(append(harness.path, opened.reference, b, { state: 'B' }, edge), { kind: 'pressure', code: 'path-depth' });
    assert.equal(resolveCalls, 1, 'depth pressure must reject before resolving/publishing another child');
    assert.equal(harness.path.readPathView({ pathReference: opened.reference }).occurrences.length, 1);
    return { depth: 1, pressure: 'path-depth', visibleOccurrences: 1 };
  }, ['GRAPH-PATH-006']);

  defineCase('graph-path-close-abandon-releases-protections-once-before-reuse', () => {
    const profile = profileById(projection);
    const harness = makeHarness({ profile });
    const opened = harness.path.openPath();
    const node = harness.addReady('state-node', '15');
    const edge = harness.addReady('parent-edge', '16');
    assert.equal(append(harness.path, opened.reference, node, { state: 'A' }, edge).kind, 'appended');
    assert.equal(harness.path.closePath({ pathReference: opened.reference, disposition: 'abandoned' }).kind, 'closed');
    const refAfterClose = harness.ref.snapshot();
    assert.equal(refAfterClose.events.filter(({ type }) => type === 'protection-released').length, 2);
    const pathAfterClose = harness.path.snapshot();
    const terminalIndex = eventIndex(pathAfterClose, 'path-terminal');
    const reusableIndex = eventIndex(pathAfterClose, 'active-path-reusable');
    assert(terminalIndex >= 0 && reusableIndex > terminalIndex, 'terminal path state must publish before slot reuse');
    const replacement = harness.path.openPath();
    assert.equal(replacement.reference.slot, opened.reference.slot);
    assert.equal(replacement.reference.generation, '1');
    expectInvalid(harness.ref.validateReference({ expectedKind: 'active-path', reference: opened.reference }), 'stale-reference');
    expectInvalid(harness.path.closePath({ pathReference: opened.reference, disposition: 'released' }), 'stale-reference');
    assert.equal(harness.ref.snapshot().events.filter(({ type }) => type === 'protection-released').length, 2);
    return { releases: 2, exactlyOnce: true, replacement: replacement.reference };
  }, ['GRAPH-PATH-007']);

  defineCase('graph-path-topology-matrix-preserves-ownership', () => {
    const profile = profileById(projection);
    const harness = makeHarness({
      profile,
      classifyPathRelation: (left, right) => {
        if (left.base === right.base && left.history !== right.history) return 'domain.relation-history-distinct';
        if (left.base === right.base) return 'domain.relation-same';
        return 'domain.relation-distinct';
      },
    });
    const nodes = Object.fromEntries(['A', 'B', 'C', 'D', 'H1', 'H2'].map((name, index) => [name, harness.addReady('state-node', `${20 + index}`)]));
    const edges = Array.from({ length: 12 }, (_, index) => harness.addReady('parent-edge', `${40 + index}`));
    let edgeIndex = 0;
    const runSequence = (sequence) => {
      const opened = harness.path.openPath();
      assert.equal(opened.kind, 'opened');
      const results = sequence.map((item, index) => append(
        harness.path,
        opened.reference,
        nodes[item.node],
        item.view,
        index === 0 ? null : edges[edgeIndex++],
      ));
      assert(results.every(({ kind }) => kind === 'appended'));
      const view = harness.path.readPathView({ pathReference: opened.reference });
      assert.equal(harness.path.closePath({ pathReference: opened.reference, disposition: 'released' }).kind, 'closed');
      return { results, view };
    };

    const selfLoop = runSequence([{ node: 'A', view: { base: 'A', history: '0' } }, { node: 'A', view: { base: 'A', history: '0' } }]);
    const directedCycle = runSequence([{ node: 'A', view: { base: 'A', history: '0' } }, { node: 'B', view: { base: 'B', history: '0' } }, { node: 'A', view: { base: 'A', history: '0' } }]);

    const dagLeft = harness.path.openPath();
    const dagRight = harness.path.openPath();
    assert.equal(append(harness.path, dagLeft.reference, nodes.A, { base: 'A', history: '0' }).kind, 'appended');
    assert.equal(append(harness.path, dagLeft.reference, nodes.C, { base: 'C', history: '0' }, edges[edgeIndex++]).kind, 'appended');
    assert.equal(append(harness.path, dagRight.reference, nodes.B, { base: 'B', history: '0' }).kind, 'appended');
    assert.equal(append(harness.path, dagRight.reference, nodes.C, { base: 'C', history: '0' }, edges[edgeIndex++]).kind, 'appended');
    const dagLeftView = harness.path.readPathView({ pathReference: dagLeft.reference });
    const dagRightView = harness.path.readPathView({ pathReference: dagRight.reference });
    assert.deepEqual(dagLeftView.occurrences[1].nodeReference, dagRightView.occurrences[1].nodeReference);
    harness.path.closePath({ pathReference: dagLeft.reference, disposition: 'released' });
    harness.path.closePath({ pathReference: dagRight.reference, disposition: 'released' });

    const stochasticOne = runSequence([{ node: 'A', view: { base: 'A', history: '0' } }, { node: 'D', view: { base: 'D', history: 'sample-1' } }]);
    const stochasticTwo = runSequence([{ node: 'A', view: { base: 'A', history: '0' } }, { node: 'D', view: { base: 'D', history: 'sample-2' } }]);
    const historyDistinct = runSequence([{ node: 'H1', view: { base: 'same', history: 'h1' } }, { node: 'H2', view: { base: 'same', history: 'h2' } }]);

    assert.equal(selfLoop.results[1].relations[0], 'domain.relation-same');
    assert.equal(directedCycle.results[2].relations[0], 'domain.relation-same');
    assert.equal(historyDistinct.results[1].relations[0], 'domain.relation-history-distinct');
    assert.notDeepEqual(stochasticOne.view.occurrences[1].edgeReference, stochasticTwo.view.occurrences[1].edgeReference);
    return {
      selfLoop: true,
      directedCycle: true,
      dagTransposition: true,
      stochasticParallelTransitions: true,
      historyDistinctEqualBase: true,
    };
  }, ['GRAPH-PATH-003', 'GRAPH-PATH-004', 'GRAPH-PATH-005', 'GRAPH-PATH-008']);

  defineCase('graph-path-oracle-sensitivity-relation-before-identity', () => {
    const profile = profileById(projection);
    const run = (mutated) => {
      const trace = [];
      const harness = makeHarness({
        profile,
        mutations: mutated ? { relationBeforeResolve: true } : {},
        resolveChild: (candidate) => {
          trace.push(`resolve:${candidate.relationView.state}`);
          return candidate;
        },
        classifyPathRelation: (left, right) => {
          trace.push(`classify:${left.state}->${right.state ?? 'unresolved'}`);
          return 'domain.relation-observed';
        },
      });
      const opened = harness.path.openPath();
      const a = harness.addReady('state-node', '70');
      const b = harness.addReady('state-node', '71');
      const edge = harness.addReady('parent-edge', '72');
      append(harness.path, opened.reference, a, { state: 'A' });
      append(harness.path, opened.reference, b, { state: 'B' }, edge);
      return trace;
    };
    const baseline = run(false);
    const mutated = run(true);
    assert(baseline.indexOf('resolve:B') < baseline.indexOf('classify:A->B'));
    assert(mutated.findIndex((entry) => entry.startsWith('classify:')) < mutated.indexOf('resolve:B'));
    return { mutation: 'relation-before-resolution', detected: true, baseline, mutated };
  }, ['GRAPH-PATH-004']);

  defineCase('graph-path-oracle-sensitivity-visible-before-protection', () => {
    const profile = profileById(projection);
    const run = (mutated) => {
      const harness = makeHarness({ profile, mutations: mutated ? { publishBeforeProtection: true } : {} });
      const opened = harness.path.openPath();
      const node = harness.addReady('state-node', '73');
      assert.equal(append(harness.path, opened.reference, node, { state: 'A' }).kind, 'appended');
      return harness.path.snapshot();
    };
    const baseline = run(false);
    const mutated = run(true);
    assert(eventIndex(baseline, 'occurrence-protected') < eventIndex(baseline, 'occurrence-visible'));
    assert(eventIndex(mutated, 'occurrence-visible') < eventIndex(mutated, 'occurrence-protected'));
    return { mutation: 'visible-before-protection', detected: true };
  }, ['GRAPH-PATH-002']);

  defineCase('graph-path-requirement-coverage-exact', () => {
    const coverage = plannedCoverage();
    assert.equal(coverage.requirementCount, 8);
    assert(coverage.requirements.every(({ cases }) => cases.length > 0));
    return coverage;
  });
}

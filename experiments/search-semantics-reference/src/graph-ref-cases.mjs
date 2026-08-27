import assert from 'node:assert/strict';

import { canonicalClone } from './canonical.mjs';
import { createGraphNodeOracle } from './graph-node.mjs';
import { createGraphReferenceOracle } from './graph-ref.mjs';

function profileById(projection, id = 'graph.synthetic-transposing') {
  const entry = projection.profiles.find((candidate) => candidate.id === id);
  assert(entry, `missing Graph profile ${id}`);
  return entry.normalized;
}

function readyState(profile, role) {
  const object = profile.objectKinds.find((candidate) => candidate.role === role);
  assert(object, `missing ${role}`);
  return object.lifecycle.readyStates[0];
}

function resolverFrom(entries) {
  const byKey = new Map(entries.map((entry) => [`${entry.kind}\0${entry.arena}\0${entry.slot}`, entry]));
  return ({ kind, arena, slot }) => canonicalClone(byKey.get(`${kind}\0${arena}\0${slot}`));
}

function nodePorts() {
  return {
    identityKey: (view) => ({ digest: view.key }),
    equalState: (left, right) => left.value === right.value,
    initializeOwnedRegions: () => [],
  };
}

function expectInvalid(result, code) {
  assert.deepEqual(result, { kind: 'invalid', code });
}

export function registerGraphRefCases({ defineCase, fixture, projection, nodeEvidence, plannedCoverage }) {
  defineCase('graph-ref-profile-projection-and-node-evidence-exact', () => {
    assert.deepEqual(projection.projectionIdentity, {
      algorithm: fixture.profileProjection.algorithm,
      byteLength: fixture.profileProjection.byteLength,
      sha256: fixture.profileProjection.sha256,
    });
    assert.deepEqual(nodeEvidence.evidenceIdentity, fixture.nodeEvidence);
    return { projection: fixture.profileProjection.sha256, nodeEvidence: fixture.nodeEvidence.sha256 };
  });

  defineCase('graph-ref-validates-kind-arena-slot-generation-and-lifecycle-before-use', () => {
    const profile = profileById(projection);
    const ready = readyState(profile, 'state-node');
    const oracle = createGraphReferenceOracle({
      profile,
      resolveSlotState: resolverFrom([
        { kind: 'state-node', arena: '7', slot: '9', generation: '11', lifecycleState: ready },
        { kind: 'state-node', arena: '8', slot: '10', generation: '12', lifecycleState: profile.objectKinds.find(({ role }) => role === 'state-node').lifecycle.initialState },
      ]),
    });
    const valid = oracle.validateReference({ expectedKind: 'state-node', reference: { kind: 'state-node', arena: '7', slot: '9', generation: '11' } });
    assert.equal(valid.kind, 'valid');
    expectInvalid(oracle.validateReference({ expectedKind: 'parent-edge', reference: valid.reference }), 'reference-kind-mismatch');
    expectInvalid(oracle.validateReference({ expectedKind: 'state-node', reference: { ...valid.reference, arena: '8', slot: '10', generation: '12' } }), 'invalid-reference');
    expectInvalid(oracle.validateReference({ expectedKind: 'state-node', reference: { ...valid.reference, slot: '4096' } }), 'invalid-reference');
    return { valid: valid.reference, events: oracle.snapshot().events.length };
  }, ['GRAPH-REF-001', 'GRAPH-REF-004', 'GRAPH-REF-006']);

  defineCase('graph-ref-arena-incarnation-mismatch-is-typed-and-side-effect-free', () => {
    const profile = profileById(projection);
    const ready = readyState(profile, 'state-node');
    let resolverCalls = 0;
    const oracle = createGraphReferenceOracle({
      profile,
      resolveSlotState: ({ kind, slot }) => {
        resolverCalls += 1;
        return { kind, arena: '8', slot, generation: '11', lifecycleState: ready };
      },
    });
    expectInvalid(oracle.validateReference({
      expectedKind: 'state-node',
      reference: { kind: 'state-node', arena: '7', slot: '9', generation: '11' },
    }), 'arena-incarnation-mismatch');
    assert.equal(resolverCalls, 1);
    assert.equal(oracle.snapshot().events.length, 0);
    return { resolverCalls, semanticSideEffects: 0, code: 'arena-incarnation-mismatch' };
  }, ['GRAPH-REF-001', 'GRAPH-REF-006']);

  defineCase('graph-ref-consumes-current-node-reference-shape', () => {
    const profile = profileById(projection);
    const ports = nodePorts();
    const nodes = createGraphNodeOracle({ profile, ...ports });
    const claim = nodes.lookupOrClaimNode({ claimant: 'ref-consumer', scope: 'scope.ref', view: { key: 'same', value: 4 } });
    nodes.beginInitialization({ claimId: claim.claimId, payload: { state: 4 } });
    const published = nodes.publishNode({ claimId: claim.claimId, payload: { state: 4 } });
    assert.deepEqual(Object.keys(published.reference).sort(), ['arena', 'generation', 'kind', 'slot']);
    const oracle = createGraphReferenceOracle({
      profile,
      resolveSlotState: resolverFrom([{ ...published.reference, lifecycleState: readyState(profile, 'state-node') }]),
    });
    const result = oracle.validateReference({ expectedKind: 'state-node', reference: published.reference });
    assert.equal(result.kind, 'valid');
    return result.reference;
  }, ['GRAPH-REF-001']);

  defineCase('graph-ref-stale-generation-cannot-read-protect-or-publish-replacement', () => {
    const profile = profileById(projection);
    const current = { kind: 'state-node', arena: '0', slot: '3', generation: '8', lifecycleState: readyState(profile, 'state-node') };
    const stale = { kind: 'state-node', arena: '0', slot: '3', generation: '7' };
    const oracle = createGraphReferenceOracle({ profile, resolveSlotState: resolverFrom([current]) });
    expectInvalid(oracle.validateReference({ expectedKind: 'state-node', reference: stale }), 'stale-reference');
    expectInvalid(oracle.acquireProtection({ expectedKind: 'state-node', owner: 'consumer.alpha', reference: stale }), 'stale-reference');
    assert.equal(oracle.snapshot().protections.length, 0);
    assert.equal(oracle.snapshot().events.length, 0);
    return { stale: 'rejected', sideEffects: 0 };
  }, ['GRAPH-REF-002', 'GRAPH-REF-006']);

  defineCase('graph-ref-generation-exhaustion-never-wraps-and-has-no-32-bit-limit', () => {
    const profile = profileById(projection);
    const oracle = createGraphReferenceOracle({ profile, resolveSlotState: () => null });
    assert.deepEqual(oracle.nextGeneration({ generation: '4294967296' }), { kind: 'next', generation: '4294967297' });
    const max = profile.referenceEncoding.generationRange;
    assert.deepEqual(oracle.nextGeneration({ generation: max }), { kind: 'exhausted', code: 'generation-exhausted' });
    return { beyond32Bit: '4294967297', maximum: max };
  }, ['GRAPH-REF-003', 'GRAPH-REF-004']);

  defineCase('graph-ref-public-form-rejects-raw-address-and-invalid-access-is-side-effect-free', () => {
    const profile = profileById(projection);
    let calls = 0;
    const oracle = createGraphReferenceOracle({
      profile,
      resolveSlotState: () => {
        calls += 1;
        return null;
      },
    });
    const raw = oracle.validateReference({ expectedKind: 'state-node', reference: { kind: 'state-node', arena: '0', slot: '0', generation: '0', rawAddress: '0x1234' } });
    expectInvalid(raw, 'invalid-reference');
    assert.equal(calls, 0);
    assert.equal(oracle.snapshot().events.length, 0);
    return { rawAddressPublic: false, resolverCalls: calls };
  }, ['GRAPH-REF-005', 'GRAPH-REF-006']);

  defineCase('graph-ref-owner-reference-lifecycle-is-opaque-and-delegated', () => {
    const profile = profileById(projection, 'graph.synthetic-reclaiming');
    const region = profile.ownerRegions.find(({ semanticRole }) => semanticRole === 'domain-state');
    const noReferenceRegion = profile.ownerRegions.find(({ semanticRole }) => semanticRole === 'domain-action');
    assert(region);
    assert(noReferenceRegion);
    assert.deepEqual(region.referenceHandling, { kind: 'owner-lifecycle', actions: ['fixup', 'release', 'validate'] });
    assert.deepEqual(noReferenceRegion.referenceHandling, { kind: 'none' });
    const seen = [];
    const oracle = createGraphReferenceOracle({
      profile,
      resolveSlotState: () => null,
      ownerReferenceLifecycle: (request) => {
        seen.push(request);
        assert.equal(request.region.id, region.id);
        assert(!Object.hasOwn(request.region, 'layout'));
        assert.deepEqual(request.record, { privateEncoding: { bytes: [9, 8, 7] }, referenceField: 'opaque' });
        return { status: request.action === 'release' ? 'released' : 'ready' };
      },
    });
    const record = { privateEncoding: { bytes: [9, 8, 7] }, referenceField: 'opaque' };
    const result = oracle.applyOwnerReferenceLifecycle({ action: 'validate', regionId: region.id, record });
    assert.deepEqual(result, { kind: 'delegated', status: 'ready' });
    assert.throws(() => oracle.applyOwnerReferenceLifecycle({ action: 'validate', regionId: noReferenceRegion.id, record }), { code: 'GRAPH_REF_OWNER_LIFECYCLE' });
    assert.deepEqual(record, { privateEncoding: { bytes: [9, 8, 7] }, referenceField: 'opaque' });
    assert.equal(seen.length, 1);
    const snapshot = oracle.snapshot();
    assert(!JSON.stringify(snapshot).includes('privateEncoding'));
    return { region: region.id, delegated: result.status };
  }, ['GRAPH-REF-007']);

  defineCase('graph-ref-protection-before-retirement-blocks-until-one-exact-release', () => {
    const profile = profileById(projection);
    const reference = { kind: 'state-node', arena: '0', slot: '5', generation: '0' };
    const oracle = createGraphReferenceOracle({
      profile,
      resolveSlotState: resolverFrom([{ ...reference, lifecycleState: readyState(profile, 'state-node') }]),
    });
    const protectedResult = oracle.acquireProtection({ expectedKind: 'state-node', owner: 'root.user', reference });
    assert.equal(protectedResult.kind, 'protected');
    assert.deepEqual(oracle.beginRetirementBarrier({ expectedKind: 'state-node', reference }), { kind: 'blocked', protections: 1 });
    assert.equal(oracle.observeRetirementBarrier(reference), false);
    assert.equal(oracle.releaseProtection({ token: protectedResult.token }).kind, 'released');
    expectInvalid(oracle.releaseProtection({ token: protectedResult.token }), 'stale-reference');
    assert.equal(oracle.beginRetirementBarrier({ expectedKind: 'state-node', reference }).kind, 'retirement-barrier');
    assert.equal(oracle.observeRetirementBarrier(reference), true);
    return { release: 'exactly-once', retirementAfterRelease: true };
  }, ['GRAPH-REF-008']);

  defineCase('graph-ref-retirement-before-protection-prevents-check-then-pin', () => {
    const profile = profileById(projection);
    const reference = { kind: 'state-node', arena: '0', slot: '6', generation: '0' };
    const oracle = createGraphReferenceOracle({
      profile,
      resolveSlotState: resolverFrom([{ ...reference, lifecycleState: readyState(profile, 'state-node') }]),
    });
    assert.equal(oracle.beginRetirementBarrier({ expectedKind: 'state-node', reference }).kind, 'retirement-barrier');
    expectInvalid(oracle.acquireProtection({ expectedKind: 'state-node', owner: 'late.user', reference }), 'invalid-reference');
    assert.equal(oracle.snapshot().protections.length, 0);
    return { lateProtection: 'rejected' };
  }, ['GRAPH-REF-008']);

  defineCase('graph-ref-protection-capacity-is-explicit-and-finite', () => {
    const profile = profileById(projection);
    const one = { kind: 'state-node', arena: '0', slot: '1', generation: '0' };
    const two = { kind: 'state-node', arena: '0', slot: '2', generation: '0' };
    const oracle = createGraphReferenceOracle({
      profile,
      admission: { protectionSlots: '1' },
      resolveSlotState: resolverFrom([
        { ...one, lifecycleState: readyState(profile, 'state-node') },
        { ...two, lifecycleState: readyState(profile, 'state-node') },
      ]),
    });
    const first = oracle.acquireProtection({ expectedKind: 'state-node', owner: 'a', reference: one });
    assert.equal(first.kind, 'protected');
    assert.deepEqual(oracle.acquireProtection({ expectedKind: 'state-node', owner: 'b', reference: two }), { kind: 'pressure', code: 'protection-capacity' });
    assert.equal(oracle.releaseProtection({ token: first.token }).kind, 'released');
    const reused = oracle.acquireProtection({ expectedKind: 'state-node', owner: 'b', reference: two });
    assert.equal(reused.kind, 'protected');
    assert.equal(reused.token.id, first.token.id);
    assert.equal(reused.token.generation, '1');
    expectInvalid(oracle.releaseProtection({ token: first.token }), 'stale-reference');
    assert.equal(oracle.releaseProtection({ token: reused.token }).kind, 'released');
    assert.equal(oracle.snapshot().limits.protectionSlots, '1');
    return { protectionSlots: '1', pressure: 'protection-capacity', reusedGeneration: reused.token.generation };
  }, ['GRAPH-REF-008']);

  defineCase('graph-ref-oracle-sensitivity-generation-check', () => {
    const profile = profileById(projection);
    const current = { kind: 'state-node', arena: '0', slot: '7', generation: '4', lifecycleState: readyState(profile, 'state-node') };
    const stale = { kind: 'state-node', arena: '0', slot: '7', generation: '3' };
    const baseline = createGraphReferenceOracle({ profile, resolveSlotState: resolverFrom([current]) });
    expectInvalid(baseline.validateReference({ expectedKind: 'state-node', reference: stale }), 'stale-reference');
    const mutated = createGraphReferenceOracle({ profile, resolveSlotState: resolverFrom([current]), mutations: { skipGenerationValidation: true } });
    assert.equal(mutated.validateReference({ expectedKind: 'state-node', reference: stale }).kind, 'valid');
    return { mutation: 'skip-generation-validation', detected: true };
  }, ['GRAPH-REF-002']);

  defineCase('graph-ref-oracle-sensitivity-protect-retire-order', () => {
    const profile = profileById(projection);
    const reference = { kind: 'state-node', arena: '0', slot: '8', generation: '0' };
    const resolve = resolverFrom([{ ...reference, lifecycleState: readyState(profile, 'state-node') }]);
    const baseline = createGraphReferenceOracle({ profile, resolveSlotState: resolve });
    assert.equal(baseline.beginRetirementBarrier({ expectedKind: 'state-node', reference }).kind, 'retirement-barrier');
    expectInvalid(baseline.acquireProtection({ expectedKind: 'state-node', owner: 'late', reference }), 'invalid-reference');
    const mutated = createGraphReferenceOracle({ profile, resolveSlotState: resolve, mutations: { allowProtectionAfterRetirement: true } });
    assert.equal(mutated.beginRetirementBarrier({ expectedKind: 'state-node', reference }).kind, 'retirement-barrier');
    assert.equal(mutated.acquireProtection({ expectedKind: 'state-node', owner: 'late', reference }).kind, 'protected');
    return { mutation: 'allow-protection-after-retirement', detected: true };
  }, ['GRAPH-REF-008']);

  defineCase('graph-ref-requirement-coverage-exact', () => {
    const coverage = plannedCoverage();
    assert.equal(coverage.requirementCount, 8);
    assert(coverage.requirements.every(({ cases }) => cases.length > 0));
    return coverage;
  });
}

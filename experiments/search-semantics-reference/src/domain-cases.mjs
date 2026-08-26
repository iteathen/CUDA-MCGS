import assert from 'node:assert/strict';

import { canonicalClone, canonicalIdentity } from './canonical.mjs';
import { createDomainOracle } from './domain.mjs';
import { createSyntheticDomainDefinitions, createSyntheticDomainOracles, syntheticDomainIds } from './domain-instances.mjs';
import { exactKeys } from './errors.mjs';
import { assertMutationDetected } from './mutation.mjs';

function clone(value) {
  return canonicalClone(value);
}

function ownerError(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function assertNoForeignRuntimeMeaning(value) {
  const serialized = JSON.stringify(value);
  assert(!/(?:graph(?:Node|Reference|Address)|policy|evaluator|ranking|sessionObservation|cuda|pointer|player|board|chess|connect(?:-?4|[- ]four))/i.test(serialized));
}

export function registerDomainCases({ defineCase, fixture, projection, composerEvidence, plannedCoverage }) {
  const oracles = createSyntheticDomainOracles(projection);
  const roots = fixture.roots;

  const validated = (oracle, root) => oracle.validateRoot(root);
  const firstTransposingAction = () => oracles.transposing.produceActions({
    origin: validated(oracles.transposing, roots.transposingAlphaPacked).view,
    sourceId: `${syntheticDomainIds.transposing}.source-paged`,
    cursor: null,
    capacity: 1,
    randomInputs: [],
    productionIncarnation: '0',
    cancelled: false,
  }).actions[0];

  defineCase('domain-profile-projection-exact', () => {
    exactKeys(projection, ['producer', 'profiles', 'projectionIdentity', 'schema'], 'DOMAIN_PROJECTION_FIELDS', 'Domain profile projection');
    assert.equal(projection.schema, fixture.profileProjection.schema);
    assert.deepEqual(projection.producer, {
      capsule: composerEvidence.capsule,
      representationCompositionEvidenceKey: fixture.composerEvidence,
    });
    assert.deepEqual(projection.projectionIdentity, {
      algorithm: fixture.profileProjection.algorithm,
      byteLength: fixture.profileProjection.byteLength,
      sha256: fixture.profileProjection.sha256,
    });
    assert.deepEqual(
      canonicalIdentity({ schema: projection.schema, producer: projection.producer, profiles: projection.profiles }),
      projection.projectionIdentity,
    );
    assert.deepEqual(projection.profiles.map(({ id }) => id), Object.values(syntheticDomainIds));
    for (const entry of projection.profiles) {
      assert.equal(entry.id, entry.normalized.id);
      assert.deepEqual(canonicalIdentity(entry.normalized), entry.identity);
      const published = composerEvidence.domainProfileIdentities.find(({ id }) => id === entry.id);
      assert.deepEqual({ id: entry.id, ...entry.identity }, published);
    }
    return { projectionIdentity: projection.projectionIdentity, profileIdentities: projection.profiles.map(({ id, identity }) => ({ id, identity })) };
  });

  defineCase('domain-root-validation-atomic', () => {
    const before = validated(oracles.transposing, roots.transposingAlphaPacked);
    const foreignScopeRoot = clone(roots.transposingAlphaPacked);
    foreignScopeRoot.scopeId = 'scope.engine-b';
    const foreignScope = validated(oracles.transposing, foreignScopeRoot);
    const foreignProfile = validated(oracles.stochastic, roots.stochasticChance);
    assert.equal(oracles.transposing.equalState(before.view, foreignScope.view), false);
    assert.equal(oracles.transposing.equalState(before.view, foreignProfile.view), false);
    const invalid = clone(roots.transposingAlphaPacked);
    invalid.state.terminal = true;
    assert.throws(() => oracles.transposing.validateRoot(invalid), { code: 'DOMAIN_STATE_INVALID' });
    assert.throws(() => oracles.transposing.validateRoot(roots.transposingAlphaPacked, 'active'), { code: 'DOMAIN_ROOT_PHASE' });
    const after = validated(oracles.transposing, roots.transposingAlphaPacked);
    assert.deepEqual(after, before);
    return { rootIdentity: before.identity.verification };
  }, ['DOMAIN-ROOT-001', 'DOMAIN-ROOT-002', 'DOMAIN-ROOT-003', 'DOMAIN-ROOT-004', 'DOMAIN-STATE-001', 'DOMAIN-STATE-008']);

  defineCase('domain-identity-collision-verification', () => {
    const alpha = validated(oracles.transposing, roots.transposingAlphaPacked);
    const beta = validated(oracles.transposing, roots.transposingBeta);
    assert.equal(alpha.identity.key, beta.identity.key);
    assert.equal(oracles.transposing.equalState(alpha.view, beta.view), false);
    assert.notDeepEqual(alpha.identity.verification, beta.identity.verification);
    return { collidingKey: alpha.identity.key, alpha: alpha.identity.verification, beta: beta.identity.verification };
  }, ['DOMAIN-STATE-002', 'DOMAIN-STATE-003']);

  defineCase('domain-identity-encoding-independent', () => {
    const packed = validated(oracles.transposing, roots.transposingAlphaPacked);
    const record = validated(oracles.transposing, roots.transposingAlphaRecord);
    const compactRoot = clone(roots.transposingAlphaRecord);
    compactRoot.state.encoding = 'compact';
    const compact = validated(oracles.transposing, compactRoot);
    assert.notEqual(packed.view.state.encoding, record.view.state.encoding);
    assert.equal(oracles.transposing.equalState(packed.view, packed.view), true);
    assert.equal(oracles.transposing.equalState(packed.view, record.view), true);
    assert.equal(oracles.transposing.equalState(record.view, packed.view), true);
    assert.equal(oracles.transposing.equalState(record.view, compact.view), true);
    assert.equal(oracles.transposing.equalState(packed.view, compact.view), true);
    assert.deepEqual(packed.identity, record.identity);
    assert.deepEqual(record.identity, compact.identity);
    return { identity: packed.identity, encodings: [packed.view.state.encoding, record.view.state.encoding, compact.view.state.encoding] };
  }, ['DOMAIN-STATE-002', 'DOMAIN-STATE-003', 'DOMAIN-STATE-006', 'DOMAIN-STATE-007']);

  defineCase('domain-history-sensitive-transposition', () => {
    const baseline = validated(oracles.transposing, roots.transposingAlphaPacked);
    const changed = validated(oracles.transposing, roots.transposingAlphaOtherHistory);
    assert.equal(baseline.identity.key, changed.identity.key);
    assert.equal(oracles.transposing.equalState(baseline.view, changed.view), false);
    assert.equal(oracles.transposing.classifyPathRelation(baseline.view, changed.view), 'relation.history-dependent-repeat');

    const stochastic = validated(oracles.stochastic, roots.stochasticObservation);
    const altered = clone(stochastic.view);
    altered.history = { observations: ['different'], steps: 1 };
    assert.equal(oracles.stochastic.equalState(stochastic.view, altered), false);
    const absent = validated(oracles.lazy, roots.lazyContinuous);
    assert.equal(absent.view.history, null);
    return { embedded: [baseline.identity.verification, changed.identity.verification], carried: oracles.stochastic.identityOf(altered).verification, absent: absent.identity.verification };
  }, ['DOMAIN-STATE-004', 'DOMAIN-STATE-005', 'DOMAIN-HISTORY-001', 'DOMAIN-HISTORY-004', 'DOMAIN-HISTORY-005']);

  defineCase('domain-history-exhaustion-fails-closed', () => {
    const root = validated(oracles.stochastic, roots.stochasticHistoryLimit);
    assert.throws(() => oracles.stochastic.advanceHistory({ state: root.view.state, history: root.view.history, input: { observation: 'overflow' } }), { code: 'DOMAIN_HISTORY_EXHAUSTED' });
    assert.deepEqual(root, validated(oracles.stochastic, roots.stochasticHistoryLimit));
    return { retainedHistory: root.view.history };
  }, ['DOMAIN-HISTORY-002', 'DOMAIN-HISTORY-003']);

  defineCase('domain-action-exhaustive-paged', () => {
    const root = validated(oracles.transposing, roots.transposingAlphaPacked);
    const first = oracles.transposing.produceActions({ origin: root.view, sourceId: `${syntheticDomainIds.transposing}.source-paged`, cursor: null, capacity: 1, randomInputs: [], productionIncarnation: '7', cancelled: false });
    const second = oracles.transposing.produceActions({ origin: root.view, sourceId: `${syntheticDomainIds.transposing}.source-paged`, cursor: first.cursor, capacity: 1, randomInputs: [], productionIncarnation: '7', cancelled: false });
    assert.equal(first.status, 'batch-ready-more');
    assert.equal(second.status, 'batch-ready-complete');
    assert.deepEqual([...first.actions, ...second.actions].map(({ payload }) => payload.id), ['to-beta', 'to-goal']);
    assert.equal(oracles.transposing.equalAction(first.actions[0], second.actions[0], root.view), false);
    return { first, second };
  }, ['DOMAIN-ACTION-002', 'DOMAIN-ACTION-003', 'DOMAIN-ACTION-004', 'DOMAIN-ACTION-005']);

  defineCase('domain-action-lazy-sampled', () => {
    const root = validated(oracles.lazy, roots.lazyContinuous);
    const result = oracles.lazy.produceActions({ origin: root.view, sourceId: `${syntheticDomainIds.lazy}.source-lazy`, cursor: null, capacity: 3, randomInputs: [], productionIncarnation: '0', cancelled: false });
    assert.equal(result.status, 'batch-ready-more');
    assert.equal(result.actions.length, 3);
    assert(result.cursor !== null);
    assert.deepEqual(result.actions[0].key, { family: 'continuous-coordinate', coordinate: 0 });
    assertNoForeignRuntimeMeaning(result);
    return { finiteBatch: result.actions.map(({ payload }) => payload), cursor: result.cursor };
  }, ['DOMAIN-ACTION-002', 'DOMAIN-ACTION-008']);

  defineCase('domain-action-admitted-proposal', () => {
    const root = validated(oracles.stochastic, roots.stochasticObservation);
    const candidate = oracles.stochastic.validateAction({ origin: root.view, productionIncarnation: '11', candidate: { id: 'observation-candidate', delta: 0 } });
    assert.equal(candidate.profileId, syntheticDomainIds.stochastic);
    assert.throws(() => oracles.stochastic.produceActions({ origin: root.view, sourceId: `${syntheticDomainIds.stochastic}.source-admitted`, cursor: null, capacity: 1, randomInputs: [], productionIncarnation: '11', cancelled: false }), { code: 'DOMAIN_ACTION_SOURCE_EXTERNAL' });
    return { validatedCandidate: candidate };
  }, ['DOMAIN-ACTION-002', 'DOMAIN-ACTION-009', 'DOMAIN-ACTION-010', 'DOMAIN-ACTION-011']);

  defineCase('domain-action-scope-stale', () => {
    const alpha = validated(oracles.transposing, roots.transposingAlphaPacked);
    const beta = validated(oracles.transposing, roots.transposingBeta);
    const action = firstTransposingAction();
    assert.throws(() => oracles.transposing.applyTransition({ origin: beta.view, action, input: {}, outputCapacity: 4096, transitionIncarnation: '0', cancelled: false }), { code: 'DOMAIN_ACTION_SCOPE' });
    assert.throws(() => oracles.transposing.validateAction({ origin: alpha.view, productionIncarnation: '0', candidate: { id: 'to-ghost', target: 'ghost' } }), { code: 'DOMAIN_ACTION_INVALID' });
    return { rejectedActionIdentity: action.originIdentity };
  }, ['DOMAIN-ACTION-007']);

  defineCase('domain-action-collision-verification', () => {
    const root = validated(oracles.stochastic, roots.stochasticObservation);
    const left = oracles.stochastic.validateAction({ origin: root.view, productionIncarnation: '2', candidate: { id: 'candidate-a', delta: 0 } });
    const equalSecond = oracles.stochastic.validateAction({ origin: root.view, productionIncarnation: '2', candidate: { id: 'candidate-a', delta: 0 } });
    const equalThird = oracles.stochastic.validateAction({ origin: root.view, productionIncarnation: '2', candidate: { id: 'candidate-a', delta: 0 } });
    const right = oracles.stochastic.validateAction({ origin: root.view, productionIncarnation: '2', candidate: { id: 'candidate-b', delta: 2 } });
    assert.equal(oracles.stochastic.equalAction(left, left, root.view), true);
    assert.equal(oracles.stochastic.equalAction(left, equalSecond, root.view), true);
    assert.equal(oracles.stochastic.equalAction(equalSecond, left, root.view), true);
    assert.equal(oracles.stochastic.equalAction(equalSecond, equalThird, root.view), true);
    assert.equal(oracles.stochastic.equalAction(left, equalThird, root.view), true);
    assert.equal(left.key, right.key);
    assert.equal(oracles.stochastic.equalAction(left, right, root.view), false);
    return { collidingKey: left.key };
  }, ['DOMAIN-ACTION-001']);

  defineCase('domain-stochastic-transition-explicit-input', () => {
    const root = validated(oracles.stochastic, roots.stochasticChance);
    const batch = oracles.stochastic.produceActions({ origin: root.view, sourceId: `${syntheticDomainIds.stochastic}.source-sampled`, cursor: null, capacity: 1, randomInputs: [0.2], productionIncarnation: '3', cancelled: false });
    const request = { origin: root.view, action: batch.actions[0], input: { random: 0.25 }, outputCapacity: 4096, transitionIncarnation: '9', cancelled: false };
    const first = oracles.stochastic.applyTransition(request);
    const second = oracles.stochastic.applyTransition(request);
    assert.deepEqual(second, first);
    assert.equal(first.metadata.consumedRandom, 0.25);
    const missing = { ...request, input: {} };
    assert.throws(() => oracles.stochastic.applyTransition(missing), { code: 'DOMAIN_RANDOM_INPUT' });
    assertNoForeignRuntimeMeaning(first);
    return { successorIdentity: first.successor.identity.verification, metadata: first.metadata };
  }, ['DOMAIN-ACTION-006', 'DOMAIN-TRANSITION-001', 'DOMAIN-TRANSITION-002', 'DOMAIN-TRANSITION-003', 'DOMAIN-TRANSITION-006', 'DOMAIN-TRANSITION-007', 'DOMAIN-TRANSITION-008']);

  defineCase('domain-observation-bearing-transition', () => {
    const root = validated(oracles.stochastic, roots.stochasticObservation);
    const action = oracles.stochastic.validateAction({ origin: root.view, productionIncarnation: '4', candidate: { id: 'observation', delta: 0 } });
    const result = oracles.stochastic.applyTransition({ origin: root.view, action, input: { observation: 'signal' }, outputCapacity: 4096, transitionIncarnation: '10', cancelled: false });
    assert.equal(result.status, 'success');
    assert.deepEqual(result.successor.view.history, { observations: ['prior', 'signal'], steps: 2 });
    assert.equal(result.metadata.publication, 'domain-metadata-only');
    assert.equal(result.successor.role.id, `${syntheticDomainIds.stochastic}.role-custom`);
    assertNoForeignRuntimeMeaning(result);
    return { successorIdentity: result.successor.identity.verification, metadata: result.metadata };
  }, ['DOMAIN-TRANSITION-002', 'DOMAIN-TRANSITION-004', 'DOMAIN-TRANSITION-005', 'DOMAIN-TRANSITION-006', 'DOMAIN-TRANSITION-007']);

  defineCase('domain-custom-role-no-player', () => {
    const root = validated(oracles.lazy, roots.lazyContinuous);
    assert.equal(root.role.category, 'custom');
    assert.equal(root.role.terminal, false);
    assert(!Object.hasOwn(root.role, 'player'));
    assert(!Object.hasOwn(root.role, 'actor'));
    assertNoForeignRuntimeMeaning(root);
    return { role: root.role };
  }, ['DOMAIN-ROLE-001', 'DOMAIN-ROLE-002', 'DOMAIN-ROLE-005']);

  defineCase('domain-terminal-structured-outcome', () => {
    const root = validated(oracles.stochastic, roots.stochasticTerminal);
    const outcome = oracles.stochastic.terminalOutcome(root.view);
    assert.equal(root.role.terminal, true);
    assert.throws(() => oracles.stochastic.produceActions({ origin: root.view, sourceId: `${syntheticDomainIds.stochastic}.source-sampled`, cursor: null, capacity: 1, randomInputs: [0.1], productionIncarnation: '0', cancelled: false }), { code: 'DOMAIN_TERMINAL_ACTION' });
    assert.equal(outcome.kind, 'vector-domain-outcome');
    assert.equal(outcome.coordinates.length, 2);
    assert(!Object.hasOwn(outcome, 'winner'));
    assert(!Object.hasOwn(outcome, 'ranking'));
    return { outcome };
  }, ['DOMAIN-ROLE-003', 'DOMAIN-ROLE-006']);

  defineCase('domain-zero-action-classification', () => {
    const root = validated(oracles.transposing, roots.transposingDeadEnd);
    const result = oracles.transposing.produceActions({ origin: root.view, sourceId: `${syntheticDomainIds.transposing}.source-paged`, cursor: null, capacity: 1, randomInputs: [], productionIncarnation: '0', cancelled: false });
    assert.deepEqual(result, { status: 'no-action-complete', classification: `${syntheticDomainIds.transposing}.dead-end-outcome` });
    assert.equal(root.role.terminal, false);
    return result;
  }, ['DOMAIN-ROLE-004']);

  defineCase('domain-publication-immutability', () => {
    const root = validated(oracles.transposing, roots.transposingAlphaPacked);
    assert(Object.isFrozen(root) && Object.isFrozen(root.view) && Object.isFrozen(root.view.state));
    assert.throws(() => { root.view.state.semantic = 'beta'; }, TypeError);
    const action = firstTransposingAction();
    const result = oracles.transposing.applyTransition({ origin: root.view, action, input: {}, outputCapacity: 4096, transitionIncarnation: '0', cancelled: false });
    assert(Object.isFrozen(result) && Object.isFrozen(result.successor) && Object.isFrozen(result.successor.view.state));
    assert.throws(() => { result.successor.view.state.semantic = 'ghost'; }, TypeError);
    return { rootIdentity: root.identity.verification, successorIdentity: result.successor.identity.verification };
  }, ['DOMAIN-STATE-006', 'DOMAIN-TRANSITION-005']);

  defineCase('domain-capacity-required-no-partial', () => {
    const root = validated(oracles.transposing, roots.transposingAlphaPacked);
    const production = oracles.transposing.produceActions({ origin: root.view, sourceId: `${syntheticDomainIds.transposing}.source-paged`, cursor: null, capacity: 0, randomInputs: [], productionIncarnation: '0', cancelled: false });
    assert.deepEqual(production, { status: 'capacity-required', requiredCapacity: 1, reservationDisposition: 'return-to-owner' });
    const transition = oracles.transposing.applyTransition({ origin: root.view, action: firstTransposingAction(), input: {}, outputCapacity: 0, transitionIncarnation: '0', cancelled: false });
    assert.equal(transition.status, 'capacity-required');
    assert(!Object.hasOwn(transition, 'successor'));
    assert(!Object.hasOwn(transition, 'metadata'));
    return { production, transition };
  }, ['DOMAIN-TRANSITION-001', 'DOMAIN-CLEANUP-001']);

  defineCase('domain-bounded-port-resumption', () => {
    const root = validated(oracles.lazy, roots.lazyContinuous);
    const first = oracles.lazy.produceActions({ origin: root.view, sourceId: `${syntheticDomainIds.lazy}.source-lazy`, cursor: null, capacity: 2, randomInputs: [], productionIncarnation: '5', cancelled: false });
    const second = oracles.lazy.produceActions({ origin: root.view, sourceId: `${syntheticDomainIds.lazy}.source-lazy`, cursor: first.cursor, capacity: 2, randomInputs: [], productionIncarnation: '5', cancelled: false });
    assert.equal(first.actions.length, 2);
    assert.equal(second.actions.length, 2);
    assert.notDeepEqual(first.cursor, second.cursor);
    assert(first.actions.every((action) => !second.actions.some((other) => oracles.lazy.equalAction(action, other, root.view))));
    return { firstCursor: first.cursor, secondCursor: second.cursor };
  }, ['DOMAIN-ACTION-003', 'DOMAIN-ACTION-004', 'DOMAIN-ACTION-008']);

  defineCase('domain-cancellation-no-orphan', () => {
    const root = validated(oracles.transposing, roots.transposingAlphaPacked);
    const production = oracles.transposing.produceActions({ origin: root.view, sourceId: `${syntheticDomainIds.transposing}.source-paged`, cursor: null, capacity: 2, randomInputs: [], productionIncarnation: '0', cancelled: true });
    const transition = oracles.transposing.applyTransition({ origin: root.view, action: firstTransposingAction(), input: {}, outputCapacity: 4096, transitionIncarnation: '0', cancelled: true });
    assert.deepEqual(production, { status: 'cancelled', reservationDisposition: 'return-to-owner' });
    assert.deepEqual(transition, { status: 'cancelled', reservationDisposition: 'return-to-owner' });
    const teardown = oracles.transposing.teardownProfile({
      phase: 'terminal',
      domainMetadata: { profileCache: 'domain-owned' },
      admittedRangeReferences: ['range.domain-state-a', 'range.domain-action-a'],
    });
    assert.deepEqual(teardown, {
      status: 'released',
      released: { admittedRangeReferences: ['range.domain-state-a', 'range.domain-action-a'], domainMetadataEntries: 1 },
      retained: { admittedRangeReferences: 0, domainMetadataEntries: 0 },
      foreignResourceDisposition: 'unchanged-by-domain',
    });
    assert.throws(() => oracles.transposing.teardownProfile({ phase: 'active', domainMetadata: {}, admittedRangeReferences: [] }), { code: 'DOMAIN_TEARDOWN_PHASE' });
    return { production, transition, teardown };
  }, ['DOMAIN-TRANSITION-001', 'DOMAIN-CLEANUP-001', 'DOMAIN-CLEANUP-002']);

  defineCase('domain-path-relation-domain-only', () => {
    const same = validated(oracles.transposing, roots.transposingAlphaRecord);
    const differentHistory = validated(oracles.transposing, roots.transposingAlphaOtherHistory);
    const unrelated = validated(oracles.transposing, roots.transposingBeta);
    assert.equal(oracles.transposing.classifyPathRelation(same.view, same.view), 'relation.same-domain-identity');
    assert.equal(oracles.transposing.classifyPathRelation(same.view, differentHistory.view), 'relation.history-dependent-repeat');
    assert.equal(oracles.transposing.classifyPathRelation(same.view, unrelated.view), 'relation.not-related');
    assert.equal(oracles.transposing.classifyReuse('root-advance'), 'valid');
    assert.equal(oracles.stochastic.classifyReuse('root-advance'), 'resettable');
    return { transposingReuse: 'valid', stochasticReuse: 'resettable' };
  }, ['DOMAIN-HISTORY-004', 'DOMAIN-HISTORY-006', 'DOMAIN-CLEANUP-003']);

  defineCase('domain-product-extension-deletion', () => {
    assert(projection.profiles.every(({ normalized }) => Array.isArray(normalized.productData) && normalized.productData.length === 0));
    const remaining = [
      validated(oracles.transposing, roots.transposingAlphaPacked).role.category,
      validated(oracles.stochastic, roots.stochasticChance).role.category,
      validated(oracles.lazy, roots.lazyContinuous).role.category,
    ];
    assert.deepEqual(remaining, ['decision', 'chance', 'custom']);
    assertNoForeignRuntimeMeaning({ projection: projection.profiles.map(({ id, normalized }) => ({ id, productData: normalized.productData })), remaining });
    return { profiles: projection.profiles.map(({ id }) => id), remaining };
  }, ['DOMAIN-ACTION-011']);

  defineCase('domain-oracle-sensitivity-equality', () => {
    const evidence = assertMutationDetected({
      id: 'mutation.domain-equality',
      baseline: { left: roots.transposingAlphaPacked, right: roots.transposingAlphaRecord, expected: true },
      mutate(candidate) { candidate.right.state.semantic = 'beta'; return candidate; },
      evaluate(candidate) {
        const actual = oracles.transposing.equalState(
          validated(oracles.transposing, candidate.left).view,
          validated(oracles.transposing, candidate.right).view,
        );
        if (actual !== candidate.expected) ownerError('DOMAIN_EQUALITY_EXPECTATION', 'Domain equality expectation was falsified');
      },
      expectedCode: 'DOMAIN_EQUALITY_EXPECTATION',
    });

    const definitions = createSyntheticDomainDefinitions();
    let keyCall = 0;
    const faulty = { ...definitions.get(syntheticDomainIds.transposing), stateKey: () => `identity.unstable-${keyCall++}` };
    const profile = projection.profiles.find(({ id }) => id === syntheticDomainIds.transposing);
    const faultyOracle = createDomainOracle(profile, faulty);
    assert.throws(
      () => faultyOracle.equalState(validated(faultyOracle, roots.transposingAlphaPacked).view, validated(faultyOracle, roots.transposingAlphaRecord).view),
      (error) => error.code === 'DOMAIN_IDENTITY_INCONSISTENT' && error.disposition === 'quarantine-dependent-evidence',
    );
    return evidence;
  }, ['DOMAIN-STATE-002', 'DOMAIN-STATE-003', 'DOMAIN-STATE-007', 'DOMAIN-CLEANUP-004']);

  defineCase('domain-oracle-sensitivity-history', () => assertMutationDetected({
    id: 'mutation.domain-history',
    baseline: { left: roots.transposingAlphaPacked, right: roots.transposingAlphaRecord },
    mutate(candidate) { candidate.right.state.historyTag = 'history.mutated'; return candidate; },
    evaluate(candidate) {
      if (!oracles.transposing.equalState(validated(oracles.transposing, candidate.left).view, validated(oracles.transposing, candidate.right).view)) {
        ownerError('DOMAIN_HISTORY_EXPECTATION', 'Domain history participation was falsified');
      }
    },
    expectedCode: 'DOMAIN_HISTORY_EXPECTATION',
  }), ['DOMAIN-STATE-004', 'DOMAIN-HISTORY-005']);

  defineCase('domain-oracle-sensitivity-action-scope', () => {
    const root = validated(oracles.transposing, roots.transposingAlphaPacked);
    const action = firstTransposingAction();
    return assertMutationDetected({
      id: 'mutation.domain-action-scope',
      baseline: { action, origin: root.view },
      mutate(candidate) { candidate.action.originIdentity = '0'.repeat(64); return candidate; },
      evaluate(candidate) {
        oracles.transposing.applyTransition({ origin: candidate.origin, action: candidate.action, input: {}, outputCapacity: 4096, transitionIncarnation: '0', cancelled: false });
      },
      expectedCode: 'DOMAIN_ACTION_SCOPE',
    });
  }, ['DOMAIN-ACTION-007']);

  defineCase('domain-oracle-sensitivity-random-input', () => {
    const root = validated(oracles.stochastic, roots.stochasticChance);
    const action = oracles.stochastic.produceActions({ origin: root.view, sourceId: `${syntheticDomainIds.stochastic}.source-sampled`, cursor: null, capacity: 1, randomInputs: [0.1], productionIncarnation: '0', cancelled: false }).actions[0];
    return assertMutationDetected({
      id: 'mutation.domain-random-input',
      baseline: { random: 0.25 },
      mutate(candidate) { candidate.random = null; return candidate; },
      evaluate(candidate) {
        oracles.stochastic.applyTransition({ origin: root.view, action, input: candidate, outputCapacity: 4096, transitionIncarnation: '0', cancelled: false });
      },
      expectedCode: 'DOMAIN_RANDOM_INPUT',
    });
  }, ['DOMAIN-ACTION-006', 'DOMAIN-TRANSITION-003', 'DOMAIN-TRANSITION-008']);

  defineCase('domain-requirement-coverage-exact', () => plannedCoverage());
}

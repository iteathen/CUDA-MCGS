import assert from 'node:assert/strict';

import { fail } from './errors.mjs';
import { assertMutationDetected } from './mutation.mjs';
import { runDeclaredSchedule } from './schedule.mjs';
import { createStageOracle, stageAbsenceEvidence } from './stage.mjs';
import { expectCode, profileById, selectedInvocation } from './stage-case-support.mjs';

function composerCaseStatus(composerEvidence, id) {
  const found = composerEvidence.cases?.find((entry) => entry.id === id);
  assert(found, `Composer evidence must contain ${id}`);
  assert.equal(found.status, 'pass', `Composer case ${id} must pass`);
  return found.status;
}

function evaluateDeletion({ selected, firstProductDeleted, absence }) {
  if (!absence || absence.normalized !== null || absence.identity !== null) {
    fail('STAGE_REFERENCE_DELETION_RESIDUE', 'zero-capability Stage substrate must normalize to complete absence');
  }
  if (!selected || !firstProductDeleted || selected.id !== firstProductDeleted.id) {
    fail('STAGE_REFERENCE_DELETION_MEANING', 'first-product deletion must remain within the same normalized Stage profile');
  }
  const selectedExit = selected.surfaces.find(({ id }) => id.endsWith('candidate-exit'));
  const deletedExit = firstProductDeleted.surfaces.find(({ id }) => id.endsWith('candidate-exit'));
  if (!selectedExit || !deletedExit || JSON.stringify(selectedExit.baseContext) !== JSON.stringify(deletedExit.baseContext)) {
    fail('STAGE_REFERENCE_DELETION_MEANING', 'first-product deletion changed surviving checkpoint base context');
  }
  if (JSON.stringify(selected.stages) !== JSON.stringify(firstProductDeleted.stages)) {
    fail('STAGE_REFERENCE_DELETION_MEANING', 'first-product deletion changed Stage operational states');
  }
  const serialized = JSON.stringify(firstProductDeleted);
  if (
    serialized.includes('product-priority')
    || serialized.includes('product-configuration')
    || firstProductDeleted.surfaces.some(({ id }) => id.endsWith('candidate-entry'))
    || firstProductDeleted.capabilities.length >= selected.capabilities.length
    || firstProductDeleted.surfaces.length >= selected.surfaces.length
  ) {
    fail('STAGE_REFERENCE_DELETION_RESIDUE', 'removed product capability left selected Stage residue');
  }
  if (firstProductDeleted.programContribution.sourceIdentity.sha256 === selected.programContribution.sourceIdentity.sha256) {
    fail('STAGE_REFERENCE_DELETION_IDENTITY', 'selected capability deletion must change program contribution identity');
  }
  return true;
}

function scheduleFor(profile, stageProjection, order) {
  const oracle = createStageOracle({ profile });
  const invocations = new Map(order.map((label) => {
    const { input } = selectedInvocation(profile, {
      workItemId: `stage-item.synthetic.${label}`,
      outcomeCode: 'extension-work-complete',
    });
    return [label, input];
  }));
  return {
    oracle,
    schedule: {
      schema: 'cuda-mcgs.reference-declared-schedule/0.1.0',
      evidenceKey: stageProjection.producer.representationCompositionEvidenceKey.sha256,
      id: `schedule.stage.${order.join('-')}`,
      owners: [{ id: 'stage.reference', initialState: oracle.initialState() }],
      events: order.map((label) => ({
        id: `event.stage.${label}`,
        owner: 'stage.reference',
        after: [],
        reads: [],
        input: {
          factId: `stage.reference.fact-${label}`,
          invocation: invocations.get(label),
        },
      })),
    },
  };
}

export function registerStageCases({ defineCase, stageProjection, composerEvidence }) {
  defineCase('stage-pending-releases-worker-lease-and-reservation', () => {
    const profile = profileById(stageProjection, 'extension.synthetic-capability-pair');
    const mutations = [
      ['workerReleased', false],
      ['mutableLeaseReleased', false],
      ['reservationReleased', false],
    ];
    for (const [field, value] of mutations) {
      const { oracle, input } = selectedInvocation(profile, {
        outcomeCode: 'extension-pending',
        outcomeOverrides: { [field]: value },
      });
      const before = oracle.initialState();
      expectCode(() => oracle.apply(before, input), 'STAGE_REFERENCE_PENDING_RELEASE');
      assert.deepEqual(before, oracle.initialState(), `rejected pending ${field} mutation must not change Stage state`);
    }
    return { pendingRejectedWithRetainedOwnership: mutations.map(([field]) => field) };
  }, ['EXT-OUTCOME-']);

  defineCase('stage-declared-outcomes-use-owner-publications', () => {
    const profile = profileById(stageProjection, 'extension.synthetic-capability-pair');
    const observed = [];
    for (let stageIndex = 0; stageIndex < profile.stages.length; stageIndex += 1) {
      const stage = profile.stages[stageIndex];
      const surface = profile.surfaces.find((candidate) => candidate.stage === stage.id);
      assert(surface);
      for (let outcomeIndex = 0; outcomeIndex < surface.outcomes.length; outcomeIndex += 1) {
        const code = surface.outcomes[outcomeIndex];
        const normalized = stage.outcomes.find((candidate) => candidate.code === code);
        assert(normalized);
        const { oracle, input } = selectedInvocation(profile, {
          stageIndex,
          checkpoint: surface.checkpoint,
          workItemId: `stage-item.synthetic.${stageIndex}-${outcomeIndex}`,
          outcomeCode: code,
        });
        const applied = oracle.apply(oracle.initialState(), input);
        assert.equal(applied.result.code, normalized.code);
        assert.equal(applied.result.kind, normalized.kind);
        assert.equal(applied.result.sourceOwner, normalized.sourceOwner);
        assert.equal(applied.result.hostProgressRequired, false);
        assert.equal(applied.result.nativeQualified, false);
        observed.push({ stage: stage.id, surface: surface.id, code, kind: normalized.kind, sourceOwner: normalized.sourceOwner });
      }
    }
    return { outcomes: observed };
  }, ['EXT-OUTCOME-']);

  defineCase('stage-progress-and-resource-boundaries-remain-external', () => {
    const profile = profileById(stageProjection, 'extension.synthetic-capability-pair');
    assert.equal(profile.lifecycle.schedulerOwner, 'SPEC-0012');
    assert.equal(profile.lifecycle.hostProgress, 'none');
    const pending = selectedInvocation(profile, { outcomeCode: 'extension-pending' });
    expectCode(() => pending.oracle.apply(pending.oracle.initialState(), {
      ...pending.input,
      outcome: { ...pending.input.outcome, schedulerDecision: 'scheduler.synthetic.stage-choice' },
    }), 'STAGE_REFERENCE_PROGRESS_BOUNDARY');

    const pressure = selectedInvocation(profile, { outcomeCode: 'extension-pressure' });
    const pressureResult = pressure.oracle.apply(pressure.oracle.initialState(), pressure.input).result;
    assert.equal(pressureResult.kind, 'pressure');
    const pressureOwner = profile.owners.find(({ id }) => id === pressureResult.sourceOwner);
    assert.equal(pressureOwner?.contract?.id, 'SPEC-0011');
    expectCode(() => pressure.oracle.apply(pressure.oracle.initialState(), {
      ...pressure.input,
      outcome: { ...pressure.input.outcome, allocatedOutsidePlan: true },
    }), 'STAGE_REFERENCE_RESOURCE_BOUNDARY');
    return { schedulerOwner: profile.lifecycle.schedulerOwner, pressureOwner: pressureOwner.id, surpriseAllocationRejected: true };
  }, ['EXT-OUTCOME-']);

  defineCase('stage-legal-schedules-preserve-per-item-semantics', () => {
    const profile = profileById(stageProjection, 'extension.synthetic-capability-pair');
    assert(profile.stages.every(({ execution }) => execution.scope === 'per-work-item' && execution.globalBarrier === false && execution.kernelPerStage === false));
    const first = scheduleFor(profile, stageProjection, ['alpha', 'beta']);
    const second = scheduleFor(profile, stageProjection, ['beta', 'alpha']);
    const transition = (oracle) => ({
      'stage.reference': ({ state, input }) => {
        const applied = oracle.apply(state, input.invocation);
        return { state: applied.state, publications: [{ id: input.factId, value: applied.result }] };
      },
    });
    const evidenceKey = stageProjection.producer.representationCompositionEvidenceKey.sha256;
    const resultA = runDeclaredSchedule(first.schedule, transition(first.oracle), evidenceKey);
    const resultB = runDeclaredSchedule(second.schedule, transition(second.oracle), evidenceKey);
    assert.notDeepEqual(resultA.scheduleIdentity, resultB.scheduleIdentity, 'legal schedules must be materially different');
    assert.deepEqual(resultA.terminalStates, resultB.terminalStates, 'independent item ordering must preserve Stage semantic state');
    assert.deepEqual(resultA.facts, resultB.facts, 'independent item ordering must preserve published owner-semantic facts');
    return { schedules: [resultA.scheduleIdentity, resultB.scheduleIdentity], terminalStateInvariant: true, publicationInvariant: true };
  }, ['EXT-OUTCOME-', 'EXT-CONFORMANCE-']);

  defineCase('stage-first-product-deletion-and-zero-capability-absence', () => {
    const selected = profileById(stageProjection, 'extension.synthetic-capability-pair');
    const firstProductDeleted = stageProjection.firstProductDeleted.normalized;
    assert.equal(evaluateDeletion({ selected, firstProductDeleted, absence: stageProjection.absence }), true);
    const absent = stageAbsenceEvidence(stageProjection.absence);
    assert.equal(absent.runtimeResidue, 0);
    assert.equal(absent.hostProgressRequired, false);
    assert.equal(absent.nativeQualified, false);
    for (const id of [
      'stage-first-product-deletion-base-context-stable',
      'stage-first-product-deletion-zero-owned-residue',
      'stage-zero-capability-complete-absence',
    ]) composerCaseStatus(composerEvidence, id);
    return {
      survivingCapabilities: firstProductDeleted.capabilities.map(({ id }) => id),
      survivingSurfaces: firstProductDeleted.surfaces.map(({ id }) => id),
      runtimeResidue: absent.runtimeResidue,
      programIdentityChanged: firstProductDeleted.programContribution.sourceIdentity.sha256 !== selected.programContribution.sourceIdentity.sha256,
    };
  }, ['EXT-CONFORMANCE-']);

  defineCase('stage-mutation-sensitivity-detects-boundary-drift', () => {
    const profile = profileById(stageProjection, 'extension.synthetic-capability-pair');
    const pending = selectedInvocation(profile, { outcomeCode: 'extension-pending' });
    const exit = selectedInvocation(profile, { stageIndex: 1, checkpoint: 'exit', outcomeCode: 'extension-work-complete' });
    assert.equal(exit.input.capabilityOrder.length, 2);
    const runtimeMutations = [
      assertMutationDetected({
        id: 'mutation.stage.checkpoint-stability', baseline: pending.input, expectedCode: 'STAGE_REFERENCE_CHECKPOINT_UNSTABLE',
        evaluate: (input) => pending.oracle.apply(pending.oracle.initialState(), input),
        mutate: (input) => { input.ownerFacts[0].stable = false; return input; },
      }),
      assertMutationDetected({
        id: 'mutation.stage.owner-permission', baseline: pending.input, expectedCode: 'STAGE_REFERENCE_OWNER',
        evaluate: (input) => pending.oracle.apply(pending.oracle.initialState(), input),
        mutate: (input) => { input.ownerFacts[0].sourceOwner = 'owner.synthetic.foreign'; return input; },
      }),
      assertMutationDetected({
        id: 'mutation.stage.capability-order', baseline: exit.input, expectedCode: 'STAGE_REFERENCE_CAPABILITY_ORDER',
        evaluate: (input) => exit.oracle.apply(exit.oracle.initialState(), input),
        mutate: (input) => { input.capabilityOrder.reverse(); return input; },
      }),
      assertMutationDetected({
        id: 'mutation.stage.pending-release', baseline: pending.input, expectedCode: 'STAGE_REFERENCE_PENDING_RELEASE',
        evaluate: (input) => pending.oracle.apply(pending.oracle.initialState(), input),
        mutate: (input) => { input.outcome.workerReleased = false; return input; },
      }),
      assertMutationDetected({
        id: 'mutation.stage.resource-allocation', baseline: pending.input, expectedCode: 'STAGE_REFERENCE_RESOURCE_BOUNDARY',
        evaluate: (input) => pending.oracle.apply(pending.oracle.initialState(), input),
        mutate: (input) => { input.outcome.allocatedOutsidePlan = true; return input; },
      }),
      assertMutationDetected({
        id: 'mutation.stage.order-cycle', baseline: profile, expectedCode: 'STAGE_REFERENCE_CAPABILITY_ORDER',
        evaluate: (candidate) => createStageOracle({ profile: candidate }),
        mutate: (candidate) => {
          const product = candidate.capabilities.find(({ id }) => id.endsWith('product-priority'));
          const audit = candidate.capabilities.find(({ id }) => id.endsWith('audit-consistency'));
          audit.before = [...audit.before, product.id];
          return candidate;
        },
      }),
      assertMutationDetected({
        id: 'mutation.stage.capability-provenance', baseline: profile, expectedCode: 'STAGE_REFERENCE_PROVENANCE',
        evaluate: (candidate) => createStageOracle({ profile: candidate }),
        mutate: (candidate) => { candidate.capabilities[0].provenance.trust = 'explicit-third-party'; return candidate; },
      }),
      assertMutationDetected({
        id: 'mutation.stage.deletion-residue',
        baseline: { selected: profile, firstProductDeleted: stageProjection.firstProductDeleted.normalized, absence: stageProjection.absence },
        expectedCode: 'STAGE_REFERENCE_DELETION_RESIDUE',
        evaluate: evaluateDeletion,
        mutate: (candidate) => {
          candidate.firstProductDeleted.capabilities.push(candidate.selected.capabilities.find(({ id }) => id.endsWith('product-priority')));
          return candidate;
        },
      }),
    ];
    for (const id of [
      'reject-stage-mid-stage-surface',
      'reject-stage-permission-owner-drift',
      'reject-stage-unordered-noncommuting-capabilities',
      'reject-stage-capability-order-cycle',
      'reject-stage-pending-worker-retention',
      'reject-stage-private-cuda-js-requirement',
    ]) composerCaseStatus(composerEvidence, id);
    return { detected: runtimeMutations.map(({ id, detectedCode }) => ({ id, detectedCode })) };
  }, ['EXT-CONFORMANCE-']);

  defineCase('stage-second-profile-remains-semantically-distinct', () => {
    const pairEntry = stageProjection.profiles.find(({ id }) => id === 'extension.synthetic-capability-pair');
    const proofEntry = stageProjection.profiles.find(({ id }) => id === 'extension.synthetic-proof-stage');
    assert(pairEntry && proofEntry);
    assert.notEqual(pairEntry.identity.sha256, proofEntry.identity.sha256);
    assert.notEqual(pairEntry.normalized.generatorIdentity.sha256, proofEntry.normalized.generatorIdentity.sha256);
    assert.equal(pairEntry.normalized.stages.length, 2);
    assert.equal(proofEntry.normalized.stages.length, 1);
    assert.equal(pairEntry.normalized.capabilities.length, 2);
    assert.equal(proofEntry.normalized.capabilities.length, 1);
    assert.deepEqual(pairEntry.normalized.productData, []);
    assert.deepEqual(proofEntry.normalized.productData, []);
    const pair = selectedInvocation(pairEntry.normalized, { outcomeCode: 'extension-work-complete' });
    const proof = selectedInvocation(proofEntry.normalized, { outcomeCode: 'extension-work-complete' });
    const pairResult = pair.oracle.apply(pair.oracle.initialState(), pair.input).result;
    const proofResult = proof.oracle.apply(proof.oracle.initialState(), proof.input).result;
    assert.notEqual(pairResult.kind, proofResult.kind, 'second profile must exercise a materially distinct Stage graph');
    composerCaseStatus(composerEvidence, 'stage-profile-second-instance-distinct');
    return { pair: { stages: 2, capabilities: 2, result: pairResult.kind }, proof: { stages: 1, capabilities: 1, result: proofResult.kind } };
  }, ['EXT-CONFORMANCE-', 'EXT-OUTCOME-']);

  defineCase('stage-portable-reference-does-not-claim-native-support', () => {
    const results = [];
    for (const entry of stageProjection.profiles) {
      const profile = entry.normalized;
      assert.equal(profile.programContribution.language, 'restricted-device-js');
      assert.equal(profile.programContribution.runtimeRegistry, false);
      assert.equal(profile.programContribution.nativeArtifacts, false);
      assert(profile.programContribution.requirements.every(({ id }) => id.startsWith('cuda-js.')));
      assert(profile.capabilities.every(({ provenance }) => provenance.origin === 'first-party' && provenance.trust === 'first-party-reviewed'));
      assert(profile.stages.every(({ execution }) => execution.globalBarrier === false && execution.kernelPerStage === false));
      const invocation = selectedInvocation(profile, { outcomeCode: 'extension-work-complete' });
      const result = invocation.oracle.apply(invocation.oracle.initialState(), invocation.input).result;
      assert.equal(result.hostProgressRequired, false);
      assert.equal(result.nativeQualified, false);
      results.push({ id: profile.id, nativeQualified: result.nativeQualified, language: profile.programContribution.language });
    }
    composerCaseStatus(composerEvidence, 'stage-program-public-js-boundary');
    return { profiles: results, nativeQualificationDeferred: true };
  }, ['EXT-CONFORMANCE-']);
}

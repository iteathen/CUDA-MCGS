import assert from 'node:assert/strict';

import { createStageOracle } from './stage.mjs';

export function profileById(projection, id) {
  const entry = projection.profiles.find((candidate) => candidate.id === id);
  assert(entry, `missing Stage profile ${id}`);
  return entry.normalized;
}

export function selectedInvocation(profile, { stageIndex = 0, checkpoint = null, workItemId = 'stage-item.synthetic.alpha', generation = '1', outcomeCode = 'extension-pending', outcomeOverrides = {} } = {}) {
  const stage = profile.stages[stageIndex];
  assert(stage);
  const surface = profile.surfaces.find((candidate) => candidate.stage === stage.id && (checkpoint === null || candidate.checkpoint === checkpoint));
  assert(surface);
  const oracle = createStageOracle({ profile });
  const normalizedOutcome = stage.outcomes.find(({ code }) => code === outcomeCode);
  assert(normalizedOutcome);
  const ownerFacts = surface.baseContext.map((field) => ({ id: field.id, sourceOwner: field.sourceOwner, stable: true, value: { identity: `${field.id}.public` } }));
  return {
    oracle,
    input: {
      stageId: stage.id,
      surfaceId: surface.id,
      checkpoint: surface.checkpoint,
      workItemId,
      generation,
      ownerFacts,
      capabilityOrder: oracle.capabilityOrder(surface.id),
      outcome: {
        code: normalizedOutcome.code,
        sourceOwner: normalizedOutcome.sourceOwner,
        stable: true,
        workerReleased: true,
        mutableLeaseReleased: true,
        reservationReleased: true,
        unpublishedMutation: false,
        allocatedOutsidePlan: false,
        schedulerDecision: null,
        ...outcomeOverrides,
      },
    },
  };
}

export function expectCode(body, code) {
  let error = null;
  try { body(); } catch (candidate) { error = candidate; }
  assert(error, `expected ${code}`);
  assert.equal(error.code, code);
  return error;
}

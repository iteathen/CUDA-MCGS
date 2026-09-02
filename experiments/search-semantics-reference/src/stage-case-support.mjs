import assert from 'node:assert/strict';

import { createStageOracle } from './stage.mjs';

export function profileById(projection, id) {
  const entry = projection.profiles.find((candidate) => candidate.id === id);
  assert(entry, `missing Stage profile ${id}`);
  return entry.normalized;
}

export function selectedInvocation(profile, { stageIndex = null, checkpoint = null, workItemId = 'stage-item.synthetic.alpha', generation = '1', outcomeCode = 'extension-pending', outcomeOverrides = {} } = {}) {
  let surface = checkpoint === null ? null : profile.surfaces.find((candidate) => candidate.checkpoint === checkpoint);
  let stage = surface ? profile.stages.find((candidate) => candidate.id === surface.stage) : null;
  if (!stage) {
    stage = stageIndex === null
      ? profile.stages.find((candidate) => candidate.id === profile.entryStage)
      : profile.stages[stageIndex];
  }
  assert(stage);
  if (!surface) surface = profile.surfaces.find((candidate) => candidate.stage === stage.id);
  assert(surface);
  assert.equal(surface.stage, stage.id, 'selected Stage surface must belong to the selected semantic stage');
  const oracle = createStageOracle({ profile });
  const normalizedOutcome = stage.outcomes.find(({ code }) => code === outcomeCode);
  assert(normalizedOutcome);
  assert(surface.outcomes.includes(normalizedOutcome.code), 'selected Stage outcome must be published at the selected surface');
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

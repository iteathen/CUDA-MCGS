import { canonicalClone, frozenCanonicalClone } from './canonical.mjs';
import { assertNamespacedId, compareRaw, exactKeys, fail } from './errors.mjs';

const text = (value, code, label) => {
  if (typeof value !== 'string' || value.length === 0) fail(code, `${label} must be a non-empty string`);
  return value;
};

function orderedCapabilities(profile, surfaceId) {
  const selected = profile.capabilities.filter(({ bindings }) => bindings.includes(surfaceId));
  const selectedIds = new Set(selected.map(({ id }) => id));
  for (const capability of selected) {
    if (capability.provenance?.origin !== 'first-party' || capability.provenance?.trust !== 'first-party-reviewed') {
      fail('STAGE_REFERENCE_PROVENANCE', `${capability.id} lacks reviewed capability provenance`);
    }
  }
  const edges = new Map(selected.map(({ id }) => [id, new Set()]));
  for (const capability of selected) {
    for (const target of capability.before ?? []) if (selectedIds.has(target)) edges.get(capability.id).add(target);
    for (const source of capability.after ?? []) if (selectedIds.has(source)) edges.get(source).add(capability.id);
  }
  const indegree = new Map(selected.map(({ id }) => [id, 0]));
  for (const targets of edges.values()) for (const target of targets) indegree.set(target, indegree.get(target) + 1);
  const ready = [...indegree].filter(([, degree]) => degree === 0).map(([id]) => id).sort(compareRaw);
  const ordered = [];
  while (ready.length > 0) {
    const id = ready.shift();
    ordered.push(id);
    for (const target of [...edges.get(id)].sort(compareRaw)) {
      indegree.set(target, indegree.get(target) - 1);
      if (indegree.get(target) === 0) {
        ready.push(target);
        ready.sort(compareRaw);
      }
    }
  }
  if (ordered.length !== selected.length) fail('STAGE_REFERENCE_CAPABILITY_ORDER', `${surfaceId} capability order contains a cycle`);
  return ordered;
}

function normalizeState(state, profileId) {
  exactKeys(state, ['invocations', 'items', 'profileId'], 'STAGE_REFERENCE_STATE', 'Stage state');
  if (state.profileId !== profileId || !Array.isArray(state.items) || typeof state.invocations !== 'string' || !/^(0|[1-9][0-9]*)$/.test(state.invocations)) {
    fail('STAGE_REFERENCE_STATE', 'Stage state does not match the selected profile');
  }
  return canonicalClone(state, 'Stage state');
}

function ownerFactMap(input) {
  if (!Array.isArray(input)) fail('STAGE_REFERENCE_FACT', 'ownerFacts must be an array');
  const facts = new Map();
  for (const [index, fact] of input.entries()) {
    exactKeys(fact, ['id', 'sourceOwner', 'stable', 'value'], 'STAGE_REFERENCE_FACT', `owner fact ${index}`);
    assertNamespacedId(fact.id, 'STAGE_REFERENCE_FACT', `owner fact ${index} id`);
    if (facts.has(fact.id)) fail('STAGE_REFERENCE_FACT', `duplicate owner fact ${fact.id}`);
    facts.set(fact.id, fact);
  }
  return facts;
}

export function createStageOracle({ profile } = {}) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) fail('STAGE_REFERENCE_PROFILE', 'normalized selected Stage profile is required');
  if (profile.lifecycle?.schedulerOwner !== 'SPEC-0012' || profile.lifecycle?.hostProgress !== 'none' || profile.lifecycle?.runtimeDiscovery !== false) {
    fail('STAGE_REFERENCE_PROGRESS_BOUNDARY', 'Stage lifecycle must delegate scheduling to SPEC-0012 without host/runtime discovery');
  }
  if (profile.programContribution?.language !== 'restricted-device-js' || profile.programContribution?.runtimeRegistry !== false || profile.programContribution?.nativeArtifacts !== false) {
    fail('STAGE_REFERENCE_NATIVE_BOUNDARY', 'Stage reference consumes restricted Device-JS semantics only and cannot claim native artifacts');
  }
  const stages = new Map(profile.stages.map((entry) => [entry.id, entry]));
  const surfaces = new Map(profile.surfaces.map((entry) => [entry.id, entry]));
  const owners = new Map(profile.owners.map((entry) => [entry.id, entry]));
  const orders = new Map(profile.surfaces.map((surface) => [surface.id, orderedCapabilities(profile, surface.id)]));

  function initialState() {
    return frozenCanonicalClone({ profileId: profile.id, invocations: '0', items: [] }, 'initial Stage state');
  }

  function apply(stateInput, input) {
    const state = normalizeState(stateInput, profile.id);
    exactKeys(input, ['capabilityOrder', 'checkpoint', 'generation', 'outcome', 'ownerFacts', 'stageId', 'surfaceId', 'workItemId'], 'STAGE_REFERENCE_INPUT', 'Stage invocation');
    const stageId = assertNamespacedId(input.stageId, 'STAGE_REFERENCE_STAGE', 'stageId');
    const surfaceId = assertNamespacedId(input.surfaceId, 'STAGE_REFERENCE_SURFACE', 'surfaceId');
    const workItemId = assertNamespacedId(input.workItemId, 'STAGE_REFERENCE_ITEM', 'workItemId');
    const generation = text(input.generation, 'STAGE_REFERENCE_GENERATION', 'generation');
    const stage = stages.get(stageId);
    const surface = surfaces.get(surfaceId);
    if (!stage || !surface || surface.stage !== stageId || surface.checkpoint !== input.checkpoint || !['entry', 'exit'].includes(input.checkpoint)) {
      fail('STAGE_REFERENCE_CHECKPOINT', 'invocation must target one selected stable entry/exit surface');
    }
    const facts = ownerFactMap(input.ownerFacts);
    for (const field of surface.baseContext) {
      const fact = facts.get(field.id);
      if (!fact || fact.sourceOwner !== field.sourceOwner) fail('STAGE_REFERENCE_OWNER', `${field.id} must come from its declared source owner`);
      if (fact.stable !== true) fail('STAGE_REFERENCE_CHECKPOINT_UNSTABLE', `${field.id} is not stable at checkpoint invocation`);
    }
    const expectedOrder = orders.get(surfaceId);
    if (!Array.isArray(input.capabilityOrder) || input.capabilityOrder.length !== expectedOrder.length || input.capabilityOrder.some((id, index) => id !== expectedOrder[index])) {
      fail('STAGE_REFERENCE_CAPABILITY_ORDER', `${surfaceId} capability execution differs from normalized deterministic order`);
    }
    exactKeys(input.outcome, ['allocatedOutsidePlan', 'code', 'mutableLeaseReleased', 'reservationReleased', 'schedulerDecision', 'sourceOwner', 'stable', 'unpublishedMutation', 'workerReleased'], 'STAGE_REFERENCE_OUTCOME', 'owner outcome');
    const outcome = stage.outcomes.find(({ code }) => code === input.outcome.code);
    if (!outcome || !surface.outcomes.includes(outcome.code)) fail('STAGE_REFERENCE_OUTCOME', `${input.outcome.code} is not a selected Stage outcome`);
    if (input.outcome.sourceOwner !== outcome.sourceOwner || !owners.has(input.outcome.sourceOwner)) fail('STAGE_REFERENCE_OWNER', 'outcome must be published by its normalized source owner');
    if (input.outcome.stable !== true || input.outcome.unpublishedMutation !== false) fail('STAGE_REFERENCE_CHECKPOINT_UNSTABLE', 'outcome cannot publish success over unstable/unpublished mutation');
    if (input.outcome.allocatedOutsidePlan !== false) fail('STAGE_REFERENCE_RESOURCE_BOUNDARY', 'Stage cannot allocate outside the composed resource plan');
    if (input.outcome.schedulerDecision !== null) fail('STAGE_REFERENCE_PROGRESS_BOUNDARY', 'Stage cannot choose global scheduling/fairness');
    if (outcome.kind === 'pressure' && owners.get(outcome.sourceOwner)?.contract?.id !== 'SPEC-0011') {
      fail('STAGE_REFERENCE_RESOURCE_BOUNDARY', 'pressure must be a Resource-owner outcome');
    }
    if (['pending', 'retry'].includes(outcome.kind) && (input.outcome.workerReleased !== true || input.outcome.mutableLeaseReleased !== true || input.outcome.reservationReleased !== true)) {
      fail('STAGE_REFERENCE_PENDING_RELEASE', 'pending/retry must release worker, mutable lease and reservation before publication');
    }

    const itemIndex = state.items.findIndex(({ id }) => id === workItemId);
    if (itemIndex !== -1 && state.items[itemIndex].generation !== generation) fail('STAGE_REFERENCE_STALE', `${workItemId} generation changed inside one Stage reference lifetime`);
    const item = {
      id: workItemId,
      generation,
      stageId: outcome.target ?? stageId,
      disposition: outcome.kind,
      outcome: outcome.code,
      workerHeld: input.outcome.workerReleased !== true,
      mutableLeaseHeld: input.outcome.mutableLeaseReleased !== true,
      reservationHeld: input.outcome.reservationReleased !== true,
    };
    if (itemIndex === -1) state.items.push(item); else state.items[itemIndex] = item;
    state.items.sort((left, right) => compareRaw(left.id, right.id));
    state.invocations = (BigInt(state.invocations) + 1n).toString();
    const result = frozenCanonicalClone({
      kind: outcome.kind,
      code: outcome.code,
      sourceOwner: outcome.sourceOwner,
      target: outcome.target,
      workItemId,
      generation,
      capabilityOrder: expectedOrder,
      schedulerOwner: profile.lifecycle.schedulerOwner,
      hostProgressRequired: false,
      nativeQualified: false,
    }, 'Stage invocation result');
    return { state: frozenCanonicalClone(state, 'next Stage state'), result };
  }

  return Object.freeze({ profile, initialState, apply, capabilityOrder: (surfaceId) => [...(orders.get(surfaceId) ?? [])] });
}

export function stageAbsenceEvidence(absence) {
  if (!absence || absence.normalized !== null || absence.identity !== null) fail('STAGE_REFERENCE_ABSENCE', 'zero-capability Stage projection must be complete absence');
  return frozenCanonicalClone({ kind: 'absent', runtimeResidue: 0, hostProgressRequired: false, nativeQualified: false }, 'Stage absence evidence');
}

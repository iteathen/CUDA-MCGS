import { canonicalClone, canonicalIdentity, frozenCanonicalClone } from './canonical.mjs';
import { assertUniqueStrings, exactKeys, fail } from './errors.mjs';

function freeze(value, label) {
  return frozenCanonicalClone(value, label);
}

function decimal(value, code, label) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) fail(code, `${label} must be a canonical decimal string`);
  return BigInt(value);
}

function toDecimal(value) {
  return BigInt(value).toString();
}

function resourceMaximum(profile, suffix) {
  const resource = profile.resources.find(({ id }) => id.endsWith(suffix));
  if (!resource) fail('GRAPH_EDGE_PROFILE', `Graph profile lacks ${suffix}`);
  return decimal(resource.maximum, 'GRAPH_EDGE_PROFILE', `${resource.id} maximum`);
}

function layoutFor(profile, role) {
  const object = profile.objectKinds.find((entry) => entry.role === role);
  if (!object) fail('GRAPH_EDGE_PROFILE', `Graph profile lacks ${role} object kind`);
  const layout = profile.layouts.find(({ objectKind }) => objectKind === object.id);
  if (!layout) fail('GRAPH_EDGE_PROFILE', `Graph profile lacks ${role} layout`);
  return { object, layout };
}

function lifecycleStates(object) {
  return new Set(object.lifecycle.states.map((value) => value.slice(value.lastIndexOf('state-') + 6)));
}

function validateLifecycle(object, required, label) {
  const states = lifecycleStates(object);
  for (const state of required) if (!states.has(state)) fail('GRAPH_EDGE_PROFILE', `${label} lifecycle lacks ${state}`);
}

function referenceKey(reference) {
  return canonicalIdentity(reference, 'Graph node reference').sha256;
}

function edgePublic(edge) {
  return {
    id: edge.id,
    identity: canonicalClone(edge.identity),
    parent: canonicalClone(edge.parent),
    expansionId: edge.expansionId,
    state: edge.state,
    occurrence: edge.occurrence,
    actionIdentity: canonicalClone(edge.actionIdentity),
    child: edge.child === null ? null : canonicalClone(edge.child),
    pendingChild: edge.pendingChild === null ? null : canonicalClone(edge.pendingChild),
    batchId: edge.batchId,
    batchPublished: edge.batchPublished,
    reservationDisposition: edge.reservationDisposition,
    failure: edge.failure,
  };
}

function expansionPublic(expansion) {
  return {
    id: expansion.id,
    parent: canonicalClone(expansion.parent),
    generation: expansion.generation,
    claimer: expansion.claimer,
    state: expansion.state,
    batches: canonicalClone(expansion.batches),
    failure: expansion.failure,
  };
}

export function createGraphEdgeOracle({
  profile,
  validateNodeReference,
  resolveChild,
  actionIdentity,
  equalAction,
  multiplicityRule,
  admission = {},
  mutations = {},
} = {}) {
  if (profile === null || typeof profile !== 'object' || profile.mode !== 'materialized') fail('GRAPH_EDGE_PROFILE', 'materialized normalized Graph profile is required');
  for (const [name, value] of Object.entries({ validateNodeReference, resolveChild, actionIdentity, equalAction, multiplicityRule })) {
    if (typeof value !== 'function') fail('GRAPH_EDGE_PORT', `${name} must be a function`);
  }

  const { object: edgeObject, layout: edgeLayout } = layoutFor(profile, 'parent-edge');
  const { object: expansionObject, layout: expansionLayout } = layoutFor(profile, 'expansion');
  validateLifecycle(edgeObject, ['free', 'reserved', 'action-ready', 'child-pending', 'ready', 'failed'], 'parent-edge');
  validateLifecycle(expansionObject, ['unexpanded', 'claimed', 'open', 'complete', 'failed', 'cancelled'], 'expansion');

  const profileEdgeSlots = resourceMaximum(profile, 'resource-edge-slots');
  const profileActionBytes = resourceMaximum(profile, 'resource-action-bytes');
  const expansionCapacity = decimal(expansionLayout.capacity, 'GRAPH_EDGE_PROFILE', `${expansionLayout.id} capacity`);
  const limits = {
    edgeSlots: admission.edgeSlots === undefined ? profileEdgeSlots : decimal(admission.edgeSlots, 'GRAPH_EDGE_ADMISSION', 'edgeSlots'),
    actionBytes: admission.actionBytes === undefined ? profileActionBytes : decimal(admission.actionBytes, 'GRAPH_EDGE_ADMISSION', 'actionBytes'),
  };
  if (limits.edgeSlots > profileEdgeSlots || limits.actionBytes > profileActionBytes || limits.edgeSlots === 0n || limits.actionBytes === 0n) {
    fail('GRAPH_EDGE_ADMISSION', 'test admission plan exceeds or eliminates normalized Graph capacity');
  }

  const expansions = [];
  const edges = [];
  const events = [];
  const ledger = { edgeSlots: 0n, actionBytes: 0n };
  let eventSequence = 0n;

  const emit = (type, ownerId, detail = null) => {
    events.push(freeze({ sequence: toDecimal(eventSequence++), type, ownerId, detail }, 'Graph EDGE event'));
  };

  const validateReadyNode = (reference, label) => {
    const result = validateNodeReference(freeze(reference, label));
    if (result?.kind !== 'ready' || result.reference === undefined || referenceKey(result.reference) !== referenceKey(reference)) {
      fail('GRAPH_EDGE_NODE_REFERENCE', `${label} is not a ready typed node reference`);
    }
    return freeze(result.reference, label);
  };

  const findExpansion = (id) => {
    const expansion = expansions.find((entry) => entry.id === id);
    if (!expansion) fail('GRAPH_EDGE_EXPANSION', `unknown expansion ${id}`);
    return expansion;
  };

  const findEdge = (id) => {
    const edge = edges.find((entry) => entry.id === id);
    if (!edge) fail('GRAPH_EDGE_EDGE', `unknown edge ${id}`);
    return edge;
  };

  const assertClaimer = (expansion, claimer) => {
    if (expansion.claimer !== claimer) fail('GRAPH_EDGE_EXPANSION_OWNER', `${claimer} does not own ${expansion.id}`);
  };

  function claimExpansion(input) {
    exactKeys(input, ['claimer', 'generation', 'parent'], 'GRAPH_EDGE_CLAIM_FIELDS', 'claimExpansion input');
    if (typeof input.claimer !== 'string' || input.claimer.length === 0 || typeof input.generation !== 'string' || !/^(0|[1-9][0-9]*)$/.test(input.generation)) {
      fail('GRAPH_EDGE_EXPANSION_INPUT', 'claimer and canonical generation are required');
    }
    const parent = validateReadyNode(input.parent, 'expansion parent');
    const parentKey = referenceKey(parent);
    const existing = expansions.find((entry) => entry.parentKey === parentKey && entry.generation === input.generation);
    if (existing) {
      if (['claimed', 'open'].includes(existing.state)) return { kind: 'pending', expansionId: existing.id, state: existing.state };
      return { kind: 'terminal', expansionId: existing.id, state: existing.state, failure: existing.failure };
    }
    if (BigInt(expansions.length) >= expansionCapacity) return { kind: 'pressure', code: 'edge-capacity' };
    const expansion = {
      id: `expansion.${expansions.length}`,
      parent,
      parentKey,
      generation: input.generation,
      claimer: input.claimer,
      state: 'claimed',
      batches: [],
      failure: null,
    };
    expansions.push(expansion);
    emit('expansion-claimed', expansion.id, { claimer: expansion.claimer, generation: expansion.generation });
    return { kind: 'initializer', expansionId: expansion.id };
  }

  function openExpansion(input) {
    exactKeys(input, ['claimer', 'expansionId'], 'GRAPH_EDGE_OPEN_FIELDS', 'openExpansion input');
    const expansion = findExpansion(input.expansionId);
    assertClaimer(expansion, input.claimer);
    if (expansion.state !== 'claimed') fail('GRAPH_EDGE_EXPANSION_STATE', `${expansion.id} is not claimed`);
    expansion.state = 'open';
    emit('expansion-open', expansion.id);
    return expansionPublic(expansion);
  }

  function reserveEdge(input) {
    exactKeys(input, ['action', 'actionBytes', 'claimer', 'expansionId', 'occurrence'], 'GRAPH_EDGE_RESERVE_FIELDS', 'reserveEdge input');
    const expansion = findExpansion(input.expansionId);
    assertClaimer(expansion, input.claimer);
    if (expansion.state !== 'open') fail('GRAPH_EDGE_EXPANSION_STATE', `${expansion.id} is not open`);
    const action = freeze(input.action, 'Graph EDGE action candidate');
    const bytes = decimal(input.actionBytes, 'GRAPH_EDGE_ACTION_BYTES', 'actionBytes');
    if (bytes === 0n) fail('GRAPH_EDGE_ACTION_BYTES', 'actionBytes must be positive');
    const identity = freeze(actionIdentity({ parent: canonicalClone(expansion.parent), action: canonicalClone(action), occurrence: input.occurrence }), 'Graph EDGE action identity');
    const multiplicity = multiplicityRule({ parent: canonicalClone(expansion.parent), expansionId: expansion.id, action: canonicalClone(action), actionIdentity: canonicalClone(identity) });
    if (!['unique', 'repeatable'].includes(multiplicity)) fail('GRAPH_EDGE_MULTIPLICITY', 'multiplicityRule must return unique or repeatable');
    if (multiplicity === 'repeatable' && (typeof input.occurrence !== 'string' || input.occurrence.length === 0)) fail('GRAPH_EDGE_OCCURRENCE', 'repeatable action requires an occurrence identity');
    if (multiplicity === 'unique' && input.occurrence !== null) fail('GRAPH_EDGE_OCCURRENCE', 'unique action occurrence must be null');

    const existing = edges.filter((edge) => edge.expansionId === expansion.id && edge.state !== 'failed' && edge.reservationDisposition !== 'rolled-back');
    if (multiplicity === 'unique' && existing.some((edge) => equalAction(canonicalClone(action), canonicalClone(edge.action), canonicalClone(expansion.parent)))) {
      fail('GRAPH_EDGE_DUPLICATE_ACTION', 'duplicate equal action in unique-action expansion');
    }
    if (multiplicity === 'repeatable' && existing.some((edge) => edge.occurrence === input.occurrence && equalAction(canonicalClone(action), canonicalClone(edge.action), canonicalClone(expansion.parent)))) {
      fail('GRAPH_EDGE_DUPLICATE_OCCURRENCE', 'repeatable action occurrence identity must be unique');
    }
    if (ledger.edgeSlots + 1n > limits.edgeSlots) return { kind: 'pressure', code: 'edge-capacity' };
    if (ledger.actionBytes + bytes > limits.actionBytes) return { kind: 'pressure', code: 'action-byte-capacity' };

    const identitySubject = mutations.omitParentFromEdgeIdentity === true
      ? { action: identity, multiplicity, occurrence: input.occurrence }
      : { parent: expansion.parent, action: identity, multiplicity, occurrence: input.occurrence };
    const edge = {
      id: `edge.${edges.length}`,
      identity: canonicalIdentity(identitySubject, 'Graph parent-edge identity'),
      parent: expansion.parent,
      parentKey: expansion.parentKey,
      expansionId: expansion.id,
      action,
      actionBytes: bytes,
      actionIdentity: identity,
      multiplicity,
      occurrence: input.occurrence,
      state: 'reserved',
      child: null,
      pendingChild: null,
      batchId: null,
      batchPublished: false,
      reservationDisposition: 'held',
      failure: null,
    };
    edges.push(edge);
    ledger.edgeSlots += 1n;
    ledger.actionBytes += bytes;
    emit('edge-reserved', edge.id, { expansionId: edge.expansionId, identity: edge.identity });
    return { kind: 'reserved', edgeId: edge.id, identity: canonicalClone(edge.identity) };
  }

  function publishEdgeAction(input) {
    exactKeys(input, ['claimer', 'edgeId'], 'GRAPH_EDGE_ACTION_FIELDS', 'publishEdgeAction input');
    const edge = findEdge(input.edgeId);
    const expansion = findExpansion(edge.expansionId);
    assertClaimer(expansion, input.claimer);
    if (edge.state !== 'reserved') fail('GRAPH_EDGE_STATE', `${edge.id} is not reserved`);
    edge.state = 'action-ready';
    emit('edge-action-ready', edge.id);
    return edgePublic(edge);
  }

  function resolveEdgeChild(input) {
    exactKeys(input, ['claimer', 'edgeId', 'input'], 'GRAPH_EDGE_CHILD_FIELDS', 'resolveEdgeChild input');
    const edge = findEdge(input.edgeId);
    const expansion = findExpansion(edge.expansionId);
    assertClaimer(expansion, input.claimer);
    if (!['action-ready', 'child-pending'].includes(edge.state)) fail('GRAPH_EDGE_ACTION_NOT_READY', `${edge.id} action is not consumable`);
    const resolution = resolveChild({
      parent: canonicalClone(edge.parent),
      action: canonicalClone(edge.action),
      occurrence: edge.occurrence,
      input: freeze(input.input, 'Graph child-resolution input'),
    });
    if (resolution?.kind === 'pressure') return { kind: 'pressure', code: resolution.code };
    if (resolution?.kind === 'failure') {
      failEdge({ claimer: input.claimer, edgeId: edge.id, code: resolution.code });
      return { kind: 'failed', edgeId: edge.id, code: resolution.code };
    }
    if (resolution?.kind === 'pending') {
      if (resolution.reference === undefined) fail('GRAPH_EDGE_CHILD_RESOLUTION', 'pending child resolution requires a typed reference');
      edge.state = 'child-pending';
      edge.pendingChild = freeze(resolution.reference, 'pending child reference');
      if (mutations.publishPendingChild === true) edge.child = freeze(resolution.reference, 'premature child reference');
      emit('edge-child-pending', edge.id, { reference: edge.pendingChild });
      return { kind: 'pending', edgeId: edge.id, reference: canonicalClone(edge.pendingChild) };
    }
    if (resolution?.kind !== 'ready' || resolution.reference === undefined) fail('GRAPH_EDGE_CHILD_RESOLUTION', 'child resolver returned an invalid outcome');
    const child = validateReadyNode(resolution.reference, 'resolved child');
    edge.pendingChild = null;
    edge.child = child;
    edge.state = 'ready';
    emit('edge-ready', edge.id, { child });
    return { kind: 'ready', edgeId: edge.id, child: canonicalClone(child) };
  }

  function publishExpansionBatch(input) {
    exactKeys(input, ['batchId', 'claimer', 'edgeIds', 'expansionId', 'producer'], 'GRAPH_EDGE_BATCH_FIELDS', 'publishExpansionBatch input');
    const expansion = findExpansion(input.expansionId);
    assertClaimer(expansion, input.claimer);
    if (expansion.state !== 'open') fail('GRAPH_EDGE_EXPANSION_STATE', `${expansion.id} is not open`);
    if (typeof input.batchId !== 'string' || input.batchId.length === 0 || expansion.batches.some(({ id }) => id === input.batchId)) fail('GRAPH_EDGE_BATCH_ID', 'batchId must be unique and non-empty');
    const edgeIds = assertUniqueStrings(input.edgeIds, 'GRAPH_EDGE_BATCH_EDGES', 'batch edgeIds');
    if (edgeIds.length === 0) fail('GRAPH_EDGE_BATCH_EDGES', 'batch must contain at least one complete edge record');
    const batchEdges = edgeIds.map(findEdge);
    const invalid = batchEdges.find((edge) => edge.expansionId !== expansion.id || edge.batchPublished || !['action-ready', 'child-pending', 'ready'].includes(edge.state));
    if (invalid && mutations.allowPartialBatch !== true) fail('GRAPH_EDGE_BATCH_INCOMPLETE', `batch includes incomplete or foreign edge ${invalid.id}`);
    const publishable = mutations.allowPartialBatch === true ? batchEdges.filter((edge) => edge.expansionId === expansion.id && !edge.batchPublished && ['action-ready', 'child-pending', 'ready'].includes(edge.state)) : batchEdges;
    if (publishable.length !== batchEdges.length && mutations.allowPartialBatch !== true) fail('GRAPH_EDGE_BATCH_INCOMPLETE', 'batch publication is not complete');
    const batch = freeze({ id: input.batchId, edgeIds: publishable.map(({ id }) => id), generation: expansion.generation, producer: input.producer, status: 'ready' }, 'Graph expansion batch');
    for (const edge of publishable) {
      edge.batchId = input.batchId;
      edge.batchPublished = true;
      edge.reservationDisposition = 'published';
    }
    expansion.batches.push(batch);
    emit('expansion-batch-ready', expansion.id, { batchId: input.batchId, edgeIds: batch.edgeIds });
    return canonicalClone(batch);
  }

  function completeExpansion(input) {
    exactKeys(input, ['claimer', 'expansionId'], 'GRAPH_EDGE_COMPLETE_FIELDS', 'completeExpansion input');
    const expansion = findExpansion(input.expansionId);
    assertClaimer(expansion, input.claimer);
    if (expansion.state !== 'open') fail('GRAPH_EDGE_EXPANSION_STATE', `${expansion.id} is not open`);
    if (edges.some((edge) => edge.expansionId === expansion.id && edge.reservationDisposition === 'held' && edge.state !== 'failed')) {
      fail('GRAPH_EDGE_EXPANSION_INCOMPLETE', `${expansion.id} has unpublished edge reservations`);
    }
    expansion.state = 'complete';
    emit('expansion-complete', expansion.id);
    return expansionPublic(expansion);
  }

  function failEdge(input) {
    exactKeys(input, ['claimer', 'code', 'edgeId'], 'GRAPH_EDGE_FAIL_FIELDS', 'failEdge input');
    const edge = findEdge(input.edgeId);
    const expansion = findExpansion(edge.expansionId);
    assertClaimer(expansion, input.claimer);
    if (!['reserved', 'action-ready', 'child-pending'].includes(edge.state)) fail('GRAPH_EDGE_STATE', `${edge.id} cannot fail from ${edge.state}`);
    edge.state = 'failed';
    edge.child = null;
    edge.pendingChild = null;
    edge.failure = input.code;
    if (!edge.batchPublished && edge.reservationDisposition === 'held') {
      ledger.edgeSlots -= 1n;
      ledger.actionBytes -= edge.actionBytes;
      edge.reservationDisposition = 'rolled-back';
    } else {
      edge.reservationDisposition = 'published-failed';
    }
    emit('edge-failed', edge.id, { code: input.code, disposition: edge.reservationDisposition });
    return { kind: 'failed', edgeId: edge.id, code: input.code };
  }

  function failExpansion(input) {
    exactKeys(input, ['cancelled', 'claimer', 'code', 'expansionId'], 'GRAPH_EDGE_EXPANSION_FAIL_FIELDS', 'failExpansion input');
    const expansion = findExpansion(input.expansionId);
    assertClaimer(expansion, input.claimer);
    if (!['claimed', 'open'].includes(expansion.state)) fail('GRAPH_EDGE_EXPANSION_STATE', `${expansion.id} cannot fail from ${expansion.state}`);
    for (const edge of edges.filter((entry) => entry.expansionId === expansion.id && !entry.batchPublished && entry.state !== 'failed')) {
      if (['reserved', 'action-ready', 'child-pending'].includes(edge.state)) failEdge({ claimer: input.claimer, edgeId: edge.id, code: input.code });
    }
    expansion.state = input.cancelled ? 'cancelled' : 'failed';
    expansion.failure = input.code;
    emit(`expansion-${expansion.state}`, expansion.id, { code: input.code });
    return expansionPublic(expansion);
  }

  function observeExpansion(expansionId) {
    return expansionPublic(findExpansion(expansionId));
  }

  function observeEdge(edgeId) {
    return edgePublic(findEdge(edgeId));
  }

  function snapshot() {
    return canonicalClone({
      profileId: profile.id,
      limits: { edgeSlots: toDecimal(limits.edgeSlots), actionBytes: toDecimal(limits.actionBytes) },
      ledger: { edgeSlots: toDecimal(ledger.edgeSlots), actionBytes: toDecimal(ledger.actionBytes) },
      expansions: expansions.map(expansionPublic),
      edges: edges.map(edgePublic),
      events,
      edgeRecordBytes: edgeLayout.recordBytes,
    });
  }

  return Object.freeze({
    claimExpansion,
    openExpansion,
    reserveEdge,
    publishEdgeAction,
    resolveEdgeChild,
    publishExpansionBatch,
    completeExpansion,
    failEdge,
    failExpansion,
    observeExpansion,
    observeEdge,
    snapshot,
  });
}

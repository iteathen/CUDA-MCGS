import { canonicalClone, canonicalIdentity, frozenCanonicalClone } from './canonical.mjs';
import { exactKeys, fail } from './errors.mjs';

function decimal(value, code, label) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) fail(code, `${label} must be a canonical decimal string`);
  return BigInt(value);
}

function toDecimal(value) {
  return BigInt(value).toString();
}

function resourceMaximum(profile, suffix) {
  const entry = profile.resources.find(({ id }) => id.endsWith(suffix));
  if (!entry) fail('GRAPH_NODE_PROFILE', `Graph profile lacks ${suffix}`);
  return decimal(entry.maximum, 'GRAPH_NODE_PROFILE', `${entry.id} maximum`);
}

function nodeLayout(profile) {
  const nodeKind = profile.objectKinds.find(({ role }) => role === 'state-node');
  if (!nodeKind) fail('GRAPH_NODE_PROFILE', 'Graph profile lacks state-node object kind');
  const layout = profile.layouts.find(({ objectKind }) => objectKind === nodeKind.id);
  if (!layout) fail('GRAPH_NODE_PROFILE', 'Graph profile lacks state-node layout');
  return layout;
}

function lifecycleFor(profile, role) {
  const object = profile.objectKinds.find((entry) => entry.role === role);
  if (!object) fail('GRAPH_NODE_PROFILE', `Graph profile lacks ${role} object kind`);
  return object.lifecycle;
}

function stateTail(value) {
  const index = value.lastIndexOf('state-');
  return index < 0 ? value : value.slice(index + 6);
}

function freeze(value, label) {
  return frozenCanonicalClone(value, label);
}

function claimPublic(claim) {
  return {
    id: claim.id,
    claimant: claim.claimant,
    scope: claim.scope,
    key: canonicalClone(claim.key),
    reference: canonicalClone(claim.reference),
    state: claim.state,
    entryState: claim.entryState,
    payloadVisible: claim.payloadVisible,
    ownerInitialization: claim.ownerInitialization,
    reservationDisposition: claim.reservationDisposition,
    auxiliary: canonicalClone(claim.auxiliary),
    failure: claim.failure,
  };
}

export function createGraphNodeOracle({
  profile,
  identityKey,
  equalState,
  initializeOwnedRegions = () => [],
  admission = {},
  mutations = {},
} = {}) {
  if (profile === null || typeof profile !== 'object') fail('GRAPH_NODE_PROFILE', 'normalized Graph profile is required');
  if (typeof identityKey !== 'function' || typeof equalState !== 'function' || typeof initializeOwnedRegions !== 'function') {
    fail('GRAPH_NODE_PORT', 'identityKey, equalState and initializeOwnedRegions must be functions');
  }
  if (profile.mode !== 'materialized') fail('GRAPH_NODE_PROFILE', 'NODE oracle requires a materialized Graph profile');
  if (!['verified-sharing', 'isolated-nodes'].includes(profile.transposition.kind)) fail('GRAPH_NODE_PROFILE', 'NODE oracle requires verified-sharing or isolated-nodes');

  const layout = nodeLayout(profile);
  const nodeLifecycle = lifecycleFor(profile, 'state-node');
  const nodeStates = new Set(nodeLifecycle.states.map(stateTail));
  for (const required of ['free', 'reserved', 'initializing', 'ready', 'failed']) {
    if (!nodeStates.has(required)) fail('GRAPH_NODE_PROFILE', `state-node lifecycle lacks ${required}`);
  }

  const entryLifecycle = profile.transposition.kind === 'verified-sharing' ? lifecycleFor(profile, 'transposition-entry') : null;
  if (entryLifecycle) {
    const entryStates = new Set(entryLifecycle.states.map(stateTail));
    for (const required of ['empty', 'claimed', 'ready', 'failed']) {
      if (!entryStates.has(required)) fail('GRAPH_NODE_PROFILE', `transposition-entry lifecycle lacks ${required}`);
    }
  }

  const profileNodeSlots = resourceMaximum(profile, 'resource-node-slots');
  const profileStateBytes = resourceMaximum(profile, 'resource-state-bytes');
  const profileTranspositionSlots = profile.transposition.kind === 'verified-sharing'
    ? resourceMaximum(profile, 'resource-transposition')
    : 0n;
  const profileProbeBound = profile.transposition.kind === 'verified-sharing'
    ? decimal(profile.transposition.maxCollisionProbes, 'GRAPH_NODE_PROFILE', 'maxCollisionProbes')
    : 0n;
  const recordBytes = decimal(layout.recordBytes, 'GRAPH_NODE_PROFILE', `${layout.id} recordBytes`);

  const limits = {
    nodeSlots: admission.nodeSlots === undefined ? profileNodeSlots : decimal(admission.nodeSlots, 'GRAPH_NODE_ADMISSION', 'nodeSlots'),
    stateBytes: admission.stateBytes === undefined ? profileStateBytes : decimal(admission.stateBytes, 'GRAPH_NODE_ADMISSION', 'stateBytes'),
    transpositionSlots: profile.transposition.kind === 'verified-sharing'
      ? (admission.transpositionSlots === undefined ? profileTranspositionSlots : decimal(admission.transpositionSlots, 'GRAPH_NODE_ADMISSION', 'transpositionSlots'))
      : 0n,
    maxCollisionProbes: profile.transposition.kind === 'verified-sharing'
      ? (admission.maxCollisionProbes === undefined ? profileProbeBound : decimal(admission.maxCollisionProbes, 'GRAPH_NODE_ADMISSION', 'maxCollisionProbes'))
      : 0n,
  };
  if (limits.nodeSlots > profileNodeSlots || limits.stateBytes > profileStateBytes || limits.transpositionSlots > profileTranspositionSlots || limits.maxCollisionProbes > profileProbeBound) {
    fail('GRAPH_NODE_ADMISSION', 'test admission plan exceeds normalized Graph profile bounds');
  }
  if (limits.nodeSlots === 0n || limits.stateBytes < recordBytes || (profile.transposition.kind === 'verified-sharing' && (limits.transpositionSlots === 0n || limits.maxCollisionProbes === 0n))) {
    fail('GRAPH_NODE_ADMISSION', 'test admission plan cannot admit one node');
  }

  const claims = [];
  const events = [];
  const ledger = { nodeSlots: 0n, stateBytes: 0n, transpositionSlots: 0n };
  let sequence = 0n;

  const emit = (type, claim, detail = null) => {
    events.push(freeze({ sequence: toDecimal(sequence++), type, claim: claim?.id ?? null, detail }, 'Graph NODE event'));
  };

  const findClaim = (id) => {
    const claim = claims.find((entry) => entry.id === id);
    if (!claim) fail('GRAPH_NODE_CLAIM', `unknown claim ${id}`);
    return claim;
  };

  const makeReference = (slot) => freeze({ kind: 'state-node', arena: '0', slot: toDecimal(slot), generation: '0' }, 'Graph node reference');

  const capacityOutcome = (needsEntry) => {
    if (ledger.nodeSlots + 1n > limits.nodeSlots) return 'node-capacity';
    if (ledger.stateBytes + recordBytes > limits.stateBytes) return 'state-byte-capacity';
    if (needsEntry && ledger.transpositionSlots + 1n > limits.transpositionSlots) return 'transposition-capacity';
    return null;
  };

  const reserve = ({ claimant, scope, key, view, needsEntry }) => {
    const pressure = capacityOutcome(needsEntry);
    if (pressure) return { kind: 'pressure', code: pressure };
    const slot = BigInt(claims.length);
    ledger.nodeSlots += 1n;
    ledger.stateBytes += recordBytes;
    if (needsEntry) ledger.transpositionSlots += 1n;
    const claim = {
      id: `claim.${toDecimal(slot)}`,
      claimant,
      scope,
      key: freeze(key, 'Graph node identity key'),
      verificationView: freeze(view, 'Graph node verification view'),
      reference: makeReference(slot),
      state: 'reserved',
      entryState: needsEntry ? 'claimed' : null,
      payload: null,
      payloadIdentity: null,
      payloadVisible: false,
      ownerInitialization: 'not-started',
      auxiliary: {},
      reservationDisposition: 'held',
      failure: null,
    };
    claims.push(claim);
    emit('node-reserved', claim, { entryState: claim.entryState });
    return { kind: 'initializer', claimId: claim.id, reference: canonicalClone(claim.reference) };
  };

  function lookupOrClaimNode(input) {
    exactKeys(input, ['claimant', 'scope', 'view'], 'GRAPH_NODE_LOOKUP_FIELDS', 'lookupOrClaimNode input');
    if (typeof input.claimant !== 'string' || input.claimant.length === 0 || typeof input.scope !== 'string' || input.scope.length === 0) fail('GRAPH_NODE_LOOKUP', 'claimant and scope are required');
    const key = freeze(identityKey(freeze(input.view, 'Graph lookup view')), 'Graph node identity key');
    emit('identity-key', null, { claimant: input.claimant, scope: input.scope, key });

    if (profile.transposition.kind === 'isolated-nodes') {
      return reserve({ claimant: input.claimant, scope: input.scope, key, view: input.view, needsEntry: false });
    }

    const candidates = claims.filter((claim) => claim.scope === input.scope && canonicalIdentity(claim.key).sha256 === canonicalIdentity(key).sha256 && claim.entryState !== 'failed' && claim.entryState !== 'tombstone');
    let probes = 0n;
    for (const candidate of candidates) {
      probes += 1n;
      if (probes > limits.maxCollisionProbes) return { kind: 'pressure', code: 'transposition-probe-exhausted' };
      emit('collision-verify', candidate, { claimant: input.claimant });
      const equal = mutations.skipCollisionVerification === true ? true : equalState(freeze(input.view, 'Graph equality view'), candidate.verificationView);
      if (!equal) continue;
      if (candidate.state === 'ready' && candidate.entryState === 'ready') {
        return { kind: 'ready', claimId: candidate.id, reference: canonicalClone(candidate.reference) };
      }
      if (['reserved', 'initializing'].includes(candidate.state) && candidate.entryState === 'claimed') {
        return { kind: 'pending', claimId: candidate.id, reference: canonicalClone(candidate.reference) };
      }
      if (candidate.state === 'failed' || ['failed', 'tombstone'].includes(candidate.entryState)) continue;
      fail('GRAPH_NODE_STATE', 'equal candidate is in an invalid publication state');
    }
    if (candidates.length >= Number(limits.maxCollisionProbes)) return { kind: 'pressure', code: 'transposition-probe-exhausted' };
    return reserve({ claimant: input.claimant, scope: input.scope, key, view: input.view, needsEntry: true });
  }

  function beginInitialization(input) {
    exactKeys(input, ['claimId', 'payload'], 'GRAPH_NODE_INITIALIZE_FIELDS', 'beginInitialization input');
    const claim = findClaim(input.claimId);
    if (claim.state !== 'reserved') fail('GRAPH_NODE_STATE', `${claim.id} is not reserved`);
    claim.state = 'initializing';
    emit('node-initializing', claim);
    claim.payload = freeze(input.payload, 'Graph node domain payload');
    claim.payloadIdentity = canonicalIdentity(claim.payload, 'Graph node domain payload');
    const initialized = initializeOwnedRegions({ claimId: claim.id, reference: canonicalClone(claim.reference), payload: claim.payload });
    if (!Array.isArray(initialized)) fail('GRAPH_NODE_OWNER_INIT', 'initializeOwnedRegions must return an array');
    for (const record of initialized) {
      exactKeys(record, ['id', 'status'], 'GRAPH_NODE_OWNER_INIT', 'owned-region initialization result');
      if (typeof record.id !== 'string' || record.id.length === 0 || record.status !== 'ready') fail('GRAPH_NODE_OWNER_INIT', 'owned-region initialization did not complete');
      emit('owned-region-initialized', claim, { id: record.id });
    }
    claim.ownerInitialization = 'complete';
    return claimPublic(claim);
  }

  function publishNode(input) {
    exactKeys(input, ['claimId', 'payload'], 'GRAPH_NODE_PUBLISH_FIELDS', 'publishNode input');
    const claim = findClaim(input.claimId);
    const identity = canonicalIdentity(input.payload, 'Graph publication payload');
    if (claim.state === 'ready') {
      if (claim.payloadIdentity.sha256 !== identity.sha256) fail('GRAPH_NODE_PUBLICATION_CONFLICT', `${claim.id} already published a different payload`);
      return { kind: 'ready', claimId: claim.id, reference: canonicalClone(claim.reference) };
    }
    if (claim.state !== 'initializing' || claim.ownerInitialization !== 'complete') fail('GRAPH_NODE_PUBLICATION_ORDER', `${claim.id} is not ready to publish`);
    if (claim.payloadIdentity.sha256 !== identity.sha256) fail('GRAPH_NODE_PUBLICATION_CONFLICT', `${claim.id} publication payload differs from initialized payload`);
    claim.payloadVisible = true;
    emit('payload-visible', claim);
    if (mutations.entryReadyBeforeNode === true && claim.entryState === 'claimed') {
      claim.entryState = 'ready';
      emit('entry-ready', claim);
    }
    claim.state = 'ready';
    emit('node-ready', claim);
    if (claim.entryState === 'claimed') {
      claim.entryState = 'ready';
      emit('entry-ready', claim);
    }
    return { kind: 'ready', claimId: claim.id, reference: canonicalClone(claim.reference) };
  }

  function failNode(input) {
    exactKeys(input, ['claimId', 'code'], 'GRAPH_NODE_FAIL_FIELDS', 'failNode input');
    const claim = findClaim(input.claimId);
    if (!['reserved', 'initializing'].includes(claim.state)) fail('GRAPH_NODE_STATE', `${claim.id} cannot fail from ${claim.state}`);
    claim.state = 'failed';
    claim.failure = input.code;
    emit('node-failed', claim, { code: input.code });
    if (claim.entryState === 'claimed') {
      claim.entryState = 'failed';
      emit('entry-failed', claim, { code: input.code });
    }
    if (claim.reservationDisposition === 'held') {
      claim.reservationDisposition = 'retained-failed';
      emit('reservation-dispositioned', claim, { disposition: claim.reservationDisposition });
    }
    return { kind: 'failed', claimId: claim.id, code: input.code };
  }

  function observeClaim(claimId) {
    const claim = findClaim(claimId);
    if (claim.state === 'ready' && (claim.entryState === null || claim.entryState === 'ready')) return { kind: 'ready', reference: canonicalClone(claim.reference) };
    if (claim.state === 'failed' || claim.entryState === 'failed' || claim.entryState === 'tombstone') return { kind: 'failed', code: claim.failure };
    return { kind: 'pending', reference: canonicalClone(claim.reference) };
  }

  function publishAuxiliary(input) {
    exactKeys(input, ['claimId', 'id', 'payload'], 'GRAPH_NODE_AUX_FIELDS', 'publishAuxiliary input');
    const claim = findClaim(input.claimId);
    if (claim.state !== 'ready') fail('GRAPH_NODE_AUX_STATE', 'auxiliary publication requires a ready node');
    if (Object.hasOwn(claim.auxiliary, input.id)) fail('GRAPH_NODE_AUX_DUPLICATE', `auxiliary record ${input.id} already exists`);
    claim.auxiliary[input.id] = freeze({ status: 'ready', payload: input.payload }, 'Graph auxiliary record');
    emit('auxiliary-ready', claim, { id: input.id });
    return canonicalClone(claim.auxiliary[input.id]);
  }

  function readyPayload(claimId) {
    const claim = findClaim(claimId);
    if (claim.state !== 'ready' || claim.payloadVisible !== true) fail('GRAPH_NODE_NOT_READY', `${claim.id} payload is not ready`);
    return claim.payload;
  }

  function snapshot() {
    return canonicalClone({
      profileId: profile.id,
      limits: Object.fromEntries(Object.entries(limits).map(([key, value]) => [key, toDecimal(value)])),
      ledger: Object.fromEntries(Object.entries(ledger).map(([key, value]) => [key, toDecimal(value)])),
      claims: claims.map(claimPublic),
      events,
    });
  }

  return Object.freeze({ lookupOrClaimNode, beginInitialization, publishNode, failNode, observeClaim, publishAuxiliary, readyPayload, snapshot });
}

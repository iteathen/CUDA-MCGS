import { canonicalClone, canonicalIdentity, frozenCanonicalClone } from './canonical.mjs';
import { exactKeys, fail, isRecord } from './errors.mjs';

function decimal(value, code, label) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) fail(code, `${label} must be a canonical decimal string`);
  return BigInt(value);
}

function toDecimal(value) {
  return BigInt(value).toString();
}

function freeze(value, label) {
  return frozenCanonicalClone(value, label);
}

function stateTail(value) {
  const index = value.lastIndexOf('state-');
  return index < 0 ? value : value.slice(index + 6);
}

function objectByRole(profile, role) {
  const object = profile.objectKinds.find((entry) => entry.role === role);
  if (!object) fail('GRAPH_ROOT_PROFILE', `Graph profile lacks ${role} object kind`);
  return object;
}

function layoutByRole(profile, role) {
  const object = objectByRole(profile, role);
  const layout = profile.layouts.find(({ objectKind }) => objectKind === object.id);
  if (!layout) fail('GRAPH_ROOT_PROFILE', `Graph profile lacks ${role} layout`);
  return { object, layout };
}

function resourceMaximum(profile, suffix) {
  const entry = profile.resources.find(({ id }) => id.endsWith(suffix));
  if (!entry) fail('GRAPH_ROOT_PROFILE', `Graph profile lacks ${suffix}`);
  return decimal(entry.maximum, 'GRAPH_ROOT_PROFILE', `${entry.id} maximum`);
}

function lifecycleState(object, tail) {
  const state = object.lifecycle.states.find((candidate) => stateTail(candidate) === tail);
  if (!state) fail('GRAPH_ROOT_PROFILE', `${object.role} lifecycle lacks ${tail}`);
  return state;
}

function hasPrivateReset(object, from) {
  return object.lifecycle.transitions.some((transition) =>
    transition.from === from
    && transition.to === object.lifecycle.initialState
    && transition.visibility === 'private');
}

function publicReference(kind, arena, slot, generation) {
  return freeze({ kind, arena, slot, generation }, 'Graph ROOT public reference');
}

function invalid(code) {
  return freeze({ kind: 'invalid', code }, 'Graph ROOT invalid outcome');
}

function pressure(code) {
  return freeze({ kind: 'pressure', code }, 'Graph ROOT pressure outcome');
}

function assertPortResult(result, label) {
  if (!isRecord(result) || typeof result.kind !== 'string') fail('GRAPH_ROOT_PORT_RESULT', `${label} must return a typed result record`);
  return result;
}

function publicOwnerRegion(region) {
  return freeze({
    id: region.id,
    semanticRole: region.semanticRole,
    ownerContract: region.ownerContract,
    ownerProfile: region.ownerProfile,
    lifecycle: region.lifecycle,
    referenceHandling: region.referenceHandling,
    permissions: region.permissions,
    persistence: region.persistence,
  }, 'Graph ROOT owner region');
}

export function createGraphRootOracle({
  profile,
  validateReference,
  nextGeneration,
  acquireProtection,
  releaseProtection,
  ownerRerootLifecycle = () => ({ status: 'ready' }),
  admission = {},
  arena = '0',
  mutations = {},
} = {}) {
  if (!isRecord(profile) || profile.mode !== 'materialized' || profile.rootProtection?.kind !== 'protected-anchor') {
    fail('GRAPH_ROOT_PROFILE', 'materialized protected-root Graph profile is required');
  }
  for (const [name, port] of Object.entries({ validateReference, nextGeneration, acquireProtection, releaseProtection, ownerRerootLifecycle })) {
    if (typeof port !== 'function') fail('GRAPH_ROOT_PORT', `${name} must be an injected function`);
  }
  decimal(arena, 'GRAPH_ROOT_ARENA', 'arena');

  const { object: anchorObject, layout: anchorLayout } = layoutByRole(profile, 'root-anchor');
  const protectionObject = objectByRole(profile, 'protection-record');
  if (profile.rootProtection.anchorObject !== anchorObject.id || profile.rootProtection.protectionObject !== protectionObject.id) {
    fail('GRAPH_ROOT_PROFILE', 'rootProtection object bindings differ from Graph object roles');
  }
  if (!profile.rootProtection.acquireRetireOrdering) fail('GRAPH_ROOT_PROFILE', 'rootProtection acquire/retire ordering is absent');

  for (const terminal of anchorObject.lifecycle.terminalStates) {
    if (!hasPrivateReset(anchorObject, terminal)) fail('GRAPH_ROOT_PROFILE', `root-anchor terminal state ${terminal} lacks private reset-to-free transition`);
  }
  for (const reusable of [...protectionObject.lifecycle.readyStates, ...protectionObject.lifecycle.terminalStates]) {
    if (!hasPrivateReset(protectionObject, reusable)) fail('GRAPH_ROOT_PROFILE', `protection-record state ${reusable} lacks private reset-to-free transition`);
  }

  const rootReserve = decimal(profile.rootProtection.admissionReserve, 'GRAPH_ROOT_PROFILE', 'rootProtection admissionReserve');
  const layoutCapacity = decimal(anchorLayout.capacity, 'GRAPH_ROOT_PROFILE', `${anchorLayout.id} capacity`);
  const resourceCapacity = resourceMaximum(profile, 'resource-root-anchor-slots');
  const rootAnchorSlots = admission.rootAnchorSlots === undefined
    ? resourceCapacity
    : decimal(admission.rootAnchorSlots, 'GRAPH_ROOT_ADMISSION', 'rootAnchorSlots');
  if (rootAnchorSlots < rootReserve || rootAnchorSlots > resourceCapacity || rootAnchorSlots > layoutCapacity) {
    fail('GRAPH_ROOT_ADMISSION', 'rootAnchorSlots must cover the normalized admission reserve without exceeding funded/layout capacity');
  }

  const freeState = anchorObject.lifecycle.initialState;
  const readyState = lifecycleState(anchorObject, 'ready');
  const releasedState = lifecycleState(anchorObject, 'released');
  const failedState = lifecycleState(anchorObject, 'failed');
  const anchors = [];
  const events = [];
  let sequence = 0n;

  const emit = (type, detail) => {
    events.push(freeze({ sequence: toDecimal(sequence++), type, detail }, 'Graph ROOT event'));
  };

  function resolveSlotState(input) {
    if (!isRecord(input) || input.kind !== 'root-anchor' || input.arena !== arena || typeof input.slot !== 'string') return null;
    let slot;
    try {
      slot = Number(decimal(input.slot, 'GRAPH_ROOT_SLOT', 'root-anchor slot'));
    } catch {
      return null;
    }
    const entry = anchors[slot];
    if (!entry) return null;
    return freeze({
      kind: 'root-anchor',
      arena,
      slot: entry.slot,
      generation: entry.generation,
      lifecycleState: entry.state,
    }, 'Graph ROOT slot state');
  }

  function anchorReference(entry) {
    return publicReference('root-anchor', arena, entry.slot, entry.generation);
  }

  function selectAnchorSlot() {
    const free = anchors.find((entry) => entry.state === freeState && entry.exhausted !== true);
    if (free) return { entry: free, isNew: false };
    if (BigInt(anchors.length) >= rootAnchorSlots) return null;
    return {
      isNew: true,
      entry: {
        slot: toDecimal(anchors.length),
        generation: '0',
        state: freeState,
        exhausted: false,
        nodeReference: null,
        protectionToken: null,
        owner: null,
      },
    };
  }

  function protectRootAnchor(input) {
    exactKeys(input, ['nodeReference', 'owner'], 'GRAPH_ROOT_PROTECT_FIELDS', 'protectRootAnchor input');
    if (typeof input.owner !== 'string' || input.owner.length === 0) return invalid('invalid-reference');
    const node = assertPortResult(validateReference({ expectedKind: 'state-node', reference: input.nodeReference }), 'validateReference(state-node)');
    if (node.kind !== 'valid') return node;
    const selected = selectAnchorSlot();
    if (!selected) {
      const generationExhausted = anchors.length > 0 && anchors.every((entry) => entry.exhausted === true);
      return generationExhausted
        ? freeze({ kind: 'exhausted', code: 'generation-exhausted' }, 'Graph ROOT generation exhaustion')
        : pressure('protection-capacity');
    }
    const { entry, isNew } = selected;
    const reference = anchorReference(entry);
    if (mutations.publishBeforeProtection === true) emit('root-anchor-visible', { anchorReference: reference, nodeReference: node.reference, mutation: 'before-protection' });
    const protectedNode = assertPortResult(acquireProtection({ expectedKind: 'state-node', owner: `root-anchor:${input.owner}:${entry.slot}`, reference: node.reference }), 'acquireProtection(state-node)');
    if (protectedNode.kind !== 'protected') return protectedNode;
    entry.nodeReference = node.reference;
    entry.protectionToken = protectedNode.token;
    entry.owner = input.owner;
    entry.state = readyState;
    if (isNew) anchors.push(entry);
    emit('root-anchor-protected', { anchorReference: reference, nodeReference: node.reference, owner: input.owner, token: protectedNode.token });
    if (mutations.publishBeforeProtection !== true) emit('root-anchor-visible', { anchorReference: reference, nodeReference: node.reference });
    return freeze({ kind: 'protected-anchor', anchorReference: reference, nodeReference: node.reference }, 'Graph ROOT protected anchor');
  }

  function readRootAnchor(input) {
    exactKeys(input, ['anchorReference'], 'GRAPH_ROOT_READ_FIELDS', 'readRootAnchor input');
    const validated = assertPortResult(validateReference({ expectedKind: 'root-anchor', reference: input.anchorReference }), 'validateReference(root-anchor)');
    if (validated.kind !== 'valid') return validated;
    const entry = anchors[Number(decimal(validated.reference.slot, 'GRAPH_ROOT_SLOT', 'validated root-anchor slot'))];
    if (!entry || entry.generation !== validated.reference.generation || entry.state !== readyState) return invalid('invalid-reference');
    return freeze({ kind: 'root-anchor', anchorReference: validated.reference, nodeReference: entry.nodeReference, owner: entry.owner }, 'Graph ROOT anchor view');
  }

  function releaseRootAnchor(input) {
    exactKeys(input, ['anchorReference'], 'GRAPH_ROOT_RELEASE_FIELDS', 'releaseRootAnchor input');
    const validated = assertPortResult(validateReference({ expectedKind: 'root-anchor', reference: input.anchorReference }), 'validateReference(root-anchor)');
    if (validated.kind !== 'valid') return validated;
    const entry = anchors[Number(decimal(validated.reference.slot, 'GRAPH_ROOT_SLOT', 'validated root-anchor slot'))];
    if (!entry || entry.generation !== validated.reference.generation || entry.state !== readyState || entry.protectionToken === null) return invalid('invalid-reference');
    const released = assertPortResult(releaseProtection({ token: entry.protectionToken }), 'releaseProtection(root-anchor)');
    if (released.kind !== 'released') return released;
    entry.state = releasedState;
    emit('root-anchor-terminal', { anchorReference: validated.reference, nodeReference: entry.nodeReference, disposition: 'released' });
    const next = assertPortResult(nextGeneration({ generation: entry.generation }), 'nextGeneration(root-anchor)');
    if (next.kind === 'next') {
      entry.generation = next.generation;
      entry.state = freeState;
      entry.exhausted = false;
      entry.nodeReference = null;
      entry.protectionToken = null;
      entry.owner = null;
      emit('root-anchor-reusable', { slot: entry.slot, generation: entry.generation });
      return freeze({ kind: 'released-anchor', reusable: true }, 'Graph ROOT anchor release');
    }
    if (next.kind !== 'exhausted' || next.code !== 'generation-exhausted') fail('GRAPH_ROOT_GENERATION', 'root-anchor generation result is invalid');
    entry.state = releasedState;
    entry.exhausted = true;
    entry.nodeReference = null;
    entry.protectionToken = null;
    entry.owner = null;
    emit('root-anchor-generation-exhausted', { slot: entry.slot, generation: entry.generation });
    return freeze({ kind: 'released-anchor', reusable: false, code: 'generation-exhausted' }, 'Graph ROOT exhausted anchor release');
  }

  function applyOwnerRerootDisposition(input) {
    exactKeys(input, ['regionId', 'disposition', 'record'], 'GRAPH_ROOT_OWNER_FIELDS', 'owner reroot disposition');
    const allowed = ['retain', 'retain-if-key-valid', 'transform', 'reset', 'invalidate'];
    if (!allowed.includes(input.disposition)) fail('GRAPH_ROOT_OWNER_DISPOSITION', 'owner reroot disposition is invalid');
    const region = profile.ownerRegions.find(({ id }) => id === input.regionId);
    if (!region) fail('GRAPH_ROOT_OWNER_REGION', `unknown owner region ${input.regionId}`);
    const record = freeze(input.record, 'Graph ROOT opaque owner record');
    const before = canonicalIdentity(record, 'Graph ROOT opaque owner record');
    const outcome = ownerRerootLifecycle(freeze({
      region: publicOwnerRegion(region),
      disposition: input.disposition,
      record,
    }, 'Graph ROOT owner disposition request'));
    const after = canonicalIdentity(record, 'Graph ROOT opaque owner record');
    if (before.sha256 !== after.sha256) fail('GRAPH_ROOT_OWNER_LIFECYCLE', 'owner reroot callback mutated Graph-supplied opaque record');
    if (!isRecord(outcome) || typeof outcome.status !== 'string') fail('GRAPH_ROOT_OWNER_LIFECYCLE', 'owner reroot callback must return a status record');
    emit('owner-reroot-disposition', { regionId: region.id, disposition: input.disposition, status: outcome.status });
    return freeze({ kind: 'delegated', disposition: input.disposition, status: outcome.status }, 'Graph ROOT owner disposition outcome');
  }

  function snapshot() {
    return canonicalClone({
      profileId: profile.id,
      arena,
      limits: { rootAnchorSlots: toDecimal(rootAnchorSlots), admissionReserve: toDecimal(rootReserve) },
      anchors: anchors.map((entry) => ({
        reference: anchorReference(entry),
        lifecycleState: entry.state,
        exhausted: entry.exhausted,
        nodeReference: entry.nodeReference,
        protected: entry.protectionToken !== null,
        owner: entry.owner,
      })),
      events,
    }, 'Graph ROOT snapshot');
  }

  return Object.freeze({
    protectRootAnchor,
    readRootAnchor,
    releaseRootAnchor,
    applyOwnerRerootDisposition,
    resolveSlotState,
    snapshot,
  });
}

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

function resourceMaximum(profile, suffix) {
  const entry = profile.resources.find(({ id }) => id.endsWith(suffix));
  if (!entry) fail('GRAPH_REF_PROFILE', `Graph profile lacks ${suffix}`);
  return decimal(entry.maximum, 'GRAPH_REF_PROFILE', `${entry.id} maximum`);
}

function objectByRole(profile, role) {
  const object = profile.objectKinds.find((entry) => entry.role === role);
  if (!object) fail('GRAPH_REF_PROFILE', `Graph profile lacks ${role} object kind`);
  return object;
}

function layoutByRole(profile, role) {
  const object = objectByRole(profile, role);
  const layout = profile.layouts.find(({ objectKind }) => objectKind === object.id);
  if (!layout) fail('GRAPH_REF_PROFILE', `Graph profile lacks ${role} layout`);
  return { object, layout };
}

function invalid(code) {
  return freeze({ kind: 'invalid', code }, 'Graph reference validation failure');
}

function referenceKey(reference) {
  return `${reference.kind}\0${reference.arena}\0${reference.slot}\0${reference.generation}`;
}

function publicReference(reference) {
  return {
    kind: reference.kind,
    arena: reference.arena,
    slot: reference.slot,
    generation: reference.generation,
  };
}

export function createGraphReferenceOracle({
  profile,
  resolveSlotState,
  ownerReferenceLifecycle = () => ({ status: 'ready' }),
  admission = {},
  mutations = {},
} = {}) {
  if (profile === null || typeof profile !== 'object' || profile.mode !== 'materialized') fail('GRAPH_REF_PROFILE', 'materialized normalized Graph profile is required');
  if (typeof resolveSlotState !== 'function' || typeof ownerReferenceLifecycle !== 'function') fail('GRAPH_REF_PORT', 'resolveSlotState and ownerReferenceLifecycle must be functions');
  if (profile.referenceEncoding?.kind !== 'typed-index-generation' || profile.referenceEncoding.staleBehavior !== 'reject-without-side-effect' || profile.referenceEncoding.rawAddressPublic !== false) {
    fail('GRAPH_REF_PROFILE', 'Graph reference encoding must be typed, stale-safe and address-opaque');
  }

  const encoding = profile.referenceEncoding;
  const ranges = {
    arena: decimal(encoding.arenaRange, 'GRAPH_REF_PROFILE', 'reference arenaRange'),
    slot: decimal(encoding.slotRange, 'GRAPH_REF_PROFILE', 'reference slotRange'),
    generation: decimal(encoding.generationRange, 'GRAPH_REF_PROFILE', 'reference generationRange'),
  };
  const kindRange = decimal(encoding.kindRange, 'GRAPH_REF_PROFILE', 'reference kindRange');
  if (BigInt(profile.objectKinds.length) > kindRange) fail('GRAPH_REF_PROFILE', 'declared object kinds exceed reference kind range');

  const { layout: protectionLayout } = layoutByRole(profile, 'protection-record');
  const profileProtectionSlots = resourceMaximum(profile, 'resource-protection-slots');
  const protectionLayoutCapacity = decimal(protectionLayout.capacity, 'GRAPH_REF_PROFILE', `${protectionLayout.id} capacity`);
  const protectionSlots = admission.protectionSlots === undefined
    ? profileProtectionSlots
    : decimal(admission.protectionSlots, 'GRAPH_REF_ADMISSION', 'protectionSlots');
  if (protectionSlots === 0n || protectionSlots > profileProtectionSlots || protectionSlots > protectionLayoutCapacity) {
    fail('GRAPH_REF_ADMISSION', 'test protection admission exceeds or eliminates normalized capacity');
  }

  const events = [];
  const protections = [];
  const retirementBarriers = new Set();
  let sequence = 0n;

  const emit = (type, detail) => {
    events.push(freeze({ sequence: toDecimal(sequence++), type, detail }, 'Graph REF event'));
  };

  function parsePublicReference(reference) {
    if (!isRecord(reference)) return { error: 'invalid-reference' };
    const keys = Object.keys(reference).sort();
    const expected = ['arena', 'generation', 'kind', 'slot'];
    if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) return { error: 'invalid-reference' };
    if (typeof reference.kind !== 'string' || reference.kind.length === 0) return { error: 'reference-kind-mismatch' };
    let arena;
    let slot;
    let generation;
    try {
      arena = decimal(reference.arena, 'GRAPH_REF_VALUE', 'reference arena');
      slot = decimal(reference.slot, 'GRAPH_REF_VALUE', 'reference slot');
      generation = decimal(reference.generation, 'GRAPH_REF_VALUE', 'reference generation');
    } catch {
      return { error: 'invalid-reference' };
    }
    if (arena > ranges.arena || slot > ranges.slot || generation > ranges.generation) return { error: 'invalid-reference' };
    return { reference: freeze(publicReference(reference), 'Graph public reference'), arena, slot, generation };
  }

  function validateReference(input) {
    if (!isRecord(input)) return invalid('invalid-reference');
    const keys = Object.keys(input).sort();
    if (keys.length !== 2 || keys[0] !== 'expectedKind' || keys[1] !== 'reference') return invalid('invalid-reference');
    if (typeof input.expectedKind !== 'string' || input.expectedKind.length === 0) return invalid('reference-kind-mismatch');
    const parsed = parsePublicReference(input.reference);
    if (parsed.error) return invalid(parsed.error);
    const { reference, slot, generation } = parsed;
    if (reference.kind !== input.expectedKind) return invalid('reference-kind-mismatch');

    let object;
    try {
      object = objectByRole(profile, input.expectedKind);
    } catch {
      return invalid('reference-kind-mismatch');
    }
    const layout = profile.layouts.find(({ objectKind }) => objectKind === object.id);
    if (!layout) return invalid('invalid-reference');
    const capacity = decimal(layout.capacity, 'GRAPH_REF_PROFILE', `${layout.id} capacity`);
    if (slot >= capacity) return invalid('invalid-reference');

    const current = resolveSlotState(freeze({ kind: reference.kind, arena: reference.arena, slot: reference.slot }, 'Graph slot-state request'));
    if (!isRecord(current)) return invalid('invalid-reference');
    const currentKeys = Object.keys(current).sort();
    const expectedCurrent = ['arena', 'generation', 'kind', 'lifecycleState', 'slot'];
    if (currentKeys.length !== expectedCurrent.length || currentKeys.some((key, index) => key !== expectedCurrent[index])) return invalid('invalid-reference');
    if (current.kind !== reference.kind) return invalid('reference-kind-mismatch');
    if (current.arena !== reference.arena) return invalid('arena-incarnation-mismatch');
    if (current.slot !== reference.slot) return invalid('invalid-reference');

    let currentGeneration;
    try {
      currentGeneration = decimal(current.generation, 'GRAPH_REF_SLOT_STATE', 'current generation');
    } catch {
      return invalid('invalid-reference');
    }
    if (currentGeneration > ranges.generation) return invalid('generation-exhausted');
    if (mutations.skipGenerationValidation !== true) {
      if (generation < currentGeneration) return invalid('stale-reference');
      if (generation > currentGeneration) return invalid('invalid-reference');
    }

    const ready = new Set(object.lifecycle.readyStates.map(stateTail));
    if (!ready.has(stateTail(current.lifecycleState))) return invalid('invalid-reference');
    emit('reference-validated', { reference, lifecycleState: current.lifecycleState });
    return freeze({ kind: 'valid', reference }, 'Graph valid reference');
  }

  function nextGeneration(input) {
    if (!isRecord(input) || Object.keys(input).length !== 1 || !Object.hasOwn(input, 'generation')) return invalid('invalid-reference');
    let generation;
    try {
      generation = decimal(input.generation, 'GRAPH_REF_VALUE', 'generation');
    } catch {
      return invalid('invalid-reference');
    }
    if (generation > ranges.generation) return invalid('invalid-reference');
    if (generation === ranges.generation) return freeze({ kind: 'exhausted', code: 'generation-exhausted' }, 'Graph generation exhaustion');
    return freeze({ kind: 'next', generation: toDecimal(generation + 1n) }, 'Graph next generation');
  }

  function applyOwnerReferenceLifecycle(input) {
    if (!isRecord(input)) fail('GRAPH_REF_OWNER_LIFECYCLE', 'owner lifecycle input is required');
    exactKeys(input, ['action', 'record', 'regionId'], 'GRAPH_REF_OWNER_LIFECYCLE', 'owner lifecycle input');
    if (!['fixup', 'release', 'validate'].includes(input.action)) fail('GRAPH_REF_OWNER_LIFECYCLE', 'owner lifecycle action is invalid');
    const region = profile.ownerRegions.find(({ id }) => id === input.regionId);
    if (!region) fail('GRAPH_REF_OWNER_LIFECYCLE', `unknown owner region ${input.regionId}`);
    if (region.referenceHandling?.kind !== 'owner-lifecycle' || !region.referenceHandling.actions.includes(input.action)) {
      fail('GRAPH_REF_OWNER_LIFECYCLE', `${region.id} does not declare ${input.action} reference handling`);
    }
    const publicRegion = freeze({
      id: region.id,
      semanticRole: region.semanticRole,
      ownerContract: region.ownerContract,
      ownerProfile: region.ownerProfile,
      lifecycle: region.lifecycle,
      referenceHandling: region.referenceHandling,
      permissions: region.permissions,
    }, 'Graph owner lifecycle region');
    const record = freeze(input.record, 'Graph opaque owner reference record');
    const before = canonicalIdentity(record, 'Graph opaque owner reference record');
    const outcome = ownerReferenceLifecycle(freeze({ action: input.action, region: publicRegion, record }, 'Graph owner lifecycle request'));
    const after = canonicalIdentity(record, 'Graph opaque owner reference record');
    if (before.sha256 !== after.sha256) fail('GRAPH_REF_OWNER_LIFECYCLE', 'owner lifecycle callback mutated Graph-supplied opaque record');
    if (!isRecord(outcome) || typeof outcome.status !== 'string') fail('GRAPH_REF_OWNER_LIFECYCLE', 'owner lifecycle callback must return a status record');
    emit('owner-reference-lifecycle', { action: input.action, regionId: region.id, status: outcome.status });
    return freeze({ kind: 'delegated', status: outcome.status }, 'Graph owner lifecycle outcome');
  }

  function activeProtectionCount(key) {
    return protections.filter((entry) => entry.referenceKey === key && entry.state === 'held').length;
  }

  function acquireProtection(input) {
    if (!isRecord(input)) return invalid('invalid-reference');
    const keys = Object.keys(input).sort();
    const expected = ['expectedKind', 'owner', 'reference'];
    if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index]) || typeof input.owner !== 'string' || input.owner.length === 0) return invalid('invalid-reference');
    const validated = validateReference({ expectedKind: input.expectedKind, reference: input.reference });
    if (validated.kind !== 'valid') return validated;
    const key = referenceKey(validated.reference);
    if (retirementBarriers.has(key) && mutations.allowProtectionAfterRetirement !== true) return invalid('invalid-reference');
    let entry = protections.find((candidate) => candidate.state === 'released'
      && decimal(candidate.token.generation, 'GRAPH_REF_PROTECTION', 'protection generation') < ranges.generation);
    if (entry) {
      entry.token = freeze({
        id: entry.token.id,
        generation: toDecimal(decimal(entry.token.generation, 'GRAPH_REF_PROTECTION', 'protection generation') + 1n),
      }, 'Graph protection token');
    } else {
      if (BigInt(protections.length) >= protectionSlots) {
        const generationExhausted = protections.length > 0 && protections.every((candidate) => candidate.state === 'released'
          && decimal(candidate.token.generation, 'GRAPH_REF_PROTECTION', 'protection generation') === ranges.generation);
        return generationExhausted
          ? freeze({ kind: 'exhausted', code: 'generation-exhausted' }, 'Graph protection generation exhaustion')
          : freeze({ kind: 'pressure', code: 'protection-capacity' }, 'Graph protection pressure');
      }
      const slot = protections.length;
      entry = {
        token: freeze({ id: `protection.${slot}`, generation: '0' }, 'Graph protection token'),
        owner: null,
        reference: null,
        referenceKey: null,
        state: 'released',
      };
      protections.push(entry);
    }
    entry.owner = input.owner;
    entry.reference = validated.reference;
    entry.referenceKey = key;
    entry.state = 'held';
    emit('protection-acquired', { owner: input.owner, reference: validated.reference, token: entry.token });
    return freeze({ kind: 'protected', token: entry.token }, 'Graph protection acquisition');
  }

  function beginRetirementBarrier(input) {
    if (!isRecord(input)) return invalid('invalid-reference');
    const keys = Object.keys(input).sort();
    if (keys.length !== 2 || keys[0] !== 'expectedKind' || keys[1] !== 'reference') return invalid('invalid-reference');
    const validated = validateReference(input);
    if (validated.kind !== 'valid') return validated;
    const key = referenceKey(validated.reference);
    const held = activeProtectionCount(key);
    if (held > 0) return freeze({ kind: 'blocked', protections: held }, 'Graph retirement barrier blocked');
    retirementBarriers.add(key);
    emit('retirement-barrier-passed', { reference: validated.reference });
    return freeze({ kind: 'retirement-barrier', reference: validated.reference }, 'Graph retirement barrier');
  }

  function releaseProtection(input) {
    if (!isRecord(input) || Object.keys(input).length !== 1 || !Object.hasOwn(input, 'token') || !isRecord(input.token)) return invalid('stale-reference');
    const tokenKeys = Object.keys(input.token).sort();
    if (tokenKeys.length !== 2 || tokenKeys[0] !== 'generation' || tokenKeys[1] !== 'id') return invalid('stale-reference');
    const slot = protections.find((entry) => entry.token.id === input.token.id);
    if (!slot || slot.state !== 'held' || slot.token.generation !== input.token.generation) return invalid('stale-reference');
    slot.state = 'released';
    emit('protection-released', { owner: slot.owner, reference: slot.reference, token: slot.token });
    return freeze({ kind: 'released', token: slot.token }, 'Graph protection release');
  }

  function observeRetirementBarrier(reference) {
    const parsed = parsePublicReference(reference);
    if (parsed.error) return false;
    return retirementBarriers.has(referenceKey(parsed.reference));
  }

  function snapshot() {
    return canonicalClone({
      profileId: profile.id,
      limits: { protectionSlots: toDecimal(protectionSlots), generationRange: toDecimal(ranges.generation) },
      protections: protections.map(({ token, owner, reference, state }) => ({ token, owner, reference, state })),
      retirementBarriers: [...retirementBarriers].sort(),
      events,
    }, 'Graph REF snapshot');
  }

  return Object.freeze({
    validateReference,
    nextGeneration,
    applyOwnerReferenceLifecycle,
    acquireProtection,
    beginRetirementBarrier,
    releaseProtection,
    observeRetirementBarrier,
    snapshot,
  });
}

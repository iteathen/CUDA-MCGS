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

function slotKey(reference) {
  return `${reference.kind}\0${reference.arena}\0${reference.slot}`;
}

function publicReference(reference) {
  return { kind: reference.kind, arena: reference.arena, slot: reference.slot, generation: reference.generation };
}

function resourceMaximum(profile, suffix) {
  const entry = profile.resources.find(({ id }) => id.endsWith(suffix));
  if (!entry) fail('GRAPH_RECLAIM_PROFILE', `Graph profile lacks ${suffix}`);
  return decimal(entry.maximum, 'GRAPH_RECLAIM_PROFILE', `${entry.id} maximum`);
}

function objectByRole(profile, role) {
  const object = profile.objectKinds.find((entry) => entry.role === role);
  if (!object) fail('GRAPH_RECLAIM_PROFILE', `Graph profile lacks ${role} object kind`);
  return object;
}

function lifecycleHasTransition(object, fromTail, toTail) {
  return object.lifecycle.transitions.some(({ from, to }) => stateTail(from) === fromTail && stateTail(to) === toTail);
}

function invalid(code) {
  return freeze({ kind: 'invalid', code }, 'Graph RECLAIM invalid result');
}

function pressure(code) {
  return freeze({ kind: 'pressure', code }, 'Graph RECLAIM pressure result');
}

function normalizedBlockers(sources, blockers = {}) {
  if (!isRecord(blockers)) fail('GRAPH_RECLAIM_FIXTURE', 'blockers must be a record');
  for (const key of Object.keys(blockers)) {
    if (!sources.includes(key)) fail('GRAPH_RECLAIM_FIXTURE', `unknown blocker source ${key}`);
  }
  return Object.fromEntries(sources.map((source) => [source, toDecimal(decimal(blockers[source] ?? '0', 'GRAPH_RECLAIM_FIXTURE', `${source} blocker count`))]));
}

function requireReferenceShape(reference, code = 'GRAPH_RECLAIM_REFERENCE') {
  if (!isRecord(reference)) fail(code, 'reference must be an object');
  exactKeys(reference, ['arena', 'generation', 'kind', 'slot'], code, 'reference');
  if (typeof reference.kind !== 'string' || reference.kind.length === 0) fail(code, 'reference kind is required');
  for (const field of ['arena', 'slot', 'generation']) decimal(reference[field], code, `reference ${field}`);
  return freeze(publicReference(reference), 'Graph RECLAIM reference');
}

function assertReclaimingProfile(profile) {
  if (profile === null || typeof profile !== 'object' || profile.mode !== 'materialized') fail('GRAPH_RECLAIM_PROFILE', 'materialized normalized Graph profile is required');
  const reclamation = profile.reclamation;
  if (!isRecord(reclamation) || !['enabled', 'none'].includes(reclamation.kind)) fail('GRAPH_RECLAIM_PROFILE', 'Graph reclamation mode is invalid');

  if (reclamation.kind === 'none') {
    const residueResources = profile.resources.filter(({ id }) => /reclaim|retirement/.test(id));
    const residuePorts = profile.ports.filter(({ id }) => ['retire', 'prove-quiescent', 'reclaim'].includes(id));
    const residueFailures = profile.failures.filter(({ code }) => code.startsWith('reclamation-') || code.startsWith('retirement-'));
    if (residueResources.length !== 0 || residuePorts.length !== 0 || residueFailures.length !== 0) fail('GRAPH_RECLAIM_PROFILE', 'reclamation:none must have zero reclaim-only resource/port/failure residue');
    return;
  }

  if (!Array.isArray(reclamation.protectionSources) || reclamation.protectionSources.length === 0 || new Set(reclamation.protectionSources).size !== reclamation.protectionSources.length) {
    fail('GRAPH_RECLAIM_PROFILE', 'enabled reclamation requires unique protection sources');
  }
  if (reclamation.transpositionRemoval !== 'non-returnable-tombstone') fail('GRAPH_RECLAIM_PROFILE', 'enabled reclamation requires non-returnable transposition tombstones');
  if (reclamation.generationAdvance !== 'before-slot-reuse') fail('GRAPH_RECLAIM_PROFILE', 'enabled reclamation requires generation advance before slot reuse');
  decimal(reclamation.maxWorkUnits, 'GRAPH_RECLAIM_PROFILE', 'reclamation maxWorkUnits');
  decimal(reclamation.maxScratchBytes, 'GRAPH_RECLAIM_PROFILE', 'reclamation maxScratchBytes');

  for (const id of ['retire', 'prove-quiescent', 'reclaim']) {
    const port = profile.ports.find((entry) => entry.id === id);
    if (!port) fail('GRAPH_RECLAIM_PROFILE', `enabled reclamation lacks ${id} port`);
    if (['prove-quiescent', 'reclaim'].includes(id) && port.completion !== 'finite-resumable') fail('GRAPH_RECLAIM_PROFILE', `${id} must be finite-resumable`);
  }

  for (const role of ['state-node', 'parent-edge', 'expansion', 'path-occurrence', 'transposition-entry']) {
    const object = objectByRole(profile, role);
    const tails = new Set(object.lifecycle.states.map(stateTail));
    if (!tails.has('retiring') || !tails.has('reclaimable')) fail('GRAPH_RECLAIM_PROFILE', `${role} lacks retiring/reclaimable lifecycle states`);
    if (!lifecycleHasTransition(object, 'retiring', 'reclaimable') || !lifecycleHasTransition(object, 'reclaimable', stateTail(object.lifecycle.initialState))) {
      fail('GRAPH_RECLAIM_PROFILE', `${role} lacks generation-safe reclamation lifecycle closure`);
    }
  }

  const retirement = objectByRole(profile, 'retirement-record');
  if (!lifecycleHasTransition(retirement, 'ready', 'released') || !lifecycleHasTransition(retirement, 'released', 'free')) {
    fail('GRAPH_RECLAIM_PROFILE', 'retirement-record lifecycle must release and privately reuse');
  }
}

export function createGraphReclaimOracle({ profile, initialObjects = [], ownerCleanup = () => ({ status: 'ready' }), admission = {}, mutations = {} } = {}) {
  assertReclaimingProfile(profile);
  if (!Array.isArray(initialObjects) || typeof ownerCleanup !== 'function' || !isRecord(admission) || !isRecord(mutations)) fail('GRAPH_RECLAIM_INPUT', 'invalid Graph RECLAIM oracle input');

  const enabled = profile.reclamation.kind === 'enabled';
  const sources = enabled ? [...profile.reclamation.protectionSources] : [];
  const limits = enabled ? {
    retirementRecords: resourceMaximum(profile, 'resource-retirement-records'),
    retirementBytes: resourceMaximum(profile, 'resource-retirement-bytes'),
    scratchBytes: resourceMaximum(profile, 'resource-reclaim-scratch'),
    workUnits: resourceMaximum(profile, 'resource-reclaim-work'),
    generation: decimal(profile.referenceEncoding.generationRange, 'GRAPH_RECLAIM_PROFILE', 'reference generationRange'),
  } : null;
  if (enabled) {
    const declaredWork = decimal(profile.reclamation.maxWorkUnits, 'GRAPH_RECLAIM_PROFILE', 'reclamation maxWorkUnits');
    const declaredScratch = decimal(profile.reclamation.maxScratchBytes, 'GRAPH_RECLAIM_PROFILE', 'reclamation maxScratchBytes');
    if (limits.workUnits < declaredWork || limits.scratchBytes < declaredScratch) fail('GRAPH_RECLAIM_PROFILE', 'reclamation work/scratch resources underfund the declared profile');
  }

  const admitted = enabled ? {
    retirementRecords: admission.retirementRecords === undefined ? limits.retirementRecords : decimal(admission.retirementRecords, 'GRAPH_RECLAIM_ADMISSION', 'retirementRecords'),
    scratchBytes: admission.scratchBytes === undefined ? limits.scratchBytes : decimal(admission.scratchBytes, 'GRAPH_RECLAIM_ADMISSION', 'scratchBytes'),
    workUnits: admission.workUnits === undefined ? limits.workUnits : decimal(admission.workUnits, 'GRAPH_RECLAIM_ADMISSION', 'workUnits'),
  } : null;
  if (enabled && (admitted.retirementRecords === 0n || admitted.retirementRecords > limits.retirementRecords || admitted.scratchBytes === 0n || admitted.scratchBytes > limits.scratchBytes || admitted.workUnits === 0n || admitted.workUnits > limits.workUnits)) {
    fail('GRAPH_RECLAIM_ADMISSION', 'test admission must be nonzero and within normalized reclaim capacity');
  }

  const objects = new Map();
  const retirementRecords = [];
  const transpositions = new Map();
  const events = [];
  let sequence = 0n;

  const emit = (type, detail) => events.push(freeze({ sequence: toDecimal(sequence++), type, detail }, 'Graph RECLAIM event'));

  function seed(initial) {
    if (!isRecord(initial)) fail('GRAPH_RECLAIM_FIXTURE', 'initial object must be a record');
    exactKeys(initial, ['blockers', 'ownerRecord', 'ownerRegionId', 'reference', 'transpositionKey'], 'GRAPH_RECLAIM_FIXTURE', 'initial object');
    const reference = requireReferenceShape(initial.reference, 'GRAPH_RECLAIM_FIXTURE');
    objectByRole(profile, reference.kind);
    if (objects.has(slotKey(reference))) fail('GRAPH_RECLAIM_FIXTURE', 'duplicate initial slot');
    if (typeof initial.transpositionKey !== 'string' || initial.transpositionKey.length === 0) fail('GRAPH_RECLAIM_FIXTURE', 'transpositionKey is required');
    if (initial.ownerRegionId !== null && typeof initial.ownerRegionId !== 'string') fail('GRAPH_RECLAIM_FIXTURE', 'ownerRegionId must be string or null');
    if (initial.ownerRegionId !== null && !profile.ownerRegions.some(({ id }) => id === initial.ownerRegionId)) fail('GRAPH_RECLAIM_FIXTURE', `unknown owner region ${initial.ownerRegionId}`);
    const entry = {
      reference,
      state: 'ready',
      blockers: normalizedBlockers(sources, initial.blockers),
      accessEpoch: 0n,
      proofEpoch: null,
      proofCursor: 0,
      transpositionKey: initial.transpositionKey,
      transposition: 'returnable',
      retirementRecordId: null,
      ownerRegionId: initial.ownerRegionId,
      ownerRecord: freeze(initial.ownerRecord, 'opaque Graph owner record'),
    };
    objects.set(slotKey(reference), entry);
    transpositions.set(initial.transpositionKey, slotKey(reference));
  }
  initialObjects.forEach(seed);

  function currentEntry(reference) {
    const parsed = requireReferenceShape(reference);
    const entry = objects.get(slotKey(parsed));
    if (!entry) return { parsed, error: 'invalid-reference' };
    if (entry.reference.generation !== parsed.generation) return { parsed, error: 'stale-reference' };
    return { parsed, entry };
  }

  function allocateRetirementRecord(entry) {
    let record = retirementRecords.find(({ state }) => state === 'free');
    if (record) {
      if (record.generation >= limits.generation) return { error: 'generation-exhausted' };
      record.generation += 1n;
    } else {
      if (BigInt(retirementRecords.length) >= admitted.retirementRecords) return { error: 'retirement-capacity' };
      record = { id: `retirement.${retirementRecords.length}`, generation: 0n, state: 'free', object: null };
      retirementRecords.push(record);
    }
    record.state = 'ready';
    record.object = slotKey(entry.reference);
    return { record };
  }

  function retire(input) {
    if (!isRecord(input) || Object.keys(input).length !== 1 || !Object.hasOwn(input, 'reference')) return invalid('invalid-reference');
    if (!enabled) return freeze({ kind: 'retained', disposition: profile.reclamation.disposition }, 'Graph no-reclamation disposition');
    const resolved = currentEntry(input.reference);
    if (resolved.error) return invalid(resolved.error);
    const { entry } = resolved;
    if (entry.state !== 'ready') return freeze({ kind: entry.state, code: 'reclamation-not-quiescent' }, 'Graph retirement state');
    const allocated = allocateRetirementRecord(entry);
    if (allocated.error === 'retirement-capacity') return pressure('retirement-capacity');
    if (allocated.error) return freeze({ kind: 'exhausted', code: allocated.error }, 'Graph retirement exhaustion');
    entry.retirementRecordId = allocated.record.id;
    entry.state = 'retiring';
    entry.proofEpoch = entry.accessEpoch;
    entry.proofCursor = 0;
    emit('retirement-started', { reference: entry.reference, retirementRecord: { id: allocated.record.id, generation: toDecimal(allocated.record.generation) } });
    return freeze({ kind: 'retiring', reference: entry.reference, retirementRecord: { id: allocated.record.id, generation: toDecimal(allocated.record.generation) } }, 'Graph retirement start');
  }

  function admitAccess(input) {
    if (!isRecord(input)) return invalid('invalid-reference');
    exactKeys(input, ['reference', 'source'], 'GRAPH_RECLAIM_ACCESS', 'access input');
    if (!sources.includes(input.source)) return invalid('invalid-protection-source');
    const resolved = currentEntry(input.reference);
    if (resolved.error) return invalid(resolved.error);
    const { entry } = resolved;
    if (enabled && entry.state !== 'ready' && mutations.allowAccessAfterRetirement !== true) return freeze({ kind: 'blocked', code: 'retiring', state: entry.state }, 'Graph retired access block');
    entry.blockers[input.source] = toDecimal(decimal(entry.blockers[input.source], 'GRAPH_RECLAIM_STATE', input.source) + 1n);
    entry.accessEpoch += 1n;
    emit('access-admitted', { reference: entry.reference, source: input.source });
    return freeze({ kind: 'admitted', source: input.source }, 'Graph access admission');
  }

  function releaseAccess(input) {
    if (!isRecord(input)) return invalid('invalid-reference');
    exactKeys(input, ['reference', 'source'], 'GRAPH_RECLAIM_ACCESS', 'release input');
    if (!sources.includes(input.source)) return invalid('invalid-protection-source');
    const resolved = currentEntry(input.reference);
    if (resolved.error) return invalid(resolved.error);
    const { entry } = resolved;
    const count = decimal(entry.blockers[input.source], 'GRAPH_RECLAIM_STATE', input.source);
    if (count === 0n) return invalid('no-held-access');
    entry.blockers[input.source] = toDecimal(count - 1n);
    entry.accessEpoch += 1n;
    emit('access-released', { reference: entry.reference, source: input.source });
    return freeze({ kind: 'released', source: input.source }, 'Graph access release');
  }

  function proveQuiescent(input) {
    if (!enabled) return freeze({ kind: 'not-selected' }, 'Graph quiescence absence');
    if (!isRecord(input)) return invalid('invalid-reference');
    exactKeys(input, ['reference', 'scratchBytes', 'workUnits'], 'GRAPH_RECLAIM_PROOF', 'quiescence input');
    const workUnits = decimal(input.workUnits, 'GRAPH_RECLAIM_PROOF', 'workUnits');
    const scratchBytes = decimal(input.scratchBytes, 'GRAPH_RECLAIM_PROOF', 'scratchBytes');
    if (workUnits === 0n || workUnits > admitted.workUnits) return pressure('reclamation-not-quiescent');
    if (scratchBytes === 0n || scratchBytes > admitted.scratchBytes) return pressure('reclamation-scratch-capacity');
    const resolved = currentEntry(input.reference);
    if (resolved.error) return invalid(resolved.error);
    const { entry } = resolved;
    if (entry.state === 'quarantined') return freeze({ kind: 'quarantined', code: 'reclamation-not-quiescent' }, 'Graph quarantined retirement');
    if (entry.state !== 'retiring' && entry.state !== 'reclaimable') return invalid('invalid-reference');
    if (entry.state === 'reclaimable') return freeze({ kind: 'quiescent', reference: entry.reference }, 'Graph already quiescent');

    if (entry.proofEpoch === null || entry.proofEpoch !== entry.accessEpoch) {
      entry.proofEpoch = entry.accessEpoch;
      entry.proofCursor = 0;
      emit('quiescence-proof-restarted', { reference: entry.reference, accessEpoch: toDecimal(entry.accessEpoch) });
    }

    let remaining = workUnits;
    while (remaining > 0n && entry.proofCursor < sources.length) {
      const source = sources[entry.proofCursor];
      const count = decimal(entry.blockers[source], 'GRAPH_RECLAIM_STATE', `${source} blocker count`);
      if (count !== 0n) {
        emit('quiescence-blocked', { reference: entry.reference, source, count: toDecimal(count) });
        return freeze({ kind: 'blocked', code: 'reclamation-not-quiescent', source, count: toDecimal(count), releasesWorker: true }, 'Graph quiescence blocker');
      }
      entry.proofCursor += 1;
      remaining -= 1n;
    }

    if (entry.proofCursor < sources.length) {
      emit('quiescence-pending', { reference: entry.reference, cursor: toDecimal(entry.proofCursor), sourceCount: toDecimal(sources.length) });
      return freeze({ kind: 'pending', cursor: toDecimal(entry.proofCursor), sourceCount: toDecimal(sources.length), progressOwner: 'device', releasesWorker: true, hostObservationRequired: false }, 'Graph incremental quiescence');
    }

    if (mutations.skipTombstoneBeforeReuse !== true) entry.transposition = 'tombstone';
    entry.state = 'reclaimable';
    emit('quiescence-proved', { reference: entry.reference, transposition: entry.transposition });
    return freeze({ kind: 'quiescent', reference: entry.reference, transposition: entry.transposition }, 'Graph quiescence proof');
  }

  function reclaim(input) {
    if (!enabled) return freeze({ kind: 'not-selected' }, 'Graph reclaim absence');
    if (!isRecord(input) || Object.keys(input).length !== 1 || !Object.hasOwn(input, 'reference')) return invalid('invalid-reference');
    const resolved = currentEntry(input.reference);
    if (resolved.error) return invalid(resolved.error);
    const { entry } = resolved;
    if (entry.state !== 'reclaimable') return freeze({ kind: 'blocked', code: 'reclamation-not-quiescent', state: entry.state }, 'Graph reclaim block');
    if (entry.transposition !== 'tombstone' && mutations.skipTombstoneBeforeReuse !== true) fail('GRAPH_RECLAIM_INVARIANT', 'transposition must be non-returnable before reclaim');

    if (entry.ownerRegionId !== null) {
      const opaque = freeze(entry.ownerRecord, 'Graph opaque owner cleanup record');
      const before = canonicalIdentity(opaque, 'Graph opaque owner cleanup record');
      const outcome = ownerCleanup(freeze({ regionId: entry.ownerRegionId, record: opaque, reference: entry.reference }, 'Graph owner cleanup request'));
      const after = canonicalIdentity(opaque, 'Graph opaque owner cleanup record');
      if (before.sha256 !== after.sha256) fail('GRAPH_RECLAIM_OWNER', 'owner cleanup mutated Graph-supplied opaque record');
      if (!isRecord(outcome) || typeof outcome.status !== 'string') fail('GRAPH_RECLAIM_OWNER', 'owner cleanup must return a status record');
      if (outcome.status === 'pending') return freeze({ kind: 'pending-owner-cleanup', state: entry.state }, 'Graph owner cleanup pending');
      if (outcome.status !== 'ready') {
        entry.state = 'quarantined';
        emit('owner-cleanup-failed', { reference: entry.reference, status: outcome.status });
        return freeze({ kind: 'quarantined', code: 'owner-lifecycle-failure', status: outcome.status }, 'Graph owner cleanup failure');
      }
      emit('owner-cleanup-complete', { reference: entry.reference, regionId: entry.ownerRegionId });
    }

    const oldReference = entry.reference;
    const oldGeneration = decimal(oldReference.generation, 'GRAPH_RECLAIM_STATE', 'object generation');
    if (oldGeneration === limits.generation) return freeze({ kind: 'exhausted', code: 'generation-exhausted' }, 'Graph generation exhaustion');
    const nextGeneration = mutations.skipGenerationAdvance === true ? oldGeneration : oldGeneration + 1n;
    entry.reference = freeze({ ...oldReference, generation: toDecimal(nextGeneration) }, 'Graph advanced slot generation');
    entry.state = 'free';
    entry.blockers = normalizedBlockers(sources);
    entry.accessEpoch += 1n;
    entry.proofEpoch = null;
    entry.proofCursor = 0;
    entry.transposition = 'absent';
    transpositions.delete(entry.transpositionKey);

    const record = retirementRecords.find(({ id }) => id === entry.retirementRecordId);
    if (!record || record.state !== 'ready') fail('GRAPH_RECLAIM_INVARIANT', 'retirement record missing during reclaim');
    record.state = 'free';
    record.object = null;
    const retiredRecord = { id: record.id, generation: toDecimal(record.generation) };
    entry.retirementRecordId = null;
    emit('storage-released', { oldReference, nextGeneration: toDecimal(nextGeneration), retirementRecord: retiredRecord });
    return freeze({ kind: 'reclaimed', oldReference, nextGeneration: toDecimal(nextGeneration), retirementRecord: retiredRecord }, 'Graph reclaim completion');
  }

  function reuseSlot(input) {
    if (!enabled) return freeze({ kind: 'not-selected' }, 'Graph reuse absence');
    if (!isRecord(input)) return invalid('invalid-reference');
    exactKeys(input, ['arena', 'blockers', 'kind', 'ownerRecord', 'ownerRegionId', 'slot', 'transpositionKey'], 'GRAPH_RECLAIM_REUSE', 'slot reuse');
    const lookup = objects.get(`${input.kind}\0${input.arena}\0${input.slot}`);
    if (!lookup || lookup.state !== 'free') return invalid('invalid-reference');
    if (lookup.retirementRecordId !== null) fail('GRAPH_RECLAIM_INVARIANT', 'slot reuse cannot retain a retirement record');
    lookup.state = 'ready';
    lookup.blockers = normalizedBlockers(sources, input.blockers);
    lookup.ownerRegionId = input.ownerRegionId;
    lookup.ownerRecord = freeze(input.ownerRecord, 'opaque Graph owner record');
    lookup.transpositionKey = input.transpositionKey;
    lookup.transposition = 'returnable';
    transpositions.set(input.transpositionKey, slotKey(lookup.reference));
    emit('slot-reused', { reference: lookup.reference, transpositionKey: input.transpositionKey });
    return freeze({ kind: 'reused', reference: lookup.reference }, 'Graph slot reuse');
  }

  function lookupTransposition(input) {
    if (!isRecord(input) || Object.keys(input).length !== 1 || typeof input.key !== 'string') return invalid('invalid-reference');
    const key = transpositions.get(input.key);
    if (!key) return freeze({ kind: 'miss' }, 'Graph transposition miss');
    const entry = objects.get(key);
    if (!entry) return freeze({ kind: 'miss' }, 'Graph transposition miss');
    if (entry.transposition === 'tombstone' || entry.transposition === 'absent') return freeze({ kind: 'miss', tombstone: entry.transposition === 'tombstone' }, 'Graph transposition non-returnable');
    if (entry.state === 'retiring' || entry.state === 'quarantined') return freeze({ kind: 'retiring', reference: entry.reference, state: entry.state }, 'Graph retiring transposition');
    if (entry.state === 'reclaimable') return freeze({ kind: 'miss', tombstone: true }, 'Graph reclaimable transposition');
    return freeze({ kind: 'found', reference: entry.reference, state: entry.state }, 'Graph transposition lookup');
  }

  function cancelRetirement(input) {
    if (!enabled) return freeze({ kind: 'not-selected' }, 'Graph cancellation absence');
    if (!isRecord(input) || Object.keys(input).length !== 1 || !Object.hasOwn(input, 'reference')) return invalid('invalid-reference');
    const resolved = currentEntry(input.reference);
    if (resolved.error) return invalid(resolved.error);
    const { entry } = resolved;
    if (!['retiring', 'reclaimable'].includes(entry.state)) return invalid('invalid-reference');
    entry.state = 'quarantined';
    emit('retirement-quarantined', { reference: entry.reference, transposition: entry.transposition });
    return freeze({ kind: 'quarantined', reference: entry.reference, transposition: entry.transposition }, 'Graph retirement cancellation');
  }

  function resumeRetirement(input) {
    if (!enabled) return freeze({ kind: 'not-selected' }, 'Graph resume absence');
    if (!isRecord(input) || Object.keys(input).length !== 1 || !Object.hasOwn(input, 'reference')) return invalid('invalid-reference');
    const resolved = currentEntry(input.reference);
    if (resolved.error) return invalid(resolved.error);
    const { entry } = resolved;
    if (entry.state !== 'quarantined') return invalid('invalid-reference');
    entry.state = 'retiring';
    entry.proofEpoch = entry.accessEpoch;
    entry.proofCursor = 0;
    emit('retirement-resumed', { reference: entry.reference });
    return freeze({ kind: 'retiring', reference: entry.reference }, 'Graph retirement resume');
  }

  function nativeQualification() {
    return freeze({ kind: 'not-qualified', requiredEvidence: 'native-compatible-pair-qualification', semanticEvidenceOnly: true }, 'Graph RECLAIM native claim limit');
  }

  function snapshot() {
    const base = {
      profileId: profile.id,
      reclamation: profile.reclamation.kind,
      objects: [...objects.values()].map((entry) => ({
        reference: entry.reference,
        state: entry.state,
        blockers: entry.blockers,
        accessEpoch: toDecimal(entry.accessEpoch),
        transpositionKey: entry.transpositionKey,
        transposition: entry.transposition,
        ownerRegionId: entry.ownerRegionId,
      })),
      events,
    };
    if (!enabled) return canonicalClone({ ...base, disposition: profile.reclamation.disposition }, 'Graph no-reclamation snapshot');
    return canonicalClone({
      ...base,
      limits: {
        retirementRecords: toDecimal(admitted.retirementRecords),
        scratchBytes: toDecimal(admitted.scratchBytes),
        workUnits: toDecimal(admitted.workUnits),
      },
      protectionSources: sources,
      retirementRecords: retirementRecords.map(({ id, generation, state, object }) => ({ id, generation: toDecimal(generation), state, object })),
    }, 'Graph RECLAIM snapshot');
  }

  return Object.freeze({
    retire,
    admitAccess,
    releaseAccess,
    proveQuiescent,
    reclaim,
    reuseSlot,
    lookupTransposition,
    cancelRetirement,
    resumeRetirement,
    nativeQualification,
    snapshot,
  });
}

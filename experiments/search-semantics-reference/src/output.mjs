import { canonicalClone, frozenCanonicalClone } from './canonical.mjs';
import { fail } from './errors.mjs';

const freeze = (value, label = 'Output value') => frozenCanonicalClone(value, label);
const COMPLETION_CLASSES = new Set(['complete', 'valid-partial', 'no-valid-result', 'failed']);
const FACT_STATES = new Set(['ready', 'absent', 'failed', 'pending', 'stale']);
const QUARANTINE_SOURCE_CODES = new Set([
  'OUTPUT_REFERENCE_STALE_ROOT',
  'OUTPUT_REFERENCE_SOURCE_GENERATION',
  'OUTPUT_REFERENCE_SOURCE_PROTECTION',
]);

function text(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail('OUTPUT_REFERENCE_ID', `${label} must be a non-empty string`);
  return value;
}

function dec(value, label) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) fail('OUTPUT_REFERENCE_DECIMAL', `${label} must be a canonical decimal string`);
  return BigInt(value);
}

function currentContext(input, profileId) {
  return freeze({
    searchIdentity: text(input.searchIdentity ?? 'search.synthetic', 'searchIdentity'),
    sessionIdentity: text(input.sessionIdentity ?? 'session.synthetic', 'sessionIdentity'),
    searchIncarnation: text(input.searchIncarnation ?? '1', 'searchIncarnation'),
    rootEpoch: text(input.rootEpoch ?? '1', 'rootEpoch'),
    workEpoch: text(input.workEpoch ?? '1', 'workEpoch'),
    profileId,
  }, 'Output context');
}

function completedWork(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('OUTPUT_REFERENCE_COMPLETED_WORK', 'completedWork must contain count/unit');
  const keys = Object.keys(input).sort();
  if (keys.length !== 2 || keys[0] !== 'count' || keys[1] !== 'unit') fail('OUTPUT_REFERENCE_COMPLETED_WORK', 'completedWork must contain exactly count/unit');
  return freeze({ count: dec(input.count, 'completedWork count').toString(), unit: text(input.unit, 'completedWork unit') }, 'completed work');
}

function assertReferenceProfile(profile) {
  if (!profile || typeof profile !== 'object') fail('OUTPUT_REFERENCE_PROFILE', 'normalized Output profile is required');
  if (profile.schema !== 'cuda-mcgs.output-profile/0.2.0') fail('OUTPUT_REFERENCE_PROFILE', 'unsupported Output profile schema');
  if (!profile.terminalEnvelope?.emptyPayloadValid || profile.terminal?.cut !== 'terminal-quiescent') fail('OUTPUT_REFERENCE_PROFILE', 'terminal Output contract is incomplete');
  if (profile.publication?.fullBeforeReady !== true || profile.publication?.readyImmutable !== true) fail('OUTPUT_REFERENCE_PROFILE', 'publication contract is incomplete');
  const liveSchemas = profile.schemas.filter(({ kind }) => kind === 'live');
  if (profile.observations?.kind === 'absent' && liveSchemas.length !== 0) fail('OUTPUT_REFERENCE_PROFILE_RESIDUE', 'terminal-only profile retains live schema');
  if (profile.observations?.kind === 'selected' && liveSchemas.length === 0) fail('OUTPUT_REFERENCE_PROFILE_RESIDUE', 'live Output profile lacks a live schema');
  for (const schema of profile.schemas) {
    if (schema.consistency === 'atomic-cut' && profile.snapshot?.atomicCommit === null) fail('OUTPUT_REFERENCE_PROFILE_CONSISTENCY', `${schema.id} claims atomic-cut without an atomic commit proof`);
    if (schema.consistency === 'versioned-cut' && profile.snapshot?.versionRelation === null) fail('OUTPUT_REFERENCE_PROFILE_CONSISTENCY', `${schema.id} claims versioned-cut without a version relation`);
    if (schema.consistency === 'independently-versioned' && profile.snapshot?.independentVersions === null) fail('OUTPUT_REFERENCE_PROFILE_CONSISTENCY', `${schema.id} claims independently-versioned without per-field version proof`);
  }
}

function cloneFact(fact) {
  return {
    fieldId: text(fact.fieldId, 'fieldId'),
    state: FACT_STATES.has(fact.state) ? fact.state : fail('OUTPUT_REFERENCE_SOURCE_STATE', `invalid source state ${fact.state}`),
    value: fact.value === undefined ? null : canonicalClone(fact.value, 'Output source value'),
    version: text(fact.version ?? '1', 'source version'),
    rootEpoch: text(fact.rootEpoch ?? '1', 'source rootEpoch'),
    workEpoch: text(fact.workEpoch ?? '1', 'source workEpoch'),
    generation: text(fact.generation ?? '1', 'source generation'),
    protected: fact.protected === true,
  };
}

function mapFacts(input) {
  if (!Array.isArray(input)) fail('OUTPUT_REFERENCE_SOURCE', 'source facts must be an array');
  const result = new Map();
  for (const raw of input) {
    const fact = cloneFact(raw);
    if (result.has(fact.fieldId)) fail('OUTPUT_REFERENCE_SOURCE', `duplicate source fact ${fact.fieldId}`);
    result.set(fact.fieldId, fact);
  }
  return result;
}

function fieldList(profile, schemaId) {
  return profile.fields
    .filter(({ schema }) => schema === schemaId)
    .sort((left, right) => Number(BigInt(left.order) - BigInt(right.order)));
}

function schemaFor(profile, schemaId) {
  const schema = profile.schemas.find(({ id }) => id === schemaId);
  if (!schema) fail('OUTPUT_REFERENCE_SCHEMA', `unknown Output schema ${schemaId}`);
  return schema;
}

function observationProfile(profile) {
  if (profile.observations?.kind !== 'selected') return null;
  if (profile.observations.profiles.length !== 1) fail('OUTPUT_REFERENCE_PROFILE', 'reference fixture currently requires one selected observation profile');
  return profile.observations.profiles[0];
}

function stableSlot(slot) {
  return {
    id: slot.id,
    requestId: slot.requestId,
    kind: slot.kind,
    incarnation: slot.incarnation,
    state: slot.state,
    context: slot.context,
    schemaId: slot.schemaId,
    sequence: slot.sequence,
    envelope: slot.envelope,
    payload: slot.payload,
    sourceDispositions: slot.sourceDispositions,
    versions: slot.versions,
    consistency: slot.consistency,
    lossAccounting: slot.lossAccounting,
    fullyInitialized: slot.fullyInitialized,
    quarantined: slot.quarantined,
    quarantineReason: slot.quarantineReason,
    borrows: [...slot.borrows.keys()].sort(),
    transfers: [...slot.transfers].sort(),
  };
}

export function createOutputOracle({ profile, mutations = {}, limits = {}, sequenceStart = '0' } = {}) {
  assertReferenceProfile(profile);
  const live = observationProfile(profile);
  const normalizedMaxSlots = live ? dec(live.maxSlots, 'observation maxSlots') : 0n;
  const normalizedMaxSequence = live ? dec(live.maxSequence, 'observation maxSequence') : 0n;
  const maxObservationSlots = limits.maxObservationSlots === undefined ? normalizedMaxSlots : dec(limits.maxObservationSlots, 'reference maxObservationSlots');
  const maxSequence = limits.maxSequence === undefined ? normalizedMaxSequence : dec(limits.maxSequence, 'reference maxSequence');
  const counterMaximum = dec(profile.workspace.counterMaximum, 'Output counterMaximum');
  if (maxObservationSlots > normalizedMaxSlots || maxSequence > normalizedMaxSequence) fail('OUTPUT_REFERENCE_LIMIT', 'reference limit exceeds normalized Output profile');

  let lifecycle = 'resources-admitted';
  let context = null;
  let firstStopCause = null;
  let sequence = dec(sequenceStart, 'sequenceStart');
  if (sequence > maxSequence) fail('OUTPUT_REFERENCE_GENERATION_EXHAUSTED', 'sequence start exceeds selected maximum');
  let sourceMutationCount = 0n;
  let hostProgressCount = 0n;
  const requests = new Map();
  const slots = new Map();
  const cleanup = new Map();
  const lostSequences = [];
  const counters = {
    requested: 0n,
    admitted: 0n,
    dropped: 0n,
    coalesced: 0n,
    failed: 0n,
    released: 0n,
    highWater: 0n,
  };

  const terminalSlot = {
    id: 'terminal-0', requestId: null, kind: 'terminal', incarnation: '1', state: 'vacant', context: null,
    schemaId: profile.terminal.schema, sequence: null, envelope: null, payload: null,
    sourceDispositions: [], versions: [], consistency: 'terminal-quiescent', lossAccounting: null,
    fullyInitialized: false, consistencyValid: true,
    borrows: new Map(), transfers: new Set(), quarantined: false, quarantineReason: null,
  };
  slots.set(terminalSlot.id, terminalSlot);
  cleanup.set('terminal-slot', 'pending');
  cleanup.set('terminal-payload', 'pending');

  function initializeOutputProfile(input = {}) {
    if (lifecycle !== 'resources-admitted') fail('OUTPUT_REFERENCE_LIFECYCLE', 'initialize requires resources-admitted lifecycle');
    context = currentContext(input, profile.id);
    terminalSlot.state = 'reserved';
    terminalSlot.context = context;
    lifecycle = live ? 'active-or-terminal-capture' : 'initialized';
    return { kind: 'initialized', context: canonicalClone(context), live: live !== null };
  }

  function requireInitialized() {
    if (context === null) fail('OUTPUT_REFERENCE_LIFECYCLE', 'Output profile is not initialized');
  }

  function exactCurrent(candidate, label = 'Output identity') {
    if (mutations.skipIncarnation === true) return;
    if (
      !candidate
      || candidate.sessionIdentity !== context.sessionIdentity
      || candidate.searchIncarnation !== context.searchIncarnation
      || candidate.rootEpoch !== context.rootEpoch
      || candidate.workEpoch !== context.workEpoch
      || candidate.profileId !== context.profileId
    ) fail('OUTPUT_REFERENCE_STALE_ROOT', `${label} is not current`);
  }

  function captureFields(schemaId, rawFacts, options = {}) {
    const schema = schemaFor(profile, schemaId);
    const facts = mapFacts(rawFacts);
    const payload = [];
    const sourceDispositions = [];
    const versions = [];
    for (const field of fieldList(profile, schemaId)) {
      const fact = facts.get(field.id) ?? {
        fieldId: field.id, state: 'absent', value: null, version: '0', rootEpoch: context.rootEpoch,
        workEpoch: context.workEpoch, generation: '0', protected: true,
      };
      if (fact.state === 'ready') {
        if (mutations.skipIncarnation !== true && (fact.rootEpoch !== context.rootEpoch || fact.workEpoch !== context.workEpoch)) fail('OUTPUT_REFERENCE_STALE_ROOT', `${field.id} source is stale`);
        const expectedGeneration = options.expectedGenerations?.[field.id];
        if (mutations.skipIncarnation !== true && expectedGeneration !== undefined && expectedGeneration !== fact.generation) fail('OUTPUT_REFERENCE_SOURCE_GENERATION', `${field.id} source generation is stale`);
        if (mutations.skipProtection !== true && fact.protected !== true) fail('OUTPUT_REFERENCE_SOURCE_PROTECTION', `${field.id} source is not protected`);
        payload.push({ fieldId: field.id, value: canonicalClone(fact.value), version: fact.version, generation: fact.generation });
        versions.push({ fieldId: field.id, version: fact.version, rootEpoch: fact.rootEpoch, workEpoch: fact.workEpoch, generation: fact.generation });
      } else {
        sourceDispositions.push({ fieldId: field.id, state: fact.state });
        if (mutations.skipReadiness === true && fact.state === 'pending') {
          payload.push({ fieldId: field.id, value: canonicalClone(fact.value), version: fact.version, generation: fact.generation });
          versions.push({ fieldId: field.id, version: fact.version, rootEpoch: fact.rootEpoch, workEpoch: fact.workEpoch, generation: fact.generation });
        } else if (options.completionClass === 'complete' && field.presence === 'required') {
          fail('OUTPUT_REFERENCE_SOURCE_UNAVAILABLE', `${field.id} is required for complete output`);
        }
      }
    }

    if (options.completionClass === 'no-valid-result' || options.completionClass === 'failed') payload.length = 0;

    const consistency = options.consistency ?? schema.consistency;
    let consistencyValid = true;
    if (consistency === 'versioned-cut' && versions.length !== 0) {
      const before = options.versionsBefore;
      const after = options.versionsAfter;
      const proofPresent = before && typeof before === 'object' && !Array.isArray(before) && after && typeof after === 'object' && !Array.isArray(after);
      const proofValid = proofPresent && versions.every(({ fieldId, version }) => before[fieldId] === version && after[fieldId] === version);
      if (!proofValid && mutations.skipConsistency !== true) consistencyValid = false;
    }
    if (consistency === 'atomic-cut' && profile.snapshot.atomicCommit === null) fail('OUTPUT_REFERENCE_PROFILE_CONSISTENCY', 'atomic capture lacks proof');
    return { payload: freeze(payload, 'Output payload'), sourceDispositions: freeze(sourceDispositions), versions: freeze(versions), consistency, consistencyValid };
  }

  function findSlot(input) {
    const id = text(input.slotId, 'slotId');
    const slot = slots.get(id);
    if (!slot) fail('OUTPUT_REFERENCE_SLOT', `unknown slot ${id}`);
    return slot;
  }

  function slotHandle(slot) {
    return {
      slotId: slot.id,
      incarnation: slot.incarnation,
      profileId: slot.context.profileId,
      schemaId: slot.schemaId,
      searchIncarnation: slot.context.searchIncarnation,
    };
  }

  function cleanupKeys(slot) {
    if (slot.kind === 'terminal') return { slot: 'terminal-slot', payload: 'terminal-payload', request: null, sequence: null };
    return {
      slot: `observation-slot:${slot.requestId}`,
      payload: `observation-payload:${slot.requestId}`,
      request: `observation-request:${slot.requestId}`,
      sequence: slot.sequence === null ? null : `sequence:${slot.sequence}`,
    };
  }

  function quarantineSlot(slot, reason) {
    if (!slot.quarantined) counters.failed += 1n;
    slot.state = 'retired';
    slot.quarantined = true;
    slot.quarantineReason = reason;
    const keys = cleanupKeys(slot);
    cleanup.set(keys.slot, 'quarantine');
    cleanup.set(keys.payload, 'quarantine');
    if (keys.request !== null) cleanup.set(keys.request, 'quarantine');
    if (keys.sequence !== null) cleanup.set(keys.sequence, 'quarantine');
    return { kind: 'quarantined', slotId: slot.id, reason };
  }

  function retireSlot(slot, reason) {
    if (['released', 'reusable', 'retired'].includes(slot.state)) return { kind: 'already-terminal', slotId: slot.id };
    slot.state = 'retired';
    counters.failed += 1n;
    const keys = cleanupKeys(slot);
    cleanup.set(keys.slot, 'retire');
    cleanup.set(keys.payload, 'retire');
    if (keys.request !== null) cleanup.set(keys.request, 'retire');
    if (keys.sequence !== null) cleanup.set(keys.sequence, 'invalidate');
    return { kind: 'failed', slotId: slot.id, reason };
  }

  function validateSlotIdentity(slot, input, code = 'OUTPUT_REFERENCE_SLOT_IDENTITY', { quarantineOnMismatch = false } = {}) {
    const expected = slotHandle(slot);
    for (const key of ['incarnation', 'profileId', 'schemaId', 'searchIncarnation']) {
      if (text(input[key], `${key}`) !== expected[key]) {
        if (quarantineOnMismatch) quarantineSlot(slot, `${code}:${key}`);
        fail(code, `slot ${slot.id} ${key} does not match current incarnation`);
      }
    }
  }

  function classifyTerminalResult(input) {
    requireInitialized();
    if (!COMPLETION_CLASSES.has(input.completionClass)) fail('OUTPUT_REFERENCE_COMPLETION_CLASS', 'invalid completion class');
    if (input.terminalCutReady !== true || input.resultVisibleResolved !== true) fail('OUTPUT_REFERENCE_TERMINAL_CUT', 'terminal capture requires terminal cut and resolved result-visible work');
    const cause = text(input.firstStopCause, 'firstStopCause');
    if (firstStopCause === null) firstStopCause = cause;
    else if (firstStopCause !== cause) fail('OUTPUT_REFERENCE_FIRST_CAUSE', 'first authoritative stop cause is immutable');
    const nextEnvelope = freeze({
      searchIdentity: context.searchIdentity,
      sessionIdentity: context.sessionIdentity,
      searchIncarnation: context.searchIncarnation,
      profileIdentity: context.profileId,
      completionClass: input.completionClass,
      firstStopCause,
      completedWork: completedWork(input.completedWork),
      policyBudgetStatus: input.policyBudgetStatus ?? 'satisfied',
      resourceStatus: canonicalClone(input.resourceStatus ?? { kind: 'conserved' }),
      diagnosticIdentity: text(input.diagnosticIdentity ?? 'diagnostic.none', 'diagnosticIdentity'),
      laterDispositions: canonicalClone(input.laterDispositions ?? []),
    }, 'terminal envelope');
    if (['capturing', 'publishing', 'ready'].includes(terminalSlot.state) && terminalSlot.envelope !== null) {
      if (JSON.stringify(terminalSlot.envelope) !== JSON.stringify(nextEnvelope)) {
        quarantineSlot(terminalSlot, 'conflicting-terminal-classification');
        fail('OUTPUT_REFERENCE_TERMINAL_CONFLICT', 'terminal classification retry differs from authoritative classification');
      }
      return { kind: 'already-classified', completionClass: terminalSlot.envelope.completionClass, firstStopCause };
    }
    if (terminalSlot.state !== 'reserved') fail('OUTPUT_REFERENCE_TERMINAL_STATE', `terminal classification is invalid from ${terminalSlot.state}`);
    terminalSlot.state = 'capturing';
    lifecycle = 'active-or-terminal-capture';
    terminalSlot.envelope = nextEnvelope;
    return { kind: 'classified', completionClass: input.completionClass, firstStopCause };
  }

  function captureTerminalPayload(input = {}) {
    requireInitialized();
    if (terminalSlot.state !== 'capturing') fail('OUTPUT_REFERENCE_TERMINAL_STATE', 'terminal payload requires classified capture');
    let captured;
    try {
      captured = captureFields(profile.terminal.schema, input.facts ?? [], {
        completionClass: terminalSlot.envelope.completionClass,
        consistency: 'terminal-quiescent',
        expectedGenerations: input.expectedGenerations,
      });
    } catch (error) {
      if (QUARANTINE_SOURCE_CODES.has(error.code)) quarantineSlot(terminalSlot, `terminal-source:${error.code}`);
      throw error;
    }
    terminalSlot.payload = captured.payload;
    terminalSlot.sourceDispositions = captured.sourceDispositions;
    terminalSlot.versions = captured.versions;
    terminalSlot.consistency = captured.consistency;
    terminalSlot.consistencyValid = captured.consistencyValid;
    terminalSlot.fullyInitialized = input.completeWrites !== false;
    terminalSlot.state = 'publishing';
    return { kind: 'captured', payloadFields: terminalSlot.payload.length, sourceDispositions: canonicalClone(terminalSlot.sourceDispositions) };
  }

  function lossAccounting() {
    return freeze({
      dropped: counters.dropped.toString(),
      coalesced: counters.coalesced.toString(),
      lostSequences: [...lostSequences],
    }, 'Output loss accounting');
  }

  function observationMetadata(slot) {
    if (slot.kind !== 'observation') return null;
    return freeze({
      searchIdentity: slot.context.searchIdentity,
      sessionIdentity: slot.context.sessionIdentity,
      searchIncarnation: slot.context.searchIncarnation,
      profileIdentity: slot.context.profileId,
      rootEpoch: slot.context.rootEpoch,
      workEpoch: slot.context.workEpoch,
      sequence: slot.sequence,
      consistency: slot.consistency,
      sourceVersions: slot.versions,
      sourceDispositions: slot.sourceDispositions,
      lossAccounting: slot.lossAccounting ?? lossAccounting(),
    }, 'observation freshness metadata');
  }

  function counterSnapshot() {
    const allSlots = [...slots.values()];
    return {
      requested: counters.requested.toString(),
      admitted: counters.admitted.toString(),
      capturing: String(allSlots.filter(({ state }) => state === 'capturing').length),
      publishing: String(allSlots.filter(({ state }) => state === 'publishing').length),
      ready: String(allSlots.filter(({ state }) => state === 'ready').length),
      borrowed: allSlots.reduce((sum, slot) => sum + BigInt(slot.borrows.size), 0n).toString(),
      dropped: counters.dropped.toString(),
      coalesced: counters.coalesced.toString(),
      failed: counters.failed.toString(),
      released: counters.released.toString(),
      highWater: counters.highWater.toString(),
    };
  }

  function publishOutput(input) {
    requireInitialized();
    const slot = findSlot(input);
    if (slot.state === 'ready') return { kind: 'already-ready', ...slotHandle(slot), sequence: slot.sequence, payload: canonicalClone(slot.payload), envelope: canonicalClone(slot.envelope), metadata: canonicalClone(observationMetadata(slot)) };
    if (slot.state !== 'publishing') fail('OUTPUT_REFERENCE_PUBLICATION_STATE', `slot ${slot.id} is not publishing`);
    if (mutations.skipPublicationReadiness !== true && slot.fullyInitialized !== true) {
      quarantineSlot(slot, 'partial-publication');
      fail('OUTPUT_REFERENCE_PUBLICATION_INCOMPLETE', `slot ${slot.id} is not fully initialized`);
    }
    if (mutations.skipIncarnation !== true) {
      try {
        exactCurrent(slot.context, 'publication slot');
      } catch (error) {
        if (error.code === 'OUTPUT_REFERENCE_STALE_ROOT') quarantineSlot(slot, 'stale-publication');
        throw error;
      }
    }
    if (mutations.skipConsistency !== true && slot.consistencyValid !== true) {
      quarantineSlot(slot, 'inconsistent-publication');
      fail('OUTPUT_REFERENCE_CAPTURE_INCONSISTENT', 'capture consistency is invalid');
    }
    if (slot.kind === 'observation') slot.lossAccounting = lossAccounting();
    slot.state = 'ready';
    slot.payload = freeze(slot.payload ?? [], 'published Output payload');
    slot.envelope = slot.envelope === null ? null : freeze(slot.envelope, 'published Output envelope');
    const keys = cleanupKeys(slot);
    cleanup.set(keys.slot, 'retain');
    cleanup.set(keys.payload, 'retain');
    if (keys.request !== null) cleanup.set(keys.request, 'retain');
    if (keys.sequence !== null) cleanup.set(keys.sequence, 'retain');
    return {
      kind: 'ready',
      ...slotHandle(slot),
      sequence: slot.sequence,
      payload: canonicalClone(slot.payload),
      envelope: canonicalClone(slot.envelope),
      metadata: canonicalClone(observationMetadata(slot)),
    };
  }

  function failOutput(input) {
    const slot = findSlot(input);
    const reason = text(input.reason ?? 'output-internal-failure', 'failure reason');
    if (['ready', 'publishing'].includes(slot.state)) return quarantineSlot(slot, reason);
    return retireSlot(slot, reason);
  }

  function activeObservationSlots() {
    return [...slots.values()].filter((slot) => slot.kind === 'observation' && !['released', 'reusable', 'retired'].includes(slot.state));
  }

  function advanceIncarnation(slot) {
    const current = dec(slot.incarnation, `${slot.id} incarnation`);
    if (current >= counterMaximum) fail('OUTPUT_REFERENCE_GENERATION_EXHAUSTED', `${slot.id} incarnation exhausted before alias`);
    slot.incarnation = (current + 1n).toString();
  }

  function markReusable(slot, disposition = 'release') {
    if (slot.quarantined) return { kind: 'quarantined', slotId: slot.id, reason: slot.quarantineReason };
    if (slot.borrows.size !== 0 || slot.transfers.size !== 0) return { kind: 'protected', slotId: slot.id, borrows: slot.borrows.size, transfers: slot.transfers.size };
    if (!['ready', 'retired', 'released', 'reusable'].includes(slot.state)) fail('OUTPUT_REFERENCE_REUSE', `slot ${slot.id} cannot be reused from ${slot.state}`);
    if (slot.state !== 'reusable') {
      advanceIncarnation(slot);
      counters.released += 1n;
    }
    slot.state = 'reusable';
    const keys = cleanupKeys(slot);
    cleanup.set(keys.slot, disposition);
    cleanup.set(keys.payload, disposition);
    if (keys.request !== null) cleanup.set(keys.request, disposition);
    if (keys.sequence !== null) cleanup.set(keys.sequence, disposition === 'release' ? 'invalidate' : disposition);
    return { kind: 'reusable', slotId: slot.id, incarnation: slot.incarnation };
  }

  function coalesceOne() {
    const candidate = activeObservationSlots().find((slot) => slot.state === 'ready' && slot.borrows.size === 0 && slot.transfers.size === 0);
    if (!candidate) return false;
    if (candidate.sequence !== null) lostSequences.push(candidate.sequence);
    counters.coalesced += 1n;
    markReusable(candidate, 'invalidate');
    return true;
  }

  function admitObservationRequest(input) {
    requireInitialized();
    if (live === null) fail('OUTPUT_REFERENCE_LIVE_ABSENT', 'live observation is not selected');
    if (lifecycle === 'draining' || lifecycle === 'terminal' || lifecycle === 'released') fail('OUTPUT_REFERENCE_ADMISSION_CLOSED', 'observation admission is closed');
    const requestId = text(input.requestId, 'requestId');
    if (requests.has(requestId)) fail('OUTPUT_REFERENCE_REQUEST', `duplicate request ${requestId}`);
    if (input.authorized !== true) fail('OUTPUT_REFERENCE_PERMISSION', 'observation request is not authorized');
    if (input.runtimeSchema !== undefined) fail('OUTPUT_REFERENCE_RUNTIME_SCHEMA', 'runtime observation schema is prohibited');
    const identity = {
      sessionIdentity: text(input.sessionIdentity ?? context.sessionIdentity, 'request sessionIdentity'),
      searchIncarnation: text(input.searchIncarnation ?? context.searchIncarnation, 'request searchIncarnation'),
      rootEpoch: text(input.rootEpoch ?? context.rootEpoch, 'request rootEpoch'),
      workEpoch: text(input.workEpoch ?? context.workEpoch, 'request workEpoch'),
      profileId: text(input.profileId ?? context.profileId, 'request profileId'),
    };
    exactCurrent(identity, 'observation request');
    const schemaId = text(input.schemaId ?? live.schemas[0], 'observation schema');
    if (!live.schemas.includes(schemaId)) fail('OUTPUT_REFERENCE_SCHEMA', 'request names an unselected live schema');
    const nextRequested = counters.requested + 1n;
    if (nextRequested > dec(live.maxRequests, 'observation maxRequests')) fail('OUTPUT_REFERENCE_CAPACITY', 'observation request capacity exhausted');
    counters.requested = nextRequested;
    if (BigInt(activeObservationSlots().length) >= maxObservationSlots) {
      if (live.pressure.kind === 'latest-coalesce' && coalesceOne()) {
        // capacity made available by exact unborrowed coalescing
      } else if (live.pressure.kind === 'drop-new') {
        counters.dropped += 1n;
        return { kind: 'dropped', requestId, lossAccounting: canonicalClone(lossAccounting()) };
      } else {
        fail('OUTPUT_REFERENCE_CAPACITY', 'observation slot capacity exhausted');
      }
    }
    const slot = {
      id: `observation-${requestId}`, requestId, kind: 'observation', incarnation: '1', state: 'reserved', context: freeze({ ...context, ...identity }),
      schemaId, sequence: null, envelope: null, payload: null, sourceDispositions: [], versions: [], consistency: live.consistency,
      lossAccounting: null, fullyInitialized: false, consistencyValid: true,
      borrows: new Map(), transfers: new Set(), quarantined: false, quarantineReason: null,
    };
    requests.set(requestId, slot.id);
    slots.set(slot.id, slot);
    cleanup.set(`observation-request:${requestId}`, 'pending');
    cleanup.set(`observation-slot:${requestId}`, 'pending');
    cleanup.set(`observation-payload:${requestId}`, 'pending');
    counters.admitted += 1n;
    const active = BigInt(activeObservationSlots().length);
    if (active > counters.highWater) counters.highWater = active;
    return { kind: 'admitted', requestId, slotId: slot.id };
  }

  function captureObservation(input) {
    requireInitialized();
    const requestId = text(input.requestId, 'requestId');
    const slotId = requests.get(requestId);
    const slot = slotId ? slots.get(slotId) : null;
    if (!slot) fail('OUTPUT_REFERENCE_REQUEST', `unknown request ${requestId}`);
    if (!['reserved', 'capturing'].includes(slot.state)) fail('OUTPUT_REFERENCE_CAPTURE_STATE', `request ${requestId} cannot capture from ${slot.state}`);
    try {
      exactCurrent(slot.context, 'observation capture');
    } catch (error) {
      if (error.code === 'OUTPUT_REFERENCE_STALE_ROOT') quarantineSlot(slot, 'stale-observation-capture');
      throw error;
    }
    slot.state = 'capturing';
    let captured;
    try {
      captured = captureFields(slot.schemaId, input.facts ?? [], {
        consistency: live.consistency,
        versionsBefore: input.versionsBefore,
        versionsAfter: input.versionsAfter,
        expectedGenerations: input.expectedGenerations,
      });
    } catch (error) {
      if (QUARANTINE_SOURCE_CODES.has(error.code)) quarantineSlot(slot, `observation-source:${error.code}`);
      throw error;
    }
    if (!captured.consistencyValid && mutations.skipConsistency !== true) {
      slot.state = 'reserved';
      return { kind: 'retry', code: 'output-capture-inconsistent' };
    }
    if (sequence >= maxSequence) {
      retireSlot(slot, 'output-generation-exhausted');
      fail('OUTPUT_REFERENCE_GENERATION_EXHAUSTED', 'observation sequence exhausted before alias');
    }
    sequence += 1n;
    slot.sequence = sequence.toString();
    slot.payload = captured.payload;
    slot.sourceDispositions = captured.sourceDispositions;
    slot.versions = captured.versions;
    slot.consistency = captured.consistency;
    slot.consistencyValid = captured.consistencyValid;
    slot.fullyInitialized = input.completeWrites !== false;
    slot.state = 'publishing';
    cleanup.set(`observation-payload:${requestId}`, 'pending');
    cleanup.set(`sequence:${slot.sequence}`, 'retain');
    return {
      kind: 'captured', slotId: slot.id, sequence: slot.sequence, consistency: captured.consistency,
      versions: canonicalClone(slot.versions), omitted: canonicalClone(slot.sourceDispositions),
    };
  }

  function cancelObservation(input) {
    const requestId = text(input.requestId, 'requestId');
    const slotId = requests.get(requestId);
    const slot = slotId ? slots.get(slotId) : null;
    if (!slot) fail('OUTPUT_REFERENCE_REQUEST', `unknown request ${requestId}`);
    if (slot.state === 'ready') return { kind: 'delivery-cancelled', slotId: slot.id, payloadImmutable: true };
    if (!['released', 'reusable', 'retired'].includes(slot.state)) {
      slot.state = 'released';
      counters.released += 1n;
      const keys = cleanupKeys(slot);
      cleanup.set(keys.request, 'release');
      cleanup.set(keys.slot, 'release');
      cleanup.set(keys.payload, 'release');
      if (keys.sequence !== null) cleanup.set(keys.sequence, 'invalidate');
    }
    return { kind: 'cancelled', slotId: slot.id };
  }

  function acquireOutput(input) {
    const slot = findSlot(input);
    if (slot.state !== 'ready') fail('OUTPUT_REFERENCE_BORROW', 'only ready output may be borrowed');
    validateSlotIdentity(slot, input, 'OUTPUT_REFERENCE_BORROW_IDENTITY', { quarantineOnMismatch: true });
    const borrowId = text(input.borrowId, 'borrowId');
    if (slot.borrows.has(borrowId)) fail('OUTPUT_REFERENCE_BORROW', 'duplicate borrow id');
    const max = slot.kind === 'observation' && live ? dec(live.maxBorrows, 'observation maxBorrows') : dec(profile.publication.maxBorrows, 'publication maxBorrows');
    if (BigInt(slot.borrows.size) >= max) fail('OUTPUT_REFERENCE_BORROW_CAPACITY', 'borrow capacity exhausted');
    slot.borrows.set(borrowId, { expired: false });
    cleanup.set(`borrow:${slot.id}:${borrowId}`, 'pending');
    return {
      kind: 'borrowed',
      ...slotHandle(slot),
      borrowId,
      payload: canonicalClone(slot.payload),
      envelope: canonicalClone(slot.envelope),
      metadata: canonicalClone(observationMetadata(slot)),
    };
  }

  function releaseOutput(input) {
    const slot = findSlot(input);
    validateSlotIdentity(slot, input, 'OUTPUT_REFERENCE_BORROW_IDENTITY', { quarantineOnMismatch: true });
    const borrowId = text(input.borrowId, 'borrowId');
    const borrow = slot.borrows.get(borrowId);
    if (!borrow) fail('OUTPUT_REFERENCE_BORROW_RELEASE', 'borrow release is not exact-once');
    if (borrow.expired && input.operationQuiescent !== true) fail('OUTPUT_REFERENCE_BORROW_QUIESCENCE', 'expired borrow release requires exact operation quiescence proof');
    slot.borrows.delete(borrowId);
    cleanup.set(`borrow:${slot.id}:${borrowId}`, 'release');
    return { kind: 'released', borrowId };
  }

  function expireBorrow(input) {
    const slot = findSlot(input);
    validateSlotIdentity(slot, input, 'OUTPUT_REFERENCE_BORROW_IDENTITY', { quarantineOnMismatch: true });
    const borrowId = text(input.borrowId, 'borrowId');
    const borrow = slot.borrows.get(borrowId);
    if (!borrow) fail('OUTPUT_REFERENCE_BORROW', 'unknown borrow');
    borrow.expired = true;
    return { kind: 'expired', slotId: slot.id, borrowId, stillProtected: slot.transfers.size > 0 || slot.borrows.size > 0 };
  }

  function beginHostTransfer(input) {
    const slot = findSlot(input);
    if (slot.state !== 'ready') fail('OUTPUT_REFERENCE_TRANSFER', 'host transfer requires ready output');
    validateSlotIdentity(slot, input, 'OUTPUT_REFERENCE_TRANSFER_IDENTITY');
    const transferId = text(input.transferId, 'transferId');
    if (slot.transfers.has(transferId)) fail('OUTPUT_REFERENCE_TRANSFER', 'duplicate transfer id');
    slot.transfers.add(transferId);
    cleanup.set(`transfer:${slot.id}:${transferId}`, 'pending');
    return { kind: 'transfer-started', transferId, searchAuthority: false };
  }

  function completeHostTransfer(input) {
    const slot = findSlot(input);
    validateSlotIdentity(slot, input, 'OUTPUT_REFERENCE_TRANSFER_IDENTITY');
    const transferId = text(input.transferId, 'transferId');
    if (!slot.transfers.delete(transferId)) fail('OUTPUT_REFERENCE_TRANSFER', 'unknown transfer');
    cleanup.set(`transfer:${slot.id}:${transferId}`, 'release');
    return { kind: 'transfer-complete', transferId, searchProgressed: false };
  }

  function classifyOutputReuse(input) {
    const slot = findSlot(input);
    validateSlotIdentity(slot, input, 'OUTPUT_REFERENCE_REUSE_IDENTITY');
    return markReusable(slot);
  }

  function advanceRoot(input) {
    requireInitialized();
    context = freeze({
      ...context,
      rootEpoch: text(input.rootEpoch, 'new rootEpoch'),
      workEpoch: text(input.workEpoch, 'new workEpoch'),
    }, 'advanced Output context');
    return { kind: 'advanced', rootEpoch: context.rootEpoch, workEpoch: context.workEpoch };
  }

  function outputCurrent(input) {
    const slot = findSlot(input);
    return slot.context.sessionIdentity === context.sessionIdentity
      && slot.context.rootEpoch === context.rootEpoch
      && slot.context.workEpoch === context.workEpoch
      && slot.context.searchIncarnation === context.searchIncarnation;
  }

  function captureBoundedSequence(input) {
    if (!Array.isArray(input.items)) fail('OUTPUT_REFERENCE_SEQUENCE', 'sequence items must be an array');
    const maxDepth = Number(dec(input.maxDepth ?? '1', 'sequence maxDepth'));
    const seen = new Set();
    const captured = [];
    for (let index = 0; index < input.items.length; index += 1) {
      if (index >= maxDepth) return { kind: 'truncated', captured, truncatedAt: index };
      const item = input.items[index];
      const id = text(item.id, 'sequence item id');
      const generation = text(item.generation ?? '1', 'sequence generation');
      const expectedGeneration = input.expectedGenerations?.[id];
      if (item.state === 'stale' || (expectedGeneration !== undefined && expectedGeneration !== generation)) return { kind: 'stale', captured, staleId: id };
      if (seen.has(id)) return { kind: 'cycle', captured, cycleId: id };
      seen.add(id);
      captured.push({ id, generation });
    }
    return { kind: 'complete', captured };
  }

  function teardown() {
    requireInitialized();
    lifecycle = 'draining';
    for (const [requestId, slotId] of requests) {
      const slot = slots.get(slotId);
      if (['reserved', 'capturing', 'publishing'].includes(slot.state)) cancelObservation({ requestId });
      else if (slot.state === 'ready' && slot.borrows.size === 0 && slot.transfers.size === 0) markReusable(slot, 'release');
    }
    const protectedSlots = [...slots.values()].filter((slot) => slot.borrows.size !== 0 || slot.transfers.size !== 0);
    if (protectedSlots.length !== 0) return { kind: 'pending-borrow-or-transfer', slots: protectedSlots.map(({ id }) => id).sort() };
    if (['capturing', 'publishing'].includes(terminalSlot.state)) return { kind: 'pending-terminal-publication', state: terminalSlot.state };
    if (terminalSlot.state === 'reserved') return { kind: 'pending-terminal-result' };
    if (terminalSlot.quarantined) {
      lifecycle = 'terminal';
      return { kind: 'terminal-quarantined', reason: terminalSlot.quarantineReason };
    }
    lifecycle = terminalSlot.state === 'ready' ? 'terminal' : 'released';
    cleanup.set('source-protection', 'release');
    cleanup.set('diagnostic', 'release');
    cleanup.set('program-artifact', 'release');
    return { kind: lifecycle === 'terminal' ? 'terminal-retained' : 'released' };
  }

  function cleanupReport() {
    for (const kind of profile.cleanup.kinds) if (!cleanup.has(kind)) cleanup.set(kind, kind === 'terminal-slot' && terminalSlot.state === 'ready' ? 'retain' : 'release');
    return [...cleanup.entries()].map(([id, disposition]) => ({ id, disposition })).sort((left, right) => left.id.localeCompare(right.id));
  }

  function snapshot() {
    return freeze({
      lifecycle,
      context,
      firstStopCause,
      sequence: sequence.toString(),
      counters: counterSnapshot(),
      lossAccounting: lossAccounting(),
      sourceMutationCount: sourceMutationCount.toString(),
      hostProgressCount: hostProgressCount.toString(),
      slots: [...slots.values()].map(stableSlot).sort((left, right) => left.id.localeCompare(right.id)),
      cleanup: cleanupReport(),
    }, 'Output snapshot');
  }

  return {
    initializeOutputProfile,
    classifyTerminalResult,
    captureTerminalPayload,
    admitObservationRequest,
    captureObservation,
    cancelObservation,
    publishOutput,
    failOutput,
    acquireOutput,
    releaseOutput,
    expireBorrow,
    beginHostTransfer,
    completeHostTransfer,
    classifyOutputReuse,
    advanceRoot,
    outputCurrent,
    captureBoundedSequence,
    teardown,
    cleanupReport,
    snapshot,
  };
}

import { canonicalClone, frozenCanonicalClone } from './canonical.mjs';
import { fail } from './errors.mjs';

const freeze = (value, label = 'Output value') => frozenCanonicalClone(value, label);
const COMPLETION_CLASSES = new Set(['complete', 'valid-partial', 'no-valid-result', 'failed']);
const FACT_STATES = new Set(['ready', 'absent', 'failed', 'pending', 'stale']);

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
    fullyInitialized: slot.fullyInitialized,
    quarantined: slot.quarantined,
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
  const counters = {
    requested: 0n, admitted: 0n, capturing: 0n, publishing: 0n, ready: 0n,
    borrowed: 0n, dropped: 0n, coalesced: 0n, failed: 0n, released: 0n, highWater: 0n,
  };

  const terminalSlot = {
    id: 'terminal-0', kind: 'terminal', incarnation: '1', state: 'vacant', context: null,
    schemaId: profile.terminal.schema, sequence: null, envelope: null, payload: null,
    sourceDispositions: [], versions: [], fullyInitialized: false, consistencyValid: true,
    borrows: new Map(), transfers: new Set(), quarantined: false,
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
    if (!candidate || candidate.searchIncarnation !== context.searchIncarnation || candidate.rootEpoch !== context.rootEpoch || candidate.workEpoch !== context.workEpoch || candidate.profileId !== context.profileId) {
      fail('OUTPUT_REFERENCE_STALE_ROOT', `${label} is not current`);
    }
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
    if (consistency === 'versioned-cut') {
      const before = options.versionsBefore ?? {};
      const after = options.versionsAfter ?? before;
      const changed = versions.some(({ fieldId, version }) => (before[fieldId] ?? version) !== (after[fieldId] ?? version));
      if (changed && mutations.skipConsistency !== true) consistencyValid = false;
    }
    if (consistency === 'atomic-cut' && profile.snapshot.atomicCommit === null) fail('OUTPUT_REFERENCE_PROFILE_CONSISTENCY', 'atomic capture lacks proof');
    return { payload: freeze(payload, 'Output payload'), sourceDispositions: freeze(sourceDispositions), versions: freeze(versions), consistency, consistencyValid };
  }

  function classifyTerminalResult(input) {
    requireInitialized();
    if (!COMPLETION_CLASSES.has(input.completionClass)) fail('OUTPUT_REFERENCE_COMPLETION_CLASS', 'invalid completion class');
    if (input.terminalCutReady !== true || input.resultVisibleResolved !== true) fail('OUTPUT_REFERENCE_TERMINAL_CUT', 'terminal capture requires terminal cut and resolved result-visible work');
    const cause = text(input.firstStopCause, 'firstStopCause');
    if (firstStopCause === null) firstStopCause = cause;
    else if (firstStopCause !== cause) fail('OUTPUT_REFERENCE_FIRST_CAUSE', 'first authoritative stop cause is immutable');
    if (!['reserved', 'capturing'].includes(terminalSlot.state)) fail('OUTPUT_REFERENCE_TERMINAL_STATE', `terminal classification is invalid from ${terminalSlot.state}`);
    terminalSlot.state = 'capturing';
    lifecycle = 'active-or-terminal-capture';
    terminalSlot.envelope = freeze({
      searchIdentity: context.searchIdentity,
      sessionIdentity: context.sessionIdentity,
      searchIncarnation: context.searchIncarnation,
      profileIdentity: context.profileId,
      completionClass: input.completionClass,
      firstStopCause,
      completedWork: text(input.completedWork ?? '0', 'completedWork'),
      policyBudgetStatus: input.policyBudgetStatus ?? 'satisfied',
      resourceStatus: canonicalClone(input.resourceStatus ?? { kind: 'conserved' }),
      diagnosticIdentity: text(input.diagnosticIdentity ?? 'diagnostic.none', 'diagnosticIdentity'),
      laterDispositions: canonicalClone(input.laterDispositions ?? []),
    }, 'terminal envelope');
    return { kind: 'classified', completionClass: input.completionClass, firstStopCause };
  }

  function captureTerminalPayload(input = {}) {
    requireInitialized();
    if (terminalSlot.state !== 'capturing') fail('OUTPUT_REFERENCE_TERMINAL_STATE', 'terminal payload requires classified capture');
    const captured = captureFields(profile.terminal.schema, input.facts ?? [], { completionClass: terminalSlot.envelope.completionClass, consistency: 'terminal-quiescent' });
    terminalSlot.payload = captured.payload;
    terminalSlot.sourceDispositions = captured.sourceDispositions;
    terminalSlot.versions = captured.versions;
    terminalSlot.consistencyValid = captured.consistencyValid;
    terminalSlot.fullyInitialized = input.completeWrites !== false;
    terminalSlot.state = 'publishing';
    counters.capturing += 1n;
    counters.publishing += 1n;
    return { kind: 'captured', payloadFields: terminalSlot.payload.length, sourceDispositions: canonicalClone(terminalSlot.sourceDispositions) };
  }

  function findSlot(input) {
    const id = text(input.slotId, 'slotId');
    const slot = slots.get(id);
    if (!slot) fail('OUTPUT_REFERENCE_SLOT', `unknown slot ${id}`);
    return slot;
  }

  function publishOutput(input) {
    requireInitialized();
    const slot = findSlot(input);
    if (slot.state === 'ready') return { kind: 'already-ready', slotId: slot.id };
    if (slot.state !== 'publishing') fail('OUTPUT_REFERENCE_PUBLICATION_STATE', `slot ${slot.id} is not publishing`);
    // RED-BEFORE-GREEN: the permanent oracle must reject !slot.fullyInitialized here.
    // The first focused probe intentionally proves this missing guard before it is added.
    if (mutations.skipIncarnation !== true) exactCurrent(slot.context, 'publication slot');
    if (mutations.skipConsistency !== true && slot.consistencyValid !== true) fail('OUTPUT_REFERENCE_CAPTURE_INCONSISTENT', 'capture consistency is invalid');
    slot.state = 'ready';
    slot.payload = freeze(slot.payload ?? [], 'published Output payload');
    slot.envelope = slot.envelope === null ? null : freeze(slot.envelope, 'published Output envelope');
    counters.publishing -= 1n;
    counters.ready += 1n;
    return { kind: 'ready', slotId: slot.id, sequence: slot.sequence, payload: canonicalClone(slot.payload), envelope: canonicalClone(slot.envelope) };
  }

  function failOutput(input) {
    const slot = findSlot(input);
    const reason = text(input.reason ?? 'output-internal-failure', 'failure reason');
    if (slot.state === 'ready') {
      slot.state = 'retired';
      slot.quarantined = true;
      cleanup.set(slot.kind === 'terminal' ? 'terminal-payload' : 'observation-payload', 'quarantine');
      counters.failed += 1n;
      return { kind: 'quarantined', slotId: slot.id, reason };
    }
    if (['released', 'reusable', 'retired'].includes(slot.state)) return { kind: 'already-terminal', slotId: slot.id };
    slot.state = 'retired';
    counters.failed += 1n;
    return { kind: 'failed', slotId: slot.id, reason };
  }

  function activeObservationSlots() {
    return [...slots.values()].filter((slot) => slot.kind === 'observation' && !['released', 'reusable', 'retired'].includes(slot.state));
  }

  function coalesceOne() {
    const candidate = activeObservationSlots().find((slot) => slot.state === 'ready' && slot.borrows.size === 0 && slot.transfers.size === 0);
    if (!candidate) return false;
    candidate.state = 'reusable';
    counters.ready -= 1n;
    counters.released += 1n;
    counters.coalesced += 1n;
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
      searchIncarnation: text(input.searchIncarnation ?? context.searchIncarnation, 'request searchIncarnation'),
      rootEpoch: text(input.rootEpoch ?? context.rootEpoch, 'request rootEpoch'),
      workEpoch: text(input.workEpoch ?? context.workEpoch, 'request workEpoch'),
      profileId: text(input.profileId ?? context.profileId, 'request profileId'),
    };
    exactCurrent(identity, 'observation request');
    const schemaId = text(input.schemaId ?? live.schemas[0], 'observation schema');
    if (!live.schemas.includes(schemaId)) fail('OUTPUT_REFERENCE_SCHEMA', 'request names an unselected live schema');
    counters.requested += 1n;
    if (counters.requested > dec(live.maxRequests, 'observation maxRequests')) fail('OUTPUT_REFERENCE_CAPACITY', 'observation request capacity exhausted');
    if (BigInt(activeObservationSlots().length) >= maxObservationSlots) {
      if (live.pressure.kind === 'latest-coalesce' && coalesceOne()) {
        // capacity made available by exact unborrowed coalescing
      } else if (live.pressure.kind === 'drop-new') {
        counters.dropped += 1n;
        return { kind: 'dropped', requestId };
      } else {
        fail('OUTPUT_REFERENCE_CAPACITY', 'observation slot capacity exhausted');
      }
    }
    const slot = {
      id: `observation-${requestId}`, kind: 'observation', incarnation: '1', state: 'reserved', context: freeze({ ...context, ...identity }),
      schemaId, sequence: null, envelope: null, payload: null, sourceDispositions: [], versions: [], fullyInitialized: false, consistencyValid: true,
      borrows: new Map(), transfers: new Set(), quarantined: false,
    };
    requests.set(requestId, slot.id);
    slots.set(slot.id, slot);
    cleanup.set(`observation-request:${requestId}`, 'pending');
    cleanup.set(`observation-slot:${requestId}`, 'pending');
    counters.admitted += 1n;
    counters.highWater = counters.admitted > counters.highWater ? counters.admitted : counters.highWater;
    return { kind: 'admitted', requestId, slotId: slot.id };
  }

  function captureObservation(input) {
    requireInitialized();
    const requestId = text(input.requestId, 'requestId');
    const slotId = requests.get(requestId);
    const slot = slotId ? slots.get(slotId) : null;
    if (!slot) fail('OUTPUT_REFERENCE_REQUEST', `unknown request ${requestId}`);
    if (slot.state !== 'reserved' && slot.state !== 'capturing') fail('OUTPUT_REFERENCE_CAPTURE_STATE', `request ${requestId} cannot capture from ${slot.state}`);
    exactCurrent(slot.context, 'observation capture');
    slot.state = 'capturing';
    const captured = captureFields(slot.schemaId, input.facts ?? [], {
      consistency: live.consistency,
      versionsBefore: input.versionsBefore,
      versionsAfter: input.versionsAfter,
    });
    if (!captured.consistencyValid && mutations.skipConsistency !== true) {
      slot.state = 'reserved';
      return { kind: 'retry', code: 'output-capture-inconsistent' };
    }
    if (sequence >= maxSequence) fail('OUTPUT_REFERENCE_GENERATION_EXHAUSTED', 'observation sequence exhausted before alias');
    sequence += 1n;
    slot.sequence = sequence.toString();
    slot.payload = captured.payload;
    slot.sourceDispositions = captured.sourceDispositions;
    slot.versions = captured.versions;
    slot.consistencyValid = captured.consistencyValid;
    slot.fullyInitialized = input.completeWrites !== false;
    slot.state = 'publishing';
    counters.capturing += 1n;
    counters.publishing += 1n;
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
      cleanup.set(`observation-request:${requestId}`, 'release');
      cleanup.set(`observation-slot:${requestId}`, 'release');
    }
    return { kind: 'cancelled', slotId: slot.id };
  }

  function acquireOutput(input) {
    const slot = findSlot(input);
    if (slot.state !== 'ready') fail('OUTPUT_REFERENCE_BORROW', 'only ready output may be borrowed');
    const borrowId = text(input.borrowId, 'borrowId');
    if (slot.borrows.has(borrowId)) fail('OUTPUT_REFERENCE_BORROW', 'duplicate borrow id');
    const max = slot.kind === 'observation' && live ? dec(live.maxBorrows, 'observation maxBorrows') : dec(profile.publication.maxBorrows, 'publication maxBorrows');
    if (BigInt(slot.borrows.size) >= max) fail('OUTPUT_REFERENCE_BORROW_CAPACITY', 'borrow capacity exhausted');
    slot.borrows.set(borrowId, { expired: false });
    counters.borrowed += 1n;
    cleanup.set(`borrow:${slot.id}:${borrowId}`, 'pending');
    return { kind: 'borrowed', slotId: slot.id, borrowId, payload: canonicalClone(slot.payload), envelope: canonicalClone(slot.envelope) };
  }

  function releaseOutput(input) {
    const slot = findSlot(input);
    const borrowId = text(input.borrowId, 'borrowId');
    if (!slot.borrows.has(borrowId)) fail('OUTPUT_REFERENCE_BORROW_RELEASE', 'borrow release is not exact-once');
    slot.borrows.delete(borrowId);
    counters.borrowed -= 1n;
    cleanup.set(`borrow:${slot.id}:${borrowId}`, 'release');
    return { kind: 'released', borrowId };
  }

  function expireBorrow(input) {
    const slot = findSlot(input);
    const borrowId = text(input.borrowId, 'borrowId');
    const borrow = slot.borrows.get(borrowId);
    if (!borrow) fail('OUTPUT_REFERENCE_BORROW', 'unknown borrow');
    borrow.expired = true;
    return { kind: 'expired', slotId: slot.id, borrowId, stillProtected: slot.transfers.size > 0 || slot.borrows.size > 0 };
  }

  function beginHostTransfer(input) {
    const slot = findSlot(input);
    if (slot.state !== 'ready') fail('OUTPUT_REFERENCE_TRANSFER', 'host transfer requires ready output');
    const transferId = text(input.transferId, 'transferId');
    if (slot.transfers.has(transferId)) fail('OUTPUT_REFERENCE_TRANSFER', 'duplicate transfer id');
    slot.transfers.add(transferId);
    cleanup.set(`transfer:${slot.id}:${transferId}`, 'pending');
    return { kind: 'transfer-started', transferId, searchAuthority: false };
  }

  function completeHostTransfer(input) {
    const slot = findSlot(input);
    const transferId = text(input.transferId, 'transferId');
    if (!slot.transfers.delete(transferId)) fail('OUTPUT_REFERENCE_TRANSFER', 'unknown transfer');
    cleanup.set(`transfer:${slot.id}:${transferId}`, 'release');
    return { kind: 'transfer-complete', transferId, searchProgressed: false };
  }

  function classifyOutputReuse(input) {
    const slot = findSlot(input);
    if (slot.borrows.size !== 0 || slot.transfers.size !== 0) return { kind: 'protected', slotId: slot.id, borrows: slot.borrows.size, transfers: slot.transfers.size };
    if (slot.state === 'ready') counters.ready -= 1n;
    if (!['retired', 'released', 'reusable'].includes(slot.state)) fail('OUTPUT_REFERENCE_REUSE', `slot ${slot.id} cannot be reused from ${slot.state}`);
    slot.state = 'reusable';
    counters.released += 1n;
    cleanup.set(slot.kind === 'terminal' ? 'terminal-slot' : `observation-slot:${slot.id.replace('observation-', '')}`, 'release');
    return { kind: 'reusable', slotId: slot.id };
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
    return slot.context.rootEpoch === context.rootEpoch && slot.context.workEpoch === context.workEpoch && slot.context.searchIncarnation === context.searchIncarnation;
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
      if (item.state === 'stale') return { kind: 'stale', captured, staleId: id };
      if (seen.has(id)) return { kind: 'cycle', captured, cycleId: id };
      seen.add(id);
      captured.push({ id, generation: text(item.generation ?? '1', 'sequence generation') });
    }
    return { kind: 'complete', captured };
  }

  function teardown() {
    requireInitialized();
    lifecycle = 'draining';
    for (const [requestId, slotId] of requests) {
      const slot = slots.get(slotId);
      if (['reserved', 'capturing', 'publishing'].includes(slot.state)) cancelObservation({ requestId });
    }
    const protectedSlots = [...slots.values()].filter((slot) => slot.borrows.size !== 0 || slot.transfers.size !== 0);
    if (protectedSlots.length !== 0) return { kind: 'pending-borrow-or-transfer', slots: protectedSlots.map(({ id }) => id).sort() };
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
      counters: Object.fromEntries(Object.entries(counters).map(([key, value]) => [key, value.toString()])),
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

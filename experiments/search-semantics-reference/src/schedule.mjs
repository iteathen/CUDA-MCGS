import { canonicalClone, canonicalIdentity, frozenCanonicalClone } from './canonical.mjs';
import {
  assertNamespacedId,
  assertSha256,
  assertUniqueStrings,
  compareRaw,
  exactKeys,
  fail,
  isRecord,
} from './errors.mjs';

const SCHEDULE_SCHEMA = 'cuda-mcgs.reference-declared-schedule/0.1.0';

function normalizeOwner(input, index) {
  exactKeys(input, ['id', 'initialState'], 'HARNESS_OWNER_FIELDS', `owner ${index}`);
  return {
    id: assertNamespacedId(input.id, 'HARNESS_OWNER_ID', `owner ${index} id`),
    initialState: canonicalClone(input.initialState, `owner ${input.id} initialState`),
  };
}

function normalizeEvent(input, index, owners, priorEvents) {
  exactKeys(input, ['after', 'id', 'input', 'owner', 'reads'], 'HARNESS_EVENT_FIELDS', `event ${index}`);
  const id = assertNamespacedId(input.id, 'HARNESS_EVENT_ID', `event ${index} id`);
  const owner = assertNamespacedId(input.owner, 'HARNESS_EVENT_OWNER', `${id} owner`);
  if (!owners.has(owner)) fail('HARNESS_EVENT_OWNER', `${id} references unknown owner ${owner}`);
  const after = [...assertUniqueStrings(input.after, 'HARNESS_EVENT_DEPENDENCIES', `${id} after`)].sort(compareRaw);
  for (const dependency of after) {
    assertNamespacedId(dependency, 'HARNESS_EVENT_DEPENDENCIES', `${id} dependency`);
    if (!priorEvents.has(dependency)) fail('HARNESS_EVENT_DEPENDENCY_ORDER', `${id} dependency ${dependency} must be an earlier event`);
  }
  const reads = [...assertUniqueStrings(input.reads, 'HARNESS_EVENT_READS', `${id} reads`)].sort(compareRaw);
  for (const fact of reads) assertNamespacedId(fact, 'HARNESS_EVENT_READS', `${id} read`);
  return { id, owner, after, reads, input: canonicalClone(input.input, `${id} input`) };
}

export function normalizeDeclaredSchedule(input, expectedEvidenceKey) {
  exactKeys(input, ['events', 'evidenceKey', 'id', 'owners', 'schema'], 'HARNESS_SCHEDULE_FIELDS', 'declared schedule');
  if (input.schema !== SCHEDULE_SCHEMA) fail('HARNESS_SCHEDULE_SCHEMA', 'declared schedule schema is unsupported');
  assertSha256(expectedEvidenceKey, 'HARNESS_EVIDENCE_KEY', 'expected representation/composition evidence key');
  assertSha256(input.evidenceKey, 'HARNESS_EVIDENCE_KEY', 'declared schedule evidence key');
  if (input.evidenceKey !== expectedEvidenceKey) fail('HARNESS_EVIDENCE_KEY', 'declared schedule does not bind the frozen representation/composition evidence key');
  const id = assertNamespacedId(input.id, 'HARNESS_SCHEDULE_ID', 'declared schedule id');
  if (!Array.isArray(input.owners) || input.owners.length === 0) fail('HARNESS_OWNER_COUNT', `${id} must declare at least one owner`);
  const owners = input.owners.map(normalizeOwner).sort((left, right) => compareRaw(left.id, right.id));
  const ownerIds = owners.map(({ id: owner }) => owner);
  if (new Set(ownerIds).size !== ownerIds.length) fail('HARNESS_OWNER_DUPLICATE', `${id} repeats an owner`);
  for (let index = 0; index < ownerIds.length; index += 1) {
    for (let other = index + 1; other < ownerIds.length; other += 1) {
      if (ownerIds[other].startsWith(`${ownerIds[index]}.`)) {
        fail('HARNESS_OWNER_NAMESPACE', `${id} owner namespaces ${ownerIds[index]} and ${ownerIds[other]} overlap`);
      }
    }
  }
  if (!Array.isArray(input.events) || input.events.length === 0) fail('HARNESS_EVENT_COUNT', `${id} must declare at least one event`);
  const eventIds = new Set();
  const events = input.events.map((event, index) => {
    const normalized = normalizeEvent(event, index, new Set(ownerIds), eventIds);
    if (eventIds.has(normalized.id)) fail('HARNESS_EVENT_DUPLICATE', `${id} repeats event ${normalized.id}`);
    eventIds.add(normalized.id);
    return normalized;
  });
  const normalized = { schema: SCHEDULE_SCHEMA, evidenceKey: input.evidenceKey, id, owners, events };
  return { normalized, identity: canonicalIdentity(normalized, `${id} normalized schedule`) };
}

function transitionMap(transitions, ownerIds, scheduleId) {
  if (!isRecord(transitions)) fail('HARNESS_TRANSITIONS', `${scheduleId} transitions must be an owner-keyed object`);
  const actual = Object.keys(transitions).sort(compareRaw);
  if (actual.length !== ownerIds.length || actual.some((owner, index) => owner !== ownerIds[index])) {
    fail('HARNESS_TRANSITIONS', `${scheduleId} transitions must match the declared owner set exactly`);
  }
  for (const owner of ownerIds) {
    if (typeof transitions[owner] !== 'function') fail('HARNESS_TRANSITIONS', `${owner} transition must be a function`);
  }
  return transitions;
}

function normalizeTransitionResult(result, owner, eventId) {
  exactKeys(result, ['publications', 'state'], 'HARNESS_TRANSITION_RESULT', `${eventId} transition result`);
  if (!Array.isArray(result.publications)) fail('HARNESS_TRANSITION_RESULT', `${eventId} publications must be an array`);
  return {
    state: canonicalClone(result.state, `${eventId} state`),
    publications: result.publications.map((publication, index) => {
      exactKeys(publication, ['id', 'value'], 'HARNESS_PUBLICATION_FIELDS', `${eventId} publication ${index}`);
      const id = assertNamespacedId(publication.id, 'HARNESS_FACT_ID', `${eventId} publication ${index} id`);
      if (!id.startsWith(`${owner}.`)) fail('HARNESS_FACT_OWNER', `${eventId} cannot publish foreign fact ${id}`);
      return { id, value: canonicalClone(publication.value, `${id} value`) };
    }),
  };
}

export function runDeclaredSchedule(input, transitions, expectedEvidenceKey) {
  const { normalized: schedule, identity: scheduleIdentity } = normalizeDeclaredSchedule(input, expectedEvidenceKey);
  const ownerIds = schedule.owners.map(({ id }) => id);
  const handlers = transitionMap(transitions, ownerIds, schedule.id);
  const states = new Map(schedule.owners.map(({ id, initialState }) => [id, canonicalClone(initialState, `${id} initialState`)]));
  const facts = new Map();
  const factProducers = new Map();
  const factOwners = new Map();
  const ancestorsByEvent = new Map();
  const trace = [];

  for (const event of schedule.events) {
    const ancestors = new Set();
    for (const dependency of event.after) {
      ancestors.add(dependency);
      for (const ancestor of ancestorsByEvent.get(dependency)) ancestors.add(ancestor);
    }
    ancestorsByEvent.set(event.id, ancestors);
    const visibleFacts = {};
    for (const factId of event.reads) {
      if (!facts.has(factId)) fail('HARNESS_FACT_NOT_READY', `${event.id} reads unpublished fact ${factId}`);
      const producer = factProducers.get(factId);
      if (!ancestors.has(producer)) fail('HARNESS_FACT_DEPENDENCY', `${event.id} reads ${factId} without depending on producer ${producer}`);
      visibleFacts[factId] = canonicalClone(facts.get(factId), `${event.id} fact ${factId}`);
    }
    const stateBefore = canonicalClone(states.get(event.owner), `${event.id} state before`);
    const result = handlers[event.owner]({
      state: frozenCanonicalClone(stateBefore, `${event.id} owner state`),
      input: frozenCanonicalClone(event.input, `${event.id} input`),
      context: Object.freeze({
        scheduleId: schedule.id,
        eventId: event.id,
        facts: frozenCanonicalClone(visibleFacts, `${event.id} visible facts`),
      }),
    });
    const normalizedResult = normalizeTransitionResult(result, event.owner, event.id);
    states.set(event.owner, normalizedResult.state);
    const publications = [];
    for (const publication of normalizedResult.publications) {
      if (facts.has(publication.id)) fail('HARNESS_FACT_DUPLICATE', `${event.id} republishes immutable fact ${publication.id}`);
      facts.set(publication.id, publication.value);
      factProducers.set(publication.id, event.id);
      factOwners.set(publication.id, event.owner);
      publications.push({ id: publication.id, identity: canonicalIdentity(publication.value, `${publication.id} value`) });
    }
    trace.push({
      id: event.id,
      owner: event.owner,
      after: event.after,
      reads: event.reads,
      inputIdentity: canonicalIdentity(event.input, `${event.id} input`),
      stateBeforeIdentity: canonicalIdentity(stateBefore, `${event.id} state before`),
      stateAfterIdentity: canonicalIdentity(normalizedResult.state, `${event.id} state after`),
      publications,
    });
  }

  const result = {
    schema: 'cuda-mcgs.reference-declared-schedule-result/0.1.0',
    evidenceKey: schedule.evidenceKey,
    scheduleId: schedule.id,
    scheduleIdentity,
    terminalStates: Object.fromEntries([...states].sort(([left], [right]) => compareRaw(left, right)).map(([owner, state]) => [owner, canonicalClone(state, `${owner} terminal state`)])),
    facts: [...facts].sort(([left], [right]) => compareRaw(left, right)).map(([id, value]) => ({ id, owner: factOwners.get(id), producerEvent: factProducers.get(id), value: canonicalClone(value, `${id} terminal value`) })),
    trace,
  };
  return { ...result, resultIdentity: canonicalIdentity(result, `${schedule.id} result`) };
}

import { createHash } from 'node:crypto';

const IDENTIFIER = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const ROOT_KEYS = ['contract', 'graph', 'identity', 'publicationChannels', 'resources', 'result', 'roles', 'schema', 'stop'];
const CHANNEL_KEYS = ['consumers', 'failureStates', 'id', 'initialState', 'payloadOwner', 'producer', 'progress', 'readyState', 'states', 'terminalStates', 'transitions', 'visibilityScope'];
const RESOURCE_KEYS = ['admission', 'capacity', 'counters', 'exhaustionCause', 'failedReservationConsumesCapacity', 'id', 'unit'];
const COUNTERS = ['claimed', 'published', 'retired-unreclaimed', 'failed-reservations', 'high-water'];
const REQUIRED_CHANNELS = ['backup-eligibility', 'child-binding', 'expansion', 'identity-slot', 'result', 'state-node', 'stop'];
const REQUIRED_RESOURCES = ['action-bytes', 'active-paths', 'diagnostics', 'outputs', 'parent-edges', 'state-bytes', 'state-nodes', 'transposition-slots', 'work-queue'];

export class SearchIrError extends Error {
  constructor(code, message, location = '$') {
    super(`${message} (${location})`);
    this.name = 'SearchIrError';
    this.code = code;
    this.location = location;
  }
}

function fail(code, message, location) {
  throw new SearchIrError(code, message, location);
}

function object(value, location) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('IR_TYPE', 'Expected an object', location);
  return value;
}

function list(value, location) {
  if (!Array.isArray(value)) fail('IR_TYPE', 'Expected an array', location);
  return value;
}

function exactKeys(value, keys, location) {
  object(value, location);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  const unknown = actual.filter((key) => !expected.includes(key));
  if (unknown.length > 0) fail('IR_UNKNOWN_FIELD', `Unknown field ${unknown[0]}`, `${location}.${unknown[0]}`);
  const missing = expected.filter((key) => !actual.includes(key));
  if (missing.length > 0) fail('IR_MISSING_FIELD', `Missing field ${missing[0]}`, `${location}.${missing[0]}`);
}

function identifier(value, location) {
  if (typeof value !== 'string' || !IDENTIFIER.test(value)) fail('IR_IDENTIFIER', 'Expected a stable kebab-case identifier', location);
  return value;
}

function stringList(value, location, { nonempty = true } = {}) {
  if (!Array.isArray(value) || (nonempty && value.length === 0)) fail('IR_TYPE', 'Expected an identifier array', location);
  const result = value.map((entry, index) => identifier(entry, `${location}[${index}]`));
  if (new Set(result).size !== result.length) fail('IR_DUPLICATE', 'Duplicate identifier', location);
  return result;
}

function causeList(value, location) {
  if (!Array.isArray(value) || value.length === 0 || value.some((entry) => typeof entry !== 'string' || !/^[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)?$/.test(entry))) {
    fail('IR_TYPE', 'Expected a typed stop-cause array', location);
  }
  if (new Set(value).size !== value.length) fail('IR_DUPLICATE', 'Duplicate stop cause', location);
  return value;
}

function exactArray(actual, expected, code, location) {
  if (!Array.isArray(actual) || actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    fail(code, `Expected ${JSON.stringify(expected)}`, location);
  }
}

function compareOrdinal(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function reachable(initial, transitions) {
  const visited = new Set([initial]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const transition of transitions) {
      if (visited.has(transition.from) && !visited.has(transition.to)) {
        visited.add(transition.to);
        changed = true;
      }
    }
  }
  return visited;
}

function normalizeChannel(channel, roles, index) {
  const location = `$.publicationChannels[${index}]`;
  exactKeys(channel, CHANNEL_KEYS, location);
  const id = identifier(channel.id, `${location}.id`);
  const producer = identifier(channel.producer, `${location}.producer`);
  const payloadOwner = identifier(channel.payloadOwner, `${location}.payloadOwner`);
  const consumers = stringList(channel.consumers, `${location}.consumers`);
  for (const [kind, role] of [['producer', producer], ['payload owner', payloadOwner], ...consumers.map((role) => ['consumer', role])]) {
    if (!roles.has(role)) fail('IR_ROLE_UNDECLARED', `Channel ${kind} role ${role} is undeclared`, location);
  }
  const states = stringList(channel.states, `${location}.states`);
  const stateSet = new Set(states);
  const initialState = identifier(channel.initialState, `${location}.initialState`);
  const readyState = identifier(channel.readyState, `${location}.readyState`);
  const terminalStates = stringList(channel.terminalStates, `${location}.terminalStates`);
  const failureStates = stringList(channel.failureStates, `${location}.failureStates`, { nonempty: false });
  for (const state of [initialState, readyState, ...terminalStates, ...failureStates]) {
    if (!stateSet.has(state)) fail('IR_CHANNEL_STATE', `Channel state ${state} is undeclared`, location);
  }
  if (!terminalStates.includes(readyState)) fail('IR_CHANNEL_STATE', 'Ready state must be terminal for an incarnation', `${location}.terminalStates`);
  if (channel.visibilityScope !== 'search-device') fail('IR_VISIBILITY_SCOPE', 'v0 requires search-device visibility', `${location}.visibilityScope`);
  exactKeys(channel.progress, ['boundedWait', 'observesStop'], `${location}.progress`);
  if (channel.progress.boundedWait !== true || channel.progress.observesStop !== true) {
    fail('IR_CHANNEL_PROGRESS', 'Every channel wait must be bounded and observe stop', `${location}.progress`);
  }
  if (!Array.isArray(channel.transitions) || channel.transitions.length === 0) fail('IR_CHANNEL_TRANSITION', 'Expected channel transitions', `${location}.transitions`);
  const transitions = channel.transitions.map((transition, transitionIndex) => {
    const transitionLocation = `${location}.transitions[${transitionIndex}]`;
    exactKeys(transition, ['from', 'to'], transitionLocation);
    const from = identifier(transition.from, `${transitionLocation}.from`);
    const to = identifier(transition.to, `${transitionLocation}.to`);
    if (!stateSet.has(from) || !stateSet.has(to) || from === to) fail('IR_CHANNEL_TRANSITION', 'Transition must connect distinct declared states', transitionLocation);
    return { from, to };
  });
  const transitionKeys = transitions.map(({ from, to }) => `${from}\0${to}`);
  if (new Set(transitionKeys).size !== transitionKeys.length) fail('IR_DUPLICATE', 'Duplicate transition', `${location}.transitions`);
  const visible = reachable(initialState, transitions);
  for (const state of new Set([readyState, ...terminalStates])) {
    if (!visible.has(state)) fail('IR_CHANNEL_PROGRESS', `Terminal state ${state} is unreachable`, location);
  }
  return {
    id,
    producer,
    consumers: [...consumers].sort(),
    payloadOwner,
    states: [...states].sort(),
    initialState,
    readyState,
    terminalStates: [...terminalStates].sort(),
    failureStates: [...failureStates].sort(),
    visibilityScope: channel.visibilityScope,
    transitions: [...transitions].sort((left, right) => compareOrdinal(`${left.from}\0${left.to}`, `${right.from}\0${right.to}`)),
    progress: { observesStop: true, boundedWait: true },
  };
}

function normalizeGraph(graph) {
  exactKeys(graph, ['backup', 'cycles', 'identity', 'parentEdges', 'stateNodes'], '$.graph');
  exactKeys(graph.identity, ['owner', 'transpositionScope', 'verification'], '$.graph.identity');
  exactKeys(graph.stateNodes, ['owner', 'staleReferencePolicy', 'uniqueness'], '$.graph.stateNodes');
  exactKeys(graph.parentEdges, ['inFlightDistinctFromCompleted', 'owner', 'statistics'], '$.graph.parentEdges');
  exactKeys(graph.cycles, ['lookupOrder', 'membership', 'response'], '$.graph.cycles');
  exactKeys(graph.backup, ['dispositions', 'exactlyOnce', 'owner'], '$.graph.backup');
  if (graph.identity.owner !== 'domain-identity' || graph.identity.verification !== 'hash-plus-domain-equality' || graph.identity.transpositionScope !== 'search-incarnation'
      || graph.stateNodes.owner !== 'graph-owner' || graph.stateNodes.uniqueness !== 'one-ready-node-per-verified-identity' || graph.stateNodes.staleReferencePolicy !== 'generation-checked'
      || graph.parentEdges.owner !== 'policy-worker' || graph.parentEdges.statistics !== 'incoming-edge-local' || graph.parentEdges.inFlightDistinctFromCompleted !== true
      || graph.cycles.membership !== 'active-path' || !['cutoff', 'transform-value', 'repetition-outcome', 'bounded-history', 'fail-capability'].includes(graph.cycles.response)
      || graph.backup.owner !== 'backup-owner' || graph.backup.exactlyOnce !== true) {
    fail('IR_GRAPH_SEMANTICS', 'Graph ownership or lifecycle semantics do not satisfy SPEC-0001', '$.graph');
  }
  exactArray(graph.cycles.lookupOrder, ['resolve-identity', 'evaluate-active-path'], 'IR_GRAPH_SEMANTICS', '$.graph.cycles.lookupOrder');
  exactArray(graph.backup.dispositions, ['applied', 'abandoned'], 'IR_GRAPH_SEMANTICS', '$.graph.backup.dispositions');
  return structuredClone(graph);
}

function normalizeStop(stop) {
  exactKeys(stop, ['admissionAfterStop', 'causes', 'claimedDisposition', 'firstCauseAuthoritative', 'states'], '$.stop');
  exactArray(stop.states, ['running', 'stop-requested', 'draining', 'terminal'], 'IR_STOP_SEMANTICS', '$.stop.states');
  const causes = causeList(stop.causes, '$.stop.causes');
  if (stop.firstCauseAuthoritative !== true || stop.admissionAfterStop !== 'reject-resource-dependent') fail('IR_STOP_SEMANTICS', 'Stop ownership or admission semantics are invalid', '$.stop');
  exactArray(stop.claimedDisposition, ['apply-ready', 'abandon-unready'], 'IR_STOP_SEMANTICS', '$.stop.claimedDisposition');
  return { ...structuredClone(stop), causes: [...causes].sort() };
}

function normalizeResource(resource, stopCauses, index) {
  const location = `$.resources[${index}]`;
  exactKeys(resource, RESOURCE_KEYS, location);
  const id = identifier(resource.id, `${location}.id`);
  const unit = identifier(resource.unit, `${location}.unit`);
  if (!Number.isSafeInteger(resource.capacity) || resource.capacity < 1) fail('IR_RESOURCE_CAPACITY', 'Capacity must be a positive safe integer', `${location}.capacity`);
  exactArray(resource.counters, COUNTERS, 'IR_RESOURCE_COUNTERS', `${location}.counters`);
  if (resource.admission !== 'bounded-reservation' || resource.failedReservationConsumesCapacity !== false) {
    fail('IR_RESOURCE_ADMISSION', 'Reservation must be bounded and failure must consume no capacity', location);
  }
  if (resource.exhaustionCause !== `resource-exhausted/${id}` || !stopCauses.has(resource.exhaustionCause)) {
    fail('IR_RESOURCE_EXHAUSTION', 'Enabled resource lacks its typed stop cause', `${location}.exhaustionCause`);
  }
  return { id, capacity: resource.capacity, unit, counters: [...COUNTERS], admission: resource.admission, failedReservationConsumesCapacity: false, exhaustionCause: resource.exhaustionCause };
}

function normalizeResult(result) {
  exactKeys(result, ['partialClasses', 'rankingInputs', 'reports'], '$.result');
  exactArray(result.partialClasses, ['complete', 'valid-partial', 'no-valid-result'], 'IR_RESULT_SEMANTICS', '$.result.partialClasses');
  exactArray(result.rankingInputs, ['ready-nodes', 'ready-edges', 'ready-evaluator-outputs', 'applied-backups'], 'IR_RESULT_SEMANTICS', '$.result.rankingInputs');
  exactArray(result.reports, ['completion-class', 'first-stop-cause', 'completed-work-count', 'resource-ledgers', 'budget-satisfied', 'diagnostics'], 'IR_RESULT_SEMANTICS', '$.result.reports');
  return structuredClone(result);
}

function normalizeIdentity(identity) {
  exactKeys(identity, ['canonicalization', 'digest', 'pathIndependent', 'targetIndependent'], '$.identity');
  if (identity.canonicalization !== 'utf8-json-sorted-keys-v1' || identity.digest !== 'sha256' || identity.pathIndependent !== true || identity.targetIndependent !== true) {
    fail('IR_IDENTITY', 'Canonical identity must be path- and target-independent SHA-256 over sorted-key UTF-8 JSON', '$.identity');
  }
  return structuredClone(identity);
}

export function normalizeSearchIr(input) {
  exactKeys(input, ROOT_KEYS, '$');
  if (input.schema !== 'cuda-mcgs.search-ir/0.1.0') fail('IR_VERSION', 'Unsupported Search IR schema', '$.schema');
  if (input.contract !== 'SPEC-0001/0.1.0') fail('IR_CONTRACT', 'Unsupported semantic contract', '$.contract');
  const roleList = stringList(input.roles, '$.roles');
  const roles = new Set(roleList);
  const publicationChannels = list(input.publicationChannels, '$.publicationChannels').map((channel, index) => normalizeChannel(channel, roles, index));
  const channelIds = publicationChannels.map(({ id }) => id);
  if (new Set(channelIds).size !== channelIds.length) fail('IR_DUPLICATE', 'Duplicate publication channel', '$.publicationChannels');
  for (const required of REQUIRED_CHANNELS) if (!channelIds.includes(required)) fail('IR_CHANNEL_REQUIRED', `Missing required channel ${required}`, '$.publicationChannels');
  const stop = normalizeStop(input.stop);
  const stopCauses = new Set(stop.causes);
  const resources = list(input.resources, '$.resources').map((resource, index) => normalizeResource(resource, stopCauses, index));
  const resourceIds = resources.map(({ id }) => id);
  if (new Set(resourceIds).size !== resourceIds.length) fail('IR_DUPLICATE', 'Duplicate resource class', '$.resources');
  for (const required of REQUIRED_RESOURCES) if (!resourceIds.includes(required)) fail('IR_RESOURCE_REQUIRED', `Missing required resource ${required}`, '$.resources');
  return {
    schema: input.schema,
    contract: input.contract,
    roles: [...roleList].sort(),
    publicationChannels: [...publicationChannels].sort((left, right) => compareOrdinal(left.id, right.id)),
    graph: normalizeGraph(input.graph),
    resources: [...resources].sort((left, right) => compareOrdinal(left.id, right.id)),
    stop,
    result: normalizeResult(input.result),
    identity: normalizeIdentity(input.identity),
  };
}

export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

export function searchIrIdentity(normalized) {
  const bytes = Buffer.from(canonicalJson(normalized), 'utf8');
  return { algorithm: 'sha256', byteLength: bytes.byteLength, sha256: createHash('sha256').update(bytes).digest('hex') };
}

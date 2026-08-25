import {
  canonicalIdentity,
  compareDecimalUint,
  compareRaw,
  exactKeys,
  fail,
  normalizeDecimalUint,
  uniqueBy,
} from './validation.mjs';

const CHANNEL_SCHEMA = 'cuda-mcgs.channel-profile/0.2.0';
const REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const CHANNEL_CONTRACT = 'SPEC-0004';
const ACTIONS = ['produce', 'claim', 'observe', 'complete', 'cancel', 'release'];
const REQUIRED_STATES = ['free', 'reserved-unpublished', 'ready', 'owned-or-borrowed', 'terminally-disposed', 'reclaimable'];
const WORK_KINDS = ['producer', 'consumer', 'completion-reclamation', 'pending-dependency'];
const COUNTER_KINDS = ['generation', 'correlation', 'reservation', 'claim', 'borrow', 'completion', 'cancellation', 'expiry', 'reclamation'];
const STATUS_CLASSES = new Map([
  ['channel-work-complete', 'normal'], ['channel-unavailable', 'pending'], ['channel-capacity', 'pressure'],
  ['channel-stale', 'stop'], ['channel-expired', 'stop'], ['channel-cancelled', 'cancellation'],
  ['channel-counter-exhausted', 'stop'], ['channel-no-progress', 'fatal'], ['channel-incompatible', 'fatal'],
  ['channel-internal-failure', 'fatal'],
]);
const CLEANUP_KINDS = ['channel', 'item', 'payload', 'result', 'pending-descriptor', 'claim', 'borrow', 'source-owner-lease', 'counter', 'diagnostic', 'program-artifact'];
const PUBLIC_REQUIREMENTS = ['cuda-js.device-js/0.1.0', 'cuda-js.device-publication-release-acquire/0.1.0', 'cuda-js.operation-lifecycle/0.1.0'];

function assertString(value, pattern, code, label) {
  if (typeof value !== 'string' || !pattern.test(value)) fail(code, `${label} is invalid`);
  return value;
}

function assertBoolean(value, expected, code, label) {
  if (typeof value !== 'boolean' || (expected !== undefined && value !== expected)) fail(code, `${label} is invalid`);
  return value;
}

function assertEnum(value, allowed, code, label) {
  if (!allowed.includes(value)) fail(code, `${label} is invalid`);
  return value;
}

function assertNamespacedId(value, code, label) {
  return assertString(value, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/, code, label);
}

function assertVersion(value, code, label) {
  return assertString(value, /^[0-9]+\.[0-9]+\.[0-9]+$/, code, label);
}

function assertSha256(value, code, label) {
  return assertString(value, /^[0-9a-f]{64}$/, code, label);
}

function positiveDecimal(value, code, label) {
  const normalized = normalizeDecimalUint(value, label);
  if (normalized === '0') fail(code, `${label} must be positive`);
  return normalized;
}

function schemaKey(reference) { return `${reference.id}\0${reference.version}\0${reference.sha256}`; }
function profileKey(profile) { return `${profile.id}\0${schemaKey(profile.schema)}\0${profile.identity.sha256}`; }
function contractKey(contract) { return `${contract.id}\0${contract.specificationIdentity}\0${contract.sha256}`; }

function normalizeSchemaReference(input, label) {
  exactKeys(input, ['id', 'version', 'sha256'], 'CHANNEL_SCHEMA_REFERENCE_FIELDS', label);
  assertString(input.id, /^[a-z][a-z0-9.-]*\/[0-9]+\.[0-9]+\.[0-9]+$/, 'CHANNEL_SCHEMA_REFERENCE_ID', `${label} id`);
  assertVersion(input.version, 'CHANNEL_SCHEMA_REFERENCE_VERSION', `${label} version`);
  assertSha256(input.sha256, 'CHANNEL_SCHEMA_REFERENCE_DIGEST', `${label} sha256`);
  if (!input.id.endsWith(`/${input.version}`)) fail('CHANNEL_SCHEMA_REFERENCE_VERSION', `${label} id/version differ`);
  return { id: input.id, version: input.version, sha256: input.sha256 };
}

function normalizeContentIdentity(input, code, label) {
  exactKeys(input, ['algorithm', 'sha256'], `${code}_FIELDS`, label);
  if (input.algorithm !== 'sha256') fail(code, `${label} algorithm is invalid`);
  return { algorithm: 'sha256', sha256: assertSha256(input.sha256, code, `${label} sha256`) };
}

function normalizeProfileReference(input, label) {
  exactKeys(input, ['id', 'schema', 'identity'], 'CHANNEL_PROFILE_REFERENCE_FIELDS', label);
  return {
    id: assertNamespacedId(input.id, 'CHANNEL_PROFILE_REFERENCE_ID', `${label} id`),
    schema: normalizeSchemaReference(input.schema, `${label} schema`),
    identity: normalizeContentIdentity(input.identity, 'CHANNEL_PROFILE_REFERENCE_IDENTITY', `${label} identity`),
  };
}

function normalizeCatalogContract(input, catalogById, label) {
  exactKeys(input, ['kind', 'id', 'specificationIdentity', 'sha256'], 'CHANNEL_CONTRACT_FIELDS', label);
  if (input.kind !== 'catalog') fail('CHANNEL_CONTRACT_KIND', `${label} must be catalog-owned`);
  assertString(input.id, /^SPEC-[0-9]{4}$/, 'CHANNEL_CONTRACT_ID', `${label} id`);
  assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\.[0-9]+\.[0-9]+-draft$/, 'CHANNEL_CONTRACT_ID', `${label} specificationIdentity`);
  assertSha256(input.sha256, 'CHANNEL_CONTRACT_DIGEST', `${label} sha256`);
  const expected = catalogById.get(input.id);
  if (!expected || expected.specificationIdentity !== input.specificationIdentity || expected.sha256 !== input.sha256) fail('CHANNEL_CONTRACT_DRIFT', `${label} differs from frozen catalog`);
  return { kind: 'catalog', id: input.id, specificationIdentity: input.specificationIdentity, sha256: input.sha256 };
}

function normalizeOwner(input, index, stageOwnerById, catalogById) {
  exactKeys(input, ['id', 'contract', 'profile'], 'CHANNEL_OWNER_FIELDS', `owner ${index}`);
  const id = assertNamespacedId(input.id, 'CHANNEL_OWNER_ID', `owner ${index} id`);
  const contract = normalizeCatalogContract(input.contract, catalogById, `${id} contract`);
  const profile = normalizeProfileReference(input.profile, `${id} profile`);
  const expected = stageOwnerById.get(id);
  if (!expected || contractKey(contract) !== contractKey(expected.contract) || profileKey(profile) !== profileKey(expected.profile)) fail('CHANNEL_OWNER_PROFILE', `${id} differs from selected Stage owner`);
  return { id, contract, profile };
}

function normalizeRole(input, index, ownerById) {
  exactKeys(input, ['id', 'kind', 'capability', 'stage', 'surface', 'actions', 'multiplicity'], 'CHANNEL_ROLE_FIELDS', `role ${index}`);
  const id = assertNamespacedId(input.id, 'CHANNEL_ROLE_ID', `role ${index} id`);
  const kind = assertEnum(input.kind, ['producer', 'consumer'], 'CHANNEL_ROLE_KIND', `${id} kind`);
  assertNamespacedId(input.capability, 'CHANNEL_ROLE_BINDING', `${id} capability`);
  assertNamespacedId(input.stage, 'CHANNEL_ROLE_BINDING', `${id} stage`);
  assertNamespacedId(input.surface, 'CHANNEL_ROLE_BINDING', `${id} surface`);
  if (!Array.isArray(input.actions) || input.actions.length === 0) fail('CHANNEL_ROLE_ACTION', `${id} actions must be nonempty`);
  const actions = [...input.actions].sort(compareRaw);
  if (new Set(actions).size !== actions.length || actions.some((action) => !ACTIONS.includes(action))) fail('CHANNEL_ROLE_ACTION', `${id} actions are invalid`);
  if (kind === 'producer' && !actions.includes('produce')) fail('CHANNEL_ROLE_ACTION', `${id} producer cannot produce`);
  if (kind === 'consumer' && !actions.some((action) => ['claim', 'observe'].includes(action))) fail('CHANNEL_ROLE_ACTION', `${id} consumer cannot access published data`);
  return { id, kind, capability: input.capability, stage: input.stage, surface: input.surface, actions, multiplicity: positiveDecimal(input.multiplicity, 'CHANNEL_ROLE_RANGE', `${id} multiplicity`) };
}

function normalizeFiniteIdentity(input, label) {
  exactKeys(input, ['schema', 'maximum', 'rollover', 'exhaustion'], 'CHANNEL_FINITE_IDENTITY_FIELDS', label);
  const schema = normalizeSchemaReference(input.schema, `${label} schema`);
  const maximum = positiveDecimal(input.maximum, 'CHANNEL_IDENTITY_RANGE', `${label} maximum`);
  if (input.rollover !== 'prohibited' || input.exhaustion !== 'typed-stop-before-alias') fail('CHANNEL_IDENTITY_RANGE', `${label} can wrap or alias`);
  return { schema, maximum, rollover: input.rollover, exhaustion: input.exhaustion };
}

function normalizeItemIdentity(input) {
  exactKeys(input, ['item', 'generation', 'correlation', 'freshness'], 'CHANNEL_ITEM_IDENTITY_FIELDS', 'itemIdentity');
  return {
    item: normalizeSchemaReference(input.item, 'item identity'),
    generation: normalizeFiniteIdentity(input.generation, 'generation'),
    correlation: normalizeFiniteIdentity(input.correlation, 'correlation'),
    freshness: normalizeSchemaReference(input.freshness, 'freshness'),
  };
}

function normalizePayload(input, index, ownerById) {
  exactKeys(input, ['id', 'kind', 'owner', 'schema', 'sizeBytes', 'alignment', 'memorySpace', 'immutableAtReady', 'sourceValidity'], 'CHANNEL_PAYLOAD_FIELDS', `payload ${index}`);
  const id = assertNamespacedId(input.id, 'CHANNEL_PAYLOAD_ID', `payload ${index} id`);
  const kind = assertEnum(input.kind, ['request', 'result', 'payload'], 'CHANNEL_PAYLOAD_KIND', `${id} kind`);
  if (!ownerById.has(input.owner)) fail('CHANNEL_PAYLOAD_OWNER', `${id} owner is unavailable`);
  const sizeBytes = positiveDecimal(input.sizeBytes, 'CHANNEL_PAYLOAD_RANGE', `${id} sizeBytes`);
  const alignment = positiveDecimal(input.alignment, 'CHANNEL_PAYLOAD_RANGE', `${id} alignment`);
  const alignmentValue = BigInt(alignment);
  if ((alignmentValue & (alignmentValue - 1n)) !== 0n || BigInt(sizeBytes) % alignmentValue !== 0n) fail('CHANNEL_PAYLOAD_RANGE', `${id} alignment is incompatible`);
  if (input.memorySpace !== 'device-search' || input.immutableAtReady !== true) fail('CHANNEL_PAYLOAD_BOUNDARY', `${id} must be immutable internal device data at ready publication`);
  return { id, kind, owner: input.owner, schema: normalizeSchemaReference(input.schema, `${id} schema`), sizeBytes, alignment, memorySpace: input.memorySpace, immutableAtReady: true, sourceValidity: normalizeSchemaReference(input.sourceValidity, `${id} sourceValidity`) };
}

function normalizeStateGraph(input, channelId) {
  exactKeys(input, ['states', 'initial', 'transitions'], 'CHANNEL_STATE_GRAPH_FIELDS', `${channelId} stateGraph`);
  if (!Array.isArray(input.states) || input.states.length === 0 || new Set(input.states).size !== input.states.length) fail('CHANNEL_STATE_GRAPH', `${channelId} states are invalid`);
  const states = [...input.states].sort(compareRaw);
  for (const required of REQUIRED_STATES) if (!states.includes(required)) fail('CHANNEL_STATE_GRAPH', `${channelId} lacks ${required}`);
  if (input.initial !== 'free') fail('CHANNEL_STATE_GRAPH', `${channelId} initial state must be free`);
  const stateSet = new Set(states);
  if (!Array.isArray(input.transitions) || input.transitions.length === 0) fail('CHANNEL_STATE_GRAPH', `${channelId} transitions are empty`);
  const transitions = input.transitions.map((entry, index) => {
    exactKeys(entry, ['from', 'to', 'operation', 'monotonic'], 'CHANNEL_TRANSITION_FIELDS', `${channelId} transition ${index}`);
    if (!stateSet.has(entry.from) || !stateSet.has(entry.to) || entry.monotonic !== true) fail('CHANNEL_STATE_GRAPH', `${channelId} transition ${index} is invalid`);
    assertString(entry.operation, /^[a-z][a-z0-9-]*$/, 'CHANNEL_STATE_GRAPH', `${channelId} transition ${index} operation`);
    return { from: entry.from, to: entry.to, operation: entry.operation, monotonic: true };
  }).sort((left, right) => compareRaw(`${left.from}\0${left.to}\0${left.operation}`, `${right.from}\0${right.to}\0${right.operation}`));
  if (new Set(transitions.map((entry) => `${entry.from}\0${entry.to}\0${entry.operation}`)).size !== transitions.length) fail('CHANNEL_STATE_GRAPH', `${channelId} has a duplicate transition`);
  const reachable = new Set(['free']);
  for (let changed = true; changed;) { changed = false; for (const { from, to } of transitions) if (reachable.has(from) && !reachable.has(to)) { reachable.add(to); changed = true; } }
  if (states.some((state) => !reachable.has(state))) fail('CHANNEL_STATE_GRAPH', `${channelId} contains an unreachable state`);
  const terminalReachable = new Set(['terminally-disposed', 'reclaimable', 'free']);
  for (let changed = true; changed;) { changed = false; for (const { from, to } of transitions) if (terminalReachable.has(to) && !terminalReachable.has(from)) { terminalReachable.add(from); changed = true; } }
  if (states.some((state) => !terminalReachable.has(state))) fail('CHANNEL_STATE_GRAPH', `${channelId} lacks a terminal path`);
  return { states, initial: input.initial, transitions };
}

function normalizeClaim(input, channelId, payloads) {
  exactKeys(input, ['mode', 'maxClaims', 'ownership', 'referenceAccounting'], 'CHANNEL_CLAIM_FIELDS', `${channelId} claim`);
  const mode = assertEnum(input.mode, ['single-consumer-transfer', 'finite-multi-consumer-immutable-borrow'], 'CHANNEL_CLAIM_MODE', `${channelId} claim mode`);
  const maxClaims = positiveDecimal(input.maxClaims, 'CHANNEL_CLAIM_RANGE', `${channelId} maxClaims`);
  const expected = mode === 'single-consumer-transfer'
    ? { ownership: 'transfer', referenceAccounting: 'none' }
    : { ownership: 'immutable-borrow', referenceAccounting: 'exact' };
  if (input.ownership !== expected.ownership || input.referenceAccounting !== expected.referenceAccounting || (mode === 'single-consumer-transfer' ? maxClaims !== '1' : compareDecimalUint(maxClaims, '1') <= 0) || (mode !== 'single-consumer-transfer' && payloads.some(({ immutableAtReady }) => !immutableAtReady))) fail('CHANNEL_CLAIM_MODE', `${channelId} claim contract is inconsistent`);
  return { mode, maxClaims, ownership: input.ownership, referenceAccounting: input.referenceAccounting };
}

function normalizePublication(input, channelId) {
  exactKeys(input, ['readyState', 'release', 'acquire', 'scope', 'publicationWord', 'payloadBeforeReady', 'consumeAfterAcquire', 'nativeSpelling', 'publicRequirement', 'nativeQualification'], 'CHANNEL_PUBLICATION_FIELDS', `${channelId} publication`);
  if (input.readyState !== 'ready' || input.release !== 'logical-release' || input.acquire !== 'logical-acquire' || input.scope !== 'device' || input.payloadBeforeReady !== true || input.consumeAfterAcquire !== true || input.nativeSpelling !== 'none' || input.nativeQualification !== 'blocked-cuda-js-123') fail('CHANNEL_PUBLICATION', `${channelId} publication contract is invalid`);
  const publicRequirement = normalizeSchemaReference(input.publicRequirement, `${channelId} publication requirement`);
  if (publicRequirement.id !== 'cuda-js.device-publication-release-acquire/0.1.0') fail('CHANNEL_PUBLICATION', `${channelId} publication requirement is not the consumer-neutral CUDA-JS boundary`);
  return { readyState: input.readyState, release: input.release, acquire: input.acquire, scope: input.scope, publicationWord: normalizeSchemaReference(input.publicationWord, `${channelId} publicationWord`), payloadBeforeReady: true, consumeAfterAcquire: true, nativeSpelling: input.nativeSpelling, publicRequirement, nativeQualification: input.nativeQualification };
}

function normalizeCapacity(input, channelId) {
  exactKeys(input, ['slots', 'highAt', 'criticalAt', 'exhaustedAt', 'maxReservations', 'maxPending', 'maxRetries', 'maxAgeEpochs', 'cancellationObservationWorkUnits'], 'CHANNEL_CAPACITY_FIELDS', `${channelId} capacity`);
  const result = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, positiveDecimal(value, 'CHANNEL_CAPACITY_RANGE', `${channelId} ${key}`)]));
  if (compareDecimalUint(result.highAt, result.criticalAt) >= 0 || compareDecimalUint(result.criticalAt, result.exhaustedAt) >= 0 || result.exhaustedAt !== result.slots || compareDecimalUint(result.maxReservations, result.slots) > 0 || compareDecimalUint(result.maxPending, result.slots) > 0) fail('CHANNEL_CAPACITY_RANGE', `${channelId} capacity/watermark bounds are inconsistent`);
  return result;
}

function normalizeResources(input, channelId, classById) {
  exactKeys(input, ['allocations', 'admissionGroup', 'rollback', 'conservation', 'hiddenGrowth', 'hostRescue', 'terminalReserve'], 'CHANNEL_RESOURCES_FIELDS', `${channelId} resources`);
  if (!Array.isArray(input.allocations) || input.allocations.length === 0) fail('CHANNEL_RESOURCE_ALLOCATION', `${channelId} allocations are empty`);
  const allocations = input.allocations.map((entry, index) => {
    exactKeys(entry, ['class', 'units'], 'CHANNEL_ALLOCATION_FIELDS', `${channelId} allocation ${index}`);
    if (!classById.has(entry.class)) fail('CHANNEL_RESOURCE_ALLOCATION', `${channelId} allocation names a foreign class`);
    return { class: entry.class, units: positiveDecimal(entry.units, 'CHANNEL_RESOURCE_ALLOCATION', `${channelId} allocation ${index} units`) };
  }).sort((left, right) => compareRaw(left.class, right.class));
  uniqueBy(allocations, 'class', 'CHANNEL_RESOURCE_ALLOCATION', `${channelId} allocation`);
  assertNamespacedId(input.admissionGroup, 'CHANNEL_RESOURCE_ADMISSION', `${channelId} admissionGroup`);
  if (input.rollback !== 'zero-published-effect' || input.conservation !== 'exact' || input.hiddenGrowth !== false || input.hostRescue !== 'none' || input.terminalReserve !== true) fail('CHANNEL_RESOURCE_CONTRACT', `${channelId} resource contract is invalid`);
  return { allocations, admissionGroup: input.admissionGroup, rollback: input.rollback, conservation: input.conservation, hiddenGrowth: false, hostRescue: input.hostRescue, terminalReserve: true };
}

function normalizeProgress(input, channelId, workClassId, roleById) {
  exactKeys(input, ['workClass', 'descriptors', 'dependencies', 'noProgress'], 'CHANNEL_PROGRESS_FIELDS', `${channelId} progress`);
  if (input.workClass !== workClassId) fail('CHANNEL_PROGRESS_WORK', `${channelId} work class differs from the selected producer-unblocking class`);
  if (!Array.isArray(input.descriptors)) fail('CHANNEL_PROGRESS_DESCRIPTOR', `${channelId} descriptors must be an array`);
  const descriptors = input.descriptors.map((entry, index) => {
    exactKeys(entry, ['id', 'kind', 'publication', 'maxWorkUnits'], 'CHANNEL_DESCRIPTOR_FIELDS', `${channelId} descriptor ${index}`);
    return { id: assertNamespacedId(entry.id, 'CHANNEL_PROGRESS_DESCRIPTOR', `${channelId} descriptor ${index} id`), kind: assertEnum(entry.kind, WORK_KINDS, 'CHANNEL_PROGRESS_DESCRIPTOR', `${channelId} descriptor ${index} kind`), publication: normalizeSchemaReference(entry.publication, `${channelId} descriptor ${index} publication`), maxWorkUnits: positiveDecimal(entry.maxWorkUnits, 'CHANNEL_PROGRESS_DESCRIPTOR', `${channelId} descriptor ${index} maxWorkUnits`) };
  }).sort((left, right) => compareRaw(left.kind, right.kind));
  uniqueBy(descriptors, 'id', 'CHANNEL_PROGRESS_DESCRIPTOR', `${channelId} descriptor`); uniqueBy(descriptors, 'kind', 'CHANNEL_PROGRESS_DESCRIPTOR', `${channelId} descriptor kind`);
  if (descriptors.length !== WORK_KINDS.length || WORK_KINDS.some((kind) => !descriptors.some((entry) => entry.kind === kind))) fail('CHANNEL_PROGRESS_DESCRIPTOR', `${channelId} descriptor coverage is incomplete`);
  if (!Array.isArray(input.dependencies) || input.dependencies.length === 0) fail('CHANNEL_PROGRESS_DEPENDENCY', `${channelId} dependencies are empty`);
  const dependencies = input.dependencies.map((entry, index) => {
    exactKeys(entry, ['id', 'producerRoles', 'requirement', 'producerChannel', 'escapes', 'holdsWorker', 'holdsMutableLease', 'maxWaitTransitions', 'fallback'], 'CHANNEL_DEPENDENCY_FIELDS', `${channelId} dependency ${index}`);
    const id = assertNamespacedId(entry.id, 'CHANNEL_PROGRESS_DEPENDENCY', `${channelId} dependency ${index} id`);
    if (!Array.isArray(entry.producerRoles) || entry.producerRoles.length === 0 || new Set(entry.producerRoles).size !== entry.producerRoles.length || entry.producerRoles.some((role) => roleById.get(role)?.kind !== 'producer')) fail('CHANNEL_PROGRESS_DEPENDENCY', `${id} producer roles are invalid`);
    const requirement = assertEnum(entry.requirement, ['required', 'advisory'], 'CHANNEL_PROGRESS_DEPENDENCY', `${id} requirement`);
    const producerChannel = entry.producerChannel === null ? null : assertNamespacedId(entry.producerChannel, 'CHANNEL_PROGRESS_DEPENDENCY', `${id} producerChannel`);
    if (!Array.isArray(entry.escapes) || entry.escapes.length === 0 || new Set(entry.escapes).size !== entry.escapes.length) fail('CHANNEL_PROGRESS_DEPENDENCY', `${id} escapes are invalid`);
    const escapes = [...entry.escapes].sort(compareRaw);
    if (entry.holdsWorker !== false || entry.holdsMutableLease !== false || (requirement === 'required' && !['failure', 'cancel', 'stop', 'stale'].every((escape) => escapes.includes(escape)))) fail('CHANNEL_PROGRESS_DEPENDENCY', `${id} can retain a worker/resource or lacks a required escape`);
    const fallback = entry.fallback === null ? null : normalizeSchemaReference(entry.fallback, `${id} fallback`);
    if ((requirement === 'advisory') !== (fallback !== null)) fail('CHANNEL_PROGRESS_DEPENDENCY', `${id} fallback differs from requirement`);
    return { id, producerRoles: [...entry.producerRoles].sort(compareRaw), requirement, producerChannel, escapes, holdsWorker: false, holdsMutableLease: false, maxWaitTransitions: positiveDecimal(entry.maxWaitTransitions, 'CHANNEL_PROGRESS_DEPENDENCY', `${id} maxWaitTransitions`), fallback };
  }).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(dependencies, 'id', 'CHANNEL_PROGRESS_DEPENDENCY', `${channelId} dependency`);
  exactKeys(input.noProgress, ['classifier', 'producerService', 'typedOutcome', 'hostDecision'], 'CHANNEL_NO_PROGRESS_FIELDS', `${channelId} noProgress`);
  if (input.noProgress.producerService !== 'required-before-no-progress' || input.noProgress.typedOutcome !== 'channel-no-progress' || input.noProgress.hostDecision !== 'none') fail('CHANNEL_NO_PROGRESS', `${channelId} no-progress contract is invalid`);
  return { workClass: input.workClass, descriptors, dependencies, noProgress: { classifier: normalizeSchemaReference(input.noProgress.classifier, `${channelId} noProgress classifier`), producerService: input.noProgress.producerService, typedOutcome: input.noProgress.typedOutcome, hostDecision: input.noProgress.hostDecision } };
}

function normalizeConsumption(input, channelId) {
  exactKeys(input, ['class', 'unavailable', 'failure', 'timeoutSwitching'], 'CHANNEL_CONSUMPTION_FIELDS', `${channelId} consumption`);
  const consumptionClass = assertEnum(input.class, ['required', 'optional', 'advisory'], 'CHANNEL_CONSUMPTION_CLASS', `${channelId} consumption class`);
  const expectedUnavailable = { required: 'pending-release-worker', optional: 'skip', advisory: 'owner-fallback' }[consumptionClass];
  if (input.unavailable !== expectedUnavailable || input.timeoutSwitching !== false) fail('CHANNEL_CONSUMPTION_CLASS', `${channelId} unavailable behavior can change by timing`);
  return { class: consumptionClass, unavailable: input.unavailable, failure: normalizeSchemaReference(input.failure, `${channelId} failure mapping`), timeoutSwitching: false };
}

function normalizeCounter(input, index) {
  exactKeys(input, ['id', 'kind', 'maximum', 'rollover', 'exhaustionOutcome'], 'CHANNEL_COUNTER_FIELDS', `counter ${index}`);
  const id = assertNamespacedId(input.id, 'CHANNEL_COUNTER_ID', `counter ${index} id`);
  const kind = assertEnum(input.kind, COUNTER_KINDS, 'CHANNEL_COUNTER_KIND', `${id} kind`);
  const maximum = positiveDecimal(input.maximum, 'CHANNEL_COUNTER_RANGE', `${id} maximum`);
  if (input.rollover !== 'prohibited' || input.exhaustionOutcome !== 'channel-counter-exhausted') fail('CHANNEL_COUNTER_RANGE', `${id} can wrap`);
  return { id, kind, maximum, rollover: input.rollover, exhaustionOutcome: input.exhaustionOutcome };
}

function normalizeLifecycle(input, channelId, states) {
  exactKeys(input, ['cancellation', 'stale', 'lateCompletion', 'expiry', 'reclamation', 'teardown', 'hostProgress', 'workerWait'], 'CHANNEL_LIFECYCLE_FIELDS', `${channelId} lifecycle`);
  if (!Array.isArray(input.cancellation)) fail('CHANNEL_CANCELLATION', `${channelId} cancellation must be an array`);
  const cancellation = input.cancellation.map((entry, index) => {
    exactKeys(entry, ['state', 'disposition'], 'CHANNEL_CANCELLATION_FIELDS', `${channelId} cancellation ${index}`);
    if (!states.includes(entry.state)) fail('CHANNEL_CANCELLATION', `${channelId} cancellation names unknown state`);
    return { state: entry.state, disposition: assertEnum(entry.disposition, ['no-effect', 'rollback', 'cancel-and-retire', 'mark-cancelled', 'ignore-authoritative-terminal', 'reclaim'], 'CHANNEL_CANCELLATION', `${channelId} cancellation disposition`) };
  }).sort((left, right) => compareRaw(left.state, right.state));
  uniqueBy(cancellation, 'state', 'CHANNEL_CANCELLATION', `${channelId} cancellation state`);
  if (cancellation.length !== states.length) fail('CHANNEL_CANCELLATION', `${channelId} cancellation does not cover every state`);
  exactKeys(input.expiry, ['source', 'maximumAge', 'disposition'], 'CHANNEL_EXPIRY_FIELDS', `${channelId} expiry`);
  if (input.expiry.source !== 'engine-epoch-budget' || input.expiry.disposition !== 'expire-and-retire') fail('CHANNEL_EXPIRY', `${channelId} expiry contract is invalid`);
  exactKeys(input.reclamation, ['preconditions', 'generationAdvanceBeforeReuse'], 'CHANNEL_RECLAMATION_FIELDS', `${channelId} reclamation`);
  const requiredPreconditions = ['terminal-disposition', 'claims-ended', 'borrows-zero', 'source-leases-ended', 'progress-references-zero'];
  if (!Array.isArray(input.reclamation.preconditions) || requiredPreconditions.some((value) => !input.reclamation.preconditions.includes(value)) || new Set(input.reclamation.preconditions).size !== input.reclamation.preconditions.length || input.reclamation.generationAdvanceBeforeReuse !== true) fail('CHANNEL_RECLAMATION', `${channelId} reclamation is unsafe`);
  if (input.lateCompletion !== 'ignore-reclaim-no-resurrection' || input.hostProgress !== 'none' || input.workerWait !== 'none') fail('CHANNEL_LIFECYCLE', `${channelId} lifecycle requires host or blocked-worker progress`);
  return {
    cancellation, stale: normalizeSchemaReference(input.stale, `${channelId} stale disposition`), lateCompletion: input.lateCompletion,
    expiry: { source: input.expiry.source, maximumAge: positiveDecimal(input.expiry.maximumAge, 'CHANNEL_EXPIRY', `${channelId} maximumAge`), disposition: input.expiry.disposition },
    reclamation: { preconditions: [...input.reclamation.preconditions].sort(compareRaw), generationAdvanceBeforeReuse: true }, teardown: normalizeSchemaReference(input.teardown, `${channelId} teardown`), hostProgress: input.hostProgress, workerWait: input.workerWait,
  };
}

function normalizeCompatibility(input, channelId) {
  exactKeys(input, ['packageIdentityRequired', 'ownerSemanticsRequired', 'schedulerIdentityExcluded', 'persistence', 'nativeEvidence'], 'CHANNEL_COMPATIBILITY_FIELDS', `${channelId} compatibility`);
  exactKeys(input.persistence, ['kind'], 'CHANNEL_PERSISTENCE_FIELDS', `${channelId} persistence`);
  if (input.packageIdentityRequired !== true || input.ownerSemanticsRequired !== true || input.schedulerIdentityExcluded !== true || input.persistence.kind !== 'none' || input.nativeEvidence !== 'separate-compatible-pair') fail('CHANNEL_COMPATIBILITY', `${channelId} compatibility is invalid`);
  return { packageIdentityRequired: true, ownerSemanticsRequired: true, schedulerIdentityExcluded: true, persistence: { kind: 'none' }, nativeEvidence: input.nativeEvidence };
}

function normalizeChannelCleanup(input, channelId, multiBorrow) {
  exactKeys(input, ['kinds', 'disposition', 'quarantine', 'releaseOrder'], 'CHANNEL_ITEM_CLEANUP_FIELDS', `${channelId} cleanup`);
  const required = ['item', 'payload', 'pending-descriptor', 'claim', 'source-owner-lease', 'counter'];
  if (multiBorrow) required.push('borrow');
  if (!Array.isArray(input.kinds) || new Set(input.kinds).size !== input.kinds.length || required.some((kind) => !input.kinds.includes(kind))) fail('CHANNEL_ITEM_CLEANUP', `${channelId} cleanup coverage is incomplete`);
  return { kinds: [...input.kinds].sort(compareRaw), disposition: normalizeSchemaReference(input.disposition, `${channelId} cleanup disposition`), quarantine: normalizeSchemaReference(input.quarantine, `${channelId} cleanup quarantine`), releaseOrder: normalizeSchemaReference(input.releaseOrder, `${channelId} cleanup releaseOrder`) };
}

function normalizeChannel(input, index, context) {
  exactKeys(input, ['id', 'version', 'requirement', 'semanticOwner', 'roles', 'itemIdentity', 'payloads', 'stateGraph', 'claim', 'publication', 'capacity', 'resources', 'progress', 'consumption', 'counters', 'outcomes', 'lifecycle', 'compatibility', 'cleanup', 'sourceIdentity', 'requirements', 'provenance'], 'CHANNEL_FIELDS', `channel ${index}`);
  const id = assertNamespacedId(input.id, 'CHANNEL_ID', `channel ${index} id`);
  assertVersion(input.version, 'CHANNEL_VERSION', `${id} version`);
  const requirement = normalizeSchemaReference(input.requirement, `${id} requirement`);
  if (!context.ownerById.has(input.semanticOwner)) fail('CHANNEL_SEMANTIC_OWNER', `${id} semantic owner is unavailable`);
  const roles = input.roles.map((entry, roleIndex) => normalizeRole(entry, roleIndex, context.ownerById)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(roles, 'id', 'CHANNEL_ROLE_DUPLICATE', `${id} role`);
  if (!roles.some(({ kind }) => kind === 'producer') || !roles.some(({ kind }) => kind === 'consumer')) fail('CHANNEL_ROLE_COVERAGE', `${id} requires explicit producer and consumer roles`);
  const roleById = new Map(roles.map((entry) => [entry.id, entry]));
  const itemIdentity = normalizeItemIdentity(input.itemIdentity);
  const payloads = input.payloads.map((entry, payloadIndex) => normalizePayload(entry, payloadIndex, context.ownerById)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(payloads, 'id', 'CHANNEL_PAYLOAD_DUPLICATE', `${id} payload`);
  if (payloads.length === 0 || new Set(payloads.map(({ kind }) => kind)).size !== payloads.length) fail('CHANNEL_PAYLOAD_KIND', `${id} payload kinds are incomplete or ambiguous`);
  const stateGraph = normalizeStateGraph(input.stateGraph, id);
  const claim = normalizeClaim(input.claim, id, payloads);
  const publication = normalizePublication(input.publication, id);
  const capacity = normalizeCapacity(input.capacity, id);
  if (compareDecimalUint(claim.maxClaims, capacity.slots) > 0) fail('CHANNEL_CLAIM_RANGE', `${id} claim count exceeds capacity`);
  const resources = normalizeResources(input.resources, id, context.classById);
  const progress = normalizeProgress(input.progress, id, context.workClass.id, roleById);
  const consumption = normalizeConsumption(input.consumption, id);
  const counters = input.counters.map(normalizeCounter).sort((left, right) => compareRaw(left.kind, right.kind)); uniqueBy(counters, 'id', 'CHANNEL_COUNTER_DUPLICATE', `${id} counter`); uniqueBy(counters, 'kind', 'CHANNEL_COUNTER_DUPLICATE', `${id} counter kind`);
  if (counters.length !== COUNTER_KINDS.length || COUNTER_KINDS.some((kind) => !counters.some((entry) => entry.kind === kind))) fail('CHANNEL_COUNTER_COVERAGE', `${id} counter coverage is incomplete`);
  if (compareDecimalUint(itemIdentity.generation.maximum, counters.find(({ kind }) => kind === 'generation').maximum) > 0 || compareDecimalUint(itemIdentity.correlation.maximum, counters.find(({ kind }) => kind === 'correlation').maximum) > 0) fail('CHANNEL_COUNTER_RANGE', `${id} identity exceeds its counter`);
  if (!Array.isArray(input.outcomes) || input.outcomes.length === 0 || new Set(input.outcomes).size !== input.outcomes.length || input.outcomes.some((outcome) => !STATUS_CLASSES.has(outcome))) fail('CHANNEL_OUTCOME', `${id} outcomes are invalid`);
  const outcomes = [...input.outcomes].sort(compareRaw);
  const lifecycle = normalizeLifecycle(input.lifecycle, id, stateGraph.states);
  const compatibility = normalizeCompatibility(input.compatibility, id);
  const cleanup = normalizeChannelCleanup(input.cleanup, id, claim.mode.includes('multi-consumer'));
  const sourceIdentity = normalizeContentIdentity(input.sourceIdentity, 'CHANNEL_SOURCE_IDENTITY', `${id} sourceIdentity`);
  if (!Array.isArray(input.requirements)) fail('CHANNEL_REQUIREMENT', `${id} requirements must be an array`);
  const requirements = input.requirements.map((entry, requirementIndex) => normalizeSchemaReference(entry, `${id} requirement ${requirementIndex}`)).sort((left, right) => compareRaw(schemaKey(left), schemaKey(right)));
  if (new Set(requirements.map(schemaKey)).size !== requirements.length || requirements.map(({ id: requirementId }) => requirementId).sort(compareRaw).join('\0') !== PUBLIC_REQUIREMENTS.join('\0')) fail('CHANNEL_REQUIREMENT', `${id} public CUDA-JS requirements are incomplete or private`);
  exactKeys(input.provenance, ['origin', 'trust', 'revision', 'license', 'review'], 'CHANNEL_PROVENANCE_FIELDS', `${id} provenance`);
  if (input.provenance.origin !== 'first-party' || input.provenance.trust !== 'first-party-reviewed' || input.provenance.license !== 'Apache-2.0') fail('CHANNEL_PROVENANCE', `${id} provenance is invalid`);
  const provenance = { origin: input.provenance.origin, trust: input.provenance.trust, revision: assertString(input.provenance.revision, /^[0-9a-f]{40}$/, 'CHANNEL_PROVENANCE', `${id} revision`), license: input.provenance.license, review: normalizeSchemaReference(input.provenance.review, `${id} review`) };
  return { id, version: input.version, requirement, semanticOwner: input.semanticOwner, roles, itemIdentity, payloads, stateGraph, claim, publication, capacity, resources, progress, consumption, counters, outcomes, lifecycle, compatibility, cleanup, sourceIdentity, requirements, provenance };
}

function validateStageGrants(channels, stageProfile) {
  const channelByRequirement = new Map(channels.map((channel) => [schemaKey(channel.requirement), channel]));
  if (channelByRequirement.size !== channels.length) fail('CHANNEL_STAGE_REQUIREMENT', 'selected channels duplicate one Stage requirement');
  const used = new Set();
  const granted = new Set();
  for (const capability of stageProfile.capabilities) for (const selected of capability.channels) for (const binding of selected.bindings) for (const action of binding.actions) granted.add(`${capability.id}\0${schemaKey(selected.requirement)}\0${binding.surface}\0${action}`);
  for (const channel of channels) for (const role of channel.roles) {
    const capability = stageProfile.capabilities.find(({ id }) => id === role.capability);
    const surface = stageProfile.surfaces.find(({ id }) => id === role.surface);
    const stage = stageProfile.stages.find(({ id }) => id === role.stage);
    if (!capability || !surface || !stage || surface.stage !== stage.id || !capability.bindings.includes(surface.id)) fail('CHANNEL_STAGE_BINDING', `${role.id} differs from selected Stage bindings`);
    const requirement = capability.channels.find((entry) => schemaKey(entry.requirement) === schemaKey(channel.requirement));
    const binding = requirement?.bindings.find(({ surface: id }) => id === role.surface);
    if (!binding || role.actions.some((action) => !binding.actions.includes(action))) fail('CHANNEL_STAGE_PERMISSION', `${role.id} exceeds its Stage grant`);
    for (const action of role.actions) {
      const key = `${capability.id}\0${schemaKey(channel.requirement)}\0${role.surface}\0${action}`;
      if (used.has(key)) fail('CHANNEL_STAGE_PERMISSION', `${role.id} duplicates a Stage action grant`);
      used.add(key);
    }
  }
  if (used.size !== granted.size || [...granted].some((key) => !used.has(key))) fail('CHANNEL_STAGE_PERMISSION', 'selected Channel roles do not exactly consume Stage grants');
  for (const key of granted) {
    const requirementKey = key.split('\0').slice(1, 4).join('\0');
    if (!channelByRequirement.has(requirementKey)) fail('CHANNEL_STAGE_REQUIREMENT', 'a Stage channel requirement has no final Channel owner');
  }
}

function validateDependencyGraph(channels) {
  const byId = new Map(channels.map((entry) => [entry.id, entry]));
  const edges = new Map(channels.map(({ id }) => [id, new Set()]));
  for (const channel of channels) for (const dependency of channel.progress.dependencies) if (dependency.producerChannel !== null) {
    if (!byId.has(dependency.producerChannel)) fail('CHANNEL_PROGRESS_DEPENDENCY', `${dependency.id} names an unknown producer channel`);
    if (dependency.requirement === 'required') edges.get(channel.id).add(dependency.producerChannel);
  }
  const indegree = new Map(channels.map(({ id }) => [id, 0]));
  for (const targets of edges.values()) for (const target of targets) indegree.set(target, indegree.get(target) + 1);
  const ready = [...indegree].filter(([, value]) => value === 0).map(([id]) => id); let visited = 0;
  while (ready.length > 0) { const id = ready.shift(); visited += 1; for (const target of edges.get(id)) { indegree.set(target, indegree.get(target) - 1); if (indegree.get(target) === 0) ready.push(target); } }
  if (visited !== channels.length) fail('CHANNEL_PROGRESS_CYCLE', 'required channel dependency graph contains a cycle');
}

function normalizeStatus(input, index) {
  exactKeys(input, ['code', 'class', 'diagnostic'], 'CHANNEL_STATUS_FIELDS', `status ${index}`);
  const expected = STATUS_CLASSES.get(input.code);
  if (!expected || input.class !== expected || input.diagnostic !== true) fail('CHANNEL_STATUS', `${input.code} status is invalid`);
  return { code: input.code, class: input.class, diagnostic: true };
}

function normalizeRootLifecycle(input) {
  exactKeys(input, ['states', 'partialFailure', 'cancellation', 'stop', 'teardown', 'release'], 'CHANNEL_ROOT_LIFECYCLE_FIELDS', 'channel lifecycle');
  const expected = ['profile-normalized', 'resources-admitted', 'composed', 'active', 'draining', 'terminal', 'released'];
  if (!Array.isArray(input.states) || input.states.length !== expected.length || expected.some((state) => !input.states.includes(state))) fail('CHANNEL_ROOT_LIFECYCLE', 'channel lifecycle states are incomplete');
  if (input.partialFailure !== 'publish-none-unwind-all') fail('CHANNEL_ROOT_LIFECYCLE', 'partial Channel failure can publish partial state');
  return { states: [...input.states], partialFailure: input.partialFailure, cancellation: normalizeSchemaReference(input.cancellation, 'channel lifecycle cancellation'), stop: normalizeSchemaReference(input.stop, 'channel lifecycle stop'), teardown: normalizeSchemaReference(input.teardown, 'channel lifecycle teardown'), release: normalizeSchemaReference(input.release, 'channel lifecycle release') };
}

function normalizeDiagnostics(input) {
  exactKeys(input, ['authority', 'maxRecords', 'maxBytes', 'overflow', 'rawPointers', 'cudaHandles', 'nativeArtifacts', 'privatePayloads', 'wallClock'], 'CHANNEL_DIAGNOSTICS_FIELDS', 'channel diagnostics');
  if (input.authority !== 'non-authoritative' || input.overflow !== 'count' || input.rawPointers !== false || input.cudaHandles !== false || input.nativeArtifacts !== false || input.privatePayloads !== false || input.wallClock !== false) fail('CHANNEL_DIAGNOSTICS', 'channel diagnostics expose authority or native/private state');
  return { authority: input.authority, maxRecords: positiveDecimal(input.maxRecords, 'CHANNEL_DIAGNOSTICS', 'diagnostic maxRecords'), maxBytes: positiveDecimal(input.maxBytes, 'CHANNEL_DIAGNOSTICS', 'diagnostic maxBytes'), overflow: input.overflow, rawPointers: false, cudaHandles: false, nativeArtifacts: false, privatePayloads: false, wallClock: false };
}

function normalizeRootCompatibility(input) {
  exactKeys(input, ['packageIdentityRequired', 'cudaJsPublicContractsOnly', 'nativeQualification', 'migration'], 'CHANNEL_ROOT_COMPATIBILITY_FIELDS', 'channel compatibility');
  exactKeys(input.migration, ['kind'], 'CHANNEL_ROOT_MIGRATION_FIELDS', 'channel migration');
  if (input.packageIdentityRequired !== true || input.cudaJsPublicContractsOnly !== true || input.nativeQualification !== 'blocked-cuda-js-123' || input.migration.kind !== 'none') fail('CHANNEL_ROOT_COMPATIBILITY', 'channel compatibility is invalid');
  return { packageIdentityRequired: true, cudaJsPublicContractsOnly: true, nativeQualification: input.nativeQualification, migration: { kind: 'none' } };
}

function normalizeRootCleanup(input) {
  exactKeys(input, ['kinds', 'disposition', 'quarantine', 'releaseOrder', 'ownerOrder', 'retainedEvidence'], 'CHANNEL_ROOT_CLEANUP_FIELDS', 'channel cleanup');
  if (!Array.isArray(input.kinds) || input.kinds.length !== CLEANUP_KINDS.length || new Set(input.kinds).size !== input.kinds.length || CLEANUP_KINDS.some((kind) => !input.kinds.includes(kind))) fail('CHANNEL_ROOT_CLEANUP', 'channel cleanup coverage is incomplete');
  return { kinds: [...input.kinds].sort(compareRaw), disposition: normalizeSchemaReference(input.disposition, 'channel cleanup disposition'), quarantine: normalizeSchemaReference(input.quarantine, 'channel cleanup quarantine'), releaseOrder: normalizeSchemaReference(input.releaseOrder, 'channel cleanup releaseOrder'), ownerOrder: normalizeSchemaReference(input.ownerOrder, 'channel cleanup ownerOrder'), retainedEvidence: normalizeSchemaReference(input.retainedEvidence, 'channel cleanup retainedEvidence') };
}

function normalizeProgram(input, expectedInputs, expectedRequirements) {
  exactKeys(input, ['kind', 'language', 'sourceIdentity', 'inputs', 'requirements', 'runtimeRegistry', 'nativeArtifacts', 'provenance'], 'CHANNEL_PROGRAM_FIELDS', 'channel programContribution');
  if (input.kind !== 'device-program' || input.language !== 'restricted-device-js' || input.runtimeRegistry !== false || input.nativeArtifacts !== false) fail('CHANNEL_PROGRAM_BOUNDARY', 'channel program is not restricted Device-JS through static public contracts');
  const sourceIdentity = normalizeContentIdentity(input.sourceIdentity, 'CHANNEL_PROGRAM_IDENTITY', 'channel program sourceIdentity');
  const inputs = input.inputs.map((entry, index) => normalizeProfileReference(entry, `channel program input ${index}`)).sort((left, right) => compareRaw(profileKey(left), profileKey(right)));
  const expectedInputKeys = [...expectedInputs.values()].map(profileKey).sort(compareRaw);
  if (inputs.length !== expectedInputKeys.length || inputs.map(profileKey).some((key, index) => key !== expectedInputKeys[index])) fail('CHANNEL_PROGRAM_INPUT', 'channel program inputs differ from selected plans/Stage');
  const requirements = input.requirements.map((entry, index) => normalizeSchemaReference(entry, `channel program requirement ${index}`)).sort((left, right) => compareRaw(schemaKey(left), schemaKey(right)));
  const expectedRequirementKeys = [...expectedRequirements.values()].map(schemaKey).sort(compareRaw);
  if (requirements.length !== expectedRequirementKeys.length || requirements.map(schemaKey).some((key, index) => key !== expectedRequirementKeys[index])) fail('CHANNEL_PROGRAM_REQUIREMENT', 'channel program requirements differ from selected public CUDA-JS contracts');
  exactKeys(input.provenance, ['origin', 'trust', 'revision', 'license', 'review'], 'CHANNEL_PROGRAM_PROVENANCE_FIELDS', 'channel program provenance');
  if (input.provenance.origin !== 'first-party' || input.provenance.trust !== 'first-party-reviewed' || input.provenance.license !== 'Apache-2.0') fail('CHANNEL_PROGRAM_PROVENANCE', 'channel program provenance is invalid');
  return { kind: input.kind, language: input.language, sourceIdentity, inputs, requirements, runtimeRegistry: false, nativeArtifacts: false, provenance: { origin: input.provenance.origin, trust: input.provenance.trust, revision: assertString(input.provenance.revision, /^[0-9a-f]{40}$/, 'CHANNEL_PROGRAM_PROVENANCE', 'channel program revision'), license: input.provenance.license, review: normalizeSchemaReference(input.provenance.review, 'channel program review') } };
}

function normalizeProductData(input, index) {
  exactKeys(input, ['ownerContract', 'schema', 'identity'], 'CHANNEL_PRODUCT_FIELDS', `productData ${index}`);
  exactKeys(input.ownerContract, ['id', 'version'], 'CHANNEL_PRODUCT_OWNER_FIELDS', `productData ${index} ownerContract`);
  return { ownerContract: { id: assertNamespacedId(input.ownerContract.id, 'CHANNEL_PRODUCT_OWNER', `productData ${index} owner`), version: assertVersion(input.ownerContract.version, 'CHANNEL_PRODUCT_OWNER', `productData ${index} owner version`) }, schema: normalizeSchemaReference(input.schema, `productData ${index} schema`), identity: normalizeContentIdentity(input.identity, 'CHANNEL_PRODUCT_IDENTITY', `productData ${index} identity`) };
}

export function normalizeChannelProfile(input, inspectedCatalog, resourceResult, progressResult, stageResult) {
  if (input === null) return { normalized: null, identity: null };
  exactKeys(input, ['schema', 'representation', 'status', 'contract', 'id', 'version', 'generatorIdentity', 'resourcePlan', 'progressPlan', 'stageProfile', 'resourceContribution', 'progressContribution', 'owners', 'channels', 'statuses', 'lifecycle', 'diagnostics', 'compatibility', 'cleanup', 'programContribution', 'productData'], 'CHANNEL_ROOT_FIELDS', 'channel profile');
  if (input.schema !== CHANNEL_SCHEMA || input.representation !== REPRESENTATION || input.status !== 'proposal-evidence') fail('CHANNEL_SCHEMA', 'unsupported channel schema/representation/status');
  const contracts = inspectedCatalog?.contractSet?.contracts; if (!contracts) fail('CHANNEL_CATALOG', 'inspected catalog is required');
  const catalogById = new Map(contracts.map((entry) => [entry.id, entry]));
  const contract = normalizeCatalogContract(input.contract, catalogById, 'channel contract');
  if (contract.id !== CHANNEL_CONTRACT) fail('CHANNEL_CONTRACT_ID', `channel contract must select ${CHANNEL_CONTRACT}`);
  const id = assertNamespacedId(input.id, 'CHANNEL_PROFILE_ID', 'channel profile id');
  const version = assertVersion(input.version, 'CHANNEL_PROFILE_VERSION', 'channel profile version');
  const generatorIdentity = normalizeContentIdentity(input.generatorIdentity, 'CHANNEL_GENERATOR_IDENTITY', 'channel generatorIdentity');
  if (!resourceResult?.normalized || !resourceResult.schemaSha || !progressResult?.normalized || !progressResult.schemaSha || !stageResult?.normalized || !stageResult.schemaSha) fail('CHANNEL_PLAN', 'exact resource/progress/Stage plans are required');
  const expectedRef = (result) => ({ id: result.normalized.id, schema: { id: result.normalized.schema, version: '0.2.0', sha256: result.schemaSha }, identity: result.identity });
  const resourcePlan = normalizeProfileReference(input.resourcePlan, 'resourcePlan'); const progressPlan = normalizeProfileReference(input.progressPlan, 'progressPlan'); const stageProfile = normalizeProfileReference(input.stageProfile, 'stageProfile');
  if (profileKey(resourcePlan) !== profileKey(expectedRef(resourceResult)) || profileKey(progressPlan) !== profileKey(expectedRef(progressResult)) || profileKey(stageProfile) !== profileKey(expectedRef(stageResult)) || profileKey(progressResult.normalized.resourcePlan) !== profileKey(resourcePlan) || profileKey(stageResult.normalized.resourcePlan) !== profileKey(resourcePlan) || profileKey(stageResult.normalized.progressPlan) !== profileKey(progressPlan)) fail('CHANNEL_PLAN', 'resource/progress/Stage plan identity differs');
  const resourceOwner = resourceResult.normalized.contributors.find(({ contract: selected }) => selected.id === CHANNEL_CONTRACT); const progressOwner = progressResult.normalized.contributors.find(({ contract: selected }) => selected.id === CHANNEL_CONTRACT);
  if (!resourceOwner || !progressOwner || profileKey(resourceOwner.profile) !== profileKey(progressOwner.profile)) fail('CHANNEL_CONTRIBUTION', 'resource/progress plans do not select one Channel contribution');
  const resourceContribution = normalizeProfileReference(input.resourceContribution, 'resourceContribution'); const progressContribution = normalizeProfileReference(input.progressContribution, 'progressContribution');
  if (profileKey(resourceContribution) !== profileKey(resourceOwner.profile) || profileKey(progressContribution) !== profileKey(progressOwner.profile)) fail('CHANNEL_CONTRIBUTION', 'Channel contribution differs from selected plans');
  const channelClasses = resourceResult.normalized.classes.filter(({ contributor }) => contributor === resourceOwner.id); const classById = new Map(channelClasses.map((entry) => [entry.id, entry]));
  const channelWork = progressResult.normalized.workClasses.filter(({ owner }) => owner === progressOwner.id);
  if (channelClasses.length === 0 || channelWork.length !== 1 || channelWork[0].kind !== 'producer-unblocking') fail('CHANNEL_UPSTREAM_CONTRACT', 'selected Channel resource/progress contribution is incomplete');
  const stageOwnerById = new Map(stageResult.normalized.owners.map((entry) => [entry.id, entry]));
  const owners = input.owners.map((entry, index) => normalizeOwner(entry, index, stageOwnerById, catalogById)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(owners, 'id', 'CHANNEL_OWNER_DUPLICATE', 'Channel owner');
  const ownerById = new Map(owners.map((entry) => [entry.id, entry]));
  const channels = input.channels.map((entry, index) => normalizeChannel(entry, index, { ownerById, classById, workClass: channelWork[0] })).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(channels, 'id', 'CHANNEL_DUPLICATE', 'channel');
  if (channels.length === 0) fail('CHANNEL_COUNT', 'zero selected channels must use canonical null absence');
  const usedOwners = new Set(channels.map(({ semanticOwner }) => semanticOwner));
  if (owners.length !== usedOwners.size || owners.some(({ id: ownerId }) => !usedOwners.has(ownerId))) fail('CHANNEL_OWNER_RESIDUE', 'Channel owners differ from selected semantic use');
  validateStageGrants(channels, stageResult.normalized); validateDependencyGraph(channels);
  const allocationTotals = new Map(channelClasses.map(({ id: classId }) => [classId, 0n]));
  for (const channel of channels) for (const allocation of channel.resources.allocations) allocationTotals.set(allocation.class, allocationTotals.get(allocation.class) + BigInt(allocation.units));
  for (const resourceClass of channelClasses) if (allocationTotals.get(resourceClass.id) === 0n || allocationTotals.get(resourceClass.id) > BigInt(resourceClass.formula.maximumUnits)) fail('CHANNEL_RESOURCE_ALLOCATION', `${resourceClass.id} is unused or overcommitted`);
  const statuses = input.statuses.map(normalizeStatus).sort((left, right) => compareRaw(left.code, right.code)); uniqueBy(statuses, 'code', 'CHANNEL_STATUS_DUPLICATE', 'channel status');
  if (statuses.length !== STATUS_CLASSES.size || [...STATUS_CLASSES.keys()].some((code) => !statuses.some((entry) => entry.code === code))) fail('CHANNEL_STATUS_COVERAGE', 'channel status vocabulary is incomplete');
  const statusSet = new Set(statuses.map(({ code }) => code)); for (const channel of channels) if (channel.outcomes.some((outcome) => !statusSet.has(outcome))) fail('CHANNEL_OUTCOME', `${channel.id} names undeclared outcome`);
  const lifecycle = normalizeRootLifecycle(input.lifecycle); const diagnostics = normalizeDiagnostics(input.diagnostics); const compatibility = normalizeRootCompatibility(input.compatibility); const cleanup = normalizeRootCleanup(input.cleanup);
  const expectedInputs = new Map([[resourcePlan.id, resourcePlan], [progressPlan.id, progressPlan], [stageProfile.id, stageProfile]]);
  const expectedRequirements = new Map(); for (const channel of channels) for (const requirement of channel.requirements) { const prior = expectedRequirements.get(requirement.id); if (prior && schemaKey(prior) !== schemaKey(requirement)) fail('CHANNEL_PROGRAM_REQUIREMENT', `${requirement.id} has conflicting identities`); expectedRequirements.set(requirement.id, requirement); }
  const programContribution = normalizeProgram(input.programContribution, expectedInputs, expectedRequirements);
  const productData = input.productData.map(normalizeProductData).sort((left, right) => compareRaw(left.ownerContract.id, right.ownerContract.id)); uniqueBy(productData.map(({ ownerContract }) => ({ id: ownerContract.id })), 'id', 'CHANNEL_PRODUCT_DUPLICATE', 'channel product owner');
  const normalized = { schema: input.schema, representation: input.representation, status: input.status, contract, id, version, generatorIdentity, resourcePlan, progressPlan, stageProfile, resourceContribution, progressContribution, owners, channels, statuses, lifecycle, diagnostics, compatibility, cleanup, programContribution, productData };
  return { normalized, identity: canonicalIdentity(normalized) };
}

export function simulateChannelTrace(profile, channelId, operations) {
  const channel = profile.channels.find(({ id }) => id === channelId);
  if (!channel) fail('CHANNEL_REFERENCE_PROFILE', `unknown channel ${channelId}`);
  const capacity = BigInt(channel.capacity.slots); const slots = new Map();
  const freeSlot = (index) => ({ index, state: 'free', generation: 0n, initialized: false, released: false, acquired: false, claims: 0n, disposition: null, used: false });
  const events = []; let pending = 0n;
  const slotFor = (operation) => {
    if (!Number.isSafeInteger(operation.slot) || operation.slot < 0 || BigInt(operation.slot) >= capacity) fail('CHANNEL_REFERENCE_SLOT', 'operation names an invalid slot');
    const slot = slots.get(operation.slot) ?? freeSlot(operation.slot); slots.set(operation.slot, slot);
    if (operation.generation !== undefined && BigInt(operation.generation) !== slot.generation) fail('CHANNEL_REFERENCE_STALE', 'operation generation is stale');
    return slot;
  };
  const conserve = () => {
    if (BigInt(slots.size) > capacity || [...slots.values()].some(({ claims }) => claims < 0n || claims > BigInt(channel.claim.maxClaims))) fail('CHANNEL_REFERENCE_CONSERVATION', 'channel accounting is not conserved');
  };
  for (const operation of operations) {
    if (operation.kind === 'await-unavailable') { pending += 1n; events.push({ kind: 'pending', workerReleased: true, mutableLeaseReleased: true }); conserve(); continue; }
    if (operation.kind === 'reserve') {
      const slot = slotFor(operation); if (slot.state !== 'free') { events.push({ kind: 'pressure', published: false }); conserve(); continue; }
      if (slot.used) slot.generation += 1n; slot.used = true; slot.state = 'reserved-unpublished'; slot.initialized = false; slot.released = false; slot.acquired = false; slot.claims = 0n; slot.disposition = null; events.push({ kind: 'reserved', slot: slot.index, generation: slot.generation.toString() }); conserve(); continue;
    }
    const slot = slotFor(operation);
    if (operation.kind === 'initialize') { if (slot.state !== 'reserved-unpublished') fail('CHANNEL_REFERENCE_STATE', 'initialize requires reserved-unpublished'); slot.initialized = true; events.push({ kind: 'initialized' }); }
    else if (operation.kind === 'publish') { if (slot.state !== 'reserved-unpublished' || !slot.initialized) fail('CHANNEL_REFERENCE_UNINITIALIZED', 'ready publication precedes complete initialization'); if (operation.release !== true) fail('CHANNEL_REFERENCE_RELEASE', 'ready publication lacks logical release'); slot.released = true; slot.state = 'ready'; events.push({ kind: 'ready' }); }
    else if (operation.kind === 'claim') { const additionalBorrow = channel.claim.mode === 'finite-multi-consumer-immutable-borrow' && slot.state === 'owned-or-borrowed'; if ((!['ready', 'result-ready'].includes(slot.state) && !additionalBorrow) || !slot.released) fail('CHANNEL_REFERENCE_STATE', 'claim requires released ready state'); if (operation.acquire !== true) fail('CHANNEL_REFERENCE_ACQUIRE', 'claim lacks matching logical acquire'); if (channel.claim.mode === 'single-consumer-transfer' && slot.claims !== 0n) fail('CHANNEL_REFERENCE_CLAIM', 'single-consumer item already claimed'); if (slot.claims >= BigInt(channel.claim.maxClaims)) fail('CHANNEL_REFERENCE_CLAIM', 'claim/borrow bound is exhausted'); slot.claims += 1n; slot.acquired = true; slot.state = 'owned-or-borrowed'; events.push({ kind: 'claimed', claims: slot.claims.toString() }); }
    else if (operation.kind === 'consume') { if (slot.state !== 'owned-or-borrowed' || !slot.acquired || !slot.initialized) fail('CHANNEL_REFERENCE_ACQUIRE', 'payload consumption lacks initialized acquired ownership'); events.push({ kind: 'consumed' }); }
    else if (operation.kind === 'release') { if (slot.state !== 'owned-or-borrowed' || slot.claims === 0n) fail('CHANNEL_REFERENCE_STATE', 'release lacks a live claim/borrow'); slot.claims -= 1n; slot.acquired = slot.claims > 0n; slot.state = slot.claims === 0n ? 'ready' : 'owned-or-borrowed'; events.push({ kind: 'released', claims: slot.claims.toString() }); }
    else if (operation.kind === 'complete') { if (!['owned-or-borrowed', 'ready', 'result-ready'].includes(slot.state) || slot.claims > 1n) fail('CHANNEL_REFERENCE_STATE', 'completion has ambiguous ownership'); slot.claims = 0n; slot.state = 'terminally-disposed'; slot.disposition = operation.disposition ?? 'success'; events.push({ kind: 'completed', disposition: slot.disposition }); }
    else if (operation.kind === 'cancel') { if (['free', 'reclaimable'].includes(slot.state)) events.push({ kind: 'cancel-no-effect' }); else { slot.claims = 0n; slot.state = 'terminally-disposed'; slot.disposition = 'cancelled'; events.push({ kind: 'cancelled' }); } }
    else if (operation.kind === 'expire') { if (['free', 'terminally-disposed', 'reclaimable'].includes(slot.state)) fail('CHANNEL_REFERENCE_STATE', 'expiry requires live work'); slot.claims = 0n; slot.state = 'terminally-disposed'; slot.disposition = 'expired'; events.push({ kind: 'expired' }); }
    else if (operation.kind === 'late-complete') { if (slot.state !== 'terminally-disposed') fail('CHANNEL_REFERENCE_STATE', 'late completion is not late'); events.push({ kind: 'late-ignored', disposition: slot.disposition }); }
    else if (operation.kind === 'reclaim') { if (slot.state !== 'terminally-disposed' || slot.claims !== 0n) fail('CHANNEL_REFERENCE_RECLAIM', 'reclaim requires terminal zero-reference state'); slot.state = 'reclaimable'; slot.initialized = false; slot.released = false; slot.acquired = false; events.push({ kind: 'reclaimable' }); slot.state = 'free'; events.push({ kind: 'free' }); }
    else fail('CHANNEL_REFERENCE_OPERATION', `unknown reference operation ${operation.kind}`);
    conserve();
  }
  return { slots: [...slots.values()].sort((left, right) => left.index - right.index).map(({ generation, claims, ...slot }) => ({ ...slot, generation: generation.toString(), claims: claims.toString() })), events, pending: pending.toString(), conservation: capacity.toString() };
}

export function classifyChannelProgress(profile, channelId, { pendingConsumers, producerRunnable, escapeRunnable }) {
  const channel = profile.channels.find(({ id }) => id === channelId);
  if (!channel) fail('CHANNEL_REFERENCE_PROFILE', `unknown channel ${channelId}`);
  if (producerRunnable) return 'service-producer';
  if (escapeRunnable) return 'service-escape';
  if (pendingConsumers) return 'channel-no-progress';
  return 'quiescent';
}

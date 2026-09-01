import {
  assertString,
  canonicalIdentity,
  compareDecimalUint,
  compareRaw,
  exactKeys,
  fail,
  normalizeDecimalUint,
  uniqueBy,
} from './validation.mjs';
import {
  assertNamespacedId,
  assertSha256,
  assertVersion,
  normalizeContentIdentity,
  normalizeSchemaReference,
} from './foundation.mjs';

const PROGRESS_SCHEMA = 'cuda-mcgs.progress-profile/0.2.0';
const REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const PROGRESS_CONTRACT = 'SPEC-0012';
const WORK_KINDS = ['ordinary', 'producer-unblocking', 'must-drain', 'terminal-output', 'external-control', 'resource-recovery'];
const TERMINAL_STATES = ['completed', 'failed', 'cancelled', 'abandoned', 'stale-disposed', 'quarantined'];
const STOP_TERMINAL_STATES = new Map([
  ['abandon', 'abandoned'],
  ['cancel', 'cancelled'],
  ['stale-dispose', 'stale-disposed'],
]);
const NO_PROGRESS_OUTCOMES = [
  'terminal-quiescent', 'legitimate-external-wait', 'recoverable-resource-wait', 'producer-pending', 'deadlock',
  'livelock', 'starvation', 'orphaned-work', 'stale-only', 'counter-exhausted',
];
const PORTS = ['admit-work', 'publish-ready', 'claim-ready', 'yield-pending', 'complete-work', 'fail-work', 'cancel-work', 'observe-progress', 'request-stop', 'classify-no-progress', 'publish-closure'];
const STATUS_CLASSES = new Map([
  ['invalid-progress-profile', 'fatal'], ['work-capacity', 'pending'], ['work-stale', 'stop'], ['producer-unavailable', 'pending'],
  ['progress-deadlock', 'fatal'], ['progress-livelock', 'fatal'], ['progress-starvation', 'fatal'], ['orphaned-work', 'fatal'],
  ['progress-counter-exhausted', 'stop'], ['progress-cancelled', 'cancellation'], ['progress-internal-failure', 'fatal'],
]);
const CLEANUP_KINDS = [
  'descriptor', 'work-record', 'dependency', 'ready-record', 'claim', 'continuation', 'fairness-counter',
  'wait-graph', 'no-progress-evidence', 'stop-record', 'closure-record', 'diagnostic', 'program-artifact',
];

function assertEnum(value, allowed, code, label) {
  if (!allowed.includes(value)) fail(code, `${label} is invalid`);
  return value;
}

export function assertProgressStopDispositionTerminalState(stopDisposition, terminalStates, label = 'progress work class') {
  const requiredTerminal = STOP_TERMINAL_STATES.get(stopDisposition) ?? null;
  if (requiredTerminal && !terminalStates.includes(requiredTerminal)) {
    fail('PROGRESS_WORK_TERMINAL', `${label} stop disposition ${stopDisposition} requires ${requiredTerminal} terminal state`);
  }
  return requiredTerminal;
}

function positiveDecimal(value, code, label) {
  const normalized = normalizeDecimalUint(value, label);
  if (normalized === '0') fail(code, `${label} must be positive`);
  return normalized;
}

function namespacedSet(input, code, label, minimum = 0) {
  if (!Array.isArray(input) || input.length < minimum) fail(code, `${label} must contain at least ${minimum} item(s)`);
  const result = input.map((value, index) => {
    assertNamespacedId(value, code, `${label} ${index}`);
    return value;
  });
  if (new Set(result).size !== result.length) fail(code, `${label} contains a duplicate`);
  return result.sort(compareRaw);
}

function enumSet(input, allowed, code, label, minimum = 0) {
  if (!Array.isArray(input) || input.length < minimum) fail(code, `${label} must contain at least ${minimum} item(s)`);
  const result = input.map((value, index) => assertEnum(value, allowed, code, `${label} ${index}`));
  if (new Set(result).size !== result.length) fail(code, `${label} contains a duplicate`);
  return result.sort(compareRaw);
}

function statusSet(input, code, label, minimum = 0) {
  if (!Array.isArray(input) || input.length < minimum) fail(code, `${label} must contain at least ${minimum} item(s)`);
  const result = input.map((value, index) => {
    assertString(value, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, code, `${label} ${index}`);
    return value;
  });
  if (new Set(result).size !== result.length) fail(code, `${label} contains a duplicate`);
  return result.sort(compareRaw);
}

function schemaKey(reference) {
  return `${reference.id}\0${reference.version}\0${reference.sha256}`;
}

function profileKey(profile) {
  return `${profile.id}\0${schemaKey(profile.schema)}\0${profile.identity.sha256}`;
}

function contractKey(contract) {
  return contract.kind === 'catalog'
    ? `${contract.kind}\0${contract.id}\0${contract.specificationIdentity}\0${contract.sha256}`
    : `${contract.kind}\0${contract.id}\0${contract.version}\0${contract.schema}\0${contract.sha256}`;
}

function normalizeProfileReference(input, label) {
  exactKeys(input, ['id', 'schema', 'identity'], 'PROGRESS_PROFILE_REFERENCE_FIELDS', label);
  assertNamespacedId(input.id, 'PROGRESS_PROFILE_REFERENCE_ID', `${label} id`);
  return {
    id: input.id,
    schema: normalizeSchemaReference(input.schema, `${label} schema`),
    identity: normalizeContentIdentity(input.identity, 'PROGRESS_PROFILE_REFERENCE_IDENTITY', `${label} identity`),
  };
}

function normalizeContract(input, catalogById, label) {
  if (input?.kind === 'catalog') {
    exactKeys(input, ['kind', 'id', 'specificationIdentity', 'sha256'], 'PROGRESS_CONTRACT_FIELDS', label);
    assertString(input.id, /^SPEC-[0-9]{4}$/, 'PROGRESS_CONTRACT_ID', `${label} id`);
    assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\.[0-9]+\.[0-9]+-draft$/, 'PROGRESS_CONTRACT_ID', `${label} identity`);
    assertSha256(input.sha256, 'PROGRESS_CONTRACT_DIGEST', `${label} sha256`);
    const expected = catalogById.get(input.id);
    if (!expected || expected.specificationIdentity !== input.specificationIdentity || expected.sha256 !== input.sha256) fail('PROGRESS_CONTRACT_DRIFT', `${label} differs from frozen catalog`);
    return { ...input };
  }
  exactKeys(input, ['kind', 'id', 'version', 'schema', 'sha256'], 'PROGRESS_CONTRACT_FIELDS', label);
  if (input.kind !== 'namespaced') fail('PROGRESS_CONTRACT_KIND', `${label} kind is invalid`);
  assertNamespacedId(input.id, 'PROGRESS_CONTRACT_ID', `${label} id`);
  assertVersion(input.version, 'PROGRESS_CONTRACT_VERSION', `${label} version`);
  assertString(input.schema, /^[a-z][a-z0-9.-]+\/[0-9]+\.[0-9]+\.[0-9]+$/, 'PROGRESS_CONTRACT_SCHEMA', `${label} schema`);
  assertSha256(input.sha256, 'PROGRESS_CONTRACT_DIGEST', `${label} sha256`);
  if (!input.schema.endsWith(`/${input.version}`)) fail('PROGRESS_CONTRACT_VERSION', `${label} schema/version differ`);
  return { ...input };
}

function normalizeContributor(input, index, catalogById, exactProfiles) {
  exactKeys(input, ['id', 'contract', 'profile', 'optional', 'workClasses', 'publicTransitions', 'cleanup'], 'PROGRESS_CONTRIBUTOR_FIELDS', `contributor ${index}`);
  assertNamespacedId(input.id, 'PROGRESS_CONTRIBUTOR_ID', `contributor ${index} id`);
  if (typeof input.optional !== 'boolean') fail('PROGRESS_CONTRIBUTOR_OPTIONAL', `${input.id} optional must be boolean`);
  const contract = normalizeContract(input.contract, catalogById, `${input.id} contract`);
  const profile = normalizeProfileReference(input.profile, `${input.id} profile`);
  const expected = exactProfiles.get(profile.id);
  if (!expected || input.id !== expected.id || input.optional !== expected.optional || profileKey(profile) !== profileKey(expected.profile) || contractKey(contract) !== contractKey(expected.contract)) fail('PROGRESS_CONTRIBUTOR_PROFILE', `${input.id} does not match a selected owner contribution`);
  if (!Array.isArray(input.publicTransitions) || input.publicTransitions.length === 0) fail('PROGRESS_CONTRIBUTOR_TRANSITION', `${input.id} publicTransitions must not be empty`);
  const publicTransitions = input.publicTransitions.map((entry, transitionIndex) => normalizeSchemaReference(entry, `${input.id} public transition ${transitionIndex}`)).sort((left, right) => compareRaw(schemaKey(left), schemaKey(right)));
  if (new Set(publicTransitions.map(schemaKey)).size !== publicTransitions.length) fail('PROGRESS_CONTRIBUTOR_TRANSITION', `${input.id} publicTransitions contain a duplicate`);
  return {
    id: input.id, contract, profile, optional: input.optional,
    workClasses: namespacedSet(input.workClasses, 'PROGRESS_CONTRIBUTOR_WORK', `${input.id} workClasses`, 1),
    publicTransitions, cleanup: normalizeSchemaReference(input.cleanup, `${input.id} cleanup`),
  };
}

function normalizeBounds(input, label) {
  exactKeys(input, ['maxAdmitted', 'maxProducedPerStep', 'maxStepsPerAttempt', 'maxRetries', 'maxContinuationDepth', 'maxWaitTransitions', 'counterMaximum', 'cancellationObservationWorkUnits'], 'PROGRESS_BOUNDS_FIELDS', label);
  const result = {};
  for (const key of Object.keys(input)) result[key] = key === 'maxRetries' ? normalizeDecimalUint(input[key], `${label} ${key}`) : positiveDecimal(input[key], 'PROGRESS_BOUNDS_RANGE', `${label} ${key}`);
  if (compareDecimalUint(result.maxAdmitted, result.counterMaximum) > 0) fail('PROGRESS_BOUNDS_RANGE', `${label} admitted count exceeds counter range`);
  if (compareDecimalUint(result.cancellationObservationWorkUnits, result.maxStepsPerAttempt) > 0) fail('PROGRESS_BOUNDS_CANCELLATION', `${label} cancellation observation exceeds step bound`);
  return result;
}

function normalizeBatch(input, label) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'PROGRESS_BATCH_FIELDS', label);
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'minimumItems', 'maximumItems', 'flushAfterOpportunities', 'readiness', 'hostTimeout'], 'PROGRESS_BATCH_FIELDS', label);
  if (input.kind !== 'device-flush' || input.hostTimeout !== 'none') fail('PROGRESS_BATCH_KIND', `${label} must use device-visible flush without host timeout`);
  const minimumItems = positiveDecimal(input.minimumItems, 'PROGRESS_BATCH_RANGE', `${label} minimumItems`);
  const maximumItems = positiveDecimal(input.maximumItems, 'PROGRESS_BATCH_RANGE', `${label} maximumItems`);
  if (compareDecimalUint(minimumItems, maximumItems) > 0) fail('PROGRESS_BATCH_RANGE', `${label} minimum exceeds maximum`);
  return {
    kind: input.kind, minimumItems, maximumItems,
    flushAfterOpportunities: positiveDecimal(input.flushAfterOpportunities, 'PROGRESS_BATCH_RANGE', `${label} flushAfterOpportunities`),
    readiness: normalizeSchemaReference(input.readiness, `${label} readiness`), hostTimeout: input.hostTimeout,
  };
}

function normalizeStep(input, label) {
  exactKeys(input, ['contract', 'completion', 'continuationIdentity', 'publication', 'failure'], 'PROGRESS_STEP_FIELDS', label);
  const completion = assertEnum(input.completion, ['bounded', 'finite-continuation'], 'PROGRESS_STEP_COMPLETION', `${label} completion`);
  const continuationIdentity = input.continuationIdentity === null ? null : normalizeSchemaReference(input.continuationIdentity, `${label} continuationIdentity`);
  if ((completion === 'bounded') !== (continuationIdentity === null)) fail('PROGRESS_STEP_CONTINUATION', `${label} continuation identity contradicts completion`);
  return {
    contract: normalizeSchemaReference(input.contract, `${label} contract`), completion, continuationIdentity,
    publication: normalizeSchemaReference(input.publication, `${label} publication`), failure: normalizeSchemaReference(input.failure, `${label} failure`),
  };
}

function normalizeReadiness(input, label) {
  exactKeys(input, ['mode', 'predicate', 'publication', 'independentReady', 'dependencies'], 'PROGRESS_READINESS_FIELDS', label);
  const mode = assertEnum(input.mode, ['all', 'any-with-independent'], 'PROGRESS_READINESS_MODE', `${label} mode`);
  if (typeof input.independentReady !== 'boolean' || (mode === 'any-with-independent') !== input.independentReady) fail('PROGRESS_READINESS_MODE', `${label} independent readiness contradicts mode`);
  return {
    mode, predicate: normalizeSchemaReference(input.predicate, `${label} predicate`), publication: normalizeSchemaReference(input.publication, `${label} publication`),
    independentReady: input.independentReady, dependencies: namespacedSet(input.dependencies, 'PROGRESS_READINESS_DEPENDENCY', `${label} dependencies`),
  };
}

function normalizeWorkClass(input, index, contributorById, resourceClassById, reserveById) {
  exactKeys(input, ['id', 'version', 'owner', 'kind', 'payload', 'inputStates', 'outputStates', 'readiness', 'resources', 'reserve', 'bounds', 'fairness', 'batch', 'claim', 'step', 'retry', 'cancellation', 'stale', 'stopDisposition', 'terminalStates', 'status', 'cleanup'], 'PROGRESS_WORK_FIELDS', `work class ${index}`);
  assertNamespacedId(input.id, 'PROGRESS_WORK_ID', `work class ${index} id`);
  assertVersion(input.version, 'PROGRESS_WORK_VERSION', `${input.id} version`);
  const owner = contributorById.get(input.owner);
  if (!owner || !owner.workClasses.includes(input.id)) fail('PROGRESS_WORK_OWNER', `${input.id} owner is invalid`);
  const resources = namespacedSet(input.resources, 'PROGRESS_WORK_RESOURCE', `${input.id} resources`);
  for (const resource of resources) if (resourceClassById.get(resource)?.contributor !== owner.id) fail('PROGRESS_WORK_RESOURCE', `${input.id} resource is absent or owned by another contributor`);
  const reserve = input.reserve === null ? null : (assertNamespacedId(input.reserve, 'PROGRESS_WORK_RESERVE', `${input.id} reserve`), input.reserve);
  if (reserve && (!reserveById.has(reserve) || !reserveById.get(reserve).eligibleOwners.includes(owner.id))) fail('PROGRESS_WORK_RESERVE', `${input.id} reserve is absent or unavailable to its owner`);
  const requiredReservePurpose = input.kind === 'terminal-output' ? 'terminal-result'
    : (['producer-unblocking', 'must-drain', 'resource-recovery'].includes(input.kind) ? 'progress-cleanup' : null);
  if (requiredReservePurpose && reserveById.get(reserve)?.purpose !== requiredReservePurpose) fail('PROGRESS_WORK_RESERVE', `${input.id} requires the ${requiredReservePurpose} reserve`);
  if (input.kind === 'resource-recovery' && resources.length === 0) fail('PROGRESS_WORK_RESOURCE', `${input.id} recovery must name its owned resource state`);
  exactKeys(input.retry, ['staleSafe', 'idempotence'], 'PROGRESS_RETRY_FIELDS', `${input.id} retry`);
  if (input.retry.staleSafe !== true) fail('PROGRESS_RETRY_STALE', `${input.id} retry must be stale-safe`);
  assertNamespacedId(input.fairness, 'PROGRESS_WORK_FAIRNESS', `${input.id} fairness`);
  assertString(input.status, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, 'PROGRESS_WORK_STATUS', `${input.id} status`);
  const readiness = normalizeReadiness(input.readiness, `${input.id} readiness`);
  const step = normalizeStep(input.step, `${input.id} step`);
  for (const [label, publication] of [['readiness', readiness.publication], ['step', step.publication]]) {
    if (!owner.publicTransitions.some((transition) => schemaKey(transition) === schemaKey(publication))) fail('PROGRESS_WORK_PUBLICATION', `${input.id} ${label} publication is not an owner public transition`);
  }
  const terminalStates = enumSet(input.terminalStates, TERMINAL_STATES, 'PROGRESS_WORK_TERMINAL', `${input.id} terminalStates`, 3);
  for (const required of ['failed', 'cancelled']) if (!terminalStates.includes(required)) fail('PROGRESS_WORK_TERMINAL', `${input.id} omits ${required} terminal disposition`);
  const stopDisposition = assertEnum(input.stopDisposition, ['service', 'drain', 'abandon', 'cancel', 'stale-dispose'], 'PROGRESS_WORK_STOP', `${input.id} stopDisposition`);
  assertProgressStopDispositionTerminalState(stopDisposition, terminalStates, input.id);
  const requiredStopDisposition = ['must-drain', 'terminal-output'].includes(input.kind) ? 'drain'
    : (['producer-unblocking', 'resource-recovery'].includes(input.kind) ? 'service' : null);
  if (requiredStopDisposition && stopDisposition !== requiredStopDisposition) fail('PROGRESS_WORK_STOP', `${input.id} must use ${requiredStopDisposition} after stop`);
  return {
    id: input.id, version: input.version, owner: input.owner,
    kind: assertEnum(input.kind, WORK_KINDS, 'PROGRESS_WORK_KIND', `${input.id} kind`),
    payload: normalizeSchemaReference(input.payload, `${input.id} payload`),
    inputStates: namespacedSet(input.inputStates, 'PROGRESS_WORK_STATE', `${input.id} inputStates`, 1),
    outputStates: namespacedSet(input.outputStates, 'PROGRESS_WORK_STATE', `${input.id} outputStates`, 1),
    readiness, resources, reserve,
    bounds: normalizeBounds(input.bounds, `${input.id} bounds`), fairness: input.fairness,
    batch: normalizeBatch(input.batch, `${input.id} batch`),
    claim: assertEnum(input.claim, ['exclusive', 'idempotent-cooperative'], 'PROGRESS_WORK_CLAIM', `${input.id} claim`),
    step,
    retry: { staleSafe: true, idempotence: normalizeSchemaReference(input.retry.idempotence, `${input.id} retry idempotence`) },
    cancellation: normalizeSchemaReference(input.cancellation, `${input.id} cancellation`), stale: normalizeSchemaReference(input.stale, `${input.id} stale`),
    stopDisposition, terminalStates,
    status: input.status, cleanup: normalizeSchemaReference(input.cleanup, `${input.id} cleanup`),
  };
}

function normalizeProducer(input, label, contributorById, workById) {
  exactKeys(input, ['kind', 'owner', 'workClass', 'fact'], 'PROGRESS_PRODUCER_FIELDS', label);
  const kind = assertEnum(input.kind, ['work-class', 'fact', 'external-control', 'resource-recovery'], 'PROGRESS_PRODUCER_KIND', `${label} kind`);
  const owner = contributorById.get(input.owner);
  if (!owner) fail('PROGRESS_PRODUCER_OWNER', `${label} owner is unknown`);
  const workClass = input.workClass === null ? null : (assertNamespacedId(input.workClass, 'PROGRESS_PRODUCER_WORK', `${label} workClass`), input.workClass);
  if ((kind === 'work-class') !== (workClass !== null) || (workClass && workById.get(workClass)?.owner !== owner.id)) fail('PROGRESS_PRODUCER_WORK', `${label} work class is invalid`);
  if (kind === 'external-control' && owner.contract.id !== 'SPEC-0006') fail('PROGRESS_PRODUCER_OWNER', `${label} external control must be session-owned`);
  if (kind === 'resource-recovery' && owner.contract.id !== 'SPEC-0011') fail('PROGRESS_PRODUCER_OWNER', `${label} recovery must be resource-owned`);
  const fact = normalizeSchemaReference(input.fact, `${label} fact`);
  if (!owner.publicTransitions.some((transition) => schemaKey(transition) === schemaKey(fact))) fail('PROGRESS_PRODUCER_FACT', `${label} fact is not a public owner transition`);
  if (kind === 'work-class' && schemaKey(workById.get(workClass).step.publication) !== schemaKey(fact)) fail('PROGRESS_PRODUCER_FACT', `${label} fact is not the selected work-class publication`);
  if (kind === 'resource-recovery' && ![...workById.values()].some((entry) => entry.owner === owner.id && entry.kind === 'resource-recovery' && schemaKey(entry.step.publication) === schemaKey(fact))) fail('PROGRESS_PRODUCER_FACT', `${label} fact is not a selected resource-recovery publication`);
  return { kind, owner: owner.id, workClass, fact };
}

function normalizeDependency(input, index, contributorById, workById) {
  exactKeys(input, ['id', 'consumer', 'producer', 'requirement', 'publication', 'incarnation', 'escapes', 'maxWaitTransitions', 'fallback', 'holdsWorker', 'holdsProducerResource'], 'PROGRESS_DEPENDENCY_FIELDS', `dependency ${index}`);
  assertNamespacedId(input.id, 'PROGRESS_DEPENDENCY_ID', `dependency ${index} id`);
  if (!workById.has(input.consumer)) fail('PROGRESS_DEPENDENCY_CONSUMER', `${input.id} consumer is unknown`);
  const producer = normalizeProducer(input.producer, `${input.id} producer`, contributorById, workById);
  const requirement = assertEnum(input.requirement, ['required', 'advisory'], 'PROGRESS_DEPENDENCY_REQUIREMENT', `${input.id} requirement`);
  const fallback = input.fallback === null ? null : normalizeSchemaReference(input.fallback, `${input.id} fallback`);
  if (requirement === 'advisory' && fallback === null) fail('PROGRESS_DEPENDENCY_FALLBACK', `${input.id} advisory dependency requires fallback`);
  if (requirement === 'required' && fallback !== null) fail('PROGRESS_DEPENDENCY_FALLBACK', `${input.id} required dependency cannot silently fall back`);
  const escapes = enumSet(input.escapes, ['failure', 'cancel', 'stop', 'fallback', 'stale'], 'PROGRESS_DEPENDENCY_ESCAPE', `${input.id} escapes`, 3);
  for (const requiredEscape of ['failure', 'cancel', 'stop']) if (!escapes.includes(requiredEscape)) fail('PROGRESS_DEPENDENCY_ESCAPE', `${input.id} omits ${requiredEscape} escape`);
  if (requirement === 'advisory' && !escapes.includes('fallback')) fail('PROGRESS_DEPENDENCY_FALLBACK', `${input.id} advisory dependency omits fallback escape`);
  if (producer.kind === 'work-class' && producer.workClass === input.consumer && requirement === 'required') fail('PROGRESS_DEPENDENCY_SELF', `${input.id} cannot require its own output`);
  if (producer.kind === 'external-control' && schemaKey(producer.fact) === schemaKey(workById.get(input.consumer).step.publication)) fail('PROGRESS_DEPENDENCY_SELF', `${input.id} external input cannot alias its consumer output`);
  if (input.holdsWorker !== false || input.holdsProducerResource !== false) fail('PROGRESS_DEPENDENCY_HOLD', `${input.id} pending wait must release worker and producer resource`);
  return {
    id: input.id, consumer: input.consumer, producer, requirement,
    publication: normalizeSchemaReference(input.publication, `${input.id} publication`), incarnation: normalizeSchemaReference(input.incarnation, `${input.id} incarnation`),
    escapes,
    maxWaitTransitions: positiveDecimal(input.maxWaitTransitions, 'PROGRESS_DEPENDENCY_WAIT', `${input.id} maxWaitTransitions`), fallback,
    holdsWorker: false, holdsProducerResource: false,
  };
}

function assertRequiredCycleBreakers(workClasses, dependencies) {
  const workById = new Map(workClasses.map((entry) => [entry.id, entry]));
  const edges = new Map(workClasses.map(({ id }) => [id, []]));
  for (const dependency of dependencies) if (dependency.requirement === 'required' && dependency.producer.kind === 'work-class') edges.get(dependency.consumer).push(dependency.producer.workClass);
  let sequence = 0;
  const indices = new Map(); const low = new Map(); const stack = []; const onStack = new Set();
  function visit(id) {
    indices.set(id, sequence); low.set(id, sequence); sequence += 1; stack.push(id); onStack.add(id);
    for (const target of edges.get(id)) {
      if (!indices.has(target)) { visit(target); low.set(id, Math.min(low.get(id), low.get(target))); }
      else if (onStack.has(target)) low.set(id, Math.min(low.get(id), indices.get(target)));
    }
    if (low.get(id) !== indices.get(id)) return;
    const component = [];
    while (stack.length > 0) { const member = stack.pop(); onStack.delete(member); component.push(member); if (member === id) break; }
    const cyclic = component.length > 1 || edges.get(id).includes(id);
    if (cyclic && !component.some((member) => workById.get(member).readiness.independentReady)) fail('PROGRESS_DEPENDENCY_CYCLE', `mandatory wait cycle lacks an independently ready breaker: ${component.sort(compareRaw).join(', ')}`);
  }
  for (const { id } of workClasses) if (!indices.has(id)) visit(id);
}

function normalizeFairness(input, index, workById) {
  exactKeys(input, ['id', 'mode', 'classes', 'maxServiceOpportunities', 'priority', 'serviceOpportunity', 'starvationEscape', 'closurePriority'], 'PROGRESS_FAIRNESS_FIELDS', `fairness ${index}`);
  assertNamespacedId(input.id, 'PROGRESS_FAIRNESS_ID', `fairness ${index} id`);
  const mode = assertEnum(input.mode, ['bounded-service-gap', 'weak', 'strong', 'priority-with-starvation-escape', 'custom-finite'], 'PROGRESS_FAIRNESS_MODE', `${input.id} mode`);
  const classes = namespacedSet(input.classes, 'PROGRESS_FAIRNESS_CLASS', `${input.id} classes`, 1);
  for (const id of classes) if (!workById.has(id)) fail('PROGRESS_FAIRNESS_CLASS', `${input.id} names unknown class`);
  const starvationEscape = input.starvationEscape === null ? null : normalizeSchemaReference(input.starvationEscape, `${input.id} starvationEscape`);
  if (mode === 'priority-with-starvation-escape' && starvationEscape === null) fail('PROGRESS_FAIRNESS_ESCAPE', `${input.id} priority requires starvation escape`);
  if (typeof input.closurePriority !== 'boolean') fail('PROGRESS_FAIRNESS_CLOSURE', `${input.id} closurePriority must be boolean`);
  return {
    id: input.id, mode, classes,
    maxServiceOpportunities: positiveDecimal(input.maxServiceOpportunities, 'PROGRESS_FAIRNESS_RANGE', `${input.id} maxServiceOpportunities`),
    priority: normalizeDecimalUint(input.priority, `${input.id} priority`), serviceOpportunity: normalizeSchemaReference(input.serviceOpportunity, `${input.id} serviceOpportunity`),
    starvationEscape, closurePriority: input.closurePriority,
  };
}

function normalizeNoProgress(input, contributorById) {
  exactKeys(input, ['outcomes', 'classifier', 'waitGraph', 'potential', 'maxRepeatedTransitions', 'maxEvidenceRecords', 'source', 'firstCause', 'hostObservation', 'externalWait'], 'PROGRESS_NOPROGRESS_FIELDS', 'noProgress');
  const outcomes = enumSet(input.outcomes, NO_PROGRESS_OUTCOMES, 'PROGRESS_NOPROGRESS_OUTCOME', 'noProgress outcomes', NO_PROGRESS_OUTCOMES.length);
  if (outcomes.length !== NO_PROGRESS_OUTCOMES.length || input.source !== 'device-visible-ready-facts' || input.firstCause !== 'immutable-first-fatal-cas' || input.hostObservation !== 'non-progressing') fail('PROGRESS_NOPROGRESS_CONTRACT', 'no-progress contract is incomplete');
  let externalWait;
  if (input.externalWait?.kind === 'absent') {
    exactKeys(input.externalWait, ['kind'], 'PROGRESS_EXTERNAL_WAIT_FIELDS', 'externalWait'); externalWait = { kind: 'absent' };
    if ([...contributorById.values()].some(({ contract }) => contract.id === 'SPEC-0006')) fail('PROGRESS_EXTERNAL_WAIT_SESSION', 'selected session requires explicit external-wait contract');
  } else {
    exactKeys(input.externalWait, ['kind', 'owner', 'state', 'maxPendingCommands'], 'PROGRESS_EXTERNAL_WAIT_FIELDS', 'externalWait');
    if (input.externalWait.kind !== 'session-only' || contributorById.get(input.externalWait.owner)?.contract.id !== 'SPEC-0006') fail('PROGRESS_EXTERNAL_WAIT_SESSION', 'external wait must be selected-session owned');
    const state = normalizeSchemaReference(input.externalWait.state, 'externalWait state');
    if (!contributorById.get(input.externalWait.owner).publicTransitions.some((transition) => schemaKey(transition) === schemaKey(state))) fail('PROGRESS_EXTERNAL_WAIT_SESSION', 'external wait state is not a public session transition');
    externalWait = { kind: input.externalWait.kind, owner: input.externalWait.owner, state, maxPendingCommands: positiveDecimal(input.externalWait.maxPendingCommands, 'PROGRESS_EXTERNAL_WAIT_RANGE', 'externalWait maxPendingCommands') };
  }
  return {
    outcomes, classifier: normalizeSchemaReference(input.classifier, 'noProgress classifier'), waitGraph: normalizeSchemaReference(input.waitGraph, 'noProgress waitGraph'),
    potential: normalizeSchemaReference(input.potential, 'noProgress potential'), maxRepeatedTransitions: positiveDecimal(input.maxRepeatedTransitions, 'PROGRESS_NOPROGRESS_RANGE', 'noProgress maxRepeatedTransitions'),
    maxEvidenceRecords: positiveDecimal(input.maxEvidenceRecords, 'PROGRESS_NOPROGRESS_RANGE', 'noProgress maxEvidenceRecords'),
    source: input.source, firstCause: input.firstCause, hostObservation: input.hostObservation, externalWait,
  };
}

function normalizeStop(input) {
  exactKeys(input, ['states', 'firstCause', 'ordinaryAdmissionClosedAt', 'mustDrainKinds', 'epochChange', 'observationDependency', 'counterWrap'], 'PROGRESS_STOP_FIELDS', 'stop');
  const states = ['running', 'stop-requested', 'draining', 'terminal'];
  if (!Array.isArray(input.states) || input.states.length !== states.length || input.states.some((state, index) => state !== states[index]) || input.firstCause !== 'immutable-first-cas' || input.ordinaryAdmissionClosedAt !== 'stop-requested' || input.observationDependency !== 'none' || input.counterWrap !== 'prohibited') fail('PROGRESS_STOP_CONTRACT', 'stop contract is incomplete');
  return {
    states: [...input.states], firstCause: input.firstCause, ordinaryAdmissionClosedAt: input.ordinaryAdmissionClosedAt,
    mustDrainKinds: enumSet(input.mustDrainKinds, ['must-drain', 'terminal-output', 'producer-unblocking', 'resource-recovery'], 'PROGRESS_STOP_DRAIN', 'stop mustDrainKinds', 4),
    epochChange: normalizeSchemaReference(input.epochChange, 'stop epochChange'), observationDependency: input.observationDependency, counterWrap: input.counterWrap,
  };
}

function normalizeOutputBorrow(input) {
  if (input?.kind === 'none') { exactKeys(input, ['kind'], 'PROGRESS_OUTPUT_BORROW_FIELDS', 'closure outputBorrow'); return { kind: 'none' }; }
  exactKeys(input, ['kind', 'maximum', 'teardown'], 'PROGRESS_OUTPUT_BORROW_FIELDS', 'closure outputBorrow');
  if (input.kind !== 'bounded-postsemantic') fail('PROGRESS_OUTPUT_BORROW_KIND', 'closure outputBorrow kind is invalid');
  return { kind: input.kind, maximum: positiveDecimal(input.maximum, 'PROGRESS_OUTPUT_BORROW_RANGE', 'closure outputBorrow maximum'), teardown: normalizeSchemaReference(input.teardown, 'closure outputBorrow teardown') };
}

function normalizeClosure(input, workClasses, hasLiveOutput) {
  exactKeys(input, ['workClasses', 'workAccounting', 'channels', 'ownerTransitions', 'resources', 'terminalOutput', 'publication', 'observationAckRequired', 'outputBorrow', 'conflict'], 'PROGRESS_CLOSURE_FIELDS', 'closure');
  const classes = namespacedSet(input.workClasses, 'PROGRESS_CLOSURE_CLASS', 'closure workClasses', 1);
  if (classes.length !== workClasses.length || workClasses.some(({ id }) => !classes.includes(id))) fail('PROGRESS_CLOSURE_COVERAGE', 'closure does not cover every selected work class');
  if (input.workAccounting !== 'all-admitted-terminal' || input.channels !== 'all-required-terminal' || input.ownerTransitions !== 'ready-or-quarantined' || input.resources !== 'conservation-reconciled' || input.terminalOutput !== 'publishable-from-reserve' || input.observationAckRequired !== false) fail('PROGRESS_CLOSURE_CONTRACT', 'closure contract is incomplete');
  const outputBorrow = normalizeOutputBorrow(input.outputBorrow);
  if ((outputBorrow.kind === 'bounded-postsemantic') !== hasLiveOutput) fail('PROGRESS_OUTPUT_BORROW_KIND', 'closure output borrow differs from selected live-output ownership');
  return {
    workClasses: classes, workAccounting: input.workAccounting, channels: input.channels, ownerTransitions: input.ownerTransitions,
    resources: input.resources, terminalOutput: input.terminalOutput, publication: normalizeSchemaReference(input.publication, 'closure publication'),
    observationAckRequired: false, outputBorrow, conflict: normalizeSchemaReference(input.conflict, 'closure conflict'),
  };
}

function normalizeLifecycle(input) {
  exactKeys(input, ['states', 'failure', 'quarantine', 'teardown', 'release'], 'PROGRESS_LIFECYCLE_FIELDS', 'lifecycle');
  const states = ['profile-normalized', 'resources-admitted', 'initialized', 'running', 'draining', 'terminal', 'released'];
  if (!Array.isArray(input.states) || input.states.length !== states.length || input.states.some((state, index) => state !== states[index])) fail('PROGRESS_LIFECYCLE_STATES', 'progress lifecycle is incomplete');
  return {
    states: [...input.states], failure: normalizeSchemaReference(input.failure, 'lifecycle failure'), quarantine: normalizeSchemaReference(input.quarantine, 'lifecycle quarantine'),
    teardown: normalizeSchemaReference(input.teardown, 'lifecycle teardown'), release: normalizeSchemaReference(input.release, 'lifecycle release'),
  };
}

function normalizeStatus(input, index) {
  exactKeys(input, ['code', 'class', 'diagnostic'], 'PROGRESS_STATUS_FIELDS', `status ${index}`);
  assertString(input.code, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, 'PROGRESS_STATUS_CODE', `status ${index} code`);
  const statusClass = assertEnum(input.class, ['normal', 'pending', 'stop', 'fatal', 'cancellation'], 'PROGRESS_STATUS_CLASS', `${input.code} class`);
  if (typeof input.diagnostic !== 'boolean') fail('PROGRESS_STATUS_DIAGNOSTIC', `${input.code} diagnostic must be boolean`);
  if (STATUS_CLASSES.has(input.code) && STATUS_CLASSES.get(input.code) !== statusClass) fail('PROGRESS_STATUS_CLASS', `${input.code} class differs from required contract`);
  return { code: input.code, class: statusClass, diagnostic: input.diagnostic };
}

function normalizePort(input, index, statusCodes) {
  exactKeys(input, ['id', 'phase', 'contract', 'bounds', 'completion', 'statuses'], 'PROGRESS_PORT_FIELDS', `port ${index}`);
  assertEnum(input.id, PORTS, 'PROGRESS_PORT_ID', `port ${index} id`);
  if (input.phase !== 'device-active') fail('PROGRESS_PORT_PHASE', `${input.id} must be device-active`);
  const statuses = statusSet(input.statuses, 'PROGRESS_PORT_STATUS', `${input.id} statuses`, 1);
  if (statuses.some((status) => !statusCodes.has(status))) fail('PROGRESS_PORT_STATUS', `${input.id} names undeclared status`);
  return {
    id: input.id, phase: input.phase, contract: normalizeSchemaReference(input.contract, `${input.id} contract`), bounds: normalizeBounds(input.bounds, `${input.id} bounds`),
    completion: assertEnum(input.completion, ['bounded', 'finite-continuation', 'must-drain'], 'PROGRESS_PORT_COMPLETION', `${input.id} completion`), statuses,
  };
}

function normalizeDiagnostics(input) {
  exactKeys(input, ['authority', 'maxRecords', 'maxBytes', 'overflow', 'rawAddresses', 'privatePayloads', 'wallClock'], 'PROGRESS_DIAGNOSTIC_FIELDS', 'diagnostics');
  if (input.authority !== 'non-authoritative' || input.rawAddresses !== false || input.privatePayloads !== false || input.wallClock !== false) fail('PROGRESS_DIAGNOSTIC_AUTHORITY', 'diagnostics must be bounded, non-authoritative and semantic-only');
  return {
    authority: input.authority, maxRecords: positiveDecimal(input.maxRecords, 'PROGRESS_DIAGNOSTIC_RANGE', 'diagnostics maxRecords'),
    maxBytes: positiveDecimal(input.maxBytes, 'PROGRESS_DIAGNOSTIC_RANGE', 'diagnostics maxBytes'), overflow: assertEnum(input.overflow, ['drop', 'count', 'terminal'], 'PROGRESS_DIAGNOSTIC_OVERFLOW', 'diagnostics overflow'),
    rawAddresses: false, privatePayloads: false, wallClock: false,
  };
}

function normalizeCompatibility(input) {
  exactKeys(input, ['packageIdentityRequired', 'schedulerIdentityExcluded', 'persistence'], 'PROGRESS_COMPAT_FIELDS', 'compatibility');
  if (input.packageIdentityRequired !== true || input.schedulerIdentityExcluded !== true) fail('PROGRESS_COMPAT_IDENTITY', 'compatibility identity policy is incomplete');
  let persistence;
  if (input.persistence?.kind === 'none') { exactKeys(input.persistence, ['kind'], 'PROGRESS_PERSISTENCE_FIELDS', 'persistence'); persistence = { kind: 'none' }; }
  else {
    exactKeys(input.persistence, ['kind', 'encoding', 'namespace', 'integrity', 'recovery', 'retention', 'cleanup'], 'PROGRESS_PERSISTENCE_FIELDS', 'persistence');
    if (input.persistence.kind !== 'versioned') fail('PROGRESS_PERSISTENCE_KIND', 'persistence kind is invalid');
    assertNamespacedId(input.persistence.namespace, 'PROGRESS_PERSISTENCE_NAMESPACE', 'persistence namespace');
    persistence = { kind: input.persistence.kind, namespace: input.persistence.namespace };
    for (const key of ['encoding', 'integrity', 'recovery', 'retention', 'cleanup']) persistence[key] = normalizeSchemaReference(input.persistence[key], `persistence ${key}`);
  }
  return { packageIdentityRequired: true, schedulerIdentityExcluded: true, persistence };
}

function normalizeCleanup(input) {
  exactKeys(input, ['kinds', 'disposition', 'quarantine', 'releaseOrder', 'retainedEvidence'], 'PROGRESS_CLEANUP_FIELDS', 'cleanup');
  const kinds = enumSet(input.kinds, CLEANUP_KINDS, 'PROGRESS_CLEANUP_KIND', 'cleanup kinds', CLEANUP_KINDS.length);
  if (kinds.length !== CLEANUP_KINDS.length) fail('PROGRESS_CLEANUP_COVERAGE', 'cleanup does not cover every progress state kind');
  return {
    kinds, disposition: normalizeSchemaReference(input.disposition, 'cleanup disposition'), quarantine: normalizeSchemaReference(input.quarantine, 'cleanup quarantine'),
    releaseOrder: normalizeSchemaReference(input.releaseOrder, 'cleanup releaseOrder'), retainedEvidence: normalizeSchemaReference(input.retainedEvidence, 'cleanup retainedEvidence'),
  };
}

function normalizeProgram(input, requiredProfiles) {
  exactKeys(input, ['kind', 'language', 'sourceIdentity', 'inputs', 'provenance'], 'PROGRESS_PROGRAM_FIELDS', 'programContribution');
  if (input.kind !== 'device-program' || input.language !== 'restricted-device-js') fail('PROGRESS_PROGRAM_LANGUAGE', 'progress contribution must be restricted Device-JS');
  const inputs = input.inputs.map((entry, index) => normalizeProfileReference(entry, `program input ${index}`)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(inputs, 'id', 'PROGRESS_PROGRAM_INPUT_DUPLICATE', 'program input');
  const actual = new Map(inputs.map((profile) => [profile.id, profileKey(profile)]));
  if (actual.size !== requiredProfiles.size || [...requiredProfiles].some(([id, profile]) => actual.get(id) !== profileKey(profile))) fail('PROGRESS_PROGRAM_INPUTS', 'program inputs differ from selected public profiles/resource plan');
  exactKeys(input.provenance, ['origin', 'revision', 'license', 'review'], 'PROGRESS_PROGRAM_PROVENANCE_FIELDS', 'program provenance');
  if (input.provenance.origin !== 'first-party') fail('PROGRESS_PROGRAM_ORIGIN', 'progress program must be first-party');
  assertString(input.provenance.revision, /^[0-9a-f]{40}$/, 'PROGRESS_PROGRAM_REVISION', 'program provenance revision');
  assertString(input.provenance.license, /\S/, 'PROGRESS_PROGRAM_LICENSE', 'program provenance license');
  return {
    kind: input.kind, language: input.language, sourceIdentity: normalizeContentIdentity(input.sourceIdentity, 'PROGRESS_PROGRAM_SOURCE', 'program sourceIdentity'), inputs,
    provenance: { ...input.provenance, review: normalizeSchemaReference(input.provenance.review, 'program provenance review') },
  };
}

function normalizeProductData(input, index) {
  exactKeys(input, ['ownerContract', 'schema', 'identity'], 'PROGRESS_PRODUCT_FIELDS', `productData ${index}`);
  if (input.ownerContract?.kind !== 'namespaced') fail('PROGRESS_PRODUCT_OWNER', 'product data owner must be namespaced');
  const ownerContract = normalizeContract(input.ownerContract, new Map(), `productData ${index} ownerContract`);
  return { ownerContract, schema: normalizeSchemaReference(input.schema, `productData ${index} schema`), identity: normalizeContentIdentity(input.identity, 'PROGRESS_PRODUCT_IDENTITY', `productData ${index} identity`) };
}

export function normalizeProgressProfile(input, inspectedCatalog, resourceResult, profileResults = []) {
  exactKeys(input, ['schema', 'representation', 'status', 'contract', 'id', 'version', 'resourcePlan', 'resourceContribution', 'contributors', 'workClasses', 'dependencies', 'fairnessClasses', 'noProgress', 'stop', 'closure', 'lifecycle', 'ports', 'statuses', 'diagnostics', 'compatibility', 'cleanup', 'programContribution', 'productData'], 'PROGRESS_ROOT_FIELDS', 'progress profile');
  if (input.schema !== PROGRESS_SCHEMA || input.representation !== REPRESENTATION || input.status !== 'proposal-evidence') fail('PROGRESS_SCHEMA', 'unsupported progress schema/representation/status');
  assertNamespacedId(input.id, 'PROGRESS_PROFILE_ID', 'progress profile id'); assertVersion(input.version, 'PROGRESS_PROFILE_VERSION', 'progress profile version');
  const contracts = inspectedCatalog?.contractSet?.contracts; if (!contracts) fail('PROGRESS_CATALOG', 'inspected catalog is required');
  const catalogById = new Map(contracts.map((contract) => [contract.id, contract]));
  const contract = normalizeContract(input.contract, catalogById, 'progress contract');
  if (contract.id !== PROGRESS_CONTRACT) fail('PROGRESS_CONTRACT_ID', `progress contract must select ${PROGRESS_CONTRACT}`);
  if (!resourceResult?.normalized || !resourceResult?.schemaSha) fail('PROGRESS_RESOURCE_PLAN', 'exact normalized resource plan is required');
  const resourcePlan = normalizeProfileReference(input.resourcePlan, 'resourcePlan');
  const expectedResourcePlan = { id: resourceResult.normalized.id, schema: { id: resourceResult.normalized.schema, version: '0.2.0', sha256: resourceResult.schemaSha }, identity: resourceResult.identity };
  if (profileKey(resourcePlan) !== profileKey(expectedResourcePlan)) fail('PROGRESS_RESOURCE_PLAN', 'resourcePlan differs from normalized resource profile');
  const selectedResourceContributor = resourceResult.normalized.contributors.find(({ contract: ownerContract }) => ownerContract.id === PROGRESS_CONTRACT);
  const resourceContribution = normalizeProfileReference(input.resourceContribution, 'resourceContribution');
  if (!selectedResourceContributor || profileKey(resourceContribution) !== profileKey(selectedResourceContributor.profile)) fail('PROGRESS_RESOURCE_CONTRIBUTION', 'resource contribution differs from SPEC-0011 composition');

  const knownProfiles = new Map(profileResults.map((result) => [result.normalized.id, { profile: { id: result.normalized.id, schema: { id: result.normalized.schema, version: '0.2.0', sha256: result.schemaSha }, identity: result.identity }, contract: result.normalized.contract }]));
  const exactProfiles = new Map(resourceResult.normalized.contributors.map((entry) => [entry.profile.id, { id: entry.id, profile: entry.profile, contract: entry.contract, optional: entry.optional }]));
  for (const [id, known] of knownProfiles) if (exactProfiles.has(id) && (profileKey(exactProfiles.get(id).profile) !== profileKey(known.profile) || contractKey(exactProfiles.get(id).contract) !== contractKey(known.contract))) fail('PROGRESS_RESOURCE_CONTRIBUTOR', `${id} resource-plan contributor differs from normalized owner profile`);

  if (!Array.isArray(input.contributors) || input.contributors.length !== exactProfiles.size) fail('PROGRESS_CONTRIBUTOR_COUNT', 'contributors must exactly cover resource-plan owners');
  const contributors = input.contributors.map((entry, index) => normalizeContributor(entry, index, catalogById, exactProfiles)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(contributors, 'id', 'PROGRESS_CONTRIBUTOR_DUPLICATE', 'contributor'); uniqueBy(contributors.map(({ profile }) => ({ id: profile.id })), 'id', 'PROGRESS_CONTRIBUTOR_PROFILE_DUPLICATE', 'contributor profile');
  if (new Set(contributors.map(({ profile }) => profile.id)).size !== exactProfiles.size || [...exactProfiles.keys()].some((id) => !contributors.some(({ profile }) => profile.id === id))) fail('PROGRESS_CONTRIBUTOR_COVERAGE', 'contributors do not exactly cover resource-plan owners');
  const contributorById = new Map(contributors.map((entry) => [entry.id, entry]));

  const resourceClassById = new Map(resourceResult.normalized.classes.map((entry) => [entry.id, entry]));
  const reserveById = new Map(resourceResult.normalized.reserves.map((entry) => [entry.id, entry]));
  const workClasses = input.workClasses.map((entry, index) => normalizeWorkClass(entry, index, contributorById, resourceClassById, reserveById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(workClasses, 'id', 'PROGRESS_WORK_DUPLICATE', 'work class');
  const workById = new Map(workClasses.map((entry) => [entry.id, entry]));
  for (const contributor of contributors) if (contributor.workClasses.length !== workClasses.filter(({ owner }) => owner === contributor.id).length || contributor.workClasses.some((id) => workById.get(id)?.owner !== contributor.id)) fail('PROGRESS_CONTRIBUTOR_WORK', `${contributor.id} work ownership is incomplete`);

  const dependencies = input.dependencies.map((entry, index) => normalizeDependency(entry, index, contributorById, workById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(dependencies, 'id', 'PROGRESS_DEPENDENCY_DUPLICATE', 'dependency');
  const dependencyById = new Map(dependencies.map((entry) => [entry.id, entry]));
  for (const workClass of workClasses) {
    if (workClass.readiness.dependencies.some((id) => dependencyById.get(id)?.consumer !== workClass.id)) fail('PROGRESS_READINESS_DEPENDENCY', `${workClass.id} readiness names missing/foreign dependency`);
    const owned = dependencies.filter(({ consumer }) => consumer === workClass.id);
    if (owned.length !== workClass.readiness.dependencies.length) fail('PROGRESS_READINESS_DEPENDENCY', `${workClass.id} readiness omits a dependency`);
    if (owned.length === 0 && !workClass.readiness.independentReady) fail('PROGRESS_READINESS_SOURCE', `${workClass.id} has no readiness source`);
    if (workClass.kind === 'external-control' && (!owned.some(({ producer }) => producer.kind === 'external-control') || owned.some(({ producer }) => producer.kind !== 'external-control'))) fail('PROGRESS_EXTERNAL_WORK', `${workClass.id} external-control work has invalid producer`);
    if (workClass.kind !== 'external-control' && owned.some(({ producer }) => producer.kind === 'external-control')) fail('PROGRESS_EXTERNAL_WORK', `${workClass.id} internal work depends on host control`);
    if (workClass.batch.kind === 'device-flush' && contributorById.get(workClass.owner).contract.id !== 'SPEC-0009') fail('PROGRESS_BATCH_OWNER', `${workClass.id} batch must be evaluator-owned`);
  }
  assertRequiredCycleBreakers(workClasses, dependencies);

  const fairnessClasses = input.fairnessClasses.map((entry, index) => normalizeFairness(entry, index, workById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(fairnessClasses, 'id', 'PROGRESS_FAIRNESS_DUPLICATE', 'fairness class');
  const fairnessById = new Map(fairnessClasses.map((entry) => [entry.id, entry]));
  for (const workClass of workClasses) if (!fairnessById.get(workClass.fairness)?.classes.includes(workClass.id)) fail('PROGRESS_FAIRNESS_COVERAGE', `${workClass.id} fairness class is invalid`);
  for (const fairness of fairnessClasses) for (const classId of fairness.classes) if (workById.get(classId).fairness !== fairness.id) fail('PROGRESS_FAIRNESS_COVERAGE', `${classId} appears outside its declared fairness class`);
  for (const workClass of workClasses.filter(({ kind }) => ['must-drain', 'terminal-output', 'producer-unblocking', 'resource-recovery'].includes(kind))) if (!fairnessById.get(workClass.fairness).closurePriority) fail('PROGRESS_FAIRNESS_CLOSURE', `${workClass.id} lacks closure-preserving service`);

  const noProgress = normalizeNoProgress(input.noProgress, contributorById);
  const stop = normalizeStop(input.stop);
  for (const required of stop.mustDrainKinds) if (!workClasses.some(({ kind }) => kind === required)) fail('PROGRESS_STOP_DRAIN', `stop profile has no ${required} work class`);
  const outputOwner = contributors.find(({ contract: ownerContract }) => ownerContract.id === 'SPEC-0013');
  const hasLiveOutput = resourceResult.normalized.classes.some(({ contributor, id }) => contributor === outputOwner?.id && id.endsWith('class-live-observation'));
  const closure = normalizeClosure(input.closure, workClasses, hasLiveOutput);
  const lifecycle = normalizeLifecycle(input.lifecycle);
  const statuses = input.statuses.map(normalizeStatus).sort((left, right) => compareRaw(left.code, right.code)); uniqueBy(statuses, 'code', 'PROGRESS_STATUS_DUPLICATE', 'status');
  const statusCodes = new Set(statuses.map(({ code }) => code)); for (const required of STATUS_CLASSES.keys()) if (!statusCodes.has(required)) fail('PROGRESS_STATUS_REQUIRED', `required status ${required} is absent`);
  for (const workClass of workClasses) if (!statusCodes.has(workClass.status)) fail('PROGRESS_WORK_STATUS', `${workClass.id} status is undeclared`);
  const ports = input.ports.map((entry, index) => normalizePort(entry, index, statusCodes)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(ports, 'id', 'PROGRESS_PORT_DUPLICATE', 'port');
  for (const required of PORTS) if (!ports.some(({ id }) => id === required)) fail('PROGRESS_PORT_REQUIRED', `required port ${required} is absent`);
  const requiredProgramProfiles = new Map(contributors.map(({ profile }) => [profile.id, profile])); requiredProgramProfiles.set(resourcePlan.id, resourcePlan);
  const programContribution = normalizeProgram(input.programContribution, requiredProgramProfiles);
  const productData = input.productData.map(normalizeProductData).sort((left, right) => compareRaw(left.ownerContract.id, right.ownerContract.id)); uniqueBy(productData.map((entry) => ({ id: entry.ownerContract.id })), 'id', 'PROGRESS_PRODUCT_DUPLICATE', 'product data owner');

  const normalized = {
    schema: input.schema, representation: input.representation, status: input.status, contract, id: input.id, version: input.version,
    resourcePlan, resourceContribution, contributors, workClasses, dependencies, fairnessClasses, noProgress, stop, closure, lifecycle, ports, statuses,
    diagnostics: normalizeDiagnostics(input.diagnostics), compatibility: normalizeCompatibility(input.compatibility), cleanup: normalizeCleanup(input.cleanup), programContribution, productData,
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}
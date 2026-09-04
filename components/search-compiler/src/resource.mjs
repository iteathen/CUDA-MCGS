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

const RESOURCE_SCHEMA = 'cuda-mcgs.resource-profile/0.2.0';
const REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const RESOURCE_CONTRACT = 'SPEC-0011';
const MEMORY_SPACES = ['host-admission', 'device-search', 'device-publication', 'durable'];
const ACCESS = ['read', 'write', 'atomic', 'publish'];
const LEDGER_STATES = ['claimed', 'published', 'retired-unreclaimed', 'quarantined'];
const LIFECYCLE_STATES = ['profile-normalized', 'physical-plan-admitted', 'pools-ledgers-initialized', 'active', 'draining', 'terminal', 'released'];
const EXHAUSTION_CAUSES = ['capacity', 'fragmentation-fit', 'identifier-space', 'generation-space', 'counter-width', 'provider-failure', 'policy-budget'];
const STATUS_CLASSES = new Map([
  ['invalid-resource-profile', 'fatal'], ['resource-capacity', 'pressure'], ['resource-fragmentation', 'pressure'],
  ['resource-identifier-exhausted', 'stop'], ['resource-generation-exhausted', 'stop'], ['resource-counter-exhausted', 'stop'],
  ['resource-provider-failure', 'fatal'], ['resource-pressure-high', 'pressure'], ['resource-pressure-critical', 'pressure'],
  ['resource-cancelled', 'cancellation'], ['resource-internal-failure', 'fatal'],
]);
const PORTS = [
  'normalize-contribution', 'compose-resource-plan', 'admit-engine-resources', 'reserve-resource', 'reserve-compound',
  'publish-resource-use', 'release-resource', 'retire-resource', 'reclaim-resource-accounting',
  'observe-resource-state', 'terminate-resource-profile',
];
const PORT_PHASES = new Map(PORTS.map((id) => [id,
  ['normalize-contribution', 'compose-resource-plan', 'admit-engine-resources'].includes(id)
    ? 'host-preignition'
    : (id === 'terminate-resource-profile' ? 'host-postterminal' : 'device-active'),
]));
const LIFETIME_RANK = new Map([['transaction', 0], ['work', 1], ['root', 2], ['session', 3], ['engine', 4]]);

function assertEnum(value, allowed, code, label) {
  if (!allowed.includes(value)) fail(code, `${label} is invalid`);
  return value;
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
  exactKeys(input, ['id', 'schema', 'identity'], 'RESOURCE_PROFILE_REFERENCE_FIELDS', label);
  assertNamespacedId(input.id, 'RESOURCE_PROFILE_REFERENCE_ID', `${label} id`);
  return {
    id: input.id,
    schema: normalizeSchemaReference(input.schema, `${label} schema`),
    identity: normalizeContentIdentity(input.identity, 'RESOURCE_PROFILE_REFERENCE_IDENTITY', `${label} identity`),
  };
}

function normalizeContract(input, catalogById, label) {
  if (input?.kind === 'catalog') {
    exactKeys(input, ['kind', 'id', 'specificationIdentity', 'sha256'], 'RESOURCE_CONTRACT_FIELDS', label);
    assertString(input.id, /^SPEC-[0-9]{4}$/, 'RESOURCE_CONTRACT_ID', `${label} id`);
    assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\.[0-9]+\.[0-9]+$/, 'RESOURCE_CONTRACT_ID', `${label} identity`);
    assertSha256(input.sha256, 'RESOURCE_CONTRACT_DIGEST', `${label} sha256`);
    const expected = catalogById.get(input.id);
    if (!expected || expected.specificationIdentity !== input.specificationIdentity || expected.sha256 !== input.sha256) fail('RESOURCE_CONTRACT_DRIFT', `${label} differs from frozen catalog`);
    return { ...input };
  }
  exactKeys(input, ['kind', 'id', 'version', 'schema', 'sha256'], 'RESOURCE_CONTRACT_FIELDS', label);
  if (input.kind !== 'namespaced') fail('RESOURCE_CONTRACT_KIND', `${label} kind is invalid`);
  assertNamespacedId(input.id, 'RESOURCE_CONTRACT_ID', `${label} id`);
  assertVersion(input.version, 'RESOURCE_CONTRACT_VERSION', `${label} version`);
  assertString(input.schema, /^[a-z][a-z0-9.-]+\/[0-9]+\.[0-9]+\.[0-9]+$/, 'RESOURCE_CONTRACT_SCHEMA', `${label} schema`);
  assertSha256(input.sha256, 'RESOURCE_CONTRACT_DIGEST', `${label} sha256`);
  if (!input.schema.endsWith(`/${input.version}`)) fail('RESOURCE_CONTRACT_VERSION', `${label} schema/version differ`);
  return { ...input };
}

function normalizeContributor(input, index, catalogById, knownProfiles) {
  exactKeys(input, ['id', 'contract', 'profile', 'optional', 'classes', 'responseContract', 'cleanup'], 'RESOURCE_CONTRIBUTOR_FIELDS', `contributor ${index}`);
  assertNamespacedId(input.id, 'RESOURCE_CONTRIBUTOR_ID', `contributor ${index} id`);
  if (typeof input.optional !== 'boolean') fail('RESOURCE_CONTRIBUTOR_OPTIONAL', `${input.id} optional must be boolean`);
  const contract = normalizeContract(input.contract, catalogById, `${input.id} contract`);
  const profile = normalizeProfileReference(input.profile, `${input.id} profile`);
  const known = knownProfiles.get(profile.id);
  if (known && (profile.id !== known.normalized.id || profile.schema.id !== known.normalized.schema || profile.schema.sha256 !== known.schemaSha || profile.identity.sha256 !== known.identity.sha256 || contractKey(contract) !== contractKey(known.normalized.contract))) {
    fail('RESOURCE_CONTRIBUTOR_PROFILE', `${input.id} differs from normalized owner profile`);
  }
  return {
    id: input.id, contract, profile, optional: input.optional,
    classes: namespacedSet(input.classes, 'RESOURCE_CONTRIBUTOR_CLASS', `${input.id} classes`),
    responseContract: normalizeSchemaReference(input.responseContract, `${input.id} responseContract`),
    cleanup: normalizeSchemaReference(input.cleanup, `${input.id} cleanup`),
  };
}

function normalizeFormula(input, label) {
  exactKeys(input, ['basis', 'unitsPerInstance', 'maximumInstances', 'maximumUnits'], 'RESOURCE_FORMULA_FIELDS', label);
  const unitsPerInstance = positiveDecimal(input.unitsPerInstance, 'RESOURCE_FORMULA_RANGE', `${label} unitsPerInstance`);
  const maximumInstances = positiveDecimal(input.maximumInstances, 'RESOURCE_FORMULA_RANGE', `${label} maximumInstances`);
  const maximumUnits = positiveDecimal(input.maximumUnits, 'RESOURCE_FORMULA_RANGE', `${label} maximumUnits`);
  if (BigInt(unitsPerInstance) * BigInt(maximumInstances) !== BigInt(maximumUnits)) fail('RESOURCE_FORMULA_ARITHMETIC', `${label} checked product differs from maximumUnits`);
  return {
    basis: assertEnum(input.basis, ['fixed', 'selected-object', 'concurrent-work', 'maximum-live', 'batch', 'path', 'root', 'session', 'optional-reserve', 'custom'], 'RESOURCE_FORMULA_BASIS', `${label} basis`),
    unitsPerInstance, maximumInstances, maximumUnits,
  };
}

function normalizeRange(input, label, maximumInstances) {
  exactKeys(input, ['identityMaximum', 'generationMaximum', 'counterMaximum', 'sentinelCount', 'exhaustion'], 'RESOURCE_RANGE_FIELDS', label);
  const result = {
    identityMaximum: positiveDecimal(input.identityMaximum, 'RESOURCE_IDENTITY_RANGE', `${label} identityMaximum`),
    generationMaximum: positiveDecimal(input.generationMaximum, 'RESOURCE_IDENTITY_RANGE', `${label} generationMaximum`),
    counterMaximum: positiveDecimal(input.counterMaximum, 'RESOURCE_IDENTITY_RANGE', `${label} counterMaximum`),
    sentinelCount: positiveDecimal(input.sentinelCount, 'RESOURCE_IDENTITY_RANGE', `${label} sentinelCount`),
    exhaustion: assertEnum(input.exhaustion, ['retire-incarnation', 'restart-profile', 'terminate-typed'], 'RESOURCE_IDENTITY_EXHAUSTION', `${label} exhaustion`),
  };
  if (BigInt(result.identityMaximum) < BigInt(maximumInstances) + BigInt(result.sentinelCount)) fail('RESOURCE_IDENTITY_RANGE', `${label} identity range cannot cover instances and sentinels`);
  return result;
}

function sourcePressure(resource) {
  return resource.pressureOutcome ?? resource.pressureStatus;
}

function normalizeClass(input, index, contributorById, knownProfiles) {
  exactKeys(input, ['id', 'version', 'contributor', 'consumers', 'sourceResource', 'unit', 'minimumUnits', 'formula', 'alignment', 'memorySpaces', 'access', 'scope', 'lifetime', 'admissionGroup', 'accounting', 'watermark', 'ownerPressureStatus', 'exhaustion', 'cancellation', 'cleanup', 'compatibility', 'range'], 'RESOURCE_CLASS_FIELDS', `class ${index}`);
  assertNamespacedId(input.id, 'RESOURCE_CLASS_ID', `class ${index} id`);
  assertVersion(input.version, 'RESOURCE_CLASS_VERSION', `${input.id} version`);
  const contributor = contributorById.get(input.contributor);
  if (!contributor || !contributor.classes.includes(input.id)) fail('RESOURCE_CLASS_CONTRIBUTOR', `${input.id} contributor ownership is invalid`);
  assertString(input.sourceResource, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, 'RESOURCE_CLASS_SOURCE', `${input.id} sourceResource`);
  const minimumUnits = normalizeDecimalUint(input.minimumUnits, `${input.id} minimumUnits`);
  const formula = normalizeFormula(input.formula, `${input.id} formula`);
  if (compareDecimalUint(minimumUnits, formula.maximumUnits) > 0) fail('RESOURCE_CLASS_RANGE', `${input.id} minimum exceeds maximum`);
  const unit = assertEnum(input.unit, ['bytes', 'elements', 'items', 'records', 'slots', 'references', 'leases', 'permits', 'transactions', 'work-units', 'random-inputs', 'diagnostics'], 'RESOURCE_CLASS_UNIT', `${input.id} unit`);
  const scope = assertEnum(input.scope, ['per-engine', 'per-worker', 'per-invocation'], 'RESOURCE_CLASS_SCOPE', `${input.id} scope`);
  assertNamespacedId(input.admissionGroup, 'RESOURCE_CLASS_ADMISSION', `${input.id} admissionGroup`);
  assertNamespacedId(input.watermark, 'RESOURCE_CLASS_WATERMARK', `${input.id} watermark`);
  assertString(input.ownerPressureStatus, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, 'RESOURCE_CLASS_PRESSURE', `${input.id} ownerPressureStatus`);
  const known = knownProfiles.get(contributor.profile.id);
  if (known) {
    const resource = known.normalized.resources.find(({ id }) => id === input.sourceResource);
    if (!resource || resource.unit !== unit || resource.minimum !== minimumUnits || resource.maximum !== formula.maximumUnits || resource.alignment !== input.alignment || resource.scope !== scope || sourcePressure(resource) !== input.ownerPressureStatus) {
      fail('RESOURCE_CLASS_SOURCE', `${input.id} differs from normalized owner resource`);
    }
  }
  return {
    id: input.id, version: input.version, contributor: input.contributor,
    consumers: namespacedSet(input.consumers, 'RESOURCE_CLASS_CONSUMER', `${input.id} consumers`, 1),
    sourceResource: input.sourceResource, unit, minimumUnits, formula,
    alignment: positiveDecimal(input.alignment, 'RESOURCE_CLASS_ALIGNMENT', `${input.id} alignment`),
    memorySpaces: enumSet(input.memorySpaces, MEMORY_SPACES, 'RESOURCE_CLASS_MEMORY', `${input.id} memorySpaces`, 1),
    access: enumSet(input.access, ACCESS, 'RESOURCE_CLASS_ACCESS', `${input.id} access`, 1),
    scope,
    lifetime: assertEnum(input.lifetime, ['engine', 'session', 'root', 'work', 'transaction'], 'RESOURCE_CLASS_LIFETIME', `${input.id} lifetime`),
    admissionGroup: input.admissionGroup,
    accounting: normalizeSchemaReference(input.accounting, `${input.id} accounting`),
    watermark: input.watermark,
    ownerPressureStatus: input.ownerPressureStatus,
    exhaustion: assertEnum(input.exhaustion, EXHAUSTION_CAUSES, 'RESOURCE_CLASS_EXHAUSTION', `${input.id} exhaustion`),
    cancellation: normalizeSchemaReference(input.cancellation, `${input.id} cancellation`),
    cleanup: normalizeSchemaReference(input.cleanup, `${input.id} cleanup`),
    compatibility: normalizeContentIdentity(input.compatibility, 'RESOURCE_CLASS_COMPATIBILITY', `${input.id} compatibility`),
    range: normalizeRange(input.range, `${input.id} range`, formula.maximumInstances),
  };
}

function normalizePool(input, index) {
  exactKeys(input, ['id', 'unit', 'capacity', 'alignment', 'memorySpaces', 'access', 'lifetime', 'fragmentation', 'largestGuaranteedRequest', 'providerRequirement', 'cleanup'], 'RESOURCE_POOL_FIELDS', `pool ${index}`);
  assertNamespacedId(input.id, 'RESOURCE_POOL_ID', `pool ${index} id`);
  const capacity = positiveDecimal(input.capacity, 'RESOURCE_POOL_RANGE', `${input.id} capacity`);
  const largestGuaranteedRequest = positiveDecimal(input.largestGuaranteedRequest, 'RESOURCE_POOL_RANGE', `${input.id} largestGuaranteedRequest`);
  if (compareDecimalUint(largestGuaranteedRequest, capacity) > 0) fail('RESOURCE_POOL_RANGE', `${input.id} guaranteed request exceeds capacity`);
  assertNamespacedId(input.providerRequirement, 'RESOURCE_PROVIDER_ID', `${input.id} providerRequirement`);
  return {
    id: input.id,
    unit: assertEnum(input.unit, ['bytes', 'elements', 'items', 'records', 'slots', 'references', 'leases', 'permits', 'transactions', 'work-units', 'random-inputs', 'diagnostics'], 'RESOURCE_POOL_UNIT', `${input.id} unit`),
    capacity, alignment: positiveDecimal(input.alignment, 'RESOURCE_POOL_ALIGNMENT', `${input.id} alignment`),
    memorySpaces: enumSet(input.memorySpaces, MEMORY_SPACES, 'RESOURCE_POOL_MEMORY', `${input.id} memorySpaces`, 1),
    access: enumSet(input.access, ACCESS, 'RESOURCE_POOL_ACCESS', `${input.id} access`, 1),
    lifetime: assertEnum(input.lifetime, ['engine', 'session', 'root', 'work'], 'RESOURCE_POOL_LIFETIME', `${input.id} lifetime`),
    fragmentation: normalizeSchemaReference(input.fragmentation, `${input.id} fragmentation`), largestGuaranteedRequest,
    providerRequirement: input.providerRequirement,
    cleanup: normalizeSchemaReference(input.cleanup, `${input.id} cleanup`),
  };
}

function normalizeAlias(input, label) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'RESOURCE_ALIAS_FIELDS', label);
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'group', 'proof', 'exclusiveLifetime', 'releaseOrder'], 'RESOURCE_ALIAS_FIELDS', label);
  if (input.kind !== 'proven') fail('RESOURCE_ALIAS_KIND', `${label} kind is invalid`);
  assertNamespacedId(input.group, 'RESOURCE_ALIAS_GROUP', `${label} group`);
  return {
    kind: input.kind, group: input.group,
    proof: normalizeSchemaReference(input.proof, `${label} proof`),
    exclusiveLifetime: normalizeSchemaReference(input.exclusiveLifetime, `${label} exclusiveLifetime`),
    releaseOrder: normalizeSchemaReference(input.releaseOrder, `${label} releaseOrder`),
  };
}

function normalizePartition(input, index, poolById, classById) {
  exactKeys(input, ['id', 'pool', 'class', 'offset', 'capacity', 'alignment', 'alias', 'cleanupOrder'], 'RESOURCE_PARTITION_FIELDS', `partition ${index}`);
  assertNamespacedId(input.id, 'RESOURCE_PARTITION_ID', `partition ${index} id`);
  const pool = poolById.get(input.pool);
  const resourceClass = classById.get(input.class);
  if (!pool || !resourceClass) fail('RESOURCE_PARTITION_REFERENCE', `${input.id} names unknown pool/class`);
  if (pool.unit !== resourceClass.unit) fail('RESOURCE_PARTITION_UNIT', `${input.id} pool/class units differ`);
  const offset = normalizeDecimalUint(input.offset, `${input.id} offset`);
  const capacity = positiveDecimal(input.capacity, 'RESOURCE_PARTITION_RANGE', `${input.id} capacity`);
  const alignment = positiveDecimal(input.alignment, 'RESOURCE_PARTITION_ALIGNMENT', `${input.id} alignment`);
  if (BigInt(offset) % BigInt(alignment) !== 0n || BigInt(alignment) % BigInt(resourceClass.alignment) !== 0n || BigInt(alignment) % BigInt(pool.alignment) !== 0n) fail('RESOURCE_PARTITION_ALIGNMENT', `${input.id} alignment/offset is incompatible`);
  if (BigInt(offset) + BigInt(capacity) > BigInt(pool.capacity) || compareDecimalUint(capacity, resourceClass.formula.maximumUnits) < 0) fail('RESOURCE_PARTITION_RANGE', `${input.id} range does not contain class capacity`);
  if (resourceClass.memorySpaces.some((space) => !pool.memorySpaces.includes(space)) || resourceClass.access.some((access) => !pool.access.includes(access)) || LIFETIME_RANK.get(pool.lifetime) < LIFETIME_RANK.get(resourceClass.lifetime)) fail('RESOURCE_PARTITION_COMPATIBILITY', `${input.id} pool does not satisfy class memory/access/lifetime`);
  return { id: input.id, pool: input.pool, class: input.class, offset, capacity, alignment, alias: normalizeAlias(input.alias, `${input.id} alias`), cleanupOrder: positiveDecimal(input.cleanupOrder, 'RESOURCE_PARTITION_CLEANUP', `${input.id} cleanupOrder`) };
}

function normalizeBorrow(input, label) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'RESOURCE_BORROW_FIELDS', label);
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'donorPartitions', 'safety', 'returnTrigger', 'deadlineWorkUnits', 'watermarkEffect', 'terminationReserve'], 'RESOURCE_BORROW_FIELDS', label);
  if (input.kind !== 'bounded') fail('RESOURCE_BORROW_KIND', `${label} kind is invalid`);
  return {
    kind: input.kind, donorPartitions: namespacedSet(input.donorPartitions, 'RESOURCE_BORROW_DONOR', `${label} donorPartitions`, 1),
    safety: normalizeSchemaReference(input.safety, `${label} safety`),
    returnTrigger: normalizeSchemaReference(input.returnTrigger, `${label} returnTrigger`),
    deadlineWorkUnits: positiveDecimal(input.deadlineWorkUnits, 'RESOURCE_BORROW_RANGE', `${label} deadlineWorkUnits`),
    watermarkEffect: normalizeSchemaReference(input.watermarkEffect, `${label} watermarkEffect`),
    terminationReserve: normalizeSchemaReference(input.terminationReserve, `${label} terminationReserve`),
  };
}

function normalizeReserve(input, index, classById, partitionById, contributorById) {
  exactKeys(input, ['id', 'purpose', 'class', 'partition', 'minimum', 'maximum', 'eligibleOwners', 'eligibleTransitions', 'borrow', 'release', 'priority'], 'RESOURCE_RESERVE_FIELDS', `reserve ${index}`);
  assertNamespacedId(input.id, 'RESOURCE_RESERVE_ID', `reserve ${index} id`);
  const resourceClass = classById.get(input.class);
  const partition = partitionById.get(input.partition);
  if (!resourceClass || !partition || partition.class !== resourceClass.id) fail('RESOURCE_RESERVE_REFERENCE', `${input.id} names incompatible class/partition`);
  const minimum = positiveDecimal(input.minimum, 'RESOURCE_RESERVE_RANGE', `${input.id} minimum`);
  const maximum = positiveDecimal(input.maximum, 'RESOURCE_RESERVE_RANGE', `${input.id} maximum`);
  if (compareDecimalUint(minimum, maximum) > 0 || compareDecimalUint(maximum, partition.capacity) > 0) fail('RESOURCE_RESERVE_RANGE', `${input.id} range is invalid`);
  const eligibleOwners = namespacedSet(input.eligibleOwners, 'RESOURCE_RESERVE_OWNER', `${input.id} eligibleOwners`, 1);
  if (eligibleOwners.some((owner) => !contributorById.has(owner))) fail('RESOURCE_RESERVE_OWNER', `${input.id} names an unknown eligible owner`);
  return {
    id: input.id,
    purpose: assertEnum(input.purpose, ['terminal-result', 'progress-cleanup', 'reroot-admission', 'diagnostic', 'custom'], 'RESOURCE_RESERVE_PURPOSE', `${input.id} purpose`),
    class: input.class, partition: input.partition, minimum, maximum,
    eligibleOwners,
    eligibleTransitions: namespacedSet(input.eligibleTransitions, 'RESOURCE_RESERVE_TRANSITION', `${input.id} eligibleTransitions`, 1),
    borrow: normalizeBorrow(input.borrow, `${input.id} borrow`),
    release: normalizeSchemaReference(input.release, `${input.id} release`),
    priority: positiveDecimal(input.priority, 'RESOURCE_RESERVE_PRIORITY', `${input.id} priority`),
  };
}

function normalizeAdmissionGroup(input, index, classById) {
  exactKeys(input, ['id', 'classes', 'globalOrder', 'atomicity', 'rollback', 'maxTransactions', 'provisionalLimits', 'completion', 'cancellation'], 'RESOURCE_ADMISSION_FIELDS', `admission group ${index}`);
  assertNamespacedId(input.id, 'RESOURCE_ADMISSION_ID', `admission group ${index} id`);
  const classes = namespacedSet(input.classes, 'RESOURCE_ADMISSION_CLASS', `${input.id} classes`, 1);
  for (const id of classes) if (!classById.has(id)) fail('RESOURCE_ADMISSION_CLASS', `${input.id} names unknown class ${id}`);
  if (!Array.isArray(input.globalOrder) || input.globalOrder.length === 0) fail('RESOURCE_ADMISSION_ORDER', `${input.id} globalOrder must not be empty`);
  const globalOrder = input.globalOrder.map((id, orderIndex) => {
    assertNamespacedId(id, 'RESOURCE_ADMISSION_ORDER', `${input.id} globalOrder ${orderIndex}`);
    return id;
  });
  if (new Set(globalOrder).size !== globalOrder.length) fail('RESOURCE_ADMISSION_ORDER', `${input.id} globalOrder contains a duplicate`);
  if (globalOrder.length !== classes.length || classes.some((id) => !globalOrder.includes(id))) fail('RESOURCE_ADMISSION_ORDER', `${input.id} global order does not cover classes`);
  const atomicity = assertEnum(input.atomicity, ['single-cas', 'all-or-none-transaction'], 'RESOURCE_ADMISSION_ATOMICITY', `${input.id} atomicity`);
  if ((atomicity === 'single-cas' && classes.length !== 1) || (atomicity === 'all-or-none-transaction' && classes.length < 2)) fail('RESOURCE_ADMISSION_ATOMICITY', `${input.id} atomicity/class count is invalid`);
  if (!Array.isArray(input.provisionalLimits)) fail('RESOURCE_ADMISSION_PROVISIONAL', `${input.id} provisionalLimits must be an array`);
  const provisionalLimits = input.provisionalLimits.map((entry, limitIndex) => {
    exactKeys(entry, ['class', 'maximumUnits'], 'RESOURCE_ADMISSION_PROVISIONAL_FIELDS', `${input.id} provisional limit ${limitIndex}`);
    if (!classById.has(entry.class)) fail('RESOURCE_ADMISSION_PROVISIONAL', `${input.id} provisional limit names unknown class`);
    const maximumUnits = positiveDecimal(entry.maximumUnits, 'RESOURCE_ADMISSION_RANGE', `${input.id} provisional maximumUnits`);
    if (compareDecimalUint(maximumUnits, classById.get(entry.class).formula.maximumUnits) > 0) fail('RESOURCE_ADMISSION_RANGE', `${input.id} provisional limit exceeds class maximum`);
    return { class: entry.class, maximumUnits };
  }).sort((left, right) => compareRaw(left.class, right.class));
  uniqueBy(provisionalLimits, 'class', 'RESOURCE_ADMISSION_PROVISIONAL', 'provisional limit');
  if (provisionalLimits.length !== classes.length || classes.some((id) => !provisionalLimits.some(({ class: classId }) => classId === id))) fail('RESOURCE_ADMISSION_PROVISIONAL', `${input.id} provisional limits do not cover classes`);
  return {
    id: input.id, classes, globalOrder,
    atomicity,
    rollback: normalizeSchemaReference(input.rollback, `${input.id} rollback`),
    maxTransactions: positiveDecimal(input.maxTransactions, 'RESOURCE_ADMISSION_RANGE', `${input.id} maxTransactions`),
    provisionalLimits,
    completion: normalizeSchemaReference(input.completion, `${input.id} completion`),
    cancellation: normalizeSchemaReference(input.cancellation, `${input.id} cancellation`),
  };
}

function normalizeLedger(input, index, classById) {
  exactKeys(input, ['class', 'states', 'conservation', 'leaseIdentity', 'publication', 'counterMaximum', 'highWater', 'failedAdmissions', 'releases', 'terminalDispositions'], 'RESOURCE_LEDGER_FIELDS', `ledger ${index}`);
  const resourceClass = classById.get(input.class);
  if (!resourceClass) fail('RESOURCE_LEDGER_CLASS', `ledger ${index} names unknown class`);
  if (!Array.isArray(input.states) || input.states.length !== LEDGER_STATES.length || input.states.some((state, stateIndex) => state !== LEDGER_STATES[stateIndex])) fail('RESOURCE_LEDGER_STATES', `${input.class} ledger states/order are incomplete`);
  if (input.conservation !== 'capacity-conserved-v1') fail('RESOURCE_LEDGER_CONSERVATION', `${input.class} conservation contract is invalid`);
  const counterMaximum = positiveDecimal(input.counterMaximum, 'RESOURCE_LEDGER_RANGE', `${input.class} counterMaximum`);
  if (compareDecimalUint(counterMaximum, resourceClass.range.counterMaximum) > 0) fail('RESOURCE_LEDGER_RANGE', `${input.class} counter exceeds class range`);
  return {
    class: input.class, states: [...input.states], conservation: input.conservation,
    leaseIdentity: normalizeSchemaReference(input.leaseIdentity, `${input.class} leaseIdentity`),
    publication: normalizeSchemaReference(input.publication, `${input.class} publication`), counterMaximum,
    highWater: normalizeSchemaReference(input.highWater, `${input.class} highWater`),
    failedAdmissions: normalizeSchemaReference(input.failedAdmissions, `${input.class} failedAdmissions`),
    releases: normalizeSchemaReference(input.releases, `${input.class} releases`),
    terminalDispositions: enumSet(input.terminalDispositions, ['released', 'retired-unreclaimed', 'quarantined', 'owner-equivalent'], 'RESOURCE_LEDGER_TERMINAL', `${input.class} terminalDispositions`, 4),
  };
}

function normalizeWatermark(input, index, classById, contributorById) {
  exactKeys(input, ['id', 'class', 'measured', 'comparison', 'normalUpTo', 'highAt', 'criticalAt', 'exhaustedAt', 'hysteresis', 'publication', 'responses'], 'RESOURCE_WATERMARK_FIELDS', `watermark ${index}`);
  assertNamespacedId(input.id, 'RESOURCE_WATERMARK_ID', `watermark ${index} id`);
  const resourceClass = classById.get(input.class);
  if (!resourceClass) fail('RESOURCE_WATERMARK_CLASS', `${input.id} names unknown class`);
  const normalUpTo = normalizeDecimalUint(input.normalUpTo, `${input.id} normalUpTo`);
  const highAt = normalizeDecimalUint(input.highAt, `${input.id} highAt`);
  const criticalAt = normalizeDecimalUint(input.criticalAt, `${input.id} criticalAt`);
  const exhaustedAt = normalizeDecimalUint(input.exhaustedAt, `${input.id} exhaustedAt`);
  const measured = assertEnum(input.measured, ['available', 'claimed', 'published', 'retired-unreclaimed', 'quarantined'], 'RESOURCE_WATERMARK_MEASURED', `${input.id} measured`);
  const comparison = assertEnum(input.comparison, ['used-at-least', 'available-at-most'], 'RESOURCE_WATERMARK_COMPARISON', `${input.id} comparison`);
  const maximum = resourceClass.formula.maximumUnits;
  const values = [normalUpTo, highAt, criticalAt, exhaustedAt];
  if (values.some((value) => compareDecimalUint(value, maximum) > 0)) fail('RESOURCE_WATERMARK_RANGE', `${input.id} threshold exceeds class capacity`);
  const ascending = compareDecimalUint(normalUpTo, highAt) <= 0 && compareDecimalUint(highAt, criticalAt) <= 0 && compareDecimalUint(criticalAt, exhaustedAt) <= 0;
  const descending = compareDecimalUint(normalUpTo, highAt) >= 0 && compareDecimalUint(highAt, criticalAt) >= 0 && compareDecimalUint(criticalAt, exhaustedAt) >= 0;
  if ((comparison === 'used-at-least' && (measured === 'available' || !ascending || exhaustedAt !== maximum)) || (comparison === 'available-at-most' && (measured !== 'available' || !descending))) fail('RESOURCE_WATERMARK_RANGE', `${input.id} thresholds/comparison are inconsistent`);
  if (!Array.isArray(input.responses) || input.responses.length < 3) fail('RESOURCE_WATERMARK_RESPONSE', `${input.id} responses are incomplete`);
  const responses = input.responses.map((response, responseIndex) => {
    exactKeys(response, ['state', 'owner', 'response', 'maxWorkUnits', 'reserve'], 'RESOURCE_RESPONSE_FIELDS', `${input.id} response ${responseIndex}`);
    if (!contributorById.has(response.owner)) fail('RESOURCE_RESPONSE_OWNER', `${input.id} response owner is unknown`);
    return {
      state: assertEnum(response.state, ['high', 'critical', 'exhausted'], 'RESOURCE_RESPONSE_STATE', `${input.id} response state`),
      owner: response.owner,
      response: normalizeSchemaReference(response.response, `${input.id} response`),
      maxWorkUnits: positiveDecimal(response.maxWorkUnits, 'RESOURCE_RESPONSE_RANGE', `${input.id} response maxWorkUnits`),
      reserve: response.reserve === null ? null : (assertNamespacedId(response.reserve, 'RESOURCE_RESPONSE_RESERVE', `${input.id} response reserve`), response.reserve),
    };
  }).sort((left, right) => compareRaw(`${left.state}\0${left.owner}`, `${right.state}\0${right.owner}`));
  uniqueBy(responses.map((entry) => ({ id: `${entry.state}\0${entry.owner}` })), 'id', 'RESOURCE_RESPONSE_DUPLICATE', 'watermark response');
  for (const state of ['high', 'critical', 'exhausted']) if (!responses.some((response) => response.state === state && response.owner === resourceClass.contributor)) fail('RESOURCE_RESPONSE_OWNER', `${input.id} omits ${state} response from class owner`);
  return {
    id: input.id, class: input.class,
    measured, comparison,
    normalUpTo, highAt, criticalAt, exhaustedAt,
    hysteresis: normalizeSchemaReference(input.hysteresis, `${input.id} hysteresis`),
    publication: normalizeSchemaReference(input.publication, `${input.id} publication`), responses,
  };
}

function normalizeBounds(input, label) {
  exactKeys(input, ['maxWorkUnits', 'maxReads', 'maxWrites', 'maxRandomInputs', 'cancellationObservationWorkUnits'], 'RESOURCE_BOUNDS_FIELDS', label);
  const result = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, normalizeDecimalUint(value, `${label} ${key}`)]));
  positiveDecimal(result.maxWorkUnits, 'RESOURCE_BOUNDS_WORK', `${label} maxWorkUnits`);
  positiveDecimal(result.cancellationObservationWorkUnits, 'RESOURCE_BOUNDS_CANCELLATION', `${label} cancellationObservationWorkUnits`);
  if (compareDecimalUint(result.cancellationObservationWorkUnits, result.maxWorkUnits) > 0) fail('RESOURCE_BOUNDS_CANCELLATION', `${label} cancellation exceeds work bound`);
  return result;
}

function normalizePort(input, index, statusCodes) {
  exactKeys(input, ['id', 'phase', 'contract', 'bounds', 'completion', 'statuses'], 'RESOURCE_PORT_FIELDS', `port ${index}`);
  assertEnum(input.id, PORTS, 'RESOURCE_PORT_ID', `port ${index} id`);
  const statuses = input.statuses.map((status) => {
    if (!statusCodes.has(status)) fail('RESOURCE_PORT_STATUS', `${input.id} names undeclared status ${status}`);
    return status;
  }).sort(compareRaw);
  if (new Set(statuses).size !== statuses.length || statuses.length === 0) fail('RESOURCE_PORT_STATUS', `${input.id} statuses are invalid`);
  const phase = assertEnum(input.phase, ['host-preignition', 'device-active', 'host-postterminal'], 'RESOURCE_PORT_PHASE', `${input.id} phase`);
  if (phase !== PORT_PHASES.get(input.id)) fail('RESOURCE_PORT_PHASE', `${input.id} phase is invalid`);
  return { id: input.id, phase, contract: normalizeSchemaReference(input.contract, `${input.id} contract`), bounds: normalizeBounds(input.bounds, `${input.id} bounds`), completion: assertEnum(input.completion, ['bounded', 'finite-transaction', 'must-drain'], 'RESOURCE_PORT_COMPLETION', `${input.id} completion`), statuses };
}

function normalizeStatus(input, index) {
  exactKeys(input, ['code', 'class', 'diagnostic'], 'RESOURCE_STATUS_FIELDS', `status ${index}`);
  assertString(input.code, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, 'RESOURCE_STATUS_CODE', `status ${index} code`);
  if (typeof input.diagnostic !== 'boolean') fail('RESOURCE_STATUS_DIAGNOSTIC', `${input.code} diagnostic must be boolean`);
  const statusClass = assertEnum(input.class, ['normal', 'pending', 'pressure', 'recoverable', 'stop', 'fatal', 'cancellation'], 'RESOURCE_STATUS_CLASS', `${input.code} class`);
  if (STATUS_CLASSES.has(input.code) && STATUS_CLASSES.get(input.code) !== statusClass) fail('RESOURCE_STATUS_CLASS', `${input.code} class differs from the required status contract`);
  return { code: input.code, class: statusClass, diagnostic: input.diagnostic };
}

function normalizeProviderRequirement(input, index, poolById) {
  exactKeys(input, ['id', 'pool', 'unit', 'capacity', 'alignment', 'memorySpaces', 'access', 'lifecycle', 'opaqueResult'], 'RESOURCE_PROVIDER_FIELDS', `provider requirement ${index}`);
  assertNamespacedId(input.id, 'RESOURCE_PROVIDER_ID', `provider requirement ${index} id`);
  const pool = poolById.get(input.pool);
  if (!pool || pool.providerRequirement !== input.id || input.unit !== pool.unit || input.capacity !== pool.capacity || input.alignment !== pool.alignment) fail('RESOURCE_PROVIDER_POOL', `${input.id} differs from logical pool`);
  const memorySpaces = enumSet(input.memorySpaces, MEMORY_SPACES, 'RESOURCE_PROVIDER_MEMORY', `${input.id} memorySpaces`, 1);
  const access = enumSet(input.access, ACCESS, 'RESOURCE_PROVIDER_ACCESS', `${input.id} access`, 1);
  if (memorySpaces.join('\0') !== pool.memorySpaces.join('\0') || access.join('\0') !== pool.access.join('\0')) fail('RESOURCE_PROVIDER_POOL', `${input.id} access/memory differs from pool`);
  return {
    id: input.id, pool: input.pool, unit: input.unit, capacity: input.capacity, alignment: input.alignment,
    memorySpaces, access,
    lifecycle: normalizeSchemaReference(input.lifecycle, `${input.id} lifecycle`),
    opaqueResult: normalizeContentIdentity(input.opaqueResult, 'RESOURCE_PROVIDER_RESULT', `${input.id} opaqueResult`),
  };
}

function normalizeLifecycle(input) {
  exactKeys(input, ['states', 'failure', 'quarantine', 'rollback', 'teardown', 'admissionClosedAt'], 'RESOURCE_LIFECYCLE_FIELDS', 'lifecycle');
  if (!Array.isArray(input.states) || input.states.length !== LIFECYCLE_STATES.length || input.states.some((state, index) => state !== LIFECYCLE_STATES[index])) fail('RESOURCE_LIFECYCLE_STATES', 'resource lifecycle states/order are incomplete');
  if (input.admissionClosedAt !== 'draining') fail('RESOURCE_LIFECYCLE_ADMISSION', 'resource lifecycle must close admission at draining');
  return {
    states: [...input.states],
    failure: normalizeSchemaReference(input.failure, 'lifecycle failure'), quarantine: normalizeSchemaReference(input.quarantine, 'lifecycle quarantine'),
    rollback: normalizeSchemaReference(input.rollback, 'lifecycle rollback'), teardown: normalizeSchemaReference(input.teardown, 'lifecycle teardown'), admissionClosedAt: input.admissionClosedAt,
  };
}

function normalizeExhaustion(input) {
  exactKeys(input, ['causes', 'firstCause', 'publication', 'stopComposition', 'readyOnly', 'hostGrowth', 'counterWrap', 'terminalReserve'], 'RESOURCE_EXHAUSTION_FIELDS', 'exhaustion');
  const causes = enumSet(input.causes, EXHAUSTION_CAUSES, 'RESOURCE_EXHAUSTION_CAUSE', 'exhaustion causes', EXHAUSTION_CAUSES.length);
  if (causes.length !== EXHAUSTION_CAUSES.length || input.firstCause !== 'immutable-first-terminal-cas' || input.readyOnly !== true || input.hostGrowth !== 'none' || input.counterWrap !== 'prohibited') fail('RESOURCE_EXHAUSTION_CONTRACT', 'exhaustion contract is incomplete');
  return {
    causes, firstCause: input.firstCause,
    publication: normalizeSchemaReference(input.publication, 'exhaustion publication'),
    stopComposition: normalizeSchemaReference(input.stopComposition, 'exhaustion stopComposition'),
    readyOnly: true, hostGrowth: input.hostGrowth, counterWrap: input.counterWrap, terminalReserve: input.terminalReserve,
  };
}

function normalizeDiagnostics(input) {
  exactKeys(input, ['authority', 'maxRecords', 'maxBytes', 'overflow', 'rawAddresses', 'privatePayloads'], 'RESOURCE_DIAGNOSTIC_FIELDS', 'diagnostics');
  if (input.authority !== 'non-authoritative' || input.rawAddresses !== false || input.privatePayloads !== false) fail('RESOURCE_DIAGNOSTIC_AUTHORITY', 'diagnostics must be non-authoritative, address-free and payload-free');
  return { authority: input.authority, maxRecords: positiveDecimal(input.maxRecords, 'RESOURCE_DIAGNOSTIC_RANGE', 'diagnostics maxRecords'), maxBytes: positiveDecimal(input.maxBytes, 'RESOURCE_DIAGNOSTIC_RANGE', 'diagnostics maxBytes'), overflow: assertEnum(input.overflow, ['drop', 'count', 'terminal'], 'RESOURCE_DIAGNOSTIC_OVERFLOW', 'diagnostics overflow'), rawAddresses: false, privatePayloads: false };
}

function normalizeCompatibility(input) {
  exactKeys(input, ['providerIdentityRequired', 'packageIdentityRequired', 'persistence'], 'RESOURCE_COMPAT_FIELDS', 'compatibility');
  if (input.providerIdentityRequired !== true || input.packageIdentityRequired !== true) fail('RESOURCE_COMPAT_IDENTITY', 'provider/package identities are required');
  let persistence;
  if (input.persistence?.kind === 'none') {
    exactKeys(input.persistence, ['kind'], 'RESOURCE_PERSISTENCE_FIELDS', 'persistence');
    persistence = { kind: 'none' };
  } else {
    exactKeys(input.persistence, ['kind', 'encoding', 'namespace', 'integrity', 'recovery', 'retention', 'cleanup'], 'RESOURCE_PERSISTENCE_FIELDS', 'persistence');
    if (input.persistence.kind !== 'versioned') fail('RESOURCE_PERSISTENCE_KIND', 'persistence kind is invalid');
    assertNamespacedId(input.persistence.namespace, 'RESOURCE_PERSISTENCE_NAMESPACE', 'persistence namespace');
    persistence = { kind: input.persistence.kind, namespace: input.persistence.namespace };
    for (const key of ['encoding', 'integrity', 'recovery', 'retention', 'cleanup']) persistence[key] = normalizeSchemaReference(input.persistence[key], `persistence ${key}`);
  }
  return { providerIdentityRequired: true, packageIdentityRequired: true, persistence };
}

function normalizeProgram(input, requiredProfiles) {
  exactKeys(input, ['kind', 'language', 'sourceIdentity', 'inputs', 'provenance'], 'RESOURCE_PROGRAM_FIELDS', 'programContribution');
  if (input.kind !== 'device-program' || input.language !== 'restricted-device-js') fail('RESOURCE_PROGRAM_LANGUAGE', 'resource contribution must be restricted Device-JS');
  const inputs = input.inputs.map((entry, index) => normalizeProfileReference(entry, `program input ${index}`)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(inputs, 'id', 'RESOURCE_PROGRAM_INPUT_DUPLICATE', 'program input');
  const actual = new Map(inputs.map((profile) => [profile.id, profileKey(profile)]));
  if (actual.size !== requiredProfiles.size || [...requiredProfiles].some(([id, profile]) => actual.get(id) !== profileKey(profile))) fail('RESOURCE_PROGRAM_INPUTS', 'program inputs differ from contributors');
  exactKeys(input.provenance, ['origin', 'revision', 'license', 'review'], 'RESOURCE_PROGRAM_PROVENANCE_FIELDS', 'program provenance');
  assertEnum(input.provenance.origin, ['first-party', 'third-party-reviewed'], 'RESOURCE_PROGRAM_ORIGIN', 'program provenance origin');
  assertString(input.provenance.revision, /^[0-9a-f]{40}$/, 'RESOURCE_PROGRAM_REVISION', 'program provenance revision');
  assertString(input.provenance.license, /\S/, 'RESOURCE_PROGRAM_LICENSE', 'program provenance license');
  return { kind: input.kind, language: input.language, sourceIdentity: normalizeContentIdentity(input.sourceIdentity, 'RESOURCE_PROGRAM_SOURCE', 'program sourceIdentity'), inputs, provenance: { ...input.provenance, review: normalizeSchemaReference(input.provenance.review, 'program provenance review') } };
}

function normalizeCleanup(input, selectedKinds) {
  exactKeys(input, ['kinds', 'disposition', 'quarantine', 'releaseOrder', 'retainedEvidence'], 'RESOURCE_CLEANUP_FIELDS', 'cleanup');
  const kinds = enumSet(input.kinds, ['allocation-binding', 'pool', 'partition', 'reserve', 'lease', 'transaction', 'retired-range', 'quarantined-range', 'counter', 'diagnostic', 'plan-ledger-artifact'], 'RESOURCE_CLEANUP_KIND', 'cleanup kinds', 8);
  if (kinds.length !== selectedKinds.size || [...selectedKinds].some((kind) => !kinds.includes(kind))) fail('RESOURCE_CLEANUP_COVERAGE', 'cleanup does not cover selected resource state');
  return {
    kinds,
    disposition: normalizeSchemaReference(input.disposition, 'cleanup disposition'), quarantine: normalizeSchemaReference(input.quarantine, 'cleanup quarantine'),
    releaseOrder: normalizeSchemaReference(input.releaseOrder, 'cleanup releaseOrder'), retainedEvidence: normalizeSchemaReference(input.retainedEvidence, 'cleanup retainedEvidence'),
  };
}

function normalizeProductData(input, index) {
  exactKeys(input, ['ownerContract', 'schema', 'identity'], 'RESOURCE_PRODUCT_FIELDS', `productData ${index}`);
  if (input.ownerContract?.kind !== 'namespaced') fail('RESOURCE_PRODUCT_OWNER', 'product data owner must be namespaced');
  const ownerContract = normalizeContract(input.ownerContract, new Map(), `productData ${index} ownerContract`);
  return { ownerContract, schema: normalizeSchemaReference(input.schema, `productData ${index} schema`), identity: normalizeContentIdentity(input.identity, 'RESOURCE_PRODUCT_IDENTITY', `productData ${index} identity`) };
}

export function normalizeResourceProfile(input, inspectedCatalog, profileResults = []) {
  exactKeys(input, ['schema', 'representation', 'status', 'contract', 'id', 'version', 'contributors', 'classes', 'pools', 'partitions', 'reserves', 'admissionGroups', 'ledgers', 'watermarks', 'exhaustion', 'lifecycle', 'ports', 'statuses', 'providerRequirements', 'diagnostics', 'compatibility', 'cleanup', 'programContribution', 'productData'], 'RESOURCE_ROOT_FIELDS', 'resource profile');
  if (input.schema !== RESOURCE_SCHEMA || input.representation !== REPRESENTATION || input.status !== 'accepted') fail('RESOURCE_SCHEMA', 'unsupported resource schema/representation/status');
  assertNamespacedId(input.id, 'RESOURCE_PROFILE_ID', 'resource profile id');
  assertVersion(input.version, 'RESOURCE_PROFILE_VERSION', 'resource profile version');
  const contracts = inspectedCatalog?.contractSet?.contracts;
  if (!contracts) fail('RESOURCE_CATALOG', 'inspected catalog is required');
  const catalogById = new Map(contracts.map((contract) => [contract.id, contract]));
  const contract = normalizeContract(input.contract, catalogById, 'resource contract');
  if (contract.id !== RESOURCE_CONTRACT) fail('RESOURCE_CONTRACT_ID', `resource contract must select ${RESOURCE_CONTRACT}`);
  const knownProfiles = new Map(profileResults.map((result) => [result.normalized.id, result]));

  if (!Array.isArray(input.contributors) || input.contributors.length < 3) fail('RESOURCE_CONTRIBUTOR_COUNT', 'contributors are incomplete');
  const contributors = input.contributors.map((entry, index) => normalizeContributor(entry, index, catalogById, knownProfiles)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(contributors, 'id', 'RESOURCE_CONTRIBUTOR_DUPLICATE', 'contributor');
  uniqueBy(contributors.map(({ profile }) => ({ id: profile.id })), 'id', 'RESOURCE_CONTRIBUTOR_PROFILE_DUPLICATE', 'contributor profile');
  const contributorById = new Map(contributors.map((entry) => [entry.id, entry]));

  if (!Array.isArray(input.classes) || input.classes.length === 0) fail('RESOURCE_CLASS_COUNT', 'classes must not be empty');
  const classes = input.classes.map((entry, index) => normalizeClass(entry, index, contributorById, knownProfiles)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(classes, 'id', 'RESOURCE_CLASS_DUPLICATE', 'resource class');
  const classById = new Map(classes.map((entry) => [entry.id, entry]));
  for (const contributor of contributors) if (contributor.classes.length !== classes.filter(({ contributor: id }) => id === contributor.id).length) fail('RESOURCE_CONTRIBUTOR_CLASS', `${contributor.id} class ownership is incomplete`);
  for (const contributor of contributors) {
    const known = knownProfiles.get(contributor.profile.id);
    if (!known) continue;
    const selected = classes.filter(({ contributor: id }) => id === contributor.id);
    const nonzero = known.normalized.resources.filter(({ maximum }) => maximum !== '0');
    if (new Set(selected.map(({ sourceResource }) => sourceResource)).size !== selected.length || selected.length !== nonzero.length || nonzero.some(({ id }) => !selected.some(({ sourceResource }) => sourceResource === id))) fail('RESOURCE_CLASS_SOURCE', `${contributor.id} does not cover every nonzero normalized owner resource exactly once`);
  }

  const pools = input.pools.map(normalizePool).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(pools, 'id', 'RESOURCE_POOL_DUPLICATE', 'pool');
  const poolById = new Map(pools.map((entry) => [entry.id, entry]));
  const partitions = input.partitions.map((entry, index) => normalizePartition(entry, index, poolById, classById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(partitions, 'id', 'RESOURCE_PARTITION_DUPLICATE', 'partition');
  uniqueBy(partitions, 'class', 'RESOURCE_PARTITION_CLASS_DUPLICATE', 'partition class');
  if (partitions.length !== classes.length) fail('RESOURCE_PARTITION_COVERAGE', 'every class requires one partition');
  if (pools.some((pool) => !partitions.some(({ pool: poolId }) => poolId === pool.id))) fail('RESOURCE_POOL_COVERAGE', 'every pool requires at least one partition');
  const partitionById = new Map(partitions.map((entry) => [entry.id, entry]));
  for (let leftIndex = 0; leftIndex < partitions.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < partitions.length; rightIndex += 1) {
      const left = partitions[leftIndex]; const right = partitions[rightIndex];
      if (left.pool !== right.pool) continue;
      const overlap = BigInt(left.offset) < BigInt(right.offset) + BigInt(right.capacity) && BigInt(right.offset) < BigInt(left.offset) + BigInt(left.capacity);
      if (left.cleanupOrder === right.cleanupOrder) fail('RESOURCE_PARTITION_CLEANUP', `${left.id} and ${right.id} have ambiguous cleanup order`);
      if (overlap && (left.alias.kind !== 'proven' || right.alias.kind !== 'proven' || left.alias.group !== right.alias.group || schemaKey(left.alias.proof) !== schemaKey(right.alias.proof) || schemaKey(left.alias.exclusiveLifetime) !== schemaKey(right.alias.exclusiveLifetime) || schemaKey(left.alias.releaseOrder) !== schemaKey(right.alias.releaseOrder))) fail('RESOURCE_PARTITION_OVERLAP', `${left.id} and ${right.id} overlap without one complete alias proof`);
    }
  }

  const reserves = input.reserves.map((entry, index) => normalizeReserve(entry, index, classById, partitionById, contributorById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(reserves, 'id', 'RESOURCE_RESERVE_DUPLICATE', 'reserve');
  for (const purpose of ['terminal-result', 'progress-cleanup']) if (!reserves.some((reserve) => reserve.purpose === purpose)) fail('RESOURCE_RESERVE_REQUIRED', `required ${purpose} reserve is absent`);
  const reserveOwners = new Map([['terminal-result', 'SPEC-0013'], ['progress-cleanup', 'SPEC-0012'], ['reroot-admission', 'SPEC-0006']]);
  for (const [purpose, contractId] of reserveOwners) {
    const selectedOwner = contributors.find(({ contract: ownerContract }) => ownerContract.id === contractId);
    const selectedReserve = reserves.find((reserve) => reserve.purpose === purpose);
    if (selectedReserve && (!selectedOwner || classById.get(selectedReserve.class).contributor !== selectedOwner.id || !selectedReserve.eligibleOwners.includes(selectedOwner.id))) fail('RESOURCE_RESERVE_OWNER', `${purpose} reserve owner is invalid`);
    if (selectedReserve && (selectedReserve.borrow.kind !== 'none' || selectedReserve.minimum !== classById.get(selectedReserve.class).formula.maximumUnits || selectedReserve.maximum !== classById.get(selectedReserve.class).formula.maximumUnits)) fail('RESOURCE_RESERVE_PROTECTION', `${purpose} reserve is not fully protected`);
  }
  const reserveById = new Map(reserves.map((entry) => [entry.id, entry]));
  for (const reserve of reserves) if (reserve.borrow.kind === 'bounded') {
    const targetClass = classById.get(reserve.class);
    for (const id of reserve.borrow.donorPartitions) {
      const donor = partitionById.get(id);
      const donorPool = donor && poolById.get(donor.pool);
      if (!donor || id === reserve.partition || donorPool.unit !== targetClass.unit || targetClass.memorySpaces.some((space) => !donorPool.memorySpaces.includes(space)) || targetClass.access.some((access) => !donorPool.access.includes(access)) || LIFETIME_RANK.get(donorPool.lifetime) < LIFETIME_RANK.get(targetClass.lifetime)) fail('RESOURCE_BORROW_DONOR', `${reserve.id} names an unknown, self or incompatible donor partition`);
    }
  }
  for (const partition of partitions) {
    const total = reserves.filter(({ partition: id }) => id === partition.id).reduce((sum, reserve) => sum + BigInt(reserve.maximum), 0n);
    if (total > BigInt(partition.capacity)) fail('RESOURCE_RESERVE_RANGE', `${partition.id} reserves exceed capacity`);
  }

  const admissionGroups = input.admissionGroups.map((entry, index) => normalizeAdmissionGroup(entry, index, classById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(admissionGroups, 'id', 'RESOURCE_ADMISSION_DUPLICATE', 'admission group');
  const admissionById = new Map(admissionGroups.map((entry) => [entry.id, entry]));
  for (const resourceClass of classes) if (!admissionById.get(resourceClass.admissionGroup)?.classes.includes(resourceClass.id)) fail('RESOURCE_ADMISSION_COVERAGE', `${resourceClass.id} admission group is invalid`);
  for (const group of admissionGroups) for (const classId of group.classes) if (classById.get(classId).admissionGroup !== group.id) fail('RESOURCE_ADMISSION_COVERAGE', `${classId} appears outside its declared admission group`);

  const ledgers = input.ledgers.map((entry, index) => normalizeLedger(entry, index, classById)).sort((left, right) => compareRaw(left.class, right.class));
  uniqueBy(ledgers, 'class', 'RESOURCE_LEDGER_DUPLICATE', 'ledger');
  if (ledgers.length !== classes.length) fail('RESOURCE_LEDGER_COVERAGE', 'every class requires one ledger');
  const watermarks = input.watermarks.map((entry, index) => normalizeWatermark(entry, index, classById, contributorById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(watermarks, 'id', 'RESOURCE_WATERMARK_DUPLICATE', 'watermark');
  uniqueBy(watermarks, 'class', 'RESOURCE_WATERMARK_CLASS_DUPLICATE', 'watermark class');
  if (watermarks.length !== classes.length || classes.some((entry) => !watermarks.some(({ id }) => id === entry.watermark))) fail('RESOURCE_WATERMARK_COVERAGE', 'every class requires its declared watermark');
  for (const watermark of watermarks) for (const response of watermark.responses) if (response.reserve && (!reserveById.has(response.reserve) || !reserveById.get(response.reserve).eligibleOwners.includes(response.owner))) fail('RESOURCE_RESPONSE_RESERVE', `${watermark.id} response reserve is absent or not eligible for its owner`);

  const exhaustion = normalizeExhaustion(input.exhaustion);
  const terminalReserve = reserves.find(({ purpose }) => purpose === 'terminal-result');
  if (exhaustion.terminalReserve !== terminalReserve.id) fail('RESOURCE_EXHAUSTION_RESERVE', 'exhaustion terminal reserve differs from plan');
  const lifecycle = normalizeLifecycle(input.lifecycle);
  const statuses = input.statuses.map(normalizeStatus).sort((left, right) => compareRaw(left.code, right.code));
  uniqueBy(statuses, 'code', 'RESOURCE_STATUS_DUPLICATE', 'status');
  const statusCodes = new Set(statuses.map(({ code }) => code));
  for (const required of STATUS_CLASSES.keys()) if (!statusCodes.has(required)) fail('RESOURCE_STATUS_REQUIRED', `required status ${required} is absent`);
  const ports = input.ports.map((entry, index) => normalizePort(entry, index, statusCodes)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(ports, 'id', 'RESOURCE_PORT_DUPLICATE', 'port');
  for (const required of PORTS) if (!ports.some(({ id }) => id === required)) fail('RESOURCE_PORT_REQUIRED', `required port ${required} is absent`);

  const providerRequirements = input.providerRequirements.map((entry, index) => normalizeProviderRequirement(entry, index, poolById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(providerRequirements, 'id', 'RESOURCE_PROVIDER_DUPLICATE', 'provider requirement');
  uniqueBy(providerRequirements, 'pool', 'RESOURCE_PROVIDER_POOL_DUPLICATE', 'provider pool');
  if (providerRequirements.length !== pools.length) fail('RESOURCE_PROVIDER_COVERAGE', 'every pool requires one provider projection');
  const expectedCleanupKinds = new Set(['allocation-binding', 'pool', 'partition', 'reserve', 'lease', 'transaction', 'retired-range', 'quarantined-range', 'counter', 'diagnostic', 'plan-ledger-artifact']);
  const cleanup = normalizeCleanup(input.cleanup, expectedCleanupKinds);
  const requiredProgramProfiles = new Map(contributors.map(({ profile }) => [profile.id, profile]));
  const programContribution = normalizeProgram(input.programContribution, requiredProgramProfiles);
  const productData = input.productData.map(normalizeProductData).sort((left, right) => compareRaw(left.ownerContract.id, right.ownerContract.id));
  uniqueBy(productData.map((entry) => ({ id: entry.ownerContract.id })), 'id', 'RESOURCE_PRODUCT_DUPLICATE', 'product data owner');

  const normalized = {
    schema: input.schema, representation: input.representation, status: input.status, contract,
    id: input.id, version: input.version, contributors, classes, pools, partitions, reserves, admissionGroups, ledgers, watermarks,
    exhaustion, lifecycle, ports, statuses, providerRequirements,
    diagnostics: normalizeDiagnostics(input.diagnostics), compatibility: normalizeCompatibility(input.compatibility), cleanup, programContribution, productData,
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}

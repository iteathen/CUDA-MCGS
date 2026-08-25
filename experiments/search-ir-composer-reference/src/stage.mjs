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

const STAGE_SCHEMA = 'cuda-mcgs.stage-profile/0.2.0';
const REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const STAGE_CONTRACT = 'SPEC-0003';
const CHECKPOINTS = ['entry', 'exit'];
const COUNTER_KINDS = ['work-item-generation', 'stage-transition', 'capability-invocation'];
const LIFECYCLE_STATES = ['profile-normalized', 'resources-admitted', 'composed', 'active', 'draining', 'terminal', 'released'];
const BASE_CLEANUP_KINDS = ['stage-item', 'surface-context', 'capability-contribution', 'permission', 'counter', 'source-owner-lease', 'diagnostic', 'program-artifact'];
const CHANNEL_CLEANUP_KIND = 'channel-binding';
const BASE_PUBLIC_REQUIREMENTS = ['cuda-js.device-js/0.1.0', 'cuda-js.operation-lifecycle/0.1.0'];
const STATUS_CLASSES = new Map([
  ['extension-work-complete', 'normal'], ['extension-pending', 'pending'], ['extension-pressure', 'pressure'],
  ['extension-cancelled', 'cancellation'], ['extension-stale', 'stop'], ['extension-failed', 'fatal'],
]);

function assertEnum(value, allowed, code, label) {
  if (!allowed.includes(value)) fail(code, `${label} is invalid`);
  return value;
}

function positiveDecimal(value, code, label) {
  const normalized = normalizeDecimalUint(value, label);
  if (normalized === '0') fail(code, `${label} must be positive`);
  return normalized;
}

function schemaKey(reference) { return `${reference.id}\0${reference.version}\0${reference.sha256}`; }
function profileKey(profile) { return `${profile.id}\0${schemaKey(profile.schema)}\0${profile.identity.sha256}`; }
function contractKey(contract) {
  return contract.kind === 'catalog'
    ? `${contract.kind}\0${contract.id}\0${contract.specificationIdentity}\0${contract.sha256}`
    : `${contract.kind}\0${contract.id}\0${contract.version}\0${contract.schema}\0${contract.sha256}`;
}

function normalizeProfileReference(input, label) {
  exactKeys(input, ['id', 'schema', 'identity'], 'EXT_PROFILE_REFERENCE_FIELDS', label);
  assertNamespacedId(input.id, 'EXT_PROFILE_REFERENCE_ID', `${label} id`);
  return {
    id: input.id,
    schema: normalizeSchemaReference(input.schema, `${label} schema`),
    identity: normalizeContentIdentity(input.identity, 'EXT_PROFILE_REFERENCE_IDENTITY', `${label} identity`),
  };
}

function normalizeContract(input, catalogById, label) {
  if (input?.kind === 'catalog') {
    exactKeys(input, ['kind', 'id', 'specificationIdentity', 'sha256'], 'EXT_CONTRACT_FIELDS', label);
    assertString(input.id, /^SPEC-[0-9]{4}$/, 'EXT_CONTRACT_ID', `${label} id`);
    assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\.[0-9]+\.[0-9]+-draft$/, 'EXT_CONTRACT_ID', `${label} specificationIdentity`);
    assertSha256(input.sha256, 'EXT_CONTRACT_DIGEST', `${label} sha256`);
    const expected = catalogById.get(input.id);
    if (!expected || expected.specificationIdentity !== input.specificationIdentity || expected.sha256 !== input.sha256) fail('EXT_CONTRACT_DRIFT', `${label} differs from frozen catalog`);
    return { ...input };
  }
  exactKeys(input, ['kind', 'id', 'version', 'schema', 'sha256'], 'EXT_CONTRACT_FIELDS', label);
  if (input.kind !== 'namespaced') fail('EXT_CONTRACT_KIND', `${label} kind is invalid`);
  assertNamespacedId(input.id, 'EXT_CONTRACT_ID', `${label} id`);
  assertVersion(input.version, 'EXT_CONTRACT_VERSION', `${label} version`);
  assertString(input.schema, /^[a-z][a-z0-9.-]+\/[0-9]+\.[0-9]+\.[0-9]+$/, 'EXT_CONTRACT_SCHEMA', `${label} schema`);
  assertSha256(input.sha256, 'EXT_CONTRACT_DIGEST', `${label} sha256`);
  if (!input.schema.endsWith(`/${input.version}`)) fail('EXT_CONTRACT_VERSION', `${label} schema/version differ`);
  return { ...input };
}

function normalizeBounds(input, label) {
  exactKeys(input, ['maxItems', 'maxTransitions', 'maxWorkUnits', 'maxReads', 'maxWrites', 'maxScratchBytes', 'maxPublications', 'cancellationObservationWorkUnits'], 'EXT_BOUNDS_FIELDS', label);
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, positiveDecimal(value, 'EXT_BOUNDS_RANGE', `${label} ${key}`)]));
}

function normalizeOwner(input, index, catalogById, contributorById, stageOwnerId) {
  exactKeys(input, ['id', 'role', 'contract', 'profile', 'ports', 'cleanup'], 'EXT_OWNER_FIELDS', `owner ${index}`);
  assertNamespacedId(input.id, 'EXT_OWNER_ID', `owner ${index} id`);
  const expected = contributorById.get(input.id);
  if (!expected) fail('EXT_OWNER_COVERAGE', `${input.id} is not a selected progress contributor`);
  const contract = normalizeContract(input.contract, catalogById, `${input.id} contract`);
  const profile = normalizeProfileReference(input.profile, `${input.id} profile`);
  if (contractKey(contract) !== contractKey(expected.contract) || profileKey(profile) !== profileKey(expected.profile)) fail('EXT_OWNER_PROFILE', `${input.id} differs from selected contributor`);
  const role = assertEnum(input.role, ['coordinator', 'source'], 'EXT_OWNER_ROLE', `${input.id} role`);
  if ((input.id === stageOwnerId) !== (role === 'coordinator')) fail('EXT_OWNER_ROLE', `${input.id} coordinator role is invalid`);
  if (!Array.isArray(input.ports)) fail('EXT_OWNER_PORTS', `${input.id} ports must be an array`);
  const ports = input.ports.map((entry, portIndex) => normalizeSchemaReference(entry, `${input.id} port ${portIndex}`)).sort((left, right) => compareRaw(schemaKey(left), schemaKey(right)));
  if (new Set(ports.map(schemaKey)).size !== ports.length) fail('EXT_OWNER_PORTS', `${input.id} ports contain a duplicate`);
  return { id: input.id, role, contract, profile, ports, cleanup: normalizeSchemaReference(input.cleanup, `${input.id} cleanup`) };
}

function normalizePermission(input, index, ownerById) {
  exactKeys(input, ['id', 'surface', 'capability', 'sourceOwner', 'sourcePort', 'access', 'scope', 'lifetime', 'maximumUses'], 'EXT_PERMISSION_FIELDS', `permission ${index}`);
  assertNamespacedId(input.id, 'EXT_PERMISSION_ID', `permission ${index} id`);
  for (const [key, code] of [['surface', 'EXT_PERMISSION_SURFACE'], ['capability', 'EXT_PERMISSION_CAPABILITY'], ['sourceOwner', 'EXT_PERMISSION_OWNER']]) assertNamespacedId(input[key], code, `${input.id} ${key}`);
  const owner = ownerById.get(input.sourceOwner);
  if (!owner || owner.role !== 'source') fail('EXT_PERMISSION_OWNER', `${input.id} names invalid source owner`);
  const sourcePort = normalizeSchemaReference(input.sourcePort, `${input.id} sourcePort`);
  if (!owner.ports.some((entry) => schemaKey(entry) === schemaKey(sourcePort))) fail('EXT_PERMISSION_PORT', `${input.id} names an undeclared source-owner port`);
  return {
    id: input.id, surface: input.surface, capability: input.capability, sourceOwner: input.sourceOwner, sourcePort,
    access: assertEnum(input.access, ['read', 'write-port', 'control-port'], 'EXT_PERMISSION_ACCESS', `${input.id} access`),
    scope: assertEnum(input.scope, ['invocation', 'work-item'], 'EXT_PERMISSION_SCOPE', `${input.id} scope`),
    lifetime: assertEnum(input.lifetime, ['checkpoint'], 'EXT_PERMISSION_LIFETIME', `${input.id} lifetime`),
    maximumUses: positiveDecimal(input.maximumUses, 'EXT_PERMISSION_RANGE', `${input.id} maximumUses`),
  };
}

function normalizeCounter(input, index) {
  exactKeys(input, ['id', 'kind', 'maximum', 'reserved', 'exhaustionThreshold', 'rollover', 'exhaustionOutcome', 'staleAliasProhibited'], 'EXT_COUNTER_FIELDS', `counter ${index}`);
  assertNamespacedId(input.id, 'EXT_COUNTER_ID', `counter ${index} id`);
  const kind = assertEnum(input.kind, COUNTER_KINDS, 'EXT_COUNTER_KIND', `${input.id} kind`);
  const maximum = positiveDecimal(input.maximum, 'EXT_COUNTER_RANGE', `${input.id} maximum`);
  const reserved = normalizeDecimalUint(input.reserved, `${input.id} reserved`);
  const exhaustionThreshold = positiveDecimal(input.exhaustionThreshold, 'EXT_COUNTER_RANGE', `${input.id} exhaustionThreshold`);
  if (compareDecimalUint(reserved, exhaustionThreshold) >= 0 || compareDecimalUint(exhaustionThreshold, maximum) > 0 || input.rollover !== 'prohibited' || input.staleAliasProhibited !== true) fail('EXT_COUNTER_RANGE', `${input.id} can wrap or alias stale state`);
  return { id: input.id, kind, maximum, reserved, exhaustionThreshold, rollover: input.rollover, exhaustionOutcome: input.exhaustionOutcome, staleAliasProhibited: true };
}

function normalizeStageOutcome(input, index, ownerById) {
  exactKeys(input, ['code', 'kind', 'target', 'sourceOwner', 'publication', 'workerReleased', 'mutableLeaseReleased'], 'EXT_STAGE_OUTCOME_FIELDS', `stage outcome ${index}`);
  assertString(input.code, /^[a-z][a-z0-9-]*$/, 'EXT_STAGE_OUTCOME_CODE', `stage outcome ${index} code`);
  const kind = assertEnum(input.kind, ['transition', 'pending', 'retry', 'pressure', 'cancellation', 'terminal', 'failure'], 'EXT_STAGE_OUTCOME_KIND', `${input.code} kind`);
  const target = input.target === null ? null : (assertNamespacedId(input.target, 'EXT_STAGE_OUTCOME_TARGET', `${input.code} target`), input.target);
  if ((kind === 'transition' || kind === 'pending' || kind === 'retry') !== (target !== null)) fail('EXT_STAGE_OUTCOME_TARGET', `${input.code} target differs from outcome kind`);
  if (!ownerById.has(input.sourceOwner)) fail('EXT_STAGE_OUTCOME_OWNER', `${input.code} names unknown source owner`);
  if (input.workerReleased !== true || input.mutableLeaseReleased !== true) fail('EXT_STAGE_OUTCOME_RELEASE', `${input.code} retains worker or mutable lease`);
  return { code: input.code, kind, target, sourceOwner: input.sourceOwner, publication: normalizeSchemaReference(input.publication, `${input.code} publication`), workerReleased: true, mutableLeaseReleased: true };
}

function normalizeStage(input, index, stageOwner, workById, stageClassIds, counterByKind, ownerById) {
  exactKeys(input, ['id', 'version', 'purpose', 'invariant', 'workItem', 'transitionCounter', 'entry', 'execution', 'outcomes', 'checkpoints', 'resourceClasses', 'bounds', 'cancellation', 'failure', 'cleanup'], 'EXT_STAGE_FIELDS', `stage ${index}`);
  assertNamespacedId(input.id, 'EXT_STAGE_ID', `stage ${index} id`); assertVersion(input.version, 'EXT_STAGE_VERSION', `${input.id} version`);
  assertString(input.purpose, /\S/, 'EXT_STAGE_PURPOSE', `${input.id} purpose`); assertString(input.invariant, /\S/, 'EXT_STAGE_INVARIANT', `${input.id} invariant`);
  exactKeys(input.workItem, ['kind', 'identity', 'generationCounter', 'scope'], 'EXT_WORK_ITEM_FIELDS', `${input.id} workItem`);
  assertNamespacedId(input.workItem.kind, 'EXT_WORK_ITEM_KIND', `${input.id} workItem kind`);
  if (input.workItem.generationCounter !== counterByKind.get('work-item-generation')?.id) fail('EXT_WORK_ITEM_COUNTER', `${input.id} work-item counter is invalid`);
  if (input.transitionCounter !== counterByKind.get('stage-transition')?.id) fail('EXT_STAGE_COUNTER', `${input.id} transition counter is invalid`);
  exactKeys(input.entry, ['predicate', 'sourceOwner', 'publication', 'workClass'], 'EXT_STAGE_ENTRY_FIELDS', `${input.id} entry`);
  const workClass = workById.get(input.entry.workClass);
  if (!workClass || workClass.owner !== stageOwner.id || !ownerById.has(input.entry.sourceOwner)) fail('EXT_STAGE_WORK', `${input.id} entry work/source owner is invalid`);
  exactKeys(input.execution, ['scope', 'globalBarrier', 'kernelPerStage', 'physicalTopology'], 'EXT_EXECUTION_FIELDS', `${input.id} execution`);
  if (input.execution.scope !== 'per-work-item' || input.execution.globalBarrier !== false || input.execution.kernelPerStage !== false || input.execution.physicalTopology !== 'unspecified') fail('EXT_STAGE_EXECUTION', `${input.id} imposes physical topology`);
  const outcomes = input.outcomes.map((entry, outcomeIndex) => normalizeStageOutcome(entry, outcomeIndex, ownerById)).sort((left, right) => compareRaw(left.code, right.code));
  uniqueBy(outcomes, 'code', 'EXT_STAGE_OUTCOME_DUPLICATE', `${input.id} outcome`);
  if (!outcomes.some(({ kind }) => ['terminal', 'failure', 'cancellation'].includes(kind))) fail('EXT_STAGE_TERMINAL', `${input.id} lacks a terminal disposition`);
  const checkpoints = [...input.checkpoints].sort(compareRaw);
  if (checkpoints.length === 0 || new Set(checkpoints).size !== checkpoints.length || checkpoints.some((entry) => !CHECKPOINTS.includes(entry))) fail('EXT_STAGE_CHECKPOINT', `${input.id} checkpoints are invalid`);
  const resourceClasses = [...input.resourceClasses].sort(compareRaw);
  if (resourceClasses.length === 0 || new Set(resourceClasses).size !== resourceClasses.length || resourceClasses.some((id) => !stageClassIds.has(id))) fail('EXT_STAGE_RESOURCE', `${input.id} resource classes are not stage-owned`);
  return {
    id: input.id, version: input.version, purpose: input.purpose, invariant: input.invariant,
    workItem: { kind: input.workItem.kind, identity: normalizeSchemaReference(input.workItem.identity, `${input.id} workItem identity`), generationCounter: input.workItem.generationCounter, scope: assertEnum(input.workItem.scope, ['engine', 'session', 'root-epoch'], 'EXT_WORK_ITEM_SCOPE', `${input.id} workItem scope`) }, transitionCounter: input.transitionCounter,
    entry: { predicate: normalizeSchemaReference(input.entry.predicate, `${input.id} entry predicate`), sourceOwner: input.entry.sourceOwner, publication: normalizeSchemaReference(input.entry.publication, `${input.id} entry publication`), workClass: input.entry.workClass },
    execution: { scope: input.execution.scope, globalBarrier: false, kernelPerStage: false, physicalTopology: input.execution.physicalTopology }, outcomes, checkpoints, resourceClasses, bounds: normalizeBounds(input.bounds, `${input.id} bounds`),
    cancellation: normalizeSchemaReference(input.cancellation, `${input.id} cancellation`), failure: normalizeSchemaReference(input.failure, `${input.id} failure`), cleanup: normalizeSchemaReference(input.cleanup, `${input.id} cleanup`),
  };
}

function normalizeContextField(input, index, permissionById, ownerById, label, permissionIds) {
  exactKeys(input, ['id', 'sourceOwner', 'sourcePort', 'schema', 'access', 'immutable', 'lifetime', 'generation', 'offsetBytes', 'sizeBytes', 'alignment', 'alias'], 'EXT_CONTEXT_FIELDS', `${label} context ${index}`);
  assertNamespacedId(input.id, 'EXT_CONTEXT_ID', `${label} context ${index} id`);
  const sourcePort = normalizeSchemaReference(input.sourcePort, `${input.id} sourcePort`);
  const permission = permissionIds.map((id) => permissionById.get(id)).find((entry) => entry?.sourceOwner === input.sourceOwner && schemaKey(entry.sourcePort) === schemaKey(sourcePort) && entry.access === input.access);
  if (!permission || !ownerById.has(input.sourceOwner)) fail('EXT_CONTEXT_PERMISSION', `${input.id} context authority lacks a compatible selected permission`);
  const access = assertEnum(input.access, ['read', 'write-port', 'control-port'], 'EXT_CONTEXT_ACCESS', `${input.id} access`);
  if ((access === 'read') !== (input.immutable === true) || input.lifetime !== 'checkpoint' || input.alias !== 'none') fail('EXT_CONTEXT_LIFETIME', `${input.id} context mutability/lifetime is invalid`);
  return {
    id: input.id, sourceOwner: input.sourceOwner, sourcePort, schema: normalizeSchemaReference(input.schema, `${input.id} schema`), access,
    immutable: input.immutable, lifetime: input.lifetime, generation: normalizeSchemaReference(input.generation, `${input.id} generation`),
    offsetBytes: normalizeDecimalUint(input.offsetBytes, `${input.id} offsetBytes`), sizeBytes: positiveDecimal(input.sizeBytes, 'EXT_CONTEXT_RANGE', `${input.id} sizeBytes`), alignment: positiveDecimal(input.alignment, 'EXT_CONTEXT_RANGE', `${input.id} alignment`), alias: input.alias,
  };
}

function normalizeSurface(input, index, stageById, permissionById, ownerById) {
  exactKeys(input, ['id', 'version', 'stage', 'checkpoint', 'purpose', 'invocation', 'baseContext', 'permissions', 'ordering', 'publication', 'bounds', 'outcomes', 'failure', 'skip', 'cancellation', 'hostProgress', 'midStage', 'cleanup'], 'EXT_SURFACE_FIELDS', `surface ${index}`);
  assertNamespacedId(input.id, 'EXT_SURFACE_ID', `surface ${index} id`); assertVersion(input.version, 'EXT_SURFACE_VERSION', `${input.id} version`);
  assertString(input.purpose, /\S/, 'EXT_SURFACE_PURPOSE', `${input.id} purpose`);
  const stage = stageById.get(input.stage);
  if (!stage || !stage.checkpoints.includes(input.checkpoint) || !CHECKPOINTS.includes(input.checkpoint)) fail('EXT_SURFACE_CHECKPOINT', `${input.id} does not name a stable selected checkpoint`);
  exactKeys(input.invocation, ['scope', 'cardinality'], 'EXT_INVOCATION_FIELDS', `${input.id} invocation`);
  const permissions = [...input.permissions].sort(compareRaw);
  if (new Set(permissions).size !== permissions.length || permissions.some((id) => permissionById.get(id)?.surface !== input.id)) fail('EXT_SURFACE_PERMISSION', `${input.id} permissions are incomplete`);
  const bounds = normalizeBounds(input.bounds, `${input.id} bounds`);
  const baseContext = input.baseContext.map((entry, fieldIndex) => normalizeContextField(entry, fieldIndex, permissionById, ownerById, input.id, permissions)).sort((left, right) => compareDecimalUint(left.offsetBytes, right.offsetBytes) || compareRaw(left.id, right.id));
  uniqueBy(baseContext, 'id', 'EXT_CONTEXT_DUPLICATE', `${input.id} context`);
  for (const field of baseContext) if (BigInt(field.offsetBytes) % BigInt(field.alignment) !== 0n || BigInt(field.offsetBytes) + BigInt(field.sizeBytes) > BigInt(bounds.maxScratchBytes)) fail('EXT_CONTEXT_RANGE', `${field.id} context layout exceeds its aligned surface bounds`);
  for (let fieldIndex = 1; fieldIndex < baseContext.length; fieldIndex += 1) if (BigInt(baseContext[fieldIndex].offsetBytes) < BigInt(baseContext[fieldIndex - 1].offsetBytes) + BigInt(baseContext[fieldIndex - 1].sizeBytes)) fail('EXT_CONTEXT_OVERLAP', `${input.id} context fields overlap`);
  if (input.ordering !== 'deterministic-selected-order' || input.hostProgress !== 'none' || input.midStage !== false) fail('EXT_SURFACE_CONTRACT', `${input.id} surface boundary is incomplete`);
  const outcomes = [...input.outcomes].sort(compareRaw);
  if (outcomes.length === 0 || new Set(outcomes).size !== outcomes.length || outcomes.some((code) => !stage.outcomes.some((entry) => entry.code === code))) fail('EXT_SURFACE_OUTCOME', `${input.id} outcomes differ from stage`);
  return {
    id: input.id, version: input.version, stage: input.stage, checkpoint: input.checkpoint, purpose: input.purpose,
    invocation: { scope: assertEnum(input.invocation.scope, ['work-item'], 'EXT_INVOCATION_SCOPE', `${input.id} scope`), cardinality: positiveDecimal(input.invocation.cardinality, 'EXT_INVOCATION_RANGE', `${input.id} cardinality`) },
    baseContext, permissions, ordering: input.ordering, publication: normalizeSchemaReference(input.publication, `${input.id} publication`), bounds, outcomes,
    failure: normalizeSchemaReference(input.failure, `${input.id} failure`), skip: normalizeSchemaReference(input.skip, `${input.id} skip`), cancellation: normalizeSchemaReference(input.cancellation, `${input.id} cancellation`), hostProgress: input.hostProgress, midStage: false, cleanup: normalizeSchemaReference(input.cleanup, `${input.id} cleanup`),
  };
}

function normalizeContribution(input, index, stageClassIds, label) {
  exactKeys(input, ['id', 'kind', 'schema', 'identity', 'resourceClass', 'sizeBytes', 'alignment', 'lifetime', 'generation', 'cleanup'], 'EXT_CONTRIBUTION_FIELDS', `${label} contribution ${index}`);
  assertNamespacedId(input.id, 'EXT_CONTRIBUTION_ID', `${label} contribution ${index} id`);
  if (!stageClassIds.has(input.resourceClass)) fail('EXT_CONTRIBUTION_RESOURCE', `${input.id} names non-stage resource class`);
  return {
    id: input.id, kind: assertEnum(input.kind, ['configuration', 'context', 'state', 'workspace', 'diagnostic'], 'EXT_CONTRIBUTION_KIND', `${input.id} kind`),
    schema: normalizeSchemaReference(input.schema, `${input.id} schema`), identity: normalizeContentIdentity(input.identity, 'EXT_CONTRIBUTION_IDENTITY', `${input.id} identity`), resourceClass: input.resourceClass,
    sizeBytes: positiveDecimal(input.sizeBytes, 'EXT_CONTRIBUTION_RANGE', `${input.id} sizeBytes`), alignment: positiveDecimal(input.alignment, 'EXT_CONTRIBUTION_RANGE', `${input.id} alignment`),
    lifetime: assertEnum(input.lifetime, ['engine', 'session', 'root-epoch', 'work-item', 'invocation'], 'EXT_CONTRIBUTION_LIFETIME', `${input.id} lifetime`), generation: normalizeSchemaReference(input.generation, `${input.id} generation`), cleanup: normalizeSchemaReference(input.cleanup, `${input.id} cleanup`),
  };
}

function normalizeEffect(input, index, ownerById, ownerContract, contributions, label) {
  exactKeys(input, ['id', 'owner', 'port', 'kind', 'order', 'commutes'], 'EXT_EFFECT_FIELDS', `${label} effect ${index}`);
  assertNamespacedId(input.id, 'EXT_EFFECT_ID', `${label} effect ${index} id`);
  const kind = assertEnum(input.kind, ['observe', 'write-port', 'control-port', 'capability-state'], 'EXT_EFFECT_KIND', `${input.id} kind`);
  const owner = ownerById.get(input.owner); const port = normalizeSchemaReference(input.port, `${input.id} port`);
  const externalAuthorized = kind !== 'capability-state' && owner?.role === 'source' && owner.ports.some((entry) => schemaKey(entry) === schemaKey(port));
  const capabilityAuthorized = kind === 'capability-state' && input.owner === ownerContract.id && contributions.some(({ schema }) => schemaKey(schema) === schemaKey(port));
  if (!externalAuthorized && !capabilityAuthorized) fail('EXT_EFFECT_OWNER', `${input.id} lacks source-owner or capability-owned authorization`);
  if (typeof input.commutes !== 'boolean') fail('EXT_EFFECT_ORDER', `${input.id} commutes must be boolean`);
  return { id: input.id, owner: input.owner, port, kind, order: normalizeDecimalUint(input.order, `${input.id} order`), commutes: input.commutes };
}

function normalizeCapability(input, index, catalogById, ownerById, surfaceIds, permissionById, stageClassIds) {
  exactKeys(input, ['id', 'version', 'ownerContract', 'semanticOwner', 'invocationCounter', 'bindings', 'requiredFacts', 'permissions', 'contributions', 'effects', 'before', 'after', 'channels', 'activation', 'bounds', 'outcomes', 'cancellation', 'failure', 'deletion', 'sourceIdentity', 'requirements', 'provenance'], 'EXT_CAPABILITY_FIELDS', `capability ${index}`);
  assertNamespacedId(input.id, 'EXT_CAPABILITY_ID', `capability ${index} id`); assertVersion(input.version, 'EXT_CAPABILITY_VERSION', `${input.id} version`);
  const ownerContract = normalizeContract(input.ownerContract, catalogById, `${input.id} ownerContract`);
  if (ownerContract.kind !== 'namespaced' || !ownerById.has(input.semanticOwner)) fail('EXT_CAPABILITY_OWNER', `${input.id} owner/semantic authorization is invalid`);
  const bindings = [...input.bindings].sort(compareRaw);
  if (bindings.length === 0 || new Set(bindings).size !== bindings.length || bindings.some((id) => !surfaceIds.has(id))) fail('EXT_CAPABILITY_BINDING', `${input.id} bindings are invalid`);
  const permissions = [...input.permissions].sort(compareRaw);
  if (new Set(permissions).size !== permissions.length || permissions.some((id) => permissionById.get(id)?.capability !== input.id)) fail('EXT_CAPABILITY_PERMISSION', `${input.id} permissions are invalid`);
  const requiredFacts = [...input.requiredFacts].sort(compareRaw);
  if (new Set(requiredFacts).size !== requiredFacts.length) fail('EXT_CAPABILITY_FACT', `${input.id} required facts contain a duplicate`);
  const contributions = input.contributions.map((entry, contributionIndex) => normalizeContribution(entry, contributionIndex, stageClassIds, input.id)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(contributions, 'id', 'EXT_CONTRIBUTION_DUPLICATE', `${input.id} contribution`);
  const effects = input.effects.map((entry, effectIndex) => normalizeEffect(entry, effectIndex, ownerById, ownerContract, contributions, input.id)).sort((left, right) => compareDecimalUint(left.order, right.order) || compareRaw(left.id, right.id));
  uniqueBy(effects, 'id', 'EXT_EFFECT_DUPLICATE', `${input.id} effect`);
  const before = [...input.before].sort(compareRaw); const after = [...input.after].sort(compareRaw);
  for (const [values, code, label] of [[before, 'EXT_CAPABILITY_ORDER', 'before'], [after, 'EXT_CAPABILITY_ORDER', 'after']]) {
    if (new Set(values).size !== values.length) fail(code, `${input.id} ${label} contains a duplicate`);
    values.forEach((value) => assertNamespacedId(value, code, `${input.id} ${label}`));
  }
  const channels = input.channels.map((entry, channelIndex) => normalizeProfileReference(entry, `${input.id} channel ${channelIndex}`)).sort((left, right) => compareRaw(profileKey(left), profileKey(right)));
  uniqueBy(channels, 'id', 'EXT_CAPABILITY_CHANNEL', `${input.id} channel`);
  exactKeys(input.activation, ['kind', 'rule', 'newResources'], 'EXT_ACTIVATION_FIELDS', `${input.id} activation`);
  const activationKind = assertEnum(input.activation.kind, ['always', 'preplanned-rule'], 'EXT_ACTIVATION_KIND', `${input.id} activation kind`);
  const activationRule = input.activation.rule === null ? null : normalizeSchemaReference(input.activation.rule, `${input.id} activation rule`);
  if ((activationKind === 'preplanned-rule') !== (activationRule !== null) || input.activation.newResources !== false) fail('EXT_ACTIVATION_CONTRACT', `${input.id} activation is not finite/preplanned`);
  const requirements = input.requirements.map((entry, requirementIndex) => normalizeSchemaReference(entry, `${input.id} requirement ${requirementIndex}`)).sort((left, right) => compareRaw(left.id, right.id));
  if (requirements.length === 0 || new Set(requirements.map(schemaKey)).size !== requirements.length || requirements.some(({ id }) => !/^cuda-js\.(?!private(?:[.-]|$))/.test(id))) fail('EXT_CAPABILITY_REQUIREMENT', `${input.id} requirements are not consumer-neutral CUDA-JS contracts`);
  exactKeys(input.provenance, ['origin', 'trust', 'revision', 'license', 'review'], 'EXT_PROVENANCE_FIELDS', `${input.id} provenance`);
  if (input.provenance.origin !== 'first-party' || input.provenance.trust !== 'first-party-reviewed') fail('EXT_CAPABILITY_ORIGIN', `${input.id} must be first-party reviewed`);
  assertString(input.provenance.revision, /^[0-9a-f]{40}$/, 'EXT_CAPABILITY_REVISION', `${input.id} revision`); assertString(input.provenance.license, /\S/, 'EXT_CAPABILITY_LICENSE', `${input.id} license`);
  const outcomes = [...input.outcomes].sort(compareRaw); if (outcomes.length === 0 || new Set(outcomes).size !== outcomes.length) fail('EXT_CAPABILITY_STATUS', `${input.id} outcomes are empty or duplicate`);
  return {
    id: input.id, version: input.version, ownerContract, semanticOwner: input.semanticOwner, invocationCounter: input.invocationCounter, bindings, requiredFacts, permissions, contributions, effects, before, after, channels,
    activation: { kind: activationKind, rule: activationRule, newResources: false }, bounds: normalizeBounds(input.bounds, `${input.id} bounds`), outcomes,
    cancellation: normalizeSchemaReference(input.cancellation, `${input.id} cancellation`), failure: normalizeSchemaReference(input.failure, `${input.id} failure`), deletion: normalizeSchemaReference(input.deletion, `${input.id} deletion`),
    sourceIdentity: normalizeContentIdentity(input.sourceIdentity, 'EXT_CAPABILITY_SOURCE', `${input.id} sourceIdentity`), requirements,
    provenance: { origin: input.provenance.origin, trust: input.provenance.trust, revision: input.provenance.revision, license: input.provenance.license, review: normalizeSchemaReference(input.provenance.review, `${input.id} review`) },
  };
}

function normalizeStatus(input, index) {
  exactKeys(input, ['code', 'class', 'diagnostic'], 'EXT_STATUS_FIELDS', `status ${index}`);
  const expected = STATUS_CLASSES.get(input.code);
  if (!expected || input.class !== expected || typeof input.diagnostic !== 'boolean') fail('EXT_STATUS_CLASS', `${input.code} status is invalid`);
  return { code: input.code, class: input.class, diagnostic: input.diagnostic };
}

function normalizeLifecycle(input) {
  exactKeys(input, ['states', 'schedulerOwner', 'runtimeDiscovery', 'hostProgress', 'pendingWorkerRetention', 'persistence', 'cancellation', 'stop', 'teardown', 'release'], 'EXT_LIFECYCLE_FIELDS', 'lifecycle');
  if (!Array.isArray(input.states) || input.states.some((state, index) => state !== LIFECYCLE_STATES[index]) || input.schedulerOwner !== 'SPEC-0012' || input.runtimeDiscovery !== false || input.hostProgress !== 'none' || input.pendingWorkerRetention !== 'none' || input.persistence !== 'none') fail('EXT_LIFECYCLE_CONTRACT', 'extension lifecycle is incomplete');
  return { states: [...input.states], schedulerOwner: input.schedulerOwner, runtimeDiscovery: false, hostProgress: input.hostProgress, pendingWorkerRetention: input.pendingWorkerRetention, persistence: input.persistence, cancellation: normalizeSchemaReference(input.cancellation, 'lifecycle cancellation'), stop: normalizeSchemaReference(input.stop, 'lifecycle stop'), teardown: normalizeSchemaReference(input.teardown, 'lifecycle teardown'), release: normalizeSchemaReference(input.release, 'lifecycle release') };
}

function normalizeDiagnostics(input) {
  exactKeys(input, ['authority', 'maxRecords', 'maxBytes', 'overflow', 'rawPointers', 'cudaHandles', 'nativeArtifacts', 'privateOwnerState'], 'EXT_DIAGNOSTIC_FIELDS', 'diagnostics');
  if (input.authority !== 'non-authoritative' || input.overflow !== 'count' || input.rawPointers !== false || input.cudaHandles !== false || input.nativeArtifacts !== false || input.privateOwnerState !== false) fail('EXT_DIAGNOSTIC_CONTRACT', 'extension diagnostics widen authority');
  return { ...input, maxRecords: positiveDecimal(input.maxRecords, 'EXT_DIAGNOSTIC_RANGE', 'diagnostics maxRecords'), maxBytes: positiveDecimal(input.maxBytes, 'EXT_DIAGNOSTIC_RANGE', 'diagnostics maxBytes') };
}

function normalizeCompatibility(input) {
  exactKeys(input, ['ownerSemanticsRequired', 'packageIdentityRequired', 'schedulerIdentityExcluded', 'nativeQualification', 'migration'], 'EXT_COMPATIBILITY_FIELDS', 'compatibility');
  exactKeys(input.migration, ['kind'], 'EXT_MIGRATION_FIELDS', 'migration');
  if (input.ownerSemanticsRequired !== true || input.packageIdentityRequired !== true || input.schedulerIdentityExcluded !== true || input.nativeQualification !== 'separate-selected-profile' || input.migration.kind !== 'none') fail('EXT_COMPATIBILITY_CONTRACT', 'extension compatibility is incomplete');
  return { ownerSemanticsRequired: true, packageIdentityRequired: true, schedulerIdentityExcluded: true, nativeQualification: input.nativeQualification, migration: { kind: 'none' } };
}

function normalizeCleanup(input, channelSelected) {
  exactKeys(input, ['kinds', 'disposition', 'quarantine', 'releaseOrder', 'ownerOrder', 'retainedEvidence'], 'EXT_CLEANUP_FIELDS', 'cleanup');
  const kinds = [...input.kinds].sort(compareRaw); const expected = [...BASE_CLEANUP_KINDS, ...(channelSelected ? [CHANNEL_CLEANUP_KIND] : [])].sort(compareRaw);
  if (kinds.length !== expected.length || new Set(kinds).size !== kinds.length || expected.some((kind) => !kinds.includes(kind))) fail('EXT_CLEANUP_COVERAGE', 'cleanup differs from selected extension state');
  return { kinds, disposition: normalizeSchemaReference(input.disposition, 'cleanup disposition'), quarantine: normalizeSchemaReference(input.quarantine, 'cleanup quarantine'), releaseOrder: normalizeSchemaReference(input.releaseOrder, 'cleanup releaseOrder'), ownerOrder: normalizeSchemaReference(input.ownerOrder, 'cleanup ownerOrder'), retainedEvidence: normalizeSchemaReference(input.retainedEvidence, 'cleanup retainedEvidence') };
}

function normalizeProgram(input, requiredProfiles, capabilityRequirements) {
  exactKeys(input, ['kind', 'language', 'sourceIdentity', 'inputs', 'requirements', 'runtimeRegistry', 'nativeArtifacts', 'provenance'], 'EXT_PROGRAM_FIELDS', 'programContribution');
  if (input.kind !== 'device-program' || input.language !== 'restricted-device-js' || input.runtimeRegistry !== false || input.nativeArtifacts !== false) fail('EXT_PROGRAM_LANGUAGE', 'extension program boundary is invalid');
  const inputs = input.inputs.map((entry, index) => normalizeProfileReference(entry, `program input ${index}`)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(inputs, 'id', 'EXT_PROGRAM_INPUT_DUPLICATE', 'program input');
  const actualProfiles = new Map(inputs.map((profile) => [profile.id, profileKey(profile)]));
  if (actualProfiles.size !== requiredProfiles.size || [...requiredProfiles].some(([id, profile]) => actualProfiles.get(id) !== profileKey(profile))) fail('EXT_PROGRAM_INPUTS', 'program inputs differ from selected public profiles');
  const requirements = input.requirements.map((entry, index) => normalizeSchemaReference(entry, `program requirement ${index}`)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(requirements, 'id', 'EXT_PROGRAM_REQUIREMENT_DUPLICATE', 'program requirement');
  for (const id of BASE_PUBLIC_REQUIREMENTS) if (!capabilityRequirements.has(id)) fail('EXT_PROGRAM_REQUIREMENTS', `selected capabilities omit required ${id}`);
  const expectedKeys = new Set([...capabilityRequirements.values()].map(schemaKey));
  if (requirements.length !== expectedKeys.size || requirements.some((entry) => !expectedKeys.has(schemaKey(entry)))) fail('EXT_PROGRAM_REQUIREMENTS', 'program requirements differ from selected consumer-neutral CUDA-JS contracts');
  exactKeys(input.provenance, ['origin', 'trust', 'revision', 'license', 'review'], 'EXT_PROVENANCE_FIELDS', 'program provenance');
  if (input.provenance.origin !== 'first-party' || input.provenance.trust !== 'first-party-reviewed') fail('EXT_PROGRAM_ORIGIN', 'extension program must be first-party reviewed');
  assertString(input.provenance.revision, /^[0-9a-f]{40}$/, 'EXT_PROGRAM_REVISION', 'program revision'); assertString(input.provenance.license, /\S/, 'EXT_PROGRAM_LICENSE', 'program license');
  return { kind: input.kind, language: input.language, sourceIdentity: normalizeContentIdentity(input.sourceIdentity, 'EXT_PROGRAM_SOURCE', 'program sourceIdentity'), inputs, requirements, runtimeRegistry: false, nativeArtifacts: false, provenance: { origin: input.provenance.origin, trust: input.provenance.trust, revision: input.provenance.revision, license: input.provenance.license, review: normalizeSchemaReference(input.provenance.review, 'program review') } };
}

function normalizeProductData(input, index) {
  exactKeys(input, ['ownerContract', 'schema', 'identity'], 'EXT_PRODUCT_FIELDS', `productData ${index}`);
  if (input.ownerContract?.kind !== 'namespaced') fail('EXT_PRODUCT_OWNER', 'product data owner must be namespaced');
  return { ownerContract: normalizeContract(input.ownerContract, new Map(), `productData ${index} owner`), schema: normalizeSchemaReference(input.schema, `productData ${index} schema`), identity: normalizeContentIdentity(input.identity, 'EXT_PRODUCT_IDENTITY', `productData ${index} identity`) };
}

export function normalizeStageProfile(input, inspectedCatalog, resourceResult, progressResult, knownProfiles = []) {
  if (input === null) return { normalized: null, identity: null };
  exactKeys(input, ['schema', 'representation', 'status', 'contract', 'id', 'version', 'generatorIdentity', 'resourcePlan', 'progressPlan', 'resourceContribution', 'progressContribution', 'owners', 'entryStage', 'stages', 'surfaces', 'capabilities', 'permissions', 'counters', 'statuses', 'lifecycle', 'diagnostics', 'compatibility', 'cleanup', 'programContribution', 'productData'], 'EXT_ROOT_FIELDS', 'stage profile');
  if (input.schema !== STAGE_SCHEMA || input.representation !== REPRESENTATION || input.status !== 'proposal-evidence') fail('EXT_SCHEMA', 'unsupported stage schema/representation/status');
  assertNamespacedId(input.id, 'EXT_PROFILE_ID', 'stage profile id'); assertVersion(input.version, 'EXT_PROFILE_VERSION', 'stage profile version');
  const generatorIdentity = normalizeContentIdentity(input.generatorIdentity, 'EXT_GENERATOR_IDENTITY', 'stage generatorIdentity');
  const contracts = inspectedCatalog?.contractSet?.contracts; if (!contracts) fail('EXT_CATALOG', 'inspected catalog is required');
  const catalogById = new Map(contracts.map((entry) => [entry.id, entry])); const contract = normalizeContract(input.contract, catalogById, 'stage contract');
  if (contract.id !== STAGE_CONTRACT) fail('EXT_CONTRACT_ID', `stage contract must select ${STAGE_CONTRACT}`);
  if (!resourceResult?.normalized || !resourceResult?.schemaSha || !progressResult?.normalized || !progressResult?.schemaSha) fail('EXT_PLAN', 'exact resource/progress plans are required');
  const expectedRef = (result) => ({ id: result.normalized.id, schema: { id: result.normalized.schema, version: '0.2.0', sha256: result.schemaSha }, identity: result.identity });
  const resourcePlan = normalizeProfileReference(input.resourcePlan, 'resourcePlan'); const progressPlan = normalizeProfileReference(input.progressPlan, 'progressPlan');
  if (profileKey(resourcePlan) !== profileKey(expectedRef(resourceResult)) || profileKey(progressPlan) !== profileKey(expectedRef(progressResult)) || profileKey(progressResult.normalized.resourcePlan) !== profileKey(resourcePlan)) fail('EXT_PLAN', 'resource/progress plan identity differs');
  const resourceStage = resourceResult.normalized.contributors.find(({ contract: selected }) => selected.id === STAGE_CONTRACT); const progressStage = progressResult.normalized.contributors.find(({ contract: selected }) => selected.id === STAGE_CONTRACT);
  if (!resourceStage || !progressStage || profileKey(resourceStage.profile) !== profileKey(progressStage.profile)) fail('EXT_CONTRIBUTION', 'resource/progress plans do not select one extension contribution');
  const resourceContribution = normalizeProfileReference(input.resourceContribution, 'resourceContribution'); const progressContribution = normalizeProfileReference(input.progressContribution, 'progressContribution');
  if (profileKey(resourceContribution) !== profileKey(resourceStage.profile) || profileKey(progressContribution) !== profileKey(progressStage.profile)) fail('EXT_CONTRIBUTION', 'extension contribution differs from selected plans');
  const stageClasses = resourceResult.normalized.classes.filter(({ contributor }) => contributor === resourceStage.id); const stageClassIds = new Set(stageClasses.map(({ id }) => id));
  const stageWork = progressResult.normalized.workClasses.filter(({ owner }) => owner === progressStage.id); if (stageClasses.length === 0 || stageWork.length !== 1) fail('EXT_UPSTREAM_CONTRACT', 'selected stage resource/progress contribution is incomplete');
  const contributorById = new Map(progressResult.normalized.contributors.map((entry) => [entry.id, entry]));
  const owners = input.owners.map((entry, index) => normalizeOwner(entry, index, catalogById, contributorById, progressStage.id)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(owners, 'id', 'EXT_OWNER_DUPLICATE', 'owner');
  if (owners.length !== contributorById.size || [...contributorById.keys()].some((id) => !owners.some((entry) => entry.id === id))) fail('EXT_OWNER_COVERAGE', 'owners do not exactly cover selected progress contributors');
  const ownerById = new Map(owners.map((entry) => [entry.id, entry])); const contractIds = new Set(owners.map(({ contract: ownerContract }) => ownerContract.id));
  for (const required of ['SPEC-0003', 'SPEC-0007', 'SPEC-0008', 'SPEC-0010', 'SPEC-0011', 'SPEC-0012', 'SPEC-0013']) if (!contractIds.has(required)) fail('EXT_OWNER_REQUIRED', `selected extension profile lacks ${required} owner`);
  const knownByProfile = new Map(knownProfiles.filter(({ normalized, schemaSha, identity }) => normalized && schemaSha && identity).map((result) => [profileKey({ id: result.normalized.id, schema: { id: result.normalized.schema, version: '0.2.0', sha256: result.schemaSha }, identity: result.identity }), result.normalized]));
  for (const owner of owners.filter(({ role }) => role === 'source')) {
    const known = knownByProfile.get(profileKey(owner.profile));
    if (knownProfiles.length > 0 && ['SPEC-0007', 'SPEC-0008', 'SPEC-0010'].includes(owner.contract.id) && !known) fail('EXT_OWNER_PROFILE', `${owner.id} semantic source profile is unavailable`);
    if (known) { const allowed = new Set((known.ports ?? []).map(({ contract: portContract }) => portContract).filter(Boolean).map(schemaKey)); if (owner.ports.some((port) => !allowed.has(schemaKey(port)))) fail('EXT_OWNER_PORT', `${owner.id} names a port outside its selected source profile`); }
  }
  const counters = input.counters.map(normalizeCounter).sort((left, right) => compareRaw(left.kind, right.kind)); uniqueBy(counters, 'id', 'EXT_COUNTER_DUPLICATE', 'counter'); uniqueBy(counters, 'kind', 'EXT_COUNTER_KIND_DUPLICATE', 'counter kind');
  if (counters.length !== COUNTER_KINDS.length || COUNTER_KINDS.some((kind) => !counters.some((entry) => entry.kind === kind))) fail('EXT_COUNTER_COVERAGE', 'finite counter coverage is incomplete'); const counterByKind = new Map(counters.map((entry) => [entry.kind, entry]));
  const workById = new Map(progressResult.normalized.workClasses.map((entry) => [entry.id, entry]));
  const stages = input.stages.map((entry, index) => normalizeStage(entry, index, progressStage, workById, stageClassIds, counterByKind, ownerById)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(stages, 'id', 'EXT_STAGE_DUPLICATE', 'stage');
  if (stages.length === 0) fail('EXT_STAGE_COUNT', 'selected extension profile must contain a stage'); const stageById = new Map(stages.map((entry) => [entry.id, entry]));
  assertNamespacedId(input.entryStage, 'EXT_STAGE_ENTRY', 'extension entryStage'); if (!stageById.has(input.entryStage)) fail('EXT_STAGE_ENTRY', 'extension entryStage is unknown');
  for (const stage of stages) for (const outcome of stage.outcomes) if (outcome.target !== null && !stageById.has(outcome.target)) fail('EXT_STAGE_TARGET', `${stage.id} names unknown target ${outcome.target}`);
  const reachable = new Set([input.entryStage]); for (let changed = true; changed;) { changed = false; for (const stage of stages.filter(({ id }) => reachable.has(id))) for (const { target } of stage.outcomes) if (target && !reachable.has(target)) { reachable.add(target); changed = true; } }
  const terminalReachable = new Set(stages.filter(({ outcomes }) => outcomes.some(({ kind }) => ['terminal', 'failure', 'cancellation'].includes(kind))).map(({ id }) => id)); for (let changed = true; changed;) { changed = false; for (const stage of stages) if (!terminalReachable.has(stage.id) && stage.outcomes.some(({ target }) => target && terminalReachable.has(target))) { terminalReachable.add(stage.id); changed = true; } }
  if (reachable.size !== stages.length || terminalReachable.size !== stages.length) fail('EXT_STAGE_GRAPH', 'stage graph is unreachable or lacks a reachable terminal path');
  for (const stage of stages) if (compareDecimalUint(stage.bounds.maxTransitions, counterByKind.get('stage-transition').maximum) > 0) fail('EXT_STAGE_COUNTER', `${stage.id} transition bound exceeds finite counter`);
  const selectedStageClassIds = new Set(stages.flatMap(({ resourceClasses }) => resourceClasses)); if (selectedStageClassIds.size !== stageClassIds.size || [...stageClassIds].some((id) => !selectedStageClassIds.has(id))) fail('EXT_STAGE_RESOURCE', 'stages do not exactly cover the selected extension resource classes');
  const stateCapacity = stageClasses.filter(({ unit }) => unit === 'records').reduce((maximum, entry) => BigInt(entry.formula.maximumUnits) > maximum ? BigInt(entry.formula.maximumUnits) : maximum, 0n); if (stateCapacity === 0n || stages.some(({ bounds: stageBounds }) => BigInt(stageBounds.maxItems) > stateCapacity)) fail('EXT_STAGE_RESOURCE', 'stage item bounds exceed admitted stage-state capacity');
  const permissions = input.permissions.map((entry, index) => normalizePermission(entry, index, ownerById)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(permissions, 'id', 'EXT_PERMISSION_DUPLICATE', 'permission'); const permissionById = new Map(permissions.map((entry) => [entry.id, entry]));
  const surfaces = input.surfaces.map((entry, index) => normalizeSurface(entry, index, stageById, permissionById, ownerById)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(surfaces, 'id', 'EXT_SURFACE_DUPLICATE', 'surface'); if (surfaces.length === 0) fail('EXT_SURFACE_COUNT', 'selected extension profile must materialize a surface'); const surfaceIds = new Set(surfaces.map(({ id }) => id));
  uniqueBy(surfaces.flatMap(({ baseContext }) => baseContext), 'id', 'EXT_CONTEXT_DUPLICATE', 'profile context');
  const capabilities = input.capabilities.map((entry, index) => normalizeCapability(entry, index, catalogById, ownerById, surfaceIds, permissionById, stageClassIds)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(capabilities, 'id', 'EXT_CAPABILITY_DUPLICATE', 'capability');
  if (capabilities.length === 0) fail('EXT_CAPABILITY_COUNT', 'zero capabilities must omit the complete extension profile'); const capabilityById = new Map(capabilities.map((entry) => [entry.id, entry]));
  for (const permission of permissions) if (!capabilityById.has(permission.capability) || !surfaceIds.has(permission.surface)) fail('EXT_PERMISSION_COVERAGE', `${permission.id} names unknown capability/surface`);
  for (const capability of capabilities) {
    if (capability.invocationCounter !== counterByKind.get('capability-invocation').id || compareDecimalUint(capability.bounds.maxItems, counterByKind.get('capability-invocation').maximum) > 0) fail('EXT_CAPABILITY_COUNTER', `${capability.id} invocation counter is invalid`);
    for (const id of [...capability.before, ...capability.after]) if (!capabilityById.has(id) || id === capability.id) fail('EXT_CAPABILITY_ORDER', `${capability.id} ordering names invalid capability`);
    for (const permissionId of capability.permissions) if (!capability.bindings.includes(permissionById.get(permissionId).surface)) fail('EXT_CAPABILITY_PERMISSION', `${capability.id} carries permission outside its bindings`);
    const boundSurfaces = surfaces.filter(({ id }) => capability.bindings.includes(id));
    for (const factId of capability.requiredFacts) {
      const fields = boundSurfaces.flatMap((surface) => surface.baseContext.filter(({ id }) => id === factId).map((field) => ({ surface, field })));
      if (fields.length !== 1) fail('EXT_CAPABILITY_FACT', `${capability.id} requires unavailable or ambiguous base fact`);
      const { surface, field } = fields[0];
      if (!capability.permissions.map((id) => permissionById.get(id)).some((permission) => permission.surface === surface.id && permission.sourceOwner === field.sourceOwner && schemaKey(permission.sourcePort) === schemaKey(field.sourcePort) && permission.access === field.access)) fail('EXT_CAPABILITY_PERMISSION', `${capability.id} lacks authority for required fact ${factId}`);
    }
    for (const effect of capability.effects.filter(({ kind }) => kind !== 'capability-state')) {
      const access = effect.kind === 'observe' ? 'read' : effect.kind;
      if (!capability.permissions.map((id) => permissionById.get(id)).some((permission) => capability.bindings.includes(permission.surface) && permission.sourceOwner === effect.owner && schemaKey(permission.sourcePort) === schemaKey(effect.port) && permission.access === access)) fail('EXT_CAPABILITY_PERMISSION', `${capability.id} lacks authority for effect ${effect.id}`);
    }
  }
  for (const surface of surfaces) {
    const selected = capabilities.filter(({ bindings }) => bindings.includes(surface.id)); if (selected.length === 0) fail('EXT_SURFACE_RESIDUE', `${surface.id} has no selected capability`);
    const expectedPermissions = new Set(selected.flatMap(({ permissions: ids }) => ids).filter((id) => permissionById.get(id)?.surface === surface.id));
    if (surface.permissions.length !== expectedPermissions.size || [...expectedPermissions].some((id) => !surface.permissions.includes(id))) fail('EXT_SURFACE_PERMISSION', `${surface.id} permissions differ from selected capabilities`);
    const requiredFacts = new Set(selected.flatMap(({ requiredFacts: ids }) => ids)); if (surface.baseContext.some(({ id }) => !requiredFacts.has(id))) fail('EXT_CONTEXT_RESIDUE', `${surface.id} exposes unused base context`);
    for (let left = 0; left < selected.length; left += 1) for (let right = left + 1; right < selected.length; right += 1) {
      const first = selected[left]; const second = selected[right]; const ordered = first.before.includes(second.id) || first.after.includes(second.id) || second.before.includes(first.id) || second.after.includes(first.id);
      const commute = [...first.effects, ...second.effects].every(({ commutes }) => commutes); if (!ordered && !commute) fail('EXT_CAPABILITY_ORDER', `${surface.id} has unordered noncommuting capabilities`);
    }
  }
  for (const permission of permissions) {
    const surface = surfaces.find(({ id }) => id === permission.surface); const capability = capabilityById.get(permission.capability);
    const contextUse = surface.baseContext.some(({ sourceOwner, sourcePort, access }) => sourceOwner === permission.sourceOwner && schemaKey(sourcePort) === schemaKey(permission.sourcePort) && access === permission.access);
    const effectKind = permission.access === 'read' ? 'observe' : permission.access; const effectUse = capability.effects.some(({ owner, port, kind }) => owner === permission.sourceOwner && schemaKey(port) === schemaKey(permission.sourcePort) && kind === effectKind);
    if (!contextUse && !effectUse) fail('EXT_PERMISSION_RESIDUE', `${permission.id} grants unused authority`);
  }
  const orderingEdges = new Map(capabilities.map(({ id }) => [id, new Set()])); for (const capability of capabilities) { capability.before.forEach((id) => orderingEdges.get(capability.id).add(id)); capability.after.forEach((id) => orderingEdges.get(id).add(capability.id)); }
  const indegree = new Map(capabilities.map(({ id }) => [id, 0])); for (const targets of orderingEdges.values()) for (const target of targets) indegree.set(target, indegree.get(target) + 1); const ready = [...indegree].filter(([, degree]) => degree === 0).map(([id]) => id); let visited = 0; while (ready.length) { const id = ready.shift(); visited += 1; for (const target of orderingEdges.get(id)) { indegree.set(target, indegree.get(target) - 1); if (indegree.get(target) === 0) ready.push(target); } } if (visited !== capabilities.length) fail('EXT_CAPABILITY_ORDER', 'capability ordering contains a cycle');
  const usedOwnerPorts = new Map(owners.map(({ id }) => [id, new Set()]));
  for (const permission of permissions) usedOwnerPorts.get(permission.sourceOwner).add(schemaKey(permission.sourcePort)); for (const stage of stages) { usedOwnerPorts.get(stage.entry.sourceOwner).add(schemaKey(stage.entry.publication)); for (const outcome of stage.outcomes) usedOwnerPorts.get(outcome.sourceOwner).add(schemaKey(outcome.publication)); } for (const capability of capabilities) for (const effect of capability.effects) if (usedOwnerPorts.has(effect.owner)) usedOwnerPorts.get(effect.owner).add(schemaKey(effect.port));
  for (const owner of owners) if (owner.ports.length !== usedOwnerPorts.get(owner.id).size || owner.ports.some((port) => !usedOwnerPorts.get(owner.id).has(schemaKey(port)))) fail('EXT_OWNER_PORT_RESIDUE', `${owner.id} ports differ from selected use`);
  const stageClassById = new Map(stageClasses.map((entry) => [entry.id, entry]));
  const contributionTotals = new Map(stageClasses.map(({ id }) => [id, 0n])); for (const capability of capabilities) for (const contribution of capability.contributions) {
    const resourceClass = stageClassById.get(contribution.resourceClass);
    if (resourceClass.unit !== 'bytes' || BigInt(contribution.alignment) % BigInt(resourceClass.alignment) !== 0n) fail('EXT_CONTRIBUTION_ALIGNMENT', `${contribution.id} is incompatible with its resource class`);
    contributionTotals.set(contribution.resourceClass, contributionTotals.get(contribution.resourceClass) + BigInt(contribution.sizeBytes));
  }
  for (const resourceClass of stageClasses) if (contributionTotals.get(resourceClass.id) > BigInt(resourceClass.formula.maximumUnits)) fail('EXT_CONTRIBUTION_CAPACITY', `${resourceClass.id} contribution exceeds admitted capacity`);
  const statuses = input.statuses.map(normalizeStatus).sort((left, right) => compareRaw(left.code, right.code)); uniqueBy(statuses, 'code', 'EXT_STATUS_DUPLICATE', 'status'); if (statuses.length !== STATUS_CLASSES.size || [...STATUS_CLASSES.keys()].some((code) => !statuses.some((entry) => entry.code === code))) fail('EXT_STATUS_COVERAGE', 'extension status vocabulary is incomplete');
  const statusCodes = new Set(statuses.map(({ code }) => code)); for (const stage of stages) for (const { code } of stage.outcomes) if (!statusCodes.has(code)) fail('EXT_STAGE_STATUS', `${stage.id} outcome ${code} is undeclared`); for (const capability of capabilities) if (capability.outcomes.some((code) => !statusCodes.has(code))) fail('EXT_CAPABILITY_STATUS', `${capability.id} names undeclared outcome`);
  const lifecycle = normalizeLifecycle(input.lifecycle); const diagnostics = normalizeDiagnostics(input.diagnostics); const compatibility = normalizeCompatibility(input.compatibility); const channelSelected = capabilities.some(({ channels }) => channels.length > 0); const cleanup = normalizeCleanup(input.cleanup, channelSelected);
  const requiredProfiles = new Map([[resourcePlan.id, resourcePlan], [progressPlan.id, progressPlan]]); for (const owner of owners.filter(({ role }) => role === 'source')) if (!requiredProfiles.has(owner.profile.id)) requiredProfiles.set(owner.profile.id, owner.profile); for (const capability of capabilities) for (const channel of capability.channels) { const existing = requiredProfiles.get(channel.id); if (existing && profileKey(existing) !== profileKey(channel)) fail('EXT_CAPABILITY_CHANNEL', `${channel.id} has conflicting selected identities`); requiredProfiles.set(channel.id, channel); }
  const capabilityRequirements = new Map(); for (const capability of capabilities) for (const requirement of capability.requirements) { const existing = capabilityRequirements.get(requirement.id); if (existing && schemaKey(existing) !== schemaKey(requirement)) fail('EXT_CAPABILITY_REQUIREMENT', `${requirement.id} has conflicting selected identities`); capabilityRequirements.set(requirement.id, requirement); } const programContribution = normalizeProgram(input.programContribution, requiredProfiles, capabilityRequirements);
  const productData = input.productData.map(normalizeProductData).sort((left, right) => compareRaw(left.ownerContract.id, right.ownerContract.id)); uniqueBy(productData.map(({ ownerContract }) => ({ id: ownerContract.id })), 'id', 'EXT_PRODUCT_DUPLICATE', 'product owner');
  const normalized = { schema: input.schema, representation: input.representation, status: input.status, contract, id: input.id, version: input.version, generatorIdentity, resourcePlan, progressPlan, resourceContribution, progressContribution, owners, entryStage: input.entryStage, stages, surfaces, capabilities, permissions, counters, statuses, lifecycle, diagnostics, compatibility, cleanup, programContribution, productData };
  return { normalized, identity: canonicalIdentity(normalized) };
}

import { createHash } from 'node:crypto';

import {
  assertString,
  canonicalIdentity,
  compareRaw,
  exactKeys,
  fail,
  normalizeDecimalUint,
  uniqueBy,
} from './validation.mjs';
import {
  assertNamespacedId,
  assertVersion,
  normalizeContentIdentity,
  normalizeSchemaReference,
} from './foundation.mjs';

const PROFILE_SCHEMA = 'cuda-mcgs.program-package-profile/0.2.0';
const SEARCH_PROGRAM_SCHEMA = 'cuda-mcgs.search-program/0.2.0';
const EXECUTION_PACKAGE_SCHEMA = 'cuda-mcgs.execution-package/0.2.0';
const CUDA_JS_ADAPTER_REQUIREMENTS_SCHEMA = 'cuda-mcgs.cuda-js-adapter-requirements/0.2.0';
const COMPATIBLE_PAIR_SCHEMA = 'cuda-mcgs.compatible-pair-record/0.2.0';
const REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const COMPOSE_CONTRACT = 'SPEC-0005';
const RESTRICTED_SOURCE_TYPES = new Set(['bool', 'u32', 'i32', 'u64', 'f32', 'ptr<bool>', 'ptr<u32>', 'ptr<i32>', 'ptr<u64>', 'ptr<f32>', 'sideband<host-to-device,u32>', 'sideband<device-to-host,u32>']);
const RETURN_TYPES = new Set(['void', 'bool', 'u32', 'i32', 'u64', 'f32']);
const HELPER_REQUIREMENTS = new Map([
  ['gpu.atomic.load-acquire-device', 'cuda-js.device-publication-release-acquire/0.1.0'],
  ['gpu.atomic.store-release-device', 'cuda-js.device-publication-release-acquire/0.1.0'],
  ['gpu.mailbox.load-acquire-system', 'cuda-js.publication-mailbox/0.1.0'],
]);
const HELPER_SOURCE_NAMES = new Map([
  ['gpu.thread.global-x', 'gpu.thread.globalX'],
  ['gpu.atomic.load-acquire-device', 'gpu.atomic.loadAcquireDevice'],
  ['gpu.atomic.store-release-device', 'gpu.atomic.storeReleaseDevice'],
  ['gpu.mailbox.load-acquire-system', 'gpu.mailbox.loadAcquireSystem'],
  ['gpu.barrier.block', 'gpu.barrier.block'],
  ['gpu.fence.device', 'gpu.fence.device'],
]);
const BASE_REQUIREMENTS = new Set(['cuda-js.device-js/0.1.0', 'cuda-js.operation-lifecycle/0.1.0', 'cuda-js.publication-mailbox/0.1.0']);
const FORBIDDEN_SOURCE = /(?:#include|__global__|__device__|\b(?:import|export|require|eval|process|Buffer)\b|node:|\.cu\b|\.cuh\b|\.ptx\b|\bcuda[A-Za-z0-9_]*\b)/;

function assertEnum(value, allowed, code, label) {
  if (!allowed.includes(value)) fail(code, `${label} is invalid`);
  return value;
}

function positiveDecimal(value, code, label) {
  const normalized = normalizeDecimalUint(value, label);
  if (normalized === '0') fail(code, `${label} must be positive`);
  return normalized;
}

function schemaKey(reference) {
  return `${reference.id}\0${reference.version}\0${reference.sha256}`;
}

function profileKey(reference) {
  return `${reference.id}\0${schemaKey(reference.schema)}\0${reference.identity.sha256}`;
}

function identityReference(identity) {
  return { algorithm: identity.algorithm, sha256: identity.sha256 };
}

function normalizeProfileReference(input, label) {
  exactKeys(input, ['id', 'schema', 'identity'], 'COMPOSE_PROFILE_REFERENCE_FIELDS', label);
  assertNamespacedId(input.id, 'COMPOSE_PROFILE_REFERENCE', `${label} id`);
  return {
    id: input.id,
    schema: normalizeSchemaReference(input.schema, `${label} schema`),
    identity: normalizeContentIdentity(input.identity, 'COMPOSE_PROFILE_REFERENCE', `${label} identity`),
  };
}

function resultReference(result) {
  if (!result?.normalized || !result?.identity || !result?.schemaSha) fail('COMPOSE_CONTEXT_PROFILE', 'profile result is incomplete');
  return {
    id: result.normalized.id,
    schema: { id: result.normalized.schema, version: '0.2.0', sha256: result.schemaSha },
    identity: identityReference(result.identity),
  };
}

function normalizeOptionalReference(input, expected, label) {
  if (expected === null) {
    exactKeys(input, ['kind'], 'COMPOSE_OPTIONAL_PROFILE_FIELDS', label);
    if (input.kind !== 'absent') fail('COMPOSE_OPTIONAL_PROFILE', `${label} must be absent`);
    return { kind: 'absent' };
  }
  exactKeys(input, ['kind', 'profile'], 'COMPOSE_OPTIONAL_PROFILE_FIELDS', label);
  if (input.kind !== 'selected') fail('COMPOSE_OPTIONAL_PROFILE', `${label} must be selected`);
  const profile = normalizeProfileReference(input.profile, `${label} profile`);
  if (profileKey(profile) !== profileKey(resultReference(expected))) fail('COMPOSE_OPTIONAL_PROFILE', `${label} differs from the selected profile`);
  return { kind: 'selected', profile };
}

function normalizeCatalogContract(input, inspected) {
  exactKeys(input, ['kind', 'id', 'specificationIdentity', 'sha256'], 'COMPOSE_CONTRACT_FIELDS', 'composition contract');
  const expected = inspected?.contractSet?.contracts?.find(({ id }) => id === COMPOSE_CONTRACT);
  if (!expected || input.kind !== 'catalog' || input.id !== expected.id || input.specificationIdentity !== expected.specificationIdentity || input.sha256 !== expected.sha256) {
    fail('COMPOSE_CONTRACT_DRIFT', 'composition contract differs from the frozen catalog');
  }
  return { ...input };
}

function normalizeProvenance(input, label) {
  exactKeys(input, ['origin', 'trust', 'revision', 'license', 'review'], 'COMPOSE_PROVENANCE_FIELDS', label);
  const origin = assertEnum(input.origin, ['first-party', 'third-party-reviewed'], 'COMPOSE_PROVENANCE_ORIGIN', `${label} origin`);
  const trust = assertEnum(input.trust, ['first-party-reviewed', 'explicit-third-party'], 'COMPOSE_PROVENANCE_TRUST', `${label} trust`);
  if ((origin === 'first-party') !== (trust === 'first-party-reviewed')) fail('COMPOSE_PROVENANCE_TRUST', `${label} origin/trust differ`);
  assertString(input.revision, /^[0-9a-f]{40}$/, 'COMPOSE_PROVENANCE_REVISION', `${label} revision`);
  if (typeof input.license !== 'string' || input.license.length === 0) fail('COMPOSE_PROVENANCE_LICENSE', `${label} license is absent`);
  return { origin, trust, revision: input.revision, license: input.license, review: normalizeSchemaReference(input.review, `${label} review`) };
}

function normalizeSource(input, maximumBytes) {
  if (typeof input !== 'string') fail('COMPOSE_SOURCE_TYPE', 'source must be text');
  const source = input.replace(/\r\n?/g, '\n').replace(/\n+$/g, '') + '\n';
  if (BigInt(Buffer.byteLength(source, 'utf8')) > BigInt(maximumBytes)) fail('COMPOSE_SOURCE_BOUNDS', 'source exceeds the declared byte bound');
  if (FORBIDDEN_SOURCE.test(source)) fail('COMPOSE_SOURCE_BOUNDARY', 'source contains host, native, CUDA, PTX or import syntax');
  return source;
}

function sourceIdentity(source) {
  return { algorithm: 'sha256', sha256: createHash('sha256').update(source, 'utf8').digest('hex') };
}

export function normalizeProgramGenerator(input) {
  exactKeys(input, ['id', 'version', 'revision', 'language', 'canonicalization', 'maxSourceBytes', 'maxFunctions', 'maxCallDepth'], 'COMPOSE_GENERATOR_FIELDS', 'generator');
  assertNamespacedId(input.id, 'COMPOSE_GENERATOR_ID', 'generator id');
  assertVersion(input.version, 'COMPOSE_GENERATOR_VERSION', 'generator version');
  assertString(input.revision, /^[0-9a-f]{40}$/, 'COMPOSE_GENERATOR_REVISION', 'generator revision');
  if (input.language !== 'restricted-device-js' || input.canonicalization !== 'utf8-lf-source-units-by-js-code-unit-v1') fail('COMPOSE_GENERATOR_BOUNDARY', 'generator language/canonicalization is invalid');
  return {
    id: input.id, version: input.version, revision: input.revision, language: input.language, canonicalization: input.canonicalization,
    maxSourceBytes: positiveDecimal(input.maxSourceBytes, 'COMPOSE_GENERATOR_BOUNDS', 'generator maxSourceBytes'),
    maxFunctions: positiveDecimal(input.maxFunctions, 'COMPOSE_GENERATOR_BOUNDS', 'generator maxFunctions'),
    maxCallDepth: positiveDecimal(input.maxCallDepth, 'COMPOSE_GENERATOR_BOUNDS', 'generator maxCallDepth'),
  };
}

function programContributionIdentity(result) {
  return result?.normalized?.programContribution?.sourceIdentity ?? null;
}

function normalizeSourceUnit(input, index, context) {
  exactKeys(input, ['id', 'ownerProfile', 'semanticOwner', 'kind', 'source', 'sourceIdentity', 'contributionIdentity', 'functions', 'provenance'], 'COMPOSE_SOURCE_UNIT_FIELDS', `source unit ${index}`);
  assertNamespacedId(input.id, 'COMPOSE_SOURCE_UNIT_ID', `source unit ${index} id`);
  assertNamespacedId(input.ownerProfile, 'COMPOSE_SOURCE_OWNER', `${input.id} ownerProfile`);
  assertNamespacedId(input.semanticOwner, 'COMPOSE_SOURCE_OWNER', `${input.id} semanticOwner`);
  const kind = assertEnum(input.kind, ['source-owner', 'stage-capability', 'channel', 'composer-entry'], 'COMPOSE_SOURCE_KIND', `${input.id} kind`);
  const ownerResult = context.profileById.get(input.ownerProfile);
  if (!ownerResult && kind !== 'composer-entry') fail('COMPOSE_SOURCE_OWNER', `${input.id} names an unselected owner profile`);
  if (kind === 'source-owner' && input.semanticOwner !== input.ownerProfile) fail('COMPOSE_SOURCE_OWNER', `${input.id} source-owner semantics differ from its profile`);
  if (kind === 'composer-entry' && input.ownerProfile !== context.compositionProfileId) fail('COMPOSE_SOURCE_OWNER', `${input.id} composer entry has the wrong owner`);
  if (kind === 'stage-capability' && !context.stageResult?.normalized.capabilities.some(({ id }) => id === input.semanticOwner)) fail('COMPOSE_SOURCE_OWNER', `${input.id} names an unselected Stage capability`);
  if (kind === 'channel' && !context.channelResult?.normalized.channels.some(({ id }) => id === input.semanticOwner)) fail('COMPOSE_SOURCE_OWNER', `${input.id} names an unselected Channel`);
  const source = normalizeSource(input.source, context.generator.maxSourceBytes);
  const suppliedSourceIdentity = normalizeContentIdentity(input.sourceIdentity, 'COMPOSE_SOURCE_IDENTITY', `${input.id} sourceIdentity`);
  if (suppliedSourceIdentity.sha256 !== sourceIdentity(source).sha256) fail('COMPOSE_SOURCE_IDENTITY', `${input.id} source digest does not match exact canonical bytes`);
  const contributionIdentity = normalizeContentIdentity(input.contributionIdentity, 'COMPOSE_SOURCE_CONTRIBUTION', `${input.id} contributionIdentity`);
  const expectedContribution = kind === 'composer-entry' ? context.composerContributionIdentity : programContributionIdentity(ownerResult);
  if (!expectedContribution || expectedContribution.sha256 !== contributionIdentity.sha256) fail('COMPOSE_SOURCE_CONTRIBUTION', `${input.id} differs from its selected owner contribution`);
  if (!Array.isArray(input.functions) || input.functions.length === 0) fail('COMPOSE_SOURCE_FUNCTIONS', `${input.id} must declare functions`);
  const functions = [...input.functions].sort(compareRaw);
  for (const name of functions) assertString(name, /^[A-Za-z_$][A-Za-z0-9_$]*$/, 'COMPOSE_FUNCTION_NAME', `${input.id} function`);
  if (new Set(functions).size !== functions.length) fail('COMPOSE_SOURCE_FUNCTIONS', `${input.id} repeats a function`);
  return { id: input.id, ownerProfile: input.ownerProfile, semanticOwner: input.semanticOwner, kind, source, sourceIdentity: suppliedSourceIdentity, contributionIdentity, functions, provenance: normalizeProvenance(input.provenance, `${input.id} provenance`) };
}

function normalizeParameter(input, functionName, index) {
  const fields = ['name', 'type'];
  if (Object.hasOwn(input, 'sidebandRole')) fields.push('sidebandRole');
  exactKeys(input, fields, 'COMPOSE_PARAMETER_FIELDS', `${functionName} parameter ${index}`);
  assertString(input.name, /^[A-Za-z_$][A-Za-z0-9_$]*$/, 'COMPOSE_PARAMETER_NAME', `${functionName} parameter ${index} name`);
  if (!RESTRICTED_SOURCE_TYPES.has(input.type)) fail('COMPOSE_PARAMETER_TYPE', `${functionName} parameter ${input.name} has an unsupported type`);
  const sideband = input.type.startsWith('sideband<');
  if (sideband) {
    if (!Object.hasOwn(input, 'sidebandRole')) fail('COMPOSE_PARAMETER_ROLE', `${functionName} sideband parameter ${input.name} lacks an explicit role`);
    assertString(input.sidebandRole, /^[a-z][a-z0-9-]*$/, 'COMPOSE_PARAMETER_ROLE', `${functionName} parameter ${input.name} sidebandRole`);
    return { name: input.name, type: input.type, sidebandRole: input.sidebandRole };
  }
  if (Object.hasOwn(input, 'sidebandRole')) fail('COMPOSE_PARAMETER_ROLE', `${functionName} non-sideband parameter ${input.name} cannot carry sidebandRole`);
  return { name: input.name, type: input.type };
}

function normalizeFunction(input, index, context) {
  exactKeys(input, ['name', 'executionRole', 'parameters', 'returns', 'sourceUnit', 'ownerProfile', 'semanticRole', 'calls', 'helpers'], 'COMPOSE_FUNCTION_FIELDS', `function ${index}`);
  assertString(input.name, /^[A-Za-z_$][A-Za-z0-9_$]*$/, 'COMPOSE_FUNCTION_NAME', `function ${index} name`);
  const executionRole = assertEnum(input.executionRole, ['runtime-entry', 'device-callable'], 'COMPOSE_FUNCTION_ROLE', `${input.name} executionRole`);
  if (!Array.isArray(input.parameters)) fail('COMPOSE_PARAMETER_COUNT', `${input.name} parameters must be an array`);
  const parameters = input.parameters.map((parameter, parameterIndex) => normalizeParameter(parameter, input.name, parameterIndex));
  uniqueBy(parameters, 'name', 'COMPOSE_PARAMETER_DUPLICATE', `${input.name} parameter`);
  if (!RETURN_TYPES.has(input.returns) || (executionRole === 'runtime-entry' && input.returns !== 'void')) fail('COMPOSE_FUNCTION_RETURN', `${input.name} has an incompatible MCGS Search Program return contract`);
  assertNamespacedId(input.sourceUnit, 'COMPOSE_FUNCTION_SOURCE', `${input.name} sourceUnit`);
  assertNamespacedId(input.ownerProfile, 'COMPOSE_FUNCTION_OWNER', `${input.name} ownerProfile`);
  assertNamespacedId(input.semanticRole, 'COMPOSE_FUNCTION_ROLE', `${input.name} semanticRole`);
  const sourceUnit = context.sourceUnitById.get(input.sourceUnit);
  if (!sourceUnit || sourceUnit.ownerProfile !== input.ownerProfile || !sourceUnit.functions.includes(input.name)) fail('COMPOSE_FUNCTION_SOURCE', `${input.name} source/owner mapping is incomplete`);
  if (!Array.isArray(input.calls) || !Array.isArray(input.helpers)) fail('COMPOSE_FUNCTION_CALLS', `${input.name} calls/helpers must be arrays`);
  const calls = [...input.calls].sort(compareRaw); const helpers = [...input.helpers].sort(compareRaw);
  if (new Set(calls).size !== calls.length || new Set(helpers).size !== helpers.length) fail('COMPOSE_FUNCTION_CALLS', `${input.name} repeats a call/helper`);
  for (const call of calls) assertString(call, /^[A-Za-z_$][A-Za-z0-9_$]*$/, 'COMPOSE_FUNCTION_CALL', `${input.name} call`);
  for (const helper of helpers) {
    if (!HELPER_SOURCE_NAMES.has(helper)) fail('COMPOSE_HELPER_UNSUPPORTED', `${input.name} uses unsupported helper ${helper}`);
    if (!sourceUnit.source.includes(HELPER_SOURCE_NAMES.get(helper))) fail('COMPOSE_HELPER_MAPPING', `${input.name} helper is absent from its source unit`);
  }
  return { name: input.name, executionRole, parameters, returns: input.returns, sourceUnit: input.sourceUnit, ownerProfile: input.ownerProfile, semanticRole: input.semanticRole, calls, helpers };
}

function validateCallGraph(functions, maximumDepth) {
  const byName = new Map(functions.map((entry) => [entry.name, entry]));
  for (const entry of functions) for (const call of entry.calls) {
    const target = byName.get(call);
    if (!target) fail('COMPOSE_FUNCTION_CALL', `${entry.name} calls undeclared ${call}`);
    if (target.executionRole === 'runtime-entry') fail('COMPOSE_FUNCTION_CALL', `${entry.name} calls kernel ${call}`);
  }
  const visiting = new Set(); const memo = new Map();
  function depth(name) {
    if (visiting.has(name)) fail('COMPOSE_FUNCTION_CYCLE', `function call graph contains ${name}`);
    if (memo.has(name)) return memo.get(name);
    visiting.add(name);
    const value = 1n + byName.get(name).calls.reduce((maximum, call) => { const child = depth(call); return child > maximum ? child : maximum; }, 0n);
    visiting.delete(name); memo.set(name, value); return value;
  }
  for (const name of byName.keys()) if (depth(name) > BigInt(maximumDepth)) fail('COMPOSE_FUNCTION_DEPTH', `${name} exceeds maxCallDepth`);
}

function canonicalCapabilityOrder(capabilities) {
  const selected = new Set(capabilities.map(({ id }) => id));
  const outgoing = new Map(capabilities.map(({ id }) => [id, new Set()]));
  const incoming = new Map(capabilities.map(({ id }) => [id, 0]));
  for (const capability of capabilities) {
    for (const target of capability.before.filter((id) => selected.has(id))) outgoing.get(capability.id).add(target);
    for (const source of capability.after.filter((id) => selected.has(id))) outgoing.get(source).add(capability.id);
  }
  for (const targets of outgoing.values()) for (const target of targets) incoming.set(target, incoming.get(target) + 1);
  const ready = [...incoming].filter(([, count]) => count === 0).map(([id]) => id).sort(compareRaw); const ordered = [];
  while (ready.length > 0) {
    const id = ready.shift(); ordered.push(id);
    for (const target of [...outgoing.get(id)].sort(compareRaw)) { incoming.set(target, incoming.get(target) - 1); if (incoming.get(target) === 0) ready.push(target); }
    ready.sort(compareRaw);
  }
  if (ordered.length !== capabilities.length) fail('COMPOSE_PROGRAM_UNIT_ORDER', 'selected capability order is cyclic');
  return ordered;
}

function normalizeProgramUnit(input, index, context) {
  exactKeys(input, ['id', 'kind', 'surface', 'contributors', 'functions', 'effectOrder'], 'COMPOSE_PROGRAM_UNIT_FIELDS', `program unit ${index}`);
  assertNamespacedId(input.id, 'COMPOSE_PROGRAM_UNIT_ID', `program unit ${index} id`);
  const kind = assertEnum(input.kind, ['owner', 'stage-capability', 'entry-point'], 'COMPOSE_PROGRAM_UNIT_KIND', `${input.id} kind`);
  if (input.surface !== null) assertNamespacedId(input.surface, 'COMPOSE_PROGRAM_UNIT_SURFACE', `${input.id} surface`);
  if (kind === 'stage-capability' && !context.stageResult?.normalized.surfaces.some(({ id }) => id === input.surface)) fail('COMPOSE_PROGRAM_UNIT_SURFACE', `${input.id} surface is not selected`);
  if (kind !== 'stage-capability' && input.surface !== null) fail('COMPOSE_PROGRAM_UNIT_SURFACE', `${input.id} cannot name a surface`);
  for (const key of ['contributors', 'functions', 'effectOrder']) if (!Array.isArray(input[key])) fail('COMPOSE_PROGRAM_UNIT_FIELDS', `${input.id} ${key} must be an array`);
  const contributors = [...input.contributors].sort(compareRaw); const functions = [...input.functions].sort(compareRaw);
  if (contributors.length === 0 || functions.length === 0 || new Set(contributors).size !== contributors.length || new Set(functions).size !== functions.length) fail('COMPOSE_PROGRAM_UNIT_COVERAGE', `${input.id} contributors/functions are invalid`);
  for (const contributor of contributors) if (!context.semanticOwners.has(contributor)) fail('COMPOSE_PROGRAM_UNIT_OWNER', `${input.id} names unselected contributor ${contributor}`);
  for (const name of functions) if (!context.functionByName.has(name)) fail('COMPOSE_PROGRAM_UNIT_FUNCTION', `${input.id} names unknown function ${name}`);
  const effectOrder = [...input.effectOrder];
  if (new Set(effectOrder).size !== effectOrder.length || effectOrder.some((owner) => !contributors.includes(owner))) fail('COMPOSE_PROGRAM_UNIT_ORDER', `${input.id} effect order is invalid`);
  if (kind === 'stage-capability') {
    const selectedCapabilities = context.stageResult.normalized.capabilities.filter(({ bindings }) => bindings.includes(input.surface));
    const expected = canonicalCapabilityOrder(selectedCapabilities);
    if (contributors.length !== expected.length || expected.some((owner) => !contributors.includes(owner)) || effectOrder.length !== expected.length || effectOrder.some((owner, orderIndex) => owner !== expected[orderIndex])) fail('COMPOSE_PROGRAM_UNIT_ORDER', `${input.id} omits or reorders a selected surface capability`);
  } else if (effectOrder.length !== 0) fail('COMPOSE_PROGRAM_UNIT_ORDER', `${input.id} has semantic order outside a Stage surface`);
  return { id: input.id, kind, surface: input.surface, contributors, functions, effectOrder };
}

function normalizePublicRequirement(input, index, context) {
  exactKeys(input, ['contract', 'consumers', 'qualification'], 'COMPOSE_PUBLIC_REQUIREMENT_FIELDS', `public requirement ${index}`);
  const contract = normalizeSchemaReference(input.contract, `public requirement ${index} contract`);
  if (!Array.isArray(input.consumers) || input.consumers.length === 0) fail('COMPOSE_PUBLIC_REQUIREMENT_CONSUMER', `${contract.id} has no consumer`);
  const consumers = [...input.consumers].sort(compareRaw);
  for (const consumer of consumers) if (!context.semanticOwners.has(consumer)) fail('COMPOSE_PUBLIC_REQUIREMENT_CONSUMER', `${contract.id} names unselected ${consumer}`);
  if (!context.availableRequirements.has(contract.id)) fail('COMPOSE_UNSUPPORTED_CAPABILITY', `${contract.id} is unavailable before ignition`);
  return { contract, consumers, qualification: assertEnum(input.qualification, ['portable', 'native-compatible-pair'], 'COMPOSE_PUBLIC_REQUIREMENT_QUALIFICATION', `${contract.id} qualification`) };
}

function expectedRequirementKeys(context) {
  const expected = new Map();
  for (const id of BASE_REQUIREMENTS) expected.set(id, context.requirementById.get(id));
  for (const result of context.profileResults ?? []) {
    for (const requirement of result?.normalized?.programContribution?.requirements ?? []) expected.set(requirement.id, requirement);
  }
  return expected;
}

function normalizeResource(input, index, context) {
  exactKeys(input, ['id', 'ownerProfile', 'providerRequirement', 'materialization', 'unit', 'capacity', 'alignment', 'memorySpaces', 'access'], 'COMPOSE_RESOURCE_FIELDS', `resource ${index}`);
  assertNamespacedId(input.id, 'COMPOSE_RESOURCE_ID', `resource ${index} id`);
  if (input.ownerProfile !== context.resourceResult.normalized.id) fail('COMPOSE_RESOURCE_OWNER', `${input.id} has the wrong resource-plan owner`);
  const provider = context.providerById.get(input.providerRequirement);
  if (!provider) fail('COMPOSE_RESOURCE_PROVIDER', `${input.id} names unknown provider requirement`);
  const materialization = assertEnum(input.materialization, ['resident-storage', 'semantic-only'], 'COMPOSE_RESOURCE_MATERIALIZATION', `${input.id} materialization`);
  const expectedMaterialization = provider.unit === 'bytes' && provider.memorySpaces.some((space) => ['device-search', 'device-publication'].includes(space)) ? 'resident-storage' : 'semantic-only';
  if (materialization !== expectedMaterialization || input.unit !== provider.unit || input.capacity !== provider.capacity || input.alignment !== provider.alignment) fail('COMPOSE_RESOURCE_PROVIDER', `${input.id} differs from ${provider.id}`);
  const memorySpaces = [...input.memorySpaces].sort(compareRaw); const access = [...input.access].sort(compareRaw);
  if (memorySpaces.join('\0') !== [...provider.memorySpaces].sort(compareRaw).join('\0') || access.join('\0') !== [...provider.access].sort(compareRaw).join('\0')) fail('COMPOSE_RESOURCE_PROVIDER', `${input.id} access differs from ${provider.id}`);
  return { id: input.id, ownerProfile: input.ownerProfile, providerRequirement: input.providerRequirement, materialization, unit: input.unit, capacity: normalizeDecimalUint(input.capacity), alignment: positiveDecimal(input.alignment, 'COMPOSE_RESOURCE_ALIGNMENT', `${input.id} alignment`), memorySpaces, access };
}

function normalizeSideband(input, index, context) {
  exactKeys(input, ['id', 'semanticOwner', 'role', 'direction', 'valueType', 'capacity', 'publication', 'applicationPoint', 'lifetime', 'residentResource', 'semantics', 'cleanup'], 'COMPOSE_SIDEBAND_FIELDS', `sideband ${index}`);
  assertNamespacedId(input.id, 'COMPOSE_SIDEBAND_ID', `sideband ${index} id`);
  if (!context.semanticOwners.has(input.semanticOwner)) fail('COMPOSE_SIDEBAND_OWNER', `${input.id} names unselected semantic owner ${input.semanticOwner}`);
  assertString(input.role, /^[a-z][a-z0-9-]*$/, 'COMPOSE_SIDEBAND_ROLE', `${input.id} role`);
  const direction = assertEnum(input.direction, ['host-to-device', 'device-to-host'], 'COMPOSE_SIDEBAND_DIRECTION', `${input.id} direction`);
  const valueType = assertEnum(input.valueType, ['u32'], 'COMPOSE_SIDEBAND_VALUE', `${input.id} valueType`);
  const capacity = positiveDecimal(input.capacity, 'COMPOSE_SIDEBAND_CAPACITY', `${input.id} capacity`);
  if (input.publication !== 'release-acquire') fail('COMPOSE_SIDEBAND_PUBLICATION', `${input.id} publication contract is unsupported`);
  const lifetime = assertEnum(input.lifetime, ['operation', 'session'], 'COMPOSE_SIDEBAND_LIFETIME', `${input.id} lifetime`);
  let residentResource = null;
  if (input.residentResource !== null) {
    assertNamespacedId(input.residentResource, 'COMPOSE_SIDEBAND_PAYLOAD', `${input.id} residentResource`);
    const resource = context.resourceById.get(input.residentResource);
    if (!resource || resource.materialization !== 'resident-storage') fail('COMPOSE_SIDEBAND_PAYLOAD', `${input.id} residentResource is not resident storage`);
    residentResource = input.residentResource;
  }
  if (!context.publicRequirements.some(({ contract }) => contract.id === 'cuda-js.publication-mailbox/0.1.0')) fail('COMPOSE_SIDEBAND_CAPABILITY', `${input.id} lacks the selected public publication capability`);
  return {
    id: input.id, semanticOwner: input.semanticOwner, role: input.role, direction, valueType, capacity,
    publication: input.publication,
    applicationPoint: normalizeSchemaReference(input.applicationPoint, `${input.id} applicationPoint`),
    lifetime, residentResource,
    semantics: normalizeSchemaReference(input.semantics, `${input.id} semantics`),
    cleanup: normalizeSchemaReference(input.cleanup, `${input.id} cleanup`),
  };
}

function normalizeBinding(input, operationId, index, parameters, resources, sidebands) {
  exactKeys(input, ['parameter', 'source'], 'COMPOSE_OPERATION_BINDING_FIELDS', `${operationId} binding ${index}`);
  const parameter = parameters.find(({ name }) => name === input.parameter);
  if (!parameter) fail('COMPOSE_OPERATION_BINDING', `${operationId} binds unknown parameter ${input.parameter}`);
  if (input.source?.kind === 'resource') {
    const hasAccess = Object.hasOwn(input.source, 'access');
    exactKeys(input.source, hasAccess ? ['kind', 'resource', 'access'] : ['kind', 'resource'], 'COMPOSE_OPERATION_BINDING_FIELDS', `${operationId} ${input.parameter} resource`);
    const resource = resources.get(input.source.resource);
    if (!resource || resource.materialization !== 'resident-storage' || !parameter.type.startsWith('ptr<')) fail('COMPOSE_OPERATION_BINDING', `${operationId} resource binding is incompatible`);
    const source = { kind: 'resource', resource: input.source.resource };
    if (hasAccess) {
      const access = assertEnum(input.source.access, ['read', 'write', 'read-write'], 'COMPOSE_OPERATION_ACCESS', `${operationId} ${input.parameter} access`);
      if ((access === 'read' || access === 'read-write') && !resource.access.includes('read')) fail('COMPOSE_OPERATION_ACCESS', `${operationId} ${input.parameter} read access exceeds the resource envelope`);
      if ((access === 'write' || access === 'read-write') && !resource.access.includes('write')) fail('COMPOSE_OPERATION_ACCESS', `${operationId} ${input.parameter} write access exceeds the resource envelope`);
      source.access = access;
    }
    return { parameter: input.parameter, source };
  }
  if (input.source?.kind === 'sideband') {
    exactKeys(input.source, ['kind', 'sideband'], 'COMPOSE_OPERATION_BINDING_FIELDS', `${operationId} ${input.parameter} sideband`);
    const sideband = sidebands.get(input.source.sideband);
    if (!sideband || parameter.type !== `sideband<${sideband.direction},${sideband.valueType}>` || parameter.sidebandRole !== sideband.role) fail('COMPOSE_OPERATION_BINDING', `${operationId} sideband binding is incompatible`);
    return { parameter: input.parameter, source: { kind: 'sideband', sideband: input.source.sideband } };
  }
  if (Object.hasOwn(input.source ?? {}, 'access')) fail('COMPOSE_OPERATION_ACCESS', `${operationId} ${input.parameter} scalar binding cannot carry access`);
  exactKeys(input.source, ['kind', 'schema'], 'COMPOSE_OPERATION_BINDING_FIELDS', `${operationId} ${input.parameter} scalar`);
  if (input.source.kind !== 'scalar' || parameter.type.startsWith('ptr<') || parameter.type.startsWith('sideband<')) fail('COMPOSE_OPERATION_BINDING', `${operationId} scalar binding is incompatible`);
  return { parameter: input.parameter, source: { kind: 'scalar', schema: normalizeSchemaReference(input.source.schema, `${operationId} ${input.parameter} scalar schema`) } };
}

function normalizeDim3(input, label) {
  if (!Array.isArray(input) || input.length !== 3) fail('COMPOSE_OPERATION_DIMENSION', `${label} must have three dimensions`);
  return input.map((value, index) => positiveDecimal(value, 'COMPOSE_OPERATION_DIMENSION', `${label} ${index}`));
}

function normalizeOperation(input, index, context) {
  exactKeys(input, ['id', 'entryPoint', 'bindings', 'grid', 'block', 'dynamicSharedBytes', 'maxPending'], 'COMPOSE_OPERATION_FIELDS', `operation ${index}`);
  assertNamespacedId(input.id, 'COMPOSE_OPERATION_ID', `operation ${index} id`);
  const entryPoint = context.functionByName.get(input.entryPoint);
  if (!entryPoint || entryPoint.executionRole !== 'runtime-entry') fail('COMPOSE_OPERATION_ENTRY', `${input.id} entry point is not a kernel`);
  if (!Array.isArray(input.bindings)) fail('COMPOSE_OPERATION_BINDING', `${input.id} bindings must be an array`);
  const bindings = input.bindings.map((binding, bindingIndex) => normalizeBinding(binding, input.id, bindingIndex, entryPoint.parameters, context.resourceById, context.sidebandById)).sort((left, right) => compareRaw(left.parameter, right.parameter));
  uniqueBy(bindings, 'parameter', 'COMPOSE_OPERATION_BINDING', `${input.id} binding`);
  if (bindings.length !== entryPoint.parameters.length) fail('COMPOSE_OPERATION_BINDING', `${input.id} does not bind every parameter`);
  return { id: input.id, entryPoint: input.entryPoint, bindings, grid: normalizeDim3(input.grid, `${input.id} grid`), block: normalizeDim3(input.block, `${input.id} block`), dynamicSharedBytes: normalizeDecimalUint(input.dynamicSharedBytes), maxPending: positiveDecimal(input.maxPending, 'COMPOSE_OPERATION_PENDING', `${input.id} maxPending`) };
}

function normalizeManifests(input) {
  const keys = ['result', 'observation', 'diagnostic', 'cancellation', 'completion', 'cleanup'];
  exactKeys(input, keys, 'COMPOSE_MANIFEST_FIELDS', 'manifests');
  return Object.fromEntries(keys.map((key) => [key, normalizeSchemaReference(input[key], `${key} manifest`)]));
}

function normalizeCompatibility(input, context) {
  exactKeys(input, ['cudaJs', 'apiSchema', 'capabilityNegotiation', 'fallback', 'requiredEvidence'], 'COMPOSE_COMPATIBILITY_FIELDS', 'compatibility');
  exactKeys(input.cudaJs, ['repository', 'revision', 'package'], 'COMPOSE_CUDA_JS_FIELDS', 'compatibility cudaJs');
  if (input.cudaJs.repository !== 'iteathen/CUDA-JS' || input.cudaJs.revision !== context.cudaJs.revision || input.cudaJs.package !== context.cudaJs.package) fail('COMPOSE_CUDA_JS_IDENTITY', 'CUDA-JS identity differs from the injected public boundary');
  if (input.apiSchema !== context.cudaJs.apiSchema || input.capabilityNegotiation !== 'pre-allocation-fail-closed' || input.fallback !== 'none') fail('COMPOSE_COMPATIBILITY', 'compatibility policy is invalid');
  if (!Array.isArray(input.requiredEvidence) || input.requiredEvidence.length === 0) fail('COMPOSE_COMPATIBILITY', 'required evidence is absent');
  const requiredEvidence = input.requiredEvidence.map((entry, index) => normalizeSchemaReference(entry, `required evidence ${index}`)).sort((left, right) => compareRaw(schemaKey(left), schemaKey(right)));
  return { cudaJs: { ...input.cudaJs }, apiSchema: input.apiSchema, capabilityNegotiation: input.capabilityNegotiation, fallback: input.fallback, requiredEvidence };
}

function normalizeDeletion(input, context) {
  exactKeys(input, ['selectedOwners', 'records', 'comparison', 'absence'], 'COMPOSE_DELETION_FIELDS', 'deletion');
  if (input.comparison !== 'byte-exact-except-truthful-selected-owner-identities' || input.absence !== 'structural-omission-no-placeholder') fail('COMPOSE_DELETION_POLICY', 'deletion policy is invalid');
  const selectedOwners = [...input.selectedOwners].sort(compareRaw);
  if (selectedOwners.length !== context.semanticOwners.size || selectedOwners.some((owner, index) => owner !== [...context.semanticOwners].sort(compareRaw)[index])) fail('COMPOSE_DELETION_OWNER', 'deletion owner set differs from selected semantics');
  if (!Array.isArray(input.records) || input.records.length === 0) fail('COMPOSE_DELETION_RECORD', 'deletion records are absent');
  const records = input.records.map((record, index) => {
    const recordFields = ['owner', 'sourceUnits', 'functions', 'resources', 'publicRequirements', 'packageRecords'];
    if (context.sidebandsDeclared) recordFields.splice(recordFields.indexOf('packageRecords'), 0, 'sidebands');
    exactKeys(record, recordFields, 'COMPOSE_DELETION_RECORD_FIELDS', `deletion record ${index}`);
    if (!context.semanticOwners.has(record.owner)) fail('COMPOSE_DELETION_OWNER', `deletion record ${record.owner} is not selected`);
    const normalized = { owner: record.owner };
    const recordLists = ['sourceUnits', 'functions', 'resources', 'publicRequirements', 'packageRecords'];
    if (context.sidebandsDeclared) recordLists.splice(recordLists.indexOf('packageRecords'), 0, 'sidebands');
    for (const key of recordLists) {
      if (!Array.isArray(record[key])) fail('COMPOSE_DELETION_RECORD', `${record.owner} ${key} must be an array`);
      normalized[key] = [...record[key]].sort(compareRaw);
      if (new Set(normalized[key]).size !== normalized[key].length) fail('COMPOSE_DELETION_RECORD', `${record.owner} repeats ${key}`);
    }
    return normalized;
  }).sort((left, right) => compareRaw(left.owner, right.owner));
  uniqueBy(records, 'owner', 'COMPOSE_DELETION_OWNER', 'deletion owner');
  if (records.length !== selectedOwners.length) fail('COMPOSE_DELETION_OWNER', 'every selected owner requires one deletion record');
  const coverage = new Map([['sourceUnits', context.sourceUnits.map(({ id }) => id)], ['functions', context.functions.map(({ name }) => name)], ['resources', context.resources.map(({ id }) => id)], ['publicRequirements', context.publicRequirements.map(({ contract }) => contract.id)]]);
  if (context.sidebandsDeclared) coverage.set('sidebands', context.sidebands.map(({ id }) => id));
  for (const [key, expected] of coverage) for (const id of expected) if (!records.some((record) => record[key].includes(id))) fail('COMPOSE_DELETION_COVERAGE', `${key} ${id} has no deletion owner`);
  const same = (left, right) => left.length === right.length && left.every((value, index) => value === right[index]);
  for (const record of records) {
    const expectedSourceUnits = context.sourceUnits.filter(({ semanticOwner }) => semanticOwner === record.owner).map(({ id }) => id).sort(compareRaw);
    const expectedFunctions = context.functions.filter(({ sourceUnit }) => expectedSourceUnits.includes(sourceUnit)).map(({ name }) => name).sort(compareRaw);
    const expectedResources = context.resources.filter(({ ownerProfile }) => ownerProfile === record.owner).map(({ id }) => id).sort(compareRaw);
    const expectedRequirements = context.publicRequirements.filter(({ consumers }) => consumers.includes(record.owner)).map(({ contract }) => contract.id).sort(compareRaw);
    const expectedSidebands = context.sidebands.filter(({ semanticOwner }) => semanticOwner === record.owner).map(({ id }) => id).sort(compareRaw);
    const expectedPackageRecords = record.owner === context.compositionProfileId ? ['package.execution-operation'] : [];
    if (!same(record.sourceUnits, expectedSourceUnits) || !same(record.functions, expectedFunctions) || !same(record.resources, expectedResources)
        || !same(record.publicRequirements, expectedRequirements) || (context.sidebandsDeclared && !same(record.sidebands, expectedSidebands)) || !same(record.packageRecords, expectedPackageRecords)) {
      fail('COMPOSE_DELETION_OWNERSHIP', `${record.owner} deletion record differs from authoritative ownership`);
    }
  }
  return { selectedOwners, records, comparison: input.comparison, absence: input.absence };
}

function semanticEngineIdentity(semanticEngine) {
  return canonicalIdentity(semanticEngine);
}

export function normalizeProgramPackageProfile(input, inspected, suppliedContext) {
  const sidebandsDeclared = Object.hasOwn(input, 'sidebands');
  const rootFields = ['schema', 'representation', 'status', 'contract', 'id', 'version', 'semanticEngine', 'generator', 'sourceUnits', 'functions', 'programUnits', 'publicRequirements', 'resources', 'operations', 'manifests', 'provenance', 'compatibility', 'deletion'];
  if (sidebandsDeclared) rootFields.splice(rootFields.indexOf('operations'), 0, 'sidebands');
  exactKeys(input, rootFields, 'COMPOSE_ROOT_FIELDS', 'program/package profile');
  if (input.schema !== PROFILE_SCHEMA || input.representation !== REPRESENTATION || input.status !== 'accepted') fail('COMPOSE_SCHEMA', 'unsupported program/package schema/representation/status');
  assertNamespacedId(input.id, 'COMPOSE_PROFILE_ID', 'program/package profile id'); assertVersion(input.version, 'COMPOSE_PROFILE_VERSION', 'program/package profile version');
  const generator = normalizeProgramGenerator(input.generator);
  const profileResults = suppliedContext.profileResults ?? [];
  const profileById = new Map(profileResults.map((result) => [result.normalized.id, result]));
  if (profileById.size !== profileResults.length) fail('COMPOSE_CONTEXT_PROFILE', 'context repeats a profile');
  const context = {
    ...suppliedContext,
    generator,
    compositionProfileId: input.id,
    profileById,
    composerContributionIdentity: suppliedContext.composerContributionIdentity,
    semanticOwners: new Set([input.id]),
    requirementById: suppliedContext.requirementById,
    availableRequirements: suppliedContext.availableRequirements,
  };
  exactKeys(input.semanticEngine, ['contractSet', 'authority', 'profiles', 'resourcePlan', 'progressPlan', 'outputProfile', 'sessionProfile', 'stageProfile', 'channelProfile'], 'COMPOSE_ENGINE_FIELDS', 'semanticEngine');
  const contractSet = normalizeContentIdentity(input.semanticEngine.contractSet, 'COMPOSE_CONTRACT_SET', 'semanticEngine contractSet');
  if (contractSet.sha256 !== inspected.identities.contractSet.sha256) fail('COMPOSE_CONTRACT_SET', 'semanticEngine contract set differs from inspected input');
  exactKeys(input.semanticEngine.authority, ['repository', 'revision'], 'COMPOSE_AUTHORITY_FIELDS', 'semanticEngine authority');
  if (input.semanticEngine.authority.repository !== 'iteathen/CUDA-MCGS' || input.semanticEngine.authority.revision !== suppliedContext.authorityRevision) fail('COMPOSE_AUTHORITY', 'semanticEngine authority differs from the frozen input');
  if (!Array.isArray(input.semanticEngine.profiles)) fail('COMPOSE_PROFILE_COUNT', 'semanticEngine profiles must be an array');
  const profiles = input.semanticEngine.profiles.map((profile, index) => normalizeProfileReference(profile, `semanticEngine profile ${index}`)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(profiles, 'id', 'COMPOSE_PROFILE_DUPLICATE', 'semanticEngine profile');
  const expectedProfiles = profileResults.map(resultReference).sort((left, right) => compareRaw(left.id, right.id));
  if (profiles.length !== expectedProfiles.length || profiles.some((profile, index) => profileKey(profile) !== profileKey(expectedProfiles[index]))) fail('COMPOSE_PROFILE_CLOSURE', 'semanticEngine profiles differ from selected owner outputs');
  const verifyRequired = (inputReference, result, label) => { const normalized = normalizeProfileReference(inputReference, label); if (profileKey(normalized) !== profileKey(resultReference(result))) fail('COMPOSE_PROFILE_CLOSURE', `${label} differs from selected output`); return normalized; };
  const semanticEngine = {
    contractSet,
    authority: { ...input.semanticEngine.authority },
    profiles,
    resourcePlan: verifyRequired(input.semanticEngine.resourcePlan, suppliedContext.resourceResult, 'resourcePlan'),
    progressPlan: verifyRequired(input.semanticEngine.progressPlan, suppliedContext.progressResult, 'progressPlan'),
    outputProfile: verifyRequired(input.semanticEngine.outputProfile, suppliedContext.outputResult, 'outputProfile'),
    sessionProfile: normalizeOptionalReference(input.semanticEngine.sessionProfile, suppliedContext.sessionResult ?? null, 'sessionProfile'),
    stageProfile: normalizeOptionalReference(input.semanticEngine.stageProfile, suppliedContext.stageResult ?? null, 'stageProfile'),
    channelProfile: normalizeOptionalReference(input.semanticEngine.channelProfile, suppliedContext.channelResult ?? null, 'channelProfile'),
  };
  for (const profile of profiles) context.semanticOwners.add(profile.id);
  for (const capability of suppliedContext.stageResult?.normalized.capabilities ?? []) context.semanticOwners.add(capability.id);
  for (const channel of suppliedContext.channelResult?.normalized.channels ?? []) context.semanticOwners.add(channel.id);

  if (!Array.isArray(input.sourceUnits)) fail('COMPOSE_SOURCE_UNIT_COUNT', 'sourceUnits must be an array');
  const sourceUnits = input.sourceUnits.map((unit, index) => normalizeSourceUnit(unit, index, context)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(sourceUnits, 'id', 'COMPOSE_SOURCE_UNIT_DUPLICATE', 'source unit');
  const composedSourceBytes = sourceUnits.reduce((total, { source }) => total + BigInt(Buffer.byteLength(source, 'utf8')), 0n);
  if (composedSourceBytes > BigInt(generator.maxSourceBytes)) fail('COMPOSE_SOURCE_BOUNDS', 'composed source exceeds maxSourceBytes');
  context.sourceUnitById = new Map(sourceUnits.map((unit) => [unit.id, unit])); context.sourceUnits = sourceUnits;
  for (const result of profileResults.filter((result) => programContributionIdentity(result))) if (!sourceUnits.some(({ ownerProfile }) => ownerProfile === result.normalized.id)) fail('COMPOSE_SOURCE_OWNER', `${result.normalized.id} has no selected source unit`);

  if (!Array.isArray(input.functions) || input.functions.length === 0) fail('COMPOSE_FUNCTION_COUNT', 'functions must be a non-empty array');
  const functions = input.functions.map((entry, index) => normalizeFunction(entry, index, context)).sort((left, right) => compareRaw(left.name, right.name));
  uniqueBy(functions, 'name', 'COMPOSE_FUNCTION_DUPLICATE', 'function');
  if (BigInt(functions.length) > BigInt(generator.maxFunctions)) fail('COMPOSE_FUNCTION_BOUNDS', 'function count exceeds maxFunctions');
  context.functionByName = new Map(functions.map((entry) => [entry.name, entry])); context.functions = functions;
  for (const unit of sourceUnits) if (unit.functions.length !== functions.filter(({ sourceUnit }) => sourceUnit === unit.id).length) fail('COMPOSE_FUNCTION_SOURCE', `${unit.id} function mapping is incomplete`);
  validateCallGraph(functions, generator.maxCallDepth);

  const programUnits = input.programUnits.map((entry, index) => normalizeProgramUnit(entry, index, context)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(programUnits, 'id', 'COMPOSE_PROGRAM_UNIT_DUPLICATE', 'program unit');
  const coveredFunctions = programUnits.flatMap(({ functions: names }) => names);
  if (coveredFunctions.length !== functions.length || new Set(coveredFunctions).size !== functions.length) fail('COMPOSE_PROGRAM_UNIT_COVERAGE', 'program units must own every function exactly once');

  if (!Array.isArray(input.publicRequirements)) fail('COMPOSE_PUBLIC_REQUIREMENT_COUNT', 'publicRequirements must be an array');
  const publicRequirements = input.publicRequirements.map((entry, index) => normalizePublicRequirement(entry, index, context)).sort((left, right) => compareRaw(schemaKey(left.contract), schemaKey(right.contract)));
  uniqueBy(publicRequirements.map(({ contract }) => ({ id: contract.id })), 'id', 'COMPOSE_PUBLIC_REQUIREMENT_DUPLICATE', 'public requirement');
  const expectedRequirements = expectedRequirementKeys(context);
  if (publicRequirements.length !== expectedRequirements.size
      || [...expectedRequirements].some(([id, expected]) => !publicRequirements.some(({ contract }) => contract.id === id && schemaKey(contract) === schemaKey(expected)))) {
    fail('COMPOSE_PUBLIC_REQUIREMENT_CLOSURE', 'public requirements differ from the exact selected-owner set');
  }
  for (const fn of functions) for (const helper of fn.helpers) {
    const requirement = HELPER_REQUIREMENTS.get(helper);
    if (requirement && !publicRequirements.some(({ contract }) => contract.id === requirement)) fail('COMPOSE_HELPER_REQUIREMENT', `${fn.name} helper lacks ${requirement}`);
  }
  context.publicRequirements = publicRequirements;

  context.resourceResult = suppliedContext.resourceResult;
  context.providerById = new Map(suppliedContext.resourceResult.normalized.providerRequirements.map((entry) => [entry.id, entry]));
  if (!Array.isArray(input.resources)) fail('COMPOSE_RESOURCE_COUNT', 'resources must be an array');
  const resources = input.resources.map((entry, index) => normalizeResource(entry, index, context)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(resources, 'id', 'COMPOSE_RESOURCE_DUPLICATE', 'resource'); uniqueBy(resources, 'providerRequirement', 'COMPOSE_RESOURCE_PROVIDER', 'resource provider');
  if (resources.length !== context.providerById.size) fail('COMPOSE_RESOURCE_COVERAGE', 'resources do not cover every provider requirement');
  context.resourceById = new Map(resources.map((entry) => [entry.id, entry])); context.resources = resources;

  let sidebands = [];
  if (sidebandsDeclared) {
    if (!Array.isArray(input.sidebands) || input.sidebands.length === 0) fail('COMPOSE_SIDEBAND_COUNT', 'sidebands must be a non-empty array when declared');
    sidebands = input.sidebands.map((entry, index) => normalizeSideband(entry, index, context)).sort((left, right) => compareRaw(left.id, right.id));
    uniqueBy(sidebands, 'id', 'COMPOSE_SIDEBAND_DUPLICATE', 'sideband');
  }
  context.sidebandsDeclared = sidebandsDeclared;
  context.sidebands = sidebands;
  context.sidebandById = new Map(sidebands.map((entry) => [entry.id, entry]));

  const operations = input.operations.map((entry, index) => normalizeOperation(entry, index, context)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(operations, 'id', 'COMPOSE_OPERATION_DUPLICATE', 'operation');
  const kernels = functions.filter(({ executionRole }) => executionRole === 'runtime-entry');
  if (operations.length !== kernels.length || kernels.some(({ name }) => !operations.some(({ entryPoint }) => entryPoint === name))) fail('COMPOSE_OPERATION_COVERAGE', 'every kernel requires one operation blueprint');
  const manifests = normalizeManifests(input.manifests); const provenance = normalizeProvenance(input.provenance, 'composition profile provenance'); const compatibility = normalizeCompatibility(input.compatibility, context);
  context.operations = operations;
  const deletion = normalizeDeletion(input.deletion, context);
  const normalized = {
    schema: input.schema, representation: input.representation, status: input.status, contract: normalizeCatalogContract(input.contract, inspected), id: input.id, version: input.version,
    semanticEngine, generator, sourceUnits, functions, programUnits, publicRequirements, resources,
    ...(sidebandsDeclared ? { sidebands } : {}),
    operations, manifests, provenance, compatibility, deletion,
  };
  return { normalized, identity: canonicalIdentity(normalized), semanticEngineIdentity: semanticEngineIdentity(semanticEngine) };
}

export function composeSearchProgram(profileResult) {
  if (!profileResult?.normalized || !profileResult?.identity || !profileResult?.semanticEngineIdentity) fail('COMPOSE_PROFILE_REQUIRED', 'normalized composition profile is required');
  const profile = profileResult.normalized;
  const source = profile.sourceUnits.map(({ source: unitSource }) => unitSource).join('');
  if (BigInt(Buffer.byteLength(source, 'utf8')) > BigInt(profile.generator.maxSourceBytes)) fail('COMPOSE_SOURCE_BOUNDS', 'composed source exceeds maxSourceBytes');
  const functions = profile.functions.map((entry) => ({ ...entry, parameters: entry.parameters.map((parameter) => ({ ...parameter })), calls: [...entry.calls], helpers: [...entry.helpers] }));
  const entryPoints = functions.filter(({ executionRole }) => executionRole === 'runtime-entry').map(({ name, semanticRole }) => ({ role: semanticRole, function: name })).sort((left, right) => compareRaw(left.role, right.role));
  const normalized = {
    schema: SEARCH_PROGRAM_SCHEMA,
    status: 'accepted',
    language: 'restricted-device-js',
    semanticEngineIdentity: identityReference(profileResult.semanticEngineIdentity),
    compositionProfileIdentity: identityReference(profileResult.identity),
    generator: { ...profile.generator },
    source,
    sourceIdentity: sourceIdentity(source),
    sourceMap: profile.sourceUnits.map(({ id, ownerProfile, semanticOwner, sourceIdentity: identity, functions: names }) => ({ id, ownerProfile, semanticOwner, sourceIdentity: { ...identity }, functions: [...names] })),
    functions,
    programUnits: profile.programUnits.map((entry) => ({ ...entry, contributors: [...entry.contributors], functions: [...entry.functions], effectOrder: [...entry.effectOrder] })),
    entryPoints,
    publicRequirements: profile.publicRequirements.map((entry) => ({ contract: { ...entry.contract }, consumers: [...entry.consumers], qualification: entry.qualification })),
    resources: profile.resources.map((entry) => ({ ...entry, memorySpaces: [...entry.memorySpaces], access: [...entry.access] })),
    ...(Object.hasOwn(profile, 'sidebands') ? { sidebands: profile.sidebands.map((entry) => structuredClone(entry)) } : {}),
    operations: profile.operations.map((entry) => ({ ...entry, bindings: structuredClone(entry.bindings), grid: [...entry.grid], block: [...entry.block],  })),
    manifests: structuredClone(profile.manifests),
    provenance: structuredClone(profile.provenance),
    deletion: structuredClone(profile.deletion),
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}

function buildCudaJsAdapterRequirements(program) {
  const resources = program.resources.filter(({ materialization }) => materialization === 'resident-storage');
  const resourceNames = new Map(resources.map((entry, index) => [entry.id, `resource-${index}`]));
  const sidebands = program.sidebands ?? [];
  const frameworkCancellation = sidebands.filter(({ role }) => role === 'framework-cancellation');
  if (frameworkCancellation.length !== 1) fail('COMPOSE_SIDEBAND_REQUIRED', 'runtime realization requires exactly one framework-cancellation sideband');
  if (!program.publicRequirements.some(({ contract }) => contract.id === 'cuda-js.publication-mailbox/0.1.0')) fail('COMPOSE_SIDEBAND_CAPABILITY', 'runtime realization requires the selected public publication capability');
  const sidebandNames = new Map(sidebands.map((entry, index) => [entry.id, `sideband-${index}`]));
  for (const operation of program.operations) for (const binding of operation.bindings) {
    if (binding.source.kind === 'resource' && !Object.hasOwn(binding.source, 'access')) {
      fail('COMPOSE_OPERATION_ACCESS_REQUIRED', `${operation.id} ${binding.parameter} lacks operation-local resource access`);
    }
  }
  const operations = program.operations.map((entry, index) => ({
    id: `operation-${index}`,
    function: entry.entryPoint,
    bindings: entry.bindings.map((binding) => {
      if (binding.source.kind === 'resource') return { parameter: binding.parameter, source: { kind: 'resource', resource: resourceNames.get(binding.source.resource), access: binding.source.access } };
      if (binding.source.kind === 'sideband') return { parameter: binding.parameter, source: { kind: 'sideband', sideband: sidebandNames.get(binding.source.sideband) } };
      return { parameter: binding.parameter, source: { kind: 'scalar', schema: { ...binding.source.schema } } };
    }),
    launchPolicy: { grid: [...entry.grid], block: [...entry.block], dynamicSharedBytes: entry.dynamicSharedBytes, maxPending: entry.maxPending },
  }));
  return {
    schema: CUDA_JS_ADAPTER_REQUIREMENTS_SCHEMA,
    publicContracts: program.publicRequirements.map(({ contract }) => ({ ...contract })),
    searchProgram: { source: program.source, functions: program.functions.map(({ name, executionRole, parameters, returns }) => ({ name, executionRole, parameters: parameters.map((parameter) => ({ ...parameter })), returns })) },
    resourceRequirements: resources.map((entry, index) => ({ id: `resource-${index}`, byteLength: entry.capacity, alignment: entry.alignment, memorySpaces: [...entry.memorySpaces], accessRequirements: [...entry.access] })),
    sidebandRequirements: sidebands.map((entry, index) => ({
      id: `sideband-${index}`, role: entry.role, direction: entry.direction, valueType: entry.valueType,
      capacity: entry.capacity, publication: entry.publication, applicationPoint: { ...entry.applicationPoint }, lifetime: entry.lifetime,
      residentResource: entry.residentResource === null ? null : resourceNames.get(entry.residentResource), semantics: { ...entry.semantics }, cleanup: { ...entry.cleanup },
    })),
    operationRequirements: operations,
    searchLifecycle: { ignition: 'device-owned', cancellation: 'bounded-external-intent', completion: 'device-owned-closure' },
  };
}

export function buildExecutionPackage(profileResult, programResult) {
  if (!profileResult?.normalized || !programResult?.normalized) fail('COMPOSE_PACKAGE_INPUT', 'normalized profile and Search Program are required');
  const profile = profileResult.normalized; const program = programResult.normalized;
  if (program.compositionProfileIdentity.sha256 !== profileResult.identity.sha256) fail('COMPOSE_PACKAGE_INPUT', 'Search Program does not match composition profile');
  const normalized = {
    schema: EXECUTION_PACKAGE_SCHEMA,
    status: 'accepted',
    semantic: {
      engineIdentity: identityReference(profileResult.semanticEngineIdentity),
      selectedProfiles: structuredClone(profile.semanticEngine.profiles),
      entryPointRoles: structuredClone(program.entryPoints),
      resourcePlan: structuredClone(profile.semanticEngine.resourcePlan),
      progressPlan: structuredClone(profile.semanticEngine.progressPlan),
      outputProfile: structuredClone(profile.semanticEngine.outputProfile),
      sessionProfile: structuredClone(profile.semanticEngine.sessionProfile),
      stageProfile: structuredClone(profile.semanticEngine.stageProfile),
      channelProfile: structuredClone(profile.semanticEngine.channelProfile),
    },
    program: { schema: program.schema, identity: identityReference(programResult.identity), sourceIdentity: { ...program.sourceIdentity }, functions: program.functions.map(({ name, executionRole, parameters, returns }) => ({ name, executionRole, parameters: structuredClone(parameters), returns })) },
    cudaJsAdapter: buildCudaJsAdapterRequirements(program),
    manifests: structuredClone(profile.manifests),
    compatibility: structuredClone(profile.compatibility),
    provenance: structuredClone(profile.provenance),
    deletion: structuredClone(profile.deletion),
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}

function normalizeOpaqueIdentity(input, label) {
  return normalizeContentIdentity(input, 'COMPOSE_OPAQUE_IDENTITY', label);
}

export function normalizeCudaJsRealization(input, packageResult) {
  if (!packageResult?.normalized) fail('COMPOSE_REALIZATION_PACKAGE', 'execution package is required');
  if (input?.status === 'failure') {
    exactKeys(input, ['status', 'error', 'cleanup'], 'COMPOSE_REALIZATION_FIELDS', 'CUDA-JS failure');
    exactKeys(input.error, ['code', 'class', 'identity'], 'COMPOSE_REALIZATION_ERROR_FIELDS', 'CUDA-JS error');
    exactKeys(input.cleanup, ['status', 'disposition'], 'COMPOSE_REALIZATION_CLEANUP_FIELDS', 'CUDA-JS cleanup');
    if (!['unsupported-capability', 'validation', 'compilation', 'allocation', 'operation'].includes(input.error.class)) fail('COMPOSE_REALIZATION_ERROR', 'CUDA-JS error class is invalid');
    if (!['complete', 'quarantined'].includes(input.cleanup.status)) fail('COMPOSE_REALIZATION_CLEANUP', 'CUDA-JS failure cleanup is invalid');
    return { normalized: { status: 'failure', error: { code: input.error.code, class: input.error.class, identity: normalizeOpaqueIdentity(input.error.identity, 'CUDA-JS error identity') }, cleanup: { status: input.cleanup.status, disposition: normalizeSchemaReference(input.cleanup.disposition, 'CUDA-JS failure disposition') } }, identity: null };
  }
  exactKeys(input, ['status', 'deviceProgram', 'artifacts', 'resources', 'operations', 'runtime', 'cleanup'], 'COMPOSE_REALIZATION_FIELDS', 'CUDA-JS success');
  if (input.status !== 'success') fail('COMPOSE_REALIZATION_STATUS', 'CUDA-JS realization status is invalid');
  for (const key of ['artifacts', 'resources', 'operations']) if (!Array.isArray(input[key])) fail('COMPOSE_REALIZATION_FIELDS', `${key} must be an array`);
  if (input.artifacts.length === 0 || input.operations.length !== packageResult.normalized.cudaJsAdapter.operationRequirements.length || input.resources.length !== packageResult.normalized.cudaJsAdapter.resourceRequirements.length) fail('COMPOSE_REALIZATION_COVERAGE', 'CUDA-JS realization does not cover package resources/operations');
  exactKeys(input.cleanup, ['status', 'disposition'], 'COMPOSE_REALIZATION_CLEANUP_FIELDS', 'CUDA-JS cleanup');
  if (input.cleanup.status !== 'retained-evidence') fail('COMPOSE_REALIZATION_CLEANUP', 'reference realization must retain bounded evidence');
  const normalized = {
    status: 'success',
    deviceProgram: normalizeOpaqueIdentity(input.deviceProgram, 'CUDA-JS deviceProgram'),
    artifacts: input.artifacts.map((entry, index) => normalizeOpaqueIdentity(entry, `CUDA-JS artifact ${index}`)),
    resources: input.resources.map((entry, index) => normalizeOpaqueIdentity(entry, `CUDA-JS resource ${index}`)),
    operations: input.operations.map((entry, index) => normalizeOpaqueIdentity(entry, `CUDA-JS operation ${index}`)),
    runtime: normalizeOpaqueIdentity(input.runtime, 'CUDA-JS runtime'),
    cleanup: { status: input.cleanup.status, disposition: normalizeSchemaReference(input.cleanup.disposition, 'CUDA-JS cleanup disposition') },
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}

export function normalizeCompatiblePair(input, packageResult, programResult, realizationResult) {
  if (!packageResult?.normalized || !programResult?.normalized || realizationResult?.normalized?.status !== 'success') fail('COMPOSE_PAIR_INPUT', 'successful exact inputs are required for a pair record');
  exactKeys(input, ['schema', 'status', 'cudaMcgs', 'cudaJs', 'environment', 'evidence', 'claim', 'cleanup'], 'COMPOSE_PAIR_FIELDS', 'compatible pair');
  if (input.schema !== COMPATIBLE_PAIR_SCHEMA || input.status !== 'reference-fixture') fail('COMPOSE_PAIR_SCHEMA', 'compatible-pair schema/status is invalid');
  exactKeys(input.cudaMcgs, ['repository', 'revision', 'package', 'searchIr', 'searchProgram', 'executionPackage'], 'COMPOSE_PAIR_MCGS_FIELDS', 'compatible pair CUDA-MCGS');
  const expectedMcgs = packageResult.normalized.compatibility;
  if (input.cudaMcgs.repository !== 'iteathen/CUDA-MCGS' || input.cudaMcgs.revision !== packageResult.normalized.provenance.revision) fail('COMPOSE_PAIR_MCGS', 'CUDA-MCGS revision differs from package provenance');
  const searchIr = normalizeOpaqueIdentity(input.cudaMcgs.searchIr, 'pair Search IR'); const searchProgram = normalizeOpaqueIdentity(input.cudaMcgs.searchProgram, 'pair Search Program'); const executionPackage = normalizeOpaqueIdentity(input.cudaMcgs.executionPackage, 'pair execution package');
  if (searchIr.sha256 !== packageResult.normalized.semantic.engineIdentity.sha256 || searchProgram.sha256 !== programResult.identity.sha256 || executionPackage.sha256 !== packageResult.identity.sha256) fail('COMPOSE_PAIR_MCGS', 'CUDA-MCGS pair identities differ from package inputs');
  exactKeys(input.cudaJs, ['repository', 'revision', 'package', 'apiSchema', 'capabilities', 'deviceProgram', 'artifacts', 'resources', 'operations', 'runtime'], 'COMPOSE_PAIR_CUDA_JS_FIELDS', 'compatible pair CUDA-JS');
  if (input.cudaJs.repository !== 'iteathen/CUDA-JS' || input.cudaJs.revision !== expectedMcgs.cudaJs.revision || input.cudaJs.package !== expectedMcgs.cudaJs.package || input.cudaJs.apiSchema !== expectedMcgs.apiSchema) fail('COMPOSE_PAIR_CUDA_JS', 'CUDA-JS pair identity differs from package requirements');
  const capabilities = input.cudaJs.capabilities.map((entry, index) => normalizeSchemaReference(entry, `pair capability ${index}`)).sort((left, right) => compareRaw(schemaKey(left), schemaKey(right)));
  const expectedCapabilities = packageResult.normalized.cudaJsAdapter.publicContracts;
  if (capabilities.length !== expectedCapabilities.length || capabilities.some((entry, index) => schemaKey(entry) !== schemaKey(expectedCapabilities[index]))) fail('COMPOSE_PAIR_CAPABILITY', 'pair capabilities differ from package requirements');
  const matchIdentityList = (inputValues, actualValues, label) => {
    const values = inputValues.map((entry, index) => normalizeOpaqueIdentity(entry, `${label} ${index}`));
    if (values.length !== actualValues.length || values.some((entry, index) => entry.sha256 !== actualValues[index].sha256)) fail('COMPOSE_PAIR_REALIZATION', `${label} differ from realization`);
    return values;
  };
  const cudaJs = { repository: input.cudaJs.repository, revision: input.cudaJs.revision, package: input.cudaJs.package, apiSchema: input.cudaJs.apiSchema, capabilities, deviceProgram: normalizeOpaqueIdentity(input.cudaJs.deviceProgram, 'pair Device-JS program'), artifacts: matchIdentityList(input.cudaJs.artifacts, realizationResult.normalized.artifacts, 'pair artifacts'), resources: matchIdentityList(input.cudaJs.resources, realizationResult.normalized.resources, 'pair resources'), operations: matchIdentityList(input.cudaJs.operations, realizationResult.normalized.operations, 'pair operations'), runtime: normalizeOpaqueIdentity(input.cudaJs.runtime, 'pair runtime') };
  if (cudaJs.deviceProgram.sha256 !== realizationResult.normalized.deviceProgram.sha256 || cudaJs.runtime.sha256 !== realizationResult.normalized.runtime.sha256) fail('COMPOSE_PAIR_REALIZATION', 'pair public realization identities differ');
  exactKeys(input.environment, ['platform', 'architecture', 'device', 'toolchain'], 'COMPOSE_PAIR_ENVIRONMENT_FIELDS', 'pair environment');
  const environment = Object.fromEntries(Object.entries(input.environment).map(([key, value]) => [key, normalizeOpaqueIdentity(value, `pair ${key}`)]));
  if (!Array.isArray(input.evidence) || input.evidence.length === 0) fail('COMPOSE_PAIR_EVIDENCE', 'pair evidence is absent');
  const evidence = input.evidence.map((entry, index) => normalizeOpaqueIdentity(entry, `pair evidence ${index}`));
  exactKeys(input.claim, ['scope', 'qualification', 'native'], 'COMPOSE_PAIR_CLAIM_FIELDS', 'pair claim');
  if (input.claim.qualification !== 'reference-only' || input.claim.native !== false || typeof input.claim.scope !== 'string' || input.claim.scope.length === 0) fail('COMPOSE_PAIR_CLAIM', 'reference pair cannot claim native qualification');
  exactKeys(input.cleanup, ['status', 'disposition'], 'COMPOSE_PAIR_CLEANUP_FIELDS', 'pair cleanup');
  if (!['complete', 'retained-evidence', 'quarantined'].includes(input.cleanup.status)) fail('COMPOSE_PAIR_CLEANUP', 'pair cleanup is invalid');
  const normalized = { schema: input.schema, status: input.status, cudaMcgs: { repository: input.cudaMcgs.repository, revision: input.cudaMcgs.revision, package: input.cudaMcgs.package, searchIr, searchProgram, executionPackage }, cudaJs, environment, evidence, claim: { ...input.claim }, cleanup: { status: input.cleanup.status, disposition: normalizeSchemaReference(input.cleanup.disposition, 'pair cleanup disposition') } };
  return { normalized, identity: canonicalIdentity(normalized) };
}

export function assertOwnerDeletion(beforeProgram, afterProgram, removedOwnerInput, changedOwnerInput = []) {
  const removedOwners = [...new Set(Array.isArray(removedOwnerInput) ? removedOwnerInput : [removedOwnerInput])].sort(compareRaw);
  const changedOwners = new Set(Array.isArray(changedOwnerInput) ? changedOwnerInput : [changedOwnerInput]);
  if (removedOwners.length === 0) fail('COMPOSE_DELETION_OWNER', 'at least one removed owner is required');
  const removedOwnerSet = new Set(removedOwners);
  const beforeRecords = removedOwners.map((removedOwner) => {
    const record = beforeProgram?.deletion?.records?.find(({ owner }) => owner === removedOwner);
    if (!record) fail('COMPOSE_DELETION_OWNER', `removed owner ${removedOwner} has no before record`);
    if (afterProgram.deletion.selectedOwners.includes(removedOwner) || JSON.stringify(afterProgram).includes(`\"${removedOwner}\"`)) fail('COMPOSE_DELETION_RESIDUE', `${removedOwner} remains after recomposition`);
    return record;
  });
  const removedSourceUnits = new Set(beforeRecords.flatMap(({ sourceUnits }) => sourceUnits));
  const remainingUnits = beforeProgram.sourceMap.filter(({ id, semanticOwner }) => !removedSourceUnits.has(id) && !changedOwners.has(semanticOwner)).map(({ sourceIdentity }) => sourceIdentity.sha256).sort(compareRaw);
  const afterUnits = afterProgram.sourceMap.filter(({ semanticOwner }) => !changedOwners.has(semanticOwner)).map(({ sourceIdentity }) => sourceIdentity.sha256).sort(compareRaw);
  if (remainingUnits.length !== afterUnits.length || remainingUnits.some((value, index) => value !== afterUnits[index])) {
    const describe = (entries) => entries.map(({ id, semanticOwner, sourceIdentity }) => `${id}:${semanticOwner}:${sourceIdentity.sha256}`).sort(compareRaw).join(',');
    const beforeDescription = describe(beforeProgram.sourceMap.filter(({ id, semanticOwner }) => !removedSourceUnits.has(id) && !changedOwners.has(semanticOwner)));
    const afterDescription = describe(afterProgram.sourceMap.filter(({ semanticOwner }) => !changedOwners.has(semanticOwner)));
    fail('COMPOSE_DELETION_SOURCE', `unowned source units changed during deletion: before=${beforeDescription} after=${afterDescription}`);
  }
  const removedRequirements = new Set(beforeRecords.flatMap(({ publicRequirements }) => publicRequirements));
  for (const requirement of removedRequirements) {
    const stillOwned = beforeProgram.deletion.records.some((record) => !removedOwnerSet.has(record.owner) && !changedOwners.has(record.owner) && record.publicRequirements.includes(requirement));
    const remains = afterProgram.publicRequirements.some(({ contract }) => contract.id === requirement);
    if ((changedOwners.size === 0 && stillOwned !== remains) || (changedOwners.size > 0 && stillOwned && !remains)) {
      fail('COMPOSE_DELETION_REQUIREMENT', `${requirement} shared ownership is wrong after deletion`);
    }
  }
  return true;
}

export const programPackageConstants = Object.freeze({
  profileSchema: PROFILE_SCHEMA,
  searchProgramSchema: SEARCH_PROGRAM_SCHEMA,
  executionPackageSchema: EXECUTION_PACKAGE_SCHEMA,
  cudaJsAdapterRequirementsSchema: CUDA_JS_ADAPTER_REQUIREMENTS_SCHEMA,
  compatiblePairSchema: COMPATIBLE_PAIR_SCHEMA,
});

import {
  assertString,
  canonicalIdentity,
  compareRaw,
  exactKeys,
  fail,
  normalizeDecimalUint,
  uniqueBy,
} from './validation.mjs';

const FRAMEWORK_SELECTION_SCHEMA = 'cuda-mcgs.framework-selection/0.2.0';
const SEARCH_IR_REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const CONTRACT_SET_SCHEMA = 'cuda-mcgs.search-ir.contract-set/0.2.0';
const PROFILE_ROLES = new Set([
  'domain',
  'graph',
  'policy',
  'evaluator',
  'resource',
  'progress',
  'output',
  'session',
  'stage-extension',
  'async-channel',
  'program-package',
  'product',
  'capability',
]);
const REQUIRED_ROLES = ['domain', 'graph', 'output', 'policy', 'program-package', 'progress', 'resource'];
const CATALOG_ROLE_CONTRACT = new Map([
  ['framework', 'SPEC-0000'],
  ['domain', 'SPEC-0007'],
  ['graph', 'SPEC-0010'],
  ['policy', 'SPEC-0008'],
  ['evaluator', 'SPEC-0009'],
  ['resource', 'SPEC-0011'],
  ['progress', 'SPEC-0012'],
  ['output', 'SPEC-0013'],
  ['session', 'SPEC-0006'],
  ['stage-extension', 'SPEC-0003'],
  ['async-channel', 'SPEC-0004'],
  ['program-package', 'SPEC-0005'],
]);
const SINGLETON_ROLES = new Set([...CATALOG_ROLE_CONTRACT.keys()].filter((role) => PROFILE_ROLES.has(role)));
const IDENTITY_POLICY = Object.freeze({
  canonicalization: 'utf8-json-sorted-keys-and-owned-sets-v1',
  digest: 'sha256',
  unorderedStringOrder: 'javascript-utf16-code-units',
  pathIndependent: true,
  targetIndependent: true,
});

export function assertNamespacedId(value, code, label) {
  assertString(value, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/, code, label);
}

export function assertVersion(value, code, label) {
  assertString(value, /^[0-9]+\.[0-9]+\.[0-9]+$/, code, label);
}

export function assertSha256(value, code, label) {
  assertString(value, /^[0-9a-f]{64}$/, code, label);
}

export function normalizeContentIdentity(input, code, label) {
  exactKeys(input, ['algorithm', 'sha256'], code, label);
  if (input.algorithm !== 'sha256') fail(code, `${label} algorithm must be sha256`);
  assertSha256(input.sha256, code, `${label} sha256`);
  return { algorithm: 'sha256', sha256: input.sha256 };
}

export function normalizeSchemaReference(input, label) {
  exactKeys(input, ['id', 'version', 'sha256'], 'FOUNDATION_PROFILE_SCHEMA', label);
  assertString(input.id, /^[a-z][a-z0-9.-]+\/[0-9]+\.[0-9]+\.[0-9]+$/, 'FOUNDATION_PROFILE_SCHEMA', `${label} id`);
  assertVersion(input.version, 'FOUNDATION_PROFILE_VERSION', `${label} version`);
  assertSha256(input.sha256, 'FOUNDATION_PROFILE_SCHEMA', `${label} sha256`);
  if (!input.id.endsWith(`/${input.version}`)) fail('FOUNDATION_PROFILE_VERSION', `${label} id/version differ`);
  return { id: input.id, version: input.version, sha256: input.sha256 };
}

function normalizePublicReference(input, selectedProfiles, code, label) {
  exactKeys(input, ['ownerProfile', 'id', 'version'], code, label);
  assertNamespacedId(input.ownerProfile, code, `${label} ownerProfile`);
  assertNamespacedId(input.id, code, `${label} id`);
  assertVersion(input.version, code, `${label} version`);
  if (!selectedProfiles.has(input.ownerProfile)) fail('FOUNDATION_REFERENCE_OWNER', `${label} names unselected owner ${input.ownerProfile}`);
  return { ownerProfile: input.ownerProfile, id: input.id, version: input.version };
}

function referenceKey(reference) {
  return `${reference.ownerProfile}\0${reference.id}\0${reference.version}`;
}

function normalizeCatalogContract(input, catalogById, role, label) {
  exactKeys(input, ['kind', 'id', 'specificationIdentity', 'sha256'], 'FOUNDATION_CONTRACT_FIELDS', label);
  if (input.kind !== 'catalog') fail('FOUNDATION_CONTRACT_KIND', `${label} must be a catalog contract`);
  assertString(input.id, /^SPEC-[0-9]{4}$/, 'FOUNDATION_CONTRACT_ID', `${label} id`);
  assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\.[0-9]+\.[0-9]+$/, 'FOUNDATION_CONTRACT_IDENTITY', `${label} specificationIdentity`);
  assertSha256(input.sha256, 'FOUNDATION_CONTRACT_DIGEST', `${label} sha256`);
  const expectedContractId = CATALOG_ROLE_CONTRACT.get(role);
  if (expectedContractId !== input.id) fail('FOUNDATION_ROLE_CONTRACT', `${role} must select ${expectedContractId}`);
  const catalogContract = catalogById.get(input.id);
  if (!catalogContract
      || catalogContract.specificationIdentity !== input.specificationIdentity
      || catalogContract.sha256 !== input.sha256) {
    fail('FOUNDATION_CONTRACT_DRIFT', `${label} differs from the frozen contract set`);
  }
  return { kind: 'catalog', id: input.id, specificationIdentity: input.specificationIdentity, sha256: input.sha256 };
}

function normalizeNamespacedContract(input, role, label) {
  exactKeys(input, ['kind', 'id', 'version', 'schema', 'sha256'], 'FOUNDATION_CONTRACT_FIELDS', label);
  if (input.kind !== 'namespaced' || !['product', 'capability'].includes(role)) {
    fail('FOUNDATION_CONTRACT_KIND', `${label} is permitted only for product/capability roles`);
  }
  assertNamespacedId(input.id, 'FOUNDATION_CONTRACT_ID', `${label} id`);
  assertVersion(input.version, 'FOUNDATION_CONTRACT_VERSION', `${label} version`);
  assertString(input.schema, /^[a-z][a-z0-9.-]+\/[0-9]+\.[0-9]+\.[0-9]+$/, 'FOUNDATION_CONTRACT_SCHEMA', `${label} schema`);
  assertSha256(input.sha256, 'FOUNDATION_CONTRACT_DIGEST', `${label} sha256`);
  if (!input.schema.endsWith(`/${input.version}`)) fail('FOUNDATION_CONTRACT_VERSION', `${label} schema/version differ`);
  return { kind: 'namespaced', id: input.id, version: input.version, schema: input.schema, sha256: input.sha256 };
}

function normalizeProfile(input, index, catalogById) {
  exactKeys(input, ['id', 'role', 'contract', 'schema', 'identity'], 'FOUNDATION_PROFILE_FIELDS', `profile ${index}`);
  assertNamespacedId(input.id, 'FOUNDATION_PROFILE_ID', `profile ${index} id`);
  if (!PROFILE_ROLES.has(input.role)) fail('FOUNDATION_PROFILE_ROLE', `${input.id} has unknown role`);
  const contract = input.contract?.kind === 'catalog'
    ? normalizeCatalogContract(input.contract, catalogById, input.role, `${input.id} contract`)
    : normalizeNamespacedContract(input.contract, input.role, `${input.id} contract`);
  return {
    id: input.id,
    role: input.role,
    contract,
    schema: normalizeSchemaReference(input.schema, `${input.id} schema`),
    identity: normalizeContentIdentity(input.identity, 'FOUNDATION_PROFILE_IDENTITY', `${input.id} identity`),
  };
}

function normalizeDependency(input, index, selectedProfiles) {
  exactKeys(input, ['consumer', 'provider', 'reason'], 'FOUNDATION_DEPENDENCY_FIELDS', `dependency ${index}`);
  assertNamespacedId(input.consumer, 'FOUNDATION_DEPENDENCY_PROFILE', `dependency ${index} consumer`);
  assertNamespacedId(input.provider, 'FOUNDATION_DEPENDENCY_PROFILE', `dependency ${index} provider`);
  if (!selectedProfiles.has(input.consumer) || !selectedProfiles.has(input.provider)) {
    fail('FOUNDATION_DEPENDENCY_PROFILE', `dependency ${index} names an unselected profile`);
  }
  if (input.consumer === input.provider) fail('FOUNDATION_DEPENDENCY_SELF', `dependency ${index} is self-referential`);
  return {
    consumer: input.consumer,
    provider: input.provider,
    reason: normalizePublicReference(input.reason, selectedProfiles, 'FOUNDATION_DEPENDENCY_REASON', `dependency ${index} reason`),
  };
}

function dependencyKey(dependency) {
  return `${dependency.consumer}\0${dependency.provider}\0${referenceKey(dependency.reason)}`;
}

function assertAcyclic(dependencies, selectedProfiles) {
  const incoming = new Map([...selectedProfiles].map((id) => [id, 0]));
  const outgoing = new Map([...selectedProfiles].map((id) => [id, []]));
  for (const { consumer, provider } of dependencies) {
    outgoing.get(provider).push(consumer);
    incoming.set(consumer, incoming.get(consumer) + 1);
  }
  const ready = [...incoming.entries()].filter(([, count]) => count === 0).map(([id]) => id).sort(compareRaw);
  let visited = 0;
  while (ready.length > 0) {
    const provider = ready.shift();
    visited += 1;
    for (const consumer of outgoing.get(provider).sort(compareRaw)) {
      const remaining = incoming.get(consumer) - 1;
      incoming.set(consumer, remaining);
      if (remaining === 0) ready.push(consumer);
    }
    ready.sort(compareRaw);
  }
  if (visited !== selectedProfiles.size) fail('FOUNDATION_DEPENDENCY_CYCLE', 'semantic dependency graph contains a cycle');
}

function dependencyReachable(consumer, provider, dependencies) {
  const providersByConsumer = new Map();
  for (const dependency of dependencies) {
    if (!providersByConsumer.has(dependency.consumer)) providersByConsumer.set(dependency.consumer, []);
    providersByConsumer.get(dependency.consumer).push(dependency.provider);
  }
  const pending = [...(providersByConsumer.get(consumer) ?? [])];
  const seen = new Set();
  while (pending.length > 0) {
    const candidate = pending.pop();
    if (candidate === provider) return true;
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    pending.push(...(providersByConsumer.get(candidate) ?? []));
  }
  return false;
}

function normalizeReferenceSet(input, selectedProfiles, code, label, minimum = 0) {
  if (!Array.isArray(input) || input.length < minimum) fail(code, `${label} must contain at least ${minimum} reference(s)`);
  const normalized = input.map((reference, index) => normalizePublicReference(reference, selectedProfiles, code, `${label} ${index}`));
  normalized.sort((left, right) => compareRaw(referenceKey(left), referenceKey(right)));
  const keys = normalized.map(referenceKey);
  if (new Set(keys).size !== keys.length) fail(code, `${label} contains a duplicate reference`);
  return normalized;
}

function normalizeBinding(input, index, selectedProfiles, dependencies) {
  exactKeys(input, ['id', 'version', 'producer', 'consumers', 'permissions', 'representationOwner', 'lifecycleOwner', 'epochScope', 'resourceContributions', 'progressDependencies'], 'FOUNDATION_BINDING_FIELDS', `binding ${index}`);
  assertNamespacedId(input.id, 'FOUNDATION_BINDING_ID', `binding ${index} id`);
  assertVersion(input.version, 'FOUNDATION_BINDING_VERSION', `${input.id} version`);
  const producer = normalizePublicReference(input.producer, selectedProfiles, 'FOUNDATION_BINDING_PRODUCER', `${input.id} producer`);
  const consumers = normalizeReferenceSet(input.consumers, selectedProfiles, 'FOUNDATION_BINDING_CONSUMERS', `${input.id} consumers`, 1);
  if (consumers.some(({ ownerProfile }) => ownerProfile === producer.ownerProfile)) {
    fail('FOUNDATION_BINDING_SELF', `${input.id} must cross an owner boundary`);
  }
  for (const consumer of consumers) {
    if (!dependencyReachable(consumer.ownerProfile, producer.ownerProfile, dependencies)) {
      fail('FOUNDATION_BINDING_DEPENDENCY', `${consumer.ownerProfile} has no declared dependency on ${producer.ownerProfile}`);
    }
  }
  assertNamespacedId(input.representationOwner, 'FOUNDATION_BINDING_OWNER', `${input.id} representationOwner`);
  assertNamespacedId(input.lifecycleOwner, 'FOUNDATION_BINDING_OWNER', `${input.id} lifecycleOwner`);
  if (!selectedProfiles.has(input.representationOwner) || !selectedProfiles.has(input.lifecycleOwner)) {
    fail('FOUNDATION_BINDING_OWNER', `${input.id} names an unselected representation/lifecycle owner`);
  }
  return {
    id: input.id,
    version: input.version,
    producer,
    consumers,
    permissions: normalizeReferenceSet(input.permissions, selectedProfiles, 'FOUNDATION_BINDING_PERMISSIONS', `${input.id} permissions`, 1),
    representationOwner: input.representationOwner,
    lifecycleOwner: input.lifecycleOwner,
    epochScope: normalizePublicReference(input.epochScope, selectedProfiles, 'FOUNDATION_BINDING_EPOCH', `${input.id} epochScope`),
    resourceContributions: normalizeReferenceSet(input.resourceContributions, selectedProfiles, 'FOUNDATION_BINDING_RESOURCES', `${input.id} resourceContributions`),
    progressDependencies: normalizeReferenceSet(input.progressDependencies, selectedProfiles, 'FOUNDATION_BINDING_PROGRESS', `${input.id} progressDependencies`),
  };
}

export function normalizeFrameworkSelection(input, inspectedCatalog) {
  exactKeys(input, ['schema', 'representation', 'status', 'contractSet', 'frameworkContract', 'profiles', 'dependencies', 'bindings', 'identityPolicy'], 'FOUNDATION_ROOT_FIELDS', 'framework selection');
  if (input.schema !== FRAMEWORK_SELECTION_SCHEMA || input.representation !== SEARCH_IR_REPRESENTATION) {
    fail('FOUNDATION_SCHEMA', 'unsupported framework-selection schema/representation');
  }
  if (input.status !== 'accepted') fail('FOUNDATION_STATUS', 'framework selection must remain proposal evidence');
  const contractSet = inspectedCatalog?.contractSet;
  if (!contractSet) fail('FOUNDATION_CATALOG', 'inspected contract set is required');
  const catalogById = new Map(contractSet.contracts.map((contract) => [contract.id, contract]));

  exactKeys(input.contractSet, ['schema', 'identity'], 'FOUNDATION_CONTRACT_SET_FIELDS', 'contractSet');
  if (input.contractSet.schema !== CONTRACT_SET_SCHEMA) fail('FOUNDATION_CONTRACT_SET_ID', 'contract-set schema is incompatible');
  const suppliedCatalogIdentity = normalizeContentIdentity(input.contractSet.identity, 'FOUNDATION_CONTRACT_SET_ID', 'contractSet identity');
  if (suppliedCatalogIdentity.sha256 !== canonicalIdentity(contractSet).sha256) {
    fail('FOUNDATION_CONTRACT_SET_DRIFT', 'contract-set identity does not match inspected input');
  }
  const frameworkContract = normalizeCatalogContract(input.frameworkContract, catalogById, 'framework', 'frameworkContract');

  if (!Array.isArray(input.profiles)) fail('FOUNDATION_PROFILE_COUNT', 'profiles must be an array');
  const profiles = input.profiles.map((profile, index) => normalizeProfile(profile, index, catalogById));
  profiles.sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(profiles, 'id', 'FOUNDATION_PROFILE_DUPLICATE', 'profile');
  const selectedProfiles = new Set(profiles.map(({ id }) => id));
  for (const role of SINGLETON_ROLES) {
    if (profiles.filter((profile) => profile.role === role).length > 1) fail('FOUNDATION_ROLE_DUPLICATE', `role ${role} is selected more than once`);
  }
  for (const role of REQUIRED_ROLES) {
    if (!profiles.some((profile) => profile.role === role)) fail('FOUNDATION_REQUIRED_ROLE', `required role ${role} is absent`);
  }

  if (!Array.isArray(input.dependencies)) fail('FOUNDATION_DEPENDENCY_COUNT', 'dependencies must be an array');
  const dependencies = input.dependencies.map((dependency, index) => normalizeDependency(dependency, index, selectedProfiles));
  dependencies.sort((left, right) => compareRaw(dependencyKey(left), dependencyKey(right)));
  const dependencyKeys = dependencies.map(dependencyKey);
  if (new Set(dependencyKeys).size !== dependencyKeys.length) fail('FOUNDATION_DEPENDENCY_DUPLICATE', 'dependency graph repeats an edge/reason');
  assertAcyclic(dependencies, selectedProfiles);

  if (!Array.isArray(input.bindings)) fail('FOUNDATION_BINDING_COUNT', 'bindings must be an array');
  const bindings = input.bindings.map((binding, index) => normalizeBinding(binding, index, selectedProfiles, dependencies));
  bindings.sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(bindings, 'id', 'FOUNDATION_BINDING_DUPLICATE', 'binding');

  exactKeys(input.identityPolicy, Object.keys(IDENTITY_POLICY), 'FOUNDATION_IDENTITY_POLICY_FIELDS', 'identityPolicy');
  for (const [key, expected] of Object.entries(IDENTITY_POLICY)) {
    if (input.identityPolicy[key] !== expected) fail('FOUNDATION_IDENTITY_POLICY', `identityPolicy.${key} is incompatible`);
  }

  const normalized = {
    schema: input.schema,
    representation: input.representation,
    status: input.status,
    contractSet: { schema: input.contractSet.schema, identity: suppliedCatalogIdentity },
    frameworkContract,
    profiles,
    dependencies,
    bindings,
    identityPolicy: { ...IDENTITY_POLICY },
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}

export { normalizeDecimalUint } from './validation.mjs';

export const foundationConstants = Object.freeze({
  schema: FRAMEWORK_SELECTION_SCHEMA,
  representation: SEARCH_IR_REPRESENTATION,
  requiredRoles: Object.freeze([...REQUIRED_ROLES]),
});

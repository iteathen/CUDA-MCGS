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
  assertSha256,
  assertVersion,
  normalizeContentIdentity,
  normalizeSchemaReference,
} from './foundation.mjs';

const DOMAIN_PROFILE_SCHEMA = 'cuda-mcgs.domain-profile/0.2.0';
const SEARCH_IR_REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const DOMAIN_CONTRACT = 'SPEC-0007';
const VALUE_ROLES = [
  'action',
  'action-cursor',
  'action-key',
  'diagnostic',
  'history',
  'identity-key',
  'operation-status',
  'path-relation',
  'random-input',
  'role-key',
  'root-descriptor',
  'state',
  'terminal-outcome',
  'transition-input',
  'transition-metadata',
  'transition-output',
  'truth-value',
];
const MEMORY_SPACES = ['device-publication', 'device-search', 'durable', 'host-admission'];
const REQUIRED_PORTS = [
  'action-key',
  'apply-transition',
  'classify-path-relation',
  'classify-role',
  'equal-action',
  'equal-state',
  'identity-key',
  'terminal-outcome',
  'validate-action',
  'validate-root',
];
const OPTIONAL_PORTS = ['advance-history', 'produce-actions'];
const REQUIRED_FAILURES = [
  'cancelled',
  'capacity-required',
  'domain-history-exhausted',
  'domain-internal-failure',
  'incompatible-action-producer',
  'invalid-input',
  'invalid-action-scope',
  'invalid-cursor',
  'invalid-profile',
  'invalid-root',
  'invalid-state',
  'unsupported-domain-case',
];

function assertEnum(value, allowed, code, label) {
  if (!allowed.includes(value)) fail(code, `${label} is invalid`);
  return value;
}

function normalizePositiveDecimal(value, code, label) {
  const normalized = normalizeDecimalUint(value, label);
  if (normalized === '0') fail(code, `${label} must be positive`);
  return normalized;
}

function compareDecimal(left, right) {
  if (left.length !== right.length) return left.length < right.length ? -1 : 1;
  return compareRaw(left, right);
}

function normalizeStringSet(input, { code, label, allowed = null, minimum = 0, namespaced = false }) {
  if (!Array.isArray(input) || input.length < minimum) fail(code, `${label} must contain at least ${minimum} item(s)`);
  const values = input.map((value, index) => {
    if (namespaced) assertNamespacedId(value, code, `${label} ${index}`);
    else if (allowed) assertEnum(value, allowed, code, `${label} ${index}`);
    else assertString(value, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, code, `${label} ${index}`);
    return value;
  }).sort(compareRaw);
  if (new Set(values).size !== values.length) fail(code, `${label} contains a duplicate`);
  return values;
}

function normalizeDomainContract(input, catalogById) {
  exactKeys(input, ['kind', 'id', 'specificationIdentity', 'sha256'], 'DOMAIN_CONTRACT_FIELDS', 'domain contract');
  if (input.kind !== 'catalog' || input.id !== DOMAIN_CONTRACT) fail('DOMAIN_CONTRACT_ID', `domain contract must be ${DOMAIN_CONTRACT}`);
  assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-0007@[0-9]+\.[0-9]+\.[0-9]+-draft$/, 'DOMAIN_CONTRACT_ID', 'domain contract identity');
  assertSha256(input.sha256, 'DOMAIN_CONTRACT_DIGEST', 'domain contract sha256');
  const expected = catalogById.get(DOMAIN_CONTRACT);
  if (!expected || expected.specificationIdentity !== input.specificationIdentity || expected.sha256 !== input.sha256) {
    fail('DOMAIN_CONTRACT_DRIFT', 'domain contract differs from the frozen contract set');
  }
  return { kind: 'catalog', id: input.id, specificationIdentity: input.specificationIdentity, sha256: input.sha256 };
}

function normalizeExternalContract(input, catalogById, label) {
  if (input?.kind === 'catalog') {
    exactKeys(input, ['kind', 'id', 'specificationIdentity', 'sha256'], 'DOMAIN_EXTERNAL_CONTRACT_FIELDS', label);
    assertString(input.id, /^SPEC-[0-9]{4}$/, 'DOMAIN_EXTERNAL_CONTRACT_ID', `${label} id`);
    assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\.[0-9]+\.[0-9]+-draft$/, 'DOMAIN_EXTERNAL_CONTRACT_ID', `${label} identity`);
    assertSha256(input.sha256, 'DOMAIN_EXTERNAL_CONTRACT_DIGEST', `${label} sha256`);
    const expected = catalogById.get(input.id);
    if (!expected || expected.specificationIdentity !== input.specificationIdentity || expected.sha256 !== input.sha256) {
      fail('DOMAIN_EXTERNAL_CONTRACT_DRIFT', `${label} differs from the frozen contract set`);
    }
    return { kind: 'catalog', id: input.id, specificationIdentity: input.specificationIdentity, sha256: input.sha256 };
  }
  exactKeys(input, ['kind', 'id', 'version', 'schema', 'sha256'], 'DOMAIN_EXTERNAL_CONTRACT_FIELDS', label);
  if (input.kind !== 'namespaced') fail('DOMAIN_EXTERNAL_CONTRACT_KIND', `${label} kind is invalid`);
  assertNamespacedId(input.id, 'DOMAIN_EXTERNAL_CONTRACT_ID', `${label} id`);
  assertVersion(input.version, 'DOMAIN_EXTERNAL_CONTRACT_VERSION', `${label} version`);
  assertString(input.schema, /^[a-z][a-z0-9.-]+\/[0-9]+\.[0-9]+\.[0-9]+$/, 'DOMAIN_EXTERNAL_CONTRACT_SCHEMA', `${label} schema`);
  assertSha256(input.sha256, 'DOMAIN_EXTERNAL_CONTRACT_DIGEST', `${label} sha256`);
  if (!input.schema.endsWith(`/${input.version}`)) fail('DOMAIN_EXTERNAL_CONTRACT_VERSION', `${label} schema/version differ`);
  return { kind: 'namespaced', id: input.id, version: input.version, schema: input.schema, sha256: input.sha256 };
}

function normalizeValueSchema(input, index) {
  exactKeys(input, ['id', 'semanticRole', 'schema', 'family', 'maxEncodedBytes', 'alignmentBytes', 'memorySpaces', 'decoding'], 'DOMAIN_VALUE_FIELDS', `value schema ${index}`);
  assertNamespacedId(input.id, 'DOMAIN_VALUE_ID', `value schema ${index} id`);
  assertEnum(input.semanticRole, VALUE_ROLES, 'DOMAIN_VALUE_ROLE', `${input.id} semanticRole`);
  const maximum = normalizeDecimalUint(input.maxEncodedBytes, `${input.id} maxEncodedBytes`);
  const alignment = normalizePositiveDecimal(input.alignmentBytes, 'DOMAIN_VALUE_ALIGNMENT', `${input.id} alignmentBytes`);
  const family = assertEnum(input.family, ['unit', 'fixed-record', 'variable-record', 'tagged-union', 'scalar', 'vector', 'namespaced'], 'DOMAIN_VALUE_FAMILY', `${input.id} family`);
  if ((family === 'unit') !== (maximum === '0')) fail('DOMAIN_VALUE_UNIT', `${input.id} unit family and zero-byte bound must agree`);
  return {
    id: input.id,
    semanticRole: input.semanticRole,
    schema: normalizeSchemaReference(input.schema, `${input.id} schema`),
    family,
    maxEncodedBytes: maximum,
    alignmentBytes: alignment,
    memorySpaces: normalizeStringSet(input.memorySpaces, { code: 'DOMAIN_VALUE_MEMORY', label: `${input.id} memorySpaces`, allowed: MEMORY_SPACES, minimum: 1 }),
    decoding: assertEnum(input.decoding, ['canonical-bytes', 'profile-semantic-equivalence'], 'DOMAIN_VALUE_DECODING', `${input.id} decoding`),
  };
}

function valueMap(values) {
  return new Map(values.map((value) => [value.id, value]));
}

function requireValue(valuesById, id, expectedRole, code, label) {
  assertNamespacedId(id, code, label);
  const value = valuesById.get(id);
  if (!value || value.semanticRole !== expectedRole) fail(code, `${label} must reference the selected ${expectedRole} value schema`);
  return id;
}

function normalizeIdentity(input, valuesById) {
  exactKeys(input, ['scope', 'keyValue', 'stateEquality', 'actionEquality', 'actionScope', 'collisionVerification', 'behaviorFacts', 'readyPayloads'], 'DOMAIN_IDENTITY_FIELDS', 'identity');
  if (input.collisionVerification !== 'authoritative-equality-port') fail('DOMAIN_IDENTITY_COLLISION', 'identity collisions must use the equality port');
  if (input.readyPayloads !== 'immutable') fail('DOMAIN_IDENTITY_IMMUTABLE', 'ready payloads must be immutable');
  let actionScope;
  if (input.actionScope?.kind === 'origin-state-view-and-production-incarnation') {
    exactKeys(input.actionScope, ['kind'], 'DOMAIN_ACTION_SCOPE_FIELDS', 'identity actionScope');
    actionScope = { kind: input.actionScope.kind };
  } else {
    exactKeys(input.actionScope, ['kind', 'transferContract'], 'DOMAIN_ACTION_SCOPE_FIELDS', 'identity actionScope');
    if (input.actionScope.kind !== 'profile-transferable') fail('DOMAIN_ACTION_SCOPE_KIND', 'identity actionScope kind is invalid');
    actionScope = { kind: input.actionScope.kind, transferContract: normalizeSchemaReference(input.actionScope.transferContract, 'identity actionScope transferContract') };
  }
  return {
    scope: assertEnum(input.scope, ['engine-incarnation', 'session-incarnation', 'persistence-namespace'], 'DOMAIN_IDENTITY_SCOPE', 'identity scope'),
    keyValue: requireValue(valuesById, input.keyValue, 'identity-key', 'DOMAIN_IDENTITY_KEY', 'identity keyValue'),
    stateEquality: assertEnum(input.stateEquality, ['canonical-bytes', 'semantic-port'], 'DOMAIN_STATE_EQUALITY', 'state equality'),
    actionEquality: assertEnum(input.actionEquality, ['canonical-bytes', 'semantic-port'], 'DOMAIN_ACTION_EQUALITY', 'action equality'),
    actionScope,
    collisionVerification: input.collisionVerification,
    behaviorFacts: normalizeStringSet(input.behaviorFacts, { code: 'DOMAIN_IDENTITY_FACTS', label: 'identity behaviorFacts', namespaced: true, minimum: 1 }),
    readyPayloads: input.readyPayloads,
  };
}

function normalizeReuse(input, index) {
  const baseLabel = `history reuse ${index}`;
  if (input?.disposition === 'transformable') {
    exactKeys(input, ['boundary', 'disposition', 'adapter'], 'DOMAIN_HISTORY_REUSE_FIELDS', baseLabel);
    return {
      boundary: assertEnum(input.boundary, ['reroot', 'restart', 'persistence'], 'DOMAIN_HISTORY_REUSE_BOUNDARY', `${baseLabel} boundary`),
      disposition: 'transformable',
      adapter: normalizeSchemaReference(input.adapter, `${baseLabel} adapter`),
    };
  }
  exactKeys(input, ['boundary', 'disposition'], 'DOMAIN_HISTORY_REUSE_FIELDS', baseLabel);
  return {
    boundary: assertEnum(input.boundary, ['reroot', 'restart', 'persistence'], 'DOMAIN_HISTORY_REUSE_BOUNDARY', `${baseLabel} boundary`),
    disposition: assertEnum(input.disposition, ['invalid', 'resettable', 'valid'], 'DOMAIN_HISTORY_REUSE_DISPOSITION', `${baseLabel} disposition`),
  };
}

function normalizeHistory(input, valuesById) {
  exactKeys(input, ['disposition', 'valueSchema', 'identityParticipation', 'finiteRule', 'reuse'], 'DOMAIN_HISTORY_FIELDS', 'history');
  const disposition = assertEnum(input.disposition, ['embedded', 'carried', 'hybrid', 'none'], 'DOMAIN_HISTORY_DISPOSITION', 'history disposition');
  const valueSchema = requireValue(valuesById, input.valueSchema, 'history', 'DOMAIN_HISTORY_VALUE', 'history valueSchema');
  const expectedParticipation = { embedded: 'embedded-state', carried: 'carried-history', hybrid: 'state-and-history', none: 'none' }[disposition];
  if (input.identityParticipation !== expectedParticipation) fail('DOMAIN_HISTORY_IDENTITY', `history identityParticipation must be ${expectedParticipation}`);
  let finiteRule;
  if (input.finiteRule?.kind === 'none') {
    exactKeys(input.finiteRule, ['kind'], 'DOMAIN_HISTORY_FINITE_FIELDS', 'history finiteRule');
    finiteRule = { kind: 'none' };
  } else {
    exactKeys(input.finiteRule, ['kind', 'bound', 'exhaustion'], 'DOMAIN_HISTORY_FINITE_FIELDS', 'history finiteRule');
    const kind = assertEnum(input.finiteRule.kind, ['maximum-depth', 'exact-summary'], 'DOMAIN_HISTORY_FINITE_KIND', 'history finiteRule kind');
    if (input.finiteRule.exhaustion !== 'domain-history-exhausted') fail('DOMAIN_HISTORY_EXHAUSTION', 'history exhaustion must be typed');
    finiteRule = {
      kind,
      bound: normalizePositiveDecimal(input.finiteRule.bound, 'DOMAIN_HISTORY_BOUND', 'history finiteRule bound'),
      exhaustion: input.finiteRule.exhaustion,
    };
  }
  const value = valuesById.get(valueSchema);
  if (['embedded', 'none'].includes(disposition)) {
    if (finiteRule.kind !== 'none' || value.family !== 'unit') fail('DOMAIN_HISTORY_ABSENCE', `${disposition} history must use an explicit unit value and no separate finite rule`);
  } else if (finiteRule.kind === 'none' || value.family === 'unit') {
    fail('DOMAIN_HISTORY_BOUNDED', `${disposition} history requires a bounded non-unit value`);
  }
  if (!Array.isArray(input.reuse) || input.reuse.length !== 3) fail('DOMAIN_HISTORY_REUSE_COUNT', 'history reuse must cover three boundaries');
  const reuse = input.reuse.map(normalizeReuse).sort((left, right) => compareRaw(left.boundary, right.boundary));
  uniqueBy(reuse, 'boundary', 'DOMAIN_HISTORY_REUSE_DUPLICATE', 'history reuse boundary');
  if (reuse.map(({ boundary }) => boundary).join(',') !== 'persistence,reroot,restart') fail('DOMAIN_HISTORY_REUSE_COUNT', 'history reuse boundaries are incomplete');
  return { disposition, valueSchema, identityParticipation: input.identityParticipation, finiteRule, reuse };
}

function normalizeRootForm(input, index, valuesById) {
  exactKeys(input, ['id', 'authority', 'schema', 'valueSchema'], 'DOMAIN_ROOT_FIELDS', `root form ${index}`);
  assertNamespacedId(input.id, 'DOMAIN_ROOT_ID', `root form ${index} id`);
  return {
    id: input.id,
    authority: assertEnum(input.authority, ['complete-state', 'product-authority', 'external-environment', 'namespaced'], 'DOMAIN_ROOT_AUTHORITY', `${input.id} authority`),
    schema: normalizeSchemaReference(input.schema, `${input.id} schema`),
    valueSchema: requireValue(valuesById, input.valueSchema, 'root-descriptor', 'DOMAIN_ROOT_VALUE', `${input.id} valueSchema`),
  };
}

function normalizeExecutionBounds(input, label) {
  const fields = ['maxWorkUnits', 'maxReads', 'maxWrites', 'maxRandomInputs', 'cancellationObservationWorkUnits'];
  exactKeys(input, fields, 'DOMAIN_BOUNDS_FIELDS', label);
  const normalized = Object.fromEntries(fields.map((field) => [field, normalizeDecimalUint(input[field], `${label} ${field}`)]));
  normalizePositiveDecimal(normalized.maxWorkUnits, 'DOMAIN_BOUNDS_WORK', `${label} maxWorkUnits`);
  normalizePositiveDecimal(normalized.cancellationObservationWorkUnits, 'DOMAIN_BOUNDS_CANCELLATION', `${label} cancellationObservationWorkUnits`);
  if (compareDecimal(normalized.cancellationObservationWorkUnits, normalized.maxWorkUnits) > 0) {
    fail('DOMAIN_BOUNDS_CANCELLATION', `${label} cancellation bound exceeds work bound`);
  }
  return normalized;
}

function normalizeRandomness(input, label) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind', 'maxInputs'], 'DOMAIN_RANDOM_FIELDS', label);
    if (input.maxInputs !== '0') fail('DOMAIN_RANDOM_BOUND', `${label} none must consume zero inputs`);
    return { kind: 'none', maxInputs: '0' };
  }
  exactKeys(input, ['kind', 'maxInputs', 'semantics'], 'DOMAIN_RANDOM_FIELDS', label);
  if (input.kind !== 'explicit-input') fail('DOMAIN_RANDOM_KIND', `${label} kind is invalid`);
  return {
    kind: 'explicit-input',
    maxInputs: normalizePositiveDecimal(input.maxInputs, 'DOMAIN_RANDOM_BOUND', `${label} maxInputs`),
    semantics: normalizeSchemaReference(input.semantics, `${label} semantics`),
  };
}

function normalizeActionSource(input, index, valuesById, catalogById) {
  const label = `action source ${index}`;
  assertNamespacedId(input?.id, 'DOMAIN_SOURCE_ID', `${label} id`);
  if (input.kind === 'intrinsic') {
    exactKeys(input, ['id', 'kind', 'mode', 'ordering', 'multiplicity', 'cursorValue', 'candidateValue', 'maxActions', 'bounds', 'completion', 'randomness', 'semantics'], 'DOMAIN_SOURCE_FIELDS', label);
    const mode = assertEnum(input.mode, ['exhaustive', 'paged', 'sparse', 'lazy', 'sampled', 'custom'], 'DOMAIN_SOURCE_MODE', `${input.id} mode`);
    const completion = assertEnum(input.completion, ['complete', 'finite-complete', 'budget-bounded-open', 'sample-bounded', 'custom'], 'DOMAIN_SOURCE_COMPLETION', `${input.id} completion`);
    const expectedCompletions = {
      exhaustive: ['complete'], paged: ['finite-complete'], sparse: ['finite-complete'], lazy: ['budget-bounded-open'], sampled: ['sample-bounded'], custom: ['custom'],
    }[mode];
    if (!expectedCompletions.includes(completion)) fail('DOMAIN_SOURCE_COMPLETION', `${input.id} completion is incompatible with ${mode}`);
    const randomness = normalizeRandomness(input.randomness, `${input.id} randomness`);
    if ((mode === 'sampled') !== (randomness.kind === 'explicit-input') && mode !== 'custom') {
      fail('DOMAIN_SOURCE_RANDOMNESS', `${input.id} randomness is incompatible with ${mode}`);
    }
    const bounds = normalizeExecutionBounds(input.bounds, `${input.id} bounds`);
    if (bounds.maxRandomInputs !== randomness.maxInputs) fail('DOMAIN_SOURCE_RANDOMNESS', `${input.id} bounds/randomness differ`);
    return {
      id: input.id,
      kind: 'intrinsic',
      mode,
      ordering: assertEnum(input.ordering, ['semantic', 'non-semantic'], 'DOMAIN_SOURCE_ORDERING', `${input.id} ordering`),
      multiplicity: assertEnum(input.multiplicity, ['unique', 'repeatable-sample'], 'DOMAIN_SOURCE_MULTIPLICITY', `${input.id} multiplicity`),
      cursorValue: requireValue(valuesById, input.cursorValue, 'action-cursor', 'DOMAIN_SOURCE_CURSOR', `${input.id} cursorValue`),
      candidateValue: requireValue(valuesById, input.candidateValue, 'action', 'DOMAIN_SOURCE_CANDIDATE', `${input.id} candidateValue`),
      maxActions: normalizePositiveDecimal(input.maxActions, 'DOMAIN_SOURCE_CAPACITY', `${input.id} maxActions`),
      bounds,
      completion,
      randomness,
      semantics: normalizeSchemaReference(input.semantics, `${input.id} semantics`),
    };
  }
  if (input.kind === 'admitted-proposal') {
    exactKeys(input, ['id', 'kind', 'ordering', 'multiplicity', 'candidateValue', 'producerContract', 'producerSchema', 'candidateAuthority'], 'DOMAIN_SOURCE_FIELDS', label);
    return {
      id: input.id,
      kind: 'admitted-proposal',
      ordering: assertEnum(input.ordering, ['semantic', 'non-semantic'], 'DOMAIN_SOURCE_ORDERING', `${input.id} ordering`),
      multiplicity: assertEnum(input.multiplicity, ['unique', 'repeatable-sample'], 'DOMAIN_SOURCE_MULTIPLICITY', `${input.id} multiplicity`),
      candidateValue: requireValue(valuesById, input.candidateValue, 'action', 'DOMAIN_SOURCE_CANDIDATE', `${input.id} candidateValue`),
      producerContract: normalizeExternalContract(input.producerContract, catalogById, `${input.id} producerContract`),
      producerSchema: normalizeSchemaReference(input.producerSchema, `${input.id} producerSchema`),
      candidateAuthority: normalizeSchemaReference(input.candidateAuthority, `${input.id} candidateAuthority`),
    };
  }
  if (input.kind === 'combined') {
    exactKeys(input, ['id', 'kind', 'members', 'ordering', 'multiplicity', 'deduplication', 'completion'], 'DOMAIN_SOURCE_FIELDS', label);
    const ordering = assertEnum(input.ordering, ['semantic', 'non-semantic'], 'DOMAIN_SOURCE_ORDERING', `${input.id} ordering`);
    if (!Array.isArray(input.members) || input.members.length < 2) fail('DOMAIN_SOURCE_MEMBERS', `${input.id} members must contain at least two sources`);
    const members = input.members.map((member, memberIndex) => {
      assertNamespacedId(member, 'DOMAIN_SOURCE_MEMBERS', `${input.id} member ${memberIndex}`);
      return member;
    });
    if (new Set(members).size !== members.length) fail('DOMAIN_SOURCE_MEMBERS', `${input.id} members contains a duplicate`);
    if (ordering === 'non-semantic') members.sort(compareRaw);
    const multiplicity = assertEnum(input.multiplicity, ['unique', 'repeatable-sample'], 'DOMAIN_SOURCE_MULTIPLICITY', `${input.id} multiplicity`);
    const deduplication = assertEnum(input.deduplication, ['domain-equality', 'preserve-multiplicity'], 'DOMAIN_SOURCE_DEDUP', `${input.id} deduplication`);
    if (deduplication === 'domain-equality' && multiplicity !== 'unique') fail('DOMAIN_SOURCE_DEDUP', `${input.id} domain-equality deduplication must produce unique multiplicity`);
    return {
      id: input.id,
      kind: 'combined',
      members,
      ordering,
      multiplicity,
      deduplication,
      completion: assertEnum(input.completion, ['all-complete', 'budget-bounded'], 'DOMAIN_SOURCE_COMPLETION', `${input.id} completion`),
    };
  }
  fail('DOMAIN_SOURCE_KIND', `${label} kind is invalid`);
}

function assertSourceClosure(sources) {
  const byId = new Map(sources.map((source) => [source.id, source]));
  for (const source of sources) {
    if (source.kind !== 'combined') continue;
    for (const member of source.members) {
      if (!byId.has(member)) fail('DOMAIN_SOURCE_MEMBER', `${source.id} names unknown member ${member}`);
      if (member === source.id) fail('DOMAIN_SOURCE_CYCLE', `${source.id} contains itself`);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) fail('DOMAIN_SOURCE_CYCLE', `combined action sources contain a cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    const source = byId.get(id);
    if (source?.kind === 'combined') source.members.forEach(visit);
    visiting.delete(id);
    visited.add(id);
  }
  sources.forEach(({ id }) => visit(id));
}

function normalizeTransitionMode(input, index, valuesById) {
  exactKeys(input, ['id', 'kind', 'inputValue', 'outputValue', 'metadataValue', 'randomness', 'observation', 'numericRules', 'semantics'], 'DOMAIN_TRANSITION_FIELDS', `transition mode ${index}`);
  assertNamespacedId(input.id, 'DOMAIN_TRANSITION_ID', `transition mode ${index} id`);
  const kind = assertEnum(input.kind, ['deterministic', 'explicit-outcome', 'sampled-stochastic', 'observation-bearing', 'custom'], 'DOMAIN_TRANSITION_KIND', `${input.id} kind`);
  const randomness = normalizeRandomness(input.randomness, `${input.id} randomness`);
  if ((kind === 'sampled-stochastic') !== (randomness.kind === 'explicit-input') && kind !== 'custom') {
    fail('DOMAIN_TRANSITION_RANDOMNESS', `${input.id} randomness is incompatible with ${kind}`);
  }
  const observation = assertEnum(input.observation, ['none', 'successor-state', 'transition-metadata', 'history-update', 'domain-port'], 'DOMAIN_TRANSITION_OBSERVATION', `${input.id} observation`);
  if ((kind === 'observation-bearing') !== (observation !== 'none') && kind !== 'custom') {
    fail('DOMAIN_TRANSITION_OBSERVATION', `${input.id} observation is incompatible with ${kind}`);
  }
  if (!Array.isArray(input.numericRules)) fail('DOMAIN_TRANSITION_NUMERICS', `${input.id} numericRules must be an array`);
  const numericRules = input.numericRules.map((rule, ruleIndex) => normalizeSchemaReference(rule, `${input.id} numericRules ${ruleIndex}`));
  numericRules.sort((left, right) => compareRaw(`${left.id}\0${left.version}\0${left.sha256}`, `${right.id}\0${right.version}\0${right.sha256}`));
  const numericKeys = numericRules.map((rule) => `${rule.id}\0${rule.version}`);
  if (new Set(numericKeys).size !== numericKeys.length) fail('DOMAIN_TRANSITION_NUMERICS', `${input.id} repeats a numeric rule`);
  return {
    id: input.id,
    kind,
    inputValue: requireValue(valuesById, input.inputValue, 'transition-input', 'DOMAIN_TRANSITION_INPUT', `${input.id} inputValue`),
    outputValue: requireValue(valuesById, input.outputValue, 'transition-output', 'DOMAIN_TRANSITION_OUTPUT', `${input.id} outputValue`),
    metadataValue: requireValue(valuesById, input.metadataValue, 'transition-metadata', 'DOMAIN_TRANSITION_METADATA', `${input.id} metadataValue`),
    randomness,
    observation,
    numericRules,
    semantics: normalizeSchemaReference(input.semantics, `${input.id} semantics`),
  };
}

function normalizeRole(input, index, valuesById, sourcesById, transitionsById) {
  const label = `role ${index}`;
  assertNamespacedId(input?.id, 'DOMAIN_ROLE_ID', `${label} id`);
  if (input.terminal === true) {
    exactKeys(input, ['id', 'category', 'terminal', 'terminalOutcomeValue'], 'DOMAIN_ROLE_FIELDS', label);
    return {
      id: input.id,
      category: assertEnum(input.category, ['terminal', 'custom'], 'DOMAIN_ROLE_CATEGORY', `${input.id} category`),
      terminal: true,
      terminalOutcomeValue: requireValue(valuesById, input.terminalOutcomeValue, 'terminal-outcome', 'DOMAIN_ROLE_OUTCOME', `${input.id} terminalOutcomeValue`),
    };
  }
  exactKeys(input, ['id', 'category', 'terminal', 'selectorAuthority', 'actionSources', 'transitionMode', 'successorRoles', 'zeroActionDisposition'], 'DOMAIN_ROLE_FIELDS', label);
  if (input.terminal !== false) fail('DOMAIN_ROLE_TERMINAL', `${input.id} terminal must be boolean`);
  assertNamespacedId(input.selectorAuthority, 'DOMAIN_ROLE_AUTHORITY', `${input.id} selectorAuthority`);
  const actionSources = normalizeStringSet(input.actionSources, { code: 'DOMAIN_ROLE_SOURCES', label: `${input.id} actionSources`, namespaced: true, minimum: 1 });
  if (actionSources.length !== 1) fail('DOMAIN_ROLE_SOURCES', `${input.id} must select exactly one source; compose multiple sources explicitly`);
  if (!sourcesById.has(actionSources[0])) fail('DOMAIN_ROLE_SOURCE', `${input.id} names unknown source ${actionSources[0]}`);
  assertNamespacedId(input.transitionMode, 'DOMAIN_ROLE_TRANSITION', `${input.id} transitionMode`);
  if (!transitionsById.has(input.transitionMode)) fail('DOMAIN_ROLE_TRANSITION', `${input.id} names unknown transition mode`);
  return {
    id: input.id,
    category: assertEnum(input.category, ['decision', 'chance', 'automatic', 'observation', 'custom'], 'DOMAIN_ROLE_CATEGORY', `${input.id} category`),
    terminal: false,
    selectorAuthority: input.selectorAuthority,
    actionSources,
    transitionMode: input.transitionMode,
    successorRoles: normalizeStringSet(input.successorRoles, { code: 'DOMAIN_ROLE_SUCCESSORS', label: `${input.id} successorRoles`, namespaced: true, minimum: 1 }),
    zeroActionDisposition: (() => {
      assertNamespacedId(input.zeroActionDisposition, 'DOMAIN_ROLE_ZERO_ACTION', `${input.id} zeroActionDisposition`);
      return input.zeroActionDisposition;
    })(),
  };
}

function normalizeFailure(input, index) {
  exactKeys(input, ['code', 'kind', 'diagnostic'], 'DOMAIN_FAILURE_FIELDS', `failure ${index}`);
  assertString(input.code, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, 'DOMAIN_FAILURE_CODE', `failure ${index} code`);
  if (typeof input.diagnostic !== 'boolean') fail('DOMAIN_FAILURE_DIAGNOSTIC', `${input.code} diagnostic must be boolean`);
  return {
    code: input.code,
    kind: assertEnum(input.kind, ['input', 'capacity', 'cancellation', 'compatibility', 'exhaustion', 'unsupported', 'internal'], 'DOMAIN_FAILURE_KIND', `${input.code} kind`),
    diagnostic: input.diagnostic,
  };
}

function normalizeCompletion(input, valuesById, label) {
  if (input?.kind === 'bounded') {
    exactKeys(input, ['kind'], 'DOMAIN_COMPLETION_FIELDS', label);
    return { kind: 'bounded' };
  }
  exactKeys(input, ['kind', 'continuationValue', 'maxResumptions', 'partialPublication'], 'DOMAIN_COMPLETION_FIELDS', label);
  if (input.kind !== 'resumable' || input.partialPublication !== 'forbidden') fail('DOMAIN_COMPLETION_KIND', `${label} must be bounded or finite resumable without partial publication`);
  return {
    kind: 'resumable',
    continuationValue: requireValue(valuesById, input.continuationValue, 'action-cursor', 'DOMAIN_COMPLETION_CURSOR', `${label} continuationValue`),
    maxResumptions: normalizePositiveDecimal(input.maxResumptions, 'DOMAIN_COMPLETION_BOUND', `${label} maxResumptions`),
    partialPublication: input.partialPublication,
  };
}

function normalizePort(input, index, valuesById, failureCodes) {
  exactKeys(input, ['id', 'contract', 'inputs', 'outputs', 'failures', 'bounds', 'completion'], 'DOMAIN_PORT_FIELDS', `port ${index}`);
  assertEnum(input.id, [...REQUIRED_PORTS, ...OPTIONAL_PORTS], 'DOMAIN_PORT_ID', `port ${index} id`);
  const inputs = normalizeStringSet(input.inputs, { code: 'DOMAIN_PORT_INPUTS', label: `${input.id} inputs`, namespaced: true, minimum: 1 });
  const outputs = normalizeStringSet(input.outputs, { code: 'DOMAIN_PORT_OUTPUTS', label: `${input.id} outputs`, namespaced: true, minimum: 1 });
  for (const id of [...inputs, ...outputs]) if (!valuesById.has(id)) fail('DOMAIN_PORT_VALUE', `${input.id} references unknown value ${id}`);
  const failures = normalizeStringSet(input.failures, { code: 'DOMAIN_PORT_FAILURES', label: `${input.id} failures`, minimum: 1 });
  for (const code of failures) if (!failureCodes.has(code)) fail('DOMAIN_PORT_FAILURE', `${input.id} names undeclared failure ${code}`);
  const bounds = normalizeExecutionBounds(input.bounds, `${input.id} bounds`);
  return {
    id: input.id,
    contract: normalizeSchemaReference(input.contract, `${input.id} contract`),
    inputs,
    outputs,
    failures,
    bounds,
    completion: normalizeCompletion(input.completion, valuesById, `${input.id} completion`),
  };
}

function normalizeResource(input, index) {
  exactKeys(input, ['id', 'unit', 'minimum', 'maximum', 'alignment', 'memorySpaces', 'scope', 'pressureOutcome'], 'DOMAIN_RESOURCE_FIELDS', `resource ${index}`);
  assertNamespacedId(input.id, 'DOMAIN_RESOURCE_ID', `resource ${index} id`);
  const minimum = normalizeDecimalUint(input.minimum, `${input.id} minimum`);
  const maximum = normalizeDecimalUint(input.maximum, `${input.id} maximum`);
  if (compareDecimal(minimum, maximum) > 0) fail('DOMAIN_RESOURCE_RANGE', `${input.id} minimum exceeds maximum`);
  assertString(input.pressureOutcome, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, 'DOMAIN_RESOURCE_PRESSURE', `${input.id} pressureOutcome`);
  return {
    id: input.id,
    unit: assertEnum(input.unit, ['bytes', 'records', 'items', 'work-units', 'random-inputs', 'diagnostics'], 'DOMAIN_RESOURCE_UNIT', `${input.id} unit`),
    minimum,
    maximum,
    alignment: normalizePositiveDecimal(input.alignment, 'DOMAIN_RESOURCE_ALIGNMENT', `${input.id} alignment`),
    memorySpaces: normalizeStringSet(input.memorySpaces, { code: 'DOMAIN_RESOURCE_MEMORY', label: `${input.id} memorySpaces`, allowed: MEMORY_SPACES, minimum: 1 }),
    scope: assertEnum(input.scope, ['per-engine', 'per-worker', 'per-invocation'], 'DOMAIN_RESOURCE_SCOPE', `${input.id} scope`),
    pressureOutcome: input.pressureOutcome,
  };
}

function normalizeDiagnostics(input) {
  exactKeys(input, ['authority', 'maxRecords', 'maxBytes', 'overflow'], 'DOMAIN_DIAGNOSTIC_FIELDS', 'diagnostics');
  if (input.authority !== 'non-authoritative') fail('DOMAIN_DIAGNOSTIC_AUTHORITY', 'diagnostics cannot be semantic authority');
  return {
    authority: input.authority,
    maxRecords: normalizeDecimalUint(input.maxRecords, 'diagnostics maxRecords'),
    maxBytes: normalizeDecimalUint(input.maxBytes, 'diagnostics maxBytes'),
    overflow: assertEnum(input.overflow, ['drop', 'count', 'terminal'], 'DOMAIN_DIAGNOSTIC_OVERFLOW', 'diagnostics overflow'),
  };
}

function normalizeCompatibility(input, identityScope) {
  exactKeys(input, ['crossProfileEquality', 'persistence', 'hostDeviceRepresentation'], 'DOMAIN_COMPAT_FIELDS', 'compatibility');
  if (input.crossProfileEquality !== 'false-unless-versioned-compatibility') fail('DOMAIN_COMPAT_EQUALITY', 'cross-profile equality must fail closed');
  let persistence;
  if (input.persistence?.kind === 'none') {
    exactKeys(input.persistence, ['kind'], 'DOMAIN_PERSISTENCE_FIELDS', 'persistence');
    persistence = { kind: 'none' };
  } else {
    exactKeys(input.persistence, ['kind', 'encoding', 'namespace', 'integrity', 'migration', 'rollback', 'partialWriteRecovery', 'retention'], 'DOMAIN_PERSISTENCE_FIELDS', 'persistence');
    if (input.persistence.kind !== 'versioned') fail('DOMAIN_PERSISTENCE_KIND', 'persistence kind is invalid');
    assertNamespacedId(input.persistence.namespace, 'DOMAIN_PERSISTENCE_NAMESPACE', 'persistence namespace');
    persistence = {
      kind: 'versioned',
      encoding: normalizeSchemaReference(input.persistence.encoding, 'persistence encoding'),
      namespace: input.persistence.namespace,
      integrity: normalizeSchemaReference(input.persistence.integrity, 'persistence integrity'),
      migration: normalizeSchemaReference(input.persistence.migration, 'persistence migration'),
      rollback: normalizeSchemaReference(input.persistence.rollback, 'persistence rollback'),
      partialWriteRecovery: normalizeSchemaReference(input.persistence.partialWriteRecovery, 'persistence partialWriteRecovery'),
      retention: normalizeSchemaReference(input.persistence.retention, 'persistence retention'),
    };
  }
  if ((identityScope === 'persistence-namespace') !== (persistence.kind === 'versioned')) {
    fail('DOMAIN_PERSISTENCE_SCOPE', 'persistence identity scope and persistence contract must be selected together');
  }
  let hostDeviceRepresentation;
  if (input.hostDeviceRepresentation?.kind === 'identical') {
    exactKeys(input.hostDeviceRepresentation, ['kind'], 'DOMAIN_HOST_DEVICE_FIELDS', 'hostDeviceRepresentation');
    hostDeviceRepresentation = { kind: 'identical' };
  } else {
    exactKeys(input.hostDeviceRepresentation, ['kind', 'adapter', 'roundTripEvidence'], 'DOMAIN_HOST_DEVICE_FIELDS', 'hostDeviceRepresentation');
    if (input.hostDeviceRepresentation.kind !== 'versioned-adapter') fail('DOMAIN_HOST_DEVICE_KIND', 'host/device representation kind is invalid');
    hostDeviceRepresentation = {
      kind: 'versioned-adapter',
      adapter: normalizeSchemaReference(input.hostDeviceRepresentation.adapter, 'hostDeviceRepresentation adapter'),
      roundTripEvidence: normalizeContentIdentity(input.hostDeviceRepresentation.roundTripEvidence, 'DOMAIN_HOST_DEVICE_EVIDENCE', 'hostDeviceRepresentation roundTripEvidence'),
    };
  }
  return { crossProfileEquality: input.crossProfileEquality, persistence, hostDeviceRepresentation };
}

function normalizeProgramContribution(input) {
  exactKeys(input, ['language', 'sourceIdentity', 'inputs', 'provenance'], 'DOMAIN_PROGRAM_FIELDS', 'programContribution');
  if (input.language !== 'restricted-device-js') fail('DOMAIN_PROGRAM_LANGUAGE', 'domain program contribution must use restricted Device-JS');
  if (!Array.isArray(input.inputs)) fail('DOMAIN_PROGRAM_INPUTS', 'program inputs must be an array');
  const inputs = input.inputs.map((entry, index) => {
    exactKeys(entry, ['id', 'schema', 'identity'], 'DOMAIN_PROGRAM_INPUT_FIELDS', `program input ${index}`);
    assertNamespacedId(entry.id, 'DOMAIN_PROGRAM_INPUT_ID', `program input ${index} id`);
    return {
      id: entry.id,
      schema: normalizeSchemaReference(entry.schema, `${entry.id} schema`),
      identity: normalizeContentIdentity(entry.identity, 'DOMAIN_PROGRAM_INPUT_IDENTITY', `${entry.id} identity`),
    };
  }).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(inputs, 'id', 'DOMAIN_PROGRAM_INPUT_DUPLICATE', 'program input');
  exactKeys(input.provenance, ['origin', 'revision', 'license'], 'DOMAIN_PROGRAM_PROVENANCE_FIELDS', 'program provenance');
  assertEnum(input.provenance.origin, ['first-party', 'third-party-reviewed'], 'DOMAIN_PROGRAM_ORIGIN', 'program provenance origin');
  assertString(input.provenance.revision, /^[0-9a-f]{40}$/, 'DOMAIN_PROGRAM_REVISION', 'program provenance revision');
  if (typeof input.provenance.license !== 'string' || input.provenance.license.length === 0) fail('DOMAIN_PROGRAM_LICENSE', 'program provenance license is invalid');
  return {
    language: input.language,
    sourceIdentity: normalizeContentIdentity(input.sourceIdentity, 'DOMAIN_PROGRAM_SOURCE', 'program sourceIdentity'),
    inputs,
    provenance: { ...input.provenance },
  };
}

function normalizeProductData(input, index) {
  exactKeys(input, ['ownerContract', 'schema', 'identity'], 'DOMAIN_PRODUCT_FIELDS', `product data ${index}`);
  if (input.ownerContract?.kind !== 'namespaced') fail('DOMAIN_PRODUCT_OWNER', `product data ${index} must have a namespaced owner contract`);
  return {
    ownerContract: normalizeExternalContract(input.ownerContract, new Map(), `product data ${index} ownerContract`),
    schema: normalizeSchemaReference(input.schema, `product data ${index} schema`),
    identity: normalizeContentIdentity(input.identity, 'DOMAIN_PRODUCT_IDENTITY', `product data ${index} identity`),
  };
}

function productKey(product) {
  return `${product.ownerContract.id}\0${product.ownerContract.version}`;
}

export function normalizeDomainProfile(input, inspectedCatalog) {
  exactKeys(input, ['schema', 'representation', 'status', 'contract', 'id', 'version', 'valueSchemas', 'identity', 'history', 'rootForms', 'roles', 'actionSources', 'transitionModes', 'ports', 'resources', 'failures', 'diagnostics', 'compatibility', 'programContribution', 'productData'], 'DOMAIN_ROOT_FIELDS', 'domain profile');
  if (input.schema !== DOMAIN_PROFILE_SCHEMA || input.representation !== SEARCH_IR_REPRESENTATION) fail('DOMAIN_SCHEMA', 'unsupported domain profile schema/representation');
  if (input.status !== 'proposal-evidence') fail('DOMAIN_STATUS', 'domain profile must remain proposal evidence');
  assertNamespacedId(input.id, 'DOMAIN_PROFILE_ID', 'domain profile id');
  assertVersion(input.version, 'DOMAIN_PROFILE_VERSION', 'domain profile version');
  const contracts = inspectedCatalog?.contractSet?.contracts;
  if (!contracts) fail('DOMAIN_CATALOG', 'inspected contract set is required');
  const catalogById = new Map(contracts.map((contract) => [contract.id, contract]));

  if (!Array.isArray(input.valueSchemas) || input.valueSchemas.length !== VALUE_ROLES.length) {
    fail('DOMAIN_VALUE_COUNT', `domain profile must select exactly ${VALUE_ROLES.length} value schemas`);
  }
  const valueSchemas = input.valueSchemas.map(normalizeValueSchema).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(valueSchemas, 'id', 'DOMAIN_VALUE_DUPLICATE', 'value schema');
  uniqueBy(valueSchemas, 'semanticRole', 'DOMAIN_VALUE_ROLE_DUPLICATE', 'value semanticRole');
  if (valueSchemas.map(({ semanticRole }) => semanticRole).sort(compareRaw).join(',') !== VALUE_ROLES.join(',')) {
    fail('DOMAIN_VALUE_ROLES', 'domain value schema roles are incomplete');
  }
  const valuesById = valueMap(valueSchemas);

  const identity = normalizeIdentity(input.identity, valuesById);
  const history = normalizeHistory(input.history, valuesById);

  if (!Array.isArray(input.rootForms) || input.rootForms.length === 0) fail('DOMAIN_ROOT_COUNT', 'at least one root form is required');
  const rootForms = input.rootForms.map((root, index) => normalizeRootForm(root, index, valuesById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(rootForms, 'id', 'DOMAIN_ROOT_DUPLICATE', 'root form');

  if (!Array.isArray(input.actionSources)) fail('DOMAIN_SOURCE_COUNT', 'actionSources must be an array');
  const actionSources = input.actionSources.map((source, index) => normalizeActionSource(source, index, valuesById, catalogById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(actionSources, 'id', 'DOMAIN_SOURCE_DUPLICATE', 'action source');
  assertSourceClosure(actionSources);
  const sourcesById = new Map(actionSources.map((source) => [source.id, source]));

  if (!Array.isArray(input.transitionModes)) fail('DOMAIN_TRANSITION_COUNT', 'transitionModes must be an array');
  const transitionModes = input.transitionModes.map((mode, index) => normalizeTransitionMode(mode, index, valuesById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(transitionModes, 'id', 'DOMAIN_TRANSITION_DUPLICATE', 'transition mode');
  const transitionsById = new Map(transitionModes.map((mode) => [mode.id, mode]));

  if (!Array.isArray(input.roles) || input.roles.length === 0) fail('DOMAIN_ROLE_COUNT', 'at least one role is required');
  const roles = input.roles.map((role, index) => normalizeRole(role, index, valuesById, sourcesById, transitionsById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(roles, 'id', 'DOMAIN_ROLE_DUPLICATE', 'role');
  const roleIds = new Set(roles.map(({ id }) => id));
  for (const role of roles) {
    if (role.terminal) continue;
    for (const successor of role.successorRoles) if (!roleIds.has(successor)) fail('DOMAIN_ROLE_SUCCESSOR', `${role.id} names unknown successor role ${successor}`);
  }
  const directlySelectedSources = new Set(roles.filter(({ terminal }) => !terminal).map(({ actionSources }) => actionSources[0]));
  const selectedSources = new Set();
  function selectSource(id) {
    if (selectedSources.has(id)) return;
    selectedSources.add(id);
    const source = sourcesById.get(id);
    if (source?.kind === 'combined') source.members.forEach(selectSource);
  }
  directlySelectedSources.forEach(selectSource);
  if (selectedSources.size !== actionSources.length) fail('DOMAIN_SOURCE_UNUSED', 'domain profile contains an unselected action source');
  const selectedTransitionIds = new Set(roles.filter(({ terminal }) => !terminal).map(({ transitionMode }) => transitionMode));
  if (selectedTransitionIds.size !== transitionModes.length) fail('DOMAIN_TRANSITION_UNUSED', 'domain profile contains an unselected transition mode');

  if (!Array.isArray(input.failures)) fail('DOMAIN_FAILURE_COUNT', 'failures must be an array');
  const failures = input.failures.map(normalizeFailure).sort((left, right) => compareRaw(left.code, right.code));
  uniqueBy(failures, 'code', 'DOMAIN_FAILURE_DUPLICATE', 'failure');
  const failureCodes = new Set(failures.map(({ code }) => code));
  for (const required of REQUIRED_FAILURES) if (!failureCodes.has(required)) fail('DOMAIN_FAILURE_REQUIRED', `required failure ${required} is absent`);

  if (!Array.isArray(input.ports)) fail('DOMAIN_PORT_COUNT', 'ports must be an array');
  const ports = input.ports.map((port, index) => normalizePort(port, index, valuesById, failureCodes)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(ports, 'id', 'DOMAIN_PORT_DUPLICATE', 'port');
  const portIds = new Set(ports.map(({ id }) => id));
  for (const required of REQUIRED_PORTS) if (!portIds.has(required)) fail('DOMAIN_PORT_REQUIRED', `required port ${required} is absent`);
  const needsAdvanceHistory = ['carried', 'hybrid'].includes(history.disposition);
  if (portIds.has('advance-history') !== needsAdvanceHistory) fail('DOMAIN_PORT_HISTORY', 'advance-history presence must match history disposition');
  const needsProduceActions = [...selectedSources].some((id) => sourcesById.get(id).kind === 'intrinsic');
  if (portIds.has('produce-actions') !== needsProduceActions) fail('DOMAIN_PORT_ACTION_SOURCE', 'produce-actions presence must match selected intrinsic action sources');
  const applyTransition = ports.find(({ id }) => id === 'apply-transition');
  const maxTransitionRandom = transitionModes.reduce((maximum, mode) => compareDecimal(mode.randomness.maxInputs, maximum) > 0 ? mode.randomness.maxInputs : maximum, '0');
  if (compareDecimal(applyTransition.bounds.maxRandomInputs, maxTransitionRandom) < 0) {
    fail('DOMAIN_PORT_RANDOM_BOUND', 'apply-transition random-input bound is below a selected transition requirement');
  }
  if (needsProduceActions) {
    const produceActions = ports.find(({ id }) => id === 'produce-actions');
    const maxSourceRandom = [...selectedSources]
      .map((id) => sourcesById.get(id))
      .filter(({ kind }) => kind === 'intrinsic')
      .reduce((maximum, source) => compareDecimal(source.randomness.maxInputs, maximum) > 0 ? source.randomness.maxInputs : maximum, '0');
    if (compareDecimal(produceActions.bounds.maxRandomInputs, maxSourceRandom) < 0) {
      fail('DOMAIN_PORT_RANDOM_BOUND', 'produce-actions random-input bound is below a selected source requirement');
    }
  }

  if (!Array.isArray(input.resources) || input.resources.length === 0) fail('DOMAIN_RESOURCE_COUNT', 'at least one domain resource contribution is required');
  const resources = input.resources.map(normalizeResource).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(resources, 'id', 'DOMAIN_RESOURCE_DUPLICATE', 'resource');
  for (const resource of resources) if (!failureCodes.has(resource.pressureOutcome)) fail('DOMAIN_RESOURCE_PRESSURE', `${resource.id} pressureOutcome is undeclared`);

  const compatibility = normalizeCompatibility(input.compatibility, identity.scope);
  const programContribution = normalizeProgramContribution(input.programContribution);
  if (!Array.isArray(input.productData)) fail('DOMAIN_PRODUCT_COUNT', 'productData must be an array');
  const productData = input.productData.map(normalizeProductData).sort((left, right) => compareRaw(productKey(left), productKey(right)));
  const productKeys = productData.map(productKey);
  if (new Set(productKeys).size !== productKeys.length) fail('DOMAIN_PRODUCT_DUPLICATE', 'productData repeats an owner contract/version');

  const normalized = {
    schema: input.schema,
    representation: input.representation,
    status: input.status,
    contract: normalizeDomainContract(input.contract, catalogById),
    id: input.id,
    version: input.version,
    valueSchemas,
    identity,
    history,
    rootForms,
    roles,
    actionSources,
    transitionModes,
    ports,
    resources,
    failures,
    diagnostics: normalizeDiagnostics(input.diagnostics),
    compatibility,
    programContribution,
    productData,
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}

export const domainConstants = Object.freeze({
  schema: DOMAIN_PROFILE_SCHEMA,
  representation: SEARCH_IR_REPRESENTATION,
  valueRoles: Object.freeze([...VALUE_ROLES]),
  requiredPorts: Object.freeze([...REQUIRED_PORTS]),
  requiredFailures: Object.freeze([...REQUIRED_FAILURES]),
});

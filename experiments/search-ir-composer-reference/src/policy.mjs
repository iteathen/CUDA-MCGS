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

const POLICY_SCHEMA = 'cuda-mcgs.policy-profile/0.2.0';
const REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const POLICY_CONTRACT = 'SPEC-0008';
const STATUS_CODES = [
  'backup-target-stale', 'cancelled', 'duplicate-backup', 'invalid-action-candidate', 'invalid-policy-profile', 'invalid-policy-record',
  'invalid-value', 'no-eligible-candidate', 'partial-backup-fatal', 'policy-budget-counter-exhausted', 'policy-budget-satisfied',
  'policy-generation-exhausted', 'policy-internal-failure', 'required-input-unavailable', 'reservation-capacity', 'reservation-imbalance',
  'statistics-overflow', 'unsupported-cycle-relation', 'unsupported-domain-role', 'value-schema-mismatch',
];
const BASE_PORTS = [
  'classify-policy-reuse', 'classify-role-handler', 'decide-action-admission', 'evaluate-policy-stop',
  'initialize-policy-records', 'select-next',
];
const CYCLE_PORTS = ['classify-path-response'];
const RESERVATION_PORTS = ['release-in-flight', 'reserve-in-flight'];
const BACKUP_PORTS = ['apply-backup-step', 'complete-backup', 'fail-backup', 'prepare-backup'];
const VALUE_PORTS = ['map-evaluator-output', 'map-terminal-outcome'];
const PORTS = [...BASE_PORTS, ...CYCLE_PORTS, ...RESERVATION_PORTS, ...BACKUP_PORTS, ...VALUE_PORTS];

function assertEnum(value, allowed, code, label) {
  if (!allowed.includes(value)) fail(code, `${label} is invalid`);
  return value;
}

function positiveDecimal(value, code, label) {
  const result = normalizeDecimalUint(value, label);
  if (result === '0') fail(code, `${label} must be positive`);
  return result;
}

function stringSet(input, { code, label, allowed = null, namespaced = false, minimum = 0, preserve = false }) {
  if (!Array.isArray(input) || input.length < minimum) fail(code, `${label} must contain at least ${minimum} item(s)`);
  const result = input.map((value, index) => {
    if (namespaced) assertNamespacedId(value, code, `${label} ${index}`);
    else if (allowed) assertEnum(value, allowed, code, `${label} ${index}`);
    else assertString(value, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, code, `${label} ${index}`);
    return value;
  });
  if (new Set(result).size !== result.length) fail(code, `${label} contains a duplicate`);
  if (!preserve) result.sort(compareRaw);
  return result;
}

function schemaKey(reference) {
  return `${reference.id}\0${reference.version}\0${reference.sha256}`;
}

function identityReference(input, code, label) {
  return normalizeContentIdentity(input, code, label);
}

function normalizeProfileReference(input, label) {
  exactKeys(input, ['id', 'schema', 'identity'], 'POLICY_PROFILE_REFERENCE_FIELDS', label);
  assertNamespacedId(input.id, 'POLICY_PROFILE_REFERENCE_ID', `${label} id`);
  return {
    id: input.id,
    schema: normalizeSchemaReference(input.schema, `${label} schema`),
    identity: identityReference(input.identity, 'POLICY_PROFILE_REFERENCE_IDENTITY', `${label} identity`),
  };
}

function normalizeCatalogContract(input, catalogById) {
  exactKeys(input, ['kind', 'id', 'specificationIdentity', 'sha256'], 'POLICY_CONTRACT_FIELDS', 'policy contract');
  if (input.kind !== 'catalog' || input.id !== POLICY_CONTRACT) fail('POLICY_CONTRACT_ID', `policy contract must select ${POLICY_CONTRACT}`);
  assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\.[0-9]+\.[0-9]+-draft$/, 'POLICY_CONTRACT_ID', 'policy contract identity');
  assertSha256(input.sha256, 'POLICY_CONTRACT_DIGEST', 'policy contract sha256');
  const expected = catalogById.get(POLICY_CONTRACT);
  if (!expected || expected.specificationIdentity !== input.specificationIdentity || expected.sha256 !== input.sha256) fail('POLICY_CONTRACT_DRIFT', 'policy contract differs from the frozen catalog');
  return { ...input };
}

function normalizeDomainReference(input, domainResult) {
  exactKeys(input, ['id', 'schema', 'identity', 'classifyRolePort', 'produceActionsPort', 'terminalOutcomePort', 'classifyPathRelationPort'], 'POLICY_DOMAIN_FIELDS', 'domainProfile');
  const domain = domainResult?.normalized;
  if (!domain || !domainResult.identity) fail('POLICY_DOMAIN_INPUT', 'normalized domain profile is required');
  const reference = normalizeProfileReference({ id: input.id, schema: input.schema, identity: input.identity }, 'domainProfile');
  if (reference.id !== domain.id || reference.schema.id !== domain.schema || reference.identity.sha256 !== domainResult.identity.sha256) fail('POLICY_DOMAIN_DRIFT', 'domainProfile differs from the normalized domain input');
  const ports = new Map(domain.ports.map(({ id, contract }) => [id, contract]));
  const bindings = [['classifyRolePort', 'classify-role'], ['produceActionsPort', 'produce-actions'], ['terminalOutcomePort', 'terminal-outcome'], ['classifyPathRelationPort', 'classify-path-relation']];
  const result = { ...reference };
  for (const [field, port] of bindings) {
    const value = normalizeSchemaReference(input[field], `domainProfile ${field}`);
    if (schemaKey(value) !== schemaKey(ports.get(port))) fail('POLICY_DOMAIN_PORT_DRIFT', `${field} differs from domain ${port}`);
    result[field] = value;
  }
  return result;
}

function normalizeGraphReference(input, graphResult) {
  const graph = graphResult?.normalized;
  if (!graph || !graphResult.identity) fail('POLICY_GRAPH_INPUT', 'normalized graph profile is required');
  const baseFields = ['id', 'schema', 'identity', 'mode'];
  const materialized = input?.mode === 'materialized';
  exactKeys(input, materialized ? [...baseFields, 'reserveEdgePort', 'readPathViewPort', 'validateReferencePort'] : baseFields, 'POLICY_GRAPH_FIELDS', 'graphProfile');
  if (!['materialized', 'stateless'].includes(input.mode)) fail('POLICY_GRAPH_MODE', 'graphProfile mode is invalid');
  const reference = normalizeProfileReference({ id: input.id, schema: input.schema, identity: input.identity }, 'graphProfile');
  if (reference.id !== graph.id || reference.schema.id !== graph.schema || reference.identity.sha256 !== graphResult.identity.sha256 || input.mode !== graph.mode) fail('POLICY_GRAPH_DRIFT', 'graphProfile differs from normalized graph input');
  const result = { ...reference, mode: input.mode };
  if (!materialized) return result;
  const ports = new Map(graph.ports.map(({ id, contract }) => [id, contract]));
  for (const [field, port] of [['reserveEdgePort', 'reserve-edge'], ['readPathViewPort', 'read-path-view'], ['validateReferencePort', 'validate-reference']]) {
    const value = normalizeSchemaReference(input[field], `graphProfile ${field}`);
    if (schemaKey(value) !== schemaKey(ports.get(port))) fail('POLICY_GRAPH_PORT_DRIFT', `${field} differs from graph ${port}`);
    result[field] = value;
  }
  return result;
}

function normalizeBounds(input, label) {
  exactKeys(input, ['maxWorkUnits', 'maxReads', 'maxWrites', 'maxRandomInputs', 'cancellationObservationWorkUnits'], 'POLICY_BOUNDS_FIELDS', label);
  const result = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, normalizeDecimalUint(value, `${label} ${key}`)]));
  positiveDecimal(result.maxWorkUnits, 'POLICY_BOUNDS_WORK', `${label} maxWorkUnits`);
  positiveDecimal(result.cancellationObservationWorkUnits, 'POLICY_BOUNDS_CANCELLATION', `${label} cancellationObservationWorkUnits`);
  if (compareDecimalUint(result.cancellationObservationWorkUnits, result.maxWorkUnits) > 0) fail('POLICY_BOUNDS_CANCELLATION', `${label} cancellation bound exceeds work bound`);
  return result;
}

function normalizeRoleHandler(input, index, domainRoles) {
  exactKeys(input, ['role', 'category', 'candidateSources', 'readiness', 'selectionMode', 'noActionOutcome', 'failure'], 'POLICY_ROLE_FIELDS', `roleHandler ${index}`);
  assertNamespacedId(input.role, 'POLICY_ROLE_ID', `roleHandler ${index} role`);
  const domainRole = domainRoles.get(input.role);
  if (!domainRole) fail('POLICY_ROLE_UNKNOWN', `${input.role} is not a selected domain role`);
  if (input.category !== domainRole.category) fail('POLICY_ROLE_CATEGORY', `${input.role} category differs from the domain profile`);
  const candidateSources = stringSet(input.candidateSources, { code: 'POLICY_ROLE_SOURCE', label: `${input.role} candidateSources`, allowed: ['ready-edge', 'action-source', 'automatic', 'observation', 'none', 'namespaced'], minimum: 1 });
  const terminal = domainRole.terminal;
  if (terminal !== (input.selectionMode === 'terminal') || terminal !== (input.readiness === 'terminal') || terminal !== (candidateSources.length === 1 && candidateSources[0] === 'none')) fail('POLICY_ROLE_TERMINAL', `${input.role} terminal handling is inconsistent`);
  if (!terminal && candidateSources.includes('none')) fail('POLICY_ROLE_SOURCE', `${input.role} nonterminal handler cannot use none`);
  if ((input.category === 'decision' && input.selectionMode !== 'compare') || (input.category === 'chance' && input.selectionMode !== 'sample')
      || (input.category === 'observation' && input.selectionMode !== 'forward')) fail('POLICY_ROLE_SELECTION', `${input.role} selectionMode is incompatible with its category`);
  return {
    role: input.role,
    category: input.category,
    candidateSources,
    readiness: assertEnum(input.readiness, ['required', 'optional', 'advisory', 'terminal'], 'POLICY_ROLE_READINESS', `${input.role} readiness`),
    selectionMode: assertEnum(input.selectionMode, ['compare', 'sample', 'enumerate', 'forward', 'terminal', 'custom'], 'POLICY_ROLE_SELECTION', `${input.role} selectionMode`),
    noActionOutcome: input.noActionOutcome,
    failure: input.failure,
  };
}

function normalizeNumeric(input, label) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'POLICY_NUMERIC_FIELDS', label);
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'representation', 'storageBits', 'accumulationBits', 'range', 'precision', 'rounding', 'nonfinite', 'overflow', 'order'], 'POLICY_NUMERIC_FIELDS', label);
  if (input.kind !== 'finite-numeric') fail('POLICY_NUMERIC_KIND', `${label} kind is invalid`);
  const storageBits = positiveDecimal(input.storageBits, 'POLICY_NUMERIC_WIDTH', `${label} storageBits`);
  const accumulationBits = positiveDecimal(input.accumulationBits, 'POLICY_NUMERIC_WIDTH', `${label} accumulationBits`);
  if (compareDecimalUint(accumulationBits, storageBits) < 0) fail('POLICY_NUMERIC_WIDTH', `${label} accumulationBits is narrower than storageBits`);
  return {
    kind: input.kind,
    representation: assertEnum(input.representation, ['integer', 'fixed', 'floating', 'custom'], 'POLICY_NUMERIC_REPRESENTATION', `${label} representation`),
    storageBits,
    accumulationBits,
    range: normalizeSchemaReference(input.range, `${label} range`),
    precision: normalizeSchemaReference(input.precision, `${label} precision`),
    rounding: assertEnum(input.rounding, ['exact', 'toward-zero', 'nearest-even', 'directed', 'custom'], 'POLICY_NUMERIC_ROUNDING', `${label} rounding`),
    nonfinite: assertEnum(input.nonfinite, ['not-representable', 'reject', 'typed', 'custom'], 'POLICY_NUMERIC_NONFINITE', `${label} nonfinite`),
    overflow: assertEnum(input.overflow, ['reject', 'typed-stop', 'quarantine', 'custom'], 'POLICY_NUMERIC_OVERFLOW', `${label} overflow`),
    order: assertEnum(input.order, ['associative-commutative', 'associative-ordered', 'nonassociative-ordered', 'custom'], 'POLICY_NUMERIC_ORDER', `${label} order`),
  };
}

function normalizeStorage(input, label, graphMode) {
  exactKeys(input, ['objectRole', 'sizeBytes', 'alignmentBytes', 'layout', 'lifecycle'], 'POLICY_STORAGE_FIELDS', label);
  const objectRole = assertEnum(input.objectRole, ['state-node', 'parent-edge', 'path-occurrence', 'root-anchor', 'separate-policy-arena'], 'POLICY_STORAGE_ROLE', `${label} objectRole`);
  if (graphMode === 'stateless' && objectRole !== 'separate-policy-arena') fail('POLICY_STORAGE_GRAPH', `${label} requires materialized graph storage`);
  return {
    objectRole,
    sizeBytes: positiveDecimal(input.sizeBytes, 'POLICY_STORAGE_SIZE', `${label} sizeBytes`),
    alignmentBytes: positiveDecimal(input.alignmentBytes, 'POLICY_STORAGE_ALIGNMENT', `${label} alignmentBytes`),
    layout: normalizeSchemaReference(input.layout, `${label} layout`),
    lifecycle: normalizeSchemaReference(input.lifecycle, `${label} lifecycle`),
  };
}

function normalizeRecord(input, index, graphMode) {
  exactKeys(input, ['id', 'scope', 'semanticKind', 'unit', 'schema', 'storage', 'initialization', 'operations', 'numeric', 'visibility', 'resultVisible'], 'POLICY_RECORD_FIELDS', `record ${index}`);
  assertNamespacedId(input.id, 'POLICY_RECORD_ID', `record ${index} id`);
  assertNamespacedId(input.unit, 'POLICY_RECORD_UNIT', `${input.id} unit`);
  if (typeof input.resultVisible !== 'boolean') fail('POLICY_RECORD_VISIBLE', `${input.id} resultVisible must be boolean`);
  const scope = assertEnum(input.scope, ['node', 'edge', 'path', 'root', 'work', 'global'], 'POLICY_RECORD_SCOPE', `${input.id} scope`);
  const storage = normalizeStorage(input.storage, `${input.id} storage`, graphMode);
  const expectedStorage = { node: 'state-node', edge: 'parent-edge', path: 'path-occurrence', root: 'root-anchor', work: 'separate-policy-arena', global: 'separate-policy-arena' }[scope];
  if (graphMode === 'materialized' && storage.objectRole !== expectedStorage && storage.objectRole !== 'separate-policy-arena') fail('POLICY_RECORD_STORAGE', `${input.id} storage does not match record scope`);
  const result = {
    id: input.id,
    scope,
    semanticKind: assertEnum(input.semanticKind, ['statistic', 'reservation', 'budget', 'proof', 'continuation', 'transaction', 'custom'], 'POLICY_RECORD_KIND', `${input.id} semanticKind`),
    unit: input.unit,
    schema: normalizeSchemaReference(input.schema, `${input.id} schema`),
    storage,
    initialization: normalizeSchemaReference(input.initialization, `${input.id} initialization`),
    operations: stringSet(input.operations, { code: 'POLICY_RECORD_OPERATION', label: `${input.id} operations`, namespaced: true, minimum: 1 }),
    numeric: normalizeNumeric(input.numeric, `${input.id} numeric`),
    visibility: assertEnum(input.visibility, ['private', 'release-acquire', 'atomic-reduction', 'owner-exclusive'], 'POLICY_RECORD_VISIBILITY', `${input.id} visibility`),
    resultVisible: input.resultVisible,
  };
  if (result.resultVisible && result.visibility === 'private') fail('POLICY_RECORD_VISIBLE', `${input.id} result-visible record cannot remain private`);
  if (['statistic', 'reservation', 'budget', 'proof'].includes(result.semanticKind) && result.numeric.kind === 'none') fail('POLICY_RECORD_NUMERIC', `${input.id} accounting record omits numeric rules`);
  return result;
}

function normalizeComparison(input, label) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'POLICY_COMPARISON_FIELDS', label);
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'semantics'], 'POLICY_COMPARISON_FIELDS', label);
  return { kind: assertEnum(input.kind, ['partial-order', 'total-order', 'custom'], 'POLICY_COMPARISON_KIND', `${label} kind`), semantics: normalizeSchemaReference(input.semantics, `${label} semantics`) };
}

function normalizeRandomness(input, label) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind', 'maxInputs'], 'POLICY_RANDOM_FIELDS', label);
    if (input.maxInputs !== '0') fail('POLICY_RANDOM_BOUND', `${label} none must consume zero inputs`);
    return { kind: 'none', maxInputs: '0' };
  }
  exactKeys(input, ['kind', 'maxInputs', 'semantics'], 'POLICY_RANDOM_FIELDS', label);
  if (input.kind !== 'explicit-input') fail('POLICY_RANDOM_KIND', `${label} kind is invalid`);
  return { kind: input.kind, maxInputs: positiveDecimal(input.maxInputs, 'POLICY_RANDOM_BOUND', `${label} maxInputs`), semantics: normalizeSchemaReference(input.semantics, `${label} semantics`) };
}

function normalizeSelection(input) {
  exactKeys(input, ['inputs', 'eligibility', 'comparison', 'tie', 'determinism', 'randomness', 'maxCandidates', 'bounds', 'noSelectionOutcomes'], 'POLICY_SELECTION_FIELDS', 'selection');
  const tie = assertEnum(input.tie, ['canonical', 'explicit-random', 'fairness-state', 'all-equivalent', 'custom'], 'POLICY_SELECTION_TIE', 'selection tie');
  const determinism = assertEnum(input.determinism, ['deterministic', 'explicit-stochastic', 'schedule-dependent-stable'], 'POLICY_SELECTION_DETERMINISM', 'selection determinism');
  const randomness = normalizeRandomness(input.randomness, 'selection randomness');
  if ((tie === 'explicit-random' || determinism === 'explicit-stochastic') !== (randomness.kind === 'explicit-input')) fail('POLICY_SELECTION_RANDOMNESS', 'selection randomness differs from tie/determinism');
  const bounds = normalizeBounds(input.bounds, 'selection bounds');
  if (compareDecimalUint(randomness.maxInputs, bounds.maxRandomInputs) > 0) fail('POLICY_SELECTION_RANDOMNESS', 'selection random inputs exceed port bounds');
  return {
    inputs: stringSet(input.inputs, { code: 'POLICY_SELECTION_INPUT', label: 'selection inputs', allowed: ['domain-role', 'ready-edges', 'policy-records', 'evaluator-facts', 'path-facts', 'resource-facts', 'stop-facts', 'namespaced'], minimum: 1 }),
    eligibility: normalizeSchemaReference(input.eligibility, 'selection eligibility'),
    comparison: normalizeComparison(input.comparison, 'selection comparison'),
    tie,
    determinism,
    randomness,
    maxCandidates: positiveDecimal(input.maxCandidates, 'POLICY_SELECTION_CANDIDATES', 'selection maxCandidates'),
    bounds,
    noSelectionOutcomes: stringSet(input.noSelectionOutcomes, { code: 'POLICY_SELECTION_OUTCOME', label: 'selection noSelectionOutcomes', minimum: 1 }),
  };
}

function normalizeReservation(input) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'POLICY_RESERVATION_FIELDS', 'reservation');
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'identity', 'scopes', 'unit', 'magnitude', 'maxActive', 'visibleEffect', 'lifecycle', 'accounting', 'generationExhaustion'], 'POLICY_RESERVATION_FIELDS', 'reservation');
  if (input.kind !== 'bounded' || input.generationExhaustion !== 'policy-generation-exhausted') fail('POLICY_RESERVATION_KIND', 'reservation selection is invalid');
  assertNamespacedId(input.unit, 'POLICY_RESERVATION_UNIT', 'reservation unit');
  return {
    kind: input.kind,
    identity: normalizeSchemaReference(input.identity, 'reservation identity'),
    scopes: stringSet(input.scopes, { code: 'POLICY_RESERVATION_SCOPE', label: 'reservation scopes', allowed: ['node', 'edge', 'path', 'work'], minimum: 1 }),
    unit: input.unit,
    magnitude: normalizeSchemaReference(input.magnitude, 'reservation magnitude'),
    maxActive: positiveDecimal(input.maxActive, 'POLICY_RESERVATION_CAPACITY', 'reservation maxActive'),
    visibleEffect: normalizeSchemaReference(input.visibleEffect, 'reservation visibleEffect'),
    lifecycle: normalizeSchemaReference(input.lifecycle, 'reservation lifecycle'),
    accounting: normalizeSchemaReference(input.accounting, 'reservation accounting'),
    generationExhaustion: input.generationExhaustion,
  };
}

function normalizeOptionalProfile(input, label) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'POLICY_OPTIONAL_PROFILE_FIELDS', label);
    return { kind: 'none' };
  }
  return normalizeProfileReference(input, label);
}

function normalizeCandidateSource(input, index, domain, evaluatorMode, graphMode) {
  exactKeys(input, ['id', 'kind', 'source', 'producerProfile', 'readiness', 'fallback', 'maxCandidates', 'maxBytes', 'maxRandomInputs', 'multiplicity', 'edgeAdmissionIdentity'], 'POLICY_SOURCE_FIELDS', `candidateSource ${index}`);
  assertNamespacedId(input.id, 'POLICY_SOURCE_ID', `candidateSource ${index} id`);
  const kind = assertEnum(input.kind, ['intrinsic-domain', 'evaluator-proposal', 'capability-proposal', 'namespaced'], 'POLICY_SOURCE_KIND', `${input.id} kind`);
  const source = normalizeSchemaReference(input.source, `${input.id} source`);
  const producerProfile = normalizeOptionalProfile(input.producerProfile, `${input.id} producerProfile`);
  const domainProduce = new Map(domain.ports.map(({ id, contract }) => [id, contract])).get('produce-actions');
  if (kind === 'intrinsic-domain' && (producerProfile.kind !== 'none' || schemaKey(source) !== schemaKey(domainProduce))) fail('POLICY_SOURCE_DOMAIN', `${input.id} intrinsic source differs from the domain port`);
  if (kind !== 'intrinsic-domain' && producerProfile.kind === 'none') fail('POLICY_SOURCE_PROFILE', `${input.id} external source omits producer profile`);
  if (kind === 'evaluator-proposal' && !['proposal-only', 'combined'].includes(evaluatorMode)) fail('POLICY_EVALUATOR_MODE', 'evaluator proposal source contradicts evaluatorMode');
  if (input.readiness === 'required' && !['pending', 'terminal', 'custom'].includes(input.fallback)) fail('POLICY_SOURCE_FALLBACK', `${input.id} required source has an invalid fallback`);
  const edgeAdmissionIdentity = input.edgeAdmissionIdentity?.kind === 'none'
    ? (exactKeys(input.edgeAdmissionIdentity, ['kind'], 'POLICY_SOURCE_EDGE_FIELDS', `${input.id} edgeAdmissionIdentity`), { kind: 'none' })
    : normalizeSchemaReference(input.edgeAdmissionIdentity, `${input.id} edgeAdmissionIdentity`);
  if ((graphMode === 'stateless') !== (edgeAdmissionIdentity.kind === 'none')) fail('POLICY_SOURCE_GRAPH', `${input.id} edge admission identity differs from graph mode`);
  return {
    id: input.id, kind, source, producerProfile,
    readiness: assertEnum(input.readiness, ['required', 'optional', 'advisory'], 'POLICY_SOURCE_READINESS', `${input.id} readiness`),
    fallback: assertEnum(input.fallback, ['pending', 'terminal', 'skip-source', 'intrinsic-only', 'custom'], 'POLICY_SOURCE_FALLBACK', `${input.id} fallback`),
    maxCandidates: positiveDecimal(input.maxCandidates, 'POLICY_SOURCE_CAPACITY', `${input.id} maxCandidates`),
    maxBytes: positiveDecimal(input.maxBytes, 'POLICY_SOURCE_CAPACITY', `${input.id} maxBytes`),
    maxRandomInputs: normalizeDecimalUint(input.maxRandomInputs, `${input.id} maxRandomInputs`),
    multiplicity: assertEnum(input.multiplicity, ['unique', 'repeatable-sample', 'multiset', 'custom'], 'POLICY_SOURCE_MULTIPLICITY', `${input.id} multiplicity`),
    edgeAdmissionIdentity,
  };
}

function normalizeAdmission(input, domain, evaluatorMode, graphMode) {
  exactKeys(input, ['mode', 'sources', 'threshold', 'pressure', 'bounds'], 'POLICY_ADMISSION_FIELDS', 'admission');
  if (!Array.isArray(input.sources)) fail('POLICY_SOURCE_COUNT', 'admission sources must be an array');
  const mode = assertEnum(input.mode, ['none', 'fixed', 'exhaustive', 'progressive', 'lazy', 'sampled', 'custom'], 'POLICY_ADMISSION_MODE', 'admission mode');
  const sources = input.sources.map((source, index) => normalizeCandidateSource(source, index, domain, evaluatorMode, graphMode)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(sources, 'id', 'POLICY_SOURCE_DUPLICATE', 'candidate source');
  if ((mode === 'none') !== (sources.length === 0)) fail('POLICY_ADMISSION_MODE', 'admission none and source absence must agree');
  if (sources.some(({ fallback }) => fallback === 'intrinsic-only') && !sources.some(({ kind }) => kind === 'intrinsic-domain')) fail('POLICY_SOURCE_FALLBACK', 'intrinsic-only fallback requires an intrinsic-domain source');
  const bounds = normalizeBounds(input.bounds, 'admission bounds');
  const maxRandom = sources.reduce((maximum, source) => compareDecimalUint(maximum, source.maxRandomInputs) >= 0 ? maximum : source.maxRandomInputs, '0');
  if (compareDecimalUint(maxRandom, bounds.maxRandomInputs) > 0) fail('POLICY_SOURCE_RANDOMNESS', 'candidate source randomness exceeds admission bounds');
  return { mode, sources, threshold: normalizeSchemaReference(input.threshold, 'admission threshold'), pressure: input.pressure, bounds };
}

function normalizeCoordinate(input, index) {
  exactKeys(input, ['id', 'unit', 'perspective', 'transform'], 'POLICY_COORDINATE_FIELDS', `coordinate ${index}`);
  assertNamespacedId(input.id, 'POLICY_COORDINATE_ID', `coordinate ${index} id`);
  assertNamespacedId(input.unit, 'POLICY_COORDINATE_UNIT', `${input.id} unit`);
  return { id: input.id, unit: input.unit, perspective: assertEnum(input.perspective, ['global', 'root-relative', 'role-relative', 'actor-indexed', 'objective-indexed', 'namespaced'], 'POLICY_COORDINATE_PERSPECTIVE', `${input.id} perspective`), transform: normalizeSchemaReference(input.transform, `${input.id} transform`) };
}

function normalizeValueAdapter(input, index, domain, evaluatorMode) {
  exactKeys(input, ['id', 'kind', 'sourceProfile', 'source', 'readiness', 'fallback', 'conversion', 'perspective'], 'POLICY_VALUE_ADAPTER_FIELDS', `valueAdapter ${index}`);
  assertNamespacedId(input.id, 'POLICY_VALUE_ADAPTER_ID', `valueAdapter ${index} id`);
  const kind = assertEnum(input.kind, ['terminal-domain', 'evaluator', 'rollout', 'proof', 'heuristic', 'namespaced'], 'POLICY_VALUE_ADAPTER_KIND', `${input.id} kind`);
  const source = normalizeSchemaReference(input.source, `${input.id} source`);
  const sourceProfile = normalizeOptionalProfile(input.sourceProfile, `${input.id} sourceProfile`);
  const terminalPort = new Map(domain.ports.map(({ id, contract }) => [id, contract])).get('terminal-outcome');
  if (kind === 'terminal-domain' && (sourceProfile.kind !== 'none' || schemaKey(source) !== schemaKey(terminalPort))) fail('POLICY_VALUE_DOMAIN', `${input.id} terminal source differs from domain terminal-outcome`);
  if (kind !== 'terminal-domain' && sourceProfile.kind === 'none') fail('POLICY_VALUE_PROFILE', `${input.id} external value source omits profile`);
  if (kind === 'evaluator' && !['evaluation-only', 'combined'].includes(evaluatorMode)) fail('POLICY_EVALUATOR_MODE', 'evaluator value source contradicts evaluatorMode');
  if (input.readiness === 'required' && !['pending', 'terminal', 'custom'].includes(input.fallback)) fail('POLICY_VALUE_FALLBACK', `${input.id} required adapter has an invalid fallback`);
  return {
    id: input.id, kind, sourceProfile, source,
    readiness: assertEnum(input.readiness, ['required', 'optional', 'advisory'], 'POLICY_VALUE_READINESS', `${input.id} readiness`),
    fallback: assertEnum(input.fallback, ['pending', 'terminal', 'skip-source', 'zero', 'custom'], 'POLICY_VALUE_FALLBACK', `${input.id} fallback`),
    conversion: normalizeSchemaReference(input.conversion, `${input.id} conversion`),
    perspective: normalizeSchemaReference(input.perspective, `${input.id} perspective`),
  };
}

function normalizeValue(input, domain, evaluatorMode) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'POLICY_VALUE_FIELDS', 'value');
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'schema', 'family', 'coordinates', 'numeric', 'comparison', 'invalid', 'combine', 'adapters'], 'POLICY_VALUE_FIELDS', 'value');
  if (input.kind !== 'algebra' || !Array.isArray(input.coordinates) || !Array.isArray(input.adapters) || input.adapters.length === 0) fail('POLICY_VALUE_KIND', 'value algebra is invalid');
  const coordinates = input.coordinates.map(normalizeCoordinate);
  uniqueBy(coordinates, 'id', 'POLICY_COORDINATE_DUPLICATE', 'coordinate');
  const adapters = input.adapters.map((adapter, index) => normalizeValueAdapter(adapter, index, domain, evaluatorMode)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(adapters, 'id', 'POLICY_VALUE_ADAPTER_DUPLICATE', 'value adapter');
  if (input.family === 'scalar' && coordinates.length !== 1) fail('POLICY_VALUE_COORDINATES', 'scalar value requires one coordinate');
  if (['vector', 'matrix', 'distribution'].includes(input.family) && coordinates.length < 2) fail('POLICY_VALUE_COORDINATES', `${input.family} value requires multiple coordinates`);
  return {
    kind: input.kind,
    schema: normalizeSchemaReference(input.schema, 'value schema'),
    family: assertEnum(input.family, ['scalar', 'vector', 'matrix', 'distribution', 'interval', 'ordinal', 'proof-lattice', 'sequence', 'custom'], 'POLICY_VALUE_FAMILY', 'value family'),
    coordinates,
    numeric: normalizeNumeric(input.numeric, 'value numeric'),
    comparison: normalizeComparison(input.comparison, 'value comparison'),
    invalid: normalizeSchemaReference(input.invalid, 'value invalid'),
    combine: normalizeSchemaReference(input.combine, 'value combine'),
    adapters,
  };
}

function normalizeCycle(input, domainReference) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'POLICY_CYCLE_FIELDS', 'cycle');
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'domainRelationPort', 'identityBeforeRelation', 'partitions', 'coverage', 'pressureDistinct'], 'POLICY_CYCLE_FIELDS', 'cycle');
  if (input.kind !== 'bounded') fail('POLICY_CYCLE_KIND', 'cycle kind is invalid');
  const domainRelationPort = normalizeSchemaReference(input.domainRelationPort, 'cycle domainRelationPort');
  if (schemaKey(domainRelationPort) !== schemaKey(domainReference.classifyPathRelationPort)) fail('POLICY_CYCLE_DOMAIN_PORT', 'cycle relation port differs from domain');
  if (input.identityBeforeRelation !== true || input.pressureDistinct !== true || !Array.isArray(input.partitions) || input.partitions.length === 0) fail('POLICY_CYCLE_KIND', 'cycle identity/pressure/partitions are invalid');
  const partitions = input.partitions.map((partition, index) => {
    exactKeys(partition, ['id', 'relations', 'response', 'contribution'], 'POLICY_CYCLE_PARTITION_FIELDS', `cycle partition ${index}`);
    assertNamespacedId(partition.id, 'POLICY_CYCLE_PARTITION_ID', `cycle partition ${index} id`);
    return {
      id: partition.id,
      relations: normalizeSchemaReference(partition.relations, `${partition.id} relations`),
      response: assertEnum(partition.response, ['continue', 'cut', 'transform', 'mark', 'abandon', 'fail', 'unsupported'], 'POLICY_CYCLE_RESPONSE', `${partition.id} response`),
      contribution: partition.contribution?.kind === 'none' ? (exactKeys(partition.contribution, ['kind'], 'POLICY_CYCLE_CONTRIBUTION_FIELDS', `${partition.id} contribution`), { kind: 'none' }) : normalizeSchemaReference(partition.contribution, `${partition.id} contribution`),
    };
  }).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(partitions, 'id', 'POLICY_CYCLE_PARTITION_DUPLICATE', 'cycle partition');
  return { kind: input.kind, domainRelationPort, identityBeforeRelation: true, partitions, coverage: identityReference(input.coverage, 'POLICY_CYCLE_COVERAGE', 'cycle coverage'), pressureDistinct: true };
}

function normalizeBackup(input, recordById) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'POLICY_BACKUP_FIELDS', 'backup');
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'transaction', 'direction', 'targets', 'perspectiveTransform', 'update', 'algebra', 'concurrencyOrder', 'sequence', 'idempotence', 'prefixVisibility', 'commit', 'mustDrain', 'completedPublication', 'staleEpoch', 'arithmetic', 'maxSteps', 'maxScratchBytes'], 'POLICY_BACKUP_FIELDS', 'backup');
  if (input.kind !== 'transactional' || input.idempotence !== 'transaction-occurrence-owner-field' || input.mustDrain !== 'after-first-result-visible-update') fail('POLICY_BACKUP_KIND', 'backup transaction/idempotence/must-drain is invalid');
  const targets = stringSet(input.targets, { code: 'POLICY_BACKUP_TARGET', label: 'backup targets', namespaced: true, minimum: 1, preserve: true });
  for (const target of targets) if (!recordById.has(target)) fail('POLICY_BACKUP_TARGET', `backup target ${target} is not a policy record`);
  const concurrencyOrder = assertEnum(input.concurrencyOrder, ['order-insensitive', 'stable-nondeterministic', 'deterministic-sequence'], 'POLICY_BACKUP_ORDER', 'backup concurrencyOrder');
  const sequence = input.sequence?.kind === 'none' ? (exactKeys(input.sequence, ['kind'], 'POLICY_BACKUP_SEQUENCE_FIELDS', 'backup sequence'), { kind: 'none' }) : normalizeSchemaReference(input.sequence, 'backup sequence');
  if ((concurrencyOrder === 'deterministic-sequence') !== (sequence.kind !== 'none')) fail('POLICY_BACKUP_ORDER', 'backup deterministic ordering and sequence identity disagree');
  return {
    kind: input.kind,
    transaction: normalizeSchemaReference(input.transaction, 'backup transaction'),
    direction: assertEnum(input.direction, ['root-to-leaf', 'leaf-to-root', 'bidirectional', 'custom'], 'POLICY_BACKUP_DIRECTION', 'backup direction'),
    targets,
    perspectiveTransform: normalizeSchemaReference(input.perspectiveTransform, 'backup perspectiveTransform'),
    update: normalizeSchemaReference(input.update, 'backup update'),
    algebra: assertEnum(input.algebra, ['associative-commutative', 'ordered-noncommutative', 'idempotent', 'monotone', 'lattice', 'custom'], 'POLICY_BACKUP_ALGEBRA', 'backup algebra'),
    concurrencyOrder,
    sequence,
    idempotence: input.idempotence,
    prefixVisibility: assertEnum(input.prefixVisibility, ['allowed', 'atomic-commit'], 'POLICY_BACKUP_PREFIX', 'backup prefixVisibility'),
    commit: normalizeSchemaReference(input.commit, 'backup commit'),
    mustDrain: input.mustDrain,
    completedPublication: normalizeSchemaReference(input.completedPublication, 'backup completedPublication'),
    staleEpoch: assertEnum(input.staleEpoch, ['reject-before-mutation', 'root-independent-only', 'fatal-after-mutation'], 'POLICY_BACKUP_STALE', 'backup staleEpoch'),
    arithmetic: normalizeNumeric(input.arithmetic, 'backup arithmetic'),
    maxSteps: positiveDecimal(input.maxSteps, 'POLICY_BACKUP_STEPS', 'backup maxSteps'),
    maxScratchBytes: normalizeDecimalUint(input.maxScratchBytes, 'backup maxScratchBytes'),
  };
}

function normalizeStop(input) {
  exactKeys(input, ['budgets', 'causePriority', 'lifecycle', 'maxOvershoot', 'drain', 'partialEligibility', 'externalControl'], 'POLICY_STOP_FIELDS', 'stop');
  if (!Array.isArray(input.budgets) || input.budgets.length === 0) fail('POLICY_BUDGET_COUNT', 'stop budgets must not be empty');
  const budgets = input.budgets.map((budget, index) => {
    exactKeys(budget, ['id', 'unit', 'scope', 'initial', 'limit', 'increment', 'widthBits', 'precision', 'comparison', 'satisfaction', 'exhaustion', 'monotonicity'], 'POLICY_BUDGET_FIELDS', `budget ${index}`);
    assertNamespacedId(budget.id, 'POLICY_BUDGET_ID', `budget ${index} id`);
    assertNamespacedId(budget.unit, 'POLICY_BUDGET_UNIT', `${budget.id} unit`);
    const initial = normalizeDecimalUint(budget.initial, `${budget.id} initial`);
    const limit = positiveDecimal(budget.limit, 'POLICY_BUDGET_LIMIT', `${budget.id} limit`);
    if (compareDecimalUint(initial, limit) > 0 || budget.exhaustion !== 'policy-budget-counter-exhausted') fail('POLICY_BUDGET_RANGE', `${budget.id} range/exhaustion is invalid`);
    return {
      id: budget.id, unit: budget.unit, scope: assertEnum(budget.scope, ['engine', 'session', 'root-epoch', 'work', 'namespaced'], 'POLICY_BUDGET_SCOPE', `${budget.id} scope`),
      initial, limit, increment: normalizeSchemaReference(budget.increment, `${budget.id} increment`),
      widthBits: positiveDecimal(budget.widthBits, 'POLICY_BUDGET_WIDTH', `${budget.id} widthBits`), precision: normalizeSchemaReference(budget.precision, `${budget.id} precision`),
      comparison: normalizeSchemaReference(budget.comparison, `${budget.id} comparison`), satisfaction: normalizeSchemaReference(budget.satisfaction, `${budget.id} satisfaction`),
      exhaustion: budget.exhaustion, monotonicity: assertEnum(budget.monotonicity, ['monotone', 'retractable', 'custom'], 'POLICY_BUDGET_MONOTONICITY', `${budget.id} monotonicity`),
    };
  }).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(budgets, 'id', 'POLICY_BUDGET_DUPLICATE', 'budget');
  return {
    budgets,
    causePriority: stringSet(input.causePriority, { code: 'POLICY_STOP_CAUSE', label: 'stop causePriority', minimum: 1, preserve: true }),
    lifecycle: normalizeSchemaReference(input.lifecycle, 'stop lifecycle'),
    maxOvershoot: normalizeDecimalUint(input.maxOvershoot, 'stop maxOvershoot'),
    drain: normalizeSchemaReference(input.drain, 'stop drain'),
    partialEligibility: normalizeSchemaReference(input.partialEligibility, 'stop partialEligibility'),
    externalControl: assertEnum(input.externalControl, ['none', 'session-device-visible'], 'POLICY_STOP_CONTROL', 'stop externalControl'),
  };
}

function normalizeReuse(input, index, recordById) {
  exactKeys(input, ['record', 'disposition', 'condition', 'ordering', 'lifecycle'], 'POLICY_REUSE_FIELDS', `reuse ${index}`);
  if (!recordById.has(input.record)) fail('POLICY_REUSE_RECORD', `reuse names unknown record ${input.record}`);
  return {
    record: input.record,
    disposition: assertEnum(input.disposition, ['retain', 'retain-if-key-valid', 'transform', 'reset', 'invalidate'], 'POLICY_REUSE_DISPOSITION', `${input.record} disposition`),
    condition: normalizeSchemaReference(input.condition, `${input.record} reuse condition`),
    ordering: normalizeSchemaReference(input.ordering, `${input.record} reuse ordering`),
    lifecycle: normalizeSchemaReference(input.lifecycle, `${input.record} reuse lifecycle`),
  };
}

function normalizeStatus(input, index) {
  exactKeys(input, ['code', 'class', 'diagnostic'], 'POLICY_STATUS_FIELDS', `status ${index}`);
  assertString(input.code, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, 'POLICY_STATUS_CODE', `status ${index} code`);
  if (typeof input.diagnostic !== 'boolean') fail('POLICY_STATUS_DIAGNOSTIC', `${input.code} diagnostic must be boolean`);
  return { code: input.code, class: assertEnum(input.class, ['normal', 'pending', 'recoverable', 'stop', 'fatal', 'cancellation'], 'POLICY_STATUS_CLASS', `${input.code} class`), diagnostic: input.diagnostic };
}

function normalizePort(input, index, recordById, statusCodes) {
  exactKeys(input, ['id', 'contract', 'records', 'bounds', 'completion', 'statuses'], 'POLICY_PORT_FIELDS', `port ${index}`);
  assertEnum(input.id, PORTS, 'POLICY_PORT_ID', `port ${index} id`);
  const records = stringSet(input.records, { code: 'POLICY_PORT_RECORDS', label: `${input.id} records`, namespaced: true });
  for (const record of records) if (!recordById.has(record)) fail('POLICY_PORT_RECORD', `${input.id} names unknown record ${record}`);
  const statuses = stringSet(input.statuses, { code: 'POLICY_PORT_STATUSES', label: `${input.id} statuses`, minimum: 1 });
  for (const status of statuses) if (!statusCodes.has(status)) fail('POLICY_PORT_STATUS', `${input.id} names undeclared status ${status}`);
  return {
    id: input.id, contract: normalizeSchemaReference(input.contract, `${input.id} contract`), records,
    bounds: normalizeBounds(input.bounds, `${input.id} bounds`), completion: assertEnum(input.completion, ['bounded', 'finite-resumable', 'must-drain'], 'POLICY_PORT_COMPLETION', `${input.id} completion`), statuses,
  };
}

function normalizeResource(input, index, statusCodes) {
  exactKeys(input, ['id', 'unit', 'minimum', 'maximum', 'alignment', 'scope', 'pressureStatus'], 'POLICY_RESOURCE_FIELDS', `resource ${index}`);
  assertNamespacedId(input.id, 'POLICY_RESOURCE_ID', `resource ${index} id`);
  const minimum = normalizeDecimalUint(input.minimum, `${input.id} minimum`);
  const maximum = normalizeDecimalUint(input.maximum, `${input.id} maximum`);
  if (compareDecimalUint(minimum, maximum) > 0) fail('POLICY_RESOURCE_RANGE', `${input.id} minimum exceeds maximum`);
  if (!statusCodes.has(input.pressureStatus)) fail('POLICY_RESOURCE_STATUS', `${input.id} pressureStatus is undeclared`);
  return {
    id: input.id, unit: assertEnum(input.unit, ['bytes', 'records', 'slots', 'transactions', 'work-units', 'random-inputs', 'diagnostics'], 'POLICY_RESOURCE_UNIT', `${input.id} unit`),
    minimum, maximum, alignment: positiveDecimal(input.alignment, 'POLICY_RESOURCE_ALIGNMENT', `${input.id} alignment`),
    scope: assertEnum(input.scope, ['per-engine', 'per-worker', 'per-invocation'], 'POLICY_RESOURCE_SCOPE', `${input.id} scope`), pressureStatus: input.pressureStatus,
  };
}

function normalizeDiagnostics(input) {
  exactKeys(input, ['authority', 'maxRecords', 'maxBytes', 'overflow', 'rawAddresses'], 'POLICY_DIAGNOSTIC_FIELDS', 'diagnostics');
  if (input.authority !== 'non-authoritative' || input.rawAddresses !== false) fail('POLICY_DIAGNOSTIC_AUTHORITY', 'diagnostics must be non-authoritative and address-free');
  return { authority: input.authority, maxRecords: normalizeDecimalUint(input.maxRecords, 'diagnostics maxRecords'), maxBytes: normalizeDecimalUint(input.maxBytes, 'diagnostics maxBytes'), overflow: assertEnum(input.overflow, ['drop', 'count', 'terminal'], 'POLICY_DIAGNOSTIC_OVERFLOW', 'diagnostics overflow'), rawAddresses: false };
}

function normalizeCompatibility(input) {
  exactKeys(input, ['domainIdentityRequired', 'graphIdentityRequired', 'persistence'], 'POLICY_COMPAT_FIELDS', 'compatibility');
  if (input.domainIdentityRequired !== true || input.graphIdentityRequired !== true) fail('POLICY_COMPAT_IDENTITY', 'compatibility must bind domain and graph identities');
  let persistence;
  if (input.persistence?.kind === 'none') {
    exactKeys(input.persistence, ['kind'], 'POLICY_PERSISTENCE_FIELDS', 'persistence');
    persistence = { kind: 'none' };
  } else {
    exactKeys(input.persistence, ['kind', 'encoding', 'namespace', 'integrity', 'recovery', 'migration', 'rollback', 'partialBackupRecovery', 'reuseValidity', 'cleanup'], 'POLICY_PERSISTENCE_FIELDS', 'persistence');
    if (input.persistence.kind !== 'versioned') fail('POLICY_PERSISTENCE_KIND', 'persistence kind is invalid');
    assertNamespacedId(input.persistence.namespace, 'POLICY_PERSISTENCE_NAMESPACE', 'persistence namespace');
    persistence = { kind: input.persistence.kind, namespace: input.persistence.namespace };
    for (const field of ['encoding', 'integrity', 'recovery', 'migration', 'rollback', 'partialBackupRecovery', 'reuseValidity', 'cleanup']) persistence[field] = normalizeSchemaReference(input.persistence[field], `persistence ${field}`);
  }
  return { domainIdentityRequired: true, graphIdentityRequired: true, persistence };
}

function normalizeProgram(input) {
  exactKeys(input, ['kind', 'language', 'sourceIdentity', 'inputs', 'provenance'], 'POLICY_PROGRAM_FIELDS', 'programContribution');
  if (input.kind !== 'device-program' || input.language !== 'restricted-device-js') fail('POLICY_PROGRAM_LANGUAGE', 'policy contribution must be restricted Device-JS');
  if (!Array.isArray(input.inputs)) fail('POLICY_PROGRAM_INPUTS', 'program inputs must be an array');
  const inputs = input.inputs.map((entry, index) => normalizeProfileReference(entry, `program input ${index}`)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(inputs, 'id', 'POLICY_PROGRAM_INPUT_DUPLICATE', 'program input');
  exactKeys(input.provenance, ['origin', 'revision', 'license'], 'POLICY_PROGRAM_PROVENANCE_FIELDS', 'program provenance');
  assertEnum(input.provenance.origin, ['first-party', 'third-party-reviewed'], 'POLICY_PROGRAM_ORIGIN', 'program provenance origin');
  assertString(input.provenance.revision, /^[0-9a-f]{40}$/, 'POLICY_PROGRAM_REVISION', 'program provenance revision');
  if (typeof input.provenance.license !== 'string' || input.provenance.license.length === 0) fail('POLICY_PROGRAM_LICENSE', 'program provenance license is invalid');
  return { kind: input.kind, language: input.language, sourceIdentity: identityReference(input.sourceIdentity, 'POLICY_PROGRAM_SOURCE', 'program sourceIdentity'), inputs, provenance: { ...input.provenance } };
}

function normalizeProductData(input, index) {
  exactKeys(input, ['ownerContract', 'schema', 'identity'], 'POLICY_PRODUCT_FIELDS', `productData ${index}`);
  exactKeys(input.ownerContract, ['kind', 'id', 'version', 'schema', 'sha256'], 'POLICY_PRODUCT_OWNER_FIELDS', `productData ${index} ownerContract`);
  if (input.ownerContract.kind !== 'namespaced') fail('POLICY_PRODUCT_OWNER', 'product data owner must be namespaced');
  assertNamespacedId(input.ownerContract.id, 'POLICY_PRODUCT_OWNER', 'product owner id');
  assertVersion(input.ownerContract.version, 'POLICY_PRODUCT_OWNER', 'product owner version');
  assertString(input.ownerContract.schema, /^[a-z][a-z0-9.-]+\/[0-9]+\.[0-9]+\.[0-9]+$/, 'POLICY_PRODUCT_OWNER', 'product owner schema');
  assertSha256(input.ownerContract.sha256, 'POLICY_PRODUCT_OWNER', 'product owner sha256');
  if (!input.ownerContract.schema.endsWith(`/${input.ownerContract.version}`)) fail('POLICY_PRODUCT_OWNER', 'product owner schema/version differ');
  return { ownerContract: { ...input.ownerContract }, schema: normalizeSchemaReference(input.schema, `productData ${index} schema`), identity: identityReference(input.identity, 'POLICY_PRODUCT_IDENTITY', `productData ${index} identity`) };
}

export function normalizePolicyProfile(input, inspectedCatalog, domainResult, graphResult) {
  exactKeys(input, ['schema', 'representation', 'status', 'contract', 'id', 'version', 'domainProfile', 'graphProfile', 'evaluatorMode', 'roleHandlers', 'records', 'selection', 'reservation', 'admission', 'value', 'cycle', 'backup', 'stop', 'reuse', 'ports', 'resources', 'statuses', 'diagnostics', 'compatibility', 'programContribution', 'productData'], 'POLICY_ROOT_FIELDS', 'policy profile');
  if (input.schema !== POLICY_SCHEMA || input.representation !== REPRESENTATION || input.status !== 'proposal-evidence') fail('POLICY_SCHEMA', 'unsupported policy schema/representation/status');
  assertNamespacedId(input.id, 'POLICY_PROFILE_ID', 'policy profile id');
  assertVersion(input.version, 'POLICY_PROFILE_VERSION', 'policy profile version');
  const contracts = inspectedCatalog?.contractSet?.contracts;
  if (!contracts) fail('POLICY_CATALOG', 'inspected catalog is required');
  const catalogById = new Map(contracts.map((contract) => [contract.id, contract]));
  const domainProfile = normalizeDomainReference(input.domainProfile, domainResult);
  const graphProfile = normalizeGraphReference(input.graphProfile, graphResult);
  const evaluatorMode = assertEnum(input.evaluatorMode, ['absent', 'proposal-only', 'evaluation-only', 'combined'], 'POLICY_EVALUATOR_MODE', 'evaluatorMode');

  const domainRoles = new Map(domainResult.normalized.roles.map((role) => [role.id, role]));
  if (!Array.isArray(input.roleHandlers)) fail('POLICY_ROLE_COUNT', 'roleHandlers must be an array');
  const roleHandlers = input.roleHandlers.map((handler, index) => normalizeRoleHandler(handler, index, domainRoles)).sort((left, right) => compareRaw(left.role, right.role));
  uniqueBy(roleHandlers, 'role', 'POLICY_ROLE_DUPLICATE', 'role handler');
  if (roleHandlers.length !== domainRoles.size || [...domainRoles.keys()].some((role) => !roleHandlers.some((handler) => handler.role === role))) fail('POLICY_ROLE_COVERAGE', 'roleHandlers do not cover every domain role');

  if (!Array.isArray(input.records)) fail('POLICY_RECORD_COUNT', 'records must be an array');
  const records = input.records.map((record, index) => normalizeRecord(record, index, graphProfile.mode)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(records, 'id', 'POLICY_RECORD_DUPLICATE', 'policy record');
  const recordById = new Map(records.map((record) => [record.id, record]));
  const selection = normalizeSelection(input.selection);
  const reservation = normalizeReservation(input.reservation);
  const admission = normalizeAdmission(input.admission, domainResult.normalized, evaluatorMode, graphProfile.mode);
  const value = normalizeValue(input.value, domainResult.normalized, evaluatorMode);
  const cycle = normalizeCycle(input.cycle, domainProfile);
  const backup = normalizeBackup(input.backup, recordById);
  const stop = normalizeStop(input.stop);

  if (!Array.isArray(input.reuse)) fail('POLICY_REUSE_COUNT', 'reuse must be an array');
  const reuse = input.reuse.map((entry, index) => normalizeReuse(entry, index, recordById)).sort((left, right) => compareRaw(left.record, right.record));
  uniqueBy(reuse, 'record', 'POLICY_REUSE_DUPLICATE', 'reuse record');
  if (reuse.length !== records.length) fail('POLICY_REUSE_COVERAGE', 'every policy record requires exactly one reuse disposition');

  if (!Array.isArray(input.statuses)) fail('POLICY_STATUS_COUNT', 'statuses must be an array');
  const statuses = input.statuses.map(normalizeStatus).sort((left, right) => compareRaw(left.code, right.code));
  uniqueBy(statuses, 'code', 'POLICY_STATUS_DUPLICATE', 'status');
  const statusCodes = new Set(statuses.map(({ code }) => code));
  for (const required of STATUS_CODES) if (!statusCodes.has(required)) fail('POLICY_STATUS_REQUIRED', `required status ${required} is absent`);
  const statusByCode = new Map(statuses.map((status) => [status.code, status]));
  for (const [code, expectedClass] of [['cancelled', 'cancellation'], ['no-eligible-candidate', 'normal'], ['partial-backup-fatal', 'fatal'], ['policy-budget-satisfied', 'stop'], ['required-input-unavailable', 'pending']]) {
    if (statusByCode.get(code).class !== expectedClass) fail('POLICY_STATUS_CLASS', `${code} must be classified ${expectedClass}`);
  }
  const referencedStatuses = [
    ...roleHandlers.flatMap(({ noActionOutcome, failure }) => [noActionOutcome, failure]),
    ...selection.noSelectionOutcomes, admission.pressure, ...stop.causePriority,
  ];
  for (const status of referencedStatuses) if (!statusCodes.has(status)) fail('POLICY_STATUS_REFERENCE', `undeclared status ${status} is referenced`);

  if (!Array.isArray(input.ports)) fail('POLICY_PORT_COUNT', 'ports must be an array');
  const ports = input.ports.map((port, index) => normalizePort(port, index, recordById, statusCodes)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(ports, 'id', 'POLICY_PORT_DUPLICATE', 'port');
  const portIds = new Set(ports.map(({ id }) => id));
  for (const required of BASE_PORTS) if (!portIds.has(required)) fail('POLICY_PORT_REQUIRED', `required port ${required} is absent`);
  for (const port of CYCLE_PORTS) if (portIds.has(port) !== (cycle.kind === 'bounded')) fail('POLICY_CYCLE_RESIDUE', `${port} presence differs from cycle selection`);
  for (const port of RESERVATION_PORTS) if (portIds.has(port) !== (reservation.kind === 'bounded')) fail('POLICY_RESERVATION_RESIDUE', `${port} presence differs from reservation selection`);
  for (const port of BACKUP_PORTS) if (portIds.has(port) !== (backup.kind === 'transactional')) fail('POLICY_BACKUP_RESIDUE', `${port} presence differs from backup selection`);
  if (portIds.has('map-terminal-outcome') !== (value.kind === 'algebra' && value.adapters.some(({ kind }) => kind === 'terminal-domain'))) fail('POLICY_VALUE_RESIDUE', 'terminal value port presence differs from adapter selection');
  if (portIds.has('map-evaluator-output') !== (value.kind === 'algebra' && value.adapters.some(({ kind }) => kind === 'evaluator'))) fail('POLICY_EVALUATOR_RESIDUE', 'evaluator value port presence differs from adapter selection');

  if (!Array.isArray(input.resources)) fail('POLICY_RESOURCE_COUNT', 'resources must be an array');
  const resources = input.resources.map((resource, index) => normalizeResource(resource, index, statusCodes)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(resources, 'id', 'POLICY_RESOURCE_DUPLICATE', 'resource');
  if (resources.length === 0) fail('POLICY_RESOURCE_REQUIRED', 'policy profile requires finite resources');
  const pressure = new Set(resources.map(({ pressureStatus }) => pressureStatus));
  for (const required of ['policy-internal-failure', 'required-input-unavailable']) if (!pressure.has(required)) fail('POLICY_RESOURCE_REQUIRED', `policy resources omit ${required}`);
  if (pressure.has('reservation-capacity') !== (reservation.kind === 'bounded')) fail('POLICY_RESERVATION_RESIDUE', 'reservation resource presence differs from selection');
  if (pressure.has('partial-backup-fatal') !== (backup.kind === 'transactional')) fail('POLICY_BACKUP_RESIDUE', 'backup resource presence differs from selection');

  const evaluatorProposal = admission.sources.some(({ kind }) => kind === 'evaluator-proposal');
  const evaluatorValue = value.kind === 'algebra' && value.adapters.some(({ kind }) => kind === 'evaluator');
  const derivedMode = evaluatorProposal ? (evaluatorValue ? 'combined' : 'proposal-only') : (evaluatorValue ? 'evaluation-only' : 'absent');
  if (derivedMode !== evaluatorMode) fail('POLICY_EVALUATOR_MODE', `evaluatorMode must be ${derivedMode}`);
  if (evaluatorMode === 'absent' && (selection.inputs.includes('evaluator-facts') || resources.some(({ id }) => id.includes('evaluator')))) fail('POLICY_EVALUATOR_RESIDUE', 'evaluator-absent profile retains evaluator residue');
  if (value.kind === 'none' && (backup.kind !== 'none' || records.some(({ semanticKind }) => ['statistic', 'proof', 'transaction'].includes(semanticKind)))) fail('POLICY_VALUE_RESIDUE', 'value-free profile retains value/backup records');
  if (graphProfile.mode === 'stateless' && (cycle.kind !== 'none' || backup.kind !== 'none' || selection.inputs.some((entry) => ['ready-edges', 'path-facts'].includes(entry)))) fail('POLICY_STATELESS_GRAPH_RESIDUE', 'stateless graph policy retains path/edge/backup semantics');
  if (backup.kind === 'transactional' && !records.some(({ resultVisible }) => resultVisible)) fail('POLICY_BACKUP_VISIBLE', 'transactional backup has no result-visible record');
  if (reservation.kind === 'bounded' && !records.some(({ semanticKind }) => semanticKind === 'reservation')) fail('POLICY_RESERVATION_RECORD', 'bounded reservation has no reservation record');

  if (!Array.isArray(input.productData)) fail('POLICY_PRODUCT_COUNT', 'productData must be an array');
  const productData = input.productData.map(normalizeProductData).sort((left, right) => compareRaw(left.ownerContract.id, right.ownerContract.id));
  uniqueBy(productData.map((entry) => ({ id: entry.ownerContract.id })), 'id', 'POLICY_PRODUCT_DUPLICATE', 'product data owner');

  const programContribution = normalizeProgram(input.programContribution);
  const externalProfiles = [
    ...admission.sources.filter(({ producerProfile }) => producerProfile.kind !== 'none').map(({ producerProfile }) => producerProfile),
    ...(value.kind === 'algebra' ? value.adapters.filter(({ sourceProfile }) => sourceProfile.kind !== 'none').map(({ sourceProfile }) => sourceProfile) : []),
  ];
  const profileKey = (profile) => profile ? `${profile.id}\0${schemaKey(profile.schema)}\0${profile.identity.sha256}` : null;
  const requiredProgramInputs = new Map();
  for (const profile of [domainProfile, graphProfile, ...externalProfiles]) {
    const prior = requiredProgramInputs.get(profile.id);
    if (prior && profileKey(prior) !== profileKey(profile)) fail('POLICY_PROGRAM_INPUTS', `semantic dependency ${profile.id} has conflicting references`);
    requiredProgramInputs.set(profile.id, profile);
  }
  const actualProgramInputs = new Map(programContribution.inputs.map((profile) => [profile.id, profile]));
  if (requiredProgramInputs.size !== actualProgramInputs.size || [...requiredProgramInputs].some(([id, profile]) => profileKey(actualProgramInputs.get(id)) !== profileKey(profile))) fail('POLICY_PROGRAM_INPUTS', 'program inputs differ from selected semantic dependencies');

  const normalized = {
    schema: input.schema, representation: input.representation, status: input.status,
    contract: normalizeCatalogContract(input.contract, catalogById), id: input.id, version: input.version,
    domainProfile, graphProfile, evaluatorMode, roleHandlers, records, selection, reservation, admission, value, cycle, backup, stop, reuse,
    ports, resources, statuses, diagnostics: normalizeDiagnostics(input.diagnostics), compatibility: normalizeCompatibility(input.compatibility),
    programContribution, productData,
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}

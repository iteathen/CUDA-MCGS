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

const EVALUATOR_SCHEMA = 'cuda-mcgs.evaluator-profile/0.2.0';
const REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const EVALUATOR_CONTRACT = 'SPEC-0009';
const POLICY_CONTRACT = 'SPEC-0008';
const STATUS_CODES = [
  'evaluator-absent', 'evaluator-artifact-invalid', 'evaluator-batch-incompatible', 'evaluator-batch-pending',
  'evaluator-cache-capacity', 'evaluator-cache-miss', 'evaluator-cancelled', 'evaluator-generation-exhausted',
  'evaluator-input-stale', 'evaluator-internal-failure', 'evaluator-output-invalid', 'evaluator-request-capacity',
  'evaluator-workspace-capacity', 'invalid-evaluator-input', 'invalid-evaluator-profile', 'unsupported-evaluator-capability',
];
const BASE_PORTS = [
  'admit-evaluation-request', 'cancel-evaluation-request', 'classify-evaluator-reuse', 'complete-evaluation-request',
  'encode-evaluator-input', 'enqueue-evaluation-item', 'execute-evaluation-batch', 'fail-evaluation-request',
  'form-evaluation-batch', 'initialize-evaluator', 'publish-evaluator-capability',
];
const CACHE_PORTS = ['lookup-evaluator-cache', 'publish-evaluator-cache'];
const RESUME_PORTS = ['resume-evaluation-batch'];
const PORTS = [...BASE_PORTS, ...CACHE_PORTS, ...RESUME_PORTS];
const INPUT_KEY_FACTS = [
  'artifact-generation', 'batch-context', 'capability-set', 'encoded-input', 'evaluator-profile', 'history', 'observation',
  'precision-execution', 'product', 'purpose', 'randomness', 'root', 'state-generation',
];
const LIFECYCLE_STATES = ['profile-normalized', 'artifacts-resources-admitted', 'initialized', 'active', 'draining', 'terminal', 'released'];

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

function profileKey(profile) {
  return profile ? `${profile.id}\0${schemaKey(profile.schema)}\0${profile.identity.sha256}` : null;
}

function normalizeProfileReference(input, label) {
  exactKeys(input, ['id', 'schema', 'identity'], 'EVALUATOR_PROFILE_REFERENCE_FIELDS', label);
  assertNamespacedId(input.id, 'EVALUATOR_PROFILE_REFERENCE_ID', `${label} id`);
  return {
    id: input.id,
    schema: normalizeSchemaReference(input.schema, `${label} schema`),
    identity: normalizeContentIdentity(input.identity, 'EVALUATOR_PROFILE_REFERENCE_IDENTITY', `${label} identity`),
  };
}

function normalizeCatalogContract(input, catalogById, expectedId, label) {
  exactKeys(input, ['kind', 'id', 'specificationIdentity', 'sha256'], 'EVALUATOR_CONTRACT_FIELDS', label);
  if (input.kind !== 'catalog' || input.id !== expectedId) fail('EVALUATOR_CONTRACT_ID', `${label} must select ${expectedId}`);
  assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\.[0-9]+\.[0-9]+-draft$/, 'EVALUATOR_CONTRACT_ID', `${label} identity`);
  assertSha256(input.sha256, 'EVALUATOR_CONTRACT_DIGEST', `${label} sha256`);
  const expected = catalogById.get(expectedId);
  if (!expected || expected.specificationIdentity !== input.specificationIdentity || expected.sha256 !== input.sha256) fail('EVALUATOR_CONTRACT_DRIFT', `${label} differs from the frozen catalog`);
  return { ...input };
}

function normalizeDomainReference(input, domainResult) {
  exactKeys(input, ['id', 'schema', 'identity', 'stateSchema', 'historySchema', 'validateActionPort'], 'EVALUATOR_DOMAIN_FIELDS', 'domainProfile');
  const domain = domainResult?.normalized;
  if (!domain || !domainResult.identity) fail('EVALUATOR_DOMAIN_INPUT', 'normalized domain profile is required');
  const reference = normalizeProfileReference({ id: input.id, schema: input.schema, identity: input.identity }, 'domainProfile');
  if (reference.id !== domain.id || reference.schema.id !== domain.schema || reference.identity.sha256 !== domainResult.identity.sha256) fail('EVALUATOR_DOMAIN_DRIFT', 'domainProfile differs from normalized domain input');
  const values = new Map(domain.valueSchemas.map((value) => [value.semanticRole, value]));
  const ports = new Map(domain.ports.map(({ id, contract }) => [id, contract]));
  const stateSchema = normalizeSchemaReference(input.stateSchema, 'domainProfile stateSchema');
  if (schemaKey(stateSchema) !== schemaKey(values.get('state').schema)) fail('EVALUATOR_DOMAIN_SCHEMA_DRIFT', 'stateSchema differs from the domain state schema');
  let historySchema;
  if (domain.history.disposition === 'none') {
    exactKeys(input.historySchema, ['kind'], 'EVALUATOR_HISTORY_FIELDS', 'domainProfile historySchema');
    if (input.historySchema.kind !== 'none') fail('EVALUATOR_DOMAIN_SCHEMA_DRIFT', 'history-free domain must select no history schema');
    historySchema = { kind: 'none' };
  } else {
    historySchema = normalizeSchemaReference(input.historySchema, 'domainProfile historySchema');
    if (schemaKey(historySchema) !== schemaKey(values.get('history').schema)) fail('EVALUATOR_DOMAIN_SCHEMA_DRIFT', 'historySchema differs from the domain history schema');
  }
  const validateActionPort = normalizeSchemaReference(input.validateActionPort, 'domainProfile validateActionPort');
  if (schemaKey(validateActionPort) !== schemaKey(ports.get('validate-action'))) fail('EVALUATOR_DOMAIN_PORT_DRIFT', 'validateActionPort differs from domain validate-action');
  return { ...reference, stateSchema, historySchema, validateActionPort };
}

function normalizeGraphReference(input, graphResult) {
  const graph = graphResult?.normalized;
  if (!graph || !graphResult.identity) fail('EVALUATOR_GRAPH_INPUT', 'normalized graph profile is required');
  const materialized = input?.mode === 'materialized';
  exactKeys(input, materialized ? ['id', 'schema', 'identity', 'mode', 'validateReferencePort'] : ['id', 'schema', 'identity', 'mode'], 'EVALUATOR_GRAPH_FIELDS', 'graphProfile');
  const reference = normalizeProfileReference({ id: input.id, schema: input.schema, identity: input.identity }, 'graphProfile');
  if (reference.id !== graph.id || reference.schema.id !== graph.schema || reference.identity.sha256 !== graphResult.identity.sha256 || input.mode !== graph.mode) fail('EVALUATOR_GRAPH_DRIFT', 'graphProfile differs from normalized graph input');
  if (!materialized) {
    if (input.mode !== 'stateless') fail('EVALUATOR_GRAPH_MODE', 'graphProfile mode is invalid');
    return { ...reference, mode: input.mode };
  }
  const validateReferencePort = normalizeSchemaReference(input.validateReferencePort, 'graphProfile validateReferencePort');
  const expected = new Map(graph.ports.map(({ id, contract }) => [id, contract])).get('validate-reference');
  if (schemaKey(validateReferencePort) !== schemaKey(expected)) fail('EVALUATOR_GRAPH_PORT_DRIFT', 'validateReferencePort differs from graph validate-reference');
  return { ...reference, mode: input.mode, validateReferencePort };
}

function normalizeBounds(input, label) {
  exactKeys(input, ['maxWorkUnits', 'maxReads', 'maxWrites', 'maxRandomInputs', 'cancellationObservationWorkUnits'], 'EVALUATOR_BOUNDS_FIELDS', label);
  const result = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, normalizeDecimalUint(value, `${label} ${key}`)]));
  positiveDecimal(result.maxWorkUnits, 'EVALUATOR_BOUNDS_WORK', `${label} maxWorkUnits`);
  positiveDecimal(result.cancellationObservationWorkUnits, 'EVALUATOR_BOUNDS_CANCELLATION', `${label} cancellationObservationWorkUnits`);
  if (compareDecimalUint(result.cancellationObservationWorkUnits, result.maxWorkUnits) > 0) fail('EVALUATOR_BOUNDS_CANCELLATION', `${label} cancellation observation exceeds work bound`);
  return result;
}

function normalizeNumeric(input, label) {
  exactKeys(input, ['representation', 'storageBits', 'accumulationBits', 'range', 'precision', 'rounding', 'nonfinite', 'overflow', 'order'], 'EVALUATOR_NUMERIC_FIELDS', label);
  const storageBits = positiveDecimal(input.storageBits, 'EVALUATOR_NUMERIC_WIDTH', `${label} storageBits`);
  const accumulationBits = positiveDecimal(input.accumulationBits, 'EVALUATOR_NUMERIC_WIDTH', `${label} accumulationBits`);
  if (compareDecimalUint(accumulationBits, storageBits) < 0) fail('EVALUATOR_NUMERIC_WIDTH', `${label} accumulationBits is narrower than storageBits`);
  return {
    representation: assertEnum(input.representation, ['integer', 'fixed', 'floating', 'custom'], 'EVALUATOR_NUMERIC_REPRESENTATION', `${label} representation`),
    storageBits,
    accumulationBits,
    range: normalizeSchemaReference(input.range, `${label} range`),
    precision: normalizeSchemaReference(input.precision, `${label} precision`),
    rounding: assertEnum(input.rounding, ['exact', 'toward-zero', 'nearest-even', 'directed', 'custom'], 'EVALUATOR_NUMERIC_ROUNDING', `${label} rounding`),
    nonfinite: assertEnum(input.nonfinite, ['not-representable', 'reject', 'typed', 'custom'], 'EVALUATOR_NUMERIC_NONFINITE', `${label} nonfinite`),
    overflow: assertEnum(input.overflow, ['reject', 'typed-failure', 'quarantine', 'custom'], 'EVALUATOR_NUMERIC_OVERFLOW', `${label} overflow`),
    order: assertEnum(input.order, ['associative-commutative', 'associative-ordered', 'nonassociative-ordered', 'custom'], 'EVALUATOR_NUMERIC_ORDER', `${label} order`),
  };
}

function normalizeShape(input, label) {
  exactKeys(input, ['axes', 'maxElements', 'maxBytes', 'variable', 'lengthSemantics'], 'EVALUATOR_SHAPE_FIELDS', label);
  if (!Array.isArray(input.axes) || input.axes.length === 0) fail('EVALUATOR_SHAPE_AXES', `${label} axes must not be empty`);
  const axes = input.axes.map((axis, index) => {
    exactKeys(axis, ['id', 'minimum', 'maximum'], 'EVALUATOR_AXIS_FIELDS', `${label} axis ${index}`);
    assertNamespacedId(axis.id, 'EVALUATOR_AXIS_ID', `${label} axis ${index} id`);
    const minimum = positiveDecimal(axis.minimum, 'EVALUATOR_SHAPE_RANGE', `${axis.id} minimum`);
    const maximum = positiveDecimal(axis.maximum, 'EVALUATOR_SHAPE_RANGE', `${axis.id} maximum`);
    if (compareDecimalUint(minimum, maximum) > 0) fail('EVALUATOR_SHAPE_RANGE', `${axis.id} minimum exceeds maximum`);
    return { id: axis.id, minimum, maximum };
  });
  uniqueBy(axes, 'id', 'EVALUATOR_AXIS_DUPLICATE', 'shape axis');
  const maxElements = positiveDecimal(input.maxElements, 'EVALUATOR_SHAPE_RANGE', `${label} maxElements`);
  const product = axes.reduce((value, axis) => value * BigInt(axis.maximum), 1n);
  if (product > BigInt(maxElements)) fail('EVALUATOR_SHAPE_RANGE', `${label} axis product exceeds maxElements`);
  if (typeof input.variable !== 'boolean') fail('EVALUATOR_SHAPE_VARIABLE', `${label} variable must be boolean`);
  return {
    axes,
    maxElements,
    maxBytes: positiveDecimal(input.maxBytes, 'EVALUATOR_SHAPE_RANGE', `${label} maxBytes`),
    variable: input.variable,
    lengthSemantics: normalizeSchemaReference(input.lengthSemantics, `${label} lengthSemantics`),
  };
}

function normalizeCapability(input, index) {
  exactKeys(input, ['id', 'version', 'kind', 'purposes', 'requirementClasses', 'inputs', 'outputs', 'independentPublication', 'failureIsolation'], 'EVALUATOR_CAPABILITY_FIELDS', `capability ${index}`);
  assertNamespacedId(input.id, 'EVALUATOR_CAPABILITY_ID', `capability ${index} id`);
  assertVersion(input.version, 'EVALUATOR_CAPABILITY_VERSION', `${input.id} version`);
  if (typeof input.independentPublication !== 'boolean') fail('EVALUATOR_CAPABILITY_PUBLICATION', `${input.id} independentPublication must be boolean`);
  return {
    id: input.id,
    version: input.version,
    kind: assertEnum(input.kind, ['proposal', 'value', 'distribution', 'proof', 'constraint', 'feature', 'custom'], 'EVALUATOR_CAPABILITY_KIND', `${input.id} kind`),
    purposes: stringSet(input.purposes, { code: 'EVALUATOR_CAPABILITY_PURPOSE', label: `${input.id} purposes`, namespaced: true, minimum: 1 }),
    requirementClasses: stringSet(input.requirementClasses, { code: 'EVALUATOR_CAPABILITY_REQUIREMENT', label: `${input.id} requirementClasses`, allowed: ['required', 'optional', 'advisory', 'namespaced'], minimum: 1 }),
    inputs: stringSet(input.inputs, { code: 'EVALUATOR_CAPABILITY_INPUT', label: `${input.id} inputs`, namespaced: true, minimum: 1 }),
    outputs: stringSet(input.outputs, { code: 'EVALUATOR_CAPABILITY_OUTPUT', label: `${input.id} outputs`, namespaced: true, minimum: 1 }),
    independentPublication: input.independentPublication,
    failureIsolation: assertEnum(input.failureIsolation, ['capability', 'item', 'request', 'batch'], 'EVALUATOR_CAPABILITY_FAILURE', `${input.id} failureIsolation`),
  };
}

function normalizeInput(input, index, domainReference, graphMode) {
  exactKeys(input, ['id', 'owner', 'sourceKind', 'source', 'shape', 'unit', 'numeric', 'memoryExpectation', 'lifetime', 'dependencies', 'keyFacts', 'encoding', 'invalid', 'maxRandomInputs'], 'EVALUATOR_INPUT_FIELDS', `input ${index}`);
  assertNamespacedId(input.id, 'EVALUATOR_INPUT_ID', `input ${index} id`);
  assertNamespacedId(input.unit, 'EVALUATOR_INPUT_UNIT', `${input.id} unit`);
  const owner = assertEnum(input.owner, ['domain', 'evaluator', 'product'], 'EVALUATOR_INPUT_OWNER', `${input.id} owner`);
  const sourceKind = assertEnum(input.sourceKind, ['state', 'history', 'observation', 'root-context', 'purpose', 'product', 'custom'], 'EVALUATOR_INPUT_SOURCE', `${input.id} sourceKind`);
  const source = normalizeSchemaReference(input.source, `${input.id} source`);
  if (owner === 'domain' && sourceKind === 'state' && schemaKey(source) !== schemaKey(domainReference.stateSchema)) fail('EVALUATOR_INPUT_DOMAIN', `${input.id} state source differs from domain`);
  if (owner === 'domain' && sourceKind === 'history' && (domainReference.historySchema.kind === 'none' || schemaKey(source) !== schemaKey(domainReference.historySchema))) fail('EVALUATOR_INPUT_DOMAIN', `${input.id} history source differs from domain`);
  const lifetime = assertEnum(input.lifetime, ['immutable-snapshot', 'protected-borrow', 'request-owned'], 'EVALUATOR_INPUT_LIFETIME', `${input.id} lifetime`);
  if (graphMode === 'stateless' && lifetime === 'protected-borrow') fail('EVALUATOR_INPUT_GRAPH', `${input.id} stateless graph cannot retain a graph borrow`);
  const dependencies = stringSet(input.dependencies, { code: 'EVALUATOR_INPUT_DEPENDENCY', label: `${input.id} dependencies`, allowed: INPUT_KEY_FACTS, minimum: 1 });
  const keyFacts = stringSet(input.keyFacts, { code: 'EVALUATOR_INPUT_KEY', label: `${input.id} keyFacts`, allowed: INPUT_KEY_FACTS, minimum: 4 });
  for (const required of ['capability-set', 'encoded-input', 'evaluator-profile', 'precision-execution', ...dependencies]) if (!keyFacts.includes(required)) fail('EVALUATOR_INPUT_KEY', `${input.id} key omits ${required}`);
  const maxRandomInputs = normalizeDecimalUint(input.maxRandomInputs, `${input.id} maxRandomInputs`);
  if ((maxRandomInputs !== '0') !== keyFacts.includes('randomness')) fail('EVALUATOR_INPUT_RANDOMNESS', `${input.id} randomness key and bound disagree`);
  return {
    id: input.id, owner, sourceKind, source,
    shape: normalizeShape(input.shape, `${input.id} shape`), unit: input.unit,
    numeric: normalizeNumeric(input.numeric, `${input.id} numeric`),
    memoryExpectation: assertEnum(input.memoryExpectation, ['device-resident-view', 'device-owned-copy'], 'EVALUATOR_INPUT_MEMORY', `${input.id} memoryExpectation`),
    lifetime, dependencies, keyFacts,
    encoding: normalizeSchemaReference(input.encoding, `${input.id} encoding`),
    invalid: normalizeSchemaReference(input.invalid, `${input.id} invalid`),
    maxRandomInputs,
  };
}

function normalizeCoordinate(input, index, label) {
  exactKeys(input, ['id', 'unit', 'perspective', 'transform'], 'EVALUATOR_COORDINATE_FIELDS', `${label} coordinate ${index}`);
  assertNamespacedId(input.id, 'EVALUATOR_COORDINATE_ID', `${label} coordinate ${index} id`);
  assertNamespacedId(input.unit, 'EVALUATOR_COORDINATE_UNIT', `${input.id} unit`);
  return {
    id: input.id, unit: input.unit,
    perspective: assertEnum(input.perspective, ['global', 'root-relative', 'role-relative', 'actor-indexed', 'objective-indexed', 'distributional', 'namespaced'], 'EVALUATOR_COORDINATE_PERSPECTIVE', `${input.id} perspective`),
    transform: normalizeSchemaReference(input.transform, `${input.id} transform`),
  };
}

function normalizeOutput(input, index) {
  exactKeys(input, ['id', 'schema', 'family', 'coordinates', 'shape', 'numeric', 'validity', 'uncertainty', 'invalid', 'completeness', 'compatibility'], 'EVALUATOR_OUTPUT_FIELDS', `output ${index}`);
  assertNamespacedId(input.id, 'EVALUATOR_OUTPUT_ID', `output ${index} id`);
  if (!Array.isArray(input.coordinates) || input.coordinates.length === 0) fail('EVALUATOR_OUTPUT_COORDINATES', `${input.id} coordinates must not be empty`);
  const coordinates = input.coordinates.map((coordinate, coordinateIndex) => normalizeCoordinate(coordinate, coordinateIndex, input.id));
  uniqueBy(coordinates, 'id', 'EVALUATOR_COORDINATE_DUPLICATE', 'output coordinate');
  const family = assertEnum(input.family, ['candidate-set', 'scalar', 'vector', 'matrix', 'distribution', 'interval', 'ordinal', 'proof', 'sequence', 'sparse', 'custom'], 'EVALUATOR_OUTPUT_FAMILY', `${input.id} family`);
  if (family === 'scalar' && coordinates.length !== 1) fail('EVALUATOR_OUTPUT_COORDINATES', `${input.id} scalar output requires one coordinate`);
  if (['vector', 'matrix', 'distribution'].includes(family) && coordinates.length < 2) fail('EVALUATOR_OUTPUT_COORDINATES', `${input.id} ${family} output requires multiple coordinates`);
  return {
    id: input.id,
    schema: normalizeSchemaReference(input.schema, `${input.id} schema`), family, coordinates,
    shape: normalizeShape(input.shape, `${input.id} shape`),
    numeric: normalizeNumeric(input.numeric, `${input.id} numeric`),
    validity: normalizeSchemaReference(input.validity, `${input.id} validity`),
    uncertainty: normalizeSchemaReference(input.uncertainty, `${input.id} uncertainty`),
    invalid: normalizeSchemaReference(input.invalid, `${input.id} invalid`),
    completeness: assertEnum(input.completeness, ['atomic-result-set', 'independent-capability'], 'EVALUATOR_OUTPUT_COMPLETENESS', `${input.id} completeness`),
    compatibility: normalizeContentIdentity(input.compatibility, 'EVALUATOR_OUTPUT_COMPATIBILITY', `${input.id} compatibility`),
  };
}

function normalizeArtifact(input, index) {
  exactKeys(input, ['id', 'kind', 'schema', 'identity', 'scope', 'mutability', 'maxBytes', 'maxElements', 'precision', 'encoding', 'compatibility', 'initialization', 'teardown', 'residentBeforeIgnition', 'provenance'], 'EVALUATOR_ARTIFACT_FIELDS', `artifact ${index}`);
  assertNamespacedId(input.id, 'EVALUATOR_ARTIFACT_ID', `artifact ${index} id`);
  if (input.residentBeforeIgnition !== true) fail('EVALUATOR_ARTIFACT_RESIDENCE', `${input.id} must be resident before ignition`);
  exactKeys(input.provenance, ['origin', 'revision', 'license', 'contentSha256', 'review'], 'EVALUATOR_PROVENANCE_FIELDS', `${input.id} provenance`);
  assertEnum(input.provenance.origin, ['first-party', 'third-party-reviewed'], 'EVALUATOR_PROVENANCE_ORIGIN', `${input.id} provenance origin`);
  assertString(input.provenance.revision, /^[0-9a-f]{40}$/, 'EVALUATOR_PROVENANCE_REVISION', `${input.id} provenance revision`);
  assertString(input.provenance.license, /\S/, 'EVALUATOR_PROVENANCE_LICENSE', `${input.id} provenance license`);
  assertSha256(input.provenance.contentSha256, 'EVALUATOR_PROVENANCE_DIGEST', `${input.id} provenance contentSha256`);
  return {
    id: input.id,
    kind: assertEnum(input.kind, ['model', 'table', 'parameter', 'program-data', 'custom'], 'EVALUATOR_ARTIFACT_KIND', `${input.id} kind`),
    schema: normalizeSchemaReference(input.schema, `${input.id} schema`),
    identity: normalizeContentIdentity(input.identity, 'EVALUATOR_ARTIFACT_IDENTITY', `${input.id} identity`),
    scope: assertEnum(input.scope, ['engine', 'session', 'root', 'work'], 'EVALUATOR_ARTIFACT_SCOPE', `${input.id} scope`),
    mutability: assertEnum(input.mutability, ['immutable', 'selected-mutable'], 'EVALUATOR_ARTIFACT_MUTABILITY', `${input.id} mutability`),
    maxBytes: positiveDecimal(input.maxBytes, 'EVALUATOR_ARTIFACT_RANGE', `${input.id} maxBytes`),
    maxElements: positiveDecimal(input.maxElements, 'EVALUATOR_ARTIFACT_RANGE', `${input.id} maxElements`),
    precision: normalizeSchemaReference(input.precision, `${input.id} precision`),
    encoding: normalizeSchemaReference(input.encoding, `${input.id} encoding`),
    compatibility: normalizeSchemaReference(input.compatibility, `${input.id} compatibility`),
    initialization: normalizeSchemaReference(input.initialization, `${input.id} initialization`),
    teardown: normalizeSchemaReference(input.teardown, `${input.id} teardown`),
    residentBeforeIgnition: true,
    provenance: { ...input.provenance, review: normalizeSchemaReference(input.provenance.review, `${input.id} provenance review`) },
  };
}

function normalizeMutableState(input) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'EVALUATOR_STATE_FIELDS', 'mutableState');
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'id', 'schema', 'scope', 'maxBytes', 'initialization', 'update', 'ordering', 'publication', 'rollback', 'cacheInvalidation', 'determinism', 'cleanup'], 'EVALUATOR_STATE_FIELDS', 'mutableState');
  if (input.kind !== 'selected') fail('EVALUATOR_STATE_KIND', 'mutableState kind is invalid');
  assertNamespacedId(input.id, 'EVALUATOR_STATE_ID', 'mutableState id');
  return {
    kind: input.kind, id: input.id, schema: normalizeSchemaReference(input.schema, 'mutableState schema'),
    scope: assertEnum(input.scope, ['engine', 'session', 'root', 'work'], 'EVALUATOR_STATE_SCOPE', 'mutableState scope'),
    maxBytes: positiveDecimal(input.maxBytes, 'EVALUATOR_STATE_RANGE', 'mutableState maxBytes'),
    initialization: normalizeSchemaReference(input.initialization, 'mutableState initialization'),
    update: normalizeSchemaReference(input.update, 'mutableState update'),
    ordering: normalizeSchemaReference(input.ordering, 'mutableState ordering'),
    publication: normalizeSchemaReference(input.publication, 'mutableState publication'),
    rollback: normalizeSchemaReference(input.rollback, 'mutableState rollback'),
    cacheInvalidation: normalizeSchemaReference(input.cacheInvalidation, 'mutableState cacheInvalidation'),
    determinism: assertEnum(input.determinism, ['deterministic', 'schedule-dependent-stable', 'explicit-stochastic'], 'EVALUATOR_STATE_DETERMINISM', 'mutableState determinism'),
    cleanup: normalizeSchemaReference(input.cleanup, 'mutableState cleanup'),
  };
}

function normalizeRequest(input, capabilityIds) {
  exactKeys(input, ['identity', 'lifecycle', 'capabilities', 'admission', 'coalescing', 'accounting', 'cancellationOrdering', 'maxActive', 'maxWaiters', 'cleanup'], 'EVALUATOR_REQUEST_FIELDS', 'request');
  if (!Array.isArray(input.capabilities)) fail('EVALUATOR_REQUEST_CAPABILITIES', 'request capabilities must be an array');
  const capabilities = input.capabilities.map((entry, index) => {
    exactKeys(entry, ['capability', 'requirement', 'fallback'], 'EVALUATOR_REQUEST_CAPABILITY_FIELDS', `request capability ${index}`);
    if (!capabilityIds.has(entry.capability)) fail('EVALUATOR_REQUEST_CAPABILITY', `request names unknown capability ${entry.capability}`);
    const requirement = assertEnum(entry.requirement, ['required', 'optional', 'advisory', 'namespaced'], 'EVALUATOR_REQUEST_REQUIREMENT', `${entry.capability} requirement`);
    const fallback = assertEnum(entry.fallback, ['pending', 'fail-request', 'terminal', 'detach', 'skip-capability', 'custom'], 'EVALUATOR_REQUEST_FALLBACK', `${entry.capability} fallback`);
    if (requirement === 'required' && !['pending', 'fail-request', 'terminal', 'custom'].includes(fallback)) fail('EVALUATOR_REQUEST_FALLBACK', `${entry.capability} required fallback is invalid`);
    return { capability: entry.capability, requirement, fallback };
  }).sort((left, right) => compareRaw(left.capability, right.capability));
  uniqueBy(capabilities, 'capability', 'EVALUATOR_REQUEST_CAPABILITY_DUPLICATE', 'request capability');
  if (capabilities.length !== capabilityIds.size || [...capabilityIds].some((id) => !capabilities.some(({ capability }) => capability === id))) fail('EVALUATOR_REQUEST_CAPABILITY_COVERAGE', 'request must classify every capability exactly once');
  return {
    identity: normalizeSchemaReference(input.identity, 'request identity'),
    lifecycle: normalizeSchemaReference(input.lifecycle, 'request lifecycle'), capabilities,
    admission: normalizeSchemaReference(input.admission, 'request admission'),
    coalescing: normalizeSchemaReference(input.coalescing, 'request coalescing'),
    accounting: normalizeSchemaReference(input.accounting, 'request accounting'),
    cancellationOrdering: normalizeSchemaReference(input.cancellationOrdering, 'request cancellationOrdering'),
    maxActive: positiveDecimal(input.maxActive, 'EVALUATOR_REQUEST_RANGE', 'request maxActive'),
    maxWaiters: positiveDecimal(input.maxWaiters, 'EVALUATOR_REQUEST_RANGE', 'request maxWaiters'),
    cleanup: normalizeSchemaReference(input.cleanup, 'request cleanup'),
  };
}

function normalizeRandomness(input, label) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind', 'maxInputs'], 'EVALUATOR_RANDOM_FIELDS', label);
    if (input.maxInputs !== '0') fail('EVALUATOR_RANDOM_BOUND', `${label} none must consume zero inputs`);
    return { kind: 'none', maxInputs: '0' };
  }
  exactKeys(input, ['kind', 'maxInputs', 'semantics'], 'EVALUATOR_RANDOM_FIELDS', label);
  if (input.kind !== 'explicit-input') fail('EVALUATOR_RANDOM_KIND', `${label} kind is invalid`);
  return { kind: input.kind, maxInputs: positiveDecimal(input.maxInputs, 'EVALUATOR_RANDOM_BOUND', `${label} maxInputs`), semantics: normalizeSchemaReference(input.semantics, `${label} semantics`) };
}

function normalizeContinuation(input) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'EVALUATOR_CONTINUATION_FIELDS', 'batching continuation');
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'identity', 'maxResumes', 'maxRetainedBytes', 'progress', 'retry'], 'EVALUATOR_CONTINUATION_FIELDS', 'batching continuation');
  if (input.kind !== 'bounded') fail('EVALUATOR_CONTINUATION_KIND', 'batching continuation kind is invalid');
  return {
    kind: input.kind,
    identity: normalizeSchemaReference(input.identity, 'continuation identity'),
    maxResumes: positiveDecimal(input.maxResumes, 'EVALUATOR_CONTINUATION_RANGE', 'continuation maxResumes'),
    maxRetainedBytes: positiveDecimal(input.maxRetainedBytes, 'EVALUATOR_CONTINUATION_RANGE', 'continuation maxRetainedBytes'),
    progress: normalizeSchemaReference(input.progress, 'continuation progress'),
    retry: normalizeSchemaReference(input.retry, 'continuation retry'),
  };
}

function normalizeBatching(input) {
  exactKeys(input, ['semantics', 'minimumReadyItems', 'maximumItems', 'compatibility', 'order', 'padding', 'determinism', 'randomness', 'maxDelayWorkUnits', 'failureDomain', 'scatter', 'inactiveLane', 'continuation', 'bounds'], 'EVALUATOR_BATCH_FIELDS', 'batching');
  const semantics = assertEnum(input.semantics, ['batch-independent', 'batch-sensitive'], 'EVALUATOR_BATCH_SEMANTICS', 'batching semantics');
  const minimumReadyItems = positiveDecimal(input.minimumReadyItems, 'EVALUATOR_BATCH_RANGE', 'batching minimumReadyItems');
  const maximumItems = positiveDecimal(input.maximumItems, 'EVALUATOR_BATCH_RANGE', 'batching maximumItems');
  if (minimumReadyItems !== '1' || compareDecimalUint(minimumReadyItems, maximumItems) > 0) fail('EVALUATOR_BATCH_PROGRESS', 'batching must permit one ready item and fit maximumItems');
  const order = input.order?.kind === 'none'
    ? (exactKeys(input.order, ['kind'], 'EVALUATOR_BATCH_ORDER_FIELDS', 'batching order'), { kind: 'none' })
    : normalizeSchemaReference(input.order, 'batching order');
  if ((semantics === 'batch-sensitive') !== (order.kind !== 'none')) fail('EVALUATOR_BATCH_IDENTITY', 'batch-sensitive semantics and order identity disagree');
  const randomness = normalizeRandomness(input.randomness, 'batching randomness');
  const bounds = normalizeBounds(input.bounds, 'batching bounds');
  if (compareDecimalUint(randomness.maxInputs, bounds.maxRandomInputs) > 0) fail('EVALUATOR_BATCH_RANDOMNESS', 'batch randomness exceeds bounds');
  return {
    semantics, minimumReadyItems, maximumItems,
    compatibility: normalizeSchemaReference(input.compatibility, 'batching compatibility'), order,
    padding: normalizeSchemaReference(input.padding, 'batching padding'),
    determinism: assertEnum(input.determinism, ['deterministic', 'tolerance-equivalent', 'explicit-stochastic', 'batch-context-bound'], 'EVALUATOR_BATCH_DETERMINISM', 'batching determinism'),
    randomness,
    maxDelayWorkUnits: positiveDecimal(input.maxDelayWorkUnits, 'EVALUATOR_BATCH_RANGE', 'batching maxDelayWorkUnits'),
    failureDomain: assertEnum(input.failureDomain, ['item-independent', 'capability-independent', 'whole-batch'], 'EVALUATOR_BATCH_FAILURE', 'batching failureDomain'),
    scatter: normalizeSchemaReference(input.scatter, 'batching scatter'),
    inactiveLane: normalizeSchemaReference(input.inactiveLane, 'batching inactiveLane'),
    continuation: normalizeContinuation(input.continuation), bounds,
  };
}

function normalizeWorkspace(input, index) {
  exactKeys(input, ['id', 'scope', 'maxBytes', 'alignment', 'ownership', 'initialization', 'mutation', 'publication', 'highWaterAccounting', 'release'], 'EVALUATOR_WORKSPACE_FIELDS', `workspace ${index}`);
  assertNamespacedId(input.id, 'EVALUATOR_WORKSPACE_ID', `workspace ${index} id`);
  return {
    id: input.id,
    scope: assertEnum(input.scope, ['persistent', 'per-item', 'per-batch', 'per-continuation'], 'EVALUATOR_WORKSPACE_SCOPE', `${input.id} scope`),
    maxBytes: positiveDecimal(input.maxBytes, 'EVALUATOR_WORKSPACE_RANGE', `${input.id} maxBytes`),
    alignment: positiveDecimal(input.alignment, 'EVALUATOR_WORKSPACE_RANGE', `${input.id} alignment`),
    ownership: assertEnum(input.ownership, ['exclusive', 'shared-readonly', 'owner-partitioned'], 'EVALUATOR_WORKSPACE_OWNERSHIP', `${input.id} ownership`),
    initialization: normalizeSchemaReference(input.initialization, `${input.id} initialization`),
    mutation: normalizeSchemaReference(input.mutation, `${input.id} mutation`),
    publication: normalizeSchemaReference(input.publication, `${input.id} publication`),
    highWaterAccounting: normalizeSchemaReference(input.highWaterAccounting, `${input.id} highWaterAccounting`),
    release: normalizeSchemaReference(input.release, `${input.id} release`),
  };
}

function normalizePublication(input, index, capabilityIds) {
  exactKeys(input, ['capability', 'channel', 'producer', 'consumers', 'states', 'visibility', 'commitValidation', 'maxWaiters', 'progress', 'terminalAuthority'], 'EVALUATOR_PUBLICATION_FIELDS', `publication ${index}`);
  if (!capabilityIds.has(input.capability)) fail('EVALUATOR_PUBLICATION_CAPABILITY', `publication names unknown capability ${input.capability}`);
  if (input.producer !== 'evaluator' || input.terminalAuthority !== 'single-publication-cas') fail('EVALUATOR_PUBLICATION_AUTHORITY', `${input.capability} publication authority is invalid`);
  const states = stringSet(input.states, { code: 'EVALUATOR_PUBLICATION_STATE', label: `${input.capability} states`, allowed: ['absent', 'claimed', 'queued', 'executing', 'publishing', 'ready', 'failed', 'cancelled', 'stale'], minimum: 5 });
  for (const required of ['ready', 'failed', 'cancelled', 'stale']) if (!states.includes(required)) fail('EVALUATOR_PUBLICATION_STATE', `${input.capability} publication omits ${required}`);
  return {
    capability: input.capability,
    channel: normalizeSchemaReference(input.channel, `${input.capability} channel`), producer: input.producer,
    consumers: stringSet(input.consumers, { code: 'EVALUATOR_PUBLICATION_CONSUMER', label: `${input.capability} consumers`, allowed: ['policy', 'output', 'progress', 'session', 'namespaced'], minimum: 1 }),
    states,
    visibility: assertEnum(input.visibility, ['device-release-acquire', 'owner-exclusive'], 'EVALUATOR_PUBLICATION_VISIBILITY', `${input.capability} visibility`),
    commitValidation: normalizeSchemaReference(input.commitValidation, `${input.capability} commitValidation`),
    maxWaiters: positiveDecimal(input.maxWaiters, 'EVALUATOR_PUBLICATION_RANGE', `${input.capability} maxWaiters`),
    progress: normalizeSchemaReference(input.progress, `${input.capability} progress`),
    terminalAuthority: input.terminalAuthority,
  };
}

function normalizeCache(input, selectedInputKeyFacts, mutableState) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'EVALUATOR_CACHE_FIELDS', 'cache');
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'key', 'keyFacts', 'entryLifecycle', 'collisionVerification', 'equivalence', 'maxEntries', 'maxWaiters', 'failureCaching', 'pressureStatus', 'eviction', 'protection', 'generation', 'stateInvalidation', 'cleanup'], 'EVALUATOR_CACHE_FIELDS', 'cache');
  if (input.kind !== 'selected' || input.collisionVerification !== 'full-key-after-hash' || input.failureCaching !== 'none') fail('EVALUATOR_CACHE_KIND', 'cache selection/collision/failure policy is invalid');
  const keyFacts = stringSet(input.keyFacts, { code: 'EVALUATOR_CACHE_KEY', label: 'cache keyFacts', allowed: INPUT_KEY_FACTS, minimum: 5 });
  for (const fact of selectedInputKeyFacts) if (!keyFacts.includes(fact)) fail('EVALUATOR_CACHE_KEY', `cache key omits input fact ${fact}`);
  if (mutableState.kind === 'selected' && !keyFacts.includes('state-generation')) fail('EVALUATOR_CACHE_KEY', 'cache key omits mutable state generation');
  return {
    kind: input.kind, key: normalizeSchemaReference(input.key, 'cache key'), keyFacts,
    entryLifecycle: normalizeSchemaReference(input.entryLifecycle, 'cache entryLifecycle'),
    collisionVerification: input.collisionVerification,
    equivalence: normalizeSchemaReference(input.equivalence, 'cache equivalence'),
    maxEntries: positiveDecimal(input.maxEntries, 'EVALUATOR_CACHE_RANGE', 'cache maxEntries'),
    maxWaiters: positiveDecimal(input.maxWaiters, 'EVALUATOR_CACHE_RANGE', 'cache maxWaiters'),
    failureCaching: input.failureCaching, pressureStatus: input.pressureStatus,
    eviction: normalizeSchemaReference(input.eviction, 'cache eviction'),
    protection: normalizeSchemaReference(input.protection, 'cache protection'),
    generation: normalizeSchemaReference(input.generation, 'cache generation'),
    stateInvalidation: normalizeSchemaReference(input.stateInvalidation, 'cache stateInvalidation'),
    cleanup: normalizeSchemaReference(input.cleanup, 'cache cleanup'),
  };
}

function normalizeExecution(input) {
  exactKeys(input, ['equivalenceClass', 'comparison', 'deviceOwned', 'hostProgress', 'idempotence', 'workClasses', 'stopDisposition', 'bounds'], 'EVALUATOR_EXECUTION_FIELDS', 'execution');
  if (input.deviceOwned !== true || input.hostProgress !== 'none') fail('EVALUATOR_DEVICE_CLOSURE', 'execution must be device-owned without host progress');
  return {
    equivalenceClass: assertEnum(input.equivalenceClass, ['exact', 'tolerance-equivalent', 'bounded-error', 'stochastic-distributional', 'proof-certified', 'custom'], 'EVALUATOR_EXECUTION_EQUIVALENCE', 'execution equivalenceClass'),
    comparison: normalizeSchemaReference(input.comparison, 'execution comparison'), deviceOwned: true, hostProgress: input.hostProgress,
    idempotence: normalizeSchemaReference(input.idempotence, 'execution idempotence'),
    workClasses: stringSet(input.workClasses, { code: 'EVALUATOR_EXECUTION_WORK', label: 'execution workClasses', namespaced: true, minimum: 5 }),
    stopDisposition: normalizeSchemaReference(input.stopDisposition, 'execution stopDisposition'),
    bounds: normalizeBounds(input.bounds, 'execution bounds'),
  };
}

function normalizeLifecycle(input) {
  exactKeys(input, ['states', 'failure', 'quarantine', 'teardown', 'admissionClosedAt'], 'EVALUATOR_LIFECYCLE_FIELDS', 'lifecycle');
  if (!Array.isArray(input.states) || input.states.length !== LIFECYCLE_STATES.length || input.states.some((state, index) => state !== LIFECYCLE_STATES[index])) fail('EVALUATOR_LIFECYCLE_STATES', 'lifecycle states/order are incomplete');
  if (input.admissionClosedAt !== 'draining') fail('EVALUATOR_LIFECYCLE_ADMISSION', 'lifecycle must close admission at draining');
  return {
    states: [...input.states],
    failure: normalizeSchemaReference(input.failure, 'lifecycle failure'),
    quarantine: normalizeSchemaReference(input.quarantine, 'lifecycle quarantine'),
    teardown: normalizeSchemaReference(input.teardown, 'lifecycle teardown'),
    admissionClosedAt: input.admissionClosedAt,
  };
}

function normalizeCleanup(input, expectedClasses) {
  exactKeys(input, ['classes', 'disposition', 'quarantine', 'releaseOrder'], 'EVALUATOR_CLEANUP_FIELDS', 'cleanup');
  const classes = stringSet(input.classes, {
    code: 'EVALUATOR_CLEANUP_CLASS', label: 'cleanup classes',
    allowed: ['artifact-reference', 'input-lease', 'request', 'waiter', 'batch', 'workspace', 'continuation', 'result', 'cache-entry', 'diagnostic', 'mutable-state'],
    minimum: 6,
  });
  if (classes.length !== expectedClasses.size || [...expectedClasses].some((item) => !classes.includes(item))) fail('EVALUATOR_CLEANUP_COVERAGE', 'cleanup does not classify every selected evaluator class');
  return {
    classes,
    disposition: normalizeSchemaReference(input.disposition, 'cleanup disposition'),
    quarantine: normalizeSchemaReference(input.quarantine, 'cleanup quarantine'),
    releaseOrder: normalizeSchemaReference(input.releaseOrder, 'cleanup releaseOrder'),
  };
}

function normalizeStatus(input, index) {
  exactKeys(input, ['code', 'class', 'diagnostic'], 'EVALUATOR_STATUS_FIELDS', `status ${index}`);
  assertString(input.code, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, 'EVALUATOR_STATUS_CODE', `status ${index} code`);
  if (typeof input.diagnostic !== 'boolean') fail('EVALUATOR_STATUS_DIAGNOSTIC', `${input.code} diagnostic must be boolean`);
  return { code: input.code, class: assertEnum(input.class, ['normal', 'pending', 'pressure', 'recoverable', 'stop', 'fatal', 'cancellation'], 'EVALUATOR_STATUS_CLASS', `${input.code} class`), diagnostic: input.diagnostic };
}

function normalizePort(input, index, statusCodes) {
  exactKeys(input, ['id', 'contract', 'bounds', 'completion', 'statuses'], 'EVALUATOR_PORT_FIELDS', `port ${index}`);
  assertEnum(input.id, PORTS, 'EVALUATOR_PORT_ID', `port ${index} id`);
  const statuses = stringSet(input.statuses, { code: 'EVALUATOR_PORT_STATUSES', label: `${input.id} statuses`, minimum: 1 });
  for (const status of statuses) if (!statusCodes.has(status)) fail('EVALUATOR_PORT_STATUS', `${input.id} names undeclared status ${status}`);
  return {
    id: input.id, contract: normalizeSchemaReference(input.contract, `${input.id} contract`), bounds: normalizeBounds(input.bounds, `${input.id} bounds`),
    completion: assertEnum(input.completion, ['bounded', 'finite-resumable', 'must-drain'], 'EVALUATOR_PORT_COMPLETION', `${input.id} completion`), statuses,
  };
}

function normalizeResource(input, index, statusCodes) {
  exactKeys(input, ['id', 'class', 'unit', 'minimum', 'maximum', 'alignment', 'scope', 'pressureStatus'], 'EVALUATOR_RESOURCE_FIELDS', `resource ${index}`);
  assertNamespacedId(input.id, 'EVALUATOR_RESOURCE_ID', `resource ${index} id`);
  const minimum = normalizeDecimalUint(input.minimum, `${input.id} minimum`);
  const maximum = normalizeDecimalUint(input.maximum, `${input.id} maximum`);
  if (compareDecimalUint(minimum, maximum) > 0) fail('EVALUATOR_RESOURCE_RANGE', `${input.id} minimum exceeds maximum`);
  if (!statusCodes.has(input.pressureStatus)) fail('EVALUATOR_RESOURCE_STATUS', `${input.id} pressureStatus is undeclared`);
  return {
    id: input.id,
    class: assertEnum(input.class, ['artifact', 'state', 'input', 'request', 'queue', 'batch', 'workspace', 'continuation', 'result', 'cache', 'waiter', 'randomness', 'diagnostic'], 'EVALUATOR_RESOURCE_CLASS', `${input.id} class`),
    unit: assertEnum(input.unit, ['bytes', 'elements', 'records', 'slots', 'work-units', 'random-inputs', 'diagnostics'], 'EVALUATOR_RESOURCE_UNIT', `${input.id} unit`),
    minimum, maximum, alignment: positiveDecimal(input.alignment, 'EVALUATOR_RESOURCE_ALIGNMENT', `${input.id} alignment`),
    scope: assertEnum(input.scope, ['per-engine', 'per-worker', 'per-invocation'], 'EVALUATOR_RESOURCE_SCOPE', `${input.id} scope`), pressureStatus: input.pressureStatus,
  };
}

function normalizeReuse(input, index) {
  exactKeys(input, ['classId', 'disposition', 'condition', 'ordering', 'lifecycle'], 'EVALUATOR_REUSE_FIELDS', `reuse ${index}`);
  assertNamespacedId(input.classId, 'EVALUATOR_REUSE_ID', `reuse ${index} classId`);
  return {
    classId: input.classId,
    disposition: assertEnum(input.disposition, ['retain', 'retain-if-key-valid', 'transform', 'reset', 'invalidate'], 'EVALUATOR_REUSE_DISPOSITION', `${input.classId} disposition`),
    condition: normalizeSchemaReference(input.condition, `${input.classId} condition`),
    ordering: normalizeSchemaReference(input.ordering, `${input.classId} ordering`),
    lifecycle: normalizeSchemaReference(input.lifecycle, `${input.classId} lifecycle`),
  };
}

function normalizeDiagnostics(input) {
  exactKeys(input, ['authority', 'maxRecords', 'maxBytes', 'overflow', 'rawAddresses', 'payloadRedaction'], 'EVALUATOR_DIAGNOSTIC_FIELDS', 'diagnostics');
  if (input.authority !== 'non-authoritative' || input.rawAddresses !== false || input.payloadRedaction !== 'default-redacted') fail('EVALUATOR_DIAGNOSTIC_AUTHORITY', 'diagnostics must be non-authoritative, address-free and payload-redacted');
  return { authority: input.authority, maxRecords: normalizeDecimalUint(input.maxRecords, 'diagnostics maxRecords'), maxBytes: normalizeDecimalUint(input.maxBytes, 'diagnostics maxBytes'), overflow: assertEnum(input.overflow, ['drop', 'count', 'terminal'], 'EVALUATOR_DIAGNOSTIC_OVERFLOW', 'diagnostics overflow'), rawAddresses: false, payloadRedaction: input.payloadRedaction };
}

function normalizeCompatibility(input) {
  exactKeys(input, ['domainIdentityRequired', 'graphIdentityRequired', 'policyContractRequired', 'persistence'], 'EVALUATOR_COMPAT_FIELDS', 'compatibility');
  if (input.domainIdentityRequired !== true || input.graphIdentityRequired !== true || input.policyContractRequired !== true) fail('EVALUATOR_COMPAT_IDENTITY', 'compatibility must bind domain, graph and policy contract identities');
  let persistence;
  if (input.persistence?.kind === 'none') {
    exactKeys(input.persistence, ['kind'], 'EVALUATOR_PERSISTENCE_FIELDS', 'persistence');
    persistence = { kind: 'none' };
  } else {
    exactKeys(input.persistence, ['kind', 'encoding', 'namespace', 'integrity', 'recovery', 'migration', 'rollback', 'reuseValidity', 'retention', 'cleanup'], 'EVALUATOR_PERSISTENCE_FIELDS', 'persistence');
    if (input.persistence.kind !== 'versioned') fail('EVALUATOR_PERSISTENCE_KIND', 'persistence kind is invalid');
    assertNamespacedId(input.persistence.namespace, 'EVALUATOR_PERSISTENCE_NAMESPACE', 'persistence namespace');
    persistence = { kind: input.persistence.kind, namespace: input.persistence.namespace };
    for (const field of ['encoding', 'integrity', 'recovery', 'migration', 'rollback', 'reuseValidity', 'retention', 'cleanup']) persistence[field] = normalizeSchemaReference(input.persistence[field], `persistence ${field}`);
  }
  return { domainIdentityRequired: true, graphIdentityRequired: true, policyContractRequired: true, persistence };
}

function normalizeProgram(input) {
  exactKeys(input, ['kind', 'language', 'sourceIdentity', 'inputs', 'provenance'], 'EVALUATOR_PROGRAM_FIELDS', 'programContribution');
  if (input.kind !== 'device-program' || input.language !== 'restricted-device-js') fail('EVALUATOR_PROGRAM_LANGUAGE', 'evaluator contribution must be restricted Device-JS');
  if (!Array.isArray(input.inputs)) fail('EVALUATOR_PROGRAM_INPUTS', 'program inputs must be an array');
  const inputs = input.inputs.map((entry, index) => normalizeProfileReference(entry, `program input ${index}`)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(inputs, 'id', 'EVALUATOR_PROGRAM_INPUT_DUPLICATE', 'program input');
  exactKeys(input.provenance, ['origin', 'revision', 'license', 'review'], 'EVALUATOR_PROGRAM_PROVENANCE_FIELDS', 'program provenance');
  assertEnum(input.provenance.origin, ['first-party', 'third-party-reviewed'], 'EVALUATOR_PROGRAM_ORIGIN', 'program provenance origin');
  assertString(input.provenance.revision, /^[0-9a-f]{40}$/, 'EVALUATOR_PROGRAM_REVISION', 'program provenance revision');
  assertString(input.provenance.license, /\S/, 'EVALUATOR_PROGRAM_LICENSE', 'program provenance license');
  return {
    kind: input.kind, language: input.language,
    sourceIdentity: normalizeContentIdentity(input.sourceIdentity, 'EVALUATOR_PROGRAM_SOURCE', 'program sourceIdentity'),
    inputs,
    provenance: { ...input.provenance, review: normalizeSchemaReference(input.provenance.review, 'program provenance review') },
  };
}

function normalizeProductData(input, index) {
  exactKeys(input, ['ownerContract', 'schema', 'identity'], 'EVALUATOR_PRODUCT_FIELDS', `productData ${index}`);
  exactKeys(input.ownerContract, ['kind', 'id', 'version', 'schema', 'sha256'], 'EVALUATOR_PRODUCT_OWNER_FIELDS', `productData ${index} ownerContract`);
  if (input.ownerContract.kind !== 'namespaced') fail('EVALUATOR_PRODUCT_OWNER', 'product data owner must be namespaced');
  assertNamespacedId(input.ownerContract.id, 'EVALUATOR_PRODUCT_OWNER', 'product owner id');
  assertVersion(input.ownerContract.version, 'EVALUATOR_PRODUCT_OWNER', 'product owner version');
  assertString(input.ownerContract.schema, /^[a-z][a-z0-9.-]+\/[0-9]+\.[0-9]+\.[0-9]+$/, 'EVALUATOR_PRODUCT_OWNER', 'product owner schema');
  assertSha256(input.ownerContract.sha256, 'EVALUATOR_PRODUCT_OWNER', 'product owner sha256');
  if (!input.ownerContract.schema.endsWith(`/${input.ownerContract.version}`)) fail('EVALUATOR_PRODUCT_OWNER', 'product owner schema/version differ');
  return { ownerContract: { ...input.ownerContract }, schema: normalizeSchemaReference(input.schema, `productData ${index} schema`), identity: normalizeContentIdentity(input.identity, 'EVALUATOR_PRODUCT_IDENTITY', `productData ${index} identity`) };
}

export function normalizeEvaluatorProfile(input, inspectedCatalog, domainResult, graphResult) {
  exactKeys(input, ['schema', 'representation', 'status', 'contract', 'policyContract', 'id', 'version', 'mode', 'domainProfile', 'graphProfile', 'capabilities', 'inputs', 'outputs', 'artifacts', 'mutableState', 'request', 'batching', 'workspaces', 'publications', 'cache', 'execution', 'lifecycle', 'cleanup', 'ports', 'resources', 'statuses', 'reuse', 'diagnostics', 'compatibility', 'programContribution', 'productData'], 'EVALUATOR_ROOT_FIELDS', 'evaluator profile');
  if (input.schema !== EVALUATOR_SCHEMA || input.representation !== REPRESENTATION || input.status !== 'proposal-evidence') fail('EVALUATOR_SCHEMA', 'unsupported evaluator schema/representation/status');
  assertNamespacedId(input.id, 'EVALUATOR_PROFILE_ID', 'evaluator profile id');
  assertVersion(input.version, 'EVALUATOR_PROFILE_VERSION', 'evaluator profile version');
  const contracts = inspectedCatalog?.contractSet?.contracts;
  if (!contracts) fail('EVALUATOR_CATALOG', 'inspected catalog is required');
  const catalogById = new Map(contracts.map((contract) => [contract.id, contract]));
  const contract = normalizeCatalogContract(input.contract, catalogById, EVALUATOR_CONTRACT, 'evaluator contract');
  const policyContract = normalizeCatalogContract(input.policyContract, catalogById, POLICY_CONTRACT, 'policy contract');
  const domainProfile = normalizeDomainReference(input.domainProfile, domainResult);
  const graphProfile = normalizeGraphReference(input.graphProfile, graphResult);
  const mode = assertEnum(input.mode, ['proposal-only', 'evaluation-only', 'combined'], 'EVALUATOR_MODE', 'evaluator mode');

  if (!Array.isArray(input.capabilities) || input.capabilities.length === 0) fail('EVALUATOR_CAPABILITY_COUNT', 'capabilities must not be empty');
  const capabilities = input.capabilities.map(normalizeCapability).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(capabilities, 'id', 'EVALUATOR_CAPABILITY_DUPLICATE', 'capability');
  const capabilityIds = new Set(capabilities.map(({ id }) => id));
  const proposalSelected = capabilities.some(({ kind }) => kind === 'proposal');
  const evaluationSelected = capabilities.some(({ kind }) => kind !== 'proposal');
  const derivedMode = proposalSelected ? (evaluationSelected ? 'combined' : 'proposal-only') : 'evaluation-only';
  if (derivedMode !== mode) fail('EVALUATOR_MODE', `evaluator mode must be ${derivedMode}`);

  if (!Array.isArray(input.inputs) || input.inputs.length === 0) fail('EVALUATOR_INPUT_COUNT', 'inputs must not be empty');
  const inputs = input.inputs.map((entry, index) => normalizeInput(entry, index, domainProfile, graphProfile.mode)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(inputs, 'id', 'EVALUATOR_INPUT_DUPLICATE', 'input');
  const inputIds = new Set(inputs.map(({ id }) => id));
  if (!Array.isArray(input.outputs) || input.outputs.length === 0) fail('EVALUATOR_OUTPUT_COUNT', 'outputs must not be empty');
  const outputs = input.outputs.map(normalizeOutput).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(outputs, 'id', 'EVALUATOR_OUTPUT_DUPLICATE', 'output');
  const outputIds = new Set(outputs.map(({ id }) => id));
  const outputOwners = new Map();
  for (const capability of capabilities) {
    for (const id of capability.inputs) if (!inputIds.has(id)) fail('EVALUATOR_CAPABILITY_INPUT', `${capability.id} names unknown input ${id}`);
    for (const id of capability.outputs) {
      if (!outputIds.has(id)) fail('EVALUATOR_CAPABILITY_OUTPUT', `${capability.id} names unknown output ${id}`);
      if (outputOwners.has(id)) fail('EVALUATOR_CAPABILITY_OVERLAP', `${id} is owned by multiple capabilities`);
      outputOwners.set(id, capability.id);
    }
  }
  if (outputOwners.size !== outputs.length) fail('EVALUATOR_OUTPUT_UNUSED', 'every output requires one capability owner');

  if (!Array.isArray(input.artifacts)) fail('EVALUATOR_ARTIFACT_COUNT', 'artifacts must be an array');
  const artifacts = input.artifacts.map(normalizeArtifact).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(artifacts, 'id', 'EVALUATOR_ARTIFACT_DUPLICATE', 'artifact');
  const mutableState = normalizeMutableState(input.mutableState);
  if (mutableState.kind === 'none' && artifacts.some(({ mutability }) => mutability === 'selected-mutable')) fail('EVALUATOR_STATE_RESIDUE', 'mutable artifact requires selected mutableState semantics');
  const request = normalizeRequest(input.request, capabilityIds);
  const batching = normalizeBatching(input.batching);
  if (!Array.isArray(input.workspaces)) fail('EVALUATOR_WORKSPACE_COUNT', 'workspaces must be an array');
  const workspaces = input.workspaces.map(normalizeWorkspace).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(workspaces, 'id', 'EVALUATOR_WORKSPACE_DUPLICATE', 'workspace');
  if (batching.continuation.kind === 'bounded' && !workspaces.some(({ scope }) => scope === 'per-continuation')) fail('EVALUATOR_CONTINUATION_WORKSPACE', 'bounded continuation requires per-continuation workspace');
  if (batching.continuation.kind === 'none' && workspaces.some(({ scope }) => scope === 'per-continuation')) fail('EVALUATOR_CONTINUATION_RESIDUE', 'continuation workspace exists without continuation');

  if (!Array.isArray(input.publications)) fail('EVALUATOR_PUBLICATION_COUNT', 'publications must be an array');
  const publications = input.publications.map((entry, index) => normalizePublication(entry, index, capabilityIds)).sort((left, right) => compareRaw(left.capability, right.capability));
  uniqueBy(publications, 'capability', 'EVALUATOR_PUBLICATION_DUPLICATE', 'capability publication');
  if (publications.length !== capabilities.length) fail('EVALUATOR_PUBLICATION_COVERAGE', 'every capability requires one publication');
  for (const capability of capabilities) {
    const independentOutputs = outputs.filter(({ id }) => capability.outputs.includes(id)).every(({ completeness }) => completeness === 'independent-capability');
    if (capability.independentPublication !== independentOutputs) fail('EVALUATOR_PUBLICATION_COMPLETENESS', `${capability.id} publication independence differs from outputs`);
  }

  const selectedInputKeyFacts = new Set(inputs.flatMap(({ keyFacts }) => keyFacts));
  if (artifacts.length > 0) selectedInputKeyFacts.add('artifact-generation');
  if (mutableState.kind === 'selected') selectedInputKeyFacts.add('state-generation');
  if (batching.semantics === 'batch-sensitive') selectedInputKeyFacts.add('batch-context');
  const cache = normalizeCache(input.cache, selectedInputKeyFacts, mutableState);
  const execution = normalizeExecution(input.execution);
  const lifecycle = normalizeLifecycle(input.lifecycle);
  const maximumInputRandomness = inputs.reduce((maximum, entry) => compareDecimalUint(entry.maxRandomInputs, maximum) > 0 ? entry.maxRandomInputs : maximum, '0');
  const requiredExecutionRandomness = compareDecimalUint(maximumInputRandomness, batching.randomness.maxInputs) > 0 ? maximumInputRandomness : batching.randomness.maxInputs;
  if (compareDecimalUint(requiredExecutionRandomness, execution.bounds.maxRandomInputs) > 0) fail('EVALUATOR_EXECUTION_RANDOMNESS', 'execution randomness bound is below selected input/batch requirements');

  if (!Array.isArray(input.statuses)) fail('EVALUATOR_STATUS_COUNT', 'statuses must be an array');
  const statuses = input.statuses.map(normalizeStatus).sort((left, right) => compareRaw(left.code, right.code));
  uniqueBy(statuses, 'code', 'EVALUATOR_STATUS_DUPLICATE', 'status');
  const statusCodes = new Set(statuses.map(({ code }) => code));
  for (const required of STATUS_CODES) if (!statusCodes.has(required)) fail('EVALUATOR_STATUS_REQUIRED', `required status ${required} is absent`);
  const statusByCode = new Map(statuses.map((status) => [status.code, status]));
  for (const [code, expectedClass] of [['evaluator-absent', 'normal'], ['evaluator-batch-pending', 'pending'], ['evaluator-request-capacity', 'pressure'], ['evaluator-cancelled', 'cancellation'], ['evaluator-internal-failure', 'fatal']]) {
    if (statusByCode.get(code).class !== expectedClass) fail('EVALUATOR_STATUS_CLASS', `${code} must be classified ${expectedClass}`);
  }
  if (cache.kind === 'selected' && !statusCodes.has(cache.pressureStatus)) fail('EVALUATOR_CACHE_STATUS', 'cache pressureStatus is undeclared');

  if (!Array.isArray(input.ports)) fail('EVALUATOR_PORT_COUNT', 'ports must be an array');
  const ports = input.ports.map((entry, index) => normalizePort(entry, index, statusCodes)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(ports, 'id', 'EVALUATOR_PORT_DUPLICATE', 'port');
  const portIds = new Set(ports.map(({ id }) => id));
  for (const required of BASE_PORTS) if (!portIds.has(required)) fail('EVALUATOR_PORT_REQUIRED', `required port ${required} is absent`);
  for (const id of CACHE_PORTS) if (portIds.has(id) !== (cache.kind === 'selected')) fail('EVALUATOR_CACHE_RESIDUE', `${id} presence differs from cache selection`);
  for (const id of RESUME_PORTS) if (portIds.has(id) !== (batching.continuation.kind === 'bounded')) fail('EVALUATOR_CONTINUATION_RESIDUE', `${id} presence differs from continuation selection`);

  if (!Array.isArray(input.resources)) fail('EVALUATOR_RESOURCE_COUNT', 'resources must be an array');
  const resources = input.resources.map((entry, index) => normalizeResource(entry, index, statusCodes)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(resources, 'id', 'EVALUATOR_RESOURCE_DUPLICATE', 'resource');
  const resourceClasses = new Set(resources.map(({ class: resourceClass }) => resourceClass));
  for (const required of ['input', 'request', 'queue', 'batch', 'result', 'waiter', 'diagnostic']) if (!resourceClasses.has(required)) fail('EVALUATOR_RESOURCE_REQUIRED', `resource plan omits ${required}`);
  if (resourceClasses.has('artifact') !== (artifacts.length > 0)) fail('EVALUATOR_ARTIFACT_RESIDUE', 'artifact resource presence differs from selection');
  if (resourceClasses.has('state') !== (mutableState.kind === 'selected')) fail('EVALUATOR_STATE_RESIDUE', 'state resource presence differs from selection');
  if (resourceClasses.has('workspace') !== (workspaces.length > 0)) fail('EVALUATOR_WORKSPACE_RESIDUE', 'workspace resource presence differs from selection');
  if (resourceClasses.has('continuation') !== (batching.continuation.kind === 'bounded')) fail('EVALUATOR_CONTINUATION_RESIDUE', 'continuation resource presence differs from selection');
  if (resourceClasses.has('cache') !== (cache.kind === 'selected')) fail('EVALUATOR_CACHE_RESIDUE', 'cache resource presence differs from selection');
  const randomnessSelected = inputs.some(({ maxRandomInputs }) => maxRandomInputs !== '0') || batching.randomness.maxInputs !== '0' || execution.bounds.maxRandomInputs !== '0' || ports.some(({ bounds }) => bounds.maxRandomInputs !== '0');
  if (resourceClasses.has('randomness') !== randomnessSelected) fail('EVALUATOR_RANDOMNESS_RESIDUE', 'randomness resource presence differs from selected bounds');

  const expectedCleanupClasses = new Set([
    'input-lease', 'request', 'waiter', 'batch', 'result', 'diagnostic',
    ...(artifacts.length > 0 ? ['artifact-reference'] : []),
    ...(workspaces.length > 0 ? ['workspace'] : []),
    ...(batching.continuation.kind === 'bounded' ? ['continuation'] : []),
    ...(cache.kind === 'selected' ? ['cache-entry'] : []),
    ...(mutableState.kind === 'selected' ? ['mutable-state'] : []),
  ]);
  const cleanup = normalizeCleanup(input.cleanup, expectedCleanupClasses);

  if (!Array.isArray(input.reuse)) fail('EVALUATOR_REUSE_COUNT', 'reuse must be an array');
  const reuse = input.reuse.map(normalizeReuse).sort((left, right) => compareRaw(left.classId, right.classId));
  uniqueBy(reuse, 'classId', 'EVALUATOR_REUSE_DUPLICATE', 'reuse class');
  const requiredReuse = new Set(['evaluator.request', 'evaluator.result', ...artifacts.map(({ id }) => id), ...(mutableState.kind === 'selected' ? [mutableState.id] : []), ...(cache.kind === 'selected' ? ['evaluator.cache'] : [])]);
  if (reuse.length !== requiredReuse.size || [...requiredReuse].some((id) => !reuse.some(({ classId }) => classId === id))) fail('EVALUATOR_REUSE_COVERAGE', 'reuse does not classify every persistent evaluator class');

  if (mode === 'proposal-only' && capabilities.some(({ kind }) => kind !== 'proposal')) fail('EVALUATOR_MODE_RESIDUE', 'proposal-only profile retains evaluation capability');
  if (mode === 'evaluation-only' && capabilities.some(({ kind }) => kind === 'proposal')) fail('EVALUATOR_MODE_RESIDUE', 'evaluation-only profile retains proposal capability');
  if (cache.kind === 'none' && (selectedInputKeyFacts.has('state-generation') && mutableState.kind === 'none')) fail('EVALUATOR_STATE_RESIDUE', 'state-generation key exists without mutable state');
  if (artifacts.length === 0 && inputs.some(({ keyFacts }) => keyFacts.includes('artifact-generation'))) fail('EVALUATOR_ARTIFACT_RESIDUE', 'artifact-free profile retains artifact key fact');
  if (mutableState.kind === 'none' && inputs.some(({ keyFacts }) => keyFacts.includes('state-generation'))) fail('EVALUATOR_STATE_RESIDUE', 'immutable profile retains state-generation key fact');
  if (batching.semantics === 'batch-independent' && inputs.some(({ keyFacts }) => keyFacts.includes('batch-context'))) fail('EVALUATOR_BATCH_RESIDUE', 'batch-independent profile retains batch-context key fact');

  if (!Array.isArray(input.productData)) fail('EVALUATOR_PRODUCT_COUNT', 'productData must be an array');
  const productData = input.productData.map(normalizeProductData).sort((left, right) => compareRaw(left.ownerContract.id, right.ownerContract.id));
  uniqueBy(productData.map((entry) => ({ id: entry.ownerContract.id })), 'id', 'EVALUATOR_PRODUCT_DUPLICATE', 'product data owner');
  const programContribution = normalizeProgram(input.programContribution);
  const requiredProgramInputs = new Map([[domainProfile.id, domainProfile], [graphProfile.id, graphProfile]]);
  const actualProgramInputs = new Map(programContribution.inputs.map((profile) => [profile.id, profile]));
  if (requiredProgramInputs.size !== actualProgramInputs.size || [...requiredProgramInputs].some(([id, profile]) => profileKey(actualProgramInputs.get(id)) !== profileKey(profile))) fail('EVALUATOR_PROGRAM_INPUTS', 'program inputs differ from selected semantic dependencies');

  const normalized = {
    schema: input.schema, representation: input.representation, status: input.status, contract, policyContract,
    id: input.id, version: input.version, mode, domainProfile, graphProfile, capabilities, inputs, outputs, artifacts,
    mutableState, request, batching, workspaces, publications, cache, execution, lifecycle, cleanup, ports, resources, statuses, reuse,
    diagnostics: normalizeDiagnostics(input.diagnostics), compatibility: normalizeCompatibility(input.compatibility),
    programContribution, productData,
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}

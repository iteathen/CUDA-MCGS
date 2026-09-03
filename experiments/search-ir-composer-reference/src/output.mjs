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

const OUTPUT_SCHEMA = 'cuda-mcgs.output-profile/0.2.0';
const REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const OUTPUT_CONTRACT = 'SPEC-0013';
const COMPLETION_CLASSES = ['complete', 'valid-partial', 'no-valid-result', 'failed'];
const ENVELOPE_FIELDS = [
  'search-identity', 'session-identity', 'search-incarnation', 'profile-identity', 'completion-class', 'first-stop-cause', 'completed-work',
  'policy-budget-status', 'resource-status', 'diagnostic-identity',
];
const PUBLICATION_STATES = ['vacant', 'reserved', 'capturing', 'publishing', 'ready', 'released', 'retired', 'reusable'];
const REQUIRED_STATUSES = new Map([
  ['invalid-output-profile', 'fatal'], ['unsupported-output-schema', 'fatal'], ['output-source-unavailable', 'pending'], ['output-source-stale', 'pending'],
  ['output-capacity', 'pressure'], ['output-terminal-capacity', 'fatal'], ['output-capture-inconsistent', 'fatal'], ['output-payload-invalid', 'fatal'],
  ['output-slot-stale', 'pending'], ['output-borrow-capacity', 'pressure'], ['output-observation-dropped', 'drop'], ['output-generation-exhausted', 'stop'],
  ['output-cancelled', 'cancellation'], ['output-internal-failure', 'fatal'],
]);
const MANDATORY_PORTS = ['initialize-output-profile', 'classify-terminal-result', 'capture-terminal-payload', 'publish-output', 'fail-output', 'acquire-output', 'release-output', 'classify-output-reuse'];
const LIVE_PORTS = ['admit-observation-request', 'capture-observation', 'resume-observation'];
const BASE_CLEANUP = ['terminal-slot', 'terminal-payload', 'source-protection', 'borrow', 'transfer', 'diagnostic', 'program-artifact'];
const LIVE_CLEANUP = ['observation-request', 'observation-slot', 'observation-payload', 'sequence', 'continuation'];
const PERSISTENCE_CLEANUP = ['persisted-artifact'];
const REQUIRED_FRESHNESS = [
  'cuda-mcgs.output.freshness.search-incarnation',
  'cuda-mcgs.output.freshness.session-root-work-epoch',
  'cuda-mcgs.output.freshness.observation-sequence',
  'cuda-mcgs.output.freshness.source-version',
  'cuda-mcgs.output.freshness.consistency-class',
  'cuda-mcgs.output.freshness.source-disposition',
  'cuda-mcgs.output.freshness.loss-accounting',
];
const BASE_COUNTERS = ['capturing', 'publishing', 'ready', 'borrowed', 'failed', 'released', 'high-water'];
const LIVE_COUNTERS = ['requested', 'admitted', 'dropped', 'coalesced'];
const BASE_DISPOSITIONS = ['terminal-slot', 'borrow', 'transfer'];
const LIVE_DISPOSITIONS = ['observation-request', 'observation-slot', 'sequence'];
const PORT_PHASES = new Map([
  ['initialize-output-profile', 'host-preignition'],
  ['classify-terminal-result', 'device-active'],
  ['capture-terminal-payload', 'device-active'],
  ['publish-output', 'device-active'],
  ['fail-output', 'device-active'],
  ['acquire-output', 'host-async'],
  ['release-output', 'host-async'],
  ['classify-output-reuse', 'device-active'],
  ['admit-observation-request', 'device-active'],
  ['capture-observation', 'device-active'],
  ['resume-observation', 'device-active'],
]);

function assertEnum(value, allowed, code, label) {
  if (!allowed.includes(value)) fail(code, `${label} is invalid`);
  return value;
}

function positiveDecimal(value, code, label) {
  const result = normalizeDecimalUint(value, label);
  if (result === '0') fail(code, `${label} must be positive`);
  return result;
}

function namespacedSet(input, code, label, minimum = 0) {
  if (!Array.isArray(input) || input.length < minimum) fail(code, `${label} must contain at least ${minimum} item(s)`);
  const result = input.map((value, index) => (assertNamespacedId(value, code, `${label} ${index}`), value));
  if (new Set(result).size !== result.length) fail(code, `${label} contains a duplicate`);
  return result.sort(compareRaw);
}

function namespacedSequence(input, code, label, minimum = 0) {
  if (!Array.isArray(input) || input.length < minimum) fail(code, `${label} must contain at least ${minimum} item(s)`);
  const result = input.map((value, index) => (assertNamespacedId(value, code, `${label} ${index}`), value));
  if (new Set(result).size !== result.length) fail(code, `${label} contains a duplicate`);
  return result;
}

function enumSet(input, allowed, code, label, minimum = 0) {
  if (!Array.isArray(input) || input.length < minimum) fail(code, `${label} must contain at least ${minimum} item(s)`);
  const result = input.map((value, index) => assertEnum(value, allowed, code, `${label} ${index}`));
  if (new Set(result).size !== result.length) fail(code, `${label} contains a duplicate`);
  return result.sort(compareRaw);
}

function statusSet(input, code, label, minimum = 0) {
  if (!Array.isArray(input) || input.length < minimum) fail(code, `${label} must contain at least ${minimum} item(s)`);
  const result = input.map((value, index) => (assertString(value, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, code, `${label} ${index}`), value));
  if (new Set(result).size !== result.length) fail(code, `${label} contains a duplicate`);
  return result.sort(compareRaw);
}

function schemaKey(reference) { return `${reference.id}\0${reference.version}\0${reference.sha256}`; }
function profileKey(profile) { return `${profile.id}\0${schemaKey(profile.schema)}\0${profile.identity.sha256}`; }
function contractKey(contract) {
  return contract.kind === 'catalog'
    ? `${contract.kind}\0${contract.id}\0${contract.specificationIdentity}\0${contract.sha256}`
    : `${contract.kind}\0${contract.id}\0${contract.version}\0${contract.schema}\0${contract.sha256}`;
}

function normalizeProfileReference(input, label) {
  exactKeys(input, ['id', 'schema', 'identity'], 'OUTPUT_PROFILE_REFERENCE_FIELDS', label);
  assertNamespacedId(input.id, 'OUTPUT_PROFILE_REFERENCE_ID', `${label} id`);
  return { id: input.id, schema: normalizeSchemaReference(input.schema, `${label} schema`), identity: normalizeContentIdentity(input.identity, 'OUTPUT_PROFILE_REFERENCE_IDENTITY', `${label} identity`) };
}

function normalizeContract(input, catalogById, label) {
  if (input?.kind === 'catalog') {
    exactKeys(input, ['kind', 'id', 'specificationIdentity', 'sha256'], 'OUTPUT_CONTRACT_FIELDS', label);
    assertString(input.id, /^SPEC-[0-9]{4}$/, 'OUTPUT_CONTRACT_ID', `${label} id`);
    assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\.[0-9]+\.[0-9]+$/, 'OUTPUT_CONTRACT_ID', `${label} identity`);
    assertSha256(input.sha256, 'OUTPUT_CONTRACT_DIGEST', `${label} sha256`);
    const expected = catalogById.get(input.id);
    if (!expected || expected.specificationIdentity !== input.specificationIdentity || expected.sha256 !== input.sha256) fail('OUTPUT_CONTRACT_DRIFT', `${label} differs from frozen catalog`);
    return { ...input };
  }
  exactKeys(input, ['kind', 'id', 'version', 'schema', 'sha256'], 'OUTPUT_CONTRACT_FIELDS', label);
  if (input.kind !== 'namespaced') fail('OUTPUT_CONTRACT_KIND', `${label} kind is invalid`);
  assertNamespacedId(input.id, 'OUTPUT_CONTRACT_ID', `${label} id`); assertVersion(input.version, 'OUTPUT_CONTRACT_VERSION', `${label} version`);
  assertString(input.schema, /^[a-z][a-z0-9.-]+\/[0-9]+\.[0-9]+\.[0-9]+$/, 'OUTPUT_CONTRACT_SCHEMA', `${label} schema`); assertSha256(input.sha256, 'OUTPUT_CONTRACT_DIGEST', `${label} sha256`);
  if (!input.schema.endsWith(`/${input.version}`)) fail('OUTPUT_CONTRACT_VERSION', `${label} schema/version differ`);
  return { ...input };
}

function normalizeContributor(input, index, catalogById, exactContributors, readinessByOwner) {
  exactKeys(input, ['id', 'contract', 'profile', 'optional', 'sourceFacts', 'cleanup'], 'OUTPUT_CONTRIBUTOR_FIELDS', `contributor ${index}`);
  assertNamespacedId(input.id, 'OUTPUT_CONTRIBUTOR_ID', `contributor ${index} id`);
  if (typeof input.optional !== 'boolean') fail('OUTPUT_CONTRIBUTOR_OPTIONAL', `${input.id} optional must be boolean`);
  const contract = normalizeContract(input.contract, catalogById, `${input.id} contract`);
  const profile = normalizeProfileReference(input.profile, `${input.id} profile`);
  const expected = exactContributors.get(input.id);
  if (!expected || input.optional !== expected.optional || profileKey(profile) !== profileKey(expected.profile) || contractKey(contract) !== contractKey(expected.contract)) fail('OUTPUT_CONTRIBUTOR_PROFILE', `${input.id} differs from selected progress owner`);
  if (!Array.isArray(input.sourceFacts) || input.sourceFacts.length === 0) fail('OUTPUT_CONTRIBUTOR_FACT', `${input.id} sourceFacts must not be empty`);
  const expectedReadiness = readinessByOwner.get(input.id);
  const sourceFacts = input.sourceFacts.map((entry, factIndex) => {
    exactKeys(entry, ['fact', 'readiness'], 'OUTPUT_SOURCE_FACT_FIELDS', `${input.id} source fact ${factIndex}`);
    const fact = normalizeSchemaReference(entry.fact, `${input.id} source fact ${factIndex}`);
    const readiness = assertEnum(entry.readiness, ['ready', 'terminal-ready', 'external-control'], 'OUTPUT_SOURCE_FACT_READINESS', `${input.id} source fact ${factIndex} readiness`);
    if (expectedReadiness?.get(schemaKey(fact)) !== readiness) fail('OUTPUT_CONTRIBUTOR_FACT', `${input.id} source fact readiness differs from progress plan`);
    return { fact, readiness };
  }).sort((left, right) => compareRaw(schemaKey(left.fact), schemaKey(right.fact)));
  if (new Set(sourceFacts.map(({ fact }) => schemaKey(fact))).size !== sourceFacts.length || sourceFacts.some(({ fact }) => !expected.publicTransitions.some((candidate) => schemaKey(candidate) === schemaKey(fact)))) fail('OUTPUT_CONTRIBUTOR_FACT', `${input.id} sourceFacts are not exact public progress transitions`);
  return { id: input.id, contract, profile, optional: input.optional, sourceFacts, cleanup: normalizeSchemaReference(input.cleanup, `${input.id} cleanup`) };
}

function normalizeBounds(input, label) {
  exactKeys(input, ['maxBytes', 'maxElements', 'maxDepth', 'maxReads', 'maxWrites', 'maxWorkUnits', 'maxContinuations', 'cancellationObservationWorkUnits', 'counterMaximum'], 'OUTPUT_BOUNDS_FIELDS', label);
  const result = {};
  for (const key of Object.keys(input)) result[key] = key === 'maxContinuations' ? normalizeDecimalUint(input[key], `${label} ${key}`) : positiveDecimal(input[key], 'OUTPUT_BOUNDS_RANGE', `${label} ${key}`);
  if (compareDecimalUint(result.cancellationObservationWorkUnits, result.maxWorkUnits) > 0) fail('OUTPUT_BOUNDS_CANCELLATION', `${label} cancellation observation exceeds work bound`);
  if (compareDecimalUint(result.maxElements, result.counterMaximum) > 0) fail('OUTPUT_BOUNDS_COUNTER', `${label} element count exceeds counter range`);
  return result;
}

function normalizeEnvelope(input, reserveById) {
  exactKeys(input, ['schema', 'fields', 'completionClasses', 'maxBytes', 'terminalReserve', 'emptyPayloadValid', 'firstCauseImmutable'], 'OUTPUT_ENVELOPE_FIELDS', 'terminalEnvelope');
  const fields = enumSet(input.fields, ENVELOPE_FIELDS, 'OUTPUT_ENVELOPE_FIELD', 'terminal envelope fields', ENVELOPE_FIELDS.length);
  const completionClasses = enumSet(input.completionClasses, COMPLETION_CLASSES, 'OUTPUT_COMPLETION_CLASS', 'completion classes', COMPLETION_CLASSES.length);
  if (fields.length !== ENVELOPE_FIELDS.length || completionClasses.length !== COMPLETION_CLASSES.length || input.emptyPayloadValid !== true || input.firstCauseImmutable !== true) fail('OUTPUT_ENVELOPE_CONTRACT', 'terminal envelope is incomplete');
  if (reserveById.get(input.terminalReserve)?.purpose !== 'terminal-result') fail('OUTPUT_TERMINAL_RESERVE', 'terminal envelope lacks protected terminal-result reserve');
  return { schema: normalizeSchemaReference(input.schema, 'terminal envelope schema'), fields, completionClasses, maxBytes: positiveDecimal(input.maxBytes, 'OUTPUT_ENVELOPE_RANGE', 'terminal envelope maxBytes'), terminalReserve: input.terminalReserve, emptyPayloadValid: true, firstCauseImmutable: true };
}

function normalizeOutputSchema(input, index) {
  exactKeys(input, ['id', 'version', 'kind', 'fieldOrder', 'maxBytes', 'maxElements', 'maxDepth', 'encoding', 'usedLength', 'serialization', 'consistency', 'overflow', 'compatibility'], 'OUTPUT_SCHEMA_FIELDS', `output schema ${index}`);
  assertNamespacedId(input.id, 'OUTPUT_SCHEMA_ID', `output schema ${index} id`); assertVersion(input.version, 'OUTPUT_SCHEMA_VERSION', `${input.id} version`);
  const fieldOrder = namespacedSequence(input.fieldOrder, 'OUTPUT_SCHEMA_FIELD', `${input.id} fieldOrder`);
  return {
    id: input.id, version: input.version, kind: assertEnum(input.kind, ['terminal', 'live', 'product'], 'OUTPUT_SCHEMA_KIND', `${input.id} kind`), fieldOrder,
    maxBytes: positiveDecimal(input.maxBytes, 'OUTPUT_SCHEMA_RANGE', `${input.id} maxBytes`), maxElements: positiveDecimal(input.maxElements, 'OUTPUT_SCHEMA_RANGE', `${input.id} maxElements`),
    maxDepth: positiveDecimal(input.maxDepth, 'OUTPUT_SCHEMA_RANGE', `${input.id} maxDepth`), encoding: normalizeSchemaReference(input.encoding, `${input.id} encoding`), usedLength: normalizeSchemaReference(input.usedLength, `${input.id} usedLength`),
    serialization: normalizeSerialization(input.serialization, `${input.id} serialization`),
    consistency: assertEnum(input.consistency, ['terminal-quiescent', 'atomic-cut', 'versioned-cut', 'independently-versioned', 'namespaced-stronger'], 'OUTPUT_SCHEMA_CONSISTENCY', `${input.id} consistency`),
    overflow: assertEnum(input.overflow, ['fail', 'omit', 'valid-partial', 'bounded-retry', 'explicit-valid-truncate'], 'OUTPUT_SCHEMA_OVERFLOW', `${input.id} overflow`),
    compatibility: normalizeContentIdentity(input.compatibility, 'OUTPUT_SCHEMA_COMPATIBILITY', `${input.id} compatibility`),
  };
}

function normalizeSerialization(input, label) {
  exactKeys(input, ['byteOrder', 'alignment', 'integrity', 'invalidValues'], 'OUTPUT_SERIALIZATION_FIELDS', label);
  if (input.alignment !== 'logical-alignment-independent') fail('OUTPUT_SERIALIZATION_ALIGNMENT', `${label} exposes physical alignment`);
  return {
    byteOrder: assertEnum(input.byteOrder, ['logical-little-endian', 'logical-big-endian', 'namespaced'], 'OUTPUT_SERIALIZATION_BYTE_ORDER', `${label} byteOrder`),
    alignment: input.alignment,
    integrity: normalizeSchemaReference(input.integrity, `${label} integrity`),
    invalidValues: normalizeSchemaReference(input.invalidValues, `${label} invalidValues`),
  };
}

function normalizeProjection(input, label) {
  exactKeys(input, ['kind', 'formula', 'readOnly', 'bounded', 'sourceMutation'], 'OUTPUT_PROJECTION_FIELDS', label);
  if (input.readOnly !== true || input.bounded !== true || input.sourceMutation !== 'prohibited') fail('OUTPUT_PROJECTION_AUTHORITY', `${label} must be bounded read-only`);
  return { kind: assertEnum(input.kind, ['copy', 'canonicalize', 'filter', 'derive'], 'OUTPUT_PROJECTION_KIND', `${label} kind`), formula: normalizeSchemaReference(input.formula, `${label} formula`), readOnly: true, bounded: true, sourceMutation: input.sourceMutation };
}

function normalizeField(input, index, contributorById, schemaById) {
  exactKeys(input, ['id', 'schema', 'owner', 'sourceFact', 'sourcePort', 'semanticRole', 'dataType', 'shape', 'unit', 'perspective', 'precision', 'encoding', 'validity', 'presence', 'unavailable', 'failure', 'projection', 'bounds', 'order', 'permission', 'compatibility'], 'OUTPUT_FIELD_FIELDS', `field ${index}`);
  assertNamespacedId(input.id, 'OUTPUT_FIELD_ID', `field ${index} id`); assertNamespacedId(input.schema, 'OUTPUT_FIELD_SCHEMA', `${input.id} schema`);
  const owner = contributorById.get(input.owner); if (!owner) fail('OUTPUT_FIELD_OWNER', `${input.id} owner is unknown`);
  const sourceFact = normalizeSchemaReference(input.sourceFact, `${input.id} sourceFact`);
  const source = owner.sourceFacts.find(({ fact }) => schemaKey(fact) === schemaKey(sourceFact));
  if (!source) fail('OUTPUT_FIELD_SOURCE', `${input.id} source fact is not owner-public`);
  const sourcePort = normalizeSchemaReference(input.sourcePort, `${input.id} sourcePort`);
  if (!owner.sourceFacts.some(({ fact }) => schemaKey(fact) === schemaKey(sourcePort))) fail('OUTPUT_FIELD_SOURCE', `${input.id} source port is not an exact owner-public transition`);
  const semanticRole = assertEnum(input.semanticRole, ['domain-outcome', 'policy-summary', 'evaluation-summary', 'graph-summary', 'resource-summary', 'progress-summary', 'diagnostic', 'custom', 'ranking'], 'OUTPUT_FIELD_ROLE', `${input.id} semanticRole`);
  if (semanticRole === 'ranking' && !['SPEC-0008'].includes(owner.contract.id) && owner.contract.kind !== 'namespaced') fail('OUTPUT_FIELD_RANKING', `${input.id} ranking lacks policy/product owner`);
  if (!Array.isArray(input.shape)) fail('OUTPUT_FIELD_SHAPE', `${input.id} shape must be an array`);
  const shape = input.shape.map((value, shapeIndex) => positiveDecimal(value, 'OUTPUT_FIELD_SHAPE', `${input.id} shape ${shapeIndex}`));
  const nullableReference = (value, label) => value === null ? null : normalizeSchemaReference(value, label);
  const result = {
    id: input.id, schema: input.schema, owner: owner.id, sourceFact, sourcePort, semanticRole,
    dataType: assertEnum(input.dataType, ['boolean', 'decimal-uint', 'integer', 'float', 'bytes', 'string', 'record', 'sequence', 'vector', 'distribution', 'proof', 'custom'], 'OUTPUT_FIELD_TYPE', `${input.id} dataType`), shape,
    unit: nullableReference(input.unit, `${input.id} unit`), perspective: nullableReference(input.perspective, `${input.id} perspective`), precision: normalizeSchemaReference(input.precision, `${input.id} precision`),
    encoding: normalizeSchemaReference(input.encoding, `${input.id} encoding`), validity: normalizeSchemaReference(input.validity, `${input.id} validity`), presence: assertEnum(input.presence, ['required', 'optional'], 'OUTPUT_FIELD_PRESENCE', `${input.id} presence`),
    unavailable: assertEnum(input.unavailable, ['omit-with-cause', 'explicit-unavailable', 'valid-partial', 'fail'], 'OUTPUT_FIELD_UNAVAILABLE', `${input.id} unavailable`), failure: normalizeSchemaReference(input.failure, `${input.id} failure`),
    projection: normalizeProjection(input.projection, `${input.id} projection`), bounds: normalizeBounds(input.bounds, `${input.id} bounds`), order: normalizeDecimalUint(input.order, `${input.id} order`),
    permission: normalizeSchemaReference(input.permission, `${input.id} permission`), compatibility: normalizeContentIdentity(input.compatibility, 'OUTPUT_FIELD_COMPATIBILITY', `${input.id} compatibility`),
  };
  if (!schemaById.has(result.schema)) fail('OUTPUT_FIELD_SCHEMA', `${input.id} names unknown schema`);
  const selectedSchema = schemaById.get(result.schema);
  if (selectedSchema.kind === 'terminal' && source.readiness !== 'terminal-ready') fail('OUTPUT_FIELD_READINESS', `${input.id} terminal source is not terminal-ready`);
  if (selectedSchema.kind === 'product' && owner.contract.kind !== 'namespaced') fail('OUTPUT_FIELD_PRODUCT_OWNER', `${input.id} product field lacks namespaced owner`);
  return result;
}

function normalizeTerminal(input, terminalSchema, envelope, outputClasses, reserveById) {
  exactKeys(input, ['schema', 'cut', 'sourceDisposition', 'capture', 'publication', 'immutability', 'borrow', 'asyncRead', 'sessionRequired', 'cleanup'], 'OUTPUT_TERMINAL_FIELDS', 'terminal');
  if (input.schema !== terminalSchema.id || input.cut !== 'terminal-quiescent' || input.sourceDisposition !== 'ready-absent-failed-explicit' || input.publication !== 'exactly-once' || input.immutability !== true || input.sessionRequired !== false) fail('OUTPUT_TERMINAL_CONTRACT', 'terminal contract is incomplete');
  const terminalClass = outputClasses.find(({ id }) => id.endsWith('class-terminal-envelope'));
  const terminalReserve = reserveById.get(envelope.terminalReserve);
  const capture = normalizeBounds(input.capture, 'terminal capture');
  if (!terminalClass || !terminalReserve || terminalReserve.class !== terminalClass.id) fail('OUTPUT_TERMINAL_CAPACITY', 'terminal class/reserve ownership differs');
  if (compareDecimalUint(capture.maxBytes, envelope.maxBytes) > 0 || compareDecimalUint(envelope.maxBytes, terminalReserve.maximum) > 0) fail('OUTPUT_TERMINAL_CAPACITY', 'terminal capture/envelope exceeds protected reserve');
  return {
    schema: input.schema, cut: input.cut, sourceDisposition: input.sourceDisposition, capture, publication: input.publication, immutability: true,
    borrow: normalizeSchemaReference(input.borrow, 'terminal borrow'), asyncRead: normalizeSchemaReference(input.asyncRead, 'terminal asyncRead'), sessionRequired: false, cleanup: normalizeSchemaReference(input.cleanup, 'terminal cleanup'),
  };
}

function normalizeObservation(input, index, schemaById, contributorById, outputClassById, terminalClassId) {
  exactKeys(input, ['id', 'version', 'schemas', 'triggers', 'consistency', 'maxRequests', 'maxSlots', 'maxSequence', 'maxBorrows', 'maxTransfers', 'cadence', 'pressure', 'freshness', 'request', 'readOnly', 'hostProgress', 'resources', 'cleanup'], 'OUTPUT_OBSERVATION_FIELDS', `observation ${index}`);
  assertNamespacedId(input.id, 'OUTPUT_OBSERVATION_ID', `observation ${index} id`); assertVersion(input.version, 'OUTPUT_OBSERVATION_VERSION', `${input.id} version`);
  const schemas = namespacedSet(input.schemas, 'OUTPUT_OBSERVATION_SCHEMA', `${input.id} schemas`, 1);
  if (schemas.some((id) => schemaById.get(id)?.kind !== 'live')) fail('OUTPUT_OBSERVATION_SCHEMA', `${input.id} names non-live schema`);
  const triggers = enumSet(input.triggers, ['periodic-device', 'external-bounded', 'ready-event'], 'OUTPUT_OBSERVATION_TRIGGER', `${input.id} triggers`, 1);
  if (triggers.includes('external-bounded') && ![...contributorById.values()].some(({ contract }) => contract.id === 'SPEC-0006')) fail('OUTPUT_OBSERVATION_SESSION', `${input.id} external trigger requires selected session`);
  const resources = namespacedSet(input.resources, 'OUTPUT_OBSERVATION_RESOURCE', `${input.id} resources`, 1);
  if (resources.includes(terminalClassId) || resources.some((id) => !outputClassById.has(id) || !id.endsWith('class-live-observation'))) fail('OUTPUT_OBSERVATION_RESOURCE', `${input.id} consumes terminal/working/foreign capacity`);
  if (input.readOnly !== true || input.hostProgress !== 'none') fail('OUTPUT_OBSERVATION_AUTHORITY', `${input.id} observation must be read-only and non-progressing`);
  exactKeys(input.pressure, ['kind', 'accounting', 'terminalEffect', 'searchEffect'], 'OUTPUT_PRESSURE_FIELDS', `${input.id} pressure`);
  if (input.pressure.terminalEffect !== 'none' || input.pressure.searchEffect !== 'none') fail('OUTPUT_PRESSURE_AUTHORITY', `${input.id} pressure changes terminal/search meaning`);
  exactKeys(input.request, ['identity', 'permission', 'validation', 'runtimeSchema'], 'OUTPUT_REQUEST_FIELDS', `${input.id} request`);
  if (input.request.runtimeSchema !== 'prohibited') fail('OUTPUT_REQUEST_SCHEMA', `${input.id} permits runtime schema`);
  const maxRequests = positiveDecimal(input.maxRequests, 'OUTPUT_OBSERVATION_RANGE', `${input.id} maxRequests`);
  const maxSlots = positiveDecimal(input.maxSlots, 'OUTPUT_OBSERVATION_RANGE', `${input.id} maxSlots`);
  const maxSequence = positiveDecimal(input.maxSequence, 'OUTPUT_OBSERVATION_RANGE', `${input.id} maxSequence`);
  const maxBorrows = positiveDecimal(input.maxBorrows, 'OUTPUT_OBSERVATION_RANGE', `${input.id} maxBorrows`);
  const maxTransfers = positiveDecimal(input.maxTransfers, 'OUTPUT_OBSERVATION_RANGE', `${input.id} maxTransfers`);
  const cadence = normalizeBounds(input.cadence, `${input.id} cadence`);
  const slotBytes = schemas.reduce((sum, id) => sum + BigInt(schemaById.get(id).maxBytes), 0n);
  const capacity = resources.reduce((sum, id) => sum + BigInt(outputClassById.get(id).formula.maximumUnits), 0n);
  if (slotBytes * BigInt(maxSlots) > capacity) fail('OUTPUT_OBSERVATION_CAPACITY', `${input.id} slots exceed admitted observation capacity`);
  if (compareDecimalUint(maxSequence, cadence.counterMaximum) > 0 || compareDecimalUint(maxRequests, cadence.counterMaximum) > 0) fail('OUTPUT_OBSERVATION_RANGE', `${input.id} request/sequence range exceeds counter range`);
  return {
    id: input.id, version: input.version, schemas, triggers,
    consistency: assertEnum(input.consistency, ['atomic-cut', 'versioned-cut', 'independently-versioned', 'namespaced-stronger'], 'OUTPUT_OBSERVATION_CONSISTENCY', `${input.id} consistency`),
    maxRequests, maxSlots, maxSequence, maxBorrows, maxTransfers, cadence,
    pressure: { kind: assertEnum(input.pressure.kind, ['drop-new', 'drop-oldest-unborrowed', 'latest-coalesce', 'reject', 'bounded-queue', 'namespaced'], 'OUTPUT_PRESSURE_KIND', `${input.id} pressure kind`), accounting: normalizeSchemaReference(input.pressure.accounting, `${input.id} pressure accounting`), terminalEffect: input.pressure.terminalEffect, searchEffect: input.pressure.searchEffect },
    freshness: (() => {
      const freshness = namespacedSet(input.freshness, 'OUTPUT_OBSERVATION_FRESHNESS', `${input.id} freshness`, REQUIRED_FRESHNESS.length);
      if (freshness.length !== REQUIRED_FRESHNESS.length || REQUIRED_FRESHNESS.some((entry) => !freshness.includes(entry))) fail('OUTPUT_OBSERVATION_FRESHNESS', `${input.id} freshness metadata is incomplete`);
      return freshness;
    })(),
    request: { identity: normalizeSchemaReference(input.request.identity, `${input.id} request identity`), permission: normalizeSchemaReference(input.request.permission, `${input.id} request permission`), validation: normalizeSchemaReference(input.request.validation, `${input.id} request validation`), runtimeSchema: input.request.runtimeSchema },
    readOnly: true, hostProgress: input.hostProgress, resources, cleanup: normalizeSchemaReference(input.cleanup, `${input.id} cleanup`),
  };
}

function normalizeObservations(input, schemaById, contributorById, outputClassById, terminalClassId) {
  if (input?.kind === 'absent') {
    exactKeys(input, ['kind'], 'OUTPUT_OBSERVATIONS_FIELDS', 'observations');
    if ([...schemaById.values()].some(({ kind }) => kind === 'live')) fail('OUTPUT_OBSERVATION_RESIDUE', 'absent observations retain live schema');
    return { kind: 'absent' };
  }
  exactKeys(input, ['kind', 'profiles'], 'OUTPUT_OBSERVATIONS_FIELDS', 'observations');
  if (input.kind !== 'selected' || !Array.isArray(input.profiles) || input.profiles.length === 0) fail('OUTPUT_OBSERVATIONS_KIND', 'selected observations require profiles');
  const profiles = input.profiles.map((entry, index) => normalizeObservation(entry, index, schemaById, contributorById, outputClassById, terminalClassId)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(profiles, 'id', 'OUTPUT_OBSERVATION_DUPLICATE', 'observation');
  const liveSchemas = [...schemaById.values()].filter(({ kind }) => kind === 'live').map(({ id }) => id);
  const assignedSchemas = profiles.flatMap(({ schemas }) => schemas);
  if (assignedSchemas.length !== liveSchemas.length || new Set(assignedSchemas).size !== liveSchemas.length || liveSchemas.some((id) => !assignedSchemas.includes(id))) fail('OUTPUT_OBSERVATION_COVERAGE', 'live schemas and observations must have exact one-to-one coverage');
  return { kind: 'selected', profiles };
}

function normalizeWorkspace(input, live, workingClass) {
  exactKeys(input, ['resource', 'scratchBytes', 'continuationBytes', 'diagnosticBytes', 'metadataBytes', 'maxBorrows', 'maxTransfers', 'counterMaximum', 'counters', 'accounting', 'generationExhaustion', 'hostSpill', 'cleanup'], 'OUTPUT_WORKSPACE_FIELDS', 'workspace');
  if (!workingClass || input.resource !== workingClass.id || workingClass.unit !== 'bytes') fail('OUTPUT_WORKSPACE_RESOURCE', 'workspace lacks its exact output-owned byte class');
  if (input.hostSpill !== 'none') fail('OUTPUT_WORKSPACE_SPILL', 'workspace permits hidden host spill');
  const scratchBytes = positiveDecimal(input.scratchBytes, 'OUTPUT_WORKSPACE_RANGE', 'workspace scratchBytes');
  const continuationBytes = positiveDecimal(input.continuationBytes, 'OUTPUT_WORKSPACE_RANGE', 'workspace continuationBytes');
  const diagnosticBytes = positiveDecimal(input.diagnosticBytes, 'OUTPUT_WORKSPACE_RANGE', 'workspace diagnosticBytes');
  const metadataBytes = positiveDecimal(input.metadataBytes, 'OUTPUT_WORKSPACE_RANGE', 'workspace metadataBytes');
  if ([scratchBytes, continuationBytes, diagnosticBytes, metadataBytes].reduce((sum, value) => sum + BigInt(value), 0n) > BigInt(workingClass.formula.maximumUnits)) fail('OUTPUT_WORKSPACE_CAPACITY', 'workspace components exceed admitted class capacity');
  const expectedCounters = [...BASE_COUNTERS, ...(live ? LIVE_COUNTERS : [])].sort(compareRaw);
  const counters = enumSet(input.counters, expectedCounters, 'OUTPUT_WORKSPACE_COUNTER', 'workspace counters', expectedCounters.length);
  if (counters.length !== expectedCounters.length) fail('OUTPUT_WORKSPACE_COUNTER', 'workspace counters differ from selected output state');
  return {
    resource: input.resource, scratchBytes, continuationBytes, diagnosticBytes, metadataBytes,
    maxBorrows: positiveDecimal(input.maxBorrows, 'OUTPUT_WORKSPACE_RANGE', 'workspace maxBorrows'),
    maxTransfers: positiveDecimal(input.maxTransfers, 'OUTPUT_WORKSPACE_RANGE', 'workspace maxTransfers'),
    counterMaximum: positiveDecimal(input.counterMaximum, 'OUTPUT_WORKSPACE_RANGE', 'workspace counterMaximum'),
    counters, accounting: normalizeSchemaReference(input.accounting, 'workspace accounting'),
    generationExhaustion: assertEnum(input.generationExhaustion, ['restart-incarnation', 'reject', 'typed-terminal-failure'], 'OUTPUT_WORKSPACE_GENERATION', 'workspace generationExhaustion'),
    hostSpill: input.hostSpill, cleanup: normalizeSchemaReference(input.cleanup, 'workspace cleanup'),
  };
}

function nullableSchemaReference(value, label) {
  return value === null ? null : normalizeSchemaReference(value, label);
}

function normalizeSnapshot(input, schemas) {
  exactKeys(input, ['terminalCut', 'atomicCommit', 'versionRelation', 'independentVersions', 'rootEpoch', 'sourceProtection', 'aggregation', 'sequenceValidation', 'invalidation'], 'OUTPUT_SNAPSHOT_FIELDS', 'snapshot');
  const result = {
    terminalCut: normalizeSchemaReference(input.terminalCut, 'snapshot terminalCut'),
    atomicCommit: nullableSchemaReference(input.atomicCommit, 'snapshot atomicCommit'),
    versionRelation: nullableSchemaReference(input.versionRelation, 'snapshot versionRelation'),
    independentVersions: nullableSchemaReference(input.independentVersions, 'snapshot independentVersions'),
    rootEpoch: normalizeSchemaReference(input.rootEpoch, 'snapshot rootEpoch'),
    sourceProtection: normalizeSchemaReference(input.sourceProtection, 'snapshot sourceProtection'),
    aggregation: normalizeSchemaReference(input.aggregation, 'snapshot aggregation'),
    sequenceValidation: normalizeSchemaReference(input.sequenceValidation, 'snapshot sequenceValidation'),
    invalidation: normalizeSchemaReference(input.invalidation, 'snapshot invalidation'),
  };
  const consistencies = new Set(schemas.map(({ consistency }) => consistency));
  if (consistencies.has('atomic-cut') && result.atomicCommit === null) fail('OUTPUT_SNAPSHOT_PROTOCOL', 'atomic-cut lacks commit proof');
  if (consistencies.has('versioned-cut') && result.versionRelation === null) fail('OUTPUT_SNAPSHOT_PROTOCOL', 'versioned-cut lacks version relation');
  if (consistencies.has('independently-versioned') && result.independentVersions === null) fail('OUTPUT_SNAPSHOT_PROTOCOL', 'independently-versioned lacks field version contract');
  return result;
}

function normalizeConsumerPolicy(input, permissions) {
  exactKeys(input, ['validation', 'serialization', 'trust', 'provenance', 'redaction', 'permission', 'integrity'], 'OUTPUT_CONSUMER_FIELDS', 'consumerPolicy');
  const permission = normalizeSchemaReference(input.permission, 'consumerPolicy permission');
  if (!permissions.some((entry) => schemaKey(entry) === schemaKey(permission))) fail('OUTPUT_CONSUMER_PERMISSION', 'consumer policy permission is not selected');
  const result = { permission };
  for (const key of ['validation', 'serialization', 'trust', 'provenance', 'redaction', 'integrity']) result[key] = normalizeSchemaReference(input[key], `consumerPolicy ${key}`);
  return result;
}

function normalizePublication(input) {
  exactKeys(input, ['states', 'fullBeforeReady', 'releasePublication', 'acquireRead', 'terminalConflict', 'readyImmutable', 'borrow', 'maxBorrows', 'maxTransfers', 'borrowAcquire', 'borrowRelease', 'borrowExpiry', 'waiterCompletion', 'hostDelivery', 'hostEffect', 'waiterBound', 'mechanism'], 'OUTPUT_PUBLICATION_FIELDS', 'publication');
  if (!Array.isArray(input.states) || input.states.length !== PUBLICATION_STATES.length || input.states.some((state, index) => state !== PUBLICATION_STATES[index]) || input.fullBeforeReady !== true || input.terminalConflict !== 'quarantine' || input.readyImmutable !== true || input.hostDelivery !== 'asynchronous-bounded-read' || input.hostEffect !== 'transfer-borrow-only' || input.mechanism !== 'public-cuda-js-contract') fail('OUTPUT_PUBLICATION_CONTRACT', 'publication contract is incomplete');
  return {
    states: [...input.states], fullBeforeReady: true, releasePublication: normalizeSchemaReference(input.releasePublication, 'publication release'), acquireRead: normalizeSchemaReference(input.acquireRead, 'publication acquire'),
    terminalConflict: input.terminalConflict, readyImmutable: true, borrow: normalizeSchemaReference(input.borrow, 'publication borrow'),
    maxBorrows: positiveDecimal(input.maxBorrows, 'OUTPUT_PUBLICATION_RANGE', 'publication maxBorrows'), maxTransfers: positiveDecimal(input.maxTransfers, 'OUTPUT_PUBLICATION_RANGE', 'publication maxTransfers'),
    borrowAcquire: normalizeSchemaReference(input.borrowAcquire, 'publication borrowAcquire'), borrowRelease: normalizeSchemaReference(input.borrowRelease, 'publication borrowRelease'),
    borrowExpiry: normalizeSchemaReference(input.borrowExpiry, 'publication borrowExpiry'), waiterCompletion: normalizeSchemaReference(input.waiterCompletion, 'publication waiterCompletion'),
    hostDelivery: input.hostDelivery, hostEffect: input.hostEffect, waiterBound: positiveDecimal(input.waiterBound, 'OUTPUT_PUBLICATION_RANGE', 'publication waiterBound'), mechanism: input.mechanism,
  };
}

function normalizeLifecycle(input, live) {
  exactKeys(input, ['states', 'failure', 'quarantine', 'cancellation', 'rootDisposition', 'workDisposition', 'sessionDisposition', 'reuse', 'dispositions', 'teardown', 'release', 'terminalOnlyElidesLive'], 'OUTPUT_LIFECYCLE_FIELDS', 'lifecycle');
  const states = ['profile-normalized', 'resources-admitted', 'initialized', 'active-or-terminal-capture', 'draining', 'terminal', 'released'];
  if (!Array.isArray(input.states) || input.states.length !== states.length || input.states.some((state, index) => state !== states[index]) || input.terminalOnlyElidesLive !== !live) fail('OUTPUT_LIFECYCLE_STATES', 'output lifecycle is incomplete');
  const expected = [...BASE_DISPOSITIONS, ...(live ? LIVE_DISPOSITIONS : [])].sort(compareRaw);
  if (!Array.isArray(input.dispositions)) fail('OUTPUT_LIFECYCLE_DISPOSITION', 'lifecycle dispositions must be an array');
  const dispositions = input.dispositions.map((entry, index) => normalizeDisposition(entry, index)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(dispositions, 'id', 'OUTPUT_LIFECYCLE_DISPOSITION', 'lifecycle disposition');
  if (dispositions.length !== expected.length || expected.some((id) => !dispositions.some((entry) => entry.id === id))) fail('OUTPUT_LIFECYCLE_DISPOSITION', 'lifecycle dispositions differ from selected state');
  return {
    states: [...input.states], failure: normalizeSchemaReference(input.failure, 'lifecycle failure'), quarantine: normalizeSchemaReference(input.quarantine, 'lifecycle quarantine'), cancellation: normalizeSchemaReference(input.cancellation, 'lifecycle cancellation'),
    rootDisposition: normalizeSchemaReference(input.rootDisposition, 'lifecycle rootDisposition'), workDisposition: normalizeSchemaReference(input.workDisposition, 'lifecycle workDisposition'), sessionDisposition: normalizeSchemaReference(input.sessionDisposition, 'lifecycle sessionDisposition'), reuse: normalizeSchemaReference(input.reuse, 'lifecycle reuse'),
    dispositions, teardown: normalizeSchemaReference(input.teardown, 'lifecycle teardown'), release: normalizeSchemaReference(input.release, 'lifecycle release'), terminalOnlyElidesLive: input.terminalOnlyElidesLive,
  };
}

function normalizeDisposition(input, index) {
  exactKeys(input, ['id', 'root', 'session', 'release', 'retentionWorkUnits'], 'OUTPUT_DISPOSITION_FIELDS', `lifecycle disposition ${index}`);
  const allowed = [...BASE_DISPOSITIONS, ...LIVE_DISPOSITIONS];
  return {
    id: assertEnum(input.id, allowed, 'OUTPUT_LIFECYCLE_DISPOSITION', `lifecycle disposition ${index} id`),
    root: assertEnum(input.root, ['retain', 'retain-if-key-valid', 'reset', 'retire', 'invalidate'], 'OUTPUT_LIFECYCLE_DISPOSITION', `${input.id} root`),
    session: assertEnum(input.session, ['retain', 'retain-if-key-valid', 'reset', 'retire', 'invalidate'], 'OUTPUT_LIFECYCLE_DISPOSITION', `${input.id} session`),
    release: normalizeSchemaReference(input.release, `${input.id} release`),
    retentionWorkUnits: positiveDecimal(input.retentionWorkUnits, 'OUTPUT_LIFECYCLE_RANGE', `${input.id} retentionWorkUnits`),
  };
}

function normalizeStatus(input, index) {
  exactKeys(input, ['code', 'class', 'diagnostic'], 'OUTPUT_STATUS_FIELDS', `status ${index}`);
  assertString(input.code, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, 'OUTPUT_STATUS_CODE', `status ${index} code`);
  const statusClass = assertEnum(input.class, ['normal', 'pending', 'drop', 'pressure', 'valid-partial', 'stop', 'fatal', 'cancellation'], 'OUTPUT_STATUS_CLASS', `${input.code} class`);
  if (typeof input.diagnostic !== 'boolean' || (REQUIRED_STATUSES.has(input.code) && REQUIRED_STATUSES.get(input.code) !== statusClass)) fail('OUTPUT_STATUS_CLASS', `${input.code} status is invalid`);
  return { code: input.code, class: statusClass, diagnostic: input.diagnostic };
}

function normalizePort(input, index, live, statusCodes) {
  exactKeys(input, ['id', 'phase', 'contract', 'bounds', 'completion', 'statuses', 'sourceMutation'], 'OUTPUT_PORT_FIELDS', `port ${index}`);
  const allowed = [...MANDATORY_PORTS, ...(live ? LIVE_PORTS : [])]; assertEnum(input.id, allowed, 'OUTPUT_PORT_ID', `port ${index} id`);
  if (input.sourceMutation !== 'prohibited') fail('OUTPUT_PORT_AUTHORITY', `${input.id} may mutate source`);
  const statuses = statusSet(input.statuses, 'OUTPUT_PORT_STATUS', `${input.id} statuses`, 1); if (statuses.some((status) => !statusCodes.has(status))) fail('OUTPUT_PORT_STATUS', `${input.id} names unknown status`);
  const phase = assertEnum(input.phase, ['host-preignition', 'device-active', 'host-async', 'host-postterminal'], 'OUTPUT_PORT_PHASE', `${input.id} phase`);
  if (phase !== PORT_PHASES.get(input.id)) fail('OUTPUT_PORT_PHASE', `${input.id} phase is invalid`);
  return { id: input.id, phase, contract: normalizeSchemaReference(input.contract, `${input.id} contract`), bounds: normalizeBounds(input.bounds, `${input.id} bounds`), completion: assertEnum(input.completion, ['bounded', 'finite-continuation', 'must-complete'], 'OUTPUT_PORT_COMPLETION', `${input.id} completion`), statuses, sourceMutation: input.sourceMutation };
}

function normalizeDiagnostics(input) {
  exactKeys(input, ['authority', 'maxRecords', 'maxBytes', 'overflow', 'rawAddresses', 'privatePayloads', 'deviceMemoryDump'], 'OUTPUT_DIAGNOSTIC_FIELDS', 'diagnostics');
  if (input.authority !== 'non-authoritative' || input.rawAddresses !== false || input.privatePayloads !== false || input.deviceMemoryDump !== false) fail('OUTPUT_DIAGNOSTIC_AUTHORITY', 'diagnostics exceed authority');
  return { authority: input.authority, maxRecords: positiveDecimal(input.maxRecords, 'OUTPUT_DIAGNOSTIC_RANGE', 'diagnostics maxRecords'), maxBytes: positiveDecimal(input.maxBytes, 'OUTPUT_DIAGNOSTIC_RANGE', 'diagnostics maxBytes'), overflow: assertEnum(input.overflow, ['drop', 'count', 'terminal'], 'OUTPUT_DIAGNOSTIC_OVERFLOW', 'diagnostics overflow'), rawAddresses: false, privatePayloads: false, deviceMemoryDump: false };
}

function normalizeCompatibility(input) {
  exactKeys(input, ['packageIdentityRequired', 'nativeTransferIdentityOpaque', 'persistence'], 'OUTPUT_COMPAT_FIELDS', 'compatibility');
  if (input.packageIdentityRequired !== true || input.nativeTransferIdentityOpaque !== true) fail('OUTPUT_COMPAT_IDENTITY', 'output compatibility identity is incomplete');
  let persistence;
  if (input.persistence?.kind === 'none') { exactKeys(input.persistence, ['kind'], 'OUTPUT_PERSISTENCE_FIELDS', 'persistence'); persistence = { kind: 'none' }; }
  else {
    exactKeys(input.persistence, ['kind', 'encoding', 'namespace', 'integrity', 'provenance', 'migration', 'recovery', 'retention', 'secureDeletion'], 'OUTPUT_PERSISTENCE_FIELDS', 'persistence');
    if (input.persistence.kind !== 'versioned') fail('OUTPUT_PERSISTENCE_KIND', 'persistence kind is invalid'); assertNamespacedId(input.persistence.namespace, 'OUTPUT_PERSISTENCE_NAMESPACE', 'persistence namespace');
    persistence = { kind: input.persistence.kind, namespace: input.persistence.namespace };
    for (const key of ['encoding', 'integrity', 'provenance', 'migration', 'recovery', 'retention', 'secureDeletion']) persistence[key] = normalizeSchemaReference(input.persistence[key], `persistence ${key}`);
  }
  return { packageIdentityRequired: true, nativeTransferIdentityOpaque: true, persistence };
}

function normalizeCleanup(input, live, persisted) {
  exactKeys(input, ['kinds', 'disposition', 'quarantine', 'releaseOrder', 'retainedEvidence'], 'OUTPUT_CLEANUP_FIELDS', 'cleanup');
  const expected = [...BASE_CLEANUP, ...(live ? LIVE_CLEANUP : []), ...(persisted ? PERSISTENCE_CLEANUP : [])].sort(compareRaw); const kinds = enumSet(input.kinds, expected, 'OUTPUT_CLEANUP_KIND', 'cleanup kinds', expected.length);
  if (kinds.length !== expected.length) fail('OUTPUT_CLEANUP_COVERAGE', 'cleanup differs from selected output state');
  return { kinds, disposition: normalizeSchemaReference(input.disposition, 'cleanup disposition'), quarantine: normalizeSchemaReference(input.quarantine, 'cleanup quarantine'), releaseOrder: normalizeSchemaReference(input.releaseOrder, 'cleanup releaseOrder'), retainedEvidence: normalizeSchemaReference(input.retainedEvidence, 'cleanup retainedEvidence') };
}

function normalizeProgram(input, requiredProfiles) {
  exactKeys(input, ['kind', 'language', 'sourceIdentity', 'inputs', 'provenance'], 'OUTPUT_PROGRAM_FIELDS', 'programContribution');
  if (input.kind !== 'device-program' || input.language !== 'restricted-device-js') fail('OUTPUT_PROGRAM_LANGUAGE', 'output contribution must be restricted Device-JS');
  const inputs = input.inputs.map((entry, index) => normalizeProfileReference(entry, `program input ${index}`)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(inputs, 'id', 'OUTPUT_PROGRAM_INPUT_DUPLICATE', 'program input');
  const actual = new Map(inputs.map((profile) => [profile.id, profileKey(profile)])); if (actual.size !== requiredProfiles.size || [...requiredProfiles].some(([id, profile]) => actual.get(id) !== profileKey(profile))) fail('OUTPUT_PROGRAM_INPUTS', 'program inputs differ from selected profiles/plans');
  exactKeys(input.provenance, ['origin', 'revision', 'license', 'review'], 'OUTPUT_PROGRAM_PROVENANCE_FIELDS', 'program provenance'); if (input.provenance.origin !== 'first-party') fail('OUTPUT_PROGRAM_ORIGIN', 'output program must be first-party');
  assertString(input.provenance.revision, /^[0-9a-f]{40}$/, 'OUTPUT_PROGRAM_REVISION', 'program revision'); assertString(input.provenance.license, /\S/, 'OUTPUT_PROGRAM_LICENSE', 'program license');
  return { kind: input.kind, language: input.language, sourceIdentity: normalizeContentIdentity(input.sourceIdentity, 'OUTPUT_PROGRAM_SOURCE', 'program sourceIdentity'), inputs, provenance: { ...input.provenance, review: normalizeSchemaReference(input.provenance.review, 'program review') } };
}

function normalizeProductData(input, index) {
  exactKeys(input, ['ownerContract', 'schema', 'identity'], 'OUTPUT_PRODUCT_FIELDS', `productData ${index}`); if (input.ownerContract?.kind !== 'namespaced') fail('OUTPUT_PRODUCT_OWNER', 'product data owner must be namespaced');
  return { ownerContract: normalizeContract(input.ownerContract, new Map(), `productData ${index} owner`), schema: normalizeSchemaReference(input.schema, `productData ${index} schema`), identity: normalizeContentIdentity(input.identity, 'OUTPUT_PRODUCT_IDENTITY', `productData ${index} identity`) };
}

export function normalizeOutputProfile(input, inspectedCatalog, resourceResult, progressResult) {
  exactKeys(input, ['schema', 'representation', 'status', 'contract', 'id', 'version', 'resourcePlan', 'progressPlan', 'resourceContribution', 'progressContribution', 'contributors', 'terminalEnvelope', 'schemas', 'fields', 'terminal', 'observations', 'workspace', 'snapshot', 'publication', 'lifecycle', 'ports', 'statuses', 'permissions', 'consumerPolicy', 'diagnostics', 'compatibility', 'cleanup', 'programContribution', 'productData'], 'OUTPUT_ROOT_FIELDS', 'output profile');
  if (input.schema !== OUTPUT_SCHEMA || input.representation !== REPRESENTATION || input.status !== 'accepted') fail('OUTPUT_SCHEMA', 'unsupported output schema/representation/status');
  assertNamespacedId(input.id, 'OUTPUT_PROFILE_ID', 'output profile id'); assertVersion(input.version, 'OUTPUT_PROFILE_VERSION', 'output profile version');
  const contracts = inspectedCatalog?.contractSet?.contracts; if (!contracts) fail('OUTPUT_CATALOG', 'inspected catalog is required'); const catalogById = new Map(contracts.map((entry) => [entry.id, entry]));
  const contract = normalizeContract(input.contract, catalogById, 'output contract'); if (contract.id !== OUTPUT_CONTRACT) fail('OUTPUT_CONTRACT_ID', `output contract must select ${OUTPUT_CONTRACT}`);
  if (!resourceResult?.normalized || !resourceResult?.schemaSha || !progressResult?.normalized || !progressResult?.schemaSha) fail('OUTPUT_PLAN', 'exact resource and progress plans are required');
  const expectedRef = (result) => ({ id: result.normalized.id, schema: { id: result.normalized.schema, version: '0.2.0', sha256: result.schemaSha }, identity: result.identity });
  const resourcePlan = normalizeProfileReference(input.resourcePlan, 'resourcePlan'); const progressPlan = normalizeProfileReference(input.progressPlan, 'progressPlan');
  if (profileKey(resourcePlan) !== profileKey(expectedRef(resourceResult)) || profileKey(progressPlan) !== profileKey(expectedRef(progressResult))) fail('OUTPUT_PLAN', 'resource/progress plan identity differs');
  if (profileKey(progressResult.normalized.resourcePlan) !== profileKey(resourcePlan)) fail('OUTPUT_PLAN', 'progress plan binds another resource plan');
  const resourceOwner = resourceResult.normalized.contributors.find(({ contract: selected }) => selected.id === OUTPUT_CONTRACT); const progressOwner = progressResult.normalized.contributors.find(({ contract: selected }) => selected.id === OUTPUT_CONTRACT);
  const resourceContribution = normalizeProfileReference(input.resourceContribution, 'resourceContribution'); const progressContribution = normalizeProfileReference(input.progressContribution, 'progressContribution');
  if (!resourceOwner || !progressOwner || profileKey(resourceContribution) !== profileKey(resourceOwner.profile) || profileKey(progressContribution) !== profileKey(progressOwner.profile) || profileKey(resourceContribution) !== profileKey(progressContribution)) fail('OUTPUT_CONTRIBUTION', 'output contribution differs across resource/progress plans');

  const exactContributors = new Map(progressResult.normalized.contributors.map((entry) => [entry.id, entry]));
  const readinessByOwner = new Map(progressResult.normalized.contributors.map((entry) => {
    const work = progressResult.normalized.workClasses.find(({ owner }) => owner === entry.id);
    const readiness = new Map([[schemaKey(work.readiness.publication), 'ready'], [schemaKey(work.step.publication), 'terminal-ready']]);
    for (const transition of entry.publicTransitions) if (!readiness.has(schemaKey(transition))) readiness.set(schemaKey(transition), 'external-control');
    return [entry.id, readiness];
  }));
  if (!Array.isArray(input.contributors) || input.contributors.length !== exactContributors.size) fail('OUTPUT_CONTRIBUTOR_COUNT', 'contributors must exactly cover progress owners');
  const contributors = input.contributors.map((entry, index) => normalizeContributor(entry, index, catalogById, exactContributors, readinessByOwner)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(contributors, 'id', 'OUTPUT_CONTRIBUTOR_DUPLICATE', 'contributor');
  if ([...exactContributors.keys()].some((id) => !contributors.some((entry) => entry.id === id))) fail('OUTPUT_CONTRIBUTOR_COVERAGE', 'contributors omit selected progress owner'); const contributorById = new Map(contributors.map((entry) => [entry.id, entry]));
  const outputClasses = resourceResult.normalized.classes.filter(({ contributor }) => contributor === resourceOwner.id); const outputClassById = new Map(outputClasses.map((entry) => [entry.id, entry]));
  const reserveById = new Map(resourceResult.normalized.reserves.map((entry) => [entry.id, entry])); const terminalEnvelope = normalizeEnvelope(input.terminalEnvelope, reserveById);
  const schemas = input.schemas.map(normalizeOutputSchema); uniqueBy(schemas, 'id', 'OUTPUT_SCHEMA_DUPLICATE', 'output schema'); const schemaById = new Map(schemas.map((entry) => [entry.id, entry]));
  const terminalSchemas = schemas.filter(({ kind }) => kind === 'terminal'); if (terminalSchemas.length !== 1) fail('OUTPUT_TERMINAL_SCHEMA', 'exactly one terminal schema is required');
  if (compareDecimalUint(terminalSchemas[0].maxBytes, terminalEnvelope.maxBytes) > 0) fail('OUTPUT_TERMINAL_CAPACITY', 'terminal schema exceeds terminal envelope bound');
  const fields = input.fields.map((entry, index) => normalizeField(entry, index, contributorById, schemaById)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(fields, 'id', 'OUTPUT_FIELD_DUPLICATE', 'field');
  for (const schema of schemas) {
    const owned = fields.filter(({ schema: schemaId }) => schemaId === schema.id).sort((left, right) => compareDecimalUint(left.order, right.order)).map(({ id }) => id);
    if (owned.length !== schema.fieldOrder.length || owned.some((id, index) => id !== schema.fieldOrder[index])) fail('OUTPUT_SCHEMA_FIELD', `${schema.id} field order/coverage differs`);
  }
  const terminalClassId = outputClasses.find(({ id }) => id.endsWith('class-terminal-envelope'))?.id ?? null;
  const workingClass = outputClasses.find(({ id }) => id.endsWith('class-output-working'));
  const terminal = normalizeTerminal(input.terminal, terminalSchemas[0], terminalEnvelope, outputClasses, reserveById);
  const observations = normalizeObservations(input.observations, schemaById, contributorById, outputClassById, terminalClassId); const live = observations.kind === 'selected';
  if (live !== outputClasses.some(({ id }) => id.endsWith('class-live-observation'))) fail('OUTPUT_OBSERVATION_RESOURCE', 'live selection differs from admitted observation class');
  const workspace = normalizeWorkspace(input.workspace, live, workingClass);
  const snapshot = normalizeSnapshot(input.snapshot, schemas);
  const publication = normalizePublication(input.publication);
  if (compareDecimalUint(publication.maxBorrows, workspace.maxBorrows) > 0 || compareDecimalUint(publication.maxTransfers, workspace.maxTransfers) > 0) fail('OUTPUT_PUBLICATION_RANGE', 'publication borrow/transfer range exceeds workspace');
  if (live && observations.profiles.some((entry) => compareDecimalUint(entry.maxBorrows, workspace.maxBorrows) > 0 || compareDecimalUint(entry.maxTransfers, workspace.maxTransfers) > 0)) fail('OUTPUT_OBSERVATION_RANGE', 'observation borrow/transfer range exceeds workspace');
  const lifecycle = normalizeLifecycle(input.lifecycle, live);
  const statuses = input.statuses.map(normalizeStatus).sort((left, right) => compareRaw(left.code, right.code)); uniqueBy(statuses, 'code', 'OUTPUT_STATUS_DUPLICATE', 'status'); const statusCodes = new Set(statuses.map(({ code }) => code)); for (const required of REQUIRED_STATUSES.keys()) if (!statusCodes.has(required)) fail('OUTPUT_STATUS_REQUIRED', `required status ${required} is absent`);
  const ports = input.ports.map((entry, index) => normalizePort(entry, index, live, statusCodes)).sort((left, right) => compareRaw(left.id, right.id)); uniqueBy(ports, 'id', 'OUTPUT_PORT_DUPLICATE', 'port'); const requiredPorts = [...MANDATORY_PORTS, ...(live ? LIVE_PORTS : [])]; for (const required of requiredPorts) if (!ports.some(({ id }) => id === required)) fail('OUTPUT_PORT_REQUIRED', `required port ${required} is absent`); if (!live && ports.some(({ id }) => LIVE_PORTS.includes(id))) fail('OUTPUT_OBSERVATION_RESIDUE', 'terminal-only profile retains live port');
  const permissions = input.permissions.map((entry, index) => normalizeSchemaReference(entry, `permission ${index}`)).sort((left, right) => compareRaw(schemaKey(left), schemaKey(right))); if (new Set(permissions.map(schemaKey)).size !== permissions.length || permissions.length === 0) fail('OUTPUT_PERMISSION', 'permissions must be nonempty and unique');
  const consumerPolicy = normalizeConsumerPolicy(input.consumerPolicy, permissions);
  const diagnostics = normalizeDiagnostics(input.diagnostics);
  if (compareDecimalUint(diagnostics.maxBytes, workspace.diagnosticBytes) > 0) fail('OUTPUT_WORKSPACE_CAPACITY', 'diagnostics exceed admitted output workspace');
  const compatibility = normalizeCompatibility(input.compatibility);
  const requiredProgramProfiles = new Map(contributors.map(({ profile }) => [profile.id, profile])); requiredProgramProfiles.set(resourcePlan.id, resourcePlan); requiredProgramProfiles.set(progressPlan.id, progressPlan);
  const programContribution = normalizeProgram(input.programContribution, requiredProgramProfiles); const productData = input.productData.map(normalizeProductData).sort((left, right) => compareRaw(left.ownerContract.id, right.ownerContract.id)); uniqueBy(productData.map(({ ownerContract }) => ({ id: ownerContract.id })), 'id', 'OUTPUT_PRODUCT_DUPLICATE', 'product owner');
  const normalized = {
    schema: input.schema, representation: input.representation, status: input.status, contract, id: input.id, version: input.version,
    resourcePlan, progressPlan, resourceContribution, progressContribution, contributors, terminalEnvelope, schemas: schemas.sort((left, right) => compareRaw(left.id, right.id)), fields,
    terminal, observations, workspace, snapshot, publication, lifecycle, ports, statuses, permissions, consumerPolicy, diagnostics, compatibility, cleanup: normalizeCleanup(input.cleanup, live, compatibility.persistence.kind === 'versioned'), programContribution, productData,
  };
  return { normalized, identity: canonicalIdentity(normalized) };
}

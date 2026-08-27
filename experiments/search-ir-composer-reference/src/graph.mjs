import {
  addDecimalUint,
  assertString,
  canonicalIdentity,
  compareDecimalUint,
  compareRaw,
  exactKeys,
  fail,
  modDecimalUint,
  multiplyDecimalUint,
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

const GRAPH_PROFILE_SCHEMA = 'cuda-mcgs.graph-profile/0.2.0';
const REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const GRAPH_CONTRACT = 'SPEC-0010';
const OBJECT_ROLES = ['active-path', 'expansion', 'parent-edge', 'path-occurrence', 'protection-record', 'retirement-record', 'root-anchor', 'state-node', 'transposition-entry'];
const MATERIALIZED_ROLES = ['active-path', 'expansion', 'parent-edge', 'path-occurrence', 'protection-record', 'root-anchor', 'state-node'];
const BASE_PORTS = [
  'append-path-occurrence', 'close-expansion', 'close-path', 'fail-edge', 'fail-node', 'lookup-or-claim-node', 'open-expansion', 'open-path',
  'protect-root-anchor', 'publish-edge-action', 'publish-edge-child', 'publish-expansion-batch', 'publish-node', 'read-path-view', 'release-root-anchor',
  'reserve-edge', 'validate-reference',
];
const RECLAIM_PORTS = ['prove-quiescent', 'reclaim', 'retire'];
const REQUIRED_RESOURCE_PRESSURES = ['action-byte-capacity', 'edge-capacity', 'node-capacity', 'path-capacity', 'path-depth', 'protection-capacity', 'state-byte-capacity'];
const REQUIRED_FAILURES = [
  'action-byte-capacity', 'arena-incarnation-mismatch', 'cancelled', 'edge-capacity', 'generation-exhausted', 'graph-internal-failure',
  'invalid-graph-profile', 'invalid-reference', 'node-capacity', 'owner-lifecycle-failure', 'path-capacity', 'path-depth', 'protection-capacity', 'publication-conflict',
  'reclamation-not-quiescent', 'reference-kind-mismatch', 'stale-reference', 'state-byte-capacity', 'transposition-capacity', 'transposition-probe-exhausted',
];
const REGION_CONTRACT = new Map([
  ['domain-state', 'SPEC-0007'], ['domain-action', 'SPEC-0007'], ['domain-history', 'SPEC-0007'], ['policy-record', 'SPEC-0008'],
  ['evaluator-record', 'SPEC-0009'], ['output-record', 'SPEC-0013'], ['extension-record', 'SPEC-0003'],
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

function normalizeCatalogContract(input, catalogById, expectedId, code, label) {
  exactKeys(input, ['kind', 'id', 'specificationIdentity', 'sha256'], `${code}_FIELDS`, label);
  if (input.kind !== 'catalog' || input.id !== expectedId) fail(`${code}_ID`, `${label} must select ${expectedId}`);
  assertString(input.specificationIdentity, /^CUDA-MCGS-SPEC-[0-9]{4}@[0-9]+\.[0-9]+\.[0-9]+-draft$/, `${code}_ID`, `${label} identity`);
  assertSha256(input.sha256, `${code}_DIGEST`, `${label} sha256`);
  const expected = catalogById.get(expectedId);
  if (!expected || expected.specificationIdentity !== input.specificationIdentity || expected.sha256 !== input.sha256) fail(`${code}_DRIFT`, `${label} differs from the frozen contract set`);
  return { kind: 'catalog', id: input.id, specificationIdentity: input.specificationIdentity, sha256: input.sha256 };
}

function normalizeContract(input, catalogById, semanticRole, label) {
  if (input?.kind === 'catalog') return normalizeCatalogContract(input, catalogById, REGION_CONTRACT.get(semanticRole), 'GRAPH_REGION_CONTRACT', label);
  exactKeys(input, ['kind', 'id', 'version', 'schema', 'sha256'], 'GRAPH_REGION_CONTRACT_FIELDS', label);
  if (input.kind !== 'namespaced' || !['capability-record', 'product-record'].includes(semanticRole)) fail('GRAPH_REGION_CONTRACT_KIND', `${label} namespaced contract is permitted only for capability/product records`);
  assertNamespacedId(input.id, 'GRAPH_REGION_CONTRACT_ID', `${label} id`);
  assertVersion(input.version, 'GRAPH_REGION_CONTRACT_VERSION', `${label} version`);
  assertString(input.schema, /^[a-z][a-z0-9.-]+\/[0-9]+\.[0-9]+\.[0-9]+$/, 'GRAPH_REGION_CONTRACT_SCHEMA', `${label} schema`);
  assertSha256(input.sha256, 'GRAPH_REGION_CONTRACT_DIGEST', `${label} sha256`);
  if (!input.schema.endsWith(`/${input.version}`)) fail('GRAPH_REGION_CONTRACT_VERSION', `${label} schema/version differ`);
  return { kind: 'namespaced', id: input.id, version: input.version, schema: input.schema, sha256: input.sha256 };
}

function schemaKey(reference) {
  return `${reference.id}\0${reference.version}\0${reference.sha256}`;
}

function normalizeProfileReference(input, label) {
  exactKeys(input, ['id', 'schema', 'identity'], 'GRAPH_PROFILE_REFERENCE_FIELDS', label);
  assertNamespacedId(input.id, 'GRAPH_PROFILE_REFERENCE_ID', `${label} id`);
  return {
    id: input.id,
    schema: normalizeSchemaReference(input.schema, `${label} schema`),
    identity: normalizeContentIdentity(input.identity, 'GRAPH_PROFILE_REFERENCE_IDENTITY', `${label} identity`),
  };
}

function normalizeDomainProfile(input, domainProfileResult) {
  exactKeys(input, ['id', 'schema', 'identity', 'identityKeyPort', 'equalStatePort', 'classifyPathRelationPort'], 'GRAPH_DOMAIN_FIELDS', 'domainProfile');
  const normalizedDomain = domainProfileResult?.normalized;
  const domainIdentity = domainProfileResult?.identity;
  if (!normalizedDomain || !domainIdentity) fail('GRAPH_DOMAIN_INPUT', 'normalized domain profile is required');
  assertNamespacedId(input.id, 'GRAPH_DOMAIN_ID', 'domainProfile id');
  const schema = normalizeSchemaReference(input.schema, 'domainProfile schema');
  const identity = normalizeContentIdentity(input.identity, 'GRAPH_DOMAIN_IDENTITY', 'domainProfile identity');
  if (input.id !== normalizedDomain.id || schema.id !== normalizedDomain.schema || identity.sha256 !== domainIdentity.sha256) {
    fail('GRAPH_DOMAIN_DRIFT', 'domainProfile does not match normalized domain input');
  }
  const ports = new Map(normalizedDomain.ports.map((port) => [port.id, port.contract]));
  const portFields = [
    ['identityKeyPort', 'identity-key'], ['equalStatePort', 'equal-state'], ['classifyPathRelationPort', 'classify-path-relation'],
  ];
  const result = { id: input.id, schema, identity };
  for (const [field, portId] of portFields) {
    const reference = normalizeSchemaReference(input[field], `domainProfile ${field}`);
    if (schemaKey(reference) !== schemaKey(ports.get(portId))) fail('GRAPH_DOMAIN_PORT_DRIFT', `domainProfile ${field} differs from ${portId}`);
    result[field] = reference;
  }
  return result;
}

function normalizeArena(input) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'GRAPH_ARENA_FIELDS', 'arena');
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'incarnationScope', 'maxIncarnations', 'exhaustion'], 'GRAPH_ARENA_FIELDS', 'arena');
  if (input.kind !== 'finite') fail('GRAPH_ARENA_KIND', 'arena kind is invalid');
  return {
    kind: 'finite',
    incarnationScope: assertEnum(input.incarnationScope, ['engine-incarnation', 'session-incarnation', 'persistence-namespace'], 'GRAPH_ARENA_SCOPE', 'arena incarnationScope'),
    maxIncarnations: positiveDecimal(input.maxIncarnations, 'GRAPH_ARENA_RANGE', 'arena maxIncarnations'),
    exhaustion: assertEnum(input.exhaustion, ['arena-replacement-required', 'generation-exhausted'], 'GRAPH_ARENA_EXHAUSTION', 'arena exhaustion'),
  };
}

function normalizeReferenceEncoding(input) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'GRAPH_REFERENCE_FIELDS', 'referenceEncoding');
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'schema', 'kindRange', 'arenaRange', 'slotRange', 'generationRange', 'staleBehavior', 'rawAddressPublic'], 'GRAPH_REFERENCE_FIELDS', 'referenceEncoding');
  if (input.kind !== 'typed-index-generation' || input.staleBehavior !== 'reject-without-side-effect' || input.rawAddressPublic !== false) {
    fail('GRAPH_REFERENCE_KIND', 'referenceEncoding must be typed, stale-safe and expose no raw address');
  }
  return {
    kind: input.kind,
    schema: normalizeSchemaReference(input.schema, 'referenceEncoding schema'),
    kindRange: positiveDecimal(input.kindRange, 'GRAPH_REFERENCE_RANGE', 'referenceEncoding kindRange'),
    arenaRange: positiveDecimal(input.arenaRange, 'GRAPH_REFERENCE_RANGE', 'referenceEncoding arenaRange'),
    slotRange: positiveDecimal(input.slotRange, 'GRAPH_REFERENCE_RANGE', 'referenceEncoding slotRange'),
    generationRange: positiveDecimal(input.generationRange, 'GRAPH_REFERENCE_RANGE', 'referenceEncoding generationRange'),
    staleBehavior: input.staleBehavior,
    rawAddressPublic: false,
  };
}

function transitionKey(transition) {
  return `${transition.from}\0${transition.to}`;
}

function normalizeLifecycle(input, label) {
  exactKeys(input, ['schema', 'initialState', 'states', 'transitions', 'readyStates', 'terminalStates'], 'GRAPH_LIFECYCLE_FIELDS', label);
  const states = stringSet(input.states, { code: 'GRAPH_LIFECYCLE_STATE', label: `${label} states`, namespaced: true, minimum: 2 });
  const stateSet = new Set(states);
  assertNamespacedId(input.initialState, 'GRAPH_LIFECYCLE_INITIAL', `${label} initialState`);
  if (!stateSet.has(input.initialState)) fail('GRAPH_LIFECYCLE_INITIAL', `${label} initialState is undeclared`);
  if (!Array.isArray(input.transitions) || input.transitions.length === 0) fail('GRAPH_LIFECYCLE_TRANSITIONS', `${label} transitions must not be empty`);
  const transitions = input.transitions.map((transition, index) => {
    exactKeys(transition, ['from', 'to', 'visibility'], 'GRAPH_LIFECYCLE_TRANSITION_FIELDS', `${label} transition ${index}`);
    if (!stateSet.has(transition.from) || !stateSet.has(transition.to)) fail('GRAPH_LIFECYCLE_TRANSITION_STATE', `${label} transition ${index} names an unknown state`);
    return {
      from: transition.from,
      to: transition.to,
      visibility: assertEnum(transition.visibility, ['private', 'release-publication', 'terminal-publication'], 'GRAPH_LIFECYCLE_VISIBILITY', `${label} transition ${index} visibility`),
    };
  }).sort((left, right) => compareRaw(transitionKey(left), transitionKey(right)));
  const transitionKeys = transitions.map(transitionKey);
  if (new Set(transitionKeys).size !== transitionKeys.length) fail('GRAPH_LIFECYCLE_TRANSITION_DUPLICATE', `${label} repeats a transition`);
  const readyStates = stringSet(input.readyStates, { code: 'GRAPH_LIFECYCLE_READY', label: `${label} readyStates`, namespaced: true });
  const terminalStates = stringSet(input.terminalStates, { code: 'GRAPH_LIFECYCLE_TERMINAL', label: `${label} terminalStates`, namespaced: true, minimum: 1 });
  for (const state of [...readyStates, ...terminalStates]) if (!stateSet.has(state)) fail('GRAPH_LIFECYCLE_STATE', `${label} publication state ${state} is undeclared`);
  if (readyStates.some((state) => terminalStates.includes(state))) fail('GRAPH_LIFECYCLE_STATE', `${label} ready/terminal states overlap`);
  for (const state of readyStates) if (!transitions.some(({ to, visibility }) => to === state && visibility === 'release-publication')) fail('GRAPH_LIFECYCLE_PUBLICATION', `${label} ready state ${state} lacks release publication`);
  for (const state of terminalStates) if (!transitions.some(({ to, visibility }) => to === state && visibility === 'terminal-publication')) fail('GRAPH_LIFECYCLE_PUBLICATION', `${label} terminal state ${state} lacks terminal publication`);
  const reachable = new Set([input.initialState]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const { from, to } of transitions) if (reachable.has(from) && !reachable.has(to)) { reachable.add(to); changed = true; }
  }
  for (const state of states) if (!reachable.has(state)) fail('GRAPH_LIFECYCLE_UNREACHABLE', `${label} state ${state} is unreachable`);
  return { schema: normalizeSchemaReference(input.schema, `${label} schema`), initialState: input.initialState, states, transitions, readyStates, terminalStates };
}

function normalizeObjectKind(input, index, referenceEncoding) {
  exactKeys(input, ['id', 'role', 'referenceTag', 'lifecycle'], 'GRAPH_OBJECT_FIELDS', `objectKind ${index}`);
  assertNamespacedId(input.id, 'GRAPH_OBJECT_ID', `objectKind ${index} id`);
  const referenceTag = positiveDecimal(input.referenceTag, 'GRAPH_OBJECT_TAG', `${input.id} referenceTag`);
  if (referenceEncoding.kind !== 'none' && compareDecimalUint(referenceTag, referenceEncoding.kindRange) > 0) fail('GRAPH_OBJECT_TAG', `${input.id} referenceTag exceeds encoding range`);
  return {
    id: input.id,
    role: assertEnum(input.role, OBJECT_ROLES, 'GRAPH_OBJECT_ROLE', `${input.id} role`),
    referenceTag,
    lifecycle: normalizeLifecycle(input.lifecycle, `${input.id} lifecycle`),
  };
}

function normalizeRegion(input, label, allowZero = false) {
  exactKeys(input, ['schema', 'offsetBytes', 'sizeBytes', 'alignmentBytes'], 'GRAPH_REGION_FIELDS', label);
  const offsetBytes = normalizeDecimalUint(input.offsetBytes, `${label} offsetBytes`);
  const sizeBytes = allowZero ? normalizeDecimalUint(input.sizeBytes, `${label} sizeBytes`) : positiveDecimal(input.sizeBytes, 'GRAPH_REGION_SIZE', `${label} sizeBytes`);
  const alignmentBytes = positiveDecimal(input.alignmentBytes, 'GRAPH_REGION_ALIGNMENT', `${label} alignmentBytes`);
  if (modDecimalUint(offsetBytes, alignmentBytes) !== '0') fail('GRAPH_REGION_ALIGNMENT', `${label} offset is unaligned`);
  return { schema: normalizeSchemaReference(input.schema, `${label} schema`), offsetBytes, sizeBytes, alignmentBytes };
}

function normalizeLayout(input, index, objectById, referenceEncoding) {
  exactKeys(input, ['id', 'objectKind', 'family', 'capacity', 'recordBytes', 'bytePool', 'alignment', 'identifierRange', 'offsetRange', 'generationRange', 'graphRegion'], 'GRAPH_LAYOUT_FIELDS', `layout ${index}`);
  assertNamespacedId(input.id, 'GRAPH_LAYOUT_ID', `layout ${index} id`);
  assertNamespacedId(input.objectKind, 'GRAPH_LAYOUT_OBJECT', `${input.id} objectKind`);
  if (!objectById.has(input.objectKind)) fail('GRAPH_LAYOUT_OBJECT', `${input.id} names unknown object kind`);
  const capacity = positiveDecimal(input.capacity, 'GRAPH_LAYOUT_CAPACITY', `${input.id} capacity`);
  const recordBytes = positiveDecimal(input.recordBytes, 'GRAPH_LAYOUT_RECORD', `${input.id} recordBytes`);
  const bytePool = positiveDecimal(input.bytePool, 'GRAPH_LAYOUT_POOL', `${input.id} bytePool`);
  const alignment = positiveDecimal(input.alignment, 'GRAPH_LAYOUT_ALIGNMENT', `${input.id} alignment`);
  const identifierRange = positiveDecimal(input.identifierRange, 'GRAPH_LAYOUT_RANGE', `${input.id} identifierRange`);
  const offsetRange = positiveDecimal(input.offsetRange, 'GRAPH_LAYOUT_RANGE', `${input.id} offsetRange`);
  const generationRange = positiveDecimal(input.generationRange, 'GRAPH_LAYOUT_RANGE', `${input.id} generationRange`);
  if (modDecimalUint(recordBytes, alignment) !== '0') fail('GRAPH_LAYOUT_ALIGNMENT', `${input.id} recordBytes is unaligned`);
  if (compareDecimalUint(bytePool, multiplyDecimalUint(capacity, recordBytes)) < 0) fail('GRAPH_LAYOUT_POOL', `${input.id} bytePool cannot hold its declared records`);
  if (compareDecimalUint(capacity, identifierRange) > 0 || compareDecimalUint(capacity, referenceEncoding.slotRange) > 0
      || compareDecimalUint(bytePool, offsetRange) > 0 || compareDecimalUint(generationRange, referenceEncoding.generationRange) > 0) {
    fail('GRAPH_LAYOUT_RANGE', `${input.id} exceeds a declared reference/layout range`);
  }
  const graphRegion = normalizeRegion(input.graphRegion, `${input.id} graphRegion`);
  if (compareDecimalUint(addDecimalUint(graphRegion.offsetBytes, graphRegion.sizeBytes), recordBytes) > 0) fail('GRAPH_LAYOUT_REGION', `${input.id} graphRegion exceeds recordBytes`);
  return {
    id: input.id,
    objectKind: input.objectKind,
    family: assertEnum(input.family, ['fixed-record', 'variable-record', 'segmented', 'packed', 'namespaced'], 'GRAPH_LAYOUT_FAMILY', `${input.id} family`),
    capacity, recordBytes, bytePool, alignment, identifierRange, offsetRange, generationRange, graphRegion,
  };
}

function normalizeOwnerRegion(input, index, objectById, catalogById) {
  exactKeys(input, ['id', 'semanticRole', 'objectKind', 'ownerContract', 'ownerProfile', 'layout', 'lifecycle', 'offsetBytes', 'sizeBytes', 'alignmentBytes', 'permissions', 'persistence'], 'GRAPH_OWNER_REGION_FIELDS', `ownerRegion ${index}`);
  assertNamespacedId(input.id, 'GRAPH_OWNER_REGION_ID', `ownerRegion ${index} id`);
  const semanticRole = assertEnum(input.semanticRole, [...REGION_CONTRACT.keys(), 'capability-record', 'product-record'], 'GRAPH_OWNER_REGION_ROLE', `${input.id} semanticRole`);
  assertNamespacedId(input.objectKind, 'GRAPH_OWNER_REGION_OBJECT', `${input.id} objectKind`);
  if (!objectById.has(input.objectKind)) fail('GRAPH_OWNER_REGION_OBJECT', `${input.id} names unknown object kind`);
  const offsetBytes = normalizeDecimalUint(input.offsetBytes, `${input.id} offsetBytes`);
  const sizeBytes = positiveDecimal(input.sizeBytes, 'GRAPH_OWNER_REGION_SIZE', `${input.id} sizeBytes`);
  const alignmentBytes = positiveDecimal(input.alignmentBytes, 'GRAPH_OWNER_REGION_ALIGNMENT', `${input.id} alignmentBytes`);
  if (modDecimalUint(offsetBytes, alignmentBytes) !== '0') fail('GRAPH_OWNER_REGION_ALIGNMENT', `${input.id} offset is unaligned`);
  return {
    id: input.id,
    semanticRole,
    objectKind: input.objectKind,
    ownerContract: normalizeContract(input.ownerContract, catalogById, semanticRole, `${input.id} ownerContract`),
    ownerProfile: normalizeProfileReference(input.ownerProfile, `${input.id} ownerProfile`),
    layout: normalizeSchemaReference(input.layout, `${input.id} layout`),
    lifecycle: normalizeSchemaReference(input.lifecycle, `${input.id} lifecycle`),
    offsetBytes,
    sizeBytes,
    alignmentBytes,
    permissions: stringSet(input.permissions, { code: 'GRAPH_OWNER_REGION_PERMISSION', label: `${input.id} permissions`, allowed: ['cleanup', 'initialize', 'protect', 'read', 'write'], minimum: 1 }),
    persistence: assertEnum(input.persistence, ['ephemeral', 'selected'], 'GRAPH_OWNER_REGION_PERSISTENCE', `${input.id} persistence`),
  };
}

function regionsOverlap(left, right) {
  const leftEnd = addDecimalUint(left.offsetBytes, left.sizeBytes);
  const rightEnd = addDecimalUint(right.offsetBytes, right.sizeBytes);
  return compareDecimalUint(left.offsetBytes, rightEnd) < 0 && compareDecimalUint(right.offsetBytes, leftEnd) < 0;
}

function assertRegionLayouts(layouts, ownerRegions) {
  const layoutByObject = new Map(layouts.map((layout) => [layout.objectKind, layout]));
  for (const [objectKind, layout] of layoutByObject) {
    const regions = [{ id: `${layout.id}.graph`, ...layout.graphRegion }, ...ownerRegions.filter((region) => region.objectKind === objectKind)];
    for (const region of regions) {
      if (compareDecimalUint(addDecimalUint(region.offsetBytes, region.sizeBytes), layout.recordBytes) > 0) fail('GRAPH_OWNER_REGION_RANGE', `${region.id} exceeds ${layout.id} recordBytes`);
    }
    for (let left = 0; left < regions.length; left += 1) for (let right = left + 1; right < regions.length; right += 1) {
      if (regionsOverlap(regions[left], regions[right])) fail('GRAPH_OWNER_REGION_OVERLAP', `${regions[left].id} overlaps ${regions[right].id}`);
    }
  }
}

function normalizeTransposition(input, domainProfile, objectById, layoutByObject) {
  if (['none', 'isolated-nodes'].includes(input?.kind)) {
    exactKeys(input, ['kind'], 'GRAPH_TRANSPOSITION_FIELDS', 'transposition');
    return { kind: input.kind };
  }
  exactKeys(input, ['kind', 'scope', 'entryObject', 'identityKeyPort', 'equalStatePort', 'capacity', 'maxCollisionProbes', 'fullOutcomes'], 'GRAPH_TRANSPOSITION_FIELDS', 'transposition');
  if (input.kind !== 'verified-sharing') fail('GRAPH_TRANSPOSITION_KIND', 'transposition kind is invalid');
  assertNamespacedId(input.entryObject, 'GRAPH_TRANSPOSITION_OBJECT', 'transposition entryObject');
  if (objectById.get(input.entryObject)?.role !== 'transposition-entry') fail('GRAPH_TRANSPOSITION_OBJECT', 'transposition entryObject has the wrong role');
  const identityKeyPort = normalizeSchemaReference(input.identityKeyPort, 'transposition identityKeyPort');
  const equalStatePort = normalizeSchemaReference(input.equalStatePort, 'transposition equalStatePort');
  if (schemaKey(identityKeyPort) !== schemaKey(domainProfile.identityKeyPort) || schemaKey(equalStatePort) !== schemaKey(domainProfile.equalStatePort)) {
    fail('GRAPH_TRANSPOSITION_DOMAIN_PORT', 'transposition domain ports differ from the selected domain profile');
  }
  const capacity = positiveDecimal(input.capacity, 'GRAPH_TRANSPOSITION_CAPACITY', 'transposition capacity');
  if (compareDecimalUint(capacity, layoutByObject.get(input.entryObject).capacity) > 0) fail('GRAPH_TRANSPOSITION_CAPACITY', 'transposition capacity exceeds entry layout');
  if (JSON.stringify(input.fullOutcomes) !== JSON.stringify(['transposition-capacity', 'transposition-probe-exhausted'])) fail('GRAPH_TRANSPOSITION_OUTCOMES', 'transposition full outcomes are not canonical');
  return {
    kind: input.kind,
    scope: assertEnum(input.scope, ['engine-incarnation', 'session-incarnation', 'persistence-namespace'], 'GRAPH_TRANSPOSITION_SCOPE', 'transposition scope'),
    entryObject: input.entryObject,
    identityKeyPort,
    equalStatePort,
    capacity,
    maxCollisionProbes: positiveDecimal(input.maxCollisionProbes, 'GRAPH_TRANSPOSITION_PROBES', 'transposition maxCollisionProbes'),
    fullOutcomes: [...input.fullOutcomes],
  };
}

function normalizePath(input, domainProfile, objectById, layoutByObject) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'GRAPH_PATH_FIELDS', 'path');
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'pathObject', 'occurrenceObject', 'maxPaths', 'maxDepth', 'protection', 'historyProjection', 'identityBeforeRelation'], 'GRAPH_PATH_FIELDS', 'path');
  if (input.kind !== 'bounded' || input.identityBeforeRelation !== true) fail('GRAPH_PATH_KIND', 'path must be bounded and resolve identity before relation');
  if (objectById.get(input.pathObject)?.role !== 'active-path' || objectById.get(input.occurrenceObject)?.role !== 'path-occurrence') fail('GRAPH_PATH_OBJECT', 'path names wrong object roles');
  const maxPaths = positiveDecimal(input.maxPaths, 'GRAPH_PATH_CAPACITY', 'path maxPaths');
  const maxDepth = positiveDecimal(input.maxDepth, 'GRAPH_PATH_DEPTH', 'path maxDepth');
  if (compareDecimalUint(maxPaths, layoutByObject.get(input.pathObject).capacity) > 0
      || compareDecimalUint(maxDepth, layoutByObject.get(input.occurrenceObject).capacity) > 0) fail('GRAPH_PATH_CAPACITY', 'path bounds exceed selected layouts');
  const historyProjection = normalizeSchemaReference(input.historyProjection, 'path historyProjection');
  if (schemaKey(historyProjection) !== schemaKey(domainProfile.classifyPathRelationPort)) fail('GRAPH_PATH_DOMAIN_PORT', 'path history projection differs from domain relation port');
  return {
    kind: input.kind,
    pathObject: input.pathObject,
    occurrenceObject: input.occurrenceObject,
    maxPaths,
    maxDepth,
    protection: normalizeSchemaReference(input.protection, 'path protection'),
    historyProjection,
    identityBeforeRelation: true,
  };
}

function normalizeRootProtection(input, objectById, layoutByObject) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'GRAPH_ROOT_FIELDS', 'rootProtection');
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'anchorObject', 'protectionObject', 'admissionReserve', 'acquireRetireOrdering'], 'GRAPH_ROOT_FIELDS', 'rootProtection');
  if (input.kind !== 'protected-anchor' || objectById.get(input.anchorObject)?.role !== 'root-anchor'
      || objectById.get(input.protectionObject)?.role !== 'protection-record') fail('GRAPH_ROOT_OBJECT', 'rootProtection names wrong object roles');
  const admissionReserve = positiveDecimal(input.admissionReserve, 'GRAPH_ROOT_RESERVE', 'rootProtection admissionReserve');
  if (compareDecimalUint(admissionReserve, layoutByObject.get(input.anchorObject).capacity) > 0) fail('GRAPH_ROOT_RESERVE', 'root admission reserve exceeds anchor capacity');
  return {
    kind: input.kind,
    anchorObject: input.anchorObject,
    protectionObject: input.protectionObject,
    admissionReserve,
    acquireRetireOrdering: normalizeSchemaReference(input.acquireRetireOrdering, 'rootProtection acquireRetireOrdering'),
  };
}

function normalizeReclamation(input, objectById) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind', 'disposition'], 'GRAPH_RECLAIM_FIELDS', 'reclamation');
    if (input.disposition !== 'retain-until-arena-teardown') fail('GRAPH_RECLAIM_DISPOSITION', 'no-reclamation disposition is invalid');
    return { kind: 'none', disposition: input.disposition };
  }
  exactKeys(input, ['kind', 'retirementObject', 'protectionSources', 'maxWorkUnits', 'maxScratchBytes', 'quiescence', 'transpositionRemoval', 'generationAdvance', 'failureStates'], 'GRAPH_RECLAIM_FIELDS', 'reclamation');
  if (input.kind !== 'enabled' || input.generationAdvance !== 'before-slot-reuse') fail('GRAPH_RECLAIM_KIND', 'reclamation must advance generation before reuse');
  if (objectById.get(input.retirementObject)?.role !== 'retirement-record') fail('GRAPH_RECLAIM_OBJECT', 'reclamation retirementObject has the wrong role');
  const protectionSources = stringSet(input.protectionSources, {
    code: 'GRAPH_RECLAIM_PROTECTION', label: 'reclamation protectionSources',
    allowed: ['active-path', 'external-reference', 'in-flight', 'owner-lease', 'publication-waiter', 'retained-borrow', 'root-anchor'], minimum: 1,
  });
  for (const required of ['active-path', 'in-flight', 'owner-lease', 'publication-waiter', 'retained-borrow', 'root-anchor']) {
    if (!protectionSources.includes(required)) fail('GRAPH_RECLAIM_PROTECTION', `reclamation omits ${required} protection`);
  }
  if (JSON.stringify(input.failureStates) !== JSON.stringify(['quarantined', 'reclaimable', 'retained', 'retiring'])) fail('GRAPH_RECLAIM_FAILURE_STATES', 'reclamation failure states are not canonical');
  return {
    kind: input.kind,
    retirementObject: input.retirementObject,
    protectionSources,
    maxWorkUnits: positiveDecimal(input.maxWorkUnits, 'GRAPH_RECLAIM_WORK', 'reclamation maxWorkUnits'),
    maxScratchBytes: positiveDecimal(input.maxScratchBytes, 'GRAPH_RECLAIM_SCRATCH', 'reclamation maxScratchBytes'),
    quiescence: normalizeSchemaReference(input.quiescence, 'reclamation quiescence'),
    transpositionRemoval: assertEnum(input.transpositionRemoval, ['remove', 'non-returnable-tombstone'], 'GRAPH_RECLAIM_TRANSPOSITION', 'reclamation transpositionRemoval'),
    generationAdvance: input.generationAdvance,
    failureStates: [...input.failureStates],
  };
}

function normalizePublication(input, index, objectById) {
  exactKeys(input, ['id', 'objectKind', 'producer', 'consumers', 'payloadOwner', 'readyState', 'terminalStates', 'visibility', 'wait'], 'GRAPH_PUBLICATION_FIELDS', `publication ${index}`);
  assertNamespacedId(input.id, 'GRAPH_PUBLICATION_ID', `publication ${index} id`);
  assertNamespacedId(input.objectKind, 'GRAPH_PUBLICATION_OBJECT', `${input.id} objectKind`);
  const object = objectById.get(input.objectKind);
  if (!object) fail('GRAPH_PUBLICATION_OBJECT', `${input.id} names unknown object kind`);
  assertNamespacedId(input.producer, 'GRAPH_PUBLICATION_PRODUCER', `${input.id} producer`);
  assertNamespacedId(input.payloadOwner, 'GRAPH_PUBLICATION_OWNER', `${input.id} payloadOwner`);
  assertNamespacedId(input.readyState, 'GRAPH_PUBLICATION_READY', `${input.id} readyState`);
  if (!object.lifecycle.readyStates.includes(input.readyState)) fail('GRAPH_PUBLICATION_READY', `${input.id} readyState is not lifecycle-ready`);
  const terminalStates = stringSet(input.terminalStates, { code: 'GRAPH_PUBLICATION_TERMINAL', label: `${input.id} terminalStates`, namespaced: true, minimum: 1 });
  if (terminalStates.some((state) => !object.lifecycle.terminalStates.includes(state))) fail('GRAPH_PUBLICATION_TERMINAL', `${input.id} terminal state is not lifecycle-terminal`);
  if (input.visibility !== 'release-acquire' || input.wait !== 'device-progress-terminal-aware') fail('GRAPH_PUBLICATION_ORDERING', `${input.id} publication ordering/wait is invalid`);
  return {
    id: input.id,
    objectKind: input.objectKind,
    producer: input.producer,
    consumers: stringSet(input.consumers, { code: 'GRAPH_PUBLICATION_CONSUMER', label: `${input.id} consumers`, namespaced: true, minimum: 1 }),
    payloadOwner: input.payloadOwner,
    readyState: input.readyState,
    terminalStates,
    visibility: input.visibility,
    wait: input.wait,
  };
}

function normalizeBounds(input, label) {
  exactKeys(input, ['maxWorkUnits', 'maxReads', 'maxWrites', 'cancellationObservationWorkUnits'], 'GRAPH_BOUNDS_FIELDS', label);
  const result = {
    maxWorkUnits: positiveDecimal(input.maxWorkUnits, 'GRAPH_BOUNDS_WORK', `${label} maxWorkUnits`),
    maxReads: normalizeDecimalUint(input.maxReads, `${label} maxReads`),
    maxWrites: normalizeDecimalUint(input.maxWrites, `${label} maxWrites`),
    cancellationObservationWorkUnits: positiveDecimal(input.cancellationObservationWorkUnits, 'GRAPH_BOUNDS_CANCELLATION', `${label} cancellationObservationWorkUnits`),
  };
  if (compareDecimalUint(result.cancellationObservationWorkUnits, result.maxWorkUnits) > 0) fail('GRAPH_BOUNDS_CANCELLATION', `${label} cancellation bound exceeds work bound`);
  return result;
}

function normalizeFailure(input, index) {
  exactKeys(input, ['code', 'kind', 'diagnostic'], 'GRAPH_FAILURE_FIELDS', `failure ${index}`);
  assertString(input.code, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, 'GRAPH_FAILURE_CODE', `failure ${index} code`);
  if (typeof input.diagnostic !== 'boolean') fail('GRAPH_FAILURE_DIAGNOSTIC', `${input.code} diagnostic must be boolean`);
  return {
    code: input.code,
    kind: assertEnum(input.kind, ['input', 'capacity', 'cancellation', 'compatibility', 'exhaustion', 'publication', 'quiescence', 'internal'], 'GRAPH_FAILURE_KIND', `${input.code} kind`),
    diagnostic: input.diagnostic,
  };
}

function normalizePort(input, index, objectById, failureCodes) {
  exactKeys(input, ['id', 'contract', 'objectKinds', 'bounds', 'completion', 'failures'], 'GRAPH_PORT_FIELDS', `port ${index}`);
  assertEnum(input.id, [...BASE_PORTS, ...RECLAIM_PORTS], 'GRAPH_PORT_ID', `port ${index} id`);
  const objectKinds = stringSet(input.objectKinds, { code: 'GRAPH_PORT_OBJECTS', label: `${input.id} objectKinds`, namespaced: true });
  for (const object of objectKinds) if (!objectById.has(object)) fail('GRAPH_PORT_OBJECT', `${input.id} names unknown object kind ${object}`);
  const failures = stringSet(input.failures, { code: 'GRAPH_PORT_FAILURES', label: `${input.id} failures`, minimum: 1 });
  for (const failure of failures) if (!failureCodes.has(failure)) fail('GRAPH_PORT_FAILURE', `${input.id} names undeclared failure ${failure}`);
  return {
    id: input.id,
    contract: normalizeSchemaReference(input.contract, `${input.id} contract`),
    objectKinds,
    bounds: normalizeBounds(input.bounds, `${input.id} bounds`),
    completion: assertEnum(input.completion, ['bounded', 'finite-resumable'], 'GRAPH_PORT_COMPLETION', `${input.id} completion`),
    failures,
  };
}

function normalizeResource(input, index, failureCodes) {
  exactKeys(input, ['id', 'unit', 'minimum', 'maximum', 'alignment', 'scope', 'pressureOutcome'], 'GRAPH_RESOURCE_FIELDS', `resource ${index}`);
  assertNamespacedId(input.id, 'GRAPH_RESOURCE_ID', `resource ${index} id`);
  const minimum = normalizeDecimalUint(input.minimum, `${input.id} minimum`);
  const maximum = normalizeDecimalUint(input.maximum, `${input.id} maximum`);
  if (compareDecimalUint(minimum, maximum) > 0) fail('GRAPH_RESOURCE_RANGE', `${input.id} minimum exceeds maximum`);
  assertString(input.pressureOutcome, /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/, 'GRAPH_RESOURCE_PRESSURE', `${input.id} pressureOutcome`);
  if (!failureCodes.has(input.pressureOutcome)) fail('GRAPH_RESOURCE_PRESSURE', `${input.id} pressureOutcome is undeclared`);
  return {
    id: input.id,
    unit: assertEnum(input.unit, ['bytes', 'slots', 'records', 'references', 'work-units', 'diagnostics'], 'GRAPH_RESOURCE_UNIT', `${input.id} unit`),
    minimum,
    maximum,
    alignment: positiveDecimal(input.alignment, 'GRAPH_RESOURCE_ALIGNMENT', `${input.id} alignment`),
    scope: assertEnum(input.scope, ['per-engine', 'per-worker', 'per-invocation'], 'GRAPH_RESOURCE_SCOPE', `${input.id} scope`),
    pressureOutcome: input.pressureOutcome,
  };
}

function normalizeDiagnostics(input) {
  exactKeys(input, ['authority', 'maxRecords', 'maxBytes', 'overflow', 'rawAddresses'], 'GRAPH_DIAGNOSTIC_FIELDS', 'diagnostics');
  if (input.authority !== 'non-authoritative' || input.rawAddresses !== false) fail('GRAPH_DIAGNOSTIC_AUTHORITY', 'diagnostics must be non-authoritative and address-free');
  return {
    authority: input.authority,
    maxRecords: normalizeDecimalUint(input.maxRecords, 'diagnostics maxRecords'),
    maxBytes: normalizeDecimalUint(input.maxBytes, 'diagnostics maxBytes'),
    overflow: assertEnum(input.overflow, ['drop', 'count', 'terminal'], 'GRAPH_DIAGNOSTIC_OVERFLOW', 'diagnostics overflow'),
    rawAddresses: false,
  };
}

function normalizeCompatibility(input, arena) {
  exactKeys(input, ['domainIdentityRequired', 'persistence'], 'GRAPH_COMPAT_FIELDS', 'compatibility');
  if (input.domainIdentityRequired !== true) fail('GRAPH_COMPAT_DOMAIN', 'graph compatibility must bind domain identity');
  let persistence;
  if (input.persistence?.kind === 'none') {
    exactKeys(input.persistence, ['kind'], 'GRAPH_PERSISTENCE_FIELDS', 'persistence');
    persistence = { kind: 'none' };
  } else {
    exactKeys(input.persistence, ['kind', 'encoding', 'namespace', 'integrity', 'crashPublication', 'recovery', 'migration', 'rollback', 'referenceReconstruction', 'ownerCleanup'], 'GRAPH_PERSISTENCE_FIELDS', 'persistence');
    if (input.persistence.kind !== 'versioned') fail('GRAPH_PERSISTENCE_KIND', 'persistence kind is invalid');
    assertNamespacedId(input.persistence.namespace, 'GRAPH_PERSISTENCE_NAMESPACE', 'persistence namespace');
    persistence = { kind: 'versioned', namespace: input.persistence.namespace };
    for (const field of ['encoding', 'integrity', 'crashPublication', 'recovery', 'migration', 'rollback', 'referenceReconstruction', 'ownerCleanup']) {
      persistence[field] = normalizeSchemaReference(input.persistence[field], `persistence ${field}`);
    }
  }
  if ((arena.incarnationScope === 'persistence-namespace') !== (persistence.kind === 'versioned')) fail('GRAPH_PERSISTENCE_SCOPE', 'arena persistence scope and persistence contract must be selected together');
  return { domainIdentityRequired: true, persistence };
}

function normalizeProgram(input, mode) {
  if (input?.kind === 'none') {
    exactKeys(input, ['kind'], 'GRAPH_PROGRAM_FIELDS', 'programContribution');
    if (mode !== 'stateless') fail('GRAPH_PROGRAM_ABSENCE', 'materialized graph requires a program contribution');
    return { kind: 'none' };
  }
  exactKeys(input, ['kind', 'language', 'sourceIdentity', 'inputs', 'provenance'], 'GRAPH_PROGRAM_FIELDS', 'programContribution');
  if (input.kind !== 'device-program' || input.language !== 'restricted-device-js' || mode !== 'materialized') fail('GRAPH_PROGRAM_LANGUAGE', 'graph program contribution must be materialized restricted Device-JS');
  if (!Array.isArray(input.inputs)) fail('GRAPH_PROGRAM_INPUTS', 'program inputs must be an array');
  const inputs = input.inputs.map((entry, index) => normalizeProfileReference(entry, `program input ${index}`)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(inputs, 'id', 'GRAPH_PROGRAM_INPUT_DUPLICATE', 'program input');
  exactKeys(input.provenance, ['origin', 'revision', 'license'], 'GRAPH_PROGRAM_PROVENANCE_FIELDS', 'program provenance');
  assertEnum(input.provenance.origin, ['first-party', 'third-party-reviewed'], 'GRAPH_PROGRAM_ORIGIN', 'program provenance origin');
  assertString(input.provenance.revision, /^[0-9a-f]{40}$/, 'GRAPH_PROGRAM_REVISION', 'program provenance revision');
  if (typeof input.provenance.license !== 'string' || input.provenance.license.length === 0) fail('GRAPH_PROGRAM_LICENSE', 'program provenance license is invalid');
  return {
    kind: input.kind,
    language: input.language,
    sourceIdentity: normalizeContentIdentity(input.sourceIdentity, 'GRAPH_PROGRAM_SOURCE', 'program sourceIdentity'),
    inputs,
    provenance: { ...input.provenance },
  };
}

function assertStateless(profile) {
  if (profile.arena.kind !== 'none' || profile.referenceEncoding.kind !== 'none' || profile.transposition.kind !== 'none'
      || profile.path.kind !== 'none' || profile.rootProtection.kind !== 'none' || profile.reclamation.kind !== 'none'
      || profile.programContribution.kind !== 'none') fail('GRAPH_STATELESS_RESIDUE', 'stateless graph retains selected machinery');
  for (const field of ['objectKinds', 'layouts', 'ownerRegions', 'publications', 'ports', 'resources', 'failures']) {
    if (profile[field].length !== 0) fail('GRAPH_STATELESS_RESIDUE', `stateless graph retains ${field}`);
  }
  if (profile.diagnostics.maxRecords !== '0' || profile.diagnostics.maxBytes !== '0') fail('GRAPH_STATELESS_RESIDUE', 'stateless graph retains diagnostic capacity');
}

export function normalizeGraphProfile(input, inspectedCatalog, domainProfileResult) {
  exactKeys(input, ['schema', 'representation', 'status', 'contract', 'id', 'version', 'domainProfile', 'mode', 'arena', 'referenceEncoding', 'objectKinds', 'layouts', 'ownerRegions', 'transposition', 'path', 'rootProtection', 'reclamation', 'publications', 'ports', 'resources', 'failures', 'diagnostics', 'compatibility', 'programContribution'], 'GRAPH_ROOT_FIELDS', 'graph profile');
  if (input.schema !== GRAPH_PROFILE_SCHEMA || input.representation !== REPRESENTATION) fail('GRAPH_SCHEMA', 'unsupported graph profile schema/representation');
  if (input.status !== 'proposal-evidence') fail('GRAPH_STATUS', 'graph profile must remain proposal evidence');
  assertNamespacedId(input.id, 'GRAPH_PROFILE_ID', 'graph profile id');
  assertVersion(input.version, 'GRAPH_PROFILE_VERSION', 'graph profile version');
  const contracts = inspectedCatalog?.contractSet?.contracts;
  if (!contracts) fail('GRAPH_CATALOG', 'inspected contract set is required');
  const catalogById = new Map(contracts.map((contract) => [contract.id, contract]));
  const mode = assertEnum(input.mode, ['materialized', 'stateless'], 'GRAPH_MODE', 'graph mode');
  const arena = normalizeArena(input.arena);
  const referenceEncoding = normalizeReferenceEncoding(input.referenceEncoding);
  if (mode === 'materialized' && (arena.kind !== 'finite' || referenceEncoding.kind !== 'typed-index-generation')) fail('GRAPH_MATERIALIZED_FOUNDATION', 'materialized graph requires finite arena and typed references');
  if (arena.kind === 'finite' && compareDecimalUint(arena.maxIncarnations, referenceEncoding.arenaRange) > 0) fail('GRAPH_ARENA_RANGE', 'arena incarnation range exceeds reference encoding');

  if (!Array.isArray(input.objectKinds)) fail('GRAPH_OBJECT_COUNT', 'objectKinds must be an array');
  const objectKinds = input.objectKinds.map((object, index) => normalizeObjectKind(object, index, referenceEncoding)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(objectKinds, 'id', 'GRAPH_OBJECT_DUPLICATE', 'object kind');
  uniqueBy(objectKinds, 'role', 'GRAPH_OBJECT_ROLE_DUPLICATE', 'object role');
  uniqueBy(objectKinds, 'referenceTag', 'GRAPH_OBJECT_TAG_DUPLICATE', 'reference tag');
  const objectById = new Map(objectKinds.map((object) => [object.id, object]));

  if (!Array.isArray(input.layouts)) fail('GRAPH_LAYOUT_COUNT', 'layouts must be an array');
  const layouts = input.layouts.map((layout, index) => normalizeLayout(layout, index, objectById, referenceEncoding)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(layouts, 'id', 'GRAPH_LAYOUT_DUPLICATE', 'layout');
  uniqueBy(layouts, 'objectKind', 'GRAPH_LAYOUT_OBJECT_DUPLICATE', 'layout object kind');
  if (layouts.length !== objectKinds.length) fail('GRAPH_LAYOUT_COUNT', 'every object kind requires exactly one layout');
  const layoutByObject = new Map(layouts.map((layout) => [layout.objectKind, layout]));

  if (!Array.isArray(input.ownerRegions)) fail('GRAPH_OWNER_REGION_COUNT', 'ownerRegions must be an array');
  const ownerRegions = input.ownerRegions.map((region, index) => normalizeOwnerRegion(region, index, objectById, catalogById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(ownerRegions, 'id', 'GRAPH_OWNER_REGION_DUPLICATE', 'owner region');
  assertRegionLayouts(layouts, ownerRegions);

  const domainProfile = normalizeDomainProfile(input.domainProfile, domainProfileResult);
  for (const region of ownerRegions.filter(({ semanticRole }) => semanticRole.startsWith('domain-'))) {
    if (region.ownerProfile.id !== domainProfile.id || region.ownerProfile.identity.sha256 !== domainProfile.identity.sha256) fail('GRAPH_OWNER_REGION_DOMAIN', `${region.id} does not bind the selected domain profile`);
  }

  const transposition = normalizeTransposition(input.transposition, domainProfile, objectById, layoutByObject);
  const path = normalizePath(input.path, domainProfile, objectById, layoutByObject);
  const rootProtection = normalizeRootProtection(input.rootProtection, objectById, layoutByObject);
  const reclamation = normalizeReclamation(input.reclamation, objectById);

  if (!Array.isArray(input.publications)) fail('GRAPH_PUBLICATION_COUNT', 'publications must be an array');
  const publications = input.publications.map((publication, index) => normalizePublication(publication, index, objectById)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(publications, 'id', 'GRAPH_PUBLICATION_DUPLICATE', 'publication');
  for (const object of objectKinds) for (const readyState of object.lifecycle.readyStates) {
    if (!publications.some((publication) => publication.objectKind === object.id && publication.readyState === readyState)) {
      fail('GRAPH_PUBLICATION_REQUIRED', `${object.id} ready state ${readyState} has no publication contract`);
    }
  }

  if (!Array.isArray(input.failures)) fail('GRAPH_FAILURE_COUNT', 'failures must be an array');
  const failures = input.failures.map(normalizeFailure).sort((left, right) => compareRaw(left.code, right.code));
  uniqueBy(failures, 'code', 'GRAPH_FAILURE_DUPLICATE', 'failure');
  const failureCodes = new Set(failures.map(({ code }) => code));

  if (!Array.isArray(input.ports)) fail('GRAPH_PORT_COUNT', 'ports must be an array');
  const ports = input.ports.map((port, index) => normalizePort(port, index, objectById, failureCodes)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(ports, 'id', 'GRAPH_PORT_DUPLICATE', 'port');

  if (!Array.isArray(input.resources)) fail('GRAPH_RESOURCE_COUNT', 'resources must be an array');
  const resources = input.resources.map((resource, index) => normalizeResource(resource, index, failureCodes)).sort((left, right) => compareRaw(left.id, right.id));
  uniqueBy(resources, 'id', 'GRAPH_RESOURCE_DUPLICATE', 'resource');

  const diagnostics = normalizeDiagnostics(input.diagnostics);
  const compatibility = normalizeCompatibility(input.compatibility, arena);
  const programContribution = normalizeProgram(input.programContribution, mode);

  const normalized = {
    schema: input.schema,
    representation: input.representation,
    status: input.status,
    contract: normalizeCatalogContract(input.contract, catalogById, GRAPH_CONTRACT, 'GRAPH_CONTRACT', 'graph contract'),
    id: input.id,
    version: input.version,
    domainProfile,
    mode,
    arena,
    referenceEncoding,
    objectKinds,
    layouts,
    ownerRegions,
    transposition,
    path,
    rootProtection,
    reclamation,
    publications,
    ports,
    resources,
    failures,
    diagnostics,
    compatibility,
    programContribution,
  };

  if (mode === 'stateless') {
    assertStateless(normalized);
  } else {
    const roles = new Set(objectKinds.map(({ role }) => role));
    for (const required of MATERIALIZED_ROLES) if (!roles.has(required)) fail('GRAPH_OBJECT_REQUIRED', `materialized graph omits ${required}`);
    if (transposition.kind === 'none') fail('GRAPH_TRANSPOSITION_RESIDUE', 'materialized graph must select verified sharing or isolated nodes');
    if (path.kind === 'none') fail('GRAPH_PATH_RESIDUE', 'materialized graph retains path objects without bounded path semantics');
    if (rootProtection.kind === 'none') fail('GRAPH_ROOT_RESIDUE', 'materialized graph retains root/protection objects without root protection semantics');
    if ((transposition.kind === 'verified-sharing') !== roles.has('transposition-entry')) fail('GRAPH_TRANSPOSITION_RESIDUE', 'transposition entry presence differs from sharing selection');
    if ((reclamation.kind === 'enabled') !== roles.has('retirement-record')) fail('GRAPH_RECLAIM_RESIDUE', 'retirement record presence differs from reclamation selection');
    for (const required of REQUIRED_FAILURES) if (!failureCodes.has(required)) fail('GRAPH_FAILURE_REQUIRED', `required failure ${required} is absent`);
    const portIds = new Set(ports.map(({ id }) => id));
    for (const required of BASE_PORTS) if (!portIds.has(required)) fail('GRAPH_PORT_REQUIRED', `required port ${required} is absent`);
    for (const port of RECLAIM_PORTS) if (portIds.has(port) !== (reclamation.kind === 'enabled')) fail('GRAPH_RECLAIM_RESIDUE', `port ${port} presence differs from reclamation selection`);
    if (resources.length === 0 || publications.length === 0) fail('GRAPH_MATERIALIZED_EVIDENCE', 'materialized graph requires finite resources and publications');
    const pressureOutcomes = new Set(resources.map(({ pressureOutcome }) => pressureOutcome));
    for (const required of REQUIRED_RESOURCE_PRESSURES) if (!pressureOutcomes.has(required)) fail('GRAPH_RESOURCE_REQUIRED', `graph resources omit ${required}`);
    if (pressureOutcomes.has('transposition-capacity') !== (transposition.kind === 'verified-sharing')) fail('GRAPH_TRANSPOSITION_RESIDUE', 'transposition resource presence differs from sharing selection');
    if (pressureOutcomes.has('reclamation-not-quiescent') !== (reclamation.kind === 'enabled')) fail('GRAPH_RECLAIM_RESIDUE', 'reclamation resource presence differs from reclamation selection');
    const roleObject = new Map(objectKinds.map((object) => [object.role, object.id]));
    const edgeSlotCapacity = resources
      .filter(({ unit, pressureOutcome, scope }) => unit === 'slots' && pressureOutcome === 'edge-capacity' && scope === 'per-engine')
      .reduce((total, { maximum }) => addDecimalUint(total, maximum), '0');
    const structuralEdgeDemand = addDecimalUint(
      layoutByObject.get(roleObject.get('parent-edge')).capacity,
      layoutByObject.get(roleObject.get('expansion')).capacity,
    );
    if (compareDecimalUint(edgeSlotCapacity, structuralEdgeDemand) < 0) {
      fail('GRAPH_RESOURCE_CAPACITY', 'edge-capacity slot resources cannot cover parent-edge plus expansion layout capacity');
    }
    const protectionSlotCapacity = resources
      .filter(({ unit, pressureOutcome, scope }) => unit === 'slots' && pressureOutcome === 'protection-capacity' && scope === 'per-engine')
      .reduce((total, { maximum }) => addDecimalUint(total, maximum), '0');
    const protectionDemand = layoutByObject.get(roleObject.get('protection-record')).capacity;
    if (compareDecimalUint(protectionSlotCapacity, protectionDemand) < 0) {
      fail('GRAPH_RESOURCE_CAPACITY', 'protection-capacity slot resources cannot cover protection-record layout capacity');
    }
    const requiredRegions = [['domain-state', roleObject.get('state-node')], ['domain-action', roleObject.get('parent-edge')]];
    if (domainProfileResult.normalized.history.disposition === 'carried' || domainProfileResult.normalized.history.disposition === 'hybrid') requiredRegions.push(['domain-history', roleObject.get('path-occurrence')]);
    for (const [semanticRole, objectKind] of requiredRegions) {
      if (!ownerRegions.some((region) => region.semanticRole === semanticRole && region.objectKind === objectKind)) fail('GRAPH_OWNER_REGION_REQUIRED', `missing ${semanticRole} region on ${objectKind}`);
    }
    if (domainProfileResult.normalized.history.disposition === 'none' && ownerRegions.some(({ semanticRole }) => semanticRole === 'domain-history')) fail('GRAPH_OWNER_REGION_DOMAIN', 'history-independent domain retains a domain-history region');
  }

  return { normalized, identity: canonicalIdentity(normalized) };
}

export const graphConstants = Object.freeze({
  schema: GRAPH_PROFILE_SCHEMA,
  representation: REPRESENTATION,
  objectRoles: Object.freeze([...OBJECT_ROLES]),
  basePorts: Object.freeze([...BASE_PORTS]),
  reclaimPorts: Object.freeze([...RECLAIM_PORTS]),
  requiredFailures: Object.freeze([...REQUIRED_FAILURES]),
});

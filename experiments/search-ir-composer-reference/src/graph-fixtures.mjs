import { createHash } from 'node:crypto';

import { multiplyDecimalUint } from './validation.mjs';

const VERSION = '0.1.0';
const REVISION = 'ee5b0348585842096324c315a079d05cbe64b9d4';
const MATERIALIZED_ROLES = ['state-node', 'parent-edge', 'expansion', 'active-path', 'path-occurrence', 'root-anchor', 'protection-record'];
const BASE_PORTS = [
  'append-path-occurrence', 'close-expansion', 'close-path', 'fail-edge', 'fail-node', 'lookup-or-claim-node', 'open-expansion', 'open-path',
  'protect-root-anchor', 'publish-edge-action', 'publish-edge-child', 'publish-expansion-batch', 'publish-node', 'read-path-view', 'release-root-anchor',
  'reserve-edge', 'validate-reference',
];

function sha256(label) {
  return createHash('sha256').update(label, 'utf8').digest('hex');
}

function schemaReference(id) {
  return { id: `${id}/${VERSION}`, version: VERSION, sha256: sha256(`schema:${id}/${VERSION}`) };
}

function contentIdentity(label) {
  return { algorithm: 'sha256', sha256: sha256(`content:${label}`) };
}

function identityReference(identity) {
  return { algorithm: identity.algorithm, sha256: identity.sha256 };
}

function catalogContract(catalogById, id) {
  const contract = catalogById.get(id);
  return { kind: 'catalog', id, specificationIdentity: contract.specificationIdentity, sha256: contract.sha256 };
}

function profileReference(profile, schemaId = `cuda-mcgs.${profile}-profile/0.2.0`) {
  return {
    id: profile,
    schema: { id: schemaId, version: '0.2.0', sha256: sha256(`schema:${schemaId}`) },
    identity: contentIdentity(`${profile}:profile`),
  };
}

function domainReference(domainResult, domainSchemaSha) {
  const ports = new Map(domainResult.normalized.ports.map((port) => [port.id, port.contract]));
  return {
    id: domainResult.normalized.id,
    schema: { id: domainResult.normalized.schema, version: '0.2.0', sha256: domainSchemaSha },
    identity: identityReference(domainResult.identity),
    identityKeyPort: ports.get('identity-key'),
    equalStatePort: ports.get('equal-state'),
    classifyPathRelationPort: ports.get('classify-path-relation'),
  };
}

function state(profile, name) {
  return `graph.${profile}.state-${name}`;
}

function lifecycle(profile, role, reclamation) {
  const id = (name) => state(`${profile}-${role}`, name);
  const transition = (from, to, visibility) => ({ from: id(from), to: id(to), visibility });
  let states;
  let transitions;
  let readyStates;
  let terminalStates;
  if (role === 'state-node') {
    states = ['free', 'reserved', 'initializing', 'ready', 'failed'];
    transitions = [transition('free', 'reserved', 'private'), transition('reserved', 'initializing', 'private'), transition('initializing', 'ready', 'release-publication'), transition('initializing', 'failed', 'terminal-publication')];
    readyStates = ['ready']; terminalStates = ['failed'];
  } else if (role === 'parent-edge') {
    states = ['free', 'reserved', 'action-ready', 'child-pending', 'ready', 'failed'];
    transitions = [transition('free', 'reserved', 'private'), transition('reserved', 'action-ready', 'release-publication'), transition('action-ready', 'child-pending', 'private'), transition('child-pending', 'ready', 'release-publication'), transition('reserved', 'failed', 'terminal-publication'), transition('action-ready', 'failed', 'terminal-publication'), transition('child-pending', 'failed', 'terminal-publication')];
    readyStates = ['action-ready', 'ready']; terminalStates = ['failed'];
  } else if (role === 'expansion') {
    states = ['unexpanded', 'claimed', 'open', 'complete', 'failed', 'cancelled'];
    transitions = [transition('unexpanded', 'claimed', 'private'), transition('claimed', 'open', 'release-publication'), transition('open', 'complete', 'release-publication'), transition('claimed', 'failed', 'terminal-publication'), transition('open', 'failed', 'terminal-publication'), transition('claimed', 'cancelled', 'terminal-publication'), transition('open', 'cancelled', 'terminal-publication')];
    readyStates = ['open', 'complete']; terminalStates = ['cancelled', 'failed'];
  } else if (role === 'active-path') {
    states = ['free', 'active', 'completing', 'released', 'abandoned', 'failed'];
    transitions = [
      transition('free', 'active', 'release-publication'),
      transition('active', 'completing', 'private'),
      transition('completing', 'released', 'terminal-publication'),
      transition('active', 'abandoned', 'terminal-publication'),
      transition('active', 'failed', 'terminal-publication'),
      transition('released', 'free', 'private'),
      transition('abandoned', 'free', 'private'),
      transition('failed', 'free', 'private'),
    ];
    readyStates = ['active']; terminalStates = ['abandoned', 'failed', 'released'];
  } else if (role === 'path-occurrence') {
    states = ['free', 'reserved', 'ready', 'failed'];
    transitions = [
      transition('free', 'reserved', 'private'),
      transition('reserved', 'ready', 'release-publication'),
      transition('reserved', 'failed', 'terminal-publication'),
      transition('ready', 'free', 'private'),
      transition('failed', 'free', 'private'),
    ];
    readyStates = ['ready']; terminalStates = ['failed'];
  } else if (role === 'transposition-entry') {
    states = ['empty', 'claimed', 'ready', 'failed', 'tombstone'];
    transitions = [transition('empty', 'claimed', 'private'), transition('claimed', 'ready', 'release-publication'), transition('claimed', 'failed', 'terminal-publication'), transition('claimed', 'tombstone', 'terminal-publication')];
    readyStates = ['ready']; terminalStates = ['failed', 'tombstone'];
  } else if (role === 'root-anchor' || role === 'protection-record') {
    states = ['free', 'ready', 'released', 'failed'];
    transitions = [transition('free', 'ready', 'release-publication'), transition('ready', 'released', 'terminal-publication'), transition('free', 'failed', 'terminal-publication')];
    readyStates = ['ready']; terminalStates = ['failed', 'released'];
  } else {
    states = ['free', 'ready', 'failed'];
    transitions = [transition('free', 'ready', 'release-publication'), transition('free', 'failed', 'terminal-publication')];
    readyStates = ['ready']; terminalStates = ['failed'];
  }
  if (reclamation && ['state-node', 'parent-edge', 'expansion', 'path-occurrence', 'transposition-entry'].includes(role)) {
    states.push('retiring', 'reclaimable');
    transitions.push(...readyStates.map((ready) => transition(ready, 'retiring', 'private')),
      ...terminalStates.map((terminal) => transition(terminal, 'retiring', 'private')),
      transition('retiring', 'reclaimable', 'private'), transition('reclaimable', states[0], 'private'));
  }
  return {
    schema: schemaReference(`cuda-mcgs.synthetic-${profile}-${role}-lifecycle`),
    initialState: id(states[0]),
    states: states.map(id),
    transitions,
    readyStates: readyStates.map(id),
    terminalStates: terminalStates.map(id),
  };
}

function objectKinds(profile, { transposition = true, reclamation = false } = {}) {
  const roles = [...MATERIALIZED_ROLES];
  if (transposition) roles.push('transposition-entry');
  if (reclamation) roles.push('retirement-record');
  return roles.map((role, index) => ({
    id: `graph.${profile}.object-${role}`,
    role,
    referenceTag: `${index + 1}`,
    lifecycle: lifecycle(profile, role, reclamation),
  }));
}

function objectId(profile, role) {
  return `graph.${profile}.object-${role}`;
}

function layout(profile, role, { capacity = '4096', recordBytes = '64', graphBytes = '32', family = 'fixed-record' } = {}) {
  return {
    id: `graph.${profile}.layout-${role}`,
    objectKind: objectId(profile, role),
    family,
    capacity,
    recordBytes,
    bytePool: multiplyDecimalUint(capacity, recordBytes),
    alignment: '8',
    identifierRange: '18446744073709551615',
    offsetRange: '340282366920938463463374607431768211455',
    generationRange: '18446744073709551615',
    graphRegion: { schema: schemaReference(`cuda-mcgs.synthetic-${profile}-${role}-graph-region`), offsetBytes: '0', sizeBytes: graphBytes, alignmentBytes: '8' },
  };
}

function layouts(profile, { transposition = true, reclamation = false, history = false } = {}) {
  const result = [
    layout(profile, 'state-node', { recordBytes: '352', graphBytes: '32', family: 'variable-record' }),
    layout(profile, 'parent-edge', { recordBytes: '128', graphBytes: '32' }),
    layout(profile, 'expansion'),
    layout(profile, 'active-path', { capacity: '256' }),
    layout(profile, 'path-occurrence', { capacity: '4096', recordBytes: history ? '320' : '64' }),
    layout(profile, 'root-anchor', { capacity: '8' }),
    layout(profile, 'protection-record', { capacity: '8192' }),
  ];
  if (transposition) result.push(layout(profile, 'transposition-entry', { capacity: '8192' }));
  if (reclamation) result.push(layout(profile, 'retirement-record', { capacity: '4096' }));
  return result;
}

function ownerRegion(profile, domainResult, domainSchemaSha, catalogById, semanticRole, objectRole, offsetBytes, sizeBytes) {
  return {
    id: `graph.${profile}.region-${semanticRole}`,
    semanticRole,
    objectKind: objectId(profile, objectRole),
    ownerContract: catalogContract(catalogById, 'SPEC-0007'),
    ownerProfile: {
      id: domainResult.normalized.id,
      schema: { id: domainResult.normalized.schema, version: '0.2.0', sha256: domainSchemaSha },
      identity: identityReference(domainResult.identity),
    },
    layout: schemaReference(`cuda-mcgs.synthetic-${profile}-${semanticRole}-layout`),
    lifecycle: schemaReference(`cuda-mcgs.synthetic-${profile}-${semanticRole}-lifecycle`),
    referenceHandling: profile === 'synthetic-reclaiming' && semanticRole === 'domain-state'
      ? { kind: 'owner-lifecycle', actions: ['fixup', 'release', 'validate'] }
      : { kind: 'none' },
    offsetBytes,
    sizeBytes,
    alignmentBytes: '8',
    permissions: ['initialize', 'read', 'cleanup'],
    persistence: 'ephemeral',
  };
}

function ownerRegions(profile, domainResult, domainSchemaSha, catalogById) {
  const result = [
    ownerRegion(profile, domainResult, domainSchemaSha, catalogById, 'domain-state', 'state-node', '32', '256'),
    ownerRegion(profile, domainResult, domainSchemaSha, catalogById, 'domain-action', 'parent-edge', '32', '64'),
  ];
  if (['carried', 'hybrid'].includes(domainResult.normalized.history.disposition)) result.push(ownerRegion(profile, domainResult, domainSchemaSha, catalogById, 'domain-history', 'path-occurrence', '32', '256'));
  return result;
}

function publication(profile, object, producer, consumer, readyIndex) {
  const lifecycleInput = lifecycle(profile, object, profile.includes('reclaiming'));
  return {
    id: `graph.${profile}.publication-${object}-${readyIndex + 1}`,
    objectKind: objectId(profile, object),
    producer: `graph.${profile}.${producer}`,
    consumers: [`graph.${profile}.${consumer}`],
    payloadOwner: `graph.${profile}.owner-${object}`,
    readyState: lifecycleInput.readyStates[readyIndex],
    terminalStates: lifecycleInput.terminalStates,
    visibility: 'release-acquire',
    wait: 'device-progress-terminal-aware',
  };
}

function publications(profile, { reclamation = false, transposition = true } = {}) {
  const definitions = [
    ['state-node', 'node-initializer', 'node-consumer'],
    ['parent-edge', 'edge-initializer', 'edge-consumer'],
    ['expansion', 'expansion-producer', 'expansion-consumer'],
    ['active-path', 'path-owner', 'path-consumer'],
    ['path-occurrence', 'path-owner', 'path-consumer'],
    ['root-anchor', 'root-protector', 'root-consumer'],
    ['protection-record', 'protection-owner', 'protection-consumer'],
  ];
  if (transposition) definitions.push(['transposition-entry', 'claim-winner', 'lookup-consumer']);
  if (reclamation) definitions.push(['retirement-record', 'retirement-owner', 'reclamation-consumer']);
  return definitions.flatMap(([object, producer, consumer]) => lifecycle(profile, object, reclamation).readyStates
    .map((_, readyIndex) => publication(profile, object, producer, consumer, readyIndex)));
}

function failures() {
  const kinds = {
    'action-byte-capacity': 'capacity', 'arena-incarnation-mismatch': 'input', cancelled: 'cancellation', 'edge-capacity': 'capacity',
    'generation-exhausted': 'exhaustion', 'graph-internal-failure': 'internal', 'invalid-graph-profile': 'input', 'invalid-reference': 'input',
    'node-capacity': 'capacity', 'owner-lifecycle-failure': 'compatibility', 'path-capacity': 'capacity', 'path-depth': 'capacity',
    'protection-capacity': 'capacity', 'publication-conflict': 'publication', 'reclamation-not-quiescent': 'quiescence', 'reference-kind-mismatch': 'input', 'stale-reference': 'input',
    'state-byte-capacity': 'capacity', 'transposition-capacity': 'capacity', 'transposition-probe-exhausted': 'capacity',
  };
  return Object.entries(kinds).map(([code, kind]) => ({ code, kind, diagnostic: true }));
}

function bounds(work = '128') {
  return { maxWorkUnits: work, maxReads: '64', maxWrites: '32', cancellationObservationWorkUnits: '16' };
}

function port(profile, id, roles, { resumable = false } = {}) {
  return {
    id,
    contract: schemaReference(`cuda-mcgs.synthetic-${profile}-port-${id}`),
    objectKinds: roles.map((role) => objectId(profile, role)),
    bounds: bounds(),
    completion: resumable ? 'finite-resumable' : 'bounded',
    failures: ['cancelled', 'graph-internal-failure', 'invalid-reference'],
  };
}

function ports(profile, { reclamation = false } = {}) {
  const roleMap = {
    'append-path-occurrence': ['active-path', 'path-occurrence', 'state-node', 'parent-edge'], 'close-expansion': ['expansion'], 'close-path': ['active-path', 'path-occurrence'],
    'fail-edge': ['parent-edge'], 'fail-node': ['state-node'], 'lookup-or-claim-node': ['state-node', 'transposition-entry'], 'open-expansion': ['state-node', 'expansion'],
    'open-path': ['active-path'], 'protect-root-anchor': ['state-node', 'root-anchor', 'protection-record'], 'publish-edge-action': ['parent-edge'],
    'publish-edge-child': ['parent-edge', 'state-node'], 'publish-expansion-batch': ['expansion', 'parent-edge'], 'publish-node': ['state-node'],
    'read-path-view': ['active-path', 'path-occurrence'], 'release-root-anchor': ['root-anchor', 'protection-record'], 'reserve-edge': ['state-node', 'parent-edge'],
    'validate-reference': ['state-node'],
  };
  const result = BASE_PORTS.map((id) => port(profile, id, roleMap[id].filter((role) => role !== 'transposition-entry' || profile.includes('transposing') || profile.includes('reclaiming')), { resumable: ['lookup-or-claim-node', 'publish-expansion-batch'].includes(id) }));
  if (reclamation) {
    result.push(port(profile, 'retire', ['state-node', 'parent-edge', 'retirement-record']));
    result.push(port(profile, 'prove-quiescent', ['retirement-record', 'protection-record'], { resumable: true }));
    result.push(port(profile, 'reclaim', ['state-node', 'parent-edge', 'transposition-entry', 'retirement-record'], { resumable: true }));
  }
  return result;
}

function resources(profile, { reclamation = false, transposition = true } = {}) {
  const result = [
    { id: `graph.${profile}.resource-node-slots`, unit: 'slots', minimum: '1', maximum: '4096', alignment: '8', scope: 'per-engine', pressureOutcome: 'node-capacity' },
    { id: `graph.${profile}.resource-edge-slots`, unit: 'slots', minimum: '1', maximum: '4096', alignment: '8', scope: 'per-engine', pressureOutcome: 'edge-capacity' },
    { id: `graph.${profile}.resource-expansion-slots`, unit: 'slots', minimum: '1', maximum: '4096', alignment: '8', scope: 'per-engine', pressureOutcome: 'edge-capacity' },
    { id: `graph.${profile}.resource-state-bytes`, unit: 'bytes', minimum: '1', maximum: '1441792', alignment: '8', scope: 'per-engine', pressureOutcome: 'state-byte-capacity' },
    { id: `graph.${profile}.resource-action-bytes`, unit: 'bytes', minimum: '1', maximum: '262144', alignment: '8', scope: 'per-engine', pressureOutcome: 'action-byte-capacity' },
    { id: `graph.${profile}.resource-active-path-slots`, unit: 'slots', minimum: '1', maximum: '256', alignment: '8', scope: 'per-engine', pressureOutcome: 'path-capacity' },
    { id: `graph.${profile}.resource-path-records`, unit: 'records', minimum: '1', maximum: '4096', alignment: '8', scope: 'per-engine', pressureOutcome: 'path-capacity' },
    { id: `graph.${profile}.resource-path-depth`, unit: 'records', minimum: '1', maximum: '4096', alignment: '8', scope: 'per-invocation', pressureOutcome: 'path-depth' },
    { id: `graph.${profile}.resource-protection-slots`, unit: 'slots', minimum: '1', maximum: '8192', alignment: '8', scope: 'per-engine', pressureOutcome: 'protection-capacity' },
  ];
  if (transposition) result.push({ id: `graph.${profile}.resource-transposition`, unit: 'slots', minimum: '1', maximum: '8192', alignment: '8', scope: 'per-engine', pressureOutcome: 'transposition-capacity' });
  if (reclamation) result.push({ id: `graph.${profile}.resource-reclaim-work`, unit: 'work-units', minimum: '1', maximum: '4096', alignment: '8', scope: 'per-engine', pressureOutcome: 'reclamation-not-quiescent' });
  return result;
}

function materialized(profile, inspected, domainResult, domainSchemaSha, { reclamation = false, transposition = true } = {}) {
  const catalogById = new Map(inspected.contractSet.contracts.map((contract) => [contract.id, contract]));
  const objects = objectKinds(profile, { reclamation, transposition });
  return {
    schema: 'cuda-mcgs.graph-profile/0.2.0', representation: 'cuda-mcgs.search-ir/0.2.0', status: 'proposal-evidence',
    contract: catalogContract(catalogById, 'SPEC-0010'), id: `graph.${profile}`, version: VERSION,
    domainProfile: domainReference(domainResult, domainSchemaSha), mode: 'materialized',
    arena: { kind: 'finite', incarnationScope: 'engine-incarnation', maxIncarnations: '18446744073709551615', exhaustion: 'generation-exhausted' },
    referenceEncoding: {
      kind: 'typed-index-generation', schema: schemaReference(`cuda-mcgs.synthetic-${profile}-reference`), kindRange: '255', arenaRange: '18446744073709551615',
      slotRange: '18446744073709551615', generationRange: '18446744073709551615', staleBehavior: 'reject-without-side-effect', rawAddressPublic: false,
    },
    objectKinds: objects,
    layouts: layouts(profile, { reclamation, transposition, history: ['carried', 'hybrid'].includes(domainResult.normalized.history.disposition) }),
    ownerRegions: ownerRegions(profile, domainResult, domainSchemaSha, catalogById),
    transposition: transposition ? {
      kind: 'verified-sharing', scope: 'engine-incarnation', entryObject: objectId(profile, 'transposition-entry'),
      identityKeyPort: domainReference(domainResult, domainSchemaSha).identityKeyPort, equalStatePort: domainReference(domainResult, domainSchemaSha).equalStatePort,
      capacity: '8192', maxCollisionProbes: '64', fullOutcomes: ['transposition-capacity', 'transposition-probe-exhausted'],
    } : { kind: 'isolated-nodes' },
    path: {
      kind: 'bounded', pathObject: objectId(profile, 'active-path'), occurrenceObject: objectId(profile, 'path-occurrence'), maxPaths: '256', maxDepth: '4096',
      protection: schemaReference(`cuda-mcgs.synthetic-${profile}-path-protection`), historyProjection: domainReference(domainResult, domainSchemaSha).classifyPathRelationPort,
      identityBeforeRelation: true,
    },
    rootProtection: {
      kind: 'protected-anchor', anchorObject: objectId(profile, 'root-anchor'), protectionObject: objectId(profile, 'protection-record'), admissionReserve: '2',
      acquireRetireOrdering: schemaReference(`cuda-mcgs.synthetic-${profile}-protect-retire-ordering`),
    },
    reclamation: reclamation ? {
      kind: 'enabled', retirementObject: objectId(profile, 'retirement-record'),
      protectionSources: ['root-anchor', 'active-path', 'in-flight', 'publication-waiter', 'owner-lease', 'retained-borrow'],
      maxWorkUnits: '4096', maxScratchBytes: '65536', quiescence: schemaReference(`cuda-mcgs.synthetic-${profile}-quiescence`),
      transpositionRemoval: 'non-returnable-tombstone', generationAdvance: 'before-slot-reuse', failureStates: ['quarantined', 'reclaimable', 'retained', 'retiring'],
    } : { kind: 'none', disposition: 'retain-until-arena-teardown' },
    publications: publications(profile, { reclamation, transposition }),
    ports: ports(profile, { reclamation }),
    resources: resources(profile, { reclamation, transposition }),
    failures: failures(),
    diagnostics: { authority: 'non-authoritative', maxRecords: '256', maxBytes: '32768', overflow: 'count', rawAddresses: false },
    compatibility: { domainIdentityRequired: true, persistence: { kind: 'none' } },
    programContribution: {
      kind: 'device-program', language: 'restricted-device-js', sourceIdentity: contentIdentity(`${profile}:restricted-device-js-source`),
      inputs: [{ id: domainResult.normalized.id, schema: { id: domainResult.normalized.schema, version: '0.2.0', sha256: domainSchemaSha }, identity: identityReference(domainResult.identity) }],
      provenance: { origin: 'first-party', revision: REVISION, license: 'Apache-2.0' },
    },
  };
}

function stateless(inspected, domainResult, domainSchemaSha) {
  const catalogById = new Map(inspected.contractSet.contracts.map((contract) => [contract.id, contract]));
  return {
    schema: 'cuda-mcgs.graph-profile/0.2.0', representation: 'cuda-mcgs.search-ir/0.2.0', status: 'proposal-evidence',
    contract: catalogContract(catalogById, 'SPEC-0010'), id: 'graph.synthetic-stateless', version: VERSION,
    domainProfile: domainReference(domainResult, domainSchemaSha), mode: 'stateless', arena: { kind: 'none' }, referenceEncoding: { kind: 'none' },
    objectKinds: [], layouts: [], ownerRegions: [], transposition: { kind: 'none' }, path: { kind: 'none' }, rootProtection: { kind: 'none' },
    reclamation: { kind: 'none', disposition: 'retain-until-arena-teardown' }, publications: [], ports: [], resources: [], failures: [],
    diagnostics: { authority: 'non-authoritative', maxRecords: '0', maxBytes: '0', overflow: 'drop', rawAddresses: false },
    compatibility: { domainIdentityRequired: true, persistence: { kind: 'none' } }, programContribution: { kind: 'none' },
  };
}

export function buildGraphProfiles(inspected, domainResults, domainSchemaSha) {
  return [
    { input: materialized('synthetic-transposing', inspected, domainResults[0], domainSchemaSha), domain: domainResults[0] },
    { input: materialized('synthetic-reclaiming', inspected, domainResults[1], domainSchemaSha, { reclamation: true }), domain: domainResults[1] },
    { input: materialized('synthetic-isolated', inspected, domainResults[2], domainSchemaSha, { transposition: false }), domain: domainResults[2] },
    { input: stateless(inspected, domainResults[2], domainSchemaSha), domain: domainResults[2] },
  ];
}

export function graphSyntheticSchemaReference(id) {
  return schemaReference(id);
}

export function graphSyntheticContentIdentity(label) {
  return contentIdentity(label);
}

export function graphSyntheticProfileReference(id) {
  return profileReference(id);
}

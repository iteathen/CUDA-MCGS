import { createHash } from 'node:crypto';

const VERSION = '0.1.0';
const REVISION = 'ed4baa234775ba5795482b562eef5d755e59da66';
const LEDGER_STATES = ['claimed', 'published', 'retired-unreclaimed', 'quarantined'];
const PORTS = [
  'normalize-contribution', 'compose-resource-plan', 'admit-engine-resources', 'reserve-resource', 'reserve-compound',
  'publish-resource-use', 'release-resource', 'retire-resource', 'reclaim-resource-accounting',
  'observe-resource-state', 'terminate-resource-profile',
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

function catalogContract(inspected, id) {
  const contract = inspected.contractSet.contracts.find((entry) => entry.id === id);
  return { kind: 'catalog', id: contract.id, specificationIdentity: contract.specificationIdentity, sha256: contract.sha256 };
}

function profileReference(result, schemaSha) {
  return { id: result.normalized.id, schema: { id: result.normalized.schema, version: '0.2.0', sha256: schemaSha }, identity: identityReference(result.identity) };
}

function syntheticProfileReference(id) {
  return { id, schema: schemaReference(`cuda-mcgs.${id}-profile`), identity: contentIdentity(`${id}:profile`) };
}

function bounds(work = '256') {
  return { maxWorkUnits: work, maxReads: '128', maxWrites: '64', maxRandomInputs: '0', cancellationObservationWorkUnits: '16' };
}

function classRange(maximumInstances) {
  const maximum = BigInt(maximumInstances);
  return {
    identityMaximum: (maximum + 1n).toString(), generationMaximum: '18446744073709551615',
    counterMaximum: '340282366920938463463374607431768211455', sentinelCount: '1', exhaustion: 'terminate-typed',
  };
}

function scopeLifetime(scope) {
  if (scope === 'per-engine') return 'engine';
  if (scope === 'per-worker') return 'work';
  return 'transaction';
}

function ownerPressure(resource) {
  return resource.pressureOutcome ?? resource.pressureStatus;
}

function resourceClass(profile, contributorId, source, options = {}) {
  const id = options.id ?? source.id;
  const maximum = options.maximum ?? source.maximum;
  const basis = options.basis ?? 'maximum-live';
  const singleFixedInstance = ['fixed', 'optional-reserve'].includes(basis);
  const unitsPerInstance = options.unitsPerInstance ?? (singleFixedInstance ? maximum : '1');
  const maximumInstances = options.maximumInstances ?? (singleFixedInstance ? '1' : maximum);
  return {
    id, version: VERSION, contributor: contributorId, consumers: options.consumers ?? ['consumer.search-program'],
    sourceResource: options.sourceResource ?? source.id, unit: options.unit ?? source.unit,
    minimumUnits: options.minimum ?? source.minimum,
    formula: { basis, unitsPerInstance, maximumInstances, maximumUnits: maximum },
    alignment: options.alignment ?? source.alignment,
    memorySpaces: options.memorySpaces ?? source.memorySpaces ?? ['device-search'], access: options.access ?? ['read', 'write', 'atomic'],
    scope: options.scope ?? source.scope, lifetime: options.lifetime ?? scopeLifetime(options.scope ?? source.scope),
    admissionGroup: options.admissionGroup ?? `resource.${profile}.admission-${id.replaceAll('.', '-')}`,
    accounting: schemaReference(`cuda-mcgs.synthetic-${profile}-${id.replaceAll('.', '-')}-accounting`),
    watermark: `resource.${profile}.watermark-${id.replaceAll('.', '-')}`,
    ownerPressureStatus: options.ownerPressureStatus ?? ownerPressure(source), exhaustion: options.exhaustion ?? 'capacity',
    cancellation: schemaReference(`cuda-mcgs.synthetic-${profile}-${id.replaceAll('.', '-')}-cancellation`),
    cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-${id.replaceAll('.', '-')}-cleanup`),
    compatibility: contentIdentity(`${profile}:${id}:compatibility`), range: classRange(maximumInstances),
  };
}

function knownContributor(profile, result, schemaSha, optional = false) {
  return {
    id: `owner.${result.normalized.id}`, contract: result.normalized.contract, profile: profileReference(result, schemaSha), optional,
    classes: result.normalized.resources.filter(({ maximum }) => maximum !== '0').map(({ id }) => id),
    responseContract: schemaReference(`cuda-mcgs.synthetic-${profile}-${result.normalized.id}-pressure-response`),
    cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-${result.normalized.id}-cleanup`),
  };
}

function opaqueContributor(profile, inspected, id, contractId, classIds, optional = false) {
  return {
    id: `owner.${id}`, contract: catalogContract(inspected, contractId), profile: syntheticProfileReference(id), optional, classes: classIds,
    responseContract: schemaReference(`cuda-mcgs.synthetic-${profile}-${id}-pressure-response`), cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-${id}-cleanup`),
  };
}

function internalContributor(profile, inspected, classIds) {
  return {
    id: 'owner.resource-core', contract: catalogContract(inspected, 'SPEC-0011'), profile: syntheticProfileReference(`resource.${profile}.core-contribution`), optional: false, classes: classIds,
    responseContract: schemaReference(`cuda-mcgs.synthetic-${profile}-resource-core-response`), cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-resource-core-cleanup`),
  };
}

function pool(profile, id, unit, capacity, alignment = '8', options = {}) {
  return {
    id, unit, capacity, alignment, memorySpaces: options.memorySpaces ?? ['device-search'], access: options.access ?? ['read', 'write', 'atomic'], lifetime: options.lifetime ?? 'engine',
    fragmentation: schemaReference(`cuda-mcgs.synthetic-${profile}-${id.replaceAll('.', '-')}-fragmentation`), largestGuaranteedRequest: options.largestGuaranteedRequest ?? capacity,
    providerRequirement: `resource.${profile}.provider-${id.replaceAll('.', '-')}`, cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-${id.replaceAll('.', '-')}-pool-cleanup`),
  };
}

function partition(profile, resourceClass, resourcePool, offset = '0', capacity = null) {
  return {
    id: `resource.${profile}.partition-${resourceClass.id.replaceAll('.', '-')}`, pool: resourcePool.id, class: resourceClass.id,
    offset, capacity: capacity ?? resourceClass.formula.maximumUnits, alignment: resourceClass.alignment, alias: { kind: 'none' },
    cleanupOrder: (BigInt(offset) + 1n).toString(),
  };
}

function admissionGroup(profile, id, classes, compound = false) {
  return {
    id, classes: classes.map(({ id: classId }) => classId), globalOrder: classes.map(({ id: classId }) => classId),
    atomicity: compound ? 'all-or-none-transaction' : 'single-cas', rollback: schemaReference(`cuda-mcgs.synthetic-${profile}-${id.replaceAll('.', '-')}-rollback`),
    maxTransactions: compound ? '64' : '4096', provisionalLimits: classes.map((entry) => ({ class: entry.id, maximumUnits: entry.formula.maximumUnits })),
    completion: schemaReference(`cuda-mcgs.synthetic-${profile}-${id.replaceAll('.', '-')}-completion`), cancellation: schemaReference(`cuda-mcgs.synthetic-${profile}-${id.replaceAll('.', '-')}-cancellation`),
  };
}

function ledger(profile, resourceClass) {
  return {
    class: resourceClass.id, states: LEDGER_STATES, conservation: 'capacity-conserved-v1',
    leaseIdentity: schemaReference(`cuda-mcgs.synthetic-${profile}-${resourceClass.id.replaceAll('.', '-')}-lease-identity`),
    publication: schemaReference(`cuda-mcgs.synthetic-${profile}-${resourceClass.id.replaceAll('.', '-')}-ledger-publication`),
    counterMaximum: resourceClass.range.counterMaximum,
    highWater: schemaReference(`cuda-mcgs.synthetic-${profile}-${resourceClass.id.replaceAll('.', '-')}-high-water`),
    failedAdmissions: schemaReference(`cuda-mcgs.synthetic-${profile}-${resourceClass.id.replaceAll('.', '-')}-failed-admissions`),
    releases: schemaReference(`cuda-mcgs.synthetic-${profile}-${resourceClass.id.replaceAll('.', '-')}-releases`),
    terminalDispositions: ['released', 'retired-unreclaimed', 'quarantined', 'owner-equivalent'],
  };
}

function watermark(profile, resourceClass, contributorId, progressReserve) {
  const maximum = BigInt(resourceClass.formula.maximumUnits);
  return {
    id: resourceClass.watermark, class: resourceClass.id, measured: 'claimed', comparison: 'used-at-least',
    normalUpTo: (maximum / 4n).toString(), highAt: (maximum / 2n).toString(), criticalAt: ((maximum * 3n) / 4n).toString(), exhaustedAt: maximum.toString(),
    hysteresis: schemaReference(`cuda-mcgs.synthetic-${profile}-${resourceClass.id.replaceAll('.', '-')}-hysteresis`),
    publication: schemaReference(`cuda-mcgs.synthetic-${profile}-${resourceClass.id.replaceAll('.', '-')}-pressure-publication`),
    responses: [
      { state: 'high', owner: contributorId, response: schemaReference(`cuda-mcgs.synthetic-${profile}-${resourceClass.id.replaceAll('.', '-')}-high-response`), maxWorkUnits: '64', reserve: progressReserve },
      { state: 'critical', owner: contributorId, response: schemaReference(`cuda-mcgs.synthetic-${profile}-${resourceClass.id.replaceAll('.', '-')}-critical-response`), maxWorkUnits: '96', reserve: progressReserve },
      { state: 'exhausted', owner: contributorId, response: schemaReference(`cuda-mcgs.synthetic-${profile}-${resourceClass.id.replaceAll('.', '-')}-exhausted-response`), maxWorkUnits: '128', reserve: progressReserve },
    ],
  };
}

function providerRequirement(profile, resourcePool) {
  return {
    id: resourcePool.providerRequirement, pool: resourcePool.id, unit: resourcePool.unit, capacity: resourcePool.capacity, alignment: resourcePool.alignment,
    memorySpaces: resourcePool.memorySpaces, access: resourcePool.access, lifecycle: schemaReference(`cuda-mcgs.synthetic-${profile}-${resourcePool.id.replaceAll('.', '-')}-provider-lifecycle`),
    opaqueResult: contentIdentity(`${profile}:${resourcePool.id}:opaque-provider-result`),
  };
}

function statuses() {
  const classes = {
    'invalid-resource-profile': 'fatal', 'resource-capacity': 'pressure', 'resource-fragmentation': 'pressure', 'resource-identifier-exhausted': 'stop',
    'resource-generation-exhausted': 'stop', 'resource-counter-exhausted': 'stop', 'resource-provider-failure': 'fatal',
    'resource-pressure-high': 'pressure', 'resource-pressure-critical': 'pressure', 'resource-cancelled': 'cancellation', 'resource-internal-failure': 'fatal',
  };
  return Object.entries(classes).map(([code, statusClass]) => ({ code, class: statusClass, diagnostic: true }));
}

function ports(profile) {
  return PORTS.map((id) => ({
    id,
    phase: ['normalize-contribution', 'compose-resource-plan', 'admit-engine-resources'].includes(id) ? 'host-preignition' : (id === 'terminate-resource-profile' ? 'host-postterminal' : 'device-active'),
    contract: schemaReference(`cuda-mcgs.synthetic-${profile}-port-${id}`), bounds: bounds(id === 'reserve-compound' ? '1024' : '256'),
    completion: id === 'reserve-compound' ? 'finite-transaction' : (id === 'terminate-resource-profile' ? 'must-drain' : 'bounded'),
    statuses: ['resource-capacity', 'resource-cancelled', 'resource-internal-failure'],
  }));
}

function addKnownOwner(profile, result, schemaSha, contributors, classes, optional = false) {
  const contributor = knownContributor(profile, result, schemaSha, optional);
  contributors.push(contributor);
  for (const resource of result.normalized.resources.filter(({ maximum }) => maximum !== '0')) classes.push(resourceClass(profile, contributor.id, resource));
}

function buildProfile(profile, inspected, selected, schemaShas, options = {}) {
  const contributors = [];
  const classes = [];
  addKnownOwner(profile, selected.domain, schemaShas.domain, contributors, classes);
  addKnownOwner(profile, selected.graph, schemaShas.graph, contributors, classes);
  addKnownOwner(profile, selected.policy, schemaShas.policy, contributors, classes);
  if (selected.evaluator) addKnownOwner(profile, selected.evaluator, schemaShas.evaluator, contributors, classes, true);

  const terminalClassId = `resource.${profile}.class-terminal-envelope`;
  const progressClassId = `resource.${profile}.class-progress-cleanup`;
  const ledgerClassId = `resource.${profile}.class-ledger-records`;
  const outputContributor = opaqueContributor(profile, inspected, `output.${profile}`, 'SPEC-0013', [terminalClassId], options.liveOutput === true);
  const progressContributor = opaqueContributor(profile, inspected, `progress.${profile}`, 'SPEC-0012', [progressClassId]);
  const resourceContributor = internalContributor(profile, inspected, [ledgerClassId]);
  contributors.push(outputContributor, progressContributor, resourceContributor);
  const coreAdmission = `resource.${profile}.admission-terminal-progress`;
  const terminalClass = resourceClass(profile, outputContributor.id, { id: terminalClassId, unit: 'bytes', minimum: '4096', maximum: '4096', alignment: '256', scope: 'per-engine', pressureStatus: 'output-terminal-capacity' }, { id: terminalClassId, sourceResource: terminalClassId, basis: 'fixed', admissionGroup: coreAdmission, ownerPressureStatus: 'output-terminal-capacity', memorySpaces: ['device-publication'], access: ['read', 'write', 'publish'] });
  const progressClass = resourceClass(profile, progressContributor.id, { id: progressClassId, unit: 'bytes', minimum: '8192', maximum: '8192', alignment: '256', scope: 'per-engine', pressureStatus: 'progress-cleanup-capacity' }, { id: progressClassId, sourceResource: progressClassId, basis: 'optional-reserve', admissionGroup: coreAdmission, ownerPressureStatus: 'progress-cleanup-capacity' });
  const ledgerClass = resourceClass(profile, resourceContributor.id, { id: ledgerClassId, unit: 'records', minimum: '1024', maximum: '65536', alignment: '8', scope: 'per-engine', pressureStatus: 'resource-capacity' }, { id: ledgerClassId, sourceResource: ledgerClassId, basis: 'maximum-live', ownerPressureStatus: 'resource-capacity' });
  classes.push(terminalClass, progressClass, ledgerClass);

  let rootClass = null;
  if (options.session) {
    const rootClassId = `resource.${profile}.class-root-update`;
    const sessionContributor = opaqueContributor(profile, inspected, `session.${profile}`, 'SPEC-0006', [rootClassId], true);
    contributors.push(sessionContributor);
    rootClass = resourceClass(profile, sessionContributor.id, { id: rootClassId, unit: 'bytes', minimum: '16384', maximum: '16384', alignment: '256', scope: 'per-engine', pressureStatus: 'session-root-update-capacity' }, { id: rootClassId, sourceResource: rootClassId, basis: 'optional-reserve', ownerPressureStatus: 'session-root-update-capacity', memorySpaces: ['device-search', 'device-publication'], access: ['read', 'write', 'atomic', 'publish'], lifetime: 'session' });
    classes.push(rootClass);
  }

  const pools = [];
  const partitions = [];
  const corePool = pool(profile, `resource.${profile}.pool-terminal-progress`, 'bytes', '12288', '256', { memorySpaces: ['device-search', 'device-publication'], access: ['read', 'write', 'atomic', 'publish'], largestGuaranteedRequest: '8192' });
  pools.push(corePool);
  partitions.push(partition(profile, terminalClass, corePool, '0', '4096'), partition(profile, progressClass, corePool, '4096', '8192'));
  for (const entry of classes.filter(({ id }) => ![terminalClass.id, progressClass.id].includes(id))) {
    const entryPool = pool(profile, `resource.${profile}.pool-${entry.id.replaceAll('.', '-')}`, entry.unit, entry.formula.maximumUnits, entry.alignment, { memorySpaces: entry.memorySpaces, access: entry.access, lifetime: entry.lifetime === 'transaction' ? 'work' : entry.lifetime });
    pools.push(entryPool); partitions.push(partition(profile, entry, entryPool));
  }

  const terminalReserveId = `resource.${profile}.reserve-terminal-result`;
  const progressReserveId = `resource.${profile}.reserve-progress-cleanup`;
  const reserves = [
    { id: terminalReserveId, purpose: 'terminal-result', class: terminalClass.id, partition: partitions.find(({ class: id }) => id === terminalClass.id).id, minimum: '4096', maximum: '4096', eligibleOwners: [outputContributor.id], eligibleTransitions: ['resource.transition-publish-terminal'], borrow: { kind: 'none' }, release: schemaReference(`cuda-mcgs.synthetic-${profile}-terminal-reserve-release`), priority: '1' },
    { id: progressReserveId, purpose: 'progress-cleanup', class: progressClass.id, partition: partitions.find(({ class: id }) => id === progressClass.id).id, minimum: '8192', maximum: '8192', eligibleOwners: contributors.map(({ id }) => id), eligibleTransitions: ['resource.transition-drain', 'resource.transition-teardown'], borrow: { kind: 'none' }, release: schemaReference(`cuda-mcgs.synthetic-${profile}-progress-reserve-release`), priority: '2' },
  ];
  if (rootClass) reserves.push({ id: `resource.${profile}.reserve-root-update`, purpose: 'root-update', class: rootClass.id, partition: partitions.find(({ class: id }) => id === rootClass.id).id, minimum: rootClass.formula.maximumUnits, maximum: rootClass.formula.maximumUnits, eligibleOwners: [contributors.find(({ id }) => id === `owner.session.${profile}`).id], eligibleTransitions: ['resource.transition-root-admit', 'resource.transition-root-rollback'], borrow: { kind: 'none' }, release: schemaReference(`cuda-mcgs.synthetic-${profile}-root-reserve-release`), priority: '3' });

  const admissionGroups = [admissionGroup(profile, coreAdmission, [terminalClass, progressClass], true)];
  for (const entry of classes.filter(({ id }) => ![terminalClass.id, progressClass.id].includes(id))) admissionGroups.push(admissionGroup(profile, entry.admissionGroup, [entry]));
  const ledgers = classes.map((entry) => ledger(profile, entry));
  const watermarks = classes.map((entry) => watermark(profile, entry, entry.contributor, progressReserveId));
  const providerRequirements = pools.map((entry) => providerRequirement(profile, entry));
  const contributorProfiles = contributors.map(({ profile: reference }) => reference);
  return {
    schema: 'cuda-mcgs.resource-profile/0.2.0', representation: 'cuda-mcgs.search-ir/0.2.0', status: 'proposal-evidence',
    contract: catalogContract(inspected, 'SPEC-0011'), id: `resource.${profile}`, version: VERSION,
    contributors, classes, pools, partitions, reserves, admissionGroups, ledgers, watermarks,
    exhaustion: {
      causes: ['capacity', 'fragmentation-fit', 'identifier-space', 'generation-space', 'counter-width', 'provider-failure', 'policy-budget'],
      firstCause: 'immutable-first-terminal-cas', publication: schemaReference(`cuda-mcgs.synthetic-${profile}-exhaustion-publication`),
      stopComposition: schemaReference(`cuda-mcgs.synthetic-${profile}-stop-composition`), readyOnly: true, hostGrowth: 'none', counterWrap: 'prohibited', terminalReserve: terminalReserveId,
    },
    lifecycle: {
      states: ['profile-normalized', 'physical-plan-admitted', 'pools-ledgers-initialized', 'active', 'draining', 'terminal', 'released'],
      failure: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-failure`), quarantine: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-quarantine`),
      rollback: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-rollback`), teardown: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-teardown`), admissionClosedAt: 'draining',
    },
    ports: ports(profile), statuses: statuses(), providerRequirements,
    diagnostics: { authority: 'non-authoritative', maxRecords: '256', maxBytes: '32768', overflow: 'count', rawAddresses: false, privatePayloads: false },
    compatibility: { providerIdentityRequired: true, packageIdentityRequired: true, persistence: { kind: 'none' } },
    cleanup: {
      kinds: ['allocation-binding', 'pool', 'partition', 'reserve', 'lease', 'transaction', 'retired-range', 'quarantined-range', 'counter', 'diagnostic', 'plan-ledger-artifact'],
      disposition: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-disposition`), quarantine: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-quarantine`),
      releaseOrder: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-release-order`), retainedEvidence: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-retained-evidence`),
    },
    programContribution: {
      kind: 'device-program', language: 'restricted-device-js', sourceIdentity: contentIdentity(`${profile}:restricted-device-js-source`), inputs: contributorProfiles,
      provenance: { origin: 'first-party', revision: REVISION, license: 'Apache-2.0', review: schemaReference(`cuda-mcgs.synthetic-${profile}-program-security-review`) },
    },
    productData: [],
  };
}

export function buildResourceProfiles(inspected, domainResults, graphResults, policyResults, evaluatorResults, schemaShas) {
  return [
    buildProfile('synthetic-evaluator-absent', inspected, { domain: domainResults[0], graph: graphResults[0], policy: policyResults[0], evaluator: null }, schemaShas),
    buildProfile('synthetic-evaluator-workspace', inspected, { domain: domainResults[1], graph: graphResults[1], policy: policyResults[1], evaluator: evaluatorResults[0] }, schemaShas),
    buildProfile('synthetic-live-session', inspected, { domain: domainResults[1], graph: graphResults[1], policy: policyResults[1], evaluator: evaluatorResults[4] }, schemaShas, { liveOutput: true, session: true }),
  ];
}

export function resourceSyntheticSchemaReference(id) {
  return schemaReference(id);
}

export function resourceSyntheticContentIdentity(label) {
  return contentIdentity(label);
}

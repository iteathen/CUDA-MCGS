import { createHash } from 'node:crypto';

const VERSION = '0.1.0';
const REVISION = '35c4b977edfb5044f3072471624179d1b95b2767';
const COMPLETION_CLASSES = ['complete', 'valid-partial', 'no-valid-result', 'failed'];
const ENVELOPE_FIELDS = [
  'search-identity', 'session-identity', 'search-incarnation', 'profile-identity', 'completion-class', 'first-stop-cause', 'completed-work',
  'policy-budget-status', 'resource-status', 'diagnostic-identity',
];
const PUBLICATION_STATES = ['vacant', 'reserved', 'capturing', 'publishing', 'ready', 'released', 'retired', 'reusable'];
const BASE_CLEANUP = ['terminal-slot', 'terminal-payload', 'source-protection', 'borrow', 'transfer', 'diagnostic', 'program-artifact'];
const LIVE_CLEANUP = ['observation-request', 'observation-slot', 'observation-payload', 'sequence', 'continuation'];
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

function sha256(label) {
  return createHash('sha256').update(label, 'utf8').digest('hex');
}

function schemaReference(id) {
  return { id: `${id}/${VERSION}`, version: VERSION, sha256: sha256(`schema:${id}/${VERSION}`) };
}

function contentIdentity(label) {
  return { algorithm: 'sha256', sha256: sha256(`content:${label}`) };
}

function catalogContract(inspected, id) {
  const contract = inspected.contractSet.contracts.find((entry) => entry.id === id);
  return { kind: 'catalog', id: contract.id, specificationIdentity: contract.specificationIdentity, sha256: contract.sha256 };
}

function profileReference(result) {
  return {
    id: result.normalized.id,
    schema: { id: result.normalized.schema, version: '0.2.0', sha256: result.schemaSha },
    identity: { algorithm: result.identity.algorithm, sha256: result.identity.sha256 },
  };
}

function bounds(overrides = {}) {
  return {
    maxBytes: overrides.maxBytes ?? '4096',
    maxElements: overrides.maxElements ?? '256',
    maxDepth: overrides.maxDepth ?? '16',
    maxReads: overrides.maxReads ?? '256',
    maxWrites: overrides.maxWrites ?? '256',
    maxWorkUnits: overrides.maxWorkUnits ?? '1024',
    maxContinuations: overrides.maxContinuations ?? '16',
    cancellationObservationWorkUnits: overrides.cancellationObservationWorkUnits ?? '16',
    counterMaximum: overrides.counterMaximum ?? '340282366920938463463374607431768211455',
  };
}

function statuses() {
  const classes = {
    'invalid-output-profile': 'fatal',
    'unsupported-output-schema': 'fatal',
    'output-source-unavailable': 'pending',
    'output-source-stale': 'pending',
    'output-capacity': 'pressure',
    'output-terminal-capacity': 'fatal',
    'output-capture-inconsistent': 'fatal',
    'output-payload-invalid': 'fatal',
    'output-slot-stale': 'pending',
    'output-borrow-capacity': 'pressure',
    'output-observation-dropped': 'drop',
    'output-generation-exhausted': 'stop',
    'output-cancelled': 'cancellation',
    'output-internal-failure': 'fatal',
  };
  return Object.entries(classes).map(([code, statusClass]) => ({ code, class: statusClass, diagnostic: true }));
}

function sameSchema(left, right) {
  return left.id === right.id && left.version === right.version && left.sha256 === right.sha256;
}

function contributor(entry, profile, progressPlan) {
  const work = progressPlan.workClasses.find(({ owner }) => owner === entry.id);
  return {
    id: entry.id,
    contract: entry.contract,
    profile: entry.profile,
    optional: entry.optional,
    sourceFacts: entry.publicTransitions.map((fact) => ({
      fact,
      readiness: sameSchema(fact, work.readiness.publication) ? 'ready' : (sameSchema(fact, work.step.publication) ? 'terminal-ready' : 'external-control'),
    })),
    cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-${entry.id.replaceAll('.', '-')}-source-protection-cleanup`),
  };
}

function outputSchema(profile, kind, fieldOrder, options = {}) {
  const id = `output-schema.${profile}.${kind}`;
  return {
    id,
    version: VERSION,
    kind,
    fieldOrder,
    maxBytes: options.maxBytes ?? (kind === 'live' ? '4096' : '2048'),
    maxElements: options.maxElements ?? '256',
    maxDepth: options.maxDepth ?? '16',
    encoding: schemaReference(`cuda-mcgs.synthetic-${profile}-${kind}-encoding`),
    usedLength: schemaReference(`cuda-mcgs.synthetic-${profile}-${kind}-used-length`),
    serialization: {
      byteOrder: 'logical-little-endian',
      alignment: 'logical-alignment-independent',
      integrity: schemaReference(`cuda-mcgs.synthetic-${profile}-${kind}-serialization-integrity`),
      invalidValues: schemaReference(`cuda-mcgs.synthetic-${profile}-${kind}-invalid-values`),
    },
    consistency: options.consistency ?? (kind === 'terminal' ? 'terminal-quiescent' : 'versioned-cut'),
    overflow: options.overflow ?? (kind === 'terminal' ? 'valid-partial' : 'explicit-valid-truncate'),
    compatibility: contentIdentity(`${profile}:${kind}:schema-compatibility`),
  };
}

function outputField(profile, schema, owner, role, token, order, options = {}) {
  const id = `output-field.${profile}.${token}`;
  const source = owner.sourceFacts.find(({ readiness }) => readiness === (options.readiness ?? 'terminal-ready'));
  return {
    id,
    schema,
    owner: owner.id,
    sourceFact: source.fact,
    sourcePort: source.fact,
    semanticRole: role,
    dataType: options.dataType ?? 'record',
    shape: options.shape ?? [],
    unit: options.unit ?? null,
    perspective: options.perspective ?? null,
    precision: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-precision`),
    encoding: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-encoding`),
    validity: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-validity`),
    presence: options.presence ?? 'optional',
    unavailable: options.unavailable ?? 'omit-with-cause',
    failure: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-failure`),
    projection: {
      kind: options.projection ?? 'copy',
      formula: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-projection`),
      readOnly: true,
      bounded: true,
      sourceMutation: 'prohibited',
    },
    bounds: bounds(options.bounds),
    order: String(order),
    permission: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-permission`),
    compatibility: contentIdentity(`${profile}:${token}:field-compatibility`),
  };
}

function ports(profile, live) {
  const ids = [
    'initialize-output-profile', 'classify-terminal-result', 'capture-terminal-payload', 'publish-output',
    'fail-output', 'acquire-output', 'release-output', 'classify-output-reuse',
    ...(live ? ['admit-observation-request', 'capture-observation', 'resume-observation'] : []),
  ];
  return ids.map((id) => ({
    id,
    phase: PORT_PHASES.get(id),
    contract: schemaReference(`cuda-mcgs.synthetic-${profile}-port-${id}`),
    bounds: bounds({ maxWorkUnits: id === 'capture-terminal-payload' ? '2048' : '1024' }),
    completion: ['capture-terminal-payload', 'capture-observation'].includes(id) ? 'finite-continuation' : (id === 'publish-output' ? 'must-complete' : 'bounded'),
    statuses: ['output-source-unavailable', 'output-source-stale', 'output-capacity', 'output-cancelled', 'output-internal-failure'],
    sourceMutation: 'prohibited',
  }));
}

function selectOwner(contributors, contractId) {
  const owner = contributors.find(({ contract }) => contract.id === contractId);
  if (!owner) throw new Error(`fixture lacks ${contractId} owner`);
  return owner;
}

function buildProfile(profile, inspected, resourceResult, progressResult, options = {}) {
  const resourcePlan = resourceResult.normalized;
  const progressPlan = progressResult.normalized;
  const contributors = progressPlan.contributors.map((entry) => contributor(entry, profile, progressPlan));
  const terminalReserve = resourcePlan.reserves.find(({ purpose }) => purpose === 'terminal-result');
  const outputResourceOwner = resourcePlan.contributors.find(({ contract }) => contract.id === 'SPEC-0013');
  const outputProgressOwner = progressPlan.contributors.find(({ contract }) => contract.id === 'SPEC-0013');
  const live = options.live === true;
  const terminalSchemaId = `output-schema.${profile}.terminal`;
  const liveSchemaId = `output-schema.${profile}.live`;
  const fields = [];

  if (options.structured === true) {
    fields.push(
      outputField(profile, terminalSchemaId, selectOwner(contributors, 'SPEC-0007'), 'domain-outcome', 'domain-outcome', 0),
      outputField(profile, terminalSchemaId, selectOwner(contributors, 'SPEC-0008'), 'policy-summary', 'policy-summary', 1),
    );
    const evaluator = contributors.find(({ contract }) => contract.id === 'SPEC-0009');
    if (evaluator) fields.push(outputField(profile, terminalSchemaId, evaluator, 'evaluation-summary', 'evaluation-summary', fields.length));
    fields.push(outputField(profile, terminalSchemaId, selectOwner(contributors, 'SPEC-0012'), 'progress-summary', 'progress-summary', fields.length));
  }
  if (live) fields.push(outputField(profile, liveSchemaId, selectOwner(contributors, 'SPEC-0007'), 'graph-summary', 'live-graph-summary', 0, { projection: 'derive', readiness: 'ready' }));

  const terminalOrder = fields.filter(({ schema }) => schema === terminalSchemaId).sort((left, right) => Number(left.order) - Number(right.order)).map(({ id }) => id);
  const liveOrder = fields.filter(({ schema }) => schema === liveSchemaId).sort((left, right) => Number(left.order) - Number(right.order)).map(({ id }) => id);
  const schemas = [outputSchema(profile, 'terminal', terminalOrder), ...(live ? [outputSchema(profile, 'live', liveOrder)] : [])];
  const observationClass = resourcePlan.classes.find(({ id }) => id.endsWith('class-live-observation'));
  const workingClass = resourcePlan.classes.find(({ id }) => id.endsWith('class-output-working'));
  const observations = live ? {
    kind: 'selected',
    profiles: [{
      id: `output-observation.${profile}.live`,
      version: VERSION,
      schemas: [liveSchemaId],
      triggers: ['ready-event', 'external-bounded'],
      consistency: 'versioned-cut',
      maxRequests: '1024',
      maxSlots: '8',
      maxSequence: '340282366920938463463374607431768211455',
      maxBorrows: '8',
      maxTransfers: '1024',
      cadence: bounds({ maxBytes: '4096', maxElements: '64', maxReads: '128', maxWrites: '64', maxWorkUnits: '512', maxContinuations: '8' }),
      pressure: {
        kind: 'latest-coalesce',
        accounting: schemaReference(`cuda-mcgs.synthetic-${profile}-observation-pressure-accounting`),
        terminalEffect: 'none',
        searchEffect: 'none',
      },
      freshness: REQUIRED_FRESHNESS,
      request: {
        identity: schemaReference(`cuda-mcgs.synthetic-${profile}-observation-request-identity`),
        permission: schemaReference(`cuda-mcgs.synthetic-${profile}-observation-request-permission`),
        validation: schemaReference(`cuda-mcgs.synthetic-${profile}-observation-request-validation`),
        runtimeSchema: 'prohibited',
      },
      readOnly: true,
      hostProgress: 'none',
      resources: [observationClass.id],
      cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-observation-cleanup`),
    }],
  } : { kind: 'absent' };
  const programInputs = [...new Map([
    ...contributors.map(({ profile: reference }) => reference),
    profileReference(resourceResult),
    profileReference(progressResult),
  ].map((reference) => [reference.id, reference])).values()];

  return {
    schema: 'cuda-mcgs.output-profile/0.2.0',
    representation: 'cuda-mcgs.search-ir/0.2.0',
    status: 'accepted',
    contract: catalogContract(inspected, 'SPEC-0013'),
    id: `output.${profile}`,
    version: VERSION,
    resourcePlan: profileReference(resourceResult),
    progressPlan: profileReference(progressResult),
    resourceContribution: outputResourceOwner.profile,
    progressContribution: outputProgressOwner.profile,
    contributors,
    terminalEnvelope: {
      schema: schemaReference(`cuda-mcgs.synthetic-${profile}-terminal-envelope`),
      fields: ENVELOPE_FIELDS,
      completionClasses: COMPLETION_CLASSES,
      maxBytes: '4096',
      terminalReserve: terminalReserve.id,
      emptyPayloadValid: true,
      firstCauseImmutable: true,
    },
    schemas,
    fields,
    terminal: {
      schema: terminalSchemaId,
      cut: 'terminal-quiescent',
      sourceDisposition: 'ready-absent-failed-explicit',
      capture: bounds({ maxBytes: '2048', maxElements: '128', maxWorkUnits: '2048', maxContinuations: '32' }),
      publication: 'exactly-once',
      immutability: true,
      borrow: schemaReference(`cuda-mcgs.synthetic-${profile}-terminal-borrow`),
      asyncRead: schemaReference(`cuda-mcgs.synthetic-${profile}-terminal-async-read`),
      sessionRequired: false,
      cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-terminal-cleanup`),
    },
    observations,
    workspace: {
      resource: workingClass.id,
      scratchBytes: '32768',
      continuationBytes: '16384',
      diagnosticBytes: '32768',
      metadataBytes: '16384',
      maxBorrows: '64',
      maxTransfers: '1024',
      counterMaximum: '340282366920938463463374607431768211455',
      counters: [...BASE_COUNTERS, ...(live ? LIVE_COUNTERS : [])],
      accounting: schemaReference(`cuda-mcgs.synthetic-${profile}-workspace-accounting`),
      generationExhaustion: 'restart-incarnation',
      hostSpill: 'none',
      cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-workspace-cleanup`),
    },
    snapshot: {
      terminalCut: schemaReference(`cuda-mcgs.synthetic-${profile}-terminal-cut`),
      atomicCommit: null,
      versionRelation: live ? schemaReference(`cuda-mcgs.synthetic-${profile}-version-relation`) : null,
      independentVersions: null,
      rootEpoch: schemaReference(`cuda-mcgs.synthetic-${profile}-root-epoch-validation`),
      sourceProtection: schemaReference(`cuda-mcgs.synthetic-${profile}-source-protection`),
      aggregation: schemaReference(`cuda-mcgs.synthetic-${profile}-aggregation-order-arithmetic-overflow-duplicates-equivalence`),
      sequenceValidation: schemaReference(`cuda-mcgs.synthetic-${profile}-sequence-generation-validation`),
      invalidation: schemaReference(`cuda-mcgs.synthetic-${profile}-snapshot-invalidation`),
    },
    publication: {
      states: PUBLICATION_STATES,
      fullBeforeReady: true,
      releasePublication: schemaReference(`cuda-mcgs.synthetic-${profile}-publication-release`),
      acquireRead: schemaReference(`cuda-mcgs.synthetic-${profile}-publication-acquire`),
      terminalConflict: 'quarantine',
      readyImmutable: true,
      borrow: schemaReference(`cuda-mcgs.synthetic-${profile}-publication-borrow`),
      maxBorrows: '64',
      maxTransfers: '1024',
      borrowAcquire: schemaReference(`cuda-mcgs.synthetic-${profile}-borrow-acquire`),
      borrowRelease: schemaReference(`cuda-mcgs.synthetic-${profile}-borrow-release`),
      borrowExpiry: schemaReference(`cuda-mcgs.synthetic-${profile}-borrow-expiry-quiescence`),
      waiterCompletion: schemaReference(`cuda-mcgs.synthetic-${profile}-waiter-completion`),
      hostDelivery: 'asynchronous-bounded-read',
      hostEffect: 'transfer-borrow-only',
      waiterBound: '64',
      mechanism: 'public-cuda-js-contract',
    },
    lifecycle: {
      states: ['profile-normalized', 'resources-admitted', 'initialized', 'active-or-terminal-capture', 'draining', 'terminal', 'released'],
      failure: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-failure`),
      quarantine: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-quarantine`),
      cancellation: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-cancellation`),
      rootDisposition: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-root-disposition`),
      workDisposition: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-work-disposition`),
      sessionDisposition: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-session-disposition`),
      reuse: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-reuse`),
      dispositions: [...BASE_DISPOSITIONS, ...(live ? LIVE_DISPOSITIONS : [])].map((id) => ({
        id,
        root: id === 'terminal-slot' ? 'retain' : 'invalidate',
        session: id === 'terminal-slot' ? 'retain' : 'retire',
        release: schemaReference(`cuda-mcgs.synthetic-${profile}-${id}-disposition-release`),
        retentionWorkUnits: '4096',
      })),
      teardown: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-teardown`),
      release: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-release`),
      terminalOnlyElidesLive: !live,
    },
    ports: ports(profile, live),
    statuses: statuses(),
    permissions: [schemaReference(`cuda-mcgs.synthetic-${profile}-output-permission`)],
    consumerPolicy: {
      validation: schemaReference(`cuda-mcgs.synthetic-${profile}-consumer-validation`),
      serialization: schemaReference(`cuda-mcgs.synthetic-${profile}-consumer-serialization`),
      trust: schemaReference(`cuda-mcgs.synthetic-${profile}-consumer-trust`),
      provenance: schemaReference(`cuda-mcgs.synthetic-${profile}-consumer-provenance`),
      redaction: schemaReference(`cuda-mcgs.synthetic-${profile}-consumer-redaction`),
      permission: schemaReference(`cuda-mcgs.synthetic-${profile}-output-permission`),
      integrity: schemaReference(`cuda-mcgs.synthetic-${profile}-consumer-integrity`),
    },
    diagnostics: {
      authority: 'non-authoritative', maxRecords: '256', maxBytes: '32768', overflow: 'count', rawAddresses: false, privatePayloads: false, deviceMemoryDump: false,
    },
    compatibility: { packageIdentityRequired: true, nativeTransferIdentityOpaque: true, persistence: { kind: 'none' } },
    cleanup: {
      kinds: [...BASE_CLEANUP, ...(live ? LIVE_CLEANUP : [])],
      disposition: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-disposition`),
      quarantine: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-quarantine`),
      releaseOrder: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-release-order`),
      retainedEvidence: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-retained-evidence`),
    },
    programContribution: {
      kind: 'device-program',
      language: 'restricted-device-js',
      sourceIdentity: contentIdentity(`${profile}:restricted-device-js-output-source`),
      inputs: programInputs,
      provenance: {
        origin: 'first-party', revision: REVISION, license: 'Apache-2.0', review: schemaReference(`cuda-mcgs.synthetic-${profile}-program-security-review`),
      },
    },
    productData: [],
  };
}

export function buildOutputProfiles(inspected, resourceResults, progressResults) {
  return [
    buildProfile('synthetic-evaluator-absent', inspected, resourceResults[0], progressResults[0]),
    buildProfile('synthetic-evaluator-workspace', inspected, resourceResults[1], progressResults[1], { structured: true }),
    buildProfile('synthetic-live-session', inspected, resourceResults[2], progressResults[2], { structured: true, live: true }),
  ];
}

export function buildOutputProfile(profile, inspected, resourceResult, progressResult, options = {}) {
  return buildProfile(profile, inspected, resourceResult, progressResult, options);
}

export function outputSyntheticSchemaReference(id) {
  return schemaReference(id);
}

export function outputSyntheticContentIdentity(label) {
  return contentIdentity(label);
}

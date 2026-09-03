import { createHash } from 'node:crypto';

const VERSION = '0.1.0';
const REVISION = 'b7d3141738f5586efb1e86014925ee849251e673';
const CLEANUP_KINDS = ['channel', 'item', 'payload', 'result', 'pending-descriptor', 'claim', 'borrow', 'source-owner-lease', 'counter', 'diagnostic', 'program-artifact'];

function sha256(label) { return createHash('sha256').update(label, 'utf8').digest('hex'); }
function schemaReference(id) { return { id: `${id}/${VERSION}`, version: VERSION, sha256: sha256(`schema:${id}/${VERSION}`) }; }
function contentIdentity(label) { return { algorithm: 'sha256', sha256: sha256(`content:${label}`) }; }
function identityReference(identity) { return { algorithm: identity.algorithm, sha256: identity.sha256 }; }
function profileReference(result) { return { id: result.normalized.id, schema: { id: result.normalized.schema, version: '0.2.0', sha256: result.schemaSha }, identity: identityReference(result.identity) }; }

function catalogContract(inspected, id) {
  const contract = inspected.contractSet.contracts.find((entry) => entry.id === id);
  return { kind: 'catalog', id: contract.id, specificationIdentity: contract.specificationIdentity, sha256: contract.sha256 };
}

function owner(stage, contractId) {
  const selected = stage.normalized.owners.find(({ contract }) => contract.id === contractId);
  return { id: selected.id, contract: selected.contract, profile: selected.profile };
}

function finiteIdentity(profile, channel, token) {
  return { schema: schemaReference(`cuda-mcgs.synthetic-${profile}-${channel}-${token}`), maximum: '340282366920938463463374607431768211455', rollover: 'prohibited', exhaustion: 'typed-stop-before-alias' };
}

function payload(profile, channel, token, kind, semanticOwner, sizeBytes) {
  return {
    id: `channel-payload.${profile}.${channel}.${token}`, kind, owner: semanticOwner,
    schema: schemaReference(`cuda-mcgs.synthetic-${profile}-${channel}-${token}-payload`), sizeBytes, alignment: '16', memorySpace: 'device-search', immutableAtReady: true,
    sourceValidity: schemaReference(`cuda-mcgs.synthetic-${profile}-${channel}-${token}-source-validity`),
  };
}

function transitions(requestResult) {
  const base = [
    ['free', 'reserved-unpublished', 'reserve'],
    ['reserved-unpublished', 'ready', 'publish-ready'],
    ['reserved-unpublished', 'terminally-disposed', 'rollback-or-cancel'],
    ['ready', 'owned-or-borrowed', 'claim-or-borrow'],
    ['ready', 'terminally-disposed', 'cancel-or-expire'],
    ['owned-or-borrowed', 'terminally-disposed', 'complete-or-cancel'],
    ['terminally-disposed', 'reclaimable', 'retire'],
    ['reclaimable', 'free', 'advance-generation'],
  ];
  if (requestResult) base.push(
    ['ready', 'in-progress', 'claim-request'],
    ['in-progress', 'result-ready', 'publish-result'],
    ['in-progress', 'terminally-disposed', 'fail-cancel-or-expire'],
    ['result-ready', 'owned-or-borrowed', 'claim-result'],
    ['result-ready', 'terminally-disposed', 'cancel-or-expire-result'],
  );
  return base.map(([from, to, operation]) => ({ from, to, operation, monotonic: true }));
}

function cancellation(states) {
  const disposition = {
    free: 'no-effect', 'reserved-unpublished': 'rollback', ready: 'cancel-and-retire', 'in-progress': 'mark-cancelled',
    'result-ready': 'cancel-and-retire', 'owned-or-borrowed': 'mark-cancelled', 'terminally-disposed': 'ignore-authoritative-terminal', reclaimable: 'reclaim',
  };
  return states.map((state) => ({ state, disposition: disposition[state] }));
}

function counters(profile, channel) {
  return ['generation', 'correlation', 'reservation', 'claim', 'borrow', 'completion', 'cancellation', 'expiry', 'reclamation'].map((kind) => ({
    id: `channel-counter.${profile}.${channel}.${kind}`, kind, maximum: '340282366920938463463374607431768211455', rollover: 'prohibited', exhaustionOutcome: 'channel-counter-exhausted',
  }));
}

function descriptors(profile, channel, workUnits) {
  return ['producer', 'consumer', 'completion-reclamation', 'pending-dependency'].map((kind) => ({
    id: `channel-work.${profile}.${channel}.${kind}`, kind, publication: schemaReference(`cuda-mcgs.synthetic-${profile}-${channel}-${kind}-publication`), maxWorkUnits: workUnits,
  }));
}

function classMap(resourceResult) {
  const channelOwner = resourceResult.normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0004');
  return Object.fromEntries(resourceResult.normalized.classes.filter(({ contributor }) => contributor === channelOwner.id).map((entry) => [entry.id.split('class-channel-').at(-1), entry.id]));
}

function allocations(classes, values) {
  return Object.entries(values).map(([kind, units]) => ({ kind, class: classes[kind], units }));
}

function requirements() {
  return [schemaReference('cuda-js.device-js'), schemaReference('cuda-js.operation-lifecycle'), schemaReference('cuda-js.device-publication-release-acquire')];
}

function baseChannel(profile, channelToken, requirement, semanticOwner, roles, selected, options) {
  const requestResult = options.requestResult === true;
  const states = ['free', 'reserved-unpublished', 'ready', ...(requestResult ? ['in-progress', 'result-ready'] : []), 'owned-or-borrowed', 'terminally-disposed', 'reclaimable'];
  const consumptionClass = options.consumption;
  return {
    id: `channel.${channelToken}`, version: VERSION, requirement, semanticOwner, roles,
    itemIdentity: {
      item: schemaReference(`cuda-mcgs.synthetic-${profile}-${channelToken}-item-identity`), generation: finiteIdentity(profile, channelToken, 'generation'),
      correlation: finiteIdentity(profile, channelToken, 'correlation'), freshness: schemaReference(`cuda-mcgs.synthetic-${profile}-${channelToken}-freshness`),
    },
    payloads: options.payloads,
    stateGraph: { states, initial: 'free', transitions: transitions(requestResult) },
    claim: options.claim,
    ordering: options.ordering,
    publication: {
      readyState: 'ready', release: 'logical-release', acquire: 'logical-acquire', scope: 'device',
      publicationWord: schemaReference(`cuda-mcgs.synthetic-${profile}-${channelToken}-generation-ready-word`), payloadBeforeReady: true, consumeAfterAcquire: true,
      nativeSpelling: 'none', publicRequirement: schemaReference('cuda-js.device-publication-release-acquire'), nativeQualification: 'pending-exact-compatible-pair',
    },
    capacity: options.capacity,
    resources: {
      allocations: options.allocations, admissionGroup: `channel-admission.${profile}.${channelToken}`, rollback: 'zero-published-effect', conservation: 'exact',
      hiddenGrowth: false, hostRescue: 'none', terminalReserve: true,
    },
    progress: {
      workClass: selected.workClass, descriptors: descriptors(profile, channelToken, options.workUnits),
      dependencies: [{
        id: `channel-dependency.${profile}.${channelToken}.producer`, producerRoles: roles.filter(({ kind }) => kind === 'producer').map(({ id }) => id),
        requirement: consumptionClass, producerChannel: null,
        escapes: consumptionClass === 'advisory' ? ['failure', 'cancel', 'stop', 'fallback', 'stale'] : consumptionClass === 'optional' ? ['failure', 'cancel', 'stop', 'skip', 'stale'] : ['failure', 'cancel', 'stop', 'stale'],
        holdsWorker: false, holdsMutableLease: false, maxWaitTransitions: '4096', fallback: consumptionClass === 'advisory' ? schemaReference(`cuda-mcgs.synthetic-${profile}-${channelToken}-owner-fallback`) : null,
      }],
      noProgress: { classifier: schemaReference(`cuda-mcgs.synthetic-${profile}-${channelToken}-no-progress-classifier`), producerService: 'required-before-no-progress', typedOutcome: 'channel-no-progress', hostDecision: 'none' },
    },
    consumption: { class: consumptionClass, unavailable: { required: 'pending-release-worker', optional: 'skip', advisory: 'owner-fallback' }[consumptionClass], failure: schemaReference(`cuda-mcgs.synthetic-${profile}-${channelToken}-failure-mapping`), timeoutSwitching: false },
    counters: counters(profile, channelToken),
    outcomes: ['channel-work-complete', 'channel-unavailable', 'channel-capacity', 'channel-stale', 'channel-expired', 'channel-cancelled', 'channel-counter-exhausted', 'channel-no-progress', 'channel-incompatible', 'channel-internal-failure'],
    lifecycle: {
      cancellation: cancellation(states), stale: schemaReference(`cuda-mcgs.synthetic-${profile}-${channelToken}-stale-disposition`), lateCompletion: 'ignore-reclaim-no-resurrection',
      expiry: { source: 'engine-epoch-budget', maximumAge: options.capacity.maxAgeEpochs, disposition: 'expire-and-retire' },
      reclamation: { preconditions: ['terminal-disposition', 'claims-ended', 'borrows-zero', 'source-leases-ended', 'progress-references-zero'], generationAdvanceBeforeReuse: true },
      teardown: schemaReference(`cuda-mcgs.synthetic-${profile}-${channelToken}-teardown`), hostProgress: 'none', workerWait: 'none',
    },
    compatibility: { packageIdentityRequired: true, ownerSemanticsRequired: true, schedulerIdentityExcluded: true, persistence: { kind: 'none' }, nativeEvidence: 'separate-compatible-pair' },
    cleanup: { kinds: ['item', 'payload', ...(requestResult ? ['result'] : []), 'pending-descriptor', 'claim', ...(options.claim.mode.includes('multi-consumer') ? ['borrow'] : []), 'source-owner-lease', 'counter'], disposition: schemaReference(`cuda-mcgs.synthetic-${profile}-${channelToken}-cleanup-disposition`), quarantine: schemaReference(`cuda-mcgs.synthetic-${profile}-${channelToken}-cleanup-quarantine`), releaseOrder: schemaReference(`cuda-mcgs.synthetic-${profile}-${channelToken}-cleanup-release-order`) },
    sourceIdentity: contentIdentity(`${profile}:${channelToken}:restricted-device-js-source`), requirements: requirements(),
    provenance: { origin: 'first-party', trust: 'first-party-reviewed', revision: REVISION, license: 'Apache-2.0', review: schemaReference(`cuda-mcgs.synthetic-${profile}-${channelToken}-security-review`) },
  };
}

function stageIds() {
  return {
    productCapability: 'extension-capability.synthetic-channel-stage.product-priority', auditCapability: 'extension-capability.synthetic-channel-stage.audit-consistency',
    entrySurface: 'extension-surface.synthetic-channel-stage.candidate-entry', exitSurface: 'extension-surface.synthetic-channel-stage.candidate-exit',
    prepareStage: 'extension-stage.synthetic-channel-stage.prepare-candidate', commitStage: 'extension-stage.synthetic-channel-stage.commit-candidate',
  };
}

function buildRequired(profile, stageResult, resourceResult, progressResult) {
  const ids = stageIds(); const evaluator = owner(stageResult, 'SPEC-0009'); const classes = classMap(resourceResult);
  const channelOwner = progressResult.normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0004');
  const workClass = progressResult.normalized.workClasses.find(({ owner: id }) => id === channelOwner.id).id;
  const roles = [
    { id: `channel-role.${profile}.evaluator-request-producer`, kind: 'producer', capability: ids.productCapability, stage: ids.prepareStage, surface: ids.entrySurface, actions: ['produce', 'cancel', 'release'], multiplicity: '64' },
    { id: `channel-role.${profile}.evaluator-result-consumer`, kind: 'consumer', capability: ids.productCapability, stage: ids.commitStage, surface: ids.exitSurface, actions: ['claim', 'observe', 'complete', 'cancel', 'release'], multiplicity: '64' },
  ];
  return baseChannel(profile, 'synthetic-evaluator-request', schemaReference('cuda-mcgs.channel-requirement.evaluator-request'), evaluator.id, roles, { workClass }, {
    requestResult: true, consumption: 'required', payloads: [payload(profile, 'evaluator-request', 'request', 'request', evaluator.id, '256'), payload(profile, 'evaluator-request', 'result', 'result', evaluator.id, '128')],
    claim: { mode: 'single-consumer-transfer', maxClaims: '1', ownership: 'transfer', referenceAccounting: 'none' },
    ordering: { kind: 'owner-defined', rule: schemaReference(`cuda-mcgs.synthetic-${profile}-evaluator-request-ordering`) },
    capacity: { slots: '128', highAt: '64', criticalAt: '96', exhaustedAt: '128', maxReservations: '128', maxPending: '128', maxRetries: '8', maxAgeEpochs: '4096', cancellationObservationWorkUnits: '16' },
    allocations: allocations(classes, { item: '128', payload: '32768', result: '16384', pending: '128', diagnostic: '8192' }), workUnits: '256',
  });
}

function buildSecondary(profile, channelToken, stageResult, resourceResult, progressResult, consumption = 'advisory') {
  const ids = stageIds(); const graph = owner(stageResult, 'SPEC-0010'); const classes = classMap(resourceResult);
  const channelOwner = progressResult.normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0004');
  const workClass = progressResult.normalized.workClasses.find(({ owner: id }) => id === channelOwner.id).id;
  const roles = [
    { id: `channel-role.${profile}.secondary-producer`, kind: 'producer', capability: ids.auditCapability, stage: ids.commitStage, surface: ids.exitSurface, actions: ['produce', 'cancel', 'release'], multiplicity: '8' },
    { id: `channel-role.${profile}.secondary-consumer`, kind: 'consumer', capability: ids.auditCapability, stage: ids.commitStage, surface: ids.exitSurface, actions: ['observe'], multiplicity: '4' },
  ];
  return baseChannel(profile, channelToken, schemaReference('cuda-mcgs.channel-requirement.audit-feed'), graph.id, roles, { workClass }, {
    requestResult: true, consumption, payloads: [payload(profile, channelToken, 'request', 'request', graph.id, '256'), payload(profile, channelToken, 'result', 'result', graph.id, '128')],
    claim: { mode: 'finite-multi-consumer-immutable-borrow', maxClaims: '4', ownership: 'immutable-borrow', referenceAccounting: 'exact' },
    ordering: { kind: 'unordered', rule: null },
    capacity: { slots: '64', highAt: '32', criticalAt: '48', exhaustedAt: '64', maxReservations: '64', maxPending: '64', maxRetries: '4', maxAgeEpochs: '1024', cancellationObservationWorkUnits: '8' },
    allocations: allocations(classes, { item: '64', payload: '16384', result: '8192', pending: '64', borrow: '256', diagnostic: '8192' }), workUnits: '64',
  });
}

function statuses() {
  const classes = {
    'channel-work-complete': 'normal', 'channel-unavailable': 'pending', 'channel-capacity': 'pressure', 'channel-stale': 'stop', 'channel-expired': 'stop',
    'channel-cancelled': 'cancellation', 'channel-counter-exhausted': 'stop', 'channel-no-progress': 'fatal', 'channel-incompatible': 'fatal', 'channel-internal-failure': 'fatal',
  };
  return Object.entries(classes).map(([code, statusClass]) => ({ code, class: statusClass, diagnostic: true }));
}

function buildProfile(profile, inspected, resourceResult, progressResult, stageResult, options = {}) {
  const required = options.required === true ? buildRequired(profile, stageResult, resourceResult, progressResult) : null;
  const secondary = buildSecondary(profile, options.secondaryToken ?? 'synthetic-audit-feed', stageResult, resourceResult, progressResult, options.secondaryConsumption ?? 'advisory');
  const channels = [required, secondary].filter(Boolean);
  const selectedOwnerIds = new Set(channels.map(({ semanticOwner }) => semanticOwner));
  const selectedOwners = stageResult.normalized.owners.filter(({ id }) => selectedOwnerIds.has(id)).map(({ id, contract, profile: reference }) => ({ id, contract, profile: reference }));
  const resourceOwner = resourceResult.normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0004');
  return {
    schema: 'cuda-mcgs.channel-profile/0.2.0', representation: 'cuda-mcgs.search-ir/0.2.0', status: 'accepted', contract: catalogContract(inspected, 'SPEC-0004'),
    id: `channel.${profile}`, version: VERSION, generatorIdentity: contentIdentity(`${profile}:channel-profile-generator-v1`),
    resourcePlan: profileReference(resourceResult), progressPlan: profileReference(progressResult), stageProfile: profileReference(stageResult),
    resourceContribution: resourceOwner.profile, progressContribution: resourceOwner.profile, owners: selectedOwners, channels, statuses: statuses(),
    lifecycle: { states: ['profile-normalized', 'resources-admitted', 'composed', 'active', 'draining', 'terminal', 'released'], partialFailure: 'publish-none-unwind-all', cancellation: schemaReference(`cuda-mcgs.synthetic-${profile}-channel-lifecycle-cancellation`), stop: schemaReference(`cuda-mcgs.synthetic-${profile}-channel-lifecycle-stop`), teardown: schemaReference(`cuda-mcgs.synthetic-${profile}-channel-lifecycle-teardown`), release: schemaReference(`cuda-mcgs.synthetic-${profile}-channel-lifecycle-release`) },
    diagnostics: { authority: 'non-authoritative', maxRecords: '256', maxBytes: '32768', overflow: 'count', rawPointers: false, cudaHandles: false, nativeArtifacts: false, privatePayloads: false, wallClock: false },
    compatibility: { packageIdentityRequired: true, cudaJsPublicContractsOnly: true, nativeQualification: 'pending-exact-compatible-pair', migration: { kind: 'none' } },
    cleanup: { kinds: CLEANUP_KINDS, disposition: schemaReference(`cuda-mcgs.synthetic-${profile}-channel-cleanup-disposition`), quarantine: schemaReference(`cuda-mcgs.synthetic-${profile}-channel-cleanup-quarantine`), releaseOrder: schemaReference(`cuda-mcgs.synthetic-${profile}-channel-cleanup-release-order`), ownerOrder: schemaReference(`cuda-mcgs.synthetic-${profile}-channel-cleanup-owner-order`), retainedEvidence: schemaReference(`cuda-mcgs.synthetic-${profile}-channel-cleanup-retained-evidence`) },
    programContribution: { kind: 'device-program', language: 'restricted-device-js', sourceIdentity: contentIdentity(`${profile}:${channels.map(({ id }) => id).sort().join(',')}:restricted-device-js-channel-source`), inputs: [profileReference(resourceResult), profileReference(progressResult), profileReference(stageResult)], requirements: requirements(), runtimeRegistry: false, nativeArtifacts: false, provenance: { origin: 'first-party', trust: 'first-party-reviewed', revision: REVISION, license: 'Apache-2.0', review: schemaReference(`cuda-mcgs.synthetic-${profile}-channel-program-security-review`) } },
    productData: [],
  };
}

export function buildChannelProfiles(inspected, resourceResult, progressResult, selectedStageResult, secondaryResourceResult, secondaryProgressResult, secondaryStageResult) {
  return [
    buildProfile('synthetic-evaluator-and-audit', inspected, resourceResult, progressResult, selectedStageResult, { required: true }),
    buildProfile('synthetic-secondary-work', inspected, secondaryResourceResult, secondaryProgressResult, secondaryStageResult, { secondaryToken: 'synthetic-secondary-broadcast', secondaryConsumption: 'optional' }),
  ];
}

export function buildChannelProfile(profile, inspected, resourceResult, progressResult, stageResult, options = {}) {
  return buildProfile(profile, inspected, resourceResult, progressResult, stageResult, options);
}

export function buildChannelFirstProductDeletedProfile(inspected, resourceResult, progressResult, stageResult) {
  return buildProfile('synthetic-evaluator-and-audit', inspected, resourceResult, progressResult, stageResult);
}

export function channelSyntheticSchemaReference(id) { return schemaReference(id); }
export function channelSyntheticContentIdentity(label) { return contentIdentity(label); }

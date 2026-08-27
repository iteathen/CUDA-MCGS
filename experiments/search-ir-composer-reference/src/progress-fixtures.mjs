import { createHash } from 'node:crypto';

const VERSION = '0.1.0';
const REVISION = '97bd9871938e7303389e9929a76d16c79c5745e9';
const STAGE_REVISION = 'f48f20cbacea6404362b5186dd1fdd116f241a98';
const CHANNEL_REVISION = 'b7d3141738f5586efb1e86014925ee849251e673';
const NO_PROGRESS_OUTCOMES = [
  'terminal-quiescent', 'legitimate-external-wait', 'recoverable-resource-wait', 'producer-pending', 'deadlock',
  'livelock', 'starvation', 'orphaned-work', 'stale-only', 'counter-exhausted',
];
const CLEANUP_KINDS = [
  'descriptor', 'work-record', 'dependency', 'ready-record', 'claim', 'continuation', 'fairness-counter',
  'wait-graph', 'no-progress-evidence', 'stop-record', 'closure-record', 'diagnostic', 'program-artifact',
];
const PORTS = [
  'admit-work', 'publish-ready', 'claim-ready', 'yield-pending', 'complete-work', 'fail-work',
  'cancel-work', 'observe-progress', 'request-stop', 'classify-no-progress', 'publish-closure',
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

function profileReference(result) {
  return {
    id: result.normalized.id,
    schema: { id: result.normalized.schema, version: '0.2.0', sha256: result.schemaSha },
    identity: identityReference(result.identity),
  };
}

function ownerToken(owner) {
  return owner.replaceAll('.', '-');
}

function workId(profile, owner) {
  return `work.${profile}.${ownerToken(owner)}`;
}

function transitions(profile, owner, session) {
  return {
    ready: schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(owner)}-ready-transition`),
    completion: schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(owner)}-completion-transition`),
    external: session ? schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(owner)}-external-input-transition`) : null,
  };
}

function bounds(options = {}) {
  return {
    maxAdmitted: options.maxAdmitted ?? '65536',
    maxProducedPerStep: options.maxProducedPerStep ?? '16',
    maxStepsPerAttempt: options.maxStepsPerAttempt ?? '256',
    maxRetries: options.maxRetries ?? '8',
    maxContinuationDepth: options.maxContinuationDepth ?? '64',
    maxWaitTransitions: options.maxWaitTransitions ?? '4096',
    counterMaximum: options.counterMaximum ?? '340282366920938463463374607431768211455',
    cancellationObservationWorkUnits: options.cancellationObservationWorkUnits ?? '16',
  };
}

function workKind(contractId) {
  const kinds = {
    'SPEC-0004': 'producer-unblocking',
    'SPEC-0010': 'producer-unblocking',
    'SPEC-0011': 'resource-recovery',
    'SPEC-0012': 'must-drain',
    'SPEC-0013': 'terminal-output',
    'SPEC-0006': 'external-control',
  };
  return kinds[contractId] ?? 'ordinary';
}

function stopDisposition(kind) {
  if (['must-drain', 'terminal-output'].includes(kind)) return 'drain';
  if (['producer-unblocking', 'resource-recovery'].includes(kind)) return 'service';
  if (kind === 'external-control') return 'cancel';
  return 'abandon';
}

function statuses() {
  const classes = {
    'invalid-progress-profile': 'fatal',
    'work-capacity': 'pending',
    'work-stale': 'stop',
    'producer-unavailable': 'pending',
    'progress-deadlock': 'fatal',
    'progress-livelock': 'fatal',
    'progress-starvation': 'fatal',
    'orphaned-work': 'fatal',
    'progress-counter-exhausted': 'stop',
    'progress-cancelled': 'cancellation',
    'progress-internal-failure': 'fatal',
    'progress-work-complete': 'normal',
  };
  return Object.entries(classes).map(([code, statusClass]) => ({ code, class: statusClass, diagnostic: true }));
}

function buildWorkClass(profile, contributor, resourcePlan, transitionsByOwner) {
  const kind = workKind(contributor.contract.id);
  const resources = resourcePlan.classes.filter(({ contributor: owner }) => owner === contributor.id).map(({ id }) => id);
  const progressReserve = resourcePlan.reserves.find(({ purpose }) => purpose === 'progress-cleanup')?.id ?? null;
  const terminalReserve = resourcePlan.reserves.find(({ purpose }) => purpose === 'terminal-result')?.id ?? null;
  const reserve = kind === 'terminal-output' ? terminalReserve
    : (['producer-unblocking', 'must-drain', 'resource-recovery'].includes(kind) ? progressReserve : null);
  const id = workId(profile, contributor.id);
  const evaluator = contributor.contract.id === 'SPEC-0009';
  const continuing = evaluator || kind === 'must-drain';
  return {
    id, version: VERSION, owner: contributor.id, kind,
    payload: schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(contributor.id)}-payload`),
    inputStates: [`work.${profile}.${ownerToken(contributor.id)}-admitted`],
    outputStates: [`work.${profile}.${ownerToken(contributor.id)}-published`, `work.${profile}.${ownerToken(contributor.id)}-terminal`],
    readiness: {
      mode: 'any-with-independent',
      predicate: schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(contributor.id)}-readiness`),
      publication: transitionsByOwner.get(contributor.id).ready,
      independentReady: true,
      dependencies: [],
    },
    resources, reserve, bounds: bounds(),
    fairness: `fairness.${profile}.${['producer-unblocking', 'must-drain', 'terminal-output', 'resource-recovery'].includes(kind) ? 'closure' : 'ordinary'}`,
    batch: evaluator ? {
      kind: 'device-flush', minimumItems: '1', maximumItems: '64', flushAfterOpportunities: '32',
      readiness: schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(contributor.id)}-batch-readiness`), hostTimeout: 'none',
    } : { kind: 'none' },
    claim: evaluator ? 'idempotent-cooperative' : 'exclusive',
    step: {
      contract: schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(contributor.id)}-finite-step`),
      completion: continuing ? 'finite-continuation' : 'bounded',
      continuationIdentity: continuing ? schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(contributor.id)}-continuation-identity`) : null,
      publication: transitionsByOwner.get(contributor.id).completion,
      failure: schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(contributor.id)}-failure`),
    },
    retry: { staleSafe: true, idempotence: schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(contributor.id)}-retry-idempotence`) },
    cancellation: schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(contributor.id)}-cancellation`),
    stale: schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(contributor.id)}-stale-disposition`),
    stopDisposition: stopDisposition(kind),
    terminalStates: ['completed', 'failed', 'cancelled', 'stale-disposed', 'quarantined'],
    status: 'progress-work-complete',
    cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(contributor.id)}-work-cleanup`),
  };
}

function addDependency(profile, dependencies, workByOwner, transitionsByOwner, consumerOwner, producerOwner, producerKind, requirement) {
  const consumer = workByOwner.get(consumerOwner);
  const producer = workByOwner.get(producerOwner);
  const id = `dependency.${profile}.${ownerToken(consumerOwner)}-on-${ownerToken(producerOwner)}`;
  dependencies.push({
    id,
    consumer: consumer.id,
    producer: {
      kind: producerKind,
      owner: producerOwner,
      workClass: producerKind === 'work-class' ? producer.id : null,
      fact: producerKind === 'external-control' ? transitionsByOwner.get(producerOwner).external : transitionsByOwner.get(producerOwner).completion,
    },
    requirement,
    publication: schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(consumerOwner)}-${ownerToken(producerOwner)}-dependency-publication`),
    incarnation: schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(consumerOwner)}-${ownerToken(producerOwner)}-dependency-incarnation`),
    escapes: requirement === 'advisory' ? ['failure', 'cancel', 'stop', 'fallback', 'stale'] : ['failure', 'cancel', 'stop', 'stale'],
    maxWaitTransitions: '4096',
    fallback: requirement === 'advisory' ? schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(consumerOwner)}-${ownerToken(producerOwner)}-fallback`) : null,
    holdsWorker: false,
    holdsProducerResource: false,
  });
  consumer.readiness.dependencies.push(id);
  if (requirement === 'required') {
    consumer.readiness.mode = 'all';
    consumer.readiness.independentReady = false;
  }
}

function buildProfile(profile, inspected, resourceResult, options = {}) {
  const resourcePlan = resourceResult.normalized;
  const transitionsByOwner = new Map(resourcePlan.contributors.map(({ id, contract }) => [id, transitions(profile, id, contract.id === 'SPEC-0006')]));
  const contributors = resourcePlan.contributors.map((entry) => ({
    id: entry.id,
    contract: entry.contract,
    profile: entry.profile,
    optional: entry.optional,
    workClasses: [workId(profile, entry.id)],
    publicTransitions: [transitionsByOwner.get(entry.id).ready, transitionsByOwner.get(entry.id).completion, ...(transitionsByOwner.get(entry.id).external ? [transitionsByOwner.get(entry.id).external] : [])],
    cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-${ownerToken(entry.id)}-owner-cleanup`),
  }));
  const workClasses = contributors.map((contributor) => buildWorkClass(profile, contributor, resourcePlan, transitionsByOwner));
  const workByOwner = new Map(workClasses.map((entry) => [entry.owner, entry]));
  const ownerFor = (contractId) => contributors.find(({ contract }) => contract.id === contractId)?.id ?? null;
  const dependencies = [];

  addDependency(profile, dependencies, workByOwner, transitionsByOwner, ownerFor('SPEC-0007'), ownerFor('SPEC-0011'), 'fact', 'advisory');
  addDependency(profile, dependencies, workByOwner, transitionsByOwner, ownerFor('SPEC-0010'), ownerFor('SPEC-0007'), 'work-class', 'required');
  addDependency(profile, dependencies, workByOwner, transitionsByOwner, ownerFor('SPEC-0008'), ownerFor('SPEC-0010'), 'work-class', 'required');
  addDependency(profile, dependencies, workByOwner, transitionsByOwner, ownerFor('SPEC-0013'), ownerFor('SPEC-0008'), 'work-class', 'required');
  addDependency(profile, dependencies, workByOwner, transitionsByOwner, ownerFor('SPEC-0012'), ownerFor('SPEC-0011'), 'resource-recovery', 'required');
  const evaluatorOwner = ownerFor('SPEC-0009');
  if (evaluatorOwner) addDependency(profile, dependencies, workByOwner, transitionsByOwner, evaluatorOwner, ownerFor('SPEC-0010'), 'fact', 'required');
  const sessionOwner = ownerFor('SPEC-0006');
  if (sessionOwner) addDependency(profile, dependencies, workByOwner, transitionsByOwner, sessionOwner, sessionOwner, 'external-control', 'required');

  const closureClasses = workClasses.filter(({ kind }) => ['producer-unblocking', 'must-drain', 'terminal-output', 'resource-recovery'].includes(kind)).map(({ id }) => id);
  const ordinaryClasses = workClasses.filter(({ kind }) => !['producer-unblocking', 'must-drain', 'terminal-output', 'resource-recovery'].includes(kind)).map(({ id }) => id);
  const fairnessClasses = [
    {
      id: `fairness.${profile}.closure`, mode: 'priority-with-starvation-escape', classes: closureClasses,
      maxServiceOpportunities: '64', priority: '0', serviceOpportunity: schemaReference(`cuda-mcgs.synthetic-${profile}-closure-service-opportunity`),
      starvationEscape: schemaReference(`cuda-mcgs.synthetic-${profile}-closure-starvation-escape`), closurePriority: true,
    },
    {
      id: `fairness.${profile}.ordinary`, mode: 'bounded-service-gap', classes: ordinaryClasses,
      maxServiceOpportunities: '256', priority: '1', serviceOpportunity: schemaReference(`cuda-mcgs.synthetic-${profile}-ordinary-service-opportunity`),
      starvationEscape: null, closurePriority: false,
    },
  ];
  const sessionContributor = contributors.find(({ contract }) => contract.id === 'SPEC-0006');
  const outputContributor = contributors.find(({ contract }) => contract.id === 'SPEC-0013');
  const hasLiveOutput = resourcePlan.classes.some(({ contributor: owner, id }) => owner === outputContributor.id && id.endsWith('class-live-observation'));
  const selectedProgressContribution = resourcePlan.contributors.find(({ contract }) => contract.id === 'SPEC-0012');
  return {
    schema: 'cuda-mcgs.progress-profile/0.2.0', representation: 'cuda-mcgs.search-ir/0.2.0', status: 'proposal-evidence',
    contract: catalogContract(inspected, 'SPEC-0012'), id: `progress.${profile}`, version: VERSION,
    resourcePlan: profileReference(resourceResult), resourceContribution: selectedProgressContribution.profile,
    contributors, workClasses, dependencies, fairnessClasses,
    noProgress: {
      outcomes: NO_PROGRESS_OUTCOMES,
      classifier: schemaReference(`cuda-mcgs.synthetic-${profile}-no-progress-classifier`),
      waitGraph: schemaReference(`cuda-mcgs.synthetic-${profile}-wait-graph`),
      potential: schemaReference(`cuda-mcgs.synthetic-${profile}-progress-potential`),
      maxRepeatedTransitions: '65536', maxEvidenceRecords: '1024', source: 'device-visible-ready-facts',
      firstCause: 'immutable-first-fatal-cas', hostObservation: 'non-progressing',
      externalWait: sessionContributor ? {
        kind: 'session-only', owner: sessionContributor.id,
        state: transitionsByOwner.get(sessionContributor.id).external, maxPendingCommands: '64',
      } : { kind: 'absent' },
    },
    stop: {
      states: ['running', 'stop-requested', 'draining', 'terminal'], firstCause: 'immutable-first-cas', ordinaryAdmissionClosedAt: 'stop-requested',
      mustDrainKinds: ['must-drain', 'terminal-output', 'producer-unblocking', 'resource-recovery'],
      epochChange: schemaReference(`cuda-mcgs.synthetic-${profile}-epoch-change`), observationDependency: 'none', counterWrap: 'prohibited',
    },
    closure: {
      workClasses: workClasses.map(({ id }) => id), workAccounting: 'all-admitted-terminal', channels: 'all-required-terminal',
      ownerTransitions: 'ready-or-quarantined', resources: 'conservation-reconciled', terminalOutput: 'publishable-from-reserve',
      publication: schemaReference(`cuda-mcgs.synthetic-${profile}-closure-publication`), observationAckRequired: false,
      outputBorrow: hasLiveOutput ? { kind: 'bounded-postsemantic', maximum: '1', teardown: schemaReference(`cuda-mcgs.synthetic-${profile}-output-borrow-teardown`) } : { kind: 'none' },
      conflict: schemaReference(`cuda-mcgs.synthetic-${profile}-closure-conflict`),
    },
    lifecycle: {
      states: ['profile-normalized', 'resources-admitted', 'initialized', 'running', 'draining', 'terminal', 'released'],
      failure: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-failure`), quarantine: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-quarantine`),
      teardown: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-teardown`), release: schemaReference(`cuda-mcgs.synthetic-${profile}-lifecycle-release`),
    },
    ports: PORTS.map((id) => ({
      id, phase: 'device-active', contract: schemaReference(`cuda-mcgs.synthetic-${profile}-port-${id}`), bounds: bounds({ maxStepsPerAttempt: id === 'publish-closure' ? '1024' : '256' }),
      completion: id === 'publish-closure' ? 'must-drain' : (id === 'classify-no-progress' ? 'finite-continuation' : 'bounded'),
      statuses: ['work-capacity', 'work-stale', 'progress-cancelled', 'progress-internal-failure'],
    })),
    statuses: statuses(),
    diagnostics: { authority: 'non-authoritative', maxRecords: '1024', maxBytes: '131072', overflow: 'count', rawAddresses: false, privatePayloads: false, wallClock: false },
    compatibility: { packageIdentityRequired: true, schedulerIdentityExcluded: true, persistence: { kind: 'none' } },
    cleanup: {
      kinds: CLEANUP_KINDS, disposition: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-disposition`),
      quarantine: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-quarantine`), releaseOrder: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-release-order`),
      retainedEvidence: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-retained-evidence`),
    },
    programContribution: {
      kind: 'device-program', language: 'restricted-device-js', sourceIdentity: contentIdentity(`${profile}:restricted-device-js-progress-source`),
      inputs: [...contributors.map(({ profile: reference }) => reference), profileReference(resourceResult)],
      provenance: { origin: 'first-party', revision: options.revision ?? REVISION, license: 'Apache-2.0', review: schemaReference(`cuda-mcgs.synthetic-${profile}-program-security-review`) },
    },
    productData: [],
  };
}

export function buildProgressProfiles(inspected, resourceResults) {
  return [
    buildProfile('synthetic-evaluator-absent', inspected, resourceResults[0]),
    buildProfile('synthetic-evaluator-workspace', inspected, resourceResults[1]),
    buildProfile('synthetic-live-session', inspected, resourceResults[2]),
  ];
}

export function buildProgressProfile(profile, inspected, resourceResult, options = {}) {
  return buildProfile(profile, inspected, resourceResult, options);
}

export function buildStageProgressProfile(inspected, resourceResult) {
  return buildProfile('synthetic-stage-capabilities', inspected, resourceResult, { revision: STAGE_REVISION });
}

export function buildChannelProgressProfile(inspected, resourceResult) {
  return buildProfile('synthetic-stage-channels', inspected, resourceResult, { revision: CHANNEL_REVISION });
}

export function buildChannelFirstProductDeletedProgressProfile(inspected, resourceResult) {
  return buildProfile('synthetic-stage-channels', inspected, resourceResult, { revision: CHANNEL_REVISION });
}

export function progressSyntheticSchemaReference(id) {
  return schemaReference(id);
}

export function progressSyntheticContentIdentity(label) {
  return contentIdentity(label);
}

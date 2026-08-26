import { createHash } from 'node:crypto';

const VERSION = '0.1.0';
const REVISION = '93f42b53367cb445a87810940659f753d1646491';
const TRANSACTION_STATES = ['vacant', 'validating', 'admitting', 'prepared', 'committing', 'committed', 'aborting', 'aborted', 'quarantined'];
const LIFECYCLE_STATES = ['profile-normalized', 'resources-admitted', 'initialized', 'active-external-wait', 'cancelling-draining', 'terminal', 'released'];
const TEARDOWN_ORDER = ['stop-inputs', 'stop-acquisition', 'abort-prepared', 'dispose-work', 'quiesce-borrows', 'release-owner-state', 'preserve-terminal-borrow', 'release-cuda-js-opaque-state'];
const BASE_CLEANUP_KINDS = ['command', 'root-transaction', 'compound-lease', 'old-epoch-work', 'diagnostic', 'program-artifact', 'session-counter', 'root-protection'];
const ATTENTION_CLEANUP_KINDS = ['attention-publication'];
const OBSERVATION_CLEANUP_KINDS = ['observation-request', 'borrow', 'transfer'];

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

function stateClassification(contractId) {
  return new Map([
    ['SPEC-0006', 'reset'],
    ['SPEC-0007', 'retain-if-key-valid'],
    ['SPEC-0008', 'reset'],
    ['SPEC-0009', 'retain-if-key-valid'],
    ['SPEC-0010', 'retain-if-key-valid'],
    ['SPEC-0011', 'root-independent-retain'],
    ['SPEC-0012', 'invalidate-retire'],
    ['SPEC-0013', 'reset'],
  ]).get(contractId) ?? 'product-defined';
}

function owner(profile, contributor) {
  const classification = stateClassification(contributor.contract.id);
  return {
    id: contributor.id,
    role: contributor.contract.id === 'SPEC-0006' ? 'coordinator' : 'participant',
    contract: contributor.contract,
    profile: contributor.profile,
    prepare: schemaReference(`cuda-mcgs.synthetic-${profile}-${contributor.id.replaceAll('.', '-')}-prepare`),
    commit: schemaReference(`cuda-mcgs.synthetic-${profile}-${contributor.id.replaceAll('.', '-')}-commit`),
    abort: schemaReference(`cuda-mcgs.synthetic-${profile}-${contributor.id.replaceAll('.', '-')}-abort`),
    cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-${contributor.id.replaceAll('.', '-')}-cleanup`),
    state: [{
      id: `session-state.${profile}.${contributor.contract.id.toLowerCase()}`,
      classification,
      validity: classification === 'retain-if-key-valid' ? schemaReference(`cuda-mcgs.synthetic-${profile}-${contributor.contract.id.toLowerCase()}-reuse-validity`) : null,
      transform: classification === 'transform' ? schemaReference(`cuda-mcgs.synthetic-${profile}-${contributor.contract.id.toLowerCase()}-reuse-transform`) : null,
      staleDisposition: schemaReference(`cuda-mcgs.synthetic-${profile}-${contributor.contract.id.toLowerCase()}-stale-disposition`),
      release: schemaReference(`cuda-mcgs.synthetic-${profile}-${contributor.contract.id.toLowerCase()}-state-release`),
    }],
  };
}

function statuses(attentionSelected, observationSelected) {
  const classes = {
    'invalid-session-profile': 'fatal',
    'session-command-capacity': 'pressure',
    'session-command-duplicate': 'reject',
    'session-command-stale': 'reject',
    'session-attention-invalid': 'reject',
    'session-attention-conflict': 'reject',
    'root-invalid': 'reject',
    'root-update-pressure': 'pressure',
    'root-update-conflict': 'reject',
    'root-epoch-exhausted': 'stop',
    'attention-generation-exhausted': 'stop',
    'session-cancelling': 'cancellation',
    'session-restart-required': 'stop',
    'session-terminal': 'normal',
    'session-internal-failure': 'fatal',
    'root-update-accepted': 'normal',
    'session-observation-unavailable': 'pending',
    'session-observation-stale': 'reject',
    'session-observation-pressure': 'pressure',
  };
  return Object.entries(classes)
    .filter(([code]) => (attentionSelected || (!code.startsWith('session-attention-') && code !== 'attention-generation-exhausted')) && (observationSelected || !code.startsWith('session-observation-')))
    .map(([code, statusClass]) => ({ code, class: statusClass, diagnostic: true }));
}

function port(profile, id, phase, permission, portStatuses) {
  const token = id.replaceAll(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return {
    id,
    phase,
    input: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-input`),
    output: schemaReference(`cuda-mcgs.synthetic-${profile}-${token}-output`),
    maxWorkUnits: '4096',
    permission,
    statuses: portStatuses,
    mechanism: 'public-cuda-js-contract',
    hostProgress: 'none',
  };
}

function counter(profile, kind, maximum, exhaustionOutcome) {
  return {
    id: `session-counter.${profile}.${kind}`,
    kind,
    maximum,
    reserved: '0',
    exhaustionThreshold: maximum,
    rollover: kind === 'session-incarnation' ? 'prohibited' : 'new-session-incarnation',
    exhaustionOutcome,
    staleAliasProhibited: true,
  };
}

function buildProfile(profile, inspected, resourceResult, progressResult, outputResult, options = {}) {
  const resource = resourceResult.normalized;
  const progress = progressResult.normalized;
  const output = outputResult.normalized;
  const sessionOwner = resource.contributors.find(({ contract }) => contract.id === 'SPEC-0006');
  const progressSessionOwner = progress.contributors.find(({ contract }) => contract.id === 'SPEC-0006');
  const domainOwner = progress.contributors.find(({ contract }) => contract.id === 'SPEC-0007');
  const graphOwner = progress.contributors.find(({ contract }) => contract.id === 'SPEC-0010');
  const policyOwner = progress.contributors.find(({ contract }) => contract.id === 'SPEC-0008');
  const outputOwner = progress.contributors.find(({ contract }) => contract.id === 'SPEC-0013');
  const rootReserve = resource.reserves.find(({ purpose }) => purpose === 'root-update');
  const rootClass = resource.classes.find(({ id, contributor }) => id === rootReserve.class && contributor === sessionOwner.id);
  const rootAdmission = resource.admissionGroups.find(({ classes }) => classes.includes(rootClass.id));
  const selectedObservation = output.observations.kind === 'selected' ? output.observations.profiles[0] : null;
  const attentionSelected = options.attention !== false;
  const observationSelected = selectedObservation !== null;
  const rootPermission = schemaReference(`cuda-mcgs.synthetic-${profile}-permission-root-update`);
  const attentionPermission = schemaReference(`cuda-mcgs.synthetic-${profile}-permission-attention`);
  const cancellationPermission = schemaReference(`cuda-mcgs.synthetic-${profile}-permission-cancellation`);
  const observationPermission = selectedObservation?.request.permission ?? schemaReference(`cuda-mcgs.synthetic-${profile}-permission-observation`);
  const administratorPermission = schemaReference(`cuda-mcgs.synthetic-${profile}-permission-session-admin`);
  const permissions = [rootPermission, cancellationPermission, ...(attentionSelected ? [attentionPermission] : []), ...(observationSelected ? [observationPermission] : []), administratorPermission];
  const rootSchema = schemaReference(`cuda-mcgs.synthetic-${profile}-root-command`);
  const rootAuthority = schemaReference(`cuda-mcgs.synthetic-${profile}-root-authority`);
  const rootIdempotence = schemaReference(`cuda-mcgs.synthetic-${profile}-root-idempotence`);
  const rootEffect = schemaReference(`cuda-mcgs.synthetic-${profile}-root-effect`);
  const rootApplication = schemaReference(`cuda-mcgs.synthetic-${profile}-root-commit-point`);
  const cancellationSchema = schemaReference(`cuda-mcgs.synthetic-${profile}-cancellation-command`);
  const attentionSchema = schemaReference(`cuda-mcgs.synthetic-${profile}-attention-change`);
  const attentionAuthority = schemaReference(`cuda-mcgs.synthetic-${profile}-attention-authority`);
  const attentionIdempotence = schemaReference(`cuda-mcgs.synthetic-${profile}-attention-idempotence`);
  const attentionEffect = schemaReference(`cuda-mcgs.synthetic-${profile}-attention-effect`);
  const attentionApplication = schemaReference(`cuda-mcgs.synthetic-${profile}-attention-device-application`);
  const rootInputId = `session-input.${profile}.root-update`;
  const attentionInputId = `session-input.${profile}.attention-change`;
  const cancellationInputId = `session-input.${profile}.cancellation`;
  const observationInputId = `session-input.${profile}.observation-request`;
  const inputs = [
    {
      id: rootInputId, kind: 'root-update', schema: rootSchema, owner: domainOwner.id, permission: rootPermission, authority: rootAuthority,
      idempotence: rootIdempotence, epochScope: 'session-and-root-epoch', maxBytes: '4096', pressureStatus: 'root-update-pressure',
      effect: rootEffect, deviceApplicationPoint: rootApplication, runtimeCode: false,
    },
    {
      id: cancellationInputId, kind: 'cancellation', schema: cancellationSchema, owner: progressSessionOwner.id, permission: cancellationPermission,
      authority: schemaReference(`cuda-mcgs.synthetic-${profile}-cancellation-authority`), idempotence: schemaReference(`cuda-mcgs.synthetic-${profile}-cancellation-idempotence`),
      epochScope: 'session', maxBytes: '256', pressureStatus: 'session-cancelling', effect: schemaReference(`cuda-mcgs.synthetic-${profile}-cancellation-effect`),
      deviceApplicationPoint: null, runtimeCode: false,
    },
  ];
  if (attentionSelected) inputs.push({
    id: attentionInputId, kind: 'attention', schema: attentionSchema, owner: policyOwner.id, permission: attentionPermission, authority: attentionAuthority,
    idempotence: attentionIdempotence, epochScope: 'session', maxBytes: '1024', pressureStatus: 'session-attention-conflict',
    effect: attentionEffect, deviceApplicationPoint: attentionApplication, runtimeCode: false,
  });
  if (selectedObservation) inputs.push({
    id: observationInputId, kind: 'observation-request', schema: selectedObservation.request.identity, owner: outputOwner.id, permission: observationPermission,
    authority: schemaReference(`cuda-mcgs.synthetic-${profile}-observation-authority`), idempotence: schemaReference(`cuda-mcgs.synthetic-${profile}-observation-idempotence`),
    epochScope: 'session-and-root-epoch', maxBytes: '512', pressureStatus: 'session-observation-pressure',
    effect: schemaReference(`cuda-mcgs.synthetic-${profile}-observation-request-effect`), deviceApplicationPoint: null, runtimeCode: false,
  });

  const owners = progress.contributors.map((entry) => owner(profile, entry));
  const participantByContract = new Map(owners.filter(({ role }) => role === 'participant').map((entry) => [entry.contract.id, entry.id]));
  const prepareOrder = ['SPEC-0007', 'SPEC-0010', 'SPEC-0008', 'SPEC-0009', 'SPEC-0012', 'SPEC-0013'].map((id) => participantByContract.get(id)).filter(Boolean);
  const outputObservationProfiles = selectedObservation ? [{
    id: `session-observation.${profile}.live`,
    outputProfile: selectedObservation.id,
    requestInput: observationInputId,
    rootEpochBinding: output.snapshot.rootEpoch,
    acquisition: output.publication.acquireRead,
    release: output.publication.borrowRelease,
    unavailable: 'session-observation-unavailable',
    stale: 'session-observation-stale',
    pressure: 'session-observation-pressure',
    maxPendingRequests: selectedObservation.maxRequests,
    maxBorrows: selectedObservation.maxBorrows,
    maxTransfers: selectedObservation.maxTransfers,
    readOnly: true,
    hostProgress: 'none',
    runtimeSchema: 'prohibited',
    teardown: selectedObservation.cleanup,
  }] : [];
  const rootScopedContracts = new Set(['SPEC-0007', 'SPEC-0008', 'SPEC-0009', 'SPEC-0010', 'SPEC-0012', 'SPEC-0013']);
  const workScopes = progress.workClasses.map((work) => {
    const ownerContract = progress.contributors.find(({ id }) => id === work.owner).contract.id;
    const rootScoped = rootScopedContracts.has(ownerContract);
    return {
      workClass: work.id,
      scope: rootScoped ? 'root-epoch' : 'session',
      staleDisposition: rootScoped ? 'abandoned-stale-root' : 'not-applicable',
      release: schemaReference(`cuda-mcgs.synthetic-${profile}-${work.id.replaceAll('.', '-')}-stale-release`),
    };
  });
  const attention = attentionSelected ? {
    kind: 'selected',
    profile: {
      id: `session-attention.${profile}.policy`, owner: policyOwner.id, input: attentionInputId, schema: attentionSchema, authority: attentionAuthority,
      identity: schemaReference(`cuda-mcgs.synthetic-${profile}-attention-identity`), idempotence: attentionIdempotence,
      generationCounter: `session-counter.${profile}.attention-generation`, effect: attentionEffect, applicationPoint: attentionApplication,
      visibility: schemaReference(`cuda-mcgs.synthetic-${profile}-attention-visibility`), coalescing: 'latest-unapplied-version',
      application: 'queued-device-control-work-at-existing-safe-point', steadyStatePolling: 'none', applicationCost: 'bounded-independent-of-search-state',
      existingWork: 'unchanged', rootEpochEffect: 'none', graphWork: 'none', reclamation: 'none', synchronization: 'no-global-barrier',
      multiDeviceVisibility: 'per-device-versioned-safe-point', pressureOutcome: 'session-attention-conflict', hostProgress: 'none',
    },
  } : { kind: 'absent' };
  const portDefinitions = [
    ['validateSessionInput', 'host-preignition', ['invalid-session-profile', 'root-invalid']],
    ['prepareRootUpdate', 'device-active', ['root-update-accepted', 'root-update-pressure', 'root-epoch-exhausted']],
    ['commitRootTransaction', 'device-active', ['root-update-accepted', 'session-internal-failure']],
    ['abortRootTransaction', 'device-active', ['session-command-stale', 'session-internal-failure']],
    ['requestCancellation', 'host-async', ['session-cancelling', 'session-terminal']],
    ['completeSession', 'device-active', ['session-terminal', 'session-internal-failure']],
    ['teardownSession', 'host-async', ['session-terminal', 'session-internal-failure']],
  ];
  if (attentionSelected) portDefinitions.push(['applyAttentionChange', 'device-active', ['session-attention-invalid', 'session-attention-conflict']]);
  if (selectedObservation) portDefinitions.push(
    ['requestObservation', 'host-async', ['session-observation-unavailable', 'session-observation-pressure']],
    ['acquireObservation', 'host-async', ['session-observation-unavailable', 'session-observation-stale']],
    ['releaseObservation', 'host-async', ['session-terminal', 'session-observation-stale']],
  );
  const programInputs = new Map();
  for (const reference of [profileReference(resourceResult), profileReference(progressResult), profileReference(outputResult)]) programInputs.set(reference.id, reference);
  for (const selectedOwner of owners.filter(({ role }) => role === 'participant')) if (!programInputs.has(selectedOwner.profile.id)) programInputs.set(selectedOwner.profile.id, selectedOwner.profile);

  return {
    schema: 'cuda-mcgs.session-profile/0.2.0',
    representation: 'cuda-mcgs.search-ir/0.2.0',
    status: 'proposal-evidence',
    contract: catalogContract(inspected, 'SPEC-0006'),
    id: `session.${profile}`,
    version: VERSION,
    resourcePlan: profileReference(resourceResult),
    progressPlan: profileReference(progressResult),
    outputProfile: profileReference(outputResult),
    resourceContribution: sessionOwner.profile,
    progressContribution: progressSessionOwner.profile,
    identity: {
      session: schemaReference(`cuda-mcgs.synthetic-${profile}-session-identity`),
      incarnation: schemaReference(`cuda-mcgs.synthetic-${profile}-session-incarnation`),
      root: schemaReference(`cuda-mcgs.synthetic-${profile}-root-identity`),
      rootEpoch: schemaReference(`cuda-mcgs.synthetic-${profile}-root-epoch`),
      command: schemaReference(`cuda-mcgs.synthetic-${profile}-command-identity`),
      rootTransaction: schemaReference(`cuda-mcgs.synthetic-${profile}-root-transaction-identity`),
    },
    commands: {
      capacity: progress.noProgress.externalWait.maxPendingCommands,
      maxBytes: '4096',
      order: 'arrival-total-order',
      conflict: 'typed-reject',
      coalescing: 'owner-declared-only',
      replay: 'original-terminal-or-typed-stale',
      authority: 'least-authority-versioned',
      admissionBeforeMutation: true,
      hostProgress: 'none',
      inputs,
    },
    rootTransaction: {
      states: TRANSACTION_STATES,
      linearization: 'root-epoch-publication',
      preMutationAdmission: true,
      prepareOrder,
      commitOrder: [...prepareOrder],
      abortOrder: [...prepareOrder].reverse(),
      compoundAdmission: { resourceGroup: rootAdmission.id, rootReserve: rootReserve.id, maxTransactions: rootAdmission.maxTransactions, rollback: rootAdmission.rollback },
      rejectedEffect: 'none',
      duplicateEffect: 'none',
      partialCommit: 'fatal-quarantine',
      concurrentOrder: 'single-authoritative-transaction-order',
      completion: schemaReference(`cuda-mcgs.synthetic-${profile}-root-transaction-completion`),
      cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-root-transaction-cleanup`),
    },
    root: {
      descriptorSchema: rootSchema,
      validationOwner: domainOwner.id,
      graphOwner: graphOwner.id,
      epochCounter: `session-counter.${profile}.root-epoch`,
      pressureOutcome: options.restart ? 'restart-required' : 'reject-keep-session',
      materialization: 'prepare-nonauthoritative',
      commit: 'single-authoritative-linearization',
      oldRoot: 'authoritative-until-commit',
      publication: 'release-after-full-initialization',
      workScopes,
      rejectedOutcome: 'root-invalid',
      acceptedOutcome: 'root-update-accepted',
      exhaustedOutcome: options.restart ? 'session-restart-required' : 'root-update-pressure',
    },
    owners,
    attention,
    observations: selectedObservation ? { kind: 'selected', profiles: outputObservationProfiles } : { kind: 'absent' },
    reclamation: {
      rootCommitSeparate: true,
      fullGraphSynchronous: false,
      protectedReferences: ['old-epoch-work', 'observation', 'borrow', 'root-transaction'],
      generationSafety: schemaReference(`cuda-mcgs.synthetic-${profile}-reclamation-generation-safety`),
      gracePeriod: schemaReference(`cuda-mcgs.synthetic-${profile}-reclamation-grace-period`),
      pressureOutcome: 'root-update-pressure',
      failureOutcome: 'session-internal-failure',
      cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-reclamation-cleanup`),
    },
    counters: [
      counter(profile, 'session-incarnation', '18446744073709551615', 'session-restart-required'),
      counter(profile, 'root-epoch', rootClass.range.generationMaximum, 'root-epoch-exhausted'),
      counter(profile, 'command', '340282366920938463463374607431768211455', 'session-command-capacity'),
      ...(attentionSelected ? [counter(profile, 'attention-generation', '340282366920938463463374607431768211455', 'attention-generation-exhausted')] : []),
      counter(profile, 'observation-generation', '340282366920938463463374607431768211455', 'session-restart-required'),
      counter(profile, 'reclamation-generation', '18446744073709551615', 'session-restart-required'),
    ],
    lifecycle: {
      states: LIFECYCLE_STATES,
      cancellationOrder: 'root-transaction-and-attention-version-order',
      cancellationIdempotent: true,
      completion: {
        freezeCommands: true,
        progressClosure: progress.closure.publication,
        terminalCapture: output.terminal.cleanup,
        rootTransactionClosure: schemaReference(`cuda-mcgs.synthetic-${profile}-completion-root-transaction-closure`),
        borrowQuiescence: output.publication.borrowExpiry,
      },
      health: schemaReference(`cuda-mcgs.synthetic-${profile}-session-health`),
      restart: 'new-session-incarnation',
      persistence: 'none',
      postIgnitionInteractions: ['root-update', ...(attentionSelected ? ['attention-change'] : []), ...(selectedObservation ? ['observation-read'] : []), 'cancellation', 'completion', 'teardown'],
      hostProgress: 'none',
      teardownOrder: TEARDOWN_ORDER,
      terminalResultBinding: output.terminal.cleanup,
    },
    ports: portDefinitions.map(([id, phase, portStatuses]) => port(profile, id, phase, administratorPermission, portStatuses)),
    statuses: statuses(attentionSelected, observationSelected),
    permissions,
    security: {
      untrustedUntilValidated: true,
      rawPointers: false,
      cudaHandles: false,
      callbacks: false,
      arbitraryCode: false,
      privateOwnerPaths: false,
      maxDiagnosticRecords: '64',
      maxDiagnosticBytes: '4096',
      diagnosticOverflow: 'count',
      partialCommit: 'quarantine',
    },
    compatibility: {
      ownerSemanticsRequired: true,
      packageIdentityRequired: true,
      sidebandTransportOpaque: true,
      nativeQualification: 'separate-selected-profile',
      persistence: { kind: 'none' },
    },
    cleanup: {
      kinds: [...BASE_CLEANUP_KINDS, ...(attentionSelected ? ATTENTION_CLEANUP_KINDS : []), ...(selectedObservation ? OBSERVATION_CLEANUP_KINDS : [])],
      disposition: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-disposition`),
      quarantine: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-quarantine`),
      releaseOrder: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-release-order`),
      ownerOrder: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-owner-order`),
      retainedEvidence: schemaReference(`cuda-mcgs.synthetic-${profile}-cleanup-retained-evidence`),
      terminalBorrowPreservedUntilRelease: true,
    },
    programContribution: {
      kind: 'device-program',
      language: 'restricted-device-js',
      sourceIdentity: contentIdentity(`${profile}:restricted-device-js-session-source`),
      inputs: [...programInputs.values()],
      requirements: [
        schemaReference('cuda-js.device-js'),
        schemaReference('cuda-js.operation-lifecycle'),
        schemaReference('cuda-js.publication-mailbox'),
        ...(selectedObservation ? [schemaReference('cuda-js.scoped-atomic-observation'), schemaReference('cuda-js.async-transfer')] : []),
      ],
      provenance: { origin: 'first-party', revision: REVISION, license: 'Apache-2.0', review: schemaReference(`cuda-mcgs.synthetic-${profile}-program-security-review`) },
    },
    productData: [],
  };
}

export function buildSessionProfiles(inspected, resourceResult, progressResult, outputResult) {
  return [
    buildProfile('synthetic-live-session', inspected, resourceResult, progressResult, outputResult),
    buildProfile('synthetic-live-session-restart', inspected, resourceResult, progressResult, outputResult, { restart: true, attention: false }),
  ];
}

export function buildSessionProfile(profile, inspected, resourceResult, progressResult, outputResult, options = {}) {
  return buildProfile(profile, inspected, resourceResult, progressResult, outputResult, options);
}

export function sessionSyntheticSchemaReference(id) {
  return schemaReference(id);
}

export function sessionSyntheticContentIdentity(label) {
  return contentIdentity(label);
}

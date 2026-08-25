import { createHash } from 'node:crypto';

const VERSION = '0.1.0';
const REVISION = '650b8a098b58b498396a653dc83d616f1d79581a';
const TRANSACTION_STATES = ['vacant', 'validating', 'admitting', 'prepared', 'committing', 'committed', 'aborting', 'aborted', 'quarantined'];
const LIFECYCLE_STATES = ['profile-normalized', 'resources-admitted', 'initialized', 'active-external-wait', 'cancelling-draining', 'terminal', 'released'];
const TEARDOWN_ORDER = ['stop-inputs', 'stop-acquisition', 'abort-prepared', 'dispose-work', 'quiesce-borrows', 'release-owner-state', 'preserve-terminal-borrow', 'release-cuda-js-opaque-state'];
const BASE_CLEANUP_KINDS = ['command', 'transaction', 'compound-lease', 'old-epoch-work', 'diagnostic', 'program-artifact', 'session-counter', 'root-protection'];
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

function statuses(controlSelected, observationSelected) {
  const classes = {
    'invalid-session-profile': 'fatal',
    'session-command-capacity': 'pressure',
    'session-command-duplicate': 'reject',
    'session-command-stale': 'reject',
    'session-control-invalid': 'reject',
    'session-control-conflict': 'reject',
    'root-invalid': 'reject',
    'root-update-pressure': 'pressure',
    'root-update-conflict': 'reject',
    'root-epoch-exhausted': 'stop',
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
    .filter(([code]) => (controlSelected || !code.startsWith('session-control-')) && (observationSelected || !code.startsWith('session-observation-')))
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
  const controlSelected = options.control !== false;
  const observationSelected = selectedObservation !== null;
  const rootPermission = schemaReference(`cuda-mcgs.synthetic-${profile}-permission-root-update`);
  const controlPermission = schemaReference(`cuda-mcgs.synthetic-${profile}-permission-control`);
  const cancellationPermission = schemaReference(`cuda-mcgs.synthetic-${profile}-permission-cancellation`);
  const observationPermission = selectedObservation?.request.permission ?? schemaReference(`cuda-mcgs.synthetic-${profile}-permission-observation`);
  const administratorPermission = schemaReference(`cuda-mcgs.synthetic-${profile}-permission-session-admin`);
  const permissions = [rootPermission, cancellationPermission, ...(controlSelected ? [controlPermission] : []), ...(observationSelected ? [observationPermission] : []), administratorPermission];
  const rootSchema = schemaReference(`cuda-mcgs.synthetic-${profile}-root-command`);
  const rootAuthority = schemaReference(`cuda-mcgs.synthetic-${profile}-root-authority`);
  const rootIdempotence = schemaReference(`cuda-mcgs.synthetic-${profile}-root-idempotence`);
  const rootEffect = schemaReference(`cuda-mcgs.synthetic-${profile}-root-effect`);
  const rootApplication = schemaReference(`cuda-mcgs.synthetic-${profile}-root-commit-point`);
  const cancellationSchema = schemaReference(`cuda-mcgs.synthetic-${profile}-cancellation-command`);
  const controlSchema = schemaReference(`cuda-mcgs.synthetic-${profile}-attention-control`);
  const controlAuthority = schemaReference(`cuda-mcgs.synthetic-${profile}-attention-authority`);
  const controlIdempotence = schemaReference(`cuda-mcgs.synthetic-${profile}-attention-idempotence`);
  const controlEffect = schemaReference(`cuda-mcgs.synthetic-${profile}-attention-effect`);
  const controlApplication = schemaReference(`cuda-mcgs.synthetic-${profile}-attention-device-application`);
  const rootInputId = `session-input.${profile}.root-update`;
  const controlInputId = `session-input.${profile}.attention-control`;
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
  if (options.control !== false) inputs.push({
    id: controlInputId, kind: 'control', schema: controlSchema, owner: policyOwner.id, permission: controlPermission, authority: controlAuthority,
    idempotence: controlIdempotence, epochScope: 'session-and-root-epoch', maxBytes: '1024', pressureStatus: 'session-control-conflict',
    effect: controlEffect, deviceApplicationPoint: controlApplication, runtimeCode: false,
  });
  if (selectedObservation) inputs.push({
    id: observationInputId, kind: 'observation-request', schema: selectedObservation.request.identity, owner: outputOwner.id, permission: observationPermission,
    authority: schemaReference(`cuda-mcgs.synthetic-${profile}-observation-authority`), idempotence: schemaReference(`cuda-mcgs.synthetic-${profile}-observation-idempotence`),
    epochScope: 'session-and-root-epoch', maxBytes: '512', pressureStatus: 'session-observation-pressure',
    effect: schemaReference(`cuda-mcgs.synthetic-${profile}-observation-request-effect`), deviceApplicationPoint: null, runtimeCode: false,
  });

  const owners = progress.contributors.map((entry) => owner(profile, entry));
  const participantByContract = new Map(owners.filter(({ role }) => role === 'participant').map((entry) => [entry.contract.id, entry.id]));
  const prepareOrder = ['SPEC-0007', 'SPEC-0010', 'SPEC-0008', 'SPEC-0009', 'SPEC-0011', 'SPEC-0012', 'SPEC-0013'].map((id) => participantByContract.get(id)).filter(Boolean);
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
  const controls = options.control === false ? [] : [{
    id: `session-control.${profile}.attention`, owner: policyOwner.id, input: controlInputId, schema: controlSchema, authority: controlAuthority,
    identity: schemaReference(`cuda-mcgs.synthetic-${profile}-attention-identity`), idempotence: controlIdempotence, epochScope: 'session-and-root-epoch',
    effect: controlEffect, applicationPoint: controlApplication, visibility: schemaReference(`cuda-mcgs.synthetic-${profile}-attention-visibility`),
    pressureOutcome: 'session-control-conflict', mutationAfterCommit: true, hostProgress: 'none',
  }];
  const portDefinitions = [
    ['validateSessionInput', 'host-preignition', ['invalid-session-profile', 'root-invalid']],
    ['prepareRootUpdate', 'device-active', ['root-update-accepted', 'root-update-pressure', 'root-epoch-exhausted']],
    ['commitSessionTransaction', 'device-active', ['root-update-accepted', 'session-internal-failure']],
    ['abortSessionTransaction', 'device-active', ['session-command-stale', 'session-internal-failure']],
    ['requestCancellation', 'host-async', ['session-cancelling', 'session-terminal']],
    ['completeSession', 'device-active', ['session-terminal', 'session-internal-failure']],
    ['teardownSession', 'host-async', ['session-terminal', 'session-internal-failure']],
  ];
  if (controls.length > 0) portDefinitions.push(['prepareControlChange', 'device-active', ['session-control-invalid', 'session-control-conflict']]);
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
      transaction: schemaReference(`cuda-mcgs.synthetic-${profile}-transaction-identity`),
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
    transaction: {
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
      completion: schemaReference(`cuda-mcgs.synthetic-${profile}-transaction-completion`),
      cleanup: schemaReference(`cuda-mcgs.synthetic-${profile}-transaction-cleanup`),
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
    controls,
    observations: selectedObservation ? { kind: 'selected', profiles: outputObservationProfiles } : { kind: 'absent' },
    reclamation: {
      rootCommitSeparate: true,
      fullGraphSynchronous: false,
      protectedReferences: ['old-epoch-work', 'observation', 'borrow', 'transaction'],
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
      counter(profile, 'observation-generation', '340282366920938463463374607431768211455', 'session-restart-required'),
      counter(profile, 'reclamation-generation', '18446744073709551615', 'session-restart-required'),
    ],
    lifecycle: {
      states: LIFECYCLE_STATES,
      cancellationOrder: 'transaction-linearized',
      cancellationIdempotent: true,
      completion: {
        freezeCommands: true,
        progressClosure: progress.closure.publication,
        terminalCapture: output.terminal.cleanup,
        transactionClosure: schemaReference(`cuda-mcgs.synthetic-${profile}-completion-transaction-closure`),
        borrowQuiescence: output.publication.borrowExpiry,
      },
      health: schemaReference(`cuda-mcgs.synthetic-${profile}-session-health`),
      restart: 'new-session-incarnation',
      persistence: 'none',
      postIgnitionInteractions: ['root-update', ...(controls.length > 0 ? ['control-change'] : []), ...(selectedObservation ? ['observation-read'] : []), 'cancellation', 'completion', 'teardown'],
      hostProgress: 'none',
      teardownOrder: TEARDOWN_ORDER,
      terminalResultBinding: output.terminal.cleanup,
    },
    ports: portDefinitions.map(([id, phase, portStatuses]) => port(profile, id, phase, administratorPermission, portStatuses)),
    statuses: statuses(controlSelected, observationSelected),
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
      kinds: [...BASE_CLEANUP_KINDS, ...(selectedObservation ? OBSERVATION_CLEANUP_KINDS : [])],
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
    buildProfile('synthetic-live-session-restart', inspected, resourceResult, progressResult, outputResult, { restart: true, control: false }),
  ];
}

export function sessionSyntheticSchemaReference(id) {
  return schemaReference(id);
}

export function sessionSyntheticContentIdentity(label) {
  return contentIdentity(label);
}

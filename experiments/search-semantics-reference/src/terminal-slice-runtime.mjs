import assert from 'node:assert/strict';

import { createSyntheticDomainOracles } from './domain-instances.mjs';
import { reconcileGraphArenaRelease } from './graph-cleanup.mjs';
import { createPolicyOracle } from './policy.mjs';
import { createEvaluatorOracle } from './evaluator.mjs';
import { getProfile as getEvaluatorProfile, requestInput, ref as evaluatorRef } from './evaluator-case-support.mjs';
import { createResourceOracle } from './resource.mjs';
import {
  getResourceProfile,
  leaseInput,
  leaseRef,
  reserveByPurpose,
  reservedLeaseInput,
} from './resource-case-support.mjs';
import { createProgressOracle } from './progress.mjs';
import {
  dependencyFacts,
  getProgressProfile,
  ordinaryWorkClass,
  workInput,
  workRef,
} from './progress-case-support.mjs';
import { createOutputOracle } from './output.mjs';
import { factsForFields, getOutputProfile, terminalFields } from './output-case-support.mjs';
import {
  admitFramework,
  assertFrameworkCleanupReadback,
  borrowTerminalResult,
  igniteFramework,
  initializeFramework,
  normalizeFrameworkLifecycleProfile,
  publishFrameworkCompletion,
  recordStopCause,
  releaseTerminalResult,
  teardownFramework,
} from './framework-lifecycle.mjs';
import { runDeclaredSchedule } from './schedule.mjs';
import { closeProgressThenClassifyOutput } from './terminal-slice.mjs';

const CLEAN_GRAPH_LEDGER = Object.freeze({
  byteLedgerOutstanding: '0',
  diagnosticRecords: '0',
  edgeRecords: '0',
  expansionRecords: '0',
  nodeClaims: '0',
  ownerRegionLeases: '0',
  pathOccurrences: '0',
  protections: '0',
  retirementRecords: '0',
  transpositionEntries: '0',
});

function projected(projection, id, label) {
  const entry = projection.profiles.find((candidate) => candidate.id === id);
  assert(entry, `missing ${label} profile ${id}`);
  return entry.normalized;
}

function factValue(result, id) {
  const entry = result.facts.find((fact) => fact.id === id);
  assert(entry, `missing terminal-slice public fact ${id}`);
  return entry.value;
}

function publicOwnerResult(value, id) {
  return { state: value, publications: [{ id, value }] };
}

function outputIdentity(publication) {
  return {
    slotId: publication.slotId,
    incarnation: publication.incarnation,
    profileId: publication.profileId,
    schemaId: publication.schemaId,
    searchIncarnation: publication.searchIncarnation,
  };
}

function terminalOutputFacts(profile, ownerFacts) {
  const values = {};
  for (const field of terminalFields(profile)) {
    const contributor = profile.contributors.find(({ id }) => id === field.owner);
    assert(contributor, `Output field ${field.id} has no normalized contributor`);
    const contractId = contributor.contract?.id;
    assert(contractId && ownerFacts[contractId] !== undefined, `Output field ${field.id} lacks an owner-produced ${contractId ?? 'unknown'} fact`);
    values[field.id] = ownerFacts[contractId];
  }
  return factsForFields(terminalFields(profile), { values });
}

function absentFrameworkProfile(profile) {
  const candidate = structuredClone(profile);
  candidate.ownerOrder = candidate.ownerOrder.filter((owner) => owner !== 'evaluator');
  candidate.resultVisibleOwners = candidate.resultVisibleOwners.filter((owner) => owner !== 'evaluator');
  return normalizeFrameworkLifecycleProfile(candidate);
}

function teardownFacts(profile, outcomes) {
  const ownerResourcesReleased = outcomes.domainReleased
    && outcomes.graphReleased
    && outcomes.policyReleased
    && outcomes.evaluatorReleased
    && outcomes.resourceReleased
    && outcomes.progressReleased
    && outcomes.outputReleased;
  return {
    workFinalized: outcomes.progressReleased,
    protectionsReleased: outcomes.graphReleased,
    ownerResourcesReleased,
    opaqueCudaReleased: outcomes.cudaResidue === 0,
    transfersBorrowsReleased: outcomes.borrowsReleased,
    cachesArtifactsDisposed: outcomes.evaluatorReleased,
    localFilesDisposed: outcomes.localFileResidue === 0,
    gitStateDisposed: outcomes.gitStateResidue === 0,
    processesDeviceResourcesReleased: outcomes.processResidue === 0 && outcomes.cudaResidue === 0,
    credentialsDisposed: outcomes.credentialResidue === 0,
    externalCoordinationDisposed: outcomes.externalCoordinationResidue === 0,
    cleanupDispositions: profile.cleanup.records.map(({ id, plannedDisposition }) => ({ id, disposition: plannedDisposition })),
  };
}

function completionFacts(profile, progressClosure, ownerOutcomes) {
  return {
    progressClosed: progressClosure.kind === 'terminal',
    ownerDispositions: profile.resultVisibleOwners.map((owner) => {
      const outcome = ownerOutcomes[owner];
      assert(outcome, `missing public terminal outcome for Framework result-visible owner ${owner}`);
      return { owner, disposition: outcome.disposition };
    }),
  };
}

function scheduleEvents(order, evaluatorSelected) {
  const byName = {
    framework: { id: 'framework.owner.ignite', owner: 'framework.owner', after: [], reads: [], input: {} },
    domain: { id: 'domain.owner.root', owner: 'domain.owner', after: ['framework.owner.ignite'], reads: [], input: {} },
    graph: { id: 'graph.owner.cleanup-ready', owner: 'graph.owner', after: ['framework.owner.ignite'], reads: [], input: {} },
    policy: { id: 'policy.owner.accounting', owner: 'policy.owner', after: ['framework.owner.ignite'], reads: [], input: {} },
    evaluator: { id: 'evaluator.owner.ready', owner: 'evaluator.owner', after: ['framework.owner.ignite'], reads: [], input: {} },
    resource: { id: 'resource.owner.activate', owner: 'resource.owner', after: ['framework.owner.ignite'], reads: [], input: {} },
    output: { id: 'output.owner.initialize', owner: 'output.owner', after: ['framework.owner.ignite'], reads: [], input: {} },
    progress: { id: 'progress.owner.activate', owner: 'progress.owner', after: ['resource.owner.activate'], reads: [], input: {} },
    reserve: { id: 'resource.owner.reserve-work', owner: 'resource.owner', after: ['resource.owner.activate'], reads: [], input: {} },
    work: {
      id: 'progress.owner.complete-work',
      owner: 'progress.owner',
      after: ['progress.owner.activate', 'resource.owner.reserve-work'],
      reads: ['resource.owner.work-admission'],
      input: {},
    },
  };
  return order.filter((name) => evaluatorSelected || name !== 'evaluator').map((name) => byName[name]);
}

function runSetup({
  composerEvidence,
  domainOracle,
  domainRoot,
  graphProfile,
  policy,
  evaluator,
  evaluatorProfile,
  resource,
  resourceProfile,
  progress,
  progressProfile,
  output,
  frameworkProfile,
  scheduleId,
  order,
}) {
  const evaluatorSelected = evaluatorProfile !== null;
  const frameworkAdmitted = admitFramework(frameworkProfile);
  let frameworkRunning = null;
  let evaluatorReady = null;
  let outputInitialized = null;
  let workLeases = [];
  let completedWork = null;

  const workClass = ordinaryWorkClass(progressProfile);
  assert(workClass.resources.length > 0, 'terminal slice ordinary work must declare its Resource classes');
  assert.equal(workClass.reserve, null, 'terminal slice ordinary work must not consume a protected reserve');
  const resourceClasses = workClass.resources.map((classId) => {
    const entry = resourceProfile.classes.find(({ id }) => id === classId);
    assert(entry, `Resource profile lacks Progress-required class ${classId}`);
    return entry;
  });

  const owners = [
    ['framework.owner', { kind: 'admitted' }],
    ['domain.owner', { kind: 'not-run' }],
    ['graph.owner', { kind: 'not-run' }],
    ['policy.owner', { kind: 'not-run' }],
    ...(evaluatorSelected ? [['evaluator.owner', { kind: 'not-run' }]] : []),
    ['resource.owner', { kind: 'not-run' }],
    ['progress.owner', { kind: 'not-run' }],
    ['output.owner', { kind: 'not-run' }],
  ].map(([id, initialState]) => ({ id, initialState }));

  const transitions = {
    'framework.owner': () => {
      frameworkRunning = igniteFramework(initializeFramework(frameworkAdmitted));
      return publicOwnerResult({ phase: frameworkRunning.phase, status: frameworkRunning.status }, 'framework.owner.running');
    },
    'domain.owner': () => publicOwnerResult(domainOracle.validateRoot(domainRoot), 'domain.owner.root-ready'),
    'graph.owner': () => {
      assert(['materialized', 'stateless'].includes(graphProfile.mode));
      const result = reconcileGraphArenaRelease({ ledger: CLEAN_GRAPH_LEDGER, resourceDestructionStarted: false });
      return publicOwnerResult(result, 'graph.owner.cleanup-ready');
    },
    'policy.owner': () => publicOwnerResult(policy.assertAccounting(), 'policy.owner.accounting-ready'),
    'resource.owner': ({ context }) => {
      if (context.eventId === 'resource.owner.activate') return publicOwnerResult(resource.activate(), 'resource.owner.active');
      const inputs = resourceClasses.map((resourceClass, index) => leaseInput(resourceClass, `${scheduleId}-${index + 1}`, { quantity: '1' }));
      const claimed = [];
      for (const input of inputs) {
        const reserved = resource.reserveResource(input);
        if (reserved.kind !== 'claimed') {
          for (const previous of claimed.reverse()) resource.releaseResource(leaseRef(previous));
        }
        assert.equal(reserved.kind, 'claimed');
        claimed.push(input);
      }
      workLeases = claimed;
      return publicOwnerResult({
        approved: true,
        token: `resource:${scheduleId}:${claimed.map(({ leaseId, generation }) => `${leaseId}/${generation}`).join('|')}`,
        classes: resourceClasses.map(({ id }) => id),
        reserve: null,
        leaseReferences: claimed.map((input) => leaseRef(input)),
      }, 'resource.owner.work-admission');
    },
    'progress.owner': ({ context }) => {
      if (context.eventId === 'progress.owner.activate') return publicOwnerResult(progress.activate({ rootEpoch: '1', workEpoch: '1' }), 'progress.owner.active');
      const admission = context.facts['resource.owner.work-admission'];
      const input = workInput(workClass, scheduleId, { resourceAdmission: {
        approved: admission.approved,
        token: admission.token,
        classes: admission.classes,
        reserve: admission.reserve,
      } });
      assert.equal(progress.admitWork(input).kind, 'admitted');
      assert.equal(progress.publishReady({
        ...workRef(input),
        payloadReady: true,
        resourceReady: true,
        dependencyFacts: dependencyFacts(progressProfile, workClass),
      }).kind, 'ready');
      assert.equal(progress.claimReady({ ...workRef(input), claimId: `claim-${scheduleId}` }).kind, 'claimed');
      completedWork = progress.completeWork({ ...workRef(input), operationId: `complete-${scheduleId}`, resultVisible: false });
      return publicOwnerResult(completedWork, 'progress.owner.work-complete');
    },
    'output.owner': () => {
      outputInitialized = output.initializeOutputProfile({ searchIdentity: `search.${scheduleId}`, sessionIdentity: 'session-absent' });
      return publicOwnerResult(outputInitialized, 'output.owner.initialized');
    },
    ...(evaluatorSelected ? {
      'evaluator.owner': () => {
        const input = requestInput(evaluatorProfile, scheduleId, { rootEpoch: '1', workEpoch: '1' });
        assert.equal(evaluator.admitRequest(input).kind, 'queued');
        for (const capability of evaluatorProfile.capabilities) {
          evaluator.publishCapability({
            ...evaluatorRef(input),
            capabilityId: capability.id,
            payload: { token: `${scheduleId}:${capability.id}` },
            validity: { complete: true, profile: evaluatorProfile.id },
            source: 'fresh-execution',
          });
        }
        evaluatorReady = evaluator.observeRequest(evaluatorRef(input));
        assert.equal(evaluatorReady.state, 'ready');
        return publicOwnerResult(evaluatorReady, 'evaluator.owner.ready');
      },
    } : {}),
  };

  const result = runDeclaredSchedule({
    schema: 'cuda-mcgs.reference-declared-schedule/0.1.0',
    evidenceKey: composerEvidence.representationCompositionEvidenceKey.sha256,
    id: scheduleId,
    owners,
    events: scheduleEvents(order, evaluatorSelected),
  }, transitions, composerEvidence.representationCompositionEvidenceKey.sha256);

  assert.equal(workLeases.length, resourceClasses.length, 'schedule did not reserve every Progress-required Resource class');
  assert(completedWork, 'schedule did not complete Progress work');
  assert(outputInitialized, 'schedule did not initialize Output');
  assert(frameworkRunning, 'schedule did not ignite Framework');
  return { result, frameworkRunning, evaluatorReady, outputInitialized, workLeases };
}

function finishTerminalSlice({
  setup,
  domainOracle,
  domainRoot,
  policy,
  evaluator,
  evaluatorSelected,
  resource,
  resourceProfile,
  progress,
  output,
  outputProfile,
  frameworkProfile,
}) {
  const domainFact = factValue(setup.result, 'domain.owner.root-ready');
  const graphFact = factValue(setup.result, 'graph.owner.cleanup-ready');
  const outputInitializationFact = factValue(setup.result, 'output.owner.initialized');
  const workFact = factValue(setup.result, 'progress.owner.work-complete');
  assert.equal(workFact.kind, 'completed');

  const workLeaseReferences = setup.workLeases?.map((input) => leaseRef(input))
    ?? factValue(setup.result, 'resource.owner.work-admission').leaseReferences;
  for (const reference of workLeaseReferences) resource.releaseResource(reference);

  const policyStop = policy.requestStop({ cause: 'policy-budget-satisfied', ready: true });
  assert.equal(policy.beginDrain().kind, 'draining');
  const policyTerminal = policy.terminalizeStop({ classification: 'complete' });
  assert.equal(policyTerminal.kind, 'terminal');
  const policyCleanup = policy.cleanup();
  assert.equal(policyCleanup.kind, 'complete');

  const evaluatorTerminalFact = evaluatorSelected ? setup.evaluatorReady : evaluator.snapshot();
  const evaluatorCleanup = evaluator.cleanup();
  assert.equal(evaluatorCleanup.kind, 'complete');
  assert.equal(evaluatorCleanup.runtimeResidue, 0);
  let evaluatorRemoval = null;
  if (!evaluatorSelected) {
    evaluatorRemoval = evaluator.removeEvaluator();
    assert.equal(evaluatorRemoval.kind, 'removed');
    assert.equal(evaluatorRemoval.runtimeResidue, 0);
  }

  const progressStop = progress.requestStop({ cause: policyStop.cause ?? 'policy-budget-satisfied' });
  assert.equal(progress.beginDraining().kind, 'draining');

  assert.equal(resource.beginDraining().kind, 'draining');
  const cleanupReserve = reserveByPurpose(resourceProfile, 'progress-cleanup');
  const cleanupLease = reservedLeaseInput(resourceProfile, cleanupReserve, 'terminal-slice-cleanup', { quantity: cleanupReserve.minimum });
  const cleanupAdmission = resource.reserveResource(cleanupLease);
  assert.equal(cleanupAdmission.kind, 'claimed', 'progress-cleanup reserve must remain available after ordinary admission closes');
  resource.releaseResource(leaseRef(cleanupLease));
  assert.equal(resource.markTerminal().kind, 'terminal');
  const resourceConservation = resource.assertConservation();
  assert.equal(resourceConservation.kind, 'conserved');

  const ownerTransitionsReady = policyTerminal.kind === 'terminal'
    && graphFact.kind === 'ready-for-resource-destruction'
    && evaluatorCleanup.runtimeResidue === 0;
  const progressClosureFacts = {
    channelsTerminal: true,
    ownerTransitionsReady,
    resourcesConserved: resourceConservation.kind === 'conserved',
    terminalOutputPublishable: outputInitializationFact.kind === 'initialized',
  };
  const outputEnvelope = {
    completionClass: 'complete',
    firstStopCause: progressStop.firstCause.cause,
    completedWork: { count: '1', unit: 'work-items' },
    policyBudgetStatus: policyTerminal.classification,
    resourceStatus: resourceConservation,
    diagnosticIdentity: 'diagnostic.terminal-slice.none',
    laterDispositions: [],
  };
  const { closure: progressClosure } = closeProgressThenClassifyOutput({ progress, output, progressClosureFacts, outputEnvelope });
  assert.equal(progressClosure.kind, 'terminal');

  const ownerFacts = {
    'SPEC-0000': { phase: setup.frameworkRunning.phase, status: setup.frameworkRunning.status },
    'SPEC-0007': domainFact,
    'SPEC-0008': policyTerminal,
    'SPEC-0009': evaluatorTerminalFact,
    'SPEC-0010': graphFact,
    'SPEC-0011': resourceConservation,
    'SPEC-0012': progressClosure,
    'SPEC-0013': outputInitializationFact,
  };
  const outputFacts = terminalOutputFacts(outputProfile, ownerFacts);
  assert.equal(output.captureTerminalPayload({ facts: outputFacts }).kind, 'captured');
  const publishedOutput = output.publishOutput({ slotId: 'terminal-0' });
  assert.equal(publishedOutput.kind, 'ready');

  const borrowedOutput = output.acquireOutput({ ...outputIdentity(publishedOutput), borrowId: 'terminal-slice-borrow' });
  assert.equal(borrowedOutput.kind, 'borrowed');
  assert.equal(output.teardown().kind, 'pending-borrow-or-transfer');
  assert.equal(output.releaseOutput({ ...outputIdentity(publishedOutput), borrowId: 'terminal-slice-borrow' }).kind, 'released');
  const outputTeardown = output.teardown();
  assert.equal(outputTeardown.kind, 'terminal-retained');
  const outputCleanup = output.cleanupReport();
  assert(outputCleanup.every(({ disposition }) => disposition !== 'pending'), 'Output cleanup readback must contain no pending dispositions');

  const progressCleanup = progress.cleanup({ outputBorrowClosed: true });
  assert.equal(progressCleanup.runtimeResidue, 0);
  const resourceCleanup = resource.cleanup();
  assert.equal(resourceCleanup.runtimeResidue, 0);
  const domainCleanup = domainOracle.teardownProfile({
    phase: 'terminal',
    domainMetadata: { profileId: domainRoot.profileId },
    admittedRangeReferences: [],
  });
  assert.equal(domainCleanup.status, 'released');
  assert.equal(domainCleanup.retained.domainMetadata, 0);
  assert.equal(domainCleanup.retained.admittedRangeReferences, 0);

  const stoppedFramework = recordStopCause(setup.frameworkRunning, progressClosure.firstStopCause.cause);
  const frameworkTerminal = publishFrameworkCompletion(stoppedFramework, completionFacts(frameworkProfile, progressClosure, {
    policy: { disposition: policyTerminal.kind === 'terminal' ? 'ready' : 'pending' },
    evaluator: { disposition: evaluatorSelected && evaluatorCleanup.runtimeResidue === 0 ? 'ready' : 'terminally-absent' },
    output: { disposition: publishedOutput.kind === 'ready' ? 'ready' : 'pending' },
  }));
  const borrowedFramework = borrowTerminalResult(frameworkTerminal);
  const pendingFramework = teardownFramework(borrowedFramework);
  assert.equal(pendingFramework.teardownPending, true);
  const releasedFrameworkBorrow = releaseTerminalResult(pendingFramework);

  const structuralResidue = {
    session: 0,
    stage: 0,
    channel: 0,
    cuda: 0,
    localFiles: 0,
    gitState: 0,
    processes: 0,
    credentials: 0,
    externalCoordination: 0,
  };
  const releasedFramework = teardownFramework(releasedFrameworkBorrow, teardownFacts(frameworkProfile, {
    domainReleased: domainCleanup.status === 'released',
    graphReleased: graphFact.graphCleanupComplete === true,
    policyReleased: policyCleanup.kind === 'complete',
    evaluatorReleased: evaluatorCleanup.runtimeResidue === 0 && (evaluatorSelected || evaluatorRemoval?.runtimeResidue === 0),
    resourceReleased: resourceCleanup.runtimeResidue === 0,
    progressReleased: progressCleanup.runtimeResidue === 0,
    outputReleased: outputTeardown.kind === 'terminal-retained' && outputCleanup.every(({ disposition }) => disposition !== 'pending'),
    borrowsReleased: true,
    cudaResidue: structuralResidue.cuda,
    localFileResidue: structuralResidue.localFiles,
    gitStateResidue: structuralResidue.gitState,
    processResidue: structuralResidue.processes,
    credentialResidue: structuralResidue.credentials,
    externalCoordinationResidue: structuralResidue.externalCoordination,
  }));
  assert.equal(releasedFramework.phase, 'released');
  assert.equal(assertFrameworkCleanupReadback(releasedFramework), true);

  return {
    schedule: setup.result.scheduleIdentity,
    domainProfile: domainRoot.profileId,
    graphCleanup: graphFact,
    policyTerminal,
    evaluatorSelection: evaluatorSelected ? evaluator.selection : evaluatorRemoval.selection,
    evaluatorResidue: evaluatorSelected ? evaluatorCleanup.runtimeResidue : evaluatorRemoval.runtimeResidue,
    resourceConservation,
    progressClosure,
    outputEnvelope: publishedOutput.envelope,
    outputCleanup,
    frameworkReleasedOwners: releasedFramework.releasedOwners,
    frameworkCleanupReadback: releasedFramework.cleanupReadback,
    structuralResidue,
    hostProgressRequired: false,
    firstProductSpecificResidue: 0,
  };
}

export function runCompleteTerminalSlice({
  composerEvidence,
  domainFixture,
  frameworkFixture,
  projections,
  family,
  scheduleId,
  order,
}) {
  const selected = family === 'selected';
  assert(selected || family === 'absent');
  const domainOracles = createSyntheticDomainOracles(projections.domain);
  const domainOracle = selected ? domainOracles.transposing : domainOracles.lazy;
  const domainRoot = selected ? domainFixture.roots.transposingAlphaPacked : domainFixture.roots.lazyContinuous;
  const graphProfile = projected(projections.graph, selected ? 'graph.synthetic-transposing' : 'graph.synthetic-stateless', 'Graph');
  assert.equal(graphProfile.domainProfile.id, domainRoot.profileId);
  const policyProfile = projected(projections.policy, selected ? 'policy.synthetic-vector-combined' : 'policy.synthetic-proposal-only-stateless', 'Policy');
  const policy = createPolicyOracle({ profile: policyProfile });
  const evaluatorProfile = selected ? getEvaluatorProfile(projections.evaluator, 'evaluator.synthetic-vector-combined') : null;
  const evaluator = createEvaluatorOracle({ profile: evaluatorProfile });
  const resourceProfile = getResourceProfile(projections.resource, selected ? 'resource.synthetic-evaluator-workspace' : 'resource.synthetic-evaluator-absent');
  const resource = createResourceOracle({ profile: resourceProfile });
  const progressProfile = getProgressProfile(projections.progress, selected ? 'progress.synthetic-evaluator-workspace' : 'progress.synthetic-evaluator-absent');
  const progress = createProgressOracle({ profile: progressProfile });
  const outputProfile = getOutputProfile(projections.output, selected ? 'output.synthetic-evaluator-workspace' : 'output.synthetic-evaluator-absent');
  const output = createOutputOracle({ profile: outputProfile });
  const frameworkProfile = selected ? normalizeFrameworkLifecycleProfile(frameworkFixture.profile) : absentFrameworkProfile(frameworkFixture.profile);

  const setup = runSetup({
    composerEvidence,
    domainOracle,
    domainRoot,
    graphProfile,
    policy,
    evaluator,
    evaluatorProfile,
    resource,
    resourceProfile,
    progress,
    progressProfile,
    output,
    frameworkProfile,
    scheduleId,
    order,
  });
  return finishTerminalSlice({
    setup,
    domainOracle,
    domainRoot,
    policy,
    evaluator,
    evaluatorSelected: selected,
    resource,
    resourceProfile,
    progress,
    output,
    outputProfile,
    frameworkProfile,
  });
}

export function terminalSliceMeaning(result) {
  return {
    domainProfile: result.domainProfile,
    evaluatorSelection: result.evaluatorSelection,
    evaluatorResidue: result.evaluatorResidue,
    resourceConservation: result.resourceConservation.kind,
    progressClosure: result.progressClosure.kind,
    completionClass: result.outputEnvelope.completionClass,
    firstStopCause: result.outputEnvelope.firstStopCause,
    policyBudgetStatus: result.outputEnvelope.policyBudgetStatus,
    structuralResidue: result.structuralResidue,
    hostProgressRequired: result.hostProgressRequired,
    firstProductSpecificResidue: result.firstProductSpecificResidue,
  };
}

export function terminalSliceScheduleOrders() {
  return {
    ownerMajor: ['framework', 'domain', 'graph', 'policy', 'evaluator', 'resource', 'output', 'progress', 'reserve', 'work'],
    resourceInterleaved: ['framework', 'resource', 'progress', 'reserve', 'domain', 'output', 'graph', 'evaluator', 'policy', 'work'],
  };
}

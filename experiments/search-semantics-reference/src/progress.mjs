import { canonicalBytes, canonicalClone, frozenCanonicalClone } from './canonical.mjs';
import { fail } from './errors.mjs';

const freeze = (value, label = 'Progress value') => frozenCanonicalClone(value, label);
const same = (left, right, label = 'Progress value') => canonicalBytes(left, `${label} left`).equals(canonicalBytes(right, `${label} right`));
const dec = (value, label = 'decimal') => {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) fail('PROGRESS_REFERENCE_DECIMAL', `${label} must be a canonical decimal string`);
  return BigInt(value);
};
const text = (value, label) => {
  if (typeof value !== 'string' || value.length === 0) fail('PROGRESS_REFERENCE_ID', `${label} must be a non-empty string`);
  return value;
};
const terminalStates = new Set(['completed', 'failed', 'cancelled', 'abandoned', 'stale-disposed', 'quarantined']);
const fatalNoProgress = new Map([
  ['deadlock', 'progress-deadlock'],
  ['livelock', 'progress-livelock'],
  ['starvation', 'progress-starvation'],
  ['orphaned-work', 'orphaned-work'],
  ['counter-exhausted', 'progress-counter-exhausted'],
]);
const epochKeys = ['root', 'work'];

function normalizeEpochs(input, label = 'Progress epochs') {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('PROGRESS_REFERENCE_EPOCH', `${label} must be an object`);
  const keys = Object.keys(input).sort();
  if (keys.length !== epochKeys.length || epochKeys.some((key) => !keys.includes(key))) fail('PROGRESS_REFERENCE_EPOCH', `${label} must contain exactly root/work`);
  return freeze(Object.fromEntries(epochKeys.map((key) => [key, dec(input[key], `${label} ${key}`).toString()])), label);
}

function refKey(reference) {
  return JSON.stringify([reference.workId, reference.incarnation]);
}

function terminal(state) {
  return terminalStates.has(state);
}

function hasCycle(edges) {
  const adjacency = new Map();
  for (const { from, to } of edges) {
    const list = adjacency.get(from) ?? [];
    list.push(to);
    adjacency.set(from, list);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(node) {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of adjacency.get(node) ?? []) if (visit(next)) return true;
    visiting.delete(node);
    visited.add(node);
    return false;
  }
  return [...adjacency.keys()].some(visit);
}

export function createProgressOracle({ profile, counterStarts = {}, mutations = {} } = {}) {
  if (!profile) fail('PROGRESS_REFERENCE_PROFILE', 'normalized Progress profile is required');
  const classById = new Map(profile.workClasses.map((entry) => [entry.id, entry]));
  const dependencyById = new Map(profile.dependencies.map((entry) => [entry.id, entry]));
  const fairnessById = new Map(profile.fairnessClasses.map((entry) => [entry.id, entry]));
  const work = new Map();
  const currentByWorkId = new Map();
  const classCounters = new Map(profile.workClasses.map((entry) => [entry.id, dec(counterStarts[entry.id] ?? '0', `${entry.id} counter start`)]));
  const retryOperations = new Map();
  let lifecycle = 'initialized';
  let currentEpochs = freeze({ root: '0', work: '0' }, 'initial Progress epochs');
  let serviceOpportunity = 0n;
  let firstStopCause = null;
  let starvationEvidence = null;
  let closure = null;

  const workClass = (classId) => {
    const entry = classById.get(classId);
    if (!entry) fail('PROGRESS_REFERENCE_CLASS', `unknown Progress work class ${classId}`);
    return entry;
  };

  const find = (reference) => {
    const item = work.get(refKey(reference));
    if (!item) fail('PROGRESS_REFERENCE_WORK', `unknown work ${reference.workId}/${reference.incarnation}`);
    const epochs = normalizeEpochs({ root: reference.rootEpoch, work: reference.workEpoch }, 'work reference epochs');
    if (
      reference.classId !== item.classId
      || reference.owner !== item.owner
      || !same(epochs, item.epochs, 'work reference epochs')
    ) fail('PROGRESS_REFERENCE_WORK_IDENTITY', 'work reference does not match authoritative class, owner, and epochs');
    return item;
  };

  const fairnessFor = (item) => fairnessById.get(workClass(item.classId).fairness);

  const transitionTerminal = (item, state, reason = null, ownerFailure = null) => {
    if (terminal(item.state)) return false;
    if (!terminalStates.has(state)) fail('PROGRESS_REFERENCE_TERMINAL', `invalid terminal state ${state}`);
    item.state = state;
    item.reason = reason;
    item.ownerFailure = ownerFailure === null ? null : freeze(ownerFailure, 'Progress owner failure');
    item.claimId = null;
    item.readyAtOpportunity = null;
    return true;
  };

  function activate({ rootEpoch = '1', workEpoch = '1' } = {}) {
    if (lifecycle !== 'initialized') fail('PROGRESS_REFERENCE_LIFECYCLE', 'activate requires initialized state');
    currentEpochs = normalizeEpochs({ root: rootEpoch, work: workEpoch }, 'activation epochs');
    lifecycle = 'running';
    return { kind: 'running', epochs: canonicalClone(currentEpochs) };
  }

  function admitWork(input) {
    const cls = workClass(text(input.classId, 'classId'));
    const afterStop = ['stop-requested', 'draining'].includes(lifecycle);
    if (lifecycle !== 'running' && !afterStop) fail('PROGRESS_REFERENCE_ADMISSION_CLOSED', `work admission is closed in lifecycle state ${lifecycle}`);
    if (afterStop && !profile.stop.mustDrainKinds.includes(cls.kind)) fail('PROGRESS_REFERENCE_ADMISSION_CLOSED', 'ordinary work admission is closed after stop');
    if (text(input.owner, 'owner') !== cls.owner) fail('PROGRESS_REFERENCE_OWNER', 'work owner differs from normalized class owner');
    const workId = text(input.workId, 'workId');
    const incarnation = dec(input.incarnation, 'work incarnation');
    const epochs = normalizeEpochs({ root: input.rootEpoch, work: input.workEpoch }, 'work admission epochs');
    if (!same(epochs, currentEpochs, 'work admission/current epochs')) fail('PROGRESS_REFERENCE_STALE', 'work admission epochs are not current');
    const previousKey = currentByWorkId.get(workId);
    if (previousKey) {
      const previous = work.get(previousKey);
      if (!terminal(previous.state) || incarnation <= previous.incarnation) fail('PROGRESS_REFERENCE_INCARNATION', 'work incarnation must supersede a terminal predecessor');
    }
    const activeForClass = [...work.values()].filter((entry) => entry.classId === cls.id && !terminal(entry.state)).length;
    if (BigInt(activeForClass) >= dec(cls.bounds.maxAdmitted)) return { kind: 'pending', code: 'work-capacity' };
    const counter = classCounters.get(cls.id);
    if (counter >= dec(cls.bounds.counterMaximum)) {
      requestStop({ cause: 'progress-counter-exhausted' });
      return { kind: 'stop', code: 'progress-counter-exhausted' };
    }
    const admission = input.resourceAdmission;
    if (!admission || admission.approved !== true) return { kind: 'pending', code: 'work-capacity' };
    text(admission.token, 'resource admission token');
    const resourceClasses = [...(admission.classes ?? [])].sort();
    const expectedResources = [...cls.resources].sort();
    if (!same(resourceClasses, expectedResources, 'work resource admission classes')) fail('PROGRESS_REFERENCE_RESOURCE', 'resource admission classes differ from normalized work requirements');
    if ((admission.reserve ?? null) !== cls.reserve) fail('PROGRESS_REFERENCE_RESOURCE', 'resource admission reserve differs from normalized work requirement');
    const key = refKey(input);
    if (work.has(key)) fail('PROGRESS_REFERENCE_WORK', 'duplicate exact work identity');
    const item = {
      key,
      workId,
      classId: cls.id,
      owner: cls.owner,
      incarnation,
      incarnationText: input.incarnation,
      epochs,
      payloadRef: text(input.payloadRef, 'payloadRef'),
      resourceAdmission: freeze(admission, 'Progress resource admission'),
      state: 'pending',
      reason: null,
      ownerFailure: null,
      dependencies: new Map(cls.readiness.dependencies.map((id) => [id, 'pending'])),
      claimId: null,
      readyAtOpportunity: null,
      continuationId: null,
      irreversibleResultVisible: input.irreversibleResultVisible === true,
      staleEpoch: false,
    };
    work.set(key, item);
    currentByWorkId.set(workId, key);
    classCounters.set(cls.id, counter + 1n);
    return { kind: 'admitted', workId, incarnation: input.incarnation, state: item.state };
  }

  function publishReady(input) {
    const item = find(input);
    if (item.state !== 'pending') fail('PROGRESS_REFERENCE_READINESS', 'only pending work can publish ready');
    const cls = workClass(item.classId);
    if (mutations.allowIncompleteReady !== true && (input.payloadReady !== true || input.resourceReady !== true)) fail('PROGRESS_REFERENCE_READINESS', 'ready work requires complete payload and Resource facts');
    const facts = input.dependencyFacts ?? [];
    if (!Array.isArray(facts)) fail('PROGRESS_REFERENCE_DEPENDENCY', 'dependencyFacts must be an array');
    const byId = new Map();
    for (const fact of facts) {
      const id = text(fact.id, 'dependency fact id');
      if (byId.has(id)) fail('PROGRESS_REFERENCE_DEPENDENCY', 'duplicate dependency fact');
      if (!item.dependencies.has(id)) fail('PROGRESS_REFERENCE_DEPENDENCY', `work does not declare dependency ${id}`);
      if (!['ready', 'escaped'].includes(fact.state)) fail('PROGRESS_REFERENCE_DEPENDENCY', 'dependency fact state must be ready or escaped');
      byId.set(id, fact.state);
    }
    if (byId.size !== item.dependencies.size) fail('PROGRESS_REFERENCE_DEPENDENCY', 'ready publication must cover every declared dependency');
    for (const [id] of item.dependencies) {
      const dependency = dependencyById.get(id);
      const state = byId.get(id);
      if (mutations.allowIncompleteReady !== true && dependency.requirement === 'required' && state !== 'ready') fail('PROGRESS_REFERENCE_READINESS', `required dependency ${id} is not ready`);
      item.dependencies.set(id, state);
    }
    item.state = 'ready';
    item.readyAtOpportunity = serviceOpportunity;
    return { kind: 'ready', workId: item.workId, incarnation: item.incarnationText };
  }

  function recordServiceOpportunity() {
    serviceOpportunity += 1n;
    if (mutations.skipFairness !== true) {
      for (const item of work.values()) {
        if (item.state !== 'ready') continue;
        const fairness = fairnessFor(item);
        const gap = serviceOpportunity - item.readyAtOpportunity;
        if (gap > dec(fairness.maxServiceOpportunities)) {
          starvationEvidence ??= freeze({
            workId: item.workId,
            incarnation: item.incarnationText,
            classId: item.classId,
            fairnessClass: fairness.id,
            gap: gap.toString(),
            maximum: fairness.maxServiceOpportunities,
          }, 'Progress starvation evidence');
        }
      }
    }
    return { kind: 'opportunity', count: serviceOpportunity.toString(), starvation: canonicalClone(starvationEvidence) };
  }

  function claimReady(input) {
    const item = find(input);
    if (item.state !== 'ready') fail('PROGRESS_REFERENCE_CLAIM', 'work is not ready');
    if (starvationEvidence && mutations.skipFairness !== true) fail('PROGRESS_REFERENCE_STARVATION', 'selected fairness contract was violated before claim');
    const cls = workClass(item.classId);
    if (cls.batch.kind === 'device-flush') {
      const readyItems = dec(input.batchReadyItems ?? '1', 'batch ready items');
      if (readyItems < dec(cls.batch.minimumItems) || readyItems > dec(cls.batch.maximumItems)) fail('PROGRESS_REFERENCE_BATCH', 'batch ready count is outside normalized bounds');
      const waited = serviceOpportunity - item.readyAtOpportunity;
      if (readyItems < dec(cls.batch.maximumItems) && waited < dec(cls.batch.flushAfterOpportunities)) {
        return { kind: 'pending', code: 'producer-unavailable', opportunitiesUntilFlush: (dec(cls.batch.flushAfterOpportunities) - waited).toString() };
      }
    }
    const claimId = text(input.claimId, 'claimId');
    item.state = 'claimed';
    item.claimId = claimId;
    item.readyAtOpportunity = null;
    return { kind: 'claimed', claimId, workId: item.workId, incarnation: item.incarnationText, cooperative: cls.claim === 'idempotent-cooperative' };
  }

  function yieldPending(input) {
    const item = find(input);
    if (item.state !== 'claimed') fail('PROGRESS_REFERENCE_YIELD', 'only claimed work can yield pending');
    const dependencyId = text(input.dependencyId, 'yield dependencyId');
    if (!item.dependencies.has(dependencyId)) fail('PROGRESS_REFERENCE_DEPENDENCY', 'yield dependency is not declared by the work class');
    item.dependencies.set(dependencyId, 'pending');
    item.state = 'pending';
    item.claimId = null;
    item.continuationId = text(input.continuationId, 'continuationId');
    return { kind: 'pending', dependencyId, continuationId: item.continuationId, workerReleased: true };
  }

  function beginResultVisibleTransition(input) {
    const item = find(input);
    if (item.state !== 'claimed') fail('PROGRESS_REFERENCE_RESULT_VISIBLE', 'result-visible transition requires claimed work');
    item.irreversibleResultVisible = true;
    return { kind: 'must-drain', workId: item.workId, incarnation: item.incarnationText };
  }

  function completeWork(input) {
    const item = find(input);
    const operationId = text(input.operationId, 'completion operationId');
    const operationKey = JSON.stringify([item.key, operationId]);
    const operation = freeze({ kind: 'complete', resultVisible: input.resultVisible === true }, 'Progress completion operation');
    const prior = retryOperations.get(operationKey);
    if (prior) {
      if (!same(prior.operation, operation, 'Progress completion retry')) fail('PROGRESS_REFERENCE_RETRY', 'operationId was reused for a different completion');
      return canonicalClone(prior.output);
    }
    if (item.state !== 'claimed') fail('PROGRESS_REFERENCE_COMPLETE', 'completion requires claimed work');
    if (item.staleEpoch && !item.irreversibleResultVisible) fail('PROGRESS_REFERENCE_STALE', 'stale work cannot complete as current work');
    transitionTerminal(item, 'completed', 'owner-complete');
    const output = freeze({ kind: 'completed', workId: item.workId, incarnation: item.incarnationText }, 'Progress completion output');
    retryOperations.set(operationKey, { operation, output });
    return canonicalClone(output);
  }

  function failWork(input) {
    const item = find(input);
    if (terminal(item.state)) return { kind: `already-${item.state}`, workId: item.workId };
    transitionTerminal(item, 'failed', text(input.code, 'owner failure code'), input.ownerFailure ?? { code: input.code });
    return { kind: 'failed', workId: item.workId, ownerFailure: canonicalClone(item.ownerFailure) };
  }

  function cancelWork(input) {
    const item = find(input);
    if (terminal(item.state)) return { kind: `already-${item.state}`, workId: item.workId };
    if (item.irreversibleResultVisible) fail('PROGRESS_REFERENCE_MUST_DRAIN', 'irreversible result-visible work cannot be cancelled');
    transitionTerminal(item, 'cancelled', input.reason ?? 'cancelled');
    return { kind: 'cancelled', workId: item.workId };
  }

  function requestStop({ cause }) {
    const normalizedCause = text(cause, 'stop cause');
    if (!['running', 'stop-requested', 'draining'].includes(lifecycle)) {
      if (lifecycle === 'terminal') return { kind: 'terminal', firstCause: canonicalClone(firstStopCause) };
      fail('PROGRESS_REFERENCE_STOP', `stop cannot be requested from ${lifecycle}`);
    }
    firstStopCause ??= freeze({ cause: normalizedCause }, 'Progress first stop cause');
    if (lifecycle === 'running') lifecycle = 'stop-requested';
    for (const item of work.values()) {
      if (terminal(item.state) || item.irreversibleResultVisible) continue;
      const disposition = workClass(item.classId).stopDisposition;
      if (disposition === 'abandon') transitionTerminal(item, 'cancelled', 'stop-abandon');
      else if (disposition === 'cancel') transitionTerminal(item, 'cancelled', 'stop-cancel');
      else if (disposition === 'stale-dispose') transitionTerminal(item, 'stale-disposed', 'stop-stale');
    }
    return { kind: lifecycle, firstCause: canonicalClone(firstStopCause) };
  }

  function beginDraining() {
    if (lifecycle !== 'stop-requested') fail('PROGRESS_REFERENCE_STOP', 'draining requires stop-requested');
    lifecycle = 'draining';
    return { kind: 'draining', firstCause: canonicalClone(firstStopCause) };
  }

  function advanceEpoch({ rootEpoch, workEpoch }) {
    const next = normalizeEpochs({ root: rootEpoch, work: workEpoch }, 'next Progress epochs');
    if (dec(next.root) < dec(currentEpochs.root) || dec(next.work) < dec(currentEpochs.work) || same(next, currentEpochs, 'Progress epoch advance')) fail('PROGRESS_REFERENCE_EPOCH', 'epoch advance must be monotone and change authority');
    currentEpochs = next;
    let staleDisposed = 0;
    for (const item of work.values()) {
      if (terminal(item.state) || same(item.epochs, currentEpochs, 'work/current epochs')) continue;
      if (item.irreversibleResultVisible) {
        item.staleEpoch = true;
        continue;
      }
      transitionTerminal(item, 'stale-disposed', 'epoch-advance');
      staleDisposed += 1;
    }
    return { kind: 'advanced', epochs: canonicalClone(currentEpochs), staleDisposed };
  }

  function classifyNoProgress(input = {}) {
    if ([...work.values()].some((item) => ['ready', 'claimed'].includes(item.state))) fail('PROGRESS_REFERENCE_PROGRESS_AVAILABLE', 'no-progress classification cannot run while work is ready/claimed');
    let outcome;
    if (starvationEvidence && mutations.skipFairness !== true) outcome = 'starvation';
    else if (input.counterExhausted === true) outcome = 'counter-exhausted';
    else if (input.repeatedTransitions !== undefined && dec(input.repeatedTransitions, 'repeatedTransitions') >= dec(profile.noProgress.maxRepeatedTransitions) && input.potentialChanged !== true) outcome = 'livelock';
    else {
      const pending = [...work.values()].filter((item) => item.state === 'pending');
      const waitEdges = input.waitEdges ?? [];
      if (!Array.isArray(waitEdges) || waitEdges.length > Number(dec(profile.noProgress.maxEvidenceRecords))) fail('PROGRESS_REFERENCE_WAIT_GRAPH', 'wait graph evidence exceeds normalized bound');
      const pendingIds = new Set(pending.map((item) => item.workId));
      const normalizedEdges = waitEdges.map((edge) => {
        const from = text(edge.from, 'wait edge from');
        const to = text(edge.to, 'wait edge to');
        if (!pendingIds.has(from) || !pendingIds.has(to)) fail('PROGRESS_REFERENCE_WAIT_GRAPH', 'wait graph edge must reference pending admitted work');
        return { from, to };
      });
      if (normalizedEdges.length > 0 && hasCycle(normalizedEdges)) outcome = 'deadlock';
      else if (input.orphanedWorkId !== undefined) {
        const orphaned = text(input.orphanedWorkId, 'orphanedWorkId');
        if (!pendingIds.has(orphaned)) fail('PROGRESS_REFERENCE_ORPHAN', 'orphaned work must be pending admitted work');
        outcome = 'orphaned-work';
      } else if (input.externalWait === true) {
        if (profile.noProgress.externalWait.kind !== 'session-only') fail('PROGRESS_REFERENCE_EXTERNAL_WAIT', 'profile does not select live Session external wait');
        const nonExternal = pending.filter((item) => workClass(item.classId).kind !== 'external-control');
        if (nonExternal.length !== 0) fail('PROGRESS_REFERENCE_EXTERNAL_WAIT', 'external wait cannot hide active internal pending work');
        outcome = 'legitimate-external-wait';
      } else if (input.resourceRecoverable === true) outcome = 'recoverable-resource-wait';
      else if (pending.length !== 0) outcome = 'producer-pending';
      else {
        const terminalItems = [...work.values()].filter((item) => terminal(item.state));
        outcome = terminalItems.length > 0 && terminalItems.every((item) => item.state === 'stale-disposed') ? 'stale-only' : 'terminal-quiescent';
      }
    }
    if (!profile.noProgress.outcomes.includes(outcome)) fail('PROGRESS_REFERENCE_NO_PROGRESS', `undeclared no-progress outcome ${outcome}`);
    const fatalCode = fatalNoProgress.get(outcome);
    if (fatalCode) requestStop({ cause: fatalCode });
    return { kind: 'no-progress', outcome, stopCause: canonicalClone(firstStopCause), starvation: canonicalClone(starvationEvidence) };
  }

  function publishClosure(input) {
    if (!['stop-requested', 'draining'].includes(lifecycle)) fail('PROGRESS_REFERENCE_CLOSURE', 'closure requires stop/drain lifecycle');
    if (mutations.skipClosureCheck !== true) {
      const live = [...work.values()].filter((item) => !terminal(item.state));
      if (live.length !== 0) fail('PROGRESS_REFERENCE_CLOSURE_WORK', 'closure cannot publish with live work');
      for (const [label, value] of [
        ['channels', input.channelsTerminal],
        ['owner transitions', input.ownerTransitionsReady],
        ['resources', input.resourcesConserved],
        ['terminal output', input.terminalOutputPublishable],
      ]) if (value !== true) fail('PROGRESS_REFERENCE_CLOSURE_DEPENDENCY', `closure ${label} is not terminal/ready`);
    }
    lifecycle = 'terminal';
    closure = freeze({
      kind: 'terminal',
      firstStopCause: canonicalClone(firstStopCause),
      observationAckRequired: false,
      admitted: work.size,
    }, 'Progress closure');
    return canonicalClone(closure);
  }

  function assertAccounting() {
    const states = ['pending', 'ready', 'claimed', 'completed', 'failed', 'cancelled', 'abandoned', 'stale-disposed', 'quarantined'];
    const counts = Object.fromEntries(states.map((state) => [state, [...work.values()].filter((item) => item.state === state).length]));
    const terminalCount = [...work.values()].filter((item) => terminal(item.state)).length;
    const live = work.size - terminalCount;
    if (Object.values(counts).reduce((sum, count) => sum + count, 0) !== work.size) fail('PROGRESS_REFERENCE_ACCOUNTING', 'admitted work accounting does not conserve');
    return { admitted: work.size, live, terminal: terminalCount, states: counts, serviceOpportunity: serviceOpportunity.toString() };
  }

  function observeProgress() {
    return {
      lifecycle,
      epochs: canonicalClone(currentEpochs),
      firstStopCause: canonicalClone(firstStopCause),
      starvation: canonicalClone(starvationEvidence),
      closure: canonicalClone(closure),
      accounting: assertAccounting(),
      work: [...work.values()].map((item) => ({
        workId: item.workId,
        classId: item.classId,
        owner: item.owner,
        incarnation: item.incarnationText,
        epochs: canonicalClone(item.epochs),
        state: item.state,
        reason: item.reason,
        ownerFailure: canonicalClone(item.ownerFailure),
        claimId: item.claimId,
        irreversibleResultVisible: item.irreversibleResultVisible,
        staleEpoch: item.staleEpoch,
      })),
    };
  }

  function cleanup({ outputBorrowClosed = true } = {}) {
    if (lifecycle !== 'terminal') fail('PROGRESS_REFERENCE_CLEANUP', 'Progress cleanup requires terminal closure');
    if (profile.closure.outputBorrow.kind === 'bounded-postsemantic' && outputBorrowClosed !== true) fail('PROGRESS_REFERENCE_OUTPUT_BORROW', 'bounded post-semantic output borrow must close before release');
    if ([...work.values()].some((item) => !terminal(item.state))) fail('PROGRESS_REFERENCE_CLEANUP', 'live work remains at cleanup');
    lifecycle = 'released';
    return {
      kind: 'released',
      runtimeResidue: 0,
      dispositions: profile.cleanup.kinds.map((kind) => ({ kind, disposition: 'released' })),
      evidenceValid: true,
    };
  }

  return Object.freeze({
    profile,
    activate,
    admitWork,
    publishReady,
    recordServiceOpportunity,
    claimReady,
    yieldPending,
    beginResultVisibleTransition,
    completeWork,
    failWork,
    cancelWork,
    requestStop,
    beginDraining,
    advanceEpoch,
    classifyNoProgress,
    publishClosure,
    assertAccounting,
    observeProgress,
    cleanup,
  });
}

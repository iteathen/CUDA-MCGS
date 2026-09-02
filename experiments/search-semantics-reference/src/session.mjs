import { canonicalBytes, canonicalClone, frozenCanonicalClone } from './canonical.mjs';
import { fail } from './errors.mjs';

const freeze = (value, label = 'Session value') => frozenCanonicalClone(value, label);
const dec = (value, label = 'decimal') => {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) fail('SESSION_REFERENCE_DECIMAL', `${label} must be a canonical decimal string`);
  return BigInt(value);
};
const text = (value, label) => {
  if (typeof value !== 'string' || value.length === 0) fail('SESSION_REFERENCE_ID', `${label} must be a non-empty string`);
  return value;
};
const same = (left, right, label = 'Session value') => canonicalBytes(left, label).equals(canonicalBytes(right, label));

const ADVANCE_REROOT_ONLY = Object.freeze([
  'materialization',
  'compoundAdmission',
  'reuseClassification',
  'transform',
  'reset',
  'reclamation',
  'eagerCleanup',
]);

function authorityRecord({ rootIdentity, occurrenceReference, rootEpoch, rootIncarnation }) {
  return freeze({
    rootIdentity: text(rootIdentity, 'root identity'),
    occurrenceReference: freeze(occurrenceReference, 'root occurrence reference'),
    rootEpoch,
    rootIncarnation,
  }, 'Session root authority');
}

export function createSessionOracle({ profile, counterStarts = {} } = {}) {
  if (!profile || typeof profile !== 'object') fail('SESSION_REFERENCE_PROFILE', 'normalized Session profile is required');
  if (!Array.isArray(profile.counters) || profile.counters.length === 0) fail('SESSION_REFERENCE_PROFILE', 'Session profile must declare finite counters');

  const counterRules = new Map(profile.counters.map((rule) => [rule.kind, rule]));
  const counters = new Map(profile.counters.map((rule) => {
    const start = dec(counterStarts[rule.kind] ?? '0', `${rule.kind} counter start`);
    const maximum = dec(rule.maximum, `${rule.kind} maximum`);
    const threshold = dec(rule.exhaustionThreshold, `${rule.kind} exhaustion threshold`);
    if (start > maximum || start > threshold) fail('SESSION_REFERENCE_COUNTER_START', `${rule.kind} counter start exceeds its admitted range`);
    return [rule.kind, start];
  }));
  const commandResults = new Map();
  const observations = new Map();
  let lifecycle = 'initialized';
  let authority = null;
  let reroot = null;
  let attention = null;
  let cancellationRequested = false;
  let terminalProvenance = null;
  let cleanupReadback = [];

  function rule(kind) {
    const found = counterRules.get(kind);
    if (!found) fail('SESSION_REFERENCE_COUNTER_KIND', `Session profile lacks counter ${kind}`);
    return found;
  }

  function preflightCounters(kinds) {
    for (const kind of kinds) {
      const current = counters.get(kind);
      const counterRule = rule(kind);
      const threshold = dec(counterRule.exhaustionThreshold, `${kind} exhaustion threshold`);
      const maximum = dec(counterRule.maximum, `${kind} maximum`);
      if (current >= threshold || current >= maximum) {
        fail('SESSION_REFERENCE_COUNTER_EXHAUSTED', `${kind} counter exhausted before alias or wrap`);
      }
    }
  }

  function commitCounters(kinds) {
    for (const kind of kinds) counters.set(kind, counters.get(kind) + 1n);
  }

  function counterText(kind) {
    return counters.get(kind).toString();
  }

  function commandSignature(kind, input) {
    return freeze({ kind, input }, 'Session command signature');
  }

  function replay(commandId, kind, input) {
    const id = text(commandId, 'commandId');
    const prior = commandResults.get(id);
    if (!prior) return null;
    const signature = commandSignature(kind, input);
    if (!same(prior.signature, signature, 'Session command replay')) {
      fail('SESSION_REFERENCE_COMMAND_REPLAY', `commandId ${id} was reused for a different Session command`);
    }
    return canonicalClone(prior.result, 'Session replay result');
  }

  function record(commandId, kind, input, result) {
    commandResults.set(commandId, {
      signature: commandSignature(kind, input),
      result: freeze(result, 'Session command result'),
    });
    return canonicalClone(result, 'Session command result');
  }

  function requireCommandPhase() {
    if (!['initialized', 'active', 'external-wait', 'cancelling'].includes(lifecycle)) {
      fail('SESSION_REFERENCE_COMMAND_CLOSED', `Session command admission is closed in lifecycle ${lifecycle}`);
    }
  }

  function requireActive() {
    if (!['active', 'external-wait'].includes(lifecycle)) fail('SESSION_REFERENCE_NOT_ACTIVE', `Session is not active in lifecycle ${lifecycle}`);
    if (!authority) fail('SESSION_REFERENCE_ROOT_ABSENT', 'Session has no authoritative root');
  }

  function requireOrder(actual, expected, code, label) {
    if (!Array.isArray(actual) || actual.length !== expected.length || actual.some((entry, index) => entry !== expected[index])) {
      fail(code, `${label} must match the normalized owner order`);
    }
  }

  function establishInitialRoot(input) {
    requireCommandPhase();
    const replayed = replay(input.commandId, 'root', input);
    if (replayed) return replayed;
    if (authority !== null) fail('SESSION_REFERENCE_ROOT_EXISTS', 'initial root is already authoritative');
    if (input.domainReady !== true || input.graphReady !== true || input.resourceReady !== true) {
      return freeze({ kind: 'rejected', code: 'session-root-unready', authorityUnchanged: true }, 'Session root rejection');
    }
    preflightCounters(['command', 'session-incarnation', 'root-epoch', 'root-incarnation']);
    commitCounters(['command', 'session-incarnation', 'root-epoch', 'root-incarnation']);
    authority = authorityRecord({
      rootIdentity: input.rootIdentity,
      occurrenceReference: input.occurrenceReference,
      rootEpoch: counterText('root-epoch'),
      rootIncarnation: counterText('root-incarnation'),
    });
    lifecycle = 'active';
    return record(input.commandId, 'root', input, {
      kind: 'accepted',
      authority,
      sessionIncarnation: counterText('session-incarnation'),
      hostProgressRequired: false,
    });
  }

  function applyAdvance(input) {
    requireActive();
    const replayed = replay(input.commandId, 'advance', input);
    if (replayed) return replayed;
    const requestedWork = input.requestedWork ?? {};
    if (ADVANCE_REROOT_ONLY.some((key) => requestedWork[key] === true)) {
      fail('SESSION_REFERENCE_ADVANCE_REROOT_ONLY', 'advance cannot perform materialization, admission, reuse classification, transform/reset, reclamation, or eager cleanup');
    }
    if (input.successor?.realizedTransition !== true || input.successor?.successorReady !== true) {
      return freeze({ kind: 'rejected', code: 'session-advance-unready', authorityUnchanged: true }, 'Session advance rejection');
    }
    if (input.successor?.nodeInvalidated === true) {
      fail('SESSION_REFERENCE_ADVANCE_SHARED_NODE', 'advance cannot invalidate a shared graph node when only one occurrence is superseded');
    }
    preflightCounters(['command', 'advance-generation', 'root-epoch']);
    const priorAuthority = authority;
    commitCounters(['command', 'advance-generation', 'root-epoch']);
    authority = authorityRecord({
      rootIdentity: input.successor.rootIdentity,
      occurrenceReference: input.successor.occurrenceReference,
      rootEpoch: counterText('root-epoch'),
      rootIncarnation: counterText('root-incarnation'),
    });
    return record(input.commandId, 'advance', input, {
      kind: 'advanced',
      priorAuthority,
      authority,
      advanceGeneration: counterText('advance-generation'),
      selectedDescendantWork: 'preserve-compatible',
      siblingOccurrenceWork: 'superseded-by-advance-lazy',
      sharedNodeInvalidated: false,
      reuseReclassified: false,
      reclamationTriggered: false,
      eagerCleanupPerformed: false,
      hostProgressRequired: false,
    });
  }

  function prepareReroot(input) {
    requireActive();
    if (profile.reroot?.kind !== 'selected') fail('SESSION_REFERENCE_REROOT_ABSENT', 'selected Session profile has no reroot operation');
    const replayed = replay(input.commandId, 'reroot-prepare', input);
    if (replayed) return replayed;
    if (reroot !== null) fail('SESSION_REFERENCE_REROOT_BUSY', 'a reroot transaction is already prepared');
    if (input.compoundAdmission?.approved !== true) {
      const pressureOutcome = profile.reroot.profile.pressureOutcome;
      return freeze({ kind: pressureOutcome, authorityUnchanged: true, transactionPublished: false }, 'Session reroot pressure');
    }
    const transaction = profile.reroot.profile.transaction;
    const preparedOwners = (input.ownerPreparations ?? []).map(({ owner }) => owner);
    requireOrder(preparedOwners, transaction.prepareOrder, 'SESSION_REFERENCE_REROOT_PREPARE_ORDER', 'reroot prepare order');
    if ((input.ownerPreparations ?? []).some(({ status }) => status !== 'prepared')) {
      fail('SESSION_REFERENCE_REROOT_PREPARE', 'every affected owner must publish prepared before reroot becomes prepared');
    }
    if (input.candidateRoot?.domainReady !== true || input.candidateRoot?.graphReady !== true) {
      return freeze({ kind: 'rejected', code: 'session-reroot-candidate-unready', authorityUnchanged: true }, 'Session reroot rejection');
    }
    preflightCounters(['command']);
    commitCounters(['command']);
    reroot = freeze({
      transactionId: text(input.transactionId, 'transactionId'),
      candidateRoot: input.candidateRoot,
      admission: input.compoundAdmission,
      ownerPreparations: input.ownerPreparations,
      oldAuthority: authority,
      state: 'prepared',
    }, 'Session reroot transaction');
    return record(input.commandId, 'reroot-prepare', input, {
      kind: 'prepared',
      transactionId: reroot.transactionId,
      oldAuthorityRemainsAuthoritative: true,
      authority,
    });
  }

  function abortReroot(input) {
    requireActive();
    const replayed = replay(input.commandId, 'reroot-abort', input);
    if (replayed) return replayed;
    if (!reroot || reroot.transactionId !== input.transactionId) fail('SESSION_REFERENCE_REROOT_TRANSACTION', 'unknown prepared reroot transaction');
    const expected = profile.reroot.profile.transaction.abortOrder;
    const owners = (input.ownerAborts ?? []).map(({ owner }) => owner);
    requireOrder(owners, expected, 'SESSION_REFERENCE_REROOT_ABORT_ORDER', 'reroot abort order');
    if ((input.ownerAborts ?? []).some(({ status }) => !['aborted', 'released', 'restored'].includes(status))) {
      fail('SESSION_REFERENCE_REROOT_ABORT', 'reroot abort must publish complete reverse cleanup facts');
    }
    preflightCounters(['command']);
    commitCounters(['command']);
    const transactionId = reroot.transactionId;
    const preservedAuthority = authority;
    reroot = null;
    return record(input.commandId, 'reroot-abort', input, {
      kind: 'aborted',
      transactionId,
      authority: preservedAuthority,
      authorityUnchanged: true,
    });
  }

  function commitReroot(input) {
    requireActive();
    const replayed = replay(input.commandId, 'reroot-commit', input);
    if (replayed) return replayed;
    if (!reroot || reroot.transactionId !== input.transactionId) fail('SESSION_REFERENCE_REROOT_TRANSACTION', 'unknown prepared reroot transaction');
    const expected = profile.reroot.profile.transaction.commitOrder;
    const owners = (input.ownerCommits ?? []).map(({ owner }) => owner);
    requireOrder(owners, expected, 'SESSION_REFERENCE_REROOT_COMMIT_ORDER', 'reroot commit order');
    if ((input.ownerCommits ?? []).some(({ status }) => status !== 'committed') || input.rootPublicationReady !== true) {
      fail('SESSION_REFERENCE_REROOT_COMMIT', 'reroot commit requires every affected owner and root publication ready');
    }
    preflightCounters(['command', 'root-epoch', 'root-incarnation']);
    const priorAuthority = authority;
    commitCounters(['command', 'root-epoch', 'root-incarnation']);
    authority = authorityRecord({
      rootIdentity: reroot.candidateRoot.rootIdentity,
      occurrenceReference: reroot.candidateRoot.occurrenceReference,
      rootEpoch: counterText('root-epoch'),
      rootIncarnation: counterText('root-incarnation'),
    });
    const transactionId = reroot.transactionId;
    reroot = null;
    if (input.postCommitFailure === true) {
      lifecycle = 'quarantined';
      return record(input.commandId, 'reroot-commit', input, {
        kind: 'quarantined',
        code: 'session-reroot-post-commit-failure',
        transactionId,
        priorAuthority,
        authority,
        rollbackPermitted: false,
      });
    }
    return record(input.commandId, 'reroot-commit', input, {
      kind: 'committed',
      transactionId,
      priorAuthority,
      authority,
      lazyMaintenanceOnly: true,
    });
  }

  function applyAttention(input) {
    requireActive();
    if (profile.attention?.kind !== 'selected') fail('SESSION_REFERENCE_ATTENTION_ABSENT', 'attention is not selected for this Session profile');
    const replayed = replay(input.commandId, 'attention', input);
    if (replayed) return replayed;
    if (input.ownerEffect?.ready !== true) return freeze({ kind: 'rejected', code: 'session-attention-unready', authorityUnchanged: true }, 'Session attention rejection');
    if (input.ownerEffect.rootAuthorityChanged === true || input.ownerEffect.graphWork === true || input.ownerEffect.reclamation === true || input.ownerEffect.invalidatedExistingWork === true) {
      fail('SESSION_REFERENCE_ATTENTION_AUTHORITY', 'attention cannot change root authority, graph/reclamation state, or existing-work validity');
    }
    preflightCounters(['command', 'attention-generation']);
    const rootBefore = authority;
    commitCounters(['command', 'attention-generation']);
    attention = freeze({
      attentionIdentity: text(input.attentionIdentity, 'attentionIdentity'),
      generation: counterText('attention-generation'),
      ownerEffect: input.ownerEffect,
    }, 'Session attention state');
    if (!same(rootBefore, authority, 'attention root authority')) fail('SESSION_REFERENCE_ATTENTION_ROOT', 'attention changed root authority');
    return record(input.commandId, 'attention', input, {
      kind: 'applied',
      attention,
      authority,
      rootAuthorityChanged: false,
      graphWork: false,
      reclamation: false,
      hostProgressRequired: false,
      globalBarrierRequired: false,
    });
  }

  function requestObservation(input) {
    requireActive();
    if (profile.observations?.kind !== 'selected') fail('SESSION_REFERENCE_OBSERVATION_ABSENT', 'observations are not selected for this Session profile');
    const replayed = replay(input.commandId, 'observation-request', input);
    if (replayed) return replayed;
    const publication = input.outputPublication;
    const selected = input.outputProfile === undefined && profile.observations.profiles.length === 1
      ? profile.observations.profiles[0]
      : profile.observations.profiles.find(({ outputProfile }) => outputProfile === input.outputProfile);
    if (!selected) fail('SESSION_REFERENCE_OBSERVATION_PROFILE', 'observation request must select one exact normalized Output observation profile');
    if (selected.readOnly !== true || selected.hostProgress !== 'none' || selected.runtimeSchema !== 'prohibited') {
      fail('SESSION_REFERENCE_OBSERVATION_PROFILE', 'normalized Output observation profile must remain read-only, bounded, and host-progress independent');
    }
    if (publication?.kind !== 'ready' || !publication.metadata || typeof publication.metadata !== 'object') {
      fail('SESSION_REFERENCE_OBSERVATION_PUBLICATION', 'Session observation requires an Output-owned immutable ready publication fact');
    }
    if (publication.metadata.rootEpoch !== authority.rootEpoch) {
      return freeze({ kind: 'stale-rejected', code: selected.stale, authorityUnchanged: true }, 'Session observation stale rejection');
    }
    const requestId = text(input.requestId, 'requestId');
    if (observations.has(requestId)) fail('SESSION_REFERENCE_OBSERVATION_REQUEST', `duplicate observation request ${requestId}`);
    const pendingRequests = [...observations.values()].filter((request) => !request.released).length;
    if (BigInt(pendingRequests) >= dec(selected.maxPendingRequests, 'observation maxPendingRequests')) {
      return freeze({ kind: 'pressure', code: selected.pressure, authorityUnchanged: true }, 'Session observation pressure');
    }
    preflightCounters(['command', 'observation-generation']);
    commitCounters(['command', 'observation-generation']);
    observations.set(requestId, {
      requestId,
      observationProfileId: selected.id,
      generation: counterText('observation-generation'),
      publication: freeze(publication, 'Output observation publication'),
      borrows: new Set(),
      released: false,
    });
    return record(input.commandId, 'observation-request', input, {
      kind: 'ready',
      requestId,
      observationProfileId: selected.id,
      generation: counterText('observation-generation'),
      outputPublication: publication,
      authority,
      readOnly: true,
      hostProgressRequired: false,
    });
  }

  function acquireObservation({ requestId, borrowId }) {
    const request = observations.get(text(requestId, 'requestId'));
    if (!request || request.released) fail('SESSION_REFERENCE_OBSERVATION_REQUEST', 'observation request is not borrowable');
    const id = text(borrowId, 'borrowId');
    if (request.borrows.has(id)) return freeze({ kind: 'borrowed', requestId, borrowId: id, publication: request.publication }, 'Session observation borrow');
    const selected = profile.observations.profiles.find(({ id: profileId }) => profileId === request.observationProfileId);
    if (!selected) fail('SESSION_REFERENCE_OBSERVATION_PROFILE', 'observation request lost its normalized profile binding');
    const maxBorrows = dec(selected.maxBorrows, 'observation maxBorrows');
    if (BigInt(request.borrows.size) >= maxBorrows) return freeze({ kind: 'pressure', code: selected.pressure }, 'Session observation pressure');
    request.borrows.add(id);
    return freeze({ kind: 'borrowed', requestId, borrowId: id, publication: request.publication }, 'Session observation borrow');
  }

  function releaseObservation({ requestId, borrowId }) {
    const request = observations.get(text(requestId, 'requestId'));
    if (!request || !request.borrows.delete(text(borrowId, 'borrowId'))) fail('SESSION_REFERENCE_OBSERVATION_BORROW', 'unknown observation borrow');
    if (request.borrows.size === 0) request.released = true;
    return freeze({ kind: 'released', requestId, remainingBorrows: request.borrows.size }, 'Session observation release');
  }

  function requestCancellation(input) {
    requireCommandPhase();
    const replayed = replay(input.commandId, 'cancel', input);
    if (replayed) return replayed;
    preflightCounters(['command']);
    if (reroot !== null) {
      const expected = profile.reroot.profile.transaction.abortOrder;
      const owners = (input.rerootAbortFacts ?? []).map(({ owner }) => owner);
      requireOrder(owners, expected, 'SESSION_REFERENCE_CANCELLATION_REROOT', 'cancellation reroot abort order');
      if ((input.rerootAbortFacts ?? []).some(({ status }) => !['aborted', 'released', 'restored'].includes(status))) fail('SESSION_REFERENCE_CANCELLATION_REROOT', 'cancellation must resolve prepared reroot state');
      reroot = null;
    }
    commitCounters(['command']);
    cancellationRequested = true;
    lifecycle = 'cancelling';
    return record(input.commandId, 'cancel', input, {
      kind: 'cancelling',
      cancellationRequested: true,
      authority,
      hostProgressRequired: false,
    });
  }

  function completeSession(input) {
    const replayed = replay(input.commandId, 'complete', input);
    if (replayed) return replayed;
    if (!['active', 'external-wait', 'cancelling'].includes(lifecycle)) fail('SESSION_REFERENCE_COMPLETION_PHASE', `Session cannot complete from ${lifecycle}`);
    if (reroot !== null) fail('SESSION_REFERENCE_COMPLETION_REROOT', 'Session cannot complete with a prepared reroot transaction');
    if (input.progressClosed !== true || input.terminalOutputReady !== true || input.staleWorkDisposed !== true) {
      fail('SESSION_REFERENCE_COMPLETION_PENDING', 'Session completion requires Progress closure, terminal Output readiness, and stale-work disposition');
    }
    const liveObservationBorrows = [...observations.values()].reduce((sum, request) => sum + request.borrows.size, 0);
    if (liveObservationBorrows > 0) {
      fail('SESSION_REFERENCE_COMPLETION_BORROW', 'Session completion requires live observation borrows to quiesce before terminal provenance');
    }
    preflightCounters(['command']);
    commitCounters(['command']);
    lifecycle = 'terminal';
    terminalProvenance = freeze({
      authority,
      completionClass: input.completionClass ?? (cancellationRequested ? 'cancelled' : 'complete'),
      terminalOutputIdentity: input.terminalOutputIdentity,
      cancellationRequested,
    }, 'Session terminal provenance');
    return record(input.commandId, 'complete', input, {
      kind: 'terminal',
      terminalProvenance,
      commandsFrozen: true,
    });
  }

  function teardown({ terminalResultBorrowOpen = false, cleanupFacts = [] } = {}) {
    if (!['terminal', 'quarantined'].includes(lifecycle)) fail('SESSION_REFERENCE_TEARDOWN_PHASE', `Session cannot teardown from ${lifecycle}`);
    const liveObservationBorrows = [...observations.values()].reduce((sum, request) => sum + request.borrows.size, 0);
    if (terminalResultBorrowOpen || liveObservationBorrows > 0) {
      return freeze({ kind: 'pending-borrow', terminalResultBorrowOpen, liveObservationBorrows }, 'Session teardown pending');
    }
    const expectedKinds = [...profile.cleanup.kinds].sort();
    const actualKinds = cleanupFacts.map(({ kind }) => kind).sort();
    if (actualKinds.length !== expectedKinds.length || actualKinds.some((kind, index) => kind !== expectedKinds[index])) {
      fail('SESSION_REFERENCE_CLEANUP_COVERAGE', 'Session cleanup facts must cover every normalized cleanup kind exactly once');
    }
    if (cleanupFacts.some(({ disposition }) => disposition === 'pending' || disposition === undefined)) {
      fail('SESSION_REFERENCE_CLEANUP_PENDING', 'Session cleanup readback contains an unresolved disposition');
    }
    for (const request of observations.values()) request.released = true;
    cleanupReadback = freeze(cleanupFacts, 'Session cleanup readback');
    lifecycle = 'released';
    return freeze({ kind: 'released', runtimeResidue: 0, cleanupReadback }, 'Session teardown result');
  }

  function snapshot() {
    return canonicalClone({
      profileId: profile.id,
      lifecycle,
      authority,
      counters: Object.fromEntries([...counters].map(([kind, value]) => [kind, value.toString()])),
      reroot,
      attention,
      observations: [...observations.values()].map((request) => ({
        requestId: request.requestId,
        observationProfileId: request.observationProfileId,
        generation: request.generation,
        publication: request.publication,
        borrowIds: [...request.borrows].sort(),
        released: request.released,
      })),
      cancellationRequested,
      terminalProvenance,
      cleanupReadback,
      hostProgressRequired: false,
    }, 'Session snapshot');
  }

  return Object.freeze({
    profile,
    establishInitialRoot,
    applyAdvance,
    prepareReroot,
    abortReroot,
    commitReroot,
    applyAttention,
    requestObservation,
    acquireObservation,
    releaseObservation,
    requestCancellation,
    completeSession,
    teardown,
    snapshot,
  });
}

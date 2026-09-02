import assert from 'node:assert/strict';

import {
  advanceInput,
  candidateRoot,
  cleanupFacts,
  establish,
  expectCode,
  getSessionProfile,
  liveSession,
  ownerOrderFacts,
  readyOutputPublication,
  restartSession,
} from './session-case-support.mjs';

function authorityMeaning(session) {
  const snapshot = session.snapshot();
  return {
    lifecycle: snapshot.lifecycle,
    authority: snapshot.authority,
    counters: snapshot.counters,
    attention: snapshot.attention,
    observations: snapshot.observations,
    cancellationRequested: snapshot.cancellationRequested,
    hostProgressRequired: snapshot.hostProgressRequired,
  };
}

function prepare(session, profile, label = 'beta') {
  return session.prepareReroot({
    commandId: `reroot-prepare-${label}`,
    transactionId: `reroot-${label}`,
    candidateRoot: candidateRoot(label),
    compoundAdmission: { approved: true, token: `admission-${label}` },
    ownerPreparations: ownerOrderFacts(profile, 'prepare', 'prepared'),
  });
}

export function registerSessionCases({ defineCase, sessionProjection, terminalEvidence }) {
  defineCase('session-initial-root-validation-and-replay', () => {
    const session = liveSession(sessionProjection);
    const before = session.snapshot();
    const rejected = session.establishInitialRoot({
      commandId: 'root-unready',
      rootIdentity: 'root.synthetic.unready',
      occurrenceReference: { slot: 'node-unready', generation: '1' },
      domainReady: true,
      graphReady: false,
      resourceReady: true,
    });
    assert.equal(rejected.kind, 'rejected');
    assert.deepEqual(session.snapshot(), before);

    const accepted = establish(session, 'alpha');
    const replayed = session.establishInitialRoot({
      commandId: 'root-alpha',
      rootIdentity: 'root.synthetic.alpha',
      occurrenceReference: { slot: 'node-alpha', generation: '1' },
      domainReady: true,
      graphReady: true,
      resourceReady: true,
    });
    assert.deepEqual(replayed, accepted);
    expectCode(() => session.establishInitialRoot({
      commandId: 'root-alpha',
      rootIdentity: 'root.synthetic.other',
      occurrenceReference: { slot: 'node-other', generation: '1' },
      domainReady: true,
      graphReady: true,
      resourceReady: true,
    }), 'SESSION_REFERENCE_COMMAND_REPLAY');
    return { authority: accepted.authority, replayStable: true };
  }, ['SESSION-', 'SESSION-ROOT-', 'SESSION-SEC-']);

  defineCase('session-advance-rejects-reroot-work-without-mutation', () => {
    const session = liveSession(sessionProjection);
    establish(session, 'alpha');
    const before = session.snapshot();
    expectCode(() => session.applyAdvance(advanceInput('beta', {
      requestedWork: { materialization: true },
    })), 'SESSION_REFERENCE_ADVANCE_REROOT_ONLY');
    assert.deepEqual(session.snapshot(), before);

    const unready = session.applyAdvance(advanceInput('unready', { successor: { successorReady: false } }));
    assert.equal(unready.kind, 'rejected');
    assert.deepEqual(session.snapshot(), before);

    const advanced = session.applyAdvance(advanceInput('beta'));
    assert.equal(advanced.kind, 'advanced');
    assert.equal(advanced.reuseReclassified, false);
    assert.equal(advanced.reclamationTriggered, false);
    assert.equal(advanced.eagerCleanupPerformed, false);
    assert.equal(advanced.selectedDescendantWork, 'preserve-compatible');
    assert.equal(advanced.siblingOccurrenceWork, 'superseded-by-advance-lazy');
    return advanced;
  }, ['SESSION-ROOT-', 'SESSION-EPOCH-', 'SESSION-RECLAIM-']);

  defineCase('session-advance-shared-transposition-occurrence-only', () => {
    const session = liveSession(sessionProjection);
    establish(session, 'alpha');
    const advanced = session.applyAdvance(advanceInput('shared', {
      successor: {
        occurrenceReference: { slot: 'shared-node-occurrence-b', generation: '7', sharedNodeIdentity: 'node.shared.42' },
        nodeInvalidated: false,
      },
    }));
    assert.equal(advanced.sharedNodeInvalidated, false);
    assert.equal(advanced.siblingOccurrenceWork, 'superseded-by-advance-lazy');
    return { authority: advanced.authority, sharedNodeInvalidated: advanced.sharedNodeInvalidated };
  }, ['SESSION-ROOT-', 'SESSION-EPOCH-', 'SESSION-RECLAIM-']);

  defineCase('session-attention-observation-schedule-invariant', () => {
    function run(order) {
      const session = liveSession(sessionProjection);
      establish(session, 'alpha');
      const publication = readyOutputPublication(session, 'observation.schedule');
      for (const operation of order) {
        if (operation === 'attention') {
          const result = session.applyAttention({
            commandId: 'attention-1',
            attentionIdentity: 'attention.synthetic.focus',
            ownerEffect: { ready: true, rootAuthorityChanged: false, graphWork: false, reclamation: false, invalidatedExistingWork: false },
          });
          assert.equal(result.rootAuthorityChanged, false);
        } else {
          assert.equal(session.requestObservation({
            commandId: 'observation-1',
            requestId: 'observation-1',
            outputPublication: publication,
          }).kind, 'ready');
          assert.equal(session.acquireObservation({ requestId: 'observation-1', borrowId: 'borrow-1' }).kind, 'borrowed');
          assert.equal(session.releaseObservation({ requestId: 'observation-1', borrowId: 'borrow-1' }).kind, 'released');
        }
      }
      session.applyAdvance(advanceInput('beta'));
      return authorityMeaning(session);
    }
    const first = run(['attention', 'observation']);
    const second = run(['observation', 'attention']);
    assert.deepEqual(second, first, 'independent attention/observation order must not change Session authority meaning');
    return { schedulesCompared: 2, meaning: first };
  }, ['SESSION-CONTROL-', 'SESSION-OBS-', 'SESSION-EPOCH-']);

  defineCase('session-reroot-prepare-abort-preserves-authority', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const session = liveSession(sessionProjection);
    establish(session, 'alpha');
    const before = session.snapshot().authority;
    const prepared = prepare(session, profile, 'beta');
    assert.equal(prepared.kind, 'prepared');
    assert.deepEqual(prepared.authority, before);
    const aborted = session.abortReroot({
      commandId: 'reroot-abort-beta',
      transactionId: 'reroot-beta',
      ownerAborts: ownerOrderFacts(profile, 'abort', 'released'),
    });
    assert.equal(aborted.kind, 'aborted');
    assert.deepEqual(session.snapshot().authority, before);
    assert.equal(session.snapshot().reroot, null);
    return { authorityPreserved: true, abortOrder: profile.reroot.profile.transaction.abortOrder };
  }, ['SESSION-ROOT-', 'SESSION-REUSE-', 'SESSION-LIFE-']);

  defineCase('session-reroot-commit-and-postcommit-quarantine', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const committedSession = liveSession(sessionProjection);
    establish(committedSession, 'alpha');
    prepare(committedSession, profile, 'beta');
    const committed = committedSession.commitReroot({
      commandId: 'reroot-commit-beta',
      transactionId: 'reroot-beta',
      ownerCommits: ownerOrderFacts(profile, 'commit', 'committed'),
      rootPublicationReady: true,
      postCommitFailure: false,
    });
    assert.equal(committed.kind, 'committed');
    assert.equal(committed.authority.rootIdentity, 'root.synthetic.beta');
    assert.equal(committed.lazyMaintenanceOnly, true);

    const failedSession = liveSession(sessionProjection);
    establish(failedSession, 'alpha-q');
    prepare(failedSession, profile, 'gamma');
    const quarantined = failedSession.commitReroot({
      commandId: 'reroot-commit-gamma',
      transactionId: 'reroot-gamma',
      ownerCommits: ownerOrderFacts(profile, 'commit', 'committed'),
      rootPublicationReady: true,
      postCommitFailure: true,
    });
    assert.equal(quarantined.kind, 'quarantined');
    assert.equal(quarantined.rollbackPermitted, false);
    assert.equal(failedSession.snapshot().lifecycle, 'quarantined');
    return { committedAuthority: committed.authority, quarantineAuthority: quarantined.authority };
  }, ['SESSION-ROOT-', 'SESSION-REUSE-', 'SESSION-LIFE-']);

  defineCase('session-reroot-pressure-and-attention-deletion', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session-restart');
    const session = restartSession(sessionProjection);
    establish(session, 'alpha');
    const before = session.snapshot();
    const pressure = session.prepareReroot({
      commandId: 'reroot-pressure',
      transactionId: 'reroot-pressure',
      candidateRoot: candidateRoot('pressure'),
      compoundAdmission: { approved: false, code: 'reroot-capacity' },
      ownerPreparations: [],
    });
    assert.equal(pressure.kind, profile.reroot.profile.pressureOutcome);
    assert.equal(pressure.kind, 'restart-required');
    assert.deepEqual(session.snapshot(), before);
    expectCode(() => session.applyAttention({
      commandId: 'attention-absent',
      attentionIdentity: 'attention.absent',
      ownerEffect: { ready: true },
    }), 'SESSION_REFERENCE_ATTENTION_ABSENT');
    return { pressureOutcome: pressure.kind, attention: profile.attention.kind };
  }, ['SESSION-ROOT-', 'SESSION-CONTROL-', 'SESSION-IR-', 'SESSION-COMPAT-']);

  defineCase('session-observation-readonly-stale-and-borrow-teardown', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const session = liveSession(sessionProjection);
    establish(session, 'alpha');
    const before = session.snapshot();
    const stalePublication = readyOutputPublication(session, 'observation.stale');
    stalePublication.rootEpoch = '0';
    const stale = session.requestObservation({
      commandId: 'observation-stale',
      requestId: 'observation-stale',
      outputPublication: stalePublication,
    });
    assert.equal(stale.kind, 'stale-rejected');
    assert.deepEqual(session.snapshot(), before);

    const publication = readyOutputPublication(session, 'observation.current');
    assert.equal(session.requestObservation({ commandId: 'observation-current', requestId: 'observation-current', outputPublication: publication }).kind, 'ready');
    assert.equal(session.acquireObservation({ requestId: 'observation-current', borrowId: 'borrow-current' }).kind, 'borrowed');
    assert.equal(session.releaseObservation({ requestId: 'observation-current', borrowId: 'borrow-current' }).kind, 'released');
    assert.equal(session.completeSession({
      commandId: 'complete-observation',
      progressClosed: true,
      terminalOutputReady: true,
      staleWorkDisposed: true,
      terminalOutputIdentity: 'terminal.output.current',
      completionClass: 'complete',
    }).kind, 'terminal');
    const released = session.teardown({ cleanupFacts: cleanupFacts(profile) });
    assert.equal(released.kind, 'released');
    assert.equal(released.runtimeResidue, 0);
    return { staleRejected: true, cleanupRecords: released.cleanupReadback.length };
  }, ['SESSION-OBS-', 'SESSION-LIFE-', 'SESSION-CLEANUP-']);

  defineCase('session-attention-does-not-change-authority', () => {
    const session = liveSession(sessionProjection);
    establish(session, 'alpha');
    const before = session.snapshot().authority;
    const applied = session.applyAttention({
      commandId: 'attention-independent',
      attentionIdentity: 'attention.synthetic.independent',
      ownerEffect: { ready: true, rootAuthorityChanged: false, graphWork: false, reclamation: false, invalidatedExistingWork: false },
    });
    assert.equal(applied.kind, 'applied');
    assert.deepEqual(session.snapshot().authority, before);
    assert.equal(applied.globalBarrierRequired, false);
    assert.equal(applied.hostProgressRequired, false);
    return applied;
  }, ['SESSION-CONTROL-', 'SESSION-EPOCH-']);

  defineCase('session-counter-exhaustion-prevents-alias', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const rule = profile.counters.find(({ kind }) => kind === 'attention-generation');
    assert(rule);
    const session = liveSession(sessionProjection, { counterStarts: { 'attention-generation': rule.exhaustionThreshold } });
    establish(session, 'alpha');
    const before = session.snapshot();
    expectCode(() => session.applyAttention({
      commandId: 'attention-exhausted',
      attentionIdentity: 'attention.synthetic.exhausted',
      ownerEffect: { ready: true, rootAuthorityChanged: false, graphWork: false, reclamation: false, invalidatedExistingWork: false },
    }), 'SESSION_REFERENCE_COUNTER_EXHAUSTED');
    assert.deepEqual(session.snapshot(), before);
    return { counter: 'attention-generation', exhaustedAt: rule.exhaustionThreshold, wrapped: false };
  }, ['SESSION-EPOCH-', 'SESSION-LIFE-', 'SESSION-COUNTER-']);

  defineCase('session-cancellation-idempotent-terminal-cleanup', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const session = liveSession(sessionProjection);
    establish(session, 'alpha');
    const cancellationInput = { commandId: 'cancel-1' };
    const once = session.requestCancellation(cancellationInput);
    const twice = session.requestCancellation(cancellationInput);
    assert.deepEqual(twice, once);
    assert.equal(once.kind, 'cancelling');
    const terminal = session.completeSession({
      commandId: 'complete-cancelled',
      progressClosed: true,
      terminalOutputReady: true,
      staleWorkDisposed: true,
      terminalOutputIdentity: 'terminal.output.cancelled',
      completionClass: 'cancelled',
    });
    assert.equal(terminal.kind, 'terminal');
    assert.equal(session.teardown({ terminalResultBorrowOpen: true, cleanupFacts: cleanupFacts(profile) }).kind, 'pending-borrow');
    const released = session.teardown({ terminalResultBorrowOpen: false, cleanupFacts: cleanupFacts(profile) });
    assert.equal(released.kind, 'released');
    return { cancellationIdempotent: true, runtimeResidue: released.runtimeResidue };
  }, ['SESSION-', 'SESSION-LIFE-', 'SESSION-CLEANUP-']);

  defineCase('session-cancellation-aborts-prepared-reroot', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const session = liveSession(sessionProjection);
    establish(session, 'alpha');
    const authority = session.snapshot().authority;
    prepare(session, profile, 'beta');
    const cancelled = session.requestCancellation({
      commandId: 'cancel-prepared-reroot',
      rerootAbortFacts: ownerOrderFacts(profile, 'abort', 'released'),
    });
    assert.equal(cancelled.kind, 'cancelling');
    assert.equal(session.snapshot().reroot, null);
    assert.deepEqual(session.snapshot().authority, authority);
    return { preparedRerootAborted: true, authorityUnchanged: true };
  }, ['SESSION-ROOT-', 'SESSION-LIFE-']);

  defineCase('session-absent-terminal-slice-remains-zero-residue', () => {
    assert(terminalEvidence, 'terminal-slice coupled evidence is required');
    assert.equal(terminalEvidence.status, 'pass');
    const terminalCase = terminalEvidence.cases.find(({ id }) => id === 'terminal-slice-evaluator-absent-full-lifecycle');
    assert(terminalCase && terminalCase.status === 'pass');
    assert.equal(terminalCase.detail.structuralResidue.session, 0);
    assert.equal(terminalCase.detail.hostProgressRequired, false);
    return {
      terminalEvidence: terminalEvidence.evidenceIdentity,
      sessionResidue: terminalCase.detail.structuralResidue.session,
      hostProgressRequired: terminalCase.detail.hostProgressRequired,
    };
  }, ['SESSION-IR-', 'SESSION-LIFE-', 'SESSION-COMPAT-']);
}

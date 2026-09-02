import assert from 'node:assert/strict';

import {
  advanceInput,
  establish,
  expectCode,
  getSessionProfile,
  liveSession,
  readyOutputPublication,
} from './session-case-support.mjs';

function assertStableRejectedReplay({ session, input, invoke, changedInput, expectedKind, expectedCode }) {
  const before = session.snapshot();
  const once = invoke(input);
  assert.equal(once.kind, expectedKind);
  if (expectedCode !== undefined) assert.equal(once.code, expectedCode);
  assert.deepEqual(session.snapshot(), before, 'typed rejection must not mutate public Session state');

  const twice = invoke(input);
  assert.deepEqual(twice, once, 'exact rejected command replay must return the same typed outcome');
  assert.deepEqual(session.snapshot(), before, 'exact rejected replay must not mutate public Session state');

  expectCode(() => invoke(changedInput), 'SESSION_REFERENCE_COMMAND_REPLAY');
  assert.deepEqual(session.snapshot(), before, 'changed payload under a reserved rejected commandId must not mutate public Session state');
}

export function registerSessionReplayCases({ defineCase, sessionProjection }) {
  defineCase('session-rejected-command-replay-is-stable', () => {
    const rootSession = liveSession(sessionProjection);
    const rootInput = {
      commandId: 'root-rejected-replay',
      rootIdentity: 'root.synthetic.replay-root',
      occurrenceReference: { slot: 'node-replay-root', generation: '1' },
      domainReady: true,
      graphReady: false,
      resourceReady: true,
    };
    assertStableRejectedReplay({
      session: rootSession,
      input: rootInput,
      invoke: (input) => rootSession.establishInitialRoot(input),
      changedInput: { ...rootInput, graphReady: true },
      expectedKind: 'rejected',
      expectedCode: 'session-root-unready',
    });

    const advanceSession = liveSession(sessionProjection);
    establish(advanceSession, 'replay-advance');
    const advanceInputRejected = advanceInput('replay-advance-target', {
      authority: advanceSession.snapshot().authority,
      successor: { successorReady: false },
    });
    assertStableRejectedReplay({
      session: advanceSession,
      input: advanceInputRejected,
      invoke: (input) => advanceSession.applyAdvance(input),
      changedInput: {
        ...advanceInputRejected,
        successor: { ...advanceInputRejected.successor, successorReady: true },
      },
      expectedKind: 'rejected',
      expectedCode: 'session-advance-unready',
    });

    const rerootSession = liveSession(sessionProjection);
    establish(rerootSession, 'replay-reroot');
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const rerootInput = {
      commandId: 'reroot-rejected-replay',
      authority: rerootSession.snapshot().authority,
      transactionId: 'reroot-rejected-replay',
      candidateRoot: {
        rootIdentity: 'root.synthetic.replay-reroot-target',
        occurrenceReference: { slot: 'node-replay-reroot-target', generation: '1' },
        domainReady: true,
        graphReady: true,
      },
      compoundAdmission: { approved: false, token: 'admission-replay-reroot' },
      ownerPreparations: [],
    };
    assertStableRejectedReplay({
      session: rerootSession,
      input: rerootInput,
      invoke: (input) => rerootSession.prepareReroot(input),
      changedInput: {
        ...rerootInput,
        compoundAdmission: { approved: true, token: 'admission-replay-reroot' },
        ownerPreparations: profile.reroot.profile.transaction.prepareOrder.map((owner) => ({ owner, status: 'prepared' })),
      },
      expectedKind: profile.reroot.profile.pressureOutcome,
    });

    const attentionSession = liveSession(sessionProjection);
    establish(attentionSession, 'replay-attention');
    const attentionInput = {
      commandId: 'attention-rejected-replay',
      attentionIdentity: 'attention.synthetic.replay',
      ownerEffect: { ready: false },
    };
    assertStableRejectedReplay({
      session: attentionSession,
      input: attentionInput,
      invoke: (input) => attentionSession.applyAttention(input),
      changedInput: {
        ...attentionInput,
        ownerEffect: { ready: true, rootAuthorityChanged: false, graphWork: false, reclamation: false, invalidatedExistingWork: false },
      },
      expectedKind: 'rejected',
      expectedCode: 'session-attention-unready',
    });

    const observationSession = liveSession(sessionProjection);
    establish(observationSession, 'replay-observation');
    const stalePublication = readyOutputPublication(observationSession, 'publication.replay-observation-stale');
    stalePublication.metadata.rootEpoch = '0';
    const observationInput = {
      commandId: 'observation-rejected-replay',
      requestId: 'observation-rejected-replay',
      outputPublication: stalePublication,
    };
    const currentPublication = readyOutputPublication(observationSession, 'publication.replay-observation-current');
    assertStableRejectedReplay({
      session: observationSession,
      input: observationInput,
      invoke: (input) => observationSession.requestObservation(input),
      changedInput: { ...observationInput, outputPublication: currentPublication },
      expectedKind: 'stale-rejected',
      expectedCode: profile.observations.profiles[0].stale,
    });

    return {
      commandKinds: ['root', 'advance', 'reroot', 'attention', 'observation'],
      exactRejectedReplayStable: true,
      changedPayloadRejected: true,
      publicStateUnchanged: true,
    };
  }, ['SESSION-', 'SESSION-ROOT-', 'SESSION-CONTROL-', 'SESSION-OBS-', 'SESSION-SEC-', 'SESSION-LIFE-']);
}

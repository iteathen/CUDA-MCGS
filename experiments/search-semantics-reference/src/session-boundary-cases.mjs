import assert from 'node:assert/strict';

import {
  advanceInput,
  establish,
  expectCode,
  getSessionProfile,
  liveSession,
  readyOutputPublication,
  teardownInput,
} from './session-case-support.mjs';

export function registerSessionBoundaryCases({ defineCase, sessionProjection }) {
  defineCase('session-observation-profile-and-capacity-guard', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const observationProfile = profile.observations.profiles[0];
    assert(observationProfile);
    const session = liveSession(sessionProjection);
    establish(session, 'observation-guard');

    const beforeMismatch = session.snapshot();
    expectCode(() => session.requestObservation({
      commandId: 'observation-foreign-profile',
      requestId: 'observation-foreign-profile',
      outputProfile: 'output-observation.foreign.live',
      outputPublication: readyOutputPublication(session, 'publication.foreign'),
    }), 'SESSION_REFERENCE_OBSERVATION_PROFILE');
    assert.deepEqual(session.snapshot(), beforeMismatch, 'foreign Output profile rejection must not mutate Session state');

    const maximum = Number(BigInt(observationProfile.maxPendingRequests));
    assert(Number.isSafeInteger(maximum) && maximum > 0 && maximum <= 4096, 'fixture observation request capacity must be a bounded practical falsifier');
    for (let index = 0; index < maximum; index += 1) {
      const result = session.requestObservation({
        commandId: `observation-capacity-${index}`,
        requestId: `observation-capacity-${index}`,
        outputProfile: observationProfile.outputProfile,
        outputPublication: readyOutputPublication(session, `publication.capacity.${index}`),
      });
      assert.equal(result.kind, 'ready');
    }
    const beforePressure = session.snapshot();
    const pressure = session.requestObservation({
      commandId: 'observation-capacity-overflow',
      requestId: 'observation-capacity-overflow',
      outputProfile: observationProfile.outputProfile,
      outputPublication: readyOutputPublication(session, 'publication.capacity.overflow'),
    });
    assert.equal(pressure.kind, 'pressure');
    assert.equal(pressure.code, observationProfile.pressure);
    assert.deepEqual(session.snapshot(), beforePressure, 'observation pressure must consume no command, generation, or request state');
    return { outputProfile: observationProfile.outputProfile, maximumPendingRequests: observationProfile.maxPendingRequests, pressure: pressure.code };
  }, ['SESSION-OBS-', 'SESSION-SEC-', 'SESSION-LIFE-']);

  defineCase('session-observation-consumes-output-publication-fact', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const observationProfile = profile.observations.profiles[0];
    assert(observationProfile);
    const session = liveSession(sessionProjection);
    establish(session, 'output-publication-fact');
    const outputPublication = readyOutputPublication(session, 'observation-output-publication-fact');

    const result = session.requestObservation({
      commandId: 'observation-output-publication-fact',
      requestId: 'observation-output-publication-fact',
      outputProfile: observationProfile.outputProfile,
      outputPublication,
    });
    assert.equal(result.kind, 'ready');
    assert.equal(result.outputPublication.kind, 'ready');
    assert.equal(result.outputPublication.metadata.rootEpoch, session.snapshot().authority.rootEpoch);
    return {
      outputProfile: observationProfile.outputProfile,
      publicationKind: result.outputPublication.kind,
      rootEpoch: result.outputPublication.metadata.rootEpoch,
    };
  }, ['SESSION-OBS-', 'SESSION-SEC-', 'SESSION-COMPAT-']);

  defineCase('session-observation-rejects-foreign-output-provenance', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const observationProfile = profile.observations.profiles[0];
    assert(observationProfile);
    const session = liveSession(sessionProjection);
    establish(session, 'foreign-output-provenance');
    const before = session.snapshot();

    const foreignProfilePublication = readyOutputPublication(session, 'publication.foreign-output-profile');
    foreignProfilePublication.profileId = 'output.synthetic-foreign';
    foreignProfilePublication.metadata.profileIdentity = 'output.synthetic-foreign';
    expectCode(() => session.requestObservation({
      commandId: 'observation-foreign-output-profile',
      requestId: 'observation-foreign-output-profile',
      outputProfile: observationProfile.outputProfile,
      outputPublication: foreignProfilePublication,
    }), 'SESSION_REFERENCE_OBSERVATION_PUBLICATION');
    assert.deepEqual(session.snapshot(), before, 'foreign Output profile provenance must be rejected before Session request state mutates');

    const foreignSessionPublication = readyOutputPublication(session, 'publication.foreign-session');
    foreignSessionPublication.metadata.sessionIdentity = 'session.synthetic.foreign';
    expectCode(() => session.requestObservation({
      commandId: 'observation-foreign-session-provenance',
      requestId: 'observation-foreign-session-provenance',
      outputProfile: observationProfile.outputProfile,
      outputPublication: foreignSessionPublication,
    }), 'SESSION_REFERENCE_OBSERVATION_PUBLICATION');
    assert.deepEqual(session.snapshot(), before, 'foreign Session publication provenance must be rejected before Session request state mutates');

    return {
      foreignOutputProfileRejected: true,
      foreignSessionRejected: true,
      expectedOutputProfile: profile.outputProfile.id,
    };
  }, ['SESSION-OBS-', 'SESSION-SEC-', 'SESSION-COMPAT-']);

  defineCase('session-completion-waits-for-live-observation-borrows', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const observationProfile = profile.observations.profiles[0];
    assert(observationProfile);
    const session = liveSession(sessionProjection);
    establish(session, 'completion-borrow');
    assert.equal(session.requestObservation({
      commandId: 'observation-completion-borrow',
      requestId: 'observation-completion-borrow',
      outputProfile: observationProfile.outputProfile,
      outputPublication: readyOutputPublication(session, 'publication.completion.borrow'),
    }).kind, 'ready');
    assert.equal(session.acquireObservation({ requestId: 'observation-completion-borrow', borrowId: 'borrow-completion' }).kind, 'borrowed');

    const beforeCompletion = session.snapshot();
    expectCode(() => session.completeSession({
      commandId: 'complete-with-live-observation-borrow',
      progressClosed: true,
      terminalOutputReady: true,
      staleWorkDisposed: true,
      terminalOutputIdentity: 'terminal.output.borrow-blocked',
      completionClass: 'complete',
    }), 'SESSION_REFERENCE_COMPLETION_BORROW');
    assert.deepEqual(session.snapshot(), beforeCompletion, 'blocked completion must not publish terminal Session authority');

    assert.equal(session.releaseObservation({ requestId: 'observation-completion-borrow', borrowId: 'borrow-completion' }).kind, 'released');
    const terminal = session.completeSession({
      commandId: 'complete-after-observation-borrow-release',
      progressClosed: true,
      terminalOutputReady: true,
      staleWorkDisposed: true,
      terminalOutputIdentity: 'terminal.output.borrow-released',
      completionClass: 'complete',
    });
    assert.equal(terminal.kind, 'terminal');
    assert.equal(session.teardown(teardownInput(profile)).kind, 'released');
    return { blockedWhileBorrowed: true, terminalAfterRelease: true };
  }, ['SESSION-LIFE-', 'SESSION-OBS-', 'SESSION-CLEANUP-']);

  defineCase('session-cancellation-admission-precedes-reroot-mutation', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const commandCounter = profile.counters.find(({ kind }) => kind === 'command');
    assert(commandCounter);
    const counterStart = (BigInt(commandCounter.exhaustionThreshold) - 2n).toString();
    const session = liveSession(sessionProjection, { counterStarts: { command: counterStart } });
    establish(session, 'cancel-admission');
    const transaction = profile.reroot.profile.transaction;
    assert.equal(session.prepareReroot({
      commandId: 'reroot-prepare-cancel-admission',
      transactionId: 'reroot-cancel-admission',
      candidateRoot: {
        rootIdentity: 'root.synthetic.cancel-admission-reroot',
        occurrenceReference: { slot: 'node-cancel-admission-reroot', generation: '1' },
        domainReady: true,
        graphReady: true,
      },
      compoundAdmission: { approved: true, token: 'admission-cancel-admission' },
      ownerPreparations: transaction.prepareOrder.map((owner) => ({ owner, status: 'prepared' })),
    }).kind, 'prepared');

    const beforeCancellation = session.snapshot();
    expectCode(() => session.requestCancellation({
      commandId: 'cancel-command-capacity-exhausted',
      rerootAbortFacts: transaction.abortOrder.map((owner) => ({ owner, status: 'released' })),
    }), 'SESSION_REFERENCE_COUNTER_EXHAUSTED');
    assert.deepEqual(session.snapshot(), beforeCancellation, 'failed cancellation admission must not abort prepared reroot state');
    return { commandCounterExhausted: true, rerootPreserved: true };
  }, ['SESSION-LIFE-', 'SESSION-SEC-', 'SESSION-ROOT-']);

  defineCase('session-command-validation-precedes-mutation', () => {
    const invalidRootSession = liveSession(sessionProjection);
    const beforeInvalidRoot = invalidRootSession.snapshot();
    expectCode(() => invalidRootSession.establishInitialRoot({
      commandId: 'root-invalid-identity',
      rootIdentity: '',
      occurrenceReference: { slot: 'node-invalid-root', generation: '1' },
      domainReady: true,
      graphReady: true,
      resourceReady: true,
    }), 'SESSION_REFERENCE_ID');
    assert.deepEqual(invalidRootSession.snapshot(), beforeInvalidRoot, 'invalid initial root identity must be rejected before counters or authority mutate');

    const invalidAdvanceSession = liveSession(sessionProjection);
    establish(invalidAdvanceSession, 'invalid-advance-base');
    const beforeInvalidAdvance = invalidAdvanceSession.snapshot();
    expectCode(() => invalidAdvanceSession.applyAdvance(advanceInput('invalid-advance', {
      successor: { rootIdentity: '' },
    })), 'SESSION_REFERENCE_ID');
    assert.deepEqual(invalidAdvanceSession.snapshot(), beforeInvalidAdvance, 'invalid advance identity must be rejected before counters or authority mutate');

    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const invalidRerootSession = liveSession(sessionProjection);
    establish(invalidRerootSession, 'invalid-reroot-base');
    const beforeInvalidReroot = invalidRerootSession.snapshot();
    const transaction = profile.reroot.profile.transaction;
    expectCode(() => invalidRerootSession.prepareReroot({
      commandId: 'reroot-invalid-transaction',
      transactionId: '',
      candidateRoot: {
        rootIdentity: 'root.synthetic.invalid-reroot-candidate',
        occurrenceReference: { slot: 'node-invalid-reroot-candidate', generation: '1' },
        domainReady: true,
        graphReady: true,
      },
      compoundAdmission: { approved: true, token: 'admission-invalid-reroot' },
      ownerPreparations: transaction.prepareOrder.map((owner) => ({ owner, status: 'prepared' })),
    }), 'SESSION_REFERENCE_ID');
    assert.deepEqual(invalidRerootSession.snapshot(), beforeInvalidReroot, 'invalid reroot transaction identity must be rejected before counters or transaction state mutate');

    const invalidAttentionSession = liveSession(sessionProjection);
    establish(invalidAttentionSession, 'invalid-attention-base');
    const beforeInvalidAttention = invalidAttentionSession.snapshot();
    expectCode(() => invalidAttentionSession.applyAttention({
      commandId: 'attention-invalid-identity',
      attentionIdentity: '',
      ownerEffect: { ready: true, rootAuthorityChanged: false, graphWork: false, reclamation: false, invalidatedExistingWork: false },
    }), 'SESSION_REFERENCE_ID');
    assert.deepEqual(invalidAttentionSession.snapshot(), beforeInvalidAttention, 'invalid attention identity must be rejected before counters or attention state mutate');

    return { root: true, advance: true, reroot: true, attention: true };
  }, ['SESSION-SEC-', 'SESSION-ROOT-', 'SESSION-CONTROL-', 'SESSION-LIFE-']);

  defineCase('session-advance-preserves-root-incarnation', () => {
    const session = liveSession(sessionProjection);
    establish(session, 'advance-incarnation');
    const before = session.snapshot();
    const advanced = session.applyAdvance(advanceInput('advance-incarnation-successor'));
    const after = session.snapshot();

    assert.equal(advanced.kind, 'advanced');
    assert.equal(advanced.authority.rootIncarnation, before.authority.rootIncarnation, 'advance must remain inside the current root incarnation');
    assert.equal(after.counters['root-incarnation'], before.counters['root-incarnation'], 'advance must not consume the root-incarnation counter');
    assert.notEqual(after.authority.rootEpoch, before.authority.rootEpoch, 'advance must publish a new root epoch');
    assert.notEqual(advanced.advanceGeneration, before.counters['advance-generation'], 'advance must publish ordered advance provenance');
    return {
      rootIncarnation: after.authority.rootIncarnation,
      rootEpoch: after.authority.rootEpoch,
      advanceGeneration: advanced.advanceGeneration,
    };
  }, ['SESSION-ROOT-', 'SESSION-EPOCH-', 'SESSION-LIFE-']);

  defineCase('session-teardown-enforces-normalized-order', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const session = liveSession(sessionProjection);
    establish(session, 'teardown-order');
    assert.equal(session.completeSession({
      commandId: 'complete-teardown-order',
      progressClosed: true,
      terminalOutputReady: true,
      staleWorkDisposed: true,
      terminalOutputIdentity: 'terminal.output.teardown-order',
      completionClass: 'complete',
    }).kind, 'terminal');

    const before = session.snapshot();
    const outOfOrder = [...profile.lifecycle.teardownOrder];
    [outOfOrder[0], outOfOrder[1]] = [outOfOrder[1], outOfOrder[0]];
    expectCode(() => session.teardown(teardownInput(profile, { completedTeardownSteps: outOfOrder })), 'SESSION_REFERENCE_TEARDOWN_ORDER');
    assert.deepEqual(session.snapshot(), before, 'invalid teardown ordering must not release Session state');

    const released = session.teardown(teardownInput(profile));
    assert.equal(released.kind, 'released');
    assert.equal(released.runtimeResidue, 0);
    assert.deepEqual(released.completedTeardownSteps, profile.lifecycle.teardownOrder);
    return { teardownOrder: released.completedTeardownSteps, runtimeResidue: released.runtimeResidue };
  }, ['SESSION-LIFE-']);

  defineCase('session-completion-command-replay-idempotent', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const session = liveSession(sessionProjection);
    establish(session, 'completion-replay');
    const input = {
      commandId: 'complete-replay',
      progressClosed: true,
      terminalOutputReady: true,
      staleWorkDisposed: true,
      terminalOutputIdentity: 'terminal.output.replay',
      completionClass: 'complete',
    };
    const once = session.completeSession(input);
    const afterOnce = session.snapshot();
    const twice = session.completeSession(input);
    assert.deepEqual(twice, once, 'terminal completion replay must be idempotent');
    assert.deepEqual(session.snapshot(), afterOnce, 'terminal completion replay must not mutate counters or authority');
    assert.equal(session.teardown(teardownInput(profile)).kind, 'released');
    return { completionReplayStable: true, terminalOutputIdentity: once.terminalProvenance.terminalOutputIdentity };
  }, ['SESSION-', 'SESSION-LIFE-', 'SESSION-SEC-']);
}

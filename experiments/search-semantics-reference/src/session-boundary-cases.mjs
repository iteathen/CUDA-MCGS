import assert from 'node:assert/strict';

import {
  advanceInput,
  cleanupFacts,
  establish,
  expectCode,
  getSessionProfile,
  liveSession,
  readyOutputPublication,
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
    assert.equal(session.teardown({ cleanupFacts: cleanupFacts(profile) }).kind, 'released');
    return { blockedWhileBorrowed: true, terminalAfterRelease: true };
  }, ['SESSION-LIFE-', 'SESSION-OBS-', 'SESSION-CLEANUP-']);

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
    assert.equal(session.teardown({ cleanupFacts: cleanupFacts(profile) }).kind, 'released');
    return { completionReplayStable: true, terminalOutputIdentity: once.terminalProvenance.terminalOutputIdentity };
  }, ['SESSION-', 'SESSION-LIFE-', 'SESSION-SEC-']);
}

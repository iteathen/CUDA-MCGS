import assert from 'node:assert/strict';

import {
  cleanupFacts,
  establish,
  expectCode,
  getSessionProfile,
  liveSession,
} from './session-case-support.mjs';

function publication(session, outputProfile, publicationIdentity) {
  const authority = session.snapshot().authority;
  assert(authority);
  return {
    outputProfile,
    publicationIdentity,
    ready: true,
    readOnly: true,
    searchProgressMutated: false,
    rootEpoch: authority.rootEpoch,
    rootIncarnation: authority.rootIncarnation,
  };
}

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
      outputPublication: publication(session, 'output-observation.foreign.live', 'publication.foreign'),
    }), 'SESSION_REFERENCE_OBSERVATION_PROFILE');
    assert.deepEqual(session.snapshot(), beforeMismatch, 'foreign Output profile rejection must not mutate Session state');

    const maximum = Number(BigInt(observationProfile.maxPendingRequests));
    assert(Number.isSafeInteger(maximum) && maximum > 0 && maximum <= 4096, 'fixture observation request capacity must be a bounded practical falsifier');
    for (let index = 0; index < maximum; index += 1) {
      const result = session.requestObservation({
        commandId: `observation-capacity-${index}`,
        requestId: `observation-capacity-${index}`,
        outputPublication: publication(session, observationProfile.outputProfile, `publication.capacity.${index}`),
      });
      assert.equal(result.kind, 'ready');
    }
    const beforePressure = session.snapshot();
    const pressure = session.requestObservation({
      commandId: 'observation-capacity-overflow',
      requestId: 'observation-capacity-overflow',
      outputPublication: publication(session, observationProfile.outputProfile, 'publication.capacity.overflow'),
    });
    assert.equal(pressure.kind, 'pressure');
    assert.equal(pressure.code, observationProfile.pressure);
    assert.deepEqual(session.snapshot(), beforePressure, 'observation pressure must consume no command, generation, or request state');
    return { outputProfile: observationProfile.outputProfile, maximumPendingRequests: observationProfile.maxPendingRequests, pressure: pressure.code };
  }, ['SESSION-OBS-', 'SESSION-SEC-', 'SESSION-LIFE-']);

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

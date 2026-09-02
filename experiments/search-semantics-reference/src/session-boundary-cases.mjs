import assert from 'node:assert/strict';

import {
  advanceInput,
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

function outputReadyPublicationFact(session, publicationIdentity) {
  const authority = session.snapshot().authority;
  assert(authority);
  return {
    kind: 'ready',
    slotId: publicationIdentity,
    incarnation: '1',
    profileId: 'output.synthetic-live-session',
    schemaId: 'output-schema.synthetic-live-session.live',
    searchIncarnation: '1',
    sequence: '1',
    payload: [],
    envelope: null,
    metadata: {
      searchIdentity: 'search.synthetic',
      sessionIdentity: 'session.synthetic',
      searchIncarnation: '1',
      profileIdentity: 'output.synthetic-live-session',
      rootEpoch: authority.rootEpoch,
      workEpoch: '1',
      sequence: '1',
      consistency: 'versioned-cut',
      sourceVersions: [],
      sourceDispositions: [],
      lossAccounting: { dropped: '0', coalesced: '0', lostSequences: [] },
    },
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

  defineCase('session-observation-consumes-output-publication-fact', () => {
    const profile = getSessionProfile(sessionProjection, 'session.synthetic-live-session');
    const observationProfile = profile.observations.profiles[0];
    assert(observationProfile);
    const session = liveSession(sessionProjection);
    establish(session, 'output-publication-fact');
    const outputPublication = outputReadyPublicationFact(session, 'observation-output-publication-fact');

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

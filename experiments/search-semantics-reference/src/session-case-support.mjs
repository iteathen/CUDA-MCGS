import assert from 'node:assert/strict';

import { createSessionOracle } from './session.mjs';

export function getSessionProfile(projection, id) {
  const entry = projection.profiles.find((candidate) => candidate.id === id);
  assert(entry, `missing Session profile ${id}`);
  return entry.normalized;
}

export function liveSession(projection, options = {}) {
  return createSessionOracle({ profile: getSessionProfile(projection, 'session.synthetic-live-session'), ...options });
}

export function restartSession(projection, options = {}) {
  return createSessionOracle({ profile: getSessionProfile(projection, 'session.synthetic-live-session-restart'), ...options });
}

export function establish(session, label = 'alpha') {
  const result = session.establishInitialRoot({
    commandId: `root-${label}`,
    rootIdentity: `root.synthetic.${label}`,
    occurrenceReference: { slot: `node-${label}`, generation: '1' },
    domainReady: true,
    graphReady: true,
    resourceReady: true,
  });
  assert.equal(result.kind, 'accepted');
  return result;
}

export function ownerOrderFacts(profile, phase, status) {
  const transaction = profile.reroot.profile.transaction;
  const order = phase === 'prepare' ? transaction.prepareOrder : phase === 'commit' ? transaction.commitOrder : transaction.abortOrder;
  return order.map((owner) => ({ owner, status }));
}

export function candidateRoot(label = 'beta') {
  return {
    rootIdentity: `root.synthetic.${label}`,
    occurrenceReference: { slot: `node-${label}`, generation: '1' },
    domainReady: true,
    graphReady: true,
  };
}

export function cleanupFacts(profile) {
  return profile.cleanup.kinds.map((kind) => ({ kind, disposition: kind === 'diagnostic' ? 'archive' : 'released' }));
}

export function teardownInput(profile, overrides = {}) {
  return {
    completedTeardownSteps: [...profile.lifecycle.teardownOrder],
    cleanupFacts: cleanupFacts(profile),
    ...overrides,
  };
}

export function readyOutputPublication(session, identity = 'observation.synthetic.1') {
  const snapshot = session.snapshot();
  const authority = snapshot.authority;
  assert(authority);
  const publication = {
    kind: 'ready',
    slotId: identity,
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
  Object.defineProperty(publication, 'rootEpoch', {
    enumerable: false,
    get() { return publication.metadata.rootEpoch; },
    set(value) { publication.metadata.rootEpoch = value; },
  });
  return publication;
}

export function advanceInput(label = 'beta', overrides = {}) {
  return {
    commandId: `advance-${label}`,
    successor: {
      rootIdentity: `root.synthetic.${label}`,
      occurrenceReference: { slot: `node-${label}`, generation: '1' },
      realizedTransition: true,
      successorReady: true,
      nodeInvalidated: false,
      ...(overrides.successor ?? {}),
    },
    requestedWork: {
      materialization: false,
      compoundAdmission: false,
      reuseClassification: false,
      transform: false,
      reset: false,
      reclamation: false,
      eagerCleanup: false,
      ...(overrides.requestedWork ?? {}),
    },
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => !['successor', 'requestedWork'].includes(key))),
  };
}

export function expectCode(body, code) {
  let error = null;
  try {
    body();
  } catch (candidate) {
    error = candidate;
  }
  assert(error, `expected ${code}`);
  assert.equal(error.code, code);
  return error;
}

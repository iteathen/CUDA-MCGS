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

export function readyOutputPublication(session, identity = 'observation.synthetic.1') {
  const authority = session.snapshot().authority;
  assert(authority);
  return {
    outputProfile: 'output.synthetic-live-observation',
    publicationIdentity: identity,
    ready: true,
    readOnly: true,
    searchProgressMutated: false,
    rootEpoch: authority.rootEpoch,
    rootIncarnation: authority.rootIncarnation,
  };
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

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSessionOracle } from '../experiments/search-semantics-reference/src/session.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projection = JSON.parse(await readFile(path.join(repositoryRoot, 'experiments/search-ir-composer-reference/build/session-profiles.json'), 'utf8'));
const entry = projection.profiles.find(({ id }) => id === 'session.synthetic-live-session');
assert(entry, 'Session projection must contain the live Session profile');
const provenance = {
  sessionIdentity: 'session.synthetic',
  searchIdentity: 'search.synthetic',
  searchIncarnation: '1',
};

const session = createSessionOracle({ profile: entry.normalized, ...provenance });
const established = session.establishInitialRoot({
  commandId: 'root-1',
  rootIdentity: 'root.synthetic.alpha',
  occurrenceReference: { slot: 'node-1', generation: '1' },
  domainReady: true,
  graphReady: true,
  resourceReady: true,
});
assert.equal(established.kind, 'accepted');

const before = session.snapshot();
assert.throws(() => session.applyAdvance({
  commandId: 'advance-reroot-only',
  authority: before.authority,
  successor: {
    rootIdentity: 'root.synthetic.beta',
    occurrenceReference: { slot: 'node-2', generation: '1' },
    realizedTransition: true,
    successorReady: true,
  },
  requestedWork: {
    materialization: true,
    compoundAdmission: false,
    reuseClassification: false,
    transform: false,
    reset: false,
    reclamation: false,
    eagerCleanup: false,
  },
}), { code: 'SESSION_REFERENCE_ADVANCE_REROOT_ONLY' });
assert.deepEqual(session.snapshot(), before, 'rejected reroot-only advance must not mutate Session authority or counters');

const originalAuthority = session.snapshot().authority;
const firstAdvance = session.applyAdvance({
  commandId: 'advance-current-authority',
  authority: originalAuthority,
  successor: {
    rootIdentity: 'root.synthetic.gamma',
    occurrenceReference: { slot: 'node-3', generation: '1' },
    realizedTransition: true,
    successorReady: true,
    nodeInvalidated: false,
  },
  requestedWork: {
    materialization: false,
    compoundAdmission: false,
    reuseClassification: false,
    transform: false,
    reset: false,
    reclamation: false,
    eagerCleanup: false,
  },
});
assert.equal(firstAdvance.kind, 'advanced');
const beforeStale = session.snapshot();
const staleAdvance = session.applyAdvance({
  commandId: 'advance-stale-authority',
  authority: originalAuthority,
  successor: {
    rootIdentity: 'root.synthetic.delta',
    occurrenceReference: { slot: 'node-4', generation: '1' },
    realizedTransition: true,
    successorReady: true,
    nodeInvalidated: false,
  },
  requestedWork: {
    materialization: false,
    compoundAdmission: false,
    reuseClassification: false,
    transform: false,
    reset: false,
    reclamation: false,
    eagerCleanup: false,
  },
});
assert.equal(staleAdvance.kind, 'rejected');
assert.equal(staleAdvance.code, 'session-command-stale');
assert.equal(staleAdvance.authorityUnchanged, true);
assert.deepEqual(session.snapshot(), beforeStale, 'stale advance authority must not mutate Session authority or counters');

console.log('session_advance_boundary=pass');

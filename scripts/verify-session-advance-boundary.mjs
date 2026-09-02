import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSessionOracle } from '../experiments/search-semantics-reference/src/session.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projection = JSON.parse(await readFile(path.join(repositoryRoot, 'experiments/search-ir-composer-reference/build/session-profiles.json'), 'utf8'));
const entry = projection.profiles.find(({ id }) => id === 'session.synthetic-live-session');
assert(entry, 'Session projection must contain the live Session profile');

const session = createSessionOracle({ profile: entry.normalized });
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

const advanced = session.applyAdvance({
  commandId: 'advance-ready-successor',
  successor: {
    rootIdentity: 'root.synthetic.beta',
    occurrenceReference: { slot: 'node-2', generation: '1' },
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
assert.equal(advanced.kind, 'advanced');
assert.equal(
  advanced.authority.rootIncarnation,
  before.authority.rootIncarnation,
  'advance must remain inside the current root incarnation; only initial root and reroot establish a new incarnation',
);
assert.notEqual(
  advanced.authority.rootEpoch,
  before.authority.rootEpoch,
  'advance must still publish a new stale-work root epoch',
);

console.log('session_advance_boundary=pass');

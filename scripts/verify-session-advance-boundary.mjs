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

const teardownSession = createSessionOracle({ profile: entry.normalized });
assert.equal(teardownSession.establishInitialRoot({
  commandId: 'root-teardown',
  rootIdentity: 'root.synthetic.teardown',
  occurrenceReference: { slot: 'node-teardown', generation: '1' },
  domainReady: true,
  graphReady: true,
  resourceReady: true,
}).kind, 'accepted');
assert.equal(teardownSession.completeSession({
  commandId: 'complete-teardown',
  progressClosed: true,
  terminalOutputReady: true,
  staleWorkDisposed: true,
  terminalOutputIdentity: 'terminal.output.teardown',
  completionClass: 'complete',
}).kind, 'terminal');
const cleanupFacts = entry.normalized.cleanup.kinds.map((kind) => ({
  kind,
  disposition: kind === 'diagnostic' ? 'archive' : 'released',
}));
const outOfOrderTeardownSteps = [...entry.normalized.lifecycle.teardownOrder];
[outOfOrderTeardownSteps[0], outOfOrderTeardownSteps[1]] = [outOfOrderTeardownSteps[1], outOfOrderTeardownSteps[0]];
assert.throws(() => teardownSession.teardown({
  completedTeardownSteps: outOfOrderTeardownSteps,
  cleanupFacts,
}), { code: 'SESSION_REFERENCE_TEARDOWN_ORDER' });

console.log('session_advance_boundary=pass');

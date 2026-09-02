import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  assertProgressStopDispositionTerminalState,
  assertProgressTerminalStateReachability,
  requiredProgressTerminalStates,
} from './src/progress.mjs';
import { sourceTextSha256 } from './src/validation.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');

const fixtureSource = await readFile(path.join(experimentRoot, 'src', 'progress-fixtures.mjs'), 'utf8');
const schema = JSON.parse(await readFile(path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'progress-profile.schema.json'), 'utf8'));
const specBytes = await readFile(path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0012-device-owned-search-progress.md'));
const spec = specBytes.toString('utf8');

const terminalStateEnums = [];
function collectEnums(value) {
  if (Array.isArray(value)) {
    for (const item of value) collectEnums(item);
    return;
  }
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value.enum)) terminalStateEnums.push(...value.enum);
  for (const child of Object.values(value)) collectEnums(child);
}
collectEnums(schema);

assert(terminalStateEnums.includes('abandoned'), 'Progress Search-IR schema must admit the abandoned terminal state');
assert(terminalStateEnums.includes('quarantined'), 'Progress Search-IR schema must admit the quarantined terminal state');
assert.match(spec, /completed.*failed.*cancelled.*abandoned.*stale-disposed.*quarantined/s, 'SPEC-0012 must declare every terminal work disposition including typed fatal quarantine');
assert.match(spec, /owner-declared abandon\/cancel\/stale disposition/i, 'SPEC-0012 must retain distinct owner-declared stop dispositions');
assert(fixtureSource.includes("return 'abandon';"), 'Progress fixture must still select abandon for ordinary work');
assert.match(fixtureSource, /disposition === 'abandon' \? \['abandoned'\] : \[\]/, 'ordinary abandon fixture construction must declare abandoned as a compatible terminal state');

assert.equal(assertProgressStopDispositionTerminalState('abandon', ['abandoned'], 'abandon-case'), 'abandoned');
assert.equal(assertProgressStopDispositionTerminalState('cancel', ['cancelled'], 'cancel-case'), 'cancelled');
assert.equal(assertProgressStopDispositionTerminalState('stale-dispose', ['stale-disposed'], 'stale-case'), 'stale-disposed');
assert.equal(assertProgressStopDispositionTerminalState('service', [], 'service-case'), null);
assert.equal(assertProgressStopDispositionTerminalState('drain', [], 'drain-case'), null);

for (const [disposition, terminal] of [
  ['abandon', 'abandoned'],
  ['cancel', 'cancelled'],
  ['stale-dispose', 'stale-disposed'],
]) {
  let caught = null;
  try {
    assertProgressStopDispositionTerminalState(disposition, [], `${disposition}-mismatch`);
  } catch (error) {
    caught = error;
  }
  assert(caught, `${disposition} without ${terminal} must fail closed`);
  assert.equal(caught.code, 'PROGRESS_WORK_TERMINAL');
  assert.match(caught.message, new RegExp(`${disposition}.*${terminal}`));
}

const ordinaryReachable = requiredProgressTerminalStates('ordinary', 'abandon');
assert.deepEqual(ordinaryReachable, ['abandoned', 'cancelled', 'completed', 'failed', 'stale-disposed']);
assert(!ordinaryReachable.includes('quarantined'), 'ordinary work must not require an unreachable fatal quarantine disposition');
assert.deepEqual(requiredProgressTerminalStates('must-drain', 'drain'), ['cancelled', 'completed', 'failed', 'quarantined', 'stale-disposed']);
assert.deepEqual(requiredProgressTerminalStates('terminal-output', 'drain'), ['cancelled', 'completed', 'failed', 'quarantined', 'stale-disposed']);

function expectReachabilityFailure(kind, disposition, states, missing) {
  let caught = null;
  try {
    assertProgressTerminalStateReachability(kind, disposition, states, `${kind}-${missing}-mismatch`);
  } catch (error) {
    caught = error;
  }
  assert(caught, `${kind}/${disposition} without ${missing} must fail closed`);
  assert.equal(caught.code, 'PROGRESS_WORK_TERMINAL');
  assert.match(caught.message, new RegExp(missing));
}

const ordinaryValid = ['completed', 'failed', 'cancelled', 'stale-disposed', 'abandoned'];
assert.deepEqual(assertProgressTerminalStateReachability('ordinary', 'abandon', ordinaryValid, 'ordinary-valid'), ordinaryReachable);
for (const missing of ordinaryReachable) {
  expectReachabilityFailure('ordinary', 'abandon', ordinaryValid.filter((state) => state !== missing), missing);
}

const mustDrainValid = ['completed', 'failed', 'cancelled', 'stale-disposed', 'quarantined'];
assert.deepEqual(assertProgressTerminalStateReachability('must-drain', 'drain', mustDrainValid, 'must-drain-valid'), requiredProgressTerminalStates('must-drain', 'drain'));
expectReachabilityFailure('must-drain', 'drain', mustDrainValid.filter((state) => state !== 'quarantined'), 'quarantined');
expectReachabilityFailure('terminal-output', 'drain', mustDrainValid.filter((state) => state !== 'quarantined'), 'quarantined');

const specSha256 = sourceTextSha256(specBytes);
console.log(`progress_terminal_state_authority=pass ordinary=${ordinaryReachable.join(',')} result_visible=${requiredProgressTerminalStates('must-drain', 'drain').join(',')}`);
console.log(`progress_spec_source_sha256=${specSha256}`);

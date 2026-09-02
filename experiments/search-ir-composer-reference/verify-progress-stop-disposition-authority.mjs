import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertProgressStopDispositionTerminalState } from './src/progress.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');

const fixtureSource = await readFile(path.join(experimentRoot, 'src', 'progress-fixtures.mjs'), 'utf8');
const schema = JSON.parse(await readFile(path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'progress-profile.schema.json'), 'utf8'));
const spec = await readFile(path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0012-device-owned-search-progress.md'), 'utf8');

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
assert.match(spec, /completed.*failed.*cancelled.*abandoned.*stale-disposed/s, 'SPEC-0012 must retain abandoned as a distinct terminal outcome');
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

console.log('progress_stop_disposition_authority=pass abandon=abandoned cancel=cancelled stale-dispose=stale-disposed');

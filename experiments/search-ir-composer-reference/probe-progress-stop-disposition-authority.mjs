import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const fixtureContract = fixtureSource.match(/stopDisposition:\s*stopDisposition\(kind\),\s*\n\s*terminalStates:\s*\[([^\]]+)\]/);
assert(fixtureContract, 'Progress fixture work-class stop/terminal contract was not found');
const fixtureTerminalStates = [...fixtureContract[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
assert(fixtureSource.includes("return 'abandon';"), 'Progress fixture must still select abandon for ordinary work');
assert(
  fixtureTerminalStates.includes('abandoned'),
  `ordinary work selects stopDisposition=abandon but fixture terminalStates omit abandoned: ${fixtureTerminalStates.join(', ')}`,
);

console.log('progress_stop_disposition_authority=pass terminal=abandoned');

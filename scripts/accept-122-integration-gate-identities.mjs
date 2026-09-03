import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const FIXTURE_PATH = path.join(ROOT, 'experiments', 'search-semantics-reference', 'fixtures', 'integration-cases.json');
const GATE_PATH = path.join(ROOT, 'experiments', 'search-semantics-reference', 'run-integration-gate.mjs');
const OLD_COMPOSER_SHA = '1bf7703fc7758c18f0f74e7573eb126410f8ad09b1e60145cbeaccdef20e10e2';
const ACCEPTED_COMPOSER_SHA = 'd8b6890ae4fc18e39618cd172e59fd0dedad465e48ae80e5442142235be7c4b4';

const EXPECTED_IDS = Object.freeze([
  'search-ir',
  'composer',
  'domain',
  'graph-node',
  'graph-edge',
  'graph-ref',
  'graph-path',
  'graph-root',
  'graph-reclaim',
  'graph-advance',
  'graph-cleanup',
  'policy',
  'evaluator',
  'resource',
  'progress',
  'output',
  'framework',
  'terminal',
  'session',
  'stage',
  'channel',
]);

const COMMANDS = Object.freeze([
  'scripts/run-search-ir-reference.mjs',
  'scripts/run-search-ir-composer-reference.mjs',
  'scripts/export-search-ir-composer-domain-profiles.mjs',
  'scripts/export-search-ir-composer-graph-profiles.mjs',
  'scripts/export-search-ir-composer-policy-profiles.mjs',
  'scripts/export-search-ir-composer-evaluator-profiles.mjs',
  'scripts/export-search-ir-composer-resource-profiles.mjs',
  'scripts/export-search-ir-composer-progress-profiles.mjs',
  'scripts/export-search-ir-composer-output-profiles.mjs',
  'scripts/export-search-ir-composer-session-profiles.mjs',
  'scripts/export-search-ir-composer-stage-profiles.mjs',
  'scripts/run-search-semantics-reference.mjs',
  'scripts/run-graph-node-reference.mjs',
  'scripts/run-graph-edge-reference.mjs',
  'scripts/run-graph-ref-reference.mjs',
  'scripts/run-graph-path-reference.mjs',
  'scripts/run-graph-root-reference.mjs',
  'scripts/run-graph-reclaim-reference.mjs',
  'scripts/run-graph-advance-occurrence-reference.mjs',
  'scripts/run-graph-cleanup-reference.mjs',
  'scripts/run-policy-reference.mjs',
  'scripts/run-evaluator-reference.mjs',
  'scripts/run-resource-reference.mjs',
  'scripts/run-progress-reference.mjs',
  'scripts/run-output-reference.mjs',
  'scripts/run-framework-lifecycle-reference.mjs',
  'scripts/run-terminal-slice-reference.mjs',
  'scripts/run-session-reference.mjs',
  'scripts/run-stage-reference.mjs',
  'scripts/run-channel-reference-evidence.mjs',
]);

function fail(message) {
  throw new Error(`accept-122-integration-gate: ${message}`);
}

function run(relative) {
  const result = spawnSync(process.execPath, [path.join(ROOT, relative)], {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    fail(`${relative} failed with status ${result.status}`);
  }
  console.log(`accept-122-refreeze-input=${relative} result=pass`);
}

async function readJson(absolutePath) {
  return JSON.parse(await readFile(absolutePath, 'utf8'));
}

function identityOf(id, evidence) {
  if (id === 'composer') return evidence.representationCompositionEvidenceKey;
  if (id === 'search-ir') return evidence.searchIrIdentity;
  return evidence.evidenceIdentity;
}

function normalizeIdentity(identity, label) {
  if (identity === null || typeof identity !== 'object') fail(`${label} identity missing`);
  const { algorithm, byteLength, sha256 } = identity;
  if (algorithm !== 'sha256') fail(`${label} identity algorithm must be sha256`);
  if (!Number.isSafeInteger(byteLength) || byteLength <= 0) fail(`${label} identity byteLength must be a positive safe integer`);
  if (!/^[0-9a-f]{64}$/.test(sha256 ?? '')) fail(`${label} identity sha256 must be 64 lowercase hex characters`);
  return { algorithm, byteLength, sha256 };
}

for (const relative of COMMANDS) run(relative);

const fixture = await readJson(FIXTURE_PATH);
if (!Array.isArray(fixture.evidenceInputs)) fail('integration fixture evidenceInputs must be an array');
const ids = fixture.evidenceInputs.map(({ id }) => id);
if (ids.length !== EXPECTED_IDS.length) fail(`expected ${EXPECTED_IDS.length} evidence inputs, found ${ids.length}`);
if (new Set(ids).size !== ids.length) fail('integration fixture evidence input ids must be unique');
if (JSON.stringify(ids) !== JSON.stringify(EXPECTED_IDS)) fail(`integration fixture evidence input order drifted: ${JSON.stringify(ids)}`);

const accepted = {};
for (const descriptor of fixture.evidenceInputs) {
  if (typeof descriptor.path !== 'string' || typeof descriptor.capsule !== 'string') fail(`${descriptor.id} descriptor is incomplete`);
  const evidence = await readJson(path.join(ROOT, descriptor.path));
  if (evidence.capsule !== descriptor.capsule) fail(`${descriptor.id} capsule drifted: ${evidence.capsule}`);
  if (evidence.status !== 'pass') fail(`${descriptor.id} evidence is not pass`);
  accepted[descriptor.id] = normalizeIdentity(identityOf(descriptor.id, evidence), descriptor.id);
}

if (accepted.composer.sha256 !== ACCEPTED_COMPOSER_SHA || accepted.composer.byteLength !== 709315) {
  fail(`accepted Composer identity drifted: ${JSON.stringify(accepted.composer)}`);
}

let gate = await readFile(GATE_PATH, 'utf8');
if (!gate.includes(OLD_COMPOSER_SHA)) fail('gate no longer contains the proposal-era Composer identity; refusing generic snapshot refresh');
if (gate.includes(ACCEPTED_COMPOSER_SHA)) fail('gate already contains accepted Composer identity before one-shot refreeze');

const startToken = 'const frozenEvidenceIdentities = {';
const endToken = '\n};\n\nconst requiredComposerWitnesses = {';
const start = gate.indexOf(startToken);
const end = gate.indexOf(endToken, start);
if (start < 0 || end < 0) fail('frozenEvidenceIdentities block shape drifted');
if (gate.indexOf(startToken, start + 1) !== -1) fail('multiple frozenEvidenceIdentities blocks found');

const lines = EXPECTED_IDS.map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(accepted[id])},`);
const replacement = `${startToken}\n${lines.join('\n')}${endToken}`;
gate = `${gate.slice(0, start)}${replacement}${gate.slice(end + endToken.length)}`;

if (!gate.includes(ACCEPTED_COMPOSER_SHA)) fail('accepted Composer identity was not written into gate');
if (gate.includes(OLD_COMPOSER_SHA)) fail('proposal-era Composer identity remains in gate after refreeze');

await writeFile(GATE_PATH, gate, 'utf8');
console.log(`accept-122 integration gate refrozen identities=${EXPECTED_IDS.length} composer=${accepted.composer.sha256}`);

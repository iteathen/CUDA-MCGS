import { spawnSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const FIXTURE_DIR = path.join(ROOT, 'experiments', 'search-semantics-reference', 'fixtures');
const REFERENCE_DIR = path.join(ROOT, 'experiments', 'search-semantics-reference');
const COMPOSER_BUILD = path.join(ROOT, 'experiments', 'search-ir-composer-reference', 'build');
const REFERENCE_BUILD = path.join(REFERENCE_DIR, 'build');

const OLD_COMPOSER = Object.freeze({
  algorithm: 'sha256',
  byteLength: 729040,
  sha256: '1bf7703fc7758c18f0f74e7573eb126410f8ad09b1e60145cbeaccdef20e10e2',
});
const ACCEPTED_COMPOSER = Object.freeze({
  algorithm: 'sha256',
  byteLength: 709315,
  sha256: 'd8b6890ae4fc18e39618cd172e59fd0dedad465e48ae80e5442142235be7c4b4',
});
const ACCEPTED_PROJECTIONS = Object.freeze({
  domain: Object.freeze({ algorithm: 'sha256', byteLength: 69473, sha256: '45027b1ca244d47a1c8a82cc37ec10a27e1b2c6f740a93e083333a4f507cb8ee' }),
  graph: Object.freeze({ algorithm: 'sha256', byteLength: 140229, sha256: 'b074600f829b632195d58bd971b134a7a367e9d45abb8126d9b7d690174dce2d' }),
  policy: Object.freeze({ algorithm: 'sha256', byteLength: 123822, sha256: '8a8fb66d1f9e51ac416638bb18ee4ac28a2da489e24b6c306b5863a26e2b94ea' }),
  evaluator: Object.freeze({ algorithm: 'sha256', byteLength: 155389, sha256: '3185d1c913614e671a4a30bd00fd513f215bcfc85ac4c6fb233e3fb03288d066' }),
  resource: Object.freeze({ algorithm: 'sha256', byteLength: 982936, sha256: '8b63df5728be0257bb5eac94186e9260e60d914f5e1a0fc44e401ed98b2d454f' }),
  progress: Object.freeze({ algorithm: 'sha256', byteLength: 185435, sha256: '0c5ba17e47c81e4b25d0d8f6cb2707ecddb4b0644fd6a32edd02d2edb8e3ae0d' }),
  output: Object.freeze({ algorithm: 'sha256', byteLength: 126639, sha256: 'cb66378db8acbcee3e74d1fb55cdd58e12973d4028e6b5ea0aa604c31eb86791' }),
  session: Object.freeze({ algorithm: 'sha256', byteLength: 111956, sha256: '5ff0b1540525eb5a764af3f16e3e6f4ff479b3a512667024916a182d0d688602' }),
  stage: Object.freeze({ algorithm: 'sha256', byteLength: 104812, sha256: 'd9bf7cea325856d8238fb0d2e41bdf7f135dfb03c6e113d1408258c72ae3710e' }),
});

function fail(message) {
  throw new Error(`accept-122-search-semantics: ${message}`);
}

function same(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function identity3(value, label) {
  if (!value || value.algorithm !== 'sha256' || !Number.isSafeInteger(value.byteLength) || !/^[0-9a-f]{64}$/.test(value.sha256 ?? '')) {
    fail(`${label} is not a canonical sha256 identity`);
  }
  return { algorithm: value.algorithm, byteLength: value.byteLength, sha256: value.sha256 };
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function run(relative) {
  const result = spawnSync(process.execPath, [path.join(ROOT, relative)], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) fail(`${relative} failed with status ${result.status}`);
}

async function fixturePaths() {
  return (await readdir(FIXTURE_DIR))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => path.join(FIXTURE_DIR, name));
}

async function migrateCoverageOwnerField() {
  const queue = [REFERENCE_DIR];
  let replacements = 0;
  while (queue.length > 0) {
    const current = queue.pop();
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'build') queue.push(absolute);
        continue;
      }
      if (!entry.name.endsWith('.mjs')) continue;
      let text = await readFile(absolute, 'utf8');
      const count = text.split('plannedEvidenceOwner').length - 1;
      if (count === 0) continue;
      text = text.replaceAll('plannedEvidenceOwner', 'evidenceOwner');
      await writeFile(absolute, text, 'utf8');
      replacements += count;
    }
  }
  if (replacements < 10) fail(`expected broad accepted owner-field migration, found only ${replacements} plannedEvidenceOwner references`);
  console.log(`accept-122 coverage owner-field references migrated=${replacements}`);
}

async function generateAcceptedComposerProducts() {
  run('scripts/run-search-ir-composer-reference.mjs');
  for (const owner of ['domain', 'graph', 'policy', 'evaluator', 'resource', 'progress', 'output', 'session', 'stage']) {
    run(`scripts/export-search-ir-composer-${owner}-profiles.mjs`);
  }

  const composerEvidence = await readJson(path.join(COMPOSER_BUILD, 'evidence.json'));
  const composerIdentity = identity3(composerEvidence.representationCompositionEvidenceKey, 'accepted Composer evidence');
  if (!same(composerIdentity, ACCEPTED_COMPOSER)) {
    fail(`accepted Composer identity drifted: ${JSON.stringify(composerIdentity)}`);
  }

  const projections = {};
  for (const owner of Object.keys(ACCEPTED_PROJECTIONS)) {
    const projection = await readJson(path.join(COMPOSER_BUILD, `${owner}-profiles.json`));
    const actual = identity3(projection.projectionIdentity, `${owner} profile projection`);
    if (!same(actual, ACCEPTED_PROJECTIONS[owner])) {
      fail(`${owner} accepted profile projection drifted: ${JSON.stringify(actual)}`);
    }
    projections[owner] = { schema: projection.schema, ...actual };
  }

  const rootControl = await readJson(path.join(COMPOSER_BUILD, 'root-control.json'));
  const rootControlIdentity = identity3(rootControl.identity, 'accepted root-control projection');
  return { composerIdentity, projections, rootControlIdentity };
}

function projectionOwner(schema) {
  const match = /^cuda-mcgs\.search-ir-composer-(domain|graph|policy|evaluator|resource|progress|output|session|stage)-profile-projection\/0\.2\.0$/.exec(schema ?? '');
  return match?.[1] ?? null;
}

function replaceSemanticIdentity(value, composerIdentity) {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) value[index] = replaceSemanticIdentity(value[index], composerIdentity);
    return value;
  }
  if (!value || typeof value !== 'object') return value;
  for (const [key, current] of Object.entries(value)) {
    if (key === 'evidenceKey' && current === OLD_COMPOSER.sha256) {
      value[key] = composerIdentity.sha256;
      continue;
    }
    if (key === 'semanticIdentity' && current === `semantic.${OLD_COMPOSER.sha256}`) {
      value[key] = `semantic.${composerIdentity.sha256}`;
      continue;
    }
    value[key] = replaceSemanticIdentity(current, composerIdentity);
  }
  return value;
}

async function rebindBaseFixtures({ composerIdentity, projections, rootControlIdentity }) {
  let composerPins = 0;
  let projectionPins = 0;
  let rootControlPins = 0;
  for (const file of await fixturePaths()) {
    const fixture = await readJson(file);
    let changed = false;

    if (Object.hasOwn(fixture, 'composerEvidence')) {
      if (!same(fixture.composerEvidence, OLD_COMPOSER)) {
        fail(`${path.basename(file)} Composer identity drifted before acceptance: ${JSON.stringify(fixture.composerEvidence)}`);
      }
      fixture.composerEvidence = { ...composerIdentity };
      composerPins += 1;
      changed = true;
    }

    if (fixture.profileProjection?.algorithm === 'sha256') {
      const owner = projectionOwner(fixture.profileProjection.schema);
      if (!owner || !projections[owner]) fail(`${path.basename(file)} has unknown identity-bearing profile projection ${fixture.profileProjection.schema}`);
      fixture.profileProjection = { schema: fixture.profileProjection.schema, ...identity3(projections[owner], `${owner} projection`) };
      projectionPins += 1;
      changed = true;
    }

    if (Object.hasOwn(fixture, 'rootControlProjection')) {
      fixture.rootControlProjection = { ...rootControlIdentity };
      rootControlPins += 1;
      changed = true;
    }

    const beforeSemantic = JSON.stringify(fixture);
    replaceSemanticIdentity(fixture, composerIdentity);
    if (JSON.stringify(fixture) !== beforeSemantic) changed = true;

    if (changed) await writeJson(file, fixture);
  }

  if (composerPins < 15) fail(`expected at least 15 Composer fixture pins, found ${composerPins}`);
  if (projectionPins !== 13) fail(`expected 13 identity-bearing profile projection pins, found ${projectionPins}`);
  if (rootControlPins !== 3) fail(`expected 3 root-control projection pins, found ${rootControlPins}`);
  console.log(`accept-122 base fixture pins rebound composer=${composerPins} projection=${projectionPins} rootControl=${rootControlPins}`);
}

async function replaceFixtureEvidenceIdentity(key, expectedCount, nextIdentity) {
  const identity = identity3(nextIdentity, key);
  const seen = [];
  const files = await fixturePaths();
  for (const file of files) {
    const fixture = await readJson(file);
    if (!Object.hasOwn(fixture, key)) continue;
    seen.push(JSON.stringify(fixture[key]));
  }
  if (seen.length !== expectedCount) fail(`${key} expected in ${expectedCount} fixtures, found ${seen.length}`);
  if (new Set(seen).size !== 1) fail(`${key} pre-acceptance fixture pins are split`);

  for (const file of files) {
    const fixture = await readJson(file);
    if (!Object.hasOwn(fixture, key)) continue;
    fixture[key] = { ...identity };
    await writeJson(file, fixture);
  }
  console.log(`accept-122 downstream evidence pin ${key} rebound fixtures=${expectedCount} sha256=${identity.sha256}`);
}

async function generatedEvidence(file, label) {
  const evidence = await readJson(path.join(REFERENCE_BUILD, file));
  if (evidence.status !== 'pass') fail(`${label} evidence is not pass`);
  return identity3(evidence.evidenceIdentity, `${label} evidence identity`);
}

async function rebindGraphEvidenceChain() {
  run('scripts/run-graph-node-reference.mjs');
  await replaceFixtureEvidenceIdentity('nodeEvidence', 7, await generatedEvidence('graph-node-evidence.json', 'Graph NODE'));

  run('scripts/run-graph-edge-reference.mjs');
  await replaceFixtureEvidenceIdentity('edgeEvidence', 3, await generatedEvidence('graph-edge-evidence.json', 'Graph EDGE'));

  run('scripts/run-graph-ref-reference.mjs');
  await replaceFixtureEvidenceIdentity('refEvidence', 5, await generatedEvidence('graph-ref-evidence.json', 'Graph REF'));

  run('scripts/run-graph-path-reference.mjs');
  await replaceFixtureEvidenceIdentity('pathEvidence', 4, await generatedEvidence('graph-path-evidence.json', 'Graph PATH'));

  run('scripts/run-graph-root-reference.mjs');
  await replaceFixtureEvidenceIdentity('rootEvidence', 3, await generatedEvidence('graph-root-evidence.json', 'Graph ROOT'));

  run('scripts/run-graph-reclaim-reference.mjs');
  await replaceFixtureEvidenceIdentity('reclaimEvidence', 2, await generatedEvidence('graph-reclaim-evidence.json', 'Graph RECLAIM'));

  run('scripts/run-graph-advance-occurrence-reference.mjs');
  await replaceFixtureEvidenceIdentity('advanceOccurrenceEvidence', 1, await generatedEvidence('graph-advance-occurrence-evidence.json', 'Graph ADVANCE occurrence'));

  run('scripts/run-graph-cleanup-reference.mjs');
  await generatedEvidence('graph-cleanup-evidence.json', 'Graph CLEANUP');
}

await migrateCoverageOwnerField();
const acceptedProducts = await generateAcceptedComposerProducts();
await rebindBaseFixtures(acceptedProducts);
await rebindGraphEvidenceChain();

console.log('accept-122 complete search-semantics evidence bridge rebound to accepted authority');

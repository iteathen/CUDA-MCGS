import fs from 'node:fs';

const fixtureRoot = 'experiments/search-semantics-reference/fixtures';
const composerRoot = 'experiments/search-ir-composer-reference/build';
const semanticsBuild = 'experiments/search-semantics-reference/build';

const old = Object.freeze({
  composer: { byteLength: 727811, sha256: 'a6abe9cb7b22f15b4e57fb89cbe0dd0a22e8539beff3e98f9f18f67c421e2bfe' },
  domainProjection: { byteLength: 69524, sha256: 'e319016762037a1668e272347ef956b259438105f90fa0d021a69a7a27d4d7db' },
  graphProjection: { byteLength: 140331, sha256: '7dc0b6a20f0d7a7557189d9103c76bf62280749b3ea1ccc004e7035e8e0a1f38' },
  policyProjection: { byteLength: 123882, sha256: 'c5ce305623953ed048ab6d4afff8569ecee552a28b2060090bb25555f5460794' },
  evaluatorProjection: { byteLength: 155494, sha256: '90d21c93874bcf1c3e4987ff21390d6a18361ce507ee74b6f329d49a49e52c80' },
  resourceProjection: { byteLength: 983107, sha256: 'bf0d918c2774afcd2cdad4059f987f88d66ce36ba39b6f7c05dab30969b1a966' },
  nodeEvidence: { byteLength: 10047, sha256: '1be613c600397b03f3b5cfca71e981b2bf9a6994df851885895b6bd1b4dd5ec0' },
  edgeEvidence: { byteLength: 11661, sha256: 'b937b4f37e6005becc2a321fbafa17607a673d85e6501665995b6037f7f5a337' },
  refEvidence: { byteLength: 9139, sha256: '51c8ffe0b623769d25545bc8a220a2f65dfaa1829b31e70467d401b5197940a8' },
  pathEvidence: { byteLength: 9530, sha256: 'c51090a355cdb2dd66ca3ae7bb5c941afa9dd443d2abdba0fc64ec542923d5a6' },
  rootControlProjection: { byteLength: 10489, sha256: 'e09b71bb3d9b7303d2671ff147d6ef4759c93c0d56f8ebb4d7828c35108cdcbe' },
  rootEvidence: { byteLength: 10008, sha256: '8024881908220370398ca2beb3f5f0e36777f22fe566b93f9b182b128058bf75' },
  reclaimEvidence: { byteLength: 12127, sha256: '61566d43586168066574028e55041509fa28491c56dfd51601173145fb6922dd' },
  advanceOccurrenceEvidence: { byteLength: 4195, sha256: '9491d4979dd88b1140b836496f31a4dee5af4aab5ad41bec85dde21baf0552a7' },
});

function readJson(path) { return JSON.parse(fs.readFileSync(path, 'utf8')); }
function requireIdentity(identity, label) {
  if (!identity || identity.algorithm !== 'sha256' || !Number.isSafeInteger(identity.byteLength) || identity.byteLength <= 0 || !/^[0-9a-f]{64}$/.test(identity.sha256)) throw new Error(`${label} is not a valid SHA-256 identity`);
  return { byteLength: identity.byteLength, sha256: identity.sha256 };
}
function requirePassingEvidence(path, label) {
  const evidence = readJson(path);
  if (evidence.status !== 'pass') throw new Error(`${label} is not passing evidence`);
  return requireIdentity(evidence.evidenceIdentity, `${label} evidenceIdentity`);
}
function replaceIdentityField(file, field, expected, next) {
  const path = `${fixtureRoot}/${file}`;
  const input = fs.readFileSync(path, 'utf8');
  const expression = new RegExp(`(  "${field}": \\{\\n(?:    "schema": "[^"\\n]+",\\n)?    "algorithm": "sha256",\\n    "byteLength": )(\\d+)(,\\n    "sha256": ")([0-9a-f]{64})("\\n  \\})`);
  const match = input.match(expression);
  if (!match) throw new Error(`${file}: identity field ${field} not found in expected representation`);
  const actual = { byteLength: Number(match[2]), sha256: match[4] };
  if (actual.byteLength !== expected.byteLength || actual.sha256 !== expected.sha256) throw new Error(`${file}: ${field} is not the audited prior identity`);
  const replacement = `${match[1]}${next.byteLength}${match[3]}${next.sha256}${match[5]}`;
  fs.writeFileSync(path, input.replace(expression, replacement));
}

const composerEvidence = readJson(`${composerRoot}/evidence.json`);
if (composerEvidence.capsule !== 'cuda-mcgs-search-ir-composer-reference-v0.2.0' || composerEvidence.status !== 'pass') throw new Error('current Composer evidence is not the expected passing capsule');
const summary = composerEvidence.summary;
if (!Number.isSafeInteger(summary.expected) || summary.expected <= 0 || summary.discovered !== summary.expected || summary.executed !== summary.discovered || summary.passed !== summary.executed || summary.failed !== 0 || summary.requiredSkipped !== 0 || summary.conditionalSkipped !== 0 || summary.optionalSkipped !== 0 || summary.notDiscovered !== 0) throw new Error('current Composer evidence is not a complete pass');
const currentComposer = requireIdentity(composerEvidence.representationCompositionEvidenceKey, 'current Composer evidence');

const projection = (name) => requireIdentity(readJson(`${composerRoot}/${name}-profiles.json`).projectionIdentity, `${name} projection`);

const stage = process.argv[2];
if (!stage) throw new Error('usage: reference-provenance-rebind.mjs <direct|graph-edge|graph-ref|graph-path|graph-root|graph-reclaim|graph-advance|graph-cleanup>');

if (stage === 'direct') {
  const composerFixtures = [
    'domain-cases.json', 'evaluator-cases.json', 'graph-advance-occurrence-cases.json', 'graph-cleanup-cases.json',
    'graph-edge-cases.json', 'graph-node-cases.json', 'graph-path-cases.json', 'graph-reclaim-cases.json',
    'graph-ref-cases.json', 'graph-root-cases.json', 'neutral-schedules.json', 'output-cases.json', 'policy-cases.json',
    'progress-cases.json', 'resource-cases.json',
  ];
  for (const file of composerFixtures) replaceIdentityField(file, 'composerEvidence', old.composer, currentComposer);

  replaceIdentityField('domain-cases.json', 'profileProjection', old.domainProjection, projection('domain'));
  replaceIdentityField('evaluator-cases.json', 'profileProjection', old.evaluatorProjection, projection('evaluator'));
  replaceIdentityField('policy-cases.json', 'profileProjection', old.policyProjection, projection('policy'));
  replaceIdentityField('resource-cases.json', 'profileProjection', old.resourceProjection, projection('resource'));
  const currentGraph = projection('graph');
  for (const file of ['graph-advance-occurrence-cases.json', 'graph-cleanup-cases.json', 'graph-edge-cases.json', 'graph-node-cases.json', 'graph-path-cases.json', 'graph-reclaim-cases.json', 'graph-ref-cases.json', 'graph-root-cases.json']) {
    replaceIdentityField(file, 'profileProjection', old.graphProjection, currentGraph);
  }
  console.log(`rebind=direct composer=${currentComposer.sha256} graph_projection=${currentGraph.sha256}`);
} else if (stage === 'graph-edge') {
  replaceIdentityField('graph-edge-cases.json', 'nodeEvidence', old.nodeEvidence, requirePassingEvidence(`${semanticsBuild}/graph-node-evidence.json`, 'Graph NODE'));
} else if (stage === 'graph-ref') {
  replaceIdentityField('graph-ref-cases.json', 'nodeEvidence', old.nodeEvidence, requirePassingEvidence(`${semanticsBuild}/graph-node-evidence.json`, 'Graph NODE'));
} else if (stage === 'graph-path') {
  replaceIdentityField('graph-path-cases.json', 'nodeEvidence', old.nodeEvidence, requirePassingEvidence(`${semanticsBuild}/graph-node-evidence.json`, 'Graph NODE'));
  replaceIdentityField('graph-path-cases.json', 'refEvidence', old.refEvidence, requirePassingEvidence(`${semanticsBuild}/graph-ref-evidence.json`, 'Graph REF'));
} else if (stage === 'graph-root') {
  replaceIdentityField('graph-root-cases.json', 'nodeEvidence', old.nodeEvidence, requirePassingEvidence(`${semanticsBuild}/graph-node-evidence.json`, 'Graph NODE'));
  replaceIdentityField('graph-root-cases.json', 'refEvidence', old.refEvidence, requirePassingEvidence(`${semanticsBuild}/graph-ref-evidence.json`, 'Graph REF'));
  replaceIdentityField('graph-root-cases.json', 'pathEvidence', old.pathEvidence, requirePassingEvidence(`${semanticsBuild}/graph-path-evidence.json`, 'Graph PATH'));
  replaceIdentityField('graph-root-cases.json', 'rootControlProjection', old.rootControlProjection, requireIdentity(readJson(`${composerRoot}/root-control.json`).identity, 'root-control projection'));
} else if (stage === 'graph-reclaim') {
  const targets = [
    ['nodeEvidence', old.nodeEvidence, 'graph-node-evidence.json', 'Graph NODE'],
    ['edgeEvidence', old.edgeEvidence, 'graph-edge-evidence.json', 'Graph EDGE'],
    ['refEvidence', old.refEvidence, 'graph-ref-evidence.json', 'Graph REF'],
    ['pathEvidence', old.pathEvidence, 'graph-path-evidence.json', 'Graph PATH'],
    ['rootEvidence', old.rootEvidence, 'graph-root-evidence.json', 'Graph ROOT'],
  ];
  for (const [field, previous, file, label] of targets) replaceIdentityField('graph-reclaim-cases.json', field, previous, requirePassingEvidence(`${semanticsBuild}/${file}`, label));
  replaceIdentityField('graph-reclaim-cases.json', 'rootControlProjection', old.rootControlProjection, requireIdentity(readJson(`${composerRoot}/root-control.json`).identity, 'root-control projection'));
} else if (stage === 'graph-advance') {
  const targets = [
    ['nodeEvidence', old.nodeEvidence, 'graph-node-evidence.json', 'Graph NODE'],
    ['edgeEvidence', old.edgeEvidence, 'graph-edge-evidence.json', 'Graph EDGE'],
    ['refEvidence', old.refEvidence, 'graph-ref-evidence.json', 'Graph REF'],
    ['pathEvidence', old.pathEvidence, 'graph-path-evidence.json', 'Graph PATH'],
    ['rootEvidence', old.rootEvidence, 'graph-root-evidence.json', 'Graph ROOT'],
    ['reclaimEvidence', old.reclaimEvidence, 'graph-reclaim-evidence.json', 'Graph RECLAIM'],
  ];
  for (const [field, previous, file, label] of targets) replaceIdentityField('graph-advance-occurrence-cases.json', field, previous, requirePassingEvidence(`${semanticsBuild}/${file}`, label));
  replaceIdentityField('graph-advance-occurrence-cases.json', 'rootControlProjection', old.rootControlProjection, requireIdentity(readJson(`${composerRoot}/root-control.json`).identity, 'root-control projection'));
} else if (stage === 'graph-cleanup') {
  const targets = [
    ['nodeEvidence', old.nodeEvidence, 'graph-node-evidence.json', 'Graph NODE'],
    ['edgeEvidence', old.edgeEvidence, 'graph-edge-evidence.json', 'Graph EDGE'],
    ['refEvidence', old.refEvidence, 'graph-ref-evidence.json', 'Graph REF'],
    ['pathEvidence', old.pathEvidence, 'graph-path-evidence.json', 'Graph PATH'],
    ['rootEvidence', old.rootEvidence, 'graph-root-evidence.json', 'Graph ROOT'],
    ['reclaimEvidence', old.reclaimEvidence, 'graph-reclaim-evidence.json', 'Graph RECLAIM'],
    ['advanceOccurrenceEvidence', old.advanceOccurrenceEvidence, 'graph-advance-occurrence-evidence.json', 'Graph ADVANCE occurrence'],
  ];
  for (const [field, previous, file, label] of targets) replaceIdentityField('graph-cleanup-cases.json', field, previous, requirePassingEvidence(`${semanticsBuild}/${file}`, label));
} else {
  throw new Error(`unknown rebind stage ${stage}`);
}

import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, sourceTextSha256 } from './src/catalog.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const routePath = path.join(experimentRoot, 'fixtures', 'channel-evidence-routes.json');
const composerEvidencePath = path.join(experimentRoot, 'build', 'evidence.json');
const coveragePath = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0', 'requirement-coverage.json');
const specPath = path.join(repositoryRoot, 'docs', 'specs', 'SPEC-0004-async-stage-channels.md');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Channel evidence requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath, missingMessage = null) {
  try { return JSON.parse(await readFile(absolutePath, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT' && missingMessage) throw new Error(missingMessage);
    throw error;
  }
}

const routes = await readJson(routePath);
const composerEvidence = await readJson(
  composerEvidencePath,
  `${composerEvidencePath} is required; run the Search IR Composer reference first`,
);
const coverage = await readJson(coveragePath);
const specText = await readFile(specPath, 'utf8');

assert.equal(routes.schema, 'cuda-mcgs.channel-evidence-routes/0.2.0');
assert.equal(routes.contract, 'SPEC-0004');
assert.equal(routes.ownerExperiment, 'experiments/search-ir-composer-reference');
assert.equal(routes.directRequirementCount, 41);
assert.equal(composerEvidence.capsule, 'cuda-mcgs-search-ir-composer-reference-v0.2.0');
assert.equal(composerEvidence.status, 'pass');
assert.equal(composerEvidence.summary.failed, 0);
assert.equal(composerEvidence.summary.requiredSkipped, 0);
assert.equal(composerEvidence.summary.conditionalSkipped, 0);
assert.equal(composerEvidence.summary.optionalSkipped, 0);
assert.equal(composerEvidence.summary.notDiscovered, 0);

const channelClassifications = coverage.classifications.filter(({ contract }) => contract === 'SPEC-0004');
function classificationFor(requirementId) {
  const candidates = channelClassifications.filter(({ requirementPrefix }) => requirementId.startsWith(requirementPrefix));
  candidates.sort((left, right) => right.requirementPrefix.length - left.requirementPrefix.length);
  assert(candidates.length > 0, `no Channel coverage classification for ${requirementId}`);
  return candidates[0];
}

const requirementIds = [...new Set(specText.match(/\bCHANNEL(?:-[A-Z]+)*-[0-9]{3}\b/g) ?? [])].sort();
const directRequirements = requirementIds.filter((id) => classificationFor(id).primaryDisposition === 'engine-reference-oracle');
assert.equal(directRequirements.length, routes.directRequirementCount, 'direct Channel engine-reference requirement count drifted');

const expectedFamilies = [
  ['CHANNEL-ITEM-', 10],
  ['CHANNEL-PRODUCER-', 7],
  ['CHANNEL-CONSUMER-', 7],
  ['CHANNEL-PUBLISH-', 7],
  ['CHANNEL-CANCEL-', 7],
  ['CHANNEL-CONFORMANCE-', 3],
];
assert(Array.isArray(routes.families), 'Channel route manifest families must be an array');
assert.deepEqual(
  routes.families.map(({ requirementPrefix, requirementCount }) => [requirementPrefix, requirementCount]),
  expectedFamilies,
  'Channel route manifest must preserve the six exact owner families',
);
assert.equal(new Set(routes.families.map(({ requirementPrefix }) => requirementPrefix)).size, routes.families.length, 'Channel route families must be unique');

assert(Array.isArray(routes.requirements), 'Channel route manifest requirements must be an array');
assert.equal(routes.requirements.length, routes.directRequirementCount, 'Channel route manifest must contain one record per direct requirement');
const manifestRequirementIds = routes.requirements.map(({ id }) => id);
assert.equal(new Set(manifestRequirementIds).size, manifestRequirementIds.length, 'Channel route manifest requirement IDs must be unique');
assert.deepEqual([...manifestRequirementIds].sort(), directRequirements, 'Channel route manifest must match the exact direct requirement set');

const actualFamilyCounts = new Map(routes.families.map(({ requirementPrefix }) => [requirementPrefix, 0]));
const composerCases = new Map(composerEvidence.cases.map((entry) => [entry.id, entry.status]));
const caseIds = new Set();
const routeEvidence = [];
const mappedRequirements = new Set();

for (const route of routes.requirements) {
  assert(typeof route.id === 'string', 'Channel route requirement ID must be a string');
  const classification = classificationFor(route.id);
  assert.equal(classification.primaryDisposition, 'engine-reference-oracle', `${route.id} is not an engine-reference route`);
  const matchingFamilies = routes.families.filter(({ requirementPrefix }) => route.id.startsWith(requirementPrefix));
  assert.equal(matchingFamilies.length, 1, `${route.id} must belong to exactly one direct Channel family`);
  assert.equal(classification.requirementPrefix, matchingFamilies[0].requirementPrefix, `${route.id} coverage family differs from route manifest`);
  actualFamilyCounts.set(classification.requirementPrefix, actualFamilyCounts.get(classification.requirementPrefix) + 1);

  assert(Array.isArray(route.cases) && route.cases.length > 0, `${route.id} must name owner-local evidence cases`);
  assert.equal(new Set(route.cases).size, route.cases.length, `${route.id} contains duplicate case IDs`);
  for (const id of route.cases) {
    assert.equal(composerCases.get(id), 'pass', `${route.id} requires passing Composer owner case ${id}`);
    caseIds.add(id);
  }
  mappedRequirements.add(route.id);
  routeEvidence.push({ id: route.id, requirementPrefix: classification.requirementPrefix, cases: route.cases });
}

assert.deepEqual(
  routes.families.map(({ requirementPrefix }) => [requirementPrefix, actualFamilyCounts.get(requirementPrefix)]),
  expectedFamilies,
  'Channel requirement-level route counts drifted from the six exact families',
);
assert.equal(mappedRequirements.size, directRequirements.length, 'every direct Channel requirement must map to exact owner-local evidence');
assert.deepEqual([...mappedRequirements].sort(), directRequirements, 'Channel evidence requirement mapping must be exact');

for (const field of [
  'channelResourcePlanIdentity',
  'channelFirstProductDeletedResourcePlanIdentity',
  'channelProgressPlanIdentity',
  'channelFirstProductDeletedProgressPlanIdentity',
  'channelStageProfileIdentity',
  'channelDeletedStageProfileIdentity',
  'channelProfileIdentities',
  'channelFirstProductDeletedIdentity',
]) assert.notEqual(composerEvidence[field], undefined, `Composer evidence is missing ${field}`);
assert.equal(composerEvidence.channelProfileIdentities.length, 2, 'Channel evidence requires two materially different selected profiles');
assert(composerEvidence.channelFirstProductDeletedIdentity, 'Channel evidence requires first-product deletion identity');

const sourcePaths = [
  'docs/specs/SPEC-0004-async-stage-channels.md',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
  'schemas/search-ir/0.2.0/channel-profile.schema.json',
  'experiments/search-ir-composer-reference/fixtures/channel-evidence-routes.json',
  'experiments/search-ir-composer-reference/src/channel.mjs',
  'experiments/search-ir-composer-reference/src/channel-fixtures.mjs',
  'experiments/search-ir-composer-reference/run.mjs',
  'experiments/search-ir-composer-reference/run-channel-evidence.mjs',
  'scripts/run-channel-reference-evidence.mjs',
];
const sources = {};
for (const relative of sourcePaths) sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));

const evidenceSubject = {
  schema: 'cuda-mcgs.channel-reference-evidence-key/0.2.0',
  contract: routes.contract,
  ownerExperiment: routes.ownerExperiment,
  composerEvidence: composerEvidence.representationCompositionEvidenceKey,
  channelResourcePlanIdentity: composerEvidence.channelResourcePlanIdentity,
  channelFirstProductDeletedResourcePlanIdentity: composerEvidence.channelFirstProductDeletedResourcePlanIdentity,
  channelProgressPlanIdentity: composerEvidence.channelProgressPlanIdentity,
  channelFirstProductDeletedProgressPlanIdentity: composerEvidence.channelFirstProductDeletedProgressPlanIdentity,
  channelStageProfileIdentity: composerEvidence.channelStageProfileIdentity,
  channelDeletedStageProfileIdentity: composerEvidence.channelDeletedStageProfileIdentity,
  channelProfileIdentities: composerEvidence.channelProfileIdentities,
  channelFirstProductDeletedIdentity: composerEvidence.channelFirstProductDeletedIdentity,
  directRequirements,
  families: routes.families,
  routeEvidence,
  caseIds: [...caseIds].sort(),
  sources,
};
const evidenceIdentity = canonicalIdentity(evidenceSubject);
const evidence = {
  schemaVersion: 2,
  capsule: 'cuda-mcgs-channel-reference-evidence-v0.2.0',
  scope: 'owner-local-channel-evidence-reuse',
  status: 'pass',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  composerEvidence: composerEvidence.representationCompositionEvidenceKey,
  evidenceIdentity,
  directRequirements,
  families: routes.families,
  requirements: routeEvidence,
  summary: {
    directRequirements: directRequirements.length,
    directRequirementsMapped: mappedRequirements.size,
    routeFamilies: routes.families.length,
    ownerCases: caseIds.size,
    ownerCasesPassed: [...caseIds].filter((id) => composerCases.get(id) === 'pass').length,
    requiredSkipped: 0,
    conditionalSkipped: 0,
    optionalSkipped: 0,
    notDiscovered: 0,
  },
  sources,
  claimLimits: [
    'This manifest reuses the existing Composer-owned Channel normalizer and bounded logical oracle; it does not define or import a second Channel state machine.',
    'The evidence is CUDA-free semantic/reference evidence for the optional internal Channel owner and the 41 direct SPEC-0004 engine-reference routes only.',
    'SPEC-0011 remains the aggregate finite-resource owner and SPEC-0012 remains the global readiness/progress/fairness/no-progress owner.',
    'CUDA release/acquire lowering, actual device races, occupancy/progress coexistence, performance and exact compatible-pair qualification remain native CUDA-JS responsibilities.',
  ],
};
const outputPath = path.join(experimentRoot, 'build', 'channel-evidence.json');
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`capsule=${evidence.capsule} status=pass direct_requirements=${evidence.summary.directRequirements} mapped=${evidence.summary.directRequirementsMapped} route_families=${evidence.summary.routeFamilies} owner_cases=${evidence.summary.ownerCases}`);
console.log(`composer_evidence_sha256=${composerEvidence.representationCompositionEvidenceKey.sha256} channel_evidence_sha256=${evidenceIdentity.sha256} canonical_bytes=${evidenceIdentity.byteLength}`);

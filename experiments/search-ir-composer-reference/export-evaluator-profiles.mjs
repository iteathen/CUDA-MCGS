import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, inspectCatalog, sourceTextSha256 } from './src/catalog.mjs';
import { normalizeDomainProfile } from './src/domain.mjs';
import { buildDomainProfiles } from './src/domain-fixtures.mjs';
import { normalizeGraphProfile } from './src/graph.mjs';
import { buildGraphProfiles } from './src/graph-fixtures.mjs';
import { normalizeEvaluatorProfile } from './src/evaluator.mjs';
import { buildEvaluatorProfiles } from './src/evaluator-fixtures.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const schemaRoot = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0');
const evidencePath = path.join(experimentRoot, 'build', 'evidence.json');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Evaluator-profile projection requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath) {
  return JSON.parse(await readFile(absolutePath, 'utf8'));
}

let composerEvidence;
try {
  composerEvidence = await readJson(evidencePath);
} catch (error) {
  if (error.code === 'ENOENT') throw new Error(`${evidencePath} is required; run the Search IR Composer reference first`);
  throw error;
}

assert.equal(composerEvidence.capsule, 'cuda-mcgs-search-ir-composer-reference-v0.2.0');
assert.equal(composerEvidence.status, 'pass');
assert.deepEqual(composerEvidence.summary, {
  expected: 881,
  discovered: 881,
  executed: 881,
  passed: 881,
  failed: 0,
  requiredSkipped: 0,
  conditionalSkipped: 0,
  optionalSkipped: 0,
  notDiscovered: 0,
});

const contractSetInput = await readJson(path.join(schemaRoot, 'contract-set.json'));
const coverageInput = await readJson(path.join(schemaRoot, 'requirement-coverage.json'));
const inspected = await inspectCatalog(repositoryRoot, contractSetInput, coverageInput);
const domainSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'domain-profile.schema.json')));
const graphSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'graph-profile.schema.json')));

const domainProfiles = buildDomainProfiles(inspected).map((profile) => normalizeDomainProfile(profile, inspected));
const graphFixtures = buildGraphProfiles(inspected, domainProfiles, domainSchemaSha);
const graphProfiles = graphFixtures.map(({ input, domain }) => normalizeGraphProfile(input, inspected, domain));
const evaluatorFixtures = buildEvaluatorProfiles(inspected, domainProfiles, graphProfiles, domainSchemaSha, graphSchemaSha);
const profiles = evaluatorFixtures.map(({ input, domain, graph }) => normalizeEvaluatorProfile(input, inspected, domain, graph));

assert.deepEqual(
  profiles.map(({ normalized, identity }) => ({ id: normalized.id, ...identity })),
  composerEvidence.evaluatorProfileIdentities,
  'projected Evaluator profiles must match the exact Composer-published identities',
);

const projectionSubject = {
  schema: 'cuda-mcgs.search-ir-composer-evaluator-profile-projection/0.2.0',
  producer: {
    capsule: composerEvidence.capsule,
    representationCompositionEvidenceKey: composerEvidence.representationCompositionEvidenceKey,
  },
  profiles: profiles.map(({ normalized, identity }) => ({ id: normalized.id, identity, normalized })),
};
const projection = {
  ...projectionSubject,
  projectionIdentity: canonicalIdentity(projectionSubject),
};

const outputPath = path.join(experimentRoot, 'build', 'evaluator-profiles.json');
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(projection, null, 2)}\n`);

console.log(`capsule=cuda-mcgs-search-ir-composer-evaluator-profile-projection-v0.2.0 profiles=${profiles.length} projection_sha256=${projection.projectionIdentity.sha256} canonical_bytes=${projection.projectionIdentity.byteLength}`);

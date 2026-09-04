import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertCompletePassSummary } from '../../components/search-compiler/testing.mjs';

import { canonicalIdentity, inspectCatalog, sourceTextSha256 } from './src/catalog.mjs';
import { normalizeDomainProfile } from '../../components/search-compiler/testing.mjs';
import { buildDomainProfiles } from './src/domain-fixtures.mjs';
import { normalizeGraphProfile } from '../../components/search-compiler/testing.mjs';
import { buildGraphProfiles } from './src/graph-fixtures.mjs';
import { normalizeEvaluatorProfile } from '../../components/search-compiler/testing.mjs';
import { buildEvaluatorProfiles } from './src/evaluator-fixtures.mjs';
import { normalizePolicyProfile } from '../../components/search-compiler/testing.mjs';
import { buildPolicyProfiles } from './src/policy-fixtures.mjs';
import { normalizeResourceProfile } from '../../components/search-compiler/testing.mjs';
import { buildResourceProfiles } from './src/resource-fixtures.mjs';
import { normalizeProgressProfile } from '../../components/search-compiler/testing.mjs';
import { buildProgressProfiles } from './src/progress-fixtures.mjs';
import { normalizeOutputProfile } from '../../components/search-compiler/testing.mjs';
import { buildOutputProfiles } from './src/output-fixtures.mjs';
import { normalizeSessionProfile } from '../../components/search-compiler/testing.mjs';
import { buildSessionProfiles } from './src/session-fixtures.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const schemaRoot = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0');
const evidencePath = path.join(experimentRoot, 'build', 'evidence.json');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Session-profile projection requires Node 26 or newer; found ${process.version}`);

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
assertCompletePassSummary(composerEvidence.summary, 'Composer evidence summary');

const contractSetInput = await readJson(path.join(schemaRoot, 'contract-set.json'));
const coverageInput = await readJson(path.join(schemaRoot, 'requirement-coverage.json'));
const inspected = await inspectCatalog(repositoryRoot, contractSetInput, coverageInput);
const domainSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'domain-profile.schema.json')));
const graphSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'graph-profile.schema.json')));
const evaluatorSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'evaluator-profile.schema.json')));
const policySchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'policy-profile.schema.json')));
const resourceSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'resource-profile.schema.json')));
const progressSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'progress-profile.schema.json')));
const outputSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'output-profile.schema.json')));

const domainProfiles = buildDomainProfiles(inspected).map((profile) => normalizeDomainProfile(profile, inspected));
const graphFixtures = buildGraphProfiles(inspected, domainProfiles, domainSchemaSha);
const graphProfiles = graphFixtures.map(({ input, domain }) => normalizeGraphProfile(input, inspected, domain));
const evaluatorFixtures = buildEvaluatorProfiles(inspected, domainProfiles, graphProfiles, domainSchemaSha, graphSchemaSha);
const evaluatorProfiles = evaluatorFixtures.map(({ input, domain, graph }) => normalizeEvaluatorProfile(input, inspected, domain, graph));
const policyFixtures = buildPolicyProfiles(inspected, domainProfiles, graphProfiles, domainSchemaSha, graphSchemaSha, evaluatorProfiles, evaluatorSchemaSha);
const policyProfiles = policyFixtures.map(({ input, domain, graph }) => normalizePolicyProfile(input, inspected, domain, graph));
const resourceInputs = buildResourceProfiles(inspected, domainProfiles, graphProfiles, policyProfiles, evaluatorProfiles, {
  domain: domainSchemaSha,
  graph: graphSchemaSha,
  policy: policySchemaSha,
  evaluator: evaluatorSchemaSha,
});
const knownOwnerProfiles = [
  ...domainProfiles.map((result) => ({ ...result, schemaSha: domainSchemaSha })),
  ...graphProfiles.map((result) => ({ ...result, schemaSha: graphSchemaSha })),
  ...policyProfiles.map((result) => ({ ...result, schemaSha: policySchemaSha })),
  ...evaluatorProfiles.map((result) => ({ ...result, schemaSha: evaluatorSchemaSha })),
];
const resourceProfiles = resourceInputs.map((input) => normalizeResourceProfile(input, inspected, knownOwnerProfiles));
const progressResourceResults = resourceProfiles.map((result) => ({ ...result, schemaSha: resourceSchemaSha }));
const progressInputs = buildProgressProfiles(inspected, progressResourceResults);
const progressProfiles = progressInputs.map((input, index) => normalizeProgressProfile(input, inspected, progressResourceResults[index], knownOwnerProfiles));
const outputProgressResults = progressProfiles.map((result) => ({ ...result, schemaSha: progressSchemaSha }));
const outputInputs = buildOutputProfiles(inspected, progressResourceResults, outputProgressResults);
const outputProfiles = outputInputs.map((input, index) => normalizeOutputProfile(input, inspected, progressResourceResults[index], outputProgressResults[index]));

const liveResource = progressResourceResults[2];
const liveProgress = outputProgressResults[2];
const liveOutput = { ...outputProfiles[2], schemaSha: outputSchemaSha };
const sessionInputs = buildSessionProfiles(inspected, liveResource, liveProgress, liveOutput);
const profiles = sessionInputs.map((input) => normalizeSessionProfile(input, inspected, liveResource, liveProgress, liveOutput));

assert.deepEqual(
  profiles.map(({ normalized, identity }) => ({ id: normalized.id, ...identity })),
  composerEvidence.sessionProfileIdentities,
  'projected Session profiles must match the exact Composer-published identities',
);

const projectionSubject = {
  schema: 'cuda-mcgs.search-ir-composer-session-profile-projection/0.2.0',
  producer: {
    capsule: composerEvidence.capsule,
    representationCompositionEvidenceKey: composerEvidence.representationCompositionEvidenceKey,
  },
  upstream: {
    resource: liveResource.identity,
    progress: liveProgress.identity,
    output: liveOutput.identity,
  },
  profiles: profiles.map(({ normalized, identity }) => ({ id: normalized.id, identity, normalized })),
};
const projection = {
  ...projectionSubject,
  projectionIdentity: canonicalIdentity(projectionSubject),
};

const outputPath = path.join(experimentRoot, 'build', 'session-profiles.json');
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(projection, null, 2)}\n`);

console.log(`capsule=cuda-mcgs-search-ir-composer-session-profile-projection-v0.2.0 profiles=${profiles.length} projection_sha256=${projection.projectionIdentity.sha256} canonical_bytes=${projection.projectionIdentity.byteLength}`);

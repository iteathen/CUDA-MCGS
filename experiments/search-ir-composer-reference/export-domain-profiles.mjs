import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalIdentity, inspectCatalog } from './src/catalog.mjs';
import { normalizeDomainProfile } from './src/domain.mjs';
import { buildDomainProfiles } from './src/domain-fixtures.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const schemaRoot = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0');
const evidencePath = path.join(experimentRoot, 'build', 'evidence.json');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Domain-profile projection requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath) {
  return JSON.parse(await readFile(absolutePath, 'utf8'));
}

let composerEvidence;
try {
  composerEvidence = await readJson(evidencePath);
} catch (error) {
  if (error.code === 'ENOENT') {
    throw new Error(`${evidencePath} is required; run the Search IR Composer reference first`);
  }
  throw error;
}

assert.equal(composerEvidence.capsule, 'cuda-mcgs-search-ir-composer-reference-v0.2.0');
assert.equal(composerEvidence.status, 'pass');
assert.deepEqual(composerEvidence.summary, {
  expected: 878,
  discovered: 878,
  executed: 878,
  passed: 878,
  failed: 0,
  requiredSkipped: 0,
  conditionalSkipped: 0,
  optionalSkipped: 0,
  notDiscovered: 0,
});

const contractSetInput = await readJson(path.join(schemaRoot, 'contract-set.json'));
const coverageInput = await readJson(path.join(schemaRoot, 'requirement-coverage.json'));
const inspected = await inspectCatalog(repositoryRoot, contractSetInput, coverageInput);
const profiles = buildDomainProfiles(inspected).map((profile) => normalizeDomainProfile(profile, inspected));
const expectedIdentities = composerEvidence.domainProfileIdentities;

assert.deepEqual(
  profiles.map(({ normalized, identity }) => ({ id: normalized.id, ...identity })),
  expectedIdentities,
  'projected Domain profiles must match the exact Composer-published identities',
);

const projectionSubject = {
  schema: 'cuda-mcgs.search-ir-composer-domain-profile-projection/0.2.0',
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

const outputPath = path.join(experimentRoot, 'build', 'domain-profiles.json');
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(projection, null, 2)}\n`);

console.log(`capsule=cuda-mcgs-search-ir-composer-domain-profile-projection-v0.2.0 profiles=${profiles.length} projection_sha256=${projection.projectionIdentity.sha256} canonical_bytes=${projection.projectionIdentity.byteLength}`);

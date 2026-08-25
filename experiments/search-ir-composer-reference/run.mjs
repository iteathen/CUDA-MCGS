import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  canonicalIdentity,
  inspectCatalog,
  normalizeContractSet,
  normalizeRequirementCoverage,
  sourceTextSha256,
} from './src/catalog.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const schemaRoot = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0');

assert(Number(process.versions.node.split('.')[0]) >= 26, `CUDA-MCGS Search IR Composer reference requires Node 26 or newer; found ${process.version}`);

async function readJson(absolutePath) {
  return JSON.parse(await readFile(absolutePath, 'utf8'));
}

function clone(value) {
  return structuredClone(value);
}

const contractSetInput = await readJson(path.join(schemaRoot, 'contract-set.json'));
const coverageInput = await readJson(path.join(schemaRoot, 'requirement-coverage.json'));
const contractSetSchema = await readJson(path.join(schemaRoot, 'contract-set.schema.json'));
const coverageSchema = await readJson(path.join(schemaRoot, 'requirement-coverage.schema.json'));

const cases = [];
async function runCase(id, body) {
  try {
    await body();
    cases.push({ id, status: 'pass' });
    console.log(`case=${id} result=pass`);
  } catch (error) {
    cases.push({ id, status: 'fail', error: { name: error.name, code: error.code ?? null, message: error.message } });
    console.error(`case=${id} result=fail error=${JSON.stringify(error.message)}`);
  }
}

let inspected;
await runCase('normalize-contract-set', () => {
  const normalized = normalizeContractSet(contractSetInput);
  assert.equal(normalized.schema, 'cuda-mcgs.search-ir.contract-set/0.2.0');
  assert.equal(normalized.contracts.length, 12);
});

await runCase('normalize-requirement-coverage', () => {
  const normalized = normalizeRequirementCoverage(coverageInput);
  assert.equal(normalized.contracts.length, 12);
  assert.deepEqual(normalized.totals, { contracts: 12, requirements: 989, classified: 0, pending: 989 });
});

await runCase('canonical-order-independent', () => {
  const reorderedCatalog = clone(contractSetInput);
  reorderedCatalog.contracts.reverse();
  reorderedCatalog.foundation.artifacts.reverse();
  const reorderedCoverage = clone(coverageInput);
  reorderedCoverage.contracts.reverse();
  assert.deepEqual(canonicalIdentity(normalizeContractSet(reorderedCatalog)), canonicalIdentity(normalizeContractSet(contractSetInput)));
  assert.deepEqual(canonicalIdentity(normalizeRequirementCoverage(reorderedCoverage)), canonicalIdentity(normalizeRequirementCoverage(coverageInput)));
});

await runCase('source-digest-line-ending-independent', () => {
  assert.equal(sourceTextSha256(Buffer.from('alpha\nbeta\n', 'utf8')), sourceTextSha256(Buffer.from('alpha\r\nbeta\r\n', 'utf8')));
});

await runCase('inspect-frozen-sources', async () => {
  inspected = await inspectCatalog(repositoryRoot, contractSetInput, coverageInput);
  assert.equal(inspected.contractSummaries.length, 12);
});

await runCase('accepted-foundation-immutable', () => {
  assert.deepEqual(inspected.contractSet.foundation.artifacts.map(({ role }) => role), [
    'governing-specification',
    'identity-fixture',
    'semantic-normalizer',
    'structural-schema',
  ]);
});

await runCase('proposal-metadata-closed', () => {
  assert(inspected.contractSet.contracts.every(({ status, specificationIdentity }) => status === 'Proposal' && specificationIdentity.endsWith('-draft')));
});

await runCase('exact-989-requirements', () => {
  assert.equal(inspected.requirements.length, 989);
  assert.equal(new Set(inspected.requirements.map(({ id }) => id)).size, 989);
});

await runCase('requirement-prefix-closure', () => {
  const contractById = new Map(inspected.contractSet.contracts.map((contract) => [contract.id, contract]));
  assert(inspected.requirements.every((requirement) => requirement.id.startsWith(contractById.get(requirement.contract).requirementPrefix)));
});

await runCase('coverage-owner-route-closure', () => {
  assert(inspected.requirements.every(({ primaryOwner, plannedLeaf }) => primaryOwner.length > 0 && /^IR-[A-Z-]+-01$/.test(plannedLeaf)));
});

await runCase('coverage-honestly-pending', () => {
  assert(inspected.requirements.every(({ currentDisposition, completionStatus }) => currentDisposition === 'pending-owner-classification' && completionStatus === 'pending'));
});

await runCase('catalog-identity-content-sensitive', () => {
  const mutated = clone(contractSetInput);
  mutated.contracts[0].semanticOwner = `${mutated.contracts[0].semanticOwner} changed`;
  assert.notDeepEqual(canonicalIdentity(normalizeContractSet(mutated)), inspected.identities.contractSet);
});

await runCase('schema-identities-closed', () => {
  assert.equal(contractSetSchema.properties.schema.const, contractSetInput.schema);
  assert.equal(coverageSchema.properties.schema.const, coverageInput.schema);
  assert.equal(contractSetSchema.additionalProperties, false);
  assert.equal(coverageSchema.additionalProperties, false);
});

await runCase('reject-catalog-unknown-field', () => {
  const mutated = clone(contractSetInput);
  mutated.targetPlatform = process.platform;
  assert.throws(() => normalizeContractSet(mutated), { code: 'CATALOG_ROOT_FIELDS' });
});

await runCase('reject-duplicate-contract', () => {
  const mutated = clone(contractSetInput);
  mutated.contracts[1] = clone(mutated.contracts[0]);
  assert.throws(() => normalizeContractSet(mutated), { code: 'CATALOG_CONTRACT_DUPLICATE' });
});

await runCase('reject-source-digest-drift', async () => {
  const mutated = clone(contractSetInput);
  mutated.contracts[0].sha256 = '0'.repeat(64);
  await assert.rejects(() => inspectCatalog(repositoryRoot, mutated, coverageInput), { code: 'CATALOG_SOURCE_DRIFT' });
});

await runCase('reject-metadata-drift', async () => {
  const mutated = clone(contractSetInput);
  mutated.contracts[0].draftVersion = '9.9.9';
  mutated.contracts[0].specificationIdentity = 'CUDA-MCGS-SPEC-0000@9.9.9-draft';
  await assert.rejects(() => inspectCatalog(repositoryRoot, mutated, coverageInput), { code: 'CATALOG_METADATA_DRIFT' });
});

await runCase('reject-coverage-omission', () => {
  const mutated = clone(coverageInput);
  mutated.contracts.pop();
  assert.throws(() => normalizeRequirementCoverage(mutated), { code: 'COVERAGE_CONTRACT_COUNT' });
});

await runCase('reject-coverage-unknown-field', () => {
  const mutated = clone(coverageInput);
  mutated.contracts[0].evidence = 'pass';
  assert.throws(() => normalizeRequirementCoverage(mutated), { code: 'COVERAGE_ENTRY_FIELDS' });
});

await runCase('reject-premature-coverage-completion', () => {
  const mutated = clone(coverageInput);
  mutated.contracts[0].currentDisposition = 'structural-schema';
  mutated.contracts[0].completionStatus = 'complete';
  assert.throws(() => normalizeRequirementCoverage(mutated), { code: 'COVERAGE_PREMATURE_COMPLETION' });
});

const failed = cases.filter(({ status }) => status === 'fail');
const summary = {
  expected: 20,
  discovered: cases.length,
  executed: cases.length,
  passed: cases.length - failed.length,
  failed: failed.length,
  requiredSkipped: 0,
  conditionalSkipped: 0,
  optionalSkipped: 0,
  notDiscovered: 20 - cases.length,
};
assert.equal(cases.length, summary.expected, `Expected ${summary.expected} cases, discovered ${cases.length}`);

const sourcePaths = [
  'schemas/search-ir/0.2.0/contract-set.schema.json',
  'schemas/search-ir/0.2.0/contract-set.json',
  'schemas/search-ir/0.2.0/requirement-coverage.schema.json',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
  'experiments/search-ir-composer-reference/src/catalog.mjs',
  'experiments/search-ir-composer-reference/run.mjs',
];
const sources = {};
for (const relative of sourcePaths) {
  sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));
}
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-search-ir-composer-reference-v0.2.0-catalog',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  authorityBaseline: contractSetInput.authorityBaseline,
  identities: inspected?.identities ?? null,
  contractSummaries: inspected?.contractSummaries ?? [],
  coverage: { classified: 0, pending: inspected?.requirements.length ?? 989 },
  sources,
  summary,
  cases,
  claimLimits: [
    'Proposal contract catalog, source-drift detection, owner routing and coverage skeleton only.',
    'All 989 requirements remain pending owner-leaf evidence classification.',
    'No owner profile schema, cross-owner Composer, generated Search Program, behavioral oracle, production lowering, native CUDA or compatible-pair claim.',
  ],
};
const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
await writeFile(path.join(evidenceDirectory, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=${summary.notDiscovered}`);
console.log(`contracts=${inspected?.contractSummaries.length ?? 0} requirements=${inspected?.requirements.length ?? 0} classified=0 pending=${inspected?.requirements.length ?? 989}`);
console.log(`contract_set_sha256=${inspected?.identities.contractSet.sha256 ?? 'unavailable'} coverage_sha256=${inspected?.identities.coverage.sha256 ?? 'unavailable'} expanded_requirements_sha256=${inspected?.identities.expandedRequirements.sha256 ?? 'unavailable'}`);
if (failed.length > 0) process.exit(1);

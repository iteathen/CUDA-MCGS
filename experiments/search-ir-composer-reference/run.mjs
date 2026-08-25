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
import { normalizeDecimalUint, normalizeFrameworkSelection } from './src/foundation.mjs';

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
const primitivesSchema = await readJson(path.join(schemaRoot, 'primitives.schema.json'));
const frameworkSelectionSchema = await readJson(path.join(schemaRoot, 'framework-selection.schema.json'));
const frameworkSelectionInput = await readJson(path.join(experimentRoot, 'fixtures', 'minimal.framework-selection.json'));

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
  assert.deepEqual(normalized.totals, { contracts: 12, requirements: 989, classified: 80, pending: 909 });
});

await runCase('canonical-order-independent', () => {
  const reorderedCatalog = clone(contractSetInput);
  reorderedCatalog.contracts.reverse();
  reorderedCatalog.foundation.artifacts.reverse();
  const reorderedCoverage = clone(coverageInput);
  reorderedCoverage.contracts.reverse();
  reorderedCoverage.classifications.reverse();
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

await runCase('coverage-honest-classification-progress', () => {
  assert.equal(inspected.requirements.filter(({ classificationStatus }) => classificationStatus === 'classified').length, 80);
  assert.equal(inspected.requirements.filter(({ classificationStatus }) => classificationStatus === 'pending').length, 909);
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0000').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
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

await runCase('reject-invalid-source-utf8', () => {
  assert.throws(() => sourceTextSha256(Buffer.from([0xff])), { code: 'SOURCE_UTF8' });
});

await runCase('reject-coverage-classification-overlap', async () => {
  const mutated = clone(coverageInput);
  const overlap = clone(mutated.classifications[0]);
  overlap.requirementPrefix = 'FRAMEWORK-';
  overlap.requirementCount = 80;
  mutated.classifications.push(overlap);
  await assert.rejects(() => inspectCatalog(repositoryRoot, contractSetInput, mutated), { code: 'COVERAGE_CLASSIFICATION_OVERLAP' });
});

await runCase('reject-coverage-classification-count-drift', async () => {
  const mutated = clone(coverageInput);
  mutated.classifications[0].requirementCount += 1;
  await assert.rejects(() => inspectCatalog(repositoryRoot, contractSetInput, mutated), { code: 'COVERAGE_CLASSIFICATION_COUNT' });
});

await runCase('reject-expanded-coverage-total-drift', async () => {
  const mutated = clone(coverageInput);
  mutated.totals.classified = 81;
  mutated.totals.pending = 908;
  await assert.rejects(() => inspectCatalog(repositoryRoot, contractSetInput, mutated), { code: 'COVERAGE_TOTALS' });
});

let frameworkSelection;
await runCase('normalize-framework-selection', () => {
  frameworkSelection = normalizeFrameworkSelection(frameworkSelectionInput, inspected);
  assert.equal(frameworkSelection.normalized.profiles.length, 7);
  assert.equal(frameworkSelection.normalized.bindings.length, 5);
});

await runCase('framework-selection-order-independent', () => {
  const reordered = clone(frameworkSelectionInput);
  reordered.profiles.reverse();
  reordered.dependencies.reverse();
  reordered.bindings.reverse();
  for (const binding of reordered.bindings) {
    binding.consumers.reverse();
    binding.permissions.reverse();
    binding.resourceContributions.reverse();
    binding.progressDependencies.reverse();
  }
  assert.deepEqual(normalizeFrameworkSelection(reordered, inspected).identity, frameworkSelection.identity);
});

await runCase('arbitrary-width-decimal-uint', () => {
  const boundary = '340282366920938463463374607431768211455';
  assert.equal(normalizeDecimalUint(boundary), boundary);
});

await runCase('reject-noncanonical-decimal-uint', () => {
  assert.throws(() => normalizeDecimalUint('01'), { code: 'FOUNDATION_DECIMAL_UINT' });
  assert.throws(() => normalizeDecimalUint(-1), { code: 'FOUNDATION_DECIMAL_UINT' });
});

await runCase('optional-owner-structural-absence', () => {
  assert(!frameworkSelection.normalized.profiles.some(({ role }) => ['evaluator', 'session', 'stage-extension', 'async-channel', 'product', 'capability'].includes(role)));
  assert(!JSON.stringify(frameworkSelection.normalized).includes('disabled'));
});

await runCase('namespaced-product-second-instance-and-deletion', () => {
  const selected = clone(frameworkSelectionInput);
  selected.profiles.push({
    id: 'product.synthetic',
    role: 'product',
    contract: {
      kind: 'namespaced',
      id: 'product.synthetic-contract',
      version: '0.1.0',
      schema: 'cuda-mcgs.product-contract/0.1.0',
      sha256: '2499bc8562b907a1682723e2663fa603aad11fcfeaec648c2c7cad84a5580614',
    },
    schema: {
      id: 'cuda-mcgs.product-profile/0.1.0',
      version: '0.1.0',
      sha256: '836fc2d343ae8f1a9d4700d53755cad0dac251c7179a403a6eecf9b1c9200a9f',
    },
    identity: { algorithm: 'sha256', sha256: '2499bc8562b907a1682723e2663fa603aad11fcfeaec648c2c7cad84a5580614' },
  });
  selected.dependencies.push({
    consumer: 'owner.program-package',
    provider: 'product.synthetic',
    reason: { ownerProfile: 'product.synthetic', id: 'product.program-contribution', version: '0.1.0' },
  });
  const withProduct = normalizeFrameworkSelection(selected, inspected);
  assert.notDeepEqual(withProduct.identity, frameworkSelection.identity);
  selected.profiles = selected.profiles.filter(({ id }) => id !== 'product.synthetic');
  selected.dependencies = selected.dependencies.filter(({ provider }) => provider !== 'product.synthetic');
  assert.deepEqual(normalizeFrameworkSelection(selected, inspected).identity, frameworkSelection.identity);
});

await runCase('framework-selection-identity-content-sensitive', () => {
  const mutated = clone(frameworkSelectionInput);
  mutated.profiles.find(({ role }) => role === 'domain').identity.sha256 = '0'.repeat(64);
  assert.notDeepEqual(normalizeFrameworkSelection(mutated, inspected).identity, frameworkSelection.identity);
});

await runCase('foundation-schema-identities-closed', () => {
  assert.equal(primitivesSchema.$defs.decimalUint.type, 'string');
  assert.equal(frameworkSelectionSchema.properties.schema.const, frameworkSelectionInput.schema);
  assert.equal(frameworkSelectionSchema.additionalProperties, false);
});

await runCase('reject-framework-selection-unknown-field', () => {
  const mutated = clone(frameworkSelectionInput);
  mutated.cudaDevice = 0;
  assert.throws(() => normalizeFrameworkSelection(mutated, inspected), { code: 'FOUNDATION_ROOT_FIELDS' });
});

await runCase('reject-duplicate-profile', () => {
  const mutated = clone(frameworkSelectionInput);
  mutated.profiles.push(clone(mutated.profiles[0]));
  assert.throws(() => normalizeFrameworkSelection(mutated, inspected), { code: 'FOUNDATION_PROFILE_DUPLICATE' });
});

await runCase('reject-duplicate-singleton-role', () => {
  const mutated = clone(frameworkSelectionInput);
  const duplicate = clone(mutated.profiles.find(({ role }) => role === 'domain'));
  duplicate.id = 'owner.domain-two';
  mutated.profiles.push(duplicate);
  assert.throws(() => normalizeFrameworkSelection(mutated, inspected), { code: 'FOUNDATION_ROLE_DUPLICATE' });
});

await runCase('reject-missing-mandatory-role', () => {
  const mutated = clone(frameworkSelectionInput);
  mutated.profiles = mutated.profiles.filter(({ role }) => role !== 'output');
  mutated.dependencies = mutated.dependencies.filter(({ consumer, provider }) => consumer !== 'owner.output' && provider !== 'owner.output');
  mutated.bindings = mutated.bindings.filter(({ consumers }) => !consumers.some(({ ownerProfile }) => ownerProfile === 'owner.output'));
  assert.throws(() => normalizeFrameworkSelection(mutated, inspected), { code: 'FOUNDATION_REQUIRED_ROLE' });
});

await runCase('reject-role-contract-mismatch', () => {
  const mutated = clone(frameworkSelectionInput);
  const domain = mutated.profiles.find(({ role }) => role === 'domain');
  const graph = mutated.profiles.find(({ role }) => role === 'graph');
  domain.contract = clone(graph.contract);
  assert.throws(() => normalizeFrameworkSelection(mutated, inspected), { code: 'FOUNDATION_ROLE_CONTRACT' });
});

await runCase('reject-profile-contract-digest-drift', () => {
  const mutated = clone(frameworkSelectionInput);
  mutated.profiles[0].contract.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeFrameworkSelection(mutated, inspected), { code: 'FOUNDATION_CONTRACT_DRIFT' });
});

await runCase('reject-namespaced-core-contract', () => {
  const mutated = clone(frameworkSelectionInput);
  mutated.profiles.find(({ role }) => role === 'domain').contract = {
    kind: 'namespaced',
    id: 'external.domain',
    version: '0.1.0',
    schema: 'external.domain-contract/0.1.0',
    sha256: '0'.repeat(64),
  };
  assert.throws(() => normalizeFrameworkSelection(mutated, inspected), { code: 'FOUNDATION_CONTRACT_KIND' });
});

await runCase('reject-dependency-unknown-profile', () => {
  const mutated = clone(frameworkSelectionInput);
  mutated.dependencies[0].provider = 'owner.ghost';
  assert.throws(() => normalizeFrameworkSelection(mutated, inspected), { code: 'FOUNDATION_DEPENDENCY_PROFILE' });
});

await runCase('reject-dependency-cycle', () => {
  const mutated = clone(frameworkSelectionInput);
  mutated.dependencies.push({
    consumer: 'owner.domain',
    provider: 'owner.graph',
    reason: { ownerProfile: 'owner.graph', id: 'graph.invalid-reverse-authority', version: '0.1.0' },
  });
  assert.throws(() => normalizeFrameworkSelection(mutated, inspected), { code: 'FOUNDATION_DEPENDENCY_CYCLE' });
});

await runCase('reject-duplicate-dependency', () => {
  const mutated = clone(frameworkSelectionInput);
  mutated.dependencies.push(clone(mutated.dependencies[0]));
  assert.throws(() => normalizeFrameworkSelection(mutated, inspected), { code: 'FOUNDATION_DEPENDENCY_DUPLICATE' });
});

await runCase('reject-binding-unknown-producer', () => {
  const mutated = clone(frameworkSelectionInput);
  mutated.bindings[0].producer.ownerProfile = 'owner.ghost';
  assert.throws(() => normalizeFrameworkSelection(mutated, inspected), { code: 'FOUNDATION_REFERENCE_OWNER' });
});

await runCase('reject-binding-without-dependency', () => {
  const mutated = clone(frameworkSelectionInput);
  mutated.bindings.find(({ id }) => id === 'binding.graph-ready-facts').consumers = [
    { ownerProfile: 'owner.domain', id: 'domain.invalid-graph-consumer', version: '0.1.0' },
  ];
  assert.throws(() => normalizeFrameworkSelection(mutated, inspected), { code: 'FOUNDATION_BINDING_DEPENDENCY' });
});

await runCase('reject-binding-duplicate-consumer', () => {
  const mutated = clone(frameworkSelectionInput);
  mutated.bindings[0].consumers.push(clone(mutated.bindings[0].consumers[0]));
  assert.throws(() => normalizeFrameworkSelection(mutated, inspected), { code: 'FOUNDATION_BINDING_CONSUMERS' });
});

await runCase('reject-binding-unknown-permission-owner', () => {
  const mutated = clone(frameworkSelectionInput);
  mutated.bindings[0].permissions[0].ownerProfile = 'owner.ghost';
  assert.throws(() => normalizeFrameworkSelection(mutated, inspected), { code: 'FOUNDATION_REFERENCE_OWNER' });
});

const failed = cases.filter(({ status }) => status === 'fail');
const summary = {
  expected: 46,
  discovered: cases.length,
  executed: cases.length,
  passed: cases.length - failed.length,
  failed: failed.length,
  requiredSkipped: 0,
  conditionalSkipped: 0,
  optionalSkipped: 0,
  notDiscovered: 46 - cases.length,
};
assert.equal(cases.length, summary.expected, `Expected ${summary.expected} cases, discovered ${cases.length}`);

const sourcePaths = [
  'schemas/search-ir/0.2.0/contract-set.schema.json',
  'schemas/search-ir/0.2.0/contract-set.json',
  'schemas/search-ir/0.2.0/requirement-coverage.schema.json',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
  'schemas/search-ir/0.2.0/primitives.schema.json',
  'schemas/search-ir/0.2.0/framework-selection.schema.json',
  'experiments/search-ir-composer-reference/fixtures/minimal.framework-selection.json',
  'experiments/search-ir-composer-reference/src/catalog.mjs',
  'experiments/search-ir-composer-reference/src/validation.mjs',
  'experiments/search-ir-composer-reference/src/foundation.mjs',
  'experiments/search-ir-composer-reference/run.mjs',
];
const sources = {};
for (const relative of sourcePaths) {
  sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));
}
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs-search-ir-composer-reference-v0.2.0',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release() },
  authorityBaseline: contractSetInput.authorityBaseline,
  identities: inspected?.identities ?? null,
  frameworkSelectionIdentity: frameworkSelection?.identity ?? null,
  contractSummaries: inspected?.contractSummaries ?? [],
  coverage: {
    classified: inspected?.requirements.filter(({ classificationStatus }) => classificationStatus === 'classified').length ?? 0,
    pending: inspected?.requirements.filter(({ classificationStatus }) => classificationStatus === 'pending').length ?? 989,
  },
  sources,
  summary,
  cases,
  claimLimits: [
    'Proposal contract catalog plus shared representation primitives and framework selection/binding normalization only.',
    'The 80 framework requirements have final evidence lanes but remain partial, pending or deferred; 909 requirements remain pending owner classification.',
    'No semantic-owner profile body, derived plan, cross-owner Composer, generated Search Program, behavioral oracle, production lowering, native CUDA or compatible-pair claim.',
  ],
};
const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
await writeFile(path.join(evidenceDirectory, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=${summary.notDiscovered}`);
console.log(`contracts=${inspected?.contractSummaries.length ?? 0} requirements=${inspected?.requirements.length ?? 0} classified=${evidence.coverage.classified} pending=${evidence.coverage.pending}`);
console.log(`contract_set_sha256=${inspected?.identities.contractSet.sha256 ?? 'unavailable'} coverage_sha256=${inspected?.identities.coverage.sha256 ?? 'unavailable'} expanded_requirements_sha256=${inspected?.identities.expandedRequirements.sha256 ?? 'unavailable'}`);
console.log(`framework_selection_sha256=${frameworkSelection?.identity.sha256 ?? 'unavailable'} canonical_bytes=${frameworkSelection?.identity.byteLength ?? 0}`);
if (failed.length > 0) process.exit(1);

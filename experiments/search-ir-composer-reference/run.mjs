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
import { normalizeDomainProfile } from './src/domain.mjs';
import {
  buildDomainProfiles,
  syntheticContentIdentity,
  syntheticSchemaReference,
} from './src/domain-fixtures.mjs';
import { normalizeGraphProfile } from './src/graph.mjs';
import {
  buildGraphProfiles,
  graphSyntheticContentIdentity,
  graphSyntheticProfileReference,
  graphSyntheticSchemaReference,
} from './src/graph-fixtures.mjs';
import { normalizePolicyProfile } from './src/policy.mjs';
import {
  buildPolicyProfiles,
  policySyntheticContentIdentity,
  policySyntheticSchemaReference,
} from './src/policy-fixtures.mjs';
import { normalizeEvaluatorProfile } from './src/evaluator.mjs';
import {
  buildEvaluatorProfiles,
  evaluatorSyntheticContentIdentity,
  evaluatorSyntheticSchemaReference,
} from './src/evaluator-fixtures.mjs';
import { normalizeResourceProfile } from './src/resource.mjs';
import {
  buildResourceProfiles,
  resourceSyntheticContentIdentity,
  resourceSyntheticSchemaReference,
} from './src/resource-fixtures.mjs';
import { normalizeProgressProfile } from './src/progress.mjs';
import {
  buildProgressProfiles,
  progressSyntheticContentIdentity,
  progressSyntheticSchemaReference,
} from './src/progress-fixtures.mjs';

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
const domainProfileSchema = await readJson(path.join(schemaRoot, 'domain-profile.schema.json'));
const graphProfileSchema = await readJson(path.join(schemaRoot, 'graph-profile.schema.json'));
const policyProfileSchema = await readJson(path.join(schemaRoot, 'policy-profile.schema.json'));
const evaluatorProfileSchema = await readJson(path.join(schemaRoot, 'evaluator-profile.schema.json'));
const resourceProfileSchema = await readJson(path.join(schemaRoot, 'resource-profile.schema.json'));
const progressProfileSchema = await readJson(path.join(schemaRoot, 'progress-profile.schema.json'));
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
  assert.deepEqual(normalized.totals, { contracts: 12, requirements: 989, classified: 594, pending: 395 });
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
  assert.equal(inspected.requirements.filter(({ classificationStatus }) => classificationStatus === 'classified').length, 594);
  assert.equal(inspected.requirements.filter(({ classificationStatus }) => classificationStatus === 'pending').length, 395);
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0000').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0007').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0008').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0009').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0010').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0011').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0012').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
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
  mutated.totals.classified = 595;
  mutated.totals.pending = 394;
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

let domainProfileInputs;
let domainProfiles;
await runCase('normalize-domain-profiles', () => {
  domainProfileInputs = buildDomainProfiles(inspected);
  domainProfiles = domainProfileInputs.map((profile) => normalizeDomainProfile(profile, inspected));
  assert.deepEqual(domainProfiles.map(({ normalized }) => normalized.id), [
    'domain.synthetic-transposing',
    'domain.synthetic-stochastic-history',
    'domain.synthetic-lazy-continuous',
  ]);
});

await runCase('domain-profile-second-instances-distinct', () => {
  assert.equal(new Set(domainProfiles.map(({ identity }) => identity.sha256)).size, 3);
  assert.deepEqual(domainProfiles.map(({ normalized }) => normalized.history.disposition), ['embedded', 'carried', 'none']);
  assert(domainProfiles.some(({ normalized }) => normalized.roles.some(({ category }) => category === 'custom')));
  assert(domainProfiles.some(({ normalized }) => normalized.transitionModes.some(({ kind }) => kind === 'observation-bearing')));
  assert(domainProfiles.some(({ normalized }) => normalized.actionSources.some(({ kind }) => kind === 'admitted-proposal')));
});

await runCase('domain-terminal-only-profile', () => {
  const terminalOnly = clone(domainProfileInputs[0]);
  terminalOnly.id = 'domain.synthetic-terminal-only';
  terminalOnly.roles = terminalOnly.roles.filter(({ terminal }) => terminal);
  terminalOnly.actionSources = [];
  terminalOnly.transitionModes = [];
  terminalOnly.ports = terminalOnly.ports.filter(({ id }) => id !== 'produce-actions');
  const normalized = normalizeDomainProfile(terminalOnly, inspected).normalized;
  assert.equal(normalized.roles.length, 1);
  assert.equal(normalized.actionSources.length, 0);
  assert.equal(normalized.transitionModes.length, 0);
});

await runCase('domain-profile-order-independent', () => {
  const reordered = clone(domainProfileInputs[1]);
  for (const key of ['valueSchemas', 'rootForms', 'roles', 'actionSources', 'transitionModes', 'ports', 'resources', 'failures', 'productData']) reordered[key].reverse();
  reordered.identity.behaviorFacts.reverse();
  reordered.history.reuse.reverse();
  reordered.programContribution.inputs.reverse();
  for (const value of reordered.valueSchemas) value.memorySpaces.reverse();
  for (const role of reordered.roles) {
    if (!role.terminal) {
      role.actionSources.reverse();
      role.successorRoles.reverse();
    }
  }
  for (const source of reordered.actionSources) if (source.kind === 'combined' && source.ordering === 'non-semantic') source.members.reverse();
  for (const mode of reordered.transitionModes) mode.numericRules.reverse();
  for (const portInput of reordered.ports) {
    portInput.inputs.reverse();
    portInput.outputs.reverse();
    portInput.failures.reverse();
  }
  for (const resource of reordered.resources) resource.memorySpaces.reverse();
  assert.deepEqual(normalizeDomainProfile(reordered, inspected).identity, domainProfiles[1].identity);
});

await runCase('domain-arbitrary-width-bounds', () => {
  const mutated = clone(domainProfileInputs[2]);
  const boundary = '340282366920938463463374607431768211455';
  mutated.valueSchemas.find(({ semanticRole }) => semanticRole === 'action').maxEncodedBytes = boundary;
  mutated.resources.find(({ id }) => id.endsWith('resource-action-output')).maximum = boundary;
  const normalized = normalizeDomainProfile(mutated, inspected).normalized;
  assert.equal(normalized.valueSchemas.find(({ semanticRole }) => semanticRole === 'action').maxEncodedBytes, boundary);
  assert.equal(normalized.resources.find(({ id }) => id.endsWith('resource-action-output')).maximum, boundary);
});

await runCase('domain-product-data-deletion', () => {
  const selected = clone(domainProfileInputs[0]);
  selected.productData.push({
    ownerContract: {
      kind: 'namespaced',
      id: 'product.synthetic-domain-option',
      version: '0.1.0',
      schema: 'cuda-mcgs.synthetic-domain-option-contract/0.1.0',
      sha256: syntheticContentIdentity('product-contract').sha256,
    },
    schema: syntheticSchemaReference('cuda-mcgs.synthetic-domain-option'),
    identity: syntheticContentIdentity('product-domain-option'),
  });
  const withProduct = normalizeDomainProfile(selected, inspected);
  assert.notDeepEqual(withProduct.identity, domainProfiles[0].identity);
  selected.productData = [];
  assert.deepEqual(normalizeDomainProfile(selected, inspected).identity, domainProfiles[0].identity);
});

await runCase('domain-identity-content-sensitive', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.identity.behaviorFacts[0] = 'domain.synthetic-transposing.fact-different';
  assert.notDeepEqual(normalizeDomainProfile(mutated, inspected).identity, domainProfiles[0].identity);
});

await runCase('domain-schema-closed', () => {
  assert.equal(domainProfileSchema.properties.schema.const, 'cuda-mcgs.domain-profile/0.2.0');
  assert.equal(domainProfileSchema.additionalProperties, false);
  assert.equal(domainProfileSchema.$defs.valueSchema.additionalProperties, false);
});

await runCase('domain-framework-selection-link', async () => {
  const selected = frameworkSelection.normalized.profiles.find(({ role }) => role === 'domain');
  assert.equal(selected.schema.id, domainProfileInputs[0].schema);
  assert.equal(selected.schema.sha256, sourceTextSha256(await readFile(path.join(schemaRoot, 'domain-profile.schema.json'))));
  assert.equal(selected.identity.sha256, domainProfiles[0].identity.sha256);
});

await runCase('reject-domain-unknown-field', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.graphLayout = 'dense-tree';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_ROOT_FIELDS' });
});

await runCase('reject-domain-contract-drift', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.contract.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_CONTRACT_DRIFT' });
});

await runCase('reject-domain-missing-value-role', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.valueSchemas.pop();
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_VALUE_COUNT' });
});

await runCase('reject-domain-duplicate-value-role', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.valueSchemas[1].semanticRole = mutated.valueSchemas[0].semanticRole;
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_VALUE_ROLE_DUPLICATE' });
});

await runCase('reject-domain-unit-bound-mismatch', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.valueSchemas.find(({ semanticRole }) => semanticRole === 'history').maxEncodedBytes = '1';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_VALUE_UNIT' });
});

await runCase('reject-domain-identity-key-role', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.identity.keyValue = mutated.valueSchemas.find(({ semanticRole }) => semanticRole === 'action-key').id;
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_IDENTITY_KEY' });
});

await runCase('reject-domain-transferable-action-without-contract', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.identity.actionScope = { kind: 'profile-transferable' };
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_ACTION_SCOPE_FIELDS' });
});

await runCase('reject-domain-history-participation', () => {
  const mutated = clone(domainProfileInputs[1]);
  mutated.history.identityParticipation = 'none';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_HISTORY_IDENTITY' });
});

await runCase('reject-domain-history-unbounded', () => {
  const mutated = clone(domainProfileInputs[1]);
  mutated.history.finiteRule = { kind: 'none' };
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_HISTORY_BOUNDED' });
});

await runCase('reject-domain-root-value-role', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.rootForms[0].valueSchema = mutated.valueSchemas.find(({ semanticRole }) => semanticRole === 'state').id;
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_ROOT_VALUE' });
});

await runCase('reject-domain-source-completion', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.actionSources[0].completion = 'complete';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_SOURCE_COMPLETION' });
});

await runCase('reject-domain-source-hidden-randomness', () => {
  const mutated = clone(domainProfileInputs[1]);
  const sampled = mutated.actionSources.find(({ mode }) => mode === 'sampled');
  sampled.randomness = { kind: 'none', maxInputs: '0' };
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_SOURCE_RANDOMNESS' });
});

await runCase('reject-domain-admitted-contract-drift', () => {
  const mutated = clone(domainProfileInputs[1]);
  mutated.actionSources.find(({ kind }) => kind === 'admitted-proposal').producerContract.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_EXTERNAL_CONTRACT_DRIFT' });
});

await runCase('reject-domain-combined-member', () => {
  const mutated = clone(domainProfileInputs[1]);
  mutated.actionSources.find(({ kind }) => kind === 'combined').members[0] = 'domain.unknown-source';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_SOURCE_MEMBER' });
});

await runCase('reject-domain-combined-cycle', () => {
  const mutated = clone(domainProfileInputs[1]);
  const combined = mutated.actionSources.find(({ kind }) => kind === 'combined');
  combined.members[0] = combined.id;
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_SOURCE_CYCLE' });
});

await runCase('reject-domain-combined-deduplication-multiplicity', () => {
  const mutated = clone(domainProfileInputs[1]);
  mutated.actionSources.find(({ kind }) => kind === 'combined').deduplication = 'domain-equality';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_SOURCE_DEDUP' });
});

await runCase('reject-domain-role-source', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.roles.find(({ terminal }) => !terminal).actionSources[0] = 'domain.unknown-source';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_ROLE_SOURCE' });
});

await runCase('reject-domain-role-successor', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.roles.find(({ terminal }) => !terminal).successorRoles[0] = 'domain.unknown-role';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_ROLE_SUCCESSOR' });
});

await runCase('reject-domain-unused-source', () => {
  const mutated = clone(domainProfileInputs[0]);
  const unused = clone(mutated.actionSources[0]);
  unused.id = 'domain.synthetic-transposing.source-unused';
  mutated.actionSources.push(unused);
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_SOURCE_UNUSED' });
});

await runCase('reject-domain-unused-transition', () => {
  const mutated = clone(domainProfileInputs[0]);
  const unused = clone(mutated.transitionModes[0]);
  unused.id = 'domain.synthetic-transposing.transition-unused';
  mutated.transitionModes.push(unused);
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_TRANSITION_UNUSED' });
});

await runCase('reject-domain-required-failure', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.failures = mutated.failures.filter(({ code }) => code !== 'invalid-root');
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_FAILURE_REQUIRED' });
});

await runCase('reject-domain-required-port', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.ports = mutated.ports.filter(({ id }) => id !== 'validate-root');
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_PORT_REQUIRED' });
});

await runCase('reject-domain-advance-history-presence', () => {
  const mutated = clone(domainProfileInputs[0]);
  const extra = clone(mutated.ports.find(({ id }) => id === 'produce-actions'));
  extra.id = 'advance-history';
  extra.contract = syntheticSchemaReference('cuda-mcgs.synthetic-invalid-advance-history');
  mutated.ports.push(extra);
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_PORT_HISTORY' });
});

await runCase('reject-domain-produce-actions-presence', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.ports = mutated.ports.filter(({ id }) => id !== 'produce-actions');
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_PORT_ACTION_SOURCE' });
});

await runCase('reject-domain-port-value', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.ports[0].inputs[0] = 'domain.unknown-value';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_PORT_VALUE' });
});

await runCase('reject-domain-port-failure', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.ports[0].failures[0] = 'domain.unknown-failure';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_PORT_FAILURE' });
});

await runCase('reject-domain-cancellation-bound', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.ports[0].bounds.maxWorkUnits = '1';
  mutated.ports[0].bounds.cancellationObservationWorkUnits = '2';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_BOUNDS_CANCELLATION' });
});

await runCase('reject-domain-transition-random-bound', () => {
  const mutated = clone(domainProfileInputs[1]);
  mutated.ports.find(({ id }) => id === 'apply-transition').bounds.maxRandomInputs = '3';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_PORT_RANDOM_BOUND' });
});

await runCase('reject-domain-source-port-random-bound', () => {
  const mutated = clone(domainProfileInputs[1]);
  mutated.ports.find(({ id }) => id === 'produce-actions').bounds.maxRandomInputs = '3';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_PORT_RANDOM_BOUND' });
});

await runCase('reject-domain-resource-range', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.resources[0].minimum = '65';
  mutated.resources[0].maximum = '64';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_RESOURCE_RANGE' });
});

await runCase('reject-domain-persistence-scope', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.identity.scope = 'persistence-namespace';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_PERSISTENCE_SCOPE' });
});

await runCase('reject-domain-native-program-language', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.programContribution.language = 'cuda-cpp';
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_PROGRAM_LANGUAGE' });
});

await runCase('reject-domain-product-owner', () => {
  const mutated = clone(domainProfileInputs[0]);
  mutated.productData.push({
    ownerContract: clone(mutated.contract),
    schema: syntheticSchemaReference('cuda-mcgs.synthetic-invalid-product'),
    identity: syntheticContentIdentity('invalid-product'),
  });
  assert.throws(() => normalizeDomainProfile(mutated, inspected), { code: 'DOMAIN_PRODUCT_OWNER' });
});

let graphFixtures;
let graphProfileInputs;
let graphProfiles;
let graphSchemaSha;
let domainSchemaSha;
await runCase('normalize-graph-profiles', async () => {
  graphSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'graph-profile.schema.json')));
  domainSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'domain-profile.schema.json')));
  graphFixtures = buildGraphProfiles(inspected, domainProfiles, domainSchemaSha);
  graphProfileInputs = graphFixtures.map(({ input }) => input);
  graphProfiles = graphFixtures.map(({ input, domain }) => normalizeGraphProfile(input, inspected, domain));
  assert.deepEqual(graphProfiles.map(({ normalized }) => normalized.id), [
    'graph.synthetic-transposing',
    'graph.synthetic-reclaiming',
    'graph.synthetic-isolated',
    'graph.synthetic-stateless',
  ]);
});

await runCase('graph-profile-second-instances-distinct', () => {
  assert.equal(new Set(graphProfiles.map(({ identity }) => identity.sha256)).size, 4);
  assert.deepEqual(graphProfiles.map(({ normalized }) => normalized.transposition.kind), ['verified-sharing', 'verified-sharing', 'isolated-nodes', 'none']);
  assert.deepEqual(graphProfiles.map(({ normalized }) => normalized.reclamation.kind), ['none', 'enabled', 'none', 'none']);
  assert(!graphProfiles[2].normalized.resources.some(({ pressureOutcome }) => pressureOutcome.startsWith('transposition-')));
});

await runCase('graph-profile-order-independent', () => {
  const reordered = clone(graphProfileInputs[1]);
  for (const key of ['objectKinds', 'layouts', 'ownerRegions', 'publications', 'ports', 'resources', 'failures']) reordered[key].reverse();
  reordered.reclamation.protectionSources.reverse();
  reordered.programContribution.inputs.reverse();
  for (const object of reordered.objectKinds) {
    object.lifecycle.states.reverse();
    object.lifecycle.transitions.reverse();
    object.lifecycle.readyStates.reverse();
    object.lifecycle.terminalStates.reverse();
  }
  for (const region of reordered.ownerRegions) region.permissions.reverse();
  for (const publication of reordered.publications) {
    publication.consumers.reverse();
    publication.terminalStates.reverse();
  }
  for (const portInput of reordered.ports) {
    portInput.objectKinds.reverse();
    portInput.failures.reverse();
  }
  assert.deepEqual(normalizeGraphProfile(reordered, inspected, graphFixtures[1].domain).identity, graphProfiles[1].identity);
});

await runCase('graph-arbitrary-width-ranges', () => {
  const mutated = clone(graphProfileInputs[0]);
  const boundary = '340282366920938463463374607431768211455';
  mutated.arena.maxIncarnations = boundary;
  mutated.referenceEncoding.arenaRange = boundary;
  mutated.referenceEncoding.slotRange = boundary;
  const expansionObject = mutated.objectKinds.find(({ role }) => role === 'expansion').id;
  const expansionLayout = mutated.layouts.find(({ objectKind }) => objectKind === expansionObject);
  expansionLayout.capacity = boundary;
  expansionLayout.identifierRange = boundary;
  expansionLayout.bytePool = '21778071482940061661655974875633165533120';
  expansionLayout.offsetRange = expansionLayout.bytePool;
  mutated.resources[0].maximum = boundary;
  const normalized = normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain).normalized;
  assert.equal(normalized.referenceEncoding.slotRange, boundary);
  assert.equal(normalized.layouts.find(({ objectKind }) => objectKind === expansionObject).capacity, boundary);
  assert.equal(normalized.resources.find(({ id }) => id === mutated.resources[0].id).maximum, boundary);
});

await runCase('graph-stateless-zero-residue', () => {
  const normalized = graphProfiles[3].normalized;
  for (const field of ['objectKinds', 'layouts', 'ownerRegions', 'publications', 'ports', 'resources', 'failures']) assert.equal(normalized[field].length, 0);
  assert.equal(normalized.programContribution.kind, 'none');
  assert.deepEqual(normalized.diagnostics, { authority: 'non-authoritative', maxRecords: '0', maxBytes: '0', overflow: 'drop', rawAddresses: false });
});

await runCase('graph-no-reclamation-zero-residue', () => {
  const normalized = graphProfiles[0].normalized;
  assert.equal(normalized.reclamation.kind, 'none');
  assert(!normalized.objectKinds.some(({ role }) => role === 'retirement-record'));
  assert(!normalized.ports.some(({ id }) => ['retire', 'prove-quiescent', 'reclaim'].includes(id)));
  assert(!normalized.resources.some(({ id }) => id.includes('reclaim')));
  assert(!normalized.objectKinds.some(({ lifecycle }) => lifecycle.states.some((stateName) => /-(?:retiring|reclaimable)$/.test(stateName))));
});

await runCase('graph-owner-region-product-deletion', () => {
  const selected = clone(graphProfileInputs[0]);
  const product = clone(selected.ownerRegions.find(({ semanticRole }) => semanticRole === 'domain-state'));
  product.id = 'graph.synthetic-transposing.region-product-option';
  product.semanticRole = 'product-record';
  product.ownerContract = {
    kind: 'namespaced', id: 'product.synthetic-graph-option', version: '0.1.0',
    schema: 'cuda-mcgs.synthetic-graph-option-contract/0.1.0', sha256: graphSyntheticContentIdentity('product-contract').sha256,
  };
  product.ownerProfile = graphSyntheticProfileReference('product.synthetic-graph-option');
  product.layout = graphSyntheticSchemaReference('cuda-mcgs.synthetic-product-region-layout');
  product.lifecycle = graphSyntheticSchemaReference('cuda-mcgs.synthetic-product-region-lifecycle');
  product.offsetBytes = '288';
  product.sizeBytes = '32';
  product.permissions = ['read'];
  selected.ownerRegions.push(product);
  assert.notDeepEqual(normalizeGraphProfile(selected, inspected, graphFixtures[0].domain).identity, graphProfiles[0].identity);
  selected.ownerRegions.pop();
  product.id = 'graph.synthetic-transposing.region-capability-option';
  product.semanticRole = 'capability-record';
  product.ownerContract.id = 'capability.synthetic-graph-option';
  selected.ownerRegions.push(product);
  assert.notDeepEqual(normalizeGraphProfile(selected, inspected, graphFixtures[0].domain).identity, graphProfiles[0].identity);
  selected.ownerRegions.pop();
  assert.deepEqual(normalizeGraphProfile(selected, inspected, graphFixtures[0].domain).identity, graphProfiles[0].identity);
});

await runCase('graph-identity-content-sensitive', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.diagnostics.maxRecords = '257';
  assert.notDeepEqual(normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain).identity, graphProfiles[0].identity);
});

await runCase('graph-schema-closed', () => {
  assert.equal(graphProfileSchema.properties.schema.const, 'cuda-mcgs.graph-profile/0.2.0');
  assert.equal(graphProfileSchema.additionalProperties, false);
  assert.equal(graphProfileSchema.$defs.objectKind.additionalProperties, false);
  assert.equal(graphProfileSchema.$defs.ownerRegion.additionalProperties, false);
});

await runCase('graph-framework-selection-link', () => {
  const selected = frameworkSelection.normalized.profiles.find(({ role }) => role === 'graph');
  assert.equal(selected.schema.id, graphProfileInputs[0].schema);
  assert.equal(selected.schema.sha256, graphSchemaSha);
  assert.equal(selected.identity.sha256, graphProfiles[0].identity.sha256);
});

await runCase('reject-graph-unknown-field', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.allocator = 'native';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_ROOT_FIELDS' });
});

await runCase('reject-graph-contract-drift', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.contract.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_CONTRACT_DRIFT' });
});

await runCase('reject-graph-domain-identity-drift', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.domainProfile.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_DOMAIN_DRIFT' });
});

await runCase('reject-graph-arena-reference-range', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.arena.maxIncarnations = '18446744073709551616';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_ARENA_RANGE' });
});

await runCase('reject-graph-duplicate-object-role', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.objectKinds.find(({ role }) => role === 'expansion').role = 'state-node';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_OBJECT_ROLE_DUPLICATE' });
});

await runCase('reject-graph-lifecycle-unknown-state', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.objectKinds[0].lifecycle.transitions[0].to = 'graph.synthetic-transposing.state-ghost';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_LIFECYCLE_TRANSITION_STATE' });
});

await runCase('reject-graph-lifecycle-unreachable-terminal', () => {
  const mutated = clone(graphProfileInputs[0]);
  const lifecycle = mutated.objectKinds.find(({ role }) => role === 'state-node').lifecycle;
  const failed = lifecycle.terminalStates[0];
  lifecycle.states.push('graph.synthetic-transposing.state-orphan');
  lifecycle.transitions = lifecycle.transitions.filter(({ to }) => to !== failed);
  lifecycle.transitions.push({ from: 'graph.synthetic-transposing.state-orphan', to: failed, visibility: 'terminal-publication' });
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_LIFECYCLE_UNREACHABLE' });
});

await runCase('reject-graph-lifecycle-missing-release', () => {
  const mutated = clone(graphProfileInputs[0]);
  const lifecycle = mutated.objectKinds.find(({ role }) => role === 'state-node').lifecycle;
  lifecycle.transitions.find(({ to }) => lifecycle.readyStates.includes(to)).visibility = 'private';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_LIFECYCLE_PUBLICATION' });
});

await runCase('reject-graph-layout-object', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.layouts[0].objectKind = 'graph.synthetic-transposing.object-ghost';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_LAYOUT_OBJECT' });
});

await runCase('reject-graph-layout-alignment', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.layouts[0].recordBytes = '353';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_LAYOUT_ALIGNMENT' });
});

await runCase('reject-graph-layout-range', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.layouts[0].capacity = '18446744073709551616';
  mutated.layouts[0].bytePool = '340282366920938463463374607431768211455';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_LAYOUT_RANGE' });
  const undersized = clone(graphProfileInputs[0]);
  undersized.layouts[0].bytePool = '1';
  assert.throws(() => normalizeGraphProfile(undersized, inspected, graphFixtures[0].domain), { code: 'GRAPH_LAYOUT_POOL' });
});

await runCase('reject-graph-owner-region-overlap', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.ownerRegions[0].offsetBytes = '0';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_OWNER_REGION_OVERLAP' });
});

await runCase('reject-graph-owner-profile-drift', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.ownerRegions[0].ownerProfile.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_OWNER_REGION_DOMAIN' });
});

await runCase('reject-graph-missing-domain-region', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.ownerRegions = mutated.ownerRegions.filter(({ semanticRole }) => semanticRole !== 'domain-action');
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_OWNER_REGION_REQUIRED' });
});

await runCase('reject-graph-history-region-without-history', () => {
  const mutated = clone(graphProfileInputs[2]);
  const region = clone(mutated.ownerRegions.find(({ semanticRole }) => semanticRole === 'domain-action'));
  region.id = 'graph.synthetic-isolated.region-domain-history';
  region.semanticRole = 'domain-history';
  region.objectKind = mutated.objectKinds.find(({ role }) => role === 'path-occurrence').id;
  region.offsetBytes = '32';
  region.sizeBytes = '16';
  mutated.ownerRegions.push(region);
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[2].domain), { code: 'GRAPH_OWNER_REGION_DOMAIN' });
});

await runCase('reject-graph-transposition-object', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.transposition.entryObject = mutated.objectKinds.find(({ role }) => role === 'state-node').id;
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_TRANSPOSITION_OBJECT' });
});

await runCase('reject-graph-transposition-domain-port', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.transposition.equalStatePort = { ...mutated.transposition.equalStatePort, sha256: '0'.repeat(64) };
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_TRANSPOSITION_DOMAIN_PORT' });
});

await runCase('reject-graph-transposition-capacity', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.transposition.capacity = '8193';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_TRANSPOSITION_CAPACITY' });
});

await runCase('reject-graph-path-object', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.path.pathObject = mutated.objectKinds.find(({ role }) => role === 'state-node').id;
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_PATH_OBJECT' });
});

await runCase('reject-graph-path-domain-port', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.path.historyProjection = { ...mutated.path.historyProjection, sha256: '0'.repeat(64) };
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_PATH_DOMAIN_PORT' });
});

await runCase('reject-graph-path-capacity', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.path.maxDepth = '4097';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_PATH_CAPACITY' });
});

await runCase('reject-graph-root-reserve', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.rootProtection.admissionReserve = '9';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_ROOT_RESERVE' });
});

await runCase('reject-graph-reclamation-protection-gap', () => {
  const mutated = clone(graphProfileInputs[1]);
  mutated.reclamation.protectionSources = mutated.reclamation.protectionSources.filter((source) => source !== 'owner-lease');
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[1].domain), { code: 'GRAPH_RECLAIM_PROTECTION' });
});

await runCase('reject-graph-reclamation-generation-order', () => {
  const mutated = clone(graphProfileInputs[1]);
  mutated.reclamation.generationAdvance = 'after-slot-reuse';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[1].domain), { code: 'GRAPH_RECLAIM_KIND' });
});

await runCase('reject-graph-publication-ready-state', () => {
  const mutated = clone(graphProfileInputs[0]);
  const publication = mutated.publications[0];
  publication.readyState = mutated.objectKinds.find(({ id }) => id === publication.objectKind).lifecycle.initialState;
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_PUBLICATION_READY' });
  const omitted = clone(graphProfileInputs[0]);
  const edge = omitted.objectKinds.find(({ role }) => role === 'parent-edge');
  const finalReady = edge.lifecycle.readyStates.at(-1);
  omitted.publications = omitted.publications.filter((entry) => entry.objectKind !== edge.id || entry.readyState !== finalReady);
  assert.throws(() => normalizeGraphProfile(omitted, inspected, graphFixtures[0].domain), { code: 'GRAPH_PUBLICATION_REQUIRED' });
});

await runCase('reject-graph-publication-host-wait', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.publications[0].wait = 'host-poll';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_PUBLICATION_ORDERING' });
});

await runCase('reject-graph-required-failure', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.failures = mutated.failures.filter(({ code }) => code !== 'invalid-graph-profile');
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_FAILURE_REQUIRED' });
});

await runCase('reject-graph-required-port', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.ports = mutated.ports.filter(({ id }) => id !== 'publish-node');
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_PORT_REQUIRED' });
});

await runCase('reject-graph-no-reclamation-residue', () => {
  const mutated = clone(graphProfileInputs[0]);
  const extra = clone(mutated.ports.find(({ id }) => id === 'validate-reference'));
  extra.id = 'retire';
  mutated.ports.push(extra);
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_RECLAIM_RESIDUE' });
  const transposition = clone(graphProfileInputs[0]);
  transposition.transposition = { kind: 'none' };
  assert.throws(() => normalizeGraphProfile(transposition, inspected, graphFixtures[0].domain), { code: 'GRAPH_TRANSPOSITION_RESIDUE' });
  const pathless = clone(graphProfileInputs[0]);
  pathless.path = { kind: 'none' };
  assert.throws(() => normalizeGraphProfile(pathless, inspected, graphFixtures[0].domain), { code: 'GRAPH_PATH_RESIDUE' });
  const rootless = clone(graphProfileInputs[0]);
  rootless.rootProtection = { kind: 'none' };
  assert.throws(() => normalizeGraphProfile(rootless, inspected, graphFixtures[0].domain), { code: 'GRAPH_ROOT_RESIDUE' });
});

await runCase('reject-graph-port-object', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.ports[0].objectKinds[0] = 'graph.synthetic-transposing.object-ghost';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_PORT_OBJECT' });
});

await runCase('reject-graph-port-failure', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.ports[0].failures[0] = 'graph.unknown-failure';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_PORT_FAILURE' });
});

await runCase('reject-graph-cancellation-bound', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.ports[0].bounds.maxWorkUnits = '1';
  mutated.ports[0].bounds.cancellationObservationWorkUnits = '2';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_BOUNDS_CANCELLATION' });
});

await runCase('reject-graph-resource-range', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.resources[0].minimum = '4097';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_RESOURCE_RANGE' });
  const missing = clone(graphProfileInputs[0]);
  missing.resources = missing.resources.filter(({ pressureOutcome }) => pressureOutcome !== 'action-byte-capacity');
  assert.throws(() => normalizeGraphProfile(missing, inspected, graphFixtures[0].domain), { code: 'GRAPH_RESOURCE_REQUIRED' });
});

await runCase('reject-graph-persistence-scope', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.arena.incarnationScope = 'persistence-namespace';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_PERSISTENCE_SCOPE' });
});

await runCase('reject-graph-native-program-language', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.programContribution.language = 'cuda-cpp';
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_PROGRAM_LANGUAGE' });
});

await runCase('reject-graph-stateless-residue', () => {
  const mutated = clone(graphProfileInputs[3]);
  mutated.failures.push({ code: 'graph-internal-failure', kind: 'internal', diagnostic: true });
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[3].domain), { code: 'GRAPH_STATELESS_RESIDUE' });
});

await runCase('reject-graph-owner-contract-crossing', () => {
  const mutated = clone(graphProfileInputs[0]);
  mutated.ownerRegions[0].ownerContract = {
    kind: 'namespaced', id: 'product.invalid-owner', version: '0.1.0',
    schema: 'cuda-mcgs.invalid-owner/0.1.0', sha256: '0'.repeat(64),
  };
  assert.throws(() => normalizeGraphProfile(mutated, inspected, graphFixtures[0].domain), { code: 'GRAPH_REGION_CONTRACT_KIND' });
});

let evaluatorFixtures;
let evaluatorProfileInputs;
let evaluatorProfiles;
let evaluatorSchemaSha;
await runCase('normalize-evaluator-profiles', async () => {
  evaluatorSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'evaluator-profile.schema.json')));
  evaluatorFixtures = buildEvaluatorProfiles(inspected, domainProfiles, graphProfiles, domainSchemaSha, graphSchemaSha);
  evaluatorProfileInputs = evaluatorFixtures.map(({ input }) => input);
  evaluatorProfiles = evaluatorFixtures.map(({ input, domain, graph }) => normalizeEvaluatorProfile(input, inspected, domain, graph));
  assert.deepEqual(evaluatorProfiles.map(({ normalized }) => normalized.id), [
    'evaluator.synthetic-vector-combined',
    'evaluator.synthetic-proposal-only-stateless',
    'evaluator.synthetic-proof-evaluation-only',
    'evaluator.synthetic-analytic-evaluation-only',
    'evaluator.synthetic-batch-sensitive-resumable',
  ]);
});

let policyFixtures;
let policyProfileInputs;
let policyProfiles;
let policySchemaSha;
await runCase('normalize-policy-profiles', async () => {
  policySchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'policy-profile.schema.json')));
  policyFixtures = buildPolicyProfiles(inspected, domainProfiles, graphProfiles, domainSchemaSha, graphSchemaSha, evaluatorProfiles, evaluatorSchemaSha);
  policyProfileInputs = policyFixtures.map(({ input }) => input);
  policyProfiles = policyFixtures.map(({ input, domain, graph }) => normalizePolicyProfile(input, inspected, domain, graph));
  assert.deepEqual(policyProfiles.map(({ normalized }) => normalized.id), [
    'policy.synthetic-scalar-absent',
    'policy.synthetic-vector-combined',
    'policy.synthetic-proposal-only-stateless',
    'policy.synthetic-proof-evaluation-only',
  ]);
});

let resourceFixtures;
let resourceProfileInputs;
let resourceProfiles;
let resourceSchemaSha;
let knownResourceProfiles;
await runCase('normalize-resource-profiles', async () => {
  resourceSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'resource-profile.schema.json')));
  resourceFixtures = buildResourceProfiles(inspected, domainProfiles, graphProfiles, policyProfiles, evaluatorProfiles, {
    domain: domainSchemaSha, graph: graphSchemaSha, policy: policySchemaSha, evaluator: evaluatorSchemaSha,
  });
  resourceProfileInputs = resourceFixtures;
  knownResourceProfiles = [
    ...domainProfiles.map((result) => ({ ...result, schemaSha: domainSchemaSha })),
    ...graphProfiles.map((result) => ({ ...result, schemaSha: graphSchemaSha })),
    ...policyProfiles.map((result) => ({ ...result, schemaSha: policySchemaSha })),
    ...evaluatorProfiles.map((result) => ({ ...result, schemaSha: evaluatorSchemaSha })),
  ];
  resourceProfiles = resourceProfileInputs.map((input) => normalizeResourceProfile(input, inspected, knownResourceProfiles));
  assert.deepEqual(resourceProfiles.map(({ normalized }) => normalized.id), [
    'resource.synthetic-evaluator-absent',
    'resource.synthetic-evaluator-workspace',
    'resource.synthetic-live-session',
  ]);
});

let progressProfileInputs;
let progressProfiles;
let progressSchemaSha;
let progressResourceResults;
await runCase('normalize-progress-profiles', async () => {
  progressSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'progress-profile.schema.json')));
  progressResourceResults = resourceProfiles.map((result) => ({ ...result, schemaSha: resourceSchemaSha }));
  progressProfileInputs = buildProgressProfiles(inspected, progressResourceResults);
  progressProfiles = progressProfileInputs.map((input, index) => normalizeProgressProfile(input, inspected, progressResourceResults[index], knownResourceProfiles));
  assert.deepEqual(progressProfiles.map(({ normalized }) => normalized.id), [
    'progress.synthetic-evaluator-absent',
    'progress.synthetic-evaluator-workspace',
    'progress.synthetic-live-session',
  ]);
});

await runCase('policy-evaluator-mode-matrix', () => {
  assert.deepEqual(policyProfiles.map(({ normalized }) => normalized.evaluatorMode), ['absent', 'combined', 'proposal-only', 'evaluation-only']);
  assert.equal(policyProfiles[0].normalized.value.family, 'scalar');
  assert.equal(policyProfiles[1].normalized.value.family, 'vector');
  assert.equal(policyProfiles[2].normalized.value.kind, 'none');
  assert.equal(policyProfiles[3].normalized.value.family, 'proof-lattice');
});

await runCase('policy-profile-second-instances-distinct', () => {
  assert.equal(new Set(policyProfiles.map(({ identity }) => identity.sha256)).size, 4);
  assert.deepEqual(policyProfiles.map(({ normalized }) => normalized.backup.kind), ['transactional', 'transactional', 'none', 'transactional']);
  assert.equal(policyProfiles[1].normalized.value.coordinates.length, 3);
  assert.equal(policyProfiles[3].normalized.backup.concurrencyOrder, 'deterministic-sequence');
});

await runCase('policy-profile-order-independent', () => {
  const reordered = clone(policyProfileInputs[1]);
  for (const key of ['roleHandlers', 'records', 'reuse', 'ports', 'resources', 'statuses', 'productData']) reordered[key].reverse();
  reordered.selection.inputs.reverse();
  reordered.selection.noSelectionOutcomes.reverse();
  reordered.reservation.scopes.reverse();
  reordered.admission.sources.reverse();
  reordered.cycle.partitions.reverse();
  reordered.programContribution.inputs.reverse();
  for (const handler of reordered.roleHandlers) handler.candidateSources.reverse();
  for (const record of reordered.records) record.operations.reverse();
  for (const portInput of reordered.ports) {
    portInput.records.reverse();
    portInput.statuses.reverse();
  }
  assert.deepEqual(normalizePolicyProfile(reordered, inspected, policyFixtures[1].domain, policyFixtures[1].graph).identity, policyProfiles[1].identity);
});

await runCase('policy-arbitrary-width-bounds', () => {
  const mutated = clone(policyProfileInputs[0]);
  const boundary = '340282366920938463463374607431768211455';
  mutated.stop.budgets[0].limit = boundary;
  mutated.resources.find(({ id }) => id.endsWith('resource-record-bytes')).maximum = boundary;
  const normalized = normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph).normalized;
  assert.equal(normalized.stop.budgets[0].limit, boundary);
  assert.equal(normalized.resources.find(({ id }) => id.endsWith('resource-record-bytes')).maximum, boundary);
});

await runCase('policy-stateless-zero-residue', () => {
  const normalized = policyProfiles[2].normalized;
  assert.equal(normalized.graphProfile.mode, 'stateless');
  assert.equal(normalized.cycle.kind, 'none');
  assert.equal(normalized.backup.kind, 'none');
  assert.equal(normalized.reservation.kind, 'none');
  assert(!normalized.selection.inputs.some((entry) => ['ready-edges', 'path-facts'].includes(entry)));
  assert(!normalized.ports.some(({ id }) => ['classify-path-response', 'prepare-backup', 'apply-backup-step', 'complete-backup', 'fail-backup'].includes(id)));
});

await runCase('policy-product-data-deletion', () => {
  const selected = clone(policyProfileInputs[0]);
  selected.productData.push({
    ownerContract: {
      kind: 'namespaced', id: 'product.synthetic-policy-option', version: '0.1.0',
      schema: 'cuda-mcgs.synthetic-policy-option-contract/0.1.0', sha256: policySyntheticContentIdentity('product-contract').sha256,
    },
    schema: policySyntheticSchemaReference('cuda-mcgs.synthetic-policy-option'),
    identity: policySyntheticContentIdentity('product-policy-option'),
  });
  assert.notDeepEqual(normalizePolicyProfile(selected, inspected, policyFixtures[0].domain, policyFixtures[0].graph).identity, policyProfiles[0].identity);
  selected.productData = [];
  assert.deepEqual(normalizePolicyProfile(selected, inspected, policyFixtures[0].domain, policyFixtures[0].graph).identity, policyProfiles[0].identity);
});

await runCase('policy-identity-content-sensitive', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.selection.eligibility.sha256 = '0'.repeat(64);
  assert.notDeepEqual(normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph).identity, policyProfiles[0].identity);
});

await runCase('policy-schema-closed', () => {
  assert.equal(policyProfileSchema.properties.schema.const, 'cuda-mcgs.policy-profile/0.2.0');
  assert.equal(policyProfileSchema.additionalProperties, false);
  assert.equal(policyProfileSchema.$defs.record.additionalProperties, false);
  assert.equal(policyProfileSchema.$defs.programContribution.additionalProperties, false);
});

await runCase('policy-framework-selection-link', async () => {
  const selected = frameworkSelection.normalized.profiles.find(({ role }) => role === 'policy');
  assert.equal(selected.schema.id, policyProfileInputs[0].schema);
  assert.equal(selected.schema.sha256, policySchemaSha);
  assert.equal(selected.identity.sha256, policyProfiles[0].identity.sha256);
});

await runCase('reject-policy-unknown-field', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.uctConstant = 1.414;
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_ROOT_FIELDS' });
});

await runCase('reject-policy-contract-drift', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.contract.sha256 = '0'.repeat(64);
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_CONTRACT_DRIFT' });
});

await runCase('reject-policy-domain-identity-drift', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.domainProfile.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_DOMAIN_DRIFT' });
});

await runCase('reject-policy-domain-port-drift', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.domainProfile.classifyRolePort.sha256 = '0'.repeat(64);
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_DOMAIN_PORT_DRIFT' });
});

await runCase('reject-policy-graph-identity-drift', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.graphProfile.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_GRAPH_DRIFT' });
});

await runCase('reject-policy-graph-port-drift', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.graphProfile.reserveEdgePort.sha256 = '0'.repeat(64);
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_GRAPH_PORT_DRIFT' });
});

await runCase('reject-policy-unknown-domain-role', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.roleHandlers[0].role = 'domain.unknown-role';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_ROLE_UNKNOWN' });
});

await runCase('reject-policy-role-category-drift', () => {
  const mutated = clone(policyProfileInputs[0]);
  const handler = mutated.roleHandlers.find(({ category }) => category === 'decision');
  handler.category = 'chance';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_ROLE_CATEGORY' });
});

await runCase('reject-policy-role-coverage', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.roleHandlers.pop();
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_ROLE_COVERAGE' });
});

await runCase('reject-policy-terminal-handler', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.roleHandlers.find(({ category }) => category === 'terminal').candidateSources = ['action-source'];
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_ROLE_TERMINAL' });
});

await runCase('reject-policy-role-selection-mode', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.roleHandlers.find(({ category }) => category === 'decision').selectionMode = 'sample';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_ROLE_SELECTION' });
});

await runCase('reject-policy-duplicate-record', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.records.push(clone(mutated.records[0]));
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_RECORD_DUPLICATE' });
});

await runCase('reject-policy-record-storage-scope', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.records.find(({ scope }) => scope === 'edge').storage.objectRole = 'root-anchor';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_RECORD_STORAGE' });
});

await runCase('reject-policy-record-numeric-width', () => {
  const mutated = clone(policyProfileInputs[0]);
  const numeric = mutated.records.find(({ semanticKind }) => semanticKind === 'statistic').numeric;
  numeric.accumulationBits = '16';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_NUMERIC_WIDTH' });
});

await runCase('reject-policy-result-visible-private-record', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.records.find(({ resultVisible }) => resultVisible).visibility = 'private';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_RECORD_VISIBLE' });
});

await runCase('reject-policy-accounting-without-numeric-rules', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.records.find(({ semanticKind }) => semanticKind === 'statistic').numeric = { kind: 'none' };
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_RECORD_NUMERIC' });
});

await runCase('reject-policy-selection-randomness', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.selection.tie = 'explicit-random';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_SELECTION_RANDOMNESS' });
});

await runCase('reject-policy-selection-cancellation-bound', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.selection.bounds.maxWorkUnits = '1';
  mutated.selection.bounds.cancellationObservationWorkUnits = '2';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_BOUNDS_CANCELLATION' });
});

await runCase('reject-policy-reservation-port-residue', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.ports = mutated.ports.filter(({ id }) => id !== 'release-in-flight');
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_RESERVATION_RESIDUE' });
});

await runCase('reject-policy-reservation-without-record', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.records.find(({ semanticKind }) => semanticKind === 'reservation').semanticKind = 'custom';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_RESERVATION_RECORD' });
});

await runCase('reject-policy-domain-source-drift', () => {
  const mutated = clone(policyProfileInputs[0]);
  const source = mutated.admission.sources.find(({ kind }) => kind === 'intrinsic-domain');
  source.source = { ...source.source, sha256: '0'.repeat(64) };
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_SOURCE_DOMAIN' });
});

await runCase('reject-policy-external-source-without-profile', () => {
  const mutated = clone(policyProfileInputs[1]);
  mutated.admission.sources.find(({ kind }) => kind === 'evaluator-proposal').producerProfile = { kind: 'none' };
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[1].domain, policyFixtures[1].graph), { code: 'POLICY_SOURCE_PROFILE' });
});

await runCase('reject-policy-required-source-fallback', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.admission.sources.find(({ kind }) => kind === 'intrinsic-domain').fallback = 'skip-source';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_SOURCE_FALLBACK' });
});

await runCase('reject-policy-intrinsic-only-fallback-without-source', () => {
  const mutated = clone(policyProfileInputs[2]);
  mutated.admission.sources[0].fallback = 'intrinsic-only';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[2].domain, policyFixtures[2].graph), { code: 'POLICY_SOURCE_FALLBACK' });
});

await runCase('reject-policy-source-random-bound', () => {
  const mutated = clone(policyProfileInputs[1]);
  mutated.admission.sources[0].maxRandomInputs = '9';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[1].domain, policyFixtures[1].graph), { code: 'POLICY_SOURCE_RANDOMNESS' });
});

await runCase('reject-policy-evaluator-mode-contradiction', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.evaluatorMode = 'combined';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_EVALUATOR_MODE' });
});

await runCase('reject-policy-evaluator-absent-residue', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.selection.inputs.push('evaluator-facts');
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_EVALUATOR_RESIDUE' });
});

await runCase('reject-policy-scalar-coordinate-count', () => {
  const mutated = clone(policyProfileInputs[0]);
  const extra = clone(mutated.value.coordinates[0]);
  extra.id = 'policy.synthetic-scalar-absent.coordinate-extra';
  mutated.value.coordinates.push(extra);
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_VALUE_COORDINATES' });
});

await runCase('reject-policy-vector-coordinate-count', () => {
  const mutated = clone(policyProfileInputs[1]);
  mutated.value.coordinates = [mutated.value.coordinates[0]];
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[1].domain, policyFixtures[1].graph), { code: 'POLICY_VALUE_COORDINATES' });
});

await runCase('reject-policy-evaluator-value-mode', () => {
  const mutated = clone(policyProfileInputs[1]);
  mutated.evaluatorMode = 'proposal-only';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[1].domain, policyFixtures[1].graph), { code: 'POLICY_EVALUATOR_MODE' });
});

await runCase('reject-policy-external-value-without-profile', () => {
  const mutated = clone(policyProfileInputs[1]);
  mutated.value.adapters.find(({ kind }) => kind === 'evaluator').sourceProfile = { kind: 'none' };
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[1].domain, policyFixtures[1].graph), { code: 'POLICY_VALUE_PROFILE' });
});

await runCase('reject-policy-cycle-domain-port-drift', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.cycle.domainRelationPort = { ...mutated.cycle.domainRelationPort, sha256: '0'.repeat(64) };
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_CYCLE_DOMAIN_PORT' });
});

await runCase('reject-policy-duplicate-cycle-partition', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.cycle.partitions.push(clone(mutated.cycle.partitions[0]));
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_CYCLE_PARTITION_DUPLICATE' });
});

await runCase('reject-policy-backup-target', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.backup.targets[0] = 'policy.unknown-record';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_BACKUP_TARGET' });
});

await runCase('reject-policy-backup-order', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.backup.concurrencyOrder = 'deterministic-sequence';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_BACKUP_ORDER' });
});

await runCase('reject-policy-backup-idempotence', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.backup.idempotence = 'best-effort';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_BACKUP_KIND' });
});

await runCase('reject-policy-backup-without-visible-record', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.records.find(({ resultVisible }) => resultVisible).resultVisible = false;
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_BACKUP_VISIBLE' });
});

await runCase('reject-policy-value-none-residue', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.value = { kind: 'none' };
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_VALUE_RESIDUE' });
});

await runCase('reject-policy-stop-budget-range', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.stop.budgets[0].initial = '18446744073709551616';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_BUDGET_RANGE' });
});

await runCase('reject-policy-undeclared-stop-cause', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.stop.causePriority[0] = 'policy.unknown-stop';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_STATUS_REFERENCE' });
});

await runCase('reject-policy-reuse-unknown-record', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.reuse[0].record = 'policy.unknown-record';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_REUSE_RECORD' });
});

await runCase('reject-policy-reuse-coverage', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.reuse.pop();
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_REUSE_COVERAGE' });
});

await runCase('reject-policy-required-status', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.statuses = mutated.statuses.filter(({ code }) => code !== 'statistics-overflow');
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_STATUS_REQUIRED' });
});

await runCase('reject-policy-status-class', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.statuses.find(({ code }) => code === 'cancelled').class = 'normal';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_STATUS_CLASS' });
});

await runCase('reject-policy-role-status-reference', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.roleHandlers[0].failure = 'policy.unknown-failure';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_STATUS_REFERENCE' });
});

await runCase('reject-policy-port-record', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.ports[0].records[0] = 'policy.unknown-record';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_PORT_RECORD' });
});

await runCase('reject-policy-port-status', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.ports[0].statuses[0] = 'policy.unknown-status';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_PORT_STATUS' });
});

await runCase('reject-policy-resource-range', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.resources[0].minimum = '1048577';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_RESOURCE_RANGE' });
});

await runCase('reject-policy-required-resource-pressure', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.resources = mutated.resources.filter(({ pressureStatus }) => pressureStatus !== 'policy-internal-failure');
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_RESOURCE_REQUIRED' });
});

await runCase('reject-policy-reservation-resource-residue', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.resources = mutated.resources.filter(({ pressureStatus }) => pressureStatus !== 'reservation-capacity');
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_RESERVATION_RESIDUE' });
});

await runCase('reject-policy-incomplete-persistence', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.compatibility.persistence = { kind: 'versioned' };
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_PERSISTENCE_FIELDS' });
});

await runCase('reject-policy-native-program-language', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.programContribution.language = 'cuda-cpp';
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_PROGRAM_LANGUAGE' });
});

await runCase('reject-policy-program-input-identity-drift', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.programContribution.inputs[0].identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_PROGRAM_INPUTS' });
});

await runCase('reject-policy-stateless-graph-residue', () => {
  const mutated = clone(policyProfileInputs[2]);
  mutated.selection.inputs.push('ready-edges');
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[2].domain, policyFixtures[2].graph), { code: 'POLICY_STATELESS_GRAPH_RESIDUE' });
});

await runCase('reject-policy-product-owner', () => {
  const mutated = clone(policyProfileInputs[0]);
  mutated.productData.push({
    ownerContract: {
      kind: 'catalog', id: 'product.invalid-policy-owner', version: '0.1.0',
      schema: 'cuda-mcgs.invalid-policy-owner/0.1.0', sha256: '0'.repeat(64),
    },
    schema: policySyntheticSchemaReference('cuda-mcgs.synthetic-invalid-policy-product'),
    identity: policySyntheticContentIdentity('invalid-policy-product'),
  });
  assert.throws(() => normalizePolicyProfile(mutated, inspected, policyFixtures[0].domain, policyFixtures[0].graph), { code: 'POLICY_PRODUCT_OWNER' });
});

await runCase('evaluator-mode-matrix', () => {
  assert.deepEqual(evaluatorProfiles.map(({ normalized }) => normalized.mode), ['combined', 'proposal-only', 'evaluation-only', 'evaluation-only', 'evaluation-only']);
  assert.deepEqual(evaluatorProfiles.map(({ normalized }) => normalized.capabilities.length), [2, 1, 1, 1, 1]);
  assert.equal(evaluatorProfiles[0].normalized.outputs.find(({ family }) => family === 'vector').coordinates.length, 3);
  assert.equal(evaluatorProfiles[4].normalized.outputs[0].family, 'distribution');
});

await runCase('evaluator-absent-zero-residue', () => {
  assert(!frameworkSelection.normalized.profiles.some(({ role }) => role === 'evaluator'));
  const policy = policyProfiles[0].normalized;
  assert.equal(policy.evaluatorMode, 'absent');
  assert(!policy.selection.inputs.includes('evaluator-facts'));
  assert(!policy.resources.some(({ id }) => id.includes('evaluator')));
  assert(!policy.programContribution.inputs.some(({ id }) => id.startsWith('evaluator.')));
});

await runCase('evaluator-profile-second-instances-distinct', () => {
  assert.equal(new Set(evaluatorProfiles.map(({ identity }) => identity.sha256)).size, evaluatorProfiles.length);
  assert.deepEqual(evaluatorProfiles.map(({ normalized }) => normalized.cache.kind), ['selected', 'none', 'none', 'none', 'none']);
  assert.deepEqual(evaluatorProfiles.map(({ normalized }) => normalized.artifacts.length), [1, 0, 1, 0, 1]);
  assert.equal(evaluatorProfiles[4].normalized.mutableState.kind, 'selected');
});

await runCase('evaluator-policy-profile-linkage', () => {
  const selected = [
    { policy: policyProfiles[1].normalized, evaluator: evaluatorProfiles[0], source: 'admission' },
    { policy: policyProfiles[2].normalized, evaluator: evaluatorProfiles[1], source: 'admission' },
    { policy: policyProfiles[3].normalized, evaluator: evaluatorProfiles[2], source: 'value' },
  ];
  for (const entry of selected) {
    const reference = entry.source === 'admission'
      ? entry.policy.admission.sources.find(({ kind }) => kind === 'evaluator-proposal').producerProfile
      : entry.policy.value.adapters.find(({ kind }) => kind === 'evaluator').sourceProfile;
    assert.equal(reference.id, entry.evaluator.normalized.id);
    assert.equal(reference.schema.sha256, evaluatorSchemaSha);
    assert.equal(reference.identity.sha256, entry.evaluator.identity.sha256);
  }
});

await runCase('evaluator-profile-order-independent', () => {
  const reordered = clone(evaluatorProfileInputs[0]);
  for (const key of ['capabilities', 'inputs', 'outputs', 'artifacts', 'workspaces', 'publications', 'ports', 'resources', 'statuses', 'reuse', 'productData']) reordered[key].reverse();
  reordered.request.capabilities.reverse();
  reordered.programContribution.inputs.reverse();
  reordered.cache.keyFacts.reverse();
  reordered.execution.workClasses.reverse();
  for (const capability of reordered.capabilities) {
    capability.purposes.reverse(); capability.requirementClasses.reverse(); capability.inputs.reverse(); capability.outputs.reverse();
  }
  for (const input of reordered.inputs) { input.dependencies.reverse(); input.keyFacts.reverse(); }
  for (const publication of reordered.publications) { publication.consumers.reverse(); publication.states.reverse(); }
  for (const portInput of reordered.ports) portInput.statuses.reverse();
  assert.deepEqual(normalizeEvaluatorProfile(reordered, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph).identity, evaluatorProfiles[0].identity);
});

await runCase('evaluator-arbitrary-width-ranges', () => {
  const mutated = clone(evaluatorProfileInputs[3]);
  const boundary = '340282366920938463463374607431768211455';
  mutated.inputs[0].shape.axes[0].maximum = boundary;
  mutated.inputs[0].shape.maxElements = boundary;
  mutated.resources.find(({ class: resourceClass }) => resourceClass === 'input').maximum = boundary;
  const normalized = normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[3].domain, evaluatorFixtures[3].graph).normalized;
  assert.equal(normalized.inputs[0].shape.maxElements, boundary);
  assert.equal(normalized.resources.find(({ class: resourceClass }) => resourceClass === 'input').maximum, boundary);
});

await runCase('evaluator-history-cache-full-key', () => {
  const normalized = evaluatorProfiles[0].normalized;
  assert(normalized.inputs.some(({ sourceKind, keyFacts }) => sourceKind === 'history' && keyFacts.includes('history') && keyFacts.includes('root')));
  assert(normalized.cache.keyFacts.includes('history'));
  assert(normalized.cache.keyFacts.includes('artifact-generation'));
  assert.equal(normalized.cache.collisionVerification, 'full-key-after-hash');
});

await runCase('evaluator-batch-one-progress', () => {
  assert(evaluatorProfiles.every(({ normalized }) => normalized.batching.minimumReadyItems === '1'));
  assert(evaluatorProfiles.every(({ normalized }) => BigInt(normalized.batching.maxDelayWorkUnits) > 0n));
  assert(evaluatorProfiles.every(({ normalized }) => normalized.execution.deviceOwned && normalized.execution.hostProgress === 'none'));
});

await runCase('evaluator-batch-semantics-matrix', () => {
  assert.equal(evaluatorProfiles[0].normalized.batching.semantics, 'batch-independent');
  assert.equal(evaluatorProfiles[0].normalized.batching.determinism, 'tolerance-equivalent');
  assert.equal(evaluatorProfiles[4].normalized.batching.semantics, 'batch-sensitive');
  assert.notEqual(evaluatorProfiles[4].normalized.batching.order.kind, 'none');
  assert(evaluatorProfiles[4].normalized.inputs.every(({ keyFacts }) => keyFacts.includes('batch-context')));
});

await runCase('evaluator-resumable-workspace-closure', () => {
  const normalized = evaluatorProfiles[4].normalized;
  assert.equal(normalized.batching.continuation.kind, 'bounded');
  assert(normalized.workspaces.some(({ scope }) => scope === 'per-continuation'));
  assert(normalized.ports.some(({ id }) => id === 'resume-evaluation-batch'));
  assert(normalized.resources.some(({ class: resourceClass }) => resourceClass === 'continuation'));
  assert(normalized.resources.some(({ class: resourceClass }) => resourceClass === 'randomness'));
  assert(normalized.cleanup.classes.includes('continuation'));
  assert(normalized.cleanup.classes.includes('mutable-state'));
});

await runCase('evaluator-proposal-ownership-link', () => {
  for (const index of [0, 1]) {
    const normalized = evaluatorProfiles[index].normalized;
    assert(normalized.capabilities.some(({ kind }) => kind === 'proposal'));
    assert.equal(normalized.domainProfile.validateActionPort.sha256, evaluatorFixtures[index].domain.normalized.ports.find(({ id }) => id === 'validate-action').contract.sha256);
    assert(!normalized.capabilities.some(({ id }) => id.includes('admission') || id.includes('edge')));
  }
});

await runCase('evaluator-resident-artifact-boundary', () => {
  for (const index of [0, 2, 4]) {
    const normalized = evaluatorProfiles[index].normalized;
    assert(normalized.artifacts.every(({ residentBeforeIgnition, compatibility, provenance }) => residentBeforeIgnition && compatibility.sha256 && provenance.revision === '125ac4de64d8db2c0027ff4e0e434f9c0a8dcb4d' && provenance.review.sha256));
    assert(normalized.resources.some(({ class: resourceClass }) => resourceClass === 'artifact'));
  }
  assert.equal(evaluatorProfiles[3].normalized.artifacts.length, 0);
  assert(!evaluatorProfiles[3].normalized.resources.some(({ class: resourceClass }) => resourceClass === 'artifact'));
});

await runCase('evaluator-capability-deletion', () => {
  const selected = clone(evaluatorProfileInputs[0]);
  const proposal = selected.capabilities.find(({ kind }) => kind === 'proposal');
  const proposalOutputs = new Set(proposal.outputs);
  selected.capabilities = selected.capabilities.filter(({ id }) => id !== proposal.id);
  selected.outputs = selected.outputs.filter(({ id }) => !proposalOutputs.has(id));
  selected.request.capabilities = selected.request.capabilities.filter(({ capability }) => capability !== proposal.id);
  selected.publications = selected.publications.filter(({ capability }) => capability !== proposal.id);
  selected.mode = 'evaluation-only';
  const withoutProposal = normalizeEvaluatorProfile(selected, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph);
  assert.notDeepEqual(withoutProposal.identity, evaluatorProfiles[0].identity);
  assert(!withoutProposal.normalized.capabilities.some(({ kind }) => kind === 'proposal'));
  assert(!withoutProposal.normalized.outputs.some(({ family }) => family === 'candidate-set'));
});

await runCase('evaluator-product-data-deletion', () => {
  const selected = clone(evaluatorProfileInputs[3]);
  selected.productData.push({
    ownerContract: {
      kind: 'namespaced', id: 'product.synthetic-evaluator-option', version: '0.1.0',
      schema: 'cuda-mcgs.synthetic-evaluator-option-contract/0.1.0', sha256: evaluatorSyntheticContentIdentity('product-contract').sha256,
    },
    schema: evaluatorSyntheticSchemaReference('cuda-mcgs.synthetic-evaluator-option'),
    identity: evaluatorSyntheticContentIdentity('product-evaluator-option'),
  });
  assert.notDeepEqual(normalizeEvaluatorProfile(selected, inspected, evaluatorFixtures[3].domain, evaluatorFixtures[3].graph).identity, evaluatorProfiles[3].identity);
  selected.productData = [];
  assert.deepEqual(normalizeEvaluatorProfile(selected, inspected, evaluatorFixtures[3].domain, evaluatorFixtures[3].graph).identity, evaluatorProfiles[3].identity);
});

await runCase('evaluator-identity-content-sensitive', () => {
  const mutated = clone(evaluatorProfileInputs[3]);
  mutated.execution.comparison.sha256 = '0'.repeat(64);
  assert.notDeepEqual(normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[3].domain, evaluatorFixtures[3].graph).identity, evaluatorProfiles[3].identity);
});

await runCase('evaluator-schema-closed', () => {
  assert.equal(evaluatorProfileSchema.properties.schema.const, 'cuda-mcgs.evaluator-profile/0.2.0');
  assert.equal(evaluatorProfileSchema.additionalProperties, false);
  assert.equal(evaluatorProfileSchema.$defs.capability.additionalProperties, false);
  assert.equal(evaluatorProfileSchema.$defs.input.additionalProperties, false);
  assert.equal(evaluatorProfileSchema.$defs.programContribution.additionalProperties, false);
  assert.equal(evaluatorProfileSchema.$defs.lifecycle.additionalProperties, false);
  assert.equal(evaluatorProfileSchema.$defs.cleanup.additionalProperties, false);
});

await runCase('reject-evaluator-lifecycle-state-gap', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.lifecycle.states.splice(4, 1);
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_LIFECYCLE_STATES' });
});

await runCase('reject-evaluator-cleanup-coverage', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.cleanup.classes = mutated.cleanup.classes.filter((item) => item !== 'input-lease');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_CLEANUP_COVERAGE' });
});

await runCase('reject-evaluator-unknown-field', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.framework = 'tensorflow';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_ROOT_FIELDS' });
});

await runCase('reject-evaluator-contract-drift', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.contract.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_CONTRACT_DRIFT' });
});

await runCase('reject-evaluator-policy-contract-drift', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.policyContract.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_CONTRACT_DRIFT' });
});

await runCase('reject-evaluator-domain-identity-drift', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.domainProfile.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_DOMAIN_DRIFT' });
});

await runCase('reject-evaluator-domain-state-schema-drift', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.domainProfile.stateSchema = { ...mutated.domainProfile.stateSchema, sha256: '0'.repeat(64) };
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_DOMAIN_SCHEMA_DRIFT' });
});

await runCase('reject-evaluator-domain-action-port-drift', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.domainProfile.validateActionPort = { ...mutated.domainProfile.validateActionPort, sha256: '0'.repeat(64) };
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_DOMAIN_PORT_DRIFT' });
});

await runCase('reject-evaluator-graph-identity-drift', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.graphProfile.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_GRAPH_DRIFT' });
});

await runCase('reject-evaluator-graph-port-drift', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.graphProfile.validateReferencePort = { ...mutated.graphProfile.validateReferencePort, sha256: '0'.repeat(64) };
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_GRAPH_PORT_DRIFT' });
});

await runCase('reject-evaluator-mode-contradiction', () => {
  const mutated = clone(evaluatorProfileInputs[1]); mutated.mode = 'combined';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[1].domain, evaluatorFixtures[1].graph), { code: 'EVALUATOR_MODE' });
});

await runCase('reject-evaluator-duplicate-capability', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.capabilities.push(clone(mutated.capabilities[0]));
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_CAPABILITY_DUPLICATE' });
});

await runCase('reject-evaluator-capability-unknown-input', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.capabilities[0].inputs[0] = 'evaluator.unknown-input';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_CAPABILITY_INPUT' });
});

await runCase('reject-evaluator-capability-output-overlap', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.capabilities[1].outputs[0] = mutated.capabilities[0].outputs[0];
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_CAPABILITY_OVERLAP' });
});

await runCase('reject-evaluator-unused-output', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.capabilities[0].outputs = [];
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_CAPABILITY_OUTPUT' });
});

await runCase('reject-evaluator-domain-input-source', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.inputs.find(({ sourceKind }) => sourceKind === 'state').source = evaluatorSyntheticSchemaReference('cuda-mcgs.invalid-state-source');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_INPUT_DOMAIN' });
});

await runCase('reject-evaluator-input-incomplete-key', () => {
  const mutated = clone(evaluatorProfileInputs[3]); mutated.inputs[0].keyFacts = mutated.inputs[0].keyFacts.filter((fact) => fact !== 'precision-execution');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[3].domain, evaluatorFixtures[3].graph), { code: 'EVALUATOR_INPUT_KEY' });
});

await runCase('reject-evaluator-input-randomness-key', () => {
  const mutated = clone(evaluatorProfileInputs[3]); mutated.inputs[0].maxRandomInputs = '1';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[3].domain, evaluatorFixtures[3].graph), { code: 'EVALUATOR_INPUT_RANDOMNESS' });
});

await runCase('reject-evaluator-history-input-key', () => {
  const mutated = clone(evaluatorProfileInputs[0]); const history = mutated.inputs.find(({ sourceKind }) => sourceKind === 'history'); history.keyFacts = history.keyFacts.filter((fact) => fact !== 'history');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_INPUT_KEY' });
});

await runCase('reject-evaluator-stateless-borrow', () => {
  const mutated = clone(evaluatorProfileInputs[1]); mutated.inputs[0].lifetime = 'protected-borrow'; mutated.inputs[0].memoryExpectation = 'device-resident-view';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[1].domain, evaluatorFixtures[1].graph), { code: 'EVALUATOR_INPUT_GRAPH' });
});

await runCase('reject-evaluator-shape-axis-range', () => {
  const mutated = clone(evaluatorProfileInputs[3]); mutated.inputs[0].shape.axes[0].minimum = '4097';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[3].domain, evaluatorFixtures[3].graph), { code: 'EVALUATOR_SHAPE_RANGE' });
});

await runCase('reject-evaluator-shape-product', () => {
  const mutated = clone(evaluatorProfileInputs[3]); mutated.inputs[0].shape.maxElements = '1';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[3].domain, evaluatorFixtures[3].graph), { code: 'EVALUATOR_SHAPE_RANGE' });
});

await runCase('reject-evaluator-numeric-width', () => {
  const mutated = clone(evaluatorProfileInputs[3]); mutated.outputs[0].numeric.accumulationBits = '16';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[3].domain, evaluatorFixtures[3].graph), { code: 'EVALUATOR_NUMERIC_WIDTH' });
});

await runCase('reject-evaluator-scalar-coordinate-count', () => {
  const mutated = clone(evaluatorProfileInputs[3]); const extra = clone(mutated.outputs[0].coordinates[0]); extra.id = 'evaluator.synthetic-analytic-evaluation-only.coordinate-extra'; mutated.outputs[0].coordinates.push(extra);
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[3].domain, evaluatorFixtures[3].graph), { code: 'EVALUATOR_OUTPUT_COORDINATES' });
});

await runCase('reject-evaluator-vector-coordinate-count', () => {
  const mutated = clone(evaluatorProfileInputs[0]); const output = mutated.outputs.find(({ family }) => family === 'vector'); output.coordinates = [output.coordinates[0]];
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_OUTPUT_COORDINATES' });
});

await runCase('reject-evaluator-artifact-post-ignition-residence', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.artifacts[0].residentBeforeIgnition = false;
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_ARTIFACT_RESIDENCE' });
});

await runCase('reject-evaluator-artifact-provenance', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.artifacts[0].provenance.revision = 'working-tree';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_PROVENANCE_REVISION' });
});

await runCase('reject-evaluator-mutable-artifact-without-state', () => {
  const mutated = clone(evaluatorProfileInputs[4]); mutated.mutableState = { kind: 'none' };
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[4].domain, evaluatorFixtures[4].graph), { code: 'EVALUATOR_STATE_RESIDUE' });
});

await runCase('reject-evaluator-request-unknown-capability', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.request.capabilities[0].capability = 'evaluator.unknown-capability';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_REQUEST_CAPABILITY' });
});

await runCase('reject-evaluator-request-capability-coverage', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.request.capabilities.pop();
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_REQUEST_CAPABILITY_COVERAGE' });
});

await runCase('reject-evaluator-required-capability-fallback', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.request.capabilities[0].fallback = 'detach';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_REQUEST_FALLBACK' });
});

await runCase('reject-evaluator-batch-one-progress', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.batching.minimumReadyItems = '2';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_BATCH_PROGRESS' });
});

await runCase('reject-evaluator-batch-sensitive-order-identity', () => {
  const mutated = clone(evaluatorProfileInputs[4]); mutated.batching.order = { kind: 'none' };
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[4].domain, evaluatorFixtures[4].graph), { code: 'EVALUATOR_BATCH_IDENTITY' });
});

await runCase('reject-evaluator-batch-random-bound', () => {
  const mutated = clone(evaluatorProfileInputs[4]); mutated.batching.bounds.maxRandomInputs = '1';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[4].domain, evaluatorFixtures[4].graph), { code: 'EVALUATOR_BATCH_RANDOMNESS' });
});

await runCase('reject-evaluator-continuation-without-workspace', () => {
  const mutated = clone(evaluatorProfileInputs[4]); mutated.workspaces = mutated.workspaces.filter(({ scope }) => scope !== 'per-continuation');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[4].domain, evaluatorFixtures[4].graph), { code: 'EVALUATOR_CONTINUATION_WORKSPACE' });
});

await runCase('reject-evaluator-continuation-workspace-residue', () => {
  const mutated = clone(evaluatorProfileInputs[3]); mutated.workspaces.push(clone(evaluatorProfileInputs[4].workspaces.find(({ scope }) => scope === 'per-continuation')));
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[3].domain, evaluatorFixtures[3].graph), { code: 'EVALUATOR_CONTINUATION_RESIDUE' });
});

await runCase('reject-evaluator-publication-unknown-capability', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.publications[0].capability = 'evaluator.unknown-capability';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_PUBLICATION_CAPABILITY' });
});

await runCase('reject-evaluator-publication-terminal-state', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.publications[0].states = mutated.publications[0].states.filter((state) => state !== 'ready');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_PUBLICATION_STATE' });
});

await runCase('reject-evaluator-publication-authority', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.publications[0].producer = 'policy';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_PUBLICATION_AUTHORITY' });
});

await runCase('reject-evaluator-publication-coverage', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.publications.pop();
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_PUBLICATION_COVERAGE' });
});

await runCase('reject-evaluator-publication-completeness', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.capabilities[0].independentPublication = false;
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_PUBLICATION_COMPLETENESS' });
});

await runCase('reject-evaluator-cache-incomplete-key', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.cache.keyFacts = mutated.cache.keyFacts.filter((fact) => fact !== 'history');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_CACHE_KEY' });
});

await runCase('reject-evaluator-cache-hash-only', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.cache.collisionVerification = 'hash-only';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_CACHE_KIND' });
});

await runCase('reject-evaluator-cache-status', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.cache.pressureStatus = 'evaluator.unknown-pressure';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_CACHE_STATUS' });
});

await runCase('reject-evaluator-host-progress-loop', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.execution.hostProgress = 'host-batch-loop';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_DEVICE_CLOSURE' });
});

await runCase('reject-evaluator-required-status', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.statuses = mutated.statuses.filter(({ code }) => code !== 'evaluator-generation-exhausted');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_STATUS_REQUIRED' });
});

await runCase('reject-evaluator-status-class', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.statuses.find(({ code }) => code === 'evaluator-cancelled').class = 'normal';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_STATUS_CLASS' });
});

await runCase('reject-evaluator-required-port', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.ports = mutated.ports.filter(({ id }) => id !== 'initialize-evaluator');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_PORT_REQUIRED' });
});

await runCase('reject-evaluator-port-status', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.ports[0].statuses[0] = 'evaluator.unknown-status';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_PORT_STATUS' });
});

await runCase('reject-evaluator-cache-port-residue', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.ports = mutated.ports.filter(({ id }) => id !== 'lookup-evaluator-cache');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_CACHE_RESIDUE' });
});

await runCase('reject-evaluator-resume-port-residue', () => {
  const mutated = clone(evaluatorProfileInputs[4]); mutated.ports = mutated.ports.filter(({ id }) => id !== 'resume-evaluation-batch');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[4].domain, evaluatorFixtures[4].graph), { code: 'EVALUATOR_CONTINUATION_RESIDUE' });
});

await runCase('reject-evaluator-resource-range', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.resources[0].minimum = '262145';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_RESOURCE_RANGE' });
});

await runCase('reject-evaluator-required-resource-class', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.resources = mutated.resources.filter(({ class: resourceClass }) => resourceClass !== 'queue');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_RESOURCE_REQUIRED' });
});

await runCase('reject-evaluator-artifact-resource-residue', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.resources = mutated.resources.filter(({ class: resourceClass }) => resourceClass !== 'artifact');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_ARTIFACT_RESIDUE' });
});

await runCase('reject-evaluator-state-resource-residue', () => {
  const mutated = clone(evaluatorProfileInputs[4]); mutated.resources = mutated.resources.filter(({ class: resourceClass }) => resourceClass !== 'state');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[4].domain, evaluatorFixtures[4].graph), { code: 'EVALUATOR_STATE_RESIDUE' });
});

await runCase('reject-evaluator-workspace-resource-residue', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.resources = mutated.resources.filter(({ class: resourceClass }) => resourceClass !== 'workspace');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_WORKSPACE_RESIDUE' });
});

await runCase('reject-evaluator-cache-resource-residue', () => {
  const mutated = clone(evaluatorProfileInputs[3]); mutated.resources.push(clone(evaluatorProfileInputs[0].resources.find(({ class: resourceClass }) => resourceClass === 'cache')));
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[3].domain, evaluatorFixtures[3].graph), { code: 'EVALUATOR_CACHE_RESIDUE' });
});

await runCase('reject-evaluator-randomness-resource-residue', () => {
  const mutated = clone(evaluatorProfileInputs[4]); mutated.resources = mutated.resources.filter(({ class: resourceClass }) => resourceClass !== 'randomness');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[4].domain, evaluatorFixtures[4].graph), { code: 'EVALUATOR_RANDOMNESS_RESIDUE' });
});

await runCase('reject-evaluator-reuse-coverage', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.reuse.pop();
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_REUSE_COVERAGE' });
});

await runCase('reject-evaluator-incomplete-persistence', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.compatibility.persistence = { kind: 'versioned' };
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_PERSISTENCE_FIELDS' });
});

await runCase('reject-evaluator-native-program-language', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.programContribution.language = 'cuda-cpp';
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_PROGRAM_LANGUAGE' });
});

await runCase('reject-evaluator-program-input-drift', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.programContribution.inputs[0].identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_PROGRAM_INPUTS' });
});

await runCase('reject-evaluator-diagnostic-payload-authority', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.diagnostics.rawAddresses = true;
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_DIAGNOSTIC_AUTHORITY' });
});

await runCase('reject-evaluator-product-owner', () => {
  const mutated = clone(evaluatorProfileInputs[0]);
  mutated.productData.push({
    ownerContract: { kind: 'catalog', id: 'product.invalid-evaluator-owner', version: '0.1.0', schema: 'cuda-mcgs.invalid-evaluator-owner/0.1.0', sha256: '0'.repeat(64) },
    schema: evaluatorSyntheticSchemaReference('cuda-mcgs.synthetic-invalid-evaluator-product'), identity: evaluatorSyntheticContentIdentity('invalid-evaluator-product'),
  });
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_PRODUCT_OWNER' });
});

await runCase('reject-evaluator-batch-independent-residue', () => {
  const mutated = clone(evaluatorProfileInputs[3]); mutated.inputs[0].keyFacts.push('batch-context');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[3].domain, evaluatorFixtures[3].graph), { code: 'EVALUATOR_BATCH_RESIDUE' });
});

await runCase('reject-evaluator-artifact-key-residue', () => {
  const mutated = clone(evaluatorProfileInputs[3]); mutated.inputs[0].keyFacts.push('artifact-generation');
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[3].domain, evaluatorFixtures[3].graph), { code: 'EVALUATOR_ARTIFACT_RESIDUE' });
});

await runCase('reject-evaluator-duplicate-input', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.inputs.push(clone(mutated.inputs[0]));
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_INPUT_DUPLICATE' });
});

await runCase('reject-evaluator-duplicate-artifact', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.artifacts.push(clone(mutated.artifacts[0]));
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_ARTIFACT_DUPLICATE' });
});

await runCase('reject-evaluator-duplicate-publication', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.publications.push(clone(mutated.publications[0]));
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_PUBLICATION_DUPLICATE' });
});

await runCase('reject-evaluator-duplicate-status', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.statuses.push(clone(mutated.statuses[0]));
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_STATUS_DUPLICATE' });
});

await runCase('reject-evaluator-duplicate-port', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.ports.push(clone(mutated.ports[0]));
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_PORT_DUPLICATE' });
});

await runCase('reject-evaluator-duplicate-resource', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.resources.push(clone(mutated.resources[0]));
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_RESOURCE_DUPLICATE' });
});

await runCase('reject-evaluator-duplicate-reuse', () => {
  const mutated = clone(evaluatorProfileInputs[0]); mutated.reuse.push(clone(mutated.reuse[0]));
  assert.throws(() => normalizeEvaluatorProfile(mutated, inspected, evaluatorFixtures[0].domain, evaluatorFixtures[0].graph), { code: 'EVALUATOR_REUSE_DUPLICATE' });
});

await runCase('resource-profile-matrix', () => {
  assert.deepEqual(resourceProfiles.map(({ normalized }) => normalized.contributors.some(({ contract }) => contract.id === 'SPEC-0009')), [false, true, true]);
  assert.deepEqual(resourceProfiles.map(({ normalized }) => normalized.reserves.some(({ purpose }) => purpose === 'root-update')), [false, false, true]);
  assert(resourceProfiles.every(({ normalized }) => normalized.classes.length === normalized.partitions.length && normalized.classes.length === normalized.ledgers.length));
});

await runCase('resource-evaluator-absent-zero-residue', () => {
  const normalized = resourceProfiles[0].normalized;
  assert(!normalized.contributors.some(({ contract }) => contract.id === 'SPEC-0009'));
  assert(!normalized.classes.some(({ contributor }) => contributor.startsWith('owner.evaluator.')));
  assert(!normalized.programContribution.inputs.some(({ id }) => id.startsWith('evaluator.')));
});

await runCase('resource-upstream-exact-coverage', () => {
  const normalized = resourceProfiles[1].normalized;
  for (const result of [domainProfiles[1], graphProfiles[1], policyProfiles[1], evaluatorProfiles[0]]) {
    const contributor = normalized.contributors.find(({ profile }) => profile.id === result.normalized.id);
    const expected = result.normalized.resources.filter(({ maximum }) => maximum !== '0').map(({ id }) => id).sort();
    assert.deepEqual(contributor.classes, expected);
  }
});

await runCase('resource-profile-order-independent', () => {
  const reordered = clone(resourceProfileInputs[1]);
  for (const key of ['contributors', 'classes', 'pools', 'partitions', 'reserves', 'admissionGroups', 'ledgers', 'watermarks', 'ports', 'statuses', 'providerRequirements', 'productData']) reordered[key].reverse();
  reordered.exhaustion.causes.reverse(); reordered.cleanup.kinds.reverse(); reordered.programContribution.inputs.reverse();
  for (const contributor of reordered.contributors) contributor.classes.reverse();
  for (const entry of reordered.classes) { entry.consumers.reverse(); entry.memorySpaces.reverse(); entry.access.reverse(); }
  for (const reserve of reordered.reserves) { reserve.eligibleOwners.reverse(); reserve.eligibleTransitions.reverse(); }
  for (const group of reordered.admissionGroups) { group.classes.reverse(); group.provisionalLimits.reverse(); }
  for (const watermark of reordered.watermarks) watermark.responses.reverse();
  for (const portInput of reordered.ports) portInput.statuses.reverse();
  assert.deepEqual(normalizeResourceProfile(reordered, inspected, knownResourceProfiles).identity, resourceProfiles[1].identity);
});

await runCase('resource-meaningful-admission-order-sensitive', () => {
  const mutated = clone(resourceProfileInputs[0]);
  const compound = mutated.admissionGroups.find(({ atomicity }) => atomicity === 'all-or-none-transaction');
  compound.globalOrder.reverse();
  assert.notDeepEqual(normalizeResourceProfile(mutated, inspected, knownResourceProfiles).identity, resourceProfiles[0].identity);
});

await runCase('resource-arbitrary-width-checked-formula', () => {
  const mutated = clone(resourceProfileInputs[0]);
  const selected = mutated.classes.find(({ id }) => id.endsWith('class-ledger-records'));
  const boundary = 340282366920938463463374607431768211455n;
  const maximum = (boundary * 2n).toString();
  selected.formula = { basis: 'maximum-live', unitsPerInstance: '2', maximumInstances: boundary.toString(), maximumUnits: maximum };
  selected.range.identityMaximum = (boundary + 1n).toString();
  const selectedPool = mutated.pools.find(({ id }) => id === mutated.partitions.find(({ class: id }) => id === selected.id).pool);
  selectedPool.capacity = maximum; selectedPool.largestGuaranteedRequest = maximum;
  const selectedPartition = mutated.partitions.find(({ class: id }) => id === selected.id); selectedPartition.capacity = maximum;
  const selectedWatermark = mutated.watermarks.find(({ class: id }) => id === selected.id);
  selectedWatermark.normalUpTo = (boundary / 2n).toString(); selectedWatermark.highAt = boundary.toString(); selectedWatermark.criticalAt = (boundary + boundary / 2n).toString(); selectedWatermark.exhaustedAt = maximum;
  const selectedProvider = mutated.providerRequirements.find(({ pool }) => pool === selectedPool.id); selectedProvider.capacity = maximum;
  mutated.admissionGroups.find(({ id }) => id === selected.admissionGroup).provisionalLimits.find(({ class: classId }) => classId === selected.id).maximumUnits = maximum;
  const normalized = normalizeResourceProfile(mutated, inspected, knownResourceProfiles).normalized;
  assert.equal(normalized.classes.find(({ id }) => id === selected.id).formula.maximumUnits, maximum);
});

await runCase('resource-core-compound-and-reserves', () => {
  for (const { normalized } of resourceProfiles) {
    assert(normalized.admissionGroups.some(({ atomicity, classes }) => atomicity === 'all-or-none-transaction' && classes.length === 2));
    assert(normalized.reserves.some(({ purpose, borrow }) => purpose === 'terminal-result' && borrow.kind === 'none'));
    assert(normalized.reserves.some(({ purpose, borrow }) => purpose === 'progress-cleanup' && borrow.kind === 'none'));
  }
});

await runCase('resource-live-session-root-reserve', () => {
  const normalized = resourceProfiles[2].normalized;
  const reserve = normalized.reserves.find(({ purpose }) => purpose === 'root-update');
  assert(reserve);
  assert.equal(normalized.classes.find(({ id }) => id === reserve.class).lifetime, 'session');
  assert(normalized.contributors.some(({ contract }) => contract.id === 'SPEC-0006'));
});

await runCase('resource-pressure-owner-separation', () => {
  for (const { normalized } of resourceProfiles) for (const watermark of normalized.watermarks) {
    const resourceClass = normalized.classes.find(({ id }) => id === watermark.class);
    assert(watermark.responses.some(({ state, owner }) => state === 'high' && owner === resourceClass.contributor));
    assert(watermark.responses.some(({ state, owner }) => state === 'critical' && owner === resourceClass.contributor));
    assert(watermark.responses.some(({ state, owner }) => state === 'exhausted' && owner === resourceClass.contributor));
  }
});

await runCase('resource-provider-projection-neutral', () => {
  for (const requirement of resourceProfiles[1].normalized.providerRequirements) {
    assert.deepEqual(Object.keys(requirement).sort(), ['access', 'alignment', 'capacity', 'id', 'lifecycle', 'memorySpaces', 'opaqueResult', 'pool', 'unit']);
    assert.deepEqual(Object.keys(requirement.opaqueResult).sort(), ['algorithm', 'sha256']);
    for (const forbidden of ['allocator', 'cuda', 'pointer', 'scheduler', 'stream']) assert(!(forbidden in requirement));
  }
});

await runCase('resource-lifecycle-cleanup-closure', () => {
  assert(resourceProfiles.every(({ normalized }) => normalized.lifecycle.states.at(-1) === 'released'));
  assert(resourceProfiles.every(({ normalized }) => normalized.cleanup.kinds.includes('retired-range') && normalized.cleanup.kinds.includes('quarantined-range')));
});

await runCase('resource-zero-source-elimination', () => {
  const result = domainProfiles[0];
  const zero = result.normalized.resources.filter(({ maximum }) => maximum === '0');
  const normalized = resourceProfiles[0].normalized;
  for (const resource of zero) assert(!normalized.classes.some(({ sourceResource }) => sourceResource === resource.id));
});

await runCase('resource-program-input-closure', () => {
  for (const { normalized } of resourceProfiles) assert.deepEqual(normalized.programContribution.inputs.map(({ id }) => id), normalized.contributors.map(({ profile }) => profile).sort((left, right) => (left.id < right.id ? -1 : (left.id > right.id ? 1 : 0))).map(({ id }) => id));
});

await runCase('resource-safe-alias-proof', () => {
  const mutated = clone(resourceProfileInputs[0]);
  const shared = mutated.partitions.filter(({ pool }) => pool === mutated.pools.find(({ id }) => id.endsWith('pool-terminal-progress')).id);
  shared[1].offset = '0';
  const proof = resourceSyntheticSchemaReference('cuda-mcgs.synthetic-resource-alias-proof');
  for (const entry of shared) entry.alias = { kind: 'proven', group: 'resource.synthetic.alias-core', proof, exclusiveLifetime: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-resource-alias-lifetime'), releaseOrder: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-resource-alias-release') };
  assert.equal(normalizeResourceProfile(mutated, inspected, knownResourceProfiles).normalized.partitions.filter(({ alias }) => alias.kind === 'proven').length, 2);
});

await runCase('resource-available-pressure-direction', () => {
  const mutated = clone(resourceProfileInputs[0]);
  const watermark = mutated.watermarks[0];
  const maximum = BigInt(mutated.classes.find(({ id }) => id === watermark.class).formula.maximumUnits);
  watermark.measured = 'available'; watermark.comparison = 'available-at-most';
  watermark.normalUpTo = maximum.toString(); watermark.highAt = ((maximum * 3n) / 4n).toString(); watermark.criticalAt = (maximum / 2n).toString(); watermark.exhaustedAt = '0';
  assert.equal(normalizeResourceProfile(mutated, inspected, knownResourceProfiles).normalized.watermarks.find(({ id }) => id === watermark.id).comparison, 'available-at-most');
});

await runCase('resource-bounded-borrow-proof', () => {
  const mutated = clone(resourceProfileInputs[0]);
  const lifetimeRank = new Map([['transaction', 0], ['work', 1], ['root', 2], ['session', 3], ['engine', 4]]);
  const pair = mutated.partitions.flatMap((targetPartition) => {
    const targetClass = mutated.classes.find(({ id }) => id === targetPartition.class);
    if (mutated.reserves.some(({ partition }) => partition === targetPartition.id)) return [];
    return mutated.partitions.filter(({ id }) => id !== targetPartition.id).map((donorPartition) => ({ targetPartition, targetClass, donorPartition, donorPool: mutated.pools.find(({ id }) => id === donorPartition.pool) }));
  }).find(({ targetClass, donorPool }) => donorPool.unit === targetClass.unit && targetClass.memorySpaces.every((space) => donorPool.memorySpaces.includes(space)) && targetClass.access.every((access) => donorPool.access.includes(access)) && lifetimeRank.get(donorPool.lifetime) >= lifetimeRank.get(targetClass.lifetime));
  assert(pair);
  const { targetClass, targetPartition, donorPartition } = pair;
  const targetContributor = mutated.contributors.find(({ id }) => id === targetClass.contributor);
  mutated.reserves.push({
    id: 'resource.synthetic.custom-borrow', purpose: 'custom', class: targetClass.id, partition: targetPartition.id, minimum: '1', maximum: '1',
    eligibleOwners: [targetContributor.id], eligibleTransitions: ['resource.transition-custom'],
    borrow: {
      kind: 'bounded', donorPartitions: [donorPartition.id], safety: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-borrow-safety'),
      returnTrigger: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-borrow-return'), deadlineWorkUnits: '64',
      watermarkEffect: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-borrow-watermark'), terminationReserve: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-borrow-termination'),
    },
    release: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-borrow-release'), priority: '9',
  });
  assert(normalizeResourceProfile(mutated, inspected, knownResourceProfiles).normalized.reserves.some(({ borrow }) => borrow.kind === 'bounded'));
});

await runCase('resource-identity-content-sensitive', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.exhaustion.publication.sha256 = '0'.repeat(64);
  assert.notDeepEqual(normalizeResourceProfile(mutated, inspected, knownResourceProfiles).identity, resourceProfiles[0].identity);
});

await runCase('resource-schema-closed', () => {
  assert.equal(resourceProfileSchema.properties.schema.const, 'cuda-mcgs.resource-profile/0.2.0');
  assert.equal(resourceProfileSchema.additionalProperties, false);
  for (const name of ['contributor', 'resourceClass', 'pool', 'partition', 'reserve', 'provisionalLimit', 'admissionGroup', 'ledger', 'watermark', 'providerRequirement', 'programContribution']) assert.equal(resourceProfileSchema.$defs[name].additionalProperties, false);
});

await runCase('resource-framework-selection-link', () => {
  const selected = frameworkSelection.normalized.profiles.find(({ role }) => role === 'resource');
  assert.equal(selected.schema.id, resourceProfileInputs[0].schema);
  assert.equal(selected.schema.sha256, resourceSchemaSha);
  assert.equal(selected.identity.sha256, resourceProfiles[0].identity.sha256);
});

await runCase('reject-resource-unknown-field', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.cudaAllocator = 'managed';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_ROOT_FIELDS' });
});

await runCase('reject-resource-contract-drift', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.contract.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_CONTRACT_DRIFT' });
});

await runCase('reject-resource-contributor-schema-drift', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.contributors.find(({ profile }) => profile.id === domainProfiles[0].normalized.id).profile.schema.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_CONTRIBUTOR_PROFILE' });
});

await runCase('reject-resource-contributor-contract-drift', () => {
  const mutated = clone(resourceProfileInputs[0]);
  const contributor = mutated.contributors.find(({ profile }) => profile.id === domainProfiles[0].normalized.id);
  contributor.contract = clone(mutated.contributors.find(({ profile }) => profile.id === graphProfiles[0].normalized.id).contract);
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_CONTRIBUTOR_PROFILE' });
});

await runCase('reject-resource-duplicate-contributor', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.contributors.push(clone(mutated.contributors[0]));
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_CONTRIBUTOR_DUPLICATE' });
});

await runCase('reject-resource-duplicate-contributor-profile', () => {
  const mutated = clone(resourceProfileInputs[0]); const duplicate = clone(mutated.contributors[0]); duplicate.id = 'owner.duplicate-profile'; duplicate.classes = [];
  mutated.contributors.push(duplicate);
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_CONTRIBUTOR_PROFILE_DUPLICATE' });
});

await runCase('reject-resource-contributor-class-coverage', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.contributors[0].classes.pop();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_CLASS_CONTRIBUTOR' });
});

await runCase('reject-resource-class-source-drift', () => {
  const mutated = clone(resourceProfileInputs[0]); const selected = mutated.classes.find(({ contributor }) => contributor === `owner.${domainProfiles[0].normalized.id}`); selected.formula.maximumUnits = (BigInt(selected.formula.maximumUnits) + 1n).toString(); selected.formula.maximumInstances = selected.formula.maximumUnits;
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_CLASS_SOURCE' });
});

await runCase('reject-resource-formula-arithmetic', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.classes[0].formula.unitsPerInstance = '2';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_FORMULA_ARITHMETIC' });
});

await runCase('reject-resource-class-range', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.classes[0].minimumUnits = (BigInt(mutated.classes[0].formula.maximumUnits) + 1n).toString();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_CLASS_RANGE' });
});

await runCase('reject-resource-identity-range', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.classes[0].range.identityMaximum = mutated.classes[0].formula.maximumInstances;
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_IDENTITY_RANGE' });
});

await runCase('reject-resource-duplicate-class', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.classes.push(clone(mutated.classes[0]));
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_CLASS_DUPLICATE' });
});

await runCase('reject-resource-pool-range', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.pools[0].largestGuaranteedRequest = (BigInt(mutated.pools[0].capacity) + 1n).toString();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_POOL_RANGE' });
});

await runCase('reject-resource-duplicate-pool', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.pools.push(clone(mutated.pools[0]));
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_POOL_DUPLICATE' });
});

await runCase('reject-resource-unused-pool', () => {
  const mutated = clone(resourceProfileInputs[0]); const extra = clone(mutated.pools[0]); extra.id = 'resource.synthetic.unused-pool'; extra.providerRequirement = 'resource.synthetic.unused-provider'; mutated.pools.push(extra);
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_POOL_COVERAGE' });
});

await runCase('reject-resource-partition-reference', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.partitions[0].pool = 'resource.unknown-pool';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PARTITION_REFERENCE' });
});

await runCase('reject-resource-partition-unit', () => {
  const mutated = clone(resourceProfileInputs[0]); const selected = mutated.partitions.find(({ class: id }) => mutated.classes.find(({ id: classId, unit }) => classId === id && unit !== 'bytes')); selected.pool = mutated.pools.find(({ unit }) => unit === 'bytes').id;
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PARTITION_UNIT' });
});

await runCase('reject-resource-partition-memory-compatibility', () => {
  const mutated = clone(resourceProfileInputs[0]); const terminal = mutated.classes.find(({ id }) => id.endsWith('class-terminal-envelope')); const partition = mutated.partitions.find(({ class: classId }) => classId === terminal.id); mutated.pools.find(({ id }) => id === partition.pool).memorySpaces = ['device-search'];
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PARTITION_COMPATIBILITY' });
});

await runCase('reject-resource-partition-pool-alignment', () => {
  const mutated = clone(resourceProfileInputs[0]); const partition = mutated.partitions[0]; mutated.pools.find(({ id }) => id === partition.pool).alignment = (BigInt(partition.alignment) * 2n).toString();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PARTITION_ALIGNMENT' });
});

await runCase('reject-resource-partition-alignment', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.partitions[0].offset = '1';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PARTITION_ALIGNMENT' });
});

await runCase('reject-resource-partition-range', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.partitions[0].capacity = (BigInt(mutated.pools.find(({ id }) => id === mutated.partitions[0].pool).capacity) + 1n).toString();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PARTITION_RANGE' });
});

await runCase('reject-resource-partition-overlap', () => {
  const mutated = clone(resourceProfileInputs[0]); const shared = mutated.partitions.filter(({ pool }) => pool === mutated.pools.find(({ id }) => id.endsWith('pool-terminal-progress')).id); shared[1].offset = '0';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PARTITION_OVERLAP' });
});

await runCase('reject-resource-alias-proof-mismatch', () => {
  const mutated = clone(resourceProfileInputs[0]); const shared = mutated.partitions.filter(({ pool }) => pool === mutated.pools.find(({ id }) => id.endsWith('pool-terminal-progress')).id); shared[1].offset = '0';
  shared[0].alias = { kind: 'proven', group: 'resource.synthetic.alias-a', proof: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-alias-a'), exclusiveLifetime: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-alias-life'), releaseOrder: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-alias-order') };
  shared[1].alias = { ...clone(shared[0].alias), group: 'resource.synthetic.alias-b' };
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PARTITION_OVERLAP' });
});

await runCase('reject-resource-alias-lifetime-mismatch', () => {
  const mutated = clone(resourceProfileInputs[0]); const shared = mutated.partitions.filter(({ pool }) => pool === mutated.pools.find(({ id }) => id.endsWith('pool-terminal-progress')).id); shared[1].offset = '0';
  const alias = { kind: 'proven', group: 'resource.synthetic.alias', proof: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-alias-proof'), exclusiveLifetime: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-alias-life'), releaseOrder: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-alias-order') };
  shared[0].alias = clone(alias); shared[1].alias = clone(alias); shared[1].alias.exclusiveLifetime = resourceSyntheticSchemaReference('cuda-mcgs.synthetic-other-alias-life');
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PARTITION_OVERLAP' });
});

await runCase('reject-resource-partition-cleanup-order', () => {
  const mutated = clone(resourceProfileInputs[0]); const shared = mutated.partitions.filter(({ pool }) => pool === mutated.pools.find(({ id }) => id.endsWith('pool-terminal-progress')).id); shared[1].cleanupOrder = shared[0].cleanupOrder;
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PARTITION_CLEANUP' });
});

await runCase('reject-resource-partition-coverage', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.partitions.pop();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PARTITION_COVERAGE' });
});

await runCase('reject-resource-terminal-reserve-missing', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.reserves = mutated.reserves.filter(({ purpose }) => purpose !== 'terminal-result');
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_RESERVE_REQUIRED' });
});

await runCase('reject-resource-reserve-owner', () => {
  const mutated = clone(resourceProfileInputs[0]); const reserve = mutated.reserves.find(({ purpose }) => purpose === 'terminal-result'); reserve.class = mutated.reserves.find(({ purpose }) => purpose === 'progress-cleanup').class; reserve.partition = mutated.reserves.find(({ purpose }) => purpose === 'progress-cleanup').partition;
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_RESERVE_OWNER' });
});

await runCase('reject-resource-reserve-unknown-eligible-owner', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.reserves[0].eligibleOwners.push('owner.unknown');
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_RESERVE_OWNER' });
});

await runCase('reject-resource-reserve-range', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.reserves[0].maximum = (BigInt(mutated.reserves[0].maximum) + 1n).toString();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_RESERVE_RANGE' });
});

await runCase('reject-resource-reserve-total', () => {
  const mutated = clone(resourceProfileInputs[0]); const selected = clone(mutated.reserves[0]); selected.id = 'resource.synthetic.extra-reserve'; selected.purpose = 'custom'; mutated.reserves.push(selected);
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_RESERVE_RANGE' });
});

await runCase('reject-resource-root-reserve-missing', () => {
  const mutated = clone(resourceProfileInputs[2]); mutated.reserves = mutated.reserves.filter(({ purpose }) => purpose !== 'root-update');
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_RESERVE_OWNER' });
});

await runCase('reject-resource-borrow-incomplete', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.reserves[0].borrow = { kind: 'bounded' };
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_BORROW_FIELDS' });
});

await runCase('reject-resource-protected-reserve-borrow', () => {
  const mutated = clone(resourceProfileInputs[0]); const reserve = mutated.reserves.find(({ purpose }) => purpose === 'terminal-result');
  reserve.borrow = {
    kind: 'bounded', donorPartitions: [mutated.partitions.find(({ id }) => id !== reserve.partition).id], safety: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-borrow-safety'),
    returnTrigger: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-borrow-return'), deadlineWorkUnits: '64', watermarkEffect: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-borrow-watermark'), terminationReserve: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-borrow-termination'),
  };
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_RESERVE_PROTECTION' });
});

await runCase('reject-resource-borrow-donor', () => {
  const mutated = clone(resourceProfileInputs[0]); const resourceContributor = mutated.contributors.find(({ id }) => id === 'owner.resource-core'); const targetClass = mutated.classes.find(({ contributor }) => contributor === resourceContributor.id); const targetPartition = mutated.partitions.find(({ class: classId }) => classId === targetClass.id);
  mutated.reserves.push({ id: 'resource.synthetic.invalid-borrow', purpose: 'custom', class: targetClass.id, partition: targetPartition.id, minimum: '1', maximum: '1', eligibleOwners: [resourceContributor.id], eligibleTransitions: ['resource.transition-custom'], borrow: { kind: 'bounded', donorPartitions: ['resource.unknown-partition'], safety: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-borrow-safety'), returnTrigger: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-borrow-return'), deadlineWorkUnits: '64', watermarkEffect: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-borrow-watermark'), terminationReserve: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-borrow-termination') }, release: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-borrow-release'), priority: '9' });
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_BORROW_DONOR' });
});

await runCase('reject-resource-admission-coverage', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.classes[0].admissionGroup = 'resource.unknown-admission';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_ADMISSION_COVERAGE' });
});

await runCase('reject-resource-admission-order', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.admissionGroups.find(({ atomicity }) => atomicity === 'all-or-none-transaction').globalOrder.pop();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_ADMISSION_ORDER' });
});

await runCase('reject-resource-admission-provisional-coverage', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.admissionGroups.find(({ atomicity }) => atomicity === 'all-or-none-transaction').provisionalLimits.pop();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_ADMISSION_PROVISIONAL' });
});

await runCase('reject-resource-admission-atomicity', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.admissionGroups.find(({ atomicity }) => atomicity === 'all-or-none-transaction').atomicity = 'single-cas';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_ADMISSION_ATOMICITY' });
});

await runCase('reject-resource-class-in-multiple-admission-groups', () => {
  const mutated = clone(resourceProfileInputs[0]); const extra = clone(mutated.admissionGroups.find(({ atomicity }) => atomicity === 'single-cas')); extra.id = 'resource.synthetic.extra-admission'; mutated.admissionGroups.push(extra);
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_ADMISSION_COVERAGE' });
});

await runCase('reject-resource-duplicate-admission', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.admissionGroups.push(clone(mutated.admissionGroups[0]));
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_ADMISSION_DUPLICATE' });
});

await runCase('reject-resource-ledger-states', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.ledgers[0].states.pop();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_LEDGER_STATES' });
});

await runCase('reject-resource-ledger-range', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.ledgers[0].counterMaximum = (BigInt(mutated.classes.find(({ id }) => id === mutated.ledgers[0].class).range.counterMaximum) + 1n).toString();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_LEDGER_RANGE' });
});

await runCase('reject-resource-ledger-coverage', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.ledgers.pop();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_LEDGER_COVERAGE' });
});

await runCase('reject-resource-watermark-range', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.watermarks[0].highAt = (BigInt(mutated.watermarks[0].criticalAt) + 1n).toString();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_WATERMARK_RANGE' });
});

await runCase('reject-resource-watermark-direction', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.watermarks[0].measured = 'available'; mutated.watermarks[0].comparison = 'available-at-most';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_WATERMARK_RANGE' });
});

await runCase('reject-resource-critical-response-missing', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.watermarks[0].responses = mutated.watermarks[0].responses.filter(({ state }) => state !== 'critical');
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_WATERMARK_RESPONSE' });
});

await runCase('reject-resource-response-owner', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.watermarks[0].responses[0].owner = 'owner.unknown';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_RESPONSE_OWNER' });
});

await runCase('reject-resource-response-reserve', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.watermarks[0].responses[0].reserve = 'resource.unknown-reserve';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_RESPONSE_RESERVE' });
});

await runCase('reject-resource-response-reserve-eligibility', () => {
  const mutated = clone(resourceProfileInputs[0]); const watermark = mutated.watermarks.find(({ class: classId }) => mutated.classes.find(({ id }) => id === classId).contributor.startsWith('owner.domain.')); const owner = watermark.responses[0].owner; mutated.reserves.find(({ purpose }) => purpose === 'progress-cleanup').eligibleOwners = mutated.reserves.find(({ purpose }) => purpose === 'progress-cleanup').eligibleOwners.filter((id) => id !== owner);
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_RESPONSE_RESERVE' });
});

await runCase('reject-resource-watermark-coverage', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.watermarks.pop();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_WATERMARK_COVERAGE' });
});

await runCase('reject-resource-exhaustion-cause-gap', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.exhaustion.causes.pop();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_EXHAUSTION_CAUSE' });
});

await runCase('reject-resource-terminal-reserve-drift', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.exhaustion.terminalReserve = mutated.reserves.find(({ purpose }) => purpose === 'progress-cleanup').id;
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_EXHAUSTION_RESERVE' });
});

await runCase('reject-resource-host-growth', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.exhaustion.hostGrowth = 'on-demand';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_EXHAUSTION_CONTRACT' });
});

await runCase('reject-resource-first-cause-mutable', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.exhaustion.firstCause = 'latest-wins';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_EXHAUSTION_CONTRACT' });
});

await runCase('reject-resource-counter-wrap', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.exhaustion.counterWrap = 'saturate';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_EXHAUSTION_CONTRACT' });
});

await runCase('reject-resource-lifecycle-state-gap', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.lifecycle.states.pop();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_LIFECYCLE_STATES' });
});

await runCase('reject-resource-required-status', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.statuses.pop();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_STATUS_REQUIRED' });
});

await runCase('reject-resource-required-status-class', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.statuses.find(({ code }) => code === 'resource-internal-failure').class = 'normal';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_STATUS_CLASS' });
});

await runCase('reject-resource-required-port', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.ports.pop();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PORT_REQUIRED' });
});

await runCase('reject-resource-active-port-phase', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.ports.find(({ id }) => id === 'reserve-resource').phase = 'host-preignition';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PORT_PHASE' });
});

await runCase('reject-resource-preignition-port-phase', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.ports.find(({ id }) => id === 'compose-resource-plan').phase = 'device-active';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PORT_PHASE' });
});

await runCase('reject-resource-port-status', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.ports[0].statuses[0] = 'resource.unknown-status';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PORT_STATUS' });
});

await runCase('reject-resource-provider-drift', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.providerRequirements[0].capacity = (BigInt(mutated.providerRequirements[0].capacity) + 1n).toString();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PROVIDER_POOL' });
});

await runCase('reject-resource-provider-coverage', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.providerRequirements.pop();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PROVIDER_COVERAGE' });
});

await runCase('reject-resource-cleanup-coverage', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.cleanup.kinds.pop();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_CLEANUP_COVERAGE' });
});

await runCase('reject-resource-native-program-language', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.programContribution.language = 'cuda-cpp';
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PROGRAM_LANGUAGE' });
});

await runCase('reject-resource-program-input-drift', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.programContribution.inputs.pop();
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PROGRAM_INPUTS' });
});

await runCase('reject-resource-diagnostic-authority', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.diagnostics.rawAddresses = true;
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_DIAGNOSTIC_AUTHORITY' });
});

await runCase('reject-resource-incomplete-persistence', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.compatibility.persistence = { kind: 'versioned' };
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PERSISTENCE_FIELDS' });
});

await runCase('reject-resource-product-owner', () => {
  const mutated = clone(resourceProfileInputs[0]); mutated.productData.push({ ownerContract: clone(mutated.contract), schema: resourceSyntheticSchemaReference('cuda-mcgs.synthetic-resource-product'), identity: resourceSyntheticContentIdentity('invalid-resource-product') });
  assert.throws(() => normalizeResourceProfile(mutated, inspected, knownResourceProfiles), { code: 'RESOURCE_PRODUCT_OWNER' });
});

await runCase('progress-profile-second-instances-distinct', () => {
  assert.equal(new Set(progressProfiles.map(({ identity }) => identity.sha256)).size, 3);
  assert.deepEqual(progressProfiles.map(({ normalized }) => normalized.noProgress.externalWait.kind), ['absent', 'absent', 'session-only']);
});

await runCase('progress-evaluator-absence-zero-residue', () => {
  const normalized = progressProfiles[0].normalized;
  assert(!normalized.contributors.some(({ contract }) => contract.id === 'SPEC-0009'));
  assert(!normalized.workClasses.some(({ batch }) => batch.kind === 'device-flush'));
  assert(!JSON.stringify(normalized).includes('evaluator.synthetic'));
});

await runCase('progress-session-absence-zero-residue', () => {
  for (const { normalized } of progressProfiles.slice(0, 2)) {
    assert(!normalized.contributors.some(({ contract }) => contract.id === 'SPEC-0006'));
    assert(!normalized.workClasses.some(({ kind }) => kind === 'external-control'));
    assert.equal(normalized.noProgress.externalWait.kind, 'absent');
    assert.equal(normalized.closure.outputBorrow.kind, 'none');
  }
});

await runCase('progress-live-session-bounded-external-wait', () => {
  const normalized = progressProfiles[2].normalized;
  const session = normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0006');
  assert(session);
  assert.equal(normalized.noProgress.externalWait.owner, session.id);
  assert.equal(normalized.workClasses.find(({ owner }) => owner === session.id).kind, 'external-control');
  assert.equal(normalized.closure.outputBorrow.kind, 'bounded-postsemantic');
});

await runCase('progress-profile-order-independent', () => {
  const reordered = clone(progressProfileInputs[2]);
  for (const key of ['contributors', 'workClasses', 'dependencies', 'fairnessClasses', 'ports', 'statuses', 'productData']) reordered[key].reverse();
  reordered.noProgress.outcomes.reverse();
  reordered.stop.mustDrainKinds.reverse();
  reordered.closure.workClasses.reverse();
  reordered.cleanup.kinds.reverse();
  reordered.programContribution.inputs.reverse();
  for (const contributor of reordered.contributors) { contributor.workClasses.reverse(); contributor.publicTransitions.reverse(); }
  for (const workClass of reordered.workClasses) {
    workClass.inputStates.reverse(); workClass.outputStates.reverse(); workClass.resources.reverse();
    workClass.terminalStates.reverse(); workClass.readiness.dependencies.reverse();
  }
  for (const dependency of reordered.dependencies) dependency.escapes.reverse();
  for (const fairness of reordered.fairnessClasses) fairness.classes.reverse();
  for (const portInput of reordered.ports) portInput.statuses.reverse();
  assert.deepEqual(normalizeProgressProfile(reordered, inspected, progressResourceResults[2], knownResourceProfiles).identity, progressProfiles[2].identity);
});

await runCase('progress-arbitrary-width-bounds', () => {
  const mutated = clone(progressProfileInputs[0]);
  const boundary = '340282366920938463463374607431768211455';
  mutated.workClasses[0].bounds.maxAdmitted = boundary;
  mutated.workClasses[0].bounds.counterMaximum = boundary;
  mutated.ports[0].bounds.maxAdmitted = boundary;
  mutated.ports[0].bounds.counterMaximum = boundary;
  const normalized = normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles).normalized;
  assert.equal(normalized.workClasses.find(({ id }) => id === mutated.workClasses[0].id).bounds.maxAdmitted, boundary);
});

await runCase('progress-work-graph-owner-and-resource-closure', () => {
  for (const { normalized } of progressProfiles) {
    const workById = new Map(normalized.workClasses.map((entry) => [entry.id, entry]));
    assert(normalized.contributors.every((owner) => owner.workClasses.every((id) => workById.get(id)?.owner === owner.id)));
    assert.deepEqual(normalized.closure.workClasses, normalized.workClasses.map(({ id }) => id));
    assert(normalized.dependencies.every(({ holdsWorker, holdsProducerResource }) => !holdsWorker && !holdsProducerResource));
  }
});

await runCase('progress-reserved-closure-paths', () => {
  for (let index = 0; index < progressProfiles.length; index += 1) {
    const normalized = progressProfiles[index].normalized;
    const reserves = new Map(progressResourceResults[index].normalized.reserves.map((entry) => [entry.id, entry]));
    for (const workClass of normalized.workClasses.filter(({ kind }) => ['producer-unblocking', 'must-drain', 'terminal-output', 'resource-recovery'].includes(kind))) {
      assert.equal(reserves.get(workClass.reserve).purpose, workClass.kind === 'terminal-output' ? 'terminal-result' : 'progress-cleanup');
    }
  }
});

await runCase('progress-batch-device-visible-flush', () => {
  for (const { normalized } of progressProfiles.slice(1)) {
    const batch = normalized.workClasses.find(({ batch: selected }) => selected.kind === 'device-flush').batch;
    assert.equal(batch.minimumItems, '1');
    assert.equal(batch.hostTimeout, 'none');
  }
});

await runCase('progress-no-progress-outcome-closure', () => {
  assert(progressProfiles.every(({ normalized }) => normalized.noProgress.outcomes.length === 10));
  assert(progressProfiles.every(({ normalized }) => normalized.noProgress.source === 'device-visible-ready-facts' && normalized.noProgress.hostObservation === 'non-progressing'));
});

await runCase('progress-stop-drain-closure-contract', () => {
  for (const { normalized } of progressProfiles) {
    assert.deepEqual(normalized.stop.states, ['running', 'stop-requested', 'draining', 'terminal']);
    assert.equal(normalized.stop.observationDependency, 'none');
    assert.equal(normalized.closure.observationAckRequired, false);
    assert.equal(normalized.closure.terminalOutput, 'publishable-from-reserve');
  }
});

await runCase('progress-device-active-public-ports', () => {
  assert(progressProfiles.every(({ normalized }) => normalized.ports.length === 11 && normalized.ports.every(({ phase }) => phase === 'device-active')));
});

await runCase('progress-schema-closed', () => {
  assert.equal(progressProfileSchema.properties.schema.const, 'cuda-mcgs.progress-profile/0.2.0');
  assert.equal(progressProfileSchema.additionalProperties, false);
  for (const name of ['contributor', 'workClass', 'dependency', 'fairnessClass', 'noProgress', 'stop', 'closure', 'lifecycle', 'port', 'status', 'programContribution']) assert.equal(progressProfileSchema.$defs[name].additionalProperties, false);
});

await runCase('progress-framework-selection-link', () => {
  const selected = frameworkSelection.normalized.profiles.find(({ role }) => role === 'progress');
  assert.equal(selected.schema.id, progressProfileInputs[0].schema);
  assert.equal(selected.schema.sha256, progressSchemaSha);
  assert.equal(selected.identity.sha256, progressProfiles[0].identity.sha256);
});

await runCase('progress-program-input-exactness', () => {
  for (const { normalized } of progressProfiles) {
    assert(normalized.programContribution.inputs.some(({ id }) => id === normalized.resourcePlan.id));
    assert(normalized.contributors.every(({ profile }) => normalized.programContribution.inputs.some(({ id }) => id === profile.id)));
    assert.equal(normalized.programContribution.language, 'restricted-device-js');
  }
});

await runCase('progress-product-data-deletion', () => {
  const selected = clone(progressProfileInputs[0]);
  selected.productData.push({
    ownerContract: { kind: 'namespaced', id: 'product.synthetic-progress-option', version: '0.1.0', schema: 'cuda-mcgs.synthetic-progress-product-contract/0.1.0', sha256: progressSyntheticContentIdentity('product-contract').sha256 },
    schema: progressSyntheticSchemaReference('cuda-mcgs.synthetic-progress-product'), identity: progressSyntheticContentIdentity('progress-product'),
  });
  const withProduct = normalizeProgressProfile(selected, inspected, progressResourceResults[0], knownResourceProfiles);
  assert.notDeepEqual(withProduct.identity, progressProfiles[0].identity);
  selected.productData = [];
  assert.deepEqual(normalizeProgressProfile(selected, inspected, progressResourceResults[0], knownResourceProfiles).identity, progressProfiles[0].identity);
});

await runCase('progress-identity-content-sensitive', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.noProgress.potential.sha256 = '0'.repeat(64);
  assert.notDeepEqual(normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles).identity, progressProfiles[0].identity);
});

await runCase('reject-progress-unknown-field', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.cudaScheduler = 'persistent-kernel';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_ROOT_FIELDS' });
});

await runCase('reject-progress-contract-drift', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.contract.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_CONTRACT_DRIFT' });
});

await runCase('reject-progress-resource-plan-drift', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.resourcePlan.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_RESOURCE_PLAN' });
});

await runCase('reject-progress-resource-contribution-drift', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.resourceContribution.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_RESOURCE_CONTRIBUTION' });
});

await runCase('reject-progress-contributor-omission', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.contributors.pop();
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_CONTRIBUTOR_COUNT' });
});

await runCase('reject-progress-contributor-relabel', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.contributors[0].id = 'owner.relabelled';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_CONTRIBUTOR_PROFILE' });
});

await runCase('reject-progress-contributor-optionality-drift', () => {
  const mutated = clone(progressProfileInputs[1]); mutated.contributors.find(({ optional }) => optional).optional = false;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[1], knownResourceProfiles), { code: 'PROGRESS_CONTRIBUTOR_PROFILE' });
});

await runCase('reject-progress-contributor-profile-drift', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.contributors[0].profile.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_CONTRIBUTOR_PROFILE' });
});

await runCase('reject-progress-duplicate-contributor', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.contributors[1] = clone(mutated.contributors[0]);
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_CONTRIBUTOR_DUPLICATE' });
});

await runCase('reject-progress-contributor-work-coverage', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.contributors[0].workClasses[0] = mutated.contributors[1].workClasses[0];
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_WORK_OWNER' });
});

await runCase('reject-progress-duplicate-work-class', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.workClasses.push(clone(mutated.workClasses[0]));
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_WORK_DUPLICATE' });
});

await runCase('reject-progress-work-owner', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.workClasses[0].owner = 'owner.unknown';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_WORK_OWNER' });
});

await runCase('reject-progress-cross-owner-resource', () => {
  const mutated = clone(progressProfileInputs[0]);
  const target = mutated.workClasses.find(({ resources }) => resources.length > 0);
  target.resources[0] = progressResourceResults[0].normalized.classes.find(({ contributor }) => contributor !== target.owner).id;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_WORK_RESOURCE' });
});

await runCase('reject-progress-missing-closure-reserve', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.workClasses.find(({ kind }) => kind === 'producer-unblocking').reserve = null;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_WORK_RESERVE' });
});

await runCase('reject-progress-terminal-reserve-kind', () => {
  const mutated = clone(progressProfileInputs[0]);
  mutated.workClasses.find(({ kind }) => kind === 'terminal-output').reserve = progressResourceResults[0].normalized.reserves.find(({ purpose }) => purpose === 'progress-cleanup').id;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_WORK_RESERVE' });
});

await runCase('reject-progress-resource-less-recovery', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.workClasses.find(({ kind }) => kind === 'resource-recovery').resources = [];
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_WORK_RESOURCE' });
});

await runCase('reject-progress-work-bound-zero', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.workClasses[0].bounds.maxProducedPerStep = '0';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_BOUNDS_RANGE' });
});

await runCase('reject-progress-counter-insufficient', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.workClasses[0].bounds.counterMaximum = '1';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_BOUNDS_RANGE' });
});

await runCase('reject-progress-cancellation-bound', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.workClasses[0].bounds.cancellationObservationWorkUnits = '257';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_BOUNDS_CANCELLATION' });
});

await runCase('reject-progress-retry-not-stale-safe', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.workClasses[0].retry.staleSafe = false;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_RETRY_STALE' });
});

await runCase('reject-progress-batch-host-timeout', () => {
  const mutated = clone(progressProfileInputs[1]); mutated.workClasses.find(({ batch }) => batch.kind === 'device-flush').batch.hostTimeout = 'wall-clock';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[1], knownResourceProfiles), { code: 'PROGRESS_BATCH_KIND' });
});

await runCase('reject-progress-batch-range', () => {
  const mutated = clone(progressProfileInputs[1]); mutated.workClasses.find(({ batch }) => batch.kind === 'device-flush').batch.minimumItems = '65';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[1], knownResourceProfiles), { code: 'PROGRESS_BATCH_RANGE' });
});

await runCase('reject-progress-batch-owner', () => {
  const mutated = clone(progressProfileInputs[1]);
  const batch = clone(mutated.workClasses.find(({ batch: selected }) => selected.kind === 'device-flush').batch);
  mutated.workClasses.find(({ owner }) => mutated.contributors.find(({ id }) => id === owner).contract.id === 'SPEC-0007').batch = batch;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[1], knownResourceProfiles), { code: 'PROGRESS_BATCH_OWNER' });
});

await runCase('reject-progress-continuation-identity', () => {
  const mutated = clone(progressProfileInputs[0]); const selected = mutated.workClasses.find(({ kind }) => kind === 'must-drain'); selected.step.continuationIdentity = null;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_STEP_CONTINUATION' });
});

await runCase('reject-progress-readiness-contradiction', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.workClasses.find(({ readiness }) => readiness.mode === 'all').readiness.independentReady = true;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_READINESS_MODE' });
});

await runCase('reject-progress-readiness-source', () => {
  const mutated = clone(progressProfileInputs[0]); const selected = mutated.workClasses.find(({ kind }) => kind === 'resource-recovery'); selected.readiness.mode = 'all'; selected.readiness.independentReady = false;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_READINESS_SOURCE' });
});

await runCase('reject-progress-readiness-dependency-omission', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.workClasses.find(({ readiness }) => readiness.dependencies.length > 0).readiness.dependencies.pop();
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_READINESS_DEPENDENCY' });
});

await runCase('reject-progress-dependency-consumer', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.dependencies[0].consumer = 'work.unknown';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_DEPENDENCY_CONSUMER' });
});

await runCase('reject-progress-dependency-fact', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.dependencies[0].producer.fact = progressSyntheticSchemaReference('cuda-mcgs.synthetic-invalid-producer-fact');
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_PRODUCER_FACT' });
});

await runCase('reject-progress-required-self-dependency', () => {
  const mutated = clone(progressProfileInputs[0]); const dependency = mutated.dependencies.find(({ requirement }) => requirement === 'required');
  const work = mutated.workClasses.find(({ id }) => id === dependency.consumer); const owner = mutated.contributors.find(({ id }) => id === work.owner);
  dependency.producer = { kind: 'work-class', owner: owner.id, workClass: work.id, fact: clone(owner.publicTransitions[0]) };
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_DEPENDENCY_SELF' });
});

await runCase('reject-progress-dependency-escape', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.dependencies[0].escapes = ['failure', 'cancel', 'stale'];
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_DEPENDENCY_ESCAPE' });
});

await runCase('reject-progress-advisory-fallback', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.dependencies.find(({ requirement }) => requirement === 'advisory').fallback = null;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_DEPENDENCY_FALLBACK' });
});

await runCase('reject-progress-held-worker-wait', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.dependencies[0].holdsWorker = true;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_DEPENDENCY_HOLD' });
});

await runCase('reject-progress-resource-recovery-owner', () => {
  const mutated = clone(progressProfileInputs[0]); const dependency = mutated.dependencies.find(({ producer }) => producer.kind === 'resource-recovery');
  const graph = mutated.contributors.find(({ contract }) => contract.id === 'SPEC-0010'); dependency.producer.owner = graph.id; dependency.producer.fact = clone(graph.publicTransitions[0]);
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_PRODUCER_OWNER' });
});

await runCase('reject-progress-mandatory-wait-cycle', () => {
  const mutated = clone(progressProfileInputs[0]);
  const graph = mutated.workClasses.find(({ kind }) => kind === 'producer-unblocking');
  const policy = mutated.workClasses.find(({ owner }) => mutated.contributors.find(({ id }) => id === owner).contract.id === 'SPEC-0008');
  const policyOwner = mutated.contributors.find(({ id }) => id === policy.owner);
  const id = 'dependency.synthetic-mandatory-cycle';
  mutated.dependencies.push({
    id, consumer: graph.id, producer: { kind: 'work-class', owner: policy.owner, workClass: policy.id, fact: clone(policyOwner.publicTransitions[0]) },
    requirement: 'required', publication: progressSyntheticSchemaReference('cuda-mcgs.synthetic-cycle-publication'), incarnation: progressSyntheticSchemaReference('cuda-mcgs.synthetic-cycle-incarnation'),
    escapes: ['failure', 'cancel', 'stop'], maxWaitTransitions: '16', fallback: null, holdsWorker: false, holdsProducerResource: false,
  });
  graph.readiness.dependencies.push(id);
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_DEPENDENCY_CYCLE' });
});

await runCase('reject-progress-host-control-gates-internal-work', () => {
  const mutated = clone(progressProfileInputs[2]); const dependency = mutated.dependencies.find(({ requirement }) => requirement === 'advisory');
  const session = mutated.contributors.find(({ contract }) => contract.id === 'SPEC-0006');
  dependency.producer = { kind: 'external-control', owner: session.id, workClass: null, fact: clone(session.publicTransitions[0]) };
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[2], knownResourceProfiles), { code: 'PROGRESS_EXTERNAL_WORK' });
});

await runCase('reject-progress-external-work-internal-producer', () => {
  const mutated = clone(progressProfileInputs[2]); const sessionWork = mutated.workClasses.find(({ kind }) => kind === 'external-control');
  const dependency = mutated.dependencies.find(({ consumer }) => consumer === sessionWork.id); dependency.producer.kind = 'fact';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[2], knownResourceProfiles), { code: 'PROGRESS_EXTERNAL_WORK' });
});

await runCase('reject-progress-fairness-coverage', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.fairnessClasses.find(({ id }) => id.endsWith('.ordinary')).classes.pop();
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_FAIRNESS_COVERAGE' });
});

await runCase('reject-progress-fairness-priority-escape', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.fairnessClasses.find(({ mode }) => mode === 'priority-with-starvation-escape').starvationEscape = null;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_FAIRNESS_ESCAPE' });
});

await runCase('reject-progress-fairness-closure-priority', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.fairnessClasses.find(({ closurePriority }) => closurePriority).closurePriority = false;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_FAIRNESS_CLOSURE' });
});

await runCase('reject-progress-no-progress-outcome-gap', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.noProgress.outcomes.pop();
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_NOPROGRESS_OUTCOME' });
});

await runCase('reject-progress-host-no-progress-source', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.noProgress.source = 'host-poll';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_NOPROGRESS_CONTRACT' });
});

await runCase('reject-progress-session-external-wait-omission', () => {
  const mutated = clone(progressProfileInputs[2]); mutated.noProgress.externalWait = { kind: 'absent' };
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[2], knownResourceProfiles), { code: 'PROGRESS_EXTERNAL_WAIT_SESSION' });
});

await runCase('reject-progress-unselected-external-wait', () => {
  const mutated = clone(progressProfileInputs[0]);
  mutated.noProgress.externalWait = { kind: 'session-only', owner: mutated.contributors[0].id, state: progressSyntheticSchemaReference('cuda-mcgs.synthetic-invalid-wait'), maxPendingCommands: '1' };
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_EXTERNAL_WAIT_SESSION' });
});

await runCase('reject-progress-no-progress-bound', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.noProgress.maxRepeatedTransitions = '0';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_NOPROGRESS_RANGE' });
});

await runCase('reject-progress-stop-state-gap', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.stop.states.splice(2, 1);
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_STOP_CONTRACT' });
});

await runCase('reject-progress-stop-drain-kind-gap', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.workClasses.find(({ kind }) => kind === 'producer-unblocking').kind = 'ordinary';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_STOP_DRAIN' });
});

await runCase('reject-progress-closure-class-gap', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.closure.workClasses.pop();
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_CLOSURE_COVERAGE' });
});

await runCase('reject-progress-observation-dependent-closure', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.closure.observationAckRequired = true;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_CLOSURE_CONTRACT' });
});

await runCase('reject-progress-output-borrow-unbounded', () => {
  const mutated = clone(progressProfileInputs[2]); mutated.closure.outputBorrow.maximum = '0';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[2], knownResourceProfiles), { code: 'PROGRESS_OUTPUT_BORROW_RANGE' });
});

await runCase('reject-progress-lifecycle-state-gap', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.lifecycle.states.pop();
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_LIFECYCLE_STATES' });
});

await runCase('reject-progress-required-status', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.statuses = mutated.statuses.filter(({ code }) => code !== 'progress-deadlock');
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_STATUS_REQUIRED' });
});

await runCase('reject-progress-status-class', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.statuses.find(({ code }) => code === 'progress-deadlock').class = 'pending';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_STATUS_CLASS' });
});

await runCase('reject-progress-required-port', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.ports.pop();
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_PORT_REQUIRED' });
});

await runCase('reject-progress-host-active-port', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.ports[0].phase = 'host-active';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_PORT_PHASE' });
});

await runCase('reject-progress-port-status', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.ports[0].statuses[0] = 'progress.unknown-status';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_PORT_STATUS' });
});

await runCase('reject-progress-diagnostic-authority', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.diagnostics.wallClock = true;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_DIAGNOSTIC_AUTHORITY' });
});

await runCase('reject-progress-scheduler-compatibility', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.compatibility.schedulerIdentityExcluded = false;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_COMPAT_IDENTITY' });
});

await runCase('reject-progress-incomplete-persistence', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.compatibility.persistence = { kind: 'versioned' };
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_PERSISTENCE_FIELDS' });
});

await runCase('reject-progress-cleanup-coverage', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.cleanup.kinds.pop();
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_CLEANUP_KIND' });
});

await runCase('reject-progress-native-program-language', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.programContribution.language = 'cuda-cpp';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_PROGRAM_LANGUAGE' });
});

await runCase('reject-progress-program-input-drift', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.programContribution.inputs.pop();
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_PROGRAM_INPUTS' });
});

await runCase('reject-progress-product-owner', () => {
  const mutated = clone(progressProfileInputs[0]);
  mutated.productData.push({ ownerContract: clone(mutated.contract), schema: progressSyntheticSchemaReference('cuda-mcgs.synthetic-invalid-progress-product'), identity: progressSyntheticContentIdentity('invalid-progress-product') });
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_PRODUCT_OWNER' });
});

await runCase('reject-progress-work-publication-not-owned', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.workClasses[0].step.publication = progressSyntheticSchemaReference('cuda-mcgs.synthetic-foreign-work-publication');
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_WORK_PUBLICATION' });
});

await runCase('reject-progress-terminal-disposition-gap', () => {
  const mutated = clone(progressProfileInputs[0]); const selected = mutated.workClasses[0]; selected.terminalStates = selected.terminalStates.filter((state) => state !== 'failed');
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_WORK_TERMINAL' });
});

await runCase('reject-progress-special-stop-disposition', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.workClasses.find(({ kind }) => kind === 'terminal-output').stopDisposition = 'abandon';
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_WORK_STOP' });
});

await runCase('reject-progress-work-producer-publication-mismatch', () => {
  const mutated = clone(progressProfileInputs[0]); const dependency = mutated.dependencies.find(({ producer }) => producer.kind === 'work-class');
  const owner = mutated.contributors.find(({ id }) => id === dependency.producer.owner);
  const alternative = progressSyntheticSchemaReference('cuda-mcgs.synthetic-alternative-owner-transition');
  owner.publicTransitions.push(alternative); dependency.producer.fact = alternative;
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_PRODUCER_FACT' });
});

await runCase('reject-progress-required-dependency-fallback', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.dependencies.find(({ requirement }) => requirement === 'required').fallback = progressSyntheticSchemaReference('cuda-mcgs.synthetic-invalid-required-fallback');
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_DEPENDENCY_FALLBACK' });
});

await runCase('reject-progress-external-wait-private-state', () => {
  const mutated = clone(progressProfileInputs[2]); mutated.noProgress.externalWait.state = progressSyntheticSchemaReference('cuda-mcgs.synthetic-private-session-wait');
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[2], knownResourceProfiles), { code: 'PROGRESS_EXTERNAL_WAIT_SESSION' });
});

await runCase('reject-progress-unselected-output-borrow', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.closure.outputBorrow = { kind: 'bounded-postsemantic', maximum: '1', teardown: progressSyntheticSchemaReference('cuda-mcgs.synthetic-unselected-output-borrow') };
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_OUTPUT_BORROW_KIND' });
});

const failed = cases.filter(({ status }) => status === 'fail');
const summary = {
  expected: 469,
  discovered: cases.length,
  executed: cases.length,
  passed: cases.length - failed.length,
  failed: failed.length,
  requiredSkipped: 0,
  conditionalSkipped: 0,
  optionalSkipped: 0,
  notDiscovered: 469 - cases.length,
};
assert.equal(cases.length, summary.expected, `Expected ${summary.expected} cases, discovered ${cases.length}`);

const sourcePaths = [
  'schemas/search-ir/0.2.0/contract-set.schema.json',
  'schemas/search-ir/0.2.0/contract-set.json',
  'schemas/search-ir/0.2.0/requirement-coverage.schema.json',
  'schemas/search-ir/0.2.0/requirement-coverage.json',
  'schemas/search-ir/0.2.0/primitives.schema.json',
  'schemas/search-ir/0.2.0/framework-selection.schema.json',
  'schemas/search-ir/0.2.0/domain-profile.schema.json',
  'schemas/search-ir/0.2.0/graph-profile.schema.json',
  'schemas/search-ir/0.2.0/policy-profile.schema.json',
  'schemas/search-ir/0.2.0/evaluator-profile.schema.json',
  'schemas/search-ir/0.2.0/resource-profile.schema.json',
  'schemas/search-ir/0.2.0/progress-profile.schema.json',
  'experiments/search-ir-composer-reference/fixtures/minimal.framework-selection.json',
  'experiments/search-ir-composer-reference/src/catalog.mjs',
  'experiments/search-ir-composer-reference/src/validation.mjs',
  'experiments/search-ir-composer-reference/src/foundation.mjs',
  'experiments/search-ir-composer-reference/src/domain.mjs',
  'experiments/search-ir-composer-reference/src/domain-fixtures.mjs',
  'experiments/search-ir-composer-reference/src/graph.mjs',
  'experiments/search-ir-composer-reference/src/graph-fixtures.mjs',
  'experiments/search-ir-composer-reference/src/policy.mjs',
  'experiments/search-ir-composer-reference/src/policy-fixtures.mjs',
  'experiments/search-ir-composer-reference/src/evaluator.mjs',
  'experiments/search-ir-composer-reference/src/evaluator-fixtures.mjs',
  'experiments/search-ir-composer-reference/src/resource.mjs',
  'experiments/search-ir-composer-reference/src/resource-fixtures.mjs',
  'experiments/search-ir-composer-reference/src/progress.mjs',
  'experiments/search-ir-composer-reference/src/progress-fixtures.mjs',
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
  domainProfileIdentities: domainProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, ...identity })) ?? [],
  graphProfileIdentities: graphProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, ...identity })) ?? [],
  policyProfileIdentities: policyProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, ...identity })) ?? [],
  evaluatorProfileIdentities: evaluatorProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, ...identity })) ?? [],
  resourceProfileIdentities: resourceProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, ...identity })) ?? [],
  progressProfileIdentities: progressProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, ...identity })) ?? [],
  contractSummaries: inspected?.contractSummaries ?? [],
  coverage: {
    classified: inspected?.requirements.filter(({ classificationStatus }) => classificationStatus === 'classified').length ?? 0,
    pending: inspected?.requirements.filter(({ classificationStatus }) => classificationStatus === 'pending').length ?? 989,
  },
  sources,
  summary,
  cases,
  claimLimits: [
    'Proposal contract catalog plus shared representation primitives and framework, domain, graph, policy, evaluator, resource and progress profile normalization only.',
    'The framework, domain, graph, policy, evaluator, resource and progress requirements have final evidence lanes but remain partial, pending or deferred; no proposal contract is accepted by this capsule.',
    'Domain evidence covers strict normalized profile selection and three synthetic structural instances, not behavioral oracle, publication/concurrency, native or compatible-pair qualification.',
    'Graph evidence covers four strict structural instances, bounded ownership/layout/lifecycle/publication checks and zero-residue optional modes, not behavioral oracle, concurrent reclamation, native or compatible-pair qualification.',
    'Policy evidence covers four strict structural instances, role/record/admission/value/cycle/backup/stop/reuse checks and zero-residue optional modes, not behavioral oracle, concurrent backup, native or compatible-pair qualification.',
    'Evaluator evidence covers five strict structural instances, proposal/evaluation/combined modes, typed inputs/outputs, request/batch/publication/cache/resident-artifact/progress/reuse/lifecycle checks and zero-residue optional modes, not behavioral oracle, concurrent evaluator execution, native or compatible-pair qualification.',
    'Evaluator absence is represented by structural omission from framework selection; this capsule does not create or validate a synthetic disabled evaluator profile.',
    'Resource evidence covers three strict finite-plan instances, contribution composition, exact arithmetic, partitions/reserves/admission/ledgers/pressure/exhaustion/lifecycle/provider projections and evaluator-absence zero residue, not behavioral oracle, concurrent accounting, physical CUDA-JS allocation, native or compatible-pair qualification.',
    'Progress evidence covers three scheduler-neutral work/readiness/fairness/no-progress/stop/closure plans, including evaluator absence and selected live-session external wait, not behavioral oracle, schedule exploration, physical scheduler/CUDA-JS execution, native or compatible-pair qualification.',
    'No output/session/extension/package profile body, complete cross-owner Composer, generated Search Program or production lowering claim.',
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

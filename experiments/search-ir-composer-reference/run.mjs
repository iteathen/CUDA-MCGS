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
  buildPolicyProfile,
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
  buildChannelFirstProductDeletedResourceProfile,
  buildChannelResourceProfile,
  buildResourceProfile,
  buildResourceProfiles,
  buildStageResourceProfile,
  resourceSyntheticContentIdentity,
  resourceSyntheticSchemaReference,
} from './src/resource-fixtures.mjs';
import { normalizeProgressProfile } from './src/progress.mjs';
import {
  buildChannelFirstProductDeletedProgressProfile,
  buildChannelProgressProfile,
  buildProgressProfile,
  buildProgressProfiles,
  buildStageProgressProfile,
  progressSyntheticContentIdentity,
  progressSyntheticSchemaReference,
} from './src/progress-fixtures.mjs';
import { normalizeOutputProfile } from './src/output.mjs';
import {
  buildOutputProfile,
  buildOutputProfiles,
  outputSyntheticContentIdentity,
  outputSyntheticSchemaReference,
} from './src/output-fixtures.mjs';
import { normalizeSessionProfile } from './src/session.mjs';
import {
  buildSessionProfile,
  buildSessionProfiles,
  sessionSyntheticContentIdentity,
  sessionSyntheticSchemaReference,
} from './src/session-fixtures.mjs';
import { normalizeStageProfile } from './src/stage.mjs';
import {
  buildChannelStageFirstProductDeletedProfile,
  buildChannelStageProfile,
  buildStageFirstProductDeletedProfile,
  buildStageProfile,
  buildStageProfiles,
  stageSyntheticContentIdentity,
  stageSyntheticSchemaReference,
} from './src/stage-fixtures.mjs';
import { classifyChannelProgress, normalizeChannelProfile, simulateChannelTrace } from './src/channel.mjs';
import {
  buildChannelProfile,
  buildChannelFirstProductDeletedProfile,
  buildChannelProfiles,
  channelSyntheticSchemaReference,
} from './src/channel-fixtures.mjs';
import {
  assertOwnerDeletion,
  buildExecutionPackage,
  composeSearchProgram,
  normalizeCompatiblePair,
  normalizeCudaJsRealization,
  normalizeProgramPackageProfile,
} from './src/program-package.mjs';
import {
  buildCompatiblePairFixture,
  buildCudaJsFailureFixture,
  buildCudaJsRealizationFixture,
  buildProgramPackageProfile,
} from './src/program-package-fixtures.mjs';
import {
  composeResolvedEngine,
  createResolvedComposerInput,
  normalizeResolvedComposerInput,
  tryComposeResolvedEngine,
} from './src/composer.mjs';
import {
  referenceComposerPreset,
  resolveReferenceConvenienceCall,
} from './src/composer-presets.mjs';
import { assertComposedDeletion } from './src/deletion-identity.mjs';

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
const outputProfileSchema = await readJson(path.join(schemaRoot, 'output-profile.schema.json'));
const sessionProfileSchema = await readJson(path.join(schemaRoot, 'session-profile.schema.json'));
const stageProfileSchema = await readJson(path.join(schemaRoot, 'stage-profile.schema.json'));
const channelProfileSchema = await readJson(path.join(schemaRoot, 'channel-profile.schema.json'));
const programPackageProfileSchema = await readJson(path.join(schemaRoot, 'program-package-profile.schema.json'));
const searchProgramSchema = await readJson(path.join(schemaRoot, 'search-program.schema.json'));
const executionPackageSchema = await readJson(path.join(schemaRoot, 'execution-package.schema.json'));
const compatiblePairRecordSchema = await readJson(path.join(schemaRoot, 'compatible-pair-record.schema.json'));
const resolvedComposerInputSchema = await readJson(path.join(schemaRoot, 'resolved-composer-input.schema.json'));
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
  assert.deepEqual(normalized.totals, { contracts: 12, requirements: 989, classified: 989, pending: 0 });
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
  assert.equal(inspected.requirements.filter(({ classificationStatus }) => classificationStatus === 'classified').length, 989);
  assert.equal(inspected.requirements.filter(({ classificationStatus }) => classificationStatus === 'pending').length, 0);
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0000').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0007').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0008').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0009').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0010').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0011').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0012').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0013').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  assert(inspected.requirements.filter(({ contract }) => contract === 'SPEC-0006').every(({ evidenceStatus }) => ['partial', 'pending', 'deferred'].includes(evidenceStatus)));
  const compositionRequirements = inspected.requirements.filter(({ contract }) => contract === 'SPEC-0005');
  assert.equal(compositionRequirements.length, 78);
  assert(compositionRequirements.every(({ evidenceStatus }) => ['partial', 'deferred'].includes(evidenceStatus)));
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

await runCase('coverage-most-specific-prefix', async () => {
  const expanded = await inspectCatalog(repositoryRoot, contractSetInput, coverageInput);
  assert.equal(expanded.requirements.find(({ id }) => id === 'SESSION-001').currentDisposition, 'cross-specification-proof');
  assert.equal(expanded.requirements.find(({ id }) => id === 'SESSION-PROFILE-001').currentDisposition, 'structural-schema');
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

let outputProfileInputs;
let outputProfiles;
let outputSchemaSha;
let outputProgressResults;
await runCase('normalize-output-profiles', async () => {
  outputSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'output-profile.schema.json')));
  outputProgressResults = progressProfiles.map((result) => ({ ...result, schemaSha: progressSchemaSha }));
  outputProfileInputs = buildOutputProfiles(inspected, progressResourceResults, outputProgressResults);
  outputProfiles = outputProfileInputs.map((input, index) => normalizeOutputProfile(input, inspected, progressResourceResults[index], outputProgressResults[index]));
  assert.deepEqual(outputProfiles.map(({ normalized }) => normalized.id), [
    'output.synthetic-evaluator-absent',
    'output.synthetic-evaluator-workspace',
    'output.synthetic-live-session',
  ]);
});

let sessionProfileInputs;
let sessionProfiles;
let sessionSchemaSha;
let sessionOutputResult;
await runCase('normalize-session-profiles', async () => {
  sessionSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'session-profile.schema.json')));
  sessionOutputResult = { ...outputProfiles[2], schemaSha: outputSchemaSha };
  sessionProfileInputs = buildSessionProfiles(inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult);
  sessionProfiles = sessionProfileInputs.map((input) => normalizeSessionProfile(input, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult));
  assert.deepEqual(sessionProfiles.map(({ normalized }) => normalized.id), [
    'session.synthetic-live-session',
    'session.synthetic-live-session-restart',
  ]);
});

let stageResourceInput;
let stageResourceResult;
let stageProgressInput;
let stageProgressResult;
let stageProfileInputs;
let stageProfiles;
let stageDeletedInput;
let stageDeletedProfile;
let stageSchemaSha;
await runCase('normalize-stage-profiles', async () => {
  stageSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'stage-profile.schema.json')));
  stageResourceInput = buildStageResourceProfile(inspected, domainProfiles, graphProfiles, policyProfiles, {
    domain: domainSchemaSha, graph: graphSchemaSha, policy: policySchemaSha, evaluator: evaluatorSchemaSha,
  });
  stageResourceResult = { ...normalizeResourceProfile(stageResourceInput, inspected, knownResourceProfiles), schemaSha: resourceSchemaSha };
  stageProgressInput = buildStageProgressProfile(inspected, stageResourceResult);
  stageProgressResult = { ...normalizeProgressProfile(stageProgressInput, inspected, stageResourceResult, knownResourceProfiles), schemaSha: progressSchemaSha };
  stageProfileInputs = buildStageProfiles(inspected, stageResourceResult, stageProgressResult, knownResourceProfiles);
  stageProfiles = stageProfileInputs.map((input) => normalizeStageProfile(input, inspected, stageResourceResult, stageProgressResult, knownResourceProfiles));
  stageDeletedInput = buildStageFirstProductDeletedProfile(inspected, stageResourceResult, stageProgressResult, knownResourceProfiles);
  stageDeletedProfile = normalizeStageProfile(stageDeletedInput, inspected, stageResourceResult, stageProgressResult, knownResourceProfiles);
  assert.deepEqual(stageProfiles.map(({ normalized }) => normalized.id), ['extension.synthetic-capability-pair', 'extension.synthetic-proof-stage']);
});

let channelResourceInput;
let channelResourceResult;
let channelDeletedResourceInput;
let channelDeletedResourceResult;
let channelProgressInput;
let channelProgressResult;
let channelDeletedProgressInput;
let channelDeletedProgressResult;
let channelStageInput;
let channelStageResult;
let channelDeletedStageInput;
let channelDeletedStageResult;
let channelProfileInputs;
let channelProfiles;
let channelDeletedInput;
let channelDeletedProfile;
let channelSchemaSha;
await runCase('normalize-channel-profiles', async () => {
  channelSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'channel-profile.schema.json')));
  channelResourceInput = buildChannelResourceProfile(inspected, domainProfiles, graphProfiles, policyProfiles, evaluatorProfiles, {
    domain: domainSchemaSha, graph: graphSchemaSha, policy: policySchemaSha, evaluator: evaluatorSchemaSha,
  });
  channelResourceResult = { ...normalizeResourceProfile(channelResourceInput, inspected, knownResourceProfiles), schemaSha: resourceSchemaSha };
  channelDeletedResourceInput = buildChannelFirstProductDeletedResourceProfile(inspected, domainProfiles, graphProfiles, policyProfiles, evaluatorProfiles, {
    domain: domainSchemaSha, graph: graphSchemaSha, policy: policySchemaSha, evaluator: evaluatorSchemaSha,
  });
  channelDeletedResourceResult = { ...normalizeResourceProfile(channelDeletedResourceInput, inspected, knownResourceProfiles), schemaSha: resourceSchemaSha };
  channelProgressInput = buildChannelProgressProfile(inspected, channelResourceResult);
  channelProgressResult = { ...normalizeProgressProfile(channelProgressInput, inspected, channelResourceResult, knownResourceProfiles), schemaSha: progressSchemaSha };
  channelDeletedProgressInput = buildChannelFirstProductDeletedProgressProfile(inspected, channelDeletedResourceResult);
  channelDeletedProgressResult = { ...normalizeProgressProfile(channelDeletedProgressInput, inspected, channelDeletedResourceResult, knownResourceProfiles), schemaSha: progressSchemaSha };
  channelStageInput = buildChannelStageProfile(inspected, channelResourceResult, channelProgressResult, knownResourceProfiles);
  channelStageResult = { ...normalizeStageProfile(channelStageInput, inspected, channelResourceResult, channelProgressResult, knownResourceProfiles), schemaSha: stageSchemaSha };
  channelDeletedStageInput = buildChannelStageFirstProductDeletedProfile(inspected, channelDeletedResourceResult, channelDeletedProgressResult, knownResourceProfiles);
  channelDeletedStageResult = { ...normalizeStageProfile(channelDeletedStageInput, inspected, channelDeletedResourceResult, channelDeletedProgressResult, knownResourceProfiles), schemaSha: stageSchemaSha };
  channelProfileInputs = buildChannelProfiles(inspected, channelResourceResult, channelProgressResult, channelStageResult, channelDeletedResourceResult, channelDeletedProgressResult, channelDeletedStageResult);
  channelProfiles = [
    normalizeChannelProfile(channelProfileInputs[0], inspected, channelResourceResult, channelProgressResult, channelStageResult),
    normalizeChannelProfile(channelProfileInputs[1], inspected, channelDeletedResourceResult, channelDeletedProgressResult, channelDeletedStageResult),
  ];
  channelDeletedInput = buildChannelFirstProductDeletedProfile(inspected, channelDeletedResourceResult, channelDeletedProgressResult, channelDeletedStageResult);
  channelDeletedProfile = normalizeChannelProfile(channelDeletedInput, inspected, channelDeletedResourceResult, channelDeletedProgressResult, channelDeletedStageResult);
  assert.deepEqual(channelProfiles.map(({ normalized }) => normalized.id), ['channel.synthetic-evaluator-and-audit', 'channel.synthetic-secondary-work']);
});

let packageOutputSelectedInput;
let packageOutputSelectedResult;
let packageOutputDeletedInput;
let packageOutputDeletedResult;
await runCase('normalize-program-package-output-profiles', () => {
  packageOutputSelectedInput = buildOutputProfile('synthetic-stage-channels-package', inspected, channelResourceResult, channelProgressResult, { structured: true });
  packageOutputSelectedResult = { ...normalizeOutputProfile(packageOutputSelectedInput, inspected, channelResourceResult, channelProgressResult), schemaSha: outputSchemaSha };
  packageOutputDeletedInput = buildOutputProfile('synthetic-stage-channels-package', inspected, channelDeletedResourceResult, channelDeletedProgressResult, { structured: true });
  packageOutputDeletedResult = { ...normalizeOutputProfile(packageOutputDeletedInput, inspected, channelDeletedResourceResult, channelDeletedProgressResult), schemaSha: outputSchemaSha };
  assert.equal(packageOutputSelectedResult.normalized.id, packageOutputDeletedResult.normalized.id);
  assert.notDeepEqual(packageOutputSelectedResult.identity, packageOutputDeletedResult.identity);
});

const withSchema = (result, schemaSha) => ({ ...result, schemaSha });
let programPackageFixtures;
let programPackageProfiles;
let searchPrograms;
let executionPackages;
let programPackageSchemaSha;
let searchProgramSchemaSha;
let executionPackageSchemaSha;
let compatiblePairSchemaSha;
await runCase('normalize-program-package-profiles', async () => {
  programPackageSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'program-package-profile.schema.json')));
  searchProgramSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'search-program.schema.json')));
  executionPackageSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'execution-package.schema.json')));
  compatiblePairSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'compatible-pair-record.schema.json')));
  const coreContext = {
    profileResults: [withSchema(domainProfiles[0], domainSchemaSha), withSchema(graphProfiles[0], graphSchemaSha), withSchema(policyProfiles[0], policySchemaSha), withSchema(resourceProfiles[0], resourceSchemaSha), withSchema(progressProfiles[0], progressSchemaSha), withSchema(outputProfiles[0], outputSchemaSha)],
    resourceResult: withSchema(resourceProfiles[0], resourceSchemaSha), progressResult: withSchema(progressProfiles[0], progressSchemaSha), outputResult: withSchema(outputProfiles[0], outputSchemaSha), stageResult: null, channelResult: null, sessionResult: null,
  };
  const selectedContext = {
    profileResults: [withSchema(domainProfiles[1], domainSchemaSha), withSchema(graphProfiles[1], graphSchemaSha), withSchema(policyProfiles[1], policySchemaSha), withSchema(evaluatorProfiles[0], evaluatorSchemaSha), channelResourceResult, channelProgressResult, packageOutputSelectedResult, channelStageResult, withSchema(channelProfiles[0], channelSchemaSha)],
    resourceResult: channelResourceResult, progressResult: channelProgressResult, outputResult: packageOutputSelectedResult, stageResult: channelStageResult, channelResult: withSchema(channelProfiles[0], channelSchemaSha), sessionResult: null,
  };
  const secondaryContext = {
    profileResults: [withSchema(domainProfiles[1], domainSchemaSha), withSchema(graphProfiles[1], graphSchemaSha), withSchema(policyProfiles[1], policySchemaSha), withSchema(evaluatorProfiles[0], evaluatorSchemaSha), channelDeletedResourceResult, channelDeletedProgressResult, packageOutputDeletedResult, channelDeletedStageResult, withSchema(channelProfiles[1], channelSchemaSha)],
    resourceResult: channelDeletedResourceResult, progressResult: channelDeletedProgressResult, outputResult: packageOutputDeletedResult, stageResult: channelDeletedStageResult, channelResult: withSchema(channelProfiles[1], channelSchemaSha), sessionResult: null,
  };
  const deletedContext = {
    profileResults: [withSchema(domainProfiles[1], domainSchemaSha), withSchema(graphProfiles[1], graphSchemaSha), withSchema(policyProfiles[1], policySchemaSha), withSchema(evaluatorProfiles[0], evaluatorSchemaSha), channelDeletedResourceResult, channelDeletedProgressResult, packageOutputDeletedResult, channelDeletedStageResult, withSchema(channelDeletedProfile, channelSchemaSha)],
    resourceResult: channelDeletedResourceResult, progressResult: channelDeletedProgressResult, outputResult: packageOutputDeletedResult, stageResult: channelDeletedStageResult, channelResult: withSchema(channelDeletedProfile, channelSchemaSha), sessionResult: null,
  };
  programPackageFixtures = [
    buildProgramPackageProfile(inspected, coreContext, 'core-only'),
    buildProgramPackageProfile(inspected, selectedContext, 'selected-extension'),
    buildProgramPackageProfile(inspected, secondaryContext, 'secondary-capability'),
    buildProgramPackageProfile(inspected, deletedContext, 'selected-extension'),
  ];
  programPackageProfiles = programPackageFixtures.map(({ input, context }) => normalizeProgramPackageProfile(input, inspected, context));
  assert.deepEqual(programPackageProfiles.map(({ normalized }) => normalized.id), ['program-package.core-only', 'program-package.selected-extension', 'program-package.secondary-capability', 'program-package.selected-extension']);
});

await runCase('compose-canonical-search-programs', () => {
  searchPrograms = programPackageProfiles.map(composeSearchProgram);
  assert(searchPrograms.every(({ normalized }) => normalized.schema === 'cuda-mcgs.search-program/0.2.0'));
  assert.equal(new Set(searchPrograms.map(({ identity }) => identity.sha256)).size, 4);
});

await runCase('build-canonical-execution-packages', () => {
  executionPackages = programPackageProfiles.map((profile, index) => buildExecutionPackage(profile, searchPrograms[index]));
  assert(executionPackages.every(({ normalized }) => normalized.schema === 'cuda-mcgs.execution-package/0.2.0'));
  assert.equal(new Set(executionPackages.map(({ identity }) => identity.sha256)).size, 4);
});

const withoutGenerator = (profile) => {
  const template = clone(profile);
  delete template.generator;
  return template;
};
let convenientComposerCall;
let explicitResolvedComposerInput;
let convenientComposition;
let explicitComposition;
await runCase('resolved-composer-schema-closed', () => {
  assert.equal(resolvedComposerInputSchema.additionalProperties, false);
  assert.equal(resolvedComposerInputSchema.properties.schema.const, 'cuda-mcgs.resolved-composer-input/0.2.0');
  const visit = (node, location = '#') => {
    if (Array.isArray(node)) return node.forEach((entry, index) => visit(entry, `${location}/${index}`));
    if (!node || typeof node !== 'object') return;
    if (node.type === 'object') assert.equal(node.additionalProperties, false, `${location} must be closed`);
    for (const [key, value] of Object.entries(node)) visit(value, `${location}/${key}`);
  };
  visit(resolvedComposerInputSchema);
});

await runCase('composer-convenience-explicit-equivalence', () => {
  const template = withoutGenerator(programPackageFixtures[0].input);
  convenientComposerCall = resolveReferenceConvenienceCall(template);
  explicitResolvedComposerInput = createResolvedComposerInput(template, clone(referenceComposerPreset));
  assert.deepEqual(convenientComposerCall.resolvedInput.normalized, explicitResolvedComposerInput.normalized);
  assert.deepEqual(convenientComposerCall.resolvedInput.identity, explicitResolvedComposerInput.identity);
  assert.deepEqual(convenientComposerCall.trace, {
    kind: 'convenience-defaults',
    supplied: [],
    resolved: ['generator.maxCallDepth', 'generator.maxFunctions', 'generator.maxSourceBytes'],
  });
  assert.equal('trace' in convenientComposerCall.resolvedInput.normalized, false);
});

await runCase('composer-default-provenance-complete', () => {
  const { policy, rules } = convenientComposerCall.resolvedInput.normalized.resolution;
  assert.deepEqual(policy, {
    id: referenceComposerPreset.id,
    version: referenceComposerPreset.version,
    revision: referenceComposerPreset.revision,
  });
  assert.deepEqual(rules.map(({ field }) => field), ['generator.maxCallDepth', 'generator.maxFunctions', 'generator.maxSourceBytes']);
  assert(rules.every(({ owner, version, revision, selection, material, reason, value }) => owner === policy.id
    && version === policy.version
    && revision === policy.revision
    && selection === 'default-equivalent'
    && material === true
    && reason.startsWith('composer.reason.')
    && typeof value === 'string'));
});

await runCase('composer-one-canonical-downstream-path', () => {
  convenientComposition = composeResolvedEngine(convenientComposerCall.resolvedInput.normalized, inspected, programPackageFixtures[0].context);
  explicitComposition = composeResolvedEngine(explicitResolvedComposerInput.normalized, inspected, programPackageFixtures[0].context);
  assert.deepEqual(convenientComposition.compositionProfile.identity, explicitComposition.compositionProfile.identity);
  assert.deepEqual(convenientComposition.searchProgram.identity, explicitComposition.searchProgram.identity);
  assert.deepEqual(convenientComposition.executionPackage.identity, explicitComposition.executionPackage.identity);
  assert.deepEqual(convenientComposition.publication.identity, explicitComposition.publication.identity);
  assert.deepEqual(convenientComposition.executionPackage.identity, executionPackages[0].identity);
});

await runCase('composer-resolved-input-order-independent', () => {
  const reordered = clone(explicitResolvedComposerInput.normalized);
  reordered.resolution.rules.reverse();
  assert.deepEqual(normalizeResolvedComposerInput(reordered).identity, explicitResolvedComposerInput.identity);
});

await runCase('composer-byte-repeatability', () => {
  const repeated = composeResolvedEngine(clone(explicitResolvedComposerInput.normalized), inspected, programPackageFixtures[0].context);
  assert.deepEqual(repeated.resolvedInput.identity, explicitComposition.resolvedInput.identity);
  assert.deepEqual(repeated.publication.identity, explicitComposition.publication.identity);
});

await runCase('composer-explicit-override-identity-sensitive', () => {
  const generator = clone(referenceComposerPreset);
  generator.maxFunctions = '2048';
  const overridden = createResolvedComposerInput(withoutGenerator(programPackageFixtures[0].input), generator);
  assert.notDeepEqual(overridden.identity, explicitResolvedComposerInput.identity);
  assert.equal(overridden.normalized.resolution.rules.find(({ field }) => field === 'generator.maxFunctions').selection, 'explicit-override');
  const composition = composeResolvedEngine(overridden.normalized, inspected, programPackageFixtures[0].context);
  assert.notDeepEqual(composition.compositionProfile.identity, explicitComposition.compositionProfile.identity);
  assert.notDeepEqual(composition.executionPackage.identity, explicitComposition.executionPackage.identity);
});

await runCase('composer-material-policy-version-identity-sensitive', () => {
  const versioned = clone(explicitResolvedComposerInput.normalized);
  versioned.profile.generator.version = '0.1.1';
  versioned.resolution.policy.version = '0.1.1';
  for (const rule of versioned.resolution.rules) {
    rule.version = '0.1.1';
    rule.selection = 'explicit-override';
  }
  const normalized = normalizeResolvedComposerInput(versioned);
  assert.notDeepEqual(normalized.identity, explicitResolvedComposerInput.identity);
  const composition = composeResolvedEngine(normalized.normalized, inspected, programPackageFixtures[0].context);
  assert.notDeepEqual(composition.executionPackage.identity, explicitComposition.executionPackage.identity);
});

await runCase('composer-convenience-deletion-complete-surface-coherent', async () => {
  const composerSource = await readFile(path.join(experimentRoot, 'src', 'composer.mjs'), 'utf8');
  assert.equal(composerSource.includes('composer-presets.mjs'), false);
  const direct = composeResolvedEngine(clone(explicitResolvedComposerInput.normalized), inspected, programPackageFixtures[0].context);
  assert.deepEqual(direct.publication.identity, convenientComposition.publication.identity);
});

await runCase('composer-static-no-runtime-interpreter-or-registry', async () => {
  const composerSource = await readFile(path.join(experimentRoot, 'src', 'composer.mjs'), 'utf8');
  const presetSource = await readFile(path.join(experimentRoot, 'src', 'composer-presets.mjs'), 'utf8');
  for (const source of [composerSource, presetSource]) {
    assert.equal(/\beval\s*\(/u.test(source), false);
    assert.equal(/new\s+Function\b/u.test(source), false);
    assert.equal(/runtime[- ]registry|node:ffi|\.cu\b|\.ptx\b/iu.test(source), false);
  }
});

await runCase('reject-composer-resolved-input-unknown-field', () => {
  const mutated = clone(explicitResolvedComposerInput.normalized);
  mutated.adaptation = 'post-ignition';
  assert.throws(() => normalizeResolvedComposerInput(mutated), { code: 'COMPOSER_ROOT_FIELDS' });
});

await runCase('reject-composer-owner-conflict', () => {
  const mutated = clone(explicitResolvedComposerInput.normalized);
  mutated.resolution.rules[0].owner = 'composer.conflicting-owner';
  const result = tryComposeResolvedEngine(mutated, inspected, programPackageFixtures[0].context);
  assert.equal(result.status, 'failure');
  assert.equal(result.publication, null);
  assert.equal(result.diagnostic.code, 'COMPOSER_RULE_OWNER');
});

await runCase('reject-composer-reason-conflict', () => {
  const mutated = clone(explicitResolvedComposerInput.normalized);
  mutated.resolution.rules[0].reason = 'composer.reason.bounded-function-set';
  assert.throws(() => normalizeResolvedComposerInput(mutated), { code: 'COMPOSER_RULE_REASON' });
});

await runCase('reject-composer-rule-version-conflict', () => {
  const mutated = clone(explicitResolvedComposerInput.normalized);
  mutated.resolution.rules[0].version = '0.1.1';
  assert.throws(() => normalizeResolvedComposerInput(mutated), { code: 'COMPOSER_RULE_OWNER' });
});

await runCase('reject-composer-missing-foundational-profile', () => {
  const mutated = clone(explicitResolvedComposerInput.normalized);
  delete mutated.profile.semanticEngine.outputProfile;
  const result = tryComposeResolvedEngine(mutated, inspected, programPackageFixtures[0].context);
  assert.equal(result.status, 'failure');
  assert.equal(result.publication, null);
  assert.equal(result.diagnostic.code, 'COMPOSE_ENGINE_FIELDS');
});

await runCase('composer-partial-failure-publishes-nothing', () => {
  const mutated = clone(explicitResolvedComposerInput.normalized);
  mutated.profile.sourceUnits[0].source += ' ';
  assert.doesNotThrow(() => normalizeResolvedComposerInput(mutated));
  const result = tryComposeResolvedEngine(mutated, inspected, programPackageFixtures[0].context);
  assert.equal(result.status, 'failure');
  assert.equal(result.publication, null);
  assert.equal(result.diagnostic.code, 'COMPOSE_SOURCE_IDENTITY');
});

function evaluatorProfileReference(result) {
  return {
    id: result.normalized.id,
    schema: { id: result.normalized.schema, version: '0.2.0', sha256: evaluatorSchemaSha },
    identity: { algorithm: result.identity.algorithm, sha256: result.identity.sha256 },
  };
}

function knownProfilesFor(...results) {
  const byId = new Map(knownResourceProfiles.map((result) => [result.normalized.id, result]));
  for (const result of results.filter(Boolean)) byId.set(result.normalized.id, result);
  return [...byId.values()];
}

function buildOwnerChain({
  label,
  domain,
  graph,
  policy,
  evaluator = null,
  resourceOptions = {},
  outputOptions = {},
  sessionOptions = null,
  stageOptions = null,
  stageLabel = label,
  channelOptions = null,
  channelLabel = label,
}) {
  const selected = { domain, graph, policy, evaluator };
  const schemaShas = { domain: domainSchemaSha, graph: graphSchemaSha, policy: policySchemaSha, evaluator: evaluatorSchemaSha };
  const knownProfiles = knownProfilesFor(
    withSchema(domain, domainSchemaSha),
    withSchema(graph, graphSchemaSha),
    withSchema(policy, policySchemaSha),
    evaluator ? withSchema(evaluator, evaluatorSchemaSha) : null,
  );
  const resource = withSchema(normalizeResourceProfile(
    buildResourceProfile(label, inspected, selected, schemaShas, resourceOptions),
    inspected,
    knownProfiles,
  ), resourceSchemaSha);
  const progress = withSchema(normalizeProgressProfile(
    buildProgressProfile(label, inspected, resource),
    inspected,
    resource,
    knownProfiles,
  ), progressSchemaSha);
  const output = withSchema(normalizeOutputProfile(
    buildOutputProfile(label, inspected, resource, progress, outputOptions),
    inspected,
    resource,
    progress,
  ), outputSchemaSha);
  const session = sessionOptions === null ? null : withSchema(normalizeSessionProfile(
    buildSessionProfile(label, inspected, resource, progress, output, sessionOptions),
    inspected,
    resource,
    progress,
    output,
  ), sessionSchemaSha);
  const stage = stageOptions === null ? null : withSchema(normalizeStageProfile(
    buildStageProfile(stageLabel, inspected, resource, progress, knownProfiles, stageOptions),
    inspected,
    resource,
    progress,
    knownProfiles,
  ), stageSchemaSha);
  const channel = channelOptions === null ? null : withSchema(normalizeChannelProfile(
    buildChannelProfile(channelLabel, inspected, resource, progress, stage, channelOptions),
    inspected,
    resource,
    progress,
    stage,
  ), channelSchemaSha);
  const profileResults = [
    withSchema(domain, domainSchemaSha),
    withSchema(graph, graphSchemaSha),
    withSchema(policy, policySchemaSha),
    ...(evaluator ? [withSchema(evaluator, evaluatorSchemaSha)] : []),
    resource,
    progress,
    output,
    ...(session ? [session] : []),
    ...(stage ? [stage] : []),
    ...(channel ? [channel] : []),
  ];
  return {
    resource,
    progress,
    output,
    session,
    stage,
    channel,
    context: { profileResults, resourceResult: resource, progressResult: progress, outputResult: output, sessionResult: session, stageResult: stage, channelResult: channel },
  };
}

function composeProgramPackageFixture(fixture) {
  const resolvedInput = createResolvedComposerInput(withoutGenerator(fixture.input), clone(referenceComposerPreset));
  return { fixture, composition: composeResolvedEngine(resolvedInput.normalized, inspected, fixture.context) };
}

function composeOwnerChain(chain, label) {
  return composeProgramPackageFixture(buildProgramPackageProfile(inspected, chain.context, label));
}

function dispositionRecords(context) {
  const records = new Map(context.profileResults.map((result) => [result.normalized.id, result.identity.sha256]));
  for (const capability of context.stageResult?.normalized.capabilities ?? []) {
    records.set(capability.id, canonicalIdentity(capability).sha256);
  }
  for (const channel of context.channelResult?.normalized.channels ?? []) {
    records.set(channel.id, canonicalIdentity(channel).sha256);
  }
  return records;
}

function deriveOwnerDisposition(beforeContext, afterContext) {
  const before = dispositionRecords(beforeContext);
  const after = dispositionRecords(afterContext);
  return {
    removedOwners: [...before.keys()].filter((owner) => !after.has(owner)).sort(),
    changedOwners: [...before.keys()].filter((owner) => after.has(owner) && before.get(owner) !== after.get(owner)).sort(),
  };
}

function syntheticProductResult() {
  const normalized = {
    schema: 'product.synthetic-profile/0.2.0',
    id: 'product.synthetic-deletion',
    programContribution: {
      kind: 'device-program',
      language: 'restricted-device-js',
      sourceIdentity: syntheticContentIdentity('product.synthetic-deletion:restricted-device-js-source'),
    },
  };
  return {
    normalized,
    identity: syntheticContentIdentity('product.synthetic-deletion:profile'),
    schemaSha: syntheticContentIdentity('product.synthetic-profile/0.2.0:schema').sha256,
  };
}

let deletionMatrix;
let materiallyDifferentCompositions;
await runCase('compose-cross-profile-deletion-matrix', () => {
  const selectedPolicyInput = buildPolicyProfile(
    'deletion-model', inspected, domainProfiles[1], graphProfiles[1], domainSchemaSha, graphSchemaSha,
    { evaluatorMode: 'combined', evaluatorProfile: evaluatorProfileReference(evaluatorProfiles[0]), value: 'vector', reservation: true, admissionMode: 'sampled', stochastic: true },
  );
  const absentPolicyInput = buildPolicyProfile(
    'deletion-model', inspected, domainProfiles[1], graphProfiles[1], domainSchemaSha, graphSchemaSha,
    { evaluatorMode: 'absent', value: 'vector', reservation: true, admissionMode: 'sampled', stochastic: true },
  );
  const selectedPolicy = normalizePolicyProfile(selectedPolicyInput, inspected, domainProfiles[1], graphProfiles[1]);
  const absentPolicy = normalizePolicyProfile(absentPolicyInput, inspected, domainProfiles[1], graphProfiles[1]);

  const evaluatorBefore = buildOwnerChain({ label: 'deletion-model', domain: domainProfiles[1], graph: graphProfiles[1], policy: selectedPolicy, evaluator: evaluatorProfiles[0], outputOptions: { structured: true } });
  const evaluatorAfter = buildOwnerChain({ label: 'deletion-model', domain: domainProfiles[1], graph: graphProfiles[1], policy: absentPolicy, outputOptions: { structured: true } });
  assert.equal(evaluatorAfter.context.profileResults.some(({ normalized }) => normalized.id.startsWith('evaluator.')), false);
  assert.equal(evaluatorAfter.resource.normalized.contributors.some(({ contract }) => contract.id === 'SPEC-0009'), false);

  const liveBefore = buildOwnerChain({ label: 'deletion-live', domain: domainProfiles[1], graph: graphProfiles[1], policy: policyProfiles[1], evaluator: evaluatorProfiles[0], resourceOptions: { liveOutput: true, session: true }, outputOptions: { structured: true, live: true }, sessionOptions: { attention: false } });
  const liveAfter = buildOwnerChain({ label: 'deletion-live', domain: domainProfiles[1], graph: graphProfiles[1], policy: policyProfiles[1], evaluator: evaluatorProfiles[0], resourceOptions: { session: true }, outputOptions: { structured: true }, sessionOptions: { attention: false } });
  assert.equal(liveBefore.output.normalized.observations.kind, 'selected');
  assert.equal(liveAfter.output.normalized.observations.kind, 'absent');
  assert.equal(liveAfter.resource.normalized.classes.some(({ id }) => id.endsWith('class-live-observation')), false);
  assert.deepEqual(liveAfter.progress.normalized.closure.outputBorrow, { kind: 'none' });

  const sessionBefore = buildOwnerChain({ label: 'deletion-session', domain: domainProfiles[1], graph: graphProfiles[1], policy: policyProfiles[1], evaluator: evaluatorProfiles[0], resourceOptions: { session: true }, outputOptions: { structured: true }, sessionOptions: {} });
  const sessionAfter = buildOwnerChain({ label: 'deletion-session', domain: domainProfiles[1], graph: graphProfiles[1], policy: policyProfiles[1], evaluator: evaluatorProfiles[0], outputOptions: { structured: true } });
  assert.equal(sessionAfter.session, null);
  assert.equal(sessionAfter.resource.normalized.contributors.some(({ contract }) => contract.id === 'SPEC-0006'), false);
  assert.deepEqual(sessionAfter.progress.normalized.noProgress.externalWait, { kind: 'absent' });

  const attentionBefore = buildOwnerChain({ label: 'deletion-attention', domain: domainProfiles[1], graph: graphProfiles[1], policy: policyProfiles[1], evaluator: evaluatorProfiles[0], resourceOptions: { liveOutput: true, session: true }, outputOptions: { structured: true, live: true }, sessionOptions: {} });
  const attentionAfter = buildOwnerChain({ label: 'deletion-attention', domain: domainProfiles[1], graph: graphProfiles[1], policy: policyProfiles[1], evaluator: evaluatorProfiles[0], resourceOptions: { liveOutput: true, session: true }, outputOptions: { structured: true, live: true }, sessionOptions: { attention: false } });
  assert.equal(attentionBefore.session.normalized.attention.kind, 'selected');
  assert.equal(attentionAfter.session.normalized.attention.kind, 'absent');
  assert.equal(attentionAfter.session.normalized.commands.inputs.some(({ kind }) => kind === 'attention'), false);
  assert.equal(attentionAfter.session.normalized.ports.some(({ id }) => id === 'applyAttentionChange'), false);
  assert.deepEqual(attentionBefore.resource.identity, attentionAfter.resource.identity);
  assert.deepEqual(attentionBefore.progress.identity, attentionAfter.progress.identity);
  assert.deepEqual(attentionBefore.output.identity, attentionAfter.output.identity);

  const stageBefore = buildOwnerChain({ label: 'deletion-stage', domain: domainProfiles[0], graph: graphProfiles[0], policy: policyProfiles[0], resourceOptions: { stage: true }, outputOptions: { structured: true }, stageOptions: {} });
  const stageAfter = buildOwnerChain({ label: 'deletion-stage', domain: domainProfiles[0], graph: graphProfiles[0], policy: policyProfiles[0], outputOptions: { structured: true } });
  assert.equal(stageAfter.stage, null);
  assert.equal(stageAfter.resource.normalized.contributors.some(({ contract }) => contract.id === 'SPEC-0003'), false);
  assert.equal(stageAfter.progress.normalized.contributors.some(({ contract }) => contract.id === 'SPEC-0003'), false);

  const channelBefore = buildOwnerChain({ label: 'deletion-channel', domain: domainProfiles[1], graph: graphProfiles[1], policy: policyProfiles[1], evaluator: evaluatorProfiles[0], resourceOptions: { stage: true, channel: true }, outputOptions: { structured: true }, stageOptions: { channel: true }, stageLabel: 'synthetic-channel-stage', channelOptions: { required: true } });
  const channelAfter = buildOwnerChain({ label: 'deletion-channel', domain: domainProfiles[1], graph: graphProfiles[1], policy: policyProfiles[1], evaluator: evaluatorProfiles[0], resourceOptions: { stage: true }, outputOptions: { structured: true }, stageOptions: {}, stageLabel: 'synthetic-channel-stage' });
  assert.equal(channelBefore.channel.normalized.channels.length, 2);
  assert.equal(channelAfter.channel, null);
  assert.equal(channelAfter.stage.normalized.capabilities.some(({ channels }) => channels.length > 0), false);
  assert.equal(channelAfter.resource.normalized.contributors.some(({ contract }) => contract.id === 'SPEC-0004'), false);
  assert.equal(channelAfter.progress.normalized.contributors.some(({ contract }) => contract.id === 'SPEC-0004'), false);

  const productBase = buildOwnerChain({ label: 'deletion-product', domain: domainProfiles[0], graph: graphProfiles[0], policy: policyProfiles[0], outputOptions: { structured: true } });
  const productBefore = { ...productBase, context: { ...productBase.context, profileResults: [...productBase.context.profileResults, syntheticProductResult()] } };
  const productAfter = productBase;
  const capabilityProductBefore = composeProgramPackageFixture(programPackageFixtures[1]);
  const capabilityProductAfter = composeProgramPackageFixture(programPackageFixtures[3]);

  const rows = [
    { id: 'evaluator', before: evaluatorBefore, after: evaluatorAfter, sourceChanged: true },
    { id: 'live-output', before: liveBefore, after: liveAfter, sourceChanged: false },
    { id: 'search-session', before: sessionBefore, after: sessionAfter, sourceChanged: true },
    { id: 'attention', before: attentionBefore, after: attentionAfter, sourceChanged: false },
    { id: 'stage-substrate', before: stageBefore, after: stageAfter, sourceChanged: true },
    { id: 'async-channel', before: channelBefore, after: channelAfter, sourceChanged: true },
    {
      id: 'capability-product',
      before: { context: programPackageFixtures[1].context },
      after: { context: programPackageFixtures[3].context },
      sourceChanged: true,
      composedBefore: capabilityProductBefore,
      composedAfter: capabilityProductAfter,
    },
    { id: 'namespaced-product', before: productBefore, after: productAfter, sourceChanged: true },
  ];
  deletionMatrix = rows.map((row) => {
    const before = row.composedBefore ?? composeOwnerChain(row.before, `matrix-${row.id}`);
    const after = row.composedAfter ?? composeOwnerChain(row.after, `matrix-${row.id}`);
    const disposition = deriveOwnerDisposition(row.before.context, row.after.context);
    return {
      ...row,
      ...disposition,
      beforeComposition: before.composition,
      afterComposition: after.composition,
    };
  });

  assert.deepEqual(deletionMatrix.find(({ id }) => id === 'evaluator').removedOwners, ['evaluator.synthetic-vector-combined']);
  assert.deepEqual(deletionMatrix.find(({ id }) => id === 'search-session').removedOwners, ['session.deletion-session']);
  assert(deletionMatrix.find(({ id }) => id === 'stage-substrate').removedOwners.includes('extension.deletion-stage'));
  assert(deletionMatrix.find(({ id }) => id === 'async-channel').removedOwners.includes('channel.deletion-channel'));
  assert.deepEqual(deletionMatrix.find(({ id }) => id === 'namespaced-product').removedOwners, ['product.synthetic-deletion']);

  const stateless = buildOwnerChain({ label: 'identity-stateless', domain: domainProfiles[2], graph: graphProfiles[3], policy: policyProfiles[2], evaluator: evaluatorProfiles[1] });
  const proof = buildOwnerChain({ label: 'identity-proof', domain: domainProfiles[2], graph: graphProfiles[2], policy: policyProfiles[3], evaluator: evaluatorProfiles[2], outputOptions: { structured: true } });
  materiallyDifferentCompositions = [
    explicitComposition,
    deletionMatrix.find(({ id }) => id === 'evaluator').beforeComposition,
    composeOwnerChain(stateless, 'identity-stateless').composition,
    composeOwnerChain(proof, 'identity-proof').composition,
  ];
});

await runCase('materially-different-composer-engines-cannot-collide', () => {
  assert.equal(new Set(materiallyDifferentCompositions.map(({ compositionProfile }) => compositionProfile.semanticEngineIdentity.sha256)).size, materiallyDifferentCompositions.length);
  assert.equal(new Set(materiallyDifferentCompositions.map(({ searchProgram }) => searchProgram.identity.sha256)).size, materiallyDifferentCompositions.length);
  assert.equal(new Set(materiallyDifferentCompositions.map(({ executionPackage }) => executionPackage.identity.sha256)).size, materiallyDifferentCompositions.length);
});

for (const matrixId of ['evaluator', 'live-output', 'search-session', 'attention', 'stage-substrate', 'async-channel', 'capability-product', 'namespaced-product']) {
  await runCase(`canonical-composer-${matrixId}-deletion`, () => {
    const row = deletionMatrix.find(({ id }) => id === matrixId);
    row.summary = assertComposedDeletion(row.beforeComposition, row.afterComposition, {
      id: row.id,
      removedOwners: row.removedOwners,
      changedOwners: row.changedOwners,
      sourceChanged: row.sourceChanged,
    });
  });
}

await runCase('deletion-matrix-public-cuda-js-contract-only', () => {
  for (const row of deletionMatrix) {
    for (const composition of [row.beforeComposition, row.afterComposition]) {
      const projection = composition.executionPackage.normalized.cudaJs;
      assert.equal(projection.schema, 'cuda-mcgs.cuda-js-request-projection/0.2.0');
      assert.deepEqual(projection.requirements, composition.searchProgram.normalized.publicRequirements.map(({ contract }) => contract));
      assert.equal(JSON.stringify(projection).includes('semanticOwner'), false);
      assert.equal(JSON.stringify(projection).includes('ownerProfile'), false);
    }
  }
});

await runCase('deletion-matrix-rejects-undeclared-owner-change', () => {
  const row = deletionMatrix.find(({ id }) => id === 'live-output');
  assert(row.changedOwners.length > 1);
  assert.throws(() => assertComposedDeletion(row.beforeComposition, row.afterComposition, {
    id: row.id,
    removedOwners: row.removedOwners,
    changedOwners: row.changedOwners.slice(1),
    sourceChanged: row.sourceChanged,
  }), { code: 'COMPOSE_DELETION_UNEXPLAINED_CHANGE' });
});

await runCase('deletion-matrix-product-assumption-absence', () => {
  const serialized = JSON.stringify(deletionMatrix.flatMap((row) => [row.beforeComposition.executionPackage.normalized, row.afterComposition.executionPackage.normalized]));
  assert(!/(?:chess|connect(?:-?4|[- ]four)|board|player|zero-sum|alternating-turn|best-move|multipv)/i.test(serialized));
});

await runCase('program-package-schemas-closed', () => {
  for (const schema of [programPackageProfileSchema, searchProgramSchema, executionPackageSchema, compatiblePairRecordSchema]) {
    assert.equal(schema.additionalProperties, false);
    const visit = (node, location = '#') => {
      if (Array.isArray(node)) return node.forEach((entry, index) => visit(entry, `${location}/${index}`));
      if (!node || typeof node !== 'object') return;
      if (node.type === 'object') assert.equal(node.additionalProperties, false, `${schema.$id}${location} must be closed`);
      for (const [key, value] of Object.entries(node)) visit(value, `${location}/${key}`);
    };
    visit(schema);
  }
  assert.equal(programPackageProfileSchema.properties.schema.const, 'cuda-mcgs.program-package-profile/0.2.0');
  assert.equal(searchProgramSchema.properties.schema.const, 'cuda-mcgs.search-program/0.2.0');
  assert.equal(executionPackageSchema.properties.schema.const, 'cuda-mcgs.execution-package/0.2.0');
  assert.equal(compatiblePairRecordSchema.properties.schema.const, 'cuda-mcgs.compatible-pair-record/0.2.0');
  assert.deepEqual(compatiblePairRecordSchema.properties.status.enum, ['reference-fixture', 'exact-compatible-pair']);
});

await runCase('program-package-order-independent', () => {
  const mutated = clone(programPackageFixtures[1].input);
  for (const key of ['sourceUnits', 'functions', 'programUnits', 'publicRequirements', 'resources', 'operations']) mutated[key].reverse();
  mutated.semanticEngine.profiles.reverse(); mutated.deletion.records.reverse();
  assert.deepEqual(normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[1].context).identity, programPackageProfiles[1].identity);
});

await runCase('search-program-byte-repeatability', () => {
  const repeated = composeSearchProgram(normalizeProgramPackageProfile(clone(programPackageFixtures[1].input), inspected, programPackageFixtures[1].context));
  assert.deepEqual(repeated.identity, searchPrograms[1].identity);
  assert.equal(repeated.normalized.source, searchPrograms[1].normalized.source);
});

await runCase('execution-package-byte-repeatability', () => {
  const repeated = buildExecutionPackage(programPackageProfiles[1], searchPrograms[1]);
  assert.deepEqual(repeated.identity, executionPackages[1].identity);
});

await runCase('program-source-content-sensitive', () => {
  const mutated = clone(programPackageFixtures[0].input);
  mutated.sourceUnits[0].source = `${mutated.sourceUnits[0].source.trimEnd()}\n// content-sensitive\n`;
  mutated.sourceUnits[0].sourceIdentity.sha256 = sourceTextSha256(Buffer.from(mutated.sourceUnits[0].source, 'utf8'));
  const changed = normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context);
  assert.notDeepEqual(changed.identity, programPackageProfiles[0].identity);
  assert.notDeepEqual(composeSearchProgram(changed).identity, searchPrograms[0].identity);
});

await runCase('program-metadata-content-sensitive', () => {
  const mutated = clone(programPackageFixtures[0].input);
  mutated.functions.find(({ kind }) => kind === 'kernel').semanticRole = 'engine.execute-alternate';
  assert.notDeepEqual(normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context).identity, programPackageProfiles[0].identity);
});

await runCase('core-only-extension-absence', () => {
  const profile = programPackageProfiles[0].normalized;
  assert.deepEqual(profile.semanticEngine.stageProfile, { kind: 'absent' });
  assert.deepEqual(profile.semanticEngine.channelProfile, { kind: 'absent' });
  assert(!profile.sourceUnits.some(({ kind }) => ['stage-capability', 'channel'].includes(kind)));
  assert(!profile.publicRequirements.some(({ contract }) => contract.id === 'cuda-js.device-publication-release-acquire/0.1.0'));
});

await runCase('selected-extension-source-and-requirement-presence', () => {
  const profile = programPackageProfiles[1].normalized;
  assert.equal(profile.semanticEngine.stageProfile.kind, 'selected');
  assert.equal(profile.semanticEngine.channelProfile.kind, 'selected');
  assert(profile.sourceUnits.some(({ kind }) => kind === 'stage-capability'));
  assert(profile.sourceUnits.some(({ kind }) => kind === 'channel'));
  assert(profile.publicRequirements.some(({ contract }) => contract.id === 'cuda-js.device-publication-release-acquire/0.1.0'));
});

let removedProductOwners;
await runCase('first-consumer-deletion-zero-owned-source-residue', () => {
  const beforeProfileOwner = executionPackages[1].normalized.semantic.channelProfile.profile.id;
  removedProductOwners = searchPrograms[1].normalized.deletion.selectedOwners.filter((owner) => owner !== beforeProfileOwner && !searchPrograms[3].normalized.deletion.selectedOwners.includes(owner));
  assert.deepEqual(removedProductOwners, ['channel.synthetic-evaluator-request', 'extension-capability.synthetic-channel-stage.product-priority']);
  assertOwnerDeletion(searchPrograms[1].normalized, searchPrograms[3].normalized, removedProductOwners);
});

await runCase('first-consumer-deletion-zero-package-residue', () => {
  for (const removedOwner of removedProductOwners) assert(!JSON.stringify(executionPackages[3].normalized).includes(`\"${removedOwner}\"`));
  assert.notDeepEqual(executionPackages[1].identity, executionPackages[3].identity);
});

await runCase('materially-different-capability-package-distinct', () => {
  assert.notDeepEqual(executionPackages[1].identity, executionPackages[2].identity);
  assert.notDeepEqual(searchPrograms[1].normalized.sourceIdentity, searchPrograms[2].normalized.sourceIdentity);
});

await runCase('complete-function-source-owner-mapping', () => {
  for (const program of searchPrograms.map(({ normalized }) => normalized)) {
    const mapped = new Set(program.sourceMap.flatMap(({ functions }) => functions));
    assert.equal(mapped.size, program.functions.length);
    assert(program.functions.every(({ name, sourceUnit }) => mapped.has(name) && program.sourceMap.some(({ id }) => id === sourceUnit)));
  }
});

await runCase('stage-program-unit-declared-order', () => {
  const units = programPackageProfiles[1].normalized.programUnits.filter(({ kind }) => kind === 'stage-capability');
  assert(units.length > 0);
  assert(units.every(({ contributors, effectOrder }) => contributors.length === effectOrder.length && new Set(effectOrder).size === contributors.length));
});

await runCase('public-requirement-selected-only-closure', () => {
  const core = new Set(programPackageProfiles[0].normalized.publicRequirements.map(({ contract }) => contract.id));
  const selected = new Set(programPackageProfiles[1].normalized.publicRequirements.map(({ contract }) => contract.id));
  assert(core.has('cuda-js.device-js/0.1.0') && core.has('cuda-js.operation-lifecycle/0.1.0'));
  assert(!core.has('cuda-js.device-publication-release-acquire/0.1.0'));
  assert(selected.has('cuda-js.device-publication-release-acquire/0.1.0'));
});

await runCase('public-resource-projection-is-generic-subset', () => {
  const profileResources = programPackageProfiles[1].normalized.resources.filter(({ kind }) => kind === 'device-memory');
  const projected = executionPackages[1].normalized.cudaJs.resources;
  assert.equal(projected.length, profileResources.length);
  assert(projected.every(({ id, kind }) => /^resource-[0-9]+$/.test(id) && kind === 'device-memory'));
});

await runCase('public-operation-projection-is-generic', () => {
  const projected = executionPackages[1].normalized.cudaJs.operations;
  assert.deepEqual(projected.map(({ id }) => id), ['operation-0']);
  assert.equal(projected[0].function, 'engine_step');
  assert(projected[0].bindings.every(({ source }) => source.kind === 'resource' && /^resource-[0-9]+$/.test(source.resource)));
});

await runCase('cuda-js-projection-has-no-semantic-metadata-keys', () => {
  const projection = clone(executionPackages[1].normalized.cudaJs);
  projection.deviceProgram.source = '';
  const keys = JSON.stringify(projection);
  for (const forbidden of ['semanticEngine', 'selectedProfiles', 'entryPointRoles', 'ownerProfile', 'semanticRole', 'stageProfile', 'channelProfile', 'productData', 'searchIr']) assert(!keys.includes(forbidden));
});

await runCase('cuda-js-projection-matches-public-device-js-request', () => {
  const request = executionPackages[1].normalized.cudaJs.deviceProgram;
  assert.deepEqual(Object.keys(request).sort(), ['functions', 'source']);
  assert(request.functions.every((entry) => Object.keys(entry).sort().join(',') === 'kind,name,parameters,returns'));
});

await runCase('package-lifecycle-is-pre-ignition-closed', () => {
  assert.deepEqual(executionPackages[1].normalized.cudaJs.lifecycle, {
    compile: 'pre-ignition', allocate: 'pre-ignition', load: 'pre-ignition', admit: 'pre-ignition', ignite: 'single-device-owned-transition', cancel: 'public-lifecycle-operation', complete: 'public-lifecycle-operation', teardown: 'public-lifecycle-operation',
  });
});

let realizationOne;
let realizationMany;
await runCase('opaque-cuda-js-single-artifact-success', () => {
  realizationOne = normalizeCudaJsRealization(buildCudaJsRealizationFixture(executionPackages[1], 'selected-single', 1), executionPackages[1]);
  assert.equal(realizationOne.normalized.artifacts.length, 1);
});

await runCase('opaque-cuda-js-multiple-artifact-success', () => {
  realizationMany = normalizeCudaJsRealization(buildCudaJsRealizationFixture(executionPackages[1], 'selected-multiple', 3), executionPackages[1]);
  assert.equal(realizationMany.normalized.artifacts.length, 3);
  assert.deepEqual(executionPackages[1].identity, buildExecutionPackage(programPackageProfiles[1], searchPrograms[1]).identity);
});

await runCase('opaque-cuda-js-failure-is-not-package-success', () => {
  const failure = normalizeCudaJsRealization(buildCudaJsFailureFixture('missing-capability'), executionPackages[1]);
  assert.equal(failure.normalized.status, 'failure');
  assert.equal(failure.identity, null);
  assert.throws(() => normalizeCompatiblePair({}, executionPackages[1], searchPrograms[1], failure), { code: 'COMPOSE_PAIR_INPUT' });
});

let compatiblePairInput;
let compatiblePair;
await runCase('complete-compatible-pair-reference-record', () => {
  compatiblePairInput = buildCompatiblePairFixture(executionPackages[1], searchPrograms[1], realizationOne, 'selected-pair');
  compatiblePair = normalizeCompatiblePair(compatiblePairInput, executionPackages[1], searchPrograms[1], realizationOne);
  assert.equal(compatiblePair.normalized.claim.qualification, 'reference-only');
  assert.equal(compatiblePair.normalized.claim.native, false);
});

await runCase('compatible-pair-content-sensitive', () => {
  const mutated = clone(compatiblePairInput); mutated.environment.device = syntheticContentIdentity('different-pair-device');
  assert.notDeepEqual(normalizeCompatiblePair(mutated, executionPackages[1], searchPrograms[1], realizationOne).identity, compatiblePair.identity);
});

await runCase('reject-program-package-unknown-field', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.targetOperatingSystem = process.platform;
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_ROOT_FIELDS' });
});

await runCase('reject-program-package-native-option', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.nativeOptions = ['--use_fast_math'];
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_ROOT_FIELDS' });
});

await runCase('reject-native-or-cuda-source', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.sourceUnits[0].source = '#include <cuda.h>\n'; mutated.sourceUnits[0].sourceIdentity.sha256 = sourceTextSha256(Buffer.from(mutated.sourceUnits[0].source));
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_SOURCE_BOUNDARY' });
});

await runCase('reject-source-digest-mismatch', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.sourceUnits[0].source += '// changed\n';
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_SOURCE_IDENTITY' });
  const bounded = clone(programPackageFixtures[0].input); bounded.generator.maxSourceBytes = '1';
  assert.throws(() => normalizeProgramPackageProfile(bounded, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_SOURCE_BOUNDS' });
  const composedBound = clone(programPackageFixtures[0].input); composedBound.generator.maxSourceBytes = `${Math.max(...composedBound.sourceUnits.map(({ source }) => Buffer.byteLength(source, 'utf8')))}`;
  assert.throws(() => normalizeProgramPackageProfile(composedBound, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_SOURCE_BOUNDS' });
});

await runCase('reject-source-function-omission', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.sourceUnits[0].functions = [];
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_SOURCE_FUNCTIONS' });
});

await runCase('reject-function-source-mapping-gap', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.functions[0].sourceUnit = mutated.sourceUnits.at(-1).id;
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_FUNCTION_SOURCE' });
});

await runCase('reject-function-name-collision', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.functions[1].name = mutated.functions[0].name;
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_FUNCTION_SOURCE' });
  const bounded = clone(programPackageFixtures[0].input); bounded.generator.maxFunctions = '1';
  assert.throws(() => normalizeProgramPackageProfile(bounded, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_FUNCTION_BOUNDS' });
});

await runCase('reject-function-call-cycle', () => {
  const mutated = clone(programPackageFixtures[0].input); const devices = mutated.functions.filter(({ kind }) => kind === 'device'); devices[0].calls = [devices[1].name]; devices[1].calls = [devices[0].name];
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_FUNCTION_CYCLE' });
  const bounded = clone(programPackageFixtures[0].input); const boundedDevices = bounded.functions.filter(({ kind }) => kind === 'device'); boundedDevices[0].calls = [boundedDevices[1].name]; bounded.generator.maxCallDepth = '1';
  assert.throws(() => normalizeProgramPackageProfile(bounded, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_FUNCTION_DEPTH' });
});

await runCase('reject-kernel-call-target', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.functions.find(({ kind }) => kind === 'device').calls = ['engine_step'];
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_FUNCTION_CALL' });
});

await runCase('reject-unsupported-device-js-helper', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.functions.find(({ kind }) => kind === 'device').helpers = ['gpu.native.cuda'];
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_HELPER_UNSUPPORTED' });
});

await runCase('reject-helper-without-public-requirement', () => {
  const mutated = clone(programPackageFixtures[0].input); const fn = mutated.functions.find(({ kind }) => kind === 'device'); const unit = mutated.sourceUnits.find(({ id }) => id === fn.sourceUnit); unit.source += '// gpu.atomic.storeReleaseDevice\n'; unit.sourceIdentity.sha256 = sourceTextSha256(Buffer.from(unit.source)); fn.helpers = ['gpu.atomic.store-release-device'];
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_HELPER_REQUIREMENT' });
});

await runCase('reject-unselected-source-owner', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.sourceUnits[0].ownerProfile = 'owner.unselected';
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_SOURCE_OWNER' });
});

await runCase('reject-executable-provenance-gap', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.sourceUnits[0].provenance.trust = 'explicit-third-party';
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_PROVENANCE_TRUST' });
});

await runCase('reject-unavailable-public-capability-before-ignition', () => {
  const fixture = programPackageFixtures[1]; const unavailable = new Set(fixture.context.availableRequirements); unavailable.delete('cuda-js.device-publication-release-acquire/0.1.0');
  assert.throws(() => normalizeProgramPackageProfile(fixture.input, inspected, { ...fixture.context, availableRequirements: unavailable }), { code: 'COMPOSE_UNSUPPORTED_CAPABILITY' });
});

await runCase('reject-public-requirement-owner-gap', () => {
  const mutated = clone(programPackageFixtures[1].input); mutated.publicRequirements[0].consumers = ['owner.unselected'];
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[1].context), { code: 'COMPOSE_PUBLIC_REQUIREMENT_CONSUMER' });
  const extra = clone(programPackageFixtures[0].input); const contract = clone(extra.publicRequirements[0].contract);
  contract.id = 'cuda-js.unselected-capability/0.1.0'; contract.sha256 = 'f'.repeat(64);
  extra.publicRequirements.push({ contract, consumers: [extra.id], qualification: 'portable' });
  const availableRequirements = new Set(programPackageFixtures[0].context.availableRequirements); availableRequirements.add(contract.id);
  assert.throws(() => normalizeProgramPackageProfile(extra, inspected, { ...programPackageFixtures[0].context, availableRequirements }), { code: 'COMPOSE_PUBLIC_REQUIREMENT_CLOSURE' });
});

await runCase('reject-resource-provider-mismatch', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.resources[0].capacity = `${BigInt(mutated.resources[0].capacity) + 1n}`;
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_RESOURCE_PROVIDER' });
});

await runCase('reject-resource-provider-omission', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.resources.pop();
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_RESOURCE_COVERAGE' });
});

await runCase('reject-operation-binding-omission', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.operations[0].bindings = [];
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_OPERATION_BINDING' });
});

await runCase('reject-operation-entry-point-gap', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.operations[0].entryPoint = mutated.functions.find(({ kind }) => kind === 'device').name;
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_OPERATION_ENTRY' });
});

await runCase('reject-stage-effect-order-mutation', () => {
  const mutated = clone(programPackageFixtures[1].input); const unit = mutated.programUnits.find(({ kind }) => kind === 'stage-capability'); unit.effectOrder.reverse();
  if (unit.effectOrder.length > 1) assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[1].context), { code: 'COMPOSE_PROGRAM_UNIT_ORDER' });
  else assert.equal(unit.effectOrder.length, 1);
});

await runCase('reject-program-unit-function-duplication', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.programUnits[1].functions = [...mutated.programUnits[0].functions];
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_PROGRAM_UNIT_COVERAGE' });
});

await runCase('reject-deletion-owner-omission', () => {
  const mutated = clone(programPackageFixtures[0].input); mutated.deletion.records.pop();
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_DELETION_OWNER' });
});

await runCase('reject-deletion-source-coverage-gap', () => {
  const mutated = clone(programPackageFixtures[0].input); const owner = mutated.deletion.records.find(({ sourceUnits }) => sourceUnits.length > 0); owner.sourceUnits = [];
  assert.throws(() => normalizeProgramPackageProfile(mutated, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_DELETION_COVERAGE' });
  const misassigned = clone(programPackageFixtures[0].input); const sourceOwner = misassigned.deletion.records.find(({ sourceUnits }) => sourceUnits.length > 0); const wrongOwner = misassigned.deletion.records.find(({ owner: id }) => id !== sourceOwner.owner);
  wrongOwner.sourceUnits.push(sourceOwner.sourceUnits[0]);
  assert.throws(() => normalizeProgramPackageProfile(misassigned, inspected, programPackageFixtures[0].context), { code: 'COMPOSE_DELETION_OWNERSHIP' });
});

await runCase('reject-package-profile-program-mismatch', () => {
  assert.throws(() => buildExecutionPackage(programPackageProfiles[0], searchPrograms[1]), { code: 'COMPOSE_PACKAGE_INPUT' });
});

await runCase('reject-private-cuda-js-realization-field', () => {
  const mutated = buildCudaJsRealizationFixture(executionPackages[1], 'private-field'); mutated.ptx = '// private';
  assert.throws(() => normalizeCudaJsRealization(mutated, executionPackages[1]), { code: 'COMPOSE_REALIZATION_FIELDS' });
});

await runCase('reject-incomplete-cuda-js-realization-resources', () => {
  const mutated = buildCudaJsRealizationFixture(executionPackages[1], 'resource-gap'); mutated.resources.pop();
  assert.throws(() => normalizeCudaJsRealization(mutated, executionPackages[1]), { code: 'COMPOSE_REALIZATION_COVERAGE' });
});

await runCase('reject-compatible-pair-package-mismatch', () => {
  const mutated = clone(compatiblePairInput); mutated.cudaMcgs.executionPackage = syntheticContentIdentity('wrong-package');
  assert.throws(() => normalizeCompatiblePair(mutated, executionPackages[1], searchPrograms[1], realizationOne), { code: 'COMPOSE_PAIR_MCGS' });
});

await runCase('reject-compatible-pair-capability-mismatch', () => {
  const mutated = clone(compatiblePairInput); mutated.cudaJs.capabilities.pop();
  assert.throws(() => normalizeCompatiblePair(mutated, executionPackages[1], searchPrograms[1], realizationOne), { code: 'COMPOSE_PAIR_CAPABILITY' });
});

await runCase('reject-reference-pair-native-qualification-claim', () => {
  const mutated = clone(compatiblePairInput); mutated.claim = { scope: 'native', qualification: 'exact-compatible-pair', native: true };
  assert.throws(() => normalizeCompatiblePair(mutated, executionPackages[1], searchPrograms[1], realizationOne), { code: 'COMPOSE_PAIR_CLAIM' });
});

await runCase('reject-compatible-pair-private-field', () => {
  const mutated = clone(compatiblePairInput); mutated.cudaJs.cachePath = 'private';
  assert.throws(() => normalizeCompatiblePair(mutated, executionPackages[1], searchPrograms[1], realizationOne), { code: 'COMPOSE_PAIR_CUDA_JS_FIELDS' });
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

await runCase('resource-live-output-terminal-isolation', () => {
  const normalized = resourceProfiles[2].normalized;
  const outputOwner = normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0013');
  const outputClasses = normalized.classes.filter(({ contributor }) => contributor === outputOwner.id);
  const terminal = outputClasses.find(({ id }) => id.endsWith('class-terminal-envelope'));
  const observation = outputClasses.find(({ id }) => id.endsWith('class-live-observation'));
  const terminalPartition = normalized.partitions.find(({ class: classId }) => classId === terminal.id);
  const observationPartition = normalized.partitions.find(({ class: classId }) => classId === observation.id);
  assert.notEqual(terminalPartition.pool, observationPartition.pool);
  assert.equal(normalized.reserves.find(({ purpose }) => purpose === 'terminal-result').class, terminal.id);
  assert(!normalized.reserves.some(({ class: classId }) => classId === observation.id));
});

await runCase('resource-output-working-capacity-isolation', () => {
  for (const { normalized } of resourceProfiles) {
    const outputOwner = normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0013');
    const terminal = normalized.classes.find(({ contributor, id }) => contributor === outputOwner.id && id.endsWith('class-terminal-envelope'));
    const working = normalized.classes.find(({ contributor, id }) => contributor === outputOwner.id && id.endsWith('class-output-working'));
    const terminalPartition = normalized.partitions.find(({ class: classId }) => classId === terminal.id);
    const workingPartition = normalized.partitions.find(({ class: classId }) => classId === working.id);
    assert.notEqual(terminalPartition.pool, workingPartition.pool);
    assert(!normalized.reserves.some(({ class: classId }) => classId === working.id));
    assert.equal(working.ownerPressureStatus, 'output-capacity');
  }
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
  const sessionWork = normalized.workClasses.find(({ owner }) => owner === session.id);
  assert.equal(sessionWork.kind, 'external-control');
  assert.notEqual(normalized.noProgress.externalWait.state.sha256, sessionWork.step.publication.sha256);
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
    assert(normalized.workClasses.every((workClass) => workClass.readiness.publication.sha256 !== workClass.step.publication.sha256));
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
  dependency.producer = { kind: 'work-class', owner: owner.id, workClass: work.id, fact: clone(work.step.publication) };
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
  const id = 'dependency.synthetic-mandatory-cycle';
  mutated.dependencies.push({
    id, consumer: graph.id, producer: { kind: 'work-class', owner: policy.owner, workClass: policy.id, fact: clone(policy.step.publication) },
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

await runCase('reject-progress-external-input-output-alias', () => {
  const mutated = clone(progressProfileInputs[2]); const work = mutated.workClasses.find(({ kind }) => kind === 'external-control');
  const dependency = mutated.dependencies.find(({ consumer }) => consumer === work.id); dependency.producer.fact = clone(work.step.publication);
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[2], knownResourceProfiles), { code: 'PROGRESS_DEPENDENCY_SELF' });
});

await runCase('reject-progress-unselected-output-borrow', () => {
  const mutated = clone(progressProfileInputs[0]); mutated.closure.outputBorrow = { kind: 'bounded-postsemantic', maximum: '1', teardown: progressSyntheticSchemaReference('cuda-mcgs.synthetic-unselected-output-borrow') };
  assert.throws(() => normalizeProgressProfile(mutated, inspected, progressResourceResults[0], knownResourceProfiles), { code: 'PROGRESS_OUTPUT_BORROW_KIND' });
});

await runCase('output-profile-second-instances-distinct', () => {
  assert.equal(new Set(outputProfiles.map(({ identity }) => identity.sha256)).size, 3);
  assert.deepEqual(outputProfiles.map(({ normalized }) => normalized.observations.kind), ['absent', 'absent', 'selected']);
});

await runCase('output-envelope-only-terminal-valid', () => {
  const normalized = outputProfiles[0].normalized;
  assert.equal(normalized.fields.length, 0);
  assert.equal(normalized.terminalEnvelope.emptyPayloadValid, true);
  assert.equal(normalized.terminal.sessionRequired, false);
  assert.deepEqual(normalized.terminalEnvelope.completionClasses, ['complete', 'failed', 'no-valid-result', 'valid-partial']);
});

await runCase('output-structured-terminal-owner-preservation', () => {
  const normalized = outputProfiles[1].normalized;
  assert.equal(normalized.fields.length, 4);
  assert(normalized.fields.every((field) => normalized.contributors.some(({ id }) => id === field.owner)));
  assert(normalized.fields.every(({ sourceFact, sourcePort }) => sourceFact.sha256 === sourcePort.sha256));
});

await runCase('output-live-observation-isolated-bounded-read', () => {
  const normalized = outputProfiles[2].normalized;
  const observation = normalized.observations.profiles[0];
  const terminalClass = progressResourceResults[2].normalized.classes.find(({ id }) => id.endsWith('class-terminal-envelope')).id;
  assert(!observation.resources.includes(terminalClass));
  assert.equal(observation.hostProgress, 'none');
  assert.equal(observation.readOnly, true);
  assert.equal(observation.pressure.terminalEffect, 'none');
  assert.equal(observation.pressure.searchEffect, 'none');
});

await runCase('output-profile-order-independent', () => {
  const reordered = clone(outputProfileInputs[2]);
  for (const key of ['contributors', 'schemas', 'fields', 'ports', 'statuses', 'permissions', 'productData']) reordered[key].reverse();
  reordered.terminalEnvelope.fields.reverse();
  reordered.terminalEnvelope.completionClasses.reverse();
  reordered.cleanup.kinds.reverse();
  reordered.programContribution.inputs.reverse();
  for (const contributorInput of reordered.contributors) contributorInput.sourceFacts.reverse();
  for (const profile of reordered.observations.profiles) {
    profile.schemas.reverse(); profile.triggers.reverse(); profile.freshness.reverse(); profile.resources.reverse();
  }
  assert.deepEqual(normalizeOutputProfile(reordered, inspected, progressResourceResults[2], outputProgressResults[2]).identity, outputProfiles[2].identity);
});

await runCase('output-meaningful-field-order-sensitive', () => {
  const mutated = clone(outputProfileInputs[1]); mutated.schemas[0].fieldOrder.reverse();
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[1], outputProgressResults[1]), { code: 'OUTPUT_SCHEMA_FIELD' });
});

await runCase('output-arbitrary-width-bounds', () => {
  const mutated = clone(outputProfileInputs[1]);
  const boundary = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
  mutated.fields[0].bounds.maxDepth = boundary;
  mutated.fields[0].bounds.counterMaximum = boundary;
  const normalized = normalizeOutputProfile(mutated, inspected, progressResourceResults[1], outputProgressResults[1]).normalized;
  assert.equal(normalized.fields.find(({ id }) => id === mutated.fields[0].id).bounds.maxDepth, boundary);
});

await runCase('output-terminal-reserve-exactness', () => {
  for (let index = 0; index < outputProfiles.length; index += 1) {
    const normalized = outputProfiles[index].normalized;
    const reserve = progressResourceResults[index].normalized.reserves.find(({ id }) => id === normalized.terminalEnvelope.terminalReserve);
    const terminalClass = progressResourceResults[index].normalized.classes.find(({ id }) => id.endsWith('class-terminal-envelope'));
    assert.equal(reserve.purpose, 'terminal-result');
    assert.equal(reserve.class, terminalClass.id);
    assert(BigInt(normalized.terminalEnvelope.maxBytes) <= BigInt(reserve.maximum));
  }
});

await runCase('output-publication-release-acquire-contract', () => {
  for (const { normalized } of outputProfiles) {
    assert.deepEqual(normalized.publication.states, ['vacant', 'reserved', 'capturing', 'publishing', 'ready', 'released', 'retired', 'reusable']);
    assert.equal(normalized.publication.fullBeforeReady, true);
    assert.equal(normalized.publication.readyImmutable, true);
    assert.equal(normalized.publication.hostDelivery, 'asynchronous-bounded-read');
    assert.equal(normalized.publication.hostEffect, 'transfer-borrow-only');
  }
});

await runCase('output-terminal-only-zero-live-residue', () => {
  for (const { normalized } of outputProfiles.slice(0, 2)) {
    assert.equal(normalized.observations.kind, 'absent');
    assert(!normalized.schemas.some(({ kind }) => kind === 'live'));
    assert(!normalized.ports.some(({ id }) => ['admit-observation-request', 'capture-observation', 'resume-observation'].includes(id)));
    assert(!normalized.cleanup.kinds.some((kind) => kind.startsWith('observation-') || ['sequence', 'continuation'].includes(kind)));
  }
});

await runCase('output-schema-closed', () => {
  assert.equal(outputProfileSchema.properties.schema.const, 'cuda-mcgs.output-profile/0.2.0');
  assert.equal(outputProfileSchema.additionalProperties, false);
  for (const name of ['contributor', 'sourceFact', 'terminalEnvelope', 'outputSchema', 'serialization', 'field', 'terminal', 'observation', 'workspace', 'snapshot', 'publication', 'lifecycle', 'disposition', 'consumerPolicy', 'port', 'status', 'programContribution']) assert.equal(outputProfileSchema.$defs[name].additionalProperties, false);
});

await runCase('output-framework-selection-link', () => {
  const selected = frameworkSelection.normalized.profiles.find(({ role }) => role === 'output');
  assert.equal(selected.schema.id, outputProfileInputs[0].schema);
  assert.equal(selected.schema.sha256, outputSchemaSha);
  assert.equal(selected.identity.sha256, outputProfiles[0].identity.sha256);
});

await runCase('output-program-input-exactness', () => {
  for (const { normalized } of outputProfiles) {
    assert(normalized.programContribution.inputs.some(({ id }) => id === normalized.resourcePlan.id));
    assert(normalized.programContribution.inputs.some(({ id }) => id === normalized.progressPlan.id));
    assert(normalized.contributors.every(({ profile }) => normalized.programContribution.inputs.some(({ id }) => id === profile.id)));
    assert.equal(normalized.programContribution.language, 'restricted-device-js');
  }
});

await runCase('output-product-data-deletion', () => {
  const selected = clone(outputProfileInputs[0]);
  selected.productData.push({
    ownerContract: { kind: 'namespaced', id: 'product.synthetic-output-option', version: '0.1.0', schema: 'cuda-mcgs.synthetic-output-product-contract/0.1.0', sha256: outputSyntheticContentIdentity('product-contract').sha256 },
    schema: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-product'), identity: outputSyntheticContentIdentity('output-product'),
  });
  const withProduct = normalizeOutputProfile(selected, inspected, progressResourceResults[0], outputProgressResults[0]);
  assert.notDeepEqual(withProduct.identity, outputProfiles[0].identity);
  selected.productData = [];
  assert.deepEqual(normalizeOutputProfile(selected, inspected, progressResourceResults[0], outputProgressResults[0]).identity, outputProfiles[0].identity);
});

await runCase('output-persistence-cleanup-selection', () => {
  const selected = clone(outputProfileInputs[0]);
  selected.compatibility.persistence = {
    kind: 'versioned', encoding: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-persistence-encoding'), namespace: 'output.persistence.synthetic',
    integrity: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-persistence-integrity'), provenance: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-persistence-provenance'),
    migration: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-persistence-migration'), recovery: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-persistence-recovery'),
    retention: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-persistence-retention'), secureDeletion: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-persistence-secure-deletion'),
  };
  selected.cleanup.kinds.push('persisted-artifact');
  const withPersistence = normalizeOutputProfile(selected, inspected, progressResourceResults[0], outputProgressResults[0]);
  assert(withPersistence.normalized.cleanup.kinds.includes('persisted-artifact'));
  assert.notDeepEqual(withPersistence.identity, outputProfiles[0].identity);
});

await runCase('output-identity-content-sensitive', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.publication.borrow.sha256 = '0'.repeat(64);
  assert.notDeepEqual(normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]).identity, outputProfiles[0].identity);
});

await runCase('reject-output-unknown-field', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.nativeTransfer = 'ffi';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_ROOT_FIELDS' });
});

await runCase('reject-output-contract-drift', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.contract.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_CONTRACT_DRIFT' });
});

await runCase('reject-output-resource-plan-drift', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.resourcePlan.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PLAN' });
});

await runCase('reject-output-progress-plan-drift', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.progressPlan.schema.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PLAN' });
});

await runCase('reject-output-resource-contribution-drift', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.resourceContribution.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_CONTRIBUTION' });
});

await runCase('reject-output-progress-contribution-drift', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.progressContribution.schema.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_CONTRIBUTION' });
});

await runCase('reject-output-contributor-omission', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.contributors.pop();
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_CONTRIBUTOR_COUNT' });
});

await runCase('reject-output-contributor-optionality-drift', () => {
  const mutated = clone(outputProfileInputs[1]); mutated.contributors.find(({ optional }) => optional).optional = false;
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[1], outputProgressResults[1]), { code: 'OUTPUT_CONTRIBUTOR_PROFILE' });
});

await runCase('reject-output-contributor-profile-drift', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.contributors[0].profile.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_CONTRIBUTOR_PROFILE' });
});

await runCase('reject-output-contributor-private-fact', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.contributors[0].sourceFacts[0].fact = outputSyntheticSchemaReference('cuda-mcgs.synthetic-private-output-source');
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_CONTRIBUTOR_FACT' });
});

await runCase('reject-output-terminal-envelope-field-gap', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.terminalEnvelope.fields.pop();
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_ENVELOPE_FIELD' });
});

await runCase('reject-output-terminal-completion-class-gap', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.terminalEnvelope.completionClasses.pop();
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_COMPLETION_CLASS' });
});

await runCase('reject-output-terminal-empty-payload-invalid', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.terminalEnvelope.emptyPayloadValid = false;
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_ENVELOPE_CONTRACT' });
});

await runCase('reject-output-terminal-reserve-drift', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.terminalEnvelope.terminalReserve = progressResourceResults[0].normalized.reserves.find(({ purpose }) => purpose === 'progress-cleanup').id;
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_TERMINAL_RESERVE' });
});

await runCase('reject-output-terminal-capacity-overflow', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.terminalEnvelope.maxBytes = '4097';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_TERMINAL_CAPACITY' });
});

await runCase('reject-output-duplicate-schema', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.schemas.push(clone(mutated.schemas[0]));
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_SCHEMA_DUPLICATE' });
});

await runCase('reject-output-multiple-terminal-schemas', () => {
  const mutated = clone(outputProfileInputs[2]); mutated.schemas.find(({ kind }) => kind === 'live').kind = 'terminal';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_TERMINAL_SCHEMA' });
});

await runCase('reject-output-field-order-duplicate', () => {
  const mutated = clone(outputProfileInputs[1]); mutated.schemas[0].fieldOrder[1] = mutated.schemas[0].fieldOrder[0];
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[1], outputProgressResults[1]), { code: 'OUTPUT_SCHEMA_FIELD' });
});

await runCase('reject-output-field-owner', () => {
  const mutated = clone(outputProfileInputs[1]); mutated.fields[0].owner = 'owner.unknown';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[1], outputProgressResults[1]), { code: 'OUTPUT_FIELD_OWNER' });
});

await runCase('reject-output-private-field-source', () => {
  const mutated = clone(outputProfileInputs[1]); mutated.fields[0].sourceFact = outputSyntheticSchemaReference('cuda-mcgs.synthetic-private-field-source');
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[1], outputProgressResults[1]), { code: 'OUTPUT_FIELD_SOURCE' });
});

await runCase('reject-output-private-field-port', () => {
  const mutated = clone(outputProfileInputs[1]); mutated.fields[0].sourcePort = outputSyntheticSchemaReference('cuda-mcgs.synthetic-private-field-port');
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[1], outputProgressResults[1]), { code: 'OUTPUT_FIELD_SOURCE' });
});

await runCase('reject-output-terminal-field-not-terminal-ready', () => {
  const mutated = clone(outputProfileInputs[1]); const field = mutated.fields[0]; const owner = mutated.contributors.find(({ id }) => id === field.owner); const ready = owner.sourceFacts.find(({ readiness }) => readiness === 'ready').fact; field.sourceFact = clone(ready); field.sourcePort = clone(ready);
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[1], outputProgressResults[1]), { code: 'OUTPUT_FIELD_READINESS' });
});

await runCase('reject-output-product-field-catalog-owner', () => {
  const mutated = clone(outputProfileInputs[1]); const field = mutated.fields[0]; const terminalSchema = mutated.schemas.find(({ kind }) => kind === 'terminal'); const productSchema = clone(terminalSchema);
  productSchema.id = 'output-schema.synthetic-evaluator-workspace.product'; productSchema.kind = 'product'; productSchema.fieldOrder = [field.id];
  terminalSchema.fieldOrder = terminalSchema.fieldOrder.filter((id) => id !== field.id); field.schema = productSchema.id; mutated.schemas.push(productSchema);
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[1], outputProgressResults[1]), { code: 'OUTPUT_FIELD_PRODUCT_OWNER' });
});

await runCase('reject-output-field-schema', () => {
  const mutated = clone(outputProfileInputs[1]); mutated.fields[0].schema = 'output-schema.unknown';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[1], outputProgressResults[1]), { code: 'OUTPUT_FIELD_SCHEMA' });
});

await runCase('reject-output-field-shape-zero', () => {
  const mutated = clone(outputProfileInputs[1]); mutated.fields[0].shape = ['0'];
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[1], outputProgressResults[1]), { code: 'OUTPUT_FIELD_SHAPE' });
});

await runCase('reject-output-ranking-without-policy-owner', () => {
  const mutated = clone(outputProfileInputs[1]); mutated.fields.find(({ semanticRole }) => semanticRole === 'domain-outcome').semanticRole = 'ranking';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[1], outputProgressResults[1]), { code: 'OUTPUT_FIELD_RANKING' });
});

await runCase('reject-output-source-mutating-projection', () => {
  const mutated = clone(outputProfileInputs[1]); mutated.fields[0].projection.sourceMutation = 'allowed';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[1], outputProgressResults[1]), { code: 'OUTPUT_PROJECTION_AUTHORITY' });
});

await runCase('reject-output-field-cancellation-bound', () => {
  const mutated = clone(outputProfileInputs[1]); mutated.fields[0].bounds.cancellationObservationWorkUnits = '1025';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[1], outputProgressResults[1]), { code: 'OUTPUT_BOUNDS_CANCELLATION' });
});

await runCase('reject-output-physical-serialization-alignment', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.schemas[0].serialization.alignment = 'cuda-struct-alignment';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_SERIALIZATION_ALIGNMENT' });
});

await runCase('reject-output-terminal-cut', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.terminal.cut = 'host-polled';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_TERMINAL_CONTRACT' });
});

await runCase('reject-output-terminal-session-required', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.terminal.sessionRequired = true;
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_TERMINAL_CONTRACT' });
});

await runCase('reject-output-observation-residue-when-absent', () => {
  const mutated = clone(outputProfileInputs[2]); mutated.observations = { kind: 'absent' };
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_OBSERVATION_RESIDUE' });
});

await runCase('reject-output-observation-nonlive-schema', () => {
  const mutated = clone(outputProfileInputs[2]); mutated.observations.profiles[0].schemas[0] = mutated.schemas.find(({ kind }) => kind === 'terminal').id;
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_OBSERVATION_SCHEMA' });
});

await runCase('reject-output-observation-duplicate-schema-assignment', () => {
  const mutated = clone(outputProfileInputs[2]); const duplicate = clone(mutated.observations.profiles[0]); duplicate.id = 'output-observation.synthetic-live-session.second'; mutated.observations.profiles.push(duplicate);
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_OBSERVATION_COVERAGE' });
});

await runCase('reject-output-observation-terminal-resource', () => {
  const mutated = clone(outputProfileInputs[2]); mutated.observations.profiles[0].resources[0] = progressResourceResults[2].normalized.classes.find(({ id }) => id.endsWith('class-terminal-envelope')).id;
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_OBSERVATION_RESOURCE' });
});

await runCase('reject-output-observation-foreign-resource', () => {
  const mutated = clone(outputProfileInputs[2]); mutated.observations.profiles[0].resources[0] = progressResourceResults[2].normalized.classes.find(({ contributor }) => contributor !== progressResourceResults[2].normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0013').id).id;
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_OBSERVATION_RESOURCE' });
});

await runCase('reject-output-observation-write-authority', () => {
  const mutated = clone(outputProfileInputs[2]); mutated.observations.profiles[0].readOnly = false;
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_OBSERVATION_AUTHORITY' });
});

await runCase('reject-output-observation-host-progress', () => {
  const mutated = clone(outputProfileInputs[2]); mutated.observations.profiles[0].hostProgress = 'poll-and-relaunch';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_OBSERVATION_AUTHORITY' });
});

await runCase('reject-output-observation-capacity', () => {
  const mutated = clone(outputProfileInputs[2]); mutated.observations.profiles[0].maxSlots = '17';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_OBSERVATION_CAPACITY' });
});

await runCase('reject-output-observation-counter-range', () => {
  const mutated = clone(outputProfileInputs[2]); mutated.observations.profiles[0].cadence.counterMaximum = '1024';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_OBSERVATION_RANGE' });
});

await runCase('reject-output-observation-pressure-affects-search', () => {
  const mutated = clone(outputProfileInputs[2]); mutated.observations.profiles[0].pressure.searchEffect = 'stop';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_PRESSURE_AUTHORITY' });
});

await runCase('reject-output-observation-freshness-gap', () => {
  const mutated = clone(outputProfileInputs[2]); mutated.observations.profiles[0].freshness.pop();
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_OBSERVATION_FRESHNESS' });
});

await runCase('reject-output-observation-runtime-schema', () => {
  const mutated = clone(outputProfileInputs[2]); mutated.observations.profiles[0].request.runtimeSchema = 'accepted';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_REQUEST_SCHEMA' });
});

await runCase('reject-output-workspace-resource-drift', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.workspace.resource = progressResourceResults[0].normalized.classes.find(({ id }) => id.endsWith('class-terminal-envelope')).id;
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_WORKSPACE_RESOURCE' });
});

await runCase('reject-output-workspace-host-spill', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.workspace.hostSpill = 'host-overflow';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_WORKSPACE_SPILL' });
});

await runCase('reject-output-workspace-capacity', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.workspace.scratchBytes = '131072';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_WORKSPACE_CAPACITY' });
});

await runCase('reject-output-terminal-only-live-counter-residue', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.workspace.counters.push('requested');
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_WORKSPACE_COUNTER' });
});

await runCase('reject-output-diagnostic-workspace-overflow', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.diagnostics.maxBytes = '32769';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_WORKSPACE_CAPACITY' });
});

await runCase('reject-output-snapshot-version-proof-gap', () => {
  const mutated = clone(outputProfileInputs[2]); mutated.snapshot.versionRelation = null;
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_SNAPSHOT_PROTOCOL' });
});

await runCase('reject-output-publication-state-order', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.publication.states.reverse();
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PUBLICATION_CONTRACT' });
});

await runCase('reject-output-publication-before-full', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.publication.fullBeforeReady = false;
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PUBLICATION_CONTRACT' });
});

await runCase('reject-output-zero-borrow-capacity', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.publication.maxBorrows = '0';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PUBLICATION_RANGE' });
});

await runCase('reject-output-publication-workspace-overflow', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.publication.maxBorrows = '65';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PUBLICATION_RANGE' });
});

await runCase('reject-output-observation-borrow-workspace-overflow', () => {
  const mutated = clone(outputProfileInputs[2]); mutated.observations.profiles[0].maxBorrows = '65';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2]), { code: 'OUTPUT_OBSERVATION_RANGE' });
});

await runCase('reject-output-host-read-advances-search', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.publication.hostEffect = 'advance-search';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PUBLICATION_CONTRACT' });
});

await runCase('reject-output-private-native-mechanism', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.publication.mechanism = 'direct-driver-ffi';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PUBLICATION_CONTRACT' });
});

await runCase('reject-output-lifecycle-state-gap', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.lifecycle.states.pop();
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_LIFECYCLE_STATES' });
});

await runCase('reject-output-terminal-only-live-elision-drift', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.lifecycle.terminalOnlyElidesLive = false;
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_LIFECYCLE_STATES' });
});

await runCase('reject-output-lifecycle-disposition-gap', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.lifecycle.dispositions.pop();
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_LIFECYCLE_DISPOSITION' });
});

await runCase('reject-output-terminal-only-live-disposition-residue', () => {
  const mutated = clone(outputProfileInputs[0]); const extra = clone(outputProfileInputs[2].lifecycle.dispositions.find(({ id }) => id === 'observation-slot')); mutated.lifecycle.dispositions.push(extra);
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_LIFECYCLE_DISPOSITION' });
});

await runCase('reject-output-required-status', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.statuses = mutated.statuses.filter(({ code }) => code !== 'output-terminal-capacity');
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_STATUS_REQUIRED' });
});

await runCase('reject-output-status-class', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.statuses.find(({ code }) => code === 'output-terminal-capacity').class = 'pending';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_STATUS_CLASS' });
});

await runCase('reject-output-required-port', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.ports = mutated.ports.filter(({ id }) => id !== 'publish-output');
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PORT_REQUIRED' });
});

await runCase('reject-output-host-terminal-capture', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.ports.find(({ id }) => id === 'capture-terminal-payload').phase = 'host-async';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PORT_PHASE' });
});

await runCase('reject-output-device-host-acquire', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.ports.find(({ id }) => id === 'acquire-output').phase = 'device-active';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PORT_PHASE' });
});

await runCase('reject-output-port-source-mutation', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.ports[0].sourceMutation = 'allowed';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PORT_AUTHORITY' });
});

await runCase('reject-output-port-status', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.ports[0].statuses[0] = 'output.unknown-status';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PORT_STATUS' });
});

await runCase('reject-output-duplicate-permission', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.permissions.push(clone(mutated.permissions[0]));
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PERMISSION' });
});

await runCase('reject-output-consumer-permission-drift', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.consumerPolicy.permission = outputSyntheticSchemaReference('cuda-mcgs.synthetic-unselected-consumer-permission');
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_CONSUMER_PERMISSION' });
});

await runCase('reject-output-diagnostic-memory-dump', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.diagnostics.deviceMemoryDump = true;
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_DIAGNOSTIC_AUTHORITY' });
});

await runCase('reject-output-native-transfer-identity-semantics', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.compatibility.nativeTransferIdentityOpaque = false;
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_COMPAT_IDENTITY' });
});

await runCase('reject-output-incomplete-persistence', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.compatibility.persistence = { kind: 'versioned' };
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PERSISTENCE_FIELDS' });
});

await runCase('reject-output-persistence-cleanup-gap', () => {
  const mutated = clone(outputProfileInputs[0]);
  mutated.compatibility.persistence = {
    kind: 'versioned', encoding: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-persistence-encoding'), namespace: 'output.persistence.synthetic',
    integrity: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-persistence-integrity'), provenance: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-persistence-provenance'),
    migration: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-persistence-migration'), recovery: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-persistence-recovery'),
    retention: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-persistence-retention'), secureDeletion: outputSyntheticSchemaReference('cuda-mcgs.synthetic-output-persistence-secure-deletion'),
  };
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_CLEANUP_KIND' });
});

await runCase('reject-output-cleanup-coverage', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.cleanup.kinds.pop();
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_CLEANUP_KIND' });
});

await runCase('reject-output-live-cleanup-residue', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.cleanup.kinds.push('observation-slot');
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_CLEANUP_KIND' });
});

await runCase('reject-output-native-program-language', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.programContribution.language = 'cuda-cpp';
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PROGRAM_LANGUAGE' });
});

await runCase('reject-output-program-input-drift', () => {
  const mutated = clone(outputProfileInputs[0]); mutated.programContribution.inputs.pop();
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PROGRAM_INPUTS' });
});

await runCase('reject-output-product-owner', () => {
  const mutated = clone(outputProfileInputs[0]);
  mutated.productData.push({ ownerContract: clone(mutated.contract), schema: outputSyntheticSchemaReference('cuda-mcgs.synthetic-invalid-output-product'), identity: outputSyntheticContentIdentity('invalid-output-product') });
  assert.throws(() => normalizeOutputProfile(mutated, inspected, progressResourceResults[0], outputProgressResults[0]), { code: 'OUTPUT_PRODUCT_OWNER' });
});

await runCase('session-schema-closed', () => {
  assert.equal(sessionProfileSchema.additionalProperties, false);
  assert.equal(sessionProfileSchema.$defs.advanceProfile.additionalProperties, false);
  assert.equal(sessionProfileSchema.$defs.rerootTransaction.additionalProperties, false);
  assert.equal(sessionProfileSchema.$defs.rerootProfile.additionalProperties, false);
  assert.equal(sessionProfileSchema.$defs.attentionProfile.additionalProperties, false);
  assert.equal(sessionProfileSchema.properties.advance.$ref, '#/$defs/advance');
  assert.equal(sessionProfileSchema.properties.reroot.$ref, '#/$defs/reroot');
  assert.equal(sessionProfileSchema.properties.rootTransaction, undefined);
});
await runCase('session-profile-second-instances-distinct', () => {
  assert.notDeepEqual(sessionProfiles[0].identity, sessionProfiles[1].identity);
  assert.deepEqual(sessionProfiles.map(({ normalized }) => normalized.reroot.profile.pressureOutcome), ['reject-keep-session', 'restart-required']);
  assert.deepEqual(sessionProfiles.map(({ normalized }) => normalized.attention.kind), ['selected', 'absent']);
});
await runCase('session-profile-order-independent', () => {
  const reordered = clone(sessionProfileInputs[0]);
  for (const key of ['owners', 'counters', 'statuses', 'permissions', 'productData']) reordered[key].reverse();
  reordered.reroot.profile.workScopes.reverse();
  reordered.observations.profiles.reverse();
  reordered.programContribution.inputs.reverse();
  reordered.programContribution.requirements.reverse();
  const normalized = normalizeSessionProfile(reordered, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult);
  assert.deepEqual(normalized.identity, sessionProfiles[0].identity);
});
await runCase('session-absence-zero-residue', () => {
  for (const index of [0, 1]) {
    assert(!progressResourceResults[index].normalized.contributors.some(({ contract }) => contract.id === 'SPEC-0006'));
    assert(!outputProgressResults[index].normalized.contributors.some(({ contract }) => contract.id === 'SPEC-0006'));
    assert(!outputProgressResults[index].normalized.workClasses.some(({ kind }) => kind === 'external-control'));
    assert.equal(outputProfiles[index].normalized.observations.kind, 'absent');
  }
  assert(!frameworkSelection.normalized.profiles.some(({ role }) => role === 'session'));
});

await runCase('session-owner-boundary-exact', () => {
  const normalized = sessionProfiles[0].normalized;
  assert.equal(normalized.owners.length, outputProgressResults[2].normalized.contributors.length);
  const coordinator = normalized.owners.find(({ role }) => role === 'coordinator');
  assert.equal(coordinator.contract.id, 'SPEC-0006');
  assert.equal(coordinator.reroot.kind, 'absent');
  assert(normalized.owners.filter(({ reroot }) => reroot.kind === 'selected').every(({ role }) => role === 'participant'));
});
await runCase('session-reroot-transaction-admission-before-mutation', () => {
  const normalized = sessionProfiles[0].normalized;
  assert.equal(normalized.reroot.profile.transaction.preMutationAdmission, true);
  assert.equal(normalized.reroot.profile.transaction.linearization, 'root-incarnation-publication');
  assert.equal(normalized.advance.profile.existingResourcesOnly, true);
  assert.equal(normalized.advance.profile.reclassification, 'none');
});
await runCase('session-selected-attention-deletion', () => {
  assert(sessionProfiles[0].normalized.ports.some(({ id }) => id === 'applyAttentionChange'));
  assert(!sessionProfiles[1].normalized.ports.some(({ id }) => id === 'applyAttentionChange'));
  assert(!sessionProfiles[1].normalized.commands.inputs.some(({ kind }) => kind === 'attention'));
  assert.equal(sessionProfiles[1].normalized.attention.kind, 'absent');
  assert(!sessionProfiles[1].normalized.lifecycle.postIgnitionInteractions.includes('attention-change'));
  assert(!sessionProfiles[1].normalized.permissions.some(({ id }) => id.includes('permission-attention')));
  assert(!sessionProfiles[1].normalized.statuses.some(({ code }) => code.includes('attention')));
  assert(!sessionProfiles[1].normalized.counters.some(({ kind }) => kind === 'attention-generation'));
  assert(!sessionProfiles[1].normalized.cleanup.kinds.includes('attention-publication'));
});

await runCase('session-attention-root-and-reclamation-separation', () => {
  const normalized = sessionProfiles[0].normalized;
  assert.equal(normalized.attention.profile.rootAuthorityEffect, 'none');
  assert.equal(normalized.attention.profile.graphWork, 'none');
  assert.equal(normalized.attention.profile.reclamation, 'none');
  assert.equal(normalized.advance.profile.reclamation, 'none');
  assert.equal(normalized.reclamation.advanceSeparate, true);
  assert.equal(normalized.reclamation.rerootCommitSeparate, true);
});
await runCase('session-attention-lazy-multidevice-safe-point', () => {
  const attention = sessionProfiles[0].normalized.attention.profile;
  assert.equal(attention.application, 'queued-device-control-work-at-existing-safe-point');
  assert.equal(attention.steadyStatePolling, 'none');
  assert.equal(attention.applicationCost, 'bounded-independent-of-search-state');
  assert.equal(attention.synchronization, 'no-global-barrier');
  assert.equal(attention.multiDeviceVisibility, 'per-device-versioned-safe-point');
});

await runCase('session-attention-selected-owner-flexibility', () => {
  const mutated = clone(sessionProfileInputs[0]);
  const alternativeOwner = mutated.owners.find(({ role, contract }) => role === 'participant' && contract.id === 'SPEC-0013');
  mutated.commands.inputs.find(({ kind }) => kind === 'attention').owner = alternativeOwner.id;
  mutated.attention.profile.owner = alternativeOwner.id;
  const result = normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult);
  assert.equal(result.normalized.attention.profile.owner, alternativeOwner.id);
  assert.notDeepEqual(result.identity, sessionProfiles[0].identity);
});

await runCase('reject-session-attention-root-authority-scope', () => {
  const mutated = clone(sessionProfileInputs[0]);
  mutated.commands.inputs.find(({ kind }) => kind === 'attention').epochScope = 'session-and-root-authority';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_ATTENTION_INPUT' });
});
await runCase('reject-session-attention-graph-work', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.attention.profile.graphWork = 'traverse-retained-graph';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_ATTENTION_CONTRACT' });
});

await runCase('reject-session-attention-steady-state-polling', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.attention.profile.steadyStatePolling = 'per-search-iteration';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_ATTENTION_CONTRACT' });
});

await runCase('reject-session-attention-generation-gap', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.counters = mutated.counters.filter(({ kind }) => kind !== 'attention-generation');
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_COUNTER_COVERAGE' });
});

await runCase('reject-session-reroot-transaction-unaffected-owner', () => {
  const mutated = clone(sessionProfileInputs[0]);
  const unaffected = mutated.owners.find(({ role, reroot }) => role === 'participant' && reroot.kind === 'absent').id;
  mutated.reroot.profile.transaction.prepareOrder.push(unaffected);
  mutated.reroot.profile.transaction.commitOrder.push(unaffected);
  mutated.reroot.profile.transaction.abortOrder.unshift(unaffected);
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_REROOT_ORDER' });
});
await runCase('session-observation-output-binding', () => {
  const observation = sessionProfiles[0].normalized.observations.profiles[0];
  const outputObservation = outputProfiles[2].normalized.observations.profiles[0];
  assert.equal(observation.outputProfile, outputObservation.id);
  assert.equal(observation.readOnly, true);
  assert.equal(observation.hostProgress, 'none');
  assert.deepEqual(observation.rootEpochBinding, outputProfiles[2].normalized.snapshot.rootEpoch);
  assert.deepEqual(observation.acquisition, outputProfiles[2].normalized.publication.acquireRead);
});

await runCase('session-reroot-work-authority-closure', () => {
  const normalized = sessionProfiles[0].normalized;
  assert.equal(normalized.reroot.profile.workScopes.length, outputProgressResults[2].normalized.workClasses.length);
  assert(normalized.reroot.profile.workScopes.filter(({ scope }) => scope === 'root-authority').every(({ staleDisposition }) => staleDisposition !== 'not-applicable'));
  assert(normalized.reroot.profile.workScopes.filter(({ scope }) => scope !== 'root-authority').every(({ staleDisposition }) => staleDisposition === 'not-applicable'));
  assert.equal(normalized.advance.profile.selectedDescendantWork, 'preserve-compatible');
  assert.equal(normalized.advance.profile.siblingOccurrenceWork, 'superseded-by-advance-lazy');
});
await runCase('session-finite-counter-closure', () => {
  assert.deepEqual(sessionProfiles[0].normalized.counters.map(({ kind }) => kind).sort(), [
    'advance-generation', 'attention-generation', 'command', 'observation-generation', 'reclamation-generation', 'root-epoch', 'root-incarnation', 'session-incarnation',
  ]);
});
await runCase('session-device-owned-progress-boundary', () => {
  const normalized = sessionProfiles[0].normalized;
  assert.equal(normalized.commands.hostProgress, 'none');
  assert.equal(normalized.lifecycle.hostProgress, 'none');
  assert.equal(normalized.attention.profile.hostProgress, 'none');
  assert(normalized.ports.every(({ hostProgress, mechanism }) => hostProgress === 'none' && mechanism === 'public-cuda-js-contract'));
});

await runCase('session-program-public-js-boundary', () => {
  const program = sessionProfiles[0].normalized.programContribution;
  assert.equal(program.language, 'restricted-device-js');
  assert(program.requirements.every(({ id }) => id.startsWith('cuda-js.')));
  assert(!JSON.stringify(program).match(/cuda-cpp|\.cu\b|ptx|ffi|native-addon|private-handle/i));
});

await runCase('session-cleanup-lifecycle-closure', () => {
  const normalized = sessionProfiles[0].normalized;
  assert.deepEqual(normalized.cleanup.kinds, [
    'advance-publication', 'attention-publication', 'borrow', 'command', 'compound-lease', 'diagnostic', 'old-epoch-work', 'observation-request', 'program-artifact', 'reroot-transaction', 'session-counter', 'shared-node-protection', 'root-protection', 'transfer',
  ].sort());
  assert.equal(normalized.lifecycle.completion.freezeCommands, true);
});
await runCase('reject-session-unknown-field', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.scheduler = 'host-loop';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_ROOT_FIELDS' });
});

await runCase('reject-session-plan-drift', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.resourcePlan.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_PLAN' });
});

await runCase('reject-session-contribution-drift', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.progressContribution.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_CONTRIBUTION' });
});

await runCase('reject-session-owner-gap', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.owners.pop();
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_OWNER_COVERAGE' });
});

await runCase('reject-session-owner-profile-drift', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.owners[0].profile.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_OWNER_PROFILE' });
});

await runCase('reject-session-coordinator-drift', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.owners.find(({ role }) => role === 'coordinator').role = 'participant';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_OWNER_ROLE' });
});

await runCase('reject-session-command-capacity', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.commands.capacity = '65';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_COMMAND_CAPACITY' });
});

await runCase('reject-session-host-progress-loop', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.commands.hostProgress = 'poll-relaunch';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_COMMAND_CONTRACT' });
});

await runCase('reject-session-advance-input-gap', () => {
  const mutated = clone(sessionProfileInputs[0]);
  mutated.commands.inputs = mutated.commands.inputs.filter(({ kind }) => kind !== 'advance');
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_ADVANCE_INPUT' });
});
await runCase('reject-session-runtime-code-input', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.commands.inputs[0].runtimeCode = true;
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_INPUT_RUNTIME_CODE' });
});

await runCase('reject-session-advance-application-gap', () => {
  const mutated = clone(sessionProfileInputs[0]);
  mutated.commands.inputs.find(({ kind }) => kind === 'advance').deviceApplicationPoint = null;
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_INPUT_APPLICATION' });
});
await runCase('reject-session-reroot-mutation-before-admission', () => {
  const mutated = clone(sessionProfileInputs[0]);
  mutated.reroot.profile.transaction.preMutationAdmission = false;
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_REROOT_TRANSACTION_CONTRACT' });
});
await runCase('reject-session-reroot-transaction-owner-gap', () => {
  const mutated = clone(sessionProfileInputs[0]);
  mutated.reroot.profile.transaction.prepareOrder.pop();
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_REROOT_ORDER' });
});
await runCase('reject-session-reroot-transaction-abort-order', () => {
  const mutated = clone(sessionProfileInputs[0]);
  [mutated.reroot.profile.transaction.abortOrder[0], mutated.reroot.profile.transaction.abortOrder[1]] = [mutated.reroot.profile.transaction.abortOrder[1], mutated.reroot.profile.transaction.abortOrder[0]];
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_REROOT_ORDER' });
});
await runCase('reject-session-reroot-compound-admission-drift', () => {
  const mutated = clone(sessionProfileInputs[0]);
  mutated.reroot.profile.transaction.compoundAdmission.rerootReserve = progressResourceResults[2].normalized.reserves.find(({ purpose }) => purpose === 'terminal-result').id;
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_REROOT_ADMISSION' });
});
await runCase('reject-session-root-owner-drift', () => {
  const mutated = clone(sessionProfileInputs[0]);
  mutated.root.validationOwner = mutated.owners.find(({ contract }) => contract.id === 'SPEC-0008').id;
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_ROOT_OWNER' });
});
await runCase('reject-session-root-authority-gap', () => {
  const mutated = clone(sessionProfileInputs[0]);
  mutated.root.establishment = 'destroy-before-prepare';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_ROOT_CONTRACT' });
});
await runCase('reject-session-reroot-work-scope-gap', () => {
  const mutated = clone(sessionProfileInputs[0]);
  mutated.reroot.profile.workScopes.pop();
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_REROOT_WORK_COVERAGE' });
});
await runCase('reject-session-reroot-stale-disposition-gap', () => {
  const mutated = clone(sessionProfileInputs[0]);
  mutated.reroot.profile.workScopes.find(({ scope }) => scope === 'root-authority').staleDisposition = 'not-applicable';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_WORK_STALE' });
});
await runCase('reject-session-reroot-reuse-validity-gap', () => {
  const mutated = clone(sessionProfileInputs[0]);
  const state = mutated.owners.flatMap(({ reroot }) => reroot.kind === 'selected' ? reroot.state : []).find(({ classification }) => classification === 'retain-if-key-valid');
  state.validity = null;
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_STATE_CLASSIFICATION' });
});
await runCase('reject-session-attention-host-progress', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.attention.profile.hostProgress = 'host-callback';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_ATTENTION_CONTRACT' });
});

await runCase('reject-session-attention-application-drift', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.attention.profile.applicationPoint = sessionSyntheticSchemaReference('cuda-mcgs.synthetic-invalid-application-point');
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_ATTENTION_CONTRACT' });
});

await runCase('reject-session-observation-read-authority', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.observations.profiles[0].readOnly = false;
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_OBSERVATION_CONTRACT' });
});

await runCase('reject-session-observation-capacity', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.observations.profiles[0].maxBorrows = '9';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_OBSERVATION_RANGE' });
});

await runCase('reject-session-observation-request-permission', () => {
  const mutated = clone(sessionProfileInputs[0]); const observationInput = mutated.commands.inputs.find(({ kind }) => kind === 'observation-request'); observationInput.permission = clone(mutated.permissions[0]);
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_OBSERVATION_REQUEST' });
});

await runCase('reject-session-observation-epoch-relabel', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.observations.profiles[0].rootEpochBinding = sessionSyntheticSchemaReference('cuda-mcgs.synthetic-invalid-root-epoch-binding');
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_OBSERVATION_CONTRACT' });
});

await runCase('reject-session-observation-residue-gap', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.observations = { kind: 'absent' };
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_OBSERVATIONS_FIELDS' });
});

await runCase('reject-session-synchronous-full-reclamation', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.reclamation.fullGraphSynchronous = true;
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_RECLAMATION_AUTHORITY' });
});

await runCase('reject-session-counter-range', () => {
  const mutated = clone(sessionProfileInputs[0]); const counter = mutated.counters.find(({ kind }) => kind === 'command'); counter.exhaustionThreshold = `${counter.maximum}0`;
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_COUNTER_RANGE' });
});

await runCase('reject-session-counter-rollover', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.counters.find(({ kind }) => kind === 'root-epoch').rollover = 'prohibited';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_COUNTER_ROLLOVER' });
});

await runCase('reject-session-root-counter-width', () => {
  const mutated = clone(sessionProfileInputs[0]); const counter = mutated.counters.find(({ kind }) => kind === 'root-epoch'); counter.maximum = '18446744073709551616'; counter.exhaustionThreshold = counter.maximum;
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_ROOT_COUNTER' });
});

await runCase('reject-session-lifecycle-host-progress', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.lifecycle.hostProgress = 'observation-decide-write';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_LIFECYCLE_CONTRACT' });
});

await runCase('reject-session-completion-binding', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.lifecycle.completion.progressClosure = sessionSyntheticSchemaReference('cuda-mcgs.synthetic-invalid-progress-closure');
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_COMPLETION_BINDING' });
});

await runCase('reject-session-unselected-attention-port', () => {
  const mutated = clone(sessionProfileInputs[1]); const extra = clone(mutated.ports[0]); extra.id = 'applyAttentionChange'; extra.phase = 'device-active'; mutated.ports.push(extra);
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_PORT_COVERAGE' });
});

await runCase('reject-session-port-host-progress', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.ports[0].hostProgress = 'callback';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_PORT_CONTRACT' });
});

await runCase('reject-session-status-gap', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.statuses = mutated.statuses.filter(({ code }) => code !== 'session-internal-failure');
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_STATUS_REQUIRED' });
});

await runCase('reject-session-input-status-gap', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.commands.inputs[0].pressureStatus = 'unselected-status';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_INPUT_STATUS' });
});

await runCase('reject-session-security-native-handle', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.security.cudaHandles = true;
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_SECURITY_CONTRACT' });
});

await runCase('reject-session-persistence-without-owner', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.compatibility.persistence.kind = 'versioned';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_COMPATIBILITY_CONTRACT' });
});

await runCase('reject-session-cleanup-gap', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.cleanup.kinds.pop();
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_CLEANUP_COVERAGE' });
});

await runCase('reject-session-native-program-language', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.programContribution.language = 'cuda-cpp';
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_PROGRAM_LANGUAGE' });
});

await runCase('reject-session-program-input-drift', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.programContribution.inputs.pop();
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_PROGRAM_INPUTS' });
});

await runCase('reject-session-private-program-requirement', () => {
  const mutated = clone(sessionProfileInputs[0]); mutated.programContribution.requirements[0] = sessionSyntheticSchemaReference('cuda-js.private-mailbox');
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_PROGRAM_REQUIREMENTS' });
});

await runCase('reject-session-product-owner', () => {
  const mutated = clone(sessionProfileInputs[0]);
  mutated.productData.push({ ownerContract: clone(mutated.contract), schema: sessionSyntheticSchemaReference('cuda-mcgs.synthetic-invalid-session-product'), identity: sessionSyntheticContentIdentity('invalid-session-product') });
  assert.throws(() => normalizeSessionProfile(mutated, inspected, progressResourceResults[2], outputProgressResults[2], sessionOutputResult), { code: 'SESSION_PRODUCT_OWNER' });
});

await runCase('stage-schema-closed', () => {
  assert.equal(stageProfileSchema.properties.schema.const, 'cuda-mcgs.stage-profile/0.2.0');
  assert.equal(stageProfileSchema.additionalProperties, false);
  for (const name of ['owner', 'permission', 'counter', 'workItem', 'stageEntry', 'stageExecution', 'stageOutcome', 'stage', 'contextField', 'invocation', 'surface', 'contribution', 'effect', 'activation', 'channelBinding', 'channelRequirement', 'provenance', 'capability', 'status', 'lifecycle', 'diagnostics', 'compatibility', 'cleanup', 'programContribution']) assert.equal(stageProfileSchema.$defs[name].additionalProperties, false);
});

await runCase('stage-profile-second-instance-distinct', () => {
  assert.equal(new Set(stageProfiles.map(({ identity }) => identity.sha256)).size, 2);
  assert.equal(new Set(stageProfiles.map(({ normalized }) => normalized.generatorIdentity.sha256)).size, 2);
  assert.deepEqual(stageProfiles.map(({ normalized }) => normalized.stages.length), [2, 1]);
  assert.deepEqual(stageProfiles.map(({ normalized }) => normalized.capabilities.length), [2, 1]);
});

await runCase('stage-profile-order-independent', () => {
  const reordered = clone(stageProfileInputs[0]);
  for (const key of ['owners', 'stages', 'surfaces', 'capabilities', 'permissions', 'counters', 'statuses', 'productData']) reordered[key].reverse();
  for (const owner of reordered.owners) owner.ports.reverse();
  for (const stageInput of reordered.stages) { stageInput.outcomes.reverse(); stageInput.checkpoints.reverse(); stageInput.resourceClasses.reverse(); }
  for (const surfaceInput of reordered.surfaces) { surfaceInput.baseContext.reverse(); surfaceInput.permissions.reverse(); surfaceInput.outcomes.reverse(); }
  for (const capabilityInput of reordered.capabilities) for (const key of ['bindings', 'requiredFacts', 'permissions', 'contributions', 'effects', 'before', 'after', 'channels', 'outcomes', 'requirements']) capabilityInput[key].reverse();
  reordered.programContribution.inputs.reverse(); reordered.programContribution.requirements.reverse();
  assert.deepEqual(normalizeStageProfile(reordered, inspected, stageResourceResult, stageProgressResult).identity, stageProfiles[0].identity);
});

await runCase('stage-zero-capability-complete-absence', () => {
  assert.deepEqual(normalizeStageProfile(null, inspected, null, null), { normalized: null, identity: null });
  assert(!frameworkSelection.normalized.profiles.some(({ role }) => role === 'stage-extension'));
});

await runCase('stage-upstream-optional-evaluator-session-absence', () => {
  const contracts = new Set(stageProgressResult.normalized.contributors.map(({ contract }) => contract.id));
  assert(!contracts.has('SPEC-0009')); assert(!contracts.has('SPEC-0006')); assert(contracts.has('SPEC-0003'));
});

await runCase('stage-owner-boundary-exact', () => {
  const normalized = stageProfiles[0].normalized;
  assert.equal(normalized.owners.length, stageProgressResult.normalized.contributors.length);
  assert.equal(normalized.owners.filter(({ role }) => role === 'coordinator').length, 1);
  assert.equal(normalized.owners.find(({ role }) => role === 'coordinator').contract.id, 'SPEC-0003');
});

await runCase('stage-per-item-scheduler-neutral-graph', () => {
  const normalized = stageProfiles[0].normalized;
  assert(normalized.stages.every(({ execution }) => execution.scope === 'per-work-item' && !execution.globalBarrier && !execution.kernelPerStage && execution.physicalTopology === 'unspecified'));
  assert.equal(normalized.lifecycle.schedulerOwner, 'SPEC-0012');
});

await runCase('stage-entry-exit-surface-matrix', () => {
  const pair = stageProfiles[0].normalized;
  assert(pair.surfaces.some(({ checkpoint }) => checkpoint === 'entry'));
  assert(pair.surfaces.some(({ checkpoint }) => checkpoint === 'exit'));
  assert(pair.capabilities.some(({ bindings }) => bindings.length === 2));
  assert.equal(stageProfiles[1].normalized.surfaces[0].checkpoint, 'entry');
});

await runCase('stage-shared-surface-deterministic-order', () => {
  const normalized = stageProfiles[0].normalized; const shared = normalized.surfaces.find(({ checkpoint }) => checkpoint === 'exit');
  const selected = normalized.capabilities.filter(({ bindings }) => bindings.includes(shared.id));
  assert.equal(selected.length, 2); assert(selected.some(({ before }) => before.includes(selected.find(({ id }) => id.endsWith('audit-consistency')).id)));
});

await runCase('stage-first-product-deletion-base-context-stable', () => {
  const selected = stageProfiles[0].normalized.surfaces.find(({ id }) => id.endsWith('candidate-exit'));
  const deleted = stageDeletedProfile.normalized.surfaces.find(({ id }) => id.endsWith('candidate-exit'));
  assert.deepEqual(deleted.baseContext, selected.baseContext);
  assert.deepEqual(stageDeletedProfile.normalized.stages, stageProfiles[0].normalized.stages);
});

await runCase('stage-first-product-deletion-zero-owned-residue', () => {
  const normalized = stageDeletedProfile.normalized; const serialized = JSON.stringify(normalized);
  assert(!serialized.includes('product-priority')); assert(!serialized.includes('product-configuration')); assert(!normalized.surfaces.some(({ id }) => id.endsWith('candidate-entry')));
  assert.equal(normalized.capabilities.length, 1); assert.equal(normalized.surfaces.length, 1);
  assert.notDeepEqual(normalized.programContribution.sourceIdentity, stageProfiles[0].normalized.programContribution.sourceIdentity);
});

await runCase('stage-materially-different-nongame-profile', () => {
  const normalized = stageProfiles[1].normalized;
  assert(normalized.stages[0].purpose.includes('proof-search')); assert(!JSON.stringify(normalized).match(/chess|board|player|zero-sum|ranked-move|scalar-value/i));
});

await runCase('stage-resource-progress-binding', () => {
  const normalized = stageProfiles[0].normalized; const stageOwner = stageProgressResult.normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0003');
  assert(normalized.stages.every(({ entry }) => stageProgressResult.normalized.workClasses.some(({ id, owner }) => id === entry.workClass && owner === stageOwner.id)));
  assert(normalized.stages.every(({ resourceClasses }) => resourceClasses.every((id) => stageResourceResult.normalized.classes.some(({ id: classId, contributor }) => classId === id && contributor === stageOwner.id))));
});

await runCase('stage-pending-releases-worker-and-lease', () => {
  for (const normalized of stageProfiles.map(({ normalized }) => normalized)) for (const stageInput of normalized.stages) {
    const pending = stageInput.outcomes.find(({ kind }) => kind === 'pending'); assert(pending.workerReleased); assert(pending.mutableLeaseReleased);
  }
});

await runCase('stage-least-authority-permission-closure', () => {
  const normalized = stageProfiles[0].normalized;
  assert(normalized.permissions.every(({ lifetime, maximumUses }) => lifetime === 'checkpoint' && BigInt(maximumUses) > 0n));
  assert(normalized.surfaces.every(({ permissions }) => permissions.length > 0));
});

await runCase('stage-source-owner-port-closure', () => {
  const normalized = stageProfiles[0].normalized; const serialized = JSON.stringify(normalized.owners);
  assert(!serialized.match(/private|raw-pointer|cuda-handle/i)); assert(normalized.owners.some(({ ports }) => ports.length === 0));
});

await runCase('stage-finite-counter-closure', () => {
  const normalized = stageProfiles[0].normalized;
  assert.deepEqual(normalized.counters.map(({ kind }) => kind).sort(), ['capability-invocation', 'stage-transition', 'work-item-generation']);
  assert(normalized.counters.every(({ rollover, staleAliasProhibited }) => rollover === 'prohibited' && staleAliasProhibited));
});

await runCase('stage-device-owned-lifecycle', () => {
  const lifecycle = stageProfiles[0].normalized.lifecycle;
  assert.equal(lifecycle.hostProgress, 'none'); assert.equal(lifecycle.runtimeDiscovery, false); assert.equal(lifecycle.pendingWorkerRetention, 'none');
});

await runCase('stage-program-public-js-boundary', () => {
  const program = stageProfiles[0].normalized.programContribution;
  assert.equal(program.language, 'restricted-device-js'); assert.equal(program.runtimeRegistry, false); assert.equal(program.nativeArtifacts, false);
  assert.equal(program.provenance.trust, 'first-party-reviewed'); assert(stageProfiles[0].normalized.capabilities.every(({ provenance }) => provenance.trust === 'first-party-reviewed'));
  assert(program.requirements.every(({ id }) => id.startsWith('cuda-js.'))); assert(!JSON.stringify(program).match(/cuda-cpp|\.cu\b|ptx|ffi|native-addon|private-handle/i));
});

await runCase('stage-cleanup-selected-only-closure', () => {
  assert.equal(stageProfiles[0].normalized.cleanup.kinds.length, 8); assert(!stageProfiles[0].normalized.cleanup.kinds.includes('channel-binding'));
  assert.equal(stageProfiles[0].normalized.lifecycle.persistence, 'none'); assert.equal(stageProfiles[0].normalized.compatibility.migration.kind, 'none');
});

await runCase('stage-channel-requirement-avoids-profile-identity-cycle', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].channels.push({ requirement: stageSyntheticSchemaReference('cuda-mcgs.synthetic-required-channel'), bindings: [{ surface: mutated.capabilities[0].bindings[0], actions: ['produce', 'cancel'] }] });
  mutated.cleanup.kinds.push('channel-binding'); const normalized = normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult);
  assert.equal(normalized.normalized.capabilities.filter(({ channels }) => channels.length === 1).length, 1);
  assert.deepEqual(normalized.normalized.programContribution.inputs, stageProfiles[0].normalized.programContribution.inputs);
});

await runCase('reject-stage-channel-permission-outside-capability-surface', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[1].channels.push({ requirement: stageSyntheticSchemaReference('cuda-mcgs.synthetic-required-channel'), bindings: [{ surface: mutated.capabilities[0].bindings[0], actions: ['produce'] }] });
  mutated.cleanup.kinds.push('channel-binding'); assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CAPABILITY_CHANNEL' });
});

await runCase('reject-stage-channel-unknown-action', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].channels.push({ requirement: stageSyntheticSchemaReference('cuda-mcgs.synthetic-required-channel'), bindings: [{ surface: mutated.capabilities[0].bindings[0], actions: ['block-worker'] }] });
  mutated.cleanup.kinds.push('channel-binding'); assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CAPABILITY_CHANNEL' });
});

await runCase('reject-stage-unknown-field', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.scheduler = 'persistent-kernel';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_ROOT_FIELDS' });
});

await runCase('reject-stage-plan-drift', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.progressPlan.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_PLAN' });
});

await runCase('reject-stage-contribution-drift', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.resourceContribution.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CONTRIBUTION' });
});

await runCase('reject-stage-owner-gap', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.owners.pop();
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_OWNER_COVERAGE' });
});

await runCase('reject-stage-owner-profile-drift', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.owners[0].profile.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_OWNER_PROFILE' });
});

await runCase('reject-stage-coordinator-drift', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.owners.find(({ role }) => role === 'coordinator').role = 'source';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_OWNER_ROLE' });
});

await runCase('reject-stage-owner-port-residue', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.owners.find(({ role }) => role === 'source').ports.push(stageSyntheticSchemaReference('cuda-mcgs.synthetic-unused-owner-port'));
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_OWNER_PORT_RESIDUE' });
});

await runCase('reject-stage-known-source-profile-port-crossing', () => {
  const mutated = clone(stageProfileInputs[0]); const domainOwner = mutated.owners.find(({ contract }) => contract.id === 'SPEC-0007'); const prior = domainOwner.ports[0]; const replacement = stageSyntheticSchemaReference('cuda-mcgs.synthetic-foreign-domain-port');
  domainOwner.ports = domainOwner.ports.map((port) => port.sha256 === prior.sha256 ? replacement : port);
  for (const permissionInput of mutated.permissions) if (permissionInput.sourceOwner === domainOwner.id && permissionInput.sourcePort.sha256 === prior.sha256) permissionInput.sourcePort = replacement;
  for (const surfaceInput of mutated.surfaces) for (const field of surfaceInput.baseContext) if (field.sourceOwner === domainOwner.id && field.sourcePort.sha256 === prior.sha256) field.sourcePort = replacement;
  for (const capabilityInput of mutated.capabilities) for (const selectedEffect of capabilityInput.effects) if (selectedEffect.owner === domainOwner.id && selectedEffect.port.sha256 === prior.sha256) selectedEffect.port = replacement;
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult, knownResourceProfiles), { code: 'EXT_OWNER_PORT' });
});

await runCase('reject-stage-empty-selected-profile', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities = [];
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CAPABILITY_COUNT' });
});

await runCase('reject-stage-unknown-entry', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.entryStage = 'extension-stage.unknown';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_STAGE_ENTRY' });
});

await runCase('reject-stage-unreachable-state', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.entryStage = mutated.stages[1].id;
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_STAGE_GRAPH' });
});

await runCase('reject-stage-unknown-target', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.stages[0].outcomes.find(({ kind }) => kind === 'transition').target = 'extension-stage.unknown';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_STAGE_TARGET' });
});

await runCase('reject-stage-missing-terminal-disposition', () => {
  const mutated = clone(stageProfileInputs[1]); for (const outcome of mutated.stages[0].outcomes) if (['terminal', 'failure', 'cancellation'].includes(outcome.kind)) outcome.kind = 'pressure';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_STAGE_TERMINAL' });
});

await runCase('reject-stage-global-barrier-topology', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.stages[0].execution.globalBarrier = true;
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_STAGE_EXECUTION' });
});

await runCase('reject-stage-kernel-per-stage-topology', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.stages[0].execution.kernelPerStage = true;
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_STAGE_EXECUTION' });
});

await runCase('reject-stage-work-counter-drift', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.stages[0].workItem.generationCounter = mutated.counters.find(({ kind }) => kind === 'stage-transition').id;
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_WORK_ITEM_COUNTER' });
});

await runCase('reject-stage-transition-counter-drift', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.stages[0].transitionCounter = mutated.counters.find(({ kind }) => kind === 'work-item-generation').id;
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_STAGE_COUNTER' });
});

await runCase('reject-stage-resource-class-crossing', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.stages[0].resourceClasses[0] = stageResourceResult.normalized.classes.find(({ contributor }) => contributor !== stageResourceResult.normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0003').id).id;
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_STAGE_RESOURCE' });
});

await runCase('reject-stage-item-capacity', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.stages[0].bounds.maxItems = '4097';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_STAGE_RESOURCE' });
});

await runCase('reject-stage-pending-worker-retention', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.stages[0].outcomes.find(({ kind }) => kind === 'pending').workerReleased = false;
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_STAGE_OUTCOME_RELEASE' });
});

await runCase('reject-stage-mid-stage-surface', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.surfaces[0].checkpoint = 'middle';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_SURFACE_CHECKPOINT' });
});

await runCase('reject-stage-surface-host-progress', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.surfaces[0].hostProgress = 'callback';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_SURFACE_CONTRACT' });
});

await runCase('reject-stage-context-overlap', () => {
  const mutated = clone(stageProfileInputs[0]); const field = clone(mutated.surfaces[1].baseContext[0]); field.id = 'extension-context.synthetic-capability-pair.overlap'; mutated.surfaces[1].baseContext.push(field); mutated.capabilities[0].requiredFacts.push(field.id);
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CONTEXT_OVERLAP' });
});

await runCase('reject-stage-context-alignment', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.surfaces[1].baseContext[0].offsetBytes = '1';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CONTEXT_RANGE' });
});

await runCase('reject-stage-context-permission-gap', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.surfaces[0].permissions = [];
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CONTEXT_PERMISSION' });
});

await runCase('reject-stage-unused-context', () => {
  const mutated = clone(stageProfileInputs[0]); const field = clone(mutated.surfaces[1].baseContext[0]); field.id = 'extension-context.synthetic-capability-pair.unused'; field.offsetBytes = '64'; mutated.surfaces[1].baseContext.push(field);
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CONTEXT_RESIDUE' });
});

await runCase('reject-stage-required-fact-without-capability-permission', () => {
  const mutated = clone(stageProfileInputs[0]); const permissionId = mutated.permissions.find(({ id }) => id.endsWith('product-graph-read')).id;
  mutated.permissions = mutated.permissions.filter(({ id }) => id !== permissionId);
  for (const surfaceInput of mutated.surfaces) surfaceInput.permissions = surfaceInput.permissions.filter((id) => id !== permissionId);
  for (const capabilityInput of mutated.capabilities) capabilityInput.permissions = capabilityInput.permissions.filter((id) => id !== permissionId);
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CAPABILITY_PERMISSION' });
});

await runCase('reject-stage-permission-owner-drift', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.permissions[0].sourceOwner = mutated.owners.find(({ contract }) => contract.id === 'SPEC-0013').id;
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_PERMISSION_PORT' });
});

await runCase('reject-stage-permission-outside-binding', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].bindings = [mutated.capabilities[0].bindings[0]];
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CAPABILITY_PERMISSION' });
});

await runCase('reject-stage-capability-unknown-surface', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].bindings[0] = 'extension-surface.unknown';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CAPABILITY_BINDING' });
});

await runCase('reject-stage-capability-owner-gap', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].semanticOwner = 'owner.unknown';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CAPABILITY_OWNER' });
});

await runCase('reject-stage-capability-catalog-owner', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].ownerContract = clone(mutated.contract);
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CAPABILITY_OWNER' });
});

await runCase('reject-stage-unordered-noncommuting-capabilities', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].before = []; mutated.capabilities[1].after = [];
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CAPABILITY_ORDER' });
});

await runCase('reject-stage-capability-order-cycle', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].after = [mutated.capabilities[1].id];
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CAPABILITY_ORDER' });
});

await runCase('reject-stage-contribution-resource-crossing', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].contributions[0].resourceClass = stageResourceResult.normalized.classes.find(({ contributor }) => contributor !== stageResourceResult.normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0003').id).id;
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CONTRIBUTION_RESOURCE' });
});

await runCase('reject-stage-contribution-capacity', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].contributions[0].sizeBytes = '65537';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CONTRIBUTION_CAPACITY' });
});

await runCase('reject-stage-contribution-alignment', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].contributions[0].alignment = '8';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CONTRIBUTION_ALIGNMENT' });
});

await runCase('reject-stage-effect-owner-port-crossing', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].effects[0].port = stageSyntheticSchemaReference('cuda-mcgs.synthetic-private-owner-port');
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_EFFECT_OWNER' });
});

await runCase('reject-stage-effect-without-capability-permission', () => {
  const mutated = clone(stageProfileInputs[0]); const permissionId = mutated.permissions.find(({ id }) => id.endsWith('product-policy-control')).id;
  mutated.permissions = mutated.permissions.filter(({ id }) => id !== permissionId);
  for (const surfaceInput of mutated.surfaces) surfaceInput.permissions = surfaceInput.permissions.filter((id) => id !== permissionId);
  for (const capabilityInput of mutated.capabilities) capabilityInput.permissions = capabilityInput.permissions.filter((id) => id !== permissionId);
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CAPABILITY_PERMISSION' });
});

await runCase('reject-stage-runtime-resource-activation', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].activation.newResources = true;
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_ACTIVATION_CONTRACT' });
});

await runCase('reject-stage-private-cuda-js-requirement', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].requirements[0] = stageSyntheticSchemaReference('cuda-js.private-stage-hook');
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CAPABILITY_REQUIREMENT' });
});

await runCase('reject-stage-counter-wrap', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.counters[0].rollover = 'reuse';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_COUNTER_RANGE' });
});

await runCase('reject-stage-status-gap', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.statuses.pop();
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_STATUS_COVERAGE' });
});

await runCase('reject-stage-status-class', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.statuses.find(({ code }) => code === 'extension-failed').class = 'normal';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_STATUS_CLASS' });
});

await runCase('reject-stage-lifecycle-host-progress', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.lifecycle.hostProgress = 'poll-relaunch';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_LIFECYCLE_CONTRACT' });
});

await runCase('reject-stage-runtime-discovery', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.lifecycle.runtimeDiscovery = true;
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_LIFECYCLE_CONTRACT' });
});

await runCase('reject-stage-diagnostic-native-state', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.diagnostics.cudaHandles = true;
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_DIAGNOSTIC_CONTRACT' });
});

await runCase('reject-stage-migration-without-contract', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.compatibility.migration.kind = 'runtime';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_COMPATIBILITY_CONTRACT' });
});

await runCase('reject-stage-cleanup-gap', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.cleanup.kinds.pop();
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CLEANUP_COVERAGE' });
});

await runCase('reject-stage-channel-cleanup-residue-gap', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.capabilities[0].channels.push({ requirement: stageSyntheticSchemaReference('cuda-mcgs.synthetic-pending-channel'), bindings: [{ surface: mutated.capabilities[0].bindings[0], actions: ['produce'] }] });
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_CLEANUP_COVERAGE' });
});

await runCase('reject-stage-native-program-language', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.programContribution.language = 'cuda-cpp';
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_PROGRAM_LANGUAGE' });
});

await runCase('reject-stage-runtime-registry', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.programContribution.runtimeRegistry = true;
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_PROGRAM_LANGUAGE' });
});

await runCase('reject-stage-program-input-drift', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.programContribution.inputs.pop();
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_PROGRAM_INPUTS' });
});

await runCase('reject-stage-program-requirement-drift', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.programContribution.requirements[0] = { ...mutated.programContribution.requirements[0], sha256: '0'.repeat(64) };
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_PROGRAM_REQUIREMENTS' });
});

await runCase('reject-stage-product-owner', () => {
  const mutated = clone(stageProfileInputs[0]); mutated.productData.push({ ownerContract: clone(mutated.contract), schema: stageSyntheticSchemaReference('cuda-mcgs.synthetic-invalid-stage-product'), identity: stageSyntheticContentIdentity('invalid-stage-product') });
  assert.throws(() => normalizeStageProfile(mutated, inspected, stageResourceResult, stageProgressResult), { code: 'EXT_PRODUCT_OWNER' });
});

await runCase('channel-schema-closed', () => {
  assert.equal(channelProfileSchema.properties.schema.const, 'cuda-mcgs.channel-profile/0.2.0');
  assert.equal(channelProfileSchema.additionalProperties, false);
  for (const name of ['catalogContract', 'profileReference', 'owner', 'role', 'finiteIdentity', 'itemIdentity', 'payload', 'transition', 'stateGraph', 'claim', 'ordering', 'publication', 'capacity', 'allocation', 'resources', 'descriptor', 'dependency', 'noProgress', 'progress', 'consumption', 'counter', 'cancellation', 'expiry', 'reclamation', 'channelLifecycle', 'channelCompatibility', 'channelCleanup', 'provenance', 'channel', 'status', 'rootLifecycle', 'diagnostics', 'noPersistence', 'rootCompatibility', 'rootCleanup', 'programContribution', 'productData', 'productOwner']) assert.equal(channelProfileSchema.$defs[name].additionalProperties, false);
});

await runCase('channel-absence-zero-residue', () => {
  assert.deepEqual(normalizeChannelProfile(null, inspected, channelResourceResult, channelProgressResult, channelStageResult), { normalized: null, identity: null });
});

await runCase('channel-profile-second-instance-distinct', () => {
  assert.equal(new Set(channelProfiles.map(({ identity }) => identity.sha256)).size, 2);
  assert.deepEqual(channelProfiles.map(({ normalized }) => normalized.channels.length), [2, 1]);
  assert.deepEqual(channelProfiles.map(({ normalized }) => normalized.channels[0].consumption.class), ['advisory', 'advisory']);
  assert(channelProfiles[0].normalized.channels.some(({ consumption }) => consumption.class === 'required'));
});

await runCase('channel-profile-order-independent', () => {
  const reordered = clone(channelProfileInputs[0]);
  for (const key of ['owners', 'channels', 'statuses', 'productData']) reordered[key].reverse();
  reordered.programContribution.inputs.reverse(); reordered.programContribution.requirements.reverse(); reordered.cleanup.kinds.reverse();
  for (const channel of reordered.channels) {
    for (const key of ['roles', 'payloads', 'counters', 'outcomes', 'requirements']) channel[key].reverse();
    channel.stateGraph.states.reverse(); channel.stateGraph.transitions.reverse(); channel.resources.allocations.reverse();
    channel.progress.descriptors.reverse(); channel.progress.dependencies.reverse(); channel.lifecycle.cancellation.reverse();
    channel.lifecycle.reclamation.preconditions.reverse(); channel.cleanup.kinds.reverse();
  }
  assert.deepEqual(normalizeChannelProfile(reordered, inspected, channelResourceResult, channelProgressResult, channelStageResult).identity, channelProfiles[0].identity);
});

await runCase('channel-evaluator-request-result-required', () => {
  const channel = channelProfiles[0].normalized.channels.find(({ consumption }) => consumption.class === 'required');
  assert.deepEqual(channel.payloads.map(({ kind }) => kind).sort(), ['request', 'result']);
  assert.equal(channel.claim.mode, 'single-consumer-transfer');
  assert(channel.stateGraph.states.includes('in-progress') && channel.stateGraph.states.includes('result-ready'));
  assert.equal(channel.consumption.unavailable, 'pending-release-worker');
});

await runCase('channel-secondary-work-advisory-multiborrow', () => {
  const channel = channelProfiles[1].normalized.channels[0];
  assert.equal(channel.consumption.class, 'advisory');
  assert.equal(channel.consumption.unavailable, 'owner-fallback');
  assert.equal(channel.claim.mode, 'finite-multi-consumer-immutable-borrow');
  assert.equal(channel.claim.referenceAccounting, 'exact');
});

await runCase('channel-first-product-deletion-zero-owned-residue', () => {
  const serialized = JSON.stringify(channelDeletedProfile.normalized);
  assert.equal(channelDeletedProfile.normalized.id, channelProfiles[0].normalized.id);
  assert.equal(channelDeletedProfile.normalized.channels.length, 1);
  assert(!serialized.includes('evaluator-request'));
  assert(!serialized.includes('product-priority'));
  assert.notDeepEqual(channelDeletedProfile.identity, channelProfiles[0].identity);
  assert.notDeepEqual(channelDeletedResourceResult.identity, channelResourceResult.identity);
  assert.notDeepEqual(channelDeletedProgressResult.identity, channelProgressResult.identity);
  const deletedOwner = channelDeletedResourceResult.normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0004');
  const maxima = Object.fromEntries(channelDeletedResourceResult.normalized.classes.filter(({ contributor }) => contributor === deletedOwner.id).map(({ id, formula }) => [id.split('class-channel-').at(-1), formula.maximumUnits]));
  assert.deepEqual(maxima, { borrow: '256', diagnostic: '8192', item: '64', payload: '16384', pending: '64', result: '8192' });
});

await runCase('channel-ordering-explicit-and-owner-complete', () => {
  const required = channelProfiles[0].normalized.channels.find(({ consumption }) => consumption.class === 'required');
  const advisory = channelProfiles[0].normalized.channels.find(({ consumption }) => consumption.class === 'advisory');
  assert.equal(required.ordering.kind, 'owner-defined'); assert(required.ordering.rule);
  assert.deepEqual(advisory.ordering, { kind: 'unordered', rule: null });
});

await runCase('channel-resource-progress-stage-binding', () => {
  const resourceOwner = channelResourceResult.normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0004');
  const progressOwner = channelProgressResult.normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0004');
  const work = channelProgressResult.normalized.workClasses.find(({ owner }) => owner === progressOwner.id);
  assert.equal(work.kind, 'producer-unblocking');
  assert(channelResourceResult.normalized.classes.filter(({ contributor }) => contributor === resourceOwner.id).length >= 6);
  assert(channelProfiles[0].normalized.channels.every(({ progress }) => progress.workClass === work.id));
});

await runCase('channel-stage-grants-consumed-exactly', () => {
  const used = channelProfiles[0].normalized.channels.flatMap(({ roles }) => roles.flatMap(({ actions }) => actions)).length;
  const granted = channelStageResult.normalized.capabilities.flatMap(({ channels }) => channels.flatMap(({ bindings }) => bindings.flatMap(({ actions }) => actions))).length;
  assert.equal(used, granted);
  assert.equal(granted, 12);
});

await runCase('channel-logical-release-acquire-publication', () => {
  for (const channel of channelProfiles[0].normalized.channels) {
    assert.equal(channel.publication.release, 'logical-release'); assert.equal(channel.publication.acquire, 'logical-acquire');
    assert.equal(channel.publication.scope, 'device'); assert.equal(channel.publication.nativeSpelling, 'none');
    assert.equal(channel.publication.nativeQualification, 'pending-exact-compatible-pair');
  }
});

await runCase('channel-finite-capacity-watermark-closure', () => {
  for (const channel of channelProfiles[0].normalized.channels) {
    assert(BigInt(channel.capacity.highAt) < BigInt(channel.capacity.criticalAt));
    assert(BigInt(channel.capacity.criticalAt) < BigInt(channel.capacity.exhaustedAt));
    assert.equal(channel.capacity.exhaustedAt, channel.capacity.slots);
  }
});

await runCase('channel-state-graph-terminal-and-reuse-closure', () => {
  for (const channel of channelProfiles[0].normalized.channels) {
    assert(channel.stateGraph.states.includes('reserved-unpublished'));
    assert(channel.stateGraph.transitions.some(({ from, to }) => from === 'terminally-disposed' && to === 'reclaimable'));
    assert(channel.stateGraph.transitions.some(({ from, to, operation }) => from === 'reclaimable' && to === 'free' && operation === 'advance-generation'));
  }
});

await runCase('channel-finite-counter-no-wrap-closure', () => {
  for (const channel of channelProfiles[0].normalized.channels) {
    assert.equal(channel.counters.length, 9);
    assert(channel.counters.every(({ rollover, exhaustionOutcome }) => rollover === 'prohibited' && exhaustionOutcome === 'channel-counter-exhausted'));
  }
});

await runCase('channel-device-owned-boundary', () => {
  const serialized = JSON.stringify(channelProfiles[0].normalized);
  assert(channelProfiles[0].normalized.channels.every(({ lifecycle }) => lifecycle.hostProgress === 'none' && lifecycle.workerWait === 'none'));
  assert(!serialized.includes('persistent-kernel') && !serialized.includes('host-callback') && !serialized.includes('micro-batch'));
});

await runCase('channel-program-public-js-boundary', () => {
  const program = channelProfiles[0].normalized.programContribution;
  assert.equal(program.language, 'restricted-device-js'); assert.equal(program.runtimeRegistry, false); assert.equal(program.nativeArtifacts, false);
  assert.deepEqual(program.requirements.map(({ id }) => id), ['cuda-js.device-js/0.1.0', 'cuda-js.device-publication-release-acquire/0.1.0', 'cuda-js.operation-lifecycle/0.1.0']);
  assert.equal(channelProfiles[0].normalized.compatibility.nativeQualification, 'pending-exact-compatible-pair');
});

await runCase('channel-cleanup-lifecycle-closure', () => {
  assert.equal(channelProfiles[0].normalized.cleanup.kinds.length, 11);
  for (const channel of channelProfiles[0].normalized.channels) {
    assert.equal(channel.lifecycle.cancellation.length, channel.stateGraph.states.length);
    assert.equal(channel.lifecycle.reclamation.generationAdvanceBeforeReuse, true);
  }
});

await runCase('channel-reference-serial-publication', () => {
  const channel = channelProfiles[0].normalized.channels.find(({ consumption }) => consumption.class === 'required');
  const result = simulateChannelTrace(channelProfiles[0].normalized, channel.id, [
    { kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, generation: 0 }, { kind: 'publish', slot: 0, generation: 0, release: true },
    { kind: 'claim', slot: 0, generation: 0, acquire: true }, { kind: 'consume', slot: 0, generation: 0 }, { kind: 'complete', slot: 0, generation: 0 }, { kind: 'reclaim', slot: 0, generation: 0 },
  ]);
  assert.equal(result.slots[0].state, 'free'); assert.equal(result.conservation, channel.capacity.slots);
});

await runCase('channel-reference-required-pending-releases-worker', () => {
  const channel = channelProfiles[0].normalized.channels.find(({ consumption }) => consumption.class === 'required');
  const result = simulateChannelTrace(channelProfiles[0].normalized, channel.id, [{ kind: 'await-unavailable' }]);
  assert.deepEqual(result.events[0], { kind: 'pending', workerReleased: true, mutableLeaseReleased: true });
});

await runCase('channel-reference-capacity-pressure-zero-publication', () => {
  const channel = channelProfiles[0].normalized.channels.find(({ consumption }) => consumption.class === 'required');
  const operations = Array.from({ length: Number(channel.capacity.slots) }, (_, slot) => ({ kind: 'reserve', slot })); operations.push({ kind: 'reserve', slot: 0 });
  const result = simulateChannelTrace(channelProfiles[0].normalized, channel.id, operations);
  assert.deepEqual(result.events.at(-1), { kind: 'pressure', published: false });
});

await runCase('channel-reference-multiborrow-accounting', () => {
  const channel = channelProfiles[1].normalized.channels[0];
  const result = simulateChannelTrace(channelProfiles[1].normalized, channel.id, [
    { kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, generation: 0 }, { kind: 'publish', slot: 0, generation: 0, release: true },
    { kind: 'claim', slot: 0, generation: 0, acquire: true }, { kind: 'claim', slot: 0, generation: 0, acquire: true }, { kind: 'consume', slot: 0, generation: 0 },
    { kind: 'release', slot: 0, generation: 0 }, { kind: 'release', slot: 0, generation: 0 }, { kind: 'complete', slot: 0, generation: 0 }, { kind: 'reclaim', slot: 0, generation: 0 },
  ]);
  assert.equal(result.slots[0].claims, '0'); assert.equal(result.slots[0].state, 'free');
});

await runCase('channel-reference-stale-generation-rejected', () => {
  const channel = channelProfiles[1].normalized.channels[0];
  assert.throws(() => simulateChannelTrace(channelProfiles[1].normalized, channel.id, [
    { kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, generation: 0 }, { kind: 'publish', slot: 0, generation: 0, release: true },
    { kind: 'claim', slot: 0, generation: 0, acquire: true }, { kind: 'complete', slot: 0, generation: 0 }, { kind: 'reclaim', slot: 0, generation: 0 },
    { kind: 'reserve', slot: 0 }, { kind: 'claim', slot: 0, generation: 0, acquire: true },
  ]), { code: 'CHANNEL_REFERENCE_STALE' });
});

await runCase('channel-reference-cancel-late-completion-no-resurrection', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  const result = simulateChannelTrace(channelProfiles[0].normalized, channel.id, [
    { kind: 'reserve', slot: 0 }, { kind: 'cancel', slot: 0, generation: 0 }, { kind: 'late-complete', slot: 0, generation: 0 }, { kind: 'reclaim', slot: 0, generation: 0 },
  ]);
  assert(result.events.some(({ kind }) => kind === 'late-ignored')); assert.equal(result.slots[0].state, 'free');
});

await runCase('channel-reference-expiry-terminal', () => {
  const channel = channelProfiles[1].normalized.channels[0];
  const result = simulateChannelTrace(channelProfiles[1].normalized, channel.id, [
    { kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, generation: 0 }, { kind: 'publish', slot: 0, generation: 0, release: true }, { kind: 'expire', slot: 0, generation: 0 },
  ]);
  assert.equal(result.slots[0].state, 'terminally-disposed'); assert.equal(result.slots[0].disposition, 'expired');
});

await runCase('channel-reference-producer-service-while-pending', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  assert.equal(classifyChannelProgress(channelProfiles[0].normalized, channel.id, { pendingConsumers: true, producerRunnable: true, escapeRunnable: false }), 'service-producer');
});

await runCase('channel-reference-typed-no-progress', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  assert.equal(classifyChannelProgress(channelProfiles[0].normalized, channel.id, { pendingConsumers: true, producerRunnable: false, escapeRunnable: false }), 'channel-no-progress');
});

await runCase('channel-identity-content-sensitive', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].capacity.maxRetries = '7';
  assert.notDeepEqual(normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult).identity, channelProfiles[0].identity);
});

await runCase('reject-channel-unknown-field', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.queueLayout = 'ring';
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_ROOT_FIELDS' });
});

await runCase('reject-channel-plan-drift', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.stageProfile.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PLAN' });
});

await runCase('reject-channel-contribution-drift', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.resourceContribution.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_CONTRIBUTION' });
});

await runCase('reject-channel-owner-profile-drift', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.owners[0].profile.identity.sha256 = '0'.repeat(64);
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_OWNER_PROFILE' });
});

await runCase('reject-channel-owner-residue', () => {
  const mutated = clone(channelProfileInputs[1]); mutated.owners.push(clone(channelProfileInputs[0].owners.find(({ id }) => !mutated.owners.some(({ id: selected }) => selected === id))));
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelDeletedResourceResult, channelDeletedProgressResult, channelDeletedStageResult), { code: 'CHANNEL_OWNER_RESIDUE' });
});

await runCase('reject-channel-empty-selected-profile', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels = []; mutated.owners = [];
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_COUNT' });
});

await runCase('reject-channel-stage-requirement-drift', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].requirement = channelSyntheticSchemaReference('cuda-mcgs.channel-requirement.unknown');
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_STAGE_PERMISSION' });
});

await runCase('reject-channel-stage-capability-drift', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].roles[0].capability = 'extension-capability.unknown';
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_STAGE_BINDING' });
});

await runCase('reject-channel-stage-permission-widening', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].roles[0].actions.push('claim');
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_STAGE_PERMISSION' });
});

await runCase('reject-channel-stage-permission-omission', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].roles[0].actions = mutated.channels[0].roles[0].actions.filter((action) => action !== 'release');
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_STAGE_PERMISSION' });
});

await runCase('reject-channel-payload-owner', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].payloads[0].owner = 'owner.unknown';
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PAYLOAD_OWNER' });
});

await runCase('reject-channel-mutable-ready-payload', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].payloads[0].immutableAtReady = false;
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PAYLOAD_BOUNDARY' });
});

await runCase('reject-channel-state-gap', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].stateGraph.states = mutated.channels[0].stateGraph.states.filter((state) => state !== 'reclaimable'); mutated.channels[0].stateGraph.transitions = mutated.channels[0].stateGraph.transitions.filter(({ from, to }) => from !== 'reclaimable' && to !== 'reclaimable'); mutated.channels[0].lifecycle.cancellation = mutated.channels[0].lifecycle.cancellation.filter(({ state }) => state !== 'reclaimable');
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_STATE_GRAPH' });
});

await runCase('reject-channel-state-unreachable', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].stateGraph.transitions = mutated.channels[0].stateGraph.transitions.filter(({ to }) => to !== 'result-ready');
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_STATE_GRAPH' });
});

await runCase('reject-channel-claim-mode-mismatch', () => {
  const mutated = clone(channelProfileInputs[1]); mutated.channels[0].claim.ownership = 'transfer';
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelDeletedResourceResult, channelDeletedProgressResult, channelDeletedStageResult), { code: 'CHANNEL_CLAIM_MODE' });
});

await runCase('reject-channel-publication-release-gap', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].publication.release = 'relaxed';
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PUBLICATION' });
});

await runCase('reject-channel-publication-scope-gap', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].publication.scope = 'block';
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PUBLICATION' });
});

await runCase('reject-channel-publication-private-recipe', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].publication.nativeSpelling = 'fence-plus-relaxed-rmw';
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PUBLICATION' });
});

await runCase('reject-channel-capacity-watermark-order', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].capacity.highAt = mutated.channels[0].capacity.criticalAt;
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_CAPACITY_RANGE' });
});

await runCase('reject-channel-resource-class-crossing', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].resources.allocations[0].class = channelResourceResult.normalized.classes.find(({ contributor }) => contributor !== channelResourceResult.normalized.contributors.find(({ contract }) => contract.id === 'SPEC-0004').id).id;
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_RESOURCE_ALLOCATION' });
});

await runCase('reject-channel-resource-overcommit', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].resources.allocations.find(({ class: id }) => id.endsWith('class-channel-payload')).units = '65536';
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_RESOURCE_ALLOCATION' });
});

await runCase('reject-channel-resource-underallocation', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].resources.allocations.find(({ kind }) => kind === 'payload').units = '32752';
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_RESOURCE_ALLOCATION' });
});

await runCase('reject-channel-ordering-rule-gap', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].ordering.rule = null;
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_ORDERING' });
});

await runCase('reject-channel-hidden-growth', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].resources.hiddenGrowth = true;
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_RESOURCE_CONTRACT' });
});

await runCase('reject-channel-progress-work-drift', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].progress.workClass = channelProgressResult.normalized.workClasses.find(({ kind }) => kind === 'ordinary').id;
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PROGRESS_WORK' });
});

await runCase('reject-channel-progress-descriptor-gap', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].progress.descriptors.pop();
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PROGRESS_DESCRIPTOR' });
});

await runCase('reject-channel-pending-holds-worker', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].progress.dependencies[0].holdsWorker = true;
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PROGRESS_DEPENDENCY' });
});

await runCase('reject-channel-required-escape-gap', () => {
  const mutated = clone(channelProfileInputs[0]); const required = mutated.channels.find(({ consumption }) => consumption.class === 'required'); required.progress.dependencies[0].escapes = ['cancel'];
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PROGRESS_DEPENDENCY' });
});

await runCase('reject-channel-advisory-fallback-gap', () => {
  const mutated = clone(channelProfileInputs[1]); mutated.channels[0].progress.dependencies[0].fallback = null;
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelDeletedResourceResult, channelDeletedProgressResult, channelDeletedStageResult), { code: 'CHANNEL_PROGRESS_DEPENDENCY' });
});

await runCase('reject-channel-dependency-unknown-producer', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].progress.dependencies[0].producerRoles = ['channel-role.unknown'];
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PROGRESS_DEPENDENCY' });
});

await runCase('reject-channel-required-dependency-cycle', () => {
  const mutated = clone(channelProfileInputs[0]); const [left, right] = mutated.channels;
  left.progress.dependencies[0].producerChannel = right.id;
  right.progress.dependencies[0].producerChannel = left.id; right.progress.dependencies[0].requirement = 'required'; right.progress.dependencies[0].fallback = null; right.progress.dependencies[0].escapes = ['failure', 'cancel', 'stop', 'stale'];
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PROGRESS_CYCLE' });
});

await runCase('reject-channel-consumption-timeout-switching', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].consumption.timeoutSwitching = true;
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_CONSUMPTION_CLASS' });
});

await runCase('reject-channel-counter-wrap', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].counters[0].rollover = 'wrap';
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_COUNTER_RANGE' });
});

await runCase('reject-channel-cancellation-state-gap', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].lifecycle.cancellation.pop();
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_CANCELLATION' });
});

await runCase('reject-channel-reclamation-reference-gap', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].lifecycle.reclamation.preconditions = mutated.channels[0].lifecycle.reclamation.preconditions.filter((entry) => entry !== 'borrows-zero');
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_RECLAMATION' });
});

await runCase('reject-channel-host-progress-loop', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].lifecycle.hostProgress = 'poll-relaunch';
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_LIFECYCLE' });
});

await runCase('reject-channel-status-gap', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.statuses.pop();
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_STATUS_COVERAGE' });
});

await runCase('reject-channel-cleanup-gap', () => {
  const mutated = clone(channelProfileInputs[1]); mutated.channels[0].cleanup.kinds = mutated.channels[0].cleanup.kinds.filter((kind) => kind !== 'borrow');
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelDeletedResourceResult, channelDeletedProgressResult, channelDeletedStageResult), { code: 'CHANNEL_ITEM_CLEANUP' });
});

await runCase('reject-channel-native-program-language', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.programContribution.language = 'cuda-c++';
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PROGRAM_BOUNDARY' });
});

await runCase('reject-channel-private-program-requirement', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].requirements[0] = channelSyntheticSchemaReference('cuda-js.private-driver-helper');
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_REQUIREMENT' });
});

await runCase('reject-channel-runtime-registry', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.programContribution.runtimeRegistry = true;
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PROGRAM_BOUNDARY' });
});

await runCase('reject-channel-reference-missing-release', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  assert.throws(() => simulateChannelTrace(channelProfiles[0].normalized, channel.id, [{ kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, generation: 0 }, { kind: 'publish', slot: 0, generation: 0, release: false }]), { code: 'CHANNEL_REFERENCE_RELEASE' });
});

await runCase('reject-channel-reference-missing-acquire', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  assert.throws(() => simulateChannelTrace(channelProfiles[0].normalized, channel.id, [{ kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, generation: 0 }, { kind: 'publish', slot: 0, generation: 0, release: true }, { kind: 'claim', slot: 0, generation: 0, acquire: false }]), { code: 'CHANNEL_REFERENCE_ACQUIRE' });
});

await runCase('reject-channel-reference-uninitialized-publication', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  assert.throws(() => simulateChannelTrace(channelProfiles[0].normalized, channel.id, [{ kind: 'reserve', slot: 0 }, { kind: 'publish', slot: 0, generation: 0, release: true }]), { code: 'CHANNEL_REFERENCE_UNINITIALIZED' });
});

await runCase('reject-channel-reference-live-reclaim', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  assert.throws(() => simulateChannelTrace(channelProfiles[0].normalized, channel.id, [{ kind: 'reserve', slot: 0 }, { kind: 'reclaim', slot: 0, generation: 0 }]), { code: 'CHANNEL_REFERENCE_RECLAIM' });
});

await runCase('reject-channel-reference-borrow-bound', () => {
  const channel = channelProfiles[1].normalized.channels[0];
  const operations = [{ kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, generation: 0 }, { kind: 'publish', slot: 0, generation: 0, release: true }, ...Array.from({ length: 5 }, () => ({ kind: 'claim', slot: 0, generation: 0, acquire: true }))];
  assert.throws(() => simulateChannelTrace(channelProfiles[1].normalized, channel.id, operations), { code: 'CHANNEL_REFERENCE_CLAIM' });
});

await runCase('reject-channel-reference-generation-exhaustion-before-alias', () => {
  const profile = clone(channelProfiles[1].normalized); const channel = profile.channels[0];
  channel.itemIdentity.generation.maximum = '1'; channel.counters.find(({ kind }) => kind === 'generation').maximum = '1';
  assert.throws(() => simulateChannelTrace(profile, channel.id, [
    { kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, generation: 0 }, { kind: 'publish', slot: 0, generation: 0, release: true }, { kind: 'complete', slot: 0, generation: 0 }, { kind: 'reclaim', slot: 0, generation: 0 },
    { kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, generation: 1 }, { kind: 'publish', slot: 0, generation: 1, release: true }, { kind: 'complete', slot: 0, generation: 1 }, { kind: 'reclaim', slot: 0, generation: 1 },
    { kind: 'reserve', slot: 0 },
  ]), { code: 'CHANNEL_REFERENCE_COUNTER_EXHAUSTED' });
});

await runCase('reject-channel-reference-pending-capacity', () => {
  const profile = clone(channelProfiles[0].normalized); const channel = profile.channels.find(({ consumption }) => consumption.class === 'required');
  channel.capacity.maxPending = '1';
  assert.throws(() => simulateChannelTrace(profile, channel.id, [{ kind: 'await-unavailable' }, { kind: 'await-unavailable' }]), { code: 'CHANNEL_REFERENCE_PENDING' });
});

await runCase('channel-reference-cancellation-preserves-borrow-accounting', () => {
  const channel = channelProfiles[1].normalized.channels[0];
  const prefix = [
    { kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, generation: 0 }, { kind: 'publish', slot: 0, generation: 0, release: true },
    { kind: 'claim', slot: 0, generation: 0, acquire: true }, { kind: 'cancel', slot: 0, generation: 0 },
  ];
  assert.throws(() => simulateChannelTrace(channelProfiles[1].normalized, channel.id, [...prefix, { kind: 'reclaim', slot: 0, generation: 0 }]), { code: 'CHANNEL_REFERENCE_RECLAIM' });
  const result = simulateChannelTrace(channelProfiles[1].normalized, channel.id, [...prefix, { kind: 'release', slot: 0, generation: 0 }, { kind: 'reclaim', slot: 0, generation: 0 }]);
  assert.equal(result.slots[0].state, 'free');
});

await runCase('universal-normalized-product-assumption-absence', () => {
  const normalizedUniversalArtifacts = [
    frameworkSelection.normalized,
    ...domainProfiles.map(({ normalized }) => normalized),
    ...graphProfiles.map(({ normalized }) => normalized),
    ...policyProfiles.map(({ normalized }) => normalized),
    ...evaluatorProfiles.map(({ normalized }) => normalized),
    ...resourceProfiles.map(({ normalized }) => normalized),
    ...progressProfiles.map(({ normalized }) => normalized),
    ...outputProfiles.map(({ normalized }) => normalized),
    ...sessionProfiles.map(({ normalized }) => normalized),
    ...stageProfiles.map(({ normalized }) => normalized),
    ...channelProfiles.map(({ normalized }) => normalized),
    ...programPackageProfiles.map(({ normalized }) => normalized),
    ...searchPrograms.map(({ normalized }) => normalized),
    ...executionPackages.map(({ normalized }) => normalized),
  ];
  const serialized = JSON.stringify(normalizedUniversalArtifacts);
  assert(!/(?:chess|connect(?:-?4|[- ]four)|board|player|zero-sum|alternating-turn|best-move|multipv)/i.test(serialized));
  assert(domainProfiles.some(({ normalized }) => normalized.roles.some(({ category }) => category === 'custom')));
  assert(domainProfiles.some(({ normalized }) => normalized.transitionModes.some(({ kind }) => kind === 'sampled-stochastic')));
  assert(policyProfiles.some(({ normalized }) => normalized.value.kind === 'none'));
  assert(policyProfiles.some(({ normalized }) => normalized.value.family === 'vector' && normalized.value.coordinates.length > 1));
  assert(evaluatorProfiles.some(({ normalized }) => normalized.outputs.some(({ family }) => family === 'distribution')));
  assert(outputProfiles.some(({ normalized }) => normalized.fields.every(({ semanticRole }) => semanticRole !== 'ranking')));
});

await runCase('integration-requirement-disposition-handoff', () => {
  const countByStatus = Object.fromEntries(['deferred', 'partial', 'pending'].map((status) => [
    status,
    inspected.requirements.filter(({ evidenceStatus }) => evidenceStatus === status).length,
  ]));
  assert.deepEqual(countByStatus, { deferred: 52, partial: 904, pending: 33 });

  const pending = inspected.requirements.filter(({ evidenceStatus }) => evidenceStatus === 'pending');
  assert(pending.every(({ currentDisposition, plannedEvidenceOwner }) => (
    currentDisposition === 'engine-reference-oracle' && plannedEvidenceOwner === 'ENGINE-REFERENCE-01'
  )));

  const deferred = inspected.requirements.filter(({ evidenceStatus }) => evidenceStatus === 'deferred');
  assert(deferred.every(({ currentDisposition, plannedEvidenceOwner }) => (
    currentDisposition === 'native-compatible-pair-qualification' && plannedEvidenceOwner === 'ENGINE-NATIVE-01'
  )));

  const partial = inspected.requirements.filter(({ evidenceStatus }) => evidenceStatus === 'partial');
  assert(partial.every(({ evidenceRefs }) => evidenceRefs.some((reference) => !reference.startsWith('planned:'))));
});

const failed = cases.filter(({ status }) => status === 'fail');
const summary = {
  expected: 878,
  discovered: cases.length,
  executed: cases.length,
  passed: cases.length - failed.length,
  failed: failed.length,
  requiredSkipped: 0,
  conditionalSkipped: 0,
  optionalSkipped: 0,
  notDiscovered: 878 - cases.length,
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
  'schemas/search-ir/0.2.0/output-profile.schema.json',
  'schemas/search-ir/0.2.0/session-profile.schema.json',
  'schemas/search-ir/0.2.0/stage-profile.schema.json',
  'schemas/search-ir/0.2.0/channel-profile.schema.json',
  'schemas/search-ir/0.2.0/program-package-profile.schema.json',
  'schemas/search-ir/0.2.0/search-program.schema.json',
  'schemas/search-ir/0.2.0/execution-package.schema.json',
  'schemas/search-ir/0.2.0/compatible-pair-record.schema.json',
  'schemas/search-ir/0.2.0/resolved-composer-input.schema.json',
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
  'experiments/search-ir-composer-reference/src/output.mjs',
  'experiments/search-ir-composer-reference/src/output-fixtures.mjs',
  'experiments/search-ir-composer-reference/src/session.mjs',
  'experiments/search-ir-composer-reference/src/session-fixtures.mjs',
  'experiments/search-ir-composer-reference/src/stage.mjs',
  'experiments/search-ir-composer-reference/src/stage-fixtures.mjs',
  'experiments/search-ir-composer-reference/src/channel.mjs',
  'experiments/search-ir-composer-reference/src/channel-fixtures.mjs',
  'experiments/search-ir-composer-reference/src/program-package.mjs',
  'experiments/search-ir-composer-reference/src/program-package-fixtures.mjs',
  'experiments/search-ir-composer-reference/src/composer.mjs',
  'experiments/search-ir-composer-reference/src/composer-presets.mjs',
  'experiments/search-ir-composer-reference/src/deletion-identity.mjs',
  'experiments/search-ir-composer-reference/run.mjs',
];
const sources = {};
for (const relative of sourcePaths) {
  sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));
}
const representationCompositionEvidenceKey = canonicalIdentity({
  schema: 'cuda-mcgs.search-ir-composer-evidence-key/0.2.0',
  authorityBaseline: contractSetInput.authorityBaseline,
  sources,
  catalog: inspected?.identities ?? null,
  requirementDispositions: inspected?.requirements ?? [],
  representation: {
    frameworkSelection: frameworkSelection?.identity ?? null,
    domains: domainProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, identity })) ?? [],
    graphs: graphProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, identity })) ?? [],
    policies: policyProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, identity })) ?? [],
    evaluators: evaluatorProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, identity })) ?? [],
    resources: resourceProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, identity })) ?? [],
    progress: progressProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, identity })) ?? [],
    outputs: outputProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, identity })) ?? [],
    sessions: sessionProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, identity })) ?? [],
    stages: stageProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, identity })) ?? [],
    channels: channelProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, identity })) ?? [],
  },
  composition: {
    programPackages: programPackageProfiles?.map(({ normalized, identity, semanticEngineIdentity }) => ({ id: normalized.id, identity, semanticEngineIdentity })) ?? [],
    searchPrograms: searchPrograms?.map(({ normalized, identity }) => ({ compositionProfileIdentity: normalized.compositionProfileIdentity, sourceIdentity: normalized.sourceIdentity, identity })) ?? [],
    executionPackages: executionPackages?.map(({ normalized, identity }) => ({ programIdentity: normalized.program.identity, identity })) ?? [],
    resolvedComposerInput: explicitResolvedComposerInput?.identity ?? null,
    composerPublication: explicitComposition?.publication?.identity ?? null,
    deletionMatrix: deletionMatrix ? canonicalIdentity(deletionMatrix.map(({ summary: matrixSummary }) => matrixSummary)) : null,
    materiallyDifferentSemanticEngines: materiallyDifferentCompositions?.map(({ compositionProfile }) => compositionProfile.semanticEngineIdentity) ?? [],
    compatiblePair: compatiblePair?.identity ?? null,
  },
  cases: cases.map(({ id, status }) => ({ id, status })),
  summary,
});
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
  outputProfileIdentities: outputProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, ...identity })) ?? [],
  sessionProfileIdentities: sessionProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, ...identity })) ?? [],
  stageResourcePlanIdentity: stageResourceResult ? { id: stageResourceResult.normalized.id, ...stageResourceResult.identity } : null,
  stageProgressPlanIdentity: stageProgressResult ? { id: stageProgressResult.normalized.id, ...stageProgressResult.identity } : null,
  stageProfileIdentities: stageProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, ...identity })) ?? [],
  stageFirstProductDeletedIdentity: stageDeletedProfile ? { id: stageDeletedProfile.normalized.id, ...stageDeletedProfile.identity } : null,
  channelResourcePlanIdentity: channelResourceResult ? { id: channelResourceResult.normalized.id, ...channelResourceResult.identity } : null,
  channelFirstProductDeletedResourcePlanIdentity: channelDeletedResourceResult ? { id: channelDeletedResourceResult.normalized.id, ...channelDeletedResourceResult.identity } : null,
  channelProgressPlanIdentity: channelProgressResult ? { id: channelProgressResult.normalized.id, ...channelProgressResult.identity } : null,
  channelFirstProductDeletedProgressPlanIdentity: channelDeletedProgressResult ? { id: channelDeletedProgressResult.normalized.id, ...channelDeletedProgressResult.identity } : null,
  channelStageProfileIdentity: channelStageResult ? { id: channelStageResult.normalized.id, ...channelStageResult.identity } : null,
  channelDeletedStageProfileIdentity: channelDeletedStageResult ? { id: channelDeletedStageResult.normalized.id, ...channelDeletedStageResult.identity } : null,
  channelProfileIdentities: channelProfiles?.map(({ normalized, identity }) => ({ id: normalized.id, ...identity })) ?? [],
  channelFirstProductDeletedIdentity: channelDeletedProfile ? { id: channelDeletedProfile.normalized.id, ...channelDeletedProfile.identity } : null,
  programPackageProfileIdentities: programPackageProfiles?.map(({ normalized, identity, semanticEngineIdentity: engine }) => ({ id: normalized.id, ...identity, semanticEngineSha256: engine.sha256 })) ?? [],
  searchProgramIdentities: searchPrograms?.map(({ normalized, identity }) => ({ id: normalized.compositionProfileIdentity.sha256, ...identity, sourceSha256: normalized.sourceIdentity.sha256 })) ?? [],
  executionPackageIdentities: executionPackages?.map(({ normalized, identity }) => ({ id: normalized.program.identity.sha256, ...identity })) ?? [],
  resolvedComposerInputIdentity: explicitResolvedComposerInput ? { ...explicitResolvedComposerInput.identity } : null,
  composerPublicationIdentity: explicitComposition ? { ...explicitComposition.publication.identity } : null,
  representationCompositionEvidenceKey,
  deletionIdentityMatrixIdentity: deletionMatrix ? canonicalIdentity(deletionMatrix.map(({ summary: matrixSummary }) => matrixSummary)) : null,
  deletionIdentityMatrix: deletionMatrix?.map(({ summary: matrixSummary }) => matrixSummary) ?? [],
  materiallyDifferentComposerIdentities: materiallyDifferentCompositions?.map(({ compositionProfile, searchProgram, executionPackage }) => ({
    semanticEngineSha256: compositionProfile.semanticEngineIdentity.sha256,
    searchProgramSha256: searchProgram.identity.sha256,
    executionPackageSha256: executionPackage.identity.sha256,
  })) ?? [],
  compatiblePairIdentity: compatiblePair ? { ...compatiblePair.identity } : null,
  contractSummaries: inspected?.contractSummaries ?? [],
  coverage: {
    classified: inspected?.requirements.filter(({ classificationStatus }) => classificationStatus === 'classified').length ?? 0,
    pending: inspected?.requirements.filter(({ classificationStatus }) => classificationStatus === 'pending').length ?? 989,
  },
  sources,
  summary,
  cases,
  claimLimits: [
    'Proposal contract catalog plus shared representation primitives and framework, domain, graph, policy, evaluator, resource, progress, output, optional Search Session and optional stage/surface/capability profile normalization only.',
    'The framework, domain, graph, policy, evaluator, resource, progress, output, Search Session and Search Stage requirements have final evidence lanes but remain partial, pending or deferred; no proposal contract is accepted by this capsule.',
    'Domain evidence covers strict normalized profile selection and three synthetic structural instances, not behavioral oracle, publication/concurrency, native or compatible-pair qualification.',
    'Graph evidence covers four strict structural instances, bounded ownership/layout/lifecycle/publication checks and zero-residue optional modes, not behavioral oracle, concurrent reclamation, native or compatible-pair qualification.',
    'Policy evidence covers four strict structural instances, role/record/admission/value/cycle/backup/stop/reuse checks and zero-residue optional modes, not behavioral oracle, concurrent backup, native or compatible-pair qualification.',
    'Evaluator evidence covers five strict structural instances, proposal/evaluation/combined modes, typed inputs/outputs, request/batch/publication/cache/resident-artifact/progress/reuse/lifecycle checks and zero-residue optional modes, not behavioral oracle, concurrent evaluator execution, native or compatible-pair qualification.',
    'Evaluator absence is represented by structural omission from framework selection; this capsule does not create or validate a synthetic disabled evaluator profile.',
    'Resource evidence covers three strict finite-plan instances, contribution composition, exact arithmetic, partitions/reserves/admission/ledgers/pressure/exhaustion/lifecycle/provider projections and evaluator-absence zero residue, not behavioral oracle, concurrent accounting, physical CUDA-JS allocation, native or compatible-pair qualification.',
    'Progress evidence covers three scheduler-neutral work/readiness/fairness/no-progress/stop/closure plans, including evaluator absence and selected live-session external wait, not behavioral oracle, schedule exploration, physical scheduler/CUDA-JS execution, native or compatible-pair qualification.',
    'Output evidence covers three strict terminal/live profile instances, exact source readiness, finite workspace/observation/terminal capacity, snapshot/publication/borrow/lifecycle/consumer/cleanup checks and terminal-only zero live residue, not behavioral oracle, concurrent publication, physical CUDA-JS transfer, native or compatible-pair qualification.',
    'Search Session evidence covers two strict selected instances plus terminal-only absence, bounded root transactions, independent attention publications, observation coordination, epoch/reuse/stale/reclamation/counter/lifecycle/cleanup checks and exact upstream owner bindings, not behavioral oracle, concurrent session execution, physical sideband realization, native or compatible-pair qualification.',
    'Search Stage evidence covers two materially different strict selected profiles, one same-profile first-product deletion projection, stable entry/exit surfaces, least-authority source-owner ports, deterministic capability order, finite resource/progress/counter/lifecycle closure and whole-substrate absence, not native execution or compatible-pair qualification.',
    'Async Stage Channel evidence covers strict optional selected/absent profiles, exact Stage action grants, finite resource/progress/item/claim/publication/cancellation/reclamation semantics, evaluator-like required request/result and advisory multi-borrow secondary work, first-product deletion and a bounded logical happens-before/ownership reference oracle. It does not select a CUDA queue/layout/topology or claim native publication; the former CUDA-JS #123 public-capability gap is resolved, while exact native compatible-pair qualification remains mandatory.',
    'Program/package evidence covers four strict composition profiles, canonical restricted Device-JS Search Programs, consumer-neutral CUDA-JS request projections, opaque success/failure realization fixtures, exact first-consumer deletion and a complete reference-only compatible-pair record. It remains proposal evidence and does not claim CUDA-JS compilation, native artifacts, installed-package support or a qualified pair.',
    'Composer evidence covers a strict resolved-input envelope, material owner/reason/version provenance, convenient/explicit canonical equivalence, removable-facade deletion and failure-atomic publication. It does not declare a public SDK API, runtime registry, adaptive post-ignition behavior or production implementation.',
    'The reference Composer statically assembles exact owner-provided source snapshots and metadata through the existing Program Package path; CUDA-JS still exclusively validates/lowers Device-JS syntax and owns all generated CUDA/native artifacts and runtime resources.',
    'Deletion/identity evidence covers eight matched canonical-Composer comparisons for evaluator, live output, Search Session, attention, Stage substrate, Async Stage Channel, selected capability/product and opaque namespaced-product removal, plus four materially different product-neutral engine identities. It is bounded structural/reference evidence, not behavioral equivalence, native realization, performance or contract acceptance.',
    'A stateless Graph contribution with kind none is structurally omitted from composed Device-JS source; this proves absence handling for the fixture path, not a production stateless engine.',
  ],
};
const evidenceDirectory = path.join(experimentRoot, 'build');
await mkdir(evidenceDirectory, { recursive: true });
await writeFile(path.join(evidenceDirectory, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`capsule=${evidence.capsule} expected=${summary.expected} discovered=${summary.discovered} executed=${summary.executed} passed=${summary.passed} failed=${summary.failed} required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=${summary.notDiscovered}`);
console.log(`contracts=${inspected?.contractSummaries.length ?? 0} requirements=${inspected?.requirements.length ?? 0} classified=${evidence.coverage.classified} pending=${evidence.coverage.pending}`);
console.log(`contract_set_sha256=${inspected?.identities.contractSet.sha256 ?? 'unavailable'} coverage_sha256=${inspected?.identities.coverage.sha256 ?? 'unavailable'} expanded_requirements_sha256=${inspected?.identities.expandedRequirements.sha256 ?? 'unavailable'}`);
console.log(`framework_selection_sha256=${frameworkSelection?.identity.sha256 ?? 'unavailable'} canonical_bytes=${frameworkSelection?.identity.byteLength ?? 0}`);
console.log(`representation_composition_evidence_sha256=${representationCompositionEvidenceKey.sha256} canonical_bytes=${representationCompositionEvidenceKey.byteLength}`);
if (failed.length > 0) process.exit(1);

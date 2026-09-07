#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  composeSearchProgram,
  normalizeProgramPackageProfile,
  programPackageConstants,
} from '../../components/search-compiler/testing.mjs';
import { inspectCatalog } from './src/catalog.mjs';
import { buildProgramPackageProfile } from './src/program-package-fixtures.mjs';
import { evaluatorSyntheticSchemaReference } from './src/evaluator-fixtures.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..', '..');
const schemaRoot = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0');
const CAS = 'gpu.atomic.cas';

const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const digest = (character) => ({ algorithm: 'sha256', sha256: character.repeat(64) });
const sourceIdentity = (source) => ({ algorithm: 'sha256', sha256: sha256(source.replace(/\r\n?/g, '\n').replace(/\n+$/g, '') + '\n') });
const profile = (id, schema, character, normalized = {}) => ({
  normalized: { id, schema, ...normalized },
  schemaSha: character.repeat(64),
  identity: digest(character),
});
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

function packageContext(ownerResult) {
  const progressResult = profile('progress.cas-composition', 'cuda-mcgs.progress-profile/0.2.0', '2');
  const outputResult = profile('output.cas-composition', 'cuda-mcgs.output-profile/0.2.0', '3', {
    terminalEnvelope: { terminalReserve: 'reserve.cas-composition.terminal' },
    terminal: {
      schema: 'output-schema.cas-composition.terminal',
      borrow: evaluatorSyntheticSchemaReference('cuda-mcgs.cas-composition-borrow'),
      asyncRead: evaluatorSyntheticSchemaReference('cuda-mcgs.cas-composition-async-read'),
      cleanup: evaluatorSyntheticSchemaReference('cuda-mcgs.cas-composition-cleanup'),
    },
    publication: { hostDelivery: 'asynchronous-bounded-read', hostEffect: 'transfer-borrow-only', maxTransfers: '1' },
  });
  const resourceResult = profile('resource.cas-composition', 'cuda-mcgs.resource-profile/0.2.0', '1', {
    contributors: [{ id: 'resource-contributor.cas-composition-output', profile: { id: outputResult.normalized.id } }],
    classes: [{ id: 'resource-class.cas-composition-terminal', contributor: 'resource-contributor.cas-composition-output', lifetime: 'operation', unit: 'bytes' }],
    partitions: [{ id: 'resource-partition.cas-composition-terminal', class: 'resource-class.cas-composition-terminal', pool: 'resource-pool.cas-composition-terminal', offset: '0', capacity: '64', alias: { kind: 'none' } }],
    pools: [{ id: 'resource-pool.cas-composition-terminal', providerRequirement: 'provider.cas-composition.terminal', unit: 'bytes', capacity: '64' }],
    reserves: [{ id: 'reserve.cas-composition.terminal', purpose: 'terminal-result', class: 'resource-class.cas-composition-terminal', partition: 'resource-partition.cas-composition-terminal', minimum: '64', maximum: '64', eligibleOwners: ['resource-contributor.cas-composition-output'] }],
    providerRequirements: [
      { id: 'provider.cas-composition', unit: 'bytes', capacity: '64', alignment: '8', memorySpaces: ['device-search'], access: ['read', 'write'] },
      { id: 'provider.cas-composition.terminal', unit: 'bytes', capacity: '64', alignment: '8', memorySpaces: ['device-search'], access: ['read', 'write'] },
    ],
  });
  return {
    profileResults: [ownerResult, resourceResult, progressResult, outputResult],
    resourceResult,
    progressResult,
    outputResult,
    sessionResult: null,
    stageResult: null,
    channelResult: null,
  };
}

function bindCas(fixture, ownerId) {
  const unit = fixture.input.sourceUnits.find(({ ownerProfile }) => ownerProfile === ownerId);
  assert(unit, 'CAS owner must contribute one source unit');
  const fn = fixture.input.functions.find(({ sourceUnit }) => sourceUnit === unit.id);
  assert(fn, 'CAS owner source unit must own one function');
  const source = `function ${fn.name}(state, index, compare, value) { return gpu.atomic.cas(state, index, compare, value); }\n`;
  unit.source = source;
  unit.sourceIdentity = sourceIdentity(source);
  fn.parameters = [
    { name: 'state', type: 'ptr<u32>' },
    { name: 'index', type: 'u32' },
    { name: 'compare', type: 'u32' },
    { name: 'value', type: 'u32' },
  ];
  fn.returns = 'u32';
  fn.helpers = [CAS];
  return { unit, fn };
}

const contractSet = await readJson(path.join(schemaRoot, 'contract-set.json'));
const coverage = await readJson(path.join(schemaRoot, 'requirement-coverage.json'));
const inspected = await inspectCatalog(repositoryRoot, contractSet, coverage);
const ownerResult = profile('extension.synthetic-cas-owner', 'cuda-mcgs.synthetic-cas-owner-profile/0.2.0', '4', {
  programContribution: { sourceIdentity: digest('5') },
});
const context = packageContext(ownerResult);

assert.equal(programPackageConstants.baseDeviceJsCasHelper, CAS, 'Program Package must expose the accepted CAS helper identity');

const baselineFixture = buildProgramPackageProfile(inspected, context, 'cas-composition');
const baseline = normalizeProgramPackageProfile(baselineFixture.input, inspected, baselineFixture.context);

const casFixture = buildProgramPackageProfile(inspected, context, 'cas-composition');
const selected = bindCas(casFixture, ownerResult.normalized.id);
const normalized = normalizeProgramPackageProfile(casFixture.input, inspected, casFixture.context);
const normalizedFunction = normalized.normalized.functions.find(({ name }) => name === selected.fn.name);
assert(normalizedFunction, 'normalized CAS function must remain present');
assert.deepEqual(normalizedFunction.helpers, [CAS], 'accepted CAS helper must remain identity-material function metadata');
assert.deepEqual(normalized.normalized.publicRequirements, baseline.normalized.publicRequirements, 'base Device-JS CAS must not synthesize a non-base public requirement');
assert(normalized.normalized.publicRequirements.some(({ contract }) => contract.id === 'cuda-js.device-js/0.1.0'), 'base Device-JS contract must remain selected');

const program = composeSearchProgram(normalized);
assert(program.normalized.functions.some(({ name, helpers }) => name === selected.fn.name && helpers.includes(CAS)), 'CAS helper must propagate into Search Program metadata');
assert(program.normalized.source.includes('gpu.atomic.cas'), 'CAS source spelling must propagate unchanged into Search Program source');

const missingSource = structuredClone(casFixture.input);
const missingFn = missingSource.functions.find(({ name }) => name === selected.fn.name);
const missingUnit = missingSource.sourceUnits.find(({ id }) => id === missingFn.sourceUnit);
missingUnit.source = `function ${missingFn.name}(state, index, compare, value) { return value; }\n`;
missingUnit.sourceIdentity = sourceIdentity(missingUnit.source);
assert.throws(
  () => normalizeProgramPackageProfile(missingSource, inspected, casFixture.context),
  { code: 'COMPOSE_HELPER_MAPPING' },
  'declared CAS without exact public source spelling must fail closed',
);

const duplicate = structuredClone(casFixture.input);
duplicate.functions.find(({ name }) => name === selected.fn.name).helpers = [CAS, CAS];
assert.throws(
  () => normalizeProgramPackageProfile(duplicate, inspected, casFixture.context),
  { code: 'COMPOSE_FUNCTION_CALLS' },
  'duplicate CAS helper metadata must fail closed',
);

const unsupported = structuredClone(casFixture.input);
unsupported.functions.find(({ name }) => name === selected.fn.name).helpers = ['gpu.atomic.exchange'];
assert.throws(
  () => normalizeProgramPackageProfile(unsupported, inspected, casFixture.context),
  { code: 'COMPOSE_HELPER_UNSUPPORTED' },
  'CAS admission must not widen arbitrary atomic helpers',
);

console.log('device_js_cas_composition=pass accepted=cas source_mapping=exact base_requirement=unchanged search_program=propagated duplicate=reject arbitrary_atomic=reject native_claim=none');

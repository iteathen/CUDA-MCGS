#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  assertOwnerDeletion,
  buildExecutionPackage,
  composeSearchProgram,
  normalizeProgramPackageProfile,
  protectedNoImportProgramPackageOracle as core,
} from '../../components/search-compiler/testing.mjs';
import { buildProgramPackageProfile } from './src/program-package-fixtures.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const schemaRoot = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0');
const digest = (character) => ({ algorithm: 'sha256', sha256: character.repeat(64) });
const profile = (id, schema, character) => ({ normalized: { id, schema }, schemaSha: character.repeat(64), identity: digest(character) });

function makeFixture(label = 'device-imports') {
  const progressResult = profile(`progress.${label}`, 'cuda-mcgs.progress-profile/0.2.0', '2');
  const outputResult = {
    ...profile(`output.${label}`, 'cuda-mcgs.output-profile/0.2.0', '3'),
    normalized: {
      id: `output.${label}`, schema: 'cuda-mcgs.output-profile/0.2.0',
      terminalEnvelope: { terminalReserve: `reserve.${label}.terminal` },
      terminal: {
        schema: `output-schema.${label}.terminal`,
        borrow: { id: `cuda-mcgs.${label}-borrow/0.1.0`, version: '0.1.0', sha256: '8'.repeat(64) },
        asyncRead: { id: `cuda-mcgs.${label}-async-read/0.1.0`, version: '0.1.0', sha256: '9'.repeat(64) },
        cleanup: { id: `cuda-mcgs.${label}-cleanup/0.1.0`, version: '0.1.0', sha256: 'a'.repeat(64) },
      },
      publication: { hostDelivery: 'asynchronous-bounded-read', hostEffect: 'transfer-borrow-only', maxTransfers: '1' },
    },
  };
  const resourceResult = {
    ...profile(`resource.${label}`, 'cuda-mcgs.resource-profile/0.2.0', '1'),
    normalized: {
      id: `resource.${label}`,
      schema: 'cuda-mcgs.resource-profile/0.2.0',
      contributors: [{ id: `resource-contributor.${label}-output`, profile: { id: outputResult.normalized.id } }],
      classes: [{ id: `resource-class.${label}-terminal`, contributor: `resource-contributor.${label}-output`, lifetime: 'operation', unit: 'bytes' }],
      partitions: [{ id: `resource-partition.${label}-terminal`, class: `resource-class.${label}-terminal`, pool: `resource-pool.${label}-terminal`, offset: '0', capacity: '64', alias: { kind: 'none' } }],
      pools: [{ id: `resource-pool.${label}-terminal`, providerRequirement: `provider.${label}.terminal`, unit: 'bytes', capacity: '64' }],
      reserves: [{ id: `reserve.${label}.terminal`, purpose: 'terminal-result', class: `resource-class.${label}-terminal`, partition: `resource-partition.${label}-terminal`, minimum: '64', maximum: '64', eligibleOwners: [`resource-contributor.${label}-output`] }],
      providerRequirements: [
        { id: `provider.${label}`, unit: 'bytes', capacity: '64', alignment: '8', memorySpaces: ['device-search'], access: ['read', 'write'] },
        { id: `provider.${label}.terminal`, unit: 'bytes', capacity: '64', alignment: '8', memorySpaces: ['device-search'], access: ['read', 'write'] },
      ],
    },
  };
  const inspected = {
    contractSet: { contracts: [{ id: 'SPEC-0005', specificationIdentity: 'CUDA-MCGS-SPEC-0005@0.4.0', sha256: '4'.repeat(64) }] },
    identities: { contractSet: digest('5') },
  };
  const fixture = buildProgramPackageProfile(inspected, {
    profileResults: [resourceResult, progressResult, outputResult],
    resourceResult,
    progressResult,
    outputResult,
    sessionResult: null,
    stageResult: null,
    channelResult: null,
  }, label);
  return { fixture, inspected, owner: outputResult.normalized.id };
}

function declaration(owner, id = 'device-import.tensor', alias = 'mcgsTensorRunItem', marker = 'b') {
  return {
    schema: 'cuda-mcgs.device-js-import-declaration/0.1.0',
    id,
    ownerProfile: owner,
    importName: 'tensorRunItem',
    alias,
    library: {
      contract: 'SPEC-0009-item-parallel-device-tensor-program-v1',
      sha256: marker.repeat(64),
      format: 'ptx',
      architecture: 'compute_89',
      artifactSha256: marker === 'f' ? 'e'.repeat(64) : String.fromCharCode(marker.charCodeAt(0) + 1).repeat(64),
    },
  };
}

function withImports(subject, imports) {
  subject.fixture.input.deviceImports = structuredClone(imports);
  for (const record of subject.fixture.input.deletion.records) {
    record.deviceImports = imports.filter(({ ownerProfile }) => ownerProfile === record.owner).map(({ id }) => id);
  }
  return subject;
}

function normalize(subject) {
  return normalizeProgramPackageProfile(subject.fixture.input, subject.inspected, subject.fixture.context);
}

const historical = makeFixture('device-imports-historical');
const wrapperHistorical = normalize(historical);
const coreHistorical = core.normalizeProgramPackageProfile(historical.fixture.input, historical.inspected, historical.fixture.context);
assert.deepEqual(wrapperHistorical, coreHistorical);
assert.deepEqual(composeSearchProgram(wrapperHistorical), core.composeSearchProgram(coreHistorical));
assert.deepEqual(
  buildExecutionPackage(wrapperHistorical, composeSearchProgram(wrapperHistorical)),
  core.buildExecutionPackage(coreHistorical, core.composeSearchProgram(coreHistorical)),
);

const acceptedSubject = makeFixture();
const acceptedDeclaration = declaration(acceptedSubject.owner);
withImports(acceptedSubject, [acceptedDeclaration]);
const accepted = normalize(acceptedSubject);
assert.deepEqual(accepted.normalized.deviceImports, [acceptedDeclaration]);
const ownerDeletion = accepted.normalized.deletion.records.find(({ owner }) => owner === acceptedSubject.owner);
assert.deepEqual(ownerDeletion.deviceImports, [acceptedDeclaration.id]);
assert(accepted.normalized.deletion.records.filter(({ owner }) => owner !== acceptedSubject.owner).every(({ deviceImports }) => deviceImports.length === 0));
const program = composeSearchProgram(accepted);
assert.deepEqual(program.normalized.deviceImports, [acceptedDeclaration]);
const execution = buildExecutionPackage(accepted, program);
assert.deepEqual(execution.normalized.cudaJsAdapter.searchProgram.deviceImports, [acceptedDeclaration]);
assert.equal(Object.hasOwn(execution.normalized.program, 'deviceImports'), false, 'execution program summary must not duplicate import declarations');

const changedSubject = makeFixture();
withImports(changedSubject, [declaration(changedSubject.owner, 'device-import.tensor', 'mcgsTensorRunItemV2')]);
const changed = normalize(changedSubject);
const changedProgram = composeSearchProgram(changed);
const changedExecution = buildExecutionPackage(changed, changedProgram);
assert.notEqual(changed.identity.sha256, accepted.identity.sha256);
assert.notEqual(changedProgram.identity.sha256, program.identity.sha256);
assert.notEqual(changedExecution.identity.sha256, execution.identity.sha256);

const orderedA = makeFixture('device-imports-order');
const first = declaration(orderedA.owner, 'device-import.a', 'importA', 'b');
const second = declaration(orderedA.owner, 'device-import.b', 'importB', 'd');
withImports(orderedA, [second, first]);
const canonicalA = normalize(orderedA);
const orderedB = makeFixture('device-imports-order');
withImports(orderedB, [first, second]);
const canonicalB = normalize(orderedB);
assert.equal(canonicalA.identity.sha256, canonicalB.identity.sha256);
assert.deepEqual(canonicalA.normalized.deviceImports.map(({ id }) => id), ['device-import.a', 'device-import.b']);

const missingDeletion = makeFixture('device-imports-missing-deletion');
missingDeletion.fixture.input.deviceImports = [declaration(missingDeletion.owner)];
assert.throws(() => normalize(missingDeletion), { code: 'COMPOSE_DEVICE_IMPORT_DELETION' });

const wrongOwner = makeFixture('device-imports-wrong-owner');
withImports(wrongOwner, [declaration('evaluator.not-selected')]);
assert.throws(() => normalize(wrongOwner), { code: 'COMPOSE_DEVICE_IMPORT_OWNER' });

const localCollision = makeFixture('device-imports-local-collision');
withImports(localCollision, [declaration(localCollision.owner, 'device-import.tensor', 'engine_step')]);
assert.throws(() => normalize(localCollision), { code: 'COMPOSE_DEVICE_IMPORT_ALIAS' });

const duplicateAlias = makeFixture('device-imports-duplicate-alias');
withImports(duplicateAlias, [
  declaration(duplicateAlias.owner, 'device-import.a', 'sameAlias', 'b'),
  declaration(duplicateAlias.owner, 'device-import.b', 'sameAlias', 'd'),
]);
assert.throws(() => normalize(duplicateAlias), { code: 'COMPOSE_DEVICE_IMPORT_DUPLICATE' });

const tooManyLibraries = makeFixture('device-imports-library-bound');
const manyLibraries = Array.from({ length: 33 }, (_, index) => declaration(
  tooManyLibraries.owner,
  `device-import.lib-${index}`,
  `importLib${index}`,
  (index % 6 + 1).toString(16),
));
for (let index = 0; index < manyLibraries.length; index += 1) {
  manyLibraries[index].library.sha256 = index.toString(16).padStart(64, '0');
  manyLibraries[index].library.artifactSha256 = (index + 100).toString(16).padStart(64, '0');
}
withImports(tooManyLibraries, manyLibraries);
assert.throws(() => normalize(tooManyLibraries), { code: 'COMPOSE_DEVICE_IMPORT_COUNT' });

const beforeDeletion = {
  deletion: {
    selectedOwners: ['owner.a', 'owner.b'],
    records: [
      { owner: 'owner.a', sourceUnits: [], publicRequirements: [] },
      { owner: 'owner.b', sourceUnits: [], publicRequirements: [] },
    ],
  },
  sourceMap: [],
  publicRequirements: [],
  deviceImports: [declaration('owner.a', 'device-import.a', 'importA'), declaration('owner.b', 'device-import.b', 'importB', 'd')],
};
const afterDeletion = {
  deletion: { selectedOwners: ['owner.b'], records: [{ owner: 'owner.b', sourceUnits: [], publicRequirements: [] }] },
  sourceMap: [],
  publicRequirements: [],
  deviceImports: [declaration('owner.b', 'device-import.b', 'importB', 'd')],
};
assert.equal(assertOwnerDeletion(beforeDeletion, afterDeletion, 'owner.a'), true);
const drifted = structuredClone(afterDeletion);
drifted.deviceImports[0].library.sha256 = 'f'.repeat(64);
assert.throws(() => assertOwnerDeletion(beforeDeletion, drifted, 'owner.a'), { code: 'COMPOSE_DELETION_DEVICE_IMPORT' });

const declarationSchema = JSON.parse(await readFile(path.join(schemaRoot, 'device-js-import-declaration.schema.json'), 'utf8'));
assert.equal(declarationSchema.additionalProperties, false);
assert.equal(Object.hasOwn(declarationSchema.properties.library.properties, 'artifact'), false);
assert.equal(Object.hasOwn(declarationSchema.properties.library.properties, 'bytes'), false);
for (const file of ['program-package-profile.schema.json', 'search-program.schema.json']) {
  const schema = JSON.parse(await readFile(path.join(schemaRoot, file), 'utf8'));
  assert.equal(schema.properties.deviceImports.maxItems, 64);
  assert.equal(schema.properties.deviceImports.items.$ref, 'device-js-import-declaration.schema.json');
}
const executionSchema = JSON.parse(await readFile(path.join(schemaRoot, 'execution-package.schema.json'), 'utf8'));
assert.equal(executionSchema.properties.cudaJsAdapter.properties.searchProgram.properties.deviceImports.maxItems, 64);

console.log('device_js_import_composition=pass profile=canonical search_program=identity-bound execution_package=explicit deletion=owner-bound no_import=exact-delegate');

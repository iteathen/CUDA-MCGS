#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildExecutionPackage,
  composeSearchProgram,
  normalizeProgramPackageProfile,
} from '../../components/search-compiler/testing.mjs';
import { buildProgramPackageProfile } from './src/program-package-fixtures.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const schemaRoot = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0');
const ordinaryAccess = ['read', 'write', 'read-write'];
const broadAccess = ['read', 'write', 'atomic', 'publish'];
const denseScalars = ['f64', 'f16', 'bf16'];
const digest = (character) => ({ algorithm: 'sha256', sha256: character.repeat(64) });
const profile = (id, schema, character) => ({ normalized: { id, schema }, schemaSha: character.repeat(64), identity: digest(character) });
const sourceIdentity = (source) => ({ algorithm: 'sha256', sha256: createHash('sha256').update(source, 'utf8').digest('hex') });

function makeFixture(providerAccess = broadAccess, bindingAccess = 'write') {
  const progressResult = profile('progress.operation-access', 'cuda-mcgs.progress-profile/0.2.0', '2');
  const outputResult = {
    ...profile('output.operation-access', 'cuda-mcgs.output-profile/0.2.0', '3'),
    normalized: {
      id: 'output.operation-access', schema: 'cuda-mcgs.output-profile/0.2.0',
      terminalEnvelope: { terminalReserve: 'reserve.operation-access.terminal' },
      terminal: {
        schema: 'output-schema.operation-access.terminal',
        borrow: { id: 'cuda-mcgs.operation-access-borrow/0.1.0', version: '0.1.0', sha256: '8'.repeat(64) },
        asyncRead: { id: 'cuda-mcgs.operation-access-async-read/0.1.0', version: '0.1.0', sha256: '9'.repeat(64) },
        cleanup: { id: 'cuda-mcgs.operation-access-cleanup/0.1.0', version: '0.1.0', sha256: 'a'.repeat(64) },
      },
      publication: { hostDelivery: 'asynchronous-bounded-read', hostEffect: 'transfer-borrow-only', maxTransfers: '1' },
    },
  };
  const resourceResult = {
    ...profile('resource.operation-access', 'cuda-mcgs.resource-profile/0.2.0', '1'),
    normalized: {
      id: 'resource.operation-access',
      schema: 'cuda-mcgs.resource-profile/0.2.0',
      contributors: [{ id: 'resource-contributor.operation-access-output', profile: { id: outputResult.normalized.id } }],
      classes: [{ id: 'resource-class.operation-access-terminal', contributor: 'resource-contributor.operation-access-output', lifetime: 'operation', unit: 'bytes' }],
      partitions: [{ id: 'resource-partition.operation-access-terminal', class: 'resource-class.operation-access-terminal', pool: 'resource-pool.operation-access-terminal', offset: '0', capacity: '64', alias: { kind: 'none' } }],
      pools: [{ id: 'resource-pool.operation-access-terminal', providerRequirement: 'provider.operation-access.terminal', unit: 'bytes', capacity: '64' }],
      reserves: [{ id: 'reserve.operation-access.terminal', purpose: 'terminal-result', class: 'resource-class.operation-access-terminal', partition: 'resource-partition.operation-access-terminal', minimum: '64', maximum: '64', eligibleOwners: ['resource-contributor.operation-access-output'] }],
      providerRequirements: [
        {
          id: 'provider.operation-access', unit: 'bytes', capacity: '64', alignment: '8', memorySpaces: ['device-search'], access: [...providerAccess],
        },
        {
          id: 'provider.operation-access.terminal', unit: 'bytes', capacity: '64', alignment: '8', memorySpaces: ['device-search'], access: ['read', 'write'],
        },
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
  }, 'operation-access');
  const operation = fixture.input.operations.find(({ entryPoint }) => entryPoint === 'engine_step');
  const binding = operation?.bindings.find(({ parameter }) => parameter === 'output');
  if (!binding || binding.source?.kind !== 'resource') throw new Error('operation-access fixture lacks engine_step(output) resource binding');
  if (bindingAccess === null) delete binding.source.access;
  else binding.source.access = bindingAccess;
  return { fixture, inspected, binding };
}

function normalizeCase(providerAccess = broadAccess, bindingAccess = 'write') {
  const subject = makeFixture(providerAccess, bindingAccess);
  const normalized = normalizeProgramPackageProfile(subject.fixture.input, subject.inspected, subject.fixture.context);
  return { ...subject, normalized };
}

function normalizeView(view) {
  const subject = makeFixture();
  subject.binding.source.view = view;
  const normalized = normalizeProgramPackageProfile(subject.fixture.input, subject.inspected, subject.fixture.context);
  return { ...subject, normalized };
}

const accepted = normalizeCase();
const acceptedBinding = accepted.normalized.normalized.operations[0].bindings.find(({ parameter }) => parameter === 'output');
assert.equal(acceptedBinding.source.access, 'write');
const program = composeSearchProgram(accepted.normalized);
assert.equal(program.normalized.operations[0].bindings.find(({ parameter }) => parameter === 'output').source.access, 'write');
const execution = buildExecutionPackage(accepted.normalized, program);
const publicOutputBinding = execution.normalized.cudaJsAdapter.operationRequirements[0].bindings.find(({ parameter }) => parameter === 'output');
assert.equal(publicOutputBinding.source.access, 'write');
const operationResource = execution.normalized.cudaJsAdapter.resourceRequirements.find(({ id }) => id === publicOutputBinding.source.resource);
assert.deepEqual(new Set(operationResource.accessRequirements), new Set(broadAccess));
const terminalDelivery = execution.normalized.cudaJsAdapter.deliveryRequirements[0];
const terminalResource = execution.normalized.cudaJsAdapter.resourceRequirements.find(({ id }) => id === terminalDelivery.resource);
assert.notEqual(terminalResource.id, operationResource.id);
assert.deepEqual(new Set(terminalResource.accessRequirements), new Set(['read', 'write']));

assert.equal(normalizeCase(['read'], 'read').normalized.normalized.operations[0].bindings.find(({ parameter }) => parameter === 'output').source.access, 'read');
assert.equal(normalizeCase(['read', 'write'], 'read-write').normalized.normalized.operations[0].bindings.find(({ parameter }) => parameter === 'output').source.access, 'read-write');
assert.throws(() => normalizeCase(['write'], 'read'), { code: 'COMPOSE_OPERATION_ACCESS' });
assert.throws(() => normalizeCase(['read'], 'write'), { code: 'COMPOSE_OPERATION_ACCESS' });
assert.throws(() => normalizeCase(['read'], 'read-write'), { code: 'COMPOSE_OPERATION_ACCESS' });
assert.throws(() => normalizeCase(broadAccess, 'atomic'), { code: 'COMPOSE_OPERATION_ACCESS' });
assert.throws(() => normalizeCase(broadAccess, 'publish'), { code: 'COMPOSE_OPERATION_ACCESS' });

const scalarAccess = makeFixture();
scalarAccess.binding.source = {
  kind: 'scalar',
  schema: { id: 'cuda-mcgs.scalar-u32/0.1.0', version: '0.1.0', sha256: '6'.repeat(64) },
  access: 'read',
};
assert.throws(() => normalizeProgramPackageProfile(scalarAccess.fixture.input, scalarAccess.inspected, scalarAccess.fixture.context), { code: 'COMPOSE_OPERATION_ACCESS' });

const historical = normalizeCase(broadAccess, null);
assert.equal(Object.hasOwn(historical.normalized.normalized.operations[0].bindings.find(({ parameter }) => parameter === 'output').source, 'access'), false);
assert.throws(() => buildExecutionPackage(historical.normalized, composeSearchProgram(historical.normalized)), { code: 'COMPOSE_OPERATION_ACCESS_REQUIRED' });

const readWriteSameEnvelope = normalizeCase(broadAccess, 'read-write');
assert.notEqual(readWriteSameEnvelope.normalized.identity.sha256, accepted.normalized.identity.sha256);

const viewed = normalizeView({ dtype: 'u32', byteOffset: '4', elementCount: '4' });
const viewedBinding = viewed.normalized.normalized.operations[0].bindings.find(({ parameter }) => parameter === 'output');
assert.deepEqual(viewedBinding.source.view, { dtype: 'u32', byteOffset: '4', elementCount: '4' });
const viewedProgram = composeSearchProgram(viewed.normalized);
assert.deepEqual(viewedProgram.normalized.operations[0].bindings.find(({ parameter }) => parameter === 'output').source.view, viewedBinding.source.view);
const viewedExecution = buildExecutionPackage(viewed.normalized, viewedProgram);
assert.deepEqual(viewedExecution.normalized.cudaJsAdapter.operationRequirements[0].bindings.find(({ parameter }) => parameter === 'output').source.view, viewedBinding.source.view);
assert.notEqual(viewed.normalized.identity.sha256, accepted.normalized.identity.sha256);
assert.throws(() => normalizeView({ dtype: 'f32', byteOffset: '4', elementCount: '4' }), { code: 'COMPOSE_OPERATION_VIEW' });
assert.throws(() => normalizeView({ dtype: 'u32', byteOffset: '2', elementCount: '4' }), { code: 'COMPOSE_OPERATION_VIEW' });
assert.throws(() => normalizeView({ dtype: 'u32', byteOffset: '60', elementCount: '2' }), { code: 'COMPOSE_OPERATION_VIEW' });
assert.throws(() => normalizeView({ dtype: 'u32', byteOffset: '0', elementCount: '0' }), { code: 'COMPOSE_OPERATION_VIEW' });

const dense = makeFixture();
const engineUnit = dense.fixture.input.sourceUnits.find(({ functions }) => functions.includes('engine_step'));
if (!engineUnit) throw new Error('operation-access fixture lacks the composer entry source unit');
const denseName = 'dense_identity';
const denseUnitId = 'source.operation-access.dense-helper';
const denseSource = `function ${denseName}(denseValue) { return denseValue; }\n`;
dense.fixture.input.sourceUnits.push({
  ...structuredClone(engineUnit),
  id: denseUnitId,
  source: denseSource,
  sourceIdentity: sourceIdentity(denseSource),
  functions: [denseName],
});
dense.fixture.input.functions.push({
  name: denseName,
  executionRole: 'device-callable',
  parameters: [{ name: 'denseValue', type: 'f16' }],
  returns: 'f16',
  sourceUnit: denseUnitId,
  ownerProfile: engineUnit.ownerProfile,
  semanticRole: 'program.dense-identity',
  calls: [],
  helpers: [],
});
dense.fixture.input.programUnits.push({
  id: 'program-unit.operation-access.dense-helper',
  kind: 'owner',
  surface: null,
  contributors: [engineUnit.semanticOwner],
  functions: [denseName],
  effectOrder: [],
});
const denseDeletion = dense.fixture.input.deletion.records.find(({ owner }) => owner === engineUnit.semanticOwner);
if (!denseDeletion) throw new Error('operation-access fixture lacks composer deletion ownership');
denseDeletion.sourceUnits.push(denseUnitId);
denseDeletion.functions.push(denseName);
const denseNormalized = normalizeProgramPackageProfile(dense.fixture.input, dense.inspected, dense.fixture.context);
const normalizedDenseFunction = denseNormalized.normalized.functions.find(({ name }) => name === denseName);
assert.deepEqual(normalizedDenseFunction.parameters, [{ name: 'denseValue', type: 'f16' }]);
assert.equal(normalizedDenseFunction.returns, 'f16');
const denseProgram = composeSearchProgram(denseNormalized);
const denseExecution = buildExecutionPackage(denseNormalized, denseProgram);
assert.equal(denseExecution.normalized.cudaJsAdapter.searchProgram.functions.find(({ name }) => name === denseName).returns, 'f16');

for (const [file, definition] of [
  ['program-package-profile.schema.json', 'binding'],
  ['execution-package.schema.json', 'publicBinding'],
]) {
  const schema = JSON.parse(await readFile(path.join(schemaRoot, file), 'utf8'));
  const branches = schema.$defs[definition].properties.source.oneOf;
  const resource = branches.find((entry) => entry.properties?.kind?.const === 'resource');
  const scalar = branches.find((entry) => entry.properties?.kind?.const === 'scalar');
  assert.deepEqual(resource.properties.access.enum, ordinaryAccess);
  assert(!resource.required.includes('access'), 'historical resource bindings must retain structural validity');
  assert.equal(Object.hasOwn(scalar.properties, 'access'), false);
  assert.equal(resource.properties.view.$ref, '#/$defs/resourceView');
  assert(!resource.required.includes('view'), 'historical whole-resource bindings must remain structurally valid');
  assert.deepEqual(schema.$defs.resourceView.properties.dtype.enum, ['u32', 'u64', 'i32', 'f32', 'f64', 'f16', 'bf16']);
}

const compositionSchema = JSON.parse(await readFile(path.join(schemaRoot, 'program-package-profile.schema.json'), 'utf8'));
for (const dtype of denseScalars) {
  assert(compositionSchema.$defs.parameter.properties.type.enum.includes(dtype));
  assert(compositionSchema.$defs.parameter.properties.type.enum.includes(`ptr<${dtype}>`));
  assert(compositionSchema.$defs.function.properties.returns.enum.includes(dtype));
}
const executionSchema = JSON.parse(await readFile(path.join(schemaRoot, 'execution-package.schema.json'), 'utf8'));
for (const dtype of denseScalars) assert(executionSchema.$defs.publicFunction.properties.returns.enum.includes(dtype));

console.log('operation_local_access=pass ordinary=read,write,read-write views=typed-bounded-identity-material dense=f64,f16,bf16 historical=non-realizable atomic_publication=fail-closed adapter=inference-free');

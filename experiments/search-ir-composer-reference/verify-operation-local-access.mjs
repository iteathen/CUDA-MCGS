#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildExecutionPackage,
  composeSearchProgram,
  normalizeProgramPackageProfile,
} from './src/program-package.mjs';
import { buildProgramPackageProfile } from './src/program-package-fixtures.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const schemaRoot = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0');
const ordinaryAccess = ['read', 'write', 'read-write'];
const broadAccess = ['read', 'write', 'atomic', 'publish'];
const digest = (character) => ({ algorithm: 'sha256', sha256: character.repeat(64) });
const profile = (id, schema, character) => ({ normalized: { id, schema }, schemaSha: character.repeat(64), identity: digest(character) });

function makeFixture(providerAccess = broadAccess, bindingAccess = 'write') {
  const resourceResult = {
    ...profile('resource.operation-access', 'cuda-mcgs.resource-profile/0.2.0', '1'),
    normalized: {
      id: 'resource.operation-access',
      schema: 'cuda-mcgs.resource-profile/0.2.0',
      providerRequirements: [{
        id: 'provider.operation-access',
        unit: 'bytes',
        capacity: '64',
        alignment: '8',
        memorySpaces: ['device-search'],
        access: [...providerAccess],
      }],
    },
  };
  const progressResult = profile('progress.operation-access', 'cuda-mcgs.progress-profile/0.2.0', '2');
  const outputResult = profile('output.operation-access', 'cuda-mcgs.output-profile/0.2.0', '3');
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

const accepted = normalizeCase();
const acceptedBinding = accepted.normalized.normalized.operations[0].bindings.find(({ parameter }) => parameter === 'output');
assert.equal(acceptedBinding.source.access, 'write');
const program = composeSearchProgram(accepted.normalized);
assert.equal(program.normalized.operations[0].bindings.find(({ parameter }) => parameter === 'output').source.access, 'write');
const execution = buildExecutionPackage(accepted.normalized, program);
assert.equal(execution.normalized.cudaJsAdapter.operationRequirements[0].bindings.find(({ parameter }) => parameter === 'output').source.access, 'write');
assert.deepEqual(new Set(execution.normalized.cudaJsAdapter.resourceRequirements[0].accessRequirements), new Set(broadAccess));

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
}

console.log('operation_local_access=pass ordinary=read,write,read-write historical=non-realizable atomic_publication=fail-closed adapter=inference-free');

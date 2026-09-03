#!/usr/bin/env node
import { buildProgramPackageProfile } from './src/program-package-fixtures.mjs';

const digest = (character) => ({ algorithm: 'sha256', sha256: character.repeat(64) });
const profile = (id, schema, character) => ({
  normalized: { id, schema },
  schemaSha: character.repeat(64),
  identity: digest(character),
});

const resourceResult = {
  ...profile('resource.operation-access-red', 'cuda-mcgs.resource-profile/0.2.0', '1'),
  normalized: {
    id: 'resource.operation-access-red',
    schema: 'cuda-mcgs.resource-profile/0.2.0',
    providerRequirements: [{
      id: 'provider.operation-access-red',
      unit: 'bytes',
      capacity: '64',
      alignment: '8',
      memorySpaces: ['device-search'],
      access: ['read', 'write', 'atomic', 'publish'],
    }],
  },
};
const progressResult = profile('progress.operation-access-red', 'cuda-mcgs.progress-profile/0.2.0', '2');
const outputResult = profile('output.operation-access-red', 'cuda-mcgs.output-profile/0.2.0', '3');
const inspected = {
  contractSet: {
    contracts: [{
      id: 'SPEC-0005',
      specificationIdentity: 'CUDA-MCGS-SPEC-0005@0.4.0',
      sha256: '4'.repeat(64),
    }],
  },
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
}, 'operation-access-red');

const operation = fixture.input.operations.find(({ entryPoint }) => entryPoint === 'engine_step');
const binding = operation?.bindings.find(({ parameter }) => parameter === 'output');
const resource = fixture.input.resources.find(({ id }) => id === binding?.source?.resource);

if (!binding || binding.source?.kind !== 'resource') {
  throw new Error('operation-access falsifier could not find engine_step(output) resource binding');
}
if (!resource || !['read', 'write', 'atomic', 'publish'].every((access) => resource.access.includes(access))) {
  throw new Error('operation-access falsifier requires the accepted broad resource access envelope');
}
if (binding.access !== 'write') {
  throw new Error(`operation-access missing: engine_step(output) resource envelope=${resource.access.join(',')} binding-access=${String(binding.access)}; #125 cannot choose one lower ordinary access mechanically`);
}

console.log('operation_local_access=write source=mcgs-operation-binding inference=none');

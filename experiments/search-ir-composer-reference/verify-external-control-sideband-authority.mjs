#!/usr/bin/env node
import assert from 'node:assert/strict';

import { buildProgramPackageProfile } from './src/program-package-fixtures.mjs';

const digest = (character) => ({ algorithm: 'sha256', sha256: character.repeat(64) });
const profile = (id, schema, character, normalized = {}) => ({
  normalized: { id, schema, ...normalized },
  schemaSha: character.repeat(64),
  identity: digest(character),
});
const schemaReference = (id, character = '9') => ({ id: `${id}/0.1.0`, version: '0.1.0', sha256: character.repeat(64) });

function makeContext(sessionResult = null) {
  const resourceResult = profile('resource.sideband-authority', 'cuda-mcgs.resource-profile/0.2.0', '1', {
    providerRequirements: [{
      id: 'provider.sideband-authority.output',
      unit: 'bytes',
      capacity: '64',
      alignment: '8',
      memorySpaces: ['device-search'],
      access: ['read', 'write'],
    }],
  });
  const progressResult = profile('progress.sideband-authority', 'cuda-mcgs.progress-profile/0.2.0', '2');
  const outputResult = profile('output.sideband-authority', 'cuda-mcgs.output-profile/0.2.0', '3');
  return {
    profileResults: [resourceResult, progressResult, outputResult, ...(sessionResult ? [sessionResult] : [])],
    resourceResult,
    progressResult,
    outputResult,
    sessionResult,
    stageResult: null,
    channelResult: null,
  };
}

const inspected = {
  contractSet: { contracts: [{ id: 'SPEC-0005', specificationIdentity: 'CUDA-MCGS-SPEC-0005@0.4.0', sha256: '4'.repeat(64) }] },
  identities: { contractSet: digest('5') },
};

const base = buildProgramPackageProfile(inspected, makeContext(), 'sideband-base').input;
const sessionResult = profile('session.sideband-authority', 'cuda-mcgs.session-profile/0.2.0', '6', {
  programContribution: {
    sourceIdentity: digest('7'),
    functionIds: ['program.session.sideband-authority.apply_commands'],
    requirements: [schemaReference('cuda-js.publication-mailbox', '8')],
    engineStepRoles: ['apply-session-controls'],
    nativeContent: 'forbidden',
  },
});
const selectedSession = buildProgramPackageProfile(inspected, makeContext(sessionResult), 'sideband-session').input;

const findings = [];
const baseCancellation = base.sidebands?.find((entry) => entry.role === 'framework-cancellation');
if (!baseCancellation) findings.push('base-cancellation-sideband=missing');
const baseOperation = base.operations.find(({ entryPoint }) => entryPoint === 'engine_step');
if (!baseOperation?.bindings.some(({ source }) => source?.kind === 'sideband' && source.sideband === baseCancellation?.id)) {
  findings.push('base-cancellation-binding=missing');
}

const sessionRequirement = 'cuda-js.publication-mailbox/0.1.0';
if (!selectedSession.publicRequirements.some(({ contract }) => contract.id === sessionRequirement)) {
  findings.push('selected-session-publication-requirement=missing');
}
const sessionSignal = selectedSession.sidebands?.find((entry) => entry.role === 'session-command-generation');
if (!sessionSignal) findings.push('selected-session-command-sideband=missing');
const selectedOperation = selectedSession.operations.find(({ entryPoint }) => entryPoint === 'engine_step');
if (!selectedOperation?.bindings.some(({ source }) => source?.kind === 'sideband' && source.sideband === sessionSignal?.id)) {
  findings.push('selected-session-command-binding=missing');
}

if (findings.length > 0) console.error(`external_control_sideband=red ${findings.join(' ')}`);
assert.deepEqual(findings, []);
console.log('external_control_sideband=pass base_cancellation=declared-and-bound session_requirement=closed session_command_generation=declared-and-bound inference=forbidden');

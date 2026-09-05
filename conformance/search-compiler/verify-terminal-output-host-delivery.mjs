#!/usr/bin/env node
import assert from 'node:assert/strict';

import {
  buildExecutionPackage,
  composeSearchProgram,
  normalizeProgramPackageProfile,
} from '../../components/search-compiler/testing.mjs';
import { buildProgramPackageProfile } from './src/program-package-fixtures.mjs';

const digest = (character) => ({ algorithm: 'sha256', sha256: character.repeat(64) });
const schemaReference = (id, character) => ({ id: `${id}/0.1.0`, version: '0.1.0', sha256: character.repeat(64) });
const profile = (id, schema, character, normalized = {}) => ({
  normalized: { id, schema, ...normalized },
  schemaSha: character.repeat(64),
  identity: digest(character),
});

function makeSubject() {
  const progressResult = profile('progress.terminal-delivery', 'cuda-mcgs.progress-profile/0.2.0', '2');
  const outputResult = profile('output.terminal-delivery', 'cuda-mcgs.output-profile/0.2.0', '3', {
    terminalEnvelope: { terminalReserve: 'reserve.terminal-delivery.result' },
    terminal: {
      schema: 'output-schema.terminal-delivery.result',
      borrow: schemaReference('cuda-mcgs.terminal-delivery-borrow', '8'),
      asyncRead: schemaReference('cuda-mcgs.terminal-delivery-async-read', '9'),
      cleanup: schemaReference('cuda-mcgs.terminal-delivery-cleanup', 'a'),
    },
    publication: { hostDelivery: 'asynchronous-bounded-read', hostEffect: 'transfer-borrow-only', maxTransfers: '1' },
  });
  const resourceResult = profile('resource.terminal-delivery', 'cuda-mcgs.resource-profile/0.2.0', '1', {
    contributors: [
      { id: 'resource-contributor.terminal-delivery-output', profile: { id: outputResult.normalized.id } },
      { id: 'resource-contributor.terminal-delivery-framework', contract: { id: 'SPEC-0005' } },
    ],
    classes: [
      { id: 'resource-class.terminal-delivery-result', contributor: 'resource-contributor.terminal-delivery-output', lifetime: 'operation', unit: 'bytes' },
      { id: 'resource-class.terminal-delivery-work', contributor: 'resource-contributor.terminal-delivery-framework', lifetime: 'operation', unit: 'bytes' },
    ],
    partitions: [
      { id: 'resource-partition.terminal-delivery-result', class: 'resource-class.terminal-delivery-result', pool: 'resource-pool.terminal-delivery-result', offset: '0', capacity: '64', alias: { kind: 'none' } },
      { id: 'resource-partition.terminal-delivery-work', class: 'resource-class.terminal-delivery-work', pool: 'resource-pool.terminal-delivery-work', offset: '0', capacity: '64', alias: { kind: 'none' } },
    ],
    pools: [
      { id: 'resource-pool.terminal-delivery-result', providerRequirement: 'provider.terminal-delivery.result', unit: 'bytes', capacity: '64' },
      { id: 'resource-pool.terminal-delivery-work', providerRequirement: 'provider.terminal-delivery.work', unit: 'bytes', capacity: '64' },
    ],
    reserves: [{
      id: 'reserve.terminal-delivery.result', purpose: 'terminal-result', class: 'resource-class.terminal-delivery-result',
      partition: 'resource-partition.terminal-delivery-result', minimum: '64', maximum: '64',
      eligibleOwners: ['resource-contributor.terminal-delivery-output'],
    }],
    providerRequirements: [
      { id: 'provider.terminal-delivery.result', unit: 'bytes', capacity: '64', alignment: '8', memorySpaces: ['device-search'], access: ['read', 'write'] },
      { id: 'provider.terminal-delivery.work', unit: 'bytes', capacity: '64', alignment: '8', memorySpaces: ['device-search'], access: ['read', 'write', 'atomic', 'publish'] },
    ],
  });
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
  }, 'terminal-delivery');
  return { inspected, fixture };
}

function normalize(subject) {
  return normalizeProgramPackageProfile(subject.fixture.input, subject.inspected, subject.fixture.context);
}

function identities(subject) {
  const normalized = normalize(subject);
  const program = composeSearchProgram(normalized);
  const execution = buildExecutionPackage(normalized, program);
  return [normalized.identity.sha256, program.identity.sha256, execution.identity.sha256];
}

function rejectMutation(mutator, code) {
  const subject = makeSubject();
  mutator(subject);
  assert.throws(() => normalize(subject), { code });
}

function assertIdentityMutation(mutator) {
  const baseline = identities(makeSubject());
  const subject = makeSubject();
  mutator(subject);
  const changed = identities(subject);
  assert.notDeepEqual(changed, baseline);
}

const accepted = makeSubject();
const acceptedNormalized = normalize(accepted);
const acceptedDelivery = acceptedNormalized.normalized.deliveries[0];
assert.equal(acceptedDelivery.semanticOwner, accepted.fixture.context.outputResult.normalized.id);
assert.equal(acceptedDelivery.role, 'terminal-output');
assert.equal(acceptedDelivery.readiness, 'terminal-completed');
assert.equal(acceptedDelivery.mode, 'asynchronous-bounded-read');
assert.equal(acceptedDelivery.lifetime, 'terminal-result');

// DELIVERY-CLOSURE-001 / required falsifier 1: missing declaration cannot be inferred.
rejectMutation(({ fixture }) => { fixture.input.deliveries = []; }, 'COMPOSE_DELIVERY_COUNT');
rejectMutation(({ fixture }) => { delete fixture.input.deliveries; }, 'COMPOSE_ROOT_FIELDS');

// Required falsifier 2: wrong Output owner or terminal schema fails closed.
rejectMutation(({ fixture }) => { fixture.input.deliveries[0].semanticOwner = 'output.terminal-delivery.other'; }, 'COMPOSE_DELIVERY_OWNER');
rejectMutation(({ fixture }) => { fixture.input.deliveries[0].terminalSchema = 'output-schema.terminal-delivery.other'; }, 'COMPOSE_DELIVERY_SCHEMA');

// Required falsifier 3: a readable but non-authoritative package resource is not a substitute.
rejectMutation(({ fixture }) => {
  const delivery = fixture.input.deliveries[0];
  delivery.resource = fixture.input.resources.find(({ id }) => id !== delivery.resource).id;
}, 'COMPOSE_DELIVERY_RESOURCE');

// Required falsifier 4: exact range, byte units, read authority and first-realization non-aliasing are mandatory.
rejectMutation(({ fixture }) => { fixture.input.deliveries[0].byteOffset = '1'; }, 'COMPOSE_DELIVERY_RANGE');
rejectMutation(({ fixture }) => { fixture.input.deliveries[0].byteLength = '65'; }, 'COMPOSE_DELIVERY_RANGE');
rejectMutation(({ fixture }) => {
  const delivery = fixture.input.deliveries[0];
  const resource = fixture.input.resources.find(({ id }) => id === delivery.resource);
  resource.access = resource.access.filter((entry) => entry !== 'read');
  const provider = fixture.context.resourceResult.normalized.providerRequirements.find(({ id }) => id === resource.providerRequirement);
  provider.access = provider.access.filter((entry) => entry !== 'read');
}, 'COMPOSE_DELIVERY_RESOURCE');
rejectMutation(({ fixture }) => {
  const output = fixture.context.outputResult.normalized;
  const plan = fixture.context.resourceResult.normalized;
  const reserve = plan.reserves.find(({ id }) => id === output.terminalEnvelope.terminalReserve);
  plan.pools.find(({ id }) => id === plan.partitions.find(({ id }) => id === reserve.partition).pool).unit = 'items';
}, 'COMPOSE_DELIVERY_RESOURCE');
rejectMutation(({ fixture }) => {
  const output = fixture.context.outputResult.normalized;
  const plan = fixture.context.resourceResult.normalized;
  const reserve = plan.reserves.find(({ id }) => id === output.terminalEnvelope.terminalReserve);
  plan.partitions.find(({ id }) => id === reserve.partition).alias = { kind: 'selected-alias' };
}, 'COMPOSE_DELIVERY_RESOURCE');

// Required falsifier 5: leaving all owner/resource/source facts present cannot repair an omitted declaration.
rejectMutation(({ fixture }) => {
  fixture.input.deliveries = [];
  fixture.input.manifests.result.id = 'cuda-mcgs.package-terminal-delivery-hint/0.1.0';
}, 'COMPOSE_DELIVERY_COUNT');

// Required falsifier 9: valid material package-delivery changes are identity-bearing end-to-end.
assertIdentityMutation(({ fixture }) => {
  const delivery = fixture.input.deliveries[0];
  const previous = delivery.id;
  const replacement = 'delivery.terminal-delivery.alternate';
  delivery.id = replacement;
  const record = fixture.input.deletion.records.find(({ deliveries }) => deliveries.includes(previous));
  record.deliveries = record.deliveries.map((id) => id === previous ? replacement : id);
});
assertIdentityMutation(({ fixture }) => {
  fixture.input.deliveries[0].maxTransfers = '2';
  fixture.context.outputResult.normalized.publication.maxTransfers = '2';
});
assertIdentityMutation(({ fixture }) => {
  fixture.input.deliveries[0].terminalSchema = 'output-schema.terminal-delivery.alternate';
  fixture.context.outputResult.normalized.terminal.schema = 'output-schema.terminal-delivery.alternate';
});
for (const [field, character] of [['borrow', 'b'], ['asyncRead', 'c'], ['cleanup', 'd']]) {
  assertIdentityMutation(({ fixture }) => {
    fixture.input.deliveries[0][field].sha256 = character.repeat(64);
    fixture.context.outputResult.normalized.terminal[field].sha256 = character.repeat(64);
  });
}
assertIdentityMutation(({ fixture }) => {
  fixture.input.deliveries[0].byteLength = '32';
  const plan = fixture.context.resourceResult.normalized;
  const reserve = plan.reserves.find(({ id }) => id === fixture.context.outputResult.normalized.terminalEnvelope.terminalReserve);
  reserve.minimum = '32';
  reserve.maximum = '32';
});
assertIdentityMutation(({ fixture }) => {
  const delivery = fixture.input.deliveries[0];
  const alternate = fixture.input.resources.find(({ id }) => id !== delivery.resource);
  delivery.resource = alternate.id;
  const plan = fixture.context.resourceResult.normalized;
  const reserve = plan.reserves.find(({ id }) => id === fixture.context.outputResult.normalized.terminalEnvelope.terminalReserve);
  const partition = plan.partitions.find(({ id }) => id === reserve.partition);
  plan.pools.find(({ id }) => id === partition.pool).providerRequirement = alternate.providerRequirement;
});

// Fixed first-realization fields cannot silently alias to another identity; they are non-realizable.
for (const [field, value] of [['role', 'live-output'], ['readiness', 'device-active'], ['mode', 'synchronous-read'], ['lifetime', 'session']]) {
  rejectMutation(({ fixture }) => { fixture.input.deliveries[0][field] = value; }, 'COMPOSE_DELIVERY_CONTRACT');
}
const serialized = JSON.stringify(acceptedNormalized.normalized);
for (const forbidden of ['operationSequence', 'stagingBlock', 'nativeHandle', 'devicePointer']) assert.equal(serialized.includes(forbidden), false);

console.log('terminal_output_delivery=pass missing=reject owner_schema=reject resource_range=reject inference=forbidden identity=end-to-end lower_private_identity=absent');

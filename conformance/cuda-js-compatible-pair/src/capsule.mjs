import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  canonicalIdentity,
  compareRaw,
  composeResolvedEngine,
  createResolvedComposerInput,
  normalizeChannelProfile,
  normalizeDomainProfile,
  normalizeEvaluatorProfile,
  normalizeGraphProfile,
  normalizeOutputProfile,
  normalizePolicyProfile,
  normalizeProgressProfile,
  normalizeResourceProfile,
  normalizeStageProfile,
} from '../../../components/search-compiler/testing.mjs';
import { inspectCatalog, sourceTextSha256 } from '../../search-compiler/src/catalog.mjs';
import { buildDomainProfiles } from '../../search-compiler/src/domain-fixtures.mjs';
import { buildGraphProfiles } from '../../search-compiler/src/graph-fixtures.mjs';
import { buildEvaluatorProfiles } from '../../search-compiler/src/evaluator-fixtures.mjs';
import { buildPolicyProfiles } from '../../search-compiler/src/policy-fixtures.mjs';
import { buildChannelResourceProfile } from '../../search-compiler/src/resource-fixtures.mjs';
import { buildChannelProgressProfile } from '../../search-compiler/src/progress-fixtures.mjs';
import { buildOutputProfile } from '../../search-compiler/src/output-fixtures.mjs';
import { buildChannelStageProfile } from '../../search-compiler/src/stage-fixtures.mjs';
import { buildChannelProfile } from '../../search-compiler/src/channel-fixtures.mjs';

const VERSION = '0.1.0';
const PROFILE_SCHEMA = 'cuda-mcgs.program-package-profile/0.2.0';
const REPRESENTATION = 'cuda-mcgs.search-ir/0.2.0';
const CUDA_JS_REPOSITORY = 'iteathen/CUDA-JS';
const CUDA_MCGS_REPOSITORY = 'iteathen/CUDA-MCGS';
const TERMINAL_WORDS = 1024;
const GRID_X = 4;
const BLOCK_X = 256;
const PUBLICATION_PAYLOAD = 0x1234_5678;
const PUBLICATION_READY = 1;
const PUBLICATION_RESULT = PUBLICATION_PAYLOAD + PUBLICATION_READY;

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function assertGitObject(value, label) {
  if (typeof value !== 'string' || !/^[0-9a-f]{40}$/.test(value)) fail('PAIR_IDENTITY', `${label} must be an exact 40-hex Git object id`);
}

export function normalizeExactPair(input) {
  if (!input || typeof input !== 'object') fail('PAIR_IDENTITY', 'pair must be an object');
  const mcgs = input.cudaMcgs;
  const cudaJs = input.cudaJs;
  if (mcgs?.repository !== CUDA_MCGS_REPOSITORY || cudaJs?.repository !== CUDA_JS_REPOSITORY) fail('PAIR_IDENTITY', 'pair repositories are not the governed repositories');
  assertGitObject(mcgs.revision, 'CUDA-MCGS revision');
  assertGitObject(cudaJs.revision, 'CUDA-JS revision');
  assertGitObject(mcgs.tree, 'CUDA-MCGS tree');
  assertGitObject(cudaJs.tree, 'CUDA-JS tree');
  if (typeof cudaJs.package !== 'string' || !/^cuda-js@[0-9A-Za-z.+-]+$/.test(cudaJs.package)) fail('PAIR_IDENTITY', 'CUDA-JS package identity is invalid');
  if (String(cudaJs.apiSchema) !== '1') fail('PAIR_IDENTITY', 'CUDA-JS API schema must be 1 for this capsule');
  return Object.freeze({
    cudaMcgs: Object.freeze({ repository: mcgs.repository, revision: mcgs.revision, tree: mcgs.tree }),
    cudaJs: Object.freeze({ repository: cudaJs.repository, revision: cudaJs.revision, tree: cudaJs.tree, package: cudaJs.package, apiSchema: '1' }),
  });
}

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function schemaReference(id) {
  return { id: `${id}/${VERSION}`, version: VERSION, sha256: sha256(`schema:${id}/${VERSION}`) };
}

function contentIdentity(label) {
  return { algorithm: 'sha256', sha256: sha256(`content:${label}`) };
}

function identityReference(identity) {
  return { algorithm: identity.algorithm, sha256: identity.sha256 };
}

function profileReference(result) {
  return {
    id: result.normalized.id,
    schema: { id: result.normalized.schema, version: '0.2.0', sha256: result.schemaSha },
    identity: identityReference(result.identity),
  };
}

function catalogContract(inspected, id) {
  const contract = inspected.contractSet.contracts.find((entry) => entry.id === id);
  if (!contract) fail('PAIR_CONSTRUCTION', `missing catalog contract ${id}`);
  return { kind: 'catalog', id: contract.id, specificationIdentity: contract.specificationIdentity, sha256: contract.sha256 };
}

function sourceIdentity(source) {
  const canonical = source.replace(/\r\n?/g, '\n').replace(/\n+$/g, '') + '\n';
  return { algorithm: 'sha256', sha256: createHash('sha256').update(canonical, 'utf8').digest('hex') };
}

function idToken(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function token(value) {
  return value.replace(/[^A-Za-z0-9_$]/g, '_');
}

function provenance(pair, label) {
  return {
    origin: 'first-party',
    trust: 'first-party-reviewed',
    revision: pair.cudaMcgs.revision,
    license: 'Apache-2.0',
    review: schemaReference(`cuda-mcgs.compatible-pair-${idToken(label)}-security-review`),
  };
}

function withSchema(result, schemaSha) {
  return { ...result, schemaSha };
}

async function readJson(absolutePath) {
  return JSON.parse(await readFile(absolutePath, 'utf8'));
}

async function buildAcceptedOwnerContext(pair) {
  const srcRoot = path.dirname(fileURLToPath(import.meta.url));
  const repositoryRoot = path.resolve(srcRoot, '..', '..', '..');
  const schemaRoot = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0');
  const contractSetInput = await readJson(path.join(schemaRoot, 'contract-set.json'));
  const coverageInput = await readJson(path.join(schemaRoot, 'requirement-coverage.json'));
  const inspected = await inspectCatalog(repositoryRoot, contractSetInput, coverageInput);

  const schemaSha = async (name) => sourceTextSha256(await readFile(path.join(schemaRoot, name)));
  const domainSchemaSha = await schemaSha('domain-profile.schema.json');
  const graphSchemaSha = await schemaSha('graph-profile.schema.json');
  const evaluatorSchemaSha = await schemaSha('evaluator-profile.schema.json');
  const policySchemaSha = await schemaSha('policy-profile.schema.json');
  const resourceSchemaSha = await schemaSha('resource-profile.schema.json');
  const progressSchemaSha = await schemaSha('progress-profile.schema.json');
  const outputSchemaSha = await schemaSha('output-profile.schema.json');
  const stageSchemaSha = await schemaSha('stage-profile.schema.json');
  const channelSchemaSha = await schemaSha('channel-profile.schema.json');

  const domainProfiles = buildDomainProfiles(inspected).map((input) => normalizeDomainProfile(input, inspected));
  const graphFixtures = buildGraphProfiles(inspected, domainProfiles, domainSchemaSha);
  const graphProfiles = graphFixtures.map(({ input, domain }) => normalizeGraphProfile(input, inspected, domain));
  const evaluatorFixtures = buildEvaluatorProfiles(inspected, domainProfiles, graphProfiles, domainSchemaSha, graphSchemaSha);
  const evaluatorProfiles = evaluatorFixtures.map(({ input, domain, graph }) => normalizeEvaluatorProfile(input, inspected, domain, graph));
  const policyFixtures = buildPolicyProfiles(inspected, domainProfiles, graphProfiles, domainSchemaSha, graphSchemaSha, evaluatorProfiles, evaluatorSchemaSha);
  const policyProfiles = policyFixtures.map(({ input, domain, graph }) => normalizePolicyProfile(input, inspected, domain, graph));

  const knownResourceProfiles = [
    ...domainProfiles.map((result) => withSchema(result, domainSchemaSha)),
    ...graphProfiles.map((result) => withSchema(result, graphSchemaSha)),
    ...policyProfiles.map((result) => withSchema(result, policySchemaSha)),
    ...evaluatorProfiles.map((result) => withSchema(result, evaluatorSchemaSha)),
  ];
  const schemaShas = { domain: domainSchemaSha, graph: graphSchemaSha, policy: policySchemaSha, evaluator: evaluatorSchemaSha };
  const resource = withSchema(normalizeResourceProfile(
    buildChannelResourceProfile(inspected, domainProfiles, graphProfiles, policyProfiles, evaluatorProfiles, schemaShas),
    inspected,
    knownResourceProfiles,
  ), resourceSchemaSha);
  const progress = withSchema(normalizeProgressProfile(
    buildChannelProgressProfile(inspected, resource),
    inspected,
    resource,
    knownResourceProfiles,
  ), progressSchemaSha);
  const output = withSchema(normalizeOutputProfile(
    buildOutputProfile('synthetic-stage-channels', inspected, resource, progress),
    inspected,
    resource,
    progress,
  ), outputSchemaSha);
  const stage = withSchema(normalizeStageProfile(
    buildChannelStageProfile(inspected, resource, progress, knownResourceProfiles),
    inspected,
    resource,
    progress,
    knownResourceProfiles,
  ), stageSchemaSha);
  const channel = withSchema(normalizeChannelProfile(
    buildChannelProfile('synthetic-evaluator-and-audit', inspected, resource, progress, stage, { required: true }),
    inspected,
    resource,
    progress,
    stage,
  ), channelSchemaSha);

  const selected = [
    withSchema(domainProfiles[1], domainSchemaSha),
    withSchema(graphProfiles[1], graphSchemaSha),
    withSchema(policyProfiles[1], policySchemaSha),
    withSchema(evaluatorProfiles[0], evaluatorSchemaSha),
    resource,
    progress,
    output,
    stage,
    channel,
  ];
  return {
    repositoryRoot,
    inspected,
    resourceResult: resource,
    progressResult: progress,
    outputResult: output,
    stageResult: stage,
    channelResult: channel,
    profileResults: selected,
    authorityRevision: pair.cudaMcgs.revision,
  };
}

function addRequirement(requirements, reference, consumers, qualification) {
  const prior = requirements.get(reference.id);
  if (!prior) requirements.set(reference.id, { contract: { ...reference }, consumers: new Set(consumers), qualification });
  else for (const consumer of consumers) prior.consumers.add(consumer);
}

function publicRequirements(context, profileId) {
  const requirements = new Map();
  addRequirement(requirements, schemaReference('cuda-js.device-js'), [profileId], 'portable');
  addRequirement(requirements, schemaReference('cuda-js.operation-lifecycle'), [profileId], 'native-compatible-pair');
  addRequirement(requirements, schemaReference('cuda-js.publication-mailbox'), [context.progressResult.normalized.id], 'native-compatible-pair');
  for (const result of context.profileResults) {
    const contributed = result.normalized.programContribution?.requirements ?? [];
    if (contributed.length === 0) continue;
    const consumers = [result.normalized.id];
    if (result === context.stageResult) consumers.push(...result.normalized.capabilities.map(({ id }) => id));
    if (result === context.channelResult) consumers.push(...result.normalized.channels.map(({ id }) => id));
    for (const requirement of contributed) addRequirement(requirements, requirement, consumers, 'native-compatible-pair');
  }
  return [...requirements.values()].map((entry) => ({
    contract: entry.contract,
    consumers: [...entry.consumers].sort(compareRaw),
    qualification: entry.qualification,
  })).sort((left, right) => compareRaw(left.contract.id, right.contract.id));
}

function resourceRequirements(context) {
  return context.resourceResult.normalized.providerRequirements.map((provider) => ({
    id: `pair-resource.${idToken(provider.id)}`,
    ownerProfile: context.resourceResult.normalized.id,
    providerRequirement: provider.id,
    materialization: provider.unit === 'bytes' && provider.memorySpaces.some((space) => ['device-search', 'device-publication'].includes(space)) ? 'resident-storage' : 'semantic-only',
    unit: provider.unit,
    capacity: provider.capacity,
    alignment: provider.alignment,
    memorySpaces: [...provider.memorySpaces],
    access: [...provider.access],
  }));
}

function terminalDelivery(context, resources) {
  const output = context.outputResult.normalized;
  const plan = context.resourceResult.normalized;
  const reserve = plan.reserves.find(({ id }) => id === output.terminalEnvelope.terminalReserve);
  const partition = reserve && plan.partitions.find(({ id }) => id === reserve.partition);
  const resourceClass = reserve && plan.classes.find(({ id }) => id === reserve.class);
  const pool = partition && plan.pools.find(({ id }) => id === partition.pool);
  const contributor = plan.contributors.find(({ profile, contract }) => profile?.id === output.id || contract?.id === 'SPEC-0013');
  if (!reserve || reserve.purpose !== 'terminal-result' || !partition || !resourceClass || !pool || partition.alias?.kind !== 'none') fail('PAIR_TERMINAL_RESOURCE', 'terminal Output reserve is not exact first-realization storage');
  if (!contributor || !reserve.eligibleOwners.includes(contributor.id)) fail('PAIR_TERMINAL_RESOURCE', 'terminal Output reserve is not owned by Output');
  const resource = resources.find(({ providerRequirement }) => providerRequirement === pool.providerRequirement);
  if (!resource || resource.materialization !== 'resident-storage' || !resource.access.includes('read')) fail('PAIR_TERMINAL_RESOURCE', 'terminal Output does not map to readable resident storage');
  return {
    id: 'delivery.compatible-pair-32.terminal-output',
    semanticOwner: output.id,
    role: 'terminal-output',
    terminalSchema: output.terminal.schema,
    resource: resource.id,
    byteOffset: partition.offset,
    byteLength: reserve.maximum,
    readiness: 'terminal-completed',
    mode: 'asynchronous-bounded-read',
    maxTransfers: output.publication.maxTransfers,
    borrow: { ...output.terminal.borrow },
    asyncRead: { ...output.terminal.asyncRead },
    cleanup: { ...output.terminal.cleanup },
    lifetime: 'terminal-result',
  };
}

function channelPayloadResource(context, resources) {
  const selected = context.channelResult.normalized.channels.find(({ consumption }) => consumption.class === 'required');
  if (!selected) fail('PAIR_CHANNEL_RESOURCE', 'accepted required Channel is absent');
  const allocation = selected.resources.allocations.find(({ kind }) => kind === 'payload');
  const plan = context.resourceResult.normalized;
  const partitions = allocation ? plan.partitions.filter(({ class: classId }) => classId === allocation.class) : [];
  if (partitions.length !== 1) fail('PAIR_CHANNEL_RESOURCE', 'Channel payload must map to exactly one resource partition');
  const pool = plan.pools.find(({ id }) => id === partitions[0].pool);
  const resource = pool && resources.find(({ providerRequirement }) => providerRequirement === pool.providerRequirement);
  if (!resource || resource.materialization !== 'resident-storage' || !resource.access.includes('read') || !resource.access.includes('write') || !resource.access.includes('atomic')) fail('PAIR_CHANNEL_RESOURCE', 'Channel payload is not read/write/atomic resident storage');
  if (BigInt(resource.capacity) < 8n || BigInt(resource.alignment) < 4n) fail('PAIR_CHANNEL_RESOURCE', 'Channel payload storage cannot hold aligned payload/readiness words');
  return { channel: selected, resource };
}

function canonicalCapabilityOrder(capabilities) {
  const selected = new Set(capabilities.map(({ id }) => id));
  const outgoing = new Map(capabilities.map(({ id }) => [id, new Set()]));
  const incoming = new Map(capabilities.map(({ id }) => [id, 0]));
  for (const capability of capabilities) {
    for (const target of capability.before.filter((id) => selected.has(id))) outgoing.get(capability.id).add(target);
    for (const source of capability.after.filter((id) => selected.has(id))) outgoing.get(source).add(capability.id);
  }
  for (const targets of outgoing.values()) for (const target of targets) incoming.set(target, incoming.get(target) + 1);
  const ready = [...incoming].filter(([, count]) => count === 0).map(([id]) => id).sort(compareRaw);
  const ordered = [];
  while (ready.length > 0) {
    const id = ready.shift(); ordered.push(id);
    for (const target of [...outgoing.get(id)].sort(compareRaw)) {
      incoming.set(target, incoming.get(target) - 1);
      if (incoming.get(target) === 0) ready.push(target);
    }
    ready.sort(compareRaw);
  }
  if (ordered.length !== capabilities.length) fail('PAIR_STAGE_ORDER', 'selected Stage capability order is cyclic');
  return ordered;
}

function ownerSource(result, semanticOwner, kind, pair, suffix = '') {
  const owner = result.normalized.id;
  const functionName = `fn_${token(semanticOwner)}${suffix}`;
  const source = `function ${functionName}() { return gpu.u32(1); }\n`;
  const id = `source.${idToken(owner)}.${idToken(semanticOwner)}${suffix ? `-${idToken(suffix)}` : ''}`;
  return {
    unit: {
      id, ownerProfile: owner, semanticOwner, kind, source, sourceIdentity: sourceIdentity(source),
      contributionIdentity: identityReference(result.normalized.programContribution.sourceIdentity), functions: [functionName], provenance: provenance(pair, id),
    },
    function: {
      name: functionName, executionRole: 'device-callable', parameters: [], returns: 'u32', sourceUnit: id, ownerProfile: owner,
      semanticRole: `program.${idToken(semanticOwner)}`, calls: [], helpers: [],
    },
  };
}

function sourceAndFunctions(context, profileId, pair) {
  const sourceUnits = [];
  const functions = [];
  const ordinaryFunctions = [];
  for (const result of context.profileResults) {
    if (!result.normalized.programContribution?.sourceIdentity) continue;
    if (result === context.stageResult || result === context.channelResult) continue;
    const record = ownerSource(result, result.normalized.id, 'source-owner', pair);
    sourceUnits.push(record.unit); functions.push(record.function); ordinaryFunctions.push(record.function.name);
  }

  const stageFunctionsBySurface = new Map();
  for (const surface of context.stageResult.normalized.surfaces) {
    const selected = context.stageResult.normalized.capabilities.filter(({ bindings }) => bindings.includes(surface.id));
    const records = selected.map((capability, index) => ownerSource(context.stageResult, capability.id, 'stage-capability', pair, `_${token(surface.id)}_${index}`));
    for (const record of records) { sourceUnits.push(record.unit); functions.push(record.function); }
    stageFunctionsBySurface.set(surface.id, { capabilities: selected, functions: records.map((record) => record.function.name) });
  }

  const requiredChannel = context.channelResult.normalized.channels.find(({ consumption }) => consumption.class === 'required');
  const handoffSource = `function channel_handoff(channelState) {\n  let gid = gpu.thread.globalX();\n  let result = gid;\n  if (gid === gpu.u32(0)) {\n    channelState[gpu.u32(0)] = gpu.u32(${PUBLICATION_PAYLOAD});\n    gpu.atomic.storeReleaseDevice(channelState, gpu.u32(1), gpu.u32(${PUBLICATION_READY}));\n  }\n  gpu.barrier.block();\n  if (gid === gpu.u32(1)) {\n    let ready = gpu.atomic.loadAcquireDevice(channelState, gpu.u32(1));\n    result = channelState[gpu.u32(0)] + ready;\n  }\n  return result;\n}\n`;
  for (const channel of context.channelResult.normalized.channels) {
    if (channel.id === requiredChannel.id) {
      const id = `source.${idToken(context.channelResult.normalized.id)}.${idToken(channel.id)}-publication-handoff`;
      sourceUnits.push({
        id, ownerProfile: context.channelResult.normalized.id, semanticOwner: channel.id, kind: 'channel', source: handoffSource,
        sourceIdentity: sourceIdentity(handoffSource), contributionIdentity: identityReference(context.channelResult.normalized.programContribution.sourceIdentity),
        functions: ['channel_handoff'], provenance: provenance(pair, id),
      });
      functions.push({
        name: 'channel_handoff', executionRole: 'device-callable', parameters: [{ name: 'channelState', type: 'ptr<u32>' }], returns: 'u32',
        sourceUnit: id, ownerProfile: context.channelResult.normalized.id, semanticRole: 'channel.device-publication-handoff', calls: [],
        helpers: ['gpu.thread.global-x', 'gpu.atomic.store-release-device', 'gpu.barrier.block', 'gpu.atomic.load-acquire-device'],
      });
    } else {
      const record = ownerSource(context.channelResult, channel.id, 'channel', pair);
      sourceUnits.push(record.unit); functions.push(record.function);
    }
  }

  const entrySource = 'function engine_step(output, channelState, frameworkCancellation) {\n  gpu.mailbox.loadAcquireSystem(frameworkCancellation);\n  output[gpu.thread.globalX()] = channel_handoff(channelState);\n}\n';
  const entryUnitId = 'source.compatible-pair-32.engine-entry';
  const composerContributionIdentity = contentIdentity(`compatible-pair-32:${pair.cudaMcgs.revision}:composer-entry`);
  sourceUnits.push({
    id: entryUnitId, ownerProfile: profileId, semanticOwner: profileId, kind: 'composer-entry', source: entrySource,
    sourceIdentity: sourceIdentity(entrySource), contributionIdentity: composerContributionIdentity, functions: ['engine_step'], provenance: provenance(pair, entryUnitId),
  });
  functions.push({
    name: 'engine_step', executionRole: 'runtime-entry',
    parameters: [
      { name: 'output', type: 'ptr<u32>' },
      { name: 'channelState', type: 'ptr<u32>' },
      { name: 'frameworkCancellation', type: 'sideband<host-to-device,u32>', sidebandRole: 'framework-cancellation' },
    ],
    returns: 'void', sourceUnit: entryUnitId, ownerProfile: profileId, semanticRole: 'engine.execute', calls: ['channel_handoff'],
    helpers: ['gpu.thread.global-x', 'gpu.mailbox.load-acquire-system'],
  });

  const programUnits = ordinaryFunctions.map((name) => {
    const fn = functions.find((entry) => entry.name === name);
    const unit = sourceUnits.find((entry) => entry.id === fn.sourceUnit);
    return { id: `program-unit.compatible-pair-32.${idToken(name)}`, kind: 'owner', surface: null, contributors: [unit.semanticOwner], functions: [name], effectOrder: [] };
  });
  for (const [surface, record] of [...stageFunctionsBySurface].sort(([left], [right]) => compareRaw(left, right))) {
    programUnits.push({
      id: `program-unit.compatible-pair-32.${idToken(surface)}`, kind: 'stage-capability', surface,
      contributors: record.capabilities.map(({ id }) => id), functions: record.functions, effectOrder: canonicalCapabilityOrder(record.capabilities),
    });
  }
  for (const channel of context.channelResult.normalized.channels) {
    const fn = functions.find((entry) => sourceUnits.find(({ id }) => id === entry.sourceUnit)?.semanticOwner === channel.id);
    programUnits.push({ id: `program-unit.compatible-pair-32.${idToken(channel.id)}`, kind: 'owner', surface: null, contributors: [channel.id], functions: [fn.name], effectOrder: [] });
  }
  programUnits.push({ id: 'program-unit.compatible-pair-32.engine-entry', kind: 'entry-point', surface: null, contributors: [profileId], functions: ['engine_step'], effectOrder: [] });
  return { sourceUnits, functions, programUnits, composerContributionIdentity };
}

function frameworkCancellationSideband(context) {
  return {
    id: 'sideband.compatible-pair-32.framework-cancellation',
    semanticOwner: context.progressResult.normalized.id,
    role: 'framework-cancellation', direction: 'host-to-device', valueType: 'u32', capacity: '1', publication: 'release-acquire',
    applicationPoint: schemaReference('cuda-mcgs.framework-cancellation-checkpoint'), lifetime: 'operation', residentResource: null,
    semantics: schemaReference('cuda-mcgs.framework-cancellation-sideband'), cleanup: schemaReference('cuda-mcgs.framework-cancellation-sideband-cleanup'),
  };
}

function deletionManifest(profileId, context, sourceUnits, functions, resources, requirements, sidebands, deliveries) {
  const semanticOwners = new Set([profileId, ...context.profileResults.map(({ normalized }) => normalized.id)]);
  for (const capability of context.stageResult.normalized.capabilities) semanticOwners.add(capability.id);
  for (const channel of context.channelResult.normalized.channels) semanticOwners.add(channel.id);
  const records = [...semanticOwners].sort(compareRaw).map((owner) => ({
    owner,
    sourceUnits: sourceUnits.filter((entry) => entry.semanticOwner === owner).map(({ id }) => id),
    functions: functions.filter((entry) => sourceUnits.find(({ id }) => id === entry.sourceUnit)?.semanticOwner === owner).map(({ name }) => name),
    resources: resources.filter((entry) => entry.ownerProfile === owner).map(({ id }) => id),
    publicRequirements: requirements.filter(({ consumers }) => consumers.includes(owner)).map(({ contract }) => contract.id),
    sidebands: sidebands.filter(({ semanticOwner }) => semanticOwner === owner).map(({ id }) => id),
    deliveries: deliveries.filter(({ semanticOwner }) => semanticOwner === owner).map(({ id }) => id),
    packageRecords: owner === profileId ? ['package.execution-operation'] : [],
  }));
  return { selectedOwners: [...semanticOwners].sort(compareRaw), records, comparison: 'byte-exact-except-truthful-selected-owner-identities', absence: 'structural-omission-no-placeholder' };
}

function buildProfileTemplate(context, pair) {
  const profileId = 'program-package.compatible-pair-32';
  const profiles = context.profileResults.map(profileReference).sort((left, right) => compareRaw(left.id, right.id));
  const requirements = publicRequirements(context, profileId);
  const resources = resourceRequirements(context);
  const delivery = terminalDelivery(context, resources);
  const { channel, resource: channelResource } = channelPayloadResource(context, resources);
  const terminalResource = resources.find(({ id }) => id === delivery.resource);
  if (terminalResource.id === channelResource.id) fail('PAIR_RESOURCE_OWNERSHIP', 'Channel payload and terminal Output must remain distinct package resources');
  if (delivery.byteOffset !== '0' || delivery.byteLength !== '4096' || BigInt(terminalResource.capacity) < BigInt(delivery.byteLength)) fail('PAIR_TERMINAL_RANGE', 'first pair requires the exact accepted 4096-byte terminal Output reserve at backing-resource offset zero');
  const source = sourceAndFunctions(context, profileId, pair);
  const sidebands = [frameworkCancellationSideband(context)];
  const profileTemplate = {
    schema: PROFILE_SCHEMA, representation: REPRESENTATION, status: 'accepted', contract: catalogContract(context.inspected, 'SPEC-0005'), id: profileId, version: VERSION,
    semanticEngine: {
      contractSet: identityReference(context.inspected.identities.contractSet),
      authority: { repository: CUDA_MCGS_REPOSITORY, revision: pair.cudaMcgs.revision },
      profiles,
      resourcePlan: profileReference(context.resourceResult), progressPlan: profileReference(context.progressResult), outputProfile: profileReference(context.outputResult),
      sessionProfile: { kind: 'absent' }, stageProfile: { kind: 'selected', profile: profileReference(context.stageResult) }, channelProfile: { kind: 'selected', profile: profileReference(context.channelResult) },
    },
    sourceUnits: source.sourceUnits, functions: source.functions, programUnits: source.programUnits, publicRequirements: requirements, resources, sidebands, deliveries: [delivery],
    operations: [{
      id: 'operation.compatible-pair-32.engine-step', entryPoint: 'engine_step',
      bindings: [
        { parameter: 'output', source: { kind: 'resource', resource: terminalResource.id, access: 'write' } },
        { parameter: 'channelState', source: { kind: 'resource', resource: channelResource.id, access: 'read-write' } },
        { parameter: 'frameworkCancellation', source: { kind: 'sideband', sideband: sidebands[0].id } },
      ],
      grid: [String(GRID_X), '1', '1'], block: [String(BLOCK_X), '1', '1'], dynamicSharedBytes: '0', maxPending: '1',
    }],
    manifests: {
      result: schemaReference('cuda-mcgs.package-result'), observation: schemaReference('cuda-mcgs.package-observation'), diagnostic: schemaReference('cuda-mcgs.package-diagnostic'),
      cancellation: schemaReference('cuda-mcgs.package-cancellation'), completion: schemaReference('cuda-mcgs.package-completion'), cleanup: schemaReference('cuda-mcgs.package-cleanup'),
    },
    provenance: provenance(pair, 'compatible-pair-32-package'),
    compatibility: {
      cudaJs: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package }, apiSchema: pair.cudaJs.apiSchema,
      capabilityNegotiation: 'pre-allocation-fail-closed', fallback: 'none',
      requiredEvidence: [schemaReference('cuda-mcgs.compatible-pair-32-execution-evidence'), schemaReference('cuda-js.compatible-pair-evidence')],
    },
    deletion: deletionManifest(profileId, context, source.sourceUnits, source.functions, resources, requirements, sidebands, [delivery]),
  };
  const requirementById = new Map(requirements.map(({ contract }) => [contract.id, contract]));
  const composerContext = {
    ...context,
    composerContributionIdentity: source.composerContributionIdentity,
    requirementById,
    availableRequirements: new Set(requirementById.keys()),
    cudaJs: { revision: pair.cudaJs.revision, package: pair.cudaJs.package, apiSchema: pair.cudaJs.apiSchema },
  };
  return { profileTemplate, composerContext, terminalResource, channelResource, channel, delivery };
}

export function expectedTerminalBytes() {
  const bytes = new Uint8Array(TERMINAL_WORDS * 4);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < TERMINAL_WORDS; index += 1) view.setUint32(index * 4, index === 1 ? PUBLICATION_RESULT : index, true);
  return bytes;
}

export async function buildExactCompatiblePairCapsule(pairInput) {
  const pair = normalizeExactPair(pairInput);
  const ownerContext = await buildAcceptedOwnerContext(pair);
  const built = buildProfileTemplate(ownerContext, pair);
  const generator = {
    id: 'composer.exact-compatible-pair', version: VERSION, revision: pair.cudaMcgs.revision, language: 'restricted-device-js',
    canonicalization: 'utf8-lf-source-units-by-js-code-unit-v1', maxSourceBytes: '1048576', maxFunctions: '1024', maxCallDepth: '64',
  };
  const resolvedInput = createResolvedComposerInput(built.profileTemplate, generator);
  const composition = composeResolvedEngine(resolvedInput.normalized, ownerContext.inspected, built.composerContext);
  const capsule = {
    schema: 'cuda-mcgs.compatible-pair-32-capsule/0.1.0',
    pair,
    composition,
    resources: {
      terminal: {
        packageId: built.terminalResource.id,
        allocationByteLength: built.terminalResource.capacity,
        deliveryByteOffset: built.delivery.byteOffset,
        deliveryByteLength: built.delivery.byteLength,
        alignment: built.terminalResource.alignment,
      },
      channel: { packageId: built.channelResource.id, byteLength: built.channelResource.capacity, alignment: built.channelResource.alignment, semanticOwner: built.channel.id },
    },
    deliveryId: built.delivery.id,
    workload: Object.freeze({ gridX: GRID_X, blockX: BLOCK_X, workItems: GRID_X * BLOCK_X, terminalWords: TERMINAL_WORDS, publicationPayload: PUBLICATION_PAYLOAD, publicationReady: PUBLICATION_READY, publicationResult: PUBLICATION_RESULT }),
  };
  assertExactExecutionPackage(capsule.composition.executionPackage.normalized, capsule);
  return capsule;
}

export function executionBindings(executionPackage, capsule) {
  const adapter = executionPackage.cudaJsAdapter;
  const operation = adapter.operationRequirements[0];
  const delivery = adapter.deliveryRequirements.find(({ packageDelivery }) => packageDelivery === capsule.deliveryId);
  const outputBinding = operation?.bindings.find(({ parameter }) => parameter === 'output');
  const channelBinding = operation?.bindings.find(({ parameter }) => parameter === 'channelState');
  const terminalResource = delivery && adapter.resourceRequirements.find(({ id }) => id === delivery.resource);
  const channelResource = channelBinding && adapter.resourceRequirements.find(({ id }) => id === channelBinding.source.resource);
  return { adapter, operation, delivery, outputBinding, channelBinding, terminalResource, channelResource };
}

export function assertExactExecutionPackage(executionPackage, capsule) {
  if (executionPackage.compatibility.cudaJs.revision !== capsule.pair.cudaJs.revision || executionPackage.compatibility.cudaJs.package !== capsule.pair.cudaJs.package || String(executionPackage.compatibility.apiSchema) !== capsule.pair.cudaJs.apiSchema) fail('PAIR_STALE_LOWER', 'execution package lower identity differs from frozen pair');
  const { adapter, operation, delivery, outputBinding, channelBinding, terminalResource, channelResource } = executionBindings(executionPackage, capsule);
  if (adapter.operationRequirements.length !== 1) fail('PAIR_HOST_RELAUNCH', 'exact pair admits exactly one device operation');
  if (!operation) fail('PAIR_HOST_RELAUNCH', 'exact pair operation is absent');
  if (!delivery || delivery.byteOffset !== capsule.resources.terminal.deliveryByteOffset || delivery.byteLength !== capsule.resources.terminal.deliveryByteLength) fail('PAIR_TERMINAL_RANGE', 'terminal delivery is not the exact declared Output reserve range');
  if (!outputBinding || outputBinding.source.resource !== delivery.resource || outputBinding.source.access !== 'write') fail('PAIR_TERMINAL_RESOURCE', 'operation Output binding differs from terminal delivery resource');
  if (!channelBinding || channelBinding.source.kind !== 'resource' || channelBinding.source.access !== 'read-write') fail('PAIR_CHANNEL_RESOURCE', 'operation Channel binding does not realize accepted read-write Channel payload storage');
  if (!terminalResource || terminalResource.byteLength !== capsule.resources.terminal.allocationByteLength || terminalResource.alignment !== capsule.resources.terminal.alignment) fail('PAIR_TERMINAL_RESOURCE', 'terminal backing allocation differs from the accepted Resource provider');
  if (!channelResource || channelResource.byteLength !== capsule.resources.channel.byteLength || channelResource.alignment !== capsule.resources.channel.alignment) fail('PAIR_CHANNEL_RESOURCE', 'Channel backing allocation differs from the accepted Resource provider');
  if (terminalResource.id === channelResource.id) fail('PAIR_RESOURCE_OWNERSHIP', 'Channel and Output adapter resources alias');
  if (BigInt(terminalResource.byteLength) < BigInt(delivery.byteOffset) + BigInt(delivery.byteLength)) fail('PAIR_TERMINAL_RANGE', 'terminal delivery exceeds its backing allocation');
  const totalThreads = Number(operation.launchPolicy.grid[0]) * Number(operation.launchPolicy.block[0]);
  if (totalThreads !== capsule.workload.terminalWords || totalThreads * 4 !== Number(delivery.byteLength)) fail('PAIR_LAUNCH_RANGE', 'launch does not cover the exact finite terminal u32 range');
  if (Number(operation.launchPolicy.block[0]) !== BLOCK_X || Number(operation.launchPolicy.grid[0]) !== GRID_X) fail('PAIR_LAUNCH_RANGE', 'launch geometry differs from the qualified capsule geometry');

  const semanticProgram = capsule.composition.searchProgram.normalized;
  const semanticEntry = semanticProgram.functions.find(({ name }) => name === operation.function);
  const semanticHandoff = semanticProgram.functions.find(({ name }) => name === 'channel_handoff');
  if (!semanticEntry || !semanticHandoff || !semanticEntry.calls.includes('channel_handoff')) fail('PAIR_CHANNEL_SEMANTICS', 'canonical Search Program does not consume the selected Channel function');
  const requiredHelpers = ['gpu.atomic.store-release-device', 'gpu.atomic.load-acquire-device', 'gpu.barrier.block'];
  if (requiredHelpers.some((helper) => !semanticHandoff.helpers.includes(helper))) fail('PAIR_PUBLICATION', 'canonical Channel function omits device release/acquire publication or deterministic block sequencing');
  if (!adapter.publicContracts.some(({ id }) => id === 'cuda-js.device-publication-release-acquire/0.1.0')) fail('PAIR_PUBLICATION', 'device release/acquire public requirement is absent');
  const source = adapter.searchProgram.source;
  if (!source.includes('gpu.atomic.storeReleaseDevice') || !source.includes('gpu.atomic.loadAcquireDevice') || !source.includes('gpu.barrier.block')) fail('PAIR_PUBLICATION', 'translated Search Program source omits release/acquire publication evidence');
  if (!adapter.searchProgram.functions.some(({ name }) => name === 'channel_handoff') || !adapter.searchProgram.functions.some(({ name }) => name === operation.function)) fail('PAIR_CHANNEL_SEMANTICS', 'execution package omits required public Device-JS functions');
  if (/(?:#include|__global__|__device__|\.ptx\b|\.cu\b|\bffi\b|raw[-_ ]?handle|native[-_ ]?handle)/i.test(source)) fail('PAIR_BOUNDARY', 'Search Program crosses the public Device-JS boundary');
  if (adapter.sidebandRequirements.some(({ direction }) => direction === 'device-to-host')) fail('PAIR_HOST_INTERMEDIATE', 'first exact pair must not observe active device work through the host');
  return true;
}

export function assertHostProtocol(actions) {
  const expected = ['prepare', 'ignite', 'wait', 'deliver', 'close'];
  if (!Array.isArray(actions) || actions.length !== expected.length || actions.some((value, index) => value !== expected[index])) fail('PAIR_HOST_INTERMEDIATE', 'host protocol contains an active read/decision/relaunch or omits terminal cleanup');
  return true;
}

export function portableEvidenceIdentity(capsule) {
  return canonicalIdentity({
    schema: capsule.schema,
    pair: capsule.pair,
    programPackage: capsule.composition.compositionProfile.identity,
    searchProgram: capsule.composition.searchProgram.identity,
    executionPackage: capsule.composition.executionPackage.identity,
    resources: capsule.resources,
    workload: capsule.workload,
  });
}

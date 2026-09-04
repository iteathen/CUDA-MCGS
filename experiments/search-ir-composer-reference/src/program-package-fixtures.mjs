import { createHash } from 'node:crypto';

import { compareRaw } from './validation.mjs';

const VERSION = '0.1.0';
const AUTHORITY_REVISION = '711a0570115ecf08d005a07408ee77f3c6671cba';
const CUDA_JS_REVISION = 'bc2700f2e5c654567c2e17bf8d67b882351b8681';
const CUDA_JS_PACKAGE = 'cuda-js@0.1.0-alpha.17';

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function contentIdentity(label) {
  return { algorithm: 'sha256', sha256: sha256(`content:${label}`) };
}

function sourceIdentity(source) {
  return { algorithm: 'sha256', sha256: sha256(source.replace(/\r\n?/g, '\n').replace(/\n+$/g, '') + '\n') };
}

function schemaReference(id) {
  return { id: `${id}/${VERSION}`, version: VERSION, sha256: sha256(`schema:${id}/${VERSION}`) };
}

function identityReference(identity) {
  return { algorithm: identity.algorithm, sha256: identity.sha256 };
}

function profileReference(result) {
  return { id: result.normalized.id, schema: { id: result.normalized.schema, version: '0.2.0', sha256: result.schemaSha }, identity: identityReference(result.identity) };
}

function catalogContract(inspected, id) {
  const contract = inspected.contractSet.contracts.find((entry) => entry.id === id);
  return { kind: 'catalog', id: contract.id, specificationIdentity: contract.specificationIdentity, sha256: contract.sha256 };
}

function token(value) {
  return value.replace(/[^A-Za-z0-9_$]/g, '_');
}

function idToken(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function provenance(label) {
  return { origin: 'first-party', trust: 'first-party-reviewed', revision: AUTHORITY_REVISION, license: 'Apache-2.0', review: schemaReference(`cuda-mcgs.synthetic-${idToken(label)}-security-review`) };
}

function ownerSource(profileResult, semanticOwner, kind, suffix = '') {
  const owner = profileResult.normalized.id;
  const functionName = `fn_${token(semanticOwner)}${suffix}`;
  const source = `function ${functionName}() { return 1; }\n`;
  return {
    unit: {
      id: `source.${idToken(owner)}.${idToken(semanticOwner)}${suffix ? `-${idToken(suffix)}` : ''}`,
      ownerProfile: owner,
      semanticOwner,
      kind,
      source,
      sourceIdentity: sourceIdentity(source),
      contributionIdentity: identityReference(profileResult.normalized.programContribution.sourceIdentity),
      functions: [functionName],
      provenance: provenance(`source-${idToken(semanticOwner)}`),
    },
    function: {
      name: functionName,
      executionRole: 'device-callable',
      parameters: [],
      returns: 'u32',
      sourceUnit: `source.${idToken(owner)}.${idToken(semanticOwner)}${suffix ? `-${idToken(suffix)}` : ''}`,
      ownerProfile: owner,
      semanticRole: `program.${idToken(semanticOwner)}`,
      calls: [],
      helpers: [],
    },
  };
}

function canonicalCapabilityOrder(stageProfile, capabilities) {
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
  if (ordered.length !== capabilities.length) throw new Error(`${stageProfile.id} fixture capability order is cyclic`);
  return ordered;
}

function sourceAndFunctions(context, profileId, label, sidebands = []) {
  const sourceUnits = []; const functions = []; const ordinaryFunctions = [];
  for (const result of context.profileResults) {
    if (!result.normalized.programContribution?.sourceIdentity) continue;
    if (context.stageResult && result.normalized.id === context.stageResult.normalized.id) continue;
    if (context.channelResult && result.normalized.id === context.channelResult.normalized.id) continue;
    const entry = ownerSource(result, result.normalized.id, 'source-owner');
    sourceUnits.push(entry.unit); functions.push(entry.function); ordinaryFunctions.push(entry.function.name);
  }

  const stageFunctionsBySurface = new Map();
  if (context.stageResult) {
    for (const surface of context.stageResult.normalized.surfaces) {
      const selected = context.stageResult.normalized.capabilities.filter(({ bindings }) => bindings.includes(surface.id));
      const records = selected.map((capability, index) => ownerSource(context.stageResult, capability.id, 'stage-capability', `_${token(surface.id)}_${index}`));
      for (const record of records) { sourceUnits.push(record.unit); functions.push(record.function); }
      stageFunctionsBySurface.set(surface.id, { capabilities: selected, functions: records.map(({ function: recordFunction }) => recordFunction.name) });
    }
  }
  if (context.channelResult) {
    for (const channel of context.channelResult.normalized.channels) {
      const entry = ownerSource(context.channelResult, channel.id, 'channel');
      sourceUnits.push(entry.unit); functions.push(entry.function); ordinaryFunctions.push(entry.function.name);
    }
  }

  const sidebandParameters = sidebands.map((sideband) => ({
    name: sideband.role === 'framework-cancellation' ? 'frameworkCancellation' : 'sessionCommandPublication',
    type: `sideband<${sideband.direction},${sideband.valueType}>`,
    sidebandRole: sideband.role,
  }));
  const parameterList = ['output', ...sidebandParameters.map(({ name }) => name)].join(', ');
  const observations = sidebandParameters.map(({ name }) => `gpu.mailbox.loadAcquireSystem(${name});`).join(' ');
  const entrySource = `function engine_step(${parameterList}) { ${observations} output[gpu.thread.globalX()] = 0; }\n`;
  const entryUnitId = `source.${label}.engine-entry`;
  sourceUnits.push({ id: entryUnitId, ownerProfile: profileId, semanticOwner: profileId, kind: 'composer-entry', source: entrySource, sourceIdentity: sourceIdentity(entrySource), contributionIdentity: contentIdentity(`${label}:composer-entry-contribution`), functions: ['engine_step'], provenance: provenance(`${label}-composer-entry`) });
  functions.push({ name: 'engine_step', executionRole: 'runtime-entry', parameters: [{ name: 'output', type: 'ptr<u32>' }, ...sidebandParameters], returns: 'void', sourceUnit: entryUnitId, ownerProfile: profileId, semanticRole: 'engine.execute', calls: [], helpers: ['gpu.thread.global-x', 'gpu.mailbox.load-acquire-system'] });

  const programUnits = ordinaryFunctions.map((name) => {
    const fn = functions.find((entry) => entry.name === name);
    const unit = sourceUnits.find((entry) => entry.id === fn.sourceUnit);
    return { id: `program-unit.${label}.${idToken(name)}`, kind: 'owner', surface: null, contributors: [unit.semanticOwner], functions: [name], effectOrder: [] };
  });
  for (const [surface, record] of [...stageFunctionsBySurface].sort(([left], [right]) => compareRaw(left, right))) {
    programUnits.push({ id: `program-unit.${label}.${idToken(surface)}`, kind: 'stage-capability', surface, contributors: record.capabilities.map(({ id }) => id), functions: record.functions, effectOrder: canonicalCapabilityOrder(context.stageResult.normalized, record.capabilities) });
  }
  programUnits.push({ id: `program-unit.${label}.engine-entry`, kind: 'entry-point', surface: null, contributors: [profileId], functions: ['engine_step'], effectOrder: [] });
  return { sourceUnits, functions, programUnits, composerContributionIdentity: contentIdentity(`${label}:composer-entry-contribution`) };
}

function publicRequirements(context, profileId) {
  const requirements = new Map();
  const add = (reference, consumers, qualification) => {
    const prior = requirements.get(reference.id);
    if (!prior) requirements.set(reference.id, { contract: { ...reference }, consumers: new Set(consumers), qualification });
    else for (const consumer of consumers) prior.consumers.add(consumer);
  };
  const deviceJs = schemaReference('cuda-js.device-js');
  const operation = schemaReference('cuda-js.operation-lifecycle');
  const mailbox = schemaReference('cuda-js.publication-mailbox');
  add(deviceJs, [profileId], 'portable');
  add(operation, [profileId], 'native-compatible-pair');
  add(mailbox, [context.progressResult.normalized.id], 'native-compatible-pair');
  for (const result of context.profileResults) {
    const contributed = result.normalized.programContribution?.requirements ?? [];
    if (contributed.length === 0) continue;
    const consumers = [result.normalized.id];
    if (result === context.stageResult) consumers.push(...result.normalized.capabilities.map(({ id }) => id));
    if (result === context.channelResult) consumers.push(...result.normalized.channels.map(({ id }) => id));
    for (const requirement of contributed) add(requirement, consumers, 'native-compatible-pair');
  }
  return [...requirements.values()].map((entry) => ({ contract: entry.contract, consumers: [...entry.consumers].sort(compareRaw), qualification: entry.qualification })).sort((left, right) => compareRaw(left.contract.id, right.contract.id));
}

function resourceRequirements(context) {
  return context.resourceResult.normalized.providerRequirements.map((provider) => ({
    id: `package-resource.${idToken(provider.id)}`,
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

function sessionPayloadResource(context, resources) {
  if (!context.sessionResult) return null;
  const resource = context.resourceResult.normalized;
  const sessionProfile = context.sessionResult.normalized.resourceContribution;
  const contributor = resource.contributors?.find(({ profile }) => profile?.id === sessionProfile?.id);
  if (!contributor) throw new Error('selected Session resource contribution is absent from Resource');
  const sessionClasses = resource.classes?.filter(({ contributor: owner, lifetime }) => owner === contributor.id && lifetime === 'session') ?? [];
  const classes = sessionClasses.length === 1 ? sessionClasses : sessionClasses.filter(({ formula }) => formula?.basis === 'maximum-live');
  if (classes.length !== 1) throw new Error('selected Session must project exactly one generic session-lifetime control class');
  const partitions = resource.partitions?.filter(({ class: classId }) => classId === classes[0].id) ?? [];
  if (partitions.length !== 1) throw new Error('selected Session control class must map to exactly one resource partition');
  const pool = resource.pools?.find(({ id }) => id === partitions[0].pool);
  if (!pool) throw new Error('selected Session control partition has no pool');
  const packageResource = resources.find(({ providerRequirement }) => providerRequirement === pool.providerRequirement);
  if (!packageResource || packageResource.materialization !== 'resident-storage') throw new Error('selected Session control payload is not resident package storage');
  return packageResource.id;
}

function sidebandRequirements(context, label, resources) {
  const sidebands = [{
    id: `sideband.${label}.framework-cancellation`,
    semanticOwner: context.progressResult.normalized.id,
    role: 'framework-cancellation',
    direction: 'host-to-device',
    valueType: 'u32',
    capacity: '1',
    publication: 'release-acquire',
    applicationPoint: schemaReference('cuda-mcgs.framework-cancellation-checkpoint'),
    lifetime: 'operation',
    residentResource: null,
    semantics: schemaReference('cuda-mcgs.framework-cancellation-sideband'),
    cleanup: schemaReference('cuda-mcgs.framework-cancellation-sideband-cleanup'),
  }];
  if (context.sessionResult) sidebands.push({
    id: `sideband.${label}.session-command-publication`,
    semanticOwner: context.sessionResult.normalized.id,
    role: 'session-command-publication',
    direction: 'host-to-device',
    valueType: 'u32',
    capacity: '1',
    publication: 'release-acquire',
    applicationPoint: schemaReference('cuda-mcgs.session-command-publication-checkpoint'),
    lifetime: 'session',
    residentResource: sessionPayloadResource(context, resources),
    semantics: schemaReference('cuda-mcgs.session-command-publication-sideband'),
    cleanup: schemaReference('cuda-mcgs.session-command-publication-sideband-cleanup'),
  });
  return sidebands;
}

function deletionManifest(profileId, semanticOwners, sourceUnits, functions, resources, requirements, sidebands) {
  const records = [...semanticOwners].sort(compareRaw).map((owner) => ({
    owner,
    sourceUnits: sourceUnits.filter((entry) => entry.semanticOwner === owner).map(({ id }) => id),
    functions: functions.filter((entry) => sourceUnits.find(({ id }) => id === entry.sourceUnit)?.semanticOwner === owner).map(({ name }) => name),
    resources: resources.filter((entry) => entry.ownerProfile === owner).map(({ id }) => id),
    publicRequirements: requirements.filter(({ consumers }) => consumers.includes(owner)).map(({ contract }) => contract.id),
    sidebands: sidebands.filter(({ semanticOwner }) => semanticOwner === owner).map(({ id }) => id),
    packageRecords: owner === profileId ? ['package.execution-operation'] : [],
  }));
  return { selectedOwners: [...semanticOwners].sort(compareRaw), records, comparison: 'byte-exact-except-truthful-selected-owner-identities', absence: 'structural-omission-no-placeholder' };
}

export function buildProgramPackageProfile(inspected, context, label) {
  const profileId = `program-package.${label}`;
  const profiles = context.profileResults.map(profileReference).sort((left, right) => compareRaw(left.id, right.id));
  const requirements = publicRequirements(context, profileId);
  const resources = resourceRequirements(context);
  const sidebands = sidebandRequirements(context, label, resources);
  const source = sourceAndFunctions(context, profileId, label, sidebands);
  const outputResource = resources.find(({ materialization }) => materialization === 'resident-storage');
  if (!outputResource) throw new Error(`${label} fixture has no resident-storage resource`);
  const semanticOwners = new Set([profileId, ...profiles.map(({ id }) => id)]);
  for (const capability of context.stageResult?.normalized.capabilities ?? []) semanticOwners.add(capability.id);
  for (const channel of context.channelResult?.normalized.channels ?? []) semanticOwners.add(channel.id);
  const input = {
    schema: 'cuda-mcgs.program-package-profile/0.2.0', representation: 'cuda-mcgs.search-ir/0.2.0', status: 'accepted', contract: catalogContract(inspected, 'SPEC-0005'), id: profileId, version: VERSION,
    semanticEngine: {
      contractSet: identityReference(inspected.identities.contractSet), authority: { repository: 'iteathen/CUDA-MCGS', revision: AUTHORITY_REVISION }, profiles,
      resourcePlan: profileReference(context.resourceResult), progressPlan: profileReference(context.progressResult), outputProfile: profileReference(context.outputResult),
      sessionProfile: context.sessionResult ? { kind: 'selected', profile: profileReference(context.sessionResult) } : { kind: 'absent' },
      stageProfile: context.stageResult ? { kind: 'selected', profile: profileReference(context.stageResult) } : { kind: 'absent' },
      channelProfile: context.channelResult ? { kind: 'selected', profile: profileReference(context.channelResult) } : { kind: 'absent' },
    },
    generator: { id: 'composer.reference-search-program', version: VERSION, revision: AUTHORITY_REVISION, language: 'restricted-device-js', canonicalization: 'utf8-lf-source-units-by-js-code-unit-v1', maxSourceBytes: '1048576', maxFunctions: '1024', maxCallDepth: '64' },
    sourceUnits: source.sourceUnits, functions: source.functions, programUnits: source.programUnits, publicRequirements: requirements, resources, sidebands,
    operations: [{
      id: `operation.${label}.engine-step`, entryPoint: 'engine_step',
      bindings: [
        { parameter: 'output', source: { kind: 'resource', resource: outputResource.id, access: 'write' } },
        ...sidebands.map((sideband) => ({ parameter: sideband.role === 'framework-cancellation' ? 'frameworkCancellation' : 'sessionCommandPublication', source: { kind: 'sideband', sideband: sideband.id } })),
      ],
      grid: ['1', '1', '1'], block: ['64', '1', '1'], dynamicSharedBytes: '0', maxPending: '1',
    }],
    manifests: { result: schemaReference('cuda-mcgs.package-result'), observation: schemaReference('cuda-mcgs.package-observation'), diagnostic: schemaReference('cuda-mcgs.package-diagnostic'), cancellation: schemaReference('cuda-mcgs.package-cancellation'), completion: schemaReference('cuda-mcgs.package-completion'), cleanup: schemaReference('cuda-mcgs.package-cleanup') },
    provenance: provenance(`${label}-package`),
    compatibility: { cudaJs: { repository: 'iteathen/CUDA-JS', revision: CUDA_JS_REVISION, package: CUDA_JS_PACKAGE }, apiSchema: '1', capabilityNegotiation: 'pre-allocation-fail-closed', fallback: 'none', requiredEvidence: [schemaReference('cuda-mcgs.reference-composition-evidence'), schemaReference('cuda-js.compatible-pair-evidence')] },
    deletion: deletionManifest(profileId, semanticOwners, source.sourceUnits, source.functions, resources, requirements, sidebands),
  };
  const requirementById = new Map(requirements.map(({ contract }) => [contract.id, contract]));
  return { input, context: { ...context, authorityRevision: AUTHORITY_REVISION, composerContributionIdentity: source.composerContributionIdentity, requirementById, availableRequirements: new Set(requirementById.keys()), cudaJs: { revision: CUDA_JS_REVISION, package: CUDA_JS_PACKAGE, apiSchema: '1' } } };
}

export function buildCudaJsRealizationFixture(packageResult, label, artifactCount = 1) {
  return {
    status: 'success',
    deviceProgram: contentIdentity(`${label}:cuda-js-device-program`),
    artifacts: Array.from({ length: artifactCount }, (_, index) => contentIdentity(`${label}:opaque-artifact:${index}`)),
    resources: packageResult.normalized.cudaJsAdapter.resourceRequirements.map((_, index) => contentIdentity(`${label}:opaque-resource:${index}`)),
    operations: packageResult.normalized.cudaJsAdapter.operationRequirements.map((_, index) => contentIdentity(`${label}:opaque-operation:${index}`)),
    runtime: contentIdentity(`${label}:opaque-runtime`),
    cleanup: { status: 'retained-evidence', disposition: schemaReference('cuda-js.reference-cleanup-disposition') },
  };
}

export function buildCudaJsFailureFixture(label, errorClass = 'unsupported-capability') {
  return { status: 'failure', error: { code: `${label}-failure`, class: errorClass, identity: contentIdentity(`${label}:error`) }, cleanup: { status: 'complete', disposition: schemaReference('cuda-js.reference-failure-cleanup') } };
}

export function buildCompatiblePairFixture(packageResult, programResult, realizationResult, label) {
  return {
    schema: 'cuda-mcgs.compatible-pair-record/0.2.0', status: 'reference-fixture',
    cudaMcgs: { repository: 'iteathen/CUDA-MCGS', revision: AUTHORITY_REVISION, package: 'cuda-mcgs@0.2.0-semantic-reference', searchIr: { ...packageResult.normalized.semantic.engineIdentity }, searchProgram: identityReference(programResult.identity), executionPackage: identityReference(packageResult.identity) },
    cudaJs: { repository: 'iteathen/CUDA-JS', revision: CUDA_JS_REVISION, package: CUDA_JS_PACKAGE, apiSchema: '1', capabilities: packageResult.normalized.cudaJsAdapter.publicContracts.map((entry) => ({ ...entry })), deviceProgram: { ...realizationResult.normalized.deviceProgram }, artifacts: realizationResult.normalized.artifacts.map((entry) => ({ ...entry })), resources: realizationResult.normalized.resources.map((entry) => ({ ...entry })), operations: realizationResult.normalized.operations.map((entry) => ({ ...entry })), runtime: { ...realizationResult.normalized.runtime } },
    environment: { platform: contentIdentity(`${label}:platform`), architecture: contentIdentity(`${label}:architecture`), device: contentIdentity(`${label}:device`), toolchain: contentIdentity(`${label}:toolchain`) },
    evidence: [contentIdentity(`${label}:reference-evidence`)],
    claim: { scope: 'CUDA-free opaque-realization reference fixture only', qualification: 'reference-only', native: false },
    cleanup: { status: 'retained-evidence', disposition: schemaReference('cuda-mcgs.reference-pair-cleanup') },
  };
}

export const programPackageFixtureConstants = Object.freeze({ authorityRevision: AUTHORITY_REVISION, cudaJsRevision: CUDA_JS_REVISION, cudaJsPackage: CUDA_JS_PACKAGE });

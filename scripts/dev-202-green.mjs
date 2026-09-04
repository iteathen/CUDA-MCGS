#!/usr/bin/env node
import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, content) { fs.writeFileSync(path, content); }
function replaceOnce(path, from, to, label) {
  const source = read(path);
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one replacement seam, found ${count}`);
  write(path, source.replace(from, to));
}
function writeJson(path, value) { write(path, `${JSON.stringify(value, null, 2)}\n`); }
function hasConst(alternatives, value) {
  return alternatives.some((entry) => entry?.properties?.kind?.const === value);
}

const programPath = 'experiments/search-ir-composer-reference/src/program-package.mjs';
const fixturePath = 'experiments/search-ir-composer-reference/src/program-package-fixtures.mjs';
const verifierPath = 'experiments/search-ir-composer-reference/verify-external-control-sideband-authority.mjs';

replaceOnce(programPath,
  "const RESTRICTED_SOURCE_TYPES = new Set(['bool', 'u32', 'i32', 'u64', 'f32', 'ptr<bool>', 'ptr<u32>', 'ptr<i32>', 'ptr<u64>', 'ptr<f32>']);",
  "const RESTRICTED_SOURCE_TYPES = new Set(['bool', 'u32', 'i32', 'u64', 'f32', 'ptr<bool>', 'ptr<u32>', 'ptr<i32>', 'ptr<u64>', 'ptr<f32>', 'sideband<host-to-device,u32>', 'sideband<device-to-host,u32>']);",
  'sideband parameter types');
replaceOnce(programPath,
  "  ['gpu.atomic.store-release-device', 'cuda-js.device-publication-release-acquire/0.1.0'],\n]);",
  "  ['gpu.atomic.store-release-device', 'cuda-js.device-publication-release-acquire/0.1.0'],\n  ['gpu.mailbox.load-acquire-system', 'cuda-js.publication-mailbox/0.1.0'],\n]);",
  'mailbox helper requirement');
replaceOnce(programPath,
  "  ['gpu.atomic.store-release-device', 'gpu.atomic.storeReleaseDevice'],\n  ['gpu.barrier.block', 'gpu.barrier.block'],",
  "  ['gpu.atomic.store-release-device', 'gpu.atomic.storeReleaseDevice'],\n  ['gpu.mailbox.load-acquire-system', 'gpu.mailbox.loadAcquireSystem'],\n  ['gpu.barrier.block', 'gpu.barrier.block'],",
  'mailbox helper source mapping');
replaceOnce(programPath,
  "const BASE_REQUIREMENTS = new Set(['cuda-js.device-js/0.1.0', 'cuda-js.operation-lifecycle/0.1.0']);",
  "const BASE_REQUIREMENTS = new Set(['cuda-js.device-js/0.1.0', 'cuda-js.operation-lifecycle/0.1.0', 'cuda-js.publication-mailbox/0.1.0']);",
  'framework mailbox base requirement');
replaceOnce(programPath,
`function expectedRequirementKeys(context) {
  const expected = new Map();
  for (const id of BASE_REQUIREMENTS) expected.set(id, context.requirementById.get(id));
  for (const result of [context.stageResult, context.channelResult]) {
    for (const requirement of result?.normalized?.programContribution?.requirements ?? []) expected.set(requirement.id, requirement);
  }
  return expected;
}`,
`function expectedRequirementKeys(context) {
  const expected = new Map();
  for (const id of BASE_REQUIREMENTS) expected.set(id, context.requirementById.get(id));
  for (const result of context.profileResults ?? []) {
    for (const requirement of result?.normalized?.programContribution?.requirements ?? []) expected.set(requirement.id, requirement);
  }
  return expected;
}`,
  'generic selected-owner requirement closure');

replaceOnce(programPath,
`function normalizeBinding(input, operationId, index, parameters, resources) {`,
`function normalizeSideband(input, index, context) {
  exactKeys(input, ['id', 'semanticOwner', 'role', 'direction', 'valueType', 'capacity', 'publication', 'applicationPoint', 'lifetime', 'payloadResource', 'semantics', 'cleanup'], 'COMPOSE_SIDEBAND_FIELDS', \`sideband \${index}\`);
  assertNamespacedId(input.id, 'COMPOSE_SIDEBAND_ID', \`sideband \${index} id\`);
  if (!context.semanticOwners.has(input.semanticOwner)) fail('COMPOSE_SIDEBAND_OWNER', \`\${input.id} names unselected semantic owner \${input.semanticOwner}\`);
  assertString(input.role, /^[a-z][a-z0-9-]*$/, 'COMPOSE_SIDEBAND_ROLE', \`\${input.id} role\`);
  const direction = assertEnum(input.direction, ['host-to-device', 'device-to-host'], 'COMPOSE_SIDEBAND_DIRECTION', \`\${input.id} direction\`);
  const valueType = assertEnum(input.valueType, ['u32'], 'COMPOSE_SIDEBAND_VALUE', \`\${input.id} valueType\`);
  const capacity = positiveDecimal(input.capacity, 'COMPOSE_SIDEBAND_CAPACITY', \`\${input.id} capacity\`);
  if (input.publication !== 'release-acquire') fail('COMPOSE_SIDEBAND_PUBLICATION', \`\${input.id} publication contract is unsupported\`);
  const lifetime = assertEnum(input.lifetime, ['operation', 'session'], 'COMPOSE_SIDEBAND_LIFETIME', \`\${input.id} lifetime\`);
  let payloadResource = null;
  if (input.payloadResource !== null) {
    assertNamespacedId(input.payloadResource, 'COMPOSE_SIDEBAND_PAYLOAD', \`\${input.id} payloadResource\`);
    const resource = context.resourceById.get(input.payloadResource);
    if (!resource || resource.materialization !== 'resident-storage') fail('COMPOSE_SIDEBAND_PAYLOAD', \`\${input.id} payloadResource is not resident storage\`);
    payloadResource = input.payloadResource;
  }
  if (!context.publicRequirements.some(({ contract }) => contract.id === 'cuda-js.publication-mailbox/0.1.0')) fail('COMPOSE_SIDEBAND_CAPABILITY', \`\${input.id} lacks the selected public publication capability\`);
  return {
    id: input.id, semanticOwner: input.semanticOwner, role: input.role, direction, valueType, capacity,
    publication: input.publication,
    applicationPoint: normalizeSchemaReference(input.applicationPoint, \`\${input.id} applicationPoint\`),
    lifetime, payloadResource,
    semantics: normalizeSchemaReference(input.semantics, \`\${input.id} semantics\`),
    cleanup: normalizeSchemaReference(input.cleanup, \`\${input.id} cleanup\`),
  };
}

function normalizeBinding(input, operationId, index, parameters, resources, sidebands) {`,
  'sideband normalizer');
replaceOnce(programPath,
`    return { parameter: input.parameter, source };
  }
  if (Object.hasOwn(input.source ?? {}, 'access')) fail('COMPOSE_OPERATION_ACCESS', \`${'${operationId}'} ${'${input.parameter}'} scalar binding cannot carry access\`);
  exactKeys(input.source, ['kind', 'schema'], 'COMPOSE_OPERATION_BINDING_FIELDS', \`${'${operationId}'} ${'${input.parameter}'} scalar\`);
  if (input.source.kind !== 'scalar' || parameter.type.startsWith('ptr<')) fail('COMPOSE_OPERATION_BINDING', \`${'${operationId}'} scalar binding is incompatible\`);`,
`    return { parameter: input.parameter, source };
  }
  if (input.source?.kind === 'sideband') {
    exactKeys(input.source, ['kind', 'sideband'], 'COMPOSE_OPERATION_BINDING_FIELDS', \`${'${operationId}'} ${'${input.parameter}'} sideband\`);
    const sideband = sidebands.get(input.source.sideband);
    if (!sideband || parameter.type !== \`sideband<\${sideband.direction},\${sideband.valueType}>\`) fail('COMPOSE_OPERATION_BINDING', \`${'${operationId}'} sideband binding is incompatible\`);
    return { parameter: input.parameter, source: { kind: 'sideband', sideband: input.source.sideband } };
  }
  if (Object.hasOwn(input.source ?? {}, 'access')) fail('COMPOSE_OPERATION_ACCESS', \`${'${operationId}'} ${'${input.parameter}'} scalar binding cannot carry access\`);
  exactKeys(input.source, ['kind', 'schema'], 'COMPOSE_OPERATION_BINDING_FIELDS', \`${'${operationId}'} ${'${input.parameter}'} scalar\`);
  if (input.source.kind !== 'scalar' || parameter.type.startsWith('ptr<') || parameter.type.startsWith('sideband<')) fail('COMPOSE_OPERATION_BINDING', \`${'${operationId}'} scalar binding is incompatible\`);`,
  'sideband binding');
replaceOnce(programPath,
  "const bindings = input.bindings.map((binding, bindingIndex) => normalizeBinding(binding, input.id, bindingIndex, entryPoint.parameters, context.resourceById)).sort((left, right) => compareRaw(left.parameter, right.parameter));",
  "const bindings = input.bindings.map((binding, bindingIndex) => normalizeBinding(binding, input.id, bindingIndex, entryPoint.parameters, context.resourceById, context.sidebandById)).sort((left, right) => compareRaw(left.parameter, right.parameter));",
  'operation sideband binding context');

replaceOnce(programPath,
`export function normalizeProgramPackageProfile(input, inspected, suppliedContext) {
  exactKeys(input, ['schema', 'representation', 'status', 'contract', 'id', 'version', 'semanticEngine', 'generator', 'sourceUnits', 'functions', 'programUnits', 'publicRequirements', 'resources', 'operations', 'manifests', 'provenance', 'compatibility', 'deletion'], 'COMPOSE_ROOT_FIELDS', 'program/package profile');`,
`export function normalizeProgramPackageProfile(input, inspected, suppliedContext) {
  const sidebandsDeclared = Object.hasOwn(input, 'sidebands');
  const rootFields = ['schema', 'representation', 'status', 'contract', 'id', 'version', 'semanticEngine', 'generator', 'sourceUnits', 'functions', 'programUnits', 'publicRequirements', 'resources', 'operations', 'manifests', 'provenance', 'compatibility', 'deletion'];
  if (sidebandsDeclared) rootFields.splice(rootFields.indexOf('operations'), 0, 'sidebands');
  exactKeys(input, rootFields, 'COMPOSE_ROOT_FIELDS', 'program/package profile');`,
  'optional sideband root');
replaceOnce(programPath,
`  if (resources.length !== context.providerById.size) fail('COMPOSE_RESOURCE_COVERAGE', 'resources do not cover every provider requirement');
  context.resourceById = new Map(resources.map((entry) => [entry.id, entry])); context.resources = resources;

  const operations = input.operations.map((entry, index) => normalizeOperation(entry, index, context)).sort((left, right) => compareRaw(left.id, right.id));`,
`  if (resources.length !== context.providerById.size) fail('COMPOSE_RESOURCE_COVERAGE', 'resources do not cover every provider requirement');
  context.resourceById = new Map(resources.map((entry) => [entry.id, entry])); context.resources = resources;

  let sidebands = [];
  if (sidebandsDeclared) {
    if (!Array.isArray(input.sidebands) || input.sidebands.length === 0) fail('COMPOSE_SIDEBAND_COUNT', 'sidebands must be a non-empty array when declared');
    sidebands = input.sidebands.map((entry, index) => normalizeSideband(entry, index, context)).sort((left, right) => compareRaw(left.id, right.id));
    uniqueBy(sidebands, 'id', 'COMPOSE_SIDEBAND_DUPLICATE', 'sideband');
  }
  context.sidebandsDeclared = sidebandsDeclared;
  context.sidebands = sidebands;
  context.sidebandById = new Map(sidebands.map((entry) => [entry.id, entry]));

  const operations = input.operations.map((entry, index) => normalizeOperation(entry, index, context)).sort((left, right) => compareRaw(left.id, right.id));`,
  'normalize sidebands before operations');
replaceOnce(programPath,
`  const normalized = { schema: input.schema, representation: input.representation, status: input.status, contract: normalizeCatalogContract(input.contract, inspected), id: input.id, version: input.version, semanticEngine, generator, sourceUnits, functions, programUnits, publicRequirements, resources, operations, manifests, provenance, compatibility, deletion };`,
`  const normalized = {
    schema: input.schema, representation: input.representation, status: input.status, contract: normalizeCatalogContract(input.contract, inspected), id: input.id, version: input.version,
    semanticEngine, generator, sourceUnits, functions, programUnits, publicRequirements, resources,
    ...(sidebandsDeclared ? { sidebands } : {}),
    operations, manifests, provenance, compatibility, deletion,
  };`,
  'normalized sidebands');
replaceOnce(programPath,
`    resources: profile.resources.map((entry) => ({ ...entry, memorySpaces: [...entry.memorySpaces], access: [...entry.access] })),
    operations: profile.operations.map((entry) => ({ ...entry, bindings: structuredClone(entry.bindings), grid: [...entry.grid], block: [...entry.block],  })),`,
`    resources: profile.resources.map((entry) => ({ ...entry, memorySpaces: [...entry.memorySpaces], access: [...entry.access] })),
    ...(Object.hasOwn(profile, 'sidebands') ? { sidebands: profile.sidebands.map((entry) => structuredClone(entry)) } : {}),
    operations: profile.operations.map((entry) => ({ ...entry, bindings: structuredClone(entry.bindings), grid: [...entry.grid], block: [...entry.block],  })),`,
  'search program sidebands');

replaceOnce(programPath,
`  const records = input.records.map((record, index) => {
    exactKeys(record, ['owner', 'sourceUnits', 'functions', 'resources', 'publicRequirements', 'packageRecords'], 'COMPOSE_DELETION_RECORD_FIELDS', \`deletion record \${index}\`);
    if (!context.semanticOwners.has(record.owner)) fail('COMPOSE_DELETION_OWNER', \`deletion record \${record.owner} is not selected\`);
    const normalized = { owner: record.owner };
    for (const key of ['sourceUnits', 'functions', 'resources', 'publicRequirements', 'packageRecords']) {`,
`  const records = input.records.map((record, index) => {
    const recordFields = ['owner', 'sourceUnits', 'functions', 'resources', 'publicRequirements', 'packageRecords'];
    if (context.sidebandsDeclared) recordFields.splice(recordFields.indexOf('packageRecords'), 0, 'sidebands');
    exactKeys(record, recordFields, 'COMPOSE_DELETION_RECORD_FIELDS', \`deletion record \${index}\`);
    if (!context.semanticOwners.has(record.owner)) fail('COMPOSE_DELETION_OWNER', \`deletion record \${record.owner} is not selected\`);
    const normalized = { owner: record.owner };
    const recordLists = ['sourceUnits', 'functions', 'resources', 'publicRequirements', 'packageRecords'];
    if (context.sidebandsDeclared) recordLists.splice(recordLists.indexOf('packageRecords'), 0, 'sidebands');
    for (const key of recordLists) {`,
  'deletion sideband fields');
replaceOnce(programPath,
`  const coverage = new Map([['sourceUnits', context.sourceUnits.map(({ id }) => id)], ['functions', context.functions.map(({ name }) => name)], ['resources', context.resources.map(({ id }) => id)], ['publicRequirements', context.publicRequirements.map(({ contract }) => contract.id)]]);`,
`  const coverage = new Map([['sourceUnits', context.sourceUnits.map(({ id }) => id)], ['functions', context.functions.map(({ name }) => name)], ['resources', context.resources.map(({ id }) => id)], ['publicRequirements', context.publicRequirements.map(({ contract }) => contract.id)]]);
  if (context.sidebandsDeclared) coverage.set('sidebands', context.sidebands.map(({ id }) => id));`,
  'deletion sideband coverage');
replaceOnce(programPath,
`    const expectedRequirements = context.publicRequirements.filter(({ consumers }) => consumers.includes(record.owner)).map(({ contract }) => contract.id).sort(compareRaw);
    const expectedPackageRecords = record.owner === context.compositionProfileId ? ['package.execution-operation'] : [];
    if (!same(record.sourceUnits, expectedSourceUnits) || !same(record.functions, expectedFunctions) || !same(record.resources, expectedResources)
        || !same(record.publicRequirements, expectedRequirements) || !same(record.packageRecords, expectedPackageRecords)) {`,
`    const expectedRequirements = context.publicRequirements.filter(({ consumers }) => consumers.includes(record.owner)).map(({ contract }) => contract.id).sort(compareRaw);
    const expectedSidebands = context.sidebands.filter(({ semanticOwner }) => semanticOwner === record.owner).map(({ id }) => id).sort(compareRaw);
    const expectedPackageRecords = record.owner === context.compositionProfileId ? ['package.execution-operation'] : [];
    if (!same(record.sourceUnits, expectedSourceUnits) || !same(record.functions, expectedFunctions) || !same(record.resources, expectedResources)
        || !same(record.publicRequirements, expectedRequirements) || (context.sidebandsDeclared && !same(record.sidebands, expectedSidebands)) || !same(record.packageRecords, expectedPackageRecords)) {`,
  'deletion sideband ownership');

replaceOnce(programPath,
`function buildCudaJsAdapterRequirements(program) {
  const resources = program.resources.filter(({ materialization }) => materialization === 'resident-storage');
  const resourceNames = new Map(resources.map((entry, index) => [entry.id, \`resource-\${index}\`]));`,
`function buildCudaJsAdapterRequirements(program) {
  const resources = program.resources.filter(({ materialization }) => materialization === 'resident-storage');
  const resourceNames = new Map(resources.map((entry, index) => [entry.id, \`resource-\${index}\`]));
  const sidebands = program.sidebands ?? [];
  const frameworkCancellation = sidebands.filter(({ role }) => role === 'framework-cancellation');
  if (frameworkCancellation.length !== 1) fail('COMPOSE_SIDEBAND_REQUIRED', 'runtime realization requires exactly one framework-cancellation sideband');
  if (!program.publicRequirements.some(({ contract }) => contract.id === 'cuda-js.publication-mailbox/0.1.0')) fail('COMPOSE_SIDEBAND_CAPABILITY', 'runtime realization requires the selected public publication capability');
  const sidebandNames = new Map(sidebands.map((entry, index) => [entry.id, \`sideband-\${index}\`]));`,
  'adapter sideband preflight');
replaceOnce(programPath,
`    bindings: entry.bindings.map((binding) => binding.source.kind === 'resource'
      ? { parameter: binding.parameter, source: { kind: 'resource', resource: resourceNames.get(binding.source.resource), access: binding.source.access } }
      : { parameter: binding.parameter, source: { kind: 'scalar', schema: { ...binding.source.schema } } }),`,
`    bindings: entry.bindings.map((binding) => {
      if (binding.source.kind === 'resource') return { parameter: binding.parameter, source: { kind: 'resource', resource: resourceNames.get(binding.source.resource), access: binding.source.access } };
      if (binding.source.kind === 'sideband') return { parameter: binding.parameter, source: { kind: 'sideband', sideband: sidebandNames.get(binding.source.sideband) } };
      return { parameter: binding.parameter, source: { kind: 'scalar', schema: { ...binding.source.schema } } };
    }),`,
  'adapter sideband bindings');
replaceOnce(programPath,
`    resourceRequirements: resources.map((entry, index) => ({ id: \`resource-\${index}\`, byteLength: entry.capacity, alignment: entry.alignment, memorySpaces: [...entry.memorySpaces], accessRequirements: [...entry.access] })),
    operationRequirements: operations,`,
`    resourceRequirements: resources.map((entry, index) => ({ id: \`resource-\${index}\`, byteLength: entry.capacity, alignment: entry.alignment, memorySpaces: [...entry.memorySpaces], accessRequirements: [...entry.access] })),
    sidebandRequirements: sidebands.map((entry, index) => ({
      id: \`sideband-\${index}\`, semanticOwner: entry.semanticOwner, role: entry.role, direction: entry.direction, valueType: entry.valueType,
      capacity: entry.capacity, publication: entry.publication, applicationPoint: { ...entry.applicationPoint }, lifetime: entry.lifetime,
      payloadResource: entry.payloadResource === null ? null : resourceNames.get(entry.payloadResource), semantics: { ...entry.semantics }, cleanup: { ...entry.cleanup },
    })),
    operationRequirements: operations,`,
  'adapter sideband requirements');

replaceOnce(fixturePath,
`function publicRequirements(context, profileId) {
  const requirements = new Map();
  const add = (reference, consumers, qualification) => {
    const prior = requirements.get(reference.id);
    if (!prior) requirements.set(reference.id, { contract: { ...reference }, consumers: new Set(consumers), qualification });
    else for (const consumer of consumers) prior.consumers.add(consumer);
  };
  const deviceJs = schemaReference('cuda-js.device-js');
  const operation = schemaReference('cuda-js.operation-lifecycle');
  add(deviceJs, [profileId], 'portable'); add(operation, [profileId], 'native-compatible-pair');
  if (context.stageResult) {
    for (const requirement of context.stageResult.normalized.programContribution.requirements) add(requirement, [context.stageResult.normalized.id, ...context.stageResult.normalized.capabilities.map(({ id }) => id)], 'native-compatible-pair');
  }
  if (context.channelResult) {
    for (const requirement of context.channelResult.normalized.programContribution.requirements) add(requirement, [context.channelResult.normalized.id, ...context.channelResult.normalized.channels.map(({ id }) => id)], 'native-compatible-pair');
  }
  return [...requirements.values()].map((entry) => ({ contract: entry.contract, consumers: [...entry.consumers].sort(compareRaw), qualification: entry.qualification })).sort((left, right) => compareRaw(left.contract.id, right.contract.id));
}`,
`function publicRequirements(context, profileId) {
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
}`,
  'fixture generic requirement closure');

replaceOnce(fixturePath,
`function deletionManifest(profileId, semanticOwners, sourceUnits, functions, resources, requirements) {`,
`function sessionPayloadResource(context, resources) {
  if (!context.sessionResult) return null;
  const resource = context.resourceResult.normalized;
  const sessionProfile = context.sessionResult.normalized.resourceContribution;
  const contributor = resource.contributors?.find(({ profile }) => profile?.id === sessionProfile?.id);
  if (!contributor) throw new Error('selected Session resource contribution is absent from Resource');
  const classes = resource.classes?.filter(({ contributor: owner, lifetime }) => owner === contributor.id && lifetime === 'session') ?? [];
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
    id: \`sideband.\${label}.framework-cancellation\`,
    semanticOwner: context.progressResult.normalized.id,
    role: 'framework-cancellation',
    direction: 'host-to-device',
    valueType: 'u32',
    capacity: '1',
    publication: 'release-acquire',
    applicationPoint: schemaReference('cuda-mcgs.framework-cancellation-checkpoint'),
    lifetime: 'operation',
    payloadResource: null,
    semantics: schemaReference('cuda-mcgs.framework-cancellation-sideband'),
    cleanup: schemaReference('cuda-mcgs.framework-cancellation-sideband-cleanup'),
  }];
  if (context.sessionResult) sidebands.push({
    id: \`sideband.\${label}.session-command-publication\`,
    semanticOwner: context.sessionResult.normalized.id,
    role: 'session-command-publication',
    direction: 'host-to-device',
    valueType: 'u32',
    capacity: '1',
    publication: 'release-acquire',
    applicationPoint: schemaReference('cuda-mcgs.session-command-publication-checkpoint'),
    lifetime: 'session',
    payloadResource: sessionPayloadResource(context, resources),
    semantics: schemaReference('cuda-mcgs.session-command-publication-sideband'),
    cleanup: schemaReference('cuda-mcgs.session-command-publication-sideband-cleanup'),
  });
  return sidebands;
}

function deletionManifest(profileId, semanticOwners, sourceUnits, functions, resources, requirements, sidebands) {`,
  'fixture sideband projection');
replaceOnce(fixturePath,
`    publicRequirements: requirements.filter(({ consumers }) => consumers.includes(owner)).map(({ contract }) => contract.id),
    packageRecords: owner === profileId ? ['package.execution-operation'] : [],`,
`    publicRequirements: requirements.filter(({ consumers }) => consumers.includes(owner)).map(({ contract }) => contract.id),
    sidebands: sidebands.filter(({ semanticOwner }) => semanticOwner === owner).map(({ id }) => id),
    packageRecords: owner === profileId ? ['package.execution-operation'] : [],`,
  'fixture deletion sidebands');
replaceOnce(fixturePath,
`export function buildProgramPackageProfile(inspected, context, label) {
  const profileId = \`program-package.\${label}\`;
  const profiles = context.profileResults.map(profileReference).sort((left, right) => compareRaw(left.id, right.id));
  const source = sourceAndFunctions(context, profileId, label);
  const requirements = publicRequirements(context, profileId);
  const resources = resourceRequirements(context);`,
`export function buildProgramPackageProfile(inspected, context, label) {
  const profileId = \`program-package.\${label}\`;
  const profiles = context.profileResults.map(profileReference).sort((left, right) => compareRaw(left.id, right.id));
  const requirements = publicRequirements(context, profileId);
  const resources = resourceRequirements(context);
  const sidebands = sidebandRequirements(context, label, resources);
  const source = sourceAndFunctions(context, profileId, label, sidebands);`,
  'fixture build order');
replaceOnce(fixturePath,
`function sourceAndFunctions(context, profileId, label) {`,
`function sourceAndFunctions(context, profileId, label, sidebands = []) {`,
  'source sideband input');
replaceOnce(fixturePath,
`  const entrySource = 'function engine_step(output) { output[gpu.thread.globalX()] = 0; }\\n';
  const entryUnitId = \`source.\${label}.engine-entry\`;
  sourceUnits.push({ id: entryUnitId, ownerProfile: profileId, semanticOwner: profileId, kind: 'composer-entry', source: entrySource, sourceIdentity: sourceIdentity(entrySource), contributionIdentity: contentIdentity(\`\${label}:composer-entry-contribution\`), functions: ['engine_step'], provenance: provenance(\`\${label}-composer-entry\`) });
  functions.push({ name: 'engine_step', executionRole: 'runtime-entry', parameters: [{ name: 'output', type: 'ptr<u32>' }], returns: 'void', sourceUnit: entryUnitId, ownerProfile: profileId, semanticRole: 'engine.execute', calls: [], helpers: ['gpu.thread.global-x'] });`,
`  const sidebandParameters = sidebands.map((sideband) => ({
    name: sideband.role === 'framework-cancellation' ? 'frameworkCancellation' : 'sessionCommandPublication',
    type: \`sideband<\${sideband.direction},\${sideband.valueType}>\`,
  }));
  const parameterList = ['output', ...sidebandParameters.map(({ name }) => name)].join(', ');
  const observations = sidebandParameters.map(({ name }) => \`gpu.mailbox.loadAcquireSystem(\${name});\`).join(' ');
  const entrySource = \`function engine_step(\${parameterList}) { \${observations} output[gpu.thread.globalX()] = 0; }\\n\`;
  const entryUnitId = \`source.\${label}.engine-entry\`;
  sourceUnits.push({ id: entryUnitId, ownerProfile: profileId, semanticOwner: profileId, kind: 'composer-entry', source: entrySource, sourceIdentity: sourceIdentity(entrySource), contributionIdentity: contentIdentity(\`\${label}:composer-entry-contribution\`), functions: ['engine_step'], provenance: provenance(\`\${label}-composer-entry\`) });
  functions.push({ name: 'engine_step', executionRole: 'runtime-entry', parameters: [{ name: 'output', type: 'ptr<u32>' }, ...sidebandParameters], returns: 'void', sourceUnit: entryUnitId, ownerProfile: profileId, semanticRole: 'engine.execute', calls: [], helpers: ['gpu.thread.global-x', 'gpu.mailbox.load-acquire-system'] });`,
  'entry sideband parameters and observation');
replaceOnce(fixturePath,
`    sourceUnits: source.sourceUnits, functions: source.functions, programUnits: source.programUnits, publicRequirements: requirements, resources,
    operations: [{ id: \`operation.\${label}.engine-step\`, entryPoint: 'engine_step', bindings: [{ parameter: 'output', source: { kind: 'resource', resource: outputResource.id, access: 'write' } }], grid: ['1', '1', '1'], block: ['64', '1', '1'], dynamicSharedBytes: '0', maxPending: '1' }],`,
`    sourceUnits: source.sourceUnits, functions: source.functions, programUnits: source.programUnits, publicRequirements: requirements, resources, sidebands,
    operations: [{
      id: \`operation.\${label}.engine-step\`, entryPoint: 'engine_step',
      bindings: [
        { parameter: 'output', source: { kind: 'resource', resource: outputResource.id, access: 'write' } },
        ...sidebands.map((sideband) => ({ parameter: sideband.role === 'framework-cancellation' ? 'frameworkCancellation' : 'sessionCommandPublication', source: { kind: 'sideband', sideband: sideband.id } })),
      ],
      grid: ['1', '1', '1'], block: ['64', '1', '1'], dynamicSharedBytes: '0', maxPending: '1',
    }],`,
  'fixture operation sideband bindings');
replaceOnce(fixturePath,
`    deletion: deletionManifest(profileId, semanticOwners, source.sourceUnits, source.functions, resources, requirements),`,
`    deletion: deletionManifest(profileId, semanticOwners, source.sourceUnits, source.functions, resources, requirements, sidebands),`,
  'fixture deletion call');

// Schema evolution is additive: sideband fields are optional structurally so frozen historical 0.2.0 evidence remains schema-valid.
const profileSchemaPath = 'schemas/search-ir/0.2.0/program-package-profile.schema.json';
const profileSchema = JSON.parse(read(profileSchemaPath));
profileSchema.properties.sidebands = { type: 'array', minItems: 1, items: { $ref: '#/$defs/sideband' } };
for (const type of ['sideband<host-to-device,u32>', 'sideband<device-to-host,u32>']) if (!profileSchema.$defs.parameter.properties.type.enum.includes(type)) profileSchema.$defs.parameter.properties.type.enum.push(type);
profileSchema.$defs.sideband = {
  type: 'object', additionalProperties: false,
  required: ['id', 'semanticOwner', 'role', 'direction', 'valueType', 'capacity', 'publication', 'applicationPoint', 'lifetime', 'payloadResource', 'semantics', 'cleanup'],
  properties: {
    id: { $ref: 'primitives.schema.json#/$defs/namespacedId' },
    semanticOwner: { $ref: 'primitives.schema.json#/$defs/namespacedId' },
    role: { type: 'string', pattern: '^[a-z][a-z0-9-]*$' },
    direction: { enum: ['host-to-device', 'device-to-host'] },
    valueType: { const: 'u32' },
    capacity: { $ref: 'primitives.schema.json#/$defs/decimalUint' },
    publication: { const: 'release-acquire' },
    applicationPoint: { $ref: 'primitives.schema.json#/$defs/schemaReference' },
    lifetime: { enum: ['operation', 'session'] },
    payloadResource: { oneOf: [{ type: 'null' }, { $ref: 'primitives.schema.json#/$defs/namespacedId' }] },
    semantics: { $ref: 'primitives.schema.json#/$defs/schemaReference' },
    cleanup: { $ref: 'primitives.schema.json#/$defs/schemaReference' },
  },
};
const profileBindingAlternatives = profileSchema.$defs.binding.properties.source.oneOf;
if (!hasConst(profileBindingAlternatives, 'sideband')) profileBindingAlternatives.push({
  type: 'object', additionalProperties: false, required: ['kind', 'sideband'],
  properties: { kind: { const: 'sideband' }, sideband: { $ref: 'primitives.schema.json#/$defs/namespacedId' } },
});
const deletionRecord = profileSchema.$defs.deletion.properties.records.items;
delectionRecord.properties.sidebands = { type: 'array', items: { $ref: 'primitives.schema.json#/$defs/namespacedId' } };
writeJson(profileSchemaPath, profileSchema);

const searchProgramPath = 'schemas/search-ir/0.2.0/search-program.schema.json';
const searchProgramSchema = JSON.parse(read(searchProgramPath));
searchProgramSchema.properties.sidebands = { type: 'array', minItems: 1, items: { $ref: 'program-package-profile.schema.json#/$defs/sideband' } };
writeJson(searchProgramPath, searchProgramSchema);

const executionPath = 'schemas/search-ir/0.2.0/execution-package.schema.json';
const executionSchema = JSON.parse(read(executionPath));
executionSchema.properties.cudaJsAdapter.properties.sidebandRequirements = { type: 'array', minItems: 1, items: { $ref: '#/$defs/sidebandRequirement' } };
executionSchema.$defs.sidebandRequirement = {
  type: 'object', additionalProperties: false,
  required: ['id', 'semanticOwner', 'role', 'direction', 'valueType', 'capacity', 'publication', 'applicationPoint', 'lifetime', 'payloadResource', 'semantics', 'cleanup'],
  properties: {
    id: { type: 'string', pattern: '^sideband-[0-9]+$' },
    semanticOwner: { $ref: 'primitives.schema.json#/$defs/namespacedId' },
    role: { type: 'string', pattern: '^[a-z][a-z0-9-]*$' },
    direction: { enum: ['host-to-device', 'device-to-host'] },
    valueType: { const: 'u32' },
    capacity: { $ref: 'primitives.schema.json#/$defs/decimalUint' },
    publication: { const: 'release-acquire' },
    applicationPoint: { $ref: 'primitives.schema.json#/$defs/schemaReference' },
    lifetime: { enum: ['operation', 'session'] },
    payloadResource: { oneOf: [{ type: 'null' }, { type: 'string', pattern: '^resource-[0-9]+$' }] },
    semantics: { $ref: 'primitives.schema.json#/$defs/schemaReference' },
    cleanup: { $ref: 'primitives.schema.json#/$defs/schemaReference' },
  },
};
const publicBindingAlternatives = executionSchema.$defs.publicBinding.properties.source.oneOf;
if (!hasConst(publicBindingAlternatives, 'sideband')) publicBindingAlternatives.push({
  type: 'object', additionalProperties: false, required: ['kind', 'sideband'],
  properties: { kind: { const: 'sideband' }, sideband: { type: 'string', pattern: '^sideband-[0-9]+$' } },
});
writeJson(executionPath, executionSchema);

// Strengthen the permanent verifier from the original five-fact red into current accepted representation checks.
let verifier = read(verifierPath);
verifier = verifier.replace("const resourceResult = profile('resource.sideband-authority', 'cuda-mcgs.resource-profile/0.2.0', '1', {\n    providerRequirements: [{", "const sessionResourceProfile = { id: 'resource-owner.sideband-session', schema: schemaReference('cuda-mcgs.synthetic-sideband-session-resource-profile'), identity: digest('a') };\n  const resourceResult = profile('resource.sideband-authority', 'cuda-mcgs.resource-profile/0.2.0', '1', {\n    contributors: [{ id: 'resource-contributor.sideband-session', profile: sessionResourceProfile }],\n    classes: [{ id: 'resource-class.sideband-session-control', contributor: 'resource-contributor.sideband-session', lifetime: 'session' }],\n    partitions: [{ id: 'resource-partition.sideband-session-control', class: 'resource-class.sideband-session-control', pool: 'resource-pool.sideband-session-control' }],\n    pools: [{ id: 'resource-pool.sideband-session-control', providerRequirement: 'provider.sideband-authority.output' }],\n    providerRequirements: [{");
verifier = verifier.replace("const sessionResult = profile('session.sideband-authority', 'cuda-mcgs.session-profile/0.2.0', '6', {\n  programContribution:", "const sessionResult = profile('session.sideband-authority', 'cuda-mcgs.session-profile/0.2.0', '6', {\n  resourceContribution: { id: 'resource-owner.sideband-session', schema: schemaReference('cuda-mcgs.synthetic-sideband-session-resource-profile'), identity: digest('a') },\n  counters: [{ id: 'session-counter.sideband-authority.command', kind: 'command', maximum: '340282366920938463463374607431768211455' }],\n  commands: { inputs: ['advance', 'reroot', 'attention', 'cancellation', 'observation-request'].map((kind) => ({ kind })) },\n  programContribution:");
verifier = verifier.replace("const sessionSignal = selectedSession.sidebands?.find((entry) => entry.role === 'session-command-generation');", "const sessionSignal = selectedSession.sidebands?.find((entry) => entry.role === 'session-command-publication');");
verifier = verifier.replace("if (findings.length > 0) console.error", `const publicationRequirement = 'cuda-js.publication-mailbox/0.1.0';
if (!base.publicRequirements.some(({ contract }) => contract.id === publicationRequirement)) findings.push('base-cancellation-publication-requirement=missing');
if (baseCancellation?.direction !== 'host-to-device' || baseCancellation?.valueType !== 'u32' || baseCancellation?.payloadResource !== null) findings.push('base-cancellation-shape=invalid');
if (sessionSignal?.direction !== 'host-to-device' || sessionSignal?.valueType !== 'u32' || typeof sessionSignal?.payloadResource !== 'string') findings.push('selected-session-publication-shape=invalid');
const commandCounter = sessionResult.normalized.counters.find(({ kind }) => kind === 'command');
if (commandCounter?.maximum !== '340282366920938463463374607431768211455') findings.push('selected-session-command-identity-width=narrowed');
if (Object.hasOwn(sessionSignal ?? {}, 'generation') || Object.hasOwn(sessionSignal ?? {}, 'commandIdentity')) findings.push('selected-session-publication-became-command-identity');
if (new Set(sessionResult.normalized.commands.inputs.map(({ kind }) => kind)).size !== 5) findings.push('selected-session-operation-separation=collapsed');
if (base.sidebands?.some(({ role }) => role === 'session-command-publication')) findings.push('session-absence-residue=present');

if (findings.length > 0) console.error`);
verifier = verifier.replace("console.log('external_control_sideband=pass base_cancellation=declared-and-bound session_requirement=closed session_command_generation=declared-and-bound inference=forbidden');", "console.log('external_control_sideband=pass base_cancellation=declared-bound-and-capable session_requirement=closed session_publication=declared-bound-payload-related session_command_identity=128-bit operation_separation=preserved deletion=zero-residue inference=forbidden');");
if (verifier.includes("session-command-generation'))")) throw new Error('verifier role replacement incomplete');
write(verifierPath, verifier);

console.log('dev_202_green_patch=applied');

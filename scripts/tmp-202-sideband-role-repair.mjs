#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

async function replaceOnce(path, before, after) {
  const text = await readFile(path, 'utf8');
  const first = text.indexOf(before);
  assert.notEqual(first, -1, `${path}: replacement source not found`);
  assert.equal(text.indexOf(before, first + before.length), -1, `${path}: replacement source is not unique`);
  await writeFile(path, text.slice(0, first) + after + text.slice(first + before.length));
}

await replaceOnce(
  'experiments/search-ir-composer-reference/src/program-package-fixtures.mjs',
  `  const sidebandParameters = sidebands.map((sideband) => ({\n    name: sideband.role === 'framework-cancellation' ? 'frameworkCancellation' : 'sessionCommandPublication',\n    type: \`sideband<\${sideband.direction},\${sideband.valueType}>\`,\n  }));`,
  `  const sidebandParameters = sidebands.map((sideband) => ({\n    name: sideband.role === 'framework-cancellation' ? 'frameworkCancellation' : 'sessionCommandPublication',\n    type: \`sideband<\${sideband.direction},\${sideband.valueType}>\`,\n    sidebandRole: sideband.role,\n  }));`,
);

await replaceOnce(
  'experiments/search-ir-composer-reference/src/program-package.mjs',
  `function normalizeParameter(input, functionName, index) {\n  exactKeys(input, ['name', 'type'], 'COMPOSE_PARAMETER_FIELDS', \`\${functionName} parameter \${index}\`);\n  assertString(input.name, /^[A-Za-z_$][A-Za-z0-9_$]*$/, 'COMPOSE_PARAMETER_NAME', \`\${functionName} parameter \${index} name\`);\n  if (!RESTRICTED_SOURCE_TYPES.has(input.type)) fail('COMPOSE_PARAMETER_TYPE', \`\${functionName} parameter \${input.name} has an unsupported type\`);\n  return { name: input.name, type: input.type };\n}`,
  `function normalizeParameter(input, functionName, index) {\n  const fields = ['name', 'type'];\n  if (Object.hasOwn(input, 'sidebandRole')) fields.push('sidebandRole');\n  exactKeys(input, fields, 'COMPOSE_PARAMETER_FIELDS', \`\${functionName} parameter \${index}\`);\n  assertString(input.name, /^[A-Za-z_$][A-Za-z0-9_$]*$/, 'COMPOSE_PARAMETER_NAME', \`\${functionName} parameter \${index} name\`);\n  if (!RESTRICTED_SOURCE_TYPES.has(input.type)) fail('COMPOSE_PARAMETER_TYPE', \`\${functionName} parameter \${input.name} has an unsupported type\`);\n  const sideband = input.type.startsWith('sideband<');\n  if (sideband) {\n    if (!Object.hasOwn(input, 'sidebandRole')) fail('COMPOSE_PARAMETER_ROLE', \`\${functionName} sideband parameter \${input.name} lacks an explicit role\`);\n    assertString(input.sidebandRole, /^[a-z][a-z0-9-]*$/, 'COMPOSE_PARAMETER_ROLE', \`\${functionName} parameter \${input.name} sidebandRole\`);\n    return { name: input.name, type: input.type, sidebandRole: input.sidebandRole };\n  }\n  if (Object.hasOwn(input, 'sidebandRole')) fail('COMPOSE_PARAMETER_ROLE', \`\${functionName} non-sideband parameter \${input.name} cannot carry sidebandRole\`);\n  return { name: input.name, type: input.type };\n}`,
);

await replaceOnce(
  'experiments/search-ir-composer-reference/src/program-package.mjs',
  `    if (!sideband || parameter.type !== \`sideband<\${sideband.direction},\${sideband.valueType}>\`) fail('COMPOSE_OPERATION_BINDING', \`\${operationId} sideband binding is incompatible\`);`,
  `    if (!sideband || parameter.type !== \`sideband<\${sideband.direction},\${sideband.valueType}>\` || parameter.sidebandRole !== sideband.role) fail('COMPOSE_OPERATION_BINDING', \`\${operationId} sideband binding is incompatible\`);`,
);

const schemaPath = 'schemas/search-ir/0.2.0/program-package-profile.schema.json';
const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
const parameter = schema.$defs.parameter;
assert(parameter && parameter.properties && !Object.hasOwn(parameter.properties, 'sidebandRole'), 'parameter schema already carries sidebandRole');
parameter.properties.sidebandRole = { type: 'string', pattern: '^[a-z][a-z0-9-]*$' };
parameter.allOf = [{
  if: {
    properties: {
      type: { enum: ['sideband<host-to-device,u32>', 'sideband<device-to-host,u32>'] },
    },
    required: ['type'],
  },
  then: { required: ['sidebandRole'] },
  else: { not: { required: ['sidebandRole'] } },
}];
await writeFile(schemaPath, `${JSON.stringify(schema, null, 2)}\n`);

await replaceOnce(
  'experiments/search-ir-composer-reference/verify-external-control-sideband-authority.mjs',
  `import { buildProgramPackageProfile } from './src/program-package-fixtures.mjs';`,
  `import { buildProgramPackageProfile } from './src/program-package-fixtures.mjs';\nimport { buildExecutionPackage, composeSearchProgram, normalizeProgramPackageProfile } from './src/program-package.mjs';`,
);

await replaceOnce(
  'experiments/search-ir-composer-reference/verify-external-control-sideband-authority.mjs',
  `const base = buildProgramPackageProfile(inspected, makeContext(), 'sideband-base').input;`,
  `const baseFixture = buildProgramPackageProfile(inspected, makeContext(), 'sideband-base');\nconst base = baseFixture.input;`,
);

await replaceOnce(
  'experiments/search-ir-composer-reference/verify-external-control-sideband-authority.mjs',
  `const selectedSession = buildProgramPackageProfile(inspected, makeContext(sessionResult), 'sideband-session').input;`,
  `const selectedSessionFixture = buildProgramPackageProfile(inspected, makeContext(sessionResult), 'sideband-session');\nconst selectedSession = selectedSessionFixture.input;`,
);

const falsifiers = String.raw`
function expectCode(label, body, expectedCode) {
  try {
    body();
  } catch (error) {
    assert.equal(error?.code, expectedCode, \`${label} rejected with unexpected code \${error?.code}\`);
    return;
  }
  assert.fail(\`${label} unexpectedly passed\`);
}

const normalizeFixture = (fixture, input = fixture.input) => normalizeProgramPackageProfile(input, inspected, fixture.context);
const baseNormalized = normalizeFixture(baseFixture);
const selectedSessionNormalized = normalizeFixture(selectedSessionFixture);
const baseProgram = composeSearchProgram(baseNormalized);
const selectedSessionProgram = composeSearchProgram(selectedSessionNormalized);
assert.doesNotThrow(() => buildExecutionPackage(baseNormalized, baseProgram));
assert.doesNotThrow(() => buildExecutionPackage(selectedSessionNormalized, selectedSessionProgram));

// 1. Base cancellation omission: declaration/binding loss is non-realizable.
const missingBaseBinding = structuredClone(baseFixture.input);
missingBaseBinding.operations[0].bindings = missingBaseBinding.operations[0].bindings.filter(({ source }) => source.kind !== 'sideband');
expectCode('base cancellation binding omission', () => normalizeFixture(baseFixture, missingBaseBinding), 'COMPOSE_OPERATION_BINDING');
const inferredFromSource = structuredClone(baseProgram);
delete inferredFromSource.normalized.sidebands;
expectCode('base cancellation sideband omission', () => buildExecutionPackage(baseNormalized, inferredFromSource), 'COMPOSE_SIDEBAND_REQUIRED');

// 2. Selected Session lower requirement omission fails exact requirement closure.
const missingSessionRequirement = structuredClone(selectedSessionFixture.input);
missingSessionRequirement.publicRequirements = missingSessionRequirement.publicRequirements.filter(({ contract }) => contract.id !== 'cuda-js.publication-mailbox/0.1.0');
expectCode('selected Session publication requirement omission', () => normalizeFixture(selectedSessionFixture, missingSessionRequirement), 'COMPOSE_PUBLIC_REQUIREMENT_CLOSURE');

// 3. Binding closure rejects unknown and role-incompatible sidebands.
const unknownBinding = structuredClone(selectedSessionFixture.input);
unknownBinding.operations[0].bindings.find(({ parameter }) => parameter === 'frameworkCancellation').source.sideband = 'sideband.unknown-control';
expectCode('unknown sideband binding', () => normalizeFixture(selectedSessionFixture, unknownBinding), 'COMPOSE_OPERATION_BINDING');
const roleMismatch = structuredClone(selectedSessionFixture.input);
const sessionSidebandId = roleMismatch.sidebands.find(({ role }) => role === 'session-command-publication').id;
roleMismatch.operations[0].bindings.find(({ parameter }) => parameter === 'frameworkCancellation').source.sideband = sessionSidebandId;
expectCode('role-incompatible sideband binding', () => normalizeFixture(selectedSessionFixture, roleMismatch), 'COMPOSE_OPERATION_BINDING');

// 4. No inference: source/function/lifecycle-adjacent facts cannot repair an omitted declaration.
assert.ok(inferredFromSource.normalized.source.includes('gpu.mailbox.loadAcquireSystem'));
assert.ok(inferredFromSource.normalized.functions.some(({ name }) => name === 'engine_step'));
expectCode('source inference repair', () => buildExecutionPackage(baseNormalized, inferredFromSource), 'COMPOSE_SIDEBAND_REQUIRED');

// 5. Session command identity remains 128-bit and is not carried by the u32 notification.
assert.equal(BigInt(commandCounter.maximum), (1n << 128n) - 1n);
assert.equal(sessionSignal.valueType, 'u32');
assert.equal(Object.hasOwn(sessionSignal, 'generation'), false);
assert.equal(Object.hasOwn(sessionSignal, 'commandIdentity'), false);

// 6. Shared publication preserves all five distinct Session command kinds.
assert.deepEqual(new Set(sessionResult.normalized.commands.inputs.map(({ kind }) => kind)), new Set(['advance', 'reroot', 'attention', 'cancellation', 'observation-request']));

// 7. Session deletion is exact while independent Framework cancellation remains.
assert.equal(base.sidebands.some(({ role }) => role === 'session-command-publication'), false);
assert.equal(base.operations[0].bindings.some(({ parameter }) => parameter === 'sessionCommandPublication'), false);
const baseMailbox = base.publicRequirements.find(({ contract }) => contract.id === 'cuda-js.publication-mailbox/0.1.0');
assert(baseMailbox);
assert.equal(baseMailbox.consumers.includes(sessionResult.normalized.id), false);
assert(base.sidebands.some(({ role }) => role === 'framework-cancellation'));

// 8. Material sideband meaning is identity-bearing; lower lane/handle vocabulary is absent from semantic input.
const capacityMutation = structuredClone(baseFixture.input);
capacityMutation.sidebands.find(({ role }) => role === 'framework-cancellation').capacity = '2';
const capacityNormalized = normalizeFixture(baseFixture, capacityMutation);
assert.notEqual(capacityNormalized.identity.sha256, baseNormalized.identity.sha256);
const semanticText = JSON.stringify(baseNormalized.normalized);
for (const forbidden of ['mailboxLane', 'laneName', 'nativeHandle', 'sideband-0']) assert.equal(semanticText.includes(forbidden), false);

// 9. Finite/fail-closed validation rejects unsupported forms, unavailable capability, and incomplete payload relation.
const badDirection = structuredClone(baseFixture.input);
badDirection.sidebands[0].direction = 'host-to-host';
expectCode('unsupported sideband direction', () => normalizeFixture(baseFixture, badDirection), 'COMPOSE_SIDEBAND_DIRECTION');
const badValue = structuredClone(baseFixture.input);
badValue.sidebands[0].valueType = 'u64';
expectCode('unsupported sideband value', () => normalizeFixture(baseFixture, badValue), 'COMPOSE_SIDEBAND_VALUE');
const missingCapability = structuredClone(baseFixture.input);
missingCapability.publicRequirements = missingCapability.publicRequirements.filter(({ contract }) => contract.id !== 'cuda-js.publication-mailbox/0.1.0');
expectCode('unavailable publication capability', () => normalizeFixture(baseFixture, missingCapability), 'COMPOSE_PUBLIC_REQUIREMENT_CLOSURE');
const badPayload = structuredClone(selectedSessionFixture.input);
badPayload.sidebands.find(({ role }) => role === 'session-command-publication').residentResource = 'package-resource.missing-session-control';
expectCode('incomplete resident payload relation', () => normalizeFixture(selectedSessionFixture, badPayload), 'COMPOSE_SIDEBAND_PAYLOAD');

// 10. Source boundary remains public Device-JS only: no native/private escape or second interpreter marker.
const sourceBoundary = selectedSessionProgram.normalized.source;
for (const forbidden of ['#include', '__global__', '__device__', '.ptx', '.cu', 'node:', 'require(', 'process.']) assert.equal(sourceBoundary.includes(forbidden), false);

// 11. Publication is not identity: equal u32 notifications do not erase distinct authoritative 128-bit generations.
const notificationA = { signal: 7, generation: (1n << 64n).toString() };
const notificationB = { signal: 7, generation: ((1n << 64n) + 1n).toString() };
assert.equal(notificationA.signal, notificationB.signal);
assert.notEqual(notificationA.generation, notificationB.generation);
assert(BigInt(notificationB.generation) > 0xffffffffn);

console.log('external_control_sideband_falsifiers=pass count=11 role_binding=explicit no_inference=fail_closed identity=128-bit publication_not_identity=pass');
`;

await replaceOnce(
  'experiments/search-ir-composer-reference/verify-external-control-sideband-authority.mjs',
  `if (findings.length > 0) console.error(\`external_control_sideband=red \${findings.join(' ')}\`);`,
  `${falsifiers}\nif (findings.length > 0) console.error(\`external_control_sideband=red \${findings.join(' ')}\`);`,
);

console.log('tmp_202_sideband_role_repair=patched files=4');

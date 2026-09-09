import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { normalizeProgramPackageProfile, composeSearchProgram, buildExecutionPackage } from '../../components/search-compiler/index.mjs';
import { createTensorEvaluatorOperationBindings } from '../../adapters/evaluators/cuda-js-tensor/index.mjs';
import { createTableInputOwnerFixture } from './resource-binding.mjs';
import { composedExecution, compositionFixture } from './operation-composition.mjs';
import { recordingPeer, initialInputs, prepare } from './runtime-composition.mjs';

// Adapt #265's selected-owner and payload falsifiers to #266's surviving public
// binding/ignition path; do not retain a second artifact admission API.
const { owners, resource, input, selections, pointers } = compositionFixture;
const baselineOwners = structuredClone([owners.evaluatorResult, resource]);
const bind = (subject) => createTensorEvaluatorOperationBindings(subject.runtime, subject.evaluator, subject.resource, subject.packageResources, subject.selections);
const cases = [];
for (const [id, code, mutate] of [
  ['missing-selection', 'TENSOR_EVALUATOR_INPUT_SELECTION', s => { s.selections = []; }],
  ['unknown-parameter', 'TENSOR_EVALUATOR_INPUT_SELECTION', s => { s.selections[0].parameter = 'features'; }],
  ['caller-placement', 'TENSOR_EVALUATOR_INPUT_SELECTION', s => { s.selections[0].byteOffset = '0'; }],
  ['unknown-artifact', 'TENSOR_EVALUATOR_INPUT_OWNER', s => { s.selections[0].artifact = 'evaluator.unknown'; }],
  ['mutable-artifact', 'TENSOR_EVALUATOR_INPUT_OWNER', s => { s.evaluator.normalized.artifacts[0].mutability = 'selected-mutable'; }],
  ['session-artifact', 'TENSOR_EVALUATOR_INPUT_OWNER', s => { s.evaluator.normalized.artifacts[0].scope = 'session'; }],
  ['late-residence', 'TENSOR_EVALUATOR_INPUT_OWNER', s => { s.evaluator.normalized.artifacts[0].residentBeforeIgnition = false; }],
  ['byte-bound', 'TENSOR_EVALUATOR_INPUT_LAYOUT', s => { s.evaluator.normalized.artifacts[0].maxBytes = '15'; }],
  ['element-bound', 'TENSOR_EVALUATOR_INPUT_LAYOUT', s => { s.evaluator.normalized.artifacts[0].maxElements = '3'; }],
  ['non-artifact-resource', 'TENSOR_EVALUATOR_INPUT_OWNER', s => { s.selections[0].resource = s.evaluator.normalized.resources.find(r => r.class !== 'artifact').id; }],
  ['alignment-drift', 'TENSOR_EVALUATOR_INPUT_LAYOUT', s => { s.evaluator.normalized.resources.find(r => r.id === s.selections[0].resource).alignment = '64'; }],
  ['resource-byte-drift', 'TENSOR_EVALUATOR_RESOURCE_BINDING_RESOURCE', s => { s.evaluator.normalized.resources.find(r => r.id === s.selections[0].resource).maximum = '32'; }],
  ['provider-access-drift', 'TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS', s => { s.packageResources.forEach(r => { r.access = ['write']; }); }],
  ['runtime-source-drift', 'TENSOR_EVALUATOR_RESOURCE_BINDING_IDENTITY', s => { s.runtime.device.source += '\n// drift'; }],
]) {
  const subject = { runtime: { ...owners.runtime, device: { ...owners.runtime.device } }, evaluator: structuredClone(owners.evaluatorResult), resource: structuredClone(resource), packageResources: structuredClone(input.resources), selections: structuredClone(selections) };
  mutate(subject);
  assert.throws(() => bind(subject), { code }, id);
  cases.push(id);
}
assert.deepEqual(bind({ runtime: owners.runtime, evaluator: owners.evaluatorResult, resource, packageResources: input.resources, selections }), pointers);
assert.deepEqual([owners.evaluatorResult, resource], baselineOwners, 'binding does not mutate selected owners');

const table = createTableInputOwnerFixture();
const tableResources = table.resourceResult.normalized.providerRequirements.map(provider => ({
  id: `resource.${provider.id}`, ownerProfile: table.resourceResult.normalized.id, providerRequirement: provider.id,
  materialization: provider.unit === 'bytes' && provider.memorySpaces.some(space => ['device-search', 'device-publication'].includes(space)) ? 'resident-storage' : 'semantic-only',
  unit: provider.unit, capacity: provider.capacity, alignment: provider.alignment, memorySpaces: provider.memorySpaces, access: provider.access,
}));
const tablePointers = createTensorEvaluatorOperationBindings(table.runtime, table.evaluatorResult, table.resourceResult, tableResources, [table.selection]);
const tableInput = tablePointers.bindings.find(b => b.parameter === 'lookupEntries');
assert(tableInput?.source.artifact);
assert.equal(tablePointers.bindings.some(b => b.parameter === 'weights'), false);
assert.equal(tableInput.source.artifact.artifactIdentity.sha256, table.evaluatorResult.normalized.artifacts[0].identity.sha256);
assert.notEqual(tablePointers.evaluatorIdentity.sha256, pointers.evaluatorIdentity.sha256);
cases.push('table-owner-and-renamed-parameter', 'deterministic-binding', 'selected-owners-unchanged');

const pkg = composedExecution.normalized;
const bindings = pkg.cudaJsAdapter.operationRequirements[0].bindings;
const artifact = bindings.find(({ source }) => source.initialContentSha256).source;
const zero = bindings.find(({ source }) => source.initialization === 'zero' && source.resource !== artifact.resource).source;
// #266 explicitly permits identical read-only references. Do not import #265's
// distinct-artifact restriction into this different, declared package profile.
const aliasInput = structuredClone(input);
const aliasEntry = aliasInput.functions.find(fn => fn.executionRole === 'runtime-entry');
aliasEntry.parameters.push({ name: 'secondImmutableRead', type: 'ptr<f32>' });
aliasInput.operations[0].bindings.push({ parameter: 'secondImmutableRead', source: structuredClone(aliasInput.operations[0].bindings.find(b => b.parameter === 'weights').source) });
const aliasSource = aliasInput.sourceUnits.find(unit => unit.id === aliasEntry.sourceUnit);
aliasSource.source = `function engine_step(${aliasEntry.parameters.map(p => p.name).join(', ')}) { gpu.mailbox.loadAcquireSystem(frameworkCancellation); output[gpu.thread.globalX()] = gpu.u32(0); }\n`;
aliasSource.sourceIdentity = { algorithm: 'sha256', sha256: createHash('sha256').update(aliasSource.source).digest('hex') };
aliasSource.contributionIdentity = aliasSource.sourceIdentity;
const aliasNormalized = normalizeProgramPackageProfile(aliasInput, owners.inspected, { ...compositionFixture.context, composerContributionIdentity: aliasSource.sourceIdentity });
const aliasPackage = buildExecutionPackage(aliasNormalized, composeSearchProgram(aliasNormalized)).normalized;
const aliasFake = recordingPeer();
const aliasExecution = await prepare(aliasPackage, aliasFake);
try {
  await aliasExecution.ignite(initialInputs(aliasPackage)); await aliasExecution.wait();
  assert.equal(aliasFake.calls.filter(([name]) => name === 'function.submit').length, 1);
} finally { assert.equal((await aliasExecution.close()).status, 'complete'); }
cases.push('identical-read-only-artifact-sharing');

const noLowerWrites = fake => assert.equal(fake.calls.filter(([name]) => name === 'memory.write' || name === 'function.submit').length, 0);
const shape = pkg.cudaJsAdapter.resourceRequirements.find(r => r.id === artifact.resource);

for (const [id, mutate] of [
  ['missing-payload', v => { delete v.resources[artifact.resource]; }],
  ['extra-payload', v => { v.resources['resource-999999'] = new Uint8Array(1); }],
  ['untyped-payload', v => { v.resources[artifact.resource] = Array.from(v.resources[artifact.resource]); }],
  ['shared-payload', v => { v.resources[artifact.resource] = new Uint8Array(new SharedArrayBuffer(Number(shape.byteLength))); }],
  ['short-payload', v => { v.resources[artifact.resource] = v.resources[artifact.resource].subarray(1); }],
  ['long-payload', v => { v.resources[artifact.resource] = new Uint8Array(Number(shape.byteLength) + 1); }],
  ['wrong-content', v => { v.resources[artifact.resource][Number(artifact.view.byteOffset)] ^= 1; }],
  ['nonzero-control-empty-iterator', v => {
    const bytes = v.resources[zero.resource]; bytes[Number(zero.view.byteOffset)] = 123;
    bytes[Symbol.iterator] = function* () {};
  }],
  ['spoofed-byte-length', v => {
    const bytes = new Uint8Array(Number(shape.byteLength) + 1);
    Object.defineProperty(bytes, 'byteLength', { value: Number(shape.byteLength) });
    v.resources[artifact.resource] = bytes;
  }],
  ['spoofed-shared-buffer', v => {
    const bytes = new Uint8Array(new SharedArrayBuffer(Number(shape.byteLength)));
    Object.defineProperty(bytes, 'buffer', { value: new ArrayBuffer(Number(shape.byteLength)) });
    v.resources[artifact.resource] = bytes;
  }],
]) {
  const fake = recordingPeer(); const execution = await prepare(pkg, fake);
  try {
    const value = initialInputs(pkg); mutate(value);
    await assert.rejects(() => execution.ignite(value), { code: 'CUDA_JS_ADAPTER_INPUT' }, id);
    noLowerWrites(fake);
    assert.equal((await execution.status()).state, 'prepared', `${id}: rejection leaves retryable preparation`);
    await execution.ignite(initialInputs(pkg)); await execution.wait();
    assert.equal(fake.calls.filter(([name]) => name === 'function.submit').length, 1);
  } finally { assert.equal((await execution.close()).status, 'complete'); }
  cases.push(id);
}

for (const mode of ['buffer-subrange', 'custom-iterator']) {
  const inputs = initialInputs(pkg);
  const expected = Object.values(inputs.resources).map(bytes => new Uint8Array(bytes));
  const originals = [];
  let iteratorCalls = 0;
  for (const [id, bytes] of Object.entries(inputs.resources)) {
    if (mode === 'buffer-subrange') {
      const backing = Buffer.concat([Buffer.from([99]), Buffer.from(bytes), Buffer.from([98])]);
      inputs.resources[id] = backing.subarray(1, backing.length - 1); originals.push(backing);
    } else {
      bytes[Symbol.iterator] = function* () { iteratorCalls += 1; throw new Error('caller iterator must not run'); };
      originals.push(bytes);
    }
  }
  const received = [];
  let first = true;
  const fake = recordingPeer({ beforeWrite: async bytes => {
    if (first) { first = false; originals.forEach(source => source.fill(77)); await Promise.resolve(); }
    received.push(new Uint8Array(bytes));
  } });
  const execution = await prepare(pkg, fake);
  try {
    await execution.ignite(inputs); await execution.wait();
    assert.equal(iteratorCalls, 0);
    assert.deepEqual(received, expected, `${mode}: actual uploaded snapshots match exact initial views`);
    const expectedDigest = createHash('sha256').update(owners.artifactPayload).digest('hex');
    assert.equal(artifact.initialContentSha256, expectedDigest);
  } finally { assert.equal((await execution.close()).status, 'complete'); }
  cases.push(mode);
}
console.log(JSON.stringify({ schema: 'cuda-mcgs.tensor-input-admission-consolidation-evidence/0.1.0', status: 'pass', node: process.version, cases, limits: ['host-admission-and-operation-bindings', 'synthetic-Tensor-table-fixture', 'no-native-or-device-residence-qualification'] }));

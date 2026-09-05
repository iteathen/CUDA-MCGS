import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { prepareCudaJsExecution } from '../../adapters/runtimes/cuda-js/index.mjs';
import { call, calls, clone, publicCudaJsFake } from '../cuda-js-runtime-adapter/src/fixture.mjs';
import {
  assertHostProtocol,
  buildExactCompatiblePairCapsule,
  executionBindings,
  expectedTerminalBytes,
  portableEvidenceIdentity,
} from './src/capsule.mjs';
import {
  assertExactSourcePair,
  assertPairExecutionEvidence,
  assertPublicCudaJsIdentity,
  assertRecorderTransaction,
  inspectSourcePair,
  scanCudaJsConsumerNeutrality,
} from './src/pair-evidence.mjs';
import { createPublicCudaJsRecorder } from './src/public-recorder.mjs';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function expectedPair(observed) {
  return {
    cudaMcgs: { ...observed.cudaMcgs },
    cudaJs: {
      repository: 'iteathen/CUDA-JS',
      revision: requiredEnv('CUDA_JS_REVISION'),
      tree: requiredEnv('CUDA_JS_TREE'),
      package: requiredEnv('CUDA_JS_PACKAGE'),
      apiSchema: requiredEnv('CUDA_JS_API_SCHEMA'),
    },
  };
}

async function rejects(run, code) {
  let error = null;
  try { await run(); } catch (caught) { error = caught; }
  assert(error, `expected ${code}`);
  assert.equal(error.code, code);
  return error;
}

function throws(run, code) {
  assert.throws(run, (error) => error?.code === code, `expected ${code}`);
}

function lowerSemanticNeutrality(compatibility) {
  const serialized = JSON.stringify(compatibility);
  assert(!/(?:cuda-mcgs|search-program|search-policy|search-graph|channel\.synthetic|output\.synthetic)/i.test(serialized));
}

function adapterInputs(capsule) {
  const executionPackage = capsule.composition.executionPackage.normalized;
  const binding = executionBindings(executionPackage, capsule);
  return {
    executionPackage,
    deliveryId: binding.delivery.id,
    channelResourceId: binding.channelResource.id,
    channelByteLength: Number(binding.channelResource.byteLength),
  };
}

const cases = [];
async function test(id, name, run) {
  try {
    await run();
    cases.push({ id, name, status: 'pass' });
    console.log(`PASS ${id} ${name}`);
  } catch (error) {
    cases.push({ id, name, status: 'fail', error: { name: error.name, code: error.code ?? null, message: error.message } });
    console.error(`FAIL ${id} ${name}: ${error.stack ?? error}`);
  }
}

const mcgsRoot = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const cudaJsRoot = path.resolve(requiredEnv('CUDA_JS_SOURCE_ROOT'));
const observedPair = await inspectSourcePair({ mcgsRoot, cudaJsRoot });
const pair = expectedPair(observedPair);
let capsule = null;
let neutrality = null;

await test('PAIR-C00', 'exact source pair builds the production-composed Channel/Output capsule', async () => {
  assertExactSourcePair(observedPair, pair);
  capsule = await buildExactCompatiblePairCapsule(pair);
  const input = adapterInputs(capsule);
  assertPairExecutionEvidence(input.executionPackage, capsule);
  assert.equal(capsule.workload.workItems, 1024);
  assert.equal(capsule.resources.terminal.deliveryByteOffset, '0');
  assert.equal(capsule.resources.terminal.deliveryByteLength, '4096');
  assert.equal(capsule.resources.terminal.allocationByteLength, '12288');
  assert.notEqual(input.channelResourceId, executionBindings(input.executionPackage, capsule).terminalResource.id);
});

if (capsule) {
  await test('PAIR-F01', 'stale CUDA-MCGS revision/tree fails before lower mutation', () => {
    const staleRevision = clone(pair);
    staleRevision.cudaMcgs.revision = '0'.repeat(40);
    throws(() => assertExactSourcePair(observedPair, staleRevision), 'PAIR_STALE_MCGS');
    const staleTree = clone(pair);
    staleTree.cudaMcgs.tree = '1'.repeat(40);
    throws(() => assertExactSourcePair(observedPair, staleTree), 'PAIR_STALE_MCGS');
  });

  await test('PAIR-F02', 'stale CUDA-JS revision/tree/package/API fails before lower mutation', async () => {
    const staleTree = clone(pair);
    staleTree.cudaJs.tree = '2'.repeat(40);
    throws(() => assertExactSourcePair(observedPair, staleTree), 'PAIR_STALE_LOWER');

    for (const mutate of [
      (value) => { value.compatibility.cudaJs.revision = '3'.repeat(40); },
      (value) => { value.compatibility.cudaJs.package = 'cuda-js@0.1.0-alpha.17'; },
      (value) => { value.compatibility.apiSchema = '999'; },
    ]) {
      const fake = publicCudaJsFake();
      const stale = clone(capsule.composition.executionPackage.normalized);
      mutate(stale);
      await rejects(() => prepareCudaJsExecution(stale, {
        cudaJs: fake.cudaJs,
        peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
      }), 'CUDA_JS_ADAPTER_PEER');
      assert.equal(fake.calls.length, 0);
    }
  });

  await test('PAIR-F03', 'unsafe launch or resource range is rejected before lower use', () => {
    const launch = clone(capsule.composition.executionPackage.normalized);
    launch.cudaJsAdapter.operationRequirements[0].launchPolicy.grid[0] = '1';
    throws(() => assertPairExecutionEvidence(launch, capsule), 'PAIR_LAUNCH_RANGE');

    const resource = clone(capsule.composition.executionPackage.normalized);
    const binding = executionBindings(resource, capsule);
    binding.terminalResource.byteLength = '4095';
    throws(() => assertPairExecutionEvidence(resource, capsule), 'PAIR_TERMINAL_RESOURCE');
  });

  await test('PAIR-F04', 'selected Channel device release/acquire requirement is mandatory', () => {
    const missing = clone(capsule.composition.executionPackage.normalized);
    missing.cudaJsAdapter.publicContracts = missing.cudaJsAdapter.publicContracts.filter(({ id }) => id !== 'cuda-js.device-publication-release-acquire/0.1.0');
    throws(() => assertPairExecutionEvidence(missing, capsule), 'PAIR_PUBLICATION');
  });

  await test('PAIR-F05', 'release/acquire helper removal or substitution is rejected', () => {
    const metadata = clone(capsule.composition.executionPackage.normalized);
    const handoff = metadata.cudaJsAdapter.searchProgram.functions.find(({ name }) => name === 'channel_handoff');
    handoff.helpers = handoff.helpers.filter((helper) => helper !== 'gpu.atomic.store-release-device');
    throws(() => assertPairExecutionEvidence(metadata, capsule), 'PAIR_PUBLICATION');

    const source = clone(capsule.composition.executionPackage.normalized);
    source.cudaJsAdapter.searchProgram.source = source.cudaJsAdapter.searchProgram.source.replace('gpu.atomic.loadAcquireDevice', 'gpu.atomic.loadRelaxedDevice');
    throws(() => assertPairExecutionEvidence(source, capsule), 'PAIR_PUBLICATION');
  });

  await test('PAIR-F06', 'host read-decide-write or relaunch contamination is rejected', () => {
    assertHostProtocol(['prepare', 'ignite', 'wait', 'deliver', 'close']);
    throws(() => assertHostProtocol(['prepare', 'ignite', 'deliver', 'ignite', 'wait', 'deliver', 'close']), 'PAIR_HOST_INTERMEDIATE');
  });

  await test('PAIR-F07', 'wrong Channel resource binding is rejected', () => {
    const wrong = clone(capsule.composition.executionPackage.normalized);
    const original = executionBindings(wrong, capsule);
    wrong.cudaJsAdapter.operationRequirements[0].bindings.find(({ parameter }) => parameter === 'channelState').source.resource = original.terminalResource.id;
    throws(() => assertPairExecutionEvidence(wrong, capsule), 'PAIR_CHANNEL_RESOURCE');
  });

  await test('PAIR-F08', 'wrong terminal Output delivery resource is rejected', () => {
    const wrong = clone(capsule.composition.executionPackage.normalized);
    const original = executionBindings(wrong, capsule);
    wrong.cudaJsAdapter.deliveryRequirements[0].resource = original.channelResource.id;
    throws(() => assertPairExecutionEvidence(wrong, capsule), 'PAIR_TERMINAL_RESOURCE');
  });

  await test('PAIR-F09', 'wrong terminal Output range is rejected', () => {
    const wrong = clone(capsule.composition.executionPackage.normalized);
    wrong.cudaJsAdapter.deliveryRequirements[0].byteLength = '4092';
    throws(() => assertPairExecutionEvidence(wrong, capsule), 'PAIR_TERMINAL_RANGE');
  });

  await test('PAIR-F10', 'unsupported lower alignment/capability fails before partial realization', async () => {
    const alignmentFake = publicCudaJsFake();
    const alignment = clone(capsule.composition.executionPackage.normalized);
    alignment.cudaJsAdapter.resourceRequirements[0].alignment = '24';
    await rejects(() => prepareCudaJsExecution(alignment, {
      cudaJs: alignmentFake.cudaJs,
      peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
    }), 'CUDA_JS_ADAPTER_CAPABILITY');
    assert.equal(alignmentFake.calls.length, 0);

    const capabilityFake = publicCudaJsFake();
    capabilityFake.cudaJs.CUDA_JS_COMPATIBILITY.capabilities.asyncTransfers = null;
    await rejects(() => prepareCudaJsExecution(capsule.composition.executionPackage.normalized, {
      cudaJs: capabilityFake.cudaJs,
      peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
    }), 'CUDA_JS_ADAPTER_CAPABILITY');
    assert.equal(capabilityFake.calls.length, 0);
  });

  await test('PAIR-F11', 'premature terminal delivery is rejected', async () => {
    const fake = publicCudaJsFake();
    assertPublicCudaJsIdentity(fake.cudaJs, pair.cudaJs);
    const input = adapterInputs(capsule);
    const prepared = await prepareCudaJsExecution(input.executionPackage, {
      cudaJs: fake.cudaJs,
      peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
    });
    await rejects(() => prepared.deliver(input.deliveryId), 'CUDA_JS_ADAPTER_STATE');
    assert.equal((await prepared.close()).status, 'complete');
  });

  await test('PAIR-F12', 'deferred lower operation failure preserves lower facts and cleanup', async () => {
    const fake = publicCudaJsFake({ waitError: true });
    const input = adapterInputs(capsule);
    const prepared = await prepareCudaJsExecution(input.executionPackage, {
      cudaJs: fake.cudaJs,
      peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
    });
    await prepared.ignite({ resources: { [input.channelResourceId]: new Uint8Array(input.channelByteLength) } });
    const error = await rejects(() => prepared.wait(), 'CUDA_JS_ADAPTER_OPERATION');
    assert(error.lower);
    assert.equal((await prepared.close()).status, 'complete');
  });

  await test('PAIR-F13', 'timeout/abandonment is not reported as completion', async () => {
    const fake = publicCudaJsFake({ waitResult: { status: 'abandoned', failure: { code: 'CUDA_JS_TIMEOUT', category: 'operation', details: { reason: 'portable-timeout-falsifier' } } } });
    const input = adapterInputs(capsule);
    const prepared = await prepareCudaJsExecution(input.executionPackage, {
      cudaJs: fake.cudaJs,
      peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
    });
    await prepared.ignite({ resources: { [input.channelResourceId]: new Uint8Array(input.channelByteLength) } });
    const error = await rejects(() => prepared.wait(), 'CUDA_JS_ADAPTER_OPERATION');
    assert.equal(error.lower.code, 'CUDA_JS_TIMEOUT');
    assert.equal((await prepared.close()).status, 'complete');
  });

  await test('PAIR-F14', 'cleanup/quarantine/restart-required truth is retained', async () => {
    const input = adapterInputs(capsule);
    const cleanupFake = publicCudaJsFake({ readBytes: expectedTerminalBytes(), readCloseError: true });
    const prepared = await prepareCudaJsExecution(input.executionPackage, {
      cudaJs: cleanupFake.cudaJs,
      peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
    });
    await prepared.ignite({ resources: { [input.channelResourceId]: new Uint8Array(input.channelByteLength) } });
    await prepared.wait();
    const deliveryError = await rejects(() => prepared.deliver(input.deliveryId), 'CUDA_JS_ADAPTER_DELIVERY_CLEANUP');
    assert.equal(deliveryError.cleanup.status, 'quarantined');
    assert(deliveryError.cleanup.retained.includes('runtime'));
    const cleanup = await prepared.close();
    assert.equal(cleanup.status, 'quarantined');
    assert(cleanup.retained.includes('runtime'));

    const restartFake = publicCudaJsFake({ runtimeCloseResult: { schemaVersion: 1, graceful: false, restartRequired: true, state: 'restart-required', compiler: {}, driver: {} } });
    const restartPrepared = await prepareCudaJsExecution(input.executionPackage, {
      cudaJs: restartFake.cudaJs,
      peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
    });
    const restartCleanup = await restartPrepared.close();
    assert.equal(restartCleanup.status, 'quarantined');
    assert.equal(restartCleanup.runtime.restartRequired, true);
  });

  await test('PAIR-F15', 'recorder binds compile/load/submit/delivery to one production-adapter transaction', async () => {
    const expected = expectedTerminalBytes();
    const fake = publicCudaJsFake({ readBytes: expected });
    const recorder = createPublicCudaJsRecorder(fake.cudaJs);
    const input = adapterInputs(capsule);
    const actions = ['prepare'];
    const prepared = await prepareCudaJsExecution(input.executionPackage, {
      cudaJs: recorder.cudaJs,
      peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
    });
    actions.push('ignite');
    await prepared.ignite({ resources: { [input.channelResourceId]: new Uint8Array(input.channelByteLength) } });
    actions.push('wait');
    await prepared.wait();
    actions.push('deliver');
    const delivery = await prepared.deliver(input.deliveryId);
    assert.deepEqual(delivery.bytes, expected);
    actions.push('close');
    const cleanup = await prepared.close();
    assert.equal(cleanup.status, 'complete');
    assertHostProtocol(actions);

    const snapshot = recorder.snapshot();
    assertRecorderTransaction(snapshot, input.executionPackage, capsule);
    assert.equal(calls(fake, 'function.submit').length, 1);
    assert.equal(calls(fake, 'memory.write').length, 1);
    assert.equal(calls(fake, 'mailbox.store').length, 0);
    const submit = call(fake, 'function.submit')[1];
    assert.deepEqual(submit.grid, { x: 4, y: 1, z: 1 });
    assert.deepEqual(submit.block, { x: 256, y: 1, z: 1 });
    assert.equal(submit.arguments.length, 3);
    lowerSemanticNeutrality(fake.cudaJs.CUDA_JS_COMPATIBILITY);
  });

  await test('PAIR-F16', 'exact CUDA-JS lower source/public contracts remain consumer-neutral', async () => {
    neutrality = await scanCudaJsConsumerNeutrality(cudaJsRoot);
    assert(neutrality.filesScanned > 0);
  });
}

const failed = cases.filter(({ status }) => status === 'fail');
const identity = capsule ? portableEvidenceIdentity(capsule) : null;
console.log(JSON.stringify({
  schema: 'cuda-mcgs.compatible-pair-32-portable-evidence/0.2.0',
  status: failed.length === 0 ? 'pass' : 'fail',
  pair,
  observedPair,
  node: { version: process.version, moduleAbi: process.versions.modules },
  platform: { platform: process.platform, architecture: process.arch },
  portableEvidenceIdentity: identity,
  cudaJsConsumerNeutrality: neutrality,
  cases,
  claimLimits: [
    'Portable exact-head construction, public-adapter lifecycle, source-provenance and falsifier evidence only; this is not native or physical CUDA qualification.',
    'The historical adapter fake supplies lifecycle scaffolding only and is not the executed physical workload oracle.',
    'CUDA-JS remains consumer-neutral; this capsule adds no CUDA-JS source or search vocabulary.',
  ],
}, null, 2));
if (failed.length > 0) process.exit(1);

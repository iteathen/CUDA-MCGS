import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

import { prepareCudaJsExecution } from '../../adapters/runtimes/cuda-js/index.mjs';
import { call, calls, clone, publicCudaJsFake } from '../cuda-js-runtime-adapter/src/fixture.mjs';
import {
  assertExactExecutionPackage,
  assertHostProtocol,
  buildExactCompatiblePairCapsule,
  expectedTerminalBytes,
  portableEvidenceIdentity,
} from './src/capsule.mjs';
import { createPublicCudaJsRecorder } from './src/public-recorder.mjs';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function currentPair() {
  return {
    cudaMcgs: {
      repository: 'iteathen/CUDA-MCGS',
      revision: git('rev-parse', 'HEAD'),
      tree: git('rev-parse', 'HEAD^{tree}'),
    },
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

const cases = [];
async function test(name, run) {
  try {
    await run();
    cases.push({ name, status: 'pass' });
    console.log(`PASS ${name}`);
  } catch (error) {
    cases.push({ name, status: 'fail', error: { name: error.name, code: error.code ?? null, message: error.message } });
    console.error(`FAIL ${name}: ${error.stack ?? error}`);
  }
}

const pair = currentPair();
let capsule;
await test('production-composer-builds-exact-channel-terminal-capsule', async () => {
  capsule = await buildExactCompatiblePairCapsule(pair);
  assertExactExecutionPackage(capsule.composition.executionPackage.normalized, capsule);
  assert.equal(capsule.composition.executionPackage.normalized.compatibility.cudaJs.revision, pair.cudaJs.revision);
  assert.equal(capsule.composition.executionPackage.normalized.compatibility.cudaJs.package, pair.cudaJs.package);
  assert.equal(capsule.workload.workItems, 1024);
  assert.equal(capsule.resources.terminal.byteLength, '4096');
  assert.notEqual(capsule.resources.terminal.id, capsule.resources.channel.id);
});

await test('device-release-acquire-is-owner-backed-and-mandatory', () => {
  const value = clone(capsule.composition.executionPackage.normalized);
  const handoff = value.cudaJsAdapter.searchProgram.functions.find(({ name }) => name === 'channel_handoff');
  handoff.helpers = handoff.helpers.filter((helper) => helper !== 'gpu.atomic.load-acquire-device');
  throws(() => assertExactExecutionPackage(value, capsule), 'PAIR_PUBLICATION');

  const missingContract = clone(capsule.composition.executionPackage.normalized);
  missingContract.cudaJsAdapter.publicContracts = missingContract.cudaJsAdapter.publicContracts.filter(({ id }) => id !== 'cuda-js.device-publication-release-acquire/0.1.0');
  throws(() => assertExactExecutionPackage(missingContract, capsule), 'PAIR_PUBLICATION');
});

await test('unsafe-launch-and-terminal-range-fail-before-lower-use', () => {
  const launch = clone(capsule.composition.executionPackage.normalized);
  launch.cudaJsAdapter.operationRequirements[0].launchPolicy.grid[0] = '1';
  throws(() => assertExactExecutionPackage(launch, capsule), 'PAIR_LAUNCH_RANGE');

  const delivery = clone(capsule.composition.executionPackage.normalized);
  delivery.cudaJsAdapter.deliveryRequirements[0].resource = capsule.resources.channel.id;
  throws(() => assertExactExecutionPackage(delivery, capsule), 'PAIR_TERMINAL_RANGE');
});

await test('host-intermediate-or-relaunch-protocol-is-rejected', () => {
  assertHostProtocol(['prepare', 'ignite', 'wait', 'deliver', 'close']);
  throws(() => assertHostProtocol(['prepare', 'ignite', 'deliver', 'ignite', 'wait', 'deliver', 'close']), 'PAIR_HOST_INTERMEDIATE');
});

await test('exact-lower-drift-fails-before-lower-mutation', async () => {
  const fake = publicCudaJsFake();
  const stale = clone(capsule.composition.executionPackage.normalized);
  stale.compatibility.cudaJs.revision = '0'.repeat(40);
  await rejects(() => prepareCudaJsExecution(stale, {
    cudaJs: fake.cudaJs,
    peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
  }), 'CUDA_JS_ADAPTER_PEER');
  assert.equal(fake.calls.length, 0);
});

await test('unsupported-alignment-and-backpressure-fail-before-partial-realization', async () => {
  const alignmentFake = publicCudaJsFake();
  const alignment = clone(capsule.composition.executionPackage.normalized);
  alignment.cudaJsAdapter.resourceRequirements[0].alignment = '24';
  await rejects(() => prepareCudaJsExecution(alignment, {
    cudaJs: alignmentFake.cudaJs,
    peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
  }), 'CUDA_JS_ADAPTER_CAPABILITY');
  assert.equal(alignmentFake.calls.length, 0);

  const pendingFake = publicCudaJsFake();
  const pending = clone(capsule.composition.executionPackage.normalized);
  pending.cudaJsAdapter.operationRequirements[0].launchPolicy.maxPending = '2';
  await rejects(() => prepareCudaJsExecution(pending, {
    cudaJs: pendingFake.cudaJs,
    peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
  }), 'CUDA_JS_ADAPTER_CAPABILITY');
  assert.equal(pendingFake.calls.length, 0);
});

await test('portable-public-adapter-path-has-one-ignition-no-host-active-loop-and-terminal-d2h', async () => {
  const expected = expectedTerminalBytes();
  const fake = publicCudaJsFake({ readBytes: expected });
  const recorder = createPublicCudaJsRecorder(fake.cudaJs);
  const actions = ['prepare'];
  const prepared = await prepareCudaJsExecution(capsule.composition.executionPackage.normalized, {
    cudaJs: recorder.cudaJs,
    peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
  });
  await rejects(() => prepared.deliver(capsule.deliveryId), 'CUDA_JS_ADAPTER_STATE');
  actions.push('ignite');
  await prepared.ignite({ resources: { [capsule.resources.channel.id]: new Uint8Array(Number(capsule.resources.channel.byteLength)) } });
  actions.push('wait');
  await prepared.wait();
  actions.push('deliver');
  const delivery = await prepared.deliver(capsule.deliveryId);
  assert.deepEqual(delivery.bytes, expected);
  actions.push('close');
  const cleanup = await prepared.close();
  assert.equal(cleanup.status, 'complete');
  assertHostProtocol(actions);

  assert.equal(calls(fake, 'function.submit').length, 1);
  assert.equal(calls(fake, 'memory.write').length, 1);
  assert.equal(calls(fake, 'mailbox.store').length, 0);
  const submit = call(fake, 'function.submit')[1];
  assert.deepEqual(submit.grid, { x: 4, y: 1, z: 1 });
  assert.deepEqual(submit.block, { x: 256, y: 1, z: 1 });
  assert.equal(submit.arguments.length, 3);
  assert.equal(recorder.snapshot().compilerResults.length, 1);
  assert.equal(recorder.snapshot().moduleLoads.length, 1);
  lowerSemanticNeutrality(fake.cudaJs.CUDA_JS_COMPATIBILITY);
});

await test('deferred-lower-failure-preserves-lower-facts-and-cleanup', async () => {
  const fake = publicCudaJsFake({ waitError: true });
  const prepared = await prepareCudaJsExecution(capsule.composition.executionPackage.normalized, {
    cudaJs: fake.cudaJs,
    peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
  });
  await prepared.ignite({ resources: { [capsule.resources.channel.id]: new Uint8Array(Number(capsule.resources.channel.byteLength)) } });
  const error = await rejects(() => prepared.wait(), 'CUDA_JS_ADAPTER_OPERATION');
  assert(error.lower);
  assert.equal((await prepared.close()).status, 'complete');
});

await test('timeout-abandonment-is-not-reported-as-completion', async () => {
  const fake = publicCudaJsFake({ waitResult: { status: 'abandoned', failure: { code: 'CUDA_JS_TIMEOUT', category: 'operation', details: { reason: 'portable-timeout-falsifier' } } } });
  const prepared = await prepareCudaJsExecution(capsule.composition.executionPackage.normalized, {
    cudaJs: fake.cudaJs,
    peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
  });
  await prepared.ignite({ resources: { [capsule.resources.channel.id]: new Uint8Array(Number(capsule.resources.channel.byteLength)) } });
  const error = await rejects(() => prepared.wait(), 'CUDA_JS_ADAPTER_OPERATION');
  assert.equal(error.lower.code, 'CUDA_JS_TIMEOUT');
  assert.equal((await prepared.close()).status, 'complete');
});

await test('terminal-transfer-child-cleanup-failure-quarantines-backing-resource-truth', async () => {
  const fake = publicCudaJsFake({ readBytes: expectedTerminalBytes(), readCloseError: true });
  const prepared = await prepareCudaJsExecution(capsule.composition.executionPackage.normalized, {
    cudaJs: fake.cudaJs,
    peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
  });
  await prepared.ignite({ resources: { [capsule.resources.channel.id]: new Uint8Array(Number(capsule.resources.channel.byteLength)) } });
  await prepared.wait();
  const deliveryError = await rejects(() => prepared.deliver(capsule.deliveryId), 'CUDA_JS_ADAPTER_DELIVERY_CLEANUP');
  assert.equal(deliveryError.cleanup.status, 'quarantined');
  assert(deliveryError.cleanup.retained.includes('runtime'));
  const cleanup = await prepared.close();
  assert.equal(cleanup.status, 'quarantined');
  assert(cleanup.retained.includes('runtime'));
});

const failed = cases.filter(({ status }) => status === 'fail');
const identity = capsule ? portableEvidenceIdentity(capsule) : null;
console.log(JSON.stringify({
  schema: 'cuda-mcgs.compatible-pair-32-portable-evidence/0.1.0',
  status: failed.length === 0 ? 'pass' : 'fail',
  pair,
  node: { version: process.version, moduleAbi: process.versions.modules },
  platform: { platform: process.platform, architecture: process.arch },
  portableEvidenceIdentity: identity,
  cases,
  claimLimits: [
    'Portable exact-head construction, public-adapter lifecycle and falsifier evidence only; this is not native or physical CUDA qualification.',
    'The historical adapter fake supplies lifecycle scaffolding only and is not the executed physical workload oracle.',
    'CUDA-JS remains consumer-neutral; this capsule adds no CUDA-JS source or search vocabulary.',
  ],
}, null, 2));
if (failed.length > 0) process.exit(1);

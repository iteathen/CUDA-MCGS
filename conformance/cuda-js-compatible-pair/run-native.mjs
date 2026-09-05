import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { prepareCudaJsExecution } from '../../adapters/runtimes/cuda-js/index.mjs';
import {
  assertHostProtocol,
  buildExactCompatiblePairCapsule,
  executionBindings,
  expectedTerminalBytes,
} from './src/capsule.mjs';
import {
  assertExactSourcePair,
  assertLinkedPublicCudaJs,
  assertPairExecutionEvidence,
  assertPublicCudaJsIdentity,
  assertRecorderTransaction,
  inspectSourcePair,
  scanCudaJsConsumerNeutrality,
} from './src/pair-evidence.mjs';
import { assertPhysicalPublicEvidence, createPublicCudaJsRecorder } from './src/public-recorder.mjs';

const PORTABLE_FAILURE_CASES = Object.freeze([
  'PAIR-F01', 'PAIR-F02', 'PAIR-F03', 'PAIR-F04', 'PAIR-F05', 'PAIR-F06', 'PAIR-F07', 'PAIR-F08',
  'PAIR-F09', 'PAIR-F10', 'PAIR-F11', 'PAIR-F12', 'PAIR-F13', 'PAIR-F14', 'PAIR-F15', 'PAIR-F16',
]);

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) fail('PAIR_NATIVE_ENV', `${name} is required for exact native qualification`);
  return value;
}

function expectedPair() {
  return {
    cudaMcgs: {
      repository: 'iteathen/CUDA-MCGS',
      revision: requiredEnv('CUDA_MCGS_REVISION'),
      tree: requiredEnv('CUDA_MCGS_TREE'),
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

function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function errorFacts(error) {
  if (!error || typeof error !== 'object') return { message: String(error) };
  const output = { name: error.name ?? 'Error', message: error.message ?? String(error), code: error.code ?? null };
  for (const key of ['category', 'operation', 'phase', 'classification', 'healthBefore', 'healthAfter']) if (error[key] !== undefined) output[key] = error[key];
  if (error.lower !== undefined) output.lower = error.lower;
  if (error.cleanup !== undefined) output.cleanup = error.cleanup;
  if (error.details !== undefined) output.details = error.details;
  return output;
}

function adapterInputs(capsule) {
  const executionPackage = capsule.composition.executionPackage.normalized;
  const binding = executionBindings(executionPackage, capsule);
  return {
    executionPackage,
    binding,
    deliveryId: binding.delivery.id,
    channelResourceId: binding.channelResource.id,
    channelByteLength: Number(binding.channelResource.byteLength),
  };
}

function u32At(bytes, index) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(index * 4, true);
}

function hostIdentity() {
  return Object.freeze({
    node: {
      version: process.version,
      moduleAbi: process.versions.modules,
      napi: process.versions.napi ?? null,
      v8: process.versions.v8,
      uv: process.versions.uv,
      openssl: process.versions.openssl,
      execArgv: [...process.execArgv],
    },
    process: {
      platform: process.platform,
      architecture: process.arch,
      release: { ...process.release },
    },
    os: {
      type: os.type(),
      release: os.release(),
      version: typeof os.version === 'function' ? os.version() : null,
      machine: typeof os.machine === 'function' ? os.machine() : null,
      architecture: os.arch(),
    },
  });
}

let pair = null;
let observedPair = null;
let link = null;
let neutrality = null;
let capsule = null;
let input = null;
let recorder = null;
let prepared = null;
let waitResult = null;
let delivery = null;
let cleanup = null;
let failure = null;
let actions = [];

try {
  pair = expectedPair();
  const mcgsRoot = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
  const cudaJsRoot = path.resolve(requiredEnv('CUDA_JS_SOURCE_ROOT'));
  observedPair = await inspectSourcePair({ mcgsRoot, cudaJsRoot });
  assertExactSourcePair(observedPair, pair);
  neutrality = await scanCudaJsConsumerNeutrality(cudaJsRoot);
  link = await assertLinkedPublicCudaJs(cudaJsRoot);

  const publicCudaJs = await import('cuda-js');
  assertPublicCudaJsIdentity(publicCudaJs, pair.cudaJs);

  capsule = await buildExactCompatiblePairCapsule(pair);
  input = adapterInputs(capsule);
  assertPairExecutionEvidence(input.executionPackage, capsule);

  recorder = createPublicCudaJsRecorder(publicCudaJs);
  actions = ['prepare'];
  prepared = await prepareCudaJsExecution(input.executionPackage, {
    cudaJs: recorder.cudaJs,
    peer: { repository: pair.cudaJs.repository, revision: pair.cudaJs.revision, package: pair.cudaJs.package },
  });

  actions.push('ignite');
  await prepared.ignite({ resources: { [input.channelResourceId]: new Uint8Array(input.channelByteLength) } });
  actions.push('wait');
  waitResult = await prepared.wait();
  actions.push('deliver');
  delivery = await prepared.deliver(input.deliveryId);

  const expected = expectedTerminalBytes();
  if (!(delivery.bytes instanceof Uint8Array) || delivery.bytes.byteLength !== expected.byteLength
      || Buffer.compare(Buffer.from(delivery.bytes), Buffer.from(expected)) !== 0) {
    fail('PAIR_TERMINAL_BYTES', 'physical terminal bytes differ from the deterministic exact-pair oracle');
  }
  if (u32At(delivery.bytes, 1) !== capsule.workload.publicationResult) {
    fail('PAIR_PUBLICATION_RESULT', 'consumer publication result word does not prove payload plus acquire-observed readiness');
  }

  actions.push('close');
  cleanup = await prepared.close();
  if (cleanup.status !== 'complete') fail('PAIR_NATIVE_CLEANUP', 'exact native pair did not close with complete adapter cleanup');
  assertHostProtocol(actions);

  const snapshot = recorder.snapshot();
  assertRecorderTransaction(snapshot, input.executionPackage, capsule);
  assertPhysicalPublicEvidence(snapshot);

  const handoff = input.executionPackage.cudaJsAdapter.searchProgram.functions.find(({ name }) => name === 'channel_handoff');
  const terminalBytes = {
    byteLength: delivery.bytes.byteLength,
    sha256: sha256Bytes(delivery.bytes),
    hex: Buffer.from(delivery.bytes.buffer, delivery.bytes.byteOffset, delivery.bytes.byteLength).toString('hex'),
  };
  const compilerResult = snapshot.compilerResults[0];
  const selectedArtifact = compilerResult.linker?.artifact ?? compilerResult.compiler?.artifact;
  const runtimeDescription = snapshot.runtimeDescriptions.at(-1);
  const runtimeClose = snapshot.runtimeClose.at(-1)?.result ?? null;
  const submit = snapshot.functionSubmits[0];
  const terminalRead = snapshot.memoryReadsAsync[0];

  console.log(JSON.stringify({
    schema: 'cuda-mcgs.compatible-pair-32-native-evidence/0.1.0',
    status: 'pass',
    claim: 'exact-physical-compatible-pair-candidate',
    pair,
    observedPair,
    publicPackageResolution: link,
    cudaJsConsumerNeutrality: neutrality,
    host: hostIdentity(),
    lower: {
      compatibility: snapshot.compatibility,
      runtime: runtimeDescription,
      compiler: compilerResult.compiler,
      linker: compilerResult.linker,
      selectedArtifact,
      loadedModule: snapshot.moduleLoads[0],
      terminalRuntime: runtimeClose,
    },
    program: {
      programPackage: capsule.composition.compositionProfile.identity,
      searchProgram: capsule.composition.searchProgram.identity,
      executionPackage: capsule.composition.executionPackage.identity,
      deviceJsInput: snapshot.compileRequests[0],
      translatedDeviceJsSha256: compilerResult.deviceProgram.sha256,
      translatedDeviceJs: compilerResult.deviceProgram,
    },
    execution: {
      operationId: input.binding.operation.id,
      launch: submit.request,
      usefulWorkItems: capsule.workload.workItems,
      operationEvents: snapshot.operationEvents.filter(({ role }) => role === 'main'),
      wait: waitResult,
      devicePublication: {
        semanticOwner: capsule.resources.channel.semanticOwner,
        contract: 'cuda-js.device-publication-release-acquire/0.1.0',
        function: handoff.name,
        helpers: handoff.helpers,
        producerPayload: capsule.workload.publicationPayload,
        producerReady: capsule.workload.publicationReady,
        consumerWordIndex: 1,
        observedConsumerWord: u32At(delivery.bytes, 1),
        expectedConsumerWord: capsule.workload.publicationResult,
        hostMailboxStores: snapshot.mailboxStores.length,
        hostMailboxLoads: snapshot.mailboxLoads.length,
      },
    },
    terminalDelivery: {
      id: input.binding.delivery.id,
      packageDelivery: input.binding.delivery.packageDelivery,
      resource: input.binding.delivery.resource,
      byteOffset: input.binding.delivery.byteOffset,
      byteLength: input.binding.delivery.byteLength,
      request: terminalRead,
      transferEvents: snapshot.operationEvents.filter(({ role }) => role === 'transfer'),
      transferClose: snapshot.resourceCloses.find(({ id }) => id === terminalRead.operationId) ?? null,
      bytes: terminalBytes,
    },
    lifecycle: {
      hostProtocol: actions,
      allocations: snapshot.allocations,
      initializationWrites: snapshot.memoryWrites,
      resourceCloses: snapshot.resourceCloses,
      cleanup,
      runtimeClose,
      pressure: { maxPending: input.binding.operation.launchPolicy.maxPending, observedDisposition: 'within-bound' },
      deferredFailure: { observed: false, portableFalsifier: 'PAIR-F12' },
      timeoutAbandonment: { observed: false, portableFalsifier: 'PAIR-F13' },
      quarantine: cleanup.status === 'quarantined',
      retained: cleanup.retained ?? [],
      restartRequired: runtimeClose?.restartRequired ?? null,
      portableFailureSemantics: PORTABLE_FAILURE_CASES,
    },
    claimLimits: [
      'This bundle qualifies only the exact source/runtime/provider/device tuple recorded above; it does not promote another OS, GPU, driver, toolkit, Node, target, or CUDA-JS revision.',
      'Portable failure-path falsifiers remain separate evidence and are referenced by stable case ID; they are not relabeled as physical failure injection.',
      'The recorder uses only the public cuda-js package and public capability methods; no generated CUDA/PTX, raw handle, pointer, FFI, or private CUDA-JS surface is inspected by CUDA-MCGS.',
    ],
  }, null, 2));
} catch (error) {
  failure = error;
  if (prepared && cleanup === null) {
    try { cleanup = await prepared.close(); }
    catch (closeError) { cleanup = { status: 'cleanup-threw', error: errorFacts(closeError) }; }
  }
  const snapshot = recorder?.snapshot() ?? null;
  console.error(JSON.stringify({
    schema: 'cuda-mcgs.compatible-pair-32-native-evidence/0.1.0',
    status: 'fail',
    pair,
    observedPair,
    publicPackageResolution: link,
    cudaJsConsumerNeutrality: neutrality,
    host: hostIdentity(),
    program: capsule ? {
      programPackage: capsule.composition.compositionProfile.identity,
      searchProgram: capsule.composition.searchProgram.identity,
      executionPackage: capsule.composition.executionPackage.identity,
    } : null,
    actions,
    wait: waitResult,
    delivery: delivery?.bytes instanceof Uint8Array ? { byteLength: delivery.bytes.byteLength, sha256: sha256Bytes(delivery.bytes) } : null,
    cleanup,
    publicRecorder: snapshot,
    error: errorFacts(failure),
    claimLimits: ['Failed native evidence is diagnostic only and never qualifies CUDA-JS #32.'],
  }, null, 2));
  process.exitCode = 1;
}

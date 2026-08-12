import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { CudaJsError, CUDA_JS_COMPATIBILITY, inspectCudaHost, openCudaRuntime } from 'cuda-js';

import { KERNEL_NAME, OUTPUT_BYTES, referenceOutput, sha256 } from './model.mjs';

const inputDirectory = path.resolve(process.argv[2]);
const outputDirectory = path.resolve(process.argv[3]);
await mkdir(outputDirectory, { recursive: true });
const portablePackage = JSON.parse(await readFile(path.join(inputDirectory, 'package.json'), 'utf8'));
const fixtureRoot = path.resolve(process.argv[4]);
const cases = [];
const observations = {};
let runtime = null;
let description = null;
let terminal = null;

async function runCase(id, body) {
  try {
    await body();
    cases.push({ id, status: 'pass' });
    console.log(`case=${id} result=pass`);
  } catch (error) {
    cases.push({ id, status: 'fail', error: publicError(error) });
    console.error(`case=${id} result=fail error=${JSON.stringify(error.message)}`);
  }
}

function publicError(error) {
  return {
    name: error?.name ?? 'Error',
    code: error?.code ?? null,
    category: error?.category ?? null,
    operation: error?.operation ?? null,
    message: error?.message ?? String(error),
    details: error?.details ?? {},
    healthBefore: error?.healthBefore ?? null,
    healthAfter: error?.healthAfter ?? null,
  };
}

function readWords(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Array.from({ length: bytes.byteLength / 4 }, (_, index) => view.getUint32(index * 4, true));
}

async function loadBytes(file) {
  return new Uint8Array(await readFile(file));
}

async function executeArtifact(id, artifact, expected) {
  let module = null;
  let fn = null;
  let memory = null;
  try {
    await writeFile(path.join(outputDirectory, `${id}.cubin`), artifact.bytes);
    module = await runtime.loadModule({ format: 'cubin', bytes: artifact.bytes });
    fn = await module.getFunction({
      name: KERNEL_NAME,
      parameters: [{ kind: 'device-memory' }, { kind: 'u32' }, { kind: 'u32' }, { kind: 'u32' }],
    });
    memory = await runtime.allocateDevice({ byteLength: OUTPUT_BYTES });
    await memory.write(new Uint8Array(OUTPUT_BYTES));
    const completion = await fn.launch({
      grid: { x: 1, y: 1, z: 1 },
      block: { x: 1, y: 1, z: 1 },
      arguments: [memory, portablePackage.config.nodeCapacity, portablePackage.config.iterationBudget, portablePackage.config.activationStep],
    });
    const copy = await memory.read({ byteLength: OUTPUT_BYTES });
    const actual = readWords(copy.bytes);
    assert.deepEqual(actual, expected);
    return { actual, completion, module: { byteLength: module.byteLength, sha256: module.sha256 } };
  } finally {
    if (fn) await fn.close();
    if (module) await module.close();
    if (memory) await memory.close();
  }
}

await runCase('open-public-cuda-js-package', async () => {
  assert.equal(CUDA_JS_COMPATIBILITY.package.version, '0.1.0-alpha.2');
  runtime = await openCudaRuntime({
    compiler: true,
    driver: {
      memory: { maxDeviceBytes: OUTPUT_BYTES, maxAllocationBytes: OUTPUT_BYTES, maxTransferBytes: OUTPUT_BYTES },
      execution: { maxModuleBytes: 16 * 1024 * 1024, maxArguments: 4, maxCompletionMilliseconds: 10_000 },
    },
  });
  description = await runtime.describe();
  assert.equal(runtime.health, 'healthy');
});

if (runtime) {
  const profileById = new Map(portablePackage.profiles.map((profile) => [profile.id, profile]));
  const coreBytes = Object.fromEntries(await Promise.all(portablePackage.profiles.map(async (profile) => [profile.id, await loadBytes(path.join(inputDirectory, profile.coreFile))])));
  const fragmentBytes = {
    'ptx/bias.ptx': await loadBytes(path.join(fixtureRoot, 'ptx', 'bias.ptx')),
    'ptx/observer.ptx': await loadBytes(path.join(fixtureRoot, 'ptx', 'observer.ptx')),
  };

  await runCase('cuda-js-rejects-typed-architecture-mismatch-and-recovers', async () => {
    const bytes = coreBytes.unbound;
    await assert.rejects(runtime.link({
      inputs: [{ format: 'ptx', bytes, byteLength: bytes.byteLength, sha256: sha256(bytes), architecture: 'compute_80' }],
      options: { architecture: 'sm_75' },
    }), (error) => error instanceof CudaJsError && error.code === 'LINKER_ARCHITECTURE_MISMATCH');
    assert.equal(runtime.health, 'healthy');
  });

  await runCase('missing-fragment-link-fails-and-compiler-recovers', async () => {
    let rejected = null;
    try {
      await runtime.link({ inputs: [coreBytes.bias], options: { architecture: 'sm_75' } });
    } catch (error) {
      rejected = error;
    }
    assert(rejected instanceof CudaJsError, 'Missing device definition must fail through the CUDA-JS error contract.');
    observations.missingFragment = publicError(rejected);
    assert.equal(runtime.health, 'healthy');
    const recovery = await runtime.link({ inputs: [coreBytes.unbound], options: { architecture: 'sm_75' } });
    assert.equal(recovery.artifact.format, 'cubin');
  });

  const linkedArtifacts = {};
  for (const profile of portablePackage.profiles) {
    await runCase(`link-launch-${profile.id}`, async () => {
      const inputs = [coreBytes[profile.id], ...profile.fragmentFiles.map((file) => fragmentBytes[file])];
      const linked = await runtime.link({ inputs, options: { architecture: 'sm_75' } });
      linkedArtifacts[profile.id] = linked.artifact;
      const execution = await executeArtifact(profile.id, linked.artifact, profile.expected);
      observations[profile.id] = {
        planSha256: profile.planSha256,
        orderedInputSha256: inputs.map(sha256),
        cubin: { byteLength: linked.artifact.byteLength, sha256: linked.artifact.sha256 },
        link: { log: linked.log, provider: linked.provider, health: linked.health, operationSequence: linked.operationSequence },
        execution,
      };
    });
  }

  await runCase('no-point-unbound-final-artifact-identical', () => {
    assert(linkedArtifacts['no-point'] && linkedArtifacts.unbound);
    assert.equal(linkedArtifacts['no-point'].sha256, linkedArtifacts.unbound.sha256);
    assert.deepEqual(linkedArtifacts['no-point'].bytes, linkedArtifacts.unbound.bytes);
  });

  await runCase('memory-quota-rejects-and-recovers', async () => {
    await assert.rejects(runtime.allocateDevice({ byteLength: OUTPUT_BYTES + 4 }), (error) => error instanceof CudaJsError && error.code === 'MEMORY_ALLOCATION_LIMIT');
    assert.equal(runtime.health, 'healthy');
    const memory = await runtime.allocateDevice({ byteLength: OUTPUT_BYTES });
    await memory.close();
  });

  await runCase('compile-link-launch-fused-control', async () => {
    const source = await readFile(path.join(inputDirectory, portablePackage.fusedControl.sourceFile), 'utf8');
    const compiled = await runtime.compile({ source, name: 'fused-bias-observer.cu', options: { architecture: 'compute_75', languageStandard: 'c++17', fmad: false } });
    await writeFile(path.join(outputDirectory, 'fused-bias-observer.ptx'), compiled.artifact.bytes);
    const linked = await runtime.link({ inputs: [compiled.artifact], options: { architecture: 'sm_75' } });
    const execution = await executeArtifact('fused-bias-observer', linked.artifact, portablePackage.fusedControl.expected);
    observations.fused = {
      ptx: { byteLength: compiled.artifact.byteLength, sha256: compiled.artifact.sha256 },
      cubin: { byteLength: linked.artifact.byteLength, sha256: linked.artifact.sha256 },
      compile: { log: compiled.log, provider: compiled.provider, health: compiled.health, operationSequence: compiled.operationSequence },
      link: { log: linked.log, provider: linked.provider, health: linked.health, operationSequence: linked.operationSequence },
      execution,
    };
  });

  await runCase('probe-current-public-nvrtc-separate-compilation', async () => {
    const entries = Object.entries(portablePackage.modularCudaProbe);
    const sources = Object.fromEntries(await Promise.all(entries.map(async ([id, metadata]) => [id, await readFile(path.join(inputDirectory, metadata.sourceFile), 'utf8')])));
    const compiled = {};
    const failures = {};
    for (const id of ['bias', 'observer', 'biasAnchored', 'observerAnchored', 'core']) {
      try {
        compiled[id] = await runtime.compile({ source: sources[id], name: `modular-${id}.cu`, options: { architecture: 'compute_75', languageStandard: 'c++17', fmad: false } });
        await writeFile(path.join(outputDirectory, `modular-${id}.ptx`), compiled[id].artifact.bytes);
      } catch (error) {
        failures[id] = publicError(error);
      }
    }
    let link = null;
    let execution = null;
    if (compiled.core && compiled.bias && compiled.observer) {
      try {
        link = await runtime.link({ inputs: [compiled.core.artifact, compiled.bias.artifact, compiled.observer.artifact], options: { architecture: 'sm_75' } });
        execution = await executeArtifact('modular-nvrtc-current-api', link.artifact, [...referenceOutput(portablePackage.config, ['score-transform', 'backup-observer'])]);
      } catch (error) {
        failures.link = publicError(error);
      }
    }
    let anchoredLink = null;
    let anchoredExecution = null;
    if (compiled.core && compiled.biasAnchored && compiled.observerAnchored) {
      try {
        anchoredLink = await runtime.link({ inputs: [compiled.core.artifact, compiled.biasAnchored.artifact, compiled.observerAnchored.artifact], options: { architecture: 'sm_75' } });
        anchoredExecution = await executeArtifact('modular-nvrtc-anchor-hack', anchoredLink.artifact, [...referenceOutput(portablePackage.config, ['score-transform', 'backup-observer'])]);
      } catch (error) {
        failures.anchoredLink = publicError(error);
      }
    }
    observations.modularNvrtc = {
      status: execution ? 'works-with-current-public-api' : 'cannot-produce-runnable-separate-source-composition',
      publicCompileOptions: ['architecture', 'languageStandard', 'fmad', 'deviceAsDefaultExecutionSpace', 'headerProfile'],
      relocatableDeviceCodeOptionAvailable: false,
      compiled: Object.fromEntries(Object.entries(compiled).map(([id, result]) => [id, { byteLength: result.artifact.byteLength, sha256: result.artifact.sha256 }])),
      failures,
      linked: link ? { byteLength: link.artifact.byteLength, sha256: link.artifact.sha256 } : null,
      execution,
      retentionAnchorWorkaround: {
        status: anchoredExecution ? 'works-but-adds-fake-entry-points-and-dead-code' : 'does-not-work',
        linked: anchoredLink ? { byteLength: anchoredLink.artifact.byteLength, sha256: anchoredLink.artifact.sha256 } : null,
        execution: anchoredExecution,
      },
    };
    assert.equal(runtime.health, 'healthy');
  });
}

if (runtime) {
  try {
    terminal = await runtime.close();
    if (terminal.graceful === true) {
      cases.push({ id: 'graceful-runtime-close', status: 'pass' });
      console.log('case=graceful-runtime-close result=pass');
    } else {
      cases.push({ id: 'graceful-runtime-close', status: 'fail', error: { message: 'CUDA-JS close was not graceful.', terminal } });
    }
  } catch (error) {
    cases.push({ id: 'graceful-runtime-close', status: 'fail', error: publicError(error) });
  }
}

const failed = cases.filter(({ status }) => status === 'fail');
const evidence = {
  schemaVersion: 1,
  capsule: 'cuda-mcgs.ptx-extension-discovery.windows-native.v1',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, architecture: process.arch, osRelease: os.release(), execArgv: process.execArgv },
  host: inspectCudaHost(),
  runtime: description,
  observations,
  terminal,
  summary: { expected: cases.length, discovered: cases.length, executed: cases.length, passed: cases.length - failed.length, failed: failed.length, requiredSkipped: 0, conditionalSkipped: 0, optionalSkipped: 0, notDiscovered: 0 },
  cases,
  claimLimits: [
    'Exact Windows x64 discovery profile only; no native Linux claim.',
    'Single-thread miniature search; no scheduler, concurrency, representative performance, search-quality, or production-lowering claim.',
    'Hand-authored PTX and sibling-checkout package are discovery mechanisms, not durable production recommendations.',
  ],
};
await writeFile(path.join(outputDirectory, 'native-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`capsule=${evidence.capsule} expected=${evidence.summary.expected} discovered=${evidence.summary.discovered} executed=${evidence.summary.executed} passed=${evidence.summary.passed} failed=${evidence.summary.failed}`);
if (failed.length > 0) process.exitCode = 1;

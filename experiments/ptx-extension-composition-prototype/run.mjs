import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, rmdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CUDA_JS_BRANCH, CUDA_JS_REVISION } from './src/model.mjs';
import { COST_KERNEL_NAME, buildCostProbeProfiles } from './src/cost-probe.mjs';
import { runPortable } from './src/run-portable.mjs';

const experimentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = path.resolve(experimentRoot, '..', '..');
const cudaJsRoot = path.resolve(repositoryRoot, '..', 'CUDA-JS');
const buildRoot = path.join(experimentRoot, 'build');
const portableDirectory = path.join(buildRoot, 'portable');
const consumerDirectory = path.join(buildRoot, 'native-consumer');
const packageDirectory = path.join(buildRoot, 'package');
const nativeOutputDirectory = path.join(buildRoot, 'native-output');

function ensureOwnedBuildPath(target) {
  const relative = path.relative(buildRoot, target);
  if (relative.startsWith('..') || path.isAbsolute(relative) || target === buildRoot) throw new Error(`Refusing generated-state operation outside an exact child of ${buildRoot}: ${target}`);
}

async function command(executable, args, { cwd, allowFailure = false, inherit = false, quiet = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, windowsHide: true, stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    if (!inherit) {
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk) => { stdout += chunk; if (!quiet) process.stdout.write(chunk); });
      child.stderr.on('data', (chunk) => { stderr += chunk; if (!quiet) process.stderr.write(chunk); });
    }
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      const result = { code, signal, stdout, stderr };
      if (code === 0 || allowFailure) resolve(result);
      else reject(Object.assign(new Error(`${path.basename(executable)} exited with code ${code}.`), { result }));
    });
  });
}

async function git(...args) {
  return (await command('git', args, { cwd: cudaJsRoot })).stdout.trim();
}

async function verifyCudaJsCheckout() {
  const [branch, revision, status] = await Promise.all([
    git('branch', '--show-current'),
    git('rev-parse', 'HEAD'),
    git('status', '--porcelain', '--untracked-files=all'),
  ]);
  assert.equal(branch, CUDA_JS_BRANCH, `CUDA-JS checkout must remain on ${CUDA_JS_BRANCH}; found ${branch}.`);
  assert.equal(revision, CUDA_JS_REVISION, `CUDA-JS main must be exact ${CUDA_JS_REVISION}; found ${revision}.`);
  assert.equal(status, '', 'CUDA-JS checkout must be clean before packaging.');
  return { branch, revision, status: 'clean' };
}

async function sha256File(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function prepareConsumer() {
  for (const target of [consumerDirectory, packageDirectory]) {
    ensureOwnedBuildPath(target);
    await rm(target, { recursive: true, force: true });
    await mkdir(target, { recursive: true });
  }
  const npmCli = path.join(cudaJsRoot, 'build', 'toolchains', 'node-v26.7.0-win-x64', 'node_modules', 'npm', 'bin', 'npm-cli.js');
  assert((await stat(npmCli)).isFile(), `Expected qualified npm CLI at ${npmCli}.`);
  const packed = await command(process.execPath, [npmCli, 'pack', '--json', '--pack-destination', packageDirectory], { cwd: cudaJsRoot, quiet: true });
  const packRecords = JSON.parse(packed.stdout.slice(packed.stdout.indexOf('[')));
  assert.equal(packRecords.length, 1);
  const tarball = path.join(packageDirectory, packRecords[0].filename);
  await writeFile(path.join(consumerDirectory, 'package.json'), `${JSON.stringify({ name: 'cuda-mcgs-ptx-discovery-consumer', private: true, type: 'module' }, null, 2)}\n`);
  await command(process.execPath, [npmCli, 'install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], { cwd: consumerDirectory });
  await cp(path.join(experimentRoot, 'src', 'native-consumer.mjs'), path.join(consumerDirectory, 'native-consumer.mjs'));
  await cp(path.join(experimentRoot, 'src', 'model.mjs'), path.join(consumerDirectory, 'model.mjs'));
  await cp(path.join(experimentRoot, 'src', 'cost-probe.mjs'), path.join(consumerDirectory, 'cost-probe.mjs'));
  await cp(path.join(experimentRoot, 'fixtures'), path.join(consumerDirectory, 'fixtures'), { recursive: true });
  return { tarball, filename: path.basename(tarball), sha256: await sha256File(tarball), npmCli };
}

async function inspectNativeArtifacts() {
  const cudaBin = 'C:\\Program Files\\NVIDIA GPU Computing Toolkit\\CUDA\\v13.3\\bin';
  const cuobjdump = path.join(cudaBin, 'cuobjdump.exe');
  const nvdisasm = path.join(cudaBin, 'nvdisasm.exe');
  assert((await stat(cuobjdump)).isFile());
  assert((await stat(nvdisasm)).isFile());
  const cubins = (await readdir(nativeOutputDirectory)).filter((name) => name.endsWith('.cubin')).sort();
  const costProfiles = buildCostProbeProfiles();
  assert.equal(cubins.length, 6 + costProfiles.length, `Expected six composition cubins plus ${costProfiles.length} cost cubins.`);
  const artifacts = {};
  for (const name of cubins) {
    const file = path.join(nativeOutputDirectory, name);
    const [resources, sass] = await Promise.all([
      command(cuobjdump, ['--dump-resource-usage', file], { cwd: nativeOutputDirectory, quiet: true }),
      command(nvdisasm, ['--print-code', file], { cwd: nativeOutputDirectory, quiet: true }),
    ]);
    await writeFile(path.join(nativeOutputDirectory, `${name}.resource.txt`), resources.stdout);
    await writeFile(path.join(nativeOutputDirectory, `${name}.sass.txt`), sass.stdout);
    const functions = Object.fromEntries([...resources.stdout.matchAll(/Function ([^:]+):\s+REG:(\d+) STACK:(\d+) SHARED:(\d+) LOCAL:(\d+)(?: CONSTANT\[0\]:(\d+))?/g)].map((match) => [match[1], {
      registers: Number(match[2]),
      stackBytes: Number(match[3]),
      sharedBytes: Number(match[4]),
      localBytes: Number(match[5]),
      constant0Bytes: match[6] === undefined ? 0 : Number(match[6]),
    }]));
    artifacts[name] = {
      byteLength: (await stat(file)).size,
      sha256: await sha256File(file),
      sassCallInstructions: (sass.stdout.match(/\bCALL(?:\.\w+)?\b/g) ?? []).length,
      functionCount: Object.keys(functions).length,
      functions,
      costKernelResources: functions[COST_KERNEL_NAME] ?? null,
      containsScoreTransformName: sass.stdout.includes('cuda_mcgs_score_transform_v1'),
      containsObserverName: sass.stdout.includes('cuda_mcgs_backup_observer_v1'),
      resourceOutputSha256: createHash('sha256').update(resources.stdout).digest('hex'),
      sassOutputSha256: createHash('sha256').update(sass.stdout).digest('hex'),
    };
  }
  for (const profile of costProfiles) {
    const artifact = artifacts[`cost-${profile.id}.cubin`];
    assert(artifact, `Missing inspected cost artifact ${profile.id}.`);
    assert(artifact.costKernelResources, `Missing parsed kernel resources for ${profile.id}.`);
    assert.equal(artifact.sassCallInstructions, profile.sourceCallSites, `Unexpected SASS call count for ${profile.id}.`);
    const expectedFunctions = profile.mode === 'inline' ? 1 : profile.mode === 'separate-coarse' ? 2 : profile.fragmentCount + 1;
    assert.equal(artifact.functionCount, expectedFunctions, `Unexpected retained function count for ${profile.id}.`);
    assert.equal(artifact.costKernelResources.stackBytes, 0, `Unexpected stack allocation for ${profile.id}.`);
    assert.equal(artifact.costKernelResources.localBytes, 0, `Unexpected local allocation for ${profile.id}.`);
    assert.equal(artifact.costKernelResources.sharedBytes, 0, `Unexpected shared allocation for ${profile.id}.`);
  }
  const fineBytes = [1, 2, 4, 8].map((count) => artifacts[`cost-separate-fine-n${count}.cubin`].byteLength);
  assert(fineBytes.every((value, index) => index === 0 || value > fineBytes[index - 1]), 'Separate-fine cubin bytes must increase across the frozen 1/2/4/8 matrix.');
  assert.equal(artifacts['cost-same-internal-n8.cubin'].sassCallInstructions, artifacts['cost-separate-fine-n8.cubin'].sassCallInstructions);
  const evidence = { schemaVersion: 2, tools: { cuobjdump, nvdisasm }, artifacts };
  await writeFile(path.join(nativeOutputDirectory, 'binary-inspection.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

async function cleanupConsumer() {
  for (const target of [consumerDirectory, packageDirectory]) {
    ensureOwnedBuildPath(target);
    await rm(target, { recursive: true, force: true });
  }
  return { removed: [consumerDirectory, packageDirectory], retainedTemporarilyForCuration: [portableDirectory, nativeOutputDirectory] };
}

export async function runNative() {
  assert.equal(process.platform, 'win32', 'This environment can execute only the Windows native discovery lane.');
  const checkout = await verifyCudaJsCheckout();
  await runPortable({ outputDirectory: portableDirectory });
  ensureOwnedBuildPath(nativeOutputDirectory);
  await rm(nativeOutputDirectory, { recursive: true, force: true });
  await mkdir(nativeOutputDirectory, { recursive: true });
  let packageEvidence = null;
  let consumerResult = null;
  let inspection = null;
  let cleanup = null;
  try {
    packageEvidence = await prepareConsumer();
    consumerResult = await command(process.execPath, [
      '--experimental-ffi',
      path.join(consumerDirectory, 'native-consumer.mjs'),
      portableDirectory,
      nativeOutputDirectory,
      path.join(consumerDirectory, 'fixtures'),
    ], { cwd: consumerDirectory, allowFailure: true });
    inspection = await inspectNativeArtifacts();
  } finally {
    cleanup = await cleanupConsumer();
  }
  const orchestration = {
    schemaVersion: 1,
    status: consumerResult?.code === 0 ? 'pass' : 'fail',
    cudaJsCheckout: checkout,
    package: packageEvidence && { filename: packageEvidence.filename, sha256: packageEvidence.sha256 },
    consumerExit: consumerResult && { code: consumerResult.code, signal: consumerResult.signal },
    inspection,
    cleanup,
  };
  await writeFile(path.join(nativeOutputDirectory, 'orchestration.json'), `${JSON.stringify(orchestration, null, 2)}\n`);
  if (consumerResult?.code !== 0) throw new Error(`Native consumer failed with exit code ${consumerResult?.code ?? 'unknown'}; evidence retained for diagnosis.`);
  console.log(`native_orchestration=pass cuda_js_revision=${checkout.revision} inspected_cubins=${Object.keys(inspection.artifacts).length}`);
  return orchestration;
}

export async function cleanupGeneratedEvidence() {
  const targets = [consumerDirectory, packageDirectory, portableDirectory, nativeOutputDirectory];
  for (const target of targets) {
    ensureOwnedBuildPath(target);
    await rm(target, { recursive: true, force: true });
  }
  await rmdir(buildRoot).catch((error) => { if (error.code !== 'ENOENT') throw error; });
  console.log(`generated_evidence_cleanup=pass root=${buildRoot}`);
}

const mode = process.argv[2] ?? 'portable';
if (mode === 'portable') await runPortable();
else if (mode === 'portable-check') await runPortable({ writeEvidence: false });
else if (mode === 'native') await runNative();
else if (mode === 'cleanup') await cleanupGeneratedEvidence();
else throw new Error(`Unknown mode ${mode}; expected portable, portable-check, native, or cleanup.`);

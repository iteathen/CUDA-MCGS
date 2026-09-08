import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';

const execFile = promisify(execFileCallback);
const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..', '..');
const gitCommand = process.platform === 'win32' ? 'git.exe' : 'git';

async function execNpm(args, options) {
  if (process.platform !== 'win32') return execFile('npm', args, options);
  const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  await access(npmCli);
  return execFile(process.execPath, [npmCli, ...args], options);
}

async function listFiles(root, current = root) {
  const result = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) result.push(...await listFiles(root, absolute));
    else if (entry.isFile()) result.push(path.relative(root, absolute).split(path.sep).join('/'));
  }
  return result.sort();
}

async function readGitBlob(relativePath) {
  const { stdout } = await execFile(gitCommand, ['-C', repositoryRoot, 'show', `HEAD:${relativePath}`], {
    encoding: 'buffer',
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}

let tempRoot = await mkdtemp(path.join(os.tmpdir(), 'cuda-mcgs-tensor-evaluator-package-'));
try {
  const packRoot = path.join(tempRoot, 'pack');
  const consumerRoot = path.join(tempRoot, 'consumer');
  await mkdir(packRoot, { recursive: true });
  await mkdir(consumerRoot, { recursive: true });

  const { stdout } = await execNpm(['pack', '--json', '--pack-destination', packRoot], {
    cwd: repositoryRoot,
    maxBuffer: 32 * 1024 * 1024,
  });
  const packed = JSON.parse(stdout);
  assert.equal(packed.length, 1, 'npm pack must produce one candidate artifact');
  const tarball = path.join(packRoot, packed[0].filename);

  await writeFile(path.join(consumerRoot, 'package.json'), `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`, 'utf8');
  await execNpm(['install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', tarball], {
    cwd: consumerRoot,
    maxBuffer: 32 * 1024 * 1024,
  });

  const shimPath = path.join(consumerRoot, 'consumer.mjs');
  await writeFile(shimPath, `
export * as tensorEvaluator from 'cuda-mcgs/evaluator/cuda-js-tensor';
export const packageJsonUrl = import.meta.resolve('cuda-mcgs/package.json');
export async function importConformanceReference() { return import('cuda-mcgs/conformance/cuda-js-tensor-evaluator/reference.mjs'); }
`, 'utf8');
  const shim = await import(`${pathToFileURL(shimPath).href}?run=${Date.now()}`);
  const packageJsonPath = fileURLToPath(shim.packageJsonUrl);
  const installedRoot = path.dirname(packageJsonPath);
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

  assert.equal(packageJson.name, 'cuda-mcgs');
  assert.equal(packageJson.version, '0.0.0-dev.0');
  assert.equal(typeof shim.tensorEvaluator.createTensorEvaluatorConnector, 'function');
  assert.equal(typeof shim.tensorEvaluator.TensorEvaluatorConnectorError, 'function');
  assert.equal(typeof shim.tensorEvaluator.createTensorEvaluatorRuntimeContribution, 'function');
  assert.equal(typeof shim.tensorEvaluator.tensorEvaluatorRuntimeConstants, 'object');
  assert.equal('createTensorEvaluatorReference' in shim.tensorEvaluator, false, 'conformance reference must not be a production export');
  await assert.rejects(access(path.join(installedRoot, 'conformance', 'cuda-js-tensor-evaluator')), (error) => error?.code === 'ENOENT');
  await assert.rejects(shim.importConformanceReference(), (error) => error?.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED');

  const installedFiles = await listFiles(installedRoot);
  const gitExactFiles = installedFiles.filter((relativePath) => relativePath !== 'package.json');
  for (const relativePath of gitExactFiles) {
    const installedBytes = await readFile(path.join(installedRoot, ...relativePath.split('/')));
    const gitBytes = await readGitBlob(relativePath);
    assert(installedBytes.equals(gitBytes), `installed package bytes differ from exact Git blob: ${relativePath}`);
  }

  console.log(JSON.stringify({
    schema: 'cuda-mcgs.tensor-evaluator-installed-package-evidence/0.1.0',
    status: 'pass',
    package: { name: packageJson.name, version: packageJson.version, filename: packed[0].filename, shasum: packed[0].shasum, entryCount: packed[0].entryCount },
    export: 'cuda-mcgs/evaluator/cuda-js-tensor',
    productionSurface: ['connector', 'device-runtime-contribution'],
    conformanceReference: 'physically-absent-and-not-exported',
    exactGitBlobFiles: gitExactFiles.length,
    claimLimits: ['installed-package-only', 'cuda-free', 'no-native-or-provider-qualification'],
  }));
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

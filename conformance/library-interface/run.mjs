import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { buildExactCompatiblePairCapsule } from '../cuda-js-compatible-pair/src/capsule.mjs';

const execFile = promisify(execFileCallback);
const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..', '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const gitCommand = process.platform === 'win32' ? 'git.exe' : 'git';
const cases = [];

async function runCase(id, body) {
  try {
    await body();
    cases.push({ id, status: 'pass' });
    console.log(`case=${id} result=pass`);
  } catch (error) {
    cases.push({ id, status: 'fail', error: { name: error?.name ?? null, code: error?.code ?? null, message: error?.message ?? String(error) } });
    console.error(`case=${id} result=fail error=${JSON.stringify(error?.message ?? String(error))}`);
  }
}

async function gitObject(...args) {
  const { stdout } = await execFile(gitCommand, ['-C', repositoryRoot, 'rev-parse', ...args], { maxBuffer: 1024 * 1024 });
  return stdout.trim();
}

async function installCandidate(tempRoot) {
  const packRoot = path.join(tempRoot, 'pack');
  const consumerRoot = path.join(tempRoot, 'consumer');
  await mkdir(packRoot, { recursive: true });
  await mkdir(consumerRoot, { recursive: true });
  const { stdout } = await execFile(npmCommand, ['pack', '--json', '--pack-destination', packRoot], {
    cwd: repositoryRoot,
    maxBuffer: 16 * 1024 * 1024,
  });
  const packed = JSON.parse(stdout);
  assert.equal(packed.length, 1, 'npm pack must produce exactly one artifact');
  const tarball = path.join(packRoot, packed[0].filename);
  await writeFile(path.join(consumerRoot, 'package.json'), JSON.stringify({ private: true, type: 'module' }, null, 2) + '\n', 'utf8');
  await execFile(npmCommand, ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', tarball], {
    cwd: consumerRoot,
    maxBuffer: 16 * 1024 * 1024,
  });
  const shimPath = path.join(consumerRoot, 'consumer.mjs');
  await writeFile(shimPath, `
export * as library from 'cuda-mcgs';
export * as compiler from 'cuda-mcgs/search-compiler';
export * as cudaJsRuntime from 'cuda-mcgs/runtime/cuda-js';
export const packageJsonUrl = import.meta.resolve('cuda-mcgs/package.json');
export const resolvedInputSchemaUrl = import.meta.resolve('cuda-mcgs/schemas/search-ir/0.2.0/resolved-composer-input.schema.json');
export async function importPrivateValidation() { return import('cuda-mcgs/components/search-compiler/src/validation.mjs'); }
export async function importTestingPort() { return import('cuda-mcgs/search-compiler/testing'); }
`, 'utf8');
  return { packed: packed[0], consumerRoot, shim: await import(`${pathToFileURL(shimPath).href}?run=${Date.now()}`) };
}

const revision = await gitObject('HEAD');
const tree = await gitObject('HEAD^{tree}');
assert.match(revision, /^[0-9a-f]{40}$/);
assert.match(tree, /^[0-9a-f]{40}$/);

const pair = {
  cudaMcgs: { repository: 'iteathen/CUDA-MCGS', revision, tree },
  cudaJs: {
    repository: 'iteathen/CUDA-JS',
    revision: '2ec2b9e7ffd3b6b5fe8d14364e2d758065d90e5c',
    tree: '05fe89ff91e538aedf003a17c5b8d40c725a4b24',
    package: 'cuda-js@0.1.0-alpha.18',
    apiSchema: '1',
  },
};

const capsule = await buildExactCompatiblePairCapsule(pair);
const canonicalResolved = capsule.composition.resolvedInput;
const profileTemplate = structuredClone(canonicalResolved.normalized.profile);
const explicitGenerator = structuredClone(profileTemplate.generator);
delete profileTemplate.generator;

let tempRoot = await mkdtemp(path.join(os.tmpdir(), 'cuda-mcgs-library-interface-'));
let installed;
try {
  installed = await installCandidate(tempRoot);
  const { library, compiler, cudaJsRuntime } = installed.shim;

  await runCase('LIB-C00-installed-package-identity', async () => {
    const packageJson = JSON.parse(await readFile(new URL(installed.shim.packageJsonUrl), 'utf8'));
    assert.equal(packageJson.name, 'cuda-mcgs');
    assert.equal(packageJson.version, '0.0.0-dev.0');
    assert.equal(packageJson.private, true);
    assert.equal(library.libraryConstants.contract, 'cuda-mcgs.library-interface/0.1.0');
    assert.equal(library.libraryConstants.version, '0.1.0');
    assert.equal(library.libraryConstants.resolverOwner, 'tool.search-compiler');
    assert.equal(library.libraryConstants.runtimeOwner, 'integration.cuda-js');
  });

  await runCase('LIB-C01-explicit-facade-canonical-equivalence', () => {
    const facade = library.resolve(structuredClone(profileTemplate), structuredClone(explicitGenerator));
    const direct = compiler.createResolvedComposerInput(structuredClone(profileTemplate), structuredClone(explicitGenerator));
    assert.deepEqual(facade, direct);
    assert.deepEqual(facade.identity, canonicalResolved.identity);
  });

  await runCase('LIB-C02-reference-default-explicit-equivalence', () => {
    const omitted = library.resolve(structuredClone(profileTemplate));
    const explicit = library.resolve(structuredClone(profileTemplate), structuredClone(library.referenceGenerator));
    const direct = compiler.createResolvedComposerInput(structuredClone(profileTemplate), structuredClone(compiler.composerConstants.referenceGenerator));
    assert.deepEqual(omitted, explicit);
    assert.deepEqual(omitted, direct);
    assert.deepEqual(library.referenceGenerator, compiler.composerConstants.referenceGenerator);
  });

  await runCase('LIB-C03-resolution-provenance-preserved', () => {
    const resolved = library.resolve(structuredClone(profileTemplate));
    assert.deepEqual(resolved.normalized.resolution.policy, {
      id: library.referenceGenerator.id,
      version: library.referenceGenerator.version,
      revision: library.referenceGenerator.revision,
    });
    assert.equal(resolved.normalized.resolution.rules.length, 3);
    for (const rule of resolved.normalized.resolution.rules) {
      assert.equal(rule.owner, library.referenceGenerator.id);
      assert.equal(rule.version, library.referenceGenerator.version);
      assert.equal(rule.revision, library.referenceGenerator.revision);
      assert.equal(rule.selection, 'default-equivalent');
      assert.equal(rule.material, true);
      assert.match(rule.reason, /^composer\.reason\./);
    }
  });

  await runCase('LIB-F01-content-sensitive-explicit-generator', () => {
    const baseline = library.resolve(structuredClone(profileTemplate), structuredClone(explicitGenerator));
    const changedGenerator = structuredClone(explicitGenerator);
    changedGenerator.maxCallDepth = String(BigInt(changedGenerator.maxCallDepth) + 1n);
    const changed = library.resolve(structuredClone(profileTemplate), changedGenerator);
    assert.notDeepEqual(changed.identity, baseline.identity);
  });

  await runCase('LIB-F02-owned-try-resolve-diagnostic', () => {
    const facade = library.tryResolve({});
    const direct = compiler.tryCreateResolvedComposerInput({}, structuredClone(compiler.composerConstants.referenceGenerator));
    assert.deepEqual(facade, direct);
    assert.equal(facade.status, 'failure');
    assert.equal(facade.resolvedInput, null);
    assert.equal(typeof facade.diagnostic.code, 'string');
    assert.equal(typeof facade.diagnostic.message, 'string');
  });

  await runCase('LIB-C04-compose-is-canonical-owner-port', () => {
    assert.equal(library.compose, compiler.composeResolvedEngine);
    assert.equal(library.tryCompose, compiler.tryComposeResolvedEngine);
  });

  await runCase('LIB-C05-complete-surface-real-engine-package', () => {
    const profile = capsule.composition.compositionProfile;
    const program = compiler.composeSearchProgram(profile);
    const executionPackage = compiler.buildExecutionPackage(profile, program);
    assert.deepEqual(program.identity, capsule.composition.searchProgram.identity);
    assert.deepEqual(executionPackage.identity, capsule.composition.executionPackage.identity);
    assert.equal(executionPackage.normalized.schema, 'cuda-mcgs.execution-package/0.2.0');
  });

  await runCase('LIB-C06-runtime-adapter-remains-explicit-subpath', () => {
    assert.equal(typeof cudaJsRuntime.prepareCudaJsExecution, 'function');
    assert.equal(typeof cudaJsRuntime.CudaJsRuntimeAdapterError, 'function');
    assert.equal('cudaJs' in library, false);
    assert.equal('runtime' in library, false);
  });

  await runCase('LIB-C07-versioned-schema-subpath', async () => {
    const schema = JSON.parse(await readFile(new URL(installed.shim.resolvedInputSchemaUrl), 'utf8'));
    assert.equal(schema.properties.schema.const, 'cuda-mcgs.resolved-composer-input/0.2.0');
    assert.equal(schema.additionalProperties, false);
  });

  await runCase('LIB-F03-private-deep-import-rejected', async () => {
    await assert.rejects(installed.shim.importPrivateValidation(), (error) => error?.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED');
  });

  await runCase('LIB-F04-testing-port-not-exported', async () => {
    await assert.rejects(installed.shim.importTestingPort(), (error) => error?.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED');
  });
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

await runCase('LIB-C08-temporary-artifact-cleanup', async () => {
  await assert.rejects(access(tempRoot));
});

const failed = cases.filter(({ status }) => status !== 'pass');
const summary = {
  schema: 'cuda-mcgs.library-interface-conformance/0.1.0',
  source: { revision, tree },
  package: { name: 'cuda-mcgs', version: '0.0.0-dev.0' },
  contract: 'cuda-mcgs.library-interface/0.1.0',
  node: process.version,
  platform: `${process.platform}-${process.arch}`,
  evidence: {
    canonicalResolvedInput: canonicalResolved.identity.sha256,
    compositionProfile: capsule.composition.compositionProfile.identity.sha256,
    searchProgram: capsule.composition.searchProgram.identity.sha256,
    executionPackage: capsule.composition.executionPackage.identity.sha256,
  },
  cases,
};
console.log(JSON.stringify(summary));
if (failed.length > 0) {
  const error = new Error(`library-interface conformance failed: ${failed.map(({ id }) => id).join(', ')}`);
  error.code = 'LIBRARY_INTERFACE_CONFORMANCE';
  throw error;
}

#!/usr/bin/env node
import assert from 'node:assert/strict';

import { prepareCudaJsExecution } from '../../adapters/runtimes/cuda-js/index.mjs';
import { PEER, call, clone, executionPackage, publicCudaJsFake } from './src/fixture.mjs';

const OWNER = 'evaluator.tensor';
const IMPORT_ID = 'device-import.tensor';
const ALIAS = 'mcgsTensorRunItem';
const LIBRARY_SHA = 'b'.repeat(64);
const ARTIFACT_SHA = 'c'.repeat(64);

function declaration(overrides = {}) {
  const base = {
    schema: 'cuda-mcgs.device-js-import-declaration/0.1.0',
    id: IMPORT_ID,
    ownerProfile: OWNER,
    importName: 'tensorRunItem',
    alias: ALIAS,
    library: {
      contract: 'SPEC-0009-item-parallel-device-tensor-program-v1',
      sha256: LIBRARY_SHA,
      format: 'ptx',
      architecture: 'compute_75',
      artifactSha256: ARTIFACT_SHA,
    },
  };
  return { ...base, ...overrides, library: { ...base.library, ...(overrides.library ?? {}) } };
}

function liveImport(overrides = {}) {
  const bytes = new Uint8Array([9, 8, 7]);
  const library = {
    schemaVersion: 1,
    contract: 'SPEC-0009-item-parallel-device-tensor-program-v1',
    sha256: LIBRARY_SHA,
    format: 'ptx',
    architecture: 'compute_75',
    exports: [{ name: 'tensorRunItem', parameters: [{ name: 'itemIndex', type: 'u32' }], returns: 'u32' }],
    artifact: { format: 'ptx', architecture: 'compute_75', sha256: ARTIFACT_SHA, byteLength: bytes.byteLength, bytes },
  };
  return {
    library: { ...library, ...(overrides.library ?? {}), artifact: { ...library.artifact, ...(overrides.library?.artifact ?? {}) } },
    name: overrides.name ?? 'tensorRunItem',
    as: overrides.as ?? ALIAS,
  };
}

function importedPackage(declarations = [declaration()]) {
  const value = executionPackage();
  value.semantic = { selectedProfiles: [{ id: OWNER }] };
  value.cudaJsAdapter.searchProgram.deviceImports = declarations;
  return value;
}

async function prepare(pkg, fake, deviceImports) {
  return prepareCudaJsExecution(pkg, { cudaJs: fake.cudaJs, peer: PEER, deviceImports });
}

const actual = liveImport();
const exactFake = publicCudaJsFake();
const prepared = await prepare(importedPackage(), exactFake, [actual]);
const compile = call(exactFake, 'compileDeviceProgram');
assert(compile, 'compileDeviceProgram was not reached for a valid declared import');
assert.equal(compile[1].imports.length, 1);
assert.strictEqual(compile[1].imports[0], actual, 'adapter must forward the exact opaque public DeviceJsImport object');
await prepared.close();

const noImportFake = publicCudaJsFake();
const noImportPrepared = await prepareCudaJsExecution(executionPackage(), { cudaJs: noImportFake.cudaJs, peer: PEER });
assert.equal(Object.hasOwn(call(noImportFake, 'compileDeviceProgram')[1], 'imports'), false, 'no-import compile request must remain structurally unchanged');
await noImportPrepared.close();

const emptyImportFake = publicCudaJsFake();
const emptyImportPrepared = await prepareCudaJsExecution(executionPackage(), { cudaJs: emptyImportFake.cudaJs, peer: PEER, deviceImports: [] });
assert.equal(Object.hasOwn(call(emptyImportFake, 'compileDeviceProgram')[1], 'imports'), false, 'explicit empty runtime imports must not change the lower no-import request');
await emptyImportPrepared.close();

for (const [label, pkg, supplied, code] of [
  ['missing', importedPackage(), [], 'CUDA_JS_ADAPTER_IMPORT_COUNT'],
  ['undeclared', executionPackage(), [liveImport()], 'CUDA_JS_ADAPTER_IMPORT_UNDECLARED'],
  ['extra', importedPackage(), [liveImport(), liveImport({ as: 'otherAlias' })], 'CUDA_JS_ADAPTER_IMPORT_COUNT'],
  ['identity-drift', importedPackage(), [liveImport({ library: { sha256: 'd'.repeat(64) } })], 'CUDA_JS_ADAPTER_IMPORT_IDENTITY'],
  ['artifact-drift', importedPackage(), [liveImport({ library: { artifact: { sha256: 'd'.repeat(64) } } })], 'CUDA_JS_ADAPTER_IMPORT_IDENTITY'],
  ['name-drift', importedPackage(), [liveImport({ name: 'otherExport' })], 'CUDA_JS_ADAPTER_IMPORT_IDENTITY'],
  ['alias-drift', importedPackage(), [liveImport({ as: 'otherAlias' })], 'CUDA_JS_ADAPTER_IMPORT_MISSING'],
  ['unselected-owner', importedPackage([declaration({ ownerProfile: 'evaluator.not-selected' })]), [liveImport()], 'CUDA_JS_ADAPTER_IMPORT_DECLARATION'],
  ['local-alias-collision', importedPackage([declaration({ alias: 'engine_step' })]), [liveImport({ as: 'engine_step' })], 'CUDA_JS_ADAPTER_IMPORT_DECLARATION'],
]) {
  const fake = publicCudaJsFake();
  await assert.rejects(() => prepare(pkg, fake, supplied), { code }, label);
  assert.equal(fake.calls.length, 0, `${label} must fail before any lower CUDA-JS call`);
}

const duplicatePackage = importedPackage([
  declaration({ id: 'device-import.tensor-a', alias: 'importA' }),
  declaration({ id: 'device-import.tensor-b', alias: 'importB' }),
]);
const duplicateFake = publicCudaJsFake();
await assert.rejects(
  () => prepare(duplicatePackage, duplicateFake, [liveImport({ as: 'importA' }), liveImport({ as: 'importA' })]),
  { code: 'CUDA_JS_ADAPTER_IMPORT_DUPLICATE' },
);
assert.equal(duplicateFake.calls.length, 0);

const retryFake = publicCudaJsFake();
const retryPackage = importedPackage();
await assert.rejects(
  () => prepare(retryPackage, retryFake, [liveImport({ library: { contract: 'wrong-contract' } })]),
  { code: 'CUDA_JS_ADAPTER_IMPORT_IDENTITY' },
);
assert.equal(retryFake.calls.length, 0, 'failed admission must leave the lower fake untouched for retry');
const retryActual = liveImport();
const retryPrepared = await prepare(retryPackage, retryFake, [retryActual]);
assert.strictEqual(call(retryFake, 'compileDeviceProgram')[1].imports[0], retryActual);
await retryPrepared.close();

const mutatedPackage = importedPackage();
mutatedPackage.cudaJsAdapter.searchProgram.deviceImports = clone(mutatedPackage.cudaJsAdapter.searchProgram.deviceImports);
mutatedPackage.cudaJsAdapter.searchProgram.deviceImports[0].library.sha256 = 'f'.repeat(64);
const mutationFake = publicCudaJsFake();
await assert.rejects(() => prepare(mutatedPackage, mutationFake, [liveImport()]), { code: 'CUDA_JS_ADAPTER_IMPORT_IDENTITY' });
assert.equal(mutationFake.calls.length, 0);

console.log('cuda_js_device_imports=pass admission=pre-lower forwarding=opaque-exact retry=clean no_import=unchanged');

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { servicePackage } from './service-composition.mjs';
import { recordingPeer, prepare } from './runtime-composition.mjs';

// CUDA-free inspection using only the selected peer's declared public export.
// Caller/CI supplies a checkout or archive of the exact compatible-pair revision.
const root = path.resolve(process.argv[2]);
const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
assert.equal(manifest.name, 'cuda-js');
assert.equal(manifest.version, '0.1.0-alpha.19');
const publicCudaJs = await import(pathToFileURL(path.resolve(root, manifest.exports['.'].import)).href);
for (const reuse of [false, true]) {
  const fake = recordingPeer();
  let inspected = false;
  fake.cudaJs.inspectDeviceProgram = (request) => {
    let result;
    try { result = publicCudaJs.inspectDeviceProgram(request); }
    catch (error) {
      if (error.details?.line) console.error('Rejected source:', request.source.split('\n')[error.details.line - 1]);
      throw error;
    }
    inspected = true;
    return result;
  };
  const pkg = servicePackage({ reuse });
  const execution = await prepare(pkg, fake);
  assert(inspected);
  assert.equal((await execution.close()).status, 'complete');
  console.log(`tensor_public_frontend=pass reuse=${reuse} source=${pkg.program.sourceIdentity.sha256} native=false`);
}

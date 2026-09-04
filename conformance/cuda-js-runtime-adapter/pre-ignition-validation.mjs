import assert from 'node:assert/strict';

import { CudaJsRuntimeAdapterError, prepareCudaJsExecution } from '../../adapters/runtimes/cuda-js/index.mjs';
import { PEER, calls, executionPackage, publicCudaJsFake } from './src/fixture.mjs';

const fake = publicCudaJsFake();
const value = executionPackage();
value.cudaJsAdapter.resourceRequirements[0].accessRequirements = ['read'];
value.cudaJsAdapter.operationRequirements[0].bindings.find(({ parameter }) => parameter === 'output').source.access = 'read';
value.cudaJsAdapter.searchProgram.source = 'function engine_step(output, limit, frameworkCancellation) { output[gpu.thread.globalX()] = limit; }\n';
value.cudaJsAdapter.searchProgram.functions[0].parameters.splice(1, 0, { name: 'limit', type: 'u32' });
value.cudaJsAdapter.operationRequirements[0].bindings.unshift({
  parameter: 'limit',
  source: { kind: 'scalar', schema: { id: 'cuda-mcgs.synthetic-u32/0.1.0', version: '0.1.0', sha256: 'b'.repeat(64) } },
});

const prepared = await prepareCudaJsExecution(value, { cudaJs: fake.cudaJs, peer: PEER });
let caught = null;
try {
  await prepared.ignite({ resources: { 'resource.output': new Uint8Array(16).fill(3) } });
} catch (error) {
  caught = error;
}
assert.ok(caught instanceof CudaJsRuntimeAdapterError);
assert.equal(caught.code, 'CUDA_JS_ADAPTER_INPUT');
assert.equal(calls(fake, 'memory.write').length, 0, 'all runtime inputs must validate before the first lower memory write');
assert.equal(calls(fake, 'function.submit').length, 0);
assert.equal(prepared.state, 'prepared');

await prepared.ignite({
  resources: { 'resource.output': new Uint8Array(16).fill(3) },
  scalars: { 'operation.engine-step': { limit: 9 } },
});
assert.equal(calls(fake, 'memory.write').length, 1);
assert.equal(calls(fake, 'function.submit').length, 1);
await prepared.close();

console.log('CUDA-JS runtime adapter pre-ignition validation: passed.');

import assert from 'node:assert/strict';
import { composedExecution, compositionFixture } from './operation-composition.mjs';
import { prepareCudaJsExecution } from '../../adapters/runtimes/cuda-js/index.mjs';
import { PEER, publicCudaJsFake } from '../cuda-js-runtime-adapter/src/fixture.mjs';

const widths = { u32: 4, u64: 8, f32: 4, i32: 4, f64: 8, f16: 2, bf16: 2 };
export function recordingPeer({ beforeWrite, viewCloseError = false, submit } = {}) {
  const fake = publicCudaJsFake();
  const memories = [];
  const open = fake.cudaJs.openCudaRuntime.bind(fake.cudaJs);
  fake.cudaJs.openCudaRuntime = async (...args) => {
    const runtime = await open(...args);
    const allocate = runtime.allocateDevice.bind(runtime);
    runtime.allocateDevice = async (options) => {
      const memory = await allocate(options);
      const storage = new Uint8Array(options.byteLength);
      memories.push(storage);
      const write = memory.write.bind(memory);
      memory.write = async (bytes) => { await beforeWrite?.(bytes); storage.set(bytes); return write(bytes); };
      memory.view = async (view) => {
        fake.calls.push(['memory.view', view]);
        return { kind: 'device-view', ...view, byteLength: view.elementCount * widths[view.dtype], storage,
          async close() { fake.calls.push(['view.close']); if (viewCloseError) throw new Error('injected view close failure'); return { state: 'closed' }; } };
      };
      return memory;
    };
    if (submit) {
      const load = runtime.loadModule.bind(runtime);
      runtime.loadModule = async (options) => {
        const module = await load(options); const getFunction = module.getFunction.bind(module);
        module.getFunction = async (descriptor) => {
          const fn = await getFunction(descriptor); const original = fn.submit.bind(fn);
          fn.submit = async (launch) => { await submit(launch); return original(launch); };
          return fn;
        };
        return module;
      };
    }
    return runtime;
  };
  return { ...fake, memories };
}

export function initialInputs(pkg = composedExecution.normalized) {
  const adapter = pkg.cudaJsAdapter;
  const used = new Set(adapter.operationRequirements[0].bindings.filter(({ source }) => source.kind === 'resource').map(({ source }) => source.resource));
  const resources = Object.fromEntries(adapter.resourceRequirements.filter(({ id }) => used.has(id)).map(({ id, byteLength }) => [id, new Uint8Array(Number(byteLength))]));
  const weights = adapter.operationRequirements[0].bindings.find(({ parameter }) => parameter === 'weights').source;
  resources[weights.resource].set(compositionFixture.owners.artifactPayload, Number(weights.view.byteOffset));
  return { resources };
}
export const liveImports = () => [compositionFixture.owners.runtime.device.createDeviceImport()];
export const prepare = (pkg, fake) => prepareCudaJsExecution(pkg, { cudaJs: fake.cudaJs, peer: PEER, deviceImports: liveImports() });

const fake = recordingPeer();
const execution = await prepare(composedExecution.normalized, fake);
const bad = initialInputs();
const weights = composedExecution.normalized.cudaJsAdapter.operationRequirements[0].bindings.find(({ parameter }) => parameter === 'weights').source;
bad.resources[weights.resource][Number(weights.view.byteOffset)] ^= 1;
await assert.rejects(() => execution.ignite(bad), (error) => error.code === 'CUDA_JS_ADAPTER_INPUT');
assert.equal(fake.calls.filter(([name]) => name === 'memory.write' || name === 'function.submit').length, 0, 'hash rejection must precede every write and submission');
await execution.ignite(initialInputs());
assert.equal(fake.calls.filter(([name]) => name === 'function.submit').length, 1);
await execution.wait();
assert.equal((await execution.close()).status, 'complete');
const names = fake.calls.map(([name]) => name);
assert(names.lastIndexOf('view.close') < names.indexOf('memory.close'));
assert(names.lastIndexOf('memory.close') < names.indexOf('runtime.close'));

const inputs = initialInputs();
let firstWrite = true;
const mutating = recordingPeer({ beforeWrite: async () => { if (firstWrite) { firstWrite = false; for (const bytes of Object.values(inputs.resources)) bytes.fill(99); await Promise.resolve(); } } });
const snapshotExecution = await prepare(composedExecution.normalized, mutating);
await snapshotExecution.ignite(inputs);
const writes = mutating.calls.filter(([name]) => name === 'memory.write');
assert(writes.every(([, , , bytes]) => !bytes.includes(99)), 'caller mutation during an asynchronous upload must not affect any admitted snapshot');
await snapshotExecution.wait();
assert.equal((await snapshotExecution.close()).status, 'complete');

const failure = recordingPeer({ viewCloseError: true });
const failedExecution = await prepare(composedExecution.normalized, failure);
await failedExecution.ignite(initialInputs()); await failedExecution.wait();
const report = await failedExecution.close();
assert.equal(report.status, 'quarantined');
assert(report.retained.includes('runtime'));
assert.equal(failure.calls.filter(([name]) => name === 'memory.close' || name === 'runtime.close').length, 0);
console.log('tensor_runtime_composition=pass digest=before-any-write snapshots=before-async one-submit=true cleanup=dependency-ordered-or-quarantined');

const zeroFake = recordingPeer();
const zeroExecution = await prepare(composedExecution.normalized, zeroFake);
const nonzero = initialInputs();
const zeroSource = composedExecution.normalized.cudaJsAdapter.operationRequirements[0].bindings.find(({ source }) => source.initialization === 'zero').source;
nonzero.resources[zeroSource.resource][Number(zeroSource.view.byteOffset)] = 1;
await assert.rejects(() => zeroExecution.ignite(nonzero), { code: 'CUDA_JS_ADAPTER_INPUT' });
assert.equal(zeroFake.calls.filter(([name]) => name === 'memory.write').length, 0);
assert.equal((await zeroExecution.close()).status, 'complete');

for (const mutate of [
  (pkg) => { pkg.cudaJsAdapter.operationRequirements[0].launchPolicy.grid[0] = '2'; },
  (pkg) => { pkg.cudaJsAdapter.operationRequirements[0].bindings.find(({ source }) => source.initialContentSha256).source.access = 'read-write'; },
  (pkg) => { pkg.cudaJsAdapter.operationRequirements[0].bindings.find(({ source }) => source.deviceEffects).source.deviceEffects = ['atomic-release-system']; },
]) {
  const value = structuredClone(composedExecution.normalized); mutate(value);
  const rejected = recordingPeer();
  await assert.rejects(() => prepare(value, rejected), { code: 'CUDA_JS_ADAPTER_PACKAGE' });
  assert.equal(rejected.calls.length, 0, 'malformed projected contracts reject before any lower work');
}

let resumeWrite, signalWrite;
const started = new Promise((resolve) => { signalWrite = resolve; });
const pending = new Promise((resolve) => { resumeWrite = resolve; });
const concurrent = recordingPeer({ beforeWrite: async () => { signalWrite(); await pending; } });
const concurrentExecution = await prepare(composedExecution.normalized, concurrent);
const firstIgnition = concurrentExecution.ignite(initialInputs());
await started;
await assert.rejects(() => concurrentExecution.ignite(initialInputs()), { code: 'CUDA_JS_ADAPTER_STATE' });
resumeWrite(); await firstIgnition; await concurrentExecution.wait();
assert.equal(concurrent.calls.filter(([name]) => name === 'function.submit').length, 1);
assert.equal((await concurrentExecution.close()).status, 'complete');
console.log('tensor_runtime_rejection=pass zero-before-writes=true launch-before-lower=true simultaneous-ignition=rejected');

export const CUDA_JS_REVISION = '49a2f77d2c8364d67030fbc1c2e870e58e70d334';
export const CUDA_JS_PACKAGE = 'cuda-js@0.1.0-alpha.18';
export const PEER = Object.freeze({ repository: 'iteathen/CUDA-JS', revision: CUDA_JS_REVISION, package: CUDA_JS_PACKAGE });

export function executionPackage() {
  return {
    schema: 'cuda-mcgs.execution-package/0.2.0',
    status: 'accepted',
    compatibility: { cudaJs: { ...PEER }, apiSchema: '1', capabilityNegotiation: 'pre-allocation-fail-closed', fallback: 'none' },
    cudaJsAdapter: {
      schema: 'cuda-mcgs.cuda-js-adapter-requirements/0.2.0',
      publicContracts: [
        { id: 'cuda-js.device-js/0.1.0' },
        { id: 'cuda-js.operation-lifecycle/0.1.0' },
        { id: 'cuda-js.publication-mailbox/0.1.0' },
        { id: 'cuda-js.device-publication-release-acquire/0.1.0' },
      ],
      searchProgram: {
        source: 'function engine_step(output, frameworkCancellation) { gpu.mailbox.loadAcquireSystem(frameworkCancellation); output[gpu.thread.globalX()] = 0; }\n',
        functions: [{
          name: 'engine_step', executionRole: 'runtime-entry',
          parameters: [
            { name: 'output', type: 'ptr<u32>' },
            { name: 'frameworkCancellation', type: 'sideband<host-to-device,u32>', sidebandRole: 'framework-cancellation' },
          ],
          returns: 'void', sourceUnit: 'source.synthetic.engine-entry', ownerProfile: 'program-package.synthetic', semanticRole: 'engine.execute', calls: [], helpers: ['gpu.thread.global-x', 'gpu.mailbox.load-acquire-system'],
        }],
      },
      resourceRequirements: [{
        id: 'resource.output', ownerProfile: 'resource.synthetic', providerRequirement: 'provider.device', byteLength: '16', alignment: '16', memorySpaces: ['device-search'], accessRequirements: ['write'],
      }],
      sidebandRequirements: [{
        id: 'sideband.framework-cancellation', semanticOwner: 'progress.synthetic', role: 'framework-cancellation', direction: 'host-to-device', valueType: 'u32', capacity: '1', publication: 'release-acquire', lifetime: 'operation', residentResource: null,
      }],
      operationRequirements: [{
        id: 'operation.engine-step', function: 'engine_step',
        bindings: [
          { parameter: 'frameworkCancellation', source: { kind: 'sideband', sideband: 'sideband.framework-cancellation' } },
          { parameter: 'output', source: { kind: 'resource', resource: 'resource.output', access: 'write' } },
        ],
        launchPolicy: { grid: ['1', '1', '1'], block: ['64', '1', '1'], dynamicSharedBytes: '0', maxPending: '1' },
      }],
      searchLifecycle: { ignition: 'device-owned', cancellation: 'bounded-external-intent', completion: 'device-owned-closure' },
    },
  };
}

function lowerError(code, category = 'provider', operation = 'test') {
  return Object.assign(new Error(code), { code, category, operation, healthBefore: 'healthy', healthAfter: 'degraded', details: { source: 'portable-fake' } });
}

export function publicCudaJsFake(flags = {}) {
  const calls = [];
  const mailboxValues = new Map();
  let memoryIndex = 0;
  let mailboxIndex = 0;
  const push = (...entry) => calls.push(entry);
  const operation = {
    kind: 'gpu-operation', state: 'pending',
    async status() { push('operation.status'); return flags.statusResult ?? { schemaVersion: 1, status: 'pending', pollCount: 0, elapsedMilliseconds: 0, operationSequence: 1, health: { state: 'healthy' } }; },
    async wait() {
      push('operation.wait');
      if (flags.waitError) throw flags.waitError === true ? lowerError('CUDA_JS_WAIT_FAILED', 'operation', 'wait') : flags.waitError;
      return flags.waitResult ?? { schemaVersion: 1, status: 'completed', pollCount: 1, elapsedMilliseconds: 1, operationSequence: 1, health: { state: 'healthy' } };
    },
    async close() {
      push('operation.close');
      if (flags.operationCloseError) throw flags.operationCloseError === true ? lowerError('CUDA_JS_OPERATION_CLOSE_FAILED', 'cleanup', 'operation.close') : flags.operationCloseError;
      return { state: 'closed' };
    },
  };
  function memory(byteLength) {
    const id = `memory-${memoryIndex++}`;
    return {
      kind: 'device-memory', byteLength, state: 'open',
      async write(bytes) {
        push('memory.write', id, bytes.byteLength, [...bytes]);
        if (flags.writeError) throw flags.writeError === true ? lowerError('CUDA_JS_WRITE_FAILED', 'allocation', 'memory.write') : flags.writeError;
        return { byteLength: bytes.byteLength };
      },
      async close() { push('memory.close', id); return { state: 'closed' }; },
    };
  }
  function mailbox(lanes) {
    const id = `mailbox-${mailboxIndex++}`;
    for (const lane of lanes) mailboxValues.set(lane.name, 0);
    return {
      kind: 'publication-mailbox', lanes, state: 'open',
      store(name, value) { push('mailbox.store', id, name, value); mailboxValues.set(name, value); return value; },
      load(name) { push('mailbox.load', id, name); return mailboxValues.get(name); },
      async close() { push('mailbox.close', id); return { state: 'closed' }; },
    };
  }
  const runtime = {
    state: 'open', compilerEnabled: true,
    async loadModule(options) {
      push('runtime.loadModule', options);
      if (flags.loadError) throw flags.loadError === true ? lowerError('CUDA_JS_LOAD_FAILED', 'compiler', 'loadModule') : flags.loadError;
      return {
        kind: 'module', state: 'open',
        async getFunction(options2) {
          push('module.getFunction', options2);
          if (flags.functionError) throw flags.functionError === true ? lowerError('CUDA_JS_FUNCTION_FAILED', 'compiler', 'getFunction') : flags.functionError;
          return {
            kind: 'function', name: options2.name, parameters: options2.parameters, state: 'open',
            async submit(options3) {
              push('function.submit', options3);
              if (flags.submitError) throw flags.submitError === true ? lowerError('CUDA_JS_SUBMIT_FAILED', 'operation', 'submit') : flags.submitError;
              return operation;
            },
            async close() { push('function.close'); return { state: 'closed' }; },
          };
        },
        async close() { push('module.close'); return { state: 'closed' }; },
      };
    },
    async allocateDevice(options) {
      push('runtime.allocateDevice', options);
      if (flags.allocationError) throw flags.allocationError === true ? lowerError('CUDA_JS_ALLOCATE_FAILED', 'allocation', 'allocateDevice') : flags.allocationError;
      return memory(options.byteLength);
    },
    async createPublicationMailbox(options) {
      push('runtime.createPublicationMailbox', options);
      if (flags.mailboxError) throw flags.mailboxError === true ? lowerError('CUDA_JS_MAILBOX_FAILED', 'allocation', 'createPublicationMailbox') : flags.mailboxError;
      return mailbox(options.lanes);
    },
    async close() {
      push('runtime.close');
      if (flags.runtimeCloseError) throw flags.runtimeCloseError === true ? lowerError('CUDA_JS_RUNTIME_CLOSE_FAILED', 'cleanup', 'runtime.close') : flags.runtimeCloseError;
      return flags.runtimeCloseResult ?? { schemaVersion: 1, graceful: true, restartRequired: false, state: 'closed', compiler: {}, driver: {} };
    },
  };
  const cudaJs = {
    CUDA_JS_COMPATIBILITY: {
      schemaVersion: 1,
      package: { name: 'cuda-js', version: '0.1.0-alpha.18' },
      publicApi: { schemaVersion: 1, entries: ['cuda-js', 'cuda-js/compatibility', 'cuda-js/testing'] },
      capabilities: {
        deviceMemoryAllocationMinimumAlignmentBytes: 256,
        deviceJsFrontend: 'restricted-device-js-publication',
        gpuOperationLifecycle: 'opaque-submit-status-wait-close-one-pending',
        publicationMailboxes: 'private-mapped-named-u32-one-operation-lease-system-acquire-release',
      },
    },
    async openCudaRuntime(options) {
      push('openCudaRuntime', options);
      if (flags.openError) throw flags.openError === true ? lowerError('CUDA_JS_OPEN_FAILED', 'provider', 'openCudaRuntime') : flags.openError;
      return runtime;
    },
    async compileDeviceProgram(_runtime, request) {
      push('compileDeviceProgram', request);
      if (flags.compileError) throw flags.compileError === true ? lowerError('CUDA_JS_COMPILE_FAILED', 'compiler', 'compileDeviceProgram') : flags.compileError;
      const entry = request.functions.find(({ kind }) => kind === 'kernel');
      const parameters = entry.parameters.map(({ type }) => ({
        kind: type.startsWith('ptr<') ? 'device-memory'
          : type === 'mailbox<host-to-device,u32>' ? 'publication-mailbox-host-to-device-u32'
          : type === 'mailbox<device-to-host,u32>' ? 'publication-mailbox-device-to-host-u32'
          : type,
      }));
      return {
        schemaVersion: 1,
        deviceProgram: { kernels: [{ functionName: entry.name, name: `kernel_${entry.name}`, parameters }] },
        compiler: { artifact: { format: 'ptx', bytes: new Uint8Array([1, 2, 3]), byteLength: 3, sha256: 'a'.repeat(64), architecture: 'compute_75' } },
      };
    },
  };
  return { cudaJs, calls, operation, mailboxValues };
}

export function clone(value) { return structuredClone(value); }
export function call(fake, name) { return fake.calls.find((entry) => entry[0] === name); }
export function calls(fake, name) { return fake.calls.filter((entry) => entry[0] === name); }

import { createHash } from 'node:crypto';

function sha256Bytes(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sha256Text(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function byteFacts(value, { exact = false } = {}) {
  if (!(value instanceof Uint8Array)) return null;
  return Object.freeze({
    byteLength: value.byteLength,
    sha256: sha256Bytes(value),
    ...(exact ? { hex: Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('hex') } : {}),
  });
}

function clonePublic(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value !== 'object') return value;
  if (value instanceof Uint8Array) return byteFacts(value, { exact: true });
  if (Array.isArray(value)) return value.map(clonePublic);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'generatedSource')
      .map(([key, child]) => [key, clonePublic(child)]),
  );
}

function errorFacts(error) {
  if (!error || typeof error !== 'object') return { message: String(error) };
  const output = { name: error.name ?? 'Error', message: error.message ?? String(error) };
  for (const key of ['code', 'category', 'operation', 'healthBefore', 'healthAfter']) if (error[key] !== undefined) output[key] = clonePublic(error[key]);
  if (error.details !== undefined) output.details = clonePublic(error.details);
  return Object.freeze(output);
}

function artifactFacts(artifact) {
  if (!artifact || typeof artifact !== 'object') return null;
  const bytes = byteFacts(artifact.bytes);
  return Object.freeze({
    format: artifact.format ?? null,
    byteLength: artifact.byteLength ?? artifact.bytes?.byteLength ?? null,
    sha256: artifact.sha256 ?? null,
    bytesSha256: bytes?.sha256 ?? null,
    architecture: artifact.architecture ?? null,
    relocatableDeviceCode: artifact.relocatableDeviceCode ?? null,
    producer: clonePublic(artifact.producer ?? null),
  });
}

function compilerFacts(result) {
  if (!result || typeof result !== 'object') return null;
  const { artifact, ...rest } = result;
  return Object.freeze({ ...clonePublic(rest), artifact: artifactFacts(artifact) });
}

function deviceProgramFacts(deviceProgram) {
  if (!deviceProgram || typeof deviceProgram !== 'object') return null;
  const allowed = ['schemaVersion', 'contract', 'sha256', 'architecture', 'parser', 'functions', 'kernels', 'imports'];
  return Object.freeze(Object.fromEntries(
    allowed.filter((key) => Object.hasOwn(deviceProgram, key)).map((key) => [key, clonePublic(deviceProgram[key])]),
  ));
}

function moduleFacts(module) {
  if (!module || typeof module !== 'object') return null;
  return Object.freeze({
    kind: module.kind ?? null,
    format: module.format ?? null,
    byteLength: module.byteLength ?? null,
    sha256: module.sha256 ?? null,
    state: module.state ?? null,
  });
}

function requestFacts(request) {
  return Object.freeze({
    source: typeof request?.source === 'string'
      ? Object.freeze({ byteLength: Buffer.byteLength(request.source, 'utf8'), sha256: sha256Text(request.source) })
      : null,
    functions: clonePublic(request?.functions ?? null),
    imports: clonePublic(request?.imports ?? null),
    compile: clonePublic(request?.compile ?? null),
  });
}

export function createPublicCudaJsRecorder(publicCudaJs) {
  if (!publicCudaJs || typeof publicCudaJs !== 'object') throw new TypeError('public CUDA-JS namespace is required');

  const actualByWrapper = new WeakMap();
  const wrapperByActual = new WeakMap();
  const metadataByWrapper = new WeakMap();
  const counters = new Map();
  const evidence = {
    compatibility: clonePublic(publicCudaJs.CUDA_JS_COMPATIBILITY),
    openOptions: [],
    runtimeDescriptions: [],
    compileRequests: [],
    compilerResults: [],
    moduleLoads: [],
    functionLookups: [],
    allocations: [],
    memoryWrites: [],
    memoryReadsAsync: [],
    mailboxes: [],
    mailboxStores: [],
    mailboxLoads: [],
    functionSubmits: [],
    operationEvents: [],
    resourceCloses: [],
    runtimeClose: [],
  };

  function nextId(kind) {
    const value = counters.get(kind) ?? 0;
    counters.set(kind, value + 1);
    return `${kind}-${value}`;
  }

  function bind(wrapper, actual, metadata) {
    actualByWrapper.set(wrapper, actual);
    wrapperByActual.set(actual, wrapper);
    metadataByWrapper.set(wrapper, metadata);
    return wrapper;
  }

  function meta(value) {
    return value && typeof value === 'object' ? metadataByWrapper.get(value) ?? null : null;
  }

  function unwrap(value) {
    if (value && typeof value === 'object') {
      const actual = actualByWrapper.get(value);
      if (actual) return actual;
      if (value instanceof Uint8Array) return value;
      if (Array.isArray(value)) return value.map(unwrap);
      const prototype = Object.getPrototypeOf(value);
      if (prototype === Object.prototype || prototype === null) return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, unwrap(child)]));
    }
    return value;
  }

  function argumentFact(value) {
    const metadata = meta(value);
    if (metadata) return Object.freeze({ kind: metadata.kind, id: metadata.id });
    if (value && typeof value === 'object' && value.kind === 'publication-mailbox') {
      const mailbox = meta(value.mailbox);
      return Object.freeze({ kind: 'publication-mailbox', mailbox: mailbox ? { kind: mailbox.kind, id: mailbox.id } : null, lane: value.lane ?? null });
    }
    if (typeof value === 'bigint') return Object.freeze({ kind: 'bigint', value: value.toString() });
    return Object.freeze({ kind: typeof value, value: clonePublic(value) });
  }

  function closeRecord(metadata, result = null, error = null) {
    evidence.resourceCloses.push(Object.freeze({
      id: metadata.id,
      kind: metadata.kind,
      ...(metadata.role ? { role: metadata.role } : {}),
      ...(result !== null ? { result: clonePublic(result) } : {}),
      ...(error ? { error: errorFacts(error) } : {}),
    }));
  }

  function wrapOperation(actual, role, parent = {}) {
    const prior = wrapperByActual.get(actual);
    if (prior) return prior;
    const metadata = Object.freeze({ kind: 'operation', id: nextId('operation'), role, ...parent });
    const wrapper = bind({
      get kind() { return actual.kind; },
      get state() { return actual.state; },
      async status() {
        try {
          const result = await actual.status();
          evidence.operationEvents.push(Object.freeze({ operationId: metadata.id, role, action: 'status', ...parent, result: clonePublic(result) }));
          return result;
        } catch (error) {
          evidence.operationEvents.push(Object.freeze({ operationId: metadata.id, role, action: 'status', ...parent, error: errorFacts(error) }));
          throw error;
        }
      },
      async wait() {
        try {
          const result = await actual.wait();
          evidence.operationEvents.push(Object.freeze({ operationId: metadata.id, role, action: 'wait', ...parent, result: clonePublic(result) }));
          return result;
        } catch (error) {
          evidence.operationEvents.push(Object.freeze({ operationId: metadata.id, role, action: 'wait', ...parent, error: errorFacts(error) }));
          throw error;
        }
      },
      async close() {
        try {
          const result = await actual.close();
          closeRecord(metadata, result);
          return result;
        } catch (error) {
          closeRecord(metadata, null, error);
          throw error;
        }
      },
    }, actual, metadata);
    return Object.freeze(wrapper);
  }

  function wrapMemory(actual) {
    const prior = wrapperByActual.get(actual);
    if (prior) return prior;
    const metadata = Object.freeze({ kind: 'device-memory', id: nextId('memory') });
    const wrapper = bind({
      get kind() { return actual.kind; },
      get byteLength() { return actual.byteLength; },
      get state() { return actual.state; },
      async write(bytes, options = undefined) {
        const record = { memoryId: metadata.id, bytes: byteFacts(bytes), options: clonePublic(options) };
        try {
          const result = await actual.write(bytes, unwrap(options));
          evidence.memoryWrites.push(Object.freeze({ ...record, result: clonePublic(result) }));
          return result;
        } catch (error) {
          evidence.memoryWrites.push(Object.freeze({ ...record, error: errorFacts(error) }));
          throw error;
        }
      },
      async readAsync(options) {
        const request = clonePublic(options);
        try {
          const actualOperation = await actual.readAsync(unwrap(options));
          const operation = wrapOperation(actualOperation, 'transfer', { memoryId: metadata.id });
          evidence.memoryReadsAsync.push(Object.freeze({ memoryId: metadata.id, request, operationId: meta(operation).id }));
          return operation;
        } catch (error) {
          evidence.memoryReadsAsync.push(Object.freeze({ memoryId: metadata.id, request, error: errorFacts(error) }));
          throw error;
        }
      },
      async close() {
        try {
          const result = await actual.close();
          closeRecord(metadata, result);
          return result;
        } catch (error) {
          closeRecord(metadata, null, error);
          throw error;
        }
      },
    }, actual, metadata);
    return Object.freeze(wrapper);
  }

  function wrapMailbox(actual) {
    const prior = wrapperByActual.get(actual);
    if (prior) return prior;
    const metadata = Object.freeze({ kind: 'publication-mailbox', id: nextId('mailbox') });
    const wrapper = bind({
      get kind() { return actual.kind; },
      get generation() { return actual.generation; },
      get lanes() { return actual.lanes; },
      get state() { return actual.state; },
      store(name, value) {
        try {
          const result = actual.store(name, value);
          evidence.mailboxStores.push(Object.freeze({ mailboxId: metadata.id, name, value, result }));
          return result;
        } catch (error) {
          evidence.mailboxStores.push(Object.freeze({ mailboxId: metadata.id, name, value, error: errorFacts(error) }));
          throw error;
        }
      },
      load(name) {
        try {
          const result = actual.load(name);
          evidence.mailboxLoads.push(Object.freeze({ mailboxId: metadata.id, name, result }));
          return result;
        } catch (error) {
          evidence.mailboxLoads.push(Object.freeze({ mailboxId: metadata.id, name, error: errorFacts(error) }));
          throw error;
        }
      },
      async close() {
        try {
          const result = await actual.close();
          closeRecord(metadata, result);
          return result;
        } catch (error) {
          closeRecord(metadata, null, error);
          throw error;
        }
      },
    }, actual, metadata);
    return Object.freeze(wrapper);
  }

  function wrapFunction(actual) {
    const prior = wrapperByActual.get(actual);
    if (prior) return prior;
    const metadata = Object.freeze({ kind: 'function', id: nextId('function') });
    const wrapper = bind({
      get kind() { return actual.kind; },
      get name() { return actual.name; },
      get parameters() { return actual.parameters; },
      get state() { return actual.state; },
      async submit(options) {
        const request = Object.freeze({
          grid: clonePublic(options?.grid ?? null),
          block: clonePublic(options?.block ?? null),
          sharedMemoryBytes: options?.sharedMemoryBytes ?? null,
          arguments: Array.isArray(options?.arguments) ? options.arguments.map(argumentFact) : null,
          accesses: clonePublic(options?.accesses ?? null),
          after: argumentFact(options?.after ?? null),
        });
        try {
          const actualOperation = await actual.submit(unwrap(options));
          const operation = wrapOperation(actualOperation, 'main', { functionId: metadata.id });
          evidence.functionSubmits.push(Object.freeze({ functionId: metadata.id, request, operationId: meta(operation).id }));
          return operation;
        } catch (error) {
          evidence.functionSubmits.push(Object.freeze({ functionId: metadata.id, request, error: errorFacts(error) }));
          throw error;
        }
      },
      async close() {
        try {
          const result = await actual.close();
          closeRecord(metadata, result);
          return result;
        } catch (error) {
          closeRecord(metadata, null, error);
          throw error;
        }
      },
    }, actual, metadata);
    return Object.freeze(wrapper);
  }

  function wrapModule(actual) {
    const prior = wrapperByActual.get(actual);
    if (prior) return prior;
    const metadata = Object.freeze({ kind: 'module', id: nextId('module') });
    const wrapper = bind({
      get kind() { return actual.kind; },
      get format() { return actual.format; },
      get byteLength() { return actual.byteLength; },
      get sha256() { return actual.sha256; },
      get state() { return actual.state; },
      async getFunction(options) {
        try {
          const actualFunction = await actual.getFunction(options);
          const fn = wrapFunction(actualFunction);
          evidence.functionLookups.push(Object.freeze({ moduleId: metadata.id, request: clonePublic(options), functionId: meta(fn).id }));
          return fn;
        } catch (error) {
          evidence.functionLookups.push(Object.freeze({ moduleId: metadata.id, request: clonePublic(options), error: errorFacts(error) }));
          throw error;
        }
      },
      async close() {
        try {
          const result = await actual.close();
          closeRecord(metadata, result);
          return result;
        } catch (error) {
          closeRecord(metadata, null, error);
          throw error;
        }
      },
    }, actual, metadata);
    return Object.freeze(wrapper);
  }

  function wrapRuntime(actual) {
    const prior = wrapperByActual.get(actual);
    if (prior) return prior;
    const metadata = Object.freeze({ kind: 'runtime', id: nextId('runtime') });
    const wrapper = bind({
      get state() { return actual.state; },
      get health() { return actual.health; },
      get compilerEnabled() { return actual.compilerEnabled; },
      get terminalReport() { return actual.terminalReport; },
      async describe() {
        const description = await actual.describe();
        evidence.runtimeDescriptions.push(clonePublic(description));
        return description;
      },
      async loadModule(options) {
        const request = Object.freeze({
          format: options?.format ?? null,
          byteLength: options?.bytes?.byteLength ?? null,
          bytesSha256: options?.bytes instanceof Uint8Array ? sha256Bytes(options.bytes) : null,
        });
        try {
          const actualModule = await actual.loadModule(unwrap(options));
          const module = wrapModule(actualModule);
          evidence.moduleLoads.push(Object.freeze({ request, result: moduleFacts(actualModule), moduleId: meta(module).id }));
          return module;
        } catch (error) {
          evidence.moduleLoads.push(Object.freeze({ request, error: errorFacts(error) }));
          throw error;
        }
      },
      async allocateDevice(options) {
        try {
          const actualMemory = await actual.allocateDevice(options);
          const memory = wrapMemory(actualMemory);
          evidence.allocations.push(Object.freeze({ request: clonePublic(options), memoryId: meta(memory).id, byteLength: actualMemory.byteLength ?? options?.byteLength ?? null }));
          return memory;
        } catch (error) {
          evidence.allocations.push(Object.freeze({ request: clonePublic(options), error: errorFacts(error) }));
          throw error;
        }
      },
      async createPublicationMailbox(options) {
        try {
          const actualMailbox = await actual.createPublicationMailbox(options);
          const mailbox = wrapMailbox(actualMailbox);
          evidence.mailboxes.push(Object.freeze({ request: clonePublic(options), mailboxId: meta(mailbox).id }));
          return mailbox;
        } catch (error) {
          evidence.mailboxes.push(Object.freeze({ request: clonePublic(options), error: errorFacts(error) }));
          throw error;
        }
      },
      async close() {
        try {
          const result = await actual.close();
          evidence.runtimeClose.push(Object.freeze({ runtimeId: metadata.id, result: clonePublic(result) }));
          return result;
        } catch (error) {
          evidence.runtimeClose.push(Object.freeze({ runtimeId: metadata.id, error: errorFacts(error) }));
          throw error;
        }
      },
    }, actual, metadata);
    return Object.freeze(wrapper);
  }

  const cudaJs = Object.freeze({
    CUDA_JS_COMPATIBILITY: publicCudaJs.CUDA_JS_COMPATIBILITY,
    async openCudaRuntime(options) {
      evidence.openOptions.push(clonePublic(options));
      const actual = await publicCudaJs.openCudaRuntime(options);
      const runtime = wrapRuntime(actual);
      if (typeof actual.describe === 'function') await runtime.describe();
      return runtime;
    },
    async compileDeviceProgram(runtime, request) {
      const actual = actualByWrapper.get(runtime);
      if (!actual) throw new TypeError('compileDeviceProgram received a runtime outside the public recorder');
      evidence.compileRequests.push(requestFacts(request));
      const result = await publicCudaJs.compileDeviceProgram(actual, request);
      evidence.compilerResults.push(Object.freeze({
        schemaVersion: result?.schemaVersion ?? null,
        deviceProgram: deviceProgramFacts(result?.deviceProgram),
        compiler: compilerFacts(result?.compiler),
        linker: compilerFacts(result?.linker),
      }));
      return result;
    },
  });

  return Object.freeze({
    cudaJs,
    evidence,
    snapshot() { return clonePublic(evidence); },
  });
}

export function assertPhysicalPublicEvidence(snapshot) {
  if (!snapshot || snapshot.compileRequests?.length !== 1 || snapshot.compilerResults?.length !== 1) {
    throw Object.assign(new Error('exact pair requires exactly one public Device-JS compilation'), { code: 'PAIR_EVIDENCE_COMPILE' });
  }
  if (snapshot.moduleLoads?.length !== 1) throw Object.assign(new Error('exact pair requires exactly one public module load'), { code: 'PAIR_EVIDENCE_LOAD' });
  if (snapshot.functionSubmits?.length !== 1) throw Object.assign(new Error('exact pair requires exactly one public function submission'), { code: 'PAIR_EVIDENCE_SUBMIT' });
  if (snapshot.memoryReadsAsync?.length !== 1) throw Object.assign(new Error('exact pair requires exactly one terminal asynchronous D2H request'), { code: 'PAIR_EVIDENCE_DELIVERY' });

  const compile = snapshot.compilerResults[0];
  const artifact = compile.linker?.artifact ?? compile.compiler?.artifact;
  const load = snapshot.moduleLoads[0];
  const loaded = load.result;
  if (!compile.deviceProgram?.sha256 || !artifact?.sha256 || !artifact?.bytesSha256 || !loaded?.sha256 || !load.request?.bytesSha256) {
    throw Object.assign(new Error('public Device-JS/artifact/module identities are incomplete'), { code: 'PAIR_EVIDENCE_IDENTITY' });
  }
  if (artifact.bytesSha256 !== load.request.bytesSha256 || artifact.sha256 !== load.request.bytesSha256
      || loaded.sha256 !== load.request.bytesSha256 || artifact.format !== loaded.format || artifact.byteLength !== loaded.byteLength) {
    throw Object.assign(new Error('loaded module does not match the exact public artifact bytes produced by the executed compilation'), { code: 'PAIR_EVIDENCE_LOAD_MISMATCH' });
  }

  const runtime = snapshot.runtimeDescriptions?.at(-1);
  if (!runtime?.package?.name || !runtime.package.version || runtime.package.publicApiSchema === undefined || !runtime.driver || !runtime.device || !runtime.compiler) {
    throw Object.assign(new Error('public runtime/provider/device evidence is incomplete'), { code: 'PAIR_EVIDENCE_RUNTIME' });
  }

  const mainSubmit = snapshot.functionSubmits[0];
  const mainWait = snapshot.operationEvents?.find((entry) => entry.operationId === mainSubmit.operationId && entry.role === 'main' && entry.action === 'wait');
  const transfer = snapshot.memoryReadsAsync[0];
  const transferWait = snapshot.operationEvents?.find((entry) => entry.operationId === transfer.operationId && entry.role === 'transfer' && entry.action === 'wait');
  const transferClose = snapshot.resourceCloses?.find((entry) => entry.id === transfer.operationId && entry.kind === 'operation' && entry.role === 'transfer');
  if (mainWait?.result?.status !== 'completed' || transferWait?.result?.status !== 'completed' || !transferWait.result?.result?.bytes?.sha256 || !transferClose || transferClose.error) {
    throw Object.assign(new Error('public operation/terminal-transfer completion and child closure evidence is incomplete'), { code: 'PAIR_EVIDENCE_OPERATION' });
  }
  if ((snapshot.mailboxStores?.length ?? 0) !== 0 || (snapshot.mailboxLoads?.length ?? 0) !== 0) {
    throw Object.assign(new Error('host mailbox participation occurred during the exact terminal-only pair'), { code: 'PAIR_EVIDENCE_HOST_INTERMEDIATE' });
  }

  const runtimeClose = snapshot.runtimeClose?.at(-1)?.result;
  if (!runtimeClose || runtimeClose.graceful !== true || runtimeClose.restartRequired === true || runtimeClose.state !== 'closed') {
    throw Object.assign(new Error('public runtime terminal cleanup is not a clean closed state'), { code: 'PAIR_EVIDENCE_CLEANUP' });
  }
  return true;
}

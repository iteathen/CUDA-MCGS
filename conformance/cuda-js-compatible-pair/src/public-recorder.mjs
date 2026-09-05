function clonePublic(value) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Uint8Array) return { kind: 'opaque-bytes', byteLength: value.byteLength };
  if (Array.isArray(value)) return value.map(clonePublic);
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'bytes' && key !== 'generatedSource').map(([key, child]) => [key, clonePublic(child)]));
}

function artifactFacts(artifact) {
  if (!artifact || typeof artifact !== 'object') return null;
  return Object.freeze({
    format: artifact.format ?? null,
    byteLength: artifact.byteLength ?? artifact.bytes?.byteLength ?? null,
    sha256: artifact.sha256 ?? null,
    architecture: artifact.architecture ?? null,
    relocatableDeviceCode: artifact.relocatableDeviceCode ?? null,
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
  return Object.freeze(Object.fromEntries(allowed.filter((key) => Object.hasOwn(deviceProgram, key)).map((key) => [key, clonePublic(deviceProgram[key])])));
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

export function createPublicCudaJsRecorder(publicCudaJs) {
  if (!publicCudaJs || typeof publicCudaJs !== 'object') throw new TypeError('public CUDA-JS namespace is required');
  const runtimeMap = new WeakMap();
  const evidence = {
    compatibility: clonePublic(publicCudaJs.CUDA_JS_COMPATIBILITY),
    openOptions: [],
    runtimeDescriptions: [],
    compilerResults: [],
    moduleLoads: [],
    allocations: [],
    mailboxes: [],
    runtimeClose: [],
  };

  function wrapRuntime(actual) {
    const wrapper = {
      get state() { return actual.state; },
      get compilerEnabled() { return actual.compilerEnabled; },
      async describe() {
        const description = await actual.describe();
        evidence.runtimeDescriptions.push(clonePublic(description));
        return description;
      },
      async loadModule(options) {
        const module = await actual.loadModule(options);
        evidence.moduleLoads.push(Object.freeze({
          request: Object.freeze({ format: options?.format ?? null, byteLength: options?.bytes?.byteLength ?? null }),
          result: moduleFacts(module),
        }));
        return module;
      },
      async allocateDevice(options) {
        evidence.allocations.push(clonePublic(options));
        return actual.allocateDevice(options);
      },
      async createPublicationMailbox(options) {
        evidence.mailboxes.push(clonePublic(options));
        return actual.createPublicationMailbox(options);
      },
      async close() {
        const result = await actual.close();
        evidence.runtimeClose.push(clonePublic(result));
        return result;
      },
    };
    runtimeMap.set(wrapper, actual);
    return wrapper;
  }

  const cudaJs = Object.freeze({
    CUDA_JS_COMPATIBILITY: publicCudaJs.CUDA_JS_COMPATIBILITY,
    async openCudaRuntime(options) {
      evidence.openOptions.push(clonePublic(options));
      const actual = await publicCudaJs.openCudaRuntime(options);
      const wrapper = wrapRuntime(actual);
      if (typeof actual.describe === 'function') await wrapper.describe();
      return wrapper;
    },
    async compileDeviceProgram(runtime, request) {
      const actual = runtimeMap.get(runtime);
      if (!actual) throw new TypeError('compileDeviceProgram received a runtime outside the public recorder');
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
  if (!snapshot || snapshot.compilerResults?.length !== 1) throw Object.assign(new Error('exact pair requires exactly one public Device-JS compilation'), { code: 'PAIR_EVIDENCE_COMPILE' });
  if (snapshot.moduleLoads?.length !== 1) throw Object.assign(new Error('exact pair requires exactly one public module load'), { code: 'PAIR_EVIDENCE_LOAD' });
  const compile = snapshot.compilerResults[0];
  const artifact = compile.linker?.artifact ?? compile.compiler?.artifact;
  const loaded = snapshot.moduleLoads[0].result;
  if (!compile.deviceProgram?.sha256 || !artifact?.sha256 || !loaded?.sha256) throw Object.assign(new Error('public Device-JS/artifact/module identities are incomplete'), { code: 'PAIR_EVIDENCE_IDENTITY' });
  if (artifact.sha256 !== loaded.sha256 || artifact.format !== loaded.format || artifact.byteLength !== loaded.byteLength) throw Object.assign(new Error('loaded module does not match the artifact produced by the executed public compilation'), { code: 'PAIR_EVIDENCE_LOAD_MISMATCH' });
  const runtime = snapshot.runtimeDescriptions?.at(-1);
  if (!runtime?.package?.name || !runtime?.package?.version || runtime.publicApiSchema === undefined || !runtime.driver || !runtime.device || !runtime.compiler) throw Object.assign(new Error('public runtime/provider/device evidence is incomplete'), { code: 'PAIR_EVIDENCE_RUNTIME' });
  return true;
}

import * as core from './adapter-core.mjs';

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const HEX64 = /^[0-9a-f]{64}$/;

function fail(code, message, classification = 'validation') {
  throw new core.CudaJsRuntimeAdapterError(code, 'admission', message, { classification });
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('CUDA_JS_ADAPTER_IMPORT', `${label} must be an object`);
  return value;
}

function declarationKey(value) {
  return `${value.library.sha256}\0${value.library.format}\0${value.library.architecture}\0${value.library.artifactSha256}`;
}

function validateDeclaration(value, index, selectedProfiles, localFunctions) {
  object(value, `device import declaration ${index}`);
  if (value.schema !== 'cuda-mcgs.device-js-import-declaration/0.1.0'
      || typeof value.id !== 'string' || value.id.length === 0
      || !selectedProfiles.has(value.ownerProfile)
      || !IDENTIFIER.test(value.importName)
      || !IDENTIFIER.test(value.alias)
      || value.alias === 'gpu' || localFunctions.has(value.alias)) {
    fail('CUDA_JS_ADAPTER_IMPORT_DECLARATION', `device import declaration ${index} is invalid`);
  }
  const library = object(value.library, `${value.id} library identity`);
  if (typeof library.contract !== 'string' || library.contract.length === 0
      || !HEX64.test(library.sha256)
      || !['ptx', 'lto-ir'].includes(library.format)
      || typeof library.architecture !== 'string' || library.architecture.length === 0
      || !HEX64.test(library.artifactSha256)) {
    fail('CUDA_JS_ADAPTER_IMPORT_DECLARATION', `${value.id} library identity is invalid`);
  }
  return value;
}

function validateLiveImport(value, declaration, index) {
  const imported = object(value, `deviceImports[${index}]`);
  const library = object(imported.library, `deviceImports[${index}].library`);
  const artifact = object(library.artifact, `deviceImports[${index}].library.artifact`);
  if (imported.as !== declaration.alias || imported.name !== declaration.importName
      || library.schemaVersion !== 1
      || library.contract !== declaration.library.contract
      || library.sha256 !== declaration.library.sha256
      || library.format !== declaration.library.format
      || library.architecture !== declaration.library.architecture
      || artifact.sha256 !== declaration.library.artifactSha256
      || artifact.format !== library.format || artifact.architecture !== library.architecture
      || !(artifact.bytes instanceof Uint8Array)
      || !Number.isSafeInteger(artifact.byteLength) || artifact.byteLength !== artifact.bytes.byteLength) {
    fail('CUDA_JS_ADAPTER_IMPORT_IDENTITY', `${declaration.id} live DeviceJsImport differs from the execution-package declaration`);
  }
  const exported = Array.isArray(library.exports) ? library.exports.find((entry) => entry?.name === imported.name) : null;
  if (!exported || !Array.isArray(exported.parameters) || typeof exported.returns !== 'string') {
    fail('CUDA_JS_ADAPTER_IMPORT_EXPORT', `${declaration.id} names no matching public library export`);
  }
  return imported;
}

function prepareImports(executionPackage, supplied) {
  const declarations = executionPackage?.cudaJsAdapter?.searchProgram?.deviceImports;
  if (declarations === undefined) {
    if (supplied === undefined || (Array.isArray(supplied) && supplied.length === 0)) return null;
    fail('CUDA_JS_ADAPTER_IMPORT_UNDECLARED', 'runtime DeviceJsImport values were supplied without execution-package declarations');
  }
  if (!Array.isArray(declarations) || declarations.length === 0 || declarations.length > 64) {
    fail('CUDA_JS_ADAPTER_IMPORT_DECLARATION', 'execution-package deviceImports must contain 1 through 64 declarations');
  }
  const selectedProfiles = new Set((executionPackage?.semantic?.selectedProfiles ?? []).map(({ id }) => id));
  const localFunctions = new Set((executionPackage?.cudaJsAdapter?.searchProgram?.functions ?? []).map(({ name }) => name));
  const normalized = declarations.map((entry, index) => validateDeclaration(entry, index, selectedProfiles, localFunctions));
  if (new Set(normalized.map(({ id }) => id)).size !== normalized.length
      || new Set(normalized.map(({ alias }) => alias)).size !== normalized.length
      || new Set(normalized.map(declarationKey)).size > 32) {
    fail('CUDA_JS_ADAPTER_IMPORT_DECLARATION', 'execution-package device import identities, aliases, or library count are invalid');
  }
  if (!Array.isArray(supplied) || supplied.length !== normalized.length) {
    fail('CUDA_JS_ADAPTER_IMPORT_COUNT', 'runtime DeviceJsImport values must exactly cover execution-package declarations');
  }
  const byAlias = new Map();
  for (const imported of supplied) {
    if (!IDENTIFIER.test(imported?.as) || byAlias.has(imported.as)) fail('CUDA_JS_ADAPTER_IMPORT_DUPLICATE', 'runtime DeviceJsImport aliases must be unique Device-JS identifiers');
    byAlias.set(imported.as, imported);
  }
  return Object.freeze(normalized.map((declaration, index) => {
    const imported = byAlias.get(declaration.alias);
    if (!imported) fail('CUDA_JS_ADAPTER_IMPORT_MISSING', `${declaration.id} has no live DeviceJsImport`);
    return validateLiveImport(imported, declaration, index);
  }));
}

function injectingCudaJs(cudaJs, imports) {
  return new Proxy(cudaJs, {
    get(target, property, receiver) {
      if (property === 'compileDeviceProgram') {
        return (runtime, request) => target.compileDeviceProgram(runtime, { ...request, imports });
      }
      return Reflect.get(target, property, receiver);
    },
  });
}

export async function prepareCudaJsExecution(executionPackage, options = {}) {
  const imports = prepareImports(executionPackage, options?.deviceImports);
  if (imports === null) {
    if (!Object.hasOwn(options ?? {}, 'deviceImports')) return core.prepareCudaJsExecution(executionPackage, options);
    const { deviceImports: _unused, ...coreOptions } = options;
    return core.prepareCudaJsExecution(executionPackage, coreOptions);
  }
  const { deviceImports: _declared, cudaJs, ...rest } = options;
  object(cudaJs, 'cudaJs');
  return core.prepareCudaJsExecution(executionPackage, { ...rest, cudaJs: injectingCudaJs(cudaJs, imports) });
}

export * from './adapter-core.mjs';

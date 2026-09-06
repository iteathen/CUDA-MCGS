const CONNECTOR_CONTRACT = 'cuda-mcgs.tensor-evaluator-connector/0.1.0';
const TENSOR_CONTRACTS = new Set([
  'SPEC-0009-item-parallel-device-tensor-program-v1',
  'SPEC-0009-item-parallel-device-tensor-program-v1+SPEC-0009-gather-concat-v1',
]);
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const HEX64 = /^[0-9a-f]{64}$/;

function freeze(value) {
  if (value === null || typeof value !== 'object') return value;
  return Object.freeze(Array.isArray(value)
    ? value.map(freeze)
    : Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freeze(child)])));
}

export class TensorEvaluatorConnectorError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'TensorEvaluatorConnectorError';
    this.code = code;
    this.details = freeze(details);
  }
}

function fail(code, message, details) {
  throw new TensorEvaluatorConnectorError(code, message, details);
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('TENSOR_EVALUATOR_INPUT', `${label} must be an object`);
  return value;
}

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) fail('TENSOR_EVALUATOR_BOUNDS', `${label} must be a positive safe integer`);
  return value;
}

function nonnegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) fail('TENSOR_EVALUATOR_BOUNDS', `${label} must be a nonnegative safe integer`);
  return value;
}

function text(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail('TENSOR_EVALUATOR_INPUT', `${label} must be non-empty text`);
  return value;
}

function normalizeFunction(value) {
  object(value, 'tensor function');
  if (value.name !== 'tensorRunItem' || value.returns !== 'u32' || !Array.isArray(value.parameters)) {
    fail('TENSOR_EVALUATOR_CALLABLE', 'Tensor callable must be the public tensorRunItem u32 function');
  }
  const parameters = value.parameters.map((parameter, index) => {
    object(parameter, `tensor function parameter ${index}`);
    if (!IDENTIFIER.test(parameter.name) || typeof parameter.type !== 'string' || parameter.type.length === 0) {
      fail('TENSOR_EVALUATOR_CALLABLE', `tensor function parameter ${index} is invalid`);
    }
    return { name: parameter.name, type: parameter.type };
  });
  if (new Set(parameters.map(({ name }) => name)).size !== parameters.length) fail('TENSOR_EVALUATOR_CALLABLE', 'tensor function parameter names must be unique');
  return { name: value.name, parameters, returns: value.returns };
}

function normalizeProgramParameters(value) {
  if (!Array.isArray(value) || value.length === 0) fail('TENSOR_EVALUATOR_CALLABLE', 'Tensor program parameters must be non-empty');
  const parameters = value.map((parameter, index) => {
    object(parameter, `Tensor program parameter ${index}`);
    if (parameter.parameterIndex !== index || !IDENTIFIER.test(parameter.parameterName) || typeof parameter.type !== 'string'
        || !['item-index', 'input', 'output', 'workspace'].includes(parameter.role)
        || !['read', 'write', 'read-write'].includes(parameter.access) || typeof parameter.itemVarying !== 'boolean') {
      fail('TENSOR_EVALUATOR_CALLABLE', `Tensor program parameter ${index} is malformed`);
    }
    const byteLength = parameter.role === 'item-index' ? 0 : nonnegativeInteger(parameter.byteLength, `${parameter.parameterName} byteLength`);
    return {
      parameterIndex: index,
      parameterName: parameter.parameterName,
      role: parameter.role,
      type: parameter.type,
      dtype: parameter.dtype,
      access: parameter.access,
      itemVarying: parameter.itemVarying,
      byteLength,
    };
  });
  if (parameters[0].role !== 'item-index' || parameters.filter(({ role }) => role === 'item-index').length !== 1) {
    fail('TENSOR_EVALUATOR_ITEM_AXIS', 'Tensor callable must expose exactly one leading item-index parameter');
  }
  if (parameters.filter(({ role }) => role === 'output').length === 0) fail('TENSOR_EVALUATOR_OUTPUT', 'Tensor callable must expose at least one output');
  return parameters;
}

function requireRoleProjection(value, parameters, role, label) {
  if (!Array.isArray(value)) fail('TENSOR_EVALUATOR_CALLABLE', `${label} must be an array`);
  const expected = parameters.filter((entry) => entry.role === role);
  if (value.length !== expected.length) fail('TENSOR_EVALUATOR_CALLABLE', `${label} differs from Tensor parameter roles`);
  value.forEach((entry, index) => {
    object(entry, `${label} ${index}`);
    const parameter = expected[index];
    if (entry.parameterIndex !== parameter.parameterIndex || entry.parameterName !== parameter.parameterName
        || entry.type !== parameter.type || entry.role !== role || entry.byteLength !== parameter.byteLength) {
      fail('TENSOR_EVALUATOR_CALLABLE', `${label} differs from Tensor parameter ${parameter.parameterName}`);
    }
  });
}

function normalizeImport(tensorDeviceProgram, alias, expected = null) {
  if (typeof tensorDeviceProgram.importAs !== 'function') fail('TENSOR_EVALUATOR_IMPORT', 'TensorDeviceProgram.importAs is unavailable');
  const imported = object(tensorDeviceProgram.importAs(alias), 'Tensor Device-JS import');
  const library = object(imported.library, 'Tensor Device-JS library');
  const artifact = object(library.artifact, 'Tensor Device-JS artifact');
  if (imported.as !== alias || imported.name !== 'tensorRunItem' || library.schemaVersion !== 1 || !HEX64.test(library.sha256)
      || !['ptx', 'lto-ir'].includes(library.format) || typeof library.architecture !== 'string' || library.architecture.length === 0
      || !Array.isArray(library.exports) || !library.exports.some((entry) => entry?.name === 'tensorRunItem')
      || !HEX64.test(artifact.sha256) || !(artifact.bytes instanceof Uint8Array)) {
    fail('TENSOR_EVALUATOR_IMPORT', 'Tensor public Device-JS import/library identity is invalid');
  }
  const identity = freeze({
    name: imported.name,
    as: imported.as,
    library: {
      contract: library.contract,
      sha256: library.sha256,
      format: library.format,
      architecture: library.architecture,
      artifactSha256: artifact.sha256,
    },
  });
  if (expected && JSON.stringify(identity) !== JSON.stringify(expected)) {
    fail('TENSOR_EVALUATOR_IMPORT_DRIFT', 'Tensor public Device-JS import identity changed after connector admission');
  }
  return { imported, identity };
}

export function createTensorEvaluatorConnector(tensorDeviceProgram, options = {}) {
  object(tensorDeviceProgram, 'TensorDeviceProgram');
  object(options, 'connector options');
  for (const key of Object.keys(options)) if (!['alias', 'requestCapacity'].includes(key)) fail('TENSOR_EVALUATOR_OPTIONS', `unknown connector option ${key}`);
  if (tensorDeviceProgram.kind !== 'tensor-device-program' || !TENSOR_CONTRACTS.has(tensorDeviceProgram.contract)) {
    fail('TENSOR_EVALUATOR_CONTRACT', 'unsupported TensorDeviceProgram contract');
  }
  const itemCapacity = positiveInteger(tensorDeviceProgram.itemCapacity, 'Tensor itemCapacity');
  const requestCapacity = positiveInteger(options.requestCapacity ?? itemCapacity, 'requestCapacity');
  if (requestCapacity > itemCapacity) fail('TENSOR_EVALUATOR_CAPACITY', 'requestCapacity cannot exceed Tensor itemCapacity');
  const alias = options.alias ?? 'mcgsTensorRunItem';
  if (!IDENTIFIER.test(alias) || alias === 'gpu') fail('TENSOR_EVALUATOR_ALIAS', 'Tensor import alias must be a non-gpu Device-JS identifier');
  const callable = normalizeFunction(tensorDeviceProgram.function);
  const parameters = normalizeProgramParameters(tensorDeviceProgram.parameters);
  if (callable.parameters.length !== parameters.length
      || callable.parameters.some((parameter, index) => parameter.name !== parameters[index].parameterName || parameter.type !== parameters[index].type)) {
    fail('TENSOR_EVALUATOR_CALLABLE', 'Tensor function and parameter descriptors differ');
  }
  requireRoleProjection(tensorDeviceProgram.inputs, parameters, 'input', 'Tensor inputs');
  requireRoleProjection(tensorDeviceProgram.outputs, parameters, 'output', 'Tensor outputs');
  requireRoleProjection(tensorDeviceProgram.workspace, parameters, 'workspace', 'Tensor workspace');
  const totalWorkspaceBytes = nonnegativeInteger(tensorDeviceProgram.totalWorkspaceBytes, 'totalWorkspaceBytes');
  const workspaceBytes = parameters.filter(({ role }) => role === 'workspace').reduce((total, entry) => total + entry.byteLength, 0);
  if (workspaceBytes !== totalWorkspaceBytes) fail('TENSOR_EVALUATOR_WORKSPACE', 'Tensor workspace descriptors differ from totalWorkspaceBytes');
  const compatibilityIdentity = text(tensorDeviceProgram.compatibilityIdentity, 'Tensor compatibilityIdentity');
  if (!['ptx', 'lto-ir'].includes(tensorDeviceProgram.outputFormat)) fail('TENSOR_EVALUATOR_OUTPUT', 'Tensor outputFormat must be ptx or lto-ir');
  const admittedImport = normalizeImport(tensorDeviceProgram, alias);
  const sourceParameters = callable.parameters.map(({ name }) => name).join(', ');
  const source = `function mcgsTensorEvaluateItem(${sourceParameters}) { return ${alias}(${sourceParameters}); }\n`;
  const connector = {
    kind: 'cuda-mcgs-tensor-evaluator-connector',
    contract: CONNECTOR_CONTRACT,
    tensor: {
      contract: tensorDeviceProgram.contract,
      compatibilityIdentity,
      itemCapacity,
      totalWorkspaceBytes,
      outputFormat: tensorDeviceProgram.outputFormat,
    },
    requestCapacity,
    parameters,
    deviceImportIdentity: admittedImport.identity,
    createDeviceImport() {
      return normalizeImport(tensorDeviceProgram, alias, admittedImport.identity).imported;
    },
    deviceFunction: {
      name: 'mcgsTensorEvaluateItem',
      kind: 'device',
      parameters: callable.parameters,
      returns: 'u32',
    },
    source,
    claimLimits: ['public-tensor-callable-only', 'no-product-semantics', 'no-native-or-provider-qualification'],
  };
  return freeze(connector);
}

export const tensorEvaluatorConnectorConstants = Object.freeze({
  connectorContract: CONNECTOR_CONTRACT,
  tensorContracts: Object.freeze([...TENSOR_CONTRACTS]),
});

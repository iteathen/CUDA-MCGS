import { createHash } from 'node:crypto';

import { TensorEvaluatorConnectorError } from './connector.mjs';

const BINDING_CONTRACT = 'cuda-mcgs.tensor-evaluator-program-binding/0.2.0';
const RUNTIME_CONTRACT = 'cuda-mcgs.tensor-evaluator-device-runtime/0.2.0';
const EVALUATOR_SCHEMA = 'cuda-mcgs.evaluator-profile/0.2.0';
const DEVICE_IMPORT_SCHEMA = 'cuda-mcgs.device-js-import-declaration/0.1.0';
const WORK_CLASS_KEYS = Object.freeze(['encode', 'admit', 'batch', 'execute', 'scatter', 'publish']);
const HEX40 = /^[0-9a-f]{40}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const NAMESPACED_ID = /^[a-z][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+$/;

function freeze(value) {
  if (value === null || typeof value !== 'object') return value;
  return Object.freeze(Array.isArray(value)
    ? value.map(freeze)
    : Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freeze(child)])));
}

function fail(code, message, details = {}) {
  throw new TensorEvaluatorConnectorError(code, message, details);
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('TENSOR_EVALUATOR_PROGRAM_BINDING_INPUT', `${label} must be an object`);
  return value;
}

function exactKeys(value, expected, code, label) {
  object(value, label);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(code, `${label} fields must be exactly ${wanted.join(', ')}`);
  }
}

function namespacedId(value, label) {
  if (typeof value !== 'string' || !NAMESPACED_ID.test(value)) fail('TENSOR_EVALUATOR_PROGRAM_BINDING_ID', `${label} must be a namespaced id`);
  return value;
}

function decimal(value, label) {
  if (typeof value !== 'string' || !/^(?:0|[1-9][0-9]*)$/.test(value)) fail('TENSOR_EVALUATOR_PROGRAM_BINDING_RANGE', `${label} must be a canonical decimal uint string`);
  return BigInt(value);
}

function canonicalSource(source) {
  if (typeof source !== 'string' || source.length === 0) fail('TENSOR_EVALUATOR_PROGRAM_BINDING_SOURCE', 'runtime Device-JS source must be non-empty text');
  return source.replace(/\r\n?/g, '\n').replace(/\n+$/g, '') + '\n';
}

function sourceIdentity(source) {
  return { algorithm: 'sha256', sha256: createHash('sha256').update(canonicalSource(source), 'utf8').digest('hex') };
}

function normalizeSchemaReference(value, label) {
  exactKeys(value, ['id', 'version', 'sha256'], 'TENSOR_EVALUATOR_PROGRAM_BINDING_REQUIREMENT', label);
  if (typeof value.id !== 'string' || !/^[a-z][a-z0-9.-]+\/[0-9]+\.[0-9]+\.[0-9]+$/.test(value.id)
      || typeof value.version !== 'string' || !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(value.version)
      || !value.id.endsWith(`/${value.version}`) || typeof value.sha256 !== 'string' || !HEX64.test(value.sha256)) {
    fail('TENSOR_EVALUATOR_PROGRAM_BINDING_REQUIREMENT', `${label} is not a public schema reference`);
  }
  return { id: value.id, version: value.version, sha256: value.sha256 };
}

function normalizeRequirements(input, requiredIds) {
  if (!Array.isArray(input) || input.length !== requiredIds.length) {
    fail('TENSOR_EVALUATOR_PROGRAM_BINDING_REQUIREMENT', 'publicRequirements must exactly cover the runtime-owned CUDA-JS contract ids');
  }
  const byId = new Map();
  for (let index = 0; index < input.length; index += 1) {
    const reference = normalizeSchemaReference(input[index], `public requirement ${index}`);
    if (byId.has(reference.id)) fail('TENSOR_EVALUATOR_PROGRAM_BINDING_REQUIREMENT', `duplicate public requirement ${reference.id}`);
    byId.set(reference.id, reference);
  }
  const required = [...requiredIds].sort();
  const actual = [...byId.keys()].sort();
  if (actual.length !== required.length || actual.some((id, index) => id !== required[index])) {
    fail('TENSOR_EVALUATOR_PROGRAM_BINDING_REQUIREMENT', 'publicRequirements differ from runtime-owned CUDA-JS contract ids');
  }
  return required.map((id) => byId.get(id));
}

function runtime(value) {
  object(value, 'Tensor evaluator runtime contribution');
  if (value.kind !== 'cuda-mcgs-tensor-evaluator-runtime-contribution' || value.contract !== RUNTIME_CONTRACT
      || value.execution?.deviceOwned !== true || value.execution?.hostProgress !== 'none'
      || !Number.isSafeInteger(value.execution?.requestCapacity) || value.execution.requestCapacity <= 0
      || !Number.isSafeInteger(value.execution?.itemCapacity) || value.execution.itemCapacity <= 0
      || !Array.isArray(value.requiredCudaJsContracts) || !value.device || typeof value.device.source !== 'string'
      || !Array.isArray(value.device.functions) || value.device.functions.length === 0) {
    fail('TENSOR_EVALUATOR_PROGRAM_BINDING_RUNTIME', 'runtime contribution is not the admitted device-owned Tensor evaluator runtime shape');
  }
  const required = [...value.requiredCudaJsContracts];
  if (new Set(required).size !== required.length || required.some((id) => typeof id !== 'string' || !/^[a-z][a-z0-9.-]+\/[0-9]+\.[0-9]+\.[0-9]+$/.test(id))) {
    fail('TENSOR_EVALUATOR_PROGRAM_BINDING_RUNTIME', 'runtime CUDA-JS contract ids are invalid');
  }
  return value;
}

function evaluatorProfile(value, contribution, requireBoundSource) {
  object(value, 'evaluator profile');
  if (value.schema !== EVALUATOR_SCHEMA || value.status !== 'accepted' || value.contract?.id !== 'SPEC-0009'
      || value.execution?.deviceOwned !== true || value.execution?.hostProgress !== 'none') {
    fail('TENSOR_EVALUATOR_PROGRAM_BINDING_PROFILE', 'evaluator profile is not an accepted device-owned SPEC-0009 profile');
  }
  namespacedId(value.id, 'evaluator profile id');
  if (!value.request || !value.batching || !value.programContribution || value.programContribution.kind !== 'device-program'
      || value.programContribution.language !== 'restricted-device-js') {
    fail('TENSOR_EVALUATOR_PROGRAM_BINDING_PROFILE', 'evaluator profile lacks the request/batching/restricted-Device-JS contribution contract');
  }
  if (decimal(value.request.maxActive, 'request.maxActive') > BigInt(contribution.execution.requestCapacity)) {
    fail('TENSOR_EVALUATOR_PROGRAM_BINDING_CAPACITY', 'runtime request capacity is below the evaluator profile maximum active requests');
  }
  if (decimal(value.batching.minimumReadyItems, 'batching.minimumReadyItems') !== 1n) {
    fail('TENSOR_EVALUATOR_PROGRAM_BINDING_BATCH', 'Tensor runtime first realization requires evaluator minimumReadyItems = 1');
  }
  if (decimal(value.batching.maximumItems, 'batching.maximumItems') > BigInt(contribution.execution.itemCapacity)) {
    fail('TENSOR_EVALUATOR_PROGRAM_BINDING_CAPACITY', 'Tensor item capacity is below the evaluator profile maximum batch size');
  }
  const statusCodes = new Set((value.statuses ?? []).map(({ code }) => code));
  for (const code of Object.values(contribution.state?.dispositions ?? {})) {
    if (!statusCodes.has(code)) fail('TENSOR_EVALUATOR_PROGRAM_BINDING_STATUS', `evaluator profile does not declare runtime disposition ${code}`);
  }
  if (requireBoundSource) {
    const expected = sourceIdentity(contribution.device.source);
    if (value.programContribution.sourceIdentity?.algorithm !== 'sha256' || value.programContribution.sourceIdentity.sha256 !== expected.sha256) {
      fail('TENSOR_EVALUATOR_PROGRAM_BINDING_SOURCE', 'normalized evaluator profile source identity differs from the exact runtime Device-JS source');
    }
    const selected = new Map((value.programContribution.requirements ?? []).map((entry) => [entry.id, entry]));
    for (const id of contribution.requiredCudaJsContracts) if (!selected.has(id)) {
      fail('TENSOR_EVALUATOR_PROGRAM_BINDING_REQUIREMENT', `normalized evaluator profile omits runtime requirement ${id}`);
    }
  }
  return value;
}

function mergeRequirements(existing, selected) {
  const merged = new Map();
  for (let index = 0; index < (existing ?? []).length; index += 1) {
    const entry = normalizeSchemaReference(existing[index], `existing program requirement ${index}`);
    if (merged.has(entry.id)) fail('TENSOR_EVALUATOR_PROGRAM_BINDING_REQUIREMENT', `duplicate existing program requirement ${entry.id}`);
    merged.set(entry.id, entry);
  }
  for (const entry of selected) {
    const prior = merged.get(entry.id);
    if (prior && JSON.stringify(prior) !== JSON.stringify(entry)) {
      fail('TENSOR_EVALUATOR_PROGRAM_BINDING_REQUIREMENT', `existing program requirement ${entry.id} conflicts with the selected public contract`);
    }
    merged.set(entry.id, entry);
  }
  return [...merged.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export function bindTensorEvaluatorProfileProgram(profileInput, runtimeContribution, options = {}) {
  const contribution = runtime(runtimeContribution);
  evaluatorProfile(profileInput, contribution, false);
  exactKeys(options, ['publicRequirements'], 'TENSOR_EVALUATOR_PROGRAM_BINDING_OPTIONS', 'profile-binding options');
  const requirements = normalizeRequirements(options.publicRequirements, contribution.requiredCudaJsContracts);
  const bound = structuredClone(profileInput);
  bound.programContribution.sourceIdentity = sourceIdentity(contribution.device.source);
  bound.programContribution.requirements = mergeRequirements(bound.programContribution.requirements, requirements);
  return freeze(bound);
}

function normalizeWorkClasses(value, profile) {
  exactKeys(value, WORK_CLASS_KEYS, 'TENSOR_EVALUATOR_PROGRAM_BINDING_WORK', 'workClasses');
  const selected = WORK_CLASS_KEYS.map((key) => {
    const id = namespacedId(value[key], `workClasses.${key}`);
    if (!(profile.execution.workClasses ?? []).includes(id)) fail('TENSOR_EVALUATOR_PROGRAM_BINDING_WORK', `${id} is not an evaluator execution work class`);
    return [key, id];
  });
  if (new Set(selected.map(([, id]) => id)).size !== selected.length) fail('TENSOR_EVALUATOR_PROGRAM_BINDING_WORK', 'workClasses must map one-to-one to runtime work classes');
  const profileClasses = [...profile.execution.workClasses].sort();
  const boundClasses = selected.map(([, id]) => id).sort();
  if (profileClasses.length !== boundClasses.length || profileClasses.some((id, index) => id !== boundClasses[index])) {
    fail('TENSOR_EVALUATOR_PROGRAM_BINDING_WORK', 'Tensor runtime workClasses must exactly cover the evaluator execution work classes');
  }
  return Object.fromEntries(selected);
}

function trust(origin) {
  if (origin === 'first-party') return 'first-party-reviewed';
  if (origin === 'third-party-reviewed') return 'explicit-third-party';
  fail('TENSOR_EVALUATOR_PROGRAM_BINDING_PROVENANCE', 'evaluator program provenance origin is unsupported');
}

function programProvenance(profile) {
  const value = object(profile.programContribution.provenance, 'evaluator program provenance');
  if (!HEX40.test(value.revision) || typeof value.license !== 'string' || value.license.length === 0 || !value.review) {
    fail('TENSOR_EVALUATOR_PROGRAM_BINDING_PROVENANCE', 'evaluator program provenance is incomplete');
  }
  return {
    origin: value.origin,
    trust: trust(value.origin),
    revision: value.revision,
    license: value.license,
    review: structuredClone(value.review),
  };
}


function functionRoles(contribution, profile, workClasses) {
  const roles = new Map();
  for (const [key, record] of Object.entries(contribution.device.workClasses ?? {})) {
    const role = workClasses[key];
    if (!role) fail('TENSOR_EVALUATOR_PROGRAM_BINDING_WORK', `runtime work class ${key} has no evaluator binding`);
    for (const name of record.functions ?? []) {
      const prior = roles.get(name);
      if (prior && prior !== role) fail('TENSOR_EVALUATOR_PROGRAM_BINDING_WORK', `${name} belongs to multiple evaluator work classes`);
      roles.set(name, role);
    }
  }
  const lifecycle = contribution.device.lifecycleFunctions ?? {};
  for (const [key, name] of Object.entries(lifecycle)) roles.set(name, `${profile.id}.lifecycle-${key}`);
  for (const { name } of contribution.device.functions) if (!roles.has(name)) roles.set(name, `${profile.id}.runtime-internal`);
  return roles;
}

export function createTensorEvaluatorProgramBinding(runtimeContribution, normalizedEvaluatorProfile, options = {}) {
  const contribution = runtime(runtimeContribution);
  const profile = evaluatorProfile(normalizedEvaluatorProfile, contribution, true);
  exactKeys(options, ['id', 'workClasses'], 'TENSOR_EVALUATOR_PROGRAM_BINDING_OPTIONS', 'program-binding options');
  const id = namespacedId(options.id, 'program binding id');
  const workClasses = normalizeWorkClasses(options.workClasses, profile);
  const sourceId = `${id}.source`;
  const importId = `${id}.tensor-import`;
  const exactSourceIdentity = sourceIdentity(contribution.device.source);
  const roles = functionRoles(contribution, profile, workClasses);
  const localFunctionNames = new Set(contribution.device.functions.map(({ name }) => name));
  const functions = contribution.device.functions.map((fn) => {
    if (fn.kind !== 'device' || !Array.isArray(fn.parameters) || typeof fn.returns !== 'string' || !Array.isArray(fn.calls)) {
      fail('TENSOR_EVALUATOR_PROGRAM_BINDING_FUNCTION', (fn.name ?? '<missing>') + ' is not an explicit Device-JS callable descriptor');
    }
    const calls = fn.calls.map((name) => {
      if (typeof name !== 'string' || !localFunctionNames.has(name)) fail('TENSOR_EVALUATOR_PROGRAM_BINDING_FUNCTION', fn.name + ' names unknown local call ' + String(name));
      return name;
    });
    if (new Set(calls).size !== calls.length) fail('TENSOR_EVALUATOR_PROGRAM_BINDING_FUNCTION', fn.name + ' repeats a local call edge');
    return {
      name: fn.name,
      executionRole: 'device-callable',
      parameters: fn.parameters.map(({ name, type }) => ({ name, type })),
      returns: fn.returns,
      sourceUnit: sourceId,
      ownerProfile: profile.id,
      semanticRole: roles.get(fn.name),
      calls,
      helpers: [],
    };
  });
  const liveImport = object(contribution.device.importIdentity, 'runtime Tensor import identity');
  const library = object(liveImport.library, 'runtime Tensor library identity');
  if (typeof liveImport.name !== 'string' || typeof liveImport.as !== 'string' || typeof library.contract !== 'string'
      || !HEX64.test(library.sha256) || !HEX64.test(library.artifactSha256)
      || !['ptx', 'lto-ir'].includes(library.format) || typeof library.architecture !== 'string' || library.architecture.length === 0) {
    fail('TENSOR_EVALUATOR_PROGRAM_BINDING_IMPORT', 'runtime Tensor import identity is invalid');
  }
  const required = new Map((profile.programContribution.requirements ?? []).map((entry) => [entry.id, structuredClone(entry)]));
  const selectedRequirements = contribution.requiredCudaJsContracts.map((contractId) => required.get(contractId));
  const binding = {
    kind: 'cuda-mcgs-tensor-evaluator-program-binding',
    contract: BINDING_CONTRACT,
    id,
    ownerProfile: profile.id,
    sourceUnit: {
      id: sourceId,
      ownerProfile: profile.id,
      semanticOwner: profile.id,
      kind: 'source-owner',
      source: canonicalSource(contribution.device.source),
      sourceIdentity: exactSourceIdentity,
      contributionIdentity: structuredClone(profile.programContribution.sourceIdentity),
      functions: functions.map(({ name }) => name).sort(),
      provenance: programProvenance(profile),
    },
    functions,
    deviceImports: [{
      schema: DEVICE_IMPORT_SCHEMA,
      id: importId,
      ownerProfile: profile.id,
      importName: liveImport.name,
      alias: liveImport.as,
      library: {
        contract: library.contract,
        sha256: library.sha256,
        format: library.format,
        architecture: library.architecture,
        artifactSha256: library.artifactSha256,
      },
    }],
    requiredCudaJsContracts: selectedRequirements,
    workClasses,
    ownership: {
      sourceUnits: [sourceId],
      functions: functions.map(({ name }) => name).sort(),
      deviceImports: [importId],
      publicRequirementConsumers: contribution.requiredCudaJsContracts
        .slice()
        .sort()
        .map((contractId) => ({ contractId, consumer: profile.id })),
    },
    resourceRequirements: contribution.resources.map((entry) => ({ ...entry })),
    tensorBindings: contribution.tensorBindings.map((entry) => ({ ...entry })),
    claimLimits: [
      'program-source-function-import-binding-only',
      'resource-plan-binding-not-included',
      'progress-runtime-entry-binding-not-included',
      'no-native-or-provider-qualification',
    ],
  };
  return freeze(binding);
}

export const tensorEvaluatorProgramBindingConstants = Object.freeze({
  bindingContract: BINDING_CONTRACT,
  evaluatorSchema: EVALUATOR_SCHEMA,
  deviceImportSchema: DEVICE_IMPORT_SCHEMA,
  workClassKeys: WORK_CLASS_KEYS,
});

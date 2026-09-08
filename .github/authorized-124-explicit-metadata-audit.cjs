const fs = require('node:fs');

function replaceCount(path, oldText, newText, expected = 1) {
  let text = fs.readFileSync(path, 'utf8');
  const count = text.split(oldText).length - 1;
  if (count !== expected) throw new Error(`${path}: expected ${expected} occurrences, found ${count}`);
  text = text.split(oldText).join(newText);
  fs.writeFileSync(path, text);
}

function replaceBetween(path, start, end, replacement) {
  let text = fs.readFileSync(path, 'utf8');
  const a = text.indexOf(start);
  if (a < 0) throw new Error(`${path}: start marker absent: ${start}`);
  const b = text.indexOf(end, a + start.length);
  if (b < 0) throw new Error(`${path}: end marker absent: ${end}`);
  text = text.slice(0, a) + replacement + text.slice(b);
  fs.writeFileSync(path, text);
}

const runtime = 'adapters/evaluators/cuda-js-tensor/src/runtime-contribution.mjs';
replaceCount(runtime,
  "const RUNTIME_CONTRACT = 'cuda-mcgs.tensor-evaluator-device-runtime/0.1.0';",
  "const RUNTIME_CONTRACT = 'cuda-mcgs.tensor-evaluator-device-runtime/0.2.0';");
replaceCount(runtime,
  "function deviceFunction(name, parameters, returns = 'u32') {\n  return { name, kind: 'device', parameters, returns };\n}",
  "function deviceFunction(name, parameters, returns = 'u32', calls = []) {\n  return { name, kind: 'device', parameters, returns, calls };\n}");

replaceBetween(runtime, 'function functionMetadata(connector, layout) {', '\nfunction resourcePlan(state, layout) {', `function functionMetadata(connector, layout) {
  const c32 = param(GENERATED_NAMES.control32, 'ptr<u32>');
  const c64 = param(GENERATED_NAMES.control64, 'ptr<u64>');
  const token = [
    param('itemIndex', 'u32'), param('expectedSlot', 'u32'), param('expectedSlotGeneration', 'u64'),
    param('expectedRequestGeneration', 'u64'), param('expectedBatchGeneration', 'u64'),
  ];
  const prepare = [...token, c32, c64, ...partitionParameters('request', layout.requestInputPartitions)];
  for (const descriptor of layout.tensorParameters.filter(({ role, itemVarying }) => role === 'input' && itemVarying)) prepare.push(param(descriptor.parameterName, descriptor.type));
  const execute = [...token, c32, c64, ...connector.deviceFunction.parameters.filter(({ name }) => name !== 'itemIndex').map(({ name, type }) => param(name, type))];
  const scatter = [...token, c32, c64];
  for (const descriptor of layout.tensorParameters.filter(({ role }) => role === 'output')) scatter.push(param(descriptor.parameterName, descriptor.type));
  scatter.push(...partitionParameters('result', layout.resultOutputPartitions));
  return [
    { ...connector.deviceFunction, calls: [] },
    deviceFunction(GENERATED_NAMES.requestMatches, [param('slot', 'u32'), param('expectedSlotGeneration', 'u64'), param('expectedRequestGeneration', 'u64'), c64], 'bool'),
    deviceFunction(GENERATED_NAMES.batchItemMatches, [...token, c32, c64], 'bool'),
    deviceFunction(GENERATED_NAMES.finishBatchItem, [param('itemIndex', 'u32'), param('expectedItemStatus', 'u32'), param('expectedBatchGeneration', 'u64'), c32, c64]),
    deviceFunction(GENERATED_NAMES.admit, [param('slot', 'u32'), param('requestGenerationValue', 'u64'), c32, c64]),
    deviceFunction(GENERATED_NAMES.cancel, [param('slot', 'u32'), param('expectedSlotGeneration', 'u64'), param('expectedRequestGeneration', 'u64'), c32, c64], 'u32', [GENERATED_NAMES.requestMatches]),
    deviceFunction(GENERATED_NAMES.formBatch, [c32, c64]),
    deviceFunction(GENERATED_NAMES.prepareItem, prepare, 'u32', [GENERATED_NAMES.batchItemMatches]),
    deviceFunction(GENERATED_NAMES.executeItem, execute, 'u32', [GENERATED_NAMES.batchItemMatches, connector.deviceFunction.name]),
    deviceFunction(GENERATED_NAMES.scatterItem, scatter, 'u32', [GENERATED_NAMES.batchItemMatches]),
    deviceFunction(GENERATED_NAMES.publishItem, [...token, c32, c64], 'u32', [GENERATED_NAMES.batchItemMatches, GENERATED_NAMES.finishBatchItem]),
    deviceFunction(GENERATED_NAMES.retryItem, [...token, c32, c64], 'u32', [GENERATED_NAMES.batchItemMatches, GENERATED_NAMES.finishBatchItem]),
    deviceFunction(GENERATED_NAMES.recycle, [param('slot', 'u32'), param('expectedSlotGeneration', 'u64'), param('expectedRequestGeneration', 'u64'), c32, c64], 'u32', [GENERATED_NAMES.requestMatches]),
  ];
}
`);

replaceBetween(runtime, 'function resourcePlan(state, layout) {', '\nexport function createTensorEvaluatorRuntimeContribution', `function resourcePlan(state, layout) {
  return [
    {
      id: 'runtime.control32', resourceKey: 'tensor-runtime-control32', representationRole: 'runtime-control',
      parameterName: GENERATED_NAMES.control32, dtype: 'u32', access: 'read-write', resourceClass: 'batch',
      pressureStatus: 'evaluator-internal-failure', resourceAccess: ['read', 'write', 'atomic'],
      elementCount: state.control32.elementCount, byteLength: state.control32.byteLength, alignmentBytes: 4,
      initialization: 'zero-before-ignition',
    },
    {
      id: 'runtime.control64', resourceKey: 'tensor-runtime-control64', representationRole: 'runtime-control',
      parameterName: GENERATED_NAMES.control64, dtype: 'u64', access: 'read-write', resourceClass: 'batch',
      pressureStatus: 'evaluator-internal-failure', resourceAccess: ['read', 'write'],
      elementCount: state.control64.elementCount, byteLength: state.control64.byteLength, alignmentBytes: 8,
      initialization: 'zero-before-ignition',
    },
    ...layout.requestInputPartitions.map((entry) => ({
      ...entry,
      resourceKey: 'tensor-runtime-request-input-' + entry.dtype,
      representationRole: 'request-staging', resourceClass: 'input', pressureStatus: 'invalid-evaluator-input',
      resourceAccess: ['read', 'write'], alignmentBytes: DTYPE_WIDTH[entry.dtype], initialization: 'zero-before-ignition',
    })),
    ...layout.resultOutputPartitions.map((entry) => ({
      ...entry,
      resourceKey: 'tensor-runtime-result-output-' + entry.dtype,
      representationRole: 'result-staging', resourceClass: 'result', pressureStatus: 'evaluator-output-invalid',
      resourceAccess: ['read', 'write'], alignmentBytes: DTYPE_WIDTH[entry.dtype], initialization: 'zero-before-ignition',
    })),
  ];
}
`);

const oldTensorBindings = `  const tensorBindings = layout.tensorParameters.map((entry) => ({
    parameterName: entry.parameterName,
    role: entry.role,
    type: entry.type,
    dtype: entry.dtype,
    access: entry.role === 'input' && !entry.itemVarying ? 'read' : 'read-write',
    itemVarying: entry.itemVarying,
    byteLength: entry.byteLength,
    initialization: entry.role === 'input' && !entry.itemVarying ? 'external-before-ignition' : 'zero-before-ignition',
  }));`;
const newTensorBindings = `  const tensorBindings = layout.tensorParameters.map((entry) => {
    const external = entry.role === 'input' && !entry.itemVarying;
    const resourceClass = external ? null : (entry.role === 'input' ? 'input' : (entry.role === 'output' ? 'result' : 'workspace'));
    const pressureStatus = external ? null : (entry.role === 'input' ? 'invalid-evaluator-input' : (entry.role === 'output' ? 'evaluator-output-invalid' : 'evaluator-workspace-capacity'));
    const representationRole = external ? 'external-tensor-input' : (entry.role === 'input' ? 'tensor-input-staging' : (entry.role === 'output' ? 'tensor-output-staging' : 'tensor-workspace'));
    return {
      parameterIndex: entry.parameterIndex,
      resourceKey: 'tensor-parameter-' + entry.parameterIndex,
      representationRole,
      parameterName: entry.parameterName,
      role: entry.role,
      type: entry.type,
      dtype: entry.dtype,
      access: external ? 'read' : 'read-write',
      itemVarying: entry.itemVarying,
      byteLength: entry.byteLength,
      storageDisposition: external ? 'external-owner-required' : 'evaluator-resource',
      resourceClass,
      pressureStatus,
      resourceAccess: external ? ['read'] : ['read', 'write'],
      alignmentBytes: entry.role === 'workspace' ? entry.alignmentBytes : DTYPE_WIDTH[entry.dtype],
      initialization: external ? 'external-before-ignition' : 'zero-before-ignition',
    };
  });`;
replaceCount(runtime, oldTensorBindings, newTensorBindings);

const program = 'adapters/evaluators/cuda-js-tensor/src/program-binding.mjs';
replaceCount(program,
  "const BINDING_CONTRACT = 'cuda-mcgs.tensor-evaluator-program-binding/0.1.0';\nconst RUNTIME_CONTRACT = 'cuda-mcgs.tensor-evaluator-device-runtime/0.1.0';",
  "const BINDING_CONTRACT = 'cuda-mcgs.tensor-evaluator-program-binding/0.2.0';\nconst RUNTIME_CONTRACT = 'cuda-mcgs.tensor-evaluator-device-runtime/0.2.0';");
replaceBetween(program, 'function callMetadata(contribution) {', '\nfunction functionRoles(contribution, profile, workClasses) {', '');
replaceCount(program, "  const calls = callMetadata(contribution);\n  const roles = functionRoles(contribution, profile, workClasses);\n  const functions = contribution.device.functions.map((fn) => {\n    if (fn.kind !== 'device' || !Array.isArray(fn.parameters) || typeof fn.returns !== 'string') {\n      fail('TENSOR_EVALUATOR_PROGRAM_BINDING_FUNCTION', `${fn.name ?? '<missing>'} is not a Device-JS callable descriptor`);\n    }\n    return {",
`  const roles = functionRoles(contribution, profile, workClasses);
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
    return {`);
replaceCount(program, "      calls: [...(calls.get(fn.name) ?? [])],", "      calls,");

const runtimeTest = 'conformance/cuda-js-tensor-evaluator/runtime.mjs';
replaceCount(runtimeTest,
  "assert.equal(contribution.contract, 'cuda-mcgs.tensor-evaluator-device-runtime/0.1.0');",
  "assert.equal(contribution.contract, 'cuda-mcgs.tensor-evaluator-device-runtime/0.2.0');\nassert(contribution.resources.every(({ resourceKey, representationRole, resourceClass, pressureStatus, resourceAccess, alignmentBytes }) => typeof resourceKey === 'string' && typeof representationRole === 'string' && typeof resourceClass === 'string' && typeof pressureStatus === 'string' && Array.isArray(resourceAccess) && Number.isSafeInteger(alignmentBytes)));\nassert(contribution.tensorBindings.every(({ parameterIndex, resourceKey, representationRole, storageDisposition, resourceAccess, alignmentBytes }) => Number.isSafeInteger(parameterIndex) && typeof resourceKey === 'string' && typeof representationRole === 'string' && typeof storageDisposition === 'string' && Array.isArray(resourceAccess) && Number.isSafeInteger(alignmentBytes)));\nassert(contribution.device.functions.every(({ calls }) => Array.isArray(calls)), 'runtime must publish explicit local call graph metadata');");

const resourceTest = 'conformance/cuda-js-tensor-evaluator/resource-binding.mjs';
replaceCount(resourceTest, 'bindTensorEvaluatorProfileResources(programBound, runtime, connector)', 'bindTensorEvaluatorProfileResources(programBound, runtime)', 3);
replaceCount(resourceTest, 'createTensorEvaluatorResourceBinding(programBinding, connector, evaluatorResult, resourceResult)', 'createTensorEvaluatorResourceBinding(programBinding, evaluatorResult, resourceResult)', 1);
replaceCount(resourceTest, 'createTensorEvaluatorResourceBinding(programBinding, connector, missingRepresentation, resourceResult)', 'createTensorEvaluatorResourceBinding(programBinding, missingRepresentation, resourceResult)', 1);
replaceCount(resourceTest, 'createTensorEvaluatorResourceBinding(programBinding, connector, evaluatorResult, providerDrift)', 'createTensorEvaluatorResourceBinding(programBinding, evaluatorResult, providerDrift)', 1);
replaceCount(resourceTest, 'createTensorEvaluatorResourceBinding(programBinding, connector, evaluatorResult, placementDrift)', 'createTensorEvaluatorResourceBinding(programBinding, evaluatorResult, placementDrift)', 1);
replaceCount(resourceTest, 'binding.allocations', 'binding.resourceBindings', 7);
replaceCount(resourceTest, "id.includes('runtime-control')", "representationRole === 'runtime-control'", 1);
replaceCount(resourceTest, "representationResources.filter(({ id }) => id.includes('runtime-control')).every(({ class: resourceClass }) => resourceClass === 'batch')", "representationResources.filter(({ id }) => id.includes('tensor-runtime-control')).every(({ class: resourceClass }) => resourceClass === 'batch')", 1);
replaceCount(resourceTest, "id.endsWith('tensor-weights')", "id.endsWith('tensor-parameter-2')", 1);
replaceCount(resourceTest, "id.endsWith('tensor-scratch')", "id.endsWith('tensor-parameter-4')", 1);
replaceCount(resourceTest, "!id.includes('runtime-control32')", "!id.endsWith('tensor-runtime-control32')", 1);
replaceCount(resourceTest, "binding.allocations.length", "binding.resourceBindings.length", 2);

const component = 'adapters/evaluators/cuda-js-tensor/component.yaml';
replaceCount(component, 'cuda-mcgs.tensor-evaluator-device-runtime/0.1.0', 'cuda-mcgs.tensor-evaluator-device-runtime/0.2.0', 1);
replaceCount(component, 'cuda-mcgs.tensor-evaluator-program-binding/0.1.0', 'cuda-mcgs.tensor-evaluator-program-binding/0.2.0', 1);
replaceCount(component, 'cuda-mcgs.tensor-evaluator-resource-binding/0.1.0', 'cuda-mcgs.tensor-evaluator-resource-binding/0.2.0', 1);

console.log('explicit metadata audit patch applied');

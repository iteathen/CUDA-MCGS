import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TensorEvaluatorConnectorError,
  bindTensorEvaluatorProfileProgram,
  bindTensorEvaluatorProfileResources,
  createTensorEvaluatorConnector,
  createTensorEvaluatorProgramBinding,
  createTensorEvaluatorResourceBinding,
  createTensorEvaluatorRuntimeContribution,
  tensorEvaluatorResourceBindingConstants,
} from '../../adapters/evaluators/cuda-js-tensor/index.mjs';
import {
  normalizeDomainProfile,
  normalizeEvaluatorProfile,
  normalizeGraphProfile,
  normalizePolicyProfile,
  normalizeResourceProfile,
} from '../../components/search-compiler/testing.mjs';
import { inspectCatalog, sourceTextSha256 } from '../search-compiler/src/catalog.mjs';
import { buildDomainProfiles } from '../search-compiler/src/domain-fixtures.mjs';
import { buildEvaluatorProfiles } from '../search-compiler/src/evaluator-fixtures.mjs';
import { buildGraphProfiles } from '../search-compiler/src/graph-fixtures.mjs';
import { buildPolicyProfiles } from '../search-compiler/src/policy-fixtures.mjs';
import { buildResourceProfile } from '../search-compiler/src/resource-fixtures.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..', '..');
const schemaRoot = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0');
const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const schemaReference = (id) => ({ id, version: id.split('/').at(-1), sha256: sha256(`schema:${id}`) });
const withSchema = (result, schemaSha) => ({ ...result, schemaSha });
const contentIdentity = ({ algorithm, sha256: digest }) => ({ algorithm, sha256: digest });

function fakeTensorDeviceProgram() {
  const parameters = [
    { parameterIndex: 0, parameterName: 'itemIndex', role: 'item-index', type: 'u32', dtype: 'u32', access: 'read', itemVarying: false, byteLength: 0 },
    { parameterIndex: 1, parameterName: 'features', role: 'input', type: 'ptr<f32>', dtype: 'f32', access: 'read', itemVarying: true, byteLength: 16 },
    { parameterIndex: 2, parameterName: 'weights', role: 'input', type: 'ptr<f32>', dtype: 'f32', access: 'read', itemVarying: false, byteLength: 16 },
    { parameterIndex: 3, parameterName: 'scores', role: 'output', type: 'ptr<f32>', dtype: 'f32', access: 'write', itemVarying: true, byteLength: 16 },
    { parameterIndex: 4, parameterName: 'scratch', role: 'workspace', type: 'ptr<f32>', dtype: 'f32', access: 'read-write', itemVarying: true, byteLength: 32 },
  ];
  const fn = { name: 'tensorRunItem', parameters: parameters.map(({ parameterName: name, type }) => ({ name, type })), returns: 'u32' };
  const library = {
    schemaVersion: 1,
    contract: 'SPEC-0013-v1+SPEC-0022-atomic-observation-v1+SPEC-0022-device-publication-v1+SPEC-0014-publication-mailbox-v1+SPEC-0030-dense-numeric-v1+SPEC-0028-device-library-v1',
    sha256: '1'.repeat(64),
    format: 'lto-ir',
    architecture: 'compute_90',
    exports: [{ name: 'tensorRunItem', symbol: 'tensorRunItem', parameters: fn.parameters, returns: 'u32' }],
    artifact: { format: 'lto-ir', bytes: new Uint8Array([1]), byteLength: 1, sha256: '2'.repeat(64), architecture: 'compute_90', producer: { profile: 'fixture', nvrtcVersion: 'fixture' } },
  };
  return {
    kind: 'tensor-device-program',
    contract: 'SPEC-0009-item-parallel-device-tensor-program-v1',
    itemCapacity: 2,
    outputFormat: 'lto-ir',
    parameters,
    inputs: [
      { ...parameters[1], name: 'features', valueId: 'value.features', elementCount: 4 },
      { ...parameters[2], name: 'weights', valueId: 'value.weights', elementCount: 4 },
    ],
    outputs: [{ ...parameters[3], name: 'scores', valueId: 'value.scores', perItemElements: 2, elementCount: 4 }],
    workspace: [{ ...parameters[4], perItemElements: 4, elementCount: 8, alignmentBytes: 256 }],
    totalWorkspaceBytes: 32,
    function: fn,
    compatibilityIdentity: 'tensor-resource-layout-binding-v1',
    library,
    importAs(alias) { return Object.freeze({ library, name: 'tensorRunItem', as: alias }); },
  };
}

const contractSetInput = JSON.parse(await readFile(path.join(schemaRoot, 'contract-set.json'), 'utf8'));
const coverageInput = JSON.parse(await readFile(path.join(schemaRoot, 'requirement-coverage.json'), 'utf8'));
const inspected = await inspectCatalog(repositoryRoot, contractSetInput, coverageInput);
const domainSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'domain-profile.schema.json')));
const graphSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'graph-profile.schema.json')));
const evaluatorSchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'evaluator-profile.schema.json')));
const policySchemaSha = sourceTextSha256(await readFile(path.join(schemaRoot, 'policy-profile.schema.json')));

const domainProfiles = buildDomainProfiles(inspected).map((input) => normalizeDomainProfile(input, inspected));
const graphFixtures = buildGraphProfiles(inspected, domainProfiles, domainSchemaSha);
const graphProfiles = graphFixtures.map(({ input, domain }) => normalizeGraphProfile(input, inspected, domain));
const baselineEvaluatorFixtures = buildEvaluatorProfiles(inspected, domainProfiles, graphProfiles, domainSchemaSha, graphSchemaSha);
const baselineEvaluatorProfiles = baselineEvaluatorFixtures.map(({ input, domain, graph }) => normalizeEvaluatorProfile(input, inspected, domain, graph));
const policyFixtures = buildPolicyProfiles(inspected, domainProfiles, graphProfiles, domainSchemaSha, graphSchemaSha, baselineEvaluatorProfiles, evaluatorSchemaSha);
const policyProfiles = policyFixtures.map(({ input, domain, graph }) => normalizePolicyProfile(input, inspected, domain, graph));

const selectedFixture = baselineEvaluatorFixtures[0];
const selectedInput = structuredClone(selectedFixture.input);
selectedInput.request.maxActive = '3';
selectedInput.batching.maximumItems = '2';
const originalSemanticResources = structuredClone(selectedInput.resources);
const connector = createTensorEvaluatorConnector(fakeTensorDeviceProgram(), { requestCapacity: 3 });
const runtime = createTensorEvaluatorRuntimeContribution(connector);
const lowerRequirements = runtime.requiredCudaJsContracts.map(schemaReference);
const programBound = bindTensorEvaluatorProfileProgram(selectedInput, runtime, { publicRequirements: lowerRequirements });
const resourceBound = bindTensorEvaluatorProfileResources(programBound, runtime, connector);

assert.deepEqual(resourceBound.resources.slice(0, originalSemanticResources.length), originalSemanticResources, 'adapter resource binding must not rewrite semantic evaluator resources');
const representationResources = resourceBound.resources.slice(originalSemanticResources.length);
assert(representationResources.length > 0);
assert(representationResources.every(({ unit, minimum, maximum }) => unit === 'bytes' && minimum === maximum));
assert(representationResources.filter(({ id }) => id.includes('runtime-control')).every(({ class: resourceClass }) => resourceClass === 'batch'), 'runtime controls must not be disguised as workspace');
assert.equal(representationResources.some(({ id }) => id.endsWith('tensor-weights')), false, 'shared immutable Tensor input must not be synthesized as adapter-owned storage');
const scratchResource = representationResources.find(({ id }) => id.endsWith('tensor-scratch'));
assert(scratchResource);
assert.equal(scratchResource.class, 'workspace');
assert.equal(scratchResource.alignment, '256');

const evaluatorResult = normalizeEvaluatorProfile(resourceBound, inspected, selectedFixture.domain, selectedFixture.graph);
assert.notDeepEqual(evaluatorResult.identity, baselineEvaluatorProfiles[0].identity, 'runtime representation resources must be evaluator-identity material');
for (const semantic of originalSemanticResources) assert(evaluatorResult.normalized.resources.some((entry) => entry.id === semantic.id && entry.class === semantic.class && entry.unit === semantic.unit));

const evaluatorWorkClasses = Object.fromEntries(['encode', 'admit', 'batch', 'execute', 'scatter', 'publish'].map((name) => {
  const id = evaluatorResult.normalized.execution.workClasses.find((entry) => entry.endsWith(`work-${name}`));
  assert(id, `missing evaluator ${name} work class`);
  return [name, id];
}));
const programBinding = createTensorEvaluatorProgramBinding(runtime, evaluatorResult.normalized, {
  id: 'evaluator.tensor.resource-layout-program',
  workClasses: evaluatorWorkClasses,
});

const selectedPolicy = policyProfiles[1];
const resourceInput = buildResourceProfile('tensor-resource-layout', inspected, {
  domain: selectedFixture.domain,
  graph: selectedFixture.graph,
  policy: selectedPolicy,
  evaluator: evaluatorResult,
}, {
  domain: domainSchemaSha,
  graph: graphSchemaSha,
  policy: policySchemaSha,
  evaluator: evaluatorSchemaSha,
});
const knownProfiles = [
  ...domainProfiles.map((result) => withSchema(result, domainSchemaSha)),
  ...graphProfiles.map((result) => withSchema(result, graphSchemaSha)),
  ...policyProfiles.map((result) => withSchema(result, policySchemaSha)),
  withSchema(evaluatorResult, evaluatorSchemaSha),
];
const resourceResult = normalizeResourceProfile(resourceInput, inspected, knownProfiles);
const binding = createTensorEvaluatorResourceBinding(programBinding, connector, evaluatorResult, resourceResult);

assert.equal(binding.contract, tensorEvaluatorResourceBindingConstants.contract);
assert.equal(binding.ownerProfile, evaluatorResult.normalized.id);
assert.deepEqual(binding.evaluatorProfileIdentity, contentIdentity(evaluatorResult.identity));
assert.deepEqual(binding.resourcePlan, { id: resourceResult.normalized.id, identity: contentIdentity(resourceResult.identity) });
assert.equal(binding.externalTensorParameters.length, 1);
assert.deepEqual(binding.externalTensorParameters.map(({ parameterName }) => parameterName), ['weights']);
assert.equal(binding.allocations.length, representationResources.length);
assert(binding.allocations.every(({ evaluatorResource }) => representationResources.some(({ id }) => id === evaluatorResource)));
assert(binding.allocations.every(({ providerRequirement }) => resourceResult.normalized.providerRequirements.some(({ id, unit }) => id === providerRequirement && unit === 'bytes')));
assert(binding.allocations.every(({ partition, view }) => resourceResult.normalized.partitions.find(({ id }) => id === partition)?.offset === view.byteOffset), 'provider-relative offsets must come from Resource-owned partitions');
assert(binding.allocations.some(({ parameterName, evaluatorResourceClass, requiredAccess }) => parameterName === 'mcgsEvalControl32' && evaluatorResourceClass === 'batch' && requiredAccess.includes('atomic')));
assert(binding.allocations.some(({ parameterName, alignment }) => parameterName === 'scratch' && alignment === '256'));
assert.equal(binding.ownership.placement, 'resource-plan-partitions');
assert(binding.claimLimits.includes('no-caller-supplied-resource-offsets'));
assert(binding.claimLimits.includes('shared-immutable-tensor-input-binding-remains-explicit'));
assert(Object.isFrozen(binding));
assert(Object.isFrozen(binding.allocations[0]));

const missingRepresentation = structuredClone(evaluatorResult);
missingRepresentation.normalized.resources = missingRepresentation.normalized.resources.filter(({ id }) => !id.includes('runtime-control32'));
assert.throws(
  () => createTensorEvaluatorResourceBinding(programBinding, connector, missingRepresentation, resourceResult),
  (error) => error instanceof TensorEvaluatorConnectorError && error.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_RESOURCE',
);

const providerDrift = structuredClone(resourceResult);
const controlAllocation = binding.allocations.find(({ parameterName }) => parameterName === 'mcgsEvalControl32');
providerDrift.normalized.providerRequirements.find(({ id }) => id === controlAllocation.providerRequirement).access = ['read', 'write'];
assert.throws(
  () => createTensorEvaluatorResourceBinding(programBinding, connector, evaluatorResult, providerDrift),
  (error) => error?.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS',
);

const placementDrift = structuredClone(resourceResult);
placementDrift.normalized.partitions.find(({ id }) => id === binding.allocations.find(({ parameterName }) => parameterName === 'scratch').partition).offset = '4';
assert.throws(
  () => createTensorEvaluatorResourceBinding(programBinding, connector, evaluatorResult, placementDrift),
  (error) => error?.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_ALIGNMENT',
);

const noWorkspace = structuredClone(programBound);
noWorkspace.workspaces = [];
assert.throws(
  () => bindTensorEvaluatorProfileResources(noWorkspace, runtime, connector),
  (error) => error?.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_WORKSPACE',
  'adapter must not manufacture workspace semantics just to host runtime buffers',
);

const conflictingResource = structuredClone(programBound);
const conflictId = representationResources[0].id;
conflictingResource.resources.push({ id: conflictId, class: 'input', unit: 'bytes', minimum: '1', maximum: '1', alignment: '1', scope: 'per-engine', pressureStatus: 'invalid-evaluator-input' });
assert.throws(
  () => bindTensorEvaluatorProfileResources(conflictingResource, runtime, connector),
  (error) => error?.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_RESOURCE',
);

console.log(JSON.stringify({
  schema: 'cuda-mcgs.tensor-evaluator-resource-layout-binding-portable-evidence/0.1.0',
  status: 'pass',
  evaluatorRepresentationResources: representationResources.length,
  boundAllocations: binding.allocations.length,
  externalTensorParameters: binding.externalTensorParameters.map(({ parameterName }) => parameterName),
  cases: [
    'semantic-resource-counts-preserved',
    'runtime-byte-extents-become-evaluator-identity',
    'control-state-not-disguised-as-workspace',
    'tensor-workspace-alignment-preserved',
    'shared-immutable-tensor-input-remains-external',
    'unchanged-resource-planner-produces-byte-provider-chains',
    'resource-owned-partition-offsets-only',
    'provider-access-drift-fails-closed',
    'resource-placement-alignment-drift-fails-closed',
    'workspace-meaning-not-manufactured',
    'generated-resource-id-conflict-fails-closed',
    'deep-freeze',
  ],
  claimLimits: [
    'cuda-free-portable-resource-composition',
    'no-generic-resource-schema-change',
    'shared-immutable-tensor-input-binding-remains-open',
    'progress-runtime-entry-binding-remains-open',
    'no-native-or-provider-qualification',
  ],
}));

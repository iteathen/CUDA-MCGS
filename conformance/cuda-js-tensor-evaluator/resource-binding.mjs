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
  createTensorEvaluatorArtifactInputBinding,
  admitTensorEvaluatorArtifactInputs,
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
import { buildPolicyProfile } from '../search-compiler/src/policy-fixtures.mjs';
import { buildResourceProfile } from '../search-compiler/src/resource-fixtures.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..', '..');
const schemaRoot = path.join(repositoryRoot, 'schemas', 'search-ir', '0.2.0');
const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const schemaReference = (id) => ({ id, version: id.split('/').at(-1), sha256: sha256(`schema:${id}`) });
const withSchema = (result, schemaSha) => ({ ...result, schemaSha });
const contentIdentity = ({ algorithm, sha256: digest }) => ({ algorithm, sha256: digest });

function fakeTensorDeviceProgram(sharedName = 'weights') {
  const parameters = [
    { parameterIndex: 0, parameterName: 'itemIndex', role: 'item-index', type: 'u32', dtype: 'u32', access: 'read', itemVarying: false, byteLength: 0 },
    { parameterIndex: 1, parameterName: 'features', role: 'input', type: 'ptr<f32>', dtype: 'f32', access: 'read', itemVarying: true, byteLength: 16 },
    { parameterIndex: 2, parameterName: 'weights', role: 'input', type: 'ptr<f32>', dtype: 'f32', access: 'read', itemVarying: false, byteLength: 16 },
    { parameterIndex: 3, parameterName: 'scores', role: 'output', type: 'ptr<f32>', dtype: 'f32', access: 'write', itemVarying: true, byteLength: 16 },
    { parameterIndex: 4, parameterName: 'scratch', role: 'workspace', type: 'ptr<f32>', dtype: 'f32', access: 'read-write', itemVarying: true, byteLength: 32 },
  ];
  parameters[2].parameterName = sharedName;
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
      { ...parameters[1], name: 'features', spec: { dtype: 'f32', dtypeWidth: 4, alignment: 64 }, valueId: 'value.features', elementCount: 4 },
      { ...parameters[2], name: sharedName, spec: { dtype: 'f32', dtypeWidth: 4, alignment: 128 }, valueId: `value.${sharedName}`, elementCount: 4 },
    ],
    outputs: [{ ...parameters[3], name: 'scores', spec: { dtype: 'f32', dtypeWidth: 4, alignment: 32 }, valueId: 'value.scores', perItemElements: 2, elementCount: 4 }],
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
const selectedFixture = baselineEvaluatorFixtures[0];
const selectedInput = structuredClone(selectedFixture.input);
const artifactPayload = Uint8Array.from({ length: 16 }, (_, index) => index + 1);
selectedInput.artifacts[0].provenance.contentSha256 = sha256(artifactPayload);
selectedInput.request.maxActive = '3';
selectedInput.batching.maximumItems = '2';
// The selected evaluator owner, not the Tensor adapter, chooses this artifact
// resource and its finite whole-payload representation.
const selectedArtifactResource = selectedInput.resources.find(({ class: kind }) => kind === 'artifact');
Object.assign(selectedArtifactResource, { minimum: '16', maximum: '16', alignment: '128' });
const originalSemanticResources = structuredClone(selectedInput.resources);
const connector = createTensorEvaluatorConnector(fakeTensorDeviceProgram(), { requestCapacity: 3 });
const runtime = createTensorEvaluatorRuntimeContribution(connector);
const lowerRequirements = runtime.requiredCudaJsContracts.map(schemaReference);
const programBound = bindTensorEvaluatorProfileProgram(selectedInput, runtime, { publicRequirements: lowerRequirements });
const resourceBound = bindTensorEvaluatorProfileResources(programBound, runtime);

assert.deepEqual(resourceBound.resources.slice(0, originalSemanticResources.length), originalSemanticResources, 'adapter resource binding must not rewrite semantic evaluator resources');
const representationResources = resourceBound.resources.slice(originalSemanticResources.length);
assert(representationResources.length > 0);
assert(representationResources.every(({ unit, minimum, maximum }) => unit === 'bytes' && minimum === maximum));
const representationById = new Map(representationResources.map((entry) => [entry.id, entry]));
const evaluatorResourceId = ({ resourceKey }) => resourceBound.id + '.resource-' + resourceKey;
const requestControls = runtime.resources.filter(({ representationRole }) => representationRole === 'request-control');
const batchControls = runtime.resources.filter(({ representationRole }) => representationRole === 'batch-control');
assert.equal(requestControls.length, 2);
assert.equal(batchControls.length, 2);
assert(requestControls.every((descriptor) => descriptor.resourceClass === 'request' && representationById.get(evaluatorResourceId(descriptor))?.class === 'request'));
assert(batchControls.every((descriptor) => descriptor.resourceClass === 'batch' && representationById.get(evaluatorResourceId(descriptor))?.class === 'batch'));
const externalDescriptor = runtime.tensorBindings.find(({ storageDisposition }) => storageDisposition === 'external-owner-required');
assert(externalDescriptor);
assert.equal(representationById.has(evaluatorResourceId(externalDescriptor)), false, 'external-owner-required Tensor input must not be synthesized as adapter-owned storage');
const workspaceDescriptor = runtime.tensorBindings.find(({ representationRole }) => representationRole === 'tensor-workspace');
assert(workspaceDescriptor);
const scratchResource = representationById.get(evaluatorResourceId(workspaceDescriptor));
assert(scratchResource);
assert.equal(scratchResource.class, workspaceDescriptor.resourceClass);
assert.equal(scratchResource.alignment, String(workspaceDescriptor.alignmentBytes));

const evaluatorResult = normalizeEvaluatorProfile(resourceBound, inspected, selectedFixture.domain, selectedFixture.graph);
assert.notDeepEqual(evaluatorResult.identity, baselineEvaluatorProfiles[0].identity, 'runtime representation resources must be evaluator-identity material');
for (const semantic of originalSemanticResources) assert(evaluatorResult.normalized.resources.some((entry) => entry.id === semantic.id && entry.class === semantic.class && entry.unit === semantic.unit));

const evaluatorWorkClasses = Object.freeze({
  encode: 'evaluator.synthetic-vector-combined.work-encode',
  admit: 'evaluator.synthetic-vector-combined.work-admit',
  batch: 'evaluator.synthetic-vector-combined.work-batch',
  execute: 'evaluator.synthetic-vector-combined.work-execute',
  scatter: 'evaluator.synthetic-vector-combined.work-scatter',
  publish: 'evaluator.synthetic-vector-combined.work-publish',
});
assert.deepEqual(new Set(Object.values(evaluatorWorkClasses)), new Set(evaluatorResult.normalized.execution.workClasses), 'explicit fixture work-class mapping must cover the normalized evaluator work set');
const programBinding = createTensorEvaluatorProgramBinding(runtime, evaluatorResult.normalized, {
  id: 'evaluator.tensor.resource-layout-program',
  workClasses: evaluatorWorkClasses,
});

const exactEvaluatorReference = {
  id: evaluatorResult.normalized.id,
  schema: { id: evaluatorResult.normalized.schema, version: '0.2.0', sha256: evaluatorSchemaSha },
  identity: contentIdentity(evaluatorResult.identity),
};
const selectedPolicyInput = buildPolicyProfile(
  'synthetic-vector-combined', inspected, selectedFixture.domain, selectedFixture.graph, domainSchemaSha, graphSchemaSha,
  { evaluatorMode: 'combined', evaluatorProfile: exactEvaluatorReference, value: 'vector', reservation: true, admissionMode: 'sampled', stochastic: true },
);
const selectedPolicy = normalizePolicyProfile(selectedPolicyInput, inspected, selectedFixture.domain, selectedFixture.graph);
const evaluatorValueAdapter = selectedPolicy.normalized.value.adapters.find(({ kind }) => kind === 'evaluator');
const evaluatorProposalSource = selectedPolicy.normalized.admission.sources.find(({ kind }) => kind === 'evaluator-proposal');
assert(evaluatorValueAdapter && evaluatorProposalSource, 'combined policy fixture must consume evaluator value and proposal surfaces');
assert.deepEqual(evaluatorValueAdapter.sourceProfile, exactEvaluatorReference, 'policy value adapter must bind the exact mutated evaluator identity');
assert.deepEqual(evaluatorProposalSource.producerProfile, exactEvaluatorReference, 'policy proposal source must bind the exact mutated evaluator identity');
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
  withSchema(selectedPolicy, policySchemaSha),
  withSchema(evaluatorResult, evaluatorSchemaSha),
];
const resourceResult = normalizeResourceProfile(resourceInput, inspected, knownProfiles);
assert.equal('resourceRequirements' in programBinding, false);
assert.equal('tensorBindings' in programBinding, false);
const binding = createTensorEvaluatorResourceBinding(runtime, evaluatorResult, resourceResult);

assert.equal(binding.contract, tensorEvaluatorResourceBindingConstants.contract);
assert.equal(binding.ownerProfile, evaluatorResult.normalized.id);
assert.deepEqual(binding.evaluatorProfileIdentity, contentIdentity(evaluatorResult.identity));
assert.deepEqual(binding.resourcePlan, { id: resourceResult.normalized.id, identity: contentIdentity(resourceResult.identity) });
const sourceDriftRuntime = { ...runtime, device: { ...runtime.device, source: runtime.device.source + '\n// audit-source-drift\n' } };
assert.throws(
  () => createTensorEvaluatorResourceBinding(sourceDriftRuntime, evaluatorResult, resourceResult),
  (error) => error?.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_IDENTITY',
  'Resource Binding must reject a runtime whose source differs from the normalized evaluator identity',
);
assert.equal(binding.externalTensorParameters.length, 1);
assert.equal(binding.externalTensorParameters[0].alignment, '128', 'shared Tensor input must preserve public TensorSpec alignment');
assert.deepEqual(binding.externalTensorParameters.map(({ parameterName }) => parameterName), ['weights']);
assert.equal(binding.resourceBindings.length, representationResources.length);
assert(binding.resourceBindings.every(({ evaluatorResource }) => representationResources.some(({ id }) => id === evaluatorResource)));
assert(binding.resourceBindings.every(({ providerRequirement }) => resourceResult.normalized.providerRequirements.some(({ id, unit }) => id === providerRequirement && unit === 'bytes')));
assert(binding.resourceBindings.every(({ partition, view }) => resourceResult.normalized.partitions.find(({ id }) => id === partition)?.offset === view.byteOffset), 'provider-relative offsets must come from Resource-owned partitions');
assert(binding.resourceBindings.some(({ representationRole, evaluatorResourceClass, requiredAccess }) => representationRole === 'request-control' && evaluatorResourceClass === 'request' && requiredAccess.includes('atomic')));
assert(binding.resourceBindings.some(({ representationRole, evaluatorResourceClass, requiredAccess }) => representationRole === 'batch-control' && evaluatorResourceClass === 'batch' && requiredAccess.includes('atomic')));
assert(binding.resourceBindings.some(({ parameterName, alignment }) => parameterName === 'features' && alignment === '64'));
assert(binding.resourceBindings.some(({ parameterName, alignment }) => parameterName === 'scores' && alignment === '32'));
assert(binding.resourceBindings.some(({ representationRole, alignment }) => representationRole === 'request-staging' && alignment === '4'), 'request staging must use copy dtype alignment, not Tensor pointer alignment');
assert(binding.resourceBindings.some(({ parameterName, alignment }) => parameterName === 'scratch' && alignment === '256'));
assert.equal(binding.ownership.placement, 'resource-plan-partitions');
assert(binding.claimLimits.includes('no-caller-supplied-resource-offsets'));
assert(binding.claimLimits.includes('shared-immutable-tensor-input-binding-remains-explicit'));
assert(Object.isFrozen(binding));
assert(Object.isFrozen(binding.resourceBindings[0]));

const missingRepresentation = structuredClone(evaluatorResult);
const atomicControlDescriptor = runtime.resources.find(({ representationRole, resourceAccess }) => representationRole === 'request-control' && resourceAccess.includes('atomic'));
assert(atomicControlDescriptor);
missingRepresentation.normalized.resources = missingRepresentation.normalized.resources.filter(({ id }) => id !== evaluatorResourceId(atomicControlDescriptor));
assert.throws(
  () => createTensorEvaluatorResourceBinding(runtime, missingRepresentation, resourceResult),
  (error) => error instanceof TensorEvaluatorConnectorError && error.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_RESOURCE',
);

const providerDrift = structuredClone(resourceResult);
const controlAllocation = binding.resourceBindings.find(({ representationRole, requiredAccess }) => representationRole === 'request-control' && requiredAccess.includes('atomic'));
providerDrift.normalized.providerRequirements.find(({ id }) => id === controlAllocation.providerRequirement).access = ['read', 'write'];
assert.throws(
  () => createTensorEvaluatorResourceBinding(runtime, evaluatorResult, providerDrift),
  (error) => error?.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS',
);

const placementDrift = structuredClone(resourceResult);
placementDrift.normalized.partitions.find(({ id }) => id === binding.resourceBindings.find(({ representationRole }) => representationRole === 'tensor-workspace').partition).offset = '4';
assert.throws(
  () => createTensorEvaluatorResourceBinding(runtime, evaluatorResult, placementDrift),
  (error) => error?.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_ALIGNMENT',
);

const noWorkspace = structuredClone(programBound);
noWorkspace.workspaces = [];
assert.throws(
  () => bindTensorEvaluatorProfileResources(noWorkspace, runtime),
  (error) => error?.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_WORKSPACE',
  'adapter must not manufacture workspace semantics just to host runtime buffers',
);

const conflictingResource = structuredClone(programBound);
const conflictId = representationResources[0].id;
conflictingResource.resources.push({ id: conflictId, class: 'input', unit: 'bytes', minimum: '1', maximum: '1', alignment: '1', scope: 'per-engine', pressureStatus: 'invalid-evaluator-input' });
assert.throws(
  () => bindTensorEvaluatorProfileResources(conflictingResource, runtime),
  (error) => error?.code === 'TENSOR_EVALUATOR_RESOURCE_BINDING_RESOURCE',
);

const artifactSelections = [{
  parameterName: 'weights',
  artifactId: evaluatorResult.normalized.artifacts[0].id,
  artifactIdentity: contentIdentity(evaluatorResult.normalized.artifacts[0].identity),
  resourceId: selectedArtifactResource.id,
}];
const artifactInputs = createTensorEvaluatorArtifactInputBinding(runtime, evaluatorResult, resourceResult, artifactSelections);
assert.equal(artifactInputs.inputs.length, 1);
const weights = artifactInputs.inputs[0];
assert.equal(weights.evaluatorResource, selectedArtifactResource.id);
assert.equal(weights.evaluatorResourceClass, 'artifact');
assert.equal(weights.access, 'read');
assert.equal(weights.byteLength, '16');
assert.equal(weights.alignment, '128');
assert.equal(weights.view.byteOffset, resourceResult.normalized.partitions.find(({ id }) => id === weights.partition).offset);
assert.deepEqual(weights.artifact, evaluatorResult.normalized.artifacts[0]);
assert.equal(weights.payload.sha256, weights.artifact.provenance.contentSha256);
assert(Object.isFrozen(weights.artifact.provenance));
assert(Object.isFrozen(artifactInputs.inputs));
assert.deepEqual(createTensorEvaluatorArtifactInputBinding(runtime, evaluatorResult, resourceResult, artifactSelections), artifactInputs);

const admitPayloads = (payloads) => admitTensorEvaluatorArtifactInputs(runtime, evaluatorResult, resourceResult, artifactSelections, payloads);
const callerBytes = Buffer.concat([Buffer.from([99]), Buffer.from(artifactPayload), Buffer.from([98])]);
const admitted = admitPayloads({ weights: callerBytes.subarray(1, 17) });
assert(Object.isFrozen(admitted));
assert.deepEqual(admitted.binding, artifactInputs);
callerBytes.fill(0);
const uploadCopy = admitted.copyPayload('weights');
assert.deepEqual(uploadCopy, artifactPayload, 'admission must snapshot only the supplied Buffer view');
uploadCopy.fill(0);
assert.deepEqual(admitted.copyPayload('weights'), artifactPayload, 'upload copies must not mutate admitted content');
const corruptPayload = Uint8Array.from(artifactPayload);
corruptPayload[7] ^= 1;
const payloadCases = [
  ['missing-payload', {}, 'TENSOR_EVALUATOR_ARTIFACT_PAYLOADS'],
  ['extra-payload', { weights: artifactPayload, extra: artifactPayload }, 'TENSOR_EVALUATOR_ARTIFACT_PAYLOADS'],
  ['untyped-payload', { weights: Array.from(artifactPayload) }, 'TENSOR_EVALUATOR_ARTIFACT_PAYLOAD_TYPE'],
  ['shared-payload', { weights: new Uint8Array(new SharedArrayBuffer(16)) }, 'TENSOR_EVALUATOR_ARTIFACT_PAYLOAD_TYPE'],
  ['short-payload', { weights: artifactPayload.subarray(1) }, 'TENSOR_EVALUATOR_ARTIFACT_PAYLOAD_EXTENT'],
  ['long-payload', { weights: new Uint8Array(17) }, 'TENSOR_EVALUATOR_ARTIFACT_PAYLOAD_EXTENT'],
  ['wrong-content', { weights: corruptPayload }, 'TENSOR_EVALUATOR_ARTIFACT_PAYLOAD_IDENTITY'],
];
for (const [id, payloads, code] of payloadCases) assert.throws(() => admitPayloads(payloads), { code }, id);
assert.throws(() => admitted.copyPayload('features'), { code: 'TENSOR_EVALUATOR_ARTIFACT_PAYLOADS' });
assert.deepEqual(admitPayloads({ weights: artifactPayload }).copyPayload('weights'), artifactPayload, 'failed admission must not poison a later valid admission');
console.log(JSON.stringify({ artifactPayloadAdmission: 'pass', negativeCases: payloadCases.length + 1, snapshotIsolation: 'caller-and-consumer', claim: 'host-only' }));

const artifactCases = [
  ['missing-selection', 'TENSOR_EVALUATOR_ARTIFACT_SELECTION', (subject) => { subject.selections = []; }],
  ['unknown-parameter', 'TENSOR_EVALUATOR_ARTIFACT_SELECTION', (subject) => { subject.selections[0].parameterName = 'features'; }],
  ['caller-placement', 'TENSOR_EVALUATOR_ARTIFACT_SELECTION', (subject) => { subject.selections[0].byteOffset = '0'; }],
  ['unknown-owner', 'TENSOR_EVALUATOR_ARTIFACT_OWNER', (subject) => { subject.selections[0].artifactId = 'evaluator.unknown'; }],
  ['artifact-identity-drift', 'TENSOR_EVALUATOR_ARTIFACT_IDENTITY', (subject) => { subject.selections[0].artifactIdentity.sha256 = '0'.repeat(64); }],
  ['mutable-artifact', 'TENSOR_EVALUATOR_ARTIFACT_LIFETIME', (subject) => { subject.evaluator.normalized.artifacts[0].mutability = 'selected-mutable'; }],
  ['session-artifact', 'TENSOR_EVALUATOR_ARTIFACT_LIFETIME', (subject) => { subject.evaluator.normalized.artifacts[0].scope = 'session'; }],
  ['late-residence', 'TENSOR_EVALUATOR_ARTIFACT_LIFETIME', (subject) => { subject.evaluator.normalized.artifacts[0].residentBeforeIgnition = false; }],
  ['byte-bound', 'TENSOR_EVALUATOR_ARTIFACT_EXTENT', (subject) => { subject.evaluator.normalized.artifacts[0].maxBytes = '15'; }],
  ['element-bound', 'TENSOR_EVALUATOR_ARTIFACT_EXTENT', (subject) => { subject.evaluator.normalized.artifacts[0].maxElements = '3'; }],
  ['non-artifact-resource', 'TENSOR_EVALUATOR_ARTIFACT_OWNER', (subject) => { subject.selections[0].resourceId = representationResources[0].id; }],
  ['alignment-drift', 'TENSOR_EVALUATOR_RESOURCE_BINDING_ALIGNMENT', (subject) => { subject.evaluator.normalized.resources.find(({ id }) => id === selectedArtifactResource.id).alignment = '64'; }],
  ['resource-byte-drift', 'TENSOR_EVALUATOR_RESOURCE_BINDING_RESOURCE', (subject) => { subject.evaluator.normalized.resources.find(({ id }) => id === selectedArtifactResource.id).maximum = '32'; }],
  ['provider-access-drift', 'TENSOR_EVALUATOR_RESOURCE_BINDING_ACCESS', (subject) => { subject.resource.normalized.providerRequirements.find(({ id }) => id === weights.providerRequirement).access = ['write']; }],
  ['runtime-source-drift', 'TENSOR_EVALUATOR_RESOURCE_BINDING_IDENTITY', (subject) => { subject.runtime.device.source += '\n// drift'; }],
];
for (const [id, code, mutate] of artifactCases) {
  // Runtime includes callable import functions; only its data/source is mutated.
  const subject = { runtime: { ...runtime, device: { ...runtime.device } }, evaluator: structuredClone(evaluatorResult), resource: structuredClone(resourceResult), selections: structuredClone(artifactSelections) };
  mutate(subject);
  assert.throws(() => createTensorEvaluatorArtifactInputBinding(subject.runtime, subject.evaluator, subject.resource, subject.selections), (error) => error instanceof TensorEvaluatorConnectorError && error.code === code, id);
}
// A table evaluator with a differently named callable input uses the same
// binding contract. Rebuild real owner identities and Resource composition.
const tableRuntime = createTensorEvaluatorRuntimeContribution(createTensorEvaluatorConnector(fakeTensorDeviceProgram('lookupEntries'), { requestCapacity: 3 }));
const tableInput = structuredClone(selectedInput);
tableInput.artifacts[0].kind = 'table';
tableInput.artifacts[0].identity = { algorithm: 'sha256', sha256: sha256('independent-table-artifact') };
const tableProgram = bindTensorEvaluatorProfileProgram(tableInput, tableRuntime, { publicRequirements: tableRuntime.requiredCudaJsContracts.map(schemaReference) });
const tableEvaluator = normalizeEvaluatorProfile(bindTensorEvaluatorProfileResources(tableProgram, tableRuntime), inspected, selectedFixture.domain, selectedFixture.graph);
const tableReference = { ...exactEvaluatorReference, identity: contentIdentity(tableEvaluator.identity) };
const tablePolicy = normalizePolicyProfile(buildPolicyProfile('synthetic-vector-combined', inspected, selectedFixture.domain, selectedFixture.graph, domainSchemaSha, graphSchemaSha,
  { evaluatorMode: 'combined', evaluatorProfile: tableReference, value: 'vector', reservation: true, admissionMode: 'sampled', stochastic: true }), inspected, selectedFixture.domain, selectedFixture.graph);
const tableResourceInput = buildResourceProfile('table-input-binding', inspected, { domain: selectedFixture.domain, graph: selectedFixture.graph, policy: tablePolicy, evaluator: tableEvaluator },
  { domain: domainSchemaSha, graph: graphSchemaSha, policy: policySchemaSha, evaluator: evaluatorSchemaSha });
const tableResource = normalizeResourceProfile(tableResourceInput, inspected, [
  ...domainProfiles.map((result) => withSchema(result, domainSchemaSha)), ...graphProfiles.map((result) => withSchema(result, graphSchemaSha)),
  withSchema(tablePolicy, policySchemaSha), withSchema(tableEvaluator, evaluatorSchemaSha),
]);
const tableBinding = createTensorEvaluatorArtifactInputBinding(tableRuntime, tableEvaluator, tableResource, [{ ...artifactSelections[0], parameterName: 'lookupEntries', artifactIdentity: tableInput.artifacts[0].identity }]);
assert.equal(tableBinding.inputs[0].artifact.kind, 'table');
assert.equal(tableBinding.inputs[0].parameterName, 'lookupEntries');
assert.notDeepEqual(tableBinding.identity, artifactInputs.identity);
const tableAdmission = admitTensorEvaluatorArtifactInputs(tableRuntime, tableEvaluator, tableResource,
  [{ ...artifactSelections[0], parameterName: 'lookupEntries', artifactIdentity: tableInput.artifacts[0].identity }],
  { lookupEntries: artifactPayload });
assert.deepEqual(tableAdmission.copyPayload('lookupEntries'), artifactPayload);
assert.throws(() => tableAdmission.copyPayload('weights'), { code: 'TENSOR_EVALUATOR_ARTIFACT_PAYLOADS' });
// Removing the adapter selection does not mutate or remove owner artifacts or
// Resource entries: a non-Tensor consumer can retain them.
assert.deepEqual(selectedInput.resources, originalSemanticResources);
assert.equal(evaluatorResult.normalized.artifacts[0].kind, 'model');
assert.deepEqual(createTensorEvaluatorArtifactInputBinding(runtime, evaluatorResult, resourceResult, artifactSelections), artifactInputs);
console.log(JSON.stringify({ schema: 'cuda-mcgs.tensor-evaluator-artifact-input-portable-evidence/0.1.0', status: 'pass', cases: ['explicit-selected-artifact', 'resource-owned-read-only-view', 'immutable-owner-lifecycle-record', 'independent-table-owner-and-parameter-name', 'selection-does-not-mutate-shared-owners', ...artifactCases.map(([id]) => id)], claim: 'binding-metadata-only' }));

console.log(JSON.stringify({
  schema: 'cuda-mcgs.tensor-evaluator-resource-layout-binding-portable-evidence/0.3.0',
  status: 'pass',
  evaluatorRepresentationResources: representationResources.length,
  resourceBindings: binding.resourceBindings.length,
  externalTensorParameters: binding.externalTensorParameters.map(({ parameterName }) => parameterName),
  cases: [
    'semantic-resource-counts-preserved',
    'runtime-byte-extents-become-evaluator-identity',
    'exact-runtime-source-identity-bound-to-evaluator',
    'request-and-batch-control-storage-classed-separately',
    'tensor-input-output-alignment-preserved',
    'program-binding-does-not-relay-resource-facts',
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

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { composedOwnerFixture as owners } from './resource-binding.mjs';
import { createTensorEvaluatorOperationBindings } from '../../adapters/evaluators/cuda-js-tensor/index.mjs';
import { normalizeProgressProfile, normalizeOutputProfile, normalizeProgramPackageProfile, composeSearchProgram, buildExecutionPackage } from '../../components/search-compiler/testing.mjs';
import { buildProgressProfile } from '../search-compiler/src/progress-fixtures.mjs';
import { buildOutputProfile } from '../search-compiler/src/output-fixtures.mjs';
import { buildProgramPackageProfile } from '../search-compiler/src/program-package-fixtures.mjs';
import { PEER } from '../cuda-js-runtime-adapter/src/fixture.mjs';
import { createEvaluatorCohortService } from '../../components/search-compiler/index.mjs';

const sha = (value) => createHash('sha256').update(value).digest('hex');
const identity = (value) => ({ algorithm: 'sha256', sha256: sha(value) });
const schema = async (name) => sha((await readFile(new URL(`../../schemas/search-ir/0.2.0/${name}-profile.schema.json`, import.meta.url), 'utf8')).replace(/\r\n?/g, '\n'));
const resource = { ...owners.resourceResult, schemaSha: await schema('resource') };
const progressInput = buildProgressProfile('tensor-composed', owners.inspected, resource);
// This capsule selects an evaluation-only, already-produced cohort. A profile
// still waiting for Graph publication is intentionally ineligible for it.
const dependentProgress = normalizeProgressProfile(progressInput, owners.inspected, resource, owners.knownProfiles);
assert.throws(() => createEvaluatorCohortService(dependentProgress, owners.evaluatorResult, owners.runtime,
  { name: 'mcgsProgressCohort', cancellationParameter: 'frameworkCancellation', blockSize: 4 }), { code: 'PROGRESS_COHORT_PROFILE' });
const evaluatorContributor = progressInput.contributors.find(({ profile }) => profile.id === owners.evaluatorResult.normalized.id);
const evaluatorWork = progressInput.workClasses.find(({ owner }) => owner === evaluatorContributor.id);
const displacedDependencies = new Set(evaluatorWork.readiness.dependencies);
progressInput.dependencies = progressInput.dependencies.filter(({ id }) => !displacedDependencies.has(id));
evaluatorWork.readiness = { ...evaluatorWork.readiness, mode: 'any-with-independent', independentReady: true, dependencies: [] };
const provisionalProgress = normalizeProgressProfile(progressInput, owners.inspected, resource, owners.knownProfiles);
const service = createEvaluatorCohortService(provisionalProgress, owners.evaluatorResult, owners.runtime, { name: 'mcgsProgressCohort', cancellationParameter: 'frameworkCancellation', blockSize: 4 });
progressInput.programContribution.sourceIdentity = service.sourceIdentity;
const progress = { ...normalizeProgressProfile(progressInput, owners.inspected, resource, owners.knownProfiles), schemaSha: await schema('progress') };
const outputInput = buildOutputProfile('tensor-composed', owners.inspected, resource, progress);
const output = { ...normalizeOutputProfile(outputInput, owners.inspected, resource, progress), schemaSha: await schema('output') };
const context = { profileResults: [...owners.knownProfiles, resource, progress, output], resourceResult: resource, progressResult: progress, outputResult: output };
const built = buildProgramPackageProfile(owners.inspected, context, 'tensor-composed');
const input = built.input;
// Historical owner fixtures use untyped constant placeholders. This executable
// capsule supplies typed Device-JS source for those unchanged contributions.
for (const unit of input.sourceUnits) {
  unit.source = unit.source.replace('return 1;', 'return gpu.u32(1);');
  unit.sourceIdentity = identity(unit.source);
}
input.compatibility.cudaJs = { ...PEER };
built.context.cudaJs = { revision: PEER.revision, package: PEER.package, apiSchema: '1' };
const selections = [{ parameter: 'weights', artifact: owners.evaluatorResult.normalized.artifacts[0].id, resource: owners.artifactResource.id }];
const pointers = createTensorEvaluatorOperationBindings(owners.runtime, owners.evaluatorResult, resource, input.resources, selections);
assert.equal(pointers.bindings.length, owners.runtime.resources.length + owners.runtime.tensorBindings.length);
assert(pointers.bindings.some(({ source }) => source.artifact));
assert.equal(pointers.bindings.filter(({ source }) => source.deviceEffects).length, 2);
assert.throws(() => createTensorEvaluatorOperationBindings(owners.runtime, owners.evaluatorResult, resource, input.resources, []), { code: 'TENSOR_EVALUATOR_INPUT_SELECTION' });
assert.throws(() => createTensorEvaluatorOperationBindings(owners.runtime, owners.evaluatorResult, resource, [], selections), { code: 'TENSOR_EVALUATOR_POINTER_RESOURCE' });

const ownerId = owners.evaluatorResult.normalized.id;
const oldFunctions = input.functions.filter(({ ownerProfile }) => ownerProfile === ownerId).map(({ name }) => name);
input.sourceUnits = input.sourceUnits.filter(({ ownerProfile }) => ownerProfile !== ownerId).concat(owners.programBinding.sourceUnit);
input.functions = input.functions.filter(({ ownerProfile }) => ownerProfile !== ownerId).concat(owners.programBinding.functions);
for (const unit of input.programUnits) if (unit.contributors.includes(ownerId)) {
  unit.functions = owners.programBinding.functions.map(({ name }) => name);
}
input.deviceImports = owners.programBinding.deviceImports;
const progressSource = input.sourceUnits.find(({ ownerProfile }) => ownerProfile === progress.normalized.id);
Object.assign(progressSource, { source: service.source, sourceIdentity: service.sourceIdentity, contributionIdentity: service.sourceIdentity, functions: [service.function.name] });
input.functions = input.functions.filter(({ ownerProfile }) => ownerProfile !== progress.normalized.id).concat({ ...service.function, sourceUnit: progressSource.id });
for (const unit of input.programUnits) if (unit.contributors.includes(progress.normalized.id)) unit.functions = [service.function.name];
for (const record of input.deletion.records) {
  record.deviceImports = record.owner === ownerId ? input.deviceImports.map(({ id }) => id) : [];
  if (record.owner === ownerId) {
    record.sourceUnits = [owners.programBinding.sourceUnit.id];
    record.functions = owners.programBinding.functions.map(({ name }) => name);
  }
  if (record.owner === progress.normalized.id) record.functions = [service.function.name];
}
const entry = input.functions.find(({ executionRole }) => executionRole === 'runtime-entry');
entry.parameters.push(...pointers.parameters);
entry.calls = entry.calls.filter((name) => !oldFunctions.includes(name));
const entryUnit = input.sourceUnits.find(({ id }) => id === entry.sourceUnit);
entryUnit.source = `function engine_step(${entry.parameters.map(({ name }) => name).join(', ')}) { gpu.mailbox.loadAcquireSystem(frameworkCancellation); output[gpu.thread.globalX()] = gpu.u32(0); }\n`;
entryUnit.sourceIdentity = identity(entryUnit.source);
entryUnit.contributionIdentity = entryUnit.sourceIdentity;
built.context.composerContributionIdentity = entryUnit.sourceIdentity;
entry.calls = [];
const operation = input.operations[0];
Object.assign(operation, structuredClone(service.launch));
operation.bindings.push(...pointers.bindings);
operation.bindings.find(({ parameter }) => parameter === 'output').source.resource = input.deliveries[0].resource;

export const normalizedPackage = normalizeProgramPackageProfile(input, owners.inspected, built.context);
const program = composeSearchProgram(normalizedPackage);
export const composedExecution = buildExecutionPackage(normalizedPackage, program);
const adapterBindings = composedExecution.normalized.cudaJsAdapter.operationRequirements[0].bindings;
const shared = adapterBindings.find(({ parameter }) => parameter === 'weights');
assert.equal(shared.source.initialContentSha256, sha(owners.artifactPayload));
assert.deepEqual(adapterBindings.filter(({ source }) => source.deviceEffects).map(({ source }) => source.deviceEffects).sort(), pointers.bindings.filter(({ source }) => source.deviceEffects).map(({ source }) => source.deviceEffects).sort());

for (const [code, mutate] of [
  ['COMPOSE_ARTIFACT_IDENTITY', (value) => { value.operations[0].bindings.find(({ parameter }) => parameter === 'weights').source.artifact.contentSha256 = '0'.repeat(64); }],
  ['COMPOSE_ARTIFACT_LIFETIME', (value) => { value.operations[0].bindings.find(({ parameter }) => parameter === 'weights').source.access = 'read-write'; }],
  ['COMPOSE_DEVICE_EFFECT', (value) => { value.operations[0].bindings.find(({ source }) => source.deviceEffects).source.deviceEffects = ['unknown']; }],
  ['COMPOSE_DEVICE_EFFECT', (value) => { value.operations[0].bindings.find(({ source }) => source.deviceEffects).source.access = 'read'; }],
  ['COMPOSE_OPERATION_BINDING', (value) => { value.operations[0].bindings.pop(); }],
  ['COMPOSE_LAUNCH_CONSTRAINT', (value) => { value.operations[0].grid[0] = '2'; }],
  ['COMPOSE_LAUNCH_CONSTRAINT', (value) => { value.operations[0].block[1] = '2'; }],
  ['COMPOSE_ARTIFACT_MUTATION', (value) => {
    const shared = value.operations[0].bindings.find(({ parameter }) => parameter === 'weights').source;
    const writer = value.operations[0].bindings.find(({ parameter }) => parameter === 'scores').source;
    writer.resource = shared.resource; writer.view = structuredClone(shared.view);
  }],
]) {
  const mutated = structuredClone(input); mutate(mutated);
  assert.throws(() => normalizeProgramPackageProfile(mutated, owners.inspected, built.context), { code });
}
assert(Object.isFrozen(service.function.parameters[0]) && Object.isFrozen(pointers.bindings[0].source.view));
// Source/effect meaning is retained in identity, without altering unrelated owner
// contributions. The established deletion capsule proves evaluator absence.
const beforeOtherOwners = input.sourceUnits.filter(({ ownerProfile }) => ![ownerId, progress.normalized.id].includes(ownerProfile));
const altered = structuredClone(input);
altered.operations[0].bindings.find(({ source }) => source.deviceEffects && !source.deviceEffects.includes('atomic-add-relaxed-device')).source.deviceEffects.push('atomic-add-relaxed-device');
const alteredPackage = normalizeProgramPackageProfile(altered, owners.inspected, built.context);
assert.notEqual(alteredPackage.identity.sha256, normalizedPackage.identity.sha256);
assert.deepEqual(altered.sourceUnits.filter(({ ownerProfile }) => ![ownerId, progress.normalized.id].includes(ownerProfile)), beforeOtherOwners);
export const compositionFixture = { owners, resource, progress, output, input, context: built.context, pointers, selections, service };
console.log('tensor_operation_composition=pass artifact=package-identity-and-runtime-digest pointers=complete effects=explicit');

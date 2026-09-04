#!/usr/bin/env node
import fs from 'node:fs';

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, content) { fs.writeFileSync(path, content); }
function replaceOnce(path, from, to, label) {
  const source = read(path);
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one replacement seam, found ${count}`);
  write(path, source.replace(from, to));
}

const programPath = 'experiments/search-ir-composer-reference/src/program-package.mjs';
replaceOnce(
  programPath,
  "      id: `sideband-${index}`, semanticOwner: entry.semanticOwner, role: entry.role, direction: entry.direction, valueType: entry.valueType,",
  "      id: `sideband-${index}`, role: entry.role, direction: entry.direction, valueType: entry.valueType,",
  'lower sideband owner-neutral projection',
);

const executionSchemaPath = 'schemas/search-ir/0.2.0/execution-package.schema.json';
const executionSchema = JSON.parse(read(executionSchemaPath));
const sidebandRequirement = executionSchema.$defs?.sidebandRequirement;
if (!sidebandRequirement?.required?.includes('semanticOwner') || !Object.hasOwn(sidebandRequirement.properties ?? {}, 'semanticOwner')) {
  throw new Error('lower sideband schema semanticOwner seam is absent');
}
sidebandRequirement.required = sidebandRequirement.required.filter((field) => field !== 'semanticOwner');
delete sidebandRequirement.properties.semanticOwner;
write(executionSchemaPath, `${JSON.stringify(executionSchema, null, 2)}\n`);

const deletionPath = 'experiments/search-ir-composer-reference/src/deletion-identity.mjs';
const helperAnchor = `function assertIdentityChanged(before, after, label) {
  if (before.sha256 === after.sha256) fail('COMPOSE_DELETION_IDENTITY', \`${'${label}'} did not change\`);
}`;
const helperBlock = `function sidebandOwnerMap(profile) {
  return new Map((profile.sidebands ?? []).map((entry) => [entry.id, entry.semanticOwner]));
}

function affectedParameterSet(map, entryPoint) {
  let result = map.get(entryPoint);
  if (!result) {
    result = new Set();
    map.set(entryPoint, result);
  }
  return result;
}

function sidebandBindingOwner(binding, owners) {
  if (binding?.source?.kind !== 'sideband') return null;
  return owners.get(binding.source.sideband) ?? null;
}

function assertOperationSidebandChanges(beforeOperations, afterOperations, beforeSidebands, afterSidebands, removed, changed) {
  const before = new Map(beforeOperations.map((entry) => [entry.id, entry]));
  const after = new Map(afterOperations.map((entry) => [entry.id, entry]));
  if (before.size !== after.size || [...before.keys()].some((id) => !after.has(id))) {
    fail('COMPOSE_DELETION_PACKAGE_DRIFT', 'operation set changed during semantic-owner deletion');
  }
  const affectedParameters = new Map();
  for (const [id, entry] of before) {
    const next = after.get(id);
    const { bindings: beforeBindings, ...beforeEnvelope } = entry;
    const { bindings: afterBindings, ...afterEnvelope } = next;
    if (!exact(beforeEnvelope, afterEnvelope)) {
      fail('COMPOSE_DELETION_PACKAGE_DRIFT', \`operation \${id} changed outside sideband bindings\`);
    }
    const beforeByParameter = new Map(beforeBindings.map((binding) => [binding.parameter, binding]));
    const afterByParameter = new Map(afterBindings.map((binding) => [binding.parameter, binding]));
    for (const [parameter, binding] of beforeByParameter) {
      const nextBinding = afterByParameter.get(parameter);
      if (nextBinding && exact(binding, nextBinding)) continue;
      const beforeOwner = sidebandBindingOwner(binding, beforeSidebands);
      const afterOwner = sidebandBindingOwner(nextBinding, afterSidebands);
      if (!nextBinding) {
        if (!beforeOwner || (!removed.has(beforeOwner) && !changed.has(beforeOwner))) {
          fail('COMPOSE_DELETION_PACKAGE_DRIFT', \`operation \${id} binding \${parameter} disappeared without an affected sideband owner\`);
        }
      } else {
        const owners = [beforeOwner, afterOwner].filter(Boolean);
        if (owners.length === 0 || owners.some((owner) => !changed.has(owner))) {
          fail('COMPOSE_DELETION_PACKAGE_DRIFT', \`operation \${id} binding \${parameter} changed outside a changed sideband owner\`);
        }
      }
      affectedParameterSet(affectedParameters, entry.entryPoint).add(parameter);
    }
    for (const [parameter, binding] of afterByParameter) {
      if (beforeByParameter.has(parameter)) continue;
      const owner = sidebandBindingOwner(binding, afterSidebands);
      if (!owner || !changed.has(owner)) {
        fail('COMPOSE_DELETION_PACKAGE_DRIFT', \`operation \${id} binding \${parameter} appeared without a changed sideband owner\`);
      }
      affectedParameterSet(affectedParameters, entry.entryPoint).add(parameter);
    }
  }
  return affectedParameters;
}

function stripSidebandSyntax(source, parameterNames) {
  let normalized = source;
  for (const name of [...parameterNames].sort(compareRaw)) {
    normalized = normalized.replaceAll(\`, \${name}\`, '');
    normalized = normalized.replaceAll(\`\${name}, \`, '');
    normalized = normalized.replaceAll(\`gpu.mailbox.loadAcquireSystem(\${name}); \`, '');
    normalized = normalized.replaceAll(\`gpu.mailbox.loadAcquireSystem(\${name});\`, '');
  }
  return normalized;
}

function assertFunctionsAndSources(beforeProfile, afterProfile, removed, changed, affectedParameters) {
  const beforeFunctions = new Map(beforeProfile.functions.map((entry) => [entry.name, entry]));
  const afterFunctions = new Map(afterProfile.functions.map((entry) => [entry.name, entry]));
  const derivedBySourceUnit = new Map();

  for (const [name, entry] of beforeFunctions) {
    const next = afterFunctions.get(name);
    const owner = ownerForFunction(beforeProfile, entry);
    if (!next) {
      if (!ownerAffected(owner, removed) && !ownerAffected(owner, changed)) {
        fail('COMPOSE_DELETION_UNEXPLAINED_REMOVAL', \`function \${name} disappeared without an affected owner\`);
      }
      continue;
    }
    if (exact(entry, next) || ownerAffected(owner, changed)) continue;
    const parameters = affectedParameters.get(name);
    if (!parameters || parameters.size === 0) {
      fail('COMPOSE_DELETION_UNEXPLAINED_CHANGE', \`function \${name} changed without an affected owner or sideband binding\`);
    }
    for (const parameter of parameters) {
      const beforeParameter = entry.parameters.find(({ name: candidate }) => candidate === parameter);
      const afterParameter = next.parameters.find(({ name: candidate }) => candidate === parameter);
      if (beforeParameter && !beforeParameter.type.startsWith('sideband<')) {
        fail('COMPOSE_DELETION_PROGRAM_DRIFT', \`function \${name} parameter \${parameter} is not a sideband parameter before deletion\`);
      }
      if (afterParameter && !afterParameter.type.startsWith('sideband<')) {
        fail('COMPOSE_DELETION_PROGRAM_DRIFT', \`function \${name} parameter \${parameter} is not a sideband parameter after deletion\`);
      }
      if (!beforeParameter && !afterParameter) {
        fail('COMPOSE_DELETION_PROGRAM_DRIFT', \`function \${name} lacks affected sideband parameter \${parameter}\`);
      }
    }
    const beforeComparable = structuredClone(entry);
    const afterComparable = structuredClone(next);
    beforeComparable.parameters = beforeComparable.parameters.filter(({ name: parameter }) => !parameters.has(parameter));
    afterComparable.parameters = afterComparable.parameters.filter(({ name: parameter }) => !parameters.has(parameter));
    if (!exact(beforeComparable, afterComparable)) {
      fail('COMPOSE_DELETION_PROGRAM_DRIFT', \`function \${name} changed outside its affected sideband parameters\`);
    }
    let sourceParameters = derivedBySourceUnit.get(entry.sourceUnit);
    if (!sourceParameters) {
      sourceParameters = new Set();
      derivedBySourceUnit.set(entry.sourceUnit, sourceParameters);
    }
    for (const parameter of parameters) sourceParameters.add(parameter);
  }

  for (const [name, entry] of afterFunctions) {
    if (beforeFunctions.has(name)) continue;
    const owner = ownerForFunction(afterProfile, entry);
    if (!ownerAffected(owner, changed)) {
      fail('COMPOSE_DELETION_UNEXPLAINED_ADDITION', \`function \${name} appeared without a changed owner\`);
    }
  }

  const beforeSources = new Map(beforeProfile.sourceUnits.map((entry) => [entry.id, entry]));
  const afterSources = new Map(afterProfile.sourceUnits.map((entry) => [entry.id, entry]));
  const derivedSourceUnits = new Set();
  for (const [id, entry] of beforeSources) {
    const next = afterSources.get(id);
    const owner = [entry.semanticOwner, entry.ownerProfile];
    if (!next) {
      if (!ownerAffected(owner, removed) && !ownerAffected(owner, changed)) {
        fail('COMPOSE_DELETION_UNEXPLAINED_REMOVAL', \`source unit \${id} disappeared without an affected owner\`);
      }
      continue;
    }
    if (exact(entry, next) || ownerAffected(owner, changed)) continue;
    const parameters = derivedBySourceUnit.get(id);
    if (!parameters || parameters.size === 0) {
      fail('COMPOSE_DELETION_UNEXPLAINED_CHANGE', \`source unit \${id} changed without an affected owner or validated sideband parameter\`);
    }
    const beforeComparable = structuredClone(entry);
    const afterComparable = structuredClone(next);
    delete beforeComparable.source;
    delete beforeComparable.sourceIdentity;
    delete afterComparable.source;
    delete afterComparable.sourceIdentity;
    if (!exact(beforeComparable, afterComparable)
        || stripSidebandSyntax(entry.source, parameters) !== stripSidebandSyntax(next.source, parameters)) {
      fail('COMPOSE_DELETION_SOURCE', \`source unit \${id} changed outside validated sideband syntax\`);
    }
    derivedSourceUnits.add(id);
  }
  for (const [id, entry] of afterSources) {
    if (beforeSources.has(id)) continue;
    const owner = [entry.semanticOwner, entry.ownerProfile];
    if (!ownerAffected(owner, changed)) {
      fail('COMPOSE_DELETION_UNEXPLAINED_ADDITION', \`source unit \${id} appeared without a changed owner\`);
    }
  }
  return derivedSourceUnits;
}

function assertProgramProjection(profile, program, label) {
  if (!exact(program.sidebands ?? [], profile.sidebands ?? [])) fail('COMPOSE_DELETION_PROGRAM_DRIFT', \`${label} sideband projection differs from its composition profile\`);
  if (!exact(program.functions, profile.functions)) fail('COMPOSE_DELETION_PROGRAM_DRIFT', \`${label} function projection differs from its composition profile\`);
  if (!exact(program.operations, profile.operations)) fail('COMPOSE_DELETION_PROGRAM_DRIFT', \`${label} operation projection differs from its composition profile\`);
  const expectedSourceMap = profile.sourceUnits.map(({ id, ownerProfile, semanticOwner, sourceIdentity, functions }) => ({
    id, ownerProfile, semanticOwner, sourceIdentity: { ...sourceIdentity }, functions: [...functions],
  }));
  if (!exact(program.sourceMap, expectedSourceMap)) fail('COMPOSE_DELETION_PROGRAM_DRIFT', \`${label} source map differs from its composition profile\`);
  if (program.source !== profile.sourceUnits.map(({ source }) => source).join('')) fail('COMPOSE_DELETION_PROGRAM_DRIFT', \`${label} source bytes differ from its composition profile\`);
}

${helperAnchor}`;
replaceOnce(deletionPath, helperAnchor, helperBlock, 'sideband-aware deletion helpers');

const oldChecks = `  if (removedOwners.length > 0) {
    assertOwnerDeletion(beforeProgram, afterProgram, removedOwners, changedOwners);
  }
  assertProfiles(beforeProfile.semanticEngine.profiles, afterProfile.semanticEngine.profiles, removed, changed);
  assertOwnedCollection(beforeProfile.sourceUnits, afterProfile.sourceUnits, 'id', (entry) => [entry.semanticOwner, entry.ownerProfile], removed, changed, 'source unit');
  const functionOwners = new Map([
    ...beforeProfile.functions.map((entry) => [entry.name, ownerForFunction(beforeProfile, entry)]),
    ...afterProfile.functions.map((entry) => [entry.name, ownerForFunction(afterProfile, entry)]),
  ]);
  assertOwnedCollection(beforeProfile.functions, afterProfile.functions, 'name', (entry) => functionOwners.get(entry.name), removed, changed, 'function');
  assertProgramUnits(beforeProfile, afterProfile, removed, changed);`;
const newChecks = `  assertProfiles(beforeProfile.semanticEngine.profiles, afterProfile.semanticEngine.profiles, removed, changed);
  const beforeSidebands = sidebandOwnerMap(beforeProfile);
  const afterSidebands = sidebandOwnerMap(afterProfile);
  assertOwnedCollection(beforeProfile.sidebands ?? [], afterProfile.sidebands ?? [], 'id', (entry) => entry.semanticOwner, removed, changed, 'sideband');
  const affectedParameters = assertOperationSidebandChanges(beforeProfile.operations, afterProfile.operations, beforeSidebands, afterSidebands, removed, changed);
  const derivedSourceUnits = assertFunctionsAndSources(beforeProfile, afterProfile, removed, changed, affectedParameters);
  assertProgramProjection(beforeProfile, beforeProgram, 'before Search Program');
  assertProgramProjection(afterProfile, afterProgram, 'after Search Program');
  if (removedOwners.length > 0 && derivedSourceUnits.size === 0) {
    assertOwnerDeletion(beforeProgram, afterProgram, removedOwners, changedOwners);
  }
  assertProgramUnits(beforeProfile, afterProfile, removed, changed);`;
replaceOnce(deletionPath, oldChecks, newChecks, 'sideband-aware deletion checks');

replaceOnce(
  deletionPath,
  "  for (const field of ['operations', 'manifests', 'provenance', 'compatibility']) {",
  "  for (const field of ['manifests', 'provenance', 'compatibility']) {",
  'profile operation exactness replacement',
);
replaceOnce(
  deletionPath,
  "  for (const field of ['entryPoints', 'operations', 'manifests', 'provenance']) {",
  "  for (const field of ['entryPoints', 'manifests', 'provenance']) {",
  'program operation exactness replacement',
);

const runPath = 'experiments/search-ir-composer-reference/run.mjs';
const runAnchor = "      assert.equal(JSON.stringify(adapter).includes('ownerProfile'), false);";
const runReplacement = `${runAnchor}
      const program = composition.searchProgram.normalized;
      const residentResources = program.resources.filter(({ materialization }) => materialization === 'resident-storage');
      const resourceNames = new Map(residentResources.map((entry, index) => [entry.id, \`resource-\${index}\`]));
      const expectedSidebands = (program.sidebands ?? []).map((entry, index) => ({
        id: \`sideband-\${index}\`, role: entry.role, direction: entry.direction, valueType: entry.valueType,
        capacity: entry.capacity, publication: entry.publication, applicationPoint: { ...entry.applicationPoint }, lifetime: entry.lifetime,
        residentResource: entry.residentResource === null ? null : resourceNames.get(entry.residentResource),
        semantics: { ...entry.semantics }, cleanup: { ...entry.cleanup },
      }));
      assert.deepEqual(adapter.sidebandRequirements, expectedSidebands);`;
replaceOnce(runPath, runAnchor, runReplacement, 'owner-neutral adapter sideband projection evidence');

console.log('dev_202_green_final_patch=applied');

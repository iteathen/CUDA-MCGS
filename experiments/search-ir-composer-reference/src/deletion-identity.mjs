import { assertOwnerDeletion } from './program-package.mjs';
import { compareRaw, fail } from './validation.mjs';

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sortedUnique(values, label) {
  if (!Array.isArray(values)) fail('COMPOSE_DELETION_MATRIX_INPUT', `${label} must be an array`);
  const result = [...new Set(values)].sort(compareRaw);
  if (result.length !== values.length) fail('COMPOSE_DELETION_MATRIX_INPUT', `${label} repeats an owner`);
  return result;
}

function requireComposition(input, label) {
  for (const key of ['resolvedInput', 'compositionProfile', 'searchProgram', 'executionPackage', 'publication']) {
    if (!input?.[key]?.normalized || !input[key].identity) {
      fail('COMPOSE_DELETION_MATRIX_INPUT', `${label} lacks ${key}`);
    }
  }
  if (!input.compositionProfile.semanticEngineIdentity) {
    fail('COMPOSE_DELETION_MATRIX_INPUT', `${label} lacks semantic engine identity`);
  }
}

function ownerForFunction(profile, entry) {
  const unit = profile.sourceUnits.find(({ id }) => id === entry.sourceUnit);
  return unit ? [unit.semanticOwner, unit.ownerProfile] : [];
}

function ownerAffected(owner, owners) {
  return (Array.isArray(owner) ? owner : [owner]).some((candidate) => owners.has(candidate));
}

function assertOwnedCollection(beforeValues, afterValues, key, ownerFor, removed, changed, label) {
  const before = new Map(beforeValues.map((entry) => [entry[key], entry]));
  const after = new Map(afterValues.map((entry) => [entry[key], entry]));
  for (const [id, entry] of before) {
    const owner = ownerFor(entry, beforeValues);
    const next = after.get(id);
    if (!next) {
      if (!ownerAffected(owner, removed) && !ownerAffected(owner, changed)) {
        fail('COMPOSE_DELETION_UNEXPLAINED_REMOVAL', `${label} ${id} disappeared without an affected owner`);
      }
      continue;
    }
    if (!exact(entry, next) && !ownerAffected(owner, changed)) {
      fail('COMPOSE_DELETION_UNEXPLAINED_CHANGE', `${label} ${id} changed without a changed owner`);
    }
  }
  for (const [id, entry] of after) {
    if (before.has(id)) continue;
    const owner = ownerFor(entry, afterValues);
    if (!ownerAffected(owner, changed)) {
      fail('COMPOSE_DELETION_UNEXPLAINED_ADDITION', `${label} ${id} appeared without a changed owner`);
    }
  }
}

function assertProgramUnits(beforeProfile, afterProfile, removed, changed) {
  const beforeFunctionOwner = new Map(beforeProfile.functions.map((entry) => [entry.name, ownerForFunction(beforeProfile, entry)]));
  const afterFunctionOwner = new Map(afterProfile.functions.map((entry) => [entry.name, ownerForFunction(afterProfile, entry)]));
  const affected = (entry, functionOwners) => [...entry.contributors, ...entry.functions.flatMap((name) => functionOwners.get(name) ?? [])]
    .some((owner) => removed.has(owner) || changed.has(owner));
  const before = new Map(beforeProfile.programUnits.map((entry) => [entry.id, entry]));
  const after = new Map(afterProfile.programUnits.map((entry) => [entry.id, entry]));
  for (const [id, entry] of before) {
    const next = after.get(id);
    if (!next) {
      if (!affected(entry, beforeFunctionOwner)) fail('COMPOSE_DELETION_UNEXPLAINED_REMOVAL', `program unit ${id} disappeared without an affected contributor`);
    } else if (!exact(entry, next) && !affected(entry, beforeFunctionOwner) && !affected(next, afterFunctionOwner)) {
      fail('COMPOSE_DELETION_UNEXPLAINED_CHANGE', `program unit ${id} changed without an affected contributor`);
    }
  }
  for (const [id, entry] of after) {
    if (!before.has(id) && !affected(entry, afterFunctionOwner)) {
      fail('COMPOSE_DELETION_UNEXPLAINED_ADDITION', `program unit ${id} appeared without a changed contributor`);
    }
  }
}

function assertProfiles(beforeProfiles, afterProfiles, removed, changed) {
  const before = new Map(beforeProfiles.map((entry) => [entry.id, entry]));
  const after = new Map(afterProfiles.map((entry) => [entry.id, entry]));
  for (const [id, entry] of before) {
    const next = after.get(id);
    if (removed.has(id)) {
      if (next) fail('COMPOSE_DELETION_RESIDUE', `removed profile ${id} remains selected`);
    } else if (!next) {
      fail('COMPOSE_DELETION_UNEXPLAINED_REMOVAL', `profile ${id} disappeared without removal`);
    } else if (changed.has(id)) {
      if (exact(entry, next)) fail('COMPOSE_DELETION_FALSE_CHANGE', `changed profile ${id} retained its old identity`);
    } else if (!exact(entry, next)) {
      fail('COMPOSE_DELETION_UNEXPLAINED_CHANGE', `profile ${id} changed without a changed owner`);
    }
  }
  for (const id of after.keys()) {
    if (!before.has(id)) fail('COMPOSE_DELETION_UNEXPLAINED_ADDITION', `profile ${id} appeared during deletion`);
  }
}

function assertRequirements(beforeValues, afterValues, removed, changed) {
  const before = new Map(beforeValues.map((entry) => [entry.contract.id, entry]));
  const after = new Map(afterValues.map((entry) => [entry.contract.id, entry]));
  for (const [id, entry] of before) {
    const next = after.get(id);
    const stableConsumers = entry.consumers.filter((owner) => !removed.has(owner) && !changed.has(owner));
    if (!next) {
      if (stableConsumers.length > 0) fail('COMPOSE_DELETION_REQUIREMENT', `${id} disappeared while an unaffected consumer remains`);
      continue;
    }
    if (!exact(entry.contract, next.contract) || entry.qualification !== next.qualification) {
      fail('COMPOSE_DELETION_REQUIREMENT', `${id} contract or qualification changed during owner deletion`);
    }
    const nextStable = next.consumers.filter((owner) => !changed.has(owner));
    if (!exact(stableConsumers, nextStable)) {
      fail('COMPOSE_DELETION_REQUIREMENT', `${id} changed unaffected consumers during owner deletion`);
    }
    if (next.consumers.some((owner) => removed.has(owner))) fail('COMPOSE_DELETION_RESIDUE', `${id} retains a removed consumer`);
  }
  for (const id of after.keys()) {
    if (!before.has(id)) fail('COMPOSE_DELETION_UNEXPLAINED_ADDITION', `public requirement ${id} appeared during deletion`);
  }
}

function sidebandOwnerMap(profile) {
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
      fail('COMPOSE_DELETION_PACKAGE_DRIFT', `operation ${id} changed outside sideband bindings`);
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
          fail('COMPOSE_DELETION_PACKAGE_DRIFT', `operation ${id} binding ${parameter} disappeared without an affected sideband owner`);
        }
      } else {
        const owners = [beforeOwner, afterOwner].filter(Boolean);
        if (owners.length === 0 || owners.some((owner) => !changed.has(owner))) {
          fail('COMPOSE_DELETION_PACKAGE_DRIFT', `operation ${id} binding ${parameter} changed outside a changed sideband owner`);
        }
      }
      affectedParameterSet(affectedParameters, entry.entryPoint).add(parameter);
    }
    for (const [parameter, binding] of afterByParameter) {
      if (beforeByParameter.has(parameter)) continue;
      const owner = sidebandBindingOwner(binding, afterSidebands);
      if (!owner || !changed.has(owner)) {
        fail('COMPOSE_DELETION_PACKAGE_DRIFT', `operation ${id} binding ${parameter} appeared without a changed sideband owner`);
      }
      affectedParameterSet(affectedParameters, entry.entryPoint).add(parameter);
    }
  }
  return affectedParameters;
}

function stripSidebandSyntax(source, parameterNames) {
  let normalized = source;
  for (const name of [...parameterNames].sort(compareRaw)) {
    normalized = normalized.replaceAll(`, ${name}`, '');
    normalized = normalized.replaceAll(`${name}, `, '');
    normalized = normalized.replaceAll(`gpu.mailbox.loadAcquireSystem(${name}); `, '');
    normalized = normalized.replaceAll(`gpu.mailbox.loadAcquireSystem(${name});`, '');
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
        fail('COMPOSE_DELETION_UNEXPLAINED_REMOVAL', `function ${name} disappeared without an affected owner`);
      }
      continue;
    }
    if (exact(entry, next) || ownerAffected(owner, changed)) continue;
    const parameters = affectedParameters.get(name);
    if (!parameters || parameters.size === 0) {
      fail('COMPOSE_DELETION_UNEXPLAINED_CHANGE', `function ${name} changed without an affected owner or sideband binding`);
    }
    for (const parameter of parameters) {
      const beforeParameter = entry.parameters.find(({ name: candidate }) => candidate === parameter);
      const afterParameter = next.parameters.find(({ name: candidate }) => candidate === parameter);
      if (beforeParameter && !beforeParameter.type.startsWith('sideband<')) {
        fail('COMPOSE_DELETION_PROGRAM_DRIFT', `function ${name} parameter ${parameter} is not a sideband parameter before deletion`);
      }
      if (afterParameter && !afterParameter.type.startsWith('sideband<')) {
        fail('COMPOSE_DELETION_PROGRAM_DRIFT', `function ${name} parameter ${parameter} is not a sideband parameter after deletion`);
      }
      if (!beforeParameter && !afterParameter) {
        fail('COMPOSE_DELETION_PROGRAM_DRIFT', `function ${name} lacks affected sideband parameter ${parameter}`);
      }
    }
    const beforeComparable = structuredClone(entry);
    const afterComparable = structuredClone(next);
    beforeComparable.parameters = beforeComparable.parameters.filter(({ name: parameter }) => !parameters.has(parameter));
    afterComparable.parameters = afterComparable.parameters.filter(({ name: parameter }) => !parameters.has(parameter));
    if (!exact(beforeComparable, afterComparable)) {
      fail('COMPOSE_DELETION_PROGRAM_DRIFT', `function ${name} changed outside its affected sideband parameters`);
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
      fail('COMPOSE_DELETION_UNEXPLAINED_ADDITION', `function ${name} appeared without a changed owner`);
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
        fail('COMPOSE_DELETION_UNEXPLAINED_REMOVAL', `source unit ${id} disappeared without an affected owner`);
      }
      continue;
    }
    if (exact(entry, next) || ownerAffected(owner, changed)) continue;
    const parameters = derivedBySourceUnit.get(id);
    if (!parameters || parameters.size === 0) {
      fail('COMPOSE_DELETION_UNEXPLAINED_CHANGE', `source unit ${id} changed without an affected owner or validated sideband parameter`);
    }
    const beforeComparable = structuredClone(entry);
    const afterComparable = structuredClone(next);
    delete beforeComparable.source;
    delete beforeComparable.sourceIdentity;
    delete afterComparable.source;
    delete afterComparable.sourceIdentity;
    if (!exact(beforeComparable, afterComparable)
        || stripSidebandSyntax(entry.source, parameters) !== stripSidebandSyntax(next.source, parameters)) {
      fail('COMPOSE_DELETION_SOURCE', `source unit ${id} changed outside validated sideband syntax`);
    }
    derivedSourceUnits.add(id);
  }
  for (const [id, entry] of afterSources) {
    if (beforeSources.has(id)) continue;
    const owner = [entry.semanticOwner, entry.ownerProfile];
    if (!ownerAffected(owner, changed)) {
      fail('COMPOSE_DELETION_UNEXPLAINED_ADDITION', `source unit ${id} appeared without a changed owner`);
    }
  }
  return derivedSourceUnits;
}

function assertProgramProjection(profile, program, label) {
  if (!exact(program.sidebands ?? [], profile.sidebands ?? [])) fail('COMPOSE_DELETION_PROGRAM_DRIFT', `${label} sideband projection differs from its composition profile`);
  if (!exact(program.functions, profile.functions)) fail('COMPOSE_DELETION_PROGRAM_DRIFT', `${label} function projection differs from its composition profile`);
  if (!exact(program.operations, profile.operations)) fail('COMPOSE_DELETION_PROGRAM_DRIFT', `${label} operation projection differs from its composition profile`);
  const expectedSourceMap = profile.sourceUnits.map(({ id, ownerProfile, semanticOwner, sourceIdentity, functions }) => ({
    id, ownerProfile, semanticOwner, sourceIdentity: { ...sourceIdentity }, functions: [...functions],
  }));
  if (!exact(program.sourceMap, expectedSourceMap)) fail('COMPOSE_DELETION_PROGRAM_DRIFT', `${label} source map differs from its composition profile`);
  if (program.source !== profile.sourceUnits.map(({ source }) => source).join('')) fail('COMPOSE_DELETION_PROGRAM_DRIFT', `${label} source bytes differ from its composition profile`);
}

function assertIdentityChanged(before, after, label) {
  if (before.sha256 === after.sha256) fail('COMPOSE_DELETION_IDENTITY', `${label} did not change`);
}

export function assertComposedDeletion(beforeComposition, afterComposition, options) {
  requireComposition(beforeComposition, 'before composition');
  requireComposition(afterComposition, 'after composition');
  const removedOwners = sortedUnique(options?.removedOwners ?? [], 'removedOwners');
  const changedOwners = sortedUnique(options?.changedOwners ?? [], 'changedOwners');
  if (removedOwners.length === 0 && changedOwners.length === 0) {
    fail('COMPOSE_DELETION_MATRIX_INPUT', 'a deletion comparison requires a removed or changed owner');
  }
  const removed = new Set(removedOwners);
  const changed = new Set(changedOwners);
  if (removedOwners.some((owner) => changed.has(owner))) {
    fail('COMPOSE_DELETION_MATRIX_INPUT', 'an owner cannot be both removed and changed');
  }

  const beforeProfile = beforeComposition.compositionProfile.normalized;
  const afterProfile = afterComposition.compositionProfile.normalized;
  const beforeProgram = beforeComposition.searchProgram.normalized;
  const afterProgram = afterComposition.searchProgram.normalized;
  const beforeSelected = beforeProgram.deletion.selectedOwners;
  const afterSelected = afterProgram.deletion.selectedOwners;
  for (const owner of removedOwners) {
    if (!beforeSelected.includes(owner)) fail('COMPOSE_DELETION_OWNER', `removed owner ${owner} was not selected before deletion`);
    if (afterSelected.includes(owner) || JSON.stringify(afterComposition).includes(`\"${owner}\"`)) {
      fail('COMPOSE_DELETION_RESIDUE', `${owner} remains after canonical recomposition`);
    }
  }
  for (const owner of changedOwners) {
    if (!beforeSelected.includes(owner) || !afterSelected.includes(owner)) {
      fail('COMPOSE_DELETION_OWNER', `changed owner ${owner} must remain selected on both sides`);
    }
  }
  const expectedAfterOwners = beforeSelected.filter((owner) => !removed.has(owner));
  if (!exact(expectedAfterOwners, afterSelected)) {
    fail('COMPOSE_DELETION_OWNER', 'canonical recomposition added or removed an undeclared owner');
  }

  assertProfiles(beforeProfile.semanticEngine.profiles, afterProfile.semanticEngine.profiles, removed, changed);
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
  assertProgramUnits(beforeProfile, afterProfile, removed, changed);
  assertRequirements(beforeProfile.publicRequirements, afterProfile.publicRequirements, removed, changed);
  assertOwnedCollection(beforeProfile.resources, afterProfile.resources, 'id', (entry) => entry.ownerProfile, removed, changed, 'resource');
  assertOwnedCollection(beforeProfile.deletion.records, afterProfile.deletion.records, 'owner', (entry) => entry.owner, removed, changed, 'deletion record');

  for (const field of ['manifests', 'provenance', 'compatibility']) {
    if (!exact(beforeProfile[field], afterProfile[field])) {
      fail('COMPOSE_DELETION_PACKAGE_DRIFT', `${field} changed despite an identical package call surface`);
    }
  }
  for (const field of ['entryPoints', 'manifests', 'provenance']) {
    if (!exact(beforeProgram[field], afterProgram[field])) {
      fail('COMPOSE_DELETION_PROGRAM_DRIFT', `${field} changed despite an identical package call surface`);
    }
  }
  if (!exact(beforeComposition.executionPackage.normalized.cudaJsAdapter.searchLifecycle, afterComposition.executionPackage.normalized.cudaJsAdapter.searchLifecycle)) {
    fail('COMPOSE_DELETION_PUBLIC_CONTRACT', 'MCGS adapter search lifecycle requirements changed during semantic owner deletion');
  }
  if (!exact(afterComposition.executionPackage.normalized.cudaJsAdapter.publicContracts, afterProgram.publicRequirements.map(({ contract }) => contract))) {
    fail('COMPOSE_DELETION_PUBLIC_CONTRACT', 'MCGS adapter public contracts do not match the recomposed Search Program');
  }

  assertIdentityChanged(beforeComposition.resolvedInput.identity, afterComposition.resolvedInput.identity, 'resolved Composer input identity');
  assertIdentityChanged(beforeComposition.compositionProfile.semanticEngineIdentity, afterComposition.compositionProfile.semanticEngineIdentity, 'semantic engine identity');
  assertIdentityChanged(beforeComposition.compositionProfile.identity, afterComposition.compositionProfile.identity, 'composition profile identity');
  assertIdentityChanged(beforeComposition.searchProgram.identity, afterComposition.searchProgram.identity, 'Search Program identity');
  assertIdentityChanged(beforeComposition.executionPackage.identity, afterComposition.executionPackage.identity, 'execution package identity');
  assertIdentityChanged(beforeComposition.publication.identity, afterComposition.publication.identity, 'Composer publication identity');

  const sourceChanged = beforeProgram.sourceIdentity.sha256 !== afterProgram.sourceIdentity.sha256;
  if (options?.sourceChanged !== undefined && sourceChanged !== options.sourceChanged) {
    fail('COMPOSE_DELETION_SOURCE_EXPECTATION', `source change was ${sourceChanged}, expected ${options.sourceChanged}`);
  }
  return {
    id: options.id,
    removedOwners,
    changedOwners,
    sourceChanged,
    before: {
      semanticEngine: beforeComposition.compositionProfile.semanticEngineIdentity.sha256,
      searchProgram: beforeComposition.searchProgram.identity.sha256,
      executionPackage: beforeComposition.executionPackage.identity.sha256,
      publication: beforeComposition.publication.identity.sha256,
    },
    after: {
      semanticEngine: afterComposition.compositionProfile.semanticEngineIdentity.sha256,
      searchProgram: afterComposition.searchProgram.identity.sha256,
      executionPackage: afterComposition.executionPackage.identity.sha256,
      publication: afterComposition.publication.identity.sha256,
    },
  };
}

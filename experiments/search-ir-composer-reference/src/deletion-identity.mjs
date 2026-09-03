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

  if (removedOwners.length > 0) {
    assertOwnerDeletion(beforeProgram, afterProgram, removedOwners, changedOwners);
  }
  assertProfiles(beforeProfile.semanticEngine.profiles, afterProfile.semanticEngine.profiles, removed, changed);
  assertOwnedCollection(beforeProfile.sourceUnits, afterProfile.sourceUnits, 'id', (entry) => [entry.semanticOwner, entry.ownerProfile], removed, changed, 'source unit');
  const functionOwners = new Map([
    ...beforeProfile.functions.map((entry) => [entry.name, ownerForFunction(beforeProfile, entry)]),
    ...afterProfile.functions.map((entry) => [entry.name, ownerForFunction(afterProfile, entry)]),
  ]);
  assertOwnedCollection(beforeProfile.functions, afterProfile.functions, 'name', (entry) => functionOwners.get(entry.name), removed, changed, 'function');
  assertProgramUnits(beforeProfile, afterProfile, removed, changed);
  assertRequirements(beforeProfile.publicRequirements, afterProfile.publicRequirements, removed, changed);
  assertOwnedCollection(beforeProfile.resources, afterProfile.resources, 'id', (entry) => entry.ownerProfile, removed, changed, 'resource');
  assertOwnedCollection(beforeProfile.deletion.records, afterProfile.deletion.records, 'owner', (entry) => entry.owner, removed, changed, 'deletion record');

  for (const field of ['operations', 'manifests', 'provenance', 'compatibility']) {
    if (!exact(beforeProfile[field], afterProfile[field])) {
      fail('COMPOSE_DELETION_PACKAGE_DRIFT', `${field} changed despite an identical package call surface`);
    }
  }
  for (const field of ['entryPoints', 'operations', 'manifests', 'provenance']) {
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

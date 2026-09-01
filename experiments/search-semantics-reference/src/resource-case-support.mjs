import assert from 'node:assert/strict';

import { createResourceOracle } from './resource.mjs';

export function getResourceProfile(projection, id) {
  const entry = projection.profiles.find((profile) => profile.id === id);
  assert(entry, `missing Resource profile ${id}`);
  return entry.normalized;
}

export function activeResourceOracle(profile, options = {}) {
  const oracle = createResourceOracle({ profile, ...options });
  oracle.activate();
  return oracle;
}

export function classBySuffix(profile, suffix) {
  const entry = profile.classes.find(({ id }) => id.endsWith(suffix));
  assert(entry, `missing Resource class ending ${suffix}`);
  return entry;
}

export function reserveByPurpose(profile, purpose) {
  const entry = profile.reserves.find((reserve) => reserve.purpose === purpose);
  assert(entry, `missing Resource reserve ${purpose}`);
  return entry;
}

export function classReserve(profile, resourceClass) {
  return profile.reserves.find((reserve) => reserve.class === resourceClass.id) ?? null;
}

export function leaseInput(resourceClass, id, options = {}) {
  return {
    classId: resourceClass.id,
    quantity: options.quantity ?? '1',
    leaseId: options.leaseId ?? `lease-${id}`,
    generation: options.generation ?? '1',
    owner: options.owner ?? resourceClass.contributor,
    reserveId: options.reserveId ?? null,
    transition: options.transition ?? null,
    epochs: options.epochs ?? { engine: '1', session: '1', root: '1', work: '1' },
  };
}

export function reservedLeaseInput(profile, reserve, id, options = {}) {
  const resourceClass = profile.classes.find(({ id: classId }) => classId === reserve.class);
  assert(resourceClass, `reserve ${reserve.id} class is missing`);
  return leaseInput(resourceClass, id, {
    ...options,
    owner: options.owner ?? reserve.eligibleOwners[0],
    reserveId: reserve.id,
    transition: options.transition ?? reserve.eligibleTransitions[0],
  });
}

export function leaseRef(input, reason = null) {
  return { leaseId: input.leaseId, generation: input.generation, ...(reason === null ? {} : { reason }) };
}

export function accountingWithoutDiagnostics(snapshot) {
  return snapshot.classes.map(({ failedAdmissions, releases, highWater, counter, ...entry }) => entry);
}

export function liveCount(snapshot) {
  return snapshot.leases.filter(({ state }) => ['claimed', 'published', 'retired-unreclaimed', 'quarantined'].includes(state)).length;
}

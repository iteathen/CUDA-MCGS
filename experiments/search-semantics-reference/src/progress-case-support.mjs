import assert from 'node:assert/strict';

import { createProgressOracle } from './progress.mjs';

export function getProgressProfile(projection, id) {
  const entry = projection.profiles.find((profile) => profile.id === id);
  assert(entry, `missing Progress profile ${id}`);
  return entry.normalized;
}

export function activeProgressOracle(profile, options = {}) {
  const oracle = createProgressOracle({ profile, ...options });
  oracle.activate({ rootEpoch: '1', workEpoch: '1' });
  return oracle;
}

export function contributorForContract(profile, contractId) {
  const contributor = profile.contributors.find(({ contract }) => contract.id === contractId);
  assert(contributor, `missing Progress contributor for ${contractId}`);
  return contributor;
}

export function optionalContributorForContract(profile, contractId) {
  return profile.contributors.find(({ contract }) => contract.id === contractId) ?? null;
}

export function workClassForContract(profile, contractId) {
  const contributor = contributorForContract(profile, contractId);
  const entry = profile.workClasses.find(({ owner }) => owner === contributor.id);
  assert(entry, `missing Progress work class for ${contractId}`);
  return entry;
}

export function workClassByKind(profile, kind) {
  const entry = profile.workClasses.find((workClass) => workClass.kind === kind);
  assert(entry, `missing Progress work class with kind ${kind}`);
  return entry;
}

export function ordinaryWorkClass(profile) {
  const ordinaryFairness = profile.fairnessClasses.find(({ closurePriority }) => closurePriority === false);
  assert(ordinaryFairness, 'missing ordinary Progress fairness class');
  const entry = profile.workClasses.find((workClass) =>
    ordinaryFairness.classes.includes(workClass.id)
    && workClass.batch.kind === 'none');
  assert(entry, 'missing ordinary non-batched Progress work class');
  return entry;
}

export function dependencyFacts(profile, workClass, overrides = {}) {
  return workClass.readiness.dependencies.map((id) => {
    const dependency = profile.dependencies.find((entry) => entry.id === id);
    assert(dependency, `missing Progress dependency ${id}`);
    return { id, state: overrides[id] ?? 'ready' };
  });
}

export function workInput(workClass, id, options = {}) {
  return {
    classId: workClass.id,
    owner: options.owner ?? workClass.owner,
    workId: options.workId ?? `work-${id}`,
    incarnation: options.incarnation ?? '1',
    rootEpoch: options.rootEpoch ?? '1',
    workEpoch: options.workEpoch ?? '1',
    payloadRef: options.payloadRef ?? `payload-${id}`,
    irreversibleResultVisible: options.irreversibleResultVisible === true,
    resourceAdmission: options.resourceAdmission ?? {
      approved: true,
      token: `resource-${id}`,
      classes: [...workClass.resources],
      reserve: workClass.reserve,
    },
  };
}

export function workRef(input, extra = {}) {
  return {
    classId: input.classId,
    owner: input.owner,
    workId: input.workId,
    incarnation: input.incarnation,
    rootEpoch: input.rootEpoch,
    workEpoch: input.workEpoch,
    ...extra,
  };
}

export function admitAndReady(oracle, profile, workClass, id, options = {}) {
  const input = workInput(workClass, id, options);
  assert.equal(oracle.admitWork(input).kind, 'admitted');
  assert.equal(oracle.publishReady({
    ...workRef(input),
    payloadReady: true,
    resourceReady: true,
    dependencyFacts: dependencyFacts(profile, workClass, options.dependencyStates),
  }).kind, 'ready');
  return input;
}

export function expectCode(body, code) {
  let caught = null;
  try {
    body();
  } catch (error) {
    caught = error;
  }
  assert(caught, `expected ${code}`);
  assert.equal(caught.code, code, `expected ${code}, received ${caught.code ?? caught.name}`);
  return caught;
}

export function stableProgressSnapshot(snapshot) {
  return {
    lifecycle: snapshot.lifecycle,
    epochs: snapshot.epochs,
    firstStopCause: snapshot.firstStopCause,
    accounting: {
      admitted: snapshot.accounting.admitted,
      live: snapshot.accounting.live,
      terminal: snapshot.accounting.terminal,
      states: snapshot.accounting.states,
    },
    work: snapshot.work
      .map(({ claimId, ...entry }) => ({ ...entry, claimId: claimId === null ? null : 'claimed' }))
      .sort((left, right) => left.workId.localeCompare(right.workId)),
  };
}

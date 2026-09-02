import assert from 'node:assert/strict';

import { createOutputOracle } from './output.mjs';

export function getOutputProfile(projection, id) {
  const entry = projection.profiles.find((profile) => profile.id === id);
  assert(entry, `missing Output profile ${id}`);
  return entry.normalized;
}

export function initializedOutputOracle(profile, options = {}) {
  const oracle = createOutputOracle({ profile, ...options });
  oracle.initializeOutputProfile({
    searchIdentity: options.searchIdentity ?? 'search.synthetic',
    sessionIdentity: options.sessionIdentity ?? 'session.synthetic',
    searchIncarnation: options.searchIncarnation ?? '1',
    rootEpoch: options.rootEpoch ?? '1',
    workEpoch: options.workEpoch ?? '1',
  });
  return oracle;
}

export function terminalFields(profile) {
  return profile.fields.filter(({ schema }) => schema === profile.terminal.schema).sort((left, right) => Number(BigInt(left.order) - BigInt(right.order)));
}

export function liveSchema(profile) {
  assert.equal(profile.observations.kind, 'selected', `${profile.id} must select live observation`);
  const id = profile.observations.profiles[0].schemas[0];
  const schema = profile.schemas.find((entry) => entry.id === id);
  assert(schema, `missing live schema ${id}`);
  return schema;
}

export function liveFields(profile) {
  const schema = liveSchema(profile);
  return profile.fields.filter(({ schema: id }) => id === schema.id).sort((left, right) => Number(BigInt(left.order) - BigInt(right.order)));
}

export function fact(field, value, options = {}) {
  return {
    fieldId: field.id,
    state: options.state ?? 'ready',
    value,
    version: options.version ?? '1',
    rootEpoch: options.rootEpoch ?? '1',
    workEpoch: options.workEpoch ?? '1',
    generation: options.generation ?? '1',
    protected: options.protected ?? true,
  };
}

export function factsForFields(fields, options = {}) {
  return fields.map((field, index) => fact(field, options.values?.[field.id] ?? { field: field.id, index }, options.byField?.[field.id] ?? options.defaults ?? {}));
}

export function classifyTerminal(oracle, options = {}) {
  return oracle.classifyTerminalResult({
    completionClass: options.completionClass ?? 'complete',
    firstStopCause: options.firstStopCause ?? 'search-complete',
    completedWork: options.completedWork ?? '7',
    policyBudgetStatus: options.policyBudgetStatus ?? 'satisfied',
    resourceStatus: options.resourceStatus ?? { kind: 'conserved', highWater: '7' },
    diagnosticIdentity: options.diagnosticIdentity ?? 'diagnostic.synthetic',
    laterDispositions: options.laterDispositions ?? [],
    terminalCutReady: options.terminalCutReady ?? true,
    resultVisibleResolved: options.resultVisibleResolved ?? true,
  });
}

export function publishTerminal(oracle, profile, options = {}) {
  classifyTerminal(oracle, options);
  oracle.captureTerminalPayload({ facts: options.facts ?? factsForFields(terminalFields(profile)), completeWrites: options.completeWrites ?? true });
  return oracle.publishOutput({ slotId: 'terminal-0' });
}

export function admitLive(oracle, profile, requestId, options = {}) {
  return oracle.admitObservationRequest({
    requestId,
    authorized: options.authorized ?? true,
    schemaId: options.schemaId ?? liveSchema(profile).id,
    searchIncarnation: options.searchIncarnation ?? '1',
    rootEpoch: options.rootEpoch ?? '1',
    workEpoch: options.workEpoch ?? '1',
    profileId: options.profileId ?? profile.id,
    ...(options.runtimeSchema === undefined ? {} : { runtimeSchema: options.runtimeSchema }),
  });
}

export function captureAndPublishLive(oracle, profile, requestId, options = {}) {
  const admission = admitLive(oracle, profile, requestId, options);
  if (admission.kind !== 'admitted') return admission;
  const captured = oracle.captureObservation({
    requestId,
    facts: options.facts ?? factsForFields(liveFields(profile)),
    versionsBefore: options.versionsBefore,
    versionsAfter: options.versionsAfter,
    completeWrites: options.completeWrites ?? true,
  });
  if (captured.kind !== 'captured') return captured;
  return oracle.publishOutput({ slotId: admission.slotId });
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

export function stableSourceSemantics(snapshot) {
  return {
    sourceMutationCount: snapshot.sourceMutationCount,
    hostProgressCount: snapshot.hostProgressCount,
    firstStopCause: snapshot.firstStopCause,
    context: snapshot.context,
  };
}

import assert from 'node:assert/strict';

export function getProfile(projection, id) {
  const entry = projection.profiles.find((profile) => profile.id === id);
  assert(entry, `missing Evaluator profile ${id}`);
  return entry.normalized;
}

export function caps(profile) {
  return profile.request.capabilities.map(({ capability, requirement, fallback }) => ({ capability, requirement, fallback }));
}

export function cacheKey(profile, suffix = 'a', overrides = {}) {
  assert.equal(profile.cache.kind, 'selected');
  const values = {
    'artifact-generation': `artifact-${suffix}`,
    'capability-set': profile.capabilities.map(({ id }) => id),
    'encoded-input': { state: `state-${suffix}`, history: `history-${suffix}` },
    'evaluator-profile': profile.id,
    history: { digest: `history-${suffix}` },
    'precision-execution': { class: profile.execution.equivalenceClass },
    purpose: `purpose-${suffix}`,
    root: { epoch: suffix },
    ...overrides,
  };
  return Object.fromEntries(profile.cache.keyFacts.map((fact) => [fact, values[fact]]));
}

export function requestInput(profile, id, options = {}) {
  const slotId = options.slotId ?? `slot-${id}`;
  const incarnation = options.incarnation ?? '1';
  const purpose = options.purpose ?? `purpose-${id}`;
  const inputKey = options.inputKey ?? (profile.cache.kind === 'selected' ? cacheKey(profile, id) : { encoded: `input-${id}` });
  return {
    admission: options.admission ?? { approved: true, token: `request-admission-${id}-${incarnation}` },
    capabilities: options.capabilities ?? caps(profile),
    coalescingKey: options.coalescingKey ?? { inputKey, purpose },
    compatibilityKey: options.compatibilityKey ?? { profile: profile.id, shape: 'fixture-a', execution: profile.execution.equivalenceClass },
    graphReference: options.graphReference ?? { arena: '0', slot: id, generation: '1' },
    incarnation, inputKey, inputLeaseId: options.inputLeaseId ?? `input-lease-${id}-${incarnation}`, purpose,
    requestId: options.requestId ?? `request-${id}`, requesterId: options.requesterId ?? `requester-${id}`,
    resultSlotId: options.resultSlotId ?? `result-slot-${slotId}`, rootEpoch: options.rootEpoch ?? '0',
    rootIndependent: options.rootIndependent ?? false, slotId, workEpoch: options.workEpoch ?? '0',
  };
}

export function ref(input) { return { slotId: input.slotId, requestId: input.requestId, incarnation: input.incarnation }; }

export function workspaceAdmission(profile, scope, suffix, options = {}) {
  const descriptor = profile.workspaces.find((entry) => entry.scope === scope);
  if (!descriptor) return null;
  return { approved: options.approved ?? true, bytes: options.bytes ?? (BigInt(descriptor.maxBytes) > 4096n ? '4096' : descriptor.maxBytes), leaseId: options.leaseId ?? `${scope}-workspace-${suffix}`, token: options.token ?? `${scope}-token-${suffix}` };
}

export function form(oracle, profile, batchId, inputs, options = {}) {
  return oracle.formBatch({
    batchContext: options.batchContext ?? (profile.batching.semantics === 'batch-sensitive' ? { randomCounter: `random-${batchId}`, orderKey: `order-${batchId}` } : null),
    batchId, compatibilityKey: options.compatibilityKey ?? inputs[0].compatibilityKey, itemRefs: inputs.map(ref),
    paddingCount: options.paddingCount ?? '0', serviceOpportunity: options.serviceOpportunity ?? false,
    workspaceAdmission: options.workspaceAdmission ?? workspaceAdmission(profile, 'per-batch', batchId),
  });
}

export function resultsFor(profile, inputs, options = {}) {
  const selected = options.capabilityIds ?? profile.capabilities.map(({ id }) => id);
  return inputs.map((input, itemIndex) => ({ ref: ref(input), capabilities: selected.map((capabilityId, capIndex) => ({ capabilityId, payload: options.payload?.(input, capabilityId, itemIndex, capIndex) ?? { token: `${input.requestId}:${capabilityId}:${options.suffix ?? 'fresh'}` }, validity: options.validity?.(input, capabilityId) ?? { complete: true, profile: profile.id } })) }));
}

export function executeComplete(oracle, profile, batchId, inputs, options = {}) {
  return oracle.executeBatch({ batchId, continuation: { kind: 'complete' }, results: resultsFor(profile, inputs, options) });
}

export function cancelAndClean(oracle, inputs) {
  for (const input of inputs) { const observed = oracle.observeRequest(ref(input)); if (!['ready', 'failed', 'cancelled', 'stale'].includes(observed.state)) oracle.cancelRequest({ ...ref(input), reason: 'case-cleanup' }); }
  return oracle.cleanup();
}

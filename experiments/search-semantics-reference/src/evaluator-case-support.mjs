import assert from 'node:assert/strict';

export function getProfile(projection, id) {
  const entry = projection.profiles.find((profile) => profile.id === id);
  assert(entry, `missing Evaluator profile ${id}`);
  return entry.normalized;
}

export function caps(profile) {
  return profile.request.capabilities.map(({ capability, requirement, fallback }) => ({ capability, requirement, fallback }));
}

function keyFactsFor(profile) {
  return [...new Set(profile.inputs.flatMap(({ keyFacts }) => keyFacts))];
}

function factValues(profile, suffix, overrides = {}) {
  return {
    'artifact-generation': `artifact-generation-${profile.id}`,
    'batch-context': { class: profile.batching.semantics },
    'capability-set': profile.capabilities.map(({ id }) => id),
    'encoded-input': { state: `state-${suffix}`, history: `history-${suffix}` },
    'evaluator-profile': profile.id,
    history: { digest: `history-${suffix}` },
    observation: { generation: `observation-${suffix}` },
    'precision-execution': { class: profile.execution.equivalenceClass },
    product: { identity: `product-${suffix}` },
    purpose: `purpose-${suffix}`,
    randomness: { counter: `random-${suffix}` },
    root: { epoch: '0' },
    'state-generation': `state-generation-${profile.id}`,
    ...overrides,
  };
}

export function evaluatorKey(profile, suffix = 'a', overrides = {}) {
  const values = factValues(profile, suffix, overrides);
  return Object.fromEntries(keyFactsFor(profile).map((fact) => {
    assert.notEqual(values[fact], undefined, `Evaluator fixture has no value for key fact ${fact}`);
    return [fact, values[fact]];
  }));
}

export function cacheKey(profile, suffix = 'a', overrides = {}) {
  assert.equal(profile.cache.kind, 'selected');
  const values = factValues(profile, suffix, overrides);
  return Object.fromEntries(profile.cache.keyFacts.map((fact) => {
    assert.notEqual(values[fact], undefined, `Evaluator fixture has no cache value for key fact ${fact}`);
    return [fact, values[fact]];
  }));
}

export function batchCompatibilityKey(profile, capabilities, inputKey) {
  const selectedIds = capabilities.map(({ capability }) => capability);
  const selectedProfiles = selectedIds.map((id) => {
    const selected = profile.capabilities.find(({ id: capabilityId }) => capabilityId === id);
    assert(selected, `unknown selected capability ${id}`);
    return selected;
  });
  const inputIds = [...new Set(selectedProfiles.flatMap(({ inputs }) => inputs))];
  const outputIds = [...new Set(selectedProfiles.flatMap(({ outputs }) => outputs))];
  const shapeById = new Map(profile.inputs.map(({ id, shape }) => [id, {
    id,
    axes: shape.axes,
    maxElements: shape.maxElements,
    maxBytes: shape.maxBytes,
    variable: shape.variable,
  }]));
  return {
    evaluatorProfile: profile.id,
    capabilitySet: selectedIds,
    outputSet: outputIds,
    inputShapeClass: inputIds.map((id) => shapeById.get(id)),
    artifactGeneration: inputKey['artifact-generation'] ?? null,
    stateGeneration: inputKey['state-generation'] ?? null,
    precisionExecution: inputKey['precision-execution'] ?? null,
    executionVariant: { equivalenceClass: profile.execution.equivalenceClass, determinism: profile.batching.determinism },
    batchSensitiveContext: profile.batching.semantics === 'batch-sensitive' ? (inputKey['batch-context'] ?? null) : null,
    resourceClass: profile.workspaces.map(({ scope, ownership, maxBytes }) => ({ scope, ownership, maxBytes })),
  };
}

export function requestInput(profile, id, options = {}) {
  const slotId = options.slotId ?? `slot-${id}`;
  const incarnation = options.incarnation ?? '1';
  const capabilities = options.capabilities ?? caps(profile);
  const suppliedInputKey = options.inputKey ?? null;
  const purpose = options.purpose ?? suppliedInputKey?.purpose ?? `purpose-${id}`;
  const rootEpoch = options.rootEpoch ?? suppliedInputKey?.root?.epoch ?? '0';
  const workEpoch = options.workEpoch ?? '0';
  const commonOverrides = {
    'capability-set': capabilities.map(({ capability }) => capability),
    purpose,
    root: { epoch: rootEpoch },
  };
  const inputKey = suppliedInputKey ?? evaluatorKey(profile, id, commonOverrides);
  const requestCacheKey = profile.cache.kind === 'selected'
    ? (options.cacheKey ?? cacheKey(profile, id, { ...commonOverrides, ...inputKey }))
    : null;
  const compatibilityKey = options.compatibilityKey ?? batchCompatibilityKey(profile, capabilities, inputKey);
  const coalescingKey = options.coalescingKey ?? { inputKey, cacheKey: requestCacheKey, purpose, rootEpoch, workEpoch, capabilities };
  return {
    admission: options.admission ?? { approved: true, token: `request-admission-${id}-${incarnation}` },
    cacheKey: requestCacheKey,
    capabilities,
    coalescingKey,
    compatibilityKey,
    graphReference: options.graphReference ?? { arena: '0', slot: id, generation: '1' },
    incarnation, inputKey, inputLeaseId: options.inputLeaseId ?? `input-lease-${id}-${incarnation}`, purpose,
    requestId: options.requestId ?? `request-${id}`, requesterId: options.requesterId ?? `requester-${id}`,
    resultSlotId: options.resultSlotId ?? `result-slot-${slotId}`, rootEpoch,
    rootIndependent: options.rootIndependent ?? false, slotId, workEpoch,
  };
}

export function ref(input) {
  return { slotId: input.slotId, requestId: input.requestId, incarnation: input.incarnation, resultSlotId: input.resultSlotId };
}

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
  for (const input of inputs) {
    const observed = oracle.observeRequest(ref(input));
    if (!['ready', 'failed', 'cancelled', 'stale'].includes(observed.state)) oracle.cancelRequest({ ...ref(input), reason: 'case-cleanup' });
  }
  return oracle.cleanup();
}

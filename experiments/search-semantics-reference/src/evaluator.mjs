import { canonicalBytes, canonicalClone, canonicalIdentity, frozenCanonicalClone } from './canonical.mjs';
import { fail } from './errors.mjs';

const freeze = (value, label='Evaluator value') => frozenCanonicalClone(value, label);
const dec = (value, label='decimal') => {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) fail('EVALUATOR_REFERENCE_DECIMAL', `${label} must be a canonical decimal string`);
  return BigInt(value);
};
const textId = (value, label) => {
  if (typeof value !== 'string' || value.length === 0) fail('EVALUATOR_REFERENCE_IDENTITY', `${label} must be a non-empty string`);
  return value;
};
const terminal = (state) => ['ready', 'failed', 'cancelled', 'stale'].includes(state);
const refKey = ({ slotId, requestId, incarnation, resultSlotId }) => `${slotId}\0${requestId}\0${incarnation}\0${resultSlotId}`;
const requestKey = (slotId, requestId, incarnation) => `${slotId}\0${requestId}\0${incarnation}`;
const sameCanonical = (left, right, label = 'Evaluator comparison') => canonicalBytes(left, `${label} left`).equals(canonicalBytes(right, `${label} right`));

function absentOracle() {
  let removed = false;
  const reject = () => fail('EVALUATOR_REFERENCE_ABSENT', 'evaluator selection is absent');
  return Object.freeze({
    selection: 'absent', admitRequest: reject, formBatch: reject, claimCacheEntry: reject, classifyReuse: reject,
    snapshot: () => ({ selection: removed ? 'removed' : 'absent', requests: 0, batches: 0, workspaces: 0, cacheEntries: 0, quarantine: null, evidenceValid: true }),
    cleanup: () => ({ kind: 'complete', selection: 'absent', runtimeResidue: 0, evidenceValid: true }),
    removeEvaluator: () => { removed = true; return { kind: 'removed', selection: 'absent', runtimeResidue: 0 }; },
    removeCapability: reject,
  });
}

export function createEvaluatorOracle({ profile = null, admission = {}, mutations = {} } = {}) {
  if (profile === null) return absentOracle();

  const capabilityRules = new Map(profile.request.capabilities.map((entry) => [entry.capability, entry]));
  const profileCapabilities = new Map(profile.capabilities.map((entry) => [entry.id, entry]));
  const profileInputs = new Map(profile.inputs.map((entry) => [entry.id, entry]));
  const reuseRules = new Map(profile.reuse.map((entry) => [entry.classId, entry]));
  const maxActive = admission.maxActive === undefined ? dec(profile.request.maxActive) : dec(admission.maxActive);
  const maxCache = profile.cache.kind === 'selected'
    ? (admission.maxCacheEntries === undefined ? dec(profile.cache.maxEntries) : dec(admission.maxCacheEntries)) : 0n;
  if (maxActive > dec(profile.request.maxActive) || (profile.cache.kind === 'selected' && maxCache > dec(profile.cache.maxEntries))) {
    fail('EVALUATOR_REFERENCE_ADMISSION', 'injected admission exceeds normalized profile bounds');
  }

  const requests = new Map();
  const currentBySlot = new Map();
  const batches = new Map();
  const workspaces = new Map();
  const cache = new Map();
  const cacheBuckets = new Map();
  const rerootOps = new Set();
  let quarantine = null;
  let reuseClassifications = 0n;
  let mutableGeneration = 0n;
  let activeWorkspaceBytes = 0n;
  let workspaceHighWaterBytes = 0n;
  let removed = false;

  const available = () => {
    if (removed) fail('EVALUATOR_REFERENCE_REMOVED', 'evaluator was removed');
    if (quarantine) fail('EVALUATOR_REFERENCE_QUARANTINED', `evaluator evidence is quarantined: ${quarantine.code}`);
  };
  const quarantineEvidence = (code, detail = null) => {
    quarantine ??= freeze({ code, detail, evidenceValid: false }, 'Evaluator quarantine');
    return quarantine;
  };
  const find = (ref) => {
    const request = requests.get(requestKey(ref.slotId, ref.requestId, ref.incarnation));
    if (!request) fail('EVALUATOR_REFERENCE_REQUEST', `unknown request ${ref.slotId}/${ref.requestId}/${ref.incarnation}`);
    if (textId(ref.resultSlotId, 'resultSlotId') !== request.resultSlotId) fail('EVALUATOR_REFERENCE_RESULT_SLOT', 'request reference does not bind the admitted result slot');
    return request;
  };
  const current = (slotId) => {
    const key = currentBySlot.get(slotId);
    return key === undefined ? null : requests.get(key) ?? null;
  };
  const releaseInput = (request) => { request.inputLease = 'released'; };
  const capabilitySnapshot = (request) => [...request.capabilities].map(([id, value]) => ({
    id,
    state: value.state,
    source: value.source,
    payload: canonicalClone(value.payload),
    validity: canonicalClone(value.validity),
  }));
  const settleWaiters = (request, state, reason) => {
    const outcome = freeze({ state, reason: reason ?? null, capabilities: capabilitySnapshot(request) }, 'Evaluator waiter outcome');
    for (const waiterId of request.waiters) request.waiterOutcomes.set(waiterId, outcome);
    request.waiters.clear();
  };
  const endRequest = (request, state, reason) => {
    if (terminal(request.state)) return;
    request.state = state; request.reason = reason; request.resultDisposition = state;
    for (const capability of request.capabilities.values()) if (capability.state === 'pending') capability.state = state;
    settleWaiters(request, state, reason);
    const batch = request.batchId === null ? null : batches.get(request.batchId);
    if (!batch || !['formed', 'continuation', 'executed'].includes(batch.state)) releaseInput(request);
  };
  const cacheIdentity = (facts) => {
    if (profile.cache.kind !== 'selected') fail('EVALUATOR_REFERENCE_CACHE_ABSENT', 'profile selects no cache');
    for (const fact of profile.cache.keyFacts) if (facts?.[fact] === undefined || facts[fact] === null) fail('EVALUATOR_REFERENCE_CACHE_KEY', `missing cache fact ${fact}`);
    if (Object.keys(facts).length !== profile.cache.keyFacts.length) fail('EVALUATOR_REFERENCE_CACHE_KEY', 'cache key contains undeclared facts');
    return canonicalIdentity(facts, 'Evaluator cache key');
  };
  const selectedCapabilityProfiles = (selected) => selected.map(({ capability: capabilityId }) => {
    const capability = profileCapabilities.get(capabilityId);
    if (!capability) fail('EVALUATOR_REFERENCE_REQUEST_CAPABILITIES', `unknown capability ${capabilityId}`);
    return capability;
  });
  const requiredInputFacts = (selectedProfiles) => {
    const inputIds = [...new Set(selectedProfiles.flatMap(({ inputs }) => inputs))];
    const inputs = inputIds.map((id) => {
      const input = profileInputs.get(id);
      if (!input) fail('EVALUATOR_REFERENCE_REQUEST_INPUT_KEY', `unknown evaluator input ${id}`);
      return input;
    });
    return { inputIds, inputs, facts: [...new Set(inputs.flatMap(({ keyFacts }) => keyFacts))] };
  };
  const expectedBatchCompatibility = (selectedProfiles, inputKey) => {
    const { inputIds } = requiredInputFacts(selectedProfiles);
    const outputIds = [...new Set(selectedProfiles.flatMap(({ outputs }) => outputs))];
    return {
      evaluatorProfile: profile.id,
      capabilitySet: selectedProfiles.map(({ id }) => id),
      outputSet: outputIds,
      inputShapeClass: inputIds.map((id) => {
        const shape = profileInputs.get(id).shape;
        return { id, axes: shape.axes, maxElements: shape.maxElements, maxBytes: shape.maxBytes, variable: shape.variable };
      }),
      artifactGeneration: inputKey['artifact-generation'] ?? null,
      stateGeneration: inputKey['state-generation'] ?? null,
      precisionExecution: inputKey['precision-execution'] ?? null,
      executionVariant: { equivalenceClass: profile.execution.equivalenceClass, determinism: profile.batching.determinism },
      batchSensitiveContext: profile.batching.semantics === 'batch-sensitive' ? (inputKey['batch-context'] ?? null) : null,
      resourceClass: profile.workspaces.map(({ scope, ownership, maxBytes }) => ({ scope, ownership, maxBytes })),
    };
  };

  function admitRequest(input) {
    available();
    if (input.admission?.approved !== true || BigInt([...requests.values()].filter((r) => !terminal(r.state)).length) >= maxActive) {
      return { kind: 'pressure', code: 'evaluator-request-capacity' };
    }
    textId(input.admission.token, 'admission token');
    const slotId = textId(input.slotId, 'slotId');
    const requestId = textId(input.requestId, 'requestId');
    const requesterId = textId(input.requesterId, 'requesterId');
    const resultSlotId = textId(input.resultSlotId, 'resultSlotId');
    const inputLeaseId = textId(input.inputLeaseId, 'inputLeaseId');
    const purpose = textId(input.purpose, 'purpose');
    const incarnation = dec(input.incarnation, 'incarnation');
    const rootEpoch = dec(input.rootEpoch, 'rootEpoch');
    const workEpoch = dec(input.workEpoch, 'workEpoch');
    const old = current(slotId);
    if (old && (!terminal(old.state) || incarnation <= old.incarnation)) fail('EVALUATOR_REFERENCE_INCARNATION', 'slot incarnation must supersede a terminal predecessor');
    const key = requestKey(slotId, requestId, input.incarnation);
    if (requests.has(key)) fail('EVALUATOR_REFERENCE_REQUEST', 'duplicate request identity');
    const capabilities = new Map();
    for (const selected of input.capabilities) {
      const rule = capabilityRules.get(selected.capability);
      if (!rule || rule.requirement !== selected.requirement || rule.fallback !== selected.fallback || capabilities.has(selected.capability)) {
        fail('EVALUATOR_REFERENCE_REQUEST_CAPABILITIES', 'request capability coverage differs from normalized profile');
      }
      capabilities.set(selected.capability, { ...canonicalClone(selected), state: 'pending', source: null, payload: null, validity: null });
    }
    if (capabilities.size === 0) fail('EVALUATOR_REFERENCE_REQUEST_CAPABILITIES', 'request must select at least one capability');
    const selectedProfiles = selectedCapabilityProfiles(input.capabilities);
    const required = requiredInputFacts(selectedProfiles);
    for (const fact of required.facts) if (input.inputKey?.[fact] === undefined || input.inputKey[fact] === null) fail('EVALUATOR_REFERENCE_REQUEST_INPUT_KEY', `missing request input-key fact ${fact}`);
    if (Object.keys(input.inputKey).length !== required.facts.length) fail('EVALUATOR_REFERENCE_REQUEST_INPUT_KEY', 'request input key contains undeclared facts');
    if (input.rootIndependent === true && required.facts.includes('root')) fail('EVALUATOR_REFERENCE_REUSE_KEY', 'root-dependent evaluator input cannot be declared root-independent');
    if (input.inputKey['capability-set'] !== undefined && !sameCanonical(input.inputKey['capability-set'], selectedProfiles.map(({ id }) => id), 'request capability-set key')) fail('EVALUATOR_REFERENCE_REQUEST_INPUT_KEY', 'capability-set key disagrees with selected capabilities');
    if (input.inputKey['evaluator-profile'] !== undefined && input.inputKey['evaluator-profile'] !== profile.id) fail('EVALUATOR_REFERENCE_REQUEST_INPUT_KEY', 'evaluator-profile key disagrees with selected profile');
    if (input.inputKey.purpose !== undefined && input.inputKey.purpose !== purpose) fail('EVALUATOR_REFERENCE_REQUEST_INPUT_KEY', 'purpose key disagrees with request purpose');
    if (input.inputKey.root !== undefined && !sameCanonical(input.inputKey.root, { epoch: input.rootEpoch }, 'request root key')) fail('EVALUATOR_REFERENCE_REQUEST_INPUT_KEY', 'root key disagrees with request root epoch');
    const expectedCompatibility = expectedBatchCompatibility(selectedProfiles, input.inputKey);
    if (!sameCanonical(input.compatibilityKey, expectedCompatibility, 'batch compatibility declaration')) fail('EVALUATOR_REFERENCE_BATCH_COMPATIBILITY_KEY', 'request batch compatibility key omits or changes required compatibility facts');
    const expectedCoalescing = { inputKey: input.inputKey, purpose, rootEpoch: input.rootEpoch, workEpoch: input.workEpoch, capabilities: input.capabilities };
    if (!sameCanonical(input.coalescingKey, expectedCoalescing, 'request coalescing declaration')) fail('EVALUATOR_REFERENCE_COALESCE', 'request coalescing key omits validity-affecting request facts');

    const request = {
      key, slotId, id: requestId, requesterId, resultSlotId, inputLeaseId, profileId: profile.id,
      incarnation, incarnationText: input.incarnation, purpose, rootEpoch, workEpoch, rootIndependent: input.rootIndependent === true,
      admissionReservation: freeze(input.admission), inputKey: freeze(input.inputKey),
      cacheKeyIdentity: profile.cache.kind === 'selected' ? cacheIdentity(input.inputKey) : null,
      graphReference: freeze(input.graphReference), compatibilityKey: freeze(input.compatibilityKey), coalescingKey: freeze(input.coalescingKey),
      state: 'queued', reason: null, batchId: null, waiters: new Set(), waiterOutcomes: new Map(), inputLease: 'held', resultDisposition: 'claimed', capabilities,
    };
    requests.set(key, request); currentBySlot.set(slotId, key);
    return { kind: 'queued', slotId, requestId, incarnation: input.incarnation };
  }

  function attachWaiter(input) {
    available(); const request = find(input);
    const waiterId = textId(input.waiterId, 'waiterId');
    const selected = [...request.capabilities.values()].map(({ capability, requirement, fallback }) => ({ capability, requirement, fallback }));
    if (
      terminal(request.state)
      || !sameCanonical(input.coalescingKey, request.coalescingKey, 'request coalescing key')
      || input.purpose !== request.purpose
      || dec(input.rootEpoch, 'waiter rootEpoch') !== request.rootEpoch
      || dec(input.workEpoch, 'waiter workEpoch') !== request.workEpoch
      || !sameCanonical(input.capabilities, selected, 'waiter capability set')
    ) fail('EVALUATOR_REFERENCE_COALESCE', 'waiter does not match authoritative request');
    if (request.waiters.has(waiterId) || request.waiterOutcomes.has(waiterId)) fail('EVALUATOR_REFERENCE_WAITER', 'duplicate waiter identity');
    if (BigInt(request.waiters.size) >= dec(profile.request.maxWaiters)) return { kind: 'pressure', code: 'evaluator-request-capacity' };
    request.waiters.add(waiterId); return { kind: 'attached', waiterId };
  }
  function cancelWaiter(input) {
    available(); const request = find(input); const waiterId = textId(input.waiterId, 'waiterId');
    if (!request.waiters.delete(waiterId)) fail('EVALUATOR_REFERENCE_WAITER', 'unknown waiter');
    request.waiterOutcomes.set(waiterId, freeze({ state: 'cancelled', reason: 'waiter-cancelled', capabilities: capabilitySnapshot(request) }, 'Evaluator waiter cancellation'));
    return { kind: 'cancelled', remainingWaiters: request.waiters.size };
  }
  function observeRequest(input) {
    const request = find(input);
    return {
      slotId: request.slotId, requestId: request.id, incarnation: request.incarnationText, state: request.state,
      resultDisposition: request.resultDisposition, inputLease: request.inputLease,
      bindings: {
        profileId: request.profileId, purpose: request.purpose, requesterId: request.requesterId, resultSlotId: request.resultSlotId,
        inputLeaseId: request.inputLeaseId, rootEpoch: request.rootEpoch.toString(), workEpoch: request.workEpoch.toString(),
        admissionReservation: canonicalClone(request.admissionReservation), graphReference: canonicalClone(request.graphReference),
        inputKey: canonicalClone(request.inputKey), compatibilityKey: canonicalClone(request.compatibilityKey), coalescingKey: canonicalClone(request.coalescingKey),
      },
      capabilities: capabilitySnapshot(request),
      waiters: request.waiters.size,
      waiterOutcomes: [...request.waiterOutcomes].map(([waiterId, outcome]) => ({ waiterId, ...canonicalClone(outcome) })),
    };
  }
  function cancelRequest(input) { available(); const request = find(input); if (request.state === 'ready') return { kind: 'already-ready', requestId: request.id, incarnation: request.incarnationText }; endRequest(request, 'cancelled', input.reason); return { kind: 'cancelled', requestId: request.id, incarnation: request.incarnationText }; }
  function failRequest(input) { available(); const request = find(input); endRequest(request, 'failed', input.code); return { kind: 'failed', requestId: request.id, incarnation: request.incarnationText }; }

  const workspaceRule = (scope) => profile.workspaces.find((entry) => entry.scope === scope) ?? null;
  function acquireWorkspace(scope, fact, owner) {
    const rule = workspaceRule(scope);
    if (!rule) { if (fact !== null) fail('EVALUATOR_REFERENCE_WORKSPACE', `profile has no ${scope} workspace`); return null; }
    if (!fact || fact.approved !== true) return { pressure: true, code: 'evaluator-workspace-capacity' };
    textId(fact.token, `${scope} workspace token`);
    textId(fact.leaseId, `${scope} workspace leaseId`);
    const bytes = dec(fact.bytes, `${scope} workspace bytes`);
    if (bytes > dec(rule.maxBytes)) fail('EVALUATOR_REFERENCE_WORKSPACE', 'workspace exceeds normalized bound');
    if (scope === 'per-continuation' && profile.batching.continuation.kind === 'bounded' && bytes > dec(profile.batching.continuation.maxRetainedBytes)) fail('EVALUATOR_REFERENCE_WORKSPACE', 'continuation workspace exceeds retained-state bound');
    if (workspaces.get(fact.leaseId)?.state === 'acquired') return { pressure: true, code: 'evaluator-workspace-capacity' };
    const lease = { id: fact.leaseId, scope, owner, bytes, state: 'acquired' }; workspaces.set(lease.id, lease);
    activeWorkspaceBytes += bytes;
    if (activeWorkspaceBytes > workspaceHighWaterBytes) workspaceHighWaterBytes = activeWorkspaceBytes;
    return lease;
  }
  const releaseWorkspace = (id) => {
    if (id === null) return;
    const lease = workspaces.get(id);
    if (!lease || lease.state !== 'acquired') fail('EVALUATOR_REFERENCE_WORKSPACE_IMBALANCE', 'workspace lease is not live');
    lease.state = 'released'; activeWorkspaceBytes -= lease.bytes;
    if (activeWorkspaceBytes < 0n) fail('EVALUATOR_REFERENCE_WORKSPACE_IMBALANCE', 'workspace accounting underflow');
  };
  const transitionBatchRequests = (batch, state) => {
    for (const ref of batch.refs) { const request = find(ref); if (!terminal(request.state)) request.state = state; }
  };

  function formBatch(input) {
    available();
    textId(input.batchId, 'batchId');
    if (batches.has(input.batchId) || input.itemRefs.length === 0 || BigInt(input.itemRefs.length) > dec(profile.batching.maximumItems)) fail('EVALUATOR_REFERENCE_BATCH', 'invalid batch identity or size');
    if (BigInt(input.itemRefs.length) < dec(profile.batching.minimumReadyItems) && input.serviceOpportunity !== true) return { kind: 'pending', code: 'evaluator-batch-pending' };
    const refs = input.itemRefs.map((ref) => freeze(ref));
    if (new Set(refs.map(refKey)).size !== refs.length) fail('EVALUATOR_REFERENCE_BATCH', 'duplicate batch item');
    for (const ref of refs) {
      const request = find(ref);
      if (request.state !== 'queued' || !sameCanonical(request.compatibilityKey, input.compatibilityKey, 'batch compatibility key')) fail('EVALUATOR_REFERENCE_BATCH_INCOMPATIBLE', 'batch item is not queued/compatible');
    }
    if (profile.batching.semantics === 'batch-sensitive' ? input.batchContext === null : input.batchContext !== null) fail('EVALUATOR_REFERENCE_BATCH_CONTEXT', 'batch context does not match normalized semantics');
    const paddingCount = dec(input.paddingCount, 'batch padding count');
    if (BigInt(refs.length) + paddingCount > dec(profile.batching.maximumItems)) fail('EVALUATOR_REFERENCE_BATCH', 'batch items plus inactive padding exceed normalized capacity');
    const subject = profile.batching.semantics === 'batch-sensitive'
      ? { profile: profile.id, compatibilityKey: input.compatibilityKey, batchContext: input.batchContext, itemOrder: refs, paddingCount: input.paddingCount }
      : { profile: profile.id, compatibilityKey: input.compatibilityKey };
    const semanticIdentity = canonicalIdentity(subject);
    const workspace = acquireWorkspace('per-batch', input.workspaceAdmission, input.batchId); if (workspace?.pressure) return { kind: 'pressure', code: workspace.code };
    const batch = {
      id: input.batchId, state: 'formed', terminalDisposition: null, refs, refSet: new Set(refs.map(refKey)), semanticIdentity,
      capabilitySet: freeze(input.compatibilityKey.capabilitySet), executionProfile: freeze(input.compatibilityKey.executionVariant), capacity: profile.batching.maximumItems,
      workspace: workspace?.id ?? null, continuationWorkspace: null, continuationId: null, continuationProgressToken: null, resumes: 0n,
      resumeOperations: new Map(), results: new Map(), failed: new Set(),
    };
    batches.set(batch.id, batch); for (const ref of refs) { const request = find(ref); request.state = 'batched'; request.batchId = batch.id; }
    return {
      kind: 'formed', batchId: batch.id, semanticIdentity: batch.semanticIdentity, items: refs.length, paddingCount: input.paddingCount,
      serviceOpportunity: input.serviceOpportunity === true, capacity: batch.capacity,
      capabilitySet: canonicalClone(batch.capabilitySet), executionProfile: canonicalClone(batch.executionProfile),
    };
  }
  function normalizeResults(batch, results) {
    const out = new Map();
    for (const item of results) {
      const key = refKey(item.ref); if (!batch.refSet.has(key) || out.has(key) || item.capabilities.length === 0) fail('EVALUATOR_REFERENCE_BATCH_RESULT', 'result does not identify exactly one active batch item');
      const request = find(item.ref);
      const seen = new Set();
      for (const result of item.capabilities) { if (!request.capabilities.has(result.capabilityId) || seen.has(result.capabilityId)) fail('EVALUATOR_REFERENCE_CAPABILITY_RESULT', 'invalid/duplicate/unrequested capability result'); seen.add(result.capabilityId); }
      out.set(key, { ref: freeze(item.ref), capabilities: item.capabilities.map((result) => freeze(result)) });
    }
    return out;
  }
  function mergeBatchResults(existing, incoming) {
    const merged = new Map([...existing].map(([key, value]) => [key, { ref: value.ref, capabilities: [...value.capabilities] }]));
    for (const [key, value] of incoming) {
      const currentResult = merged.get(key);
      if (!currentResult) { merged.set(key, value); continue; }
      const capabilities = new Map(currentResult.capabilities.map((capability) => [capability.capabilityId, capability]));
      for (const capability of value.capabilities) {
        const prior = capabilities.get(capability.capabilityId);
        if (prior && !sameCanonical(prior, capability, 'continuation capability result')) fail('EVALUATOR_REFERENCE_CONTINUATION_RESULT_CONFLICT', 'continuation attempted to replace a complete capability result');
        if (!prior) capabilities.set(capability.capabilityId, capability);
      }
      merged.set(key, { ref: currentResult.ref, capabilities: [...capabilities.values()] });
    }
    return merged;
  }
  function executeBatch(input) {
    available(); const batch = batches.get(input.batchId); if (!batch || batch.state !== 'formed') fail('EVALUATOR_REFERENCE_BATCH', 'batch is not formed');
    const results = normalizeResults(batch, input.results);
    if (input.continuation.kind === 'pending') {
      if (profile.batching.continuation.kind !== 'bounded') fail('EVALUATOR_REFERENCE_CONTINUATION', 'profile has no bounded continuation');
      const progressToken = textId(input.continuation.progressToken, 'continuation progress token');
      const workspace = acquireWorkspace('per-continuation', input.continuation.workspaceAdmission, batch.id); if (workspace?.pressure) return { kind: 'pressure', code: workspace.code };
      batch.results = results; batch.continuationWorkspace = workspace?.id ?? null; batch.continuationId = `${batch.id}:continuation`; batch.continuationProgressToken = progressToken; batch.state = 'continuation';
      transitionBatchRequests(batch, 'executing');
      return { kind: 'pending', continuationId: batch.continuationId, progressToken };
    }
    if (input.continuation.kind !== 'complete') fail('EVALUATOR_REFERENCE_CONTINUATION', 'invalid continuation completion');
    batch.results = results; batch.state = 'executed'; transitionBatchRequests(batch, 'publishing');
    return { kind: 'executed', batchId: batch.id };
  }
  function resumeBatch(input) {
    available();
    const batch = batches.get(input.batchId);
    if (!batch) fail('EVALUATOR_REFERENCE_CONTINUATION', 'unknown continuation batch');
    if (typeof input.resumeId !== 'string' || input.resumeId.length === 0) fail('EVALUATOR_REFERENCE_CONTINUATION_RETRY', 'resumeId is required');
    const operation = freeze({ continuation: input.continuation, results: input.results }, 'Evaluator continuation operation');
    const prior = batch.resumeOperations.get(input.resumeId);
    if (prior) {
      if (!sameCanonical(prior.operation, operation, 'continuation retry')) fail('EVALUATOR_REFERENCE_CONTINUATION_RETRY', 'resumeId was reused for a different continuation operation');
      return canonicalClone(prior.output);
    }
    if (batch.state !== 'continuation' || batch.continuationId !== input.continuationId) fail('EVALUATOR_REFERENCE_CONTINUATION', 'inactive continuation');
    if (batch.resumes >= dec(profile.batching.continuation.maxResumes)) fail('EVALUATOR_REFERENCE_CONTINUATION', 'continuation resume bound exhausted');
    let nextProgressToken = batch.continuationProgressToken;
    if (input.continuation.kind === 'pending') {
      nextProgressToken = textId(input.continuation.progressToken, 'continuation progress token');
      if (sameCanonical(nextProgressToken, batch.continuationProgressToken, 'continuation progress token')) fail('EVALUATOR_REFERENCE_CONTINUATION_PROGRESS', 'new continuation resume must publish a new progress token');
    } else if (input.continuation.kind !== 'complete') {
      fail('EVALUATOR_REFERENCE_CONTINUATION', 'invalid continuation completion');
    }
    const normalizedResults = normalizeResults(batch, input.results);
    const mergedResults = mergeBatchResults(batch.results, normalizedResults);
    const nextResumeCount = batch.resumes + 1n;
    let output;
    if (input.continuation.kind === 'pending') output = { kind: 'pending', continuationId: batch.continuationId, resumeCount: nextResumeCount.toString(), progressToken: nextProgressToken };
    else output = { kind: 'executed', batchId: batch.id, resumeCount: nextResumeCount.toString() };

    batch.resumes = nextResumeCount;
    batch.results = mergedResults;
    if (input.continuation.kind === 'pending') { batch.continuationProgressToken = nextProgressToken; transitionBatchRequests(batch, 'executing'); }
    else { batch.state = 'executed'; transitionBatchRequests(batch, 'publishing'); }
    batch.resumeOperations.set(input.resumeId, { operation, output: freeze(output) });
    return output;
  }
  function finishBatch(batch) {
    if (batch.state === 'terminal') return;
    batch.state = 'terminal'; batch.terminalDisposition = 'released'; releaseWorkspace(batch.workspace); releaseWorkspace(batch.continuationWorkspace);
    for (const ref of batch.refs) { const request = find(ref); if (terminal(request.state) && request.inputLease === 'held') releaseInput(request); }
  }
  function failBatch(input) {
    available(); const batch = batches.get(input.batchId); if (!batch || batch.state === 'terminal') fail('EVALUATOR_REFERENCE_BATCH', 'batch cannot fail');
    const affectedKeys = input.affectedItemRefs.map(refKey);
    const affected = new Set(affectedKeys);
    if (affected.size === 0 || affected.size !== affectedKeys.length || [...affected].some((key) => !batch.refSet.has(key))) fail('EVALUATOR_REFERENCE_BATCH_FAIL', 'affected failure items must be unique members of the batch');
    if (profile.batching.failureDomain !== 'item-independent' && affected.size !== batch.refSet.size) fail('EVALUATOR_REFERENCE_BATCH_FAIL', 'whole-batch failure must affect every item');
    for (const ref of batch.refs) if (affected.has(refKey(ref))) { batch.failed.add(refKey(ref)); endRequest(find(ref), 'failed', input.code); }
    if (profile.batching.failureDomain !== 'item-independent' || batch.failed.size === batch.refSet.size) finishBatch(batch);
    return { kind: profile.batching.failureDomain === 'item-independent' ? 'item-failure' : 'batch-failure', affected: affected.size };
  }
  function publishInto(request, result, source) {
    const capability = request.capabilities.get(result.capabilityId); if (!capability) fail('EVALUATOR_REFERENCE_CAPABILITY', 'capability was not requested');
    if (capability.state === 'ready') {
      if (!sameCanonical({ payload: capability.payload, validity: capability.validity }, { payload: result.payload, validity: result.validity }, 'capability publication')) {
        quarantineEvidence('conflicting-publication', { requestId: request.id, capability: result.capabilityId }); endRequest(request, 'failed', 'conflicting-publication');
        fail('EVALUATOR_REFERENCE_PUBLICATION_CONFLICT', 'conflicting publication');
      }
      return;
    }
    if (capability.state !== 'pending') fail('EVALUATOR_REFERENCE_PUBLICATION_TERMINAL', 'capability publication is already terminal');
    capability.state = 'ready'; capability.source = source; capability.payload = freeze(result.payload); capability.validity = freeze(result.validity);
  }
  function finalize(request) {
    if (terminal(request.state)) return;
    const selected = [...request.capabilities.values()]; const required = selected.filter((capability) => capability.requirement === 'required');
    const requiredReady = required.filter((capability) => capability.state === 'ready').length;
    const complete = mutations.allowIncompleteReady === true ? requiredReady > 0 : requiredReady === required.length;
    const othersTerminal = selected.filter((capability) => capability.requirement !== 'required').every((capability) => ['ready','failed','cancelled','detached'].includes(capability.state));
    if (complete && othersTerminal) {
      request.state = 'ready'; request.resultDisposition = 'ready';
      settleWaiters(request, 'ready', null);
      releaseInput(request);
    }
  }
  function scatterBatch(input) {
    available(); const batch = batches.get(input.batchId); if (!batch || batch.state !== 'executed') fail('EVALUATOR_REFERENCE_BATCH', 'batch is not executed'); const dispositions = [];
    for (const ref of batch.refs) {
      const key = refKey(ref); if (batch.failed.has(key)) { dispositions.push({ ref: canonicalClone(ref), kind: 'failed' }); continue; }
      const result = batch.results.get(key); if (!result) { const request = find(ref); if (!terminal(request.state)) endRequest(request, 'failed', 'evaluator-output-missing'); dispositions.push({ ref: canonicalClone(ref), kind: 'missing-failed' }); continue; }
      const active = current(ref.slotId);
      const incarnationMatches = active && active.id === ref.requestId && active.incarnationText === ref.incarnation && active.resultSlotId === ref.resultSlotId;
      if (mutations.skipScatterIncarnationCheck !== true && !incarnationMatches) { dispositions.push({ ref: canonicalClone(ref), kind: 'stale-rejected' }); continue; }
      const target = mutations.skipScatterIncarnationCheck === true ? active : find(ref);
      if (!target || terminal(target.state)) { dispositions.push({ ref: canonicalClone(ref), kind: 'terminal-rejected' }); continue; }
      for (const capability of result.capabilities) publishInto(target, capability, 'fresh-execution'); finalize(target);
      if (!terminal(target.state)) { target.state = 'queued'; target.batchId = null; }
      dispositions.push({ ref: canonicalClone(ref), kind: 'scattered', targetRequestId: target.id, targetIncarnation: target.incarnationText, targetResultSlotId: target.resultSlotId });
    }
    finishBatch(batch); return { kind: 'scattered', dispositions };
  }
  function publishCapability(input) { available(); const request = find(input); if (terminal(request.state)) fail('EVALUATOR_REFERENCE_PUBLICATION_TERMINAL', 'request is terminal'); publishInto(request, input, input.source); finalize(request); return { kind: request.state, capabilityId: input.capabilityId }; }

  function claimCacheEntry(input) {
    available(); if (profile.cache.kind !== 'selected') fail('EVALUATOR_REFERENCE_CACHE_ABSENT', 'profile selects no cache');
    if (BigInt([...cache.values()].filter((entry) => entry.state !== 'retired').length) >= maxCache) return { kind: 'pressure', code: profile.cache.pressureStatus };
    const previous = cache.get(input.entryId); const generation = dec(input.generation);
    if (previous && (previous.state !== 'retired' || generation <= previous.generation)) fail('EVALUATOR_REFERENCE_CACHE_GENERATION', 'cache generation must advance after retirement');
    const keyIdentity = cacheIdentity(input.keyFacts);
    const entry = { id: input.entryId, generation, generationText: input.generation, hash: input.hash, keyFacts: freeze(input.keyFacts), keyIdentity, state: 'claimed', results: null, protected: false, waiters: new Set() };
    cache.set(entry.id, entry); const bucket = cacheBuckets.get(entry.hash) ?? []; if (!bucket.includes(entry.id)) bucket.push(entry.id); cacheBuckets.set(entry.hash, bucket);
    return { kind: 'claimed', entryId: entry.id, keyIdentity };
  }
  function attachCacheWaiter(input) {
    available(); if (profile.cache.kind !== 'selected') fail('EVALUATOR_REFERENCE_CACHE_ABSENT', 'profile selects no cache');
    const entry = cache.get(input.entryId);
    if (!entry || entry.state !== 'claimed' || entry.generationText !== input.generation || !sameCanonical(entry.keyFacts, input.keyFacts, 'cache waiter key')) fail('EVALUATOR_REFERENCE_CACHE_WAITER', 'cache waiter target is not the exact claimed entry');
    if (entry.waiters.has(input.waiterId)) fail('EVALUATOR_REFERENCE_CACHE_WAITER', 'duplicate cache waiter');
    if (BigInt(entry.waiters.size) >= dec(profile.cache.maxWaiters)) return { kind: 'pressure', code: profile.cache.pressureStatus };
    entry.waiters.add(input.waiterId); return { kind: 'attached', waiterId: input.waiterId, entryId: entry.id };
  }
  function cancelCacheWaiter(input) {
    available(); const entry = cache.get(input.entryId);
    if (!entry || entry.generationText !== input.generation || !entry.waiters.delete(input.waiterId)) fail('EVALUATOR_REFERENCE_CACHE_WAITER', 'unknown cache waiter');
    return { kind: 'cancelled', remainingWaiters: entry.waiters.size };
  }
  function publishCacheEntry(input) {
    available(); const entry = cache.get(input.entryId); if (!entry || entry.state !== 'claimed' || entry.generationText !== input.generation) fail('EVALUATOR_REFERENCE_CACHE', 'cache generation is not claimed');
    const expected = entry.keyFacts['capability-set'];
    if (!Array.isArray(expected) || expected.length === 0 || new Set(expected).size !== expected.length || expected.some((id) => !capabilityRules.has(id))) fail('EVALUATOR_REFERENCE_CACHE_PARTIAL', 'cache key has an invalid capability set');
    const ids = new Set(input.results.map((result) => result.capabilityId));
    if (input.results.length !== expected.length || ids.size !== expected.length || expected.some((id) => !ids.has(id))) fail('EVALUATOR_REFERENCE_CACHE_PARTIAL', 'cache entry must contain exactly the keyed capability result set');
    const waitersReleased = entry.waiters.size; entry.waiters.clear(); entry.results = input.results.map((result) => freeze(result)); entry.state = 'ready';
    return { kind: 'ready', entryId: entry.id, waitersReleased };
  }
  function failCacheEntry(input) {
    available(); const entry = cache.get(input.entryId); if (!entry || entry.state !== 'claimed' || entry.generationText !== input.generation) fail('EVALUATOR_REFERENCE_CACHE', 'cache generation is not claimed');
    const waitersReleased = entry.waiters.size; entry.waiters.clear(); entry.state = 'failed'; return { kind: 'failed', entryId: entry.id, waitersReleased };
  }
  function lookupCache(input) {
    available(); const identity = cacheIdentity(input.keyFacts);
    for (const id of cacheBuckets.get(input.hash) ?? []) {
      const entry = cache.get(id);
      const matches = entry && sameCanonical(entry.keyFacts, input.keyFacts, 'cache full key');
      if (entry?.state === 'ready' && (mutations.skipCacheFullKeyCheck === true || matches)) return { kind: 'hit', entryId: entry.id, generation: entry.generationText, keyIdentity: identity, results: canonicalClone(entry.results) };
    }
    return { kind: 'miss', code: 'evaluator-cache-miss', keyIdentity: identity };
  }
  function protectCacheEntry(input) { available(); const entry = cache.get(input.entryId); if (!entry || entry.state === 'retired') fail('EVALUATOR_REFERENCE_CACHE', 'cache entry is absent'); entry.protected = input.protected === true; return { kind: 'updated', protected: entry.protected }; }
  function retireCacheEntry(input) {
    available(); const entry = cache.get(input.entryId); if (!entry || entry.state === 'retired') fail('EVALUATOR_REFERENCE_CACHE', 'cache entry is absent');
    if (entry.protected) { if (entry.state === 'ready') entry.state = 'retiring'; return { kind: 'pending', code: 'cache-entry-protected' }; }
    entry.waiters.clear(); entry.state = 'retired'; return { kind: 'retired', entryId: entry.id };
  }
  function invalidateCacheFact(input) {
    available(); if (!profile.cache.keyFacts.includes(input.fact)) fail('EVALUATOR_REFERENCE_CACHE_KEY', 'fact is not part of cache identity'); let retired = 0;
    for (const entry of cache.values()) if (entry.state !== 'retired' && !sameCanonical(entry.keyFacts[input.fact], input.nextValue, 'cache invalidation fact')) {
      if (entry.protected) entry.state = 'retiring'; else { entry.waiters.clear(); entry.state = 'retired'; retired += 1; }
    }
    return { kind: 'invalidated', retired };
  }
  function completeFromCache(input) {
    available(); const request = find(input); const active = current(input.slotId); const entry = cache.get(input.entryId);
    if (terminal(request.state) || active !== request) fail('EVALUATOR_REFERENCE_CACHE_STALE', 'cache completion target is stale');
    if (!entry || entry.state !== 'ready') fail('EVALUATOR_REFERENCE_CACHE', 'cache entry is not ready');
    if (!sameCanonical(entry.keyFacts, request.inputKey, 'cache completion key')) {
      quarantineEvidence('cache-key-inconsistency', { requestId: request.id, entryId: input.entryId });
      endRequest(request, 'failed', 'cache-key-inconsistency');
      fail('EVALUATOR_REFERENCE_CACHE_KEY_QUARANTINE', 'cache completion key disagrees with the admitted request');
    }
    for (const result of entry.results) publishInto(request, result, 'cache'); finalize(request); return { kind: request.state, source: 'cache', entryId: entry.id };
  }

  function classifyReuse(input) {
    available();
    const rule = reuseRules.get(input.classId); if (!rule) fail('EVALUATOR_REFERENCE_REUSE', 'unknown reuse class');
    if (typeof input.keyValid !== 'boolean') fail('EVALUATOR_REFERENCE_REUSE', 'reuse key validity must be boolean');
    reuseClassifications += 1n;
    const action = rule.disposition === 'retain-if-key-valid' ? (input.keyValid ? 'retain' : 'invalidate') : rule.disposition;
    return { kind: 'classification', classId: input.classId, disposition: rule.disposition, action };
  }
  function applyRerootAction(input) {
    available(); if (input.admission?.approved !== true) return { kind: 'pressure', code: 'reroot-action-capacity' };
    textId(input.admission.token, 'reroot admission token');
    const operationId = textId(input.operationId, 'reroot operationId');
    if (rerootOps.has(operationId)) fail('EVALUATOR_REFERENCE_REUSE_ACTION', 'duplicate reroot operation');
    const classification = classifyReuse(input); if (classification.action !== input.action) fail('EVALUATOR_REFERENCE_REUSE_ACTION', 'reroot action disagrees with classification');
    if (input.action === 'invalidate' && input.classId === 'evaluator.request') for (const request of requests.values()) if (!terminal(request.state)) endRequest(request, 'stale', 'reroot-invalidate');
    if (input.action === 'invalidate' && input.classId === 'evaluator.cache') for (const entry of cache.values()) if (entry.state !== 'retired') { entry.waiters.clear(); entry.state = entry.protected ? 'retiring' : 'retired'; }
    rerootOps.add(operationId); return { kind: 'terminal', operationId, action: input.action };
  }
  function applyAdvanceFacts(input) {
    available(); const epoch = dec(input.newRootEpoch); const before = reuseClassifications;
    for (const fact of input.retainedValidity) {
      if (!reuseRules.has(fact.classId) || typeof fact.keyValid !== 'boolean') fail('EVALUATOR_REFERENCE_ADVANCE_FACT', 'advance retained-validity fact is not declared by this evaluator profile');
    }
    for (const request of requests.values()) if (!terminal(request.state) && !request.rootIndependent && request.rootEpoch !== epoch) endRequest(request, 'stale', 'root-advance');
    const retained = input.retainedValidity.map((fact) => ({ classId: fact.classId, keyValid: fact.keyValid, usable: fact.keyValid }));
    if (reuseClassifications !== before) fail('EVALUATOR_REFERENCE_ADVANCE_RECLASSIFICATION', 'advance reclassified reroot reuse');
    return { kind: 'applied', newRootEpoch: input.newRootEpoch, retained, reuseClassifications: reuseClassifications.toString() };
  }
  function commitMutableState(input) {
    available(); if (profile.mutableState.kind !== 'selected') fail('EVALUATOR_REFERENCE_MUTABLE_STATE', 'profile has no mutable state'); const batch = batches.get(input.batchId); if (!batch || !['continuation','executed'].includes(batch.state)) fail('EVALUATOR_REFERENCE_MUTABLE_STATE', 'mutable update needs active batch');
    textId(input.updateIdentity, 'mutable updateIdentity');
    if (input.certain !== true) { quarantineEvidence('uncertain-mutable-state-update', { batchId: input.batchId }); for (const ref of batch.refs) if (!terminal(find(ref).state)) endRequest(find(ref), 'failed', 'uncertain-mutable-state-update'); finishBatch(batch); fail('EVALUATOR_REFERENCE_MUTABLE_STATE_QUARANTINE', 'uncertain mutable update quarantined evidence'); }
    const expected = dec(input.expectedGeneration), next = dec(input.nextGeneration); if (expected !== mutableGeneration || next <= expected) fail('EVALUATOR_REFERENCE_MUTABLE_STATE_ORDER', 'mutable generation must advance monotonically from the current generation'); mutableGeneration = next; return { kind: 'committed', generation: input.nextGeneration, updateIdentity: input.updateIdentity };
  }

  function assertAccounting() {
    const admitted = requests.size, terminalCount = [...requests.values()].filter((r) => terminal(r.state)).length;
    const requestStates = ['queued', 'batched', 'executing', 'publishing', 'ready', 'failed', 'cancelled', 'stale'];
    const stateCounts = Object.fromEntries(requestStates.map((state) => [state, [...requests.values()].filter((request) => request.state === state).length]));
    return {
      admitted, live: admitted - terminalCount, terminal: terminalCount, stateCounts,
      heldInputLeases: [...requests.values()].filter((r) => r.inputLease === 'held').length,
      liveResultSlots: [...requests.values()].filter((r) => r.resultDisposition === 'claimed').length,
      activeWorkspaces: [...workspaces.values()].filter((w) => w.state === 'acquired').length,
      activeWorkspaceBytes: activeWorkspaceBytes.toString(), workspaceHighWaterBytes: workspaceHighWaterBytes.toString(),
      liveBatches: [...batches.values()].filter((b) => b.state !== 'terminal').length,
      cacheEntries: [...cache.values()].filter((e) => e.state !== 'retired').length,
      cacheWaiters: [...cache.values()].reduce((sum, entry) => sum + entry.waiters.size, 0),
    };
  }
  function snapshot() { return { selection: removed ? 'removed' : profile.id, quarantine: quarantine ? canonicalClone(quarantine) : null, evidenceValid: quarantine === null, reuseClassifications: reuseClassifications.toString(), mutableStateGeneration: mutableGeneration.toString(), accounting: assertAccounting(), currentSlots: [...currentBySlot].map(([slotId, request]) => ({ slotId, request })) }; }
  function cleanup() {
    const state = assertAccounting(); const protectedCache = [...cache.values()].filter((e) => e.state !== 'retired' && e.protected).length;
    if (state.live || state.liveBatches || state.activeWorkspaces || protectedCache) return { kind: 'pending', pendingRequests: state.live, liveBatches: state.liveBatches, activeWorkspaces: state.activeWorkspaces, protectedCache, evidenceValid: quarantine === null };
    for (const request of requests.values()) { releaseInput(request); request.resultDisposition = 'released'; request.waiters.clear(); request.waiterOutcomes.clear(); }
    for (const entry of cache.values()) { entry.waiters.clear(); entry.state = 'retired'; }
    for (const lease of workspaces.values()) { if (lease.state === 'acquired') releaseWorkspace(lease.id); else lease.state = 'released'; }
    const dispositions = profile.cleanup.classes.map((classId) => ({ classId, disposition: 'released' }));
    requests.clear(); currentBySlot.clear(); batches.clear(); workspaces.clear(); cache.clear(); cacheBuckets.clear(); rerootOps.clear();
    return { kind: quarantine ? 'quarantined' : 'complete', evidenceValid: quarantine === null, quarantine: quarantine ? canonicalClone(quarantine) : null, dispositions, runtimeResidue: 0 };
  }
  function removeEvaluator(input = { retainEvidence: false }) {
    const state = assertAccounting(); if (state.live || state.liveBatches || state.activeWorkspaces) fail('EVALUATOR_REFERENCE_REMOVE', 'cannot remove evaluator with live state');
    const result = cleanup(); if (result.kind === 'pending') fail('EVALUATOR_REFERENCE_REMOVE', 'cleanup pending'); removed = true;
    return { kind: 'removed', selection: 'absent', runtimeResidue: 0, retainedEvidence: input.retainEvidence, evidenceValid: quarantine === null };
  }
  function removeCapability(input) {
    available();
    if (profile.capabilities.length !== 1 || profile.capabilities[0].id !== input.capabilityId) fail('EVALUATOR_REFERENCE_CAPABILITY_REMOVE', 'in-place partial capability removal requires a newly normalized evaluator profile');
    const result = removeEvaluator({ retainEvidence: input.retainEvidence === true });
    return { ...result, kind: 'capability-removed', capabilityId: input.capabilityId };
  }

  return Object.freeze({
    selection: profile.id, profile,
    admitRequest, attachWaiter, cancelWaiter, observeRequest, cancelRequest, failRequest,
    formBatch, executeBatch, resumeBatch, failBatch, scatterBatch, publishCapability,
    claimCacheEntry, attachCacheWaiter, cancelCacheWaiter, publishCacheEntry, failCacheEntry, lookupCache, protectCacheEntry, retireCacheEntry, invalidateCacheFact, completeFromCache,
    classifyReuse, applyRerootAction, applyAdvanceFacts, commitMutableState,
    assertAccounting, snapshot, cleanup, removeEvaluator, removeCapability,
  });
}

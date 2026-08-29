import { canonicalClone, canonicalIdentity, frozenCanonicalClone } from './canonical.mjs';
import { fail } from './errors.mjs';

const freeze = (value, label='Evaluator value') => frozenCanonicalClone(value, label);
const dec = (value, label='decimal') => {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) fail('EVALUATOR_REFERENCE_DECIMAL', `${label} must be a canonical decimal string`);
  return BigInt(value);
};
const terminal = (state) => ['ready', 'failed', 'cancelled', 'stale'].includes(state);
const refKey = ({ slotId, requestId, incarnation }) => `${slotId}\0${requestId}\0${incarnation}`;
const requestKey = (slotId, requestId, incarnation) => `${slotId}\0${requestId}\0${incarnation}`;
const same = (left, right) => {
  const a = canonicalIdentity(left); const b = canonicalIdentity(right);
  return a.sha256 === b.sha256 && a.byteLength === b.byteLength;
};

function absentOracle() {
  let removed = false;
  const reject = () => fail('EVALUATOR_REFERENCE_ABSENT', 'evaluator selection is absent');
  return Object.freeze({
    selection: 'absent', admitRequest: reject, formBatch: reject, claimCacheEntry: reject, classifyReuse: reject,
    snapshot: () => ({ selection: removed ? 'removed' : 'absent', requests: 0, batches: 0, workspaces: 0, cacheEntries: 0, quarantine: null, evidenceValid: true }),
    cleanup: () => ({ kind: 'complete', selection: 'absent', runtimeResidue: 0, evidenceValid: true }),
    removeEvaluator: () => { removed = true; return { kind: 'removed', selection: 'absent', runtimeResidue: 0 }; },
  });
}

export function createEvaluatorOracle({ profile = null, admission = {}, mutations = {} } = {}) {
  if (profile === null) return absentOracle();

  const capabilityRules = new Map(profile.request.capabilities.map((entry) => [entry.capability, entry]));
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
    return request;
  };
  const current = (slotId) => {
    const key = currentBySlot.get(slotId);
    return key === undefined ? null : requests.get(key) ?? null;
  };
  const releaseInput = (request) => { request.inputLease = 'released'; };
  const endRequest = (request, state, reason) => {
    if (terminal(request.state)) return;
    request.state = state; request.reason = reason; request.resultDisposition = state; request.waiters.clear();
    const batch = request.batchId === null ? null : batches.get(request.batchId);
    if (!batch || !['formed', 'continuation', 'executed'].includes(batch.state)) releaseInput(request);
  };
  const cacheIdentity = (facts) => {
    if (profile.cache.kind !== 'selected') fail('EVALUATOR_REFERENCE_CACHE_ABSENT', 'profile selects no cache');
    for (const fact of profile.cache.keyFacts) if (facts?.[fact] === undefined || facts[fact] === null) fail('EVALUATOR_REFERENCE_CACHE_KEY', `missing cache fact ${fact}`);
    if (Object.keys(facts).length !== profile.cache.keyFacts.length) fail('EVALUATOR_REFERENCE_CACHE_KEY', 'cache key contains undeclared facts');
    return canonicalIdentity(facts, 'Evaluator cache key');
  };

  function admitRequest(input) {
    available();
    if (input.admission?.approved !== true || BigInt([...requests.values()].filter((r) => !terminal(r.state)).length) >= maxActive) {
      return { kind: 'pressure', code: 'evaluator-request-capacity' };
    }
    const incarnation = dec(input.incarnation, 'incarnation');
    const old = current(input.slotId);
    if (old && (!terminal(old.state) || incarnation <= old.incarnation)) fail('EVALUATOR_REFERENCE_INCARNATION', 'slot incarnation must supersede a terminal predecessor');
    const key = requestKey(input.slotId, input.requestId, input.incarnation);
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
    const request = {
      key, slotId: input.slotId, id: input.requestId, incarnation, incarnationText: input.incarnation,
      purpose: input.purpose, rootEpoch: dec(input.rootEpoch), workEpoch: dec(input.workEpoch), rootIndependent: input.rootIndependent === true,
      inputKey: freeze(input.inputKey), cacheKeyIdentity: profile.cache.kind === 'selected' ? cacheIdentity(input.inputKey) : null,
      graphReference: freeze(input.graphReference), compatibilityKey: freeze(input.compatibilityKey), coalescingKey: freeze(input.coalescingKey),
      state: 'queued', reason: null, batchId: null, waiters: new Set(), inputLease: 'held', resultDisposition: 'claimed', capabilities,
    };
    requests.set(key, request); currentBySlot.set(input.slotId, key);
    return { kind: 'queued', slotId: input.slotId, requestId: input.requestId, incarnation: input.incarnation };
  }

  function attachWaiter(input) {
    available(); const request = find(input);
    if (terminal(request.state) || !same(input.coalescingKey, request.coalescingKey) || input.purpose !== request.purpose || dec(input.rootEpoch) !== request.rootEpoch) {
      fail('EVALUATOR_REFERENCE_COALESCE', 'waiter does not match authoritative request');
    }
    if (request.waiters.has(input.waiterId)) fail('EVALUATOR_REFERENCE_WAITER', 'duplicate waiter');
    if (BigInt(request.waiters.size) >= dec(profile.request.maxWaiters)) return { kind: 'pressure', code: 'evaluator-request-capacity' };
    request.waiters.add(input.waiterId); return { kind: 'attached', waiterId: input.waiterId };
  }
  function cancelWaiter(input) {
    available(); const request = find(input);
    if (!request.waiters.delete(input.waiterId)) fail('EVALUATOR_REFERENCE_WAITER', 'unknown waiter');
    return { kind: 'cancelled', remainingWaiters: request.waiters.size };
  }
  function observeRequest(input) {
    const request = find(input);
    return {
      slotId: request.slotId, requestId: request.id, incarnation: request.incarnationText, state: request.state,
      resultDisposition: request.resultDisposition, inputLease: request.inputLease,
      capabilities: [...request.capabilities].map(([id, value]) => ({ id, state: value.state, source: value.source, payload: canonicalClone(value.payload), validity: canonicalClone(value.validity) })),
      waiters: request.waiters.size,
    };
  }
  function cancelRequest(input) { available(); const request = find(input); if (request.state === 'ready') return { kind: 'already-ready', requestId: request.id, incarnation: request.incarnationText }; endRequest(request, 'cancelled', input.reason); return { kind: 'cancelled', requestId: request.id, incarnation: request.incarnationText }; }
  function failRequest(input) { available(); const request = find(input); endRequest(request, 'failed', input.code); return { kind: 'failed', requestId: request.id, incarnation: request.incarnationText }; }

  const workspaceRule = (scope) => profile.workspaces.find((entry) => entry.scope === scope) ?? null;
  function acquireWorkspace(scope, fact, owner) {
    const rule = workspaceRule(scope);
    if (!rule) { if (fact !== null) fail('EVALUATOR_REFERENCE_WORKSPACE', `profile has no ${scope} workspace`); return null; }
    if (!fact || fact.approved !== true) return { pressure: true, code: 'evaluator-workspace-capacity' };
    if (dec(fact.bytes) > dec(rule.maxBytes)) fail('EVALUATOR_REFERENCE_WORKSPACE', 'workspace exceeds normalized bound');
    if (workspaces.get(fact.leaseId)?.state === 'acquired') return { pressure: true, code: 'evaluator-workspace-capacity' };
    const lease = { id: fact.leaseId, scope, owner, state: 'acquired' }; workspaces.set(lease.id, lease); return lease;
  }
  const releaseWorkspace = (id) => { if (id !== null) { const lease = workspaces.get(id); if (!lease || lease.state !== 'acquired') fail('EVALUATOR_REFERENCE_WORKSPACE_IMBALANCE', 'workspace lease is not live'); lease.state = 'released'; } };

  function formBatch(input) {
    available();
    if (batches.has(input.batchId) || input.itemRefs.length === 0 || BigInt(input.itemRefs.length) > dec(profile.batching.maximumItems)) fail('EVALUATOR_REFERENCE_BATCH', 'invalid batch identity or size');
    if (BigInt(input.itemRefs.length) < dec(profile.batching.minimumReadyItems) && input.serviceOpportunity !== true) return { kind: 'pending', code: 'evaluator-batch-pending' };
    const refs = input.itemRefs.map((ref) => freeze(ref));
    const expected = canonicalIdentity(input.compatibilityKey).sha256;
    if (new Set(refs.map(refKey)).size !== refs.length) fail('EVALUATOR_REFERENCE_BATCH', 'duplicate batch item');
    for (const ref of refs) { const request = find(ref); if (request.state !== 'queued' || canonicalIdentity(request.compatibilityKey).sha256 !== expected) fail('EVALUATOR_REFERENCE_BATCH_INCOMPATIBLE', 'batch item is not queued/compatible'); }
    if (profile.batching.semantics === 'batch-sensitive' ? input.batchContext === null : input.batchContext !== null) fail('EVALUATOR_REFERENCE_BATCH_CONTEXT', 'batch context does not match normalized semantics');
    const workspace = acquireWorkspace('per-batch', input.workspaceAdmission, input.batchId); if (workspace?.pressure) return { kind: 'pressure', code: workspace.code };
    const subject = profile.batching.semantics === 'batch-sensitive'
      ? { profile: profile.id, compatibilityKey: input.compatibilityKey, batchContext: input.batchContext, itemOrder: refs, paddingCount: input.paddingCount }
      : { profile: profile.id, compatibilityKey: input.compatibilityKey };
    const batch = { id: input.batchId, state: 'formed', refs, refSet: new Set(refs.map(refKey)), semanticIdentity: canonicalIdentity(subject), workspace: workspace?.id ?? null, continuationWorkspace: null, continuationId: null, resumes: 0n, results: new Map(), failed: new Set() };
    batches.set(batch.id, batch); for (const ref of refs) { const request = find(ref); request.state = 'batched'; request.batchId = batch.id; }
    return { kind: 'formed', batchId: batch.id, semanticIdentity: batch.semanticIdentity, items: refs.length, paddingCount: input.paddingCount };
  }
  function normalizeResults(batch, results) {
    const out = new Map();
    for (const item of results) {
      const key = refKey(item.ref); if (!batch.refSet.has(key) || out.has(key) || item.capabilities.length === 0) fail('EVALUATOR_REFERENCE_BATCH_RESULT', 'result does not identify exactly one active batch item');
      const seen = new Set();
      for (const result of item.capabilities) { if (!capabilityRules.has(result.capabilityId) || seen.has(result.capabilityId)) fail('EVALUATOR_REFERENCE_CAPABILITY_RESULT', 'invalid/duplicate capability result'); seen.add(result.capabilityId); }
      out.set(key, { ref: freeze(item.ref), capabilities: item.capabilities.map((result) => freeze(result)) });
    }
    return out;
  }
  function executeBatch(input) {
    available(); const batch = batches.get(input.batchId); if (!batch || batch.state !== 'formed') fail('EVALUATOR_REFERENCE_BATCH', 'batch is not formed');
    const results = normalizeResults(batch, input.results);
    if (input.continuation.kind === 'pending') {
      if (profile.batching.continuation.kind !== 'bounded' || !input.continuation.progressToken) fail('EVALUATOR_REFERENCE_CONTINUATION', 'invalid continuation');
      const workspace = acquireWorkspace('per-continuation', input.continuation.workspaceAdmission, batch.id); if (workspace?.pressure) return { kind: 'pressure', code: workspace.code };
      batch.results = results; batch.continuationWorkspace = workspace?.id ?? null; batch.continuationId = `${batch.id}:continuation`; batch.state = 'continuation';
      return { kind: 'pending', continuationId: batch.continuationId, progressToken: input.continuation.progressToken };
    }
    if (input.continuation.kind !== 'complete') fail('EVALUATOR_REFERENCE_CONTINUATION', 'invalid continuation completion');
    batch.results = results; batch.state = 'executed'; return { kind: 'executed', batchId: batch.id };
  }
  function resumeBatch(input) {
    available(); const batch = batches.get(input.batchId); if (!batch || batch.state !== 'continuation' || batch.continuationId !== input.continuationId) fail('EVALUATOR_REFERENCE_CONTINUATION', 'inactive continuation');
    if (batch.resumes >= dec(profile.batching.continuation.maxResumes)) fail('EVALUATOR_REFERENCE_CONTINUATION', 'continuation resume bound exhausted');
    batch.resumes += 1n; for (const [key, value] of normalizeResults(batch, input.results)) batch.results.set(key, value);
    if (input.continuation.kind === 'pending') { if (!input.continuation.progressToken) fail('EVALUATOR_REFERENCE_CONTINUATION', 'pending continuation needs progress token'); return { kind: 'pending', continuationId: batch.continuationId, resumeCount: batch.resumes.toString() }; }
    if (input.continuation.kind !== 'complete') fail('EVALUATOR_REFERENCE_CONTINUATION', 'invalid continuation completion');
    batch.state = 'executed'; return { kind: 'executed', batchId: batch.id, resumeCount: batch.resumes.toString() };
  }
  function finishBatch(batch) {
    if (batch.state === 'terminal') return; batch.state = 'terminal'; releaseWorkspace(batch.workspace); releaseWorkspace(batch.continuationWorkspace);
    for (const ref of batch.refs) { const request = find(ref); if (terminal(request.state) && request.inputLease === 'held') releaseInput(request); }
  }
  function failBatch(input) {
    available(); const batch = batches.get(input.batchId); if (!batch || batch.state === 'terminal') fail('EVALUATOR_REFERENCE_BATCH', 'batch cannot fail');
    const affected = new Set(input.affectedItemRefs.map(refKey));
    if (profile.batching.failureDomain !== 'item-independent' && affected.size !== batch.refSet.size) fail('EVALUATOR_REFERENCE_BATCH_FAIL', 'whole-batch failure must affect every item');
    for (const ref of batch.refs) if (affected.has(refKey(ref))) { batch.failed.add(refKey(ref)); endRequest(find(ref), 'failed', input.code); }
    if (profile.batching.failureDomain !== 'item-independent') finishBatch(batch);
    return { kind: profile.batching.failureDomain === 'item-independent' ? 'item-failure' : 'batch-failure', affected: affected.size };
  }
  function publishInto(request, result, source) {
    const capability = request.capabilities.get(result.capabilityId); if (!capability) fail('EVALUATOR_REFERENCE_CAPABILITY', 'capability was not requested');
    if (capability.state === 'ready') {
      if (!same({ payload: capability.payload, validity: capability.validity }, { payload: result.payload, validity: result.validity })) { quarantineEvidence('conflicting-publication', { requestId: request.id, capability: result.capabilityId }); endRequest(request, 'failed', 'conflicting-publication'); fail('EVALUATOR_REFERENCE_PUBLICATION_CONFLICT', 'conflicting publication'); }
      return;
    }
    capability.state = 'ready'; capability.source = source; capability.payload = freeze(result.payload); capability.validity = freeze(result.validity);
  }
  function finalize(request) {
    if (terminal(request.state)) return;
    const selected = [...request.capabilities.values()]; const required = selected.filter((capability) => capability.requirement === 'required');
    const requiredReady = required.filter((capability) => capability.state === 'ready').length;
    const complete = mutations.allowIncompleteReady === true ? requiredReady > 0 : requiredReady === required.length;
    const othersTerminal = selected.filter((capability) => capability.requirement !== 'required').every((capability) => ['ready','failed','cancelled','detached'].includes(capability.state));
    if (complete && othersTerminal) { request.state = 'ready'; request.resultDisposition = 'ready'; request.waiters.clear(); releaseInput(request); }
  }
  function scatterBatch(input) {
    available(); const batch = batches.get(input.batchId); if (!batch || batch.state !== 'executed') fail('EVALUATOR_REFERENCE_BATCH', 'batch is not executed'); const dispositions = [];
    for (const ref of batch.refs) {
      const key = refKey(ref); if (batch.failed.has(key)) { dispositions.push({ ref: canonicalClone(ref), kind: 'failed' }); continue; }
      const result = batch.results.get(key); if (!result) { const request = find(ref); if (!terminal(request.state)) endRequest(request, 'failed', 'evaluator-output-missing'); dispositions.push({ ref: canonicalClone(ref), kind: 'missing-failed' }); continue; }
      const active = current(ref.slotId); const incarnationMatches = active && active.id === ref.requestId && active.incarnationText === ref.incarnation;
      if (mutations.skipScatterIncarnationCheck !== true && !incarnationMatches) { dispositions.push({ ref: canonicalClone(ref), kind: 'stale-rejected' }); continue; }
      const target = mutations.skipScatterIncarnationCheck === true ? active : find(ref);
      if (!target || terminal(target.state)) { dispositions.push({ ref: canonicalClone(ref), kind: 'terminal-rejected' }); continue; }
      for (const capability of result.capabilities) publishInto(target, capability, 'fresh-execution'); finalize(target);
      if (!terminal(target.state)) { target.state = 'queued'; target.batchId = null; }
      dispositions.push({ ref: canonicalClone(ref), kind: 'scattered', targetRequestId: target.id, targetIncarnation: target.incarnationText });
    }
    finishBatch(batch); return { kind: 'scattered', dispositions };
  }
  function publishCapability(input) { available(); const request = find(input); if (terminal(request.state)) fail('EVALUATOR_REFERENCE_PUBLICATION_TERMINAL', 'request is terminal'); publishInto(request, input, input.source); finalize(request); return { kind: request.state, capabilityId: input.capabilityId }; }

  function claimCacheEntry(input) {
    available(); if (profile.cache.kind !== 'selected') fail('EVALUATOR_REFERENCE_CACHE_ABSENT', 'profile selects no cache');
    if (BigInt([...cache.values()].filter((entry) => entry.state !== 'retired').length) >= maxCache) return { kind: 'pressure', code: profile.cache.pressureStatus };
    const previous = cache.get(input.entryId); const generation = dec(input.generation);
    if (previous && (previous.state !== 'retired' || generation <= previous.generation)) fail('EVALUATOR_REFERENCE_CACHE_GENERATION', 'cache generation must advance after retirement');
    const keyIdentity = cacheIdentity(input.keyFacts); const entry = { id: input.entryId, generation, generationText: input.generation, hash: input.hash, keyFacts: freeze(input.keyFacts), keyIdentity, state: 'claimed', results: null, protected: false };
    cache.set(entry.id, entry); const bucket = cacheBuckets.get(entry.hash) ?? []; if (!bucket.includes(entry.id)) bucket.push(entry.id); cacheBuckets.set(entry.hash, bucket);
    return { kind: 'claimed', entryId: entry.id, keyIdentity };
  }
  function publishCacheEntry(input) {
    available(); const entry = cache.get(input.entryId); if (!entry || entry.state !== 'claimed' || entry.generationText !== input.generation) fail('EVALUATOR_REFERENCE_CACHE', 'cache generation is not claimed');
    const ids = new Set(input.results.map((result) => result.capabilityId)); if (ids.size !== capabilityRules.size || [...ids].some((id) => !capabilityRules.has(id))) fail('EVALUATOR_REFERENCE_CACHE_PARTIAL', 'fixture cache entry must contain a complete result set');
    entry.results = input.results.map((result) => freeze(result)); entry.state = 'ready'; return { kind: 'ready', entryId: entry.id };
  }
  function failCacheEntry(input) { available(); const entry = cache.get(input.entryId); if (!entry || entry.state !== 'claimed' || entry.generationText !== input.generation) fail('EVALUATOR_REFERENCE_CACHE', 'cache generation is not claimed'); entry.state = 'failed'; return { kind: 'failed', entryId: entry.id }; }
  function lookupCache(input) {
    available(); const identity = cacheIdentity(input.keyFacts);
    for (const id of cacheBuckets.get(input.hash) ?? []) { const entry = cache.get(id); const matches = entry && entry.keyIdentity.sha256 === identity.sha256 && entry.keyIdentity.byteLength === identity.byteLength; if (entry?.state === 'ready' && (mutations.skipCacheFullKeyCheck === true || matches)) return { kind: 'hit', entryId: entry.id, generation: entry.generationText, keyIdentity: identity, results: canonicalClone(entry.results) }; }
    return { kind: 'miss', code: 'evaluator-cache-miss', keyIdentity: identity };
  }
  function protectCacheEntry(input) { available(); const entry = cache.get(input.entryId); if (!entry || entry.state === 'retired') fail('EVALUATOR_REFERENCE_CACHE', 'cache entry is absent'); entry.protected = input.protected === true; return { kind: 'updated', protected: entry.protected }; }
  function retireCacheEntry(input) { available(); const entry = cache.get(input.entryId); if (!entry || entry.state === 'retired') fail('EVALUATOR_REFERENCE_CACHE', 'cache entry is absent'); if (entry.protected) { if (entry.state === 'ready') entry.state = 'retiring'; return { kind: 'pending', code: 'cache-entry-protected' }; } entry.state = 'retired'; return { kind: 'retired', entryId: entry.id }; }
  function invalidateCacheFact(input) {
    available(); if (!profile.cache.keyFacts.includes(input.fact)) fail('EVALUATOR_REFERENCE_CACHE_KEY', 'fact is not part of cache identity'); let retired = 0;
    for (const entry of cache.values()) if (entry.state !== 'retired' && !same(entry.keyFacts[input.fact], input.nextValue)) { if (entry.protected) entry.state = 'retiring'; else { entry.state = 'retired'; retired += 1; } }
    return { kind: 'invalidated', retired };
  }
  function completeFromCache(input) {
    available(); const request = find(input); const active = current(input.slotId); const entry = cache.get(input.entryId);
    if (terminal(request.state) || active !== request) fail('EVALUATOR_REFERENCE_CACHE_STALE', 'cache completion target is stale');
    if (!entry || entry.state !== 'ready' || !same(entry.keyIdentity, request.cacheKeyIdentity)) fail('EVALUATOR_REFERENCE_CACHE_KEY', 'cache entry does not match admitted request');
    for (const result of entry.results) publishInto(request, result, 'cache'); finalize(request); return { kind: request.state, source: 'cache', entryId: entry.id };
  }

  function classifyReuse(input) {
    available(); const rule = reuseRules.get(input.classId); if (!rule) fail('EVALUATOR_REFERENCE_REUSE', 'unknown reuse class'); reuseClassifications += 1n;
    const action = rule.disposition === 'retain-if-key-valid' ? (input.keyValid ? 'retain' : 'invalidate') : rule.disposition;
    return { kind: 'classification', classId: input.classId, disposition: rule.disposition, action };
  }
  function applyRerootAction(input) {
    available(); if (input.admission?.approved !== true) return { kind: 'pressure', code: 'reroot-action-capacity' };
    const classification = classifyReuse(input); if (classification.action !== input.action || rerootOps.has(input.operationId)) fail('EVALUATOR_REFERENCE_REUSE_ACTION', 'invalid/duplicate reroot action');
    if (input.action === 'invalidate' && input.classId === 'evaluator.request') for (const request of requests.values()) if (!terminal(request.state)) endRequest(request, 'stale', 'reroot-invalidate');
    if (input.action === 'invalidate' && input.classId === 'evaluator.cache') for (const entry of cache.values()) if (entry.state !== 'retired') entry.state = entry.protected ? 'retiring' : 'retired';
    rerootOps.add(input.operationId); return { kind: 'terminal', operationId: input.operationId, action: input.action };
  }
  function applyAdvanceFacts(input) {
    available(); const epoch = dec(input.newRootEpoch); const before = reuseClassifications;
    for (const request of requests.values()) if (!terminal(request.state) && !request.rootIndependent && request.rootEpoch !== epoch) endRequest(request, 'stale', 'root-advance');
    const retained = input.retainedValidity.map((fact) => ({ classId: fact.classId, keyValid: fact.keyValid === true, usable: fact.keyValid === true }));
    if (reuseClassifications !== before) fail('EVALUATOR_REFERENCE_ADVANCE_RECLASSIFICATION', 'advance reclassified reroot reuse');
    return { kind: 'applied', newRootEpoch: input.newRootEpoch, retained, reuseClassifications: reuseClassifications.toString() };
  }
  function commitMutableState(input) {
    available(); if (profile.mutableState.kind !== 'selected') fail('EVALUATOR_REFERENCE_MUTABLE_STATE', 'profile has no mutable state'); const batch = batches.get(input.batchId); if (!batch || !['continuation','executed'].includes(batch.state)) fail('EVALUATOR_REFERENCE_MUTABLE_STATE', 'mutable update needs active batch');
    if (input.certain !== true) { quarantineEvidence('uncertain-mutable-state-update', { batchId: input.batchId }); for (const ref of batch.refs) if (!terminal(find(ref).state)) endRequest(find(ref), 'failed', 'uncertain-mutable-state-update'); finishBatch(batch); fail('EVALUATOR_REFERENCE_MUTABLE_STATE_QUARANTINE', 'uncertain mutable update quarantined evidence'); }
    const expected = dec(input.expectedGeneration), next = dec(input.nextGeneration); if (expected !== mutableGeneration || next <= expected) fail('EVALUATOR_REFERENCE_MUTABLE_STATE_ORDER', 'mutable generation must advance exactly'); mutableGeneration = next; return { kind: 'committed', generation: input.nextGeneration };
  }

  function assertAccounting() {
    const admitted = requests.size, terminalCount = [...requests.values()].filter((r) => terminal(r.state)).length;
    return { admitted, live: admitted - terminalCount, terminal: terminalCount, heldInputLeases: [...requests.values()].filter((r) => r.inputLease === 'held').length, liveResultSlots: [...requests.values()].filter((r) => r.resultDisposition === 'claimed').length, activeWorkspaces: [...workspaces.values()].filter((w) => w.state === 'acquired').length, liveBatches: [...batches.values()].filter((b) => b.state !== 'terminal').length, cacheEntries: [...cache.values()].filter((e) => e.state !== 'retired').length };
  }
  function snapshot() { return { selection: removed ? 'removed' : profile.id, quarantine: quarantine ? canonicalClone(quarantine) : null, evidenceValid: quarantine === null, reuseClassifications: reuseClassifications.toString(), mutableStateGeneration: mutableGeneration.toString(), accounting: assertAccounting(), currentSlots: [...currentBySlot].map(([slotId, request]) => ({ slotId, request })) }; }
  function cleanup() {
    const state = assertAccounting(); const protectedCache = [...cache.values()].filter((e) => e.state !== 'retired' && e.protected).length;
    if (state.live || state.liveBatches || protectedCache) return { kind: 'pending', pendingRequests: state.live, liveBatches: state.liveBatches, protectedCache, evidenceValid: quarantine === null };
    for (const request of requests.values()) { releaseInput(request); request.resultDisposition = 'released'; request.waiters.clear(); }
    for (const entry of cache.values()) entry.state = 'retired'; for (const lease of workspaces.values()) lease.state = 'released';
    const dispositions = profile.cleanup.classes.map((classId) => ({ classId, disposition: quarantine ? 'quarantined-or-released' : 'released' }));
    requests.clear(); currentBySlot.clear(); batches.clear(); workspaces.clear(); cache.clear(); cacheBuckets.clear(); rerootOps.clear();
    return { kind: quarantine ? 'quarantined' : 'complete', evidenceValid: quarantine === null, quarantine: quarantine ? canonicalClone(quarantine) : null, dispositions, runtimeResidue: 0 };
  }
  function removeEvaluator(input = { retainEvidence: false }) { const state = assertAccounting(); if (state.live || state.liveBatches || state.activeWorkspaces) fail('EVALUATOR_REFERENCE_REMOVE', 'cannot remove evaluator with live state'); const result = cleanup(); if (result.kind === 'pending') fail('EVALUATOR_REFERENCE_REMOVE', 'cleanup pending'); removed = true; return { kind: 'removed', selection: 'absent', runtimeResidue: 0, retainedEvidence: input.retainEvidence, evidenceValid: quarantine === null }; }

  return Object.freeze({ selection: profile.id, profile, admitRequest, attachWaiter, cancelWaiter, observeRequest, cancelRequest, failRequest, formBatch, executeBatch, resumeBatch, failBatch, scatterBatch, publishCapability, claimCacheEntry, publishCacheEntry, failCacheEntry, lookupCache, protectCacheEntry, retireCacheEntry, invalidateCacheFact, completeFromCache, classifyReuse, applyRerootAction, applyAdvanceFacts, commitMutableState, assertAccounting, snapshot, cleanup, removeEvaluator });
}

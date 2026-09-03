import fs from 'node:fs';

function replaceExactlyOnce(path, before, after) {
  const input = fs.readFileSync(path, 'utf8');
  const first = input.indexOf(before);
  if (first === -1) throw new Error(`${path}: expected subject not found`);
  if (input.indexOf(before, first + before.length) !== -1) throw new Error(`${path}: expected subject is not unique`);
  fs.writeFileSync(path, input.slice(0, first) + after + input.slice(first + before.length));
}

function replaceBetween(path, startMarker, endMarker, replacement) {
  const input = fs.readFileSync(path, 'utf8');
  const start = input.indexOf(startMarker);
  if (start === -1 || input.indexOf(startMarker, start + startMarker.length) !== -1) throw new Error(`${path}: start marker missing or non-unique`);
  const end = input.indexOf(endMarker, start + startMarker.length);
  if (end === -1 || input.indexOf(endMarker, end + endMarker.length) !== -1) throw new Error(`${path}: end marker missing or non-unique`);
  fs.writeFileSync(path, input.slice(0, start) + replacement + input.slice(end));
}

function insertBeforeExactlyOnce(path, marker, insertion) {
  const input = fs.readFileSync(path, 'utf8');
  const index = input.indexOf(marker);
  if (index === -1 || input.indexOf(marker, index + marker.length) !== -1) throw new Error(`${path}: insertion marker missing or non-unique`);
  fs.writeFileSync(path, input.slice(0, index) + insertion + input.slice(index));
}

const channelPath = 'experiments/search-ir-composer-reference/src/channel.mjs';
replaceExactlyOnce(
  channelPath,
  "    const requirement = assertEnum(entry.requirement, ['required', 'advisory'], 'CHANNEL_PROGRESS_DEPENDENCY', `${id} requirement`);",
  "    const requirement = assertEnum(entry.requirement, ['required', 'optional', 'advisory'], 'CHANNEL_PROGRESS_DEPENDENCY', `${id} requirement`);",
);
replaceExactlyOnce(
  channelPath,
  "    if (entry.holdsWorker !== false || entry.holdsMutableLease !== false || (requirement === 'required' && !['failure', 'cancel', 'stop', 'stale'].every((escape) => escapes.includes(escape)))) fail('CHANNEL_PROGRESS_DEPENDENCY', `${id} can retain a worker/resource or lacks a required escape`);",
  "    if (entry.holdsWorker !== false || entry.holdsMutableLease !== false || (requirement === 'required' && !['failure', 'cancel', 'stop', 'stale'].every((escape) => escapes.includes(escape))) || (requirement === 'optional' && !escapes.includes('skip'))) fail('CHANNEL_PROGRESS_DEPENDENCY', `${id} can retain a worker/resource or lacks its selected escape`);",
);

const simulator = `export function simulateChannelTrace(profile, channelId, operations) {
  const channel = profile.channels.find(({ id }) => id === channelId);
  if (!channel) fail('CHANNEL_REFERENCE_PROFILE', \`unknown channel \${channelId}\`);
  const capacity = BigInt(channel.capacity.slots); const slots = new Map();
  const generationMaximum = [BigInt(channel.itemIdentity.generation.maximum), BigInt(channel.counters.find(({ kind }) => kind === 'generation').maximum)].reduce((left, right) => left < right ? left : right);
  const correlationMaximum = [BigInt(channel.itemIdentity.correlation.maximum), BigInt(channel.counters.find(({ kind }) => kind === 'correlation').maximum)].reduce((left, right) => left < right ? left : right);
  const pendingMaximum = BigInt(channel.capacity.maxPending);
  const freeSlot = (index) => ({ index, state: 'free', generation: 0n, correlation: null, version: channel.version, freshness: null, initialized: false, resultInitialized: false, released: false, acquired: false, claims: 0n, disposition: null, used: false });
  const events = []; let pending = 0n; let nextCorrelation = 0n;
  const slotFor = (operation) => {
    if (!Number.isSafeInteger(operation.slot) || operation.slot < 0 || BigInt(operation.slot) >= capacity) fail('CHANNEL_REFERENCE_SLOT', 'operation names an invalid slot');
    const slot = slots.get(operation.slot) ?? freeSlot(operation.slot); slots.set(operation.slot, slot);
    if (operation.generation !== undefined && BigInt(operation.generation) !== slot.generation) fail('CHANNEL_REFERENCE_STALE', 'operation generation is stale');
    if (operation.correlation !== undefined && (slot.correlation === null || BigInt(operation.correlation) !== slot.correlation)) fail('CHANNEL_REFERENCE_CORRELATION', 'operation correlation is foreign or stale');
    if (operation.version !== undefined && operation.version !== slot.version) fail('CHANNEL_REFERENCE_VERSION', 'operation version is incompatible');
    if (operation.freshness !== undefined && operation.freshness !== slot.freshness) fail('CHANNEL_REFERENCE_FRESHNESS', 'operation freshness is stale');
    return slot;
  };
  const requireIdentity = (slot) => {
    if (slot.correlation === null || slot.version !== channel.version || typeof slot.freshness !== 'string' || slot.freshness.length === 0) fail('CHANNEL_REFERENCE_IDENTITY', 'item identity is incomplete before access');
  };
  const conserve = () => {
    if (BigInt(slots.size) > capacity || pending > pendingMaximum || [...slots.values()].some(({ claims }) => claims < 0n || claims > BigInt(channel.claim.maxClaims))) fail('CHANNEL_REFERENCE_CONSERVATION', 'channel accounting is not conserved');
  };
  for (const operation of operations) {
    if (operation.kind === 'await-unavailable') {
      if (channel.consumption.class === 'required') {
        if (pending === pendingMaximum) fail('CHANNEL_REFERENCE_PENDING', 'pending descriptor capacity is exhausted');
        pending += 1n; events.push({ kind: 'pending', workerReleased: true, mutableLeaseReleased: true });
      } else if (channel.consumption.class === 'optional') events.push({ kind: 'skipped', workerReleased: true, mutableLeaseReleased: true });
      else events.push({ kind: 'fallback', workerReleased: true, mutableLeaseReleased: true });
      conserve(); continue;
    }
    if (operation.kind === 'reserve') {
      const slot = slotFor(operation); if (slot.state !== 'free') { events.push({ kind: 'pressure', published: false }); conserve(); continue; }
      if (slot.used) { if (slot.generation >= generationMaximum) fail('CHANNEL_REFERENCE_COUNTER_EXHAUSTED', 'generation space is exhausted before reuse'); slot.generation += 1n; }
      if (nextCorrelation > correlationMaximum) fail('CHANNEL_REFERENCE_COUNTER_EXHAUSTED', 'correlation space is exhausted before alias');
      slot.used = true; slot.state = 'reserved-unpublished'; slot.correlation = nextCorrelation; nextCorrelation += 1n; slot.version = channel.version; slot.freshness = null;
      slot.initialized = false; slot.resultInitialized = false; slot.released = false; slot.acquired = false; slot.claims = 0n; slot.disposition = null;
      events.push({ kind: 'reserved', slot: slot.index, generation: slot.generation.toString(), correlation: slot.correlation.toString(), version: slot.version }); conserve(); continue;
    }
    const slot = slotFor(operation);
    if (operation.kind === 'initialize') {
      if (slot.state !== 'reserved-unpublished') fail('CHANNEL_REFERENCE_STATE', 'initialize requires reserved-unpublished');
      if (operation.freshness !== undefined && (typeof operation.freshness !== 'string' || operation.freshness.length === 0)) fail('CHANNEL_REFERENCE_FRESHNESS', 'freshness must be a nonempty opaque owner key');
      slot.initialized = true; slot.freshness = operation.freshness ?? \`freshness.\${channel.id}.\${slot.correlation}\`; events.push({ kind: 'initialized', freshness: slot.freshness });
    }
    else if (operation.kind === 'publish') {
      if (slot.state !== 'reserved-unpublished') fail('CHANNEL_REFERENCE_STATE', 'ready publication requires reserved-unpublished');
      if (!slot.initialized) fail('CHANNEL_REFERENCE_UNINITIALIZED', 'ready publication precedes complete initialization');
      if (operation.release !== true) fail('CHANNEL_REFERENCE_RELEASE', 'ready publication lacks logical release');
      slot.released = true; slot.state = 'ready'; events.push({ kind: 'ready' });
    }
    else if (operation.kind === 'claim-request') {
      if (!channel.stateGraph.states.includes('in-progress') || slot.state !== 'ready' || !slot.released || slot.claims !== 0n) fail('CHANNEL_REFERENCE_STATE', 'request claim requires one released ready request');
      requireIdentity(slot); if (operation.acquire !== true) fail('CHANNEL_REFERENCE_ACQUIRE', 'request claim lacks matching logical acquire');
      slot.claims = 1n; slot.acquired = true; slot.state = 'in-progress'; events.push({ kind: 'request-claimed', claims: '1' });
    }
    else if (operation.kind === 'initialize-result') {
      if (slot.state !== 'in-progress' || slot.claims !== 1n || !slot.acquired) fail('CHANNEL_REFERENCE_STATE', 'result initialization requires owned in-progress request');
      slot.resultInitialized = true; events.push({ kind: 'result-initialized' });
    }
    else if (operation.kind === 'publish-result') {
      if (slot.state !== 'in-progress') fail('CHANNEL_REFERENCE_STATE', 'result publication requires in-progress request');
      if (!slot.resultInitialized) fail('CHANNEL_REFERENCE_UNINITIALIZED', 'result publication precedes complete result initialization');
      if (operation.release !== true) fail('CHANNEL_REFERENCE_RELEASE', 'result publication lacks logical release');
      slot.claims = 0n; slot.acquired = false; slot.released = true; slot.state = 'result-ready'; events.push({ kind: 'result-ready' });
    }
    else if (operation.kind === 'claim') {
      const additionalBorrow = channel.claim.mode === 'finite-multi-consumer-immutable-borrow' && slot.state === 'owned-or-borrowed';
      if ((!['ready', 'result-ready'].includes(slot.state) && !additionalBorrow) || !slot.released) fail('CHANNEL_REFERENCE_STATE', 'claim requires released ready state');
      requireIdentity(slot); if (operation.acquire !== true) fail('CHANNEL_REFERENCE_ACQUIRE', 'claim lacks matching logical acquire');
      if (channel.claim.mode === 'single-consumer-transfer' && slot.claims !== 0n) fail('CHANNEL_REFERENCE_CLAIM', 'single-consumer item already claimed');
      if (slot.claims >= BigInt(channel.claim.maxClaims)) fail('CHANNEL_REFERENCE_CLAIM', 'claim/borrow bound is exhausted');
      slot.claims += 1n; slot.acquired = true; slot.state = 'owned-or-borrowed'; events.push({ kind: 'claimed', claims: slot.claims.toString(), correlation: slot.correlation.toString(), version: slot.version, freshness: slot.freshness });
    }
    else if (operation.kind === 'consume') { if (slot.state !== 'owned-or-borrowed' || !slot.acquired || !slot.initialized) fail('CHANNEL_REFERENCE_ACQUIRE', 'payload consumption lacks initialized acquired ownership'); requireIdentity(slot); events.push({ kind: 'consumed' }); }
    else if (operation.kind === 'release') { if (!['owned-or-borrowed', 'terminally-disposed'].includes(slot.state) || slot.claims === 0n) fail('CHANNEL_REFERENCE_STATE', 'release lacks a live claim/borrow'); const terminal = slot.state === 'terminally-disposed'; slot.claims -= 1n; slot.acquired = slot.claims > 0n; if (!terminal) slot.state = slot.claims === 0n ? 'ready' : 'owned-or-borrowed'; events.push({ kind: 'released', claims: slot.claims.toString() }); }
    else if (operation.kind === 'complete') { if (!['owned-or-borrowed', 'ready', 'result-ready'].includes(slot.state) || slot.claims > 1n) fail('CHANNEL_REFERENCE_STATE', 'completion has ambiguous ownership'); slot.claims = 0n; slot.state = 'terminally-disposed'; slot.disposition = operation.disposition ?? 'success'; events.push({ kind: 'completed', disposition: slot.disposition }); }
    else if (operation.kind === 'cancel') {
      if (['free', 'reclaimable'].includes(slot.state)) events.push({ kind: 'cancel-no-effect', disposition: slot.disposition });
      else if (slot.state === 'terminally-disposed') events.push({ kind: 'cancel-no-effect', disposition: slot.disposition });
      else { slot.state = 'terminally-disposed'; slot.disposition = 'cancelled'; events.push({ kind: 'cancelled', claims: slot.claims.toString() }); }
    }
    else if (operation.kind === 'expire') { if (['free', 'terminally-disposed', 'reclaimable'].includes(slot.state)) fail('CHANNEL_REFERENCE_STATE', 'expiry requires live work'); slot.state = 'terminally-disposed'; slot.disposition = 'expired'; events.push({ kind: 'expired', claims: slot.claims.toString() }); }
    else if (operation.kind === 'late-complete') { if (slot.state !== 'terminally-disposed') fail('CHANNEL_REFERENCE_STATE', 'late completion is not late'); events.push({ kind: 'late-ignored', disposition: slot.disposition }); }
    else if (operation.kind === 'reclaim') { if (slot.state !== 'terminally-disposed' || slot.claims !== 0n) fail('CHANNEL_REFERENCE_RECLAIM', 'reclaim requires terminal zero-reference state'); slot.state = 'reclaimable'; slot.initialized = false; slot.resultInitialized = false; slot.released = false; slot.acquired = false; events.push({ kind: 'reclaimable' }); slot.state = 'free'; events.push({ kind: 'free' }); }
    else fail('CHANNEL_REFERENCE_OPERATION', \`unknown reference operation \${operation.kind}\`);
    conserve();
  }
  return { slots: [...slots.values()].sort((left, right) => left.index - right.index).map(({ generation, correlation, claims, ...slot }) => ({ ...slot, generation: generation.toString(), correlation: correlation === null ? null : correlation.toString(), claims: claims.toString() })), events, pending: pending.toString(), conservation: capacity.toString() };
}

`;
replaceBetween(channelPath, 'export function simulateChannelTrace(profile, channelId, operations) {', 'export function classifyChannelProgress', simulator);

const fixturePath = 'experiments/search-ir-composer-reference/src/channel-fixtures.mjs';
replaceExactlyOnce(
  fixturePath,
  "        requirement: consumptionClass === 'advisory' ? 'advisory' : 'required', producerChannel: null,\n        escapes: consumptionClass === 'advisory' ? ['failure', 'cancel', 'stop', 'fallback', 'stale'] : ['failure', 'cancel', 'stop', 'stale'],",
  "        requirement: consumptionClass, producerChannel: null,\n        escapes: consumptionClass === 'advisory' ? ['failure', 'cancel', 'stop', 'fallback', 'stale'] : consumptionClass === 'optional' ? ['failure', 'cancel', 'stop', 'skip', 'stale'] : ['failure', 'cancel', 'stop', 'stale'],",
);
replaceExactlyOnce(fixturePath, 'function buildSecondary(profile, channelToken, stageResult, resourceResult, progressResult) {', "function buildSecondary(profile, channelToken, stageResult, resourceResult, progressResult, consumption = 'advisory') {");
replaceExactlyOnce(fixturePath, "    requestResult: true, consumption: 'advisory', payloads:", '    requestResult: true, consumption, payloads:');
replaceExactlyOnce(
  fixturePath,
  "  const secondary = buildSecondary(profile, options.secondaryToken ?? 'synthetic-audit-feed', stageResult, resourceResult, progressResult);",
  "  const secondary = buildSecondary(profile, options.secondaryToken ?? 'synthetic-audit-feed', stageResult, resourceResult, progressResult, options.secondaryConsumption ?? 'advisory');",
);
replaceExactlyOnce(
  fixturePath,
  "    buildProfile('synthetic-secondary-work', inspected, secondaryResourceResult, secondaryProgressResult, secondaryStageResult, { secondaryToken: 'synthetic-secondary-broadcast' }),",
  "    buildProfile('synthetic-secondary-work', inspected, secondaryResourceResult, secondaryProgressResult, secondaryStageResult, { secondaryToken: 'synthetic-secondary-broadcast', secondaryConsumption: 'optional' }),",
);

const schemaPath = 'schemas/search-ir/0.2.0/channel-profile.schema.json';
replaceExactlyOnce(schemaPath, '"requirement": { "enum": ["required", "advisory"] }', '"requirement": { "enum": ["required", "optional", "advisory"] }');

const runPath = 'experiments/search-ir-composer-reference/run.mjs';
replaceExactlyOnce(runPath, "  assert.deepEqual(channelProfiles.map(({ normalized }) => normalized.channels[0].consumption.class), ['advisory', 'advisory']);", "  assert.deepEqual(channelProfiles.map(({ normalized }) => normalized.channels[0].consumption.class), ['advisory', 'optional']);");

replaceExactlyOnce(
  runPath,
  `await runCase('channel-secondary-work-advisory-multiborrow', () => {
  const channel = channelProfiles[1].normalized.channels[0];
  assert.equal(channel.consumption.class, 'advisory');
  assert.equal(channel.consumption.unavailable, 'owner-fallback');
  assert.equal(channel.claim.mode, 'finite-multi-consumer-immutable-borrow');
  assert.equal(channel.claim.referenceAccounting, 'exact');
});`,
  `await runCase('channel-secondary-work-advisory-multiborrow', () => {
  const channel = channelProfiles[0].normalized.channels.find(({ consumption }) => consumption.class === 'advisory');
  assert.equal(channel.consumption.unavailable, 'owner-fallback');
  assert.equal(channel.claim.mode, 'finite-multi-consumer-immutable-borrow');
  assert.equal(channel.claim.referenceAccounting, 'exact');
  const unavailable = simulateChannelTrace(channelProfiles[0].normalized, channel.id, [{ kind: 'await-unavailable' }]);
  assert.deepEqual(unavailable.events[0], { kind: 'fallback', workerReleased: true, mutableLeaseReleased: true });
});

await runCase('channel-secondary-work-optional-skip', () => {
  const channel = channelProfiles[1].normalized.channels[0];
  assert.equal(channel.consumption.class, 'optional');
  assert.equal(channel.consumption.unavailable, 'skip');
  assert.equal(channel.progress.dependencies[0].requirement, 'optional');
  assert.equal(channel.progress.dependencies[0].fallback, null);
  assert(channel.progress.dependencies[0].escapes.includes('skip'));
  const unavailable = simulateChannelTrace(channelProfiles[1].normalized, channel.id, [{ kind: 'await-unavailable' }]);
  assert.deepEqual(unavailable.events[0], { kind: 'skipped', workerReleased: true, mutableLeaseReleased: true });
  assert.equal(unavailable.pending, '0');
});`,
);

insertBeforeExactlyOnce(
  runPath,
  "await runCase('channel-reference-serial-publication', () => {",
  `await runCase('channel-producer-publication-preconditions', () => {
  for (const channel of channelProfiles[0].normalized.channels) {
    const producers = channel.roles.filter(({ kind }) => kind === 'producer');
    assert(producers.length > 0 && producers.every(({ actions }) => actions.includes('produce') && actions.includes('release')));
    assert(channel.payloads.every(({ sourceValidity }) => sourceValidity && sourceValidity.id));
    assert.equal(channel.resources.rollback, 'zero-published-effect');
    assert(channel.lifecycle.reclamation.preconditions.includes('source-leases-ended'));
  }
});

await runCase('channel-publication-coherence-contract', () => {
  for (const channel of channelProfiles[0].normalized.channels) {
    assert(channel.publication.publicationWord && channel.publication.publicationWord.id);
    assert.equal(channel.publication.payloadBeforeReady, true);
    assert.equal(channel.publication.consumeAfterAcquire, true);
    assert(channel.payloads.every(({ immutableAtReady }) => immutableAtReady === true));
  }
});

await runCase('channel-consumption-failure-owned', () => {
  const ownerIds = new Set(channelProfiles[0].normalized.owners.map(({ id }) => id));
  for (const channel of channelProfiles[0].normalized.channels) {
    assert(ownerIds.has(channel.semanticOwner));
    assert(channel.consumption.failure && channel.consumption.failure.id);
  }
});

await runCase('channel-cancellation-disposition-table-complete', () => {
  for (const channel of channelProfiles[0].normalized.channels) {
    const disposition = new Map(channel.lifecycle.cancellation.map(({ state, disposition: value }) => [state, value]));
    assert.deepEqual([...disposition.keys()].sort(), [...channel.stateGraph.states].sort());
    assert.equal(disposition.get('free'), 'no-effect');
    assert.equal(disposition.get('terminally-disposed'), 'ignore-authoritative-terminal');
    assert.equal(disposition.get('reclaimable'), 'reclaim');
    assert.equal(channel.lifecycle.expiry.source, 'engine-epoch-budget');
  }
});

`,
);

insertBeforeExactlyOnce(
  runPath,
  "await runCase('channel-reference-required-pending-releases-worker', () => {",
  `await runCase('channel-reference-request-result-correlation', () => {
  const channel = channelProfiles[0].normalized.channels.find(({ consumption }) => consumption.class === 'required');
  const freshness = 'owner-freshness.request-0';
  const result = simulateChannelTrace(channelProfiles[0].normalized, channel.id, [
    { kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, generation: 0, freshness }, { kind: 'publish', slot: 0, generation: 0, release: true },
    { kind: 'claim-request', slot: 0, generation: 0, correlation: 0, version: channel.version, freshness, acquire: true },
    { kind: 'initialize-result', slot: 0, generation: 0, correlation: 0, version: channel.version, freshness },
    { kind: 'publish-result', slot: 0, generation: 0, correlation: 0, version: channel.version, freshness, release: true },
    { kind: 'claim', slot: 0, generation: 0, correlation: 0, version: channel.version, freshness, acquire: true },
    { kind: 'consume', slot: 0, generation: 0, correlation: 0, version: channel.version, freshness },
    { kind: 'complete', slot: 0, generation: 0, correlation: 0, version: channel.version, freshness },
    { kind: 'reclaim', slot: 0, generation: 0, correlation: 0, version: channel.version, freshness },
  ]);
  assert(result.events.some(({ kind }) => kind === 'request-claimed'));
  assert(result.events.some(({ kind }) => kind === 'result-ready'));
  assert(result.events.some(({ kind }) => kind === 'consumed'));
  assert.equal(result.slots[0].state, 'free');
  assert.equal(result.slots[0].correlation, '0');
});

`,
);

insertBeforeExactlyOnce(
  runPath,
  "await runCase('channel-reference-expiry-terminal', () => {",
  `await runCase('channel-reference-cancellation-state-matrix', () => {
  const channel = channelProfiles[0].normalized.channels.find(({ consumption }) => consumption.class === 'required');
  const freshness = 'owner-freshness.cancel-matrix';
  const traces = [
    simulateChannelTrace(channelProfiles[0].normalized, channel.id, [{ kind: 'cancel', slot: 0 }]),
    simulateChannelTrace(channelProfiles[0].normalized, channel.id, [{ kind: 'reserve', slot: 0 }, { kind: 'cancel', slot: 0, generation: 0 }]),
    simulateChannelTrace(channelProfiles[0].normalized, channel.id, [{ kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, freshness }, { kind: 'publish', slot: 0, release: true }, { kind: 'cancel', slot: 0 }]),
    simulateChannelTrace(channelProfiles[0].normalized, channel.id, [{ kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, freshness }, { kind: 'publish', slot: 0, release: true }, { kind: 'claim-request', slot: 0, acquire: true }, { kind: 'cancel', slot: 0 }]),
    simulateChannelTrace(channelProfiles[0].normalized, channel.id, [{ kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, freshness }, { kind: 'publish', slot: 0, release: true }, { kind: 'claim-request', slot: 0, acquire: true }, { kind: 'initialize-result', slot: 0 }, { kind: 'publish-result', slot: 0, release: true }, { kind: 'cancel', slot: 0 }]),
  ];
  assert.equal(traces[0].events.at(-1).kind, 'cancel-no-effect');
  for (const trace of traces.slice(1)) { assert.equal(trace.slots[0].state, 'terminally-disposed'); assert.equal(trace.slots[0].disposition, 'cancelled'); }
});

`,
);

insertBeforeExactlyOnce(
  runPath,
  "await runCase('reject-channel-required-escape-gap', () => {",
  `await runCase('reject-channel-pending-holds-mutable-lease', () => {
  const mutated = clone(channelProfileInputs[0]); mutated.channels[0].progress.dependencies[0].holdsMutableLease = true;
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PROGRESS_DEPENDENCY' });
});

`,
);

replaceExactlyOnce(
  runPath,
  `await runCase('reject-channel-advisory-fallback-gap', () => {
  const mutated = clone(channelProfileInputs[1]); mutated.channels[0].progress.dependencies[0].fallback = null;
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelDeletedResourceResult, channelDeletedProgressResult, channelDeletedStageResult), { code: 'CHANNEL_PROGRESS_DEPENDENCY' });
});`,
  `await runCase('reject-channel-advisory-fallback-gap', () => {
  const mutated = clone(channelProfileInputs[0]); const advisory = mutated.channels.find(({ consumption }) => consumption.class === 'advisory'); advisory.progress.dependencies[0].fallback = null;
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelResourceResult, channelProgressResult, channelStageResult), { code: 'CHANNEL_PROGRESS_DEPENDENCY' });
});

await runCase('reject-channel-optional-skip-gap', () => {
  const mutated = clone(channelProfileInputs[1]); mutated.channels[0].progress.dependencies[0].escapes = mutated.channels[0].progress.dependencies[0].escapes.filter((escape) => escape !== 'skip');
  assert.throws(() => normalizeChannelProfile(mutated, inspected, channelDeletedResourceResult, channelDeletedProgressResult, channelDeletedStageResult), { code: 'CHANNEL_PROGRESS_DEPENDENCY' });
});`,
);

insertBeforeExactlyOnce(
  runPath,
  "await runCase('reject-channel-reference-missing-release', () => {",
  `await runCase('reject-channel-reference-foreign-channel', () => {
  assert.throws(() => simulateChannelTrace(channelProfiles[0].normalized, 'channel.foreign', []), { code: 'CHANNEL_REFERENCE_PROFILE' });
});

await runCase('reject-channel-reference-wrong-correlation', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  assert.throws(() => simulateChannelTrace(channelProfiles[0].normalized, channel.id, [
    { kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, freshness: 'freshness.correct' }, { kind: 'publish', slot: 0, release: true }, { kind: 'claim', slot: 0, correlation: 1, acquire: true },
  ]), { code: 'CHANNEL_REFERENCE_CORRELATION' });
});

await runCase('reject-channel-reference-wrong-version', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  assert.throws(() => simulateChannelTrace(channelProfiles[0].normalized, channel.id, [
    { kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, freshness: 'freshness.correct' }, { kind: 'publish', slot: 0, release: true }, { kind: 'claim', slot: 0, version: '0.1.1', acquire: true },
  ]), { code: 'CHANNEL_REFERENCE_VERSION' });
});

await runCase('reject-channel-reference-wrong-freshness', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  assert.throws(() => simulateChannelTrace(channelProfiles[0].normalized, channel.id, [
    { kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0, freshness: 'freshness.correct' }, { kind: 'publish', slot: 0, release: true }, { kind: 'claim', slot: 0, freshness: 'freshness.stale', acquire: true },
  ]), { code: 'CHANNEL_REFERENCE_FRESHNESS' });
});

await runCase('reject-channel-reference-duplicate-publication', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  assert.throws(() => simulateChannelTrace(channelProfiles[0].normalized, channel.id, [
    { kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0 }, { kind: 'publish', slot: 0, release: true }, { kind: 'publish', slot: 0, release: true },
  ]), { code: 'CHANNEL_REFERENCE_STATE' });
});

await runCase('reject-channel-reference-duplicate-result-publication', () => {
  const channel = channelProfiles[0].normalized.channels.find(({ consumption }) => consumption.class === 'required');
  assert.throws(() => simulateChannelTrace(channelProfiles[0].normalized, channel.id, [
    { kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0 }, { kind: 'publish', slot: 0, release: true }, { kind: 'claim-request', slot: 0, acquire: true }, { kind: 'initialize-result', slot: 0 }, { kind: 'publish-result', slot: 0, release: true }, { kind: 'publish-result', slot: 0, release: true },
  ]), { code: 'CHANNEL_REFERENCE_STATE' });
});

await runCase('reject-channel-reference-ready-mutation', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  assert.throws(() => simulateChannelTrace(channelProfiles[0].normalized, channel.id, [
    { kind: 'reserve', slot: 0 }, { kind: 'initialize', slot: 0 }, { kind: 'publish', slot: 0, release: true }, { kind: 'initialize', slot: 0 },
  ]), { code: 'CHANNEL_REFERENCE_STATE' });
});

`,
);

replaceExactlyOnce(runPath, '  expected: 883,', '  expected: 899,');
replaceExactlyOnce(runPath, '  notDiscovered: 883 - cases.length,', '  notDiscovered: 899 - cases.length,');

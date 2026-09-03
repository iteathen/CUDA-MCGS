import fs from 'node:fs';

function replaceExactlyOnce(path, before, after) {
  const input = fs.readFileSync(path, 'utf8');
  const first = input.indexOf(before);
  if (first === -1) throw new Error(`${path}: expected construction subject not found`);
  if (input.indexOf(before, first + before.length) !== -1) throw new Error(`${path}: construction subject is not unique`);
  fs.writeFileSync(path, input.slice(0, first) + after + input.slice(first + before.length));
}

replaceExactlyOnce(
  'experiments/search-ir-composer-reference/src/channel.mjs',
  "    else if (operation.kind === 'cancel') { if (['free', 'reclaimable'].includes(slot.state)) events.push({ kind: 'cancel-no-effect' }); else { slot.state = 'terminally-disposed'; slot.disposition = 'cancelled'; events.push({ kind: 'cancelled', claims: slot.claims.toString() }); } }",
  `    else if (operation.kind === 'cancel') {
      if (['free', 'reclaimable'].includes(slot.state)) events.push({ kind: 'cancel-no-effect', disposition: slot.disposition });
      else if (slot.state === 'terminally-disposed') events.push({ kind: 'cancel-no-effect', disposition: slot.disposition });
      else { slot.state = 'terminally-disposed'; slot.disposition = 'cancelled'; events.push({ kind: 'cancelled', claims: slot.claims.toString() }); }
    }`,
);

const cancelCase = `await runCase('channel-reference-cancel-late-completion-no-resurrection', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  const result = simulateChannelTrace(channelProfiles[0].normalized, channel.id, [
    { kind: 'reserve', slot: 0 }, { kind: 'cancel', slot: 0, generation: 0 }, { kind: 'late-complete', slot: 0, generation: 0 }, { kind: 'reclaim', slot: 0, generation: 0 },
  ]);
  assert(result.events.some(({ kind }) => kind === 'late-ignored')); assert.equal(result.slots[0].state, 'free');
});`;
const cancelCaseWithFalsifier = `${cancelCase}

await runCase('channel-reference-cancel-preserves-authoritative-first-cause', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  const result = simulateChannelTrace(channelProfiles[0].normalized, channel.id, [
    { kind: 'reserve', slot: 0 },
    { kind: 'initialize', slot: 0, generation: 0 },
    { kind: 'publish', slot: 0, generation: 0, release: true },
    { kind: 'complete', slot: 0, generation: 0, disposition: 'channel-internal-failure' },
    { kind: 'cancel', slot: 0, generation: 0 },
    { kind: 'cancel', slot: 0, generation: 0 },
  ]);
  assert.equal(result.slots[0].disposition, 'channel-internal-failure');
  const ignored = result.events.filter(({ kind }) => kind === 'cancel-no-effect');
  assert.equal(ignored.length, 2);
  assert(ignored.every(({ disposition }) => disposition === 'channel-internal-failure'));
});`;
replaceExactlyOnce('experiments/search-ir-composer-reference/run.mjs', cancelCase, cancelCaseWithFalsifier);

const producerCase = `await runCase('channel-reference-producer-service-while-pending', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  assert.equal(classifyChannelProgress(channelProfiles[0].normalized, channel.id, { pendingConsumers: true, producerRunnable: true, escapeRunnable: false }), 'service-producer');
});`;
const producerCaseWithEscape = `${producerCase}

await runCase('channel-reference-escape-service-while-pending', () => {
  const channel = channelProfiles[0].normalized.channels[0];
  assert.equal(classifyChannelProgress(channelProfiles[0].normalized, channel.id, { pendingConsumers: true, producerRunnable: false, escapeRunnable: true }), 'service-escape');
});`;
replaceExactlyOnce('experiments/search-ir-composer-reference/run.mjs', producerCase, producerCaseWithEscape);

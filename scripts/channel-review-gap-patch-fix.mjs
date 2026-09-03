import fs from 'node:fs';

const path = 'scripts/channel-review-gap-patch.mjs';
const input = fs.readFileSync(path, 'utf8');

function replaceExactlyOnce(before, after) {
  const first = input.indexOf(before);
  if (first === -1) throw new Error(`expected patch subject not found: ${before}`);
  if (input.indexOf(before, first + before.length) !== -1) throw new Error(`patch subject is not unique: ${before}`);
  return [first, before.length, after];
}

const replacements = [
  replaceExactlyOnce(
    "    if (operation.freshness !== undefined && operation.freshness !== slot.freshness) fail('CHANNEL_REFERENCE_FRESHNESS', 'operation freshness is stale');",
    "    if (operation.kind !== 'initialize' && operation.freshness !== undefined && operation.freshness !== slot.freshness) fail('CHANNEL_REFERENCE_FRESHNESS', 'operation freshness is stale');",
  ),
  replaceExactlyOnce(
    "      slot.claims = 1n; slot.acquired = true; slot.state = 'in-progress'; events.push({ kind: 'request-claimed', claims: '1' });",
    "      slot.claims = 1n; slot.acquired = true; slot.released = false; slot.state = 'in-progress'; events.push({ kind: 'request-claimed', claims: '1' });",
  ),
].sort((left, right) => right[0] - left[0]);

let output = input;
for (const [start, length, after] of replacements) output = output.slice(0, start) + after + output.slice(start + length);
fs.writeFileSync(path, output);

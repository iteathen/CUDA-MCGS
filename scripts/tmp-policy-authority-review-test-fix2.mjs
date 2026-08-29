import fs from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one match, found ${count}`);
  return source.replace(before, after);
}

const path = 'experiments/search-semantics-reference/src/policy-cases.mjs';
let source = fs.readFileSync(path, 'utf8');
source = replaceOnce(
  source,
  "    assert.equal(commitFence.readRecord({ recordId: commitFenceRecord.id, storageKey: 'reset-target' }), null);",
  "    assert.throws(() => commitFence.readRecord({ recordId: commitFenceRecord.id, storageKey: 'reset-target' }), { code: 'POLICY_REFERENCE_RECORD' });",
  'invalidated commit-fence record before stale completion',
);
source = replaceOnce(
  source,
  "    assert.equal(commitFence.readRecord({ recordId: commitFenceRecord.id, storageKey: 'reset-target' }), null, 'atomic commit must revalidate target generation at commit');",
  "    assert.throws(() => commitFence.readRecord({ recordId: commitFenceRecord.id, storageKey: 'reset-target' }), { code: 'POLICY_REFERENCE_RECORD' }, 'stale atomic commit must not resurrect an invalidated target');",
  'invalidated commit-fence record after stale completion',
);
fs.writeFileSync(path, source);

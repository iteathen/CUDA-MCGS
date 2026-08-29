import fs from 'node:fs';

function replaceExactly(source, before, after, expected, label) {
  const count = source.split(before).length - 1;
  if (count !== expected) throw new Error(`${label}: expected ${expected} matches, found ${count}`);
  return source.split(before).join(after);
}

const casesPath = 'experiments/search-semantics-reference/src/policy-cases.mjs';
let cases = fs.readFileSync(casesPath, 'utf8');

cases = replaceExactly(
  cases,
  "scope: { kind: 'path', id: 'path-a' }",
  "scope: { kind: 'edge', id: 'edge-a' }",
  1,
  'repeated-occurrence reservation scope',
);

const oldDeclarations = [
  "    const resetDeclaration = scalar.reuse.find(({ disposition }) => disposition === 'reset');",
  "    assert(resetDeclaration, 'scalar Policy profile needs one reset target for atomic commit generation validation');",
  "    const resetRecord = scalar.records.find(({ id }) => id === resetDeclaration.record);",
  "    assert(resetRecord);",
].join('\n');
const newDeclarations = [
  "    const commitFenceProfile = canonicalClone(scalar);",
  "    commitFenceProfile.backup.staleEpoch = 'root-independent-only';",
  "    const commitFenceRecord = visibleRecord(commitFenceProfile);",
].join('\n');
cases = replaceExactly(cases, oldDeclarations, newDeclarations, 1, 'commit-fence profile setup');

cases = replaceExactly(
  cases,
  "    const commitFence = numericOracle(scalar);",
  "    const commitFence = numericOracle(commitFenceProfile);",
  1,
  'commit-fence oracle profile',
);
cases = replaceExactly(
  cases,
  "recordId: resetRecord.id, storageKey: 'reset-target'",
  "recordId: commitFenceRecord.id, storageKey: 'reset-target'",
  3,
  'commit-fence record identity',
);
cases = replaceExactly(
  cases,
  "backupOccurrences(resetRecord, 1, { storageKey: 'reset-target' })",
  "backupOccurrences(commitFenceRecord, 1, { storageKey: 'reset-target' })",
  1,
  'commit-fence backup target',
);
cases = replaceExactly(
  cases,
  "commitFence.reroot({ fromEpoch: '1', toEpoch: '2', dispositions: rerootDispositions(scalar, true) });",
  "commitFence.reroot({ fromEpoch: '1', toEpoch: '2', dispositions: rerootDispositions(commitFenceProfile, false) });",
  1,
  'commit-fence reroot invalidation',
);

fs.writeFileSync(casesPath, cases);

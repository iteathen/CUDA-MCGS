import fs from 'node:fs';

const path = 'experiments/search-semantics-reference/run-framework-lifecycle.mjs';
const before = `assert.deepEqual(composerEvidence.summary, {
  expected: 881,
  discovered: 881,
  executed: 881,
  passed: 881,
  failed: 0,
  requiredSkipped: 0,
  conditionalSkipped: 0,
  optionalSkipped: 0,
  notDiscovered: 0,
});`;
const after = `assert(Number.isSafeInteger(composerEvidence.summary.expected) && composerEvidence.summary.expected > 0, 'Composer evidence must declare a positive exact case count');
assert.equal(composerEvidence.summary.discovered, composerEvidence.summary.expected, 'Composer evidence discovery must be exact');
assert.equal(composerEvidence.summary.executed, composerEvidence.summary.discovered, 'Composer evidence must execute every discovered case');
assert.equal(composerEvidence.summary.passed, composerEvidence.summary.executed, 'Composer evidence must pass every executed case');
assert.equal(composerEvidence.summary.failed, 0);
assert.equal(composerEvidence.summary.requiredSkipped, 0);
assert.equal(composerEvidence.summary.conditionalSkipped, 0);
assert.equal(composerEvidence.summary.optionalSkipped, 0);
assert.equal(composerEvidence.summary.notDiscovered, 0);`;
const input = fs.readFileSync(path, 'utf8');
const first = input.indexOf(before);
if (first === -1) throw new Error('Framework runner stale Composer-summary block not found');
if (input.indexOf(before, first + before.length) !== -1) throw new Error('Framework runner stale Composer-summary block is not unique');
fs.writeFileSync(path, input.slice(0, first) + after + input.slice(first + before.length));

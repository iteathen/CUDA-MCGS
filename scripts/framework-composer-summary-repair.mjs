import fs from 'node:fs';

const runnerPath = 'experiments/search-semantics-reference/run-framework-lifecycle.mjs';
const fixturePath = 'experiments/search-semantics-reference/fixtures/framework-lifecycle-cases.json';
const evidencePath = 'experiments/search-ir-composer-reference/build/evidence.json';

const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
if (evidence.capsule !== 'cuda-mcgs-search-ir-composer-reference-v0.2.0' || evidence.status !== 'pass') throw new Error('Composer evidence is not the expected passing capsule');
const summary = evidence.summary;
if (!Number.isSafeInteger(summary.expected) || summary.expected <= 0
    || summary.discovered !== summary.expected
    || summary.executed !== summary.discovered
    || summary.passed !== summary.executed
    || summary.failed !== 0
    || summary.requiredSkipped !== 0
    || summary.conditionalSkipped !== 0
    || summary.optionalSkipped !== 0
    || summary.notDiscovered !== 0) throw new Error('Composer evidence is not a complete pass');
const nextComposerIdentity = evidence.representationCompositionEvidenceKey;
if (!nextComposerIdentity || nextComposerIdentity.algorithm !== 'sha256' || !Number.isSafeInteger(nextComposerIdentity.byteLength) || !/^[0-9a-f]{64}$/.test(nextComposerIdentity.sha256)) throw new Error('Composer evidence identity is invalid');

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
const runner = fs.readFileSync(runnerPath, 'utf8');
const first = runner.indexOf(before);
if (first === -1) throw new Error('Framework runner stale Composer-summary block not found');
if (runner.indexOf(before, first + before.length) !== -1) throw new Error('Framework runner stale Composer-summary block is not unique');
fs.writeFileSync(runnerPath, runner.slice(0, first) + after + runner.slice(first + before.length));

const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const previous = fixture.composerEvidence;
if (!previous || previous.algorithm !== 'sha256' || !/^[0-9a-f]{64}$/.test(previous.sha256)) throw new Error('Framework fixture previous Composer identity is invalid');
const previousSemantic = `semantic.${previous.sha256}`;
for (const [label, value] of [
  ['profile', fixture.profile?.semanticIdentity],
  ['persistenceProfile', fixture.persistenceProfile?.semanticIdentity],
  ['validPersistenceSnapshot', fixture.validPersistenceSnapshot?.semanticIdentity],
]) if (value !== previousSemantic) throw new Error(`${label} semantic identity is not derived from the previously pinned Composer evidence`);
fixture.composerEvidence = nextComposerIdentity;
const nextSemantic = `semantic.${nextComposerIdentity.sha256}`;
fixture.profile.semanticIdentity = nextSemantic;
fixture.persistenceProfile.semanticIdentity = nextSemantic;
fixture.validPersistenceSnapshot.semanticIdentity = nextSemantic;
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);

import fs from 'node:fs';

function replaceExactlyOnce(path, before, after) {
  const input = fs.readFileSync(path, 'utf8');
  const first = input.indexOf(before);
  if (first === -1) throw new Error(`${path}: expected repair subject not found`);
  if (input.indexOf(before, first + before.length) !== -1) throw new Error(`${path}: repair subject is not unique`);
  fs.writeFileSync(path, input.slice(0, first) + after + input.slice(first + before.length));
}

const validationPath = 'experiments/search-ir-composer-reference/src/validation.mjs';
const integerHelper = `export function assertInteger(value, minimum, code, label) {
  if (!Number.isSafeInteger(value) || value < minimum) fail(code, \`${'${label}'} is invalid\`);
}
`;
const summaryHelper = `${integerHelper}
export function assertCompletePassSummary(summary, label = 'evidence summary') {
  const fields = ['expected', 'discovered', 'executed', 'passed', 'failed', 'requiredSkipped', 'conditionalSkipped', 'optionalSkipped', 'notDiscovered'];
  exactKeys(summary, fields, 'EVIDENCE_SUMMARY_FIELDS', label);
  for (const field of fields) assertInteger(summary[field], 0, 'EVIDENCE_SUMMARY_RANGE', \`${'${label}'} ${'${field}'}\`);
  if (summary.expected === 0
      || summary.expected !== summary.discovered
      || summary.discovered !== summary.executed
      || summary.executed !== summary.passed
      || summary.failed !== 0
      || summary.requiredSkipped !== 0
      || summary.conditionalSkipped !== 0
      || summary.optionalSkipped !== 0
      || summary.notDiscovered !== 0) {
    fail('EVIDENCE_SUMMARY_INCOMPLETE', \`${'${label}'} is not a complete pass\`);
  }
}
`;
replaceExactlyOnce(validationPath, integerHelper, summaryHelper);

const exporters = [
  'export-domain-profiles.mjs',
  'export-evaluator-profiles.mjs',
  'export-graph-profiles.mjs',
  'export-output-profiles.mjs',
  'export-policy-profiles.mjs',
  'export-progress-profiles.mjs',
  'export-resource-profiles.mjs',
  'export-session-profiles.mjs',
  'export-stage-profiles.mjs',
].map((name) => `experiments/search-ir-composer-reference/${name}`);

const oldExactSummary = `assert.deepEqual(composerEvidence.summary, {
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
const oldPartialSummary = `assert.equal(composerEvidence.summary.failed, 0);
assert.equal(composerEvidence.summary.requiredSkipped, 0);
assert.equal(composerEvidence.summary.notDiscovered, 0);`;
const newSummary = `assertCompletePassSummary(composerEvidence.summary, 'Composer evidence summary');`;
const importMarker = "import { fileURLToPath } from 'node:url';\n";
const validationImport = "import { assertCompletePassSummary } from './src/validation.mjs';\n";

for (const path of exporters) {
  const initial = fs.readFileSync(path, 'utf8');
  const hasExact = initial.includes(oldExactSummary);
  const hasPartial = initial.includes(oldPartialSummary);
  if (hasExact === hasPartial) throw new Error(`${path}: expected exactly one known producer-summary contract`);
  replaceExactlyOnce(path, hasExact ? oldExactSummary : oldPartialSummary, newSummary);

  const input = fs.readFileSync(path, 'utf8');
  if (input.includes(validationImport)) throw new Error(`${path}: validation import already exists unexpectedly`);
  const marker = input.indexOf(importMarker);
  if (marker === -1 || input.indexOf(importMarker, marker + importMarker.length) !== -1) throw new Error(`${path}: import marker missing or non-unique`);
  fs.writeFileSync(path, input.slice(0, marker + importMarker.length) + `\n${validationImport}` + input.slice(marker + importMarker.length));
}

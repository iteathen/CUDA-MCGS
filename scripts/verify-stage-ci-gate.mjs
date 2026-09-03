import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflowPath = path.join(repositoryRoot, '.github', 'workflows', 'stage-reference.yml');
const workflow = await readFile(workflowPath, 'utf8');

function stepBlock(name) {
  const marker = `      - name: ${name}\n`;
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1, `Stage workflow must contain ${name}`);
  const next = workflow.indexOf('\n      - name: ', start + marker.length);
  return workflow.slice(start, next === -1 ? workflow.length : next);
}
const runBlock = stepBlock('Run Stage reference');
assert.match(runBlock, /\n        run: node scripts\/run-stage-reference\.mjs(?:\n|$)/, 'Stage reference runner must be an unconditional workflow command');
assert.doesNotMatch(runBlock, /\n        if:/, 'Stage reference runner must not be conditionally skippable');
const uploadBlock = stepBlock('Upload Stage evidence');
assert.match(uploadBlock, /\n          if-no-files-found: error(?:\n|$)/, 'green Stage workflow must require its evidence artifact');
console.log('stage_ci_gate=pass');

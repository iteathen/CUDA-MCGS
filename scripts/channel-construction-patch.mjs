import fs from 'node:fs';

function replaceExactlyOnce(path, before, after) {
  const input = fs.readFileSync(path, 'utf8');
  const first = input.indexOf(before);
  if (first === -1) throw new Error(`${path}: expected construction subject not found`);
  if (input.indexOf(before, first + before.length) !== -1) throw new Error(`${path}: construction subject is not unique`);
  fs.writeFileSync(path, input.slice(0, first) + after + input.slice(first + before.length));
}

const runPath = 'experiments/search-ir-composer-reference/run.mjs';
replaceExactlyOnce(runPath, '  expected: 881,', '  expected: 883,');
replaceExactlyOnce(runPath, '  notDiscovered: 881 - cases.length,', '  notDiscovered: 883 - cases.length,');

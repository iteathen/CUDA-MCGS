const fs = require('node:fs');

function replaceCount(path, oldText, newText, expected) {
  let text = fs.readFileSync(path, 'utf8');
  const count = text.split(oldText).length - 1;
  if (count !== expected) throw new Error(`${path}: expected ${expected} occurrences, found ${count}`);
  text = text.split(oldText).join(newText);
  fs.writeFileSync(path, text);
}

const runner = 'conformance/search-compiler/run.mjs';
replaceCount(
  runner,
  "['access', 'alignment', 'capacity', 'id', 'lifecycle', 'memorySpaces', 'opaqueResult', 'pool', 'unit']",
  "['access', 'alignment', 'byteLength', 'capacity', 'id', 'lifecycle', 'materialization', 'memorySpaces', 'opaqueResult', 'pool', 'unit']",
  1,
);
replaceCount(runner, 'expected: 883,', 'expected: 890,', 1);
replaceCount(runner, 'notDiscovered: 883 - cases.length,', 'notDiscovered: 890 - cases.length,', 1);

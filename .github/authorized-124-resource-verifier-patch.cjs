const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

function replaceCount(path, oldText, newText, expected) {
  let text = fs.readFileSync(path, 'utf8');
  const count = text.split(oldText).length - 1;
  if (count !== expected) throw new Error(`${path}: expected ${expected} occurrences, found ${count}`);
  text = text.split(oldText).join(newText);
  fs.writeFileSync(path, text);
}

function replaceExact(path, oldText, newText) {
  replaceCount(path, oldText, newText, 1);
}

const terminal = 'conformance/search-compiler/verify-terminal-output-host-delivery.mjs';
const operation = 'conformance/search-compiler/verify-operation-local-access.mjs';
const cas = 'conformance/search-compiler/verify-device-js-cas-composition.mjs';
const evaluator = 'conformance/search-compiler/verify-evaluator-program-requirements.mjs';
const sideband = 'conformance/search-compiler/verify-external-control-sideband-authority.mjs';

for (const [path, expected] of [[terminal, 2], [operation, 2], [cas, 2], [evaluator, 2]]) {
  replaceCount(
    path,
    "unit: 'bytes', capacity: '64', alignment: '8', memorySpaces: ['device-search']",
    "unit: 'bytes', capacity: '64', materialization: 'resident-storage', byteLength: '64', alignment: '8', memorySpaces: ['device-search']",
    expected,
  );
}
replaceExact(
  sideband,
  "      capacity: '128',\n      alignment: '8',\n      memorySpaces: ['device-search'],",
  "      capacity: '128',\n      materialization: 'resident-storage',\n      byteLength: '128',\n      alignment: '8',\n      memorySpaces: ['device-search'],",
);

const promotion = 'conformance/search-compiler/verify-promotion-boundary.mjs';
for (const [name, oldSha] of [
  ['resource.mjs', 'a55fd3798dd80539440b7b8818a3a3211cea15f6'],
  ['program-package-core.mjs', 'e2505693b0d9c15ebddb22317d30e6adad976d1d'],
]) {
  const nextSha = execFileSync('git', ['hash-object', `components/search-compiler/src/${name}`], { encoding: 'utf8' }).trim();
  if (!/^[0-9a-f]{40}$/.test(nextSha) || nextSha === oldSha) throw new Error(`${name}: mutated blob hash is invalid or unchanged`);
  replaceExact(promotion, oldSha, nextSha);
}

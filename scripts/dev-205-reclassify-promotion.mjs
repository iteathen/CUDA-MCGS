#!/usr/bin/env node
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

const productionNames = [
  'validation.mjs','foundation.mjs','domain.mjs','graph.mjs','policy.mjs','evaluator.mjs','resource.mjs',
  'progress.mjs','output.mjs','session.mjs','stage.mjs','channel.mjs','program-package.mjs','composer.mjs',
];

const routePath = 'conformance/search-compiler/fixtures/channel-evidence-routes.json';
const routes = JSON.parse(await readFile(routePath, 'utf8'));
if (routes.ownerExperiment !== 'experiments/search-ir-composer-reference') throw new Error('Channel evidence owner baseline drifted');
delete routes.ownerExperiment;
routes.ownerConformance = 'conformance/search-compiler';
await writeFile(routePath, `${JSON.stringify(routes, null, 2)}\n`, 'utf8');

const channelRunner = 'conformance/search-compiler/run-channel-evidence.mjs';
let channel = await readFile(channelRunner, 'utf8');
const oldAssert = "assert.equal(routes.ownerExperiment, 'conformance/search-compiler');";
const newAssert = "assert.equal(routes.ownerConformance, 'conformance/search-compiler');";
if (!channel.includes(oldAssert)) throw new Error('Channel evidence owner assertion baseline drifted');
channel = channel.replace(oldAssert, newAssert);
await writeFile(channelRunner, channel, 'utf8');

const promotionVerifier = 'conformance/search-compiler/verify-promotion-boundary.mjs';
let promotion = await readFile(promotionVerifier, 'utf8');
const promotionLines = promotion.split('\n');
const filtered = promotionLines.filter((line) => !line.includes("source.includes('components/search-compiler/src/')"));
if (filtered.length !== promotionLines.length - 1) throw new Error('promotion verifier self-text check baseline drifted');
await writeFile(promotionVerifier, filtered.join('\n'), 'utf8');

const testingPort = 'components/search-compiler/testing.mjs';
let testing = await readFile(testingPort, 'utf8');
testing = `import { readFile as readSearchCompilerFile } from 'node:fs/promises';\n${testing.trimEnd()}\n\nconst SEARCH_COMPILER_SOURCE_NAMES = new Set(${JSON.stringify(productionNames)});\n\nexport async function readSearchCompilerSource(name) {\n  if (!SEARCH_COMPILER_SOURCE_NAMES.has(name)) throw new Error(\`unknown Search Compiler source: \${name}\`);\n  return readSearchCompilerFile(new URL(\`./src/\${name}\`, import.meta.url), 'utf8');\n}\n`;
await writeFile(testingPort, testing, 'utf8');

const composerRun = 'conformance/search-compiler/run.mjs';
let run = await readFile(composerRun, 'utf8');
run = `import { readSearchCompilerSource } from '../../components/search-compiler/testing.mjs';\n${run}`;
const composerPattern = /await readFile\(path\.join\(experimentRoot,\s*['"]src['"],\s*['"]composer\.mjs['"]\)(?:,\s*['"]utf8['"])?\)/g;
const composerMatches = [...run.matchAll(composerPattern)].length;
if (composerMatches !== 2) throw new Error(`static Composer source-read baseline drifted composer=${composerMatches}`);
run = run.replace(composerPattern, "await readSearchCompilerSource('composer.mjs')");
for (const name of productionNames) {
  run = run.replaceAll(`'experiments/search-ir-composer-reference/src/${name}'`, `'components/search-compiler/src/${name}'`);
  run = run.replaceAll(`'conformance/search-compiler/src/${name}'`, `'components/search-compiler/src/${name}'`);
  run = run.replaceAll(`"experiments/search-ir-composer-reference/src/${name}"`, `"components/search-compiler/src/${name}"`);
  run = run.replaceAll(`"conformance/search-compiler/src/${name}"`, `"components/search-compiler/src/${name}"`);
}
run = run.replaceAll("'experiments/search-ir-composer-reference/src/", "'conformance/search-compiler/src/");
run = run.replaceAll("'experiments/search-ir-composer-reference/run.mjs'", "'conformance/search-compiler/run.mjs'");
const oldSourceLoop = "for (const relative of sourcePaths) {\n  sources[relative] = sourceTextSha256(await readFile(path.join(repositoryRoot, relative)));\n}";
const newSourceLoop = "for (const relative of sourcePaths) {\n  const sourceBytes = relative.startsWith('components/search-compiler/src/')\n    ? Buffer.from(await readSearchCompilerSource(path.basename(relative)), 'utf8')\n    : await readFile(path.join(repositoryRoot, relative));\n  sources[relative] = sourceTextSha256(sourceBytes);\n}";
if (!run.includes(oldSourceLoop)) throw new Error('Composer evidence source loop baseline drifted');
run = run.replace(oldSourceLoop, newSourceLoop);
await writeFile(composerRun, run, 'utf8');

let changed = 0;
for (const file of await walk('experiments/search-semantics-reference')) {
  if (!file.endsWith('.mjs')) continue;
  let source = await readFile(file, 'utf8');
  const before = source;
  source = source.replaceAll("path.join(repositoryRoot, 'experiments', 'search-ir-composer-reference'", "path.join(repositoryRoot, 'conformance', 'search-compiler'");
  if (source !== before) {
    await writeFile(file, source, 'utf8');
    changed += 1;
  }
}
if (changed === 0) throw new Error('no downstream Composer build consumers were rewired');
console.log(`promotion_reclassified=pass downstream_consumer_files_rewired=${changed}`);

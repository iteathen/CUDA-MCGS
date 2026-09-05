import { readFile as readSearchCompilerFile } from 'node:fs/promises';
export * from './index.mjs';
export * from './src/validation.mjs';

const SEARCH_COMPILER_SOURCE_NAMES = new Set(["validation.mjs","foundation.mjs","domain.mjs","graph.mjs","policy.mjs","evaluator.mjs","resource.mjs","progress.mjs","output.mjs","session.mjs","stage.mjs","channel.mjs","program-package.mjs","composer.mjs","diagnostics.mjs"]);

export async function readSearchCompilerSource(name) {
  if (!SEARCH_COMPILER_SOURCE_NAMES.has(name)) throw new Error(`unknown Search Compiler source: ${name}`);
  return readSearchCompilerFile(new URL(`./src/${name}`, import.meta.url), 'utf8');
}

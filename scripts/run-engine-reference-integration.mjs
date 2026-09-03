#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const commands = [
  'scripts/run-search-ir-reference.mjs',
  'scripts/run-search-ir-composer-reference.mjs',
  'experiments/search-ir-composer-reference/verify-operation-local-access.mjs',
  'scripts/export-search-ir-composer-domain-profiles.mjs',
  'scripts/export-search-ir-composer-graph-profiles.mjs',
  'scripts/export-search-ir-composer-policy-profiles.mjs',
  'scripts/export-search-ir-composer-evaluator-profiles.mjs',
  'scripts/export-search-ir-composer-resource-profiles.mjs',
  'scripts/export-search-ir-composer-progress-profiles.mjs',
  'scripts/export-search-ir-composer-output-profiles.mjs',
  'scripts/export-search-ir-composer-session-profiles.mjs',
  'scripts/export-search-ir-composer-stage-profiles.mjs',
  'scripts/run-search-semantics-reference.mjs',
  'scripts/run-graph-node-reference.mjs',
  'scripts/run-graph-edge-reference.mjs',
  'scripts/run-graph-ref-reference.mjs',
  'scripts/run-graph-path-reference.mjs',
  'scripts/run-graph-root-reference.mjs',
  'scripts/run-graph-reclaim-reference.mjs',
  'scripts/run-graph-advance-occurrence-reference.mjs',
  'scripts/run-graph-cleanup-reference.mjs',
  'scripts/run-policy-reference.mjs',
  'scripts/run-evaluator-reference.mjs',
  'scripts/run-resource-reference.mjs',
  'scripts/run-progress-reference.mjs',
  'scripts/run-output-reference.mjs',
  'scripts/run-framework-lifecycle-reference.mjs',
  'scripts/run-terminal-slice-reference.mjs',
  'scripts/run-session-reference.mjs',
  'scripts/run-stage-reference.mjs',
  'scripts/run-channel-reference-evidence.mjs',
];

for (const relative of commands) {
  console.log(`integration_step=${relative}`);
  const result = spawnSync(process.execPath, [path.join(repositoryRoot, relative)], {
    cwd: repositoryRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

await import('../experiments/search-semantics-reference/run-integration-gate.mjs');

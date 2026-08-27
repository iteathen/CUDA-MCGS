import fs from 'node:fs';

function replaceExactlyOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0 || source.indexOf(before, first + 1) >= 0) throw new Error(`expected exactly one ${label} target: ${before}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
}

const migrationFile = 'tools/graph-root-semantic-migration.mjs';
let migration = fs.readFileSync(migrationFile, 'utf8');
migration = replaceExactlyOnce(
  migration,
  'for (const reusable of [...protectionObject.lifecycle.readyStates, ...protectionObject.lifecycle.terminalStates])',
  'for (const terminal of protectionObject.lifecycle.terminalStates)',
  'migration',
);
migration = replaceExactlyOnce(
  migration,
  "hasPrivateReset(protectionObject, reusable)) fail('GRAPH_ROOT_LIFECYCLE', `protection-record state ${reusable} cannot return to free`)",
  "hasPrivateReset(protectionObject, terminal)) fail('GRAPH_ROOT_LIFECYCLE', `protection-record terminal state ${terminal} cannot return to free`)",
  'migration',
);
migration = replaceExactlyOnce(
  migration,
  "protection.lifecycle.transitions = protection.lifecycle.transitions.filter(({ from, to }) => !(from.endsWith('state-ready') && to.endsWith('state-free')))",
  "protection.lifecycle.transitions = protection.lifecycle.transitions.filter(({ from, to }) => !(from.endsWith('state-released') && to.endsWith('state-free')))",
  'migration',
);
fs.writeFileSync(migrationFile, migration);

const composerFile = 'experiments/search-ir-composer-reference/run.mjs';
let composer = fs.readFileSync(composerFile, 'utf8');
composer = replaceExactlyOnce(
  composer,
  "unprotected.resources = unprotected.resources.filter(({ id }) => !id.endsWith('resource-protection-slots'));",
  "unprotected.resources = unprotected.resources.filter(({ pressureOutcome }) => pressureOutcome !== 'protection-capacity');",
  'Composer protection-pressure',
);
fs.writeFileSync(composerFile, composer);

import fs from 'node:fs';

const file = 'tools/graph-root-semantic-migration.mjs';
let source = fs.readFileSync(file, 'utf8');

function replaceOnce(before, after) {
  const first = source.indexOf(before);
  if (first < 0 || source.indexOf(before, first + 1) >= 0) throw new Error(`expected exactly one correction target: ${before}`);
  source = source.slice(0, first) + after + source.slice(first + before.length);
}

replaceOnce(
  "  for (const reusable of [...protectionObject.lifecycle.readyStates, ...protectionObject.lifecycle.terminalStates]) {\n    if (!hasPrivateReset(protectionObject, reusable)) fail('GRAPH_ROOT_LIFECYCLE', `protection-record state ${reusable} cannot return to free`);\n  }",
  "  for (const terminal of protectionObject.lifecycle.terminalStates) {\n    if (!hasPrivateReset(protectionObject, terminal)) fail('GRAPH_ROOT_LIFECYCLE', `protection-record terminal state ${terminal} cannot return to free`);\n  }",
);
replaceOnce(
  "  protection.lifecycle.transitions = protection.lifecycle.transitions.filter(({ from, to }) => !(from.endsWith('state-ready') && to.endsWith('state-free')));",
  "  protection.lifecycle.transitions = protection.lifecycle.transitions.filter(({ from, to }) => !(from.endsWith('state-released') && to.endsWith('state-free')));",
);

fs.writeFileSync(file, source);

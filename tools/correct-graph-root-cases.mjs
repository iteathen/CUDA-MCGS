import fs from 'node:fs';

const file = 'experiments/search-semantics-reference/src/graph-root-cases.mjs';
let source = fs.readFileSync(file, 'utf8');

function replaceOnce(before, after) {
  const first = source.indexOf(before);
  if (first < 0 || source.indexOf(before, first + 1) >= 0) throw new Error(`expected exactly one ROOT-case correction target: ${before}`);
  source = source.slice(0, first) + after + source.slice(first + before.length);
}

replaceOnce(
  "function heldProtections(refSnapshot, reference = null) {\n  return refSnapshot.protections.filter((entry) => entry.state === 'held'\n    && (reference === null || JSON.stringify(entry.reference) === JSON.stringify(reference)));\n}",
  "function sameReference(left, right) {\n  return left?.kind === right?.kind\n    && left?.arena === right?.arena\n    && left?.slot === right?.slot\n    && left?.generation === right?.generation;\n}\n\nfunction heldProtections(refSnapshot, reference = null) {\n  return refSnapshot.protections.filter((entry) => entry.state === 'held'\n    && (reference === null || sameReference(entry.reference, reference)));\n}",
);
replaceOnce(
  "  assert.equal(rootControl.root.kind, 'selected');\n  assert.equal(rootControl.root.profile.establishment, 'domain-validated-graph-owned');",
  "  assert.equal(rootControl.root.establishment, 'pre-ignition-validate-admit-materialize');\n  assert.equal(rootControl.root.publication, 'release-after-full-initialization');\n  assert.equal(typeof rootControl.root.validationOwner, 'string');\n  assert.equal(typeof rootControl.root.graphOwner, 'string');\n  assert.notEqual(rootControl.root.validationOwner, rootControl.root.graphOwner);",
);
replaceOnce(
  "  assert.equal(rootControl.advance.profile.stateTraversal, 'none');",
  "  assert.equal(rootControl.advance.profile.graphTraversal, 'none');",
);
replaceOnce(
  "  assert.equal(rootControl.advance.profile.stateCopy, 'none');",
  "  assert.equal(rootControl.advance.profile.semanticStateCopy, 'none');",
);
replaceOnce(
  "  assert.equal(rootControl.advance.profile.stateReset, 'none');",
  "  assert.equal(rootControl.advance.profile.reset, 'none');",
);
replaceOnce(
  "  assert.equal(rootControl.advance.profile.resourceResize, 'none');",
  "  assert.equal(rootControl.advance.profile.resize, 'none');",
);
replaceOnce(
  "      root: rootControl.root.profile.establishment,",
  "      root: rootControl.root.establishment,",
);

fs.writeFileSync(file, source);

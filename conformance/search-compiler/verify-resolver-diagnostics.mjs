import assert from 'node:assert/strict';

import {
  composerConstants,
  tryCreateResolvedComposerInput,
} from '../../components/search-compiler/testing.mjs';

const failure = tryCreateResolvedComposerInput({}, structuredClone(composerConstants.referenceGenerator));
assert.deepEqual(Object.keys(failure).sort(), ['diagnostic', 'resolvedInput', 'status']);
assert.equal(failure.status, 'failure');
assert.equal(failure.resolvedInput, null);
assert.equal(typeof failure.diagnostic?.code, 'string');
assert.equal(typeof failure.diagnostic?.message, 'string');
assert.equal(Object.isFrozen(failure), true);
assert.equal(Object.isFrozen(failure.diagnostic), true);

const sentinel = new Error('unexpected resolver input failure');
const explosiveInput = new Proxy({}, {
  ownKeys() {
    throw sentinel;
  },
});
assert.throws(
  () => tryCreateResolvedComposerInput(explosiveInput, structuredClone(composerConstants.referenceGenerator)),
  (error) => error === sentinel,
  'tryCreateResolvedComposerInput must not relabel unexpected exceptions as validation diagnostics',
);

console.log('Search Compiler resolver diagnostic ownership: pass');

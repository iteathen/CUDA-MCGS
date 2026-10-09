import assert from 'node:assert/strict';

// #205's original promotion hashes remain immutable in the historical verifier.
// This distinct prerelease selects the closed continuation/compilation projection
// changes, whose current bytes receive independent exact pins and semantic tests.
export const selectedSourceEvolution=Object.freeze({version:'0.0.0-dev.1',changes:Object.freeze({
  'program-package-core.mjs':Object.freeze({historical:'b1e1b42e50f8d5b09a8961d3b71fb64dab0f13cb',selected:'411eeea596a48e96160459a5393abab53e9eb54b',meaning:'operation reachable-call launch constraints, closed controller metadata and selected Session cancellation projection'}),
  'program-package.mjs':Object.freeze({historical:'19c061984cbc75cb25c0486336f5d0d31417d00e',selected:'784848c1a2fd896d537a7e6ad287e3f06b617b6f',meaning:'canonical continuation, actual public capability bytes and closed local Device-JS library partition'}),
  'composer-core.mjs':Object.freeze({historical:'4300814d638c58d983564d186e85f7c5ffa06e7e',selected:'37a69765ff852dc9ae937ed73b72fc8566ba4057',meaning:'closed optional selected physical realization data in resolved Composer inputs'}),
  'composer.mjs':Object.freeze({historical:'18f7215c4a1ddbff29bb79fc2dafab821faa75c5',selected:'ff718a7e1511650b4f0eb557754c0e46f5e3317d',meaning:'declared public projection of the added optional Composer fields'}),
})});
export function assertSelectedSourceBlob(name,historical,actual,version){
  const change=selectedSourceEvolution.changes[name];
  if(!change){assert.equal(actual,historical,`unregistered promoted source drift: ${name}`);return;}
  assert.equal(historical,change.historical,`historical promotion pin changed: ${name}`);
  assert.equal(version,selectedSourceEvolution.version,'selected source evolution requires its distinct prerelease');
  assert.notEqual(change.selected,change.historical,'new selection must not erase the historical distinction');
  assert.equal(actual,change.selected,`selected source blob drift: ${name}`);
}

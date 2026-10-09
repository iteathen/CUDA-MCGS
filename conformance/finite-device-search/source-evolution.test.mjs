import test from 'node:test';
import assert from 'node:assert/strict';
import {assertSelectedSourceBlob,selectedSourceEvolution} from '../search-compiler/selected-source-evolution.mjs';
test('selected prerelease pins keep historical promotion immutable and reject old/current byte substitution',()=>{
  for(const [name,pin]of Object.entries(selectedSourceEvolution.changes)){
    assert.doesNotThrow(()=>assertSelectedSourceBlob(name,pin.historical,pin.selected,'0.0.0-dev.1'));
    assert.doesNotThrow(()=>assertSelectedSourceBlob(name,pin.historical,pin.selected,'0.0.0-dev.2'));
    assert.throws(()=>assertSelectedSourceBlob(name,pin.historical,pin.historical,'0.0.0-dev.1'));
    assert.throws(()=>assertSelectedSourceBlob(name,pin.historical,pin.selected,'0.0.0-dev.0'));
    assert.throws(()=>assertSelectedSourceBlob(name,pin.historical,pin.selected,'0.0.0-dev.99'));
    assert.throws(()=>assertSelectedSourceBlob(name,'0'.repeat(40),pin.selected,'0.0.0-dev.1'));
  }
  assert.throws(()=>assertSelectedSourceBlob('unknown.mjs','a','b','0.0.0-dev.1'));
});

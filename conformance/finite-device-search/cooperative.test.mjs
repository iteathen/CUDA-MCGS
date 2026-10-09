import assert from 'node:assert/strict';
import test from 'node:test';
import * as compiler from '../../components/search-compiler/index.mjs';
import {fixtureContext} from './fixture.mjs';
import {cooperativePolicyModule} from './cooperative-fixture.mjs';
import {composeFiniteFixture} from './composition.mjs';
const native=await import('./native.mjs').catch(()=>({}));

test('cooperative core publishes its exact typed callback ABI',()=>{
  assert.equal(typeof compiler.createCooperativeDeviceSearchCore,'function');
  assert.equal(compiler.cooperativeDeviceSearchContract.hooks.initializeNode.parameters.length,6);
  assert.equal(compiler.cooperativeDeviceSearchContract.hooks.frontier.parameters.length,23);
  assert.equal(compiler.cooperativeDeviceSearchContract.hooks.apply.parameters.length,28);
  assert.deepEqual(compiler.cooperativeDeviceSearchContract.participation,{kind:'collective-block',blockSize:32});
});

test('cooperative full-context module composes through the canonical Composer',()=>{
  const {program,core}=composeFiniteFixture({cooperative:true});
  assert.equal(program.normalized.functions.find(f=>f.name==='finiteSearch').launchConstraint.block[0],'32');
  assert.ok(program.normalized.source.includes(core.programContributions[1].source.trim()));
});

test('physical block32 frontier visits every participant and preserves diamond backups',{skip:process.env.MCGS_FINITE_NATIVE!=='1'},async()=>{
  const result=await native.runFiniteFixture({cooperative:true});
  assert.equal(result.output[0],1);assert.deepEqual(result.nodeVisits,[4,2,2,4]);assert.deepEqual(result.edgeVisits,[2,2,2,2]);assert.deepEqual(result.nodeValues,[20,10,10,20]);
  const stride=result.layout.nodeF32Words;assert.deepEqual(Array.from({length:result.meta[0]},(_,i)=>result.policyF32[i*stride+1]),[128,64,64,0]);
  assert.equal(result.meta[16],result.meta[17]);assert.equal(result.meta[18],result.meta[19]);assert.equal(result.terminal.graceful,true);
});

test('physical collective mismatch/failure rejects partial copied frontier updates',{skip:process.env.MCGS_FINITE_NATIVE!=='1'},async()=>{
  for(const options of [{mismatch:true},{fail:true}]){
    const result=await native.runFiniteFixture({cooperative:true,...options});
    assert.equal(result.output[0],8);assert.equal(result.meta[3],0);assert.equal(result.meta[4],1);assert.equal(result.policyF32[1],0);assert.equal(result.meta[16],result.meta[17]);assert.equal(result.terminal.graceful,true);
  }
});

test('physical depth frontier receives the complete legal action and child-owner view',{skip:process.env.MCGS_FINITE_NATIVE!=='1'},async()=>{
  const result=await native.runFiniteFixture({cooperative:true,depth:1,iterations:1});
  assert.equal(result.output[0],1);assert.equal(result.meta[0],3);assert.equal(result.meta[1],2);assert.equal(result.nodeVisits[0],1);assert.equal(result.nodeValues[0],9);
});

test('cooperative normalized frontier has complete bounded views and cold launch rejection',()=>{
  const context=fixtureContext({policyModule:cooperativePolicyModule()});
  const core=compiler.createCooperativeDeviceSearchCore(context,{name:'cooperativeSearch',maxIterations:4});
  assert.equal(core.buffers.length,10);assert.ok(core.layout.viewU32Words>0);assert.deepEqual(core.launch,compiler.cooperativeDeviceSearchContract.launch);
  assert.equal(core.programContributions[1].functions.at(-1).launchConstraint.block[0],'32');
  const wrong=structuredClone(context);wrong.sourceBundles[1].functions.find(f=>f.name==='fcFrontier').participation.blockSize=1;
  assert.throws(()=>compiler.createCooperativeDeviceSearchCore(wrong,{name:'cooperativeSearch',maxIterations:4}),/participation|launch/i);
});

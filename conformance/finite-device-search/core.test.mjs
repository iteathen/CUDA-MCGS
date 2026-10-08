import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import { readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as compiler from '../../components/search-compiler/index.mjs';
import { fixtureContext } from './fixture.mjs';
import { expectedDiamond } from './oracle.mjs';
import { composeFiniteFixture } from './composition.mjs';
const native = await import('./native.mjs').catch(()=>({}));
after(async()=>{
  if(process.env.MCGS_FINITE_EVIDENCE){
    assert.equal(process.version,'v26.11.1');
    const sources={};
    for(const path of ['components/search-compiler/src/finite-device-search.mjs','conformance/finite-device-search/fixture.mjs','conformance/finite-device-search/composition.mjs','conformance/finite-device-search/native.mjs','conformance/finite-device-search/core.test.mjs','conformance/finite-device-search/oracle.mjs'])sources[path]=createHash('sha256').update(await readFile(path)).digest('hex');
    const payloadHash=words=>createHash('sha256').update(new Uint8Array(new Uint32Array(words).buffer)).digest('hex');
    const results=native.evidenceResults.map(({states,actions,policyU32,policyF32,meta,...facts})=>({...facts,controls:meta.slice(0,32),graphMetadata:{nodes:meta.slice(facts.layout.nodeMeta,facts.layout.nodeMeta+meta[0]*8),edges:meta.slice(facts.layout.edgeMeta,facts.layout.edgeMeta+meta[1]*8)},residentPayloadHashes:{states:payloadHash(states),actions:payloadHash(actions),metadata:payloadHash(meta),policyU32:payloadHash(policyU32),policyF32:createHash('sha256').update(new Uint8Array(new Float32Array(policyF32).buffer)).digest('hex')}}));
    await writeFile(process.env.MCGS_FINITE_EVIDENCE,JSON.stringify({schema:'cuda-mcgs.finite-device-search-evidence/0.1.0',node:process.version,cudaJs:{version:'0.1.0-alpha.21',revision:'2bff226b752d3c0af8b9185274d411e5990008d4'},mcgsBase:'7aa789fd2f3d6fa49a30e00d1ab9c2186eab88e5',scope:'One scalar-controller finite operation; no reclamation, active host search, live focus, continuation or product engine claim',sources,results},null,2)+'\n');
  }
});

test('canonical Composer closes real source identities and preserves typed finite core calls',()=>{
  const {program,programPackage,core}=composeFiniteFixture();
  assert.ok(program.normalized.functions.find(f=>f.name==='engine_step').calls.includes('finiteSearch'));
  assert.deepEqual(program.normalized.functions.find(f=>f.name==='finiteSearch').launchConstraint,core.launch);
  assert.equal(programPackage.normalized.operations[0].bindings.length,12);
  assert.ok(core.programContributions.every(c=>program.normalized.source.includes(c.source.trim())));
});

test('finite search generation binds normalized owners and rejects unowned or unbounded hooks',()=>{
  assert.equal(typeof compiler.createFiniteDeviceSearchCore,'function','canonical Search Compiler finite core contribution must exist');
  const context=fixtureContext();
  const core=compiler.createFiniteDeviceSearchCore(context,{name:'finiteSearch',maxIterations:4});
  assert.equal(core.layout.stateWords,64);
  assert.equal(core.layout.actionWords,16);
  assert.ok(core.source && core.functions.length);
  assert.throws(()=>compiler.createFiniteDeviceSearchCore(context,{name:'finiteSearch',maxIterations:Infinity}),/finite|bound/i);
  const changed=structuredClone(context);changed.sourceBundles[0].ownerProfile='domain.unselected';
  assert.throws(()=>compiler.createFiniteDeviceSearchCore(changed,{name:'finiteSearch',maxIterations:4}),/owner|selected/i);
  assert.throws(()=>compiler.createFiniteDeviceSearchCore(context,{name:'finiteSearch',maxIterations:4,frontierParticipation:{kind:'collective-block',blockSize:32}}),/collective|participation/i);
  const alternate=fixtureContext({nodes:8});alternate.resource=context.resource;
  assert.throws(()=>compiler.createFiniteDeviceSearchCore(alternate,{name:'finiteSearch',maxIterations:4}),/owner|resource|identity/i,'selected Resource plan must bind current semantic owners');
  const wrongPort=structuredClone(context);wrongPort.hooks.frontier.port='select-next';
  assert.throws(()=>compiler.createFiniteDeviceSearchCore(wrongPort,{name:'finiteSearch',maxIterations:4}),/port|hook/i);
  const missingParticipation=structuredClone(context);delete missingParticipation.sourceBundles[1].functions.find(f=>f.name==='fpFrontier').participation;
  assert.throws(()=>compiler.createFiniteDeviceSearchCore(missingParticipation,{name:'finiteSearch',maxIterations:4}),/participation/i);
  assert.equal(core.functions.at(-1).kind,'device','core is a device-callable contribution to the existing Composer');
  assert.equal(core.programContributions.length,2);
  assert.equal(core.programContributions[1].functions[0].launchConstraint.block[0],'1');
  assert.ok(core.programContributions[1].functions[0].helpers.includes('gpu.mailbox.loadAcquireSystem'));
  assert.ok(core.buffers.every(b=>Number.isSafeInteger(b.elements)&&b.elements>0));
});

test('physical finite search executes a diamond with verified collision equality and exact parent-edge backup',{skip:process.env.MCGS_FINITE_NATIVE!=='1'},async()=>{
  assert.equal(typeof native.runFiniteFixture,'function','physical finite search runner must exist');
  const result=await native.runFiniteFixture({kind:0,iterations:4});
  assert.equal(result.output[0],1);
  assert.equal(result.meta[0],4); assert.equal(result.meta[1],4);
  assert.equal(result.meta[3],4);assert.equal(result.meta[4],0);
  assert.equal(result.meta[16],result.meta[17]);assert.equal(result.meta[18],result.meta[19]);assert.equal(result.meta[9],0);assert.equal(result.meta[23],0);
  const expected=expectedDiamond();
  assert.deepEqual(result.nodeVisits,expected.visits);assert.deepEqual(result.nodeValues,expected.values);
  assert.deepEqual(result.edgeVisits,expected.edgeVisits);assert.deepEqual(result.edgeValues,expected.edgeValues);
  assert.equal(result.output[24],1);assert.equal(result.output[32],0);
  assert.ok(result.meta[21]>0);assert.equal(result.terminal.graceful,true);
});

test('physical tree, terminal, cycle cut, pressure and stale/cancel cases preserve closure',{skip:process.env.MCGS_FINITE_NATIVE!=='1'},async()=>{
  assert.equal(typeof native.runFiniteFixture,'function','physical finite search runner must exist');
  const tree=await native.runFiniteFixture({kind:1,iterations:4});
  assert.deepEqual(tree.nodeVisits,[4,2,2]);assert.deepEqual(tree.nodeValues,[60,20,40]);
  const terminal=await native.runFiniteFixture({kind:3,iterations:2});assert.deepEqual(terminal.nodeVisits,[2]);assert.deepEqual(terminal.nodeValues,[14]);assert.equal(terminal.output[24],0);
  const cycle=await native.runFiniteFixture({kind:4,iterations:2});assert.equal(cycle.meta[0],1);assert.equal(cycle.meta[1],1);assert.deepEqual(cycle.nodeVisits,[4]);assert.deepEqual(cycle.edgeVisits,[2]);assert.deepEqual(cycle.nodeValues,[36]);
  const pressure=await native.runFiniteFixture({nodes:2,kind:0,iterations:4});assert.equal(pressure.output[0],3);assert.equal(pressure.meta[0],1);assert.equal(pressure.meta[1],0);assert.equal(pressure.meta[4],1);assert.equal(pressure.meta[16],pressure.meta[17]);
  const edgePressure=await native.runFiniteFixture({edges:1,kind:0,iterations:4});assert.equal(edgePressure.output[0],4);assert.equal(edgePressure.meta[0],1);assert.equal(edgePressure.meta[1],0);
  const cancelled=await native.runFiniteFixture({cancel:1,iterations:4});assert.equal(cancelled.output[0],2);assert.equal(cancelled.meta[3],0);assert.equal(cancelled.meta[9],0);
  const stale=await native.runFiniteFixture({rootGeneration:2,iterations:4});assert.equal(stale.output[0],6);assert.equal(stale.meta[0],0,'stale reference must reject without graph mutation');
  const wrongEpoch=await native.runFiniteFixture({focusEpoch:2,iterations:4});assert.equal(wrongEpoch.output[0],6);assert.equal(wrongEpoch.meta[0],0);
  assert.ok([tree,terminal,cycle,pressure,edgePressure,cancelled,stale,wrongEpoch].every(r=>r.terminal.graceful));
});

test('physical failed preparation abandons and partial backup quarantines without false completion',{skip:process.env.MCGS_FINITE_NATIVE!=='1'},async()=>{
  const abandoned=await native.runFiniteFixture({fault:'prepare'});assert.equal(abandoned.output[0],8);assert.equal(abandoned.meta[3],0);assert.equal(abandoned.meta[4],1);assert.ok(abandoned.nodeVisits.every(n=>n===0));
  const quarantined=await native.runFiniteFixture({fault:'backup'});assert.equal(quarantined.output[0],11);assert.equal(quarantined.meta[3],0);assert.equal(quarantined.meta[26],1);assert.equal(quarantined.output[24],0);assert.equal(quarantined.meta[16],quarantined.meta[17]);assert.equal(quarantined.meta[18],quarantined.meta[19]);
  const exhausted=await native.runFiniteFixture({initialWorkId:0xfffffffe});assert.equal(exhausted.output[0],10);assert.equal(exhausted.meta[2],0xfffffffe);assert.equal(exhausted.meta[9],0);
  const reservation=await native.runFiniteFixture({fault:'reserve'});assert.equal(reservation.output[0],8);assert.equal(reservation.meta[4],1);assert.equal(reservation.meta[18],0);assert.equal(reservation.meta[19],0);assert.equal(reservation.meta[16],reservation.meta[17]);
  const decision=await native.runFiniteFixture({fault:'decision-view'});assert.deepEqual(decision.edgeVisits,[2,2,2,2]);assert.deepEqual(decision.edgeValues,[10,10,10,10]);assert.equal(decision.output[24],1);
  assert.ok([abandoned,quarantined,exhausted,reservation,decision].every(r=>r.terminal.graceful));
});

test('physical external cancellation abandons an active frontier and drains an irreversible backup',{skip:process.env.MCGS_FINITE_NATIVE!=='1'},async()=>{
  const abandoned=await native.runFiniteFixture({slow:'frontier',cancelDelayMilliseconds:2});assert.equal(abandoned.output[0],2);assert.equal(abandoned.meta[3],0);assert.equal(abandoned.meta[4],1);assert.equal(abandoned.meta[16],abandoned.meta[17]);assert.equal(abandoned.meta[18],abandoned.meta[19]);
  const drained=await native.runFiniteFixture({slow:'backup',cancelDelayMilliseconds:2});assert.equal(drained.output[0],2);assert.equal(drained.meta[3],1);assert.equal(drained.meta[4],0);assert.equal(drained.meta[13],2);assert.equal(drained.meta[9],0);assert.equal(drained.meta[16],drained.meta[17]);assert.equal(drained.meta[18],drained.meta[19]);
  assert.equal(abandoned.terminal.graceful&&drained.terminal.graceful,true);
});

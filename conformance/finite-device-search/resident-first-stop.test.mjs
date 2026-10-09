import test from 'node:test';
import assert from 'node:assert/strict';
import {generateResidentEntries} from '../../components/search-compiler/src/resident-entries.mjs';
const L={maxActions:2,actionWords:1,stateWords:4,nodeMeta:128,scratchU32Words:32};
function controller({cancelled=false,prior=0,disposeFailure=false,consumeFailure=0}={}){
 const runtime={device:{functions:[{name:'mcgsTensorEvaluatorCancel',parameters:[]}]},state:{requestControl32:{slotState:0},batchControl32:{batchState:0}}};
 const generated=generateResidentEntries('r',L,[{name:'mcgsEvalRequestControl32',type:'ptr<u32>'},{name:'mcgsEvalBatchControl32',type:'ptr<u32>'}],runtime,'1');
 const fn=generated.functions.progress.find(f=>f.name==='r_controller');
 const values=Object.fromEntries(fn.parameters.map(p=>[p.name,p.type==='ptr<u64>'?new BigUint64Array(4):p.type==='ptr<f32>'?new Float32Array(512):new Uint32Array(512)]));
 values.m[17]=prior;values.m[44]=1;values.authority[16]=cancelled?1:0;
 const gpu={u32:x=>x>>>0,u64:BigInt,atomic:{loadAcquireDevice:(a,i)=>a[i]},execution:{tailSelf:()=>assert.fail('bounded stop must not repeat')}};
 const stubs=`function r_progress_consume(m){${consumeFailure?'m[17]='+consumeFailure+';':''}}function r_progress_advance(){}function r_progress_dispose(m){m[44]=0;${disposeFailure?'m[17]=11;':''}}function r_output_publish(){return 0;}function r_output_terminal(){}function r_output_terminalFacts(m,out,r,b,c){out[23]=c;out[${32+L.maxActions*(L.actionWords+5)}]=m[83];}function mcgsTensorEvaluatorCancel(){return 0;}`;
 const functions=new Function('gpu',stubs+generated.source.progress+'\nreturn {r_controller};')(gpu);
 functions.r_controller(...fn.parameters.map(p=>values[p.name]));return values;
}
test('cancellation remains the first authoritative stop when disposal fails',()=>{
 const q=controller({cancelled:true,disposeFailure:true});assert.equal(q.out[23],2);assert.equal(q.out[44],11);
});
test('an earlier failure remains authoritative when consume and disposal fail later',()=>{
 const q=controller({prior:8,consumeFailure:9,disposeFailure:true});assert.equal(q.out[23],8);assert.equal(q.out[44],11);
});

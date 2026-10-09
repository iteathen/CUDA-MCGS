import assert from 'node:assert/strict';
import test from 'node:test';
import {generateResidentProgress} from '../../components/search-compiler/src/resident-progress.mjs';
import {graphFixture} from './resident-graph.test.mjs';
import {collectiveContribution} from '../cuda-js-tensor-evaluator/collective.mjs';
import {residentDeviceSearchContract} from '../../components/search-compiler/index.mjs';

function fixture(kind=0){
  const q=graphFixture({nodes:8,edges:16}),L={...q.L,maxWork:100,commandStateBase:q.L.stagedState},runtime=collectiveContribution(2),H={};
  const bodies={initializeNode:'',initializeCandidate:'',encodeEvaluation:'for(let i=gpu.u32(0);i<gpu.u32(32);i++){encoded[encodedBase+i]=gpu.cast.f32(state[stateBase])+gpu.f32(1);}return gpu.u32(0);',consumeEvaluation:'node[nodeBase+gpu.u32(3)]=gpu.u32(1);nodeNumeric[nodeNumericBase+gpu.u32(2)]=results[resultsBase];value[valueBase]=results[resultsBase];return gpu.u32(0);',classifyFrontier:'if(node[nodeBase+gpu.u32(3)]===gpu.u32(0)){return gpu.u32(2);}if(reason===gpu.u32(0)){return gpu.u32(1);}value[valueBase]=gpu.f32(9);return gpu.u32(0);',terminalValue:'node[nodeBase+gpu.u32(3)]=gpu.u32(1);value[valueBase]=gpu.cast.f32(outcome[outcomeBase]);return gpu.u32(0);',valueValid:'return value[valueBase]===value[valueBase];',select:'let best=gpu.u32(0);for(let j=gpu.u32(1);j<count;j++){if(edges[edgesBase+j*gpu.u32(4)]<edges[edgesBase+best*gpu.u32(4)]){best=j;}}return best;',reserve:'if(edge[edgeBase+gpu.u32(1)]!==gpu.u32(0)){return gpu.u32(1);}edge[edgeBase+gpu.u32(1)]=work+gpu.u32(1);return gpu.u32(0);',release:'if(edge[edgeBase+gpu.u32(1)]===work+gpu.u32(1)){edge[edgeBase+gpu.u32(1)]=gpu.u32(0);}',prepare:'if(node[nodeBase+gpu.u32(1)]!==gpu.u32(0)){return gpu.u32(1);}node[nodeBase+gpu.u32(1)]=work+gpu.u32(1);return gpu.u32(0);',apply:'if(policy[nodeBase+gpu.u32(1)]!==work+gpu.u32(1)){return gpu.u32(1);}policy[nodeBase]=policy[nodeBase]+gpu.u32(1);numeric[nodeNumericBase]=numeric[nodeNumericBase]+value[valueBase];if(incomingBase!==gpu.u32(4294967295)){policy[incomingBase]=policy[incomingBase]+gpu.u32(1);numeric[incomingNumericBase]=numeric[incomingNumericBase]+value[valueBase];}return gpu.u32(0);',complete:'node[nodeBase+gpu.u32(1)]=gpu.u32(0);node[nodeBase+gpu.u32(2)]=work+gpu.u32(1);',abandon:'if(node[nodeBase+gpu.u32(1)]===work+gpu.u32(1)){node[nodeBase+gpu.u32(1)]=gpu.u32(0);}',evaluateStop:'return gpu.u32(0);'};
  let policy='';for(const [key,body]of Object.entries(bodies)){if(!body)continue;const contract=residentDeviceSearchContract.hooks[key];assert(contract,key);const symbol='toy_'+key;policy+=`function ${symbol}(${contract.parameters.map(p=>p.name).join(',')}){${body}}\n`;H[key]=(...a)=>`${symbol}(${a.join(',')})`;}
  H.terminal=(...a)=>`domainTerminal(${a.join(',')})`;H.relation=(...a)=>`domainRelation(${a.join(',')})`;
  const params=[...runtime.resources,...runtime.tensorBindings].map(r=>({name:r.parameterName,type:`ptr<${r.dtype}>`}));
  const generated=generateResidentProgress('rp','rg',L,H,params,runtime);
  const values=Object.fromEntries([...runtime.resources,...runtime.tensorBindings].map(r=>[r.parameterName,r.dtype==='u64'?new BigUint64Array(r.elementCount):r.dtype==='f32'?new Float32Array(r.elementCount):new Uint32Array(r.elementCount)]));
  const gpu={u32:x=>Number(x)>>>0,u64:BigInt,f32:Math.fround,cast:{f32:Math.fround},thread:{x:()=>0},barrier:{block:()=>{}},atomic:{loadAcquireDevice:(p,i)=>p[i],storeReleaseDevice:(p,i,v)=>p[i]=v,cas:(p,i,a,b)=>{const old=p[i];if(old===a)p[i]=b;return old;},add:(p,i,v)=>{const old=p[i];p[i]=old+v;return old;}}};
  const stub='function domainTerminal(s,b,o,ob){if(s[b]===3&&s[b+1]===0){o[ob]=5;return 1;}return 0;}function domainRelation(s,b,a,ab){return s[b]===a[ab]&&s[b+1]===4?1:0;}function mcgsTensorRunItem(){return gpu.u32(0);}';
  const names=Object.keys(q.fn),functions=new Function('gpu',...names,stub+policy+runtime.device.source+generated.source+'\nreturn {'+generated.functions.map(f=>f.name).join(',')+'};')(gpu,...names.map(n=>q.fn[n]));
  const vu=new Uint32Array(L.viewU32Words),vf=new Float32Array(L.viewF32Words),sf=new Float32Array(L.valueWords);
  const extra=params.map(p=>values[p.name]);const q64=new BigUint64Array(4),args=[q.m,q.s,q.a,q.p,q.f,q.su,sf,vu,vf,q64,...extra];
  const root=q.admit(0,kind);q.m[2]=root;q.m[3]=1;q.m[4]=1;
  return {...q,L,runtime,values,functions,vu,vf,sf,args,advance(){return functions.rp_advance(...args);},completeReady(){const r32=runtime.state.requestControl32;q.m[27]=0;values.mcgsEvalRequestControl32[r32.slotState]=5;values.mcgsEvalResultOutput_f32[0]=(q.s[q.m[24]*64]+1)*2;return functions.rp_consume(...args);}};
}
test('persistent independent diamond progresses through repeated exact Evaluator-ready requests and backups',()=>{
  const q=fixture();for(let i=0;i<4;i++){q.advance();if(q.m[20])q.completeReady();}
  assert.equal(q.m[5],4);assert.equal(q.m[6],4);assert.equal(q.m[28],4);assert.equal(q.m[29],0);assert.equal(q.p[0],4);assert.equal(q.f[0],17);assert.equal(q.m[19],0);assert.equal(q.m[20],0);assert.equal(q.m[46],q.m[47]);assert.equal(q.m[32],q.m[33]);
  assert.equal(q.m[q.L.nodeMeta+12],4);assert.equal(q.m[73],3);assert.equal(q.m[74],3);
  assert.equal(q.m[80],0);assert.equal(q.m[81],0);
  for(let n=0;n<q.m[7];n++){assert.equal(q.m[q.L.nodeMeta+n*16+6],0);assert.equal(q.m[q.L.nodeMeta+n*16+7],0);assert.equal(q.p[n*4+1],0);}
});
test('self-cycle prepares/completes each distinct node once while backing up distinct occurrences',()=>{
  const q=fixture(4);q.advance();q.completeReady();q.advance();assert.equal(q.m[28],2);assert.equal(q.p[0],3);assert.equal(q.f[0],20);assert.equal(q.p[q.L.edgePolicyU32],1);assert.equal(q.f[q.L.edgePolicyF32],9);assert.equal(q.p[1],0);
});
test('cancellation abandons protected request/path exactly once without adding visits',()=>{
  const q=fixture();q.advance();assert.equal(q.m[20],1);assert.equal(q.m[80],1);assert.equal(q.m[81],1);q.values.mcgsEvalRequestControl32[q.runtime.state.requestControl32.slotState]=7;q.m[27]=6;q.functions.rp_consume(...q.args);assert.equal(q.m[28],0);assert.equal(q.m[29],1);assert.equal(q.p[0],0);assert.equal(q.m[46],q.m[47]);assert.equal(q.m[19],0);assert.equal(q.m[20],0);assert.equal(q.m[q.L.nodeMeta+12],0);assert.equal(q.m[73],1);assert.equal(q.m[74],0);assert.equal(q.m[80],0);assert.equal(q.m[81],0);
});
test('failed backup preparation remains first stop when its nested disposal fails',()=>{
  const q=fixture();q.advance();q.p[1]=77;q.m[q.L.nodeMeta+6]=0;
  assert.equal(q.functions.rp_backup(...q.args),8);
  assert.equal(q.m[17],11);assert.equal(q.m[82],8);assert.equal(q.m[83],11);
});
test('node disposition flags record accepted ready results and later ordinary Policy traversal only',()=>{
  const q=fixture(),at=q.L.nodeMeta+15;
  q.advance();assert.equal(q.m[at],0);q.completeReady();assert.equal(q.m[at],1);
  q.advance();assert.equal(q.m[at],3);
});
test('ready rejection and traversal without prior acceptance cannot mint acceptance/reuse facts',()=>{
  const q=fixture();q.advance();q.values.mcgsEvalRequestControl32[q.runtime.state.requestControl32.slotState]=5;q.values.mcgsEvalResultOutput_f32[0]=NaN;
  q.functions.rp_consume(...q.args);assert.equal(q.m[q.L.nodeMeta+14],1);assert.equal(q.m[q.L.nodeMeta+15],0);
  const cold=fixture();cold.p[3]=1;cold.advance();assert.equal(cold.m[cold.L.nodeMeta+15],0);
});

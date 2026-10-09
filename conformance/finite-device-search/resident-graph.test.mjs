import assert from 'node:assert/strict';
import test from 'node:test';
import {createResidentGraphLayout,generateResidentGraph} from '../../components/search-compiler/src/resident-graph.mjs';
import {domainSource,domainFunctions} from './fixture.mjs';

const H={validateRoot:(...a)=>`fdValid(${a.join(',')})`,key:(...a)=>`fdKey(${a.join(',')})`,equalState:(...a)=>`fdEqual(${a.join(',')})`,actions:(...a)=>`fdActions(${a.join(',')})`,actionValid:(...a)=>`fdActionValid(${a.join(',')})`,actionEqual:(...a)=>`fdActionEqual(${a.join(',')})`,transition:(...a)=>`fdTransition(${a.join(',')})`,terminal:(...a)=>`fdTerminal(${a.join(',')})`,initializeNode:(...a)=>`toyInitNode(${a.join(',')})`,initializeCandidate:(...a)=>`toyInitCandidate(${a.join(',')})`,retirePolicy:(...a)=>`toyRetire(${a.join(',')})`};
export function graphFixture({nodes=4,edges=8,maxActions=2,ttCapacity=8,ttProbes=8}={}){
  const L=createResidentGraphLayout({nodeCapacity:nodes,edgeCapacity:edges,maxActions,ttCapacity,ttProbes,stateWords:64,actionWords:16,outcomeWords:1,pathDepth:8,nodeU32Words:4,edgeU32Words:4,nodeF32Words:4,edgeF32Words:4,valueWords:1});
  const module=generateResidentGraph('rg',L,H,[]);
  const init=`function toyInitNode(s,b,p,pb,f,fb){for(let i=gpu.u32(0);i<gpu.u32(4);i++){p[pb+i]=gpu.u32(0);f[fb+i]=gpu.f32(0);}}function toyInitCandidate(s,b,a,ab,p,pb,f,fb){toyInitNode(s,b,p,pb,f,fb);}function toyRetire(p,b,f,fb,e,eb,ef,efb,count){return gpu.u32(0);}`;
  const gpu={u32:x=>Number(x)>>>0,f32:Math.fround,atomic:{loadAcquireDevice:(p,i)=>p[i],storeReleaseDevice:(p,i,v)=>p[i]=v}};
  const fn=new Function('gpu',domainSource+init+module.source+'\nreturn {'+module.functions.map(f=>f.name).join(',')+'};')(gpu);
  const m=new Uint32Array(L.metaWords),s=new Uint32Array(nodes*64),a=new Uint32Array(edges*16),p=new Uint32Array(L.policyU32Words),f=new Float32Array(L.policyF32Words),su=new Uint32Array(L.scratchU32Words),sf=new Float32Array(4),args=[m,s,a,p,f,su,sf];fn.rg_initialize(m,1);
  return {L,module,m,s,a,p,f,su,sf,args,fn,admit(id,kind=0){const state=new Uint32Array(64);state[0]=id;state[1]=kind;return fn.rg_admit(...args,state,0);}};
}
test('coalescing contiguous spans allocate exact lengths and restore capacity',()=>{
  const q=graphFixture({edges:12,maxActions:4}),{fn,m}=q;
  assert.equal(fn.rg_spanAllocate(m,3),0);assert.equal(fn.rg_spanAllocate(m,2),3);assert.equal(fn.rg_spanAllocate(m,4),5);
  fn.rg_spanFree(m,3,2);fn.rg_spanFree(m,0,3);assert.equal(fn.rg_spanAllocate(m,4),0);
  fn.rg_spanFree(m,5,4);fn.rg_spanFree(m,0,4);assert.equal(fn.rg_spanFind(m,12),0);assert(m[12]>=2);
});
test('admission publishes complete action-ready candidates without materializing children; collisions use full equality',()=>{
  const q=graphFixture(),{m,L}=q;const root=q.admit(0);assert.equal(root,0);m[2]=root;
  assert.equal(m[5],1);assert.equal(m[6],2);assert.equal(m[L.nodeMeta+4],2);
  const first=m[L.nodeMeta+3];for(let j=0;j<2;j++){const e=L.edgeMeta+(first+j)*8;assert.equal(m[e],1);assert.equal(m[e+3],0xffffffff);assert.equal(q.a[(first+j)*16],j);}
  assert.equal(q.admit(0),root);assert.equal(m[5],1);assert.equal(q.admit(1),1);assert.equal(m[5],2);
});
test('one-candidate second chance preserves focus/path/evaluation leases and rejects stale reused handles',()=>{
  const q=graphFixture({nodes:2,edges:8}),{m,L,fn}=q;
  const root=q.admit(0);m[2]=root;const leaf=q.admit(1);const nb=L.nodeMeta+leaf*16,gen=m[nb+1];
  m[nb+15]=3;
  assert.equal(q.admit(2),0xffffffff);assert.equal(m[11],0); // clock0 focus is protected
  m[nb+7]=1;assert.equal(q.admit(2),0xffffffff);assert.equal(m[11],0); // clock1 evaluation lease
  m[nb+7]=0;assert.equal(q.admit(2),0xffffffff); // focus again
  assert.equal(q.admit(2),0xffffffff);assert.equal(m[nb+9],0); // recent node receives second chance
  assert.equal(q.admit(2),0xffffffff); // focus again
  const next=q.admit(2);assert.equal(next,leaf);assert.equal(m[11],1);assert.equal(m[5],2);assert.equal(fn.rg_valid(m,leaf,gen),false);assert.equal(fn.rg_valid(m,leaf,m[nb+1]),true);
  assert.equal(m[nb+15],0,'new incarnation cannot carry prior evaluation disposition');
  assert.equal(m[13],5);assert.equal(m[6],3); // root2 + new leaf1; no leaked old span
});
test('selected child realization reuses verified diamond node and lazily repairs stale references',()=>{
  const q=graphFixture({nodes:8,edges:16}),{m,L,fn}=q;const root=q.admit(0);m[2]=root;const span=m[L.nodeMeta+3];
  const left=fn.rg_realize(...q.args,span),right=fn.rg_realize(...q.args,span+1);assert.notEqual(left,right);
  const ls=m[L.nodeMeta+left*16+3],rs=m[L.nodeMeta+right*16+3];const leaf=fn.rg_realize(...q.args,ls);assert.equal(fn.rg_realize(...q.args,rs),leaf);assert.equal(m[5],4);assert.equal(m[15],1);
  const eb=L.edgeMeta+ls*8;m[eb+4]=m[eb+4]+1;assert.equal(fn.rg_realize(...q.args,ls),leaf);assert(m[14]>0);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {generateResidentOutput,generateResidentSession,residentCommandLayout} from '../../components/search-compiler/src/resident-session-output.mjs';

const L={maxActions:2,actionWords:1,stateWords:4,nodeMeta:128,edgeMeta:256,nodeU32Words:4,nodeF32Words:4,edgePolicyU32:16,edgePolicyF32:16,edgeU32Words:4,edgeF32Words:4};
const H={encodeSnapshotRow:(...x)=>`encodeRow(${x.join(',')})`,encodeUnavailableRow:(...x)=>`encodeAbsent(${x.join(',')})`,chooseEncoded:(...x)=>`choose(${x.join(',')})`,actionEqual:(...x)=>`sameAction(${x.join(',')})`};
function oracle(){
  const out=generateResidentOutput('ro','rg',L,H,[]),session=generateResidentSession('rs','rg','ro',L,H,[]);
  const gpu={u32:x=>Number(x)>>>0,atomic:{loadAcquireDevice:(p,i)=>p[i],storeReleaseDevice:(p,i,v)=>p[i]=v,cas:(p,i,a,b)=>{const old=p[i];if(old===a)p[i]=b;return old;}}};
  const helpers=`function encodeRow(p,b,f,fb,e,eb){e[eb]=p[b];e[eb+1]=p[b+2];e[eb+2]=1000000;e[eb+3]=500000;e[eb+4]=0;return 0;}function encodeAbsent(e,b){e[b]=0;e[b+1]=0;e[b+2]=1000000;e[b+3]=0;e[b+4]=1;return 0;}function choose(rows,b,count,restriction){if(count===0)return 4294967295;return count-1;}function sameAction(a,b,c,d){return a[b]===c[d];}function rg_valid(m,n,g){return n<2&&m[128+n*16]===1&&m[129+n*16]===g;}function rg_admit(m,s,a,p,f,su,sf,c,b){if(c[b]===99){m[10]=3;return 4294967295;}return c[b];}`;
  const fn=new Function('gpu',helpers+out.source+session.source+'\nreturn {'+[...out.functions,...session.functions].map(f=>f.name).join(',')+'};')(gpu);
  const m=new Uint32Array(400),s=new Uint32Array(8),a=new Uint32Array([11,22,33]),p=new Uint32Array(64),f=new Float32Array(64),su=new Uint32Array(128),sf=new Float32Array(64),authority=new Uint32Array(32),snap=new Uint32Array(out.layout.snapshotWords),encoded=new Uint32Array(5),command=new Uint32Array(residentCommandLayout.headerWords+4+1);
  m[1]=1;m[2]=0;m[3]=1;m[4]=1;m[128]=1;m[129]=1;m[131]=0;m[132]=2;m[144]=1;m[145]=1;m[147]=2;m[148]=1;authority[0]=1;authority[1]=0;authority[2]=1;authority[3]=1;
  for(let e=0;e<3;e++){m[256+e*8]=1;m[257+e*8]=e<2?0:1;m[258+e*8]=1;m[259+e*8]=4294967295;p[16+e*4]=e+1;}
  return {out,session,fn,m,s,a,p,f,su,sf,authority,snap,encoded,command};
}
test('immutable output borrow survives publication and retirement; observer only copies existing candidates',()=>{
  const q=oracle(),{fn,m,a,p,f,authority,snap,encoded}=q;
  assert.equal(fn.ro_publish(m,a,p,f,authority,snap,encoded),0);const old=fn.ro_acquire(authority,snap,1,0,1,1);assert.equal(old,0);
  const before=Array.from(snap.slice(1,q.out.layout.slotWords));p[16]=99;assert.equal(fn.ro_publish(m,a,p,f,authority,snap,encoded),0);
  assert.deepEqual(Array.from(snap.slice(1,q.out.layout.slotWords)),before);assert.equal(fn.ro_publish(m,a,p,f,authority,snap,encoded),2);
  fn.ro_release(authority,snap,old);assert.equal(fn.ro_publish(m,a,p,f,authority,snap,encoded),0);
  const result=new Uint32Array(32+12),restriction=new Uint32Array(1);assert.equal(fn.ro_observe(authority,snap,result,restriction,1,0,1,1),0);assert.equal(result[12],22);assert.equal(result[13],2);assert.equal(snap[0],2);assert.equal(snap[q.out.layout.slotWords],0);
});
test('focus fence rejects stale publication without mutating Graph or Policy',()=>{
  const q=oracle();q.fn.ro_publish(q.m,q.a,q.p,q.f,q.authority,q.snap,q.encoded);q.authority[3]=2;
  const m=q.m.slice(),p=q.p.slice(),f=q.f.slice();const result=new Uint32Array(44);
  assert.equal(q.fn.ro_observe(q.authority,q.snap,result,new Uint32Array(1),1,0,1,1),3);assert.deepEqual(q.m,m);assert.deepEqual(q.p,p);assert.deepEqual(q.f,f);
});
test('publication generation is part of the decision fence even when current root is unchanged',()=>{
  const q=oracle();q.fn.ro_publish(q.m,q.a,q.p,q.f,q.authority,q.snap,q.encoded);q.authority[4]++;
  assert.equal(q.fn.ro_acquire(q.authority,q.snap,1,0,1,1),4294967295);
  assert.equal(q.fn.ro_observe(q.authority,q.snap,new Uint32Array(q.out.layout.observerWords),new Uint32Array(1),1,0,1,1),3);
});
function command(q,{kind=1,id=[1,0,0,0],generation=[1,0,0,0],target=1,action=11}={}){
  const c=q.command;c.fill(0);c[0]=2;c[2]=kind;c[3]=1;c[4]=q.authority[3];c[5]=q.authority[1];c[6]=q.authority[2];c.set(id,8);c.set(generation,12);c[20]=4;c[21]=1;c[32]=target;c[36]=action;
  return q.fn.rs_apply(q.m,q.s,q.a,q.p,q.f,q.su,q.sf,q.authority,q.snap,q.encoded,c);
}
test('command ID and generation are128-bit, and repeated u32 hint cannot suppress a fresh payload',()=>{
  const q=oracle();assert.equal(command(q),0);assert.equal(q.authority[1],1);assert.equal(q.authority[3],2);
  assert.equal(command(q,{id:[1,1,0,0],generation:[1,1,0,0],target:0}),0);assert.equal(q.authority[1],0);assert.equal(q.authority[3],3);
  assert.equal(command(q,{id:[1,1,0,0],generation:[2,1,0,0]}),4);assert.equal(q.authority[3],3);
  assert.equal(command(q,{id:[2,1,0,0],generation:[1,0,0,0]}),5);assert.equal(q.authority[3],3);
});
test('ready advance never materializes missing child and admission pressure does not change focus',()=>{
  const q=oracle(),original=q.m.slice();assert.equal(command(q,{kind:2}),6);assert.equal(q.authority[1],0);assert.equal(q.m[5],original[5]);
  q.m[259]=1;q.m[260]=1;assert.equal(command(q,{kind:2,id:[2,0,0,0],generation:[2,0,0,0]}),0);assert.equal(q.authority[1],1);
  assert.equal(command(q,{target:99,id:[3,0,0,0],generation:[3,0,0,0]}),2);assert.equal(q.authority[1],1);assert.equal(q.authority[3],2);
});
test('compound focus admission reserves an Output slot before authority commit',()=>{
  const q=oracle();q.fn.ro_publish(q.m,q.a,q.p,q.f,q.authority,q.snap,q.encoded);
  const old=q.fn.ro_acquire(q.authority,q.snap,1,0,1,1);
  q.fn.ro_publish(q.m,q.a,q.p,q.f,q.authority,q.snap,q.encoded);
  assert.equal(command(q),2);assert.equal(q.authority[1],0);assert.equal(q.authority[3],1);assert.equal(q.m[2],0);
  q.fn.ro_release(q.authority,q.snap,old);
  assert.equal(q.fn.rs_apply(q.m,q.s,q.a,q.p,q.f,q.su,q.sf,q.authority,q.snap,q.encoded,q.command),0);
  assert.equal(q.authority[1],1);assert.equal(q.authority[3],2);
});
test('epoch and publication exhaustion reject before Graph admission or Output reservation',()=>{
 for(const field of [3,4]){
  const q=oracle();q.authority[field]=4294967294;
  const graph=q.m.slice(),snap=q.snap.slice(),authority=q.authority.slice();
  assert.equal(command(q),9);assert.equal(q.m[60],0);assert.deepEqual(q.snap,snap);
  assert.deepEqual(q.authority,authority);assert.deepEqual(q.m.slice(0,64),graph.slice(0,64));
 }
});
test('compound Policy facts cannot be captured during an incomplete backup transaction',()=>{
  const q=oracle();q.m[45]=2;
  assert.equal(q.fn.ro_publish(q.m,q.a,q.p,q.f,q.authority,q.snap,q.encoded),3);
  assert.equal(q.authority[4],0);q.m[45]=0;
  assert.equal(q.fn.ro_publish(q.m,q.a,q.p,q.f,q.authority,q.snap,q.encoded),0);
});
test('immutable public telemetry carries exact root work and owner-lifecycle counts without Policy inference',()=>{
  const q=oracle();q.m[128+12]=7;q.m[73]=5;q.m[74]=4;q.m[128+13]=3;q.m[128+14]=2;q.m[128+15]=1;
  q.fn.ro_publish(q.m,q.a,q.p,q.f,q.authority,q.snap,q.encoded);
  const out=new Uint32Array(q.out.layout.observerWords);q.fn.ro_observe(q.authority,q.snap,out,new Uint32Array(1),1,0,1,1);
  assert.equal(out[8],7);assert.equal(out[9],4);assert.equal(out[11],5);
  assert.equal(out[q.out.layout.evaluationDispositionWord],1);q.m[128+15]=3;
  assert.equal(out[q.out.layout.rootEvaluatorAdmissionsWord],3);
  assert.equal(out[q.out.layout.rootEvaluatorReadyObservedWord],2);
  q.m[128+13]=8;q.m[128+14]=7;
  assert.equal(out[q.out.layout.rootEvaluatorAdmissionsWord],3,'root counts are immutable copied owner facts');
  q.p[16]=999;assert.equal(out[8],7);assert.equal(out[9],4);
  assert.equal(out[q.out.layout.evaluationDispositionWord],1,'observer sees the immutable disposition at capture');
});
test('terminal cleanup facts copy actual owner counters and exact accepted command identity',()=>{
  const q=oracle(),out=new Uint32Array(q.out.layout.observerWords);
  q.m[32]=7;q.m[33]=6;q.m[46]=9;q.m[47]=8;q.m[80]=1;q.m[81]=1;q.m.set([1,2,3,4,5,6,7,8],64);
  q.fn.ro_terminalFacts(q.m,out,2,3,11);
  assert.deepEqual(Array.from(out.slice(15,24)),[1,1,7,6,9,8,2,3,11]);assert.deepEqual(Array.from(out.slice(24,32)),[1,2,3,4,5,6,7,8]);
  q.m[83]=9;q.fn.ro_terminalFacts(q.m,out,0,0,2);assert.equal(out[23],2);assert.equal(out[q.out.layout.drainDispositionWord],9);
});
test('reserved capture aborts without a writing-slot leak when its publication is exhausted',()=>{
  const q=oracle();assert.equal(q.fn.ro_reserve(q.m,q.authority,q.snap),0);assert.equal(q.m[60],1);assert.equal(q.snap[0],1);
  q.authority[4]=4294967294;
  assert.equal(q.fn.ro_publish(q.m,q.a,q.p,q.f,q.authority,q.snap,q.encoded),9);
  assert.equal(q.m[60],0);assert.equal(q.snap[0],0);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {generateResidentSession} from '../../components/search-compiler/src/resident-session-output.mjs';
import {graphFixture} from './resident-graph.test.mjs';
import {domainSource} from './fixture.mjs';
function fixture(){
  const L={...graphFixture().L,maxAdmissionActions:4},H={actionEqual:(...a)=>`fdActionEqual(${a.join(',')})`,validateRoot:(...a)=>`fdValid(${a.join(',')})`,terminal:(...a)=>`fdTerminal(${a.join(',')})`,actionValid:(...a)=>`fdActionValid(${a.join(',')})`,transition:(...a)=>`fdTransition(${a.join(',')})`,classifyTransitionResult:(...a)=>`resultMeaning(${a.join(',')})`};
  const module=generateResidentSession('replay','rg','ro',L,H,[]),gpu={u32:x=>Number(x)>>>0,atomic:{loadAcquireDevice:(p,i)=>p[i]}};
  const fn=new Function('gpu',domainSource+'function resultMeaning(status){return status===0?0:1;}'+module.source+'return replay_replay;')(gpu);
  const input=new Uint32Array(32+64+4*16),a=new Uint32Array(64),b=new Uint32Array(64),scratch=new Uint32Array(L.scratchU32Words+16);
  input[20]=64;input[22]=16;
  return {fn,input,a,b,scratch,L,run(){return fn(input,a,b,scratch);}};
}
test('compound admission GPU replay validates every opaque action and preserves cold input bytes',()=>{
  const q=fixture();q.input[21]=2;q.input[96]=1;q.input[112]=0;const before=q.input.slice();
  assert.equal(q.run(),0);assert.equal(q.a[0],3);assert.deepEqual(q.input,before);assert.equal(q.scratch[q.L.scratchU32Words+8],0);
});
test('replay rejects oversize streams, illegal actions and moves after selected terminal truth',()=>{
  for(const configure of [q=>q.input[21]=5,q=>{q.input[21]=1;q.input[96]=9;},q=>{q.input[0+32]=3;q.input[21]=1;}]){const q=fixture();configure(q);assert.equal(q.run(),1);}
});

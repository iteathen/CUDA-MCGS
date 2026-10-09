import assert from 'node:assert/strict';
import test from 'node:test';
import {validateResidentPolicyRecordLayout} from '../../components/search-compiler/src/resident-policy-layout.mjs';
const layout={nodeU32Words:6,nodeF32Words:4,edgeU32Words:6,edgeF32Words:4};
function policy(split){return{records:['node','edge'].flatMap(scope=>[['integer',6],['floating',4]].flatMap(([representation,count])=>Array.from({length:split?count:1},(_,i)=>({id:`policy.record-${scope}-${representation}-${i}`,scope,numeric:{kind:'finite-numeric',representation,storageBits:'32',accumulationBits:'32'},storage:{sizeBytes:String(split?4:count*4)}}))))};}
test('owner-defined split scalar records and aggregate records admit the same exact opaque family extent',()=>{assert.doesNotThrow(()=>validateResidentPolicyRecordLayout(policy(true),layout));assert.doesNotThrow(()=>validateResidentPolicyRecordLayout(policy(false),layout));});
test('record-family missing storage, extent drift and floatcounter precision substitution reject cold',()=>{for(const mutate of [p=>p.records.pop(),p=>p.records[0].storage.sizeBytes='8',p=>p.records[0].numeric.storageBits='16',p=>p.records[0].numeric.accumulationBits='16']){const p=policy(true);mutate(p);assert.throws(()=>validateResidentPolicyRecordLayout(p,layout),{code:'RESIDENT_CORE_POLICY_RECORD'});}});

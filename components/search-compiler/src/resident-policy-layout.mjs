import {fail} from './validation.mjs';
export function validateResidentPolicyRecordLayout(policy,layout){
  for(const [scope,prefix]of [['node','node'],['edge','edge']])for(const [representation,suffix]of [['integer','U32Words'],['floating','F32Words']]){
    const records=policy.records.filter(r=>r.scope===scope&&r.numeric.kind==='finite-numeric'&&r.numeric.representation===representation);
    if(!records.length||records.some(r=>r.numeric.storageBits!=='32'||r.numeric.accumulationBits!=='32')||records.reduce((n,r)=>n+BigInt(r.storage.sizeBytes),0n)!==BigInt(layout[prefix+suffix])*4n)fail('RESIDENT_CORE_POLICY_RECORD','opaque selected Policy record family extent differs from actual normalized finite32-bit storage');
  }
}

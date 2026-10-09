import {fail} from './validation.mjs';

// Producer-owned emission for the selected Progress/Resource stop journal in
// the fused metadata allocation. No callback or physical placement is supplied.
export function emitResidentStop(cause,drainFailure=false){
  if(![2,6,7,8,9,10,11,14].includes(cause))fail('RESIDENT_STOP_CAUSE','unregistered selected stop cause');
  const value=`gpu.u32(${cause})`;
  return `if(m[gpu.u32(82)]===gpu.u32(0)){m[gpu.u32(82)]=${value};}if(${drainFailure?'true':'m[gpu.u32(84)]!==gpu.u32(0)'}&&m[gpu.u32(83)]===gpu.u32(0)){m[gpu.u32(83)]=${value};}m[gpu.u32(17)]=${value};`;
}

import {cooperativeDeviceSearchContract} from '../../components/search-compiler/index.mjs';
import {policySource,policyFunctions} from './fixture.mjs';

const names={initializeNode:'fcInitNode',initializeEdge:'fcInitEdge',select:'fcSelect',terminalValue:'fcTerminal',frontier:'fcFrontier',apply:'fcApply',decision:'fcDecision'};
export function cooperativePolicyModule({mismatch=false,fail=false}={}){
  const C=cooperativeDeviceSearchContract;
  const signatures=Object.fromEntries(Object.entries(names).map(([slot,name])=>[slot,`function ${name}(${C.hooks[slot].parameters.map(p=>p.name).join(',')})`]));
  const source=policySource+`
${signatures.initializeNode}{fpInit(node,nodeBase,numeric,numericBase);node[nodeBase+gpu.u32(3)]=state[stateBase];}
${signatures.initializeEdge}{fpInit(edge,edgeBase,numeric,numericBase);edge[edgeBase+gpu.u32(3)]=action[actionBase]+parent[parentBase]*gpu.u32(10)+child[childBase]*gpu.u32(100);}
${signatures.select}{return fpSelect(edges,edgesBase,edgeNumeric,edgeNumericBase,count,work);}
${signatures.terminalValue}{node[nodeBase+gpu.u32(2)]=gpu.u32(3);return fpTerminal(outcome,outcomeBase,value,valueBase);}
${signatures.frontier}{
  gpu.barrier.block();gpu.atomic.add(nodeNumeric,nodeNumericBase+gpu.u32(1),gpu.f32(1));gpu.barrier.block();
  if(gpu.thread.x()===gpu.u32(0)&&!complete){node[nodeBase]=gpu.u32(999);}
  if(reason!==gpu.u32(0)){if(gpu.thread.x()===gpu.u32(0)){value[valueBase]=gpu.f32(9);}gpu.barrier.block();return gpu.u32(0);}
  ${fail?'return gpu.u32(2);':mismatch?'return gpu.thread.x();':'return gpu.u32(1);'}
}
${signatures.apply}{
  if(!complete){return gpu.u32(1);}if(terminalRole===gpu.u32(0)&&count===gpu.u32(0)){return gpu.u32(1);}
  policy[nodeBase+gpu.u32(3)]=count;
  for(let j=gpu.u32(0);j<count;j++){if(children[childrenBase+j*gpu.u32(4)+gpu.u32(3)]>gpu.u32(3)){return gpu.u32(1);}}
  return fpApply(policy,nodeBase,incomingBase,numeric,nodeNumericBase,incomingNumericBase,value,valueBase,state,stateBase,work);
}
${signatures.decision}{return fpDecision(edges,edgesBase,edgeNumeric,edgeNumericBase,count);}
`;
  const functions=[...policyFunctions.map(({participation,launchConstraint,...fn})=>fn),...Object.entries(names).map(([slot,name])=>({name,kind:'device',parameters:C.hooks[slot].parameters,returns:C.hooks[slot].returns,...(slot==='frontier'?{participation:C.participation,launchConstraint:C.launch}:{})}))];
  return {source,functions,hooks:names,contract:C};
}

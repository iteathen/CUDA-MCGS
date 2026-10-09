import {createSelectedDeviceSearchCore,generateSelectedGraphHelpers} from './finite-device-search.mjs';

const U='ptr<u32>',F='ptr<f32>',N='u32',B='bool';
const pair=(name,type)=>[[name,type],[name+'Base',N]];
const hooks={
  validateRoot:{port:'validate-root',parameters:pair('state',U),returns:B},key:{port:'identity-key',parameters:pair('state',U),returns:N},
  equalState:{port:'equal-state',parameters:[...pair('left',U),...pair('right',U)],returns:B},
  actions:{port:'produce-actions',parameters:[...pair('state',U),...pair('actions',U),['capacity',N]],returns:N},
  actionValid:{port:'validate-action',parameters:[...pair('state',U),...pair('action',U)],returns:B},actionEqual:{port:'equal-action',parameters:[...pair('left',U),...pair('right',U)],returns:B},
  transition:{port:'apply-transition',parameters:[...pair('state',U),...pair('action',U),...pair('destination',U)],returns:N},
  terminal:{port:'terminal-outcome',parameters:[...pair('state',U),...pair('outcome',U)],returns:N},relation:{port:'classify-path-relation',parameters:[...pair('state',U),...pair('ancestor',U)],returns:N},
  initializeNode:{port:'initialize-policy-records',parameters:[...pair('state',U),...pair('node',U),...pair('numeric',F)],returns:'void'},
  initializeEdge:{port:'initialize-policy-records',parameters:[...pair('parent',U),...pair('action',U),...pair('child',U),...pair('edge',U),...pair('numeric',F)],returns:'void'},
  select:{port:'select-next',parameters:[...pair('node',U),...pair('nodeNumeric',F),...pair('edges',U),...pair('edgeNumeric',F),['count',N],['work',N]],returns:N},
  reserve:{port:'reserve-in-flight',parameters:[...pair('edge',U),['work',N]],returns:N},release:{port:'release-in-flight',parameters:[...pair('edge',U),['work',N],['disposition',N]],returns:'void'},
  terminalValue:{port:'map-terminal-outcome',parameters:[...pair('state',U),...pair('outcome',U),...pair('node',U),...pair('numeric',F),...pair('value',F)],returns:N},
  frontier:{port:'classify-path-response',parameters:[...pair('state',U),...pair('node',U),...pair('nodeNumeric',F),...pair('actions',U),...pair('edges',U),...pair('edgeNumeric',F),...pair('children',U),...pair('childNumeric',F),['count',N],['complete',B],...pair('value',F),['depth',N],['reason',N],['relation',N]],returns:N},
  valueValid:{port:'map-terminal-outcome',parameters:pair('value',F),returns:B},prepare:{port:'prepare-backup',parameters:[...pair('node',U),['work',N]],returns:N},
  apply:{port:'apply-backup-step',parameters:[['policy',U],['nodeBase',N],['incomingBase',N],['numeric',F],['nodeNumericBase',N],['incomingNumericBase',N],...pair('value',F),...pair('state',U),...pair('parent',U),...pair('action',U),...pair('actions',U),...pair('edges',U),...pair('edgeNumeric',F),...pair('children',U),...pair('childNumeric',F),['count',N],['complete',B],['terminalRole',N],['work',N]],returns:N},
  complete:{port:'complete-backup',parameters:[...pair('node',U),['work',N]],returns:'void'},
  decision:{port:'select-next',parameters:[...pair('node',U),...pair('nodeNumeric',F),...pair('edges',U),...pair('edgeNumeric',F),['count',N]],returns:N},
};
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export const cooperativeDeviceSearchContract=freeze({contract:'cuda-mcgs.cooperative-device-search-core/0.1.0',participation:{kind:'collective-block',blockSize:32},launch:{grid:['1','1','1'],block:['32','1','1']},hooks:Object.fromEntries(Object.entries(hooks).map(([name,hook])=>[name,{...hook,parameters:hook.parameters.map(([name,type])=>({name,type}))}]))});

export function createCooperativeDeviceSearchCore(context,options){
  return createSelectedDeviceSearchCore(context,options,{
    abi:Object.fromEntries(Object.entries(hooks).map(([slot,h])=>[slot,[h.parameters.map(p=>p[1]),h.returns]])),ports:Object.fromEntries(Object.entries(hooks).map(([slot,h])=>[slot,h.port])),
    participation:cooperativeDeviceSearchContract.participation,launch:cooperativeDeviceSearchContract.launch,headerWords:64,contract:cooperativeDeviceSearchContract.contract,
    augmentLayout(L){L.viewActions=L.nodeU32Words;L.viewEdges=L.viewActions+L.maxActions*L.actionWords;L.viewChildren=L.viewEdges+L.maxActions*L.edgeU32Words;L.viewIds=L.viewChildren+L.maxActions*L.nodeU32Words;L.viewU32Words=L.viewIds+L.maxActions;L.viewEdgeF32=L.nodeF32Words;L.viewChildF32=L.viewEdgeF32+L.maxActions*L.edgeF32Words;L.viewF32Words=L.viewChildF32+L.maxActions*L.nodeF32Words;L.extraPolicyWords=L.viewU32Words+L.viewF32Words;},
    extraBuffers(L,c){return [['vu','u32',L.viewU32Words,c.policy.normalized.id],['vf','f32',L.viewF32Words,c.policy.normalized.id]];},generate:generateCooperative,
  });
}

function generateCooperative(name,L,H,external){
  const u=n=>`gpu.u32(${n})`,n=role=>`${name}_${role}`,tail=external.length?', '+external.map(p=>p.name).join(', '):'';
  const graph=generateSelectedGraphHelpers(name,L,H,external);
  const node=x=>`${u(L.nodeMeta)}+${x}*${u(8)}`,edge=x=>`${u(L.edgeMeta)}+${x}*${u(8)}`;
  const view=`
function ${n('view')}(m,s,a,p,f,vu,vf,node){
  let nb=${node('node')};for(let w=${u(0)};w<${u(L.nodeU32Words)};w++){vu[w]=p[node*${u(L.nodeU32Words)}+w];}for(let w=${u(0)};w<${u(L.nodeF32Words)};w++){vf[w]=f[node*${u(L.nodeF32Words)}+w];}
  let e=m[nb+${u(3)}];let count=${u(0)};
  for(let j=${u(0)};j<${u(L.maxActions)};j++){
    if(e===${u(4294967295)}){break;}if(e>=m[${u(1)}]){return ${u(4294967295)};}let eb=${edge('e')};let child=m[eb+${u(3)}];
    if(gpu.atomic.loadAcquireDevice(m,eb)!==${u(1)}||m[eb+${u(1)}]!==node||m[eb+${u(2)}]!==m[nb+${u(1)}]||!${n('valid')}(m,child,m[eb+${u(4)}],m[${u(10)}])){return ${u(4294967295)};}
    for(let w=${u(0)};w<${u(L.actionWords)};w++){vu[${u(L.viewActions)}+count*${u(L.actionWords)}+w]=a[e*${u(L.actionWords)}+w];}
    for(let w=${u(0)};w<${u(L.edgeU32Words)};w++){vu[${u(L.viewEdges)}+count*${u(L.edgeU32Words)}+w]=p[${u(L.edgePolicyU32)}+e*${u(L.edgeU32Words)}+w];}
    for(let w=${u(0)};w<${u(L.edgeF32Words)};w++){vf[${u(L.viewEdgeF32)}+count*${u(L.edgeF32Words)}+w]=f[${u(L.edgePolicyF32)}+e*${u(L.edgeF32Words)}+w];}
    for(let w=${u(0)};w<${u(L.nodeU32Words)};w++){vu[${u(L.viewChildren)}+count*${u(L.nodeU32Words)}+w]=p[child*${u(L.nodeU32Words)}+w];}
    for(let w=${u(0)};w<${u(L.nodeF32Words)};w++){vf[${u(L.viewChildF32)}+count*${u(L.nodeF32Words)}+w]=f[child*${u(L.nodeF32Words)}+w];}
    vu[${u(L.viewIds)}+count]=e;count++;e=m[eb+${u(5)}];
  }
  if(e!==${u(4294967295)}){return ${u(4294967295)};}return count;
}
function ${n('scatter')}(m,p,f,vu,vf,node,count){
  for(let w=${u(0)};w<${u(L.nodeU32Words)};w++){p[node*${u(L.nodeU32Words)}+w]=vu[w];}for(let w=${u(0)};w<${u(L.nodeF32Words)};w++){f[node*${u(L.nodeF32Words)}+w]=vf[w];}
  for(let j=${u(0)};j<count;j++){let e=vu[${u(L.viewIds)}+j];for(let w=${u(0)};w<${u(L.edgeU32Words)};w++){p[${u(L.edgePolicyU32)}+e*${u(L.edgeU32Words)}+w]=vu[${u(L.viewEdges)}+j*${u(L.edgeU32Words)}+w];}for(let w=${u(0)};w<${u(L.edgeF32Words)};w++){f[${u(L.edgePolicyF32)}+e*${u(L.edgeF32Words)}+w]=vf[${u(L.viewEdgeF32)}+j*${u(L.edgeF32Words)}+w];}}
}
`;
  const advance=`
function ${n('advance')}(m,s,a,p,f,su,sf,vu,vf,cancellation${tail}){
  m[${u(38)}]=${u(0)};m[${u(39)}]=${u(4294967295)};m[${u(41)}]=${u(0)};
  if(m[${u(6)}]!==${u(0)}){return;}if(gpu.mailbox.loadAcquireSystem(cancellation)!==${u(0)}){m[${u(6)}]=${u(2)};return;}
  let node=m[${u(32)}];let depth=m[${u(23)}];let incoming=m[${u(33)}];let work=m[${u(9)}];
  if(depth>=${u(L.pathDepth)}){m[${u(6)}]=${u(5)};return;}if(!${n('valid')}(m,node,${u(1)},m[${u(10)}])){m[${u(6)}]=${u(6)};return;}
  let pb=${u(L.pathMeta)}+depth*${u(5)};m[pb]=node;m[pb+${u(1)}]=${u(1)};m[pb+${u(2)}]=incoming;m[pb+${u(3)}]=${u(1)};m[pb+${u(4)}]=work;let nb=${node('node')};m[nb+${u(6)}]=m[nb+${u(6)}]+${u(1)};depth++;m[${u(23)}]=depth;
  let sb=node*${u(L.stateWords)};let role=${H.terminal('s','sb','su',u(L.outcome))};m[${u(42)}]=role;if(role>${u(1)}){m[${u(30)}]=role;m[${u(6)}]=${u(7)};return;}
  if(role===${u(1)}){let count=${n('view')}(m,s,a,p,f,vu,vf,node);if(count===${u(4294967295)}){m[${u(6)}]=${u(6)};return;}let result=${H.terminalValue('s','sb','su',u(L.outcome),'vu',u(0),'vf',u(0),'sf',u(L.valueBase))};if(result!==${u(0)}){m[${u(6)}]=${u(8)};return;}${n('scatter')}(m,p,f,vu,vf,node,count);m[${u(35)}]=${u(1)};return;}
  let relation=${u(0)};for(let j=${u(0)};j+${u(1)}<depth;j++){let ancestor=m[${u(L.pathMeta)}+j*${u(5)}];relation=${H.relation('s','sb','s',`ancestor*${u(L.stateWords)}`)};if(relation!==${u(0)}){break;}}
  let reason=${u(0)};if(relation!==${u(0)}){reason=${u(1)};}else if(depth===${u(L.pathDepth)}){reason=${u(2)};}
  if(m[nb+${u(5)}]===${u(0)}){let cause=${n('expand')}(m,s,a,p,f,su,sf,node${tail});if(cause!==${u(0)}){m[${u(6)}]=cause;return;}}
  let count=${n('view')}(m,s,a,p,f,vu,vf,node);if(count===${u(4294967295)}){m[${u(6)}]=${u(6)};return;}m[${u(34)}]=count;m[${u(36)}]=reason;m[${u(37)}]=relation;m[${u(38)}]=${u(1)};
}
function ${n('finishFrontier')}(m,s,a,p,f,su,sf,vu,vf${tail}){
  if(m[${u(41)}]!==${u(0)}||m[${u(39)}]>${u(1)}){m[${u(6)}]=${u(8)};return;}let node=m[${u(32)}];let count=m[${u(34)}];let result=m[${u(39)}];
  if(result===${u(0)}&&!${H.valueValid('sf',u(L.valueBase))}){m[${u(6)}]=${u(8)};return;}${n('scatter')}(m,p,f,vu,vf,node,count);
  if(result===${u(0)}){m[${u(35)}]=${u(1)};return;}if(m[${u(36)}]!==${u(0)}){m[${u(6)}]=${u(5)};return;}if(count===${u(0)}){m[${u(6)}]=${u(9)};return;}
  let work=m[${u(9)}];let chosen=${H.select('vu',u(0),'vf',u(0),'vu',u(L.viewEdges),'vf',u(L.viewEdgeF32),'count','work')};if(chosen>=count){m[${u(6)}]=${u(8)};return;}let e=vu[${u(L.viewIds)}+chosen];let eb=${edge('e')};
  if(${H.reserve('p',`${u(L.edgePolicyU32)}+e*${u(L.edgeU32Words)}`,'work')}!==${u(0)}){m[${u(6)}]=${u(8)};return;}m[${u(18)}]=m[${u(18)}]+${u(1)};m[${u(20)}]=m[${u(20)}]+${u(1)};m[${u(32)}]=m[eb+${u(3)}];m[${u(33)}]=e;
}
function ${n('backupRelease')}(m,s,a,p,f,su,sf,vu,vf,cancellation${tail}){
  let root=m[${u(8)}];let work=m[${u(9)}];let depth=m[${u(23)}];let ready=m[${u(35)}]===${u(1)}&&m[${u(6)}]===${u(0)};
  if(ready&&(!${H.valueValid('sf',u(L.valueBase))}||${H.prepare('p',`root*${u(L.nodeU32Words)}`,'work')}!==${u(0)})){m[${u(6)}]=${u(8)};ready=false;}if(ready&&gpu.mailbox.loadAcquireSystem(cancellation)!==${u(0)}){m[${u(6)}]=${u(2)};ready=false;}
  if(ready){m[${u(13)}]=${u(1)};
    for(let j=depth;j>${u(0)};j--){let pb=${u(L.pathMeta)}+(j-${u(1)})*${u(5)};let node=m[pb];let e=m[pb+${u(2)}];if(m[pb+${u(4)}]!==work||!${n('valid')}(m,node,m[pb+${u(1)}],m[${u(10)}])){m[${u(6)}]=${u(11)};break;}
      let incoming=${u(4294967295)};let incomingNumeric=${u(4294967295)};let parentBase=${u(4294967295)};let actionBase=${u(4294967295)};
      if(e!==${u(4294967295)}){if(e>=m[${u(1)}]){m[${u(6)}]=${u(11)};break;}let eb=${edge('e')};if(m[eb+${u(7)}]!==m[pb+${u(3)}]||m[eb+${u(3)}]!==node||!${n('valid')}(m,m[eb+${u(1)}],m[eb+${u(2)}],m[${u(10)}])){m[${u(6)}]=${u(11)};break;}incoming=${u(L.edgePolicyU32)}+e*${u(L.edgeU32Words)};incomingNumeric=${u(L.edgePolicyF32)}+e*${u(L.edgeF32Words)};parentBase=m[eb+${u(1)}]*${u(L.stateWords)};actionBase=e*${u(L.actionWords)};}
      let count=${n('view')}(m,s,a,p,f,vu,vf,node);if(count===${u(4294967295)}){m[${u(6)}]=${u(11)};break;}let role=${H.terminal('s',`node*${u(L.stateWords)}`,'su',u(L.outcome))};if(role>${u(1)}){m[${u(6)}]=${u(11)};break;}
      if(${H.apply('p',`node*${u(L.nodeU32Words)}`,'incoming','f',`node*${u(L.nodeF32Words)}`,'incomingNumeric','sf',u(L.valueBase),'s',`node*${u(L.stateWords)}`,'s','parentBase','a','actionBase','vu',u(L.viewActions),'vu',u(L.viewEdges),'vf',u(L.viewEdgeF32),'vu',u(L.viewChildren),'vf',u(L.viewChildF32),'count','true','role','work')}!==${u(0)}){m[${u(6)}]=${u(11)};break;}
    }
    if(m[${u(6)}]!==${u(11)}){${H.complete('p',`root*${u(L.nodeU32Words)}`,'work')};m[${u(3)}]=m[${u(3)}]+${u(1)};m[${u(12)}]=work;m[${u(13)}]=${u(2)};}else{m[${u(13)}]=${u(3)};m[${u(26)}]=m[${u(26)}]+${u(1)};}
  }else{m[${u(4)}]=m[${u(4)}]+${u(1)};}
  for(let j=${u(0)};j<depth;j++){let pb=${u(L.pathMeta)}+j*${u(5)};let node=m[pb];let e=m[pb+${u(2)}];if(e!==${u(4294967295)}){let disposition=${u(0)};if(ready){disposition=${u(1)};}if(m[${u(6)}]===${u(11)}){disposition=${u(2)};}${H.release('p',`${u(L.edgePolicyU32)}+e*${u(L.edgeU32Words)}`,'work','disposition')};m[${u(19)}]=m[${u(19)}]+${u(1)};}let nb=${node('node')};if(m[nb+${u(6)}]===${u(0)}){m[${u(6)}]=${u(11)};}else{m[nb+${u(6)}]=m[nb+${u(6)}]-${u(1)};}m[pb+${u(4)}]=${u(0)};}
  m[${u(9)}]=${u(0)};m[${u(23)}]=${u(0)};m[${u(17)}]=m[${u(17)}]+${u(1)};
}
`;
  const main=`
function ${name}(m,s,a,p,f,su,sf,out,vu,vf,cancellation,expectedArena,expectedRootGeneration,expectedFocusEpoch${tail}){
  let lane=gpu.thread.x();
  if(lane===${u(0)}){
    for(let w=${u(0)};w<${u(32+L.actionWords)};w++){out[w]=${u(0)};}
    if(m[${u(10)}]!==expectedArena||expectedArena===${u(0)}||m[${u(11)}]!==expectedFocusEpoch||m[${u(0)}]>${u(L.nodeCapacity)}||m[${u(1)}]>${u(L.edgeCapacity)}||m[${u(9)}]!==${u(0)}||m[${u(7)}]!==${u(0)}){out[${u(0)}]=${u(6)};m[${u(6)}]=${u(6)};}else{
      m[${u(6)}]=${u(0)};if(m[${u(0)}]===${u(0)}){if(expectedRootGeneration!==${u(1)}||!${H.validateRoot('s',u(0))}){m[${u(6)}]=${u(7)};}else{let nb=${u(L.nodeMeta)};m[nb]=${u(2)};m[nb+${u(1)}]=${u(1)};m[nb+${u(2)}]=${H.key('s',u(0))};m[nb+${u(3)}]=${u(4294967295)};m[nb+${u(4)}]=${u(0)};m[nb+${u(5)}]=${u(0)};m[nb+${u(6)}]=${u(0)};${H.initializeNode('s',u(0),'p',u(0),'f',u(0))};gpu.atomic.storeReleaseDevice(m,nb,${u(1)});m[${u(0)}]=${u(1)};}}
      if(m[${u(6)}]===${u(0)}&&!${n('valid')}(m,m[${u(8)}],expectedRootGeneration,expectedArena)){m[${u(6)}]=${u(6)};}
    }
    m[${u(7)}]=${u(1)};
  }
  gpu.barrier.block();
  for(let iteration=${u(0)};iteration<${u(L.maxIterations)};iteration++){
    if(m[${u(6)}]!==${u(0)}){break;}
    if(lane===${u(0)}){if(m[${u(2)}]>=${u(4294967294)}){m[${u(6)}]=${u(10)};}else{m[${u(2)}]=m[${u(2)}]+${u(1)};m[${u(9)}]=m[${u(2)}];m[${u(16)}]=m[${u(16)}]+${u(1)};m[${u(32)}]=m[${u(8)}];m[${u(33)}]=${u(4294967295)};m[${u(35)}]=${u(0)};}}
    gpu.barrier.block();if(m[${u(6)}]!==${u(0)}){break;}
    for(let step=${u(0)};step<${u(L.pathDepth)};step++){
      if(lane===${u(0)}){${n('advance')}(m,s,a,p,f,su,sf,vu,vf,cancellation${tail});}
      gpu.barrier.block();
      if(m[${u(38)}]===${u(1)}){
        let result=${H.frontier('s',`m[${u(32)}]*${u(L.stateWords)}`,'vu',u(0),'vf',u(0),'vu',u(L.viewActions),'vu',u(L.viewEdges),'vf',u(L.viewEdgeF32),'vu',u(L.viewChildren),'vf',u(L.viewChildF32),`m[${u(34)}]`,'true','sf',u(L.valueBase),`m[${u(23)}]`,`m[${u(36)}]`,`m[${u(37)}]`)};
        let prior=gpu.atomic.cas(m,${u(39)},${u(4294967295)},result);if(prior!==${u(4294967295)}&&prior!==result){gpu.atomic.storeReleaseDevice(m,${u(41)},${u(1)});}
      }
      gpu.barrier.block();
      if(lane===${u(0)}&&m[${u(38)}]===${u(1)}){${n('finishFrontier')}(m,s,a,p,f,su,sf,vu,vf${tail});}
      gpu.barrier.block();if(m[${u(35)}]===${u(1)}||m[${u(6)}]!==${u(0)}){break;}
    }
    if(lane===${u(0)}){if(m[${u(35)}]!==${u(1)}&&m[${u(6)}]===${u(0)}){m[${u(6)}]=${u(5)};}${n('backupRelease')}(m,s,a,p,f,su,sf,vu,vf,cancellation${tail});}
    gpu.barrier.block();
  }
  if(lane===${u(0)}){
    if(m[${u(6)}]===${u(0)}){m[${u(6)}]=${u(1)};}m[${u(7)}]=${u(3)};for(let w=${u(0)};w<${u(32)};w++){out[w]=m[w];}out[${u(0)}]=m[${u(6)}];out[${u(24)}]=${u(0)};
    if(m[${u(6)}]!==${u(11)}&&m[${u(10)}]===expectedArena&&m[${u(11)}]===expectedFocusEpoch&&${n('valid')}(m,m[${u(8)}],expectedRootGeneration,expectedArena)){let root=m[${u(8)}];let count=${n('view')}(m,s,a,p,f,vu,vf,root);if(count!==${u(4294967295)}){let selected=${H.decision('vu',u(0),'vf',u(0),'vu',u(L.viewEdges),'vf',u(L.viewEdgeF32),'count')};if(selected<count){let e=vu[${u(L.viewIds)}+selected];out[${u(24)}]=${u(1)};out[${u(25)}]=e;for(let w=${u(0)};w<${u(L.actionWords)};w++){out[${u(32)}+w]=a[e*${u(L.actionWords)}+w];}}}}
  }
  gpu.barrier.block();
}
`;
  const param=(name,type)=>({name,type}),ptr=name=>param(name,U),fl=name=>param(name,F),num=name=>param(name,N),dev=(name,parameters,returns='void')=>({name,kind:'device',parameters,returns});
  const extra=external.map(({name,type})=>({name,type}));
  const functions=[...graph.functions,dev(n('view'),[ptr('m'),ptr('s'),ptr('a'),ptr('p'),fl('f'),ptr('vu'),fl('vf'),num('node')],N),dev(n('scatter'),[ptr('m'),ptr('p'),fl('f'),ptr('vu'),fl('vf'),num('node'),num('count')]),dev(n('advance'),[ptr('m'),ptr('s'),ptr('a'),ptr('p'),fl('f'),ptr('su'),fl('sf'),ptr('vu'),fl('vf'),param('cancellation','sideband<host-to-device,u32>'),...extra]),dev(n('finishFrontier'),[ptr('m'),ptr('s'),ptr('a'),ptr('p'),fl('f'),ptr('su'),fl('sf'),ptr('vu'),fl('vf'),...extra]),dev(n('backupRelease'),[ptr('m'),ptr('s'),ptr('a'),ptr('p'),fl('f'),ptr('su'),fl('sf'),ptr('vu'),fl('vf'),param('cancellation','sideband<host-to-device,u32>'),...extra]),dev(name,[ptr('m'),ptr('s'),ptr('a'),ptr('p'),fl('f'),ptr('su'),fl('sf'),ptr('out'),ptr('vu'),fl('vf'),param('cancellation','sideband<host-to-device,u32>'),num('expectedArena'),num('expectedRootGeneration'),num('expectedFocusEpoch'),...extra])];
  return {source:graph.source+view+advance+main,functions,launchConstraint:cooperativeDeviceSearchContract.launch,sourceGroups:[{owner:'graph',source:graph.source+view,names:functions.slice(0,6).map(f=>f.name)},{owner:'progress',source:advance+main,names:functions.slice(6).map(f=>f.name)}]};
}

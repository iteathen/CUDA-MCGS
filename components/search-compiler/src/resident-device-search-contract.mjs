import {cooperativeDeviceSearchContract} from './cooperative-device-search.mjs';

const U='ptr<u32>',F='ptr<f32>',N='u32',B='bool';
const pair=(name,type)=>[{name,type},{name:name+'Base',type:N}];
const base=cooperativeDeviceSearchContract.hooks;
const hook=(port,parameters,returns='u32')=>({port,parameters,returns});
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}

// This contract is the ABI declaration for the selected single-worker resident
// realization. Source generation and owner validation live in canonicalSearchCompiler.
export const residentDeviceSearchContract=freeze({
  contract:'cuda-mcgs.resident-device-search-core/0.1.0',
  execution:{workerCount:1,requestCapacity:1,batchCapacity:1,bodyParticipation:{kind:'collective-block',blockSize:32},controllerParticipation:{kind:'controller-only',blockSize:1},hostProgress:'none'},
  reclamation:{kind:'lazy-second-chance',maxClockCandidatesPerAllocationAttempt:1,spanAllocation:'contiguous-coalescing',incomingReferences:'generation-checked-lazy'},
  commands:{identityWords:4,generationWords:4,notificationType:'u32',notificationMeaning:'wake-hint-only',readyAdvance:'already-ready-successor',admission:'separate-compound-prepare-commit'},
  views:{childReady:{unresolved:0,ready:1,stale:2},complete:'full-bounded-action-source-order',unresolvedRecords:'opaque-absent-with-readiness-mask'},
  hooks:{
    ...Object.fromEntries(Object.entries(base).filter(([name])=>!['initializeEdge','frontier','apply','decision'].includes(name))),
    classifyTransitionResult:hook('apply-transition',[{name:'status',type:N}]),
    initializeCandidate:hook('initialize-policy-records',[...pair('parent',U),...pair('action',U),...pair('edge',U),...pair('numeric',F)],'void'),
    prepare:hook('prepare-backup',[...pair('node',U),{name:'work',type:N},{name:'occurrences',type:N}]),
    abandon:hook('fail-backup',[...pair('node',U),{name:'work',type:N},{name:'disposition',type:N}],'void'),
    retirePolicy:hook('classify-policy-reuse',[...pair('node',U),...pair('nodeNumeric',F),...pair('edges',U),...pair('edgeNumeric',F),{name:'count',type:N}]),
    evaluateStop:hook('evaluate-policy-stop',[...pair('node',U),...pair('nodeNumeric',F)]),
    classifyFrontier:hook('classify-path-response',[...pair('state',U),...pair('node',U),...pair('nodeNumeric',F),...pair('value',F),{name:'depth',type:N},{name:'reason',type:N},{name:'relation',type:N}]),
    encodeEvaluation:hook('encode-evaluator-input',[...pair('state',U),...pair('actions',U),{name:'count',type:N},...pair('encoded',F)]),
    consumeEvaluation:hook('map-evaluator-output',[...pair('state',U),...pair('node',U),...pair('nodeNumeric',F),...pair('actions',U),...pair('edges',U),...pair('edgeNumeric',F),{name:'count',type:N},...pair('results',F),...pair('value',F)]),
    apply:hook('apply-backup-step',[
      {name:'policy',type:U},{name:'nodeBase',type:N},{name:'incomingBase',type:N},{name:'numeric',type:F},{name:'nodeNumericBase',type:N},{name:'incomingNumericBase',type:N},
      ...pair('value',F),...pair('state',U),...pair('parent',U),...pair('action',U),...pair('actions',U),...pair('edges',U),...pair('edgeNumeric',F),...pair('children',U),...pair('childNumeric',F),...pair('childReady',U),
      {name:'count',type:N},{name:'complete',type:B},{name:'terminalRole',type:N},{name:'work',type:N},
    ]),
    encodeSnapshotRow:hook('select-next',[...pair('record',U),...pair('numeric',F),...pair('encoded',U)]),
    encodeUnavailableRow:hook('select-next',pair('encoded',U)),
    chooseEncoded:hook('select-next',[{name:'rows',type:U},{name:'rowBase',type:N},{name:'count',type:N},{name:'restriction',type:U}]),
  },
  publication:{slotCount:2,borrow:'immutable-single-observer',maxAcquireAttempts:3,headerWords:12,rowActionWords:'selected-domain-action-width',rowPayloadWords:5,epochFence:['arenaIncarnation','rootSlot','rootGeneration','focusEpoch','publicationGeneration'],observationActionProduction:'forbidden'},
});

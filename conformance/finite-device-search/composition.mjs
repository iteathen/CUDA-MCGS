import * as compiler from '../../components/search-compiler/index.mjs';
import { fixtureContext,identity } from './fixture.mjs';
import { buildProgramPackageProfile } from '../search-compiler/src/program-package-fixtures.mjs';

// Test-only assembly of selected owner values through the canonical Composer.
// Runtime placement is deliberately a separate physical conformance boundary.
export function composeFiniteFixture(options={}) {
  let context=fixtureContext(options);
  const generatorOptions={name:'finiteSearch',maxIterations:options.iterations??4};
  const provisional=compiler.createFiniteDeviceSearchCore(context,generatorOptions);
  context=fixtureContext({...options,graphSource:provisional.programContributions[0].source,progressSource:provisional.programContributions[1].source});
  const core=compiler.createFiniteDeviceSearchCore(context,generatorOptions);
  if(core.source!==provisional.source)throw new Error('source identity closure must be stable');
  const profileResults=['domain','graph','policy','resource','progress','output'].map(owner=>context[owner]);
  const built=buildProgramPackageProfile(context.authority,{profileResults,domainResult:context.domain,graphResult:context.graph,policyResult:context.policy,resourceResult:context.resource,progressResult:context.progress,outputResult:context.output,evaluatorResult:null,sessionResult:null,stageResult:null,channelResult:null},'finite-search');
  const input=built.input;
  for(const result of profileResults){
    const owner=result.normalized.id,unit=input.sourceUnits.find(u=>u.ownerProfile===owner);
    if(!unit)continue;
    const contribution=core.programContributions.find(c=>c.ownerProfile===owner);
    const bundle=context.sourceBundles.find(c=>c.ownerProfile===owner);
    if(contribution||bundle){
      const source=(contribution??bundle).source;
      const functions=contribution?contribution.functions:bundle.functions.map(({participation,launchConstraint,kind,...fn})=>({...fn,executionRole:'device-callable',ownerProfile:owner,sourceUnit:unit.id,semanticRole:owner+'.fixture-callback',calls:fn.name==='fdRelation'?['fdEqual']:[],helpers:[],...(launchConstraint?{launchConstraint}:{})}));
      const oldNames=new Set(unit.functions);
      unit.source=source;unit.sourceIdentity=identity(source);unit.contributionIdentity=result.normalized.programContribution.sourceIdentity;unit.functions=functions.map(f=>f.name);
      input.functions=input.functions.filter(f=>!oldNames.has(f.name));input.functions.push(...functions.map(fn=>({...fn,sourceUnit:unit.id})));
      const programUnit=input.programUnits.find(p=>p.functions.some(n=>oldNames.has(n)));programUnit.functions=[...unit.functions];
    }else{unit.source=unit.source.replace('return 1;','return gpu.u32(1);');unit.sourceIdentity=identity(unit.source);}
  }
  const entry=input.functions.find(f=>f.name==='engine_step'),entryUnit=input.sourceUnits.find(u=>u.id===entry.sourceUnit);
  entry.parameters=core.programContributions[1].functions[0].parameters;entry.calls=['finiteSearch'];entry.helpers=[];
  entryUnit.source=`function engine_step(${entry.parameters.map(p=>p.name).join(',')}){finiteSearch(${entry.parameters.map(p=>p.name).join(',')});}\n`;entryUnit.sourceIdentity=identity(entryUnit.source);
  const offsets=new Map(),delivery=input.deliveries[0];
  const placements=core.buffers.map(buffer=>{
    const pool=buffer.name==='out'?context.resource.normalized.pools.find(p=>p.providerRequirement===input.resources.find(r=>r.id===delivery.resource).providerRequirement):context.resource.normalized.pools.find(p=>p.unit==='bytes'&&p.id.includes(buffer.ownerProfile.replaceAll('.','-'))&&p.id.endsWith(buffer.name==='a'?'action-bytes':buffer.ownerProfile===context.graph.normalized.id?'state-bytes':'record-bytes'));
    if(!pool)throw new Error('selected finite fixture has no Resource-owned byte pool for '+buffer.name);
    const resource=input.resources.find(r=>r.providerRequirement===pool.providerRequirement),byteOffset=buffer.name==='out'?Number(delivery.byteOffset):offsets.get(pool.id)??0;
    if(byteOffset+buffer.byteLength>Number(pool.capacity))throw new Error('finite fixture placement exceeds Resource pool');
    offsets.set(pool.id,byteOffset+buffer.byteLength);
    return {parameter:buffer.name,source:{kind:'resource',resource:resource.id,access:buffer.access,view:{dtype:buffer.elementType,byteOffset:String(byteOffset),elementCount:String(buffer.elements)}}};
  });
  const scalarSchema={id:'cuda-mcgs.finite-fixture-u32/0.1.0',version:'0.1.0',sha256:identity('finite fixture scalar').sha256};
  input.operations[0].bindings=[...placements,{parameter:'cancellation',source:{kind:'sideband',sideband:input.sidebands.find(s=>s.role==='framework-cancellation').id}},...['expectedArena','expectedRootGeneration','expectedFocusEpoch'].map(parameter=>({parameter,source:{kind:'scalar',schema:scalarSchema}}))];
  input.operations[0].grid=['1','1','1'];input.operations[0].block=['1','1','1'];
  for(const record of input.deletion.records)record.functions=input.functions.filter(f=>input.sourceUnits.find(u=>u.id===f.sourceUnit)?.semanticOwner===record.owner).map(f=>f.name);
  const normalized=compiler.normalizeProgramPackageProfile(input,context.authority,built.context);
  const program=compiler.composeSearchProgram(normalized);
  return {context,core,programPackage:normalized,program,placements};
}

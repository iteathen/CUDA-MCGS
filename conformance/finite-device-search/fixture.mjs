import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as compiler from '../../components/search-compiler/index.mjs';
import { buildDomainProfiles } from '../search-compiler/src/domain-fixtures.mjs';
import { buildGraphProfiles } from '../search-compiler/src/graph-fixtures.mjs';
import { buildPolicyProfiles } from '../search-compiler/src/policy-fixtures.mjs';
import { buildResourceProfile } from '../search-compiler/src/resource-fixtures.mjs';
import { buildProgressProfile } from '../search-compiler/src/progress-fixtures.mjs';
import { buildOutputProfile } from '../search-compiler/src/output-fixtures.mjs';

export const revision = '7aa789fd2f3d6fa49a30e00d1ab9c2186eab88e5';
export const identity = source => ({ algorithm: 'sha256', sha256: createHash('sha256').update(source.replace(/\r\n?/g, '\n').replace(/\n+$/g, '') + '\n').digest('hex') });
const param = (name, type) => ({ name, type });
const fn = (name, parameters, returns) => ({ name, kind: 'device', parameters: parameters.map(([name, type]) => param(name, type)), returns });
export const domainSource = `
function fdValid(s,b) { return s[b] <= gpu.u32(3) && s[b+gpu.u32(1)] <= gpu.u32(4); }
function fdKey(s,b) { return gpu.u32(7); }
function fdEqual(a,ab,b,bb) { for(let i=gpu.u32(0);i<gpu.u32(64);i++){ if(a[ab+i]!==b[bb+i]){return false;} } return true; }
function fdActions(s,b,a,ab,capacity) {
  let id=s[b]; let kind=s[b+gpu.u32(1)]; let count=gpu.u32(0);
  if(id===gpu.u32(0)){count=gpu.u32(2);} else if(kind===gpu.u32(0)&&id<gpu.u32(3)){count=gpu.u32(1);}
  if(kind===gpu.u32(3)){count=gpu.u32(0);} if(kind===gpu.u32(4)){count=gpu.u32(1);}
  if(count>capacity){return gpu.u32(4294967295);}
  for(let j=gpu.u32(0);j<count;j++){ for(let w=gpu.u32(0);w<gpu.u32(16);w++){a[ab+j*gpu.u32(16)+w]=gpu.u32(0);} a[ab+j*gpu.u32(16)]=j; }
  return count;
}
function fdActionValid(s,b,a,ab) { return a[ab]<gpu.u32(2); }
function fdActionEqual(a,ab,b,bb) { for(let i=gpu.u32(0);i<gpu.u32(16);i++){ if(a[ab+i]!==b[bb+i]){return false;} } return true; }
function fdTransition(s,b,a,ab,d,db) {
  for(let i=gpu.u32(0);i<gpu.u32(64);i++){d[db+i]=s[b+i];}
  let id=s[b]; let kind=s[b+gpu.u32(1)];
  if(kind===gpu.u32(4)){d[db]=gpu.u32(0);return gpu.u32(0);}
  if(id===gpu.u32(0)){d[db]=a[ab]+gpu.u32(1);} else {d[db]=gpu.u32(3);}
  return gpu.u32(0);
}
function fdTerminal(s,b,o,ob) {
  let id=s[b]; let kind=s[b+gpu.u32(1)];
  if(kind===gpu.u32(3)){o[ob]=gpu.u32(7);return gpu.u32(1);}
  if(kind===gpu.u32(0)&&id===gpu.u32(3)){o[ob]=gpu.u32(5);return gpu.u32(1);}
  if(kind===gpu.u32(1)&&id>gpu.u32(0)){o[ob]=id*gpu.u32(10);return gpu.u32(1);}
  return gpu.u32(0);
}
function fdRelation(s,b,a,ab) { if(fdEqual(s,b,a,ab)){return gpu.u32(1);} return gpu.u32(0); }
`;
export const domainFunctions = [
  fn('fdValid',[['s','ptr<u32>'],['b','u32']],'bool'), fn('fdKey',[['s','ptr<u32>'],['b','u32']],'u32'),
  fn('fdEqual',[['a','ptr<u32>'],['ab','u32'],['b','ptr<u32>'],['bb','u32']],'bool'),
  fn('fdActions',[['s','ptr<u32>'],['b','u32'],['a','ptr<u32>'],['ab','u32'],['capacity','u32']],'u32'),
  fn('fdActionValid',[['s','ptr<u32>'],['b','u32'],['a','ptr<u32>'],['ab','u32']],'bool'),
  fn('fdActionEqual',[['a','ptr<u32>'],['ab','u32'],['b','ptr<u32>'],['bb','u32']],'bool'),
  fn('fdTransition',[['s','ptr<u32>'],['b','u32'],['a','ptr<u32>'],['ab','u32'],['d','ptr<u32>'],['db','u32']],'u32'),
  fn('fdTerminal',[['s','ptr<u32>'],['b','u32'],['o','ptr<u32>'],['ob','u32']],'u32'),
  fn('fdRelation',[['s','ptr<u32>'],['b','u32'],['a','ptr<u32>'],['ab','u32']],'u32'),
];
export const policySource = `
function fpInit(p,b,f,fb) { for(let j=gpu.u32(0);j<gpu.u32(4);j++){p[b+j]=gpu.u32(0);f[fb+j]=gpu.f32(0);} }
function fpSelect(v,b,f,fb,count,work) { let best=gpu.u32(0); for(let j=gpu.u32(1);j<count;j++){if(v[b+j*gpu.u32(4)]<v[b+best*gpu.u32(4)]){best=j;}} return best; }
function fpReserve(p,b,work) { if(p[b+gpu.u32(1)]!==gpu.u32(0)){return gpu.u32(1);} p[b+gpu.u32(1)]=work;return gpu.u32(0); }
function fpRelease(p,b,work,disposition) { if(p[b+gpu.u32(1)]===work){p[b+gpu.u32(1)]=gpu.u32(0);} }
function fpTerminal(o,b,v,vb) {v[vb]=gpu.f32(o[b]);return gpu.u32(0);}
function fpFrontier(s,b,v,vb,depth,reason,relation) { if(reason===gpu.u32(0)){return gpu.u32(1);} v[vb]=gpu.f32(9);return gpu.u32(0); }
function fpValueValid(v,b) { return v[b]===v[b] && v[b]>=gpu.f32(-1000) && v[b]<=gpu.f32(1000); }
function fpPrepare(p,b,work) {return gpu.u32(0);}
function fpApply(p,nb,eb,f,nfb,efb,v,vb,s,sb,work) { if(p[nb]>=gpu.u32(1000000)){return gpu.u32(1);} p[nb]=p[nb]+gpu.u32(1);f[nfb]=f[nfb]+v[vb];if(eb!==gpu.u32(4294967295)){p[eb]=p[eb]+gpu.u32(1);f[efb]=f[efb]+v[vb];}return gpu.u32(0); }
function fpComplete(p,b,work) {p[b+gpu.u32(2)]=work;}
function fpDecision(v,b,f,fb,count) {if(count===gpu.u32(0)){return gpu.u32(4294967295);}return gpu.u32(0);}
`;
export const policyFunctions = [
  fn('fpInit',[['p','ptr<u32>'],['b','u32'],['f','ptr<f32>'],['fb','u32']],'void'),
  fn('fpSelect',[['v','ptr<u32>'],['b','u32'],['f','ptr<f32>'],['fb','u32'],['count','u32'],['work','u32']],'u32'),
  fn('fpReserve',[['p','ptr<u32>'],['b','u32'],['work','u32']],'u32'), fn('fpRelease',[['p','ptr<u32>'],['b','u32'],['work','u32'],['disposition','u32']],'void'),
  fn('fpTerminal',[['o','ptr<u32>'],['b','u32'],['v','ptr<f32>'],['vb','u32']],'u32'),
  fn('fpFrontier',[['s','ptr<u32>'],['b','u32'],['v','ptr<f32>'],['vb','u32'],['depth','u32'],['reason','u32'],['relation','u32']],'u32'),
  fn('fpValueValid',[['v','ptr<f32>'],['b','u32']],'bool'), fn('fpPrepare',[['p','ptr<u32>'],['b','u32'],['work','u32']],'u32'),
  fn('fpApply',[['p','ptr<u32>'],['nb','u32'],['eb','u32'],['f','ptr<f32>'],['nfb','u32'],['efb','u32'],['v','ptr<f32>'],['vb','u32'],['s','ptr<u32>'],['sb','u32'],['work','u32']],'u32'),
  fn('fpComplete',[['p','ptr<u32>'],['b','u32'],['work','u32']],'void'),
  fn('fpDecision',[['v','ptr<u32>'],['b','u32'],['f','ptr<f32>'],['fb','u32'],['count','u32']],'u32'),
];
policyFunctions.find(f=>f.name==='fpFrontier').participation={kind:'controller-only',blockSize:1};
policyFunctions.find(f=>f.name==='fpFrontier').launchConstraint={grid:['1','1','1'],block:['1','1','1']};

export function fixtureContext({ nodes=16, edges=32, depth=8, fault='', slow='',graphSource,progressSource,policyModule }={}) {
  let selectedPolicySource=policyModule?.source??policySource;
  if(fault==='prepare')selectedPolicySource=selectedPolicySource.replace('function fpPrepare(p,b,work) {return gpu.u32(0);}','function fpPrepare(p,b,work) {return gpu.u32(1);}');
  if(fault==='backup')selectedPolicySource=selectedPolicySource.replace('function fpApply(p,nb,eb,f,nfb,efb,v,vb,s,sb,work) {','function fpApply(p,nb,eb,f,nfb,efb,v,vb,s,sb,work) { if(nb===gpu.u32(0)){return gpu.u32(1);}');
  if(fault==='reserve')selectedPolicySource=selectedPolicySource.replace('function fpReserve(p,b,work) {','function fpReserve(p,b,work) { return gpu.u32(1);');
  if(fault==='decision-view')selectedPolicySource=selectedPolicySource.replace('function fpDecision(v,b,f,fb,count) {','function fpDecision(v,b,f,fb,count) { if(count>gpu.u32(0)){v[b]=gpu.u32(999);f[fb]=gpu.f32(999);}');
  if(slow==='frontier')selectedPolicySource=selectedPolicySource.replace('function fpFrontier(s,b,v,vb,depth,reason,relation) {','function fpFrontier(s,b,v,vb,depth,reason,relation) { for(let effort=gpu.u32(0);effort<gpu.u32(8000000);effort++){gpu.atomic.add(v,vb,gpu.f32(0.000001));}');
  if(slow==='backup')selectedPolicySource=selectedPolicySource.replace('function fpApply(p,nb,eb,f,nfb,efb,v,vb,s,sb,work) {','function fpApply(p,nb,eb,f,nfb,efb,v,vb,s,sb,work) { if(work===gpu.u32(1)&&s[sb]===gpu.u32(3)){for(let effort=gpu.u32(0);effort<gpu.u32(8000000);effort++){gpu.atomic.add(p,nb+gpu.u32(3),gpu.u32(1));}}');
  const authority=compiler.getAcceptedContractAuthority();
  const schemaShas=Object.fromEntries(['domain','graph','policy','resource','progress','output'].map(name=>[name,createHash('sha256').update(readFileSync(new URL('../../schemas/search-ir/0.2.0/'+name+'-profile.schema.json',import.meta.url))).digest('hex')]));
  const withSchema=(result,name)=>({...result,schemaSha:schemaShas[name]});
  const dInput=buildDomainProfiles(authority)[0]; dInput.programContribution.sourceIdentity=identity(domainSource);
  const domains=buildDomainProfiles(authority).map(input=>compiler.normalizeDomainProfile(input,authority));
  const domain=withSchema(compiler.normalizeDomainProfile(dInput,authority),'domain'); domains[0]=domain;
  const graphFixtures=buildGraphProfiles(authority,domains,schemaShas.domain);
  const gInput=graphFixtures[0].input;
  if(graphSource)gInput.programContribution.sourceIdentity=identity(graphSource);
  for(const layout of gInput.layouts){const role=gInput.objectKinds.find(o=>o.id===layout.objectKind).role;if(role==='state-node')layout.capacity=String(nodes);if(role==='parent-edge')layout.capacity=String(edges);layout.bytePool=String(BigInt(layout.capacity)*BigInt(layout.recordBytes));}
  gInput.path.maxDepth=String(depth);
  const graph=withSchema(compiler.normalizeGraphProfile(gInput,authority,domain),'graph');
  const graphs=graphFixtures.map(({input,domain},i)=>i===0?graph:compiler.normalizeGraphProfile(input,authority,domain));
  const pInput=buildPolicyProfiles(authority,domains,graphs,schemaShas.domain,schemaShas.graph)[0].input;pInput.programContribution.sourceIdentity=identity(selectedPolicySource);
  if(slow)for(const port of pInput.ports){port.bounds.maxWorkUnits='8000100';port.bounds.maxReads='8000100';port.bounds.maxWrites='8000100';}
  for(const scope of ['node','edge']) for(const family of ['u32','f32']) {
    const record=structuredClone(pInput.records.find(r=>r.semanticKind==='statistic'));
    record.id=`policy.synthetic-scalar-absent.record-${scope}-${family}`;record.scope=scope;record.storage.objectRole='separate-policy-arena';record.storage.sizeBytes='16';
    record.numeric.representation=family==='u32'?'integer':'floating';record.numeric.storageBits='32';record.numeric.accumulationBits='32';record.numeric.rounding=family==='u32'?'exact':'nearest-even';record.numeric.nonfinite=family==='u32'?'not-representable':'reject';
    pInput.records.push(record);
    pInput.reuse.push({...structuredClone(pInput.reuse[0]),record:record.id});
    for(const port of pInput.ports) port.records.push(record.id);
  }
  const policy=withSchema(compiler.normalizePolicyProfile(pInput,authority,domain,graph),'policy');
  const rInput=buildResourceProfile('finite-search',authority,{domain,graph,policy,evaluator:null},schemaShas);
  const resource=withSchema(compiler.normalizeResourceProfile(rInput,authority,[domain,graph,policy]),'resource');
  const progressInput=buildProgressProfile('finite-search',authority,resource);
  if(progressSource)progressInput.programContribution.sourceIdentity=identity(progressSource);
  const progress=withSchema(compiler.normalizeProgressProfile(progressInput,authority,resource,[domain,graph,policy]),'progress');
  const output=withSchema(compiler.normalizeOutputProfile(buildOutputProfile('finite-search',authority,resource,progress),authority,resource,progress),'output');
  const sourceBundles=[{ownerProfile:domain.normalized.id,source:domainSource,functions:domainFunctions},{ownerProfile:policy.normalized.id,source:selectedPolicySource,functions:policyModule?.functions??policyFunctions}];
  const slots={validateRoot:['domain','validate-root','fdValid'],key:['domain','identity-key','fdKey'],equalState:['domain','equal-state','fdEqual'],actions:['domain','produce-actions','fdActions'],actionValid:['domain','validate-action','fdActionValid'],actionEqual:['domain','equal-action','fdActionEqual'],transition:['domain','apply-transition','fdTransition'],terminal:['domain','terminal-outcome','fdTerminal'],relation:['domain','classify-path-relation','fdRelation'],initialize:['policy','initialize-policy-records','fpInit'],select:['policy','select-next','fpSelect'],reserve:['policy','reserve-in-flight','fpReserve'],release:['policy','release-in-flight','fpRelease'],terminalValue:['policy','map-terminal-outcome','fpTerminal'],frontier:['policy','classify-path-response','fpFrontier'],valueValid:['policy','map-terminal-outcome','fpValueValid'],prepare:['policy','prepare-backup','fpPrepare'],apply:['policy','apply-backup-step','fpApply'],complete:['policy','complete-backup','fpComplete'],decision:['policy','select-next','fpDecision']};
  const hooks=Object.fromEntries(Object.entries(slots).map(([slot,[owner,port,fn]])=>[slot,{ownerProfile:({domain,policy})[owner].normalized.id,port,function:fn}]));
  if(policyModule){delete hooks.initialize;for(const [slot,fn]of Object.entries(policyModule.hooks))hooks[slot]={ownerProfile:policy.normalized.id,port:policyModule.contract.hooks[slot].port,function:fn};}
  return {authority,domain,graph,policy,resource,progress,output,sourceBundles,hooks};
}

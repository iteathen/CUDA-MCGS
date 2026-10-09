import {canonicalIdentity,exactKeys,fail} from './validation.mjs';

// Consumer-owned capability selections are canonical data, never executable code
// or a claim that CUDA-JS issued these digests as its own schema identities.
export function normalizePublicRequirementSelections(input,requirements){
  if(input===undefined)return undefined;
  if(!Array.isArray(input)||input.length<1||input.length>16)fail('COMPOSE_REQUIREMENT_SELECTION','bounded consumer selections are required');
  const result=input.map(item=>{
    exactKeys(item,['reference','document'],'COMPOSE_REQUIREMENT_SELECTION','consumer selection');
    exactKeys(item.reference,['id','version','sha256'],'COMPOSE_REQUIREMENT_SELECTION','consumer reference');
    const d=item.document;
    exactKeys(d,['schema','owner','requirement','lower'],'COMPOSE_REQUIREMENT_SELECTION','consumer document');
    exactKeys(d.requirement,['id','version','capability','value'],'COMPOSE_REQUIREMENT_SELECTION','selected capability');
    exactKeys(d.lower,['peer','compatibility'],'COMPOSE_REQUIREMENT_SELECTION','selected public lower');
    if(d.schema!=='cuda-mcgs.public-cuda-js-requirement-selection/0.1.0'||d.owner!=='CUDA-MCGS-consumer'||d.requirement.id!==item.reference.id||d.requirement.version!==item.reference.version||canonicalIdentity(d).sha256!==item.reference.sha256||!requirements.some(r=>(r.contract??r).id===item.reference.id&&(r.contract??r).version===item.reference.version&&(r.contract??r).sha256===item.reference.sha256))fail('COMPOSE_REQUIREMENT_SELECTION','consumer bytes/reference differ from exact selected public requirements');
    return structuredClone(item);
  }).sort((a,b)=>a.reference.id.localeCompare(b.reference.id));
  if(new Set(result.map(r=>r.reference.id)).size!==result.length)fail('COMPOSE_REQUIREMENT_SELECTION','duplicate selected public capability');
  return result;
}

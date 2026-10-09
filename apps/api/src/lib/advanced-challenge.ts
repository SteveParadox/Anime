import type {DatabaseClient} from '@/db/raw';
import {fighters} from '@anime/domain/catalog';
import {abilitiesForVersion,abilityById,versionById} from '@anime/domain/characters';
import {loadVersionStrategies} from '@/lib/version-strategy';
import {validateRoleRules,type ChallengeDefinitionInput,type ChallengeRestrictions,type TacticalMember} from '@anime/contracts/advanced-challenge';

type MetadataRow={characterId:string;franchiseId:string;versionId:string;alignment:string};
type EligibleMember=TacticalMember&{franchiseId:string;alignment:string};
const invalid=(message:string)=>Object.assign(new Error(message),{status:400});

async function loadMetadata(db:DatabaseClient,versionIds:string[]){
 if(!versionIds.length)return new Map<string,MetadataRow>();
 const placeholders=versionIds.map(()=>'?').join(',');
 // Newly curated roster entries may be seeded after migration 0002 was applied.
 // A missing franchise row must not silently exclude a canonical fighter from
 // all advanced challenges. Use the same deterministic series slug as rule validation.
 const rows=(await db.prepare(`SELECT v.id AS versionId,v.character_id AS characterId,cf.franchise_id AS franchiseId,COALESCE(a.alignment,'unknown') AS alignment FROM character_versions v LEFT JOIN character_franchises cf ON cf.character_id=v.character_id LEFT JOIN version_challenge_alignment a ON a.version_id=v.id WHERE v.id IN (${placeholders})`).bind(...versionIds).all<MetadataRow>()).results;
 const franchises=new Map(fighters.map(f=>[f.id,f.series.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')]));
 return new Map(rows.filter(row=>Boolean(row.franchiseId||franchises.get(row.characterId))).map(row=>[row.versionId,{...row,franchiseId:row.franchiseId||franchises.get(row.characterId)!}]));
}

function legal(member:EligibleMember,rules:ChallengeRestrictions){
 if(rules.bannedCharacters.includes(member.characterId)||rules.bannedVersions.includes(member.versionId)||rules.bannedFranchises.includes(member.franchiseId))return false;
 if(rules.franchise!=='any'&&rules.franchise!=='same'&&member.franchiseId!==rules.franchise)return false;
 if(rules.alignment!=='any'&&member.alignment!==rules.alignment)return false;
 if(member.roles.some(r=>rules.bannedRoles.includes(r.role as typeof rules.bannedRoles[number])))return false;
 // Mastered, limited and conditional abilities still exist on that version;
 // only explicitly lost powers may be ignored by ban/transform restrictions.
 const abilities=abilitiesForVersion(member.versionId).filter(x=>x.link.status!=='lost');
 if(abilities.some(x=>rules.bannedAbilities.includes(x.ability.id)||rules.bannedAbilityCategories.includes(x.ability.category)))return false;
 if(!rules.transformationsAllowed&&abilities.some(x=>x.ability.category==='transformation'))return false;
 return true;
}

function disabledFor(versionId:string,rules:ChallengeRestrictions){
 return abilitiesForVersion(versionId).some(x=>x.link.status!=='lost'&&(rules.disabledAbilities.includes(x.ability.id)||rules.disabledAbilityCategories.includes(x.ability.category)));
}

export async function enforceAdvancedRestrictions(db:DatabaseClient,rules:ChallengeRestrictions,members:TacticalMember[]){
 const meta=await loadMetadata(db,members.map(m=>m.versionId));
 const resolved=members.map(member=>({...member,...meta.get(member.versionId)})) as EligibleMember[];
 if(resolved.some(m=>!m.franchiseId||!legal(m,rules)))throw invalid('A selected version is restricted by this challenge.');
 if(rules.franchise==='same'&&new Set(resolved.map(m=>m.franchiseId)).size>1)throw invalid('All selected fighters must be from the same franchise.');
 try{validateRoleRules(members,rules.roleRequirements);}catch(error){throw invalid((error as Error).message);}
 for(const member of members)if(disabledFor(member.versionId,rules)&&(member.roles.length||member.traits.length))throw invalid('Disabled abilities cannot contribute tactical role or trait evidence.');
}

export async function feasibleRoster(db:DatabaseClient,input:ChallengeDefinitionInput){
 const roster=await eligibleRoster(db,input);
 let visits=0,solution:EligibleMember[]|null=null;
 const walk=(start:number,chosen:EligibleMember[],cost:number,franchise:string|null):void=>{
  if(solution||visits++>100_000)return;
  if(chosen.length>=input.minMembers){
   try{validateRoleRules(chosen,input.restrictions.roleRequirements);solution=[...chosen];return;}catch{/* Continue extending. */}
  }
  if(chosen.length>=input.maxMembers)return;
  for(let i=start;i<roster.length;i++){
   const member=roster[i];
   if(cost+member.cost>input.budget||chosen.some(m=>m.characterId===member.characterId)||input.restrictions.franchise==='same'&&franchise!==null&&franchise!==member.franchiseId)continue;
   chosen.push(member);walk(i+1,chosen,cost+member.cost,franchise||member.franchiseId);chosen.pop();
   if(solution||visits>100_000)break;
  }
 };
 walk(0,[],0,null);
 return {feasible:Boolean(solution),eligibleCount:roster.length,exampleVersionIds:solution?(solution as EligibleMember[]).map(m=>m.versionId):[],reason:solution?'':visits>100_000?'Feasibility search limit reached; simplify the rules.':'No legal squad meets the budget, size and role requirements.'};
}

export function validateObjectiveTargets(input:ChallengeDefinitionInput){
 const objective=input.objective;
 const targets=objective.type==='defeat_target'?[objective.boss]:objective.type==='defend'?[objective.protectedTarget]:objective.type==='rescue'?[objective.rescueTarget]:[];
 for(const target of targets){
  const version=versionById(target.versionId);
  if(!version?.canonical||version.characterId!==target.characterId||!fighters.some(f=>f.id===target.characterId))throw invalid('Challenge target must be a canonical character version.');
 }
 const opponents=objective.type==='defend'?objective.attackerVersions:objective.type==='rescue'?objective.defenderVersions:objective.type==='capture'?objective.contestingVersions:[];
 for(const versionId of opponents)if(!versionById(versionId)?.canonical)throw invalid('Challenge opponent version is invalid.');
 for(const characterId of input.restrictions.bannedCharacters)if(!fighters.some(f=>f.id===characterId))throw invalid('Unknown banned character.');
 for(const versionId of input.restrictions.bannedVersions)if(!versionById(versionId)?.canonical)throw invalid('Unknown banned version.');
 const knownFranchises=new Set(fighters.map(f=>f.series.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')));
 for(const franchiseId of input.restrictions.bannedFranchises)if(!knownFranchises.has(franchiseId))throw invalid('Unknown banned franchise.');
 if(input.restrictions.franchise!=='any'&&input.restrictions.franchise!=='same'&&!knownFranchises.has(input.restrictions.franchise))throw invalid('Unknown required franchise.');
 const categories=new Set(['defensive','energy','hax','mobility','other','passive','physical','sensory','summoning','technique','transformation','weapon']);
 for(const id of [...input.restrictions.bannedAbilities,...input.restrictions.disabledAbilities])if(!abilityById(id))throw invalid('Unknown ability restriction.');
 for(const category of [...input.restrictions.bannedAbilityCategories,...input.restrictions.disabledAbilityCategories])if(!categories.has(category))throw invalid('Unknown ability category.');
}

export async function eligibleRoster(db:DatabaseClient,input:ChallengeDefinitionInput){
 validateObjectiveTargets(input);
 const prices=(await db.prepare('SELECT version_id AS versionId,character_id AS characterId,cost FROM squad_version_costs WHERE cost>0 ORDER BY cost,version_id').all<{versionId:string;characterId:string;cost:number}>()).results;
 const meta=await loadMetadata(db,prices.map(p=>p.versionId));
 const strategies=await loadVersionStrategies(db,prices.map(p=>p.versionId));
 const target=input.objective.type==='defeat_target'?input.objective.boss.characterId:input.objective.type==='defend'?input.objective.protectedTarget.characterId:input.objective.type==='rescue'?input.objective.rescueTarget.characterId:null;
 return prices.flatMap(p=>{
  const version=versionById(p.versionId),character=fighters.find(f=>f.id===p.characterId),m=meta.get(p.versionId);
  if(!version?.canonical||!character||!m||p.characterId===target||version.characterId!==p.characterId)return [];
  const suppressed=disabledFor(p.versionId,input.restrictions);
  return [{...p,roles:suppressed?[]:strategies.get(p.versionId)?.roles||[],traits:suppressed?[]:strategies.get(p.versionId)?.traits||[],franchiseId:m.franchiseId,alignment:m.alignment}];
 }).filter(m=>legal(m,input.restrictions));
}

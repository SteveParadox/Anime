import type {DatabaseClient} from '@/db/raw';
import {createHash} from 'node:crypto';
import {fighters} from '@anime/domain/catalog';
import {loadVersionStrategies,parseRoleSnapshot,parseTraitSnapshot} from '@/lib/version-strategy';
import {parseRoleRequirements,validateRoleRequirements,type RoleRequirement,type VersionRole,type StrategicTrait} from '@anime/domain/squad-synergy';
import {abilitiesForVersion,versionById} from '@anime/domain/characters';
import {objectiveSchema,restrictionSchema,type ChallengeObjective} from '@anime/contracts/advanced-challenge';
import {enforceAdvancedRestrictions} from '@/lib/advanced-challenge';
import {dailyChallengeRotationIndex,resolveSquadChallengeStatus,validateSquadBudget,validateSquadIdentities} from '@anime/domain/squad-challenge-policy';

import {SQUAD_CHALLENGE_TYPES,SQUAD_CHALLENGE_STATUSES,SQUAD_VOTE_VERDICTS} from '@anime/contracts/squad-challenge';
import type {SquadChallengeType,SquadChallengeStatus,SquadVoteVerdict,SquadChallengeRules,SquadChallengeRecord,SquadChallengeFighter,SquadMemberSelection,SquadMemberSnapshot} from '@anime/contracts/squad-challenge';
export {SQUAD_CHALLENGE_TYPES,SQUAD_CHALLENGE_STATUSES,SQUAD_VOTE_VERDICTS};
export type {SquadChallengeType,SquadChallengeStatus,SquadVoteVerdict,SquadChallengeRules,SquadChallengeRecord,SquadChallengeFighter,SquadMemberSelection,SquadMemberSnapshot};

type SquadChallengeDbRow={
 id:string;
 type:string;
 title:string;
 description:string;
 targetCharacterId:string|null;
 targetVersionId:string|null;
 budget:number;
 minMembers:number;
 maxMembers:number;
 rulesJson:string;
 startsAt:number;
 endsAt:number;
 status:string;
 created:number;
 objectiveJson?:string;
 sourceType?:string;
 rulesVersion?:number;
 scoringVersion?:number;
 balanceVersion?:string|null;
 tacticalAnalysisVersion?:number;
};

type SquadVersionCostDbRow={
 versionId:string;
 characterId:string;
 cost:number;
 rolesSnapshot?:string|null;
 traitsSnapshot?:string|null;
};

type DailyTemplate={
 key:string;
 type:SquadChallengeType;
 title:string|((targetCharacterName:string)=>string);
 description:string;
 targetCharacterId?:string;
 targetVersionId?:string;
 budget:number;
 minMembers:number;
 maxMembers:number;
 rules:SquadChallengeRules;
};

const DAILY_TEMPLATES:DailyTemplate[]=[
 {
  key:'mui-goku',
  type:'defeat_target',
  title:target=>`Defeat ${target}`,
  description:'Build the strongest counter-squad you can without exceeding the point budget.',
  targetCharacterId:'goku',
  targetVersionId:'goku-mastered-ultra-instinct',
  budget:100,
  minMembers:1,
  maxMembers:5,
  rules:{battleType:'knockout',location:'neutral_arena',speed:'normal',knowledge:'basic',prepTime:'none',transformationsAllowed:true,standardEquipment:true,notes:'Neutral battlefield. No outside assistance. Use only abilities available to the exact selected versions.'}
 },
 {
  key:'ten-tails-madara',
  type:'defeat_target',
  title:target=>`Defeat ${target}`,
  description:'Build a counter-squad for Madara’s Ten-Tails jinchuriki battlefield control without exceeding the point budget.',
  targetCharacterId:'madara',
  targetVersionId:'madara-ten-tails-jinchuriki',
  budget:100,
  minMembers:1,
  maxMembers:5,
  rules:{battleType:'knockout',location:'neutral_arena',speed:'normal',knowledge:'basic',prepTime:'none',transformationsAllowed:true,standardEquipment:true,notes:'Neutral battlefield. No outside assistance. Madara uses the exact Ten-Tails Jinchuriki version shown on the target card.'}
 },
 {
  key:'six-paths-naruto',
  type:'defeat_target',
  title:target=>`Defeat ${target}`,
  description:'Assemble a version-specific team that can overcome clones, mobility, and Six Paths pressure.',
  targetCharacterId:'naruto',
  targetVersionId:'naruto-six-paths',
  budget:100,
  minMembers:1,
  maxMembers:5,
  rules:{battleType:'knockout',location:'neutral_arena',speed:'normal',knowledge:'basic',prepTime:'none',transformationsAllowed:true,standardEquipment:true,notes:'Neutral battlefield. Team members begin together. No outside assistance.'}
 },
 {
  key:'gear-five-luffy',
  type:'defeat_target',
  title:target=>`Defeat ${target}`,
  description:'Spend carefully and build a team with enough control, damage, and durability for Gear Five.',
  targetCharacterId:'luffy',
  targetVersionId:'luffy-gear-5',
  budget:100,
  minMembers:1,
  maxMembers:5,
  rules:{battleType:'knockout',location:'neutral_arena',speed:'normal',knowledge:'basic',prepTime:'none',transformationsAllowed:true,standardEquipment:true,notes:'Neutral battlefield. Standard equipment. The selected versions define available transformations and abilities.'}
 }
];

export function utcDayKey(now=Date.now()){
 return new Date(now).toISOString().slice(0,10);
}

function utcDayBounds(day:string){
 const startsAt=Date.parse(`${day}T00:00:00.000Z`);
 return {startsAt,endsAt:startsAt+86_400_000};
}

function templateForDay(day:string){
 return DAILY_TEMPLATES[dailyChallengeRotationIndex(day,DAILY_TEMPLATES.length)];
}

export function effectiveChallengeStatus(challenge:Pick<SquadChallengeRecord,'status'|'startsAt'|'endsAt'>,now=Date.now()):SquadChallengeStatus{
 return resolveSquadChallengeStatus(challenge.status,challenge.startsAt,challenge.endsAt,now);
}

export function parseRules(raw:unknown):SquadChallengeRules{
 if(typeof raw!=='string')return {};
 let parsed:unknown;
 try{parsed=JSON.parse(raw);}catch{return {};}
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return {};
 const value=parsed as Record<string,unknown>,rules:SquadChallengeRules={};
 for(const key of ['battleType','location','speed','knowledge','prepTime','notes'] as const){
  if(typeof value[key]==='string')rules[key]=value[key] as string;
 }
 if(typeof value.transformationsAllowed==='boolean')rules.transformationsAllowed=value.transformationsAllowed;
 if(typeof value.standardEquipment==='boolean')rules.standardEquipment=value.standardEquipment;
 if(value.roleRequirements!==undefined)rules.roleRequirements=parseRoleRequirements(value.roleRequirements);
 if(value.restrictions!==undefined){
  const restriction=restrictionSchema.safeParse(value.restrictions);
  if(!restriction.success)throw new Error('Stored challenge restrictions are invalid.');
  rules.restrictions=restriction.data;
 }
 return rules;
}

function parseObjective(raw:string|undefined,type:SquadChallengeType,characterId:string|null,versionId:string|null):ChallengeObjective{
 if(raw&&raw!=='{}'){
  const value=objectiveSchema.safeParse(JSON.parse(raw));
  if(!value.success)throw new Error('Stored challenge objective is invalid.');
  return value.data;
 }
 if(type==='defeat_target'&&characterId&&versionId)return {type:'defeat_target',boss:{characterId,versionId}};
 return {type:'open_build'};
}

export function publicTarget(characterId:string|null,versionId:string|null){
 if(!characterId||!versionId)return null;
 const character=fighters.find(f=>f.id===characterId),version=versionById(versionId);
 if(!character||!version||version.characterId!==character.id)return null;
 return {characterId:character.id,characterName:character.name,versionId:version.id,versionName:version.name,series:character.series};
}

function rowToChallenge(row:SquadChallengeDbRow):SquadChallengeRecord{
 return {
  id:String(row.id),
  type:row.type as SquadChallengeType,
  title:String(row.title),
  description:String(row.description||''),
  targetCharacterId:row.targetCharacterId||null,
  targetVersionId:row.targetVersionId||null,
  budget:Number(row.budget),
  minMembers:Number(row.minMembers||1),
  maxMembers:Number(row.maxMembers),
  rules:parseRules(row.rulesJson),
  objective:parseObjective(row.objectiveJson,row.type as SquadChallengeType,row.targetCharacterId,row.targetVersionId),
  sourceType:row.sourceType||'rotation',rulesVersion:Number(row.rulesVersion||1),scoringVersion:Number(row.scoringVersion||1),
  balanceVersion:row.balanceVersion||null,tacticalAnalysisVersion:Number(row.tacticalAnalysisVersion||1),
  startsAt:Number(row.startsAt),
  endsAt:Number(row.endsAt),
  status:row.status as SquadChallengeStatus,
  created:Number(row.created)
 };
}

export async function findChallenge(db:DatabaseClient,id:string){
 const row=await db.prepare(`SELECT id,type,title,description,target_character_id AS targetCharacterId,target_version_id AS targetVersionId,budget,min_members AS minMembers,max_members AS maxMembers,rules_json AS rulesJson,objective_json AS objectiveJson,source_type AS sourceType,rules_version AS rulesVersion,scoring_version AS scoringVersion,balance_version AS balanceVersion,tactical_analysis_version AS tacticalAnalysisVersion,starts_at AS startsAt,ends_at AS endsAt,status,created FROM daily_squad_challenges WHERE id=? LIMIT 1`).bind(id).first<SquadChallengeDbRow>();
 return row?rowToChallenge(row):null;
}

export async function ensureDailyChallenge(db:DatabaseClient,now=Date.now()){
 const day=utcDayKey(now),id=`daily-${day}`;
 const override=await db.prepare(`SELECT id FROM daily_squad_challenges WHERE source_type<>'rotation' AND status<>'closed' AND starts_at<=? AND ends_at>? ORDER BY starts_at DESC,id ASC LIMIT 1`).bind(now,now).first<{id:string}>();
 if(override)return (await findChallenge(db,override.id))!;
 const existing=await findChallenge(db,id);
 if(existing)return existing;
 return await db.transaction(async tx=>{
 await tx.prepare('SELECT pg_advisory_xact_lock(88417421)').run();
 const official=await tx.prepare(`SELECT id FROM daily_squad_challenges WHERE source_type<>'rotation' AND status<>'closed' AND starts_at<=? AND ends_at>? ORDER BY starts_at DESC,id ASC LIMIT 1`).bind(now,now).first<{id:string}>();
 if(official)return (await findChallenge(tx,official.id))!;
 const concurrent=await findChallenge(tx,id);
 if(concurrent)return concurrent;
 const template=templateForDay(day);
 if(Boolean(template.targetCharacterId)!==Boolean(template.targetVersionId))throw new Error('Squad challenge targets must specify both character and version IDs.');
 const targetCharacter=template.targetCharacterId?fighters.find(f=>f.id===template.targetCharacterId):undefined;
 const targetVersion=template.targetVersionId?versionById(template.targetVersionId):undefined;
 if(template.targetCharacterId&&(!targetCharacter||!targetVersion||!targetVersion.canonical||targetVersion.characterId!==targetCharacter.id))throw new Error('Daily squad challenge target is not present in the canonical character-version catalog.');

 const costs=(await tx.prepare('SELECT version_id AS versionId,character_id AS characterId,cost FROM squad_version_costs ORDER BY cost ASC,version_id ASC').all<SquadVersionCostDbRow>()).results
  .filter(row=>(!targetCharacter||row.characterId!==targetCharacter.id)&&Boolean(versionById(row.versionId)?.canonical)&&versionById(row.versionId)?.characterId===row.characterId&&fighters.some(f=>f.id===row.characterId));
 if(!costs.length)throw new Error('Squad version pricing has not been initialized.');

 const title=typeof template.title==='function'?template.title(targetCharacter?.name||'the target'):template.title;
 const {startsAt,endsAt}=utcDayBounds(day),created=now;
 const balanceVersion=createHash('sha256').update(JSON.stringify(costs.map(m=>[m.versionId,m.cost]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))))).digest('hex');
 await tx.prepare(`INSERT INTO daily_squad_challenges (id,type,title,description,target_character_id,target_version_id,budget,min_members,max_members,rules_json,starts_at,ends_at,status,created,balance_version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
  .bind(id,template.type,title,template.description,targetCharacter?.id||null,targetVersion?.id||null,template.budget,template.minMembers,template.maxMembers,JSON.stringify(template.rules),startsAt,endsAt,'scheduled',created,balanceVersion).run();
 for(const row of costs){
  await tx.prepare('INSERT INTO daily_squad_challenge_costs (challenge_id,character_id,version_id,cost) VALUES (?,?,?,?)').bind(id,row.characterId,row.versionId,Number(row.cost)).run();
 }
 await tx.prepare("UPDATE daily_squad_challenges SET status='active',published_at=? WHERE id=?").bind(now,id).run();
 return (await findChallenge(tx,id))!;
 });
}

export async function challengeFighters(db:DatabaseClient,challengeId:string):Promise<SquadChallengeFighter[]>{
 const challenge=await findChallenge(db,challengeId);
 const restrictions=challenge?.rules.restrictions;
 const rows=(await db.prepare('SELECT character_id AS characterId,version_id AS versionId,cost,roles_snapshot AS rolesSnapshot,traits_snapshot AS traitsSnapshot FROM daily_squad_challenge_costs WHERE challenge_id=? ORDER BY cost ASC,version_id ASC').bind(challengeId).all<SquadVersionCostDbRow>()).results;
 const strategies=await loadVersionStrategies(db,rows.map(row=>row.versionId));
 return rows.flatMap(row=>{
  const character=fighters.find(f=>f.id===row.characterId),version=versionById(row.versionId);
  if(!character||!version||!version.canonical||version.characterId!==character.id)return [];
  return [{
   characterId:character.id,
   characterName:character.name,
   versionId:version.id,
   versionName:version.name,
   versionShortName:version.shortName||null,
   cost:Number(row.cost),
   series:character.series,
   role:character.role,
   roles:row.rolesSnapshot!==null&&row.rolesSnapshot!==undefined?parseRoleSnapshot(row.rolesSnapshot)||[]:strategies.get(version.id)?.roles||[],
   traits:row.traitsSnapshot!==null&&row.traitsSnapshot!==undefined?parseTraitSnapshot(row.traitsSnapshot)||[]:strategies.get(version.id)?.traits||[],
   tags:character.tags,
   aliases:version.aliases,
   keyAbilities:abilitiesForVersion(version.id).filter(({ability})=>!restrictions?.disabledAbilities.includes(ability.id)&&!restrictions?.disabledAbilityCategories.includes(ability.category)).slice(0,4).map(({ability,link})=>({id:ability.id,name:ability.name,status:link.status}))
  }];
 });
}

export async function resolveSubmissionMembers(db:DatabaseClient,challenge:SquadChallengeRecord,selections:SquadMemberSelection[]){
 validateSquadIdentities(selections,challenge.minMembers,challenge.maxMembers);
 const versionIds=selections.map(x=>x.versionId);

 for(const selection of selections){
  const character=fighters.find(f=>f.id===selection.characterId),version=versionById(selection.versionId);
  if(!character||!version||!version.canonical||version.characterId!==character.id)throw Object.assign(new Error('A selected character version is invalid.'),{status:400});
 }

 const placeholders=versionIds.map(()=>'?').join(',');
 const rows=(await db.prepare(`SELECT character_id AS characterId,version_id AS versionId,cost,roles_snapshot AS rolesSnapshot,traits_snapshot AS traitsSnapshot FROM daily_squad_challenge_costs WHERE challenge_id=? AND version_id IN (${placeholders})`).bind(challenge.id,...versionIds).all<SquadVersionCostDbRow>()).results;
 const priceByVersion=new Map(rows.map(row=>[String(row.versionId),row]));
 if(priceByVersion.size!==selections.length)throw Object.assign(new Error('One or more fighters are not available in this challenge.'),{status:400});

 const strategies=await loadVersionStrategies(db,versionIds);
 const snapshots:SquadMemberSnapshot[]=selections.map((selection,position)=>{
  const price=priceByVersion.get(selection.versionId),character=fighters.find(f=>f.id===selection.characterId)!,version=versionById(selection.versionId)!;
  if(!price||price.characterId!==selection.characterId)throw Object.assign(new Error('A selected version does not belong to the submitted character.'),{status:400});
  return {position,characterId:character.id,characterName:character.name,versionId:version.id,versionName:version.name,cost:Number(price.cost),roles:price.rolesSnapshot!==null&&price.rolesSnapshot!==undefined?parseRoleSnapshot(price.rolesSnapshot)||[]:strategies.get(version.id)?.roles||[],traits:price.traitsSnapshot!==null&&price.traitsSnapshot!==undefined?parseTraitSnapshot(price.traitsSnapshot)||[]:strategies.get(version.id)?.traits||[]};
 });
 const totalCost=validateSquadBudget(snapshots,challenge.budget);
 validateRoleRequirements(snapshots,challenge.rules.roleRequirements||[]);
 if(challenge.rules.restrictions)await enforceAdvancedRestrictions(db,challenge.rules.restrictions,snapshots);
 return {snapshots,totalCost};
}

import {fighters} from '@/lib/catalog';
import {abilitiesForVersion,versionById} from '@/lib/characters';

export const SQUAD_CHALLENGE_TYPES=['defeat_target','survive','defend','capture','open_build'] as const;
export const SQUAD_CHALLENGE_STATUSES=['scheduled','active','closed'] as const;
export const SQUAD_VOTE_VERDICTS=['yes','no'] as const;

export type SquadChallengeType=typeof SQUAD_CHALLENGE_TYPES[number];
export type SquadChallengeStatus=typeof SQUAD_CHALLENGE_STATUSES[number];
export type SquadVoteVerdict=typeof SQUAD_VOTE_VERDICTS[number];

export type SquadChallengeRules={
 battleType?:string;
 location?:string;
 speed?:string;
 knowledge?:string;
 prepTime?:string;
 transformationsAllowed?:boolean;
 standardEquipment?:boolean;
 notes?:string;
};

export type SquadChallengeRecord={
 id:string;
 type:SquadChallengeType;
 title:string;
 description:string;
 targetCharacterId:string|null;
 targetVersionId:string|null;
 budget:number;
 minMembers:number;
 maxMembers:number;
 rules:SquadChallengeRules;
 startsAt:number;
 endsAt:number;
 status:SquadChallengeStatus;
 created:number;
};

export type SquadChallengeFighter={
 characterId:string;
 characterName:string;
 versionId:string;
 versionName:string;
 versionShortName:string|null;
 cost:number;
 series:string;
 role:string;
 tags:string[];
 aliases:string[];
 keyAbilities:{id:string;name:string;status:string}[];
};

export type SquadMemberSelection={characterId:string;versionId:string};
export type SquadMemberSnapshot={
 position:number;
 characterId:string;
 characterName:string;
 versionId:string;
 versionName:string;
 cost:number;
};

type DailyTemplate={
 key:string;
 type:SquadChallengeType;
 title:(targetName:string)=>string;
 description:string;
 targetCharacterId:string;
 targetVersionId:string;
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
 const score=[...day].reduce((sum,ch)=>sum+(ch>='0'&&ch<='9'?Number(ch):0),0);
 return DAILY_TEMPLATES[score%DAILY_TEMPLATES.length];
}

export function effectiveChallengeStatus(challenge:Pick<SquadChallengeRecord,'status'|'startsAt'|'endsAt'>,now=Date.now()):SquadChallengeStatus{
 if(challenge.status==='closed'||now>=challenge.endsAt)return 'closed';
 if(now<challenge.startsAt)return 'scheduled';
 return 'active';
}

export function parseRules(raw:unknown):SquadChallengeRules{
 if(typeof raw!=='string')return {};
 try{
  const parsed=JSON.parse(raw);
  return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed as SquadChallengeRules:{};
 }catch{return {}}
}

export function publicTarget(characterId:string|null,versionId:string|null){
 if(!characterId||!versionId)return null;
 const character=fighters.find(f=>f.id===characterId),version=versionById(versionId);
 if(!character||!version||version.characterId!==character.id)return null;
 return {characterId:character.id,characterName:character.name,versionId:version.id,versionName:version.name,series:character.series};
}

function rowToChallenge(row:any):SquadChallengeRecord{
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
  startsAt:Number(row.startsAt),
  endsAt:Number(row.endsAt),
  status:row.status as SquadChallengeStatus,
  created:Number(row.created)
 };
}

export async function findChallenge(db:D1Database,id:string){
 const row=await db.prepare(`SELECT id,type,title,description,target_character_id AS targetCharacterId,target_version_id AS targetVersionId,budget,min_members AS minMembers,max_members AS maxMembers,rules_json AS rulesJson,starts_at AS startsAt,ends_at AS endsAt,status,created FROM daily_squad_challenges WHERE id=? LIMIT 1`).bind(id).first<any>();
 return row?rowToChallenge(row):null;
}

export async function ensureDailyChallenge(db:D1Database,now=Date.now()){
 const day=utcDayKey(now),id=`daily-${day}`;
 const existing=await findChallenge(db,id);
 if(existing)return existing;

 const template=templateForDay(day),targetCharacter=fighters.find(f=>f.id===template.targetCharacterId),targetVersion=versionById(template.targetVersionId);
 if(!targetCharacter||!targetVersion||targetVersion.characterId!==targetCharacter.id)throw new Error('Daily squad challenge target is not present in the canonical character-version catalog.');

 const costs=(await db.prepare('SELECT version_id AS versionId,character_id AS characterId,cost FROM squad_version_costs ORDER BY cost ASC,version_id ASC').all<any>()).results
  .filter(row=>row.characterId!==template.targetCharacterId&&versionById(row.versionId)?.characterId===row.characterId&&fighters.some(f=>f.id===row.characterId));
 if(!costs.length)throw new Error('Squad version pricing has not been initialized.');

 const {startsAt,endsAt}=utcDayBounds(day),created=now;
 const statements:D1PreparedStatement[]=[
  db.prepare(`INSERT INTO daily_squad_challenges (id,type,title,description,target_character_id,target_version_id,budget,min_members,max_members,rules_json,starts_at,ends_at,status,created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
   .bind(id,template.type,template.title(targetVersion.name),template.description,template.targetCharacterId,template.targetVersionId,template.budget,template.minMembers,template.maxMembers,JSON.stringify(template.rules),startsAt,endsAt,'active',created)
 ];
 for(const row of costs){
  statements.push(db.prepare('INSERT INTO daily_squad_challenge_costs (challenge_id,character_id,version_id,cost) VALUES (?,?,?,?)').bind(id,row.characterId,row.versionId,Number(row.cost)));
 }
 await db.batch(statements);
 return (await findChallenge(db,id))!;
}

export async function challengeFighters(db:D1Database,challengeId:string):Promise<SquadChallengeFighter[]>{
 const rows=(await db.prepare('SELECT character_id AS characterId,version_id AS versionId,cost FROM daily_squad_challenge_costs WHERE challenge_id=? ORDER BY cost ASC,version_id ASC').bind(challengeId).all<any>()).results;
 return rows.flatMap(row=>{
  const character=fighters.find(f=>f.id===row.characterId),version=versionById(row.versionId);
  if(!character||!version||version.characterId!==character.id)return [];
  return [{
   characterId:character.id,
   characterName:character.name,
   versionId:version.id,
   versionName:version.name,
   versionShortName:version.shortName||null,
   cost:Number(row.cost),
   series:character.series,
   role:character.role,
   tags:character.tags,
   aliases:version.aliases,
   keyAbilities:abilitiesForVersion(version.id).slice(0,4).map(({ability,link})=>({id:ability.id,name:ability.name,status:link.status}))
  }];
 });
}

export async function resolveSubmissionMembers(db:D1Database,challenge:SquadChallengeRecord,selections:SquadMemberSelection[]){
 if(selections.length<challenge.minMembers||selections.length>challenge.maxMembers)throw Object.assign(new Error(`Choose between ${challenge.minMembers} and ${challenge.maxMembers} fighters.`),{status:400});
 const characterIds=selections.map(x=>x.characterId),versionIds=selections.map(x=>x.versionId);
 if(new Set(characterIds).size!==characterIds.length)throw Object.assign(new Error('Each character may appear only once in a challenge squad.'),{status:400});
 if(new Set(versionIds).size!==versionIds.length)throw Object.assign(new Error('Duplicate character versions are not allowed.'),{status:400});

 for(const selection of selections){
  const character=fighters.find(f=>f.id===selection.characterId),version=versionById(selection.versionId);
  if(!character||!version||!version.canonical||version.characterId!==character.id)throw Object.assign(new Error('A selected character version is invalid.'),{status:400});
 }

 const placeholders=versionIds.map(()=>'?').join(',');
 const rows=(await db.prepare(`SELECT character_id AS characterId,version_id AS versionId,cost FROM daily_squad_challenge_costs WHERE challenge_id=? AND version_id IN (${placeholders})`).bind(challenge.id,...versionIds).all<any>()).results;
 const priceByVersion=new Map(rows.map(row=>[String(row.versionId),{characterId:String(row.characterId),cost:Number(row.cost)}]));
 if(priceByVersion.size!==selections.length)throw Object.assign(new Error('One or more fighters are not available in this challenge.'),{status:400});

 const snapshots:SquadMemberSnapshot[]=selections.map((selection,position)=>{
  const price=priceByVersion.get(selection.versionId),character=fighters.find(f=>f.id===selection.characterId)!,version=versionById(selection.versionId)!;
  if(!price||price.characterId!==selection.characterId)throw Object.assign(new Error('A selected version does not belong to the submitted character.'),{status:400});
  return {position,characterId:character.id,characterName:character.name,versionId:version.id,versionName:version.name,cost:price.cost};
 });
 const totalCost=snapshots.reduce((sum,item)=>sum+item.cost,0);
 if(totalCost>challenge.budget)throw Object.assign(new Error(`Squad costs ${totalCost} points but this challenge budget is ${challenge.budget}.`),{status:400});
 return {snapshots,totalCost};
}

export function wilsonLowerBound(yes:number,total:number,z=1.96){
 if(total<=0)return 0;
 const p=yes/total,z2=z*z;
 return (p+z2/(2*total)-z*Math.sqrt((p*(1-p)+z2/(4*total))/total))/(1+z2/total);
}

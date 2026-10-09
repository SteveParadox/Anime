import type {DatabaseClient} from '@/db/raw';
import {challengeDefinitionSchema,type ChallengeDefinitionInput} from '@anime/contracts/advanced-challenge';
import {feasibleRoster} from '@/lib/advanced-challenge';

const templates=[
 {type:'defeat_target' as const,title:'Counter the Ten-Tails',objective:{type:'defeat_target' as const,boss:{characterId:'madara',versionId:'madara-ten-tails-jinchuriki'}}},
 {type:'survive' as const,title:'Survive the Onslaught',objective:{type:'survive' as const,waves:3,durationSeconds:120}},
 {type:'defend' as const,title:'Defend Sakura',objective:{type:'defend' as const,protectedTarget:{characterId:'sakura',versionId:'sakura-byakugo'},attackerVersions:['madara-edo-tensei'],condition:'Keep the protected fighter safe through the assault.'}},
 {type:'rescue' as const,title:'Rescue Rukia',objective:{type:'rescue' as const,rescueTarget:{characterId:'rukia',versionId:'rukia-bankai'},defenderVersions:['madara-edo-tensei'],extractionZone:'North gate',timeLimitSeconds:180}},
 {type:'capture' as const,title:'Capture the Spirit Gate',objective:{type:'capture' as const,location:'Spirit Gate',contestingVersions:['madara-edo-tensei'],holdSeconds:90}}
];
const bosses=[
 {characterId:'madara',versionId:'madara-ten-tails-jinchuriki',label:'Ten-Tails Madara'},
 {characterId:'goku',versionId:'goku-mastered-ultra-instinct',label:'Ultra Instinct Goku'},
 {characterId:'luffy',versionId:'luffy-gear-5',label:'Gear Five Luffy'}
];
export async function generateFeasibleChallenge(db:DatabaseClient,seed:number){
 let state=(seed>>>0)||1;
 const next=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state;};
 const recent=(await db.prepare('SELECT type FROM challenge_definitions ORDER BY created_at DESC LIMIT 5').all<{type:string}>()).results.map(x=>x.type);
 const recentBosses=new Set((await db.prepare('SELECT target_version_id AS versionId FROM challenge_definitions WHERE type=? ORDER BY created_at DESC LIMIT 5').bind('defeat_target').all<{versionId:string}>()).results.map(x=>x.versionId));
 const counts=new Map(templates.map(t=>[t.type,recent.filter(type=>type===t.type).length]));
 for(let attempt=0;attempt<25;attempt++){
  const available=templates.filter(t=>(counts.get(t.type)||0)<=Math.floor(attempt/5));
  if(!available.length)continue;
  const template=available[next()%available.length];
  const budget=[60,80,100,120][next()%4],teamSize=[2,3,4,5][next()%4],role=['controller','tank','speedster','support'][next()%4];
  const candidates=bosses.filter(boss=>!recentBosses.has(boss.versionId)),boss=(candidates.length?candidates:bosses)[next()%(candidates.length||bosses.length)];
  const objective=template.type==='defeat_target'?{type:'defeat_target' as const,boss:{characterId:boss.characterId,versionId:boss.versionId}}:template.objective;
  const bannedFranchises=attempt<15&&next()%4===0?['dragon-ball']:[];
  const alignment=attempt<10&&next()%5===0?'hero':'any';
  const bannedAbilityCategories=attempt<10&&next()%5===0?['summoning']:[];
  const franchise=attempt<10&&next()%6===0?'same':'any';
  const input:ChallengeDefinitionInput=challengeDefinitionSchema.parse({
   title:template.type==='defeat_target'?`Counter ${boss.label}`:template.title,description:`Build a legal ${teamSize}-fighter team for this ${template.type.replaceAll('_',' ')} objective. Explain your tactical choices.`,difficulty:teamSize<=2?'hard':teamSize>=4?'easy':'medium',objective,budget,minMembers:teamSize,maxMembers:teamSize,
   restrictions:{roleRequirements:[{role,min:1,max:teamSize,primaryOnly:false}],bannedCharacters:[],bannedVersions:[],bannedFranchises,bannedRoles:[],bannedAbilities:[],bannedAbilityCategories,disabledAbilities:[],disabledAbilityCategories:[],alignment,franchise,transformationsAllowed:true,battlefield:'neutral arena'}
  });
  const feasibility=await feasibleRoster(db,input);
  if(feasibility.feasible)return {definition:input,feasibility,attempts:attempt+1,seed};
 }
 throw Object.assign(new Error('No feasible generated challenge within twenty-five attempts; curate the roster or relax restrictions.'),{status:409});
}

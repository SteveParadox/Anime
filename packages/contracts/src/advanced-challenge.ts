import {z} from 'zod';
import {COMBAT_ROLES} from '@anime/domain/squad-synergy';

const id=z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,179}$/);
const ids=z.array(id).max(40).refine(items=>new Set(items).size===items.length,'Duplicate IDs are not allowed');
const nonemptyIds=z.array(id).min(1).max(40).refine(items=>new Set(items).size===items.length,'Duplicate IDs are not allowed');
const target=z.object({characterId:id,versionId:id}).strict();
export const objectiveSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('defeat_target'),boss:target}).strict(),
 z.object({type:z.literal('survive'),waves:z.number().int().min(1).max(20),durationSeconds:z.number().int().min(10).max(3600)}).strict(),
 z.object({type:z.literal('defend'),protectedTarget:target,attackerVersions:nonemptyIds,condition:z.string().trim().min(5).max(300)}).strict(),
 z.object({type:z.literal('rescue'),rescueTarget:target,defenderVersions:nonemptyIds,extractionZone:z.string().trim().min(3).max(120),timeLimitSeconds:z.number().int().min(10).max(3600).optional()}).strict(),
 z.object({type:z.literal('capture'),location:z.string().trim().min(3).max(120),contestingVersions:nonemptyIds,holdSeconds:z.number().int().min(10).max(3600)}).strict(),
 z.object({type:z.literal('open_build')}).strict()
]);
export const roleRuleSchema=z.object({role:z.enum(COMBAT_ROLES),min:z.number().int().min(0).max(5).optional(),max:z.number().int().min(0).max(5).optional(),primaryOnly:z.boolean().default(false)}).strict().refine(v=>(v.min!==undefined||v.max!==undefined)&&(v.min??0)<=(v.max??5),'Conflicting role bounds');
export const restrictionSchema=z.object({
 roleRequirements:z.array(roleRuleSchema).max(15).default([]),
 bannedCharacters:ids.default([]),bannedVersions:ids.default([]),bannedFranchises:ids.default([]),
 bannedRoles:z.array(z.enum(COMBAT_ROLES)).max(11).default([]),
 bannedAbilities:ids.default([]),bannedAbilityCategories:ids.default([]),
 disabledAbilities:ids.default([]),disabledAbilityCategories:ids.default([]),
 alignment:z.enum(['any','hero','villain','antihero','antagonist','neutral']).default('any'),
 franchise:z.union([id,z.literal('same'),z.literal('any')]).default('any'),
 transformationsAllowed:z.boolean().default(true),
 battlefield:z.string().trim().max(200).default('')
}).strict().superRefine((r,ctx)=>{
 for(const rule of r.roleRequirements)if(r.bannedRoles.includes(rule.role)&&(rule.min??0)>0)ctx.addIssue({code:'custom',message:`Required ${rule.role} is banned.`});
 for(const ability of r.bannedAbilities)if(r.disabledAbilities.includes(ability))ctx.addIssue({code:'custom',message:`Ability ${ability} is both banned and disabled.`});
});
export const challengeDefinitionSchema=z.object({
 title:z.string().trim().min(5).max(100),description:z.string().trim().min(10).max(1000),
 difficulty:z.enum(['easy','medium','hard']),objective:objectiveSchema,
 budget:z.number().int().min(1).max(1000),minMembers:z.number().int().min(1).max(5),maxMembers:z.number().int().min(1).max(5),
 restrictions:restrictionSchema,
 startsAt:z.number().int().positive().optional(),endsAt:z.number().int().positive().optional()
}).strict().superRefine((v,ctx)=>{
 if(v.minMembers>v.maxMembers)ctx.addIssue({code:'custom',message:'Minimum team size exceeds maximum.'});
 if((v.startsAt===undefined)!==(v.endsAt===undefined)||v.startsAt!==undefined&&v.endsAt!==undefined&&v.endsAt<=v.startsAt)ctx.addIssue({code:'custom',message:'Invalid publication window.'});
 if(v.objective.type==='defeat_target'&&v.restrictions.bannedCharacters.includes(v.objective.boss.characterId))ctx.addIssue({code:'custom',message:'The boss cannot be banned as a player restriction.'});
});
export type ChallengeDefinitionInput=z.infer<typeof challengeDefinitionSchema>;
export type ChallengeObjective=z.infer<typeof objectiveSchema>;
export type ChallengeRestrictions=z.infer<typeof restrictionSchema>;

export const CHALLENGE_SCORE_VERSION=1;
export type TacticalMember={versionId:string;characterId:string;cost:number;roles:{role:string;priority:string}[];traits:string[]};
const objectiveWeights:Record<ChallengeObjective['type'],{roles:Record<string,number>;traits:Record<string,number>}>= {
 defeat_target:{roles:{dps:10,controller:7,strategist:5,defense:4},traits:{single_target:8,sealing:7,adaptation:5}},
 survive:{roles:{tank:10,healer:10,defense:9,controller:6},traits:{healing:8,barrier:8,adaptation:6,area_damage:3}},
 defend:{roles:{defense:11,tank:10,support:8,controller:8,healer:6},traits:{barrier:10,crowd_control:7,healing:5}},
 rescue:{roles:{speedster:11,strategist:9,support:7,controller:6},traits:{mobility:9,teleportation:9,information:8,stealth:8}},
 capture:{roles:{controller:10,tank:9,summoner:8,defense:7},traits:{crowd_control:10,area_damage:7,summoning:7,barrier:5}},
 open_build:{roles:{strategist:6,support:6,defense:6,controller:6},traits:{adaptation:6,information:6}}
};
export function evaluateObjective(objective:ChallengeObjective,members:TacticalMember[],budget:number){
 const weights=objectiveWeights[objective.type];
 const breakdown:{criterion:string;points:number;maxPoints:number}[]=[];
 const rolePoints=Math.min(40,Object.entries(weights.roles).reduce((sum,[role,points])=>sum+(members.some(m=>m.roles.some(r=>r.role===role))?points:0),0));
 const traitPoints=Math.min(40,Object.entries(weights.traits).reduce((sum,[trait,points])=>sum+(members.some(m=>m.traits.includes(trait))?points:0),0));
 breakdown.push({criterion:'Objective role coverage',points:rolePoints,maxPoints:40},{criterion:'Objective tactical traits',points:traitPoints,maxPoints:40});
 const diversity=Math.min(10,new Set(members.flatMap(m=>m.roles.map(r=>r.role))).size*2);
 breakdown.push({criterion:'Role diversity',points:diversity,maxPoints:10});
 const spent=members.reduce((sum,m)=>sum+m.cost,0),efficiency=Math.max(0,Math.min(10,Math.floor((budget-spent)/Math.max(1,budget)*10)));
 breakdown.push({criterion:'Budget headroom',points:efficiency,maxPoints:10});
 if(objective.type==='survive'&&objective.durationSeconds>=300&&!members.some(m=>m.roles.some(r=>r.role==='healer'))){
  const penalty=Math.min(10,Math.floor(objective.durationSeconds/300)*2);
  breakdown.push({criterion:'Extended survival without healing',points:-penalty,maxPoints:0});
 }
 if(objective.type==='capture'&&objective.holdSeconds>=300&&!members.some(m=>m.roles.some(r=>r.role==='tank'||r.role==='defense'))){
  breakdown.push({criterion:'Extended control without defensive occupation',points:-8,maxPoints:0});
 }
 if(objective.type==='rescue'&&objective.timeLimitSeconds!==undefined&&objective.timeLimitSeconds<=60&&!members.some(m=>m.roles.some(r=>r.role==='speedster'))){
  breakdown.push({criterion:'Urgent extraction without mobility coverage',points:-8,maxPoints:0});
 }
 return {score:Math.max(0,Math.min(100,breakdown.reduce((sum,b)=>sum+b.points,0))),breakdown,scoringVersion:CHALLENGE_SCORE_VERSION,method:'estimated strategic suitability' as const};
}

export function validateRoleRules(members:TacticalMember[],rules:ChallengeRestrictions['roleRequirements']){
 for(const rule of rules){
  const count=members.filter(m=>m.roles.some(r=>r.role===rule.role&&(!rule.primaryOnly||r.priority==='primary'))).length;
  if(count<(rule.min??0)||count>(rule.max??5))throw new Error(`Role requirement for ${rule.role} is not met.`);
 }
}

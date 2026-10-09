export const COMBAT_ROLES = ['dps','tank','support','healer','controller','strategist','assassin','speedster','summoner','reality_manipulator','defense'] as const;
export type CombatRole = typeof COMBAT_ROLES[number];
export type RolePriority = 'primary'|'secondary';
export type VersionRole = {role:CombatRole;priority:RolePriority;notes?:string};
export const ROLE_DEFINITIONS:Record<CombatRole,{label:string;description:string}>={
 dps:{label:'DPS',description:'Primary offensive damage output.'},
 tank:{label:'Tank',description:'Absorbs, survives, or redirects sustained punishment.'},
 support:{label:'Support',description:'Improves teammates through utility, information, buffs, or protection.'},
 healer:{label:'Healer',description:'Restores health, damage, energy, or combat effectiveness.'},
 controller:{label:'Controller',description:'Restricts enemy movement, abilities, perception, or battlefield options.'},
 strategist:{label:'Strategist',description:'Improves team effectiveness through planning, adaptation, or leadership.'},
 assassin:{label:'Assassin',description:'Targets priority enemies through precision, rapid elimination, or ambush.'},
 speedster:{label:'Speedster',description:'Offers mobility, reaction advantage, pursuit, rescue, or rapid engagement.'},
 summoner:{label:'Summoner',description:'Creates or calls clones, creatures, constructs, or other combat units.'},
 reality_manipulator:{label:'Reality Manipulator',description:'Changes fundamental rules, causality, space, or reality conditions.'},
 defense:{label:'Defense',description:'Protects through barriers, avoidance, negation, or defensive techniques.'}
};
export const STRATEGIC_TRAITS = ['healing','barrier','crowd_control','mobility','teleportation','information','buff','debuff','sealing','summoning','illusion','stealth','long_range','close_range','area_damage','single_target','adaptation','prediction','anti_regeneration'] as const;
export type StrategicTrait = typeof STRATEGIC_TRAITS[number];
export type VersionStrategy = {roles:VersionRole[];traits:StrategicTrait[]};
export const EMPTY_STRATEGY:VersionStrategy={roles:[],traits:[]};
export type StrategicMember = VersionStrategy&{versionId:string;characterName?:string};
export type RoleRequirement = {type:'role';role:CombatRole;min?:number;max?:number}|{type:'any_of';roles:CombatRole[];min:number};
export function isCombatRole(value:unknown):value is CombatRole{return typeof value==='string'&&(COMBAT_ROLES as readonly string[]).includes(value);}
export function isStrategicTrait(value:unknown):value is StrategicTrait{return typeof value==='string'&&(STRATEGIC_TRAITS as readonly string[]).includes(value);}
export function parseRoleRequirements(value:unknown):RoleRequirement[]{
 if(value==null)return [];
 if(!Array.isArray(value)||value.length>20)throw new Error('Invalid challenge role requirements.');
 return value.map((item):RoleRequirement=>{
  if(!item||typeof item!=='object'||Array.isArray(item))throw new Error('Invalid challenge role requirement.');
  const v=item as Record<string,unknown>;
  if(v.type==='role'&&isCombatRole(v.role)&&Object.keys(v).every(k=>['type','role','min','max'].includes(k))){
   const min=v.min===undefined?undefined:v.min,max=v.max===undefined?undefined:v.max;
   if((min===undefined&&max===undefined)|| (min!==undefined&&(!Number.isInteger(min)||Number(min)<0||Number(min)>10))||(max!==undefined&&(!Number.isInteger(max)||Number(max)<0||Number(max)>10))||(min!==undefined&&max!==undefined&&Number(min)>Number(max)))throw new Error('Invalid challenge role requirement.');
   return {type:'role',role:v.role,min:min as number|undefined,max:max as number|undefined};
  }
  if(v.type==='any_of'&&Array.isArray(v.roles)&&v.roles.length>0&&v.roles.length<=COMBAT_ROLES.length&&v.roles.every(isCombatRole)&&new Set(v.roles).size===v.roles.length&&Number.isInteger(v.min)&&Number(v.min)>=1&&Number(v.min)<=10&&Object.keys(v).every(k=>['type','roles','min'].includes(k)))return {type:'any_of',roles:v.roles,min:Number(v.min)};
  throw new Error('Invalid challenge role requirement.');
 });
}
export function roleRequirementProgress(members:StrategicMember[],requirements:RoleRequirement[]){
 return requirements.map(requirement=>{
  const count=members.filter(member=>member.roles.some(({role})=>requirement.type==='role'?role===requirement.role:requirement.roles.includes(role))).length;
  const label=requirement.type==='role'?ROLE_DEFINITIONS[requirement.role].label:requirement.roles.map(r=>ROLE_DEFINITIONS[r].label).join(' OR ');
  const min=requirement.min??0,max=requirement.type==='role'?requirement.max:undefined;
  const valid=count>=min&&(max===undefined||count<=max);
  const description=requirement.type==='any_of'?`At least ${min} ${label}`:min&&max!==undefined?`${min}–${max} ${label}`:min?`At least ${min} ${label}`:`At most ${max} ${label}`;
  return {description,count,valid};
 });
}
export function validateRoleRequirements(members:StrategicMember[],requirements:RoleRequirement[]){
 const failed=roleRequirementProgress(members,requirements).find(r=>!r.valid);
 if(failed)throw Object.assign(new Error(`This challenge requires: ${failed.description} (currently ${failed.count}).`),{status:400});
}
export const ROLE_SYNERGY_RULES=[
 {id:'control-dps',roles:['controller','dps'],label:'Control + Offense',description:'Control may create opportunities for offensive teammates.'},
 {id:'tank-healer',roles:['tank','healer'],label:'Frontline Sustain',description:'A dedicated healer may help a frontline fighter maintain pressure.'},
 {id:'strategist-assassin',roles:['strategist','assassin'],label:'Planned Elimination',description:'Tactical planning may improve precision engagements.'},
 {id:'support-speedster',roles:['support','speedster'],label:'Mobile Support',description:'Mobility and utility may support quick repositioning or rescue.'},
 {id:'defense-support',roles:['defense','support'],label:'Protected Utility',description:'Defensive abilities may help a utility fighter contribute safely.'},
 {id:'controller-summoner',roles:['controller','summoner'],label:'Zone Pressure',description:'Summoned units and control can threaten multiple battlefield positions.'}
] as const satisfies readonly {id:string;roles:readonly CombatRole[];label:string;description:string}[];
export const COVERAGE_GROUPS={
 Offense:['dps','assassin'],
 Defense:['tank','defense'],
 Control:['controller'],
 Mobility:['speedster'],
 Support:['support'],
 Healing:['healer'],
 Strategy:['strategist'],
 Summoning:['summoner']
} as const satisfies Record<string,readonly CombatRole[]>;
export function analyzeSquadComposition(members:StrategicMember[]){
 const known=members.filter(m=>m.roles.length||m.traits.length);
 const counts=Object.fromEntries(COMBAT_ROLES.map(role=>[role,members.filter(m=>m.roles.some(r=>r.role===role)).length])) as Record<CombatRole,number>;
 const traitCounts=Object.fromEntries(STRATEGIC_TRAITS.map(trait=>[trait,members.filter(m=>m.traits.includes(trait)).length])) as Record<StrategicTrait,number>;
 const roleCounts=COMBAT_ROLES.filter(r=>counts[r]>0).map(role=>({role,count:counts[role]}));
 const coverage=Object.entries(COVERAGE_GROUPS).map(([label,roles])=>{
  const n=members.filter(m=>m.roles.some(({role})=>(roles as readonly string[]).includes(role))).length;
  return {label,count:n,level:n>=2?'Strong':n===1?'Present':'Not covered'};
 });
 const pairs=ROLE_SYNERGY_RULES.flatMap(rule=>{
  const [a,b]=rule.roles;
  const left=members.findIndex(m=>m.roles.some(r=>r.role===a));
  const right=members.findIndex((m,i)=>i!==left&&m.roles.some(r=>r.role===b));
  if(left<0||right<0)return [];
  return [{id:rule.id,label:rule.label,description:rule.description,fighters:[members[left].characterName||members[left].versionId,members[right].characterName||members[right].versionId]}];
 });
 const traitInteractions=analyzeTraitInteractions(members);
 const strengths=[
  ...(counts.controller>=2?['Multiple battlefield controllers']:[]),
  ...(counts.healer>0?['Dedicated healing']:[]),
  ...(counts.tank>0?['Frontline durability']:[]),
  ...(counts.speedster>0?['Rapid engagement options']:[]),
  ...(counts.strategist>0?['Tactical leadership']:[]),
  ...(traitCounts.barrier>0?['Barrier protection']:[]),
  ...(traitCounts.information>0?['Information gathering']:[])
 ];
 const gaps=known.length?[
  ...(counts.healer===0?['No dedicated healer']:[]),
  ...(coverage.find(c=>c.label==='Defense')?.count===0?['Limited defensive coverage']:[]),
  ...(counts.support===0?['No dedicated support']:[]),
  ...(traitCounts.long_range===0?['No documented long-range trait']:[])
 ]:[];
 return {roleCounts,roleDiversity:roleCounts.length,concentrations:roleCounts.filter(x=>x.count>=2),traitCounts,coverage,synergies:pairs,traitInteractions,strengths,gaps,unclassified:members.length-known.length};
}

/** Curated tactical hypotheses. These are not canon claims or win predictions. */
export const TRAIT_INTERACTION_RULES=[
 {id:'healing-frontline',left:'healing',right:'close_range',kind:'synergy',label:'Frontline Sustain',description:'Healing may help a close-range ally sustain pressure.'},
 {id:'barrier-ranged',left:'barrier',right:'long_range',kind:'synergy',label:'Protected Ranged Pressure',description:'A barrier may protect an allied ranged attacker.'},
 {id:'information-stealth',left:'information',right:'stealth',kind:'synergy',label:'Informed Ambush',description:'Reconnaissance may improve an ally’s stealth engagement.'},
 {id:'control-area',left:'crowd_control',right:'area_damage',kind:'synergy',label:'Control and Area Damage',description:'Restraining opponents may create openings for allied area attacks.'}
] as const satisfies readonly {id:string;left:StrategicTrait;right:StrategicTrait;kind:'synergy'|'conflict';label:string;description:string}[];

/** Each rule can fire at most once; both traits must belong to different members. */
export function analyzeTraitInteractions(members:StrategicMember[]){
 return TRAIT_INTERACTION_RULES.flatMap(rule=>{
  for(let i=0;i<members.length;i++){
   if(!members[i].traits.includes(rule.left))continue;
   for(let j=0;j<members.length;j++){
    if(i===j||!members[j].traits.includes(rule.right))continue;
    return [{id:rule.id,kind:rule.kind,label:rule.label,description:rule.description,
     memberVersionIds:[members[i].versionId,members[j].versionId],traits:[rule.left,rule.right]}];
   }
  }
  return [];
 });
}

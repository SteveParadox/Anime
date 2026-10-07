import type {StructuredArgumentEvidence} from './evidence';
export const BATTLE_TYPES=['death_battle','knockout','first_blood','capture','survival'] as const;
export const BATTLE_LOCATIONS=['neutral_arena','earth','soul_society','custom'] as const;
export const SPEED_RULES=['normal','equalized'] as const;
export const KNOWLEDGE_RULES=['none','basic','full'] as const;
export const PREP_TIMES=['none','1_hour','1_day'] as const;
export const VOTE_DIFFICULTIES=['no','low','mid','high','extreme','inconclusive'] as const;

export type BattleType=typeof BATTLE_TYPES[number];
export type BattleLocation=typeof BATTLE_LOCATIONS[number];
export type SpeedRule=typeof SPEED_RULES[number];
export type KnowledgeRule=typeof KNOWLEDGE_RULES[number];
export type PrepTime=typeof PREP_TIMES[number];
export type VoteDifficulty=typeof VOTE_DIFFICULTIES[number];
export type VoteSide='a'|'b'|'draw';

export type BattleCreateInput={
 fighterAId:string;
 fighterBId:string;
 versionA:string;
 versionB:string;
 battleType:BattleType;
 location:BattleLocation;
 customLocation?:string;
 speed:SpeedRule;
 knowledge:KnowledgeRule;
 prepTime:PrepTime;
 transformationsAllowed:boolean;
 standardEquipment:boolean;
 notes?:string;
};

export type Battle=BattleCreateInput&{
 id:string;
 a:string;
 b:string;
 created:number;
 isLegacy?:boolean;
 legacyVictory?:string;
 legacyTransformations?:string;
};

export type ArgumentEvidence={
 id:string;
 handle:string;
 reference:string;
 context:string;
 created:number;
};

export type BattleArgument={
 argumentId:number;
 side:VoteSide;
 difficulty:VoteDifficulty|null;
 reason:string;
 evidence:string;
 created:number;
 handle:string;
 displayName:string;
 owned:boolean;
 upvotes:number;
 disputes:number;
 myReaction:'upvote'|'dispute'|null;
 comments:{id:string;body:string;created:number;handle:string}[];
 addedEvidence:ArgumentEvidence[];
 structuredEvidence:StructuredArgumentEvidence[];
};

export type BattleResult={
 battle:string;
 a:number;
 b:number;
 draw:number;
 total:number;
 difficulty:{
  a:Partial<Record<VoteDifficulty,number>>;
  b:Partial<Record<VoteDifficulty,number>>;
 };
};

export const BATTLE_TYPE_LABELS:Record<BattleType,string>={
 death_battle:'Death Battle',knockout:'Knockout',first_blood:'First Blood',capture:'Capture',survival:'Survival'
};
export const LOCATION_LABELS:Record<BattleLocation,string>={
 neutral_arena:'Neutral Arena',earth:'Earth',soul_society:'Soul Society',custom:'Custom'
};
export const SPEED_LABELS:Record<SpeedRule,string>={normal:'Normal',equalized:'Equalized'};
export const KNOWLEDGE_LABELS:Record<KnowledgeRule,string>={none:'No Prior Knowledge',basic:'Basic Knowledge',full:'Full Knowledge'};
export const PREP_LABELS:Record<PrepTime,string>={none:'None','1_hour':'1 Hour','1_day':'1 Day'};
export const DIFFICULTY_LABELS:Record<VoteDifficulty,string>={
 no:'No Difficulty',low:'Low Difficulty',mid:'Mid Difficulty',high:'High Difficulty',extreme:'Extreme Difficulty',inconclusive:'Draw / Inconclusive'
};

function oneOf<T extends readonly string[]>(values:T,value:unknown):value is T[number]{
 return typeof value==='string'&&(values as readonly string[]).includes(value);
}
function text(value:unknown){return typeof value==='string'?value:''}

export function normalizeBattle(value:unknown):Battle{
 const raw=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const isLegacy=!oneOf(BATTLE_TYPES,raw.battleType);
 const oldSpeed=text(raw.speed);
 const legacyVictory=text(raw.victory);
 const legacyTransformations=text(raw.transformations);
 const mappedType:BattleType='knockout';
 return {
  id:text(raw.id),
  fighterAId:text(raw.fighterAId),
  fighterBId:text(raw.fighterBId),
  a:text(raw.a),
  b:text(raw.b),
  versionA:text(raw.versionA),
  versionB:text(raw.versionB),
  battleType:oneOf(BATTLE_TYPES,raw.battleType)?raw.battleType:mappedType,
  location:oneOf(BATTLE_LOCATIONS,raw.location)?raw.location:'neutral_arena',
  customLocation:text(raw.customLocation)||undefined,
  speed:oneOf(SPEED_RULES,raw.speed)?raw.speed:oldSpeed==='Equalized'?'equalized':'normal',
  knowledge:oneOf(KNOWLEDGE_RULES,raw.knowledge)?raw.knowledge:'none',
  prepTime:oneOf(PREP_TIMES,raw.prepTime)?raw.prepTime:'none',
  transformationsAllowed:typeof raw.transformationsAllowed==='boolean'?raw.transformationsAllowed:false,
  standardEquipment:typeof raw.standardEquipment==='boolean'?raw.standardEquipment:false,
  notes:text(raw.notes),
  created:typeof raw.created==='number'?raw.created:Number(raw.created)||0,
  isLegacy,
  legacyVictory:isLegacy&&legacyVictory?legacyVictory:undefined,
  legacyTransformations:isLegacy&&legacyTransformations?legacyTransformations:undefined
 };
}

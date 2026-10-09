export const EVIDENCE_SOURCE_TYPES=['anime','manga','databook','official_guidebook','creator_interview','official_website','light_novel','game'] as const;
export const FEAT_CATEGORIES=['speed','strength','durability','ability','statement'] as const;

export const EVIDENCE_TIMESTAMP_PATTERN=/^(?:[0-5]?\d):[0-5]\d$|^(?:\d{1,2}):[0-5]\d:[0-5]\d$/;

export function isValidEvidenceTimestamp(value:string){
 return EVIDENCE_TIMESTAMP_PATTERN.test(value);
}

export function normalizeEvidenceTimestamp(value:string|null|undefined){
 if(!value)return null;
 if(!isValidEvidenceTimestamp(value))return value;
 return value.split(':').map(part=>String(Number(part)).padStart(2,'0')).join(':');
}

export type EvidenceSourceType=typeof EVIDENCE_SOURCE_TYPES[number];
export type FeatCategory=typeof FEAT_CATEGORIES[number];

export const EVIDENCE_SOURCE_LABELS:Record<EvidenceSourceType,string>={
 anime:'Anime',
 manga:'Manga',
 databook:'Databook',
 official_guidebook:'Official guidebook',
 creator_interview:'Creator interview',
 official_website:'Official website statement',
 light_novel:'Light novel',
 game:'Game'
};

export const FEAT_CATEGORY_LABELS:Record<FeatCategory,string>={
 speed:'Speed',
 strength:'Strength',
 durability:'Durability',
 ability:'Abilities',
 statement:'Statements'
};

export const EVIDENCE_CONTINUITIES=['main','anime','alternate','spin_off','game','unknown'] as const;
export type EvidenceContinuity=typeof EVIDENCE_CONTINUITIES[number];
export type EvidenceSourceField={key:string;label:string;required:boolean};
/** Public submission metadata: field definitions are mirrored by strict API-side schemas. */
export const EVIDENCE_SOURCE_FIELDS:Record<EvidenceSourceType,readonly EvidenceSourceField[]>={
 anime:[],
 manga:[],
 databook:[
  {key:'publisher',label:'Publisher',required:true},
  {key:'pageOrSection',label:'Page or section',required:true},
  {key:'edition',label:'Edition',required:false},
  {key:'volume',label:'Volume',required:false},
  {key:'publicationDate',label:'Publication date (YYYY-MM-DD)',required:false},
  {key:'translationStatus',label:'Translation status',required:false}
 ],
 official_guidebook:[
  {key:'publisher',label:'Publisher',required:true},
  {key:'pageOrSection',label:'Page or section',required:true},
  {key:'edition',label:'Edition',required:false},
  {key:'publicationDate',label:'Publication date (YYYY-MM-DD)',required:false}
 ],
 creator_interview:[
  {key:'subject',label:'Interview subject',required:true},
  {key:'publication',label:'Publication',required:true},
  {key:'statementKind',label:'Statement kind (clarification/opinion/production/hypothetical/ambiguous)',required:true},
  {key:'interviewer',label:'Interviewer',required:false},
  {key:'interviewDate',label:'Interview date (YYYY-MM-DD)',required:false},
  {key:'questionContext',label:'Question or context',required:false}
 ],
 official_website:[
  {key:'organization',label:'Organization or publisher',required:true},
  {key:'officialDomain',label:'Official domain',required:true},
  {key:'accessDate',label:'Access date (YYYY-MM-DD)',required:true},
  {key:'articleTitle',label:'Article title',required:false},
  {key:'publicationDate',label:'Publication date (YYYY-MM-DD)',required:false},
  {key:'archiveUrl',label:'Archive URL',required:false}
 ],
 light_novel:[
  {key:'author',label:'Author',required:true},
  {key:'chapter',label:'Chapter identifier',required:true},
  {key:'continuityRelation',label:'Continuity (main/spin_off/alternate/adaptation/uncertain)',required:true},
  {key:'volume',label:'Volume',required:false},
  {key:'edition',label:'Edition',required:false},
  {key:'pageOrLocation',label:'Page or location',required:false}
 ],
 game:[
  {key:'developer',label:'Developer',required:true},
  {key:'publisher',label:'Publisher',required:true},
  {key:'platform',label:'Platform or edition',required:true},
  {key:'sceneOrMission',label:'Scene or mission',required:true},
  {key:'continuityClassification',label:'Continuity (adaptation/alternate/crossover/gameplay/promotional)',required:true},
  {key:'releaseVersion',label:'Release or version',required:false},
  {key:'storyModeOrEvent',label:'Story mode or event',required:false}
 ]
};
export const EVIDENCE_STATEMENT_KINDS=['clarification','opinion','production','hypothetical','ambiguous'] as const;
export const EVIDENCE_NOVEL_CONTINUITIES=['main','spin_off','alternate','adaptation','uncertain'] as const;
export const EVIDENCE_GAME_CONTINUITIES=['adaptation','alternate','crossover','gameplay','promotional'] as const;

export type EvidenceCounts=Record<FeatCategory,number>;

export const EMPTY_EVIDENCE_COUNTS:EvidenceCounts={
 speed:0,
 strength:0,
 durability:0,
 ability:0,
 statement:0
};

export type EvidenceRecord={
 id:string;
 characterId:string;
 characterName:string;
 sourceType:EvidenceSourceType;
 series:string;
 versionId:string|null;
 versionName:string|null;
 abilityId:string|null;
 abilityName:string|null;
 category:FeatCategory;
 title:string;
 description:string;
 episode:number|null;
 timestamp:string|null;
 chapter:number|null;
 page:number|null;
 sourceTitle?:string|null;
 sourceLocation?:string|null;
 sourceUrl?:string|null;
 sourceDetails?:Record<string,string>;
 continuityStatus?:EvidenceContinuity;
 sourceLanguage?:string|null;
 translationProvenance?:string|null;
 submittedByHandle:string;
 created:number;
 updated:number;
 owned?:boolean;
};

export type StructuredArgumentEvidence={
 kind:'structured';
 id:string;
 evidenceId:string;
 linkedByHandle:string;
 linkCreated:number;
 linkOwned:boolean;
 canUnlink:boolean;
 deleted:boolean;
 record:EvidenceRecord|null;
};

export type LegacyArgumentEvidence={
 kind:'legacy';
 id:string;
 handle:string;
 reference:string;
 context:string;
 created:number;
};

export type ArgumentEvidenceView=StructuredArgumentEvidence|LegacyArgumentEvidence;

export function formatEvidenceLocation(record:Pick<EvidenceRecord,'sourceType'|'episode'|'timestamp'|'chapter'|'page'>){
 if(record.sourceType==='anime'){
  const parts=[record.episode?`Episode ${record.episode}`:'Episode'];
  if(record.timestamp)parts.push(record.timestamp);
  return parts.join(' · ');
 }
 if(record.sourceType!=='manga')return [record.sourceTitle||EVIDENCE_SOURCE_LABELS[record.sourceType],record.sourceLocation].filter(Boolean).join(' · ');
 const parts=[record.chapter?`Chapter ${record.chapter}`:'Chapter'];
 if(record.page)parts.push(`Page ${record.page}`);
 return parts.join(' · ');
}

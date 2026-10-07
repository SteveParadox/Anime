export const EVIDENCE_SOURCE_TYPES=['anime','manga'] as const;
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
 manga:'Manga'
};

export const FEAT_CATEGORY_LABELS:Record<FeatCategory,string>={
 speed:'Speed',
 strength:'Strength',
 durability:'Durability',
 ability:'Abilities',
 statement:'Statements'
};

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
 category:FeatCategory;
 title:string;
 description:string;
 episode:number|null;
 timestamp:string|null;
 chapter:number|null;
 page:number|null;
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
 const parts=[record.chapter?`Chapter ${record.chapter}`:'Chapter'];
 if(record.page)parts.push(`Page ${record.page}`);
 return parts.join(' · ');
}

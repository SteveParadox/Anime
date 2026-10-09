import {z} from 'zod';
import {EVIDENCE_CONTINUITIES,EVIDENCE_TIMESTAMP_PATTERN,EVIDENCE_STATEMENT_KINDS,EVIDENCE_NOVEL_CONTINUITIES,EVIDENCE_GAME_CONTINUITIES,FEAT_CATEGORIES} from '@anime/domain/evidence';

export const idText=z.string().trim().min(1).max(180);
const titleText=z.string().trim().min(3).max(120);
const descriptionText=z.string().trim().min(10).max(1000);
const commonEvidence={
 characterId:idText,
 versionId:idText,
 abilityId:idText.nullable().optional(),
 category:z.enum(FEAT_CATEGORIES),
 title:titleText,
 description:descriptionText
};
const detailText=z.string().trim().min(1).max(240);
const optionalDetail=z.string().trim().max(240).optional();
const isCalendarDate=(value:string)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T00:00:00Z');return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;};
const detailDate=z.string().trim().refine(isCalendarDate,'Use a valid YYYY-MM-DD date.').optional();
const safeUrl=z.string().trim().url().max(2000).refine(value=>{try{const u=new URL(value);return (u.protocol==='https:'||u.protocol==='http:')&&!!u.hostname&&!u.username&&!u.password;}catch{return false;}},'Only HTTP(S) URLs without credentials are allowed.');
const optionalSourceUrl=safeUrl.nullable().optional();
const extendedEvidence={...commonEvidence,sourceTitle:titleText,sourceLocation:detailText,sourceUrl:optionalSourceUrl,sourceLanguage:optionalDetail,translationProvenance:optionalDetail,continuityStatus:z.enum(EVIDENCE_CONTINUITIES).default('unknown')};
export const evidenceInput=z.discriminatedUnion('sourceType',[
 z.object({...commonEvidence,sourceType:z.literal('anime'),episode:z.number().int().positive().max(100000),timestamp:z.string().trim().regex(EVIDENCE_TIMESTAMP_PATTERN,'Use MM:SS or HH:MM:SS.').nullable().optional()}).strict(),
 z.object({...commonEvidence,sourceType:z.literal('manga'),chapter:z.number().int().positive().max(100000),page:z.number().int().positive().max(100000).nullable().optional()}).strict(),
 z.object({...extendedEvidence,sourceType:z.literal('databook'),sourceDetails:z.object({publisher:detailText,pageOrSection:detailText,edition:optionalDetail,volume:optionalDetail,publicationDate:detailDate,translationStatus:optionalDetail}).strict()}).strict(),
 z.object({...extendedEvidence,sourceType:z.literal('official_guidebook'),sourceDetails:z.object({publisher:detailText,pageOrSection:detailText,edition:optionalDetail,publicationDate:detailDate}).strict()}).strict(),
 z.object({...extendedEvidence,sourceType:z.literal('creator_interview'),sourceDetails:z.object({subject:detailText,publication:detailText,statementKind:z.enum(EVIDENCE_STATEMENT_KINDS),interviewer:optionalDetail,interviewDate:detailDate,questionContext:optionalDetail}).strict()}).strict(),
 z.object({...extendedEvidence,sourceType:z.literal('official_website'),sourceUrl:safeUrl,sourceDetails:z.object({organization:detailText,officialDomain:detailText,accessDate:z.string().trim().refine(isCalendarDate,'Use a valid YYYY-MM-DD date.'),articleTitle:optionalDetail,publicationDate:detailDate,archiveUrl:safeUrl.optional()}).strict()}).strict(),
 z.object({...extendedEvidence,sourceType:z.literal('light_novel'),sourceDetails:z.object({author:detailText,chapter:detailText,continuityRelation:z.enum(EVIDENCE_NOVEL_CONTINUITIES),volume:optionalDetail,edition:optionalDetail,pageOrLocation:optionalDetail}).strict()}).strict(),
 z.object({...extendedEvidence,sourceType:z.literal('game'),sourceDetails:z.object({developer:detailText,publisher:detailText,platform:detailText,sceneOrMission:detailText,continuityClassification:z.enum(EVIDENCE_GAME_CONTINUITIES),releaseVersion:optionalDetail,storyModeOrEvent:optionalDetail}).strict()}).strict()
]);

/** Verify a citation URL belongs to the submitted domain. This is NOT publisher-authenticity verification. */
export function matchesOfficialWebsiteDomain(sourceUrl:string,officialDomain:string):boolean{
 try{
  const url=new URL(sourceUrl);
  if(url.protocol!=='https:'&&url.protocol!=='http:')return false;
  const domain=officialDomain.trim().toLowerCase().replace(/^www\./,'');
  const host=url.hostname.toLowerCase().replace(/^www\./,'');
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)&&(host===domain||host.endsWith('.'+domain));
 }catch{return false;}
}

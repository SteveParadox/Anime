import {database} from '@/db/raw';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {fighters,starterBattles} from '@/lib/catalog';
import {EVIDENCE_SOURCE_TYPES,FEAT_CATEGORIES,EMPTY_EVIDENCE_COUNTS,EVIDENCE_TIMESTAMP_PATTERN,normalizeEvidenceTimestamp,type EvidenceSourceType,type FeatCategory} from '@/lib/evidence';
import {env} from 'cloudflare:workers';
import {z} from 'zod';

const idText=z.string().trim().min(1).max(180);
const titleText=z.string().trim().min(3).max(120);
const descriptionText=z.string().trim().min(10).max(1000);
const commonEvidence={characterId:idText,category:z.enum(FEAT_CATEGORIES),title:titleText,description:descriptionText};
const evidenceInput=z.discriminatedUnion('sourceType',[
 z.object({...commonEvidence,sourceType:z.literal('anime'),episode:z.number().int().positive().max(100000),timestamp:z.string().trim().regex(EVIDENCE_TIMESTAMP_PATTERN,'Use MM:SS or HH:MM:SS.').nullable().optional()}).strict(),
 z.object({...commonEvidence,sourceType:z.literal('manga'),chapter:z.number().int().positive().max(100000),page:z.number().int().positive().max(100000).nullable().optional()}).strict()
]);
const mutationSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('create_evidence'),evidence:evidenceInput}).strict(),
 z.object({action:z.literal('update_evidence'),evidenceId:idText,evidence:evidenceInput}).strict(),
 z.object({action:z.literal('delete_evidence'),evidenceId:idText}).strict(),
 z.object({action:z.literal('link_evidence'),battle:idText,argumentId:z.number().int().positive(),evidenceId:idText}).strict(),
 z.object({action:z.literal('unlink_evidence'),battle:idText,argumentId:z.number().int().positive(),evidenceId:idText}).strict()
]);

const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const admin=(userId?:string)=>Boolean(userId&&env.ANIME_CLASH_ADMIN_ID&&userId===env.ANIME_CLASH_ADMIN_ID);
const recordSelect=`SELECT er.id,er.character_id AS characterId,er.source_type AS sourceType,er.series,er.category,er.title,er.description,er.episode,er.timestamp,er.chapter,er.page,er.submitted_by AS submittedBy,er.created,er.updated,er.deleted,COALESCE(p.handle,'anime_fan') AS submittedByHandle FROM evidence_records er LEFT JOIN profiles p ON p.user=er.submitted_by`;

function publicRecord(row:any,userId?:string){
 const character=fighters.find(f=>f.id===row.characterId);
 return {id:row.id,characterId:row.characterId,characterName:character?.name||row.characterId,sourceType:row.sourceType as EvidenceSourceType,series:row.series,category:row.category as FeatCategory,title:row.title,description:row.description,episode:row.episode==null?null:Number(row.episode),timestamp:row.timestamp||null,chapter:row.chapter==null?null:Number(row.chapter),page:row.page==null?null:Number(row.page),submittedByHandle:row.submittedByHandle||'anime_fan',created:Number(row.created),updated:Number(row.updated),owned:Boolean(userId&&row.submittedBy===userId)};
}

async function fetchRecord(db:D1Database,id:string,userId?:string,includeDeleted=false){
 const row=await db.prepare(`${recordSelect} WHERE er.id=?${includeDeleted?'':' AND er.deleted=0'} LIMIT 1`).bind(id).first<any>();
 return row?{raw:row,view:publicRecord(row,userId)}:null;
}

async function battleById(db:D1Database,id:string){
 const starter=starterBattles.find(b=>b.id===id);
 if(starter)return starter;
 const row=await db.prepare('SELECT payload FROM battles WHERE id=?').bind(id).first<{payload:string}>();
 if(!row)return null;
 try{return JSON.parse(row.payload) as Record<string,unknown>}catch{return null}
}

function locationClause(evidence:z.infer<typeof evidenceInput>){
 if(evidence.sourceType==='anime')return {sql:`er.character_id=? AND er.source_type='anime' AND er.episode=? AND COALESCE(er.timestamp,'')=? AND er.deleted=0`,params:[evidence.characterId,evidence.episode,normalizeEvidenceTimestamp(evidence.timestamp)||'']};
 return {sql:`er.character_id=? AND er.source_type='manga' AND er.chapter=? AND COALESCE(er.page,0)=? AND er.deleted=0`,params:[evidence.characterId,evidence.chapter,evidence.page||0]};
}

async function potentialDuplicates(db:D1Database,evidence:z.infer<typeof evidenceInput>,userId?:string,excludeId?:string){
 const location=locationClause(evidence);
 const sql=`${recordSelect} WHERE ${location.sql}${excludeId?' AND er.id<>?':''} ORDER BY er.created DESC LIMIT 8`;
 const params=excludeId?[...location.params,excludeId]:location.params;
 const rows=(await db.prepare(sql).bind(...params).all<any>()).results;
 return rows.map(row=>publicRecord(row,userId));
}

function canonicalValues(evidence:z.infer<typeof evidenceInput>){
 const character=fighters.find(f=>f.id===evidence.characterId);
 if(!character)return null;
 return {character,series:character.series,episode:evidence.sourceType==='anime'?evidence.episode:null,timestamp:evidence.sourceType==='anime'?normalizeEvidenceTimestamp(evidence.timestamp):null,chapter:evidence.sourceType==='manga'?evidence.chapter:null,page:evidence.sourceType==='manga'?(evidence.page||null):null};
}

export async function GET(req:Request){try{
 const db=database(),user=await getChatGPTUser(),url=new URL(req.url);
 const character=url.searchParams.get('character')?.trim()||'';
 const charactersRaw=url.searchParams.get('characters')?.split(',').map(x=>x.trim()).filter(Boolean)||[];
 const requestedCharacters=[...new Set([...(character?[character]:[]),...charactersRaw])].slice(0,10);
 if(requestedCharacters.some(id=>!fighters.some(f=>f.id===id)))return json({error:'Unknown character.'},400);
 const category=url.searchParams.get('category')?.trim()||'';
 const sourceType=url.searchParams.get('sourceType')?.trim()||'';
 if(category&&!(FEAT_CATEGORIES as readonly string[]).includes(category))return json({error:'Unknown feat category.'},400);
 if(sourceType&&!(EVIDENCE_SOURCE_TYPES as readonly string[]).includes(sourceType))return json({error:'Unknown evidence source type.'},400);
 const q=(url.searchParams.get('q')||'').trim().slice(0,120);
 const page=Math.max(1,Math.min(10000,Number(url.searchParams.get('page'))||1));
 const limit=Math.max(1,Math.min(50,Number(url.searchParams.get('limit'))||20));
 const conditions=['er.deleted=0'],params:any[]=[];
 if(requestedCharacters.length){conditions.push(`er.character_id IN (${requestedCharacters.map(()=>'?').join(',')})`);params.push(...requestedCharacters);}
 if(category){conditions.push('er.category=?');params.push(category);}
 if(sourceType){conditions.push('er.source_type=?');params.push(sourceType);}
 if(q){const like=`%${q}%`,characterMatches=fighters.filter(f=>`${f.name} ${f.series}`.toLowerCase().includes(q.toLowerCase())).map(f=>f.id);const searchParts=['er.title LIKE ? COLLATE NOCASE','er.description LIKE ? COLLATE NOCASE','er.series LIKE ? COLLATE NOCASE','er.category LIKE ? COLLATE NOCASE'];params.push(like,like,like,like);if(characterMatches.length){searchParts.push(`er.character_id IN (${characterMatches.map(()=>'?').join(',')})`);params.push(...characterMatches)}conditions.push(`(${searchParts.join(' OR ')})`);}
 const where=`WHERE ${conditions.join(' AND ')}`;
 const [recordsResult,totalRow,countsResult]=await Promise.all([
  db.prepare(`${recordSelect} ${where} ORDER BY er.created DESC LIMIT ? OFFSET ?`).bind(...params,limit,(page-1)*limit).all<any>(),
  db.prepare(`SELECT COUNT(*) AS n FROM evidence_records er ${where}`).bind(...params).first<{n:number}>(),
  requestedCharacters.length?db.prepare(`SELECT character_id AS characterId,category,COUNT(*) AS n FROM evidence_records WHERE deleted=0 AND character_id IN (${requestedCharacters.map(()=>'?').join(',')}) GROUP BY character_id,category`).bind(...requestedCharacters).all<any>():Promise.resolve({results:[]} as any)
 ]);
 const counts:Record<string,Record<FeatCategory,number>>={};
 for(const id of requestedCharacters)counts[id]={...EMPTY_EVIDENCE_COUNTS};
 for(const row of countsResult.results||[]){if(counts[row.characterId]&&(FEAT_CATEGORIES as readonly string[]).includes(row.category))counts[row.characterId][row.category as FeatCategory]=Number(row.n||0);}
 return json({records:recordsResult.results.map(row=>publicRecord(row,user?.userId)),counts,total:Number(totalRow?.n||0),page,limit});
 }catch(e){console.error('Evidence load failed',e);return json({error:'Could not load evidence. Please try again.'},503);}}

export async function POST(req:Request){try{
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json({error:'Invalid origin'},403);
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in to manage evidence.'},401);
 const raw=await req.text();if(raw.length>15000)return json({error:'Submission is too large'},413);
 let parsed;try{parsed=mutationSchema.safeParse(JSON.parse(raw));}catch{return json({error:'Invalid submission'},400);}
 if(!parsed.success)return json({error:parsed.error.issues[0]?.message||'Check the evidence fields.'},400);
 const d=parsed.data,db=database(),now=Date.now();
 if(d.action==='create_evidence'||d.action==='update_evidence'){
  const evidence=d.evidence,canonical=canonicalValues(evidence);if(!canonical)return json({error:'Choose a character from the catalog.'},400);
  if(d.action==='update_evidence'){const current=await fetchRecord(db,d.evidenceId,user.userId,true);if(!current||current.raw.deleted)return json({error:'Evidence not found.'},404);if(current.raw.submittedBy!==user.userId&&!admin(user.userId))return json({error:'You cannot edit this evidence.'},403);if(current.raw.characterId!==evidence.characterId)return json({error:'A feat cannot be moved to another character. Create a new feat instead.'},400);}
  const duplicates=await potentialDuplicates(db,evidence,user.userId,d.action==='update_evidence'?d.evidenceId:undefined);
  const exact=duplicates.find(x=>x.category===evidence.category&&x.title.trim().toLowerCase()===evidence.title.trim().toLowerCase()&&x.description.trim().toLowerCase()===evidence.description.trim().toLowerCase());
  if(exact)return json({error:'An identical feat already exists at this source location.',existing:exact,potentialDuplicates:duplicates},409);
  if(d.action==='create_evidence'){
   const id=crypto.randomUUID();
   await db.prepare('INSERT INTO evidence_records (id,character_id,source_type,series,category,title,description,episode,timestamp,chapter,page,submitted_by,created,updated,deleted,deleted_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,NULL)').bind(id,evidence.characterId,evidence.sourceType,canonical.series,evidence.category,evidence.title,evidence.description,canonical.episode,canonical.timestamp,canonical.chapter,canonical.page,user.userId,now,now).run();
   const created=await fetchRecord(db,id,user.userId);return json({ok:true,record:created?.view,potentialDuplicates:duplicates},201);
  }
  await db.prepare('UPDATE evidence_records SET character_id=?,source_type=?,series=?,category=?,title=?,description=?,episode=?,timestamp=?,chapter=?,page=?,updated=? WHERE id=?').bind(evidence.characterId,evidence.sourceType,canonical.series,evidence.category,evidence.title,evidence.description,canonical.episode,canonical.timestamp,canonical.chapter,canonical.page,now,d.evidenceId).run();
  const updated=await fetchRecord(db,d.evidenceId,user.userId);return json({ok:true,record:updated?.view,potentialDuplicates:duplicates});
 }
 if(d.action==='delete_evidence'){
  const current=await fetchRecord(db,d.evidenceId,user.userId,true);if(!current||current.raw.deleted)return json({error:'Evidence not found.'},404);if(current.raw.submittedBy!==user.userId&&!admin(user.userId))return json({error:'You cannot remove this evidence.'},403);
  await db.prepare('UPDATE evidence_records SET deleted=1,deleted_at=?,updated=? WHERE id=?').bind(now,now,d.evidenceId).run();return json({ok:true,id:d.evidenceId});
 }
 const argument=await db.prepare('SELECT user,battle FROM votes WHERE rowid=?').bind(d.argumentId).first<any>();
 if(!argument||argument.battle!==d.battle)return json({error:'Argument not found.'},404);
 if(d.action==='link_evidence'){
  const record=await fetchRecord(db,d.evidenceId,user.userId);if(!record)return json({error:'Evidence not found.'},404);
  const battle=await battleById(db,d.battle);if(!battle)return json({error:'Battle not found.'},404);
  const allowed=[String((battle as any).fighterAId||''),String((battle as any).fighterBId||'')].filter(Boolean);
  if(!allowed.length)return json({error:'This legacy battle cannot safely attach catalog feats because its fighters are not linked to catalog IDs.'},400);
  if(!allowed.includes(record.view.characterId))return json({error:'Choose evidence for one of the fighters in this battle.'},400);
  await db.prepare('INSERT OR IGNORE INTO argument_evidence_links (battle,argument_user,evidence_id,linked_by,created) VALUES (?,?,?,?,?)').bind(d.battle,argument.user,d.evidenceId,user.userId,now).run();return json({ok:true,id:d.evidenceId});
 }
 const linkRow=await db.prepare('SELECT linked_by AS linkedBy FROM argument_evidence_links WHERE battle=? AND argument_user=? AND evidence_id=?').bind(d.battle,argument.user,d.evidenceId).first<any>();
 if(!linkRow)return json({error:'Evidence link not found.'},404);
 if(linkRow.linkedBy!==user.userId&&argument.user!==user.userId&&!admin(user.userId))return json({error:'You cannot remove this evidence link.'},403);
 await db.prepare('DELETE FROM argument_evidence_links WHERE battle=? AND argument_user=? AND evidence_id=?').bind(d.battle,argument.user,d.evidenceId).run();return json({ok:true,id:d.evidenceId});
 }catch(e){console.error('Evidence save failed',e);return json({error:'Could not save evidence. Please try again.'},503);}}

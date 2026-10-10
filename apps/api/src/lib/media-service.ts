import {database,type DatabaseClient} from '@/db/raw';
import {normalizeSearchText,stableMediaId,type MediaProvider,type MediaType,type NormalizedMedia} from '@anime/domain/media';
import {searchAniList,searchJikan} from '@/lib/media-providers';

const now=()=>Date.now();
const LIMIT_MAX=100;

type MediaRow={id:string;metadataLocked:number};
function safeLimit(value:number|undefined,defaultValue=24){return Math.max(1,Math.min(Number.isFinite(value)?Number(value):defaultValue,LIMIT_MAX));}

export async function listMedia(mediaType:MediaType,options:{query?:string;limit?:number;offset?:number}={}){
 const db=database(),limit=safeLimit(options.limit),offset=Math.max(0,Math.floor(options.offset||0)),q=(options.query||'').trim().toLowerCase();
 const table=mediaType==='anime'?'anime':'manga';
 const statusColumn=mediaType==='anime'?'release_status':'publication_status';
 const countColumn=mediaType==='anime'?'episode_count':'total_chapters';
 const formatExpr=mediaType==='anime'?'format':'NULL::text';
 const releaseYearExpr=mediaType==='anime'?'release_year':'NULL::integer';
 const where=q?'WHERE lower(title_canonical) LIKE ? OR search_text LIKE ?':'';
 const binds=q?[`%${q}%`,`%${normalizeSearchText([q])}%`,limit,offset]:[limit,offset];
 const rows=(await db.prepare(`SELECT id,legacy_key AS "legacyKey",title_canonical AS "titleCanonical",title_english AS "titleEnglish",title_romaji AS "titleRomaji",title_native AS "titleNative",synopsis,${formatExpr} AS format,${statusColumn} AS status,${releaseYearExpr} AS "releaseYear",${countColumn} AS "itemCount",genres,cover_image_url AS "coverImageUrl",data_source AS "dataSource",last_synced_at AS "lastSyncedAt" FROM ${table} ${where} ORDER BY title_canonical ASC LIMIT ? OFFSET ?`).bind(...binds).all<Record<string,unknown>>()).results;
 return rows;
}

export async function getMedia(mediaType:MediaType,id:string){
 const db=database(),table=mediaType==='anime'?'anime':'manga';
 const row=await db.prepare(`SELECT * FROM ${table} WHERE id=? LIMIT 1`).bind(id).first<Record<string,unknown>>();
 if(!row)return null;
 const externalIds=(await db.prepare('SELECT provider,external_id AS "externalId",canonical_url AS "canonicalUrl",verified_at AS "verifiedAt" FROM media_external_ids WHERE media_type=? AND media_id=? ORDER BY provider').bind(mediaType,id).all()).results;
 const relationships=(await db.prepare('SELECT id,from_media_type AS "fromMediaType",from_media_id AS "fromMediaId",to_media_type AS "toMediaType",to_media_id AS "toMediaId",relation_type AS "relationType",source FROM media_relationships WHERE from_media_type=? AND from_media_id=? ORDER BY relation_type,id').bind(mediaType,id).all()).results;
 if(mediaType==='anime'){
  const seasons=(await db.prepare('SELECT id,anime_id AS "animeId",season_number AS "seasonNumber",season_label AS "seasonLabel",title,release_year AS "releaseYear",start_date AS "startDate",end_date AS "endDate",episode_count AS "episodeCount",absolute_episode_start AS "absoluteEpisodeStart",absolute_episode_end AS "absoluteEpisodeEnd",continuity,sort_order AS "sortOrder" FROM anime_seasons WHERE anime_id=? ORDER BY sort_order,id').bind(id).all()).results;
  const episodes=(await db.prepare('SELECT id,anime_id AS "animeId",season_id AS "seasonId",episode_number AS "episodeNumber",absolute_order AS "absoluteOrder",title,air_date AS "airDate",duration_minutes AS "durationMinutes",episode_type AS "episodeType",canon_classification AS "canonClassification",spoiler_level AS "spoilerLevel" FROM anime_episodes WHERE anime_id=? ORDER BY absolute_order NULLS LAST,id LIMIT 1000').bind(id).all()).results;
  return {mediaType,row,externalIds,relationships,seasons,episodes};
 }
 const chapters=(await db.prepare('SELECT id,manga_id AS "mangaId",chapter_number AS "chapterNumber",volume_number AS "volumeNumber",title,publication_date AS "publicationDate",chapter_order AS "chapterOrder",continuity,spoiler_level AS "spoilerLevel" FROM manga_chapters WHERE manga_id=? ORDER BY chapter_order NULLS LAST,id LIMIT 2000').bind(id).all()).results;
 return {mediaType,row,externalIds,relationships,chapters};
}

async function resolveInternalId(db:DatabaseClient,item:NormalizedMedia){
 const resolved=new Set<string>();
 for(const mapping of item.externalIds){
  const row=await db.prepare('SELECT media_id AS "mediaId" FROM media_external_ids WHERE provider=? AND media_type=? AND external_id=? LIMIT 1').bind(mapping.provider,item.mediaType,mapping.externalId).first<{mediaId:string}>();
  if(row?.mediaId)resolved.add(row.mediaId);
 }
 if(resolved.size>1)throw Object.assign(new Error('Provider mappings resolve to multiple internal media records. Manual duplicate review is required.'),{status:409});
 return resolved.values().next().value as string|undefined;
}

function mediaSearchText(item:NormalizedMedia){
 return normalizeSearchText([item.titleCanonical,item.titleEnglish,item.titleRomaji,item.titleNative,...item.alternativeTitles,...item.genres,...item.tags]);
}

async function upsertAnime(db:DatabaseClient,id:string,item:NormalizedMedia,created:boolean){
 const timestamp=now(),existing=created?null:await db.prepare('SELECT metadata_locked AS "metadataLocked" FROM anime WHERE id=?').bind(id).first<MediaRow>();
 if(existing&&Boolean(existing.metadataLocked)){
  await db.prepare('UPDATE anime SET last_synced_at=?,updated_at=? WHERE id=?').bind(timestamp,timestamp,id).run();
  return;
 }
 const alt=JSON.stringify(item.alternativeTitles),genres=JSON.stringify(item.genres),tags=JSON.stringify(item.tags),studios=JSON.stringify(item.studios),search=mediaSearchText(item);
 if(created){
  await db.prepare(`INSERT INTO anime (id,title_canonical,title_english,title_romaji,title_native,alternative_titles,synopsis,format,release_status,release_year,start_date,end_date,episode_count,duration_minutes,genres,tags,studios,cover_image_url,banner_image_url,official_website,data_source,last_synced_at,metadata_complete,metadata_locked,search_text,created_at,updated_at)
   VALUES (?,?,?,?,?,?::jsonb,?,?,?,?,?,?,?,?,?::jsonb,?::jsonb,?::jsonb,?,?,?,?,?,0,0,?,?,?)`).bind(id,item.titleCanonical,item.titleEnglish,item.titleRomaji,item.titleNative,alt,item.synopsis,item.format,item.status,item.releaseYear,item.startDate,item.endDate,item.itemCount,item.durationMinutes,genres,tags,studios,item.coverImageUrl,item.bannerImageUrl,item.officialWebsite,item.provider,timestamp,search,timestamp,timestamp).run();
 }else{
  await db.prepare(`UPDATE anime SET title_canonical=?,title_english=COALESCE(?,title_english),title_romaji=COALESCE(?,title_romaji),title_native=COALESCE(?,title_native),alternative_titles=?::jsonb,synopsis=COALESCE(?,synopsis),format=COALESCE(?,format),release_status=COALESCE(?,release_status),release_year=COALESCE(?,release_year),start_date=COALESCE(?,start_date),end_date=COALESCE(?,end_date),episode_count=COALESCE(?,episode_count),duration_minutes=COALESCE(?,duration_minutes),genres=?::jsonb,tags=?::jsonb,studios=?::jsonb,cover_image_url=COALESCE(?,cover_image_url),banner_image_url=COALESCE(?,banner_image_url),official_website=COALESCE(?,official_website),data_source=?,last_synced_at=?,search_text=?,updated_at=? WHERE id=?`).bind(item.titleCanonical,item.titleEnglish,item.titleRomaji,item.titleNative,alt,item.synopsis,item.format,item.status,item.releaseYear,item.startDate,item.endDate,item.itemCount,item.durationMinutes,genres,tags,studios,item.coverImageUrl,item.bannerImageUrl,item.officialWebsite,item.provider,timestamp,search,timestamp,id).run();
 }
}

async function upsertManga(db:DatabaseClient,id:string,item:NormalizedMedia,created:boolean){
 const timestamp=now(),existing=created?null:await db.prepare('SELECT metadata_locked AS "metadataLocked" FROM manga WHERE id=?').bind(id).first<MediaRow>();
 if(existing&&Boolean(existing.metadataLocked)){
  await db.prepare('UPDATE manga SET last_synced_at=?,updated_at=? WHERE id=?').bind(timestamp,timestamp,id).run();
  return;
 }
 const alt=JSON.stringify(item.alternativeTitles),genres=JSON.stringify(item.genres),search=mediaSearchText(item);
 if(created){
  await db.prepare(`INSERT INTO manga (id,title_canonical,title_english,title_romaji,title_native,alternative_titles,publication_status,start_date,end_date,total_chapters,total_volumes,genres,synopsis,cover_image_url,data_source,last_synced_at,metadata_complete,metadata_locked,search_text,created_at,updated_at)
   VALUES (?,?,?,?,?,?::jsonb,?,?,?,?,?,?::jsonb,?,?,?,?,0,0,?,?,?)`).bind(id,item.titleCanonical,item.titleEnglish,item.titleRomaji,item.titleNative,alt,item.status,item.startDate,item.endDate,item.itemCount,null,genres,item.synopsis,item.coverImageUrl,item.provider,timestamp,search,timestamp,timestamp).run();
 }else{
  await db.prepare(`UPDATE manga SET title_canonical=?,title_english=COALESCE(?,title_english),title_romaji=COALESCE(?,title_romaji),title_native=COALESCE(?,title_native),alternative_titles=?::jsonb,publication_status=COALESCE(?,publication_status),start_date=COALESCE(?,start_date),end_date=COALESCE(?,end_date),total_chapters=COALESCE(?,total_chapters),genres=?::jsonb,synopsis=COALESCE(?,synopsis),cover_image_url=COALESCE(?,cover_image_url),data_source=?,last_synced_at=?,search_text=?,updated_at=? WHERE id=?`).bind(item.titleCanonical,item.titleEnglish,item.titleRomaji,item.titleNative,alt,item.status,item.startDate,item.endDate,item.itemCount,genres,item.synopsis,item.coverImageUrl,item.provider,timestamp,search,timestamp,id).run();
 }
}

export async function upsertNormalizedMedia(item:NormalizedMedia){
 return database().transaction(async db=>{
  const resolved=await resolveInternalId(db,item);
  const fallback=stableMediaId(item.mediaType,item.provider,item.externalId);
  const id=resolved||fallback;
  const table=item.mediaType==='anime'?'anime':'manga';
  const existing=await db.prepare(`SELECT id FROM ${table} WHERE id=? LIMIT 1`).bind(id).first<{id:string}>();
  const created=!existing;
  if(item.mediaType==='anime')await upsertAnime(db,id,item,created);
  else await upsertManga(db,id,item,created);

  for(const mapping of item.externalIds){
   const conflict=await db.prepare('SELECT media_id AS "mediaId" FROM media_external_ids WHERE provider=? AND media_type=? AND external_id=? LIMIT 1').bind(mapping.provider,item.mediaType,mapping.externalId).first<{mediaId:string}>();
   if(conflict&&conflict.mediaId!==id)throw Object.assign(new Error('External provider identity already belongs to another media record.'),{status:409});
   await db.prepare(`INSERT INTO media_external_ids (media_type,media_id,provider,external_id,canonical_url,verified_at,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(media_type,media_id,provider) DO UPDATE SET external_id=excluded.external_id,canonical_url=COALESCE(excluded.canonical_url,media_external_ids.canonical_url),verified_at=excluded.verified_at,updated_at=excluded.updated_at`).bind(item.mediaType,id,mapping.provider,mapping.externalId,mapping.canonicalUrl,now(),now(),now()).run();
  }
  return {id,created};
 });
}

export async function syncProviderSearch(options:{provider:MediaProvider;mediaType:MediaType;query:string;requestedBy:string|null;limit?:number}){
 const db=database(),runId=crypto.randomUUID(),startedAt=now(),limit=Math.max(1,Math.min(options.limit||10,20));
 await db.prepare('INSERT INTO media_sync_runs (id,provider,mode,status,requested_by,query,started_at,imported_count,updated_count,skipped_count,error_count,detail) VALUES (?,?,?,?,?,?,?,0,0,0,0,?::jsonb)').bind(runId,options.provider,'search','running',options.requestedBy,options.query,startedAt,JSON.stringify({mediaType:options.mediaType,limit})).run();
 let imported=0,updated=0,errors=0;
 try{
  const result=options.provider==='anilist'?await searchAniList(options.query,options.mediaType,1,limit):await searchJikan(options.query,options.mediaType,1,limit);
  for(const item of result.results){
   try{
    const saved=await upsertNormalizedMedia(item);
    if(saved.created)imported++;else updated++;
   }catch(error){
    errors++;
    await db.prepare('INSERT INTO media_sync_errors (id,run_id,provider,external_id,code,message,retryable,payload,created_at) VALUES (?,?,?,?,?,?,?,?,?::jsonb)').bind(crypto.randomUUID(),runId,options.provider,item.externalId,'UPSERT_ERROR',error instanceof Error?error.message:String(error),0,JSON.stringify({title:item.titleCanonical}),now()).run();
   }
  }
  await db.prepare('UPDATE media_sync_runs SET status=?,finished_at=?,imported_count=?,updated_count=?,error_count=?,detail=?::jsonb WHERE id=?').bind(errors?'partial':'completed',now(),imported,updated,errors,JSON.stringify({mediaType:options.mediaType,hasNextPage:result.hasNextPage}),runId).run();
  return {runId,imported,updated,errors,results:result.results.length};
 }catch(error){
  await db.prepare('UPDATE media_sync_runs SET status=?,finished_at=?,error_count=error_count+1,detail=?::jsonb WHERE id=?').bind('failed',now(),JSON.stringify({message:error instanceof Error?error.message:String(error)}),runId).run();
  throw error;
 }
}

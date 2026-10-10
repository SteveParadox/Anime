import {database,type DatabaseClient} from '@/db/raw';
import {TRACKING_STATUSES,type ActivityVisibility,type MediaType,type TrackingStatus,type ViewerProgress} from '@anime/domain/media';
import {recordActivity} from '@/lib/activity';

function assertStatus(value:string):asserts value is TrackingStatus{
 if(!(TRACKING_STATUSES as readonly string[]).includes(value))throw Object.assign(new Error('Invalid tracking status.'),{status:400});
}
function tableFor(type:MediaType){return type==='anime'?'anime':'manga';}
async function requireMedia(db:DatabaseClient,type:MediaType,id:string){
 const table=tableFor(type);
 const row=await db.prepare(`SELECT id,legacy_key AS "legacyKey" FROM ${table} WHERE id=? LIMIT 1`).bind(id).first<{id:string;legacyKey:string|null}>();
 if(!row)throw Object.assign(new Error('Media not found.'),{status:404});
 return row;
}
function legacyStatus(status:TrackingStatus){
 if(status==='planned')return 'planned';
 if(status==='completed')return 'completed';
 return 'watching';
}
async function mirrorLegacyWatchlist(db:DatabaseClient,userId:string,mediaType:MediaType,mediaId:string,status:TrackingStatus|null){
 if(mediaType!=='anime')return;
 const media=await db.prepare('SELECT legacy_key AS "legacyKey" FROM anime WHERE id=? LIMIT 1').bind(mediaId).first<{legacyKey:string|null}>();
 if(!media?.legacyKey)return;
 if(!status){await db.prepare('DELETE FROM watchlist WHERE "user"=? AND anime=?').bind(userId,media.legacyKey).run();return;}
 await db.prepare(`INSERT INTO watchlist ("user",anime,status,created) VALUES (?,?,?,?)
  ON CONFLICT("user",anime) DO UPDATE SET status=excluded.status`).bind(userId,media.legacyKey,legacyStatus(status),Date.now()).run();
}

export async function syncLegacyWatchlistWrite(userId:string,legacyAnimeId:string,status:'planned'|'watching'|'completed'|'remove'){
 const db=database(),media=await db.prepare('SELECT id FROM anime WHERE legacy_key=? LIMIT 1').bind(legacyAnimeId).first<{id:string}>();
 if(!media)return false;
 if(status==='remove'){
  await db.prepare("DELETE FROM user_media_tracking WHERE user_id=? AND media_type='anime' AND media_id=?").bind(userId,media.id).run();
  return true;
 }
 await setTracking(userId,{mediaType:'anime',mediaId:media.id,status,currentPosition:null,activityVisibility:'private',source:'legacy_watchlist'});
 return true;
}

export async function listTracking(userId:string){
 const db=database();
 const animeRows=(await db.prepare(`SELECT t.media_type AS "mediaType",t.media_id AS "mediaId",t.status,t.current_item_id AS "currentItemId",t.current_position AS "currentPosition",t.completed_count AS "completedCount",t.started_at AS "startedAt",t.completed_at AS "completedAt",t.updated_at AS "updatedAt",t.cycle,t.activity_visibility AS "activityVisibility",a.title_canonical AS title,a.cover_image_url AS "coverImageUrl",a.episode_count AS "itemCount"
  FROM user_media_tracking t JOIN anime a ON a.id=t.media_id WHERE t.user_id=? AND t.media_type='anime' ORDER BY t.updated_at DESC`).bind(userId).all()).results;
 const mangaRows=(await db.prepare(`SELECT t.media_type AS "mediaType",t.media_id AS "mediaId",t.status,t.current_item_id AS "currentItemId",t.current_position AS "currentPosition",t.completed_count AS "completedCount",t.started_at AS "startedAt",t.completed_at AS "completedAt",t.updated_at AS "updatedAt",t.cycle,t.activity_visibility AS "activityVisibility",m.title_canonical AS title,m.cover_image_url AS "coverImageUrl",m.total_chapters AS "itemCount"
  FROM user_media_tracking t JOIN manga m ON m.id=t.media_id WHERE t.user_id=? AND t.media_type='manga' ORDER BY t.updated_at DESC`).bind(userId).all()).results;
 return [...animeRows,...mangaRows].sort((a,b)=>Number((b as {updatedAt?:number}).updatedAt||0)-Number((a as {updatedAt?:number}).updatedAt||0));
}

export async function mediaHistory(userId:string,limit=100){
 return (await database().prepare(`SELECT id,media_type AS "mediaType",media_id AS "mediaId",event_type AS "eventType",previous_value AS "previousValue",new_value AS "newValue",source,visibility,created_at AS "createdAt"
  FROM user_media_history WHERE user_id=? ORDER BY created_at DESC LIMIT ?`).bind(userId,Math.max(1,Math.min(limit,250))).all()).results;
}

export async function setTracking(userId:string,input:{mediaType:MediaType;mediaId:string;status:string;currentPosition:string|null;activityVisibility?:ActivityVisibility;source?:string}){
 assertStatus(input.status);
 return database().transaction(async db=>{
  await requireMedia(db,input.mediaType,input.mediaId);
  const previous=await db.prepare(`SELECT status,current_position AS "currentPosition",completed_count AS "completedCount",cycle,activity_visibility AS "activityVisibility",started_at AS "startedAt",completed_at AS "completedAt" FROM user_media_tracking WHERE user_id=? AND media_type=? AND media_id=? FOR UPDATE`).bind(userId,input.mediaType,input.mediaId).first<any>();
  const visibility=input.activityVisibility||previous?.activityVisibility||'private',timestamp=Date.now();
  const startedAt=previous?.startedAt||((input.status==='watching'||input.status==='reading'||input.status==='rewatching'||input.status==='rereading')?timestamp:null);
  const completedAt=input.status==='completed'?(previous?.completedAt||timestamp):null;
  const next={status:input.status,currentPosition:input.currentPosition??previous?.currentPosition??null,completedCount:Number(previous?.completedCount||0),cycle:Number(previous?.cycle||1),activityVisibility:visibility,startedAt,completedAt};
  const same=previous&&previous.status===next.status&&String(previous.currentPosition??'')===String(next.currentPosition??'')&&previous.activityVisibility===visibility;
  if(same)return {changed:false,tracking:next};
  await db.prepare(`INSERT INTO user_media_tracking (user_id,media_type,media_id,status,current_position,completed_count,started_at,completed_at,updated_at,cycle,spoiler_mode,activity_visibility)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
   ON CONFLICT(user_id,media_type,media_id) DO UPDATE SET status=excluded.status,current_position=excluded.current_position,started_at=COALESCE(user_media_tracking.started_at,excluded.started_at),completed_at=excluded.completed_at,updated_at=excluded.updated_at,activity_visibility=excluded.activity_visibility`).bind(userId,input.mediaType,input.mediaId,next.status,next.currentPosition,next.completedCount,next.startedAt,next.completedAt,timestamp,next.cycle,'progress',visibility).run();
  await db.prepare(`INSERT INTO user_media_history (id,user_id,media_type,media_id,event_type,previous_value,new_value,source,visibility,created_at,dedupe_key)
   VALUES (?,?,?,?,?,?,?::jsonb,?::jsonb,?,?,?,NULL)`).bind(crypto.randomUUID(),userId,input.mediaType,input.mediaId,previous?'tracking_updated':'tracking_added',previous?JSON.stringify(previous):null,JSON.stringify(next),input.source||'manual',visibility,timestamp).run();
  await mirrorLegacyWatchlist(db,userId,input.mediaType,input.mediaId,input.status);
  if(input.status==='completed'){
   await recordActivity({userId,eventType:'media_completed',subjectType:input.mediaType,subjectId:input.mediaId,mediaType:input.mediaType,mediaId:input.mediaId,visibility,metadata:{status:'completed'},dedupeKey:`media-completed:${input.mediaType}:${input.mediaId}:${next.cycle}`});
  }
  return {changed:true,tracking:next};
 });
}

export async function removeTracking(userId:string,mediaType:MediaType,mediaId:string){
 return database().transaction(async db=>{
  const previous=await db.prepare('SELECT status,current_position AS "currentPosition",completed_count AS "completedCount",cycle,activity_visibility AS "activityVisibility" FROM user_media_tracking WHERE user_id=? AND media_type=? AND media_id=? FOR UPDATE').bind(userId,mediaType,mediaId).first<any>();
  if(!previous)return false;
  await db.prepare('DELETE FROM user_media_tracking WHERE user_id=? AND media_type=? AND media_id=?').bind(userId,mediaType,mediaId).run();
  await db.prepare('INSERT INTO user_media_history (id,user_id,media_type,media_id,event_type,previous_value,new_value,source,visibility,created_at,dedupe_key) VALUES (?,?,?,?,?,?::jsonb,NULL,?,?,?,NULL)').bind(crypto.randomUUID(),userId,mediaType,mediaId,'tracking_removed',JSON.stringify(previous),'manual','private',Date.now()).run();
  await mirrorLegacyWatchlist(db,userId,mediaType,mediaId,null);
  return true;
 });
}

async function completionCycle(db:DatabaseClient,userId:string,mediaType:MediaType,mediaId:string){
 const row=await db.prepare('SELECT cycle FROM user_media_tracking WHERE user_id=? AND media_type=? AND media_id=? LIMIT 1').bind(userId,mediaType,mediaId).first<{cycle:number}>();
 return Number(row?.cycle||1);
}

export async function completeEpisode(userId:string,episodeId:string,source='manual'){
 const db=database(),episode=await db.prepare('SELECT id,anime_id AS "animeId",episode_number AS "episodeNumber",absolute_order AS "absoluteOrder" FROM anime_episodes WHERE id=? LIMIT 1').bind(episodeId).first<{id:string;animeId:string;episodeNumber:string;absoluteOrder:number|null}>();
 if(!episode)throw Object.assign(new Error('Episode not found.'),{status:404});
 const cycle=await completionCycle(db,userId,'anime',episode.animeId),timestamp=Date.now();
 const result=await db.prepare('INSERT INTO user_episode_completions (user_id,episode_id,viewing_cycle,completed_at,completion_source) VALUES (?,?,?,?,?) ON CONFLICT(user_id,episode_id,viewing_cycle) DO NOTHING').bind(userId,episodeId,cycle,timestamp,source).run();
 if(!result.meta.changes)return {changed:false};
 const completed=await db.prepare('SELECT COUNT(*) AS n FROM user_episode_completions u JOIN anime_episodes e ON e.id=u.episode_id WHERE u.user_id=? AND u.viewing_cycle=? AND e.anime_id=?').bind(userId,cycle,episode.animeId).first<{n:number}>();
 const position=episode.absoluteOrder!=null?String(episode.absoluteOrder):episode.episodeNumber;
 await setTracking(userId,{mediaType:'anime',mediaId:episode.animeId,status:'watching',currentPosition:position,source:'episode_completion'});
 await db.prepare('UPDATE user_media_tracking SET current_item_id=?,completed_count=?,updated_at=? WHERE user_id=? AND media_type=? AND media_id=?').bind(episodeId,Number(completed?.n||0),timestamp,userId,'anime',episode.animeId).run();
 return {changed:true,completedCount:Number(completed?.n||0),currentPosition:position};
}

export async function uncompleteEpisode(userId:string,episodeId:string){
 const db=database(),episode=await db.prepare('SELECT anime_id AS "animeId" FROM anime_episodes WHERE id=? LIMIT 1').bind(episodeId).first<{animeId:string}>();
 if(!episode)throw Object.assign(new Error('Episode not found.'),{status:404});
 const cycle=await completionCycle(db,userId,'anime',episode.animeId);
 const result=await db.prepare('DELETE FROM user_episode_completions WHERE user_id=? AND episode_id=? AND viewing_cycle=?').bind(userId,episodeId,cycle).run();
 if(!result.meta.changes)return {changed:false};
 const latest=await db.prepare(`SELECT e.id,e.episode_number AS "episodeNumber",e.absolute_order AS "absoluteOrder",COUNT(*) OVER() AS n FROM user_episode_completions u JOIN anime_episodes e ON e.id=u.episode_id WHERE u.user_id=? AND u.viewing_cycle=? AND e.anime_id=? ORDER BY e.absolute_order DESC NULLS LAST,e.id DESC LIMIT 1`).bind(userId,cycle,episode.animeId).first<any>();
 const position=latest?(latest.absoluteOrder!=null?String(latest.absoluteOrder):latest.episodeNumber):null;
 await db.prepare('UPDATE user_media_tracking SET current_item_id=?,current_position=?,completed_count=?,updated_at=? WHERE user_id=? AND media_type=? AND media_id=?').bind(latest?.id||null,position,Number(latest?.n||0),Date.now(),userId,'anime',episode.animeId).run();
 return {changed:true,completedCount:Number(latest?.n||0),currentPosition:position};
}

export async function completeChapter(userId:string,chapterId:string,source='manual'){
 const db=database(),chapter=await db.prepare('SELECT id,manga_id AS "mangaId",chapter_number AS "chapterNumber",chapter_order AS "chapterOrder" FROM manga_chapters WHERE id=? LIMIT 1').bind(chapterId).first<{id:string;mangaId:string;chapterNumber:string;chapterOrder:number|null}>();
 if(!chapter)throw Object.assign(new Error('Chapter not found.'),{status:404});
 const cycle=await completionCycle(db,userId,'manga',chapter.mangaId),timestamp=Date.now();
 const result=await db.prepare('INSERT INTO user_chapter_completions (user_id,chapter_id,reading_cycle,completed_at,completion_source) VALUES (?,?,?,?,?) ON CONFLICT(user_id,chapter_id,reading_cycle) DO NOTHING').bind(userId,chapterId,cycle,timestamp,source).run();
 if(!result.meta.changes)return {changed:false};
 const completed=await db.prepare('SELECT COUNT(*) AS n FROM user_chapter_completions u JOIN manga_chapters c ON c.id=u.chapter_id WHERE u.user_id=? AND u.reading_cycle=? AND c.manga_id=?').bind(userId,cycle,chapter.mangaId).first<{n:number}>();
 const position=chapter.chapterOrder!=null?String(chapter.chapterOrder):chapter.chapterNumber;
 await setTracking(userId,{mediaType:'manga',mediaId:chapter.mangaId,status:'reading',currentPosition:position,source:'chapter_completion'});
 await db.prepare('UPDATE user_media_tracking SET current_item_id=?,completed_count=?,updated_at=? WHERE user_id=? AND media_type=? AND media_id=?').bind(chapterId,Number(completed?.n||0),timestamp,userId,'manga',chapter.mangaId).run();
 return {changed:true,completedCount:Number(completed?.n||0),currentPosition:position};
}

export async function progressForMedia(userId:string,mediaType:MediaType,mediaId:string):Promise<ViewerProgress|null>{
 const db=database(),tracking=await db.prepare('SELECT current_position AS "currentPosition" FROM user_media_tracking WHERE user_id=? AND media_type=? AND media_id=? LIMIT 1').bind(userId,mediaType,mediaId).first<{currentPosition:string|null}>();
 if(!tracking)return null;
 const completedRows=mediaType==='anime'
  ?(await db.prepare('SELECT episode_id AS id FROM user_episode_completions u JOIN anime_episodes e ON e.id=u.episode_id WHERE u.user_id=? AND e.anime_id=?').bind(userId,mediaId).all<{id:string}>()).results
  :(await db.prepare('SELECT chapter_id AS id FROM user_chapter_completions u JOIN manga_chapters c ON c.id=u.chapter_id WHERE u.user_id=? AND c.manga_id=?').bind(userId,mediaId).all<{id:string}>()).results;
 return {mediaType,mediaId,currentPosition:tracking.currentPosition,completedItemIds:new Set(completedRows.map(row=>row.id)),explicitReveal:false};
}

export async function clubSpoilerPosition(userId:string,clubId:string){
 const row=await database().prepare(`SELECT p.episode,cml.anime_id AS "animeId" FROM progress p JOIN club_media_links cml ON cml.club_id=p.club WHERE p."user"=? AND p.club=? LIMIT 1`).bind(userId,clubId).first<{episode:number;animeId:string}>();
 return row?{animeId:row.animeId,episode:Number(row.episode)}:null;
}

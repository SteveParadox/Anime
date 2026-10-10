import {database,type DatabaseClient} from '@/db/raw';
import {rankForPoints} from '@anime/domain/media';

export const REPUTATION_WEIGHT_VERSION=1;
export const REPUTATION_DAILY_CAP=50;
const DAY_MS=86_400_000;
const dayStart=(time:number)=>Math.floor(time/DAY_MS)*DAY_MS;

type SourceEvent={eventType:string;points:number;sourceType:string;sourceId:string;createdAt:number};

async function addEvent(db:DatabaseClient,userId:string,event:SourceEvent){
 const exists=await db.prepare('SELECT 1 FROM reputation_events WHERE user_id=? AND event_type=? AND source_type=? AND source_id=? LIMIT 1').bind(userId,event.eventType,event.sourceType,event.sourceId).first();
 if(exists)return 0;
 const start=dayStart(event.createdAt),end=start+DAY_MS;
 const current=await db.prepare('SELECT COALESCE(SUM(points),0) AS n FROM reputation_events WHERE user_id=? AND created_at>=? AND created_at<?').bind(userId,start,end).first<{n:number}>();
 const available=Math.max(0,REPUTATION_DAILY_CAP-Number(current?.n||0));
 const awarded=Math.min(event.points,available);
 if(awarded<=0)return 0;
 await db.prepare('INSERT INTO reputation_events(id,user_id,event_type,points,source_type,source_id,weight_version,created_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id,event_type,source_type,source_id) DO NOTHING').bind(crypto.randomUUID(),userId,event.eventType,awarded,event.sourceType,event.sourceId,REPUTATION_WEIGHT_VERSION,event.createdAt).run();
 return awarded;
}

async function authoritativeEvents(db:DatabaseClient,userId:string):Promise<SourceEvent[]>{
 const [battles,votes,squads,evidence,completions]=await Promise.all([
  db.prepare('SELECT id,created FROM battles WHERE owner=?').bind(userId).all<{id:string;created:number}>(),
  db.prepare('SELECT battle,created FROM votes WHERE "user"=?').bind(userId).all<{battle:string;created:number}>(),
  db.prepare('SELECT id,created FROM squad_submissions WHERE owner=? AND removed=0').bind(userId).all<{id:string;created:number}>(),
  db.prepare('SELECT id,created FROM evidence_records WHERE submitted_by=? AND deleted=0').bind(userId).all<{id:string;created:number}>(),
  db.prepare("SELECT media_id AS "mediaId",cycle,completed_at AS "completedAt" FROM user_media_tracking WHERE user_id=? AND media_type='anime' AND status='completed' AND completed_at IS NOT NULL").bind(userId).all<{mediaId:string;cycle:number;completedAt:number}>()
 ]);
 return [
  ...battles.results.map(row=>({eventType:'battle_created',points:5,sourceType:'battle',sourceId:row.id,createdAt:Number(row.created)})),
  ...votes.results.map(row=>({eventType:'battle_participation',points:1,sourceType:'battle_vote',sourceId:row.battle,createdAt:Number(row.created)})),
  ...squads.results.map(row=>({eventType:'squad_submission',points:4,sourceType:'squad_submission',sourceId:row.id,createdAt:Number(row.created)})),
  ...evidence.results.map(row=>({eventType:'evidence_contribution',points:3,sourceType:'evidence',sourceId:row.id,createdAt:Number(row.created)})),
  ...completions.results.map(row=>({eventType:'anime_completed',points:5,sourceType:'anime_tracking',sourceId:`${row.mediaId}:${row.cycle}`,createdAt:Number(row.completedAt)}))
 ].filter(row=>Number.isFinite(row.createdAt)&&row.createdAt>0).sort((a,b)=>a.createdAt-b.createdAt||a.sourceId.localeCompare(b.sourceId));
}

async function awardBadge(db:DatabaseClient,userId:string,badgeId:string,sourceType:string,sourceId:string,earnedAt:number){
 await db.prepare('INSERT INTO user_badges(user_id,badge_id,earned_at,source_type,source_id) VALUES (?,?,?,?,?) ON CONFLICT(user_id,badge_id) DO NOTHING').bind(userId,badgeId,earnedAt,sourceType,sourceId).run();
}

export async function ensureProgression(userId:string){
 const db=database(),events=await authoritativeEvents(db,userId);
 for(const event of events)await addEvent(db,userId,event);
 const counts=await Promise.all([
  db.prepare('SELECT id,created FROM battles WHERE owner=? ORDER BY created LIMIT 1').bind(userId).first<{id:string;created:number}>(),
  db.prepare('SELECT id,created FROM squad_submissions WHERE owner=? AND removed=0 ORDER BY created LIMIT 1').bind(userId).first<{id:string;created:number}>(),
  db.prepare('SELECT id,created FROM evidence_records WHERE submitted_by=? AND deleted=0 ORDER BY created LIMIT 1').bind(userId).first<{id:string;created:number}>(),
  db.prepare("SELECT media_id AS "mediaId",completed_at AS "completedAt" FROM user_media_tracking WHERE user_id=? AND media_type='anime' AND status='completed' AND completed_at IS NOT NULL ORDER BY completed_at LIMIT 1").bind(userId).first<{mediaId:string;completedAt:number}>(),
  db.prepare("SELECT COUNT(*) AS n FROM user_media_tracking WHERE user_id=? AND media_type='anime' AND status='completed'").bind(userId).first<{n:number}>()
 ]);
 const [firstBattle,firstSquad,firstEvidence,firstAnime,animeCount]=counts;
 if(firstBattle)await awardBadge(db,userId,'first-battle','battle',firstBattle.id,Number(firstBattle.created));
 if(firstSquad){await awardBadge(db,userId,'first-squad','squad_submission',firstSquad.id,Number(firstSquad.created));await awardBadge(db,userId,'daily-challenger','squad_submission',firstSquad.id,Number(firstSquad.created));}
 if(firstEvidence)await awardBadge(db,userId,'first-evidence','evidence',firstEvidence.id,Number(firstEvidence.created));
 if(firstAnime)await awardBadge(db,userId,'first-anime-complete','anime_tracking',firstAnime.mediaId,Number(firstAnime.completedAt));
 if(Number(animeCount?.n||0)>=10)await awardBadge(db,userId,'ten-anime-complete','anime_tracking','ten-completed',Date.now());

 const pointsRow=await db.prepare('SELECT COALESCE(SUM(points),0) AS n FROM reputation_events WHERE user_id=?').bind(userId).first<{n:number}>(),points=Number(pointsRow?.n||0),rank=rankForPoints(points);
 await db.prepare('INSERT INTO user_rank_history(id,user_id,rank_id,points,rank_version,achieved_at) VALUES (?,?,?,?,1,?) ON CONFLICT(user_id,rank_id,rank_version) DO NOTHING').bind(crypto.randomUUID(),userId,rank.id,points,Date.now()).run();
 const badges=(await db.prepare('SELECT b.id,b.name,b.description,b.category,b.icon,ub.earned_at AS "earnedAt" FROM user_badges ub JOIN profile_badges b ON b.id=ub.badge_id WHERE ub.user_id=? AND ub.revoked_at IS NULL ORDER BY ub.earned_at DESC,b.id').bind(userId).all()).results;
 return {points,rank,badges,weightVersion:REPUTATION_WEIGHT_VERSION,dailyCap:REPUTATION_DAILY_CAP};
}

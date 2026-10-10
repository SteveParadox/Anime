import {database} from '@/db/raw';
import type {ActivityVisibility} from '@anime/domain/media';

type ActivityInput={
 userId:string;
 eventType:string;
 subjectType:string;
 subjectId:string;
 mediaType?:'anime'|'manga'|null;
 mediaId?:string|null;
 spoilerPosition?:string|null;
 visibility?:ActivityVisibility;
 metadata?:Record<string,unknown>;
 dedupeKey:string;
};

const preferenceColumn=(eventType:string)=>{
 if(eventType.startsWith('battle_'))return 'publish_battles';
 if(eventType.startsWith('squad_'))return 'publish_squads';
 if(eventType.startsWith('evidence_'))return 'publish_evidence';
 if(eventType.startsWith('discussion_'))return 'publish_discussions';
 if(eventType.startsWith('media_'))return 'publish_tracking';
 return null;
};

export async function usersBlocked(a:string,b:string){
 if(a===b)return false;
 const row=await database().prepare('SELECT 1 FROM user_blocks WHERE (blocker_user_id=? AND blocked_user_id=?) OR (blocker_user_id=? AND blocked_user_id=?) LIMIT 1').bind(a,b,b,a).first();
 return Boolean(row);
}

export async function recordActivity(input:ActivityInput){
 const db=database(),column=preferenceColumn(input.eventType);
 if(column){
  const pref=await db.prepare(`SELECT ${column} AS enabled FROM user_activity_preferences WHERE user_id=? LIMIT 1`).bind(input.userId).first<{enabled:number}>();
  if(pref&& !Boolean(pref.enabled))return false;
  if(!pref&&column==='publish_tracking')return false;
 }
 const visibility=input.visibility||'public',created=Date.now();
 await db.prepare(`INSERT INTO user_activity_events
  (id,user_id,event_type,subject_type,subject_id,media_type,media_id,spoiler_position,visibility,metadata,created_at,dedupe_key)
  VALUES (?,?,?,?,?,?,?,?,?,?::jsonb,?,?)
  ON CONFLICT(user_id,dedupe_key) DO NOTHING`).bind(
   crypto.randomUUID(),input.userId,input.eventType,input.subjectType,input.subjectId,input.mediaType||null,input.mediaId||null,
   input.spoilerPosition||null,visibility,JSON.stringify(input.metadata||{}),created,input.dedupeKey
  ).run();
 return true;
}

export async function setActivityPreferences(userId:string,input:{
 profileVisibility:'public'|'private';
 publishBattles:boolean;
 publishSquads:boolean;
 publishEvidence:boolean;
 publishDiscussions:boolean;
 publishTracking:boolean;
}){
 const now=Date.now();
 await database().prepare(`INSERT INTO user_activity_preferences
  (user_id,profile_visibility,publish_battles,publish_squads,publish_evidence,publish_discussions,publish_tracking,updated_at)
  VALUES (?,?,?,?,?,?,?,?)
  ON CONFLICT(user_id) DO UPDATE SET profile_visibility=excluded.profile_visibility,publish_battles=excluded.publish_battles,publish_squads=excluded.publish_squads,publish_evidence=excluded.publish_evidence,publish_discussions=excluded.publish_discussions,publish_tracking=excluded.publish_tracking,updated_at=excluded.updated_at`).bind(
  userId,input.profileVisibility,input.publishBattles?1:0,input.publishSquads?1:0,input.publishEvidence?1:0,input.publishDiscussions?1:0,input.publishTracking?1:0,now
 ).run();
}

export async function activityPreferences(userId:string){
 const row=await database().prepare('SELECT profile_visibility AS "profileVisibility",publish_battles AS "publishBattles",publish_squads AS "publishSquads",publish_evidence AS "publishEvidence",publish_discussions AS "publishDiscussions",publish_tracking AS "publishTracking" FROM user_activity_preferences WHERE user_id=? LIMIT 1').bind(userId).first<Record<string,unknown>>();
 return row||{profileVisibility:'public',publishBattles:1,publishSquads:1,publishEvidence:1,publishDiscussions:1,publishTracking:0};
}

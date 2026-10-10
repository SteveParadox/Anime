import {z} from 'zod';
import {database} from '@/db/raw';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';
import {canContribute,getCurrentUser} from '@/lib/auth';
import {checkRateLimit} from '@/lib/auth-rate-limit';
import {activityPreferences,setActivityPreferences,usersBlocked} from '@/lib/activity';
import {canViewSpoiler,type MediaType} from '@anime/domain/media';
import {progressForMedia} from '@/lib/media-tracking';

const id=z.string().trim().min(1).max(180);
const handle=z.string().trim().regex(/^[a-z0-9_]{3,24}$/);
const mutation=z.discriminatedUnion('action',[
 z.object({action:z.literal('follow'),targetUserId:id}).strict(),
 z.object({action:z.literal('unfollow'),targetUserId:id}).strict(),
 z.object({action:z.literal('block'),targetUserId:id}).strict(),
 z.object({action:z.literal('unblock'),targetUserId:id}).strict(),
 z.object({action:z.literal('preferences'),profileVisibility:z.enum(['public','private']),publishBattles:z.boolean(),publishSquads:z.boolean(),publishEvidence:z.boolean(),publishDiscussions:z.boolean(),publishTracking:z.boolean()}).strict()
]);

async function targetUser(url:URL){
 const db=database(),userId=url.searchParams.get('userId'),profileHandle=url.searchParams.get('handle');
 if(userId&&id.safeParse(userId).success)return db.prepare('SELECT u.id,p.handle,p.display_name AS "displayName",p.avatar_url AS "avatarUrl",p.visibility FROM users u JOIN profiles p ON p.user=u.id WHERE u.id=? AND u.profile_completed=1 AND u.email_verified=1 LIMIT 1').bind(userId).first<any>();
 if(profileHandle&&handle.safeParse(profileHandle).success)return db.prepare('SELECT u.id,p.handle,p.display_name AS "displayName",p.avatar_url AS "avatarUrl",p.visibility FROM users u JOIN profiles p ON p.user=u.id WHERE p.handle=? AND u.profile_completed=1 AND u.email_verified=1 LIMIT 1').bind(profileHandle.toLowerCase()).first<any>();
 return null;
}

async function canViewProfile(viewerId:string|null,target:{id:string;visibility:string}){
 if(viewerId===target.id)return true;
 if(target.visibility!=='public')return false;
 if(viewerId&&await usersBlocked(viewerId,target.id))return false;
 return true;
}

async function serializeEvents(rows:any[],viewerId:string|null){
 const cache=new Map<string,Awaited<ReturnType<typeof progressForMedia>>>();
 const output=[];
 for(const row of rows){
  let redacted=false;
  if(row.mediaType&&row.mediaId&&row.spoilerPosition){
   const key=`${row.mediaType}:${row.mediaId}`;
   let progress=cache.get(key);
   if(progress===undefined){
    progress=viewerId?await progressForMedia(viewerId,row.mediaType as MediaType,row.mediaId):null;
    cache.set(key,progress);
   }
   redacted=!canViewSpoiler(progress,{mediaType:row.mediaType as MediaType,mediaId:row.mediaId,position:row.spoilerPosition});
  }
  output.push(redacted?{id:row.id,userId:row.userId,handle:row.handle,displayName:row.displayName,eventType:'spoiler_redacted',subjectType:row.subjectType,subjectId:null,mediaType:row.mediaType,mediaId:row.mediaId,spoiler:true,metadata:{},createdAt:Number(row.createdAt)}:{...row,spoiler:false,createdAt:Number(row.createdAt)});
 }
 return output;
}

const EVENT_SELECT='SELECT e.id,e.user_id AS "userId",p.handle,p.display_name AS "displayName",p.avatar_url AS "avatarUrl",e.event_type AS "eventType",e.subject_type AS "subjectType",e.subject_id AS "subjectId",e.media_type AS "mediaType",e.media_id AS "mediaId",e.spoiler_position AS "spoilerPosition",e.visibility,e.metadata,e.created_at AS "createdAt"';

export async function GET(request:Request){
 try{
  const db=database(),viewer=await getCurrentUser(),url=new URL(request.url),mode=url.searchParams.get('mode')||'followers',limit=Math.max(1,Math.min(Number(url.searchParams.get('limit')||50)||50,100));
  if(mode==='preferences'){
   if(!viewer)return authJson({error:'Sign in first.'},401);
   return authJson({preferences:await activityPreferences(viewer.userId)});
  }
  if(mode==='feed'){
   if(!viewer)return authJson({error:'Sign in first.'},401);
   const rows=(await db.prepare(`${EVENT_SELECT} FROM user_activity_events e JOIN user_follows f ON f.followed_user_id=e.user_id JOIN profiles p ON p.user=e.user_id
    WHERE f.follower_user_id=? AND p.visibility='public' AND e.visibility IN ('public','followers')
    AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE (b.blocker_user_id=? AND b.blocked_user_id=e.user_id) OR (b.blocker_user_id=e.user_id AND b.blocked_user_id=?))
    ORDER BY e.created_at DESC,e.id LIMIT ?`).bind(viewer.userId,viewer.userId,viewer.userId,limit).all<any>()).results;
   return authJson({events:await serializeEvents(rows,viewer.userId)});
  }
  const target=await targetUser(url);if(!target)return authJson({error:'User not found.'},404);
  if(!await canViewProfile(viewer?.userId||null,target))return authJson({error:'Profile is private.'},403);
  if(mode==='followers'||mode==='following'){
   const direction=mode==='followers'?'f.followed_user_id=?':'f.follower_user_id=?';
   const joined=mode==='followers'?'f.follower_user_id':'f.followed_user_id';
   const rows=(await db.prepare(`SELECT p.user,p.handle,p.display_name AS "displayName",p.avatar_url AS "avatarUrl",f.created_at AS "createdAt" FROM user_follows f JOIN profiles p ON p.user=${joined} WHERE ${direction} AND p.visibility='public' ORDER BY f.created_at DESC LIMIT ?`).bind(target.id,limit).all()).results;
   return authJson({users:rows});
  }
  if(mode==='activity'){
   const isSelf=viewer?.userId===target.id;
   const follows=viewer&&!isSelf?Boolean(await db.prepare('SELECT 1 FROM user_follows WHERE follower_user_id=? AND followed_user_id=?').bind(viewer.userId,target.id).first()):false;
   const allowed=isSelf?['private','followers','public']:follows?['followers','public']:['public'];
   const rows=(await db.prepare(`${EVENT_SELECT} FROM user_activity_events e JOIN profiles p ON p.user=e.user_id WHERE e.user_id=? AND e.visibility IN (${allowed.map(()=>'?').join(',')}) ORDER BY e.created_at DESC,e.id LIMIT ?`).bind(target.id,...allowed,limit).all<any>()).results;
   return authJson({events:await serializeEvents(rows,viewer?.userId||null)});
  }
  return authJson({error:'Unknown social view.'},400);
 }catch(error){console.error('Social load failed',error);return authJson({error:'Unable to load social data.'},503);}
}

export async function POST(request:Request){
 if(!sameOrigin(request))return authJson({error:'Cross-origin request rejected.'},403);
 const user=await getCurrentUser();if(!user)return authJson({error:'Sign in first.'},401);
 if(!canContribute(user))return authJson({error:'Verify your email and complete your profile.'},403);
 try{
  const input=mutation.parse(await readJson(request,5_000)),db=database();
  if(input.action==='preferences'){await setActivityPreferences(user.userId,input);await db.prepare('UPDATE profiles SET visibility=?,activity_public=?,watch_activity_public=?,updated=? WHERE user=?').bind(input.profileVisibility,input.publishBattles||input.publishSquads||input.publishEvidence||input.publishDiscussions?1:0,input.publishTracking?1:0,Date.now(),user.userId).run();return authJson({ok:true});}
  if(input.targetUserId===user.userId)return authJson({error:'You cannot follow or block yourself.'},400);
  const target=await db.prepare('SELECT u.id,p.visibility FROM users u JOIN profiles p ON p.user=u.id WHERE u.id=? AND u.profile_completed=1 AND u.email_verified=1 LIMIT 1').bind(input.targetUserId).first<{id:string;visibility:string}>();
  if(!target)return authJson({error:'User not found.'},404);
  const rate=await checkRateLimit('social-relationship',user.userId,60,60_000);if(!rate.allowed)return authJson({error:'Too many social updates.'},429,{'Retry-After':String(rate.retryAfterSeconds)});
  if(input.action==='follow'){
   if(target.visibility!=='public')return authJson({error:'This profile is private.'},403);
   if(await usersBlocked(user.userId,target.id))return authJson({error:'Following is unavailable for this account.'},403);
   await db.prepare('INSERT INTO user_follows(follower_user_id,followed_user_id,created_at) VALUES (?,?,?) ON CONFLICT DO NOTHING').bind(user.userId,target.id,Date.now()).run();
  }else if(input.action==='unfollow')await db.prepare('DELETE FROM user_follows WHERE follower_user_id=? AND followed_user_id=?').bind(user.userId,target.id).run();
  else if(input.action==='block')await db.transaction(async tx=>{await tx.prepare('INSERT INTO user_blocks(blocker_user_id,blocked_user_id,created_at) VALUES (?,?,?) ON CONFLICT DO NOTHING').bind(user.userId,target.id,Date.now()).run();await tx.prepare('DELETE FROM user_follows WHERE (follower_user_id=? AND followed_user_id=?) OR (follower_user_id=? AND followed_user_id=?)').bind(user.userId,target.id,target.id,user.userId).run();});
  else await db.prepare('DELETE FROM user_blocks WHERE blocker_user_id=? AND blocked_user_id=?').bind(user.userId,target.id).run();
  return authJson({ok:true});
 }catch(error){if(error instanceof z.ZodError)return authJson({error:'Invalid social update.',issues:error.issues},400);console.error('Social update failed',error);return authJson({error:'Unable to update social relationship.'},503);}
}

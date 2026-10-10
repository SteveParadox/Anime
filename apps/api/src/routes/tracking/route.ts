import {z} from 'zod';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';
import {canContribute,getCurrentUser} from '@/lib/auth';
import {listTracking,mediaHistory,setTracking,removeTracking,completeEpisode,uncompleteEpisode,completeChapter,uncompleteChapter,progressForMedia} from '@/lib/media-tracking';

const id=z.string().trim().min(1).max(180);
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('set_tracking'),mediaType:z.enum(['anime','manga']),mediaId:id,status:z.enum(['planned','watching','completed','paused','dropped','rewatching','reading','rereading']),currentPosition:z.string().trim().max(40).nullable().default(null),activityVisibility:z.enum(['private','followers','public']).default('private')}).strict(),
 z.object({action:z.literal('remove_tracking'),mediaType:z.enum(['anime','manga']),mediaId:id}).strict(),
 z.object({action:z.literal('complete_episode'),episodeId:id}).strict(),
 z.object({action:z.literal('uncomplete_episode'),episodeId:id}).strict(),
 z.object({action:z.literal('complete_chapter'),chapterId:id}).strict(),
 z.object({action:z.literal('uncomplete_chapter'),chapterId:id}).strict()
]);

export async function GET(request:Request){
 const user=await getCurrentUser();if(!user)return authJson({error:'Sign in first.'},401);
 try{
  const url=new URL(request.url),mode=url.searchParams.get('mode')||'tracking';
  if(mode==='history')return authJson({history:await mediaHistory(user.userId,Number(url.searchParams.get('limit')||100)||100)});
  if(mode==='progress'){
   const type=z.enum(['anime','manga']).parse(url.searchParams.get('type')),mediaId=id.parse(url.searchParams.get('mediaId'));
   const progress=await progressForMedia(user.userId,type,mediaId);
   return progress?authJson({progress:{...progress,completedItemIds:[...progress.completedItemIds]}}):authJson({progress:null});
  }
  if(mode==='tracking')return authJson({tracking:await listTracking(user.userId)});
  return authJson({error:'Unknown tracking view.'},400);
 }catch(error){if(error instanceof z.ZodError)return authJson({error:'Invalid tracking query.'},400);console.error('Tracking load failed',error);return authJson({error:'Unable to load tracking.'},503);}
}

export async function POST(request:Request){
 if(!sameOrigin(request))return authJson({error:'Cross-origin request rejected.'},403);
 const user=await getCurrentUser();if(!user)return authJson({error:'Sign in first.'},401);
 if(!canContribute(user))return authJson({error:'Verify your email and complete your profile.'},403);
 try{
  const input=schema.parse(await readJson(request,8_000));
  if(input.action==='set_tracking')return authJson(await setTracking(user.userId,{...input,source:'tracking_api'}));
  if(input.action==='remove_tracking')return authJson({ok:await removeTracking(user.userId,input.mediaType,input.mediaId)});
  if(input.action==='complete_episode')return authJson(await completeEpisode(user.userId,input.episodeId));
  if(input.action==='uncomplete_episode')return authJson(await uncompleteEpisode(user.userId,input.episodeId));
  if(input.action==='complete_chapter')return authJson(await completeChapter(user.userId,input.chapterId));
  return authJson(await uncompleteChapter(user.userId,input.chapterId));
 }catch(error){
  if(error instanceof z.ZodError)return authJson({error:'Invalid tracking update.',issues:error.issues},400);
  const status=Number((error as {status?:number})?.status);if(status>=400&&status<500)return authJson({error:(error as Error).message},status);
  console.error('Tracking update failed',error);return authJson({error:'Unable to update tracking.'},503);
 }
}

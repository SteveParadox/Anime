import {z} from 'zod';
import {authJson} from '@/lib/auth-request';
import {getMedia,listMedia} from '@/lib/media-service';

const mediaType=z.enum(['anime','manga']);
export async function GET(request:Request){
 try{
  const url=new URL(request.url),type=mediaType.parse(url.searchParams.get('type')||'anime'),id=url.searchParams.get('id');
  if(id){
   if(id.length>180)return authJson({error:'Invalid media ID.'},400);
   const media=await getMedia(type,id);
   return media?authJson(media):authJson({error:'Media not found.'},404);
  }
  const q=(url.searchParams.get('q')||'').slice(0,120),limit=Math.min(100,Math.max(1,Number(url.searchParams.get('limit')||24)||24)),offset=Math.max(0,Number(url.searchParams.get('offset')||0)||0);
  return authJson({mediaType:type,items:await listMedia(type,{query:q,limit,offset}),limit,offset});
 }catch(error){
  if(error instanceof z.ZodError)return authJson({error:'Invalid media type.'},400);
  console.error('Media catalogue load failed',error);return authJson({error:'Unable to load media catalogue.'},503);
 }
}

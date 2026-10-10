import {z} from 'zod';
import {database} from '@/db/raw';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';
import {getCurrentUser,isAdminUser} from '@/lib/auth';
import {syncProviderSearch} from '@/lib/media-service';

const schema=z.object({provider:z.enum(['anilist','jikan']),mediaType:z.enum(['anime','manga']),query:z.string().trim().min(2).max(120),limit:z.number().int().min(1).max(20).default(10)}).strict();

export async function GET(){
 const user=await getCurrentUser();if(!isAdminUser(user))return authJson({error:'Admin access required.'},403);
 const db=database(),runs=(await db.prepare('SELECT id,provider,mode,status,requested_by AS "requestedBy",query,started_at AS "startedAt",finished_at AS "finishedAt",imported_count AS "importedCount",updated_count AS "updatedCount",skipped_count AS "skippedCount",error_count AS "errorCount",detail FROM media_sync_runs ORDER BY started_at DESC LIMIT 50').all()).results;
 return authJson({runs});
}
export async function POST(request:Request){
 if(!sameOrigin(request))return authJson({error:'Cross-origin request rejected.'},403);
 const user=await getCurrentUser();if(!isAdminUser(user))return authJson({error:'Admin access required.'},403);
 try{return authJson(await syncProviderSearch({...schema.parse(await readJson(request,4_000)),requestedBy:user!.userId}),201);}
 catch(error){if(error instanceof z.ZodError)return authJson({error:'Invalid synchronization request.',issues:error.issues},400);console.error('Media sync failed',error);return authJson({error:'Media synchronization failed.'},503);}
}

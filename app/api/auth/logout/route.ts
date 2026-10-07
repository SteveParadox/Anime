import {destroyCurrentSession} from '@/lib/auth';
import {authJson,sameOrigin} from '@/lib/auth-request';
export async function POST(request:Request){
 if(!sameOrigin(request))return authJson({error:'Invalid origin.'},403);
 await destroyCurrentSession();
 return authJson({ok:true});
}

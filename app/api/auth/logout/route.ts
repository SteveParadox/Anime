import {destroyCurrentSession,hasHostedPlatformIdentity} from '@/lib/auth';
import {authJson,sameOrigin} from '@/lib/auth-request';

export async function POST(request:Request){
 if(!sameOrigin(request))return authJson({error:'Invalid origin.'},403);
 const hosted=await hasHostedPlatformIdentity();
 await destroyCurrentSession();
 return authJson({ok:true,redirectTo:hosted?'/signout-with-chatgpt?return_to=%2F':'/'});
}

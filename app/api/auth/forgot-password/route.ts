import {z} from 'zod';
import {database} from '@/db/raw';
import {normalizeEmail} from '@/lib/auth-crypto';
import {enforceAuthRateLimits} from '@/lib/auth-rate-limit';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';
import {appBaseUrl,createPasswordResetToken,RESET_TTL_MINUTES} from '@/lib/auth-tokens';
import {sendPasswordResetEmail} from '@/lib/email';

const input=z.object({email:z.string().email().max(320)}).strict();
const publicMessage='If an account exists for that email, a password reset link has been sent.';

export async function POST(request:Request){
 try{
  if(!sameOrigin(request))return authJson({error:'Invalid origin.'},403);
  const parsed=input.safeParse(await readJson(request));
  if(!parsed.success)return authJson({ok:true,message:publicMessage});
  const email=normalizeEmail(parsed.data.email),limit=await enforceAuthRateLimits(request,'forgot-password',email,{ipLimit:10,identityLimit:4,windowMs:30*60_000});
  if(!limit.allowed)return authJson({ok:true,message:publicMessage});
  const row=await database().prepare(`SELECT u.id FROM users u JOIN auth_identities i ON i.user_id=u.id AND i.provider='email' WHERE u.email_normalized=? LIMIT 1`).bind(email).first<any>();
  if(row){
   const token=await createPasswordResetToken(row.id);
   await sendPasswordResetEmail(email,`${appBaseUrl(request)}/reset-password?token=${encodeURIComponent(token.raw)}`,RESET_TTL_MINUTES);
  }
  return authJson({ok:true,message:publicMessage});
 }catch(e:any){console.error('Forgot-password failed',{name:e?.name});return authJson({ok:true,message:publicMessage})}
}

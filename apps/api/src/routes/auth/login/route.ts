import {z} from 'zod';
import {database} from '@/db/raw';
import {createSession} from '@/lib/auth';
import {normalizeEmail,verifyPassword} from '@anime/domain/auth-crypto';
import {enforceAuthRateLimits} from '@/lib/auth-rate-limit';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';

const input=z.object({email:z.string().email().max(320),password:z.string().max(128)}).strict();
const DUMMY_PASSWORD_HASH='pbkdf2_sha256$310000$YW5pbWUtY2xhc2gtZHVtbXk$Hu2VatOJqVx4YYyE_tkctynOpHdr_eYAKuVlg20hGTA';

export async function POST(request:Request){
 try{
  if(!sameOrigin(request))return authJson({error:'Invalid origin.'},403);
  const parsed=input.safeParse(await readJson(request));
  if(!parsed.success)return authJson({error:'Invalid email or password.'},401);
  const email=normalizeEmail(parsed.data.email);
  const limit=await enforceAuthRateLimits(request,'login',email,{ipLimit:18,identityLimit:10,windowMs:15*60_000,blockMs:15*60_000});
  if(!limit.allowed)return authJson({error:'Too many login attempts. Try again later.'},429,{'Retry-After':String(limit.retryAfterSeconds)});
  const row=await database().prepare(`SELECT i.user_id AS userId,i.credential_hash AS credentialHash,u.email_verified AS emailVerified,p.handle,p.display_name AS displayName FROM auth_identities i JOIN users u ON u.id=i.user_id LEFT JOIN profiles p ON p.user=u.id WHERE i.provider='email' AND i.provider_user_id=? LIMIT 1`).bind(email).first<any>();
  const passwordOk=await verifyPassword(parsed.data.password,row?.credentialHash||DUMMY_PASSWORD_HASH);
  if(!row||!row.credentialHash||!passwordOk)return authJson({error:'Invalid email or password.'},401);
  await createSession(row.userId);
  return authJson({ok:true,user:{id:row.userId,email,emailVerified:Boolean(row.emailVerified),username:row.handle||null,displayName:row.displayName||'Anime fan'},needsVerification:!row.emailVerified});
 }catch(e:any){console.error('Login failed',{name:e?.name});return authJson({error:'Could not sign in.'},e?.status||500)}
}

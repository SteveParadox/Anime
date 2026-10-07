import {z} from 'zod';
import {database} from '@/db/raw';
import {getCurrentUser} from '@/lib/auth';
import {hashPassword,normalizeEmail} from '@/lib/auth-crypto';
import {enforceAuthRateLimits} from '@/lib/auth-rate-limit';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';

const input=z.object({password:z.string().min(8).max(128)}).strict();

export async function POST(request:Request){
 if(!sameOrigin(request))return authJson({error:'Invalid origin.'},403);
 const user=await getCurrentUser();
 if(!user)return authJson({error:'Sign in first.'},401);
 if(!user.email||!user.emailVerified)return authJson({error:'A verified email is required before adding a password.'},403);
 const parsed=input.safeParse(await readJson(request));if(!parsed.success)return authJson({error:parsed.error.issues[0]?.message||'Invalid password.'},400);
 const limit=await enforceAuthRateLimits(request,'set-password',user.userId,{ipLimit:8,identityLimit:4,windowMs:30*60_000});
 if(!limit.allowed)return authJson({error:'Too many attempts. Try again later.'},429,{'Retry-After':String(limit.retryAfterSeconds)});
 const db=database(),email=normalizeEmail(user.email),existing=await db.prepare(`SELECT id,user_id AS userId FROM auth_identities WHERE provider='email' AND provider_user_id=? LIMIT 1`).bind(email).first<any>();
 if(existing&&existing.userId!==user.userId)return authJson({error:'That email is already associated with another account.'},409);
 if(existing)return authJson({error:'This account already has a password. Use password reset to change it.'},409);
 const credential=await hashPassword(parsed.data.password),now=Date.now();
 await db.prepare(`INSERT INTO auth_identities (id,user_id,provider,provider_user_id,provider_email,credential_hash,created) VALUES (?,?, 'email',?,?,?,?)`).bind(crypto.randomUUID(),user.userId,email,email,credential,now).run();
 return authJson({ok:true});
}

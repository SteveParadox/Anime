import {z} from 'zod';
import {database} from '@/db/raw';
import {createSession} from '@/lib/auth';
import {hashOpaqueToken,hashPassword,normalizeEmail,normalizeUsername,randomToken,validUsername,userId} from '@/lib/auth-crypto';
import {enforceAuthRateLimits} from '@/lib/auth-rate-limit';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';
import {appBaseUrl,VERIFY_TTL_MINUTES} from '@/lib/auth-tokens';
import {sendVerificationEmail} from '@/lib/email';

const input=z.object({email:z.string().email().max(320),password:z.string().min(8).max(128),username:z.string().min(3).max(24),displayName:z.string().trim().min(1).max(120)}).strict();

export async function POST(request:Request){
 try{
  if(!sameOrigin(request))return authJson({error:'Invalid origin.'},403);
  const raw=await readJson(request),parsed=input.safeParse(raw);
  if(!parsed.success)return authJson({error:parsed.error.issues[0]?.message||'Check the registration fields.'},400);
  const email=normalizeEmail(parsed.data.email),username=normalizeUsername(parsed.data.username);
  if(!validUsername(username))return authJson({error:'Username must be 3–24 characters using lowercase letters, numbers, or underscores.'},400);
  const limit=await enforceAuthRateLimits(request,'register',email,{ipLimit:8,identityLimit:4,windowMs:30*60_000});
  if(!limit.allowed)return authJson({error:'Too many registration attempts. Try again later.'},429,{'Retry-After':String(limit.retryAfterSeconds)});
  const db=database();
  if(await db.prepare('SELECT 1 FROM users WHERE email_normalized=?').bind(email).first())return authJson({error:'An account with this email already exists.'},409);
  if(await db.prepare('SELECT 1 FROM profiles WHERE handle=?').bind(username).first())return authJson({error:'That username is already taken.'},409);
  const id=userId(),now=Date.now(),credential=await hashPassword(parsed.data.password);
  const verificationRaw=randomToken(32),verificationHash=await hashOpaqueToken(verificationRaw),verificationExpires=now+VERIFY_TTL_MINUTES*60_000;
  try{
   await db.batch([
    db.prepare('INSERT INTO users (id,email,email_normalized,email_verified,profile_completed,created,updated) VALUES (?,?,?,0,1,?,?)').bind(id,email,email,now,now),
    db.prepare(`INSERT INTO auth_identities (id,user_id,provider,provider_user_id,provider_email,credential_hash,created) VALUES (?,?, 'email',?,?,?,?)`).bind(crypto.randomUUID(),id,email,email,credential,now),
    db.prepare('INSERT INTO profiles (user,handle,display_name,avatar_url,bio,favorite_anime,favorite_characters,created,updated) VALUES (?,?,?,?,\'\',\'[]\',\'[]\',?,?)').bind(id,username,parsed.data.displayName.trim(),null,now,now),
    db.prepare('INSERT INTO email_verification_tokens (id,user_id,token_hash,created,expires,used) VALUES (?,?,?,?,?,0)').bind(crypto.randomUUID(),id,verificationHash,now,verificationExpires)
   ]);
  }catch(e){console.error('Registration transaction failed',{name:(e as Error).name});return authJson({error:'Could not create the account. The email or username may already be in use.'},409)}
  await createSession(id);
  const url=`${appBaseUrl(request)}/verify-email?token=${encodeURIComponent(verificationRaw)}`;
  const delivery=await sendVerificationEmail(email,url,VERIFY_TTL_MINUTES);
  return authJson({ok:true,user:{id,email,emailVerified:false,username,displayName:parsed.data.displayName.trim()},verificationEmailSent:delivery.sent},201);
 }catch(e:any){console.error('Registration failed',{name:e?.name});return authJson({error:e?.status===413?'Request body is too large.':'Could not create the account.'},e?.status||500)}
}

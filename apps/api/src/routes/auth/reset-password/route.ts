import {z} from 'zod';
import {database} from '@/db/raw';
import {createSession} from '@/lib/auth';
import {hashOpaqueToken,hashPassword} from '@anime/domain/auth-crypto';
import {enforceAuthRateLimits} from '@/lib/auth-rate-limit';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';

const input=z.object({token:z.string().min(20).max(300),password:z.string().min(8).max(128)}).strict();

export async function POST(request:Request){
 try{
  if(!sameOrigin(request))return authJson({error:'Invalid origin.'},403);
  const parsed=input.safeParse(await readJson(request));
  if(!parsed.success)return authJson({error:parsed.error.issues[0]?.message||'Invalid reset request.'},400);
  const limit=await enforceAuthRateLimits(request,'reset-password',undefined,{ipLimit:12,windowMs:30*60_000});
  if(!limit.allowed)return authJson({error:'Too many reset attempts. Try again later.'},429,{'Retry-After':String(limit.retryAfterSeconds)});
  const db=database(),now=Date.now(),tokenHash=await hashOpaqueToken(parsed.data.token);
  const row=await db.prepare(`SELECT t.id,t.user_id AS userId,i.id AS identityId,
    u.email_normalized AS accountEmail,u.email_verified AS emailVerified,
    EXISTS (SELECT 1 FROM auth_identities trusted WHERE trusted.user_id=u.id AND trusted.provider IN ('google','chatgpt')) AS trustedIdentity
   FROM password_reset_tokens t JOIN users u ON u.id=t.user_id
   LEFT JOIN auth_identities i ON i.user_id=t.user_id AND i.provider='email'
   WHERE t.token_hash=? AND t.used=0 AND t.expires>? LIMIT 1`).bind(tokenHash,now).first<any>();
  if(!row||(!row.identityId&&(!row.accountEmail||!Boolean(row.emailVerified)||!Boolean(row.trustedIdentity))))
   return authJson({error:'This password reset link is invalid or has expired.'},400);
  const credential=await hashPassword(parsed.data.password),consumeNow=Date.now();
  const consumed=await db.transaction(async tx=>{
   const claim=await tx.prepare('UPDATE password_reset_tokens SET used=1 WHERE id=? AND used=0 AND expires>?').bind(row.id,consumeNow).run();
   if(!claim.success||Number(claim.meta.changes||0)!==1)return false;
   await tx.batch([
    ...(row.identityId
     ?[tx.prepare('UPDATE auth_identities SET credential_hash=? WHERE id=?').bind(credential,row.identityId)]
     :[tx.prepare(`INSERT INTO auth_identities (id,user_id,provider,provider_user_id,provider_email,credential_hash,created)
        VALUES (?,?,'email',?,?,?,?)`).bind(crypto.randomUUID(),row.userId,row.accountEmail,row.accountEmail,credential,consumeNow)]),
    tx.prepare('UPDATE password_reset_tokens SET used=1 WHERE user_id=?').bind(row.userId),
    tx.prepare('UPDATE email_verification_tokens SET used=1 WHERE user_id=?').bind(row.userId),
    tx.prepare('UPDATE users SET email_verified=1,updated=? WHERE id=?').bind(consumeNow,row.userId),
    tx.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(row.userId)
   ]);
   return true;
  });
  if(!consumed)return authJson({error:'This password reset link is invalid or has expired.'},400);
  await createSession(row.userId);
  return authJson({ok:true});
 }catch(e:any){console.error('Password reset failed',{name:e?.name});return authJson({error:e?.status===413?'Request body is too large.':'Could not reset the password.'},e?.status||500)}
}

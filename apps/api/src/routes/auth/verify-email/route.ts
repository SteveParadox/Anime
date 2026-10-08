import {database} from '@/db/raw';
import {hashOpaqueToken} from '@anime/domain/auth-crypto';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';
import {enforceAuthRateLimits} from '@/lib/auth-rate-limit';

async function lookup(token:string){
 const hash=await hashOpaqueToken(token),now=Date.now();
 return database().prepare(`SELECT t.id,t.user_id AS userId,t.used,t.expires,u.email_verified AS emailVerified FROM email_verification_tokens t JOIN users u ON u.id=t.user_id WHERE t.token_hash=? LIMIT 1`).bind(hash).first<any>().then(row=>({row,now}));
}

export async function GET(request:Request){
 const token=new URL(request.url).searchParams.get('token')||'';
 if(token.length<20)return authJson({valid:false});
 const {row,now}=await lookup(token);
 if(!row)return authJson({valid:false});
 return authJson({valid:!row.used&&Number(row.expires)>now&&!row.emailVerified,alreadyVerified:Boolean(row.emailVerified),used:Boolean(row.used),expired:Number(row.expires)<=now});
}

export async function POST(request:Request){
 try{
  if(!sameOrigin(request))return authJson({error:'Invalid origin.'},403);
  const body=await readJson(request),token=typeof body?.token==='string'?body.token:'';
  if(token.length<20)return authJson({error:'Invalid verification link.'},400);
  const limit=await enforceAuthRateLimits(request,'verify-email',undefined,{ipLimit:30,windowMs:15*60_000});
  if(!limit.allowed)return authJson({error:'Too many verification attempts. Try again later.'},429,{'Retry-After':String(limit.retryAfterSeconds)});
  const {row,now}=await lookup(token);
  if(!row)return authJson({error:'Invalid verification link.'},400);
  if(row.emailVerified)return authJson({ok:true,alreadyVerified:true});
  if(row.used)return authJson({error:'This verification link has already been used.'},400);
  if(Number(row.expires)<=now)return authJson({error:'This verification link has expired.'},400);
  const db=database(),consumeNow=Date.now();
  const consumed=await db.transaction(async tx=>{
   const claim=await tx.prepare('UPDATE email_verification_tokens SET used=1 WHERE id=? AND used=0 AND expires>?').bind(row.id,consumeNow).run();
   if(!claim.success||Number(claim.meta.changes||0)!==1)return false;
   await tx.batch([
    tx.prepare('UPDATE users SET email_verified=1,updated=? WHERE id=?').bind(consumeNow,row.userId),
    tx.prepare('UPDATE email_verification_tokens SET used=1 WHERE user_id=?').bind(row.userId)
   ]);
   return true;
  });
  if(!consumed)return authJson({error:'This verification link is invalid or has expired.'},400);
  return authJson({ok:true});
 }catch(e:any){console.error('Email verification failed',{name:e?.name});return authJson({error:'Could not verify the email.'},e?.status||500)}
}

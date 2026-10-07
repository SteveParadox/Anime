import {env} from 'cloudflare:workers';
import {database} from '@/db/raw';
import {hashOpaqueToken,randomToken} from '@/lib/auth-crypto';

export const VERIFY_TTL_MINUTES=60;
export const RESET_TTL_MINUTES=45;

export function appBaseUrl(request:Request){
 return String(env.APP_BASE_URL||new URL(request.url).origin).replace(/\/$/,'');
}

export async function createVerificationToken(userId:string){
 const db=database(),raw=randomToken(32),hash=await hashOpaqueToken(raw),now=Date.now(),expires=now+VERIFY_TTL_MINUTES*60_000;
 await db.batch([
  db.prepare('UPDATE email_verification_tokens SET used=1 WHERE user_id=? AND used=0').bind(userId),
  db.prepare('INSERT INTO email_verification_tokens (id,user_id,token_hash,created,expires,used) VALUES (?,?,?,?,?,0)').bind(crypto.randomUUID(),userId,hash,now,expires)
 ]);
 return {raw,expires};
}

export async function createPasswordResetToken(userId:string){
 const db=database(),raw=randomToken(32),hash=await hashOpaqueToken(raw),now=Date.now(),expires=now+RESET_TTL_MINUTES*60_000;
 await db.batch([
  db.prepare('UPDATE password_reset_tokens SET used=1 WHERE user_id=? AND used=0').bind(userId),
  db.prepare('INSERT INTO password_reset_tokens (id,user_id,token_hash,created,expires,used) VALUES (?,?,?,?,?,0)').bind(crypto.randomUUID(),userId,hash,now,expires)
 ]);
 return {raw,expires};
}

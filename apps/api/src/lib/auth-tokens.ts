import {env} from '@/config/env';
import {database} from '@/db/raw';
import {hashOpaqueToken,randomToken} from '@anime/domain/auth-crypto';

export const VERIFY_TTL_MINUTES=60;
export const RESET_TTL_MINUTES=45;

export function appBaseUrl(request:Request){
 if(env.NODE_ENV!=='development'&&!env.APP_BASE_URL)throw new Error('APP_BASE_URL is required in production.');
 const candidate=String(env.APP_BASE_URL||new URL(request.url).origin).trim();
 let url:URL;
 try{url=new URL(candidate)}catch{throw new Error('APP_BASE_URL must be a valid absolute URL.')}
 if(url.username||url.password||url.search||url.hash)throw new Error('APP_BASE_URL must be an origin without credentials, query, or fragment.');
 if(env.NODE_ENV!=='development'&&url.protocol!=='https:')throw new Error('APP_BASE_URL must use HTTPS in production.');
 if(!['http:','https:'].includes(url.protocol))throw new Error('APP_BASE_URL must use HTTP or HTTPS.');
 return url.origin;
}

export async function createVerificationToken(userId:string){
 const db=database(),raw=randomToken(32),hash=await hashOpaqueToken(raw),now=Date.now(),expires=now+VERIFY_TTL_MINUTES*60_000;
 await db.batch([
  db.prepare('DELETE FROM email_verification_tokens WHERE expires<=?').bind(now),
  db.prepare('INSERT INTO email_verification_tokens (id,user_id,token_hash,created,expires,used) VALUES (?,?,?,?,?,0)').bind(crypto.randomUUID(),userId,hash,now,expires)
 ]);
 return {raw,expires};
}

export async function createPasswordResetToken(userId:string){
 const db=database(),raw=randomToken(32),hash=await hashOpaqueToken(raw),now=Date.now(),expires=now+RESET_TTL_MINUTES*60_000;
 await db.batch([
  db.prepare('DELETE FROM password_reset_tokens WHERE expires<=?').bind(now),
  db.prepare('INSERT INTO password_reset_tokens (id,user_id,token_hash,created,expires,used) VALUES (?,?,?,?,?,0)').bind(crypto.randomUUID(),userId,hash,now,expires)
 ]);
 return {raw,expires};
}

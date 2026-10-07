import {cookies,headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {env} from 'cloudflare:workers';
import {database} from '@/db/raw';
import {hashOpaqueToken,normalizeEmail,normalizeUsername,randomToken,safeRelativeReturnPath,userId} from '@/lib/auth-crypto';

export type AuthProvider='email'|'google'|'chatgpt';
export type UserAccount={id:string;email:string|null;emailVerified:boolean;profileCompleted:boolean;createdAt:number;updatedAt:number};
export type AuthIdentity={id:string;userId:string;provider:AuthProvider;providerUserId:string;providerEmail:string|null;createdAt:number};
export type CurrentUser={
 userId:string;
 id:string;
 email:string|null;
 emailVerified:boolean;
 profileCompleted:boolean;
 provider:AuthProvider;
 providerUserId:string;
 displayName:string;
 username:string|null;
 avatarUrl:string|null;
 createdAt:number;
};
type PlatformIdentity={provider:'chatgpt';providerUserId:string;email:string;displayName:string};

export const SESSION_COOKIE='anime_clash_session';
const SESSION_TTL_MS=30*24*60*60_000;

function sessionCookieOptions(expires:Date){
 return {httpOnly:true,secure:env.ENVIRONMENT==='production',sameSite:'lax' as const,path:'/',expires};
}

function decodeHeaderName(value:string|null,encoding:string|null){
 if(!value)return null;
 if(encoding!=='percent-encoded-utf-8')return value;
 try{return decodeURIComponent(value)}catch{return null}
}

async function platformIdentity():Promise<PlatformIdentity|null>{
 const h=await headers();
 const providerUserId=h.get('oai-authenticated-user-id'),email=h.get('oai-authenticated-user-email');
 if(!providerUserId||!email)return null;
 const fullName=decodeHeaderName(h.get('oai-authenticated-user-full-name'),h.get('oai-authenticated-user-full-name-encoding'));
 return {provider:'chatgpt',providerUserId,email:normalizeEmail(email),displayName:fullName?.trim()||email};
}

async function uniqueUsername(db:D1Database,suggested?:string|null){
 const base=normalizeUsername((suggested||'animefan').replace(/[^a-zA-Z0-9_]+/g,'_')).replace(/^_+|_+$/g,'').slice(0,18);
 const safe=/^[a-z0-9_]{3,24}$/.test(base)?base:'animefan';
 for(let i=0;i<8;i++){
  const suffix=randomToken(4).replace(/[^a-zA-Z0-9]/g,'').toLowerCase().slice(0,6)||crypto.randomUUID().slice(0,6);
  const candidate=`${safe.slice(0,Math.max(3,23-suffix.length))}_${suffix}`.slice(0,24);
  if(!await db.prepare('SELECT 1 FROM profiles WHERE handle=?').bind(candidate).first())return candidate;
 }
 return `animefan_${crypto.randomUUID().replace(/-/g,'').slice(0,10)}`.slice(0,24);
}

async function readCurrentUser(userIdValue:string,provider:AuthProvider,providerUserId:string):Promise<CurrentUser|null>{
 const db=database();
 const row=await db.prepare(`SELECT u.id,u.email,u.email_verified AS emailVerified,u.profile_completed AS profileCompleted,u.created,u.updated,p.handle,p.display_name AS displayName,p.avatar_url AS avatarUrl FROM users u LEFT JOIN profiles p ON p.user=u.id WHERE u.id=? LIMIT 1`).bind(userIdValue).first<any>();
 if(!row)return null;
 return {
  userId:row.id,id:row.id,email:row.email||null,emailVerified:Boolean(row.emailVerified),profileCompleted:Boolean(row.profileCompleted),
  provider,providerUserId,displayName:row.displayName||row.handle||row.email||'Anime fan',username:row.handle||null,avatarUrl:row.avatarUrl||null,createdAt:Number(row.created)
 };
}

async function fromSession():Promise<CurrentUser|null>{
 const jar=await cookies(),token=jar.get(SESSION_COOKIE)?.value;
 if(!token)return null;
 const tokenHash=await hashOpaqueToken(token),db=database(),now=Date.now();
 const row=await db.prepare(`SELECT s.user_id AS userId,s.last_used AS lastUsed,i.provider,i.provider_user_id AS providerUserId FROM auth_sessions s LEFT JOIN auth_identities i ON i.user_id=s.user_id WHERE s.token_hash=? AND s.expires>? ORDER BY CASE i.provider WHEN 'email' THEN 0 WHEN 'google' THEN 1 ELSE 2 END LIMIT 1`).bind(tokenHash,now).first<any>();
 if(!row){jar.delete(SESSION_COOKIE);return null}
 if(!row.provider)return null;
 if(now-Number(row.lastUsed||0)>15*60_000)void db.prepare('UPDATE auth_sessions SET last_used=? WHERE token_hash=?').bind(now,tokenHash).run();
 return readCurrentUser(row.userId,row.provider as AuthProvider,row.providerUserId||'');
}

async function resolvePlatform(identity:PlatformIdentity):Promise<CurrentUser>{
 const db=database(),now=Date.now();
 let linked=await db.prepare(`SELECT user_id AS userId FROM auth_identities WHERE provider='chatgpt' AND provider_user_id=? LIMIT 1`).bind(identity.providerUserId).first<any>();
 if(linked){
  const account=await db.prepare('SELECT email_normalized AS emailNormalized FROM users WHERE id=?').bind(linked.userId).first<any>();
  if(account&&!account.emailNormalized){
   const owner=await db.prepare('SELECT id FROM users WHERE email_normalized=?').bind(identity.email).first<any>();
   if(!owner)await db.prepare('UPDATE users SET email=?,email_normalized=?,email_verified=1,updated=? WHERE id=?').bind(identity.email,identity.email,now,linked.userId).run();
  }
  const current=await readCurrentUser(linked.userId,'chatgpt',identity.providerUserId);
  if(current)return current;
 }
 const emailOwner=await db.prepare('SELECT id FROM users WHERE email_normalized=?').bind(identity.email).first<any>();
 if(emailOwner){
  await db.prepare(`INSERT OR IGNORE INTO auth_identities (id,user_id,provider,provider_user_id,provider_email,credential_hash,created) VALUES (?,?, 'chatgpt',?,?,NULL,?)`).bind(crypto.randomUUID(),emailOwner.id,identity.providerUserId,identity.email,now).run();
  const current=await readCurrentUser(emailOwner.id,'chatgpt',identity.providerUserId);
  if(current)return current;
 }
 const id=userId(),handle=await uniqueUsername(db,identity.displayName);
 await db.batch([
  db.prepare('INSERT INTO users (id,email,email_normalized,email_verified,profile_completed,created,updated) VALUES (?,?,?,1,0,?,?)').bind(id,identity.email,identity.email,now,now),
  db.prepare(`INSERT INTO auth_identities (id,user_id,provider,provider_user_id,provider_email,credential_hash,created) VALUES (?,?, 'chatgpt',?,?,NULL,?)`).bind(crypto.randomUUID(),id,identity.providerUserId,identity.email,now),
  db.prepare('INSERT INTO profiles (user,handle,display_name,avatar_url,bio,favorite_anime,favorite_characters,created,updated) VALUES (?,?,?,?,\'\',\'[]\',\'[]\',?,?)').bind(id,handle,identity.displayName,null,now,now)
 ]);
 const current=await readCurrentUser(id,'chatgpt',identity.providerUserId);
 if(!current)throw new Error('Could not resolve account.');
 return current;
}

export async function getCurrentUser():Promise<CurrentUser|null>{
 const session=await fromSession();
 if(session)return session;
 const platform=await platformIdentity();
 if(platform)return resolvePlatform(platform);
 return null;
}

export async function requireCurrentUser(returnTo='/'):Promise<CurrentUser>{
 const user=await getCurrentUser();
 if(user)return user;
 redirect(`/auth?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`);
}

export async function createSession(userIdValue:string){
 const db=database(),token=randomToken(32),tokenHash=await hashOpaqueToken(token),now=Date.now(),expires=now+SESSION_TTL_MS;
 await db.prepare('INSERT INTO auth_sessions (id,user_id,token_hash,created,expires,last_used) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),userIdValue,tokenHash,now,expires,now).run();
 const jar=await cookies();
 jar.set(SESSION_COOKIE,token,sessionCookieOptions(new Date(expires)));
 return token;
}

export async function destroyCurrentSession(){
 const jar=await cookies(),token=jar.get(SESSION_COOKIE)?.value;
 if(token){const hash=await hashOpaqueToken(token);await database().prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(hash).run();}
 jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userIdValue:string){
 await database().prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(userIdValue).run();
 const jar=await cookies();jar.delete(SESSION_COOKIE);
}

export function canContribute(user:CurrentUser|null|undefined){
 return Boolean(user&&user.profileCompleted&&(user.provider==='chatgpt'||user.provider==='google'||user.emailVerified));
}

export function isAdminUser(user:CurrentUser|null|undefined){
 if(!user)return false;
 if(env.ANIME_CLASH_ADMIN_USER_ID&&user.userId===env.ANIME_CLASH_ADMIN_USER_ID)return true;
 return Boolean(env.ANIME_CLASH_ADMIN_ID&&user.provider==='chatgpt'&&user.providerUserId===env.ANIME_CLASH_ADMIN_ID);
}

export async function publicAuthState(){
 const user=await getCurrentUser();
 if(!user)return {authenticated:false,user:null};
 return {authenticated:true,user:{id:user.userId,email:user.email,emailVerified:user.emailVerified,username:user.username,displayName:user.displayName,avatarUrl:user.avatarUrl,profileCompleted:user.profileCompleted,provider:user.provider}};
}

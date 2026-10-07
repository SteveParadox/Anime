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
 legacyChatgptUserId:string|null;
 displayName:string;
 username:string|null;
 avatarUrl:string|null;
 createdAt:number;
};
type PlatformIdentity={provider:'chatgpt';providerUserId:string;email:string;displayName:string};

export const SESSION_COOKIE='anime_clash_session';
const SESSION_TTL_MS=30*24*60*60_000;

function sessionCookieOptions(expires:Date){
 return {httpOnly:true,secure:env.ENVIRONMENT!=='development',sameSite:'lax' as const,path:'/',expires};
}

function decodeHeaderName(value:string|null,encoding:string|null){
 if(!value)return null;
 if(encoding!=='percent-encoded-utf-8')return value;
 try{return decodeURIComponent(value)}catch{return null}
}

function localHost(host:string|null){
 const value=(host||'').split(':')[0].replace(/^\[|\]$/g,'').toLowerCase();
 return value==='localhost'||value==='127.0.0.1'||value==='::1';
}

export async function hostedPlatformHeadersTrusted(){
 const h=await headers();
 return env.AUTH_TRUST_HOSTED_IDENTITY_HEADERS==='true'||(env.ENVIRONMENT==='development'&&localHost(h.get('host')));
}

async function platformIdentity():Promise<PlatformIdentity|null>{
 if(!await hostedPlatformHeadersTrusted())return null;
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
 const row=await db.prepare(`SELECT u.id,u.email,u.email_verified AS emailVerified,u.profile_completed AS profileCompleted,u.created,u.updated,p.handle,p.display_name AS displayName,p.avatar_url AS avatarUrl,(SELECT ai.provider_user_id FROM auth_identities ai WHERE ai.user_id=u.id AND ai.provider='chatgpt' LIMIT 1) AS legacyChatgptUserId FROM users u LEFT JOIN profiles p ON p.user=u.id WHERE u.id=? LIMIT 1`).bind(userIdValue).first<any>();
 if(!row)return null;
 return {
  userId:row.id,id:row.id,email:row.email||null,emailVerified:Boolean(row.emailVerified),profileCompleted:Boolean(row.profileCompleted),
  provider,providerUserId,legacyChatgptUserId:row.legacyChatgptUserId||null,displayName:row.displayName||row.handle||row.email||'Anime fan',username:row.handle||null,avatarUrl:row.avatarUrl||null,createdAt:Number(row.created)
 };
}

async function mergeTrustedDuplicateIntoLegacy(db:D1Database,sourceUserId:string,targetUserId:string,email:string){
 if(sourceUserId===targetUserId)return targetUserId;
 const [sourceAccount,targetAccount,targetProfile,sourceProfile]=await Promise.all([
  db.prepare('SELECT profile_completed AS profileCompleted,email_verified AS emailVerified FROM users WHERE id=?').bind(sourceUserId).first<any>(),
  db.prepare('SELECT profile_completed AS profileCompleted FROM users WHERE id=?').bind(targetUserId).first<any>(),
  db.prepare('SELECT user,avatar_url AS avatarUrl FROM profiles WHERE user=?').bind(targetUserId).first<any>(),
  db.prepare('SELECT user,avatar_url AS avatarUrl FROM profiles WHERE user=?').bind(sourceUserId).first<any>()
 ]);
 if(!sourceAccount||!targetAccount)throw new Error('Duplicate account source or target is missing.');
 const sourceTrusted=Boolean(sourceAccount.emailVerified);

 const statements:D1PreparedStatement[]=[
  // Remove composite-key collisions before transferring source ownership.
  db.prepare('DELETE FROM votes WHERE user=? AND EXISTS (SELECT 1 FROM votes t WHERE t.user=? AND t.battle=votes.battle)').bind(sourceUserId,targetUserId),
  db.prepare('DELETE FROM progress WHERE user=? AND EXISTS (SELECT 1 FROM progress t WHERE t.user=? AND t.club=progress.club)').bind(sourceUserId,targetUserId),
  db.prepare('DELETE FROM reactions WHERE user=? AND EXISTS (SELECT 1 FROM reactions t WHERE t.user=? AND t.subject_type=reactions.subject_type AND t.subject_id=reactions.subject_id)').bind(sourceUserId,targetUserId),
  db.prepare('DELETE FROM challenge_votes WHERE user=? AND EXISTS (SELECT 1 FROM challenge_votes t WHERE t.user=? AND t.challenge=challenge_votes.challenge)').bind(sourceUserId,targetUserId),
  db.prepare('DELETE FROM watchlist WHERE user=? AND EXISTS (SELECT 1 FROM watchlist t WHERE t.user=? AND t.anime=watchlist.anime)').bind(sourceUserId,targetUserId),
  db.prepare('DELETE FROM tournament_votes WHERE user=? AND EXISTS (SELECT 1 FROM tournament_votes t WHERE t.user=? AND t.week=tournament_votes.week AND t.match=tournament_votes.match)').bind(sourceUserId,targetUserId),
  db.prepare('DELETE FROM argument_evidence_links WHERE argument_user=? AND EXISTS (SELECT 1 FROM argument_evidence_links t WHERE t.argument_user=? AND t.battle=argument_evidence_links.battle AND t.evidence_id=argument_evidence_links.evidence_id)').bind(sourceUserId,targetUserId),

  db.prepare('UPDATE battles SET owner=? WHERE owner=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE votes SET user=? WHERE user=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE argument_evidence SET argument_user=? WHERE argument_user=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE argument_evidence SET contributor=? WHERE contributor=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE progress SET user=? WHERE user=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE posts SET user=? WHERE user=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE squads SET owner=? WHERE owner=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE comments SET argument_user=? WHERE argument_user=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE comments SET user=? WHERE user=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE reactions SET user=? WHERE user=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE squad_challenges SET challenger=? WHERE challenger=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE challenge_votes SET user=? WHERE user=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE notifications SET user=? WHERE user=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE reports SET reporter=? WHERE reporter=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE watchlist SET user=? WHERE user=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE tournament_votes SET user=? WHERE user=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE evidence_records SET submitted_by=? WHERE submitted_by=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE argument_evidence_links SET argument_user=? WHERE argument_user=?').bind(targetUserId,sourceUserId),
  db.prepare('UPDATE argument_evidence_links SET linked_by=? WHERE linked_by=?').bind(targetUserId,sourceUserId),

  db.prepare('DELETE FROM email_verification_tokens WHERE user_id=?').bind(sourceUserId),

  // Release the normalized email before assigning it to the legacy account.
  db.prepare('UPDATE users SET email=NULL,email_normalized=NULL,updated=? WHERE id=?').bind(Date.now(),sourceUserId),
  db.prepare('UPDATE users SET email=?,email_normalized=?,email_verified=1,profile_completed=CASE WHEN profile_completed=1 OR ?=1 THEN 1 ELSE 0 END,updated=? WHERE id=?').bind(email,email,sourceTrusted&&sourceAccount.profileCompleted?1:0,Date.now(),targetUserId)
 ];

 if(sourceTrusted){
  statements.push(
   db.prepare('UPDATE auth_identities SET user_id=? WHERE user_id=?').bind(targetUserId,sourceUserId),
   db.prepare('UPDATE auth_sessions SET user_id=? WHERE user_id=?').bind(targetUserId,sourceUserId),
   db.prepare('UPDATE password_reset_tokens SET user_id=? WHERE user_id=?').bind(targetUserId,sourceUserId)
  );
 }else{
  statements.push(
   db.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(sourceUserId),
   db.prepare('DELETE FROM password_reset_tokens WHERE user_id=?').bind(sourceUserId),
   db.prepare('DELETE FROM auth_identities WHERE user_id=?').bind(sourceUserId)
  );
 }

 if(targetProfile&&sourceProfile){
  if(sourceTrusted&&sourceAccount.profileCompleted&&!targetAccount.profileCompleted){
   statements.push(
    db.prepare('DELETE FROM profiles WHERE user=?').bind(targetUserId),
    db.prepare('UPDATE profiles SET user=?,updated=? WHERE user=?').bind(targetUserId,Date.now(),sourceUserId)
   );
  }else{
   if(sourceTrusted&&!targetProfile.avatarUrl&&sourceProfile.avatarUrl)statements.push(db.prepare('UPDATE profiles SET avatar_url=?,updated=? WHERE user=?').bind(sourceProfile.avatarUrl,Date.now(),targetUserId));
   statements.push(db.prepare('DELETE FROM profiles WHERE user=?').bind(sourceUserId));
  }
 }else if(!targetProfile&&sourceProfile){
  if(sourceTrusted)statements.push(db.prepare('UPDATE profiles SET user=?,updated=? WHERE user=?').bind(targetUserId,Date.now(),sourceUserId));
  else statements.push(db.prepare('DELETE FROM profiles WHERE user=?').bind(sourceUserId));
 }
 statements.push(db.prepare('DELETE FROM users WHERE id=?').bind(sourceUserId));
 await db.batch(statements);
 return targetUserId;
}

export async function revokeUnverifiedEmailCredentialAccess(db:D1Database,userIdValue:string){
 const account=await db.prepare('SELECT email_verified AS emailVerified FROM users WHERE id=?').bind(userIdValue).first<{emailVerified:number}>();
 if(!account||Boolean(account.emailVerified))return false;
 await db.batch([
  db.prepare("DELETE FROM auth_identities WHERE user_id=? AND provider='email'").bind(userIdValue),
  db.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(userIdValue),
  db.prepare('DELETE FROM password_reset_tokens WHERE user_id=?').bind(userIdValue),
  db.prepare('UPDATE email_verification_tokens SET used=1 WHERE user_id=? AND used=0').bind(userIdValue),
  db.prepare('UPDATE users SET profile_completed=0,updated=? WHERE id=?').bind(Date.now(),userIdValue)
 ]);
 return true;
}


export async function reconcileTrustedProviderEmail(db:D1Database,userIdValue:string,rawEmail:string){
 const email=normalizeEmail(rawEmail),account=await db.prepare(`SELECT u.email_normalized AS emailNormalized,u.email_verified AS emailVerified,EXISTS(SELECT 1 FROM auth_identities ai WHERE ai.user_id=u.id AND ai.provider='email') AS hasEmailIdentity FROM users u WHERE u.id=?`).bind(userIdValue).first<any>();
 if(!account)throw new Error('Trusted provider account is missing.');
 if(account.emailNormalized===email){
  if(!Boolean(account.emailVerified)){
   if(Boolean(account.hasEmailIdentity))await revokeUnverifiedEmailCredentialAccess(db,userIdValue);
   await db.prepare('UPDATE users SET email_verified=1,updated=? WHERE id=?').bind(Date.now(),userIdValue).run();
  }
  return userIdValue;
 }
 // A separately configured password identity is an independent recovery method.
 // Do not silently rewrite its account email merely because an external provider changed email.
 if(Boolean(account.hasEmailIdentity))return userIdValue;
 const owner=await db.prepare('SELECT id FROM users WHERE email_normalized=? AND id<>? LIMIT 1').bind(email,userIdValue).first<any>();
 if(owner)await mergeTrustedDuplicateIntoLegacy(db,owner.id,userIdValue,email);
 else await db.prepare('UPDATE users SET email=?,email_normalized=?,email_verified=1,updated=? WHERE id=?').bind(email,email,Date.now(),userIdValue).run();
 return userIdValue;
}

async function fromSession():Promise<CurrentUser|null>{
 const jar=await cookies(),token=jar.get(SESSION_COOKIE)?.value;
 if(!token)return null;
 const tokenHash=await hashOpaqueToken(token),db=database(),now=Date.now();
 const row=await db.prepare(`SELECT s.user_id AS userId,s.last_used AS lastUsed,i.provider,i.provider_user_id AS providerUserId FROM auth_sessions s LEFT JOIN auth_identities i ON i.user_id=s.user_id WHERE s.token_hash=? AND s.expires>? ORDER BY CASE i.provider WHEN 'email' THEN 0 WHEN 'google' THEN 1 ELSE 2 END LIMIT 1`).bind(tokenHash,now).first<any>();
 if(!row)return null;
 if(!row.provider)return null;
 if(now-Number(row.lastUsed||0)>15*60_000)void db.prepare('UPDATE auth_sessions SET last_used=? WHERE token_hash=?').bind(now,tokenHash).run();
 return readCurrentUser(row.userId,row.provider as AuthProvider,row.providerUserId||'');
}

async function resolvePlatform(identity:PlatformIdentity):Promise<CurrentUser>{
 const db=database(),now=Date.now();
 let linked=await db.prepare(`SELECT user_id AS userId,provider_email AS providerEmail FROM auth_identities WHERE provider='chatgpt' AND provider_user_id=? LIMIT 1`).bind(identity.providerUserId).first<any>();
 if(linked){
  await reconcileTrustedProviderEmail(db,linked.userId,identity.email);
  if(linked.providerEmail!==identity.email)await db.prepare(`UPDATE auth_identities SET provider_email=? WHERE provider='chatgpt' AND provider_user_id=?`).bind(identity.email,identity.providerUserId).run();
  const current=await readCurrentUser(linked.userId,'chatgpt',identity.providerUserId);
  if(current)return current;
 }
 const emailOwner=await db.prepare('SELECT id,email_verified AS emailVerified FROM users WHERE email_normalized=?').bind(identity.email).first<any>();
 if(emailOwner){
  if(!Boolean(emailOwner.emailVerified))await revokeUnverifiedEmailCredentialAccess(db,emailOwner.id);
  await db.batch([
   db.prepare(`INSERT OR IGNORE INTO auth_identities (id,user_id,provider,provider_user_id,provider_email,credential_hash,created) VALUES (?,?, 'chatgpt',?,?,NULL,?)`).bind(crypto.randomUUID(),emailOwner.id,identity.providerUserId,identity.email,now),
   db.prepare('UPDATE users SET email_verified=1,updated=? WHERE id=?').bind(now,emailOwner.id)
  ]);
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
 const session=await fromSession(),platform=await platformIdentity();
 if(session&&platform){
  if(session.legacyChatgptUserId===platform.providerUserId&&session.email&&normalizeEmail(session.email)===platform.email&&session.emailVerified)return session;
  if(session.legacyChatgptUserId===platform.providerUserId||!session.email||normalizeEmail(session.email)===platform.email){
   const platformUser=await resolvePlatform(platform);
   if(platformUser.userId===session.userId)return platformUser;
   const sessionStillExists=await database().prepare('SELECT 1 FROM users WHERE id=?').bind(session.userId).first();
   if(!sessionStillExists)return platformUser;
  }
 }
 if(session)return session;
 if(platform)return resolvePlatform(platform);
 return null;
}

export async function hasHostedPlatformIdentity(){
 if(!await hostedPlatformHeadersTrusted())return false;
 const h=await headers();
 return Boolean(h.get('oai-authenticated-user-id')&&h.get('oai-authenticated-user-email'));
}

export async function requireCurrentUser(returnTo='/'):Promise<CurrentUser>{
 const user=await getCurrentUser();
 if(user)return user;
 redirect(`/auth?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`);
}

export async function createSession(userIdValue:string){
 const db=database(),token=randomToken(32),tokenHash=await hashOpaqueToken(token),now=Date.now(),expires=now+SESSION_TTL_MS,id=crypto.randomUUID();
 await db.batch([
  db.prepare('DELETE FROM auth_sessions WHERE expires<=?').bind(now),
  db.prepare('INSERT INTO auth_sessions (id,user_id,token_hash,created,expires,last_used) VALUES (?,?,?,?,?,?)').bind(id,userIdValue,tokenHash,now,expires,now),
  db.prepare('DELETE FROM auth_sessions WHERE user_id=? AND id NOT IN (SELECT id FROM auth_sessions WHERE user_id=? ORDER BY created DESC LIMIT 12)').bind(userIdValue,userIdValue)
 ]);
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
 return Boolean(user&&user.profileCompleted&&user.emailVerified);
}

export function isAdminUser(user:CurrentUser|null|undefined){
 if(!user)return false;
 if(env.ANIME_CLASH_ADMIN_USER_ID&&user.userId===env.ANIME_CLASH_ADMIN_USER_ID)return true;
 return Boolean(env.ANIME_CLASH_ADMIN_ID&&user.legacyChatgptUserId===env.ANIME_CLASH_ADMIN_ID);
}

export async function publicAuthState(){
 const user=await getCurrentUser();
 if(!user)return {authenticated:false,user:null};
 return {authenticated:true,user:{id:user.userId,email:user.email,emailVerified:user.emailVerified,username:user.username,displayName:user.displayName,avatarUrl:user.avatarUrl,profileCompleted:user.profileCompleted,requiresEmailVerification:!user.emailVerified}};
}

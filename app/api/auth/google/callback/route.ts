import {cookies} from 'next/headers';
import {database} from '@/db/raw';
import {createSession} from '@/lib/auth';
import {hashOpaqueToken,normalizeEmail,safeRelativeReturnPath,userId} from '@/lib/auth-crypto';
import {clearGoogleCookies,GOOGLE_NONCE_COOKIE,GOOGLE_STATE_COOKIE,GOOGLE_VERIFIER_COOKIE,googleConfig,verifyGoogleIdToken} from '@/lib/google-auth';

function fail(request:Request,code:string){
 const base=new URL('/auth',new URL(request.url).origin);base.searchParams.set('error',code);return Response.redirect(base,302);
}
function safeText(value:unknown,max=200){return typeof value==='string'?value.slice(0,max):''}

export async function GET(request:Request){
 const config=googleConfig();if(!config.configured)return fail(request,'google_not_configured');
 const url=new URL(request.url);
 if(url.searchParams.get('error')){await clearGoogleCookies();return fail(request,'google_cancelled')}
 const code=url.searchParams.get('code')||'',state=url.searchParams.get('state')||'';
 const jar=await cookies(),cookieState=jar.get(GOOGLE_STATE_COOKIE)?.value||'',verifier=jar.get(GOOGLE_VERIFIER_COOKIE)?.value||'',nonce=jar.get(GOOGLE_NONCE_COOKIE)?.value||'';
 if(!code||!state||!cookieState||state!==cookieState||!verifier||!nonce){await clearGoogleCookies();return fail(request,'google_state')}
 const [stateHash,verifierHash]=await Promise.all([hashOpaqueToken(state),hashOpaqueToken(verifier)]),db=database(),now=Date.now();
 const oauth=await db.prepare('SELECT return_to AS returnTo,pkce_verifier_hash AS verifierHash,expires,used FROM auth_oauth_states WHERE state_hash=? LIMIT 1').bind(stateHash).first<any>();
 if(!oauth||oauth.used||Number(oauth.expires)<=now||oauth.verifierHash!==verifierHash){await clearGoogleCookies();return fail(request,'google_state')}
 let tokenResponse:Response;
 try{
  tokenResponse=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:config.clientId,client_secret:config.clientSecret,redirect_uri:config.redirectUri,grant_type:'authorization_code',code_verifier:verifier})});
 }catch{await clearGoogleCookies();return fail(request,'google_exchange')}
 if(!tokenResponse.ok){await clearGoogleCookies();return fail(request,'google_exchange')}
 const tokenData=await tokenResponse.json() as any,idToken=String(tokenData.id_token||'');
 if(!idToken){await clearGoogleCookies();return fail(request,'google_identity')}
 const verified=await verifyGoogleIdToken(idToken,config.clientId,nonce);
 if(!verified){await clearGoogleCookies();return fail(request,'google_identity')}
 const subject=verified.sub,email=normalizeEmail(verified.email);
 const displayName=safeText(verified.name,120)||email.split('@')[0]||'Anime fan',picture=safeText(verified.picture,1000)||null;
 let identity=await db.prepare(`SELECT user_id AS userId FROM auth_identities WHERE provider='google' AND provider_user_id=? LIMIT 1`).bind(subject).first<any>(),resolvedUserId:string;
 if(identity)resolvedUserId=identity.userId;
 else{
  const emailOwner=await db.prepare('SELECT id FROM users WHERE email_normalized=? LIMIT 1').bind(email).first<any>();
  if(emailOwner){
   resolvedUserId=emailOwner.id;
   await db.batch([
    db.prepare(`INSERT INTO auth_identities (id,user_id,provider,provider_user_id,provider_email,credential_hash,created) VALUES (?,?, 'google',?,?,NULL,?)`).bind(crypto.randomUUID(),resolvedUserId,subject,email,now),
    db.prepare('UPDATE users SET email_verified=1,updated=? WHERE id=?').bind(now,resolvedUserId)
   ]);
  }else{
   resolvedUserId=userId();
   let handle='animefan_'+subject.replace(/[^a-zA-Z0-9]/g,'').toLowerCase().slice(-8);
   if(handle.length<3)handle='animefan_'+crypto.randomUUID().replace(/-/g,'').slice(0,8);
   for(let i=0;i<5&&await db.prepare('SELECT 1 FROM profiles WHERE handle=?').bind(handle).first();i++)handle=('animefan_'+crypto.randomUUID().replace(/-/g,'').slice(0,8)).slice(0,24);
   await db.batch([
    db.prepare('INSERT INTO users (id,email,email_normalized,email_verified,profile_completed,created,updated) VALUES (?,?,?,1,0,?,?)').bind(resolvedUserId,email,email,now,now),
    db.prepare(`INSERT INTO auth_identities (id,user_id,provider,provider_user_id,provider_email,credential_hash,created) VALUES (?,?, 'google',?,?,NULL,?)`).bind(crypto.randomUUID(),resolvedUserId,subject,email,now),
    db.prepare('INSERT INTO profiles (user,handle,display_name,avatar_url,bio,favorite_anime,favorite_characters,created,updated) VALUES (?,?,?,?,\'\',\'[]\',\'[]\',?,?)').bind(resolvedUserId,handle,displayName,picture,now,now)
   ]);
  }
 }
 const existing=await db.prepare('SELECT email_normalized AS emailNormalized FROM users WHERE id=?').bind(resolvedUserId).first<any>();
 if(existing&&!existing.emailNormalized){
  const collision=await db.prepare('SELECT id FROM users WHERE email_normalized=? AND id<>?').bind(email,resolvedUserId).first();
  if(!collision)await db.prepare('UPDATE users SET email=?,email_normalized=?,email_verified=1,updated=? WHERE id=?').bind(email,email,now,resolvedUserId).run();
 }
 if(picture)await db.prepare(`UPDATE profiles SET avatar_url=CASE WHEN avatar_url IS NULL OR avatar_url='' THEN ? ELSE avatar_url END,updated=? WHERE user=?`).bind(picture,now,resolvedUserId).run();
 await db.prepare('UPDATE auth_oauth_states SET used=1 WHERE state_hash=?').bind(stateHash).run();
 await createSession(resolvedUserId);await clearGoogleCookies();
 const account=await db.prepare('SELECT profile_completed AS profileCompleted FROM users WHERE id=?').bind(resolvedUserId).first<any>(),returnTo=safeRelativeReturnPath(oauth.returnTo||'/');
 const destination=account?.profileCompleted?returnTo:`/complete-profile?return_to=${encodeURIComponent(returnTo)}`;
 return Response.redirect(new URL(destination,new URL(request.url).origin),302);
}

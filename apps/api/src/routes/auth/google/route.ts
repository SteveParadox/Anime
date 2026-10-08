import {cookies} from '@/lib/http-context';
import {database} from '@/db/raw';
import {hashOpaqueToken,pkceChallenge,randomToken,safeRelativeReturnPath} from '@anime/domain/auth-crypto';
import {enforceAuthRateLimits} from '@/lib/auth-rate-limit';
import {googleConfig,setGoogleCookies} from '@/lib/google-auth';
import {authJson,sameOrigin} from '@/lib/auth-request';

export async function GET(request:Request){
 if(!sameOrigin(request))return authJson({error:'Invalid origin.'},403);
 const config=googleConfig();
 if(!config.configured)return authJson({error:'Google login is not configured.'},503);
 const limit=await enforceAuthRateLimits(request,'google-start',undefined,{ipLimit:30,windowMs:15*60_000});
 if(!limit.allowed)return authJson({error:'Too many sign-in attempts. Try again later.'},429,{'Retry-After':String(limit.retryAfterSeconds)});
 const url=new URL(request.url),returnTo=safeRelativeReturnPath(url.searchParams.get('return_to')||'/'),state=randomToken(32),verifier=randomToken(48),nonce=randomToken(32),now=Date.now();
 const [stateHash,verifierHash,challenge]=await Promise.all([hashOpaqueToken(state),hashOpaqueToken(verifier),pkceChallenge(verifier)]);
 const db=database();
 await db.batch([
  db.prepare('DELETE FROM auth_oauth_states WHERE expires<=? OR (used=1 AND created<?)').bind(now,now-24*60*60_000),
  db.prepare('INSERT INTO auth_oauth_states (state_hash,pkce_verifier_hash,return_to,created,expires,used) VALUES (?,?,?,?,?,0)').bind(stateHash,verifierHash,returnTo,now,now+10*60_000)
 ]);
 await setGoogleCookies(state,verifier,nonce);
 const auth=new URL('https://accounts.google.com/o/oauth2/v2/auth');
 auth.searchParams.set('client_id',config.clientId);auth.searchParams.set('redirect_uri',config.redirectUri);auth.searchParams.set('response_type','code');auth.searchParams.set('scope','openid email profile');auth.searchParams.set('state',state);auth.searchParams.set('nonce',nonce);auth.searchParams.set('code_challenge',challenge);auth.searchParams.set('code_challenge_method','S256');auth.searchParams.set('prompt','select_account');
 return new Response(null,{status:302,headers:{Location:auth.toString(),'Cache-Control':'no-store'}});
}

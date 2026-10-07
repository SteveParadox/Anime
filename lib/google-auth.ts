import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';

export const GOOGLE_STATE_COOKIE='anime_google_state';
export const GOOGLE_VERIFIER_COOKIE='anime_google_verifier';
export const GOOGLE_NONCE_COOKIE='anime_google_nonce';

export function googleConfig(){
 const clientId=String(env.GOOGLE_CLIENT_ID||''),clientSecret=String(env.GOOGLE_CLIENT_SECRET||''),redirectUri=String(env.GOOGLE_REDIRECT_URI||'');
 return {clientId,clientSecret,redirectUri,configured:Boolean(clientId&&clientSecret&&redirectUri)};
}

export async function setGoogleCookies(state:string,verifier:string,nonce:string){
 const jar=await cookies(),secure=env.ENVIRONMENT==='production',expires=new Date(Date.now()+10*60_000);
 const options={httpOnly:true,secure,sameSite:'lax' as const,path:'/',expires};
 jar.set(GOOGLE_STATE_COOKIE,state,options);jar.set(GOOGLE_VERIFIER_COOKIE,verifier,options);jar.set(GOOGLE_NONCE_COOKIE,nonce,options);
}

export async function clearGoogleCookies(){
 const jar=await cookies();jar.delete(GOOGLE_STATE_COOKIE);jar.delete(GOOGLE_VERIFIER_COOKIE);jar.delete(GOOGLE_NONCE_COOKIE);
}

export function decodeJwtPayload(token:string):Record<string,unknown>|null{
 try{
  const part=token.split('.')[1];if(!part)return null;
  const padded=part.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-part.length%4)%4);
  return JSON.parse(atob(padded));
 }catch{return null}
}

import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';

export const GOOGLE_STATE_COOKIE='anime_google_state';
export const GOOGLE_VERIFIER_COOKIE='anime_google_verifier';
export const GOOGLE_NONCE_COOKIE='anime_google_nonce';

type GoogleJwk=JsonWebKey&{kid?:string};

type GoogleClaims={
 iss:string;
 aud:string|string[];
 sub:string;
 email:string;
 email_verified:boolean|string;
 nonce?:string;
 exp:number;
 iat?:number;
 nbf?:number;
 name?:string;
 picture?:string;
 azp?:string;
};

let jwksCache:{expiresAt:number;keys:GoogleJwk[]}|null=null;

export function googleConfig(){
 const clientId=String(env.GOOGLE_CLIENT_ID||''),clientSecret=String(env.GOOGLE_CLIENT_SECRET||''),redirectUri=String(env.GOOGLE_REDIRECT_URI||'');
 return {clientId,clientSecret,redirectUri,configured:Boolean(clientId&&clientSecret&&redirectUri)};
}

export async function setGoogleCookies(state:string,verifier:string,nonce:string){
 const jar=await cookies(),secure=env.ENVIRONMENT!=='development',expires=new Date(Date.now()+10*60_000);
 const options={httpOnly:true,secure,sameSite:'lax' as const,path:'/',expires};
 jar.set(GOOGLE_STATE_COOKIE,state,options);jar.set(GOOGLE_VERIFIER_COOKIE,verifier,options);jar.set(GOOGLE_NONCE_COOKIE,nonce,options);
}

export async function clearGoogleCookies(){
 const jar=await cookies();jar.delete(GOOGLE_STATE_COOKIE);jar.delete(GOOGLE_VERIFIER_COOKIE);jar.delete(GOOGLE_NONCE_COOKIE);
}

function decodePart(value:string){
 try{
  const normalized=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);
  const binary=atob(normalized),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
 }catch{return null}
}

function signatureBytes(value:string){
 try{
  const normalized=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);
  const binary=atob(normalized);
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
 }catch{return null}
}

async function googleJwks(){
 const now=Date.now();
 if(jwksCache&&jwksCache.expiresAt>now)return jwksCache.keys;
 const response=await fetch('https://www.googleapis.com/oauth2/v3/certs',{headers:{Accept:'application/json'}});
 if(!response.ok)throw new Error('Google signing keys are unavailable.');
 const body=await response.json() as {keys?:GoogleJwk[]};
 if(!Array.isArray(body.keys)||!body.keys.length)throw new Error('Google signing keys are invalid.');
 const cacheControl=response.headers.get('cache-control')||'',maxAge=Number(cacheControl.match(/max-age=(\d+)/)?.[1]||300);
 jwksCache={keys:body.keys,expiresAt:now+Math.max(60,Math.min(maxAge,86400))*1000};
 return jwksCache.keys;
}

function verifiedEmail(value:unknown){return value===true||value==='true'||value===1||value==='1'}

export async function verifyGoogleIdToken(token:string,expectedAudience:string,expectedNonce:string):Promise<GoogleClaims|null>{
 try{
  const parts=token.split('.');if(parts.length!==3)return null;
  const headerText=decodePart(parts[0]),payloadText=decodePart(parts[1]),signature=signatureBytes(parts[2]);
  if(!headerText||!payloadText||!signature)return null;
  const header=JSON.parse(headerText) as {alg?:string;kid?:string;typ?:string};
  if(header.alg!=='RS256'||!header.kid)return null;
  const matchesKey=(k:GoogleJwk)=>k.kid===header.kid&&k.kty==='RSA'&&(!k.use||k.use==='sig')&&(!k.alg||k.alg==='RS256');
  const keys=await googleJwks(),jwk=keys.find(matchesKey);
  if(!jwk){
   jwksCache=null;
   const refreshed=await googleJwks(),retry=refreshed.find(matchesKey);
   if(!retry)return null;
   return verifyWithKey(retry,parts,payloadText,signature,expectedAudience,expectedNonce);
  }
  return verifyWithKey(jwk,parts,payloadText,signature,expectedAudience,expectedNonce);
 }catch{return null}
}

async function verifyWithKey(jwk:GoogleJwk,parts:string[],payloadText:string,signature:Uint8Array,expectedAudience:string,expectedNonce:string):Promise<GoogleClaims|null>{
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 const signed=new TextEncoder().encode(parts[0]+'.'+parts[1]);
 const valid=await crypto.subtle.verify({name:'RSASSA-PKCS1-v1_5'},key,signature,signed);
 if(!valid)return null;
 const claims=JSON.parse(payloadText) as GoogleClaims,now=Math.floor(Date.now()/1000);
 const audiences=Array.isArray(claims.aud)?claims.aud:[claims.aud];
 if(!audiences.includes(expectedAudience))return null;
 if(claims.azp&&claims.azp!==expectedAudience)return null;
 if(!['accounts.google.com','https://accounts.google.com'].includes(claims.iss))return null;
 if(!claims.sub||typeof claims.sub!=='string'||claims.sub.length>255)return null;
 if(!claims.email||typeof claims.email!=='string'||!verifiedEmail(claims.email_verified))return null;
 if(!claims.nonce||claims.nonce!==expectedNonce)return null;
 if(!Number.isFinite(claims.exp)||claims.exp<=now)return null;
 if(claims.iat!==undefined&&(!Number.isFinite(claims.iat)||claims.iat>now+120))return null;
 if(claims.nbf!==undefined&&(!Number.isFinite(claims.nbf)||claims.nbf>now+120))return null;
 return claims;
}

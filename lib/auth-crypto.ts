const PASSWORD_ITERATIONS=310_000;
const enc=new TextEncoder();

function bytesToBase64Url(bytes:Uint8Array){
 let binary='';
 for(const b of bytes)binary+=String.fromCharCode(b);
 return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function base64UrlToBytes(value:string){
 const padded=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);
 const binary=atob(padded);
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
}

export function normalizeEmail(value:string){
 return value.trim().toLowerCase();
}

export function normalizeUsername(value:string){
 return value.trim().toLowerCase();
}

export function validUsername(value:string){
 return /^[a-z0-9_]{3,24}$/.test(normalizeUsername(value));
}

export function randomToken(bytes=32){
 const value=new Uint8Array(bytes);
 crypto.getRandomValues(value);
 return bytesToBase64Url(value);
}

export function userId(){
 return `usr_${crypto.randomUUID()}`;
}

export async function hashOpaqueToken(token:string){
 const digest=await crypto.subtle.digest('SHA-256',enc.encode(token));
 return bytesToBase64Url(new Uint8Array(digest));
}

export async function hashPassword(password:string){
 if(password.length<8||password.length>128)throw new Error('Password must be between 8 and 128 characters.');
 const salt=new Uint8Array(16);crypto.getRandomValues(salt);
 const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:PASSWORD_ITERATIONS},key,256);
 return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${bytesToBase64Url(salt)}$${bytesToBase64Url(new Uint8Array(bits))}`;
}

export async function verifyPassword(password:string,stored:string){
 try{
  const [scheme,iterationsRaw,saltRaw,hashRaw]=stored.split('$');
  const iterations=Number(iterationsRaw);
  if(scheme!=='pbkdf2_sha256'||!Number.isInteger(iterations)||iterations<100_000||iterations>1_000_000)return false;
  const salt=base64UrlToBytes(saltRaw),expected=base64UrlToBytes(hashRaw);
  const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,expected.length*8);
  const actual=new Uint8Array(bits);
  if(actual.length!==expected.length)return false;
  let diff=0;for(let i=0;i<actual.length;i++)diff|=actual[i]^expected[i];
  return diff===0;
 }catch{return false}
}

export async function pkceChallenge(verifier:string){
 const digest=await crypto.subtle.digest('SHA-256',enc.encode(verifier));
 return bytesToBase64Url(new Uint8Array(digest));
}

export function safeRelativeReturnPath(value:string|null|undefined,fallback='/'){
 if(!value||!value.startsWith('/')||value.startsWith('//'))return fallback;
 try{
  const url=new URL(value,'https://anime-clash.local');
  if(url.origin!=='https://anime-clash.local')return fallback;
  if(['/signin-with-chatgpt','/signout-with-chatgpt','/callback','/api/auth/google/callback'].includes(url.pathname))return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
 }catch{return fallback}
}

export function maskEmail(email:string|null|undefined){
 if(!email)return '';
 const [local,domain]=email.split('@');
 if(!domain)return '';
 return `${local.slice(0,1)}***@${domain}`;
}

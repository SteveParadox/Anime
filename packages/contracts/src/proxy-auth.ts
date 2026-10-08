import {createHmac,timingSafeEqual} from 'node:crypto';
import {isIP} from 'node:net';

/** Only server-side apps may import this module. Never ship the shared secret to browsers. */
export function proxySignature(secret:string,timestamp:string,ip:string,method:string,pathAndQuery:string){
 return createHmac('sha256',secret)
  .update(['anime-proxy-v1',timestamp,ip,method.toUpperCase(),pathAndQuery].join('\n'))
  .digest('hex');
}

export function verifyProxySignature(
 secret:string,timestamp:string|undefined,ip:string|undefined,
 signature:string|undefined,method:string,pathAndQuery:string,
 now=Date.now()
){
 if(!secret||!timestamp||!ip||!signature)return false;
 if(!/^\d{13}$/.test(timestamp)||!isIP(ip)||! /^[a-f0-9]{64}$/.test(signature))return false;
 const issuedAt=Number(timestamp);
 if(!Number.isSafeInteger(issuedAt)||Math.abs(now-issuedAt)>30_000)return false;
 const expected=Buffer.from(proxySignature(secret,timestamp,ip,method,pathAndQuery),'hex');
 return timingSafeEqual(expected,Buffer.from(signature,'hex'));
}

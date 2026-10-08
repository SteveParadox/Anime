import type {NextRequest} from 'next/server';
import {isIP} from 'node:net';
import {proxySignature} from '@anime/contracts/proxy-auth';

export const dynamic='force-dynamic';
export const runtime='nodejs';
const permitted=new Set(['GET','POST','PUT','PATCH','DELETE']);

function upstreamOrigin(){
 const configured=process.env.API_UPSTREAM_ORIGIN;
 if(!configured)throw new Error('API_UPSTREAM_ORIGIN is required');
 const url=new URL(configured);
 if(!['http:','https:'].includes(url.protocol)||process.env.VERCEL&&url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)
  throw new Error('API_UPSTREAM_ORIGIN must be an HTTP(S) origin');
 return url.origin;
}
async function proxy(request:NextRequest,context:{params:Promise<{path:string[]}>}){
 const {path}=await context.params;
 if(!permitted.has(request.method)||!path?.length)return Response.json({error:'Unsupported route.'},{status:405});
 const target=new URL('/api/'+path.map(encodeURIComponent).join('/'),upstreamOrigin());
 target.search=request.nextUrl.search;
 const headers=new Headers(request.headers);
 for(const name of ['host','connection','content-length','x-forwarded-host','x-forwarded-for','x-forwarded-proto','x-real-ip','x-vercel-forwarded-for','x-anime-verified-ip'])headers.delete(name);
 for(const name of [...headers.keys()])if(name.startsWith('oai-authenticated-user-')||name.startsWith('x-anime-proxy-'))headers.delete(name);
 // Vercel overwrites x-real-ip at its edge; never use a browser-supplied X-Forwarded-For.
 // Local Next.js development has no trusted edge, so use a stable loopback identity.
 const edgeIp=request.headers.get('x-real-ip');
 if(process.env.VERCEL&&!isIP(edgeIp||''))return Response.json({error:'Client IP unavailable.'},{status:503});
 const clientIp=process.env.VERCEL?edgeIp!:'127.0.0.1';
 const secret=process.env.API_PROXY_SHARED_SECRET;
 if(process.env.VERCEL&&(!secret||secret.length<32))
  return Response.json({error:'API proxy is not configured.'},{status:503});
 if(secret){
  const issuedAt=String(Date.now());
  headers.set('x-anime-proxy-ip',clientIp);
  headers.set('x-anime-proxy-timestamp',issuedAt);
  headers.set('x-anime-proxy-signature',proxySignature(secret,issuedAt,clientIp,request.method,target.pathname+target.search));
 }
 if(!['GET','HEAD'].includes(request.method)&&!headers.has('origin'))headers.set('origin',request.nextUrl.origin);
 try{
  const body=['GET','HEAD'].includes(request.method)?undefined:await request.arrayBuffer();
  if(body&&body.byteLength>100_000)return Response.json({error:'Request body is too large.'},{status:413});
  const upstream=await fetch(target,{method:request.method,headers,body,redirect:'manual',cache:'no-store',signal:AbortSignal.any([request.signal,AbortSignal.timeout(30_000)])});
  const responseHeaders=new Headers(upstream.headers);
  for(const name of ['connection','transfer-encoding','content-length','keep-alive'])responseHeaders.delete(name);
  const location=responseHeaders.get('location');
  if(location){
   const destination=new URL(location,request.nextUrl.origin);
   if(![request.nextUrl.origin,'https://accounts.google.com'].includes(destination.origin))throw new Error('Unexpected API redirect origin');
  }
  responseHeaders.delete('set-cookie');
  for(const cookie of upstream.headers.getSetCookie())responseHeaders.append('set-cookie',cookie);
  responseHeaders.set('cache-control','no-store');
  return new Response(upstream.body,{status:upstream.status,headers:responseHeaders});
 }catch{
  return Response.json({error:'API is temporarily unavailable.'},{status:502,headers:{'Cache-Control':'no-store'}});
 }
}

export {proxy as GET,proxy as POST,proxy as PUT,proxy as PATCH,proxy as DELETE};

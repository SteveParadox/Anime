import Fastify from 'fastify';
import {env} from './config/env';
import {getPool} from '@anime/database/client';
import {withHttpContext} from './lib/http-context';
import {verifyProxySignature} from '@anime/contracts/proxy-auth';
import {databaseReady} from './lib/readiness';
import {routeHandlers} from './routes.generated';

export function createApp(){
 const app=Fastify({logger:{level:env.LOG_LEVEL,redact:['req.headers.cookie','req.headers.authorization','res.headers.set-cookie']},
  bodyLimit:100_000,requestTimeout:30_000,trustProxy:false,genReqId:()=>crypto.randomUUID()});
 app.removeAllContentTypeParsers();
 app.addContentTypeParser('*',{parseAs:'string'},(_request,body,done)=>done(null,body));
 app.addHook('onRequest',async(request,reply)=>{
  // Public Railway URLs cannot spoof browser identity, forwarded IPs or bypass Vercel.
  if(request.url.startsWith('/api/')){
   const verified=verifyProxySignature(
    env.API_PROXY_SHARED_SECRET||'',
    request.headers['x-anime-proxy-timestamp'] as string|undefined,
    request.headers['x-anime-proxy-ip'] as string|undefined,
    request.headers['x-anime-proxy-signature'] as string|undefined,
    request.method,new URL(request.url,'http://internal').pathname+new URL(request.url,'http://internal').search
   );
   if(env.NODE_ENV==='production'&&!verified){
    reply.code(403).send({error:'API requests must pass through the application gateway.'});
    return;
   }
  }
  reply.header('x-content-type-options','nosniff');
  reply.header('referrer-policy','strict-origin-when-cross-origin');
  const origin=request.headers.origin;
  if(origin){
   if(origin!==new URL(env.APP_BASE_URL).origin){reply.code(403).send({error:'Invalid origin.'});return;}
   reply.header('access-control-allow-origin',origin);
   reply.header('vary','Origin');
   reply.header('access-control-allow-credentials','true');
  }
  if(request.method==='OPTIONS'){
   reply.header('access-control-allow-methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');
   reply.header('access-control-allow-headers','Content-Type');
   reply.code(204).send();
  }
 });
 app.setErrorHandler((error,request,reply)=>{
  request.log.error({err:error},'API request failed');
  const status=(error as {statusCode?:number}).statusCode;
  reply.code(status&&status<500?status:500).send({error:'Request could not be completed.'});
 });
 app.get('/health/live',async()=>({status:'ok'}));
 app.get('/health/ready',async(_request,reply)=>{
  try{if(!await databaseReady(getPool(env.DATABASE_URL,env.DB_POOL_MAX)))throw new Error('Schema not ready');return {status:'ready'};}
  catch{reply.code(503);return {status:'unavailable'};}
 });
 for(const route of routeHandlers){
  for(const [method,handler] of Object.entries(route.handlers) as [string,(request:Request)=>Promise<Response>][]) {
   if(typeof handler!=='function')continue;
   app.route({method:method as 'GET'|'POST',url:route.path,handler:async(request,reply)=>{
    const headers=new Headers();
    for(const [name,value] of Object.entries(request.headers)){
     if(name==='host'||name==='x-anime-verified-ip'||name.startsWith('x-anime-proxy-')||name.startsWith('oai-authenticated-user-')||name.startsWith('x-forwarded-'))continue;
     if(value!==undefined)headers.set(name,Array.isArray(value)?value.join(','):value);
    }
    const verified=verifyProxySignature(
     env.API_PROXY_SHARED_SECRET||'',
     request.headers['x-anime-proxy-timestamp'] as string|undefined,
     request.headers['x-anime-proxy-ip'] as string|undefined,
     request.headers['x-anime-proxy-signature'] as string|undefined,
     request.method,new URL(request.raw.url||route.path,'http://internal').pathname+new URL(request.raw.url||route.path,'http://internal').search
    );
    headers.set('x-anime-verified-ip',verified?String(request.headers['x-anime-proxy-ip']):request.ip);
    const rawPath=request.raw.url||route.path;
    if(!rawPath.startsWith('/')||rawPath.startsWith('//')){
     reply.code(400).send({error:'Invalid request path.'});return;
    }
    const incoming=new Request(new URL(rawPath,env.APP_BASE_URL),{
     method:request.method,headers,
     ...(['GET','HEAD'].includes(request.method)?{}:{body:typeof request.body==='string'?request.body:JSON.stringify(request.body??{})})
    });
    const outgoing:string[]=[];
    const response=await withHttpContext({request:incoming,outgoingCookies:outgoing},()=>handler(incoming));
    reply.code(response.status);
    response.headers.forEach((value,name)=>{
     if(!['set-cookie','transfer-encoding','content-length','connection'].includes(name))reply.header(name,value);
    });
    if(outgoing.length)reply.header('set-cookie',outgoing);
    return reply.send(Buffer.from(await response.arrayBuffer()));
   }});
  }
 }
 return app;
}

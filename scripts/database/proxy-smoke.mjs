import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'../..');
const db=await PGlite.create();
const socket=new PGLiteSocketServer({db,host:'127.0.0.1',port:0});
const children=[];
const origin='http://localhost:3000';
function run(command,args,env){
 return new Promise((done,reject)=>{
  const child=spawn(command,args,{cwd:root,env:{...process.env,...env},stdio:'inherit'});
  child.once('error',reject);
  child.once('exit',code=>code===0?done():reject(new Error(`${command} exited ${code}`)));
 });
}
function start(command,args,env){
 const child=spawn(command,args,{cwd:root,env:{...process.env,...env},stdio:'inherit',detached:true});
 children.push(child);
 return child;
}
async function ready(url){
 for(let attempt=0;attempt<90;attempt++){
  try{const response=await fetch(url);if(response.ok)return response;}catch{}
  await new Promise(done=>setTimeout(done,500));
 }
 throw new Error(`Service did not become ready: ${url}`);
}
try{
 await socket.start();
 const url=`postgresql://postgres@${socket.getServerConn()}/postgres?sslmode=disable`;
 const env={DATABASE_URL:url,DB_POOL_MAX:'1',APP_BASE_URL:origin,API_UPSTREAM_ORIGIN:'http://localhost:4000',NODE_ENV:'development',LOG_LEVEL:'fatal'};
 await run(process.execPath,['scripts/database/migrate.mjs','--through=0000_baseline.sql'],env);
 await run(process.execPath,['scripts/database/seed.mjs'],env);
 await run(process.execPath,['scripts/database/migrate.mjs'],env);
 start(process.execPath,['apps/api/dist/server.js'],env);
 await ready('http://localhost:4000/health/ready');
 start('pnpm',['--filter','@anime/web','start'],{...env,NODE_ENV:'production'});
 await ready(origin);
 const email=`proxy-${crypto.randomUUID().slice(0,8)}@example.com`;
 const register=await fetch(origin+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify({email,password:'SafePassword123!',username:'proxy_'+crypto.randomUUID().slice(0,8),displayName:'Proxy Test'})});
 assert.equal(register.status,201,await register.text());
 const cookie=register.headers.get('set-cookie');
 assert.match(cookie||'',/anime_clash_session=.*HttpOnly/i);
 assert.match(cookie||'',/SameSite=Lax/i);
 const me=await fetch(origin+'/api/auth/me',{headers:{cookie}});
 assert.equal(me.status,200);
 assert.equal((await me.json()).user.email,email);
 const denied=await fetch(origin+'/api/auth/logout',{method:'POST',headers:{cookie,origin:'https://evil.example','content-type':'application/json'},body:'{}'});
 assert.equal(denied.status,403);
 const logout=await fetch(origin+'/api/auth/logout',{method:'POST',headers:{cookie,origin,'content-type':'application/json'},body:'{}'});
 assert.equal(logout.status,200);
 const revoked=await fetch(origin+'/api/auth/me',{headers:{cookie}});
 assert.equal((await revoked.json()).authenticated,false);
 console.log('PASS: native Next.js proxy preserves session cookie, authentication, status, origin protection, and revocation');
}finally{
 for(const child of children.reverse())try{process.kill(-child.pid,'SIGTERM');}catch{}
 await socket.stop();await db.close();
}

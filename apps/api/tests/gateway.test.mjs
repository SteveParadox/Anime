import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV='production';
process.env.APP_BASE_URL='https://anime-clash.example';
process.env.DATABASE_URL='postgresql://local:local@127.0.0.1:5432/unused';
process.env.API_PROXY_SHARED_SECRET='s'.repeat(64);
process.env.LOG_LEVEL='fatal';
const {createApp}=await import('../src/app.ts');
const {proxySignature}=await import('@anime/contracts/proxy-auth');

test('production Railway API rejects direct or spoofed requests',async()=>{
 const app=createApp(),path='/api/auth/providers',ip='203.0.113.17',timestamp=String(Date.now());
 const sign=(method='GET',url=path)=>proxySignature(process.env.API_PROXY_SHARED_SECRET,timestamp,ip,method,url);
 try{
  const direct=await app.inject({method:'GET',url:path});
  assert.equal(direct.statusCode,403,direct.payload);
  const spoofed=await app.inject({method:'GET',url:path,headers:{
   'x-anime-proxy-ip':ip,'x-anime-proxy-timestamp':timestamp,
   'x-anime-proxy-signature':'0'.repeat(64),'x-forwarded-for':'192.0.2.44'
  }});
  assert.equal(spoofed.statusCode,403,spoofed.payload);
  const legit=await app.inject({method:'GET',url:path,headers:{
   'x-anime-proxy-ip':ip,'x-anime-proxy-timestamp':timestamp,
   'x-anime-proxy-signature':sign()
  }});
  assert.equal(legit.statusCode,200,legit.payload);
  const modifiedPath=await app.inject({method:'GET',url:path+'?other=1',headers:{
   'x-anime-proxy-ip':ip,'x-anime-proxy-timestamp':timestamp,
   'x-anime-proxy-signature':sign()
  }});
  assert.equal(modifiedPath.statusCode,403,modifiedPath.payload);
  assert.equal((await app.inject({method:'GET',url:'/health/live'})).statusCode,200);
 }finally{await app.close();}
});

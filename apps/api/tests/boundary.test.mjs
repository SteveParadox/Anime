import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV='test';
process.env.APP_BASE_URL='http://localhost:3000';
process.env.DATABASE_URL='postgresql://anime:anime@127.0.0.1:5432/anime_clash';
process.env.LOG_LEVEL='fatal';
const {createApp}=await import('../src/app.ts');
const {translateSql}=await import('../src/db/raw.ts');

test('untrusted identity headers cannot sign in, and mutation origins are enforced',async()=>{
 const app=createApp();
 try{
  const spoof=await app.inject({method:'GET',url:'/api/auth/me',headers:{'oai-authenticated-user-id':'admin','oai-authenticated-user-email':'admin@example.com'}});
  assert.equal(spoof.statusCode,200);
  assert.deepEqual(spoof.json(),{authenticated:false,user:null});
  const denied=await app.inject({method:'POST',url:'/api/community',headers:{origin:'https://attacker.example','content-type':'application/json'},payload:JSON.stringify({action:'post'})});
  assert.equal(denied.statusCode,403);
  const unauthenticated=await app.inject({method:'POST',url:'/api/community',headers:{origin:'http://localhost:3000','content-type':'application/json'},payload:JSON.stringify({action:'post'})});
  assert.equal(unauthenticated.statusCode,401);
  const live=await app.inject('/health/live');
  assert.equal(live.statusCode,200);
  assert.deepEqual(live.json(),{status:'ok'});
 }finally{await app.close();}
});

test('legacy D1 query syntax is translated with positional binds and stable API aliases',()=>{
 const converted=translateSql('SELECT v.rowid AS argumentId FROM votes v WHERE v.battle=? AND v.side="a"');
 assert.equal(converted.sql,'SELECT v.argument_id AS "argumentId" FROM votes v WHERE v.battle=$1 AND v.side=\'a\'');
 assert.equal(converted.parameters,1);
 assert.equal(translateSql('INSERT OR IGNORE INTO x (id) VALUES (?)').sql,'INSERT INTO x (id) VALUES ($1) ON CONFLICT DO NOTHING');
 assert.equal(translateSql("SELECT '?' AS literal WHERE name=?").parameters,1);
 assert.equal(translateSql("SELECT user FROM votes WHERE user=? AND reason='user' ").sql,
  "SELECT \"user\" FROM votes WHERE \"user\"=$1 AND reason='user' ");
});

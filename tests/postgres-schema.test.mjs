import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('PostgreSQL baseline preserves catalog, historical argument IDs, and squad guards',async()=>{
 const db=new PGlite();
 try{
  for(const migration of ['0000_baseline.sql','0001_squad_guards.sql'])
   await db.exec(await readFile(`packages/database/migrations/${migration}`,'utf8'));
  let seeds=0;
  for(const line of (await readFile('packages/database/seeds/catalog.jsonl','utf8')).trim().split('\n')){
   const {table,values}=JSON.parse(line),columns=Object.keys(values);
   await db.query(`INSERT INTO "${table}" (${columns.map(name=>'"'+name+'"').join(',')}) VALUES (${columns.map((_,index)=>'$'+(index+1)).join(',')})`,columns.map(column=>values[column]));
   seeds++;
  }
  assert.equal(seeds,465);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM version_combat_roles WHERE version_id='gojo-shibuya'")).rows[0].n,3);
  for(const user of ['u1','u2'])await db.query('INSERT INTO users (id,created,updated) VALUES ($1,1,1)',[user]);
  await db.query("INSERT INTO battles (id,owner,payload,created) VALUES ('b1','u1','{}',1)");
  await db.query("INSERT INTO votes (battle,\"user\",side,reason,evidence,created,argument_id) VALUES ('b1','u2','a','A reason','A source',1,789)");
  await db.query("INSERT INTO votes (battle,\"user\",side,reason,evidence,created) VALUES ('b1','u2','b','A new reason','A source',2) ON CONFLICT(battle,\"user\") DO UPDATE SET side=excluded.side");
  assert.deepEqual((await db.query('SELECT argument_id,side FROM votes')).rows,[{argument_id:789,side:'b'}]);
  const now=Date.now();
  await db.query("INSERT INTO daily_squad_challenges (id,type,title,description,budget,min_members,max_members,starts_at,ends_at,created) VALUES ('d1','open_build','Test','Test',100,1,5,$1,$2,$1)",[now-60_000,now+60_000]);
  await db.query("INSERT INTO squad_submissions (id,challenge_id,owner,name,strategy,total_cost,created,updated) VALUES ('s1','d1','u1','Team','Test',30,1,1)");
  await db.query("INSERT INTO squad_submission_members (submission_id,position,character_id,version_id,character_name_snapshot,version_name_snapshot,cost_snapshot) VALUES ('s1',0,'naruto','naruto-six-paths','Naruto','Six Paths',30)");
  await assert.rejects(db.query("INSERT INTO squad_submission_votes (submission_id,\"user\",verdict,created,updated) VALUES ('s1','u1','yes',1,1)"),/squad_submission_vote_forbidden/);
  await db.query("INSERT INTO squad_submission_votes (submission_id,\"user\",verdict,created,updated) VALUES ('s1','u2','yes',1,1)");
  await assert.rejects(db.query("UPDATE squad_submissions SET name='Rewritten' WHERE id='s1'"),/squad_submission_locked/);
  await assert.rejects(db.query("DELETE FROM squad_submission_members WHERE submission_id='s1'"),/squad_submission_locked/);
  await db.query("UPDATE daily_squad_challenges SET status='closed' WHERE id='d1'");
  await assert.rejects(db.query("UPDATE squad_submission_votes SET verdict='no' WHERE submission_id='s1'"),/squad_challenge_inactive/);
  assert.equal((await db.query("SELECT name FROM squad_submissions WHERE id='s1'")).rows[0].name,'Team');
 }finally{await db.close();}
});

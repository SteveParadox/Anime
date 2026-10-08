import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {spawn} from 'node:child_process';
import pg from 'pg';
import {hashPassword,verifyPassword} from '../../packages/domain/src/auth-crypto.ts';

const root=resolve(import.meta.dirname,'../..');
const temporary=await mkdtemp(join(tmpdir(),'anime-import-check-'));
const source=join(temporary,'source.sqlite'),prefix=join(temporary,'export');
const db=await PGlite.create();
const server=new PGLiteSocketServer({db,host:'127.0.0.1',port:0});
function run(command,args,env={}){
 return new Promise((done,reject)=>{
  const child=spawn(command,args,{cwd:root,env:{...process.env,...env},stdio:'inherit'});
  child.once('error',reject);
  child.once('exit',code=>code===0?done():reject(new Error(`${command} exited ${code}`)));
 });
}
try{
 const credential=await hashPassword('HistoricalPassword123!');
 await run('python',['-c',`
import sqlite3,glob,sys,time
c=sqlite3.connect(sys.argv[1]);now=int(time.time()*1000)
for f in sorted(glob.glob('drizzle/[0-9]*.sql')):
 for s in open(f).read().split('--> statement-breakpoint'):
  if s.strip():c.executescript(s)
c.execute("INSERT INTO users (id,email,email_normalized,email_verified,profile_completed,created,updated) VALUES ('usr_fixture','fixture@example.com','fixture@example.com',1,1,?,?)",(now,now))
c.execute("INSERT INTO auth_identities (id,user_id,provider,provider_user_id,provider_email,credential_hash,created) VALUES ('identity_fixture','usr_fixture','email','fixture@example.com','fixture@example.com',?,?)",(sys.argv[2],now))
c.execute("INSERT INTO profiles (user,handle,display_name,created,updated) VALUES ('usr_fixture','fixture','Fixture User',?,?)",(now,now))
c.execute("INSERT INTO battles (id,owner,payload,created) VALUES ('battle_fixture','usr_fixture','{}',?)",(now,))
c.execute("INSERT INTO votes (rowid,battle,user,side,reason,evidence,created) VALUES (789,'battle_fixture','usr_fixture','a','Original battle argument','Episode 1',?)",(now,))
c.execute("INSERT INTO reactions (subject_type,subject_id,user,reaction,created) VALUES ('argument','789','usr_fixture','upvote',?)",(now,))
c.execute("INSERT INTO daily_squad_challenges (id,type,title,description,budget,min_members,max_members,starts_at,ends_at,status,created) VALUES ('historic_day','open_build','Test','Test',100,1,5,?,?,'active',?)",(now-1000,now+60000,now))
c.execute("INSERT INTO squad_submissions (id,challenge_id,owner,name,strategy,total_cost,created,updated) VALUES ('historic_squad','historic_day','usr_fixture','Old Squad','Historical strategy',30,?,?)",(now,now))
c.execute("INSERT INTO squad_submission_members (submission_id,position,character_id,version_id,character_name_snapshot,version_name_snapshot,cost_snapshot,roles_snapshot,traits_snapshot) VALUES ('historic_squad',0,'naruto','naruto-six-paths','Naruto','Six Paths',30,NULL,NULL)")
c.execute("UPDATE daily_squad_challenges SET status='closed' WHERE id='historic_day'")
c.commit()
`,source,credential]);
 await run('python',['scripts/database/export-d1.py',source,prefix]);
 await server.start();
 const url=`postgresql://postgres@${server.getServerConn()}/postgres?sslmode=disable`,env={DATABASE_URL:url};
 await run(process.execPath,['scripts/database/migrate.mjs','--through=0000_baseline.sql'],env);
 await run(process.execPath,['scripts/database/import-d1.mjs',prefix+'.jsonl',prefix+'.manifest.json'],env);
 await run(process.execPath,['scripts/database/migrate.mjs'],env);
 const pool=new pg.Pool({connectionString:url,max:1});
 try{
  const vote=(await pool.query("SELECT argument_id,\"user\" FROM votes WHERE battle='battle_fixture'")).rows[0];
  if(Number(vote.argument_id)!==789||vote.user!=='usr_fixture')throw new Error('Historical vote ID or owner changed');
  const reaction=(await pool.query("SELECT subject_id FROM reactions WHERE subject_type='argument'")).rows[0];
  if(reaction.subject_id!=='789')throw new Error('Reaction argument reference changed');
  const snapshot=(await pool.query("SELECT roles_snapshot,traits_snapshot,cost_snapshot FROM squad_submission_members WHERE submission_id='historic_squad'")).rows[0];
  if(snapshot.roles_snapshot!==null||snapshot.traits_snapshot!==null||Number(snapshot.cost_snapshot)!==30)throw new Error('Historic squad snapshots changed');
  const stored=(await pool.query("SELECT credential_hash FROM auth_identities WHERE id='identity_fixture'")).rows[0];
  if(!await verifyPassword('HistoricalPassword123!',stored.credential_hash))throw new Error('Legacy password no longer verifies');
  console.log('Verified historical ownership, argument ID, reaction, nullable squad snapshots, and password');
 }finally{await pool.end();}
}finally{await server.stop();await db.close();await rm(temporary,{recursive:true,force:true});}

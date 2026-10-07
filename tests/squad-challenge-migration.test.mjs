import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';

const migrations=[
 'drizzle/0000_ambitious_the_enforcers.sql',
 'drizzle/0001_workable_hemingway.sql',
 'drizzle/0002_structured_battle_arena.sql',
 'drizzle/0003_structured_evidence.sql',
 'drizzle/0004_character_versions.sql',
 'drizzle/0005_auth_accounts.sql',
 'drizzle/0006_daily_squad_challenges.sql'
];

function apply(db,file){
 const sql=readFileSync(file,'utf8');
 for(const statement of sql.split('--> statement-breakpoint').map(value=>value.trim()).filter(Boolean))db.exec(statement);
}

function seedAccount(db,id,email,handle){
 db.prepare('INSERT INTO users (id,email,email_normalized,email_verified,profile_completed,created,updated) VALUES (?,?,?,?,1,1,1)').run(id,email,email.toLowerCase(),1);
 db.prepare("INSERT INTO auth_identities (id,user_id,provider,provider_user_id,provider_email,credential_hash,created) VALUES (?,?, 'email',?,?,?,1)").run('identity-'+id,id,email.toLowerCase(),email.toLowerCase(),'hash');
 db.prepare("INSERT INTO profiles (user,handle,display_name,avatar_url,bio,favorite_anime,favorite_characters,created,updated) VALUES (?,?,?,NULL,'','[]','[]',1,1)").run(id,handle,handle);
}

test('0006 preserves existing saved squads and squad-vs-squad challenge data',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  for(const file of migrations.slice(0,6))apply(db,file);
  seedAccount(db,'usr_old','old@example.com','old_fan');
  seedAccount(db,'usr_other','other@example.com','other_fan');
  db.exec(`
   INSERT INTO battles (id,owner,payload,created) VALUES ('b1','usr_old','{}',1);
   INSERT INTO votes (battle,user,side,difficulty,reason,evidence,created) VALUES ('b1','usr_old','a','mid','Existing argument survives.','Episode 1',1);
   INSERT INTO squads (id,owner,name,members,strategy,challenge,created) VALUES ('saved-a','usr_old','Saved A','["goku","naruto","ichigo","luffy","levi"]','Existing saved strategy.','legacy-day',1);
   INSERT INTO squads (id,owner,name,members,strategy,challenge,created) VALUES ('saved-b','usr_other','Saved B','["tanjiro","deku","yuji","asta","shinra"]','Existing opponent strategy.','legacy-day',1);
   INSERT INTO squad_challenges (id,challenger,challenger_squad,opponent_squad,rules,status,created) VALUES ('legacy-challenge','usr_old','saved-a','saved-b','Neutral arena.','open',1);
   INSERT INTO challenge_votes (challenge,user,side,created) VALUES ('legacy-challenge','usr_other','opponent',1);
   INSERT INTO comments (id,battle,argument_user,user,body,created) VALUES ('c1','b1','usr_old','usr_other','Existing comment',1);
   INSERT INTO reactions (subject_type,subject_id,user,reaction,created) VALUES ('argument','1','usr_other','upvote',1);
  `);
  apply(db,migrations[6]);

  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM squads WHERE id IN ('saved-a','saved-b')").get().n,2);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM squad_challenges WHERE id='legacy-challenge'").get().n,1);
  assert.equal(db.prepare("SELECT side FROM challenge_votes WHERE challenge='legacy-challenge'").get().side,'opponent');
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM battles WHERE id='b1'").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM comments WHERE id='c1'").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM reactions WHERE user='usr_other'").get().n,1);
  assert.ok(db.prepare("SELECT COUNT(*) AS n FROM squad_version_costs").get().n>=50);
 }finally{db.close()}
});

test('daily squad persistence enforces one submission, unique characters, one vote, and vote locks',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  for(const file of migrations)apply(db,file);
  seedAccount(db,'usr_a','a@example.com','fan_a');
  seedAccount(db,'usr_b','b@example.com','fan_b');
  const start=Date.UTC(2026,9,7),end=start+86_400_000;
  db.prepare("INSERT INTO daily_squad_challenges (id,type,title,description,target_character_id,target_version_id,budget,min_members,max_members,rules_json,starts_at,ends_at,status,created) VALUES ('daily-2026-10-07','defeat_target','Defeat Six Paths Naruto','Test challenge','naruto','naruto-six-paths',100,1,5,'{}',?,?,'active',?)").run(start,end,start);
  const costs=[
   ['daily-2026-10-07','ichigo','ichigo-shikai',28],
   ['daily-2026-10-07','levi','levi-season-1',12],
   ['daily-2026-10-07','tanjiro','tanjiro-season-1',10],
   ['daily-2026-10-07','shikamaru','shikamaru-standard',18],
   ['daily-2026-10-07','sakura','sakura-byakugo',22],
   ['daily-2026-10-07','goku','goku-saiyan-saga',30],
   ['daily-2026-10-07','goku','goku-namek-saga',45]
  ];
  const insertCost=db.prepare('INSERT INTO daily_squad_challenge_costs (challenge_id,character_id,version_id,cost) VALUES (?,?,?,?)');
  for(const row of costs)insertCost.run(...row);

  db.prepare("INSERT INTO squad_submissions (id,challenge_id,owner,name,strategy,total_cost,locked_at,removed,created,updated) VALUES ('sub-a','daily-2026-10-07','usr_a','Counter Squad','Use control and mobility to create a decisive opening.',90,NULL,0,1,1)").run();
  const insertMember=db.prepare('INSERT INTO squad_submission_members (submission_id,position,character_id,version_id,character_name_snapshot,version_name_snapshot,cost_snapshot) VALUES (?,?,?,?,?,?,?)');
  insertMember.run('sub-a',0,'ichigo','ichigo-shikai','Ichigo Kurosaki','Shikai Ichigo',28);
  insertMember.run('sub-a',1,'levi','levi-season-1','Levi Ackerman','Season 1 Levi',12);
  insertMember.run('sub-a',2,'tanjiro','tanjiro-season-1','Tanjiro Kamado','Season 1 Tanjiro',10);
  insertMember.run('sub-a',3,'shikamaru','shikamaru-standard','Shikamaru Nara','Standard Shikamaru',18);
  insertMember.run('sub-a',4,'sakura','sakura-byakugo','Sakura Haruno','Byakugo Seal Sakura',22);

  assert.equal(db.prepare("SELECT SUM(cost_snapshot) AS total FROM squad_submission_members WHERE submission_id='sub-a'").get().total,90);
  assert.throws(()=>db.exec("INSERT INTO squad_submissions (id,challenge_id,owner,name,strategy,total_cost,locked_at,removed,created,updated) VALUES ('sub-a-2','daily-2026-10-07','usr_a','Duplicate Entry','This should violate the one entry rule.',30,NULL,0,2,2)"));
  assert.throws(()=>insertMember.run('sub-a',5,'goku','goku-saiyan-saga','Goku','Saiyan Saga Goku',30));

  db.prepare("INSERT INTO squad_submissions (id,challenge_id,owner,name,strategy,total_cost,locked_at,removed,created,updated) VALUES ('sub-b','daily-2026-10-07','usr_b','Goku Test','This entry exists to test duplicate versions of one character.',30,NULL,0,1,1)").run();
  insertMember.run('sub-b',0,'goku','goku-saiyan-saga','Goku','Saiyan Saga Goku',30);
  assert.throws(()=>insertMember.run('sub-b',1,'goku','goku-namek-saga','Goku','Namek Saga Goku',45));

  db.prepare("INSERT INTO squad_submission_votes (submission_id,user,verdict,created,updated) VALUES ('sub-a','usr_b','yes',5,5)").run();
  db.prepare("UPDATE squad_submissions SET locked_at=5 WHERE id='sub-a'").run();
  assert.throws(()=>db.prepare("UPDATE squad_submissions SET name='Changed after vote' WHERE id='sub-a'").run(),/squad_submission_locked/);
  assert.throws(()=>db.prepare("DELETE FROM squad_submission_members WHERE submission_id='sub-a' AND position=0").run(),/squad_submission_locked/);
  assert.throws(()=>db.prepare("INSERT INTO squad_submission_votes (submission_id,user,verdict,created,updated) VALUES ('sub-a','usr_b','no',6,6)").run());

  db.prepare("UPDATE squad_submission_votes SET verdict='no',updated=6 WHERE submission_id='sub-a' AND user='usr_b'").run();
  assert.equal(db.prepare("SELECT verdict FROM squad_submission_votes WHERE submission_id='sub-a' AND user='usr_b'").get().verdict,'no');
 }finally{db.close()}
});

test('cost and name snapshots survive later price changes',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  for(const file of migrations)apply(db,file);
  seedAccount(db,'usr_a','a@example.com','fan_a');
  const start=Date.UTC(2026,9,7),end=start+86_400_000;
  db.prepare("INSERT INTO daily_squad_challenges (id,type,title,description,target_character_id,target_version_id,budget,min_members,max_members,rules_json,starts_at,ends_at,status,created) VALUES ('daily-2026-10-07','defeat_target','Test','Test','goku','goku-mastered-ultra-instinct',100,1,5,'{}',?,?,'active',?)").run(start,end,start);
  db.exec("INSERT INTO daily_squad_challenge_costs (challenge_id,character_id,version_id,cost) VALUES ('daily-2026-10-07','naruto','naruto-six-paths',70)");
  db.exec("INSERT INTO squad_submissions (id,challenge_id,owner,name,strategy,total_cost,locked_at,removed,created,updated) VALUES ('sub','daily-2026-10-07','usr_a','Snapshot Squad','Historical values must remain stable.',70,NULL,0,1,1)");
  db.exec("INSERT INTO squad_submission_members (submission_id,position,character_id,version_id,character_name_snapshot,version_name_snapshot,cost_snapshot) VALUES ('sub',0,'naruto','naruto-six-paths','Naruto Uzumaki','Six Paths Naruto',70)");

  db.exec("UPDATE daily_squad_challenge_costs SET cost=76 WHERE challenge_id='daily-2026-10-07' AND version_id='naruto-six-paths'");
  db.exec("UPDATE squad_version_costs SET cost=76 WHERE version_id='naruto-six-paths'");
  const old=db.prepare("SELECT version_name_snapshot AS versionName,cost_snapshot AS cost FROM squad_submission_members WHERE submission_id='sub'").get();
  assert.deepEqual(old,{versionName:'Six Paths Naruto',cost:70});
  assert.equal(db.prepare("SELECT cost FROM daily_squad_challenge_costs WHERE challenge_id='daily-2026-10-07' AND version_id='naruto-six-paths'").get().cost,76);
 }finally{db.close()}
});

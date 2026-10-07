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
 'drizzle/0005_auth_accounts.sql'
];

function apply(db,file){
 const sql=readFileSync(file,'utf8');
 for(const statement of sql.split('--> statement-breakpoint').map(x=>x.trim()).filter(Boolean))db.exec(statement);
}

test('0005 migrates legacy ChatGPT ownership to one internal account',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  for(const file of migrations.slice(0,5))apply(db,file);
  db.exec(`
   INSERT INTO profiles (user,handle,display_name,bio,favorite_anime,favorite_characters,created,updated)
   VALUES ('legacy-user','legacy_fan','Legacy Fan','','[]','[]',10,20);
   INSERT INTO battles (id,owner,payload,created) VALUES ('b1','legacy-user','{}',10);
   INSERT INTO votes (battle,user,side,difficulty,reason,evidence,created)
   VALUES ('b1','legacy-user','a','mid','Legacy argument remains owned.','Episode 1',10);
   INSERT INTO progress (user,club,episode) VALUES ('legacy-user','jjk',3);
   INSERT INTO posts (id,user,club,episode,body,edited,deleted,created)
   VALUES ('p1','legacy-user','jjk',3,'Legacy discussion',0,0,10);
   INSERT INTO squads (id,owner,name,members,strategy,challenge,created)
   VALUES ('s1','legacy-user','Legacy squad','["goku","naruto","ichigo","luffy","levi"]','Legacy strategy text','day',10);
   INSERT INTO comments (id,battle,argument_user,user,body,created)
   VALUES ('c1','b1','legacy-user','legacy-user','Legacy comment',10);
   INSERT INTO reactions (subject_type,subject_id,user,reaction,created)
   VALUES ('argument','1','legacy-user','upvote',10);
   INSERT INTO argument_evidence (id,battle,argument_user,contributor,reference,context,created)
   VALUES ('ae1','b1','legacy-user','legacy-user','Episode 1','Legacy evidence',10);
   INSERT INTO notifications (id,user,kind,message,link,read,created)
   VALUES ('n1','legacy-user','reply','Legacy notice','/?battle=b1',0,10);
   INSERT INTO notifications (id,user,kind,message,link,read,created)
   VALUES ('n2','legacy-no-profile','reply','Owner without prior profile','/',0,10);
   INSERT INTO reports (id,reporter,subject_type,subject_id,reason,status,created)
   VALUES ('r1','legacy-user','post','p1','Legacy report','open',10);
   INSERT INTO watchlist (user,anime,status,created) VALUES ('legacy-user','dandadan','watching',10);
   INSERT INTO tournament_votes (week,match,user,pick,created) VALUES ('2026-W40','q1','legacy-user','goku',10);
   INSERT INTO evidence_records (id,character_id,version_id,ability_id,source_type,series,category,title,description,episode,timestamp,chapter,page,submitted_by,created,updated,deleted,deleted_at)
   VALUES ('e1','goku','goku-saiyan-saga','goku-kamehameha','anime','Dragon Ball','ability','Legacy feat','Legacy evidence remains attached after auth migration.',1,'00:10',NULL,NULL,'legacy-user',10,10,0,NULL);
   INSERT INTO argument_evidence_links (battle,argument_user,evidence_id,linked_by,created)
   VALUES ('b1','legacy-user','e1','legacy-user',10);
  `);
  apply(db,migrations[5]);

  const identity=db.prepare("SELECT user_id AS userId,provider,provider_user_id AS providerUserId FROM auth_identities WHERE provider='chatgpt' AND provider_user_id='legacy-user'").get();
  assert.ok(identity?.userId.startsWith('usr_'));
  assert.equal(identity.provider,'chatgpt');
  assert.equal(identity.providerUserId,'legacy-user');

  const id=identity.userId;
  assert.equal(db.prepare('SELECT user FROM profiles WHERE handle=?').get('legacy_fan').user,id);
  assert.equal(db.prepare("SELECT owner FROM battles WHERE id='b1'").get().owner,id);
  assert.equal(db.prepare("SELECT user FROM votes WHERE battle='b1'").get().user,id);
  assert.equal(db.prepare("SELECT user FROM posts WHERE id='p1'").get().user,id);
  assert.equal(db.prepare("SELECT owner FROM squads WHERE id='s1'").get().owner,id);
  assert.equal(db.prepare("SELECT user FROM comments WHERE id='c1'").get().user,id);
  assert.equal(db.prepare("SELECT argument_user AS argumentUser FROM comments WHERE id='c1'").get().argumentUser,id);
  assert.equal(db.prepare("SELECT contributor FROM argument_evidence WHERE id='ae1'").get().contributor,id);
  assert.equal(db.prepare("SELECT submitted_by AS submittedBy FROM evidence_records WHERE id='e1'").get().submittedBy,id);
  assert.equal(db.prepare("SELECT linked_by AS linkedBy FROM argument_evidence_links WHERE evidence_id='e1'").get().linkedBy,id);
  assert.equal(db.prepare("SELECT reporter FROM reports WHERE id='r1'").get().reporter,id);
  assert.equal(db.prepare("SELECT user FROM notifications WHERE id='n1'").get().user,id);
  assert.equal(db.prepare("SELECT user FROM watchlist WHERE anime='dandadan'").get().user,id);
  assert.equal(db.prepare("SELECT user FROM tournament_votes WHERE match='q1'").get().user,id);

  const account=db.prepare('SELECT email,email_verified AS emailVerified,profile_completed AS profileCompleted FROM users WHERE id=?').get(id);
  const noProfileIdentity=db.prepare("SELECT user_id AS userId FROM auth_identities WHERE provider='chatgpt' AND provider_user_id='legacy-no-profile'").get();
  const generatedProfile=db.prepare('SELECT handle,display_name AS displayName FROM profiles WHERE user=?').get(noProfileIdentity.userId);
  assert.match(generatedProfile.handle,/^animefan_[a-f0-9]+$/);
  assert.equal(generatedProfile.displayName,'Anime Fan');
  assert.equal(db.prepare('SELECT profile_completed AS profileCompleted FROM users WHERE id=?').get(noProfileIdentity.userId).profileCompleted,0);
  assert.equal(account.email,null);
  assert.equal(account.emailVerified,1);
  assert.equal(account.profileCompleted,1);
 }finally{db.close()}
});

test('0005 enforces auth token and identity uniqueness',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  for(const file of migrations)apply(db,file);
  db.exec("INSERT INTO users (id,email,email_normalized,email_verified,profile_completed,created,updated) VALUES ('usr_a','A@EXAMPLE.COM','a@example.com',0,1,1,1)");
  assert.throws(()=>db.exec("INSERT INTO users (id,email,email_normalized,email_verified,profile_completed,created,updated) VALUES ('usr_b','a@example.com','a@example.com',0,1,1,1)"));
  db.exec("INSERT INTO auth_identities (id,user_id,provider,provider_user_id,provider_email,credential_hash,created) VALUES ('i1','usr_a','email','a@example.com','a@example.com','hash',1)");
  assert.throws(()=>db.exec("INSERT INTO auth_identities (id,user_id,provider,provider_user_id,provider_email,credential_hash,created) VALUES ('i2','usr_a','email','a@example.com','a@example.com','hash2',1)"));
  db.exec("INSERT INTO auth_sessions (id,user_id,token_hash,created,expires,last_used) VALUES ('s1','usr_a','tokenhash',1,2,1)");
  assert.throws(()=>db.exec("INSERT INTO auth_sessions (id,user_id,token_hash,created,expires,last_used) VALUES ('s2','usr_a','tokenhash',1,2,1)"));
 }finally{db.close()}
});

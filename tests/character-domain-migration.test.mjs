import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';

const migrations=[
 'drizzle/0000_ambitious_the_enforcers.sql',
 'drizzle/0001_workable_hemingway.sql',
 'drizzle/0002_structured_battle_arena.sql',
 'drizzle/0003_structured_evidence.sql',
 'drizzle/0004_character_versions.sql'
];

function apply(db,file){
 const sql=readFileSync(file,'utf8');
 for(const statement of sql.split('--> statement-breakpoint').map(x=>x.trim()).filter(Boolean))db.exec(statement);
}

test('0004 preserves existing community rows and adds version relationships',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  for(const file of migrations.slice(0,4))apply(db,file);

  db.exec(`
   INSERT INTO profiles (user,handle,display_name,bio,favorite_anime,favorite_characters,created,updated) VALUES ('u1','tester','Tester','','[]','["naruto"]',1,1);
   INSERT INTO battles (id,owner,payload,created) VALUES ('legacy-battle','u1','{"fighterAId":"naruto","fighterBId":"goku","a":"Naruto Uzumaki","b":"Goku","versionA":"Sage Mode","versionB":"Super Saiyan","battleType":"knockout","location":"neutral_arena","speed":"equalized","knowledge":"none","prepTime":"none","transformationsAllowed":1,"standardEquipment":1}',1);
   INSERT INTO votes (battle,user,side,difficulty,reason,evidence,created) VALUES ('legacy-battle','u1','a','mid','Existing battle argument.','Legacy ref',1);
   INSERT INTO comments (id,battle,argument_user,user,body,created) VALUES ('c1','legacy-battle','u1','u1','Existing reply',1);
   INSERT INTO reactions (subject_type,subject_id,user,reaction,created) VALUES ('argument','1','u1','upvote',1);
   INSERT INTO argument_evidence (id,battle,argument_user,contributor,reference,context,created) VALUES ('ae1','legacy-battle','u1','u1','Episode 1','Existing manual evidence',1);
   INSERT INTO evidence_records (id,character_id,source_type,series,category,title,description,episode,timestamp,chapter,page,submitted_by,created,updated,deleted,deleted_at) VALUES ('e1','naruto','anime','Naruto','speed','Existing feat','Existing pre-version evidence remains readable.',1,'00:10',NULL,NULL,'u1',1,1,0,NULL);
   INSERT INTO squads (id,owner,name,members,strategy,challenge,created) VALUES ('s1','u1','Legacy Squad','["naruto","goku","ichigo","luffy","levi"]','Existing squad strategy.','day',1);
   INSERT INTO tournament_votes (week,match,user,pick,created) VALUES ('2026-W40','q1','u1','naruto',1);
  `);

  apply(db,migrations[4]);

  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM battles WHERE id='legacy-battle'").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM votes WHERE battle='legacy-battle'").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM comments WHERE id='c1'").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM reactions WHERE user='u1'").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM argument_evidence WHERE id='ae1'").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM profiles WHERE user='u1'").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM squads WHERE id='s1'").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM tournament_votes WHERE user='u1'").get().n,1);

  const oldEvidence=db.prepare("SELECT version_id AS versionId,ability_id AS abilityId FROM evidence_records WHERE id='e1'").get();
  assert.equal(oldEvidence.versionId,null);
  assert.equal(oldEvidence.abilityId,null);

  const sixPaths=db.prepare("SELECT character_id AS characterId,sort_order AS sortOrder,parent_version_id AS parentVersionId FROM character_versions WHERE id='naruto-six-paths'").get();
  assert.equal(sixPaths.characterId,'naruto');
  assert.equal(sixPaths.parentVersionId,'naruto-kcm');

  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM version_abilities WHERE version_id='naruto-six-paths' AND ability_id='naruto-truth-seeking-orbs'").get().n,1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM character_versions WHERE character_id='goku'").get().n>=9,true);

  db.exec("INSERT INTO evidence_records (id,character_id,version_id,ability_id,source_type,series,category,title,description,episode,timestamp,chapter,page,submitted_by,created,updated,deleted,deleted_at) VALUES ('e2','naruto','naruto-six-paths','naruto-truth-seeking-orbs','manga','Naruto','ability','Truth-Seeking Orbs feat','Version-scoped post-migration feat.',NULL,NULL,674,10,'u1',2,2,0,NULL)");
  const scoped=db.prepare("SELECT character_id AS characterId,version_id AS versionId,ability_id AS abilityId FROM evidence_records WHERE id='e2'").get();
  assert.deepEqual({...scoped},{characterId:'naruto',versionId:'naruto-six-paths',abilityId:'naruto-truth-seeking-orbs'});
 }finally{
  db.close();
 }
});

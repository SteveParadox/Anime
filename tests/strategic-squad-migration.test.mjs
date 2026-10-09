import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const files=readdirSync('drizzle').filter(name=>/^00\d\d.*\.sql$/.test(name)).sort();
function apply(db,path){
 for(const sql of readFileSync(path,'utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))db.exec(sql);
}
// Restore the historical database state before migration 0010. Migration 0011
// depends on tactical tables added by 0010, so it must not be applied first.
function seed(db){for(const name of files.filter(n=>Number(n.slice(0,4))<10))apply(db,'drizzle/'+name);}
test('append-only 0010 preserves old saved squads, votes, submissions and nullable tactical snapshots',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  seed(db);
  db.exec(`INSERT INTO squads (id,owner,name,members,strategy,challenge,created) VALUES ('legacy','person','Classic','["gojo","aizen"]','Original team','daily',1);
INSERT INTO daily_squad_challenges (id,type,title,description,budget,min_members,max_members,rules_json,starts_at,ends_at,status,created) VALUES ('before','open_build','Old','Legacy',100,1,5,'{}',1,9999999999999,'active',1);
INSERT INTO squad_submissions (id,challenge_id,owner,name,strategy,total_cost,removed,created,updated) VALUES ('old-sub','before','person','Old team','Legacy strategy',38,0,1,1);
INSERT INTO squad_submission_members (submission_id,position,character_id,version_id,character_name_snapshot,version_name_snapshot,cost_snapshot) VALUES ('old-sub',0,'gojo','gojo-shibuya','Gojo','Shibuya Gojo',38);`);
  apply(db,'drizzle/0010_strategic_squad_roles.sql');
  assert.deepEqual(JSON.parse(db.prepare("SELECT members FROM squads WHERE id='legacy'").get().members),['gojo','aizen']);
  const legacy=db.prepare("SELECT roles_snapshot AS roles, traits_snapshot AS traits,cost_snapshot AS cost FROM squad_submission_members WHERE submission_id='old-sub'").get();
  assert.equal(legacy.roles,null);assert.equal(legacy.traits,null);assert.equal(legacy.cost,38);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM squad_submissions WHERE id='old-sub'").get().n,1);
  apply(db,'drizzle/0011_add_more_combat_fighters.sql');
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM squad_submissions WHERE id='old-sub'").get().n,1);
  assert.equal(db.prepare("SELECT roles_snapshot AS roles FROM squad_submission_members WHERE submission_id='old-sub'").get().roles,null);
  assert.ok(db.prepare("SELECT COUNT(*) AS n FROM squad_version_costs WHERE version_id='sukuna-shibuya'").get().n===1);
 }finally{db.close()}
});
test('version-role mappings are constrained to valid versions, unique and supported roles',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  seed(db);apply(db,'drizzle/0010_strategic_squad_roles.sql');
  apply(db,'drizzle/0011_add_more_combat_fighters.sql');
  const aizen=db.prepare("SELECT role FROM version_combat_roles WHERE version_id='aizen-tybw' ORDER BY role").all().map(r=>r.role);
  const gojo=db.prepare("SELECT role FROM version_combat_roles WHERE version_id='gojo-shibuya' ORDER BY role").all().map(r=>r.role);
  assert.deepEqual(aizen,['controller','strategist']);assert.ok(gojo.includes('defense'));
  assert.ok(db.prepare("SELECT COUNT(*) AS n FROM version_strategic_traits WHERE version_id='aizen-tybw'").get().n>0);
  assert.throws(()=>db.exec("INSERT INTO version_combat_roles (version_id,role,priority) VALUES ('aizen-tybw','controller','primary')"));
  assert.throws(()=>db.exec("INSERT INTO version_combat_roles (version_id,role,priority) VALUES ('aizen-tybw','omnipotent','primary')"));
  assert.throws(()=>db.exec("INSERT INTO version_combat_roles (version_id,role,priority) VALUES ('missing-version','tank','primary')"));
  // An old snapshot stays absent even if the current catalog assignment changes.
  db.exec("UPDATE version_combat_roles SET priority='secondary' WHERE version_id='aizen-tybw' AND role='controller'");
  assert.equal(db.prepare("SELECT role FROM version_combat_roles WHERE version_id='aizen-tybw' AND priority='secondary'").get().role,'controller');
 }finally{db.close()}
});

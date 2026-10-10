import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('source migration preserves legacy evidence and supports expanded official-source metadata',async()=>{
 const db=new PGlite();
 try{
  await db.exec(await readFile('packages/database/migrations/0000_baseline.sql','utf8'));
  await db.query(`INSERT INTO evidence_records
    (id,character_id,source_type,series,category,title,description,episode,submitted_by,created,updated)
    VALUES ('legacy-1','naruto','anime','Naruto','speed','Legacy feat','Existing feat remains unchanged.',1,'contributor-1',1,1)`);
  await db.exec(await readFile('packages/database/migrations/0003_evidence_official_sources.sql','utf8'));
  const legacy=(await db.query("SELECT id,source_type,source_details,continuity_status FROM evidence_records WHERE id='legacy-1'")).rows[0];
  assert.deepEqual(legacy,{id:'legacy-1',source_type:'anime',source_details:{},continuity_status:'unknown'});
  await db.query(`INSERT INTO evidence_records
    (id,character_id,source_type,series,category,title,description,submitted_by,created,updated,source_title,source_location,source_details,continuity_status)
    VALUES ('game-1','naruto','game','Naruto','ability','Game-only move','Gameplay balance does not establish manga abilities.','contributor-1',2,2,'Fictional demo game','Mission 2',$1,'game')`,
   [JSON.stringify({developer:'Demo',publisher:'Demo',platform:'Console',sceneOrMission:'Mission 2',continuityClassification:'gameplay'})]);
  assert.equal((await db.query("SELECT source_type FROM evidence_records WHERE id='game-1'")).rows[0].source_type,'game');
  assert.equal((await db.query("SELECT count(*)::int AS n FROM evidence_records WHERE id='legacy-1'")).rows[0].n,1);
  await assert.rejects(db.query(`INSERT INTO evidence_records
    (id,character_id,source_type,series,category,title,description,submitted_by,created,updated)
    VALUES ('invalid','naruto','fan_wiki','Naruto','speed','Invalid','Unauthorized source type.','contributor-1',2,2)`),/evidence_source_type_check/);
 }finally{await db.close();}
});

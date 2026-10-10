import test from 'node:test';
import assert from 'node:assert/strict';

test('PostgreSQL: eligible Battle Arena votes finalize once, and sparse matches become no-contests',
 {skip:!process.env.TEST_DATABASE_URL&&'Requires migrated TEST_DATABASE_URL'},async()=>{
  process.env.NODE_ENV='development';
  process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
  process.env.APP_BASE_URL='http://localhost:3000';
  const {database}=await import('../src/db/raw.ts');
  const {finalizeBattle,finalizeDueBattles}=await import('../src/lib/battle-finalization.ts');
  const {closePool}=await import('@anime/database/client');
  const db=database(),now=Date.now(),tag=crypto.randomUUID(),owner='arena-'+tag,
   battleId='arena-a-'+tag,sparseId='arena-b-'+tag,invalidId='arena-invalid-'+tag,created=now-8*86_400_000;
  const payload={
   fighterAId:'naruto',fighterBId:'goku',
   fighterAVersionId:'naruto-six-paths',fighterBVersionId:'goku-saiyan-saga',
   fighterANameSnapshot:'Naruto Uzumaki',fighterBNameSnapshot:'Goku',
   fighterAVersionNameSnapshot:'Six Paths',fighterBVersionNameSnapshot:'Saiyan Saga',
   battleType:'knockout',location:'neutral_arena',speed:'equalized',
   knowledge:'none',prepTime:'none',transformationsAllowed:true,standardEquipment:true,notes:''
  };
  try{
   await db.prepare('INSERT INTO users(id,created,updated) VALUES (?,?,?)').bind(owner,now,now).run();
   for(const battle of [battleId,sparseId]){
    await db.prepare('INSERT INTO battles(id,owner,payload,created) VALUES (?,?,?,?)').bind(battle,owner,JSON.stringify(payload),created).run();
   }
   for(let i=0;i<10;i++){
    await db.prepare('INSERT INTO votes(battle,"user",side,difficulty,reason,evidence,created) VALUES (?,?,?,?,?,?,?)')
     .bind(battleId,owner+'-v'+i,i<7?'a':'b','mid','Verified historical argument '+i,'Chapter 670',created+60_000).run();
   }
   await db.prepare('INSERT INTO votes(battle,"user",side,difficulty,reason,evidence,created) VALUES (?,?,?,?,?,?,?)')
    .bind(sparseId,owner+'-s1','a','mid','Single voter argument','Chapter 670',created+60_000).run();
   const first=await finalizeBattle(db,battleId,owner,now);
   assert.equal(first.outcome,'a');
   assert.equal(first.status,'FINALIZED');
   assert.deepEqual(first.counts,{a:7,b:3,draw:0});
   await assert.rejects(finalizeBattle(db,battleId,owner,now),/already finalized/);
   const row=await db.prepare('SELECT fighter_a_version_id AS fighterAVersionId,votes_a AS votesA,status FROM battle_results WHERE battle_id=?').bind(battleId).first();
   assert.equal(row.fighterAVersionId,'naruto-six-paths');
   assert.equal(Number(row.votesA),7);
   assert.equal(row.status,'FINALIZED');
   const sparse=await finalizeBattle(db,sparseId,owner,now);
   assert.equal(sparse.outcome,'no_contest');
   assert.equal(sparse.status,'NO_CONTEST');
   assert.equal((await db.prepare('SELECT COUNT(*)::int AS n FROM battle_results WHERE battle_id IN (?,?)').bind(battleId,sparseId).first()).n,2);
   assert.equal((await db.prepare('SELECT COUNT(*)::int AS n FROM battle_result_audit WHERE battle_id=?').bind(battleId).first()).n,1);

   // Ineligible historical battles must not starve future worker batches.
   await db.prepare('INSERT INTO battles(id,owner,payload,created) VALUES (?,?,?,?)')
    .bind(invalidId,owner,JSON.stringify({...payload,fighterAId:'unknown-fighter'}),created+1).run();
   const sweep=await finalizeDueBattles(now);
   assert.ok(sweep.inspected>=1);
   const exclusion=await db.prepare('SELECT reason FROM battle_finalization_skips WHERE battle_id=?').bind(invalidId).first();
   assert.match(exclusion?.reason||'',/not eligible|Invalid persisted/i);
   assert.equal((await db.prepare('SELECT id FROM battles b LEFT JOIN battle_finalization_skips s ON s.battle_id=b.id WHERE b.id=? AND s.battle_id IS NULL').bind(invalidId).first()),undefined);

  }finally{
   await db.prepare('DELETE FROM battle_result_audit WHERE battle_id IN (?,?)').bind(battleId,sparseId).run();
   await db.prepare('DELETE FROM battle_results WHERE battle_id IN (?,?)').bind(battleId,sparseId).run();
   await db.prepare('DELETE FROM votes WHERE battle IN (?,?)').bind(battleId,sparseId).run();
   await db.prepare('DELETE FROM battles WHERE id IN (?,?,?)').bind(battleId,sparseId,invalidId).run();
   await db.prepare('DELETE FROM users WHERE id=?').bind(owner).run();
   await closePool();
  }
 });

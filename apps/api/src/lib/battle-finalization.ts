import {database,type DatabaseClient} from '@/db/raw';
import {fighters} from '@anime/domain/catalog';
import {normalizeBattle} from '@anime/domain/battle';
import {validateBattleVersionSelection} from '@anime/domain/characters';
import {BATTLE_POLICY_VERSION,battleVotingEndsAt,resolveCommunityVerdict} from '@anime/domain/battle-analytics';

const invalid=(message:string,status=409)=>Object.assign(new Error(message),{status});
type BattleRow={id:string;payload:string;created:number};

export async function finalizeBattle(db:DatabaseClient,battleId:string,actor:string,now=Date.now()){
 return db.transaction(async tx=>{
  // Vote submission also locks this row before mutating votes.  This keeps the
  // vote snapshot and the result unique even across multiple Railway workers.
  const row=await tx.prepare('SELECT id,payload,created FROM battles WHERE id=? FOR UPDATE').bind(battleId).first<BattleRow>();
  if(!row)throw invalid('Only persisted battles may be finalized.',404);
  if(now<battleVotingEndsAt(Number(row.created)))throw invalid('Voting is still open.');
  if(await tx.prepare('SELECT 1 FROM battle_results WHERE battle_id=?').bind(battleId).first())throw invalid('Battle already finalized.');
  let battle:ReturnType<typeof normalizeBattle>;
  try{battle=normalizeBattle({...JSON.parse(row.payload),id:row.id,created:Number(row.created)});}
  catch{throw invalid('Invalid persisted battle payload.',422);}
  if(battle.isLegacy||battle.isLegacyVersion||battle.fighterAId===battle.fighterBId||
     !fighters.some(f=>f.id===battle.fighterAId)||!fighters.some(f=>f.id===battle.fighterBId)||
     !validateBattleVersionSelection(battle.fighterAId,battle.fighterAVersionId,battle.fighterBId,battle.fighterBVersionId))
   throw invalid('Battle is not eligible for official statistics because its fighter versions cannot be verified.',422);
  const votes=(await tx.prepare('SELECT side,difficulty FROM votes WHERE battle=? AND created<=?').bind(row.id,battleVotingEndsAt(Number(row.created))).all<{side:string;difficulty:string|null}>()).results;
  const counts={a:0,b:0,draw:0},difficulty:Record<string,number>={};
  for(const vote of votes){
   if(vote.side!=='a'&&vote.side!=='b'&&vote.side!=='draw')continue;
   counts[vote.side]++;
   if(vote.difficulty){const k=vote.side+':'+vote.difficulty;difficulty[k]=(difficulty[k]||0)+1;}
  }
  const outcome=resolveCommunityVerdict(counts),status=outcome==='no_contest'?'NO_CONTEST':'FINALIZED';
  await tx.prepare(`INSERT INTO battle_results(battle_id,fighter_a_id,fighter_a_version_id,fighter_b_id,fighter_b_version_id,conditions_json,outcome,status,source_type,votes_a,votes_b,votes_draw,difficulty_json,scoring_version,finalized_at,finalized_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
   .bind(row.id,battle.fighterAId,battle.fighterAVersionId,battle.fighterBId,battle.fighterBVersionId,JSON.stringify(battle),outcome,status,'COMMUNITY_VERDICT',counts.a,counts.b,counts.draw,JSON.stringify(difficulty),BATTLE_POLICY_VERSION,now,actor).run();
  await tx.prepare('INSERT INTO battle_result_audit(id,battle_id,action,actor_user_id,reason,snapshot_json,created_at) VALUES (?,?,?,?,?,?,?)')
   .bind(crypto.randomUUID(),row.id,'FINALIZE',actor,'Voting deadline passed',JSON.stringify({outcome,status,counts,policyVersion:BATTLE_POLICY_VERSION}),now).run();
  return {battleId:row.id,outcome,status,counts};
 });
}

/** Bounded and repeatable.  One worker cannot finalize a battle twice. */
export async function finalizeDueBattles(now=Date.now()){
 const db=database();
 const due=(await db.prepare(`SELECT b.id FROM battles b LEFT JOIN battle_results r ON r.battle_id=b.id LEFT JOIN battle_finalization_skips s ON s.battle_id=b.id WHERE r.battle_id IS NULL AND s.battle_id IS NULL AND b.created<=? ORDER BY b.created DESC LIMIT 60`).bind(now-7*86_400_000).all<{id:string}>()).results;
 let finalized=0,skipped=0;
 for(const candidate of due){
  try{await finalizeBattle(db,candidate.id,'system:challenge-worker',now);finalized++;}
  catch(e){
   // Legacy character-only battles are intentionally excluded; report rather than
   // guessing versions or forging results for them.
   skipped++;
   if((e as {status?:number}).status===422){
    // Permanently ineligible legacy/invalid battles should not starve older
    // eligible battles. The exclusion is durable and explicitly auditable.
    await db.prepare('INSERT INTO battle_finalization_skips(battle_id,reason,recorded_at) VALUES (?,?,?) ON CONFLICT(battle_id) DO NOTHING')
     .bind(candidate.id,e instanceof Error?e.message:'Ineligible battle',now).run();
   }else if((e as {status?:number}).status!==409){
    console.error('Battle finalization failed',candidate.id,e);
   }
  }
 }
 return {inspected:due.length,finalized,skipped};
}

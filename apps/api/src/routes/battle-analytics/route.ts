import {z} from 'zod';
import {database,type DatabaseClient} from '@/db/raw';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';
import {getCurrentUser,isAdminUser,canContribute} from '@/lib/auth';
import {checkRateLimit} from '@/lib/auth-rate-limit';
import {fighters} from '@anime/domain/catalog';
import {versionById,validateBattleVersionSelection} from '@anime/domain/characters';
import {normalizeBattle} from '@anime/domain/battle';
import {BATTLE_POLICY_VERSION,MIN_OFFICIAL_VOTES,battleVotingEndsAt,resolveCommunityVerdict,communityWinRate,communityVoteMargin,communityControversy} from '@anime/domain/battle-analytics';

const id=z.string().trim().min(1).max(180);
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('finalize'),battleId:id}).strict(),
 z.object({action:z.literal('void'),battleId:id,reason:z.string().trim().min(10).max(600)}).strict(),
 z.object({action:z.literal('rematch'),battleId:id,fighterAVersionId:id.optional(),fighterBVersionId:id.optional(),notes:z.string().trim().max(1000).optional()}).strict(),
 z.object({action:z.literal('create_collection'),title:z.string().trim().min(3).max(100),description:z.string().trim().max(600).default(''),visibility:z.enum(['public','private']).default('private')}).strict(),
 z.object({action:z.literal('set_collection_visibility'),collectionId:id,visibility:z.enum(['public','private'])}).strict(),
 z.object({action:z.literal('add_to_collection'),collectionId:id,battleId:id}).strict(),
 z.object({action:z.literal('remove_from_collection'),collectionId:id,battleId:id}).strict(),
 z.object({action:z.literal('delete_collection'),collectionId:id}).strict()
]);

type StoredBattle={id:string;payload:string;created:number};
type ResultRow={battleId:string;fighterAId:string;fighterAVersionId:string;fighterBId:string;fighterBVersionId:string;outcome:string;status:string;votesA:number;votesB:number;votesDraw:number;finalizedAt:number;conditionsJson:string;difficultyJson:string};
const fail=(message:string,status=409)=>Object.assign(new Error(message),{status});
const number=(v:unknown)=>Number(v||0);
const fighter=(idValue:string)=>fighters.find(f=>f.id===idValue);
const permittedId=(value:string|null)=>value&&id.safeParse(value).success?value:null;
function displayResult(row:ResultRow){
 return {...row,votesA:number(row.votesA),votesB:number(row.votesB),votesDraw:number(row.votesDraw),
  finalizedAt:number(row.finalizedAt),
  fighterA:fighter(row.fighterAId)?.name||row.fighterAId,
  fighterB:fighter(row.fighterBId)?.name||row.fighterBId,
  versionA:versionById(row.fighterAVersionId)?.name||'Unknown historical version',
  versionB:versionById(row.fighterBVersionId)?.name||'Unknown historical version',
  voteMargin:communityVoteMargin({a:number(row.votesA),b:number(row.votesB),draw:number(row.votesDraw)})};
}
async function resultRows(db:DatabaseClient,limit=500):Promise<ResultRow[]>{
 return (await db.prepare(`SELECT battle_id AS battleId,fighter_a_id AS fighterAId,fighter_a_version_id AS fighterAVersionId,fighter_b_id AS fighterBId,fighter_b_version_id AS fighterBVersionId,outcome,status,votes_a AS votesA,votes_b AS votesB,votes_draw AS votesDraw,finalized_at AS finalizedAt,conditions_json AS conditionsJson,difficulty_json AS difficultyJson FROM battle_results WHERE status='FINALIZED' ORDER BY finalized_at DESC LIMIT ?`).bind(limit).all<ResultRow>()).results;
}
function sideFor(row:ResultRow,characterId:string):'a'|'b'|null{return row.fighterAId===characterId?'a':row.fighterBId===characterId?'b':null;}
function record(rows:ResultRow[],characterId:string){
 const matching=rows.filter(row=>row.fighterAId===characterId||row.fighterBId===characterId);
 let wins=0,losses=0,draws=0;
 const versions=new Map<string,{versionId:string;wins:number;losses:number;draws:number}>();
 for(const row of matching){
  const side=sideFor(row,characterId)!;
  const versionId=side==='a'?row.fighterAVersionId:row.fighterBVersionId;
  const v=versions.get(versionId)||{versionId,wins:0,losses:0,draws:0};
  const key=row.outcome==='draw'?'draws':row.outcome===side?'wins':'losses';
  v[key]++;versions.set(versionId,v);
  if(key==='wins')wins++;else if(key==='losses')losses++;else draws++;
 }
 return {characterId,name:fighter(characterId)?.name||characterId,wins,losses,draws,
  total:wins+losses+draws,winRate:communityWinRate(wins,losses,draws),
  versions:[...versions.values()].map(v=>({...v,name:versionById(v.versionId)?.name||'Unknown historical version',winRate:communityWinRate(v.wins,v.losses,v.draws)})),
  recent:matching.slice(0,15).map(displayResult)};
}
function highlights(rows:ResultRow[]){
 return rows.filter(row=>number(row.votesA)+number(row.votesB)+number(row.votesDraw)>=MIN_OFFICIAL_VOTES).map(row=>{
  const a=number(row.votesA),b=number(row.votesB),draw=number(row.votesDraw),counts={a,b,draw};
  return {...displayResult(row),closeness:100-(communityVoteMargin(counts)||0),controversy:communityControversy(counts,0,0)};
 });
}
function publicBattle(row:StoredBattle){
 const b=normalizeBattle({...JSON.parse(row.payload),id:row.id,created:number(row.created)});
 return b;
}
export async function GET(request:Request){
 try{
  const db=database(),url=new URL(request.url),mode=url.searchParams.get('mode')||'leaderboard',battleId=permittedId(url.searchParams.get('battleId')),characterId=permittedId(url.searchParams.get('characterId'));
  if(['record','matchup'].includes(mode)&&(!characterId||!fighter(characterId)))return authJson({error:'A valid characterId is required.'},400);
  if(['battle','similar','rematches'].includes(mode)&&!battleId)return authJson({error:'A valid battleId is required.'},400);
  if(mode==='battle'){
   const result=await db.prepare(`SELECT battle_id AS battleId,fighter_a_id AS fighterAId,fighter_a_version_id AS fighterAVersionId,fighter_b_id AS fighterBId,fighter_b_version_id AS fighterBVersionId,outcome,status,votes_a AS votesA,votes_b AS votesB,votes_draw AS votesDraw,finalized_at AS finalizedAt,conditions_json AS conditionsJson,difficulty_json AS difficultyJson FROM battle_results WHERE battle_id=?`).bind(battleId).first<ResultRow>();
   const b=await db.prepare('SELECT id,payload,created FROM battles WHERE id=?').bind(battleId).first<StoredBattle>();
   if(!b)return authJson({error:'Only persisted community battles have official results.'},404);
   return authJson({battle:publicBattle(b),votingEndsAt:battleVotingEndsAt(number(b.created)),result:result?displayResult(result):null,official:!!result&&result.status==='FINALIZED'});
  }
  if(mode==='rematches'){
   const edges=(await db.prepare('SELECT original_battle_id AS originalBattleId,rematch_battle_id AS rematchBattleId,created_at AS createdAt FROM battle_rematches WHERE original_battle_id=? OR rematch_battle_id=? ORDER BY created_at DESC LIMIT 100').bind(battleId,battleId).all()).results;
   return authJson({rematches:edges});
  }
  if(mode==='collections'){
   const user=await getCurrentUser(),collectionId=permittedId(url.searchParams.get('collectionId'));
   if(url.searchParams.has('collectionId')&&!collectionId)return authJson({error:'Invalid collection ID.'},400);
   if(collectionId){
    const collection=await db.prepare(`SELECT id,owner_user_id AS ownerUserId,title,description,visibility,created_at AS createdAt,updated_at AS updatedAt FROM battle_collections WHERE id=? AND (visibility='public' OR owner_user_id=?)`).bind(collectionId,user?.userId||'').first<any>();
    if(!collection)return authJson({error:'Collection not found.'},404);
    const items=(await db.prepare('SELECT battle_id AS battleId,position FROM battle_collection_items WHERE collection_id=? ORDER BY position,battle_id LIMIT 200').bind(collectionId).all()).results;
    return authJson({collection,items});
   }
   const collections=(await db.prepare(`SELECT id,owner_user_id AS ownerUserId,title,description,visibility,created_at AS createdAt,updated_at AS updatedAt FROM battle_collections WHERE visibility='public' OR owner_user_id=? ORDER BY updated_at DESC LIMIT 100`).bind(user?.userId||'').all()).results;
   return authJson({collections});
  }
  if(mode==='similar'){
   const original=await db.prepare('SELECT id,payload,created FROM battles WHERE id=?').bind(battleId).first<StoredBattle>();
   if(!original)return authJson({error:'Battle not found.'},404);
   const source=publicBattle(original),others=(await db.prepare('SELECT id,payload,created FROM battles WHERE id<>? ORDER BY created DESC LIMIT 250').bind(battleId).all<StoredBattle>()).results;
   const recommendations=others.flatMap(row=>{try{
    const b=publicBattle(row);
    const sameFighters=[source.fighterAId,source.fighterBId].filter(idValue=>idValue===b.fighterAId||idValue===b.fighterBId).length;
    const sameVersions=[source.fighterAVersionId,source.fighterBVersionId].filter(idValue=>idValue===b.fighterAVersionId||idValue===b.fighterBVersionId).length;
    const score=sameFighters*30+sameVersions*15+(b.speed===source.speed?10:0)+(b.battleType===source.battleType?10:0)+(b.location===source.location?5:0);
    return score?[{battle:b,score,reason:sameFighters?'Shared fighter or rival':'Similar battle rules'}]:[];
   }catch{return []}});
   recommendations.sort((a,b)=>b.score-a.score||b.battle.created-a.battle.created);
   return authJson({recommendations:recommendations.slice(0,8)});
  }
  // Bounded official result set; no legacy or unfinished poll is ever counted.
  const rows=await resultRows(db,10000);
  if(mode==='record')return authJson({record:record(rows,characterId!)});
  if(mode==='matchup'){
   const opponentId=permittedId(url.searchParams.get('opponentId'));
   if(!opponentId||!fighter(opponentId)||opponentId===characterId)return authJson({error:'A different valid opponentId is required.'},400);
   const matching=rows.filter(row=>(row.fighterAId===characterId&&row.fighterBId===opponentId)||(row.fighterAId===opponentId&&row.fighterBId===characterId));
   return authJson({characterId,opponentId,total:matching.length,battles:matching.slice(0,100).map(displayResult)});
  }
  if(mode==='leaderboard'){
   const records=fighters.map(f=>record(rows,f.id)).filter(r=>r.total>=3);
   records.sort((a,b)=>(b.winRate||0)-(a.winRate||0)||b.total-a.total||a.characterId.localeCompare(b.characterId));
   return authJson({minimumEligibleBattles:3,policyVersion:BATTLE_POLICY_VERSION,leaderboard:records.slice(0,100).map((r,i)=>({...r,rank:i+1,recent:undefined,versions:undefined}))});
  }
  if(mode==='highlights'){
   const entries=highlights(rows);
   return authJson({closest:[...entries].filter(e=>e.outcome!=='draw').sort((a,b)=>a.voteMargin!-b.voteMargin!||b.votesA+b.votesB-a.votesA-a.votesB).slice(0,20),
    landslides:[...entries].filter(e=>e.outcome!=='draw').sort((a,b)=>b.voteMargin!-a.voteMargin!).slice(0,20),
    controversial:[...entries].sort((a,b)=>b.controversy-a.controversy).slice(0,20),
    draws:entries.filter(e=>e.outcome==='draw').slice(0,20)});
  }
  return authJson({error:'Unsupported Battle Arena analytics mode.'},400);
 }catch(error){console.error('Battle analytics load failed',error);return authJson({error:'Unable to load battle analytics.'},503);}
}

export async function POST(request:Request){
 if(!sameOrigin(request))return authJson({error:'Cross-origin request rejected.'},403);
 try{
  const input=schema.parse(await readJson(request,8_000)),user=await getCurrentUser(),db=database(),now=Date.now();
  if(!user)return authJson({error:'Sign in first.'},401);
  if(!canContribute(user))return authJson({error:'Verify your email and complete your profile.'},403);
  const limited=await checkRateLimit('battle-analytics-write',user.userId,30,60_000);
  if(!limited.allowed)return authJson({error:'Too many requests.'},429,{'Retry-After':String(limited.retryAfterSeconds)});
  if(input.action==='finalize'){
   if(!isAdminUser(user))return authJson({error:'Admin access required.'},403);
   const result=await db.transaction(async tx=>{
    const row=await tx.prepare('SELECT id,payload,created FROM battles WHERE id=? FOR UPDATE').bind(input.battleId).first<StoredBattle>();
    if(!row)throw fail('Only persisted battles may be finalized.',404);
    if(now<battleVotingEndsAt(number(row.created)))throw fail('Voting is still open.');
    if(await tx.prepare('SELECT 1 FROM battle_results WHERE battle_id=?').bind(input.battleId).first())throw fail('Battle already finalized.');
    const b=publicBattle(row);
    if(b.isLegacy||b.isLegacyVersion||b.fighterAId===b.fighterBId||!fighter(b.fighterAId)||!fighter(b.fighterBId)||!validateBattleVersionSelection(b.fighterAId,b.fighterAVersionId,b.fighterBId,b.fighterBVersionId))throw fail('Battle has invalid or legacy fighter versions.');
    const voteRows=(await tx.prepare('SELECT side,difficulty FROM votes WHERE battle=? AND created<=?').bind(row.id,battleVotingEndsAt(number(row.created))).all<{side:string;difficulty:string|null}>()).results;
    const counts={a:0,b:0,draw:0},difficulty:Record<string,number>={};
    for(const vote of voteRows){
     if(vote.side!=='a'&&vote.side!=='b'&&vote.side!=='draw')continue;
     counts[vote.side]++;
     if(vote.difficulty){const key=vote.side+':'+vote.difficulty;difficulty[key]=(difficulty[key]||0)+1;}
    }
    const outcome=resolveCommunityVerdict(counts),status=outcome==='no_contest'?'NO_CONTEST':'FINALIZED';
    const conditionsJson=JSON.stringify(b),difficultyJson=JSON.stringify(difficulty);
    await tx.prepare(`INSERT INTO battle_results(battle_id,fighter_a_id,fighter_a_version_id,fighter_b_id,fighter_b_version_id,conditions_json,outcome,status,source_type,votes_a,votes_b,votes_draw,difficulty_json,scoring_version,finalized_at,finalized_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
     .bind(row.id,b.fighterAId,b.fighterAVersionId,b.fighterBId,b.fighterBVersionId,conditionsJson,outcome,status,'COMMUNITY_VERDICT',counts.a,counts.b,counts.draw,difficultyJson,BATTLE_POLICY_VERSION,now,user.userId).run();
    await tx.prepare('INSERT INTO battle_result_audit(id,battle_id,action,actor_user_id,reason,snapshot_json,created_at) VALUES (?,?,?,?,?,?,?)')
     .bind(crypto.randomUUID(),row.id,'FINALIZE',user.userId,'Voting deadline passed',JSON.stringify({outcome,status,counts,policyVersion:BATTLE_POLICY_VERSION}),now).run();
    return {battleId:row.id,outcome,status,counts};
   });
   return authJson({ok:true,result},201);
  }
  if(input.action==='void'){
   if(!isAdminUser(user))return authJson({error:'Admin access required.'},403);
   await db.transaction(async tx=>{
    const row=await tx.prepare('SELECT battle_id,status FROM battle_results WHERE battle_id=? FOR UPDATE').bind(input.battleId).first<{battle_id:string;status:string}>();
    if(!row||row.status==='VOIDED')throw fail('No active finalized result to void.',404);
    await tx.prepare(`UPDATE battle_results SET status='VOIDED',voided_at=?,void_reason=? WHERE battle_id=?`).bind(now,input.reason,input.battleId).run();
    await tx.prepare('INSERT INTO battle_result_audit(id,battle_id,action,actor_user_id,reason,snapshot_json,created_at) VALUES (?,?,?,?,?,?,?)')
     .bind(crypto.randomUUID(),input.battleId,'VOID',user.userId,input.reason,JSON.stringify(row),now).run();
   });
   return authJson({ok:true});
  }
  if(input.action==='rematch'){
   const limited=await checkRateLimit('battle-rematch',user.userId,8,60_000);
   if(!limited.allowed)return authJson({error:'Rematch rate limit reached.'},429);
   const original=await db.prepare('SELECT id,payload,created FROM battles WHERE id=?').bind(input.battleId).first<StoredBattle>();
   if(!original)return authJson({error:'Original persisted battle not found.'},404);
   const b=publicBattle(original),versionA=input.fighterAVersionId||b.fighterAVersionId,versionB=input.fighterBVersionId||b.fighterBVersionId;
   if(b.isLegacy||!versionById(versionA)||!versionById(versionB)||!validateBattleVersionSelection(b.fighterAId,versionA,b.fighterBId,versionB))return authJson({error:'Rematches need valid versions for both fighters.'},400);
   const newId=crypto.randomUUID(),next={...JSON.parse(original.payload),fighterAVersionId:versionA,fighterBVersionId:versionB,fighterAVersionNameSnapshot:versionById(versionA)!.name,fighterBVersionNameSnapshot:versionById(versionB)!.name,notes:input.notes??b.notes};
   await db.transaction(async tx=>{
    await tx.prepare('INSERT INTO battles(id,owner,payload,created) VALUES (?,?,?,?)').bind(newId,user.userId,JSON.stringify(next),now).run();
    await tx.prepare('INSERT INTO battle_rematches(original_battle_id,rematch_battle_id,created_by,created_at) VALUES (?,?,?,?)').bind(input.battleId,newId,user.userId,now).run();
   });
   return authJson({ok:true,id:newId,originalBattleId:input.battleId},201);
  }
  if(input.action==='create_collection'){
   const collectionId=crypto.randomUUID();
   await db.prepare('INSERT INTO battle_collections(id,owner_user_id,title,description,visibility,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').bind(collectionId,user.userId,input.title,input.description,input.visibility,now,now).run();
   return authJson({ok:true,id:collectionId},201);
  }
  const collectionId=input.collectionId;
  const collection=await db.prepare('SELECT id,owner_user_id AS ownerUserId FROM battle_collections WHERE id=?').bind(collectionId).first<{id:string;ownerUserId:string}>();
  if(!collection)return authJson({error:'Collection not found.'},404);
  if(collection.ownerUserId!==user.userId&&!isAdminUser(user))return authJson({error:'Only the collection owner may modify it.'},403);
  if(input.action==='delete_collection'){
   await db.prepare('DELETE FROM battle_collections WHERE id=?').bind(collectionId).run();return authJson({ok:true});
  }
  if(input.action==='set_collection_visibility'){
   await db.prepare('UPDATE battle_collections SET visibility=?,updated_at=? WHERE id=?').bind(input.visibility,now,collectionId).run();return authJson({ok:true});
  }
  if(input.action==='add_to_collection'){
   if(!await db.prepare('SELECT 1 FROM battles WHERE id=?').bind(input.battleId).first())return authJson({error:'Battle not found.'},404);
   await db.transaction(async tx=>{
    const position=await tx.prepare('SELECT COALESCE(MAX(position),-1)+1 AS next FROM battle_collection_items WHERE collection_id=?').bind(collectionId).first<{next:number}>();
    await tx.prepare('INSERT INTO battle_collection_items(collection_id,battle_id,position,added_at) VALUES (?,?,?,?) ON CONFLICT DO NOTHING').bind(collectionId,input.battleId,number(position?.next),now).run();
    await tx.prepare('UPDATE battle_collections SET updated_at=? WHERE id=?').bind(now,collectionId).run();
   });
   return authJson({ok:true});
  }
  if(input.action==='remove_from_collection'){
   await db.transaction(async tx=>{
    await tx.prepare('DELETE FROM battle_collection_items WHERE collection_id=? AND battle_id=?').bind(collectionId,input.battleId).run();
    await tx.prepare('UPDATE battle_collections SET updated_at=? WHERE id=?').bind(now,collectionId).run();
   });
   return authJson({ok:true});
  }
  return authJson({error:'Unsupported action.'},400);
 }catch(error){
  const e=error as Error & {status?:number};
  if(typeof e.status==='number')return authJson({error:e.message},e.status);
  if(error instanceof z.ZodError)return authJson({error:'Invalid battle analytics request.'},400);
  console.error('Battle analytics mutation failed',error);return authJson({error:'Unable to save Battle Arena change.'},503);
 }
}

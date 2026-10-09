import {database,type DatabaseClient} from '@/db/raw';
import {createHash} from 'node:crypto';
import {challengeDefinitionSchema,type ChallengeDefinitionInput} from '@anime/contracts/advanced-challenge';
import {eligibleRoster,feasibleRoster} from '@/lib/advanced-challenge';
import {ensureDailyChallenge} from '@/lib/squad-challenge';

export type DefinitionRow={id:string;creatorUserId:string;sourceType:'admin'|'community'|'generated';status:string;title:string;description:string;difficulty:string;type:string;targetCharacterId:string|null;targetVersionId:string|null;budget:number;minMembers:number;maxMembers:number;rulesJson:string;objectiveJson:string;rulesVersion:number;startsAt:number|null;endsAt:number|null;votingEndsAt:number|null;publishedChallengeId:string|null;createdAt:number;updatedAt:number};
export const DEFINITION_SELECT=`id,creator_user_id AS creatorUserId,source_type AS sourceType,status,title,description,difficulty,type,target_character_id AS targetCharacterId,target_version_id AS targetVersionId,budget,min_members AS minMembers,max_members AS maxMembers,rules_json AS rulesJson,objective_json AS objectiveJson,rules_version AS rulesVersion,starts_at AS startsAt,ends_at AS endsAt,voting_ends_at AS votingEndsAt,published_challenge_id AS publishedChallengeId,created_at AS createdAt,updated_at AS updatedAt`;
const invalid=(message:string)=>Object.assign(new Error(message),{status:409});

export function inputFor(row:DefinitionRow):ChallengeDefinitionInput{
 return challengeDefinitionSchema.parse({title:row.title,description:row.description,difficulty:row.difficulty,
  objective:JSON.parse(row.objectiveJson),budget:Number(row.budget),minMembers:Number(row.minMembers),maxMembers:Number(row.maxMembers),
  restrictions:JSON.parse(row.rulesJson).restrictions,startsAt:row.startsAt===null?undefined:Number(row.startsAt),endsAt:row.endsAt===null?undefined:Number(row.endsAt)});
}
export async function readDefinition(db:DatabaseClient,id:string,lock=false){
 return await db.prepare(`SELECT ${DEFINITION_SELECT} FROM challenge_definitions WHERE id=? ${lock?'FOR UPDATE':''}`).bind(id).first<DefinitionRow>()||null;
}
export async function auditTransition(db:DatabaseClient,row:DefinitionRow,next:string,actor:string|null,note:string,now:number){
 const updated=await db.prepare('UPDATE challenge_definitions SET status=?,updated_at=? WHERE id=? AND status=?').bind(next,now,row.id,row.status).run();
 if(!updated.meta.changes)throw invalid('Challenge changed concurrently. Reload it.');
 await db.prepare('INSERT INTO challenge_lifecycle_audit(id,definition_id,actor_user_id,from_status,to_status,note,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),row.id,actor,row.status,next,note,now).run();
}

export async function publishDefinition(db:DatabaseClient,id:string,actor:string|null,now:number){
 const row=await readDefinition(db,id,true);
 if(!row)throw invalid('Challenge definition not found.');
 if(row.publishedChallengeId)return row.publishedChallengeId;
 if(!['approved','selected','scheduled'].includes(row.status)||row.sourceType==='community'&&row.status!=='scheduled')throw invalid('Challenge is not approved and selected for publication.');
 const input=inputFor(row);
 const startsAt=row.startsAt===null?now:Number(row.startsAt),endsAt=row.endsAt===null?startsAt+86_400_000:Number(row.endsAt);
 if(startsAt>now||endsAt<=now)throw invalid('Challenge publication window is not active.');
 const overlap=await db.prepare(`SELECT id FROM daily_squad_challenges WHERE source_type<>'rotation' AND status<>'closed' AND starts_at<? AND ends_at>? LIMIT 1`).bind(endsAt,startsAt).first<{id:string}>();
 if(overlap)throw invalid('Another official challenge overlaps this publication window.');
 const reserved=await db.prepare("SELECT id FROM challenge_definitions WHERE id<>? AND status='scheduled' AND starts_at<? AND ends_at>? LIMIT 1").bind(row.id,endsAt,startsAt).first<{id:string}>();
 if(reserved)throw invalid('A scheduled official challenge reserves part of this publication window.');
 const feasible=await feasibleRoster(db,input);
 if(!feasible.feasible)throw invalid(feasible.reason);
 const eligible=await eligibleRoster(db,input);
 const balanceVersion=createHash('sha256').update(JSON.stringify(eligible.map(m=>[m.versionId,m.cost,m.roles,m.traits]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))))).digest('hex');
 const target=input.objective.type==='defeat_target'?input.objective.boss:input.objective.type==='defend'?input.objective.protectedTarget:input.objective.type==='rescue'?input.objective.rescueTarget:null;
 const challengeId=`official-${row.id}`;
 await db.prepare(`INSERT INTO daily_squad_challenges (id,type,title,description,target_character_id,target_version_id,budget,min_members,max_members,rules_json,objective_json,starts_at,ends_at,status,created,source_type,definition_id,rules_version,scoring_version,balance_version,tactical_analysis_version,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(challengeId,row.type,row.title,row.description,target?.characterId||null,target?.versionId||null,row.budget,row.minMembers,row.maxMembers,JSON.stringify({restrictions:input.restrictions}),row.objectiveJson,startsAt,endsAt,'scheduled',row.createdAt,row.sourceType,row.id,row.rulesVersion,1,balanceVersion,1,null).run();
 for(const member of eligible)await db.prepare('INSERT INTO daily_squad_challenge_costs (challenge_id,character_id,version_id,cost,roles_snapshot,traits_snapshot) VALUES (?,?,?,?,?,?)').bind(challengeId,member.characterId,member.versionId,member.cost,JSON.stringify(member.roles),JSON.stringify(member.traits)).run();
 await db.prepare("UPDATE daily_squad_challenges SET status='active',published_at=? WHERE id=?").bind(now,challengeId).run();
 await db.prepare('UPDATE challenge_definitions SET published_challenge_id=?,starts_at=?,ends_at=? WHERE id=?').bind(challengeId,startsAt,endsAt,row.id).run();
 await db.prepare('UPDATE challenge_tournament_rounds SET challenge_id=? WHERE definition_id=?').bind(challengeId,row.id).run();
 await auditTransition(db,row,'active',actor,'Published immutable challenge and roster snapshot',now);
 await db.prepare('INSERT INTO challenge_publication_attempts(id,definition_id,attempted_at,outcome,detail) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),row.id,now,'published',challengeId).run();
 return challengeId;
}

export async function schedulerTick(now=Date.now()){
 const db=database();
 await db.transaction(async tx=>{
  const lock=await tx.prepare('SELECT pg_try_advisory_xact_lock(88417421) AS acquired').first<{acquired:boolean}>();
  if(!lock?.acquired)return;
  const closed=(await tx.prepare(`SELECT d.id,COUNT(v.user_id) AS votes FROM challenge_definitions d LEFT JOIN challenge_proposal_votes v ON v.definition_id=d.id WHERE d.status='voting' AND d.voting_ends_at<=? GROUP BY d.id,d.created_at ORDER BY COUNT(v.user_id) DESC,d.created_at ASC,d.id ASC LIMIT 50`).bind(now).all<{id:string;votes:number}>()).results;
  if(closed.length){
   for(const [position,item] of closed.entries()){
    const row=await readDefinition(tx,item.id,true);if(!row||row.status!=='voting')continue;
    await auditTransition(tx,row,position===0&&Number(item.votes)>0?'selected':'approved',null,'Voting closed; deterministic vote count and creation-time tie-break',now);
   }
   const winner=closed[0];
   if(winner&&Number(winner.votes)>0){
    const row=await readDefinition(tx,winner.id,true);
    if(row?.status==='selected'){
     const day=86_400_000,first=Math.floor(now/day)*day+day;
     for(let i=0;i<14;i++){
      const start=first+i*day,end=start+day;
      const conflict=await tx.prepare(`SELECT id FROM challenge_definitions WHERE status IN ('scheduled','active') AND starts_at<? AND ends_at>? LIMIT 1`).bind(end,start).first();
      if(conflict)continue;
      await tx.prepare('UPDATE challenge_definitions SET starts_at=?,ends_at=? WHERE id=?').bind(start,end,row.id).run();
      await auditTransition(tx,row,'scheduled',null,'Community vote winner assigned next free UTC day',now);
      break;
     }
    }
   }
  }
 });
 const due=(await db.prepare(`SELECT id FROM challenge_definitions WHERE status='scheduled' AND starts_at<=? AND ends_at>? ORDER BY starts_at,id LIMIT 30`).bind(now,now).all<{id:string}>()).results;
 let published=0,failed=0;
 for(const {id} of due){
  try{
   const didPublish=await db.transaction(async tx=>{
    const lock=await tx.prepare('SELECT pg_try_advisory_xact_lock(88417421) AS acquired').first<{acquired:boolean}>();
    if(!lock?.acquired)return false;
    const current=await readDefinition(tx,id,true);
    if(!current||current.status!=='scheduled'||current.startsAt===null||Number(current.startsAt)>now)return false;
    await publishDefinition(tx,id,null,now);return true;
   });
   if(didPublish)published++;
  }catch(error){
   failed++;console.error('Challenge publication failed',id,error);
   await db.prepare('INSERT INTO challenge_publication_attempts(id,definition_id,attempted_at,outcome,detail) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),id,now,'failed',String((error as Error).message).slice(0,300)).run();
  }
 }
 await db.transaction(async tx=>{
  await tx.prepare(`UPDATE daily_squad_challenges SET status='closed' WHERE status<>'closed' AND ends_at<=?`).bind(now).run();
  await tx.prepare(`UPDATE challenge_definitions SET status='completed',updated_at=? WHERE status='active' AND ends_at<=?`).bind(now,now).run();
  await tx.prepare(`UPDATE challenge_tournaments SET status='active' WHERE status='scheduled' AND starts_at<=? AND ends_at>?`).bind(now,now).run();
  await tx.prepare(`UPDATE challenge_tournaments SET status='completed' WHERE status='active' AND ends_at<=?`).bind(now).run();
 });
 await ensureDailyChallenge(db,now);
 return {published,failed};
}

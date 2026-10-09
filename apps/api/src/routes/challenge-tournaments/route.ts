import {z} from 'zod';
import {database} from '@/db/raw';
import {getCurrentUser,isAdminUser,canContribute} from '@/lib/auth';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';
import {checkRateLimit} from '@/lib/auth-rate-limit';
import {readDefinition} from '@/lib/challenge-lifecycle';
import {findChallenge,resolveSubmissionMembers,effectiveChallengeStatus} from '@/lib/squad-challenge';
import {evaluateObjective} from '@anime/contracts/advanced-challenge';

const id=z.string().trim().min(1).max(180);
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('create'),title:z.string().trim().min(5).max(100),description:z.string().trim().min(10).max(1000),startsAt:z.number().int().positive(),endsAt:z.number().int().positive(),rounds:z.array(z.object({definitionId:id,startsAt:z.number().int().positive(),endsAt:z.number().int().positive()}).strict()).min(2).max(14)}).strict(),
 z.object({action:z.literal('register'),tournamentId:id}).strict(),
 z.object({action:z.literal('submit'),roundId:id,name:z.string().trim().min(3).max(60),strategy:z.string().trim().min(10).max(1500),members:z.array(z.object({characterId:id,versionId:id}).strict()).min(1).max(5)}).strict()
]);
type TournamentRow={id:string;title:string;description:string;status:string;startsAt:number;endsAt:number;scoringVersion:number};
const fail=(message:string,status=409)=>Object.assign(new Error(message),{status});

export async function GET(request:Request){
 try{
  const db=database(),user=await getCurrentUser(),url=new URL(request.url),idValue=url.searchParams.get('id');
  if(idValue&&idValue.length>180)return authJson({error:'Invalid tournament ID.'},400);
  const tournaments=(await db.prepare(`SELECT id,title,description,status,starts_at AS startsAt,ends_at AS endsAt,scoring_version AS scoringVersion FROM challenge_tournaments WHERE status<>'draft' ${idValue?'AND id=?':''} ORDER BY starts_at DESC LIMIT 30`).bind(...(idValue?[idValue]:[])).all<TournamentRow>()).results;
  if(idValue&&!tournaments.length)return authJson({error:'Tournament not found.'},404);
  if(!idValue)return authJson({tournaments});
  const tournament=tournaments[0];
  const rounds=(await db.prepare(`SELECT r.id,r.definition_id AS definitionId,r.challenge_id AS challengeId,r.round_number AS roundNumber,r.starts_at AS startsAt,r.ends_at AS endsAt,d.title,d.type,d.objective_json AS objectiveJson FROM challenge_tournament_rounds r JOIN challenge_definitions d ON d.id=r.definition_id WHERE r.tournament_id=? ORDER BY r.round_number`).bind(idValue).all<{id:string;definitionId:string;challengeId:string|null;roundNumber:number;startsAt:number;endsAt:number;title:string;type:string;objectiveJson:string}>()).results.map(row=>({...row,objective:JSON.parse(row.objectiveJson),objectiveJson:undefined}));
  const standings=(await db.prepare(`SELECT p.user_id AS userId,COALESCE(pr.handle,'Contestant') AS username,COUNT(r.score) AS roundsCompleted,COALESCE(SUM(r.score),0) AS totalPoints,COALESCE(MAX(r.score),0) AS bestRoundScore,MIN(r.submitted_at) AS firstResultAt FROM challenge_tournament_participants p LEFT JOIN profiles pr ON pr.user=p.user_id LEFT JOIN challenge_tournament_rounds rd ON rd.tournament_id=p.tournament_id LEFT JOIN challenge_tournament_results r ON r.round_id=rd.id AND r.user_id=p.user_id WHERE p.tournament_id=? GROUP BY p.user_id,pr.handle ORDER BY COALESCE(SUM(r.score),0) DESC,COUNT(r.score) DESC,COALESCE(MAX(r.score),0) DESC,MIN(r.submitted_at) ASC,p.user_id ASC LIMIT 100`).bind(idValue).all<{userId:string;username:string;roundsCompleted:number;totalPoints:number;bestRoundScore:number;firstResultAt:number|null}>()).results.map((row,index)=>({...row,rank:index+1,totalPoints:Number(row.totalPoints),roundsCompleted:Number(row.roundsCompleted),bestRoundScore:Number(row.bestRoundScore)}));
  const registered=Boolean(user&&await db.prepare('SELECT 1 FROM challenge_tournament_participants WHERE tournament_id=? AND user_id=?').bind(idValue,user.userId).first());
  const myResults=user?(await db.prepare(`SELECT r.round_id AS roundId,r.score,r.breakdown_json AS breakdownJson,r.submitted_at AS submittedAt FROM challenge_tournament_results r JOIN challenge_tournament_rounds rd ON rd.id=r.round_id WHERE rd.tournament_id=? AND r.user_id=? ORDER BY rd.round_number`).bind(idValue,user.userId).all<{roundId:string;score:number;breakdownJson:string;submittedAt:number}>()).results.map(row=>({...row,breakdown:JSON.parse(row.breakdownJson),breakdownJson:undefined})):[];
  return authJson({tournament,rounds,standings,registered,myResults});
 }catch(error){console.error('Tournament load failed',error);return authJson({error:'Could not load tournament.'},503);}
}

export async function POST(request:Request){
 if(!sameOrigin(request))return authJson({error:'Cross-origin request rejected.'},403);
 try{
  const input=schema.parse(await readJson(request,18_000)),user=await getCurrentUser(),db=database(),now=Date.now();
  if(!user)return authJson({error:'Sign in first.'},401);
  if(!canContribute(user))return authJson({error:'Verify your email and complete your profile.'},403);
  if(input.action==='create'){
   if(!isAdminUser(user))return authJson({error:'Admin access required.'},403);
   if(input.startsAt<=now||input.endsAt<=input.startsAt||input.endsAt-input.startsAt>14*86_400_000)throw fail('Choose a future tournament lasting at most fourteen days.');
   const tournamentId=`tournament-${crypto.randomUUID()}`;
   await db.transaction(async tx=>{
    const unique=new Set<string>();
    const definitions=[];
    for(const [index,round] of input.rounds.entries()){
     if(unique.has(round.definitionId))throw fail('Each round must use a distinct challenge.');unique.add(round.definitionId);
     if(round.startsAt<input.startsAt||round.endsAt>input.endsAt||round.endsAt<=round.startsAt)throw fail('Round falls outside the tournament window.');
     if(index&&round.startsAt<input.rounds[index-1].endsAt)throw fail('Tournament rounds must not overlap.');
     const definition=await readDefinition(tx,round.definitionId);
     if(!definition||!['scheduled','active'].includes(definition.status)||Number(definition.startsAt)!==round.startsAt||Number(definition.endsAt)!==round.endsAt)throw fail('Every round must match a scheduled or published official challenge.');
     definitions.push(definition);
    }
    await tx.prepare(`INSERT INTO challenge_tournaments(id,title,description,status,starts_at,ends_at,scoring_version,created_by,created_at) VALUES (?,?,?,'scheduled',?,?,1,?,?)`).bind(tournamentId,input.title,input.description,input.startsAt,input.endsAt,user.userId,now).run();
    for(const [index,round] of input.rounds.entries())await tx.prepare('INSERT INTO challenge_tournament_rounds(id,tournament_id,definition_id,challenge_id,round_number,starts_at,ends_at) VALUES (?,?,?,?,?,?,?)').bind(`round-${crypto.randomUUID()}`,tournamentId,round.definitionId,definitions[index].publishedChallengeId,index+1,round.startsAt,round.endsAt).run();
   });
   return authJson({ok:true,id:tournamentId},201);
  }
  if(input.action==='register'){
   const limit=await checkRateLimit('tournament-register',user.userId,20,60_000);if(!limit.allowed)return authJson({error:'Registration rate limit reached.'},429);
   const tournament=await db.prepare('SELECT starts_at AS startsAt,ends_at AS endsAt,status FROM challenge_tournaments WHERE id=?').bind(input.tournamentId).first<TournamentRow>();
   if(!tournament||!['scheduled','active'].includes(tournament.status)||now>=Number(tournament.endsAt))throw fail('Tournament registration is closed.');
   await db.prepare('INSERT INTO challenge_tournament_participants(tournament_id,user_id,joined_at) VALUES (?,?,?) ON CONFLICT DO NOTHING').bind(input.tournamentId,user.userId,now).run();
   return authJson({ok:true});
  }
  return await db.transaction(async tx=>{
   const round=await tx.prepare(`SELECT r.id,r.challenge_id AS challengeId,r.starts_at AS startsAt,r.ends_at AS endsAt,t.id AS tournamentId,t.status AS tournamentStatus,t.scoring_version AS scoringVersion FROM challenge_tournament_rounds r JOIN challenge_tournaments t ON t.id=r.tournament_id WHERE r.id=? FOR UPDATE OF r`).bind(input.roundId).first<{id:string;challengeId:string|null;startsAt:number;endsAt:number;tournamentId:string;tournamentStatus:string;scoringVersion:number}>();
   if(!round||round.tournamentStatus!=='active'||now<Number(round.startsAt)||now>=Number(round.endsAt)||!round.challengeId)throw fail('This tournament round is not accepting entries.');
   if(!await tx.prepare('SELECT 1 FROM challenge_tournament_participants WHERE tournament_id=? AND user_id=?').bind(round.tournamentId,user.userId).first())throw fail('Register for this tournament first.',403);
   if(await tx.prepare('SELECT 1 FROM challenge_tournament_results WHERE round_id=? AND user_id=?').bind(round.id,user.userId).first())throw fail('This round has already been scored.');
   const challenge=await findChallenge(tx,round.challengeId);
   if(!challenge||effectiveChallengeStatus(challenge,now)!=='active')throw fail('Published challenge is closed.');
   const {snapshots,totalCost}=await resolveSubmissionMembers(tx,challenge,input.members);
   const evaluation=evaluateObjective(challenge.objective,snapshots,challenge.budget);
   const submission=await tx.prepare(`SELECT id,locked_at AS lockedAt,(SELECT COUNT(*) FROM squad_submission_votes WHERE submission_id=s.id) AS votes FROM squad_submissions s WHERE challenge_id=? AND owner=? FOR UPDATE`).bind(challenge.id,user.userId).first<{id:string;lockedAt:number|null;votes:number}>();
   if(submission&&(submission.lockedAt||Number(submission.votes)>0))throw fail('Your existing squad is locked by community voting.');
   const submissionId=submission?.id||`squad-sub-${crypto.randomUUID()}`;
   if(submission){
    await tx.prepare('UPDATE squad_submissions SET name=?,strategy=?,total_cost=?,removed=0,updated=? WHERE id=?').bind(input.name,input.strategy,totalCost,now,submissionId).run();
    await tx.prepare('DELETE FROM squad_submission_members WHERE submission_id=?').bind(submissionId).run();
   }else await tx.prepare('INSERT INTO squad_submissions(id,challenge_id,owner,name,strategy,total_cost,locked_at,removed,created,updated) VALUES (?,?,?,?,?,?,NULL,0,?,?)').bind(submissionId,challenge.id,user.userId,input.name,input.strategy,totalCost,now,now).run();
   for(const member of snapshots)await tx.prepare('INSERT INTO squad_submission_members(submission_id,position,character_id,version_id,character_name_snapshot,version_name_snapshot,cost_snapshot,roles_snapshot,traits_snapshot) VALUES (?,?,?,?,?,?,?,?,?)').bind(submissionId,member.position,member.characterId,member.versionId,member.characterName,member.versionName,member.cost,JSON.stringify(member.roles),JSON.stringify(member.traits)).run();
   await tx.prepare('UPDATE squad_submissions SET locked_at=? WHERE id=?').bind(now,submissionId).run();
   await tx.prepare('INSERT INTO challenge_tournament_results(round_id,user_id,submission_id,score,scoring_version,breakdown_json,rules_snapshot,squad_snapshot,submitted_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(round.id,user.userId,submissionId,evaluation.score,round.scoringVersion,JSON.stringify(evaluation),JSON.stringify({rules:challenge.rules,objective:challenge.objective,budget:challenge.budget,rulesVersion:challenge.rulesVersion,balanceVersion:challenge.balanceVersion,tacticalAnalysisVersion:challenge.tacticalAnalysisVersion}),JSON.stringify(snapshots),now).run();
   return authJson({ok:true,submissionId,evaluation});
  });
 }catch(error){
  if(error instanceof z.ZodError)return authJson({error:'Invalid tournament request.',issues:error.issues},400);
  const status=(error as {status?:number}).status;if(status)return authJson({error:(error as Error).message},status);
  console.error('Tournament write failed',error);return authJson({error:'Could not update tournament.'},503);
 }
}

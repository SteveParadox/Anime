import {database} from '@/db/raw';
import {canContribute,getCurrentUser} from '@/lib/auth';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';
import {effectiveChallengeStatus,type SquadChallengeStatus} from '@/lib/squad-challenge';
import {z} from 'zod';

// Difficulty describes the predicted winner (squad for YES, boss for NO).
const voteSchema=z.object({
 submissionId:z.string().trim().min(1).max(180),
 verdict:z.enum(['yes','no']),
 explanation:z.string().trim().max(1500).optional().default(''),
 difficulty:z.enum(['NO_DIFF','LOW_DIFF','MID_DIFF','HIGH_DIFF','EXTREME_DIFF']).nullable().optional().default(null)
}).strict();

type VoteSubmissionDbRow={id:string;owner:string;removed:number;status:SquadChallengeStatus;startsAt:number;endsAt:number};
type VoteCountDbRow={yes:number;no:number;total:number};

function errorStatus(error:unknown){
 if(!(error instanceof Error)||!('status' in error))return Number.NaN;
 return Number((error as Error&{status?:unknown}).status);
}

export async function POST(request:Request){
 if(!sameOrigin(request))return authJson({error:'Cross-origin request rejected.'},403);
 try{
  const input=voteSchema.parse(await readJson(request,4_000)),db=database(),user=await getCurrentUser(),now=Date.now();
  if(!user)return authJson({error:'Sign in to vote on challenge squads.'},401);
  if(!canContribute(user))return authJson({error:'Complete and verify your profile before voting.'},403);

  const submission=await db.prepare(`SELECT s.id,s.owner,s.removed,c.status,c.starts_at AS startsAt,c.ends_at AS endsAt FROM squad_submissions s JOIN daily_squad_challenges c ON c.id=s.challenge_id WHERE s.id=? LIMIT 1`).bind(input.submissionId).first<VoteSubmissionDbRow>();
  if(!submission||submission.removed)return authJson({error:'Squad submission not found.'},404);
  if(submission.owner===user.userId)return authJson({error:'You cannot vote on your own squad submission.'},403);
  if(effectiveChallengeStatus({status:submission.status,startsAt:Number(submission.startsAt),endsAt:Number(submission.endsAt)},now)!=='active')return authJson({error:'Voting for this challenge is closed.'},409);

  await db.batch([
   db.prepare('UPDATE squad_submissions SET locked_at=COALESCE(locked_at,?) WHERE id=?').bind(now,input.submissionId),
   db.prepare(`INSERT INTO squad_submission_votes (submission_id,user,verdict,explanation,difficulty,created,updated) VALUES (?,?,?,?,?,?,?) ON CONFLICT(submission_id,user) DO UPDATE SET verdict=excluded.verdict,explanation=excluded.explanation,difficulty=excluded.difficulty,updated=excluded.updated`).bind(input.submissionId,user.userId,input.verdict,input.explanation,input.difficulty,now,now)
  ]);

  const counts=await db.prepare(`SELECT COALESCE(SUM(CASE WHEN verdict='yes' THEN 1 ELSE 0 END),0) AS yes,COALESCE(SUM(CASE WHEN verdict='no' THEN 1 ELSE 0 END),0) AS no,COUNT(*) AS total FROM squad_submission_votes WHERE submission_id=?`).bind(input.submissionId).first<VoteCountDbRow>();
  const yes=Number(counts?.yes||0),no=Number(counts?.no||0),total=Number(counts?.total||0),yesPercent=total?Math.round(yes/total*100):0;
  const difficultyRows=(await db.prepare(`SELECT verdict,difficulty,COUNT(*) AS count FROM squad_submission_votes WHERE submission_id=? AND difficulty IS NOT NULL GROUP BY verdict,difficulty`).bind(input.submissionId).all<{verdict:'yes'|'no';difficulty:string;count:number}>()).results;
  const difficultyByWinner={squad:{} as Record<string,number>,boss:{} as Record<string,number>};
  for(const row of difficultyRows){difficultyByWinner[row.verdict==='yes'?'squad':'boss'][row.difficulty]=Number(row.count);}
  return authJson({ok:true,vote:input.verdict,explanation:input.explanation,difficulty:input.difficulty,difficultyAppliesTo:input.verdict==='yes'?'squad':'boss',results:{yes,no,total,yesPercent,noPercent:total?100-yesPercent:0,difficultyByWinner}});
 }catch(error:unknown){
  if(error instanceof z.ZodError)return authJson({error:'Invalid vote.',issues:error.issues},400);
  const status=errorStatus(error),message=error instanceof Error?error.message:String(error);
  if(message.includes('squad_submission_vote_forbidden'))return authJson({error:'This squad no longer accepts your vote.'},409);
  if(message.includes('squad_challenge_inactive'))return authJson({error:'Voting for this challenge is closed.'},409);
  if(error instanceof Error&&status>=400&&status<500)return authJson({error:error.message},status);
  console.error('Squad challenge vote failed',error);
  return authJson({error:'Could not save vote.'},503);
 }
}

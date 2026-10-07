import {database} from '@/db/raw';
import {getCurrentUser} from '@/lib/auth';
import {authJson} from '@/lib/auth-request';
import {challengeFighters,effectiveChallengeStatus,ensureDailyChallenge,findChallenge,publicTarget,type SquadChallengeStatus} from '@/lib/squad-challenge';

type ChallengeHistoryDbRow={
 id:string;
 title:string;
 targetCharacterId:string|null;
 targetVersionId:string|null;
 budget:number;
 maxMembers:number;
 startsAt:number;
 endsAt:number;
 status:SquadChallengeStatus;
};

type MySubmissionDbRow={id:string;lockedAt:number|null;removed:number;votes:number};

function publicChallenge(challenge:Awaited<ReturnType<typeof findChallenge>>,now:number){
 if(!challenge)return null;
 return {
  id:challenge.id,
  type:challenge.type,
  title:challenge.title,
  description:challenge.description,
  target:publicTarget(challenge.targetCharacterId,challenge.targetVersionId),
  budget:challenge.budget,
  minMembers:challenge.minMembers,
  maxMembers:challenge.maxMembers,
  rules:challenge.rules,
  startsAt:challenge.startsAt,
  endsAt:challenge.endsAt,
  status:effectiveChallengeStatus(challenge,now)
 };
}

export async function GET(request:Request){
 try{
  const db=database(),now=Date.now(),user=await getCurrentUser(),url=new URL(request.url);
  const requestedId=(url.searchParams.get('id')||'').trim();
  if(requestedId.length>180)return authJson({error:'Invalid challenge.'},400);
  const challenge=requestedId?await findChallenge(db,requestedId):await ensureDailyChallenge(db,now);
  if(!challenge)return authJson({error:'Challenge not found.'},404);

  const [fighters,historyRows,mySubmission]=await Promise.all([
   challengeFighters(db,challenge.id),
   db.prepare(`SELECT id,type,title,description,target_character_id AS targetCharacterId,target_version_id AS targetVersionId,budget,min_members AS minMembers,max_members AS maxMembers,rules_json AS rulesJson,starts_at AS startsAt,ends_at AS endsAt,status,created FROM daily_squad_challenges ORDER BY starts_at DESC LIMIT 30`).all<ChallengeHistoryDbRow>(),
   user?db.prepare('SELECT id,locked_at AS lockedAt,removed,(SELECT COUNT(*) FROM squad_submission_votes v WHERE v.submission_id=squad_submissions.id) AS votes FROM squad_submissions WHERE challenge_id=? AND owner=? LIMIT 1').bind(challenge.id,user.userId).first<MySubmissionDbRow>():null
  ]);

  const history=historyRows.results.map(row=>({
   id:row.id,
   title:row.title,
   target:publicTarget(row.targetCharacterId,row.targetVersionId),
   budget:Number(row.budget),
   maxMembers:Number(row.maxMembers),
   startsAt:Number(row.startsAt),
   endsAt:Number(row.endsAt),
   status:effectiveChallengeStatus({status:row.status,startsAt:Number(row.startsAt),endsAt:Number(row.endsAt)},now)
  }));

  return authJson({
   challenge:{...publicChallenge(challenge,now),fighters},
   history,
   viewer:{authenticated:Boolean(user),mySubmissionId:mySubmission&&!mySubmission.removed?mySubmission.id:null,submissionLocked:Boolean(mySubmission&&(mySubmission.lockedAt||Number(mySubmission.votes)>0)),submissionRemoved:Boolean(mySubmission?.removed&&(mySubmission?.lockedAt||Number(mySubmission?.votes)>0))}
  });
 }catch(error){
  console.error('Squad challenge load failed',error);
  return authJson({error:'Could not load squad challenge.'},503);
 }
}

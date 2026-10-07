import {database} from '@/db/raw';
import {getCurrentUser} from '@/lib/auth';
import {authJson} from '@/lib/auth-request';
import {challengeFighters,effectiveChallengeStatus,ensureDailyChallenge,findChallenge,publicTarget} from '@/lib/squad-challenge';

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
  const today=await ensureDailyChallenge(db,now);
  const requested=(url.searchParams.get('id')||today.id).trim();
  if(requested.length>180)return authJson({error:'Invalid challenge.'},400);
  const challenge=requested===today.id?today:await findChallenge(db,requested);
  if(!challenge)return authJson({error:'Challenge not found.'},404);

  const [fighters,historyRows,mySubmission]=await Promise.all([
   challengeFighters(db,challenge.id),
   db.prepare(`SELECT id,type,title,description,target_character_id AS targetCharacterId,target_version_id AS targetVersionId,budget,min_members AS minMembers,max_members AS maxMembers,rules_json AS rulesJson,starts_at AS startsAt,ends_at AS endsAt,status,created FROM daily_squad_challenges ORDER BY starts_at DESC LIMIT 30`).all<any>(),
   user?db.prepare('SELECT id,locked_at AS lockedAt FROM squad_submissions WHERE challenge_id=? AND owner=? AND removed=0 LIMIT 1').bind(challenge.id,user.userId).first<any>():null
  ]);

  const history=historyRows.results.map(row=>{
   const item={
    id:String(row.id),
    type:row.type,
    title:String(row.title),
    description:String(row.description||''),
    targetCharacterId:row.targetCharacterId||null,
    targetVersionId:row.targetVersionId||null,
    budget:Number(row.budget),
    minMembers:Number(row.minMembers||1),
    maxMembers:Number(row.maxMembers),
    rules:{},
    startsAt:Number(row.startsAt),
    endsAt:Number(row.endsAt),
    status:row.status,
    created:Number(row.created)
   } as any;
   return {
    id:item.id,
    title:item.title,
    target:publicTarget(item.targetCharacterId,item.targetVersionId),
    budget:item.budget,
    maxMembers:item.maxMembers,
    startsAt:item.startsAt,
    endsAt:item.endsAt,
    status:effectiveChallengeStatus(item,now)
   };
  });

  return authJson({
   challenge:{...publicChallenge(challenge,now),fighters},
   history,
   viewer:{authenticated:Boolean(user),mySubmissionId:mySubmission?.id||null,submissionLocked:Boolean(mySubmission?.lockedAt)}
  });
 }catch(error){
  console.error('Squad challenge load failed',error);
  return authJson({error:'Could not load squad challenge.'},503);
 }
}

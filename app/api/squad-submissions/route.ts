import {database} from '@/db/raw';
import {canContribute,getCurrentUser} from '@/lib/auth';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';
import {effectiveChallengeStatus,findChallenge,publicTarget,resolveSubmissionMembers,type SquadChallengeStatus} from '@/lib/squad-challenge';
import {z} from 'zod';
import {parseRoleSnapshot,parseTraitSnapshot} from '@/lib/version-strategy';
import {analyzeSquadComposition,type VersionRole,type StrategicTrait} from '@/lib/squad-synergy';

const idText=z.string().trim().min(1).max(180);
const memberSchema=z.object({characterId:idText,versionId:idText}).strict();
const mutationSchema=z.discriminatedUnion('action',[
 z.object({
  action:z.literal('submit'),
  challengeId:idText,
  name:z.string().trim().min(3).max(60),
  strategy:z.string().trim().min(10).max(1500),
  members:z.array(memberSchema).min(1).max(10)
 }).strict(),
 z.object({action:z.literal('delete'),submissionId:idText}).strict()
]);

type SubmissionRow={
 id:string;
 challengeId:string;
 owner:string;
 name:string;
 strategy:string;
 totalCost:number;
 lockedAt:number|null;
 created:number;
 updated:number;
 handle:string;
 displayName:string;
 avatarUrl:string|null;
 challengeTitle:string;
 targetCharacterId:string|null;
 targetVersionId:string|null;
 budget:number;
 maxMembers:number;
 challengeStatus:SquadChallengeStatus;
 startsAt:number;
 endsAt:number;
 yesVotes:number;
 noVotes:number;
 totalVotes:number;
 myVote:'yes'|'no'|null;
};

type SubmissionAggregateDbRow={
 id:string;
 challengeId:string;
 owner:string;
 name:string;
 strategy:string;
 totalCost:number;
 lockedAt:number|null;
 created:number;
 updated:number;
 handle:string;
 displayName:string;
 avatarUrl:string|null;
 challengeTitle:string;
 targetCharacterId:string|null;
 targetVersionId:string|null;
 budget:number;
 maxMembers:number;
 challengeStatus:string;
 startsAt:number;
 endsAt:number;
 yesVotes:number;
 noVotes:number;
 totalVotes:number;
 myVote:string|null;
};

type SubmissionMemberView={
 position:number;
 characterId:string;
 characterName:string;
 versionId:string;
 versionName:string;
 cost:number;
 roles:VersionRole[]|null;
 traits:StrategicTrait[]|null;
};
type SubmissionMemberDbRow=Omit<SubmissionMemberView,'roles'|'traits'>&{submissionId:string;rolesSnapshot:string|null;traitsSnapshot:string|null};
type DeleteSubmissionDbRow={owner:string;challengeId:string;status:SquadChallengeStatus;startsAt:number;endsAt:number;votes:number};
type ExistingSubmissionDbRow={id:string;lockedAt:number|null;votes:number};
type BindValue=string|number|null;

function errorDetails(error:unknown){
 if(error instanceof Error){
  const status='status' in error?Number((error as Error&{status?:unknown}).status):Number.NaN;
  return {message:error.message,status};
 }
 return {message:String(error),status:Number.NaN};
}

const selectSubmission=`SELECT
 s.id,
 s.challenge_id AS challengeId,
 s.owner,
 s.name,
 s.strategy,
 s.total_cost AS totalCost,
 s.locked_at AS lockedAt,
 s.created,
 s.updated,
 COALESCE(p.handle,'anime_fan') AS handle,
 COALESCE(p.display_name,'Anime fan') AS displayName,
 p.avatar_url AS avatarUrl,
 c.title AS challengeTitle,
 c.target_character_id AS targetCharacterId,
 c.target_version_id AS targetVersionId,
 c.budget,
 c.max_members AS maxMembers,
 c.status AS challengeStatus,
 c.starts_at AS startsAt,
 c.ends_at AS endsAt,
 COALESCE(SUM(CASE WHEN v.verdict='yes' THEN 1 ELSE 0 END),0) AS yesVotes,
 COALESCE(SUM(CASE WHEN v.verdict='no' THEN 1 ELSE 0 END),0) AS noVotes,
 COUNT(v.user) AS totalVotes,
 MAX(CASE WHEN v.user=? THEN v.verdict ELSE NULL END) AS myVote
 FROM squad_submissions s
 JOIN daily_squad_challenges c ON c.id=s.challenge_id
 LEFT JOIN profiles p ON p.user=s.owner
 LEFT JOIN squad_submission_votes v ON v.submission_id=s.id`;

function normalizeRow(row:SubmissionAggregateDbRow):SubmissionRow{
 return {
  id:String(row.id),
  challengeId:String(row.challengeId),
  owner:String(row.owner),
  name:String(row.name),
  strategy:String(row.strategy),
  totalCost:Number(row.totalCost),
  lockedAt:row.lockedAt==null?null:Number(row.lockedAt),
  created:Number(row.created),
  updated:Number(row.updated),
  handle:String(row.handle||'anime_fan'),
  displayName:String(row.displayName||'Anime fan'),
  avatarUrl:row.avatarUrl||null,
  challengeTitle:String(row.challengeTitle),
  targetCharacterId:row.targetCharacterId||null,
  targetVersionId:row.targetVersionId||null,
  budget:Number(row.budget),
  maxMembers:Number(row.maxMembers),
  challengeStatus:row.challengeStatus as SquadChallengeStatus,
  startsAt:Number(row.startsAt),
  endsAt:Number(row.endsAt),
  yesVotes:Number(row.yesVotes||0),
  noVotes:Number(row.noVotes||0),
  totalVotes:Number(row.totalVotes||0),
  myVote:row.myVote==='yes'||row.myVote==='no'?row.myVote:null
 };
}

async function membersFor(db:D1Database,submissionIds:string[]){
 if(!submissionIds.length)return new Map<string,SubmissionMemberView[]>();
 const placeholders=submissionIds.map(()=>'?').join(',');
 const rows=(await db.prepare(`SELECT submission_id AS submissionId,position,character_id AS characterId,version_id AS versionId,character_name_snapshot AS characterName,version_name_snapshot AS versionName,cost_snapshot AS cost,roles_snapshot AS rolesSnapshot,traits_snapshot AS traitsSnapshot FROM squad_submission_members WHERE submission_id IN (${placeholders}) ORDER BY submission_id ASC,position ASC`).bind(...submissionIds).all<SubmissionMemberDbRow>()).results;
 const grouped=new Map<string,SubmissionMemberView[]>();
 for(const row of rows){
  const list=grouped.get(row.submissionId)||[];
  list.push({position:Number(row.position),characterId:row.characterId,versionId:row.versionId,characterName:row.characterName,versionName:row.versionName,cost:Number(row.cost),roles:parseRoleSnapshot(row.rolesSnapshot),traits:parseTraitSnapshot(row.traitsSnapshot)});
  grouped.set(row.submissionId,list);
 }
 return grouped;
}

function publicSubmission(row:SubmissionRow,members:SubmissionMemberView[],viewerId:string|null,now:number,rank?:number){
 const challengeState=effectiveChallengeStatus({status:row.challengeStatus,startsAt:row.startsAt,endsAt:row.endsAt},now);
 const owned=Boolean(viewerId&&viewerId===row.owner);
 const canSeeVotes=owned||Boolean(row.myVote)||challengeState==='closed';
 const yesPct=row.totalVotes?Math.round(row.yesVotes/row.totalVotes*100):0;
 return {
  id:row.id,
  challengeId:row.challengeId,
  challenge:{
   id:row.challengeId,
   title:row.challengeTitle,
   target:publicTarget(row.targetCharacterId,row.targetVersionId),
   budget:row.budget,
   maxMembers:row.maxMembers,
   status:challengeState,
   startsAt:row.startsAt,
   endsAt:row.endsAt
  },
  owner:{username:row.handle,displayName:row.displayName,avatarUrl:row.avatarUrl},
  owned,
  name:row.name,
  strategy:row.strategy,
  totalCost:row.totalCost,
  members,
  composition:analyzeSquadComposition(members.filter(m=>m.roles!==null).map(m=>({versionId:m.versionId,characterName:m.characterName,roles:m.roles||[],traits:m.traits||[]}))),
  locked:Boolean(row.lockedAt||row.totalVotes>0),
  editable:owned&&challengeState==='active'&&!row.lockedAt&&row.totalVotes===0,
  created:row.created,
  updated:row.updated,
  myVote:row.myVote,
  rank:rank||null,
  votes:canSeeVotes
   ?{hidden:false,yes:row.yesVotes,no:row.noVotes,total:row.totalVotes,yesPercent:yesPct,noPercent:row.totalVotes?100-yesPct:0}
   :{hidden:true,total:row.totalVotes}
 };
}

export async function GET(request:Request){
 try{
  const db=database(),viewer=await getCurrentUser(),viewerId=viewer?.userId||null,url=new URL(request.url),now=Date.now();
  const id=(url.searchParams.get('id')||'').trim();
  const challengeId=(url.searchParams.get('challenge')||'').trim();
  const ownerHandle=(url.searchParams.get('owner')||'').trim().toLowerCase();
  const mine=url.searchParams.get('mine')==='1';
  const sort=(url.searchParams.get('sort')||'top').trim();
  const limit=Math.max(1,Math.min(50,Number(url.searchParams.get('limit'))||20));
  if(id&&id.length>180||challengeId&&challengeId.length>180||ownerHandle&&ownerHandle.length>24)return authJson({error:'Invalid request.'},400);
  if(!['top','newest','most_voted'].includes(sort))return authJson({error:'Unknown sort order.'},400);
  if(mine&&!viewer)return authJson({error:'Sign in to view your challenge entries.'},401);

  const params:BindValue[]=[viewerId||''];
  let where=' WHERE s.removed=0',maxRows=limit,orderBy='s.created DESC';
  if(id){where+=' AND s.id=?';params.push(id);maxRows=1;}
  else if(challengeId){
   where+=' AND s.challenge_id=?';
   params.push(challengeId);
   if(sort==='most_voted')orderBy='COUNT(v.user) DESC,s.created DESC';
   else if(sort==='top')orderBy=`CASE WHEN COUNT(v.user)>=5 THEN (COALESCE(SUM(CASE WHEN v.verdict='yes' THEN 1 ELSE 0 END),0)-COALESCE(SUM(CASE WHEN v.verdict='no' THEN 1 ELSE 0 END),0)) ELSE -1000000000 END DESC,COUNT(v.user) DESC,s.created DESC`;
  }
  else if(mine){where+=' AND s.owner=?';params.push(viewerId);}
  else if(ownerHandle){where+=' AND p.handle=?';params.push(ownerHandle);}
  else return authJson({error:'Provide a challenge, submission, or profile filter.'},400);

  const sql=`${selectSubmission}${where} GROUP BY s.id ORDER BY ${orderBy} LIMIT ${maxRows}`;
  const rows=(await db.prepare(sql).bind(...params).all<SubmissionAggregateDbRow>()).results.map(normalizeRow);
  if(id&&!rows.length)return authJson({error:'Squad submission not found.'},404);

  const grouped=await membersFor(db,rows.map(row=>row.id));
  let qualifiedRank=0;
  const submissions=rows.map(row=>{
   const rank=!id&&Boolean(challengeId)&&sort==='top'&&row.totalVotes>=5?++qualifiedRank:undefined;
   return publicSubmission(row,grouped.get(row.id)||[],viewerId,now,rank);
  });
  return authJson(id?{submission:submissions[0]}:{submissions});
 }catch(error){
  console.error('Squad submission load failed',error);
  return authJson({error:'Could not load squad submissions.'},503);
 }
}

export async function POST(request:Request){
 if(!sameOrigin(request))return authJson({error:'Cross-origin request rejected.'},403);
 try{
  const input=mutationSchema.parse(await readJson(request,20_000)),db=database(),user=await getCurrentUser(),now=Date.now();
  if(!user)return authJson({error:'Sign in to manage challenge squads.'},401);
  if(!canContribute(user))return authJson({error:'Complete and verify your profile before entering challenges.'},403);

  if(input.action==='delete'){
   const submission=await db.prepare(`SELECT s.owner,s.challenge_id AS challengeId,c.status,c.starts_at AS startsAt,c.ends_at AS endsAt,(SELECT COUNT(*) FROM squad_submission_votes v WHERE v.submission_id=s.id) AS votes FROM squad_submissions s JOIN daily_squad_challenges c ON c.id=s.challenge_id WHERE s.id=? AND s.removed=0 LIMIT 1`).bind(input.submissionId).first<DeleteSubmissionDbRow>();
   if(!submission)return authJson({error:'Squad submission not found.'},404);
   if(submission.owner!==user.userId)return authJson({error:'You cannot delete another user’s squad.'},403);
   if(effectiveChallengeStatus({status:submission.status,startsAt:Number(submission.startsAt),endsAt:Number(submission.endsAt)},now)!=='active')return authJson({error:'This challenge is closed.'},409);
   if(Number(submission.votes)>0)return authJson({error:'A squad cannot be deleted after community voting begins.'},409);
   const removed=await db.prepare('UPDATE squad_submissions SET removed=1,updated=? WHERE id=? AND owner=? AND removed=0 AND NOT EXISTS (SELECT 1 FROM squad_submission_votes v WHERE v.submission_id=squad_submissions.id)').bind(now,input.submissionId,user.userId).run();
   if(!removed.meta.changes)return authJson({error:'Community voting has started; this squad can no longer be deleted.'},409);
   return authJson({ok:true,id:input.submissionId});
  }

  const challenge=await findChallenge(db,input.challengeId);
  if(!challenge)return authJson({error:'Challenge not found.'},404);
  if(effectiveChallengeStatus(challenge,now)!=='active')return authJson({error:'This challenge is not accepting submissions.'},409);
  const {snapshots,totalCost}=await resolveSubmissionMembers(db,challenge,input.members);
  const existing=await db.prepare(`SELECT s.id,s.locked_at AS lockedAt,(SELECT COUNT(*) FROM squad_submission_votes v WHERE v.submission_id=s.id) AS votes FROM squad_submissions s WHERE s.challenge_id=? AND s.owner=? LIMIT 1`).bind(challenge.id,user.userId).first<ExistingSubmissionDbRow>();
  if(existing&&(existing.lockedAt||Number(existing.votes)>0))return authJson({error:'This squad is locked because community voting has started.'},409);

  const submissionId=existing?.id||`squad-sub-${crypto.randomUUID()}`;
  const statements:D1PreparedStatement[]=[];
  if(existing){
   statements.push(
    db.prepare('UPDATE squad_submissions SET name=?,strategy=?,total_cost=?,removed=0,updated=? WHERE id=? AND owner=? AND locked_at IS NULL').bind(input.name,input.strategy,totalCost,now,submissionId,user.userId),
    db.prepare('DELETE FROM squad_submission_members WHERE submission_id=?').bind(submissionId)
   );
  }else{
   statements.push(db.prepare('INSERT INTO squad_submissions (id,challenge_id,owner,name,strategy,total_cost,locked_at,removed,created,updated) VALUES (?,?,?,?,?,?,NULL,0,?,?)').bind(submissionId,challenge.id,user.userId,input.name,input.strategy,totalCost,now,now));
  }
  for(const member of snapshots){
   statements.push(db.prepare('INSERT INTO squad_submission_members (submission_id,position,character_id,version_id,character_name_snapshot,version_name_snapshot,cost_snapshot,roles_snapshot,traits_snapshot) VALUES (?,?,?,?,?,?,?,?,?)').bind(submissionId,member.position,member.characterId,member.versionId,member.characterName,member.versionName,member.cost,JSON.stringify(member.roles),JSON.stringify(member.traits)));
  }
  await db.batch(statements);
  return authJson({ok:true,id:submissionId,totalCost,updated:Boolean(existing)});
 }catch(error:unknown){
  if(error instanceof z.ZodError)return authJson({error:'Invalid squad submission.',issues:error.issues},400);
  const details=errorDetails(error);
  if(details.message.includes('squad_submission_locked'))return authJson({error:'This squad is locked because community voting has started.'},409);
  if(details.message.includes('squad_challenge_inactive'))return authJson({error:'This challenge is no longer accepting squad changes.'},409);
  if(details.message.includes('UNIQUE constraint failed')&&details.message.includes('squad_submissions'))return authJson({error:'A challenge submission was created concurrently. Reload before editing it.'},409);
  if(details.status>=400&&details.status<500)return authJson({error:details.message},details.status);
  console.error('Squad submission save failed',error);
  return authJson({error:'Could not save squad submission.'},503);
 }
}

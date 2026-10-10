import {z} from 'zod';
import {database} from '@/db/raw';
import {authJson} from '@/lib/auth-request';
import {getCurrentUser} from '@/lib/auth';
import {usersBlocked} from '@/lib/activity';
import {ensureProgression} from '@/lib/progression';

const handle=z.string().trim().regex(/^[a-z0-9_]{3,24}$/);
function parseArray(value:unknown):unknown[]{try{return Array.isArray(value)?value:JSON.parse(String(value||'[]'));}catch{return [];}}

async function resolveTarget(request:Request){
 const db=database(),url=new URL(request.url),profileHandle=url.searchParams.get('handle'),viewer=await getCurrentUser();
 if(profileHandle){
  if(!handle.safeParse(profileHandle).success)return {viewer,target:null};
  const target=await db.prepare('SELECT u.id,p.handle,p.display_name AS "displayName",p.avatar_url AS "avatarUrl",p.visibility FROM users u JOIN profiles p ON p.user=u.id WHERE p.handle=? AND u.profile_completed=1 AND u.email_verified=1 LIMIT 1').bind(profileHandle.toLowerCase()).first<any>();
  return {viewer,target};
 }
 if(!viewer)return {viewer,target:null};
 const target=await db.prepare('SELECT u.id,p.handle,p.display_name AS "displayName",p.avatar_url AS "avatarUrl",p.visibility FROM users u JOIN profiles p ON p.user=u.id WHERE u.id=? LIMIT 1').bind(viewer.userId).first<any>();
 return {viewer,target};
}

export async function GET(request:Request){
 try{
  const db=database(),{viewer,target}=await resolveTarget(request);
  if(!target)return authJson({error:'Profile not found.'},404);
  const owned=viewer?.userId===target.id;
  if(!owned&&(target.visibility!=='public'||viewer&&await usersBlocked(viewer.userId,target.id)))return authJson({error:'Profile is private.'},403);

  const [battle,squad,evidence,followRows,roleRows,versionRows,trackingRows]=await Promise.all([
   db.prepare(`SELECT
    (SELECT COUNT(*) FROM battles WHERE owner=?) AS "battlesCreated",
    (SELECT COUNT(*) FROM votes WHERE "user"=?) AS "votesCast",
    (SELECT COUNT(*) FROM votes v WHERE v."user"=? AND (length(trim(v.evidence))>0 OR EXISTS(SELECT 1 FROM argument_evidence_links l WHERE l.battle=v.battle AND l.argument_user=v."user"))) AS "evidenceBackedArguments",
    (SELECT COUNT(*) FROM battles b WHERE b.owner=? AND (SELECT COUNT(*) FROM votes v WHERE v.battle=b.id)>=10) AS "highEngagementBattles",
    (SELECT COUNT(*) FROM tournament_votes WHERE "user"=?) AS "tournamentVotes"`).bind(target.id,target.id,target.id,target.id,target.id).first<any>(),
   db.prepare(`SELECT
    (SELECT COUNT(*) FROM squads WHERE owner=?) AS "savedSquads",
    (SELECT COUNT(*) FROM squad_submissions WHERE owner=? AND removed=0) AS "challengeSubmissions",
    (SELECT COALESCE(SUM((SELECT COUNT(*) FROM squad_submission_votes v WHERE v.submission_id=s.id)),0) FROM squad_submissions s WHERE s.owner=? AND s.removed=0) AS "communityVotesReceived"`).bind(target.id,target.id,target.id).first<any>(),
   db.prepare(`SELECT
    (SELECT COUNT(*) FROM evidence_records WHERE submitted_by=? AND deleted=0) AS submissions,
    (SELECT COUNT(DISTINCT evidence_id) FROM argument_evidence_links WHERE linked_by=?) AS "linkedEvidence",
    (SELECT COUNT(*) FROM reports r JOIN evidence_records e ON e.id=r.subject_id WHERE e.submitted_by=? AND r.subject_type='evidence' AND r.status='open') AS "underReview"`).bind(target.id,target.id,target.id).first<any>(),
   db.prepare(`SELECT
    (SELECT COUNT(*) FROM user_follows WHERE followed_user_id=?) AS followers,
    (SELECT COUNT(*) FROM user_follows WHERE follower_user_id=?) AS following,
    EXISTS(SELECT 1 FROM user_follows WHERE follower_user_id=? AND followed_user_id=?) AS "viewerFollows"`).bind(target.id,target.id,viewer?.userId||'',target.id).first<any>(),
   db.prepare('SELECT m.roles_snapshot AS roles FROM squad_submission_members m JOIN squad_submissions s ON s.id=m.submission_id WHERE s.owner=? AND s.removed=0 AND m.roles_snapshot IS NOT NULL').bind(target.id).all<{roles:string}>(),
   db.prepare('SELECT m.character_id AS "characterId",m.version_id AS "versionId" FROM squad_submission_members m JOIN squad_submissions s ON s.id=m.submission_id WHERE s.owner=? AND s.removed=0').bind(target.id).all<{characterId:string;versionId:string}>(),
   db.prepare("SELECT media_type AS "mediaType",media_id AS "mediaId",status FROM user_media_tracking WHERE user_id=?").bind(target.id).all<{mediaType:string;mediaId:string;status:string}>()
  ]);

  const roleCounts=new Map<string,{all:number;primary:number}>();
  for(const row of roleRows.results){
   for(const role of parseArray(row.roles)){
    if(!role||typeof role!=='object')continue;
    const item=role as {role?:unknown;priority?:unknown};if(typeof item.role!=='string')continue;
    const current=roleCounts.get(item.role)||{all:0,primary:0};current.all++;if(item.priority==='primary')current.primary++;roleCounts.set(item.role,current);
   }
  }
  const totalRoleUses=[...roleCounts.values()].reduce((n,row)=>n+row.all,0);
  const roles=[...roleCounts.entries()].map(([role,count])=>({role,...count,percent:totalRoleUses?Math.round(count.all/totalRoleUses*100):0})).sort((a,b)=>b.all-a.all||a.role.localeCompare(b.role));

  const characterCounts=new Map<string,number>(),versionCounts=new Map<string,number>();
  for(const row of versionRows.results){characterCounts.set(row.characterId,(characterCounts.get(row.characterId)||0)+1);versionCounts.set(row.versionId,(versionCounts.get(row.versionId)||0)+1);}
  for(const saved of (await db.prepare('SELECT members FROM squads WHERE owner=?').bind(target.id).all<{members:string}>()).results)for(const member of parseArray(saved.members))if(typeof member==='string')characterCounts.set(member,(characterCounts.get(member)||0)+1);
  const characters=[...characterCounts.entries()].map(([characterId,count])=>({characterId,count})).sort((a,b)=>b.count-a.count||a.characterId.localeCompare(b.characterId)).slice(0,20);
  const versions=[...versionCounts.entries()].map(([versionId,count])=>({versionId,count})).sort((a,b)=>b.count-a.count||a.versionId.localeCompare(b.versionId)).slice(0,20);

  const progression=await ensureProgression(target.id);
  const completedAnime=trackingRows.results.filter(row=>row.mediaType==='anime'&&row.status==='completed').length;
  return authJson({
   user:{id:target.id,handle:target.handle,displayName:target.displayName,avatarUrl:target.avatarUrl,owned},
   follows:{followers:Number(followRows?.followers||0),following:Number(followRows?.following||0),viewerFollows:Boolean(followRows?.viewerFollows)&&!owned},
   battle:{battlesCreated:Number(battle?.battlesCreated||0),votesCast:Number(battle?.votesCast||0),evidenceBackedArguments:Number(battle?.evidenceBackedArguments||0),highEngagementBattles:Number(battle?.highEngagementBattles||0),tournamentVotes:Number(battle?.tournamentVotes||0)},
   squad:{savedSquads:Number(squad?.savedSquads||0),challengeSubmissions:Number(squad?.challengeSubmissions||0),communityVotesReceived:Number(squad?.communityVotesReceived||0),revisionHistorySupported:false,chemistryMetricSupported:false},
   evidence:{submissions:Number(evidence?.submissions||0),published:Number(evidence?.submissions||0),linkedEvidence:Number(evidence?.linkedEvidence||0),underReview:Number(evidence?.underReview||0),verificationMetricSupported:false},
   usage:{roles,characters,versions},
   tracking:{completedAnime,totalTracked:trackingRows.results.length},
   progression
  });
 }catch(error){console.error('Profile statistics failed',error);return authJson({error:'Unable to load profile statistics.'},503);}
}

import {z} from 'zod';
import {database} from '@/db/raw';
import {getCurrentUser,canContribute,isAdminUser} from '@/lib/auth';
import {authJson,readJson,sameOrigin} from '@/lib/auth-request';
import {checkRateLimit} from '@/lib/auth-rate-limit';
import {challengeDefinitionSchema,evaluateObjective} from '@anime/contracts/advanced-challenge';
import {DEFINITION_SELECT,readDefinition,inputFor,auditTransition,publishDefinition,schedulerTick,type DefinitionRow} from '@/lib/challenge-lifecycle';
import {feasibleRoster} from '@/lib/advanced-challenge';
import {findChallenge,resolveSubmissionMembers} from '@/lib/squad-challenge';
import {generateFeasibleChallenge} from '@/lib/challenge-generator';

const id=z.string().trim().min(1).max(180);
const schema=z.object({
 action:z.enum(['preview','create','update','submit_review','approve','reject','open_voting','vote','unvote','schedule','publish','cancel','withdraw','archive','preview_squad','run_scheduler','generate','report','moderate_report']),
 id:id.optional(),definition:challengeDefinitionSchema.optional(),startsAt:z.number().int().positive().optional(),endsAt:z.number().int().positive().optional(),votingEndsAt:z.number().int().positive().optional(),reason:z.string().trim().min(5).max(500).optional(),members:z.array(z.object({characterId:id,versionId:id}).strict()).min(1).max(5).optional(),seed:z.number().int().optional(),decision:z.enum(['resolved','dismissed']).optional(),removeProposal:z.boolean().optional()
}).strict();
const errorResponse=(error:unknown)=>{
 if(error instanceof z.ZodError)return authJson({error:'Invalid challenge configuration.',issues:error.issues},400);
 const status=(error as {status?:number}).status;
 if(status&&status>=400&&status<500)return authJson({error:(error as Error).message},status);
 console.error('Challenge management failed',error);return authJson({error:'Challenge operation failed.'},503);
};
const conflict=(message:string)=>Object.assign(new Error(message),{status:409});

export async function GET(request:Request){
 try{
  const db=database(),user=await getCurrentUser(),url=new URL(request.url),scope=url.searchParams.get('scope')||'public';
  if(!['public','mine','admin'].includes(scope))return authJson({error:'Unknown listing.'},400);
  if(scope==='admin'&&!isAdminUser(user))return authJson({error:'Admin access required.'},403);
  if(scope==='mine'&&!user)return authJson({error:'Sign in first.'},401);
  const params:unknown[]=[];
  let where="WHERE d.status IN ('voting','active','completed')";
  if(scope==='mine'){where='WHERE d.creator_user_id=?';params.push(user!.userId);}
  if(scope==='admin')where='';
  const rows=(await db.prepare(`SELECT ${DEFINITION_SELECT},(SELECT COUNT(*) FROM challenge_proposal_votes v WHERE v.definition_id=d.id) AS voteCount FROM challenge_definitions d ${where} ORDER BY d.created_at DESC LIMIT 50`).bind(...params).all<DefinitionRow&{voteCount:number}>()).results;
  const visible=rows.map(row=>({
   ...row,rules:JSON.parse(String(row.rulesJson)),objective:JSON.parse(String(row.objectiveJson)),rulesJson:undefined,objectiveJson:undefined,
   myVote:null as boolean|null
  }));
  if(user&&visible.length){
   const votes=(await db.prepare(`SELECT definition_id AS definitionId FROM challenge_proposal_votes WHERE user_id=? AND definition_id IN (${visible.map(()=>'?').join(',')})`).bind(user.userId,...visible.map(v=>v.id)).all<{definitionId:string}>()).results;
   const voted=new Set(votes.map(v=>v.definitionId));for(const row of visible)row.myVote=voted.has(String(row.id));
  }
  const attempts=scope==='admin'?(await db.prepare('SELECT definition_id AS definitionId,attempted_at AS attemptedAt,outcome,detail FROM challenge_publication_attempts ORDER BY attempted_at DESC LIMIT 20').all()).results:undefined;
  const reports=scope==='admin'?(await db.prepare("SELECT id,subject_id AS subjectId,reason,created FROM reports WHERE subject_type='challenge_proposal' AND status='open' ORDER BY created LIMIT 50").all()).results:undefined;
  const upcoming=scope==='public'?(await db.prepare(`SELECT id,starts_at AS startsAt,ends_at AS endsAt FROM challenge_definitions WHERE status='scheduled' AND starts_at>? ORDER BY starts_at,id LIMIT 10`).bind(Date.now()).all<{id:string;startsAt:number;endsAt:number}>()).results:undefined;
  return authJson({definitions:visible,attempts,reports,upcoming});
 }catch(error){return errorResponse(error);}
}

export async function POST(request:Request){
 if(!sameOrigin(request))return authJson({error:'Cross-origin request rejected.'},403);
 try{
  const data=schema.parse(await readJson(request,20_000)),db=database(),user=await getCurrentUser(),now=Date.now(),admin=isAdminUser(user);
  if(!user)return authJson({error:'Sign in first.'},401);
  if(!canContribute(user))return authJson({error:'Verify your email and complete your profile.'},403);
  if(['approve','reject','open_voting','schedule','publish','cancel','archive','run_scheduler','generate','moderate_report'].includes(data.action)&&!admin)return authJson({error:'Admin access required.'},403);
  if(data.action==='moderate_report'){
   if(!data.id||!data.decision)throw conflict('Choose a report and decision.');
   return await db.transaction(async tx=>{
    const report=await tx.prepare("SELECT subject_id AS subjectId FROM reports WHERE id=? AND subject_type='challenge_proposal' AND status='open' FOR UPDATE").bind(data.id).first<{subjectId:string}>();
    if(!report)throw conflict('Report is already closed.');
    if(data.removeProposal){
     const row=await readDefinition(tx,report.subjectId,true);
     if(!row||!['pending_review','approved','voting'].includes(row.status))throw conflict('Published or scheduled challenges require an audited correction process.');
     await auditTransition(tx,row,'rejected',user.userId,data.reason||'Removed after moderation report',now);
    }
    await tx.prepare('UPDATE reports SET status=? WHERE id=?').bind(data.decision,data.id).run();
    return authJson({ok:true});
   });
  }
  if(data.action==='run_scheduler')return authJson(await schedulerTick(now));
  if(data.action==='preview'){
   if(!data.definition)throw conflict('Provide a challenge definition.');
   // Bound expensive combinatorial feasibility searches for authenticated users.
   const limit=await checkRateLimit('challenge-feasibility-preview',user.userId,10,60_000);
   if(!limit.allowed)return authJson({error:'Challenge preview limit reached.'},429);
   return authJson(await feasibleRoster(db,data.definition));
  }
  let generated=false;
  if(data.action==='generate'){
   const candidate=await generateFeasibleChallenge(db,data.seed??Math.floor(now/86_400_000));
   data.definition=candidate.definition;data.action='create';generated=true;
  }
  if(data.action==='create'){
   if(!data.definition)throw conflict('Provide a challenge definition.');
   if(!admin){const limit=await checkRateLimit('community-challenge-create',user.userId,3,86_400_000);if(!limit.allowed)return authJson({error:'Challenge creation limit reached.'},429);}
   const input=data.definition,idValue=`definition-${crypto.randomUUID()}`,source=generated?'generated':admin?'admin':'community';
   await db.prepare(`INSERT INTO challenge_definitions(id,creator_user_id,source_type,status,title,description,difficulty,type,target_character_id,target_version_id,budget,min_members,max_members,rules_json,objective_json,starts_at,ends_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(idValue,user.userId,source,'draft',input.title,input.description,input.difficulty,input.objective.type,input.objective.type==='defeat_target'?input.objective.boss.characterId:null,input.objective.type==='defeat_target'?input.objective.boss.versionId:null,input.budget,input.minMembers,input.maxMembers,JSON.stringify({restrictions:input.restrictions}),JSON.stringify(input.objective),admin?input.startsAt??null:null,admin?input.endsAt??null:null,now,now).run();
   return authJson({ok:true,id:idValue,status:'draft'},201);
  }
  if(!data.id)throw conflict('Provide a challenge ID.');
  if(data.action==='preview_squad'){
   const row=await readDefinition(db,data.id);
   if(!row||!['approved','selected','scheduled','active'].includes(row.status))return authJson({error:'Challenge is not available for squad preview.'},404);
   const challenge=row.publishedChallengeId?await findChallenge(db,row.publishedChallengeId):null;
   if(!challenge||!data.members)throw conflict('A published challenge and squad are required.');
   const result=await resolveSubmissionMembers(db,challenge,data.members);
   return authJson({...result,evaluation:evaluateObjective(challenge.objective,result.snapshots,challenge.budget)});
  }
  if(data.action==='vote'||data.action==='unvote'){
   const limit=await checkRateLimit('challenge-proposal-vote',user.userId,60,60_000);if(!limit.allowed)return authJson({error:'Please wait before voting again.'},429);
   return await db.transaction(async tx=>{
    const row=await readDefinition(tx,data.id!,true);
    if(!row||row.status!=='voting'||row.votingEndsAt===null||Number(row.votingEndsAt)<=now)throw conflict('Voting is closed.');
    if(row.creatorUserId===user.userId)throw conflict('Creators cannot vote for their own proposal.');
    if(data.action==='vote')await tx.prepare('INSERT INTO challenge_proposal_votes(definition_id,user_id,created_at) VALUES (?,?,?) ON CONFLICT DO NOTHING').bind(row.id,user.userId,now).run();
    else await tx.prepare('DELETE FROM challenge_proposal_votes WHERE definition_id=? AND user_id=?').bind(row.id,user.userId).run();
    const count=await tx.prepare('SELECT COUNT(*) AS n FROM challenge_proposal_votes WHERE definition_id=?').bind(row.id).first<{n:number}>();
    return authJson({ok:true,votes:Number(count?.n||0)});
   });
  }
  if(data.action==='report'){
   if(!data.reason)throw conflict('Provide a report reason.');
   const limit=await checkRateLimit('challenge-proposal-report',user.userId,5,86_400_000);if(!limit.allowed)return authJson({error:'Report limit reached.'},429);
   const row=await readDefinition(db,data.id);if(!row||row.status==='draft')return authJson({error:'Proposal not found.'},404);
   if(row.creatorUserId===user.userId)throw conflict('Creators cannot report their own proposal.');
   if(await db.prepare("SELECT 1 FROM reports WHERE reporter=? AND subject_type='challenge_proposal' AND subject_id=? AND status='open'").bind(user.userId,row.id).first())throw conflict('You already reported this proposal.');
   await db.prepare(`INSERT INTO reports(id,reporter,subject_type,subject_id,reason,status,created) VALUES (?,?, 'challenge_proposal',?,?,'open',?)`).bind(crypto.randomUUID(),user.userId,row.id,data.reason,now).run();
   return authJson({ok:true});
  }
  return await db.transaction(async tx=>{
   const row=await readDefinition(tx,data.id!,true);
   if(!row)throw conflict('Challenge definition not found.');
   const owner=row.creatorUserId===user.userId;
   if(!admin&&!owner)throw Object.assign(new Error('You cannot edit this challenge.'),{status:403});
   if(data.action==='update'){
    if(!data.definition||row.status!=='draft')throw conflict('Only drafts may be edited.');
    const input=data.definition;
    await tx.prepare('UPDATE challenge_definitions SET title=?,description=?,difficulty=?,type=?,target_character_id=?,target_version_id=?,budget=?,min_members=?,max_members=?,rules_json=?,objective_json=?,starts_at=?,ends_at=?,rules_version=rules_version+1,updated_at=? WHERE id=?').bind(input.title,input.description,input.difficulty,input.objective.type,input.objective.type==='defeat_target'?input.objective.boss.characterId:null,input.objective.type==='defeat_target'?input.objective.boss.versionId:null,input.budget,input.minMembers,input.maxMembers,JSON.stringify({restrictions:input.restrictions}),JSON.stringify(input.objective),admin?input.startsAt??null:null,admin?input.endsAt??null:null,now,row.id).run();
    return authJson({ok:true});
   }
   const transitions:Record<string,{from:string[];to:string;adminOnly?:boolean}>={
    submit_review:{from:['draft'],to:'pending_review'},approve:{from:['pending_review'],to:'approved',adminOnly:true},reject:{from:['pending_review','approved'],to:'rejected',adminOnly:true},open_voting:{from:['approved'],to:'voting',adminOnly:true},schedule:{from:['approved','selected','scheduled'],to:'scheduled',adminOnly:true},cancel:{from:['approved','selected','scheduled'],to:'cancelled',adminOnly:true},withdraw:{from:['draft','pending_review'],to:'withdrawn'},archive:{from:['completed'],to:'archived',adminOnly:true}
   };
   if(data.action==='publish'){
    if(!admin)throw Object.assign(new Error('Admin access required.'),{status:403});
    await tx.prepare('SELECT pg_advisory_xact_lock(88417421)').run();
    return authJson({ok:true,challengeId:await publishDefinition(tx,row.id,user.userId,now)});
   }
   const transition=transitions[data.action];
   if(!transition||!transition.from.includes(row.status)||transition.adminOnly&&!admin)throw conflict('Invalid challenge lifecycle transition.');
   if(data.action==='submit_review'||data.action==='approve'||data.action==='schedule'){
    const check=await feasibleRoster(tx,inputFor(row));if(!check.feasible)throw conflict(check.reason);
   }
   if(data.action==='open_voting'){
    if(row.sourceType!=='community'||!data.votingEndsAt||data.votingEndsAt<=now+60_000||data.votingEndsAt>now+30*86_400_000)throw conflict('Choose a valid community voting deadline.');
    await tx.prepare('UPDATE challenge_definitions SET voting_ends_at=? WHERE id=?').bind(data.votingEndsAt,row.id).run();
   }
   if(data.action==='schedule'){
    if(row.sourceType==='community'&&!['selected','scheduled'].includes(row.status))throw conflict('Community proposals must win voting before scheduling.');
    if(!data.startsAt||!data.endsAt||data.startsAt<=now||data.endsAt<=data.startsAt)throw conflict('Choose a future UTC publication window.');
    const occupied=await tx.prepare("SELECT id FROM challenge_definitions WHERE id<>? AND status IN ('scheduled','active') AND starts_at<? AND ends_at>? LIMIT 1").bind(row.id,data.endsAt,data.startsAt).first();
    if(occupied)throw conflict('Another challenge is already scheduled in this window.');
    if(row.status==='scheduled'&&await tx.prepare('SELECT 1 FROM challenge_tournament_rounds WHERE definition_id=? LIMIT 1').bind(row.id).first())throw conflict('Tournament round schedules cannot be changed.');
    await tx.prepare('UPDATE challenge_definitions SET starts_at=?,ends_at=? WHERE id=?').bind(data.startsAt,data.endsAt,row.id).run();
   }
   if(data.action==='cancel'&&await tx.prepare('SELECT 1 FROM challenge_tournament_rounds WHERE definition_id=? LIMIT 1').bind(row.id).first())throw conflict('A tournament round depends on this challenge.');
   await auditTransition(tx,row,transition.to,user.userId,data.reason||data.action,now);
   return authJson({ok:true,status:transition.to});
  });
 }catch(error){return errorResponse(error);}
}

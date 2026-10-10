import test from 'node:test';
import assert from 'node:assert/strict';

test('real PostgreSQL: register, verify, battle, squad vote lock, and club spoiler gate',
 {skip:!process.env.TEST_DATABASE_URL&&'Requires TEST_DATABASE_URL and an initialized fresh PostgreSQL database'},async()=>{
  process.env.NODE_ENV='development';
  process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
  process.env.APP_BASE_URL='http://localhost:3000';
  process.env.LOG_LEVEL='fatal';
  process.env.RESEND_API_KEY='fixture-key';
  process.env.EMAIL_FROM='Anime Clash <test@example.com>';
  const sent=[];
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{
   if(String(url)==='https://api.resend.com/emails'){
    sent.push(JSON.parse(options.body));
    return Response.json({id:'fixture-email'});
   }
   throw new Error(`Unexpected external request: ${url}`);
  };
  const {createApp}=await import('../src/app.ts');
  const {clubs}=await import('@anime/domain/catalog');
  const {closePool}=await import('@anime/database/client');
  const app=createApp(),origin='http://localhost:3000';
  const mutation=(url,body,cookie)=>app.inject({method:'POST',url,headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{})},payload:JSON.stringify(body)});
  const get=(url,cookie)=>app.inject({method:'GET',url,headers:cookie?{cookie}:{}});
  async function account(tag){
   const email=`${tag}-${crypto.randomUUID().slice(0,8)}@example.com`,username=`${tag}_${crypto.randomUUID().slice(0,8)}`;
   const response=await mutation('/api/auth/register',{email,username,displayName:tag,password:'SafePassword123!'});
   assert.equal(response.statusCode,201,response.payload);
   const cookie=String(response.headers['set-cookie']).split(';')[0];
   assert.match(cookie,/anime_clash_session=/);
   const html=sent.at(-1).html;
   const token=decodeURIComponent(html.match(/#token=([^"<]+)/)?.[1]||'');
   assert.ok(token.length>20);
   const verified=await mutation('/api/auth/verify-email',{token},cookie);
   assert.equal(verified.statusCode,200,verified.payload);
   const login=await mutation('/api/auth/login',{email,password:'SafePassword123!'});
   assert.equal(login.statusCode,200,login.payload);
   return {cookie:String(login.headers['set-cookie']).split(';')[0],user:response.json().user};
  }
  try{
   const owner=await account('owner'),voter=await account('voter');
   // A legacy ChatGPT-only account must be able to prove mailbox ownership and
   // establish a local credential without replacing its historical user ID.
   const {getPool:legacyPool}=await import('@anime/database/client');
   const poolForLegacy=legacyPool(process.env.TEST_DATABASE_URL);
   const legacyId='usr_'+crypto.randomUUID(),legacyEmail='hosted-'+crypto.randomUUID().slice(0,12)+'@example.com',now=Date.now();
   await poolForLegacy.query('INSERT INTO users (id,email,email_normalized,email_verified,profile_completed,created,updated) VALUES ($1,$2,$3,1,1,$4,$4)',[legacyId,legacyEmail,legacyEmail,now]);
   await poolForLegacy.query("INSERT INTO auth_identities (id,user_id,provider,provider_user_id,provider_email,credential_hash,created) VALUES ($1,$2,'chatgpt',$3,$4,NULL,$5)",[crypto.randomUUID(),legacyId,'hosted_'+legacyId,legacyEmail,now]);
   await poolForLegacy.query("INSERT INTO profiles (\"user\",handle,display_name,avatar_url,bio,favorite_anime,favorite_characters,created,updated) VALUES ($1,$2,'Legacy Fan',NULL,'','[]','[]',$3,$3)",[legacyId,'legacy_'+crypto.randomUUID().replace(/-/g,'').slice(0,8),now]);
   const beforeLegacyEmail=sent.length;
   const recovery=await mutation('/api/auth/forgot-password',{email:legacyEmail});
   assert.equal(recovery.statusCode,200,recovery.payload);
   assert.equal(sent.length,beforeLegacyEmail+1,'Legacy verified owner receives a recovery email');
   const resetToken=decodeURIComponent(sent.at(-1).html.match(/#token=([^"<]+)/)?.[1]||'');
   assert.ok(resetToken.length>20);
   const reset=await mutation('/api/auth/reset-password',{token:resetToken,password:'RecoveredPassword123!'});
   assert.equal(reset.statusCode,200,reset.payload);
   const legacyLogin=await mutation('/api/auth/login',{email:legacyEmail,password:'RecoveredPassword123!'});
   assert.equal(legacyLogin.statusCode,200,legacyLogin.payload);
   assert.equal(legacyLogin.json().user.id,legacyId);

   const me=await get('/api/auth/me',owner.cookie);
   assert.equal(me.json().user.id,owner.user.id);
   const catalog=await get('/api/characters?version=naruto-six-paths');
   assert.equal(catalog.statusCode,200,catalog.payload);
   assert.equal(catalog.json().version.characterId,'naruto');
   const evidence=await mutation('/api/evidence',{action:'create_evidence',evidence:{characterId:'naruto',versionId:'naruto-six-paths',sourceType:'manga',category:'ability',title:'Fixture feat',description:'A documented fixture feat for the battle.',chapter:670}},owner.cookie);
   assert.equal(evidence.statusCode,201,evidence.payload);
   const evidenceId=evidence.json().record.id;

   // Exercise the expanded evidence lifecycle against actual PostgreSQL and authenticated routes.
   const officialSources=[
    {sourceType:'databook',sourceDetails:{publisher:'Example Publishing',pageOrSection:'Page 42'}},
    {sourceType:'official_guidebook',sourceDetails:{publisher:'Example Publishing',pageOrSection:'Section 2'}},
    {sourceType:'creator_interview',sourceDetails:{subject:'Example Creator',publication:'Example Magazine',statementKind:'clarification'}},
    {sourceType:'official_website',sourceUrl:'https://example.org/article',sourceDetails:{organization:'Example Org',officialDomain:'example.org',accessDate:'2026-10-09'}},
    {sourceType:'light_novel',sourceDetails:{author:'Example Writer',chapter:'Chapter 7',continuityRelation:'spin_off'}},
    {sourceType:'game',sourceDetails:{developer:'Example Studio',publisher:'Example Publishing',platform:'PC',sceneOrMission:'Mission 2',continuityClassification:'gameplay'}}
   ];
   for(const [i,source] of officialSources.entries()){
    const original={
     characterId:'naruto',versionId:'naruto-six-paths',category:'statement',
     title:'Structured source feat '+source.sourceType,
     description:'A source-specific fixture proving round-trip evidence behavior.',
     sourceTitle:'Example publication '+source.sourceType,
     sourceLocation:'Citation '+(i+1),sourceUrl:null,continuityStatus:'unknown',
     ...source
    };
    const created=await mutation('/api/evidence',{action:'create_evidence',evidence:original},owner.cookie);
    assert.equal(created.statusCode,201,source.sourceType+': '+created.payload);
    const saved=created.json().record;
    assert.equal(saved.sourceType,source.sourceType);
    assert.deepEqual(saved.sourceDetails,source.sourceDetails);
    assert.equal(saved.sourceTitle,original.sourceTitle);
    assert.equal(saved.sourceLocation,original.sourceLocation);
    const duplicate=await mutation('/api/evidence',{action:'create_evidence',evidence:original},owner.cookie);
    assert.equal(duplicate.statusCode,409,'Exact duplicate must be rejected: '+source.sourceType);

    if(source.sourceType==='databook'){
     const distinctCitation=await mutation('/api/evidence',{action:'create_evidence',evidence:{...original,sourceUrl:'https://example.org/alternate-edition'}},owner.cookie);
     assert.equal(distinctCitation.statusCode,201,'A different citation URL must not be classified as the identical evidence record: '+distinctCitation.payload);
    }
    const denied=await mutation('/api/evidence',{action:'update_evidence',evidenceId:saved.id,evidence:original},voter.cookie);
    assert.equal(denied.statusCode,403,'Other contributors must not change evidence');
    const amended={...original,title:original.title+' updated'};
    const updated=await mutation('/api/evidence',{action:'update_evidence',evidenceId:saved.id,evidence:amended},owner.cookie);
    assert.equal(updated.statusCode,200,updated.payload);
    const filtered=await get('/api/evidence?version=naruto-six-paths&sourceType='+source.sourceType,owner.cookie);
    assert.equal(filtered.statusCode,200,filtered.payload);
    assert.equal(filtered.json().records.some(record=>record.id===saved.id&&record.title===amended.title),true);
    if(source.sourceType==='official_website'){
     const mismatched=await mutation('/api/evidence',{action:'create_evidence',evidence:{...original,sourceUrl:'https://attacker.example/article'}},owner.cookie);
     assert.equal(mismatched.statusCode,400,'Claimed official domain must match the source URL');
    }
    if(source.sourceType==='game'){
     const removed=await mutation('/api/evidence',{action:'delete_evidence',evidenceId:saved.id},owner.cookie);
     assert.equal(removed.statusCode,200,removed.payload);
     const afterDelete=await get('/api/evidence?version=naruto-six-paths&sourceType=game',owner.cookie);
     assert.equal(afterDelete.json().records.some(record=>record.id===saved.id),false,'Deleted evidence must be hidden');
    }
   }

   assert.equal((await get('/api/evidence?version=naruto-six-paths')).json().records.some(record=>record.id===evidenceId),true);
   const battle=await mutation('/api/community',{action:'battle',fighterAId:'naruto',fighterBId:'goku',fighterAVersionId:'naruto-six-paths',fighterBVersionId:'goku-saiyan-saga',battleType:'knockout',location:'neutral_arena',speed:'equalized',knowledge:'none',prepTime:'none',transformationsAllowed:true,standardEquipment:true,notes:''},owner.cookie);
   assert.equal(battle.statusCode,200,battle.payload);

   const expiredBattleId='expired-'+crypto.randomUUID();
   const expiredBase=await poolForLegacy.query('SELECT payload,owner FROM battles WHERE id=$1',[battle.json().id]);
   assert.equal(expiredBase.rowCount,1);
   await poolForLegacy.query('INSERT INTO battles(id,owner,payload,created) VALUES ($1,$2,$3,$4)',
    [expiredBattleId,expiredBase.rows[0].owner,expiredBase.rows[0].payload,Date.now()-8*86_400_000]);
   const tooLate=await mutation('/api/community',{action:'vote',battle:expiredBattleId,side:'a',difficulty:'mid',reason:'Voting after seven days must fail.',evidence:'Chapter 670'},voter.cookie);
   assert.equal(tooLate.statusCode,409,tooLate.payload);
   assert.equal((await poolForLegacy.query('SELECT COUNT(*)::int AS n FROM votes WHERE battle=$1',[expiredBattleId])).rows[0].n,0);

   const vote=await mutation('/api/community',{action:'vote',battle:battle.json().id,side:'a',difficulty:'mid',reason:'Naruto wins with sustained pressure.',evidence:'Naruto chapter 670'},voter.cookie);
   assert.equal(vote.statusCode,200,vote.payload);
   const debate=await get('/api/community?battle='+battle.json().id,owner.cookie);
   assert.equal(debate.statusCode,200,debate.payload);
   const argument=debate.json().debate.find(item=>item.side==='a');
   assert.ok(argument?.argumentId>0,'battle vote keeps a stable argument ID');
   const linked=await mutation('/api/evidence',{action:'link_evidence',battle:battle.json().id,argumentId:argument.argumentId,evidenceId},owner.cookie);
   assert.equal(linked.statusCode,200,linked.payload);
   const comment=await mutation('/api/community',{action:'comment',battle:battle.json().id,argumentId:argument.argumentId,body:'A documented counterpoint.'},owner.cookie);
   assert.equal(comment.statusCode,200,comment.payload);
   assert.equal((await mutation('/api/community',{action:'reaction',argumentId:argument.argumentId,reaction:'upvote'},owner.cookie)).statusCode,200);
   const debateAfter=await get('/api/community?battle='+battle.json().id,owner.cookie);
   assert.equal(debateAfter.statusCode,200,debateAfter.payload);
   assert.equal(debateAfter.json().debate.find(item=>item.argumentId===argument.argumentId).comments.length,1);
   const challenge=await get('/api/squad-challenges',owner.cookie);
   assert.equal(challenge.statusCode,200,challenge.payload);
   const daily=challenge.json().challenge;
   const fighter=daily.fighters.find(item=>item.cost<=daily.budget);
   assert.ok(fighter,'challenge should expose an affordable version');
   const submission=await mutation('/api/squad-submissions',{action:'submit',challengeId:daily.id,name:'Test Squad',strategy:'Control the battlefield and avoid damage.',members:[{characterId:fighter.characterId,versionId:fighter.versionId}]},owner.cookie);
   assert.equal(submission.statusCode,200,submission.payload);
   const submissionId=submission.json().id;
   const selfVote=await mutation('/api/squad-submissions/vote',{submissionId,verdict:'yes'},owner.cookie);
   assert.equal(selfVote.statusCode,403);
   const publicVote=await mutation('/api/squad-submissions/vote',{submissionId,verdict:'yes'},voter.cookie);
   assert.equal(publicVote.statusCode,200,publicVote.payload);
   const locked=await mutation('/api/squad-submissions',{action:'submit',challengeId:daily.id,name:'Changed Squad',strategy:'This edit should fail after voting.',members:[{characterId:fighter.characterId,versionId:fighter.versionId}]},owner.cookie);
   assert.equal(locked.statusCode,409);
   const club=clubs[0];
   const premature=await mutation('/api/community',{action:'post',club:club.id,episode:2,body:'A spoiler-safe discussion for episode two.'},owner.cookie);
   assert.equal(premature.statusCode,400);
   assert.equal((await mutation('/api/community',{action:'progress',club:club.id,episode:2},owner.cookie)).statusCode,200);
   assert.equal((await mutation('/api/community',{action:'post',club:club.id,episode:2,body:'A spoiler-safe discussion for episode two.'},owner.cookie)).statusCode,200);
   const hidden=await get('/api/community?club='+club.id,voter.cookie);
   assert.equal(hidden.statusCode,200,hidden.payload);
   assert.equal(hidden.json().posts.some(post=>post.episode===2),false);
   assert.ok(hidden.json().locked>=1);
   const visible=await get('/api/community?club='+club.id,owner.cookie);
   const tagBypass=await mutation('/api/community',{action:'correct_spoiler',post:visible.json().posts[0].id,episode:3},owner.cookie);
   assert.equal(tagBypass.statusCode,403);
   const report=await mutation('/api/community',{action:'report',subjectType:'post',subjectId:visible.json().posts[0].id,reason:'Fixture moderation review.'},voter.cookie);
   assert.equal(report.statusCode,200,report.payload);
   const missingReport=await mutation('/api/community',{action:'report',subjectType:'post',subjectId:'missing-post',reason:'Invalid target must fail.'},voter.cookie);
   assert.equal(missingReport.statusCode,404);
   assert.equal((await get('/api/community?mode=moderation',voter.cookie)).statusCode,403);
   assert.equal((await get('/api/community?mode=tournaments',owner.cookie)).statusCode,200);
   assert.equal((await get('/api/community?mode=notifications',owner.cookie)).statusCode,200);
   assert.equal((await get('/api/community?mode=discover',owner.cookie)).statusCode,200);
   const logout=await mutation('/api/auth/logout',{},owner.cookie);
   assert.equal(logout.statusCode,200);
   const revoked=await get('/api/auth/me',owner.cookie);
   assert.equal(revoked.json().authenticated,false);
   const {createSession}=await import('../src/lib/auth.ts');
   const {withHttpContext}=await import('../src/lib/http-context.ts');
   const {getPool}=await import('@anime/database/client');
   await Promise.all(Array.from({length:20},()=>withHttpContext({request:new Request(origin+'/api/auth/me'),outgoingCookies:[]},()=>createSession(owner.user.id))));
   const active=await getPool(process.env.TEST_DATABASE_URL,Number(process.env.DB_POOL_MAX||10)).query('SELECT COUNT(*)::int AS n FROM auth_sessions WHERE user_id=$1',[owner.user.id]);
   assert.equal(active.rows[0].n,12,'concurrent logins must respect the session cap');
  }finally{await app.close();await closePool();globalThis.fetch=originalFetch;}
 });

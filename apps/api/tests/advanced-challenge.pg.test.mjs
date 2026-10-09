import test from 'node:test';
import assert from 'node:assert/strict';

test('official challenge publication, restrictions, community votes and auditable round results',
 {skip:!process.env.TEST_DATABASE_URL&&'Requires initialized PostgreSQL'},async()=>{
  process.env.NODE_ENV='development';process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
  process.env.APP_BASE_URL='http://localhost:3000';process.env.LOG_LEVEL='fatal';
  const adminId=`admin-${crypto.randomUUID()}`;process.env.ANIME_CLASH_ADMIN_USER_ID=adminId;
  const {createApp}=await import('../src/app.ts');
  const {getPool,closePool}=await import('@anime/database/client');
  const {hashOpaqueToken}=await import('@anime/domain/auth-crypto');
  const {schedulerTick}=await import('../src/lib/challenge-lifecycle.ts');
  const {eligibleRoster,feasibleRoster}=await import('../src/lib/advanced-challenge.ts');
  const {generateFeasibleChallenge}=await import('../src/lib/challenge-generator.ts');
  const {database}=await import('../src/db/raw.ts');
  const {challengeDefinitionSchema}=await import('@anime/contracts/advanced-challenge');
  const pool=getPool(process.env.DATABASE_URL,1),app=createApp(),origin='http://localhost:3000';
  async function fixture(idValue){
   const now=Date.now(),token=crypto.randomUUID()+crypto.randomUUID(),email=`${idValue}@example.com`;
   await pool.query('INSERT INTO users(id,email,email_normalized,email_verified,profile_completed,created,updated) VALUES ($1,$2,$2,1,1,$3,$3)',[idValue,email,now]);
   await pool.query("INSERT INTO auth_identities(id,user_id,provider,provider_user_id,created) VALUES ($1,$2,'email',$3,$4)",[crypto.randomUUID(),idValue,email,now]);
   await pool.query('INSERT INTO profiles("user",handle,display_name,bio,favorite_anime,favorite_characters,created,updated) VALUES ($1,$2,$3,\'\',\'[]\',\'[]\',$4,$4)',[idValue,idValue.replaceAll('-','_').slice(0,24),idValue,now]);
   await pool.query('INSERT INTO auth_sessions(id,user_id,token_hash,created,expires,last_used) VALUES ($1,$2,$3,$4,$5,$4)',[crypto.randomUUID(),idValue,await hashOpaqueToken(token),now,now+86_400_000]);
   return `anime_clash_session=${token}`;
  }
  const mutation=(url,body,cookie)=>app.inject({method:'POST',url,headers:{origin,'content-type':'application/json',cookie},payload:JSON.stringify(body)});
  const get=(url,cookie)=>app.inject({method:'GET',url,headers:cookie?{cookie}:{}});
  try{
   const admin=await fixture(adminId),creator=await fixture(`creator-${crypto.randomUUID()}`),voter=await fixture(`voter-${crypto.randomUUID()}`),entrant=await fixture(`entrant-${crypto.randomUUID()}`);
   const definition={title:'Hold the Spirit Gate',description:'Secure this location against repeated attacks.',difficulty:'medium',objective:{type:'capture',location:'Spirit Gate',contestingVersions:['madara-edo-tensei'],holdSeconds:120},budget:100,minMembers:1,maxMembers:3,restrictions:{roleRequirements:[{role:'controller',min:1}],bannedCharacters:['goku'],franchise:'any'}};
   // Every current canonical priced fighter must remain eligible for an
   // unrestricted advanced event, including fighters seeded after migration 0002.
   const entireRoster=await eligibleRoster(database(),challengeDefinitionSchema.parse({...definition,restrictions:{}}));
   const storedPrices=await pool.query('SELECT COUNT(*)::int AS n FROM squad_version_costs WHERE cost>0');
   assert.equal(entireRoster.length,storedPrices.rows[0].n,'New roster fighters must not vanish due to missing franchise backfill');
   const preview=await mutation('/api/challenge-management',{action:'preview',definition},admin);
   assert.equal(preview.statusCode,200,preview.payload);assert.equal(preview.json().feasible,true);
   const disabled=challengeDefinitionSchema.parse({...definition,restrictions:{...definition.restrictions,disabledAbilityCategories:['summoning']}});
   const eligible=await eligibleRoster(database(),disabled);
   assert.deepEqual(eligible.find(f=>f.versionId==='megumi-season-1')?.traits,[],'Disabled abilities conservatively suppress tactical metadata for affected versions');
   // Mastered abilities are still present on the exact combat version and
   // cannot bypass an administrator's bans or disabled-technique rules.
   const blueBanned=await eligibleRoster(database(),challengeDefinitionSchema.parse({...definition,restrictions:{...definition.restrictions,bannedAbilities:['goku-blue-ability']}}));
   assert.ok(!blueBanned.some(f=>f.versionId==='goku-super-saiyan-blue'),'Banned mastered ability must reject the version');
   const blueDisabled=await eligibleRoster(database(),challengeDefinitionSchema.parse({...definition,restrictions:{...definition.restrictions,disabledAbilities:['goku-blue-ability']}}));
   assert.deepEqual(blueDisabled.find(f=>f.versionId==='goku-super-saiyan-blue')?.roles,[],'Disabled mastered ability suppresses tactical role credit');
   for(const alignment of ['hero','villain']){
    const aligned=await eligibleRoster(database(),challengeDefinitionSchema.parse({...definition,restrictions:{...definition.restrictions,alignment}}));
    assert.ok(aligned.length>0);
    assert.ok(aligned.every(f=>f.alignment===alignment),'Unknown and other alignments cannot pass strict events');
   }
   const sameSeries=await feasibleRoster(database(),challengeDefinitionSchema.parse({...definition,minMembers:2,maxMembers:2,restrictions:{...definition.restrictions,franchise:'same'}}));
   assert.equal(sameSeries.feasible,true);
   const protectedDefinition=challengeDefinitionSchema.parse({...definition,objective:{type:'defend',protectedTarget:{characterId:'sakura',versionId:'sakura-byakugo'},attackerVersions:['madara-edo-tensei'],condition:'Protect Sakura from the attacking squad.'}});
   assert.ok((await eligibleRoster(database(),protectedDefinition)).every(f=>f.characterId!=='sakura'));
   const generated=await generateFeasibleChallenge(database(),71),repeat=await generateFeasibleChallenge(database(),71);
   assert.deepEqual(generated.definition,repeat.definition,'The generator is reproducible for a fixed seed and roster');
   assert.equal(generated.feasibility.feasible,true);
   assert.equal((await feasibleRoster(database(),{...disabled,restrictions:{...disabled.restrictions,bannedFranchises:['naruto','jujutsu-kaisen','one-piece','bleach','dragon-ball','demon-slayer','attack-on-titan','black-clover','chainsaw-man','dr-stone','fire-force','my-hero-academia','one-punch-man']}})).feasible,false);
   const community=await mutation('/api/challenge-management',{action:'create',definition},creator);
   assert.equal(community.statusCode,201,community.payload);
   const proposalId=community.json().id;
   assert.equal((await mutation('/api/challenge-management',{action:'submit_review',id:proposalId},creator)).statusCode,200);
   assert.equal((await mutation('/api/challenge-management',{action:'approve',id:proposalId},creator)).statusCode,403);
   assert.equal((await mutation('/api/challenge-management',{action:'approve',id:proposalId},admin)).statusCode,200);
   assert.equal((await mutation('/api/challenge-management',{action:'schedule',id:proposalId,startsAt:Date.now()+200000,endsAt:Date.now()+400000},admin)).statusCode,409,'Community proposal cannot bypass voting');
   assert.equal((await mutation('/api/challenge-management',{action:'open_voting',id:proposalId,votingEndsAt:Date.now()+120_000},admin)).statusCode,200);
   assert.equal((await mutation('/api/challenge-management',{action:'vote',id:proposalId},creator)).statusCode,409);
   const first=await mutation('/api/challenge-management',{action:'vote',id:proposalId},voter);
   const repeated=await mutation('/api/challenge-management',{action:'vote',id:proposalId},voter);
   assert.equal(first.statusCode,200,first.payload);assert.equal(repeated.json().votes,1);
   assert.equal((await get('/api/challenge-management?scope=mine',voter)).json().definitions.length,0);
   assert.equal((await get('/api/challenge-management?scope=admin',voter)).statusCode,403);
   const official=await mutation('/api/challenge-management',{action:'create',definition},admin);
   assert.equal(official.statusCode,201,official.payload);
   const idValue=official.json().id;
   assert.equal((await mutation('/api/challenge-management',{action:'submit_review',id:idValue},admin)).statusCode,200);
   assert.equal((await mutation('/api/challenge-management',{action:'approve',id:idValue},admin)).statusCode,200);
   const [rotationOne,rotationTwo]=await Promise.all([get('/api/squad-challenges',entrant),get('/api/squad-challenges',voter)]);
   const rotationId=rotationOne.json().challenge.id;
   assert.equal(rotationTwo.json().challenge.id,rotationId,'Concurrent replicas reuse one committed daily challenge');
   assert.ok(rotationOne.json().challenge.fighters.length>0);
   assert.match(rotationId,/^daily-/);
   const published=await mutation('/api/challenge-management',{action:'publish',id:idValue},admin);
   assert.equal(published.statusCode,200,published.payload);
   const challengeId=published.json().challengeId;
   // Published roster prices are immutable even when UPDATE tries to move
   // a record into an unpublished challenge. The old challenge must be checked.
   const sandboxId=`unpublished-${crypto.randomUUID()}`;
   await pool.query("INSERT INTO daily_squad_challenges (id,type,title,description,budget,min_members,max_members,rules_json,starts_at,ends_at,status,created) VALUES ($1,'open_build','Unpublished fixture','Private draft fixture',100,1,5,'{}',$2,$3,'scheduled',$2)",[sandboxId,Date.now()+300000,Date.now()+600000]);
   const snapshotVersion=(await pool.query('SELECT version_id FROM daily_squad_challenge_costs WHERE challenge_id=$1 LIMIT 1',[challengeId])).rows[0].version_id;
   await assert.rejects(pool.query('UPDATE daily_squad_challenge_costs SET challenge_id=$1 WHERE challenge_id=$2 AND version_id=$3',[sandboxId,challengeId,snapshotVersion]),/published_challenge_cost_immutable/);
   const current=(await get('/api/squad-challenges',entrant)).json().challenge;
   assert.equal(current.id,challengeId);
   assert.equal(current.objective.type,'capture');
   assert.ok(current.fighters.every(f=>f.characterId!=='goku'));
   assert.equal((await pool.query('SELECT status FROM daily_squad_challenges WHERE id=$1',[rotationId])).rows[0].status,'active','Rotation can resume after an official override expires');
   assert.equal((await mutation('/api/squad-submissions',{action:'submit',challengeId:rotationId,name:'Old rotation',strategy:'This should be paused during the official challenge.',members:[{characterId:'sakura',versionId:'sakura-byakugo'}]},entrant)).statusCode,409);
   const selected=current.fighters.find(f=>f.roles.some(r=>r.role==='controller')&&f.cost<=current.budget);
   assert.ok(selected);
   const invalid=await mutation('/api/squad-submissions',{action:'submit',challengeId,name:'Illegal squad',strategy:'A forbidden character cannot enter the challenge.',members:[{characterId:'goku',versionId:'goku-saiyan-saga'}]},entrant);
   assert.equal(invalid.statusCode,400,invalid.payload);
   const tournamentId=`tournament-${crypto.randomUUID()}`,roundId=`round-${crypto.randomUUID()}`,secondId=`round-${crypto.randomUUID()}`,now=Date.now();
   await pool.query("INSERT INTO challenge_tournaments(id,title,description,status,starts_at,ends_at,scoring_version,created_by,created_at) VALUES ($1,'Weekly Fixture','Verified tournament fixture','active',$2,$3,1,$4,$2)",[tournamentId,now-1000,now+86_400_000,adminId]);
   await pool.query('INSERT INTO challenge_tournament_rounds(id,tournament_id,definition_id,challenge_id,round_number,starts_at,ends_at) VALUES ($1,$2,$3,$4,1,$5,$6)',[roundId,tournamentId,idValue,challengeId,now-1000,now+43_200_000]);
   await pool.query('INSERT INTO challenge_tournament_rounds(id,tournament_id,definition_id,challenge_id,round_number,starts_at,ends_at) VALUES ($1,$2,$3,$4,2,$5,$6)',[secondId,tournamentId,proposalId,null,now+43_200_000,now+86_400_000]);
   assert.equal((await mutation('/api/challenge-tournaments',{action:'register',tournamentId},entrant)).statusCode,200);
   const scored=await mutation('/api/challenge-tournaments',{action:'submit',roundId,name:'Control Team',strategy:'Hold the objective with control and defensive coverage.',members:[{characterId:selected.characterId,versionId:selected.versionId}]},entrant);
   assert.equal(scored.statusCode,200,scored.payload);
   assert.equal((await mutation('/api/challenge-tournaments',{action:'submit',roundId,name:'Control Team',strategy:'Repeat scoring should be rejected by the server.',members:[{characterId:selected.characterId,versionId:selected.versionId}]},entrant)).statusCode,409);
   const standing=await get(`/api/challenge-tournaments?id=${tournamentId}`,entrant);
   assert.equal(standing.statusCode,200,standing.payload);
   assert.equal(standing.json().standings[0].totalPoints,scored.json().evaluation.score);
   assert.equal(standing.json().myResults.length,1);
   const immutable=await pool.query('SELECT rules_snapshot,squad_snapshot,breakdown_json FROM challenge_tournament_results WHERE round_id=$1',[roundId]);
   assert.equal(JSON.parse(immutable.rows[0].squad_snapshot)[0].versionId,selected.versionId);
   assert.ok(JSON.parse(immutable.rows[0].breakdown_json).breakdown.length>0);
   const day=86_400_000,start=Math.floor(Date.now()/day)*day+3*day;
   const planned=[];
   for(let index=0;index<2;index++){
    const startsAt=start+index*day,endsAt=startsAt+day;
    const created=await mutation('/api/challenge-management',{action:'create',definition:{...definition,title:`Future control trial ${index+1}`,startsAt,endsAt}},admin);
    assert.equal(created.statusCode,201,created.payload);
    const definitionId=created.json().id;
    assert.equal((await mutation('/api/challenge-management',{action:'submit_review',id:definitionId},admin)).statusCode,200);
    assert.equal((await mutation('/api/challenge-management',{action:'approve',id:definitionId},admin)).statusCode,200);
    assert.equal((await mutation('/api/challenge-management',{action:'schedule',id:definitionId,startsAt,endsAt},admin)).statusCode,200);
    planned.push({definitionId,startsAt,endsAt});
   }
   const configured=await mutation('/api/challenge-tournaments',{action:'create',title:'Scheduled Weekly Championship',description:'Two official control trials with pinned immutable scores.',startsAt:start,endsAt:start+2*day,rounds:planned},admin);
   assert.equal(configured.statusCode,201,configured.payload);
   assert.equal((await get(`/api/challenge-tournaments?id=${configured.json().id}`,entrant)).json().rounds.length,2);
   assert.equal((await mutation('/api/challenge-tournaments',{action:'register',tournamentId:configured.json().id},entrant)).statusCode,200);
   assert.equal((await mutation('/api/challenge-tournaments',{action:'register',tournamentId:configured.json().id},entrant)).statusCode,200,'Duplicate registration is idempotent');
   assert.equal((await schedulerTick()).failed,0);
   const votingClosed=await schedulerTick(Date.now()+121_000);
   assert.equal(votingClosed.failed,0);
   const selectedProposal=await pool.query('SELECT status,starts_at,ends_at FROM challenge_definitions WHERE id=$1',[proposalId]);
   assert.equal(selectedProposal.rows[0].status,'scheduled');
   const scheduled=await schedulerTick(Number(selectedProposal.rows[0].starts_at)+1000);
   assert.equal(scheduled.failed,0);
   assert.equal((await pool.query('SELECT status FROM challenge_definitions WHERE id=$1',[proposalId])).rows[0].status,'active');
   await assert.rejects(pool.query('UPDATE challenge_tournament_results SET score=100 WHERE round_id=$1',[roundId]),/tournament_result_immutable/);
  }finally{await app.close();await closePool();}
 });

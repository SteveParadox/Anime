import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const domain=readFileSync('lib/squad-challenge.ts','utf8');
const submissions=readFileSync('app/api/squad-submissions/route.ts','utf8');
const votes=readFileSync('app/api/squad-submissions/vote/route.ts','utf8');
const challengeApi=readFileSync('app/api/squad-challenges/route.ts','utf8');

test('submission contract never accepts client-authoritative fighter cost',()=>{
 const submitSchema=submissions.slice(submissions.indexOf("action:z.literal('submit')"),submissions.indexOf("action:z.literal('delete')"));
 assert.match(submitSchema,/members:z\.array\(memberSchema\)/);
 assert.doesNotMatch(submitSchema,/cost\s*:/);
 assert.match(submissions,/resolveSubmissionMembers\(db,challenge,input\.members\)/);
 assert.match(domain,/FROM daily_squad_challenge_costs WHERE challenge_id=\?/);
 assert.match(domain,/Squad costs \$\{totalCost\} points but this challenge budget is \$\{challenge\.budget\}/);
});

test('version integrity and duplicate-character policy are server enforced',()=>{
 assert.match(domain,/version\.characterId!==character\.id/);
 assert.match(domain,/!version\.canonical/);
 assert.match(domain,/new Set\(characterIds\)\.size!==characterIds\.length/);
 assert.match(domain,/Each character may appear only once in a challenge squad/);
 assert.match(domain,/price\.characterId!==selection\.characterId/);
});

test('challenge lifecycle is checked for submissions and votes',()=>{
 assert.match(submissions,/effectiveChallengeStatus\(challenge,now\)!=='active'/);
 assert.match(votes,/effectiveChallengeStatus\(/);
 assert.match(votes,/Voting for this challenge is closed/);
 assert.match(challengeApi,/effectiveChallengeStatus\(challenge,now\)/);
});

test('writes require trusted application auth and same-origin protection',()=>{
 for(const source of [submissions,votes]){
  assert.match(source,/sameOrigin\(request\)/);
  assert.match(source,/getCurrentUser\(\)/);
  assert.match(source,/canContribute\(user\)/);
  assert.match(source,/readJson\(request,/);
 }
});

test('self voting and duplicate logical votes are prevented',()=>{
 assert.match(votes,/submission\.owner===user\.userId/);
 assert.match(votes,/You cannot vote on your own squad submission/);
 assert.match(votes,/ON CONFLICT\(submission_id,user\) DO UPDATE SET verdict=excluded\.verdict/);
});

test('submission changes are blocked after community voting starts',()=>{
 assert.match(submissions,/existing\.lockedAt\|\|Number\(existing\.votes\)>0/);
 const migration=readFileSync('drizzle/0006_daily_squad_challenges.sql','utf8');
 assert.match(migration,/squad_submission_vote_lock_update/);
 assert.match(migration,/squad_submission_vote_lock_member_insert/);
 assert.match(migration,/squad_submission_vote_lock_member_update/);
 assert.match(migration,/squad_submission_vote_lock_member_delete/);
});

test('public submission responses do not expose account email or provider subjects',()=>{
 const publicBlock=submissions.slice(submissions.indexOf('function publicSubmission'),submissions.indexOf('export async function GET'));
 assert.doesNotMatch(publicBlock,/email\s*:/);
 assert.doesNotMatch(publicBlock,/providerUserId/);
 assert.match(publicBlock,/owner:\{username:row\.handle,displayName:row\.displayName,avatarUrl:row\.avatarUrl\}/);
});

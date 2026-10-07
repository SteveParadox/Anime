import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveSquadChallengeStatus,validateSquadBudget,validateSquadIdentities} from '../lib/squad-challenge-policy.ts';

test('squad identity policy allows one through challenge maximum members',()=>{
 const selections=[
  {characterId:'gojo',versionId:'gojo-shinjuku'},
  {characterId:'itachi',versionId:'itachi-akatsuki'},
  {characterId:'levi',versionId:'levi-standard'}
 ];
 assert.doesNotThrow(()=>validateSquadIdentities(selections,1,5));
});

test('squad identity policy rejects too many members',()=>{
 const selections=Array.from({length:6},(_,index)=>({characterId:`c${index}`,versionId:`v${index}`}));
 assert.throws(()=>validateSquadIdentities(selections,1,5),/Choose between 1 and 5 fighters/);
});

test('squad identity policy rejects duplicate characters across versions',()=>{
 assert.throws(
  ()=>validateSquadIdentities([
   {characterId:'naruto',versionId:'naruto-sage-mode'},
   {characterId:'naruto',versionId:'naruto-six-paths'}
  ],1,5),
  /Each character may appear only once/
 );
});

test('squad identity policy rejects an exact duplicate version',()=>{
 assert.throws(
  ()=>validateSquadIdentities([
   {characterId:'goku',versionId:'goku-super-saiyan'},
   {characterId:'goku-copy',versionId:'goku-super-saiyan'}
  ],1,5),
  /Duplicate character versions/
 );
});

test('budget policy accepts under-budget and exact-budget squads',()=>{
 assert.equal(validateSquadBudget([{cost:38},{cost:30},{cost:12},{cost:10},{cost:8}],100),98);
 assert.equal(validateSquadBudget([{cost:58},{cost:30},{cost:12}],100),100);
});

test('budget policy rejects over-budget squads',()=>{
 assert.throws(()=>validateSquadBudget([{cost:100},{cost:38}],100),/Squad costs 138 points/);
});

test('budget policy rejects malformed server pricing',()=>{
 assert.throws(()=>validateSquadBudget([{cost:0}],100),/invalid challenge cost/);
 assert.throws(()=>validateSquadBudget([{cost:1.5}],100),/invalid challenge cost/);
});


test('challenge lifecycle is determined from server time boundaries',()=>{
 const start=1_000,end=2_000;
 assert.equal(resolveSquadChallengeStatus('scheduled',start,end,999),'scheduled');
 assert.equal(resolveSquadChallengeStatus('scheduled',start,end,1_000),'active');
 assert.equal(resolveSquadChallengeStatus('active',start,end,1_500),'active');
 assert.equal(resolveSquadChallengeStatus('active',start,end,2_000),'closed');
 assert.equal(resolveSquadChallengeStatus('closed',start,end,1_500),'closed');
});

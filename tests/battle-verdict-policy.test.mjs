import test from 'node:test';
import assert from 'node:assert/strict';
import {battleVotingEndsAt,resolveCommunityVerdict,communityWinRate,communityVoteMargin,communityControversy,BATTLE_VOTING_WINDOW_MS} from '../packages/domain/src/battle-analytics.ts';

test('official battle voting deadline is stable and finite',()=>{
 assert.equal(battleVotingEndsAt(1000),1000+BATTLE_VOTING_WINDOW_MS);
 assert.throws(()=>battleVotingEndsAt(0));
});
test('unqualified one-vote result is never an official victory',()=>{
 assert.equal(resolveCommunityVerdict({a:1,b:0,draw:0}),'no_contest');
 assert.equal(resolveCommunityVerdict({a:4,b:5,draw:0}),'no_contest');
});
test('qualifying decisive votes produce the correct verdict',()=>{
 assert.equal(resolveCommunityVerdict({a:7,b:3,draw:0}),'a');
 assert.equal(resolveCommunityVerdict({a:1,b:8,draw:1}),'b');
});
test('top-rank tie and majority draw vote produce a draw',()=>{
 assert.equal(resolveCommunityVerdict({a:5,b:5,draw:0}),'draw');
 assert.equal(resolveCommunityVerdict({a:3,b:3,draw:4}),'draw');
 assert.equal(resolveCommunityVerdict({a:3,b:3,draw:3},9),'draw');
});
test('bad or negative vote counts cannot create a verdict',()=>{
 assert.throws(()=>resolveCommunityVerdict({a:-1,b:9,draw:2}));
 assert.throws(()=>resolveCommunityVerdict({a:NaN,b:9,draw:2}));
 assert.throws(()=>resolveCommunityVerdict({a:9.5,b:1,draw:0}));
});
test('win rate denominator includes draws and never no-contests',()=>{
 assert.equal(communityWinRate(25,12,5),59.52);
 assert.equal(communityWinRate(0,0,0),null);
 assert.equal(communityWinRate(2,0,2),50);
});
test('closeness and controversy require actual participation',()=>{
 assert.equal(communityVoteMargin({a:51,b:49,draw:0}),2);
 assert.equal(communityVoteMargin({a:0,b:0,draw:10}),null);
 assert.equal(communityControversy({a:1,b:1,draw:0},100,100),0);
 assert.ok(communityControversy({a:51,b:49,draw:0},10,2)>communityControversy({a:96,b:4,draw:0},10,2));
});

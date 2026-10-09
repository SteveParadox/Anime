import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeTraitInteractions,analyzeSquadComposition} from '../packages/domain/src/squad-synergy.ts';

const fighter=(versionId,traits)=>({versionId,roles:[],traits});
test('trait synergy requires distinct members and explains the triggering versions',()=>{
 const members=[fighter('healer-v1',['healing']),fighter('front-v2',['close_range'])];
 const hits=analyzeTraitInteractions(members);
 assert.equal(hits.length,1);
 assert.equal(hits[0].id,'healing-frontline');
 assert.deepEqual(hits[0].memberVersionIds,['healer-v1','front-v2']);
 assert.deepEqual(analyzeSquadComposition(members).traitInteractions,hits);
});
test('one fighter cannot self-trigger cross-member tactical synergy',()=>{
 assert.deepEqual(analyzeTraitInteractions([fighter('solo',['healing','close_range'])]),[]);
});
test('duplicate trait metadata does not inflate the interaction count',()=>{
 const result=analyzeTraitInteractions([
  fighter('a',['barrier','barrier']),
  fighter('b',['long_range','long_range']),
  fighter('c',['long_range'])
 ]);
 assert.deepEqual(result.map(r=>r.id),['barrier-ranged']);
});
test('incomplete trait metadata yields no fabricated interaction',()=>{
 assert.deepEqual(analyzeTraitInteractions([fighter('unknown',[]),fighter('other',['long_range'])]),[]);
});
test('analysis is deterministic for the same member sequence',()=>{
 const members=[fighter('a',['crowd_control']),fighter('b',['area_damage'])];
 assert.deepEqual(analyzeTraitInteractions(members),analyzeTraitInteractions(members));
});

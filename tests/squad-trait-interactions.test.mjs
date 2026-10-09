import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeTraitInteractions,analyzeSquadComposition} from '../packages/domain/src/squad-synergy.ts';
import {renderToStaticMarkup} from '../apps/web/node_modules/react-dom/server.js';
import {SquadInsights} from '../apps/web/components/squad-insights.tsx';

const fighter=(versionId,traits,roles=[])=>({versionId,roles:roles.map(role=>({role,priority:'primary'})),traits});
test('trait synergy requires distinct members and explains the triggering versions',()=>{
 const members=[fighter('healer-v1',['healing'],['healer']),fighter('front-v2',['close_range'])];
 const hits=analyzeTraitInteractions(members);
 assert.equal(hits.length,1);
 assert.equal(hits[0].id,'healing-frontline');
 assert.deepEqual(hits[0].memberVersionIds,['healer-v1','front-v2']);
 assert.deepEqual(analyzeSquadComposition(members).traitInteractions,hits);
});
test('one fighter cannot self-trigger cross-member tactical synergy',()=>{
 assert.deepEqual(analyzeTraitInteractions([fighter('solo',['healing','close_range'],['healer'])]),[]);
});
test('self-regeneration alone does not imply healing an ally',()=>{
 const selfHealer=fighter('nezuko-season-1',['healing'],['tank']);
 const frontline=fighter('levi-season-1',['close_range']);
 assert.deepEqual(analyzeTraitInteractions([selfHealer,frontline]),[]);
 assert.equal(analyzeTraitInteractions([fighter('sakura-byakugo',['healing'],['healer']),frontline])[0].id,'healing-frontline');
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
 assert.deepEqual(analyzeTraitInteractions(members),[{
  id:'control-area',kind:'synergy',label:'Control and Area Damage',
  description:'Restraining opponents may create openings for allied area attacks.',
  memberVersionIds:['a','b'],traits:['crowd_control','area_damage']
 }]);
 assert.deepEqual(analyzeTraitInteractions(structuredClone(members)),analyzeTraitInteractions(members));
});
test('squad insights show trait evidence and the contributing versions',()=>{
 const members=[
  {...fighter('sakura-byakugo',['healing'],['healer']),characterName:'Sakura'},
  {...fighter('levi-season-1',['close_range']),characterName:'Levi'}
 ];
 const html=renderToStaticMarkup(SquadInsights({members}));
 assert.match(html,/Tactical trait combinations/);
 assert.match(html,/Frontline Sustain/);
 assert.match(html,/Sakura \+ Levi/);
 assert.match(html,/sakura-byakugo \+ levi-season-1/);
 assert.doesNotMatch(renderToStaticMarkup(SquadInsights({members:[members[0]]})),/Tactical trait combinations/);
});

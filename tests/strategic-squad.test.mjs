import test from 'node:test';
import assert from 'node:assert/strict';
import {COMBAT_ROLES,ROLE_DEFINITIONS,parseRoleRequirements,roleRequirementProgress,validateRoleRequirements,analyzeSquadComposition} from '../lib/squad-synergy.ts';

const m=(versionId,roles,traits=[])=>({versionId,characterName:versionId,roles:roles.map((role,i)=>({role,priority:i===0?'primary':'secondary'})),traits});
test('role taxonomy has 11 defined, distinct stable identifiers',()=>{
 assert.equal(new Set(COMBAT_ROLES).size,11);
 assert.ok(COMBAT_ROLES.includes('defense'));
 for(const role of COMBAT_ROLES)assert.ok(ROLE_DEFINITIONS[role].description.length>12);
});
test('role counts reflect multi-role versions without duplicating a fighter per role',()=>{
 const x=analyzeSquadComposition([m('aizen',['controller','strategist']),m('gojo',['defense','controller']),m('sakura',['healer','dps','tank'])]);
 assert.equal(x.roleCounts.find(r=>r.role==='controller').count,2);
 assert.equal(x.roleDiversity,6);
 assert.equal(x.coverage.find(r=>r.label==='Control').level,'Strong');
 assert.equal(x.coverage.find(r=>r.label==='Healing').level,'Present');
});
test('five DPS are valid composition data, not a mandatory balanced template',()=>{
 const result=analyzeSquadComposition(Array.from({length:5},(_,i)=>m(String(i),['dps'])));
 assert.deepEqual(result.concentrations,[{role:'dps',count:5}]);
 assert.ok(result.gaps.includes('No dedicated healer'));
});
test('cross-fighter synergy appears only when both roles have distinct team members',()=>{
 const control=m('a',['controller']),dps=m('b',['dps']),healer=m('c',['healer']);
 const withControl=analyzeSquadComposition([control,dps,healer]);
 assert.ok(withControl.synergies.some(s=>s.id==='control-dps'));
 assert.ok(!analyzeSquadComposition([dps,healer]).synergies.some(s=>s.id==='control-dps'));
 assert.ok(!analyzeSquadComposition([m('solo',['controller','dps'])]).synergies.some(s=>s.id==='control-dps'));
});
test('analysis is deterministic, never returns win probability',()=>{
 const squad=[m('gojo',['defense','controller'],['barrier']),m('sakura',['healer','support'],['healing'])];
 const a=analyzeSquadComposition(squad);
 assert.deepEqual(a,analyzeSquadComposition(squad));
 assert.ok(!Object.hasOwn(a,'winProbability'));
});
test('requirements validate real roles, count each qualifying member once, allow alternatives',()=>{
 const requirements=parseRoleRequirements([{type:'any_of',roles:['tank','defense'],min:1},{type:'role',role:'healer',min:1},{type:'role',role:'dps',max:2}]);
 const squad=[m('gojo',['defense','controller']),m('sakura',['healer','dps'])];
 assert.doesNotThrow(()=>validateRoleRequirements(squad,requirements));
 assert.deepEqual(roleRequirementProgress(squad,requirements).map(x=>x.valid),[true,true,true]);
 assert.throws(()=>validateRoleRequirements([m('gojo',['defense'])],requirements),/Healer/);
 assert.throws(()=>validateRoleRequirements([m('a',['dps']),m('b',['dps']),m('c',['dps']),m('d',['healer','tank'])],requirements),/DPS/);
 assert.equal(roleRequirementProgress([m('dual',['defense','tank'])],[{type:'any_of',roles:['tank','defense'],min:2}])[0].count,1);
});
test('unsupported or malformed role identifiers fail closed',()=>{
 assert.throws(()=>parseRoleRequirements([{type:'role',role:'omnipotent',min:1}]),/Invalid/);
 assert.throws(()=>parseRoleRequirements([{type:'any_of',roles:['tank','tank'],min:1}]),/Invalid/);
 assert.throws(()=>parseRoleRequirements([{type:'role',role:'healer',min:1,max:0}]),/Invalid/);
 assert.throws(()=>parseRoleRequirements('healer'),/Invalid/);
});
test('versions with no role data are not silently mapped to their strongest era',()=>{
 const x=analyzeSquadComposition([m('legacy',[])]);
 assert.equal(x.roleDiversity,0);
 assert.equal(x.unclassified,1);
});

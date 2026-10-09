import test from 'node:test';
import assert from 'node:assert/strict';
import {challengeDefinitionSchema,evaluateObjective,validateRoleRules} from '../packages/contracts/src/advanced-challenge.ts';

const fighter=(versionId,roles,traits,cost=10)=>({versionId,characterId:versionId,cost,roles:roles.map(role=>({role,priority:'primary'})),traits});
test('objectives produce distinct, labeled strategic estimates',()=>{
 const squad=[fighter('defender',['tank','defense'],['barrier','crowd_control']),fighter('rescuer',['speedster'],['mobility','stealth'])];
 const boss=evaluateObjective({type:'defeat_target',boss:{characterId:'madara',versionId:'madara-edo-tensei'}},squad,100);
 const protect=evaluateObjective({type:'defend',protectedTarget:{characterId:'rukia',versionId:'rukia-bankai'},attackerVersions:['madara-edo-tensei'],condition:'Keep Rukia safe.'},squad,100);
 const rescue=evaluateObjective({type:'rescue',rescueTarget:{characterId:'rukia',versionId:'rukia-bankai'},defenderVersions:['madara-edo-tensei'],extractionZone:'Spirit Gate'},squad,100);
 const capture=evaluateObjective({type:'capture',location:'Spirit Gate',contestingVersions:['madara-edo-tensei'],holdSeconds:120},squad,100);
 assert.ok(protect.score>boss.score);
 assert.ok(rescue.score>boss.score);
 assert.ok(capture.score>boss.score);
 for(const result of [boss,protect,rescue,capture]){
  assert.equal(result.method,'estimated strategic suitability');assert.equal(result.scoringVersion,1);
  assert.ok(result.breakdown.length>=4);
 }
});
test('longer survival penalizes missing healing without inventing a combat outcome',()=>{
 const squad=[fighter('tank',['tank'],['barrier'])];
 const short=evaluateObjective({type:'survive',waves:2,durationSeconds:30},squad,100);
 const long=evaluateObjective({type:'survive',waves:2,durationSeconds:600},squad,100);
 assert.ok(long.score<short.score);
 assert.equal(long.breakdown.at(-1).criterion,'Extended survival without healing');
});
test('long control and urgent extraction change tactical suitability',()=>{
 const squad=[fighter('controller',['controller'],['crowd_control'])];
 assert.ok(evaluateObjective({type:'capture',location:'Gate',contestingVersions:['madara-edo-tensei'],holdSeconds:600},squad,100).score<evaluateObjective({type:'capture',location:'Gate',contestingVersions:['madara-edo-tensei'],holdSeconds:30},squad,100).score);
 const rescue={type:'rescue',rescueTarget:{characterId:'rukia',versionId:'rukia-bankai'},defenderVersions:['madara-edo-tensei'],extractionZone:'North gate'};
 assert.ok(evaluateObjective({...rescue,timeLimitSeconds:30},squad,100).score<evaluateObjective({...rescue,timeLimitSeconds:300},squad,100).score);
});
test('strict rules reject contradictions, duplicate bans and malformed objective payloads',()=>{
 const base={title:'Valid challenge',description:'A complete challenge definition.',difficulty:'medium',objective:{type:'capture',location:'Spirit Gate',contestingVersions:['madara-edo-tensei'],holdSeconds:120},budget:100,minMembers:1,maxMembers:3};
 assert.equal(challengeDefinitionSchema.safeParse({...base,restrictions:{bannedRoles:['healer'],roleRequirements:[{role:'healer',min:1}]}}).success,false);
 assert.equal(challengeDefinitionSchema.safeParse({...base,restrictions:{bannedCharacters:['goku','goku']}}).success,false);
 assert.equal(challengeDefinitionSchema.safeParse({...base,objective:{type:'capture',location:'Spirit Gate',holdSeconds:120},restrictions:{}}).success,false);
 assert.equal(challengeDefinitionSchema.safeParse({...base,minMembers:4,restrictions:{}}).success,false);
});
test('role limits count distinct members and can require primary classification',()=>{
 const squad=[fighter('a',['tank'],[]),{...fighter('b',[],[]),roles:[{role:'tank',priority:'secondary'}]}];
 assert.doesNotThrow(()=>validateRoleRules(squad,[{role:'tank',min:2,max:2,primaryOnly:false}]));
 assert.throws(()=>validateRoleRules(squad,[{role:'tank',min:2,max:2,primaryOnly:true}]),/tank/);
});

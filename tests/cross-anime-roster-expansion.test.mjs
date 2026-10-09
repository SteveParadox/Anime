import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fighters} from '../packages/domain/src/catalog.ts';
import {characterVersions,abilitiesForVersion,versionAbilities} from '../packages/domain/src/characters.ts';

const seeds=readFileSync('packages/database/seeds/catalog.jsonl','utf8').trim().split('\n').map(JSON.parse);
const byTable=name=>seeds.filter(item=>item.table===name).map(item=>item.values);

test('expanded Bleach roster has at least 35 distinct fighters including three priority characters',()=>{
 const bleach=fighters.filter(f=>f.series==='Bleach');
 assert.ok(bleach.length>=35,bleach.length);
 for(const id of ['yoruichi','orihime','kenpachi','aizen','ichigo','shinji','yhwach'])assert.equal(bleach.filter(f=>f.id===id).length,1,id);
});
test('shared catalogue does not duplicate fighter or version IDs',()=>{
 assert.equal(new Set(fighters.map(f=>f.id)).size,fighters.length);
 assert.equal(new Set(characterVersions.map(v=>v.id)).size,characterVersions.length);
});
test('every newly seeded canonical version has valid ownership, cost, roles, traits and linked abilities',()=>{
 const ids=new Set(fighters.map(f=>f.id));
 const costs=byTable('squad_version_costs');
 const roles=byTable('version_combat_roles');
 const traits=byTable('version_strategic_traits');
 const inserted=byTable('character_versions').filter(v=>['Bleach','Naruto','One Piece','Dragon Ball','Jujutsu Kaisen','Hunter x Hunter','Fairy Tail','Black Clover','Solo Leveling','That Time I Got Reincarnated as a Slime',"JoJo's Bizarre Adventure"].includes(v.era) && v.name.startsWith('Standard '));
 for(const v of inserted){
  assert.ok(ids.has(v.character_id),v.id);
  assert.equal(characterVersions.filter(x=>x.id===v.id).length,1,v.id);
  assert.equal(costs.filter(x=>x.version_id===v.id && Number.isInteger(x.cost) && x.cost>0).length,1,v.id);
  assert.equal(roles.filter(x=>x.version_id===v.id && x.priority==='primary').length,1,v.id);
  assert.ok(traits.some(x=>x.version_id===v.id),v.id);
  assert.ok(abilitiesForVersion(v.id).length>0,v.id);
 }
});
test('ability links are unique and never cross character ownership',()=>{
 const links=new Set();
 for(const link of versionAbilities){
  const key=link.versionId+'|'+link.abilityId;
  assert.ok(!links.has(key),key);
  links.add(key);
 }
 for(const version of characterVersions){
  for(const {ability} of abilitiesForVersion(version.id))assert.equal(ability.characterId,version.characterId,version.id);
 }
});

test('unreviewed source links are not exposed as broken external URLs',()=>{
 const pending=fighters.filter(f=>!f.sourceUrl);
 assert.ok(pending.length>0,'Starter-only entries must remain explicitly provisional');
 for(const fighter of fighters)if(fighter.sourceUrl)assert.match(fighter.sourceUrl,/^https:\/\//,fighter.id);
 const page=readFileSync('apps/web/app/page.tsx','utf8');
 assert.match(page,/character\.sourceUrl\?<a href=\{character\.sourceUrl\}/);
 assert.match(page,/Source reference pending review/);
});

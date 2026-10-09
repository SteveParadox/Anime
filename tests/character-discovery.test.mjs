import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fighters} from '../packages/domain/src/catalog.ts';
import {abilitiesForVersion,characterVersions,versionById,versionsForCharacter,versionBelongsToCharacter} from '../packages/domain/src/characters.ts';
import {filterCharacterCatalog} from '../packages/domain/src/character-discovery.ts';
import {COMBAT_ROLES,STRATEGIC_TRAITS} from '../packages/domain/src/squad-synergy.ts';

const newIds=['vegeta','sasuke','kakashi','zoro','sanji','sukuna','yuta','nezuko'];
const seed=readFileSync('packages/database/seeds/catalog.jsonl','utf8').trim().split('\\n').map(row=>JSON.parse(row));
const records=table=>seed.filter(row=>row.table===table).map(row=>row.values);

test('eight new fighters have canonical, distinct, documented versions',()=>{
 assert.equal(new Set(fighters.map(f=>f.id)).size,fighters.length);
 for(const id of newIds){
  const fighter=fighters.find(f=>f.id===id);
  assert.ok(fighter,id);
  assert.ok(fighter.sourceUrl.startsWith('https://'));
  assert.equal(versionsForCharacter(id).length,2,id);
  assert.ok(versionsForCharacter(id).every(v=>v.canonical&&v.sourceEndpoint));
  assert.ok(versionsForCharacter(id)[1].parentVersionId===versionsForCharacter(id)[0].id);
  assert.ok(versionsForCharacter(id).every(v=>abilitiesForVersion(v.id).length>=1));
 }
});

test('every curated version is seeded for PostgreSQL with safe costs and ability ownership',()=>{
 const versionRows=records('character_versions');
 const prices=records('squad_version_costs');
 const abilityRows=records('abilities');
 const linkRows=records('version_abilities');
 const roleRows=records('version_combat_roles');
 const traitRows=records('version_strategic_traits');
 for(const id of newIds){
  for(const version of versionsForCharacter(id)){
   const v=versionRows.find(row=>row.id===version.id);
   const cost=prices.find(row=>row.version_id===version.id);
   assert.equal(v.character_id,id);
   assert.equal(cost.character_id,id);
   assert.ok(cost.cost>=1&&cost.cost<=100);
   assert.ok(roleRows.some(row=>row.version_id===version.id&&COMBAT_ROLES.includes(row.role)));
   assert.ok(traitRows.some(row=>row.version_id===version.id&&STRATEGIC_TRAITS.includes(row.trait)));
   for(const {ability} of abilitiesForVersion(version.id)){
    assert.ok(abilityRows.some(a=>a.id===ability.id&&a.character_id===id));
    assert.ok(linkRows.some(row=>row.version_id===version.id&&row.ability_id===ability.id));
   }
  }
 }
 assert.equal(new Set(versionRows.map(x=>x.id)).size,versionRows.length);
 assert.equal(new Set(prices.map(x=>x.version_id)).size,prices.length);
 assert.equal(new Set(linkRows.map(x=>x.version_id+'/'+x.ability_id)).size,linkRows.length);
});

test('catalog search finds versions, aliases and named abilities',()=>{
 assert.ok(filterCharacterCatalog(fighters,{query:'Rinnegan'}).some(x=>x.id==='sasuke'));
 assert.ok(filterCharacterCatalog(fighters,{query:'King of Hell'}).some(x=>x.id==='zoro'));
 assert.ok(filterCharacterCatalog(fighters,{query:'Malevolent Shrine'}).some(x=>x.id==='sukuna'));
 assert.ok(filterCharacterCatalog(fighters,{query:'Ifrit Jambe'}).some(x=>x.id==='sanji'));
 assert.deepEqual(filterCharacterCatalog(fighters,{query:'an-impossible-fighter-123'}),[]);
});

test('directory filters combine, sort stably, and never mutate original roster',()=>{
 const original=fighters.map(f=>f.id);
 const naruto=filterCharacterCatalog(fighters,{series:'Naruto',role:'Tactician',sort:'cost-asc'});
 assert.ok(naruto.length>=2);
 assert.ok(naruto.every(f=>f.series==='Naruto'&&f.role==='Tactician'));
 assert.ok(naruto.every((f,i)=>!i||naruto[i-1].cost<=f.cost));
 assert.ok(filterCharacterCatalog(fighters,{sort:'versions-desc'})[0].id==='goku');
 assert.deepEqual(fighters.map(f=>f.id),original);
});

test('new versions are never interchangeable across fighters',()=>{
 assert.equal(versionBelongsToCharacter('sukuna-shibuya','yuta'),false);
 assert.equal(versionBelongsToCharacter('yuta-culling-game','yuta'),true);
 assert.equal(versionById('zoro-wano').characterId,'zoro');
 assert.ok(characterVersions.length>=85);
});

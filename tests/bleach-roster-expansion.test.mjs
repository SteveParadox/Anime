import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fighters} from '../packages/domain/src/catalog.ts';
import {abilitiesForVersion,versionsForCharacter} from '../packages/domain/src/characters.ts';
const rows=readFileSync('packages/database/seeds/catalog.jsonl','utf8').trim().split('\n').map(line=>JSON.parse(line));
test('priority Bleach fighters are unique with seeded costs, primary roles, traits and abilities',()=>{
 for(const id of ['yoruichi','orihime','kenpachi']){
  const entries=fighters.filter(f=>f.id===id);
  assert.equal(entries.length,1,id);
  assert.equal(entries[0].series,'Bleach');
  const versions=versionsForCharacter(id);
  assert.ok(versions.length>=2,id);
  for(const version of versions){
   assert.ok(rows.some(row=>row.table==='character_versions'&&row.values.id===version.id),version.id);
   assert.equal(rows.filter(row=>row.table==='version_combat_roles'&&row.values.version_id===version.id&&row.values.priority==='primary').length,1);
   assert.ok(rows.some(row=>row.table==='version_strategic_traits'&&row.values.version_id===version.id));
   assert.ok(rows.some(row=>row.table==='squad_version_costs'&&row.values.version_id===version.id&&row.values.cost>0));
   assert.ok(abilitiesForVersion(version.id).length>0,version.id);
  }
 }
});
test('late transformations do not leak into early versions',()=>{
 assert.ok(!abilitiesForVersion('kenpachi-early').some(x=>x.ability.id==='kenpachi-bankai'));
 assert.ok(!abilitiesForVersion('kenpachi-shikai').some(x=>x.ability.id==='kenpachi-bankai'));
 assert.ok(!abilitiesForVersion('yoruichi-standard').some(x=>x.ability.id==='yoruichi-shunko'));
});

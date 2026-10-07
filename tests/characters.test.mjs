import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 abilitiesForVersion,
 characterVersionSearchText,
 characterVersions,
 versionAbilities,
 versionBelongsToCharacter,
 versionById,
 versionsForCharacter,
 validateBattleVersionSelection
} from '../lib/characters.ts';

test('supports characters with one and many ordered versions',()=>{
 const sakura=versionsForCharacter('sakura');
 const naruto=versionsForCharacter('naruto');
 assert.equal(sakura.length,1);
 assert.ok(naruto.length>=7);
 assert.deepEqual(naruto.map(v=>v.sortOrder),[...naruto.map(v=>v.sortOrder)].sort((a,b)=>a-b));
 assert.equal(naruto[0].id,'naruto-academy');
 assert.equal(naruto.at(-1).id,'naruto-baryon-mode');
});

test('required Naruto and Goku versions have stable IDs',()=>{
 for(const id of ['naruto-academy','naruto-chunin-exam','naruto-shippuden','naruto-sage-mode','naruto-kcm','naruto-six-paths','naruto-baryon-mode','goku-saiyan-saga','goku-namek-saga','goku-super-saiyan','goku-super-saiyan-2','goku-super-saiyan-3','goku-super-saiyan-god','goku-super-saiyan-blue','goku-ui-sign','goku-mastered-ultra-instinct'])assert.ok(versionById(id),id);
});

test('parent lineage is explicit and optional',()=>{
 assert.equal(versionById('naruto-academy')?.parentVersionId,null);
 assert.equal(versionById('naruto-six-paths')?.parentVersionId,'naruto-kcm');
 assert.equal(versionById('goku-super-saiyan-blue')?.parentVersionId,'goku-super-saiyan-god');
});

test('aliases and version search text expose common abbreviations',()=>{
 const goku=characterVersionSearchText('goku').toLowerCase();
 assert.match(goku,/ssb/);
 assert.match(goku,/mui/);
 assert.match(goku,/ultra instinct/);
 const naruto=characterVersionSearchText('naruto').toLowerCase();
 assert.match(naruto,/six paths/);
 assert.match(naruto,/kcm/);
});

test('invalid characters and versions fail closed',()=>{
 assert.deepEqual(versionsForCharacter('does-not-exist'),[]);
 assert.equal(versionById('does-not-exist'),undefined);
 assert.equal(versionBelongsToCharacter('goku-mastered-ultra-instinct','naruto'),false);
 assert.equal(versionBelongsToCharacter('naruto-six-paths','naruto'),true);
});

test('battle version selection rejects cross-character forged payloads',()=>{
 assert.equal(validateBattleVersionSelection('naruto','naruto-six-paths','goku','goku-super-saiyan-blue'),true);
 assert.equal(validateBattleVersionSelection('naruto','goku-mastered-ultra-instinct','goku','goku-super-saiyan-blue'),false);
 assert.equal(validateBattleVersionSelection('naruto','naruto-six-paths','naruto','naruto-baryon-mode'),false);
 assert.equal(validateBattleVersionSelection('naruto','missing','goku','goku-super-saiyan-blue'),false);
});

test('version abilities never cross character ownership',()=>{
 for(const version of characterVersions){
  for(const {ability} of abilitiesForVersion(version.id))assert.equal(ability.characterId,version.characterId,`${version.id} -> ${ability.id}`);
 }
});

test('earlier Naruto versions do not leak later abilities',()=>{
 const academy=abilitiesForVersion('naruto-academy').map(x=>x.ability.id);
 const chunin=abilitiesForVersion('naruto-chunin-exam').map(x=>x.ability.id);
 assert.equal(academy.includes('naruto-shadow-clone'),false);
 assert.equal(chunin.includes('naruto-rasengan'),false);
});

test('abilities may be shared explicitly without automatic inheritance',()=>{
 const sage=abilitiesForVersion('naruto-sage-mode').map(x=>x.ability.id);
 const sixPaths=abilitiesForVersion('naruto-six-paths').map(x=>x.ability.id);
 const baryon=abilitiesForVersion('naruto-baryon-mode').map(x=>x.ability.id);
 assert.ok(sage.includes('naruto-shadow-clone'));
 assert.ok(sixPaths.includes('naruto-shadow-clone'));
 assert.ok(sixPaths.includes('naruto-truth-seeking-orbs'));
 assert.equal(baryon.includes('naruto-truth-seeking-orbs'),false);
});

test('version and link IDs are unique',()=>{
 assert.equal(new Set(characterVersions.map(v=>v.id)).size,characterVersions.length);
 const linkKeys=versionAbilities.map(v=>`${v.versionId}|${v.abilityId}`);
 assert.equal(new Set(linkKeys).size,linkKeys.length);
});

test('append-only migration seed mirrors the curated version catalog',()=>{
 const migration=readFileSync('drizzle/0004_character_versions.sql','utf8');
 for(const version of characterVersions)assert.ok(migration.includes(`VALUES ('${version.id}','${version.characterId}'`),version.id);
 for(const link of versionAbilities)assert.ok(migration.includes(`'${link.versionId}','${link.abilityId}'`),`${link.versionId} -> ${link.abilityId}`);
});

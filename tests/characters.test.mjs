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
} from '../packages/domain/src/characters.ts';

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

test('append-only migration history mirrors the curated version catalog',()=>{
 const migrationHistory=[
  readFileSync('drizzle/0004_character_versions.sql','utf8'),
  readFileSync('drizzle/0007_expand_squad_roster.sql','utf8'),
  readFileSync('drizzle/0008_correct_roster_abilities.sql','utf8'),
  readFileSync('drizzle/0011_add_more_combat_fighters.sql','utf8')
 ].join('\n');
 const seeded=readFileSync('packages/database/seeds/catalog.jsonl','utf8').trim().split('\n').map(line=>JSON.parse(line));
 const seededVersions=new Set(seeded.filter(row=>row.table==='character_versions').map(row=>row.values.id));
 const seededLinks=new Set(seeded.filter(row=>row.table==='version_abilities').map(row=>row.values.version_id+'|'+row.values.ability_id));
 for(const version of characterVersions)assert.ok(migrationHistory.includes(`('${version.id}','${version.characterId}'`)||seededVersions.has(version.id),version.id);
 for(const link of versionAbilities)assert.ok(migrationHistory.includes(`'${link.versionId}','${link.abilityId}'`)||seededLinks.has(link.versionId+'|'+link.abilityId),`${link.versionId} -> ${link.abilityId}`);
});

test('expanded challenge roster exposes stable combat versions and search aliases',()=>{
 for(const id of ['madara-ten-tails-jinchuriki','gojo-shibuya','gojo-shinjuku','itachi-akatsuki','aizen-hogyoku','saitama-hero-association','megumi-season-1'])assert.ok(versionById(id),id);
 assert.match(characterVersionSearchText('madara').toLowerCase(),/ten-tails|ten tails/);
 assert.match(characterVersionSearchText('gojo').toLowerCase(),/shibuya/);
 assert.match(characterVersionSearchText('itachi').toLowerCase(),/akatsuki/);
 assert.match(characterVersionSearchText('aizen').toLowerCase(),/hogyoku|hōgyoku/);
 assert.match(characterVersionSearchText('megumi').toLowerCase(),/shibuya/);
});


test('expanded roster abilities stay scoped to the intended combat versions',()=>{
 const madara=abilitiesForVersion('madara-ten-tails-jinchuriki').map(x=>x.ability.id);
 const gojo=abilitiesForVersion('gojo-shibuya').map(x=>x.ability.id);
 const itachi=abilitiesForVersion('itachi-akatsuki').map(x=>x.ability.id);
 const aizen=abilitiesForVersion('aizen-hogyoku').map(x=>x.ability.id);
 const saitama=abilitiesForVersion('saitama-hero-association').map(x=>x.ability.id);
 const megumi=abilitiesForVersion('megumi-shibuya').map(x=>x.ability.id);

 assert.ok(madara.includes('madara-limbo'));
 assert.ok(madara.includes('madara-ten-tails'));
 assert.ok(gojo.includes('gojo-limitless'));
 assert.ok(gojo.includes('gojo-unlimited-void'));
 assert.ok(itachi.includes('itachi-genjutsu'));
 assert.ok(itachi.includes('itachi-susanoo'));
 assert.ok(aizen.includes('aizen-kyoka-suigetsu'));
 assert.ok(aizen.includes('aizen-hogyoku-ability'));
 assert.ok(saitama.includes('saitama-physical'));
 assert.ok(megumi.includes('megumi-ten-shadows'));
 assert.ok(megumi.includes('megumi-chimera-shadow-garden'));

 assert.equal(abilitiesForVersion('megumi-season-1').some(x=>x.ability.id==='megumi-chimera-shadow-garden'),true);
 assert.equal(abilitiesForVersion('madara-revived').some(x=>x.ability.id==='madara-limbo'),true);
 assert.equal(abilitiesForVersion('madara-edo-tensei').some(x=>x.ability.id==='madara-limbo'),false);
});

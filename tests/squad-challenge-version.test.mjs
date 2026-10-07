import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {characterVersions,versionBelongsToCharacter} from '../lib/characters.ts';

test('forged character and version pairings are rejected by canonical version ownership',()=>{
 assert.equal(versionBelongsToCharacter('goku-mastered-ultra-instinct','naruto'),false);
 assert.equal(versionBelongsToCharacter('naruto-six-paths','goku'),false);
 assert.equal(versionBelongsToCharacter('naruto-six-paths','naruto'),true);
 assert.equal(versionBelongsToCharacter('goku-mastered-ultra-instinct','goku'),true);
});

test('every canonical character version has exactly one baseline squad price with matching character ownership',()=>{
 const migration=readFileSync('drizzle/0006_daily_squad_challenges.sql','utf8');
 const seed=migration.split('INSERT INTO `squad_version_costs`')[1]||'';
 const priced=[...seed.matchAll(/\('([^']+)','([^']+)',(\d+),/g)].map(match=>({versionId:match[1],characterId:match[2],cost:Number(match[3])}));
 const canonical=characterVersions.filter(version=>version.canonical);
 const byVersion=new Map(priced.map(row=>[row.versionId,row]));

 assert.equal(priced.length,canonical.length);
 assert.equal(new Set(priced.map(row=>row.versionId)).size,priced.length);
 for(const version of canonical){
  const row=byVersion.get(version.id);
  assert.ok(row,`Missing baseline squad price for ${version.id}`);
  assert.equal(row.characterId,version.characterId,`Pricing owner mismatch for ${version.id}`);
  assert.ok(Number.isInteger(row.cost)&&row.cost>0,`Invalid cost for ${version.id}`);
 }
});

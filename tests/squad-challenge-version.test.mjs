import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {characterVersions,versionBelongsToCharacter} from '../packages/domain/src/characters.ts';

test('forged character and version pairings are rejected by canonical version ownership',()=>{
 assert.equal(versionBelongsToCharacter('goku-mastered-ultra-instinct','naruto'),false);
 assert.equal(versionBelongsToCharacter('naruto-six-paths','goku'),false);
 assert.equal(versionBelongsToCharacter('naruto-six-paths','naruto'),true);
 assert.equal(versionBelongsToCharacter('goku-mastered-ultra-instinct','goku'),true);
});

function squadPrices(){
 // PostgreSQL's seed catalog is the deployed source of truth; the historical
 // SQLite migration files are append-only and grow as the roster expands.
 const rows=readFileSync('packages/database/seeds/catalog.jsonl','utf8').trim().split(/\r?\n/);
 return rows.map(line=>JSON.parse(line))
  .filter(row=>row.table==='squad_version_costs')
  .map(({values})=>({versionId:values.version_id,characterId:values.character_id,cost:values.cost}));
}

test('every canonical character version has exactly one baseline squad price with matching character ownership',()=>{
 const priced=squadPrices();
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

test('expanded roster keeps the product example pricing and exact version ownership',()=>{
 const prices=new Map(squadPrices().map(row=>[row.versionId,row.cost]));
 assert.equal(prices.get('gojo-shibuya'),38);
 assert.equal(prices.get('itachi-akatsuki'),30);
 assert.equal(prices.get('levi-season-1'),12);
 assert.equal(prices.get('tanjiro-season-1'),10);
 assert.equal(prices.get('megumi-season-1'),8);
 assert.equal(38+30+12+10+8,98);
 assert.equal(prices.get('goku-mastered-ultra-instinct'),100);
 assert.equal(prices.get('saitama-hero-association'),95);
 assert.equal(prices.get('aizen-hogyoku'),75);
 assert.equal(versionBelongsToCharacter('madara-ten-tails-jinchuriki','madara'),true);
 assert.equal(versionBelongsToCharacter('gojo-shibuya','gojo'),true);
 assert.equal(versionBelongsToCharacter('itachi-akatsuki','itachi'),true);
 assert.equal(versionBelongsToCharacter('aizen-hogyoku','aizen'),true);
 assert.equal(versionBelongsToCharacter('saitama-hero-association','saitama'),true);
 assert.equal(versionBelongsToCharacter('megumi-season-1','megumi'),true);
});

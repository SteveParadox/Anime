import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fighters} from '../packages/domain/src/catalog.ts';
import {characterVersions} from '../packages/domain/src/characters.ts';

const readRows=path=>readFileSync(path,'utf8').trim().split(/\r?\n/).map(line=>JSON.parse(line));
const advanced=readRows('packages/database/seeds/advanced-catalog.jsonl');
const basic=readRows('packages/database/seeds/catalog.jsonl');
const forTable=(rows,table)=>rows.filter(row=>row.table===table).map(row=>row.values);
const franchiseRows=forTable(advanced,'character_franchises');
const alignmentRows=forTable(advanced,'version_challenge_alignment');

test('advanced seed contains canonical franchise entries for every roster fighter',()=>{
 const expected=new Map(fighters.map(f=>[f.id,f.series.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')]));
 const seen=new Set();
 assert.equal(franchiseRows.length,expected.size);
 for(const row of franchiseRows){
  assert.ok(expected.has(row.character_id),row.character_id);
  assert.ok(!seen.has(row.character_id),`duplicate franchise: ${row.character_id}`);
  seen.add(row.character_id);
  assert.equal(row.franchise_id,expected.get(row.character_id));
 }
});

test('alignment entries are unique, version-specific, valid and linked to canonical seed versions',()=>{
 const ids=new Set(characterVersions.map(v=>v.id));
 const seeded=new Set(forTable(basic,'character_versions').map(v=>v.id));
 const allowed=new Set(['hero','villain','antihero','antagonist','neutral','unknown']);
 const seen=new Set();
 for(const row of alignmentRows){
  assert.ok(!seen.has(row.version_id),`duplicate alignment: ${row.version_id}`);
  seen.add(row.version_id);
  assert.ok(ids.has(row.version_id),row.version_id);
  assert.ok(seeded.has(row.version_id),row.version_id);
  assert.ok(allowed.has(row.alignment),`${row.version_id}: ${row.alignment}`);
  assert.ok(typeof row.notes==='string'&&row.notes.length>0);
 }
 assert.ok(alignmentRows.some(row=>row.alignment==='hero'));
 assert.ok(alignmentRows.some(row=>row.alignment==='villain'));
 assert.equal(alignmentRows.find(row=>row.version_id==='vegeta-saiyan-saga')?.alignment,'villain');
 assert.equal(alignmentRows.find(row=>row.version_id==='vegeta-super-saiyan-blue')?.alignment,'hero');
});

test('seed loader accepts both advanced seed tables in a single transaction',()=>{
 const script=readFileSync('scripts/database/seed.mjs','utf8');
 assert.match(script,/advanced-catalog\.jsonl/);
 assert.match(script,/'character_franchises'/);
 assert.match(script,/'version_challenge_alignment'/);
 assert.match(script,/await client\.query\('BEGIN'\)/);
 assert.match(script,/if\(advancedReady\)await seedFile\(advancedSource\)/);
 assert.match(script,/await client\.query\('ROLLBACK'\)/);
});

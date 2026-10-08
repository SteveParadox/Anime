import test from 'node:test';
import assert from 'node:assert/strict';
import {
 EVIDENCE_SOURCE_TYPES,
 FEAT_CATEGORIES,
 formatEvidenceLocation,
 isValidEvidenceTimestamp,
 normalizeEvidenceTimestamp
} from '../packages/domain/src/evidence.ts';

test('evidence enums remain stable',()=>{
 assert.deepEqual(EVIDENCE_SOURCE_TYPES,['anime','manga']);
 assert.deepEqual(FEAT_CATEGORIES,['speed','strength','durability','ability','statement']);
});

test('accepts valid anime timestamps',()=>{
 for(const value of ['18:42','01:18:42','7:05','1:02:03'])assert.equal(isValidEvidenceTimestamp(value),true,value);
});

test('rejects malformed anime timestamps',()=>{
 for(const value of ['72:99','abc','-3','60:00','01:61:00','01:00:60'])assert.equal(isValidEvidenceTimestamp(value),false,value);
});

test('normalizes timestamp presentation for duplicate matching',()=>{
 assert.equal(normalizeEvidenceTimestamp('7:05'),'07:05');
 assert.equal(normalizeEvidenceTimestamp('1:02:03'),'01:02:03');
 assert.equal(normalizeEvidenceTimestamp(null),null);
});

test('formats anime and manga source locations',()=>{
 const base={id:'x',characterId:'gojo',characterName:'Gojo Satoru',series:'Jujutsu Kaisen',category:'speed',title:'Feat title',description:'A sufficiently long feat description.',submittedByHandle:'fan',created:1,updated:1,owned:false};
 const anime={...base,sourceType:'anime',episode:20,timestamp:'18:42',chapter:null,page:null};
 const manga={...base,sourceType:'manga',episode:null,timestamp:null,chapter:74,page:13};
 assert.equal(formatEvidenceLocation(anime),'Episode 20 · 18:42');
 assert.equal(formatEvidenceLocation(manga),'Chapter 74 · Page 13');
});

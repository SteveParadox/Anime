import test from 'node:test';
import assert from 'node:assert/strict';
import {evidenceInput,matchesOfficialWebsiteDomain} from '../apps/api/src/lib/evidence-input.ts';

const common={characterId:'naruto',versionId:'naruto-six-paths',category:'ability',title:'Source-backed move',description:'A detailed description explaining a particular feat.'};
const extended={...common,sourceTitle:'Official example publication',sourceLocation:'Page 42',sourceUrl:null,continuityStatus:'unknown'};
const cases=[
 {sourceType:'databook',sourceDetails:{publisher:'Example Publishing',pageOrSection:'Page 42'}},
 {sourceType:'official_guidebook',sourceDetails:{publisher:'Example Publishing',pageOrSection:'Section 2'}},
 {sourceType:'creator_interview',sourceDetails:{subject:'Example Author',publication:'Example Magazine',statementKind:'clarification'}},
 {sourceType:'official_website',sourceUrl:'https://example.org/article',sourceDetails:{organization:'Example Org',officialDomain:'example.org',accessDate:'2026-10-09'}},
 {sourceType:'light_novel',sourceDetails:{author:'Example Author',chapter:'Chapter 7',continuityRelation:'spin_off'}},
 {sourceType:'game',sourceDetails:{developer:'Example Dev',publisher:'Example Publisher',platform:'PC',sceneOrMission:'Mission 2',continuityClassification:'gameplay'}}
];

test('six official-source contracts accept valid minimum metadata',()=>{
 for(const item of cases){
  const parsed=evidenceInput.safeParse({...extended,...item});
  assert.equal(parsed.success,true,`${item.sourceType}: ${parsed.success?'':parsed.error.message}`);
 }
});

test('source contracts reject missing metadata and unknown fields',()=>{
 for(const item of cases){
  assert.equal(evidenceInput.safeParse({...extended,...item,sourceDetails:{}}).success,false,item.sourceType);
  assert.equal(evidenceInput.safeParse({...extended,...item,fabricatedCanon:true}).success,false,item.sourceType);
 }
});

test('invalid schemes and unrecognized classifications are rejected',()=>{
 const site=cases.find(item=>item.sourceType==='official_website');
 assert.equal(evidenceInput.safeParse({...extended,...site,sourceUrl:'javascript:alert(1)'}).success,false);
 const game=cases.find(item=>item.sourceType==='game');
 assert.equal(evidenceInput.safeParse({...extended,...game,sourceDetails:{...game.sourceDetails,continuityClassification:'canon'}}).success,false);
 const interview=cases.find(item=>item.sourceType==='creator_interview');
 assert.equal(evidenceInput.safeParse({...extended,...interview,sourceDetails:{...interview.sourceDetails,statementKind:'canon'}}).success,false);
});

test('legacy anime and manga inputs remain compatible',()=>{
 assert.equal(evidenceInput.safeParse({...common,sourceType:'anime',episode:10,timestamp:'07:15'}).success,true);
 assert.equal(evidenceInput.safeParse({...common,sourceType:'manga',chapter:50,page:null}).success,true);
 assert.equal(evidenceInput.safeParse({...common,sourceType:'anime',episode:10,chapter:1}).success,false);
});

test('publication and access dates reject impossible calendar values',()=>{
 const web=cases.find(item=>item.sourceType==='official_website');
 assert.equal(evidenceInput.safeParse({...extended,...web,sourceDetails:{...web.sourceDetails,accessDate:'2026-02-30'}}).success,false);
 const book=cases.find(item=>item.sourceType==='databook');
 assert.equal(evidenceInput.safeParse({...extended,...book,sourceDetails:{...book.sourceDetails,publicationDate:'2026-13-01'}}).success,false);
});

test('official website URL-domain correspondence rejects spoofed hosts',()=>{
 assert.equal(matchesOfficialWebsiteDomain('https://example.org/article','example.org'),true);
 assert.equal(matchesOfficialWebsiteDomain('https://news.example.org/article','example.org'),true);
 assert.equal(matchesOfficialWebsiteDomain('https://example.org.attacker.test/article','example.org'),false);
 assert.equal(matchesOfficialWebsiteDomain('https://attacker.test/article','example.org'),false);
 assert.equal(matchesOfficialWebsiteDomain('ftp://example.org/article','example.org'),false);
 assert.equal(matchesOfficialWebsiteDomain('http://127.0.0.1/','127.0.0.1'),false);
});

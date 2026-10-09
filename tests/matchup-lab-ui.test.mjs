import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('apps/web/components/matchup-lab.tsx','utf8');
const page=readFileSync('apps/web/app/page.tsx','utf8');
const styles=readFileSync('apps/web/app/globals.css','utf8');

test('matchup lab retains the same two-fighter battle builder integration',()=>{
 assert.match(page,/<MatchupLab onCreateMatchup=\{createBattlePair\}\/>/);
 assert.match(page,/createBattlePair=\{\(fighterAId:string,fighterBId:string\)=>/);
 assert.match(source,/onCreateMatchup\(fighterA!\.id,fighterB!\.id\)/);
 assert.match(source,/disabled=\{!ready\}/);
 assert.match(source,/role="status" aria-live="polite"/);
 assert.match(source,/fighterA\.id!==fighterB\.id/);
});

test('both fighter pickers are labeled and cannot choose the opposing character twice',()=>{
 assert.match(source,/const selectId=useId\(\)/);
 assert.match(source,/label htmlFor=\{selectId\}/);
 assert.match(source,/select id=\{selectId\} aria-label=\{`Comparison fighter \$\{side\}`\}/);
 assert.match(source,/disabled=\{candidate\.id===otherId\}/);
 assert.match(source,/value=\{selectedId\} onChange=\{event=>onSelect\(event\.target\.value\)\}/);
});

test('surprise matchup picks two distinct roster indices',()=>{
 assert.match(source,/if\(fighters\.length<2\)return/);
 assert.match(source,/const offset=1\+Math\.floor\(Math\.random\(\)\*\(fighters\.length-1\)\)/);
 assert.match(source,/const indexB=\(indexA\+offset\)%fighters\.length/);
 assert.match(source,/setFighterAId\(randomA\)/);
 assert.match(source,/setFighterBId\(randomB\)/);
 assert.match(source,/onCreateMatchup\(randomA,randomB\)/);
});

test('matchup preview discloses catalog limitations and supports mobile layouts',()=>{
 assert.match(source,/not power rankings or win predictions/);
 assert.match(source,/Version-specific abilities are locked in the next step/);
 assert.match(styles,/@media\(max-width:760px\)/);
 assert.match(styles,/\.matchup-lab-stage\{grid-template-columns:minmax\(0,1fr\)/);
 assert.match(styles,/@media\(prefers-reduced-motion:reduce\)/);
});

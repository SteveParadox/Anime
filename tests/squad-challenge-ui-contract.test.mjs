import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const page=readFileSync('app/page.tsx','utf8');
const ui=readFileSync('components/daily-squad-challenge.tsx','utf8');

test('direct challenge squad links mount the squad view',()=>{
 assert.match(page,/q\.get\('challengeSquad'\)\)setViewState\('squads'\)/);
 assert.match(ui,/new URLSearchParams\(location\.search\)\.get\('challengeSquad'\)/);
 assert.match(ui,/await load\(result\.submission\.challengeId\)/);
});

test('shared squad cards include challenge, target version, members, strategy, and vote block',()=>{
 assert.match(ui,/shared\.challenge\.title/);
 assert.match(ui,/shared\.challenge\.target\?\.versionName/);
 assert.match(ui,/shared\.members\.map/);
 assert.match(ui,/shared\.strategy/);
 assert.match(ui,/<VoteBlock submission=\{shared\}/);
});

test('locked owner views use historical member snapshots after repricing',()=>{
 assert.match(ui,/mine\.submission\.locked\?\{\.\.\.current,characterName:member\.characterName,versionName:member\.versionName,cost:member\.cost\}:current/);
});

test('fighter browser supports search, series, role, tag, cost, and deterministic sorting',()=>{
 assert.match(ui,/setQuery/);
 assert.match(ui,/setSeries/);
 assert.match(ui,/setRole/);
 assert.match(ui,/setTag/);
 assert.match(ui,/setMaxCost/);
 assert.match(ui,/cost-asc/);
 assert.match(ui,/cost-desc/);
 assert.match(ui,/option value="name"/);
 assert.match(ui,/option value="series"/);
});

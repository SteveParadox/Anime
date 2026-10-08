import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const page=readFileSync('app/page.tsx','utf8');
const ui=readFileSync('components/daily-squad-challenge.tsx','utf8');

test('direct challenge squad links mount the squad view',()=>{
 assert.match(page,/challengeSquad=q\.get\('challengeSquad'\)/);
 assert.match(page,/if\(challengeSquad\)setViewState\('squads'\)/);
 assert.match(page,/if\(sharedProfile&&!challengeSquad\)/);
 assert.match(ui,/new URLSearchParams\(location\.search\)\.get\('challengeSquad'\)/);
 assert.match(ui,/await load\(result\.submission\.challengeId\)/);
});

test('share URLs are canonical and do not inherit unrelated route parameters',()=>{
 assert.match(ui,/new URL\('\/',location\.origin\)/);
 assert.match(ui,/url\.searchParams\.set\('view','squads'\)/);
 assert.match(ui,/url\.searchParams\.set\('challengeSquad',submissionId\)/);
});

test('shared squad cards include challenge, target version, members, strategy, and vote block',()=>{
 assert.match(ui,/shared\.challenge\.title/);
 assert.match(ui,/shared\.challenge\.target\?\.versionName/);
 assert.match(ui,/shared\.members\.map/);
 assert.match(ui,/shared\.strategy/);
 assert.match(ui,/<VoteBlock submission=\{shared\}/);
});

test('locked owner views use historical member snapshots after repricing',()=>{
 assert.match(ui,/mine\.submission\.locked\?\{\.\.\.current,characterName:member\.characterName,versionName:member\.versionName,cost:member\.cost,roles:member\.roles\|\|\[\],traits:member\.traits\|\|\[\]\}:current/);
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


test('profile favorites expose the complete fighter catalog including the expanded roster',()=>{
 assert.match(page,/One-Punch Man/);
 assert.match(page,/Favourite characters<div className="choice-chips">\{fighters\.map/);
 assert.doesNotMatch(page,/fighters\.slice\(0,14\)/);
});

test('moderator-removed challenge submissions are surfaced as unavailable to their owner',()=>{
 assert.match(ui,/submissionRemoved/);
 assert.match(ui,/removed by moderation and cannot be resubmitted/);
});


test('owners can delete only through the explicit unlocked-entry control',()=>{
 assert.match(ui,/action:'delete',submissionId:editingId/);
 assert.match(ui,/confirm\('Delete this challenge entry\?/);
 assert.match(ui,/editingId&&active&&!viewer\?\.submissionLocked/);
});


test('targetless future challenges use neutral community verdict wording',()=>{
 assert.match(ui,/Does this squad satisfy the challenge\?/);
 assert.match(ui,/submission\.challenge\.target\?/);
});

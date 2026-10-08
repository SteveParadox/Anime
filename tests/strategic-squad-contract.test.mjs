import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const challenges=readFileSync('apps/api/src/lib/squad-challenge.ts','utf8');
const submissions=readFileSync('apps/api/src/routes/squad-submissions/route.ts','utf8');
const builder=readFileSync('apps/web/components/daily-squad-challenge.tsx','utf8');
test('role validation uses server-side version data rather than browser roles',()=>{
 assert.match(submissions,/z\.object\(\{characterId:idText,versionId:idText\}\)\.strict\(\)/);
 assert.match(challenges,/loadVersionStrategies\(db,versionIds\)/);
 assert.match(challenges,/validateRoleRequirements\(snapshots/);
 assert.match(submissions,/JSON\.stringify\(member\.roles\)/);
});
test('historic team cards render stored roles and do not load current roles on the feed',()=>{
 assert.match(submissions,/roles_snapshot AS rolesSnapshot/);
 assert.match(submissions,/parseRoleSnapshot/);
 assert.match(builder,/SubmissionInsights members=\{submission\.members\}/);
});
test('challenge budget and vote flows remain independently enforced',()=>{
 assert.match(challenges,/validateSquadBudget\(snapshots,challenge\.budget\)/);
 assert.match(builder,/action:'submit'/);
 assert.match(builder,/submissionId:submission\.id,verdict/);
 assert.match(builder,/RoleBadges roles=\{fighter\.roles\}/);
});

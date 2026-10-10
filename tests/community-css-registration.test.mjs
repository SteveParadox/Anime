import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const layout=readFileSync('apps/web/app/layout.tsx','utf8');
const globals=readFileSync('apps/web/app/globals.css','utf8');
const community=readFileSync('apps/web/components/community/community.css','utf8');
const pkg=JSON.parse(readFileSync('apps/web/package.json','utf8'));
const views=readFileSync('apps/web/components/community/community-views.tsx','utf8');

test('root layout loads the community stylesheet directly after global styles',()=>{
 const globalImport=layout.indexOf('import "./globals.css";');
 const communityImport=layout.indexOf('import "../components/community/community.css";');
 assert.ok(globalImport>=0,'global stylesheet should be registered');
 assert.ok(communityImport>globalImport,'community styles must load after globals for predictable precedence');
 assert.doesNotMatch(globals,/@import\s+["']\.\.\/components\/community\/community\.css["']/);
});

test('all redesigned feature areas have corresponding CSS rules',()=>{
 for(const selector of ['.ac-community','.ac-heading','.ac-club-card','.ac-feed','.ac-post','.ac-shield','.ac-fan','.ac-anime-card','.ac-profile-cover','.ac-profile-editor']){
  assert.ok(community.includes(selector+'{')||community.includes(selector+','),selector+' must be styled');
 }
 for(const feature of ['ac-club-card','ac-fan','ac-anime-card','ac-profile-cover']){
  assert.ok(views.includes(feature),feature+' must be used by a rendered component');
 }
});

test('production build checks that the generated CSS bundle really contains feature styles',()=>{
 assert.match(pkg.scripts.build,/node scripts\/verify-community-css\.mjs/);
});

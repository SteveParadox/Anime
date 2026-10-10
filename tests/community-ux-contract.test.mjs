import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const page=readFileSync('apps/web/app/page.tsx','utf8');
const views=readFileSync('apps/web/components/community/community-views.tsx','utf8');
const styles=readFileSync('apps/web/components/community/community.css','utf8');

test('community views use real section navigation with browser history',()=>{
 assert.match(page,/const path='\/\?view='\+encodeURIComponent\(v\)/);
 assert.match(page,/addEventListener\('popstate',back\)/);
 assert.match(page,/const path='\/\?profile='\+encodeURIComponent\(handle\)/);
 assert.match(page,/\/\?view=clubs&club=/);
 assert.match(page,/history\.pushState\(null,'',path\)/);
 assert.match(page,/challengeSquad\|\|squad\?'squads'/);
});

test('late API responses cannot replace a newly selected club or public profile',()=>{
 assert.match(page,/extraRequest=useRef\(0\)/);
 assert.match(page,/shouldApplyCommunityResponse\(/);
 assert.match(page,/if\(v==='profile'\)setProfileView\(null\)/);
 assert.match(views,/requestedHandle\?page\?\.profile/);
 assert.match(views,/if\(requestedHandle&&!p\)/);
});

test('club composition and episode access retain server data and validation',()=>{
 assert.match(views,/data\.posts\.map/);
 assert.match(views,/Number\(postEpisode\)>saved/);
 assert.match(views,/action:'post'/);
 assert.match(views,/action:'progress'/);
 assert.match(views,/data\.locked>0/);
 assert.match(views,/onOpenProfile\(post\.handle\)/);
});

test('discovery cards render actual recommendations and wait for saved watchlist results',()=>{
 assert.match(views,/data\.watchlist\.find/);
 assert.match(views,/await save\(\{action:'watchlist'/);
 assert.match(views,/if\(await save\(\{action:'watchlist'/);
 assert.match(views,/disabled=\{working\|\|disabled\}/);
 assert.match(views,/p\.match!=null&&current&&/);
});

test('profile controls distinguish ownership and preserve failed editing attempts',()=>{
 assert.match(views,/const owned=Boolean\(user&&p/);
 assert.match(views,/if\(await saveProfile\(\)\)setEditing\(false\)/);
 assert.match(views,/maxLength=\{400\}/);
 assert.match(views,/maxLength=\{24\}/);
 assert.match(views,/fighters\.filter\(f=>/);
});

test('community design includes mobile and reduced-motion rules',()=>{
 assert.match(styles,/@media\(max-width:430px\)/);
 assert.match(styles,/@media\(max-width:700px\)/);
 assert.match(styles, /prefers-reduced-motion:reduce/);
});

test('audit fixes isolate loaded routes and enforce contribution requirements',()=>{
 assert.match(page,/loadedExtraKey==='clubs:'\+clubId/);
 assert.match(page,/loadedExtraKey===activeExtraKey\?profileView:null/);
 assert.match(page,/updateClubDraft\(previous,clubId,next\)/);
 assert.match(views,/if\(!canContribute\|\|!validPost/);
 assert.match(views,/disabled=\{!canContribute\|\|busy\|\|!data/);
 assert.match(views,/Recent squads/);
 assert.match(views,/Recent challenge entries/);
 assert.match(views,/\.\.\.fighters\.map\(f=>f.series\)/);
});

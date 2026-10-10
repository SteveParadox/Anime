import test from 'node:test';
import assert from 'node:assert/strict';
import {communityViewKey,shouldApplyCommunityResponse,updateClubDraft} from '../apps/web/components/community/route-state.ts';

test('club identity changes with club even when the section does not',()=>{
 assert.equal(communityViewKey('clubs','jjk',''),'clubs:jjk');
 assert.equal(communityViewKey('clubs','bleach',''),'clubs:bleach');
 assert.notEqual(communityViewKey('clubs','jjk',''),communityViewKey('clubs','bleach',''));
});

test('profile identity distinguishes owner and requested handle',()=>{
 assert.equal(communityViewKey('profile','jjk',''),'profile:me');
 assert.equal(communityViewKey('profile','jjk','narutofan'),'profile:narutofan');
 assert.notEqual(communityViewKey('profile','jjk','narutofan'),communityViewKey('profile','jjk','anotherfan'));
});

test('late responses cannot overwrite a newer request or route',()=>{
 assert.equal(shouldApplyCommunityResponse('clubs:jjk','clubs:bleach',3,3),false);
 assert.equal(shouldApplyCommunityResponse('profile:one','profile:one',2,3),false);
 assert.equal(shouldApplyCommunityResponse('profile:one','profile:one',3,3),true);
 assert.equal(shouldApplyCommunityResponse('discover','profile:me',4,4),false);
});

test('unsent discussions belong to exactly one club',()=>{
 const initial={jjk:'The ending surprised me'};
 const withBleach=updateClubDraft(initial,'bleach','My theory about Soul Society');
 assert.deepEqual(initial,{jjk:'The ending surprised me'},'original must remain unchanged');
 assert.equal(withBleach.jjk,'The ending surprised me');
 assert.equal(withBleach.bleach,'My theory about Soul Society');
 assert.equal(updateClubDraft(withBleach,'jjk','').bleach,'My theory about Soul Society');
});

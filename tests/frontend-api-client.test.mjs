import test from 'node:test';
import assert from 'node:assert/strict';
import {apiFetch,ApiError} from '../apps/web/services/api.ts';

test('API client retries a failed read once but never retries a mutation',async()=>{
 const original=globalThis.fetch;
 try{
  let calls=0;
  globalThis.fetch=async()=>{calls++;return new Response('{}',{status:calls===1?503:200});};
  assert.equal((await apiFetch('/api/characters')).status,200);
  assert.equal(calls,2);
  calls=0;
  globalThis.fetch=async()=>{calls++;throw new Error('network unavailable');};
  await assert.rejects(apiFetch('/api/community',{method:'POST',body:'{}'}),ApiError);
  assert.equal(calls,1);
  await assert.rejects(apiFetch('https://evil.example/api/auth/me'),/same-origin/);
 }finally{globalThis.fetch=original;}
});

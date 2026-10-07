import test from 'node:test';
import assert from 'node:assert/strict';
import {
 hashOpaqueToken,
 hashPassword,
 normalizeEmail,
 normalizeUsername,
 randomToken,
 safeRelativeReturnPath,
 validUsername,
 verifyPassword
} from '../lib/auth-crypto.ts';

test('email and username normalization are deterministic',()=>{
 assert.equal(normalizeEmail('  Fan@Example.COM  '),'fan@example.com');
 assert.equal(normalizeUsername(' Gojo_Fan '),'gojo_fan');
 assert.equal(validUsername('gojo_fan'),true);
 assert.equal(validUsername('Gojo Fan'),false);
 assert.equal(validUsername('ab'),false);
});

test('password hashing is salted, slow-hash formatted, and verifiable',async()=>{
 const password='correct horse battery staple';
 const first=await hashPassword(password),second=await hashPassword(password);
 assert.notEqual(first,password);
 assert.notEqual(first,second);
 assert.match(first,/^pbkdf2_sha256\$\d+\$/);
 assert.equal(await verifyPassword(password,first),true);
 assert.equal(await verifyPassword('wrong password',first),false);
});

test('password policy enforces length without trimming',async()=>{
 await assert.rejects(()=>hashPassword('short'),/between 8 and 128/);
 await assert.rejects(()=>hashPassword('x'.repeat(129)),/between 8 and 128/);
 const spaced='  eight+ chars  ';
 const hash=await hashPassword(spaced);
 assert.equal(await verifyPassword(spaced,hash),true);
 assert.equal(await verifyPassword(spaced.trim(),hash),false);
});

test('opaque auth tokens use high entropy and one-way lookup hashes',async()=>{
 const first=randomToken(32),second=randomToken(32);
 assert.notEqual(first,second);
 assert.ok(first.length>=40);
 const digest=await hashOpaqueToken(first);
 assert.notEqual(digest,first);
 assert.equal(digest,await hashOpaqueToken(first));
});

test('return paths reject cross-origin and reserved auth redirects',()=>{
 assert.equal(safeRelativeReturnPath('/?battle=abc'),'/?battle=abc');
 assert.equal(safeRelativeReturnPath('/?view=profile'),'/?view=profile');
 assert.equal(safeRelativeReturnPath('https://evil.example/'),'/');
 assert.equal(safeRelativeReturnPath('//evil.example/'),'/');
 assert.equal(safeRelativeReturnPath('/signin-with-chatgpt?return_to=/'),'/');
 assert.equal(safeRelativeReturnPath('/api/auth/google/callback?code=x'),'/');
});

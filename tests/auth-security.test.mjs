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
import {readJson,sameOrigin} from '../lib/auth-request.ts';

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
 assert.equal(safeRelativeReturnPath('/\\evil.example/'),'/');
 assert.equal(safeRelativeReturnPath('/signin-with-chatgpt?return_to=/'),'/');
 assert.equal(safeRelativeReturnPath('/api/auth/google/callback?code=x'),'/');
});


test('mutation origin checks reject cross-origin and sibling-site requests',()=>{
 const exact=new Request('https://anime.example/api/auth/logout',{method:'POST',headers:{origin:'https://anime.example','sec-fetch-site':'same-origin'}});
 const cross=new Request('https://anime.example/api/auth/logout',{method:'POST',headers:{origin:'https://evil.example','sec-fetch-site':'cross-site'}});
 const sibling=new Request('https://anime.example/api/auth/logout',{method:'POST',headers:{'sec-fetch-site':'same-site',referer:'https://admin.anime.example/'}});
 const serverClient=new Request('https://anime.example/api/auth/logout',{method:'POST'});
 assert.equal(sameOrigin(exact),true);
 assert.equal(sameOrigin(cross),false);
 assert.equal(sameOrigin(sibling),false);
 assert.equal(sameOrigin(serverClient),true);
});

test('JSON body limit is enforced on bytes, not JavaScript character count',async()=>{
 const request=new Request('https://anime.example/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({value:'界'.repeat(20)})});
 await assert.rejects(()=>readJson(request,30),(error)=>Boolean(error&&typeof error==='object'&&'status' in error&&(error as any).status===413));
});

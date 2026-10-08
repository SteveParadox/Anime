import test from 'node:test';
import assert from 'node:assert/strict';
import {proxySignature,verifyProxySignature} from '../packages/contracts/src/proxy-auth.ts';

const secret='a'.repeat(64);
const method='POST',path='/api/auth/login?return_to=%2F';
const issuedAt=1_810_000_000_000;
const timestamp=String(issuedAt);
const ip='203.0.113.9';
const signature=proxySignature(secret,timestamp,ip,method,path);

test('signed gateway preserves an individual verified IP',()=>{
 assert.equal(verifyProxySignature(secret,timestamp,ip,signature,method,path,issuedAt),true);
 assert.equal(verifyProxySignature(secret,timestamp,'203.0.113.10',signature,method,path,issuedAt),false);
 assert.equal(verifyProxySignature(secret,timestamp,ip,signature,'GET',path,issuedAt),false);
 assert.equal(verifyProxySignature(secret,timestamp,ip,signature,method,'/api/auth/logout',issuedAt),false);
 assert.equal(verifyProxySignature('b'.repeat(64),timestamp,ip,signature,method,path,issuedAt),false);
});
test('proxy signatures reject stale, future, invalid, and unsigned requests',()=>{
 assert.equal(verifyProxySignature(secret,timestamp,ip,signature,method,path,issuedAt+30_001),false);
 assert.equal(verifyProxySignature(secret,timestamp,ip,signature,method,path,issuedAt-30_001),false);
 assert.equal(verifyProxySignature(secret,'invalid',ip,signature,method,path,issuedAt),false);
 assert.equal(verifyProxySignature(secret,timestamp,'not-an-ip',signature,method,path,issuedAt),false);
 assert.equal(verifyProxySignature(secret,timestamp,ip,'wrong',method,path,issuedAt),false);
 assert.equal(verifyProxySignature(secret,timestamp,ip,undefined,method,path,issuedAt),false);
});
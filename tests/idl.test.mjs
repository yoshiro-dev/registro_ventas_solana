import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const idl=JSON.parse(readFileSync('app/src/idl.json'));
const src=readFileSync('programa/src/lib.rs','utf8');
const discriminator=name=>[...createHash('sha256').update(name).digest().subarray(0,8)];
test('IDL de las siete instrucciones, sus discriminadores y dirección',()=>{
  assert.equal(idl.instructions.length,7);
  assert.ok(src.includes('declare_id!("'+idl.address+'")'));
  for(const ix of idl.instructions){
    assert.ok(src.includes('pub fn '+ix.name+'('));
    assert.deepEqual(ix.discriminator,discriminator('global:'+ix.name));
    assert.ok(ix.accounts.find(a=>a.name==='owner').signer);
  }
  for(const a of idl.accounts) assert.deepEqual(a.discriminator,discriminator('account:'+a.name));
});

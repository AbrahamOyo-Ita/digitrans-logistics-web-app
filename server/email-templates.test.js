import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuthEmailTemplate} from './email-templates.js';

test('verification email is a complete responsive branded message with plain-text fallback',()=>{
  const message=createAuthEmailTemplate({kind:'verify',name:'Amina Example',actionUrl:'https://www.digitransdelivery.com/auth/verify?token=abc&email=amina%40example.test'});
  assert.equal(message.subject,'One quick step to get moving with DigiTrans');
  assert.match(message.html,/name="viewport"/);
  assert.match(message.html,/DigiTrans/);
  assert.match(message.html,/Verify my email/);
  assert.match(message.html,/&amp;email=/);
  assert.match(message.text,/Amina Example/);
  assert.match(message.text,/https:\/\/www\.digitransdelivery\.com\/auth\/verify/);
});

test('recovery email keeps the action safe and never renders supplied names as markup',()=>{
  const message=createAuthEmailTemplate({kind:'recovery',name:'<img src=x onerror=alert(1)>',actionUrl:'https://example.test/reset?token=a%22b'});
  assert.equal(message.subject,'A secure link to reset your DigiTrans password');
  assert.match(message.html,/Reset my password/);
  assert.match(message.html,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(message.html,/<img src=x onerror=/);
  assert.match(message.html,/token=a%22b/);
});

test('account email templates reject unsafe action schemes and unknown template kinds',()=>{
  assert.throws(()=>createAuthEmailTemplate({kind:'verify',actionUrl:'javascript:alert(1)'}),/HTTP or HTTPS/);
  assert.throws(()=>createAuthEmailTemplate({kind:'unknown',actionUrl:'https://example.test'}),/Unknown/);
  assert.throws(()=>createAuthEmailTemplate({kind:'verify',actionUrl:'not a URL'}),/valid account action URL/);
});

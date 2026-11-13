import test from 'node:test';
import assert from 'node:assert/strict';
import {authError,resolveLoginEmail} from './auth.js';
import {APP_ROLES,PUBLIC_SIGNUP_ROLES,ROLE_HOME,isWorkspacePath} from '../shared/roles.js';

test('every supported DigiTrans account role has a protected workspace destination',()=>{
  assert.deepEqual(Object.keys(ROLE_HOME).sort(),[...APP_ROLES].sort());
  assert.deepEqual([...PUBLIC_SIGNUP_ROLES].sort(),['customer','investor','rider','student','vendor']);
  for(const [role,path] of Object.entries(ROLE_HOME)){
    assert.ok(path.startsWith('/'),`${role} should have a local workspace path`);
    assert.equal(isWorkspacePath(path),true,`${role} destination should be protected`);
  }
  assert.equal(isWorkspacePath('/'),false);
  assert.equal(isWorkspacePath('/ops/finance'),true);
});

test('Supabase sign-in errors return useful credential, verification and retry statuses',()=>{
  const invalid=authError({status:400,code:'invalid_credentials'});
  assert.equal(invalid.status,401);
  assert.match(invalid.message,/sign-in details are incorrect/i);
  const unverified=authError({status:400,code:'email_not_confirmed'});
  assert.equal(unverified.status,403);
  assert.match(unverified.message,/verify your email/i);
  assert.equal(authError({status:429}).status,429);
  assert.equal(authError({status:503}).status,503);
});

test('login identity resolves email and phone inputs to the same account email',async()=>{
  const calls=[];
  const lookup=async predicate=>{
    calls.push(predicate);
    return {email:'person@example.test'};
  };
  assert.equal(await resolveLoginEmail(' PERSON@example.test ',lookup),'person@example.test');
  assert.equal(await resolveLoginEmail('0801 234 5678',lookup),'person@example.test');
  assert.equal(calls[0].sql,'lower(email)=?');
  assert.equal(calls[0].params[0],'person@example.test');
  assert.match(calls[1].sql,/regexp_replace/);
  assert.deepEqual(calls[1].params,['2348012345678','08012345678','8012345678']);
});

test('login never reveals whether an unknown email or phone has an account',async()=>{
  const lookup=async()=>null;
  await assert.rejects(()=>resolveLoginEmail('unknown@example.test',lookup),error=>error.status===401&&/sign-in details are incorrect/i.test(error.message));
  await assert.rejects(()=>resolveLoginEmail('not-a-phone',lookup),error=>error.status===400&&/valid email address or phone/i.test(error.message));
});

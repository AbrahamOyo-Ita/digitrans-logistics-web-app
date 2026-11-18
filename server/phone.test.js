import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {buildUserIdentifierPredicate,normalizePhoneNumber,phoneNumberCandidates} from './phone.js';

test('phone numbers are canonicalized consistently for local Nigerian and international formats',()=>{
  assert.equal(normalizePhoneNumber('0801 234 5678'),'+2348012345678');
  assert.equal(normalizePhoneNumber('234 801 234 5678'),'+2348012345678');
  assert.equal(normalizePhoneNumber('+234 (801) 234-5678'),'+2348012345678');
  assert.equal(normalizePhoneNumber('+44 20 7946 0958'),'+442079460958');
  assert.equal(normalizePhoneNumber('12345'),'');
  assert.equal(normalizePhoneNumber('+1'),'');
  assert.equal(normalizePhoneNumber('00 44 20 7946 0958'),'+442079460958');
  assert.deepEqual(phoneNumberCandidates('+2348012345678'),['2348012345678','08012345678','8012345678']);
});

test('account identifier predicates resolve email case-insensitively and phone formatting independently',()=>{
  assert.deepEqual(buildUserIdentifierPredicate(' Person@Example.test ',{emailColumn:'u.email',phoneColumn:'u.phone'}),{
    sql:'lower(u.email)=?',params:['person@example.test'],
  });
  const phone=buildUserIdentifierPredicate('+234 801 234 5678',{emailColumn:'u.email',phoneColumn:'u.phone'});
  assert.match(phone.sql,/regexp_replace\(COALESCE\(u\.phone/);
  assert.deepEqual(phone.params,['2348012345678','08012345678','8012345678']);
  assert.throws(()=>buildUserIdentifierPredicate(''),/Enter an email/);
  assert.throws(()=>buildUserIdentifierPredicate('12345'),/valid email/);
  assert.throws(()=>buildUserIdentifierPredicate('person@example.test',{emailColumn:'email) OR true --',phoneColumn:'phone'}),/trusted SQL identifiers/);
});

test('Postgres identifier SQL matches Nigerian numbers stored with different punctuation',async t=>{
  const db=new PGlite();t.after(()=>db.close());
  await db.exec(`CREATE TABLE public.users(id integer PRIMARY KEY,email text NOT NULL,phone text NOT NULL);
    INSERT INTO public.users VALUES (1,'person@example.test','+234 (801) 234-5678'),(2,'other@example.test','0809-000-0000');`);
  const predicate=buildUserIdentifierPredicate('0801 234 5678',{emailColumn:'u.email',phoneColumn:'u.phone'});
  let parameter=0;
  const sql=predicate.sql.replace(/\?/g,()=>`$${++parameter}`);
  const result=await db.query(`SELECT u.id FROM public.users u WHERE ${sql}`,predicate.params);
  assert.deepEqual(result.rows,[{id:1}]);
});

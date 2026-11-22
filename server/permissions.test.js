import test from 'node:test';
import assert from 'node:assert/strict';
import {missingPermissionDependencies,normalizePermissionKeys,removePermissionAndDependents} from '../shared/permissions.js';

test('permission grants normalize dependencies for both API validation and the role editor',()=>{
  assert.deepEqual(normalizePermissionKeys(['deliveries.assign','users.manage','settings.manage','deliveries.assign']),[
    'deliveries.assign','deliveries.read','pricing.read','settings.manage','users.manage','users.read',
  ]);
  assert.deepEqual(missingPermissionDependencies(['finance.manage']),[
    {permission:'finance.manage',dependency:'finance.read'},
  ]);
  assert.deepEqual(missingPermissionDependencies(normalizePermissionKeys(['finance.manage'])),[]);
});

test('removing a permission also removes grants that would no longer be valid',()=>{
  assert.deepEqual(removePermissionAndDependents(['deliveries.read','deliveries.assign','deliveries.update'],'deliveries.read'),[]);
  assert.deepEqual(removePermissionAndDependents(['users.read','accounts.suspend','users.manage'],'accounts.suspend'),[
    'users.manage','users.read',
  ]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {isValidIsoDate,parseDateRange,parsePagination,parseSearchQuery} from './query-filters.js';

test('date filter validation accepts valid calendar dates and rejects malformed or impossible dates',()=>{
  assert.equal(isValidIsoDate(''),true);
  assert.equal(isValidIsoDate('2026-11-16'),true);
  assert.equal(isValidIsoDate('2026-02-29'),false);
  assert.equal(isValidIsoDate('2024-02-29'),true);
  assert.equal(isValidIsoDate('16-11-2026'),false);
  assert.equal(isValidIsoDate('2026-13-01'),false);
});

test('parseDateRange enforces chronological ordering and normalizes omitted dates to null',()=>{
  assert.deepEqual(parseDateRange({}),{from:null,to:null});
  assert.deepEqual(parseDateRange({from:'2026-11-01',to:'2026-11-16'}),{from:'2026-11-01',to:'2026-11-16'});
  assert.throws(()=>parseDateRange({from:'2026-11-17',to:'2026-11-16'}),error=>error.status===400);
  assert.throws(()=>parseDateRange({from:'2026-02-30'}),error=>error.status===400);
});

test('parsePagination and parseSearchQuery enforce safe bounds',()=>{
  assert.deepEqual(parsePagination({page:'-3',limit:'999'},{maxLimit:100}),{page:1,limit:100,offset:0});
  assert.deepEqual(parsePagination({page:'3',limit:'25'},{maxLimit:100}),{page:3,limit:25,offset:50});
  assert.equal(parseSearchQuery('  dt-123  '),'%dt-123%');
  assert.equal(parseSearchQuery('   '),null);
});

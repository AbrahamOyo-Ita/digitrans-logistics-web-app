import test from 'node:test';
import assert from 'node:assert/strict';
import {rowsToCsv} from '../client/src/lib/csv.js';

const columns=[{key:'reference',label:'Reference'},{key:'amount',label:'Amount'},{key:'note',label:'Note'}];

test('CSV export quotes commas, quotes, and line breaks and keeps an UTF-8 BOM',()=>{
  const csv=rowsToCsv([{reference:'PAY-1',amount:1200,note:'Packed, sealed "carefully"\nOK'}],columns);
  assert.ok(csv.startsWith('\uFEFFReference,Amount,Note\r\n'));
  assert.ok(csv.includes('PAY-1,1200,"Packed, sealed ""carefully""\nOK"'));
});

test('CSV export neutralizes spreadsheet formula injection in text values',()=>{
  const csv=rowsToCsv([{reference:'=HYPERLINK("x")',amount:-100,note:'@SUM(A1:A2)'}],columns);
  assert.ok(csv.includes("'=HYPERLINK("));
  assert.ok(csv.includes("-100,'@SUM"));
});

test('CSV export supports empty rows with a stable header',()=>{
  assert.equal(rowsToCsv([],columns),'\uFEFFReference,Amount,Note\r\n');
});

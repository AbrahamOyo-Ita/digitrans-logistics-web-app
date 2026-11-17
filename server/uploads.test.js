import test from 'node:test';
import assert from 'node:assert/strict';
import {hasValidFileSignature} from './uploads.js';

test('document and image uploads must match their declared MIME signatures',()=>{
  const valid=[
    {mimetype:'application/pdf',buffer:Buffer.from('%PDF-1.7 test')},
    {mimetype:'image/jpeg',buffer:Buffer.from([0xff,0xd8,0xff,0x00])},
    {mimetype:'image/png',buffer:Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])},
    {mimetype:'image/webp',buffer:Buffer.from('RIFF0000WEBP','ascii')},
  ];
  for(const file of valid)assert.equal(hasValidFileSignature(file),true,`expected ${file.mimetype} signature to pass`);
  assert.equal(hasValidFileSignature({mimetype:'image/png',buffer:Buffer.from('<html>bad') }),false);
  assert.equal(hasValidFileSignature({mimetype:'application/x-msdownload',buffer:Buffer.from('MZ')}),false);
  assert.equal(hasValidFileSignature(null),false);
});

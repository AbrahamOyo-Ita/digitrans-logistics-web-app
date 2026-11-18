import test from 'node:test';
import assert from 'node:assert/strict';
import {createLogger} from './logger.js';

function captureLogger(){
 const rows=[];
 return {rows,logger:createLogger({sink:(line,record)=>rows.push({line,record})})};
}

test('structured logger emits a timestamped event with serializable context',()=>{
 const {rows,logger}=captureLogger();
 logger.info('http.request',{requestId:'request-123',method:'GET',path:'/api/health',statusCode:200,durationMs:2.5});
 assert.equal(rows.length,1);
 assert.deepEqual(JSON.parse(rows[0].line),rows[0].record);
 assert.equal(rows[0].record.level,'info');
 assert.equal(rows[0].record.event,'http.request');
 assert.equal(rows[0].record.requestId,'request-123');
 assert.equal(rows[0].record.statusCode,200);
 assert.ok(Number.isFinite(Date.parse(rows[0].record.timestamp)));
});

test('structured logger redacts credentials, account identifiers and sensitive URL parameters',()=>{
 const {rows,logger}=captureLogger();
 logger.warn('auth.failure',{
  email:'person@example.test',password:'CorrectHorseBatteryStaple1!',
  dbUrl:'postgres://admin:db-password@db.example.test/project?sslmode=require',
  detail:'provider said Bearer eyJhbGciOi.example, token=one-time-token, or call +234 801 234 5678',
  url:'https://example.test/reset?token=one-time-token&email=person%40example.test',
 });
 const output=rows[0].line;
 assert.ok(!output.includes('person@example.test'));
 assert.ok(!output.includes('db-password'));
 assert.doesNotMatch(output,/person@example\.test|CorrectHorseBatteryStaple|one-time-token|eyJhbGciOi/);
 assert.ok(!output.includes('+234 801 234 5678'));
 assert.match(output,/\[REDACTED\]/);
});

test('error serialization keeps safe diagnostics without leaking stack traces or PII',()=>{
 const {rows,logger}=captureLogger();
 const error=Object.assign(new Error('Could not authenticate person@example.test with token=secret-value'),{code:'AUTH_UNAVAILABLE',status:503});
 error.stack='Error: private path /home/user/secret.js';
 logger.error('http.error',{requestId:'request-456',error});
 const record=rows[0].record;
 assert.ok(!rows[0].line.includes('person@example.test'));
 assert.equal(record.error.name,'Error');
 assert.equal(record.error.code,'AUTH_UNAVAILABLE');
 assert.equal(record.error.status,503);
 assert.doesNotMatch(rows[0].line,/person@example\.test|secret-value|private path/);
});

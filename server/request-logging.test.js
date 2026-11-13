import test from 'node:test';
import assert from 'node:assert/strict';
import {createLogger} from './logger.js';
import {createRequestLoggingMiddleware} from './request-logging.js';

test('request middleware attaches an opaque ID and records path, status and duration without query data',()=>{
 const rows=[],headers={},listeners={};let continued=0;
 const ticks=[0n,16_240_000n];
 const middleware=createRequestLoggingMiddleware({
  logger:createLogger({sink:(_line,record)=>rows.push(record)}),
  requestIdFactory:()=> 'request-test-123',
  now:()=>ticks.shift(),
 });
 const req={method:'GET',path:'/api/track',url:'/api/track?ref=private-reference'};
 const res={statusCode:200,setHeader:(name,value)=>{headers[name]=value;},on:(event,callback)=>{listeners[event]=callback;}};
 middleware(req,res,()=>{continued++;});
 res.statusCode=404;listeners.finish();
 assert.equal(continued,1);
 assert.equal(req.requestId,'request-test-123');
 assert.equal(headers['X-Request-ID'],'request-test-123');
 assert.deepEqual(rows[0],{
  timestamp:rows[0].timestamp,level:'info',event:'http.request',requestId:'request-test-123',
  method:'GET',path:'/api/track',statusCode:404,durationMs:16.24,
 });
 assert.doesNotMatch(JSON.stringify(rows[0]),/private-reference/);
});

test('request middleware refuses to start without a structured logger',()=>{
 assert.throws(()=>createRequestLoggingMiddleware(),/structured logger is required/);
});

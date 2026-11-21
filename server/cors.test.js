import test from 'node:test';
import assert from 'node:assert/strict';
import {corsMiddleware} from './native-http.js';

function request(headers={},method='POST'){
  return {method,get(name){return headers[String(name).toLowerCase()]||'';},protocol:'https:'};
}
function response(){
  return {headers:{},setHeader(name,value){this.headers[name]=value;},status(code){this.statusCode=code;return this;},end(){this.ended=true;}};
}

test('production CORS accepts same-origin Vercel aliases',()=>{
  const middleware=corsMiddleware({allowedOrigins:new Set(['https://www.digitransdelivery.com']),isProduction:true});
  const res=response();let called=false;
  middleware(request({origin:'https://digitrans-logistics-web-app.vercel.app',host:'digitrans-logistics-web-app.vercel.app','x-forwarded-proto':'https:'}),res,()=>{called=true;});
  assert.equal(called,true);
  assert.equal(res.headers['Access-Control-Allow-Origin'],'https://digitrans-logistics-web-app.vercel.app');
});

test('production CORS still rejects unrelated cross-origin requests',()=>{
  const middleware=corsMiddleware({allowedOrigins:new Set(['https://www.digitransdelivery.com']),isProduction:true});
  const res=response();let called=false,error;
  middleware(request({origin:'https://attacker.example',host:'www.digitransdelivery.com','x-forwarded-proto':'https:'}),res,(value)=>{called=true;error=value;});
  assert.equal(called,true);
  assert.equal(error?.status,403);
});

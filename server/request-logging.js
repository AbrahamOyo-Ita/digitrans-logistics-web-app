import {randomUUID} from 'node:crypto';

export function createRequestLoggingMiddleware({logger,requestIdFactory=randomUUID,now=()=>process.hrtime.bigint()}={}){
 if(!logger||typeof logger.info!=='function')throw new TypeError('A structured logger is required for request logging.');
 return function requestLoggingMiddleware(req,res,next){
  const startedAt=now(),requestId=requestIdFactory();
  req.requestId=requestId;
  res.setHeader('X-Request-ID',requestId);
  res.on('finish',()=>{
   const durationMs=Math.round(Number(now()-startedAt)/1e4)/100;
   logger.info('http.request',{requestId,method:req.method,path:req.path||String(req.url||'/').split('?')[0],statusCode:res.statusCode,durationMs});
  });
  next();
 };
}

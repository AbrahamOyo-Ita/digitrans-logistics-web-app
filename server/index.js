import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import db from './db.js';
import {logger} from './logger.js';
import {createRequestLoggingMiddleware} from './request-logging.js';
import {getAllowedOrigins,validateRuntimeConfig} from './config.js';
import {refreshExpiredSession,notify} from './auth.js';
import {assertApplicationReady} from './readiness.js';
import {createApp,bodyParser,corsMiddleware,securityHeaders,rateLimit,serveStatic} from './native-http.js';
import authRouter from './routes/auth.js';
import customerRouter from './routes/customer.js';
import riderRouter from './routes/rider.js';
import vendorRouter from './routes/vendor.js';
import operationsRouter from './routes/operations.js';
import financeRouter from './routes/finance.js';
import investmentsRouter from './routes/investments.js';
import contentRouter from './routes/content.js';
import commonRouter from './routes/common.js';
import filesRouter from './routes/files.js';
import paymentsRouter from './routes/payments.js';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=createApp();
const isProduction=process.env.NODE_ENV==='production';
validateRuntimeConfig();
await assertApplicationReady();
const allowedOrigins=getAllowedOrigins();
const proxySetting=String(process.env.TRUST_PROXY??'1').trim().toLowerCase();
const trustProxy=proxySetting==='false'?false:/^\d+$/.test(proxySetting)?Number(proxySetting):proxySetting.includes(',')?proxySetting.split(',').map(value=>value.trim()):proxySetting;
app.disable('x-powered-by');
app.set('trust proxy',trustProxy);
app.use(createRequestLoggingMiddleware({logger}));

app.use(corsMiddleware({allowedOrigins,isProduction}));
app.use(securityHeaders({isProduction}));
app.use(bodyParser());
app.use('/api',refreshExpiredSession);
app.use('/api',(req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});

const authLimit=rateLimit({windowMs:15*60*1000,limit:5,keyGenerator:req=>`${req.ip}:${String(req.body?.identifier||req.body?.email||'').trim().toLowerCase()}`,message:{error:'Too many authentication attempts. Please wait 15 minutes and try again.'}});
const publicContactLimit=rateLimit({windowMs:15*60*1000,limit:5,message:{error:'Too many enquiries. Please try again later.'}});
const publicTrackingLimit=rateLimit({windowMs:60*1000,limit:60,message:{error:'Too many tracking lookups. Please try again shortly.'}});
app.use('/api/auth/login',authLimit);
app.use('/api/auth/register',authLimit);
app.use('/api/auth/forgot-password',authLimit);
app.use('/api/public/contact',publicContactLimit);
app.use(['/api/track','/api/waybills/track'],publicTrackingLimit);
app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'DigiTrans Logistics',time:new Date().toISOString()}));
app.use('/api/auth',authRouter);
app.use('/api',customerRouter);
app.use('/api',riderRouter);
app.use('/api',vendorRouter);
app.use('/api',operationsRouter);
app.use('/api',financeRouter);
app.use('/api',investmentsRouter);
app.use('/api',contentRouter);
app.use('/api',commonRouter);
app.use('/api',filesRouter);
app.use('/api',paymentsRouter);
app.use('/api',(req,res)=>res.status(404).json({error:'API endpoint not found.'}));

app.use((err,req,res,_next)=>{
  const status=Number(err?.status)||500;
  const fields={requestId:req.requestId||null,method:req.method,path:req.path,statusCode:status,error:err};
  if(status>=500)logger.error('http.error',fields);
  else if(status>=400)logger.warn('http.error',fields);
  if(res.headersSent)return;
  res.status(status).json({error:status>=500?'Something went wrong. Please try again.':(err.message||'Request failed.')});
});

const dist=path.join(__dirname,'..','dist');
if(isProduction&&fs.existsSync(dist)){
  app.use(serveStatic(dist));
  app.get('*',(req,res)=>{
    if(req.path.startsWith('/api/')||req.path.startsWith('/uploads/'))return res.status(404).send('Not found');
    res.sendFile(path.join(dist,'index.html'));
  });
}else{
  app.get('/',(_req,res)=>res.status(200).json({service:'DigiTrans API',preview:'Run the Vite web client on port 5173.'}));
}

let advancingScheduledDeliveries=false;
async function advanceScheduledDeliveries(){
  if(advancingScheduledDeliveries)return;
  advancingScheduledDeliveries=true;
  try{
    const advanced=await db.transaction(async()=>{
      const lock=await db.prepare('SELECT pg_try_advisory_xact_lock(?) AS locked').get(742901);
      if(!lock?.locked)return [];
      const rows=await db.prepare("SELECT id,reference,customer_id,status FROM public.deliveries WHERE timing='scheduled' AND status='pending_confirmation' AND scheduled_at IS NOT NULL AND scheduled_at<=now()").all();
      const changed=[];
      for(const delivery of rows){
        const result=await db.prepare("UPDATE public.deliveries SET status='awaiting_assignment',updated_at=now() WHERE id=? AND status='pending_confirmation'").run(delivery.id);
        if(result.changes){
          await db.prepare('INSERT INTO public.delivery_status_history (id,delivery_id,prev_status,new_status,actor_role,notes) VALUES (?,?,?,?,?,?)').run(crypto.randomUUID(),delivery.id,delivery.status,'awaiting_assignment','system','Scheduled dispatch window opened');
          changed.push(delivery);
        }
      }
      return changed;
    });
    for(const delivery of advanced){
      try{if(delivery.customer_id)await notify(delivery.customer_id,'Scheduled delivery is in the queue',`Delivery ${delivery.reference} is now ready for dispatch.`,'delivery',delivery.id);}
      catch(error){logger.error('scheduler.notification_failed',{requestId:null,deliveryId:delivery.id,error});}
    }
  }finally{advancingScheduledDeliveries=false;}
}
try{await advanceScheduledDeliveries();}catch(error){logger.error('scheduler.scan_failed',{error});}
const scheduler=setInterval(()=>advanceScheduledDeliveries().catch(error=>logger.error('scheduler.scan_failed',{error})),30_000);

const port=Number(process.env.PORT||3001),host=process.env.HOST||'0.0.0.0';
const server=app.listen(port,host,()=>logger.info('server.started',{host,port,environment:isProduction?'production':'development'}));
let shuttingDown=false;
function shutdown(){
  if(shuttingDown)return;shuttingDown=true;clearInterval(scheduler);
  const forced=setTimeout(()=>process.exit(1),10_000);forced.unref();
  logger.info('server.shutdown_started');
  server.close(async()=>{try{await db.close();clearTimeout(forced);logger.info('server.shutdown_complete');process.exit(0);}catch(error){logger.error('database.shutdown_failed',{error});process.exit(1);}});
}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
export default app;

import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db,{migrate} from './db.js';
import { publicDir } from './uploads.js';
import { getAllowedOrigins, normalizeOrigin, validateRuntimeConfig } from './config.js';
import { seedBase } from './seed.js';
import { notify } from './auth.js';
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
const app=express();
const isProduction=process.env.NODE_ENV==='production';
validateRuntimeConfig();
const allowedOrigins=getAllowedOrigins();
const proxySetting=String(process.env.TRUST_PROXY??'1').trim().toLowerCase();
const trustProxy=proxySetting==='false'?false:/^\d+$/.test(proxySetting)?Number(proxySetting):proxySetting.includes(',')?proxySetting.split(',').map(value=>value.trim()):proxySetting;
app.disable('x-powered-by');
app.set('trust proxy',trustProxy);
migrate();
seedBase({demo:!isProduction&&process.env.DISABLE_DEMO_SEED!=='true'});

app.use(cors({
  origin(origin,callback){
    if(!origin)return callback(null,false);
    try{
      const normalized=normalizeOrigin(origin,{production:isProduction,label:'Request Origin'});
      if(allowedOrigins.has(normalized))return callback(null,origin);
      if(!isProduction&&new URL(origin).hostname.endsWith('.e2b.app'))return callback(null,origin);
    }catch{}
    const error=new Error('Origin not allowed by CORS.');error.status=403;return callback(error);
  },
  credentials:true,
  maxAge:600,
}));
app.use(helmet({
  contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'","data:"],fontSrc:["'self'","data:"],connectSrc:["'self'"],objectSrc:["'none'"],baseUri:["'self'"],formAction:["'self'"],frameAncestors:isProduction?["'none'"]:['*']}},
  crossOriginResourcePolicy:false,
  frameguard:isProduction?{action:'deny'}:false,
}));
app.use('/uploads/public',express.static(publicDir,{fallthrough:false,maxAge:isProduction?'7d':0,immutable:isProduction,setHeaders(res){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox");}}));
app.use('/api/payments/paystack/webhook',express.raw({type:'application/json',limit:'1mb'}));
app.use(express.json({limit:'1mb'}));
app.use(express.urlencoded({extended:false,limit:'1mb'}));
app.use(cookieParser());
app.use('/api',(req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});

const authLimit=rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Too many attempts. Wait a few minutes and try again.'}});
const publicContactLimit=rateLimit({windowMs:15*60*1000,limit:5,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Too many enquiries. Please try again later.'}});
const publicTrackingLimit=rateLimit({windowMs:60*1000,limit:60,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Too many tracking lookups. Please try again shortly.'}});
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
  const logMessage=`[${new Date().toISOString()}] ${req.method} ${req.path} (${status})`;
  if(status>=500)console.error(`${logMessage}:`,err?.stack||err);
  else if(status>=400)console.warn(`${logMessage}: ${err?.message||'Request failed.'}`);
  if(res.headersSent)return;
  res.status(status).json({error:status>=500?'Something went wrong. Please try again.':(err.message||'Request failed.')});
});

const dist=path.join(__dirname,'..','dist');
if(isProduction&&fs.existsSync(dist)){
  app.use(express.static(dist,{maxAge:'1h',etag:true}));
  app.get('*',(req,res)=>{
    if(req.path.startsWith('/api/')||req.path.startsWith('/uploads/'))return res.status(404).send('Not found');
    res.sendFile(path.join(dist,'index.html'));
  });
}else{
  app.get('/',(_req,res)=>res.status(200).json({service:'DigiTrans API',preview:'Run the Vite web client on port 5173.'}));
}

function advanceScheduledDeliveries(){
  const rows=db.prepare("SELECT id,reference,customer_id,status FROM deliveries WHERE timing='scheduled' AND status='pending_confirmation' AND scheduled_at IS NOT NULL AND datetime(scheduled_at)<=datetime('now')").all();
  for(const d of rows){
    const advance=db.transaction(()=>{
      const result=db.prepare("UPDATE deliveries SET status='awaiting_assignment',updated_at=datetime('now') WHERE id=? AND status='pending_confirmation'").run(d.id);
      if(result.changes)db.prepare('INSERT INTO delivery_status_history (id,delivery_id,prev_status,new_status,actor_role,notes) VALUES (?,?,?,?,?,?)').run(cryptoId(),d.id,d.status,'awaiting_assignment','system','Scheduled dispatch window opened');
      return result.changes;
    });
    try{if(advance()&&d.customer_id)notify(d.customer_id,'Scheduled delivery is in the queue',`Delivery ${d.reference} is now ready for dispatch.`,'delivery',d.id);}catch(e){console.error('scheduled delivery advance failed',e.message);}
  }
}
function cryptoId(){return globalThis.crypto.randomUUID();}
advanceScheduledDeliveries();
const scheduler=setInterval(advanceScheduledDeliveries,30_000);
const cleanup=setInterval(()=>{try{db.prepare("DELETE FROM sessions WHERE expires_at<datetime('now') OR revoked=1").run();db.prepare("DELETE FROM password_resets WHERE expires_at<datetime('now') OR used=1").run();}catch(e){console.error('session cleanup failed',e.message);}},60*60*1000);

const port=Number(process.env.PORT||3001),host=process.env.HOST||'0.0.0.0';
const server=app.listen(port,host,()=>console.log(`DigiTrans API listening on http://${host}:${port} (${isProduction?'production':'development'})`));
function shutdown(){clearInterval(scheduler);clearInterval(cleanup);server.close(()=>{try{db.close();}catch{}process.exit(0);});setTimeout(()=>process.exit(1),5000).unref();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
export default app;

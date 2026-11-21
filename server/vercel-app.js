import {logger} from './logger.js';
import {createRequestLoggingMiddleware} from './request-logging.js';
import {getAllowedOrigins,validateRuntimeConfig} from './config.js';
import {refreshExpiredSession} from './auth.js';
import {assertApplicationReady} from './readiness.js';
import {createApp,bodyParser,corsMiddleware,securityHeaders,rateLimit} from './native-http.js';
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

const app=createApp();
const isProduction=process.env.NODE_ENV==='production';
validateRuntimeConfig();
const allowedOrigins=getAllowedOrigins();
const proxySetting=String(process.env.TRUST_PROXY??'1').trim().toLowerCase();
const trustProxy=proxySetting==='false'?false:/^\d+$/.test(proxySetting)?Number(proxySetting):proxySetting.includes(',')?proxySetting.split(',').map(value=>value.trim()):proxySetting;
app.disable('x-powered-by');
app.set('trust proxy',trustProxy);
app.use(createRequestLoggingMiddleware({logger}));
app.use(corsMiddleware({allowedOrigins,isProduction}));
app.use(securityHeaders({isProduction}));
app.use(bodyParser());

let readiness;
app.use(async(_req,_res,next)=>{
  try{
    readiness??=assertApplicationReady();
    await readiness;
    next();
  }catch(error){
    error.status=503;
    next(error);
  }
});

app.use('/api',refreshExpiredSession);
app.use('/api',(req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
const authLimit=rateLimit({windowMs:15*60*1000,limit:5,keyGenerator:req=>`${req.ip}:${String(req.body?.identifier||req.body?.email||'').trim().toLowerCase()}`,message:{error:'Too many authentication attempts. Please wait 15 minutes and try again.'}});
const publicContactLimit=rateLimit({windowMs:15*60*1000,limit:5,message:{error:'Too many enquiries. Please try again later.'}});
const publicTrackingLimit=rateLimit({windowMs:60*1000,limit:60,message:{error:'Too many tracking lookups. Please try again shortly.'}});
app.use('/api/auth/login',authLimit);
app.use('/api/auth/register',authLimit);
app.use('/api/auth/forgot-password',authLimit);
app.use('/api/auth/resend-verification',authLimit);
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
  if(status>=500)logger.error('http.error',fields); else if(status>=400)logger.warn('http.error',fields);
  if(res.headersSent)return;
  res.status(status).json({error:status>=500?'Something went wrong. Please try again.':(err.message||'Request failed.')});
});

export default app;

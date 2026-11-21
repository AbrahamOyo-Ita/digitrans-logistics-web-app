import {processTransactionalEmailOutbox} from '../../server/email-outbox.js';
import {logger} from '../../server/logger.js';

export default async function handler(req,res){
  const secret=String(process.env.CRON_SECRET||'').trim();
  const authorization=String(req.headers.authorization||'');
  if(!secret||authorization!==`Bearer ${secret}`)return res.status(401).json({error:'Unauthorized.'});
  try{return res.status(200).json({ok:true,...await processTransactionalEmailOutbox()});}
  catch(error){
    logger.error('transactional-email.cron_failed',{requestId:null,error});
    return res.status(500).json({error:'Transactional email job failed.'});
  }
}

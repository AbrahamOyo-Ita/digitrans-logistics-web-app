import {advanceScheduledDeliveries} from '../../server/scheduled-deliveries.js';

export default async function handler(req,res){
  const secret=String(process.env.CRON_SECRET||'').trim();
  const authorization=String(req.headers.authorization||'');
  if(!secret||authorization!==`Bearer ${secret}`)return res.status(401).json({error:'Unauthorized.'});
  try{return res.status(200).json({ok:true,...await advanceScheduledDeliveries()});}
  catch(error){console.error('scheduled-deliveries.cron_failed',error);return res.status(500).json({error:'Scheduled delivery job failed.'});}
}

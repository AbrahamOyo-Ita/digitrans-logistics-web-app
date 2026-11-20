import crypto from 'node:crypto';
import db from './db.js';
import {logger} from './logger.js';
import {notify} from './auth.js';

let running=false;

export async function advanceScheduledDeliveries(){
  if(running)return {advanced:0,skipped:true};
  running=true;
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
    return {advanced:advanced.length,skipped:false};
  }finally{running=false;}
}

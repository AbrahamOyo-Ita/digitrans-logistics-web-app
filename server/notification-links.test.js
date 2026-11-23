import test from 'node:test';
import assert from 'node:assert/strict';
import {notificationHref} from '../shared/notification-links.js';

test('notification links send each workspace role to its relevant delivery view',()=>{
  assert.equal(notificationHref({type:'delivery',related_id:'delivery-1'},{role:'customer'}),'/customer/history?focus=delivery-1');
  assert.equal(notificationHref({type:'delivery',related_id:'delivery-1v'},{role:'vendor'}),'/vendor/history?focus=delivery-1v');
  assert.equal(notificationHref({type:'assignment',related_id:'delivery-2'},{role:'rider'}),'/rider/jobs?focus=delivery-2');
  assert.equal(notificationHref({type:'delivery',related_id:'delivery-3'},{role:'ops_officer'}),'/ops/deliveries?focus=delivery-3');
});

test('notification links route support, payment, market run and waybill updates to their own records',()=>{
  assert.equal(notificationHref({type:'support',related_id:'ticket-1'},{role:'vendor'}),'/vendor/support?ticket=ticket-1');
  assert.equal(notificationHref({type:'payment',related_id:'payment-1',title:'Payment confirmed'},{role:'customer'}),'/customer/payments?focus=payment-1');
  assert.equal(notificationHref({type:'payment',related_id:'waybill-1',title:'Waybill payment confirmed'},{role:'customer'}),'/customer/waybills?focus=waybill-1');
  assert.equal(notificationHref({type:'market_run',related_id:'mr-1',title:'Market Run estimate ready'},{role:'student'}),'/customer/market?focus=mr-1');
});

test('notification links respect finance, investment and verification workspaces',()=>{
  assert.equal(notificationHref({type:'finance',related_id:'settlement-1'},{role:'rider'}),'/rider/earnings?focus=settlement-1');
  assert.equal(notificationHref({type:'finance',related_id:'payment-2'},{role:'finance_officer'}),'/ops/finance?focus=payment-2');
  assert.equal(notificationHref({type:'investment',related_id:'withdrawal-1',title:'Investment withdrawal approved'},{role:'investor'}),'/investor/withdrawals?focus=withdrawal-1');
  assert.equal(notificationHref({type:'investment',related_id:'application-1',title:'Investment application received'},{role:'investment_manager'}),'/ops/investments?tab=applications&focus=application-1');
  assert.equal(notificationHref({type:'investment',related_id:'application-2',title:'Investment payment review'},{role:'investor'}),'/investor/applications?focus=application-2');
  assert.equal(notificationHref({type:'account',title:'Student verification approved'},{role:'student'}),'/customer/documents');
  assert.equal(notificationHref({type:'account',related_id:'rider-1',title:'Rider application pending'},{role:'rider_manager'}),'/ops/riders?focus=rider-1');
  assert.equal(notificationHref({type:'contact_message',related_id:'enq-1',title:'New enquiry'},{role:'ops_officer'}),'/ops/contact?focus=enq-1');
});

test('unknown notification types stay in the signed-in role workspace and unsafe ids are encoded',()=>{
  assert.equal(notificationHref({type:'other'},{role:'student'}),'/customer/notifications');
  assert.equal(notificationHref({type:'support',related_id:'a&b'},{role:'customer'}),'/customer/support?ticket=a%26b');
});

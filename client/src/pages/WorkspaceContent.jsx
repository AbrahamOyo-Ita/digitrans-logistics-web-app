import React from 'react';
import {api,money} from '../lib/api';
import {useApiData} from '../lib/hooks';
import {Badge,Button,Card,Empty,Loading,PageTitle,StatCard} from '../components/UI';
import Icon from '../components/Icon';
import {notificationHref} from '../../../shared/notification-links.js';
import {workspacePath} from '../../../shared/workspace-links.js';
import PaymentsView from './PaymentsView';
import {BookingForm,DeliveryList,MarketRunsView,WaybillsView,ProfileView,DocumentsView,SupportView} from './CustomerViews';
import {ADMIN_ROLE_IDS} from '../../../shared/roles.js';
import {RiderOverview,RiderJobsPage,RiderEarnings,RiderProfile} from './RiderViews';
import {VendorOverview,VendorProfile} from './VendorViews';
import {InvestorOverview,OpportunitiesView,InvestorApplications,InvestorProfile,InvestorWithdrawals} from './InvestorViews';
import {OpsOverview,NeedsAttentionSection,NeedsAttentionView,ApplicationsView,AccountsView,FinanceView,FinanceWithdrawals,PricingView,OpsWaybills,OpsInvestments,ContentManagement,AuditView,AdminTeam,OpsSupport,ContactMessages} from './OpsViews';

function CustomerOverview({user,navigate}){
 const {data,loading,error}=useApiData('/deliveries?limit=5');const markets=useApiData('/market-runs'),addresses=useApiData('/addresses');
 if(loading)return <Loading/>;if(error)return <Card><p className="text-sm text-rose-600">{error}</p></Card>;
 const rows=data?.deliveries||[],active=rows.filter(d=>!['delivered','cancelled','returned','delivery_failed'].includes(d.status)).length,complete=rows.filter(d=>d.status==='delivered').length;
 return <><PageTitle eyebrow="Customer workspace" title={`Welcome back${user.full_name?`, ${user.full_name.split(' ')[0]}`:''}.`} description="Your deliveries and service requests, together in one place." action={<Button onClick={()=>navigate(workspacePath(user.role,'booking'))} icon="plus">Book a delivery</Button>}/><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Active deliveries" value={active} icon="truck" tone="blue"/><StatCard label="Completed deliveries" value={complete} icon="check"/><StatCard label="Market Runs" value={markets.data?.marketRuns?.length||0} icon="bag" tone="gold"/><StatCard label="Saved addresses" value={addresses.data?.addresses?.length||0} icon="pin" change="Manage saved delivery locations in My profile"/></div>{user.role==='student'&&<Card className="mt-5 flex flex-wrap items-center justify-between gap-3 border-brand-200 bg-brand-50"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-700"><Icon name="spark"/></span><div><p className="text-sm font-bold text-ink">Student delivery</p><p className="mt-1 text-[10px] text-slate-500">{user.verification_status==='approved'?'Your student status is verified. Student pricing applies while your eligibility remains current.':'Upload a current student ID for pricing eligibility review.'}</p></div></div><div className="flex items-center gap-2"><Badge status={user.verification_status||'pending'}/><Button size="sm" variant="outline" onClick={()=>navigate(workspacePath(user.role,'documents'))}>Student ID</Button></div></Card>}<div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><Card><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-bold text-ink">Recent deliveries</h2><p className="mt-1 text-[10px] text-slate-400">Your latest requests.</p></div><Button size="sm" variant="ghost" onClick={()=>navigate(workspacePath(user.role,'history'))}>View history</Button></div>{rows.length?<div className="space-y-2">{rows.map(d=><button key={d.id} type="button" onClick={()=>navigate(workspacePath(user.role,'history',{focus:d.id}))} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-left transition hover:bg-slate-100"><div><p className="text-xs font-bold text-ink">{d.reference}</p><p className="mt-1 max-w-sm truncate text-[10px] text-slate-500">{d.pickup_address} → {d.dropoff_address}</p></div><div className="flex items-center gap-3"><Badge status={d.status}/><span className="text-xs font-bold text-ink">{money(d.fee)}</span></div></button>)}</div>:<Empty icon="truck" title="Your next delivery starts here" description="Create a request and its reference will show up here." action={<Button size="sm" onClick={()=>navigate(workspacePath(user.role,'booking'))}>Start a delivery</Button>}/>}</Card><div className="space-y-5"><Card className="bg-brand-950 text-white"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-gold-300"><Icon name="bag"/></span><h2 className="mt-4 text-base font-bold">Need something from the market?</h2><p className="mt-2 text-xs leading-5 text-white/55">Send a list, review the estimate, and approve before shopping begins.</p><Button size="sm" variant="gold" className="mt-4" onClick={()=>navigate(workspacePath(user.role,'market'))}>Start a Market Run</Button></Card><Card><h2 className="text-sm font-bold text-ink">A parcel going farther?</h2><p className="mt-2 text-xs leading-5 text-slate-500">Submit an intercity waybill request and follow its public tracking timeline.</p><Button variant="outline" size="sm" className="mt-4" onClick={()=>navigate(workspacePath(user.role,'waybills'))}>Create a waybill</Button></Card></div></div></>;
}
function InvestorManagerOverview({navigate}){
 const apps=useApiData('/ops/investment-applications'),opps=useApiData('/ops/opportunities');
 return <><PageTitle eyebrow="Investment management" title="Investor pipeline" description="Review verified applications and manage the approved opportunity lifecycle." action={<Button onClick={()=>navigate('/ops/investments')}>Manage opportunities</Button>}/><div className="grid gap-3 sm:grid-cols-3"><StatCard label="Published opportunities" value={opps.data?.opportunities?.filter(o=>o.status==='published').length||0} icon="chart"/><StatCard label="Pending applications" value={apps.data?.applications?.filter(a=>['submitted','under_review'].includes(a.status)).length||0} icon="file" tone="gold"/><StatCard label="Investment applications" value={apps.data?.applications?.length||0} icon="users" tone="blue"/></div><NeedsAttentionSection navigate={navigate} limit={6} compact/><Card className="mt-6"><h2 className="text-sm font-bold text-ink">Recent investor applications</h2>{apps.loading?<Loading/>:apps.data?.applications?.length?<div className="mt-4 space-y-2">{apps.data.applications.slice(0,5).map(a=><button key={a.id} type="button" onClick={()=>navigate(`/ops/investments?tab=applications&focus=${encodeURIComponent(a.id)}`)} className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-left transition hover:bg-slate-100"><div><p className="text-xs font-bold text-ink">{a.investor_name} · {a.opportunity_title}</p><p className="mt-1 text-[10px] text-slate-400">{a.reference}</p></div><div className="flex items-center gap-2"><Badge status={a.status}/><span className="text-xs font-bold">{money(a.amount)}</span></div></button>)}</div>:<Empty icon="chart" title="No applications yet"/>}</Card></>;
}
function NotificationsView({user,navigate}){
 const {data,loading,error,reload}=useApiData('/notifications');
 const open=async notification=>{
  try{if(!notification.is_read)await api(`/notifications/${notification.id}/read`,{method:'PATCH'});}catch{}
  navigate(notificationHref(notification,user));reload();
 };
 const readAll=async()=>{await api('/notifications/read-all',{method:'POST'});reload();};
 return <><PageTitle eyebrow="Account activity" title="Notifications" description="Open an update to jump to its delivery, payment, request or support conversation." action={<Button variant="outline" onClick={readAll}>Mark all as read</Button>}/>{loading?<Loading/>:error?<p className="text-sm text-rose-600">{error}</p>:!data?.notifications?.length?<Empty icon="bell" title="Nothing new" description="Important activity will appear here."/>:<div className="space-y-2">{data.notifications.map(n=><button key={n.id} onClick={()=>open(n)} className={`block w-full rounded-xl border p-4 text-left ${n.is_read?'border-slate-200 bg-white':'border-brand-100 bg-brand-50/50'}`}><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-ink">{n.title}</p>{!n.is_read&&<span className="h-2 w-2 rounded-full bg-brand-600"/>}</div><p className="mt-1 text-xs leading-5 text-slate-500">{n.message}</p><p className="mt-2 text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString('en-NG')}</p></button>)}</div>}</>;
}

export default function WorkspaceContent({user,page,navigate,showToast,locationSearch=''}){
 const role=user.role,isAdmin=ADMIN_ROLE_IDS.includes(role),permissions=new Set(user.permissions||[]);
 const can=key=>role==='super_admin'||permissions.has(key);
 if(page==='access-denied'||page==='no-access')return <Card className="mx-auto max-w-xl"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><Icon name="shield"/></span><div><h2 className="text-sm font-bold text-ink">{page==='no-access'?'No administrator permissions assigned':'This section is not available to your position'}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{page==='no-access'?'Ask a Super Administrator to assign the permissions you need.':'Your assigned permissions do not include this section. Ask a Super Administrator if your access should change.'}</p></div></div></Card>;
 if(page==='overview'){
  if(['customer','student'].includes(role))return <CustomerOverview user={user} navigate={navigate}/>;
  if(role==='rider')return <RiderOverview navigate={navigate} showToast={showToast} locationSearch={locationSearch}/>;
  if(role==='vendor')return <VendorOverview navigate={navigate} showToast={showToast}/>;
  if(role==='investor')return <InvestorOverview navigate={navigate} locationSearch={locationSearch}/>;
  if(isAdmin){
   if(!can('deliveries.read')&&can('investments.read'))return <InvestorManagerOverview navigate={navigate}/>;
   if(can('deliveries.read'))return <OpsOverview user={user} navigate={navigate}/>;
   if(can('finance.read'))return <FinanceView user={user} showToast={showToast} locationSearch={locationSearch}/>;
   if(can('users.read'))return <AccountsView user={user} showToast={showToast} locationSearch={locationSearch}/>;
   return <Empty icon="shield" title="Your admin workspace is ready" description="Choose an available section from the navigation."/>;
  }
  return <OpsOverview user={user} navigate={navigate}/>;
 }
 if(page==='attention')return <NeedsAttentionView navigate={navigate}/>;
 if(page==='booking')return <BookingForm user={user} admin={isAdmin} navigate={navigate} showToast={showToast} locationSearch={locationSearch}/>;
 if(page==='deliveries'||page==='history')return <DeliveryList user={user} navigate={navigate} showToast={showToast} ops={isAdmin} locationSearch={locationSearch}/>;
 if(page==='market')return <MarketRunsView user={user} showToast={showToast} navigate={navigate} locationSearch={locationSearch}/>;
 if(page==='waybills')return isAdmin&&can('waybills.manage')?<OpsWaybills user={user} showToast={showToast} navigate={navigate} locationSearch={locationSearch}/>:<WaybillsView user={user} showToast={showToast} navigate={navigate} locationSearch={locationSearch}/>;
 if(page==='jobs')return <RiderJobsPage showToast={showToast} navigate={navigate} locationSearch={locationSearch}/>;
 if(page==='earnings')return <RiderEarnings showToast={showToast} navigate={navigate} locationSearch={locationSearch}/>;
 if(page==='profile'){
  if(role==='rider')return <RiderProfile user={user} showToast={showToast}/>;
  if(role==='vendor')return <VendorProfile showToast={showToast}/>;
  if(role==='investor')return <InvestorProfile user={user} showToast={showToast}/>;
  return <ProfileView user={user} showToast={showToast}/>;
 }
 if(page==='documents')return <DocumentsView user={user} showToast={showToast}/>;
 if(page==='support')return isAdmin?<OpsSupport showToast={showToast} navigate={navigate} locationSearch={locationSearch}/>:<SupportView user={user} showToast={showToast} navigate={navigate} locationSearch={locationSearch}/>;
 if(page==='notifications')return <NotificationsView user={user} navigate={navigate}/>;
 if(page==='opportunities')return <OpportunitiesView showToast={showToast}/>;
 if(page==='applications')return <InvestorApplications showToast={showToast} navigate={navigate} locationSearch={locationSearch}/>;
 if(page==='withdrawals'){
  if(['customer','student'].includes(role))return <DeliveryList user={user} navigate={navigate} showToast={showToast} locationSearch={locationSearch}/>;
  if(role==='investor')return <InvestorWithdrawals showToast={showToast} navigate={navigate} locationSearch={locationSearch}/>;
  return <FinanceWithdrawals user={user} showToast={showToast} navigate={navigate} locationSearch={locationSearch}/>;
 }
 if(page==='riders')return <ApplicationsView kind="rider" showToast={showToast} locationSearch={locationSearch}/>;
 if(page==='vendors')return <ApplicationsView kind="vendor" showToast={showToast} locationSearch={locationSearch}/>;
 if(page==='customers')return <AccountsView user={user} showToast={showToast} locationSearch={locationSearch}/>;
 if(page==='students')return <ApplicationsView kind="student" showToast={showToast} locationSearch={locationSearch}/>;
 if(page==='finance')return <FinanceView user={user} showToast={showToast} locationSearch={locationSearch}/>;
 if(page==='payments')return <PaymentsView user={user} navigate={navigate} locationSearch={locationSearch}/>;
 if(page==='investments')return <OpsInvestments user={user} showToast={showToast} initialTab={new URLSearchParams(locationSearch).get('tab')||'opportunities'} locationSearch={locationSearch}/>;
 if(page==='pricing')return <PricingView user={user} showToast={showToast}/>;
 if(page==='website')return <ContentManagement showToast={showToast}/>;
 if(page==='audit')return <AuditView/>;
 if(page==='team')return <AdminTeam user={user} showToast={showToast}/>;
 if(page==='contact')return <ContactMessages showToast={showToast} locationSearch={locationSearch}/>;
 return <Empty icon="file" title="Workspace page not found" description="Choose a section from the navigation." action={<Button onClick={()=>navigate('/workspace')}>Back to overview</Button>}/>;
}

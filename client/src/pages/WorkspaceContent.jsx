import React from 'react';
import {api,money,date} from '../lib/api';
import {useApiData} from '../lib/hooks';
import {Badge,Button,Card,Empty,Loading,PageTitle,StatCard} from '../components/UI';
import Icon from '../components/Icon';
import {BookingForm,DeliveryList,MarketRunsView,WaybillsView,ProfileView,DocumentsView,SupportView} from './CustomerViews';
import {RiderOverview,RiderJobsPage,RiderEarnings,RiderProfile} from './RiderViews';
import {VendorOverview,VendorProfile} from './VendorViews';
import {InvestorOverview,OpportunitiesView,InvestorApplications,InvestorProfile,InvestorWithdrawals} from './InvestorViews';
import {OpsOverview,ApplicationsView,AccountsView,FinanceView,FinanceWithdrawals,PricingView,OpsWaybills,OpsInvestments,ContentManagement,AuditView,AdminTeam,OpsSupport,ContactMessages} from './OpsViews';

function CustomerOverview({user,navigate}){
 const {data,loading,error,reload}=useApiData('/deliveries?limit=5');const markets=useApiData('/market-runs'),addresses=useApiData('/addresses');
 if(loading)return <Loading/>;if(error)return <Card><p className="text-sm text-rose-600">{error}</p></Card>;
 const rows=data?.deliveries||[],active=rows.filter(d=>!['delivered','cancelled','returned','delivery_failed'].includes(d.status)).length,complete=rows.filter(d=>d.status==='delivered').length;
 return <><PageTitle eyebrow="Customer workspace" title={`Welcome back${user.full_name?`, ${user.full_name.split(' ')[0]}`:''}.`} description="Your deliveries and service requests, together in one place." action={<Button onClick={()=>navigate('/customer/booking')} icon="plus">Book a delivery</Button>}/><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Active deliveries" value={active} icon="truck" tone="blue"/><StatCard label="Completed deliveries" value={complete} icon="check"/><StatCard label="Market Runs" value={markets.data?.marketRuns?.length||0} icon="bag" tone="gold"/><StatCard label="Saved addresses" value={addresses.data?.addresses?.length||0} icon="pin" change="Manage saved delivery locations in My profile"/></div>{user.role==='student'&&<Card className="mt-5 flex items-center justify-between gap-3 border-brand-200 bg-brand-50"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-700"><Icon name="spark"/></span><div><p className="text-sm font-bold text-ink">Student delivery</p><p className="mt-1 text-[10px] text-slate-500">{user.verification_status==='approved'?'Your student status is verified. Student pricing applies while your eligibility remains current.':'Upload a current student ID for pricing eligibility review.'}</p></div></div><Badge status={user.verification_status||'pending'}/></Card>}<div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><Card><div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-bold text-ink">Recent deliveries</h2><p className="mt-1 text-[10px] text-slate-400">Your latest requests.</p></div><Button size="sm" variant="ghost" onClick={()=>navigate('/customer/history')}>View history</Button></div>{rows.length?<div className="space-y-2">{rows.map(d=><div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="text-xs font-bold text-ink">{d.reference}</p><p className="mt-1 max-w-sm truncate text-[10px] text-slate-500">{d.pickup_address} → {d.dropoff_address}</p></div><div className="flex items-center gap-3"><Badge status={d.status}/><span className="text-xs font-bold text-ink">{money(d.fee)}</span></div></div>)}</div>:<Empty icon="truck" title="Your next delivery starts here" description="Create a request and its reference will show up here." action={<Button size="sm" onClick={()=>navigate('/customer/booking')}>Start a delivery</Button>}/>}</Card><div className="space-y-5"><Card className="bg-brand-950 text-white"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-gold-300"><Icon name="bag"/></span><h2 className="mt-4 text-base font-bold">Need something from the market?</h2><p className="mt-2 text-xs leading-5 text-white/55">Send a list, review the estimate, and approve before shopping begins.</p><Button size="sm" variant="gold" className="mt-4" onClick={()=>navigate('/customer/market')}>Start a Market Run</Button></Card><Card><h2 className="text-sm font-bold text-ink">A parcel going farther?</h2><p className="mt-2 text-xs leading-5 text-slate-500">Submit an intercity waybill request and follow its public tracking timeline.</p><Button variant="outline" size="sm" className="mt-4" onClick={()=>navigate('/customer/waybills')}>Create a waybill</Button></Card></div></div></>;
}
function InvestorManagerOverview({navigate}){
 const apps=useApiData('/ops/investment-applications'),opps=useApiData('/ops/opportunities');
 return <><PageTitle eyebrow="Investment management" title="Investor pipeline" description="Review verified applications and manage the approved opportunity lifecycle." action={<Button onClick={()=>navigate('/ops/investments')}>Manage opportunities</Button>}/><div className="grid gap-3 sm:grid-cols-3"><StatCard label="Published opportunities" value={opps.data?.opportunities?.filter(o=>o.status==='published').length||0} icon="chart"/><StatCard label="Pending applications" value={apps.data?.applications?.filter(a=>['submitted','under_review'].includes(a.status)).length||0} icon="file" tone="gold"/><StatCard label="Investment applications" value={apps.data?.applications?.length||0} icon="users" tone="blue"/></div><Card className="mt-6"><h2 className="text-sm font-bold text-ink">Recent investor applications</h2>{apps.loading?<Loading/>:apps.data?.applications?.length?<div className="mt-4 space-y-2">{apps.data.applications.slice(0,5).map(a=><div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="text-xs font-bold text-ink">{a.investor_name} · {a.opportunity_title}</p><p className="mt-1 text-[10px] text-slate-400">{a.reference}</p></div><div className="flex items-center gap-2"><Badge status={a.status}/><span className="text-xs font-bold">{money(a.amount)}</span></div></div>)}</div>:<Empty icon="chart" title="No applications yet"/>}</Card></>;
}
function NotificationsView(){const {data,loading,error,reload}=useApiData('/notifications');const read=async n=>{await api(`/notifications/${n.id}/read`,{method:'PATCH'});reload();};const readAll=async()=>{await api('/notifications/read-all',{method:'POST'});reload();};return <><PageTitle eyebrow="Account activity" title="Notifications" description="Service updates linked only to your account." action={<Button variant="outline" onClick={readAll}>Mark all as read</Button>}/>{loading?<Loading/>:error?<p className="text-sm text-rose-600">{error}</p>:!data?.notifications?.length?<Empty icon="bell" title="Nothing new" description="Important activity will appear here."/>:<div className="space-y-2">{data.notifications.map(n=><button key={n.id} onClick={()=>read(n)} className={`block w-full rounded-xl border p-4 text-left ${n.is_read?'border-slate-200 bg-white':'border-brand-100 bg-brand-50/50'}`}><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-ink">{n.title}</p>{!n.is_read&&<span className="h-2 w-2 rounded-full bg-brand-600"/>}</div><p className="mt-1 text-xs leading-5 text-slate-500">{n.message}</p><p className="mt-2 text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString('en-NG')}</p></button>)}</div>}</>}

export default function WorkspaceContent({user,page,navigate,showToast}){
 const role=user.role;
 if(page==='overview'){
  if(['customer','student'].includes(role))return <CustomerOverview user={user} navigate={navigate}/>;
  if(role==='rider')return <RiderOverview navigate={navigate} showToast={showToast}/>;
  if(role==='vendor')return <VendorOverview navigate={navigate} showToast={showToast}/>;
  if(role==='investor')return <InvestorOverview navigate={navigate}/>;
  if(role==='investment_manager')return <InvestorManagerOverview navigate={navigate}/>;
  return <OpsOverview navigate={navigate}/>;
 }
 if(page==='booking')return <BookingForm user={user} admin={['ops_officer','super_admin'].includes(role)} navigate={navigate} showToast={showToast}/>;
 if(page==='deliveries'||page==='history')return <DeliveryList user={user} navigate={navigate} showToast={showToast} ops={['ops_officer','rider_manager','finance_officer','super_admin'].includes(role)}/>;
 if(page==='market')return <MarketRunsView user={user} showToast={showToast}/>;
 if(page==='waybills')return ['super_admin','ops_officer'].includes(role)?<OpsWaybills showToast={showToast}/>:<WaybillsView user={user} showToast={showToast}/>;
 if(page==='jobs')return <RiderJobsPage showToast={showToast}/>;
 if(page==='earnings')return <RiderEarnings showToast={showToast}/>;
 if(page==='profile'){
  if(role==='rider')return <RiderProfile user={user} showToast={showToast}/>;
  if(role==='vendor')return <VendorProfile showToast={showToast}/>;
  if(role==='investor')return <InvestorProfile user={user} showToast={showToast}/>;
  return <ProfileView user={user} showToast={showToast}/>;
 }
 if(page==='documents')return <DocumentsView user={user} showToast={showToast}/>;
 if(page==='support')return ['ops_officer','rider_manager','vendor_manager','super_admin'].includes(role)?<OpsSupport showToast={showToast}/>:<SupportView user={user} showToast={showToast}/>;
 if(page==='notifications')return <NotificationsView/>;
 if(page==='opportunities')return <OpportunitiesView showToast={showToast}/>;
 if(page==='applications')return <InvestorApplications showToast={showToast}/>;
 if(page==='withdrawals'){
  if(['customer','student','investor'].includes(role))return role==='investor'?<InvestorWithdrawals showToast={showToast}/>:<DeliveryList user={user} navigate={navigate} showToast={showToast}/>;
  if(role==='investment_manager')return <OpsInvestments user={user} showToast={showToast} initialTab="withdrawals"/>;
  return <FinanceWithdrawals showToast={showToast}/>;
 }
 if(page==='riders')return <ApplicationsView kind="rider" showToast={showToast}/>;
 if(page==='vendors')return <ApplicationsView kind="vendor" showToast={showToast}/>;
 if(page==='customers')return <AccountsView user={user} showToast={showToast}/>;
 if(page==='finance')return <FinanceView showToast={showToast}/>;
 if(page==='investments')return role==='finance_officer'?<OpsInvestments user={user} showToast={showToast}/>:<OpsInvestments user={user} showToast={showToast}/>;
 if(page==='pricing')return <PricingView showToast={showToast}/>;
 if(page==='website')return <ContentManagement showToast={showToast}/>;
 if(page==='audit')return <AuditView/>;
 if(page==='team')return <AdminTeam showToast={showToast}/>;
 if(page==='contact')return <ContactMessages showToast={showToast}/>;
 return <Empty icon="file" title="Workspace page not found" description="Choose a section from the navigation." action={<Button onClick={()=>navigate('/workspace')}>Back to overview</Button>}/>;
}

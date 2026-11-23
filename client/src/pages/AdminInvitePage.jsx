import React,{useEffect,useState} from 'react';
import Icon from '../components/Icon';
import Brand from '../components/Brand';
import {Button,Field,Input} from '../components/UI';
import {api} from '../lib/api';
import {ADMIN_ROLE_LABELS} from '../../../shared/roles.js';

function inviteFromHash(){
 const params=new URLSearchParams(String(window.location.hash||'').replace(/^#/,''));
 return {token:params.get('token')||params.get('token_hash')||'',email:String(params.get('email')||'').trim().toLowerCase(),invitationId:params.get('invite')||params.get('invitation')||'',role:params.get('role')||''};
}

export default function AdminInvitePage({navigate}){
 const [invite,setInvite]=useState(inviteFromHash),[password,setPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false);
 useEffect(()=>{
  document.title='Set up your admin account · DigiTrans Logistics';
  if(window.location.hash)window.history.replaceState({},'',`${window.location.pathname}${window.location.search}`);
 },[]);
 const submit=async event=>{
  event.preventDefault();setError('');
  if(!invite.token||!invite.email||!invite.invitationId){setError('This invitation link is incomplete. Ask a DigiTrans Super Administrator to send a fresh invite.');return;}
  if(password.length<12){setError('Use at least 12 characters for your administrator password.');return;}
  if(password!==confirmPassword){setError('The passwords do not match.');return;}
  setBusy(true);
  try{
   await api('/auth/accept-admin-invite',{method:'POST',body:{...invite,password,confirmPassword}});
   setInvite(value=>({...value,token:''}));setPassword('');setConfirmPassword('');setSuccess(true);
  }catch(err){setError(err.message||'We could not complete this invitation.');}
  finally{setBusy(false);}
 };
 const role=invite.role;
 return <main className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,#e4f3ee,transparent_45%),linear-gradient(135deg,#f7faf8,#edf3f0)] px-4 py-8 sm:px-6 sm:py-12">
  <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col">
   <header className="mb-10 flex items-center justify-between"><Brand onClick={()=>navigate('/')}/><button type="button" onClick={()=>navigate('/login')} className="text-xs font-semibold text-slate-500 transition hover:text-brand-800">Sign in instead</button></header>
   <div className="grid flex-1 items-center gap-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-14">
    <section className="hidden lg:block">
     <p className="text-[11px] font-bold uppercase tracking-[.18em] text-brand-700">Secure administrator onboarding</p>
     <h1 className="mt-4 max-w-[12ch] font-display text-5xl font-bold leading-[1.03] tracking-[-.055em] text-ink">Your team. Your access. Your password.</h1>
     <p className="mt-5 max-w-[46ch] text-sm leading-7 text-slate-600">DigiTrans admin access is assigned by position and permission. Create a password known only to you to finish joining the team.</p>
     <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-soft"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon name="shield" size={19}/></span><div><p className="text-xs font-bold text-ink">One-time secure invitation</p><p className="mt-1 text-[10px] text-slate-500">The invite link is personal and expires automatically.</p></div></div>
    </section>
    <section className="mx-auto w-full max-w-xl">
     <div className="mb-5 lg:hidden"><p className="text-[10px] font-bold uppercase tracking-[.17em] text-brand-700">Secure administrator onboarding</p><p className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Set up your admin access</p></div>
     <div className="rounded-[26px] border border-white bg-white/95 p-6 shadow-[0_28px_90px_rgba(17,48,53,.14)] sm:p-9">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-800"><Icon name={success?'check':'key'} size={22}/></div>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[.17em] text-brand-700">{success?'Invitation complete':'You’ve been invited'}</p>
      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">{success?'Your password is set.':'Choose a personal password.'}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{success?'Your administrator account is ready. Sign in to open your DigiTrans workspace.':'Create a password that only you know. Your assigned position and access are managed by DigiTrans.'}</p>
      {invite.email&&<div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2"><div><p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Invited email</p><p className="mt-1 break-all text-xs font-semibold text-ink">{invite.email}</p></div>{role&&<div><p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Position</p><p className="mt-1 text-xs font-semibold text-ink">{ADMIN_ROLE_LABELS[role]||role.replaceAll('_',' ')}</p></div>}</div>}
      {error&&<div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800"><Icon name="alert" size={15}/><span>{error}</span></div>}
      {success?<Button className="mt-6 w-full" onClick={()=>navigate('/login')}>Continue to sign in<Icon name="arrow" size={15}/></Button>:<form onSubmit={submit} className="mt-6 space-y-4">
       <Field label="New password" hint="At least 12 characters, with uppercase, lowercase, a number and a symbol." required><Input type="password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="new-password" minLength={12} maxLength={128} required/></Field>
       <Field label="Confirm password" required><Input type="password" value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={12} maxLength={128} required/></Field>
       <Button type="submit" loading={busy} className="w-full">Set my password<Icon name="arrow" size={15}/></Button>
       <p className="text-center text-[10px] leading-5 text-slate-400">If you were not expecting this invite, close this page and contact your DigiTrans administrator.</p>
      </form>}
     </div>
    </section>
   </div>
   <footer className="mt-10 text-center text-[10px] text-slate-400">DigiTrans Logistics · Secure administrator invitation</footer>
  </div>
 </main>;
}

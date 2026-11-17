import React,{useEffect,useRef,useState} from 'react';
import Icon from '../components/Icon';
import Brand from '../components/Brand';
import {Button,Card,Field,Input,Select} from '../components/UI';
import {api} from '../lib/api';

const roles=[['customer','Customer'],['student','Student'],['rider','Rider'],['vendor','Business / vendor'],['investor','Investor']];

export default function AuthPage({mode='login',navigate,onAuthenticated,initialRole='customer',resetToken='',resetEmail='',verificationEmail='',verificationToken=''}){
 const [kind,setKind]=useState(mode),[role,setRole]=useState(roles.some(r=>r[0]===initialRole)?initialRole:'customer'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(''),[verificationUrl,setVerificationUrl]=useState('');
 const verificationStarted=useRef(false);
 const params=new URLSearchParams(window.location.search);
 const next=params.get('next')||'/workspace';
 useEffect(()=>{document.title=`${kind==='register'?'Create an account':kind==='forgot'?'Reset your password':kind==='reset'?'Choose a new password':kind==='verify'?'Verify your email':'Sign in'} · DigiTrans Logistics`;},[kind]);
 useEffect(()=>{
  if(kind!=='verify'||verificationStarted.current)return;
  verificationStarted.current=true;
  let active=true;
  const params=new URLSearchParams(window.location.search),email=verificationEmail||params.get('email')||'',token=verificationToken||params.get('token')||params.get('token_hash')||'';
  if(!email||!token){setError('This verification link is incomplete. Request a new link or sign in.');setKind('login');return;}
  setBusy(true);setError('');
  api('/auth/verify-email',{method:'POST',body:{email,token}}).then(result=>{
   if(!active)return;
   if(result.pendingApproval){setSuccess(result.message);setKind('login');return;}
   onAuthenticated(result.user,next);
  }).catch(err=>{if(active){setError(err.message);setKind('login');}}).finally(()=>{if(active)setBusy(false);});
  return()=>{active=false;};
 },[kind,verificationEmail,verificationToken,onAuthenticated,next]);
 const heading={login:'Welcome back.',register:'Create your account.',forgot:'Reset your password.',reset:'Choose a new password.',verify:'Verify your email.'}[kind]||'Welcome back.';
 const subheading={login:'Sign in to continue to your DigiTrans workspace.',register:'A few details and you’re on your way.',forgot:'We’ll send recovery instructions if your account matches.',reset:'Set a new password to secure your account.',verify:'Confirm the email address on your DigiTrans account.'}[kind]||'Sign in to continue.';
 const switchKind=target=>{
  setError('');setSuccess('');
  if(target==='login')navigate(`/login?next=${encodeURIComponent(next)}`);
  else if(target==='register')navigate(`/register?role=${encodeURIComponent(role)}&next=${encodeURIComponent(next)}`);
  else if(target==='forgot')navigate(`/forgot-password?next=${encodeURIComponent(next)}`);
  else setKind(target);
 };
 const submit=async e=>{
  e.preventDefault();setBusy(true);setError('');setSuccess('');
  try{
   const form=Object.fromEntries(new FormData(e.currentTarget));
   if(kind==='login'){
    const out=await api('/auth/login',{method:'POST',body:{identifier:form.identifier,password:form.password}});onAuthenticated(out.user,next);return;
   }
   if(kind==='register'){
    const out=await api('/auth/register',{method:'POST',body:{...form,role,acceptedTerms:form.acceptedTerms==='on',fullName:form.fullName,email:form.email,phone:form.phone,password:form.password,confirmPassword:form.confirmPassword}});setSuccess(out.message);if(out.debugVerificationUrl)setVerificationUrl(out.debugVerificationUrl);return;
   }
   if(kind==='forgot'){
    const out=await api('/auth/forgot-password',{method:'POST',body:{identifier:form.identifier}});setSuccess(out.message);if(out.debugVerificationUrl)setVerificationUrl(out.debugVerificationUrl);return;
   }
   if(kind==='reset'){
    const token=resetToken||form.token;const email=resetEmail||form.email;const out=await api('/auth/reset-password',{method:'POST',body:{email,token,password:form.password,confirmPassword:form.confirmPassword}});setSuccess(out.message);setKind('login');return;
   }
  }catch(err){setError(err.message);}finally{setBusy(false);}
 };
 const formHeading=kind==='login'?'Sign in':kind==='register'?'Create an account':kind==='forgot'?'Send recovery instructions':kind==='verify'?'Verifying email…':'Update password';
 return <main className="min-h-screen bg-paper text-navy">
  <header className="relative z-10 border-b border-line bg-white"><div className="container-x flex h-[4.5rem] items-center justify-between gap-4"><Brand navigate={navigate}/><div className="flex items-center gap-3 text-[.8125rem]">{kind==='register'?<><span className="hidden text-muted sm:inline">Already have an account?</span><button type="button" onClick={()=>switchKind('login')} className="font-medium text-cyan hover:text-cyan-600">Sign in</button></>:<><span className="hidden text-muted sm:inline">Need help?</span><button type="button" onClick={()=>navigate('/contact')} className="font-medium text-navy hover:text-cyan">Contact support</button></>}</div></div></header>
  <div className="container-x grid min-h-[calc(100vh-4.5rem)] items-stretch gap-8 py-6 sm:py-10 lg:grid-cols-[.92fr_1.08fr] lg:gap-14 lg:py-12">
   <section className="auth-visual relative isolate min-h-[260px] overflow-hidden rounded-[14px] bg-navy text-white sm:min-h-[320px] lg:min-h-[620px]">
    <img src="/images/street-wide.jpg" alt="DigiTrans rider moving through Calabar" className="absolute inset-0 -z-20 h-full w-full object-cover object-[55%_58%]"/>
    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy/95 via-navy/80 to-navy/35"/><div className="absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full border border-white/15"/><div className="absolute -right-8 top-8 -z-10 h-48 w-48 rounded-full border border-white/10"/>
    <div className="flex h-full flex-col justify-between p-6 sm:p-9 lg:p-12"><div><p className="eyebrow eyebrow-light">DigiTrans workspace</p><h1 className="display-2 mt-4 max-w-[12ch] text-white">Every journey, in one place.</h1><p className="mt-4 max-w-[40ch] text-[.9375rem] leading-relaxed text-white/70">Follow deliveries, manage bookings and keep your service details close at hand.</p></div><div className="hidden space-y-3 border-t border-white/15 pt-6 sm:block">{['Your delivery history and live updates.','One secure workspace for your account.','Local support from the Calabar team.'].map((item,i)=><div key={item} className="flex items-center gap-3 text-[.8125rem] text-white/75"><span className="grid size-6 place-items-center rounded-full bg-cyan text-white"><Icon name="check" size={13}/></span><span>{item}</span></div>)}</div><div className="mt-6 flex items-center gap-2 text-[.75rem] text-white/55"><Icon name="pin" size={14} className="text-cyan-300"/>Calabar · Cross River State</div></div>
   </section>
   <section className="flex items-center justify-center py-4 lg:py-8"><div className="w-full max-w-[450px]">
    <div className="mb-6"><p className="eyebrow">Your DigiTrans account</p><h2 className="display-2 mt-2 text-navy">{heading}</h2><p className="mt-2 max-w-[44ch] text-[.875rem] leading-6 text-muted">{subheading}</p></div>
    {success&&<div className="mb-5 border-l-2 border-success bg-[#edf7f1] px-4 py-3 text-[.8125rem] leading-6 text-[#27684d]" role="status">{success}{verificationUrl&&<a className="mt-2 inline-flex font-semibold underline underline-offset-2" href={verificationUrl}>Continue with local verification link</a>}</div>}
    {error&&<div className="mb-5 flex gap-2 border-l-2 border-danger bg-[#fbf0ef] px-4 py-3 text-[.8125rem] leading-6 text-danger" role="alert"><Icon name="alert" size={16} className="mt-1"/>{error}</div>}
    <Card padding="p-5 sm:p-7" className="rounded-[14px] border-line shadow-card">
     {kind==='verify'?<div className="py-4 text-center text-sm text-muted" role="status">{busy?'Checking your email verification link…':'Email verification is complete.'}</div>:<form onSubmit={submit} className="space-y-4">
      {kind==='login'&&<><Field label="Email address" required><Input name="identifier" type="email" required autoComplete="username" placeholder="you@example.com"/></Field><Field label="Password" required><Input name="password" type="password" required autoComplete="current-password" placeholder="Enter your password"/></Field><div className="flex justify-end"><button type="button" className="text-[.8125rem] font-medium text-cyan hover:text-cyan-600" onClick={()=>switchKind('forgot')}>Forgot password?</button></div></>}
      {kind==='register'&&<><fieldset><legend className="mb-2 text-[.8125rem] font-medium text-navy">Choose an account type</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{roles.map(([value,label])=><button type="button" key={value} onClick={()=>setRole(value)} aria-pressed={role===value} className={`min-h-10 border px-2.5 py-2 text-[.75rem] font-medium transition ${role===value?'border-cyan bg-cyan/5 text-cyan ring-1 ring-cyan/20':'border-line-strong bg-white text-slate-ink hover:border-cyan/50'}`}>{label}</button>)}</div></fieldset><Field label="Full legal name" required><Input name="fullName" required minLength={2} maxLength={100} autoComplete="name" placeholder="Your full name"/></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Email address" required><Input name="email" type="email" required autoComplete="email" placeholder="you@example.com"/></Field><Field label="Phone number" required><Input name="phone" type="tel" required autoComplete="tel" minLength={8} placeholder="+234…"/></Field></div>{role==='vendor'&&<><Field label="Business name" required><Input name="businessName" required placeholder="The name customers know"/></Field><Field label="Business category"><Select name="category"><option>Restaurant</option><option>Eatery</option><option>Snack shop</option><option>Laundry</option><option>Pharmacy</option><option>Grocery store</option><option>Approved retailer</option></Select></Field></>}{role==='student'&&<div className="grid gap-4 sm:grid-cols-2"><Field label="Institution"><Input name="institution" placeholder="University / school"/></Field><Field label="Matric number"><Input name="matricNo" placeholder="Student ID number"/></Field></div>}<Field label="Password" hint="At least 8 characters with a letter and number." required><Input name="password" type="password" minLength={8} maxLength={128} required autoComplete="new-password" placeholder="Create a password"/></Field><Field label="Confirm password" required><Input name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" placeholder="Repeat your password"/></Field><label className="flex items-start gap-2.5 text-[.75rem] leading-5 text-muted"><input className="mt-1 accent-cyan" type="checkbox" name="acceptedTerms" required/><span>I agree to the <button type="button" onClick={()=>navigate('/terms')} className="font-medium text-cyan underline underline-offset-2">Terms</button> and <button type="button" onClick={()=>navigate('/privacy')} className="font-medium text-cyan underline underline-offset-2">Privacy Policy</button>.</span></label></>}
      {kind==='forgot'&&<><Field label="Email or phone number" required><Input name="identifier" required autoComplete="username" placeholder="you@example.com or +234…"/></Field><p className="text-[.75rem] leading-5 text-muted">If we find a matching account, we’ll send recovery instructions to the address or number on file.</p></>}
      {kind==='reset'&&<><input type="hidden" name="email" value={resetEmail}/><Field label="Recovery token" required><Input name="token" defaultValue={resetToken} required placeholder="Paste the token from your recovery message"/></Field><Field label="New password" required><Input name="password" type="password" required minLength={8} autoComplete="new-password"/></Field><Field label="Confirm new password" required><Input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password"/></Field></>}
      <Button type="submit" size="lg" className="mt-2 w-full !min-h-12" loading={busy} iconRight={kind==='login'?'arrow':'check'}>{busy?formHeading:formHeading}</Button>
     </form>}
    </Card>
    <div className="mt-5 text-center text-[.8125rem] text-slate-ink">{kind==='login'?<>New to DigiTrans? <button type="button" onClick={()=>switchKind('register')} className="font-semibold text-cyan hover:text-cyan-600">Create an account</button></>:kind==='register'?<>Already have a profile? <button type="button" onClick={()=>switchKind('login')} className="font-semibold text-cyan hover:text-cyan-600">Sign in</button></>:<button type="button" onClick={()=>switchKind('login')} className="inline-flex items-center gap-1.5 font-semibold text-cyan hover:text-cyan-600"><Icon name="arrow" size={14} className="rotate-180"/>Back to sign in</button>}</div>
    <p className="mt-7 flex items-center justify-center gap-2 text-[.6875rem] font-medium text-muted"><Icon name="shield" size={13}/>Secure sign-in · Private by role · Calabar, Nigeria</p>
    <p className="mt-8 text-center text-[.6875rem] text-muted">© {new Date().getFullYear()} DigiTrans Logistics Ltd.</p>
   </div></section>
  </div>
 </main>;
}

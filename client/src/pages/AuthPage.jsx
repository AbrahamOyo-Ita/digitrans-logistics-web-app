import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import Brand from '../components/Brand';
import { api } from '../lib/api';
import {PUBLIC_SIGNUP_ROLES} from '../../../shared/roles.js';

const roleLabels={customer:'Customer',student:'Student',rider:'Rider',vendor:'Business / Vendor',investor:'Investor'};
const roles=PUBLIC_SIGNUP_ROLES.map(value=>[value,roleLabels[value]]);

function GoogleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
  );
}

export default function AuthPage({
  mode = 'login',
  navigate,
  onAuthenticated,
  initialRole = 'customer',
  resetToken = '',
  resetEmail = '',
  verificationEmail = '',
  verificationToken = ''
}) {
  const [kind, setKind] = useState(mode);
  const [role, setRole] = useState(roles.some(r => r[0] === initialRole) ? initialRole : 'customer');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [verificationState, setVerificationState] = useState('checking');
  const [resendEmail, setResendEmail] = useState(verificationEmail);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const next = params.get('next') || '/workspace';

  const resendVerification = async () => {
    setResendBusy(true);
    setResendMessage('');
    try {
      const result = await api('/auth/resend-verification', { method: 'POST', body: { email: resendEmail.trim() } });
      setResendMessage(result.message);
    } catch (err) {
      setResendMessage(err.message);
    } finally {
      setResendBusy(false);
    }
  };

  useEffect(() => {
    document.title = `${
      kind === 'register'
        ? 'Join Us'
        : kind === 'forgot'
        ? 'Reset password'
        : kind === 'reset'
        ? 'New password'
        : kind === 'verify'
        ? 'Verify email'
        : 'Welcome back'
    } · DigiTrans Logistics`;
  }, [kind]);

  useEffect(() => {
    if (kind !== 'verify') return;
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    const p = new URLSearchParams(window.location.search);
    const email = verificationEmail || p.get('email') || '';
    const token = verificationToken || p.get('token') || p.get('token_hash') || '';
    if (!email || !token) {
      setVerificationState('error');
      setError('This verification link is incomplete. Request a new link or sign in.');
      return;
    }
    setBusy(true);
    setVerificationState('checking');
    setError('');
    api('/auth/verify-email', { method: 'POST', body: { email, token }, signal: controller.signal })
      .then(result => {
        if (!active) return;
        setVerificationState('success');
        if (result.pendingApproval) {
          setSuccess(result.message);
          return;
        }
        onAuthenticated(result.user, next);
      })
      .catch(err => {
        if (active) {
          setVerificationState('error');
          setError(err.name === 'AbortError' ? 'The verification service took too long to respond. Check your connection and try again.' : err.message);
        }
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setBusy(false);
      });
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [kind, verificationEmail, verificationToken, onAuthenticated, next, verificationAttempt]);

  const switchKind = target => {
    setError('');
    setSuccess('');
    if (target === 'login') navigate(`/login?next=${encodeURIComponent(next)}`);
    else if (target === 'register') navigate(`/register?role=${encodeURIComponent(role)}&next=${encodeURIComponent(next)}`);
    else if (target === 'forgot') navigate(`/forgot-password?next=${encodeURIComponent(next)}`);
    else setKind(target);
  };

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const form = Object.fromEntries(new FormData(e.currentTarget));
      if (kind === 'login') {
        const out = await api('/auth/login', {
          method: 'POST',
          body: { identifier: form.identifier, password: form.password }
        });
        onAuthenticated(out.user, next);
        return;
      }
      if (kind === 'register') {
        const out = await api('/auth/register', {
          method: 'POST',
          body: {
            ...form,
            role,
            acceptedTerms: form.acceptedTerms === 'on',
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            password: form.password,
            confirmPassword: form.confirmPassword
          }
        });
        setSuccess(out.message);
        if (out.debugVerificationUrl) setVerificationUrl(out.debugVerificationUrl);
        return;
      }
      if (kind === 'forgot') {
        const out = await api('/auth/forgot-password', {
          method: 'POST',
          body: { identifier: form.identifier }
        });
        setSuccess(out.message);
        if (out.debugVerificationUrl) setVerificationUrl(out.debugVerificationUrl);
        return;
      }
      if (kind === 'reset') {
        const token = resetToken || form.token;
        const email = resetEmail || form.email;
        const out = await api('/auth/reset-password', {
          method: 'POST',
          body: { email, token, password: form.password, confirmPassword: form.confirmPassword }
        });
        setSuccess(out.message);
        setKind('login');
        return;
      }
      } catch (err) {
      const fieldErrors = err?.details && typeof err.details === 'object'
        ? Object.values(err.details).flat().filter(Boolean)
        : [];
      setError(fieldErrors.length ? fieldErrors.join(' ') : err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleAuth = () => {
    setError('');
    setSuccess('Connecting to Google Single Sign-On… If this takes a moment, please sign in with your email or phone.');
  };

  return (
    <main className="min-h-[100dvh] w-full bg-[#f7f8f6] font-sans selection:bg-[#0e7c8b] selection:text-white">
      <div className="grid min-h-[100dvh] w-full lg:grid-cols-[minmax(420px,.92fr)_minmax(520px,1.08fr)]">
        
        {/* Left Column: Atmospheric Visual Hero with Glassmorphism */}
        <section className="relative isolate flex min-h-[430px] flex-col justify-between overflow-hidden bg-[#092a35] p-6 text-white sm:p-8 lg:min-h-[100dvh] lg:p-12">
          {/* Real Brand Photograph */}
          <img
            src="/images/street-wide.jpg"
            alt="DigiTrans logistics rider moving through Calabar"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[52%_48%] scale-105 filter brightness-[0.92] contrast-[1.08] transition-transform duration-1000 ease-out"
          />
          {/* Deep Navy/Cyan Gradient Overlay matching reference UI color grading */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#091e42]/94 via-[#103a82]/88 to-[#0a5872]/85 mix-blend-multiply" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#061225]/95 via-transparent to-[#0a2046]/60" />
          
          {/* Ambient Lighting Glows */}
          <div className="absolute -top-24 -left-24 -z-10 w-80 h-80 rounded-full bg-blue-400/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 -z-10 w-80 h-80 rounded-full bg-cyan-400/25 blur-3xl pointer-events-none" />

          {/* Top Brand Bar */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-3 group text-left transition-transform active:scale-95"
            >
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center p-1.5 shadow-md shadow-black/10 group-hover:scale-105 transition-all">
                <img
                  src="/images/Digitrans_App_Icon.jpeg"
                  alt="DigiTrans"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div>
                <div className="font-display font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
                  DigiTrans
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                </div>
                <div className="text-[11px] font-medium tracking-wide text-cyan-200/90">
                  Logistics & Delivery · Calabar
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white/90 hover:text-white transition-all backdrop-blur-md"
            >
              <Icon name="home" size={13} />
              <span className="hidden sm:inline">Back to site</span>
            </button>
          </div>

          {/* Center Copy with Pill Badge */}
          <div className="my-auto py-6 sm:py-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-sm mb-4">
              <span>{kind === 'login' ? 'Calabar Dispatch Desk ⚡' : 'Join Us to Build 🚀'}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.85rem] font-bold text-white tracking-tight leading-[1.15] mb-3">
              {kind === 'login'
                ? 'Welcome Back'
                : kind === 'register'
                ? 'Start your Journey'
                : kind === 'forgot'
                ? 'Account Recovery'
                : 'Reset Password'}
            </h1>
            <p className="text-sm sm:text-base text-white/85 max-w-[46ch] leading-relaxed">
              {kind === 'login'
                ? 'Follow every parcel in real time, manage waybills, and keep your business moving forward.'
                : 'Follow these simple steps to set up your account and plug into the fastest delivery network across Calabar.'}
            </p>
          </div>

          {/* Bottom 3 Step Cards matching the reference image layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Step 1: Active card */}
            <div className="rounded-2xl p-4 bg-white text-slate-900 shadow-xl transition-all">
              <div className="w-7 h-7 rounded-full bg-[#1d4ed8] text-white text-xs font-bold flex items-center justify-center mb-2.5 shadow-sm">
                1
              </div>
              <p className="font-semibold text-xs sm:text-[13px] leading-snug text-slate-900">
                {kind === 'login' ? 'Sign into account' : 'Register your account'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 hidden sm:block">
                {kind === 'login' ? 'Enter verified credentials' : 'Your basic credentials'}
              </p>
            </div>

            {/* Step 2: Frosted glass card */}
            <div className="rounded-2xl p-4 bg-white/15 backdrop-blur-md border border-white/20 text-white transition-all">
              <div className="w-7 h-7 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center mb-2.5">
                2
              </div>
              <p className="font-medium text-xs sm:text-[13px] leading-snug text-white/95">
                {kind === 'login' ? 'Live GPS Dispatch' : 'Set up your profile'}
              </p>
              <p className="text-[11px] text-white/70 mt-1 hidden sm:block">
                {kind === 'login' ? 'Track real-time riders' : 'Personal & role info'}
              </p>
            </div>

            {/* Step 3: Frosted glass card */}
            <div className="rounded-2xl p-4 bg-white/15 backdrop-blur-md border border-white/20 text-white transition-all">
              <div className="w-7 h-7 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center mb-2.5">
                3
              </div>
              <p className="font-medium text-xs sm:text-[13px] leading-snug text-white/95">
                {kind === 'login' ? 'Instant Waybills' : 'Verify your identity'}
              </p>
              <p className="text-[11px] text-white/70 mt-1 hidden sm:block">
                {kind === 'login' ? 'Automated manifests' : 'Phone / ID check'}
              </p>
            </div>
          </div>
        </section>

        {/* Right Column: Clean, Spacious, Minimalist Form */}
        <section className="flex max-h-[100dvh] flex-col justify-center overflow-y-auto bg-[#f7f8f6] px-5 py-10 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-[510px] py-2">
            
            {/* Header */}
            <div className="mb-6">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[.18em] text-[#0e7c8b]">DigiTrans account</p>
              <h2 className="text-left font-display text-3xl font-bold tracking-tight text-[#102a33] sm:text-4xl">
                {kind === 'login'
                  ? 'Welcome Back'
                  : kind === 'register'
                  ? 'Join Us'
                  : kind === 'forgot'
                  ? 'Reset Password'
                  : kind === 'reset'
                  ? 'New Password'
                  : 'Email Verification'}
              </h2>
              <p className="mt-2 max-w-[42ch] text-left text-sm leading-6 text-slate-500">
                {kind === 'login'
                  ? 'Please enter your account details to access your workspace.'
                  : kind === 'register'
                  ? 'Create an account to book and track deliveries across Calabar.'
                  : kind === 'forgot'
                  ? 'Enter your email or phone to receive recovery instructions.'
                  : 'Update your password to continue.'}
              </p>
            </div>

            {/* Alerts */}
            {success && (
              <div className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 text-xs sm:text-sm text-emerald-800 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="check" size={13} />
                </span>
                <div className="space-y-1">
                  <p>{success}</p>
                  {verificationUrl && (
                    <a
                      className="font-semibold text-emerald-900 underline underline-offset-2 block"
                      href={verificationUrl}
                    >
                      Click here to complete local verification
                    </a>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-200/80 p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="alert" size={13} />
                </span>
                <p>{error}</p>
              </div>
            )}

            {kind === 'verify' ? (
              <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,.08)] sm:p-8">
                <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-100/70 blur-2xl" />
                <div className="relative">
                  <div className={`mx-auto grid h-20 w-20 place-items-center rounded-3xl ${verificationState === 'error' ? 'bg-rose-50 text-rose-600' : verificationState === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-cyan-50 text-cyan-700'}`}>
                    {verificationState === 'checking' && <span className="relative grid h-10 w-10 place-items-center"><span className="absolute inset-0 animate-ping rounded-full bg-cyan-300/40" /><Icon name="mail" size={28} /></span>}
                    {verificationState === 'success' && <Icon name="check" size={30} />}
                    {verificationState === 'error' && <Icon name="alert" size={30} />}
                  </div>
                  <p className="mt-6 text-center text-[11px] font-bold uppercase tracking-[.18em] text-cyan-700">Secure account check</p>
                  <h3 className="mt-2 text-center font-display text-2xl font-bold tracking-tight text-[#102a33]">
                    {verificationState === 'checking' ? 'Confirming your email' : verificationState === 'success' ? 'Email confirmed' : 'We need another try'}
                  </h3>
                  <p className="mx-auto mt-3 max-w-[38ch] text-center text-sm leading-6 text-slate-500">
                    {verificationState === 'checking' ? 'We’re checking your secure link now. This usually takes a few seconds.' : verificationState === 'success' ? 'Your email is verified. Your DigiTrans account is ready for the next step.' : 'The verification service did not respond successfully. Your link is still safe to retry.'}
                  </p>
                  <div className="mx-auto mt-6 max-w-xs space-y-2">
                    {verificationState === 'checking' && <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/2 animate-[pulse_1.4s_ease-in-out_infinite] rounded-full bg-cyan-500" /></div>}
                    {verificationState === 'error' && <>
                      <button type="button" onClick={() => { setError(''); setVerificationAttempt(value => value + 1); }} className="w-full rounded-2xl bg-[#1d4ed8] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-[#1e40af]">Try verification again</button>
                      <div className="border-t border-slate-100 pt-4">
                        <label className="block text-left text-[11px] font-semibold text-slate-600">Need a fresh link?</label>
                        <input value={resendEmail} onChange={event => setResendEmail(event.target.value)} type="email" placeholder="you@example.com" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white" />
                        <button type="button" disabled={resendBusy || !resendEmail.trim()} onClick={resendVerification} className="mt-2 w-full rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50">{resendBusy ? 'Requesting a fresh link…' : 'Send me a new link'}</button>
                        {resendMessage && <p className="mt-2 text-left text-[11px] leading-5 text-slate-500">{resendMessage}</p>}
                      </div>
                    </>}
                    {(verificationState === 'error' || verificationState === 'success') && <button type="button" onClick={() => switchKind('login')} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Return to sign in</button>}
                  </div>
                  <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">Keep this window open while the secure check completes.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                
                {/* LOGIN FORM */}
                {kind === 'login' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Email address or Phone
                      </label>
                      <input
                        name="identifier"
                        type="text"
                        required
                        autoComplete="username"
                        placeholder="you@example.com or +234..."
                        className="w-full bg-[#f4f5f8] hover:bg-[#edeff2] focus:bg-white border border-transparent focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => switchKind('forgot')}
                          className="text-xs font-semibold text-[#1d4ed8] hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          placeholder="••••••••••••"
                          className="w-full bg-[#f4f5f8] hover:bg-[#edeff2] focus:bg-white border border-transparent focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                        >
                          <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* REGISTER FORM */}
                {kind === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Account type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {roles.map(([value, label]) => (
                          <button
                            type="button"
                            key={value}
                            onClick={() => setRole(value)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                              role === value
                                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-500/20'
                                : 'bg-[#f4f5f8] text-slate-600 hover:bg-slate-200/70'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {role === 'vendor' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Business name
                        </label>
                        <input
                          name="businessName"
                          type="text"
                          required
                          minLength={2}
                          maxLength={120}
                          placeholder="e.g. Calabar Fresh Foods"
                          className="w-full bg-[#f4f5f8] hover:bg-[#edeff2] focus:bg-white border border-transparent focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200"
                        />
                      </div>
                    )}

                    {role === 'student' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Institution <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <input
                          name="institution"
                          type="text"
                          maxLength={120}
                          placeholder="e.g. University of Calabar"
                          className="w-full bg-[#f4f5f8] hover:bg-[#edeff2] focus:bg-white border border-transparent focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Full Name
                      </label>
                      <input
                        name="fullName"
                        type="text"
                        required
                        minLength={2}
                        maxLength={100}
                        autoComplete="name"
                        placeholder="e.g. Juliet Johnson"
                        className="w-full bg-[#f4f5f8] hover:bg-[#edeff2] focus:bg-white border border-transparent focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Email address
                        </label>
                        <input
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          className="w-full bg-[#f4f5f8] hover:bg-[#edeff2] focus:bg-white border border-transparent focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Phone number
                        </label>
                        <input
                          name="phone"
                          type="tel"
                          required
                          autoComplete="tel"
                          minLength={8}
                          placeholder="+234 800 000 0000"
                          className="w-full bg-[#f4f5f8] hover:bg-[#edeff2] focus:bg-white border border-transparent focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          minLength={8}
                          maxLength={128}
                          required
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          className="w-full bg-[#f4f5f8] hover:bg-[#edeff2] focus:bg-white border border-transparent focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                        >
                          <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Confirm password
                      </label>
                      <div className="relative">
                        <input
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          minLength={8}
                          required
                          autoComplete="new-password"
                          placeholder="Repeat password"
                          className="w-full bg-[#f4f5f8] hover:bg-[#edeff2] focus:bg-white border border-transparent focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                        >
                          <Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} size={18} />
                        </button>
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 text-xs text-slate-600 pt-1 cursor-pointer">
                      <input
                        className="mt-0.5 accent-[#1d4ed8] rounded"
                        type="checkbox"
                        name="acceptedTerms"
                        required
                      />
                      <span>
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => navigate('/terms')}
                          className="font-medium text-[#1d4ed8] underline underline-offset-2"
                        >
                          Terms
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={() => navigate('/privacy')}
                          className="font-medium text-[#1d4ed8] underline underline-offset-2"
                        >
                          Privacy Policy
                        </button>
                        .
                      </span>
                    </label>
                  </>
                )}

                {/* FORGOT PASSWORD FORM */}
                {kind === 'forgot' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email or Phone number
                    </label>
                    <input
                      name="identifier"
                      required
                      autoComplete="username"
                      placeholder="you@example.com or +234..."
                      className="w-full bg-[#f4f5f8] hover:bg-[#edeff2] focus:bg-white border border-transparent focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      If we find an account that matches, we’ll dispatch recovery instructions immediately.
                    </p>
                  </div>
                )}

                {/* RESET PASSWORD FORM */}
                {kind === 'reset' && (
                  <>
                    <input type="hidden" name="email" value={resetEmail} />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Recovery token
                      </label>
                      <input
                        name="token"
                        defaultValue={resetToken}
                        required
                        placeholder="Paste the token from your message"
                        className="w-full bg-[#f4f5f8] hover:bg-[#edeff2] focus:bg-white border border-transparent focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        New password
                      </label>
                      <input
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="w-full bg-[#f4f5f8] hover:bg-[#edeff2] focus:bg-white border border-transparent focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Confirm password
                      </label>
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        autoComplete="new-password"
                        className="w-full bg-[#f4f5f8] hover:bg-[#edeff2] focus:bg-white border border-transparent focus:border-[#1d4ed8] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200"
                      />
                    </div>
                  </>
                )}

                {/* Primary Action Button (Matches Reference) */}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-4 rounded-2xl bg-[#1d4ed8] hover:bg-[#1e40af] active:scale-[0.99] text-white font-semibold text-base shadow-lg shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Processing…</span>
                    </span>
                  ) : (
                    kind === 'login'
                      ? 'Continue'
                      : kind === 'register'
                      ? 'Continue'
                      : kind === 'forgot'
                      ? 'Send Recovery Link'
                      : 'Update Password'
                  )}
                </button>

                {/* Toggle Link below Continue Button */}
                <div className="text-center text-xs sm:text-sm text-slate-600 pt-2">
                  {kind === 'login' ? (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchKind('register')}
                        className="font-semibold text-[#1d4ed8] hover:underline"
                      >
                        Join Us
                      </button>
                    </>
                  ) : kind === 'register' ? (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchKind('login')}
                        className="font-semibold text-[#1d4ed8] hover:underline"
                      >
                        Log in
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchKind('login')}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#1d4ed8] hover:underline"
                    >
                      <Icon name="arrow" size={13} className="rotate-180" />
                      Back to sign in
                    </button>
                  )}
                </div>

                {/* 'Or' Divider */}
                <div className="relative flex items-center justify-center my-6">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-xs font-medium text-slate-400 uppercase tracking-wider absolute">
                    Or
                  </span>
                </div>

                {/* Sign up/in with Google (Matches Reference) */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full py-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white font-medium text-slate-700 text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <GoogleIcon className="w-4 h-4" />
                  <span>{kind === 'register' ? 'Sign up with Google' : 'Sign in with Google'}</span>
                </button>

                {/* Terms and Privacy Footnote */}
                <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-2">
                  By continuing, you confirm that you carefully have read and agree to the DigiTrans{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/privacy')}
                    className="text-slate-600 underline hover:text-[#1d4ed8]"
                  >
                    Privacy Policy
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/terms')}
                    className="text-slate-600 underline hover:text-[#1d4ed8]"
                  >
                    Terms of Service
                  </button>
                  .
                </p>
              </form>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}

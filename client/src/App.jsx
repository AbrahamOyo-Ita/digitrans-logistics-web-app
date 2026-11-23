import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { api } from './lib/api';
import { applyDocumentHead } from './seo/headManager';
import PublicSite from './pages/PublicSite';
import { ConnectionNotice, Loading, PwaInstallPrompt, Toast } from './components/UI';
import { getRoleHome, isWorkspacePath, ROLE_PREFIX } from '../../shared/roles.js';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const AdminInvitePage = lazy(() => import('./pages/AdminInvitePage'));
const Workspace = lazy(() => import('./pages/Workspace'));

const readLocation = () => ({
  pathname: typeof window !== 'undefined' ? window.location.pathname || '/' : '/',
  search: typeof window !== 'undefined' ? window.location.search : '',
  hash: typeof window !== 'undefined' ? window.location.hash : '',
});
const pathWithQuery = (loc) => `${loc.pathname}${loc.search}${loc.hash}`;
const safePath = (target) => {
  if (typeof window === 'undefined') return String(target || '/');
  try {
    const url = new URL(target, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : '/';
  } catch {
    return '/';
  }
};
const roleHome = (user) => getRoleHome(user?.role);

export default function App({ initialPathname = null, initialSearch = '' }) {
  const [location, setLocation] = useState(() =>
    initialPathname ? { pathname: initialPathname, search: initialSearch, hash: '' } : readLocation(),
  );
  const [user, setUser] = useState(null);
  const [authState, setAuthState] = useState('loading');
  const [toast, setToast] = useState(null);

  const navigate = useCallback((target, options = {}) => {
    if (typeof window === 'undefined') return;
    const next = safePath(target);
    if (options.replace) window.history.replaceState({}, '', next);
    else if (pathWithQuery(readLocation()) !== next) window.history.pushState({}, '', next);
    setLocation(readLocation());
    const hash = new URL(next, window.location.origin).hash;
    if (hash) {
      setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
    } else if (readLocation().pathname !== new URL(next, window.location.origin).pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const showToast = useCallback((value) => {
    const next = typeof value === 'string' ? { title: value } : value || {};
    setToast({ ...next, id: Date.now() });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const pop = () => setLocation(readLocation());
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let live = true;
    api('/auth/me')
      .then((d) => {
        if (live) {
          setUser(d.user || null);
          setAuthState('ready');
        }
      })
      .catch(() => {
        if (live) {
          setUser(null);
          setAuthState('ready');
        }
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (authState !== 'ready' || typeof window === 'undefined') return;
    const cleanPath = location.pathname.replace(/\/+$/, '') || '/';
    const isProtected = isWorkspacePath(cleanPath);
    if (isProtected && !user) {
      navigate(`/login?next=${encodeURIComponent(pathWithQuery(location))}`, { replace: true });
      return;
    }
    if (cleanPath === '/app-shell') {
      navigate(user ? roleHome(user) : '/login?next=%2Fworkspace', { replace: true });
      return;
    }
    if (user && cleanPath === '/workspace') {
      navigate(roleHome(user), { replace: true });
      return;
    }
    if (user && (cleanPath === '/login' || cleanPath === '/register' || cleanPath === '/forgot-password' || cleanPath === '/reset-password')) {
      navigate(roleHome(user), { replace: true });
      return;
    }
    if (user && isProtected) {
      const required = ROLE_PREFIX[user.role];
      if (required && !cleanPath.startsWith(required)) {
        navigate(roleHome(user), { replace: true });
      }
    }
  }, [authState, location, user, navigate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cleanPath = location.pathname.replace(/\/+$/, '') || '/';
    const isAuthOrInvite = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/verify', '/admin/invite'].includes(cleanPath);
    if (isAuthOrInvite || isWorkspacePath(cleanPath)) {
      applyDocumentHead({ pathname: cleanPath, search: location.search || '', robotsOverride: 'noindex, nofollow' });
    }
  }, [location.pathname, location.search]);

  const onLogin = (target) => {
    const safe = safePath(target || '/workspace');
    if (safe === '/workspace' || safe.startsWith('/register?') || safe === '/register') {
      navigate(safe === '/workspace' ? '/login?next=%2Fworkspace' : safe);
    } else {
      navigate(`/login?next=${encodeURIComponent(safe)}`);
    }
  };

  const onAuthenticated = useCallback((authenticatedUser, target = '/workspace') => {
    setUser(authenticatedUser);
    setAuthState('ready');
    let next = safePath(target || '/workspace');
    if (next === '/workspace' || next.startsWith('/workspace?')) next = roleHome(authenticatedUser);
    else if (typeof window !== 'undefined' && isWorkspacePath(new URL(next, window.location.origin).pathname)) {
      const routePath = new URL(next, window.location.origin).pathname;
      const expected = ROLE_PREFIX[authenticatedUser?.role];
      if (expected && !routePath.startsWith(expected)) next = roleHome(authenticatedUser);
    }
    navigate(next, { replace: true });
    showToast({
      title: 'You’re signed in',
      message: `Welcome to your ${authenticatedUser?.role?.replaceAll('_', ' ')} workspace.`,
    });
  }, [navigate, showToast]);

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    setAuthState('ready');
    navigate('/', { replace: true });
    showToast({ title: 'Signed out', message: 'Your session has been closed.' });
  };

  const path = location.pathname.replace(/\/+$/, '') || '/';
  const search = new URLSearchParams(location.search);
  const authMode =
    path === '/register'
      ? 'register'
      : path === '/forgot-password'
        ? 'forgot'
        : path === '/reset-password'
          ? 'reset'
          : path === '/auth/verify'
            ? 'verify'
            : 'login';
  const isAdminInvite = path === '/admin/invite';
  const isAuth = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/verify'].includes(path);
  const workspace = isWorkspacePath(path);
  const isDashboard = !!user && path === roleHome(user);

  let view;
  if (authState === 'loading' && workspace) {
    view = (
      <div className="min-h-screen bg-[#f6f8f6]">
        <Loading label="Restoring your secure session…" />
      </div>
    );
  } else if (workspace && !user) {
    view = (
      <div className="min-h-screen bg-[#f6f8f6]">
        <Loading label="Opening sign-in…" />
      </div>
    );
  } else if (user && isAuth && path !== '/auth/verify') {
    view = (
      <div className="min-h-screen bg-[#f6f8f6]">
        <Loading label="Opening your workspace…" />
      </div>
    );
  } else if (workspace && user) {
    view = (
      <Suspense fallback={<div className="min-h-screen bg-[#f6f8f6]"><Loading label="Loading workspace…" /></div>}>
        <Workspace key={user.id} user={user} navigate={navigate} onLogout={logout} showToast={showToast} locationSearch={location.search} />
      </Suspense>
    );
  } else if (isAdminInvite) {
    view = (
      <Suspense fallback={<div className="min-h-screen bg-[#f6f8f6]"><Loading label="Loading invitation…" /></div>}>
        <AdminInvitePage key={`${path}${location.hash}`} navigate={navigate} />
      </Suspense>
    );
  } else if (isAuth) {
    view = (
      <Suspense fallback={<div className="min-h-screen bg-[#f6f8f6]"><Loading label="Loading sign-in…" /></div>}>
        <AuthPage
          key={`${path}${location.search}`}
          mode={authMode}
          navigate={navigate}
          onAuthenticated={onAuthenticated}
          initialRole={search.get('role') || 'customer'}
          resetToken={search.get('token') || ''}
          resetEmail={search.get('email') || ''}
          verificationEmail={search.get('email') || ''}
          verificationToken={search.get('token') || search.get('token_hash') || ''}
        />
      </Suspense>
    );
  } else {
    view = <PublicSite key={path} page={path} navigate={navigate} onLogin={onLogin} user={user} />;
  }

  return (
    <>
      {view}
      <PwaInstallPrompt active={isDashboard} />
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ConnectionNotice />
    </>
  );
}

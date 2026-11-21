import React,{useCallback,useEffect,useState} from 'react';
import {api} from './lib/api';
import PublicSite from './pages/PublicSite';
import AuthPage from './pages/AuthPage';
import Workspace from './pages/Workspace';
import {ConnectionNotice,Loading,Toast} from './components/UI';
import {getRoleHome,isWorkspacePath,ROLE_PREFIX} from '../../shared/roles.js';

const readLocation=()=>({pathname:window.location.pathname||'/',search:window.location.search,hash:window.location.hash});
const pathWithQuery=loc=>`${loc.pathname}${loc.search}${loc.hash}`;
const safePath=(target)=>{
 try{const url=new URL(target,window.location.origin);return url.origin===window.location.origin?`${url.pathname}${url.search}${url.hash}`:'/';}catch{return '/';}
};
const roleHome=user=>getRoleHome(user?.role);

export default function App(){
 const [location,setLocation]=useState(readLocation),[user,setUser]=useState(null),[authState,setAuthState]=useState('loading'),[toast,setToast]=useState(null);
 const navigate=useCallback((target,options={})=>{
  const next=safePath(target);if(options.replace)window.history.replaceState({},'',next);else if(pathWithQuery(readLocation())!==next)window.history.pushState({},'',next);
  setLocation(readLocation());
  const hash=new URL(next,window.location.origin).hash;
  if(hash)setTimeout(()=>document.querySelector(hash)?.scrollIntoView({behavior:'smooth',block:'start'}),40);
  else if(readLocation().pathname!==new URL(next,window.location.origin).pathname)window.scrollTo({top:0,behavior:'smooth'});
 },[]);
 const showToast=useCallback((value)=>{
  const next=typeof value==='string'?{title:value}:value||{};setToast({...next,id:Date.now()});
 },[]);
 useEffect(()=>{const pop=()=>setLocation(readLocation());window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);},[]);
 useEffect(()=>{let live=true;api('/auth/me').then(d=>{if(live){setUser(d.user||null);setAuthState('ready');}}).catch(()=>{if(live){setUser(null);setAuthState('ready');}});return()=>{live=false};},[]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(null),4500);return()=>clearTimeout(timer);},[toast]);
 useEffect(()=>{
  if(authState!=='ready')return;
  const cleanPath=location.pathname.replace(/\/+$/,'')||'/';
  const isProtected=isWorkspacePath(cleanPath);
  if(isProtected&&!user){navigate(`/login?next=${encodeURIComponent(pathWithQuery(location))}`,{replace:true});return;}
  if(user&&cleanPath==='/workspace'){navigate(roleHome(user),{replace:true});return;}
  if(user&&(cleanPath==='/login'||cleanPath==='/register'||cleanPath==='/forgot-password'||cleanPath==='/reset-password')){navigate(roleHome(user),{replace:true});return;}
  if(user&&isProtected){
   const required=ROLE_PREFIX[user.role];
   if(required&&!cleanPath.startsWith(required)){navigate(roleHome(user),{replace:true});return;}
  }
 },[authState,location,user,navigate]);
 const onLogin=target=>{
  const safe=safePath(target||'/workspace');
  if(safe==='/workspace'||safe.startsWith('/register?')||safe==='/register')navigate(safe==='/workspace'?'/login?next=%2Fworkspace':safe);
  else navigate(`/login?next=${encodeURIComponent(safe)}`);
 };
 const onAuthenticated=(authenticatedUser,target='/workspace')=>{
  setUser(authenticatedUser);setAuthState('ready');
  let next=safePath(target||'/workspace');
  if(next==='/workspace'||next.startsWith('/workspace?'))next=roleHome(authenticatedUser);
  else if(isWorkspacePath(new URL(next,window.location.origin).pathname)){
   const routePath=new URL(next,window.location.origin).pathname,expected=ROLE_PREFIX[authenticatedUser?.role];
   if(expected&&!routePath.startsWith(expected))next=roleHome(authenticatedUser);
  }
  navigate(next,{replace:true});showToast({title:'You’re signed in',message:`Welcome to your ${authenticatedUser?.role?.replaceAll('_',' ')} workspace.`});
 };
 const logout=async()=>{try{await api('/auth/logout',{method:'POST'});}catch{}setUser(null);setAuthState('ready');navigate('/',{replace:true});showToast({title:'Signed out',message:'Your session has been closed.'});};
 const path=location.pathname.replace(/\/+$/,'')||'/';
 const search=new URLSearchParams(location.search);const authMode=path==='/register'?'register':path==='/forgot-password'?'forgot':path==='/reset-password'?'reset':path==='/auth/verify'?'verify':'login';
 const isAuth=['/login','/register','/forgot-password','/reset-password','/auth/verify'].includes(path);
 const workspace=isWorkspacePath(path);
 let view;
 if(authState==='loading'&&workspace)view=<div className="min-h-screen bg-[#f6f8f6]"><Loading label="Restoring your secure session…"/></div>;
 else if(workspace&&!user)view=<div className="min-h-screen bg-[#f6f8f6]"><Loading label="Opening sign-in…"/></div>;
 else if(user&&isAuth&&path!=='/auth/verify')view=<div className="min-h-screen bg-[#f6f8f6]"><Loading label="Opening your workspace…"/></div>;
 else if(workspace&&user)view=<Workspace key={user.id} user={user} navigate={navigate} onLogout={logout} showToast={showToast}/>;
 else if(isAuth)view=<AuthPage key={`${path}${location.search}`} mode={authMode} navigate={navigate} onAuthenticated={onAuthenticated} initialRole={search.get('role')||'customer'} resetToken={search.get('token')||''} resetEmail={search.get('email')||''} verificationEmail={search.get('email')||''} verificationToken={search.get('token')||search.get('token_hash')||''}/>;
 else view=<PublicSite key={path} page={path} navigate={navigate} onLogin={onLogin} user={user}/>;
 return <>{view}<Toast toast={toast} onClose={()=>setToast(null)}/><ConnectionNotice/></>;
}

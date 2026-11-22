import {ROLE_PREFIX} from './roles.js';

const PAGE_KEY=/^[a-z][a-z0-9-]*$/;

export function workspacePath(role,page='overview',query={}){
 const prefix=ROLE_PREFIX[role]||'/ops';
 const key=String(page||'overview').trim();
 if(key!=='overview'&&!PAGE_KEY.test(key))throw new Error('Workspace page must be a safe page key.');
 const base=key==='overview'?prefix:`${prefix}/${key}`;
 const params=new URLSearchParams();
 for(const [name,value] of Object.entries(query||{})){
  if(!/^[a-z][a-zA-Z0-9_-]*$/.test(name)||value===null||value===undefined||value==='')continue;
  params.set(name,String(value));
 }
 const queryString=params.toString();
 return queryString?`${base}?${queryString}`:base;
}

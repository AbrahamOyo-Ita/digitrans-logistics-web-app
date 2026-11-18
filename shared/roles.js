export const APP_ROLES=Object.freeze([
  'customer','student','rider','vendor','investor',
  'ops_officer','rider_manager','vendor_manager','finance_officer','investment_manager','super_admin',
]);

export const PUBLIC_SIGNUP_ROLES=Object.freeze(['customer','student','rider','vendor','investor']);

export const ROLE_HOME=Object.freeze({
  customer:'/customer',student:'/customer',rider:'/rider',vendor:'/vendor',investor:'/investor',
  ops_officer:'/ops',rider_manager:'/ops',vendor_manager:'/ops',finance_officer:'/ops',investment_manager:'/ops',super_admin:'/ops',
});

export const ROLE_PREFIX=ROLE_HOME;

export function getRoleHome(role){return ROLE_HOME[role]||'/';}

export function isSupportedRole(role){return APP_ROLES.includes(role);}

export function isWorkspacePath(path){
 return path==='/workspace'||['/customer','/rider','/vendor','/investor','/ops'].some(prefix=>path===prefix||path.startsWith(`${prefix}/`));
}

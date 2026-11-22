export const PERMISSION_DEPENDENCIES=Object.freeze({
  'deliveries.assign':Object.freeze(['deliveries.read']),
  'deliveries.update':Object.freeze(['deliveries.read']),
  'pricing.manage':Object.freeze(['pricing.read']),
  'finance.manage':Object.freeze(['finance.read']),
  'investments.manage':Object.freeze(['investments.read']),
  'accounts.suspend':Object.freeze(['users.read']),
  'users.manage':Object.freeze(['users.read']),
  'settings.manage':Object.freeze(['pricing.read']),
});

export function normalizePermissionKeys(keys=[]){
  const result=new Set((Array.isArray(keys)?keys:[]).map(key=>String(key||'').trim()).filter(Boolean));
  let changed=true;
  while(changed){
    changed=false;
    for(const [permission,dependencies] of Object.entries(PERMISSION_DEPENDENCIES)){
      if(result.has(permission))for(const dependency of dependencies)if(!result.has(dependency)){result.add(dependency);changed=true;}
    }
  }
  return [...result].sort();
}

export function missingPermissionDependencies(keys=[]){
  const grants=new Set((Array.isArray(keys)?keys:[]).map(key=>String(key||'').trim()));
  return Object.entries(PERMISSION_DEPENDENCIES).flatMap(([permission,dependencies])=>
    grants.has(permission)?dependencies.filter(dependency=>!grants.has(dependency)).map(dependency=>({permission,dependency})):[],
  );
}

export function removePermissionAndDependents(keys=[],removedKey){
  const result=new Set((Array.isArray(keys)?keys:[]).map(key=>String(key||'').trim()).filter(Boolean));
  result.delete(String(removedKey||''));
  let changed=true;
  while(changed){
    changed=false;
    for(const [permission,dependencies] of Object.entries(PERMISSION_DEPENDENCIES)){
      if(result.has(permission)&&dependencies.some(dependency=>!result.has(dependency))){result.delete(permission);changed=true;}
    }
  }
  return [...result].sort();
}

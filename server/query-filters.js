export function isValidIsoDate(value){
  if(!value)return true;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const parsed=new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
}

export function parseDateRange(query={}){
  const from=String(query?.from||'').trim();
  const to=String(query?.to||'').trim();
  if(!isValidIsoDate(from)||!isValidIsoDate(to)){
    throw Object.assign(new Error('Use valid YYYY-MM-DD dates for date filters.'),{status:400});
  }
  if(from&&to&&from>to){
    throw Object.assign(new Error('The start date must be on or before the end date.'),{status:400});
  }
  return {from:from||null,to:to||null};
}

export function parsePagination(query={},{defaultLimit=50,maxLimit=100}={}){
  const rawPage=Number.parseInt(String(query?.page??'1'),10);
  const rawLimit=Number.parseInt(String(query?.limit??String(defaultLimit)),10);
  const page=Math.min(10000,Math.max(1,Number.isFinite(rawPage)?rawPage:1));
  const limit=Math.min(maxLimit,Math.max(1,Number.isFinite(rawLimit)?rawLimit:defaultLimit));
  return {page,limit,offset:(page-1)*limit};
}

export function parseSearchQuery(value,maxLength=80){
  const trimmed=String(value||'').trim().slice(0,maxLength);
  return trimmed?`%${trimmed}%`:null;
}

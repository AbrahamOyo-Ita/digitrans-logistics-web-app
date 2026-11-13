function validInternationalDigits(digits){return digits.length>=8&&digits.length<=15;}

export function normalizePhoneNumber(value){
  const raw=String(value||'').trim();
  let digits=raw.replace(/\D/g,'');
  if(!digits)return '';
  if(raw.startsWith('+'))return validInternationalDigits(digits)?`+${digits}`:'';
  if(digits.startsWith('00')){
    digits=digits.slice(2);
    return validInternationalDigits(digits)?`+${digits}`:'';
  }
  if(digits.startsWith('0')&&digits.length===11)return `+234${digits.slice(1)}`;
  if(digits.startsWith('234')&&digits.length===13)return `+${digits}`;
  if(digits.length===10)return `+234${digits}`;
  if(validInternationalDigits(digits))return `+${digits}`;
  return '';
}

export function phoneNumberCandidates(value){
  const normalized=normalizePhoneNumber(value);
  if(!normalized)return [];
  const digits=normalized.replace(/\D/g,'');
  const candidates=new Set([digits]);
  if(digits.startsWith('234')&&digits.length===13){
    candidates.add(`0${digits.slice(3)}`);
    candidates.add(digits.slice(3));
  }
  return [...candidates];
}

function sqlColumn(value){
  const name=String(value||'');
  if(!/^[a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9_]*)*$/i.test(name))throw new TypeError('Account lookup columns must be trusted SQL identifiers.');
  return name;
}

export function buildUserIdentifierPredicate(identifier,{emailColumn='email',phoneColumn='phone'}={}){
  emailColumn=sqlColumn(emailColumn);phoneColumn=sqlColumn(phoneColumn);
  const value=String(identifier||'').trim();
  if(!value)throw new TypeError('Enter an email address or phone number.');
  if(value.includes('@'))return {sql:`lower(${emailColumn})=?`,params:[value.toLowerCase()]};
  const candidates=phoneNumberCandidates(value);
  if(!candidates.length)throw new TypeError('Enter a valid email address or phone number.');
  const placeholders=candidates.map(()=>'?').join(',');
  return {
    sql:`regexp_replace(COALESCE(${phoneColumn},''),'[^0-9]','','g') IN (${placeholders})`,
    params:candidates,
  };
}

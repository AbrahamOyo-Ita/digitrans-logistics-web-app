import {closePostgres,execute,queryMany,queryOne,withTransaction} from './postgres.js';

function translateSql(sql){
  const text=String(sql);
  let result='',parameter=0,state='normal';
  for(let i=0;i<text.length;i++){
    const ch=text[i],next=text[i+1];
    if(state==='single'){
      result+=ch;
      if(ch==="'"&&next==="'"){result+=next;i++;continue;}
      if(ch==="'")state='normal';
      continue;
    }
    if(state==='double'){
      result+=ch;
      if(ch==='"'&&next==='"'){result+=next;i++;continue;}
      if(ch==='"')state='normal';
      continue;
    }
    if(state==='line-comment'){
      result+=ch;if(ch==='\n')state='normal';continue;
    }
    if(state==='block-comment'){
      result+=ch;
      if(ch==='*'&&next==='/'){result+=next;i++;state='normal';}
      continue;
    }
    if(ch==="'"){state='single';result+=ch;continue;}
    if(ch==='"'){state='double';result+=ch;continue;}
    if(ch==='-'&&next==='-'){state='line-comment';result+=ch+next;i++;continue;}
    if(ch==='/'&&next==='*'){state='block-comment';result+=ch+next;i++;continue;}
    if(ch==='?'){parameter++;result+=`$${parameter}`;continue;}
    result+=ch;
  }
  return result;
}
function valuesOf(args){
  const values=args.length===1&&Array.isArray(args[0])?args[0]:args;
  // Application flags are stored as SMALLINTs to keep the legacy API's 0/1 contract.
  return values.map(value=>typeof value==='boolean'?(value?1:0):value);
}

const db={
  prepare(sql){
    const text=translateSql(sql);
    return {
      get:async(...args)=>queryOne(text,valuesOf(args)),
      all:async(...args)=>queryMany(text,valuesOf(args)),
      run:async(...args)=>{
        const result=await execute(text,valuesOf(args));
        return {changes:result.rowCount,lastInsertRowid:null,rows:result.rows};
      },
    };
  },
  transaction(fn,options){
    if(typeof fn!=='function')throw new TypeError('db.transaction requires a callback.');
    return (...args)=>withTransaction(()=>fn(...args),options);
  },
  close:closePostgres,
};

export {translateSql};
export default db;

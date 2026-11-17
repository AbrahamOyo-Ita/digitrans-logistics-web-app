import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from '@babel/parser';
import {PGlite} from '@electric-sql/pglite';
import {translateSql} from './db.js';

const root=fileURLToPath(new URL('..',import.meta.url));
const migrationFiles=[
  'supabase/migrations/202611160001_initial_schema.sql',
  'supabase/migrations/202611160002_payment_atomicity.sql',
];

async function newSchema(){
  const db=new PGlite();
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
      AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets(
      id text PRIMARY KEY,name text NOT NULL,public boolean NOT NULL DEFAULT false,
      file_size_limit bigint,allowed_mime_types text[]
    );
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text NOT NULL,name text NOT NULL);
  `);
  for(const file of migrationFiles)await db.exec(await fs.readFile(path.join(root,file),'utf8'));
  return db;
}

function resolveSql(node,source){
  if(!node)return null;
  if(node.type==='StringLiteral')return node.value;
  if(node.type==='TemplateLiteral'){
    let sql='';
    for(let i=0;i<node.quasis.length;i++){
      sql+=node.quasis[i].value.cooked;
      if(i<node.expressions.length){
        const expression=node.expressions[i],raw=source.slice(expression.start,expression.end);
        if(raw==='table')sql+='rider_documents';
        else if(raw==='ownerColumn')sql+='rider_id';
        else sql+='?';
      }
    }
    return sql;
  }
  if(node.type==='BinaryExpression'&&node.operator==='+'){
    const left=resolveSql(node.left,source),right=resolveSql(node.right,source);
    return left===null||right===null?null:left+right;
  }
  if(node.type==='CallExpression'&&node.callee?.type==='MemberExpression'&&node.callee.property?.name==='join')return '?';
  return null;
}

function walk(node,callback){
  if(!node||typeof node!=='object')return;
  callback(node);
  for(const value of Object.values(node)){
    if(Array.isArray(value))value.forEach(child=>walk(child,callback));
    else if(value&&typeof value==='object')walk(value,callback);
  }
}
async function collectQueries(){
  const files=[];
  async function scan(directory){
    for(const entry of await fs.readdir(directory,{withFileTypes:true})){
      const full=path.join(directory,entry.name);
      if(entry.isDirectory())await scan(full);
      else if(entry.name.endsWith('.js')&&!entry.name.endsWith('.test.js'))files.push(full);
    }
  }
  await scan(path.join(root,'server'));
  const queries=[];
  for(const file of files){
    const source=await fs.readFile(file,'utf8');
    const ast=parse(source,{sourceType:'module',plugins:['jsx']});
    walk(ast,node=>{
      if(node.type!=='CallExpression'||node.callee?.type!=='MemberExpression'||node.callee.property?.name!=='prepare'||node.callee.object?.name!=='db')return;
      const sql=resolveSql(node.arguments?.[0],source);
      if(sql&&/\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(sql))queries.push({file:path.relative(root,file),line:node.loc.start.line,sql});
    });
  }
  const unique=new Map();
  for(const query of queries){const sql=translateSql(query.sql);if(!unique.has(sql))unique.set(sql,query);}
  return {queries,unique};
}

test('static and controlled dynamic route SQL prepares against the versioned PostgreSQL schema',async t=>{
  const db=await newSchema();t.after(()=>db.close());
  const {queries,unique}=await collectQueries();
  assert.ok(queries.length>=380,`expected broad route query coverage, found ${queries.length}`);
  assert.ok(unique.size>=320,`expected broad unique-query coverage, found ${unique.size}`);
  const failures=[];let index=0;
  for(const [sql,source] of unique){
    try{await db.query(`PREPARE digitrans_route_${++index} AS ${sql}`);}
    catch(error){failures.push(`${source.file}:${source.line}: ${error.message}\n${sql}`);}
  }
  assert.deepEqual(failures,[]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {authError,verificationError,resolveLoginEmail,userHasPermission,requirePermission,requireAnyPermission,acceptAdminInvitation} from './auth.js';
import {closePostgres,configurePostgresForTests} from './postgres.js';
import {APP_ROLES,PUBLIC_SIGNUP_ROLES,ROLE_HOME,isWorkspacePath} from '../shared/roles.js';

test('every supported DigiTrans account role has a protected workspace destination',()=>{
  assert.deepEqual(Object.keys(ROLE_HOME).sort(),[...APP_ROLES].sort());
  assert.deepEqual([...PUBLIC_SIGNUP_ROLES].sort(),['customer','investor','rider','student','vendor']);
  for(const [role,path] of Object.entries(ROLE_HOME)){
    assert.ok(path.startsWith('/'),`${role} should have a local workspace path`);
    assert.equal(isWorkspacePath(path),true,`${role} destination should be protected`);
  }
  assert.equal(isWorkspacePath('/'),false);
  assert.equal(isWorkspacePath('/ops/finance'),true);
});

test('Supabase sign-in errors return useful credential, verification and retry statuses',()=>{
  const invalid=authError({status:400,code:'invalid_credentials'});
  assert.equal(invalid.status,401);
  assert.match(invalid.message,/sign-in details are incorrect/i);
  const unverified=authError({status:400,code:'email_not_confirmed'});
  assert.equal(unverified.status,403);
  assert.match(unverified.message,/verify your email/i);
  assert.equal(authError({status:429}).status,429);
  assert.equal(authError({status:503}).status,503);
});

test('verification token failures are reported as expired links, not outages',()=>{
  const expired=verificationError({status:403,code:'otp_expired'});
  assert.equal(expired.status,400);
  assert.match(expired.message,/verification link is invalid or has expired/i);
  assert.equal(verificationError({status:503}).status,503);
});

test('login identity resolves email and phone inputs to the same account email',async()=>{
  const calls=[];
  const lookup=async predicate=>{
    calls.push(predicate);
    return {email:'person@example.test'};
  };
  assert.equal(await resolveLoginEmail(' PERSON@example.test ',lookup),'person@example.test');
  assert.equal(await resolveLoginEmail('0801 234 5678',lookup),'person@example.test');
  assert.equal(calls[0].sql,'lower(email)=?');
  assert.equal(calls[0].params[0],'person@example.test');
  assert.match(calls[1].sql,/regexp_replace/);
  assert.deepEqual(calls[1].params,['2348012345678','08012345678','8012345678']);
});

test('login never reveals whether an unknown email or phone has an account',async()=>{
  const lookup=async()=>null;
  await assert.rejects(()=>resolveLoginEmail('unknown@example.test',lookup),error=>error.status===401&&/sign-in details are incorrect/i.test(error.message));
  await assert.rejects(()=>resolveLoginEmail('not-a-phone',lookup),error=>error.status===400&&/valid email address or phone/i.test(error.message));
});

test('administrator authorization checks the current database grant and denies missing permissions',async t=>{
  const grants=new Set(['rider_manager:deliveries.assign','rider_manager:users.manage']);
  const calls=[];
  const client={
    async query(text,values=[]){
      calls.push({text,values});
      return {rows:grants.has(`${values[0]}:${values[1]}`)?[{allowed:1}]:[],rowCount:grants.has(`${values[0]}:${values[1]}`)?1:0};
    },
    async end(){},
  };
  configurePostgresForTests({client});
  t.after(async()=>closePostgres());
  assert.equal(await userHasPermission(null,'deliveries.assign'),false);
  assert.equal(await userHasPermission({role:'rider_manager'},''),false);
  assert.equal(await userHasPermission({role:'super_admin'},'audit.read'),true);
  assert.equal(calls.length,0,'the fixed Super Administrator grant does not depend on mutable role rows');
  assert.equal(await userHasPermission({role:'rider_manager'},'deliveries.assign'),true);
  assert.equal(await userHasPermission({role:'vendor_manager'},'deliveries.assign'),false);
  assert.match(calls[0].text,/public\.role_permissions/);

  let nextCalled=false,status=0,body=null;
  await requirePermission('deliveries.assign')({user:{role:'rider_manager'}},{status(code){status=code;return this;},json(value){body=value;return this;}},()=>{nextCalled=true;});
  assert.equal(nextCalled,true);
  await requirePermission('deliveries.assign')({user:{role:'vendor_manager'}},{status(code){status=code;return this;},json(value){body=value;return this;}},()=>{nextCalled=true;});
  assert.equal(status,403);
  assert.match(body.error,/do not have permission/i);

  let anyPermissionNext=false;
  await requireAnyPermission('accounts.suspend','users.manage')({user:{role:'rider_manager'}},{status(code){status=code;return this;},json(value){body=value;return this;}},()=>{anyPermissionNext=true;});
  assert.equal(anyPermissionNext,true,'either supported account-management capability grants the route');
  await assert.rejects(async()=>requireAnyPermission()({user:{role:'rider_manager'}},{},()=>{}),/At least one permission is required/);
});

function fakeInvitationDependencies({lockedInvite,initialInvite}={}){
  const invitationId='20000000-0000-4000-8000-000000000001',authUserId='30000000-0000-4000-8000-000000000001',tokenId='40000000-0000-4000-8000-000000000001';
  const invite={id:invitationId,email:'admin@example.test',full_name:'Admin Invite',role:'ops_officer',auth_user_id:authUserId,status:'pending',expires_at:'2026-11-16T13:00:00.000Z',token_id:tokenId};
  const state={invite,authUserId,tokenId,queries:[],runs:[],audits:[],otpCalls:[],adminUpdates:[],metadata:{role:'ops_officer',status:'invited',session_version:'invited-version'}};
  const database={
    prepare(sql){return {
      async get(...values){
        state.queries.push({sql,values});
        if(sql.includes('SELECT i.id,i.email'))return initialInvite===undefined?invite:initialInvite;
        if(sql.includes('SELECT i.status,i.role'))return lockedInvite===undefined?invite:lockedInvite;
        throw new Error(`Unexpected invitation query: ${sql}`);
      },
      async run(...values){state.runs.push({sql,values});return {changes:1};},
    };},
    transaction(callback){return async(...args)=>callback(...args);},
  };
  const admin={auth:{admin:{
    async getUserById(id){return {data:{user:{id,app_metadata:{...state.metadata},user_metadata:{full_name:'Admin Invite',custom:'kept'}}},error:null};},
    async updateUserById(id,updates){state.adminUpdates.push({id,updates});if(updates.app_metadata)state.metadata={...updates.app_metadata};return {error:null};},
  }}};
  const createUserClient=()=>({auth:{verifyOtp:async input=>{state.otpCalls.push(input);return {data:{user:{id:authUserId}},error:null};}}});
  return {state,dependencies:{database,createUserClient,getAdminClient:()=>admin,audit:async(...args)=>state.audits.push(args),now:()=>new Date('2026-11-16T12:00:00.000Z')}};
}

test('admin invitation acceptance verifies the one-time token and atomically activates the chosen role',async()=>{
  const {state,dependencies}=fakeInvitationDependencies();
  const token='recovery-token-for-admin-setup';
  const result=await acceptAdminInvitation({
    invitationId:state.invite.id,email:' ADMIN@example.test ',token,password:'AdminPassword1!',
    ip:'203.0.113.5',requestId:'request-123',userAgent:'Test browser',
  },dependencies);
  assert.deepEqual(result,{email:'admin@example.test',role:'ops_officer',fullName:'Admin Invite'});
  assert.equal(state.queries[0].values[0],state.invite.id);
  assert.equal(state.queries[0].values[1],'admin@example.test');
  assert.equal(state.queries[0].values[2],crypto.createHash('sha256').update(token).digest('hex'));
  assert.deepEqual(state.otpCalls,[{email:'admin@example.test',token_hash:token,type:'recovery'}]);
  assert.equal(state.runs.length,4,'activation, token consumption, sibling revocation, and invite acceptance are written in one transaction');
  assert.equal(state.adminUpdates.length,1);
  assert.equal(state.adminUpdates[0].updates.password,'AdminPassword1!');
  assert.equal(state.adminUpdates[0].updates.app_metadata.status,'active');
  assert.equal(state.adminUpdates[0].updates.user_metadata.full_name,'Admin Invite');
  assert.equal(state.audits[0][1],'admin.invitation_accepted');
  assert.equal(state.audits[0][0].requestId,'request-123');
});

test('admin invitation acceptance rejects unknown or already-used tokens before contacting Supabase',async()=>{
  const {state,dependencies}=fakeInvitationDependencies({initialInvite:null});
  await assert.rejects(()=>acceptAdminInvitation({
    invitationId:state.invite.id,email:state.invite.email,token:'recovery-token-for-admin-setup',password:'AdminPassword1!',
  },dependencies),error=>error.status===400&&/invalid, expired, or already used/i.test(error.message));
  assert.equal(state.otpCalls.length,0);
  assert.equal(state.adminUpdates.length,0);
});

test('a raced admin invite acceptance rolls back Supabase activation when the database token is no longer valid',async()=>{
  const consumed={...fakeInvitationDependencies().state.invite,status:'accepted',used_at:'2026-11-16T11:59:00.000Z'};
  const {state,dependencies}=fakeInvitationDependencies({lockedInvite:consumed});
  await assert.rejects(()=>acceptAdminInvitation({
    invitationId:state.invite.id,email:state.invite.email,token:'recovery-token-for-admin-setup',password:'AdminPassword1!',
  },dependencies),error=>error.status===400&&/invalid, expired, or already used/i.test(error.message));
  assert.equal(state.runs.length,0,'no database account or token rows are changed after the locked state check fails');
  assert.equal(state.adminUpdates.length,2);
  assert.equal(state.adminUpdates[0].updates.app_metadata.status,'active');
  assert.equal(state.adminUpdates[1].updates.app_metadata.status,'invited');
});

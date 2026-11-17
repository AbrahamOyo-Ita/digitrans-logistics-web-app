import test from 'node:test';
import assert from 'node:assert/strict';
import {configureStorageForTests,createPrivateSignedUrl,deletePrivateObject,PRIVATE_BUCKETS,uploadPrivateImage,uploadPrivateObject,uploadPublicSiteImage} from './storage.js';

function fakeStorage(){
  const calls=[];
  const client={storage:{from(bucket){return {
    async upload(path,buffer,options){calls.push({method:'upload',bucket,path,buffer,options});return {data:{path},error:null};},
    async createSignedUrl(path,expiresIn){calls.push({method:'signed',bucket,path,expiresIn});return {data:{signedUrl:`https://storage.example/${bucket}/${path}?token=short-lived`},error:null};},
    async remove(paths){calls.push({method:'remove',bucket,paths});return {error:null};},
    getPublicUrl(path){calls.push({method:'public-url',bucket,path});return {data:{publicUrl:`https://storage.example/public/${path}`}};},
  };}}};
  return {client,calls};
}
const owner='9f28db5d-9fc0-4a4a-bf75-b3fbf1a01e82';
const pdf={buffer:Buffer.from('%PDF-1.7\nexample'),mimetype:'application/pdf'};
const png={buffer:Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0]),mimetype:'image/png'};

test('private uploads validate actual file signatures and create random owner-scoped paths',async()=>{
  const {client,calls}=fakeStorage();configureStorageForTests(()=>client);
  await assert.rejects(uploadPrivateObject(PRIVATE_BUCKETS.rider,{ownerId:owner,recordId:'rider-document-1',file:pdf}),error=>error.status===403);
  const stored=await uploadPrivateObject(PRIVATE_BUCKETS.rider,{ownerId:owner,recordId:'rider-document-1',file:pdf,authorized:true});
  assert.equal(stored.bucket,PRIVATE_BUCKETS.rider);
  assert.equal(stored.mimeType,'application/pdf');
  assert.equal(stored.size,pdf.buffer.length);
  assert.match(stored.path,new RegExp(`^${owner}/rider-document-1/[0-9a-f-]+\\.pdf$`));
  assert.equal(calls[0].options.upsert,false);
  await assert.rejects(uploadPrivateObject('some-other-bucket',{ownerId:owner,recordId:'doc-1',file:pdf}),/bucket is not allowed/);
  await assert.rejects(uploadPrivateObject(PRIVATE_BUCKETS.rider,{ownerId:'not-a-user',recordId:'doc-1',file:pdf,authorized:true}),/Owner ID is invalid/);
  await assert.rejects(uploadPrivateObject(PRIVATE_BUCKETS.deliveryProof,{ownerId:owner,recordId:'delivery-1',file:pdf,authorized:true}),/content does not match/);
  await assert.rejects(uploadPrivateObject(PRIVATE_BUCKETS.rider,{ownerId:owner,recordId:'doc-1',file:{...pdf,mimetype:'image/png'},authorized:true}),/content does not match/);
});

test('signed URLs require completed route authorization, safe paths, and short expiry',async()=>{
  const {client,calls}=fakeStorage();configureStorageForTests(()=>client);
  const path=`${owner}/delivery-1/proof.png`;
  await assert.rejects(createPrivateSignedUrl(PRIVATE_BUCKETS.deliveryProof,path),error=>error.status===403);
  await assert.rejects(createPrivateSignedUrl(PRIVATE_BUCKETS.deliveryProof,path,{authorized:true}),error=>error.status===400);
  await assert.rejects(createPrivateSignedUrl(PRIVATE_BUCKETS.deliveryProof,`${owner}/../proof.png`,{authorized:true,ownerId:owner}),error=>error.status===400);
  await assert.rejects(createPrivateSignedUrl(PRIVATE_BUCKETS.deliveryProof,path,{authorized:true,ownerId:'d84c6735-8c03-48e0-86e5-45d9f816f1bd'}),error=>error.status===404);
  await assert.rejects(createPrivateSignedUrl(PRIVATE_BUCKETS.deliveryProof,path,{authorized:true,expiresIn:900}),error=>error.status===400);
  const signed=await createPrivateSignedUrl(PRIVATE_BUCKETS.deliveryProof,path,{authorized:true,ownerId:owner,expiresIn:90});
  assert.equal(signed.expiresIn,90);
  assert.match(signed.signedUrl,/short-lived/);
  assert.equal(calls.filter(call=>call.method==='signed').length,1);
});

test('private removal is authorization-gated; public assets accept only validated images',async()=>{
  const {client,calls}=fakeStorage();configureStorageForTests(()=>client);
  const path=`${owner}/doc-2/file.pdf`;
  await assert.rejects(deletePrivateObject(PRIVATE_BUCKETS.identity,path),error=>error.status===403);
  await assert.rejects(deletePrivateObject(PRIVATE_BUCKETS.identity,path,{authorized:true}),error=>error.status===400);
  assert.deepEqual(await deletePrivateObject(PRIVATE_BUCKETS.identity,path,{authorized:true,ownerId:owner}),{deleted:true});
  assert.equal(calls[0].method,'remove');
  await assert.rejects(uploadPublicSiteImage({recordId:'banner-1',file:png}),error=>error.status===403);
  const result=await uploadPublicSiteImage({recordId:'banner-1',file:png,authorized:true});
  assert.equal(result.mimeType,'image/png');
  assert.match(result.publicUrl,/public/);
  await assert.rejects(uploadPrivateImage(PRIVATE_BUCKETS.deliveryProof,{ownerId:owner,recordId:'delivery-1',file:png}),error=>error.status===403);
  await assert.rejects(uploadPrivateImage(PRIVATE_BUCKETS.deliveryProof,{ownerId:owner,recordId:'delivery-1',file:pdf,authorized:true}),/content does not match/);
});

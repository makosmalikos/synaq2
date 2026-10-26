const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {once}=require('node:events');
const enabled=!!process.env.FIREBASE_AUTH_EMULATOR_HOST&&!!process.env.FIRESTORE_EMULATOR_HOST;
before(()=>{
 if(!enabled)return;
 assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST,'127.0.0.1:19099');assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:18080');
 for(const key of ['FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY','GOOGLE_APPLICATION_CREDENTIALS','FIREBASE_CONFIG'])delete process.env[key];
 process.env.SYNAQ_USE_EMULATORS='1';process.env.FIREBASE_PROJECT_ID=process.env.GOOGLE_CLOUD_PROJECT=process.env.GCLOUD_PROJECT='demo-synaq-tests';process.env.NODE_ENV='test';
});
after(async()=>{if(!enabled)return;const{getAdmin}=require('../backend/lib/firebase-admin');const{getApps,deleteApp}=require('firebase-admin/app');await getAdmin().db.terminate();for(const app of getApps())await deleteApp(app);});

test('real mock lost acknowledgement and two diagnostic sessions recover without duplicate results', {skip:!enabled,timeout:120000}, async()=>{
 const {getAdmin}=require('../backend/lib/firebase-admin');const {db,auth}=getAdmin();
 const {createApp}=require('../backend/server');const server=createApp().listen(0,'127.0.0.1');await once(server,'listening');
 const origin=`http://127.0.0.1:${server.address().port}`,suffix=randomUUID().replaceAll('-','').slice(0,10),uid='auditrecovery'+suffix,parentUid=uid+'parent';
 const rawFetch=global.fetch,refs=[],sessionIds=[];let client;
 global.fetch=async(input,options)=>{const url=typeof input==='string'&&input.startsWith('/api/')?new URL(input,origin):new URL(typeof input==='string'?input:input.url||input.href);assert.equal(url.hostname,'127.0.0.1');assert.ok([String(server.address().port),'19099','18080'].includes(url.port));return rawFetch(url,options);};
 try{
  await auth.createUser({uid,email:uid+'@synaq.kids',password:'test-recovery-123',displayName:'Recovery test'});
  const seed=[['families/'+parentUid,{plan:'pro',pro:true,parentName:'Recovery test'}],['families/'+parentUid+'/children/'+uid,{code:uid,name:'Recovery test',klass:'6'}],['childIndex/'+uid,{parentUid,name:'Recovery test',klass:'6',school:'БИЛ'}]];
  for(const[path,value]of seed){const ref=db.doc(path);refs.push(ref);await ref.set(value);}
  const {loadEmulatorClient,sdk}=require('./helpers/emulator-browser-client.cjs');client=await loadEmulatorClient('recovery-'+suffix);await client.loginChild(uid,'test-recovery-123');
  const {authenticatedRequest}=await import('../frontend/src/authenticatedRequest.js');
  const call=(path,body)=>authenticatedRequest(client.auth,path,{body});
  const {writeMockSession,readMockSession}=await import('../frontend/src/mockPersistence.js');
  const store=new Map(),storage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};
  const catalog=await call('/api/mock-session',{action:'catalog'});assert.equal(catalog.weekly.access,true);
  const id='recovery_mock_'+suffix;sessionIds.push(['mockSessions',id]);
  const started=await call('/api/mock-session',{action:'start',id,school:'БИЛ',weekKey:catalog.weekly.weekKey,excludeQuestionIds:[]});
  assert.equal(typeof started.serverNow,'number');assert.equal(started.test.questions.length,60);assert.ok(started.test.questions.every(q=>q.answer===undefined));
  const answers={1:String(started.test.questions[0].options?.[0]||'12')};
  writeMockSession({uid,id,school:'БИЛ',test:started.test,meta:{school:'БИЛ'},answers,flags:{},index:0,startedAt:started.startedAt,deadline:started.deadline,pausedAt:null,pausedMs:0,isDiagnosticRun:false,result:null,pending:null,submission:{answers:{...answers}}},storage);
  const committed=await call('/api/mock-session',{action:'submit',id,answers}); // Its response could be lost after the server commits.
  const frozen=readMockSession(uid,storage).record;
  const replay=await call('/api/mock-session',{action:'submit',id,answers:frozen.submission.answers});
  assert.equal(replay.result.sourceId,id);assert.equal(replay.result.score,committed.result.score);
  const restored=await call('/api/mock-session',{action:'resume',id});assert.equal(restored.completed,true);assert.equal(restored.result.sourceId,id);
  const mocks=await client.getMocks(uid);assert.equal(mocks.filter(m=>m.sourceId===id).length,1);
  const outcomes=[];
  for(const [grade,label]of [[3,'tab-a'],[6,'tab-b']]){
   const diagnosticId=`recovery_diag_${grade}_${suffix}`;sessionIds.push(['diagnosticSessions',diagnosticId]);
   const first=await call('/api/diagnostic-session',{action:'start',id:diagnosticId,grade});assert.equal(first.question.question.answer,undefined);
   for(let index=0;index<20;index++){
    const body={action:'answer',id:diagnosticId,index,answer:index===0?label:''};
    const accepted=await call('/api/diagnostic-session',body);
    if(index===0){const retry=await call('/api/diagnostic-session',body);assert.equal(retry.index,1);}
    if(index===19){outcomes.push(accepted.result);assert.equal(accepted.completed,true);assert.equal(accepted.result.mistakes[0].your,label);}
   }
   const recovered=await call('/api/diagnostic-session',{action:'resume',id:diagnosticId});assert.equal(recovered.completed,true);assert.equal(recovered.result.grade,grade);
  }
  const diagnostics=await client.getPlatformDiagnostics(uid);assert.equal(diagnostics.length,2);assert.equal(new Set(outcomes.map(r=>r.sourceId)).size,2);
  await sdk.signOut(client.auth);
 }finally{
  global.fetch=rawFetch;
  if(client){const{sdk}=require('./helpers/emulator-browser-client.cjs');await sdk.terminate(client.db);await sdk.deleteApp(client.auth.app);}
  await new Promise(resolve=>server.close(resolve));
  for(const[collection,id]of sessionIds)await db.doc(`${collection}/${uid}_${id}`).delete();
  for(const collection of ['mockRateLimits','diagnosticRateLimits'])await db.doc(`${collection}/${uid}`).delete();
  await db.recursiveDelete(db.doc('results/'+uid));
  for(const ref of refs.reverse())await ref.delete();
  await auth.deleteUser(uid).catch(()=>{});
 }
});

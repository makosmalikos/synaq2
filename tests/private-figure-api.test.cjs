const test=require('node:test');
const assert=require('node:assert/strict');
const {createLearningHandler}=require('../api/learning');
const {getStandardBank}=require('../backend/lib/standard-bank');
const {readPrivateFigure}=require('../backend/lib/private-figure');
const illustrated=getStandardBank().find(q=>q.image&&q.grade===4);
assert.ok(illustrated);
function fixture({plan='pro',klass=6,expiry,orphan=false,user={uid:'kid',email:'student@synaq.kids'}}={}){
 const records=new Map([['childIndex/kid',{parentUid:'parent'}],['families/parent',{plan,...(expiry?{planExpiresAt:expiry}:{})}],['families/parent/children/kid',{code:'student',klass}]]);
 if(orphan)records.delete('families/parent/children/kid');
 const snapshot=p=>({exists:records.has(p),data:()=>records.get(p)});
 const collection=p=>({doc:id=>ref(p+'/'+id)}),ref=p=>({path:p,get:async()=>snapshot(p),collection:name=>collection(p+'/'+name)});
 const db={collection,runTransaction:callback=>callback({get:async r=>snapshot(r.path),set(){throw Error('Figure read must not write');},create(){throw Error('Figure read must not write');}})};
 const handler=createLearningHandler({admin:()=>({db,auth:{verifyIdToken:async(token,revoked)=>{assert.equal(revoked,true);if(token!=='valid')throw Object.assign(Error('invalid'),{code:'auth/id-token-revoked'});return user;}}})});
 async function invoke(body={action:'figure',qid:illustrated.id},{token='valid',method='POST',query={}}={}){
  const res={headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;},status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;},send(v){this.body=v;return this;}};
  await handler({method,headers:token?{authorization:`Bearer ${token}`}:{},body,query},res);return res;
 }
 return {records,invoke};
}
test('paid native figures require valid child auth and current Standard-or-higher entitlement',async()=>{
 for(const [plan,expected]of [['free',403],['standard',403],['pro',200],['mentor',200]]){
  const f=fixture({plan}),before=structuredClone([...f.records]);const response=await f.invoke();assert.equal(response.statusCode,expected,plan);
  assert.deepEqual([...f.records],before,'No daily allowance/session write');
  assert.equal(response.headers['cache-control'],'private, no-store');
  if(expected===200){assert(Buffer.isBuffer(response.body));assert.match(response.body.toString(),/<svg\b/);assert.match(response.headers['content-type'],/^image\/svg\+xml/);assert.equal(response.headers.vary,'Authorization');assert.equal(response.headers['x-content-type-options'],'nosniff');}
  else assert.deepEqual(response.body,{error:'pro-required'});
 }
 const f=fixture();for(const token of [null,'invalid']){const r=await f.invoke(undefined,{token});assert.equal(r.statusCode,401);assert.deepEqual(r.body,{error:'auth-required'});}
 assert.equal((await f.invoke(undefined,{token:null,query:{token:'valid'}})).statusCode,401,'URL tokens never authenticate');
 assert.equal((await f.invoke(undefined,{method:'GET'})).statusCode,405);
});
test('figure access repeats expiry, child ownership and grade checks and cannot be upgraded by body fields',async()=>{
 assert.equal((await fixture({expiry:Date.now()-10000}).invoke()).statusCode,403);
 assert.equal((await fixture({orphan:true}).invoke()).statusCode,403);
 assert.equal((await fixture({user:{uid:'kid',email:'wrong@synaq.kids'}}).invoke()).statusCode,403);
 assert.equal((await fixture({user:{uid:'parent',email:'parent@example.test'}}).invoke()).statusCode,403);
 assert.equal((await fixture({klass:3}).invoke()).statusCode,404);
 const f=fixture({plan:'free'});assert.equal((await f.invoke({action:'figure',qid:illustrated.id,plan:'mentor',gradeCeiling:11})).statusCode,400);
});
test('figure API accepts only canonical qid, never client paths or unreviewed/public source IDs',async()=>{
 const f=fixture();
 for(const qid of ['../../.env','synaq_adapted_../geometry','synaq_adapted_%2e%2e','zerek_course_extra_deadbeefdeadbeef']){
  const r=await f.invoke({action:'figure',qid});assert.equal(r.statusCode,400);assert.deepEqual(r.body,{error:'bad-question'});
 }
 assert.equal((await f.invoke({action:'figure',qid:illustrated.id,image:'/etc/passwd'})).statusCode,400);
 const absent=await f.invoke({action:'figure',qid:'synaq_adapted_nonexistent'});assert.equal(absent.statusCode,404);assert.deepEqual(absent.body,{error:'figure-unavailable'});
 f.records.set('bankTasks/synaq_adapted_fake',{id:'synaq_adapted_fake',status:'published',editorialStatus:'verified',minimumPlan:'pro',image:illustrated.image,grade:1,statement:'Copied alias',answer:'1'});
 assert.equal((await f.invoke({action:'figure',qid:'synaq_adapted_fake'})).statusCode,404,'Admin tasks cannot alias a canonical paid figure or bypass its grade');
 for(const candidate of ['/etc/passwd','/figures/synaq-editions/../x.svg','/figures/synaq-editions/%2e%2e.svg','/figures/zerek/source.svg','/figures/synaq-editions/absent.svg'])await assert.rejects(readPrivateFigure(candidate),e=>e.status===404&&e.message==='figure-unavailable');
});

test('Free sampler includes its own native drawing with the same auth and grade checks', async () => {
 const {isFreePreview}=require('../backend/lib/free-preview');
 const q=getStandardBank().find(q=>q.image&&isFreePreview(q));assert.ok(q);
 const free=await fixture({plan:'free',klass:4}).invoke({action:'figure',qid:q.id});
 assert.equal(free.statusCode,200);assert.match(free.body.toString(),/<svg\b/);
 assert.equal((await fixture({plan:'free',klass:3}).invoke({action:'figure',qid:q.id})).statusCode,404);
});

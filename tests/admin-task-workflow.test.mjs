import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { ADMIN_TOPICS, parseCsv, csvTemplate, validateTask, normalizeTask } from '../frontend/src/adminTaskModel.js';
import { partitionAdminTasks } from '../frontend/src/questionMetadata.js';
const require = createRequire(import.meta.url);
const { createHandler } = require('../backend/handlers/admin-tasks');
const sample = (overrides={}) => ({ school:'НИШ',topic:'science',lang:'ru',difficulty:2,type:'mcq',statement:'Какое вещество необходимо для дыхания человека?',options:['Кислород','Азот'],answer:'Кислород',solution:'Для клеточного дыхания необходим кислород.',status:'draft', ...overrides });
const response = () => ({ statusCode:200, setHeader(){}, status(code){this.statusCode=code;return this;}, json(body){this.body=body;return this;} });
function fixture({ pool=[] }={}) {
  const records = new Map(), keys = new Map();
  const store = (name) => name === 'bankTasks' ? records : keys;
  const doc = (name,id) => ({ name,id, async get(){return { exists:store(name).has(id),data:()=>store(name).get(id) };} });
  let queries=0;
  const db = { collection(name) {
    assert.ok(['bankTasks','bankTaskKeys'].includes(name));
    const query = { doc:(id)=>doc(name,id), orderBy(){return query;},startAfter(id){query.cursor=id;return query;},limit(n){query.size=n;return query;},async get(){
      queries++; const entries=[...store(name)].sort(([a],[b])=>a.localeCompare(b)).filter(([id])=>!query.cursor || id>query.cursor).slice(0,query.size);
      return {docs:entries.map(([id,data])=>({id,data:()=>data}))};
    } };
    return query;
  }, async runTransaction(callback) {
    const writes=[];
    const result = await callback({ get:(ref)=>ref.get(),set:(ref,value)=>writes.push(()=>store(ref.name).set(ref.id,value)),delete:(ref)=>writes.push(()=>store(ref.name).delete(ref.id)) });
    writes.forEach((write)=>write()); return result;
  } };
  const auth = { async verifyIdToken(token, revoked) {
    assert.equal(revoked,true);
    if (token==='expired') throw Object.assign(Error('expired'),{code:'auth/id-token-expired'});
    return {uid:'a',email:token==='outsider'?'user@example.com':'makosmalikos@gmail.com',admin:token==='admin',adminAuthVersion:2};
  } };
  const handler=createHandler({admin:()=>({auth,db}),staticPool:async()=>pool});
  const send=async(method,body,token='admin',query={})=>{const res=response();await handler({method,body,headers:{authorization:`Bearer ${token}`},query},res);return res;};
  return {records,keys,send,queries:()=>queries};
}
test('admin taxonomy supports every displayed topic including science, reading and BIL logic',()=>{
  for(const topic of ADMIN_TOPICS) for(const school of topic.schools) {
    const lang={kaz:'kk',rus:'ru',eng:'en'}[topic.subject] || 'ru';
    assert.deepEqual(validateTask(sample({topic:topic.id,school,lang})),[]);
  }
});
test('CSV supports UTF-8 BOM, Excel semicolons, comma-separated files, escaped quotes and multiline cells',()=>{
  const rows=parseCsv(csvTemplate());assert.equal(rows.length,1);assert.deepEqual(rows[0].errors,[]);assert.equal(rows[0].task.answer,'12');
  const csv='school,topic,difficulty,type,statement,answer,solution\r\nНИШ,eq,2,open,"Найдите x, если\nx + 2 = 5. ""Объясните""",3,"Вычтем 2, получим 3."';
  assert.equal(parseCsv(csv)[0].task.statement,'Найдите x, если\nx + 2 = 5. "Объясните"');
  assert.deepEqual(parseCsv(csv)[0].errors,[]);
});
test('CSV blocks incorrect schema, broken quotes, oversized batches, duplicate content and unmatched options',()=>{
  assert.throws(()=>parseCsv('topic,statement\neq,x'),/csv_headers/);
  assert.throws(()=>parseCsv(csvTemplate().replace('Продолжите ряд: 3, 6, 9, …','broken"quote')),/csv_quotes/);
  const lines=csvTemplate().split('\r\n');
  assert.ok(parseCsv([...lines,lines[1]].join('\r\n'))[1].errors.includes('duplicate_task'));
  assert.throws(()=>parseCsv([lines[0],...Array(101).fill(lines[1])].join('\r\n')),/batch_size/);
  assert.ok(parseCsv(csvTemplate().replace('"12";"Каждое','"99";"Каждое'))[0].errors.includes('answer_not_in_options'));
  assert.throws(()=>parseCsv('x'.repeat(1000001)),/file_too_large/);
});
test('drafts may have unfinished solutions but reviewed content is complete and bounded',()=>{
  assert.deepEqual(validateTask(sample({solution:'',answer:''}),false),[]);
  assert.ok(validateTask(sample({solution:''}),true).includes('bad_solution'));
  assert.ok(validateTask(sample({options:Array(9).fill('x')})).includes('bad_options'));
  assert.ok(validateTask(sample({answer:42})).includes('bad_answer'));
  assert.ok(validateTask(sample({topic:'lang_eng',lang:'ru'})).includes('bad_lang'));
  assert.doesNotThrow(()=>normalizeTask(null));
});
test('unauthorized admins and expired tokens cannot read or modify the bank',async()=>{
  const f=fixture();
  for(const token of ['outsider','expired','student']) for(const method of ['GET','POST','PATCH']) assert.equal((await f.send(method,sample(),token)).statusCode,403);
  assert.equal(f.queries(),0);assert.equal(f.records.size,0);
});
test('tasks move through draft, review and publication; stale edits and published edits are blocked',async()=>{
  const f=fixture(), task=sample();
  const added=await f.send('POST',task);assert.equal(added.statusCode,200);const id=added.body.id;
  assert.equal(f.records.get(id).status,'draft');
  assert.equal((await f.send('PATCH',{...task,id,revision:1,status:'published'})).body.error,'review_required');
  assert.equal((await f.send('PATCH',{...task,id,revision:1,status:'reviewed'})).statusCode,200);
  assert.equal((await f.send('PATCH',{...task,id,revision:1})).body.error,'stale_revision');
  assert.equal((await f.send('PATCH',{...task,id,revision:2,status:'published',answer:'Азот'})).body.error,'review_required');
  assert.equal((await f.send('PATCH',{...task,id,revision:2,status:'published'})).statusCode,200);
  assert.equal((await f.send('PATCH',{...task,id,revision:3,status:'draft'})).body.error,'published_locked');
  assert.equal(f.records.get(id).subject,'science');
});
test('batch imports are atomic drafts; duplicates in a batch, saved bank and bundled bank are blocked',async()=>{
  const f=fixture(), task=sample();
  const invalid=await f.send('POST',{tasks:[task,sample({statement:'Another',solution:''})]});
  assert.equal(invalid.statusCode,400);assert.equal(f.records.size,0);
  assert.equal((await f.send('POST',{tasks:[task,task]})).statusCode,409);assert.equal(f.records.size,0);
  const imported=await f.send('POST',{tasks:[task,sample({statement:'Вторая задача'})]});assert.equal(imported.body.count,2);
  assert.equal((await f.send('POST',task)).body.error,'duplicate_task');assert.equal(f.records.size,2);
  const staticDuplicate=fixture({pool:[{...task,id:'bundled'}]});assert.equal((await staticDuplicate.send('POST',task)).body.error,'duplicate_task');
  assert.equal((await f.send('POST',{tasks:[sample({statement:'Третья',status:'published'})]})).body.error,'import_drafts_only');
});
test('library pagination exposes publication state and stable revisions, with legacy tasks remaining live',async()=>{
  const f=fixture();for(let n=0;n<55;n++)f.records.set(`task-${String(n).padStart(2,'0')}`,sample({statement:String(n),revision:1}));
  f.records.set('task-99',{...sample(),status:undefined});
  const page=await f.send('GET');assert.equal(page.body.tasks.length,50);assert.equal(page.body.cursor,'task-49');
  const next=await f.send('GET',null,'admin',{cursor:page.body.cursor});assert.equal(next.body.tasks.length,6);assert.equal(next.body.cursor,null);assert.equal(next.body.tasks.at(-1).status,'published');
});
test('only published and legacy tasks enter both training and report catalogs; explicit language survives',()=>{
  const task=sample({id:'p',status:'published',lang:'kk'});
  const result=partitionAdminTasks([task,sample({id:'d'}),sample({id:'r',status:'reviewed'}),sample({id:'old',status:undefined})],[]);
  assert.deepEqual(result.active.map((q)=>q.id),['p','old']);assert.equal(result.active[0].lang,'kk');
});
test('saving changed drafts releases the old duplicate key and invalid preflight never writes',async()=>{
  const f=fixture(),task=sample();const added=await f.send('POST',task);const id=added.body.id;
  assert.equal((await f.send('PATCH',{...task,id,revision:1,statement:'Обновлённый вопрос'})).statusCode,200);assert.equal(f.keys.size,1);
  assert.equal((await f.send('POST',task)).statusCode,200);
  const count=f.records.size;
  assert.equal((await f.send('POST',{tasks:[sample({statement:'Новый вопрос'})],action:'validate'})).statusCode,200);assert.equal(f.records.size,count);
});

test('warm server workers see newly published questions and never leak drafts into practice or mocks',async()=>{
  const { loadPublishedBank } = require('../backend/lib/published-bank');
  const f=fixture(),task=sample({id:'admin-live'});
  f.records.set(task.id,task);
  const db={collection:()=>({get:async()=>({docs:[...f.records].map(([id,data])=>({id,data:()=>data}))})})};
  let pool=await loadPublishedBank(db);assert.equal(pool.some((q)=>q.id===task.id),false);
  f.records.set(task.id,{...task,status:'published'});
  pool=await loadPublishedBank(db);assert.equal(pool.find((q)=>q.id===task.id).subject,'science');
  f.records.set(task.id,{...task,status:'draft'});
  assert.equal((await loadPublishedBank(db)).some((q)=>q.id===task.id),false);
});

test('missing credentials are not consulted for an unauthenticated request',async()=>{
  const handler=createHandler({admin:()=>{throw Error('must not initialize');}}),res=response();
  await handler({method:'GET',headers:{}},res);assert.equal(res.statusCode,403);
});

test('malformed bodies and null import rows produce validation errors without writes',async()=>{
  const f=fixture();
  assert.equal((await f.send('POST','{broken')).statusCode,400);
  assert.equal((await f.send('POST',{tasks:[null]})).statusCode,400);
  assert.equal(f.records.size,0);
});

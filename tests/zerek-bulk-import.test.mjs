import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {detectLang} from '../frontend/src/questionMetadata.js';
import {POOL,BANK_QUARANTINE} from '../frontend/src/bank.js';
import {zerekImportedQuestions as tasks} from '../frontend/src/zerekImportedQuestions.js';
import {api} from '../frontend/src/api.js';
import {ensureBankReady} from '../frontend/src/bank.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const catalog=read('problems/sources/zerek/catalog.json');
const report=read('problems/reviews/zerek-bulk-2026-10-22.json');
const vectors=read('problems/sources/zerek/vector-manifest.json').files;
const records=read('problems/sources/zerek/import-dispositions.json').records;
const byCollection=new Map(catalog.collections.map(c=>{const id=c.path.split('/').at(-1);return [id,read('problems/sources/zerek/collections/'+id+'.json')];}));
const task=(id,n)=>tasks.find(q=>q.id===`zerek_${id}_${String(n).padStart(2,'0')}`);
const num=q=>Number(q.answer.replace(',','.'));

test('every source collection and question has one completed, explicit disposition',()=>{
 assert.equal(catalog.collections.length,117);
 assert.deepEqual(catalog.collections.reduce((o,c)=>(o[c.school]=(o[c.school]||0)+1,o),{}),{PREP:8,BIL:38,NIS:46,RFMSH:25});
 assert.equal(records.length,2419);
 assert.equal(new Set(records.map(r=>`${r.collection}:${r.number}`)).size,2419);
 assert.ok(catalog.collections.every(c=>c.sourceReviewCaptured&&c.status==='captured'));
 for(const [id,c] of byCollection){
  assert.equal(c.count,c.questions.length,id);assert.ok(c.sourceReviewCaptured,id);
  assert.deepEqual(c.questions.map(q=>q.number),Array.from({length:c.count},(_,i)=>i+1));
  for(const q of c.questions) assert.ok(records.some(r=>r.collection===id&&r.number===q.number));
 }
 assert.equal(tasks.length,report.summary.newlyImported);
 assert.equal(records.filter(r=>r.status==='ready').length,tasks.length);
 assert.equal(records.filter(r=>r.status==='previous_batch').length,21);
});

test('complete tasks stay in the offline archive; source choices retain the correct index',()=>{
 const active=new Map(POOL.map(q=>[q.id,q]));
 assert.equal(new Set(tasks.map(q=>q.id)).size,tasks.length);
 for(const q of tasks){
  const r=records.find(r=>r.id===q.id);assert.equal(r.status,'ready',q.id);
  const raw=byCollection.get(r.collection).questions[q.sourceNumber-1];
  assert.equal(active.has(q.id),false,q.id);assert.equal(BANK_QUARANTINE.some(x=>x.id===q.id),false);
  assert.equal(q.lang,'kk');
  if(q.image){const v=vectors.find(v=>v.image===q.image);assert.equal(v.visualReview,'verified');assert.equal(raw.images[0].src,v.sourceUrl);}else assert.equal(raw.images.length,0,q.id);assert.equal(raw.statement.includes('[SVG diagram]'),false,q.id);
  assert.ok(!/[\\$]/.test(q.statement+q.solution+(q.options||[]).join(' ')),q.id);
  assert.ok(q.solution.length>=30,q.id);assert.equal(q.sourceUrl,byCollection.get(r.collection).url);
  if(q.school==='РФМШ'&&!q.practiceOnly){assert.equal(q.options,null);assert.match(q.answer,/^[1-9]\d*$/);}
  else if(q.options){
   assert.equal(q.options.length,raw.options.length);assert.equal(new Set(q.options).size,q.options.length);
   const correct=raw.options.map((o,i)=>o.correct?i:-1).filter(i=>i>=0);
   assert.equal(correct.length,1,q.id);assert.equal(q.answer,q.options[correct[0]],q.id);
  }
 }
 for(const r of records.filter(r=>r.status==='needs_review'))assert.equal(active.has(`zerek_${r.collection}_${String(r.number).padStart(2,'0')}`),false);
});

test('original collection archive IDs are unavailable through practice APIs or server lookup',async()=>{
 await ensureBankReady(async()=>[]);
 const sourceIds=new Set(tasks.map(q=>q.id));
 for(const topic of new Set(tasks.map(q=>q.topic))){
  const rows=await api.topicQuestions(topic);
  assert.ok(rows.every(q=>!sourceIds.has(q.id)),topic);
 }
 const require=createRequire(import.meta.url);const {findTrainingQuestion}=require('../backend/lib/training-question');
 for(const q of tasks)assert.equal(await findTrainingQuestion(null,q.id),null,q.id);
});

test('independent counting and arithmetic models verify representative imported answers',()=>{
 const id='37fe70f6-f90a-49ef-bb0a-f88858e186ce';
 assert.equal(num(task(id,1)),760*35/100);
 assert.equal(num(task(id,5)),Array.from({length:360},(_,i)=>i+1).filter(n=>360%n===0).length);
 assert.equal(num(task(id,7)),Array.from({length:200},(_,i)=>i+1).filter(n=>Number.isInteger(Math.sqrt(n))).length);
 const seven=[];for(let a=1;a<=8;a++)for(let b=a+1;b<=8;b++)for(let c=b+1;c<=8;c++)for(let d=c+1;d<=8;d++)for(let e=d+1;e<=8;e++)for(let f=e+1;f<=8;f++)for(let g=f+1;g<=8;g++)if(a+b+c+d+e+f+g===29)seven.push(g-a);
 assert.deepEqual([...new Set(seven)],[num(task(id,14))]);
 assert.equal(num(task(id,15)),(4*3/2)*(5*4/2));
 const tilings=[1,1];for(let n=2;n<=6;n++)tilings[n]=tilings[n-1]+tilings[n-2];assert.equal(num(task(id,16)),tilings[6]);
 assert.equal(num(task(id,17)),Array.from({length:30},(_,i)=>i+1).filter(d=>30%d===0&&42%d===0).reduce((a,b)=>a+b,0));
 assert.equal(num(task(id,18)),8*7*6/6);
 const entrants=Array.from({length:30},(_,i)=>i+1).find(n=>n*(n-1)/2===21);assert.equal(num(task(id,19)),entrants*(entrants-1)*(entrants-2)/6);
 assert.equal(num(task(id,20)),2*3+2*4+3*4);
 const proportion=task('df69ba92-b698-4cbe-a587-6468e21aeeb6',11);assert.ok(proportion.statement.includes('(3x)'));assert.equal(num(proportion),10);assert.equal(2.375/(3*num(proportion)),2.375/30);
 const rounded=task('692f19ad-e538-4e5d-b409-7a0424e9c804',31);assert.equal(num(rounded),Math.round((5/3+5/4)*100)/100);
 const product=task('52cb4a68-1feb-4e9d-af12-f086e89fe06c',34);assert.equal(num(product),[7,9,11,13,15,17,19].reduce((a,b)=>a*b,1)%10);assert.match(product.solution,/43\s*648\s*605/);
 assert.equal(num(task('610373a9-a497-4f63-aef0-29ad2099fc49',2)),Array.from({length:10},(_,i)=>5+i).length);
});

test('all source diagrams are archived intact and have reviewed SVG replacements',()=>{
 const images=read('problems/sources/zerek/image-manifest.json').files;
 assert.equal(images.length,239);assert.ok(images.every(i=>i.file&&i.status==='archived_source_with_reviewed_vector'));
 for(const i of images){
  const data=fs.readFileSync(new URL('../problems/sources/zerek/'+i.file,import.meta.url));
  assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'),i.sha256);
  assert.equal(data.length,i.bytes);assert.equal(data.readUInt32BE(16),i.width);assert.equal(data.readUInt32BE(20),i.height);
 }
});

test('reviewed language metadata covers formula-only tasks without overriding language subjects',()=>{
 assert.equal(detectLang({lang:'kk',statement:'Есепте: 2 + 2'}),'kk');
 assert.equal(detectLang({lang:'invalid',statement:'Вычислите: 2 + 2'}),'ru');
 assert.equal(detectLang({lang:'kk',subject:'eng',statement:'Read the text'}),'en');
 assert.equal(detectLang({lang:'ru',topic:'lang_kaz',statement:'Мәтін'}),'kk');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {zerekCourseQuestions as tasks} from '../frontend/src/zerekCourseQuestions.js';
import {POOL,BANK_QUARANTINE,ensureBankReady} from '../frontend/src/bank.js';
import {api} from '../frontend/src/api.js';
import {isCorrect} from '../frontend/src/grading.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const base='problems/sources/zerek/courses/';
const review=read(base+'review-dispositions.json');
const firstImages=new Set(tasks.map(q=>q.image).filter(Boolean));
const manifest=read(base+'vector-manifest.json').files.filter(v=>firstImages.has(v.image));
const svg=q=>fs.readFileSync(new URL('../frontend/public'+q.image,import.meta.url),'utf8');
const at=(name,index)=>{
 const r=review.records.find(r=>r.file===name+'-level1.json'&&r.captureIndex===index);
 return tasks.find(q=>q.id===r.id);
};

test('reviewed grade 4–6 course archive retains grade and provenance without active delivery',()=>{
 assert.equal(tasks.length,176);
 assert.deepEqual(Object.fromEntries([4,5,6].map(g=>[g,tasks.filter(q=>q.grade===g).length])),{4:48,5:48,6:80});
 assert.equal(review.summary.unresolved,0);
 assert.equal(new Set(tasks.map(q=>q.id)).size,tasks.length);
 for(const q of tasks){
  const live=POOL.find(p=>p.id===q.id);
  assert.equal(live,undefined,q.id);assert.equal(q.difficulty,'basic');
  assert.equal(q.practiceOnly,true);assert.equal(q.lang,'kk');
  assert.equal(q.school,'Математика');
  assert.match(q.sourceUrl,/^https:\/\/zerek\.app\/courses\/[456]-math\/\d+-\d+\/1$/);
  assert.ok(!BANK_QUARANTINE.some(p=>p.id===q.id));
  assert.ok(q.solution.length>30);assert.doesNotMatch(q.statement+q.solution+q.answer,/[\\$]|\[Image:|\[SVG/);
 }
 assert.equal(tasks.filter(q=>q.image).length,24);
});

test('archived course grading remains valid offline while client and server withhold originals',async()=>{
 await ensureBankReady(async()=>[]);
 const require=createRequire(import.meta.url);const {findTrainingQuestion}=require('../backend/lib/training-question');
 const groups=new Map(await Promise.all([...new Set(tasks.map(q=>q.topic))].map(async t=>[t,await api.topicQuestions(t)])));
 for(const q of tasks){
  const live=groups.get(q.topic).find(p=>p.id===q.id);assert.equal(live,undefined,q.id);
  const server=await findTrainingQuestion(null,q.id);
  assert.equal(server,null,q.id);
  assert.ok(isCorrect(q.answer,q),q.id);
  if(q.options){
   assert.equal(q.options.filter(o=>o===q.answer).length,1);
   for(const wrong of q.options.filter(o=>o!==q.answer))assert.equal(isCorrect(wrong,q),false,q.id+' '+wrong);
  }else{
   assert.match(q.answer,/^\d+$/);
   assert.equal(isCorrect(String(Number(q.answer)+1),q),false,q.id);
  }
 }
});

test('native diagrams preserve the counted quantities, chart heights and abacus place values',()=>{
 const grid=at('5-math-3-2',12);
 assert.equal((svg(grid).match(/fill="#73adff"/g)||[]).length,8);
 const percent=at('5-math-6-2',3);
 const blue=(svg(percent).match(/fill="#73adff"/g)||[]).length;
 assert.equal(blue,23);assert.equal(Number(percent.answer),500*blue/100);
 const abacus=at('4-math-1-1',7);
 const rods=new Map();
 for(const [,x] of svg(abacus).matchAll(/<ellipse cx="(\d+)"/g))rods.set(Number(x),(rods.get(Number(x))||0)+1);
 assert.equal(Number(abacus.answer),(rods.get(110)||0)*1000+(rods.get(275)||0)*100+(rods.get(440)||0)*10+(rods.get(605)||0));
 for(const [index,maximum] of [[9,10],[3,60]]){
  const q=at('6-math-8-1',index);
  const heights=[...svg(q).matchAll(/<rect[^>]*height="([\d.]+)" fill="#73adff"/g)].map(m=>Number(m[1])*maximum/280);
  assert.equal(heights.reduce((a,b)=>a+b)/heights.length,Number(q.answer));
 }
 assert.equal(Number(at('4-math-3-1',7).answer),480/6);
 assert.equal(Number(at('4-math-4-1',9).answer),4*(8+5+3));
 assert.equal(Number(at('6-math-4-2',15).answer),(14-2)/(4-1));
});

test('all reconstructed figures are local, reviewed and free of raster or executable payloads',()=>{
 assert.equal(manifest.length,24);
 for(const v of manifest){
  const source=svg(v);assert.equal(v.visualReview,'verified');
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'),v.sha256);
  assert.match(source,/<svg[^>]+viewBox="0 0 720 \d+"/);
  assert.doesNotMatch(source,/<image\b|<script\b|<foreignObject\b|(?:href|onload|onclick)=|data:image/i);
  assert.ok(Buffer.byteLength(source)<30000);
 }
 const reconstructed=manifest.filter(v=>v.method==='constructed_from_complete_condition');
 assert.equal(reconstructed.length,1);assert.match(reconstructed[0].image,/1\.1-L1-02/);
});

test('original course archive cannot enter client or server mock exams',async()=>{
 await ensureBankReady(async()=>[]);
 const require=createRequire(import.meta.url);const {createMock,createWeeklyMock}=require('../backend/lib/mock-bank');
 for(const school of ['РФМШ','НИШ','БИЛ']){
  assert.ok(POOL.every(q=>!q.id.startsWith('zerek_course_')));
  const client=await api.mockRandom(school);
  assert.ok(client.questions.every(q=>!q.id.startsWith('zerek_course_')));
  const db={collection:()=>({get:async()=>({docs:tasks.map(q=>({id:'course-test-'+q.id,data:()=>({...q,school,status:'published'})}))})})};
  for(const mock of [await createMock(db,school),await createWeeklyMock(db,school,'2026-10-19')]){
   assert.ok(mock.questions.every(q=>!q.practiceOnly&&!q.id.startsWith('course-test-')));
  }
 }
});

test('division with remainder is explained without false equalities',()=>{
 assert.match(at('5-math-3-8',1).solution,/29 = 24\s*·\s*1 \+ 5/);
 assert.doesNotMatch(at('5-math-3-8',1).solution,/29 : 24 = 1/);
 assert.match(at('5-math-3-8',13).solution,/5 = 4\s*·\s*1 \+ 1/);
});

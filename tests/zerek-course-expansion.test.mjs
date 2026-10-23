import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {zerekCourseExpansionQuestions as tasks} from '../frontend/src/zerekCourseExpansionQuestions.js';
import {POOL,BANK_QUARANTINE,ensureBankReady} from '../frontend/src/bank.js';
import {api} from '../frontend/src/api.js';
import {isCorrect} from '../frontend/src/grading.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const base='problems/sources/zerek/courses/';
const report=read(base+'expansion-dispositions.json');
const records=new Map(report.records.filter(r=>r.status==='published_local').map(r=>[r.id,r]));
const vectors=new Map(read(base+'vector-manifest.json').files.map(r=>[r.image,r]));
const files=new Map();
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(', ')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+': '+canonical(v[k])).join(', ')+'}':JSON.stringify(v);

test('each course expansion task has a reviewed, unchanged source condition/key and authorized grade',()=>{
 assert.equal(tasks.length,report.summary.publishedLocal);assert.ok(tasks.length>=351);
 assert.equal(new Set(tasks.map(q=>q.id)).size,tasks.length);
 for(const q of tasks){
  const r=records.get(q.id);assert.ok(r,q.id);assert.equal(r.issues.length,0);
  assert.ok([4,5,6].includes(q.grade));assert.ok(q.practiceOnly);assert.equal(q.school,'Математика');
  assert.match(q.sourceUrl,/^https:\/\/zerek\.app\/courses\/[456]-math\//);
  if(!files.has(r.file))files.set(r.file,read(base+r.file));
  const raw=files.get(r.file).questions[r.index];
  assert.equal(raw.id,q.sourceContentId);assert.ok(raw.checked&&raw.sourceAnswer&&raw.solution);
  assert.equal(crypto.createHash('sha256').update(canonical(raw)).digest('hex'),r.sourceSha256);
  if(raw.options?.length)assert.equal(raw.options.find(o=>o.correct)?.text,raw.sourceAnswer);
  const vector=vectors.get(q.image);
  if(q.sourceAdapted||r.sourceAdapted||vector?.sourceAdapted||vector?.method==='adapted_from_source_solution'){
   assert.equal(q.sourceAdapted,true,q.id);assert.equal(r.sourceAdapted,true,q.id);assert.equal(vector?.sourceAdapted,true,q.id);
   assert.equal(q.adaptationNote,r.adaptationNote,q.id);assert.ok(q.adaptationNote?.trim(),q.id);
   const figure=r.figureAdaptations?.find(f=>f.image===q.image);assert.ok(figure,q.id);
   assert.equal(figure.sha256,vector.sha256,q.id);assert.equal(figure.visualReview,'verified',q.id);
   assert.equal(figure.adaptationNote,vector.adaptationNote,q.id);
  }
  assert.doesNotMatch(q.statement+q.solution+q.answer,/[\\$]|\[Image:|\[SVG/);
  assert.equal(POOL.some(p=>p.id===q.id),false,q.id);
  assert.equal(BANK_QUARANTINE.some(p=>p.id===q.id),false,q.id);
 }
});

test('expanded source archive grades offline and is withheld from client and server delivery',async()=>{
 await ensureBankReady(async()=>[]);const require=createRequire(import.meta.url);
 const {findTrainingQuestion}=require('../backend/lib/training-question');
 const groups=new Map(await Promise.all([...new Set(tasks.map(q=>q.topic))].map(async t=>[t,await api.topicQuestions(t)])));
 for(const q of tasks){
  assert.equal(groups.get(q.topic).some(p=>p.id===q.id),false,q.id);assert.ok(isCorrect(q.answer,q),q.id);
  const server=await findTrainingQuestion(null,q.id);assert.equal(server,null,q.id);
  if(q.options){assert.equal(q.options.filter(o=>o===q.answer).length,1);for(const bad of q.options.filter(o=>o!==q.answer))assert.equal(isCorrect(bad,q),false,q.id);}
 }
});

test('prepared expansion archive diagrams have reviewed local SVGs with preserved paths and labels',()=>{
 for(const image of new Set(tasks.map(q=>q.image).filter(Boolean))){
  const v=vectors.get(image);assert.equal(v?.visualReview,'verified',image);
  const content=fs.readFileSync(new URL('../frontend/public'+image,import.meta.url),'utf8');
  assert.equal(crypto.createHash('sha256').update(content).digest('hex'),v.sha256);
  assert.match(content,/<svg[^>]+viewBox=/);
  assert.doesNotMatch(content,/<image\b|<script\b|<foreignObject\b|(?:href|onload|onclick)=|data:image/i);
  if(v.method==='source_linework_as_vector_paths')assert.ok(v.darkStrokeRecallWithin1Pixel>=.98,image);
 }
});

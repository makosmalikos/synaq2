import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {POOL,BANK_QUARANTINE,ensureBankReady} from '../frontend/src/bank.js';
import {api} from '../frontend/src/api.js';
import {isCorrect} from '../frontend/src/grading.js';
import {zerekImportedQuestions as tasks} from '../frontend/src/zerekImportedQuestions.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const manifest=read('problems/sources/zerek/vector-manifest.json').files;
const disposition=read('problems/sources/zerek/import-dispositions.json').records;
const bySource=new Map(manifest.map(f=>[f.sourceUrl,f]));
const collection=id=>read(`problems/sources/zerek/collections/${id}.json`);
const q=(c,n)=>tasks.find(q=>q.id===`zerek_${c}_${String(n).padStart(2,'0')}`);
const figureQuestion=i=>{
 const url=manifest[i].sourceUrl;
 for(const r of disposition.filter(r=>r.status==='ready'&&r.figureMethod)){
  const raw=collection(r.collection).questions[r.number-1];
  if(raw.images[0].src===url)return q(r.collection,r.number);
 }
 throw Error('Missing figure '+i);
};

test('every previously deferred collection record is prepared offline or resolved as a duplicate',()=>{
 assert.equal(disposition.filter(r=>r.status==='needs_review').length,0);
 assert.equal(tasks.length,2341);
 assert.equal(tasks.filter(q=>q.image).length,241);
 assert.equal(disposition.filter(r=>r.status==='duplicate').length,57);
 for(const f of manifest){
  assert.equal(f.visualReview,'verified');
  const svg=fs.readFileSync(new URL('../frontend/public'+f.image,import.meta.url),'utf8');
  assert.equal(crypto.createHash('sha256').update(svg).digest('hex'),f.vectorSha256);
  assert.match(svg,/<svg\b[^>]*viewBox=/);
  assert.doesNotMatch(svg,/<image\b|<script\b|<foreignObject\b|(?:href|onload|onclick)=|data:image/i);
 }
});

test('native counting diagrams match independently enumerated answers',()=>{
 const squares=(w,h)=>Array.from({length:Math.min(w,h)},(_,i)=>(w-i)*(h-i)).reduce((a,b)=>a+b);
 assert.equal(Number(figureQuestion(56).answer),squares(4,2));
 assert.equal(Number(figureQuestion(58).answer),squares(2,2));
 assert.equal(Number(figureQuestion(57).answer),3*4/2*2*3/2);
 assert.equal(Number(figureQuestion(188).answer),(4-2+1)**2);
 const perimeter=cells=>cells.reduce((p,[x,y])=>p+4-cells.filter(([a,b])=>Math.abs(a-x)+Math.abs(b-y)===1).length,0);
 assert.equal(Number(figureQuestion(52).answer),3*perimeter([[1,0],[0,1],[1,1],[1,2],[1,3],[2,3]]));
 assert.equal(Number(figureQuestion(54).answer),5*perimeter([[1,0],[0,1],[1,1],[0,2],[1,2],[2,2],[3,2],[3,3]]));
 assert.equal(Number(figureQuestion(53).answer),2*(4+2)*2);
 assert.equal(Number(figureQuestion(50).answer),8/10*100);
 assert.equal(Number(figureQuestion(51).answer),1/4*100);
 assert.equal(Number(figureQuestion(3).answer),8*15*5*3);
 // Enumerate cubes touched by all six drilled lines, including the two triple overlaps.
 const damaged=new Set();
 for(const [x,y,z] of [[1,2,1],[2,1,2]])for(let k=0;k<4;k++){
  damaged.add([k,y,z].join());damaged.add([x,k,z].join());damaged.add([x,y,k].join());
 }
 assert.equal(Number(figureQuestion(192).answer),4**3-damaged.size);
 assert.equal(Number(figureQuestion(203).answer),42*45/63);
 const dots=new Set();
 for(let x=0;x<4;x++)for(let y=0;y<4;y++)for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++){
  if(!dx&&!dy)continue;
  let p=[[x,y],[x+dx,y+dy],[x-dy,y+dx],[x+dx-dy,y+dy+dx]];
  if(p.every(([a,b])=>a>=0&&a<4&&b>=0&&b<4))dots.add(p.map(a=>a.join()).sort().join('|'));
 }
 assert.equal(Number(figureQuestion(216).answer),dots.size);
 const svg=fs.readFileSync(new URL('../frontend/public'+manifest[201].image,import.meta.url),'utf8');
 assert.match(svg,/>A<\/text>/); // Street-walk start point must not disappear in the redraw.
 assert.equal(Number(figureQuestion(201).answer),(4*3*2+4)*150);
});

test('recovered comparison, equation, clock and logical-set answers agree with independent models',()=>{
 const comparison=q('519d9601-52f3-4921-a641-97727807c89a',32);
 assert.ok((7+3)*24*60+5*60+26>14725);assert.equal(comparison.answer,'>');assert.ok(isCorrect('>',comparison));
 const equation=q('53025856-7d42-446c-81f4-4eb74911703b',1);assert.match(equation.answer,/57/);assert.equal((57-23)*15,6*85);
 const clock=q('ee35aa83-e2cf-48bc-bc54-548f281ae854',1);assert.equal(12*60-8-7,11*60+45);assert.match(clock.answer,/11:45/);
 const values=Array.from({length:99},(_,i)=>i+1).filter(x=>[x>=10,x%5===0,x<=50,Number.isInteger(Math.sqrt(x)),x%2===1].filter(Boolean).length===4);
 assert.deepEqual(values,[15,35,45,49]);
 assert.match(q('267aabbe-7f2f-429f-879f-9cc9cab75559',7).answer,/15, 35, 45, 49/);
 assert.ok(21**2<450&&450<22**2);
 assert.doesNotMatch(q('29fc4bd4-c0f4-467a-b21f-fb2b0f07f1ed',6).solution,/6,1|6\{,\}1/);
});

test('recovered source formats grade offline but are withheld from practice and mock delivery',async()=>{
 await ensureBankReady(async()=>[]);
 const sourceIds=new Set(tasks.map(q=>q.id));
 const practice=tasks.filter(q=>q.practiceOnly);
 assert.ok(practice.length>=28);
 assert.ok(POOL.every(q=>!sourceIds.has(q.id)));
 assert.ok(BANK_QUARANTINE.every(q=>!sourceIds.has(q.id)));
 const require=createRequire(import.meta.url);const {findTrainingQuestion}=require('../backend/lib/training-question');
 const topicQuestions=new Map(await Promise.all([...new Set(practice.map(q=>q.topic))].map(async topic=>[topic,await api.topicQuestions(topic)])));
 for(const item of practice){
  assert.ok(item.options?.length>=2);assert.ok(item.options.includes(item.answer));
  assert.ok(isCorrect(item.answer,item));
  assert.ok(topicQuestions.get(item.topic).every(q=>!sourceIds.has(q.id)));
  assert.equal(await findTrainingQuestion(null,item.id),null,item.id);
 }
 // Force every eligible question into the requested exam, so filtering is deterministic.
 const candidates=POOL.filter(q=>q.school==='РФМШ'&&!q.practiceOnly).slice(0,30);
 const excluded=POOL.filter(q=>!candidates.includes(q)).map(q=>q.id);
 const client=await api.mockRandom('РФМШ',{excludeQuestionIds:excluded});
 assert.deepEqual(new Set(client.questions.map(q=>q.id)),new Set(candidates.map(q=>q.id)));
 const {createMock,createWeeklyMock}=require('../backend/lib/mock-bank');
 const db={collection:()=>({get:async()=>({docs:practice.map(q=>({id:'test-'+q.id,data:()=>({...q,status:'published'})}))})})};
 for(const variant of [await createMock(db,'РФМШ'),await createWeeklyMock(db,'РФМШ','2026-10-19')])assert.ok(variant.questions.every(q=>!q.practiceOnly&&!q.id.startsWith('test-')));
});

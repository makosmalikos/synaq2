import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {POOL} from '../frontend/src/bank.js';
import {PUBLIC_MOCKS} from '../frontend/src/publicMockData.generated.js';
import {scorePublicMock} from '../frontend/src/publicMockScoring.js';
import {mockDisplayScore,mockSeries} from '../frontend/src/analytics.js';
import {mockReviewSummary,mockNavigationGroups} from '../frontend/src/mockReviewModel.js';
import {isCorrect} from '../frontend/src/grading.js';
import {rfmshIntegerAnswer} from '../frontend/src/rfmshScoring.js';
const require=createRequire(import.meta.url);
const {FORMAT,reviewedLevel,integerAnswerCorrect}=require('../backend/lib/rfmsh-format');
const {createMock,createWeeklyMock,createPreviewMock,restoreMock,gradeMock,publicMock,mockCatalog}=require('../backend/lib/mock-bank');
const review=require('../backend/data/rfmshReviewedLevels.json');
const db={collection:()=>({get:async()=>({docs:[]})})};
const session=variant=>({...variant,attemptId:'rfmsh_test_attempt',questionRefs:variant.questions.map(q=>({id:q.id,num:q.num,section:q.section,examLevel:q.examLevel,subject:q.subject}))});

function assertFormat(variant){
 assert.equal(variant.questions.length,30);assert.equal(variant.timeLimitMin,120);assert.equal(variant.maxPoints,150);assert.equal(variant.scoring,'rfmsh');
 assert.deepEqual(variant.questions.map(q=>q.examLevel),Array(10).fill('A').concat(Array(10).fill('B'),Array(10).fill('C')));
 assert.equal(new Set(variant.questions.map(q=>q.id)).size,30);
 assert.ok(variant.questions.every(q=>!q.options&&/^-?\d+$/.test(String(q.answer))&&reviewedLevel(q)===q.examLevel));
 assert.equal(variant.questions.reduce((sum,q)=>sum+q.examPoints,0),150);
}

test('random, weekly and free RFMSH use 10 reviewed A/B/C questions and 120 minutes',async()=>{
 for(const variant of [await createMock(db,'РФМШ'),await createPreviewMock(db,'РФМШ'),await createWeeklyMock(db,'РФМШ','2026-10-26')]){
  assertFormat(variant);const restored=await restoreMock(db,session(variant));assertFormat(restored);
  assert.ok(publicMock(restored).questions.every(q=>!Object.hasOwn(q,'answer')&&!Object.hasOwn(q,'solution')));
 }
 const info=(await mockCatalog(db)).find(s=>s.code==='РФМШ');assert.equal(info.maxPoints,150);assert.equal(info.ready,true);
 assert.deepEqual(info.levels.map(x=>[x.level,x.count,x.points]),[['A',10,3],['B',10,5],['C',10,7]]);
 const a=await createWeeklyMock(db,'РФМШ','2026-10-26'),b=await createWeeklyMock(db,'РФМШ','2026-11-02');
 assert.notDeepEqual(a.questions.map(q=>q.id),b.questions.map(q=>q.id));assertFormat(b);
});

test('levels are an explicit content-bound editorial decision, never arbitrary difficulty or position',()=>{
 assert.equal(review.records.length,78);
 for(const row of review.records){
  const q=POOL.find(q=>q.id===row.id);assert.equal(reviewedLevel(q),row.level,row.id);
  assert.equal(reviewedLevel({...q,answer:'forged'}),null);
  assert.equal(reviewedLevel({...q,statement:q.statement+' replacement'}),null);
  assert.equal(reviewedLevel({...q,options:['1','2']}),null);
 }
 assert.equal(reviewedLevel({id:'unknown',school:'РФМШ',difficulty:3,answer:'7',examLevel:'C'}),null);
});

test('RFMSH score is 3/5/7 with zero for errors and omissions; all displays agree',async()=>{
 const variant=await createPreviewMock(db,'РФМШ'),run=session(variant),answers={};
 for(const index of [0,10,20])answers[index+1]=String(variant.questions[index].answer);
 answers[2]='wrong';
 const result=await gradeMock(db,run,answers);
 assert.deepEqual([result.score,result.wrong,result.unanswered,result.points,result.maxPoints],[3,1,26,15,150]);
 assert.deepEqual(mockDisplayScore({...result,school:'РФМШ'}),{score:15,max:150});
 assert.deepEqual([mockReviewSummary(result.review,'РФМШ').score,mockReviewSummary(result.review,'РФМШ').max],[15,150]);
 assert.deepEqual(mockSeries([{...result,school:'РФМШ',at:{seconds:1}}]).map(x=>[x.score,x.max]),[[15,150]]);
 const groups=mockNavigationGroups(result.review);assert.deepEqual(groups.map(g=>g.examLevel),['A','B','C']);
 assert.deepEqual(groups.flatMap(g=>g.questions.map(x=>x.index)),Array.from({length:30},(_,i)=>i));
 const publicAnswers=Object.fromEntries(PUBLIC_MOCKS['РФМШ'].questions.map((q,index)=>[q.id,answers[index+1]??'']));
 const publicResult=scorePublicMock(PUBLIC_MOCKS['РФМШ'].questions,publicAnswers,'РФМШ');
 assert.deepEqual([publicResult.correct,publicResult.points,publicResult.maxPoints,publicResult.pct],[3,15,150,10]);
 const all=await gradeMock(db,run,Object.fromEntries(variant.questions.map(q=>[q.num,String(q.answer)])));
 assert.equal(all.points,150);assert.equal((await gradeMock(db,run,{})).points,0);
});

test('only integer answers are accepted on server, landing and retries',async()=>{
 const q=(await createPreviewMock(db,'РФМШ')).questions[0];
 for(const given of [q.answer,`  +000${q.answer}  `])for(const grade of [integerAnswerCorrect,rfmshIntegerAnswer])assert.equal(grade(given,q.answer),true);
 for(const given of [`${q.answer}.0`,`${q.answer},0`,`${q.answer}/1`,`${q.answer} см`,'1e2','Infinity','',null]){
  assert.equal(integerAnswerCorrect(given,q.answer),false,String(given));assert.equal(rfmshIntegerAnswer(given,q.answer),false);assert.equal(isCorrect(given,q),false);
 }
 assert.equal(integerAnswerCorrect('-0007','-7'),true);assert.equal(integerAnswerCorrect('0','0'),true);
});

test('invalid level/format/count is rejected; legacy attempts keep the previous unweighted score',async()=>{
 const variant=await createPreviewMock(db,'РФМШ'),run=session(variant);
 for(const bad of [{...run,timeLimitMin:135},{...run,examFormat:'fake'},{...run,questionRefs:run.questionRefs.slice(0,20)},{...run,questionRefs:run.questionRefs.map((q,i)=>i===0?{...q,examLevel:'C'}:q)}])await assert.rejects(restoreMock(db,bad));
 const legacy={...run,preview:true,scoring:undefined,examFormat:undefined};
 const result=await gradeMock(db,legacy,{1:String(variant.questions[0].answer)});
 assert.equal(result.score,1);assert.equal(result.points,undefined);assert.equal(result.review[0].examLevel,undefined);
 assert.deepEqual(mockDisplayScore({...result,school:'РФМШ'}),{score:1,max:30});
});

const test=require('node:test');const assert=require('node:assert/strict');
const {examChoice}=require('../backend/lib/school-exam-format');
const {createWeeklyMock,restoreMock,gradeMock,publicMock}=require('../backend/lib/mock-bank');
const db={collection:()=>({get:async()=>({docs:[]})})};
for(const school of ['БИЛ','НИШ'])test(`${school}: new weekly exams have complete subject quotas and four valid displayed choices`,async()=>{
 const v=await createWeeklyMock(db,school,'2026-10-26');assert.equal(v.questions.length,school==='БИЛ'?60:180);assert.equal(v.shortened,false);
 for(const q of v.questions){assert.equal(q.options.length,4,q.id);assert.equal(new Set(q.options).size,4,q.id);assert.ok(q.options.includes(q.answer),q.id);}
 const reading=v.questions.filter(q=>['reading','rus','kaz','eng'].includes(q.subject));
 assert.equal(reading.length,school==='БИЛ'?10:60);
 for(const q of reading)assert.match(q.id,school==='БИЛ'?/^bil_official_2025_reading_/:/^nis_official_language_2024_/);
 const session={...v,attemptId:'test_school',questionRefs:v.questions.map(({id,num,section,subject})=>({id,num,section,subject}))};
 const restored=await restoreMock(db,session);assert.deepEqual(restored.questions.map(q=>q.options),v.questions.map(q=>q.options));
 const graded=await gradeMock(db,session,Object.fromEntries(v.questions.map(q=>[q.num,q.answer])));assert.equal(graded.score,v.questions.length);
 assert.ok(publicMock(v).questions.every(q=>!Object.hasOwn(q,'answer')));
 if(school==='БИЛ')assert.equal(graded.points,240);
});
test('five lettered figure choices are never silently relabelled when converted to four',()=>{
 assert.equal(examChoice({id:'figure',image:'/figures/bil_v1_q14.svg',options:['A','B','C','D','E'],answer:'E'}),null);
});

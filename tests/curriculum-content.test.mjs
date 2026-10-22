import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM, createCurriculumQuestions, curriculumAnswersMatch } from '../frontend/src/curriculumData.js';
import { createLessonExercise, lessonWorkedExample } from '../frontend/src/curriculumLessonContent.js';
import { curriculumLessonPages, curriculumTheoryStudied } from '../frontend/src/curriculumProgress.js';

const topics=Object.values(CURRICULUM).flat();
const sample=(key,rng=()=>.5)=>createLessonExercise({key},'easy',rng);
const numeric=s=>s.includes('/')?s.split('/').map(Number).reduce((a,b)=>a/b):Number(s);

test('all 178 lesson readers have stable bilingual examples and preserve saved reading steps',()=>{
 assert.equal(topics.length,178);
 for(const topic of topics){
   const example=lessonWorkedExample(topic);
   assert.deepEqual(example,lessonWorkedExample(topic));
   assert.equal(topic.lecture.length,4);
   assert.deepEqual(curriculumLessonPages(topic),['intro',0,1,2,3,'check','summary']);
   assert.equal(curriculumTheoryStudied(topic,{completedSteps:['intro',0,1,2,3],checkPassed:true,studiedAt:1}),true);
   assert.ok(topic.workedSteps.length===4);
   for(const lang of ['ru','kk']){
     assert.ok(topic.rule[lang].length>25,topic.key);
     assert.ok(topic.lecture[2][1][lang].includes(example.text[lang]),topic.key);
     assert.ok(topic.lecture[2][2][lang].includes(example.solution[lang]),topic.key);
     assert.doesNotMatch(topic.lecture.flat().map(x=>x[lang]).join(' '),/Объясни каждый переход|найди в ней идею темы|готовое правило, но и почему оно работает/);
   }
 }
});

test('live questions exclude all worked-example metadata',()=>{
 for(const topic of topics){
   for(const q of createCurriculumQuestions(topic,'mixed',3)){
     assert.deepEqual(Object.keys(q).sort(),['answer','id','solution','text']);
     assert.equal(q.lesson,undefined);
   }
 }
});

test('rounding exercises use the precision named by the lesson',()=>{
 for(const [index,precision,expected] of [[1,10,4890],[2,100,4900],[3,1000,5000]]){
   const q=sample(`g4-round-${index}`,()=>.4321);
   assert.match(q.text.ru,/4888/);
   assert.equal(Number(q.answer),expected);
   assert.equal(Number(q.answer)%precision,0);
 }
});

test('coordinate rays, reduction, fraction subtraction, and decimal rounding have exact answers',()=>{
 assert.equal(sample('g5-natural-2').answer,'21'); // 5 + 4 × 4
 assert.equal(sample('g5-fraction-2').answer,'1/2'); // 12/24
 assert.equal(sample('g5-fraction-add-2').answer,'1/3'); // 4/6 − 2/6
 const decimal=sample('g5-decimals-3'),number=Number(decimal.text.ru.match(/\d+,\d+/)[0].replace(',','.'));
 assert.equal(Number(decimal.answer),Math.round(number*10)/10);
 const fraction=sample('g5-fraction-add-2');
 assert.match(fraction.text.ru,/ − /);assert.doesNotMatch(fraction.text.ru,/ \+ /);
});

test('word problem prices and same-direction speeds stay valid for their grade',()=>{
 for(let i=0;i<100;i++){
   const q=sample('g3-review-3',Math.random),values=q.text.ru.match(/\d+/g).map(Number);
   assert.equal(Number(q.answer),values[0]+values[1]-values[2]);
   const price=sample('g6-linear-3',Math.random);
   assert.ok(Number(price.answer)>0);
   const moving=sample('g5-motion-3',Math.random),speeds=moving.text.ru.match(/\d+/g).map(Number);
   assert.ok(speeds[0]>speeds[1]);
   assert.equal(Number(moving.answer),(speeds[0]-speeds[1])*speeds[2]);
 }
});

test('inverse proportionality keeps fractional answers exact',()=>{
 const values=[0,0,0,.15],q=sample('g6-dependencies-2',()=>values.shift()??0);
 assert.equal(q.answer,'4/3');
 assert.equal(curriculumAnswersMatch('28/21',q.answer),true);
 assert.equal(curriculumAnswersMatch('1.333333',q.answer),false);
 assert.equal(numeric(q.answer)*3,4);
});

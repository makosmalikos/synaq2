import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURRICULUM } from '../frontend/src/curriculumData.js';
import { CURRICULUM_CATALOG } from '../frontend/src/curriculumCatalog.generated.js';
import { checkCurriculumCatalog } from '../scripts/generate-curriculum-catalog.mjs';
import { curriculumLessonPages, curriculumProgressModel, curriculumTheoryStudied, emptyCurriculumTheory, updateCurriculumTheory, mergeCurriculumLesson } from '../frontend/src/curriculumProgress.js';
import { topics } from '../frontend/src/data.js';
import { MENTOR_TOPICS } from '../frontend/src/topicCatalog.generated.js';
import { TOPIC_NAMES, topicName } from '../frontend/src/topicNames.js';
import { topicName as legacyTopicName, DIAGNOSTIC_QUESTIONS } from '../frontend/src/diagnosticData.js';

const src=fileURLToPath(new URL('../frontend/src/',import.meta.url));
function staticDependencies(entry,seen=new Set()){
 const file=path.resolve(src,entry);if(seen.has(file))return seen;seen.add(file);
 for(const match of fs.readFileSync(file,'utf8').matchAll(/^\s*(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"]([^'"]+)['"]/gm)){
  if(match[1].startsWith('.')&&/\.(js|jsx)$/.test(match[1]))staticDependencies(path.relative(src,path.resolve(path.dirname(file),match[1])),seen);
 }
 return seen;
}

test('the student shell, home and mentor cannot eagerly import the exam bank or lesson engine',()=>{
 for(const entry of ['PlatformApp.jsx','Home.jsx','HomeCourseProgress.jsx','components/Mentor.jsx','Parent.jsx','Progress.jsx']){
  const deps=staticDependencies(entry);
  for(const file of ['bank.js','data.js','api.js','curriculumData.js','curriculumLessonContent.js','diagnosticData.js'])assert.equal(deps.has(path.join(src,file)),false,`${entry} imports ${file}`);
 }
 const shell=staticDependencies('PlatformApp.jsx');
 assert.equal(shell.has(path.join(src,'Home.jsx')),false,'parents and sign-in must not download the child dashboard');
});

test('lightweight curriculum metadata matches every full lesson and persisted reading step',()=>{
 assert.equal(checkCurriculumCatalog(),true);
 for(const grade of [3,4,5,6]){
  assert.deepEqual(CURRICULUM_CATALOG[grade].map(t=>t.key),CURRICULUM[grade].map(t=>t.key));
  for(const topic of CURRICULUM[grade]){
   const light=CURRICULUM_CATALOG[grade].find(t=>t.key===topic.key);
   assert.deepEqual(light.title,topic.title);assert.equal(light.quarter,topic.quarter);
   assert.deepEqual(curriculumLessonPages(light),curriculumLessonPages(topic));
   assert.equal(light.rule,undefined);assert.equal(light.lecture,undefined);assert.equal(light.workedSteps,undefined);
   const partial=updateCurriculumTheory(emptyCurriculumTheory('child'),topic,{step:'intro',advance:true,now:1});
   const complete=curriculumLessonPages(light).slice(0,-1).reduce((record,step,i)=>updateCurriculumTheory(record,light,{step,advance:true,checkPassed:step==='check',now:i+2}),partial);
   const merged=mergeCurriculumLesson(light,partial.lessons[topic.key],complete.lessons[topic.key]);
   assert.equal(curriculumTheoryStudied(topic,merged),true);
  }
 }
 const next=curriculumProgressModel({grade:5,plan:'pro'}).nextTopic;
 assert.ok(next);assert.ok(CURRICULUM[5].find(t=>t.key===next.key)?.lecture.length===4,'catalog recommendations must resolve to a readable lesson');
});

test('mentor topic choices and diagnostic topic translations retain their original contracts',()=>{
 assert.deepEqual(MENTOR_TOPICS,topics.filter(t=>t.block==='math'));
 assert.equal(topicName,legacyTopicName);
 for(const lang of ['ru','kk'])for(const id of Object.keys(TOPIC_NAMES))assert.equal(topicName(id,lang),TOPIC_NAMES[id][lang]);
 for(const list of Object.values(DIAGNOSTIC_QUESTIONS))for(const question of list)assert.notEqual(topicName(question.topic,'ru'),question.topic);
 assert.equal(topicName('unknown','ru'),'unknown');
});

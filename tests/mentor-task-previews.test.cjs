const test=require('node:test');
const assert=require('node:assert/strict');
const {mentorTaskPreviews}=require('../backend/lib/mentor-task-previews');
const {findTrainingQuestion}=require('../backend/lib/training-question');
const {fakeFirestore}=require('./helpers/fake-firestore.cjs');

test('mentor preview requests resolve only the selected tasks and never expose solutions or private note fields',async()=>{
 const seen=[],tasks=[{key:'saved-a',qid:'a',topic:'Дроби',childUid:'private-child',answer:'private'},{key:'saved-b',qid:'b'}];
 const result=await mentorTaskPreviews({},tasks,async(_db,id)=>{seen.push(id);return{statement:'Разобрать\n дробь '.repeat(20),answer:'42',solution:'Hidden solution',source:'Private source'};});
 assert.deepEqual(seen,['a','b']);
 for(const task of result){assert.deepEqual(Object.keys(task).sort(),['key','preview','qid','topic']);assert.ok(task.preview.length<=120);assert.doesNotMatch(task.preview,/\n|Hidden|private/);}
 assert.equal(result[0].key,'saved-a');assert.equal(result[0].qid,'a');
 assert.deepEqual(await mentorTaskPreviews({},[],()=>assert.fail('empty list should not load a question bank')),[]);
});

test('unavailable task previews keep the saved task available and do not leak lookup errors',async()=>{
 const tasks=[{key:'saved',qid:'unavailable',topic:'Тема'}];
 const result=await mentorTaskPreviews({},tasks,()=>{throw Error('private infrastructure detail');});
 assert.deepEqual(result,[{key:'saved',qid:'unavailable',topic:'Тема',preview:''}]);
});

test('a saved qid cannot reveal a paid adaptation preview after downgrade or before review',async()=>{
 const task={key:'saved',qid:'synaq_adapted_preview_test',topic:'Числа'};
 const reviewed={id:task.qid,minimumPlan:'pro',editorialStatus:'verified',sourceProvider:'zerek',statement:'Private paid condition',answer:'4'};
 for(const plan of ['free','standard'])assert.equal((await mentorTaskPreviews({},[task],async()=>reviewed,{plan}))[0].preview,'');
 for(const plan of ['pro','mentor'])assert.equal((await mentorTaskPreviews({},[task],async()=>reviewed,{plan}))[0].preview,'Private paid condition');
 for(const q of [{...reviewed,editorialStatus:'draft'},{...reviewed,id:'zerek_crypt_01'}]){
  assert.equal((await mentorTaskPreviews({},[task],async()=>q,{plan:'mentor'}))[0].preview,'');
 }
});

test('shared lookup accepts published content and rejects drafts, missing answers and missing tasks',async()=>{
 const db=fakeFirestore({
  'bankTasks/published':{topic:'eq',school:'БИЛ',statement:'Найди x: x + 2 = 4.',answer:'2',solution:'private',status:'published'},
  'bankTasks/draft':{topic:'eq',statement:'draft secret',answer:'1',status:'draft'},
  'bankTasks/broken':{topic:'eq',statement:'broken secret',answer:'',status:'published'},
 });
 assert.ok(await findTrainingQuestion(db,'published'));
 assert.equal(await findTrainingQuestion(db,'draft'),null);
 assert.equal(await findTrainingQuestion(db,'broken'),null);
 assert.equal(await findTrainingQuestion(db,'missing'),null);
 assert.equal(await findTrainingQuestion(db,'nested/path'),null);
 const previews=await mentorTaskPreviews(db,[{key:'a',qid:'published'},{key:'b',qid:'draft'},{key:'c',qid:'broken'}]);
 assert.equal(previews[0].preview,'Найди x: x + 2 = 4.');assert.equal(previews[1].preview,'');assert.equal(previews[2].preview,'');
});

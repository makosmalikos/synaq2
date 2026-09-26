import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { CURRICULUM } from '../frontend/src/curriculumData.js';

const source=fs.readFileSync(new URL('../frontend/src/Curriculum.jsx',import.meta.url),'utf8');
const storageHelpers=source.slice(source.indexOf('const curriculumPracticeKey'),source.indexOf('const copies=')).replaceAll('export function ','function ');
const handlers=source.slice(source.indexOf(' function storePractice('),source.indexOf(' const openTopic='));
const effects=source.slice(source.indexOf(' useEffect(()=>{\n   practiceRef.current=null;'),source.indexOf(' },[uid]);')+' },[uid]);'.length);
const entitlementEffect=source.slice(source.indexOf(' useEffect(()=>{\n   const practice=practiceRef.current;'),source.indexOf(' },[plan,uid]);')+' },[plan,uid]);'.length);
const pureHandlers=handlers.replace(effects,'').replace(entitlementEffect,'');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return{promise,resolve,reject}};
const copy=value=>JSON.parse(JSON.stringify(value));
function memoryStorage(){const data=new Map();return{data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)}}
function fixture({uid='kid',isPro=true,count=5,level='mixed',storage=memoryStorage(),start,save}={}){
 let nextId=1,startImpl=start,saveImpl=save;
 const state={SaveState:'idle'},starts=[],saves=[],xp=[],upgrades=[];
 const context={
   uid,isPro,isStandard:false,plan:isPro?'pro':'free',grade:3,topic:CURRICULUM[3][0],count,level,recoveryError:false,CURRICULUM,
   practiceRef:{current:null},operationRef:{current:null},mounted:{current:true},onXpRef:{current:(...args)=>xp.push(args)},
   auth:{currentUser:{uid}},crypto:{randomUUID:()=>`uuid-${nextId++}`},sessionStorage:storage,
   canOpen:()=>true,onUpgrade:()=>upgrades.push(true),
   startLearningSession:async(...args)=>{starts.push(args);return startImpl?startImpl(...args):{id:args[2],question:{id:`q-${args[2]}`,text:{ru:'2 + 2?',kk:'2 + 2?'}},startedAt:1000,expiresAt:86401000}},
   saveAttempt:async(...args)=>{saves.push(args);return saveImpl?saveImpl(...args):{saved:true,correct:true,answer:'4',solution:{ru:'2 + 2 = 4',kk:'2 + 2 = 4'},gain:5,totalXp:15,count:2,secs:10}},
   useEffect:effect=>effect(),
 };
 context.isCurrent=()=>context.mounted.current&&context.auth.currentUser?.uid===uid;
 for(const name of ['RecoveryAvailable','Session','Grade','Count','Level','Topic','Dialog','SaveState','RequestError','RecoveryError','Ready','LessonStep'])context[`set${name}`]=value=>{state[name]=typeof value==='function'?value(state[name]):value};
 vm.createContext(context);vm.runInContext(storageHelpers+pureHandlers,context);
 return{context,state,storage,starts,saves,xp,upgrades,
  load:()=>vm.runInContext(effects,context),upgrade:()=>{context.isPro=true;context.plan='pro';vm.runInContext(entitlementEffect,context)},
  setStart:value=>{startImpl=value},setSave:value=>{saveImpl=value},
  read:()=>context.readCurriculumPractice(uid),
  begin:()=>context.begin(),answer:value=>context.changeAnswer(value),check:()=>context.check(),next:()=>context.next(),
 };
}

test('Curriculum receives one server question and sends only sessionId/answer for grading',async()=>{
 const f=fixture({count:10,level:'hard'});f.begin();await tick();
 assert.equal(f.starts.length,1);assert.deepEqual(copy(f.starts[0]),['kid',{mode:'curriculum',topicKey:CURRICULUM[3][0].key,level:'hard'},'uuid-2']);
 assert.equal(f.state.Session.count,10);assert.equal(f.state.Session.questionSession.question.answer,undefined);
 f.answer(' 4 ');f.check();await tick();
 assert.deepEqual(copy(f.saves[0]),['kid',{sessionId:'uuid-2',answer:'4'},'uuid-2']);
 assert.equal(f.state.Session.score,1);assert.equal(f.state.Session.feedback.correct,true);
 assert.equal(f.state.Session.feedback.solution.ru,'2 + 2 = 4');assert.deepEqual(f.xp,[[5,15]]);
 assert.ok(!pureHandlers.includes('curriculumAnswersMatch'));assert.ok(!pureHandlers.includes('createCurriculumQuestions'));
});

test('same-render begin and next are guarded and start retries retain the stable ID',async()=>{
 const wait=deferred(),f=fixture({start:()=>wait.promise});f.begin();f.begin();
 assert.equal(f.starts.length,1);assert.equal(f.read().record.pendingStart.id,'uuid-2');
 wait.reject(Error('lost response'));await tick();assert.equal(f.state.RequestError,'network');
 f.setStart(async(_uid,_payload,id)=>({id,question:{text:{ru:'2+2',kk:'2+2'}}}));await f.context.requestQuestion();
 assert.equal(f.starts[1][2],f.starts[0][2]);
 f.answer('4');f.check();await tick();f.next();f.next();await tick();
 assert.equal(f.starts.length,3);assert.equal(f.state.Session.index,1);assert.equal(f.starts[2][2],'uuid-3');
});

test('feedback and score appear only after server confirmation, never from a local guessed answer',async()=>{
 const wait=deferred(),f=fixture({save:()=>wait.promise});f.begin();await tick();f.answer('4');f.check();f.check();
 assert.equal(f.saves.length,1);assert.equal(f.state.Session.feedback,null);assert.equal(f.state.Session.score,0);
 assert.equal(f.state.SaveState,'saving');f.answer('5');assert.equal(f.state.Session.answer,'4');
 wait.resolve({saved:true,correct:false,answer:'5',solution:{ru:'Серверный разбор',kk:'Талдау'},gain:0,totalXp:10});await tick();
 assert.equal(f.state.Session.score,0);assert.equal(f.state.Session.feedback.correct,false);
 assert.equal(f.state.Session.feedback.answer,'5');assert.deepEqual(f.xp,[[0,10]]);
});

test('pending answer refresh retries the same session and replay counts correctness exactly once',async()=>{
 const first=fixture({save:async()=>{throw Error('lost acknowledgement')}});first.begin();await tick();first.answer('4');first.check();await tick();
 assert.equal(first.state.SaveState,'error');assert.equal(first.read().record.pendingSave.id,'uuid-2');
 first.context.leave();assert.ok(first.state.Session,'an ambiguous save cannot be discarded by the back button');
 const refreshed=fixture({storage:first.storage,save:async()=>({saved:false,correct:true,answer:'4',solution:{ru:'Верно',kk:'Дұрыс'},gain:0,totalXp:15})});
 refreshed.load();await tick();
 assert.deepEqual(copy(refreshed.saves[0]),copy(first.saves[0]));assert.equal(refreshed.state.Session.score,1);assert.deepEqual(refreshed.xp,[[0,15]]);
 assert.equal(refreshed.read().record.pendingSave,null);assert.equal(refreshed.read().record.feedback.correct,true);
 const again=fixture({storage:first.storage});again.load();await tick();
 assert.equal(again.saves.length,0);assert.equal(again.state.Session.score,1);assert.equal(again.xp.length,0);
});

test('refresh recovers unsubmitted answer and current question without asking the server for a new one',async()=>{
 const first=fixture();first.begin();await tick();first.answer('12,5');
 const refreshed=fixture({storage:first.storage});refreshed.load();await tick();
 assert.equal(refreshed.starts.length,0);assert.equal(refreshed.saves.length,0);
 assert.equal(refreshed.state.Session.questionSession.id,'uuid-2');assert.equal(refreshed.state.Session.answer,'12,5');
 assert.equal(refreshed.state.Topic.key,CURRICULUM[3][0].key);
});

test('refresh during a lost start response reuses the original start ID',async()=>{
 const first=fixture({start:async()=>{throw Error('offline')}});first.begin();await tick();
 const refreshed=fixture({storage:first.storage});refreshed.load();await tick();
 assert.equal(refreshed.starts[0][2],first.starts[0][2]);assert.equal(refreshed.state.Session.questionSession.id,'uuid-2');
 assert.equal(refreshed.read().record.pendingStart,null);
});

test('free configuration is easy/five and server Pro/daily/rate limits are terminal, not an automatic retry loop',async()=>{
 for(const code of ['learning/daily-limit','learning/pro-required','learning/rate-limit']){
  const first=fixture({isPro:false,count:20,level:'hard',start:async()=>{throw Object.assign(Error('blocked'),{code})}});
  first.begin();await tick();assert.equal(first.starts[0][1].level,'easy');assert.equal(first.state.Session.count,5);
  assert.equal(first.state.RequestError,code);assert.ok(first.context.curriculumPracticeError(code,true).length>20);
  const refreshed=fixture({storage:first.storage});refreshed.load();await tick();assert.equal(refreshed.starts.length,0);
  assert.equal(refreshed.state.RequestError,code);refreshed.context.leave();assert.equal(refreshed.state.Session,null);
 }
 assert.match(source,/\['learning\/daily-limit','learning\/pro-required'\].includes\(requestError\).*onClick=\{onUpgrade\}/);
});

test('expired questions get a new stable session without losing earlier confirmed score or advancing position',async()=>{
 const f=fixture();f.begin();await tick();f.answer('4');f.check();await tick();f.next();await tick();
 f.setSave(async()=>{throw Object.assign(Error('expired'),{code:'learning/session-expired'})});f.answer('4');f.check();await tick();
 assert.equal(f.state.Session.score,1);assert.equal(f.state.RequestError,'learning/session-expired');
 f.context.replaceExpired();await tick();assert.equal(f.state.Session.index,1);assert.equal(f.state.Session.score,1);
 assert.equal(f.state.Session.questionSession.id,'uuid-4');assert.equal(f.state.Session.answer,'');assert.equal(f.state.Session.pendingSave,null);
});

test('a real Pro update resumes the same rejected free answer without discarding it or looping',async()=>{
 const f=fixture({isPro:false,save:async()=>{throw Object.assign(Error('daily limit'),{code:'learning/daily-limit'})}});
 f.begin();await tick();f.answer('4');f.check();await tick();assert.equal(f.state.RequestError,'learning/daily-limit');
 f.setSave(async()=>({saved:true,correct:true,gain:5,totalXp:20}));f.upgrade();await tick();
 assert.equal(f.saves.length,2);assert.equal(f.saves[0][2],f.saves[1][2]);assert.equal(f.state.Session.score,1);
 assert.equal(f.state.RequestError,'');f.upgrade();await tick();assert.equal(f.saves.length,2);
});

test('finishing chosen practice length clears its journal only after all answers are confirmed',async()=>{
 const f=fixture();f.begin();await tick();
 for(let index=0;index<5;index++){
  assert.equal(f.state.Session.index,index);f.answer('4');f.check();await tick();f.next();await tick();
 }
 assert.equal(f.state.Session.finished,true);assert.equal(f.state.Session.score,5);assert.equal(f.starts.length,5);
 assert.equal(f.read().record,null);f.context.leave();assert.equal(f.state.Session,null);
});

test('late server responses do not touch a changed UID or unmounted component',async()=>{
 const wait=deferred(),f=fixture({start:()=>wait.promise});f.begin();f.context.auth.currentUser={uid:'other-kid'};
 const before=copy(f.state);wait.resolve({id:'uuid-2',question:{text:{ru:'2+2',kk:'2+2'}}});await tick();
 assert.deepEqual(copy(f.state),before);assert.ok(f.read().record.pendingStart);
 const saving=deferred(),second=fixture({save:()=>saving.promise});second.begin();await tick();second.answer('4');second.check();
 second.context.mounted.current=false;const snapshot=copy(second.state);
 saving.resolve({saved:true,correct:true,gain:5,totalXp:15});await tick();
 assert.deepEqual(copy(second.state),snapshot);assert.equal(second.xp.length,0);assert.ok(second.read().record.pendingSave);
});

test('blocked storage is explicit but an online confirmed practice remains usable',async()=>{
 const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('quota')},removeItem(){throw Error('blocked')}};
 const f=fixture({storage:blocked});f.load();assert.equal(f.state.RecoveryAvailable,false);f.begin();await tick();
 f.answer('4');f.check();await tick();assert.equal(f.state.Session.score,1);assert.equal(f.state.SaveState,'saved');
 f.context.leave();assert.equal(f.state.Session,null);
});

test('invalid and foreign journals are rejected without trusting old client-side correctness',async()=>{
 const f=fixture();f.begin();await tick();const [key,raw]=[...f.storage.data.entries()][0],record=JSON.parse(raw);
 assert.equal(f.context.readCurriculumPractice('other-kid').record,null);
 for(const patch of [{version:0},{uid:'other-kid'},{topicKey:'unknown'},{count:10000},{index:100},{pendingSave:{id:'legacy',payload:{correct:true}}}]){
  f.storage.data.set(key,JSON.stringify({...record,...patch}));assert.equal(f.read().error,'invalid');
 }
 const refreshed=fixture({storage:f.storage});refreshed.load();assert.equal(refreshed.state.RecoveryError,true);
 assert.equal(refreshed.starts.length,0);assert.equal(refreshed.saves.length,0);
});

test('the answer journal never submits qid/correct/secs and local mini quizzes remain uncredited',()=>{
 assert.match(source,/pendingSave:\{id,payload:\{sessionId:id,answer:practice.answer.trim\(\)\}\}/);
 assert.doesNotMatch(pureHandlers,/correct:\s*(ok|true)|qid:|secs:|trainingTopicForKind/);
 assert.match(source,/setMiniFeedback\(curriculumAnswersMatch\(miniAnswer,miniQ.answer\)\)/);
});

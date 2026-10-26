import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { readMockSession,writeMockSession,clearMockSession,discardMockSession,readMockStart,writeMockStart,mockRemaining,mockSpent,mockClockOffset } from '../frontend/src/mockPersistence.js';
const source=fs.readFileSync(new URL('../frontend/src/components/Mock.jsx',import.meta.url),'utf8');
const storage=()=>{const data=new Map();return{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const clone=value=>JSON.parse(JSON.stringify(value));
const record=(uid='kid')=>({uid,id:'mock_attempt_a',school:'БИЛ',test:{id:'mock_attempt_a',school:'БИЛ',questions:[{id:'q1',num:1,section:1,statement:'2+2'}]},meta:{school:'БИЛ'},answers:{1:'4'},flags:{},index:0,startedAt:1000,deadline:61000,pausedAt:null,pausedMs:0,isDiagnosticRun:false,result:null,pending:null});
function fixture(){
 const store=storage(),value=record(),state={},calls=[];
 const context={uid:'kid',ru:true,isCurrent:()=>true,mockRemaining,mockClockOffset,clearInterval(){},runRef:{current:value},submittingRef:{current:false},tick:{},attemptId:{},pendingSave:{},deadlineRef:{},pausedAtRef:{},generationRef:{current:0},startingRef:{current:false},savingRef:{},recoveryRetry:0,
 writeMockSession:r=>writeMockSession(r,store),readMockSession:uid=>readMockSession(uid,store),readMockStart:()=>null,clearMockStart(){},useEffect:effect=>effect(),
 mockSubmit:(...args)=>{const call={args,...deferred()};calls.push(call);return call.promise;},
 };
 for(const name of ['School','Test','Meta','Answers','Flags','I','Pause','Left','HideTimer','IsDiagnosticRun','Result','RecoveryAvailable','SaveState','ConfirmFinish','SessionReady','RecoveryError','StartError','Starting']) context[`set${name}`]=value=>{state[name]=value;};
 vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('  function applyRun('),source.indexOf('  useEffect(() => {\n    let alive = true;'))+source.slice(source.indexOf('  async function submit()'),source.indexOf('  function resumeExam()')),context);
 return{context,state,store,calls,record:value,submit:()=>context.submit()};
}

test('mock retries keep the exact frozen answers through a lost response and duplicate finish clicks',async()=>{
 const f=fixture();const first=f.submit();await f.submit();assert.equal(f.calls.length,1);
 assert.deepEqual(readMockSession('kid',f.store).record.submission.answers,{'1':'4'});
 f.calls[0].reject(Error('lost response'));await first;assert.equal(f.state.SaveState,'error');
 f.context.runRef.current.answers={'1':'changed'};
 const retry=f.submit();assert.deepEqual(clone(f.calls[1].args),['mock_attempt_a',{'1':'4'}]);
 f.calls[1].resolve({review:[],score:1});await retry;assert.equal(f.state.SaveState,'saved');
});

test('refresh restores a frozen submission without reopening answer editing or silently submitting',async()=>{
 const f=fixture();writeMockSession({...f.record,submission:{answers:{1:'4'}}},f.store);
 f.context.mockResume=async()=>({test:f.record.test,startedAt:1000,deadline:61000,serverNow:11000,diagnostic:false});
 const restore=source.slice(source.indexOf('  useEffect(() => {\n    let alive = true;'),source.indexOf('  }, [uid, recoveryRetry]);')+'  }, [uid, recoveryRetry]);'.length);
 vm.runInContext(restore,f.context);await tick();
 assert.equal(f.state.SessionReady,true);assert.equal(f.state.SaveState,'error');assert.equal(f.calls.length,0);
 assert.deepEqual(f.context.runRef.current.submission.answers,{'1':'4'});
 assert.ok(Math.abs(f.state.Left-50)<=1);
});

test('server clock offset keeps the same remaining time on devices ahead or behind',()=>{
 for(const deviceNow of [11000,611000,-589000]){
  const value={...record(),clockOffsetMs:mockClockOffset({serverNow:11000},deviceNow)};
  assert.equal(mockRemaining(value,deviceNow),50);assert.equal(mockSpent(value,deviceNow),10);
 }
 assert.equal(mockClockOffset({}),0);
});

test('blocked mock storage retains the latest journal across SPA remounts and isolates owners',()=>{
 const uid='mock-memory-owner',blocked={getItem(){throw Error('blocked');},setItem(){throw Error('full');},removeItem(){throw Error('blocked');}};
 assert.equal(writeMockSession(record(uid),blocked),false);
 const restored=readMockSession(uid,blocked);assert.equal(restored.error,'unavailable');assert.equal(restored.record.answers[1],'4');
 assert.equal(readMockSession('other-mock-memory-owner',blocked).record,null);
 const recovered=storage();assert.equal(writeMockSession({...restored.record,answers:{1:'8'}},recovered),true);
 assert.equal(readMockSession(uid,recovered).record.answers[1],'8');assert.equal(clearMockSession(uid,'mock_attempt_a',recovered),true);
});

test('explicitly discarding mock recovery clears both journal and interrupted start',()=>{
 const store=storage(),value=record('mock-discard-owner');writeMockSession(value,store);writeMockStart({uid:value.uid,id:value.id,school:value.school},store);
 assert.equal(discardMockSession(value.uid,store),true);assert.equal(readMockSession(value.uid,store).record,null);assert.equal(readMockStart(value.uid,store),null);
});

test('an interrupted mock start cannot silently switch schools and lose its recovery id',async()=>{
 const state={},calls=[];
 const context={uid:'kid',ru:true,isCurrent:()=>true,startingRef:{current:false},sessionReady:true,recoveryError:'',runRef:{current:null},pro:true,weekly:{access:true,weekKey:'week'},generationRef:{current:0},
  readMockStart:()=>({uid:'kid',id:'mock_reserved_a',school:'БИЛ'}),mockStart:async()=>{calls.push('start');},setStarting:value=>{state.starting=value;},setStartError(){},setRecoveryRetry:update=>{state.recovery=update(0);}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('  async function startExam('),source.indexOf('  async function submit()')),context);
 await context.startExam('НИШ');assert.equal(calls.length,0);assert.equal(state.recovery,1);assert.equal(state.starting,false);
});

test('starting a NIS exam retains server phase state in the active player and reload journal',async()=>{
 const {startNis,NIS_FORMAT}=await import('../shared/nis-exam.mjs');
 const f=fixture(),started={test:{...record().test,school:'НИШ',examFormat:NIS_FORMAT},startedAt:1000,deadline:3601000,serverNow:1000,nis:startNis(1000)};
 Object.assign(f.context,{sessionReady:true,recoveryError:'',pro:true,weekly:{access:true,weekKey:'week'},crypto:{randomUUID:()=> 'mock_attempt_a'},writeMockStart:()=>true,mockStart:async()=>started});
 f.context.runRef.current=null;
 vm.runInContext(source.slice(source.indexOf('  async function startExam('),source.indexOf('  async function submit()')),f.context);
 await f.context.startExam('НИШ');
 assert.deepEqual(clone(f.context.runRef.current.nis),clone(started.nis));
 assert.equal(f.context.runRef.current.revision,0);
 const restored=readMockSession('kid',f.store);
 assert.equal(restored.error,null);assert.equal(restored.record.nis.phase,0);
});

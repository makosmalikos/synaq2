import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { diagnosticProgressKey, writeDiagnosticProgress, readDiagnosticProgress, clearDiagnosticProgress } from '../frontend/src/platformDiagnostic.js';
import { stageDiagnosticResult, diagnosticRecovery, acknowledgeDiagnosticResult } from '../frontend/src/diagnosticPersistence.js';
const source=fs.readFileSync(new URL('../frontend/src/components/PlatformDiagnostic.jsx',import.meta.url),'utf8');
const methods=source.slice(source.indexOf('  const storeProgress ='),source.indexOf('  const storageWarning ='));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const clone=value=>JSON.parse(JSON.stringify(value));
const storage=()=>{const data=new Map();return{data,getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};};
const draft=(id='diagnostic_attempt_a',answer='12')=>({version:2,screen:'test',grade:5,index:0,answer,attemptId:id,pendingStart:false,pendingAnswer:null});
function fixture(){
 const calls=[],state={},clears=[],writes=[];
 const context={ownerUid:'kid',auth:{currentUser:{uid:'kid'}},mounted:{current:true},operation:{current:false},historyRevision:{current:0},submittedRef:{current:false},attemptId:{current:'diagnostic_attempt_a'},
 grade:5,index:0,screen:'intro',answer:'12',current:{id:'q1'},session:{id:'diagnostic_attempt_a'},saveState:'idle',resumeData:null,PLATFORM_DIAGNOSTIC_VERSION:2,
 crypto:{randomUUID:()=>`diagnostic_random_${calls.length}`},window:{scrollTo(){}},
 writeDiagnosticProgress:(uid,value)=>{writes.push({uid,value:clone(value)});return true;},
 clearDiagnosticDraft:(uid,id)=>clears.push({uid,id}),
 stageDiagnosticResult(){},acknowledgeDiagnosticResult(){},restoredDiagnosticAnswer:()=>'',
 };
 for(const name of ['RecoveryAvailable','Session','ResumeData','Screen','SaveState','Result','History','Answer','Grade']) context[`set${name}`]=value=>{state[name]=typeof value==='function'?value(state[name]||[]):value;};
 for(const name of ['diagnosticStart','diagnosticResume','diagnosticAnswer']) context[name]=(...args)=>{const call={name,args,...deferred()};calls.push(call);return call.promise;};
 vm.createContext(context);vm.runInContext(methods+'\nmodule={exports:{begin,resume,submit,accept,fail}};',context);
 return{api:context.module.exports,state,context,calls,clears,writes};
}

test('diagnostic start and resume are single flight even before a rerender',async()=>{
 for(const action of ['begin','resume']){
  const f=fixture();if(action==='resume')f.context.resumeData=draft();
  const first=f.api[action]();await f.api[action]();assert.equal(f.calls.length,1,action);
  f.calls[0].reject(Error('offline'));await first;assert.equal(f.context.operation.current,false);assert.equal(f.state.SaveState,'error');
 }
});

test('ambiguous diagnostic answer is reconciled and replayed exactly before accepting new input',async()=>{
 const f=fixture();const first=f.api.submit();f.calls[0].reject(Error('lost response'));await first;
 assert.equal(f.state.ResumeData.pendingAnswer.answer,'12');
 f.context.resumeData=f.state.ResumeData;f.context.saveState='error';f.context.answer='999';
 const retry=f.api.submit();assert.equal(f.calls[1].name,'diagnosticResume');
 f.calls[1].resolve({id:'diagnostic_attempt_a',grade:5,index:0});await tick();
 assert.equal(f.calls[2].name,'diagnosticAnswer');assert.deepEqual(f.calls[2].args,['diagnostic_attempt_a',0,'12']);
 f.calls[2].resolve({id:'diagnostic_attempt_a',grade:5,index:1,question:{}});await retry;
 assert.equal(f.state.Session.index,1);assert.equal(f.state.SaveState,'idle');
});

test('expired old diagnostic clears only its own draft',()=>{
 const f=fixture();f.api.fail({code:'diagnostic/session-expired'},draft('diagnostic_old_attempt'));
 assert.deepEqual(f.clears,[{uid:'kid',id:'diagnostic_old_attempt'}]);assert.equal(f.state.Screen,'intro');
});

test('late initial history cannot overwrite a freshly completed diagnostic or its backup',async()=>{
 const f=fixture(),history=deferred(),saved=[];
 Object.assign(f.context,{diagnosticRecovery:()=>({result:null,durable:false}),readDiagnosticProgress:()=>null,getPlatformDiagnostics:()=>history.promise,localStorage:{setItem:(...args)=>saved.push(args)},diagnosticStorageKey:uid=>uid});
 const effect=source.slice(source.indexOf('  useEffect(() => {\n    const uid = ownerUid;')+'  useEffect('.length,source.indexOf('  }, [ownerUid]);')+'  }'.length);
 const stop=vm.runInContext(`(${effect})()`,f.context);
 const fresh={completedAt:'2026-10-26T10:00:00Z',topics:[],sourceId:'new',readiness:80};
 f.api.accept({id:'diagnostic_new_attempt',completed:true,result:fresh});
 history.resolve([{completedAt:'2026-10-25T10:00:00Z',readiness:10}]);await tick();
 assert.equal(f.state.Result,fresh);assert.equal(saved.length,0);stop();
});

test('two diagnostic tabs keep their own answers while retaining a backup for reopening',async()=>{
 const a=await import('../frontend/src/platformDiagnostic.js?resilience-tab-a');
 const b=await import('../frontend/src/platformDiagnostic.js?resilience-tab-b');
 const c=await import('../frontend/src/platformDiagnostic.js?resilience-tab-c');
 const primaryA=storage(),primaryB=storage(),backup=storage(),uid='resilience-two-tabs';
 a.writeDiagnosticProgress(uid,draft('diagnostic_attempt_a','123'),primaryA,backup);
 assert.equal(b.readDiagnosticProgress(uid,primaryB,backup).answer,'123');
 b.writeDiagnosticProgress(uid,draft('diagnostic_attempt_b','456'),primaryB,backup);
 assert.equal(a.readDiagnosticProgress(uid,primaryA,backup).answer,'123');
 assert.equal(b.readDiagnosticProgress(uid,primaryB,backup).answer,'456');
 assert.equal(c.readDiagnosticProgress(uid,storage(),backup).attemptId,'diagnostic_attempt_b');
 a.clearDiagnosticProgress(uid,'diagnostic_attempt_a',primaryA);
 assert.equal(JSON.parse(backup.getItem(diagnosticProgressKey(uid))).attemptId,'diagnostic_attempt_b');
});

test('blocked diagnostic storage preserves an in-memory draft across cabinet navigation',()=>{
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 const uid='resilience-blocked';assert.equal(writeDiagnosticProgress(uid,draft(),blocked,blocked),false);
 assert.equal(readDiagnosticProgress(uid,blocked,blocked).answer,'12');
 assert.equal(readDiagnosticProgress('different-owner',blocked,blocked),null);
 clearDiagnosticProgress(uid,'diagnostic_attempt_a',blocked);
 assert.equal(readDiagnosticProgress(uid,blocked,blocked),null);
});

test('late old diagnostic result cannot replace a newer result in memory when storage is blocked',()=>{
 const uid='resilience-new-result',blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 const newer={version:2,saveId:'diagnostic_newer',completedAt:'2026-10-26T10:00:00Z',topics:[]};
 const older={...newer,saveId:'diagnostic_older',completedAt:'2026-10-25T10:00:00Z'};
 stageDiagnosticResult(uid,newer,blocked);stageDiagnosticResult(uid,older,blocked);
 assert.equal(diagnosticRecovery(uid).result.saveId,newer.saveId);
 acknowledgeDiagnosticResult(uid,older,blocked);assert.equal(diagnosticRecovery(uid).result.saveId,newer.saveId);
 acknowledgeDiagnosticResult(uid,newer,blocked);
});

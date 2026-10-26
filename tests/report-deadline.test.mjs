import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { readWithDeadline } from '../frontend/src/readDeadline.js';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const deferred=()=>{let resolve;const promise=new Promise(yes=>{resolve=yes;});return{promise,resolve};};
const source=fs.readFileSync(new URL('../frontend/src/ParentDashboard.jsx',import.meta.url),'utf8');
const effect=source.slice(source.indexOf('  useEffect(() => {\n    let alive = true;')+'  useEffect('.length,source.indexOf('  }, [uid,retry]);')+'  }'.length);
function fixture(overrides={}){
 const state={},context={uid:'child',AbortController,
 readWithDeadline:(read,options)=>readWithDeadline(read,{...options,timeoutMs:options.timeoutMs===8000?5:25}),
 getAttempts:async()=>['verified-answer'],getMocks:async()=>[],loadTopicCatalog:async()=>[],getXpSummary:async()=>({xp:5}),getPlatformDiagnostics:async()=>[],
 parentSummary:attempts=>({count:attempts.length}),studyPlan:input=>({historyReady:input.historyReady}),
 setReport:value=>{state.report=value;},setError:value=>{state.error=value;},...overrides};
 vm.createContext(context);const stop=vm.runInContext(`(${effect})()`,context);return{state,stop};
}

test('a stalled report shows retry instead of an infinite loader and ignores its late response',async()=>{
 const pending=deferred(),f=fixture({getAttempts:()=>pending.promise});await pause(45);
 assert.equal(f.state.error,true);assert.equal(f.state.report,null);
 pending.resolve(['late']);await pause(1);assert.equal(f.state.report,null);f.stop();
});
test('an unavailable optional diagnostic does not erase valid parent practice data',async()=>{
 const f=fixture({getPlatformDiagnostics:()=>new Promise(()=>{})});await pause(15);
 assert.equal(f.state.error,false);assert.equal(f.state.report.summary.count,1);assert.equal(f.state.report.xp,5);assert.equal(f.state.report.weeklyPlan.historyReady,false);f.stop();
});
test('unmount cancels report deadlines without publishing an error',async()=>{
 const f=fixture({getAttempts:()=>new Promise(()=>{})});f.stop();await pause(35);
 assert.equal(f.state.error,false);assert.equal(f.state.report,null);
});
test('read deadline handles completion, failures and cancellation without replaying the read',async()=>{
 let calls=0;assert.equal(await readWithDeadline(async()=>{calls++;return 5;}),5);assert.equal(calls,1);
 await assert.rejects(readWithDeadline(()=>new Promise(()=>{}),{timeoutMs:5}),{code:'read-timeout'});
 const controller=new AbortController();const cancelled=readWithDeadline(()=>new Promise(()=>{}),{signal:controller.signal});controller.abort();await assert.rejects(cancelled,{code:'read-cancelled'});
 const already=new AbortController();already.abort();await assert.rejects(readWithDeadline(()=>{calls++;},{signal:already.signal}),{code:'read-cancelled'});assert.equal(calls,1);
});

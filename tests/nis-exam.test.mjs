import test from 'node:test';
import assert from 'node:assert/strict';
import {startNis,updateNis,reconcileNis,NIS_PHASES} from '../shared/nis-exam.mjs';
const t=100000;
const op=(s,phase,answers={},revision=1,now=t+1000)=>updateNis(s,{op:'advance',phase,answers,revision},now);
test('NIS allocates 60/30/30 minutes and a separate 120-minute language day',()=>{
  let s=startNis(t);assert.equal(s.deadline,t+3600000);
  s=op(s,0,{'1':'A'});assert.equal(s.phase,1);assert.equal(s.deadline,t+1000+1800000);
  s=op(s,1,{'41':'B'},1,t+2000);assert.equal(s.phase,2);assert.equal(s.deadline,t+2000+1800000);
  s=op(s,2,{'101':'C'},1,t+3000);assert.equal(s.waiting,true);assert.equal(s.phase,3);assert.equal(s.deadline,null);
  const later=t+86400000;s=reconcileNis(s,later);assert.equal(s.waiting,true);
  s=updateNis(s,{op:'begin-day2'},later);assert.equal(s.deadline,later+7200000);
  const replay=updateNis(s,{op:'begin-day2'},later+5000);assert.deepEqual(replay,s);
  s=op(s,3,{'121':'D'},1,later+6000);assert.equal(s.ready,true);assert.deepEqual(s.answers,{'1':'A','41':'B','101':'C','121':'D'});
  assert.equal(s.elapsedSec,9); // overnight break never counts as study time
});
test('background/offline time cannot extend blocks or reopen a closed section',()=>{
  let s=updateNis(startNis(t),{op:'save',phase:0,revision:1,answers:{'1':'saved'}},t+1);
  s=updateNis(s,{op:'advance',phase:0,revision:2,answers:{'1':'late'}},t+3600001);
  assert.equal(s.answers[1],'saved');assert.equal(s.deadline,t+5400000);
  assert.deepEqual(updateNis(s,{op:'save',phase:0,revision:3,answers:{'1':'changed'}},t+3600002),s);
  s=reconcileNis(s,t+7200001);assert.equal(s.waiting,true);assert.equal(s.phase,3);
  assert.equal(s.elapsedSec,7200);
});
test('NIS refuses future answers and stale saves cannot overwrite newer choices',()=>{
  let s=startNis(t);
  assert.throws(()=>updateNis(s,{op:'save',phase:1,revision:1,answers:{'41':'B'}},t+1));
  assert.throws(()=>updateNis(s,{op:'save',phase:0,revision:1,answers:{'41':'B'}},t+1));
  s=updateNis(s,{op:'save',phase:0,revision:3,answers:{'1':'latest'}},t+1);
  s=updateNis(s,{op:'save',phase:0,revision:2,answers:{'1':'old'}},t+2);assert.equal(s.answers[1],'latest');
  s=op(s,0,{'1':'old'},2,t+3);assert.equal(s.answers[1],'latest');
});
test('a full timeout freezes all saved language answers and completes once',()=>{
  let s=reconcileNis(startNis(t),t+7200000);s=updateNis(s,{op:'begin-day2'},t+9000000);
  s=updateNis(s,{op:'save',phase:3,revision:1,answers:{'180':'saved'}},t+9000001);
  s=reconcileNis(s,t+16200000);assert.equal(s.ready,true);assert.equal(s.answers[180],'saved');
  assert.deepEqual(reconcileNis(s,t+20000000),s);assert.equal(NIS_PHASES.reduce((n,p)=>n+p.minutes,0),240);
});

test('an equal-revision replay is idempotent even if its payload was altered',()=>{
 let s=updateNis(startNis(t),{op:'save',phase:0,revision:1,answers:{'1':'original'}},t+1);
 s=updateNis(s,{op:'save',phase:0,revision:1,answers:{'1':'altered'}},t+2);
 assert.equal(s.answers[1],'original');
});

import {readPublicTestDraft,savePublicTestDraft,questionRevision} from '../frontend/src/publicTestDraft.js';
import {PUBLIC_MOCKS} from '../frontend/src/publicMockData.generated.js';
test('public NIS draft retains the active phase, exact deadline and answers on reload, rejecting broken nested state',()=>{
 const data=new Map(), storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const questions=PUBLIC_MOCKS['НИШ'].questions,nis=startNis(t);
 const snapshot={grade:6,target:'НИШ',index:0,answers:{[questions[0].id]:'selected'},deadline:nis.deadline,
   nis:{nis,answers:{'1':'selected'},index:0,revision:1}};
 savePublicTestDraft('mock',snapshot,questionRevision(questions),storage,t+1);
 const restored=readPublicTestDraft('mock',()=>questions,storage,t+1000);
 assert.deepEqual(restored.nis,snapshot.nis);assert.equal(restored.deadline,nis.deadline);
 const broken={...snapshot,nis:{...snapshot.nis,nis:{...nis,phase:99}}};
 savePublicTestDraft('mock',broken,questionRevision(questions),storage,t+1);
 assert.equal(readPublicTestDraft('mock',()=>questions,storage,t+1000),null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { openLesson } from '../frontend/src/openLesson.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{resolve,reject,promise};};
const popup=()=>({opener:'old',closed:false,location:{replace(url){this.url=url;}},close(){this.closed=true;}});

test('lesson popup opens synchronously before waiting and loses access to opener',async()=>{
  const p=popup(), response=deferred(); let opened=false;
  const result=openLesson(body=>{assert.equal(opened,true);assert.deepEqual(body,{action:'join',id:'lesson'});return response.promise;},'lesson',{open:()=>{opened=true;return p;}});
  assert.equal(p.opener,null); assert.equal(p.location.url,undefined);
  response.resolve({url:'https://meet.google.com/aaa-bbbb-ccc'});
  assert.equal(await result,'https://meet.google.com/aaa-bbbb-ccc');
  assert.equal(p.location.url,'https://meet.google.com/aaa-bbbb-ccc');
});

test('blocked popup retains a normal link and failed requests close the blank tab',async()=>{
  assert.equal(await openLesson(async()=>({url:'https://meet.google.com/aaa-bbbb-ccc'}),'x',{open:()=>null}),'https://meet.google.com/aaa-bbbb-ccc');
  const p=popup(); await assert.rejects(openLesson(async()=>{throw Error('too_early');},'x',{open:()=>p}),/too_early/);
  assert.equal(p.closed,true);
});

test('late responses after account change and invalid destinations cannot open a lesson',async()=>{
  const p=popup();assert.equal(await openLesson(async()=>({url:'https://meet.google.com/aaa-bbbb-ccc'}),'x',{open:()=>p,current:()=>false}),null);
  assert.equal(p.closed,true);assert.equal(p.location.url,undefined);
  for(const url of ['javascript:alert(1)','http://example.test','https://name:pass@example.test']){
    const p=popup();await assert.rejects(openLesson(async()=>({url}),'x',{open:()=>p}));assert.equal(p.closed,true);assert.equal(p.location.url,undefined);
  }
});

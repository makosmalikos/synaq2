import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-negative-addition-models.mjs';import{mathFragments}from'../frontend/src/mathPresentation.js';
const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-negative-addition.json',import.meta.url),'utf8')),rows=pack.editions;
const keys=['13','5','21','-(5 + (5/7))','31','Қосынды міндетті түрде теріс болады','-19','-1,6','Қосынды -7 санынан кіші','-(7/11)','700','9','14'];
test('all13saved negative-addition adaptations match hand-derived keys and Standard scope',()=>{assert.equal(rows.length,13);rows.forEach((r,i)=>{assert.equal(r.answer,keys[i]);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);if(r.options)assert.equal(r.options.filter(o=>o===keys[i]).length,1);});});
test('negative sum and its positive modulus, depth, ordinal, debt and below-zero amount retain distinct roles',()=>{
 for(let a=1;a<=30;a++)for(let b=1;b<=30;b++){
  assert.equal(renderEdition({...rows[1],params:{start:-a,down:b}}).answer,String(a+b));assert.equal(renderEdition({...rows[2],params:{first:a,second:b}}).answer,String(a+b));assert.equal(renderEdition({...rows[4],params:{startDepth:a,down:b}}).answer,String(a+b));assert.equal(renderEdition({...rows[10],params:{initialDebt:a,callCost:b}}).answer,String(a+b));assert.equal(renderEdition({...rows[12],params:{initialCold:a,drop:b}}).answer,String(a+b));
  if(a>b)assert.equal(renderEdition({...rows[6],params:{first:a,second:b}}).answer,String(-a-b));
 }
 assert.match(rows[10].statement,/тағы 280 тг алынды/);assert.match(rows[10].statement,/төлем жасалған жоқ/);
});
test('the negative-addend unknown and repeated minus-one count are positive natural numbers',()=>{
 for(let base=1;base<=40;base++)for(let extra=1;extra<=20;extra++){
  assert.equal(renderEdition({...rows[0],params:{known:base,total:base+extra}}).answer,String(extra));assert.equal(renderEdition({...rows[11],params:{startMagnitude:base,targetMagnitude:base+extra}}).answer,String(extra));
 }
});
test('two strictly negative real inputs stay strictly below both inputs',()=>{
 for(let a=1;a<=100;a++)for(let b=1;b<=100;b++)assert.ok(-a/7-b/11<Math.min(-a/7,-b/11));assert.match(rows[5].statement,/a < 0 және b < 0/);assert.equal(rows[8].answer,'Қосынды -7 санынан кіші');
});
test('mixed and like-fraction addition keep whole parts and denominators instead of subtracting magnitudes',()=>{
 assert.equal((3*7+2)+(2*7+3),40);assert.equal(40,5*7+5);assert.equal(mathFragments(rows[3].answer)[1].type,'mixed');assert.equal(mathFragments(rows[9].answer)[1].type,'fraction');assert.equal(-2/11-5/11,-7/11);
 assert.ok(rows[3].options.includes('-(5 + (5/14))'));assert.match(rows[3].solution,/бөлімдер қосылмайды/);
});
test('two negative tenths retain carrying and decimal places',()=>{
 for(let a=1;a<10;a++)for(let b=1;b<10;b++)if(a!==b&&a+b>10){const sum=a+b;assert.equal(renderEdition({...rows[7],params:{firstTenths:a,secondTenths:b}}).answer,`-1,${sum-10}`);}
 assert.deepEqual(rows[7].options,['1,6','-0,16','-0,2','-1,6']);
});
test('modified text/keys/options and invalid sign, denominator, or crossing domains reject verification',()=>{
 for(const r of rows){for(const k of ['statement','solution','answer'])assert.throws(()=>verifyEdition({...r,[k]:r[k]+' changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));}
 for(const[i,p]of [[0,{total:17}],[1,{start:1}],[3,{numeratorB:5}],[4,{down:0}],[6,{second:11}],[7,{firstTenths:1}],[9,{second:10}],[11,{targetMagnitude:10}]])assert.throws(()=>renderEdition({...rows[i],params:{...rows[i].params,...p}}));
});
test('exact13saved nonvisual2.8 occurrences remain closed drafts with native math',()=>{const file='problems/sources/zerek/courses/6-math-2-8-level1.json',source=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));const refs=source.questions.filter(q=>!q.images?.length&&!q.svg?.length).map(q=>{assert.equal(q.checked,true);return file+'#'+q.id;});assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),refs.sort());assert.match(pack.scope,/Closed author draft/);assert.doesNotMatch(rows.flatMap(r=>[r.statement,r.solution,r.answer,...r.options||[]]).join(' '),/[\\$]|NaN|Infinity/);});

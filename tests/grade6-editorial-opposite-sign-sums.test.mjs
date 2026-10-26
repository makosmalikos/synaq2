import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{renderEdition,verifyEdition}from'../scripts/editorial/grade6-opposite-sign-sums-models.mjs';import{mathFragments}from'../frontend/src/mathPresentation.js';
const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-opposite-sign-sums.json',import.meta.url),'utf8')),rows=pack.editions;
const keys=['-8','-(1/2)','4','-2,5','22','-17 + 8','19','13','теріс','73','560','3'];
test('all12saved opposite-sign sums match hand-derived keys and Standard scope',()=>{assert.equal(rows.length,12);rows.forEach((r,i)=>{assert.equal(r.answer,keys[i]);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);if(r.options)assert.equal(r.options.filter(o=>o===keys[i]).length,1);});});
test('integer result and requested sign use the larger magnitude for the sign',()=>{
 for(let a=2;a<=40;a++)for(let b=1;b<a;b++){
  assert.equal(renderEdition({...rows[0],params:{negativeMagnitude:a,positive:b}}).answer,String(b-a));assert.equal(renderEdition({...rows[8],params:{negativeMagnitude:a,positive:b}}).answer,'теріс');assert.equal(renderEdition({...rows[7],params:{negativeMagnitude:b,positive:a}}).answer,String(a-b));
 }
});
test('unlike fractions require a real common denominator and final nontrivial reduction',()=>{
 assert.equal(7*5-1*10,25);assert.equal((7*5-1*10)*2,10*5);assert.equal(rows[1].answer,'-(1/2)');assert.match(rows[1].solution,/1\/5.*2\/10/);assert.match(rows[1].solution,/5 санына қысқартсақ/);assert.equal(mathFragments(rows[1].answer)[1].type,'fraction');
});
test('decimal exact tenths distinguish fractional cancellation from borrowing',()=>{
 assert.equal(rows[2].answer,'4');assert.equal(renderEdition({...rows[2],params:{negativeTenths:7,positiveTenths:57}}).answer,'5');assert.equal(rows[3].answer,'-2,5');assert.deepEqual(rows[3].options,['2,5','-16,1','-3,5','-2,5']);assert.equal(93-68,25);
});
test('selecting the sole negative expression does not count zero as negative',()=>{
 assert.equal(rows[5].answer,'-17 + 8');assert.deepEqual(rows[5].params.pairs.map(([a,b])=>a+b),[9,8,-9,0]);assert.match(rows[5].solution,/0 теріс сан емес/);
});
test('topup clears debt before leaving a positive balance and identical mixed parts cancel',()=>{
 assert.equal(800-240,560);assert.equal(rows[10].answer,'560');assert.match(rows[10].statement,/басқа төлем болған жоқ/);
 assert.equal(rows[11].answer,'3');assert.match(rows[11].solution,/бөлшек бөліктер жойылады/);assert.equal(mathFragments(rows[11].statement).filter(p=>p.type==='mixed').length,2);
});
test('modified fulltexts/options/keys and invalid sign, reduction or borrowing domains fail',()=>{
 for(const r of rows){for(const k of ['statement','solution','answer'])assert.throws(()=>verifyEdition({...r,[k]:r[k]+' changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));}
 for(const[i,p]of [[0,{positive:20}],[1,{positiveNumerator:4}],[2,{positiveTenths:49}],[3,{negativeTenths:99}],[4,{negativeMagnitude:10}],[6,{negativeMagnitude:34}],[8,{positive:13}],[9,{positive:99}],[10,{topup:200}],[11,{numerator:5}]])assert.throws(()=>renderEdition({...rows[i],params:{...rows[i].params,...p}}));
});
test('all12saved nonvisual2.9 occurrences are closed drafts with native math and no newcapture',()=>{const file='problems/sources/zerek/courses/6-math-2-9-level1.json',source=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));const refs=source.questions.filter(q=>!q.images?.length&&!q.svg?.length).map(q=>{assert.equal(q.checked,true);return file+'#'+q.id;});assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),refs.sort());assert.match(pack.scope,/Closed author draft/);assert.doesNotMatch(rows.flatMap(r=>[r.statement,r.solution,r.answer,...r.options||[]]).join(' '),/[\\$]|NaN|Infinity/);});

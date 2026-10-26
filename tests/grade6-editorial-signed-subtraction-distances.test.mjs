import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{renderEdition,verifyEdition}from'../scripts/editorial/grade6-signed-subtraction-distances-models.mjs';import{mathFragments}from'../frontend/src/mathPresentation.js';
const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-signed-subtraction-distances.json',import.meta.url),'utf8')),rows=pack.editions;
const keys=['8 + (-15)','24','(3/11)','-3,3','23','12','37','-8','-17','12','-(2/5)','0','3','5,9','-8 және 2','11','6','55','13','|a − b|','6600','9','|-9 − 2| = |2 − (-9)|','|-6 − 11|'];
test('all24saved subtraction/distance roles match hand-derived keys in Standard',()=>{assert.equal(rows.length,24);assert.equal(new Set(rows.map(r=>r.modelId)).size,21);rows.forEach((r,i)=>{assert.equal(r.answer,keys[i]);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);if(r.options)assert.equal(r.options.filter(o=>o===keys[i]).length,1);});});
test('negative subtrahend reverses while positive subtrahend becomes a negative addend',()=>{
 for(let a=1;a<=30;a++)for(let b=1;b<=30;b++){
  assert.equal(renderEdition({...rows[4],params:{first:a,secondMagnitude:b}}).answer,String(a+b));
  if(b>a)assert.equal(renderEdition({...rows[1],params:{firstMagnitude:a,secondMagnitude:b}}).answer,String(b-a));
  if(a>b)assert.equal(renderEdition({...rows[8],params:{firstMagnitude:a,second:b}}).answer,String(-a-b));
 }
 assert.equal(rows[0].answer,'8 + (-15)');assert.equal(8-15,8+(-15));assert.notEqual(8-15,-8+15);
});
test('zero-minus-negative and self-subtraction handle their distinct zero roles',()=>{
 for(let n=1;n<=80;n++){assert.equal(renderEdition({...rows[6],params:{magnitude:n}}).answer,String(n));assert.equal(renderEdition({...rows[11],params:{magnitude:n}}).answer,'0');}
 assert.equal(rows[2].answer,'(3/11)');assert.ok(rows[2].options.includes('(11/3)'));assert.equal(mathFragments(rows[2].answer)[0].type,'fraction');
});
test('fractional difference needs reduction and fractional opposite-side distance has an integer result',()=>{
 assert.equal(7-3,4);assert.equal(rows[10].answer,'-(2/5)');assert.match(rows[10].solution,/2 санына қысқартсақ/);assert.equal(5+13,3*6);assert.equal(rows[12].answer,'3');
 assert.ok(mathFragments(rows[12].statement).filter(p=>p.type==='fraction').length===2);
});
test('distance is invariant to endpoint order and nonnegative including coincident points',()=>{
 for(let a=-50;a<=50;a++)for(let b=-50;b<=50;b++){assert.equal(Math.abs(a-b),Math.abs(b-a));assert.ok(Math.abs(a-b)>=0);if(a===b)assert.equal(Math.abs(a-b),0);}
 assert.equal(rows[9].answer,String(-5-(-17)));assert.equal(rows[21].answer,String(-4-(-13)));assert.equal(rows[17].answer,'55');assert.equal(rows[18].answer,'13');assert.equal(rows[19].answer,'|a − b|');assert.equal(rows[23].answer,'|-6 − 11|');
});
test('decimal endpoints, origin crossing and complete descent distinguish sign from positive distance',()=>{
 assert.equal(rows[3].answer,'-3,3');assert.equal(-46+13,-33);assert.equal(rows[7].answer,'-8');assert.equal(-37-43,-80);assert.equal(rows[13].answer,'5,9');assert.equal(Math.abs(-32-27),59);assert.equal(rows[15].answer,'11');assert.equal(rows[16].answer,'6');
 assert.equal(rows[5].answer,'12');assert.notEqual(rows[5].answer,'7');assert.equal(rows[20].answer,'6600');assert.match(rows[20].statement,/ШАРТТЫ картасында/);
});
test('positive distance from a nonzero center has two distinct correctly centered solutions',()=>{
 assert.equal(rows[14].answer,'-8 және 2');assert.equal(Math.abs(-8-(-3)),5);assert.equal(Math.abs(2-(-3)),5);assert.notEqual(Math.abs(-2-(-3)),5);
});
test('changed fulltext/options/keys and invalid sign, endpoint, divisibility domains reject verification',()=>{
 for(const r of rows){for(const k of ['statement','solution','answer'])assert.throws(()=>verifyEdition({...r,[k]:r[k]+' changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));}
 for(const[i,p]of [[0,{second:8}],[1,{secondMagnitude:18}],[2,{numerator:11}],[3,{secondTenths:47}],[7,{secondTenths:44}],[9,{right:-18}],[10,{first:4}],[12,{positiveNumerator:12}],[13,{secondTenths:-27}],[14,{distance:2}],[15,{secondTenths:66}],[21,{left:1}]])assert.throws(()=>renderEdition({...rows[i],params:{...rows[i].params,...p}}));
});
test('exact12+12saved nonvisual sources remain closed drafts without TeX or newcapture',()=>{const refs=[];for(const topic of['2-11','2-12']){const file=`problems/sources/zerek/courses/6-math-${topic}-level1.json`,s=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));const q=s.questions.filter(q=>!q.images?.length&&!q.svg?.length);assert.equal(q.length,12);refs.push(...q.map(q=>{assert.equal(q.checked,true);return file+'#'+q.id;}));}assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),refs.sort());assert.match(pack.scope,/Closed author draft/);assert.doesNotMatch(rows.flatMap(r=>[r.statement,r.solution,r.answer,...r.options||[]]).join(' '),/[\\$]|NaN|Infinity/);});

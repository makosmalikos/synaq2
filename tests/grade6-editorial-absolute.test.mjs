import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-absolute-models.mjs';
import {mathFragments} from '../frontend/src/mathPresentation.js';
const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-absolute.json',import.meta.url),'utf8')),rows=pack.editions;
const keys=['2','23','-(7/12) және (7/12)','7','(4 + (3/8))','0,09','|x| = -5','|-3,6| = 3,6','17','263','бастапқы санға қарама-қарсы оң санға тең'];
test('all11 saved modulus adaptations match independently hand-derived author keys, Standard only',()=>{
 assert.equal(rows.length,11);rows.forEach((r,i)=>{assert.equal(r.answer,keys[i]);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);if(r.options)assert.equal(r.options.filter(o=>o===keys[i]).length,1);});
});
test('modulus equation positive, zero and negative regimes are mathematically distinct',()=>{
 for(let d=1;d<=100;d++){
  const found=[];for(let x=-100;x<=100;x++)if(Math.abs(x)===d)found.push(x);
  assert.deepEqual(found,[-d,d]);assert.equal(renderEdition({...rows[0],params:{distance:d}}).answer,String(found.length));
 }
 assert.equal(Array.from({length:201},(_,i)=>i-100).filter(x=>Math.abs(x)===0).length,1);
 assert.equal(Array.from({length:201},(_,i)=>i-100).filter(x=>Math.abs(x)===-5).length,0);
 assert.match(rows[6].solution,/x = 0 ғана/);assert.match(rows[6].solution,/x = 0,7 не -0,7/);
});
test('fraction and mixed modulus preserve the entire magnitude rather than reciprocating/complementing',()=>{
 assert.equal(7/12,Math.abs(-7/12));assert.notEqual(7/12,12/7);assert.notEqual(4+3/8,3/8);assert.notEqual(4+3/8,4+5/8);
 assert.equal(mathFragments('|-(4 + (3/8))|')[1].type,'mixed');assert.ok(mathFragments(rows[2].answer).some(p=>p.type==='fraction'));
});
test('decimal hundredths never become tenths or units under modulus',()=>{
 for(let n=1;n<=9;n++)assert.equal(renderEdition({...rows[5],params:{hundredths:n}}).answer,`0,0${n}`);
 assert.equal(Math.abs(-.09),.09);assert.notEqual(.09,.9);assert.notEqual(.09,9);
});
test('sum and quotient models retain operations after both inner signs are resolved',()=>{
 for(let a=1;a<=90;a++)for(let b=1;b<=20;b++){
  assert.equal(renderEdition({...rows[1],params:{negative:-a,positive:b}}).answer,String(Math.abs(-a)+Math.abs(b)));
  if(a%b===0)assert.equal(renderEdition({...rows[3],params:{negative:-a,positive:b}}).answer,String(Math.abs(-a)/Math.abs(b)));
 }
});
test('changed condition, complete explanation, keys or options cannot retain a verification',()=>{
 for(const r of rows){for(const k of ['statement','solution','answer'])assert.throws(()=>verifyEdition({...r,[k]:r[k]+' changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));}
 for(const[i,p]of [[0,{distance:0}],[1,{negative:1}],[2,{numerator:13}],[3,{positive:5}],[4,{numerator:8}],[5,{hundredths:10}],[6,{negative:0}],[8,{value:-1}],[9,{value:0}]])assert.throws(()=>renderEdition({...rows[i],params:{...rows[i].params,...p}}));
});
test('closed draft covers exactly the11 saved nonvisual2.4 occurrences and contains no TeX',()=>{
 const file='problems/sources/zerek/courses/6-math-2-4-level1.json',source=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));const refs=source.questions.filter(q=>!q.images?.length&&!q.svg?.length).map(q=>{assert.equal(q.checked,true);return file+'#'+q.id;});assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),refs.sort());
 assert.match(pack.scope,/Closed author draft/);assert.doesNotMatch(rows.flatMap(r=>[r.statement,r.solution,r.answer,...r.options||[]]).join(' '),/[\\$]|NaN|Infinity/);
});

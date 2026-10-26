import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-signed-comparison-models.mjs';
import {mathFragments} from '../frontend/src/mathPresentation.js';
const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-signed-comparison.json',import.meta.url),'utf8')),rows=pack.editions;
const keys=['-8','-5,7','7','-6 < 2','-0,07','3','-23 < -14','10','10','-(3/11) > -(8/11)','-9; -4; 0; 3','7'];
test('all12saved signed-comparison skills match hand-derived keys and Standard scope',()=>{
 assert.equal(rows.length,12);rows.forEach((r,i)=>{assert.equal(r.answer,keys[i]);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);if(r.options)assert.equal(r.options.filter(o=>o===keys[i]).length,1);});
});
test('strict, mixed-open/closed and contextual-negative counts preserve endpoint regimes over full domains',()=>{
 for(let b=-60;b<=-3;b++){
  const ints=[];for(let x=-60;x<=60;x++)if(x>b&&x<0)ints.push(x);
  assert.equal(renderEdition({...rows[0],params:{bound:b}}).answer,String(b+1));assert.equal(renderEdition({...rows[2],params:{bound:b}}).answer,String(ints.length));assert.equal(renderEdition({...rows[8],params:{morning:b}}).answer,String(ints.length));
  for(let right=1;right<=20;right++){
   const values=[];for(let x=-60;x<=60;x++)if(x>b&&x<=right)values.push(x);
   assert.equal(renderEdition({...rows[7],params:{left:b,right}}).answer,String(values.length));
  }
 }
});
test('negative decimals use exact ordering even when hundredths or long strings differ',()=>{
 assert.equal(rows[4].answer,'-0,07');assert.equal(rows[5].answer,'3');
 const r=renderEdition({...rows[4],params:{values:['-0,10000000000000000001','-0,1','-1','-0,2'],choices:['-1','-0,10000000000000000001','-0,1','-0,2']}});assert.equal(r.answer,'-0,1');
 assert.equal(renderEdition({...rows[5],params:{bound:-3,values:['-3,00000000000000000001','-3','-2,99999999999999999999','0']}}).answer,'1');
});
test('negative fraction inequality reverses positive magnitude order and renders native fractions',()=>{
 for(let d=3;d<=30;d++)for(let a=1;a<d-1;a++){
  const b=a+1,r=renderEdition({...rows[9],params:{smallNumerator:a,largeNumerator:b,denominator:d}});
  assert.ok(-a/d>-b/d);assert.equal(r.answer,`-(${a}/${d}) > -(${b}/${d})`);
 }
 assert.equal(mathFragments(rows[9].answer).filter(p=>p.type==='fraction').length,2);
});
test('sorting mixed signs never uses absolute magnitude as the largest value',()=>{
 const r=renderEdition({...rows[10],params:{values:[-100,2,-1,0]}});assert.equal(r.answer,'-100; -1; 0; 2');
 assert.equal(renderEdition({...rows[11],params:{values:['-999','1,9','2','0','-0,1']}}).answer,'2');
});
test('changed complete text/keys/options and invalid comparison domains are rejected',()=>{
 for(const r of rows){for(const k of ['statement','solution','answer'])assert.throws(()=>verifyEdition({...r,[k]:r[k]+' changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));}
 for(const[i,p]of [[0,{bound:0}],[1,{right:-4}],[2,{bound:0}],[7,{right:-1}],[8,{morning:0}],[9,{smallNumerator:8}],[10,{values:[-4,3,3,0]}]])assert.throws(()=>renderEdition({...rows[i],params:{...rows[i].params,...p}}));
});
test('exact12 saved nonvisual2.5 occurrences are closed drafts, no sourcecollection or TeX',()=>{
 const file='problems/sources/zerek/courses/6-math-2-5-level1.json',source=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));const refs=source.questions.filter(q=>!q.images?.length&&!q.svg?.length).map(q=>{assert.equal(q.checked,true);return file+'#'+q.id;});assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),refs.sort());
 assert.match(pack.scope,/Closed author draft/);assert.doesNotMatch(rows.flatMap(r=>[r.statement,r.solution,r.answer,...r.options||[]]).join(' '),/[\\$]|NaN|Infinity/);
});

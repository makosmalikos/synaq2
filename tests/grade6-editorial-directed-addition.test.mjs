import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-directed-addition-models.mjs';
import {mathFragments} from '../frontend/src/mathPresentation.js';
const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-directed-addition.json',import.meta.url),'utf8')),rows=pack.editions;
const keys=['9','(1/4)','-11','4','7','11','-3 + (-7)','-1,5','O(0)','Солға |b| бірлік жылжыту','14','-5'];
test('all12saved directed-addition skills match hand-derived keys and Standard scope',()=>{
 assert.equal(rows.length,12);rows.forEach((r,i)=>{assert.equal(r.answer,keys[i]);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);if(r.options)assert.equal(r.options.filter(o=>o===keys[i]).length,1);});
});
test('through-origin and before-origin regimes stay distinct over complete small integer domains',()=>{
 for(let start=1;start<=30;start++)for(let move=1;move<=30;move++){
  if(move>start){assert.equal(renderEdition({...rows[5],params:{start:-start,right:move}}).answer,String(move-start));assert.equal(renderEdition({...rows[11],params:{start,left:move}}).answer,String(start-move));}
  if(start>move)assert.equal(renderEdition({...rows[4],params:{start,left:move}}).answer,String(start-move));
 }
});
test('fraction displacement preserves a unit whole and produces native mixed and fraction choices',()=>{
 assert.equal(-3/4+1,1/4);assert.equal(mathFragments(rows[1].answer)[0].type,'fraction');assert.equal(mathFragments(rows[1].options[0])[1].type,'mixed');
 for(let d=3;d<=30;d++)for(let a=1;a<d;a++)assert.equal(renderEdition({...rows[1],params:{numerator:a,denominator:d}}).answer,`(${d-a}/${d})`);
});
test('zero movement, exactly opposite movement and requested return distance are separate roles',()=>{
 for(let n=1;n<=60;n++){
  assert.equal(renderEdition({...rows[2],params:{start:-n}}).answer,String(-n));
  assert.equal(renderEdition({...rows[8],params:{start:n}}).answer,'O(0)');assert.equal(renderEdition({...rows[10],params:{start:-n}}).answer,String(n));
  assert.equal(renderEdition({...rows[3],params:{start:-n,first:n,second:7}}).answer,'7');
 }
});
test('translation requires correct initial coordinate and direction, not just any plausible number',()=>{
 assert.equal(rows[6].answer,'-3 + (-7)');assert.equal(-3+(-7),-10);assert.notEqual(-3+7,-10);assert.notEqual(3+(-7),-10);
 assert.equal(rows[9].answer,'Солға |b| бірлік жылжыту');assert.match(rows[9].statement,/b < 0/);assert.match(rows[9].solution,/міндетті түрде 0-де аяқталмайды/);
});
test('half-start crossing retains the sign and never treats tenths as whole steps',()=>{
 assert.equal(rows[7].answer,'-1,5');assert.equal(2.5-4,-1.5);assert.deepEqual(rows[7].options,['-1,5','1,5','6,5','-6,5']);
 assert.equal(renderEdition({...rows[7],params:{startHalves:7,left:6}}).answer,'-2,5');
});
test('changed fulltext/keys/options and invalid movement domains cannot verify',()=>{
 for(const r of rows){for(const k of ['statement','solution','answer'])assert.throws(()=>verifyEdition({...r,[k]:r[k]+' changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));}
 for(const[i,p]of [[0,{gain:6}],[1,{numerator:4}],[3,{first:4}],[4,{left:14}],[5,{right:17}],[7,{left:2}],[8,{start:0}],[10,{start:0}],[11,{left:6}]])assert.throws(()=>renderEdition({...rows[i],params:{...rows[i].params,...p}}));
});
test('exact12saved nonvisual2.7 occurrences remain closed without rawTeX or newcollection',()=>{
 const file='problems/sources/zerek/courses/6-math-2-7-level1.json',source=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));const refs=source.questions.filter(q=>!q.images?.length&&!q.svg?.length).map(q=>{assert.equal(q.checked,true);return file+'#'+q.id;});assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),refs.sort());assert.match(pack.scope,/Closed author draft/);assert.doesNotMatch(rows.flatMap(r=>[r.statement,r.solution,r.answer,...r.options||[]]).join(' '),/[\\$]|NaN|Infinity/);
});

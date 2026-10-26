import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-rational-sets-models.mjs';
import {mathFragments} from '../frontend/src/mathPresentation.js';
const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-rational-sets.json',import.meta.url),'utf8')),rows=pack.editions;
const keys=['(-8/1)','(47/10)','0','(-35/5)','6','-9','8','Z және Q','33','-8 ∈ Z','9','4','13'];
test('all13 individually read rational-set sources match hand-derived keys and Standard scope',()=>{
 assert.equal(rows.length,13);assert.equal(keys.length,13);rows.forEach((r,i)=>{assert.equal(r.answer,keys[i],r.modelId);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);if(r.options){assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(o=>o===keys[i]).length,1);}});
});
test('rational representation preserves required numerator/positive denominator and whole decimal part',()=>{
 assert.equal(rows[0].answer,'(-8/1)');assert.match(rows[0].statement,/n — оң натурал сан/);assert.equal(rows[1].answer,'(47/10)');assert.equal(4*10+7,47);
 assert.equal(rows[8].answer,String(6*5+3));assert.match(rows[8].statement,/бөлімі дәл 5/);
});
test('classification uses exact reduced values rather than presence of fraction/decimal typography',()=>{
 assert.equal(-35/5,-7);assert.equal(rows[3].answer,'(-35/5)');assert.equal(rows[4].answer,'6');assert.equal(rows[11].answer,'4');
 assert.equal(renderEdition({...rows[11],params:{values:['(6/2)','3,0','(-4/-2)','-3','0','(1/3)','0,7']}}).answer,'3');
 assert.equal(renderEdition({...rows[4],params:{values:['(6/2)','3,0','(-4/-2)','-3','0','(1/3)','0,7','(-5/1)']}}).answer,'6');
});
test('N starts1, negative integers lie in both Z and Q, and set-membership glyph is native',()=>{
 assert.equal(rows[2].answer,'0');assert.equal(rows[7].answer,'Z және Q');assert.match(rows[7].statement,/1-ден басталатын/);assert.equal(-28/7,-4);
 assert.equal(rows[9].answer,'-8 ∈ Z');assert.match(rows[9].statement,/«∈»/);assert.match(rows[9].solution,/0 берілген N анықтамасына сай емес/);
});
test('strict negative interior versus inclusive full integer domain retain zero/endpoints correctly',()=>{
 const negative=[];for(let x=-9;x<=9;x++)if(x>-9&&x<9&&x<0)negative.push(x);assert.equal(negative.length,8);assert.equal(rows[6].answer,'8');
 const inclusive=[];for(let x=-6;x<=6;x++)inclusive.push(x);assert.equal(inclusive.length,13);assert.ok(inclusive.includes(0));assert.equal(rows[12].answer,'13');
 assert.equal(rows[10].answer,'9');assert.match(rows[10].statement,/минус таңбасы цифр болып саналмайды/);
});
test('signed numerator/denominator and mixed-number distractors all produce native fraction structures',()=>{
 assert.equal(mathFragments('(-8/1)')[0].type,'fraction');assert.equal(mathFragments('(1/-8)')[0].type,'fraction');assert.equal(mathFragments('(9 + (1/2))')[0].type,'mixed');
});
test('changed keys/conditions/options/solutions and invalid rational/mixed/interval domains are rejected',()=>{
 for(const r of rows){for(const k of ['statement','solution','answer'])assert.throws(()=>verifyEdition({...r,[k]:r[k]+' changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));}
 for(const [i,patch]of [[0,{value:0}],[1,{tenth:10}],[6,{left:0}],[7,{denominator:6}],[8,{numerator:5}],[12,{right:0}]])assert.throws(()=>renderEdition({...rows[i],params:{...rows[i].params,...patch}}));
});
test('coverage equals the13saved nonvisual level1 originals; no rawTeX/nonfinite values',()=>{
 const file='problems/sources/zerek/courses/6-math-2-3-level1.json',source=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));const refs=source.questions.filter(q=>!q.images?.length&&!q.svg?.length).map(q=>{assert.equal(q.checked,true);return file+'#'+q.id;});assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),refs.sort());
 assert.match(pack.scope,/Closed author draft/);assert.doesNotMatch(rows.flatMap(r=>[r.statement,r.solution,r.answer,...r.options||[]]).join(' '),/[\\$]|NaN|Infinity/);
});

import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-percent-problems-models.mjs';
import {mathFragments} from '../frontend/src/mathPresentation.js';
const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-percent-problems.json',import.meta.url),'utf8')),rows=pack.editions;
// Individually calculated before fixtures were entered; arithmetic unit/base
// traps below also use conservation checks separate from the renderer.
const keys=['10,5','600','28','u = (v × r/100)','14 кг қандай массаның 20%-ы екенін анықтау','2700','72','4500','m — 100%-ға сәйкес толық шама','40','40','(x/27) = (100/30)','2','75','450','(96/x) = (100/37,5)','9840','126','35%; 2520 бөлшек','658','60','350','250','66','120','22,5','20','100000','25','Екі мән тең','150','10000','77','120; 90','160','8000000','42','80','30','Әлидің ақшасы 8%-ға аз','8000','5%-ға артты','36','72','405','30','90 санының 75%-ы','14','42','50,4','Бірінші дүкенде, 350 теңгеге','80','9','1200'];
test('all54 individually adapted percent problems have exact hand-derived keys',()=>{
 assert.equal(rows.length,54);assert.equal(keys.length,54);assert.equal(new Set(rows.map(r=>r.editionId)).size,54);
 rows.forEach((r,i)=>{assert.equal(r.answer,keys[i],r.modelId);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);if(r.options)assert.equal(r.options.filter(o=>o===keys[i]).length,1);});
});
test('original whole, successive remainder and separate populations are explicitly different bases',()=>{
 assert.equal(360-360*25/100-360*40/100,126);assert.equal(rows[17].answer,'126');
 assert.equal(120*(1-25/100)*(1-40/100),54);assert.equal(rows[24].answer,'120');assert.match(rows[24].statement,/ҚАЛҒАН/);
 assert.equal(40*(1-20/100)*62.5/100,20);assert.equal(rows[26].answer,'20');
 assert.equal(96*25/100+80*45/100,60);assert.equal(rows[37].answer,'80');
});
test('dry matter, overlapping coverage, alloy and fixed budget independently conserve quantities',()=>{
 assert.equal(42*25,15*70);assert.equal(rows[36].answer,'42');
 assert.equal(80*75/100+80*55/100-24,80);assert.equal(rows[51].answer,'80');
 assert.equal(9*60+18*30,(9+18)*40);assert.equal(rows[52].answer,'9');
 assert.equal(9600/1200-9600/1600,2);assert.equal(rows[53].answer,'1200');assert.match(rows[53].statement,/ЖАҢА/);
});
test('growth products, unequal class sizes and strict boundary reject plausible wrong methods',()=>{
 assert.equal(8000000*80/100*80/100,5120000);assert.equal(rows[35].answer,'8000000');
 assert.equal(8000*140/100*85/100-8000,1520);assert.equal(rows[40].answer,'8000');
 assert.equal(75*140/100,105);assert.equal(rows[41].answer,'5%-ға артты');
 assert.equal((30*80+20*60)/(30+20),72);assert.notEqual((80+60)/2,72);assert.equal(rows[43].answer,'72');
 assert.equal(rows[46].options.filter(o=>{const n=o.match(/\d+/g).map(Number);return n[0]*n[1]>60*100;}).length,1);
});
test('both whole/part proportion MCQs have exactly one correct printed equality',()=>{
 const calculate=(s,x)=>{const m=s.match(/^\((\d+(?:,\d+)?|x)\/(\d+(?:,\d+)?|x)\) = \((\d+(?:,\d+)?|x)\/(\d+(?:,\d+)?|x)\)$/);assert.ok(m);const v=m.slice(1).map(v=>v==='x'?x:Number(v.replace(',','.')));return v[0]*v[3]===v[1]*v[2];};
 for(const [index,x]of [[11,90],[15,36]]){const r=rows[index];assert.deepEqual(r.options.filter(o=>calculate(o,x)),[r.answer]);}
});
test('new canonical algebra/decimal fractions become structural native fractions',()=>{
 for(const s of ['(v × r/100)','(84/x)','(100/12,5)','(m/n)','(9600 × 75/(100 × y))']){
  const out=mathFragments(s);assert.equal(out.length,1,s);assert.equal(out[0].type,'fraction',s);
 }
 assert.doesNotMatch(rows.map(r=>[r.statement,r.solution,r.answer,...(r.options||[])].join(' ')).join(' '),/[\\$]|Infinity|NaN/);
});
test('altered keys, text, solutions and MCQs fail the frozen author check',()=>{
 for(const r of rows){for(const k of ['statement','solution','answer'])assert.throws(()=>verifyEdition({...r,[k]:r[k]+' changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));}
});
test('archive coverage is exactly all54 saved nonvisual topic1.7 occurrences',()=>{
 const expected=[];for(const level of ['1','2','3','test']){const file=`problems/sources/zerek/courses/6-math-1-7-level${level}.json`,source=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));for(const q of source.questions){assert.equal(q.checked,true);assert.ok(!q.images?.length&&!q.svg?.length);expected.push(file+'#'+q.id);}}
 assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),expected.sort());assert.match(pack.scope,/excluded from Standard delivery until/);
});

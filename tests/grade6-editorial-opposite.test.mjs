import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-opposite-models.mjs';
const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-opposite.json',import.meta.url),'utf8')),rows=pack.editions;
const keys=['-7','-0 = 0','0','22','(5/12)','27','-4,7 және 4,7','14','8','31','26','6,2','-(-0,7) = -0,7','12','3','-7,8','3','-3','-(13/24)','a < 0','-42','8','-9 және 5','-4 және 6'];
test('all24 opposite/coordinate sources match hand-derived keys, unique choices and Standard access',()=>{
 assert.equal(rows.length,24);assert.equal(keys.length,24);rows.forEach((r,i)=>{assert.equal(r.answer,keys[i],r.modelId);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);if(r.options){assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(o=>o===keys[i]).length,1);}});
});
test('opposite, reciprocal, origin and positive distance are distinct targets',()=>{
 assert.equal(rows[0].answer,'-7');assert.equal(rows[4].answer,'(5/12)');assert.notEqual(rows[4].answer,'(12/5)');assert.equal(rows[2].answer,'0');assert.equal(rows[7].answer,'14');
 assert.equal(rows[3].answer,String(11-(-11)));assert.equal(rows[11].answer,'6,2');assert.equal(rows[15].answer,'-7,8');
});
test('opposite pairs compare exact decimal/fraction values and count each unordered pair once',()=>{
 assert.equal(rows[6].answer,'-4,7 және 4,7');assert.equal(rows[14].answer,'3');
 const r=renderEdition({...rows[14],params:{values:['(1/2)','-0,5','3','-3','0,25','-(1/4)','9']}});assert.equal(r.answer,'3');
 assert.throws(()=>renderEdition({...rows[14],params:{values:['(1/2)','0,5','3','-3','0,25','-(1/4)','9']}}));
});
test('strict integer endpoints, shifted/reflected points and midpoint are checked independently',()=>{
 const eligible=[];for(let x=-8;x<=5;x++)if(x>-8&&x<5)eligible.push(x);assert.equal(eligible.length,12);assert.ok(eligible.includes(0));assert.equal(rows[13].answer,'12');
 const b=-4+11,c=-b;assert.equal(Math.abs(c-(-4)),3);assert.equal(rows[16].answer,'3');
 assert.equal((-11+5)/2,-3);assert.equal(rows[17].answer,'-3');assert.equal(Math.abs(-3-(-11)),Math.abs(5-(-3)));
});
test('fraction equation preserves common-denominator calculation before negation',()=>{
 assert.equal(7*3-1*8,13);assert.equal(rows[18].answer,'-(13/24)');assert.match(rows[18].solution,/\(21\/24\).*\(8\/24\)/);
 assert.match(rows[12].answer,/-\(-0,7\) = -0,7/);assert.match(rows[12].solution,/-\(-0,7\) = 0,7/);
});
test('all3..8 nested negation counts follow unary parity and two distance points exhaust both directions',()=>{
 for(let count=3;count<=8;count++){const r=renderEdition({...rows[20],params:{value:42,count}});assert.equal(r.answer,String(count%2?-42:42));}
 assert.equal(rows[20].answer,'-42');const solutions=[];for(let x=-20;x<=20;x++)if(Math.abs(x+2)===7)solutions.push(x);assert.deepEqual(solutions,[-9,5]);assert.equal(rows[22].answer,'-9 және 5');
 assert.equal(rows[23].answer,'-4 және 6');assert.equal(800/200,4);assert.equal(1200/200,6);
});
test('changed keys/text/options/solutions and invalid endpoint/unit/rational domains are rejected',()=>{
 for(const r of rows){for(const k of ['statement','solution','answer'])assert.throws(()=>verifyEdition({...r,[k]:r[k]+' changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));}
 for(const [i,patch] of [[0,{distance:0}],[4,{denominator:0}],[13,{left:0}],[17,{right:4}],[20,{count:9}],[23,{unit:300}]])assert.throws(()=>renderEdition({...rows[i],params:{...rows[i].params,...patch}}));
});
test('coverage equals the24 saved nonvisual level1/2 sources; no rawTeX or nonfinite values',()=>{
 const refs=[];for(const level of ['1','2']){const file=`problems/sources/zerek/courses/6-math-2-2-level${level}.json`,b=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));for(const q of b.questions.filter(q=>!q.images?.length&&!q.svg?.length)){assert.equal(q.checked,true);refs.push(file+'#'+q.id);}}
 assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),refs.sort());assert.match(pack.scope,/Closed author draft/);assert.doesNotMatch(rows.flatMap(r=>[r.statement,r.solution,r.answer,...r.options||[]]).join(' '),/[\\$]|NaN|Infinity/);
});

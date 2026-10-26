import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-scale-models.mjs';
const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-scale.json',import.meta.url),'utf8')),rows=pack.editions;
const keys=['7','13','90','Картадағы 1 см жерде 750 м-ге сәйкес','7,2','1 см — 35 км','360','250000','12','60','3','1 : 200','6 : 1','4,5','2,5','1 : 3000000','600','60 м; 36 м','3,5','24','2,4','10','135','6','1 : 4000000','1,2','66','Екінші картада, 14 см','60','400000','50 : 1','6','11:30','600','72','200','3969','108','2','1 : 3000000','48','1 : 300','2','25','Сызбадағы ұзындық нақтыдан 4 есе үлкен','375000','7,5','1 : 75000; 8 см; 60 км','39','1,5','5','864','252000','8'];
test('all54 scale editions have hand-derived exact keys, one choice and frozen author binding',()=>{
 assert.equal(rows.length,54);assert.equal(keys.length,54);assert.equal(new Set(rows.map(r=>r.editionId)).size,54);
 rows.forEach((r,i)=>{assert.equal(r.answer,keys[i],r.modelId);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);if(r.options)assert.equal(r.options.filter(o=>o===keys[i]).length,1);});
});
test('enlargement and mm/cm/metre/kilometre conversion directions remain distinct',()=>{
 assert.equal(56/8,7);assert.equal(rows[0].answer,'7');assert.equal(2.4*25,60);assert.equal(rows[9].answer,'60');
 assert.equal(2500000/1000000,2.5);assert.equal(rows[14].answer,'2,5');
 assert.equal(48*125/10,600);assert.equal(rows[16].answer,'600');
 assert.equal(264*1000000/4000000,66);assert.equal(rows[26].answer,'66');assert.match(rows[26].statement,/МИЛЛИМЕТР/);
});
test('all squared/cubed scale traps independently conserve physical area and volume',()=>{
 assert.equal(8*3*5**2,600);assert.equal(rows[33].answer,'600');
 assert.equal(32*250**2/10000,200);assert.equal(rows[35].answer,'200');
 assert.equal(18*(90000/270000)**2,2);assert.equal(rows[38].answer,'2');
 assert.equal(5*300**2/10000,45);assert.equal(rows[41].answer,'1 : 300');
 assert.equal(108*200**3/1000000,864);assert.equal(rows[51].answer,'864');assert.notEqual(rows[51].answer,'4,32');
});
test('copied map, head-on route, time clock and inverse area/perimeter chains retain every stage',()=>{
 assert.equal(18/3.75*1500/100,72);assert.equal(rows[34].answer,'72');
 assert.equal(7*60+20+240/64*60+25,11*60+30);assert.equal(rows[32].answer,'11:30');
 assert.equal(80*(1+48/60)*100000/4.8,3000000);assert.equal(rows[39].answer,'1 : 3000000');
 assert.equal((18*300000/100000)/(12+15),2);assert.equal(rows[42].answer,'2');
 assert.equal(Math.sqrt(36)*250/100*4*4200,252000);assert.equal(rows[52].answer,'252000');
});
test('all scale-table rows are checked using actual printed units rather than known answer index',()=>{
 const r=rows[47],invalid=r.options.filter(o=>{const m=o.match(/^1 : (\d+); ([\d,]+) см; ([\d,]+) (м|км)$/);assert.ok(m);return Number(m[1])*Number(m[2].replace(',','.'))!==Number(m[3].replace(',','.'))*(m[4]==='м'?100:100000);});
 assert.deepEqual(invalid,[r.answer]);assert.equal(invalid.length,1);
});
test('wrong answers, changed conditions/options/explanations fail frozen author check',()=>{
 for(const r of rows){for(const k of ['statement','solution','answer'])assert.throws(()=>verifyEdition({...r,[k]:r[k]+' changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));}
});
test('invalid time/minute and dimension data cannot silently create an edition',()=>{
 const r=rows[32];for(const patch of [{stopMinutes:-1},{depart:'24:00'},{speed:0}])assert.throws(()=>renderEdition({...r,params:{...r.params,...patch}}));
 assert.throws(()=>renderEdition({...rows[39],params:{...rows[39].params,minutes:60}}));
 assert.throws(()=>renderEdition({...rows[41],params:{...rows[41].params,realArea:46}}));
});
test('source coverage is exactly all54 saved nonvisual topic1.8 originals, and TeX never leaks',()=>{
 const expected=[];for(const level of ['1','2','3','test']){const file=`problems/sources/zerek/courses/6-math-1-8-level${level}.json`,source=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));for(const q of source.questions){assert.equal(q.checked,true);assert.ok(!q.images?.length&&!q.svg?.length);expected.push(file+'#'+q.id);}}
 assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),expected.sort());assert.match(pack.scope,/Closed author draft until separate/);
 assert.doesNotMatch(rows.map(r=>[r.statement,r.solution,r.answer,...(r.options||[])].join(' ')).join(' '),/[\\$]|Infinity|NaN/);
});

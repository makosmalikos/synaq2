import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-signed-contexts-models.mjs';
const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-signed-contexts.json',import.meta.url),'utf8')),rows=pack.editions;
const keys=['13','0 оң сандарға да, теріс сандарға да кірмейді','-17 °C','Ойыншы 11 ұпай жоғалтты','4','65','-48 м','47000','12','18','5','-(4/11)','Кітапша бағасы 35 теңгеге арзандады','-13 мин','960','-640; +6700; 0','-17 см','-75; +42','-3400; 0; +3800','11','-5; 0; -(3/4)','12','+11 км','26','8842','Теріс емес сан не оң сан, не 0 болады','-302 м','+5 °C','230','-160 м','1400','19','464','18:48, 12 минут ерте'];
test('all34 source-addressed signed contexts match hand-derived keys and unique choices',()=>{
 assert.equal(rows.length,34);assert.equal(keys.length,34);rows.forEach((r,i)=>{assert.equal(r.answer,keys[i],r.modelId);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);if(r.options){assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(o=>o===r.answer).length,1);}});
});
test('signed coordinate, distance and magnitude remain different targets',()=>{
 assert.equal(rows[0].answer,'13');assert.match(rows[0].solution,/-13 °C/);assert.equal(rows[5].answer,'65');assert.equal(rows[6].answer,'-48 м');
 assert.equal(rows[7].answer,'47000');assert.match(rows[7].statement,/-47000/);assert.equal(rows[24].answer,String(8800+42));
});
test('zero belongs in both weak sign classes but neither strict sign class, including fractional/decimal values',()=>{
 assert.equal(rows[4].answer,'4');assert.equal(rows[10].answer,'5');assert.equal(rows[20].answer,'-5; 0; -(3/4)');
 const r=rows[10],edited=renderEdition({...r,params:{values:['-0','+0','0,0','-(0/7)','(0/3)','-(2/9)','-0,1','+0,1']}});assert.equal(edited.answer,'6');
 assert.match(rows[25].solution,/-\(2\/9\)/);assert.match(rows[1].solution,/оң да, теріс те емес/);
});
test('no-zero floor gaps are counted separately from number of labelled floors and elapsed historical years',()=>{
 assert.equal(rows[9].answer,String(3+15));assert.equal(rows[21].answer,String(4+9-1));assert.equal(rows[32].answer,String(150+315-1));
 assert.match(rows[21].statement,/нөлінші қабат жоқ/);assert.match(rows[32].statement,/жылдың басында/);assert.match(rows[17].statement,/өткен уақытты есептеу талап етілмейді/);
 const sequence=[-4,-3,-2,-1,1,2,3,4,5,6,7,8,9];assert.equal(sequence.length-1,12);
});
test('multiple balances and reference levels conserve all stages exactly',()=>{
 assert.equal(-8+13-9-7,-11);assert.equal(rows[19].answer,'11');assert.equal(-36+184-450,-302);assert.equal(rows[26].answer,'-302 м');
 assert.equal(-320+800-4*150+350,230);assert.equal(rows[28].answer,'230');assert.match(rows[28].statement,/теріс баланста да қызметті жалғастыруға/);
 assert.equal((520-560)*4,-160);assert.equal(rows[29].answer,'-160 м');assert.equal(31000-28000-6500+20900-16000,1400);assert.equal(rows[30].answer,'1400');
});
test('inverse quiz and shifted clock preserve their separate missing stages',()=>{
 const solutions=Array.from({length:27},(_,n)=>n).filter(n=>n*4-(26-n)*2===62);assert.deepEqual(solutions,[19]);assert.equal(rows[31].answer,'19');
 assert.equal((9*60+10)-(8*60+57),13);assert.equal(rows[13].answer,'-13 мин');assert.equal(19*60-5-7,18*60+48);assert.equal(rows[33].answer,'18:48, 12 минут ерте');
 assert.equal(-7+4*3,5);assert.equal(rows[27].answer,'+5 °C');
});
test('changed conditions/keys/options/explanations and physically invalid inputs are rejected',()=>{
 for(const r of rows){for(const k of ['statement','solution','answer'])assert.throws(()=>verifyEdition({...r,[k]:r[k]+' changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));}
 for(const [i,patch] of [[0,{drop:0}],[13,{actual:'24:01'}],[19,{rise:1}],[21,{basement:0}],[27,{end:'17:30'}],[31,{score:63}],[33,{target:'00:03'}]])assert.throws(()=>renderEdition({...rows[i],params:{...rows[i].params,...patch}}));
});
test('coverage exactly matches34 saved nonvisual sources with no new collection or raw TeX',()=>{
 const refs=[];for(const level of ['1','2','3']){const file=`problems/sources/zerek/courses/6-math-2-1-level${level}.json`;const b=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));for(const q of b.questions.filter(q=>!q.images?.length&&!q.svg?.length)){assert.equal(q.checked,true);refs.push(file+'#'+q.id);}}
 assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),refs.sort());assert.match(pack.scope,/Closed author draft/);
 assert.doesNotMatch(rows.flatMap(r=>[r.statement,r.solution,r.answer,...r.options||[]]).join(' '),/[\\$]|NaN|Infinity/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderEdition, verifyEdition } from '../scripts/editorial/grade6-vector-basics-models.mjs';
import { retainedVectorSources } from '../scripts/editorial/grade6-vector-basics-specs.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-vector-basics.json',import.meta.url))).editions;
const keys=['8','Солтүстікке бағытталған 24 км/сағ қозғалыс жылдамдығы','Терезенің 2,4 м² ауданы','Шығысқа қарай 72 км/сағ','7','Скаляр шама'];
test('six remaining individually read grade6 vector skills have exact hand targets and closed Standard scope',()=>{
 assert.equal(rows.length,6);rows.forEach((r,i)=>{assert.equal(r.answer,keys[i]);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.grade,6);assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'draft');if(r.options)assert.equal(r.options.filter(o=>o===keys[i]).length,1);});
});
test('known speed scale inverse length differs from multiplying two unrelated units',()=>{
 assert.equal(48/6,Number(rows[0].answer));assert.notEqual(48*6,Number(rows[0].answer));
 for(let scale=1;scale<=40;scale++)for(let length=1;length<=40;length++){
  const speed=scale*length,out=renderEdition({...rows[0],params:{scale,speed}});assert.equal(Number(out.answer),length);assert.equal(Number(out.answer)*scale,speed);
 }
});
test('infer speed per cell THEN find new length, common proportional scale exact on both vectors',()=>{
 assert.equal(28/4,7);assert.equal(49/7,Number(rows[4].answer));assert.notEqual(49/4,Number(rows[4].answer));
 for(let unit=1;unit<=20;unit++)for(let knownCells=1;knownCells<=20;knownCells++)for(let targetCells=1;targetCells<=20;targetCells++){
  const knownSpeed=unit*knownCells,targetSpeed=unit*targetCells,q=renderEdition({...rows[4],params:{knownSpeed,knownCells,targetSpeed}});assert.equal(Number(q.answer),targetCells);assert.equal(knownSpeed*Number(q.answer),targetSpeed*knownCells);
 }
});
test('classify all actual MCQ: scalar negative sign is not spatial direction, full velocity requires both fields',()=>{
 assert.deepEqual(rows[1].options.map(o=>o.includes('Солтүстікке')),[false,false,true,false]);
 assert.equal(rows[1].options[3],'Ауаның -8 °C температурасы');assert.match(rows[1].solution,/Теріс температураның таңбасы кеңістіктегі бағыт емес/);
 assert.equal(rows[2].options[1],keys[2]);assert.match(rows[2].options[0],/солтүстікке/);assert.match(rows[2].options[2],/бағыты/);assert.match(rows[2].options[3],/векторы/);
 assert.deepEqual(rows[3].options,['72 км/сағ','Шығысқа қарай','Жолда 3 сағат',keys[3]]);
 const information=[{magnitude:true,direction:false,time:false},{magnitude:false,direction:true,time:false},{magnitude:false,direction:false,time:true},{magnitude:true,direction:true,time:false}];assert.deepEqual(information.map(p=>p.magnitude&&p.direction&&!p.time),[false,false,false,true]);
 assert.deepEqual(rows[5].options,['Бағытталған кесінді','Скаляр шама','Векторлық шама','Бірлік кесінді']);assert.match(rows[5].statement,/ФИЗИКАЛЫҚ ШАМАНЫҢ/);
});
test('source coverage retains three verified original native diagrams instead of publishing duplicates',()=>{
 const s=JSON.parse(fs.readFileSync(new URL('../problems/sources/zerek/courses/6-math-7-2-level1.json',import.meta.url)));assert.equal(s.grade,6);const old=s.questions.filter(q=>!q.images?.length&&!q.svg?.length);assert.equal(old.length,9);
 assert.deepEqual([...rows.map(r=>r.sourceRefs[0].sourceId),...retainedVectorSources.keys()].sort(),old.map(q=>q.id).sort());
 const bank=JSON.parse(fs.readFileSync(new URL('../backend/data/synaqAdaptedQuestions.json',import.meta.url)));for(const [id,edition]of retainedVectorSources){const r=bank.find(q=>q.id===edition);assert.ok(r);assert.equal(r.grade,6);assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'verified');assert.ok(!rows.some(q=>q.sourceRefs[0].sourceId===id));}
 for(const r of rows){const q=old.find(q=>q.id===r.sourceRefs[0].sourceId);assert.equal(q.checked,true);assert.notEqual(q.statement.normalize('NFKC'),r.statement.normalize('NFKC'));}
});
test('tampered content, missing parameters, invalid scales and nonintegral inverse lengths rejected',()=>{
 for(const r of rows){for(const key of ['statement','answer','solution'])assert.throws(()=>verifyEdition({...r,[key]:r[key]+'changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));for(const key of Object.keys(r.params)){const params={...r.params};delete params[key];assert.throws(()=>renderEdition({...r,params}));}assert.doesNotMatch([r.statement,r.solution,r.answer,...r.options||[]].join(' '),/[\\$]|NaN|Infinity/);}
 for(const bad of [0,-1,1.5]){assert.throws(()=>renderEdition({...rows[0],params:{scale:bad,speed:48}}));assert.throws(()=>renderEdition({...rows[3],params:{speed:bad}}));assert.throws(()=>renderEdition({...rows[4],params:{knownSpeed:28,knownCells:bad,targetSpeed:49}}));}
 assert.throws(()=>renderEdition({...rows[0],params:{scale:6,speed:49}}));assert.throws(()=>renderEdition({...rows[4],params:{knownSpeed:29,knownCells:4,targetSpeed:49}}));assert.throws(()=>renderEdition({...rows[4],params:{knownSpeed:28,knownCells:4,targetSpeed:48}}));
});

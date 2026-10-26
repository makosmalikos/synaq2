import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-river-basics-models.mjs';
const pack=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-river-basics.json',import.meta.url),'utf8')),rows=pack.editions;
const keys=['17','7','27','Екі бағыттағы жылдамдық айырмасы ағыс жылдамдығының екі есесіне тең','33','35','24','4','23','6','5'];
test('all11saved river adaptations match hand-derived author keys and paid scope',()=>{
 assert.equal(rows.length,11);rows.forEach((r,i)=>{assert.equal(r.answer,keys[i]);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);if(r.options)assert.equal(r.options.filter(o=>o===keys[i]).length,1);});
});
test('speed mean and half difference use the same shore frame over the whole small integer domain',()=>{
 for(let own=2;own<=50;own++)for(let current=1;current<own;current++){
  const down=own+current,up=own-current;
  assert.equal(renderEdition({...rows[4],params:{down,up}}).answer,String(own));
  // Avoid accidental identical distractors in this particular four-option schema.
  if(current*2!==own)assert.equal(renderEdition({...rows[10],params:{down,up}}).answer,String(current));
  assert.equal((own+current)-(own-current),2*current);
 }
});
test('decimal travel retains tenths of speed and time and applies upstream speed before distance',()=>{
 assert.equal((125-25)*35,3500);assert.equal(rows[5].answer,'35');assert.deepEqual(rows[5].options,['52,5','43,75','35','10']);
 assert.equal(renderEdition({...rows[5],params:{ownTenths:145,currentTenths:25,hoursTenths:25}}).answer,'30');
 for(let ct=5;ct<=95;ct+=5)assert.equal(renderEdition({...rows[1],params:{currentTenths:ct}}).answer,String(ct/5));
});
test('lake and raft distinguish water-relative speed from shore-relative speed',()=>{
 assert.equal(rows[0].answer,'17');assert.match(rows[0].statement,/ағыссыз көлге/);assert.equal(rows[7].answer,'4');assert.match(rows[7].statement,/ЖАҒАҒА қатысты/);assert.match(rows[7].solution,/суға қатысты меншікті жылдамдығы 0/);
 assert.equal(28/7,4);assert.equal(19+28/7,23);assert.equal(rows[8].answer,'23');
});
test('upstream time and reconstruction add current twice only when starting with upstream speed',()=>{
 assert.equal(rows[6].answer,String(16+2*4));assert.equal(rows[9].answer,String(126/(25-4)));
 for(let own=5;own<=30;own++)for(let current=1;current<own;current++)assert.equal(renderEdition({...rows[9],params:{own,current,km:(own-current)*7}}).answer,'7');
});
test('altered keys/fullconditions/fullsolutions/options and invalid physical/exactness domains fail',()=>{
 for(const r of rows){for(const k of ['statement','solution','answer'])assert.throws(()=>verifyEdition({...r,[k]:r[k]+' changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));}
 for(const[i,p]of [[0,{own:2}],[1,{currentTenths:34}],[2,{current:32}],[4,{up:0}],[5,{currentTenths:130}],[7,{current:3}],[8,{raftHours:9}],[9,{km:127}]])assert.throws(()=>renderEdition({...rows[i],params:{...rows[i].params,...p}}));
});
test('all11 saved nonvisual2.6 occurrences are closed drafts without source collection or TeX',()=>{
 const file='problems/sources/zerek/courses/6-math-2-6-level1.json',source=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));const refs=source.questions.filter(q=>!q.images?.length&&!q.svg?.length).map(q=>{assert.equal(q.checked,true);return file+'#'+q.id;});assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceFile+'#'+ref.sourceId)).sort(),refs.sort());assert.match(pack.scope,/Closed author draft/);assert.doesNotMatch(rows.flatMap(r=>[r.statement,r.solution,r.answer,...r.options||[]]).join(' '),/[\\$]|NaN|Infinity/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {POOL,BANK_QUARANTINE} from '../frontend/src/bank.js';
import {zerekReviewedQuestions as tasks} from '../frontend/src/zerekReviewedQuestions.js';
import {api} from '../frontend/src/api.js';
import {ensureBankReady} from '../frontend/src/bank.js';
import {solveCryptarithm} from './helpers/cryptarithm-solver.mjs';
const models=JSON.parse(fs.readFileSync(new URL('../problems/sources/zerek/cryptarithms-models.json',import.meta.url)));
const shape=s=>s.toLowerCase().replace(/\d+(?:[.,]\d+)?/g,'#').replace(/\s+/g,' ').trim();
const display=e=>e.replaceAll('+',' + ').replaceAll('-',' − ').replaceAll('*',' × ');

test('all imported targets have one answer across every valid digit assignment',()=>{
  for(const q of tasks){
    const model=models.find(m=>m.number===q.sourceNumber);
    assert.ok(model,q.id);
    const checked=solveCryptarithm(model);
    assert.ok(checked.assignments>0,q.id);
    assert.deepEqual(checked.answers,[q.answer],q.id);
    for(const [left,right] of model.equations) assert.ok(q.statement.includes(`${display(left)} = ${display(right)}`),q.id);
    if(Array.isArray(model.target)) assert.ok(q.statement.includes(`(${display(model.target[0])}) / (${display(model.target[1])})`));
    else assert.ok(q.statement.includes(display(model.target)+' '),q.id);
  }
});
test('21 archived Kazakh BIL logic tasks retain unique options and checked provenance',()=>{
  assert.equal(tasks.length,21);
  // Authored adaptations can deliberately share their archived source model.
  // Compare this original batch only with the unrelated historical bank.
  const old=new Set(POOL.filter(q=>!q.id.startsWith('zerek_')&&!q.id.startsWith('synaq_adapted_')).map(q=>shape(q.statement)));
  assert.equal(new Set(tasks.map(q=>shape(q.statement))).size,tasks.length);
  assert.deepEqual([2,6,12,14].filter(n=>tasks.some(q=>q.sourceNumber===n)),[]);
  for(const q of tasks){
    const active=POOL.find(x=>x.id===q.id);
    assert.equal(active,undefined,q.id); assert.equal(q.lang,'kk'); assert.equal(q.school,'БИЛ');
    assert.equal(q.subject,'logic'); assert.equal(q.topic,'mtx');
    assert.equal(BANK_QUARANTINE.some(x=>x.id===q.id),false);
    assert.equal(old.has(shape(q.statement)),false,q.id);
    assert.equal(q.options.length,5); assert.equal(new Set(q.options).size,5); assert.ok(q.options.includes(q.answer));
    assert.ok(q.solution.length>60); assert.match(q.source,/Zerek/); assert.match(q.sourceUrl,/^https:\/\/zerek.app\/tests\//);
    assert.equal(q.image||null,null);
  }
});
test('archived cryptarithms are withheld by the practice API and server lookup',async()=>{
  await ensureBankReady(async()=>[]);
  const ids=new Set(tasks.map(q=>q.id));
  assert.ok((await api.topicQuestions('mtx')).every(q=>!ids.has(q.id)));
  const require=createRequire(import.meta.url);const {findTrainingQuestion}=require('../backend/lib/training-question');
  for(const q of tasks)assert.equal(await findTrainingQuestion(null,q.id),null,q.id);
});
test('checker rejects impossible and nonunique tasks, permits zero only off leading digits',()=>{
  assert.deepEqual(solveCryptarithm({equations:[['AA','0']],target:'A'}),{assignments:0,answers:[]});
  assert.deepEqual(solveCryptarithm({equations:[['AB','30']],target:'B'}),{assignments:1,answers:['0']});
  assert.deepEqual(solveCryptarithm({equations:[['AB','33']],target:'A'}),{assignments:0,answers:[]});
  assert.ok(solveCryptarithm({equations:[['A+B','9']],target:'A'}).answers.length>1);
  assert.deepEqual(solveCryptarithm({equations:[['AB','12']],target:'A'}).answers,['1']);
});

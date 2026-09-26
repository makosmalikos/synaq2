import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { nishMath } from '../frontend/src/data.js';
import { POOL, BANK_QUARANTINE } from '../frontend/src/bank.js';
import { isCorrect, isGradable } from '../frontend/src/grading.js';

// This legacy file is a plain CommonJS data export, not an application module.
// Evaluate it in isolation so content checks do not load backend dependencies.
const legacySource=readFileSync(new URL('../backend/data/nishQuestions.js',import.meta.url),'utf8');
const legacy=JSON.parse(JSON.stringify(vm.runInNewContext(`${legacySource}\nmodule.exports`,{module:{exports:{}}})));
const question=id=>{const found=nishMath.find(item=>item.id===id);assert.ok(found,`missing ${id}`);return found};

test('nm1 uses total distance / total time, not an unweighted mean of speeds',()=>{
 const q=question('nm1');
 assert.match(q.statement,/3 часа.*5км\/ч.*4часа.*12 раз.*8 часов.*4\/5/);
 const walkingSpeed=5,trainSpeed=walkingSpeed*12,busSpeed=trainSpeed*4/5;
 const distance=3*walkingSpeed+4*trainSpeed+8*busSpeed;
 const time=3+4+8;
 assert.equal(distance,639);assert.equal(distance/time,42.6);
 assert.equal(q.answer,`${distance}км и ${String(distance/time).replace('.',',')}км/ч`);
 for(const answer of ['639 км и 42,6 км/ч','639км и 42.6км/ч'])assert.equal(isCorrect(answer,q),true);
 for(const answer of ['639км и 37км/ч','639км и 37,7км/ч'])assert.equal(isCorrect(answer,q),false);
 assert.match(q.solution,/639 ÷ 15 = 42,6/);
 assert.doesNotMatch(q.solution,/37[,.]?7?\s*км/);
});

test('Russian nm5 and Kazakh nm63 distinguish the difference from the 56-unit gap',()=>{
 const minuend=624/2,subtrahend=(minuend+56)/2,difference=minuend-subtrahend;
 assert.deepEqual([minuend,subtrahend,difference],[312,184,128]);
 assert.equal(minuend+subtrahend+difference,624);
 assert.equal(subtrahend-difference,56);
 for(const id of ['nm5','nm63']){
  const q=question(id);assert.match(q.statement,/624/);assert.match(q.statement,/56/);
  assert.equal(q.answer,[minuend,subtrahend,difference].join(', '));
  assert.equal(isCorrect('312,184,128',q),true);assert.equal(isCorrect('312, 184, 56',q),false);
  assert.match(q.solution,/312 − 184 = 128/);assert.match(q.solution,/184 − 128 = 56/);
 }
 assert.match(question('nm63').solution,/айырма 128/);
});

test('incomplete Kazakh nm59 is retained for repair but never issued by the active bank',()=>{
 const source=question('nm59');
 assert.match(source.statement,/жылдамдығының\s+бөлігін/,'the missing fraction must not be invented');
 assert.equal(source.answer,null);assert.equal(isGradable(source),false);
 assert.match(source.note,/отсутствует дробь/);
 assert.equal(POOL.some(q=>q.id==='nm59'),false);
 const quarantined=BANK_QUARANTINE.find(q=>q.id==='nm59');
 assert.ok(quarantined);assert.equal(quarantined.quarantineReason,'missing_answer');
});

test('the four corrected/quarantined legacy REST records match the canonical bank exactly',()=>{
 for(const id of ['nm1','nm5','nm59','nm63'])assert.deepEqual(legacy.find(q=>q.id===id),question(id));
});

// Independently recomputed sample, not an assertion against copied answer keys.
// Conditions were read in full; these examples cover arithmetic, ratios, age,
// motion, an arithmetic progression, perimeter and least common multiples.
test('18 additional quantitative tasks have independently checked answer keys',async t=>{
 const gcd=(a,b)=>b?gcd(b,a%b):a;
 const samples=[
  ['nm2',/трёх.*нечётных.*57/,[57/3-2,57/3,57/3+2].join(', ')],
  ['nm3',/220.*3\/7/,String(220/(1-3/7))],
  ['nm4',/30.*3.*4 раза/,String((30-3)/(1-1/4))],
  ['nm6',/четырёх.*48.*два года/,String(48-4*2)],
  ['nm7',/100м.*5 частей.*5м/,String((100-5*(0+1+2+3+4))/5+5*4)],
  ['nm8',/195 км.*3ч.*5ч.*вдвое меньше/,`${195/(3+5*2)} и ${195/(3+5*2)*2}`],
  ['nm9',/8:5.*18 страниц/,String(18/(8-5)*(8+5))],
  ['nm10',/4 раза.*24 кролика/,`${24*2/(4-1)} и ${24*2/(4-1)*4}`],
  ['nm11',/8172 и 1828/,String(8172+1828)],
  ['nm12',/7252 и 4379/,String(7252-4379)],
  ['nm13',/27 и 29/,String(27*29)],
  ['nm14',/224 и 16/,String(224/16)],
  ['nm15',/суммы и разности.*27 и 22/,String((27+22)*(27-22))],
  ['nm16',/9372.*115.*меньше/,String(9372-115)],
  ['nm17',/1500.*2 раза меньше/,String(1500/2)],
  ['nm18',/101 и 202/,String(101*202)],
  ['nm19',/периметр.*294м2.*21м/,`${2*(21+294/21)}м`],
  ['nm20',/кратное.*30 и 40/,String(30*40/gcd(30,40))],
 ];
 for(const [id,condition,expected] of samples)await t.test(id,()=>{
  const q=question(id);assert.match(q.statement,condition);
  assert.equal(isCorrect(expected,q),true,`${id}: recomputed answer ${expected}, key ${q.answer}`);
  assert.ok(POOL.some(item=>item.id===id),`${id} remains active`);
 });
});

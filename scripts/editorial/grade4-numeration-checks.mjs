// Author-side regression checks; this is not an independent editorial signature.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './grade4-numeration-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-numeration-wave9.json',import.meta.url))).editions;
const expected=[
 '2','72006','төрт жүз алты мың жиырма үш','403 032; 403 320; 430 032; 433 003','10000','72 000 < 720 000','100 003','507060','806','50 000 + 700 + 9','бірлік мыңдар разряды','76608','67 068 және 67 070','608030','702 009','604 007','500 734','89999',
 '709 999','28706','10 234','<','30469','999 333','608 702','798 653','59999','899899899','16','3693','707 070','405700','жүздік мыңдар разряды','508063','604 507','65000',
 '8000','504 056; 504 650; 540 065; 545 006','68420','203 000 000','4 000 000','7 006 000','58','8','сегіз миллион жетпіс мың алты жүз','7 650; 76 500; 706 500; 7 065 000','480 − 48','807','8999998','24 060 009','67932','27 000 008','809','666'
];
assert.equal(rows.length,54);assert.equal(new Set(rows.map(r=>r.sourceRefs[0].sourceFile+':'+r.sourceRefs[0].sourceId)).size,54);
let mutations=0;
for(const [i,row] of rows.entries()){
 assert.equal(row.answer,expected[i],row.editionId);verifyEdition(row);
 for(const field of ['answer','statement','solution']){const bad=structuredClone(row);bad[field]+='!';assert.throws(()=>verifyEdition(bad));mutations++;}
 if(row.options){const bad=structuredClone(row);bad.options[0]+='!';assert.throws(()=>verifyEdition(bad));mutations++;}
 const bad=structuredClone(row);function incrementFirst(object){for(const k of Object.keys(object)){if(typeof object[k]==='number'){object[k]++;return true;}if(object[k]&&typeof object[k]==='object'&&incrementFirst(object[k]))return true;}return false;}assert(incrementFirst(bad.params));assert.throws(()=>verifyEdition(bad));mutations++;
}
const get=kind=>rows.filter(r=>r.modelId===`grade4-numeration-${kind}`);
const number=s=>Number(String(s).replaceAll(' ',''));
const wordValues=new Map(Object.entries({нөл:0,бір:1,екі:2,үш:3,төрт:4,бес:5,алты:6,жеті:7,сегіз:8,тоғыз:9,он:10,жиырма:20,отыз:30,қырық:40,елу:50,алпыс:60,жетпіс:70,сексен:80,тоқсан:90}));
function parseWords(s){let total=0,group=0;for(const word of s.split(' ')){if(wordValues.has(word))group+=wordValues.get(word);else if(word==='жүз')group=(group||1)*100;else if(word==='мың'||word==='миллион'){total+=group*(word==='мың'?1000:1000000);group=0;}else assert.fail(`Unrecognised word ${word}`);}return total+group;}
let lexicalChecks=0;
for(const row of [...get('word-number'),...get('word-compare'),...get('zero-count')]){const worded=row.statement.match(/«([^»]+)»/)[1],value=parseWords(worded),wanted=row.params.number??row.params.left;assert.equal(value,wanted);lexicalChecks++;}
for(const row of get('number-word')){assert.equal(parseWords(row.answer),row.params.number);assert.equal(row.options.filter(s=>parseWords(s)===row.params.number).length,1);lexicalChecks+=row.options.length+1;}
for(const row of get('word-subtract-story')){assert.equal(parseWords(row.statement.match(/^Фестивальге (.+) билет дайындалды/)[1]),row.params.total);lexicalChecks++;}
for(const row of get('word-carry-story')){assert.equal(parseWords(row.statement.match(/^Шеберханада (.+) бөлшек дайын еді/)[1]),row.params.initial);lexicalChecks++;}
let finiteChecks=0;
function firstInteger(lo,hi,predicate){for(let n=lo;n<=hi;n++)if(predicate(n))return n;assert.fail('Empty finite domain');}
function lastInteger(lo,hi,predicate){for(let n=hi;n>=lo;n--)if(predicate(n))return n;assert.fail('Empty finite domain');}
const unique=n=>new Set(String(n)).size===String(n).length;
for(const row of get('min-distinct')){const p=row.params;assert.equal(number(row.answer),firstInteger(10**(p.digits-1),10**p.digits-1,unique));finiteChecks++;}
for(const row of get('min-permutation')){const want=[...row.params.digits].sort().join('');assert.equal(number(row.answer),firstInteger(10000,99999,n=>String(n).split('').sort().join('')===want));finiteChecks++;}
for(const row of get('max-distinct-odd')){const p=row.params;assert.equal(number(row.answer),lastInteger(10**(p.digits-1),p.exclusiveUpper-1,n=>unique(n)&&n%2===1));finiteChecks++;}
for(const row of get('max-even-unique')){assert.equal(number(row.answer),lastInteger(10000,row.params.exclusiveUpper-1,n=>unique(n)&&String(n).split('').every(d=>Number(d)%2===0)));finiteChecks++;}
for(const row of get('min-digit-sum')){const p=row.params;assert.equal(number(row.answer),firstInteger(10**(p.digits-1),10**p.digits-1,n=>String(n).split('').reduce((s,d)=>s+Number(d),0)===p.digitSum));finiteChecks++;}
for(const row of get('repeated-class-riddle')){const p=row.params,valid=[];for(let n=100;n<=999;n++){const high=n*p.multiplier;if(high>999)continue;const text=String(high)+String(n);if(/^([0-9])\1\1([0-9])\2\2$/.test(text)&&text.split('').reduce((s,d)=>s+Number(d),0)===p.digitSum)valid.push(Number(text));}assert.deepEqual(valid,[number(row.answer)]);finiteChecks++;}
for(const row of get('equal-classes-difference')){const values=Array.from({length:900},(_,i)=>Number(String(i+100).repeat(row.params.classCount)));assert.equal(number(row.answer),Math.max(...values)-Math.min(...values));finiteChecks++;}
for(const row of get('binary-digit-count')){let count=0;const p=row.params;for(let n=10**(p.digits-1);n<10**p.digits;n++)if(String(n).split('').every(c=>c==='0'||c===String(p.nonzero)))count++;assert.equal(number(row.answer),count);finiteChecks++;}
for(const row of get('written-digit-count')){let total=0;for(let n=1;n<=row.params.end;n++)total+=String(n).length;assert.equal(number(row.answer),total);finiteChecks++;}
for(const row of get('total-place-units')){const p=row.params;let remainder=p.number,whole=0;while(remainder>=10**p.position){remainder-=10**p.position;whole++;}assert.equal(number(row.answer),whole);assert(remainder<10**p.position);finiteChecks++;}
for(const row of get('expanded-choice')){const valid=row.options.filter(o=>o.split(' + ').reduce((s,n)=>s+number(n),0)===row.params.number);assert.deepEqual(valid,[row.answer]);finiteChecks++;}
const negatives=[
 ['compose-classes',p=>p.units=1000],['class-carry',p=>p.increase++],['repeated-class-riddle',p=>p.digitSum=37],['min-permutation',p=>p.digits[0]=p.digits[1]],['word-compare',p=>p.right+=1000],['max-distinct-odd',p=>p.exclusiveUpper++],['expanded-sum',p=>p.addends[0]++],['binary-digit-count',p=>p.nonzero=0]
];
for(const [kind,mutate] of negatives){const row=structuredClone(get(kind)[0]);mutate(row.params);assert.throws(()=>renderEdition(row));}
console.log(JSON.stringify({editions:rows.length,sourceRefs:54,models:new Set(rows.map(r=>r.modelId)).size,nativeWordChecks:lexicalChecks,separateFiniteEnumerationChecks:finiteChecks,textInputAndOptionMutations:mutations,negativeConstraintChecks:negatives.length,passed:true,independentEditorialReview:false}));

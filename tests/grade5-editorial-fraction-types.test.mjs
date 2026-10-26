import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEditions,verifyEdition} from '../scripts/editorial/grade5-fraction-types-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
import {mathFragments} from '../frontend/src/mathPresentation.js';
const rows=buildEditions(),prefix='grade5-fraction-types-',kind=r=>r.modelId.slice(prefix.length),range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i);
const one=xs=>{assert.equal(xs.length,1);return xs[0];},get=k=>one(rows.filter(r=>kind(r)===k)),pick=(r,f)=>one(r.options.filter(f));
const q=text=>{const m=text.match(/^\((\d+)\/(\d+)\)(?: л| сағ)?$/);assert.ok(m,text);return m.slice(1).map(Number);},same=([a,b],[c,d])=>b>0&&d>0&&a*d===c*b;
const common=(a,b)=>range(1,Math.min(a,b)).filter(n=>a%n===0&&b%n===0),coprime=(a,b)=>common(a,b).length===1;
const fractionMCQ=(r,value)=>pick(r,o=>same(q(o),value)),list=ns=>ns.join(', ');
const proper=([n,d])=>n<d,improper=([n,d])=>n>=d;
function oracle(row){const p=row.params;switch(kind(row)){
 case'improper-integer-value':return one(range(1,p.numerator).filter(n=>n*p.denominator===p.numerator));
 case'integer-to-given-denominator':return pick(row,o=>{const[n,d]=q(o);return d===p.denominator&&n===p.whole*d;});
 case'least-improper-numerator':return range(1,p.denominator*2).find(n=>n>=p.denominator);
 case'true-relation-to-one':return pick(row,o=>{const m=o.match(/^(\(\d+\/\d+\)) ([<>=]) 1$/);assert.ok(m);const[n,d]=q(m[1]);return m[2]==='<'?n<d:m[2]==='>'?n>d:n===d;});
 case'proper-choice':case'proper-after-reduction-choice':return pick(row,o=>proper(q(o)));
 case'improper-equality-choice':return pick(row,o=>improper(q(o)));
 case'proper-equal-portion':case'improper-equal-liquid-share':return fractionMCQ(row,[p.litres,p.containers]);
 case'count-improper-list':case'reduce-then-count-improper':return p.fractions.filter(improper).length;
 case'count-proper-list':return p.fractions.filter(proper).length;
 case'equal-symbolic-terms':{
  for(let t=1;t<=1000;t++){assert.equal(t/t,1);assert.ok(improper([t,t]));}return pick(row,o=>o==='Әрдайым бұрыс бөлшек, мәні 1');
 }
 case'make-proper-from-two-numbers':return pick(row,o=>{const[n,d]=q(o);return n<d&&[n,d].every(x=>p.numbers.includes(x))&&n!==d;});
 case'greatest-proper-numerator':return Math.max(...range(1,p.denominator*2).filter(n=>n<p.denominator));
 case'greatest-improper-denominator':return Math.max(...range(1,p.numerator*2).filter(d=>p.numerator>=d));
 case'count-fixed-denominator-proper':return range(1,p.denominator).filter(n=>n<p.denominator).length;
 case'all-improper-denominators':{
  const valid=range(1,p.numerator*2).filter(d=>p.numerator>=d);return pick(row,o=>o===list(valid));
 }
 case'minutes-as-improper-hours':return fractionMCQ(row,[p.minutes,60]);
 case'improper-with-bounded-numerator':return range(1,p.upperInclusive).filter(n=>n>=p.denominator).length;
 case'proper-numerator-sum':return range(1,p.denominator).filter(n=>n<p.denominator).reduce((s,n)=>s+n,0);
 case'whole-to-unit-portions':return one(range(1,p.sheets*p.partsPerSheet).filter(n=>n===p.sheets*p.partsPerSheet));
 case'reciprocal-of-proper':{
  for(let n=1;n<=30;n++)for(let d=n+1;d<=31;d++){assert.ok(d/n>1);assert.ok(improper([d,n]));}return pick(row,o=>o==='Бұрыс бөлшек, мәні 1-ден үлкен');
 }
 case'strictly-over-one-bounded-numerator':return range(1,p.upperExclusive-1).filter(n=>n>p.denominator).length;
 case'integer-fraction-term-sum':return one(range(1,p.whole*p.denominator).filter(n=>n===p.whole*p.denominator).map(n=>n+p.denominator));
 case'two-natural-fraction-unknowns':{
  const candidates=[];for(let a=1;a<=p.whole*p.firstDenominator;a++)for(let b=1;b<=p.secondNumerator;b++)if(a===p.whole*p.firstDenominator&&p.secondNumerator===p.whole*b)candidates.push(a+b);return one(candidates);
 }
 case'count-distinct-term-improper':return p.numbers.flatMap(n=>p.numbers.filter(d=>n!==d&&n>=d).map(d=>[n,d])).length;
 case'piece-shorter-than-unit':return pick(row,o=>{const n=Number(o.split(' ')[0]);return p.metres<n;});
 case'shared-numerator-two-types':return pick(row,o=>o===list(range(1,p.properDenominator*2).filter(n=>n>=p.improperDenominator&&n<p.properDenominator)));
 case'improper-fixed-term-sum-count':{
  const pairs=[];for(let n=1;n<p.sum;n++)for(let d=1;d<p.sum;d++)if(n+d===p.sum&&n>=d)pairs.push([n,d]);return pairs.length;
 }
 case'proper-transitivity':{
  for(let x=1;x<=12;x++)for(let y=x+1;y<=13;y++)for(let z=y+1;z<=14;z++)assert.ok(proper([x,z]));return pick(row,o=>o==='Дұрыс бөлшек, мәні 1-ден кіші');
 }
 case'improper-numerator-increase':{
  for(let n=1;n<=30;n++)for(let m=n;m<=31;m++)assert.ok(m+p.added>n);
  const[m,n]=p.counterexample;assert.ok(m>=n&&(m+p.added)%n!==0);return pick(row,o=>o==='Әрдайым бұрыс бөлшек және 1-ден үлкен');
 }
 case'three-type-constraints-sum':return range(1,p.secondNumerator*2).filter(x=>x>=p.firstDenominator&&p.secondNumerator>=x&&p.properNumerator<x).reduce((s,n)=>s+n,0);
 case'linear-ratio-proper-domain':return pick(row,o=>o===list(range(1,100).filter(x=>p.numeratorCoefficient*x<p.denominatorCoefficient*x+p.denominatorAdd)));
 case'affine-numerator-proper-domain':return pick(row,o=>o===list(range(1,p.denominator*2).filter(n=>p.coefficient*n+p.added<p.denominator)));
 case'proper-full-square-domain':{
  let result=0;for(let n=1;n<=p.upperInclusive;n++)for(let d=1;d<=p.upperInclusive;d++)if(n<d)result++;return result;
 }
 case'affine-denominator-improper-domain':return pick(row,o=>o===list(range(1,p.numerator*2).filter(n=>p.numerator>=n+p.added)));
 case'fraction-between-integers':return range(1,p.denominator*p.upperExclusive).filter(n=>n>p.denominator*p.lowerExclusive&&n<p.denominator*p.upperExclusive).length;
 case'affine-numerator-proper-count':return range(1,p.denominator*2).filter(n=>n+p.added<p.denominator).length;
 case'anti-diagonal-improper-count':{
  const values=[];let n=1,d=p.count;while(d>0){values.push([n,d]);n++;d--;}return values.filter(improper).length;
 }
 case'possible-proper-denominator':return pick(row,o=>Number(o)>p.numerator);
 case'adjacent-proper-terms':return one(range(1,p.denominator*2).filter(n=>n<p.denominator&&Math.abs(n-p.denominator)===1));
 case'incomplete-definition-counterexample':return pick(row,o=>{const[n,d]=q(o);return n>=d&&!(n>d);});
 case'natural-improper-under-upper':return range(1,p.upperExclusive-1).filter(n=>n>=p.denominator&&n%p.denominator===0).length;
 case'universal-improper-expression':{
  const[u,v]=p.counterexample;assert.ok(u<v&&u+p.added<v&&p.otherCoefficient*u<v);assert.ok(v<u+v);
  for(let v=2;v<=40;v++)for(let u=1;u<v;u++)assert.ok(p.firstCoefficient*u+v>v);
  return pick(row,o=>o===`((${p.firstCoefficient}u + v)/v)`);
 }
 case'natural-denominator-divisor-count':return range(1,p.numerator).filter(d=>p.numerator%d===0).length;
 case'both-reciprocals-improper':{
  const pairs=[];for(let u=1;u<=50;u++)for(let v=1;v<=50;v++)if(u>=v&&v>=u)pairs.push([u,v]);assert.equal(pairs.length,50);assert.ok(pairs.every(([u,v])=>u===v));return pick(row,o=>o==='u = v');
 }
 case'irreducible-improper-under-upper':return range(1,p.upperExclusive-1).filter(n=>n>=p.denominator&&coprime(n,p.denominator)).length;
 case'gcd-lcm-nonnatural-improper':{
  const pairs=[];for(let n=1;n<=p.lcm;n++)for(let d=1;d<=p.lcm;d++){const g=Math.max(...common(n,d));if(g===p.gcd&&n*d/g===p.lcm&&n>=d&&n%d!==0)pairs.push([n,d]);}const[n,d]=one(pairs);return pick(row,o=>o===`a = ${n}, b = ${d}`);
 }
 case'bounded-integer-fraction-writings':{
  let count=0;for(let n=1;n<=p.upperInclusive;n++)for(let d=1;d<=p.upperInclusive;d++)if(n%d===0)count++;return count;
 }
 default:throw Error('Missing independent classification oracle '+kind(row));
}}
for(const row of rows)test('independent fraction classification/domain oracle '+row.editionId,()=>{
 assert.equal(row.answer,String(oracle(row)));assert.equal(verifyEdition(row).answer,row.answer);
 if(row.options){assert.equal(row.options.length,4);assert.equal(new Set(row.options).size,4);assert.equal(row.options.filter(o=>o===row.answer).length,1);}else{assert.match(row.answer,/^\d+$/);assert.ok(row.statement.endsWith('Жауапқа тек санды жазыңыз.'));}
});
test('all50 nonvisual saved3.3 sources covered once, no image or public/free access change',()=>{
 const src=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-3');assert.equal(rows.length,50);assert.equal(src.length,50);assert.deepEqual(new Set(rows.map(r=>r.sourceRefs[0].sourceId)),new Set(src.map(q=>q.sourceId)));
 const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
 for(const row of rows){const ref=row.sourceRefs[0],q=one(JSON.parse(fs.readFileSync(ref.sourceFile)).questions.filter(q=>q.id===ref.sourceId));assert.ok(q.checked);assert.notEqual(norm(q.statement),norm(row.statement));assert.equal(row.grade,5);assert.equal(row.topic,'frac');assert.equal(row.minimumPlan,'pro');assert.equal(row.editorialStatus,'awaiting_independent_review');assert.ok(!row.image&&!row.figure);}
});
test('exact statement/solution/MCQ/answer and all fixed numeric givens and metadata bound',()=>{
 for(const row of rows){for(const field of['statement','solution','answer']){const bad=structuredClone(row);bad[field]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));}for(const field of['grade','topic','difficulty','modelId','minimumPlan']){const bad=structuredClone(row);bad[field]='tamper';assert.throws(()=>verifyEdition(bad));}for(const[key,v]of Object.entries(row.params)){const bad=structuredClone(row);bad.params[key]=typeof v==='number'?v+1:Array.isArray(v)?[...v,37]:'tamper';assert.throws(()=>verifyEdition(bad));}if(row.options){const bad=structuredClone(row);bad.options[0]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));}const bad=structuredClone(row);bad.sourceRefs[0].sourceId='no-source';assert.throws(()=>verifyEdition(bad));}
 const bad=structuredClone(get('incomplete-definition-counterexample'));delete bad.intentionalIncorrectExample;assert.throws(()=>verifyEdition(bad));
});
test('all fractions render as native structured groups; no slash buried in text',()=>{
 let count=0;const walk=ns=>{for(const n of ns)if(n.type==='text'){assert.ok(!n.value.includes('/'),n.value);assert.ok(!/[\\$^]/.test(n.value));}else if(n.type==='fraction'){count++;walk(n.numerator);walk(n.denominator);}else assert.fail(n.type);};
 for(const row of rows)for(const s of[row.statement,row.solution,row.answer,...(row.options||[])])walk(mathFragments(s));assert.ok(count>250);
});
test('improper equality is included, but strict value greater-than-one excludes it',()=>{
 assert.equal(get('least-improper-numerator').answer,'11');assert.equal(get('greatest-improper-denominator').answer,'17');assert.equal(get('improper-equality-choice').answer,'(9/9)');
 assert.equal(get('strictly-over-one-bounded-numerator').answer,'20');assert.equal(range(1,26).filter(n=>n>=6).length,21);assert.equal(range(1,26).filter(n=>n>6).length,20);
 assert.equal(get('improper-fixed-term-sum-count').answer,'13');assert.equal(13+13,26);assert.ok(improper([13,13]));
 assert.equal(get('incomplete-definition-counterexample').answer,'(9/9)');assert.equal(get('incomplete-definition-counterexample').intentionalIncorrectExample,true);
 assert.equal(get('shared-numerator-two-types').answer,'14, 15, 16');assert.ok(improper([14,14]));assert.ok(!proper([17,17]));
 assert.equal(get('affine-denominator-improper-domain').answer,list(range(1,11)));assert.ok(improper([19,11+8]));
});
test('strict numeric and affine endpoints keep zero excluded and simultaneous constraints intact',()=>{
 assert.equal(get('linear-ratio-proper-domain').answer,'1, 2, 3, 4');assert.equal(3*5,2*5+5);assert.ok(!proper([15,15]));
 assert.equal(get('affine-numerator-proper-domain').answer,'1, 2, 3, 4');assert.equal(3*5+2,17);
 assert.equal(get('affine-numerator-proper-count').answer,'7');assert.equal(8+5,13);
 assert.equal(get('fraction-between-integers').answer,'26');assert.equal(35-10+1,26);assert.equal(9/9,1);assert.equal(36/9,4);
 assert.equal(get('three-type-constraints-sum').answer,'198');assert.equal(range(18,26).reduce((a,b)=>a+b),198);assert.ok(!proper([17,17]));assert.ok(improper([26,26]));
 assert.equal(get('natural-improper-under-upper').answer,'7');assert.equal(72%9,0);assert.equal(range(9,71).filter(n=>n%9===0).length,7);
});
test('equal numerical values remain distinct writings, full natural and proper pair domains counted',()=>{
 assert.equal(get('count-distinct-term-improper').answer,'10');assert.ok(same([4,2],[6,3]));
 assert.equal(get('proper-full-square-domain').answer,'66');assert.equal((12*12-12)/2,66);assert.ok(same([1,2],[2,4]));
 assert.equal(get('bounded-integer-fraction-writings').answer,'35');assert.equal(range(1,12).map(d=>Math.floor(12/d)).reduce((a,b)=>a+b),35);
 assert.equal(get('irreducible-improper-under-upper').answer,'8');assert.deepEqual(range(12,35).filter(n=>coprime(n,12)),[13,17,19,23,25,29,31,35]);
 assert.equal(get('gcd-lcm-nonnatural-improper').answer,'a = 40, b = 30');assert.equal(Math.max(...common(40,30)),10);assert.equal(40*30/10,120);assert.notEqual(40%30,0);assert.equal(120%10,0);
});
test('fixed-unit conversion and changed wholes retain requested unit and proper/improper direction',()=>{
 assert.equal(get('proper-equal-portion').answer,'(6/11) л');assert.ok(6<11);
 assert.equal(get('improper-equal-liquid-share').answer,'(11/3) л');assert.ok(same([22,6],[11,3]));assert.ok(22>6);
 assert.equal(get('minutes-as-improper-hours').answer,'(7/4) сағ');assert.ok(same([105,60],[7,4]));assert.ok(!same([105,100],[7,4]));
 assert.equal(get('piece-shorter-than-unit').answer,'30 бөлік');assert.equal(24/24,1);assert.ok(24/30<1);
 assert.equal(get('whole-to-unit-portions').answer,'36');assert.equal(4*9,36);assert.notEqual(4+9,36);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEditions,verifyEdition} from '../scripts/editorial/grade5-factorization-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
const rows=buildEditions(),prefix='grade5-factorization-',kind=r=>r.modelId.slice(prefix.length);
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i);
const only=xs=>{assert.equal(xs.length,1);return xs[0];};
const sum=xs=>xs.reduce((a,b)=>a+b,0),prod=xs=>xs.reduce((a,b)=>a*b,1);
// Independent sieve and complete prime-list division, not the authored trial divisor helper.
const sieve=Array(40001).fill(true);sieve[0]=sieve[1]=false;
for(let p=2;p<sieve.length;p++)if(sieve[p])for(let n=2*p;n<sieve.length;n+=p)sieve[n]=false;
const primes=range(2,40000).filter(n=>sieve[n]);
function pf(n){const out=[];for(const p of primes){while(n%p===0&&n>1){out.push(p);n/=p;}if(n===1)break;}assert.equal(n,1);return out;}
const supers='⁰¹²³⁴⁵⁶⁷⁸⁹';
const power=(b,e)=>Array(e).fill(BigInt(b)).reduce((a,b)=>a*b,1n);
function printedFactors(text){return text.split(' × ').map(t=>{const m=t.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]*)$/);assert.ok(m,t);return[Number(m[1]),m[2]?Number([...m[2]].map(c=>supers.indexOf(c)).join('')):1];});}
const value=text=>printedFactors(text).map(([b,e])=>power(b,e)).reduce((a,b)=>a*b,1n);
const allPrime=text=>printedFactors(text).every(([b,e])=>sieve[b]&&e>0);
const chosen=(row,predicate)=>only(row.options.filter(predicate));
function perfect(n,e){n=BigInt(n);for(let base=1n;power(base,e)<=n;base++)if(power(base,e)===n)return true;return false;}
function oracle(row){const p=row.params;switch(kind(row)){
 case'largest-prime-small':case'largest-prime-odd':return Math.max(...primes.filter(d=>p.number%d===0));
 case'factor-list-choice':case'power-factor-choice':return chosen(row,o=>allPrime(o)&&value(o)===BigInt(p.number));
 case'only-prime-factors-choice':return chosen(row,allPrime);
 case'least-prime-basic':case'least-prime-long-search':return primes.find(d=>p.number%d===0);
 case'cancel-listed-factors':{const a=BigInt(prod(p.numerator)),b=BigInt(prod(p.denominator));assert.equal(a%b,0n);return a/b;}
 case'reconstruct-listed-primes':return p.factors.map(BigInt).reduce((a,b)=>a*b,1n);
 case'factor-order-uniqueness':{
  const eq=[...row.statement.matchAll(/(\d+) = ([\d ×]+)/g)].map(m=>({n:BigInt(m[1]),fs:printedFactors(m[2].trim())}));assert.equal(eq.length,2);
  for(const e of eq){assert.equal(e.fs.map(([b,e])=>power(b,e)).reduce((a,b)=>a*b,1n),e.n);assert.ok(e.fs.every(([b])=>sieve[b]));}
  assert.deepEqual(eq[0].fs.flatMap(([b,e])=>Array(e).fill(b)).sort((a,b)=>a-b),eq[1].fs.flatMap(([b,e])=>Array(e).fill(b)).sort((a,b)=>a-b));
  return chosen(row,o=>o.startsWith('Екеуі де дұрыс:'));
 }
 case'reconstruct-powered-primes':return value(row.statement.match(/жіктеуі (.+) түрінде/)[1]);
 case'prime-square-side':return only(range(1,p.area).filter(n=>n*n===p.area&&sieve[n]));
 case'smallest-odd-prime-product':return prod(primes.filter(n=>n%2).slice(0,p.count));
 case'prime-box-dimensions':return chosen(row,o=>{const xs=o.split('; ').map(t=>Number(t.match(/^(\d+) дм$/)[1]));return xs.every(n=>sieve[n])&&prod(xs)===p.volume;});
 case'count-distinct-primes':return primes.filter(d=>p.number%d===0).length;
 case'sum-distinct-primes':return sum(primes.filter(d=>p.number%d===0));
 case'restricted-prime-support':return chosen(row,o=>{const ps=[...new Set(pf(Number(o)))];return ps.length===p.allowed.length&&p.allowed.every(n=>ps.includes(n));});
 case'compare-prime-products':return chosen(row,o=>{const m=o.match(/^(.+) ([=<>]) (.+)$/);if(!m)return false;const a=value(m[1]),b=value(m[3]);return m[2]==='<'?a<b:m[2]==='>'?a>b:a===b;});
 case'ordered-prime-array':{
  const candidates=[];for(let a=2;a<p.total;a++)for(let b=a+1;b<p.total;b++)if(sieve[a]&&sieve[b]&&a*b===p.total)candidates.push(b);return only(candidates);
 }
 case'cancel-powered-factors':{
  const a=p.numerator.map(([b,e])=>power(b,e)).reduce((a,b)=>a*b,1n),b=p.denominator.map(([b,e])=>power(b,e)).reduce((a,b)=>a*b,1n);assert.equal(a%b,0n);return a/b;
 }
 case'specified-prime-multiplicity':{let n=p.number,count=0;while(n%p.prime===0){n/=p.prime;count++;}return count;}
 case'nondivisor-prime-budget':case'divisor-prime-budget':{
  const n=p.factors.map(([b,e])=>power(b,e)).reduce((a,b)=>a*b,1n),want=kind(row)==='divisor-prime-budget';return chosen(row,o=>(n%BigInt(o)===0n)===want);
 }
 case'prime-speed-time':return chosen(row,o=>{const m=o.match(/^(\d+) км\/сағ; (\d+) сағ$/),v=Number(m[1]),t=Number(m[2]);return sieve[v]&&sieve[t]&&v>t&&v*t===p.distance;});
 case'not-semiprime':return chosen(row,o=>{const n=Number(o);return !primes.some(a=>n%a===0&&sieve[n/a]);});
 case'trailing-zero-pairs':{let n=power(2,p.twos)*power(3,p.threes)*power(5,p.fives),count=0;while(n%10n===0n){n/=10n;count++;}return count;}
 case'least-cube-multiplier':return range(1,p.number*p.number).find(k=>perfect(BigInt(k*p.number),3));
 case'smallest-odd-prime-length':{
  const n=range(1,3**p.count).find(n=>n%2&&pf(n).length===p.count);return chosen(row,o=>Number(o)===n);
 }
 case'distinct-age-product':{
  const ages=[];for(let a=2;a*a*a<p.product;a++)for(let b=a+1;a*b*b<p.product;b++){if(p.product%(a*b))continue;const c=p.product/(a*b);if(c>b)ages.push([a,b,c]);}return sum(only(ages));
 }
 case'square-factor-parity':return chosen(row,o=>perfect(value(o),2));
 case'consecutive-product-triple':return chosen(row,o=>{const xs=o.split('; ').map(Number);return prod(xs)===p.product&&xs[1]===xs[0]+1&&xs[2]===xs[1]+1;});
 case'prime-cube-grid-dimensions':return chosen(row,o=>{const dims=o.split('; ').map(t=>Number(t.match(/^(\d+) см$/)[1])),counts=dims.map(n=>n/p.edge);return counts.every(n=>Number.isInteger(n)&&sieve[n])&&prod(counts)===p.count;});
 case'factorial-prime-multiplicity':{
  let total=range(1,p.last).map(BigInt).reduce((a,b)=>a*b,1n),count=0;while(total%BigInt(p.prime)===0n){total/=BigInt(p.prime);count++;}return chosen(row,o=>Number(o)===count);
 }
 case'count-all-divisors':{
  const n=Number(p.factors.map(([b,e])=>power(b,e)).reduce((a,b)=>a*b,1n));return range(1,n).filter(d=>n%d===0).length;
 }
 case'largest-single-prime-power':{
  const candidates=range(10**(p.digits-1),10**p.digits-1).filter(n=>pf(n).every(f=>f===p.prime));return Math.max(...candidates);
 }
 case'factor-guarantee':{
  assert.ok(!sieve[3*p.prime]);assert.ok(2*p.prime%2===0);assert.notEqual((3*p.prime)%(2*p.prime),0);
  // Formal n=p*m establishes divisibility for every natural m, while each false claim has a concrete counterexample.
  return chosen(row,o=>o===`${p.prime} санына бөлінеді`);
 }
 case'exact-prime-count-choice':return chosen(row,o=>pf(Number(o)).filter(n=>n===p.prime).length===p.count);
 case'count-largest-prime-two-digits':return range(10,99).filter(n=>Math.max(...pf(n))===p.prime).length;
 case'greatest-odd-divisor':return Math.max(...range(1,p.number).filter(d=>d%2&&p.number%d===0));
 case'prime-product-sum-multiple':return chosen(row,o=>{const xs=o.split('; ').map(Number);return xs.every(n=>sieve[n])&&prod(xs)===p.multiplier*sum(xs);});
 case'zero-free-factor-pair':{
  const n=Number('1'+'0'.repeat(p.exponent)),pairs=range(1,Math.floor(Math.sqrt(n))).filter(a=>n%a===0&&!String(a).includes('0')&&!String(n/a).includes('0')).map(a=>[a,n/a]);return sum(only(pairs));
 }
 default:throw Error('Missing independent oracle '+kind(row));
}}
for(const row of rows)test('independent native factorization oracle '+row.editionId,()=>{
 assert.equal(row.answer,String(oracle(row)));assert.equal(verifyEdition(row).answer,row.answer);
 assert.ok(!/[\\$]/.test(row.statement+row.solution));
 if(row.options){assert.equal(row.options.length,4);assert.equal(new Set(row.options).size,4);assert.equal(row.options.filter(o=>o===row.answer).length,1);}else{assert.match(row.answer,/^\d+$/);assert.ok(row.statement.endsWith('Жауапқа тек санды жазыңыз.'));}
});
test('all 47 saved nonvisual topic2.7 sources covered exactly once',()=>{
 const src=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-7');assert.equal(src.length,47);assert.equal(rows.length,47);assert.deepEqual(new Set(rows.map(r=>r.sourceRefs[0].sourceId)),new Set(src.map(q=>q.sourceId)));
 for(const row of rows){const ref=row.sourceRefs[0],raw=JSON.parse(fs.readFileSync(ref.sourceFile)),q=only(raw.questions.filter(q=>q.id===ref.sourceId));assert.ok(q.checked);assert.notEqual(q.statement,row.statement);assert.ok(!row.figure&&!row.image);assert.equal(row.grade,5);assert.equal(row.minimumPlan,'pro');}
});
test('all printed fields, wrong keys, parameters and metadata are bound',()=>{
 for(const row of rows){for(const field of['statement','solution','answer']){const bad=structuredClone(row);bad[field]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));}
  const bad=structuredClone(row);bad.params.unboundPrime=31;assert.throws(()=>verifyEdition(bad));
  for(const field of['grade','topic','difficulty','minimumPlan']){const changed=structuredClone(row);changed[field]=field==='grade'?6:'changed';assert.throws(()=>verifyEdition(changed));}
  if(row.options){const option=structuredClone(row);option.options[0]+=' өзгеріс';assert.throws(()=>verifyEdition(option));}
 }
});
test('incomplete equal-valued products cannot masquerade as prime decompositions',()=>{
 for(const row of rows.filter(r=>['factor-list-choice','power-factor-choice'].includes(kind(r)))){
  const equalValue=row.options.filter(o=>value(o)===BigInt(row.params.number));assert.ok(equalValue.length>=1);
  assert.equal(equalValue.filter(allPrime).length,1);
  for(const composite of equalValue.filter(o=>!allPrime(o))){const bad=structuredClone(row);bad.answer=composite;assert.throws(()=>verifyEdition(bad));}
 }
 const hasOne=rows.filter(r=>kind(r)==='factor-list-choice').find(r=>r.options.some(o=>o.startsWith('1 × ')));assert.ok(hasOne);assert.ok(!allPrime(hasOne.options.find(o=>o.startsWith('1 × '))));
});
test('repeated-factor counts differ from support, divisibility and even-term counts',()=>{
 const get=k=>only(rows.filter(r=>kind(r)===k));
 assert.equal(get('specified-prime-multiplicity').answer,'6');assert.equal(get('sum-distinct-primes').answer,'12');assert.equal(get('count-distinct-primes').answer,'6');
 const exact=get('exact-prime-count-choice');assert.equal(exact.answer,'350');assert.ok(exact.options.filter(o=>Number(o)%25===0).length>1);
 assert.equal(get('factorial-prime-multiplicity').answer,'10');assert.notEqual(get('factorial-prime-multiplicity').answer,'6');
 assert.equal(get('count-all-divisors').answer,'18');assert.equal(get('greatest-odd-divisor').answer,'231');
});
test('whole-domain minima and all factor-pair/age possibilities, not just offered choices',()=>{
 const get=k=>only(rows.filter(r=>kind(r)===k));
 assert.equal(get('least-cube-multiplier').answer,'75');for(let k=1;k<75;k++)assert.ok(!perfect(45*k,3));assert.equal(power(15,3),3375n);
 assert.equal(get('smallest-odd-prime-length').answer,'243');for(let n=1;n<243;n+=2)assert.ok(pf(n).length!==5);
 assert.equal(get('distinct-age-product').answer,'31');assert.equal(3*11*17,561);
 assert.equal(get('zero-free-factor-pair').answer,'641');assert.equal(16*625,10000);
 assert.equal(get('largest-single-prime-power').answer,'729');assert.equal(get('count-largest-prime-two-digits').answer,'12');
});
test('ordered dimensions, same-product nonconsecutive triple and exact zero pairing retain source constraints',()=>{
 const get=k=>only(rows.filter(r=>kind(r)===k));
 assert.equal(get('prime-speed-time').answer,'19 км/сағ; 5 сағ');assert.equal(get('ordered-prime-array').answer,'17');
 const triple=get('consecutive-product-triple');assert.equal(triple.answer,'17; 18; 19');assert.equal(9*17*38,5814);assert.notEqual(17,9+1);
 assert.equal(get('prime-cube-grid-dimensions').answer,'15 см; 21 см; 33 см');assert.equal(15*21*33,385*27);
 assert.equal(get('trailing-zero-pairs').answer,'4');assert.equal(power(2,7)*power(3,3)*power(5,4),2160000n);
 assert.equal(get('compare-prime-products').answer,'2⁵ × 3 < 2 × 3⁴');
 for(const[k,phrase]of[['prime-speed-time','сандық мәні'],['distinct-age-product','1-ден үлкен'],['zero-free-factor-pair','0 цифры мүлде жоқ'],['count-all-divisors','1 мен 180 санының өзін де'],['smallest-odd-prime-length','қайталанатындарын жеке санағанда']]){
  const row=get(k);assert.ok(row.statement.includes(phrase),k);const bad=structuredClone(row);bad.statement=bad.statement.replace(phrase,'');assert.throws(()=>verifyEdition(bad));
 }
});

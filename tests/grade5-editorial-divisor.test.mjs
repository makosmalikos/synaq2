import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {verifyEdition} from '../scripts/editorial/grade5-divisor-models.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade5-divisor.json',import.meta.url),'utf8'));
// Independent sqrt factor-pair/factorisation oracles, not the producer's 1..n divisor loop.
function ds(n){const set=new Set();for(let d=1;d*d<=n;d++)if(n%d===0){set.add(d);set.add(n/d);}return[...set].sort((a,b)=>a-b);}
function powers(n){const p=[];for(let d=2;d*d<=n;d++)if(n%d===0){let e=0;while(n%d===0){e++;n/=d;}p.push([d,e]);}if(n>1)p.push([n,1]);return p;}
const tau=n=>powers(n).reduce((v,[p,e])=>v*(e+1),1),sigma=n=>powers(n).reduce((v,[p,e])=>v*(p**(e+1)-1)/(p-1),1),show=xs=>xs.join(', ');
function oracle(r){const p=r.params,k=r.modelId.replace('grade5-divisor-','');switch(k){
 case'factor-partner':{for(const d of ds(p.number))if(d*p.factor===p.number)return String(d);throw Error('No partner');}
 case'nth-multiple':{let x=0;for(let i=0;i<p.index;i++)x+=p.base;return String(x);}
 case'sum-divisors':return String(sigma(p.number));
 case'count-multiples-below':return String(Math.floor((p.limit-1)/p.base));
 case'count-divisors':return String(tau(p.number));
 case'package-multiple-choice':case'choose-multiple':{const good=p.candidates.filter(n=>Number.isInteger(n/p.base));assert.equal(good.length,1);return String(good[0]);}
 case'all-multiples':{const full=r.options.filter(text=>text.includes('…')).filter(text=>{const values=(text.match(/\d+/g)||[]).map(Number);return values[0]===p.base&&values.every((v,i)=>v/p.base===i+1);});assert.equal(full.length,1);return full[0];}
 case'number-from-divisors':{const list=ds(p.number);assert.deepEqual(ds(list.at(-1)),list);return String(list.at(-1));}
 case'divisor-pair-choice':{const good=p.pairs.filter(([a,b])=>Number.isInteger(b/a)||Number.isInteger(a/b));assert.equal(good.length,1);return good[0].join(' және ');}
 case'all-divisors-choice':return show(ds(p.number));
 case'quotient-truth':assert.equal(p.number%p.divisor,0);return`${p.divisor} саны ${p.number} санының бөлгіші`;
 case'extreme-divisor-sum':{const a=ds(p.number);return String(a[0]+a.at(-1));}
 case'choose-divisor':{const good=p.candidates.filter(n=>ds(p.number).includes(n));assert.equal(good.length,1);return String(good[0]);}
 case'exact-divisor-count-choice':{const good=p.candidates.filter(n=>tau(n)===p.count);assert.equal(good.length,1);return String(good[0]);}
 case'next-joint-clock':{let elapsed=1;while(!p.periods.every(t=>elapsed%t===0))elapsed++;const now=p.startMinute+elapsed;return`${String(Math.floor(now/60)%24).padStart(2,'0')}:${String(now%60).padStart(2,'0')}`;}
 case'nontrivial-bundle-count':return String(tau(p.number)-2);
 case'missing-largest-divisor':{const proper=ds(p.number).slice(0,-1);return String(proper[1]*proper.at(-1));}
 case'equal-share-minimum':case'lcm':{const primePowers=new Map();for(const n of p.numbers)for(const[prime,e]of powers(n))primePowers.set(prime,Math.max(e,primePowers.get(prime)||0));return String([...primePowers].reduce((v,[p,e])=>v*p**e,1));}
 case'unordered-factor-pair-count':return String(Math.ceil(tau(p.number)/2));
 case'divisors-and-multiples':{const xs=[];for(let m=1;p.base*m<=p.number;m++)if(p.number%(p.base*m)===0)xs.push(p.base*m);return show(xs);}
 case'group-size-count':return String(ds(p.total).filter(n=>p.lower<n&&n<p.upper).length);
 case'range-multiple-count':return String(Math.floor(p.upper/p.base)-Math.floor((p.lower-1)/p.base));
 case'select-divisors':return show(p.candidates.filter(n=>ds(p.number).includes(n)));
 case'two-digit-multiple-sum':{const lo=Math.ceil(10/p.base),hi=Math.floor(99/p.base);return String(p.base*(lo+hi)*(hi-lo+1)/2);}
 case'multiple-exclusion-count':{let count=0;for(let n=Math.ceil(p.lower/p.base)*p.base;n<=p.upper;n+=p.base)if(!Number.isInteger(n/p.exclude))count++;return String(count);}
 case'unique-remainders':{const xs=[];for(let k=1;k*p.multiple<p.upper;k++){const n=k*p.multiple;if(p.divisors.every(d=>Math.floor(n/d)*d+p.remainder===n))xs.push(n);}assert.equal(xs.length,1);return String(xs[0]);}
 case'packing-remainder-min':assert.ok(p.sizes.every(n=>p.remainder<n));for(let n=p.remainder+1;n<10000;n++)if(p.sizes.every(d=>(n-p.remainder)%d===0))return String(n);throw Error('No packing');
 case'odd-divisor-count-choice':{const square=p.candidates.filter(n=>Number.isInteger(Math.sqrt(n)));assert.equal(square.length,1);assert.ok(tau(square[0])%2);return String(square[0]);}
 case'minimum-divisor-count':for(let n=1;n<1000;n++)if(tau(n)===p.count)return String(n);throw Error('No divisor count');
 case'factor-equation':{const xs=[];for(const d of ds(p.product)){const other=p.product/d;if(other-d===p.shift)xs.push(d);}assert.equal(xs.length,1);return String(xs[0]);}
 case'primes-in-interval':return show(Array.from({length:p.upper-p.lower-1},(_,i)=>p.lower+1+i).filter(n=>powers(n).length===1&&powers(n)[0][1]===1));
 case'least-prime-largest-proper':{const candidates=[];for(let n=p.proper+1;n<=p.proper*p.least;n++){const list=ds(n);if(list[1]===p.least&&list.at(-2)===p.proper)candidates.push(n);}assert.equal(candidates.length,1);return String(candidates[0]);}
 case'divisor-and-multiple-self':{const xs=ds(p.number).filter(n=>n%p.number===0);assert.equal(xs.length,1);return String(xs[0]);}
 case'multiple-index':{let n=0,v=0;while(v<p.target){v+=p.base;n++;}assert.equal(v,p.target);return String(n);}
 case'most-divisors':{let best=[];for(const n of p.candidates){if(!best.length||tau(n)>tau(best[0]))best=[n];else if(tau(n)===tau(best[0]))best.push(n);}assert.equal(best.length,1);return String(best[0]);}
 case'one-digit-divisor-exclusion':{const xs=ds(p.number).filter(d=>d<10&&!ds(p.other).includes(d));assert.equal(xs.length,1);return String(xs[0]);}
 case'product-of-divisors-inverse':{const xs=[];for(let n=1;n<=p.product;n++){let product=1;for(const d of ds(n))product*=d;if(product===p.product)xs.push(n);}assert.equal(xs.length,1);return String(xs[0]);}
 case'union-divisor-count':{const common=ds(p.numbers[0]).filter(n=>p.numbers[1]%n===0).length;return String(tau(p.numbers[0])+tau(p.numbers[1])-common);}
 case'largest-two-digit-divisor':for(let n=99;n>=10;n--)if(p.number%n===0)return String(n);throw Error('No two-digit divisor');
 case'factor-pairs-divides':{let n=0;for(let a=1;a*a<=p.number;a++)if(p.number%(a*a)===0)n++;return String(n);}
 case'top-two-divisor-sum':assert.ok(p.sum%2);{const n=2*p.sum/3;assert.ok(Number.isInteger(n));const list=ds(n);assert.equal(list.at(-1)+list.at(-2),p.sum);return String(n);}
 default:throw Error('No independent divisor oracle '+k);
 }}
test('47 divisor sources each have original-source references and pending independent review only',()=>{assert.equal(data.editions.length,47);assert.equal(new Set(data.editions.map(r=>r.sourceRefs[0].sourceId)).size,47);for(const r of data.editions){assert.equal(r.grade,5);assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'awaiting_independent_review');const ref=r.sourceRefs[0],q=JSON.parse(fs.readFileSync(new URL('../'+ref.sourceFile,import.meta.url),'utf8')).questions.find(q=>q.id===ref.sourceId);assert.ok(q.checked);assert.equal(q.images.length,0);assert.notEqual(q.statement,r.statement);assert.doesNotMatch(r.statement+r.solution,/[\\$]/);if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(v=>v===r.answer).length,1);}}});
for(const row of data.editions)test(row.editionId+' agrees with a separate factorisation/pair/count oracle',()=>{assert.equal(row.answer,oracle(row));assert.equal(verifyEdition(row).answer,row.answer);for(const key of['statement','solution'])assert.throws(()=>verifyEdition({...row,[key]:row[key]+' 31'}));assert.throws(()=>verifyEdition({...row,answer:'wrong'}));assert.throws(()=>verifyEdition({...row,params:{...row.params,unreviewedExtra:11}}));});

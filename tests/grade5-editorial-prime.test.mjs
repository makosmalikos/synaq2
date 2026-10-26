import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verifyEdition} from '../scripts/editorial/grade5-prime-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade5-prime.json',import.meta.url),'utf8'));
// Independent oracle uses a sieve, prime-exponent divisor counts and marking state.
// It does not import the producer's trial division, render answers or model helpers.
const MAX=10000, flags=Array(MAX+1).fill(true);flags[0]=flags[1]=false;
for(let d=2;d*d<=MAX;d++)if(flags[d])for(let n=d*d;n<=MAX;n+=d)flags[n]=false;
const P=[];for(let n=2;n<=MAX;n++)if(flags[n])P.push(n);
const ps=(a,b)=>P.filter(n=>n>=a&&n<=b),show=xs=>xs.join(', ');
function pf(n){const out=[];for(const q of P){if(q>n)break;while(n%q===0){out.push(q);n/=q;}}assert.equal(n,1);return out;}
function tau(n){const counts=new Map();for(const p of pf(n))counts.set(p,(counts.get(p)||0)+1);return[...counts.values()].reduce((n,e)=>n*(e+1),1);}
function divisorList(n){const out=new Set([1]);for(const p of pf(n))for(const old of [...out])out.add(old*p);return[...out].sort((a,b)=>a-b);}
function marked(limit,small){const out=new Set();for(const q of small)for(let n=2*q;n<=limit;n+=q)out.add(n);return out;}
function newMarks(p){const old=marked(p.limit,p.previous),out=[];for(let n=2*p.next;n<=p.limit;n+=p.next)if(!old.has(n))out.push(n);return out;}
function primeDecompositions(n){const out=[];for(let a=2;a<=Math.floor(n/2);a++)if(flags[a]&&flags[n-a])out.push([a,n-a]);return out;}
function oracle(r){const p=r.params,k=r.modelId.replace('grade5-prime-','');switch(k){
 case'twin-choice':{const xs=p.pairs.filter(([a,b])=>P.includes(a)&&P.includes(b)&&Math.abs(a-b)===2);assert.equal(xs.length,1);return xs[0].join(' және ');}
 case'unique-prime-between':{const xs=ps(p.lower+1,p.upper-1);assert.equal(xs.length,1);return String(xs[0]);}
 case'one-classification':assert.equal(tau(p.number),1);return'жай сан да, құрама сан да емес';
 case'composite-count':{const all=p.upper-p.lower+1;const unit=p.lower<=1&&p.upper>=1?1:0;return String(all-ps(p.lower,p.upper).length-unit);}
 case'choose-prime':{const good=p.candidates.filter(n=>tau(n)===2);assert.equal(good.length,1);return String(good[0]);}
 case'largest-prime-bounded':{let n=p.upper;while(!flags[n])n--;assert.ok(n>=10);return String(n);}
 case'prime-count-list':return String(p.candidates.filter(n=>tau(n)===2).length);
 case'composite-reason':{assert.ok(tau(p.number)>2);const xs=divisorList(p.number);assert.equal(xs.length,tau(p.number));assert.equal(p.factors[0]*p.factors[1],p.number);return`оң бөлгіштері ${show(xs)} — екіден көп`;}
 case'smallest-prime-after':{let n=p.lower+1;while(!flags[n])n++;assert.ok(n<100);return String(n);}
 case'prime-count-interval':return String(ps(p.lower,p.upper).length);
 case'only-even-prime':assert.equal(ps(1,p.upper).filter(n=>n%2===0).length,1);return'жұп жай сан тек 2 болады';
 case'minimum-composite':{let n=1;while(n===1||flags[n])n++;return String(n);}
 case'select-primes':return show(p.candidates.filter(n=>tau(n)===2));
 case'choose-composite':{const xs=p.candidates.filter(n=>tau(n)>2);assert.equal(xs.length,1);return String(xs[0]);}
 case'minimum-prime':return String(P[0]);
 case'hidden-composite':assert.equal(p.factors[0]*p.factors[1],p.number);assert.ok(!flags[p.number]);assert.ok([2,3,5,p.falseDivisor].every(q=>p.number%q!==0));return`құрама, себебі ${p.number} = ${p.factors[0]} × ${p.factors[1]}`;
 case'prime-product-below':{let value=1;for(const n of ps(2,p.limit-1))value*=n;assert.equal(pf(value).length,ps(2,p.limit-1).length);return String(value);}
 case'prime-sum-choice':{const good=p.pairs.filter(([a,b])=>a+b===p.sum&&tau(a)===2&&tau(b)===2);assert.equal(good.length,1);return good[0].join(' + ');}
 case'larger-prime-factor':{const fs=pf(p.number);assert.equal(fs.length,2);return String(fs[1]);}
 case'exact-four-divisors-choice':{const xs=p.candidates.filter(n=>tau(n)===4);assert.equal(xs.length,1);return String(xs[0]);}
 case'odd-prime-sum-pair':assert.ok(p.sum%2&&flags[p.sum-2]);return`2 және ${p.sum-2}`;
 case'sieve-first-new':assert.ok(p.previous.every(n=>flags[n]));assert.equal(p.previous.at(-1),P[P.indexOf(p.next)-1]);return String(newMarks(p)[0]);
 case'noncomposite-remainder':return String(ps(2,p.limit).length+1);
 case'twin-pair-count':{const xs=ps(2,p.limit-1);let count=0;for(let i=0;i<xs.length;i++)for(let j=i+1;j<xs.length;j++)if(xs[j]-xs[i]===2)count++;return String(count);}
 case'sieve-stop':{const need=new Set();for(let n=2;n<=p.limit;n++)if(!flags[n])need.add(n);const got=new Set();for(const q of ps(2,p.limit)){for(let n=2*q;n<=p.limit;n+=q)got.add(n);if([...need].every(n=>got.has(n)))return String(q);}throw Error('Sieve did not finish');}
 case'prime-expression':{const values=r.options.map(text=>{const m=text.match(/^(\d+) (×|:) (\d+)(?: ([+−]) (\d+))?$/);assert.ok(m);let n=m[2]==='×'?Number(m[1])*Number(m[3]):Number(m[1])/Number(m[3]);if(m[4])n+=m[4]==='+'?Number(m[5]):-Number(m[5]);assert.ok(Number.isInteger(n));return n;});assert.ok(p.expressions.some(x=>x[3]==='subtract')&&p.expressions.some(x=>x[3]==='divide'));const good=values.map((n,i)=>tau(n)===2?i:-1).filter(i=>i>=0);assert.equal(good.length,1);return r.options[good[0]];}
 case'prime-count-strict':return String(ps(p.lower+1,p.upper-1).length);
 case'prime-sum-interval':return String(ps(p.lower+1,p.upper-1).reduce((a,b)=>a+b,0));
 case'least-prime-above':return String(P.find(n=>n>p.lower));
 case'sieve-new-count':return String(newMarks(p).length);
 case'digit-sum-primes':{const xs=P.filter(n=>String(n).length<=p.maxDigits&&String(n).split('').map(Number).reduce((a,b)=>a+b)===p.sum);return show(xs);}
 case'odd-prime-sum-product':assert.ok(p.sum%2&&flags[p.sum-2]);return String(2*(p.sum-2));
 case'prime-times-natural':assert.ok(flags[p.prime]);assert.equal(tau(p.prime),2);for(let x=2;x<=50;x++)assert.ok(tau(x*p.prime)>2);return'1';
 case'three-primes-residues':{
  const offsets=[0,...p.offsets];assert.ok(p.offsets.every(x=>x>3));
  for(const remainder of[0,1,2])assert.equal(offsets.filter(x=>(remainder+x)%3===0).length,1);
  assert.ok([3,...p.offsets.map(x=>3+x)].every(n=>flags[n]));return'3';
 }
 case'maximum-of-three-primes':{for(let z=p.sum-1;z>=2;z--)if(flags[z])for(let x=2;x<z;x++){const y=p.sum-z-x;if(x<y&&y<z&&flags[x]&&flags[y])return String(z);}throw Error('No prime triple');}
 case'sufficient-composite-factor':assert.equal(p.factors[0]*p.factors[1],p.number);assert.ok(p.factors.every(x=>x>1&&x<p.number));assert.ok(p.wrongPairs.every(([x,y])=>x*y!==p.number));return`${p.number} = ${p.factors[0]} × ${p.factors[1]}, сондықтан құрама`;
 case'prime-digit-permutations':{let count=0;for(const n of ps(10,99)){const a=Math.floor(n/10),b=n%10;if(a!==b&&p.digits.includes(a)&&p.digits.includes(b))count++;}return String(count);}
 case'distinct-prime-product-divisors':{
  assert.ok(p.examplePrimes.every(n=>flags[n]));assert.equal(new Set(p.examplePrimes).size,2);
  // Each of two distinct prime exponents can independently be0or1:2×2 choices.
  for(const a of ps(2,31))for(const b of ps(2,31))if(a!==b)assert.equal(tau(a*b),4);return'4';
 }
 case'three-divisors-count':{const xs=ps(2,Math.ceil(Math.sqrt(10**p.digits))).map(n=>n*n).filter(n=>String(n).length===p.digits);for(const n of xs)assert.equal(tau(n),3);return String(xs.length);}
 case'odd-offset-prime':assert.ok(p.shift%2===1&&flags[p.shift+2]);for(const q of ps(3,500))assert.ok((q+p.shift)%2===0&&q+p.shift>2);return'2';
 case'composite-proof-choice':assert.equal(p.factors[0]*p.factors[1],p.number);assert.ok(p.factors.every(n=>1<n&&n<p.number));assert.notEqual(p.number%p.divisor,0);return`${p.number} = ${p.factors[0]} × ${p.factors[1]}`;
 case'nth-prime':return String(P[p.index-1]);
 case'classify-divisor-list':assert.ok(tau(p.number)>2);assert.equal(p.prime*p.prime,p.number);return'құрама сан';
 case'distinct-semiprime-count':{const unique=new Set();for(const a of ps(2,p.limit-1))for(const b of ps(a+1,p.limit-1))if(a*b<p.limit)unique.add(a*b);return String(unique.size);}
 case'impossible-prime-sum':{const bad=p.candidates.filter(n=>primeDecompositions(n).length===0);assert.equal(bad.length,1);return String(bad[0]);}
 case'reversed-prime-count':{let count=0;for(const n of ps(p.lower,p.upper)){const reverse=10*(n%10)+Math.floor(n/10);if(flags[reverse])count++;}return String(count);}
 case'prime-factor-sum':{const triples=[];for(const a of ps(2,p.product))for(const b of ps(a,p.product)){if(p.product%(a*b))continue;const c=p.product/a/b;if(c>=b&&flags[c])triples.push([a,b,c]);}assert.equal(triples.length,1);return String(triples[0].reduce((a,b)=>a+b));}
 case'five-prime-even-total':assert.ok(p.total%2===0);assert.ok(p.example.every(n=>flags[n]));assert.equal(new Set(p.example).size,5);assert.equal(p.example.reduce((a,b)=>a+b),p.total);assert.ok(p.example.includes(2));return'бұл сандардың біреуі міндетті түрде 2';
 case'twin-sum-larger':{const pairs=ps(2,p.sum).filter(a=>flags[p.sum-a]&&p.sum-2*a===2);assert.equal(pairs.length,1);return String(p.sum-pairs[0]);}
 case'square-composite-rule':for(let n=2;n<=80;n++){assert.ok(1<n&&n<n*n);assert.ok(tau(n*n)>=3);}return'әрқашан құрама сан';
 default:throw Error('No independent prime oracle '+k);
}}
test('all52 captured nonvisual prime sources map once to pending Standard drafts',()=>{
 const captured=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-2');assert.equal(data.editions.length,52);
 assert.deepEqual(data.editions.map(r=>r.sourceRefs[0].sourceId).sort(),captured.map(q=>q.sourceId).sort());
 for(const r of data.editions){assert.equal(r.grade,5);assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'awaiting_independent_review');const src=captured.find(q=>q.sourceId===r.sourceRefs[0].sourceId);assert.equal(src.sourceFile,r.sourceRefs[0].sourceFile);assert.ok(src.checked);assert.notEqual(r.statement,src.raw.statement);assert.doesNotMatch(r.statement+r.solution,/[\\$]/);if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(v=>v===r.answer).length,1);}else assert.match(r.answer,/^\d+$/);}
});
for(const row of data.editions)test(row.editionId+' matches a separate sieve/factorisation/marking oracle and text binding',()=>{
 assert.equal(row.answer,oracle(row));assert.equal(verifyEdition(row).answer,row.answer);
 for(const key of['statement','solution'])assert.throws(()=>verifyEdition({...row,[key]:row[key]+' 73'}));
 assert.throws(()=>verifyEdition({...row,answer:'wrong'}));assert.throws(()=>verifyEdition({...row,params:{...row.params,unreviewedExtra:41}}));
 if(row.options)assert.throws(()=>verifyEdition({...row,options:[...row.options].reverse()}));
});

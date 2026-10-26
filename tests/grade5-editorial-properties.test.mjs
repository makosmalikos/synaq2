import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verifyEdition} from '../scripts/editorial/grade5-properties-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade5-properties.json',import.meta.url),'utf8'));
const show=xs=>xs.join(', ');
function bigintProduct(ns){return ns.reduce((p,n)=>p*BigInt(n),1n);}
function postfixValue(tree){const output=[];function visit(n){if(typeof n==='number')output.push(n);else{visit(n[1]);visit(n[2]);output.push(n[0]);}}visit(tree);const stack=[];for(const item of output){if(typeof item==='number')stack.push(item);else{const b=stack.pop(),a=stack.pop();stack.push(item==='add'?a+b:item==='subtract'?a-b:a*b);}}assert.equal(stack.length,1);return stack[0];}
// A separate arithmetic reader checks the actual printed MCQ expressions, including grouping.
function read(text,env={}){
 assert.match(text,/^[\d\sa-z()+×−:]+$/);const ts=text.match(/\d+|[a-z]|[()+×−:]/g);let i=0;
 function atom(){const t=ts[i++];if(t==='('){const v=sum();assert.equal(ts[i++],')');return v;}if(/^\d+$/.test(t))return Number(t);assert.ok(Object.hasOwn(env,t),t);return env[t];}
 function product(){let n=atom();while(ts[i]==='×'||ts[i]===':'){const op=ts[i++],next=atom();n=op==='×'?n*next:n/next;}return n;}
 function sum(){let n=product();while(ts[i]==='+'||ts[i]==='−'){const op=ts[i++],next=product();n=op==='+'?n+next:n-next;}return n;}
 const n=sum();assert.equal(i,ts.length);return n;
}
function quotient(top,bottom){const a=BigInt(top),b=BigInt(bottom);assert.equal(a%b,0n);return String(a/b);}
function oracle(r){const p=r.params,k=r.modelId.replace('grade5-properties-','');switch(k){
 case'difference-quotient':return quotient(BigInt(p.left)-BigInt(p.right),p.divisor);
 case'sum-nondivisible-explanation':assert.equal(p.first%p.divisor,0);assert.notEqual(p.last%p.divisor,0);assert.notEqual((p.first+p.last)%p.divisor,0);assert.equal((p.first+p.last)%2,0);return`бөлінбейді: ${p.first} бөлінеді, ал ${p.last} бөлінбейді`;
 case'universal-product-rule':{
  assert.equal((p.divisor-1+1)%p.divisor,0);assert.ok((p.divisor-1)%p.divisor!==0);
  assert.equal(p.compositeFactors[0]*p.compositeFactors[1],p.composite);assert.ok(p.compositeFactors.every(n=>n%p.composite!==0));assert.ok(p.compositeFactors[0]>p.compositeFactors[1]);
  assert.ok((p.divisor+1)%p.divisor!==0&&((p.divisor+1)-1)%p.divisor===0);
  for(let b=1;b<=p.divisor;b++)assert.equal((p.divisor*b)%p.divisor,0);
  return`a саны ${p.divisor} санына бөлінсе, a × b көбейтіндісі де бөлінеді`;
 }
 case'both-terms-choice':{const chosen=r.options.filter(s=>{const ns=s.match(/\d+/g).map(Number);return ns.every(n=>n%p.divisor===0);});assert.equal(chosen.length,1);return chosen[0];}
 case'smallest-positive-addend':assert.equal(p.base%p.divisor,0);for(let n=1;n<=p.divisor;n++)if(Number.isInteger((p.base+n)/p.divisor))return String(n);throw Error('No addend');
 case'guaranteed-product-divisor':{const good=p.candidates.filter(d=>Number.isInteger(p.base/d));assert.equal(good.length,1);return String(good[0]);}
 case'product-choice':{const good=r.options.filter(s=>read(s)%p.divisor===0);assert.equal(good.length,1);return good[0];}
 case'symbolic-one-term':{const good=r.options.filter(s=>[1,2,5].every(a=>read(s,{a})*p.divisor===p.coefficient*a));assert.equal(good.length,1);return good[0];}
 case'symbolic-two-terms':{const good=r.options.filter(s=>[[2,3],[5,1],[7,4]].every(([x,y])=>{const target=p.operation==='add'?p.first*x+p.last*y:p.first*x-p.last*y;assert.ok(target>=0);return read(s,{x,y,m:x,n:y})*p.divisor===target;}));assert.equal(good.length,1);return good[0];}
 case'product-quotient':return quotient(bigintProduct(p.factors),p.divisor);
 case'sum-quotient':return quotient(BigInt(p.first)+BigInt(p.last),p.divisor);
 case'divisible-expression-choice':{const good=r.options.filter(s=>read(s)%p.divisor===0);assert.equal(good.length,1);assert.deepEqual(r.options.map(s=>read(s)),p.choices.map(postfixValue));assert.equal(postfixValue(p.factorised),read(good[0]));return good[0];}
 case'value-divisor-choice':{const printed=r.statement.split(' өрнегінің')[0];const v=read(printed);assert.equal(v,postfixValue(p.expr));assert.equal(v,postfixValue(p.factorised));const good=p.candidates.filter(d=>p.invert?!Number.isInteger(v/d):Number.isInteger(v/d));assert.equal(good.length,1);return String(good[0]);}
 case'addend-choice':{const good=p.candidates.filter(x=>Number.isInteger((p.base+x)/p.divisor));assert.equal(good.length,1);return String(good[0]);}
 case'nondivisible-expression-choice':{assert.deepEqual(r.options.map(s=>read(s)),p.choices.map(postfixValue));const good=r.options.filter(s=>!Number.isInteger(read(s)/p.divisor));assert.equal(good.length,1);return good[0];}
 case'equal-teams':{const first=BigInt(p.first),last=BigInt(p.last),groups=BigInt(p.groups);assert.equal(first%groups,0n);assert.equal(last%groups,0n);return String(first/groups+last/groups);}
 case'product-plus-remainder':return String(Number((BigInt(p.base)*BigInt(p.multiplier)+BigInt(p.added))%BigInt(p.divisor)));
 case'divisor-transitivity':assert.equal(p.base%p.must,0);assert.ok(p.base%p.double!==0&&p.base%p.falseDivisor!==0&&(p.base+1)%p.base!==0);return`a саны ${p.must} санына бөлінеді`;
 case'bounded-difference-count':{assert.ok(p.upper<p.base);const xs=[];for(let quotient=0;quotient<=p.base/p.divisor;quotient++){const x=p.base-quotient*p.divisor;if(x>0&&x<p.upper)xs.push(x);}return String(xs.length);}
 case'consecutive-product-quotient':{let n=1n;for(let f=p.first;f<=p.last;f++)n*=BigInt(f);return quotient(n,p.divisor);}
 case'not-guaranteed-shift':assert.ok(p.shift%p.divisor!==0);for(let a=2*p.divisor;a<=8*p.divisor;a+=p.divisor)for(let b=p.divisor;b<a;b+=p.divisor){assert.equal((a+b)%p.divisor,0);assert.equal((a-b)%p.divisor,0);assert.equal((p.multiplier*a)%p.divisor,0);assert.notEqual((a+p.shift)%p.divisor,0);}return`a + ${p.shift}`;
 case'append-digit-count':{const valid=[];assert.ok(p.example>=100&&p.example<=999&&p.example%p.divisor===0);for(let digit=0;digit<10;digit++){let all=true;for(let n=100;n<1000;n++)if(n%p.divisor===0&&Number(String(n)+String(digit))%p.divisor!==0)all=false;if(all)valid.push(digit);}return String(valid.length);}
 case'two-digit-addend-count':{let count=0;for(let multiple=Math.ceil((p.base+10)/p.divisor)*p.divisor;multiple<=p.base+99;multiple+=p.divisor)count++;return String(count);}
 case'one-divisible-one-not':for(let rem=1;rem<p.divisor;rem++){assert.notEqual((p.divisor+rem)%p.divisor,0);assert.equal((p.divisor*rem)%p.divisor,0);}return`a + b қосындысы ${p.divisor} санына бөлінбейді`;
 case'multiplied-remainder':{const rems=new Set();for(let q=0;q<=p.divisor;q++)rems.add(((q*p.divisor+p.remainder)*p.multiplier)%p.divisor);assert.equal(rems.size,1);return String([...rems][0]);}
 case'consecutive-product-rule':{const all=p.candidates.filter(d=>Array.from({length:d},(_,i)=>i+1).every(n=>(n*(n+1))%d===0));assert.equal(all.length,1);return String(all[0]);}
 case'repeated-two-digit-block':{const all=p.candidates.filter(d=>Array.from({length:90},(_,i)=>i+10).every(n=>Number(String(n)+String(n))%d===0));assert.equal(all.length,1);assert.ok(p.candidates.filter(d=>d!==all[0]).every(d=>Number(String(p.example)+String(p.example))%d!==0));return String(all[0]);}
 case'three-consecutive-sum':{const all=p.candidates.filter(d=>Array.from({length:d},(_,i)=>i+1).every(n=>(n+n+1+n+2)%d===0));assert.equal(all.length,1);assert.notEqual((2+3+4)%2,0);assert.notEqual((1+2+3)%5,0);assert.notEqual((1+2+3)%9,0);return String(all[0]);}
 case'four-consecutive-sum':{for(let n=1;n<=4;n++)assert.equal((n+(n+1)+(n+2)+(n+3))%4,2);assert.notEqual((2+3+4+5)%5,0);assert.notEqual((1+2+3+4)%12,0);return'4 санына ешқашан бөлінбейді';}
 case'range-multiple-count':return String(Math.floor(p.upper/p.divisor)-Math.floor((p.lower-1)/p.divisor));
 case'universal-sum-greatest-divisor':{const x=p.first+p.last,y=p.first+2*p.last;const divs=[];for(let d=1;d<=x;d++)if(x%d===0&&y%d===0)divs.push(d);const greatest=divs.at(-1);assert.equal(p.first%greatest,0);assert.equal(p.last%greatest,0);return String(greatest);}
 case'decomposition-choice':{const good=r.options.filter(s=>{const ns=s.match(/\d+/g).map(Number);return ns.reduce((a,b)=>a+b)===p.number&&ns.every(n=>n%p.divisor===0);});assert.equal(good.length,1);return good[0];}
 case'nearby-known-quotient':return quotient(BigInt(p.divisor)*BigInt(p.knownQuotient+p.extra),p.divisor);
 case'multiplier-guarantee':{assert.ok(r.options.includes(`a + ${p.target}`));const good=r.options.filter(s=>Array.from({length:p.target},(_,i)=>i+1).every(k=>Number.isInteger(read(s,{a:p.base*k})/p.target)));assert.equal(good.length,1);return good[0];}
 case'small-divisors-product-count':{let count=0;const prod=bigintProduct(p.factors);for(let d=1;d<=p.limit;d++)if(prod%BigInt(d)===0n)count++;return String(count);}
 case'nondivisible-summands-counterexample':assert.ok(p.first%p.divisor!==0&&p.last%p.divisor!==0);assert.equal((p.first+p.last)%p.divisor,0);return`қорытынды қате: ${p.first} + ${p.last} = ${p.first+p.last}, бұл сан бөлінеді`;
 case'two-stores-count':{const possibilities=[];for(let first=p.group;first<p.total;first+=p.group){const second=p.total-first;if(second>p.lower&&second<p.upper)possibilities.push(second);}assert.equal(possibilities.length,1);return String(possibilities[0]);}
 case'infer-other-summand':for(let a=p.divisor;a<=5*p.divisor;a+=p.divisor)for(let b=1;b<=5*p.divisor;b++)if((a+b)%p.divisor===0){assert.equal(b%p.divisor,0);assert.equal((a*b)%(p.divisor*p.divisor),0);}assert.notEqual(p.divisor%(2*p.divisor),0);return`b саны ${p.divisor} санына бөлінеді`;
 case'erased-summand':{let total=0;for(let n=1;n<=p.last;n++)total+=n;const xs=[];for(let n=p.lower+1;n<=p.last;n++)if(Number.isInteger((total-n)/p.divisor))xs.push(n);assert.equal(xs.length,1);return String(xs[0]);}
 default:throw Error('Missing independent property oracle '+k);
}}
test('all46 captured property sources retain source scope and pending Standard status',()=>{
 const captured=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-3');assert.equal(data.editions.length,46);assert.deepEqual(data.editions.map(r=>r.sourceRefs[0].sourceId).sort(),captured.map(q=>q.sourceId).sort());
 for(const r of data.editions){assert.equal(r.grade,5);assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'awaiting_independent_review');const source=captured.find(q=>q.sourceId===r.sourceRefs[0].sourceId);assert.ok(source.checked);assert.equal(r.sourceRefs[0].sourceFile,source.sourceFile);assert.notEqual(r.statement,source.raw.statement);assert.doesNotMatch(r.statement+r.solution,/[\\$]/);if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(v=>v===r.answer).length,1);}else assert.match(r.answer,/^\d+$/);}
});
test('removed-card task retains the difference-of-two-multiples implication rather than a new nonzero remainder problem',()=>{
 const row=data.editions.find(r=>r.modelId==='grade5-properties-erased-summand'),p=row.params;
 let total=0;for(let n=1;n<=p.last;n++)total+=n;
 assert.equal(total%p.divisor,0);assert.equal(Number(row.answer)%p.divisor,0);assert.equal((total-Number(row.answer))%p.divisor,0);
 assert.equal(total,528);assert.equal(Number(row.answer),22);assert.match(row.solution,/айырмасы/);
});
for(const row of data.editions)test(row.editionId+' agrees with independent exact arithmetic, printed expressions and counterexamples',()=>{
 assert.equal(row.answer,oracle(row));assert.equal(verifyEdition(row).answer,row.answer);
 for(const key of['statement','solution'])assert.throws(()=>verifyEdition({...row,[key]:row[key]+' 47'}));assert.throws(()=>verifyEdition({...row,answer:'wrong'}));assert.throws(()=>verifyEdition({...row,params:{...row.params,unreviewedExtra:23}}));
 if(row.options)assert.throws(()=>verifyEdition({...row,options:row.options.slice().reverse()}));
});

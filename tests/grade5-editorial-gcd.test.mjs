import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEditions,verifyEdition} from '../scripts/editorial/grade5-gcd-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
const rows=buildEditions(),prefix='grade5-gcd-',kind=r=>r.modelId.slice(prefix.length);
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i);
const only=xs=>{assert.equal(xs.length,1);return xs[0];};
const sum=xs=>xs.reduce((a,b)=>a+b,0);
// Oracle enumerates the complete common-divisor domain; the producer uses Euclid.
const common=ns=>range(1,Math.min(...ns)).filter(d=>ns.every(n=>n%d===0));
const g=ns=>Math.max(...common(ns));
const pow=(b,e)=>Array(e).fill(BigInt(b)).reduce((a,b)=>a*b,1n);
const amount=ps=>Number(ps.map(([b,e])=>pow(b,e)).reduce((a,b)=>a*b,1n));
const match=(row,predicate)=>only(row.options.filter(predicate));
const choiceNumber=(row,n)=>match(row,o=>Number(o)===n);
const pair=o=>o.split(' және ').map(Number);
const pairMCQ=(row,predicate)=>match(row,o=>predicate(pair(o)));
function formula(o,variables){const m=o.match(/^(\d+) × \((.+)\)$/);assert.ok(m);const terms=m[2].split(' + ');assert.equal(terms.length,variables.length);return{factor:Number(m[1]),coefficients:terms.map((t,i)=>{const m=t.match(/^(\d+)([a-z])$/);assert.ok(m);assert.equal(m[2],variables[i]);return Number(m[1]);})};}
function oracle(row){const p=row.params;switch(kind(row)){
 case'smallest-divides-pair':case'smallest-divides-triple':case'gcd-factor-pair':case'gcd-divisor-lists':case'gcd-min-exponent-pair':case'gcd-short-list':case'gcd-large-factor-pair':case'gcd-three-shared-primes':return g(p.numbers);
 case'common-divisor-set':return match(row,o=>{const ds=o.split(', ').map(Number);return JSON.stringify(ds)===JSON.stringify(common(p.numbers));});
 case'coprime-composite-pair':case'coprime-hidden-composite-pair':return pairMCQ(row,xs=>g(xs)===1);
 case'not-coprime-pair':return pairMCQ(row,xs=>g(xs)>1);
 case'gcd-equals-smaller-pair':return pairMCQ(row,xs=>g(xs)===Math.min(...xs));
 case'largest-pair-gcd':{const max=Math.max(...row.options.map(o=>g(pair(o))));return pairMCQ(row,xs=>g(xs)===max);}
 case'powered-gcd-choice':case'powered-gcd-unshared':case'three-powered-gcd':{const value=g(p.products.map(amount));return row.options?choiceNumber(row,value):value;}
 case'coprime-to-semiprime':case'coprime-to-repeated-primes':return match(row,o=>g([p.target,Number(o)])===1);
 case'prime-vs-composite-gcd':return choiceNumber(row,g(p.numbers));
 case'coprime-definition':{
  assert.equal(g([25,36]),1);assert.equal(g([10,15]),5);assert.equal(g([14,21]),7);
  return match(row,o=>o==='Өзара жай натурал сандардың ең үлкен ортақ бөлгіші 1 болады');
 }
 case'common-divisor-count-small':case'common-divisor-count-factor':return common(p.numbers).length;
 case'not-common-divisor':return match(row,o=>!p.numbers.every(n=>n%Number(o)===0));
 case'choose-exact-gcd':return match(row,o=>g([Number(o),p.fixed])===p.target);
 case'triple-min-powers':return choiceNumber(row,g(p.numbers));
 case'factor-out-two':case'factor-out-three':return match(row,o=>{const f=formula(o,p.variables);return f.factor===g(p.coefficients)&&f.coefficients.every((n,i)=>n*f.factor===p.coefficients[i]);});
 case'maximum-two-type-bundles':{
  const possible=range(1,Math.min(...p.amounts)).filter(count=>p.amounts.every(n=>n%count===0));return Math.max(...possible);
 }
 case'maximum-gifts-ask-first-item':{
  const gifts=Math.max(...range(1,Math.min(...p.amounts)).filter(count=>p.amounts.every(n=>n%count===0)));return p.amounts[0]/gifts;
 }
 case'maximum-teams-members':{
  const max=g(p.amounts);return match(row,o=>{const m=o.match(/^(\d+) команда, әрқайсысында (\d+) оқушы$/);assert.ok(m);return Number(m[1])===max&&Number(m[2])===sum(p.amounts)/max;});
 }
 case'maximum-separate-bus-capacity':return Math.max(...range(1,Math.min(...p.amounts)).filter(capacity=>p.amounts.every(n=>n%capacity===0)));
 case'gcd-ratio-sum-pair':{const ratio=g(p.ratioInputs),total=g(p.sumInputs);return pairMCQ(row,([large,small])=>large+small===total&&large===ratio*small);}
 case'two-digit-exact-gcd-count':return range(10,99).filter(n=>g([n,p.fixed])===p.target).length;
 case'largest-square-tile-count':{
  const l=Number(String(p.lengthMetres)+String(p.lengthCm).padStart(2,'0')),w=Number(String(p.widthMetres)+String(p.widthCm).padStart(2,'0'));
  const side=Math.max(...range(1,Math.min(l,w)).filter(e=>l%e===0&&w%e===0));let count=0;for(let x=0;x<l;x+=side)for(let y=0;y<w;y+=side)count++;return count;
 }
 case'composite-base-powered-gcd':{
  const actual=g([Number(pow(p.prime,p.firstExponent)),Number(pow(p.composite,p.secondExponent))]);
  const supers='⁰¹²³⁴⁵⁶⁷⁸⁹';return match(row,o=>{const m=o.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]*)$/);assert.ok(m);const e=m[2]?Number([...m[2]].map(c=>supers.indexOf(c)).join('')):1;return pow(Number(m[1]),e)===BigInt(actual);});
 }
 case'largest-remainder-divisor':{
  const possible=range(1,Math.min(...p.numbers)).filter(d=>p.remainders.every(r=>r<d)&&p.numbers.every((n,i)=>n%d===p.remainders[i]));return Math.max(...possible);
 }
 case'unordered-sum-gcd-pairs':return range(1,Math.floor(p.total/2)).filter(a=>g([a,p.total-a])===p.gcd).length;
 case'impossible-difference-gcd':{
  // gcd(n,n+d)=gcd(n,d) by common-divisor subtraction in both directions;
  // all residue classes1..d therefore cover the entire infinite domain.
  const actual=new Set(range(1,p.difference).map(n=>g([n,n+p.difference])));return match(row,o=>!actual.has(Number(o)));
 }
 case'maximum-tank-and-count':{
  const mass=g(p.amounts),total=sum(p.amounts)/mass;return match(row,o=>{const m=o.match(/^(\d+) т, (\d+) цистерна$/);return m&&Number(m[1])===mass&&Number(m[2])===total;});
 }
 case'consecutive-coprime-theorem':{
  assert.equal(g([15,21]),3);assert.equal(g([25,36]),1);assert.equal(g([7,21]),7);
  return match(row,o=>o==='Айырмасы 1 болатын екі натурал сан әрқашан өзара жай');
 }
 case'greatest-two-digit-gcd-input':return Math.max(...range(10,99).filter(n=>g([n,p.fixed])===p.fixed));
 case'unknown-prime-exponent':{
  const target=Number(pow(p.prime,p.targetExponent)),fixed=Number(pow(p.prime,p.bound))*p.secondOther;
  const possible=range(1,p.bound+3).filter(k=>g([Number(pow(p.prime,k))*p.firstOther,fixed])===target);assert.equal(p.targetExponent<p.bound,true);return choiceNumber(row,only(possible));
 }
 case'product-and-gcd-sum':{
  const pairs=range(1,Math.floor(Math.sqrt(p.product))).flatMap(a=>p.product%a===0&&g([a,p.product/a])===p.gcd?[[a,p.product/a]]:[]);return sum(only(pairs));
 }
 case'greatest-guaranteed-common-divisor':{
  const guaranteed=g([p.firstMultiple,p.secondMultiple]);
  // Arbitrary multiples preserve every original common divisor; original inputs
  // themselves are a witness imposing the global upper bound.
  for(let a=1;a<=12;a++)for(let b=1;b<=12;b++)assert.equal(g([a*p.firstMultiple,b*p.secondMultiple])%guaranteed,0);
  return choiceNumber(row,guaranteed);
 }
 case'remove-one-max-package':{
  const values=[];for(let removed=0;removed<p.amounts.length;removed++){const ns=p.amounts.filter((_,i)=>i!==removed);values.push(Math.max(...range(1,Math.min(...ns)).filter(pack=>ns.every(n=>n%pack===0))));}return Math.max(...values);
 }
 case'coprime-initial-segment-count':return range(1,p.last).filter(n=>common([n,p.last]).length===1).length;
 case'gcd-scaling-law':{
  const expected=p.gcd*p.multiplier;for(let m=1;m<=16;m++)for(let n=1;n<=16;n++)if(g([m,n])===1)assert.equal(g([p.multiplier*p.gcd*m,p.multiplier*p.gcd*n]),expected);
  return choiceNumber(row,expected);
 }
 default:throw Error('Missing independent gcd oracle '+kind(row));
}}
for(const row of rows)test('independent full-domain gcd oracle '+row.editionId,()=>{
 assert.equal(row.answer,String(oracle(row)));assert.equal(verifyEdition(row).answer,row.answer);
 assert.ok(!/[\\$]/.test(row.statement+row.solution));if(row.options){assert.equal(row.options.length,4);assert.equal(new Set(row.options).size,4);assert.equal(row.options.filter(o=>o===row.answer).length,1);}else{assert.match(row.answer,/^\d+$/);assert.ok(row.statement.endsWith('Жауапқа тек санды жазыңыз.'));}
});
test('all 48 nonvisual canonical saved topic2.8 source ids covered once',()=>{
 const src=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-8');assert.equal(src.length,48);assert.equal(rows.length,48);assert.deepEqual(new Set(rows.map(r=>r.sourceRefs[0].sourceId)),new Set(src.map(q=>q.sourceId)));
 for(const row of rows){const ref=row.sourceRefs[0],raw=JSON.parse(fs.readFileSync(ref.sourceFile)),q=only(raw.questions.filter(q=>q.id===ref.sourceId));assert.ok(q.checked);assert.notEqual(q.statement,row.statement);assert.equal(row.grade,5);assert.equal(row.minimumPlan,'pro');assert.ok(!row.figure&&!row.image);}
});
test('every printed condition solution key and option bound to fixed reviewed-intent parameters',()=>{
 for(const row of rows){for(const field of['statement','solution','answer']){const bad=structuredClone(row);bad[field]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));}const bad=structuredClone(row);bad.params.unboundDivisor=19;assert.throws(()=>verifyEdition(bad));if(row.options){const option=structuredClone(row);option.options[0]+=' өзгеріс';assert.throws(()=>verifyEdition(option));}}
});
test('extra prime multiplicity allowed when other operand caps shared part; source false overgeneralisation rejected',()=>{
 const row=only(rows.filter(r=>kind(r)==='choose-exact-gcd'));assert.equal(row.answer,'112');assert.equal(112%16,0);assert.equal(g([112,40]),8);assert.notEqual(g([80,40]),8);
 assert.equal(g([80,24]),8);assert.equal(80%16,0);
 const count=only(rows.filter(r=>kind(r)==='two-digit-exact-gcd-count'));assert.equal(count.answer,'4');assert.deepEqual(range(10,99).filter(n=>g([n,48])===16),[16,32,64,80]);
});
test('polynomial equivalence alone does not satisfy factor-out-GREATEST requirement',()=>{
 for(const row of rows.filter(r=>kind(r).startsWith('factor-out-'))){const equivalent=row.options.filter(o=>{const f=formula(o,row.params.variables);return f.coefficients.every((n,i)=>f.factor*n===row.params.coefficients[i]);});assert.equal(equivalent.length,3);assert.equal(equivalent.filter(o=>formula(o,row.params.variables).factor===g(row.params.coefficients)).length,1);}
});
test('full unordered pair, remainder and remove-one optimisation domains remain nontrivial',()=>{
 const get=k=>only(rows.filter(r=>kind(r)===k));
 assert.equal(get('unordered-sum-gcd-pairs').answer,'4');assert.deepEqual(range(1,75).filter(a=>g([a,150-a])===10),[10,20,40,70]);
 assert.equal(get('largest-remainder-divisor').answer,'84');assert.equal(262%84,10);assert.equal(428%84,8);assert.ok(84>10&&84>8);
 const crates=get('remove-one-max-package');assert.equal(crates.answer,'40');assert.deepEqual(crates.params.amounts.map((_,i)=>g(crates.params.amounts.filter((_,j)=>j!==i))),[10,10,40,10,10]);
 assert.equal(get('largest-square-tile-count').answer,'154');assert.equal(420*330/(30*30),154);
});
test('requested count versus contents, all-three support and greatest pair misdirection retained',()=>{
 const get=k=>only(rows.filter(r=>kind(r)===k));
 assert.equal(get('maximum-gifts-ask-first-item').answer,'11');assert.equal(g([132,180,228]),12);assert.equal(get('maximum-teams-members').answer,'15 команда, әрқайсысында 5 оқушы');
 assert.equal(get('three-powered-gcd').answer,'648');assert.equal(get('composite-base-powered-gcd').answer,'3³');assert.equal(get('maximum-tank-and-count').answer,'30 т, 43 цистерна');
 assert.equal(get('largest-pair-gcd').answer,'48 және 120');assert.equal(g([80,140]),20);assert.equal(get('product-and-gcd-sum').answer,'64');
 assert.equal(get('unknown-prime-exponent').answer,'4');assert.equal(get('gcd-scaling-law').answer,'44');assert.equal(get('greatest-guaranteed-common-divisor').answer,'12');
 for(const[k,phrase]of[['maximum-separate-bus-capacity','мектептер араласпайды'],['largest-square-tile-count','Тақталар кесілмейді'],['unordered-sum-gcd-pairs','орындарын ауыстыру жаңа жұп'],['maximum-gifts-ask-first-item','Бір сыйлықта неше маркер'],['coprime-initial-segment-count','екі шеті де кіретін']]){const row=get(k);assert.ok(row.statement.includes(phrase));const bad=structuredClone(row);bad.statement=bad.statement.replace(phrase,'');assert.throws(()=>verifyEdition(bad));}
});

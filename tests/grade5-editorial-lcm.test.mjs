import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEditions,verifyEdition} from '../scripts/editorial/grade5-lcm-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
const rows=buildEditions(),prefix='grade5-lcm-',kind=r=>r.modelId.slice(prefix.length);
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),prod=ns=>ns.reduce((a,b)=>a*b,1);
const only=xs=>{assert.equal(xs.length,1);return xs[0];};
// Independent finite oracle: ordered multiples, never Euclid or prime maxima.
const common=(n,ds)=>ds.every(d=>n%d===0);
function least(ds){const step=Math.max(...ds);for(let n=step;n<=prod(ds);n+=step)if(common(n,ds))return n;throw Error('No common multiple');}
const greatest=ds=>Math.max(...range(1,Math.min(...ds)).filter(d=>ds.every(n=>n%d===0)));
const match=(r,predicate)=>only(r.options.filter(predicate));
const numeric=(r,n)=>r.options?match(r,o=>Number(o)===n):n;
const powerValue=o=>o.split(' × ').map(term=>{const m=term.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]*)$/);assert.ok(m);const exponent=m[2]?Number([...m[2]].map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join('')):1;let result=1;for(let i=0;i<exponent;i++)result*=Number(m[1]);return result;}).reduce((a,b)=>a*b,1);
const productValue=ps=>prod(ps.map(([b,e])=>prod(Array(e).fill(b))));
const minutes=o=>{const [h,m]=o.split(':').map(Number);return h*60+m;};
const week=['дүйсенбі','сейсенбі','сәрсенбі','бейсенбі','жұма','сенбі','жексенбі'];
const get=k=>only(rows.filter(r=>kind(r)===k));
function oracle(row){const p=row.params;switch(kind(row)){
 case'lcm-first-large-multiple':case'lcm-larger-divides':case'lcm-three-distinct-primes':case'lcm-nested-triple':case'lcm-missing-prime-completion':case'lcm-two-primes':case'lcm-two-multiple-lists':case'lcm-repeated-larger-multiples':case'lcm-two-shared-prime':case'lcm-prime-maxima-large':case'lcm-three-overlap-support':return numeric(row,least(p.numbers));
 case'lcm-divisibility-property':{
  const n=least(p.numbers);assert.ok(common(n,p.numbers));assert.notEqual(n,greatest(p.numbers));assert.notEqual(n,prod(p.numbers));assert.ok(n>=Math.max(...p.numbers));return match(row,o=>o===`ЕКОЕ(${p.numbers.join(', ')}) саны ${p.numbers[0]} және ${p.numbers[1]} сандарына қалдықсыз бөлінеді`);
 }
 case'common-multiple-choice':return match(row,o=>common(Number(o),p.numbers));
 case'lcm-equals-product-pair':case'pair-with-fixed-lcm':return match(row,o=>{const ns=o.split(' және ').map(Number);return least(ns)===(kind(row)==='lcm-equals-product-pair'?prod(ns):p.target);});
 case'listed-factor-lcm':return numeric(row,least(p.products.map(prod)));
 case'lcm-definition':{
  assert.equal(least([6,10]),30);assert.notEqual(greatest([6,10]),30);assert.notEqual(prod([6,10]),30);assert.ok(!common(10,[6,10]));return match(row,o=>o==='Берілген натурал сандардың әрқайсысына бөлінетін ең кіші оң натурал сан');
 }
 case'powered-lcm-choice':return numeric(row,least(p.products.map(productValue)));
 case'lcm-power-representation':return match(row,o=>powerValue(o)===least(p.products.map(productValue)));
 case'least-fixed-digit-common-multiple':case'least-three-digit-common-multiple':return numeric(row,range(10**(p.digits-1),10**p.digits-1).find(n=>common(n,p.numbers)));
 case'common-multiple-strict-range':return only(range(p.lower+1,p.upper-1).filter(n=>common(n,p.numbers)));
 case'choose-lcm-input':return match(row,o=>least([Number(o),p.fixed])===p.target);
 case'least-alternative-purchase-budget':return least(p.prices);
 case'next-departure-clock':case'three-runners-next-clock':case'next-departure-elapsed':{
  const next=range(1,prod(p.periods)).find(t=>common(t,p.periods));return kind(row)==='next-departure-elapsed'?next:match(row,o=>minutes(o)-p.startMinutes===next);
 }
 case'count-common-multiples-below':return range(1,p.upper-1).filter(n=>common(n,p.numbers)).length;
 case'least-common-plus-remainder':return numeric(row,range(p.remainder+1,prod(p.divisors)+p.remainder).find(n=>p.divisors.every(d=>n%d===p.remainder)));
 case'recurrence-weekday':{
  const days=range(1,prod(p.periods)).find(n=>common(n,p.periods));let day=p.startWeekday;for(let i=0;i<days;i++)day=(day+1)%7;return match(row,o=>o===week[day]);
 }
 case'footprints-inclusive-path':return range(0,p.distanceMetres*100).filter(x=>common(x,p.stepsCm)).length;
 case'gcd-from-product-lcm':{
  const pairs=range(1,Math.floor(Math.sqrt(p.product))).flatMap(n=>p.product%n===0&&least([n,p.product/n])===p.lcm?[[n,p.product/n]]:[]);assert.ok(pairs.length);const values=new Set(pairs.map(greatest));return numeric(row,only([...values]));
 }
 case'least-one-below-divisors':return numeric(row,range(1,prod(p.divisors)).find(n=>p.divisors.every(d=>n%d===d-1)));
 case'count-all-lcm-inputs':return numeric(row,range(1,p.target).filter(x=>least([x,p.fixed])===p.target).length);
 case'count-common-excluding-prime':return range(1,p.upper-1).filter(n=>common(n,p.numbers)&&n%p.excluded!==0).length;
 case'other-input-from-gcd-lcm':return match(row,o=>{const ns=[p.known,Number(o)];return greatest(ns)===p.gcd&&least(ns)===p.lcm;});
 case'three-schedules-inclusive-window':return range(0,p.endMinutes-p.startMinutes).filter(t=>common(t,p.periods)).length;
 case'minimum-items-exact-coin-payment':return range(1,p.coin).find(n=>(n*p.price)%p.coin===0);
 case'least-remainder-with-extra-divisor':return numeric(row,range(1,prod(p.divisors)*p.extra+p.remainder).find(n=>n%p.extra===0&&p.divisors.every(d=>n%d===p.remainder)));
 case'three-lights-inclusive-seconds':return range(0,p.durationMinutes*60).filter(t=>common(t,p.periods)).length;
 case'lcm-equals-first-guarantee':{
  // Definition proves b|lcm(a,b)=a. Other options each fail the same witness.
  assert.equal(least([30,10]),30);assert.notEqual(greatest([30,10]),1);assert.notEqual(10%30,0);assert.notEqual(30,10**2);return match(row,o=>o==='a саны b санына қалдықсыз бөлінеді');
 }
 case'lcm-minus-gcd':return least(p.numbers)-greatest(p.numbers);
 case'same-origin-sequence-intersection':{
  const a=new Set(range(0,Math.floor((p.upper-p.start)/p.steps[0])).map(i=>p.start+i*p.steps[0]));return range(0,Math.floor((p.upper-p.start)/p.steps[1])).map(i=>p.start+i*p.steps[1]).filter(n=>a.has(n)).length;
 }
 case'least-all-initial-divisors':return least(range(1,p.last));
 case'unknown-lcm-prime-exponent':{
  const target=p.prime**p.targetExponent*p.firstOther**p.otherExponent;return match(row,o=>least([p.prime**Number(o)*p.firstOther,p.prime*p.firstOther**p.otherExponent])===target);
 }
 case'consecutive-lcm-sum':return numeric(row,only(range(1,p.lcm).filter(n=>least([n,n+1])===p.lcm).map(n=>2*n+1)));
 case'two-alarm-union-window':return range(0,p.endMinutes-p.startMinutes).filter(t=>p.periods.some(d=>t%d===0)).length;
 case'interval-without-common-multiple':return match(row,o=>{const m=o.match(/^(\d+) мен (\d+) арасында$/);assert.ok(m);return !range(Number(m[1])+1,Number(m[2])-1).some(n=>common(n,p.divisors));});
 default:throw Error('Missing independent lcm oracle '+kind(row));
}}
for(const row of rows)test('complete independent lcm candidate oracle '+row.editionId,()=>{
 assert.equal(row.answer,String(oracle(row)));assert.equal(verifyEdition(row).answer,row.answer);assert.ok(!/[\\$]/.test(row.statement+row.solution));
 if(row.options){assert.equal(row.options.length,4);assert.equal(new Set(row.options).size,4);assert.equal(row.options.filter(o=>o===row.answer).length,1);}else{assert.match(row.answer,/^\d+$/);assert.ok(row.statement.endsWith('Жауапқа тек санды жазыңыз.'));}
});
test('all48 canonical nonvisual source2.9 occur once, without unsupported publication or images',()=>{
 const src=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-9');assert.equal(src.length,48);assert.equal(rows.length,48);assert.deepEqual(new Set(rows.map(r=>r.sourceRefs[0].sourceId)),new Set(src.map(q=>q.sourceId)));
 for(const row of rows){const ref=row.sourceRefs[0],q=only(JSON.parse(fs.readFileSync(ref.sourceFile)).questions.filter(q=>q.id===ref.sourceId));assert.ok(q.checked);assert.notEqual(row.statement,q.statement);assert.equal(row.grade,5);assert.equal(row.minimumPlan,'pro');assert.equal(row.editorialStatus,'awaiting_independent_review');assert.ok(!row.image&&!row.figure);}
});
test('all numerical givens printed statements solutions keys options and metadata are exact-bound',()=>{
 for(const row of rows){for(const field of['statement','solution','answer']){const bad=structuredClone(row);bad[field]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));}for(const field of['grade','topic','difficulty','modelId','minimumPlan']){const bad=structuredClone(row);bad[field]='tamper';assert.throws(()=>verifyEdition(bad));}const bad=structuredClone(row);bad.params.extraUnbound=13;assert.throws(()=>verifyEdition(bad));if(row.options){const bad=structuredClone(row);bad.options[0]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));}}
});
test('least versus any multiple, all possible inputs and valid nonleast distractors remain distinct',()=>{
 assert.equal(get('common-multiple-choice').answer,'210');assert.equal(least([10,14]),70);
 const inputs=get('count-all-lcm-inputs');assert.equal(inputs.answer,'8');assert.deepEqual(range(1,168).filter(x=>least([x,24])===168),[7,14,21,28,42,56,84,168]);
 assert.equal(get('least-common-plus-remainder').answer,'122');assert.ok(common(1442-2,[8,12,15]));assert.equal(get('least-one-below-divisors').answer,'119');assert.ok([5,6,8].every(d=>239%d===d-1));
 assert.equal(get('least-remainder-with-extra-divisor').answer,'481');assert.equal(2041%13,0);assert.ok([3,4,5,6,8].every(d=>2041%d===1));
});
test('elapsed time clock weekday union and inclusive endpoints use the quantity actually requested',()=>{
 assert.equal(get('next-departure-clock').answer,'11:00');assert.equal(get('next-departure-elapsed').answer,'75');assert.equal(get('three-runners-next-clock').answer,'11:20');assert.equal(get('recurrence-weekday').answer,'жексенбі');
 assert.equal(get('two-alarm-union-window').answer,'33');assert.equal(range(0,240).filter(t=>common(t,[10,15])).length,9);
 assert.equal(get('three-schedules-inclusive-window').answer,'6');assert.equal(get('three-lights-inclusive-seconds').answer,'6');assert.equal(get('footprints-inclusive-path').answer,'21');assert.equal(get('same-origin-sequence-intersection').answer,'9');
 assert.equal(get('minimum-items-exact-coin-payment').answer,'20');assert.equal(20*45,9*100);
});
test('strict boundaries exclude endpoints and zero while integer-only initial divisor1 remains valid',()=>{
 assert.equal(get('count-common-multiples-below').answer,'7');assert.equal(common(320,[8,20]),true);assert.equal(get('count-common-excluding-prime').answer,'13');
 const interval=get('interval-without-common-multiple');assert.equal(interval.answer,'240 мен 360 арасында');assert.equal(common(240,[6,8,15]),true);assert.equal(common(360,[6,8,15]),true);
 const all=get('least-all-initial-divisors');assert.equal(all.answer,'27720');assert.ok(all.solution.includes('1 = 1;'));assert.ok(!all.solution.includes('1 = ;'));assert.notEqual(27720,prod(range(1,12)));assert.notEqual(27720,2*3*5*7*11);
});
test('min/max exponents product identity inverse conditions and adjacent-number uniqueness retain skill',()=>{
 assert.equal(get('lcm-power-representation').answer,'2³ × 5² × 7 × 11');assert.equal(get('powered-lcm-choice').answer,'400');assert.equal(get('unknown-lcm-prime-exponent').answer,'4');
 const inverse=get('other-input-from-gcd-lcm');assert.equal(inverse.answer,'56');for(const n of[35,7]){assert.equal(least([40,n]),280);assert.notEqual(greatest([40,n]),8);}
 assert.equal(get('gcd-from-product-lcm').answer,'8');assert.equal(get('consecutive-lcm-sum').answer,'41');assert.equal(get('lcm-three-overlap-support').answer,'308');
 assert.ok(inverse.solution.includes('min(r, s) + max(r, s) = r + s'));assert.ok(get('least-alternative-purchase-budget').statement.includes('Екі тауарды араластырып алмайды'));
});

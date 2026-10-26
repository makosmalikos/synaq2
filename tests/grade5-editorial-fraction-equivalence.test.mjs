import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEditions,verifyEdition} from '../scripts/editorial/grade5-fraction-equivalence-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
import {mathFragments} from '../frontend/src/mathPresentation.js';
const rows=buildEditions(),prefix='grade5-fraction-equivalence-',kind=r=>r.modelId.slice(prefix.length);
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),one=xs=>{assert.equal(xs.length,1);return xs[0];};
const get=k=>one(rows.filter(r=>kind(r)===k)),pick=(r,f)=>one(r.options.filter(f));
const divisors=n=>range(1,n).filter(d=>n%d===0),common=(a,b)=>divisors(a).filter(d=>b%d===0),coprime=(a,b)=>common(a,b).length===1;
const same=([a,b],[c,d])=>b>0&&d>0&&a*d===c*b;
const q=text=>{const m=text.match(/^\((\d+)\/(\d+)\)$/);assert.ok(m,text);return m.slice(1).map(Number);};
const mcq=(r,value)=>pick(r,o=>same(q(o),value));
const fracNodes=text=>mathFragments(text).filter(node=>node.type==='fraction');
// Separate small printed-expression parser; no import of author's calculator.
function expression(text){
 const digits='⁰¹²³⁴⁵⁶⁷⁸⁹';let at=0;
 const tokens=text.match(/\d+[⁰¹²³⁴⁵⁶⁷⁸⁹]*|[()+×−-]/gu)||[];
 assert.equal(tokens.join(''),text.replace(/\s/g,''),text);
 function atom(){const token=tokens[at++];if(token==='('){const n=add();assert.equal(tokens[at++],')');return n;}const m=token?.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]*)$/u);assert.ok(m,text);const e=m[2]?Number([...m[2]].map(c=>digits.indexOf(c)).join('')):1;return Number(m[1])**e;}
 function mul(){let n=atom();while(tokens[at]==='×'){at++;n*=atom();}return n;}
 function add(){let n=mul();while(['+','−','-'].includes(tokens[at])){const op=tokens[at++],v=mul();n=op==='+'?n+v:n-v;}return n;}
 const value=add();assert.equal(at,tokens.length);assert.ok(Number.isSafeInteger(value));return value;
}
function numericFraction(node){assert.equal(node.type,'fraction');const text=ns=>ns.map(n=>{assert.equal(n.type,'text');return n.value;}).join('');return[expression(text(node.numerator)),expression(text(node.denominator))];}
const printed=r=>numericFraction(one(fracNodes(r.statement)));
const reduced=([n,d])=>{const g=Math.max(...common(n,d));return[n/g,d/g];};
function oracle(row){const p=row.params;switch(kind(row)){
 case'equivalent-choice':return mcq(row,p.fraction);
 case'invalid-cancellation-factor':return pick(row,o=>{const k=Number(o);return p.fraction.some(n=>n%k!==0);});
 case'greatest-cancellation-factor':case'hidden-common-prime':return Math.max(...common(...p.fraction));
 case'irreducible-choice':return pick(row,o=>coprime(...q(o)));
 case'unknown-numerator-denominator-scale':case'equivalent-ask-numerator':case'equivalent-missing-numerator':return one(range(1,p.newDenominator).filter(n=>same([n,p.newDenominator],p.fraction)));
 case'unknown-denominator-numerator-scale':return one(range(1,p.newNumerator*p.fraction[1]).filter(d=>same([p.newNumerator,d],p.fraction)));
 case'reduce-selected-fraction':case'common-five-reduction':case'successive-halving-reduction':case'multi-prime-reduction':return pick(row,o=>same(q(o),p.fraction)&&coprime(...q(o)));
 case'fully-reduced-denominator':return one(range(1,p.fraction[1]).flatMap(d=>range(1,p.fraction[0]).filter(n=>same([n,d],p.fraction)&&coprime(n,d)).map(()=>d)));
 case'expansion-scale':return one(range(1,p.expanded[1]).filter(k=>p.fraction.every((v,i)=>v*k===p.expanded[i])));
 case'fraction-property-equation':return pick(row,o=>{const ns=fracNodes(o);assert.equal(ns.length,2);return same(...ns.map(numericFraction));});
 case'crossed-prime-powers-denominator':return reduced(printed(row))[1];
 case'equivalent-sum-denominator':return one(range(1,p.sum-1).filter(d=>same([p.sum-d,d],p.fraction)));
 case'whole-sum-fraction':case'product-fraction-reduction':case'factored-sum-over-product':case'composite-base-power-reduction':case'overlapping-product-ranges':case'geometric-power-sums-ratio':return mcq(row,printed(row));
 case'all-three-equivalent-row':return pick(row,o=>{const ns=fracNodes(o).map(numericFraction);assert.equal(ns.length,3);return ns.every(q=>same(q,ns[0]));});
 case'category-reduced-term-sum':return reduced([p.selected,p.total]).reduce((a,b)=>a+b);
 case'least-denominator-strict-bound':return one(range(p.lowerExclusive+1,p.lowerExclusive+p.fraction[1]).filter(d=>d*p.fraction[0]%p.fraction[1]===0));
 case'two-unknown-equivalences':return pick(row,o=>{const m=o.match(/^a = (\d+), b = (\d+)$/);assert.ok(m);return same([Number(m[1]),p.middleDenominator],p.fraction)&&same([p.lastNumerator,Number(m[2])],p.fraction);});
 case'complement-reduced-numerator':return reduced([p.total-p.selected,p.total])[0];
 case'equivalence-and-sum-choice':return pick(row,o=>{const value=q(o);return value[0]+value[1]===p.sum&&same(value,p.fraction);});
 case'expanded-term-difference':return one(range(1,p.newDenominator).filter(n=>same([n,p.newDenominator],p.fraction)).map(n=>p.newDenominator-n));
 case'equivalent-term-product':return one(divisors(p.product).filter(n=>same([n,p.product/n],p.fraction)).map(n=>p.product/n));
 case'sequence-sum-strict-threshold':return range(1,p.threshold).find(n=>p.numeratorStep*n+p.denominatorStep*n>p.threshold);
 case'gcd-known-reduced-lcm':{
  const a=p.gcd*p.reduced[0],b=p.gcd*p.reduced[1];assert.equal(Math.max(...common(a,b)),p.gcd);return pick(row,o=>Number(o)%a===0&&Number(o)%b===0&&range(1,Number(o)-1).every(n=>n%a!==0||n%b!==0));
 }
 case'odd-even-sums-ratio':{let odd=0,even=0;for(let n=1;n<=2*p.count;n++)n%2?odd+=n:even+=n;return mcq(row,[odd,even]);}
 case'preserve-value-after-numerator-add':return one(range(1,p.fraction[1]*100).filter(added=>same([p.fraction[0]+p.numeratorAdded,p.fraction[1]+added],p.fraction)));
 case'irreducible-offset-variable':return pick(row,o=>coprime(Number(o),Number(o)+p.offset));
 case'linear-numerator-equivalence':return one(range(1,1000).filter(x=>p.coefficient*x-p.subtract>0&&same([p.coefficient*x-p.subtract,p.denominator],p.right)));
 case'irreducible-numerator-domain':return range(1,p.denominator-1).filter(n=>coprime(n,p.denominator)).length;
 case'repeated-two-digit-blocks':return mcq(row,[Number(String(p.topBlock).repeat(p.repetitions)),Number(String(p.bottomBlock).repeat(p.repetitions))]);
 case'correct-reduction-equation':return pick(row,o=>{const ns=fracNodes(o).map(numericFraction);assert.equal(ns.length,2);return same(...ns);});
 case'original-denominator-after-cancel':return p.reduced[1]*p.factor;
 case'two-stage-cancel-original-sum':{let[n,d]=p.reduced;for(const factor of [...p.factors].reverse()){n*=factor;d*=factor;}return n+d;}
 case'different-category-fraction':{
  const correct=one(p.parts.flatMap((q,i)=>p.parts.filter(r=>same(q,r)).length===1?[i]:[]));return pick(row,o=>o===p.names[correct]);
 }
 case'equivalent-denominator-upper-count':return range(1,p.upperExclusive-1).filter(d=>d*p.fraction[0]%p.fraction[1]===0).length;
 case'same-addition-changes-value':{
  const states=[];for(let d=1;d<=1000;d++)for(let n=1;n<d;n++)if(same([n,d],p.before)&&same([n+p.added,d+p.added],p.after))states.push(d);return one(states);
 }
 case'both-terms-digit-bound-count':{
  const lo=10**(p.digits-1),hi=10**p.digits-1,values=[];for(let d=lo;d<=hi;d++){const n=d*p.reduced[0]/p.reduced[1];if(Number.isInteger(n)&&n>=lo&&n<=hi)values.push([n,d]);}return values.length;
 }
 default:throw Error('Missing independent equivalence oracle '+kind(row));
}}
for(const row of rows)test('independent printed/exact/domain oracle '+row.editionId,()=>{
 assert.equal(row.answer,String(oracle(row)));assert.equal(verifyEdition(row).answer,row.answer);
 if(row.options){assert.equal(row.options.length,4);assert.equal(new Set(row.options).size,4);assert.equal(row.options.filter(o=>o===row.answer).length,1);}else{assert.match(row.answer,/^\d+$/);assert.ok(row.statement.endsWith('Жауапқа тек санды жазыңыз.'));}
});
test('all47 saved nonvisual3.2 refs covered once and remain unreviewed Standard drafts',()=>{
 const src=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-2');assert.equal(src.length,47);assert.equal(rows.length,47);assert.deepEqual(new Set(rows.map(r=>r.sourceRefs[0].sourceId)),new Set(src.map(q=>q.sourceId)));
 for(const row of rows){const ref=row.sourceRefs[0],q=one(JSON.parse(fs.readFileSync(ref.sourceFile)).questions.filter(q=>q.id===ref.sourceId));assert.ok(q.checked);assert.notEqual(q.statement,row.statement);assert.equal(row.grade,5);assert.equal(row.topic,kind(row)==='sequence-sum-strict-threshold'?'seq':'frac');assert.equal(row.minimumPlan,'pro');assert.equal(row.editorialStatus,'awaiting_independent_review');assert.ok(!row.image&&!row.figure);}
});
test('params, all printed statements/solutions/choices/keys and source metadata exact-bound',()=>{
 for(const row of rows){for(const field of['statement','solution','answer']){const bad=structuredClone(row);bad[field]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));}for(const field of['grade','topic','difficulty','modelId','minimumPlan']){const bad=structuredClone(row);bad[field]='tamper';assert.throws(()=>verifyEdition(bad));}for(const [key,value]of Object.entries(row.params)){const bad=structuredClone(row);bad.params[key]=typeof value==='number'?value+1:Array.isArray(value)?[...value,19]:'tamper';assert.throws(()=>verifyEdition(bad));}if(row.options){const bad=structuredClone(row);bad.options[0]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));}const bad=structuredClone(row);bad.sourceRefs[0].sourceId='none';assert.throws(()=>verifyEdition(bad));}
});
test('every slash expression is a native fraction node; all powers Unicode, not TeX/caret',()=>{
 let fractions=0;
 const visit=ns=>{for(const n of ns)if(n.type==='text'){assert.ok(!n.value.includes('/'),n.value);assert.ok(!/[\\$^]/.test(n.value));}else if(n.type==='fraction'){fractions++;visit(n.numerator);visit(n.denominator);}else assert.fail('Unexpected math node '+n.type);};
 for(const row of rows)for(const text of[row.statement,row.solution,row.answer,...(row.options||[])])visit(mathFragments(text));assert.ok(fractions>200);
 for(const k of['crossed-prime-powers-denominator','composite-base-power-reduction','geometric-power-sums-ratio'])assert.ok(fracNodes(get(k).statement).length===1);
});
test('cancellation must apply to both terms and to factors, not matching addends',()=>{
 assert.equal(get('invalid-cancellation-factor').answer,'5');assert.equal(70%5,0);assert.notEqual(42%5,0);
 assert.equal(get('irreducible-choice').answer,'(25/36)');assert.ok(divisors(25).length>2&&divisors(36).length>2);assert.ok(coprime(25,36));
 assert.equal(get('whole-sum-fraction').answer,'(2/3)');assert.ok(!same([35+21,35+49],[21,49]));
 assert.equal(get('factored-sum-over-product').answer,'(2/3)');assert.ok(!same([29*56+29*24,40*87],[56+29*24,40*3]));
 assert.equal(get('crossed-prime-powers-denominator').answer,'45');assert.ok(same([2**4*3**2*7,2**3*3**4*5],[14,45]));
 assert.equal(get('composite-base-power-reduction').answer,'(1/20)');assert.ok(same([10**4,2**6*5**5],[1,20]));
 assert.equal(get('geometric-power-sums-ratio').answer,'(1/9)');assert.ok(same([3**12+3**11,3**14+3**13],[1,9]));
});
test('finite domains retain strict boundaries and BOTH digit restrictions',()=>{
 assert.equal(get('least-denominator-strict-bound').answer,'105');assert.equal(90%15,0);assert.ok(90<=90);
 assert.equal(get('sequence-sum-strict-threshold').answer,'51');assert.equal(12*50,600);assert.ok(12*51>600);
 assert.equal(get('equivalent-denominator-upper-count').answer,'13');assert.equal(5*14,70);
 assert.equal(get('irreducible-numerator-domain').answer,'8');assert.deepEqual(range(1,29).filter(n=>coprime(n,30)),[1,7,11,13,17,19,23,29]);assert.ok(!coprime(0,30));
 assert.equal(get('both-terms-digit-bound-count').answer,'97');assert.equal(7*14,98);assert.equal(9*112,1008);assert.equal(111-15+1,97);
});
test('sum versus product and scaling versus same-addition are distinct constraints',()=>{
 const sum=get('equivalence-and-sum-choice');assert.ok(sum.options.every(o=>q(o).reduce((a,b)=>a+b)===55));assert.equal(sum.answer,'(20/35)');
 assert.equal(get('equivalent-term-product').answer,'20');assert.equal(12*20,240);assert.equal(3*5*4**2,240);assert.notEqual(5*16,20);
 assert.equal(get('two-stage-cancel-original-sum').answer,'320');assert.equal((7+9)*4*5,320);assert.notEqual((7+9)*(4+5),320);
 assert.equal(get('preserve-value-after-numerator-add').answer,'21');assert.ok(same([2+6,7+21],[2,7]));assert.ok(!same([2+6,7+6],[2,7]));
 assert.equal(get('same-addition-changes-value').answer,'42');assert.ok(same([30,42],[5,7]));assert.ok(same([30+6,42+6],[3,4]));assert.ok(!same([30,42],[36,48]));
 const chain=get('two-unknown-equivalences');assert.equal(chain.answer,'a = 25, b = 56');assert.ok(same([25,40],[35,56]));
});

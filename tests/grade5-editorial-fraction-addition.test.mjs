import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEditions,verifyEdition} from '../scripts/editorial/grade5-fraction-addition-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
import {mathFragments} from '../frontend/src/mathPresentation.js';
const rows=buildEditions(),prefix='grade5-fraction-addition-',kind=r=>r.modelId.slice(prefix.length),range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i);
const one=xs=>{assert.equal(xs.length,1);return xs[0];},get=k=>one(rows.filter(r=>kind(r)===k)),pick=(r,f)=>one(r.options.filter(f));
// SeparateBigInt exact arithmetic and a bounded numeric native-expression parser.
const G=(a,b)=>b?G(b,a%b):a<0n?-a:a,R=(a,b=1n)=>{a=BigInt(a);b=BigInt(b);assert.notEqual(b,0n);if(b<0n){a=-a;b=-b;}const g=G(a,b);return{n:a/g,d:b/g};},add=(a,b)=>R(a.n*b.d+b.n*a.d,a.d*b.d),sub=(a,b)=>R(a.n*b.d-b.n*a.d,a.d*b.d),mul=(a,b)=>R(a.n*b.n,a.d*b.d),div=(a,b)=>R(a.n*b.d,a.d*b.n),cmp=(a,b)=>a.n*b.d-b.n*a.d,same=(a,b)=>cmp(a,b)===0n,Q=q=>R(...q),total=xs=>xs.reduce(add,R(0)),integer=q=>{assert.equal(q.d,1n);return Number(q.n);};
function parse(s,vars={}){const tokens=s.match(/\d+|[a-z]|[()+−×/]/g)||[];assert.equal(tokens.join(''),s.replace(/\s/g,''),s);let i=0;
 function atom(){const t=tokens[i++];if(t==='('){const x=plus();assert.equal(tokens[i++],')');return x;}if(/^\d+$/.test(t))return R(t);assert.ok(t in vars,t);return R(vars[t]);}
 function times(){let x=atom();while(tokens[i]==='×'||tokens[i]==='/'){const op=tokens[i++],y=atom();x=op==='×'?mul(x,y):div(x,y);}return x;}
 function plus(){let x=times();while(tokens[i]==='+'||tokens[i]==='−'){const op=tokens[i++],y=times();x=op==='+'?add(x,y):sub(x,y);}return x;}const result=plus();assert.equal(i,tokens.length,s);return result;}
function fracKey(r,q){return pick(r,o=>same(parse(o),q));}
function oracle(r){const p=r.params;switch(kind(r)){
 case'same-denominator-difference-numerator':return Number(sub(Q([p.first,p.denominator]),Q([p.second,p.denominator])).n);
 case'mixed-sum-fractional-numerator':{const q=total(p.fractions.map(Q));return Number(q.n%q.d);}
 case'choose-true-fraction-operation':return pick(r,o=>{const[left,right]=o.split(' = ');return same(parse(left),parse(right));});
 case'reduced-difference-denominator':return Number(sub(...p.fractions.map(Q)).d);
 case'reduced-difference-terms-sum':{const q=sub(...p.fractions.map(Q));return Number(q.n+q.d);}
 case'same-denominator-sum':case'same-denominator-sum-reduce':return fracKey(r,add(Q([p.first,p.denominator]),Q([p.second,p.denominator])));
 case'one-minus-proper-fraction':return fracKey(r,sub(R(1),Q(p.fraction)));
 case'remaining-original-equal-pieces':return p.parts-p.first-p.second;
 case'unknown-subtrahend-numerator':return one(range(1,p.denominator-1).filter(x=>same(sub(Q([p.minuend,p.denominator]),Q([x,p.denominator])),Q([p.difference,p.denominator]))));
 case'three-same-denominator-make-one':return integer(total(p.numerators.map(n=>Q([n,p.denominator]))));
 case'unlike-difference-small-unit':return fracKey(r,sub(...p.fractions.map(Q)));
 case'coprime-denominator-sum':case'shared-factor-denominator-sum':case'reduce-both-before-addition':case'two-uses-of-original-paint':return fracKey(r,total(p.fractions.map(Q)));
 case'sum-fixed-denominator-numerator':return integer(mul(total(p.fractions.map(Q)),R(p.denominator)));
 case'two-activities-extra-hours-to-minutes':return integer(mul(add(mul(Q(p.first),R(2)),Q(p.extra)),R(60)));
 case'repair-added-denominators':return fracKey(r,total(p.fractions.map(Q)));
 case'three-operation-unit-denominator':{const q=add(sub(Q(p.fractions[0]),Q(p.fractions[1])),Q(p.fractions[2]));assert.equal(q.n,1n);return Number(q.d);}
 case'parallel-completion-time':return one(range(1,100).filter(t=>same(add(R(t,p.firstHours),R(t,p.secondHours)),R(1))));
 case'unknown-unit-addend-denominator':return one(range(1,100).filter(b=>same(add(Q(p.known),R(1,b)),Q(p.total))));
 case'unknown-minuend-fraction':return pick(r,o=>same(sub(parse(o),Q(p.subtrahend)),Q(p.difference)));
 case'two-packets-extra-mass':return fracKey(r,add(mul(Q(p.first),R(2)),Q(p.extra)));
 case'mass-difference-grams':return integer(mul(sub(Q(p.first),Q(p.second)),R(1000)));
 case'three-project-hours-mixed-total':return fracKey(r,total(p.fractions.map(Q)));
 case'regroup-two-complementary-pairs':{const[d,e]=p.denominators,[n,m]=p.firstNumerators;return integer(total([R(n,d),R(m,e),R(d-n,d),R(e-m,e)]));}
 case'maximum-addition-subtraction-expression':{const vs=r.options.map(o=>parse(o));return pick(r,o=>vs.every(q=>cmp(parse(o),q)>=0n));}
 case'whole-minus-two-original-shares':return fracKey(r,sub(R(1),total(p.fractions.map(Q))));
 case'three-groups-relative-share-and-pieces':{const second=sub(Q(p.first),Q(p.less)),left=sub(R(1),total([Q(p.first),second,Q(p.third)]));return one(range(1,100).filter(n=>same(mul(R(n),Q(p.piece)),left)));}
 case'sequential-workers-unfinished-share':return fracKey(r,sub(R(1),add(R(p.firstWorked,p.firstHours),R(p.secondWorked,p.secondHours))));
 case'unknown-addend-versus-difference':return pick(r,o=>same(add(parse(o),Q(p.known)),sub(...p.right.map(Q))));
 case'two-inlets-one-drain-time':return one(range(1,100).filter(t=>same(sub(add(R(t,p.first),R(t,p.second)),R(t,p.drain)),R(1))));
 case'compare-neighbour-unit-differences':return pick(r,o=>{const m=o.match(/^(.+) ([<>=]) (.+)$/);assert.ok(m);const c=cmp(parse(m[1]),parse(m[3]));return m[2]==='>'?c>0n:m[2]==='<'?c<0n:c===0n;});
 case'known-category-extra-original-share-total':return one(range(1,500).filter(n=>same(mul(add(Q(p.first),Q(p.extra)),R(n)),R(p.knownCount))));
 case'symbolic-common-numerator-sum':return pick(r,o=>range(1,100).every(a=>same(parse(o,{a}),add(R(a,p.denominators[0]),R(a,p.denominators[1])))));
 case'telescoping-unit-difference-chain':return fracKey(r,total(range(p.start,p.end-1).map(n=>sub(R(1,n),R(1,n+1)))));
 case'unknown-common-denominator-factor':return one(range(1,100).filter(x=>same(add(R(1,p.factors[0]*x),R(1,p.factors[1]*x)),Q(p.total))));
 case'least-unit-denominator-strict-sum':return range(1,200).find(n=>cmp(add(total(p.fractions.map(Q)),R(1,n)),R(1))<0n);
 case'consecutive-numerators-sum':return integer(total(range(1,p.lastNumerator).map(n=>R(n,p.denominator))));
 case'opposite-motion-remaining-path-share':return fracKey(r,sub(R(1),add(R(p.elapsed,p.firstHours),R(p.elapsed,p.secondHours))));
 case'choose-sum-exactly-one':return pick(r,o=>same(parse(o),R(1)));
 case'sum-all-irreducible-proper-fixed-denominator':return integer(total(range(1,p.denominator-1).filter(n=>range(2,Math.min(n,p.denominator)).every(k=>n%k!==0||p.denominator%k!==0)).map(n=>R(n,p.denominator))));
 case'whole-litres-minus-two-measures':return fracKey(r,sub(R(p.initialLitres),total(p.uses.map(Q))));
 case'dyadic-sum-unit-deficit':{const deficit=sub(R(1),total(range(1,p.terms).map(k=>R(1,2**k))));return one(range(1,200).filter(n=>same(R(1,n),deficit)));}
 case'fractional-arithmetic-sequence-next':{const[a,b,c]=p.terms.map(Q);assert.ok(same(sub(b,a),sub(c,b)));return fracKey(r,add(c,sub(c,b)));}
 case'river-raft-from-two-whole-route-times':return one(range(1,100).filter(t=>same(sub(R(1,p.downHours),R(1,p.upHours)),R(2,t))));
 case'choose-all-signs-for-target':return pick(r,o=>{const signs=o.split(', ');let q=Q(p.fractions[0]);for(let i=1;i<4;i++)q=signs[i-1]==='+'?add(q,Q(p.fractions[i])):sub(q,Q(p.fractions[i]));return same(q,Q(p.target));});
 case'proper-unknown-numerators-sum':{const[d,e]=p.denominators,valid=[];for(let a=1;a<d;a++)for(let b=1;b<e;b++)if(same(add(R(a,d),R(b,e)),Q(p.total)))valid.push(a+b);return one(valid);}
 default:throw Error('Missing independent author check '+kind(r));
}}
for(const r of rows)test('BigInt exact/backsubstitution/source-role addition '+r.editionId,()=>{assert.equal(r.answer,String(oracle(r)));assert.equal(verifyEdition(r).answer,r.answer);if(r.options)assert.equal(new Set(r.options).size,4);else{assert.match(r.answer,/^\d+$/);assert.ok(r.statement.endsWith('Жауапқа тек санды жазыңыз.'));}});
test('all49saved3.8nonvisual refs covered once, newwording and pendingexternalreview',()=>{const qs=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-8');assert.equal(qs.length,49);assert.equal(rows.length,49);assert.deepEqual(new Set(rows.map(r=>r.sourceRefs[0].sourceId)),new Set(qs.map(q=>q.sourceId)));const norm=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();for(const r of rows){const ref=r.sourceRefs[0],q=one(JSON.parse(fs.readFileSync(ref.sourceFile)).questions.filter(q=>q.id===ref.sourceId));assert.ok(q.checked);assert.notEqual(norm(r.statement),norm(q.statement));assert.equal(r.grade,5);assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'awaiting_independent_review');assert.equal(r.topic,kind(r)==='fractional-arithmetic-sequence-next'?'seq':'frac');}});
test('allprintedtext/solutions/options/keys/givens andprovenance bound',()=>{for(const r of rows){for(const field of['statement','solution','answer']){const b=structuredClone(r);b[field]+=' өзгерді';assert.throws(()=>verifyEdition(b));}for(const field of['grade','topic','difficulty','minimumPlan','modelId']){const b=structuredClone(r);b[field]='INVALID';assert.throws(()=>verifyEdition(b));}for(const[k,v]of Object.entries(r.params)){const b=structuredClone(r);b.params[k]=typeof v==='number'?v+1:[...v,99];assert.throws(()=>verifyEdition(b));}if(r.options){const b=structuredClone(r);b.options[0]+=' өзгерді';assert.throws(()=>verifyEdition(b));}const b=structuredClone(r);b.sourceRefs[0].sourceId='invalid';assert.throws(()=>verifyEdition(b));}});
test('nativecanonical fractions/mixed/symbolicexpressiongroups parsed structurally',()=>{let count=0,mixed=0;const walk=ns=>{for(const n of ns)if(n.type==='text'){assert.ok(!/[0-9A-Za-z□)]\/[0-9A-Za-z□(]/.test(n.value),n.value);assert.ok(!/[\\$^]/.test(n.value));}else if(n.type==='fraction'){count++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else assert.fail(n.type);};for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...(r.options||[])])walk(mathFragments(s));assert.ok(count>500&&mixed>10,{count,mixed});assert.ok(get('unknown-common-denominator-factor').statement.includes('(1/(3 × x))'));assert.equal(get('symbolic-common-numerator-sum').answer,'((3 × a)/8)');});
test('originalwhole shares distinctfrom kilograms/litres/timeunits',()=>{assert.equal(get('remaining-original-equal-pieces').answer,'3');assert.equal(get('two-activities-extra-hours-to-minutes').answer,'100');assert.equal(get('mass-difference-grams').answer,'175');assert.equal(get('two-packets-extra-mass').answer,'(1 + (16/21))');assert.equal(get('whole-litres-minus-two-measures').answer,'(1 + (5/12))');assert.ok(get('two-uses-of-original-paint').statement.includes('БАСТАПҚЫ'));assert.ok(get('known-category-extra-original-share-total').statement.includes('БАРЛЫҚ'));assert.equal(get('three-groups-relative-share-and-pieces').answer,'7');});
test('completepropernumerator/sign domains andstrictunitboundary',()=>{const proper=get('proper-unknown-numerators-sum').params,hits=[];for(let a=1;a<6;a++)for(let b=1;b<8;b++)if(4*a+3*b===38)hits.push([a,b]);assert.deepEqual(hits,[[5,6]]);assert.equal(get('proper-unknown-numerators-sum').answer,'11');assert.deepEqual(proper.denominators,[6,8]);const p=get('choose-all-signs-for-target').params,signs=[];for(let mask=0;mask<8;mask++){const ops=range(0,2).map(i=>mask&(1<<i)?'+':'−');let q=Q(p.fractions[0]);for(let i=1;i<4;i++)q=ops[i-1]==='+'?add(q,Q(p.fractions[i])):sub(q,Q(p.fractions[i]));if(same(q,Q(p.target)))signs.push(ops);}assert.deepEqual(signs,[['+','−','−']]);assert.equal(get('least-unit-denominator-strict-sum').answer,'11');assert.equal(cmp(add(add(R(1,2),R(2,5)),R(1,10)),R(1)),0n);assert.equal(get('sum-all-irreducible-proper-fixed-denominator').answer,'2');assert.deepEqual(range(1,11).filter(n=>G(BigInt(n),12n)===1n),[1,5,7,11]);});
test('work signedrates,riverfactor2,and remaining—notcompleted—roles',()=>{assert.equal(get('parallel-completion-time').answer,'4');assert.equal(get('two-inlets-one-drain-time').answer,'24');assert.equal(get('river-raft-from-two-whole-route-times').answer,'30');assert.equal(get('sequential-workers-unfinished-share').answer,'(12/35)');assert.equal(get('opposite-motion-remaining-path-share').answer,'(3/14)');assert.ok(get('opposite-motion-remaining-path-share').statement.includes('бір мезгілде'));assert.ok(get('sequential-workers-unfinished-share').statement.includes('тоқтады'));assert.equal(cmp(add(R(2,4),R(2,7)),R(1))<0n,true);});
test('fullsimplification, mixedfractionalnumerator and telescoping endpoints preserved',()=>{assert.equal(get('mixed-sum-fractional-numerator').answer,'13');assert.equal(get('reduced-difference-denominator').answer,'3');assert.equal(get('same-denominator-sum-reduce').answer,'(3/5)');assert.equal(get('sum-fixed-denominator-numerator').answer,'7');assert.equal(get('reduced-difference-terms-sum').answer,'22');assert.equal(get('reduce-both-before-addition').answer,'(19/21)');assert.equal(get('telescoping-unit-difference-chain').answer,'(1/4)');assert.equal(get('dyadic-sum-unit-deficit').answer,'32');assert.equal(get('three-operation-unit-denominator').answer,'5');assert.equal(get('fractional-arithmetic-sequence-next').answer,'(19/20)');});
test('deliberatefalseexamples are labelled,and closestexpression exactdifference1/120',()=>{for(const k of['choose-true-fraction-operation','repair-added-denominators']){const r=get(k);assert.equal(r.intentionalIncorrectExample,true);assert.match(r.statement,/әдейі|ӘДЕЙІ/);}const r=get('repair-added-denominators');assert.ok(!same(parse('(4/7) + (1/3)'),parse('(5/10)')));const b=structuredClone(r);delete b.intentionalIncorrectExample;assert.throws(()=>verifyEdition(b));assert.ok(same(sub(parse('(7/8) − (1/10)'),parse('(3/5) + (1/6)')),R(1,120)));});

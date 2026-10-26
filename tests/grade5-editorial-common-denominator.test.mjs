import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEditions,verifyEdition} from '../scripts/editorial/grade5-common-denominator-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
import {mathFragments} from '../frontend/src/mathPresentation.js';
const rows=buildEditions(),prefix='grade5-common-denominator-',kind=r=>r.modelId.slice(prefix.length),range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i);
const one=xs=>{assert.equal(xs.length,1);return xs[0];},get=k=>one(rows.filter(r=>kind(r)===k)),pick=(r,f)=>one(r.options.filter(f));
const original=q=>q.length===3?[q[0]*q[2]+q[1],q[2]]:q,same=([a,b],[c,d])=>a*d===c*b,coprime=(n,d)=>range(2,Math.min(n,d)).every(k=>n%k!==0||d%k!==0);
function parse(s){let m=s.match(/^\((\d+) \+ \((\d+)\/(\d+)\)\)$/);if(m)return{whole:Number(m[1]),n:Number(m[2]),d:Number(m[3]),value:[Number(m[1])*Number(m[3])+Number(m[2]),Number(m[3])]};m=s.match(/^\((\d+)\/(\d+)\)$/);assert.ok(m,s);return{whole:0,n:Number(m[1]),d:Number(m[2]),value:m.slice(1).map(Number)};}
const parseTuple=s=>s.split(/ және |; /).map(parse),denominators=qs=>qs.map(q=>q.at(-1));
function minimum(ds){for(let n=Math.max(...ds);n<=100000;n++)if(ds.every(d=>n%d===0))return n;assert.fail('Minimum bound exhausted');}
function convertedTuple(row,qs,target){return pick(row,o=>{const parts=parseTuple(o);return parts.length===qs.length&&parts.every((x,i)=>x.d===target&&same(x.value,original(qs[i]))&&(qs[i].length!==3||x.whole===qs[i][0]));});}
function oracle(row){const p=row.params;switch(kind(row)){
 case'first-supplement-at-minimum':return minimum(denominators(p.fractions))/p.fractions[0][1];
 case'blank-new-numerator':case'large-decimal-denominator-numerator':return one(range(1,p.target).filter(n=>same([n,p.target],p.fraction)));
 case'any-common-denominator':return pick(row,o=>p.fractions.every(([n,d])=>Number(o)*n%d===0));
 case'supplement-for-given-denominator':return one(range(1,p.target).filter(k=>p.fraction[1]*k===p.target));
 case'fraction-at-fixed-denominator':return convertedTuple(row,[p.fraction],p.target);
 case'minimum-two-denominators':case'nested-denominator-minimum':case'three-denominator-minimum':case'large-common-minimum':case'garden-progress-common-minimum':return minimum(denominators(p.fractions));
 case'mixed-fixed-denominator':return convertedTuple(row,[p.mixed],p.target);
 case'supplement-given-minimum':assert.equal(minimum(denominators(p.fractions)),p.minimum);return p.minimum/p.fractions[0][1];
 case'two-mixed-minimum-conversion':case'hard-two-mixed-minimum':case'three-mixed-hard-minimum':return convertedTuple(row,p.mixed,minimum(denominators(p.mixed)));
 case'blank-new-denominator':return one(range(1,1000).filter(d=>same(p.fraction,[p.newNumerator,d])));
 case'three-unit-fractions-minimum':case'two-fractions-minimum-conversion':case'three-fractions-minimum-conversion':case'three-large-minimum-conversion':return convertedTuple(row,p.fractions,minimum(denominators(p.fractions)));
 case'ordered-supplement-pair':{const d=minimum(denominators(p.fractions));return pick(row,o=>{const ks=o.split(' және ').map(Number);return ks.length===2&&ks.every((k,i)=>k*p.fractions[i][1]===d);});}
 case'blank-original-denominator':return one(range(1,p.newDenominator).filter(d=>same([p.numerator,d],[p.newNumerator,p.newDenominator])));
 case'equivalent-denominator-open-window':{const[n,d]=p.fraction,candidates=[];for(let den=p.lower+1;den<p.upper;den++)for(let a=1;a<den;a++)if(same([a,den],[n,d]))candidates.push(a);return one(candidates);}
 case'new-first-numerator-at-minimum':{const d=minimum(denominators(p.fractions));return one(range(1,d).filter(n=>same([n,d],p.fractions[0])));}
 case'three-fractions-fixed-denominator':return convertedTuple(row,p.fractions,p.target);
 case'first-mixed-fractional-numerator':{const d=minimum(denominators(p.mixed));return one(range(1,d).filter(n=>same([n,d],p.mixed[0].slice(1))));}
 case'choose-false-expansion-equality':return pick(row,o=>{const[l,r]=o.split(' = ').map(parse);return !same(l.value,r.value);});
 case'natural-and-mixed-improper-pair':return convertedTuple(row,[[p.natural,1],original(p.mixed)],p.mixed[2]);
 case'reduce-before-common-denominator':{const ds=p.fractions.map(([n,d])=>minimum([d])/Math.max(...range(1,d).filter(g=>n%g===0&&d%g===0)));return convertedTuple(row,p.fractions,minimum(ds));}
 case'fixed-expanded-term-sum':{const n=one(range(1,p.target).filter(n=>same([n,p.target],p.fraction)));return n+p.target;}
 case'coprime-composite-denominator-pair':return pick(row,o=>{const ds=parseTuple(o).map(q=>q.d);return minimum(ds)===ds[0]*ds[1];});
 case'mixed-expanded-improper-numerator':return one(range(1,1000).filter(n=>same([n,p.target],original(p.mixed))));
 case'common-denominators-strict-window':return range(p.lower+1,p.upper-1).filter(d=>p.fractions.every(([n,b])=>d*n%b===0)).length;
 case'equivalent-fractions-denominator-limit':{let count=0;for(let d=1;d<p.upperExclusive;d++)for(let n=1;n<d;n++)if(same([n,d],p.fraction))count++;return count;}
 case'least-numerator-for-new-denominator':{let answer;for(let n=1;n<=p.oldDenominator;n++)if(n*p.newDenominator%p.oldDenominator===0){answer=n;break;}return pick(row,o=>Number(o)===answer);}
 case'equivalent-fraction-fixed-term-sum':return pick(row,o=>{const x=parse(o);return x.n+x.d===p.sum&&same(x.value,p.fraction);});
 case'recover-ordered-denominators':return pick(row,o=>{const ds=o.split(' және ').map(Number);return ds.length===2&&ds.every((d,i)=>d*p.supplements[i]===p.minimum)&&minimum(ds)===p.minimum;});
 case'count-third-denominator-preserving-minimum':return range(2,p.minimum).filter(n=>minimum([...p.firstDenominators,n])===p.minimum).length;
 case'two-unknown-expansion-term-sum':{const a=one(range(1,p.newDenominator).filter(n=>same([n,p.newDenominator],p.fraction))),b=one(range(1,1000).filter(d=>same([p.newNumerator,d],p.fraction)));return a+b;}
 case'sum-three-supplements':{const d=minimum(denominators(p.fractions));return p.fractions.map(([n,b])=>d/b).reduce((a,b)=>a+b,0);}
 case'product-versus-minimum-factor':{const ds=denominators(p.fractions);return ds[0]*ds[1]/minimum(ds);}
 case'recover-original-numerator-at-minimum':{const d=minimum(p.denominators);return one(range(1,p.denominators[0]).filter(n=>same([n,p.denominators[0]],[p.newNumerator,d])));}
 case'locate-conversion-error-step':{
  const line=row.statement.split('\n'),d=minimum(denominators(p.fractions));assert.equal(Number(line[1].match(/бөлім (\d+)/)[1]),d);
  const factors=[...line[2].matchAll(/(\d+) : (\d+) = (\d+)/g)].map(m=>m.slice(1).map(Number));assert.equal(factors.length,2);for(const[a,b,c]of factors)assert.equal(b*c,a);
  const fractions=[...line[3].matchAll(/\((\d+)\/(\d+)\)/g)].map(m=>m.slice(1).map(Number));assert.equal(fractions.length,4);assert.ok(same(fractions[0],fractions[1]));assert.ok(!same(fractions[2],fractions[3]));return'3-қадамда';
 }
 case'fraction-convertible-to-both-targets':return pick(row,o=>{const[n,d]=parse(o).value;return p.targets.every(t=>n*t%d===0);});
 case'irreducible-increments-recover-factor':{const states=[];for(let k=2;k<=Math.max(p.numeratorGain,p.denominatorGain)+1;k++)if(p.numeratorGain%(k-1)===0&&p.denominatorGain%(k-1)===0){const n=p.numeratorGain/(k-1),d=p.denominatorGain/(k-1);if(coprime(n,d))states.push(k);}return one(states);}
 case'all-unit-denominators-minimum':return pick(row,o=>Number(o)===minimum(range(p.from,p.to)));
 case'infer-nonminimal-common-denominator':{const[n,d]=p.fractions[0],target=d*p.newFirstNumerator/n;assert.ok(target>minimum(denominators(p.fractions)));return convertedTuple(row,[p.fractions[1]],target);}
 default:throw Error('Missing author-check common-denominator oracle '+kind(row));
}}
for(const row of rows)test('separate exact/common-denominator domain author check '+row.editionId,()=>{
 assert.equal(row.answer,String(oracle(row)));assert.equal(verifyEdition(row).answer,row.answer);
 if(row.options){assert.equal(row.options.length,4);assert.equal(new Set(row.options).size,4);assert.equal(row.options.filter(o=>o===row.answer).length,1);}else{assert.match(row.answer,/^\d+$/);assert.ok(row.statement.endsWith('Жауапқа тек санды жазыңыз.'));}
});
test('all48 saved nonvisual3.6 refs once, unchanged class/source archive, new wording and review pending',()=>{
 const qs=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-6');assert.equal(qs.length,48);assert.equal(rows.length,48);assert.deepEqual(new Set(rows.map(r=>r.sourceRefs[0].sourceId)),new Set(qs.map(q=>q.sourceId)));
 const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
 for(const r of rows){const ref=r.sourceRefs[0],q=one(JSON.parse(fs.readFileSync(ref.sourceFile)).questions.filter(q=>q.id===ref.sourceId));assert.ok(q.checked);assert.notEqual(norm(q.statement),norm(r.statement));assert.equal(r.grade,5);assert.equal(r.topic,'frac');assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'awaiting_independent_review');}
});
test('printed fields, fixed givens, fullsolution/choices/answer and metadata exact bound',()=>{
 for(const r of rows){for(const f of['statement','solution','answer']){const b=structuredClone(r);b[f]+=' өзгеріс';assert.throws(()=>verifyEdition(b));}for(const f of['grade','topic','difficulty','minimumPlan','modelId']){const b=structuredClone(r);b[f]='tamper';assert.throws(()=>verifyEdition(b));}for(const[k,v]of Object.entries(r.params)){const b=structuredClone(r);b.params[k]=typeof v==='number'?v+1:[...v,99];assert.throws(()=>verifyEdition(b));}if(r.options){const b=structuredClone(r);b.options[0]+=' өзгеріс';assert.throws(()=>verifyEdition(b));}const b=structuredClone(r);b.sourceRefs[0].sourceId='bad';assert.throws(()=>verifyEdition(b));}
 for(const k of['choose-false-expansion-equality','locate-conversion-error-step']){const b=structuredClone(get(k));delete b.intentionalIncorrectExample;assert.throws(()=>verifyEdition(b));}
});
test('native canonical fractions/mixed/unknowns/Unicodeprimepowers throughout',()=>{
 let fractions=0,mixed=0;const walk=nodes=>{for(const n of nodes)if(n.type==='text'){assert.ok(!/[0-9A-Za-z□)]\/[0-9A-Za-z□(]/u.test(n.value),n.value);assert.ok(!/[\\$^]/.test(n.value));}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else assert.fail(n.type);};
 for(const r of rows)for(const t of[r.statement,r.solution,r.answer,...(r.options||[])])walk(mathFragments(t));assert.ok(fractions>300&&mixed>40,{fractions,mixed});assert.ok(get('blank-new-numerator').statement.includes('(□/65)'));assert.ok(get('blank-new-denominator').statement.includes('(35/□)'));assert.ok(get('count-third-denominator-preserving-minimum').statement.includes('(1/n)'));
});
test('same numericalvalue does not satisfy wrong required denominator or tuplepositions',()=>{
 const r=get('two-fractions-minimum-conversion');assert.equal(r.answer,'(28/60) және (33/60)');assert.ok(same(parseTuple(r.options[0])[0].value,[7,15]));assert.ok(same(parseTuple(r.options[0])[1].value,[11,20]));assert.equal(parseTuple(r.options[0])[0].d,300);assert.notEqual(r.options[0],r.answer);
 assert.equal(get('any-common-denominator').answer,'72');assert.equal(minimum([8,12]),24);assert.notEqual(72,24);
 assert.equal(get('ordered-supplement-pair').answer,'5 және 3');assert.equal(get('recover-ordered-denominators').answer,'9 және 8');assert.notEqual('5 және 3','3 және 5');
 const m=get('three-mixed-hard-minimum');assert.equal(m.answer,'(3 + (84/240)); (4 + (88/240)); (2 + (45/240))');const half=parseTuple(m.options[1]);assert.ok(same(half[0].value,original(m.params.mixed[0])));assert.ok(same(half[1].value,original(m.params.mixed[1])));assert.ok(!same(half[2].value,original(m.params.mixed[2])));assert.equal(120%16,8);
});
test('strict denominator windows, include original/exclude exact upperendpoint, complete finite domains',()=>{
 assert.equal(get('common-denominators-strict-window').answer,'3');assert.deepEqual(range(141,419).filter(n=>n%10===0&&n%14===0),[210,280,350]);assert.equal(140%70,0);assert.equal(420%70,0);
 assert.equal(get('equivalent-fractions-denominator-limit').answer,'6');assert.deepEqual(range(1,125).filter(n=>n%18===0),[18,36,54,72,90,108]);assert.equal(126%18,0);
 assert.equal(get('equivalent-denominator-open-window').answer,'35');assert.deepEqual(range(71,79).filter(d=>d%11===0),[77]);
 assert.equal(get('count-third-denominator-preserving-minimum').answer,'8');assert.deepEqual(range(2,36).filter(n=>36%n===0),[2,3,4,6,9,12,18,36]);
});
test('reduction-before-LCM, compositecoprime and inversegain use all conditions',()=>{
 assert.equal(get('reduce-before-common-denominator').answer,'(4/7) және (5/7)');assert.equal(minimum([42,35]),210);assert.equal(minimum([7,7]),7);
 assert.equal(get('least-numerator-for-new-denominator').answer,'3');assert.deepEqual(range(1,24).filter(n=>n*40%24===0),[3,6,9,12,15,18,21,24]);assert.equal(40%24,16);
 assert.equal(get('coprime-composite-denominator-pair').answer,'(1/14) және (4/15)');assert.equal(14%2,0);assert.equal(15%3,0);assert.ok(coprime(14,15));assert.equal(minimum([14,15]),14*15);
 assert.equal(get('irreducible-increments-recover-factor').answer,'5');assert.deepEqual(range(1,28).filter(g=>28%g===0&&44%g===0),[1,2,4]);assert.ok(!coprime(28,44));assert.ok(!coprime(14,22));assert.ok(coprime(7,11));assert.equal(7*5-7,28);assert.equal(11*5-11,44);
});
test('wholeparts preserved, impropernumerator includeswhole; fixedlarge denominator and termroles',()=>{
 assert.equal(get('mixed-fixed-denominator').answer,'(5 + (12/28))');assert.equal(get('first-mixed-fractional-numerator').answer,'42');assert.equal(7*6,42);
 assert.equal(get('natural-and-mixed-improper-pair').answer,'(72/9) және (31/9)');assert.equal(3*9+4,31);assert.notEqual(3*4+9,31);
 assert.equal(get('mixed-expanded-improper-numerator').answer,'145');assert.equal((3*8+5)*5,145);assert.equal(3*40+25,145);assert.notEqual(25,145);
 assert.equal(get('large-decimal-denominator-numerator').answer,'4375');assert.equal(10000/16,625);assert.equal(7*625,4375);assert.ok(same([4375,10000],[7,16]));
 assert.equal(get('first-supplement-at-minimum').answer,'7');assert.equal(get('new-first-numerator-at-minimum').answer,'55');assert.equal(get('two-unknown-expansion-term-sum').answer,'134');assert.equal(35+99,134);
});
test('nonminimal given conversion and intentional firsterror differ from equality-only checks',()=>{
 const r=get('infer-nonminimal-common-denominator');assert.equal(r.answer,'(99/180)');assert.equal(84/7,12);assert.equal(15*12,180);assert.equal(minimum([15,20]),60);assert.equal(11*(180/20),99);
 assert.equal(get('choose-false-expansion-equality').answer,'(5/9) = (15/36)');assert.ok(!same([5,9],[15,36]));assert.ok(same([5,9],[20,36]));assert.equal(get('locate-conversion-error-step').answer,'3-қадамда');assert.equal(7*(126/18),49);assert.notEqual(49,63);
 assert.equal(get('equivalent-fraction-fixed-term-sum').answer,'(36/63)');assert.ok(get('equivalent-fraction-fixed-term-sum').params.choices.every(([n,d])=>n+d===99));
 assert.equal(get('sum-three-supplements').answer,'47');assert.equal(20+15+12,47);assert.equal(get('product-versus-minimum-factor').answer,'6');assert.equal(18*24/minimum([18,24]),6);
 const all=get('all-unit-denominators-minimum');assert.equal(all.answer,'27720');for(const d of range(2,12))assert.equal(27720%d,0);assert.notEqual(13860%8,0);for(const smaller of range(1,27719))assert.ok(range(2,12).some(d=>smaller%d!==0));
});

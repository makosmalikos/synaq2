import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEditions,verifyEdition} from '../scripts/editorial/grade5-mixed-numbers-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
import {mathFragments} from '../frontend/src/mathPresentation.js';
const rows=buildEditions(),prefix='grade5-mixed-numbers-',kind=r=>r.modelId.slice(prefix.length),range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i);
const one=xs=>{assert.equal(xs.length,1);return xs[0];},get=k=>one(rows.filter(r=>kind(r)===k)),pick=(r,f)=>one(r.options.filter(f));
const same=([a,b],[c,d])=>b>0&&d>0&&a*d===c*b,divisors=n=>range(1,n).filter(d=>n%d===0),coprime=(a,b)=>divisors(a).filter(d=>b%d===0).length===1;
function parts(text){const s=text.replace(/ (?:км\/сағ|сағ|см|м|л)$/u,'');const m=s.match(/^\((\d+) \+ \((\d+)\/(\d+)\)\)$/);if(m)return m.slice(1).map(Number);if(/^\d+$/.test(s))return[Number(s),0,1];const f=s.match(/^\((\d+)\/(\d+)\)$/);assert.ok(f,text);return[0,Number(f[1]),Number(f[2])];}
const val=text=>{const[w,n,d]=parts(text);return[w*d+n,d];};
const numericMCQ=(r,target)=>pick(r,o=>same(val(o),target));
const words={'бір':1,'екі':2,'үш':3,'төрт':4,'бес':5,'алты':6,'жеті':7,'сегіз':8,'тоғыз':9,'он':10,'он бір':11,'он екі':12,'он үш':13};
const cases={'бірден':1,'екіден':2,'үштен':3,'төрттен':4,'бестен':5,'алтыдан':6,'жетіден':7,'сегізден':8,'тоғыздан':9,'оннан':10,'он бірден':11,'он екіден':12,'он үштен':13};
function spoken(text){const m=text.match(/^(.+?) бүтін (.+)$/);if(!m)return null;const w=words[m[1]];assert.ok(w,text);const ending=Object.keys(cases).sort((a,b)=>b.length-a.length).find(c=>m[2].startsWith(c+' '));assert.ok(ending,text);const n=words[m[2].slice(ending.length+1)];assert.ok(n,text);return[w,n,cases[ending]];}
function oracle(row){const p=row.params;switch(kind(row)){
 case'greatest-converted-numerator':return Math.max(...range(1,p.denominator-1).map(r=>p.whole*p.denominator+r));
 case'count-unit-shares':case'unit-mass-package-count':return one(range(1,1000).filter(n=>same([n,p.denominator],[p.whole*p.denominator+p.numerator,p.denominator])));
 case'spoken-to-mixed':return pick(row,o=>{const [w,n,d]=parts(o);return w===p.whole&&n===p.numerator&&d===p.denominator;});
 case'ask-mixed-whole':return range(0,p.numerator).find(w=>w*p.denominator<=p.numerator&&p.numerator<(w+1)*p.denominator);
 case'mixed-to-improper-choice':return numericMCQ(row,[p.whole*p.denominator+p.numerator,p.denominator]);
 case'improper-to-mixed-choice':case'reduce-improper-to-mixed':return numericMCQ(row,[p.numerator,p.denominator]);
 case'recognize-canonical-mixed':return pick(row,o=>{const[w,n,d]=parts(o);return w>0&&n>0&&n<d;});
 case'motion-mixed-whole':return range(0,p.meters).find(w=>w*p.seconds<=p.meters&&p.meters<(w+1)*p.seconds);
 case'mixed-to-numerator':return p.whole*p.denominator+p.numerator;
 case'integer-fraction-numerator':return one(range(1,p.whole*p.denominator).filter(n=>n===p.whole*p.denominator));
 case'division-as-mixed-equality':return pick(row,o=>{const [left,right]=o.split(' = ');assert.ok(right);return same(val(left),val(right))&&same(val(left),[p.numerator,p.denominator]);});
 case'ask-fractional-remainder':return p.numerator%p.denominator;
 case'mixed-component-description':return pick(row,o=>{const m=o.match(/^Бүтін бөлігі (\d+), бөлшек бөлігі (.+)$/);assert.ok(m);return Number(m[1])===p.whole&&same(val(m[2]),[p.numerator,p.denominator]);});
 case'hours-minutes-as-mixed':return numericMCQ(row,[p.hours*60+p.minutes,60]);
 case'digit-sum-fractional-numerator':{let x=p.whole,n=0;while(x){n+=x%10;x=Math.floor(x/10);}return numericMCQ(row,[p.whole*p.denominator+n,p.denominator]);}
 case'expand-mixed-fractional-part':return pick(row,o=>{const[w,n,d]=parts(o);return w===p.whole&&d===p.newDenominator&&same([n,d],[p.numerator,p.denominator]);});
 case'blank-mixed-numerator':case'inverse-fractional-numerator':return one(range(1,p.denominator-1).filter(n=>p.whole*p.denominator+n===p.improperNumerator));
 case'square-side-mixed':return numericMCQ(row,[p.perimeter,4]);
 case'noninteger-quotient-count':return range(1,p.denominator*(p.whole+1)).filter(n=>p.whole*p.denominator<n&&n<(p.whole+1)*p.denominator).length;
 case'metres-centimetres-as-mixed':return numericMCQ(row,[100*p.meters+p.centimeters,100]);
 case'mixed-hours-to-minutes':return one(range(1,1000).filter(m=>m*p.denominator===60*(p.whole*p.denominator+p.numerator)));
 case'boat-mixed-rate':return numericMCQ(row,[p.kilometers,p.hours]);
 case'normalize-improper-fractional-part':return range(0,p.whole+p.numerator).find(w=>w*p.denominator<=p.whole*p.denominator+p.numerator&&(w+1)*p.denominator>p.whole*p.denominator+p.numerator);
 case'recover-dividend-from-mixed':return one(range(1,1000).filter(n=>n===p.whole*p.divisor+p.numerator));
 case'count-symbolic-mixed-products':{
  let count=0;for(let a=1;a<=p.improperNumerator;a++)for(let b=1;b<=p.improperNumerator;b++)if(a*b+p.fractionalNumerator===p.improperNumerator&&p.fractionalNumerator<b)count++;return count;
 }
 case'three-distinct-digit-mixed-count':{
  const triples=[];for(const w of p.digits)for(const n of p.digits)for(const d of p.digits)if(new Set([w,n,d]).size===3&&0<n&&n<d)triples.push([w*d+n,d]);
  for(let i=0;i<triples.length;i++)for(let j=i+1;j<triples.length;j++)assert.ok(!same(triples[i],triples[j]));return triples.length;
 }
 case'irreducible-remainder-dividend-list':{
  const values=range(1,p.denominator*(p.whole+1)).filter(n=>Math.floor(n/p.denominator)===p.whole&&n%p.denominator>0&&coprime(n%p.denominator,p.denominator));return pick(row,o=>o===values.join(', '));
 }
 case'large-near-multiple-mixed':return numericMCQ(row,[p.numerator,p.denominator]);
 case'incorrect-conversion-numerator-gap':return (p.whole*p.denominator+p.numerator)-(p.whole*p.numerator+p.denominator);
 case'recover-then-new-divisor':return numericMCQ(row,[p.whole*p.firstDivisor+p.remainder,p.secondDivisor]);
 case'irreducible-mixed-fixed-sum':{
  const states=[];for(let n=1;n<p.sum;n++)for(let d=1;d<p.sum;d++)if(n+d===p.sum&&coprime(n,d)&&p.whole*d<n&&n<(p.whole+1)*d)states.push([n,d]);return numericMCQ(row,one(states));
 }
 case'equal-whole-remainder-largest-numerator':return Math.max(...range(1,p.denominator**2).filter(n=>Math.floor(n/p.denominator)===n%p.denominator&&n%p.denominator>0));
 case'false-mixed-equality':return pick(row,o=>{const[left,right]=o.split(' = ');return !same(val(left),val(right));});
 case'mixed-duration-arrival-clock':{
  const start=p.startHour*60+p.startMinute,duration=60*p.whole+60*p.numerator/p.denominator;assert.ok(Number.isInteger(duration));const choices=row.options.filter(o=>{const[h,m]=o.split(':').map(Number);return (h*60+m-start+1440)%1440===duration;});return one(choices);
 }
 case'consecutive-mixed-components':return one(range(1,p.improperNumerator).filter(w=>w*(w+2)+w+1===p.improperNumerator));
 case'mixed-to-spoken':return pick(row,o=>{const q=spoken(o);return q&&q[0]===p.whole&&q[1]===p.numerator&&q[2]===p.denominator;});
 case'count-fixed-whole-denominator':return range(0,p.denominator).filter(r=>r>0&&r<p.denominator).length;
 case'specific-fractional-part-choice':return pick(row,o=>{const[w,n,d]=parts(o);assert.equal(w,0);return same([n%d,d],p.fraction);});
 case'reduce-part-then-convert':return pick(row,o=>{const[w,n,d]=parts(o);return w===0&&coprime(n,d)&&same([n,d],[p.whole*p.denominator+p.numerator,p.denominator]);});
 case'invariant-numerator-remainder-gap':{
  const values=range(1,p.denominator-1).map(b=>p.whole*p.denominator+b-b);return one([...new Set(values)]);
 }
 case'select-given-improper-numerator':return pick(row,o=>{const[w,n,d]=parts(o);return w*d+n===p.target;});
 case'largest-remainder-with-divisibility':return Math.max(...range(1,p.denominator-1).filter(r=>(p.whole*p.denominator+r)%p.divisor===0));
 case'sum-denominators-fixed-whole':return range(1,p.numerator).filter(d=>p.whole*d<p.numerator&&p.numerator<(p.whole+1)*d).reduce((s,d)=>s+d,0);
 case'mixed-sequence-converted-numerator':{
  const terms=[];for(let n=1;n<=p.index;n++)terms.push([p.wholeCoefficient*n,p.numeratorCoefficient*n,n+p.denominatorOffset]);const[w,n,d]=terms.at(-1);return w*d+n;
 }
 case'symbolic-euclidean-mixed':{
  for(let n=1;n<=200;n++){const numerator=p.denominator*n+p.remainder;assert.equal(Math.floor(numerator/p.denominator),n);assert.equal(numerator%p.denominator,p.remainder);}return pick(row,o=>o===`Бүтін бөлігі n, бөлшек бөлігі (${p.remainder}/${p.denominator})`);
 }
 default:throw Error('Missing independent mixed-number oracle '+kind(row));
}}
for(const row of rows)test('independent exact mixed-number/domain oracle '+row.editionId,()=>{
 assert.equal(row.answer,String(oracle(row)));assert.equal(verifyEdition(row).answer,row.answer);
 if(row.options){assert.equal(row.options.length,4);assert.equal(new Set(row.options).size,4);assert.equal(row.options.filter(o=>o===row.answer).length,1);}else{assert.match(row.answer,/^\d+$/);assert.ok(row.statement.endsWith('Жауапқа тек санды жазыңыз.'));}
});
test('all48 saved nonvisual3.4 sources covered exactly once, own new wording, pending independent review',()=>{
 const sources=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-4');assert.equal(rows.length,48);assert.equal(sources.length,48);assert.deepEqual(new Set(rows.map(r=>r.sourceRefs[0].sourceId)),new Set(sources.map(q=>q.sourceId)));
 const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
 for(const row of rows){const ref=row.sourceRefs[0],q=one(JSON.parse(fs.readFileSync(ref.sourceFile)).questions.filter(q=>q.id===ref.sourceId));assert.ok(q.checked);assert.notEqual(norm(q.statement),norm(row.statement));assert.equal(row.grade,5);assert.equal(row.minimumPlan,'pro');assert.equal(row.editorialStatus,'awaiting_independent_review');assert.ok(!row.figure&&!row.image);assert.equal(row.topic,kind(row)==='mixed-sequence-converted-numerator'?'seq':kind(row)==='square-side-mixed'?'geo':'frac');}
});
test('every fixed parameter and complete new statement/solution/MCQ/answer/source metadata bound',()=>{
 for(const row of rows){for(const field of['statement','solution','answer']){const bad=structuredClone(row);bad[field]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));}for(const field of['grade','topic','difficulty','modelId','minimumPlan']){const bad=structuredClone(row);bad[field]='tamper';assert.throws(()=>verifyEdition(bad));}for(const[key,v]of Object.entries(row.params)){const bad=structuredClone(row);bad.params[key]=typeof v==='number'?v+1:Array.isArray(v)?[...v,99]:'tamper';assert.throws(()=>verifyEdition(bad));}if(row.options){const bad=structuredClone(row);bad.options[0]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));}const bad=structuredClone(row);bad.sourceRefs[0].sourceId='invalid';assert.throws(()=>verifyEdition(bad));}
 for(const kind of['normalize-improper-fractional-part','incorrect-conversion-numerator-gap','false-mixed-equality']){const bad=structuredClone(get(kind));delete bad.intentionalIncorrectExample;assert.throws(()=>verifyEdition(bad));}
});
test('native fractions and numeric mixed groups, including denominator grouping and symbolic blank',()=>{
 let fractions=0,mixed=0;const walk=ns=>{for(const node of ns)if(node.type==='text'){assert.ok(!/[0-9A-Za-z□)]\/[0-9A-Za-z□(]/u.test(node.value),node.value);assert.ok(!/[\\$^]/.test(node.value));}else if(node.type==='fraction'){fractions++;walk(node.numerator);walk(node.denominator);}else if(node.type==='mixed'){mixed++;walk([node.fraction]);}else assert.fail(node.type);};
 for(const row of rows)for(const text of[row.statement,row.solution,row.answer,...(row.options||[])])walk(mathFragments(text));assert.ok(fractions>250&&mixed>70);
 assert.equal(mathFragments(get('count-unit-shares').statement)[0].type,'mixed');assert.ok(get('blank-mixed-numerator').statement.includes('(□/13)'));
});
test('mixed fractionalpart strictly between0 and1; integer and equal-denominator endpoints excluded',()=>{
 assert.equal(get('greatest-converted-numerator').answer,'44');assert.equal(4*9+8,44);assert.notEqual(4*9+9,44);
 assert.equal(get('noninteger-quotient-count').answer,'8');assert.deepEqual(range(1,63).filter(n=>n>54&&n<63),range(55,62));assert.equal(54/9,6);assert.equal(63/9,7);
 assert.equal(get('count-fixed-whole-denominator').answer,'6');assert.equal(get('equal-whole-remainder-largest-numerator').answer,'120');assert.equal(Math.floor(120/11),120%11);assert.equal(121%11,0);
 assert.equal(get('ask-fractional-remainder').answer,'7');assert.equal(Math.floor(67/12),5);assert.notEqual(67%12,Math.floor(67/12));
 assert.equal(get('normalize-improper-fractional-part').answer,'8');assert.ok(same([5*6+19,6],[8*6+1,6]));
});
test('irreducibility is separate from primality, full digit/factorpair domains preserved',()=>{
 assert.equal(get('count-symbolic-mixed-products').answer,'4');assert.deepEqual(divisors(45).filter(b=>b>4),[5,9,15,45]);
 assert.equal(get('three-distinct-digit-mixed-count').answer,'12');
 const r=get('irreducible-remainder-dividend-list');assert.equal(r.answer,'55, 59, 61, 65, 67, 71');assert.equal(65%5,0);assert.ok(coprime(65%18,18));assert.equal(57%18,3);assert.ok(!coprime(3,18));
 assert.equal(get('irreducible-mixed-fixed-sum').answer,'(5 + (2/11))');assert.equal(57+11,68);assert.equal(58+10,68);assert.ok(!coprime(58,10));assert.ok(coprime(57,11));assert.equal(57%3,0);
 assert.equal(get('largest-remainder-with-divisibility').answer,'7');assert.deepEqual(range(1,10).filter(r=>(88+r)%5===0),[2,7]);assert.notEqual((88+10)%5,0);
 assert.equal(get('sum-denominators-fixed-whole').answer,'31');assert.deepEqual(range(1,130).filter(d=>8*d<130&&130<9*d),[15,16]);
});
test('whole/remainder/denominator roles, intentional wrong formula and retained-denominator numerator distinguish errors',()=>{
 assert.equal(get('incorrect-conversion-numerator-gap').answer,'25');assert.equal(6*9+4,58);assert.equal(6*4+9,33);assert.equal(58-33,25);
 assert.equal(get('select-given-improper-numerator').answer,'(4 + (3/5))');assert.equal(3*4+11,23);assert.equal(4*5+3,23);assert.notEqual(3*11+4,23);assert.equal(2+9+12,23);assert.notEqual(2*12+9,23);
 assert.equal(get('invariant-numerator-remainder-gap').answer,'77');assert.ok(range(1,10).every(b=>(77+b)-b===77));
 assert.equal(get('reduce-part-then-convert').answer,'(43/5)');assert.ok(same([8*35+21,35],[43,5]));
 assert.equal(get('recover-then-new-divisor').answer,'(8 + (2/7))');assert.equal(6*9+4,8*7+2);
});
test('fixed SI units, clockcarry, large quotientdigits and explicit sequence rule retained',()=>{
 assert.equal(get('hours-minutes-as-mixed').answer,'(3 + (3/4)) сағ');assert.equal(get('mixed-hours-to-minutes').answer,'170');
 assert.equal(get('metres-centimetres-as-mixed').answer,'(3 + (13/20)) м');assert.ok(same([65,100],[13,20]));
 assert.equal(get('boat-mixed-rate').answer,'(28 + (1/2)) км/сағ');assert.ok(same([171,6],[57,2]));
 assert.equal(get('square-side-mixed').answer,'(15 + (1/2)) см');assert.equal((15+.5)*4,62);
 assert.equal(get('mixed-duration-arrival-clock').answer,'18:25');assert.equal(13*60+35+4*60+50,18*60+25);
 assert.equal(get('large-near-multiple-mixed').answer,'(222222 + (7/9))');assert.equal(222222*9+7,2000005);
 assert.equal(get('mixed-sequence-converted-numerator').answer,'133');assert.equal(14*9+7,133);assert.ok(get('mixed-sequence-converted-numerator').statement.includes('ережемен'));
});

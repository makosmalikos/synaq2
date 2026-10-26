import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEditions,verifyEdition} from '../scripts/editorial/grade5-fraction-intro-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
const rows=buildEditions(),prefix='grade5-fraction-intro-',kind=r=>r.modelId.slice(prefix.length);
const range=(a,b)=>Array.from({length:Math.max(0,b-a+1)},(_,i)=>a+i),one=xs=>{assert.equal(xs.length,1);return xs[0];};
const get=k=>one(rows.filter(r=>kind(r)===k)),pick=(row,fn)=>one(row.options.filter(fn));
const q=o=>{const m=o.match(/^(?:(\d+)|\((\d+)\/(\d+)\))(?: м| кг)?$/);assert.ok(m,`Not a canonical fraction/integer: ${o}`);return m[1]!==undefined?[Number(m[1]),1]:[Number(m[2]),Number(m[3])];};
const equal=([a,b],[c,d])=>b>0&&d>0&&a*d===c*b;
const fractionMCQ=(row,target)=>pick(row,o=>equal(q(o),target));
const knownPart=(whole,[n,d])=>{const result=one(range(0,whole).filter(x=>x*d===whole*n));return result;};
const names={'бір':1,'екі':2,'үш':3,'төрт':4,'бес':5,'алты':6,'жеті':7,'сегіз':8,'тоғыз':9,'он':10,'он бір':11,'он екі':12,'он үш':13,'он алты':16,'он жеті':17,'он тоғыз':19};
const cases={'бірден':1,'екіден':2,'үштен':3,'төрттен':4,'бестен':5,'алтыдан':6,'жетіден':7,'сегізден':8,'тоғыздан':9,'оннан':10,'он бірден':11,'он екіден':12,'он үштен':13,'он алтыдан':16,'он жетіден':17,'он тоғыздан':19};
function read(o){const ending=Object.keys(cases).sort((a,b)=>b.length-a.length).find(w=>o.startsWith(w+' '));assert.ok(ending);const numerator=o.slice(ending.length+1);assert.ok(names[numerator]);return[names[numerator],cases[ending]];}
const isPrime=n=>n>1&&range(1,n).filter(d=>n%d===0).length===2;
function oracle(row){const p=row.params;switch(kind(row)){
 case'spoken-fraction-to-symbol':return fractionMCQ(row,[p.numerator,p.denominator]);
 case'zero-numerator-value':return fractionMCQ(row,[0,1]);
 case'division-ask-numerator':return p.dividend;
 case'unit-fraction-of-number':return knownPart(p.whole,[1,p.denominator]);
 case'catalogue-fraction-count':case'nonunit-fraction-of-number':case'seedling-fraction-count':return knownPart(p.whole,p.fraction);
 case'denominator-definition':return pick(row,o=>o==='Бүтіннің неше тең бөлікке бөлінгенін');
 case'symbol-fraction-to-spoken':return pick(row,o=>{if(o.includes('бүтін'))return false;return equal(read(o),[p.numerator,p.denominator]);});
 case'ask-given-denominator':return p.denominator;
 case'fraction-to-division':return pick(row,o=>{const m=o.match(/^(\d+) : (\d+)$/);return m&&equal([Number(m[1]),Number(m[2])],[p.numerator,p.denominator]);});
 case'whole-from-unit-part':return one(range(1,p.part*p.denominator).filter(w=>w===p.part*p.denominator));
 case'missing-numerator-natural-value':return one(range(1,p.whole*p.denominator).filter(n=>n===p.whole*p.denominator));
 case'missing-category-share':return fractionMCQ(row,[p.total-p.first-p.second,p.total]);
 case'untravelled-route-share':return fractionMCQ(row,[p.whole-p.travelled,p.whole]);
 case'spoken-fraction-from-offset':return pick(row,o=>equal(read(o),[p.numerator,p.numerator+p.extra]));
 case'compare-shares-different-wholes':{
  const a=knownPart(p.firstWhole,p.firstFraction),b=knownPart(p.secondWhole,p.secondFraction);assert.ok(a<b);
  return pick(row,o=>o.startsWith(`${p.secondWhole} санының (${p.secondFraction.join('/')}) бөлігі`));
 }
 case'two-original-whole-sales-remainder':return p.whole-knownPart(p.whole,p.first)-knownPart(p.whole,p.second);
 case'hour-fraction-to-minutes':return knownPart(60,p.fraction);
 case'unread-pages-count':return p.pages-knownPart(p.pages,p.fraction);
 case'daily-share-time-difference':return knownPart(24,p.first)-knownPart(24,p.second);
 case'whole-from-nonunit-count':return one(range(1,p.part*p.fraction[1]).filter(w=>w*p.fraction[0]===p.part*p.fraction[1]));
 case'unspent-share':return fractionMCQ(row,[p.spent[1]-p.spent[0],p.spent[1]]);
 case'centimetres-share-of-metre':return fractionMCQ(row,[p.cm,100]);
 case'equal-rope-piece-length':return fractionMCQ(row,[p.metres,p.pieces]);
 case'fraction-sequence-index':{
  let n=p.firstNumerator,d=p.firstDenominator;for(let i=1;i<p.index;i++){n+=p.numeratorStep;d+=p.denominatorStep;}return fractionMCQ(row,[n,d]);
 }
 case'denominator-from-sum-ratio':return one(range(1,p.sum-1).filter(d=>d===p.ratio*(p.sum-d)));
 case'elapsed-day-fraction':{
  const minute=one(range(0,1439).filter(t=>t*p.remainingMultiple===1440-t));return pick(row,o=>{const[h,m]=o.split(':').map(Number);return h*60+m===minute;});
 }
 case'whole-route-from-share-gap':return one(range(1,p.gap*p.travelled[1]).filter(w=>w*p.travelled[0]%p.travelled[1]===0&&w-2*w*p.travelled[0]/p.travelled[1]===p.gap));
 case'sequential-budget-inverse':{
  const[n1,d1]=p.first,[n2,d2]=p.second;return one(range(1,p.left*d1*d2).filter(w=>w*n1%d1===0&&(w-w*n1/d1)*n2%d2===0&&(w-w*n1/d1)*(d2-n2)===p.left*d2));
 }
 case'third-successive-share-count':{
  let left=p.initial,last;for(let child=0;child<p.children;child++){last=one(range(0,left).filter(x=>x*p.fraction[1]===left*p.fraction[0]));left-=last;}return last;
 }
 case'natural-quotient-numerator-count':return range(1,p.upper-1).filter(n=>n%p.denominator===0).length;
 case'greatest-time-share':{
  const values=p.choices.map(c=>knownPart(c.whole,c.fraction)),max=Math.max(...values);return row.options[one(values.flatMap((v,i)=>v===max?[i]:[]))];
 }
 case'equal-shares-two-collections':{
  const[n,d]=p.knownFraction,[n2,d2]=p.unknownFraction;return one(range(1,p.known*d2).filter(w=>w*n2*d===p.known*n*d2));
 }
 case'nested-subgroup-share-of-all':{
  const boys=knownPart(p.total,p.boys),club=knownPart(boys,p.club);return fractionMCQ(row,[club,p.total]);
 }
 case'boys-share-from-total-excess':{
  const candidates=[];for(let boys=1;boys<=100;boys++)for(let girls=1;girls<=100;girls++)if(boys+girls-boys===p.totalMinusBoys&&boys+girls-girls===p.totalMinusGirls)candidates.push([boys,boys+girls]);return fractionMCQ(row,one(candidates));
 }
 case'invalid-zero-denominator':return pick(row,o=>{const[n,d]=q(o);assert.ok(n>=0);return d===0;});
 case'kilometre-share-metres':return knownPart(1000,p.fraction);
 case'natural-quotient-denominator-count':return range(1,p.numerator).filter(b=>p.numerator%b===0).length;
 case'equal-bulk-store-share':return fractionMCQ(row,[p.bags*p.kgPerBag,p.stores]);
 case'prime-extrema-fraction':{
  const a=Math.max(...range(10**(p.numeratorDigits-1),10**p.numeratorDigits-1).filter(isPrime)),b=range(10**(p.denominatorDigits-1),10**p.denominatorDigits-1).find(isPrime);return fractionMCQ(row,[a,b]);
 }
 case'library-share-offset-whole':{
  const[n,d]=p.fiction;return one(range(1,(p.referenceExtra+p.dictionaries)*d).filter(w=>w*n%d===0&&2*w*n/d+p.referenceExtra+p.dictionaries===w));
 }
 case'superposed-rope-cuts':{
  const marks=[];for(const d of p.partitions)for(let n=1;n<d;n++)if(!marks.some(q=>equal(q,[n,d])))marks.push([n,d]);return marks.length+1;
 }
 case'age-share-now-and-future':{
  const[n,d]=p.now,[n2,d2]=p.after,states=[];for(let child=1;child<200;child++)for(let parent=child+1;parent<200;parent++)if(child*d===parent*n&&(child+p.years)*d2===(parent+p.years)*n2)states.push([child,parent]);const [child]=one(states);return pick(row,o=>Number(o.replace(' жас',''))===child);
 }
 default:throw Error('Missing independent fraction-intro oracle '+kind(row));
}}
for(const row of rows)test('independent exact fraction/whole/domain oracle '+row.editionId,()=>{
 assert.equal(row.answer,String(oracle(row)));assert.equal(verifyEdition(row).answer,row.answer);assert.ok(!/[\\$]/.test(row.statement+row.solution));
 if(row.options){assert.equal(row.options.length,4);assert.equal(new Set(row.options).size,4);assert.equal(row.options.filter(o=>o===row.answer).length,1);}else{assert.match(row.answer,/^\d+$/);assert.ok(row.statement.endsWith('Жауапқа тек санды жазыңыз.'));}
});
test('all44 canonical saved nonvisual3.1 sources covered exactly once; only integer free inputs',()=>{
 const src=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='3-1');assert.equal(src.length,44);assert.equal(rows.length,44);assert.deepEqual(new Set(rows.map(r=>r.sourceRefs[0].sourceId)),new Set(src.map(q=>q.sourceId)));
 for(const row of rows){const ref=row.sourceRefs[0],q=one(JSON.parse(fs.readFileSync(ref.sourceFile)).questions.filter(q=>q.id===ref.sourceId));assert.ok(q.checked);assert.notEqual(q.statement,row.statement);assert.equal(row.grade,5);assert.equal(row.minimumPlan,'pro');assert.ok(!row.image&&!row.figure);}
});
test('fixed params, all original givens, native language conditions and complete solutions/keys/MCQ bound',()=>{
 for(const row of rows){for(const field of['statement','solution','answer']){const bad=structuredClone(row);bad[field]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));}for(const field of['grade','topic','difficulty','modelId','minimumPlan']){const bad=structuredClone(row);bad[field]='tamper';assert.throws(()=>verifyEdition(bad));}const bad=structuredClone(row);bad.params.unboundShare=7;assert.throws(()=>verifyEdition(bad));if(row.options){const bad=structuredClone(row);bad.options[0]+=' өзгеріс';assert.throws(()=>verifyEdition(bad));}}
});
test('zero numerator valid, zero denominator intentional invalid example never evaluated as a number',()=>{
 assert.equal(get('zero-numerator-value').answer,'0');const invalid=get('invalid-zero-denominator');assert.equal(invalid.answer,'(7/0)');assert.equal(invalid.intentionalIncorrectExample,true);assert.equal(invalid.options.filter(o=>q(o)[1]===0).length,1);
 const bad=structuredClone(invalid);delete bad.intentionalIncorrectExample;assert.throws(()=>verifyEdition(bad));assert.ok(invalid.solution.includes('нөлге бөлу анықталмаған'));
});
test('original-whole versus nested-remainder bases and subgroup versus entire-group answers remain explicit',()=>{
 assert.equal(get('two-original-whole-sales-remainder').answer,'120');assert.notEqual(360-168-(360-168)/5,120);
 assert.equal(get('sequential-budget-inverse').answer,'3600');assert.equal(3600-900-2700/3,1800);assert.notEqual(3600-900-3600/3,1800);
 assert.equal(get('third-successive-share-count').answer,'36');assert.notEqual(256/4,36);assert.notEqual(108,36);
 assert.equal(get('nested-subgroup-share-of-all').answer,'(6/55)');assert.equal(55/5*3/11*2,6);assert.equal(get('library-share-offset-whole').answer,'270');assert.equal(108+144+18,270);
 for(const[k,phrase]of[['two-original-whole-sales-remainder','БАСТАПҚЫ барлық'],['sequential-budget-inverse','ҚАЛҒАН ақшаның'],['third-successive-share-count','СОЛ СӘТТЕ'],['nested-subgroup-share-of-all','БАРЛЫҚ оқушының'],['age-share-now-and-future','СОЛ КЕЗДЕГІ']]){const r=get(k);assert.ok(r.statement.includes(phrase));const bad=structuredClone(r);bad.statement=bad.statement.replace(phrase,'');assert.throws(()=>verifyEdition(bad));}
});
test('strict positive numerator domain vs divisor domain, superposed marks and future ages exhaustive',()=>{
 assert.equal(get('natural-quotient-numerator-count').answer,'8');assert.deepEqual(range(1,71).filter(n=>n%8===0),[8,16,24,32,40,48,56,64]);assert.equal(72%8,0);
 assert.equal(get('natural-quotient-denominator-count').answer,'16');assert.equal(range(1,120).filter(b=>120%b===0).length,16);
 assert.equal(get('superposed-rope-cuts').answer,'12');assert.equal(6+8,14);assert.equal(get('age-share-now-and-future').answer,'18 жас');assert.equal(18*8,48*3);assert.equal((18+12)*2,48+12);
});
test('different wholes, precise base units, explicit sequence law and prime extremal constraints retained',()=>{
 assert.equal(get('compare-shares-different-wholes').answer,'96 санының (2/3) бөлігі');assert.ok(5*3>2*7);assert.equal(84/7*5,60);assert.equal(96/3*2,64);
 assert.equal(get('greatest-time-share').answer,'тәуліктің (1/40) бөлігі');assert.equal(1440/40,36);assert.equal(get('hour-fraction-to-minutes').answer,'35');assert.equal(get('kilometre-share-metres').answer,'875');
 assert.equal(get('fraction-sequence-index').answer,'(9/31)');assert.ok(get('fraction-sequence-index').statement.includes('Ереже:'));
 assert.equal(get('prime-extrema-fraction').answer,'(97/101)');assert.equal(isPrime(99),false);assert.equal(isPrime(100),false);assert.equal(isPrime(97),true);assert.equal(isPrime(101),true);
});

test('every printed numeric/symbolic fraction is an explicit native canonical group, including blank and invalid examples',()=>{
 let count=0;
 for(const row of rows)for(const text of[row.statement,row.solution,row.answer,...(row.options||[])]){
  for(const m of text.matchAll(/(?<![\p{L}\p{N}_])(\d+|[a-z□])\/(\d+|[a-z□])(?![\p{L}\p{N}_])/gu)){
   assert.equal(text[m.index-1],'(',text);assert.equal(text[m.index+m[0].length],')',text);count++;
  }
 }
 assert.ok(count>100);
 assert.ok(get('denominator-definition').statement.includes('(a/b)'));
 assert.ok(get('missing-numerator-natural-value').statement.includes('(□/7)'));
 assert.ok(get('natural-quotient-numerator-count').statement.includes('(n/8)'));
 assert.ok(get('natural-quotient-denominator-count').statement.includes('(120/b)'));
 const invalid=get('invalid-zero-denominator');assert.equal(invalid.answer,'(7/0)');assert.ok(invalid.solution.includes('(7/0) мәнін есептемейміз'));
 // The UI/answer pair uses the same presentation; all open keys stay integers.
 for(const row of rows)if(row.options)assert.ok(row.options.includes(row.answer));else assert.match(row.answer,/^\d+$/);
});

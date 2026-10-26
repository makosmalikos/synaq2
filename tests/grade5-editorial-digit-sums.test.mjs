import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildEditions,verifyEdition} from '../scripts/editorial/grade5-digit-sums-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
const editions=buildEditions();
const key='grade5-digit-sums-';
const integers=(lo,hi)=>Array.from({length:hi-lo+1},(_,i)=>lo+i);
const B=n=>BigInt(n);
const divisible=(n,d)=>B(n)%B(d)===0n;
const sumChars=text=>[...String(text)].reduce((s,c)=>s+BigInt(c),0n);
const sumDigits=n=>Number(sumChars(n));
const one=xs=>{assert.equal(xs.length,1);return xs[0];};
const completeDigitList=xs=>xs.join(', ');
const classification=(s,t,n)=>`${s}; 3 санына ${t?'бөлінеді':'бөлінбейді'}, 9 санына ${n?'бөлінеді':'бөлінбейді'}`;
function onlyOption(row,predicate){return one(row.options.filter(predicate));}
function universe(lo,hi,predicate){return integers(lo,hi).filter(predicate);}
function oracle(row){const p=row.params,k=row.modelId.slice(key.length);switch(k){
 case'digit-sum-and-nine':return classification(sumDigits(p.number),divisible(p.number,3),divisible(p.number,9));
 case'minimum-length-nine':case'minimum-length-three':{const d=k.endsWith('nine')?9:3;return universe(10**(p.digits-1),10**p.digits-1,n=>divisible(n,d))[0];}
 case'three-choice':return onlyOption(row,t=>divisible(t,3));
 case'nine-choice':return onlyOption(row,t=>divisible(t,9));
 case'not-three-choice':return onlyOption(row,t=>!divisible(t,3));
 case'three-not-nine-choice':return onlyOption(row,t=>divisible(t,3)&&!divisible(t,9));
 case'six-choice':return onlyOption(row,t=>divisible(t,6));
 case'fortyfive-choice':return onlyOption(row,t=>divisible(t,45));
 case'soil-packets-three':assert.equal(B(p.total)%B(p.size),0n);return B(p.total)/B(p.size);
 case'total-candidate-three':return onlyOption(row,t=>divisible(t,p.groups));
 case'minimum-append-digit-three':return universe(0,9,d=>divisible(B(p.prefix)*10n+B(d),3))[0];
 case'interior-digit-nine':return onlyOption(row,t=>divisible(B(p.first)*100n+B(t)*10n+B(p.last),9));
 case'nine-implies-three':{
  const checks=[n=>!divisible(n,3)||divisible(n,9),n=>n%10!==3||divisible(n,3),n=>!divisible(n,9)||divisible(n,3),n=>n%10!==9||divisible(n,9)];
  const trueIndexes=universe(0,3,i=>integers(1,90).every(checks[i]));assert.deepEqual(trueIndexes,[2]);return row.options[trueIndexes[0]];
 }
 case'possible-digit-sum-nine':return onlyOption(row,t=>divisible(t,9));
 case'maximum-internal-digit-three':return universe(0,9,d=>divisible(B(p.before)*100n+B(d)*10n+B(p.last),3)).at(-1);
 case'all-append-digits-six':return completeDigitList(universe(0,9,d=>divisible(B(p.prefix)*10n+B(d),6)));
 case'fifteen-count':return p.numbers.filter(n=>divisible(n,15)).length;
 case'inclusive-nine-count':return universe(p.lower,p.upper,n=>divisible(n,9)).length;
 case'fortyfive-product-choice':return onlyOption(row,t=>divisible(t.split(' × ').reduce((v,n)=>v*B(n),1n),45));
 case'shelf-total-candidates-nine':return B(one(p.numbers.filter(n=>divisible(n,p.shelves))))/B(p.shelves);
 case'six-equal-classes':assert.equal(B(p.total)%B(p.groups),0n);return B(p.total)/B(p.groups);
 case'minimum-distinct-nine':return universe(Math.max(p.lower,10**(p.digits-1)),10**p.digits-1,n=>new Set(String(n)).size===p.digits&&divisible(n,9))[0];
 case'maximum-distinct-nine':return universe(10**(p.digits-1),Math.min(p.upperExclusive,10**p.digits)-1,n=>new Set(String(n)).size===p.digits&&divisible(n,9)).at(-1);
 case'all-internal-digits-fifteen':return completeDigitList(universe(0,9,d=>divisible(B(p.first)*100n+B(d)*10n+B(p.last),15)));
 case'coprime-combination-rule':{
  const checks=[n=>!(divisible(n,3)&&divisible(n,6))||divisible(n,18),n=>!divisible(n,9)||divisible(n,18),n=>!(divisible(n,3)&&divisible(n,5))||divisible(n,15),n=>!divisible(n,15)||divisible(n,45)];
  const valid=universe(0,3,i=>integers(1,90).every(checks[i]));assert.deepEqual(valid,[2]);return row.options[2];
 }
 case'bounded-even-nine-share':return B(one(universe(p.lower+1,p.upper-1,n=>divisible(n,2)&&divisible(n,p.groups))))/B(p.groups);
 case'remainder-nine':return B(p.number)%9n;
 case'repdigit-five-fortyfive':{
  // Construct each candidate as an exact BigInt; deliberately do not use the author's digit-sum/length formula.
  for(let n=p.minimumLength;n<100;n++)if(B(String(p.digit).repeat(n))%45n===0n)return n;throw Error('No repdigit found');
 }
 case'long-repdigit-remainder-nine':return B(String(p.digit).repeat(p.count))%9n;
 case'possible-sums-length-nine':{
  const sums=new Set();for(let n=10**(p.digits-1);n<10**p.digits;n++)if(B(n)%9n===0n)sums.add(sumDigits(n));return completeDigitList([...sums].sort((a,b)=>a-b));
 }
 case'maximum-two-blanks-fortyfive':{
  const found=universe(1000,9999,n=>{const t=String(n);return t.slice(1,3)===p.middle.join('')&&divisible(n,45);});return found.at(-1);
 }
 case'neither-three-nor-five-count':return universe(1,p.last,n=>!divisible(n,3)&&!divisible(n,5)).length;
 case'descending-fortyfive-nonzero':return one(universe(10**(p.digits-1),10**p.digits-1,n=>{const t=String(n);return t.at(-1)!=='0'&&[...t].every((c,i)=>i===0||t[i-1]>c)&&divisible(n,45);}));
 case'number-minus-digit-sum':{
  const nums=universe(10,99,n=>n-sumDigits(n)===p.difference),tens=new Set(nums.map(n=>Math.trunc(n/10)));assert.equal(nums.length,10);assert.equal(tens.size,1);return [...tens][0];
 }
 case'repeated-digit-universal':return onlyOption(row,d=>integers(1,9).every(c=>divisible(String(c).repeat(p.length),d)));
 case'concatenated-digit-sum-classify':{
  let t='';for(let n=p.first;n<=p.last;n++)t+=String(n);const n=B(t),s=sumChars(t);return classification(s,n%3n===0n,n%9n===0n);
 }
 case'minimum-digit-sum-six':return universe(1,9999,n=>sumDigits(n)===p.digitSum&&divisible(n,6))[0];
 case'two-blanks-six-nine-count':return universe(1000,9999,n=>{const t=String(n);return +t[0]===p.first&&+t[2]===p.third&&divisible(n,6)&&divisible(n,9);}).length;
 case'digitwise-nine-misconception':assert.equal(B(p.number)%3n,0n);assert.notEqual(B(p.number)%9n,0n);return `Тұжырым қате: цифрлар қосындысы ${sumDigits(p.number)}, ол 9 санына бөлінбейді`;
 case'grandmother-age-nine':return one(universe(10,99,n=>divisible(n,9)&&Math.trunc(n/10)-n%10===p.difference));
 case'bounded-six-nine-remainder':return one(universe(p.lower+1,p.upper-1,n=>divisible(n,6)&&B(n)%9n===B(p.remainderNine)));
 case'one-digit-replacement-nine':{
  const chars=[...String(p.number)];const successes=[];p.replacements.forEach(({index,to},i)=>{const t=[...chars];t[index]=String(to);assert.notEqual(t[0],'0');if(B(t.join(''))%9n===0n)successes.push(i);});return row.options[one(successes)];
 }
 case'minimum-positive-add-six':for(let x=1;x<=6;x++)if((B(p.number)+B(x))%6n===0n)return x;throw Error('No next multiple');
 case'fortyfive-not-guaranteed':return onlyOption(row,d=>integers(1,90).some(m=>B(m)*45n%B(d)!==0n));
 case'distinct-odd-nine-count':return universe(10**(p.digits-1),10**p.digits-1,n=>{const t=String(n);return new Set(t).size===p.digits&&[...t].every(c=>B(c)%2n===1n)&&divisible(n,9);}).length;
 case'digit-set-three-count':return universe(10**(p.length-1),10**p.length-1,n=>{const t=String(n);return new Set(t).size===p.length&&[...t].every(c=>p.digits.includes(+c))&&divisible(n,3);}).length;
 case'reverse-six-rule':{
  const values=universe(1,9999,n=>divisible(n,6)&&n%10!==0),rev=n=>B([...String(n)].reverse().join(''));
  assert.ok(values.every(n=>rev(n)%3n===0n));assert.ok(values.some(n=>rev(n)%6n!==0n));assert.ok(values.some(n=>rev(n)%6n===0n));assert.ok(values.some(n=>rev(n)%9n!==0n));return row.options[2];
 }
 default:throw Error('Independent oracle missing '+k);
}}
for(const row of editions)test('independent exact integer/digit oracle '+row.editionId,()=>{
 assert.equal(row.answer,String(oracle(row)));assert.equal(verifyEdition(row).answer,row.answer);
 assert.equal(row.grade,5);assert.equal(row.topic,'num');assert.equal(row.editorialStatus,'awaiting_independent_review');
 assert.ok(!/[\\$]/.test(row.statement+row.solution));
 if(row.options){assert.equal(row.options.length,4);assert.equal(new Set(row.options).size,4);assert.equal(row.options.filter(v=>v===row.answer).length,1);}else{assert.match(row.answer,/^\d+$/);assert.ok(row.statement.endsWith('Жауапқа тек санды жазыңыз.'));}
});
test('exactly the 48 canonical nonvisual topic2.5 sources, one edition each',()=>{
 const captured=grade5Sources().filter(s=>s.nonvisual&&s.sourceTopic==='2-5');assert.equal(captured.length,48);assert.equal(editions.length,48);
 assert.deepEqual(new Set(editions.map(r=>r.sourceRefs[0].sourceId)),new Set(captured.map(r=>r.sourceId)));
 for(const row of editions){const ref=row.sourceRefs[0],raw=JSON.parse(fs.readFileSync(ref.sourceFile,'utf8'));assert.ok(raw.questions.some(q=>q.id===ref.sourceId));}
});
test('edited answers, numeric givens, full solutions and MCQ keys cannot pass binding',()=>{
 for(const row of editions){for(const field of['statement','solution','answer']){const changed=structuredClone(row);changed[field]=field==='answer'?String(BigInt(/^\d+$/.test(row.answer)?row.answer:'0')+1n):row[field].replace(/\d+/,n=>String(Number(n)+1))+' ';assert.throws(()=>verifyEdition(changed));}
  const changed=structuredClone(row);changed.params.extraUnboundNumber=713;assert.throws(()=>verifyEdition(changed));
  if(row.options){const bad=structuredClone(row);bad.options[0]+=' қате';assert.throws(()=>verifyEdition(bad));}
 }
});
test('source-critical zero, two digit-sum branches, minimality and reverse counterexamples survive',()=>{
 const get=k=>editions.find(r=>r.modelId===key+k);
 assert.equal(get('all-append-digits-six').answer,'0, 6');assert.equal(get('all-internal-digits-fifteen').answer,'0, 3, 6, 9');
 const two=get('two-blanks-six-nine-count');assert.equal(two.answer,'5');assert.ok(two.solution.includes('a + b = 5')&&two.solution.includes('a + b = 14'));assert.ok(two.solution.includes('3 жұп')&&two.solution.includes('2 жұп'));
 assert.equal(get('repdigit-five-fortyfive').answer,'18');assert.equal(get('long-repdigit-remainder-nine').answer,'0');assert.equal(get('remainder-nine').answer,'7');
 assert.equal(get('digit-set-three-count').answer,'10');assert.ok(get('digit-set-three-count').solution.includes('4 + 6 = 10'));
 assert.equal(get('minimum-digit-sum-six').answer,'7998');assert.equal(get('descending-fortyfive-nonzero').answer,'9765');
 assert.equal(get('distinct-odd-nine-count').answer,'24');assert.equal(get('bounded-six-nine-remainder').answer,'510');
 const maximum=get('maximum-distinct-nine');assert.equal(maximum.answer,'873');assert.ok(maximum.solution.includes('882'));
 const withoutDistinct=universe(100,maximum.params.upperExclusive-1,n=>divisible(n,9)).at(-1);assert.equal(withoutDistinct,882);assert.notEqual(String(withoutDistinct),maximum.answer);
 assert.ok(get('six-equal-classes').statement.includes('бөлуге бола ма?'));assert.equal(get('six-equal-classes').answer,'297');
 for(const [kind,fragment] of[['digit-set-three-count','алғашқы орынға 0 қойылмайды'],['two-blanks-six-nine-count','Олар бір-біріне немесе белгілі цифрларға тең болуы мүмкін.'],['reverse-six-rule','соңғы цифры 0 емес']]){const row=structuredClone(get(kind));assert.ok(row.statement.includes(fragment));row.statement=row.statement.replace(fragment,'');assert.throws(()=>verifyEdition(row));}
});

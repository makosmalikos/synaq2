import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verifyEdition} from '../scripts/editorial/grade5-endings-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade5-endings.json',import.meta.url),'utf8'));
const one=xs=>{assert.equal(xs.length,1);return xs[0];};
function enumerateDigits(digits,length){const out=[];for(let n=10**(length-1);n<10**length;n++){const chars=String(n).split('').map(Number);if(new Set(chars).size===length&&chars.every(d=>digits.includes(d)))out.push(n);}return out;}
function readAffine(text,x){const match=text.match(/^(?:(\d+) × )?x(?: \+ (\d+))?$/);assert.ok(match,text);return Number(match[1]||1)*x+Number(match[2]||0);}
function printedOperation(text){const ns=text.match(/\d+/g).map(BigInt);return text.includes(' × ')?ns.reduce((a,b)=>a*b,1n):ns.reduce((a,b)=>a+b,0n);}
function oracle(row){const p=row.params,k=row.modelId.replace('grade5-endings-','');switch(k){
 case'odd-choice':case'even-choice':{const parity=k==='odd-choice'?1n:0n;return one(row.options.filter(s=>BigInt(s)%2n===parity));}
 case'five-not-two-ending':{const numbers=[];for(let n=p.prefix*10;n<p.prefix*10+10;n++)if(BigInt(n)%5n===0n&&BigInt(n)%2n===1n)numbers.push(n);return String(one(numbers));}
 case'all-even-digits':{const valid=row.options.filter(s=>{const ds=s.match(/\d+/g).map(Number);return JSON.stringify([...new Set(ds)].sort((a,b)=>a-b))===JSON.stringify([0,2,4,6,8]);});return one(valid);}
 case'five-choice':case'ten-choice':case'five-not-ten-choice':return one(row.options.filter(s=>{const n=BigInt(s);return k==='five-choice'?n%5n===0n:k==='ten-choice'?n%10n===0n:n%5n===0n&&n%10n!==0n;}));
 case'classify-divisors':{const actual=[2,5,10].filter(d=>Number.isInteger(p.number/d));const index=one(p.choices.map((v,i)=>({v,i})).filter(({v})=>JSON.stringify(v)===JSON.stringify(actual))).i;return row.options[index];}
 case'inclusive-odd-count':return String(Math.floor((p.upper+1)/2)-Math.floor(p.lower/2));
 case'largest-even-append':{let largest;for(let d=9;d>=0;d--)if(Number(String(p.prefix)+d)%2===0){largest=Number(String(p.prefix)+d);break;}return String(largest);}
 case'digit-length-ten-count':{let count=0;for(let n=10**(p.digits-1);n<10**p.digits;n++)if(Number.isInteger(n/10))count++;return String(count);}
 case'largest-digit-length-five':{for(let n=10**p.digits-1;n>=10**(p.digits-1);n--)if(n%5===0)return String(n);throw Error('No number');}
 case'last-digit-ten':{const ds=[];for(let d=0;d<=9;d++)if(Number.isInteger(Number(String(p.prefix)+d)/10))ds.push(d);return String(one(ds));}
 case'universal-ten-parity':assert.ok(p.evenFive%5===0&&p.evenFive%2===0);assert.ok(p.evenNotTen%2===0&&p.evenNotTen%10!==0);assert.notEqual((10+p.falseEnding)%5,0);for(let n=10;n<100;n+=10)assert.equal(n%2,0);return'10 санына бөлінетін кез келген натурал сан жұп';
 case'smallest-odd-digit-length-five':{for(let n=10**(p.digits-1);n<10**p.digits;n++)if(n%5===0&&n%2===1)return String(n);throw Error('No number');}
 case'digit-set-five-count':return String(enumerateDigits(p.digits,p.length).filter(n=>Number.isInteger(n/5)).length);
 case'remainder-five':return String(BigInt(p.number)-BigInt(Math.floor(p.number/5))*5n);
 case'even-input-odd-expression':case'odd-input-even-expression':{const input=k==='even-input-odd-expression'?0:1,target=1-input;const good=row.options.filter(s=>[1,2,3,4].every(n=>readAffine(s,input?2*n-1:2*n)%2===target));return one(good);}
 case'odd-summand-count-parity':assert.ok(p.counterexample.every(n=>n%2===1));assert.equal(p.counterexample.length,p.count);assert.notEqual(p.counterexample.reduce((a,b)=>a+b,0)%5,0);assert.equal(p.count%2,1);return'әрқашан тақ';
 case'largest-even-permutation':return String(enumerateDigits(p.digits,p.digits.length).filter(n=>n%2===0).at(-1));
 case'last-digit-two-and-five':{const endings=[];for(let n=10;n<20;n++)if(n%2===0&&n%5===0)endings.push(n%10);return String(one(endings));}
 case'neither-two-nor-five-count':return String(p.last-Math.floor(p.last/2)-Math.floor(p.last/5)+Math.floor(p.last/10));
 case'internal-placeholder-impossible':{const good=[];for(let d=0;d<=9;d++){const n=Number(String(p.firstDigit)+d+p.lastDigit);if(n%2===0)good.push(d);}assert.equal(good.length,0);return'мұндай цифр жоқ';}
 case'bounded-groups-and-pairs':{const counts=[];for(let groups=1;groups*5<p.upper;groups++){const n=groups*5;if(n>p.lower&&n%2===1)counts.push(n);}return String(one(counts));}
 case'product-ten-choice':return one(row.options.filter(s=>printedOperation(s)%10n===0n));
 case'next-odd-five-multiple':return String(10*(Math.floor((p.after-5)/10)+1)+5);
 case'open-range-odd-five-count':{const first=10*Math.ceil((p.lower+1-5)/10)+5,last=10*Math.floor((p.upper-1-5)/10)+5;return String((last-first)/10+1);}
 case'corrected-price':{let actual=p.reported-1;while(actual%p.count!==0)actual--;assert.ok(actual<p.reported);return String(actual/p.count);}
 case'sum-five-choice':{const chosen=one(row.options.filter(s=>printedOperation(s)%5n===0n));assert.ok(chosen.match(/\d+/g).map(Number).every(n=>n%5===0),'Saved skill includes two individually divisible summands');return chosen;}
 case'distinct-prefix-ten-count':{const count=[];const prefix=Number(p.prefix.join(''));for(let multiple=Math.ceil(100*prefix/10)*10;multiple<100*prefix+100;multiple+=10)if(new Set(String(multiple)).size===4)count.push(multiple);return String(count.length);}
 case'either-two-or-five-count':return String(Math.floor(p.last/2)+Math.floor(p.last/5)-Math.floor(p.last/10));
 case'minimum-two-bottle-sizes':{for(let bottles=2;bottles<=p.total;bottles++){for(let large=1;large<bottles;large++)if(large*p.large+(bottles-large)*p.small===p.total)return String(bottles);}throw Error('No complete bottle plan');}
 case'combined-remainder-digit':{const possible=new Set();for(let n=1;n<=100;n++)if(n%2===p.remainderTwo&&n%5===p.remainderFive)possible.add(n%10);return String(one([...possible]));}
 case'largest-distinct-odd-five':{for(let n=10**p.digits-1;n>=10**(p.digits-1);n--)if(n%5===0&&n%2===1&&new Set(String(n)).size===p.digits)return String(n);throw Error('No distinct number');}
 case'equal-partition-impossible':{let total=0;for(let n=1;n<=p.last;n++)total+=n;assert.equal(total%2,1);return`бөлуге болмайды, себебі жалпы қосынды ${total} — тақ`;}
 case'consecutive-sum-classification':{let total=0;for(let n=1;n<=p.last;n++)total+=n;assert.equal(total%2,1);assert.equal(total%5,0);assert.notEqual(total%10,0);return'тақ және 5 санына бөлінеді';}
 case'inclusive-odd-five-sum':{const first=10*Math.ceil((p.lower-5)/10)+5,last=10*Math.floor((p.upper-5)/10)+5,count=(last-first)/10+1;return String(count*(first+last)/2);}
 case'impossible-ten-remainder':{const possible=new Set();for(let n=1;n<=100;n++)if(n%2===p.remainderTwo)possible.add(n%10);return String(one(p.choices.filter(d=>!possible.has(d))));}
 case'possible-multiple-endings':{const possible=new Set();for(let n=1;n<=20;n++)possible.add(p.packSize*n%10);assert.deepEqual([...possible].sort((a,b)=>a-b),[0,5]);return'0 немесе 5';}
 case'missing-book-leaves':{const digits=String(p.firstPage).split('').map(Number);const candidates=enumerateDigits(digits,3).filter(n=>n>p.firstPage&&n%2===0);const last=one(candidates);assert.equal(p.firstPage%2,1);const pages=last-p.firstPage+1;assert.equal(pages%2,0);return String(pages);}
 case'needed-even-factor':{const fixed=p.fixed.reduce((a,b)=>a*BigInt(b),1n);return one(row.options.filter(s=>fixed*BigInt(s)%10n===0n));}
 case'smallest-odd-shifted-five':{for(let n=10**(p.digits-1);n<10**p.digits;n++)if(n%2===1&&(n+p.added)%5===0)return String(n);throw Error('No shifted code');}
 case'any-prefix-ending-five':for(let n=10**(p.digits-1);n<10**p.digits;n++)if(n%10===5){assert.equal(n%2,1);assert.equal(n%5,0);assert.notEqual(n%10,0);}return'тақ және 5 санына бөлінеді';
 case'erased-zero-inverse':{const candidates=[];for(let original=10;original<2*p.decrease;original+=10)if(original-Math.floor(original/10)===p.decrease)candidates.push(original);return String(one(candidates));}
 case'infer-odd-addend':for(let x=1;x<=19;x+=2)for(let y=1;y<=20;y++)if((x+y)%2===0)assert.equal(y%2,1);assert.equal((p.firstExample+p.secondExample)%2,0);assert.notEqual(p.secondExample%5,0);return`${p.secondName} жинаған ұпай саны тақ`;
 case'odd-product-last-digit':return String(p.factors.reduce((a,b)=>a*BigInt(b),1n)%10n);
 default:throw Error('Missing independent ending oracle '+k);
}}
test('every captured nonvisual2.4 source has exactly one native, pending Standard edition',()=>{
 const captured=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='2-4');assert.equal(data.editions.length,48);assert.deepEqual(data.editions.map(r=>r.sourceRefs[0].sourceId).sort(),captured.map(q=>q.sourceId).sort());
 for(const r of data.editions){assert.equal(r.grade,5);assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'awaiting_independent_review');const source=captured.find(q=>q.sourceId===r.sourceRefs[0].sourceId);assert.ok(source.checked);assert.equal(r.sourceRefs[0].sourceFile,source.sourceFile);assert.notEqual(r.statement,source.raw.statement);assert.doesNotMatch(r.statement+r.solution,/[\\$]/);if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(s=>s===r.answer).length,1);}else assert.match(r.answer,/^\d+$/);}
});
for(const row of data.editions)test(row.editionId+' satisfies independent digit enumeration, integer equations and full text binding',()=>{
 assert.equal(row.answer,oracle(row));assert.equal(verifyEdition(row).answer,row.answer);
 if(!row.options)assert.ok(row.statement.endsWith('Жауапқа тек санды жазыңыз.'));
 for(const key of['statement','solution'])assert.throws(()=>verifyEdition({...row,[key]:row[key]+' 49'}));assert.throws(()=>verifyEdition({...row,answer:'unreviewed'}));assert.throws(()=>verifyEdition({...row,params:{...row.params,unreviewedExtra:31}}));
 if(row.options)assert.throws(()=>verifyEdition({...row,options:row.options.slice().reverse()}));
});
test('leading zero, the two5-endings, book-sheet order and both bottle sizes remain substantive constraints',()=>{
 const get=id=>data.editions.find(r=>r.editionId.endsWith(id));
 assert.equal(oracle(get('db539585baa4a512')),'5');assert.equal(oracle(get('14fdaeac9d29e879')),'10');
 const leaf=get('43cec582c9bb58a6');assert.equal(leaf.params.firstPage,725);assert.equal(oracle(leaf),'28');
 const n=get('248445f35302f8bf');assert.equal(oracle(n),'8');assert.equal(5*n.params.large+3*n.params.small,n.params.total);
 const impossible=get('fdce316f17943604');assert.match(impossible.statement,/7□5/);assert.equal(oracle(impossible),'мұндай цифр жоқ');
});
test('largest-even permutation requires choosing an ending rather than blindly sorting every digit',()=>{
 const row=data.editions.find(r=>r.modelId==='grade5-endings-largest-even-permutation');
 const descending=Number(row.params.digits.slice().sort((a,b)=>b-a).join(''));
 assert.equal(descending%2,1);assert.equal(Number(row.answer)%2,0);assert.equal(oracle(row),'8316');
 assert.ok(row.params.digits.filter(d=>d%2===0).length>=2);
});

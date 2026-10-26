/** Author checks from printed givens and full digit / integer domains.
 * This is not an independent editorial review or a publication signature. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './grade4-written-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-written-wave21.json',import.meta.url))).editions;
const keys=['3','804 · 7','7','36','8310','2566','400','2','<','48 048 : 6 = 808','5 635 : 7','4 728 : 3','18447','1502','631','1, 2, 3, 4, 5, 6','сенбі','1089','651, қалдық 8','23240','=','8 462'];
const num=s=>Number(s.replaceAll(' ','')),take=(re,s)=>{const m=re.exec(s);assert(m,[re,s]);return m;};
function evalPrinted(s){const p=s.replace(/(?<=\d) (?=\d)/g,'');assert(/^[\d +·:]+$/.test(p));return p.split(' + ').reduce((acc,term)=>{const m=/^(\d+)(?: ([·:]) (\d+))?$/.exec(term);assert(m,term);return acc+(m[2]==='·'?+m[1]*+m[3]:m[2]===':'?+m[1]/+m[3]:+m[1]);},0);}
function pair(s){return take(/^(\d[\d ]*) : (\d+)$/,s).slice(1).map(num);}
function eqPrinted(s){const sides=s.split(' = ');assert.equal(sides.length,2);return evalPrinted(sides[0])===num(sides[1]);}
let domains=0,fullDigitCases=0,fullRemainderCases=0,sourceZeroGuards=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement,k=r.modelId.replace('grade4-written-','');verifyEdition(r);assert.equal(r.answer,keys[i]);
 switch(k){
 case 'quotient-digit-count':{const [n,d]=take(/: (\d+)/,s)?take(/(\d[\d ]*) : (\d+)/,s).slice(1).map(num):[];assert.equal(String(Math.floor(n/d)).length,+r.answer);assert(Number(String(n)[0])<d);break;}
 case 'division-inverse-check':{const [n,d,q]=take(/(\d[\d ]*) : (\d+) = (\d+)/,s).slice(1).map(num);assert.equal(n,q*d);assert.deepEqual(r.options.filter(o=>evalPrinted(o)===n),[r.answer]);assert(String(q).slice(1,-1).includes('0'));sourceZeroGuards++;break;}
 case 'impossible-remainder':{const d=+take(/Санды (\d+)/,s)[1],bad=r.options.filter(v=>+v<0||+v>=d);assert.deepEqual(bad,[r.answer]);assert.equal(+r.answer,d);break;}
 case 'first-partial-dividend':{const [n,d]=take(/^(\d[\d ]*) : (\d+)/,s).slice(1).map(num),str=String(n);const prefixes=Array.from({length:str.length},(_,j)=>+str.slice(0,j+1));assert.equal(prefixes.find(v=>v>=d),+r.answer);assert(prefixes[0]<d);break;}
 case 'carried-item-cost':{const [p,c]=take(/анықтамалық (\d[\d ]*) теңге\. Осындай (\d+)/,s).slice(1).map(num);assert.equal(p*c,+r.answer);let carry=0,count=0;for(const digit of [...String(p)].reverse()){const t=+digit*c+carry;carry=Math.floor(t/10);if(carry)count++;}assert(count>=2);break;}
 case 'reconstruct-dividend':{const [d,q,rem]=take(/Бөлгіш (\d+), бөлінді (\d+), қалдық (\d+)/,s).slice(1).map(Number);assert(rem>=0&&rem<d);assert.equal(q*d+rem,+r.answer);break;}
 case 'overlapping-pair-prices':{const [total,a,b]=take(/құны (\d+) теңге\. Қалам мен дәптер (\d+) теңге, дәптер мен сызғыш (\d+)/,s).slice(1).map(Number);let good=[];for(let middle=1;middle<=total;middle++)if(a-middle>0&&b-middle>0&&(a-middle)+middle+(b-middle)===total)good.push(middle);assert.deepEqual(good,[+r.answer]);fullRemainderCases+=total;break;}
 case 'equal-packing-remainder':{const [n,d]=take(/^(\d[\d ]*) қарындашты (\d+)/,s).slice(1).map(num);const q=Math.floor(n/d);assert.equal(n-q*d,+r.answer);assert(q*d<=n&&(q+1)*d>n);break;}
 case 'carried-product-comparison':{const [n,m,right]=take(/^(\d[\d ]*) · (\d+) □ (\d[\d ]*)\./,s).slice(1).map(num),left=n*m;assert.equal(left<right?'<':left>right?'>':'=',r.answer);assert.equal(right-left,3);assert.equal(String(n)[2],'0');assert.equal(String(left).at(-1),'0');sourceZeroGuards++;break;}
 case 'missing-quotient-zero-error':{assert(r.intentionalIncorrectExample);assert.deepEqual(r.options.filter(o=>!eqPrinted(o)),[r.answer]);const [n,d,q]=take(/^(\d[\d ]*) : (\d+) = (\d+)$/,r.answer).slice(1).map(num);assert.equal(n/d,8008);assert.equal(q,808);assert.equal(String(n/d).match(/0/g).length,String(q).match(/0/g).length+1);sourceZeroGuards++;break;}
 case 'quotient-containing-zero':{const vals=r.options.map(o=>{const [n,d]=pair(o);assert.equal(n%d,0);return n/d;});assert.deepEqual(r.options.filter((_,j)=>String(vals[j]).includes('0')),[r.answer]);sourceZeroGuards++;break;}
 case 'four-digit-quotient-choice':{assert.deepEqual(r.options.filter(o=>{const [n,d]=pair(o);return Math.floor(n/d)>=1000&&Math.floor(n/d)<=9999;}),[r.answer]);break;}
 case 'reconstruct-near-divisor-remainder':case 'reconstruct-largest-remainder':{const [d,q]=take(/(?:Бөлгіш|Санды) (\d+)[\s\S]*?бөлінді (\d[\d ]*),/,s).slice(1).map(num),n=num(r.answer);assert.equal(n%d,d-1);assert.equal(Math.floor(n/d),q);assert(String(q).slice(1,-1).includes('0'));if(r.options)assert.deepEqual(r.options.filter(o=>Math.floor(num(o)/d)===q&&num(o)%d===d-1),[r.answer]);sourceZeroGuards++;break;}
 case 'reverse-operation-chain':{const [m,a,d,y]=take(/санды (\d+) санына көбейтіп, (\d+) санын қосты\. Нәтижені (\d+) санына бөлгенде (\d+)/,s).slice(1).map(Number),good=[];for(let x=1;x<=y*d;x++)if((x*m+a)/d===y)good.push(x);assert.deepEqual(good,[+r.answer]);fullRemainderCases+=y*d;break;}
 case 'minimum-bus-trips':{const [cap,n]=take(/ең көп (\d+) адам тасиды\. (\d[\d ]*) туристі/,s).slice(1).map(num),trips=+r.answer;assert((trips-1)*cap<n&&trips*cap>=n);break;}
 case 'leading-digit-quotient-length':{const [tail,d,length]=take(/□(\d{4}) : (\d+)[\s\S]*?Бүтін бөлінді (\d+)/,s).slice(1).map(Number),good=[];for(let lead=1;lead<=9;lead++){fullDigitCases++;if(String(Math.floor((lead*10000+tail)/d)).length===length)good.push(lead);}assert.equal(good.join(', '),r.answer);assert.deepEqual(good,[1,2,3,4,5,6]);break;}
 case 'weekday-after-days':{const days=['дүйсенбі','сейсенбі','сәрсенбі','бейсенбі','жұма','сенбі','жексенбі'],m=take(/Бүгін (\S+)\. Дәл (\d[\d ]*) күннен/,s);let day=days.indexOf(m[1]);for(let n=0;n<num(m[2]);n++)day=(day+1)%7;assert.equal(days[day],r.answer);break;}
 case 'four-digit-reversal':{const factor=+take(/санды (\d+) санына/,s)[1],good=[];for(let n=1000;n<=9999;n++){fullDigitCases++;const a=String(n),b=String(n*factor);if(b.length===4&&a===b.split('').reverse().join(''))good.push(n);}assert.deepEqual(good,[+r.answer]);break;}
 case 'euclidean-quotient-remainder':{const [n,d]=take(/^(\d[\d ]*) санын (\d+)/,s).slice(1).map(num);let good=[];for(const o of r.options){const [q,rem]=take(/^(\d[\d ]*), қалдық (\d+)$/,o).slice(1).map(num);if(q*d+rem===n&&rem>=0&&rem<d)good.push(o);}assert.deepEqual(good,[r.answer]);const last=r.options.at(-1).match(/\d+/g).map(Number);assert.equal(last[0]*d+last[1],n);assert(last[1]>=d);break;}
 case 'two-carried-item-costs':{const [a,b,c,d]=take(/Әрқайсысы (\d[\d ]*) теңгеден (\d+) кітап және әрқайсысы (\d+) теңгеден (\d+) дәптер/,s).slice(1).map(num);assert.equal(a*b+c*d,+r.answer);break;}
 case 'zero-quotient-comparison':{const [n,d,right]=take(/^(\d[\d ]*) : (\d+) □ (\d[\d ]*)\./,s).slice(1).map(num);assert.equal(n,right*d);assert.equal(r.answer,'=');assert.equal(String(right)[1],'0');assert.equal(String(n).match(/0/g).length,2);sourceZeroGuards++;break;}
 default:assert.fail(k);
 }domains++;
}
let rejected=0,invalid=0;
for(const row of rows){for(const key of ['answer','statement','solution','options']){if(key==='options'&&!row.options)continue;const bad=structuredClone(row);bad[key]=key==='options'?[...row.options].reverse():row[key]+' altered';assert.throws(()=>verifyEdition(bad));rejected++;}const key=Object.keys(row.params).find(k=>typeof row.params[k]==='number');if(key){const changed=structuredClone(row);changed.params[key]++;assert.throws(()=>verifyEdition(changed));rejected++;const bad=structuredClone(row);bad.params[key]=-1;assert.throws(()=>{Object.assign(bad,renderEdition(bad));verifyEdition(bad);});invalid++;}}
const rem=structuredClone(rows.find(r=>r.modelId.endsWith('reconstruct-dividend')));rem.params.remainder=rem.params.divisor;assert.throws(()=>renderEdition(rem));invalid++;
const reverse=structuredClone(rows.find(r=>r.modelId.endsWith('four-digit-reversal')));reverse.params.multiplier=4;assert.throws(()=>renderEdition(reverse));invalid++;
console.log(JSON.stringify({fixtures:22,printedGivenDomains:domains,fullDigitCases,fullIntegerLedgerCases:fullRemainderCases,preservedSourceZeroGuards:sourceZeroGuards,tamperRejected:rejected,invalidParametersRejected:invalid,status:'passed'}));

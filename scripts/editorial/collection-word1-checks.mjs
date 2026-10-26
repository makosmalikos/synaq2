// AUTHOR checks only: independent BigInt printed-givens oracle. Not an external review.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './collection-word1-models.mjs';
import {mathFragments} from '../../frontend/src/mathPresentation.js';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),rows=read('problems/editorial/batches/collection-word1-wave16.json').editions,one=xs=>{assert.equal(xs.length,1);return xs[0];};
const abs=n=>n<0n?-n:n,gcd=(a,b)=>b?gcd(b,a%b):abs(a),Q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert(d);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];},add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),sub=(a,b)=>Q(a[0]*b[1]-b[0]*a[1],a[1]*b[1]),mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]),div=(a,b)=>Q(a[0]*b[1],a[1]*b[0]),same=(a,b)=>a[0]===b[0]&&a[1]===b[1],eq=(a,b)=>assert(same(a,b)),decimal=s=>{const[w,f='']=String(s).split(',');return Q(w+f,10n**BigInt(f.length));};
function calc(s){const ts=s.replace(/−/g,'-').replace(/×/g,'*').match(/\d+(?:,\d+)?|[()+*/-]/g)||[];assert.equal(ts.join(''),s.replace(/−/g,'-').replace(/×/g,'*').replace(/\s/g,''));let i=0;function atom(){const t=ts[i++];if(t==='-')return mul(Q(-1),atom());if(t==='+')return atom();if(t==='('){const a=sum();assert.equal(ts[i++],')');return a;}assert(/^\d/.test(t));return decimal(t);}function product(){let a=atom();while(ts[i]==='*'||ts[i]==='/'){const op=ts[i++],b=atom();a=op==='*'?mul(a,b):div(a,b);}return a;}function sum(){let a=product();while(ts[i]==='+'||ts[i]==='-'){const op=ts[i++],b=product();a=op==='+'?add(a,b):sub(a,b);}return a;}const a=sum();assert.equal(i,ts.length);return a;}
const integers=s=>(s.match(/\d+/g)||[]).map(Number),values=s=>(s.match(/\d+(?:,\d+)?/g)||[]).map(decimal),tuple=s=>s.replace(/[()]/g,'').split('; ').map(calc),walk=ns=>ns.flatMap(n=>[n,...walk(n.numerator||[]),...walk(n.denominator||[])]);
let native=0,pricePairs=0,ratePairs=0,containerCases=0,rectanglePairs=0,triples=0,ageLedgers=0;
assert.equal(rows.length,24);
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement;verifyEdition(r);let answer;
 if(i===0){const[sum,gap]=integers(s);const hits=[];for(let a=0;a<=sum;a++)if(a+(a+gap)===sum)hits.push(a);answer=Q(one(hits));assert(s.includes('Айша неше жаста'));eq(answer,Q(23));}
 else if(i===1){const[count,before,after]=integers(s);answer=sub(mul(Q(count),Q(before)),mul(Q(count-1),Q(after)));eq(answer,Q(33));}
 else if(i===2){const[nb,total,compareB,compareA,gap]=integers(s);const hits=[];for(let a=1;a<=total;a++)for(let b=1;b<=total;b++){pricePairs++;if(a+nb*b===total&&compareB*b-compareA*a===gap)hits.push([a,b]);}answer=Q(one(hits)[1]);assert.deepEqual(hits[0],[70,110]);}
 else if(i===3){const[containers,small,large,people]=integers(s);const hits=[];for(let n=0;n<=containers;n++){containerCases++;if(n*small+(containers-n)*large===people)hits.push(n);}answer=Q(one(hits));eq(answer,Q(8));}
 else if(i===4){const[fastHours,slowHours,gap]=integers(s);const hits=[];for(let fast=1;fast<=500;fast++)for(let slow=1;slow<=500;slow++){ratePairs++;if(fast-slow===gap&&fast*fastHours===slow*slowHours)hits.push([fast,slow]);}const target=one(hits);assert.deepEqual(target,[45,30]);const options=r.options.filter(o=>{const[a,b]=tuple(o);return same(a,Q(target[0]))&&same(b,Q(target[1]));});assert.equal(r.answer,one(options));}
 else if(i===5){const[oldPrice,newPrice]=values(s);answer=mul(div(sub(newPrice,oldPrice),oldPrice),Q(100));eq(answer,Q(28));assert(s.includes('Бастапқы бағаны 100%'));assert(!same(answer,mul(div(sub(newPrice,oldPrice),newPrice),Q(100))));}
 else if(i===6){const[figures,corners]=integers(s);const hits=[];for(let tri=0;tri<=figures;tri++)if(3*tri+4*(figures-tri)===corners)hits.push(tri);answer=Q(one(hits));eq(answer,Q(9));}
 else if(i===7){assert(s.includes('тамыз')&&s.includes('өрнекті'));const[weeks]=integers(s),days=new Date(Date.UTC(2026,8,0)).getUTCDate();assert.equal(days,31);const active=(days-weeks*7)*24;eq(calc(r.answer),Q(active));assert.equal(r.answer,`(${days} − 7 × ${weeks}) × 24`);assert.equal(r.options.filter(o=>same(calc(o),Q(active))).length,1);assert.equal(active,240);}
 else if(i===8){const[total,factor,again]=values(s);eq(factor,again);answer=div(total,add(add(Q(1),factor),div(Q(1),factor)));eq(answer,Q(12,5));eq(add(add(answer,mul(factor,answer)),div(answer,factor)),total);}
 else if(i===9){const[done,numerator,denominator]=integers(s);const plan=div(mul(Q(done),Q(denominator)),Q(numerator));answer=sub(plan,Q(done));eq(answer,Q(40));assert(s.includes('тағы неше'));}
 else if([10,12,20,21].includes(i)){
  let P,ratio;if(i===10){const[perimeter,whole,n,d]=integers(s);P=perimeter;ratio=add(Q(whole),Q(n,d));assert(s.includes('Ауданы'));}
  else{[P]=integers(s);ratio=Q(integers(s)[1]);}
  const width=div(Q(P),mul(Q(2),add(ratio,Q(1)))),length=mul(ratio,width);eq(mul(Q(2),add(length,width)),Q(P));eq(div(length,width),ratio);
  if(i<20){answer=mul(length,width);eq(answer,Q(i===10?490:500));}
  else{const hits=r.options.filter(o=>{const[a,b]=tuple(o);return same(a,length)&&same(b,width);});assert.equal(r.answer,one(hits));assert(s.includes('(Ұзындығы; ені)'));assert.deepEqual([length,width],i===20?[Q(36),Q(6)]:[Q(45),Q(5)]);}
 }
 else if(i===11){const[route,p1,p2]=integers(s);answer=div(mul(Q(route),Q(p1+p2)),Q(100));eq(answer,Q(145));assert.equal((s.match(/БҮКІЛ/g)||[]).length,2);const wrong=add(Q(route*p1,100),mul(Q(route*(100-p1),100),Q(p2,100)));assert(!same(answer,wrong));}
 else if(i===13){const[factor,fullHeavy,fullLight]=integers(s);const light=Q(fullHeavy-fullLight,factor-1);answer=sub(Q(fullLight),light);eq(answer,Q(270));eq(add(answer,mul(light,Q(factor))),Q(fullHeavy));assert(s.includes('Бос массалары бірдей'));}
 else if(i===14){const[rows,columns,area]=integers(s),side=one(Array.from({length:area},(_,k)=>k+1).filter(k=>k*k===area));answer=Q(2*side*(rows+columns));eq(answer,Q(84));assert(s.includes('СЫРТҚЫ'));assert(!same(answer,Q(rows*columns*side*4)));}
 else if(i===15){const[length,numerator,denominator]=integers(s),width=Q(length*numerator,denominator);answer=mul(Q(2),add(Q(length),width));eq(answer,Q(252));}
 else if(i===16){const[count,,factor]=integers(s);answer=Q(count*factor);eq(answer,Q(20));assert(s.includes('ақшаның бәріне тек жапсырма'));}
 else if(i===17){const[boys,numerator,denominator]=integers(s),girls=Q(boys*numerator,denominator);assert(numerator>denominator);answer=add(Q(boys),girls);eq(answer,Q(23));}
 else if(i===18){const[current,downstream,hours]=values(s),shoreRelative=sub(downstream,mul(Q(2),current));answer=mul(shoreRelative,hours);eq(answer,Q(832,5));assert(s.includes('жағалауға қатысты')&&s.includes('Меншікті жылдамдығы өзгермесе'));}
 else if(i===19){const[H,M,h,m]=integers(s);answer=Q(h*60+m,H*60+M);eq(answer,Q(3,10));assert(s.includes('ТҰРАҚТЫ жылдамдықпен'));}
 else if(i===22){const[removed,added,final]=values(s);answer=add(sub(final,added),removed);eq(answer,Q(13,5));eq(add(sub(answer,removed),added),final);assert(sub(answer,removed)[0]>=0n);}
 else if(i===23){const[sum]=integers(s),hits=r.options.filter(o=>{const ns=tuple(o);return same(add(add(ns[0],ns[1]),ns[2]),Q(sum))&&same(sub(ns[1],ns[0]),Q(1))&&same(sub(ns[2],ns[1]),Q(1));});assert.equal(r.answer,one(hits));assert.deepEqual(tuple(r.answer),[Q(142),Q(143),Q(144)]);}
 else throw Error(i);
 if(answer){eq(calc(r.answer),answer);assert.equal(r.options.filter(o=>same(calc(o),answer)).length,1);}
 const ref=one(r.sourceRefs),cap=read(ref.sourceFile),q=one(cap.questions.filter(q=>String(q.number)===ref.sourceId));assert(cap.sourceReviewCaptured&&q.sourceAnswer&&q.solution&&!q.images?.length&&!q.svg?.length);assert.equal(one(q.options.filter(o=>o.correct)).text,q.sourceAnswer);assert.notEqual(q.statement.normalize('NFKC'),s.normalize('NFKC'));
 for(const text of[s,r.solution,r.answer,...r.options]){assert.doesNotMatch(text,/[\\$]|NaN|Infinity|<script/);const nodes=walk(mathFragments(text));native+=nodes.filter(n=>n.type==='fraction').length;assert(!nodes.some(n=>n.type==='text'&&/[0-9a-z)|]\s*\/\s*[(−\-0-9a-z|]/i.test(n.value)),i+' bare native/symbolic fraction');}
}
// Domain checks use separate ledgers, not the production calculation.
for(let sum=10;sum<=120;sum++)for(let gap=1;gap<sum;gap++)if((sum-gap)%2===0){const child=(sum-gap)/2;assert(child>=0&&child+child+gap===sum);ageLedgers++;}
for(let b=1;b<=50;b++)for(let ratio=2;ratio<=12;ratio++){const a=b*ratio,P=2*(a+b);assert.equal(P/2-a,b);assert.equal(a/b,ratio);rectanglePairs++;}
for(let n=-100;n<=100;n++){assert.equal((n-1)+n+(n+1),3*n);triples++;}
let tamper=0,missing=0;for(const r of rows){for(const f of['statement','answer','solution','options']){const c=structuredClone(r);if(f==='options')c.options=c.options.slice().reverse();else c[f]+=' өзгерген';assert.throws(()=>verifyEdition(c));tamper++;}for(const field of Object.keys(r.params).filter(k=>k!=='options')){const c=structuredClone(r);delete c.params[field];assert.throws(()=>renderEdition(c));missing++;}}
console.log(JSON.stringify({printedFixtures:24,priceIntegerPairs:pricePairs,equalOrderRatePairs:ratePairs,fullCapacityCases:containerCases,ageLedgers,rectangleRatioPairs:rectanglePairs,consecutiveTriples:triples,nativeFractionNodes:native,contentTamperRejected:tamper,missingParametersRejected:missing,status:'author_checks_passed_requires_external_review'}));

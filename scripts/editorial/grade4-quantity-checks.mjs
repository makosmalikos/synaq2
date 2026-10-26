/** Author checks: printed-given arithmetic/oracles, not an independent editorial signature. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {verifyEdition,renderEdition} from './grade4-quantity-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-quantity-wave16.json',import.meta.url))).editions;
const num=s=>Number(s.replaceAll(' ','')),suffix=r=>r.editionId.replace('grade4-quantity-',''),kind=r=>r.modelId.replace('grade4-quantity-','');
const expected=['3350','275 а','1 050 м²','125','520 дм²','100 м²','2 м² = 2 000 дм²','62','120','16','800','54000','40 750 м²','480 дм³ − 70 000 см³','665765','4 сағ','63 сотық','1200','90','6 есе','72','В','6','22500','81 600','15 сағ','1 650 см³','55','59','1800'];
assert.equal(rows.length,30);for(let i=0;i<rows.length;i++){assert.equal(rows[i].answer,expected[i]);assert.equal(verifyEdition(rows[i]).answer,expected[i]);}
// Independent SI parser uses millimetres, mm² and mm³, unlike the renderer's
// cm² area base. Parse actual printed givens/choices; never consume params here.
const lengthScale={мм:1,см:10,дм:100,м:1000,км:1000000};
function quantity(s){const m=/^([\d ]+)\s*(мм³|см³|дм³|м³|см²|дм²|м²|км²|а|га)$/.exec(s);assert(m,s);const n=num(m[1]),u=m[2];let value,dim;if(u==='а'||u==='га'){value=n*(u==='а'?100:10000)*1000000;dim=2;}else{dim=u.endsWith('³')?3:2;value=n*lengthScale[u.slice(0,-1)]**dim;}assert(Number.isSafeInteger(value));return {value,dim};}
const quantityPattern=/(\d[\d ]*)\s*(мм³|см³|дм³|м³|см²|дм²|м²|км²|а|га)/g;
const quantities=s=>[...s.matchAll(quantityPattern)].map(m=>quantity(m[0].trim()));
const qval=s=>quantity(s).value;
let printedDomains=0;
for(const r of rows){const k=kind(r),s=r.statement;
 if(k==='cubic-smaller-difference'){
  const a=quantities(s);assert.equal(a.length,2);assert(a.every(q=>q.dim===3));const m=/− [\d ]+ (мм³|см³)/.exec(s);assert(m);const divisor=qval('1 '+m[1]);assert.equal((a[0].value-a[1].value)/divisor,num(r.answer.split(/ [а-я]/)[0]));printedDomains++;
 }
 if(k==='hectare-are-difference'||k==='square-metres-plus-ares'||k==='square-metres-plus-hectares'){
  const a=quantities(s);assert.equal(a.length,2);const wanted=k==='hectare-are-difference'?a[0].value-a[1].value:a[0].value+a[1].value;
  assert.deepEqual(r.options.filter(o=>qval(o)===wanted),[r.answer]);printedDomains++;
 }
 if(k==='greatest-square-area'){
  const all=r.options.map(qval),max=Math.max(...all);assert.equal(all.filter(v=>v===max).length,1);assert.equal(qval(r.answer),max);printedDomains++;
 }
 if(k==='incorrect-unit-equality'){
  const bad=r.options.filter(o=>{const [a,b]=o.split(' = ').map(quantity);assert.equal(a.dim,b.dim);return a.value!==b.value;});assert.deepEqual(bad,[r.answer]);assert.equal(r.intentionalIncorrectExample,true);assert(/әдейі қате/.test(s));printedDomains++;
 }
 if(k==='cubic-metre-scalar-division'){
  const m=/^(\d+) м³ көлем (\d+) бірдей/.exec(s);assert(m);assert.equal(Number(m[1])*1000/Number(m[2]),Number(r.answer));printedDomains++;
 }
 if(k==='bracket-cubic-volume-division'){
  const m=/^\((\d+) м³ − (\d+) дм³\) : (\d+)/.exec(s);assert(m);assert.equal((+m[1]*1000-+m[2])/+m[3],Number(r.answer));printedDomains++;
 }
 if(k==='mixed-mass-bag-count'){
  const m=/([\d]+) т ([\d]+) кг[\s\S]*?әрқайсысы ([\d]+) кг/.exec(s);assert(m);assert.equal((+m[1]*1000 + +m[2])/+m[3],Number(r.answer));printedDomains++;
 }
 if(k==='sum-mixed-durations'){
  const m=/(\d+) сағ (\d+) мин, Дамир (\d+) мин/.exec(s);assert(m);const target=+m[1]*60 + +m[2] + +m[3];
  const minutes=o=>{const z=/^(\d+) сағ(?: (\d+) мин)?$/.exec(o);assert(z);return +z[1]*60 + +(z[2]||0);};assert.deepEqual(r.options.filter(o=>minutes(o)===target),[r.answer]);printedDomains++;
 }
 if(k==='future-age-ratio'){
  const m=/қазір (\d+), баласы (\d+) жаста[\s\S]*?жасынан (\d+) есе/.exec(s);assert(m);const hits=[];for(let t=1;t<=100;t++)if(+m[1]+t===(+m[2]+t)*+m[3])hits.push(t);assert.deepEqual(hits,[Number(r.answer)]);printedDomains++;
 }
 if(k==='future-age-sum'){
  const m=/^(\d+) жыл бұрын Аяулым (\d+) жаста, анасы (\d+) жаста[\s\S]*?Бүгіннен (\d+) жыл/.exec(s);assert(m);const [ago,c,p,after]=m.slice(1).map(Number);const current=[c+ago,p+ago],future=current.map(v=>v+after);assert.equal(future.reduce((a,b)=>a+b,0),Number(r.answer));printedDomains++;
 }
 if(k==='constant-age-gap'){
  const m=/^(\d+) жыл бұрын Саян (\d+), атасы (\d+) жаста[\s\S]*?Бүгіннен (\d+) жыл/.exec(s);assert(m);const [ago,c,g,after]=m.slice(1).map(Number);const pastGap=g-c,futureGap=(g+ago+after)-(c+ago+after);assert.equal(pastGap,futureGap);assert.equal(futureGap,Number(r.answer));printedDomains++;
 }
 if(k==='single-worker-proportion'){
  const m=/Ермек (\d+) сағатта (\d+) сотық[\s\S]*?қарқынмен (\d+) сағатта/.exec(s);assert(m);const rate=+m[2]/+m[1],want=rate*+m[3];assert.equal(want,num(r.answer.replace(' сотық','')));printedDomains++;
 }
 if(k==='worker-hour-productivity'){
  const m=/^(\d+) бағбан (\d+) сағатта (\d+) сотық[\s\S]*?істейді\. (\d+) бағбан (\d+) сағатта/.exec(s);assert(m);const [w,h,a,nw,nh]=m.slice(1).map(Number);assert.equal(a*nw*nh/(w*h),Number(r.answer));printedDomains++;
 }
 if(k==='scaled-square-sum'){
  const m=/^1² \+ 2² \+ … \+ (\d+)² = (\d+) екені берілген\. (\d+)² \+ (\d+)² \+ … \+ (\d+)²/.exec(s);assert(m);const [last,given,first,second,end]=m.slice(1).map(Number);assert.equal(second,2*first);assert.equal(end,first*last);let small=0,large=0;for(let a=1;a<=last;a++){small+=a*a;large+=(a*first)**2;}assert.equal(small,given);assert.equal(large,num(r.answer));assert.notEqual(large,given*first);printedDomains++;
 }
 if(k==='closest-area-ratio'){
  const m=/аудандары ([\d ]+) км² және ([\d ]+) км²/.exec(s);assert(m);const ratio=num(m[1])/num(m[2]),choices=r.options.map(o=>Number(o.split(' ')[0]));const d=choices.map(x=>Math.abs(x-ratio)),min=Math.min(...d);assert.equal(d.filter(x=>x===min).length,1);assert.equal(choices[d.indexOf(min)]+' есе',r.answer);printedDomains++;
 }
 if(k==='sotyk-definition'){
  // The retained unit definition is a10m×10m square, not a novel number.
  assert(/Бір сотықтың/.test(s));assert.deepEqual(r.options.filter(o=>qval(o)===10*1000*10*1000),[r.answer]);printedDomains++;
 }
 if(k==='same-unit-area-gap'){
  const q=[...s.matchAll(/(\d[\d ]*) км²/g)].map(m=>num(m[1]));assert.equal(q.length,2);assert.equal(q[0]-q[1],Number(r.answer));printedDomains++;
 }
 if(k==='greatest-plot-value'){
  const m=/аудандары: (\d+) га; (\d+) а; ұзындығы (\d+) м, ені (\d+) м тіктөртбұрыш; ([\d ]+) м²/.exec(s);assert(m);const [ha,a,l,w,m2]=m.slice(1).map(num),vals=[ha*10000,a*100,l*w,m2];assert.equal(Math.max(...vals),Number(r.answer));assert.equal(vals.filter(v=>v===Number(r.answer)).length,1);printedDomains++;
 }
 if(k==='greatest-labelled-plot'){
  const m=/А — (\d+) га (\d+) а; Б — (\d+) а; В — (\d+) м × (\d+) м тіктөртбұрыш; Г — ([\d ]+) м²/.exec(s);assert(m);const [ha,a,b,l,w,m2]=m.slice(1).map(num),vals=[ha*10000+a*100,b*100,l*w,m2],best=Math.max(...vals);assert.equal(vals.filter(v=>v===best).length,1);assert.equal(['А','Б','В','Г'][vals.indexOf(best)],r.answer);assert.equal(best-m2,100);printedDomains++;
 }
 if(k==='greatest-volume-expression'){
  const vals=r.options.map(o=>{
   // Each printed option has exactly one scalar division or two volume terms.
   if(o.includes(' : ')){const [q,d]=o.split(' : ');return qval(q)/Number(d);}
   const parts=o.split(/ (\+|−) /);assert.equal(parts.length,3);const a=qval(parts[0]),b=qval(parts[2]);return parts[1]==='+'?a+b:a-b;
  });assert.deepEqual(vals.map(v=>v/1000000),[400,405,410,400]);const best=Math.max(...vals);assert.equal(vals.filter(v=>v===best).length,1);assert.equal(r.options[vals.indexOf(best)],r.answer);printedDomains++;
 }
 if(k==='combined-tractor-rate'){
  const m=/сағатына (\d+) сотық, екіншісі (\d+) сотық[\s\S]*?жұмыс істесе, (\d+) га/.exec(s);assert(m);const [a,b,ha]=m.slice(1).map(Number);const hits=[];for(let t=1;t<=100;t++)if(t*a+t*b===ha*100)hits.push(t);assert.deepEqual(hits,[Number(r.answer.split(' ')[0])]);printedDomains++;
 }
}
// Independent complete integer side domains (not Math.sqrt) and all options.
let sideDomains=0;
for(const r of rows){const k=kind(r),s=r.statement;let area,answer;
 if(k==='square-side-area-hectares'){const side=Number(/қабырғасы (\d+) м/.exec(s)[1]);area=side*side;answer=area/10000;}
 else if(k==='square-area-perimeter'){area=Number(/ауданы (\d+) га/.exec(s)[1])*10000;const sides=[];for(let a=1;a<=1000;a++)if(a*a===area)sides.push(a);assert.equal(sides.length,1);answer=4*sides[0];}
 else if(k==='equal-area-square-perimeter'){const m=/Ұзындығы (\d+) см, ені (\d+) см/.exec(s);area=+m[1]*+m[2];const sides=[];for(let a=1;a<=area;a++)if(a*a===area)sides.push(a);assert.equal(sides.length,1);answer=4*sides[0];assert.notEqual(answer,2*(+m[1]+ +m[2]));}
 else if(k==='square-land-subdivision'){const m=/Ауданы (\d+) км²[\s\S]*?қабырғасы (\d+) м/.exec(s);area=+m[1]*1000000;const side=+m[2];answer=area/(side*side);const container=[];for(let a=1;a<=10000;a++)if(a*a===area)container.push(a);assert.equal(container.length,1);assert.equal(container[0]%side,0);assert.equal((container[0]/side)**2,answer);}
 else if(k==='rectangle-area-perimeter'){const m=/ұзындығы (\d+) м, ауданы (\d+) га/.exec(s);const l=+m[1];area=+m[2]*10000;let hits=[];for(let w=1;w<=1000;w++)if(l*w===area)hits.push(w);assert.equal(hits.length,1);answer=2*(l+hits[0]);}
 else continue;
 assert.equal(String(answer),r.answer);sideDomains++;
}
let rejected=0;
for(const row of rows){for(const field of ['answer','statement','solution','options']){if(field==='options'&&!row.options)continue;const bad=structuredClone(row);bad[field]=field==='options'?[...row.options].reverse():row[field]+' altered';assert.throws(()=>verifyEdition(bad));rejected++;}
 const key=Object.keys(row.params).find(k=>typeof row.params[k]==='number');if(key){const bad=structuredClone(row);bad.params[key]++;assert.throws(()=>verifyEdition(bad));rejected++;}}
let invalid=0;for(const row of rows){const key=Object.keys(row.params).find(k=>typeof row.params[k]==='number');if(!key)continue;const bad=structuredClone(row);bad.params[key]=-1;assert.throws(()=>{Object.assign(bad,renderEdition(bad));verifyEdition(bad);});invalid++;}
console.log(JSON.stringify({fixtures:rows.length,printedSIAndAgeRateDomains:printedDomains,completeSquareRectangleSideDomains:sideDomains,tamperRejected:rejected,invalidParametersRejected:invalid,status:'passed'}));

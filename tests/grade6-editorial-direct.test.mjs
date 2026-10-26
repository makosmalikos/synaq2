import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {verifyEdition} from '../scripts/editorial/grade6-direct-models.mjs';
import {mathFragments} from '../frontend/src/mathPresentation.js';
const rows=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-direct.json',import.meta.url))).editions;
const row=k=>{const a=rows.filter(r=>r.modelId==='grade6-direct-'+k);assert.equal(a.length,1);return a[0];};
const keys=['24','(6/x) = (1800/3300)','72','540','Теңқабырғалы үшбұрыштың қабырғасы мен периметрі','11','280','5 есе артады','y = 9x','22','210','(11/4)','308','x: 1, 2, 4; y: 8, 16, 32','7 есе артады','(y₁/y₂) = (x₁/x₂)','3,9 кг','60%','1,75 есе','525','20','k = 54; тұрақты жылдамдық (км/сағ)','52','0,6 кВт·сағ','25,2','4','2040','4,5 кг','10,5 л','9','49','Жоқ: бір килограмм 350 теңге және 330 теңге','9 кг','2 сағ','(3/4)','7,2 м','60','36','70','320','7,2 м','20','5','10,5','(18; 12)','5','4 есе артады','138600','2,25 кг күріш; 10 сәбіз','184','1,75 есе кемиді','16','17:41','4,5'];
const gcd=(a,b)=>b?gcd(b,a%b):(a<0n?-a:a);
const Q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert.notEqual(d,0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];};
const parse=t=>{t=String(t).trim().replace(',','.');if(/^\(-?\d+\/\d+\)$/.test(t))return Q(...t.slice(1,-1).split('/'));if(/^-?\d+\/\d+$/.test(t))return Q(...t.split('/'));assert.match(t,/^-?\d+(?:\.\d+)?$/);const neg=t.startsWith('-'),[w,f='']=t.replace('-','').split('.');return Q((neg?-1n:1n)*BigInt(w+f),10n**BigInt(f.length));};
const add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),sub=(a,b)=>add(a,[-b[0],b[1]]),mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]),div=(a,b)=>Q(a[0]*b[1],a[1]*b[0]);
const equal=(a,b)=>a[0]*b[1]===b[0]*a[1];

test('all54 manually recalculated keys and every saved nonvisual source are addressed exactly once',()=>{
 assert.equal(rows.length,54);assert.deepEqual(rows.map(r=>r.answer),keys);const refs=[];
 for(const level of ['1','2','3','test']){const q=JSON.parse(fs.readFileSync(new URL('../problems/sources/zerek/courses/6-math-1-5-level'+level+'.json',import.meta.url))).questions;refs.push(...q.map(r=>r.id));}
 assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(x=>x.sourceId)).sort(),refs.sort());
 for(const r of rows){assert.equal(r.grade,6);assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'draft');verifyEdition(r);if(r.options){assert.equal(r.options.filter(o=>o===r.answer).length,1);}else assert.match(r.statement,/Жауапты тек санмен жазыңыз\.$/);assert.doesNotMatch([r.statement,r.solution,r.answer,...(r.options||[])].join(' '),/[\\$]|\[Image:/);}
});

test('numeric MCQs use exact actual printed fractions and units with a single correct value',()=>{
 for(const k of ['coefficient-ratio','homogeneous-mass','fixed-width-percent','decimal-growth-factor','lamp-energy','processing-remainder','water-syrup','alloy-difference','fraction-forward','second-cable-length','same-sun-shadows','proportional-increments']){const r=row(k);const strip=s=>s.replace(/(?: кг| м| л| кВт·сағ| есе|%)$/,'');const a=parse(strip(r.answer));assert.equal(r.options.filter(o=>equal(parse(strip(o)),a)).length,1,k);}
 assert.deepEqual(parse('(27/14)'),[27n,14n]);assert.deepEqual(parse('17,578125'),[1125n,64n]);
});

test('build-proportion options are tested at actual required mass and all ratios keep units paired',()=>{
 const r=row('build-proportion'),x=Q(11);const value=s=>s==='x'?x:parse(s);
 const trueOptions=r.options.filter(o=>{const m=/^\((\d+|x)\/(\d+|x)\) = \((\d+|x)\/(\d+|x)\)$/.exec(o);assert.ok(m);return equal(div(value(m[1]),value(m[2])),div(value(m[3]),value(m[4])));});assert.deepEqual(trueOptions,[r.answer]);
 assert.match(row('meaning-speed').answer,/54;.*км\/сағ/);assert.match(row('seconds-to-minutes').solution,/2 мин = 120 с/);
});

test('direct tables test every ratio, and multi-step proportional composition changes output once',()=>{
 const r=row('direct-table');const valid=r.options.filter(o=>{const m=/^x: (.+); y: (.+)$/.exec(o);assert.ok(m);const xs=m[1].split(', ').map(parse),ys=m[2].split(', ').map(parse);return xs.every((x,i)=>equal(div(ys[i],x),div(ys[0],xs[0])));});assert.deepEqual(valid,[r.answer]);
 assert.equal(row('composition-factor').answer,'4 есе артады');assert.equal(row('successive-factors').answer,'1,75 есе кемиді');
});

test('package minimum is a ceiling over exact required mass, not nearest or downward rounding',()=>{
 const p=row('paint-packages').params,need=div(mul(parse(p.mass),parse(p.target)),parse(p.area));assert.deepEqual(need,Q(284,25));
 const enough=n=>BigInt(n*p.package)*need[1]>=need[0];assert.equal(enough(3),false);assert.equal(enough(4),true);assert.equal(row('paint-packages').answer,'4');
});

test('alloy difference, remaining journey and two-ingredient quantities preserve both parts',()=>{
 const p=row('alloy-difference').params,mass=Q(9),copper=mul(mass,div(parse(p.copper),parse(p.mass))),zinc=sub(mass,copper);assert.deepEqual(sub(copper,zinc),parse(p.difference));
 const share=parse(row('remaining-journey').params.fraction);assert.ok(equal(div(Q(90),add(Q(90),Q(120))),share));assert.equal(row('remaining-journey').answer,'2 сағ');
 assert.equal(row('two-ingredients').answer,'2,25 кг күріш; 10 сәбіз');assert.equal(2250/15,900/6);assert.equal(10/15,4/6);
});

test('added solute increases the denominator and scale error remains multiplicative',()=>{
 const p=row('added-solute').params,solute=add(div(mul(parse(p.mass),parse(p.percent)),Q(100)),parse(p.added)),total=add(parse(p.mass),parse(p.added));assert.ok(equal(mul(div(solute,total),Q(100)),Q(36)));assert.ok(!equal(mul(div(solute,parse(p.mass)),Q(100)),Q(36)));
 const s=row('proportional-scale-error').params,trueTotal=mul(parse(s.totalDisplay),div(parse(s.actual),parse(s.display)));assert.deepEqual(sub(trueTotal,parse(s.known)),Q(5));assert.ok(!equal(sub(parse(s.totalDisplay),parse(s.known)),Q(5)));
});

test('both moving clock hands and fractional-day clock loss use complete elapsed time',()=>{
 const p=row('clock-angle').params,difference=Math.abs(6*p.minute-(30*p.hour+p.minute/2));assert.equal(Math.min(difference,360-difference),70);
 const start=new Date('2026-10-20T09:00:00Z'),end=new Date('2026-10-22T18:00:00Z'),hours=(end-start)/3600000;assert.equal(hours,57);assert.equal(hours*8/24,19);assert.equal(row('losing-clock').answer,'17:41');
});

test('delayed second worker includes solo stage and candles solve within the shared live interval',()=>{
 const p=row('delayed-worker').params;assert.equal(p.firstArea/p.firstHours*16+p.secondArea/p.secondHours*12,p.total);assert.equal(row('delayed-worker').answer,'16');
 const c=row('two-candles').params;const good=[];for(let half=0;half<2*c.second;half++){const t=Q(half,2),a=sub(Q(1),div(t,parse(c.first))),b=sub(Q(1),div(t,parse(c.second)));if(equal(a,mul(parse(c.ratio),b)))good.push(t);}
 assert.deepEqual(good,[Q(9,2)]);assert.equal(row('two-candles').answer,'4,5');
});

test('native corresponding-value fractions preserve subscripts without displaying raw source markup',()=>{
 const r=row('general-ratio');assert.deepEqual(mathFragments(r.answer),[{type:'fraction',numerator:[{type:'text',value:'y₁'}],denominator:[{type:'text',value:'y₂'}]},{type:'text',value:' = '},{type:'fraction',numerator:[{type:'text',value:'x₁'}],denominator:[{type:'text',value:'x₂'}]}]);
});

test('edits to any reviewed display field, wrong answer, or fixed parameter cannot silently retain proof',()=>{
 for(const r of rows){for(const field of ['statement','solution','answer']){const bad=structuredClone(r);bad[field]+=' changed';assert.throws(()=>verifyEdition(bad));}
  const bad=structuredClone(r);bad.params.extra=1;assert.throws(()=>verifyEdition(bad));if(r.options){const bad=structuredClone(r);bad.options[0]+=' changed';assert.throws(()=>verifyEdition(bad));}}
});

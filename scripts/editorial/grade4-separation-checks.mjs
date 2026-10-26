// Author checks only: external full source/content review is required.
import fs from'node:fs';import assert from'node:assert/strict';
import{verifyEdition,renderEdition}from'./grade4-separation-models.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),rows=read('problems/editorial/batches/grade4-separation-wave47.json').editions;
assert.equal(rows.length,39);const nums=s=>(s.match(/\d+/g)||[]).map(Number),one=xs=>{assert.equal(xs.length,1);return xs[0];};
const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`,dur=n=>`${Math.floor(n/60)} сағ ${n%60} мин`;
const keys=['6','q = u + w','576 км','130; 260; 390','4080','140 м','60','4800','5','Үнемі өседі','(58 + 72) × 4','160','13','280','2 сағ 30 мин','18','256','20','(x + 17) × 5 = 180','60 км/сағ','66 км','60 км/сағ және 60 км/сағ','28 км','4 сағ','68 км/сағ','30 км/сағ; 90 км/сағ','6','13','11:50','58','20','808','119','5','152 км/сағ','15','90 км','4','12:45'];
for(let i=0;i<rows.length;i++){
 const r=rows[i],n=nums(r.statement);verifyEdition(r);assert.equal(r.answer,keys[i]);let answer;
 switch(i){
 case 0:answer=n[1]/n[0];break;
 case 1:answer='q = u + w';assert(r.statement.includes('Оң жылдамдықтары'));break;
 case 2:answer=n[0]*n[1];break;
 case 3:answer=n.slice(2).map(t=>(n[0]+n[1])*t).join('; ');break;
 case 4:case 6:case 7:answer=(n[0]+n[1])*n[2];break;
 case 5:case 11:case 32:answer=n[0]+n[1];break;
 case 8:case 33:answer=n[2]/(n[0]+n[1]);break;
 case 9:answer='Үнемі өседі';assert(r.statement.includes('Оң тұрақты'));break;
 case 10:answer=`(${n[0]} + ${n[1]}) × ${n[2]}`;break;
 case 12:answer=n[2]/n[1]-n[0];break;
 case 13:answer=(n[1]-n[2])/n[0];break;
 case 14:answer=dur(n[2]*60/(n[0]+n[1]));assert.equal(n[2]*60/(n[0]+n[1]),150);break;
 case 15:answer=(n[0]+n[1])*n[2]*60/1000;assert(r.statement.includes('КИЛОМЕТР'));break;
 case 16:answer=n[0]*(n[1]+1)*n[2];break;
 case 17:answer=n[2]*1000/(n[0]+n[1]);break;
 case 18:answer=`(x + ${n[2]}) × ${n[0]} = ${n[1]}`;break;
 case 19:answer=n[1]/n[0]/2;assert(r.statement.includes('ӘР'));break;
 case 20:answer=(n[0]+n[1])/2;assert(r.statement.includes('ЖАРТЫ САҒАТ'));break;
 case 21:{const pairs=r.options.map(o=>nums(o)),distances=pairs.map(([a,b])=>(a+b)*n[0]),max=Math.max(...distances),idx=distances.indexOf(max);answer=one(r.options.filter((_,i)=>distances[i]===max));assert(!pairs[idx].includes(Math.max(...pairs.flat())));assert(r.solution.includes(`${idx+1}-нұсқа`));break;}
 case 22:answer=n[2]-n[0]*n[1];assert(r.statement.includes('КИЛОМЕТР'));break;
 case 23:answer=(n[0]-n[1])/n[2];break;
 case 24:answer=(n[1]-n[2])/(n[2]/n[0]);break;
 case 25:{const first=n[2]/n[1]/(n[0]+1),second=first*n[0];answer=`${first} км/сағ; ${second} км/сағ`;assert.equal(r.options.filter(o=>{const[a,b]=nums(o);return(a+b)*n[1]===n[2]&&b===a*n[0];}).length,1);break;}
 case 26:answer=(n[3]-n[2])/((n[2]-n[0])/n[1]);assert(r.statement.includes('ТАҒЫ'));break;
 case 27:{const times=[...r.statement.matchAll(/(\d{2}):(\d{2})/g)].map(m=>Number(m[1])*60+Number(m[2])),speeds=[...r.statement.matchAll(/(\d+) км\/сағ/g)].map(m=>Number(m[1])),distance=Number(one([...r.statement.matchAll(/Аралары (\d+) км/g)])[1]),lead=(times[1]-times[0])/60,after=(distance-speeds[0]*lead)/(speeds[0]+speeds[1]);answer=times[1]/60+after;assert(r.statement.includes('БҮТІН САҒАТ'));break;}
 case 28:{const time=one([...r.statement.matchAll(/(\d{2}):(\d{2})/g)]),speeds=[...r.statement.matchAll(/(\d+) км\/сағ/g)].map(m=>Number(m[1])),distance=Number(one([...r.statement.matchAll(/Аралары (\d+) км/g)])[1]);answer=clock(Number(time[1])*60+Number(time[2])+distance*60/(speeds[0]+speeds[1]));break;}
 case 29:answer=(n[1]/n[0]-n[2])/2;break;
 case 30:answer=(n[3]-n[1]*n[2])/(n[0]+n[2]);break;
 case 31:answer=n[0]*(n[3]-n[2])+n[1]*n[3];break;
 case 34:answer=n[1]/n[0];break;
 case 35:answer=(n[2]*1000+n[3])/(n[0]+n[1]);break;
 case 36:answer=(n[0]+n[1])*n[2]/60;assert.equal(n[2],30);break;
 case 37:answer=(n[3]-n[0]*n[1])/(n[0]+n[2]);assert(r.statement.includes('ФУРГОН ШЫҚҚАННАН'));break;
 case 38:{const time=one([...r.statement.matchAll(/(\d{2}):(\d{2})/g)]),speeds=[...r.statement.matchAll(/(\d+) км\/сағ/g)].map(m=>Number(m[1])),target=Number(one([...r.statement.matchAll(/Аралары (\d+) км/g)])[1]);answer=clock(Number(time[1])*60+Number(time[2])+(target-n[0])*60/(speeds[0]+speeds[1]));break;}
 default:throw Error(i);
 }
 if(typeof answer==='number'){assert(Number.isSafeInteger(answer)&&answer>0);if(r.options)assert.equal(one(r.options.filter(o=>nums(o)[0]===answer)),r.answer);else assert.equal(String(answer),r.answer);}else assert.equal(answer,r.answer);
 if(r.options)assert.equal(new Set(r.options).size,4);else assert(r.statement.endsWith('Жауапқа тек санды жазыңыз.'));
}
let domains=0,initial=0,delayed=0,stops=0;
for(let a=1;a<=40;a++)for(let b=1;b<=40;b++)for(let t=1;t<=10;t++){
 const first=-a*t,second=b*t,d=second-first;assert.equal(d,(a+b)*t);assert.equal(d/(a+b),t);assert.equal(d/t-a,b);domains++;
}
for(let gap=1;gap<=15;gap++)for(let rate=1;rate<=60;rate++)for(let observed=1;observed<=8;observed++)for(let more=1;more<=5;more++){
 const old=gap+rate*observed,target=old+rate*more;assert.equal((old-gap)/observed,rate);assert.equal((target-old)/rate,more);assert.equal((target-gap)/rate,observed+more);initial++;domains++;
}
for(let a=1;a<=20;a++)for(let b=1;b<=20;b++)for(let lead=1;lead<=5;lead++)for(let after=1;after<=8;after++){
 const distance=a*(lead+after)+b*after;assert.equal((distance-a*lead)/(a+b),after);assert.equal((distance-b*after)/(lead+after),a);delayed++;domains++;
}
for(let a=1;a<=20;a++)for(let b=1;b<=20;b++)for(let total=2;total<=10;total++)for(let pause=1;pause<total;pause++){
 const first=-a*(total-pause),second=b*total;assert.equal(second-first,(a+b)*total-a*pause);stops++;domains++;
}
const reject=f=>{let failed=false;try{f();}catch{failed=true;}assert(failed,'Invalid row accepted');};let tamper=0,missing=0;
for(const row of rows){
 for(const field of['statement','answer','solution',...(row.options?['options']:[])]){const r=structuredClone(row);if(field==='options')r.options=[...r.options].reverse();else r[field]+=' өзгертілген';reject(()=>verifyEdition(r));tamper++;}
 for(const key of Object.keys(row.params)){const r=structuredClone(row);delete r.params[key];reject(()=>renderEdition(r));missing++;}
}
const guards=[[0,'rate',125],[1,'firstSymbol','w'],[2,'rate',145],[3,'times',[1,2,4]],[4,'minutes',0],[5,'first',64],[6,'hours',0],[7,'second',0],[8,'distance',601],[9,'firstSymbol','w'],[10,'hours',0],[11,'first',0],[12,'distance',82],[13,'aircraftPath',3300],[14,'distance',504],[15,'first',91],[16,'factor',1],[17,'km',0],[18,'distance',181],[19,'distance',726],[20,'first',60],[21,'pairs',[[50,50],[60,40],[70,30],[80,20]]],[22,'distance',20],[23,'speedGap',25],[24,'firstPath',421],[25,'factor',1],[26,'target',1200],[27,'distance',128],[28,'distance',480],[29,'speedGap',128],[30,'distance',192],[31,'stopHours',6],[32,'first',0],[33,'distance',181],[34,'distance',761],[35,'metres',1000],[36,'minutes',60],[37,'distance',168],[38,'target',400]];
for(const[i,key,value]of guards){const r=structuredClone(rows[i]);r.params[key]=value;reject(()=>renderEdition(r));}
function arithmetic(t){assert(/^[\d\s()+×:−-]+$/.test(t));const ts=t.match(/\d+|[()+×:−-]/g);let i=0;function atom(){if(ts[i]==='('){i++;const x=sum();assert.equal(ts[i++],')');return x;}return Number(ts[i++]);}function prod(){let v=atom();while(['×',':'].includes(ts[i])){const op=ts[i++],w=atom();v=op==='×'?v*w:v/w;}return v;}function sum(){let v=prod();while(['+','−','-'].includes(ts[i])){const op=ts[i++],w=prod();v=op==='+'?v+w:v-w;}return v;}const n=sum();assert.equal(i,ts.length);return n;}
let chains=0;
for(const r of rows)for(const m of r.solution.split(/(?<=[.!?])\s+/).filter(part=>! /\bx\b/.test(part)).join(' ').replace(/\d{2}:\d{2}/g,'CLOCK').matchAll(/[0-9(][0-9\s+×:−()=\-]*/g)){
 const s=m[0].trim();if(!s.includes('=')||s.split('(').length!==s.split(')').length)continue;const ps=s.split('=');if(ps.some(x=>!x.trim()||/[+×:−-]\s*$/.test(x)))continue;const vs=ps.map(arithmetic);assert(vs.every(v=>v===vs[0]),s);chains++;
}
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),inventory=read('problems/editorial/batches/grade4-inventory.json').records,sourceStatements=new Set();
for(const f of new Set(inventory.map(r=>r.sourceFile)))for(const q of read(f).questions)sourceStatements.add(norm(q.statement));for(const r of rows)assert(!sourceStatements.has(norm(r.statement)));
console.log(JSON.stringify({printedFixtures:39,completeSignedSeparationDomainCases:domains,initialGapAdditionalTimeCases:initial,unequalDepartureLedgers:delayed,fullStopLedgers:stops,numericSolutionEqualityChains:chains,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

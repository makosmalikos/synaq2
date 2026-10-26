// Author checks only. Full independent source/content review remains required.
import fs from'node:fs';import assert from'node:assert/strict';
import{verifyEdition,renderEdition}from'./grade4-chapter-review-models.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),rows=read('problems/editorial/batches/grade4-chapter-review-wave48.json').editions;
assert.equal(rows.length,37);const nums=s=>(s.match(/\d+/g)||[]).map(Number),one=xs=>{assert.equal(xs.length,1);return xs[0];};
const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
const keys=['56063','1260','T = D : u','1900','55','4 сағ','168 км/сағ','230','6 сағ','9','(u + w) × T','13','44','6 сағ 15 мин','2 күн','256','35','450','6 сағ','108','4','432','55000','8 күн','D : (u − v)','72 км/сағ','26','300','3 сағ','36','750','235','360 мин','6','20400','760','11:20'];
for(let i=0;i<rows.length;i++){
 const r=rows[i],n=nums(r.statement);verifyEdition(r);assert.equal(r.answer,keys[i]);let answer;
 switch(i){
 case 0:answer=n[0]*n[1];assert(/^[1-9]00[1-9]$/.test(String(n[0])));assert(n[0]%10*n[1]>=10);assert.equal(Math.floor(answer/100)%10,0);break;
 case 1:answer=n[0]*(60/4);assert(r.statement.includes('ТӨРТТЕН БІР'));break;
 case 2:answer='T = D : u';assert(r.statement.includes('тұрақты оң'));break;
 case 3:answer=n[2]/(n[0]-n[1]);break;
 case 4:case 30:answer=(n[0]+n[1])*n[2];break;
 case 5:case 33:answer=n[0]/(n[1]+n[2]);break;
 case 6:answer=n[0]+n[1];assert(r.statement.includes('км/сағ?'));break;
 case 7:case 31:answer=n[1]/n[0];break;
 case 8:answer='6 сағ';assert(r.statement.includes('Тәулік')&&r.statement.includes('төрт тең')&&r.statement.includes('БІРЕУІ'));assert.equal(24/4,6);break;
 case 9:answer=n[2]/(n[0]+n[1]);break;
 case 10:answer='(u + w) × T';assert(r.statement.includes('қарама-қарсы жақтарға'));break;
 case 11:answer=n[0]/((n[0]-n[1])/n[2]);break;
 case 12:answer=n[1]/n[0]-n[2];break;
 case 13:answer=`${24/4} сағ ${60/4} мин`;assert(r.statement.includes('ҚОСЫНДЫСЫН'));break;
 case 14:answer=n[0]/(n[0]/n[1]*n[2]);break;
 case 15:answer=n[1]/n[0]*(n[0]+2*n[2]);break;
 case 16:answer=n[1]*n[2]/n[0];break;
 case 17:answer=n[0]*(n[1]+1)*n[2];break;
 case 18:answer=n[0]*n[1]/(n[2]-n[0]);assert(r.statement.includes('ЖЕҢІЛ КӨЛІК ШЫҚҚАННАН'));break;
 case 19:answer=n[2]/(n[0]-n[1])*n[1];break;
 case 20:answer=(n[1]/n[0])/(n[3]/n[2]);assert(r.statement.includes('ЕСЕ'));break;
 case 21:{const times=[...r.statement.matchAll(/(\d{2}):(\d{2})/g)].map(m=>Number(m[1])*60+Number(m[2])),speeds=[...r.statement.matchAll(/(\d+) км\/сағ/g)].map(m=>Number(m[1])),lead=(times[1]-times[0])/60,after=(n[0]-speeds[0]*lead)/(speeds[0]+speeds[1]);answer=speeds[0]*(lead+after);break;}
 case 22:answer=n[3]/(n[0]+n[1]+n[2])*n[1];assert(r.statement.includes('ЕКІНШІ'));break;
 case 23:answer=n[0]/(n[0]/n[1]+n[0]/n[2]);break;
 case 24:answer='D : (u − v)';assert(r.statement.includes('u > v')&&r.statement.includes('сол бағытта'));break;
 case 25:answer=2*n[0]/(n[0]/n[1]+n[0]/n[2]);assert.notEqual(answer,(n[1]+n[2])/2);break;
 case 26:answer=n[1]+(n[0]-n[2]*n[1])/(n[2]+n[3]);assert(r.statement.includes('БАРЛЫҒЫ'));break;
 case 27:answer=(n[0]+n[1])*n[2];assert(r.statement.includes('Кездесуге'));break;
 case 28:answer=2*n[0]/(n[1]+n[2]);assert(answer>n[0]/n[1]&&answer<n[0]/n[2]);assert(r.statement.includes('қайта кездеседі'));break;
 case 29:answer=n[0]*n[1]*n[2]/(n[1]-n[0]);break;
 case 32:answer='360 мин';assert(r.statement.includes('Тәулікті')&&r.statement.includes('МИНУТПЕН'));assert.equal(24/4*60,360);break;
 case 34:answer=n[2]/(n[0]-n[1])*n[0];break;
 case 35:answer=n[2]/(n[0]-n[1])*(n[0]+n[1]);break;
 case 36:{const times=[...r.statement.matchAll(/(\d{2}):(\d{2})/g)].map(m=>Number(m[1])*60+Number(m[2])),v=[...r.statement.matchAll(/(\d+) км\/сағ/g)].map(m=>Number(m[1]));answer=clock(times[1]+v[0]*(times[1]-times[0])/(v[1]-v[0]));break;}
 default:throw Error(i);
 }
 if(typeof answer==='number'){assert(Number.isSafeInteger(answer)&&answer>0);if(r.options)assert.equal(one(r.options.filter(o=>nums(o)[0]===answer)),r.answer);else assert.equal(String(answer),r.answer);}else assert.equal(answer,r.answer);
 if(r.options)assert.equal(new Set(r.options).size,4);else assert(r.statement.endsWith('Жауапқа тек санды жазыңыз.'));
}
let domains=0,carry=0,catchLedgers=0,roundTrips=0,turnarounds=0,joint=0;
for(let thousands=1;thousands<=9;thousands++)for(let units=1;units<=9;units++)for(let multiplier=2;multiplier<=9;multiplier++){
 if(units*multiplier<10)continue;const input=thousands*1000+units,result=input*multiplier;
 assert.equal(result,thousands*multiplier*1000+units*multiplier);assert.equal(Math.floor(result/100)%10,0);assert.equal(Math.floor(result/10)%10,Math.floor(units*multiplier/10));carry++;domains++;
}
for(let slow=1;slow<=40;slow++)for(let fast=slow+1;fast<=60;fast++)for(let lead=1;lead<=5;lead++){
 const gap=slow*lead;if(gap%(fast-slow))continue;const after=gap/(fast-slow);assert.equal(fast*after,slow*(after+lead));catchLedgers++;domains++;
}
for(let a=2;a<=50;a++)for(let b=1;b<a;b++)for(let distance=1;distance<=300;distance++){
 if(distance%a||distance%b)continue;const ta=distance/a,tb=distance/b,average=2*distance/(ta+tb);
 assert.equal(2*a*b*(ta+tb),2*distance*(a+b));assert(average>b&&average<a);assert(4*a*b<(a+b)*(a+b));roundTrips++;domains++;
}
for(let bike=2;bike<=30;bike++)for(let walker=1;walker<bike;walker++)for(let distance=1;distance<=200;distance++){
 if(distance%bike||distance%walker||2*distance%(bike+walker))continue;const turn=distance/bike,meet=2*distance/(bike+walker);assert(meet>turn&&meet<distance/walker);
 assert.equal(2*distance-bike*meet,walker*meet);turnarounds++;domains++;
}
for(let first=1;first<=40;first++)for(let second=1;second<=40;second++)for(let t=1;t<=8;t++){
 const work=(first+second)*t;assert.equal(work/(first+second),t);assert.equal(work/t-first,second);joint++;domains++;
}
const reject=f=>{let failed=false;try{f();}catch{failed=true;}assert(failed,'Invalid row accepted');};let tamper=0,missing=0;
for(const row of rows){
 for(const field of['statement','answer','solution',...(row.options?['options']:[])]){const r=structuredClone(row);if(field==='options')r.options=[...r.options].reverse();else r[field]+=' өзгертілген';reject(()=>verifyEdition(r));tamper++;}
 for(const key of Object.keys(row.params)){const r=structuredClone(row);delete r.params[key];reject(()=>renderEdition(r));missing++;}
}
const guards=[[0,'multiplicand',8019],[1,'hourMinutes',100],[2,'timeSymbol','u'],[3,'second',11],[4,'hours',0],[5,'distance',529],[6,'second',72],[7,'work',1841],[8,'parts',3],[9,'work',316],[10,'firstSymbol','w'],[11,'dayGap',5],[12,'first',96],[13,'hourMinutes',100],[14,'cows',3],[15,'leadHours',3],[16,'firstTarget',21],[17,'factor',1],[18,'fast',72],[19,'seatGap',55],[20,'firstDistance',289],[21,'secondHour',8],[22,'totalPay',176001],[23,'work',961],[24,'fastSymbol','v'],[25,'outward',60],[26,'work',360],[27,'hoursUntilMeeting',0],[28,'bike',6],[29,'fast',6],[30,'hours',0],[31,'work',1881],[32,'dayHours',25],[33,'distance',1057],[34,'second',12],[35,'first',68],[36,'fast',6]];
for(const[i,key,value]of guards){const r=structuredClone(rows[i]);r.params[key]=value;reject(()=>renderEdition(r));}
function arithmetic(t){assert(/^[\d\s()+×:−-]+$/.test(t));const ts=t.match(/\d+|[()+×:−-]/g);let i=0;function atom(){if(ts[i]==='('){i++;const x=sum();assert.equal(ts[i++],')');return x;}return Number(ts[i++]);}function prod(){let v=atom();while(['×',':'].includes(ts[i])){const op=ts[i++],w=atom();v=op==='×'?v*w:v/w;}return v;}function sum(){let v=prod();while(['+','−','-'].includes(ts[i])){const op=ts[i++],w=prod();v=op==='+'?v+w:v-w;}return v;}const n=sum();assert.equal(i,ts.length);return n;}
let chains=0;
for(const r of rows)for(const m of r.solution.split(/(?<=[.!?])\s+/).filter(part=>! /\bx\b/.test(part)).join(' ').replace(/\d{2}:\d{2}/g,'CLOCK').matchAll(/[0-9(][0-9\s+×:−()=\-]*/g)){
 const s=m[0].trim();if(!s.includes('=')||s.split('(').length!==s.split(')').length)continue;const ps=s.split('=');if(ps.some(x=>!x.trim()||/[+×:−-]\s*$/.test(x)))continue;const vs=ps.map(arithmetic);assert(vs.every(v=>v===vs[0]),s);chains++;
}
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),inventory=read('problems/editorial/batches/grade4-inventory.json').records,sourceStatements=new Set();for(const f of new Set(inventory.map(r=>r.sourceFile)))for(const q of read(f).questions)sourceStatements.add(norm(q.statement));for(const r of rows)assert(!sourceStatements.has(norm(r.statement)));
console.log(JSON.stringify({printedFixtures:37,completeDomainCases:domains,writtenInternalZeroCarryCases:carry,sameDirectionCatchLedgers:catchLedgers,equalDistanceRoundTripCases:roundTrips,afterTurnaroundMeetingCases:turnarounds,jointWorkCases:joint,numericSolutionEqualityChains:chains,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

// Author checks only. External source/content review remains required.
import fs from'node:fs';import assert from'node:assert/strict';
import{verifyEdition,renderEdition}from'./grade4-meeting-models.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),rows=read('problems/editorial/batches/grade4-meeting-wave45.json').editions;
assert.equal(rows.length,40);const nums=s=>(s.match(/\d+/g)||[]).map(Number),one=xs=>{assert.equal(xs.length,1);return xs[0];};
const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
const keys=['144','650 м','10','q = u + w','70 км/сағ','48 км/сағ және 45 км/сағ','92','140','T = D : c','12','140','260 км','50 мин','(50 + x) × 4 = 480','144 км/сағ','18 × 4 + 22 × 4','10','87','Автобус; 48 км','3','15','70','62 км/сағ; 48 км/сағ','4','360','Екеуінің А нүктесінен қашықтығы тең','13:00','08:29','135 км/сағ','4','5','126 км/сағ','4','170','4 сағ','200','110','240 км','72 км/сағ','88 км/сағ'];
for(let i=0;i<rows.length;i++){
 const r=rows[i],ns=nums(r.statement);verifyEdition(r);assert.equal(r.answer,keys[i]);let answer;
 switch(i){
 case 0:case 35:answer=(ns[0]+ns[1])*ns[2];break;
 case 1:answer=(ns[0]+ns[1])*ns[2];assert(r.statement.includes('әлі кездескен жоқ'));break;
 case 2:case 9:case 34:answer=ns[0]/(ns[1]+ns[2]);break;
 case 3:answer='q = u + w';break;
 case 4:case 17:case 36:answer=ns[0]/ns[1]-ns[2];break;
 case 5:{const pairs=r.options.map(o=>nums(o)),sums=pairs.map(([a,b])=>a+b),max=Math.max(...sums);answer=one(r.options.filter((_,j)=>sums[j]===max));assert(!nums(answer).includes(Math.max(...pairs.flat())));assert(r.solution.includes(`${sums.indexOf(max)+1}-нұсқада`));break;}
 case 6:answer=ns[0]-ns[1];break;
 case 7:case 33:answer=ns[0]+ns[1];break;
 case 8:answer='T = D : c';assert(r.statement.includes('оң жақындау'));break;
 case 10:answer=ns[0]/ns[1];break;
 case 11:answer=ns[2]/(ns[0]+ns[1])*ns[0];assert(r.statement.includes('А бекетінен неше'));break;
 case 12:answer=ns[0]*1000/(ns[1]+ns[2]);break;
 case 13:answer=`(${ns[2]} + x) × ${ns[1]} = ${ns[0]}`;break;
 case 14:answer=(ns[1]+ns[2])/ns[0];break;
 case 15:answer=`${ns[0]} × ${ns[2]} + ${ns[1]} × ${ns[2]}`;break;
 case 16:answer=ns[2]/(ns[0]+ns[0]*ns[1]);break;
 case 18:answer=`Автобус; ${(ns[1]-ns[0])*ns[2]} км`;break;
 case 19:answer=ns[0]/2/(ns[1]+ns[2]);assert(r.statement.includes('КЕЗДЕСКЕНГЕ ДЕЙІН')&&r.statement.includes('АЛҒАШ РЕТ'));assert.equal(Math.abs(ns[0]-(ns[1]+ns[2])*answer),ns[0]/2);assert.equal(Math.abs(ns[0]-(ns[1]+ns[2])*answer*3),ns[0]/2);break;
 case 20:answer=(ns[0]*1000+ns[1])/(ns[2]+ns[3]);break;
 case 21:answer=ns[0]/ns[1]/2;assert(r.statement.includes('ӘР'));break;
 case 22:{const target=r.options.filter(o=>{const[a,b]=nums(o);return a+b===ns[0]&&a-b===ns[1];});answer=one(target);assert(r.options.every(o=>{const[a,b]=nums(o);return a-b===ns[1];}));break;}
 case 23:answer=ns[0]/(ns[1]+ns[1]+ns[2]);break;
 case 24:answer=(ns[0]+ns[1])*(ns[2]*2/(ns[1]-ns[0]));break;
 case 25:{const t=ns[2]/(ns[0]+ns[1]);assert.equal(ns[0]*t,ns[2]-ns[1]*t);answer='Екеуінің А нүктесінен қашықтығы тең';assert(r.statement.includes('Дәл КЕЗДЕСКЕН СӘТТЕ'));break;}
 case 26:{const times=[...r.statement.matchAll(/(\d{2}):(\d{2})/g)].map(m=>Number(m[1])*60+Number(m[2])),speeds=[...r.statement.matchAll(/(\d+) км\/сағ/g)].map(m=>Number(m[1])),distance=ns[0],delay=times[1]-times[0];answer=clock(times[1]+(distance*60-speeds[0]*delay)/(speeds[0]+speeds[1]));break;}
 case 27:{const times=[...r.statement.matchAll(/(\d{2}):(\d{2})/g)].map(m=>Number(m[1])*60+Number(m[2])),speeds=[...r.statement.matchAll(/(\d+) м\/мин/g)].map(m=>Number(m[1])),distance=ns[0],delay=times[1]-times[0];answer=clock(times[1]+(distance-speeds[0]*delay)/(speeds[0]+speeds[1]));break;}
 case 28:answer=ns[0]/ns[1]/(ns[2]+1)*ns[2];break;
 case 29:answer=ns[0]/2/ns[2]-ns[0]/2/ns[1];assert(r.statement.includes('ЕРТЕ'));break;
 case 30:answer=(ns[0]-ns[2])/(ns[2]/ns[1]);assert(r.statement.includes('КЕЗДЕСКЕННЕН КЕЙІН'));break;
 case 31:answer=(ns[0]+ns[2])/2/ns[1];assert(r.statement.includes('ЖЫЛДАМ'));break;
 case 32:answer=(ns[0]+ns[1]*ns[4])/(ns[1]+ns[2]);assert(answer>ns[3]+ns[4]);assert(r.statement.includes('Бастапқы шығу сәтінен'));break;
 case 37:answer=ns[0]/(ns[1]+ns[2])*ns[2];assert(r.statement.includes('Б стансасынан'));break;
 case 38:answer=(ns[0]-ns[3])/ns[2]-ns[1];assert(r.statement.includes('ӘЛІ КЕЗДЕСПЕГЕН'));break;
 case 39:answer=(ns[0]-ns[2])/2/ns[1];assert(r.statement.includes('БАЯУ'));break;
 default:throw Error(i);
 }
 if(typeof answer==='number'){assert(Number.isSafeInteger(answer)&&answer>0);if(r.options)assert.equal(one(r.options.filter(o=>nums(o)[0]===answer)),r.answer);else assert.equal(String(answer),r.answer);}else assert.equal(answer,r.answer);
 if(r.options)assert.equal(new Set(r.options).size,4);else assert(r.statement.endsWith('Жауапқа тек санды жазыңыз.'));
}
let domains=0,delayed=0,rest=0,midpoint=0;
for(let a=1;a<=40;a++)for(let b=1;b<=40;b++)for(let t=1;t<=8;t++){
 const distance=a*t+b*t;assert.equal(distance/(a+b),t);assert.equal(distance/t-a,b);assert.equal(distance/(a+b)*a,a*t);
 const gap=Math.abs(a-b)*t;assert.equal((distance+gap)/2/t,Math.max(a,b));assert.equal((distance-gap)/2/t,Math.min(a,b));
 // Half separation has two absolute-distance solutions if passage is allowed.
 assert.equal(Math.abs(distance-(a+b)*t/2),distance/2);assert.equal(Math.abs(distance-(a+b)*t*3/2),distance/2);domains++;
}
for(let a=1;a<=20;a++)for(let b=1;b<=20;b++)for(let lead=1;lead<=5;lead++)for(let after=1;after<=8;after++){
 const distance=a*(lead+after)+b*after;assert.equal((distance-a*lead)/(a+b),after);
 assert.equal(a*(lead+after),distance-b*after);assert(distance-a*lead>0);delayed++;domains++;
}
for(let a=1;a<=12;a++)for(let b=1;b<=12;b++)for(let walk=1;walk<=4;walk++)for(let pause=1;pause<=3;pause++)for(let tail=1;tail<=4;tail++){
 const total=walk+pause+tail,distance=a*(total-pause)+b*total;
 const firstPosition=t=>a*(t<=walk?t:t<=walk+pause?walk:t-pause),gap=t=>distance-b*t-firstPosition(t);
 assert.equal(gap(total),0);assert(gap(walk)>0&&gap(walk+pause)>0);for(let step=0;step<total*4;step++)assert(gap(step/4)>0);
 assert.equal((distance+a*pause)/(a+b),total);rest++;domains++;
}
for(let slow=1;slow<=30;slow++)for(let fast=slow+1;fast<=40;fast++)for(let t=2;t<=10;t+=2){
 const distance=(fast+slow)*t,offset=distance/2-slow*t;assert.equal(offset*2/(fast-slow),t);assert.equal((fast+slow)*(offset*2/(fast-slow)),distance);midpoint++;domains++;
}
const reject=f=>{let failed=false;try{f();}catch{failed=true;}assert(failed,'Invalid row accepted');};let tamper=0,missing=0;
for(const row of rows){
 for(const field of['statement','answer','solution',...(row.options?['options']:[])]){const r=structuredClone(row);if(field==='options')r.options=[...r.options].reverse();else r[field]+=' өзгертілген';reject(()=>verifyEdition(r));tamper++;}
 for(const key of Object.keys(row.params)){const r=structuredClone(row);delete r.params[key];reject(()=>renderEdition(r));missing++;}
}
const guards=[[0,'hours',0],[1,'first',58],[2,'distance',1801],[3,'firstSymbol','w'],[4,'distance',391],[5,'pairs',[[70,30],[60,20],[55,25],[48,32]]],[6,'approach',78],[7,'first',0],[8,'timeSymbol','c'],[9,'distance',1561],[10,'distance',561],[11,'first',85],[12,'km',7],[13,'distance',481],[14,'hours',5],[15,'hours',0],[16,'factor',1],[17,'distance',811],[18,'bus',54],[19,'distance',65],[20,'metres',1000],[21,'distance',564],[22,'gap',110],[23,'extra',0],[24,'first',65],[25,'first',60],[26,'distance',48],[27,'distance',720],[28,'factor',1],[29,'fast',45],[30,'fromFirst',144],[31,'pathGap',684],[32,'distance',27],[33,'second',0],[34,'distance',529],[35,'hours',0],[36,'distance',781],[37,'first',80],[38,'remaining',492],[39,'pathGap',612]];
for(const[i,key,value]of guards){const r=structuredClone(rows[i]);r.params[key]=value;reject(()=>renderEdition(r));}
function arithmetic(t){assert(/^[\d\s()+×:−-]+$/.test(t));const ts=t.match(/\d+|[()+×:−-]/g);let i=0;function atom(){if(ts[i]==='('){i++;const x=sum();assert.equal(ts[i++],')');return x;}return Number(ts[i++]);}function prod(){let v=atom();while(['×',':'].includes(ts[i])){const op=ts[i++],w=atom();v=op==='×'?v*w:v/w;}return v;}function sum(){let v=prod();while(['+','−','-'].includes(ts[i])){const op=ts[i++],w=prod();v=op==='+'?v+w:v-w;}return v;}const n=sum();assert.equal(i,ts.length);return n;}
let chains=0;
for(const r of rows)for(const m of r.solution.split(/(?<=[.!?])\s+/).filter(part=>! /\bx\b/.test(part)).join(' ').replace(/\d{2}:\d{2}/g,'CLOCK').matchAll(/[0-9(][0-9\s+×:−()=\-]*/g)){
 const s=m[0].trim();if(!s.includes('=')||s.split('(').length!==s.split(')').length)continue;const ps=s.split('=');if(ps.some(x=>!x.trim()||/[+×:−-]\s*$/.test(x)))continue;const vs=ps.map(arithmetic);assert(vs.every(v=>v===vs[0]),s);chains++;
}
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),inventory=read('problems/editorial/batches/grade4-inventory.json').records,sourceStatements=new Set();
for(const f of new Set(inventory.map(r=>r.sourceFile)))for(const q of read(f).questions)sourceStatements.add(norm(q.statement));for(const r of rows)assert(!sourceStatements.has(norm(r.statement)));
console.log(JSON.stringify({printedFixtures:40,completeMotionDomainCases:domains,delayedDepartureLedgers:delayed,piecewiseRestEarliestMeetingLedgers:rest,midpointOffsetCases:midpoint,numericSolutionEqualityChains:chains,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

// Author checks only. Independent full saved/new content review still required.
import fs from'node:fs';import assert from'node:assert/strict';
import{verifyEdition,renderEdition}from'./grade4-motion-equations-models.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),rows=read('problems/editorial/batches/grade4-motion-equations-wave46.json').editions;
assert.equal(rows.length,39);const nums=s=>(s.match(/\d+/g)||[]).map(Number),one=xs=>{assert.equal(xs.length,1);return xs[0];};
const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`,dur=n=>`${Math.floor(n/60)} сағ ${n%60} мин`;
const keys=['640','64 × 3 + 28 = x','20','36','Дұрыс','5','20 мин','Стансалар арасындағы бастапқы қашықтықты','126','T = D : (u + w)','800','D : T − u','11:35','79','Үлгереді; дайындық шегінен 10 минут ерте','(x + 65) × 18 = 2700','А стансасынан 475 км','1 сағ 30 мин','85 м/мин','90','48','98','50','108','60','160 км/сағ; 120 км/сағ','42','100','144 км','80 м/мин; 120 м/мин','15 км/сағ; 45 км/сағ','130','(x + 16) × 3 = 108','Екінші пойыздың кездескенге дейінгі жолын','24','230','L : (p + q)','384','168 км'];
for(let i=0;i<rows.length;i++){
 const r=rows[i],n=nums(r.statement);verifyEdition(r);assert.equal(r.answer,keys[i]);let answer;
 switch(i){
 case 0:answer=(n[0]+n[1])*n[2];break;
 case 1:answer=`${n[0]} × ${n[1]} + ${n[2]} = x`;break;
 case 2:answer=n[0]/n[1]/2;break;
 case 3:answer=(n[0]+n[1])*n[2];assert(r.statement.includes('әлі кездеспейді'));break;
 case 4:assert.equal((n[3]+n[0])*n[1],n[2]);answer='Дұрыс';for(const o of r.options.filter(o=>o!=='Дұрыс'))assert.notEqual((nums(o)[0]+n[0])*n[1],n[2]);break;
 case 5:answer=n[0]/(n[1]+n[2]);break;
 case 6:answer=n[0]*1000/(n[1]+n[2]);break;
 case 7:answer='Стансалар арасындағы бастапқы қашықтықты';assert.deepEqual(n.slice(3),n.slice(0,3));assert(r.statement.includes(`(${n[0]} + ${n[1]}) × ${n[2]}`));break;
 case 8:answer=n[0]/n[1];break;
 case 9:answer='T = D : (u + w)';assert(r.statement.includes('жылдамдықтар оң'));break;
 case 10:case 21:answer=n[0]/n[1]-n[2];break;
 case 11:answer='D : T − u';assert(r.statement.includes('жағдай мүмкін'));break;
 case 12:{const t=[...r.statement.matchAll(/(\d{2}):(\d{2})/g)].map(m=>Number(m[1])*60+Number(m[2])),v=[...r.statement.matchAll(/(\d+) км\/сағ/g)].map(m=>Number(m[1]));answer=clock(t[0]+n[0]*60/(v[0]+v[1]));assert(r.options.includes(clock(n[0]*60/(v[0]+v[1]))));break;}
 case 13:answer=(n[1]*n[0]-n[2])/n[0];break;
 case 14:{const times=[...r.statement.matchAll(/(\d{2}):(\d{2})/g)].map(m=>Number(m[1])*60+Number(m[2])),early=Number(one([...r.statement.matchAll(/(\d+) минут бұрын/g)])[1]),distance=Number(one([...r.statement.matchAll(/Жол (\d+) км/g)])[1]),speed=Number(one([...r.statement.matchAll(/(\d+) км\/сағ/g)])[1]),deadline=times[0]-early,arrival=times[1]+distance*60/speed;assert(arrival<deadline);answer=`Үлгереді; дайындық шегінен ${deadline-arrival} минут ерте`;assert(r.options.includes(`Үлгереді; дайындық шегінен ${times[0]-arrival} минут ерте`));break;}
 case 15:answer=`(x + ${n[3]}) × ${n[2]} = ${n[0]*1000+n[1]}`;break;
 case 16:answer=`А стансасынан ${n[0]/(n[1]+n[2])*n[1]} км`;break;
 case 17:answer=dur(n[0]*60/(n[1]+n[2]));assert.equal(n[0]*60/(n[1]+n[2]),90);break;
 case 18:answer=n[0]*1000/n[1]-n[2];break;
 case 19:answer=(n[1]*60/1000+n[2])*n[0];break;
 case 20:answer=(n[1]+n[1]+n[2])*n[0];break;
 case 22:answer=n[0]*60/(n[1]+n[2]);assert(r.statement.includes('МИНУТТА'));break;
 case 23:answer=(n[0]-n[1]*(n[2]+n[3]))/n[3];break;
 case 24:{const times=[...r.statement.matchAll(/(\d{2}):(\d{2})/g)].map(m=>Number(m[1])*60+Number(m[2])),early=Number(one([...r.statement.matchAll(/(\d+) минут ерте/g)])[1]),distance=Number(one([...r.statement.matchAll(/Жол (\d+) км/g)])[1]),available=times[0]-early-times[1];assert(available>0);answer=distance*60/available;assert((answer-1)*available<distance*60);break;}
 case 25:{const pair=r.options.filter(o=>{const[a,b]=nums(o);return(a+b)*n[1]===n[0]&&(a-b)*n[1]===n[2];});answer=one(pair);assert(r.options.every(o=>{const[a,b]=nums(o);return(a+b)*n[1]===n[0];}));break;}
 case 26:{const second=n[1]*n[0]/(n[2]-n[0]);answer=second*n[2];assert.equal((second+n[1])*n[0],answer);break;}
 case 27:{const times=[...r.statement.matchAll(/(\d{2}):(\d{2})/g)].map(m=>Number(m[1])*60+Number(m[2])),v=[...r.statement.matchAll(/(\d+) км\/сағ/g)].map(m=>Number(m[1]));answer=(times[1]-times[0])*(v[0]+v[1])/60;assert.equal((times[1]-times[0])%60,30);break;}
 case 28:answer=Math.abs(n[0]-(n[1]+n[2])*n[3]);assert(n[3]>n[0]/(n[1]+n[2]));break;
 case 29:{const sum=n[0]/n[1],first=(n[0]-sum*n[3])/n[2],second=sum-first;answer=`${first} м/мин; ${second} м/мин`;assert.equal(r.options.filter(o=>{const[a,b]=nums(o);return(a+b)*n[1]===n[0]&&a*(n[2]+n[3])+b*n[3]===n[0];}).length,1);break;}
 case 30:{const slow=n[0]/n[1]/(n[2]+1);answer=`${slow} км/сағ; ${slow*n[2]} км/сағ`;break;}
 case 31:case 37:{const times=[...r.statement.matchAll(/(\d{2}):(\d{2})/g)].map(m=>Number(m[1])*60+Number(m[2])),v=[...r.statement.matchAll(/(\d+) км\/сағ/g)].map(m=>Number(m[1])),lead=(times[1]-times[0])/60,after=(n[0]-v[0]*lead)/(v[0]+v[1]),first=v[0]*(lead+after),second=v[1]*after;answer=i===31?first-second:first;assert.equal(first+second,n[0]);break;}
 case 32:answer=`(x + ${n[2]}) × ${n[1]} = ${n[0]}`;break;
 case 33:answer='Екінші пойыздың кездескенге дейінгі жолын';assert.deepEqual(n.slice(3),[n[2],n[0]]);break;
 case 34:answer=(n[0]*1000+n[1])/(n[2]+n[3]);break;
 case 35:answer=n[0]*1000/n[1]-n[2];break;
 case 36:answer='L : (p + q)';break;
 case 38:answer=n[1]/(n[2]-n[0])*n[2];break;
 default:throw Error(i);
 }
 if(typeof answer==='number'){assert(Number.isSafeInteger(answer)&&answer>0);if(r.options)assert.equal(one(r.options.filter(o=>nums(o)[0]===answer)),r.answer);else assert.equal(String(answer),r.answer);}else assert.equal(answer,r.answer);
 if(r.options)assert.equal(new Set(r.options).size,4);else assert(r.statement.endsWith('Жауапқа тек санды жазыңыз.'));
}
let cases=0,delayed=0,twoScenario=0,solo=0,minimal=0;
for(let first=1;first<=25;first++)for(let second=1;second<=25;second++)for(let time=1;time<=12;time++){
 const d=(first+second)*time;assert.equal(d/(first+second),time);assert.equal(d/time-first,second);assert.equal(d/(time*2),(first+second)/2);cases++;
}
for(let first=1;first<=20;first++)for(let second=1;second<=20;second++)for(let lead=1;lead<=4;lead++)for(let after=1;after<=6;after++){
 const d=first*(lead+after)+second*after;assert.equal((d-first*(lead+after))/after,second);assert.equal((d-first*lead)/(first+second),after);assert.equal(first*(lead+after)+second*after,d);delayed++;cases++;
}
for(let first=1;first<=30;first++)for(let second=1;second<=30;second++)for(let lead=1;lead<=8;lead++)for(let after=1;after<=10;after++){
 if(first===second)continue;const d=first*(lead+after)+second*after,sum=first+second;
 if(d%sum)continue;const simultaneous=d/sum;if(simultaneous<=after)continue;
 assert.equal((d-sum*after)/lead,first);assert.equal(d/simultaneous-first,second);twoScenario++;cases++;
}
for(let first=1;first<=30;first++)for(let meet=1;meet<=10;meet++)for(let alone=meet+1;alone<=15;alone++){
 if(first*meet%(alone-meet))continue;const second=first*meet/(alone-meet),d=second*alone;assert.equal((first+second)*meet,d);assert.equal(first*meet/(alone-meet)*alone,d);solo++;cases++;
}
for(let distance=1;distance<=200;distance++)for(let minutes=15;minutes<=180;minutes+=15){
 if(distance*60%minutes)continue;const speed=distance*60/minutes;assert.equal(speed*minutes,distance*60);assert((speed-1)*minutes<distance*60);assert((speed+1)*minutes>distance*60);minimal++;cases++;
}
const reject=f=>{let failed=false;try{f();}catch{failed=true;}assert(failed,'Invalid row accepted');};let tamper=0,missing=0;
for(const row of rows){
 for(const field of['statement','answer','solution',...(row.options?['options']:[])]){const r=structuredClone(row);if(field==='options')r.options=[...r.options].reverse();else r[field]+=' өзгертілген';reject(()=>verifyEdition(r));tamper++;}
 for(const key of Object.keys(row.params)){const r=structuredClone(row);delete r.params[key];reject(()=>renderEdition(r));missing++;}
}
const guards=[[0,'hours',0],[1,'remaining',0],[2,'distance',164],[3,'hours',2],[4,'proposed',81],[5,'distance',841],[6,'km',0],[7,'first',0],[8,'distance',631],[9,'firstSymbol','w'],[10,'distance',6481],[11,'distanceSymbol','T'],[12,'startMinutes',1430],[13,'pathGap',66],[14,'startMinutes',910],[15,'metres',1000],[16,'first',73],[17,'distance',35],[18,'km',0],[19,'firstMetresPerMinute',201],[20,'extra',0],[21,'distance',1621],[22,'distance',16],[23,'distance',432],[24,'startMinutes',1120],[25,'pathGap',1120],[26,'secondSoloHours',3],[27,'meetingMinutes',620],[28,'hours',5],[29,'leadMinutes',1],[30,'factor',1],[31,'secondHour',7],[32,'distance',109],[33,'hours',0],[34,'metres',1000],[35,'km',0],[36,'firstSymbol','q'],[37,'secondHour',6],[38,'meetingHours',4]];
for(const[i,key,value]of guards){const r=structuredClone(rows[i]);r.params[key]=value;reject(()=>renderEdition(r));}
function arithmetic(t){assert(/^[\d\s()+×:−-]+$/.test(t));const ts=t.match(/\d+|[()+×:−-]/g);let i=0;function atom(){if(ts[i]==='('){i++;const x=sum();assert.equal(ts[i++],')');return x;}return Number(ts[i++]);}function prod(){let v=atom();while(['×',':'].includes(ts[i])){const op=ts[i++],w=atom();v=op==='×'?v*w:v/w;}return v;}function sum(){let v=prod();while(['+','−','-'].includes(ts[i])){const op=ts[i++],w=prod();v=op==='+'?v+w:v-w;}return v;}const n=sum();assert.equal(i,ts.length);return n;}
let chains=0;
for(const r of rows)for(const m of r.solution.split(/(?<=[.!?])\s+/).filter(part=>! /\bx\b/.test(part)).join(' ').replace(/\d{2}:\d{2}/g,'CLOCK').matchAll(/[0-9(][0-9\s+×:−()=\-]*/g)){
 const s=m[0].trim();if(!s.includes('=')||s.split('(').length!==s.split(')').length)continue;const ps=s.split('=');if(ps.some(x=>!x.trim()||/[+×:−-]\s*$/.test(x)))continue;const vs=ps.map(arithmetic);assert(vs.every(v=>v===vs[0]),s);chains++;
}
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),inventory=read('problems/editorial/batches/grade4-inventory.json').records,sourceStatements=new Set();
for(const f of new Set(inventory.map(r=>r.sourceFile)))for(const q of read(f).questions)sourceStatements.add(norm(q.statement));for(const r of rows)assert(!sourceStatements.has(norm(r.statement)));
assert(!rows.some(r=>r.sourceRefs.some(ref=>ref.sourceId==='123d7e820a0e0e7a')),'Already verified source must not be adapted again');
console.log(JSON.stringify({printedFixtures:39,completeMotionEquationDomains:cases,delayedDepartureLedgers:delayed,twoScenarioUniqueSpeedLedgers:twoScenario,wholeRouteSoloInverseCases:solo,minimumSpeedBoundaryCases:minimal,numericSolutionEqualityChains:chains,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,alreadyVerifiedSourceExcluded:1,status:'author_checks_passed_not_independent_review'}));

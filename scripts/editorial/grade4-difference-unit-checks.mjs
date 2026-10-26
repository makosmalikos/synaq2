// Author checks only: external full-source/content review is still mandatory.
import fs from'node:fs';import assert from'node:assert/strict';
import{verifyEdition,renderEdition}from'./grade4-difference-unit-models.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),rows=read('problems/editorial/batches/grade4-difference-unit-wave44.json').editions;
assert.equal(rows.length,38);
const keys=['170 тг','70','14 л','3150 тг; 4950 тг','44','84','1320 : (14 − 8)','12; 8','2','14400 тг','10000','24000','560','7','3360 тг','4320 тг; 2880 тг','1200','25','525','4500 тг','21','435','4320 тг','2560 г','1800 тг','4 × x + 500 = 7 × x − 1300','27','54000','60000 тг','9 × x − 5 × x = 56','13600','80 км/сағ','70','8','1000','504; 324','12480','5600'];
const nums=s=>(s.match(/\d+/g)||[]).map(Number),one=xs=>{assert.equal(xs.length,1);return xs[0];};
for(let i=0;i<rows.length;i++){
 const r=rows[i],n=nums(r.statement);let answer;verifyEdition(r);assert.equal(r.answer,keys[i]);
 switch(i){
 case 0:case 8:case 31:answer=n[2]/(n[0]-n[1]);break;
 case 1:case 9:case 32:case 36:answer=n[2]/(n[0]-n[1])*n[1];break;
 case 2:answer=(n[0]-n[1])/n[2];break;
 case 3:{const price=n[2]/(n[1]-n[0]);answer=`${price*n[0]} тг; ${price*n[1]} тг`;break;}
 case 4:case 5:case 12:case 30:answer=n[2]/Math.abs(n[0]-n[1])*n[0];break;
 case 6:answer=`${n[2]} : (${n[0]} − ${n[1]})`;break;
 case 7:{const price=(n[0]-n[1])/n[2];answer=`${n[0]/price}; ${n[1]/price}`;break;}
 case 10:answer=n[2]*1000/(n[0]-n[1])*n[1];assert(r.statement.includes('МЕТР'));break;
 case 11:answer=n[2]*1000/(n[0]*60-n[1])*n[1];assert(r.statement.includes('МЕТР'));break;
 case 13:answer=n[1]/((n[0]-n[1])/n[2]);break;
 case 14:answer=n[2]/(n[1]-n[0])*n[0];break;
 case 15:{const price=n[2]/(n[0]-n[1]);answer=`${price*n[0]} тг; ${price*n[1]} тг`;assert.equal(r.options.filter(o=>{const[a,b]=nums(o);return a-b===n[2]&&a*n[1]===b*n[0];}).length,1);assert(r.options.some(o=>{const[a,b]=nums(o);return a-b===n[2]&&a*n[1]!==b*n[0];}));break;}
 case 16:case 21:case 34:answer=n[2]/(n[0]-n[1])*(n[0]+n[1]);break;
 case 17:answer=(n[0]+n[1])/((n[0]-n[1])/n[2]);break;
 case 18:answer=n[0]/((n[1]-n[0])/n[2]);break;
 case 19:answer=n[2]/(n[1]-n[0])*n[0];break;
 case 20:answer=(n[0]+n[1])/((n[0]-n[1])/n[2]);break;
 case 22:answer=n[2]/(n[1]-n[0])*(n[0]+n[1]);break;
 case 23:answer=n[2]/n[1]*(n[0]+n[0]-n[1]);break;
 case 24:{const second=n[0]/n[1];answer=n[2]/(n[0]-second)*second;break;}
 case 25:answer=`${n[0]} × x + ${n[1]} = ${n[2]} × x − ${n[3]}`;break;
 case 26:answer=n[2]/(n[0]-n[1])*(n[0]+n[1])/n[3];assert(r.statement.includes('бума'));break;
 case 27:answer=n[2]/(n[0]-n[1])*n[1]*n[3];break;
 case 28:answer=n[3]/(n[0]-n[2])*(n[0]+n[1]+n[2]);break;
 case 29:answer=`${n[0]} × x − ${n[1]} × x = ${n[2]}`;break;
 case 33:answer=n[0]/((n[0]-n[1])/n[2]);break;
 case 35:{const rate=n[2]/(n[0]-n[1]);answer=`${rate*n[0]}; ${rate*n[1]}`;assert.equal(r.options.filter(o=>{const[a,b]=nums(o);return a-b===n[2]&&a*n[1]===b*n[0];}).length,1);break;}
 case 37:answer=(n[1]+n[3])/(n[2]-n[0])*n[0]+n[1];break;
 default:throw Error(i);
 }
 if(typeof answer==='number'){
  assert(Number.isSafeInteger(answer)&&answer>0);
  if(r.options)assert.equal(one(r.options.filter(o=>nums(o)[0]===answer)),r.answer);else assert.equal(String(answer),r.answer);
 }else assert.equal(answer,r.answer);
 if(r.options)assert.equal(new Set(r.options).size,4);else assert(r.statement.endsWith('Жауапқа тек санды жазыңыз.'));
}
let domains=0;
for(let unit=1;unit<=100;unit++)for(let first=2;first<=30;first++)for(let second=1;second<first;second++){
 const a=unit*first,b=unit*second,gap=a-b;
 assert.equal(gap/(first-second),unit);assert.equal(b/(gap/(first-second)),second);
 assert.equal((a+b)/(gap/(first-second)),first+second);
 assert.equal(gap/(first-second)*(first+second),a+b);
 assert.equal(gap/(first-second)*second,b);domains++;
}
let surplusLedgers=0;
for(let price=1;price<=100;price++)for(let small=1;small<=10;small++)for(let large=small+1;large<=12;large++){
 const surplus=3,shortfall=price*(large-small)-surplus;if(shortfall<=0)continue;
 const money=price*small+surplus;
 assert.equal((surplus+shortfall)/(large-small),price);
 assert.equal(price*large-shortfall,money);surplusLedgers++;domains++;
}
let mixedSI=0;
for(let h=1;h<=4;h++)for(let minute=1;minute<h*60;minute++)for(let km=1;km<=20;km++){
 const dt=h*60-minute,metres=km*1000;if(metres%dt)continue;
 const perMinute=metres/dt;assert.equal(perMinute*h*60-perMinute*minute,metres);mixedSI++;domains++;
}
let bundleLedgers=0;
for(let each=1;each<=20;each++)for(let first=3;first<=40;first++)for(let second=2;second<first;second++)for(let bundle=1;bundle<=24;bundle++){
 const gap=each*(first-second),total=each*(first+second);if(total%bundle)continue;
 assert.equal(gap/(first-second),each);assert.equal(gap/(first-second)*(first+second)/bundle,total/bundle);bundleLedgers++;domains++;
}
// Given-difference alone does not validate a payment pair; the unit price must match.
assert.equal(4200-2760,1440);assert.notEqual(4200*8,2760*12);
assert.equal(654-474,180);assert.notEqual(654*9,474*14);
const reject=f=>{let failed=false;try{f();}catch{failed=true;}assert(failed,'Invalid row accepted');};let tamper=0,missing=0;
for(const row of rows){
 for(const field of['statement','answer','solution',...(row.options?['options']:[])]){const r=structuredClone(row);if(field==='options')r.options=[...r.options].reverse();else r[field]+=' өзгертілген';reject(()=>verifyEdition(r));tamper++;}
 for(const key of Object.keys(row.params)){const r=structuredClone(row);delete r.params[key];reject(()=>renderEdition(r));missing++;}
}
const guards=[[0,'paymentGap',851],[1,'workGap',43],[2,'countGap',3],[3,'paymentGap',1801],[4,'fabricGap',17],[5,'loadGap',29],[6,'first',8],[7,'countGap',3],[8,'pageGap',41],[9,'firstTickets',24],[10,'gapKm',0],[11,'afternoonMinutes',180],[12,'workGap',211],[13,'hourGap',3],[14,'secondUnits',140],[15,'paymentGap',1441],[16,'fabricGap',241],[17,'countGap',3],[18,'countGap',301],[19,'firstMetres',11],[20,'countGap',3],[21,'massGap',106],[22,'paymentGap',961],[23,'countGap',20],[24,'factor',4],[25,'largeCount',4],[26,'bundle',19],[27,'massGap',121],[28,'tickets',[28,25,28]],[29,'firstHours',5],[30,'actualCount',12],[31,'distanceGap',241],[32,'volumeGap',51],[33,'countGap',4],[34,'fabricGap',201],[35,'pageGap',181],[36,'firstLitres',39],[37,'largeCount',5]];
for(const[i,key,value]of guards){const r=structuredClone(rows[i]);r.params[key]=value;reject(()=>renderEdition(r));}
function arithmetic(t){assert(/^[\d\s()+×:−-]+$/.test(t));const ts=t.match(/\d+|[()+×:−-]/g);let i=0;function atom(){if(ts[i]==='('){i++;const x=sum();assert.equal(ts[i++],')');return x;}return Number(ts[i++]);}function prod(){let v=atom();while(['×',':'].includes(ts[i])){const op=ts[i++],w=atom();v=op==='×'?v*w:v/w;}return v;}function sum(){let v=prod();while(['+','−','-'].includes(ts[i])){const op=ts[i++],w=prod();v=op==='+'?v+w:v-w;}return v;}const n=sum();assert.equal(i,ts.length);return n;}
let chains=0;
for(const r of rows)for(const m of r.solution.matchAll(/[0-9(][0-9\s+×:−()=\-]*/g)){
 const s=m[0].trim();if(!s.includes('=')||s.split('(').length!==s.split(')').length)continue;const ps=s.split('=');if(ps.some(x=>!x.trim()||/[+×:−-]\s*$/.test(x)))continue;
 const vs=ps.map(arithmetic);assert(vs.every(v=>v===vs[0]),s);chains++;
}
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),inventory=read('problems/editorial/batches/grade4-inventory.json').records,sourceStatements=new Set();
for(const f of new Set(inventory.map(r=>r.sourceFile)))for(const q of read(f).questions)sourceStatements.add(norm(q.statement));
for(const r of rows)assert(!sourceStatements.has(norm(r.statement)));
console.log(JSON.stringify({printedFixtures:38,completeUnitDifferenceDomainCases:domains,surplusShortfallLedgers:surplusLedgers,mixedHourMinuteKmMetreCases:mixedSI,completeNotebookBundleLedgers:bundleLedgers,numericSolutionEqualityChains:chains,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

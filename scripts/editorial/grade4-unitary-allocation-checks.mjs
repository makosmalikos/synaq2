// Author validation only. Independent full-source/content review still required.
import fs from'node:fs';import assert from'node:assert/strict';
import{renderEdition,verifyEdition}from'./grade4-unitary-allocation-models.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),rows=read('problems/editorial/batches/grade4-unitary-allocation-wave43.json').editions;
assert.equal(rows.length,39);
const keys=['1800','Барлық қорап санын табу: 6 + 8 = 14','99','144','56','900','16200','60','7200 тг және 5400 тг','8','60 т және 50 т','4800 тг','(5 + 7) × x = 4800','2400','85','30 км','3600 тг','144','9','7','12','105','20','288','88 т','10','396000 тг','6','10','480000 тг','3200','24000 м²','240','171 бет','10800','8','72 т','36','48'];
const nums=s=>(s.match(/\d+/g)||[]).map(Number),one=xs=>{assert.equal(xs.length,1);return xs[0];};
for(let i=0;i<rows.length;i++){
 const r=rows[i],n=nums(r.statement);let answer;verifyEdition(r);assert.equal(r.answer,keys[i]);
 switch(i){
 case 0:case 5:case 6:case 2:case 33:case 34:answer=n[1]/n[0]*n[2];break;
 case 1:answer=`Барлық қорап санын табу: ${n[0]} + ${n[1]} = ${n[0]+n[1]}`;break;
 case 3:answer=n[2]/(n[0]+n[1])*n[1];break;
 case 4:answer=n[0]/((n[0]+n[1])/n[2]);break;
 case 7:answer=n[2]/(n[0]+n[1])*n[0];break;
 case 8:{const[first,second,total]=n,price=total/(first+second);answer=`${price*first} тг және ${price*second} тг`;assert.equal(r.options.filter(o=>{const[a,b]=nums(o);return a+b===total&&a/first===b/second;}).length,1);break;}
 case 9:answer=n[2]/(n[1]/n[0]);break;
 case 10:{const[total,first,second]=n,trips=total/(first+second);answer=`${first*trips} т және ${second*trips} т`;assert.equal(r.options.filter(o=>{const[a,b]=nums(o);return a+b===total&&a/first===b/second;}).length,1);break;}
 case 11:answer=n[2]/(n[0]+n[1])*n[0];break;
 case 12:answer=`(${n[0]} + ${n[1]}) × x = ${n[2]}`;assert.equal(n[2]/(n[0]+n[1]),400);break;
 case 13:answer=n[1]/n[0]*n[3]-n[2];break;
 case 14:answer=n[2]/(n[0]/n[1]);break;
 case 15:answer=n[2]/(n[0]+n[1])*n[1];break;
 case 16:answer=n[2]/(n[0]+n[1])*(n[1]-n[0]);break;
 case 17:answer=(n[1]*10+n[2])/n[0]*n[3];assert(r.statement.includes('неше центнер'));break;
 case 18:answer=n[1]/((n[1]+n[2])/n[0]);break;
 case 19:answer=(n[2]-n[1])/(n[1]/n[0]);break;
 case 20:answer=n[2]/(n[0]+n[1]);break;
 case 21:case 38:answer=n[1]/((n[1]+n[2])/n[0]);break;
 case 22:answer=n[3]/(n[0]/n[1]+n[2]);break;
 case 23:answer=(n[0]+n[0]/n[1])*100/n[2];break;
 case 24:answer=n[2]/(n[0]-n[1])*(n[0]+n[1]);break;
 case 25:answer=(n[1]+n[2])/(n[1]/n[0]);break;
 case 26:answer=n[2]/(n[1]-n[0])*(n[0]+n[1]);break;
 case 27:answer=n[0]/(n[0]/n[1]+n[0]/n[2]);break;
 case 28:answer=n[3]/(n[0]+n[1]+n[2])*n[2];break;
 case 29:answer=n[3]/(n[0]+n[1]+n[2])*(n[2]-n[0]-n[1]);break;
 case 30:{const first=n[0]*60+n[1];answer=n[3]/(first+n[2])*first;break;}
 case 31:answer=n[3]/(n[0]+n[1]+n[2])*(n[1]+n[2]-n[0]);break;
 case 32:answer=n[2]/(n[0]+n[1])*n[0];break;
 case 35:answer=n[2]/((n[1]+n[2])/n[0]);break;
 case 36:answer=n[0]/(n[1]+n[2])*n[2];break;
 case 37:answer=(n[1]*100+n[2])/n[0]*n[3]/100;assert(r.statement.includes('неше метр'));break;
 default:throw Error(i);
 }
 if(typeof answer==='number'){
  assert(Number.isSafeInteger(answer)&&answer>0);
  if(r.options)assert.equal(one(r.options.filter(o=>nums(o)[0]===answer)),r.answer);else assert.equal(String(answer),r.answer);
 }else assert.equal(answer,r.answer);
 if(r.options)assert.equal(new Set(r.options).size,4);else assert(r.statement.endsWith('Жауапқа тек санды жазыңыз.'));
}
let domains=0;
// Full finite ledgers for sum/difference allocation and equal-unit inverse roles.
for(let unit=1;unit<=100;unit++)for(let first=1;first<=30;first++)for(let second=1;second<=30;second++){
 const firstCost=unit*first,secondCost=unit*second,total=firstCost+secondCost;
 assert.equal(total/(first+second),unit);assert.equal(firstCost/(total/(first+second)),first);
 assert.equal(secondCost/(total/(first+second)),second);assert.equal(total/(first+second)*first,firstCost);
 if(first!==second)assert.equal((secondCost-firstCost)/(second-first),unit);
 assert.equal((firstCost+secondCost)/(first+second)*(second-first),secondCost-firstCost);domains++;
}
for(let unit=1;unit<=40;unit++)for(let first=1;first<=12;first++)for(let second=1;second<=12;second++)for(let third=1;third<=12;third++){
 const total=unit*(first+second+third);
 assert.equal(total/(first+second+third)*third,unit*third);
 assert.equal(total/(first+second+third)*(third-first-second),unit*third-unit*first-unit*second);domains++;
}
for(let hours=1;hours<=3;hours++)for(let minute=1;minute<60;minute++)for(let second=1;second<=60;second++){
 const first=60*hours+minute,unit=17,total=unit*(first+second);assert.equal(total/(first+second)*first,unit*first);domains++;
}
for(let unitCm=25;unitCm<=500;unitCm+=25)for(let count=1;count<=12;count++)for(let newCount=1;newCount<=20;newCount++){
 const cm=unitCm*count,metres=Math.floor(cm/100),rest=cm%100;
 assert.equal((metres*100+rest)/count,unitCm);assert.equal((metres*100+rest)/count*newCount,unitCm*newCount);domains++;
}
for(let totalHours=1;totalHours<=12;totalHours++)for(let tonnes=1;tonnes<=10;tonnes++)for(let centners=1;centners<10;centners++){
 const mass=tonnes*10+centners;if(mass%totalHours)continue;assert.equal((tonnes*1000+centners*100)/100/totalHours,mass/totalHours);domains++;
}
// Full integer candidate domains demonstrate ordered allocation uniqueness.
let pairCandidates=0;
for(const i of[8,10]){
 const n=nums(rows[i].statement),total=i===8?n[2]:n[0],first=i===8?n[0]:n[1],second=i===8?n[1]:n[2],hits=[];
 for(let a=0;a<=total;a++){const b=total-a;if(a*second===b*first)hits.push([a,b]);pairCandidates++;}
 assert.equal(hits.length,1);assert.equal(rows[i].answer,`${hits[0][0]} ${i===8?'тг':'т'} және ${hits[0][1]} ${i===8?'тг':'т'}`);
}
const reject=f=>{let failed=false;try{f();}catch{failed=true;}assert(failed,'Invalid row accepted');};let tamper=0,missing=0;
for(const row of rows){
 for(const field of['statement','answer','solution',...(row.options?['options']:[])]){const r=structuredClone(row);if(field==='options')r.options=[...r.options].reverse();else r[field]+=' өзгертілген';reject(()=>verifyEdition(r));tamper++;}
 for(const key of Object.keys(row.params)){const r=structuredClone(row);delete r.params[key];reject(()=>renderEdition(r));missing++;}
}
const guards=[[0,'cost',1051],[1,'total',12601],[2,'litres',45],[3,'firstDays',8],[4,'sacks',141],[5,'mass',481],[6,'area',7201],[7,'total',133],[8,'choices',[[8400,4200],[7200,5401],[5400,7200],[6300,6300]]],[9,'newMetres',33],[10,'total',111],[11,'total',8401],[12,'total',4801],[13,'money',15000],[14,'newDistance',426],[15,'total',55],[16,'secondKg',7],[17,'centners',10],[18,'firstCost',6301],[19,'totalCost',28801],[20,'total',1921],[21,'firstMass',2101],[22,'newMass',201],[23,'factor',3],[24,'loadGap',25],[25,'increaseCost',1801],[26,'paymentGap',108001],[27,'firstHours',17],[28,'money',[3001,4000,5000]],[29,'houses',[50,70,100]],[30,'firstMinutes',60],[31,'area',48001],[32,'total',391],[33,'pages',77],[34,'newCount',0],[35,'secondCost',4481],[36,'total',105],[37,'centimetres',100],[38,'secondMass',4201]];
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
console.log(JSON.stringify({printedFixtures:39,completeLedgerAndUnitDomainCases:domains,completeOrderedPairCandidates:pairCandidates,numericSolutionEqualityChains:chains,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

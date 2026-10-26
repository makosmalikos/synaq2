// Author validation; separate independent full-content review required.
import fs from'node:fs';import assert from'node:assert/strict';
import{verifyEdition,renderEdition}from'./grade4-joint-work-models.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),rows=read('problems/editorial/batches/grade4-joint-work-wave42.json').editions;
assert.equal(rows.length,39);
const keys=['Аян мен Ермек','11 сағ','450 л','35','168','A = w × t','t = A : (v₁ + v₂)','6 мин','22 м²/сағ','90','4','9 күн','15','90','56','120','5 сағ','Данияр, сағатына 1 бөлшекке','4','5','560','96','270','8','Шәкірттер, 3 сағат ерте','21 бөлшек/сағ','4','128','10 күн','58 м/күн','95','5','205','11 сағ','665 л','18','150','30','6 сағ'];
const nums=s=>(s.match(/\d+/g)||[]).map(Number),one=xs=>{assert.equal(xs.length,1);return xs[0];};
for(let i=0;i<rows.length;i++){
 const r=rows[i],n=nums(r.statement);let answer;verifyEdition(r);assert.equal(r.answer,keys[i]);
 switch(i){
 case 0:assert(n[0]>Math.max(...n.slice(1))&&n[0]+n[1]<n[2]+n[3]);answer='Аян мен Ермек';assert(r.statement.includes('Осы екі жұптың'));break;
 case 1:case 33:answer=n[0]/(n[1]+n[2]);break;
 case 2:case 34:case 32:answer=(n[0]+n[1])*n[2];break;
 case 3:answer=n[1]/n[0]-n[2];break;
 case 4:answer=n[0]*n[1];break;
 case 5:assert(r.statement.includes('бірлескен'));answer='A = w × t';break;
 case 6:answer='t = A : (v₁ + v₂)';assert(r.solution.includes('Жақша міндетті'));break;
 case 7:answer=n[2]/(n[0]+n[1]);break;
 case 8:answer=n[1]/n[0];break;
 case 9:answer=(n[0]+n[1]+n[2])*n[3];break;
 case 10:answer=n[2]/(n[0]+n[1]);break;
 case 11:answer=n[0]/n[1]-n[0]/(n[1]+n[2]);break;
 case 12:answer=n[1]/n[0]/2;break;
 case 13:answer=n[0]/n[1]-n[0]/n[2];break;
 case 14:answer=n[0]/(n[1]+n[2])*n[2];break;
 case 15:{const[a,g,h]=n,b=a+g,c=(a+b)/2;answer=(a+b+c)*h;break;}
 case 16:answer=n[1]-n[0]/(n[0]/n[1]+n[2]);assert(r.statement.includes('неше сағат ерте'));break;
 case 17:answer=`Данияр, сағатына ${n[3]/n[2]-n[1]/n[0]} бөлшекке`;assert(n[1]>n[3]&&n[1]/n[0]<n[3]/n[2]);break;
 case 18:answer=(n[3]-n[0]*n[1])/(n[0]+n[2]);assert(r.statement.includes('қосылған сәттен бастап'));break;
 case 19:answer=n[2]/(n[0]+n[0]+n[1]);break;
 case 20:answer=n[2]*(n[1]/n[0]);break;
 case 21:assert.equal(n[0],n[3]);answer=n[1]-n[2]*n[0];break;
 case 22:answer=(n[0]+n[0]/2)*n[1];break;
 case 23:case 35:answer=n[0]/(n[0]/n[1]+n[0]/n[2]);break;
 case 24:{const[work,master,first,second]=n;assert(master>first&&master>second);answer=`Шәкірттер, ${work/master-work/(first+second)} сағат ерте`;break;}
 case 25:answer=n[2]/2/n[1];assert(r.statement.includes('бөлшек саны тең'));break;
 case 26:answer=(n[3]-(n[0]+n[1])*n[2])/n[0];break;
 case 27:answer=(n[2]/n[1]-n[0])/2*n[1];break;
 case 28:answer=n[4]/(n[1]/n[0]+n[3]/n[2]);break;
 case 29:answer=(n[1]/n[0]+n[2])/2;break;
 case 30:answer=(n[3]-n[1]*n[2])/(n[0]+n[2]);break;
 case 31:answer=(n[0]-(n[1]+n[2])*n[3])/n[1];break;
 case 36:answer=n[0]/(n[1]+n[2])*n[1];break;
 case 37:answer=(n[2]/n[1]+n[0])/2;break;
 case 38:answer=n[0]/n[1]-(n[2]+(n[0]-n[1]*n[2])/(2*n[1]));assert(r.statement.includes('неше сағат ерте'));break;
 default:throw Error(i);
 }
 if(typeof answer==='number'){
  assert(Number.isSafeInteger(answer)&&answer>0);
  if(r.options)assert.equal(one(r.options.filter(o=>nums(o)[0]===answer)),r.answer);else assert.equal(String(answer),r.answer);
 }else assert.equal(answer,r.answer);
 if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options).size,4);}else assert(r.statement.endsWith('Жауапқа тек санды жазыңыз.'));
}
let domains=0,stageWitnesses=0;
for(let first=1;first<=40;first++)for(let second=1;second<=40;second++)for(let alone=1;alone<=12;alone++)for(let joint=1;joint<=12;joint++){
 const total=first*alone+(first+second)*joint;
 assert.equal((total-(first+second)*joint)/first,alone);
 assert.equal((total-second*joint)/(alone+joint),first);
 assert.equal((total-first*alone)/(first+second),joint);
 assert.equal((total-(first+second)*joint)/first+joint,alone+joint);stageWitnesses++;domains++;
}
for(let second=1;second<100;second++)for(let first=second+1;first<=100;first++)for(let hours=1;hours<=24;hours++){
 const total=(first+second)*hours,gap=first-second,rateSum=total/hours;
 assert.equal((rateSum+gap)/2,first);assert.equal((rateSum-gap)/2,second);
 assert.equal((rateSum-gap)/2*hours,second*hours);domains++;
}
for(let rate=1;rate<=50;rate++)for(let h1=1;h1<=12;h1++)for(let h2=1;h2<=12;h2++){
 const total=rate*(h1+h2);assert.equal(total/(h1+h2)*h1,rate*h1);assert.equal(total/(h1+h2)*h2,rate*h2);domains++;
}
let equalOutputs=0;
for(let early=1;early<=12;early++)for(let joint=1;joint<=12;joint++)for(let each=1;each<=500;each++){
 if(each%(early+joint)||each%joint)continue;
 const first=each/(early+joint),second=each/joint;assert(first<second);
 assert.equal(first*(early+joint),second*joint);equalOutputs++;domains++;
}
// Generic formula and parentheses counterexample, without depending on renderer output.
for(let a=1;a<=20;a++)for(let b=1;b<=20;b++)for(let t=1;t<=10;t++){
 const work=(a+b)*t;assert.equal(work/(a+b),t);assert.equal(a*t+b*t,work);domains++;
}
assert.notEqual(60/4+6,60/(4+6));
const reject=f=>{let failed=false;try{f();}catch{failed=true;}assert(failed,'Invalid row accepted');};let tamper=0,missing=0;
for(const row of rows){
 for(const field of['statement','answer','solution',...(row.options?['options']:[])]){
  const r=structuredClone(row);if(field==='options')r.options=[...r.options].reverse();else r[field]+=' өзгертілген';reject(()=>verifyEdition(r));tamper++;
 }
 for(const key of Object.keys(row.params)){const r=structuredClone(row);delete r.params[key];reject(()=>renderEdition(r));missing++;}
}
const guards=[
 [0,'rates',[17,16,12,10]],[1,'work',133],[2,'choices',[450,450,75,270]],[3,'first',100],[4,'hours',0],[5,'symbols',['w','A','t']],[6,'symbols',['A','v₂','v₁','t']],
 [7,'work',301],[8,'work',155],[9,'rates',[8,10]],[10,'work',221],[11,'work',361],[12,'work',217],[13,'jointHours',12],[14,'firstHours',8],[15,'increase',3],
 [16,'helper',19],[17,'firstWork',102],[18,'volume',90],[19,'area',161],[20,'firstWork',641],[21,'total',100],[22,'master',31],[23,'work',1081],[24,'learners',[42,36]],
 [25,'total',169],[26,'total',120],[27,'gap',7],[28,'firstArea',99],[29,'gap',11],[30,'total',711],[31,'total',84],[32,'hours',0],[33,'work',397],[34,'choices',[665,665,385,95]],
 [35,'work',1801],[36,'firstHours',8],[37,'gap',7],[38,'delay',16]
];
for(const[i,key,value]of guards){const r=structuredClone(rows[i]);r.params[key]=value;reject(()=>renderEdition(r));}
function arithmetic(t){assert(/^[\d\s()+×:−-]+$/.test(t));const ts=t.match(/\d+|[()+×:−-]/g);let i=0;function atom(){if(ts[i]==='('){i++;const x=sum();assert.equal(ts[i++],')');return x;}return Number(ts[i++]);}function prod(){let v=atom();while(['×',':'].includes(ts[i])){const op=ts[i++],w=atom();v=op==='×'?v*w:v/w;}return v;}function sum(){let v=prod();while(['+','−','-'].includes(ts[i])){const op=ts[i++],w=prod();v=op==='+'?v+w:v-w;}return v;}const n=sum();assert.equal(i,ts.length);return n;}
let chains=0;
for(const row of rows)for(const m of row.solution.matchAll(/[0-9(][0-9\s+×:−()=\-]*/g)){
 const s=m[0].trim();if(!s.includes('=')||s.split('(').length!==s.split(')').length)continue;
 const ps=s.split('=');if(ps.some(x=>!x.trim()||/[+×:−-]\s*$/.test(x)))continue;
 const vs=ps.map(arithmetic);assert(vs.every(v=>v===vs[0]),s);chains++;
}
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),inventory=read('problems/editorial/batches/grade4-inventory.json').records,sourceStatements=new Set();
for(const file of new Set(inventory.map(r=>r.sourceFile)))for(const q of read(file).questions)sourceStatements.add(norm(q.statement));
for(const r of rows)assert(!sourceStatements.has(norm(r.statement)));
assert(!rows.some(r=>r.sourceRefs.some(s=>s.sourceId==='7ed683ff0e9f3375')));
console.log(JSON.stringify({printedFixtures:rows.length,completeDomainCases:domains,stagedJoinLeaveWitnesses:stageWitnesses,equalOutputDifferentRateWitnesses:equalOutputs,numericSolutionEqualityChains:chains,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

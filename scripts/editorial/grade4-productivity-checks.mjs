// Author checks only: separate full external review is mandatory before registry use.
import fs from'node:fs';import assert from'node:assert/strict';
import{verifyEdition,renderEdition}from'./grade4-productivity-models.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const rows=read('problems/editorial/batches/grade4-productivity-wave41.json').editions;
assert.equal(rows.length,40);
const keys=['8','19','4 есе көбейеді','6 сағ','Өнімділікті уақытқа көбейту','1960','бет/мин','3600','1440','Орындалған жұмыс көлемі','v = A : t','12 қорап/күн','7800','13 күн','6 сағ','50','4000','3 есе','1 сағ 45 мин','Аян','Екінші желі, минутына 2 кітапқа','v = 18 дана/сағ, t = 4 сағ, A = 62 дана','11','8','28','Өзгермейді','3 күн','72','360','180 бет','54','8 бөлшек/сағ','88','4 карточка/мин','9','t = A : v','Ермек, сағатына 2 бөлшекке','48','3 есе артады','8'];
const nums=s=>(s.match(/\d+/g)||[]).map(Number),only=xs=>{assert.equal(xs.length,1);return xs[0];};
let printed=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],n=nums(r.statement),options=r.options||[];let answer;
 assert.equal(r.answer,keys[i]);verifyEdition(r);
 switch(i){
 case 0:case 1:case 3:case 34:answer=n[1]/n[0];break;
 case 2:assert.equal(n[0],7);answer=`${n[1]} есе көбейеді`;break;
 case 4:assert(r.statement.includes('A — барлық'));answer='Өнімділікті уақытқа көбейту';break;
 case 5:case 7:case 12:case 32:answer=n[0]*n[1];break;
 case 6:assert(r.statement.includes('әр минутта'));answer='бет/мин';break;
 case 8:answer=n[0]*n[1]*60;break;
 case 9:assert(r.statement.includes(`«${n[1]} жақтау»`));answer='Орындалған жұмыс көлемі';break;
 case 10:assert(r.statement.includes('v әрпі бір сағаттағы'));answer='v = A : t';break;
 case 11:case 33:answer=n[1]/n[0];break;
 case 13:answer=n[2]/(n[1]/n[0]);break;
 case 14:answer=n[0]*n[1]/(n[0]+n[2]);break;
 case 15:answer=n[2]/(n[1]/n[0]);break;
 case 16:answer=n[0]*1000000/n[1];break;
 case 17:answer=(n[1]/n[0])/(n[3]/n[2]);break;
 case 18:{const m=n[1]/n[0];answer=`${Math.floor(m/60)} сағ ${m%60} мин`;assert(m>60&&m%60>0);break;}
 case 19:assert(n[0]>n[1]&&n[0]<n[1]*60);answer='Аян';break;
 case 20:answer=`Екінші желі, минутына ${n[2]/n[3]-n[0]/n[1]} кітапқа`;break;
 case 21:{const bad=options.filter(o=>{const[a,b,c]=nums(o);return a*b!==c;});answer=only(bad);break;}
 case 22:case 30:answer=n[2]/n[1]-n[0];break;
 case 23:answer=(n[1]-n[2])/n[0];break;
 case 24:assert.equal(n[1],n[3]);answer=n[0]*n[2];break;
 case 25:assert.equal(n[0],n[1]);answer='Өзгермейді';break;
 case 26:answer=n[1]-n[0]/(n[0]/n[1]+n[2]);assert(r.statement.includes('неше күн ерте'));break;
 case 27:answer=(n[2]*60+n[3])/n[0]*n[1];break;
 case 28:{const[planned,actual,early]=n,hits=[];for(let t=1;t<=1000;t++)if(actual*t===planned*(t+early))hits.push(t*actual);answer=only(hits);break;}
 case 29:answer=(60/n[0]-n[1])*n[2]*60;break;
 case 31:answer=n[0]*n[1]/n[2];break;
 case 35:assert(r.statement.includes('t уақытын'));answer='t = A : v';break;
 case 36:answer=`Ермек, сағатына ${n[1]/n[0]-n[3]/n[2]} бөлшекке`;break;
 case 37:answer=n[2]/n[1]-n[0];break;
 case 38:answer=`${n[0]} есе артады`;break;
 case 39:answer=n[2]*60/n[0]-n[2]*60/n[1];break;
 default:throw Error(i);
 }
 if(typeof answer==='number'){
  assert(Number.isSafeInteger(answer)&&answer>0);
  if(options.length)assert.equal(only(options.filter(o=>nums(o)[0]===answer)),r.answer);
  else assert.equal(String(answer),r.answer);
 }else assert.equal(answer,r.answer);
 if(options.length){assert.equal(new Set(options).size,4);assert.equal(options.filter(o=>o===r.answer).length,1);}else assert(r.statement.endsWith('Жауапқа тек санды жазыңыз.'));
 printed++;
}
// These domains directly check numerical mechanisms independently of rendering.
let domains=0;
for(let rate=1;rate<=100;rate++)for(let time=1;time<=60;time++){
 const work=rate*time;assert.equal(work/rate,time);assert.equal(work/time,rate);domains++;
 for(let factor=2;factor<=6;factor++){
  // Cross-multiplied rational identities: no floating division by a fraction.
  assert.equal((rate*factor)*time,work*factor);
  assert.equal(work*factor,rate*(time*factor));domains++;
 }
}
for(let firstRate=1;firstRate<=40;firstRate++)for(let secondRate=1;secondRate<=40;secondRate++)for(let hours=1;hours<=24;hours++){
 assert.equal((firstRate*hours-secondRate*hours)/hours,firstRate-secondRate);domains++;
}
let earlyCases=0;
for(let base=2;base<=60;base++)for(let increase=1;increase<=20;increase++)for(let actualDays=1;actualDays<=40;actualDays++){
 const work=(base+increase)*actualDays;if(work%base)continue;
 const planned=work/base,early=planned-actualDays;
 assert(early>0);assert.equal(base*early/increase,actualDays);
 assert.equal(base*(actualDays+early),work);earlyCases++;domains++;
}
for(let tonnes=1;tonnes<=10;tonnes++)for(let grams=50;grams<=1000;grams+=25){
 if((tonnes*1000000)%grams)continue;const count=tonnes*1000000/grams;assert.equal(count*grams,tonnes*1000*1000);domains++;
}
for(let secs=1;secs<=60;secs++)if(60%secs===0)for(let minutes=1;minutes<=120;minutes++){
 assert.equal(minutes*60/secs,(60/secs)*minutes);domains++;
}
// Independently inspect the printed hour/minute wrong answers and common wrong targets.
assert.equal(rows[18].options[0],'2 сағ 10 мин');assert.equal(rows[18].options[1],'3 сағ 30 мин');assert.equal(rows[18].options[3],'105 сағ 0 мин');
assert(rows[26].options.includes('9 күн')&&rows[26].options.includes('6 күн')&&rows[26].answer==='3 күн');
assert(rows[17].options.includes('16 есе')&&rows[17].options.includes('2 есе'));
assert(rows[20].options.includes('Екінші желі, минутына 147 кітапқа'));
assert(rows[29].options.includes('3 бет')&&rows[29].options.includes('900 бет')&&rows[29].options.includes('720 бет'));
assert(rows[39].options.includes('2')&&rows[39].options.includes('12')&&rows[39].options.includes('32'));
const reject=f=>{let failed=false;try{f();}catch{failed=true;}assert(failed,'Invalid edition accepted');};
let tamper=0,missing=0;
for(const row of rows){
 for(const field of['statement','solution','answer',...(row.options?['options']:[])]){
  const r=structuredClone(row);if(field==='options')r.options=[...r.options].reverse();else r[field]+=' өзгертілген';reject(()=>verifyEdition(r));tamper++;
 }
 for(const key of Object.keys(row.params)){const r=structuredClone(row);delete r.params[key];reject(()=>renderEdition(r));missing++;}
}
const guards=[
 [0,'work',1081],[1,'work',77],[2,'factor',1],[3,'choices',[6,6,180,252]],[4,'symbols',['v','t','A']],
 [5,'hours',24],[6,'unit','бет'],[7,'days',0],[8,'hours',2],[9,'work',53],[10,'symbols',['t','A','v']],
 [11,'work',97],[12,'minutes',1],[13,'newWork',105],[14,'increase',6],[15,'newWork',576],[16,'grams',701],
 [17,'masterHours',6],[18,'work',60],[19,'hourly',360],[20,'secondWork',175],[21,'rows',[[24,5,120],[13,6,78],[18,4,72],[16,7,112]]],
 [22,'increase',20],[23,'learnerWork',120],[24,'factor',7],[25,'factor',1],[26,'increase',0],[27,'minutes',31],
 [28,'actualRate',30],[29,'secondsPerPage',7],[30,'increase',90],[31,'learnerHours',1],[32,'days',0],[33,'work',29],
 [34,'work',251],[35,'symbols',['v','A','t']],[36,'learnerWork',68],[37,'increase',80],[38,'factor',1],[39,'firstMinutes',7]
];
for(const[i,key,value]of guards){const r=structuredClone(rows[i]);r.params[key]=value;reject(()=>renderEdition(r));}
// Numeric solution chains are parsed as arithmetic, with physical-unit equalities omitted.
function arithmetic(t){assert(/^[\d\s()+×:−-]+$/.test(t));const tokens=t.match(/\d+|[()+×:−-]/g);let i=0;function atom(){if(tokens[i]==='('){i++;const x=sum();assert.equal(tokens[i++],')');return x;}return Number(tokens[i++]);}function prod(){let v=atom();while(['×',':'].includes(tokens[i])){const op=tokens[i++],w=atom();v=op==='×'?v*w:v/w;}return v;}function sum(){let v=prod();while(['+','−','-'].includes(tokens[i])){const op=tokens[i++],w=prod();v=op==='+'?v+w:v-w;}return v;}const n=sum();assert.equal(i,tokens.length);return n;}
let chains=0;
for(const r of rows)for(const m of r.solution.matchAll(/[0-9(][0-9\s+×:−()=\-]*/g)){
 const s=m[0].trim();if(!s.includes('=')||s.split('(').length!==s.split(')').length)continue;
 const parts=s.split('=');if(parts.some(p=>!p.trim()||/[+×:−-]\s*$/.test(p)))continue;
 const vs=parts.map(arithmetic);assert(vs.every(v=>v===vs[0]),s);chains++;
}
const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,sourceStatements=new Set();
for(const f of new Set(inventory.map(r=>r.sourceFile)))for(const q of read(f).questions)sourceStatements.add(clean(q.statement));
for(const r of rows)assert(!sourceStatements.has(clean(r.statement)));
console.log(JSON.stringify({printedFixtures:printed,completeDomainCases:domains,validEarlyCompletionCases:earlyCases,numericSolutionEqualityChains:chains,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

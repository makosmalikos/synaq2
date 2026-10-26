// Author checks: printed givens, fixed literal keys and complete finite domains. Not an independent signature.
import fs from'node:fs';import assert from'node:assert/strict';import{renderEdition,verifyEdition}from'./collection-ratios-models.mjs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),rows=read('problems/editorial/batches/collection-ratios-wave1.json').editions;
const gcd=(a,b)=>b?gcd(b,a%b):a,ratio=(a,b)=>`${a/gcd(a,b)} : ${b/gcd(a,b)}`,fraction=(a,b)=>`(${a/gcd(a,b)}/${b/gcd(a,b)})`;
const nums=s=>(s.match(/\d+(?:,\d+)?/g)||[]).map(x=>Number(x.replace(',','.'))),integral=x=>{assert(Number.isSafeInteger(x)&&x>0);return x;};
const keys=['3 : 5','3 : 5','40','2 : 3','20','28','4 : 1','75','240','14','30','5 : 1','32','7 : 3','252','2 : 3','15 : 4','49','56','6 : 10 : 35','720','9 : 25','160','6 : 7','9100','16','12 : 7','2940','24','66','9 : 10','128','2100','(4/11)','56','70','19 : 18','80','18','10','96','66','54','Тік бұрышты','1200'];
assert.equal(rows.length,45);assert.equal(new Set(rows.map(r=>r.editionId)).size,45);
let fullSourceReads=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],n=nums(r.statement);verifyEdition(r);assert.equal(r.answer,keys[i]);let answer;
 switch(i){
 case 0:case 1:answer=ratio(n[0],n[1]);break;
 case 2:answer=n[0]*n[2]/(n[1]+n[2]);break;
 case 3:answer=ratio(Math.round(n[0]*100),Math.round(n[1]*100));assert.equal(n[0],0.84);assert.equal(n[1],1.26);break;
 case 4:answer=n[2]*n[1]/n[0];assert(r.statement.includes('дана'));break;
 case 5:answer=n[2]*n[0]/(n[1]-n[0]);assert(r.statement.includes('КІШІ'));break;
 case 6:answer=ratio(n[0]*100,n[1]);assert(r.statement.includes('дәл осы ретпен'));break;
 case 7:answer=180*n[2]/(n[0]+n[1]+n[2]);break;
 case 8:answer=n[2]*n[0]/n[1];assert(r.statement.includes('грамм тұз'));break;
 case 9:answer=n[0]*n[1]/n[2];break;
 case 10:answer=n[0]*n[1]/(n[1]+n[2]);assert(r.statement.includes('ішінде')&&r.statement.includes('PR бөлігінің'));break;
 case 11:answer=ratio(n[0]*60,n[1]);break;
 case 12:answer=n[0]*n[2]/(n[1]+n[2]+n[3]);assert(r.statement.includes('ЕКІНШІ'));break;
 case 13:answer=ratio(n[0]+n[2],n[1]+n[2]);assert(r.statement.includes('жылдан кейін'));break;
 case 14:{const unit=n[2]/2/(n[0]+n[1]);answer=n[0]*unit*n[1]*unit;assert(r.statement.includes('Ауданы'));break;}
 case 15:answer=ratio(n[0]*n[3],n[1]*n[2]);assert.deepEqual(n,[3,5,9,10]);break;
 case 16:answer=ratio(Math.round(n[0]*100),Math.round(n[1]*100));assert.deepEqual(n,[1.8,0.48]);break;
 case 17:answer=n[2]*n[1]/(n[0]+n[1]);assert(r.statement.includes('КҮЛГІН'));break;
 case 18:answer=n[0]*n[1]/(n[1]+n[2]);break;
 case 19:{const raw=[n[0]*n[2],n[1]*n[2],n[3]*n[1]],g=gcd(gcd(raw[0],raw[1]),raw[2]);answer=raw.map(x=>x/g).join(' : ');break;}
 case 20:answer=n[2]*(n[0]+n[1])/(n[0]-n[1]);assert(r.statement.includes('толық массасы'));break;
 case 21:answer=ratio(n[0]**2,n[1]**2);assert(r.statement.includes('ауданының'));break;
 case 22:answer=n[0]*n[1]/(n[1]+n[2]);assert(r.statement.includes('неше бет оқыған'));break;
 case 23:{const unit=n[0]/(n[1]+n[2]);answer=ratio(n[1]*unit+n[3],n[2]*unit);assert(r.statement.includes('қыздар саны өзгермеді'));break;}
 case 24:answer=n[2]/n[0]*(n[0]+n[1]);assert(r.statement.includes('бірге'));break;
 case 25:answer=n[3]*n[0]/(n[0]+n[1]+n[2]);assert(n[0]+n[1]>n[2]);break;
 case 26:answer=ratio(n[0]+n[1],n[1]);assert(r.statement.includes('(a + b) : b'));break;
 case 27:answer=n[1]*n[2]/n[0];break;
 case 28:{const unit=n[2]*(n[4]-n[3])/(n[3]*n[1]-n[4]*n[0]);answer=n[0]*unit;assert(r.statement.includes('ЕКЕУІНЕ ДЕ'));assert.equal((answer+n[2])*n[4],(n[1]*unit+n[2])*n[3]);break;}
 case 29:answer=n[2]*(n[0]+n[1])/(n[1]-n[0]);assert(r.statement.includes('барлығы'));break;
 case 30:answer=ratio(n[0]*n[2],n[1]*n[3]);assert(r.statement.includes('шеткі a мен c'));break;
 case 31:answer=n[3]*(n[0]+n[1]+n[2])/(n[2]-n[0]);break;
 case 32:answer=n[2]*n[0]/(n[0]-n[1]);assert(r.statement.includes('БАСТАПҚЫДА')&&r.statement.includes('Данияр ақша жұмсамады'));break;
 case 33:answer=fraction(n[0],n[0]+n[1]);assert(r.statement.includes('барлық оқушы'));break;
 case 34:answer=n[2]*(n[0]+n[1])/(n[0]-n[1]);assert(r.statement.includes('Бастапқыда барлығы'));break;
 case 35:{const unit=n[0]/(n[1]+n[2]),copper=n[1]*unit,zinc=n[2]*unit;answer=zinc*n[3]/n[4]-copper;assert(r.statement.includes('ТЕК МЫС')&&r.statement.includes('Массаны жоғалтпай'));assert.equal((copper+answer)*n[4],zinc*n[3]);break;}
 case 36:answer=ratio(n[2]*n[0]+n[1],n[0]+n[3]*n[1]);assert(r.statement.includes('(3x + y) : (x + 2y)'));break;
 case 37:{const unit=Math.sqrt(n[2]/n[0]/n[1]);answer=2*(n[0]+n[1])*unit;assert(Number.isInteger(unit));assert(r.statement.includes('Периметрі'));break;}
 case 38:{const unit=n[2]*(n[3]-n[4])/(n[4]*n[0]-n[3]*n[1]);answer=n[1]*unit;assert.equal((n[0]*unit+n[2])*n[4],(answer+n[2])*n[3]);break;}
 case 39:answer=n[0]*n[1]/n[2];assert(r.statement.includes('Өнімділігі бірдей'));break;
 case 40:answer=360*n[0]/(n[0]+n[1]+n[2]);assert(r.statement.includes('доғаның градустық'));break;
 case 41:{const unit=n[3]*n[2]/(n[3]*n[1]-n[4]*n[0]);answer=(n[0]+n[1])*unit;assert.equal(n[0]*unit*n[4],(n[1]*unit-n[2])*n[3]);assert(r.statement.includes('Бастапқыда'));break;}
 case 42:answer=n[2]*n[1]/(n[1]-n[0]);assert(r.statement.includes('ҮЛКЕН'));break;
 case 43:{const angles=n.map(x=>180*x/n.reduce((s,x)=>s+x,0));assert.equal(Math.max(...angles),90);answer='Тік бұрышты';assert.notEqual(n[0],n[1]);break;}
 case 44:answer=Math.round(n[2]*1000)*n[1]/(n[0]+n[1]);assert(r.statement.includes('миллилитр шырын')&&r.statement.includes('Көлемдер қосылады'));break;
 }
 assert.equal(typeof answer==='number'?String(integral(answer)):answer,r.answer,`Printed row ${i+1}`);
 if(r.options){assert.equal(r.options.length,4);assert.equal(r.options.filter(o=>o===r.answer).length,1);let semantics=r.options;if(r.options.every(o=>/^\d+(\s*:\s*\d+)+$/.test(o))){semantics=r.options.map(o=>{const ns=nums(o),g=ns.reduce(gcd);return ns.map(x=>x/g).join(':');});}else if(r.options.every(o=>/^\(\d+\/\d+\)$/.test(o))){semantics=r.options.map(o=>fraction(...nums(o)));}assert.equal(new Set(semantics).size,4,'Semantically duplicate options');}else assert(r.statement.endsWith('Жауапқа тек санды жазыңыз.'));
 const ref=r.sourceRefs[0],capture=read(ref.sourceFile),source=capture.questions.filter(q=>String(q.number)===ref.sourceId);assert.equal(source.length,1);assert(capture.sourceReviewCaptured&&source[0].solution&&source[0].statement);assert(source[0].sourceAnswer||source[0].options?.filter(o=>o.correct).length===1||/Дұрыс жауап:/.test(source[0].openAnswerText||''));assert(!source[0].images?.length&&!source[0].svg?.length);fullSourceReads++;
}
let cases=0,commonMiddle=0,shareLedgers=0,changeLedgers=0,areaLedgers=0,inverseWork=0;
for(let a=1;a<=9;a++)for(let b=1;b<=9;b++)for(let unit=1;unit<=12;unit++){
 const first=a*unit,second=b*unit,total=first+second;assert.equal(total*a/(a+b),first);assert.equal(total*b/(a+b),second);if(a!==b)assert.equal(Math.abs(first-second)/Math.abs(a-b),unit);shareLedgers++;cases++;
 for(let added=1;added<=5;added++){const x=first+added,y=second+added;const g=gcd(x,y),pa=x/g,pb=y/g;assert.equal(pa*y,pb*x);if(a!==b){const den=pa*b-pb*a;assert.notEqual(den,0);assert.equal(added*(pb-pa)/den,unit);}changeLedgers++;cases++;}
 const sidesArea=first*second;assert.equal(Math.sqrt(sidesArea/(a*b)),unit);assert.equal(2*(first+second),2*(a+b)*unit);areaLedgers++;cases++;
}
for(let a=1;a<=8;a++)for(let b=1;b<=8;b++)for(let b2=1;b2<=8;b2++)for(let c=1;c<=8;c++){
 const vals=[a*b2,b*b2,c*b];assert.equal(vals[0]*b,vals[1]*a);assert.equal(vals[1]*c,vals[2]*b2);commonMiddle++;cases++;
}
for(let first=1;first<=15;first++)for(let days=1;days<=20;days++)for(let next=first+1;next<=20;next++){
 const work=first*days;if(work%next)continue;const answer=work/next;assert(answer<days);assert.equal(next*answer,work);inverseWork++;cases++;
}
let rejectCount=0,missing=0;const reject=fn=>{assert.throws(fn);};
for(const row of rows){for(const field of['statement','answer','solution',...(row.options?['options']:[])]){const r=structuredClone(row);if(field==='options')r.options=[...r.options].reverse();else r[field]+=' өзгертілген';reject(()=>verifyEdition(r));rejectCount++;}for(const key of Object.keys(row.params)){const r=structuredClone(row);delete r.params[key];reject(()=>renderEdition(r));missing++;}}
const guards=[[0,'a',50],[1,'b',20],[2,'total',71],[3,'a','0.8'],[4,'first',36],[5,'b',4],[6,'centimetres',70],[7,'c',6],[8,'second',841],[9,'second',3],[10,'total',67],[11,'minutes',25],[12,'total',97],[13,'child',43],[14,'perimeter',67],[15,'an',6],[16,'a','1.80'],[17,'total',85],[18,'b',9],[19,'c',2],[20,'b',5],[21,'a',5],[22,'total',361],[23,'added',12],[24,'first',2801],[25,'c',9],[26,'b',5],[27,'firstCost',1681],[28,'nextA',3],[29,'gap',19],[30,'c',0],[31,'gap',41],[32,'a',4],[33,'b',4],[34,'a',3],[35,'targetB',3],[36,'leftY',2],[37,'area',337],[38,'nextA',3],[39,'nextWorkers',11],[40,'c',7],[41,'nextB',12],[42,'b',5],[43,'c',4],[44,'litres','4.3']];
for(const[i,key,value]of guards){const r=structuredClone(rows[i]);r.params[key]=value;reject(()=>renderEdition(r));rejectCount++;}
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),allSourceStatements=new Set();for(const f of new Set(rows.map(r=>r.sourceRefs[0].sourceFile)))for(const q of read(f).questions)allSourceStatements.add(norm(q.statement));for(const r of rows)assert(!allSourceStatements.has(norm(r.statement)));
console.log(JSON.stringify({printedFixtures:45,sourceReferencesChecked:fullSourceReads,commonMiddleCases:commonMiddle,shareCases:shareLedgers,bothChangedCases:changeLedgers,rectangleSquaredCases:areaLedgers,inverseWorkCases:inverseWork,completeDomainCases:cases,tamperAndDomainRejected:rejectCount,missingParametersRejected:missing,semanticChoiceCollisions:0,sourceStatementMatches:0,status:'author_checks_passed_requires_external_review'}));

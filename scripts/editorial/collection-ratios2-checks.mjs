// Author checks only: exact rational printed-givens oracle, literal fixtures, finite domains and native fraction nodes.
import fs from'node:fs';import assert from'node:assert/strict';import{renderEdition,verifyEdition}from'./collection-ratios2-models.mjs';import{mathFragments}from'../../frontend/src/mathPresentation.js';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),rows=read('problems/editorial/batches/collection-ratios-wave2.json').editions;
const abs=x=>x<0n?-x:x,gcd=(a,b)=>b?gcd(b,a%b):abs(a),Q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert(d!==0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];},add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),sub=(a,b)=>Q(a[0]*b[1]-b[0]*a[1],a[1]*b[1]),mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]),div=(a,b)=>Q(a[0]*b[1],a[1]*b[0]);
const decimal=s=>{const [w,f='']=String(s).replace(',','.').split('.');return Q(w+f,10n**BigInt(f.length));},ns=s=>(s.match(/\d+(?:,\d+)?/g)||[]).map(decimal),one=xs=>{assert.equal(xs.length,1);return xs[0];},N=q=>{assert.equal(q[1],1n);return Number(q[0]);},eq=(a,b)=>assert.deepEqual(a,b),R=(a,b)=>{const r=div(a,b);return`${r[0]} : ${r[1]}`;};
function expression(s){s=s.replace(/[−]/g,'-').replace(/×/g,'*').replace(/:/g,'/');const ts=s.match(/\d+(?:,\d+)?|[()+*/-]/g)||[];assert.equal(ts.join(''),s.replace(/\s+/g,''));let i=0;function atom(){let t=ts[i++];if(t==='-')return mul(Q(-1),atom());if(t==='('){const v=sum();assert.equal(ts[i++],')');return v;}return decimal(t);}function product(){let a=atom();while(['*','/'].includes(ts[i])){const op=ts[i++],b=atom();a=op==='*'?mul(a,b):div(a,b);}return a;}function sum(){let a=product();while(['+','-'].includes(ts[i])){const op=ts[i++],b=product();a=op==='+'?add(a,b):sub(a,b);}return a;}const a=sum();assert.equal(i,ts.length);return a;}
const value=s=>expression(String(s).replace(/\s*(?:м³|кг|км|л|т|°)\s*$/,''));
const keys=['40','12 : 21 : 35','3900','6','4','4','63','3 : 4','18','40','35','4 : 7','21','3 : 4','4400','64°; 80°','42','7 + (1/28)','14','3,6 м³','12','7,02 т','0,4','-0,06','126','24','3','9,5','50','4','37','50°','-2,4','42; 36','0,6','13,2 л','108','504','21'];
assert.equal(rows.length,39);let nativeFractions=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],n=ns(r.statement),num=n.map(a=>Number(a[0])/Number(a[1]));verifyEdition(r);assert.equal(r.answer,keys[i]);let answer,ratio;
 switch(i){
 case 0:answer=div(mul(n[3],sub(n[2],n[0])),add(add(n[0],n[1]),n[2]));assert(r.statement.includes('c − a'));break;
 case 1:{const raw=[mul(n[0],n[2]),mul(n[1],n[2]),mul(n[3],n[1])].map(N),g=Number(gcd(gcd(BigInt(raw[0]),BigInt(raw[1])),BigInt(raw[2])));ratio=raw.map(x=>x/g).join(' : ');break;}
 case 2:answer=div(mul(mul(Q(2),n[2]),add(n[0],n[1])),sub(n[0],n[1]));assert(r.statement.includes('Ақша сыртқа жұмсалмады'));break;
 case 3:answer=div(mul(n[0],sub(n[1],n[2])),add(n[1],n[2]));assert(r.statement.includes('тек мырыш'));break;
 case 4:answer=div(mul(n[0],n[1]),add(n[0],n[1]));assert(r.statement.includes('су ағып шықпайды'));break;
 case 5:answer=div(mul(n[1],n[2]),Q(100000));break;
 case 6:answer=div(mul(Q(90),n[1]),add(n[0],n[1]));break;
 case 7:ratio=R(sub(n[1],n[0]),n[0]);assert(r.statement.includes('ҰЛДАР')&&r.statement.includes('ҚЫЗДАР'));break;
 case 8:{const scaleSquared=div(n[3],add(add(mul(n[0],n[0]),mul(n[1],n[1])),mul(n[2],n[2]))),scale=Math.sqrt(N(scaleSquared));assert(Number.isInteger(scale));answer=mul(n[2],Q(scale));break;}
 case 9:{const raw=[mul(n[0],n[2]),mul(n[1],n[2]),mul(n[3],n[1])];answer=div(mul(raw[1],n[4]),add(add(raw[0],raw[1]),raw[2]));break;}
 case 10:{const scale=div(mul(n[2],sub(n[3],n[4])),sub(mul(n[3],n[1]),mul(n[4],n[0])));answer=mul(n[0],scale);assert(r.statement.includes('БҰРЫН'));break;}
 case 11:ratio=R(n[1],n[0]);assert(r.statement.includes('БІР қарындаш')&&r.statement.includes('БІР дәптер'));break;
 case 12:answer=div(mul(n[0],n[1]),add(n[1],n[2]));assert(r.statement.includes('бір сәтте')&&r.statement.includes('Кездескенге дейін баяу'));break;
 case 13:ratio=R(n[0],n[1]);assert(r.statement.includes('ЖАҢА')&&r.statement.includes('БАСТАПҚЫ'));break;
 case 14:{const den=n.slice(1,7).filter((_,i)=>i%2===1);assert.deepEqual(den,[Q(3),Q(4),Q(6)]);const weights=den.map(x=>div(Q(1),x));answer=div(mul(n[0],weights[0]),weights.reduce(add));break;}
 case 15:{const scale=div(n[0],add(n[1],n[2])),pair=[mul(n[1],scale),mul(n[2],scale)];assert.deepEqual(ns(r.answer),pair);ratio=r.answer;break;}
 case 16:answer=div(mul(n[2],n[0]),mul(Q(2),add(n[0],n[1])));assert(r.statement.includes('ҰЗЫН'));break;
 case 17:{const left=add(n[1],div(n[2],n[3])),right=add(n[6],div(n[7],n[8])),small=div(n[4],n[5]);answer=add(n[0],div(mul(left,small),right));assert(answer[1]!==1n);break;}
 case 18:answer=div(mul(n[1],n[2]),mul(n[0],n[3]));break;
 case 19:answer=div(mul(n[0],n[2]),n[1]);break;
 case 20:answer=div(mul(n[0],n[1]),n[2]);break;
 case 21:answer=div(mul(n[1],n[2]),n[0]);eq(answer,Q(351,50));break;
 case 22:{const left=add(n[0],div(n[1],n[2])),right=add(n[3],div(n[4],n[5])),small=div(n[6],n[7]),root=div(mul(left,small),right);answer=mul(root,n.at(-1));eq(root,Q(2,125));assert(r.statement.includes('x ≠ 0'));break;}
 case 23:answer=div(mul(mul(n[0],Q(-1)),n[1]),n[2]);assert(r.statement.includes('(-0,4)'));break;
 case 24:answer=mul(n[1],n[2]);assert(r.statement.includes('тұрақты'));break;
 case 25:answer=mul(n[1],n[2]);assert(r.statement.includes('бірдей әрі тұрақты'));break;
 case 26:{const root=div(mul(n[0],n[2]),sub(n[2],n[1]));answer=div(root,n[3]);eq(root,Q(9));break;}
 case 27:{const root=div(sub(mul(n[2],n[4]),mul(n[5],n[1])),sub(mul(n[2],n[3]),mul(n[5],n[0])));answer=sub(mul(n[6],root),n[7]);eq(root,Q(27,5));break;}
 case 28:answer=div(mul(mul(mul(n[2],n[3]),n[4]),n[1]),n[0]);assert(r.statement.includes('ішкі өлшемдері'));break;
 case 29:answer=div(mul(n[2],n[1]),n[0]);assert(r.statement.includes('дәл сол массаға дейін'));break;
 case 30:answer=div(mul(n[0],n[2]),n[1]);assert(r.statement.includes('шығыны бірдей'));break;
 case 31:answer=div(mul(Q(180),sub(n[2],n[1])),add(add(n[0],n[1]),n[2]));assert(r.statement.includes('Ереже берілген')&&r.statement.includes('ЖАРТЫСЫНА'));break;
 case 32:answer=sub(mul(n[4],Q(-1)),div(n[2],n[3]));assert(r.statement.includes('b ≠ 0'));break;
 case 33:{const scale=div(n[2],add(n[0],n[1])),pair=[mul(n[0],scale),mul(n[1],scale)];assert.deepEqual(ns(r.answer),pair);const truths=r.options.map(o=>{const [a,b]=ns(o);return same(add(a,b),n[2])&&same(div(a,b),div(n[0],n[1]));});assert.equal(truths.filter(Boolean).length,1);ratio=r.answer;break;}
 case 34:{const first=sub(add(n[0],div(n[1],n[2])),n[3]),second=add(add(n[4],div(n[5],n[6])),n[7]);answer=div(first,second);assert(r.statement.includes('оң сандар'));break;}
 case 35:answer=div(mul(n[0],n[2]),n[1]);break;
 case 36:answer=Q(gcd(BigInt(num[0]),BigInt(num[1])));break;
 case 37:answer=Q(BigInt(num[0])*BigInt(num[1])/gcd(BigInt(num[0]),BigInt(num[1])));break;
 case 38:{const raw=[mul(n[0],n[2]),mul(n[1],n[2]),mul(n[3],n[1])];answer=div(mul(raw[1],n[4]),add(add(raw[0],raw[1]),raw[2]));for(let j=0;j<3;j++)assert(N(raw[j])<raw.filter((_,k)=>k!==j).reduce((s,x)=>s+N(x),0));break;}
 }
 if(ratio!==undefined)assert.equal(r.answer,ratio);else eq(value(r.answer),answer);
 if(r.options){assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(o=>o===r.answer).length,1);if(r.options.every(o=>!o.includes(':')&&!o.includes(';'))){const vals=r.options.map(value).map(x=>x.join('/'));assert.equal(new Set(vals).size,4,'Numeric-equivalent options');}}else assert(r.statement.endsWith('Жауапқа тек санды жазыңыз.'));
 const ref=r.sourceRefs[0],capture=read(ref.sourceFile),saved=one(capture.questions.filter(q=>String(q.number)===ref.sourceId));assert.equal(capture.sourceReviewCaptured,true);assert(saved.solution&&saved.statement&&(saved.sourceAnswer||saved.options?.some(o=>o.correct)||/Дұрыс жауап:/.test(saved.openAnswerText||'')));assert(!saved.images?.length&&!saved.svg?.length);
 const walk=ns=>ns.flatMap(n=>[n,...walk(n.numerator||[]),...walk(n.denominator||[]),...walk(n.fraction?[n.fraction]:[])]);for(const text of[r.statement,r.solution,r.answer,...r.options||[]]){const nodes=walk(mathFragments(text));nativeFractions+=nodes.filter(n=>n.type==='fraction').length;assert(!nodes.filter(n=>n.type==='text').some(n=>/\d\s*\/\s*\d/.test(n.value)),'Bare numeric fraction escaped native renderer');}
}
function same(a,b){return a[0]===b[0]&&a[1]===b[1];}
let transfer=0,squared=0,reciprocal=0,triangle=0,divisor=0;
for(let a=2;a<=12;a++)for(let b=1;b<a;b++)for(let k=1;k<=20;k++){const gap=(a-b)*k;if(gap%2)continue;const t=gap/2,first=a*k-t,second=b*k+t;assert.equal(first,second);assert.equal(first+second,(a+b)*k);transfer++;}
for(let a=1;a<=5;a++)for(let b=a+1;b<=7;b++)for(let c=b+1;c<=8;c++)for(let k=1;k<=8;k++){const ss=(a*k)**2+(b*k)**2+(c*k)**2;assert.equal(Math.sqrt(ss/(a*a+b*b+c*c)),k);squared++;}
for(let an=1;an<=4;an++)for(let ad=1;ad<=5;ad++)for(let bn=1;bn<=4;bn++)for(let bd=1;bd<=5;bd++)for(let cd=1;cd<=5;cd++){const a=Q(an,ad),b=Q(bn,bd),c=Q(1,cd),x=div(mul(a,c),b);eq(div(a,x),div(b,c));reciprocal++;}
for(let a=1;a<=7;a++)for(let b=1;b<=7;b++)for(let b2=1;b2<=7;b2++)for(let c=1;c<=7;c++){const x=a*b2,y=b*b2,z=c*b;if(x+y<=z||x+z<=y||y+z<=x)continue;for(let k=1;k<=5;k++){const perimeter=(x+y+z)*k;assert.equal(perimeter*y/(x+y+z),y*k);triangle++;}}
for(let a=2;a<=60;a++)for(let b=2;b<=60;b++){const g=Number(gcd(BigInt(a),BigInt(b))),l=a/g*b;let max=0;for(let d=1;d<=Math.min(a,b);d++)if(a%d===0&&b%d===0)max=d;assert.equal(g,max);let candidate=Math.max(a,b);while(candidate%a||candidate%b)candidate++;assert.equal(candidate,l);divisor++;}
const reject=f=>assert.throws(f);let tampered=0,missing=0;
for(const r of rows){for(const field of['statement','answer','solution',...(r.options?['options']:[])]){const bad=structuredClone(r);if(field==='options')bad.options=bad.options.slice().reverse();else bad[field]+=' өзгертілген';reject(()=>verifyEdition(bad));tampered++;}for(const field of Object.keys(r.params)){const bad=structuredClone(r);delete bad.params[field];reject(()=>renderEdition(bad));missing++;}}
const guards=[[0,'total',151],[1,'b2',0],[2,'b',8],[3,'b',5],[4,'secondHours',12],[5,'cm',4],[6,'b',8],[7,'numerator',7],[8,'squares',442],[9,'total',116],[10,'years',0],[11,'secondCount',7],[12,'distance',57],[13,'widthDivisor',3],[14,'total',9901],[15,'angle',145],[16,'perimeter',133],[17,'leftDen',5],[18,'coefficient',5],[19,'massHundredths',0],[20,'newBoxes',36],[21,'volume',1],[22,'leftNum',4],[23,'rightDivisorTenths',0],[24,'multiple',1],[25,'reduction',4],[26,'rightDen',7],[27,'leftCoefficient',0],[28,'knownVolume',0],[29,'targetMass',241],[30,'targetMetres',149],[31,'c',11],[32,'givenNum',5],[33,'total',79],[34,'leftDen',3],[35,'knownMassTenths',0],[36,'a',324],[37,'a',29],[38,'c',20]];
for(const[i,key,val]of guards){const r=structuredClone(rows[i]);r.params[key]=val;reject(()=>renderEdition(r));}
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),old=new Set();for(const f of new Set(rows.map(r=>r.sourceRefs[0].sourceFile)))for(const q of read(f).questions)old.add(norm(q.statement));for(const r of rows)assert(!old.has(norm(r.statement)));
console.log(JSON.stringify({printedFixtures:39,completeTransferLedgers:transfer,squaredTripleCases:squared,reciprocalRationalCases:reciprocal,validTriangleLedgers:triangle,bruteGcdLcmCases:divisor,nativeFractionNodes:nativeFractions,fieldTamperRejected:tampered,missingParamsRejected:missing,domainGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_requires_external_review'}));

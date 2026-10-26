// Author checks only: exact rational printed-givens oracle, literal fixtures, finite domains and native fraction nodes.
import fs from'node:fs';import assert from'node:assert/strict';import{renderEdition,verifyEdition}from'./collection-ratios3-models.mjs';import{mathFragments}from'../../frontend/src/mathPresentation.js';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),rows=read('problems/editorial/batches/collection-ratios-wave3.json').editions;
const abs=x=>x<0n?-x:x,gcd=(a,b)=>b?gcd(b,a%b):abs(a),Q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert(d!==0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];},add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),sub=(a,b)=>Q(a[0]*b[1]-b[0]*a[1],a[1]*b[1]),mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]),div=(a,b)=>Q(a[0]*b[1],a[1]*b[0]);
const decimal=s=>{const [w,f='']=String(s).replace(',','.').split('.');return Q(w+f,10n**BigInt(f.length));},ns=s=>(s.match(/\d+(?:,\d+)?/g)||[]).map(decimal),one=xs=>{assert.equal(xs.length,1);return xs[0];},N=q=>{assert.equal(q[1],1n);return Number(q[0]);},eq=(a,b)=>assert.deepEqual(a,b),R=(a,b)=>{const r=div(a,b);return`${r[0]} : ${r[1]}`;};
function expression(s){s=s.replace(/[−]/g,'-').replace(/³/g,'^3').replace(/²/g,'^2').replace(/×/g,'*').replace(/:/g,'/');const ts=s.match(/\d+(?:,\d+)?|[()+*/^-]/g)||[];assert.equal(ts.join(''),s.replace(/\s+/g,''));let i=0;function atom(){let t=ts[i++];if(t==='-')return mul(Q(-1),atom());if(t==='('){const v=sum();assert.equal(ts[i++],')');return v;}let v=decimal(t);if(ts[i]==='^'){i++;const power=Number(ts[i++]);assert(Number.isInteger(power)&&power>=0&&power<=6);let r=Q(1);for(let k=0;k<power;k++)r=mul(r,v);v=r;}return v;}function product(){let a=atom();while(['*','/'].includes(ts[i])){const op=ts[i++],b=atom();a=op==='*'?mul(a,b):div(a,b);}return a;}function sum(){let a=product();while(['+','-'].includes(ts[i])){const op=ts[i++],b=product();a=op==='+'?add(a,b):sub(a,b);}return a;}const a=sum();assert.equal(i,ts.length);return a;}
const value=s=>expression(String(s).replace(/\s*(?:м³|сағ|см|мин|м|кг|км|л|т|°)\s*$/,''));
const keys=['27,3','6,5 сағ','17,5','34,5 кг','15','10,8 кг','2 + (1/12)','3,5 сағ','(1/12)','6 кг','9','8,1 км','7 + (1/2)','3,75 сағ','(5/24)','188','0,025','48 мин','18','32','0,5','18','2','80; 64','12','36 см','49','19,5','6','4','15','6','1,75 м','4','3 + (3/4)','30','132°','14','20','108','36','5,84','18','45 см','6','41400','10','10'];
assert.equal(rows.length,48);let nativeFractions=0;
const mixed=(n,w)=>add(n[w],div(n[w+1],n[w+2]));
for(let i=0;i<rows.length;i++){
 const r=rows[i],n=ns(r.statement);verifyEdition(r);assert.equal(r.answer,keys[i]);let answer,pair;
 switch(i){
 case 0:case 2:answer=div(mul(div(n[0],n[1]),n[3]),n[2]);break;
 case 1:case 7:answer=div(mul(n[1],n[2]),n[0]);assert(r.statement.includes('тұрақты'));break;
 case 3:case 5:answer=div(mul(n[1],n[2]),n[0]);break;
 case 4:answer=div(mul(div(mixed(n,0),mixed(n,3)),n[8]),div(n[6],n[7]));eq(mixed(n,0),Q(19,8));eq(mixed(n,3),Q(19,4));break;
 case 6:answer=div(mul(div(div(n[0],n[1]),n[2]),div(n[4],n[5])),n[3]);assert(answer[0]>answer[1]);break;
 case 8:answer=div(div(mixed(n,0),div(mixed(n,4),n[7])),n[3]);assert(r.statement.includes('x ≠ 0'));break;
 case 9:answer=div(mul(n[0],n[1]),n[2]);break;
 case 10:eq(mixed(n,0),n[4]);answer=div(n[5],n[3]);assert(r.statement.includes('x ≠ 0'));break;
 case 11:answer=div(mul(n[1],n[2]),n[0]);break;
 case 12:answer=div(mul(div(n[0],div(n[1],n[2])),mixed(n,4)),n[3]);break;
 case 13:answer=div(mul(n[0],n[1]),n[2]);assert(r.statement.includes('таңба саны өзгермейді'));break;
 case 14:answer=div(mul(div(n[0],n[1]),div(n[4],n[5])),div(n[2],n[3]));break;
 case 15:answer=div(mul(n[0],n[2]),n[1]);assert(r.statement.includes('сырғымайды'));break;
 case 16:answer=div(mul(div(n[3],n[4]),div(n[1],n[2])),n[0]);eq(answer,Q(1,40));break;
 case 17:answer=div(mul(n[0],n[2]),n[1]);break;
 case 18:answer=div(div(n[0],div(mixed(n,3),mixed(n,6))),div(n[1],n[2]));eq(mixed(n,3),Q(11,5));eq(mixed(n,6),Q(11,2));break;
 case 19:answer=div(mul(n[0],n[2]),n[1]);break;
 case 20:answer=div(div(mixed(n,0),div(mixed(n,5),div(n[8],n[9]))),div(n[3],n[4]));break;
 case 21:answer=div(mul(n[0],n[2]),n[1]);assert(r.statement.includes('Бірдей тапсырысты'));break;
 case 22:answer=sub(mul(div(n[0],n[1]),n[3]),n[2]);break;
 case 23:{const [apart,bpart]=r.statement.split(';'),a=expression(apart.split('=')[1].trim()),right=bpart.split('=')[1].trim();let depth=0,end;for(let j=0;j<right.length;j++){if(right[j]==='(')depth++;if(right[j]===')')depth--;if(depth===0){end=j+1;break;}}const b=expression(right.slice(0,end));eq(a,Q(20));eq(b,Q(16));const total=n.at(-1);pair=[div(mul(a,total),add(a,b)),div(mul(b,total),add(a,b))];break;}
 case 24:answer=add(n[3],mul(n[4],div(n[2],n[1])));assert(r.statement.includes('x, y > 0'));break;
 case 25:answer=div(mul(n[0],n[2]),add(n[1],n[2]));assert(r.statement.includes('КІШІ'));break;
 case 26:answer=div(mul(n[1],n[2]),n[0]);break;
 case 27:answer=sub(mul(div(n[0],n[1]),n[3]),n[2]);break;
 case 28:case 42:answer=div(mul(n[0],n[1]),n[2]);break;
 case 29:answer=div(div(mul(n[0],n[2]),n[1]),n[3]);assert(r.statement.includes('БІР күнде')&&r.statement.includes('Бүкіл тапсырысты'));break;
 case 30:answer=mul(div(n[0],add(n[1],div(n[2],n[3]))),n[4]);eq(answer,Q(15));break;
 case 31:answer=Q(gcd(gcd(n[0][0],n[1][0]),n[2][0]));break;
 case 32:answer=div(mul(n[0],n[1]),n[2]);break;
 case 33:answer=div(mul(n[0],n[3]),mul(n[1],n[2]));assert(r.statement.includes('x ≠ 0'));break;
 case 34:answer=add(n[4],div(n[5],mixed(n,1)));assert(r.statement.includes('m, n > 0'));break;
 case 35:answer=div(mul(sub(n[1],n[0]),Q(100)),n[1]);assert(!r.statement.includes('негізі'));break;
 case 36:answer=div(mul(Q(180),n[1]),add(n[0],n[1]));break;
 case 37:{const root=div(sub(mul(n[3],n[0]),mul(n[2],n[1])),sub(n[2],n[3]));answer=add(n.at(-2),mul(n.at(-1),root));assert(root[0]+n[1][0]!==0n);eq(root,Q(4));break;}
 case 38:answer=div(mul(n[0],n[3]),add(add(n[0],n[1]),n[2]));assert(N(add(n[0],n[1]))>N(n[2]));break;
 case 39:answer=div(mul(mul(n[0],n[1]),n[1]),n[2]);assert(r.statement.includes('ДИАМЕТРІ'));break;
 case 40:answer=mul(div(n[0],mixed(n,1)),mixed(n,4));break;
 case 41:answer=div(mul(n[1],n[2]),n[0]);break;
 case 43:answer=div(mul(n[3],n[4]),add(add(n[0],n[1]),add(n[2],n[3])));assert(N(sub(n[3],n[2]))<2*N(n[0]));break;
 case 44:{const root=mul(n[0],n[1]);answer=mul(root,n[2]);assert(!same(answer,root));break;}
 case 45:answer=mul(div(n[1],n[0]),add(add(n[0],n[2]),n[3]));assert(r.statement.includes('ҮШ КҮННІҢ'));break;
 case 46:{const a=N(n[0]),b=N(n[1]),list=[];for(let k=10;k<100;k++)if(k%a===0&&k%b!==0)list.push(k);answer=Q(list.length);assert.equal(list.length,10);break;}
 case 47:{const root=div(add(mul(n[5],n[1]),mul(n[4],n[3])),mul(n[0],sub(n[4],n[5])));eq(root,Q(4));assert(!same(mul(n[0],root),n[3]));answer=sub(mul(add(Q(1),n.at(-1)),root),n.at(-2));break;}
 default:throw Error(i);
 }
 if(pair){assert.deepEqual(ns(r.answer),pair);assert.equal(r.options.filter(o=>{const xs=ns(o);return xs.length===2&&same(xs[0],pair[0])&&same(xs[1],pair[1]);}).length,1);}else eq(value(r.answer),answer);
 assert.equal(r.options.length,4);assert.equal(r.options.filter(o=>o===r.answer).length,1);if(!pair){const vals=r.options.map(value).map(x=>x.join('/'));assert.equal(new Set(vals).size,4,'Equivalent numeric MCQs');}
 const ref=r.sourceRefs[0],cap=read(ref.sourceFile),saved=one(cap.questions.filter(q=>String(q.number)===ref.sourceId));assert(cap.sourceReviewCaptured&&saved.statement&&saved.solution&&(saved.sourceAnswer||saved.options?.some(o=>o.correct)||/Дұрыс жауап:/.test(saved.openAnswerText||'')));assert(!saved.images?.length&&!saved.svg?.length);
 const walk=ns=>ns.flatMap(n=>[n,...walk(n.numerator||[]),...walk(n.denominator||[]),...walk(n.fraction?[n.fraction]:[])]);for(const text of[r.statement,r.solution,r.answer,...r.options]){const nodes=walk(mathFragments(text));nativeFractions+=nodes.filter(n=>n.type==='fraction').length;assert(!nodes.some(n=>n.type==='text'&&/\d\s*\/\s*\d/.test(n.value)),'Bare numeric fraction escaped native renderer');}
}
function same(a,b){return a[0]===b[0]&&a[1]===b[1];}
let gear=0,affine=0,cylinder=0,cube=0,gcd3=0,exclusions=0;
for(let a=4;a<=20;a++)for(let b=a+1;b<=30;b++)for(let turns=1;turns<=20;turns++){if(a*turns%b)continue;const next=a*turns/b;assert.equal(b*next,a*turns);assert(next<turns);gear++;}
for(let coefficient=1;coefficient<=7;coefficient++)for(let top=1;top<=7;top++)for(let bottom=1;bottom<=7;bottom++)for(let num=2;num<=7;num++)for(let den=1;den<num;den++){const root=Q(den*top+num*bottom,coefficient*(num-den)),divisor=sub(mul(Q(coefficient),root),Q(bottom));if(divisor[0]===0n)continue;eq(div(add(mul(Q(coefficient),root),Q(top)),divisor),Q(num,den));affine++;}
for(let mass=1;mass<=12;mass++)for(let d=2;d<=6;d++)for(let shortened=2;shortened<=5;shortened++){const r=Q(d*d,shortened);eq(mul(Q(mass),r),Q(mass*d*d,shortened));assert(!same(r,Q(d,shortened)));cylinder++;}
for(let num=1;num<=4;num++)for(let den=2;den<=8;den++)for(let difference=1;difference<=6;difference++){const c=Q(num,den),expanded=sub(mul(c,Q(difference+2)),mul(c,Q(2))),full=div(expanded,mul(mul(c,c),c));eq(full,div(Q(difference),mul(c,c)));cube++;}
for(let a=2;a<=25;a++)for(let b=2;b<=25;b++)for(let c=2;c<=25;c++){const g=Number(gcd(gcd(BigInt(a),BigInt(b)),BigInt(c)));let max=0;for(let d=1;d<=Math.min(a,b,c);d++)if(a%d===0&&b%d===0&&c%d===0)max=d;assert.equal(g,max);gcd3++;}
for(let base=2;base<=20;base++){const list=[];for(let n=10;n<100;n++)if(n%base===0&&n%(3*base)!==0)list.push(n);assert.equal(list.length,Math.floor(99/base)-Math.floor(9/base)-Math.floor(99/(3*base))+Math.floor(9/(3*base)));exclusions++;}
const reject=f=>assert.throws(f);let tamper=0,missing=0;for(const r of rows){for(const field of['statement','answer','solution','options']){const bad=structuredClone(r);if(field==='options')bad.options=bad.options.slice().reverse();else bad[field]+=' өзгертілген';reject(()=>verifyEdition(bad));tamper++;}for(const key of Object.keys(r.params)){const bad=structuredClone(r);delete bad.params[key];reject(()=>renderEdition(bad));missing++;}}
const guards=[[0,'coefficient',0],[1,'targetKm',420],[2,'rightDenTenths',100],[3,'knownLitres',0],[4,'leftNum',4],[5,'knownKg',0],[6,'lastNum',1],[7,'targetKm',336],[8,'coefficient',0],[9,'newBoxes',18],[10,'rightThousandths',3626],[11,'knownLaps',0],[12,'lastNum',7],[13,'targetPerMin',180],[14,'secondTenths',24],[15,'secondTeeth',36],[16,'rightThousandths',0],[17,'targetPages',361],[18,'lastNum',2],[19,'targetKg',11],[20,'rightNum',4],[21,'secondMinutes',8],[22,'lastTenths',35],[23,'divideDen',21],[24,'x',0],[25,'b',5],[26,'targetFirst',29],[27,'last',40],[28,'nextWorkers',28],[29,'nextWorkers',13],[30,'multiplier',500],[31,'a',1],[32,'nextLengthTenths',23],[33,'coefficient',5],[34,'num',3],[35,'first',20],[36,'b',10],[37,'rightNum',5],[38,'c',9],[39,'diameterFactor',1],[40,'lastNum',5],[41,'knownVolume',0],[42,'nextWorkers',16],[43,'secondBase',15],[44,'multiple',1],[45,'firstHours',7],[46,'excluded',12],[47,'rightNum',3]];
let guarded=0;for(const[i,key,v]of guards){const r=structuredClone(rows[i]);r.params[key]=v;reject(()=>renderEdition(r));guarded++;}
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),old=new Set();for(const f of new Set(rows.map(r=>r.sourceRefs[0].sourceFile)))for(const q of read(f).questions)old.add(norm(q.statement));for(const r of rows)assert(!old.has(norm(r.statement)));
console.log(JSON.stringify({printedFixtures:48,gearLedgers:gear,exactAffineNonzeroDenominatorCases:affine,cylinderDiameterSquaredCases:cylinder,decimalCubeCommonFactorCases:cube,bruteThreeGcdCases:gcd3,twoDigitExclusionDomains:exclusions,nativeFractionNodes:nativeFractions,contentTamperRejected:tamper,missingParametersRejected:missing,invalidDomainCanariesRejected:guarded,sourceStatementMatches:0,status:'author_checks_passed_requires_external_review'}));

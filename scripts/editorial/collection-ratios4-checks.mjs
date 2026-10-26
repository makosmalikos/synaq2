// Author checks only: exact rational printed-givens oracle, literal fixtures, finite domains and native fraction nodes.
import fs from'node:fs';import assert from'node:assert/strict';import{renderEdition,verifyEdition}from'./collection-ratios4-models.mjs';import{mathFragments}from'../../frontend/src/mathPresentation.js';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),rows=read('problems/editorial/batches/collection-ratios-wave4.json').editions;
const abs=x=>x<0n?-x:x,gcd=(a,b)=>b?gcd(b,a%b):abs(a),Q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert(d!==0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];},add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),sub=(a,b)=>Q(a[0]*b[1]-b[0]*a[1],a[1]*b[1]),mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]),div=(a,b)=>Q(a[0]*b[1],a[1]*b[0]);
const decimal=s=>{const [w,f='']=String(s).replace(',','.').split('.');return Q(w+f,10n**BigInt(f.length));},ns=s=>(s.match(/\d+(?:,\d+)?/g)||[]).map(decimal),one=xs=>{assert.equal(xs.length,1);return xs[0];},N=q=>{assert.equal(q[1],1n);return Number(q[0]);},eq=(a,b)=>assert.deepEqual(a,b),R=(a,b)=>{const r=div(a,b);return`${r[0]} : ${r[1]}`;};
function expression(s){s=s.replace(/[−]/g,'-').replace(/³/g,'^3').replace(/²/g,'^2').replace(/×/g,'*').replace(/:/g,'/');const ts=s.match(/\d+(?:,\d+)?|[()+*/^-]/g)||[];assert.equal(ts.join(''),s.replace(/\s+/g,''));let i=0;function atom(){let t=ts[i++];if(t==='-')return mul(Q(-1),atom());if(t==='('){const v=sum();assert.equal(ts[i++],')');return v;}let v=decimal(t);if(ts[i]==='^'){i++;const power=Number(ts[i++]);assert(Number.isInteger(power)&&power>=0&&power<=6);let r=Q(1);for(let k=0;k<power;k++)r=mul(r,v);v=r;}return v;}function product(){let a=atom();while(['*','/'].includes(ts[i])){const op=ts[i++],b=atom();a=op==='*'?mul(a,b):div(a,b);}return a;}function sum(){let a=product();while(['+','-'].includes(ts[i])){const op=ts[i++],b=product();a=op==='+'?add(a,b):sub(a,b);}return a;}const a=sum();assert.equal(i,ts.length);return a;}
const value=s=>expression(String(s).replace(/\s*(?:м³|см²|сағ|см|мин|км|кг|тг|м|г|л|т|°)\s*$/,''));
const keys=['0,04','135 г','15 сағ','AB = 42; BC = 35; AC = 31,5','5 : 9','-0,6','(6/7)','140,4','(9/13)','48','12,5','18 + (4/7)','18 сағ','42','-1,6','34,8','72','2450 тг','8','150','11','13','37,68 см','62,8 см','1318,8 см','200,96 см²','78,5 см²','113,04 см','43,96 см','193,5 см²','50,24 см','175,84 см²','153,86 см²','565,2 м'];
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1],mixed=(n,i)=>add(n[i],div(n[i+1],n[i+2])),square=x=>mul(x,x),root=n=>{assert.equal(n[1],1n);let r=0n;while(r*r<n[0])r++;assert.equal(r*r,n[0]);return Q(r);};
assert.equal(rows.length,34);let nativeFractions=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],n=ns(r.statement);verifyEdition(r);assert.equal(r.answer,keys[i]);let answer,pair;
 switch(i){
 case 0:answer=div(mixed(n,0),div(mixed(n,3),div(n[6],n[7])));assert(r.statement.includes('Тек x')&&r.statement.includes('x ≠ 0'));break;
 case 1:answer=mul(div(n[1],n[0]),n[2]);assert(r.statement.includes('Құрамы бірдей'));break;
 case 2:case 12:answer=div(n[1],n[2]);assert(r.statement.includes('бірдей әрі тұрақты'));eq(mul(n[0],n[1]),mul(mul(n[0],n[2]),answer));break;
 case 3:{const a=mul(n[0],n[2]),b=mul(n[1],n[2]),c=mul(n[1],n[3]),unit=div(n[4],add(add(a,b),c));pair=[mul(a,unit),mul(b,unit),mul(c,unit)];eq(div(pair[0],pair[1]),div(n[0],n[1]));eq(div(pair[1],pair[2]),div(n[2],n[3]));eq(add(add(pair[0],pair[1]),pair[2]),n[4]);for(let j=0;j<3;j++)assert(Number(add(pair[j],pair[(j+1)%3])[0])/Number(add(pair[j],pair[(j+1)%3])[1])>Number(pair[(j+2)%3][0])/Number(pair[(j+2)%3][1]));assert(r.statement.includes('AB, BC, AC'));break;}
 case 4:answer=div(root(n[0]),root(n[1]));assert(r.statement.includes('ұзындықтарының қатынасын дәл осы ретпен'));break;
 case 5:answer=div(sub(mul(Q(-1),div(n[2],n[3])),n[4]),n[6]);assert(r.statement.includes('b ≠ 0')&&r.statement.includes('= -(2/5)'));break;
 case 6:{const nums={'бір':1,'екі':2,'үш':3,'төрт':4,'бес':5,'алты':6,'жеті':7,'сегіз':8,'тоғыз':9,'он':10},dens={'екіден':2,'үштен':3,'төрттен':4,'бестен':5,'алтыдан':6,'жетіден':7,'сегізден':8,'тоғыздан':9,'оннан':10},parts=[...r.statement.matchAll(/(екіден|үштен|төрттен|бестен|алтыдан|жетіден|сегізден|тоғыздан|оннан) (бір|екі|үш|төрт|бес|алты|жеті|сегіз|тоғыз|он)/g)].map(m=>Q(nums[m[2]],dens[m[1]]));assert.equal(parts.length,3);assert(parts[0][0]>parts[0][1]);answer=div(parts[2],mul(parts[0],parts[1]));eq(mul(mul(answer,parts[0]),parts[1]),parts[2]);break;}
 case 7:answer=mul(Q(2),mul(div(n[2],sub(n[1],n[0])),add(n[0],n[1])));assert(r.statement.includes('Периметрі'));break;
 case 8:answer=div(n[1],add(n[0],n[1]));assert(r.statement.includes('САРЫ')&&r.statement.includes('барлық'));break;
 case 9:answer=mul(div(n[0],add(n[1],n[2])),n[2]);assert(r.statement.includes('ШИЕ'));break;
 case 10:answer=div(n[0],div(n[1],n[2]));assert(r.statement.includes('x ≠ 0'));break;
 case 11:{const a=mul(add(sub(mixed(n,0),mixed(n,3)),mixed(n,6)),n[9]),b=div(sub(mul(n[10],n[11]),mul(n[12],n[13])),square(n[14]));eq(a,Q(35,2));eq(b,Q(5));answer=div(n[15],div(a,b));assert(r.statement.includes('(65/(a : b))'));break;}
 case 13:answer=mul(div(n[0],n[1]),n[2]);assert(r.statement.includes('сол жылдамдықпен'));break;
 case 14:{assert(r.statement.includes('(-7,5/20)'));const x=div(mul(n[0],mul(Q(-1),n[1])),n[2]);answer=add(mul(n[3],x),n[4]);eq(x,Q(-6,5));assert(r.statement.includes('өрнегінің'));break;}
 case 15:answer=div(mul(div(n[0],n[1]),n[3]),n[2]);break;
 case 16:answer=n[1];assert(r.statement.includes('ЕКІ санды да'));eq(n[2],n[3]);eq(n[3],n[4]);break;
 case 17:answer=mul(div(n[1],n[0]),n[2]);break;
 case 18:{const quotient=sub(n[4],n[3]),denominator=div(n[0],quotient),x=div(sub(n[1],denominator),n[2]);answer=x;assert(denominator[0]!==0n);eq(add(div(n[0],sub(n[1],mul(n[2],x))),n[3]),n[4]);break;}
 case 19:answer=mul(div(n[0],add(n[1],n[2])),n[1]);assert(r.statement.includes('ҚЫЗДАР'));break;
 case 20:{const x=div(mixed(n,4),div(mixed(n,0),n[3]));answer=mul(n[8],x);assert(!same(answer,x)&&r.statement.includes('4x мәнін'));break;}
 case 21:{const ratio=add(div(n[1],n[2]),div(n[3],n[4]));answer=div(add(Q(1),mul(n[5],ratio)),sub(Q(1),ratio));assert(!same(ratio,Q(1)));break;}
 case 22:case 28:case 30:answer=mul(mul(Q(2),n[1]),root(div(n[0],n[1])));assert(r.statement.includes('ҰЗЫНДЫҒЫН'));break;
 case 23:case 27:answer=mul(mul(n[0],n[3]),div(n[1],n[2]));assert(r.statement.includes('диаметрі')&&r.statement.includes('доғаның'));break;
 case 24:answer=mul(mul(n[0],n[2]),n[1]);assert(r.statement.includes('СЫРҒЫМАЙ')&&r.statement.includes('толық айналым'));break;
 case 25:case 26:case 32:{const oldRadius=div(n[0],mul(Q(2),n[2])),newRadius=div(oldRadius,n[1]);answer=mul(n[2],square(newRadius));assert(r.statement.includes('ЖАҢА'));eq(mul(oldRadius,mul(Q(2),n[2])),n[0]);break;}
 case 29:answer=sub(square(n[0]),mul(n[1],square(div(n[0],Q(2)))));assert(r.statement.includes('ЕҢ ҮЛКЕН')&&r.statement.includes('Қалған'));break;
 case 31:answer=mul(n[2],sub(square(n[0]),square(n[1])));assert(r.statement.includes('Ортақ центрлі')&&r.statement.includes('САҚИНАНЫҢ'));break;
 case 33:answer=mul(mul(mul(Q(2),n[0]),n[2]),n[1]);assert(r.statement.includes('РАДИУСЫ')&&r.statement.includes('сырғымай'));break;
 default:throw Error(i);
 }
 assert.equal(r.options.length,4);assert.equal(r.options.filter(x=>x===r.answer).length,1);
 if(pair){assert.deepEqual(ns(r.answer),pair);assert.equal(r.options.filter(o=>{const xs=ns(o);return xs.length===3&&xs.every((x,j)=>same(x,pair[j]));}).length,1);}
 else{eq(value(r.answer),answer);const values=r.options.map(value).map(x=>x.join('/'));assert.equal(new Set(values).size,4,'Equivalent numeric MCQs');}
 const ref=r.sourceRefs[0],cap=read(ref.sourceFile),saved=one(cap.questions.filter(q=>String(q.number)===ref.sourceId));assert(cap.sourceReviewCaptured&&saved.statement&&saved.solution&&(saved.sourceAnswer||saved.options?.some(o=>o.correct)||/Дұрыс жауап:/.test(saved.openAnswerText||'')));assert(!saved.images?.length&&!saved.svg?.length);if(i<22)assert(Number(ref.sourceId)<=22);if(i>=22)eq(n.at(-1),Q(157,50));
 const walk=nodes=>nodes.flatMap(n=>[n,...walk(n.numerator||[]),...walk(n.denominator||[]),...walk(n.fraction?[n.fraction]:[])]);for(const text of[r.statement,r.solution,r.answer,...r.options]){const nodes=walk(mathFragments(text));nativeFractions+=nodes.filter(n=>n.type==='fraction').length;assert(!nodes.some(n=>n.type==='text'&&/\d\s*\/\s*\d/.test(n.value)),'Bare numeric fraction escaped native renderer');}
 if(i===11){const nodes=mathFragments(r.statement);assert(nodes.some(n=>n.type==='fraction'&&JSON.stringify(n.denominator).includes('a : b')),'Outer ratio denominator must be a native fraction');}
}
let workers=0,mixes=0,triangle=0,arc=0,radii=0,rings=0,wordParts=0,variableRatio=0;
for(let count=1;count<=12;count++)for(let hours=2;hours<=24;hours++)for(let factor=2;factor<=5;factor++){eq(mul(Q(count*factor),Q(hours,factor)),Q(count*hours));workers++;}
for(let mass=2;mass<=20;mass++)for(let copper=1;copper<mass;copper++)for(let target=1;target<=10;target++){eq(div(mul(Q(target),Q(copper,mass)),Q(target)),Q(copper,mass));mixes++;}
for(let a=2;a<=8;a++)for(let b=2;b<=8;b++)for(let c=2;c<=8;c++)if(a+b>c&&a+c>b&&b+c>a)for(let unit=1;unit<=3;unit++){eq(add(add(Q(a*unit),Q(b*unit)),Q(c*unit)),Q((a+b+c)*unit));triangle++;}
for(let diameter=2;diameter<=20;diameter++)for(let den=2;den<=12;den++)for(let num=1;num<den;num++){const full=mul(Q(157,50),Q(diameter)),part=mul(full,Q(num,den));eq(div(part,full),Q(num,den));assert(part[0]*full[1]<full[0]*part[1]);arc++;}
for(let radius=2;radius<=20;radius++)for(let shrink=2;shrink<=8;shrink++){const small=Q(radius,shrink),area=mul(Q(157,50),square(small));eq(div(area,mul(Q(157,50),square(Q(radius)))),Q(1,shrink*shrink));radii++;}
for(let outer=2;outer<=20;outer++)for(let inner=1;inner<outer;inner++){const ring=mul(Q(157,50),Q(outer*outer-inner*inner));eq(ring,mul(Q(157,50),mul(Q(outer-inner),Q(outer+inner))));rings++;}
for(let den1=2;den1<=6;den1++)for(let num1=den1+1;num1<=10;num1++)for(let den2=2;den2<=6;den2++)for(let num2=1;num2<den2;num2++){const a=Q(num1,den1),b=Q(num2,den2),target=Q(3,7),x=div(target,mul(a,b));eq(mul(mul(x,a),b),target);wordParts++;}
for(let n=-10;n<=10;n++)if(n)for(let m=-10;m<=10;m++)if(n!==m){const ratio=Q(m,n),actual=Q(n+3*m,n-m);eq(actual,div(add(Q(1),mul(Q(3),ratio)),sub(Q(1),ratio)));variableRatio++;}
let tamper=0,missing=0,invalid=0;for(const r of rows){for(const field of['statement','answer','solution','options']){const bad=structuredClone(r);if(field==='options')bad.options=bad.options.slice().reverse();else bad[field]+=' өзгертілген';assert.throws(()=>verifyEdition(bad));tamper++;}for(const key of Object.keys(r.params)){const bad=structuredClone(r);delete bad.params[key];assert.throws(()=>renderEdition(bad));missing++;}const bad=structuredClone(r),key=Object.keys(bad.params)[0];bad.params[key]=0;assert.throws(()=>renderEdition(bad));invalid++;}
const guards=[[0,'leftNum',5],[1,'knownCopper',300],[2,'factor',1],[3,'c',100],[4,'firstSquare',26],[5,'givenNum',5],[6,'firstNum',4],[7,'large',4],[10,'rightNumTenths',35],[11,'firstNum',4],[12,'factor',1],[13,'firstHours',5],[14,'targetAdd',20],[15,'firstTenths',2865],[16,'factor',1],[17,'knownCount',8],[18,'outsideAdd',35],[19,'total',331],[20,'multiplier',1],[21,'firstDen',1],[22,'areaHundredths',11305],[23,'numerator',12],[24,'piHundredths',315],[25,'shrink',1],[26,'shrink',3],[27,'numerator',5],[28,'piHundredths',315],[29,'side',31],[30,'areaHundredths',20097],[31,'innerRadius',9],[32,'shrink',3],[33,'piHundredths',315]];
for(const[i,key,x]of guards){const r=structuredClone(rows[i]);r.params[key]=x;assert.throws(()=>renderEdition(r),`Invalid domain ${i}/${key}`);invalid++;}
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),old=new Set();for(const file of new Set(rows.map(r=>r.sourceRefs[0].sourceFile)))for(const q of read(file).questions)old.add(norm(q.statement));for(const r of rows)assert(!old.has(norm(r.statement)));
console.log(JSON.stringify({printedFixtures:34,workConservationDomains:workers,mixtureShareDomains:mixes,triangleLengthDomains:triangle,arcFractionDomains:arc,smallerRadiusSquaredDomains:radii,ringDomains:rings,improperPartDomains:wordParts,symbolicNonzeroRatioDomains:variableRatio,nativeFractionNodes:nativeFractions,contentTamperRejected:tamper,missingParametersRejected:missing,invalidDomainCanariesRejected:invalid,sourceStatementMatches:0,status:'author_checks_passed_requires_external_review'}));

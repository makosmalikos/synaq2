// Author-only checks: independent BigInt evaluation of printed conditions,
// literal fixtures, complete modulus branches and finite-domain witnesses.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './collection-arithmetic1-models.mjs';
import {mathFragments} from '../../frontend/src/mathPresentation.js';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),rows=read('problems/editorial/batches/collection-arithmetic1-wave9.json').editions;
const abs=n=>n<0n?-n:n,gcd=(a,b)=>b?gcd(b,a%b):abs(a),Q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert(d!==0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];},add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),neg=a=>Q(-a[0],a[1]),sub=(a,b)=>add(a,neg(b)),mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]),div=(a,b)=>Q(a[0]*b[1],a[1]*b[0]),same=(a,b)=>a[0]===b[0]&&a[1]===b[1],eq=(a,b)=>assert(same(a,b));
const decimal=s=>{const[w,f='']=String(s).replace(',','.').split('.');return Q(w+f,10n**BigInt(f.length));};
function value(s,env={}){s=s.replace(/−/g,'-').replace(/×/g,'*').replace(/:/g,'/');const ts=s.match(/\d+(?:,\d+)?|[xa]|[()+*/²|\-]/g)||[];assert.equal(ts.join(''),s.replace(/\s/g,''));let i=0;
 function atom(){const t=ts[i++];assert(t);if(t==='('){const a=sum();assert.equal(ts[i++],')');return a;}if(t==='|'){const a=sum();assert.equal(ts[i++],'|');return Q(abs(a[0]),a[1]);}if(t in env)return env[t];assert(/^\d/.test(t));return decimal(t);}
 function factor(){if(ts[i]==='-'){i++;return neg(factor());}if(ts[i]==='+'){i++;return factor();}let a=atom();if(ts[i]==='²'){i++;a=mul(a,a);}return a;}
 function product(){let a=factor();while(i<ts.length&&(ts[i]==='*'||ts[i]==='/'||ts[i]==='('||/^[xa]$/.test(ts[i])||/^\d/.test(ts[i]))){let op=ts[i];if(op==='*'||op==='/')i++;else op='*';const b=factor();a=op==='*'?mul(a,b):div(a,b);}return a;}
 function sum(){let a=product();while(ts[i]==='+'||ts[i]==='-'){const op=ts[i++],b=product();a=op==='+'?add(a,b):sub(a,b);}return a;}
 const a=sum();assert.equal(i,ts.length);return a;
}
const one=xs=>{assert.equal(xs.length,1);return xs[0];},allNumbers=s=>(s.match(/-?\d+(?:,\d+)?/g)||[]).map(decimal);
function root(s){const [l,r]=s.split('=');assert(r!==undefined);const at=x=>sub(value(l,{x,a:x}),value(r,{x,a:x})),B=at(Q(0)),A=sub(at(Q(1)),B);assert(A[0]);for(const n of[-12,-1,2,15])eq(at(Q(n)),add(mul(A,Q(n)),B));const x=div(neg(B),A);eq(at(x),Q(0));return x;}
const list=s=>{assert(s.startsWith('{')&&s.endsWith('}'));return s.slice(1,-1).split(';').map(value=>decimal(value.trim())).sort((a,b)=>Number(a[0]*b[1]-b[0]*a[1]));};
function modulusRoots(s){const [l,r]=s.split('=');assert(r!==undefined);const found=[];for(let n=-1000;n<=1000;n++){const x=Q(n,10);if(same(value(l,{x}),value(r,{x})))found.push(x);}return found;}
const fixed=['-13','8,8','36°; 27°; 45°','18','1','(1/6)','2,5','{-3; 11}','1,1','{-13; 23}','14','(18/5)','(5/24)','7','0','-3,2','-6','5,4','(7/13)','2029'];
assert.equal(rows.length,20);assert.equal(new Set(rows.map(r=>r.modelId)).size,20);let nativeFractions=0,rootSamples=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement;verifyEdition(r);assert.equal(r.answer,fixed[i]);let calculated,tuple;
 switch(i){
 case 0:calculated=root(s.split(' теңдеуіндегі')[0]);assert(s.includes('/18)')&&s.includes('/3)')&&s.includes('/6)'));assert(r.solution.includes('ӘР МҮШЕСІН'));break;
 case 1:calculated=value(s.match(/есептеп, (.*?) өрнегінің/)[1]);break;
 case 2:{const[total,second,third]=allNumbers(s),first=div(total,add(add(Q(1),div(second,Q(100))),div(third,Q(100))));tuple=[first,mul(first,div(second,Q(100))),mul(first,div(third,Q(100)))];eq(tuple.reduce(add),total);assert.equal((s.match(/БІРІНШІНІҢ/g)||[]).length,2);break;}
 case 3:{const expression=s.split(' теңдеуінің')[0],rs=modulusRoots(expression);assert.equal(rs.length,2);calculated=rs.reduce(add);rootSamples+=2001;assert(s.includes('ҚОСЫНДЫСЫН'));break;}
 case 4:{const rs=modulusRoots(s.split(' теңдеуінің')[0]);assert.equal(rs.length,1);calculated=Q(rs.length);rootSamples+=2001;assert(s.includes('неше ӘРТҮРЛІ'));break;}
 case 5:calculated=value(s.match(/толық жазбай, (.*?) бөлшегін/)[1]);assert(r.solution.includes('2³ × 3⁴ × 7² × 11')&&r.solution.includes('2⁴ × 3⁵ × 7² × 11'));break;
 case 6:calculated=value(s.split(' өрнегін')[0]);assert(s.includes('(2 + (4/5))')&&s.includes('(3 + (1/5))'));break;
 case 7:case 9:{const rs=modulusRoots(s.split(' теңдеуінің')[0]);assert.equal(rs.length,2);assert.deepEqual(list(r.answer),rs);assert.equal(r.options.filter(o=>JSON.stringify(list(o),(_,v)=>typeof v==='bigint'?v.toString():v)===JSON.stringify(rs,(_,v)=>typeof v==='bigint'?v.toString():v)).length,1);rootSamples+=2001;break;}
 case 8:calculated=value(s.split(' өрнегіндегі')[0]);break;
 case 10:{const [atX]=allNumbers(s),expression=s.match(/болғанда (.*?) өрнегінің/)[1];calculated=value(expression,{x:atX});assert(expression.includes('x²')&&!expression.includes('x)²'));break;}
 case 11:calculated=root(s.split(' теңдеуінің')[0]);assert(s.includes('(2/3)')&&s.includes('(1/3)'));break;
 case 12:calculated=value(s.split(' өрнегін')[0]);assert(s.includes('(1 + (1/5))'));break;
 case 13:calculated=root(s.split(' теңдеуінің')[0]);assert(r.solution.includes('≠ 0'));break;
 case 14:calculated=value(s.split(' өрнегінің')[0]);eq(calculated,Q(0));assert(s.includes('−(−')||s.includes('− (−'));break;
 case 15:calculated=value(s.split(' өрнегінің')[0]);assert(s.startsWith('−|−'));break;
 case 16:{const native=mathFragments(s),outer=native[0];assert.equal(outer.type,'fraction');assert.equal(outer.numerator.map(n=>n.value||'').join(''),'|x + 3|');assert.equal(outer.denominator.map(n=>n.value||'').join(''),'−2,4');assert.equal(native.filter(n=>n.type==='fraction').length,2);const rs=modulusRoots(s.split(' теңдеуінің')[0]);assert.equal(rs.length,2);calculated=rs.reduce(add);rootSamples+=2001;assert(s.includes('қосындысын'));break;}
 case 17:{const [first,second]=s.split(' теңдеулерін')[0].split(' және ');calculated=add(root(first),root(second));assert(s.includes('жеке шешіп'));break;}
 case 18:calculated=value(s.split(' көп қабатты')[0]);assert(s.includes('(1/(1 + (1/(1 + (1/6)))))'));break;
 case 19:calculated=root(s.split(' теңдеуінің')[0]);assert(r.solution.includes('белгісіз азайтқышты')&&r.solution.includes('белгісіз қосылғыш'));break;
 default:throw Error(i);
 }
 if(tuple){assert.deepEqual(allNumbers(r.answer),tuple);assert.equal(r.options.filter(o=>{const a=allNumbers(o);return a.length===3&&a.every((v,i)=>same(v,tuple[i]));}).length,1);}
 else if(calculated){eq(value(r.answer),calculated);assert.equal(new Set(r.options.map(o=>value(o).join('/'))).size,4);}
 const ref=one(r.sourceRefs),cap=read(ref.sourceFile),source=one(cap.questions.filter(q=>String(q.number)===ref.sourceId));assert(cap.sourceReviewCaptured&&source.sourceAnswer&&source.solution);assert(!source.images?.length&&!source.svg?.length);assert.notEqual(source.statement.normalize('NFKC'),s.normalize('NFKC'));
 const walk=nodes=>nodes.flatMap(n=>[n,...walk(n.numerator||[]),...walk(n.denominator||[]),...walk(n.fraction?[n.fraction]:[])]);for(const text of[s,r.solution,r.answer,...r.options]){const nodes=walk(mathFragments(text));nativeFractions+=nodes.filter(n=>n.type==='fraction').length;assert(!nodes.some(n=>n.type==='text'&&/[0-9xyca)|]\s*\/\s*[(−\-0-9xyca|]/.test(n.value)),i+' bare numeric or symbolic fraction');}
}
let modulusDomain=0,nestedDomain=0,negativeDivisions=0;
for(let center=-15;center<=15;center++)for(let radius=1;radius<=20;radius++){const rs=[center-radius,center+radius];for(const x of rs)assert.equal(Math.abs(x-center),radius);assert.equal(rs[0]+rs[1],2*center);for(let x=-40;x<=40;x++){assert.equal(Math.abs(x-center)===radius,rs.includes(x));modulusDomain++;}}
for(let n=2;n<=40;n++){const inner=add(Q(1),Q(1,n)),mid=div(Q(1),inner),den=add(Q(1),mid),answer=div(Q(1),den);eq(answer,Q(n+1,2*n+1));for(let scalar=1;scalar<=20;scalar++){eq(mul(answer,mul(den,Q(scalar))),Q(scalar));nestedDomain++;}}
for(let shift=1;shift<=12;shift++)for(let divisor=1;divisor<=15;divisor++)for(let quotient=1;quotient<=12;quotient++){const radius=mul(Q(divisor,10),Q(quotient)),roots=[sub(radius,Q(shift)),sub(neg(radius),Q(shift))];eq(roots.reduce(add),Q(-2*shift));for(const x of roots)eq(div(Q(abs(add(x,Q(shift))[0]),add(x,Q(shift))[1]),Q(-divisor,10)),Q(-quotient));negativeDivisions++;}
let tamper=0,missing=0;for(const r of rows){for(const field of['statement','answer','solution','options']){const c=structuredClone(r);if(field==='options')c.options=c.options.slice().reverse();else c[field]+=' өзгерген';assert.throws(()=>verifyEdition(c));tamper++;}for(const key of Object.keys(r.params)){const c=structuredClone(r);delete c.params[key];assert.throws(()=>renderEdition(c));missing++;}}
const bad=[[0,'equation','((7 - 9x)/18) + ((2 - x)/3) = 5 - ((3x + 2)/6)'],[1,'innerDenominator',0],[2,'secondPercent',100],[3,'radius',8],[4,'right',11],[5,'numerators',[7,3,2,11,9,2,2,3,5]],[6,'expression','29,4 : (2 + (4/5))'],[7,'radius',3],[8,'expression','4,3 - (-1,7)'],[9,'center',0],[10,'x',3],[11,'complement',2],[12,'innerDenominator',0],[13,'middleNumerator',0],[14,'positiveTenths',205],[15,'thirdHundredths',800],[16,'negativeDivisorTenths',0],[17,'first','5x - 5 = 8 + 2x'],[18,'innerDenominator',1],[19,'difference',5000]];
for(const[i,key,v]of bad){const c=structuredClone(rows[i]);c.params[key]=v;assert.throws(()=>renderEdition(c),`${i}/${key}`);}
console.log(JSON.stringify({printedFixtures:20,sourceSpecificForms:20,modulusPrintedTenthGridSamples:rootSamples,completeShiftedModulusIntegerCases:modulusDomain,nestedReciprocalIdentities:nestedDomain,negativeDivisionRootSumCases:negativeDivisions,nativeFractionNodes:nativeFractions,contentTamperRejected:tamper,missingParametersRejected:missing,semanticDomainCanariesRejected:bad.length,status:'author_checks_passed_requires_external_review'}));

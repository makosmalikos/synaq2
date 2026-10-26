// Author-only independent BigInt printed-expression oracle, no production AST imports.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './collection-arithmetic2-models.mjs';
import {mathFragments} from '../../frontend/src/mathPresentation.js';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),rows=read('problems/editorial/batches/collection-arithmetic2-wave10.json').editions;
const abs=n=>n<0n?-n:n,gcd=(a,b)=>b?gcd(b,a%b):abs(a),Q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert(d!==0n);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];},add=(a,b)=>Q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),neg=a=>Q(-a[0],a[1]),sub=(a,b)=>add(a,neg(b)),mul=(a,b)=>Q(a[0]*b[0],a[1]*b[1]),div=(a,b)=>Q(a[0]*b[1],a[1]*b[0]),same=(a,b)=>a[0]===b[0]&&a[1]===b[1],eq=(a,b)=>assert(same(a,b));
const decimal=s=>{const[w,f='']=String(s).replace(',','.').split('.');return Q(w+f,10n**BigInt(f.length));};
function value(s,env={}){s=s.replace(/−/g,'-').replace(/×/g,'*').replace(/:/g,'/');const ts=s.match(/\d+(?:,\d+)?|[xyca]|[()+*/²|\-]/g)||[];assert.equal(ts.join(''),s.replace(/\s/g,''));let i=0;
 function atom(){const t=ts[i++];assert(t);if(t==='('){const a=sum();assert.equal(ts[i++],')');return a;}if(t==='|'){const a=sum();assert.equal(ts[i++],'|');return Q(abs(a[0]),a[1]);}if(t in env)return env[t];assert(/^\d/.test(t));return decimal(t);}
 function factor(){if(ts[i]==='-'){i++;return neg(factor());}if(ts[i]==='+'){i++;return factor();}let a=atom();if(ts[i]==='²'){i++;a=mul(a,a);}return a;}
 function product(){let a=factor();while(i<ts.length&&(ts[i]==='*'||ts[i]==='/'||ts[i]==='('||/^[xyca]$/.test(ts[i])||/^\d/.test(ts[i]))){let op=ts[i];if(op==='*'||op==='/')i++;else op='*';const b=factor();a=op==='*'?mul(a,b):div(a,b);}return a;}
 function sum(){let a=product();while(ts[i]==='+'||ts[i]==='-'){const op=ts[i++],b=product();a=op==='+'?add(a,b):sub(a,b);}return a;}
 const a=sum();assert.equal(i,ts.length);return a;
}
const one=xs=>{assert.equal(xs.length,1);return xs[0];},allNumbers=s=>(s.match(/-?\d+(?:,\d+)?/g)||[]).map(decimal);
function root(s){const [l,r]=s.split('=');assert(r!==undefined);const at=x=>sub(value(l,{x,y:x,c:x,a:x}),value(r,{x,y:x,c:x,a:x})),B=at(Q(0)),A=sub(at(Q(1)),B);assert(A[0]);for(const n of[-12,-1,2,15])eq(at(Q(n)),add(mul(A,Q(n)),B));const x=div(neg(B),A);eq(at(x),Q(0));return x;}
const expected=['12,7','-246,25','66','20,25','(103/51)','(28/15)','(-36/7)','-19','0,25','-5,4','1,6','(2/9)','(-5/3)','0,6','-0,625','-2,6','1,55','35','-13,44','26','0,3','-0,275','3,6','-42','-0,0375'];
const equationIndices=new Set([0,2,5,7,9,10,11,13,14,17,20,23]);
assert.equal(rows.length,25);assert.equal(new Set(rows.map(r=>r.modelId)).size,25);let nativeFractions=0,numericChains=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement;verifyEdition(r);eq(value(r.answer),value(expected[i]));let answer;
 if(equationIndices.has(i))answer=root(s.split(', ').at(-1).split(' теңдеуінің')[0]);
 else if(i===3){const[shift,coefficient,constant,numerator,denominator]=allNumbers(s),ratio=div(numerator,denominator);answer=div(add(shift,mul(ratio,constant)),sub(Q(1),mul(ratio,coefficient)));const bad=div(neg(constant),coefficient),den=add(mul(coefficient,answer),constant);assert(den[0]&&!same(answer,bad));const eqn=s.split(' теңдеуінің')[0],[l,right]=eqn.split('=');eq(value(l,{a:answer}),value(right));assert(r.solution.includes('≠ 0'));}
 else answer=value(s.match(/^Амалдардың ретін сақтап, (.*?) өрнегінің/)[1]);
 eq(value(r.answer),answer);assert.equal(new Set(r.options.map(o=>value(o).join('/'))).size,4);assert.equal(r.options.filter(o=>same(value(o),answer)).length,1);
 if(i===1){assert(s.includes(')²')&&s.includes('(−0,01)'));eq(value('(−1/4)²'),Q(1,16));assert(!same(value('−(1/4)²'),value('(−1/4)²')));}
 if(i===6){assert(s.includes('−(3 + (3/5))')&&s.includes('−(4 + (1/5))'));assert(answer[0]<0n);}
 if(i===8)assert(answer[0]>0n&&s.includes(': (−('));
 if(i===10){assert(r.solution.includes('Белгісіз азайтқышты')&&r.solution.includes('Белгісіз бөлінгіш'));eq(value('(10 + (1/5)) - (9 + (13/15))'),Q(1,3));eq(value('(1/3) × (12 + (3/5))'),Q(21,5));}
 if(i===18)eq(value('(53/70) + (−9/56) − (31/40)'),Q(-5,28));
 if(i===19){eq(value('0,05'),Q(1,20));assert(s.includes('9,6875'));}
 if(i===22)eq(value('(4 + (4/11)) × (1 + (3/8))'),Q(6));
 const ref=one(r.sourceRefs),cap=read(ref.sourceFile),source=one(cap.questions.filter(q=>String(q.number)===ref.sourceId));assert(cap.sourceReviewCaptured&&source.sourceAnswer&&source.solution&&!source.images?.length&&!source.svg?.length);assert.notEqual(source.statement.normalize('NFKC'),s.normalize('NFKC'));
 const walk=ns=>ns.flatMap(n=>[n,...walk(n.numerator||[]),...walk(n.denominator||[]),...walk(n.fraction?[n.fraction]:[])]);
 for(const text of[s,r.solution,r.answer,...r.options]){const nodes=walk(mathFragments(text));nativeFractions+=nodes.filter(n=>n.type==='fraction').length;assert(!nodes.some(n=>n.type==='text'&&/[0-9xyca)|]\s*\/\s*[(−\-0-9xyca|]/.test(n.value)),i+' bare native fraction');}
 // Actual calcTrace contains explicitly parenthesized operands. Check each
 // numeric operation printed there, independently of the production trace.
 const atom='(?:-?\\d+(?:,\\d+)?|\\(-?\\d+/\\d+\\))',pattern=new RegExp('\\(('+atom+')\\) ([+−×:]) \\(('+atom+')\\) = ('+atom+')','g');
 for(const m of r.solution.matchAll(pattern)){const a=value(m[1]),b=value(m[3]),expected=({'+':add,'−':sub,'×':mul,':':div})[m[2]](a,b);eq(expected,value(m[4]));numericChains++;}
}
let affineDomains=0,signedProducts=0,decimalScales=0;
for(let A=-12;A<=12;A++)if(A)for(let B=-20;B<=20;B++)for(let denominator=1;denominator<=9;denominator++){const target=Q(B,denominator),root=div(target,Q(A));eq(mul(Q(A),root),target);for(const c of[-4,-1,1,5])eq(sub(mul(Q(A),add(root,Q(c))),target),Q(A*c));affineDomains++;}
for(let a=1;a<=15;a++)for(let b=1;b<=15;b++)for(let c=1;c<=12;c++){const num=mul(mul(Q(-a,5),Q(-b,7)),Q(-c,11)),den=mul(Q(-b,13),Q(-c,17));assert(num[0]<0n&&den[0]>0n);eq(div(num,den),Q(-a*13*17,5*7*11));signedProducts++;}
for(let n=1;n<=200;n++)for(const d of[1,2,5,10,20,25,50,100]){const amount=Q(n,100);eq(div(amount,Q(d,100)),Q(n,d));eq(div(amount,Q(1,100)),mul(amount,Q(100)));eq(div(amount,Q(5,100)),mul(amount,Q(20)));decimalScales++;}
let tamper=0,missing=0,invalid=0;for(const r of rows){for(const f of['statement','answer','solution','options']){const c=structuredClone(r);if(f==='options')c.options=c.options.slice().reverse();else c[f]+=' өзгерген';assert.throws(()=>verifyEdition(c));tamper++;}for(const k of Object.keys(r.params)){const c=structuredClone(r);delete c.params[k];assert.throws(()=>renderEdition(c));missing++;}const c=structuredClone(r);if(c.params.equation)c.params.equation='x = 1';else if(c.params.expression)c.params.expression='1';else c.params.coefficient=0;assert.throws(()=>renderEdition(c));invalid++;}
console.log(JSON.stringify({printedFixtures:25,sourceSpecificForms:25,nativeFractionNodes:nativeFractions,actualPrintedNumericChains:numericChains,exactAffineInverseDomains:affineDomains,threeVersusTwoNegativeProductCases:signedProducts,decimalScaleDivisionCases:decimalScales,contentTamperRejected:tamper,missingParametersRejected:missing,semanticStructureDomainCanariesRejected:invalid,status:'author_checks_passed_requires_external_review'}));

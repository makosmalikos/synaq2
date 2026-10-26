// Author-only independent BigInt printed-expression oracle, no production AST imports.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './collection-arithmetic3-models.mjs';
import {mathFragments} from '../../frontend/src/mathPresentation.js';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),rows=read('problems/editorial/batches/collection-arithmetic3-wave11.json').editions;
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
const expected=['2,12','68','(43/48)','1,11','(15/52)','3','-2,5','18,4','2','2,85','5,4','21,6','-2','-5,6','(13 + (1/31))','-3','2','(103/18)','(1/3)','3,6','-8,175','(11/6)'];
const affineIndices=new Set([1,4,5,8,12,15,16]);assert.equal(rows.length,22);assert.equal(new Set(rows.map(r=>r.modelId)).size,22);let nativeFractions=0;
function inverseEquation(s){const[l,r]=s.split('='),R=value(r),L=x=>value(l,{x});assert.throws(()=>L(Q(0)));const one=L(Q(1)),two=L(Q(2)),A=mul(Q(2),sub(one,two)),B=sub(one,A);assert(A[0]);for(const x of[-5,-1,3,10])eq(L(Q(x)),add(div(A,Q(x)),B));const answer=div(A,sub(R,B));assert(answer[0]);eq(L(answer),R);return answer;}
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement;verifyEdition(r);eq(value(r.answer),value(expected[i]));let answer;
 if(affineIndices.has(i)){const eqn=s.includes(', ')?s.split(', ').at(-1).split(' теңдеуінің')[0]:s.split(' пропорциясындағы')[0];answer=root(eqn);}
 else if(i===11||i===19){answer=inverseEquation(s.split(' теңдеуінің')[0]);assert(s.includes('0'));if(i===11)assert(r.solution.includes('БӨЛГІШ'));else assert(r.solution.includes('Бөлінгіш → қосылғыш → бөлгіш'));}
 else if(i===14){answer=value(s.split(' өрнегін')[0]);assert(r.solution.includes('Бүтін бөліктер 4 + 6 + 3 = 13')&&r.solution.includes('5 + 7 + 2 − 13 = 1'));}
 else answer=value(s.match(/^Амалдар мен жақшалардың ретін сақтап, (.*?) өрнегінің/)[1]);
 eq(value(r.answer),answer);assert.equal(new Set(r.options.map(o=>value(o).join('/'))).size,4);assert.equal(r.options.filter(o=>same(value(o),answer)).length,1);
 if(i===0){eq(value('(6 + (3/4)) × (4/9)'),Q(3));assert(r.solution.includes('қысқартамыз'));}
 if(i===2)eq(value('(7/48) − (19/40) − (−13/30)'),Q(5,48));
 if(i===6){eq(value('(−9/20) − (13/24) − (−(1 + (7/24)))'),Q(3,10));assert(s.includes('−0,012'));}
 if(i===9){eq(value('1,8 − (2 + (2/9)) − (26/45)'),Q(-1));assert(r.solution.includes('−1'));}
 if(i===13)eq(value('(53/72) − (2 + (19/48)) − (−1,75)'),Q(13,144));
 if(i===18){const layers=[value('4 − (1/4)'),value('4 − (1/(4 − (1/4)))'),value('1 − (1/(4 − (1/(4 − (1/4)))))')];assert(layers.every(a=>a[0]));eq(layers[0],Q(15,4));eq(layers[1],Q(56,15));eq(layers[2],Q(41,56));}
 const ref=one(r.sourceRefs),cap=read(ref.sourceFile),source=one(cap.questions.filter(q=>String(q.number)===ref.sourceId));assert(cap.sourceReviewCaptured&&source.sourceAnswer&&source.solution&&!source.images?.length&&!source.svg?.length);assert.notEqual(source.statement.normalize('NFKC'),s.normalize('NFKC'));
 const walk=ns=>ns.flatMap(n=>[n,...walk(n.numerator||[]),...walk(n.denominator||[]),...walk(n.fraction?[n.fraction]:[])]);for(const text of[s,r.solution,r.answer,...r.options]){const nodes=walk(mathFragments(text));nativeFractions+=nodes.filter(n=>n.type==='fraction').length;assert(!nodes.some(n=>n.type==='text'&&/[0-9xyca)|]\s*\/\s*[(−\-0-9xyca|]/.test(n.value)),i+' bare numeric/symbolic fraction');}
}
let inverseDomains=0,commonDenominatorCases=0,crossCancellationCases=0;
for(let A=1;A<=16;A++)for(let B=1;B<=12;B++)for(let C=1;C<=14;C++)for(let x=1;x<=10;x++){const target=div(add(div(Q(A),Q(x)),Q(B)),Q(C)),recovered=div(Q(A),sub(mul(target,Q(C)),Q(B)));eq(recovered,Q(x));inverseDomains++;}
// Exact common denominator and two-direction cancellation identities use own
// BigInt arithmetic; no Number rational helper from the model is imported.
for(let d=2;d<=18;d++)for(let e=2;e<=18;e++)for(let n=1;n<d;n++){const D=BigInt(d),E=BigInt(e),lcm=D/gcd(D,E)*E;eq(sub(Q(n,d),Q(1,e)),Q(BigInt(n)*(lcm/D)-lcm/E,lcm));commonDenominatorCases++;}
for(let a=1;a<=18;a++)for(let b=1;b<=18;b++)for(let c=1;c<=9;c++)for(let d=1;d<=9;d++){const g1=gcd(BigInt(a),BigInt(d)),g2=gcd(BigInt(c),BigInt(b));eq(mul(Q(a,b),Q(c,d)),mul(Q(BigInt(a)/g1,BigInt(b)/g2),Q(BigInt(c)/g2,BigInt(d)/g1)));crossCancellationCases++;}
let tamper=0,missing=0,invalid=0;for(const r of rows){for(const f of['statement','answer','solution','options']){const c=structuredClone(r);if(f==='options')c.options=c.options.slice().reverse();else c[f]+=' өзгерген';assert.throws(()=>verifyEdition(c));tamper++;}for(const k of Object.keys(r.params)){const c=structuredClone(r);delete c.params[k];assert.throws(()=>renderEdition(c));missing++;}const c=structuredClone(r);if(c.params.equation)c.params.equation='x = 1';else if(c.params.expression)c.params.expression='1';else if(c.params.denominator)c.params.denominator=0;else c.params[Object.keys(c.params)[0]]=0;assert.throws(()=>renderEdition(c));invalid++;}
console.log(JSON.stringify({printedFixtures:22,sourceSpecificForms:22,nativeFractionNodes:nativeFractions,inverseDivisorChainDomains:inverseDomains,exactCommonDenominatorCases:commonDenominatorCases,twoDirectionCrossCancellationCases:crossCancellationCases,contentTamperRejected:tamper,missingParametersRejected:missing,semanticStructureDomainCanariesRejected:invalid,status:'author_checks_passed_requires_external_review'}));

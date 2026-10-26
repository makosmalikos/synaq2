// Author-only independent BigInt printed-expression oracle, no production AST imports.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './collection-arithmetic4-models.mjs';
import {mathFragments} from '../../frontend/src/mathPresentation.js';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),rows=read('problems/editorial/batches/collection-arithmetic4-wave12.json').editions;
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
const expected=['(7/8)','34','16','3,86','132','3','Шешімі жоқ','(1/2)','6','-4','9','0,2','1,5','315 см','(3 + (31/36))','−3,8 − (−4,6) = −8,4','3,9','-18','8','4,25','0,4','7,8','1,5','(16/17)'];
const affineIndices=new Set([4,5,10,14,17,20]),numeric=new Set(rows.map((_,i)=>i).filter(i=>![6,13,15].includes(i)));assert.equal(rows.length,24);assert.equal(new Set(rows.map(r=>r.modelId)).size,24);let nativeFractions=0,checkedChains=0;
const walk=ns=>ns.flatMap(n=>[n,...walk(n.numerator||[]),...walk(n.denominator||[]),...walk(n.fraction?[n.fraction]:[])]);
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement;verifyEdition(r);let answer;
 if(numeric.has(i))eq(value(r.answer),value(expected[i]));else assert.equal(r.answer,expected[i]);
 if(affineIndices.has(i))answer=root(s.split(' теңдеу')[0]);
 else if(i===2){const m=s.match(/^\|x − (\d+)\| = (\d+)/),center=value(m[1]),radius=value(m[2]),roots=[sub(center,radius),add(center,radius)];assert(roots.every(v=>v[0]>0n));answer=add(...roots);for(const x of roots)eq(value(s.split(' теңдеу')[0].split('=')[0],{x}),radius);}
 else if(i===6){const[l,rhs]=s.split(' теңдеу')[0].split('='),left=x=>value(l,{x}),right=x=>value(rhs,{x});eq(sub(left(Q(1)),left(Q(0))),sub(right(Q(1)),right(Q(0))));assert(!same(left(Q(0)),right(Q(0))));for(let x=-30;x<=30;x++)assert(!same(left(Q(x)),right(Q(x))));assert(r.solution.includes('нөлге бөліп')&&r.answer==='Шешімі жоқ');}
 else if(i===9){const eqn=s.split(' теңдеу')[0],m=eqn.match(/^\(\(\|x \+ (\d+)\|\)\/\(−(\d+)\)\) = \(−(\d+,\d+)\/(\d+,\d+)\)$/);assert(m);const c=value(m[1]),D=neg(value(m[2])),right=div(neg(value(m[3])),value(m[4])),radius=mul(D,right),roots=[sub(radius,c),sub(neg(radius),c)];assert(radius[0]>0n);answer=add(...roots);const[l,rhs]=eqn.split('=');for(const x of roots)eq(value(l,{x}),value(rhs));const fs=mathFragments(s).filter(n=>n.type==='fraction');assert.equal(fs.length,2);assert.deepEqual(fs[0].numerator,[{type:'text',value:'|x + 2|'}]);}
 else if(i===12){const m=s.match(/^\|(\d+) − (\d+)x\| = (\d+)/);assert(m);const A=value(m[1]),B=value(m[2]),R=value(m[3]),roots=[div(sub(A,R),B),div(add(A,R),B)];assert(roots[0][0]<0n&&roots[1][0]>0n);answer=add(...roots);for(const x of roots)eq(value(s.split(' теңдеу')[0].split('=')[0],{x}),R);}
 else if(i===13){const m=s.match(/^(\d+) м − (\d+) см/);assert(m);const cm=BigInt(m[1])*100n-BigInt(m[2]);assert.equal(r.answer,cm+' см');assert.equal(r.options.filter(o=>o===cm+' см').length,1);}
 else if(i===15){assert(r.intentionalIncorrectExample);const truths=r.options.map(o=>{const[l,right]=o.split('=');return same(value(l),value(right));});assert.deepEqual(truths,[false,true,true,true]);assert.equal(r.answer,r.options[0]);eq(value(r.options[0].split('=')[0]),Q(4,5));assert(r.solution.includes('0,8')&&r.statement.includes('әдейі'));}
 else if(i===19){const m=s.match(/^(\d+) : \((\d+) − (\d+)x\) \+ (\d+) = (\d+)/);assert(m);const[D,C,K,A,R]=m.slice(1).map(s=>value(s)),q=sub(R,A),den=div(D,q);answer=div(sub(C,den),K);const excluded=div(C,K),[l,right]=s.split(' теңдеу')[0].split('=');assert(!same(answer,excluded));eq(value(l,{x:answer}),value(right));assert.throws(()=>value(l,{x:excluded}));assert(r.solution.includes('Белгісіз қосылғыш')&&r.solution.includes('Белгісіз бөлгіш')&&r.solution.includes('Белгісіз азайтқыш'));}
 else if(i===22){const parts=s.split(' теңдеулерін')[0].split(' және ');assert.equal(parts.length,2);const roots=parts.map(root);assert(roots[0][0]>0n&&roots[1][0]<0n);answer=add(...roots);eq(roots[0],Q(53));eq(roots[1],Q(-103,2));}
 else {const expression=s.startsWith('Амалдар')?s.match(/^Амалдар мен негізгі бөлшек сызықтарының орнын сақтап, (.*?) өрнегінің/)[1]:s.split(' бөлшегін')[0].split(' өрнегінің')[0];answer=value(expression);}
 if(numeric.has(i)){eq(value(r.answer),answer);const numericOptions=r.options.filter(o=>o!=='Шешімі жоқ');assert.equal(new Set(numericOptions.map(o=>value(o).join('/'))).size,numericOptions.length);assert.equal(numericOptions.filter(o=>same(value(o),answer)).length,1);assert(!same(value(r.answer),add(answer,Q(1))));}
 if(i===1){assert(r.solution.includes('(17/8) : (25/8)')&&r.solution.includes('солдан оңға'));eq(value('(17/8) : (25/8) × 50'),Q(34));assert(!same(value('(17/8) : ((25/8) × 50)'),Q(34)));}
 if(i===3){assert(r.solution.includes('855 : 225 = 3,8'));eq(value('855 : 225'),Q(19,5));}
 if(i===7){assert(r.solution.includes('3⁴')&&r.solution.includes('2⁴'));eq(value('(2 × 2 × 2 × 3 × 3 × 3 × 3 × 11 × 11 × 13)/(2 × 2 × 2 × 2 × 3 × 3 × 3 × 3 × 11 × 11 × 13)'),Q(1,2));}
 if(i===14){assert(r.solution.includes('(7 + (45/36)) = (8 + (9/36))')&&r.solution.includes('(8 + (9/36)) = (7 + (45/36))'));eq(value('(5+(25/36))+(2+(5/9))'),Q(33,4));eq(sub(Q(33,4),value('(4+(7/18))')),Q(139,36));}
 if(i===18){const fs=mathFragments(s).filter(n=>n.type==='fraction');assert.equal(fs.length,2);assert(fs.every(n=>walk([n]).filter(n=>n.type==='fraction').length>=3));eq(value('(9,6:(4/9)+(5+(1/3))×0,75):2,56'),Q(10));eq(value('(3,6:(1+(4/5))+5):(3+(1/2))'),Q(2));eq(value('(3+(1/3))×0,18:0,4'),Q(3,2));eq(value('(0,75-(1/12))×0,75'),Q(1,2));}
 if(i===21){assert(r.solution.includes('(14 + (9/24)) = (13 + (33/24))'));eq(value('(14+(3/8))-(7+(5/6))'),Q(157,24));eq(value('(10+(1/4)):(6+(5/6))'),Q(3,2));}
 if(i===23){eq(value('3+(1/5)'),Q(16,5));eq(value('3+(4/(3+(1/5)))'),Q(17,4));}
 const ref=one(r.sourceRefs),cap=read(ref.sourceFile),source=one(cap.questions.filter(q=>String(q.number)===ref.sourceId));assert(cap.sourceReviewCaptured&&source.sourceAnswer&&source.solution&&!source.images?.length&&!source.svg?.length);assert.equal(source.options.filter(o=>o.correct).length,1);assert.equal(one(source.options.filter(o=>o.correct)).text,source.sourceAnswer);assert.notEqual(source.statement.normalize('NFKC'),s.normalize('NFKC'));
 for(const text of[s,r.solution,r.answer,...r.options]){const nodes=walk(mathFragments(text));nativeFractions+=nodes.filter(n=>n.type==='fraction').length;assert(!nodes.some(n=>n.type==='text'&&/[0-9xyca)|]\s*\/\s*[(−\-0-9xyca|]/.test(n.value)),i+' bare mathematical fraction');}
}
let modulusCases=0,affineDivisorCases=0,mixedCarryBorrowCases=0;
for(let center=-16;center<=16;center++)for(let radius=1;radius<=12;radius++){
 const roots=[center-radius,center+radius];assert.equal(roots[0]+roots[1],2*center);for(let x=center-radius-2;x<=center+radius+2;x++)assert.equal(Math.abs(x-center)===radius,roots.includes(x));modulusCases++;
}
// Work backwards from every nonzero divisor; exclude the affine pole explicitly.
for(let C=1;C<=15;C++)for(let K=1;K<=9;K++)for(let D=1;D<=12;D++)for(let denom=1;denom<=10;denom++){
 const x=div(sub(Q(C),Q(denom)),Q(K)),pole=Q(C,K),q=div(Q(D),Q(denom));assert(!same(x,pole));eq(div(Q(D),sub(Q(C),mul(Q(K),x))),q);eq(div(sub(Q(C),div(Q(D),q)),Q(K)),x);affineDivisorCases++;
}
for(let D=3;D<=18;D++)for(let left=2;left<D;left++)for(let a=1;a<D;a++)for(let b=1;b<D;b++)if(a+b>=D&&(a+b)%D<left){const raw=Q(a+b,D),after=add(Q(7),raw),base=add(Q(4),Q(left,D)),answer=sub(after,base),borrow=add(Q(3),Q(a+b-left,D));eq(answer,borrow);mixedCarryBorrowCases++;}
let tamper=0,missing=0,invalid=0;for(const r of rows){for(const f of['statement','answer','solution','options']){const c=structuredClone(r);if(f==='options')c.options=c.options.slice().reverse();else c[f]+=' өзгерген';assert.throws(()=>verifyEdition(c));tamper++;}for(const k of Object.keys(r.params)){const c=structuredClone(r);delete c.params[k];assert.throws(()=>renderEdition(c));missing++;}const c=structuredClone(r);if(c.params.equation)c.params.equation='x=1';else if(c.params.expression)c.params.expression='1';else if(c.params.first)c.params.first='x=1';else if(c.params.choices)c.intentionalIncorrectExample=false;else if(c.params.numerators)c.params.numerators[0]=1;else c.params[Object.keys(c.params)[0]]=0;assert.throws(()=>renderEdition(c));invalid++;}
console.log(JSON.stringify({printedFixtures:24,sourceSpecificForms:24,nativeFractionNodes:nativeFractions,absoluteBranchDomains:modulusCases,affineNonzeroDivisorDomains:affineDivisorCases,mixedCarryBorrowCases,contentTamperRejected:tamper,missingParametersRejected:missing,semanticStructureCanariesRejected:invalid,status:'author_checks_passed_requires_external_review'}));

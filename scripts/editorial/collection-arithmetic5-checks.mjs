// Author-only independent BigInt printed-expression oracle, no production AST imports.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './collection-arithmetic5-models.mjs';
import {mathFragments} from '../../frontend/src/mathPresentation.js';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),rows=read('problems/editorial/batches/collection-arithmetic5-wave13.json').editions;
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
const expected=['11','-17,478','12','(1/6)','Кез келген нақты сан','-318','-5,13','6,8','1,4','90','0,18','-3,4','(87+(29/45))','-80','12','-1,05','-5,5','(2+(11/15))','-3,5','-2,25','−4 < x < −3','5,7','−, +, −, ×','-10'];
const affineRows=new Set([2,9,13,18]),nonnumeric=new Set([4,20,22]);assert.equal(rows.length,24);assert.equal(new Set(rows.map(r=>r.modelId)).size,24);let nativeFractions=0;
const walk=ns=>ns.flatMap(n=>[n,...walk(n.numerator||[]),...walk(n.denominator||[]),...walk(n.fraction?[n.fraction]:[])]),lt=(a,b)=>a[0]*b[1]<b[0]*a[1];
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement;verifyEdition(r);let answer;
 if(nonnumeric.has(i))assert.equal(r.answer,expected[i]);else eq(value(r.answer),value(expected[i]));
 if(affineRows.has(i))answer=root(s.split(' теңдеу')[0]);
 else if(i===4){const[l,right]=s.split(' теңдеу')[0].split('=');for(let n=-100;n<=100;n++)eq(value(l,{y:Q(n,7)}),value(right,{y:Q(n,7)}));eq(value(l,{y:Q(0)}),Q(-2,5));eq(sub(value(l,{y:Q(1)}),value(l,{y:Q(0)})),Q(-10,11));assert(r.solution.includes('0 = 0')&&r.solution.includes('нөлге бөліп')&&r.answer==='Кез келген нақты сан');}
 else if(i===7){const m=s.match(/^x = (−\d+,\d+), y = (−\d+,\d+) \+ \((−\d+,\d+)\)/);assert(m);const x=value(m[1]),y=add(value(m[2]),value(m[3]));assert(x[0]<0n&&y[0]<0n);answer=div(add(Q(abs(x[0]),x[1]),Q(abs(y[0]),y[1])),Q(2));assert(s.includes('|−x| және |y|'));}
 else if(i===11||i===16){const m=s.match(/^f\(x\) = (.*?) формуласы берілген\. f\((-?\d+)\)/);assert(m);const x=value(m[2]);answer=value(m[1],{x});const pole=i===11?Q(3):Q(1,3);assert.throws(()=>value(m[1],{x:pole}));if(i===11){eq(value('((-2)-5)/7'),Q(-1));eq(value('12/((-2)-3)'),Q(-12,5));}else{eq(value('3x',{x}),Q(-6));eq(value('(-7)/(6x-2)',{x}),Q(1,2));}assert(r.solution.includes('ӘР x')&&r.solution.includes('бөлім'));}
 else if(i===20){const x=root(s.split(' теңдеу')[0]),hits=r.options.map(o=>{const m=o.match(/^(−?\d+) < x < (−?\d+)$/);assert(m);return lt(value(m[1]),x)&&lt(x,value(m[2]));});eq(x,Q(-7,2));assert.deepEqual(hits,[false,false,true,false]);assert.equal(r.answer,r.options[hits.indexOf(true)]);}
 else if(i===21){const m=s.match(/^x = (\d+,\d+), y = (−\d+,\d+)/);assert(m);const x=value(m[1]),y=value(m[2]);assert(x[0]>0n&&y[0]<0n);answer=div(add(Q(abs(x[0]),x[1]),Q(abs(y[0]),y[1])),Q(2));assert(s.includes('|−x| пен |−y|'));}
 else if(i===22){const blank=s.split(' теңдігі')[0],m=blank.match(/^(.*?) = (\d+)$/);assert(m);const values=r.options.map(o=>{let j=0;const ops=o.split(', '),expr=m[1].replaceAll('□',()=>ops[j++]);assert.equal(j,4);return value(expr);});assert.deepEqual(values,[Q(9),Q(-1,6),Q(15,2),Q(45)]);assert.equal(r.options.filter((o,j)=>same(values[j],value(m[2]))).length,1);assert.equal(r.answer,r.options[0]);assert(s.includes('көбейту мен бөлу қосу/азайтудан бұрын'));}
 else if(i===23){const eqn=s.split(' теңдеу')[0],m=eqn.match(/^\(−(\d+,\d+)\/(\d+,\d+)\) = \(\(\|x \+ (\d+)\|\)\/\(−(\d+,\d+)\)\)$/);assert(m);const ratio=div(neg(value(m[1])),value(m[2])),radius=mul(ratio,neg(value(m[4]))),center=neg(value(m[3])),roots=[add(center,radius),sub(center,radius)];assert(roots[0][0]>0n&&roots[1][0]<0n);answer=add(...roots);const[l,right]=eqn.split('=');for(const x of roots)eq(value(l),value(right,{x}));const fs=mathFragments(s).filter(n=>n.type==='fraction');assert.equal(fs.length,2);assert.deepEqual(fs[1].numerator,[{type:'text',value:'|x + 5|'}]);}
 else answer=value(s.startsWith('Амалдар')?s.match(/^Амалдар мен негізгі бөлшек сызықтарының орнын сақтап, (.*?) өрнегінің/)[1]:s.split(' өрнегінің')[0]);
 if(!nonnumeric.has(i)){eq(value(r.answer),answer);assert.equal(new Set(r.options.map(o=>value(o).join('/'))).size,4);assert.equal(r.options.filter(o=>same(value(o),answer)).length,1);}
 if(i===0){const f=mathFragments(s).filter(n=>n.type==='fraction');assert.equal(f.length,1);assert(walk(f[0].numerator).some(n=>n.type==='fraction')&&walk(f[0].denominator).some(n=>n.type==='fraction'));eq(value('((8+(3/8))-2,125)*(2+(2/5))-67,2:8'),Q(33,5));eq(value('(4,2*0,8-3):0,04*(2+(1/3))-40,8*0,5'),Q(3,5));}
 if(i===1){eq(value('(5+(2/9))-(2+(11/18))'),Q(47,18));assert(r.solution.includes('(5 + (4/18)) = (4 + (22/18))'));}
 if(i===3){assert(r.solution.includes('153 = 3 × 51')&&r.solution.includes('51 және 7'));eq(value('(153/35)*(-7/51)'),Q(-3,5));}
 if(i===5){assert(r.solution.includes('(−220/30) − (104/30) − (135/30)'));eq(value('(-220/30)-(104/30)-(135/30)'),Q(-153,10));eq(value('(13/4)*(105/26):(105/2)'),Q(1,4));}
 if(i===10){assert(r.solution.includes('(205/300) + (44/300) − (267/300)'));eq(value('(205/300)+(44/300)-(267/300)'),Q(-3,50));}
 if(i===12){assert(r.solution.includes('(93 + (9/45)) = (92 + (54/45))'));eq(value('(93+(1/5))-(5+(5/9))'),Q(3944,45));}
 if(i===15){assert(r.solution.includes('−0,05 × 34'));eq(value('(-13/15)+(-1/24)'),Q(-109,120));eq(value('(-5/8)-(-109/120)'),Q(17,60));eq(value('-6*(34/120)'),Q(-17,10));}
 if(i===17)assert(r.solution.includes('(2 + (15/15)) − (4/15)'));
 if(i===19){eq(value('(-24/60)+(51/60)-(10/60)'),Q(17,60));assert(r.solution.includes('(−24/60) + (51/60) − (10/60)'));}
 const ref=one(r.sourceRefs),cap=read(ref.sourceFile),src=one(cap.questions.filter(q=>String(q.number)===ref.sourceId));assert(cap.sourceReviewCaptured&&src.sourceAnswer&&src.solution&&!src.images?.length&&!src.svg?.length);assert.equal(one(src.options.filter(o=>o.correct)).text,src.sourceAnswer);assert.notEqual(src.statement.normalize('NFKC'),s.normalize('NFKC'));
 for(const text of[s,r.solution,r.answer,...r.options]){const nodes=walk(mathFragments(text));nativeFractions+=nodes.filter(n=>n.type==='fraction').length;assert(!nodes.some(n=>n.type==='text'&&/[0-9xyca)|]\s*\/\s*[(−\-0-9xyca|]/.test(n.value)),i+' unstructured mathematical fraction');}
}
let substituteDenominatorCases=0,exactBorrowCases=0,precedenceCases=0;
for(let shift=1;shift<=16;shift++)for(let n=1;n<=18;n++)for(let x=-18;x<=-1;x++){const ans=div(Q(n),sub(Q(x),Q(shift)));assert(ans[0]<0n);eq(mul(ans,sub(Q(x),Q(shift))),Q(n));assert.throws(()=>div(Q(n),sub(Q(shift),Q(shift))));substituteDenominatorCases++;}
for(let D=2;D<=24;D++)for(let small=0;small<D;small++)for(let large=small+1;large<D;large++){eq(sub(add(Q(9),Q(small,D)),add(Q(5),Q(large,D))),add(Q(3),Q(D+small-large,D)));exactBorrowCases++;}
for(let a=1;a<=12;a++)for(let b=1;b<=12;b++)for(let c=1;c<=9;c++){
 eq(value(`${a} + ${b} * ${c}`),Q(a+b*c));eq(value(`(${a} + ${b}) * ${c}`),Q((a+b)*c));precedenceCases++;
}
let tamper=0,missing=0,invalid=0;for(const r of rows){for(const f of['statement','answer','solution','options']){const c=structuredClone(r);if(f==='options')c.options=c.options.slice().reverse();else c[f]+=' өзгерген';assert.throws(()=>verifyEdition(c));tamper++;}for(const k of Object.keys(r.params)){const c=structuredClone(r);delete c.params[k];assert.throws(()=>renderEdition(c));missing++;}const c=structuredClone(r);if(c.params.equation)c.params.equation='x=1';else if(c.params.expression)c.params.expression='1';else if(c.params.formula)c.params.argument=3;else c.params[Object.keys(c.params)[0]]=0;assert.throws(()=>renderEdition(c));invalid++;}
console.log(JSON.stringify({printedFixtures:24,sourceSpecificForms:24,nativeFractionNodes:nativeFractions,negativeArgumentNonzeroDenominatorCases:substituteDenominatorCases,exactMixedBorrowCases:exactBorrowCases,printedPrecedenceCases:precedenceCases,contentTamperRejected:tamper,missingParametersRejected:missing,semanticStructureCanariesRejected:invalid,status:'author_checks_passed_requires_external_review'}));

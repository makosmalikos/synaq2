// Author-only independent BigInt printed-expression oracle, no production AST imports.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './collection-systems-models.mjs';
import {mathFragments} from '../../frontend/src/mathPresentation.js';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),rows=read('problems/editorial/batches/collection-systems-wave14.json').editions;
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
const expectedPairs=[[15,6],[-3,2],[0,4],[2,2],[10,7],[5,-3],[-7,3],[9,-3],[6,-6],[2,-5],[15,8],[3,-8],[4,9],[4,-9],[-8,6],[-5,-2],[3,2]];
const printedPair=s=>{const m=s.match(/^\((-?\d+(?:,\d+)?); (-?\d+(?:,\d+)?)\)$/);assert(m);return m.slice(1).map(s=>value(s));};
const walk=ns=>ns.flatMap(n=>[n,...walk(n.numerator||[]),...walk(n.denominator||[]),...walk(n.fraction?[n.fraction]:[])]);assert.equal(rows.length,17);assert.equal(new Set(rows.map(r=>r.params.method+':'+r.params.target)).size,6);let fullPairWitnesses=0,nonzeroDeterminants=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i];verifyEdition(r);const equations=[r.statement.match(/^1\) (.*?)$/m)[1],r.statement.match(/^2\) (.*?)$/m)[1]],functions=equations.map(s=>{const[l,r]=s.split('=');return(x,y)=>sub(value(l,{x,y}),value(r,{x,y}));}),coeffs=functions.map(f=>{const k=f(Q(0),Q(0));return{a:sub(f(Q(1),Q(0)),k),b:sub(f(Q(0),Q(1)),k),c:neg(k)};});
 const[a,b]=coeffs,det=sub(mul(a.a,b.b),mul(b.a,a.b));assert(det[0]);nonzeroDeterminants++;const x=div(sub(mul(a.c,b.b),mul(b.c,a.b)),det),y=div(sub(mul(a.a,b.c),mul(b.a,a.c)),det);eq(x,Q(expectedPairs[i][0]));eq(y,Q(expectedPairs[i][1]));for(const f of functions)eq(f(x,y),Q(0));
 for(let X=-18;X<=18;X++)for(let Y=-18;Y<=18;Y++){const u=Q(X),v=Q(Y),hits=functions.every(f=>!f(u,v)[0]);assert.equal(hits,same(u,x)&&same(v,y));for(let j=0;j<2;j++)eq(functions[j](u,v),sub(add(mul(coeffs[j].a,u),mul(coeffs[j].b,v)),coeffs[j].c));fullPairWitnesses++;}
 if(i<5){const expected=[x,y],answer=printedPair(r.answer);eq(answer[0],expected[0]);eq(answer[1],expected[1]);const hits=r.options.map(o=>{const[u,v]=printedPair(o);return functions.every(f=>!f(u,v)[0]);});assert.equal(hits.filter(Boolean).length,1);assert.equal(r.answer,r.options[hits.indexOf(true)]);if(i===0)assert(r.options.some(o=>{const[u,v]=printedPair(o);return same(u,y)&&same(v,x);}));if(i===2)assert(!x[0]&&y[0]);if(i===3)assert(same(x,y)&&x[0]>0n);}
 else{const expected=i===16?mul(Q(-4),add(mul(Q(3),x),y)):add(x,y);eq(value(r.answer),expected);assert.equal(r.options.filter(o=>same(value(o),expected)).length,1);assert.equal(new Set(r.options.map(o=>value(o).join('/'))).size,4);if(i===16){assert(r.statement.includes('-4 × (3x + y)'));assert(!same(expected,add(x,y)));}else assert(r.statement.includes('x + y ҚОСЫНДЫСЫН'));}
 if(i===1||i===4){assert(r.solution.includes('басқа теңдеуге'));const isolating=i===1?1:0;assert(same(coeffs[isolating].a,Q(1)));}
 if(i===3||i===16)assert(r.solution.includes('қайта көбейтудің қажеті жоқ'));
 if(i===8)assert(!add(x,y)[0]);if(i===15)assert(x[0]<0n&&y[0]<0n);
 const ref=one(r.sourceRefs),cap=read(ref.sourceFile),src=one(cap.questions.filter(q=>String(q.number)===ref.sourceId));assert(cap.sourceReviewCaptured&&src.sourceAnswer&&src.solution&&!src.images?.length&&!src.svg?.length);assert.equal(one(src.options.filter(o=>o.correct)).text,src.sourceAnswer);assert.notEqual(src.statement.normalize('NFKC'),r.statement.normalize('NFKC'));
 for(const text of[r.statement,r.solution,r.answer,...r.options]){const nodes=walk(mathFragments(text));assert(!nodes.some(n=>n.type==='text'&&/[0-9xyca)|]\s*\/\s*[(−\-0-9xyca|]/.test(n.value)));}
}
let inverseMatrixCases=0;for(let a=-6;a<=6;a++)for(let b=-6;b<=6;b++)for(let c=-6;c<=6;c++)for(let d=-6;d<=6;d++){const D=a*d-b*c;if(!D)continue;const x=Q(5,2),y=Q(-7,3),R1=add(mul(Q(a),x),mul(Q(b),y)),R2=add(mul(Q(c),x),mul(Q(d),y));eq(div(sub(mul(R1,Q(d)),mul(R2,Q(b))),Q(D)),x);eq(div(sub(mul(Q(a),R2),mul(Q(c),R1)),Q(D)),y);inverseMatrixCases++;}
let tamper=0,missing=0,invalid=0;for(const r of rows){for(const f of['statement','answer','solution','options']){const c=structuredClone(r);if(f==='options')c.options=c.options.slice().reverse();else c[f]+=' өзгерген';assert.throws(()=>verifyEdition(c));tamper++;}for(const k of Object.keys(r.params)){const c=structuredClone(r);delete c.params[k];assert.throws(()=>renderEdition(c));missing++;}const c=structuredClone(r);c.params.equations[0]='x = 1';assert.throws(()=>renderEdition(c));invalid++;}
console.log(JSON.stringify({printedSystems:17,methodTargetFamilies:6,globalUniqueNonzeroDeterminants:nonzeroDeterminants,completeIntegerPairWitnesses:fullPairWitnesses,independentInverseMatrixCases:inverseMatrixCases,contentTamperRejected:tamper,missingParametersRejected:missing,nonlinearOrMissingVariableCanariesRejected:invalid,status:'author_checks_passed_requires_external_review'}));

import fs from'node:fs';import assert from'node:assert/strict';import path from'node:path';import{fileURLToPath}from'node:url';
import{renderEdition,verifyEdition}from'./grade4-written-division-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const rows=read('problems/editorial/batches/grade4-written-division-wave33.json').editions;
const fixtures=['240','4560 : 8','860 × 60','90','72','72000 : 800 = 720 : 8','3','<','3','78000','54000 : 60','30','56700 : 90 = 63','33600 : 80','8 (қалдық 170)','83 қорап, 500 күнтізбе','630','14','30039','50','7800 : 900','800','5280 : 4','32000 : 800 = 400','3'];
const nums=s=>(s.match(/\d+/g)||[]).map(Number),divs=s=>[...s.matchAll(/(\d+) : (\d+)/g)].map(m=>[+m[1],+m[2]]),one=a=>{assert.equal(a.length,1);return a[0];};
// Independent decimal longdivision. Never calls author exact/remainder/reduction helpers.
function long(n,d){let q='',r=0;for(const digit of String(n)){r=r*10+ +digit;let step=0;while(r>=d){r-=d;step++;}q+=String(step);}return[Number(q),r];}
const zero=n=>(String(n).match(/0+$/)||[''])[0].length;
function expression(s){const tokens=s.match(/\d+|[×:+−-]/g),values=[],ops=[],precedence=o=>o==='×'||o===':'?2:1;
 const apply=()=>{const op=ops.pop(),b=values.pop(),a=values.pop();assert(a!==undefined&&b!==undefined);if(op===':'){assert.equal(a%b,0n);values.push(a/b);}else values.push(op==='×'?a*b:op==='+'?a+b:a-b);};
 for(const t of tokens){if(/^\d+$/.test(t))values.push(BigInt(t));else{while(ops.length&&precedence(ops.at(-1))>=precedence(t))apply();ops.push(t);}}while(ops.length)apply();assert.equal(values.length,1);return values[0];}
let domainCases=0,printed=0,equalityChains=0,tamperRejected=0,missingRejected=0;
for(let i=0;i<rows.length;i++){
 const row=rows[i],n=nums(row.statement),ds=divs(row.statement),opts=row.options||[];let actual;
 switch(i){
 case 0:case 3:case 4:case 21:actual=String(long(...ds[0])[0]);assert.equal(long(...ds[0])[1],0);break;
 case 1:case 22:{const[a,b]=ds[0];actual=one(opts.filter(o=>{const[x,y]=nums(o);return x*b===y*a&&y%10!==0;}));break;}
 case 2:{const[a,b]=ds[0];actual=one(opts.filter(o=>o.includes('×')&&expression(o)===BigInt(a)));assert.equal(long(a,b)[0],n[2]);break;}
 case 5:actual=one(opts.filter(o=>{const[a,b,x,y]=nums(o);return a*y===b*x;}));break;
 case 6:actual=String(String(long(...ds[0])[0]).length);break;
 case 7:{const a=long(...ds[0])[0],b=long(...ds[1])[0];actual=a===b?'=':a>b?'>':'<';break;}
 case 8:actual=String(zero(long(...ds[0])[0]));break;
 case 9:actual=String(long(n[1],n[0])[0]*n[2]);assert.equal(long(n[1],n[0])[1],0);break;
 case 10:{const qs=opts.map(o=>long(...nums(o))[0]);actual=opts[qs.indexOf(Math.max(...qs))];break;}
 case 11:actual=String(long(long(...ds[0])[0],long(...ds[1])[0])[0]);assert.equal(long(long(...ds[0])[0],long(...ds[1])[0])[1],0);break;
 case 12:case 23:actual=one(opts.filter(o=>{const[a,b,q]=nums(o);return a!==b*q;}));assert.match(row.statement,/әдейі/);break;
 case 13:actual=one(opts.filter(o=>{const[q,r]=long(...nums(o));return q===n[0]&&r===0;}));break;
 case 14:case 15:{const[a,b]=i===14?ds[0]:n;actual=one(opts.filter(o=>{const[q,r]=nums(o);return q*b+r===a&&r>=0&&r<b;}));break;}
 case 16:actual=String(long(n[1]*n[2],n[0])[0]);break;
 case 17:actual=String(long(n[0]*n[1]+n[2],n[3])[0]);break;
 case 18:{const[d,q]=n,possible=[];for(let r=0;r<d;r++){possible.push(d*q+r);domainCases++;}actual=String(Math.max(...possible));assert.equal(long(+actual+1,d)[0],q+1);break;}
 case 19:{const[d,r,b]=n;const rs=new Set();for(let k=0;k<=500;k++){rs.add(long(d*k+r,b)[1]);domainCases++;}actual=String(one([...rs]));assert.equal(d%b,0);break;}
 case 20:{const rs=opts.map(o=>long(...nums(o))[1]);actual=opts[rs.indexOf(Math.max(...rs))];break;}
 case 24:{const suffix=+row.statement.match(/□(\d+)/)[1],place=10**String(suffix).length,d=n.at(-1),hits=[];for(let digit=1;digit<=9;digit++){domainCases++;if(long(digit*place+suffix,d)[1]===0)hits.push(digit);}actual=String(one(hits));break;}
 default:throw Error('Missing printed case');
 }
 assert.equal(row.answer,actual,`Printed case${i+1}`);assert.equal(row.answer,fixtures[i]);printed++;verifyEdition(row);
 if(!opts.length)assert.match(row.statement,/Жауапқа тек санды жазыңыз/);
 const chain=/\d+(?:\s*[×:+−-]\s*\d+)*(?:\s*=\s*\d+(?:\s*[×:+−-]\s*\d+)*)+/g;
 for(const m of row.solution.matchAll(chain)){if(/[×:+−-]\s*$/.test(row.solution.slice(0,m.index)))continue;const vals=m[0].split('=').map(expression);assert(vals.every(v=>v===vals[0]),m[0]);equalityChains++;}
 for(const f of['answer','statement','solution','options'])if(row[f]!==undefined){const t=structuredClone(row);t[f]=f==='options'?[...opts.slice(1),opts[0]]:String(t[f])+' INVALID';assert.throws(()=>verifyEdition(t));tamperRejected++;}
 for(const key of Object.keys(row.params)){const t=structuredClone(row);delete t.params[key];assert.throws(()=>renderEdition(t));missingRejected++;}
 const ref=row.sourceRefs[0],raw=read(ref.sourceFile).questions.find(q=>q.id===ref.sourceId);assert(raw?.checked&&raw.solution&&raw.sourceAnswer&&!raw.images?.length&&!raw.svg?.length);const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(normalize(row.statement),normalize(raw.statement));
}
// Full decimal domains prove both quotient invariance and original-unit remainder scaling.
for(let a=1;a<=200;a++)for(let b=1;b<=60;b++)for(let z=0;z<4;z++){
 const[q,r]=long(a,b),[qq,rr]=long(a*10**z,b*10**z);assert.equal(qq,q);assert.equal(rr,r*10**z);assert.equal(q*b+r,a);assert(r>=0&&r<b);domainCases++;
}
// Alloriginal-domain remainders0...d−1, including zero and d−1, are legal; d is not.
for(const d of[40,60,70,80,90,400,600,700,800,900])for(let q=0;q<=9;q++)for(let r=0;r<d;r++){assert.deepEqual(long(q*d+r,d),[q,r]);domainCases++;}
const guards=[
 [0,p=>p.dividend=9600],
 [1,p=>p.choices[0]=[45600,80]], // two valid quotient-preserving options
 [6,p=>p.dividend=243600], // newinternalzero in quotient406 destroys the planned source family
 [14,p=>p.choices[0]=[8,170]],
 [15,p=>p.capacity=70],
 [17,p=>p.remainder=70],
 [19,p=>p.newDivisor=60],
 [20,p=>p.pairs[1]=[7900,900]], // the correct choice now ties for largest reducedremainder; misleading order destroyed
 [24,p=>p.suffix=4000],
];
for(const[i,edit]of guards){const t=structuredClone(rows[i]);edit(t.params);assert.throws(()=>renderEdition(t),`Guard row${i+1}`);}
console.log(JSON.stringify({fixtures:fixtures.length,printed,completeDomainCases:domainCases,numericSolutionEqualityChains:equalityChains,tamperRejected,missingParametersRejected:missingRejected,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

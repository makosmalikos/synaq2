import fs from'node:fs';import assert from'node:assert/strict';import path from'node:path';import{fileURLToPath}from'node:url';
import{renderEdition,verifyEdition,longDivision}from'./grade4-long-division-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const rows=read('problems/editorial/batches/grade4-long-division-wave35.json').editions;
const fixtures=['482','73','76 × 63 = 4788','2','2736','6','873; 2 цифр','13896','2597','18','73','>','4368 : 56','91','Қате, дұрысы — 94','2368 : 37','37','98','42','7524','7','65','9','43','583','3','69'];
const ns=s=>(s.match(/\d+/g)||[]).map(Number),divs=s=>[...s.matchAll(/(\d+) : (\d+)/g)].map(m=>[+m[1],+m[2]]),one=a=>{assert.equal(a.length,1);return a[0];};
const quotient=(a,b)=>{assert.equal(BigInt(a)%BigInt(b),0n);return Number(BigInt(a)/BigInt(b));};
const prefix=(a,b)=>{for(let i=1;i<=String(a).length;i++){const n=+String(a).slice(0,i);if(n>=b)return n;}throw Error('No prefix');};
function arithmetic(s){const ts=s.match(/\d+|[×+:−()-]/g),vs=[],ops=[],prec=t=>t==='×'||t===':'?2:1;
 const apply=()=>{const op=ops.pop(),b=vs.pop(),a=vs.pop();assert(a!==undefined&&b!==undefined);if(op===':'){assert.equal(a%b,0n);vs.push(a/b);}else vs.push(op==='×'?a*b:op==='+'?a+b:a-b);};
 for(const t of ts){if(/^\d+$/.test(t))vs.push(BigInt(t));else if(t==='(')ops.push(t);else if(t===')'){while(ops.length&&ops.at(-1)!=='(')apply();assert.equal(ops.pop(),'(');}else{while(ops.length&&ops.at(-1)!=='('&&prec(ops.at(-1))>=prec(t))apply();ops.push(t);}}while(ops.length){assert.notEqual(ops.at(-1),'(');apply();}assert.equal(vs.length,1);return vs[0];}
let printed=0,domain=0,steps=0,equalities=0,tamper=0,missing=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],n=ns(r.statement),ds=divs(r.statement),opts=r.options||[];let actual;
 switch(i){
 case 0:case 24:actual=String(prefix(...ds[0]));break;
 case 1:actual=String(quotient(...ds[0]));break;
 case 2:actual=one(opts.filter(o=>{const[a,b,c]=ns(o);return o.includes('×')&&a*b===c;}));break;
 case 3:case 25:actual=String(String(quotient(...ds[0])).length);break;
 case 4:actual=String(n[0]*n[1]);break;
 case 5:actual=String(quotient(...ds[0]))[0];break;
 case 6:actual=one(opts.filter(o=>{const[a,b]=ns(o);return a===prefix(...ds[0])&&b===String(quotient(...ds[0])).length;}));break;
 case 7:case 8:actual=String(quotient(n[1],n[0])*n[2]);break;
 case 9:actual=String(quotient(n[0],quotient(n[0],n[1])+n[2]));break;
 case 10:actual=String(quotient(n[0],n[1]));break;
 case 11:{const a=quotient(...ds[0]),b=quotient(...ds[1]);actual=a===b?'=':a>b?'>':'<';break;}
 case 12:actual=one(opts.filter(o=>quotient(...ns(o))===n[0]));break;
 case 13:actual=String(quotient(n[1],n[0])-quotient(n[3],n[2]));break;
 case 14:{const q=quotient(...ds[0]);actual=one(opts.filter(o=>o.startsWith('Қате')&&one(ns(o))===q));assert.notEqual(q,n.at(-1));break;}
 case 15:{const qs=opts.map(o=>quotient(...ns(o)));actual=opts[qs.indexOf(Math.max(...qs))];break;}
 case 16:{const[product,gap]=n,hits=[];for(let d=1;d<=product;d++){domain++;if(d*(d+gap)===product)hits.push(d);}actual=String(one(hits));break;}
 case 17:actual=String(quotient(n[1]*n[2],n[0]));break;
 case 18:actual=String(quotient(n[0]*n[1],n[2]));break;
 case 19:{const d=n[0],values=[];for(let q=10;q<=99;q++){domain++;values.push(d*q);}actual=String(Math.max(...values));assert(100*d>+actual);break;}
 case 20:actual=String(quotient(quotient(n[0],n[1]),n[2]));break;
 case 21:actual=one(opts.filter(o=>n[0]%+o===0));break;
 case 22:{const total=n[0]*n[1],capacity=n[2]-n[3];actual=String(quotient(total,capacity));assert((+actual-1)*capacity<total);break;}
 case 23:actual=String(quotient(...ds[1]));assert.equal(quotient(...ds[0]),n[2]);break;
 case 26:actual=String(quotient(n[0],n[1]));break;
 default:throw Error('Missing printed case');
 }
 assert.equal(r.answer,actual,`Printed case${i+1}`);assert.equal(r.answer,fixtures[i]);printed++;verifyEdition(r);if(!opts.length)assert.match(r.statement,/Жауапқа тек санды жазыңыз/);
 for(const m of r.solution.replace(/(?<=\d):(?=\s)/g,';').matchAll(/[0-9(][0-9\s×+:−()=-]*/g)){
  const text=m[0].trim();if(!text.includes('='))continue;if(/[×+:−-]\s*$/.test(r.solution.slice(0,m.index)))continue;
  if((text.match(/\(/g)||[]).length!==(text.match(/\)/g)||[]).length)continue;
  const bits=text.split('=').map(t=>t.trim());assert(bits.every(Boolean));const vals=bits.map(arithmetic);assert(vals.every(v=>v===vals[0]),`solutionchain${text}`);equalities++;
 }
 for(const f of['answer','statement','solution','options'])if(r[f]!==undefined){const t=structuredClone(r);t[f]=f==='options'?[...opts.slice(1),opts[0]]:String(t[f])+' INVALID';assert.throws(()=>verifyEdition(t));tamper++;}
 for(const key of Object.keys(r.params)){const t=structuredClone(r);delete t.params[key];assert.throws(()=>renderEdition(t),`Missing ${key}`);missing++;}
 const ref=r.sourceRefs[0],raw=read(ref.sourceFile).questions.find(q=>q.id===ref.sourceId);assert(raw?.checked&&raw.solution&&raw.sourceAnswer&&!raw.images?.length&&!raw.svg?.length);const norm=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(norm(r.statement),norm(raw.statement));
}
// Complete four-digit dividends and two-digit divisors: own BigInt quotient/remainder
// versus author decimal trace, including internal/terminal quotientzeros and nonzero remainders.
for(let a=1000;a<=9999;a++)for(let b=10;b<=99;b++){
 const t=longDivision(a,b),q=Number(BigInt(a)/BigInt(b)),r=Number(BigInt(a)%BigInt(b));assert.equal(t.quotient,q);assert.equal(t.remainder,r);assert.equal(t.firstPartial,prefix(a,b));assert.equal(t.steps.map(s=>s.digit).join(''),String(q));
 for(const s of t.steps){assert.equal(s.product,s.digit*b);assert.equal(s.partial,s.product+s.remainder);assert(s.remainder>=0&&s.remainder<b);steps++;}domain++;
}
const guards=[
 [0,p=>p.divisor=47],
 [3,p=>p.dividend=5163],
 [5,p=>p.dividend=4222],
 [6,p=>p.choices[1]=[873,2]],
 [9,p=>p.increase=13],
 [11,p=>p.second=[4292,58]],
 [12,p=>p.target=77],
 [14,p=>p.claimed=94],
 [15,p=>p.pairs[0]=[5312,83]],
 [16,p=>p.gap=5],
 [17,p=>p.wrongDivisor=85],
 [20,p=>p.totalKg=2745],
 [21,p=>p.choices[0]=65],
 [22,p=>p.reserved=4],
 [23,p=>p.newDivisor=83],
];
for(const[i,edit]of guards){const t=structuredClone(rows[i]);edit(t.params);assert.throws(()=>renderEdition(t),`Guard${i+1}`);}
console.log(JSON.stringify({fixtures:fixtures.length,printed,completeDomainCases:domain,longDivisionDigitSteps:steps,numericSolutionEqualityChains:equalities,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

import fs from'node:fs';import assert from'node:assert/strict';import path from'node:path';import{fileURLToPath}from'node:url';
import{renderEdition,verifyEdition,trace}from'./grade4-quotient-zeros-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const rows=read('problems/editorial/batches/grade4-quotient-zeros-wave37.json').editions;
const fixtures=['3','396','14800 : 37','630','6060','605','13158 : 43','430 × 47','>','56700 : 14 = 4050','500','730','76760 : 19','3','10640','50','21852','23000','3 немесе 4','416','808','8653','190','10088','600','3','1300','<','12400'];
const nums=s=>(s.match(/\d+/g)||[]).map(Number),one=a=>{assert.equal(a.length,1);return a[0];},div=(a,b)=>{assert.equal(BigInt(a)%BigInt(b),0n);return Number(BigInt(a)/BigInt(b));};
const prefix=(a,b)=>{for(let i=1;i<=String(a).length;i++)if(+String(a).slice(0,i)>=b)return+String(a).slice(0,i);return a;};
function arithmetic(s){const ts=s.match(/\d+|[×+:−()-]/g),vs=[],ops=[],prec=t=>t==='×'||t===':'?2:1;const apply=()=>{const op=ops.pop(),b=vs.pop(),a=vs.pop();assert(a!==undefined&&b!==undefined);if(op===':'){assert.equal(a%b,0n);vs.push(a/b);}else vs.push(op==='×'?a*b:op==='+'?a+b:a-b);};for(const t of ts){if(/^\d+$/.test(t))vs.push(BigInt(t));else if(t==='(')ops.push(t);else if(t===')'){while(ops.length&&ops.at(-1)!=='(')apply();assert.equal(ops.pop(),'(');}else{while(ops.length&&ops.at(-1)!=='('&&prec(ops.at(-1))>=prec(t))apply();ops.push(t);}}while(ops.length){assert.notEqual(ops.at(-1),'(');apply();}assert.equal(vs.length,1);return vs[0];}
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),originals=new Set;for(const file of new Set(read('problems/editorial/batches/grade4-inventory.json').records.map(r=>r.sourceFile)))for(const q of read(file).questions)originals.add(normalize(q.statement));
let domain=0,steps=0,equalities=0,tamper=0,missing=0;
for(let i=0;i<rows.length;i++){
 const row=rows[i],n=nums(row.statement),os=row.options||[];let actual;
 switch(i){
 case 0:case 13:case 25:{const[a,b]=n;const pre=String(prefix(a,b)).length;actual=String(String(a).length-pre+1);assert.equal(actual,String(String(div(a,b)).length));break;}
 case 1:actual=String(prefix(n[0],n[1]));break;
 case 2:actual=one(os.filter(o=>div(...nums(o))===n[0]));break;
 case 3:case 4:case 5:case 24:actual=String(div(n[0],n[1]));break;
 case 6:actual=one(os.filter(o=>Math.floor(div(...nums(o))/10)%10===0));break;
 case 7:actual=one(os.filter(o=>arithmetic(o)===BigInt(n[0])));break;
 case 8:case 27:{const q=div(n[0],n[1]);actual=q===n[2]?'=':q>n[2]?'>':'<';break;}
 case 9:actual=one(os.filter(o=>{const[a,b,c]=nums(o);return a===b*c;}));break;
 case 10:actual=String(div(n[0],n[1]));break;
 case 11:case 26:actual=String(div(n[1],n[0]));break;
 case 12:{const qs=os.map(o=>div(...nums(o)));actual=os[qs.indexOf(Math.max(...qs))];assert(qs.every(q=>/^[1-9]0[1-9]0$/.test(String(q))));break;}
 case 14:{const divisor=n[0],written=+row.statement.match(/, (\d+) деп/)[1],hits=[];for(let q=100;q<=999;q++){domain++;if(String(q).split('0').length===2&&+String(q).replace('0','')===written&&String(q*divisor).length===5)hits.push(q*divisor);}actual=String(one(hits));break;}
 case 15:{const d=n[0],hits=[];for(let a=10000;a<=99999;a++){domain++;if(a%d===0){const q=a/d;if(q>=100&&q<=999&&Math.floor(q/10)%10===0)hits.push(a);}}actual=String(hits.length);break;}
 case 16:{const[q,gap]=n,hits=[];for(let d=1;d<=9999;d++){domain++;if(d*q-d===gap)hits.push(d*q);}actual=String(one(hits));break;}
 case 17:actual=one(os.filter(o=>div(+o,n[0])%100===0));break;
 case 18:{const digits=new Set;for(let a=10000;a<=99999;a++){domain++;if(a%n[0]===0)digits.add(String(a/n[0]).length);}const expected=[...digits].sort();actual=one(os.filter(o=>JSON.stringify(nums(o))===JSON.stringify(expected)));break;}
 case 19:actual=String(div(n[0]*n[1],n[2]));break;
 case 20:actual=String(div(n[1]*n[2],n[0]));break;
 case 21:{const hits=[];for(let a=1000;a<=9999;a++){domain++;if(a%n[0]===0){const q=a/n[0];if(q>=100&&q<=999&&Math.floor(q/10)%10===0)hits.push(a);}}actual=String(Math.max(...hits));break;}
 case 22:actual=String(div(n[0],n[1])-div(n[0],n[2]));break;
 case 23:{const hits=[];for(let a=10000;a<=99999;a++){domain++;if(a%n[0]===0)hits.push(a);}actual=String(hits[0]);break;}
 case 28:{const hits=[];for(let a=10000;a<=99999;a++){domain++;if(a%n[0]===0){const q=a/n[0];if(q>=100&&q<=999&&Math.floor(q/10)%10===0)hits.push(a);}}actual=String(hits[0]);break;}
 default:throw Error('Missing case');
 }
 assert.equal(row.answer,actual,`Printed case ${i+1}`);assert.equal(row.answer,fixtures[i]);verifyEdition(row);assert(!originals.has(normalize(row.statement)),'Source wording must differ');if(!os.length)assert.match(row.statement,/Жауапқа тек санды жазыңыз/);
 for(const m of row.solution.replace(/(?<=\d):(?=\s)/g,';').matchAll(/[0-9(][0-9\s×+:−()=-]*/g)){
  const text=m[0].trim();if(!text.includes('='))continue;if(/[×+:−-]\s*$/.test(row.solution.slice(0,m.index)))continue;if((text.match(/\(/g)||[]).length!==(text.match(/\)/g)||[]).length)continue;const bits=text.split('=').map(t=>t.trim());assert(bits.every(Boolean));const values=bits.map(arithmetic);assert(values.every(v=>v===values[0]),`Numeric chain ${text}`);equalities++;
 }
 for(const f of['statement','solution','answer','options'])if(row[f]!==undefined){const t=structuredClone(row);t[f]=f==='options'?[...os.slice(1),os[0]]:String(t[f])+' INVALID';assert.throws(()=>verifyEdition(t));tamper++;}
 for(const key of Object.keys(row.params)){const t=structuredClone(row);delete t.params[key];assert.throws(()=>renderEdition(t),`Missing ${key}`);missing++;}
 const ref=row.sourceRefs[0],raw=read(ref.sourceFile).questions.find(q=>q.id===ref.sourceId);assert(raw?.checked&&raw.solution&&raw.sourceAnswer&&!raw.images?.length&&!raw.svg?.length);
}
// All90000five-digit dividends for each relevant distinct longdivision divisor.
// BigInt quotient/remainder oracle is separate from author decimal-column trace.
for(const b of[8,16,19,24,31,38,67,72,97])for(let a=10000;a<=99999;a++){
 const t=trace(a,b),q=Number(BigInt(a)/BigInt(b)),r=Number(BigInt(a)%BigInt(b));assert.equal(t.quotient,q);assert.equal(t.remainder,r);assert.equal(t.prefix,prefix(a,b));assert.equal(t.steps.map(v=>v.q).join(''),String(q));for(const s of t.steps){assert.equal(s.part,s.product+s.r);assert.equal(s.product,b*s.q);assert(s.r>=0&&s.r<b);steps++;}domain++;
}
const guards=[
 [0,p=>p.dividend=19041],[1,p=>p.choices[0]=396],[2,p=>p.target=410],
 [3,p=>p.pattern='X0X'],[4,p=>p.divisor=16],[5,p=>p.dividend=9696],
 [6,p=>p.pairs[0]=[12900,43]],[7,p=>p.quotient=403],[8,p=>p.benchmark=660],
 [9,p=>p.equations[0][2]=1010],[10,p=>p.total=22501],[11,p=>p.pattern='X0X'],
 [12,p=>p.pairs[0]=[8062,2]],[14,p=>p.divisor=20],[15,p=>p.divisor=10],
 [16,p=>p.difference=21817],[17,p=>p.choices[1]=23000],[18,p=>p.dividendDigits=4],
 [19,p=>p.newDivisor=22],[20,p=>p.wrongDivisor=73],[21,p=>p.divisor=100],
 [22,p=>p.nextShops=64],[23,p=>p.divisor=64],[26,p=>p.pattern='XX0'],
 [27,p=>p.benchmark=2020],[28,p=>p.divisor=10],
];for(const[i,edit]of guards){const t=structuredClone(rows[i]);edit(t.params);assert.throws(()=>renderEdition(t),`Pedagogical guard${i+1}`);}
console.log(JSON.stringify({printedFixtures:fixtures.length,completeDomainCases:domain,longDivisionDigitSteps:steps,numericSolutionEqualityChains:equalities,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

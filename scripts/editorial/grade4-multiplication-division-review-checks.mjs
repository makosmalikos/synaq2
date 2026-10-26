import fs from'node:fs';import assert from'node:assert/strict';import path from'node:path';import{fileURLToPath}from'node:url';
import{renderEdition,verifyEdition,divisionTrace,operatorValue}from'./grade4-multiplication-division-review-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const rows=read('problems/editorial/batches/grade4-multiplication-division-review-wave40.json').editions;
const fixtures=['202, қалдық 104','3','352 × 184','30000','=','190','9548 : 217 = 43','16 тәулік 5 сағат','43472 : 176','7','319 × 314','162','500 мен 600 арасында','27','213','=',': және ×','91200','80088','231, қалдық 104','4','<'];
const nums=s=>(s.match(/\d+/g)||[]).map(Number),one=a=>{assert.equal(a.length,1);return a[0];},qr=(a,b)=>[Number(BigInt(a)/BigInt(b)),Number(BigInt(a)%BigInt(b))],exact=(a,b)=>{const[q,r]=qr(a,b);assert.equal(r,0);return q;};
const prefix=(a,b)=>{for(let i=1;i<=String(a).length;i++)if(+String(a).slice(0,i)>=b)return+String(a).slice(0,i);return a;};
function arithmetic(s){const ts=s.match(/\d+|[×+:−()-]/g),vs=[],ops=[],prec=t=>t==='×'||t===':'?2:1;const apply=()=>{const op=ops.pop(),b=vs.pop(),a=vs.pop();assert(a!==undefined&&b!==undefined);if(op===':'){assert.equal(a%b,0n);vs.push(a/b);}else vs.push(op==='×'?a*b:op==='+'?a+b:a-b);};for(const t of ts){if(/^\d+$/.test(t))vs.push(BigInt(t));else if(t==='(')ops.push(t);else if(t===')'){while(ops.length&&ops.at(-1)!=='(')apply();assert.equal(ops.pop(),'(');}else{while(ops.length&&ops.at(-1)!=='('&&prec(ops.at(-1))>=prec(t))apply();ops.push(t);}}while(ops.length){assert.notEqual(ops.at(-1),'(');apply();}assert.equal(vs.length,1);return vs[0];}
const norm=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),sources=new Set;for(const f of new Set(read('problems/editorial/batches/grade4-inventory.json').records.map(r=>r.sourceFile)))for(const q of read(f).questions)sources.add(norm(q.statement));
let domain=0,steps=0,equalities=0,tamper=0,missing=0;
for(let i=0;i<rows.length;i++){
 const row=rows[i],n=nums(row.statement),os=row.options||[];let actual;
 switch(i){
 case 0:case 19:{const[q,r]=qr(n[0],n[1]);actual=one(os.filter(o=>{const[x,y]=nums(o);return x===q&&y===r;}));const identityButInvalid=os.map(nums).filter(([x,y])=>x*n[1]+y===n[0]&&y>=n[1]);assert.equal(identityButInvalid.length,1);break;}
 case 1:case 20:actual=String(String(n[0]).length-String(prefix(n[0],n[1])).length+1);break;
 case 2:actual=one(os.filter(o=>o.includes('×')&&arithmetic(o)===BigInt(n[0])));break;
 case 3:{const product=n[0]*n[1],diff=os.map(o=>Math.abs(+o-product));actual=os[diff.indexOf(Math.min(...diff))];assert.equal(diff.filter(v=>v===Math.min(...diff)).length,1);break;}
 case 4:actual=exact(n[0],n[1])===exact(n[2],n[3])?'=':'INVALID';break;
 case 5:actual=String(qr(n[0],n[1])[1]);assert.equal(qr(n[0],n[1])[0]%10,0);assert.match(row.statement,/соңғы қалдық/);break;
 case 6:actual=one(os.filter(o=>{const[a,b,q]=nums(o);return a!==b*q;}));break;
 case 7:{const[q,r]=qr(n[0],24);actual=one(os.filter(o=>{const[x,y]=nums(o);return x===q&&y===r;}));assert(os.some(o=>{const[x,y]=nums(o);return 24*x+y===n[0]&&y>=24;}));break;}
 case 8:actual=one(os.filter(o=>String(exact(...nums(o))).length===3));break;
 case 9:actual=String(String(n[0]*n[1]).length);assert.match(row.solution,/әлі жеткіліксіз/);break;
 case 10:actual=one(os.filter(o=>{const[a,b]=nums(o);return a*b>n[0];}));break;
 case 11:{const[q,up,down]=n,vals=new Set;for(let b=1;b<=500;b++){domain++;vals.add(exact(q*b*up,b*down));}actual=String(one([...vals]));break;}
 case 12:actual=one(os.filter(o=>{const[a,b]=nums(o);return a*n[1]<n[0]&&b*n[1]>n[0];}));break;
 case 13:{const vals=new Set;for(let k=0;k<1000;k++){domain++;vals.add((n[0]*k+n[1])%n[2]);}actual=String(one([...vals]));break;}
 case 14:{const hits=[];for(let a=100;a<=999;a++){domain++;if(String(a*n[0]).length===5)hits.push(a);}actual=String(hits[0]);assert((+actual-1)*n[0]<10000);break;}
 case 15:actual=n[0]*n[1]===n[2]*n[3]?'=':'INVALID';break;
 case 16:{const[a,b,c,target]=n;actual=one(os.filter(o=>{const[op1,op2]=o.split(' және ');return arithmetic(`${a} ${op1} ${b} ${op2} ${c}`)===BigInt(target);}));break;}
 case 17:{const correct=n[0],wrong=n[2],short=n[3],hits=[];assert.equal(n[1],0);for(let x=1;x<=9999;x++){domain++;if(x*correct-x*wrong===short)hits.push(x*correct);}actual=String(one(hits));break;}
 case 18:{const d=n[0],hits=[];for(let q=1;q<d;q++){domain++;const a=d*q+q;assert.equal(qr(a,d)[0],qr(a,d)[1]);hits.push(a);}actual=String(Math.max(...hits));break;}
 case 21:{const[a,b,c,d]=n;actual=a*b===c*d?'=':a*b<c*d?'<':'>';assert.equal(c,d);assert.equal(a+b,2*c);assert.equal(c*d-a*b,(c-a)**2);break;}
 default:throw Error('Missing printed case');
 }
 assert.equal(row.answer,actual,`Printed${i+1}`);assert.equal(row.answer,fixtures[i]);verifyEdition(row);assert(!sources.has(norm(row.statement)));if(!os.length)assert.match(row.statement,/Жауапқа тек санды жазыңыз/);
 for(const m of row.solution.replace(/(?<=\d):(?=\s)/g,';').matchAll(/[0-9(][0-9\s×+:−()=-]*/g)){
  const text=m[0].trim();if(!text.includes('='))continue;if(/[×+:−-]\s*$/.test(row.solution.slice(0,m.index)))continue;if((text.match(/\(/g)||[]).length!==(text.match(/\)/g)||[]).length)continue;const bits=text.split('=').map(t=>t.trim());assert(bits.every(Boolean));const vs=bits.map(arithmetic);assert(vs.every(v=>v===vs[0]),`Numeric chain ${text}`);equalities++;
 }
 for(const f of['statement','solution','answer','options'])if(row[f]!==undefined){const t=structuredClone(row);t[f]=f==='options'?[...os.slice(1),os[0]]:String(t[f])+' INVALID';assert.throws(()=>verifyEdition(t));tamper++;}
 for(const key of Object.keys(row.params)){const t=structuredClone(row);delete t.params[key];assert.throws(()=>renderEdition(t),`Missing ${key}`);missing++;}
 const ref=row.sourceRefs[0],raw=read(ref.sourceFile).questions.find(q=>q.id===ref.sourceId);assert(raw?.checked&&raw.solution&&raw.sourceAnswer&&!raw.images?.length&&!raw.svg?.length);
}
// Complete5digit domains forallzero-placement/remainder divisors andall6digit valuesfor413.
for(const b of[148,176,207,216,319,347,413,427,580])for(let a=10000;a<=99999;a++){
 const t=divisionTrace(a,b),[q,r]=qr(a,b);assert.equal(t.quotient,q);assert.equal(t.remainder,r);assert.equal(t.prefix,prefix(a,b));assert.equal(t.steps.map(s=>s.q).join(''),String(q));for(const s of t.steps){assert.equal(s.partial,s.product+s.remainder);assert.equal(s.product,b*s.q);assert(s.remainder>=0&&s.remainder<b);steps++;}domain++;
}
for(let a=100000;a<=999999;a++){
 const t=divisionTrace(a,413),[q,r]=qr(a,413);assert.equal(t.quotient,q);assert.equal(t.remainder,r);assert.equal(t.prefix,prefix(a,413));assert.equal(t.steps.length,String(q).length);domain++;
}
// Independent precedence parser versus author operator interpreter foractual choices.
for(let a=12;a<=120;a+=12)for(const b of[2,3,4,6])for(const c of[2,3])for(const ops of[['−','×'],[':','×'],[':','+'],['×',':']]){
 if(ops[0]===':'&&a%b!==0||ops[1]===':'&&(a*b)%c!==0)continue;assert.equal(operatorValue(a,b,c,ops),Number(arithmetic(`${a} ${ops[0]} ${b} ${ops[1]} ${c}`)));domain++;
}
const guards=[
 [0,p=>p.dividend=30148],[1,p=>p.dividendDigits=6],[2,p=>p.quotient=353],
 [3,p=>p.rounded=[400,60]],[4,p=>p.second=[2005,5]],[5,p=>p.dividend=80347],
 [6,p=>p.equations[3][2]=44],[7,p=>p.choices[2]=[15,28]],[8,p=>p.pairs[0]=[4928,176]],
 [9,p=>p.refinedLower=[400,2000]],[10,p=>p.pairs[0]=[400,400]],[11,p=>p.divisorFactor=7],
 [12,p=>p.divisor=42],[13,p=>p.newDivisor=34],[14,p=>p.multiplier=9],
 [15,p=>p.scale=3],[16,p=>p.target=193],[17,p=>p.wrong=35],
 [18,p=>p.divisor=28],[19,p=>p.dividend=50216],[20,p=>p.dividendDigits=5],
 [21,p=>p.gap=0],
];for(const[i,edit]of guards){const t=structuredClone(rows[i]);edit(t.params);assert.throws(()=>renderEdition(t),`Pedagogical guard${i+1}`);}
console.log(JSON.stringify({printedFixtures:fixtures.length,completeDomainCases:domain,longDivisionDigitSteps:steps,numericSolutionEqualityChains:equalities,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

import fs from'node:fs';import assert from'node:assert/strict';import path from'node:path';import{fileURLToPath}from'node:url';
import{renderEdition,verifyEdition,divisionTrace}from'./grade4-three-digit-division-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const rows=read('problems/editorial/batches/grade4-three-digit-division-wave39.json').editions;
const fixtures=['29820 : 426','776','3','47802 : 257 = 186','4, қалдық 128','48000 : 416','76614 : 113','240 тг','142','324','3744','8400','13500','=','5 немесе 6','126','35700','22','15724','2920','140','<'];
const nums=s=>(s.match(/\d+/g)||[]).map(Number),one=a=>{assert.equal(a.length,1);return a[0];},qr=(a,b)=>[Number(BigInt(a)/BigInt(b)),Number(BigInt(a)%BigInt(b))],exact=(a,b)=>{const[q,r]=qr(a,b);assert.equal(r,0);return q;};
const prefix=(a,b)=>{for(let i=1;i<=String(a).length;i++)if(+String(a).slice(0,i)>=b)return+String(a).slice(0,i);return a;};
function arithmetic(s){const ts=s.match(/\d+|[×+:−()-]/g),vs=[],ops=[],prec=t=>t==='×'||t===':'?2:1;const apply=()=>{const op=ops.pop(),b=vs.pop(),a=vs.pop();assert(a!==undefined&&b!==undefined);if(op===':'){assert.equal(a%b,0n);vs.push(a/b);}else vs.push(op==='×'?a*b:op==='+'?a+b:a-b);};for(const t of ts){if(/^\d+$/.test(t))vs.push(BigInt(t));else if(t==='(')ops.push(t);else if(t===')'){while(ops.length&&ops.at(-1)!=='(')apply();assert.equal(ops.pop(),'(');}else{while(ops.length&&ops.at(-1)!=='('&&prec(ops.at(-1))>=prec(t))apply();ops.push(t);}}while(ops.length){assert.notEqual(ops.at(-1),'(');apply();}assert.equal(vs.length,1);return vs[0];}
const norm=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),sources=new Set;for(const f of new Set(read('problems/editorial/batches/grade4-inventory.json').records.map(r=>r.sourceFile)))for(const q of read(f).questions)sources.add(norm(q.statement));
let domain=0,steps=0,equalities=0,tamper=0,missing=0;
for(let i=0;i<rows.length;i++){
 const row=rows[i],n=nums(row.statement),os=row.options||[];let actual;
 switch(i){
 case 0:actual=one(os.filter(o=>{const q=exact(...nums(o));return q>=10&&q<=99;}));break;
 case 1:case 19:actual=String(prefix(n[0],n[1]));break;
 case 2:actual=String(String(n[0]).length-String(prefix(n[0],n[1])).length+1);break;
 case 3:actual=one(os.filter(o=>{const[a,b,q]=nums(o);return a===b*q;}));break;
 case 4:{const[q,r]=qr(n[0],n[1]);actual=one(os.filter(o=>{const[x,y]=nums(o);return x===q&&y===r;}));const invalid=os.map(nums).filter(([x,y])=>x*n[1]+y===n[0]&&y>=n[1]);assert.equal(invalid.length,1);assert.equal(q,4);assert(n[1]*5>n[0]);break;}
 case 5:actual=one(os.filter(o=>{const[a,b]=nums(o);return a%b!==0;}));break;
 case 6:{const qs=os.map(o=>exact(...nums(o)));actual=os[qs.indexOf(Math.max(...qs))];assert.equal(nums(actual)[1],Math.min(...os.map(o=>nums(o)[1])));break;}
 case 7:actual=one(os.filter(o=>+nums(o)[0]===exact(n[1],n[0])-exact(n[3],n[2])&&o.endsWith(' тг')));break;
 case 8:actual=String(qr(n[0],n[1])[1]);assert.notEqual(actual,String(qr(n[0],n[1])[0]));break;
 case 9:actual=String(exact(n[0],n[1]));assert(+actual<=365);assert.match(row.statement,/неше күн жұмыс істеді/);break;
 case 10:actual=String(exact(n[0],n[1])*n[2]);assert(/^[1-9]0[1-9]$/.test(String(exact(n[0],n[1]))));break;
 case 11:actual=String(exact(n[1],n[0])*n[2]);assert.equal(n[0],365);assert.equal(n[2],100);break;
 case 12:actual=String(exact(n[1],n[0])*n[2]);break;
 case 13:case 21:{const a=exact(n[0],n[1]),b=exact(n[2],n[3]);actual=a===b?'=':a>b?'>':'<';assert.equal(a%10,0);assert.equal(b%10,0);break;}
 case 14:{const lengths=new Set;for(let d=100;d<=999;d++)for(let q=100;q<=999;q++){domain++;lengths.add(String(d*q).length);}actual=one(os.filter(o=>JSON.stringify(nums(o))===JSON.stringify([...lengths])));break;}
 case 15:actual=String(exact(n[0],999));break;
 case 16:{const d=n[0],hits=[];for(let a=1;a<=d*101;a++){domain++;const q=qr(a,d)[0];if(q>=100&&q<=999)hits.push(a);}actual=String(hits[0]);assert.equal(qr(+actual-1,d)[0],99);assert.equal(qr(+actual,d)[1],0);break;}
 case 17:{const[capacity,tonnes]=n,total=1000*tonnes;let trips=0;while(trips*capacity<total){trips++;domain++;}actual=String(trips);assert((trips-1)*capacity<total&&trips*capacity>=total);break;}
 case 18:{const[d,q]=n,all=[];for(let r=0;r<d;r++){domain++;const a=d*q+r;assert.equal(qr(a,d)[0],q);all.push(a);}actual=String(Math.max(...all));assert.equal(qr(+actual+1,d)[0],q+1);break;}
 case 20:actual=String(exact(n[0],n[1]));assert.match(row.statement,/Әр дүкенге неше кітап/);break;
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
// Complete five-digit dividends for12relevant distinct three-digit divisors.
for(const b of[113,173,218,257,312,357,425,462,473,507,630,999])for(let a=10000;a<=99999;a++){
 const t=divisionTrace(a,b),[q,r]=qr(a,b);assert.equal(t.quotient,q);assert.equal(t.remainder,r);assert.equal(t.prefix,prefix(a,b));assert.equal(t.steps.map(s=>s.q).join(''),String(q));for(const s of t.steps){assert.equal(s.partial,s.product+s.remainder);assert.equal(s.product,b*s.q);assert(s.remainder>=0&&s.remainder<b);steps++;}domain++;
}
const guards=[
 [0,p=>p.pairs[1]=[86478,426]],[1,p=>p.dividend=77617],[2,p=>p.divisor=47],
 [3,p=>p.claims[0]=186],[4,p=>p.divisor=250],[5,p=>p.divisors[0]=400],
 [6,p=>p.dividend=76615],[7,p=>p.choices[0]=240],[8,p=>p.choices[3]=119],
 [9,p=>p.total=134785],[10,p=>p.dividend=68016],[11,p=>p.yearDays=366],
 [12,p=>p.newCount=100],[13,p=>p.second=[88830,630]],[14,p=>p.divisorDigits=4],
 [15,p=>p.product=125875],[16,p=>p.divisor=35],[17,p=>p.tonnes=11],
 [18,p=>p.quotient=100],[19,p=>p.dividend=192068],[20,p=>p.books=50961],
 [21,p=>p.second=[69090,203]],
];for(const[i,edit]of guards){const t=structuredClone(rows[i]);edit(t.params);assert.throws(()=>renderEdition(t),`Pedagogical guard${i+1}`);}
console.log(JSON.stringify({printedFixtures:fixtures.length,completeDomainCases:domain,longDivisionDigitSteps:steps,numericSolutionEqualityChains:equalities,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

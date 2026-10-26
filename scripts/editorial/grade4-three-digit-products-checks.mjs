import fs from'node:fs';import assert from'node:assert/strict';import path from'node:path';import{fileURLToPath}from'node:url';
import{renderEdition,verifyEdition,partialProducts}from'./grade4-three-digit-products-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const rows=read('problems/editorial/batches/grade4-three-digit-products-wave38.json').editions;
const fixtures=['3','369900','415360','<','7','2','4326 × 607','4050 × 300','39700','574 км','7176','=','Дана, 2100 теңгеге','26200','904729','8','7','1009701','53600','625 × 320','5 немесе 6','222222','7','533200','>'];
const nums=s=>(s.match(/\d+/g)||[]).map(Number),one=a=>{assert.equal(a.length,1);return a[0];},prod=(a,b)=>Number(BigInt(a)*BigInt(b));
function arithmetic(s){const ts=s.match(/\d+|[×+:−()-]/g),vs=[],ops=[],prec=t=>t==='×'||t===':'?2:1;const apply=()=>{const op=ops.pop(),b=vs.pop(),a=vs.pop();assert(a!==undefined&&b!==undefined);if(op===':'){assert.equal(a%b,0n);vs.push(a/b);}else vs.push(op==='×'?a*b:op==='+'?a+b:a-b);};for(const t of ts){if(/^\d+$/.test(t))vs.push(BigInt(t));else if(t==='(')ops.push(t);else if(t===')'){while(ops.length&&ops.at(-1)!=='(')apply();assert.equal(ops.pop(),'(');}else{while(ops.length&&ops.at(-1)!=='('&&prec(ops.at(-1))>=prec(t))apply();ops.push(t);}}while(ops.length){assert.notEqual(ops.at(-1),'(');apply();}assert.equal(vs.length,1);return vs[0];}
const zerosViaValuations=n=>{let a=n,b=n,twos=0,fives=0;while(a%2===0){twos++;a/=2;}while(b%5===0){fives++;b/=5;}return Math.min(twos,fives);};
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),sources=new Set;for(const file of new Set(read('problems/editorial/batches/grade4-inventory.json').records.map(r=>r.sourceFile)))for(const q of read(file).questions)sources.add(normalize(q.statement));
let domain=0,partialRows=0,equalities=0,tamper=0,missing=0;
for(let i=0;i<rows.length;i++){
 const row=rows[i],n=nums(row.statement),os=row.options||[];let actual;
 switch(i){
 case 0:case 5:actual=String(String(n[1]).replaceAll('0','').length);break;
 case 1:case 2:case 23:actual=String(prod(n[0],n[1]));break;
 case 3:{const a=prod(n[0],n[1]),b=prod(n[2],n[3]);actual=a===b?'=':a>b?'>':'<';assert.equal(n[0],n[2]);assert.equal([...String(n[1])].sort().join(''),[...String(n[3])].sort().join(''));break;}
 case 4:case 16:case 22:actual=String(String(prod(n[0],n[1])).length);break;
 case 6:actual=one(os.filter(o=>String(nums(o)[1]).replaceAll('0','').length===2));break;
 case 7:{const ps=os.map(o=>prod(...nums(o)));actual=os[ps.indexOf(Math.max(...ps))];assert.notEqual(nums(actual)[0],Math.max(...os.map(o=>nums(o)[0])));break;}
 case 8:actual=String(prod(n[0],n[1])-n[2]);assert.match(row.statement,/Қоймада қанша дәптер қалды/);break;
 case 9:assert.equal(prod(n[0],n[1])%1000,0);actual=one(os.filter(o=>nums(o)[0]===prod(n[0],n[1])/1000&&o.endsWith(' км')));break;
 case 10:actual=String(prod(n[0]-n[1],n[2]));break;
 case 11:{const a=prod(n[0],n[1]),b=prod(n[2],n[3]);actual=a===b?'=':a>b?'>':'<';assert.equal(n[0]/n[3],10);assert.equal(n[2]/n[1],10);break;}
 case 12:{const a=prod(n[0],n[1]),b=prod(n[2],n[3]);actual=one(os.filter(o=>o.startsWith(b>a?'Дана':'Айбар')&&nums(o)[0]===Math.abs(a-b)));break;}
 case 13:actual=String(n[2]-prod(n[0],n[1]));assert.match(row.statement,/неше теңге қалады/);break;
 case 14:actual=String(prod(2*n[0]+n[1],n[2]));break;
 case 15:actual=String(prod(n[0],n[1])%10);assert.equal(+os[1],(n[0]%10+n[1]%10)%10);break;
 case 17:{const a=[],b=[];for(let v=100;v<=9999;v++){domain++;if(new Set(String(v)).size!==String(v).length)continue;if(v<1000)a.push(v);else b.push(v);}actual=String(prod(Math.max(...a),Math.min(...b)));break;}
 case 18:{const hits=[];for(let x=1;x<=9999;x++){domain++;if(prod(x,n[1])-prod(x,n[0])===n[2])hits.push(prod(x,n[0]));}actual=String(one(hits));break;}
 case 19:{const counts=os.map(o=>zerosViaValuations(prod(...nums(o))));actual=os[counts.indexOf(Math.max(...counts))];assert.deepEqual(counts,[5,3,3,4]);break;}
 case 20:{const lengths=new Set;for(let a=100;a<=999;a++)for(let b=100;b<=999;b++){domain++;lengths.add(String(prod(a,b)).length);}actual=one(os.filter(o=>JSON.stringify(nums(o))===JSON.stringify([...lengths])));break;}
 case 21:assert.equal(prod(n[0],n[1]),n[2]);assert.equal(n[3],n[0]);actual=String(prod(n[3],n[4]));assert.equal(n[4],n[1]*111);break;
 case 24:{const a=prod(n[0],n[1]);actual=a===n[2]?'=':a>n[2]?'>':'<';assert(prod(n[0],n[1]-1)<n[2]&&a>n[2]);break;}
 default:throw Error('Missing printed case');
 }
 assert.equal(row.answer,actual,`Printed case${i+1}`);assert.equal(row.answer,fixtures[i]);verifyEdition(row);assert(!sources.has(normalize(row.statement)));if(!os.length)assert.match(row.statement,/Жауапқа тек санды жазыңыз/);
 for(const m of row.solution.replace(/(?<=\d):(?=\s)/g,';').matchAll(/[0-9(][0-9\s×+:−()=-]*/g)){
  const text=m[0].trim();if(!text.includes('='))continue;if(/[×+:−-]\s*$/.test(row.solution.slice(0,m.index)))continue;if((text.match(/\(/g)||[]).length!==(text.match(/\)/g)||[]).length)continue;const bits=text.split('=').map(t=>t.trim());assert(bits.every(Boolean));const vs=bits.map(arithmetic);assert(vs.every(v=>v===vs[0]),`Numeric chain ${text}`);equalities++;
 }
 for(const f of['statement','solution','answer','options'])if(row[f]!==undefined){const t=structuredClone(row);t[f]=f==='options'?[...os.slice(1),os[0]]:String(t[f])+' INVALID';assert.throws(()=>verifyEdition(t));tamper++;}
 for(const key of Object.keys(row.params)){const t=structuredClone(row);delete t.params[key];assert.throws(()=>renderEdition(t),`Missing ${key}`);missing++;}
 const ref=row.sourceRefs[0],raw=read(ref.sourceFile).questions.find(q=>q.id===ref.sourceId);assert(raw?.checked&&raw.solution&&raw.sourceAnswer&&!raw.images?.length&&!raw.svg?.length);
}
// Complete three-digit multipliers for fixed individually used multiplicands.
for(const a of[5374,6427,4326,3041,6247,7086,9789,2740,1760,152,1750,109,1650,2947,2150,1023])for(let b=100;b<=999;b++){
 const ps=partialProducts(a,b),expected=prod(a,b);assert.equal(ps.reduce((s,v)=>s+v.value,0),expected);assert.equal(ps.filter(v=>v.value!==0).length,String(b).replaceAll('0','').length);for(const t of ps){assert.equal(t.raw,prod(a,t.digit));assert.equal(t.value,t.raw*t.shift);partialRows++;}domain++;
}
const guards=[
 [0,p=>p.multiplier=206],[1,p=>p.price=2700],[2,p=>p.days=206],[3,p=>p.right=234],
 [4,p=>p.lower=[7000,300]],[5,p=>p.multiplier=319],[6,p=>p.multipliers[0]=207],
 [7,p=>p.pairs[0]=[4500,2050]],[8,p=>p.sent=50000],[9,p=>p.rolls=329],
 [10,p=>p.secondRate=149],[11,p=>p.scale=100],[12,p=>p.choices[1]=['Дана',2100]],
 [13,p=>p.budget=200000],[14,p=>p.days=317],[15,p=>p.choices[1]=7],
 [16,p=>p.extra=1],[17,p=>p.maxDigits=4],[18,p=>p.excess=3601],
 [19,p=>p.pairs[0]=[6250,320]],[20,p=>p.factorDigits=4],[21,p=>p.known=2003],
 [22,p=>p.upper=[6000,300]],[23,p=>p.count=208],[24,p=>p.threshold=999999],
];for(const[i,edit]of guards){const t=structuredClone(rows[i]);edit(t.params);assert.throws(()=>renderEdition(t),`Pedagogical guard${i+1}`);}
console.log(JSON.stringify({printedFixtures:fixtures.length,completeDomainCases:domain,partialRowWitnesses:partialRows,numericSolutionEqualityChains:equalities,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

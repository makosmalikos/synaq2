import fs from'node:fs';import assert from'node:assert/strict';import path from'node:path';import{fileURLToPath}from'node:url';
import{renderEdition,verifyEdition}from'./grade4-partial-products-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const rows=read('problems/editorial/batches/grade4-partial-products-wave34.json').editions;
const fixtures=['21080','46200','561 және 7480','253 × 24','=','Жетпейді: 82 м жетіспейді','87','270000','6900','426','>','647 × 50 + 647 × 2','36504','4 немесе 5','56727','2318800','14628','66','1862','3816','1027','113950','36210','>','23912'];
const nums=s=>(s.match(/\d+/g)||[]).map(Number),one=a=>{assert.equal(a.length,1);return a[0];};
const pairs=s=>[...s.matchAll(/(\d+) × (\d+)/g)].map(m=>[+m[1],+m[2]]);
// Decimal-column multiplication, implemented independently of author parts()/a*b.
function column(a,b){const da=String(a).split('').reverse().map(Number),db=String(b).split('').reverse().map(Number),out=Array(da.length+db.length+1).fill(0);let carries=0;
 for(let j=0;j<db.length;j++)for(let i=0;i<da.length;i++)out[i+j]+=da[i]*db[j];
 for(let i=0;i<out.length-1;i++){if(out[i]>=10)carries++;out[i+1]+=Math.floor(out[i]/10);out[i]%=10;}
 return{answer:Number(out.reverse().join('')),carries};
}
const product=(a,b)=>column(a,b).answer;
function evaluate(s){const ts=s.match(/\d+|[×+:−()-]/g),vs=[],ops=[],priority=t=>t==='×'||t===':'?2:1;
 const apply=()=>{const op=ops.pop(),b=vs.pop(),a=vs.pop();assert(a!==undefined&&b!==undefined);if(op===':'){assert.equal(a%b,0n);vs.push(a/b);}else vs.push(op==='×'?a*b:op==='+'?a+b:a-b);};
 for(const t of ts){if(/^\d+$/.test(t))vs.push(BigInt(t));else if(t==='(')ops.push(t);else if(t===')'){while(ops.length&&ops.at(-1)!=='(')apply();assert.equal(ops.pop(),'(');}else{while(ops.length&&ops.at(-1)!=='('&&priority(ops.at(-1))>=priority(t))apply();ops.push(t);}}
 while(ops.length){assert.notEqual(ops.at(-1),'(');apply();}assert.equal(vs.length,1);return vs[0];
}
let printed=0,domain=0,carryWitnesses=0,equalityChains=0,tamper=0,missing=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],n=nums(r.statement),ps=pairs(r.statement),opts=r.options||[];let actual;
 switch(i){
 case 0:actual=String(product(n[0],Math.floor(n[1]/10)*10));break;
 case 1:case 21:actual=String(product(n[0],n[1]));break;
 case 2:{const[a,b]=ps[0];actual=one(opts.filter(o=>{const[x,y]=nums(o);return x===product(a,b%10)&&y===product(a,Math.floor(b/10)*10);}));break;}
 case 3:actual=one(opts.filter(o=>product(...nums(o))>n[0]));break;
 case 4:case 23:{const v=product(...ps[0]),ref=n.at(-1);actual=v===ref?'=':v>ref?'>':'<';break;}
 case 5:{const[small,wire,total,available]=n;assert.equal(wire%small,0);const gap=product(total,wire/small)-available;actual=one(opts.filter(o=>o.startsWith('Жетпейді:')&&one(nums(o))===gap));break;}
 case 6:actual=String(product(n[0],n[1])-n[2]);break;
 case 7:actual=String(product(n[0],24*n[1]));break;
 case 8:actual=String(n[2]-product(n[0],n[1]));break;
 case 9:actual=one(opts.filter(o=>product(+o,n[1])===n[0]));break;
 case 10:{const lhs=product(...ps[0]),rhs=product(...ps[1]);actual=lhs===rhs?'=':lhs>rhs?'>':'<';assert.match(r.solution,/Ортақ/);break;}
 case 11:actual=one(opts.filter(o=>evaluate(o)===BigInt(product(...ps[0]))));break;
 case 12:case 22:actual=String(product(n[0],n[1]));break;
 case 13:{const lengths=new Set();for(let a=100;a<=999;a++)for(let b=10;b<=99;b++){lengths.add(String(product(a,b)).length);domain++;}assert.deepEqual([...lengths].sort(),[4,5]);actual='4 немесе 5';break;}
 case 14:actual=String(product(...ps[0]));assert.match(r.solution,/100 − 1/);break;
 case 15:{const[rows,front,frontSeats,backSeats,frontPrice,backPrice]=n;actual=String(product(product(front,frontSeats),frontPrice)+product(product(rows-front,backSeats),backPrice));break;}
 case 16:{const[correct,wrong,diff]=n;assert.equal(diff%(wrong-correct),0);actual=String(product(diff/(wrong-correct),correct));break;}
 case 17:{const first=n[0],unit=n[1],target=n[2],hits=[];for(let d=1;d<=9;d++){domain++;if(product(first,d*10+unit)===target)hits.push(d*10+unit);}actual=String(one(hits));break;}
 case 18:{const[faster,slower,diff]=n;assert.equal(diff%(faster-slower),0);actual=String(product(faster+slower,diff/(faster-slower)));break;}
 case 19:{const digits=n,vals=[];for(const a of digits)for(const b of digits)for(const c of digits)for(const d of digits){if(new Set([a,b,c,d]).size!==4)continue;vals.push(product(a*10+b,c*10+d));domain++;}assert.equal(vals.length,24);actual=String(Math.max(...vals));break;}
 case 20:actual=String(product(n[0],n[1]));break;
 case 24:{const[multiplier,knownSecond]=n,base=10*Math.floor(multiplier/10);assert.equal(knownSecond%base,0);actual=String(product(knownSecond/base,multiplier));break;}
 default:throw Error('Unimplemented printed case');
 }
 assert.equal(r.answer,actual,`Printed row${i+1}`);assert.equal(r.answer,fixtures[i]);printed++;verifyEdition(r);if(!opts.length)assert.match(r.statement,/Жауапқа тек санды жазыңыз/);
 for(const m of r.solution.replace(/(?<=\d):(?=\s)/g,';').matchAll(/[0-9(][0-9\s×+:−()=-]*/g)){
  const t=m[0].trim();if(!t.includes('='))continue;
  const bits=t.split('=').map(s=>s.trim());assert(bits.every(Boolean),t);
  const vals=bits.map(evaluate);assert(vals.every(v=>v===vals[0]),`Equalitychain ${t}`);equalityChains++;
 }
 for(const f of['answer','statement','solution','options'])if(r[f]!==undefined){const t=structuredClone(r);t[f]=f==='options'?[...opts.slice(1),opts[0]]:String(t[f])+' INVALID';assert.throws(()=>verifyEdition(t));tamper++;}
 for(const key of Object.keys(r.params)){const t=structuredClone(r);delete t.params[key];assert.throws(()=>renderEdition(t),`Missing ${key}`);missing++;}
 const ref=r.sourceRefs[0],raw=read(ref.sourceFile).questions.find(q=>q.id===ref.sourceId);assert(raw?.checked&&raw.solution&&raw.sourceAnswer&&!raw.images?.length&&!raw.svg?.length);const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(normalize(raw.statement),normalize(r.statement));
}
// All900×90 factor pairs validate correct tens shift and digit bounds via actual decimal columns.
for(let a=100;a<=999;a++)for(let b=10;b<=99;b++){
 const p=column(a,b);assert.equal(p.answer,product(a,b%10)+product(a,Math.floor(b/10))*10);assert.equal(p.answer,a*b);if(p.carries)carryWitnesses++;domain++;
}
// Efficient99 rule independently agrees with decimalcolumns throughout the three-digit domain.
for(let a=100;a<=999;a++){assert.equal(product(a,99),a*100-a);domain++;}
const guards=[
 [2,p=>p.choices[3]=[561,7480]],
 [5,p=>p.available=2600],
 [7,p=>p.hourly=3760],
 [10,p=>p.common=0],
 [12,p=>p.quotient=1414],
 [13,p=>p.firstDigits=4],
 [14,p=>p.multiplier=98],
 [15,p=>p.frontRows=p.rows],
 [16,p=>p.wrong=65],
 [17,p=>p.product=9571],
 [19,p=>p.digits=[2,2,5,7]],
 [20,p=>p.speed=76],
 [24,p=>p.secondPartial=21351],
];
for(const[i,edit]of guards){const t=structuredClone(rows[i]);edit(t.params);assert.throws(()=>renderEdition(t),`Pedagogicalguard${i+1}`);}
console.log(JSON.stringify({fixtures:fixtures.length,printed,completeDomainCases:domain,decimalCarryWitnesses:carryWitnesses,numericSolutionEqualityChains:equalityChains,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

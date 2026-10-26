import fs from'node:fs';import assert from'node:assert/strict';import path from'node:path';import{fileURLToPath}from'node:url';
import{renderEdition,verifyEdition}from'./grade4-remainders-long-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const rows=read('problems/editorial/batches/grade4-remainders-long-wave36.json').editions;
const fixtures=['72','23','647 : 73 = 7, қалдық 136','124, қалдық 47','34','59, қалдық 9','885','24 × 32 + 7','17','833 : 49','30','56','47, қалдық 8','56','1074','15','288','42, қалдық 24','1019','5676 : 43','17','3','70, қалдық 53','2208','3','121','1271','43','106','19','76','991','946','14','137, қалдық 41','862','873 : 31','1075','545','57','2'];
const nums=s=>(s.match(/\d+/g)||[]).map(Number),one=a=>{assert.equal(a.length,1);return a[0];},div=(a,b)=>[Number(BigInt(a)/BigInt(b)),Number(BigInt(a)%BigInt(b))];
function arithmetic(s){const ts=s.match(/\d+|[×+:−()-]/g),vs=[],ops=[],prec=t=>t==='×'||t===':'?2:1;const apply=()=>{const op=ops.pop(),b=vs.pop(),a=vs.pop();assert(a!==undefined&&b!==undefined);if(op===':'){assert.equal(a%b,0n);vs.push(a/b);}else vs.push(op==='×'?a*b:op==='+'?a+b:a-b);};for(const t of ts){if(/^\d+$/.test(t))vs.push(BigInt(t));else if(t==='(')ops.push(t);else if(t===')'){while(ops.length&&ops.at(-1)!=='(')apply();assert.equal(ops.pop(),'(');}else{while(ops.length&&ops.at(-1)!=='('&&prec(ops.at(-1))>=prec(t))apply();ops.push(t);}}while(ops.length){assert.notEqual(ops.at(-1),'(');apply();}assert.equal(vs.length,1);return vs[0];}
let printed=0,domain=0,equalities=0,tamper=0,missing=0;
const normalized=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim(),sourceStatements=new Set;for(const file of new Set(read('problems/editorial/batches/grade4-inventory.json').records.map(r=>r.sourceFile)))for(const q of read(file).questions)sourceStatements.add(normalized(q.statement));
for(let i=0;i<rows.length;i++){
 const row=rows[i],n=nums(row.statement),opts=row.options||[],os=opts.map(nums);let actual;
 switch(i){
 case 0:actual=String(n[0]-1);break;
 case 1:actual=one(opts.filter(o=>+o>=n[0]));assert(opts.includes('0'));break;
 case 2:actual=one(opts.filter(o=>{const[a,b,q,r]=nums(o);assert.equal(a,b*q+r);return r>=b;}));break;
 case 3:case 5:case 22:case 34:{const[q,r]=div(n[0],n[1]);actual=one(opts.filter(o=>{const[x,y]=nums(o);return x===q&&y===r;}));if(i===22){assert.equal(q%10,0);assert.match(row.solution,/бірліктеріне 0/);}break;}
 case 4:actual=String(div(n[0],n[1])[0]);break;
 case 6:case 35:actual=String(n[0]*n[1]+n[2]);break;
 case 7:actual=one(opts.filter(o=>arithmetic(o)===BigInt(n[0])));break;
 case 8:actual=String(div(n[0],n[1])[1]);assert(div(n[0],n[1])[0]<10);break;
 case 9:case 36:actual=one(opts.filter(o=>{const[a,b]=nums(o);return i===9?a%b===0:a%b!==0;}));break;
 case 10:actual=one(opts.filter(o=>+o<n[0]));break;
 case 11:{const rs=os.map(([d])=>n[0]%d),qs=os.map(([d])=>Math.floor(n[0]/d));assert.equal(new Set(qs).size,1);actual=opts[rs.indexOf(Math.max(...rs))];break;}
 case 12:{const a=n[0]*n[1]+n[2],[q,r]=div(a,n[3]);actual=one(opts.filter(o=>{const[x,y]=nums(o);return x===q&&y===r;}));break;}
 case 13:{const[q,r]=div(n[0],n[1]);actual=String(q+r);break;}
 case 14:actual=String(n[0]*n[1]+n[0]-1);break;
 case 15:actual=String((100*n[0]+n[1])%n[2]);break;
 case 16:case 38:actual=one(opts.filter(o=>+o%n[0]===n[1]));break;
 case 17:{const[q,r]=div(n[0],n[1]);actual=one(opts.filter(o=>{const[x,y]=nums(o);return x===q&&y===r;}));break;}
 case 18:{const hits=[];for(let a=1;a<(n[1]+2)*n[0];a++){domain++;if(Math.floor(a/n[0])===n[1])hits.push(a);}actual=String(Math.max(...hits));break;}
 case 19:actual=one(opts.filter(o=>{const[a,b]=nums(o),q=Math.floor(a/b);return q>=100&&q<1000;}));break;
 case 20:actual=String(n[0]%n[1]);assert.equal(Math.floor(n[0]/n[1]),21);assert.match(row.statement,/неше марка артылып қалады/);break;
 case 21:{const total=n.slice(0,5).reduce((a,b)=>a+b,0),seats=n[5];let buses=0;while(buses*seats<total){buses++;domain++;}actual=String(buses);assert((buses-1)*seats<total);break;}
 case 23:{const hits=[];for(let a=1;a<n[0]*n[0]+n[0];a++){domain++;const[q,r]=div(a,n[0]);if(q===r)hits.push(a);}actual=String(Math.max(...hits));break;}
 case 24:case 40:{const results=new Set;for(let k=0;k<1000;k++){results.add((n[0]*k+n[1])%n[2]);domain++;}actual=String(one([...results]));break;}
 case 25:{const hits=[];for(let a=1;a<=n[0]*n[2];a++){domain++;if(a%n[0]===n[1]&&a%n[2]===n[3])hits.push(a);}actual=String(hits[0]);assert(hits.length);break;}
 case 26:{const hits=[];for(let a=n[0]+1;a<=n[1]*n[2]+n[0];a++){domain++;if(a%n[1]===n[0]&&a%n[2]===n[0])hits.push(a);}actual=String(hits[0]);assert.equal(n[0]%n[1],n[0]);break;}
 case 27:actual=String(9999%n[0]);break;
 case 28:{const hits=[];for(let a=100;a<=999;a++){domain++;if(a%n[0]===n[1])hits.push(a);}actual=String(hits[0]);break;}
 case 29:{const results=new Set;for(let k=0;k<1000;k++){results.add(2*(n[0]*k+n[1])%n[2]);domain++;}actual=String(one([...results]));break;}
 case 30:case 39:{const hits=[];for(let d=10;d<=99;d++){domain++;const[q,r]=div(n[0],d);if(q===n[1]&&r===n[2])hits.push(d);}actual=String(one(hits));break;}
 case 31:{const hits=[];for(let a=100;a<=999;a++)for(let d=10;d<=99;d++){domain++;const[q,r]=div(a,d);if(q===d&&r===d-1)hits.push(a);}actual=String(Math.max(...hits));break;}
 case 32:{const hits=[];for(let a=1;a<=9999;a++)for(let d=10;d<=99;d++){domain++;const[q,r]=div(a,d);if(q===n[0]&&r>0&&d+r===n[1])hits.push(a);}actual=String(Math.max(...hits));assert(!hits.includes(960));break;}
 case 33:{let count=0;for(let a=100;a<=999;a++){domain++;const[q,r]=div(a,n[0]);if(q===r)count++;}actual=String(count);break;}
 case 37:actual=String(n[0]*n[1]+n[0]-n[2]);break;
 default:throw Error('Missing printed case');
 }
 assert.equal(row.answer,actual,`Printed case${i+1}`);assert.equal(row.answer,fixtures[i]);printed++;verifyEdition(row);if(!opts.length)assert.match(row.statement,/Жауапқа тек санды жазыңыз/);
 assert(!sourceStatements.has(normalized(row.statement)),'No exact saved-source statement');
 for(const m of row.solution.replace(/(?<=\d):(?=\s)/g,';').matchAll(/[0-9(][0-9\s×+:−()=-]*/g)){
  const text=m[0].trim();if(!text.includes('='))continue;if(/[×+:−-]\s*$/.test(row.solution.slice(0,m.index)))continue;if((text.match(/\(/g)||[]).length!==(text.match(/\)/g)||[]).length)continue;const bits=text.split('=').map(t=>t.trim());assert(bits.every(Boolean));const values=bits.map(arithmetic);assert(values.every(v=>v===values[0]),`Numeric chain ${text}`);equalities++;
 }
 for(const f of['answer','statement','solution','options'])if(row[f]!==undefined){const t=structuredClone(row);t[f]=f==='options'?[...opts.slice(1),opts[0]]:String(t[f])+' INVALID';assert.throws(()=>verifyEdition(t));tamper++;}
 for(const key of Object.keys(row.params)){const t=structuredClone(row);delete t.params[key];assert.throws(()=>renderEdition(t),`Missing ${key}`);missing++;}
 const ref=row.sourceRefs[0],raw=read(ref.sourceFile).questions.find(q=>q.id===ref.sourceId);assert(raw?.checked&&raw.solution&&raw.sourceAnswer&&!raw.images?.length&&!raw.svg?.length);
}
const guards=[
 [0,p=>p.divisor=9],[1,p=>p.choices=[23,24,25,26]],[2,p=>p.divisions[1][3]=19],
 [3,p=>p.dividend=659],[7,p=>p.remainder=8],[8,p=>p.divisor=83],[11,p=>p.divisors[0]=73],
 [12,p=>p.newDivisor=22],[15,p=>p.centimetres=100],[16,p=>p.choices[0]=319],[17,p=>p.items=1204],
 [22,p=>p.dividend=4597],[24,p=>p.newDivisor=8],[25,p=>p.remainders[1]=8],
 [26,p=>p.remainder=28],[27,p=>p.divisor=99],[28,p=>p.remainder=39],[29,p=>p.factor=3],
 [30,p=>p.remainder=30],[31,p=>p.dividendDigits=4],[32,p=>p.divisorRemainderSum=1],
 [37,p=>p.gap=57],[40,p=>p.newDivisor=16]
];for(const[i,edit]of guards){const t=structuredClone(rows[i]);edit(t.params);assert.throws(()=>renderEdition(t),`Pedagogical guard${i+1}`);}
console.log(JSON.stringify({fixtures:fixtures.length,printed,completeDomainCases:domain,numericSolutionEqualityChains:equalities,tamperRejected:tamper,missingParametersRejected:missing,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

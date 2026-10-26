import fs from'node:fs';
import assert from'node:assert/strict';
import{fileURLToPath}from'node:url';
import path from'node:path';
import{renderEdition,verifyEdition,trailingZeros}from'./grade4-writtenzeros-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const rows=read('problems/editorial/batches/grade4-writtenzeros-wave32.json').editions;
const fixtures=['=','420 × 400','460 × 30 = 13800','60000','438 санының соңына екі нөл тіркеу','62 × 4','16040000','7','31200','25800000','255000','<','550 × 300','248270','748000','1 және 6','860','6','95400','810','A = B = C','430','104400','3','>','352500','3'];
assert.equal(rows.length,27);const digits=s=>(String(s).match(/\d+/g)||[]).map(Number),bi=n=>BigInt(n);
const mul=(a,b)=>Number(bi(a)*bi(b));
const sign=(a,b)=>a===b?'=':a>b?'>':'<';
function val(n,p){let v=bi(n),c=0;while(v%bi(p)===0n){v/=bi(p);c++;}return c;}
const zeros=n=>Math.min(val(n,2),val(n,5));
const products=s=>[...s.matchAll(/(\d+) × (\d+)/g)].map(m=>[+m[1],+m[2]]);
let printed=0,fullIntegerCases=0,equalities=0,tamperRejected=0,missingRejected=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],ns=digits(r.statement),ps=products(r.statement),opts=r.options||[];let calculated;
 switch(i){
 case 0:case 11:case 24:calculated=sign(mul(...ps[0]),mul(...ps[1]));break;
 case 1:{const target=ns[0],hits=opts.filter(o=>mul(...digits(o))===target);assert.equal(hits.length,1);calculated=hits[0];break;}
 case 2:{const hits=opts.filter(o=>{const[a,b,c]=digits(o);return mul(a,b)===c;});assert.equal(hits.length,1);calculated=hits[0];assert.match(r.statement,/әдейі қате/);break;}
 case 3:calculated=String(mul(ns[0],ns[1]));break;
 case 4:{const base=mul(...ps[1]),target=mul(...ps[0]);const hits=opts.filter(o=>o.includes('екі нөл')?base*100===target:o.includes('бір нөл')?base*10===target:o.includes('үш нөл')?base*1000===target:mul(...digits(o))===target);assert.equal(hits.length,1);calculated=hits[0];break;}
 case 5:{const stripped=ps[0].map(n=>n/10**zeros(n));calculated=stripped.join(' × ');assert(opts.includes(calculated));break;}
 case 6:case 25:calculated=String(mul(ns[0],ns[1])+mul(ns[2],ns[3]));break;
 case 7:calculated=String(String(mul(...ps[0])).length);break;
 case 8:calculated=String(mul(mul(ns[0],ns[1]),ns[2]));break;
 case 9:assert.equal(mul(...ps[0]),ns[2]);calculated=String(mul(...ps[1]));break;
 case 10:calculated=String(ns[2]-mul(ns[0],ns[1]));break;
 case 12:{const vals=opts.map(o=>mul(...digits(o)));calculated=opts[vals.indexOf(Math.max(...vals))];break;}
 case 13:calculated=String(ns[0]+mul(ns[0],ns[1]));break;
 case 14:calculated=String(mul(ns[0],mul(ns[1],ns[2])+ns[3]));break;
 case 15:{const suffix=+r.statement.match(/□(\d+)/)[1],mult=+r.statement.match(/× (\d+)/)[1],target=+r.statement.match(/дәл (\d+) нөл/)[1],ds=[];for(let d=1;d<=9;d++){fullIntegerCases++;if(zeros(mul(d*1000+suffix,mult))===target)ds.push(d);}assert.equal(ds.length,2);calculated=ds.join(' және ');break;}
 case 16:{const[mult,threshold]=ns.slice(-2),valid=[];for(let n=100;n<1000;n+=10){fullIntegerCases++;if(mul(n,mult)>threshold)valid.push(n);}calculated=String(Math.min(...valid));break;}
 case 17:case 26:calculated=String(zeros(mul(...ps[0])));break;
 case 18:{const mult=ns.at(-1),possible=new Set();for(let n=1000;n<=9999;n++){fullIntegerCases++;if(n%10===0)possible.add(mul(n,mult));}const bad=opts.filter(o=>!possible.has(+o));assert.equal(bad.length,1);calculated=bad[0];break;}
 case 19:calculated=String(mul(mul(ns[0],ns[1]),ns[2])/1000);break;
 case 20:assert(ps.every(t=>mul(...t)===mul(...ps[0])));calculated='A = B = C';break;
 case 21:calculated=String((ns[2]-ns[1])/ns[0]);break;
 case 22:calculated=String(mul(...ps[0])-mul(...ps[1]));break;
 case 23:calculated=String(zeros(ps[0][0])+zeros(ps[0][1]));break;
 default:throw Error('Unreviewed printed case');
 }
 assert.equal(calculated,r.answer,`Printed-givens oracle row${i+1}`);assert.equal(r.answer,fixtures[i]);printed++;verifyEdition(r);
 if(!opts.length)assert.match(r.statement,/Жауапқа тек санды жазыңыз/);
 // True numeric equality chains only. Deliberate false MCQ equalities are checked above.
 for(const m of r.solution.matchAll(/(\d+)\s*([×+:−])\s*(\d+)\s*=\s*(\d+)/g)){
  if(/[×+:−]\s*$/.test(r.solution.slice(0,m.index)))continue;
  const[,aa,op,bb,cc]=m,a=bi(aa),b=bi(bb),c=bi(cc);assert.equal(op==='×'?a*b:op==='+'?a+b:op==='−'?a-b:a/b,c,`solution equation ${m[0]}`);if(op===':')assert.equal(a%b,0n);equalities++;
 }
 for(const field of['answer','statement','solution',...(opts.length?['options']:[])]){const t=structuredClone(r);t[field]=field==='options'?[...opts.slice(1),opts[0]]:String(t[field])+' INVALID';assert.throws(()=>verifyEdition(t));tamperRejected++;}
 for(const key of Object.keys(r.params)){const t=structuredClone(r);delete t.params[key];assert.throws(()=>renderEdition(t),`Missing ${key}`);missingRejected++;}
 const ref=r.sourceRefs[0],source=read(ref.sourceFile).questions.find(q=>q.id===ref.sourceId);assert(source&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length);
 const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(normalize(source.statement),normalize(r.statement));
}
// Independent prime-factor valuation vs author decimal trailing-zero loop over a broad finite domain.
for(let a=1;a<=120;a++)for(let b=1;b<=120;b++)for(let za=0;za<4;za++)for(let zb=0;zb<4;zb++){
 const n=mul(a*10**za,b*10**zb);assert.equal(trailingZeros(n),zeros(n));assert.equal(zeros(n),Math.min(val(a,2)+val(b,2),val(a,5)+val(b,5))+za+zb);fullIntegerCases++;
}
const guards=[
 [3,p=>p.speed=760], // destroys two extra zeros from the coefficient product
 [7,p=>p.factors[0]=6760], // loses two coefficient zeros
 [13,p=>p.first=4170], // loses internal-zero place
 [15,p=>p.suffix=350], // loses the authored four-digit two-branch family
 [17,p=>p.factors[0]=7600], // loses25×4 grouping
 [18,p=>p.choices[0]=95401], // creates a second impossible option
 [24,p=>p.first[0]=4160], // loses internal zero
 [26,p=>p.factors[0]=7180], // loses internal zero
];
for(const[i,edit]of guards){const t=structuredClone(rows[i]);edit(t.params);assert.throws(()=>renderEdition(t));}
console.log(JSON.stringify({fixtures:fixtures.length,printed,fullIntegerCases,numericSolutionEqualities:equalities,tamperRejected,missingParametersRejected:missingRejected,pedagogicalGuardsRejected:guards.length,sourceStatementMatches:0,status:'author_checks_passed_not_independent_review'}));

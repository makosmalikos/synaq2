/** Author checks, independently parsed printed arithmetic and full finite digit /
 * assignment domains. This is not an external editorial review signature. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {renderEdition,verifyEdition} from './grade4-oral-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../../problems/editorial/batches/grade4-oral-wave20.json',import.meta.url))).editions;
const keys=['21232','6 000 : 2 + 800 : 2 + 40 : 2 + 2 : 2','221102','2396','400 · 6 − 6','4312','82000','32 012 · 3 = 96 063','210','>','5000','86 428 : 2','21 105','444 444 444','3210','(56 000 + 8 000 + 800) : 4','99 999','23413','2 397','1 554'];
const num=s=>Number(s.replaceAll(' ','')),take=(re,s)=>{const m=re.exec(s);assert(m,[re,s]);return m;};
function evaluate(text){
 const plain=text.replace(/(?<=\d) (?=\d)/g,'');assert(/^[\d ()+−·:]+$/.test(plain),text);const tokens=plain.match(/\d+|[()+−·:]/g),clean=plain.replaceAll(' ','');assert.equal(tokens.join(''),clean);let i=0;
 function atom(){if(tokens[i]==='('){i++;const n=add();assert.equal(tokens[i++],')');return n;}const s=tokens[i++];assert(/^\d+$/.test(s));return Number(s);}
 function term(){let a=atom();while(['·',':'].includes(tokens[i])){const op=tokens[i++],b=atom();assert(b!==0);a=op==='·'?a*b:a/b;}return a;}
 function add(){let a=term();while(['+','−'].includes(tokens[i])){const op=tokens[i++],b=term();a=op==='+'?a+b:a-b;}return a;}
 const n=add();assert.equal(i,tokens.length);assert(Number.isFinite(n));return n;
}
function shape(n){return {length:String(n).length,zeros:[...String(n)].map((d,i,s)=>d==='0'?s.length-i-1:-1).filter(i=>i>=0)};}
let domains=0,digitSourceStructures=0,fullAssignmentCases=0,fullDigitCases=0;
assert.equal(rows.length,20);
for(let i=0;i<rows.length;i++){
 const r=rows[i],s=r.statement,k=r.modelId.replace('grade4-oral-','');assert.equal(r.answer,keys[i]);assert.equal(verifyEdition(r).answer,keys[i]);
 switch(k){
 case 'digitwise-division':{const m=take(/есептеңіз: (\d[\d ]*) : (\d+)/,s),n=num(m[1]),d=+m[2];assert([...String(n)].every(c=>+c%d===0));assert.equal(n/d,+r.answer);const ref=r.sourceRefs[0],source=JSON.parse(fs.readFileSync(new URL('../../'+ref.sourceFile,import.meta.url))).questions.find(q=>q.id===ref.sourceId),old=take(/(\d[\d ]*) : (\d+)/,source.statement.replaceAll('$','').replace(/\\,/g,''));assert.deepEqual(shape(n),shape(num(old[1])));assert.deepEqual(shape(n/d),shape(num(old[1])/+old[2]));digitSourceStructures++;break;}
 case 'distributed-division-choice':{const m=take(/^(\d[\d ]*) : (\d+)/,s),n=num(m[1]),d=+m[2],valid=r.options.filter(o=>evaluate(o)===n/d);assert.deepEqual(valid,[r.answer]);assert.equal(r.answer.split(' + ').length,4);break;}
 case 'round-minus-one-product':{const m=take(/есептеңіз: (\d+) · (\d+)/,s),n=+m[1],factor=+m[2];assert.equal(n%100,99);assert(factor>=2&&factor<=9);assert.equal(num(r.answer),(n+1)*factor-factor);break;}
 case 'round-minus-one-expression':{const m=take(/^(\d+) · (\d+)/,s),n=+m[1],factor=+m[2];assert.equal(n%100,99);assert.deepEqual(r.options.filter(o=>evaluate(o)===n*factor),[r.answer]);break;}
 case 'precedence-round-difference':{const expression=take(/есептеңіз: (.+?)\./,s)[1];assert.equal(evaluate(expression),+r.answer);const [a,b,d]=take(/^(\d[\d ]*) − (\d[\d ]*) : (\d+)$/,expression).slice(1).map(num);assert.notEqual((a-b)/d,+r.answer);break;}
 case 'detect-swapped-place-error':{const truths=r.options.map(o=>{const [a,b]=o.split(' = ');return evaluate(a)===num(b);});assert.equal(truths.filter(v=>!v).length,1);const bad=r.options[truths.indexOf(false)];assert.equal(bad,r.answer);assert.equal(r.intentionalIncorrectExample,true);assert(s.includes('әдейі'));const [a,b]=bad.split(' = '),actual=String(evaluate(a)),given=String(num(b));assert.equal(given,actual.slice(0,-2)+actual.at(-1)+actual.at(-2));break;}
 case 'scaled-divisor':{const m=take(/^(\d+) : (\d+) = (\d+) екені[\s\S]*?пайдаланып, (\d+) : (\d+) мәнін/,s),[n,d,q,n2,d2]=m.slice(1).map(Number);assert.equal(n/d,q);assert.equal(n,n2);assert.equal(n/d2,num(r.answer));assert.equal(q/(d2/d),num(r.answer));break;}
 case 'near-round-comparison':{const m=take(/салыстырыңыз: (.+?) □ (.+?)\./,s),a=evaluate(m[1]),b=evaluate(m[2]);assert.equal(a>b?'>':a<b?'<':'=',r.answer);const [n,factor]=m[1].split(' · ').map(num);assert.equal(n%1000,999);assert.equal(a,(n+1)*factor-factor);break;}
 case 'sum-factor-unknown':{const m=take(/\(a \+ b\) · (\d+) = (\d[\d ]*) және a = (\d[\d ]*)\./,s),[factor,total,a]=m.slice(1).map(num),b=+r.answer;assert.equal((a+b)*factor,total);assert(b>0);break;}
 case 'ordered-person-assignment':{const list=take(/есептеді: (.+?)\. Әркімде/,s)[1].split('; '),values=list.map(evaluate),all=[];for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++)if(new Set([a,b,c]).size===3){fullAssignmentCases++;if(values[a]!==Math.min(...values)&&values[b]>values[a])all.push([a,b,c]);}assert.equal(all.length,1);assert.equal(list[all[0][2]],r.answer);break;}
 case 'multiply-by-nine':{const m=take(/пайдаланып, (\d[\d ]*) · 9/,s),n=num(m[1]);assert.equal(n*10-n,num(r.answer));assert.equal(String(n*9).at(-2),'0');break;}
 case 'known-large-product':case 'known-small-product':{const m=take(/^(\d[\d ]*) · (\d+) = (\d[\d ]*) екені[\s\S]*?пайдаланып, (\d[\d ]*) · (\d+) мәнін/,s),[n,d,product,n2,next]=m.slice(1).map(num);assert.equal(n*d,product);assert.equal(n,n2);assert.equal(product*(next/d),num(r.answer));assert.equal(next%d,0);assert(next/d>=2);break;}
 case 'maximum-distinct-divisible-digits':{const m=take(/әртүрлі (\d+) таңбалы санның әр цифры (\d+) санына/,s),[length,divisor]=m.slice(1).map(Number),good=[];for(let n=10**(length-1);n<10**length;n++){fullDigitCases++;const chars=[...String(n)];if(new Set(chars).size===length&&chars.every(c=>+c%divisor===0))good.push(n);}const largest=Math.max(...good);assert.equal(largest,9630);assert.equal(good.length,18);assert.equal(largest/divisor,+r.answer);assert(String(largest).includes('0'));break;}
 case 'parentheses-target':{const target=num(take(/мәні (\d[\d ]*) болсын/,s)[1]);assert.deepEqual(r.options.filter(o=>evaluate(o)===target),[r.answer]);assert.notEqual(evaluate(r.options[2]),target);break;}
 case 'largest-repdigit-quotient':{const m=take(/бірдей (\d+) таңбалы санды (\d+) санына/,s),[length,divisor]=m.slice(1).map(Number),good=[];for(let n=10**(length-1);n<10**length;n++){fullDigitCases++;const quotient=n/divisor;if(new Set(String(n)).size===1&&Number.isInteger(quotient)&&String(quotient).length===length&&new Set(String(quotient)).size===1)good.push(n);}assert.deepEqual(good,[33333,66666,99999]);assert.equal(Math.max(...good),num(r.answer));break;}
 default:assert.fail(k);
 }domains++;
}
let rejected=0,invalid=0;
for(const row of rows){for(const key of ['answer','statement','solution','options']){if(key==='options'&&!row.options)continue;const bad=structuredClone(row);bad[key]=key==='options'?[...row.options].reverse():row[key]+' altered';assert.throws(()=>verifyEdition(bad));rejected++;}const key=Object.keys(row.params).find(k=>typeof row.params[k]==='number');if(key){const changed=structuredClone(row);changed.params[key]++;assert.throws(()=>verifyEdition(changed));rejected++;const bad=structuredClone(row);bad.params[key]=-1;assert.throws(()=>{Object.assign(bad,renderEdition(bad));verifyEdition(bad);});invalid++;}}
const zero=structuredClone(rows[2]);zero.params.number=884448;assert.throws(()=>renderEdition(zero));invalid++;
console.log(JSON.stringify({fixtures:20,printedGivenDomains:domains,preservedSourceDigitZeroStructures:digitSourceStructures,fullAssignmentCases,fullDigitCases,tamperRejected:rejected,invalidParametersRejected:invalid,status:'passed'}));

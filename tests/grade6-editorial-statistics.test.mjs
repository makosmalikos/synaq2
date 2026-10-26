import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-statistics-models.mjs';
import {mathFragments} from '../frontend/src/mathPresentation.js';
const rows=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-statistics.json',import.meta.url))).editions;
const keys=['72','4','7,5','14','37','(23/40)','5','3; 7; 11','63','72','-3','18','49','(5/8)','25','Екі мода: 3 және 8','3,4','Ең үлкен мәннен ең кіші мәнді азайту','13','18','10','44','23','6','16'];
const numeric=s=>Number(s.replace(',','.'));
test('all25 distinct handtargets, Standard closed scope, exactly source8.1/8.2 nonvisual coverage',()=>{
 assert.equal(rows.length,25);rows.forEach((r,i)=>{assert.equal(r.answer,keys[i]);assert.equal(verifyEdition(r).answer,keys[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'draft');assert.equal(r.grade,6);assert.equal(r.topic,'stats');if(r.options)assert.equal(r.options.filter(o=>o===keys[i]).length,1);});
 for(const chapter of ['8-1','8-2']){const source=JSON.parse(fs.readFileSync(new URL(`../problems/sources/zerek/courses/6-math-${chapter}-level1.json`,import.meta.url)));assert.equal(source.grade,6);const old=source.questions.filter(q=>!q.images?.length&&!q.svg?.length),newRows=rows.filter(r=>r.sourceRefs[0].sourceFile.includes(`-${chapter}-`));assert.deepEqual(newRows.map(r=>r.sourceRefs[0].sourceId).sort(),old.map(q=>q.id).sort());for(const r of newRows){const q=old.find(q=>q.id===r.sourceRefs[0].sourceId);assert.equal(q.checked,true);assert.notEqual(r.statement.normalize('NFKC'),q.statement.normalize('NFKC'));}}
});
test('actual unequal time speeds: weighted mass transport, second distance computed before average',()=>{
 assert.equal((132+228)/(2+3),numeric(rows[0].answer));assert.equal((132/2+228/3)/2,71);assert.notEqual(numeric(rows[0].answer),71);
 assert.equal((108+3*60)/4,numeric(rows[9].answer));assert.equal((108+60)/2,84);assert.deepEqual(rows[9].options,['84','96','144','72']);
 for(let a=1;a<=15;a++)for(let b=1;b<=15;b++)for(let v=1;v<=15;v++){const q=renderEdition({...rows[0],params:{times:[a,b],distances:[a*v,b*v]}});assert.equal(numeric(q.answer),v);}
});
test('mean denominator includes zero observations, inverse mean roles and every group count',()=>{
 assert.equal((4+0+8+0+13)/5,numeric(rows[6].answer));assert.equal(rows[6].options[0],'(25/3)');assert.equal(2*31-25,numeric(rows[4].answer));assert.equal(9*7,numeric(rows[8].answer));
 assert.deepEqual(rows[7].options.map(o=>{const v=o.split('; ').map(Number);return v.reduce((s,x)=>s+x,0)===7*v.length;}),[true,false,false,false]);
 for(let mean=1;mean<=40;mean++)for(let known=1;known<2*mean;known++){const q=renderEdition({...rows[4],params:{mean,known}});assert.equal((known+Number(q.answer))/2,mean);}
 assert.equal((-9+3-6+0)/4,numeric(rows[10].answer));assert.equal((-9-6)/2,numeric(rows[10].options[3]));assert.equal(rows[10].options[3],'-7,5');
 assert.equal((15+19+14+18+21+16+23)/7,18);assert.equal((35+50+40+65+55)/5,49);
});
test('fraction mean and range keep explicit LCD conversions before division or subtraction',()=>{
 assert.equal((2/5+3/4)/2,23/40);assert.deepEqual(rows[5].options,['(23/20)','(23/40)','(5/9)','(7/20)']);assert.match(rows[5].solution,/\(2\/5\) = \(8\/20\)/);assert.match(rows[5].solution,/\(3\/4\) = \(15\/20\)/);assert.match(rows[5].solution,/÷ 2 = \(23\/40\)/);
 assert.equal(7/8-1/4,5/8);assert.deepEqual(rows[13].options,['(1/24)','(7/12)','(5/8)','(9/8)']);assert.match(rows[13].solution,/\(5\/6\) = \(20\/24\)/);assert.match(rows[13].solution,/\(15\/24\) = \(5\/8\)/);
});
test('odd/even medians sort all observations, preserve duplicate multiplicity, need not be observed',()=>{
 for(const [i,values,den] of [[14,[28,16,35,22,31,13,25],1],[16,[16,32,24,58,36,44],10],[20,[10,4,15,7,12],1],[24,[11,19,8,23,15,17],1]]){const sorted=values.slice().sort((a,b)=>a-b),n=sorted.length,median=n%2?sorted[(n-1)/2]/den:(sorted[n/2-1]+sorted[n/2])/(2*den);assert.equal(median,numeric(rows[i].answer));for(let shift=0;shift<n;shift++){const rotated=[...values.slice(shift),...values.slice(0,shift)];const ordered=rotated.sort((a,b)=>a-b);assert.deepEqual(ordered,sorted);}}
 assert.equal((24+58)/20,numeric(rows[16].options[3]));assert.equal((32+36)/20,3.4);assert.equal((10+4+15+7+12)/5,numeric(rows[20].options[2]));assert.ok(![11,19,8,23,15,17].includes(16));
 for(let middle=5;middle<=50;middle++){const v=[middle-2,middle+4,middle-3,middle+6,middle-1,middle+1],q=renderEdition({...rows[24],params:{values:v}});assert.equal(numeric(q.answer),middle);}
});
test('modes are actual values with maximum frequency; all ties retained, order irrelevant',()=>{
 const count=a=>{const m=new Map();for(const v of a)m.set(v,(m.get(v)||0)+1);const highest=Math.max(...m.values());return{highest,modes:[...m].filter(([,n])=>n===highest).map(([v])=>v).sort((a,b)=>a-b)};};
 assert.deepEqual(count([8,3,11,3,8,5]),{highest:2,modes:[3,8]});assert.equal(rows[15].options[3],keys[15]);assert.deepEqual(count([42,44,43,44,45,44,42,46,43]),{highest:3,modes:[44]});assert.deepEqual(count([4,6,9,6,1,6,9]),{highest:3,modes:[6]});assert.deepEqual(rows[23].options,['6','3','9','1']);
 assert.doesNotMatch(rows[15].solution,/бір реттен/);for(let a=1;a<=20;a++)for(let b=a+1;b<=25;b++){const q=renderEdition({...rows[15],params:{values:[b,a,100,a,b,99]}});assert.equal(q.answer,`Екі мода: ${a} және ${b}`);}
});
test('range is nonnegative max minus min including signed values and independent of translation',()=>{
 assert.equal(5-(-8),Number(rows[18].answer));assert.deepEqual(rows[18].options,['13','-3','3','11']);assert.equal(24-6,Number(rows[19].answer));assert.equal(159-136,Number(rows[22].answer));
 for(let shift=-100;shift<=100;shift++){const values=[15,8,24,6,18].map(v=>v+shift);assert.equal(Number(renderEdition({...rows[19],params:{values}}).answer),18);}
});
test('every canonical fraction becomes structural native fraction without literal slash/TeX',()=>{
 let count=0;function walk(nodes){for(const n of nodes){if(n.type==='fraction'){count++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){count++;walk([n.fraction]);}else if(n.type==='text')assert.doesNotMatch(n.value,/\d\s*\/\s*\d/);}}
 for(const r of rows)for(const s of [r.statement,r.answer,r.solution,...r.options||[]]){assert.doesNotMatch(s,/[\\$]|NaN|Infinity/);walk(mathFragments(s));}assert.ok(count>=35,count);
});
test('all content tampering and missing typed inputs rejected before outside review',()=>{
 for(const r of rows){for(const key of ['statement','answer','solution'])assert.throws(()=>verifyEdition({...r,[key]:r[key]+'changed'}));if(r.options)assert.throws(()=>verifyEdition({...r,options:r.options.slice().reverse()}));for(const key of Object.keys(r.params)){const p={...r.params};delete p[key];assert.throws(()=>renderEdition({...r,params:p}));}}
 assert.throws(()=>renderEdition({...rows[0],params:{times:[0,3],distances:[132,228]}}));assert.throws(()=>renderEdition({...rows[4],params:{mean:1,known:3}}));assert.throws(()=>renderEdition({...rows[5],params:{fractions:[[2,0],[3,4]]}}));assert.throws(()=>renderEdition({...rows[6],params:{values:[4,0,8,1,13]}}));assert.throws(()=>renderEdition({...rows[15],params:{values:[1,2,3,4,5,6]}}));
});

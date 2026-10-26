import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-proportion-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-proportion.json',import.meta.url))).editions;
const find=k=>structuredClone(rows.find(r=>r.modelId==='grade6-proportion-'+k));
const expected=['0,84','12','5 және 12','18','4 : 7 = 12 : 21','24','12','12 : 32','10','28','7 : 28 = 3 : 12','6 : 8 = 21 : 28','Иә: 18 · 28 = 24 · 21','10 : 15 = 14 : 21','90','10','7','5 : 24 = 6 : 20','42','15','9','33','45','Әлия дайындаған сусын','3','8','72','35','2/5','9/8','30','3/10','12','16','11/7','13','2,5 есе арттыру','2','Иә, екі жағы да 8/3','13 : 21','14','720','20','a = 6; b = 21/2','m · v = n · u','3','0','12','25','x : 15 = 7 : 5','Ортаңғы мүшелер көбейтіндісін белгілі шеткі мүшеге бөлу керек: x = 20','14','16','24'];
test('54 individually calculated fixtures bind answers, complete text and Standard-only draft access',()=>{
 assert.equal(rows.length,54);assert.equal(new Set(rows.map(r=>r.sourceRefs[0].sourceId)).size,54);
 rows.forEach((r,i)=>{assert.equal(r.answer,expected[i],r.editionId);assert.equal(verifyEdition(r).answer,expected[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'draft');if(!r.options)assert.match(r.statement,/тек санмен/);});
});
test('all 54 canonical topic1.4 occurrences are referenced once without a source raster',()=>{
 const captured=[];for(const level of['1','2','3','test']){
  const filename=`problems/sources/zerek/courses/6-math-1-4-level${level}.json`,source=JSON.parse(fs.readFileSync(new URL('../'+filename,import.meta.url)));
  for(const q of source.questions){captured.push(q.id);const row=rows.find(r=>r.sourceRefs[0].sourceId===q.id);assert.equal(row.sourceRefs[0].sourceFile,filename);assert.notEqual(row.statement,q.statement);assert.ok(!row.image&&!row.svg);}
 }
 assert.deepEqual(captured.sort(),rows.map(r=>r.sourceRefs[0].sourceId).sort());
});
test('an altered question, key, explanation or option ordering cannot retain a review',()=>{
 for(const row of rows)for(const field of['answer','statement','solution',...(row.options?['options']:[])]){
  const changed=structuredClone(row);if(field==='options')changed.options.reverse();else changed[field]+=' altered';assert.throws(()=>verifyEdition(changed));
 }
});
test('all four missing-member positions use the correct cross-product pair',()=>{
 const row=find('missing-member');const fixtures=[[[null,8,15,20],'6'],[[6,null,15,20],'8'],[[6,8,null,20],'15'],[[6,8,15,null],'20']];
 for(const [terms,answer] of fixtures){row.params={terms};assert.equal(renderEdition(row).answer,answer);}
 row.params={terms:[null,0,2,3]};assert.throws(()=>renderEdition(row));row.params={terms:[null,null,2,3]};assert.throws(()=>renderEdition(row));
});
test('decimal, nested fraction and mixed-number inputs remain exact',()=>{
 assert.match(rows[0].solution,/21\/25 = 0,84/);assert.match(rows[24].solution,/2 бүтін 2\/3 = 8\/3/);assert.match(rows[24].solution,/1 бүтін 1\/3 = 4\/3/);
 assert.equal(rows[28].answer,'2/5');assert.equal(rows[31].answer,'3/10');assert.equal(find('coefficient-numerator').answer,'9/8');
});
test('member rearrangement asks for the specified operation even when every option is true',()=>{
 const q=find('swap-middle');const parsed=q.options.map(s=>s.split(/[:=]/).map(Number));assert.ok(parsed.every(([a,b,c,d])=>a*d===b*c));assert.equal(q.answer,'7 : 28 = 3 : 12');
 const bad=find('not-permuted-proportion');assert.equal(bad.options.filter(s=>{const[a,b,c,d]=s.split(/[:=]/).map(Number);return a*d!==b*c;}).length,1);
});
test('all natural factor pairs are counted and the equal pair is excluded by strict order',()=>{
 const q=find('factor-pair-count');const brute=[];for(let x=1;x<=144;x++)for(let y=1;y<=144;y++)if(x<y&&x*y===144)brute.push([x,y]);assert.equal(brute.length,7);assert.equal(q.answer,String(brute.length));assert.match(q.solution,/\(12; 12\) жарамайды/);
 q.params.middles=[7,15];assert.throws(()=>renderEdition(q),/excluded equal-factor/);
});
test('drawing-free scale and unit ratios preserve conversion and different comparison bases',()=>{
 assert.equal(find('scale-photo').answer,'45');assert.equal(find('units-proportion').answer,'72');assert.match(find('units-proportion').solution,/1,8 м = 180 см/);assert.match(find('units-proportion').solution,/1 сағ = 60 мин/);
 const q=find('same-class-ratio');assert.equal(q.answer,'12');q.params.firstGirls=15;assert.throws(()=>renderEdition(q),/integral/);
});
test('weighted recipe comparison cannot be decided by the raw powder count',()=>{
 const q=find('recipe-comparison');assert.ok(q.params.powder[1]>q.params.powder[0]);assert.equal(q.answer,'Әлия дайындаған сусын');
 q.params={...q.params,powder:[6,10]};assert.throws(()=>renderEdition(q));
});
test('equal middle members and the total four-member product use a positive square root',()=>{
 assert.equal(find('equal-middle').answer,'12');assert.equal(find('four-member-product').answer,'25');
 const q=find('equal-middle');q.params.extremes=[8,15];assert.throws(()=>renderEdition(q));const p=find('four-member-product');p.params.product=626;assert.throws(()=>renderEdition(p));
});
test('the complete distinct-digit domain proves the global maximum, not one working example',()=>{
 const q=find('max-distinct-digit-product'),byProduct=new Map();for(let a=2;a<=9;a++)for(let b=a+1;b<=9;b++){const n=a*b;if(!byProduct.has(n))byProduct.set(n,[]);byProduct.get(n).push([a,b]);}
 const possible=[...byProduct].filter(([n,ps])=>ps.some(a=>ps.some(b=>new Set([...a,...b]).size===4))).map(([n])=>n);assert.equal(Math.max(...possible),24);assert.equal(q.answer,'24');assert.match(q.solution,/72 = 8 · 9/);assert.match(q.solution,/27 = 3 · 9/);
});
test('independent multiple-unknown stages and the forbidden fourth value remain distinct targets',()=>{
 assert.equal(find('successive-proportions').answer,'a = 6; b = 21/2');assert.equal(find('two-unknown-sum').answer,'35');assert.equal(find('denominators-sum').answer,'30');assert.equal(find('variable-both-ratio').answer,'14');assert.equal(find('impossible-fourth').answer,'16');
 const q=find('impossible-fourth');q.params.choices=[40,'22.5','14.4',18];assert.equal(renderEdition(q).answer,'18');q.params.choices=[40,'22.5','14.4','14.4'];assert.throws(()=>renderEdition(q));
});

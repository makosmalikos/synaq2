import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderEdition,verifyEdition} from '../scripts/editorial/grade6-percent-models.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../problems/editorial/batches/grade6-percent.json',import.meta.url))).editions;
const find=kind=>structuredClone(rows.find(q=>q.modelId===`grade6-percent-${kind}`));
const expected=[
 '84','175','87,5','28%','22,5%','30%','35%','35','75','35','(m/n) · 100%','17,5%','57,5','u = v','7,5%','40%',
 '20','250%','36%','I: 2,5%; II: 4%','37,5%','81,25','70','20%','60%','15%','20%','12','12,5','25','24','17,5',
 '41%','56,25','56,25%','37,5%','12','50','32,25%','62,5','28','26%','48','25',
 '(8; 32)','42,5','35%','75','(200/3)%','45','65%','35','30','60',
];
test('all 54 individual percentage fixtures have the separately calculated expected answers',()=>{
 assert.equal(rows.length,54);assert.equal(new Set(rows.map(r=>r.sourceRefs[0].sourceId)).size,54);
 rows.forEach((r,i)=>{assert.equal(r.answer,expected[i],r.editionId);assert.equal(verifyEdition(r).answer,expected[i]);assert.equal(r.minimumPlan,'pro');assert.equal(r.editorialStatus,'draft');if(!r.options)assert.match(r.statement,r.modelId==='grade6-percent-successes-added-total'?/тек лақтыру санын/:/процент таңбасын қоспай, тек санды/);});
});
test('every saved source is referenced exactly once and no original raster is reused',()=>{
 const all=[];for(const level of['1','2','3','test']){
  const file=`problems/sources/zerek/courses/6-math-1-3-level${level}.json`;
  const source=JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url)));
  for(const q of source.questions){all.push(q.id);const r=rows.find(r=>r.sourceRefs[0].sourceId===q.id);assert.equal(r.sourceRefs[0].sourceFile,file);assert.notEqual(r.statement,q.statement);assert.ok(!r.image&&!r.svg);}
 }
 assert.deepEqual([...all].sort(),rows.map(r=>r.sourceRefs[0].sourceId).sort());
});
test('all written conditions, explanations, keys and choices bind to their calculation',()=>{
 for(const row of rows)for(const field of['statement','solution','answer',...(row.options?['options']:[])]){
  const q=structuredClone(row);if(field==='options')q.options.reverse();else q[field]+=' altered';assert.throws(()=>verifyEdition(q));
 }
});
test('wrong bases remain distinguishable: reverse comparisons, inverse ratios, growth versus share',()=>{
 assert.equal(find('less-than').answer,'37,5%');assert.equal(find('greater-than').answer,'60%');
 assert.equal(find('return-price').answer,'37,5%');assert.equal(find('inverse-percent').answer,'62,5');
 assert.equal(find('over-plan').answer,'17,5');assert.equal(find('compound-growth').answer,'32,25%');
 const q=find('compound-growth');q.params.values[2]=260000;assert.throws(()=>renderEdition(q),/multipliers must agree/);
});
test('mixtures and nested participation cannot use the unweighted arithmetic mean',()=>{
 assert.equal(find('weighted-concentration').answer,'41%');assert.equal(find('nested-attendance').answer,'56,25');
 const q=find('weighted-concentration');q.params.masses=[500,500];assert.throws(()=>renderEdition(q));
 const salt=find('dilution');salt.params.water=0;assert.throws(()=>renderEdition(salt));
});
test('class changes alter the denominator and require actual integral pupils',()=>{
 const q=find('class-changes');assert.equal(q.answer,'48');q.params.total=21;assert.throws(()=>renderEdition(q),/integral/);
 q.params.total=20;q.params.leftGirls=q.params.addedBoys;assert.throws(()=>renderEdition(q));
 const third=find('third-class');third.params.first=100;assert.throws(()=>renderEdition(third));
});
test('fractions use a common denominator and an exact nonterminating MCQ remains exact',()=>{
 const q=find('fraction-complement');assert.match(q.statement,/1\/5/);assert.match(q.statement,/3\/8/);assert.match(q.solution,/8\/40 \+ 15\/40/);assert.equal(q.answer,'42,5');
 const fraction=find('sum-first-relative');assert.equal(fraction.answer,'(200/3)%');assert.ok(fraction.options.includes(fraction.answer));
 fraction.params.first=20;assert.throws(()=>renderEdition(fraction),/nonterminating/);
});
test('rounding only happens when explicitly requested and both rounding directions are supported',()=>{
 const q=find('rounded-wins');assert.equal(q.answer,'65%');assert.match(q.solution,/24 ≥ 17/);
 q.params={games:13,wins:9,choices:[9,70,69,144]};assert.equal(renderEdition(q).answer,'69%');
 q.params={games:200,wins:13,choices:[6,7,13,65]};assert.equal(renderEdition(q).answer,'7%');
});
test('unchanged missed-shot count recovers the final total and rejects fractional hit counts',()=>{
 const q=find('successes-added-total');assert.equal(q.answer,'30');assert.match(q.solution,/20, оның 8-і дәл/);assert.match(q.solution,/18\/30 = 60%/);
 q.params={initialPercent:40,finalPercent:60,added:9};assert.throws(()=>renderEdition(q),/integral/);
});
test('neither-divisor inclusion/exclusion uses an LCM rather than a product assumption',()=>{
 const q=find('neither-divisor');assert.equal(q.answer,'60');q.params={last:100,divisors:[4,6]};assert.equal(renderEdition(q).answer,'67');
});
test('degenerate, incomplete and numerically equivalent choices are rejected',()=>{
 const q=find('minutes-hour');q.params.choices=[30,[60,2],18,3];assert.throws(()=>renderEdition(q));
 q.params.choices=[18,3,1,2];assert.throws(()=>renderEdition(q));
 const pair=find('select-pair');pair.params.pairs[0]=[4,16];assert.throws(()=>renderEdition(pair));
 const speed=find('speed-comparison');speed.params.hours=[4,4];assert.throws(()=>renderEdition(speed));
 const mixture=find('combine-salt-water');mixture.params.water=-1;assert.throws(()=>renderEdition(mixture));
});

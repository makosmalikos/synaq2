import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {independentlyCalculate,statementFor,solutionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave2-models.mjs';
import {prepareVisualWave2} from '../scripts/editorial/visual-wave2-prepare.mjs';
const root=new URL('../',import.meta.url);
const read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8'));
const pack=read('problems/editorial/batches/visual-wave2-protractors.json');
const row=suffix=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave2-'+suffix));
const calc=q=>independentlyCalculate(q).answer;
const rays=obj=>Object.entries(obj).map(([label,mark])=>({label,mark}));

test('29 individually addressed drafts exhaust the saved visual grade5 topic7.2 subset',()=>{
 assert.equal(pack.publication.allowed,false);assert.equal(pack.status,'draft_awaiting_independent_review');
 assert.equal(pack.editions.length,29);assert.equal(new Set(pack.editions.map(q=>q.sourceOccurrenceId)).size,29);
 const scope=read('problems/editorial/batches/visual-inventory.json').records.filter(r=>r.grade===5&&r.sourceFile.includes('/5-math-7-2-'));
 assert.equal(scope.length,29);assert.deepEqual(pack.coverage.exactSourceIds,scope.map(r=>r.sourceId).sort());
 assert.deepEqual(prepareVisualWave2(),pack,'Preparation is deterministic and source complete');
 for(const q of pack.editions){
  const record=scope.find(r=>r.occurrenceId===q.sourceOccurrenceId),raw=read(record.sourceFile).questions[record.sourceIndex];
  assert.equal(q.sourceCanonicalSha256,editionHash(raw),'The full saved source condition and solution are bound by hash');
  assert.equal(q.grade,5);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');
  assert.equal(q.minimumPlan,'pro');assert.notEqual(q.statement,raw.statement);assert.notEqual(q.answer,String(raw.sourceAnswer));
  assert.equal(verifyEdition(q).answer,q.answer);
  const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));
  assert.equal(bytes.toString(),svgFor(q));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);
  assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|href=|foreignObject|<script\b|https?:|data:image/i);
 }
});
test('the independently computed golden answers preserve all twenty requested skill forms',()=>{
 const expected=['125','137','32','112','155','146','68','W','42','57','104','Иә: 52° және 52°','123','75','66','119','73','84','86','36','12','125','95','∠QOS','930','OD','86','92','8'];
 assert.equal(new Set(pack.editions.map(q=>q.modelId)).size,20);
 assert.deepEqual(pack.editions.map(calc),expected);
 for(const q of pack.editions){const bad=structuredClone(q);bad.answer='not a key';assert.equal(calc(bad),q.answer);assert.throws(()=>verifyEdition(bad),/Independent mathematical answer/);}
});
test('left/right zero rows and whole-instrument rotation cannot change an angle',()=>{
 assert.equal(calc(row('unit-left')),'137');assert.notEqual(calc(row('unit-left')),'43');
 assert.equal(calc(row('acute-left')),'42');assert.notEqual(calc(row('acute-left')),'138');
 const tilted=row('tilted-offset');const original=calc(tilted);for(const rotation of[-20,-7,0,11,20]){tilted.params.rotation=rotation;assert.equal(calc(tilted),original);}
 const bad=row('unit-left');bad.params.scale='inner';assert.throws(()=>calc(bad),/Zero/);
});
test('nonzero readings use a single scale, not a mixed scale or a terminal mark',()=>{
 const q=row('avoid-mixed-rows');assert.equal(calc(q),'125');
 assert.notEqual(calc(q),'23');assert.notEqual(calc(q),'55');assert.notEqual(calc(q),'164');
 const two=row('two-nonzero');two.params.rays=rays({A:147,B:42});assert.equal(calc(two),'105');
});
test('a below-instrument ray is required to be actually opposite the measured ray',()=>{
 const q=row('below-instrument');assert.equal(calc(q),'104');
 q.params.rays.find(r=>r.label==='D').mark=255;assert.throws(()=>calc(q),/geometrically opposite/);
});
test('a claimed bisector is tested rather than assumed; unknown construction rays are absent',()=>{
 const q=row('test-bisector');assert.equal(calc(q),'Иә: 52° және 52°');
 q.params.rays.find(r=>r.label==='B').mark=105;assert.equal(calc(q),'Жоқ: 52° және 53°');
 for(const suffix of['construct-half','bisector-other-row','bisector-offset','double-construction']){
  const item=row(suffix);assert.ok(!item.params.rays.some(r=>r.label===item.params.future));
  item.params.rays.push({label:item.params.future,mark:80});assert.throws(()=>calc(item),/not drawn|not a supplied answer|false == true/);
 }
});
test('a nonzero bisector mark is an absolute scale position, not half the angle size',()=>{
 assert.equal(calc(row('bisector-other-row')),'95');assert.notEqual(calc(row('bisector-other-row')),'58');
 const q=row('bisector-other-row');q.params.rays=rays({M:20,N:140});assert.equal(calc(q),'80');
 const off=row('bisector-offset');assert.equal(calc(off),'12');assert.notEqual(calc(off),'68');
});
test('construction and equal-angle answers identify a unique point/ray/pair',()=>{
 for(const suffix of['construction-point','identify-ray','equal-named-angle']){const q=row(suffix);assert.equal(q.options.filter(s=>s===calc(q)).length,1);}
 const q=row('construction-point');q.params.rays.find(r=>r.label==='W').mark=76;assert.throws(()=>calc(q),/unique marked construction point/);
 const eq=row('equal-named-angle');eq.params.candidates.push(['P','R']);assert.throws(()=>calc(eq),/unique equal-angle/);
});
test('all pairs include the straight angle once, while acute counting excludes exactly 90 degrees',()=>{
 assert.equal(calc(row('all-pair-sum')),'930');
 const sum=row('all-pair-sum');sum.params.rays=rays({A:0,B:90,C:180});assert.equal(calc(sum),'360');
 const acute=row('strict-acute-pairs');assert.equal(calc(acute),'8');acute.params.rays=rays({A:0,B:90,C:180});assert.equal(calc(acute),'0');
 acute.params.rays=rays({A:0,B:89,C:180});assert.equal(calc(acute),'1');
});
test('native diagrams contain all181 one-degree marks and two complementary, mobile-readable scales',()=>{
 for(const q of pack.editions){
  const svg=svgFor(q),ticks=[...svg.matchAll(/data-tick="(\d+)"/g)].map(m=>Number(m[1]));
  assert.deepEqual(ticks,Array.from({length:181},(_,i)=>i));
  const entries=[...svg.matchAll(/data-scale="(inner|outer)" data-direction="(\d+)"[^>]*>(\d+)<\/text>/g)];
  assert.equal(entries.length,20);
  for(const m of entries)assert.equal(Number(m[3]),m[1]==='inner'?Number(m[2]):180-Number(m[2]));
  assert.match(svg,/width="480" height="360" viewBox="0 0 480 360"/);
  assert.match(svg,new RegExp('data-instrument-rotation="'+q.params.rotation+'"'));
  for(const r of q.params.rays)assert.match(svg,new RegExp('data-point-label="'+r.label+'"'));
 }
});
test('stale conditions and SVG hashes are rejected after parameter edits',()=>{
 const q=row('construction-point');q.params.goal=76;q.params.rays.find(r=>r.label==='W').mark=76;
 assert.throws(()=>verifyEdition(q),/condition/);q.statement=statementFor(q);q.solution=solutionFor(q);
 assert.throws(()=>verifyEdition(q),/SVG digest/);
});

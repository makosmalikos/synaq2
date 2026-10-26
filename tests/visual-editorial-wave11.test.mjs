import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {prepareVisualWave11} from '../scripts/editorial/visual-wave11-prepare.mjs';
import {permutations,diagonals,independentlyCalculate,statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave11-models.mjs';
const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8')),pack=read('problems/editorial/batches/visual-wave11-statistics-trees.json'),row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave11-'+s)),calc=q=>independentlyCalculate(q).answer;
test('10 new visuals exhaust chapter8; prior textual mode reference is not falsely retained as a bar adaptation',()=>{
 assert.equal(pack.editions.length,10);assert.deepEqual(prepareVisualWave11(),pack);assert.equal(pack.coverage.sourceVisualOccurrences,10);assert.equal(pack.coverage.previousEditionsRetained.length,0);assert.equal(pack.coverage.priorCurriculumSkillReferences.length,1);assert.equal(pack.publication.allowed,false);
 for(const q of pack.editions){const raw=read(q.sourceRefs[0].sourceFile).questions[Number(q.sourceOccurrenceId.split('#').at(-1))];assert.equal(editionHash(raw),q.sourceCanonicalSha256);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');assert.equal(q.minimumPlan,'pro');const v=verifyEdition(q);assert.equal(v.answer,q.answer);assert.ok(Array.isArray(v.checks)&&v.checks.length>0);if(!q.options){assert.match(q.answer,/^\d+$/);assert.match(q.statement,/Жауапқа тек санды жазыңыз\.$/);}const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);}
});
test('10 hand-reasoned keys are independent of stored answer values',()=>{
 assert.deepEqual(pack.editions.map(calc),['-2','48','8','3','3','12','18','9','QRP','7']);for(const q of pack.editions){const wrong=structuredClone(q);wrong.answer='invalid';assert.equal(calc(wrong),q.answer);assert.throws(()=>verifyEdition(wrong),/Independent statistics\/enumeration answer/);}
});
test('opposite-signed coordinate mean is neither half distance nor the raw sum',()=>{
 const q=row('coordinate-arithmetic-mean');assert.equal(calc(q),'-2');assert.deepEqual(independentlyCalculate(q).checks,{sum:-4,halfDistance:6});assert.ok(q.options.includes('-4')&&q.options.includes('6'));
});
test('nonunit bar heights are actual counts before division by four, not six grid rows',()=>{
 const q=row('scaled-postcard-mean');assert.equal(q.params.step,6);assert.deepEqual(q.params.values,[36,54,42,60]);assert.equal(calc(q),'48');assert.equal(independentlyCalculate(q).checks.sum,192);assert.notEqual(6+9+7+10,48);
});
test('five unit-scaled individual observations average40/5 and not the ordinal labels',()=>{
 const q=row('puzzle-count-mean');assert.equal(calc(q),'8');assert.equal(independentlyCalculate(q).checks.sum,40);assert.deepEqual(q.params.categories,[1,2,3,4,5]);assert.notEqual((1+2+3+4+5)/5,8);
});
test('bar and dot modes are categories3 rather than frequencies8 and7',()=>{
 const b=row('grade-frequency-mode'),d=row('football-dot-mode');assert.equal(calc(b),'3');assert.equal(independentlyCalculate(b).checks.maxFrequency,8);assert.equal(calc(d),'3');assert.equal(independentlyCalculate(d).checks.maxFrequency,7);assert.equal(d.params.frequencies.at(-1),0);assert.equal(d.params.categories.at(-1),6);
 const svg=svgFor(d);assert.equal([...svg.matchAll(/data-observation=/g)].length,18);assert.equal([...svg.matchAll(/data-category="3" data-observation=/g)].length,7);assert.equal([...svg.matchAll(/data-category="6" data-observation=/g)].length,0);
});
test('range uses maximum17 minus minimum5 rather than day-index distance',()=>{
 const q=row('attendance-bar-range');assert.equal(calc(q),'12');assert.deepEqual(independentlyCalculate(q).checks,{min:5,max:17});assert.notEqual(5-1,12);
});
test('the seven-card median18 differs from the physically central card11',()=>{
 const q=row('unsorted-card-median');assert.equal(calc(q),'18');assert.equal(q.params.values[3],11);assert.deepEqual(independentlyCalculate(q).checks.ordered,[7,11,16,18,20,23,26]);
});
test('polygon enumeration counts unordered nonadjacent pairs, not reversed pairs or sides',()=>{
 assert.equal(diagonals(5).length,5);assert.equal(diagonals(6).length,9);assert.equal(diagonals(7).length,14);const q=row('hexagon-diagonal-enumeration');assert.equal(calc(q),'9');assert.deepEqual(independentlyCalculate(q).checks.pairs,['AC','AD','AE','BD','BE','BF','CE','CF','DF']);assert.equal(new Set(diagonals(6).map(r=>r.join(':'))).size,9);
});
test('missing permutation follows all three levels with no repeated token',()=>{
 const q=row('permutation-tree-missing-path');assert.equal(permutations(q.params.tokens).length,6);assert.equal(calc(q),'QRP');const paths=[...svgFor(q).matchAll(/data-path="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(paths,q.params.paths);assert.ok(paths.every(s=>new Set(s).size===3));assert.ok(!paths.includes('QRP'));assert.ok(q.options.filter(s=>paths.includes(s)).length===3);
});
test('unequal allowed menu branches add4+3 instead of multiplying2×4',()=>{
 const q=row('unequal-meal-tree-count');assert.equal(calc(q),'7');assert.deepEqual(independentlyCalculate(q).checks.counts,[4,3]);assert.equal([...svgFor(q).matchAll(/data-path=/g)].length,7);assert.ok(q.options.includes('8'));assert.equal(2*4,8);
});
test('actual native bar y positions and heights agree with the printed zero and top grid scale',()=>{
 for(const q of pack.editions.filter(q=>q.params.scene==='bars')){const svg=svgFor(q),max=q.params.max;for(const m of svg.matchAll(/data-category="([^"]+)" data-value="([^"]+)" x="[^"]+" y="([^"]+)" width="[^"]+" height="([^"]+)"/g)){const value=Number(m[2]),y=Number(m[3]),h=Number(m[4]);assert.ok(Math.abs(y-(280-value/max*220))<1e-10);assert.ok(Math.abs(h-value/max*220)<1e-10);assert.ok(Math.abs(y+h-280)<1e-10);}assert.ok(svg.includes('data-grid-value="0"'));assert.ok(svg.includes('data-grid-value="'+max+'"'));}
});
test('invalid bar overflow, tied modes, duplicate paths and impossible missing-path counts fail closed',()=>{
 let q=row('scaled-postcard-mean');q.params.values[0]=100;assert.throws(()=>calc(q));q=row('grade-frequency-mode');q.params.frequencies=[8,8,5,6];assert.throws(()=>calc(q),/Unique mode/);q=row('permutation-tree-missing-path');q.params.paths.push('QRP');assert.throws(()=>calc(q));q=row('permutation-tree-missing-path');q.params.paths[0]=q.params.paths[1];assert.throws(()=>calc(q));
});
test('data edits invalidate parameter-bound condition/solution, accessible description and SVG SHA',()=>{
 const q=row('scaled-postcard-mean');q.params.values[0]=40;q.answer='49';assert.throws(()=>verifyEdition(q),/solution/);q.solution=solutionFor(q);assert.throws(()=>verifyEdition(q),/accessible/);q.figureDescription=descriptionFor(q);assert.throws(()=>verifyEdition(q),/SVG digest/);
});

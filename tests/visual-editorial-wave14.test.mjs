import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {prepareVisualWave14} from '../scripts/editorial/visual-wave14-prepare.mjs';
import {matchesAll,isFunction,independentlyCalculate,statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave14-models.mjs';
const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8')),pack=read('problems/editorial/batches/visual-wave14-dependence-tables.json'),row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave14-'+s)),calc=q=>independentlyCalculate(q).answer;
test('10 source-addressed drafts exhaust all captured visual9.1–9.2 and remain unpublished drafts',()=>{
 assert.equal(pack.editions.length,10);assert.deepEqual(prepareVisualWave14(),pack);assert.equal(pack.coverage.sourceVisualOccurrences,10);assert.equal(pack.publication.allowed,false);
 for(const q of pack.editions){const raw=read(q.sourceRefs[0].sourceFile).questions[Number(q.sourceOccurrenceId.split('#').at(-1))];assert.equal(editionHash(raw),q.sourceCanonicalSha256);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');assert.equal(q.minimumPlan,'pro');const v=verifyEdition(q);assert.equal(v.answer,q.answer);assert.ok(Array.isArray(v.checks)&&v.checks.length>0);if(!q.options){assert.match(q.answer,/^\d+$/);assert.match(q.statement,/Жауапқа тек санды жазыңыз\.$/);}const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);}
});
test('10 independent keys ignore stored answers',()=>{
 assert.deepEqual(pack.editions.map(calc),['y = 4x + 3','48','3','33','12','y = 9x','16','2','x = 3','4']);for(const q of pack.editions){const wrong=structuredClone(q);wrong.answer='invalid';assert.equal(calc(wrong),q.answer);assert.throws(()=>verifyEdition(wrong),/Independent dependence answer/);}
});
test('shuffled mapping arrows determine pairs rather than aligning left and right row positions',()=>{
 const q=row('shuffled-arrow-dependence');assert.equal(calc(q),'y = 4x + 3');assert.deepEqual(q.params.displayY,[15,7,19,11]);assert.deepEqual(independentlyCalculate(q).checks.pairs,[[1,7],[2,11],[3,15],[4,19]]);assert.ok(q.options.every(f=>matchesAll(f,[1],[7])),'All distractors fit the first pair, so all pairs must be checked');assert.ok(!matchesAll('y = 4x + 3',q.params.xs,q.params.displayY));
});
test('one output per input allows shared outputs but rejects missing, double and invalid arrows',()=>{
 const q=row('single-valued-arrow-gallery');assert.deepEqual(q.params.panels.map(isFunction),[false,false,true,false]);assert.equal(calc(q),'3');assert.deepEqual(independentlyCalculate(q).checks.outDegrees,[[2,0,1],[1,1,0],[1,1,1],[1,2,1]]);assert.equal(isFunction({xs:[1,2],ys:[4],links:[[1,4],[2,4]]}),true);assert.equal(isFunction({xs:[1,2],ys:[4],links:[[1,4],[2,5]]}),false);
});
test('area dependence and equilateral tick-mark perimeter are different formulas before evaluation',()=>{
 const a=row('rectangle-area-dependence'),t=row('equal-marks-perimeter-rule');assert.equal(calc(a),'48');assert.equal(independentlyCalculate(a).checks.formula,'S = 6a');assert.equal(calc(t),'33');assert.equal(independentlyCalculate(t).checks.formula,'P = 3a');assert.equal([...svgFor(t).matchAll(/data-equal-mark=/g)].length,3);
});
test('maximum dependent temperature22 returns its independent time12, not time-row max21',()=>{
 const q=row('maximum-temperature-time');assert.equal(calc(q),'12');assert.equal(independentlyCalculate(q).checks.maxTemperature,22);assert.equal(Math.max(...q.params.xs),21);assert.notEqual(calc(q),'22');assert.notEqual(calc(q),'21');
});
test('direct table formula9x fits every pair while all distractors fit first pair only',()=>{
 const q=row('proportional-table-formula');assert.equal(calc(q),'y = 9x');assert.ok(q.options.every(f=>matchesAll(f,[1],[9])));assert.equal(q.options.filter(f=>matchesAll(f,q.params.xs,q.params.ys)).length,1);assert.deepEqual(q.params.ys.map((y,i)=>y/q.params.xs[i]),[9,9,9,9,9]);
});
test('fare lookup runs revenue-to-count in the same column and independently checks constant250 fare',()=>{
 const q=row('fare-table-inverse-lookup');assert.equal(calc(q),'16');assert.equal(4000/250,16);assert.equal(q.params.ys[q.params.xs.indexOf(16)],4000);
});
test('independent time step2 is not dependent distance change14 or last time10',()=>{
 const q=row('independent-time-table-step');assert.equal(calc(q),'2');assert.deepEqual(independentlyCalculate(q).checks,{independentSteps:[2,2,2,2,2],dependentSteps:[14,14,14,14,14]});assert.ok(q.options.includes('14')&&q.options.includes('10'));
});
test('exact printed5x−2 formula identifies x3 as sole wrong column, not one of its correct neighbors',()=>{
 const q=row('one-wrong-formula-column');assert.equal(calc(q),'x = 3');assert.deepEqual(independentlyCalculate(q).checks.expected,[3,8,13,18,23]);assert.equal(q.params.ys[2],12);for(const i of [0,1,3,4])assert.equal(matchesAll(q.params.formula,[q.params.xs[i]],[q.params.ys[i]]),true);
});
test('decreasing candle heights yield a positive loss magnitude4 and include time units',()=>{
 const q=row('candle-hourly-decrease');assert.equal(calc(q),'4');assert.deepEqual(independentlyCalculate(q).checks.hourlyRates,[4,4,4,4]);assert.equal((30-14)/(4-0),4);assert.match(q.statement,/сантиметрге/);
});
test('native table cells bind every actually printed input/output pair without sorting independent and dependent rows',()=>{
 for(const q of pack.editions.filter(q=>q.params.scene==='table')){const svg=svgFor(q),columns=[...svg.matchAll(/data-column="(\d+)" data-independent="([^"]+)" data-dependent="([^"]+)"/g)];assert.equal(columns.length,q.params.xs.length);for(const m of columns){assert.equal(Number(m[2]),q.params.xs[Number(m[1])]);assert.equal(Number(m[3]),q.params.ys[Number(m[1])]);}}
});
test('native shuffled and gallery arrow tags preserve actual selected links',()=>{
 const q=row('shuffled-arrow-dependence'),svg=svgFor(q),links=[...svg.matchAll(/data-map-x="([^"]+)" data-map-y="([^"]+)"/g)].map(m=>m.slice(1).map(Number));assert.deepEqual(links,[[1,7],[2,11],[3,15],[4,19]]);
 const g=row('single-valued-arrow-gallery'),s=svgFor(g);for(let i=0;i<4;i++){const rx=new RegExp('data-panel="'+(i+1)+'" data-map-x="([^"]+)" data-map-y="([^"]+)"','g');assert.deepEqual([...s.matchAll(rx)].map(m=>m.slice(1).map(Number)),g.params.panels[i].links);}
});
test('updating one output forces recalculated text, description and native SHA rather than stale metadata',()=>{
 const q=row('candle-hourly-decrease');q.params.ys=[30,25,20,15,10];q.answer='5';assert.throws(()=>verifyEdition(q),/solution/);q.solution=solutionFor(q);assert.throws(()=>verifyEdition(q),/accessible/);q.figureDescription=descriptionFor(q);assert.throws(()=>verifyEdition(q),/SVG digest/);
});

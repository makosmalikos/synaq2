import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {prepareVisualWave17} from '../scripts/editorial/visual-wave17-prepare.mjs';
import {independentlyCalculate,statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave17-models.mjs';
const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8')),pack=read('problems/editorial/batches/visual-wave17-proportional-graphs.json'),row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave17-'+s)),calc=q=>independentlyCalculate(q).answer;
test('5 source-specific drafts exhaust9.5 while native images remain awaiting independent review',()=>{
 assert.equal(pack.editions.length,5);assert.deepEqual(prepareVisualWave17(),pack);assert.equal(pack.coverage.sourceVisualOccurrences,5);assert.equal(pack.publication.allowed,false);
 for(const q of pack.editions){const raw=read(q.sourceRefs[0].sourceFile).questions[Number(q.sourceOccurrenceId.split('#').at(-1))];assert.equal(editionHash(raw),q.sourceCanonicalSha256);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');assert.equal(q.minimumPlan,'pro');const v=verifyEdition(q);assert.equal(v.answer,q.answer);assert.ok(Array.isArray(v.checks)&&v.checks.length>0);if(!q.options){assert.match(q.answer,/^\d+$/);assert.match(q.statement,/Жауапқа тек санды жазыңыз\.$/);}const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);}
});
test('5 hand-reasoned keys ignore stored answers',()=>{
 assert.deepEqual(pack.editions.map(calc),['4','-1,25','18','d','2']);for(const q of pack.editions){const wrong=structuredClone(q);wrong.answer='invalid';assert.equal(calc(wrong),q.answer);assert.throws(()=>verifyEdition(wrong),/Independent proportionality answer/);}
});
test('negative rational coefficient−2/3 times negative input−6 gives positive4',()=>{
 const q=row('negative-slope-forward-reading');assert.equal(calc(q),'4');assert.deepEqual(independentlyCalculate(q).checks.coefficient,{n:-2,d:3});assert.equal(q.params.queryX,-6);
});
test('actual fractional coefficient options distinguish−5/4 from positive and reciprocal±4/5',()=>{
 const q=row('negative-fractional-coefficient');assert.equal(calc(q),'-1,25');assert.deepEqual(independentlyCalculate(q).checks.coefficient,{n:-5,d:4});assert.deepEqual(q.options,['1,25','(-4/5)','(4/5)','-1,25']);
});
test('physical speed comes from72/4 or36/2 with4km minor vertical units',()=>{
 const q=row('speed-from-scaled-proportion');assert.equal(calc(q),'18');assert.equal(q.params.yStep,4);assert.equal(q.params.yLabelEvery,16);assert.equal(72/4,18);assert.equal(36/2,18);assert.match(svgFor(q),/data-coordinates="0,0;4,72"/);
});
test('negative target slope−3 chooses d over same-magnitude positive a or reciprocal negative c',()=>{
 const q=row('identify-negative-three-slope');assert.equal(calc(q),'d');assert.deepEqual(independentlyCalculate(q).checks.lineCoefficients,[{label:'a',n:3,d:1},{label:'b',n:1,d:3},{label:'c',n:-1,d:3},{label:'d',n:-3,d:1}]);assert.equal(q.params.targetFormula,'y = -3x');
});
test('positive coefficient is y/x=6/3=2 rather than reciprocal1/2',()=>{
 const q=row('positive-point-proportionality');assert.equal(calc(q),'2');assert.deepEqual(q.params.point,[3,6]);assert.deepEqual(independentlyCalculate(q).checks.coefficient,{n:2,d:1});
});
test('actual native plane segments use identical20px units on both axes and match every stored endpoint',()=>{
 for(const q of pack.editions.filter(q=>q.params.scene==='plane')){const svg=svgFor(q),matches=[...svg.matchAll(/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"[^>]*data-line="([^"]+)" data-coordinates="([^"]+)"/g)];assert.equal(matches.length,q.params.lines.length);for(const m of matches){const [a,b]=m[6].split(';').map(v=>v.split(',').map(Number));assert.equal(Number(m[1]),240+20*a[0]);assert.equal(Number(m[2]),180-20*a[1]);assert.equal(Number(m[3]),240+20*b[0]);assert.equal(Number(m[4]),180-20*b[1]);}assert.doesNotMatch(svg,/NaN|Infinity/);}
});
test('a line not through origin cannot masquerade as direct proportionality',()=>{
 const q=row('positive-point-proportionality');q.params.lines[0].points=[[-3,-5],[3,7]];assert.throws(()=>calc(q),/through origin/);
});
test('changing given query binds question and answer while preserving an otherwise unchanged graph',()=>{
 const q=row('negative-slope-forward-reading');q.params.queryX=-3;q.answer='2';assert.throws(()=>verifyEdition(q),/statement/);q.statement=statementFor(q);assert.throws(()=>verifyEdition(q),/solution/);q.solution=solutionFor(q);assert.equal(verifyEdition(q).answer,'2');
});

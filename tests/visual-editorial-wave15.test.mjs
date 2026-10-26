import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {prepareVisualWave15} from '../scripts/editorial/visual-wave15-prepare.mjs';
import {graphValue,graphInverse,independentlyCalculate,statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave15-models.mjs';
const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8')),pack=read('problems/editorial/batches/visual-wave15-graph-readings.json'),row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave15-'+s)),calc=q=>independentlyCalculate(q).answer;
test('10 source-specific drafts exhaust visual9.3 with exact native images and unpublished flags',()=>{
 assert.equal(pack.editions.length,10);assert.deepEqual(prepareVisualWave15(),pack);assert.equal(pack.coverage.sourceVisualOccurrences,10);assert.equal(pack.publication.allowed,false);
 for(const q of pack.editions){const raw=read(q.sourceRefs[0].sourceFile).questions[Number(q.sourceOccurrenceId.split('#').at(-1))];assert.equal(editionHash(raw),q.sourceCanonicalSha256);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');assert.equal(q.minimumPlan,'pro');const v=verifyEdition(q);assert.equal(v.answer,q.answer);assert.ok(Array.isArray(v.checks)&&v.checks.length>0);if(!q.options){assert.match(q.answer,/^\d+$/);assert.match(q.statement,/Жауапқа тек санды жазыңыз\.$/);}const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);}
});
test('all10 hand-reasoned answers are calculated without stored keys',()=>{
 assert.deepEqual(pack.editions.map(calc),['B','12','350','6','II','6 дм³ түйіршіктің массасы 9 кг','16','32','7','48']);for(const q of pack.editions){const wrong=structuredClone(q);wrong.answer='invalid';assert.equal(calc(wrong),q.answer);assert.throws(()=>verifyEdition(wrong),/Independent graph answer/);}
});
test('exact interpolation works inside drawn segments and refuses domain extrapolation',()=>{
 assert.deepEqual(graphValue([[0,0],[8,192]],6),{n:1152,d:8});assert.deepEqual(graphValue([[0,4],[1,6],[2,10]],1.5),{n:8,d:1});assert.throws(()=>graphValue([[0,0],[5,10]],6),/domain/);assert.equal(graphInverse([[0,0],[8,192]],144),6);
 assert.throws(()=>graphInverse([[0,0],[2,6],[4,6]],6),/inverse answers/);
});
test('only B lies on2000-per-metre cost graph, while adjacent candidates are below it',()=>{
 const q=row('point-on-ribbon-cost-line');assert.equal(calc(q),'B');for(const pt of q.params.candidates){const v=graphValue(q.params.series[0].points,pt.x);assert.equal(v.n===pt.y*v.d,pt.label==='B');}
});
test('stop8 to20 lasts12 minutes, not three4-minute grid gaps',()=>{
 const q=row('scaled-walk-stop-duration');assert.equal(calc(q),'12');assert.equal(q.params.xStep,4);assert.deepEqual(independentlyCalculate(q).checks,{start:8,end:20,level:600});assert.notEqual(3,12);
});
test('discrete purchase graph uses only four dots and yields350 per ticket',()=>{
 const q=row('discrete-ticket-unit-price');assert.equal(calc(q),'350');assert.deepEqual(independentlyCalculate(q).checks.rates,[350,350,350,350]);const svg=svgFor(q);assert.equal([...svg.matchAll(/data-discrete-point=/g)].length,4);assert.doesNotMatch(svg,/<polyline/);assert.match(svg,/data-discrete-point="2,700"/);assert.match(svg,/data-discrete-point="6,2100"/);
});
test('inverse volume lookup returns6 minutes for144 litres, not the forward volume',()=>{
 const q=row('water-volume-inverse-time');assert.equal(calc(q),'6');assert.equal(6*24,144);assert.deepEqual(independentlyCalculate(q).checks.point,[6,144]);
});
test('both speeds are compared at time2; II30km beats I12km on the same axes',()=>{
 const q=row('faster-line-common-time');assert.equal(calc(q),'II');assert.deepEqual(independentlyCalculate(q).checks.atSameTime,[{label:'I',value:12},{label:'II',value:30}]);assert.equal(12/2,6);assert.equal(30/2,15);assert.match(svgFor(q),/data-series="I"/);assert.match(svgFor(q),/data-series="II"/);
});
test('interpretation preserves volume6 before mass9 and rejects axis swapping',()=>{
 const q=row('interpret-volume-mass-point');assert.equal(calc(q),'6 дм³ түйіршіктің массасы 9 кг');assert.ok(q.options.includes('9 дм³ түйіршіктің массасы 6 кг'));assert.deepEqual(independentlyCalculate(q).checks,{volume:6,mass:9});assert.match(svgFor(q),/data-interpret-point="6,9"/);
});
test('growth reads intermediate10 and26 on2cm minor grid and subtracts, not26 alone',()=>{
 const q=row('plant-growth-between-times');assert.equal(calc(q),'16');assert.deepEqual(independentlyCalculate(q).checks,{firstHeight:10,secondHeight:26});assert.equal(q.params.yStep,2);assert.equal(q.params.yLabelEvery,6);assert.ok(10%6!==0&&26%6!==0);
});
test('decreasing fuel graph gives remaining32 at160km rather than consumed16',()=>{
 const q=row('remaining-fuel-reading');assert.equal(calc(q),'32');assert.equal(48-32,16);assert.notEqual(Number(q.answer),48-Number(q.answer));assert.equal(q.params.xStep,40);assert.equal(q.params.yStep,4);
});
test('square graph keeps geometric factor4 under inverse lookup28 to7; cycle12×4 is48',()=>{
 const q=row('square-perimeter-inverse-side');assert.equal(calc(q),'7');assert.equal(graphInverse(q.params.series[0].points,28),7);for(let x=0;x<=8;x++){const r=graphValue(q.params.series[0].points,x);assert.equal(r.n,x*4*r.d);}assert.equal(calc(row('cycle-time-to-distance')),'48');
});
test('every actual native polyline point follows its printed independent and dependent axes exactly',()=>{
 for(const q of pack.editions){const p=q.params,svg=svgFor(q),matches=[...svg.matchAll(/data-series="([^"]+)" data-coordinates="([^"]+)" points="([^"]+)"/g)];for(const m of matches){const data=m[2].split(';').map(v=>v.split(',').map(Number)),pixels=m[3].split(' ').map(v=>v.split(',').map(Number));assert.equal(data.length,pixels.length);for(let i=0;i<data.length;i++){assert.ok(Math.abs(pixels[i][0]-(76+data[i][0]/p.xMax*344))<1e-10);assert.ok(Math.abs(pixels[i][1]-(286-data[i][1]/p.yMax*238))<1e-10);}}assert.doesNotMatch(svg,/NaN|Infinity/);}
});
test('changing queried input binds the resulting question/solution and leaves graph data stable only when unchanged',()=>{
 const q=row('cycle-time-to-distance');q.params.requestedX=3;q.answer='36';assert.throws(()=>verifyEdition(q),/statement/);q.statement=statementFor(q);assert.throws(()=>verifyEdition(q),/solution/);q.solution=solutionFor(q);assert.equal(verifyEdition(q).answer,'36','An unchanged drawing remains valid for another in-domain query after exact text recomputation');
});

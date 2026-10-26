import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {prepareVisualWave9} from '../scripts/editorial/visual-wave9-prepare.mjs';
import {parallel,perpendicular,parallelPolygonPairs,independentlyCalculate,statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave9-models.mjs';
const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8')),pack=read('problems/editorial/batches/visual-wave9-line-geometry.json'),row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave9-'+s)),calc=q=>independentlyCalculate(q).answer;
test('15 new drafts plus one retained source exhaust all16 visual sources6.1–6.3',()=>{
 assert.equal(pack.editions.length,15);assert.deepEqual(prepareVisualWave9(),pack);assert.equal(pack.coverage.sourceVisualOccurrences,16);assert.equal(pack.publication.allowed,false);
 for(const q of pack.editions){const raw=read(q.sourceRefs[0].sourceFile).questions[Number(q.sourceOccurrenceId.split('#').at(-1))];assert.equal(editionHash(raw),q.sourceCanonicalSha256);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');assert.equal(q.minimumPlan,'pro');assert.equal(verifyEdition(q).answer,q.answer);if(!q.options){assert.match(q.answer,/^\d+$/);assert.match(q.statement,/Жауапқа тек санды жазыңыз\.$/);}const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);}
});
test('all15 independently reasoned keys are computed without consulting stored answers',()=>{
 assert.deepEqual(pack.editions.map(calc),['D','68','∠2 және ∠3','126','5','62','115','C','2','KK₁, LL₁, MM₁','MN ∥ PQ','2','p','3','15']);
 for(const q of pack.editions){const bad=structuredClone(q);bad.answer='invalid';assert.equal(calc(bad),q.answer);assert.throws(()=>verifyEdition(bad),/Independent line geometry answer/);}
});
test('incidence includes the defining point itself; only D is outside the full line',()=>{
 const q=row('off-line-point');assert.deepEqual(q.params.linePoint,[-4,-1]);assert.equal(calc(q),'D');const d=q.params.points.find(r=>r.label==='D');d.y=-0.25;assert.throws(()=>calc(q),'Four collinear points leave no off-line answer');
});
test('linear pairs subtract from180 while an internal perpendicular ray subtracts from90',()=>{
 assert.equal(calc(row('named-linear-pair')),'68');assert.equal(calc(row('adjacent-obtuse-angle')),'126');assert.equal(calc(row('right-angle-remainder')),'62');
 const q=row('right-angle-remainder');assert.deepEqual(independentlyCalculate(q).checks,{given:28,target:62,relation:'right-complement'});
});
test('an external ray adds to a right angle, rejecting an internal-ray subtraction',()=>{
 const q=row('outside-right-angle');assert.equal(calc(q),'115');assert.notEqual(calc(q),'65');assert.equal(q.params.rays.find(r=>r.label==='C').degrees,115);assert.ok(q.params.rays.find(r=>r.label==='B').degrees<115);
});
test('noncyclic sector numbers recognize opposite sectors rather than consecutive digits',()=>{
 const q=row('vertical-sector-pair');assert.deepEqual(q.params.sectorLabels,[2,4,3,1]);assert.equal(calc(q),'∠2 және ∠3');assert.ok(q.options.includes('∠1 және ∠2'));assert.ok(!q.options.includes('∠4 және ∠1'),'Other mathematically true vertical pair must not become a second correct option');
});
test('point-to-line distance uses only the perpendicular component and rejects the slant',()=>{
 assert.equal(calc(row('perpendicular-point-gap')),'5');const q=row('closest-perpendicular-point');assert.equal(calc(q),'C');assert.deepEqual(independentlyCalculate(q).checks.distances.map(r=>r.distance),[2,4,1,3]);q.params.points.find(r=>r.label==='C').y=4;assert.equal(calc(q),'C','Changing height does not change distance to a vertical line');
});
test('integer direction predicates work with reverse/multiple vectors and reject zero directions',()=>{
 assert.equal(parallel([2,1],[-6,-3]),true);assert.equal(parallel([2,1],[1,2]),false);assert.equal(perpendicular([2,1],[-1,2]),true);assert.equal(perpendicular([1,1],[1,0]),false);assert.throws(()=>parallel([0,0],[1,2]));
 const q=row('perpendicular-grid-pairs');assert.deepEqual(independentlyCalculate(q).checks.pairDots,[1,0,2,1]);assert.equal(calc(q),'2');
});
test('cuboid class uses 3D directions and excludes the reference from exactly three matches',()=>{
 const q=row('cuboid-parallel-class'),r=independentlyCalculate(q);assert.deepEqual(r.checks.referenceVector,[0,0,3]);assert.deepEqual(r.checks.parallelEdges,[['K','K₁'],['L','L₁'],['M','M₁']]);assert.equal(calc(q),'KK₁, LL₁, MM₁');assert.ok(!r.checks.parallelEdges.some(e=>e.includes('J')));assert.equal(parallel([0,0,3],[6,0,0]),false);assert.equal(parallel([0,0,3],[0,-4,0]),false);
});
test('unequal opposite side lengths can be parallel while the other opposite pair is not',()=>{
 const q=row('quadrilateral-parallel-sides'),poly=q.params.points.map(r=>[r.x,r.y]);assert.deepEqual(parallelPolygonPairs(poly),[[0,2]]);assert.equal(calc(q),'MN ∥ PQ');assert.equal(parallel([2,4],[-3,-6]),true);assert.equal(parallel([5,1],[4,-1]),false);
});
test('parallel segment count accepts proportional lengths and never counts AB itself',()=>{
 const q=row('parallel-segment-count');assert.equal(calc(q),'2');assert.deepEqual(independentlyCalculate(q).checks.parallelNames,['CD','EF']);assert.ok(q.params.segments.some(r=>r.direction.join(',')==='4,2'));
});
test('only the matching direction through A is parallel; A is genuinely outside t',()=>{
 const q=row('parallel-line-through-point');assert.equal(calc(q),'p');assert.equal(parallel([3,1],[-2-(-4),2-(-3)]),false);assert.equal(parallel([3,1],[1,2]),false);assert.equal(parallel([3,1],[2,1]),false);
});
test('strictly convex octagon has exactly three unordered parallel pairs, not four by appearance',()=>{
 const q=row('convex-octagon-parallel-pairs'),poly=q.params.polygon;assert.equal(poly.length,8);assert.deepEqual(parallelPolygonPairs(poly),[[0,4],[1,5],[2,6]]);assert.equal(calc(q),'3');
 const turns=poly.map((a,i)=>{const b=poly[(i+1)%8],c=poly[(i+2)%8];return (b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);});assert.ok(turns.every(v=>v>0));assert.equal(perpendicular([9-6,3],[8-9,6-3]),false,'Changed bevel does not silently create an extra square-grid relation');
});
test('parallel line spacing counts five cell gaps then converts3mm, not six endpoints',()=>{
 const q=row('parallel-grid-spacing');assert.equal(calc(q),'15');assert.equal(q.params.secondY-q.params.firstY,5);assert.notEqual(calc(q),'18');const svg=svgFor(q);assert.match(svg,/data-row="-2"/);assert.match(svg,/data-row="3"/);
});
test('native directions, angle endpoints and segment integer grid nodes are bound to actual SVG data',()=>{
 for(const q of pack.editions){const svg=svgFor(q);assert.doesNotMatch(svg,/NaN|Infinity/);for(const r of q.params.rays||[])assert.ok(svg.includes('data-ray="'+r.label+'" data-degrees="'+r.degrees+'"'));for(const r of q.params.points||[])assert.ok(svg.includes('data-point="'+r.label+'" data-x="'+r.x+'" data-y="'+r.y+'"'));}
 const svg=svgFor(row('parallel-segment-count'));for(const m of svg.matchAll(/data-grid-start="([^"]+)" data-grid-end="([^"]+)"/g)){assert.ok(m[1].split(',').concat(m[2].split(',')).map(Number).every(Number.isInteger));}assert.equal([...svg.matchAll(/data-grid-start=/g)].length,6);
});
test('mutated parameters cannot retain stale exact text, accessible geometry or native SHA',()=>{
 const q=row('named-linear-pair');q.params.rays.find(r=>r.label==='D').degrees=113;q.params.givenDegrees=113;q.params.rays.find(r=>r.label==='C').degrees=293;q.answer='67';assert.throws(()=>verifyEdition(q),/statement/);q.statement=statementFor(q);assert.throws(()=>verifyEdition(q),/solution/);q.solution=solutionFor(q);assert.throws(()=>verifyEdition(q),/accessible/);q.figureDescription=descriptionFor(q);assert.throws(()=>verifyEdition(q),/SVG digest/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {prepareVisualWave13} from '../scripts/editorial/visual-wave13-prepare.mjs';
import {solidEdges,cuboid,pyramid,independentlyCalculate,statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave13-models.mjs';
const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8')),pack=read('problems/editorial/batches/visual-wave13-spatial-solids.json'),row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave13-'+s)),calc=q=>independentlyCalculate(q).answer;
test('7 source-addressed drafts exhaust all captured visual7.1 solids without source traces',()=>{
 assert.equal(pack.editions.length,7);assert.deepEqual(prepareVisualWave13(),pack);assert.equal(pack.coverage.sourceVisualOccurrences,7);assert.equal(pack.publication.allowed,false);
 for(const q of pack.editions){const raw=read(q.sourceRefs[0].sourceFile).questions[Number(q.sourceOccurrenceId.split('#').at(-1))];assert.equal(editionHash(raw),q.sourceCanonicalSha256);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');assert.equal(q.minimumPlan,'pro');const v=verifyEdition(q);assert.equal(v.answer,q.answer);assert.ok(Array.isArray(v.checks)&&v.checks.length>0);if(!q.options){assert.match(q.answer,/^\d+$/);assert.match(q.statement,/Жауапқа тек санды жазыңыз\.$/);}const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);}
});
test('all7 keys follow distinct geometric definitions independently of stored answers',()=>{
 assert.deepEqual(pack.editions.map(calc),['HH₁','12','7','CM','68','12','PR']);for(const q of pack.editions){const wrong=structuredClone(q);wrong.answer='invalid';assert.equal(calc(wrong),q.answer);assert.throws(()=>verifyEdition(wrong),/Independent spatial answer/);}
});
test('closed cuboid has12 edges and exactly3 rear-lower hidden edges from actual face normals',()=>{
 const q=row('cuboid-hidden-vertical-edge'),data=cuboid(q.params);assert.equal(data.edges.length,12);assert.equal(Object.keys(data.vertices).length,8);assert.equal(data.faces.length,6);assert.deepEqual(data.edges.filter(e=>!e.visible).map(e=>e.key).sort(),['E:H','G:H','H:H₁']);assert.equal(calc(q),'HH₁');assert.ok(q.params.candidates.filter(([a,b])=>data.edges.some(e=>!e.visible&&e.key===[a,b].sort().join(':'))).length===1);
});
test('closed-solid incidence rejects a missing face rather than guessing hidden styles',()=>{
 const data=cuboid(row('cuboid-hidden-vertical-edge').params);assert.throws(()=>solidEdges(data.vertices,data.faces.slice(1)),/two faces/);
});
test('solid3×2×2 block counts two full layers including fully occluded cells',()=>{
 const q=row('solid-cube-block-count');assert.equal(calc(q),'12');assert.deepEqual(independentlyCalculate(q).checks,{layers:2,cellsPerLayer:6});assert.equal(3*2*2,12);const svg=svgFor(q);assert.equal([...svg.matchAll(/data-face="/g)].length,3);
});
test('base radius7 comes from diameter14, with height11 an explicit irrelevant dimension',()=>{
 const q=row('cylinder-diameter-to-radius');assert.equal(calc(q),'7');assert.deepEqual(independentlyCalculate(q).checks,{diameter:14,irrelevantHeight:11});assert.notEqual(q.params.height,7);assert.notEqual(q.params.diameter,7);assert.match(svgFor(q),/>14 см<\/text>/);assert.match(svgFor(q),/>11 см<\/text>/);
});
test('cone radius connects center C to rim M rather than heightTC, generatorTM or diameterMN',()=>{
 const q=row('cone-center-radius-segment');assert.equal(calc(q),'CM');assert.deepEqual(independentlyCalculate(q).checks,{center:'C',rim:['M','N'],diameter:'MN',height:'TC'});assert.deepEqual(q.options,['TC','TM','MN','CM']);
});
test('sum includes all12 edge lengths as4×(8+5+4), not just the three given edges',()=>{
 const q=row('all-twelve-cuboid-edges'),r=independentlyCalculate(q);assert.equal(calc(q),'68');assert.equal(r.checks.totalEdges,12);assert.deepEqual([8,5,4].map(v=>r.checks.edgeLengths.filter(n=>n===v).length),[4,4,4]);assert.equal(4*(8+5+4),68);
});
test('new convex hexagonal pyramid has6 base and6 lateral edges including hidden ones',()=>{
 const q=row('six-sided-pyramid-edges'),data=pyramid(q.params);assert.equal(calc(q),'12');assert.equal(data.faces.length,7);assert.equal(Object.keys(data.vertices).length,7);assert.equal(data.edges.filter(e=>!e.visible).length,3);assert.deepEqual(independentlyCalculate(q).checks.baseEdges,6);assert.deepEqual(independentlyCalculate(q).checks.lateralEdges,6);const b=q.params.base;assert.ok(b.every((a,i)=>{const c=b[(i+1)%b.length],d=b[(i+2)%b.length];return (c[0]-a[0])*(d[1]-c[1])-(c[1]-a[1])*(d[0]-c[0])>0;}));
});
test('tetrahedron PR is the only hidden base edge, with all6 actual edges still present',()=>{
 const q=row('triangular-pyramid-hidden-base'),data=pyramid(q.params);assert.equal(calc(q),'PR');assert.equal(data.edges.length,6);assert.deepEqual(data.edges.filter(e=>!e.visible).map(e=>e.key),['P:R']);const svg=svgFor(q);assert.match(svg,/<text x="216" y="24"[^>]*>T<\/text>/,'Top apex label remains readable inside the viewport');
});
test('actual native dashed-edge tags agree exactly with computed visibility for every polyhedron',()=>{
 for(const q of pack.editions.filter(q=>['cuboid','pyramid'].includes(q.params.scene))){const data=q.params.scene==='cuboid'?cuboid(q.params):pyramid(q.params),svg=svgFor(q),matches=[...svg.matchAll(/data-edge="([^"]+)" data-hidden="(true|false)"([^>]*)/g)];assert.equal(matches.length,data.edges.length);for(const m of matches){const e=data.edges.find(e=>e.key===m[1]);assert.ok(e);assert.equal(m[2],String(!e.visible));assert.equal(m[3].includes('stroke-dasharray='),!e.visible);}}
});
test('parameter change invalidates native picture and descriptive measurements after recomputing the answer',()=>{
 const q=row('cylinder-diameter-to-radius');q.params.diameter=16;q.answer='8';assert.throws(()=>verifyEdition(q),/solution/);q.solution=solutionFor(q);assert.throws(()=>verifyEdition(q),/accessible/);q.figureDescription=descriptionFor(q);assert.throws(()=>verifyEdition(q),/SVG digest/);
});

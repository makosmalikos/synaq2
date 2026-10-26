import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {prepareVisualWave8} from '../scripts/editorial/visual-wave8-prepare.mjs';
import {symmetryAxes,hasCentralSymmetry,twiceArea,independentlyCalculate,statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave8-models.mjs';
const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8')),pack=read('problems/editorial/batches/visual-wave8-plane-symmetry.json'),row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave8-'+s)),calc=q=>independentlyCalculate(q).answer;
test('15 source-addressed drafts plus2 retained editions exhaust all17 visual sources of6.4–6.6',()=>{
 assert.equal(pack.editions.length,15);assert.deepEqual(prepareVisualWave8(),pack);assert.equal(pack.coverage.sourceVisualOccurrences,17);assert.equal(pack.coverage.previousEditionsRetained.length,2);assert.equal(pack.publication.allowed,false);
 for(const q of pack.editions){const raw=read(q.sourceRefs[0].sourceFile).questions[Number(q.sourceOccurrenceId.split('#').at(-1))];assert.equal(editionHash(raw),q.sourceCanonicalSha256);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');assert.equal(q.minimumPlan,'pro');assert.equal(verifyEdition(q).answer,q.answer);if(!q.options){assert.match(q.answer,/^\d+$/);assert.match(q.statement,/Жауапқа тек санды жазыңыз\.$/);}const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);}
});
test('all15 keys match separately reasoned geometric results without consulting the stored key',()=>{
 assert.deepEqual(pack.editions.map(calc),['4','4','(0; -5)','2','9','(-4; 3)','M','4','84','R','10','3','E','6','10']);
 for(const q of pack.editions){const bad=structuredClone(q);bad.answer='not a key';assert.equal(calc(bad),q.answer);assert.throws(()=>verifyEdition(bad),/Independent grid\/symmetry answer/);}
});
test('coordinate order, ordinate and a zero abscissa are three distinct requested skills',()=>{
 assert.equal(calc(row('read-ordinate')),'4');assert.equal(calc(row('negative-y-axis-point')),'(0; -5)');assert.equal(calc(row('ordered-coordinate-pair')),'(-4; 3)');assert.equal(calc(row('find-given-coordinate')),'M');
});
test('axis membership includes either zero coordinate and quadrant II excludes zero coordinates',()=>{
 assert.equal(calc(row('points-on-axes')),'4');const q=row('second-quadrant-members');assert.equal(calc(q),'2');assert.ok(q.params.points.some(r=>r.x===0&&r.y>0),'Explicit positive y-axis point is not counted');
});
test('horizontal metric counts unit gaps and is not an endpoint count',()=>{
 const q=row('horizontal-grid-length');assert.equal(calc(q),'9');assert.equal(q.params.points[0].y,q.params.points[1].y);assert.notEqual(q.answer,'10');
});
test('gallery symmetry is exact for concave boundaries and separates axial from central symmetry',()=>{
 const q=row('reflection-axis-gallery');assert.deepEqual(q.params.polygons.map(poly=>symmetryAxes(poly).length),[1,0,1,0,2,1]);assert.equal(calc(q),'4');
 assert.equal(hasCentralSymmetry(q.params.polygons[1]),true);assert.equal(symmetryAxes(q.params.polygons[1]).length,0,'Oblique non-rhombic parallelogram has a half turn but no reflection axis');
 assert.equal(twiceArea(q.params.polygons[2]),36);assert.equal(symmetryAxes(q.params.polygons[2]).length,1,'Concave notch does not destroy its one exact vertical mirror');
 const shifted=q.params.polygons[2].map(([x,y])=>[-y+11,x-7]);assert.equal(symmetryAxes(shifted).length,1);
});
test('the reflection search finds diagonal axes and does not confuse rectangle and square axis counts',()=>{
 assert.equal(symmetryAxes([[0,0],[6,0],[6,2],[0,2]]).length,2);
 assert.equal(symmetryAxes([[0,0],[4,0],[4,4],[0,4]]).length,4);
 assert.equal(symmetryAxes([[0,2],[2,0],[4,2],[2,4]]).length,4);
});
test('mirror candidate must share the original row as well as its perpendicular distance',()=>{
 const q=row('vertical-mirror-candidate');assert.equal(calc(q),'R');const a=q.params.points.find(r=>r.label==='A'),p=q.params.points.find(r=>r.label==='P');assert.equal(p.x,-a.x);assert.notEqual(p.y,a.y);assert.equal(calc(row('full-mirror-distance')),'10');assert.notEqual(calc(row('full-mirror-distance')),'5');
});
test('angle mirror bisects the full angle and actual native rays have opposite signed half angles',()=>{
 const q=row('reflection-bisects-angle');assert.equal(calc(q),'84');const svg=svgFor(q);assert.match(svg,/data-ray-degrees="42"/);assert.match(svg,/data-ray-degrees="-42"/);assert.match(svg,/>42°</);assert.doesNotMatch(svg,/>84°</);
});
test('a central image negates both coordinates or uses a nonzero midpoint, preserving reflected triangle area',()=>{
 assert.equal(calc(row('origin-half-turn-point')),'E');assert.equal(calc(row('line-midpoint-image')),'6');
 const gallery=row('half-turn-gallery');assert.deepEqual(gallery.params.polygons.map(hasCentralSymmetry),[false,false,true,false]);assert.equal(calc(gallery),'3');
 const q=row('half-turn-triangle-area');assert.equal(calc(q),'10');assert.equal(5*4/2,10);const desc=descriptionFor(q);assert.doesNotMatch(desc,/бейне ауданы 10|A₁\(/i);
});
test('native actual point positions and complete polygon vertices are bound to the authored integer grid',()=>{
 for(const q of pack.editions){const svg=svgFor(q);for(const r of q.params.points||[])assert.ok(svg.includes('data-point="'+r.label+'" data-x="'+r.x+'" data-y="'+r.y+'"'));for(const [i,poly]of(q.params.polygons||[]).entries())assert.ok(svg.includes('data-polygon="'+(i+1)+'" data-vertices="'+poly.map(r=>r.join(',')).join(';')+'"'));assert.doesNotMatch(svg,/NaN|Infinity/);}
});
test('origin and the nearby negative-row point label leave space for numeric x-axis labels',()=>{
 const svg=svgFor(row('second-quadrant-members'));assert.match(svg,/<text x="250" y="198"[^>]*>0<\/text>/);assert.match(svg,/<text x="358" y="222"[^>]*>E<\/text>/);
});
test('changing a point or half angle invalidates the bound solution, description and exact SVG',()=>{
 const q=row('reflection-bisects-angle');q.params.half=43;q.answer='86';assert.throws(()=>verifyEdition(q),/solution/);q.statement=statementFor(q);q.solution=solutionFor(q);assert.throws(()=>verifyEdition(q),/accessible/);q.figureDescription=descriptionFor(q);assert.throws(()=>verifyEdition(q),/SVG digest/);
});

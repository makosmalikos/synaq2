import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {prepareVisualWave12} from '../scripts/editorial/visual-wave12-prepare.mjs';
import {displacement,squaredLength,independentlyCalculate,statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave12-models.mjs';
const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8')),pack=read('problems/editorial/batches/visual-wave12-vectors.json'),row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave12-'+s)),calc=q=>independentlyCalculate(q).answer;
test('all10 topic7.2 inventory entries are addressed;3 genuine text-only sources are not called missing images',()=>{
 assert.equal(pack.editions.length,10);assert.deepEqual(prepareVisualWave12(),pack);assert.equal(pack.coverage.sourceVisualOccurrences,10);assert.equal(pack.coverage.actualSourceImageOccurrences,7);assert.equal(pack.coverage.textOnlySourcesWithinInventory.length,3);assert.equal(pack.publication.allowed,false);
 for(const q of pack.editions){const raw=read(q.sourceRefs[0].sourceFile).questions[Number(q.sourceOccurrenceId.split('#').at(-1))];assert.equal(editionHash(raw),q.sourceCanonicalSha256);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');assert.equal(q.minimumPlan,'pro');const v=verifyEdition(q);assert.equal(v.answer,q.answer);assert.ok(Array.isArray(v.checks)&&v.checks.length>0);if(!q.options){assert.match(q.answer,/^-?\d+$/);assert.match(q.statement,/Жауапқа тек санды жазыңыз\.$/);}const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);if(pack.coverage.textOnlySourcesWithinInventory.includes(raw.id)){assert.equal(raw.images.length,0);assert.equal(raw.svg.length,0);assert.doesNotMatch(raw.statement,/\[Image:/);}}
});
test('10 independently reasoned keys ignore stored answers',()=>{
 assert.deepEqual(pack.editions.map(calc),['21','Модульдері тең, бағыттары қарама-қарсы','2','солтүстік-батысқа','-4','8','vector(PQ)','7','vector(c)','P басынан Q нүктесі арқылы өтетін сәулеге']);for(const q of pack.editions){const wrong=structuredClone(q);wrong.answer='invalid';assert.equal(calc(wrong),q.answer);assert.throws(()=>verifyEdition(wrong),/Independent vector answer/);}
});
test('nonzero tail3 to head10 means7 unit gaps then3km/h each, never10×3',()=>{
 const q=row('nonzero-origin-speed');assert.equal(calc(q),'21');assert.deepEqual(independentlyCalculate(q).checks,{gaps:7,unitScale:3});assert.notEqual(10*3,21);
});
test('opposite vectors preserve squared magnitude while negating each displacement component',()=>{
 const q=row('opposite-arrow-comparison'),[a,b]=q.params.vectors;assert.deepEqual(displacement(a),[6,1]);assert.deepEqual(displacement(b),[-6,-1]);assert.equal(squaredLength(a),37);assert.equal(squaredLength(b),37);const svg=svgFor(q);assert.match(svg,/data-start="0,0" data-end="6,1"/);assert.match(svg,/data-start="6,1" data-end="0,0"/);
});
test('only a and e have magnitude6, with reversed e accepted',()=>{
 const q=row('equal-vector-magnitudes');assert.equal(calc(q),'2');assert.deepEqual(independentlyCalculate(q).checks.lengths,[6,4,3,5,6,2]);assert.deepEqual(displacement(q.params.vectors[4]),[-6,0]);
});
test('compass reads arrowhead northwest and not the southeast tail',()=>{
 const q=row('compass-arrow-direction');assert.equal(calc(q),'солтүстік-батысқа');assert.deepEqual(displacement(q.params.vector),[-6,5]);const v=q.params.vector;[v.start,v.end]=[v.end,v.start];assert.equal(calc(q),'оңтүстік-шығысқа');
});
test('head abscissa is negative4 rather than tail3 or head ordinate2',()=>{
 const q=row('arrowhead-abscissa');assert.equal(calc(q),'-4');assert.deepEqual(q.params.vector.start,[3,4]);assert.deepEqual(q.params.vector.end,[-4,2]);
});
test('horizontal8 and vertical7 count gaps across zero while remaining positive magnitudes',()=>{
 assert.equal(calc(row('horizontal-vector-length')),'8');assert.equal(calc(row('vertical-vector-length')),'7');assert.deepEqual(displacement(row('horizontal-vector-length').params.vector),[8,0]);assert.deepEqual(displacement(row('vertical-vector-length').params.vector),[0,7]);
});
test('tail-first mathematical notation and same-ordered ray names follow the actual endpoint labels',()=>{
 const q=row('tail-first-vector-notation');assert.equal(q.params.vector.startLabel,'P');assert.equal(q.params.vector.endLabel,'Q');assert.equal(calc(q),'vector(PQ)');assert.ok(q.options.includes('vector(QP)'));assert.equal(calc(row('ray-matches-vector-direction')),'P басынан Q нүктесі арқылы өтетін сәулеге');
});
test('largest c magnitude7 is compared against5,3,4 on equal-unit gallery scales',()=>{
 const q=row('largest-vector-magnitude');assert.equal(calc(q),'vector(c)');assert.deepEqual(independentlyCalculate(q).checks.squaredLengths,[25,9,49,16]);
 const svg=svgFor(q);assert.match(svg,/<text x="48" y="18" font-size="21"/,'Top gallery labels stay inside the image');assert.doesNotMatch(svg,/NaN|Infinity/);
});
test('actual native arrowhead polygons terminate at exact requested endpoints in every panel',()=>{
 for(const q of pack.editions){const svg=svgFor(q),vectors=q.params.vectors||[q.params.vector].filter(Boolean);if(q.params.scene==='ray-scale')vectors.push({end:[q.params.end,0]});for(const v of vectors)assert.ok(svg.includes('data-arrow-tip="'+v.end.join(',')+'"'));for(const m of svg.matchAll(/data-arrow-tip="[^"]+" points="([^"]+)"/g)){const a=m[1].split(' ').map(v=>v.split(',').map(Number));assert.ok(a.every(p=>p.every(Number.isFinite)));assert.equal(a.length,3);}}
});
test('endpoint changes invalidate question solution, accessible geometry and native SHA',()=>{
 const q=row('arrowhead-abscissa');q.params.vector.end=[-5,2];q.answer='-5';assert.throws(()=>verifyEdition(q),/solution/);q.solution=solutionFor(q);assert.throws(()=>verifyEdition(q),/accessible/);q.figureDescription=descriptionFor(q);assert.throws(()=>verifyEdition(q),/SVG digest/);
});

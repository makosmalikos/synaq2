import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {prepareVisualWave5} from '../scripts/editorial/visual-wave5-prepare.mjs';
import {independentlyCalculate,divisionTrace,statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave5-models.mjs';
const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8')),pack=read('problems/editorial/batches/visual-wave5-rational-visuals.json'),row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave5-'+s)),calc=q=>independentlyCalculate(q).answer;
test('25 addressed drafts plus1 retained source exhaust the stated26 visual source occurrences with full raw hashes',()=>{
 assert.equal(pack.editions.length,25);assert.deepEqual(prepareVisualWave5(),pack);assert.equal(pack.publication.allowed,false);assert.equal(pack.coverage.sourceVisualOccurrences,26);assert.equal(pack.coverage.previousEditionsRetained.length,1);assert.equal(new Set(pack.editions.map(q=>q.sourceOccurrenceId)).size,25);
 for(const q of pack.editions){
  const r=read(q.sourceRefs[0].sourceFile).questions[Number(q.sourceOccurrenceId.split('#').at(-1))];assert.equal(editionHash(r),q.sourceCanonicalSha256);
  assert.equal(q.grade,6);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');assert.equal(q.minimumPlan,'pro');assert.equal(verifyEdition(q).answer,q.answer);
  if(!q.options){assert.match(q.answer,/^-?\d+(?:,\d+)?$/);assert.match(q.statement,/Жауапқа тек санды жазыңыз\.$/);}
  const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);
  assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);
 }
});
test('all25 source-specific golden answers are reconstructed independently of their stored key',()=>{
 const expected=['(-3) · 4 = -12','-20','3 · 7 = 7 · 3','-125 және -8','900','4','-4','-4','2','0,(428571)','N','5','-5','-3,5','9','7','P және R','8','10','18','(2 + (3/5))','-4','7','10','B'];
 assert.deepEqual(pack.editions.map(calc),expected);
 for(const q of pack.editions){const bad=structuredClone(q);bad.answer='not a key';assert.equal(calc(bad),q.answer);assert.throws(()=>verifyEdition(bad),/Independent rational-model answer/);}
});
test('equal jump factors preserve the indicated size/count order, not merely the same product',()=>{
 const q=row('equal-left-jumps');assert.equal(calc(q),'(-3) · 4 = -12');assert.ok(q.options.includes('(-4) · 3 = -12'));assert.notEqual(q.answer,'(-4) · 3 = -12');
 const svg=svgFor(q);assert.equal((svg.match(/data-jump-from=/g)||[]).length,4);assert.match(svg,/data-jump-from="-9" data-jump-to="-12"/);
});
test('row/column geometry, round grouping and the full three-factor product are separate skills',()=>{
 const q=row('row-column-mosaic');assert.equal((svgFor(q).match(/data-cell=/g)||[]).length,21);assert.equal(calc(q),'3 · 7 = 7 · 3');
 assert.equal(calc(row('round-product-pair')),'-125 және -8');assert.equal(calc(row('three-factor-cards')),'900');
});
test('division keeps operand order, negative coordinates, and positive cooling magnitude distinct',()=>{
 const q=row('ordered-coordinate-quotient');assert.equal(calc(q),'-4');assert.notEqual(calc(q),'-1/4');[q.params.first,q.params.second]=[q.params.second,q.params.first];assert.throws(()=>calc(q),/opposite-signed point operands/);
 assert.equal(calc(row('first-equal-left-part')),'-4');assert.notEqual(calc(row('first-equal-left-part')),'6');assert.equal(calc(row('uniform-hourly-cooling')),'4');assert.notEqual(calc(row('uniform-hourly-cooling')),'-4');
});
test('period lengths and digit order match an independent multiplicative-order and rational-identity oracle',()=>{
 const order=d=>{let r=1;for(let length=1;length<=d;length++){r=r*10%d;if(r===1)return length;}throw Error('No order');};
 assert.equal(order(11),2);assert.equal(order(7),6);assert.equal(3*(10**2-1),11*27);assert.equal(3*(10**6-1),7*428571);
 assert.equal(calc(row('remainder-period-length')),String(order(11)));assert.equal(calc(row('remainder-period-notation')),'0,(428571)');
 assert.equal(divisionTrace(1,8).period,0);assert.equal(divisionTrace(1,8).cycleStart,null);
 const q=row('remainder-period-notation');q.params.trace[0][1]=1;assert.throws(()=>calc(q),/Every displayed long-division remainder/);
});
test('ninths locate a repeating decimal exactly and sector completion counts only uncolored required pieces',()=>{
 const q=row('repeat-on-ninths');assert.equal(calc(q),'N');assert.equal(q.params.points.find(r=>r.label==='N').tick*9,7*q.params.denominator);
 const s=row('repeat-sector-remainder'),svg=svgFor(s);assert.equal((svg.match(/data-sector=/g)||[]).length,9);assert.equal((svg.match(/data-colored="true"/g)||[]).length,3);assert.equal(calc(s),'5');
});
test('unit gaps and quarter gaps are counted as intervals, not point marks or full-unit lengths',()=>{
 assert.equal(calc(row('count-unit-intervals')),'7');
 const q=row('count-quarter-gaps');assert.equal(calc(q),'8');const points=q.params.points;assert.equal(Math.abs(points[1].tick-points[0].tick)/q.params.denominator,2);assert.notEqual(calc(q),'2');assert.notEqual(calc(q),'9');
 assert.equal(calc(row('read-negative-half')),'-3,5');
});
test('two labelled coordinates calibrate a non-unit scale and hidden coordinates stay absent from given text',()=>{
 const q=row('calibrate-from-two-labels');assert.equal(calc(q),'10');const desc=descriptionFor(q);assert.match(desc,/C — белгісіз координата/);assert.match(desc,/арасында 4 тең аралық/);assert.match(desc,/оңға 3 сондай аралықта/);assert.doesNotMatch(desc,/C\(10\)/);
 q.params.labels=[-8,4];assert.throws(()=>calc(q),/actually printed labels/);
 const b=row('negative-from-origin-gap');assert.match(descriptionFor(b),/санақ басының сол жағында/);assert.doesNotMatch(descriptionFor(b),/M\(-4\)/);assert.equal(calc(b),'-4');
});
test('absolute value preserves an entire mixed numeral, sums opposite magnitudes and differs from signed order',()=>{
 assert.equal(calc(row('whole-mixed-modulus')),'(2 + (3/5))');assert.equal(2*5+3,13);assert.notEqual(2*5-3,13);
 assert.equal(calc(row('thermometer-modulus')),'18');assert.equal(calc(row('point-coordinate-modulus')),'7');
 assert.equal(calc(row('sum-opposite-moduli')),'10');const q=row('farthest-point-modulus');assert.equal(calc(q),'B');assert.equal(q.params.points.find(r=>r.label==='D').tick,6);assert.equal(q.params.points.find(r=>r.label==='B').tick,-7);
});
test('native point coordinates bind exact integer numerator positions rather than rounded fractions',()=>{
 for(const q of pack.editions){const svg=svgFor(q);if(q.params.points)for(const r of q.params.points)assert.ok(svg.includes('data-point="'+r.label+'" data-numerator="'+r.tick+'" data-denominator="'+q.params.denominator+'"'));assert.doesNotMatch(svg,/NaN|Infinity/);}
});
test('edited numeric givens cannot retain a stale condition, worked solution, description, or native digest',()=>{
 const q=row('uniform-hourly-cooling');q.params.hours=4;q.answer='7';assert.throws(()=>verifyEdition(q),/condition/);
 q.statement=statementFor(q);q.solution=solutionFor(q);assert.throws(()=>verifyEdition(q),/description/);
 q.figureDescription=descriptionFor(q);assert.throws(()=>verifyEdition(q),/SVG digest/);
});

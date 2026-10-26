import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {independentlyCalculate,statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave4-models.mjs';
import {prepareVisualWave4} from '../scripts/editorial/visual-wave4-prepare.mjs';
const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8'));
const pack=read('problems/editorial/batches/visual-wave4-signed-scales.json');
const row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave4-'+s)),calc=q=>independentlyCalculate(q).answer;
test('37 new addressed editions plus1 retained edition exhaust all38 visual occurrences of the stated nine topics',()=>{
 assert.equal(pack.editions.length,37);assert.equal(pack.status,'draft_awaiting_independent_review');assert.equal(pack.publication.allowed,false);
 assert.equal(new Set(pack.editions.map(q=>q.sourceOccurrenceId)).size,37);
 assert.deepEqual(prepareVisualWave4(),pack);
 const inv=read('problems/editorial/batches/visual-inventory.json');
 for(const q of pack.editions){
  const r=inv.records.find(r=>r.occurrenceId===q.sourceOccurrenceId),raw=read(r.sourceFile).questions[r.sourceIndex];
  assert.equal(q.sourceCanonicalSha256,editionHash(raw));assert.notEqual(q.statement,raw.statement);assert.notEqual(q.answer,String(raw.sourceAnswer));
  assert.equal(q.grade,6);assert.equal(q.minimumPlan,'pro');assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');
  assert.equal(verifyEdition(q).answer,q.answer);
  const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);
  assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);
 }
});
test('all source-specific golden answers are independently reconstructed without reading the stored key',()=>{
 const expected=['3','-25','D','55','C: +90 м','5','480 м; -300 м','32','5','11','8','11','5 − 11 = -6','14','75','10','15','-5','B және D','2','A','-4 және -3','A','R','3','Көкшетау','-8','4','6','(-3) + 8 = 5','(-4) + (-7) = -11','17','-10','-5','(-6) + 10 = 4','9','-11'];
 assert.deepEqual(pack.editions.map(calc),expected);
 for(const q of pack.editions){const bad=structuredClone(q);bad.answer='not a key';assert.equal(calc(bad),q.answer);assert.throws(()=>verifyEdition(bad),/Independent tick-index answer/);}
});
test('daily negative bars, prefix losses and total net result are different tasks',()=>{
 assert.equal(calc(row('daily-loss')),'3');assert.equal(calc(row('shop-net-result')),'55');
 const q=row('running-loss-days');assert.equal(q.params.ticks.filter(n=>n<0).length,3);assert.equal(calc(q),'5');
 assert.ok(q.params.ticks.reduce((a,b)=>a+b,0)>0,'A final profit does not erase previous negative prefixes');
});
test('temperature level, positive frost depth and total variation keep the requested sign and magnitude semantics',()=>{
 assert.equal(calc(row('negative-thermometer')),'-25');
 assert.equal(calc(row('frost-magnitude')),'17');assert.notEqual(calc(row('frost-magnitude')),'-17');
 assert.equal(calc(row('sensor-descent')),'-11');assert.notEqual(calc(row('sensor-descent')),'11');
 assert.equal(calc(row('four-measurement-changes')),'32');assert.notEqual(calc(row('four-measurement-changes')),'4');
 assert.equal(calc(row('warming-above-zero')),'5');assert.equal(calc(row('morning-warming')),'9');
});
test('unit distances differ from raw tick counts and from signed displacement',()=>{
 const q=row('three-unit-ticks');assert.equal(Math.abs(q.params.points[0].tick-q.params.points[1].tick),5);assert.equal(calc(q),'15');
 assert.equal(calc(row('signed-left-displacement')),'-8');assert.notEqual(calc(row('signed-left-displacement')),'8');
 assert.equal(calc(row('cross-zero-segment')),'11');assert.equal(calc(row('unit-line-distance')),'10');
 assert.equal(calc(row('platform-water-gap')),'75');
});
test('half-unit points do not all have integer coordinates; negative neighbours use floor rather than truncation',()=>{
 const q=row('integer-point-count');assert.equal(calc(q),'2');
 q.params.points.find(r=>r.label==='D').tick=9;assert.equal(calc(q),'1','Moving the marked zero to+0.5 removes exactly one integer point');
 assert.equal(calc(row('negative-neighbours')),'-4 және -3');
 assert.equal(calc(row('greatest-negative-point')),'A');
});
test('strict inequalities exclude an explicit threshold point and point-pair distances are unambiguous',()=>{
 assert.equal(calc(row('strict-double-bound')),'R');assert.equal(calc(row('below-strict-threshold')),'3');
 const q=row('below-strict-threshold'),a=q.params.points.map(r=>q.params.min+r.tick*q.params.step);
 assert.equal(a.filter(x=>x<=q.params.bound).length,4);assert.equal(a.filter(x=>x<q.params.bound).length,3);
 const pair=row('choose-distance-pair');assert.equal(calc(pair),'B және D');pair.params.goal=3;assert.throws(()=>calc(pair),/Expected values to be strictly equal/);
});
test('the negative-integer set classification preserves Z outside N, with fresh region letters',()=>{
 assert.equal(calc(row('negative-integer-region')),'A');
 const q=row('negative-integer-region');q.params.numerator=14;assert.throws(()=>calc(q),/negative integer/);
});
test('equations retain the actual start, arrow direction and second addend',()=>{
 assert.equal(calc(row('positive-jump-equation')),'(-3) + 8 = 5');
 assert.equal(calc(row('mixed-jump-equation')),'(-6) + 10 = 4');
 assert.equal(calc(row('left-arrow-subtraction')),'5 − 11 = -6');
 assert.equal(calc(row('two-left-jumps')),'(-4) + (-7) = -11');
 const bad=row('read-start-then-move');bad.params.change=8;assert.throws(()=>calc(bad));
 const moved=row('mixed-jump-equation');moved.params.arrows[0].from=-5;assert.throws(()=>calc(moved),/starts at its named point/);
});
test('unknown endpoints and restored coordinates are not printed as ready numerical givens',()=>{
 for(const suffix of['read-start-then-move','given-start-then-move','mixed-left-result']){
  const q=row(suffix),desc=svgFor(q).match(/<desc[^>]*>(.*?)<\/desc>/s)[1];assert.match(desc,/\? — белгісіз координата/);assert.doesNotMatch(desc,/\?\(-?\d/);
  assert.ok(!q.params.labels.includes(Number(q.answer)),'The requested endpoint is not a scale-label giveaway');
 }
 const q=row('restore-left-coordinate'),svg=svgFor(q);assert.equal(calc(q),'-5');
 assert.equal(q.params.hideTicks,true);assert.deepEqual(q.params.labels,[3]);assert.doesNotMatch(svg,/<text[^>]*>-5<\/text>/);
 assert.match(svg,/M — белгісіз координата/);
 assert.match(svg,/8 бірлік/);assert.match(svg,/y1="154"[^>]*y2="154"/);assert.match(svg,/viewBox="0 0 480 190"/);
});
test('native actual tick indices and directed arrows match the same authored geometry used by the checker',()=>{
 for(const q of pack.editions){
  const svg=svgFor(q),p=q.params;
  if(p.points)for(const r of p.points){const token='data-point="'+r.label+'" data-tick-index="'+r.tick+'"';assert.ok(svg.includes(token));}
  if(p.arrows)for(const a of p.arrows)assert.ok(svg.includes('data-arrow-from="'+a.from+'" data-arrow-to="'+a.to+'"'));
  if(p.readings)for(const r of p.readings)assert.ok(svg.includes('data-reading-tick="'+r.tick+'"'));
  assert.doesNotMatch(svg,/NaN|Infinity/);
 }
});
test('a revised given cannot retain a stale condition, solution or SVG hash',()=>{
 const q=row('warming-above-zero');q.params.change=15;q.answer='6';assert.throws(()=>verifyEdition(q),/condition/);
 q.statement=statementFor(q);q.solution=solutionFor(q);assert.throws(()=>verifyEdition(q),/accessible description/);
 q.figureDescription=descriptionFor(q);assert.throws(()=>verifyEdition(q),/SVG digest/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {prepareVisualWave6} from '../scripts/editorial/visual-wave6-prepare.mjs';
import {independentlyCalculate,statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave6-models.mjs';
const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8')),pack=read('problems/editorial/batches/visual-wave6-flow-percent.json'),row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave6-'+s)),calc=q=>independentlyCalculate(q).answer;
test('nine source-addressed drafts cover both complete visual topics and retain full raw hashes',()=>{
 assert.equal(pack.editions.length,9);assert.deepEqual(prepareVisualWave6(),pack);assert.equal(pack.publication.allowed,false);assert.equal(pack.coverage.sourceVisualOccurrences,9);
 for(const q of pack.editions.filter(q=>!q.options)){assert.match(q.answer,/^\d+$/);assert.match(q.statement,/Жауапқа тек санды жазыңыз\.$/);}
 for(const q of pack.editions){const raw=read(q.sourceRefs[0].sourceFile).questions[Number(q.sourceOccurrenceId.split('#').at(-1))];assert.equal(editionHash(raw),q.sourceCanonicalSha256);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');assert.equal(q.minimumPlan,'pro');assert.equal(verifyEdition(q).answer,q.answer);const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);}
});
test('all nine keys agree with independently enumerated motion/exact-fraction results',()=>{
 assert.deepEqual(pack.editions.map(calc),['5','10','80','Ағысқа қарсы, 13 км/сағ','6','387','11040','81000','70']);
 for(const q of pack.editions){const bad=structuredClone(q);bad.answer='not a key';assert.equal(calc(bad),q.answer);assert.throws(()=>verifyEdition(bad),/Independent signed-motion/);}
});
test('a raft uses only current speed and its unknown current is not printed as a ready answer',()=>{
 assert.equal(calc(row('drifting-raft-time')),'10');const q=row('infer-raft-current');assert.equal(calc(q),'6');assert.match(descriptionFor(q),/жылдамдығы белгісіз/);assert.doesNotMatch(descriptionFor(q),/6 км\/сағ/);assert.match(svgFor(q),/Ағыс: \? км\/сағ/);
 q.params.boatSpeed=1;assert.throws(()=>calc(q));
});
test('opposed arrows subtract speed while downstream arrows add it before distance or time',()=>{
 const q=row('upstream-bank-speed');assert.equal(q.params.boatDirection,-1);assert.equal(q.params.currentDirection,1);assert.equal(calc(q),'Ағысқа қарсы, 13 км/сағ');assert.notEqual(q.answer,'Ағысқа қарсы, 23 км/сағ');assert.match(svgFor(q),/data-boat-direction="-1"/);assert.match(svgFor(q),/data-current-direction="1"/);assert.equal(calc(row('downstream-travel-time')),'5');assert.equal(calc(row('downstream-distance')),'80');
});
test('salt and water masses sum exactly to total solution mass',()=>{
 const q=row('water-complement-mass');assert.equal(450*14/100,63);assert.equal(450-63,387);assert.equal(calc(q),'387');assert.notEqual(calc(q),'63');
});
test('successive discount and increase use new bases rather than one additive percentage shortcut',()=>{
 const q=row('two-price-changes');assert.equal(12000-2400,9600);assert.equal(9600+1440,11040);assert.equal(calc(q),'11040');assert.notEqual(Number(q.answer),12000*(100-20+15)/100);assert.match(descriptionFor(q),/Аралық және соңғы сомалар белгісіз/);assert.doesNotMatch(svgFor(q),/>9600<|>11040</);
});
test('compound growth uses a constant ratio, not a constant monetary increment',()=>{
 const q=row('infer-compound-growth');assert.equal(72000/64000,9/8);assert.equal(72000*9/8,81000);assert.equal(calc(q),'81000');assert.notEqual(Number(q.answer),72000+(72000-64000));assert.doesNotMatch(svgFor(q),/>81000</);
});
test('rectangle scales bind new lengths separately and enumerated new unit cells, without printed unknown dimensions',()=>{
 const q=row('two-dimension-percent-area'),svg=svgFor(q);assert.equal(calc(q),'70');assert.equal(8*1.25,10);assert.equal(5*1.4,7);assert.match(svg,/data-new-width="240" data-new-height="168"/);assert.match(svg,/data-original-width="192" data-original-height="120"/);assert.doesNotMatch(svg,/>10 см<|>7 см<|>70 см/);assert.notEqual(8*5*(100+25+40)/100,70);
});
test('edited input quantities cannot keep stale text, accessibility, or SVG hashes',()=>{
 const q=row('downstream-distance');q.params.hours=5;q.answer='100';assert.throws(()=>verifyEdition(q),/condition/);q.statement=statementFor(q);q.solution=solutionFor(q);assert.throws(()=>verifyEdition(q),/accessible/);q.figureDescription=descriptionFor(q);assert.throws(()=>verifyEdition(q),/SVG digest/);
});

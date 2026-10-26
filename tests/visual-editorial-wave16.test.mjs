import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {prepareVisualWave16} from '../scripts/editorial/visual-wave16-prepare.mjs';
import {horizontalIntervals,strictlyIncreasingOver,independentlyCalculate,statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave16-models.mjs';
const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8')),pack=read('problems/editorial/batches/visual-wave16-real-processes.json'),row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave16-'+s)),calc=q=>independentlyCalculate(q).answer;
test('all13 source-specific process drafts exhaust visual9.4 and await independent external review',()=>{
 assert.equal(pack.editions.length,13);assert.deepEqual(prepareVisualWave16(),pack);assert.equal(pack.coverage.sourceVisualOccurrences,13);assert.equal(pack.publication.allowed,false);
 for(const q of pack.editions){const raw=read(q.sourceRefs[0].sourceFile).questions[Number(q.sourceOccurrenceId.split('#').at(-1))];assert.equal(editionHash(raw),q.sourceCanonicalSha256);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');assert.equal(q.minimumPlan,'pro');const v=verifyEdition(q);assert.equal(v.answer,q.answer);assert.ok(Array.isArray(v.checks)&&v.checks.length>0);if(!q.options){assert.match(q.answer,/^\d+$/);assert.match(q.statement,/Жауапқа тек санды жазыңыз\.$/);}const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);}
});
test('13 independent keys ignore stored answers and preserve units for MCQ',()=>{
 assert.deepEqual(pack.editions.map(calc),['3','-14 м','55','90 мин','1,5 сағаттан 3,5 сағатқа дейін','110','170','50','300','4 сағаттан 16 сағатқа дейін','4','50','-9°C']);for(const q of pack.editions){const wrong=structuredClone(q);wrong.answer='invalid';assert.equal(calc(wrong),q.answer);assert.throws(()=>verifyEdition(wrong),/Independent process answer/);}
});
test('daylight12 has two annual readings3 and9 but only3 belongs to spring3–5',()=>{
 const q=row('spring-daylight-inverse');assert.equal(calc(q),'3');assert.deepEqual(independentlyCalculate(q).checks.allMonths,[3,9]);assert.equal([...svgFor(q).matchAll(/data-month=/g)].length,12);
});
test('diver minimum preserves negative sign and rejects first shallower plateau',()=>{
 const q=row('lowest-diver-signed-position');assert.equal(calc(q),'-14 м');assert.deepEqual(independentlyCalculate(q).checks,{minimum:-14,firstPlateau:-8});assert.ok(q.options.includes('14 м'));assert.ok(q.options.includes('-8 м'));
});
test('battery decrease is100−45 before later recharging to75, not later net change',()=>{
 const q=row('battery-before-recharge-loss');assert.equal(calc(q),'55');assert.deepEqual(independentlyCalculate(q).checks,{initial:100,after:45,until:5});assert.ok(q.params.points.some(([t,y])=>t>5&&y===75));assert.notEqual(100-60,55);
});
test('cruise duration20→110 is90 minutes, not110 ending minute or12km altitude',()=>{
 const q=row('aircraft-cruise-duration');assert.equal(calc(q),'90 мин');assert.deepEqual(horizontalIntervals(q.params.points),[{start:20,end:110,value:12}]);assert.ok(q.options.includes('110 мин')&&q.options.includes('12 мин'));
});
test('fractional stop endpoints lie at1.5 and3.5 hours although only whole hours are labeled',()=>{
 const q=row('fractional-hour-stationary-interval');assert.equal(calc(q),'1,5 сағаттан 3,5 сағатқа дейін');assert.equal(q.params.xStep,0.5);assert.equal(q.params.xLabelEvery,1);assert.deepEqual(independentlyCalculate(q).checks.interval,{start:1.5,end:3.5,value:6});const svg=svgFor(q);assert.match(svg,/data-x-grid="1.5"/);assert.match(svg,/data-x-grid="3.5"/);assert.doesNotMatch(svg,/>1,5<\/text>|>3,5<\/text>/);
});
test('horizontal maximum speed110 is positive constant motion, while pulse170 is below axis limit180',()=>{
 const speed=row('highest-speed-is-not-stop'),pulse=row('pulse-maximum-below-axis-limit');assert.equal(calc(speed),'110');assert.equal(calc(pulse),'170');assert.equal(pulse.params.yMax,180);assert.ok(110%20!==0&&170%20!==0);assert.match(speed.solution,/тоқтауды емес/);
});
test('cooling value50 is read at8 minutes on5degree minor grid between40 and60',()=>{
 const q=row('cooling-temperature-at-eight');assert.equal(calc(q),'50');assert.equal(q.params.yStep,5);assert.equal(q.params.yLabelEvery,20);assert.deepEqual(independentlyCalculate(q).checks.point,[8,50]);
});
test('bus final cumulative distance300 is not the sum of graph heights and includes a stationary interval',()=>{
 const q=row('bus-final-cumulative-distance');assert.equal(calc(q),'300');assert.deepEqual(horizontalIntervals(q.params.points),[{start:2,end:3,value:160}]);assert.notEqual(q.params.points.reduce((s,v)=>s+v[1],0),300);
});
test('entire interval4–16 increases;10–24 fails because the final segment falls',()=>{
 const q=row('strict-temperature-rise-interval');assert.equal(calc(q),'4 сағаттан 16 сағатқа дейін');assert.equal(strictlyIncreasingOver(q.params.points,4,16),true);assert.equal(strictlyIncreasingOver(q.params.points,10,24),false);assert.equal(strictlyIncreasingOver([[0,1],[2,2],[4,2],[6,3]],0,6),false,'A plateau is not strict growth');
});
test('river asks month4 rather than height360; tank asks first50 rather than maximum90',()=>{
 const q=row('river-peak-month-not-height'),tank=row('initial-tank-intercept');assert.equal(calc(q),'4');assert.equal(independentlyCalculate(q).checks.peakHeight,360);assert.equal(calc(tank),'50');assert.equal(independentlyCalculate(tank).checks.laterMaximum,90);
});
test('winter−9 is below explicit zero, not positive9 or nearby labeled−8',()=>{
 const q=row('winter-negative-ordinate');assert.equal(calc(q),'-9°C');assert.equal(q.params.yMin,-12);assert.equal(q.params.yStep,1);assert.equal(q.params.yLabelEvery,4);assert.match(svgFor(q),/stroke="#8459ce" stroke-width="1.6" data-y-grid="0"/);assert.ok(q.options.includes('9°C')&&q.options.includes('-8°C'));
});
test('all native coordinates exactly follow signed plotting ranges and every printed month datum',()=>{
 for(const q of pack.editions){const p=q.params,svg=svgFor(q),m=svg.match(/data-coordinates="([^"]+)" points="([^"]+)"/);assert.ok(m);const data=m[1].split(';').map(v=>v.split(',').map(Number)),pixels=m[2].split(' ').map(v=>v.split(',').map(Number));assert.deepEqual(data,p.points);for(let i=0;i<data.length;i++){assert.ok(Math.abs(pixels[i][0]-(76+data[i][0]/p.xMax*344))<1e-10);assert.ok(Math.abs(pixels[i][1]-(286-(data[i][1]-p.yMin)/(p.yMax-p.yMin)*238))<1e-10);}assert.doesNotMatch(svg,/NaN|Infinity/);}
});
test('changed final total requires updated solution, description and native SHA',()=>{
 const q=row('bus-final-cumulative-distance');q.params.points.at(-1)[1]=280;q.answer='280';assert.throws(()=>verifyEdition(q),/solution/);q.solution=solutionFor(q);assert.throws(()=>verifyEdition(q),/accessible/);q.figureDescription=descriptionFor(q);assert.throws(()=>verifyEdition(q),/SVG digest/);
});

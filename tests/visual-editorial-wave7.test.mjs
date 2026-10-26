import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {prepareVisualWave7} from '../scripts/editorial/visual-wave7-prepare.mjs';
import {belongs,components,intervalText,independentlyCalculate,statementFor,solutionFor,descriptionFor,svgFor,verifyEdition} from '../scripts/editorial/visual-wave7-models.mjs';
const root=new URL('../',import.meta.url),read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8')),pack=read('problems/editorial/batches/visual-wave7-inequalities.json'),row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave7-'+s)),calc=q=>independentlyCalculate(q).answer,range=(lo,hi,lc=false,hc=false)=>({lo,hi,lc,hc});
test('24 addressed drafts plus1 retained edition cover all25 chapter5 visual occurrences with full source hashes',()=>{
 assert.equal(pack.editions.length,24);assert.deepEqual(prepareVisualWave7(),pack);assert.equal(pack.coverage.sourceVisualOccurrences,25);assert.equal(pack.coverage.previousEditionsRetained[0].editionId,'visual-interval-integer');assert.equal(pack.publication.allowed,false);
 for(const q of pack.editions){const raw=read(q.sourceRefs[0].sourceFile).questions[Number(q.sourceOccurrenceId.split('#').at(-1))];assert.equal(editionHash(raw),q.sourceCanonicalSha256);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');assert.equal(q.minimumPlan,'pro');assert.equal(verifyEdition(q).answer,q.answer);if(!q.options){assert.match(q.answer,/^\d+$/);assert.match(q.statement,/Жауапқа тек санды жазыңыз\.$/);}const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);}
});
test('all24 independently reconstructed answers agree with the separately calculated source-specific golden keys',()=>{
 const expected=['13','-5 < -2','8','9,5 кг','-2u > -2v','-2 − 5 < 4 − 5','11','w > u','8','x ≤ -4','2','[-3; 4)','C ∩ D = ∅','[-1; 4]','[-7; 3]','6','3x > 12','15','9','x ≥ -2 және x < 4','(-4; 5]','|x - 1| > 4','|x| < 6','7'];assert.deepEqual(pack.editions.map(calc),expected);
 for(const q of pack.editions){const bad=structuredClone(q);bad.answer='not a key';assert.equal(calc(bad),q.answer);assert.throws(()=>verifyEdition(bad),/Independent endpoint-aware answer/);}
});
test('interval atoms preserve isolated closed contact and do not close an omitted open contact point',()=>{
 assert.deepEqual(components([range(-2,0,true,false),range(0,3,false,true)]),[range(-2,0,true,false),range(0,3,false,true)]);
 assert.deepEqual(components([range(-2,0,true,false),range(0,3,true,true)]),[range(-2,3,true,true)]);
 assert.deepEqual(components([range(-2,0,true,true),range(0,3,true,true)],'intersection'),[range(0,0,true,true)]);
 assert.equal(intervalText(range(0,0,true,true)),'{0}');
 assert.deepEqual(components([range(null,-2,false,true),range(-2,null,false,false)]),[range(null,null,false,false)]);
});
test('strict integer counts, half-open member counts and closed overlap length are not interchangeable',()=>{
 assert.equal(calc(row('strict-between-integers')),'8');assert.equal(calc(row('half-open-integer-count')),'8');assert.equal(calc(row('system-integer-members')),'9');
 const q=row('intersection-unit-length');assert.equal(calc(q),'6');const r=components(q.params.ranges,'intersection')[0];assert.equal(r.lo,1);assert.equal(r.hi,7);assert.equal(7-1+1,7);assert.notEqual(q.answer,'7');
});
test('marked endpoint points test actual closure separately from their filled marker on a second row',()=>{
 const q=row('endpoint-point-membership'),r=q.params.ranges[0];assert.equal(belongs(r,-4),true);assert.equal(belongs(r,3),false);assert.equal(calc(q),'2');const svg=svgFor(q);assert.match(svg,/data-endpoint="-4" data-closed="true"/);assert.match(svg,/data-endpoint="3" data-closed="false"/);assert.match(svg,/data-point="D" data-value="3"/);assert.match(svg,/cy="235"/);
});
test('a ray direction and a filled endpoint jointly determine the inequality',()=>{
 const q=row('closed-left-ray');assert.equal(calc(q),'x ≤ -4');assert.equal(belongs(q.params.ranges[0],-4),true);assert.equal(belongs(q.params.ranges[0],-5),true);assert.equal(belongs(q.params.ranges[0],-3),false);
 assert.equal(calc(row('write-half-open-interval')),'[-3; 4)');
 const notation=row('write-half-open-interval');assert.ok(!descriptionFor(notation).includes(notation.answer),'Accessible description describes given boundary symbols, rather than printing the requested notation');
});
test('union, intersection and empty gaps retain their separate meanings',()=>{
 assert.equal(calc(row('disjoint-intervals')),'C ∩ D = ∅');assert.equal(calc(row('closed-intersection')),'[-1; 4]');assert.equal(calc(row('connected-union')),'[-7; 3]');
 const q=row('disjoint-intervals');assert.equal(q.params.ranges.some(r=>belongs(r,0)),false);
});
test('linear equivalence tests the boundary itself as well as both open sides',()=>{
 const q=row('match-linear-solution');assert.equal(calc(q),'3x > 12');assert.equal(3*4>12,false);assert.equal(3*4>=12,true);assert.equal(-3*5>-12,false);assert.equal(3*5>12,true);assert.equal(calc(row('linear-bound-parameter')),'15');
});
test('absolute inequalities distinguish exterior/interior, shifted centre, and open/closed bounds',()=>{
 assert.equal(calc(row('distance-outside-centre')),'|x - 1| > 4');assert.equal((-3+5)/2,1);assert.equal((5-(-3))/2,4);
 for(const x of[-7,-3,-2,1,4,5,9]){const q=row('distance-outside-centre');assert.equal(q.params.ranges.some(r=>belongs(r,x)),Math.abs(x-1)>4);}
 assert.equal(calc(row('distance-inside-origin')),'|x| < 6');assert.equal(calc(row('absolute-radius-parameter')),'7');
});
test('negative scaling reverses order, whereas translation preserves it with the same change on both sides',()=>{
 assert.equal(calc(row('negative-multiplier-order')),'-2u > -2v');assert.equal(calc(row('same-left-translation')),'-2 − 5 < 4 − 5');assert.equal(calc(row('ordered-triple')),'w > u');
 const q=row('same-left-translation');q.params.points.find(r=>r.label==='B′').value=0;assert.throws(()=>calc(q));
});
test('area comparison counts actual squares and lower balance pan excludes equality of masses',()=>{
 const a=row('grid-area-comparison'),svg=svgFor(a);assert.equal((svg.match(/data-cell="A:/g)||[]).length,36);assert.equal((svg.match(/data-cell="B:/g)||[]).length,49);assert.equal(calc(a),'13');
 const b=row('heavier-pumpkin');assert.equal(calc(b),'9,5 кг');assert.equal(5+4,9);assert.match(svgFor(b),/x1="100" y1="161" x2="380" y2="99"/);
 assert.equal(calc(row('add-inequalities')),'11');
});
test('native endpoints and point positions retain the same exact values and closure flags',()=>{
 for(const q of pack.editions){const svg=svgFor(q);for(const r of q.params.ranges||[])for(const [value,closed]of[[r.lo,r.lc],[r.hi,r.hc]])if(value!==null)assert.ok(svg.includes('data-endpoint="'+value+'" data-closed="'+closed+'"'));for(const r of q.params.points||[])assert.ok(svg.includes('data-point="'+r.label+'" data-value="'+r.value+'"'));assert.doesNotMatch(svg,/NaN|Infinity/);}
});
test('revised coefficient requires revised condition, worked solution, accessible description, and SVG digest',()=>{
 const q=row('linear-bound-parameter');q.params.coefficient=4;q.answer='20';assert.throws(()=>verifyEdition(q),/condition/);q.statement=statementFor(q);q.solution=solutionFor(q);assert.throws(()=>verifyEdition(q),/accessible/);q.figureDescription=descriptionFor(q);assert.throws(()=>verifyEdition(q),/SVG digest/);
});

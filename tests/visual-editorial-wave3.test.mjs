import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {sceneFor,occupiedCells,independentlyCalculate,statementFor,solutionFor,expressionOptions,svgFor,verifyEdition} from '../scripts/editorial/visual-wave3-models.mjs';
import {prepareVisualWave3} from '../scripts/editorial/visual-wave3-prepare.mjs';
const root=new URL('../',import.meta.url);
const read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8'));
const pack=read('problems/editorial/batches/visual-wave3-composites.json');
const row=s=>structuredClone(pack.editions.find(q=>q.editionId==='visual-wave3-'+s));
const calc=q=>independentlyCalculate(q).answer;
test('28 new drafts plus2 retained editions address every visual source in grade4 topic4.3',()=>{
 assert.equal(pack.editions.length,28);assert.equal(pack.publication.allowed,false);assert.equal(pack.status,'draft_awaiting_independent_review');
 assert.equal(new Set(pack.editions.map(q=>q.sourceOccurrenceId)).size,28);
 const scope=read('problems/editorial/batches/visual-inventory.json').records.filter(r=>r.grade===4&&r.sourceFile.includes('/4-math-4-3-'));
 assert.equal(scope.length,30);
 const refs=[...pack.coverage.previousEditionsRetained.map(r=>r.sourceId),...pack.editions.map(q=>q.sourceRefs[0].sourceId)];
 assert.deepEqual(refs.sort(),scope.map(r=>r.sourceId).sort());
 assert.deepEqual(prepareVisualWave3(),pack);
 for(const q of pack.editions){
  const record=scope.find(r=>r.occurrenceId===q.sourceOccurrenceId),raw=read(record.sourceFile).questions[record.sourceIndex];
  assert.equal(q.sourceCanonicalSha256,editionHash(raw));assert.equal(q.grade,4);assert.equal(q.editorialStatus,'draft');assert.equal(q.figureReview.status,'draft');
  assert.notEqual(q.statement,raw.statement);assert.notEqual(q.answer,String(raw.sourceAnswer));assert.equal(q.minimumPlan,'pro');
  assert.equal(verifyEdition(q).answer,q.answer);
  const bytes=fs.readFileSync(new URL('frontend/public'+q.image,root));assert.equal(bytes.toString(),svgFor(q));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),q.figureSha256);
  assert.doesNotMatch(bytes.toString().replace('xmlns="http://www.w3.org/2000/svg"',''),/<image\b|<script\b|foreignObject|href=|data:image|https?:/i);
 }
});
test('all addressed golden answers are recomputed without reading the supplied key',()=>{
 const expected=['144','102','34','42','58','60','21','333','13 × 9 − 4 × 3','14 × 9 − 5 × 6','209','23','50','600','17460','9','119000','30','48','52','96','39','45 см² және 36 см','60','141','70','378','222'];
 assert.deepEqual(pack.editions.map(calc),expected);
 for(const q of pack.editions){const changed=structuredClone(q);changed.answer='bad';assert.equal(calc(changed),q.answer);assert.throws(()=>verifyEdition(changed),/Independent composite/);}
});
test('corner cuts change area but not boundary perimeter; crossing paths and overlapping rectangles count a common region once',()=>{
 const q=row('corner-ribbon');assert.equal(calc(q),'50');q.params.cw=2;q.params.ch=7;assert.equal(calc(q),'50');
 assert.equal(calc(row('corner-model')),'102');assert.equal(calc(row('crossed-paths')),'600');assert.notEqual(calc(row('crossed-paths')),'591');
 const overlap=row('overlap-cards');assert.equal(occupiedCells(overlap).size,52);assert.equal(calc(overlap),'52');assert.notEqual(calc(overlap),'64');assert.notEqual(calc(overlap),'40');
});
test('correct and incorrect expression targets retain their opposite selection semantics',()=>{
 const correct=row('choose-formula'),incorrect=row('reject-formula');
 assert.equal(calc(correct),expressionOptions(correct)[0]);assert.equal(calc(incorrect),expressionOptions(incorrect)[3]);
 assert.equal(correct.options.filter(v=>v===correct.answer).length,1);
 const ambiguous=row('reject-formula');ambiguous.params.h=8;ambiguous.params.ch=4;
 assert.throws(()=>calc(ambiguous),/must be unique/);
});
test('P and T components meet without overlapping, while a diagonal part is exactly half its rectangle',()=>{
 assert.equal(calc(row('three-piece-panel')),'58');assert.equal(occupiedCells(row('three-piece-panel')).size,3*8*2+5*2);
 assert.equal(calc(row('t-pointer')),'60');assert.equal(occupiedCells(row('t-pointer')).size,12*3+4*6);
 assert.equal(calc(row('diagonal-paper')),'42');const t=row('diagonal-paper');t.params.w=9;assert.equal(calc(t),'31.5');
 assert.equal(calc(row('reading-corner')),'30');
});
test('unknown width is uniquely recovered without printing it as a dimension',()=>{
 const q=row('restore-width');assert.equal(calc(q),'9');
 const texts=[...svgFor(q).matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map(m=>m[1]);
 assert.ok(texts.includes('h = ?'));assert.ok(!texts.includes('9 см'));
 q.params.remaining=94;assert.throws(()=>calc(q),/unique original width/);
 const mismatch=row('restore-width');mismatch.params.h=10;assert.throws(()=>calc(mismatch),/inferred, unlabelled width/);
});
test('unit-rate material and square-unit tile conversion are applied after the correct composite area',()=>{
 const paint=row('notched-coating');assert.equal(calc(paint),'17460');paint.params.rate=1;assert.equal(calc(paint),'97');
 assert.equal(calc(row('floor-budget')),'119000');
 const tiles=row('whole-tile-packs');assert.equal(calc(tiles),'39');
 const n=occupiedCells(tiles).size*(100/25)**2;assert.equal(n,464);assert.ok(38*12<n&&39*12>=n);
 tiles.params.pack=16;assert.equal(calc(tiles),'29');
 tiles.params.tileCm=30;assert.throws(()=>calc(tiles),/fits each whole-metre boundary/);
});
test('grid area scales quadratically and perimeter linearly; statements retain their exact connected topology',()=>{
 const grid=row('count-grid');assert.equal(calc(grid),'21');grid.params.side=2;assert.equal(calc(grid),'84');
 const cross=row('cross-two-measures');cross.params.side=4;assert.equal(calc(cross),'80 см² және 48 см');
 assert.equal(calc(row('l-tile-border')),'48');assert.equal(calc(row('stair-boundary')),'60');
 const l=row('l-tile-border');l.params.cells[4]=[2,3];assert.throws(()=>calc(l),/Exact connected L/);
 const stair=row('stair-boundary');stair.params.cells.pop();assert.throws(()=>calc(stair),/Exact cells/);
});
test('uniform outer borders add twice the width to each dimension',()=>{
 const q=row('pool-walkway');assert.equal(calc(q),'96');assert.notEqual(calc(q),String((13+2)*(7+2)-13*7));
 assert.equal(calc(row('picture-border')),'222');
 const s=sceneFor(row('picture-border'));assert.equal(s.width,24);assert.equal(s.height,19);
});
test('a new condition or dimension cannot retain a stale figure hash',()=>{
 const q=row('corner-model');q.params.w=15;q.answer='111';
 assert.throws(()=>verifyEdition(q),/Condition/);q.statement=statementFor(q);q.solution=solutionFor(q);
 assert.throws(()=>verifyEdition(q),/figure hash/);
});

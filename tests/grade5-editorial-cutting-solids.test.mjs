import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {buildEditions,verifyEdition} from '../scripts/editorial/grade5-cutting-solids-models.mjs';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
const rows=buildEditions();
test('exactly all 27 saved nonvisual grade5 9.2 sources are represented once',()=>{
 const sources=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='9-2');
 assert.equal(rows.length,27);assert.equal(sources.length,27);
 assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(ref=>ref.sourceId)).sort(),sources.map(s=>s.sourceId).sort());
 assert.equal(new Set(rows.map(r=>r.editionId)).size,27);
 for(const r of rows){assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,5);assert.equal(verifyEdition(r).answer,r.answer);}
});
test('full text, key, options, source and params cannot drift after review',()=>{
 for(const r of rows)for(const field of ['statement','solution','answer','params','sourceRefs']){
  const bad=structuredClone(r);if(field==='params')bad.params.unreviewed=1;else if(field==='sourceRefs')bad.sourceRefs[0].sourceId='changed';else bad[field]+=' changed';
  assert.throws(()=>verifyEdition(bad));
 }
 for(const r of rows.filter(r=>r.options)){const bad=structuredClone(r);bad.options.reverse();assert.throws(()=>verifyEdition(bad));}
});
test('open answers have no options property; MCQs have four unique choices and one key',()=>{
 for(const r of rows){if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(o=>o===r.answer).length,1);}else{assert.ok(!Object.hasOwn(r,'options'));assert.match(r.answer,/^\d+$/);}}
 const positions=new Set(rows.filter(r=>r.options).map(r=>r.options.indexOf(r.answer)));assert.equal(positions.size,4);
});
test('exact computational review independently derives printed geometry, not author params',()=>{
 const p=spawnSync('python3',['scripts/editorial/review-grade5-cutting-solids.py'],{cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:30000});
 assert.equal(p.status,0,p.stderr);const proof=JSON.parse(p.stdout);
 assert.equal(proof.verified,27);assert.equal(proof.wrongKeysRejected,27);assert.equal(proof.printedGivensOrTargetsCanariesRejected,27);
 assert.equal(proof.allFixedHexominoesEnumerated,216);assert.equal(proof.allFoldableCubeNetsChecked,64);assert.equal(proof.pythonJavaScriptHashesMatched,27);
 assert.equal(proof.separateHumanReviewer,false);
});
test('saved mathematical review is signed for the complete current rows',()=>{
 const review=JSON.parse(fs.readFileSync(new URL('../problems/editorial/reviews/grade5-cutting-solids.json',import.meta.url),'utf8'));
 assert.equal(review.entries.length,27);const entries=new Map(review.entries.map(e=>[e.editionId,e]));
 for(const r of rows){assert.equal(entries.get(r.editionId)?.verdict,'verified');assert.equal(entries.get(r.editionId)?.sha256,editionHash(r));}
});

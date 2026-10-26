import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {arithmetic,buildEditions,verifyEdition} from '../scripts/editorial/grade5-expression-language-models.mjs';
import {grade5Sources} from '../scripts/editorial/grade5-inventory.mjs';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
const rows=buildEditions();
test('all 47 saved nonvisual expression sources have exactly one local Standard+ adaptation',()=>{
 const sources=grade5Sources().filter(q=>q.nonvisual&&q.sourceTopic==='1-8');assert.equal(rows.length,47);assert.equal(sources.length,47);
 assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(q=>q.sourceId)).sort(),sources.map(q=>q.sourceId).sort());
 for(const r of rows){assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,5);assert.equal(verifyEdition(r).answer,r.answer);}
});
test('complete wording, answer, options, parameters and source remain bound',()=>{
 for(const r of rows){for(const field of ['statement','solution','answer']){const bad=structuredClone(r);bad[field]+=' changed';assert.throws(()=>verifyEdition(bad));}
  const bad=structuredClone(r);bad.params.unreviewed=true;assert.throws(()=>verifyEdition(bad));
  const badSource=structuredClone(r);badSource.sourceRefs[0].sourceId='wrong';assert.throws(()=>verifyEdition(badSource));
  if(r.options){const badOptions=structuredClone(r);badOptions.options.reverse();assert.throws(()=>verifyEdition(badOptions));}
 }
});
test('operator trace teaches brackets first and multiplication/division before addition',()=>{
 const result=arithmetic('75 − 7 × 8 + 20 ÷ 5');assert.equal(result.value,23);
 assert.deepEqual(result.trace,['7 × 8 = 56','20 ÷ 5 = 4','75 − 56 = 19','19 + 4 = 23']);
 const nested=arithmetic('(528 + 18 × 24) ÷ 8 − (150 − 27 × 5)');assert.equal(nested.value,105);
 assert.ok(nested.trace.indexOf('150 − 135 = 15')<nested.trace.indexOf('960 ÷ 8 = 120'));
 assert.equal(arithmetic('0 ÷ 9').value,0);assert.throws(()=>arithmetic('9 ÷ (7 − 7)'),/zero denominator/);
});
test('integer open responses, four unique MCQs, plain native math and rotated keys',()=>{
 const positions=new Set();for(const r of rows){
  if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(o=>o===r.answer).length,1);positions.add(r.options.indexOf(r.answer));}
  else{assert.ok(!Object.hasOwn(r,'options'));assert.match(r.answer,/^\d+$/);}
  for(const s of[r.statement,r.solution,r.answer,...r.options||[]])assert.doesNotMatch(s,/[\\$]/);
 }assert.equal(positions.size,4);
});
test('separate exact checker proves symbolic identities and finite domains from printed conditions',()=>{
 const p=spawnSync('python3',['scripts/editorial/review-grade5-expression-language.py'],{cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:30000});assert.equal(p.status,0,p.stderr);
 const report=JSON.parse(p.stdout);assert.equal(report.verified,47);assert.equal(report.wrongKeysRejected,47);assert.equal(report.printedSemanticCanariesRejected,47);
 assert.ok(report.newSolutionNumericEqualitiesVerified>=77);assert.equal(report.exactRationalSymbolicProofs,true);assert.equal(report.separateHumanReviewer,false);
});
test('review fingerprints include every current complete edition',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../problems/editorial/reviews/grade5-expression-language.json',import.meta.url),'utf8'));
 assert.equal(report.entries.length,47);const map=new Map(report.entries.map(e=>[e.editionId,e]));
 for(const r of rows){assert.equal(map.get(r.editionId)?.sha256,editionHash(r));assert.equal(map.get(r.editionId)?.verdict,'verified');}
});

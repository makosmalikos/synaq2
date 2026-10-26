import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{spawnSync}from'node:child_process';import{buildEditions,verifyEdition}from'../scripts/editorial/grade5-formula-calculation-models.mjs';import{grade5Sources}from'../scripts/editorial/grade5-inventory.mjs';import{editionHash}from'../scripts/editorial/edition-review.mjs';
const rows=buildEditions();
test('all 44 saved nonvisual formula sources have one Standard+ adaptation',()=>{
 const sources=grade5Sources().filter(s=>s.nonvisual&&s.sourceTopic==='1-11');assert.equal(rows.length,44);assert.equal(sources.length,44);assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(s=>s.sourceId)).sort(),sources.map(s=>s.sourceId).sort());
 for(const r of rows){assert.equal(r.grade,5);assert.equal(r.minimumPlan,'pro');assert.equal(verifyEdition(r).answer,r.answer);}
});
test('complete unit/target/method wording, keys, params, MCQs and provenance stay bound',()=>{
 for(const r of rows){for(const field of['statement','solution','answer']){const bad=structuredClone(r);bad[field]+=' changed';assert.throws(()=>verifyEdition(bad));}
  const bad=structuredClone(r);bad.params.unreviewed=true;assert.throws(()=>verifyEdition(bad));const src=structuredClone(r);src.sourceRefs[0].sourceId='wrong';assert.throws(()=>verifyEdition(src));if(r.options){const opt=structuredClone(r);opt.options.reverse();assert.throws(()=>verifyEdition(opt));}
 }
});
test('all open answers are integer-only without options; MCQs have one unique key',()=>{
 const positions=new Set();for(const r of rows){if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(o=>o===r.answer).length,1);positions.add(r.options.indexOf(r.answer));}else{assert.ok(!Object.hasOwn(r,'options'));assert.match(r.answer,/^\d+$/);}for(const s of[r.statement,r.solution,r.answer,...r.options||[]])assert.doesNotMatch(s,/[\\$]/);}assert.equal(positions.size,4);
});
test('separate physical/exact review checks SI scaling, actual tiling/posts/interior and every key',()=>{
 const p=spawnSync('python3',['scripts/editorial/review-grade5-formula-calculation.py'],{cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:30000});assert.equal(p.status,0,p.stderr);const summary=JSON.parse(p.stdout);
 assert.equal(summary.verified,44);assert.equal(summary.wrongKeysRejected,44);assert.equal(summary.printedGivensOrTargetsCanariesRejected,44);assert.ok(summary.newSolutionNumericEqualitiesVerified>=109);assert.equal(summary.actualTilingPostsAndInteriorEnumerated,true);assert.equal(summary.exactUniversalScalingProofs,true);assert.equal(summary.separateHumanReviewer,false);
});
test('full review fingerprints match every current edition',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../problems/editorial/reviews/grade5-formula-calculation.json',import.meta.url),'utf8'));assert.equal(report.entries.length,44);const entries=new Map(report.entries.map(e=>[e.editionId,e]));for(const r of rows){assert.equal(entries.get(r.editionId)?.sha256,editionHash(r));assert.equal(entries.get(r.editionId)?.verdict,'verified');}
});

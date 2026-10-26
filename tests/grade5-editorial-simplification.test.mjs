import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{spawnSync}from'node:child_process';
import{buildEditions,verifyEdition}from'../scripts/editorial/grade5-simplification-models.mjs';import{grade5Sources}from'../scripts/editorial/grade5-inventory.mjs';import{editionHash}from'../scripts/editorial/edition-review.mjs';
const rows=buildEditions();
test('all 47 saved nonvisual simplification sources represented once in Standard+',()=>{
 const sources=grade5Sources().filter(s=>s.nonvisual&&s.sourceTopic==='1-9');assert.equal(rows.length,47);assert.equal(sources.length,47);
 assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(s=>s.sourceId)).sort(),sources.map(s=>s.sourceId).sort());
 for(const r of rows){assert.equal(r.grade,5);assert.equal(r.minimumPlan,'pro');assert.equal(verifyEdition(r).answer,r.answer);}
});
test('wording, method, key, parameters, MCQs and source cannot drift',()=>{
 for(const r of rows){for(const field of['statement','solution','answer']){const bad=structuredClone(r);bad[field]+=' changed';assert.throws(()=>verifyEdition(bad));}
  const bad=structuredClone(r);bad.params.unreviewed=true;assert.throws(()=>verifyEdition(bad));
  const source=structuredClone(r);source.sourceRefs[0].sourceId='wrong';assert.throws(()=>verifyEdition(source));
  if(r.options){const choice=structuredClone(r);choice.options.reverse();assert.throws(()=>verifyEdition(choice));}
 }
});
test('symbolic MCQ keys are unique; integer open answers have no options',()=>{
 const keys=new Set();for(const r of rows){if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(o=>o===r.answer).length,1);keys.add(r.options.indexOf(r.answer));}else{assert.ok(!Object.hasOwn(r,'options'));assert.match(r.answer,/^\d+$/);}for(const s of[r.statement,r.solution,r.answer,...r.options||[]])assert.doesNotMatch(s,/[\\$]/);}assert.equal(keys.size,4);
});
test('separate exact polynomial proofs reject all wrong keys and altered printed givens',()=>{
 const p=spawnSync('python3',['scripts/editorial/review-grade5-simplification.py'],{cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:30000});assert.equal(p.status,0,p.stderr);
 const report=JSON.parse(p.stdout);assert.equal(report.verified,47);assert.equal(report.wrongKeysRejected,47);assert.equal(report.printedSemanticCanariesRejected,47);assert.ok(report.newSolutionSymbolicAndNumericEqualitiesVerified>=92);assert.equal(report.exactPolynomialProofs,true);assert.equal(report.separateHumanReviewer,false);
});
test('full-row review hashes match all generated rows, with the source explanation correction recorded',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../problems/editorial/reviews/grade5-simplification.json',import.meta.url),'utf8'));assert.equal(report.entries.length,47);assert.equal(report.resolvedSourceFindings.length,1);
 const entries=new Map(report.entries.map(e=>[e.editionId,e]));for(const r of rows){assert.equal(entries.get(r.editionId)?.verdict,'verified');assert.equal(entries.get(r.editionId)?.sha256,editionHash(r));}
});

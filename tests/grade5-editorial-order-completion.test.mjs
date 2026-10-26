import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{spawnSync}from'node:child_process';import{buildEditions,verifyEdition,onePairCases,divisionTrees}from'../scripts/editorial/grade5-order-completion-models.mjs';import{grade5Sources}from'../scripts/editorial/grade5-inventory.mjs';import{editionHash}from'../scripts/editorial/edition-review.mjs';
const rows=buildEditions();
test('20 remaining frozen nonvisual order sources linked individually to Standard+',()=>{
 const sources=new Map(grade5Sources().map(s=>[s.sourceId,s]));assert.equal(rows.length,20);assert.equal(new Set(rows.map(r=>r.sourceRefs[0].sourceId)).size,20);
 for(const r of rows){const s=sources.get(r.sourceRefs[0].sourceId);assert.equal(s.sourceTopic,'1-7');assert.equal(s.nonvisual,true);assert.equal(r.grade,5);assert.equal(r.minimumPlan,'pro');assert.equal(verifyEdition(r).answer,r.answer);}
});
test('one pair means all15 contiguous intervals; three divisions mean all5 binary trees',()=>{
 const intervals=onePairCases('3 + 4 × 5 + 6 × 7');assert.equal(intervals.length,15);assert.equal(Math.max(...intervals.map(c=>c.value)),311);assert.ok(intervals.every(c=>(c.expression.match(/\(/g)||[]).length===1));
 const trees=divisionTrees([1296,18,6,2]);assert.equal(trees.length,5);assert.deepEqual([...new Set(trees.map(c=>c.value))].sort((a,b)=>a-b),[6,24,216,864]);
});
test('full text/method/key/params/MCQ/source bindings, integer open responses and unique choices',()=>{
 for(const r of rows){for(const field of['statement','solution','answer']){const bad=structuredClone(r);bad[field]+=' changed';assert.throws(()=>verifyEdition(bad));}const params=structuredClone(r);params.params.unreviewed=true;assert.throws(()=>verifyEdition(params));const src=structuredClone(r);src.sourceRefs[0].sourceId='wrong';assert.throws(()=>verifyEdition(src));
  if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(o=>o===r.answer).length,1);const bad=structuredClone(r);bad.options.reverse();assert.throws(()=>verifyEdition(bad));}else{assert.ok(!Object.hasOwn(r,'options'));assert.match(r.answer,/^\d+$/);}
 }
});
test('separate exact Fraction/combinatorial review rejects every key and semantic canary',()=>{
 const p=spawnSync('python3',['scripts/editorial/review-grade5-order-completion.py'],{cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:30000});assert.equal(p.status,0,p.stderr);const s=JSON.parse(p.stdout);assert.equal(s.verified,20);assert.equal(s.wrongKeysRejected,20);assert.equal(s.printedSemanticCanariesRejected,20);assert.ok(s.newSolutionNumericEqualitiesVerified>=55);assert.equal(s.all15OnePairIntervalsChecked,true);assert.equal(s.all5BinaryDivisionTreesChecked,true);assert.equal(s.separateHumanReviewer,false);
});
test('all current rows are signed, and the existing verified duplicate is retained without reinsertion',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../problems/editorial/reviews/grade5-order-completion.json',import.meta.url),'utf8'));assert.equal(report.entries.length,20);assert.equal(report.retainedVerifiedDuplicate.sourceId,'0d0d7f87bc97c986');assert.equal(report.retainedVerifiedDuplicate.addedAgain,false);assert.ok(!rows.some(r=>r.sourceRefs.some(s=>s.sourceId==='0d0d7f87bc97c986')));
 const entries=new Map(report.entries.map(e=>[e.editionId,e]));for(const r of rows){assert.equal(entries.get(r.editionId)?.sha256,editionHash(r));assert.equal(entries.get(r.editionId)?.verdict,'verified');}
});

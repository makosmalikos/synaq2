import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{spawnSync}from'node:child_process';import{buildEditions,verifyEdition}from'../scripts/editorial/grade5-equations-models.mjs';import{grade5Sources}from'../scripts/editorial/grade5-inventory.mjs';import{editionHash}from'../scripts/editorial/edition-review.mjs';
const rows=buildEditions();
test('all 47 saved nonvisual equation sources have aligned Standard+ editions',()=>{
 const sources=grade5Sources().filter(s=>s.nonvisual&&s.sourceTopic==='1-10');assert.equal(sources.length,47);assert.equal(rows.length,47);
 assert.deepEqual(rows.flatMap(r=>r.sourceRefs.map(s=>s.sourceId)).sort(),sources.map(s=>s.sourceId).sort());for(const r of rows){assert.equal(r.grade,5);assert.equal(r.minimumPlan,'pro');assert.equal(verifyEdition(r).answer,r.answer);}
});
test('all complete conditions, inverse methods, keys, options, params and provenance are bound',()=>{
 for(const r of rows){for(const field of['statement','solution','answer']){const bad=structuredClone(r);bad[field]+=' changed';assert.throws(()=>verifyEdition(bad));}
  const bad=structuredClone(r);bad.params.unreviewed=true;assert.throws(()=>verifyEdition(bad));const source=structuredClone(r);source.sourceRefs[0].sourceId='wrong';assert.throws(()=>verifyEdition(source));
  if(r.options){const choice=structuredClone(r);choice.options.reverse();assert.throws(()=>verifyEdition(choice));}
 }
});
test('zero roots, empty roots and all roots stay distinct with explicit nonnegative domain',()=>{
 for(const r of rows.filter(r=>r.params.equation)){
  assert.ok(r.statement.includes('нөл және оң натурал')||r.params.type==='square'||r.params.type==='rule-divisor'||r.params.type==='rule-minuend',r.editionId);
 }
 const none=rows.find(r=>r.params.type==='no-root'),all=rows.find(r=>r.params.type==='all-roots'),zero=rows.filter(r=>r.answer==='0');
 assert.match(none.answer,/түбірі жоқ/);assert.match(all.answer,/Кез келген/);assert.equal(zero.length,4);
});
test('new exact polynomial review checks original denominators, natural square roots, ledgers and keys',()=>{
 const p=spawnSync('python3',['scripts/editorial/review-grade5-equations.py'],{cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:30000});assert.equal(p.status,0,p.stderr);const summary=JSON.parse(p.stdout);
 assert.equal(summary.verified,47);assert.equal(summary.newlyCoveredSourceOccurrences,46);assert.equal(summary.wrongKeysRejected,47);assert.equal(summary.printedGivensOrTargetsCanariesRejected,47);assert.ok(summary.newSolutionNumericEqualitiesVerified>=88);assert.equal(summary.exactPolynomialRootsAndDenominatorExclusions,true);assert.equal(summary.separateHumanReviewer,false);
});
test('signed complete rows, four unique MCQs and no options on integer open answers',()=>{
 const review=JSON.parse(fs.readFileSync(new URL('../problems/editorial/reviews/grade5-equations.json',import.meta.url),'utf8'));assert.equal(review.entries.length,47);assert.equal(review.resolvedSourceFindings[0].sourceId,'4aad7a8c53b157a9');const entries=new Map(review.entries.map(e=>[e.editionId,e]));
 for(const r of rows){assert.equal(entries.get(r.editionId)?.sha256,editionHash(r));assert.equal(entries.get(r.editionId)?.verdict,'verified');if(r.options){assert.equal(r.options.length,4);assert.equal(new Set(r.options).size,4);assert.equal(r.options.filter(o=>o===r.answer).length,1);}else{assert.ok(!Object.hasOwn(r,'options'));assert.match(r.answer,/^\d+$/);}}
});

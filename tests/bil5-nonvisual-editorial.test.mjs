import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {mathFragments} from '../frontend/src/mathPresentation.js';
import {buildEditions,verifyEdition} from '../scripts/editorial/bil5-nonvisual-models.mjs';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
const rows=buildEditions();
test('BIL5 thirty-three rewritten conditions keep paid scope and native alphametic notation',()=>{
 assert.equal(rows.length,33);
 for(const r of rows){assert.equal(r.minimumPlan,'pro');assert.equal(r.grade,6);assert.equal(verifyEdition(r).answer,r.answer);assert.equal(new Set(r.options).size,5);assert.doesNotMatch(r.statement+r.solution,/\$|\\|\[Image:/);assert.equal(r.image,undefined);}
 assert.equal(mathFragments(rows.find(r=>r.params.number===19).statement).filter(p=>p.type==='overline').length,3);
});
test('BIL5 full text solution options source and access remain bound to review',()=>{
 for(const r of rows){for(const key of ['statement','solution','answer','minimumPlan','modelId'])assert.throws(()=>verifyEdition({...r,[key]:r[key]+' changed'}));assert.throws(()=>verifyEdition({...r,options:[...r.options].reverse()}));const d=structuredClone(r);d.sourceRefs[0].sourceId='0';assert.throws(()=>verifyEdition(d));}
});
test('BIL5 exact review recomputes changed printed inputs and rejects invalid keys',()=>{
 const p=spawnSync('python3',['scripts/editorial/review-bil5-nonvisual.py'],{cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:30000});assert.equal(p.status,0,p.stderr);const s=JSON.parse(p.stdout);assert.equal(s.verified,33);assert.equal(s.sourceOptionsRead,165);assert.equal(s.rewrittenOptionsRead,165);assert.equal(s.wrongKeysRejected,33);assert.equal(s.changedActualInputsWithDifferentTarget,32);assert.equal(s.validActualCuboidDimensionChangePreservesThreeVisibleFaces,true);assert.equal(s.invalidZeroCuboidDimensionRejected,true);assert.equal(s.printedSolutionEqualitiesVerified,38);assert.equal(s.separateHumanReviewer,false);
});
test('BIL5 signed evidence proves exhaustive searches midnight carry and explicit calendar assumption',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../problems/editorial/reviews/bil5-nonvisual.json',import.meta.url)));
 for(const r of rows)assert.equal(report.entries.find(e=>e.editionId===r.editionId).sha256,editionHash(r));
 const e=n=>report.evidence.find(e=>e.editionId.endsWith('-'+n));
 assert.deepEqual(e(19).rewritten.actualUniqueDigitTriple,[2,7,5]);
 assert.deepEqual(e(23).rewritten.allValidTwoDigitNumbers,[13,26,31,39,62,93]);
 assert.equal(e(24).rewritten.exactTarget,'Бейсенбі');assert.equal(e(24).rewritten.finalClock,'02:40');
 assert.equal(e(34).rewritten.actualUniqueDecodedWord,'BCAC');assert.deepEqual(e(34).rewritten.allCompleteOldDecodings,['BCAC']);
 assert.equal(e(36).savedSource.sourceOfficialAnswerAssumesExactFiveSeventhsCalendarFractionNotActualGregorianCalendar,true);assert.equal(e(36).rewritten.explicitWholeWeekYearLength,'364');
 assert.equal(e(46).rewritten.detachedTrainingWheelsRemainAtParking,2);assert.equal(e(46).rewritten.exactTarget,'40');
});

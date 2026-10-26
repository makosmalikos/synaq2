import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {buildEditions,verifyEdition,drawFigure} from '../scripts/editorial/collection-controls1to6-models.mjs';
import {editionHash} from '../scripts/editorial/edition-review.mjs';
const rows=buildEditions();
test('remaining29control tasks keep source formats, exact requested quantities and Standard+ access',()=>{
 assert.equal(rows.length,29);assert.equal(rows.filter(r=>r.options).length,11);assert.equal(rows.filter(r=>r.image).length,3);assert.equal(new Set(rows.flatMap(r=>r.sourceRefs.map(s=>s.sourceFile+'#'+s.sourceId))).size,29);
 for(const r of rows){assert.equal(r.grade,6);assert.equal(r.minimumPlan,'pro');assert.equal(verifyEdition(r).answer,r.answer);assert.doesNotMatch(r.statement+r.solution,/[$\\]/);if(r.options)assert.equal(r.options.length,4);else assert.ok(!Object.hasOwn(r,'options'));}
 const get=(w,n)=>rows.find(r=>r.params.work===w&&r.params.number===n);assert.match(get('W6',2).statement,/нормасы бірдей/);assert.match(get('W2',1).statement,/үш қатарлас сектор/);assert.match(get('W1',4).statement,/бір-біріне қарай/);assert.equal(get('W5',1).answer,'9');assert.equal(get('W1',3).answer,'x = 4 және x = 7');assert.equal(get('W3',4).answer,'3542108');assert.equal(get('W4',1).answer,'7 сағат 12 минут');assert.ok(!get('W2',2));
});
test('review signature binds full condition, all options, explanations, source and actual native assets',()=>{
 for(const r of rows){for(const key of['statement','solution','answer','minimumPlan']){const b=structuredClone(r);b[key]+=' altered';assert.throws(()=>verifyEdition(b));}const b=structuredClone(r);b.sourceRefs[0].sourceId='0';assert.throws(()=>verifyEdition(b));if(r.options){const c=structuredClone(r);c.options[0]='unchecked';assert.throws(()=>verifyEdition(c));}}
 for(const k of['clock','sectors','annulus']){const svg=drawFigure(k);assert.doesNotMatch(svg,/<image|<script|href=|data:image|foreignObject/);assert.equal(fs.readFileSync(new URL('../frontend/public/figures/synaq-editions/control-'+k+'-native.svg',import.meta.url),'utf8'),svg);}
});
test('full printed-data computations verify all roots, domains, alternatives and native diagrams independently of author specs',()=>{
 const p=spawnSync('python3',['scripts/editorial/review-collection-controls1to6.py'],{cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:30000});assert.equal(p.status,0,p.stderr);const s=JSON.parse(p.stdout);assert.equal(s.verified,29);assert.equal(s.sourceKeysNotCaptured,18);assert.equal(s.allSourceNewAlternativesChecked,88);assert.equal(s.wrongKeysRejected,29);assert.equal(s.printedSemanticCanariesRejected,29);assert.equal(s.actualSVGMutationsRejected,3);assert.equal(s.nativeFractions,82);assert.equal(s.nativeMixedNumbers,1);assert.ok(s.printedSolutionEqualitiesVerified>=58);assert.equal(s.separateHumanReviewer,false);
});
test('signed evidence includes denominator exclusions, universal solution sets and exhaustive digit states',()=>{
 const report=JSON.parse(fs.readFileSync(new URL('../problems/editorial/reviews/collection-controls1to6.json',import.meta.url)));const entries=new Map(report.entries.map(e=>[e.editionId,e]));for(const r of rows){assert.equal(entries.get(r.editionId)?.sha256,editionHash(r));if(r.image)assert.equal(entries.get(r.editionId).figureReview.sha256,r.figureSha256);}
 const p=(w,i)=>report.evidence.find(e=>e.editionId.endsWith('-'+w.toLowerCase()+'-'+i)).rewritten;assert.equal(p('W6',1).exactSymbolicCancellationOfFreeVariable,true);assert.equal(p('W5',1).originalDenominatorForbiddenX,'3/2');assert.deepEqual(p('W1',3).allRealRoots,['4','7']);assert.equal(p('W3',4).allOrderedSubsequencesChecked,120);assert.equal(p('W3',2).allPermutationsEnumerated.length,24);assert.equal(p('W4',4).excludedZeroDenominatorX,'-4');assert.equal(p('W5',3).actualSVG.allTicks,60);assert.equal(p('W4',5).wholeOuterDiskDenominator,true);
});

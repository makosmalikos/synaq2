import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {CHAPTER_REVIEW_SPECS} from './grade4-chapter-review-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-chapter-review-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(CHAPTER_REVIEW_SPECS.map(s=>s.id)).size,CHAPTER_REVIEW_SPECS.length);const editions=[];
for(const spec of CHAPTER_REVIEW_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-chapter-review-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-6-8',`Missing canonical6.8 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-chapter-review-${kind}`,skillFamily:kind,grade:4,topic:'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық37 сақталған көрнекіліксіз шарт, толық ресми шешім, кілт пен барлық нұсқа жеке оқылды. Аралас қорытынды бөлімде әр бастапқы дағды жеке сақталды: разрядтық нөл, ширек, жұмыс, баға және қозғалыс.',
 'Жаңа сандық деректер мен дербес шарттар дәл қайта есептелді. Тәуліктегі24сағат,сағаттағы60минут және төрттенбірбөлік анықтамалары өзгермейтін факт ретінде сақталады; олар жаңа математикалық мағына деп саналмайды.',
 'Жеке шама мен қатынас, бірлік баға мен толық құн, қарсы/кері/бір бағыт, бастапқы және қосымша уақыт, орташа жылдамдықтың барлықжол/барлықуақыт анықтамасы ажыратылды.37source37жаңамағынаемес.'
 ],relationToSource:'One individually read saved grade-4 nonvisual6.8 chapter review occurrence with rewritten self-contained condition and recalculated data except invariant unit definitions; source-specific place-value, unit, productivity, price, ratio, staged/catch/turnaround motion and total-distance/time average skill retained. Numeric variants and fixed facts are coverage, not new meanings.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_source_specific_chapter_review_place_value_units_work_price_ratio_and_piecewise_motion',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-6-8'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual6.8 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All37 remaining saved grade-4 nonvisual topic6.8 chapter review; source-specific writtenzero, invariant quarterunits, work/price/ratio and opposite/outward/catch/turnaround motion roles preserved with exact math; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-chapter-review-wave48.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

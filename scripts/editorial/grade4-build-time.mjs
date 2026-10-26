import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {TIME_SPECS} from './grade4-time-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-time-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(TIME_SPECS.map(s=>s.id)).size,TIME_SPECS.length);const editions=[];
for(const spec of TIME_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-time-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-1-10',`Missing canonical1.10 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const row={editionId,modelId:`grade4-time-${spec.kind}`,skillFamily:spec.kind,grade:4,topic:/age|weekday|calendar/.test(spec.kind)?'logic':'word',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық сақталған шарттар, кілттер, толық шешімдер және жауап нұсқалары жеке оқылды; бірліктер мен сұралған шаманың мағынасы сақталды.',
 'Жаңа сандармен дербес қазақша шарт пен шешім жазылды. Сағаттағы 60 минут, тәуліктегі 24 сағат, аптадағы 7 күн, ғасырдағы 100 жыл анықтамалары сақталды.',
 'Түн ортасынан өту, жылдағы соңғы күнге n−1 қадам, 1 наурызға 31+28 күн, ең көп апта күні, үлестің толықтауышы мен көрші шығармалар арасындағы N−1 үзіліс бөлек тексеріледі. Сандық нұсқалар жаңа математикалық мағына саны деп саналмайды.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual time/fraction/calendar edition. Numerical variants are source coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_base60_base24_calendar_and_finite_age_time_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-1-10'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual1.10 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All24 remaining saved grade-4 nonvisual topic1.10 time/fraction/calendar sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-time-wave17.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

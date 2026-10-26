import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {MOTIONUNITS_SPECS} from './grade4-motionunits-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-motionunits-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(MOTIONUNITS_SPECS.map(s=>s.id)).size,MOTIONUNITS_SPECS.length);const editions=[];
for(const spec of MOTIONUNITS_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-motionunits-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-3-2',`Missing canonical3.2 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-motionunits-${kind}`,skillFamily:kind,grade:4,topic:'word',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық38 қалған сақталған шарт, кілт, толық шешім және нұсқалар жеке оқылды. Ұзындық және уақыт бірліктерін бірге ауыстыру, бір сағаттағы60минут/3 600секунд, ортақ бірлікпен салыстыру дағдылары сақталды.',
 'Жаңа сандар, есімдер мен дербес қазақша шарттар және толық шешімдер жазылды. Метр/минут/секунд, километр/сағат араласқан жылдамдықтар мен бірнеше кезеңнің жолы жеке есептелді. Сағаттағы минут санын100деп оқу және1сағ20мин/120минді шатастыру қателері ашық ажыратылды.',
 'Кеш/ерте келу, бір мезгілде қарсы жүру, кеш басталған қуу және сағат көрсеткіші есептерінде қозғалыс шарттары толық берілді. Реттілік не ең ұзын жол сұрақтарында барлық нұсқа ортақ бірлікке келтірілді. Сандық нұсқалар жеке жаңа мағына саны емес.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic3.2 mixed motion units, clock, direction and stages edition. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_mixed_rate_length_time_unit_clock_and_stage_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-3-2'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual3.2 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All38 remaining saved grade-4 nonvisual topic3.2 mixed motion-unit/clock/stage sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-motionunits-wave26.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

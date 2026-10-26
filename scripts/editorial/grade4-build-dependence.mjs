import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {DEPENDENCE_SPECS} from './grade4-dependence-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-dependence-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(DEPENDENCE_SPECS.map(s=>s.id)).size,DEPENDENCE_SPECS.length);const editions=[];
for(const spec of DEPENDENCE_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-dependence-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-4-2',`Missing canonical4.2 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-dependence-${kind}`,skillFamily:kind,grade:4,topic:'geometry',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық37 қалған сақталған шарт, кілт, толық шешім және нұсқалар жеке оқылды. Көлем, табан ауданы, биіктік, периметр және куб бірліктерін ажырату дағдылары сақталды.',
 'Өз алдына толық қазақша шарттар, жаңа деректер және толық кері/тура шешімдер жазылды. Ыңғайлы25×4жұбы педагогикалық тұрақты ретінде сақталды; негіз/көрсеткішті ауыстыру, куб/квадрат және салыстыру жеке тексерілді.',
 'Бассейннің тек бүйір қабырғалары, толтырудың екі тұрақты өнімділігі, толық батқан текшелер ығыстырған су, көлемді бөлікке бөлу және куб бірліктері шартта нақты ажыратылды. Бірдей есептеу үлгісінің сандық нұсқалары бөлек жаңа мағыналар ретінде саналмайды.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic4.2 dependencies of geometric quantities, native powers, inverse units, displacement, capacity or rate edition. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_native_power_geometric_dependency_unit_displacement_and_rate_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-4-2'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual4.2 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All37 remaining saved grade-4 nonvisual topic4.2 geometric-dependency/power/unit/displacement/rate sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-dependence-wave28.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {DIFFERENCE_UNIT_SPECS} from './grade4-difference-unit-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-difference-unit-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(DIFFERENCE_UNIT_SPECS.map(s=>s.id)).size,DIFFERENCE_UNIT_SPECS.length);const editions=[];
for(const spec of DIFFERENCE_UNIT_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-difference-unit-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-6-4',`Missing canonical6.4 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-difference-unit-${kind}`,skillFamily:kind,grade:4,topic:'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық38 сақталған көрнекіліксіз шарт, толық ресми шешім, кілт пен барлық нұсқа жеке оқылды. Екі айырма арқылы бірлікке келтірудің тікелей және кері модельдері жеке жазылды.',
 'Сұралған бірінші/екінші жұмыс, баға, сан, уақыт, жалпы шама немесе реттелген жұп сақталды. Диагностикалық жұптарда бірлік бағасының теңдігі мен берілген айырма екеуі де тексеріледі.',
 'Жасырын екінші сан/ұзындық, гипотетикалық сатып алудың нақты құны, артық/жетпеген ақша таңбалары; бума және килограмм бағасы; сағат/минут пен километр/метр түрлендірулері дәл есептелді.38source38жаңамағынаемес.'
 ],relationToSource:'One individually read saved grade-4 nonvisual6.4 difference-to-unit occurrence with preserved direct or inverse quantity role, two diagnostic constraints, ordered requested pair, hidden count/factor, surplus-shortfall sign and exact units. Numeric variants are source coverage, not unique meanings.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_difference_to_unit_direct_inverse_pair_two_constraints_and_surplus_shortfall_models',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-6-4'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual6.4 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All38 remaining saved grade-4 nonvisual topic6.4 difference-to-unit models; individually preserved requested direct/inverse quantities, diagnostic constraints and units; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-difference-unit-wave44.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

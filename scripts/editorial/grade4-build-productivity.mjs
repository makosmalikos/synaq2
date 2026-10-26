import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {PRODUCTIVITY_SPECS} from './grade4-productivity-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-productivity-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(PRODUCTIVITY_SPECS.map(s=>s.id)).size,PRODUCTIVITY_SPECS.length);const editions=[];
for(const spec of PRODUCTIVITY_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-productivity-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-6-1',`Missing canonical6.1 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-productivity-${kind}`,skillFamily:kind,grade:4,topic:'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық40 сақталған шарт, толық ресми шешім, кілт және барлық нұсқа жеке оқылды. Жұмыс, уақыт және өнімділіктің формуласы мен өлшем бірлігі ажыратылды.',
 'Бірдей немесе әртүрлі уақыттағы өнімділіктердің қатынасы мен айырмасы, бастапқы өнімділікті кері табу, өзгермейтін жұмыс және ерте аяқталған күн саны бөлек сақталды.',
 'Сағат/минут/секунд және тонна/грамм түрлендірулері, бір топқа кететін уақыт, қате кесте жолы және жоспардан ерте аяқтау арқылы жалпы жұмыс табу дәл есептелді.40source40жаңамағынаемес.'
 ],relationToSource:'One individually read saved grade-4 nonvisual6.1 productivity/work/time occurrence with preserved quantity target, dimensional role and source-specific inverse, comparison or unit model. Numeric variants are source coverage, not unique meanings.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_work_rate_time_units_comparison_inverse_originalrate_fixedwork_earlycompletion_and_batch_models',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-6-1'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual6.1 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All40 remaining saved grade-4 nonvisual topic6.1 productivity/work/time with individual quantity, dimensional, comparison, inverse and unit models; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-productivity-wave41.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

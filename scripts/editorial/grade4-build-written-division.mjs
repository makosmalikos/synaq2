import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {WRITTEN_DIVISION_SPECS} from './grade4-written-division-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-written-division-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(WRITTEN_DIVISION_SPECS.map(s=>s.id)).size,WRITTEN_DIVISION_SPECS.length);const editions=[];
for(const spec of WRITTEN_DIVISION_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-written-division-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-5-4',`Missing canonical5.4 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-written-division-${kind}`,skillFamily:kind,grade:4,topic:'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық25 қалған сақталған шарт, кілт, толық шешім және нұсқалар жеке оқылды. Жазбаша бөлу, бірдей нөлді қысқарту, бастапқы бөлгішпен тексеру және бөліндінің цифр/соңғы нөл саны сақталды.',
 'Жаңа сандар мен дербес қазақша шарттар жазылды. Қалдықтың қысқарған және бастапқы өлшемі, толымсыз бөлінді мен толық қорап, қатаң0≤r<dшегі бөлек көрсетілді.',
 'Қате мысалдарда жалған теңдік әдейі нұсқа ретінде берілді. Жетекші цифрдың1–9толықдомені, барлық ықтимал қалдық және бөлгіш өзгергендегі қалдық жаңа деректермен қайта есептелді.25source25жаңа мағына дегенді білдірмейді.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic5.4 written division, cancellation, Euclidean remainder, inverse or staged equal-price edition. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 if(spec.id==='ecb4ee9273cb8336')row.adaptationChanges.push('Бастапқы ресми түсіндірмеде3780:70қысқартуаяқталмағанымендұрысделінген, бірақ54≠540. Жаңа шешімде барлық қате қысқарту бөліндіні өзгертетіні нақты түзетілді; rawөзгертілгенжоқ.');
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_integer_written_division_cancellation_Euclidean_remainder_scaling_and_complete_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-5-4'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual5.4 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All25 remaining saved grade-4 nonvisual topic5.4 written division, equal cancellation and scaled Euclidean remainder domains; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-written-division-wave33.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {ZEROOPS_SPECS} from './grade4-zeroops-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-zeroops-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(ZEROOPS_SPECS.map(s=>s.id)).size,ZEROOPS_SPECS.length);const editions=[];
for(const spec of ZEROOPS_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-zeroops-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-5-2',`Missing canonical5.2 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-zeroops-${kind}`,skillFamily:kind,grade:4,topic:'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық23 қалған сақталған шарт, кілт, толық шешім және нұсқалар жеке оқылды. Екі санның нөлдерін бірдей қысқарту, белгісіз көбейткіш/бөлінгіш және нөлді қате қысқартуды талдау дағдылары сақталды.',
 'Жаңа деректер мен дербес қазақша шарттар, толық шешімдер жазылды. Көбейткіштердің бастапқы нөлдері мен нөлсіз коэффициенттер көбейтіндісіндегі қосымша0/1/2/3нөл жеке есептелді; цифр саны мен соңғы нөл саны шатастырылмады.',
 'Бөлінді аралығын бағалау, бірдей үш бөлінді мен10есе артық біреуін ажырату және қатаң екітаңбалы шарт нақты сақталды. Дұрыс теңдікті табу сұрағындағы жалған нұсқалар әдейі берілген. Сандық нұсқалар жаңа мағыналар саны емес.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic5.2 nonvisual trailing-zero arithmetic, inverse relations, estimates or deliberate-error analysis edition. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_native_integer_zero_cancellation_coefficient_factor_counts_inverse_and_interval_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-5-2'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual5.2 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All23 remaining saved grade-4 nonvisual topic5.2 trailing-zero/cancellation/inverse/interval sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-zeroops-wave31.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

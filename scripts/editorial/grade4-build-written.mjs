import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {WRITTEN_SPECS} from './grade4-written-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-written-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(WRITTEN_SPECS.map(s=>s.id)).size,WRITTEN_SPECS.length);const editions=[];
for(const spec of WRITTEN_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-written-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-2-2',`Missing canonical2.2 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-written-${kind}`,skillFamily:kind,grade:4,topic:/price|cost|packing|bus|chain/.test(kind)?'word':/reversal|weekday|leading/.test(kind)?'logic':'arith',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық22 сақталған шарт, кілт, толық шешім және нұсқалар жеке оқылды. Алғашқы толымсыз бөлінгіш, бөлінді разрядтары, нөлді сақтау және қалдық шектері ажыратылды.',
 'Жаңа сандармен дербес қазақша шарт пен толық шешімдер жасалды. Бұрышпен бөлудің әр қадамы және бағанмен көбейтудегі тасымалдар көрсетілді; бірлік бағалар мен кері амалдар дәл тексерілді.',
 'Ішкі нөл әдейі түсірілген қате теңдік ашық белгіленді. Тасымалдау рейсінің ең азы жоғары бүтінге алынады. Бес таңбалы жасырын бірінші цифрда қалдық болуы мүмкін екені айтылды, жетекші нөл тыйым салынған. Кері цифр есебі 4-ке көбейтуден 9-ға көбейтуге өзгертілді, төрт таңба, кері рет және тасымал дағдылары сақталған. Сандық нұсқалар жеке мағына саны емес.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic2.2 written multiply/divide/remainder/reasoning edition. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review',...(kind==='missing-quotient-zero-error'?{intentionalIncorrectExample:true}:{})};
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_long_division_column_carry_remainder_leading_digit_reversal_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-2-2'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual2.2 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All22 remaining saved grade-4 nonvisual topic2.2 written-arithmetic sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-written-wave21.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

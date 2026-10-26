import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {POWERREM_SPECS} from './grade4-powerrem-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-powerrem-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(POWERREM_SPECS.map(s=>s.id)).size,POWERREM_SPECS.length);const editions=[];
for(const spec of POWERREM_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-powerrem-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-2-5',`Missing canonical2.5 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-powerrem-${kind}`,skillFamily:kind,grade:4,topic:/tenge|boxes|shelves|pack|meters|centimeters/.test(kind)?'word':'arith',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық31 қалған сақталған шарт, кілт, толық шешім және нұсқалар жеке оқылды. 10, 100, 1 000 қалдықтары, толымсыз бөлінді, ішкі/соңғы нөлдер және қалдықтың алдындағы нөлдер ажыратылды.',
 'Жаңа сандар, есімдер мен дербес қазақша шарттар және толық шешімдер жазылды. Бөлінді · бөлгіш + қалдық теңдігі қалдық шегімен бірге тексерілді. Толық пакет саны, артық қалғаны, қажетті сөренің ең азы мен шамалар айырмасы жеке сұралды.',
 'Қате мысалда нөлдің әдейі түсірілгені ашық көрсетілді. Белгісіз соңғы цифрдың барлық он мәні тексерілді. Бөліндісі қалдыққа тең сан есебі үш таңбалы/100 орнына төрт таңбалы/1 000 нұсқасымен берілді; жетекші нөл тыйымы мен бір таңбалы бөлінді дағдысы сақталады. Сандық нұсқалар жеке жаңа мағына саны емес.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic2.5 power-of-ten Euclidean-remainder/quotient/unit edition. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review',...(kind==='wrong-zero-equality'?{intentionalIncorrectExample:true}:{})};
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_decimal_power_euclidean_remainder_full_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-2-5'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual2.5 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All31 remaining saved grade-4 nonvisual topic2.5 decimal-power remainder/quotient sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-powerrem-wave24.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

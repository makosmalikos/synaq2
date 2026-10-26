import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {DIVISIBILITY_SPECS} from './grade4-divisibility-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-divisibility-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(DIVISIBILITY_SPECS.map(s=>s.id)).size,DIVISIBILITY_SPECS.length);const editions=[];
for(const spec of DIVISIBILITY_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-divisibility-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-2-3',`Missing canonical2.3 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-divisibility-${kind}`,skillFamily:kind,grade:4,topic:/remainder|wildcard|distinct|odd-sum/.test(kind)?'logic':'arith',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық38 сақталған шарт, кілт, толық шешім және барлық нұсқалар жеке оқылды. Соңғы цифр, жұптық, ашық және тұйық аралық, цифрлардың әртүрлілігі және екі бөлінгіштік шартының қиылысуы сақталды.',
 'Шарттар мен толық шешімдер қазақша дербес жазылды. Мүмкін жерде сандар, шекаралар, цифр жиыны мен кейіпкерлер өзгертілді. 2, 5, 10 белгілері мен тақ сан анықтамасы математикалық инвариант ретінде сақталады; олар жаңа ашылым немесе бөлек мағына саны деп саналмайды.',
 'Нөл бар цифрлардан сан құрастырғанда жетекші нөл тыйымы ашық көрсетілді. Жаңа ең үлкен/ең кіші сан есептерінде рұқсат етілген цифр жиыны және қажетті шекаралар толық берілген. Факториалдық көбейтінді25-тен кіші шекте сақталып, 5 көбейткішін санау дағдысы өзгермеді. Сандық нұсқалар жеке жаңа мағына емес.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic2.3 divisibility/parity/digit-count edition. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_last_digit_parity_distinct_digit_remainder_interval_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-2-3'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual2.3 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All38 remaining saved grade-4 nonvisual topic2.3 divisibility/parity sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-divisibility-wave22.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

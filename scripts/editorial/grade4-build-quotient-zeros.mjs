import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {QUOTIENT_ZEROS_SPECS} from './grade4-quotient-zeros-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-quotient-zeros-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(QUOTIENT_ZEROS_SPECS.map(s=>s.id)).size,QUOTIENT_ZEROS_SPECS.length);const editions=[];
for(const spec of QUOTIENT_ZEROS_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-quotient-zeros-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-5-8',`Missing canonical5.8 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-quotient-zeros-${kind}`,skillFamily:kind,grade:4,topic:'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық29 қалған сақталған шарт, кілт, толық ресми шешім және барлық нұсқа жеке оқылды. Нөлдердің ішкі/соңғы/екі соңғы/кезектескен разрядтары әр дерекке сай сақталды.',
 'Бірінші жеткілікті сол жақ бөлік, бөлмей цифр санын анықтау, нөлді түсіруді кері қалпына келтіру, екітаңбалы бөлгіш цифрларының ауысуы, бірлік баға мен өзгермейтін жалпы мөлшер жеке жазылды.',
 'Төрт/бес таңбалы бөлінгіш және ондықтары0үштаңбалыбөлінді толықдомены санақ/минимум/максимум үшін тексерілді. Барлық сан мен жаңа қазақша шарт дербес,29source29жаңа мағына емес.'
 ],relationToSource:'One individually read saved grade-4 nonvisual topic5.8 quotient zero-place edition with complete inverse/digit domains and staged applications; numeric variants are not unique meanings. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_integer_decimal_quotient_zero_place_trace_complete_digit_domains_and_inverses',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-5-8'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual5.8 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All29 remaining saved grade-4 nonvisual topic5.8 quotient zero positions, prefixes, complete inverse/digit domains and staged applications; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-quotient-zeros-wave37.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

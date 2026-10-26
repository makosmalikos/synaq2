import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {PRODUCT_SPECS} from './grade4-product-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-product-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(PRODUCT_SPECS.map(s=>s.id)).size,PRODUCT_SPECS.length);const editions=[];
for(const spec of PRODUCT_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-product-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-5-1',`Missing canonical5.1 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-product-${kind}`,skillFamily:kind,grade:4,topic:'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық32 қалған сақталған шарт, кілт, толық шешім және нұсқалар жеке оқылды. Көбейтіндіге көбейту/бөлу, терімділік, кезекті бөлу және жақша әсері жеке ажыратылды.',
 'Жаңа деректер мен дербес қазақша шарттар, толық тура/кері қадамдар жазылды. 4×25,8×125,2×50сияқты нақты ыңғайлы жұптар мен дөңгелек санға апаратын жіктеу педагогикалық тұрақтылар ретінде сақталды.',
 'Айнымалылардың оң натурал облысы мен қалдықсыз бөлінуі ашық берілді. Барлық нұсқаның мәні дәл рационал арифметикамен тексерілді; дұрыс теңдікті табу сұрағындағы жалған жазулар әдейі қате нұсқа ретінде қалдырылды. Сандық үлгілер жаңа мағыналар саны емес.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic5.1 nonvisual associative product/division, efficient factorization, inverse or symbolic-domain edition. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_native_BigInt_product_division_factorization_symbolic_and_inverse_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-5-1'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual5.1 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All32 remaining saved grade-4 nonvisual topic5.1 associative-product/division/factorization/inverse sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-product-wave30.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {ORAL_SPECS} from './grade4-oral-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-oral-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(ORAL_SPECS.map(s=>s.id)).size,ORAL_SPECS.length);const editions=[];
for(const spec of ORAL_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-oral-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-2-1',`Missing canonical2.1 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-oral-${kind}`,skillFamily:kind,grade:4,topic:/assignment|maximum|repdigit/.test(kind)?'logic':'arith',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық20 сақталған шарт, кілт, толық шешім және нұсқалар жеке оқылды. Қарапайым ұзын көбейтуге ауыстырмай, бастапқы ауызша тәсіл сақталды.',
 'Жаңа сандар, дербес қазақша шарт пен толық шешім жазылды. Әр разрядты қалдықсыз бөлу, нөлдік разряд, дөңгелек саннан бірді түзету, 9=10−1, үлестірімділік, амал реті және белгілі көбейтіндіні қайта қолдану нақты көрсетілді.',
 'Әдейі қате мысалда соңғы екі разрядтың ауысуы ашық белгіленген. Ең үлкен цифрлық санның редакциясы барлық бес жұп цифрдың орнына барлық төрт 3-ке бөлінетін цифрды қолданады: нөл, әртүрлі цифрлар, ең үлкен санды құру және разрядтап бөлу дағдылары сақталады. Сандық нұсқалар жаңа мағына саны емес.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic2.1 oral-method edition. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review',...(kind==='detect-swapped-place-error'?{intentionalIncorrectExample:true}:{})};
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_digitwise_division_compensation_precedence_finite_digits_assignment_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-2-1'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual2.1 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All20 remaining saved grade-4 nonvisual topic2.1 oral-method sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-oral-wave20.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

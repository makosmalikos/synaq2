import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {LONG_DIVISION_SPECS} from './grade4-long-division-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-long-division-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(LONG_DIVISION_SPECS.map(s=>s.id)).size,LONG_DIVISION_SPECS.length);const editions=[];
for(const spec of LONG_DIVISION_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-long-division-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-5-6',`Missing canonical5.6 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-long-division-${kind}`,skillFamily:kind,grade:4,topic:'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық27 қалған сақталған шарт, кілт, толық шешім және нұсқалар жеке оқылды. Екітаңбалы бөлгіш, сол жақтан ең қысқа жеткілікті толымсыз бөлінгіш, бөліндінің2/3цифры және алғашқы цифрды таңдау сақталды.',
 'Жаңа деректер мен дербес қазақша шарттар жазылды. Әр бұрышпен бөлу қадамы бөлгіш×цифр, айырма және0≤қалдық<бөлгішарқылы тексерілді. Кем таңдалған цифр қалдық бөлгіштен кіші емес болғанда түзетілді.',
 'Белгісіз бөлінгіш/бөлгіш, цифрлары ауысқан бөлгіш, толық оңdдомені, екітаңбалыбөлінді10–99, бірлік баға, жылдамдық және екі кезеңді көлік сыйымдылығы тексерілді.27source27жаңа мағына дегенді білдірмейді.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic5.6 two-digit longdivision edition or individually retained inverse, prefix, complete domain and staged application model. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));const clean=s=>String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();assert.notEqual(clean(row.statement),clean(source.statement),'Original source wording');row.calculationVerification={method:'exact_integer_longdivision_prefix_trialdigits_original_remainder_bounds_and_complete_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-5-6'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual5.6 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All27 remaining saved grade-4 nonvisual topic5.6 two-digit longdivision, trial digits, complete prefix/divisor domains and staged applications; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-long-division-wave35.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

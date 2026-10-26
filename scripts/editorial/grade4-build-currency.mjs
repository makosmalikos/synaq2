import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {CURRENCY_SPECS} from './grade4-currency-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-currency-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(CURRENCY_SPECS.map(s=>s.id)).size,CURRENCY_SPECS.length);const editions=[];
for(const spec of CURRENCY_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-currency-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-1-11',`Missing canonical1.11 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-currency-${kind}`,skillFamily:kind,grade:4,topic:/ways|configuration|equalization|counts|denomination/.test(kind)?'logic':'word',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Әр сақталған шарт, кілт, толық ресми шешім және жауап нұсқалары жеке оқылды. Бірліктердің аралас жазылуы, ең аз сан мен барлық тәсіл санының айырмасы сақталды.',
 'Жаңа сандармен дербес қазақша мәтіндер мен толық шешімдер жасалды. Монета/банкнота туралы мүшелік және минимум тапсырмаларында рұқсат етілген оқу номиналдары шартта ашық берілген; тарихи не қазіргі ақша айналымы туралы абсолют тұжырым жасалмайды.',
 'Айырбастау бағамы есептің шартты дерегі ретінде берілген, комиссия жоқтығы айқын. Минимум динамикалық есеппен, тәсіл саны ретсіз толық санақпен, екі номиналдық құрамдар бүтін сандардың толық облысымен тексерілді. Сандық нұсқалар бөлек жаңа мағына деп саналмайды.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic1.11 currency/coin-count edition. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_cent_normalization_minimal_money_DP_complete_integer_counts',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-1-11'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual1.11 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All40 remaining saved grade-4 nonvisual topic1.11 currency and coin-reasoning sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-currency-wave18.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

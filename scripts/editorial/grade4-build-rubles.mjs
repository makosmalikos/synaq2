import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {RUBLES_SPECS} from './grade4-rubles-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-rubles-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(RUBLES_SPECS.map(s=>s.id)).size,RUBLES_SPECS.length);const editions=[];
for(const spec of RUBLES_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-rubles-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-1-12',`Missing canonical1.12 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const kind=spec.kind,row={editionId,modelId:`grade4-rubles-${kind}`,skillFamily:kind,grade:4,topic:/age|menu|ways|maximum|appliances/.test(kind)?'logic':'word',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Барлық сақталған шарттар, жауап кілттері, толық шешімдер және нұсқалар жеке оқылды. Сұралған зат саны, құн, қайтарым, уақыт пен бастапқы жас ажыратылды.',
 'Жаңа сандармен дербес қазақша мәтіндер мен толық шешімдер жазылды. Апта, жыл-ай, тәулік, сағат және рубльдің негіздері 7/12/24/60/100 болып сақталып, қарыз алу және тасымалдау талаптары айқын тексерілді.',
 'Мәзірлер мен техника жиындары толық Cartesian/subset санағымен, екі ақша түрі мен жас бүтін сандар облысымен, қалған ақшаны қалдықсыз жұмсау барлық жиынмен тексерілді. Күн ауысуы, қарыз алғаннан кейін ірі бірліктің нөлге айналуы және дәл қалған сома сақталды. Сандық нұсқалар жеке жаңа мағына деп саналмайды.'
 ],relationToSource:'One source-specific saved grade-4 nonvisual topic1.12 ruble/time/price/menu/reasoning edition. Source variants are coverage, not semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_mixed_radix_price_menu_subset_age_and_denominations_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-1-12'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual1.12 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All39 remaining saved grade-4 nonvisual topic1.12 ruble/time/price/menu/reasoning sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-rubles-wave19.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));

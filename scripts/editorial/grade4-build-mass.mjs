import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {MASS_SPECS} from './grade4-mass-specs.mjs';
import {renderEdition,verifyEdition} from './grade4-mass-models.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const inventory=read('problems/editorial/batches/grade4-inventory.json').records,records=new Map(inventory.map(r=>[r.sourceId,r]));
const coverage=read('problems/editorial/source-coverage.json'),verified=new Map(coverage.records.filter(r=>r.verifiedEditions?.length).map(r=>[`${r.sourceFile}:${r.sourceId}`,r.verifiedEditions]));
assert.equal(new Set(MASS_SPECS.map(s=>s.id)).size,MASS_SPECS.length);const editions=[];
for(const spec of MASS_SPECS){
 const ref=records.get(spec.id),editionId=`grade4-mass-${spec.id}`;assert(ref&&ref.sourceTopic==='4-math-1-6',`Missing canonical1.6 reference ${spec.id}`);
 if((verified.get(`${ref.sourceFile}:${spec.id}`)||[]).some(id=>id!==editionId))continue;
 const capture=read(ref.sourceFile),source=capture.questions.find(q=>q.id===spec.id);assert(capture.status==='captured'&&source.checked&&source.solution&&source.sourceAnswer&&!source.images?.length&&!source.svg?.length&&!source.statement.includes('[Image:'));
 const logical=['equal-basket-total','two-pan-unmeasurable','minimum-one-pan-weights','lighter-token-weighings','unlabelled-equal-triple-partitions','equal-baskets-companion'].includes(spec.kind);
 const row={editionId,modelId:`grade4-mass-${spec.kind}`,skillFamily:spec.kind.startsWith('three-pair-')?'three-pair-masses':spec.kind,grade:4,topic:logical?'logic':['three-pack-ratio-offset','two-equal-one-multiple','three-pair-package-masses','three-pair-fruit-masses','two-mixed-pair-total'].includes(spec.kind)?'eq':'num',difficulty:ref.level===1?'basic':ref.level===3?'hard':'medium',minimumPlan:'pro',params:structuredClone(spec.params),sourceRefs:[{sourceFile:ref.sourceFile,sourceId:spec.id}],adaptationChanges:[
 'Әр бастапқы шарт, нұсқалар, жауап және толық ресми шешім жеке оқылды. Массаның аралас бірліктері, нөлдік орындар, қатаң теңсіздік, разряд тасымалы және мөлшерлер арасындағы байланыс сақталды.',
 'Жаңа деректер мен өздігінен түсінікті қазақша тұжырым жазылды. Дәріні қабылдау сюжеті металл үлгілерін дайындаумен алмастырылды; тең үлестер мен өнімділік шарттары ашық берілді.',
 'Бөлінбейтін жүктер үшін толық тең топтастыру, екі табақты таразы үшін −1/0/1 толық іздеу, ең аз өлшеу үшін ақпараттық төменгі шек пен нақты құрылым тексерілді. Қайталанатын сандық нұсқалар жаңа мағына ретінде есептелмейді.'
 ],relationToSource:'One source-specific saved grade-4 mass edition; complete source-occurrence coverage does not imply semantic uniqueness.',editorialStatus:'draft',reviewStatus:'awaiting_independent_review'};
 Object.assign(row,renderEdition(row));row.calculationVerification={method:'exact_integer_mass_units_and_complete_finite_partition_weighing_domains',...verifyEdition(row)};editions.push(row);
}
const expected=inventory.filter(r=>r.sourceTopic==='4-math-1-6'&&!(verified.get(`${r.sourceFile}:${r.sourceId}`)||[]).length&&!coverage.records.find(c=>c.sourceFile===r.sourceFile&&c.sourceId===r.sourceId)?.draftEditions?.length);
assert(expected.every(ref=>editions.some(e=>e.sourceRefs[0].sourceId===ref.sourceId)),'All remaining nonvisual1.6 references must be covered');
const summary={editions:editions.length,models:new Set(editions.map(r=>r.modelId)).size,skillFamilies:new Set(editions.map(r=>r.skillFamily)).size,sourceOccurrencesReferenced:editions.length,independentlyReviewed:0};
const batch={schemaVersion:1,status:'draft_awaiting_independent_review',scope:'All30 remaining saved grade-4 nonvisual topic1.6 mass/unit/weighing sources; no new source collection.',summary,editions};
const target=path.join(root,'problems/editorial/batches/grade4-mass-wave13.json'),text=JSON.stringify(batch,null,2)+'\n';if(process.argv.includes('--write'))fs.writeFileSync(target,text);else assert.equal(fs.readFileSync(target,'utf8'),text);
console.log(JSON.stringify({...summary,checks:'passed',reviewStatus:'awaiting_independent_review'}));
